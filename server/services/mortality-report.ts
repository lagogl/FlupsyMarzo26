/**
 * REPORT MORTI — visione chiara e onesta della mortalità contata.
 *
 * PRINCIPIO: l'unico momento in cui gli animali si CONTANO davvero è la vagliatura
 * (animali in ingresso − animali in uscita = morti). Questo report somma quella verità
 * contata, per mese, per modulo (FLUPSY/raceway/bins) e per lotto.
 *
 * - perMonth/perFlupsy: dalle vagliature completate (`selections.purpose='vagliatura'`),
 *   con clamp dest ≤ origine per escludere anomalie/guadagni (coerente con la tendenza del cruscotto).
 * - perFlupsy: la destinazione di ogni vagliatura è attribuita ai moduli di ORIGINE in
 *   proporzione agli animali entrati da ciascun modulo.
 * - perLot: dai movimenti di mortalità del registro lotti (`lot_ledger.type='mortality'`),
 *   già attribuiti pro-quota ai lotti nel completamento della vagliatura.
 */
import { db } from "../db";
import { sql } from "drizzle-orm";

export interface MortalityMonth {
  mese: string;
  origine: number;
  destinazione: number;
  morti: number;
  mortalitaPct: number | null; // 0..1
}

export interface MortalityModule {
  flupsyId: number;
  name: string;
  moduleType: string;
  origine: number;
  morti: number;
  mortalitaPct: number | null; // 0..1
}

export interface MortalityLot {
  lotId: number;
  supplier: string | null;
  supplierLotNumber: string | null;
  arrivalDate: string | null;
  mortiWindow: number; // morti registrati nella finestra
  attivati: number; // animali attivati del lotto (storico)
  mortalitaPct: number | null; // morti finestra ÷ attivati (0..1), indicativo
}

export interface MortalityReport {
  windowDays: number;
  totals: {
    origine: number;
    destinazione: number;
    morti: number;
    mortalitaPct: number | null; // morti ÷ lavorati (media per vagliatura)
    mortiAllTime: number;
    animaliEntrati: number; // animali REALMENTE entrati in allevamento (attivazioni) nella finestra
    mortalitaReale: number | null; // morti ÷ animali entrati (mortalità sulla popolazione), 0..1
  };
  perMonth: MortalityMonth[];
  perFlupsy: MortalityModule[];
  perLot: MortalityLot[];
  generatedAt: string;
}

