import test from "node:test";
import assert from "node:assert/strict";
import { getCurrentOrderCoverage } from "./current-order-coverage";

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
