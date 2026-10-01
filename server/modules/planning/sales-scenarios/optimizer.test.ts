import test from "node:test";
import assert from "node:assert/strict";
import { allocateScenario, monthNumber, monthParts, projectWorld, proposeSales, proposeSalesGreedyBaseline, type World } from "./engine";
import { scenarioInputSchema, type ScenarioInput, type ScenarioSale } from "../../../../shared/sales-scenarios";

const first = monthNumber(2027, 1);
const input = (overrides: Partial<ScenarioInput> = {}): ScenarioInput => scenarioInputSchema.parse({
  name: "Optimizer test", startYear: 2027, startMonth: 1, horizon: 3,
  sales: [], sandNursery: [], cashGoal: 0,
  cashDeadline: { year: 2027, month: 3 }, proposalPrices: [],
  ...overrides,
});

function world(quantity = 1000, survival = 1): World {
  return {
    first, last: first + 2, sizes: [1, 2],
    maxApk: {
      [`${first}|1`]: 20_000,
      [`${first + 1}|2`]: 10_000,
      [`${first + 2}|2`]: 10_000,
    },
    cohorts: [{
      quantity, entry: first, path: {
        [first]: { survival: 1, sizeId: 1, animalsPerKg: 18_000 },
        [first + 1]: { survival, sizeId: 2, animalsPerKg: 8_000 },
        [first + 2]: { survival: 1, sizeId: 2, animalsPerKg: 7_000 },
      },
    }],
    orders: [],
  };
}

function receipts(w: World, v: ScenarioInput, proposed: ScenarioSale[] = []) {
  return projectWorld(w, { ...v, sales: [...v.sales, ...proposed] }).receiptsByDeadline;
}

function withDateNow<T>(now: () => number, operation: () => T): T {
  const original = Date.now;
  Date.now = now;
  try { return operation(); }
  finally { Date.now = original; }
}

test("bounded search can wait for a higher-priced larger size and beats the receipt-first greedy oracle", () => {
  const expected = world(), prudent = world();
  const v = input({
    cashGoal: 500,
    proposalPrices: [
      { sizeId: 1, pricePerThousand: 100, paymentDelayMonths: 0 },
      { sizeId: 2, pricePerThousand: 1000, paymentDelayMonths: 0 },
    ],
  });
  const old = proposeSalesGreedyBaseline(expected, prudent, v);
  const timings = { allocationMs: 0, candidateReplayMs: 0, receiptReplayMs: 0 };
  const optimized = proposeSales(expected, prudent, v, timings);

  assert.deepEqual(old.map(s => [s.month, s.sizeId, s.quantity]), [[1, 1, 1000]]);
  assert.equal(receipts(prudent, v, old), 100);
  assert.equal(receipts(prudent, v, optimized), 500);
  assert.deepEqual(optimized.map(s => [s.month, s.sizeId, s.quantity]), [[2, 2, 500]]);
  assert.equal(timings.optimization?.baselineReceipts, 100);
  assert.equal(timings.optimization?.optimizedReceipts, 500);
  assert.equal(timings.optimization?.improvementEuro, 400);
  assert.match(timings.optimization?.strategy ?? "", /seed-.*-2-then-receipt-order/);
  assert.equal(timings.optimization?.baselineStatus, "feasible");
});

test("a payment delay past the cash deadline excludes an otherwise attractive later-size offer", () => {
  const expected = world(), prudent = world();
  const v = input({
    horizon: 2, cashGoal: 500, cashDeadline: { year: 2027, month: 2 },
    proposalPrices: [
      { sizeId: 1, pricePerThousand: 100, paymentDelayMonths: 0 },
      { sizeId: 2, pricePerThousand: 1000, paymentDelayMonths: 1 },
    ],
  });
  const proposed = proposeSales(expected, prudent, v);
  assert.ok(proposed.length > 0);
  assert.ok(proposed.every(s => s.sizeId === 1 && s.month === 1));
  assert.equal(receipts(prudent, v, proposed), 100);
});

