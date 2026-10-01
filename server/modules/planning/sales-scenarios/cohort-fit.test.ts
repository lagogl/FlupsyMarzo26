import test from "node:test";
import assert from "node:assert/strict";
import { allocateScenario, monthNumber, projectWorld, proposeSales, replay, safeCapacity, type World } from "./engine";
import { scenarioInputSchema, type ScenarioInput, type ScenarioSale } from "../../../../shared/sales-scenarios";

const first = monthNumber(2027, 1);
const sale = (id = "small-sale", quantity = 100, month = 1): ScenarioSale => ({
  id, quantity, year: 2027, month, sizeId: 1, pricePerThousand: 1000, paymentDelayMonths: 0,
});
const input = (overrides: Partial<ScenarioInput> = {}): ScenarioInput => scenarioInputSchema.parse({
  name: "Physical fit", startYear: 2027, startMonth: 1, horizon: 2,
  sales: [], sandNursery: [], cashGoal: 100, cashDeadline: { year: 2027, month: 1 },
  proposalPrices: [{ sizeId: 1, pricePerThousand: 1000, paymentDelayMonths: 0 }],
  ...overrides,
});

// Size 1 is the requested TP-2000; size 2 is physically larger. Cohort order
// deliberately puts the large animals first to expose largest-first replay.
function world(survival = 1): World {
  return {
    first, last: first + 2, sizes: [1, 2],
    maxApk: Object.fromEntries([0, 1, 2].flatMap(offset => [
      [`${first + offset}|1`, 20_000], [`${first + offset}|2`, 10_000],
    ])),
    cohorts: [
      { quantity: 100, entry: first, path: {
        [first]: { survival: 1, sizeId: 2, animalsPerKg: 8000 },
        [first + 1]: { survival, sizeId: 2, animalsPerKg: 7000 },
        [first + 2]: { survival: 1, sizeId: 2, animalsPerKg: 6000 },
      } },
      { quantity: 100, entry: first, path: {
        [first]: { survival: 1, sizeId: 1, animalsPerKg: 18_000 },
        [first + 1]: { survival, sizeId: 1, animalsPerKg: 17_000 },
        [first + 2]: { survival: 1, sizeId: 1, animalsPerKg: 16_000 },
      } },
    ],
    orders: [{ key: "large-future", at: first + 1, sizeId: 2, quantity: 100 * survival }],
  };
}

test("100 small animals can be sold while 100 large animals remain reserved in both worlds", () => {
  const expected = world(), prudent = world();
  const v = input();
  const before = JSON.stringify([expected, prudent, v]);
  for (const w of [expected, prudent]) {
    assert.equal(projectWorld(w, v).months[0].availableBySize[1], 100);
    assert.equal(safeCapacity(w, [], { ...sale(), day: 1 }, 200), 100);
    const allocated = allocateScenario(w, input({ sales: [sale()] }));
    assert.equal(allocated[0].quantity, 100);
    const result = replay(w, allocated);
    assert.equal(result.applied["small-sale"], 100);
    assert.equal(result.orders["large-future"], 100);
    assert.equal(projectWorld(w, input({ sales: [sale()] })).finalStock, 0);
  }
  const proposed = proposeSales(expected, prudent, v);
  assert.equal(proposed.reduce((sum, row) => sum + row.quantity, 0), 100);
  assert.deepEqual(proposeSales(expected, prudent, v), proposed);
  for (const w of [expected, prudent]) {
    const applied = projectWorld(w, { ...v, sales: proposed });
    assert.equal(applied.receiptsByDeadline, 100);
    assert.equal(applied.unfulfilledSales, 0);
    assert.equal(applied.totalOrderShortfall, 0);
  }
  assert.equal(JSON.stringify([expected, prudent, v]), before);
});

test("same-day acquired orders have priority and retain their historical allocation", () => {
  for (const reversed of [false, true]) {
    const w = world();
    const orders = [
      { key: "large", at: first, day: 1, sizeId: 2, quantity: 100 },
      { key: "small", at: first, day: 1, sizeId: 1, quantity: 100 },
    ];
    w.orders = reversed ? orders.reverse() : orders;
    const result = replay(w, [{ ...sale(), day: 1 }]);
    assert.equal(result.orders.small, 100);
    assert.equal(result.orders.large, reversed ? 0 : 100);
    assert.equal(result.applied["small-sale"], reversed ? 100 : 0);
    assert.equal(safeCapacity(w, [], sale(), 100), reversed ? 100 : 0);
  }
});

test("mortality preserves the surviving large commitment and re-applied proposals remain feasible", () => {
  const expected = world(), prudent = world(0.8);
  const v = input();
  const proposed = proposeSales(expected, prudent, v);
  assert.equal(proposed.reduce((sum, row) => sum + row.quantity, 0), 100);
  for (const w of [expected, prudent]) {
    const final = projectWorld(w, { ...v, sales: proposed });
    assert.equal(final.totalOrderShortfall, 0);
    assert.equal(final.unfulfilledSales, 0);
    assert.equal(final.receiptsByDeadline, 100);
    assert.equal(final.finalStock, 0);
  }
});

