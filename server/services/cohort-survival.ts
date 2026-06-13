/**
 * SERVIZIO SOPRAVVIVENZA COORTE — Fase 3 "Coorti di mescolamento" + Fase 4 "Per lotto con affidabilità".
 *
 * PRINCIPIO (coerente con Fase 2 "contare i vivi"):
 * - All'istante del mescolamento la coorte congela il totale vivi (verità contata) e la
 *   ripartizione per lotto. Da lì la coorte è seguita come UN'UNICA unità contata.
 * - La sopravvivenza misurata = vivi correnti totali ÷ vivi iniziali congelati.
 * - "Vivi correnti" = somma degli animali nell'ultima operazione di ogni ciclo ATTIVO
 *   collegato alla coorte (la verità contata più recente). I cicli chiusi (venduti/vagliati)
 *   non contano tra i vivi correnti.
 *
 * FASE 4 — Sopravvivenza per lotto, con affidabilità:
 * - Vivi correnti stimati del lotto = (parte esatta congelata al mix) × (sopravvivenza misurata
 *   della coorte) = currentLive × quota del lotto nella coorte. La ripartizione resta pro-quota
 *   sulla composizione congelata (regola concordata col Piano).
 * - Ogni numero per-lotto porta un semaforo di affidabilità (alta/media/bassa) che dice quanto
 *   è solido: alta = lotto rimasto a lungo puro prima del mix e/o dominante nella coorte;
 *   media/bassa = lotto mescolato presto e/o quota piccola (la stima pro-quota pesa di più).
 */
import { db } from "../db";
import { sql, eq } from "drizzle-orm";
import { cohorts, cohortComposition } from "../../shared/schema";

export type Reliability = "alta" | "media" | "bassa";

export interface CohortCompositionEntry {
  lotId: number;
  animalCount: number; // vivi congelati al mix (verità contata)
  percentage: number; // quota (0..1)
  estimatedLiveCount: number; // FASE 4: vivi correnti stimati = currentLive × quota
  survivalRate: number | null; // FASE 4: sopravvivenza del lotto (= sopravvivenza coorte, pro-quota)
  reliability: Reliability; // FASE 4: semaforo di affidabilità del numero per-lotto
  reliabilityScore: number; // FASE 4: punteggio 0..1 alla base del semaforo
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
  reliability: Reliability; // FASE 4: affidabilità complessiva della coorte
  reliabilityScore: number; // FASE 4: punteggio 0..1 (media pesata sui lotti)
  composition?: CohortCompositionEntry[];
}

// Pesi del punteggio di affidabilità per-lotto (Fase 4).
const W_PURITY = 0.6; // quanto a lungo il lotto è rimasto puro prima del mix
const W_DOMINANCE = 0.4; // quanto il lotto domina la coorte (quota)
const TH_ALTA = 0.66;
const TH_MEDIA = 0.33;

function scoreToReliability(score: number): Reliability {
  if (score >= TH_ALTA) return "alta";
  if (score >= TH_MEDIA) return "media";
  return "bassa";
}

/** Distribuisce `total` sulle quote `fractions` arrotondando e preservando la somma esatta. */
function distributePreservingSum(fractions: number[], total: number): number[] {
  if (fractions.length === 0) return [];
  const raw = fractions.map((f) => f * total);
  const floors = raw.map((r) => Math.floor(r));
  let remainder = total - floors.reduce((a, b) => a + b, 0);
  // Ordina gli indici per parte frazionaria decrescente e assegna le unità residue.
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);
  const result = floors.slice();
  for (let k = 0; k < order.length && remainder > 0; k++) {
    result[order[k].i] += 1;
    remainder--;
  }
  return result;
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

/**
 * Carica, per ogni lotto, la data di arrivo e la data del PRIMO mescolamento in cui compare.
 * Serve a stimare la "durata pura" del lotto (arrivo → primo mix), base dell'affidabilità Fase 4.
 */
async function loadLotPurityData(): Promise<
  Map<number, { arrivalDate: string | null; firstMixDate: string | null }>
> {
  const result = await db.execute(sql`
    SELECT cc.lot_id AS lot_id,
      MIN(co.mix_date) AS first_mix_date,
      MIN(l.arrival_date) AS arrival_date
    FROM cohort_composition cc
    JOIN cohorts co ON co.id = cc.cohort_id
    LEFT JOIN lots l ON l.id = cc.lot_id
    GROUP BY cc.lot_id
  `);
  const map = new Map<number, { arrivalDate: string | null; firstMixDate: string | null }>();
  for (const row of result.rows as any[]) {
    map.set(Number(row.lot_id), {
      arrivalDate: row.arrival_date ? String(row.arrival_date) : null,
      firstMixDate: row.first_mix_date ? String(row.first_mix_date) : null,
    });
  }
  return map;
}

function daysBetween(from: string | null, to: string | null): number | null {
  if (!from || !to) return null;
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return (b - a) / (1000 * 60 * 60 * 24);
}

/**
 * Calcola il punteggio di affidabilità per-lotto (0..1):
 * - purityRatio = giorni puro (arrivo → primo mix) / giorni di vita totali (arrivo → oggi).
 *   Lotto rimasto a lungo puro → alta affidabilità; mescolato presto → bassa.
 * - dominance = quota del lotto nella coorte (più domina, più la sopravvivenza coorte lo rappresenta).
 */
