import { createHash } from "node:crypto";
import { commercialInputSchema, type CommercialInput, type CommercialInputs, type CommercialResult } from "../../../../shared/commercial-availability";
import { scenarioInputSchema, type ScenarioInput } from "../../../../shared/sales-scenarios";
import { isScenarioSaleSize } from "../../../../shared/sales-scenario-size-policy";
import { loadGrowthSimulationContext } from "../../../services/growth-simulation.service";
import { businessToday } from "../../../utils/business-date";
import { loadWorlds } from "../sales-scenarios/service";
import { monthNumber, monthParts } from "../sales-scenarios/engine";
import { civilDate } from "./compute";
import { calculateInWorker } from "./worker-pool";
import { resolveOrderQuantities } from "./order-residuals";
import { admitCalculation } from "./admission";

const disclaimers = [
  "Capacità alternative NON sommabili tra taglie e mesi. Solo le righe accettate del piano sono validate congiuntamente.",
  "Previsione condizionata alle ipotesi, non una garanzia produttiva. Nessuna scrittura su vendite, ordini, semine o inventario.",
  "La data dei dati indica la fotografia estratta dalle fonti, non la data dell'ultima misurazione di ogni cesta.",
];
export async function getCommercialInputs(): Promise<CommercialInputs> {
  const today = businessToday();
  const ctx = await loadGrowthSimulationContext();
  const sizes = ctx.allSizes.filter(s => isScenarioSaleSize(s.code)).map(s => ({ id: s.id, code: s.code, name: s.name || s.code }));
  return {
    sizes, referenceDate: civilDate(today.year, today.month, today.day), warnings: disclaimers,
    defaults: commercialInputSchema.parse({ name: "Nuovo scenario", startYear: today.year, startMonth: today.month, horizon: 6, selectedSizeIds: sizes.map(s => s.id) }),
  };
}
export function toScenarioInput(input: CommercialInput): ScenarioInput {
  return scenarioInputSchema.parse({
    ...input,
    selectedSizeIds: [...new Set([...input.selectedSizeIds, ...input.sales.map(s => s.sizeId)])],
    sales: input.sales.map(s => ({ ...s, pricePerThousand: null, paymentDelayMonths: 0 })),
    prudentGrowthFactor: input.growthFactor, prudentMortalityMultiplier: input.mortalityMultiplier,
    cashDeadline: monthParts(monthNumber(input.startYear, input.startMonth) + input.horizon - 1),
  });
}
export function inputHash(input: CommercialInput) {
  return createHash("sha256").update(JSON.stringify(commercialInputSchema.parse(input))).digest("hex");
}
const cache = new Map<string, { expires: number; value: CommercialResult }>();
const pending = new Map<string, Promise<CommercialResult>>();
// Trajectories survive ordinary plan/filter edits for 30 seconds; never reuse
// across biology switches, reference dates or changed scenario arrivals.
const worlds = new Map<string, { expires: number; value: Awaited<ReturnType<typeof loadWorlds>> }>();
export async function simulateCommercial(input: CommercialInput, owner: string, fresh = false): Promise<CommercialResult> {
  input = commercialInputSchema.parse(input);
  const today = businessToday();
  if (input.startYear !== today.year || input.startMonth !== today.month) throw new Error("Scenario storico: creare una copia ripianificata dal mese corrente");
  if (input.sales.some(s => s.year === today.year && s.month === today.month && s.day != null && s.day < today.day)) throw new Error("Vendita precedente alla data dei dati");
  const referenceDate = civilDate(today.year, today.month, today.day);
  const hash = inputHash(input), key = `${owner}|${referenceDate}|${hash}`;
  const now = Date.now();
  for (const [k, v] of cache) if (v.expires <= now) cache.delete(k);
  for (const [k, v] of worlds) if (v.expires <= now) worlds.delete(k);
  if (!fresh && cache.has(key)) return structuredClone(cache.get(key)!.value);
  if (!fresh && pending.has(key)) return structuredClone(await pending.get(key)!);
  const release = admitCalculation(owner);
  const run = async () => {
    const start = performance.now();
    const catalog = await getCommercialInputs();
    const allowed = new Set(catalog.sizes.map(s => s.id));
    if ([...input.selectedSizeIds, ...input.sales.map(s => s.sizeId)].some(id => !allowed.has(id))) throw new Error("Taglia commerciale non ammessa");
    const scenario = toScenarioInput(input);
    // Load every allowed range once, while capacities are evaluated only for
    // visible sizes. Hidden sales remain in the same replay and consume stock.
    const biologyInput = { ...scenario, sales: [], selectedSizeIds: catalog.sizes.map(s => s.id) };
    const worldKey = `${owner}|${referenceDate}|${JSON.stringify({ horizon: input.horizon, growth: input.growthFactor, mortality: input.mortalityMultiplier, orders: input.includeOrders, hatchery: input.includeHatchery, overrides: input.hatcheryOverrides })}`;
    const reused = !fresh && (worlds.get(worldKey)?.expires ?? 0) > Date.now();
    const loaded = reused ? worlds.get(worldKey)!.value
      : await loadWorlds(biologyInput, false, {
        includeOrders: input.includeOrders, includeHatchery: input.includeHatchery,
        hatcheryOverrides: input.hatcheryOverrides, resolveQuantities: resolveOrderQuantities,
      });
    if (!reused) {
      if (worlds.size >= 8) worlds.delete(worlds.keys().next().value!);
      worlds.set(worldKey, { expires: Date.now() + 30_000, value: loaded });
    }
    for (const sale of input.sales) {
      if (!loaded.expected.maxApk[`${monthNumber(sale.year, sale.month)}|${sale.sizeId}`]) throw new Error(`Vendita ${sale.id}: range taglia non valido nel mese`);
    }
    const result = await calculateInWorker(loaded.expected, input);
    const warnings = [...disclaimers, ...loaded.warnings.filter(w => !/Incassi|prudenzial|Quantità commerciali alternative/.test(w))];
    if (!input.includeOrders) warnings.push("Scenario senza vincolo ordini");
    if (input.includeHatchery) warnings.push("Previsionale: tutte le quantità esposte possono dipendere da arrivi futuri dello schiuditoio; gli aggiustamenti sostituiscono solo i residui futuri, non il programma reale.");
    else warnings.push("Arrivi futuri schiuditoio esclusi. Gli animali già arrivati restano nell'inventario.");
    if (result.baselineOrderShortfall) warnings.push("Esistono scoperti ordini già nella base, anche oltre l'orizzonte visibile. Il piano non ne garantisce la copertura.");
    if (!result.valid) warnings.push("Piano non valido: alcune vendite richieste non sono interamente soddisfatte. Correggere prima di congelare un riepilogo.");
    const value: CommercialResult = {
      ...result, sizes: catalog.sizes, input, inputHash: hash, referenceDate,
      generatedAt: new Date().toISOString(), availabilityIsAlternative: true,
      hatcheryDependent: input.includeHatchery, warnings, calculationMs: Math.round(performance.now() - start),
    };
    if (cache.size >= 32) cache.delete(cache.keys().next().value!);
    cache.set(key, { expires: Date.now() + 30_000, value });
    return value;
  };
  const promise = run();
  if (!fresh) pending.set(key, promise);
  try { return structuredClone(await promise); } finally { if (!fresh) pending.delete(key); release(); }
}

export function replanInput(input: CommercialInput): CommercialInput {
  const today = businessToday();
  const shift = monthNumber(today.year, today.month) - monthNumber(input.startYear, input.startMonth);
  const shiftRow = <T extends { year: number; month: number; day?: number }>(row: T): T => {
    const date = monthParts(monthNumber(row.year, row.month) + shift);
    let day = row.day && Math.min(row.day, new Date(date.year, date.month, 0).getDate());
    if (date.year === today.year && date.month === today.month && day) day = Math.max(day, today.day);
    return { ...row, ...date, ...(day ? { day } : {}) };
  };
  return commercialInputSchema.parse({ ...input, name: `${input.name.slice(0, 95)} (ripianificato)`, startYear: today.year, startMonth: today.month, sales: input.sales.map(shiftRow), hatcheryOverrides: input.hatcheryOverrides.map(shiftRow) });
}