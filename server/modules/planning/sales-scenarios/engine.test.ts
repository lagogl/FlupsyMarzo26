import test from "node:test";
import assert from "node:assert/strict";
import { replay, safeCapacity, projectWorld, proposeSales, monthNumber, type World } from "./engine";
import { scenarioInputSchema, type ScenarioInput, type ScenarioSale } from "../../../../shared/sales-scenarios";

const first = monthNumber(2027, 1);
const input = (sales: ScenarioSale[] = []): ScenarioInput => scenarioInputSchema.parse({
  name: "Test", startYear: 2027, startMonth: 1, horizon: 3, sales, cashDeadline: { year: 2027, month: 3 },
});
const sale = (quantity: number, month = 1, sizeId = 1): ScenarioSale => ({
  id: `sale-${month}-${sizeId}`, year: 2027, month, sizeId, quantity, pricePerThousand: 100, paymentDelayMonths: 0,
});
test("restricted sale catalog keeps non-sale cohorts growing and acquired orders protected", () => {
  const w = world();
  w.sizes = [2];
  w.orders = [{ key: "excluded-size-order", at: first, sizeId: 1, quantity: 100 }];
  const result = projectWorld(w, input());
  assert.deepEqual(Object.keys(result.months[0].availableBySize), ["2"]);
  assert.equal(result.months[0].ordersFulfilled, 100);
  assert.equal(result.months[1].remainingAnimals, 810);
  assert.equal(result.months[1].availableBySize["2"], 810);
  const automatic = input();
  automatic.cashGoal = 100;
  automatic.proposalPrices = [
    { sizeId: 1, pricePerThousand: 10000, paymentDelayMonths: 0 },
    { sizeId: 2, pricePerThousand: 100, paymentDelayMonths: 0 },
  ];
  const proposed = proposeSales(w, w, automatic);
  assert.ok(proposed.length > 0);
  assert.ok(proposed.every(s => s.sizeId === 2));
  assert.equal(projectWorld(w, { ...automatic, sales: proposed }).totalOrderShortfall, 0);
});
test("subset availability and proposals expose only selected world sizes", () => {
  const w = world();
  w.sizes = [2];
  const result = projectWorld(w, input());
  assert.deepEqual(Object.keys(result.months[0].availableBySize), ["2"]);
  const automatic = input();
  automatic.cashGoal = 50;
  automatic.proposalPrices = [
    { sizeId: 1, pricePerThousand: 10_000, paymentDelayMonths: 0 },
    { sizeId: 2, pricePerThousand: 100, paymentDelayMonths: 0 },
  ];
  assert.ok(proposeSales(w, w, automatic).every(row => row.sizeId === 2));
});
function world(): World {
  return { first, last: first + 2, sizes: [1, 2], maxApk: { [`${first}|1`]: 30_000, [`${first + 1}|2`]: 10_000, [`${first + 2}|2`]: 10_000 },
    cohorts: [{ quantity: 1000, entry: first, path: {
      [first]: { survival: 1, sizeId: 1, animalsPerKg: 20_000 },
      [first + 1]: { survival: 0.9, sizeId: 2, animalsPerKg: 8_000 },
      [first + 2]: { survival: 0.9, sizeId: 2, animalsPerKg: 7_000 },
    } }], orders: [],
  };
}
test("a sale reduces later stock with growth and monthly survival; world is immutable", () => {
  const w = world();
  const before = JSON.stringify(w);
  const result = projectWorld(w, input([sale(500)]));
  assert.equal(result.months[0].salesApplied, 500);
  assert.equal(result.months[1].remainingAnimals, 450);
  assert.equal(result.finalStock, 405);
  assert.equal(JSON.stringify(w), before);
});
test("reserves future orders, including orders outside visible horizon", () => {
  const w = world();
  w.orders = [{ key: "future", at: first + 2, sizeId: 2, quantity: 729 }];
  const v = input([sale(1000)]);
  v.horizon = 1; v.cashDeadline.month = 1;
  const result = projectWorld(w, v);
  assert.equal(result.months[0].salesApplied, 100);
  assert.equal(result.totalOrderShortfall, 0);
});
test("existing shortfalls may not worsen, per-order not just total", () => {
  const w = world();
  w.orders = [{ key: "future", at: first + 2, sizeId: 2, quantity: 1000 }];
  const result = projectWorld(w, input([sale(500)]));
  assert.equal(result.months[0].salesApplied, 0);
  assert.equal(result.totalOrderShortfall, 190);
});
test("future hatchery cohorts are unavailable before entry", () => {
  const w = world();
  w.cohorts = [{ quantity: 1000, entry: first + 1, path: {
    [first + 1]: { survival: 1, sizeId: 1, animalsPerKg: 20_000 },
    [first + 2]: { survival: 1, sizeId: 2, animalsPerKg: 8_000 },
  } }];
  const result = projectWorld(w, input([sale(1000)]));
  assert.equal(result.months[0].salesApplied, 0);
  assert.equal(result.months[1].remainingAnimals, 1000);
});
test("missing prices do not fabricate revenue", () => {
  const result = projectWorld(world(), input([{ ...sale(100), pricePerThousand: null }]));
  assert.equal(result.totalRevenue, 0);
  assert.equal(result.months[0].salesApplied, 100);
});
test("payment delay controls cash deadline, not revenue date", () => {
  const v = input([{ ...sale(1000), paymentDelayMonths: 2 }]);
  v.cashGoal = 100; v.cashDeadline.month = 2;
  const result = projectWorld(world(), v);
  assert.equal(result.totalRevenue, 100);
  assert.equal(result.receiptsByDeadline, 0);
  assert.equal(result.goalReached, false);
  assert.equal(result.months[2].receipts, 100);
});
test("automatic proposal respects prices, payment lag and insufficient supply", () => {
  const v = input(); v.cashGoal = 200;
  v.proposalPrices = [{ sizeId: 1, pricePerThousand: 100, paymentDelayMonths: 0 }];
  const proposals = proposeSales(world(), world(), v);
  assert.equal(proposals.reduce((s, p) => s + p.quantity, 0), 1000);
  const result = projectWorld(world(), { ...v, sales: proposals });
  assert.equal(result.goalReached, false);
  assert.equal(result.totalRevenue, 100);
  v.proposalPrices[0].paymentDelayMonths = 3;
  assert.deepEqual(proposeSales(world(), world(), v), []);
});
test("automatic proposal protects future orders in expected AND prudent worlds", () => {
  const expected = world(), prudent = world();
  expected.orders = prudent.orders = [{ key: "future", at: first + 2, sizeId: 2, quantity: 729 }];
  prudent.cohorts[0].quantity = 900;
  const v = input(); v.cashGoal = 100;
  v.proposalPrices = [{ sizeId: 1, pricePerThousand: 100, paymentDelayMonths: 0 }];
  assert.deepEqual(proposeSales(expected, prudent, v), []);
});
test("nursery uses same stock pool and protects future orders", () => {
  const w = world(); w.orders = [{ key: "future", at: first + 2, sizeId: 2, quantity: 729 }];
  const v = input(); v.sandNursery = [{ year: 2027, month: 1, quantity: 1000 }];
  const result = projectWorld(w, v);
  assert.equal(result.months[0].sandNurseryApplied, 100);
  assert.equal(result.totalOrderShortfall, 0);
});
test("availability is a protected alternative and sales cannot be counted twice", () => {
  const w = world();
  assert.equal(safeCapacity(w, [sale(900)], { ...sale(0), id: "extra" }, 1000), 100);
  const result = replay(w, [sale(900), { ...sale(900), id: "extra" }]);
  assert.equal(result.applied.extra, 100);
});
test("validation rejects duplicate IDs, unbounded inputs and non-prudent assumptions", () => {
  const v = input();
  assert.equal(scenarioInputSchema.safeParse({ ...v, sales: [sale(1), sale(1)] }).success, false);
  assert.equal(scenarioInputSchema.safeParse({ ...v, horizon: 100 }).success, false);
  assert.equal(scenarioInputSchema.safeParse({ ...v, prudentGrowthFactor: 1.5 }).success, false);
});
test("larger animals can cover acquired smaller-size orders, manual sales remain exact size", () => {
  const w = world();
  w.maxApk[`${first + 1}|1`] = 30_000;
  w.orders = [{ key: "smaller", at: first + 1, sizeId: 1, quantity: 500 }];
  const v = input([sale(100, 2, 1)]);
  const result = projectWorld(w, v);
  assert.equal(result.months[1].ordersFulfilled, 500);
  assert.equal(result.months[1].salesApplied, 0);
});
test("a successful proposal reaches cash goal without changing input", () => {
  const v = input(); v.cashGoal = 50;
  v.proposalPrices = [{ sizeId: 1, pricePerThousand: 100, paymentDelayMonths: 0 }];
  const before = JSON.stringify(v);
  const proposals = proposeSales(world(), world(), v);
  assert.equal(proposals[0].quantity, 500);
  assert.equal(projectWorld(world(), { ...v, sales: proposals }).goalReached, true);
  assert.equal(JSON.stringify(v), before);
});
test("expired compute budget fails explicitly", () => {
  assert.throws(() => replay({ ...world(), deadlineMs: Date.now() - 100 }, []), /troppo complesso/);
});

