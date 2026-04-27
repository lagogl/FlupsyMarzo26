import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { operations } from '@shared/schema';

export interface MisuraComputeInput {
  cycleId: number;
  liveAnimals: number;
  deadCount: number;
  excludeOperationId?: number;
}

export interface MisuraComputeResult {
  finalAnimalCount: number;
  mortalityRatePct: number;
  sampleCount: number | null;
  referenceMortalityPct: number;
  lastCount: number;
  applied: 'no-change' | 'delta-applied' | 'fallback-no-cycle';
  reason: string;
}

/**
 * Calcola animal_count per una operazione "misura" applicando la regola:
 *
 *   Se la mortalità % rilevata è ≤ alla massima mortalità storica del ciclo
 *   (prima-attivazione + misure precedenti), si presume che i morti siano
 *   gli stessi gusci già conteggiati alla prima attivazione che ora si
 *   stanno staccando: il numero animali NON viene ridotto.
 *
 *   Se la mortalità % rilevata supera la massima storica, viene applicata
 *   solo la differenza (delta) come nuova mortalità reale, scalata
 *   sull'ultimo conteggio noto.
 */
export async function computeMisuraAnimalCount(
  input: MisuraComputeInput
): Promise<MisuraComputeResult> {
  const { cycleId, liveAnimals, deadCount, excludeOperationId } = input;

  const totalSample = (liveAnimals || 0) + (deadCount || 0);
  const currentMortFraction = totalSample > 0 ? (deadCount || 0) / totalSample : 0;
  const currentMortPct = currentMortFraction * 100;

  if (!cycleId) {
    return {
      finalAnimalCount: 0,
      mortalityRatePct: currentMortPct,
      sampleCount: totalSample > 0 ? totalSample : null,
      referenceMortalityPct: 0,
      lastCount: 0,
      applied: 'fallback-no-cycle',
      reason: 'cycleId non disponibile',
    };
  }

  const priorOps = await db
    .select({
      id: operations.id,
      type: operations.type,
      animalCount: operations.animalCount,
      mortalityRate: operations.mortalityRate,
      date: operations.date,
    })
    .from(operations)
    .where(
      excludeOperationId
        ? and(
            eq(operations.cycleId, cycleId),
            sql`${operations.id} <> ${excludeOperationId}`,
            sql`${operations.cancelledAt} IS NULL`
          )
        : and(
            eq(operations.cycleId, cycleId),
            sql`${operations.cancelledAt} IS NULL`
          )
    )
    .orderBy(sql`${operations.date} ASC`, sql`${operations.id} ASC`);

  let referenceMortPct = 0;
  let lastCount = 0;
  for (const op of priorOps) {
    if (op.type === 'prima-attivazione' || op.type === 'prima-attivazione-da-vagliatura') {
      lastCount = op.animalCount || lastCount;
      if (op.mortalityRate != null && Number(op.mortalityRate) > referenceMortPct) {
        referenceMortPct = Number(op.mortalityRate);
      }
    } else if (op.type === 'misura') {
      lastCount = op.animalCount || lastCount;
      if (op.mortalityRate != null && Number(op.mortalityRate) > referenceMortPct) {
        referenceMortPct = Number(op.mortalityRate);
      }
    } else {
      if (op.animalCount != null) lastCount = op.animalCount;
    }
  }

  if (lastCount === 0) {
    return {
      finalAnimalCount: 0,
      mortalityRatePct: currentMortPct,
      sampleCount: totalSample > 0 ? totalSample : null,
      referenceMortalityPct: referenceMortPct,
      lastCount: 0,
      applied: 'fallback-no-cycle',
      reason: 'Nessuna prima-attivazione trovata nel ciclo',
    };
  }

  if (currentMortPct <= referenceMortPct + 1e-9) {
    return {
      finalAnimalCount: lastCount,
      mortalityRatePct: currentMortPct,
      sampleCount: totalSample > 0 ? totalSample : null,
      referenceMortalityPct: referenceMortPct,
      lastCount,
      applied: 'no-change',
      reason: `mortalità ${currentMortPct.toFixed(2)}% ≤ riferimento ${referenceMortPct.toFixed(2)}% → nessun nuovo morto`,
    };
  }

  const deltaFraction = (currentMortPct - referenceMortPct) / 100;
  const newDeaths = Math.round(lastCount * deltaFraction);
  const finalAnimalCount = Math.max(0, lastCount - newDeaths);

  return {
    finalAnimalCount,
    mortalityRatePct: currentMortPct,
    sampleCount: totalSample > 0 ? totalSample : null,
    referenceMortalityPct: referenceMortPct,
    lastCount,
    applied: 'delta-applied',
    reason: `mortalità ${currentMortPct.toFixed(2)}% > riferimento ${referenceMortPct.toFixed(2)}% → delta ${(deltaFraction * 100).toFixed(2)}% applicato a ${lastCount} (-${newDeaths})`,
  };
}

