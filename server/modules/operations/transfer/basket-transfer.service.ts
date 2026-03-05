import { db } from '../../../db';
import { operations, cycles, baskets, lotLedger, lots } from '../../../../shared/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { invalidateAllCaches } from '../../../services/operations-lifecycle.service.js';
import { broadcastMessage } from '../../../websocket';
import { LotAutoStatsService } from '../../../services/lot-auto-stats-service.js';

export interface TransferDestination {
  basketId: number;
  animalCount: number;
}

export interface TransferRequest {
  sourceBasketId: number;
  date: string;
  mode: 'total' | 'partial';
  sourceRetention?: number;
  destinations: TransferDestination[];
}

export interface TransferResult {
  success: boolean;
  sourceOperationId: number;
  destinationOperationIds: number[];
  message: string;
}

function generateCycleCode(physicalNumber: number, flupsyId: number, date: string): string {
  const d = new Date(date);
  const yy = d.getFullYear().toString().slice(-2);
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${physicalNumber}-${flupsyId}-${yy}${mm}`;
}

function balancedRound(total: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(total / n);
  const remainder = total - base * n;
  return Array.from({ length: n }, (_, i) => (i < remainder ? base + 1 : base));
}

export async function getActiveBaskets() {
  const result = await db.execute(`
    SELECT 
      b.id,
      b.physical_number,
      b.flupsy_id,
      b.state,
      b.current_cycle_id,
      b.cycle_code,
      f.name as flupsy_name,
      c.lot_id,
      c.start_date as cycle_start_date,
      l.supplier as lot_supplier,
      l.supplier_lot_number,
      -- Ultima operazione utile
      op.animal_count,
      op.total_weight,
      op.animals_per_kg,
      op.size_id,
      op.mortality_rate,
      op.sgr_id,
      op.date as last_op_date,
      op.type as last_op_type,
      s.code as size_code,
      s.name as size_name
    FROM baskets b
    JOIN flupsys f ON f.id = b.flupsy_id
    LEFT JOIN cycles c ON c.id = b.current_cycle_id
    LEFT JOIN lots l ON l.id = c.lot_id
    LEFT JOIN LATERAL (
      SELECT animal_count, total_weight, animals_per_kg, size_id, mortality_rate, sgr_id, date, type
      FROM operations
      WHERE basket_id = b.id AND cancelled_at IS NULL
        AND type IN ('prima-attivazione','misura','peso','trasferimento')
        AND animal_count IS NOT NULL
      ORDER BY date DESC, id DESC
      LIMIT 1
    ) op ON true
    LEFT JOIN sizes s ON s.id = op.size_id
    WHERE b.state = 'active'
    ORDER BY f.name, b.physical_number
  `);
  return result.rows;
}

export async function getAvailableBaskets() {
  const result = await db.execute(`
    SELECT 
      b.id,
      b.physical_number,
      b.flupsy_id,
      b.state,
      f.name as flupsy_name
    FROM baskets b
    JOIN flupsys f ON f.id = b.flupsy_id
    WHERE b.state = 'available'
    ORDER BY f.name, b.physical_number
  `);
  return result.rows;
}

export async function executeTransfer(req: TransferRequest): Promise<TransferResult> {
  const { sourceBasketId, date, mode, destinations } = req;

  if (!destinations || destinations.length === 0) {
    throw new Error('Nessuna cesta destinazione selezionata');
  }

  const totalTransferred = destinations.reduce((s, d) => s + d.animalCount, 0);

  return await db.transaction(async (tx) => {
    // ── 1. Leggi stato attuale cesta sorgente ──────────────────────────────
    const [sourceBasket] = await tx
      .select()
      .from(baskets)
      .where(eq(baskets.id, sourceBasketId))
      .limit(1);

    if (!sourceBasket || sourceBasket.state !== 'active') {
      throw new Error('La cesta sorgente non è attiva');
    }
    if (!sourceBasket.currentCycleId) {
      throw new Error('La cesta sorgente non ha un ciclo attivo');
    }

    const oldSourceCycleId = sourceBasket.currentCycleId;

    // ── 2. Leggi ciclo attivo sorgente ──────────────────────────────────────
    const [sourceCycle] = await tx
      .select()
      .from(cycles)
      .where(eq(cycles.id, oldSourceCycleId))
      .limit(1);

    if (!sourceCycle || sourceCycle.state === 'closed') {
      throw new Error('Il ciclo della cesta sorgente non è attivo');
    }

    // ── 3. Leggi ultima operazione utile ────────────────────────────────────
    const lastOpResult = await tx.execute(`
      SELECT animal_count, total_weight, animals_per_kg, size_id, mortality_rate, sgr_id, average_weight
      FROM operations
      WHERE basket_id = ${sourceBasketId}
        AND cancelled_at IS NULL
        AND type IN ('prima-attivazione','misura','peso','trasferimento')
        AND animal_count IS NOT NULL
      ORDER BY date DESC, id DESC
      LIMIT 1
    `);
    const lastOp = lastOpResult.rows[0] as any;

    if (!lastOp) {
      throw new Error('Nessuna operazione utile trovata sulla cesta sorgente');
    }

    const animalsPerKg = lastOp.animals_per_kg;
    const sizeId = lastOp.size_id;
    const mortalityRate = lastOp.mortality_rate;
    const sgrId = lastOp.sgr_id;
    const sourceAnimalCount = lastOp.animal_count;

    // In partial mode, compute retention from request or derive it
    const sourceRetention = mode === 'partial'
      ? (req.sourceRetention ?? (sourceAnimalCount - totalTransferred))
      : 0;

    const totalAccountedFor = totalTransferred + (mode === 'partial' ? sourceRetention : 0);
    if (totalAccountedFor > sourceAnimalCount) {
      throw new Error(
        `Impossibile trasferire ${totalAccountedFor.toLocaleString('it-IT')} animali: la cesta ne ha solo ${sourceAnimalCount.toLocaleString('it-IT')}`
      );
    }
    if (mode === 'partial' && totalAccountedFor !== sourceAnimalCount) {
      throw new Error(
        `In modalità parziale la somma di tutte le quote (${totalAccountedFor.toLocaleString('it-IT')}) deve essere uguale al totale sorgente (${sourceAnimalCount.toLocaleString('it-IT')})`
      );
    }

    const lotId = sourceCycle.lotId;

    // ── 4. Raccogli dettagli ceste destinazione ─────────────────────────────
    const destBasketDetails = await Promise.all(
      destinations.map(async (d) => {
        const [b] = await tx.select({ physicalNumber: baskets.physicalNumber, flupsyId: baskets.flupsyId })
          .from(baskets).where(eq(baskets.id, d.basketId)).limit(1);
        const fResult = await tx.execute(`SELECT name FROM flupsys WHERE id = ${b.flupsyId} LIMIT 1`);
        const flupsyName = (fResult.rows[0] as any)?.name ?? `Flupsy ${b.flupsyId}`;
        return { ...d, physicalNumber: b.physicalNumber, flupsyName };
      })
    );

    const dateFormatted = new Date(date).toLocaleDateString('it-IT');

    const [sourcePhysical] = await tx.select({ physicalNumber: baskets.physicalNumber, flupsyId: baskets.flupsyId })
      .from(baskets).where(eq(baskets.id, sourceBasketId)).limit(1);
    const sourceFlupsyResult = await tx.execute(`SELECT name FROM flupsys WHERE id = ${sourcePhysical.flupsyId} LIMIT 1`);
    const sourceFlupsyName = (sourceFlupsyResult.rows[0] as any)?.name ?? `Flupsy ${sourcePhysical.flupsyId}`;

    const destListShort = destBasketDetails
      .map(d => `#${d.physicalNumber} (${d.flupsyName}): ${d.animalCount.toLocaleString('it-IT')}`)
      .join(' | ');

    const allBasketNums = destBasketDetails.map(d => `#${d.physicalNumber}`).join(', ');

    // ── 5. Operazione "trasferimento" sul vecchio ciclo sorgente ────────────
    const sourceWeightGrams = lastOp.total_weight ?? 0;
    const sourceTotalWeight = sourceWeightGrams > 0
      ? Math.round((totalTransferred / sourceAnimalCount) * sourceWeightGrams)
      : (animalsPerKg && animalsPerKg > 0 ? Math.round((totalTransferred * 1000) / animalsPerKg) : 0);

    const inheritedNotesSuffix = lastOp.notes ? ` (${lastOp.notes})` : '';

    const sourceTransferNotes = (mode === 'total'
      ? `Trasferimento totale del ${dateFormatted} → ${destListShort} | Tot. animali ceduti: ${totalTransferred.toLocaleString('it-IT')} su ${sourceAnimalCount.toLocaleString('it-IT')}`
      : `Suddivisione ciclo #${oldSourceCycleId} del ${dateFormatted}: ceduti ${totalTransferred.toLocaleString('it-IT')} animali a ceste ${allBasketNums}. Quota trattenuta: ${sourceRetention.toLocaleString('it-IT')}. Ciclo chiuso.`) + inheritedNotesSuffix;

    const [sourceOp] = await tx.insert(operations).values({
      type: 'trasferimento',
      date,
      basketId: sourceBasketId,
      cycleId: oldSourceCycleId,
      lotId,
      animalCount: totalTransferred,
      totalWeight: sourceTotalWeight,
      animalsPerKg: animalsPerKg ?? null,
      averageWeight: lastOp.average_weight ?? null,
      sizeId: sizeId ?? null,
      mortalityRate: mortalityRate ?? null,
      sgrId: sgrId ?? null,
      notes: sourceTransferNotes,
      source: 'desktop_manager',
    } as any).returning();

    await LotAutoStatsService.onOperationCreated(sourceOp);

    // ── 6. Chiudi sempre il vecchio ciclo sorgente (totale E parziale) ──────
    await tx.update(cycles)
      .set({ state: 'closed', endDate: date })
      .where(eq(cycles.id, oldSourceCycleId));

    if (mode === 'total') {
      // Modalità totale: la cesta sorgente torna libera
      await tx.update(baskets)
        .set({ state: 'available', currentCycleId: null, cycleCode: null })
        .where(eq(baskets.id, sourceBasketId));
    }

    // ── 7. Transfer_out nel lot_ledger ──────────────────────────────────────
    await tx.insert(lotLedger).values({
      date,
      lotId: lotId!,
      type: 'transfer_out',
      quantity: totalTransferred.toString(),
      sourceCycleId: oldSourceCycleId,
      destCycleId: null,
      selectionId: null,
      operationId: sourceOp.id,
      basketId: sourceBasketId,
      allocationMethod: 'measured',
      allocationBasis: {
        source: 'basket_transfer',
        mode,
        totalTransferred,
        sourceRetention: mode === 'partial' ? sourceRetention : 0,
        destinations: destBasketDetails.map(d => ({ basketId: d.basketId, animalCount: d.animalCount }))
      },
      idempotencyKey: `transfer_out_${sourceOp.id}_${lotId}_${sourceBasketId}`,
      notes: `Trasferimento ${mode} dalla cesta #${sourcePhysical.physicalNumber} (${sourceFlupsyName})`,
    } as any);

    // ── 8. Modalità parziale: nuovo ciclo sulla cesta sorgente ──────────────
    let sourceNewOpId: number | null = null;

    if (mode === 'partial') {
      const sourceRetentionWeight = sourceWeightGrams > 0
        ? Math.round((sourceRetention / sourceAnimalCount) * sourceWeightGrams)
        : (animalsPerKg && animalsPerKg > 0 ? Math.round((sourceRetention * 1000) / animalsPerKg) : 0);

      // Nuovo ciclo sulla sorgente
      const [newSourceCycle] = await tx.insert(cycles).values({
        basketId: sourceBasketId,
        lotId: lotId!,
        startDate: date,
        state: 'active',
        endDate: null,
      } as any).returning();

      const newSourceCycleCode = generateCycleCode(sourcePhysical.physicalNumber, sourcePhysical.flupsyId, date);

      await tx.update(baskets)
        .set({ state: 'active', currentCycleId: newSourceCycle.id, cycleCode: newSourceCycleCode })
        .where(eq(baskets.id, sourceBasketId));

      const sourceNewCycleNotes =
        `Nuovo ciclo da suddivisione del ${dateFormatted} (vecchio ciclo #${oldSourceCycleId}). ` +
        `Quota trattenuta: ${sourceRetention.toLocaleString('it-IT')} animali su ${sourceAnimalCount.toLocaleString('it-IT')} totali. ` +
        `Ceste coinvolte nella suddivisione: #${sourcePhysical.physicalNumber} (sorgente), ${allBasketNums}.` +
        inheritedNotesSuffix;

      const [sourceNewOp] = await tx.insert(operations).values({
        type: 'prima-attivazione',
        date,
        basketId: sourceBasketId,
        cycleId: newSourceCycle.id,
        lotId: lotId!,
        animalCount: sourceRetention,
        totalWeight: sourceRetentionWeight,
        animalsPerKg: animalsPerKg ?? null,
        averageWeight: lastOp.average_weight ?? null,
        sizeId: sizeId ?? null,
        mortalityRate: mortalityRate ?? null,
        sgrId: sgrId ?? null,
        notes: sourceNewCycleNotes,
        source: 'desktop_manager',
      } as any).returning();

      await LotAutoStatsService.onOperationCreated(sourceNewOp);
      sourceNewOpId = sourceNewOp.id;

      // Transfer_in per la quota sorgente (auto-assegnazione)
      await tx.insert(lotLedger).values({
        date,
        lotId: lotId!,
        type: 'transfer_in',
        quantity: sourceRetention.toString(),
        sourceCycleId: oldSourceCycleId,
        destCycleId: newSourceCycle.id,
        selectionId: null,
        operationId: sourceNewOp.id,
        basketId: sourceBasketId,
        allocationMethod: 'measured',
        allocationBasis: {
          source: 'basket_transfer_self',
          sourceBasketId,
          sourcePhysicalNumber: sourcePhysical.physicalNumber,
          sourceFlupsyName,
          oldCycleId: oldSourceCycleId,
        },
        idempotencyKey: `transfer_in_${sourceOp.id}_${lotId}_${sourceBasketId}_self`,
        notes: `Quota trattenuta dalla suddivisione del ${dateFormatted}: cesta #${sourcePhysical.physicalNumber} (${sourceFlupsyName})`,
      } as any);
    }

    // ── 9. Per ogni cesta destinazione: nuovo ciclo + prima-attivazione ──────
    const destinationOperationIds: number[] = [];

    for (const dest of destBasketDetails) {
      const [destBasket] = await tx.select()
        .from(baskets)
        .where(eq(baskets.id, dest.basketId))
        .limit(1);

      if (!destBasket || destBasket.state !== 'available') {
        throw new Error(`La cesta #${dest.physicalNumber} non è disponibile per il trasferimento`);
      }

      const destWeight = sourceWeightGrams > 0
        ? Math.round((dest.animalCount / sourceAnimalCount) * sourceWeightGrams)
        : (animalsPerKg && animalsPerKg > 0 ? Math.round((dest.animalCount * 1000) / animalsPerKg) : 0);
      const destAnimalsPerKg = destWeight > 0
        ? Math.round((dest.animalCount * 1000) / destWeight)
        : (animalsPerKg ?? null);

      const pctOnSource = sourceAnimalCount > 0
        ? ((dest.animalCount / sourceAnimalCount) * 100).toFixed(1)
        : '0';

      const destNotes = (mode === 'total'
        ? `Trasferimento totale da cesta #${sourcePhysical.physicalNumber} (${sourceFlupsyName}) del ${dateFormatted}. ` +
          `Ricevuti: ${dest.animalCount.toLocaleString('it-IT')} animali su ${totalTransferred.toLocaleString('it-IT')} totali trasferiti (${pctOnSource}% del totale sorgente).`
        : `Suddivisione da cesta #${sourcePhysical.physicalNumber} (${sourceFlupsyName}) del ${dateFormatted} (vecchio ciclo #${oldSourceCycleId}). ` +
          `Quota ricevuta: ${dest.animalCount.toLocaleString('it-IT')} animali = ${pctOnSource}% del totale sorgente (${sourceAnimalCount.toLocaleString('it-IT')}). ` +
          `Ceste coinvolte: #${sourcePhysical.physicalNumber} (sorgente), ${allBasketNums}.`) + inheritedNotesSuffix;

      const [newCycle] = await tx.insert(cycles).values({
        basketId: dest.basketId,
        lotId: lotId!,
        startDate: date,
        state: 'active',
        endDate: null,
      } as any).returning();

      const cycleCode = generateCycleCode(dest.physicalNumber, destBasket.flupsyId, date);

      await tx.update(baskets)
        .set({ state: 'active', currentCycleId: newCycle.id, cycleCode })
        .where(eq(baskets.id, dest.basketId));

      const [destOp] = await tx.insert(operations).values({
        type: 'prima-attivazione',
        date,
        basketId: dest.basketId,
        cycleId: newCycle.id,
        lotId: lotId!,
        animalCount: dest.animalCount,
        totalWeight: destWeight,
        animalsPerKg: destAnimalsPerKg,
        averageWeight: lastOp.average_weight ?? null,
        sizeId: sizeId ?? null,
        mortalityRate: mortalityRate ?? null,
        sgrId: sgrId ?? null,
        notes: destNotes,
        source: 'desktop_manager',
      } as any).returning();

      await LotAutoStatsService.onOperationCreated(destOp);
      destinationOperationIds.push(destOp.id);

      await tx.insert(lotLedger).values({
        date,
        lotId: lotId!,
        type: 'transfer_in',
        quantity: dest.animalCount.toString(),
        sourceCycleId: oldSourceCycleId,
        destCycleId: newCycle.id,
        selectionId: null,
        operationId: destOp.id,
        basketId: dest.basketId,
        allocationMethod: 'measured',
        allocationBasis: {
          source: 'basket_transfer',
          sourceBasketId,
          sourcePhysicalNumber: sourcePhysical.physicalNumber,
          sourceFlupsyName,
        },
        idempotencyKey: `transfer_in_${sourceOp.id}_${lotId}_${dest.basketId}`,
        notes: `Trasferimento da cesta #${sourcePhysical.physicalNumber} (${sourceFlupsyName})`,
      } as any);
    }

    // ── 10. Invalida cache e notifica WebSocket ─────────────────────────────
    invalidateAllCaches();
    broadcastMessage('operation_created', {
      type: 'trasferimento',
      sourceBasketId,
      destinationBasketIds: destinations.map(d => d.basketId),
      message: `Trasferimento completato dalla cesta #${sourcePhysical.physicalNumber}`,
    });

    const modeLabel = mode === 'total' ? 'totale' : 'parziale (con riciclo sorgente)';
    return {
      success: true,
      sourceOperationId: sourceOp.id,
      destinationOperationIds,
      message: `Trasferimento ${modeLabel} completato: ${totalTransferred.toLocaleString('it-IT')} animali distribuiti su ${destinations.length} ceste${mode === 'partial' ? `, cesta sorgente riaperta con ${sourceRetention.toLocaleString('it-IT')} animali` : ''}`,
    };
  });
}

export { balancedRound };
