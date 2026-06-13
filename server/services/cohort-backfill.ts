/**
 * BACKFILL COORTI — Fase 3 "Coorti di mescolamento".
 *
 * Ricostruisce le coorti scorrendo le vagliature completate in ordine cronologico,
 * applicando la stessa logica del completamento live (selection-controller-fixed.ts):
 *  - una vagliatura che avanza un'unica coorte esistente senza nuovi lotti → trascina avanti;
 *  - un mescolamento reale (lotti puri diversi, coorti diverse, coorte + lotto esterno) → nuova coorte;
 *  - un lotto puro mai mescolato → nessuna coorte.
 *
 * IDEMPOTENTE: azzera prima coorti e collegamenti, poi ricostruisce da zero. Eseguibile più volte
 * senza duplicare. La composizione congelata di ogni nuova coorte deriva dalla distribuzione
 * effettiva registrata in basket_lot_composition (verità contata in destinazione).
 *
 * PERFORMANCE: tutti i dati vengono pre-caricati in poche query bulk, l'algoritmo gira in memoria
 * e le scritture sono batch (evita centinaia di round-trip sul DB remoto).
 */
import { db } from "../db";
import { sql } from "drizzle-orm";
import { cohorts, cohortComposition } from "../../shared/schema";

export interface CohortBackfillResult {
  selectionsProcessed: number;
  cohortsCreated: number;
  cohortsCarriedForward: number;
  cyclesTagged: number;
  pureSelections: number;
}

interface LotEntry {
  lotId: number;
  animals: number;
}

