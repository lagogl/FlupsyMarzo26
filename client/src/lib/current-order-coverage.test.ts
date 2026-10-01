import test from "node:test";
import assert from "node:assert/strict";
import {
  getCurrentOrderCoverage,
  getDeliveryCoverageUnverifiable,
  getDeliveryOrderCoverage,
} from "./current-order-coverage";

test("reports partial current-order coverage and the uncovered gap", () => {
  assert.deepEqual(getCurrentOrderCoverage(10, 4), {
    available: true,
    requested: 10,
    covered: 4,
    uncovered: 6,
    percent: 40,
    complete: false,
  });
});

test("zero allocation is valid data but not full coverage", () => {
  assert.deepEqual(getCurrentOrderCoverage(8, 0), {
    available: true,
    requested: 8,
    covered: 0,
    uncovered: 8,
    percent: 0,
    complete: false,
  });
});

test("only exact or greater allocation is complete", () => {
  assert.equal(getCurrentOrderCoverage(5, 5).complete, true);
  assert.equal(getCurrentOrderCoverage(5, 5).percent, 100);
  assert.equal(getCurrentOrderCoverage(5, 6).covered, 5);
  assert.equal(getCurrentOrderCoverage(5, 6).uncovered, 0);
  assert.equal(getCurrentOrderCoverage(5, 6).complete, true);
  assert.equal(getCurrentOrderCoverage(5, 6).percent, 100);
});

test("a rounded near-full percentage remains incomplete", () => {
  const coverage = getCurrentOrderCoverage(300, 299);
  assert.ok(coverage.percent !== null && coverage.percent > 99.6 && coverage.percent < 99.7);
  assert.equal(coverage.complete, false);
  assert.equal(coverage.uncovered, 1);
});

test("zero requests have no percentage and are not marked green-complete", () => {
  const coverage = getCurrentOrderCoverage(0, 20);
  assert.equal(coverage.available, true);
  assert.equal(coverage.covered, 0);
  assert.equal(coverage.uncovered, 0);
  assert.equal(coverage.percent, null);
  assert.equal(coverage.complete, false);
});

test("missing or invalid current allocation never asserts coverage", () => {
  for (const [requested, allocated] of [
    [10, undefined],
    [10, null],
    [undefined, 10],
    [10, Number.NaN],
    [10, -1],
    [-1, 10],
  ] as const) {
    const coverage = getCurrentOrderCoverage(requested, allocated);
    assert.equal(coverage.available, false);
    assert.equal(coverage.covered, null);
    assert.equal(coverage.uncovered, null);
    assert.equal(coverage.percent, null);
    assert.equal(coverage.complete, false);
  }
});

const deliveryCoverageFixture = {
  requested: 10,
  covered: 6,
  uncovered: 4,
  arrearsFulfilled: 3,
  unverifiable: 2,
  bySize: {
    "TP-3000": {
      requested: 7,
      covered: 5,
      uncovered: 2,
      arrearsFulfilled: 1,
      unverifiable: 1,
    },
    "TP-4000": {
      requested: 3,
      covered: 1,
      uncovered: 2,
      arrearsFulfilled: 2,
      unverifiable: 1,
    },
  },
};

test("delivery-date percentage only uses dated current orders; late arrears stay separate", () => {
  assert.deepEqual(getDeliveryOrderCoverage(deliveryCoverageFixture), {
    available: true,
    requested: 10,
    covered: 6,
    uncovered: 4,
    percent: 60,
    complete: false,
    arrearsFulfilled: 3,
    unverifiable: 2,
  });
});

test("delivery-date coverage can be read per size without combining arrears into coverage", () => {
  const coverage = getDeliveryOrderCoverage(deliveryCoverageFixture, "TP-4000");
  assert.ok(coverage.percent !== null && Math.abs(coverage.percent - 100 / 3) < 1e-12);
  assert.equal(coverage.covered, 1);
  assert.equal(coverage.uncovered, 2);
  assert.equal(coverage.arrearsFulfilled, 2);
  assert.equal(coverage.unverifiable, 1);
});

test("missing deadline API data remains unavailable instead of becoming zero coverage", () => {
  for (const coverage of [
    getDeliveryOrderCoverage(undefined),
    getDeliveryOrderCoverage({
      requested: 0,
      covered: 0,
      uncovered: 0,
      arrearsFulfilled: 0,
      unverifiable: 0,
    } as never),
    getDeliveryOrderCoverage({
      ...deliveryCoverageFixture,
      covered: undefined as unknown as number,
    }),
    getDeliveryOrderCoverage({
      ...deliveryCoverageFixture,
      uncovered: 3,
    }),
  ]) {
    assert.equal(coverage.available, false);
    assert.equal(coverage.requested, null);
    assert.equal(coverage.covered, null);
    assert.equal(coverage.uncovered, null);
    assert.equal(coverage.percent, null);
    assert.equal(coverage.arrearsFulfilled, null);
    assert.equal(coverage.unverifiable, null);
  }
});

test("an omitted size in the present sparse API map means no dated orders for that size", () => {
  assert.deepEqual(getDeliveryOrderCoverage({ ...deliveryCoverageFixture, bySize: {} }, "TP-5000"), {
    available: true,
    requested: 0,
    covered: 0,
    uncovered: 0,
    percent: null,
    complete: false,
    arrearsFulfilled: 0,
    unverifiable: 0,
  });
});

test("orders with no known month preserve zero distinctly from unavailable", () => {
  assert.equal(getDeliveryCoverageUnverifiable(0), 0);
  assert.equal(getDeliveryCoverageUnverifiable(12), 12);
  assert.equal(getDeliveryCoverageUnverifiable(undefined), null);
  assert.equal(getDeliveryCoverageUnverifiable(-1), null);
  assert.equal(getDeliveryCoverageUnverifiable(Number.NaN), null);
});
