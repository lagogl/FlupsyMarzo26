import { db } from "../../db";
import { sql } from "drizzle-orm";
import { immSnapshots } from "@shared/schema";

export type IMMComponents = {
  immSize: number;
  immTime: number;
  immQuality: number;
  immReliability: number;
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
  semeAnimalCount: number | null;
  currSizeCode: string | null;
  currDate: string | null;
  daysElapsed: number;
  sgrDaily: number;
  daysRemaining: number | null;
  cumulativeMortalityPct: number;
  imm: number;
  components: IMMComponents;
  pricePerAnimalCurrent: number | null;
  pricePerAnimalTarget: number | null;
  valoreAttuale: number;
  valorePotenziale: number;
  valoreMaturo: number;
};

export type IMMAggregate = {
  scope: string;
  scopeId: number | null;
  scopeName: string;
  animalCount: number;
  cycleCount: number;
  imm: number;
  immSize: number;
  immTime: number;
  immQuality: number;
  immReliability: number;
  valoreAttuale: number;
  valorePotenziale: number;
  valoreMaturo: number;
};

export type IMMDistributionBin = {
  range: string;
  minImm: number;
  maxImm: number;
  animalCount: number;
  cycleCount: number;
  pctOfTotal: number;
};

export type IMMConfig = {
  targetSizeCode: string;
  horizonDays: number;
  weightSize: number;
  weightTime: number;
  weightQuality: number;
  weightReliability: number;
  fallbackSgrDaily: number;
  baselineMortalityPct: number;
  maxMortalityPct: number;
};

export type IMMInventoryResult = {
  config: IMMConfig & { targetMinApk: number };
  totals: {
    totalAnimals: number;
    totalCycles: number;
    immGlobal: number;
    immSize: number;
    immTime: number;
    immQuality: number;
    immReliability: number;
    valoreAttuale: number;
    valorePotenziale: number;
    valoreMaturo: number;
  };
  distribution: IMMDistributionBin[];
  byFlupsy: IMMAggregate[];
  byLot: IMMAggregate[];
  cycles: CycleIMM[];
};

export const DEFAULT_IMM_CONFIG: IMMConfig = {
  targetSizeCode: "TP-3000",
  horizonDays: 180,
  weightSize: 40,
  weightTime: 35,
  weightQuality: 15,
  weightReliability: 10,
  fallbackSgrDaily: 0.005,
  baselineMortalityPct: 5,
  maxMortalityPct: 30,
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
  seme_animal_count: number | null;
  curr_apk: number | null;
  curr_animal_count: number | null;
  curr_size_id: number | null;
  curr_size_code: string | null;
  curr_date: string | null;
  total_dead_count: number | null;
};

