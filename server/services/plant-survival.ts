/**
 * SERVIZIO CRUSCOTTO DI IMPIANTO — Fase 5 "Cruscotto di impianto".
 *
 * PRINCIPIO (coerente con Fasi 2-4):
 * - La sopravvivenza di impianto è la sintesi delle COORTI (l'unità contata della Fase 3/4),
 *   pesata sul VIVO ATTUALE (gli animali correntemente in vita nelle coorti).
 * - Ogni coorte porta i suoi animali vivi correnti distribuiti nei moduli (FLUPSY / raceway / bins)
 *   dove si trovano fisicamente i suoi cicli attivi. Attribuiamo la sopravvivenza misurata della
 *   coorte ai moduli in proporzione a dove sono i vivi correnti.
 * - Semaforo certo/stimato: un numero è CERTO se l'ultima operazione del ciclo è un conteggio
 *   (prima attivazione / vagliatura), STIMATO se è una misura/peso successiva (campione).
 * - La tendenza 30/90 giorni è il tasso a finestra mobile misurato alle vagliature
 *   (vivi in uscita ÷ vivi in ingresso), la "verità contata" nel tempo.
 */
import { db } from "../db";
import { sql } from "drizzle-orm";
import { listCohortSurvival } from "./cohort-survival";

export type ModuleType = "flupsy" | "raceway" | "bins";
export type CertaintyLevel = "certo" | "stimato";

export interface ModuleSurvival {
  flupsyId: number;
  name: string;
  moduleType: ModuleType;
  currentLive: number; // vivi correnti delle coorti presenti nel modulo (parte tracciata)
  totalLive: number; // vivi correnti TOTALI del modulo (cicli con e senza coorte)
  weightedSurvival: number | null; // sopravvivenza ponderata sul vivo (0..1), null se nessun dato
  certoFraction: number; // quota dei vivi il cui ultimo dato è un conteggio (0..1)
  certainty: CertaintyLevel; // semaforo certo/stimato del modulo
  activeCohorts: number; // numero coorti distinte con vivi nel modulo
}

export interface TypeSurvival {
  moduleType: ModuleType;
  currentLive: number; // vivi tracciati (coorti) di questo tipo modulo
  totalLive: number; // vivi totali di questo tipo modulo (con e senza coorte)
  weightedSurvival: number | null;
  certoFraction: number;
  certainty: CertaintyLevel;
  modules: number; // numero moduli di questo tipo con vivi correnti
}

export interface TrendPoint {
  date: string; // giorno (YYYY-MM-DD)
  rate30: number | null; // tasso a finestra mobile 30 giorni (0..1)
  rate90: number | null; // tasso a finestra mobile 90 giorni (0..1)
}

export interface PlantSurvival {
  summary: {
    currentLive: number; // vivi tracciati nelle coorti (base su cui è calcolata la sopravvivenza)
    totalPlantLive: number; // vivi correnti TOTALI dell'impianto (tutti i moduli, con e senza coorte)
    coverageFraction: number; // copertura = vivi tracciati ÷ vivi totali impianto (0..1)
    weightedSurvival: number | null;
    certoFraction: number;
    certainty: CertaintyLevel;
    activeCohorts: number;
    activeModules: number;
  };
  byType: TypeSurvival[];
  byModule: ModuleSurvival[];
  trend: TrendPoint[];
  generatedAt: string;
}

// Tipi di operazione che rappresentano un CONTEGGIO (verità contata) → certo.
// Tutto il resto (misura/peso/pulizia/trattamento) è una stima dal campione → stimato.
const COUNT_OP_TYPES = [
  "prima-attivazione",
  "prima-attivazione-da-vagliatura",
  "vagliatura",
  "chiusura-ciclo-vagliatura",
  "selezione-origine",
];

const CERTO_THRESHOLD = 0.999; // un modulo è "certo" solo se ~tutti i vivi vengono da un conteggio

function certaintyFromFraction(fraction: number): CertaintyLevel {
  return fraction >= CERTO_THRESHOLD ? "certo" : "stimato";
}

