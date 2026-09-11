/**
 * GrowthSimulationService
 * --------------------------------------------------------------------------
 * Servizio condiviso di simulazione crescita + mortalità giorno-per-giorno.
 *
 * Usato da:
 *  - GET /api/size-predictions               (Ceste in arrivo, daysToReach)
 *  - GET /api/size-predictions/stock-at-date (STOCK TP-XXXX+ @ data)
 *  - GrowthProjectionService (Proiezione Crescita mensile)
 *
 * Garantisce che tutti i moduli usino la STESSA logica di crescita/mortalità,
 * eliminando il gap di risultati fra i diversi report.
 *
 * Convenzioni:
 *  - weight in **mg** per animale (1_000_000 / weightMg = animali per kg)
 *  - SGR salvato in DB come % giornaliera; qui usato come frazione (sgr/100)
 *  - Mortality salvato in DB come % mensile; qui usato come frazione mensile,
 *    convertita in giornaliera dividendo per i giorni del mese corrente.
 */

import { db } from "../db";
import * as schema from "../../shared/schema";
import { storage } from "../storage";
import {
  findSizeInRanges,
  toBusinessIsoDate,
  type SizeRangeCandidate,
} from "../utils/size-determination";

const MONTH_NAMES_IT = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
];

export const SALE_SIZE_THRESHOLDS: Array<{ size: string; maxAnimalsPerKg: number }> = [
  { size: "TP-10000", maxAnimalsPerKg: 1200 },
  { size: "TP-9000", maxAnimalsPerKg: 1800 },
  { size: "TP-8000", maxAnimalsPerKg: 2300 },
  { size: "TP-7000", maxAnimalsPerKg: 3000 },
  { size: "TP-6000", maxAnimalsPerKg: 3900 },
  { size: "TP-5500", maxAnimalsPerKg: 6000 },
  { size: "TP-5000", maxAnimalsPerKg: 9000 },
  { size: "TP-4500", maxAnimalsPerKg: 13000 },
  { size: "TP-4000", maxAnimalsPerKg: 15000 },
  { size: "TP-3500", maxAnimalsPerKg: 20000 },
  { size: "TP-3000", maxAnimalsPerKg: 29000 },
  { size: "TP-2800", maxAnimalsPerKg: 40000 },
  { size: "TP-2500", maxAnimalsPerKg: 70000 },
  { size: "TP-2000", maxAnimalsPerKg: 97000 },
  { size: "TP-1900", maxAnimalsPerKg: 120000 },
  { size: "TP-1800", maxAnimalsPerKg: 190000 },
  { size: "TP-1500", maxAnimalsPerKg: 300000 },
  { size: "TP-1260", maxAnimalsPerKg: 350000 },
  { size: "TP-1140", maxAnimalsPerKg: 600000 },
  { size: "TP-1000", maxAnimalsPerKg: 880000 },
  { size: "TP-800", maxAnimalsPerKg: 1_000_000 },
  { size: "TP-700", maxAnimalsPerKg: 1_900_000 },
  { size: "TP-600", maxAnimalsPerKg: 2_000_000 },
  { size: "TP-500", maxAnimalsPerKg: 8_000_000 },
  { size: "TP-450", maxAnimalsPerKg: 15_000_000 },
  { size: "TP-350", maxAnimalsPerKg: 20_000_000 },
  { size: "TP-300", maxAnimalsPerKg: 30_000_000 },
  { size: "TP-250", maxAnimalsPerKg: 70_000_000 },
  { size: "TP-180", maxAnimalsPerKg: Number.POSITIVE_INFINITY },
];

export function mapAnimalsPerKgToSizeCode(animalsPerKg: number): string {
  for (const t of SALE_SIZE_THRESHOLDS) {
    if (animalsPerKg <= t.maxAnimalsPerKg) return t.size;
  }
  return "TP-180";
}

export const FALLBACK_MONTHLY_MORTALITY = 0.03; // 3 %/mese