test("mortality can make an earlier lower-priced sale better than waiting", () => {
  const expected = world(1000, 0.1), prudent = world(1000, 0.1);
  const v = input({
    cashGoal: 200,
    proposalPrices: [
      { sizeId: 1, pricePerThousand: 200, paymentDelayMonths: 0 },
      { sizeId: 2, pricePerThousand: 1000, paymentDelayMonths: 0 },
    ],
  });
  const proposed = proposeSales(expected, prudent, v);
  assert.equal(receipts(prudent, v, proposed), 200);
  assert.ok(proposed.some(s => s.sizeId === 1 && s.month === 1));
});

test("the plan can split receipts across size and month when neither period alone covers the goal", () => {
  const w = world();
  w.cohorts = [
    { quantity: 400, entry: first, path: {
      [first]: { survival: 1, sizeId: 1, animalsPerKg: 18_000 },
      [first + 1]: { survival: 1, sizeId: 1, animalsPerKg: 18_000 },
      [first + 2]: { survival: 1, sizeId: 1, animalsPerKg: 18_000 },
    } },
    { quantity: 600, entry: first + 1, path: {
      [first + 1]: { survival: 1, sizeId: 2, animalsPerKg: 8_000 },
      [first + 2]: { survival: 1, sizeId: 2, animalsPerKg: 7_000 },
    } },
  ];
  const v = input({
    cashGoal: 100,
    proposalPrices: [
      { sizeId: 1, pricePerThousand: 100, paymentDelayMonths: 0 },
      { sizeId: 2, pricePerThousand: 100, paymentDelayMonths: 0 },
    ],
  });
  const proposed = proposeSales(w, w, v);
  assert.ok(proposed.length >= 2);
  assert.equal(receipts(w, v, proposed), 100);
  assert.ok(new Set(proposed.map(s => s.month)).size >= 2);
});

test("both worlds bind capacity and existing manual sales, nursery, and individual orders remain protected", () => {
  const expected = world(1000), prudent = world(1000);
  prudent.cohorts[0].quantity = 900;
  expected.orders = prudent.orders = [
    { key: "order-a", at: first + 2, sizeId: 2, quantity: 350 },
    { key: "order-b", at: first + 2, sizeId: 2, quantity: 350 },
  ];
  const manual: ScenarioSale = {
    id: "manual", year: 2027, month: 1, sizeId: 1, quantity: 100,
    pricePerThousand: 50, paymentDelayMonths: 0,
  };
  const v = input({
    sales: [manual], sandNursery: [{ year: 2027, month: 1, quantity: 100 }],
    cashGoal: 500, proposalPrices: [{ sizeId: 1, pricePerThousand: 100, paymentDelayMonths: 0 }],
  });
  const proposed = proposeSales(expected, prudent, v);
  const full = { ...v, sales: [...v.sales, ...proposed] };
  const e = projectWorld(expected, full), p = projectWorld(prudent, full);
  assert.ok(proposed.reduce((sum, sale) => sum + sale.quantity, 0) <= 100);
  assert.equal(e.months[0].salesApplied, 100);
  assert.equal(p.months[0].salesApplied, 100);
  assert.equal(e.months[0].sandNurseryApplied, 100);
  assert.equal(p.months[0].sandNurseryApplied, 100);
  assert.equal(e.totalOrderShortfall, 0);
  assert.equal(p.totalOrderShortfall, 0);
  assert.ok(proposed.every(sale => sale.quantity <= 100));
});

