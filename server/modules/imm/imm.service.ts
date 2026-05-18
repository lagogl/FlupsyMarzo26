import { db } from "../../db";
import { sql } from "drizzle-orm";

export type IMMComponents = {
  immSize: number;
  immTime: number;
};

export type CycleIMM = {
  cycleId: number;
  basketId: number;
  physicalNumber: number;
  flupsyId: number;
  flupsyName: string;
  lotId: number | null;
  qualityClass: string | null;
  startDate: string;
  semeApk: number | null;
  currApk: number | null;
  currAnimalCount: number | null;
  currSizeCode: string | null;
  currDate: string | null;
  daysElapsed: number;
  sgrDaily: number;
  daysRemaining: number | null;
  imm: number;
  components: IMMComponents;
};

export type IMMAggregate = {
  scope: string;
  scopeId: number | null;
  scopeName: string;
  animalCount: number;
  cycleCount: number;
  imm: number;
};

export type IMMDistributionBin = {
  range: string;
  minImm: number;
  maxImm: number;
  animalCount: number;
  cycleCount: number;
  pctOfTotal: number;
};

export type IMMInventoryResult = {
  config: {
    targetSizeCode: string;
    targetMinApk: number;
    horizonDays: number;
    weightSize: number;
    weightTime: number;
    fallbackSgrDaily: number;
  };
  totals: {
    totalAnimals: number;
    totalCycles: number;
    immGlobal: number;
  };
  distribution: IMMDistributionBin[];
  byFlupsy: IMMAggregate[];
  byLot: IMMAggregate[];
  cycles: CycleIMM[];
};

export type IMMConfig = {
  targetSizeCode: string;
  horizonDays: number;
  weightSize: number;
  weightTime: number;
  fallbackSgrDaily: number;
};

export const DEFAULT_IMM_CONFIG: IMMConfig = {
  targetSizeCode: "TP-3000",
  horizonDays: 180,
  weightSize: 40,
  weightTime: 35,
  fallbackSgrDaily: 0.005,
};

type RawRow = {
  cycle_id: number;
  basket_id: number;
  physical_number: number;
  flupsy_id: number;
  flupsy_name: string;
  lot_id: number | null;
  quality_class: string | null;
  start_date: string;
  seme_apk: number | null;
  seme_date: string | null;
  curr_apk: number | null;
  curr_animal_count: number | null;
  curr_size_id: number | null;
  curr_size_code: string | null;
  curr_date: string | null;
};