export interface GrowthSimulationContext {
  allSizes: any[];
  sizeRangeVersions: Array<SizeRangeCandidate & {
    validFrom: string;
    validTo: string | null;
  }>;
  /** "monthLower|sizeId" → frazione giornaliera (es. 0.025) */
  sgrByMonthAndSize: Record<string, number>;
  /** "monthLower" → frazione giornaliera */
  sgrFallbackByMonth: Record<string, number>;
  /** fallback globale (media SGR) come frazione giornaliera */
  globalFallback: number;
  /** "month1Based|TP-XXXX" → frazione mensile (es. 0.01) */
  mortalityByMonthAndSize: Record<string, number>;
  /** Trova size_id più adatto per un peso in mg */
  findSizeIdForWeight: (weightMg: number, atDate: Date) => number | null;
}

export function findProjectedSize(
  weightMg: number,
  atDate: Date,
  versions: GrowthSimulationContext["sizeRangeVersions"],
): SizeRangeCandidate | null {
  if (!Number.isFinite(weightMg) || weightMg <= 0) return null;
  const isoDate = toBusinessIsoDate(atDate);
  const activeRanges = versions.filter(
    (range) =>
      range.validFrom <= isoDate &&
      (range.validTo === null || range.validTo >= isoDate),
  );
  return findSizeInRanges(1_000_000 / weightMg, activeRanges);
}
/**
 * Carica una sola volta tutte le strutture dati necessarie alla simulazione.
 * Costoso: chiamare una volta per richiesta e riusare.
 */
export async function loadGrowthSimulationContext(): Promise<GrowthSimulationContext> {
  const [allSizes, rangeVersions, sgrs, sgrPerTagliaAll, mortalityRows] = await Promise.all([
    storage.getSizes(),
    db.select({
      sizeId: schema.sizeRangeVersions.sizeId,
      minAnimalsPerKg: schema.sizeRangeVersions.minAnimalsPerKg,
      maxAnimalsPerKg: schema.sizeRangeVersions.maxAnimalsPerKg,
      validFrom: schema.sizeRangeVersions.validFrom,
      validTo: schema.sizeRangeVersions.validTo,
    }).from(schema.sizeRangeVersions),
    storage.getSgrs(),
    storage.getSgrPerTaglia(),
    db.select().from(schema.projectionMortalityRates),
  ]);

  const sgrFallbackByMonth: Record<string, number> = {};
  for (const s of sgrs as any[]) {
    if (s.month && s.percentage != null) {
      sgrFallbackByMonth[s.month.toLowerCase()] = s.percentage / 100;
    }
  }
  const globalFallback =
    sgrs.length > 0
      ? (sgrs as any[]).reduce((a, s) => a + s.percentage, 0) / sgrs.length / 100
      : 0.037;

  const sgrByMonthAndSize: Record<string, number> = {};
  for (const s of sgrPerTagliaAll as any[]) {
    if (s.month && s.sizeId != null && s.calculatedSgr != null) {
      sgrByMonthAndSize[`${s.month.toLowerCase()}|${s.sizeId}`] = s.calculatedSgr / 100;
    }
  }

  const mortalityByMonthAndSize: Record<string, number> = {};
  for (const m of mortalityRows as any[]) {
    if (m.sizeName && m.month && m.monthlyPercentage != null) {
      mortalityByMonthAndSize[`${m.month}|${m.sizeName}`] = m.monthlyPercentage / 100;
    }
  }

  const normalizedRangeVersions = rangeVersions.map((range) => ({
    ...range,
    code: String((allSizes as any[]).find((size) => size.id === range.sizeId)?.code ?? range.sizeId),
    validFrom: String(range.validFrom),
    validTo: range.validTo ? String(range.validTo) : null,
  }));
  const findSizeIdForWeight = (weightMg: number, atDate: Date): number | null =>
    findProjectedSize(weightMg, atDate, normalizedRangeVersions)?.sizeId ?? null;

  return {
    allSizes,
    sizeRangeVersions: normalizedRangeVersions,
    sgrByMonthAndSize,
    sgrFallbackByMonth,
    globalFallback,
    mortalityByMonthAndSize,
    findSizeIdForWeight,
  };
}

function getSgrForWeightInMonth(
  ctx: GrowthSimulationContext,
  weightMg: number,
  date: Date,
): number {
  const monthLower = MONTH_NAMES_IT[date.getMonth()];
  const sizeId = ctx.findSizeIdForWeight(weightMg, date);
  if (sizeId != null) {
    const v = ctx.sgrByMonthAndSize[`${monthLower}|${sizeId}`];
    if (v !== undefined) return v;
  }
  if (ctx.sgrFallbackByMonth[monthLower] !== undefined) {
    return ctx.sgrFallbackByMonth[monthLower];
  }
  return ctx.globalFallback;
}

