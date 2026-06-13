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
  estimatedExitCount: number; // FASE 5: usciti dichiarati stimati (venduti+trasferiti+ri-vagliati) × quota
  estimatedMortalityCount: number; // FASE 5: mortalità reale stimata × quota
  survivalRate: number | null; // FASE 4: sopravvivenza del lotto (= sopravvivenza coorte, pro-quota)
  mortalityRate: number | null; // FASE 5: mortalità reale del lotto (= mortalità coorte, pro-quota)
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
  currentLiveCount: number; // vivi correnti (cicli attivi ancora nella coorte)
  activeCycles: number; // numero cicli attivi collegati
  survivalRate: number | null; // vivi correnti ÷ vivi iniziali (0..1), null se iniziale = 0
  // ===== FASE 5: distinzione morti vs usciti (vendita/trasferimento/ri-vagliatura) =====
  soldCount: number; // usciti per vendita
  transferredCount: number; // usciti per trasferimento ad altra cesta
  resortedCount: number; // usciti per ri-vagliatura → passati ad un'altra coorte
  exitCount: number; // usciti dichiarati totali = sold + transferred + resorted
  mortalityCount: number; // mortalità reale = vivi iniziali − vivi correnti − usciti (clamp ≥ 0)
  mortalityRate: number | null; // mortalità reale ÷ vivi iniziali (0..1), null se iniziale = 0
  realSurvivalRate: number | null; // (vivi iniziali − mortalità) ÷ vivi iniziali = 1 − mortalityRate
  reliability: Reliability; // FASE 4: affidabilità complessiva della coorte
  reliabilityScore: number; // FASE 4: punteggio 0..1 (media pesata sui lotti)
  composition?: CohortCompositionEntry[];
}

/** Uscite dichiarate di una coorte, separate dalla mortalità reale (Fase 5). */
export interface CohortExits {
  sold: number; // venduti (vendita / selezione-vendita, incl. quota venduta in vagliatura)
  transferred: number; // trasferiti ad altra cesta (lasciano la coorte)
  resorted: number; // ri-vagliati: passati ad un'altra coorte (mescolamento successivo)
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
 * FASE 5 — Calcola le USCITE DICHIARATE di ciascuna coorte, distinte dalla mortalità reale.
 *
 * Per ogni ciclo CHIUSO collegato alla coorte si guarda l'ultima operazione (la disposizione
 * finale degli animali) e la si classifica:
 *  - `vendita` / `selezione-vendita` → VENDUTI (escono dal sistema).
 *  - `trasferimento` → TRASFERITI (la cesta di destinazione NON eredita la coorte → lasciano la coorte).
 *  - `vagliatura` / `chiusura-ciclo-vagliatura` → gli animali entrano in una vagliatura:
 *      • se la destinazione resta nella STESSA coorte (avanzamento/carry-forward) → NON è un'uscita
 *        (sono già contati nei "vivi correnti" tramite il ciclo attivo di destinazione → si esclude
 *        per evitare doppio conteggio);
 *      • se la destinazione va in un'ALTRA coorte (mescolamento) → RI-VAGLIATI (escono da questa coorte).
 *        La quota eventualmente venduta nella stessa vagliatura viene attribuita a VENDUTI.
 *  - altri tipi terminali (cessazione, chiusura-ciclo manuale, …) NON sono uscite → restano nel
 *    residuo che diventa mortalità reale.
 *
 * Nessun tipo di uscita può sovrapporsi ai "vivi correnti": vendita/cessazione chiudono il ciclo
 * senza rimpiazzo, il trasferimento crea un ciclo senza coorte, e la ri-vagliatura è contata solo
 * quando porta fuori dalla coorte. Così "vivi correnti + uscite" non doppia mai gli stessi animali.
 */
