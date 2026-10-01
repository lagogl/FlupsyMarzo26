import test from "node:test";
import assert from "node:assert/strict";
import {
  describeHatcheryRecovery,
  snapshotBiologicalAvailability,
  summarizeAllocationOrigins,
} from "./availability-presentation";

test("biological classes are exclusive, include unknowns and snapshot before mutation", () => {
  const baskets = [
    { weightMg: 10, animalCount: 60 },
    { weightMg: 30, animalCount: 40 },
    { weightMg: 50, animalCount: 20 },
    { weightMg: 30, animalCount: 0 },
  ];
  const snapshot = snapshotBiologicalAvailability(
    baskets,
    weight => weight === 10 ? "TP-2000" : weight === 30 ? "TP-3000" : null,
  );
  assert.deepEqual(snapshot, {
    bySize: { "TP-2000": 60, "TP-3000": 40, "N/D": 20 },
    total: 120,
  });
  baskets[0].animalCount = 0;
  assert.equal(snapshot.bySize["TP-2000"], 60);
  assert.equal(Object.values(snapshot.bySize).reduce((a, b) => a + b, 0), snapshot.total);
});

test("October assignments explain target pool plus separate smaller stock exactly once", () => {
  assert.deepEqual(summarizeAllocationOrigins(21_882_502, 0, 27_882_502), {
    fromTargetOrLarger: 21_882_502,
    fromBelowTarget: 6_000_000,
  });
});

test("November assignments include recovered arrears but leave target residue", () => {
  assert.deepEqual(summarizeAllocationOrigins(10_835_343, 868_640, 4_915_079 + 5_051_624), {
    fromTargetOrLarger: 9_966_703,
    fromBelowTarget: 0,
  });
});

test("a smaller-size order may consume larger stock; origins are physical, not order labels", () => {
  assert.deepEqual(summarizeAllocationOrigins(100, 50, 80), {
    fromTargetOrLarger: 50,
    fromBelowTarget: 30,
  });
  assert.throws(() => summarizeAllocationOrigins(100, 0, 80), /Inconsistent/);
});

test("zero hatchery recommendation is distinct from impossible recovery of a positive deficit", () => {
  assert.equal(describeHatcheryRecovery(20_417_396, false, false), "non-recuperabile");
  assert.equal(describeHatcheryRecovery(20_417_396, false, true), "recuperabile");
  assert.equal(describeHatcheryRecovery(0, false, false), "nessuno-scoperto");
  assert.equal(describeHatcheryRecovery(100, true, false), "non-verificabile");
});