interface ModuleAccumulator {
  flupsyId: number;
  name: string;
  moduleType: ModuleType;
  liveTotal: number; // vivi tracciati nelle coorti presenti nel modulo
  totalLive: number; // vivi correnti TOTALI del modulo (cicli con e senza coorte)
  liveWithRate: number; // vivi appartenenti a coorti con un tasso di sopravvivenza calcolabile
  weightedNumerator: number; // Σ(tasso coorte × vivi nel modulo)
  certoLive: number;
  cohortIds: Set<number>;
}

/**
 * Per ogni ciclo ATTIVO collegato a una coorte, recupera i vivi correnti (ultima operazione con
 * conteggio), il modulo (flupsy) dove si trova e se l'ultimo dato è un conteggio (certo) o stima.
 */
async function loadActiveCohortCycleLive(): Promise<
  { flupsyId: number; cohortId: number; live: number; isCerto: boolean }[]
> {
  const result = await db.execute(sql`
    WITH active_cycle AS (
      SELECT c.id AS cycle_id, c.cohort_id, b.flupsy_id
      FROM cycles c
      JOIN baskets b ON b.id = c.basket_id
      WHERE c.state = 'active' AND c.cohort_id IS NOT NULL
    ),
    last_op AS (
      SELECT DISTINCT ON (o.cycle_id) o.cycle_id, o.animal_count, o.type
      FROM operations o
      JOIN active_cycle ac ON ac.cycle_id = o.cycle_id
      WHERE o.animal_count IS NOT NULL
      ORDER BY o.cycle_id, o.date DESC, o.id DESC
    )
    SELECT ac.flupsy_id, ac.cohort_id, lo.animal_count AS live, lo.type
    FROM active_cycle ac
    JOIN last_op lo ON lo.cycle_id = ac.cycle_id
  `);

  return (result.rows as any[]).map((row) => ({
    flupsyId: Number(row.flupsy_id),
    cohortId: Number(row.cohort_id),
    live: Number(row.live) || 0,
    isCerto: COUNT_OP_TYPES.includes(String(row.type)),
  }));
}

/**
 * Vivi correnti TOTALI per modulo: somma dell'ultimo conteggio di OGNI ciclo attivo
 * (con e senza coorte, tutti i tipi di modulo incluse le raceway). Serve a mostrare la
 * giacenza viva totale dell'impianto accanto alla parte tracciata nelle coorti.
 */
async function loadTotalLiveByModule(): Promise<Map<number, number>> {
  const result = await db.execute(sql`
    WITH active_cycle AS (
      SELECT c.id AS cycle_id, b.flupsy_id
      FROM cycles c
      JOIN baskets b ON b.id = c.basket_id
      WHERE c.state = 'active'
    ),
    last_op AS (
      SELECT DISTINCT ON (o.cycle_id) o.cycle_id, o.animal_count
      FROM operations o
      JOIN active_cycle ac ON ac.cycle_id = o.cycle_id
      WHERE o.animal_count IS NOT NULL
      ORDER BY o.cycle_id, o.date DESC, o.id DESC
    )
    SELECT ac.flupsy_id, COALESCE(SUM(lo.animal_count), 0)::bigint AS total_live
    FROM active_cycle ac
    LEFT JOIN last_op lo ON lo.cycle_id = ac.cycle_id
    GROUP BY ac.flupsy_id
  `);
  const map = new Map<number, number>();
  for (const row of result.rows as any[]) {
    map.set(Number(row.flupsy_id), Number(row.total_live) || 0);
  }
  return map;
}

/** Carica anagrafica moduli (id → nome, tipo). */
async function loadFlupsyInfo(): Promise<Map<number, { name: string; moduleType: ModuleType }>> {
  const result = await db.execute(sql`
    SELECT id, name, COALESCE(module_type, 'flupsy') AS module_type FROM flupsys
  `);
  const map = new Map<number, { name: string; moduleType: ModuleType }>();
  for (const row of result.rows as any[]) {
    map.set(Number(row.id), {
      name: String(row.name),
      moduleType: (String(row.module_type) as ModuleType) || "flupsy",
    });
  }
  return map;
}

/**
 * Tendenza a finestra mobile misurata alle vagliature completate.
 * @param days  Numero di giorni da mostrare sull'asse x (default 90; max 365).
 *              Il DB viene interrogato su un intervallo più ampio (days + 90) per coprire
 *              la finestra mobile di 90 giorni anche all'inizio del grafico.
 */