test("commercial availability is residual after requested sales and reserves later accepted sales", () => {
  const result = projectWorld(world(), input([sale(200), sale(360, 2, 2)]));
  assert.equal(result.months[0].salesApplied, 200);
  assert.equal(result.months[0].availableBySize[1], 400);
  assert.equal(result.months[1].availableBySize[2], 360);
});

test("cohort survival is incremental and hatchery arrivals do not inherit earlier mortality", () => {
  const w = world();
  w.cohorts.push({ quantity: 500, entry: first + 1, path: {
    [first + 1]: { survival: 1, sizeId: 2, animalsPerKg: 8_000 },
    [first + 2]: { survival: 0.8, sizeId: 2, animalsPerKg: 7_000 },
  } });
  const result = replay(w, [sale(500)]);
  assert.equal(result.months.get(first + 1)!.remainingAnimals, 950);
  assert.equal(result.months.get(first + 2)!.remainingAnimals, 805);
});

test("automatic proposals never exceed the 100-sale input limit", () => {
  const v = input(Array.from({ length: 100 }, (_, i) => ({ ...sale(0), id: `existing-${i}` })));
  v.cashGoal = 100;
  v.proposalPrices = [{ sizeId: 1, pricePerThousand: 100, paymentDelayMonths: 0 }];
  assert.deepEqual(proposeSales(world(), world(), v), []);
});

test("each future order keeps its baseline allocation despite an existing shortfall", () => {
  const w = world();
  w.orders = [
    { key: "first", at: first + 1, sizeId: 2, quantity: 700 },
    { key: "second", at: first + 2, sizeId: 2, quantity: 300 },
  ];
  const baseline = replay(w, []);
  const candidate = { ...sale(0), id: "extra" };
  const quantity = safeCapacity(w, [], candidate, 1000);
  const trial = replay(w, [{ ...candidate, quantity }]);
  assert.deepEqual(trial.orders, baseline.orders);
  assert.equal(quantity, 0);
});