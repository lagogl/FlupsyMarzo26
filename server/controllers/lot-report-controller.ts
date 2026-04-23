import type { Request, Response } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Report dettagliato di un lotto:
 *  - Bilancio (pro-quota su cesti misti, usando lot_ledger)
 *  - Distribuzione attuale (cesti attivi che contengono ancora animali del lotto)
 *  - Timeline cronologica eventi
 */
export async function getLotReport(req: Request, res: Response) {
  try {
    const lotId = parseInt(req.params.lotId);
    if (!Number.isFinite(lotId)) {
      return res.status(400).json({ error: "lotId non valido" });
    }

    // 1. Info lotto
    const lotRows = await db.execute(sql`
      SELECT id, arrival_date, supplier, supplier_lot_number, animal_count,
             weight, quality, state, total_mortality, notes
      FROM lots WHERE id = ${lotId}
    `);
    const lot = (lotRows.rows as any[])[0];
    if (!lot) return res.status(404).json({ error: "Lotto non trovato" });

    // 2. Aggregazione lot_ledger (libro mastro)
    const ledgerAgg = await db.execute(sql`
      SELECT type, SUM(quantity::numeric)::bigint AS total, COUNT(*)::int AS n
      FROM lot_ledger
      WHERE lot_id = ${lotId}
      GROUP BY type
    `);
    const agg: Record<string, { total: number; n: number }> = {};
    for (const r of ledgerAgg.rows as any[]) {
      agg[r.type] = { total: Number(r.total), n: r.n };
    }

    // 3. Distribuzione ATTUALE (solo cesti attivi che contengono ancora animali del lotto)
    const distRows = await db.execute(sql`
      SELECT
        b.id AS basket_id,
        b.physical_number,
        f.id AS flupsy_id,
        f.name AS flupsy_name,
        c.id AS cycle_id,
        c.start_date,
        c.state AS cycle_state,
        blc.animal_count AS lot_animals,
        blc.percentage AS lot_pct,
        (SELECT s.code FROM operations o JOIN sizes s ON s.id = o.size_id
         WHERE o.cycle_id = c.id AND o.cancelled_at IS NULL
         ORDER BY o.date DESC, o.id DESC LIMIT 1) AS last_size_code,
        (SELECT o.animal_count FROM operations o
         WHERE o.cycle_id = c.id AND o.cancelled_at IS NULL
         AND o.type IN ('prima-attivazione','misura','peso','trasferimento','vagliatura')
         ORDER BY o.date DESC, o.id DESC LIMIT 1) AS last_total_animals,
        (SELECT o.date FROM operations o
         WHERE o.cycle_id = c.id AND o.cancelled_at IS NULL
         ORDER BY o.date DESC, o.id DESC LIMIT 1) AS last_op_date,
        (SELECT COUNT(DISTINCT lot_id) FROM basket_lot_composition
         WHERE basket_id = b.id AND cycle_id = c.id) AS lots_in_basket
      FROM basket_lot_composition blc
      JOIN baskets b ON b.id = blc.basket_id
      JOIN cycles  c ON c.id = blc.cycle_id
      JOIN flupsys f ON f.id = b.flupsy_id
      WHERE blc.lot_id = ${lotId}
        AND c.state = 'active'
      ORDER BY b.physical_number ASC
    `);

    const distribution = (distRows.rows as any[]).map(r => ({
      basketId: r.basket_id,
      physicalNumber: r.physical_number,
      flupsyId: r.flupsy_id,
      flupsyName: r.flupsy_name,
      cycleId: r.cycle_id,
      cycleStartDate: r.start_date,
      cycleState: r.cycle_state,
      lotAnimals: Number(r.lot_animals ?? 0),
      lotPercentage: Number(r.lot_pct ?? 0) * 100,
      lastSizeCode: r.last_size_code,
      lastTotalAnimals: Number(r.last_total_animals ?? 0),
      lastOpDate: r.last_op_date,
      lotsInBasket: Number(r.lots_in_basket ?? 1),
      isMixed: Number(r.lots_in_basket ?? 1) > 1,
    }));

    // Animali attivi pro-quota (oggi) — somma da composition su cicli attivi
    const activeNow = distribution.reduce((s, d) => s + d.lotAnimals, 0);
    const activeInPure = distribution.filter(d => !d.isMixed).reduce((s, d) => s + d.lotAnimals, 0);
    const activeInMixed = activeNow - activeInPure;

    // 4. Bilancio
    const initial = Number(lot.animal_count ?? 0)
      || Math.abs(agg['in']?.total ?? 0)
      || Math.abs(agg['activation']?.total ?? 0);
    const deaths = Number(agg['mortality']?.total ?? 0);
    const sales = Number(agg['sale']?.total ?? 0);
    const transferOut = Number(agg['transfer_out']?.total ?? 0);
    const transferIn = Number(agg['transfer_in']?.total ?? 0);
    // Residuo = ciò che il ledger non spiega (errori di pesatura/campionamento)
    const accounted = deaths + sales + activeNow;
    const residual = initial - accounted;

    const bilancio = {
      initial,
      deaths,
      deathsPct: initial > 0 ? (deaths / initial) * 100 : 0,
      sales,
      salesPct: initial > 0 ? (sales / initial) * 100 : 0,
      activeNow,
      activeNowPct: initial > 0 ? (activeNow / initial) * 100 : 0,
      activeInPure,
      activeInMixed,
      transferOut,
      transferIn,
      residual,
      residualPct: initial > 0 ? (residual / initial) * 100 : 0,
      survivalPct: initial > 0 ? ((sales + activeNow) / initial) * 100 : 0,
    };

    // 5. Timeline — ledger arricchito con info cesta/ciclo
    const timelineRows = await db.execute(sql`
      SELECT
        ll.id, ll.date, ll.type, ll.quantity::numeric AS quantity,
        ll.basket_id, ll.source_cycle_id, ll.dest_cycle_id,
        ll.selection_id, ll.operation_id, ll.allocation_method, ll.notes,
        b.physical_number AS basket_phys,
        f.name AS flupsy_name,
        sel.screening_number AS screening_number,
        op.type AS op_type
      FROM lot_ledger ll
      LEFT JOIN baskets b ON b.id = ll.basket_id
      LEFT JOIN flupsys f ON f.id = b.flupsy_id
      LEFT JOIN screening_operations sel ON sel.id = ll.selection_id
      LEFT JOIN operations op ON op.id = ll.operation_id
      WHERE ll.lot_id = ${lotId}
      ORDER BY ll.date ASC, ll.id ASC
    `);
    const timeline = (timelineRows.rows as any[]).map(r => ({
      id: r.id,
      date: r.date,
      type: r.type,
      quantity: Number(r.quantity),
      basketId: r.basket_id,
      basketPhysical: r.basket_phys,
      flupsyName: r.flupsy_name,
      sourceCycleId: r.source_cycle_id,
      destCycleId: r.dest_cycle_id,
      selectionId: r.selection_id,
      screeningNumber: r.screening_number,
      operationId: r.operation_id,
      opType: r.op_type,
      allocationMethod: r.allocation_method,
      notes: r.notes,
    }));

    return res.json({
      lot: {
        id: lot.id,
        arrivalDate: lot.arrival_date,
        supplier: lot.supplier,
        supplierLotNumber: lot.supplier_lot_number,
        initialAnimalCount: lot.animal_count,
        weight: lot.weight,
        quality: lot.quality,
        state: lot.state,
      },
      bilancio,
      distribution,
      timeline,
      ledgerCounts: agg,
    });
  } catch (err: any) {
    console.error('Lot report error:', err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Lista compatta dei lotti (per pagina di scelta)
 */
export async function getLotsForReport(req: Request, res: Response) {
  try {
    const rows = await db.execute(sql`
      SELECT l.id, l.arrival_date, l.supplier, l.supplier_lot_number,
             l.animal_count, l.state,
             (SELECT COUNT(DISTINCT blc.basket_id) FROM basket_lot_composition blc
              JOIN cycles c ON c.id = blc.cycle_id
              WHERE blc.lot_id = l.id AND c.state = 'active') AS active_baskets
      FROM lots l
      ORDER BY l.arrival_date DESC, l.id DESC
    `);
    return res.json({ lots: rows.rows });
  } catch (err: any) {
    console.error('Lots list for report error:', err);
    return res.status(500).json({ error: err.message });
  }
}
