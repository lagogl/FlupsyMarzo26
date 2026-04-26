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

    // 3. Distribuzione ATTUALE
    //    Include sia i cicli con basket_lot_composition (multi-lotto / vagliature)
    //    sia i cicli mono-lotto (cycles.lot_id) per i quali la composition non è stata creata.
    //    Includiamo ANCHE i cicli chiusi nella composition per calcolare gli animali
    //    "persi nel tracciamento" (vagliature successive senza propagazione del lotto).
    const distRows = await db.execute(sql`
      WITH active_lot_cycles AS (
        -- Cicli con composition esplicita per questo lotto (attivi o chiusi)
        SELECT DISTINCT blc.basket_id, blc.cycle_id,
               blc.animal_count AS comp_animals,
               blc.percentage   AS comp_pct,
               TRUE             AS has_composition
        FROM basket_lot_composition blc
        JOIN cycles c ON c.id = blc.cycle_id
        WHERE blc.lot_id = ${lotId}
        UNION
        -- Cicli mono-lotto attivi senza composition
        SELECT c.basket_id, c.id AS cycle_id,
               NULL::integer AS comp_animals,
               NULL::numeric AS comp_pct,
               FALSE         AS has_composition
        FROM cycles c
        WHERE c.lot_id = ${lotId}
          AND c.state = 'active'
          AND NOT EXISTS (
            SELECT 1 FROM basket_lot_composition blc2
            WHERE blc2.basket_id = c.basket_id
              AND blc2.cycle_id  = c.id
          )
      )
      SELECT
        alc.basket_id,
        b.physical_number,
        f.id   AS flupsy_id,
        f.name AS flupsy_name,
        alc.cycle_id,
        c.start_date,
        c.state AS cycle_state,
        alc.has_composition,
        alc.comp_animals AS comp_animals,
        alc.comp_pct     AS comp_pct,
        (SELECT s.code FROM operations o JOIN sizes s ON s.id = o.size_id
         WHERE o.cycle_id = alc.cycle_id AND o.cancelled_at IS NULL
         ORDER BY o.date DESC, o.id DESC LIMIT 1) AS last_size_code,
        (SELECT o.animal_count FROM operations o
         WHERE o.cycle_id = alc.cycle_id AND o.cancelled_at IS NULL
         AND o.type IN ('prima-attivazione','misura','peso','trasferimento','vagliatura')
         ORDER BY o.date DESC, o.id DESC LIMIT 1) AS last_total_animals,
        (SELECT o.date FROM operations o
         WHERE o.cycle_id = alc.cycle_id AND o.cancelled_at IS NULL
         ORDER BY o.date DESC, o.id DESC LIMIT 1) AS last_op_date,
        (SELECT COUNT(DISTINCT lot_id) FROM basket_lot_composition
         WHERE basket_id = alc.basket_id AND cycle_id = alc.cycle_id) AS lots_in_basket
      FROM active_lot_cycles alc
      JOIN baskets b ON b.id = alc.basket_id
      JOIN cycles  c ON c.id = alc.cycle_id
      JOIN flupsys f ON f.id = b.flupsy_id
      ORDER BY b.physical_number ASC
    `);

    const allRows = (distRows.rows as any[]).map(r => {
      const hasComp = r.has_composition === true;
      const lastTotal = Number(r.last_total_animals ?? 0);
      const lotAnimals = hasComp ? Number(r.comp_animals ?? 0) : lastTotal;
      const lotPct = hasComp ? Number(r.comp_pct ?? 0) * 100 : 100;
      const lotsInBasket = Number(r.lots_in_basket ?? 0) || 1;
      return {
        basketId: r.basket_id,
        physicalNumber: r.physical_number,
        flupsyId: r.flupsy_id,
        flupsyName: r.flupsy_name,
        cycleId: r.cycle_id,
        cycleStartDate: r.start_date,
        cycleState: r.cycle_state as 'active' | 'closed',
        lotAnimals,
        lotPercentage: lotPct,
        lastSizeCode: r.last_size_code,
        lastTotalAnimals: lastTotal,
        lastOpDate: r.last_op_date,
        lotsInBasket,
        isMixed: lotsInBasket > 1,
        hasComposition: hasComp,
      };
    });

    // Distribuzione = solo cesti ATTIVI; cesti chiusi = "tracciamento perso"
    const distribution = allRows.filter(d => d.cycleState === 'active');
    const lostTracking = allRows.filter(d => d.cycleState === 'closed');

    const activeNow = distribution.reduce((s, d) => s + d.lotAnimals, 0);
    const activeInPure = distribution.filter(d => !d.isMixed).reduce((s, d) => s + d.lotAnimals, 0);
    const activeInMixed = activeNow - activeInPure;
    const lostTrackingTotal = lostTracking.reduce((s, d) => s + d.lotAnimals, 0);

    // Data fino a cui il lotto era integralmente tracciato
    // = data dell'ultima operazione sul primo ciclo che ha "perso" il tracciamento
    const lastTrackedDate: string | null = lostTracking.length > 0
      ? lostTracking
          .map(d => d.lastOpDate as string | null)
          .filter((d): d is string => !!d)
          .sort()
          .at(0) ?? null
      : null;

    // 4. Bilancio
    const initial = Number(lot.animal_count ?? 0)
      || Math.abs(agg['in']?.total ?? 0)
      || Math.abs(agg['activation']?.total ?? 0);
    const ledgerDeaths = Math.abs(Number(agg['mortality']?.total ?? 0));
    const sales = Math.abs(Number(agg['sale']?.total ?? 0));
    const transferOut = Math.abs(Number(agg['transfer_out']?.total ?? 0));
    const transferIn = Math.abs(Number(agg['transfer_in']?.total ?? 0));

    // Mortalità calcolata = iniziali − attivi − venduti − persi nel tracciamento
    // (animali finiti in cesti ora chiusi via vagliatura senza prosecuzione composition).
    // Per lotti mono-ciclo riflette la differenza reale tra prima-attivazione e ultima misura.
    const deaths = Math.max(0, initial - activeNow - sales - lostTrackingTotal);
    const accounted = deaths + sales + activeNow + lostTrackingTotal;
    const residual = initial - accounted;
    const wasScreened = transferOut > 0 || lostTracking.length > 0;

    const bilancio = {
      initial,
      deaths,
      deathsPct: initial > 0 ? (deaths / initial) * 100 : 0,
      ledgerDeaths,
      ledgerDeathsPct: initial > 0 ? (ledgerDeaths / initial) * 100 : 0,
      sales,
      salesPct: initial > 0 ? (sales / initial) * 100 : 0,
      activeNow,
      activeNowPct: initial > 0 ? (activeNow / initial) * 100 : 0,
      activeInPure,
      activeInMixed,
      lostTracking: lostTrackingTotal,
      lostTrackingPct: initial > 0 ? (lostTrackingTotal / initial) * 100 : 0,
      lostTrackingBasketsCount: lostTracking.length,
      transferOut,
      transferIn,
      residual,
      residualPct: initial > 0 ? (residual / initial) * 100 : 0,
      survivalPct: initial > 0 ? ((sales + activeNow + lostTrackingTotal) / initial) * 100 : 0,
      wasScreened,
      lastTrackedDate,
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

    // ============ CONFIDENCE / QUALITÀ TRACCIAMENTO ============
    // Classifica gli animali in 3 categorie di affidabilità:
    //  - measured: in cesti puri (1 solo lotto) → numero esatto
    //  - estimated: in cesti misti → quota proporzionale (stima)
    //  - untracked: in cicli chiusi senza propagazione (fuori tracciamento)
    // Score 0-100 = (measured*1.0 + estimated*0.6 + untracked*0) / total
    const pureBasketsCount = distribution.filter(d => !d.isMixed).length;
    const mixedBasketsCount = distribution.filter(d => d.isMixed).length;
    const untrackedBasketsCount = lostTracking.length;

    const measuredAnimals = bilancio.activeInPure;
    const estimatedAnimals = bilancio.activeInMixed;
    const untrackedAnimals = bilancio.lostTracking;
    const totalTrackedOrLost = measuredAnimals + estimatedAnimals + untrackedAnimals;

    let confidenceScore: number;
    if (totalTrackedOrLost === 0) {
      // Nessun animale ancora "vivo nel sistema" → score basato su lost_tracking
      confidenceScore = (lot.animal_count > 0 && untrackedAnimals === 0) ? 100 : 0;
    } else {
      confidenceScore = Math.round(
        ((measuredAnimals * 1.0 + estimatedAnimals * 0.6 + untrackedAnimals * 0.0) / totalTrackedOrLost) * 100
      );
    }

    let confidenceLevel: 'high' | 'medium' | 'low' | 'none';
    if (totalTrackedOrLost === 0 && initial === 0) confidenceLevel = 'none';
    else if (confidenceScore >= 80) confidenceLevel = 'high';
    else if (confidenceScore >= 50) confidenceLevel = 'medium';
    else confidenceLevel = 'low';

    const confidence = {
      score: confidenceScore,
      level: confidenceLevel,
      measuredAnimals,
      estimatedAnimals,
      untrackedAnimals,
      pureBasketsCount,
      mixedBasketsCount,
      untrackedBasketsCount,
    };

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
      confidence,
      distribution,
      lostTracking,
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
      WITH basket_lot_count AS (
        /* Conta quanti lotti distinti coesistono in ogni coppia (cestello, ciclo) */
        SELECT basket_id, cycle_id, COUNT(DISTINCT lot_id) AS lot_count
        FROM basket_lot_composition
        GROUP BY basket_id, cycle_id
      )
      SELECT
        l.id,
        l.arrival_date,
        l.supplier,
        l.supplier_lot_number,
        l.animal_count,
        l.state,

        /* Ceste attive */
        (
          SELECT COUNT(DISTINCT blc.basket_id)
          FROM basket_lot_composition blc
          JOIN cycles c ON c.id = blc.cycle_id
          WHERE blc.lot_id = l.id AND c.state = 'active'
        ) AS active_baskets,

        /* Cesti attivi PURI (1 solo lotto in basket_lot_composition) +
           cicli mono-lotto sul cycles.lot_id senza composition */
        (
          (
            SELECT COUNT(DISTINCT blc.basket_id)
            FROM basket_lot_composition blc
            JOIN cycles c ON c.id = blc.cycle_id
            JOIN basket_lot_count blcnt
              ON blcnt.basket_id = blc.basket_id AND blcnt.cycle_id = blc.cycle_id
            WHERE blc.lot_id = l.id AND c.state = 'active' AND blcnt.lot_count = 1
          )
          +
          (
            SELECT COUNT(DISTINCT c.basket_id)
            FROM cycles c
            WHERE c.lot_id = l.id AND c.state = 'active'
              AND NOT EXISTS (
                SELECT 1 FROM basket_lot_composition blc2
                WHERE blc2.basket_id = c.basket_id AND blc2.cycle_id = c.id
              )
          )
        ) AS pure_baskets,

        /* Cesti attivi MISTI (>=2 lotti in basket_lot_composition) */
        (
          SELECT COUNT(DISTINCT blc.basket_id)
          FROM basket_lot_composition blc
          JOIN cycles c ON c.id = blc.cycle_id
          JOIN basket_lot_count blcnt
            ON blcnt.basket_id = blc.basket_id AND blcnt.cycle_id = blc.cycle_id
          WHERE blc.lot_id = l.id AND c.state = 'active' AND blcnt.lot_count > 1
        ) AS mixed_baskets,

        /* Animali attivi oggi (pro-quota su cesti attivi con blc) + fallback mono-lotto */
        COALESCE((
          SELECT SUM(
            CASE
              WHEN blc.animal_count IS NOT NULL THEN blc.animal_count
              ELSE ROUND(COALESCE(last_op.animal_count, 0) * blc.percentage / 100.0)
            END
          )
          FROM basket_lot_composition blc
          JOIN cycles c ON c.id = blc.cycle_id
          LEFT JOIN LATERAL (
            SELECT animal_count FROM operations
            WHERE basket_id = c.basket_id AND cycle_id = c.id
            ORDER BY date DESC, id DESC LIMIT 1
          ) last_op ON TRUE
          WHERE blc.lot_id = l.id AND c.state = 'active'
        ), 0)
        + COALESCE((
          /* Fallback: cicli attivi mono-lotto su cycles.lot_id senza alcuna riga in BLC */
          SELECT SUM(COALESCE(last_op.animal_count, 0))
          FROM cycles c
          LEFT JOIN LATERAL (
            SELECT animal_count FROM operations
            WHERE basket_id = c.basket_id AND cycle_id = c.id
            ORDER BY date DESC, id DESC LIMIT 1
          ) last_op ON TRUE
          WHERE c.lot_id = l.id AND c.state = 'active'
            AND NOT EXISTS (
              SELECT 1 FROM basket_lot_composition blcx
              WHERE blcx.basket_id = c.basket_id AND blcx.cycle_id = c.id
            )
        ), 0) AS active_now,

        /* Fuori tracciamento: cesti chiusi con blc per questo lotto + fallback mono-lotto */
        COALESCE((
          SELECT SUM(
            CASE
              WHEN blc.animal_count IS NOT NULL THEN blc.animal_count
              ELSE ROUND(COALESCE(last_op.animal_count, 0) * blc.percentage / 100.0)
            END
          )
          FROM basket_lot_composition blc
          JOIN cycles c ON c.id = blc.cycle_id
          LEFT JOIN LATERAL (
            SELECT animal_count FROM operations
            WHERE basket_id = c.basket_id AND cycle_id = c.id
            ORDER BY date DESC, id DESC LIMIT 1
          ) last_op ON TRUE
          WHERE blc.lot_id = l.id AND c.state = 'closed'
        ), 0)
        + COALESCE((
          /* Fallback: cicli chiusi mono-lotto su cycles.lot_id senza alcuna riga in BLC */
          SELECT SUM(COALESCE(last_op.animal_count, 0))
          FROM cycles c
          LEFT JOIN LATERAL (
            SELECT animal_count FROM operations
            WHERE basket_id = c.basket_id AND cycle_id = c.id
            ORDER BY date DESC, id DESC LIMIT 1
          ) last_op ON TRUE
          WHERE c.lot_id = l.id AND c.state = 'closed'
            AND NOT EXISTS (
              SELECT 1 FROM basket_lot_composition blcx
              WHERE blcx.basket_id = c.basket_id AND blcx.cycle_id = c.id
            )
        ), 0) AS lost_tracking,

        /* Data primo evento fuori tracciamento (= fine tracciamento integrale) */
        (
          SELECT MIN(last_op2.last_date)
          FROM basket_lot_composition blc2
          JOIN cycles c2 ON c2.id = blc2.cycle_id
          JOIN LATERAL (
            SELECT MAX(date) AS last_date FROM operations
            WHERE basket_id = c2.basket_id AND cycle_id = c2.id
          ) last_op2 ON TRUE
          WHERE blc2.lot_id = l.id AND c2.state = 'closed'
        ) AS last_tracked_date,

        /* Morti documentati (da lot_ledger) */
        COALESCE((
          SELECT SUM(quantity::numeric)
          FROM lot_ledger
          WHERE lot_id = l.id AND type = 'mortality'
        ), 0) AS deaths,

        /* Venduti (da lot_ledger) */
        COALESCE((
          SELECT SUM(quantity::numeric)
          FROM lot_ledger
          WHERE lot_id = l.id AND type = 'sale'
        ), 0) AS sales

      FROM lots l
      ORDER BY l.arrival_date DESC, l.id DESC
    `);

    const lots = (rows.rows as any[]).map(r => {
      const initial = Number(r.animal_count) || 0;
      const activeNow = Number(r.active_now) || 0;
      const lostTracking = Number(r.lost_tracking) || 0;
      const deaths = Number(r.deaths) || 0;
      const sales = Number(r.sales) || 0;
      const pureBaskets = Number(r.pure_baskets) || 0;
      const mixedBaskets = Number(r.mixed_baskets) || 0;
      const survivalPct = initial > 0 ? ((activeNow + sales + lostTracking) / initial) * 100 : null;

      // Confidence score (0-100): pesi animali misurati/stimati/non tracciati
      // Proxy per la lista: usiamo il rapporto cesti puri/misti per stimare quanto degli
      // active_now è "misurato" vs "stimato pro-quota". I lost_tracking pesano 0.
      const totalAnchor = activeNow + lostTracking;
      let confScore = 0;
      let confLevel: 'high' | 'medium' | 'low' | 'none';

      if (totalAnchor === 0) {
        // Lotto esaurito o senza animali tracciati → nessun giudizio di affidabilità
        confLevel = 'none';
      } else {
        const totalActiveBaskets = pureBaskets + mixedBaskets;
        const pureRatio = totalActiveBaskets > 0 ? pureBaskets / totalActiveBaskets : 1;
        const measuredEst = activeNow * pureRatio;
        const estimatedEst = activeNow * (1 - pureRatio);
        const raw = ((measuredEst * 1.0 + estimatedEst * 0.6) / totalAnchor) * 100;
        confScore = Math.max(0, Math.min(100, Math.round(raw)));
        if (confScore >= 80) confLevel = 'high';
        else if (confScore >= 50) confLevel = 'medium';
        else confLevel = 'low';
      }

      return {
        ...r,
        active_now: activeNow,
        lost_tracking: lostTracking,
        deaths,
        sales,
        pure_baskets: pureBaskets,
        mixed_baskets: mixedBaskets,
        survival_pct: survivalPct !== null ? Math.round(survivalPct * 10) / 10 : null,
        last_tracked_date: r.last_tracked_date ?? null,
        confidence_score: confScore,
        confidence_level: confLevel,
      };
    });

    return res.json({ lots });
  } catch (err: any) {
    console.error('Lots list for report error:', err);
    return res.status(500).json({ error: err.message });
  }
}
