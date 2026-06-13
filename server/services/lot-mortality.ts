/**
 * SERVIZIO CANONICO MORTALITÀ LOTTO — Fase 2 "Mortalità per differenza di vivi".
 *
 * PRINCIPIO:
 * - La VAGLIATURA è l'unico punto di verità della mortalità (vivi in ingresso − vivi in uscita).
 * - La MISURA giornaliera è solo un indicatore: NON contribuisce alla mortalità del lotto.
 * - Ogni morte viene contata UNA SOLA VOLTA: la mortalità del lotto è SEMPRE ricalcolata in modo
 *   deterministico dalle vagliature, mai sommata incrementalmente (niente doppio conteggio).
 *
 * LIMITI NOTI (raffinati nelle fasi 3-4 — "sopravvivenza per lotto con affidabilità"):
 * - Con lotti misti e animali che ricircolano tra vagliature, l'attribuzione per singolo lotto
 *   è una stima. Quando la stima supera gli animali ricevuti, viene limitata al 100% e marcata
 *   come a bassa affidabilità.
 */
import { db } from "../db";
import { sql, eq, inArray } from "drizzle-orm";
import { lots } from "../../shared/schema";

export interface LotMortalityResult {
  lotId: number;
  received: number;
  rawMortality: number;
  finalMortality: number;
  clamped: boolean;
  lastDate: string | null;
}

/**
 * Calcola la mortalità grezza per lotto dalle vagliature (selections) e screening completati.
 * Per ogni vagliatura: mortalità di segmento = max(0, Σ vivi origine − Σ vivi destinazione),
 * attribuita ai lotti di origine in proporzione alla loro quota di animali in origine.
 */
async function computeRawMortalityByLot(
  lotIds?: number[]
): Promise<Map<number, { raw: number; lastDate: string | null }>> {
  const filter =
    lotIds && lotIds.length > 0
      ? sql`WHERE ls.lot_id IN (${sql.join(lotIds.map((n) => sql`${Number(n)}`), sql`, `)})`
      : sql``;

  const result = await db.execute(sql`
    WITH seg AS (
      SELECT 'sel' || s.id AS seg_id, s.id AS sid, 'sel' AS kind, s.date AS seg_date,
        (SELECT COALESCE(SUM(animal_count), 0) FROM selection_source_baskets x WHERE x.selection_id = s.id) AS src,
        (SELECT COALESCE(SUM(animal_count), 0) FROM selection_destination_baskets x WHERE x.selection_id = s.id) AS dst
      FROM selections s
      WHERE s.status = 'completed'
      UNION ALL
      SELECT 'scr' || o.id AS seg_id, o.id AS sid, 'scr' AS kind, o.date AS seg_date,
        (SELECT COALESCE(SUM(animal_count), 0) FROM screening_source_baskets x WHERE x.screening_id = o.id) AS src,
        (SELECT COALESCE(SUM(animal_count), 0) FROM screening_destination_baskets x WHERE x.screening_id = o.id) AS dst
      FROM screening_operations o
      WHERE o.status = 'completed'
    ),
    segmort AS (
      SELECT seg_id, sid, kind, seg_date, GREATEST(0, src - dst) AS seg_mort, src
      FROM seg
    ),
    lotsrc AS (
      SELECT 'sel' || ss.selection_id AS seg_id, ss.lot_id, SUM(ss.animal_count) AS lot_src
      FROM selection_source_baskets ss
      WHERE ss.lot_id IS NOT NULL
      GROUP BY ss.selection_id, ss.lot_id
      UNION ALL
      SELECT 'scr' || ss.screening_id AS seg_id, ss.lot_id, SUM(ss.animal_count) AS lot_src
      FROM screening_source_baskets ss
      WHERE ss.lot_id IS NOT NULL
      GROUP BY ss.screening_id, ss.lot_id
    )
    SELECT ls.lot_id AS lot_id,
      ROUND(SUM(sm.seg_mort * (ls.lot_src::numeric / NULLIF(sm.src, 0))))::bigint AS raw_mort,
      MAX(sm.seg_date) AS last_date
    FROM lotsrc ls
    JOIN segmort sm ON sm.seg_id = ls.seg_id
    ${filter}
    GROUP BY ls.lot_id
  `);

  const map = new Map<number, { raw: number; lastDate: string | null }>();
  for (const row of result.rows as any[]) {
    map.set(Number(row.lot_id), {
      raw: Number(row.raw_mort) || 0,
      lastDate: row.last_date ? String(row.last_date) : null,
    });
  }
  return map;
}

/**
 * Ricalcola e SCRIVE la mortalità dei lotti indicati (o di tutti se non specificato).
 * Sostituisce sempre il valore esistente (idempotente, niente somma incrementale).
 */
export async function recomputeLotMortality(
  lotIds?: number[]
): Promise<LotMortalityResult[]> {
  // Carica i lotti target (con animali ricevuti)
  const targetLots =
    lotIds && lotIds.length > 0
      ? await db.select().from(lots).where(inArray(lots.id, lotIds))
      : await db.select().from(lots);

  if (targetLots.length === 0) return [];

  const rawMap = await computeRawMortalityByLot(lotIds);
  const results: LotMortalityResult[] = [];

  for (const lot of targetLots) {
    const received = lot.animalCount || 0;
    const entry = rawMap.get(lot.id);
    const rawMortality = entry?.raw || 0;
    const lastDate = entry?.lastDate || null;

    // Clamp di sicurezza: la mortalità non può superare gli animali ricevuti.
    const clamped = received > 0 && rawMortality > received;
    const finalMortality = received > 0 ? Math.min(rawMortality, received) : rawMortality;

    const pct = received > 0 ? (finalMortality / received) * 100 : 0;
    const notes = clamped
      ? `⚠ Affidabilità bassa (lotto misto / ricircolo tra vagliature): stima limitata al 100% (${rawMortality.toLocaleString("it-IT")} stimati su ${received.toLocaleString("it-IT")} ricevuti). I numeri precisi arriveranno nelle fasi 3-4. Mortalità da vagliature (differenza vivi).`
      : `Mortalità da vagliature (differenza vivi entrati − usciti): ${finalMortality.toLocaleString("it-IT")} animali (${pct.toFixed(2)}%). La misura giornaliera è solo un indicatore e non incide.`;

    await db
      .update(lots)
      .set({
        totalMortality: finalMortality,
        lastMortalityDate: finalMortality > 0 ? (lastDate as any) : null,
        mortalityNotes: notes,
      })
      .where(eq(lots.id, lot.id));

    results.push({ lotId: lot.id, received, rawMortality, finalMortality, clamped, lastDate });
  }

  return results;
}

/**
 * Ricalcola la mortalità di TUTTI i lotti (backfill).
 */
export async function recomputeAllLotsMortality(): Promise<LotMortalityResult[]> {
  return recomputeLotMortality();
}