async function computeTrend(days: number = 90): Promise<TrendPoint[]> {
  const fetchDays = days + 90; // buffer extra per la finestra trailing di 90 gg al primo punto
  const result = await db.execute(sql`
    SELECT s.date::text AS date,
      (SELECT COALESCE(SUM(ssb.animal_count), 0)
         FROM selection_source_baskets ssb WHERE ssb.selection_id = s.id) AS src,
      (SELECT COALESCE(SUM(COALESCE(sdb.live_animals, sdb.animal_count)), 0)
         FROM selection_destination_baskets sdb WHERE sdb.selection_id = s.id) AS dst
    FROM selections s
    WHERE s.status = 'completed' AND s.purpose = 'vagliatura'
      AND s.date >= (CURRENT_DATE - (${fetchDays} * INTERVAL '1 day'))
  `);

  // Punti misurati: (timestamp giorno, src, dst), solo dove ingresso > 0 e uscita ≤ ingresso (anomalie escluse).
  const points = (result.rows as any[])
    .map((row) => ({
      t: new Date(String(row.date)).getTime(),
      src: Number(row.src) || 0,
      dst: Number(row.dst) || 0,
    }))
    .filter((p) => Number.isFinite(p.t) && p.src > 0 && p.dst <= p.src);

  const DAY = 24 * 60 * 60 * 1000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const trend: TrendPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const dayEnd = today.getTime() - i * DAY;
    const win30 = dayEnd - 30 * DAY;
    const win90 = dayEnd - 90 * DAY;
    let src30 = 0, dst30 = 0, src90 = 0, dst90 = 0;
    for (const p of points) {
      if (p.t <= dayEnd && p.t > win90) {
        src90 += p.src; dst90 += p.dst;
        if (p.t > win30) { src30 += p.src; dst30 += p.dst; }
      }
    }
    trend.push({
      date: new Date(dayEnd).toISOString().slice(0, 10),
      rate30: src30 > 0 ? dst30 / src30 : null,
      rate90: src90 > 0 ? dst90 / src90 : null,
    });
  }
  return trend;
}