async function computeExitsByCohort(
  cohortIds?: number[]
): Promise<Map<number, CohortExits>> {
  const filter =
    cohortIds && cohortIds.length > 0
      ? sql`AND c.cohort_id IN (${sql.join(cohortIds.map((n) => sql`${Number(n)}`), sql`, `)})`
      : sql``;

  const result = await db.execute(sql`
    WITH cohort_cycles AS (
      SELECT c.id AS cycle_id, c.cohort_id
      FROM cycles c
      WHERE c.cohort_id IS NOT NULL AND c.state = 'closed'
      ${filter}
    ),
    latest_op AS (
      SELECT DISTINCT ON (o.cycle_id)
        o.cycle_id, o.type, o.animal_count
      FROM operations o
      JOIN cohort_cycles cc ON cc.cycle_id = o.cycle_id
      WHERE o.cancelled_at IS NULL AND o.animal_count IS NOT NULL
      ORDER BY o.cycle_id, o.date DESC, o.id DESC
    ),
    classified AS (
      SELECT cc.cohort_id, lo.cycle_id, lo.type, lo.animal_count
      FROM latest_op lo
      JOIN cohort_cycles cc ON cc.cycle_id = lo.cycle_id
    ),
    -- Vagliatura che ha chiuso ogni ciclo origine (la più recente in cui compare come origine).
    src_sel AS (
      SELECT DISTINCT ON (ssb.cycle_id) ssb.cycle_id, ssb.selection_id
      FROM selection_source_baskets ssb
      JOIN selections s ON s.id = ssb.selection_id
      ORDER BY ssb.cycle_id, s.date DESC, ssb.selection_id DESC
    ),
    -- Dettaglio destinazioni della vagliatura, con la coorte di destinazione (NULL se venduta o senza ciclo).
    sel_dest_detail AS (
      SELECT sdb.selection_id,
        sdb.destination_type,
        dc.cohort_id AS dest_cohort,
        COALESCE(sdb.live_animals, sdb.animal_count, 0) AS live
      FROM selection_destination_baskets sdb
      LEFT JOIN cycles dc ON dc.id = sdb.cycle_id
    ),
    -- Totali per selezione: vivi totali in destinazione e quota venduta.
    sel_agg AS (
      SELECT selection_id,
        NULLIF(SUM(live), 0) AS total_a,
        COALESCE(SUM(live) FILTER (WHERE destination_type = 'sold'), 0) AS sold_a
      FROM sel_dest_detail
      GROUP BY selection_id
    ),
    -- Vivi posizionati che RESTANO nella stessa coorte (carry-forward), per coorte di destinazione.
    sel_samecohort AS (
      SELECT selection_id, dest_cohort AS cohort_id, SUM(live) AS same_a
      FROM sel_dest_detail
      WHERE destination_type IS DISTINCT FROM 'sold' AND dest_cohort IS NOT NULL
      GROUP BY selection_id, dest_cohort
    ),
    b AS (
      SELECT cl.cohort_id, cl.animal_count,
        cl.type IN ('vendita', 'selezione-vendita') AS is_sale,
        cl.type = 'trasferimento' AS is_transfer,
        cl.type IN ('chiusura-ciclo-vagliatura', 'vagliatura') AS is_vag,
        sa.sold_a, sa.total_a,
        COALESCE(ssc.same_a, 0) AS same_a
      FROM classified cl
      LEFT JOIN src_sel ss ON ss.cycle_id = cl.cycle_id
      LEFT JOIN sel_agg sa ON sa.selection_id = ss.selection_id
      -- carry-forward riferito alla coorte ORIGINE di questo ciclo (gestisce vagliature multi-coorte).
      LEFT JOIN sel_samecohort ssc ON ssc.selection_id = ss.selection_id AND ssc.cohort_id = cl.cohort_id
    )
    -- Allocazione a livello di destinazione (gestisce vagliature MISTE: parte carry-forward + parte
    -- venduta/ri-vagliata). La quota carry-forward (same_a) NON è un'uscita: resta nei vivi correnti.
    SELECT cohort_id,
      COALESCE(SUM(
        CASE
          WHEN is_sale THEN animal_count
          WHEN is_vag AND total_a IS NOT NULL
            THEN ROUND(animal_count * (sold_a::numeric / total_a))
          ELSE 0
        END
      ), 0)::bigint AS sold,
      COALESCE(SUM(CASE WHEN is_transfer THEN animal_count ELSE 0 END), 0)::bigint AS transferred,
      COALESCE(SUM(
        CASE
          WHEN is_vag AND total_a IS NOT NULL
            THEN ROUND(animal_count * (GREATEST(total_a - sold_a - same_a, 0)::numeric / total_a))
          ELSE 0
        END
      ), 0)::bigint AS resorted
    FROM b
    GROUP BY cohort_id
  `);

  const map = new Map<number, CohortExits>();
  for (const row of result.rows as any[]) {
    map.set(Number(row.cohort_id), {
      sold: Number(row.sold) || 0,
      transferred: Number(row.transferred) || 0,
      resorted: Number(row.resorted) || 0,
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
  live: { currentLive: number; activeCycles: number } | undefined,
  exits: CohortExits | undefined
): CohortSurvival {
  const currentLiveCount = live?.currentLive ?? 0;
  const activeCycles = live?.activeCycles ?? 0;
  const initial = cohort.initialAnimalCount || 0;

  // FASE 5 — Uscite dichiarate vs mortalità reale (principio "niente sparizioni").
  // Le uscite non possono superare ciò che resta dopo i vivi correnti.
  const soldRaw = exits?.sold ?? 0;
  const transferredRaw = exits?.transferred ?? 0;
  const resortedRaw = exits?.resorted ?? 0;
  const exitRaw = soldRaw + transferredRaw + resortedRaw;
  const exitCount = Math.max(0, Math.min(exitRaw, Math.max(0, initial - currentLiveCount)));
  // Se le uscite vengono limitate (anomalie/arrotondamenti), si riscalano proporzionalmente.
  const scale = exitRaw > 0 ? exitCount / exitRaw : 0;
  const soldCount = Math.round(soldRaw * scale);
  const transferredCount = Math.round(transferredRaw * scale);
  const resortedCount = Math.max(0, exitCount - soldCount - transferredCount);

  // Mortalità reale = vivi iniziali − vivi correnti − uscite dichiarate (clamp ≥ 0).
  const mortalityCount = Math.max(0, initial - currentLiveCount - exitCount);

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
    soldCount,
    transferredCount,
    resortedCount,
    exitCount,
    mortalityCount,
    mortalityRate: initial > 0 ? mortalityCount / initial : null,
    realSurvivalRate: initial > 0 ? (initial - mortalityCount) / initial : null,
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
  // FASE 5 — stessa ripartizione pro-quota anche per uscite e mortalità reale.
  const exitEstimates = distributePreservingSum(normFractions, survival.exitCount);
  const mortalityEstimates = distributePreservingSum(normFractions, survival.mortalityCount);

  const cohortSurvivalRate = survival.survivalRate;
  const cohortMortalityRate = survival.mortalityRate;
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
      estimatedExitCount: exitEstimates[idx] ?? 0,
      estimatedMortalityCount: mortalityEstimates[idx] ?? 0,
      survivalRate: cohortSurvivalRate,
      mortalityRate: cohortMortalityRate,
      reliability: scoreToReliability(score),
      reliabilityScore: Number(score.toFixed(3)),
    };
  });

  const cohortScore = weightSum > 0 ? weightedScore / weightSum : 0;
  survival.reliabilityScore = Number(cohortScore.toFixed(3));
  survival.reliability = scoreToReliability(cohortScore);
}