function daysBetween(a: string, b: string): number {
  const da = new Date(a).getTime();
  const db_ = new Date(b).getTime();
  return Math.max(0, Math.round((db_ - da) / 86400000));
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

function computeImmQuality(qualityClass: string | null): number {
  const q = (qualityClass ?? "").toLowerCase();
  if (q === "premium") return 100;
  if (q === "normal") return 85;
  if (q === "sub") return 60;
  return 75; // neutro per cicli senza classificazione
}

function computeImmReliability(
  mortalityPct: number,
  baselinePct: number,
  maxPct: number,
): number {
  if (!isFinite(mortalityPct) || mortalityPct < 0) return 80; // default neutro
  if (mortalityPct <= baselinePct) return 100;
  if (mortalityPct >= maxPct) return 0;
  const span = maxPct - baselinePct;
  if (span <= 0) return 50;
  return clamp(100 * (1 - (mortalityPct - baselinePct) / span), 0, 100);
}

type WItem = { imm: number; size: number; time: number; quality: number; reliability: number; w: number };

function weightedAvgs(items: WItem[]): {
  imm: number; size: number; time: number; quality: number; reliability: number;
} {
  let sumW = 0;
  const acc = { imm: 0, size: 0, time: 0, quality: 0, reliability: 0 };
  for (const it of items) {
    if (it.w > 0) {
      sumW += it.w;
      acc.imm += it.imm * it.w;
      acc.size += it.size * it.w;
      acc.time += it.time * it.w;
      acc.quality += it.quality * it.w;
      acc.reliability += it.reliability * it.w;
    }
  }
  if (sumW <= 0) return { imm: 0, size: 0, time: 0, quality: 0, reliability: 0 };
  return {
    imm: acc.imm / sumW,
    size: acc.size / sumW,
    time: acc.time / sumW,
    quality: acc.quality / sumW,
    reliability: acc.reliability / sumW,
  };
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
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
  const targetRec = ((targetRow as any).rows?.[0] ?? (targetRow as any)[0]) as
    | { code: string; min_animals_per_kg: number }
    | undefined;
  if (!targetRec || !targetRec.min_animals_per_kg) {
    throw new Error(`Taglia target non valida: ${config.targetSizeCode}`);
  }
  const targetApk = Number(targetRec.min_animals_per_kg);

  // Carica listino prezzi €/animale per taglia
  const priceRows = await db.execute(sql`SELECT size_code, price_per_animal FROM sales_price_list`);
  const priceArr = ((priceRows as any).rows ?? (priceRows as any)) as Array<{ size_code: string; price_per_animal: number }>;
  const priceMap = new Map<string, number>();
  for (const p of priceArr) priceMap.set(p.size_code, Number(p.price_per_animal));
  const targetPrice = priceMap.get(config.targetSizeCode) ?? 0;

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
    ),
    mortality AS (
      SELECT cycle_id, COALESCE(SUM(dead_count), 0) AS total_dead_count
      FROM operations
      WHERE cycle_id IN (SELECT cycle_id FROM active)
        AND cancelled_at IS NULL
        AND dead_count IS NOT NULL
      GROUP BY cycle_id
    )
    SELECT a.cycle_id, a.basket_id, a.physical_number, a.flupsy_id, a.flupsy_name,
           a.lot_id, a.quality_class, a.start_date,
           seme.animals_per_kg AS seme_apk,
           seme.date AS seme_date,
           seme.animal_count AS seme_animal_count,
           curr.animals_per_kg AS curr_apk,
           curr.animal_count AS curr_animal_count,
           curr.size_id AS curr_size_id,
           curr.size_code AS curr_size_code,
           curr.date AS curr_date,
           m.total_dead_count
    FROM active a
    LEFT JOIN ranked seme ON seme.cycle_id = a.cycle_id AND seme.rn_asc = 1
    LEFT JOIN ranked curr ON curr.cycle_id = a.cycle_id AND curr.rn_desc = 1
    LEFT JOIN mortality m ON m.cycle_id = a.cycle_id
    ORDER BY a.flupsy_name, a.physical_number
  `);

  const rows = ((result as any).rows ?? (result as any)) as RawRow[];

  const wSize = config.weightSize;
  const wTime = config.weightTime;
  const wQual = config.weightQuality;
  const wRel = config.weightReliability;
  const wTot = wSize + wTime + wQual + wRel;

  const cycles: CycleIMM[] = rows.map((r) => {
    const seme = r.seme_apk != null ? Number(r.seme_apk) : null;
    const curr = r.curr_apk != null ? Number(r.curr_apk) : null;
    const animalCount = r.curr_animal_count != null ? Number(r.curr_animal_count) : null;
    const semeAnimalCount = r.seme_animal_count != null ? Number(r.seme_animal_count) : null;
    const daysElapsed =
      r.seme_date && r.curr_date ? daysBetween(r.seme_date, r.curr_date) : 0;
    const deadCount = r.total_dead_count != null ? Number(r.total_dead_count) : 0;

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

    const immQuality = computeImmQuality(r.quality_class);

    // Mortalità cumulativa: dead_count totale / (animal_count seme + dead_count totale)
    // Questo approccio è robusto: il denominatore rappresenta il pool iniziale "vivo + morto registrato".
    const mortBase = (semeAnimalCount ?? animalCount ?? 0) + deadCount;
    const cumulativeMortalityPct = mortBase > 0 ? (deadCount / mortBase) * 100 : 0;
    const immReliability = computeImmReliability(
      cumulativeMortalityPct,
      config.baselineMortalityPct,
      config.maxMortalityPct,
    );

    const imm =
      wTot > 0
        ? (wSize * immSize + wTime * immTime + wQual * immQuality + wRel * immReliability) / wTot
        : 0;

    // Valore: prezzo €/animale per taglia attuale e per target
    const pCurr = r.curr_size_code ? priceMap.get(r.curr_size_code) ?? null : null;
    const pTarget = targetPrice > 0 ? targetPrice : null;
    const animals = animalCount ?? 0;
    const valoreAttuale = pCurr != null ? animals * pCurr : 0;
    const valorePotenziale = pTarget != null ? animals * pTarget : 0;
    const valoreMaturo = valorePotenziale * (imm / 100);

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
      semeAnimalCount,
      currSizeCode: r.curr_size_code,
      currDate: r.curr_date,
      daysElapsed,
      sgrDaily,
      daysRemaining,
      cumulativeMortalityPct: round2(cumulativeMortalityPct),
      imm: round2(imm),
      components: {
        immSize: round2(immSize),
        immTime: round2(immTime),
        immQuality: round2(immQuality),
        immReliability: round2(immReliability),
      },
      pricePerAnimalCurrent: pCurr,
      pricePerAnimalTarget: pTarget,
      valoreAttuale: round2(valoreAttuale),
      valorePotenziale: round2(valorePotenziale),
      valoreMaturo: round2(valoreMaturo),
    };
  });

  // Aggregations
  const validCycles = cycles.filter((c) => c.currAnimalCount && c.currAnimalCount > 0);
  const totalAnimals = validCycles.reduce((s, c) => s + (c.currAnimalCount || 0), 0);
  const globalAvg = weightedAvgs(
    validCycles.map((c) => ({
      imm: c.imm,
      size: c.components.immSize,
      time: c.components.immTime,
      quality: c.components.immQuality,
      reliability: c.components.immReliability,
      w: c.currAnimalCount || 0,
    })),
  );

  // By FLUPSY
  const flupsyMap = new Map<number, { name: string; items: CycleIMM[] }>();
  for (const c of validCycles) {
    if (!flupsyMap.has(c.flupsyId)) flupsyMap.set(c.flupsyId, { name: c.flupsyName, items: [] });
    flupsyMap.get(c.flupsyId)!.items.push(c);
  }
  const buildAgg = (scope: string, scopeId: number | null, scopeName: string, items: CycleIMM[]): IMMAggregate => {
    const avg = weightedAvgs(items.map((c) => ({
      imm: c.imm,
      size: c.components.immSize,
      time: c.components.immTime,
      quality: c.components.immQuality,
      reliability: c.components.immReliability,
      w: c.currAnimalCount || 0,
    })));
    return {
      scope, scopeId, scopeName,
      animalCount: items.reduce((s, c) => s + (c.currAnimalCount || 0), 0),
      cycleCount: items.length,
      imm: round2(avg.imm),
      immSize: round2(avg.size),
      immTime: round2(avg.time),
      immQuality: round2(avg.quality),
      immReliability: round2(avg.reliability),
      valoreAttuale: round2(items.reduce((s, c) => s + c.valoreAttuale, 0)),
      valorePotenziale: round2(items.reduce((s, c) => s + c.valorePotenziale, 0)),
      valoreMaturo: round2(items.reduce((s, c) => s + c.valoreMaturo, 0)),
    };
  };
  const byFlupsy: IMMAggregate[] = Array.from(flupsyMap.entries())
    .map(([id, { name, items }]) => buildAgg("flupsy", id, name, items))
    .sort((a, b) => b.imm - a.imm);

  // By Lot
  const lotMap = new Map<number, CycleIMM[]>();
  for (const c of validCycles) {
    if (c.lotId == null) continue;
    if (!lotMap.has(c.lotId)) lotMap.set(c.lotId, []);
    lotMap.get(c.lotId)!.push(c);
  }
  const byLot: IMMAggregate[] = Array.from(lotMap.entries())
    .map(([lotId, items]) => buildAgg("lot", lotId, `Lotto ${lotId}`, items))
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
    config: { ...config, targetMinApk: targetApk },
    totals: {
      totalAnimals,
      totalCycles: validCycles.length,
      immGlobal: round2(globalAvg.imm),
      immSize: round2(globalAvg.size),
      immTime: round2(globalAvg.time),
      immQuality: round2(globalAvg.quality),
      immReliability: round2(globalAvg.reliability),
      valoreAttuale: round2(validCycles.reduce((s, c) => s + c.valoreAttuale, 0)),
      valorePotenziale: round2(validCycles.reduce((s, c) => s + c.valorePotenziale, 0)),
      valoreMaturo: round2(validCycles.reduce((s, c) => s + c.valoreMaturo, 0)),
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

/**
 * Salva uno snapshot giornaliero dell'IMM (globale + per FLUPSY + per Lotto).
 * Idempotente: per (snapshot_date, scope, scope_id) sovrascrive l'eventuale record esistente.
 */
export async function saveDailySnapshot(
  configOverride: Partial<IMMConfig> = {},
  snapshotDate?: string,
): Promise<{ inserted: number; date: string }> {
  const date = snapshotDate ?? new Date().toISOString().slice(0, 10);
  const result = await computeInventoryIMM(configOverride);
  const configJson = JSON.stringify(result.config);

  const records: Array<{
    scope: string; scopeId: number | null; scopeName: string;
    animalCount: number; cycleCount: number;
    imm: number; immSize: number; immTime: number; immQuality: number; immReliability: number;
  }> = [];

  records.push({
    scope: "global",
    scopeId: null,
    scopeName: "Magazzino",
    animalCount: result.totals.totalAnimals,
    cycleCount: result.totals.totalCycles,
    imm: result.totals.immGlobal,
    immSize: result.totals.immSize,
    immTime: result.totals.immTime,
    immQuality: result.totals.immQuality,
    immReliability: result.totals.immReliability,
  });
  for (const f of result.byFlupsy) {
    records.push({
      scope: "flupsy", scopeId: f.scopeId, scopeName: f.scopeName,
      animalCount: f.animalCount, cycleCount: f.cycleCount,
      imm: f.imm, immSize: f.immSize, immTime: f.immTime,
      immQuality: f.immQuality, immReliability: f.immReliability,
    });
  }
  for (const l of result.byLot) {
    records.push({
      scope: "lot", scopeId: l.scopeId, scopeName: l.scopeName,
      animalCount: l.animalCount, cycleCount: l.cycleCount,
      imm: l.imm, immSize: l.immSize, immTime: l.immTime,
      immQuality: l.immQuality, immReliability: l.immReliability,
    });
  }

  // DELETE+INSERT atomico per evitare race condition tra scheduler e trigger manuale
  await db.transaction(async (tx) => {
    await tx.execute(sql`
      DELETE FROM imm_snapshots
      WHERE snapshot_date = ${date}
        AND target_size_code = ${result.config.targetSizeCode}
    `);
    if (records.length > 0) {
      await tx.insert(immSnapshots).values(
        records.map((r) => ({
          snapshotDate: date,
          scope: r.scope,
          scopeId: r.scopeId,
          scopeName: r.scopeName,
          targetSizeCode: result.config.targetSizeCode,
          animalCount: r.animalCount,
          cycleCount: r.cycleCount,
          imm: r.imm,
          immSize: r.immSize,
          immTime: r.immTime,
          immQuality: r.immQuality,
          immReliability: r.immReliability,
          config: configJson,
        })),
      );
    }
  });

  return { inserted: records.length, date };
}

// Stati ordine considerati "aperti" (non evasi/annullati). Include "N/A" perché tipico import FIC.
const OPEN_ORDER_STATES = ["N/A", "aperto", "open", "confermato", "confirmed", "in lavorazione"];

export type OrderCoverageRow = {
  sizeCode: string;
  demand: number;       // animali ordinati aperti
  supply: number;       // animali attualmente in magazzino di quella taglia
  matureSupply: number; // animali con IMM ≥ 75 (pronti vendita)
  pricePerAnimal: number | null;
  demandValue: number;
  gap: number;          // domanda − offerta (positivo = scoperto)
  coverage: number;     // %, min(100, supply/demand*100). 100 se demand=0.
};

export async function computeOrdersCoverage(
  configOverride: Partial<IMMConfig> = {},
): Promise<{ rows: OrderCoverageRow[]; totals: { totalDemand: number; totalValue: number; totalGap: number } }> {
  const inv = await computeInventoryIMM(configOverride);

  // Carica righe ordini aperte; parsa la taglia da `nome` o `codice`
  const ordRows = await db.execute(sql`
    SELECT r.nome, r.codice, r.quantita, r.prezzo_unitario, o.stato
    FROM ordini_righe r
    JOIN ordini o ON o.id = r.ordine_id
  `);
  const orderRowsArr = ((ordRows as any).rows ?? (ordRows as any)) as Array<{
    nome: string; codice: string | null; quantita: string; prezzo_unitario: string; stato: string | null;
  }>;

  const sizeRegex = /screen\s*(\d{3,5})/i; // estrae 3000 da "screen3000"
  const demandBySize = new Map<string, number>();
  for (const row of orderRowsArr) {
    const stato = (row.stato ?? "N/A").toLowerCase();
    if (!OPEN_ORDER_STATES.some((s) => s.toLowerCase() === stato)) continue;
    const m = row.nome?.match(sizeRegex);
    if (!m) continue;
    const sizeCode = `TP-${m[1]}`;
    const qty = Number(row.quantita) || 0;
    if (qty <= 0) continue;
    demandBySize.set(sizeCode, (demandBySize.get(sizeCode) ?? 0) + qty);
  }

  // Offerta per taglia: somma animali nei cicli con currSizeCode = quella taglia
  const supplyBySize = new Map<string, number>();
  const matureBySize = new Map<string, number>();
  for (const c of inv.cycles) {
    if (!c.currSizeCode || !c.currAnimalCount) continue;
    supplyBySize.set(c.currSizeCode, (supplyBySize.get(c.currSizeCode) ?? 0) + c.currAnimalCount);
    if (c.imm >= 75) {
      matureBySize.set(c.currSizeCode, (matureBySize.get(c.currSizeCode) ?? 0) + c.currAnimalCount);
    }
  }

  // Listino prezzi
  const priceRows = await db.execute(sql`SELECT size_code, price_per_animal FROM sales_price_list`);
  const priceArr = ((priceRows as any).rows ?? (priceRows as any)) as Array<{ size_code: string; price_per_animal: number }>;
  const priceMap = new Map<string, number>();
  for (const p of priceArr) priceMap.set(p.size_code, Number(p.price_per_animal));

  // Unione di tutte le taglie comparse
  const allSizes = new Set<string>([...demandBySize.keys(), ...supplyBySize.keys()]);
  const rows: OrderCoverageRow[] = Array.from(allSizes).map((sizeCode) => {
    const demand = demandBySize.get(sizeCode) ?? 0;
    const supply = supplyBySize.get(sizeCode) ?? 0;
    const matureSupply = matureBySize.get(sizeCode) ?? 0;
    const price = priceMap.get(sizeCode) ?? null;
    const demandValue = price != null ? demand * price : 0;
    const gap = demand - supply;
    const coverage = demand > 0 ? Math.min(100, (supply / demand) * 100) : 100;
    return {
      sizeCode,
      demand,
      supply,
      matureSupply,
      pricePerAnimal: price,
      demandValue: round2(demandValue),
      gap,
      coverage: round2(coverage),
    };
  }).sort((a, b) => b.demand - a.demand);

  const totalDemand = rows.reduce((s, r) => s + r.demand, 0);
  const totalValue = round2(rows.reduce((s, r) => s + r.demandValue, 0));
  const totalGap = rows.reduce((s, r) => s + Math.max(0, r.gap), 0);
  return { rows, totals: { totalDemand, totalValue, totalGap } };
}

export async function getSnapshotHistory(opts: {
  scope?: string;
  scopeId?: number | null;
  targetSizeCode?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
} = {}) {
  const scope = opts.scope ?? "global";
  const targetSizeCode = opts.targetSizeCode ?? DEFAULT_IMM_CONFIG.targetSizeCode;
  const fromDate = opts.fromDate ?? new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  const toDate = opts.toDate ?? new Date().toISOString().slice(0, 10);
  const limit = Math.min(opts.limit ?? 365, 1000);

  const result = await db.execute(sql`
    SELECT snapshot_date, scope, scope_id, scope_name, target_size_code,
           animal_count, cycle_count, imm, imm_size, imm_time, imm_quality, imm_reliability
    FROM imm_snapshots
    WHERE scope = ${scope}
      AND target_size_code = ${targetSizeCode}
      AND snapshot_date >= ${fromDate}
      AND snapshot_date <= ${toDate}
      ${opts.scopeId != null ? sql`AND scope_id = ${opts.scopeId}` : sql``}
    ORDER BY snapshot_date ASC
    LIMIT ${limit}
  `);
  return (result as any).rows ?? (result as any);
}