/** Calcola il cruscotto di impianto (Fase 5): sintesi, per tipo modulo, per singolo modulo, tendenza. */
export async function getPlantSurvival(days: number = 90): Promise<PlantSurvival> {
  const [cohorts, cycleLive, totalLiveByModule, flupsyInfo, trend] = await Promise.all([
    listCohortSurvival(),
    loadActiveCohortCycleLive(),
    loadTotalLiveByModule(),
    loadFlupsyInfo(),
    computeTrend(days),
  ]);

  const rateByCohort = new Map<number, number | null>();
  for (const c of cohorts) rateByCohort.set(c.id, c.survivalRate);

  // Accumula per modulo.
  const modules = new Map<number, ModuleAccumulator>();
  for (const row of cycleLive) {
    const info = flupsyInfo.get(row.flupsyId);
    if (!info) continue;
    let acc = modules.get(row.flupsyId);
    if (!acc) {
      acc = {
        flupsyId: row.flupsyId,
        name: info.name,
        moduleType: info.moduleType,
        liveTotal: 0,
        totalLive: 0,
        liveWithRate: 0,
        weightedNumerator: 0,
        certoLive: 0,
        cohortIds: new Set<number>(),
      };
      modules.set(row.flupsyId, acc);
    }
    acc.liveTotal += row.live;
    acc.cohortIds.add(row.cohortId);
    if (row.isCerto) acc.certoLive += row.live;
    const rate = rateByCohort.get(row.cohortId);
    if (rate != null && Number.isFinite(rate)) {
      acc.liveWithRate += row.live;
      acc.weightedNumerator += rate * row.live;
    }
  }

  // Integra i vivi TOTALI di ogni modulo attivo (cicli con e senza coorte, raceway incluse).
  // Crea anche i moduli che hanno vivi ma nessuna coorte tracciata, così ogni settore di
  // allevamento è rappresentato nel cruscotto.
  for (const [flupsyId, totalLive] of totalLiveByModule) {
    if (totalLive <= 0) continue;
    const info = flupsyInfo.get(flupsyId);
    if (!info) continue;
    let acc = modules.get(flupsyId);
    if (!acc) {
      acc = {
        flupsyId,
        name: info.name,
        moduleType: info.moduleType,
        liveTotal: 0,
        totalLive: 0,
        liveWithRate: 0,
        weightedNumerator: 0,
        certoLive: 0,
        cohortIds: new Set<number>(),
      };
      modules.set(flupsyId, acc);
    }
    acc.totalLive = totalLive;
  }

  const byModule: ModuleSurvival[] = Array.from(modules.values())
    .filter((m) => m.totalLive > 0 || m.liveTotal > 0)
    .map((m) => {
      const certoFraction = m.liveTotal > 0 ? m.certoLive / m.liveTotal : 0;
      return {
        flupsyId: m.flupsyId,
        name: m.name,
        moduleType: m.moduleType,
        currentLive: m.liveTotal,
        totalLive: m.totalLive,
        weightedSurvival: m.liveWithRate > 0 ? m.weightedNumerator / m.liveWithRate : null,
        certoFraction,
        certainty: certaintyFromFraction(certoFraction),
        activeCohorts: m.cohortIds.size,
      };
    })
    .sort((a, b) => b.totalLive - a.totalLive);

  // Aggrega per tipo modulo.
  const typeAcc = new Map<
    ModuleType,
    { live: number; totalLive: number; liveWithRate: number; weightedNumerator: number; certoLive: number; modules: number }
  >();
  for (const m of modules.values()) {
    if (m.totalLive <= 0 && m.liveTotal <= 0) continue;
    let t = typeAcc.get(m.moduleType);
    if (!t) {
      t = { live: 0, totalLive: 0, liveWithRate: 0, weightedNumerator: 0, certoLive: 0, modules: 0 };
      typeAcc.set(m.moduleType, t);
    }
    t.live += m.liveTotal;
    t.totalLive += m.totalLive;
    t.liveWithRate += m.liveWithRate;
    t.weightedNumerator += m.weightedNumerator;
    t.certoLive += m.certoLive;
    t.modules += 1;
  }

  const TYPE_ORDER: ModuleType[] = ["flupsy", "raceway", "bins"];
  const byType: TypeSurvival[] = TYPE_ORDER.filter((t) => typeAcc.has(t)).map((moduleType) => {
    const t = typeAcc.get(moduleType)!;
    const certoFraction = t.live > 0 ? t.certoLive / t.live : 0;
    return {
      moduleType,
      currentLive: t.live,
      totalLive: t.totalLive,
      weightedSurvival: t.liveWithRate > 0 ? t.weightedNumerator / t.liveWithRate : null,
      certoFraction,
      certainty: certaintyFromFraction(certoFraction),
      modules: t.modules,
    };
  });

  // Sintesi di impianto.
  let totalLive = 0, totalLiveWithRate = 0, totalWeighted = 0, totalCerto = 0;
  const allCohorts = new Set<number>();
  for (const m of modules.values()) {
    if (m.liveTotal <= 0) continue;
    totalLive += m.liveTotal;
    totalLiveWithRate += m.liveWithRate;
    totalWeighted += m.weightedNumerator;
    totalCerto += m.certoLive;
    m.cohortIds.forEach((id) => allCohorts.add(id));
  }
  const summaryCertoFraction = totalLive > 0 ? totalCerto / totalLive : 0;

  // Vivi totali dell'impianto (tutti i moduli attivi) e copertura della parte tracciata.
  let totalPlantLive = 0;
  for (const v of totalLiveByModule.values()) totalPlantLive += v;
  const coverageFraction = totalPlantLive > 0 ? totalLive / totalPlantLive : 0;

  return {
    summary: {
      currentLive: totalLive,
      totalPlantLive,
      coverageFraction,
      weightedSurvival: totalLiveWithRate > 0 ? totalWeighted / totalLiveWithRate : null,
      certoFraction: summaryCertoFraction,
      certainty: certaintyFromFraction(summaryCertoFraction),
      activeCohorts: allCohorts.size,
      activeModules: byModule.length,
    },
    byType,
    byModule,
    trend,
    generatedAt: new Date().toISOString(),
  };
}