export async function backfillCohorts(): Promise<CohortBackfillResult> {
  // ====== 1. PRE-CARICAMENTO BULK ======
  const selRes = await db.execute(sql`
    SELECT id, selection_number, date
    FROM selections
    WHERE status = 'completed'
    ORDER BY date ASC, selection_number ASC, id ASC
  `);
  const selectionsList = selRes.rows as any[];

  // Composizione destinazione per lotto (verità contata registrata al completamento)
  const destCompRes = await db.execute(sql`
    SELECT source_selection_id AS sid, lot_id, SUM(animal_count)::bigint AS animals
    FROM basket_lot_composition
    WHERE source_selection_id IS NOT NULL
    GROUP BY source_selection_id, lot_id
  `);
  const destCompBySel = new Map<number, LotEntry[]>();
  for (const r of destCompRes.rows as any[]) {
    const sid = Number(r.sid);
    const animals = Number(r.animals) || 0;
    if (animals <= 0 || r.lot_id == null) continue;
    if (!destCompBySel.has(sid)) destCompBySel.set(sid, []);
    destCompBySel.get(sid)!.push({ lotId: Number(r.lot_id), animals });
  }

  // Fallback per vagliature legacy senza basket_lot_composition: lotti origine
  const fbRes = await db.execute(sql`
    SELECT ssb.selection_id AS sid, COALESCE(ssb.lot_id, c.lot_id) AS lot_id, SUM(ssb.animal_count)::bigint AS animals
    FROM selection_source_baskets ssb
    LEFT JOIN cycles c ON c.id = ssb.cycle_id
    GROUP BY ssb.selection_id, COALESCE(ssb.lot_id, c.lot_id)
  `);
  const fallbackBySel = new Map<number, LotEntry[]>();
  for (const r of fbRes.rows as any[]) {
    const sid = Number(r.sid);
    const animals = Number(r.animals) || 0;
    if (animals <= 0 || r.lot_id == null) continue;
    if (!fallbackBySel.has(sid)) fallbackBySel.set(sid, []);
    fallbackBySel.get(sid)!.push({ lotId: Number(r.lot_id), animals });
  }

  // Cicli origine per selezione (con flag origini "pure" = senza ciclo)
  const srcRes = await db.execute(sql`
    SELECT selection_id AS sid, cycle_id
    FROM selection_source_baskets
  `);
  const srcCyclesBySel = new Map<number, { ids: number[]; hasNull: boolean }>();
  for (const r of srcRes.rows as any[]) {
    const sid = Number(r.sid);
    if (!srcCyclesBySel.has(sid)) srcCyclesBySel.set(sid, { ids: [], hasNull: false });
    const entry = srcCyclesBySel.get(sid)!;
    if (r.cycle_id == null) entry.hasNull = true;
    else if (!entry.ids.includes(Number(r.cycle_id))) entry.ids.push(Number(r.cycle_id));
  }

  // Cicli destinazione per selezione (solo non-null)
  const dstRes = await db.execute(sql`
    SELECT selection_id AS sid, cycle_id
    FROM selection_destination_baskets
    WHERE cycle_id IS NOT NULL
  `);
  const destCyclesBySel = new Map<number, number[]>();
  for (const r of dstRes.rows as any[]) {
    const sid = Number(r.sid);
    if (!destCyclesBySel.has(sid)) destCyclesBySel.set(sid, []);
    destCyclesBySel.get(sid)!.push(Number(r.cycle_id));
  }

  // ====== 2. ALGORITMO IN MEMORIA ======
  const cohortByCycle = new Map<number, number>(); // cycleId -> indice coorte temporaneo
  const cohortsToCreate: Array<{
    code: string;
    sourceSelectionId: number;
    mixDate: string;
    initialAnimalCount: number;
    notes: string;
    composition: Array<{ lotId: number; animals: number; percentage: number }>;
  }> = [];
  const cycleTag = new Map<number, number>(); // cycleId -> indice coorte temporaneo (last-wins)

  let cohortsCreated = 0;
  let cohortsCarriedForward = 0;
  let pureSelections = 0;
  let nextTempIdx = 0;

  for (const sel of selectionsList) {
    const selId = Number(sel.id);

    let destComp = destCompBySel.get(selId) || [];
    if (destComp.length === 0) destComp = fallbackBySel.get(selId) || [];

    const isMixed = destComp.length > 1;
    const totalDest = destComp.reduce((a, b) => a + b.animals, 0);

    const src = srcCyclesBySel.get(selId) || { ids: [], hasNull: false };
    const sourceCohortIds = new Set<number>();
    let hasPureSource = src.hasNull || src.ids.length === 0;
    for (const cid of src.ids) {
      const ch = cohortByCycle.get(cid);
      if (ch != null) sourceCohortIds.add(ch);
      else hasPureSource = true;
    }

    let target: number | null = null;

    if (sourceCohortIds.size === 1 && !hasPureSource) {
      // Avanzamento coorte esistente
      target = Array.from(sourceCohortIds)[0];
      cohortsCarriedForward++;
    } else if ((sourceCohortIds.size >= 1 || isMixed) && totalDest > 0) {
      // Nuova coorte (mescolamento reale)
      target = nextTempIdx++;
      cohortsToCreate.push({
        code: `COORTE #${sel.selection_number} (${String(sel.date)})`,
        sourceSelectionId: selId,
        mixDate: String(sel.date),
        initialAnimalCount: totalDest,
        notes:
          sourceCohortIds.size > 0
            ? `Backfill: mescolamento vagliatura #${sel.selection_number}. Fonde ${sourceCohortIds.size} coorte/i precedente/i.`
            : `Backfill: mescolamento vagliatura #${sel.selection_number} di ${destComp.length} lotti.`,
        composition: destComp.map((dc) => ({
          lotId: dc.lotId,
          animals: dc.animals,
          percentage: totalDest > 0 ? dc.animals / totalDest : 0,
        })),
      });
      cohortsCreated++;
    } else {
      pureSelections++;
    }

    if (target != null) {
      for (const cyc of destCyclesBySel.get(selId) || []) {
        cohortByCycle.set(cyc, target);
        cycleTag.set(cyc, target);
      }
    }
  }

  // ====== 3. SCRITTURE BATCH (transazione) ======
  await db.transaction(async (tx) => {
    // Reset idempotente
    await tx.execute(sql`UPDATE cycles SET cohort_id = NULL WHERE cohort_id IS NOT NULL`);
    await tx.execute(sql`DELETE FROM cohort_composition`);
    await tx.execute(sql`DELETE FROM cohorts`);

    if (cohortsToCreate.length === 0) return;

    // Inserimento coorti (batch). L'ordine dei returning rispetta l'ordine dei values → tempIdx = indice.
    const inserted = await tx
      .insert(cohorts)
      .values(
        cohortsToCreate.map((c) => ({
          code: c.code,
          sourceSelectionId: c.sourceSelectionId,
          mixDate: c.mixDate,
          initialAnimalCount: c.initialAnimalCount,
          status: "active" as const,
          notes: c.notes,
        }))
      )
      .returning({ id: cohorts.id });
    const tempToReal = inserted.map((r) => r.id); // tempIdx -> id reale

    // Composizione (batch)
    const compRows: Array<{ cohortId: number; lotId: number; animalCount: number; percentage: number }> = [];
    cohortsToCreate.forEach((c, idx) => {
      for (const comp of c.composition) {
        compRows.push({
          cohortId: tempToReal[idx],
          lotId: comp.lotId,
          animalCount: comp.animals,
          percentage: comp.percentage,
        });
      }
    });
    if (compRows.length > 0) {
      await tx.insert(cohortComposition).values(compRows);
    }

    // Tagging cicli (un'unica UPDATE ... FROM (VALUES ...))
    const tagValues = Array.from(cycleTag.entries()).map(
      ([cycleId, tempIdx]) => sql`(${cycleId}::int, ${tempToReal[tempIdx]}::int)`
    );
    if (tagValues.length > 0) {
      await tx.execute(sql`
        UPDATE cycles AS c
        SET cohort_id = v.cid
        FROM (VALUES ${sql.join(tagValues, sql`, `)}) AS v(id, cid)
        WHERE c.id = v.id
      `);
    }
  });

  return {
    selectionsProcessed: selectionsList.length,
    cohortsCreated,
    cohortsCarriedForward,
    cyclesTagged: cycleTag.size,
    pureSelections,
  };
}
