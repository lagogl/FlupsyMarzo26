import { db } from "../../../db";
import { dbEsterno, isDbEsternoAvailable } from "../../../db-esterno";
import { ordiniCondivisi } from "../../../schema-esterno";
import { hatcheryArrivals, salesPriceList } from "../../../../shared/schema";
import type { ScenarioInput, ScenarioInputs, ScenarioResult, ScenarioProposal } from "../../../../shared/sales-scenarios";
import { productionForecastService } from "../../../ai/production-forecast-service";
import { findProjectedSize, findRangeForSize, loadGrowthSimulationContext, stepOneDay } from "../../../services/growth-simulation.service";
import { inArray } from "drizzle-orm";
import { activeOrdersCondition, hatcherySizeCode, scenarioOrderDeliveryMonth, scenarioOrderDeliveryDay } from "./source-data";
import { isScenarioSaleSize, selectedScenarioSizeIds, validateScenarioSaleSizes } from "../../../../shared/sales-scenario-size-policy";
import { monthNumber, monthParts, projectWorld, proposeSales, type ProposalTimings, type World, type Cohort, type Order } from "./engine";
import { aggregateOrderCommitments, type CommitmentOrderInput } from "./order-commitment";

export function businessToday() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (key: string) => Number(parts.find(p => p.type === key)!.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}
const commonWarnings = [
  "Simulazione separata: non modifica giacenze, ordini, Forecast o semine operative.",
  "Quantità commerciali alternative, NON sommabili tra mesi e taglie. Ogni vendita viene verificata contro tutti gli ordini futuri caricati.",
  "Le consegne sono valutate alla data prevista; le vendite mensili sono collocate al giorno con massima capacità protetta nella taglia. Lo stock a inizio mese resta distinto dalle opportunità maturate dopo. Solo gli ordini con primo mese di consegna dal mese iniziale dello scenario in poi sono riservati.",
  "Gli arrivi futuri entrano a inizio mese; gli arrivi già avvenuti sono compresi nell'inventario e non vengono aggiunti nuovamente.",
  "Incassi e ricavi riguardano solo le vendite dello scenario; nessun margine, costo o incasso degli ordini acquisiti è inventato. Incassi oltre l'orizzonte non inclusi nei totali.",
  "Le ipotesi prudenziali sono coefficienti espliciti, non una garanzia statistica. Le semine di questo scenario sono indipendenti da quelle operative.",
];

export async function getInputs(): Promise<ScenarioInputs> {
  const [ctx, prices] = await Promise.all([loadGrowthSimulationContext(), db.select().from(salesPriceList)]);
  const today = businessToday();
  const sizes = ctx.allSizes.filter(s => isScenarioSaleSize(s.code)).map(s => {
    const p = prices.find(p => p.sizeCode === s.code);
    return { id: s.id, code: s.code, name: s.name || s.code, pricePerThousand: p && Number.isFinite(p.pricePerAnimal) && p.pricePerAnimal > 0 ? p.pricePerAnimal * 1000 : null };
  });
  return { sizes, warnings: commonWarnings, defaults: {
    name: "Nuovo scenario", startYear: today.year, startMonth: today.month, horizon: 12,
    growthFactor: 1, prudentGrowthFactor: 0.8, mortalityMultiplier: 1,
    prudentMortalityMultiplier: 1.25, prudentHatcheryFactor: 0.8,
    selectedSizeIds: sizes.map(s => s.id),
    sales: [], sandNursery: [], cashGoal: 0, cashDeadline: monthParts(monthNumber(today.year, today.month) + 11),
    proposalPrices: sizes.filter(s => s.pricePerThousand != null).map(s => ({ sizeId: s.id, pricePerThousand: s.pricePerThousand!, paymentDelayMonths: 0 })),
  } };
}

