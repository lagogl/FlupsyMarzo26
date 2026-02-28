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

    // ── 2. Leggi ciclo attivo sorgente ──────────────────────────────────────
    const [sourceCycle] = await tx
      .select()
      .from(cycles)
      .where(eq(cycles.id, sourceBasket.currentCycleId))
      .limit(1);

    if (!sourceCycle || sourceCycle.state === 'closed') {
      throw new Error('Il ciclo della cesta sorgente non è attivo');
    }

    // ── 3. Leggi ultima operazione utile (animalsPerKg, sizeId, mortalityRate, sgrId) ──
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

    if (totalTransferred > sourceAnimalCount) {
      throw new Error(
        `Impossibile trasferire ${totalTransferred.toLocaleString('it-IT')} animali: la cesta ne ha solo ${sourceAnimalCount.toLocaleString('it-IT')}`
      );
    }

    const lotId = sourceCycle.lotId;

    // ── 4. Costruisci testo note bidirezionale ──────────────────────────────
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
    const sizeLabel = sizeId ? `Taglia: dimensione id=${sizeId}` : '';

    const destListForSource = destBasketDetails
      .map(d => `cesta #${d.physicalNumber} (${d.flupsyName}): ${d.animalCount.toLocaleString('it-IT')} animali`)
      .join(', ');

    const sourceNotesText =
      `Trasferimento ${mode === 'total' ? 'totale' : 'parziale'} del ${dateFormatted} → ${destListForSource} | ` +
      `Tot. animali ceduti: ${totalTransferred.toLocaleString('it-IT')} | ${sizeLabel}`;

    const [sourcePhysical] = await tx.select({ physicalNumber: baskets.physicalNumber, flupsyId: baskets.flupsyId })
      .from(baskets).where(eq(baskets.id, sourceBasketId)).limit(1);
    const sourceFlupsyResult = await tx.execute(`SELECT name FROM flupsys WHERE id = ${sourcePhysical.flupsyId} LIMIT 1`);
    const sourceFlupsyName = (sourceFlupsyResult.rows[0] as any)?.name ?? `Flupsy ${sourcePhysical.flupsyId}`;

    // ── 5. Registra operazione "trasferimento" sulla cesta sorgente ─────────
    const sourceTotalWeight = animalsPerKg && animalsPerKg > 0
      ? Math.round((totalTransferred * 1000000) / animalsPerKg)
      : (lastOp.total_weight ?? 0);

    const [sourceOp] = await tx.insert(operations).values({
      type: 'trasferimento',
      date,
      basketId: sourceBasketId,
      cycleId: sourceBasket.currentCycleId,
      lotId,
      animalCount: totalTransferred,
      totalWeight: sourceTotalWeight,
      animalsPerKg: animalsPerKg ?? null,
      averageWeight: lastOp.average_weight ?? null,
      sizeId: sizeId ?? null,
      mortalityRate: mortalityRate ?? null,
      sgrId: sgrId ?? null,
      notes: sourceNotesText,
      source: 'desktop_manager',
    } as any).returning();

    await LotAutoStatsService.onOperationCreated(sourceOp);

    // ── 6. Se trasferimento totale: chiudi ciclo + libera cesta sorgente ────
    if (mode === 'total') {
      await tx.update(cycles)
        .set({ state: 'closed', endDate: date })
        .where(eq(cycles.id, sourceBasket.currentCycleId));

      await tx.update(baskets)
        .set({ state: 'available', currentCycleId: null, cycleCode: null })
        .where(eq(baskets.id, sourceBasketId));
    }

    // ── 7. Registra transfer_out nel lot_ledger ─────────────────────────────
    await tx.insert(lotLedger).values({
      date,
      lotId: lotId!,
      type: 'transfer_out',
      quantity: totalTransferred.toString(),
      sourceCycleId: sourceBasket.currentCycleId,
      destCycleId: null,
      selectionId: null,
      operationId: sourceOp.id,
      basketId: sourceBasketId,
      allocationMethod: 'measured',
      allocationBasis: {
        source: 'basket_transfer',
        mode,
        totalTransferred,
        destinations: destBasketDetails.map(d => ({ basketId: d.basketId, animalCount: d.animalCount }))
      },
      idempotencyKey: `transfer_out_${sourceOp.id}_${lotId}_${sourceBasketId}`,
      notes: `Trasferimento ${mode} dalla cesta #${sourcePhysical.physicalNumber} (${sourceFlupsyName})`,
    } as any);

    // ── 8. Per ogni cesta destinazione: crea ciclo + prima-attivazione + lot_ledger ──
    const destinationOperationIds: number[] = [];

    for (const dest of destBasketDetails) {
      // Verifica disponibilità cesta destinazione
      const [destBasket] = await tx.select()
        .from(baskets)
        .where(eq(baskets.id, dest.basketId))
        .limit(1);

      if (!destBasket || destBasket.state !== 'available') {
        throw new Error(`La cesta #${dest.physicalNumber} non è disponibile per il trasferimento`);
      }

      // Calcola peso per questa cesta
      const destWeight = animalsPerKg && animalsPerKg > 0
        ? Math.round((dest.animalCount * 1000000) / animalsPerKg)
        : Math.round((dest.animalCount / totalTransferred) * sourceTotalWeight);

      // Note cesta destinazione
      const destNotes =
        `Trasferimento da cesta #${sourcePhysical.physicalNumber} (${sourceFlupsyName}) del ${dateFormatted} | ` +
        `Ricevuti: ${dest.animalCount.toLocaleString('it-IT')} animali su ${totalTransferred.toLocaleString('it-IT')} totali trasferiti`;

      // Crea nuovo ciclo
      const [newCycle] = await tx.insert(cycles).values({
        basketId: dest.basketId,
        lotId: lotId!,
        startDate: date,
        state: 'active',
        endDate: null,
      } as any).returning();

      // Genera cycle code
      const cycleCode = generateCycleCode(dest.physicalNumber, destBasket.flupsyId, date);

      // Aggiorna stato cesta destinazione
      await tx.update(baskets)
        .set({ state: 'active', currentCycleId: newCycle.id, cycleCode })
        .where(eq(baskets.id, dest.basketId));

      // Crea prima-attivazione sulla cesta destinazione
      const [destOp] = await tx.insert(operations).values({
        type: 'prima-attivazione',
        date,
        basketId: dest.basketId,
        cycleId: newCycle.id,
        lotId: lotId!,
        animalCount: dest.animalCount,
        totalWeight: destWeight,
        animalsPerKg: animalsPerKg ?? null,
        averageWeight: lastOp.average_weight ?? null,
        sizeId: sizeId ?? null,
        mortalityRate: mortalityRate ?? null,
        sgrId: sgrId ?? null,
        notes: destNotes,
        source: 'desktop_manager',
      } as any).returning();

      await LotAutoStatsService.onOperationCreated(destOp);
      destinationOperationIds.push(destOp.id);

      // Registra transfer_in nel lot_ledger
      await tx.insert(lotLedger).values({
        date,
        lotId: lotId!,
        type: 'transfer_in',
        quantity: dest.animalCount.toString(),
        sourceCycleId: sourceBasket.currentCycleId,
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

    // ── 9. Invalida cache e notifica WebSocket ─────────────────────────────
    invalidateAllCaches();
    broadcastMessage('operation_created', {
      type: 'trasferimento',
      sourceBasketId,
      destinationBasketIds: destinations.map(d => d.basketId),
      message: `Trasferimento completato dalla cesta #${sourcePhysical.physicalNumber}`,
    });

    return {
      success: true,
      sourceOperationId: sourceOp.id,
      destinationOperationIds,
      message: `Trasferimento completato: ${totalTransferred.toLocaleString('it-IT')} animali trasferiti su ${destinations.length} ceste`,
    };
  });
}

export { balancedRound };