test("an earlier automatic offer cannot take stock reserved by a later manual sale", () => {
  const expected = world(), prudent = world();
  const manual: ScenarioSale = {
    id: "later-manual", year: 2027, month: 3, sizeId: 2, quantity: 900,
    pricePerThousand: 40, paymentDelayMonths: 0,
  };
  const v = input({
    sales: [manual], cashGoal: 500,
    proposalPrices: [{ sizeId: 1, pricePerThousand: 1000, paymentDelayMonths: 0 }],
  });
  const proposed = proposeSales(expected, prudent, v);
  const baselineAllocation = allocateScenario(expected, v).find(row => row.id === manual.id);
  const finalAllocation = allocateScenario(expected, { ...v, sales: [...v.sales, ...proposed] })
    .find(row => row.id === manual.id);
  const e = projectWorld(expected, { ...v, sales: [...v.sales, ...proposed] });
  const p = projectWorld(prudent, { ...v, sales: [...v.sales, ...proposed] });
  assert.ok(proposed.reduce((sum, sale) => sum + sale.quantity, 0) <= 100);
  assert.equal(e.months[2].salesApplied, 900);
  assert.equal(p.months[2].salesApplied, 900);
  assert.equal(finalAllocation?.day, baselineAllocation?.day);
});

test("an earlier automatic offer cannot reduce a later Sand Nursery allocation", () => {
  const expected = world(), prudent = world();
  const v = input({
    sandNursery: [{ year: 2027, month: 3, quantity: 900 }],
    cashGoal: 500,
    proposalPrices: [{ sizeId: 1, pricePerThousand: 1000, paymentDelayMonths: 0 }],
  });
  const proposed = proposeSales(expected, prudent, v);
  const e = projectWorld(expected, { ...v, sales: proposed });
  const p = projectWorld(prudent, { ...v, sales: proposed });
  assert.ok(proposed.reduce((sum, sale) => sum + sale.quantity, 0) <= 100);
  assert.equal(e.months[2].sandNurseryApplied, 900);
  assert.equal(p.months[2].sandNurseryApplied, 900);
});

test("a deadline inside the final-projection reserve returns the safe fixed baseline without search", () => {
  const expected = world(), prudent = world();
  expected.deadlineMs = prudent.deadlineMs = Date.now() + 20_000;
  const v = input({
    cashGoal: 50,
    proposalPrices: [{ sizeId: 1, pricePerThousand: 100, paymentDelayMonths: 0 }],
  });
  const timings = { allocationMs: 0, candidateReplayMs: 0, receiptReplayMs: 0 };
  const started = performance.now();
  assert.deepEqual(proposeSales(expected, prudent, v, timings), []);
  assert.ok(performance.now() - started < 1000);
  assert.equal(timings.optimization?.candidatesEvaluated, 0);
  assert.equal(timings.optimization?.plansEvaluated, 0);
  assert.equal(timings.optimization?.timeLimited, true);
  assert.equal(timings.optimization?.baselineFeasible, false);
  assert.equal(timings.optimization?.baselineReceipts, 0);
  assert.equal(timings.optimization?.baselineStatus, "not-completed");
});

test("a proposal cutoff reached inside replay returns the last safe incumbent", () => {
  const expected = world(), prudent = world();
  const base = Date.now();
  expected.deadlineMs = prudent.deadlineMs = base + 30_000;
  const v = input({
    cashGoal: 50,
    proposalPrices: [{ sizeId: 1, pricePerThousand: 100, paymentDelayMonths: 0 }],
  });
  const timings = { allocationMs: 0, candidateReplayMs: 0, receiptReplayMs: 0 };
  let calls = 0;
  let cutoffStack = "";
  const proposed = withDateNow(() => {
    calls++;
    if (calls >= 9) {
      cutoffStack ||= new Error().stack ?? "";
      return base + 3_000;
    }
    return base;
  }, () => proposeSales(expected, prudent, v, timings));

  assert.deepEqual(proposed, []);
  assert.match(cutoffStack, /replay/);
  assert.equal(timings.optimization?.timeLimited, true);
  assert.equal(timings.optimization?.baselineStatus, "not-completed");
  assert.equal(timings.optimization?.candidatesEvaluated, 0);
  assert.equal(timings.optimization?.plansEvaluated, 0);
});