function daysBetween(a: string, b: string): number {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.max(0, Math.round((db - da) / 86400000));
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

function computeImmSize(semeApk: number, currApk: number, targetApk: number): number {
  if (!isFinite(semeApk) || !isFinite(currApk) || !isFinite(targetApk)) return 0;
  if (currApk <= targetApk) return 100;
  if (semeApk <= targetApk) return 100;
  if (currApk >= semeApk) return 0;
  const num = Math.log(semeApk) - Math.log(currApk);
  const den = Math.log(semeApk) - Math.log(targetApk);
  if (den <= 0) return 0;
  return clamp(100 * (num / den), 0, 100);
}

function computeSgrDaily(
  semeApk: number | null,
  currApk: number | null,
  daysElapsed: number,
  fallback: number,
): number {
  if (!semeApk || !currApk || daysElapsed <= 0 || currApk >= semeApk) return fallback;
  const sgr = (Math.log(semeApk) - Math.log(currApk)) / daysElapsed;
  return sgr > 0 ? sgr : fallback;
}

function computeDaysRemaining(currApk: number, targetApk: number, sgrDaily: number): number {
  if (currApk <= targetApk) return 0;
  if (sgrDaily <= 0) return Number.POSITIVE_INFINITY;
  return (Math.log(currApk) - Math.log(targetApk)) / sgrDaily;
}

function computeImmTime(daysRemaining: number, horizon: number): number {
  if (!isFinite(daysRemaining)) return 0;
  if (daysRemaining <= 0) return 100;
  if (daysRemaining >= horizon) return 0;
  return clamp(100 * (1 - daysRemaining / horizon), 0, 100);
}

function weightedAvg(items: Array<{ imm: number; w: number }>): number {
  let sumW = 0;
  let sumIW = 0;
  for (const it of items) {
    if (it.w > 0 && isFinite(it.imm)) {
      sumW += it.w;
      sumIW += it.imm * it.w;
    }
  }
  return sumW > 0 ? sumIW / sumW : 0;
}

export async function computeInventoryIMM(
  configOverride: Partial<IMMConfig> = {},
): Promise<IMMInventoryResult> {
  const config: IMMConfig = { ...DEFAULT_IMM_CONFIG, ...configOverride };

  const targetRow = await db.execute(sql`
    SELECT code, min_animals_per_kg
    FROM sizes
    WHERE code = ${config.targetSizeCode}
    LIMIT 1
  `);
  const targetRec = (targetRow.rows?.[0] ?? (targetRow as any)[0]) as
    | { code: string; min_animals_per_kg: number }
    | undefined;
  if (!targetRec || !targetRec.min_animals_per_kg) {
    throw new Error(`Taglia target non valida: ${config.targetSizeCode}`);
  }
  const targetApk = Number(targetRec.min_animals_per_kg);

  const result = await db.execute(sql`
    WITH active AS (
      SELECT c.id AS cycle_id, c.basket_id, c.lot_id, c.quality_class, c.start_date,
             b.physical_number, b.flupsy_id, f.name AS flupsy_name
      FROM cycles c
      JOIN baskets b ON b.id = c.basket_id
      JOIN flupsys f ON f.id = b.flupsy_id
      WHERE c.state = 'active'
    ),
    ranked AS (
      SELECT o.cycle_id, o.animals_per_kg, o.animal_count, o.size_id, o.date,
             s.code AS size_code,
             ROW_NUMBER() OVER (PARTITION BY o.cycle_id ORDER BY o.date ASC, o.id ASC) AS rn_asc,
             ROW_NUMBER() OVER (PARTITION BY o.cycle_id ORDER BY o.date DESC, o.id DESC) AS rn_desc
      FROM operations o
      LEFT JOIN sizes s ON s.id = o.size_id
      WHERE o.cycle_id IN (SELECT cycle_id FROM active)
        AND o.cancelled_at IS NULL
        AND o.type IN ('misura','peso','prima-attivazione','prima-attivazione-da-vagliatura')
        AND o.animals_per_kg IS NOT NULL
    )
    SELECT a.cycle_id, a.basket_id, a.physical_number, a.flupsy_id, a.flupsy_name,
           a.lot_id, a.quality_class, a.start_date,
           seme.animals_per_kg AS seme_apk,
           seme.date AS seme_date,
           curr.animals_per_kg AS curr_apk,
           curr.animal_count AS curr_animal_count,
           curr.size_id AS curr_size_id,
           curr.size_code AS curr_size_code,
           curr.date AS curr_date
    FROM active a
    LEFT JOIN ranked seme ON seme.cycle_id = a.cycle_id AND seme.rn_asc = 1
    LEFT JOIN ranked curr ON curr.cycle_id = a.cycle_id AND curr.rn_desc = 1
    ORDER BY a.flupsy_name, a.physical_number
  `);

  const rows = ((result as any).rows ?? (result as any)) as RawRow[];

  const wSize = config.weightSize;
  const wTime = config.weightTime;
  const wTot = wSize + wTime;

  const cycles: CycleIMM[] = rows.map((r) => {
    const seme = r.seme_apk != null ? Number(r.seme_apk) : null;
    const curr = r.curr_apk != null ? Number(r.curr_apk) : null;
    const animalCount = r.curr_animal_count != null ? Number(r.curr_animal_count) : null;
    const daysElapsed =
      r.seme_date && r.curr_date ? daysBetween(r.seme_date, r.curr_date) : 0;

    let immSize = 0;
    let immTime = 0;
    let sgrDaily = config.fallbackSgrDaily;
    let daysRemaining: number | null = null;

    if (seme && curr) {
      immSize = computeImmSize(seme, curr, targetApk);
      sgrDaily = computeSgrDaily(seme, curr, daysElapsed, config.fallbackSgrDaily);
      const dr = computeDaysRemaining(curr, targetApk, sgrDaily);
      daysRemaining = isFinite(dr) ? Math.round(dr) : null;
      immTime = computeImmTime(dr, config.horizonDays);
    }

    const imm = wTot > 0 ? (wSize * immSize + wTime * immTime) / wTot : 0;

    return {
      cycleId: Number(r.cycle_id),
      basketId: Number(r.basket_id),
      physicalNumber: Number(r.physical_number),
      flupsyId: Number(r.flupsy_id),
      flupsyName: r.flupsy_name,
      lotId: r.lot_id != null ? Number(r.lot_id) : null,
      qualityClass: r.quality_class,
      startDate: r.start_date,
      semeApk: seme,
      currApk: curr,
      currAnimalCount: animalCount,
      currSizeCode: r.curr_size_code,
      currDate: r.curr_date,
      daysElapsed,
      sgrDaily,
      daysRemaining,
      imm: Math.round(imm * 100) / 100,
      components: {
        immSize: Math.round(immSize * 100) / 100,
        immTime: Math.round(immTime * 100) / 100,
      },
    };
  });

  // Aggregations
  const validCycles = cycles.filter((c) => c.currAnimalCount && c.currAnimalCount > 0);
  const totalAnimals = validCycles.reduce((s, c) => s + (c.currAnimalCount || 0), 0);
  const immGlobal = weightedAvg(
    validCycles.map((c) => ({ imm: c.imm, w: c.currAnimalCount || 0 })),
  );

  // By FLUPSY
  const flupsyMap = new Map<number, { name: string; items: CycleIMM[] }>();
  for (const c of validCycles) {
    if (!flupsyMap.has(c.flupsyId)) flupsyMap.set(c.flupsyId, { name: c.flupsyName, items: [] });
    flupsyMap.get(c.flupsyId)!.items.push(c);
  }
  const byFlupsy: IMMAggregate[] = Array.from(flupsyMap.entries())
    .map(([id, { name, items }]) => ({
      scope: "flupsy",
      scopeId: id,
      scopeName: name,
      animalCount: items.reduce((s, c) => s + (c.currAnimalCount || 0), 0),
      cycleCount: items.length,
      imm:
        Math.round(
          weightedAvg(items.map((c) => ({ imm: c.imm, w: c.currAnimalCount || 0 }))) * 100,
        ) / 100,
    }))
    .sort((a, b) => b.imm - a.imm);

  // By Lot
  const lotMap = new Map<number, CycleIMM[]>();
  for (const c of validCycles) {
    if (c.lotId == null) continue;
    if (!lotMap.has(c.lotId)) lotMap.set(c.lotId, []);
    lotMap.get(c.lotId)!.push(c);
  }
  const byLot: IMMAggregate[] = Array.from(lotMap.entries())
    .map(([lotId, items]) => ({
      scope: "lot",
      scopeId: lotId,
      scopeName: `Lotto ${lotId}`,
      animalCount: items.reduce((s, c) => s + (c.currAnimalCount || 0), 0),
      cycleCount: items.length,
      imm:
        Math.round(
          weightedAvg(items.map((c) => ({ imm: c.imm, w: c.currAnimalCount || 0 }))) * 100,
        ) / 100,
    }))
    .sort((a, b) => b.imm - a.imm);

  // Distribution
  const bins: Array<{ range: string; lo: number; hi: number }> = [
    { range: "0-25 (acerbo)", lo: 0, hi: 25 },
    { range: "25-50 (in crescita)", lo: 25, hi: 50 },
    { range: "50-75 (maturo)", lo: 50, hi: 75 },
    { range: "75-100 (pronto vendita)", lo: 75, hi: 100.01 },
  ];
  const distribution: IMMDistributionBin[] = bins.map((b) => {
    const items = validCycles.filter((c) => c.imm >= b.lo && c.imm < b.hi);
    const animalCount = items.reduce((s, c) => s + (c.currAnimalCount || 0), 0);
    return {
      range: b.range,
      minImm: b.lo,
      maxImm: b.hi === 100.01 ? 100 : b.hi,
      animalCount,
      cycleCount: items.length,
      pctOfTotal: totalAnimals > 0 ? Math.round((animalCount / totalAnimals) * 1000) / 10 : 0,
    };
  });

  return {
    config: {
      targetSizeCode: config.targetSizeCode,
      targetMinApk: targetApk,
      horizonDays: config.horizonDays,
      weightSize: config.weightSize,
      weightTime: config.weightTime,
      fallbackSgrDaily: config.fallbackSgrDaily,
    },
    totals: {
      totalAnimals,
      totalCycles: validCycles.length,
      immGlobal: Math.round(immGlobal * 100) / 100,
    },
    distribution,
    byFlupsy,
    byLot,
    cycles: cycles.sort((a, b) => b.imm - a.imm),
  };
}

export async function computeCycleIMM(
  cycleId: number,
  configOverride: Partial<IMMConfig> = {},
): Promise<CycleIMM | null> {
  const all = await computeInventoryIMM(configOverride);
  return all.cycles.find((c) => c.cycleId === cycleId) ?? null;
}