function computeLotReliabilityScore(
  percentage: number,
  purity: { arrivalDate: string | null; firstMixDate: string | null } | undefined,
  referenceDate: string
): number {
  const dominance = Math.max(0, Math.min(1, percentage || 0));

  let purityRatio: number;
  const lifeDays = daysBetween(purity?.arrivalDate ?? null, referenceDate);
  const pureDays = daysBetween(purity?.arrivalDate ?? null, purity?.firstMixDate ?? null);
  if (lifeDays == null || lifeDays <= 0 || pureDays == null) {
    // Dati insufficienti: ci si basa solo sulla dominanza.
    return dominance;
  }
  purityRatio = Math.max(0, Math.min(1, pureDays / lifeDays));

  return W_PURITY * purityRatio + W_DOMINANCE * dominance;
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
    reliability: "media",
    reliabilityScore: 0,
  };
}

/**
 * Arricchisce una coorte con la stima per-lotto (Fase 4): vivi correnti stimati, sopravvivenza
 * e semaforo di affidabilità per ogni lotto, più l'affidabilità complessiva della coorte.
 */
function enrichWithLotEstimates(
  survival: CohortSurvival,
  composition: { lotId: number; animalCount: number; percentage: number }[],
  purityMap: Map<number, { arrivalDate: string | null; firstMixDate: string | null }>,
  referenceDate: string
): void {
  if (composition.length === 0) {
    survival.composition = [];
    survival.reliabilityScore = 0;
    survival.reliability = "bassa";
    return;
  }

  // Ripartizione pro-quota dei vivi correnti, preservando la somma esatta.
  const fractions = composition.map((e) => e.percentage || 0);
  const fracSum = fractions.reduce((a, b) => a + b, 0);
  // Se le quote non sommano a ~1 (dati legacy), normalizza per la distribuzione.
  const normFractions =
    fracSum > 0 ? fractions.map((f) => f / fracSum) : composition.map(() => 1 / composition.length);
  const estimates = distributePreservingSum(normFractions, survival.currentLiveCount);

  const cohortSurvivalRate = survival.survivalRate;
  let weightedScore = 0;
  let weightSum = 0;

  survival.composition = composition.map((e, idx) => {
    const score = computeLotReliabilityScore(e.percentage, purityMap.get(e.lotId), referenceDate);
    const weight = Math.max(0, e.percentage || 0);
    weightedScore += score * weight;
    weightSum += weight;
    return {
      lotId: e.lotId,
      animalCount: e.animalCount,
      percentage: e.percentage,
      estimatedLiveCount: estimates[idx] ?? 0,
      survivalRate: cohortSurvivalRate,
      reliability: scoreToReliability(score),
      reliabilityScore: Number(score.toFixed(3)),
    };
  });

  const cohortScore = weightSum > 0 ? weightedScore / weightSum : 0;
  survival.reliabilityScore = Number(cohortScore.toFixed(3));
  survival.reliability = scoreToReliability(cohortScore);
}

/** Elenca tutte le coorti con la loro sopravvivenza misurata e affidabilità complessiva (Fase 4). */
export async function listCohortSurvival(): Promise<CohortSurvival[]> {
  const allCohorts = await db
    .select()
    .from(cohorts)
    .orderBy(sql`${cohorts.mixDate} DESC, ${cohorts.id} DESC`);
  if (allCohorts.length === 0) return [];

  const [liveMap, allComposition, purityMap] = await Promise.all([
    computeCurrentLiveByCohort(),
    db.select().from(cohortComposition),
    loadLotPurityData(),
  ]);

  const compByCohort = new Map<number, { lotId: number; animalCount: number; percentage: number }[]>();
  for (const row of allComposition) {
    const list = compByCohort.get(row.cohortId) ?? [];
    list.push({ lotId: row.lotId, animalCount: row.animalCount, percentage: row.percentage });
    compByCohort.set(row.cohortId, list);
  }

  const referenceDate = new Date().toISOString().slice(0, 10);
  return allCohorts.map((c) => {
    const survival = buildSurvival(c, liveMap.get(c.id));
    enrichWithLotEstimates(survival, compByCohort.get(c.id) ?? [], purityMap, referenceDate);
    // La lista non espone la composizione dettagliata (resta nel dettaglio).
    delete survival.composition;
    return survival;
  });
}

/** Dettaglio di una singola coorte: sopravvivenza + composizione per lotto con stime e affidabilità (Fase 4). */
export async function getCohortSurvival(cohortId: number): Promise<CohortSurvival | null> {
  const [cohort] = await db.select().from(cohorts).where(eq(cohorts.id, cohortId)).limit(1);
  if (!cohort) return null;

  const [liveMap, composition, purityMap] = await Promise.all([
    computeCurrentLiveByCohort([cohortId]),
    db.select().from(cohortComposition).where(eq(cohortComposition.cohortId, cohortId)),
    loadLotPurityData(),
  ]);

  const survival = buildSurvival(cohort, liveMap.get(cohortId));
  const referenceDate = new Date().toISOString().slice(0, 10);
  enrichWithLotEstimates(
    survival,
    composition.map((row) => ({
      lotId: row.lotId,
      animalCount: row.animalCount,
      percentage: row.percentage,
    })),
    purityMap,
    referenceDate
  );

  return survival;
}