test("a mid-baseline cutoff preserves its canonically validated greedy prefix", () => {
  const expected = world(), prudent = world();
  expected.cohorts = prudent.cohorts = [
    { quantity: 500, entry: first, path: {
      [first]: { survival: 1, sizeId: 1, animalsPerKg: 18_000 },
    } },
    { quantity: 500, entry: first + 1, path: {
      [first + 1]: { survival: 1, sizeId: 2, animalsPerKg: 8_000 },
      [first + 2]: { survival: 1, sizeId: 2, animalsPerKg: 7_000 },
    } },
  ];
  const v = input({
    cashGoal: 100,
    proposalPrices: [
      { sizeId: 1, pricePerThousand: 100, paymentDelayMonths: 0 },
      { sizeId: 2, pricePerThousand: 100, paymentDelayMonths: 0 },
    ],
  });
  const base = Date.now();
  expected.deadlineMs = prudent.deadlineMs = base + 90_000;
  const originalNow = Date.now;
  let clock = base;
  Date.now = () => clock;
  let candidateReplayWrites = 0;
  let candidateReplayElapsed = 0;
  const timings = { allocationMs: 0, candidateReplayMs: 0, receiptReplayMs: 0 };
  Object.defineProperty(timings, "candidateReplayMs", {
    configurable: true,
    enumerable: true,
    get: () => candidateReplayElapsed,
    set: (value: number) => {
      candidateReplayElapsed = value;
      if (++candidateReplayWrites === 3) clock = base + 63_000;
    },
  });
  let proposed: ScenarioSale[];
  try { proposed = proposeSales(expected, prudent, v, timings); }
  finally { Date.now = originalNow; }

  assert.deepEqual(proposed.map(sale => [sale.month, sale.sizeId, sale.quantity]), [[1, 1, 500]]);
  assert.equal(receipts(expected, v, proposed), 50);
  assert.equal(receipts(prudent, v, proposed), 50);
  assert.equal(timings.optimization?.baselineStatus, "partial");
  assert.equal(timings.optimization?.baselineFeasible, false);
  assert.equal(timings.optimization?.timeLimited, true);
  assert.equal(timings.optimization?.baselineReceipts, 50);
  assert.equal(timings.optimization?.optimizedReceipts, 50);
  assert.ok(candidateReplayWrites >= 3);
});

test("a manual-plan allocation cutoff throws explicitly instead of returning an unchecked plan", () => {
  const expected = world(), prudent = world();
  const base = Date.now();
  expected.deadlineMs = prudent.deadlineMs = base + 30_000;
  const v = input({
    sales: [{
      id: "manual", year: 2027, month: 1, sizeId: 1, quantity: 100,
      pricePerThousand: 50, paymentDelayMonths: 0,
    }],
    cashGoal: 0,
  });
  let calls = 0;
  let cutoffStack = "";
  assert.throws(() => withDateNow(() => {
    calls++;
    if (calls >= 12) {
      cutoffStack ||= new Error().stack ?? "";
      return base + 3_000;
    }
    return base;
  }, () => proposeSales(expected, prudent, v)), /impossibile completare la validazione delle vendite manuali/);
  assert.match(cutoffStack, /replay/);
});

test("a genuine expired world deadline is not converted into a proposal-budget fallback", () => {
  const expected = world(), prudent = world();
  expected.deadlineMs = prudent.deadlineMs = Date.now() - 1;
  assert.throws(() => proposeSales(expected, prudent, input()), /Scenario troppo complesso: ridurre/);
});

test("selection intersection, deterministic output, and readonly worlds are retained", () => {
  const expected = world(), prudent = world();
  expected.sizes = [2];
  prudent.sizes = [2];
  const v = input({
    cashGoal: 20,
    proposalPrices: [
      { sizeId: 1, pricePerThousand: 100_000, paymentDelayMonths: 0 },
      { sizeId: 2, pricePerThousand: 100, paymentDelayMonths: 0 },
    ],
  });
  const before = JSON.stringify({ expected, prudent, v });
  const a = proposeSales(expected, prudent, v), b = proposeSales(expected, prudent, v);
  assert.deepEqual(a, b);
  assert.ok(a.every(s => s.sizeId === 2));
  assert.equal(JSON.stringify({ expected, prudent, v }), before);
});