async function loadWorlds(input: ScenarioInput, automatic = false): Promise<{ expected: World; prudent: World; warnings: string[] }> {
  const today = businessToday();
  if (input.startYear !== today.year || input.startMonth !== today.month) throw new Error("Lo scenario deve iniziare nel mese corrente: le giacenze disponibili sono quelle di oggi");
  if (!isDbEsternoAvailable() || !dbEsterno) throw new Error("Database ordini non disponibile: impossibile proteggere gli ordini acquisiti");
  const first = monthNumber(today.year, today.month);
  const [ctx, inventory, rawOrders] = await Promise.all([
    loadGrowthSimulationContext(),
    productionForecastService.getBasketLevelInventory(),
    dbEsterno.select().from(ordiniCondivisi).where(activeOrdersCondition()),
  ]);
  const orders: Order[] = [];
  const commitmentInputs: CommitmentOrderInput[] = [];
  let excludedEarlierOrders = 0;
  let hasPartialFutureOrders = false;
  validateScenarioSaleSizes(input, ctx.allSizes);
  const warnings = [...commonWarnings];
  warnings.push("SGR: coefficienti giornalieri configurati per mese/taglia, con ripiego sul valore mensile o sulla media disponibile dove manca il dato specifico.");
  for (const order of rawOrders) {
    const quantity = order.quantitaTotale || order.quantita || 0;
    if (quantity <= 0) continue;
    const date = order.dataInizioConsegna || order.dataConsegna || order.dataFineConsegna;
    let at: number | null;
    try { at = scenarioOrderDeliveryMonth(date, first); }
    catch { throw new Error(`Ordine ${order.id}: data consegna assente/non valida. Correggere l'ordine prima di simulare`); }
    if (at === null) { excludedEarlierOrders++; continue; }
    const code = productionForecastService.normalizeTagliaCode(order.tagliaRichiesta);
    const size = ctx.allSizes.find(s => s.code === code);
    if (!size) throw new Error(`Ordine ${order.id}: taglia non riconosciuta. Correggere l'ordine prima di simulare`);
    if (at > first + 59) throw new Error("Esistono ordini oltre 60 mesi: impossibile garantire la protezione completa con questo orizzonte di calcolo");
    orders.push({ key: String(order.id), at, day: Math.max(at === first ? today.day : 1, scenarioOrderDeliveryDay(date!)), sizeId: size.id, quantity });
    commitmentInputs.push({ quantity, deliveryMonth: at, total: order.totale, currency: order.valuta });
    if (order.stato === "Parziale") hasPartialFutureOrders = true;
  }
  const orderCommitments = aggregateOrderCommitments(commitmentInputs, first);
  if (excludedEarlierOrders) warnings.push(`${excludedEarlierOrders} ordini con prima consegna antecedente al mese iniziale esclusi anche se ancora aperti o parziali.`);
  if (hasPartialFutureOrders) warnings.push("Gli ordini parziali futuri sono riservati per l'intera quantità registrata, in via cautelativa (nessuna deduzione di consegne non certificate).");
  const last = Math.max(first + input.horizon - 1, ...orders.map(o => o.at));
  const years = [...new Set(Array.from({ length: last - first + 1 }, (_, i) => monthParts(first + i).year))];
  const arrivals = await db.select().from(hatcheryArrivals).where(inArray(hatcheryArrivals.year, years));
  const requestedSizes = [...new Set([...input.sales.map(s => s.sizeId), ...input.proposalPrices.map(s => s.sizeId)])];
  for (const id of requestedSizes) if (!ctx.allSizes.some(s => s.id === id)) throw new Error(`Taglia sconosciuta: ${id}`);
  if (ctx.allSizes.length > 60) throw new Error("Catalogo troppo ampio per il calcolo interattivo");
  const ranges: Record<string, number> = {};
  for (let n = first; n <= last; n++) {
    const { year, month } = monthParts(n);
    const date = new Date(year, month - 1, n === first ? today.day : 1, 12);
    for (const s of ctx.allSizes) {
      const range = findRangeForSize(s.id, date, ctx.sizeRangeVersions);
      if (range) ranges[`${n}|${s.id}`] = range.maxAnimalsPerKg;
    }
  }
  for (const order of orders) {
    const { year, month } = monthParts(order.at);
    const range = findRangeForSize(order.sizeId, new Date(year, month - 1, order.day!, 12), ctx.sizeRangeVersions);
    if (!range) throw new Error(`Ordine ${order.key}: range taglia non valido alla consegna`);
    ranges[`${order.at}|${order.day}|${order.sizeId}`] = range.maxAnimalsPerKg;
  }
  for (const sale of input.sales) if (!ranges[`${monthNumber(sale.year, sale.month)}|${sale.sizeId}`]) throw new Error(`Vendita ${sale.id}: range taglia non valido nel mese`);
  const buildDeadline = Date.now() + 20_000;
  const build = (prudent: boolean): World => {
    const factor = prudent ? input.prudentGrowthFactor : input.growthFactor;
    const mortality = prudent ? input.prudentMortalityMultiplier : input.mortalityMultiplier;
    const scaled = {
      ...ctx,
      sgrByMonthAndSize: Object.fromEntries(Object.entries(ctx.sgrByMonthAndSize).map(([k, v]) => [k, v * factor])),
      sgrFallbackByMonth: Object.fromEntries(Object.entries(ctx.sgrFallbackByMonth).map(([k, v]) => [k, v * factor])),
      globalFallback: ctx.globalFallback * factor,
      mortalityByMonthAndSize: Object.fromEntries(Object.entries(ctx.mortalityByMonthAndSize).map(([k, v]) => [k, Math.min(1, v * mortality)])),
    };
    const entries: { entry: number; quantity: number; weight: number }[] = inventory.filter(b => b.animalCount > 0).map(b => {
      if (!(b.animalsPerKg > 0) || !Number.isFinite(b.animalCount)) throw new Error("Inventario con quantità o peso non valido");
      return { entry: first, quantity: b.animalCount, weight: 1_000_000 / b.animalsPerKg };
    });
    for (const a of arrivals) {
      const entry = monthNumber(a.year, a.month);
      if (entry <= first || entry > last || a.quantity <= 0) continue;
      const size = ctx.allSizes.find(s => s.code === hatcherySizeCode(a.sizeCategory));
      const range = size && findRangeForSize(size.id, new Date(a.year, a.month - 1, 1, 12), ctx.sizeRangeVersions);
      if (!range) throw new Error(`Arrivo schiuditoio ${a.year}-${a.month}: taglia ${a.sizeCategory} priva di range`);
      entries.push({ entry, quantity: a.quantity * (prudent ? input.prudentHatcheryFactor : 1), weight: 1_000_000 / range.maxAnimalsPerKg });
    }
    // Coalesce only identical initial weights and entry dates: no approximation.
    const merged = new Map<string, typeof entries[number]>();
    for (const e of entries) {
      const key = `${e.entry}|${e.weight}`;
      const old = merged.get(key);
      if (old) old.quantity += e.quantity; else merged.set(key, { ...e });
    }
    if (merged.size > 800) throw new Error("Inventario troppo articolato per il calcolo interattivo (oltre 800 coorti distinte)");
    const cohorts: Cohort[] = [];
    let fallbackMortality = false;
    for (const e of merged.values()) {
      if (Date.now() > buildDeadline) throw new Error("Preparazione scenario troppo complessa: ridurre l'orizzonte e riprovare");
      const path: Cohort["path"] = {};
      let weight = e.weight;
      let survival = 1;
      for (let n = e.entry; n <= last; n++) {
        const { year, month } = monthParts(n);
        const day = n === first ? today.day : 1;
        const date = new Date(year, month - 1, day, 12);
        const size = findProjectedSize(weight, date, ctx.sizeRangeVersions);
        const monthPath: Cohort["path"][number] = { survival, sizeId: size?.sizeId ?? null, animalsPerKg: 1_000_000 / weight, days: {} };
        path[n] = monthPath;
        survival = 1;
        const days = new Date(year, month, 0).getDate();
        for (let d = day; d <= days; d++) {
          const dayDate = new Date(year, month - 1, d, 12);
          const dailySize = findProjectedSize(weight, dayDate, ctx.sizeRangeVersions);
          monthPath.days![d] = { survival, sizeId: dailySize?.sizeId ?? null, animalsPerKg: 1_000_000 / weight };
          const growthSize = findProjectedSize(weight, dayDate, ctx.sizeRangeVersions);
          const monthName = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"][month - 1];
          if (!Object.keys(ctx.sgrFallbackByMonth).length
            && (growthSize == null || ctx.sgrByMonthAndSize[`${monthName}|${growthSize.sizeId}`] === undefined)) {
            throw new Error(`SGR mancante per ${monthName}/${growthSize?.code ?? "taglia non classificata"}: configurare i dati prima di simulare`);
          }
          // Existing kernel: SGR daily fractions and monthly mortality / month days.
          const growth = stepOneDay(scaled, { weightMg: weight, count: 1 }, dayDate, 0);
          const mortalitySize = findProjectedSize(growth.weightMg, dayDate, ctx.sizeRangeVersions);
          const configured = mortalitySize && ctx.mortalityByMonthAndSize[`${month}|${mortalitySize.code}`];
          if (configured == null) fallbackMortality = true;
          const rate = Math.min(1, (configured ?? 0.03) * mortality);
          const state = stepOneDay(scaled, { weightMg: weight, count: survival }, dayDate, rate);
          weight = state.weightMg;
          survival = state.count;
          if (!Number.isFinite(weight) || !Number.isFinite(survival)) throw new Error("Parametri crescita non validi: simulazione non finita");
        }
      }
      cohorts.push({ quantity: e.quantity, entry: e.entry, path });
    }
    if (fallbackMortality && !warnings.some(w => w.startsWith("Mortalità"))) warnings.push("Mortalità non configurata per alcune combinazioni mese/taglia: applicato fallback esplicito 3% mensile, moltiplicato per il coefficiente dello scenario.");
    if (!Object.keys(ctx.sgrByMonthAndSize).length && !Object.keys(ctx.sgrFallbackByMonth).length) throw new Error("SGR non configurati: impossibile produrre una previsione attendibile");
    return {
      first, last, startDay: today.day, cohorts, orders,
      orderCommitments,
      maxApk: ranges, sizes: selectedScenarioSizeIds(input, ctx.allSizes),
    };
  };
  const expected = build(false);
  const prudent = build(true);
  // Both projections now evaluate protected availability on daily crossing
  // dates. Production can take longer than the old 20s simulation budget;
  // proposals test further candidate sales and retain a separate higher cap.
  expected.deadlineMs = prudent.deadlineMs = Date.now() + (automatic ? 90_000 : 60_000);
  return { expected, prudent, warnings };
}

