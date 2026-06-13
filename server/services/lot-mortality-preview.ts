/**
 * Anteprima (dry-run) del ricalcolo mortalità lotti — Fase 2.
 * Mostra prima/dopo per ogni lotto SENZA scrivere nel DB.
 */
import { db } from "../db";
import { sql } from "drizzle-orm";

export interface LotMortalityPreviewRow {
  lotId: number;
  supplier: string | null;
  received: number;
  mortalityBefore: number;
  rawMortality: number;
  mortalityAfter: number;
  clamped: boolean;
}

export async function computeRecalcPreview(): Promise<{
  rows: LotMortalityPreviewRow[];
  totalLots: number;
  lotsClamped: number;
}> {
  const result = await db.execute(sql`
    WITH seg AS (
      SELECT 'sel' || s.id AS seg_id, s.date AS seg_date,
        (SELECT COALESCE(SUM(animal_count), 0) FROM selection_source_baskets x WHERE x.selection_id = s.id) AS src,
        (SELECT COALESCE(SUM(animal_count), 0) FROM selection_destination_baskets x WHERE x.selection_id = s.id) AS dst
      FROM selections s WHERE s.status = 'completed'
      UNION ALL
      SELECT 'scr' || o.id AS seg_id, o.date AS seg_date,
        (SELECT COALESCE(SUM(animal_count), 0) FROM screening_source_baskets x WHERE x.screening_id = o.id) AS src,
        (SELECT COALESCE(SUM(animal_count), 0) FROM screening_destination_baskets x WHERE x.screening_id = o.id) AS dst
      FROM screening_operations o WHERE o.status = 'completed'
    ),
    segmort AS (
      SELECT seg_id, GREATEST(0, src - dst) AS seg_mort, src FROM seg
    ),
    lotsrc AS (
      SELECT 'sel' || ss.selection_id AS seg_id, ss.lot_id, SUM(ss.animal_count) AS lot_src
      FROM selection_source_baskets ss WHERE ss.lot_id IS NOT NULL
      GROUP BY ss.selection_id, ss.lot_id
      UNION ALL
      SELECT 'scr' || ss.screening_id AS seg_id, ss.lot_id, SUM(ss.animal_count) AS lot_src
      FROM screening_source_baskets ss WHERE ss.lot_id IS NOT NULL
      GROUP BY ss.screening_id, ss.lot_id
    ),
    agg AS (
      SELECT ls.lot_id,
        ROUND(SUM(sm.seg_mort * (ls.lot_src::numeric / NULLIF(sm.src, 0))))::bigint AS raw_mort
      FROM lotsrc ls JOIN segmort sm ON sm.seg_id = ls.seg_id
      GROUP BY ls.lot_id
    )
    SELECT l.id AS lot_id, l.supplier, l.animal_count AS received,
      COALESCE(l.total_mortality, 0) AS mort_before,
      COALESCE(agg.raw_mort, 0) AS raw_mort
    FROM lots l LEFT JOIN agg ON agg.lot_id = l.id
    ORDER BY COALESCE(l.total_mortality, 0) DESC
  `);

  const rows: LotMortalityPreviewRow[] = (result.rows as any[]).map((r) => {
    const received = Number(r.received) || 0;
    const rawMortality = Number(r.raw_mort) || 0;
    const clamped = received > 0 && rawMortality > received;
    const mortalityAfter = received > 0 ? Math.min(rawMortality, received) : rawMortality;
    return {
      lotId: Number(r.lot_id),
      supplier: r.supplier ?? null,
      received,
      mortalityBefore: Number(r.mort_before) || 0,
      rawMortality,
      mortalityAfter,
      clamped,
    };
  });

  return {
    rows,
    totalLots: rows.length,
    lotsClamped: rows.filter((r) => r.clamped).length,
  };
}