test("fixed sales count toward the goal, and the optional metrics report worst-world receipts", () => {
  const expected = world(1000), prudent = world(800);
  const manual: ScenarioSale = {
    id: "fixed", year: 2027, month: 1, sizeId: 1, quantity: 100,
    pricePerThousand: 100, paymentDelayMonths: 0,
  };
  const v = input({
    sales: [manual], cashGoal: 10,
    proposalPrices: [{ sizeId: 1, pricePerThousand: 100, paymentDelayMonths: 0 }],
  });
  const timings = { allocationMs: 0, candidateReplayMs: 0, receiptReplayMs: 0 };
  assert.deepEqual(proposeSales(expected, prudent, v, timings), []);
  assert.equal(timings.optimization?.baselineReceipts, 10);
  assert.equal(timings.optimization?.optimizedReceipts, 10);
  assert.equal(timings.optimization?.improvementEuro, 0);
  assert.equal(timings.optimization?.baselineFeasible, true);
});

test("worst-world cash uses the lower receipt world even when expected is more constrained", () => {
  const expected = world(400), prudent = world(1000);
  const v = input({
    cashGoal: 100,
    proposalPrices: [{ sizeId: 1, pricePerThousand: 100, paymentDelayMonths: 0 }],
  });
  const timings = { allocationMs: 0, candidateReplayMs: 0, receiptReplayMs: 0 };
  const proposed = proposeSales(expected, prudent, v, timings);
  assert.equal(proposed.reduce((sum, sale) => sum + sale.quantity, 0), 400);
  assert.equal(receipts(expected, v, proposed), 40);
  assert.equal(receipts(prudent, v, proposed), 40);
  assert.equal(timings.optimization?.baselineReceipts, 40);
  assert.equal(timings.optimization?.optimizedReceipts, 40);
});

test("15-month two-size search has deterministic explicit work bounds and reports real evaluations", () => {
  const months = 15;
  const last = first + months - 1;
  const path = Object.fromEntries(Array.from({ length: months }, (_, i) => {
    const n = first + i;
    return [n, { survival: i === 0 ? 1 : 0.99, sizeId: i < 5 ? 1 : 2, animalsPerKg: i < 5 ? 18_000 - i * 500 : 8_000 - (i - 5) * 100 }];
  }));
  const w: World = {
    first, last, sizes: [1, 2],
    maxApk: Object.fromEntries(Array.from({ length: months }, (_, i) => [
      `${first + i}|${i < 5 ? 1 : 2}`, i < 5 ? 20_000 : 10_000,
    ])),
    cohorts: [{ quantity: 3000, entry: first, path }], orders: [],
  };
  const v = input({
    horizon: months, cashGoal: 350,
    cashDeadline: monthParts(last),
    proposalPrices: [
      { sizeId: 1, pricePerThousand: 120, paymentDelayMonths: 0 },
      { sizeId: 2, pricePerThousand: 220, paymentDelayMonths: 1 },
    ],
  });
  const timings = { allocationMs: 0, candidateReplayMs: 0, receiptReplayMs: 0 };
  proposeSales(w, w, v, timings);
  const optimization = timings.optimization!;
  assert.ok(optimization.plansEvaluated >= 1 && optimization.plansEvaluated <= 18);
  assert.ok(optimization.candidatesEvaluated >= 0 && optimization.candidatesEvaluated <= 120);
  assert.ok(Number.isFinite(optimization.searchTimeMs) && optimization.searchTimeMs >= 0);
  assert.ok(Number.isFinite(optimization.baselineReceipts));
  assert.ok(Number.isFinite(optimization.optimizedReceipts));
});