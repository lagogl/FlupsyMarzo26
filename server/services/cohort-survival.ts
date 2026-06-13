/**
 * SERVIZIO SOPRAVVIVENZA COORTE — Fase 3 "Coorti di mescolamento".
 *
 * PRINCIPIO (coerente con Fase 2 "contare i vivi"):
 * - All'istante del mescolamento la coorte congela il totale vivi (verità contata) e la
 *   ripartizione per lotto. Da lì la coorte è seguita come UN'UNICA unità contata.
 * - La sopravvivenza misurata = vivi correnti totali ÷ vivi iniziali congelati.
 * - "Vivi correnti" = somma degli animali nell'ultima operazione di ogni ciclo ATTIVO
 *   collegato alla coorte (la verità contata più recente). I cicli chiusi (venduti/vagliati)
 *   non contano tra i vivi correnti.
 *
 * NOTA (limite noto, raffinato in Fase 4): la sopravvivenza qui non distingue tra morti e
 *   uscite per vendita/trasferimento; è la sopravvivenza "grezza" della coorte ancora in acqua.
 *   I numeri precisi per singolo lotto con semaforo di affidabilità arrivano nella Fase 4.
 */
import { db } from "../db";
import { sql, eq } from "drizzle-orm";
import { cohorts, cohortComposition } from "../../shared/schema";

export interface CohortCompositionEntry {
  lotId: number;
  animalCount: number; // vivi congelati al mix
  percentage: number; // quota (0..1)
}

export interface CohortSurvival {
  id: number;
  code: string;
  sourceSelectionId: number | null;
  mixDate: string;
  status: string;
  initialAnimalCount: number; // vivi congelati al mix
  currentLiveCount: number; // vivi correnti (cicli attivi)
  activeCycles: number; // numero cicli attivi collegati
  survivalRate: number | null; // vivi correnti ÷ vivi iniziali (0..1), null se iniziale = 0
  composition?: CohortCompositionEntry[];
}

/**
 * Calcola i vivi correnti (e i cicli attivi) per ciascuna coorte indicata.
 * Vivi correnti = somma dell'ultima operazione con animal_count di ogni ciclo attivo della coorte.
 */
async function computeCurrentLiveByCohort(
  cohortIds?: number[]
): Promise<Map<number, { currentLive: number; activeCycles: number }>> {
  const filter =
    cohortIds && cohortIds.length > 0
      ? sql`AND c.cohort_id IN (${sql.join(cohortIds.map((n) => sql`${Number(n)}`), sql`, `)})`
      : sql``;

  const result = await db.execute(sql`
    WITH cohort_cycles AS (
      SELECT c.id AS cycle_id, c.cohort_id
      FROM cycles c
      WHERE c.cohort_id IS NOT NULL AND c.state = 'active'
      ${filter}
    ),
    latest_op AS (
      SELECT DISTINCT ON (o.cycle_id)
        o.cycle_id, o.animal_count
      FROM operations o
      JOIN cohort_cycles cc ON cc.cycle_id = o.cycle_id
      WHERE o.animal_count IS NOT NULL
      ORDER BY o.cycle_id, o.date DESC, o.id DESC
    )
    SELECT cc.cohort_id AS cohort_id,
      COALESCE(SUM(lo.animal_count), 0)::bigint AS current_live,
      COUNT(lo.cycle_id) AS active_cycles
    FROM cohort_cycles cc
    LEFT JOIN latest_op lo ON lo.cycle_id = cc.cycle_id
    GROUP BY cc.cohort_id
  `);

  const map = new Map<number, { currentLive: number; activeCycles: number }>();
  for (const row of result.rows as any[]) {
    map.set(Number(row.cohort_id), {
      currentLive: Number(row.current_live) || 0,
      activeCycles: Number(row.active_cycles) || 0,
    });
  }
  return map;
}

function buildSurvival(
  cohort: typeof cohorts.$inferSelect,
  live: { currentLive: number; activeCycles: number } | undefined
): CohortSurvival {
  const currentLiveCount = live?.currentLive ?? 0;
  const activeCycles = live?.activeCycles ?? 0;
  const initial = cohort.initialAnimalCount || 0;
  return {
    id: cohort.id,
    code: cohort.code,
    sourceSelectionId: cohort.sourceSelectionId,
    mixDate: String(cohort.mixDate),
    status: cohort.status,
    initialAnimalCount: initial,
    currentLiveCount,
    activeCycles,
    survivalRate: initial > 0 ? currentLiveCount / initial : null,
  };
}

/** Elenca tutte le coorti con la loro sopravvivenza misurata. */
export async function listCohortSurvival(): Promise<CohortSurvival[]> {
  const allCohorts = await db.select().from(cohorts).orderBy(sql`${cohorts.mixDate} DESC, ${cohorts.id} DESC`);
  if (allCohorts.length === 0) return [];
  const liveMap = await computeCurrentLiveByCohort();
  return allCohorts.map((c) => buildSurvival(c, liveMap.get(c.id)));
}

/** Dettaglio di una singola coorte: sopravvivenza + composizione congelata per lotto. */
export async function getCohortSurvival(cohortId: number): Promise<CohortSurvival | null> {
  const [cohort] = await db.select().from(cohorts).where(eq(cohorts.id, cohortId)).limit(1);
  if (!cohort) return null;

  const liveMap = await computeCurrentLiveByCohort([cohortId]);
  const survival = buildSurvival(cohort, liveMap.get(cohortId));

  const composition = await db
    .select()
    .from(cohortComposition)
    .where(eq(cohortComposition.cohortId, cohortId));

  survival.composition = composition.map((row) => ({
    lotId: row.lotId,
    animalCount: row.animalCount,
    percentage: row.percentage,
  }));

  return survival;
}
