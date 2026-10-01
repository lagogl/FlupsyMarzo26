import { monthNumber, allocateScenario, proposeSales, proposeSalesGreedyBaseline, replay, type World, type Cohort, type ProposalTimings } from "./engine";
import { scenarioInputSchema } from "../../../../shared/sales-scenarios";

// Read-only, deterministic workload representative of a 15-month proposal with
// two commercial sizes, gradual maturity, arrivals, mortality, and future orders.
const first = monthNumber(2027, 1);
const months = 15;
const last = first + months - 1;
const makeCohort = (quantity: number, entryIndex: number, expected: boolean): Cohort => {
  const path: Cohort["path"] = {};
  for (let i = entryIndex; i < months; i++) {
    const n = first + i;
    const age = i - entryIndex;
    const sizeId = age < 4 ? 1 : 2;
    path[n] = {
      survival: age === 0 ? 1 : expected ? 0.995 : 0.99,
      sizeId,
      animalsPerKg: sizeId === 1 ? 18_500 - age * 900 : 9_000 - (age - 4) * 250,
    };
  }
  return { quantity, entry: first + entryIndex, path };
};
const maxApk: Record<string, number> = {};
for (let i = 0; i < months; i++) {
  const n = first + i;
  maxApk[`${n}|1`] = 20_000;
  maxApk[`${n}|2`] = 10_000;
}
const makeWorld = (expected: boolean): World => ({
  first, last, sizes: [1, 2], maxApk,
  cohorts: [
    makeCohort(expected ? 3_200 : 2_700, 0, expected),
    makeCohort(expected ? 1_400 : 1_100, 5, expected),
  ],
  orders: [
    { key: "benchmark-order-1", at: first + 8, sizeId: 2, quantity: 300 },
    { key: "benchmark-order-2", at: first + 12, sizeId: 2, quantity: 250 },
  ],
});

const expected = makeWorld(true);
const prudent = makeWorld(false);
const input = scenarioInputSchema.parse({
  name: "Proposal benchmark (read only)", startYear: 2027, startMonth: 1, horizon: months,
  growthFactor: 1, prudentGrowthFactor: 0.8,
  mortalityMultiplier: 1, prudentMortalityMultiplier: 1.25, prudentHatcheryFactor: 0.8,
  selectedSizeIds: [1, 2],
  sales: [{ id: "benchmark-manual", year: 2027, month: 1, sizeId: 1, quantity: 180,
    pricePerThousand: 140, paymentDelayMonths: 0 }],
  sandNursery: [{ year: 2027, month: 1, quantity: 120 }],
  cashGoal: 900, cashDeadline: { year: 2028, month: 3 },
  proposalPrices: [
    { sizeId: 1, pricePerThousand: 140, paymentDelayMonths: 0 },
    { sizeId: 2, pricePerThousand: 390, paymentDelayMonths: 1 },
  ],
});

function receiptsByDeadline(world: World, sales: typeof input.sales) {
  const accepted = allocateScenario(world, { ...input, sales });
  const applied = replay(world, accepted, undefined, true).applied;
  const deadline = monthNumber(input.cashDeadline.year, input.cashDeadline.month);
  return accepted.reduce((total, sale) => {
    const receiptMonth = monthNumber(sale.year, sale.month) + sale.paymentDelayMonths;
    return receiptMonth >= first && receiptMonth <= deadline
      ? total + (applied[sale.id] ?? 0) * (sale.pricePerThousand ?? 0) / 1000
      : total;
  }, 0);
}

const legacyStarted = performance.now();
const legacy = proposeSalesGreedyBaseline(expected, prudent, input);
const legacyMs = performance.now() - legacyStarted;
const legacyReceipts = Math.min(
  receiptsByDeadline(expected, [...input.sales, ...legacy]),
  receiptsByDeadline(prudent, [...input.sales, ...legacy]),
);

const timings: ProposalTimings = { allocationMs: 0, candidateReplayMs: 0, receiptReplayMs: 0 };
const optimizedStarted = performance.now();
const optimized = proposeSales(expected, prudent, input, timings);
const optimizedMs = performance.now() - optimizedStarted;
const optimizedReceipts = Math.min(
  receiptsByDeadline(expected, [...input.sales, ...optimized]),
  receiptsByDeadline(prudent, [...input.sales, ...optimized]),
);

console.log(JSON.stringify({
  workload: { months, selectedSizes: 2, cohorts: expected.cohorts.length, orders: expected.orders.length },
  legacy: { elapsedMs: Math.round(legacyMs), rows: legacy.length, worstReceipts: legacyReceipts },
  optimized: {
    elapsedMs: Math.round(optimizedMs), rows: optimized.length, worstReceipts: optimizedReceipts,
    strategy: timings.optimization?.strategy,
    search: timings.optimization,
  },
  phasesMs: {
    allocation: Math.round(timings.allocationMs),
    candidateReplay: Math.round(timings.candidateReplayMs),
    receiptReplay: Math.round(timings.receiptReplayMs),
  },
}, null, 2));