export async function getMortalityReport(days: number): Promise<MortalityReport> {
  // ── Per mese (vagliature nella finestra) ───────────────────────────────
  const monthRes = await db.execute(sql`
    WITH base AS (
      SELECT s.id, s.date,
        (SELECT COALESCE(SUM(ssb.animal_count),0) FROM selection_source_baskets ssb WHERE ssb.selection_id=s.id) AS origine,
        (SELECT COALESCE(SUM(COALESCE(sdb.live_animals, sdb.animal_count)),0) FROM selection_destination_baskets sdb WHERE sdb.selection_id=s.id) AS dest
      FROM selections s
      WHERE s.status='completed' AND s.purpose='vagliatura'
        AND s.date >= (CURRENT_DATE - (${days}::int * INTERVAL '1 day'))
    ),
    sel AS (
      SELECT id, date, origine, LEAST(GREATEST(dest,0), origine) AS dest
      FROM base WHERE origine > 0
    )
    SELECT to_char(date_trunc('month', date), 'YYYY-MM') AS mese,
      COALESCE(SUM(origine),0)::bigint AS origine,
      COALESCE(SUM(dest),0)::bigint AS dest,
      COALESCE(SUM(origine - dest),0)::bigint AS morti
    FROM sel GROUP BY 1 ORDER BY 1 DESC
  `);
  const perMonth: MortalityMonth[] = (monthRes.rows as any[]).map((r) => {
    const origine = Number(r.origine) || 0;
    const dest = Number(r.dest) || 0;
    const morti = Number(r.morti) || 0;
    return { mese: String(r.mese), origine, destinazione: dest, morti, mortalitaPct: origine > 0 ? morti / origine : null };
  });
  const totOrigine = perMonth.reduce((a, b) => a + b.origine, 0);
  const totDest = perMonth.reduce((a, b) => a + b.destinazione, 0);
  const totMorti = perMonth.reduce((a, b) => a + b.morti, 0);

  // ── Morti totali storici (tutte le vagliature) ─────────────────────────
  const allRes = await db.execute(sql`
    WITH base AS (
      SELECT s.id,
        (SELECT COALESCE(SUM(ssb.animal_count),0) FROM selection_source_baskets ssb WHERE ssb.selection_id=s.id) AS origine,
        (SELECT COALESCE(SUM(COALESCE(sdb.live_animals, sdb.animal_count)),0) FROM selection_destination_baskets sdb WHERE sdb.selection_id=s.id) AS dest
      FROM selections s WHERE s.status='completed' AND s.purpose='vagliatura'
    )
    SELECT COALESCE(SUM(GREATEST(origine - LEAST(GREATEST(dest,0), origine), 0)),0)::bigint AS morti
    FROM base WHERE origine > 0
  `);
  const mortiAllTime = Number((allRes.rows[0] as any)?.morti) || 0;

  // ── Animali REALMENTE entrati in allevamento (attivazioni del registro lotti) ──
  // Questo è l'unico conteggio di animali DISTINTI: ogni lotto viene attivato una sola
  // volta. È il denominatore corretto per la mortalità reale sulla popolazione.
  const actRes = await db.execute(sql`
    SELECT COALESCE(SUM(ABS(quantity)),0)::bigint AS attivati
    FROM lot_ledger
    WHERE type='activation'
      AND date >= (CURRENT_DATE - (${days}::int * INTERVAL '1 day'))
  `);
  const animaliEntrati = Number((actRes.rows[0] as any)?.attivati) || 0;

  // ── Per FLUPSY (attribuzione pro-quota al modulo di origine) ────────────
  const modRes = await db.execute(sql`
    WITH base AS (
      SELECT s.id,
        (SELECT COALESCE(SUM(ssb.animal_count),0) FROM selection_source_baskets ssb WHERE ssb.selection_id=s.id) AS origine,
        (SELECT COALESCE(SUM(COALESCE(sdb.live_animals, sdb.animal_count)),0) FROM selection_destination_baskets sdb WHERE sdb.selection_id=s.id) AS dest
      FROM selections s
      WHERE s.status='completed' AND s.purpose='vagliatura'
        AND s.date >= (CURRENT_DATE - (${days}::int * INTERVAL '1 day'))
    ),
    sel AS (SELECT id, origine, LEAST(GREATEST(dest,0), origine) AS dest FROM base WHERE origine > 0),
    src AS (
      SELECT ssb.selection_id, b.flupsy_id, SUM(ssb.animal_count) AS origine_modulo
      FROM selection_source_baskets ssb JOIN baskets b ON b.id = ssb.basket_id
      GROUP BY ssb.selection_id, b.flupsy_id
    )
    SELECT src.flupsy_id AS flupsy_id, f.name AS name, COALESCE(f.module_type,'flupsy') AS module_type,
      COALESCE(SUM(src.origine_modulo),0)::bigint AS origine,
      COALESCE(SUM(GREATEST(src.origine_modulo - src.origine_modulo * sel.dest::numeric / NULLIF(sel.origine,0), 0)),0)::bigint AS morti
    FROM src JOIN sel ON sel.id = src.selection_id
    LEFT JOIN flupsys f ON f.id = src.flupsy_id
    GROUP BY src.flupsy_id, f.name, f.module_type
    ORDER BY morti DESC
  `);
  const perFlupsy: MortalityModule[] = (modRes.rows as any[]).map((r) => {
    const origine = Number(r.origine) || 0;
    const morti = Number(r.morti) || 0;
    return {
      flupsyId: Number(r.flupsy_id),
      name: r.name ? String(r.name) : `Modulo ${r.flupsy_id}`,
      moduleType: String(r.module_type),
      origine,
      morti,
      mortalitaPct: origine > 0 ? morti / origine : null,
    };
  });

  // ── Per lotto (registro lotti: morti nella finestra, attivati storici) ──
  const lotRes = await db.execute(sql`
    WITH m AS (
      SELECT lot_id, SUM(ABS(quantity)) AS morti
      FROM lot_ledger
      WHERE type='mortality' AND lot_id IS NOT NULL
        AND date >= (CURRENT_DATE - (${days}::int * INTERVAL '1 day'))
      GROUP BY lot_id
    ),
    a AS (
      SELECT lot_id, SUM(ABS(quantity)) AS attivati
      FROM lot_ledger WHERE type='activation' AND lot_id IS NOT NULL GROUP BY lot_id
    )
    SELECT m.lot_id AS lot_id, m.morti::bigint AS morti, COALESCE(a.attivati,0)::bigint AS attivati,
      l.supplier AS supplier, l.supplier_lot_number AS supplier_lot_number, l.arrival_date::text AS arrival_date
    FROM m
    LEFT JOIN a ON a.lot_id = m.lot_id
    LEFT JOIN lots l ON l.id = m.lot_id
    ORDER BY m.morti DESC
    LIMIT 30
  `);
  const perLot: MortalityLot[] = (lotRes.rows as any[]).map((r) => {
    const morti = Number(r.morti) || 0;
    const attivati = Number(r.attivati) || 0;
    return {
      lotId: Number(r.lot_id),
      supplier: r.supplier ? String(r.supplier) : null,
      supplierLotNumber: r.supplier_lot_number ? String(r.supplier_lot_number) : null,
      arrivalDate: r.arrival_date ? String(r.arrival_date) : null,
      mortiWindow: morti,
      attivati,
      mortalitaPct: attivati > 0 ? Math.min(1, morti / attivati) : null,
    };
  });

  return {
    windowDays: days,
    totals: {
      origine: totOrigine,
      destinazione: totDest,
      morti: totMorti,
      mortalitaPct: totOrigine > 0 ? totMorti / totOrigine : null,
      mortiAllTime,
      animaliEntrati,
      // Ratio grezzo (può superare 1 su finestre brevi: i morti contati possono
      // riguardare animali entrati PRIMA della finestra selezionata). Non clampato:
      // l'interfaccia avvisa quando > 100%.
      mortalitaReale: animaliEntrati > 0 ? totMorti / animaliEntrati : null,
    },
    perMonth,
    perFlupsy,
    perLot,
    generatedAt: new Date().toISOString(),
  };
}