/** Elenca tutte le coorti con la loro sopravvivenza misurata e affidabilità complessiva (Fase 4). */
/**
 * Restituisce gli ID delle coorti che hanno almeno un ciclo ATTIVO collocato nel modulo (flupsy)
 * indicato. Usato per filtrare l'elenco coorti quando si arriva dal cruscotto di un singolo modulo.
 */
async function loadCohortIdsByFlupsy(flupsyId: number): Promise<Set<number>> {
  const result = await db.execute(sql`
    SELECT DISTINCT c.cohort_id
    FROM cycles c
    JOIN baskets b ON b.id = c.basket_id
    WHERE c.state = 'active' AND c.cohort_id IS NOT NULL AND b.flupsy_id = ${flupsyId}
  `);
  return new Set((result.rows as any[]).map((row) => Number(row.cohort_id)));
}

export async function listCohortSurvival(flupsyId?: number): Promise<CohortSurvival[]> {
  let allCohorts = await db
    .select()
    .from(cohorts)
    .orderBy(sql`${cohorts.mixDate} DESC, ${cohorts.id} DESC`);
  if (allCohorts.length === 0) return [];

  if (flupsyId != null && Number.isFinite(flupsyId)) {
    const cohortIds = await loadCohortIdsByFlupsy(flupsyId);
    allCohorts = allCohorts.filter((c) => cohortIds.has(c.id));
    if (allCohorts.length === 0) return [];
  }

  const [liveMap, exitsMap, allComposition, purityMap] = await Promise.all([
    computeCurrentLiveByCohort(),
    computeExitsByCohort(),
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
    const survival = buildSurvival(c, liveMap.get(c.id), exitsMap.get(c.id));
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

  const [liveMap, exitsMap, composition, purityMap] = await Promise.all([
    computeCurrentLiveByCohort([cohortId]),
    computeExitsByCohort([cohortId]),
    db.select().from(cohortComposition).where(eq(cohortComposition.cohortId, cohortId)),
    loadLotPurityData(),
  ]);

  const survival = buildSurvival(cohort, liveMap.get(cohortId), exitsMap.get(cohortId));
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