function getMonthlyMortalityForWeight(
  ctx: GrowthSimulationContext,
  weightMg: number,
  date: Date,
): number {
  const size = findProjectedSize(weightMg, date, ctx.sizeRangeVersions);
  return size
    ? ctx.mortalityByMonthAndSize[`${date.getMonth() + 1}|${size.code}`] ?? FALLBACK_MONTHLY_MORTALITY
    : FALLBACK_MONTHLY_MORTALITY;
}

/**
 * Avanza lo stato di una cesta di **un giorno di calendario**.
 * Applica:
 *  - SGR composto giornaliero (frazione, non percentuale) su weightMg
 *  - mortalità giornaliera = (mortalità mensile della taglia attuale) / giorni del mese
 *
 * @param overrideMonthlyMortality se passato, sostituisce la mortalità da DB
 *        (usato dalla Proiezione Crescita per la modalità "% personalizzata").
 */
export function stepOneDay(
  ctx: GrowthSimulationContext,
  state: { weightMg: number; count: number },
  date: Date,
  overrideMonthlyMortality?: number
): { weightMg: number; count: number } {
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const sgr = getSgrForWeightInMonth(ctx, state.weightMg, date);
  const newWeight = state.weightMg * (1 + sgr);

  const monthlyMortality =
    overrideMonthlyMortality !== undefined
      ? overrideMonthlyMortality
      : getMonthlyMortalityForWeight(ctx, newWeight, date);
  const dailyMortality = monthlyMortality / daysInMonth;
  const newCount = state.count * (1 - dailyMortality);

  return { weightMg: newWeight, count: newCount };
}

/**
 * Simula in avanti una singola cesta su `maxDays` giorni di calendario,
 * partendo da `today`.
 *
 * Se `targetWeightMg` è valorizzato, ritorna `daysToReach` al primo giorno
 * in cui weight ≥ target (e si ferma).
 * Se `null`, simula esattamente `maxDays` giorni e restituisce stato finale.
 */
export function simulateForward(
  ctx: GrowthSimulationContext,
  startWeightMg: number,
  startCount: number,
  maxDays: number,
  options: {
    today?: Date;
    targetWeightMg?: number | null;
    targetWeightMgForDate?: (date: Date) => number | null;
    targetSizeId?: number | null;
    overrideMonthlyMortality?: number;
  } = {}
): { daysToReach: number | null; finalWeightMg: number; finalCount: number } {
  const today = options.today ?? new Date();
  const targetWeightMg = options.targetWeightMg ?? null;
  const targetSizeId = options.targetSizeId ?? null;

  let weight = startWeightMg;
  let count = startCount;
  let daysToReach: number | null = null;
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (let day = 1; day <= maxDays; day++) {
    cursor.setDate(cursor.getDate() + 1);
    const next = stepOneDay(ctx, { weightMg: weight, count }, cursor, options.overrideMonthlyMortality);
    weight = next.weightMg;
    count = next.count;

    const datedTargetRange = targetSizeId !== null
      ? findRangeForSize(targetSizeId, cursor, ctx.sizeRangeVersions)
      : null;
    const targetForDate = options.targetWeightMgForDate
      ? options.targetWeightMgForDate(new Date(cursor))
      : datedTargetRange
        ? 1_000_000 / datedTargetRange.maxAnimalsPerKg
        : targetWeightMg;
    if (targetForDate !== null && daysToReach === null && weight >= targetForDate) {
      daysToReach = day;
      break;
    }
  }

  return { daysToReach, finalWeightMg: weight, finalCount: count };
}

export function findRangeForSize(
  sizeId: number,
  atDate: Date,
  versions: GrowthSimulationContext["sizeRangeVersions"],
) {
  const isoDate = toBusinessIsoDate(atDate);
  return versions.find(
    (range) =>
      range.sizeId === sizeId &&
      range.validFrom <= isoDate &&
      (range.validTo === null || range.validTo >= isoDate),
  ) ?? null;
}
