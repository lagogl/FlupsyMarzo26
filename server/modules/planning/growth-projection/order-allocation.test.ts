import test from "node:test";
import assert from "node:assert/strict";
import { allocateOrdersAgainstBaskets } from "./order-allocation";

test("allocates overlapping tag orders from one shared stock pool exactly once", () => {
  const baskets = [{ animalsPerKg: 80, animalCount: 10 }];
  const result = allocateOrdersAgainstBaskets(
    baskets,
    { "TP-100": 6, "TP-200": 6 },
    {},
    { "TP-100": 100, "TP-200": 200 },
  );

  assert.deepEqual(result.currentFulfilledBySize, { "TP-100": 6, "TP-200": 4 });
  assert.equal(result.currentFulfilledTotal, 10);
  assert.deepEqual(result.endingBacklogBySize, { "TP-200": 2 });
  assert.equal(baskets[0].animalCount, 0);
});

test("backlog is allocated before current orders and hard physical sizes before easy sizes", () => {
  const baskets = [
    { animalsPerKg: 50, animalCount: 4 },
    { animalsPerKg: 150, animalCount: 10 },
  ];
  const result = allocateOrdersAgainstBaskets(
    baskets,
    { "TP-100": 3 },
    { "TP-100": 2, "TP-200": 3 },
    { "TP-100": 100, "TP-200": 200 },
  );

  assert.deepEqual(result.arrearsFulfilledBySize, { "TP-100": 2, "TP-200": 3 });
  assert.deepEqual(result.currentFulfilledBySize, { "TP-100": 2 });
  assert.deepEqual(result.endingBacklogBySize, { "TP-100": 1 });
  assert.equal(result.arrearsStartTotal, 5);
  assert.equal(result.arrearsFulfilledTotal, 5);
  assert.equal(baskets.reduce((sum, basket) => sum + basket.animalCount, 0), 7);
});

test("best fit consumes the least-mature eligible fish first", () => {
  const baskets = [
    { animalsPerKg: 50, animalCount: 2 },
    { animalsPerKg: 100, animalCount: 2 },
  ];
  const result = allocateOrdersAgainstBaskets(
    baskets,
    { "TP-100": 2 },
    {},
    { "TP-100": 100 },
  );

  assert.equal(result.currentFulfilledTotal, 2);
  assert.deepEqual(baskets.map((basket) => basket.animalCount), [2, 0]);
});

test("hardest order priority follows active physical ranges, not TP code numbers", () => {
  const result = allocateOrdersAgainstBaskets(
    [{ animalsPerKg: 50, animalCount: 3 }],
    { "TP-1140": 3, "TP-2000": 3 },
    {},
    { "TP-1140": 300, "TP-2000": 100 },
  );

  assert.deepEqual(result.currentFulfilledBySize, { "TP-2000": 3, "TP-1140": 0 });
});

test("equal-range allocation is deterministic across repeated runs", () => {
  const run = () => {
    const baskets = [
      { animalsPerKg: 80, animalCount: 2 },
      { animalsPerKg: 80, animalCount: 2 },
    ];
    const result = allocateOrdersAgainstBaskets(
      baskets,
      { "TP-B": 2, "TP-A": 2 },
      {},
      { "TP-A": 100, "TP-B": 100 },
    );
    return { result, basketCounts: baskets.map((basket) => basket.animalCount) };
  };
  assert.deepEqual(run(), run());
});

test("all tag backlogs carry forward and are fulfilled from subsequent shared stock", () => {
  const firstMonthBaskets = [{ animalsPerKg: 50, animalCount: 3 }];
  const firstMonth = allocateOrdersAgainstBaskets(
    firstMonthBaskets,
    { "TP-100": 2, "TP-200": 2 },
    {},
    { "TP-100": 100, "TP-200": 200 },
  );
  assert.deepEqual(firstMonth.endingBacklogBySize, { "TP-200": 1 });

  const secondMonth = allocateOrdersAgainstBaskets(
    [{ animalsPerKg: 75, animalCount: 2 }],
    { "TP-100": 1 },
    firstMonth.endingBacklogBySize,
    { "TP-100": 100, "TP-200": 200 },
  );
  assert.deepEqual(secondMonth.arrearsFulfilledBySize, { "TP-200": 1 });
  assert.deepEqual(secondMonth.currentFulfilledBySize, { "TP-100": 1 });
  assert.deepEqual(secondMonth.endingBacklogBySize, {});
});

test("fractional animal counts fail instead of creating fractional allocations", () => {
  assert.throws(
    () => allocateOrdersAgainstBaskets(
      [{ animalsPerKg: 50, animalCount: 1.5 }],
      { "TP-100": 1 },
      {},
      { "TP-100": 100 },
    ),
    /finite non-negative integer/,
  );
  assert.throws(
    () => allocateOrdersAgainstBaskets(
      [{ animalsPerKg: 50, animalCount: 2 }],
      { "TP-100": 1.5 },
      {},
      { "TP-100": 100 },
    ),
    /finite non-negative integer/,
  );
});

test("orders with unknown or missing active ranges remain unfulfilled backlog", () => {
  const result = allocateOrdersAgainstBaskets(
    [{ animalsPerKg: 50, animalCount: 10 }],
    { UNKNOWN: 3, "TP-100": 2 },
    {},
    { "TP-100": 100 },
  );

  assert.deepEqual(result.currentFulfilledBySize, { UNKNOWN: 0, "TP-100": 2 });
  assert.deepEqual(result.endingBacklogBySize, { UNKNOWN: 3 });
  assert.equal(result.currentFulfilledTotal, 2);
});

test("current coverage excludes backlog fulfillment and percentages cannot be inflated by arrears", () => {
  const result = allocateOrdersAgainstBaskets(
    [{ animalsPerKg: 75, animalCount: 3 }],
    { "TP-100": 2 },
    { "TP-100": 2 },
    { "TP-100": 100 },
  );

  assert.deepEqual(result.arrearsFulfilledBySize, { "TP-100": 2 });
  assert.deepEqual(result.currentFulfilledBySize, { "TP-100": 1 });
  assert.equal(result.arrearsStartTotal, 2);
  assert.equal(result.currentFulfilledTotal, 1);
  assert.deepEqual(result.endingBacklogBySize, { "TP-100": 1 });
});

test("invalid numeric inventory or active-range data fails explicitly", () => {
  assert.throws(
    () => allocateOrdersAgainstBaskets(
      [{ animalsPerKg: Number.NaN, animalCount: 1 }],
      {},
      {},
      {},
    ),
    /invalid animals-per-kg/,
  );
  assert.throws(
    () => allocateOrdersAgainstBaskets(
      [{ animalsPerKg: 50, animalCount: 1 }],
      { "TP-100": 1 },
      {},
      { "TP-100": Number.POSITIVE_INFINITY },
    ),
    /Invalid active max/,
  );
});