test("heterogeneous survival never changes the acquired-order baseline to best-fit", () => {
  const w = world();
  w.cohorts[0].path[first + 1].survival = 0.5;
  w.cohorts[1].path[first + 1] = { survival: 1, sizeId: 2, animalsPerKg: 7000 };
  w.orders = [
    { key: "early-small-order", at: first, sizeId: 1, quantity: 80 },
    { key: "later-large-order", at: first + 1, sizeId: 2, quantity: 110 },
  ];
  // Historic order allocation takes 80 from the mature cohort. Afterwards
  // 20×0.5 + 100 survive. Best-fit *orders* would leave only 100×0.5 + 20.
  assert.deepEqual(replay(w, []).orders, {
    "early-small-order": 80, "later-large-order": 110,
  });
  assert.equal(safeCapacity(w, [], sale(), 100), 0);
  const proposed = proposeSales(w, w, input());
  const final = projectWorld(w, input({ sales: proposed }));
  assert.equal(final.totalOrderShortfall, 0);
});

test("daily size crossing and mortality allow only surviving newly eligible animals", () => {
  const w = world();
  const small = w.cohorts[1];
  small.path[first].animalsPerKg = 25_000;
  small.path[first].sizeId = null;
  small.path[first].days = Object.fromEntries(Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    return [day, { survival: day < 10 ? 1 : 0.8, sizeId: day < 10 ? null : 1,
      animalsPerKg: day < 10 ? 25_000 : 18_000 }];
  }));
  const v = input({ sales: [sale()] });
  const allocated = allocateScenario(w, v);
  assert.equal(allocated[0].day, 10);
  assert.equal(allocated[0].quantity, 80);
  assert.equal(replay(w, allocated).orders["large-future"], 100);
  const projection = projectWorld(w, input());
  assert.equal(projection.months[0].availableBySize[1], 80);
  assert.equal(projection.months[0].availabilityDayBySize?.[1], 10);
  const proposed = proposeSales(w, w, input());
  const final = projectWorld(w, input({ sales: proposed }));
  assert.equal(final.receiptsByDeadline, 80);
  assert.equal(final.unfulfilledSales, 0);
  assert.equal(final.totalOrderShortfall, 0);
});

test("orders beyond the visible horizon still reserve large animals individually", () => {
  const w = world();
  w.orders = [
    { key: "beyond-a", at: first + 2, sizeId: 2, quantity: 60 },
    { key: "beyond-b", at: first + 2, sizeId: 2, quantity: 60 },
  ];
  const v = input({ horizon: 1 });
  const proposed = proposeSales(w, w, v);
  assert.equal(proposed.reduce((sum, row) => sum + row.quantity, 0), 100);
  const final = replay(w, allocateScenario(w, { ...v, sales: proposed }));
  assert.deepEqual(final.orders, { "beyond-a": 60, "beyond-b": 40 });
  assert.equal(projectWorld(w, { ...v, sales: proposed }).totalOrderShortfall, 20);
});

test("manual sales and nursery share the pool without consuming large reserved animals twice", () => {
  const w = world();
  // Nursery retains its historical larger-first preference: 20 mature animals
  // are free in addition to the 100 reserved for the large acquired order.
  w.cohorts[0].quantity = 120;
  const v = input({
    sales: [sale("manual", 30)],
    sandNursery: [{ year: 2027, month: 1, quantity: 20 }],
  });
  const proposed = proposeSales(w, w, v);
  assert.equal(proposed.reduce((sum, row) => sum + row.quantity, 0), 70);
  const full = { ...v, sales: [...v.sales, ...proposed] };
  const allocated = allocateScenario(w, full);
  const replayed = replay(w, allocated);
  assert.equal(replayed.applied.manual, 30);
  assert.equal(replayed.applied["__nursery-0"], 20);
  assert.equal(replayed.orders["large-future"], 100);
  const final = projectWorld(w, full);
  assert.equal(final.unfulfilledSales, 0);
  assert.equal(final.totalOrderShortfall, 0);
  assert.equal(final.months[0].sandNurseryApplied, 20);
  assert.equal(final.finalStock, 0);
  assert.equal(final.totalRevenue, 100);
});

test("ties use a stable cohort index and never assign physically too-small animals", () => {
  const w = world();
  w.orders = [];
  w.cohorts[0].path[first].animalsPerKg = 18_000;
  w.cohorts[0].path[first].sizeId = 1;
  // Equal current sizes but different future survival make the tie observable.
  w.cohorts[0].path[first + 1].survival = 0.5;
  const firstReplay = replay(w, [sale()]);
  assert.equal(firstReplay.months.get(first + 1)?.remainingAnimals, 100);
  assert.deepEqual(replay(w, [sale()]), firstReplay);
  const large = { ...sale(), sizeId: 2 };
  assert.equal(replay(w, [large]).applied[large.id], 0);
});