export interface CycleRecalcRow {
  operationId: number;
  basketId: number;
  date: string;
  type: string;
  oldAnimalCount: number | null;
  newAnimalCount: number | null;
  oldMortalityRate: number | null;
  referenceMortalityPct: number;
  changed: boolean;
  reason: string;
}

/**
 * Ricalcola TUTTI i conteggi animali delle misure di un ciclo applicando la
 * nuova regola, in ordine cronologico. Utile per backfill retroattivo.
 *
 * Non scrive nel DB: ritorna solo cosa cambierebbe. Il chiamante decide se
 * applicare gli update.
 */
export async function recomputeCycleMisure(cycleId: number): Promise<CycleRecalcRow[]> {
  const ops = await db
    .select({
      id: operations.id,
      basketId: operations.basketId,
      type: operations.type,
      date: operations.date,
      animalCount: operations.animalCount,
      mortalityRate: operations.mortalityRate,
      deadCount: operations.deadCount,
      sampleCount: operations.sampleCount,
    })
    .from(operations)
    .where(and(eq(operations.cycleId, cycleId), sql`${operations.cancelledAt} IS NULL`))
    .orderBy(sql`${operations.date} ASC`, sql`${operations.id} ASC`);

  const out: CycleRecalcRow[] = [];
  let referenceMortPct = 0;
  let lastCount = 0;

  for (const op of ops) {
    if (op.type === 'prima-attivazione' || op.type === 'prima-attivazione-da-vagliatura') {
      lastCount = op.animalCount || lastCount;
      if (op.mortalityRate != null && Number(op.mortalityRate) > referenceMortPct) {
        referenceMortPct = Number(op.mortalityRate);
      }
      out.push({
        operationId: op.id,
        basketId: op.basketId,
        date: String(op.date),
        type: op.type,
        oldAnimalCount: op.animalCount,
        newAnimalCount: op.animalCount,
        oldMortalityRate: op.mortalityRate != null ? Number(op.mortalityRate) : null,
        referenceMortalityPct: referenceMortPct,
        changed: false,
        reason: 'prima-attivazione: invariata',
      });
      continue;
    }

    if (op.type === 'misura') {
      const currentMortPct = op.mortalityRate != null ? Number(op.mortalityRate) : 0;
      let newAnimalCount: number;
      let reason: string;

      if (currentMortPct <= referenceMortPct + 1e-9) {
        newAnimalCount = lastCount;
        reason = `mortalità ${currentMortPct.toFixed(2)}% ≤ riferimento ${referenceMortPct.toFixed(2)}% → mantengo ${lastCount}`;
      } else {
        const deltaFraction = (currentMortPct - referenceMortPct) / 100;
        const newDeaths = Math.round(lastCount * deltaFraction);
        newAnimalCount = Math.max(0, lastCount - newDeaths);
        reason = `mortalità ${currentMortPct.toFixed(2)}% > riferimento ${referenceMortPct.toFixed(2)}% → delta applicato (-${newDeaths})`;
        referenceMortPct = currentMortPct;
      }

      const changed = newAnimalCount !== (op.animalCount ?? -1);
      out.push({
        operationId: op.id,
        basketId: op.basketId,
        date: String(op.date),
        type: op.type,
        oldAnimalCount: op.animalCount,
        newAnimalCount,
        oldMortalityRate: currentMortPct,
        referenceMortalityPct: referenceMortPct,
        changed,
        reason,
      });
      lastCount = newAnimalCount;
      continue;
    }

    if (op.animalCount != null) lastCount = op.animalCount;
    out.push({
      operationId: op.id,
      basketId: op.basketId,
      date: String(op.date),
      type: op.type,
      oldAnimalCount: op.animalCount,
      newAnimalCount: op.animalCount,
      oldMortalityRate: op.mortalityRate != null ? Number(op.mortalityRate) : null,
      referenceMortalityPct: referenceMortPct,
      changed: false,
      reason: `${op.type}: invariata`,
    });
  }

  return out;
}