export async function simulate(input: ScenarioInput, automatic = false): Promise<ScenarioResult | ScenarioProposal> {
  const worlds = await loadWorlds(input, automatic);
  if (automatic && input.proposalPrices.length === 0) throw new Error("Inserire almeno un prezzo positivo in €/1.000 animali per la proposta automatica");
  const timings: ProposalTimings = { allocationMs: 0, candidateReplayMs: 0, receiptReplayMs: 0 };
  const proposedSales = automatic ? proposeSales(worlds.expected, worlds.prudent, input, timings) : [];
  const combined = { ...input, sales: [...input.sales, ...proposedSales] };
  const projectionStart = performance.now();
  const expected = projectWorld(worlds.expected, combined);
  const prudent = projectWorld(worlds.prudent, combined);
  if (automatic) console.info("[sales-scenarios] proposal timings (ms)", {
    allocation: Math.round(timings.allocationMs),
    candidateReplay: Math.round(timings.candidateReplayMs),
    receiptReplay: Math.round(timings.receiptReplayMs),
    finalProjections: Math.round(performance.now() - projectionStart),
  });
  if (combined.sales.some(s => s.pricePerThousand == null)) worlds.warnings.push("Vendite senza prezzo: quantità simulate ma ricavo non valorizzato (non significa prezzo zero).");
  if (expected.totalOrderShortfall || prudent.totalOrderShortfall) worlds.warnings.push("Esistono ordini già scoperti nello scenario di base: le nuove vendite non ne peggiorano la copertura, ma non possono essere presentate come garanzia di consegna.");
  if (expected.unfulfilledSales || prudent.unfulfilledSales) worlds.warnings.push("Alcune vendite richieste sono state limitate per disponibilità o per proteggere gli ordini futuri.");
  const result: ScenarioResult = { expected, prudent, warnings: worlds.warnings, generatedAt: new Date().toISOString(), availabilityIsAlternative: true };
  return automatic ? { ...result, proposedSales, method: "Euristica deterministica: incasso più anticipato, poi prezzo €/1.000 più alto. Protegge gli ordini in entrambi gli scenari; non garantisce un ottimo globale. Obiettivo riferito ai soli incassi aggiuntivi delle vendite simulate." } : result;
}