import test from "node:test";
import assert from "node:assert/strict";
import { summarizeArrears, summarizeCoverage } from "./availability-summary";

test("current allocations remain distinct from backlog and requested sizes total correctly", () => {
  const result = summarizeCoverage({
    ordiniBySize: { "T3": 70, "T4": 30 },
    ordiniEvasiBySize: { "T3": 55, "T4": 20 },
    ordiniEvasiTotali: 75,
  });
  assert.deepEqual(
    { requested: result.requested, assigned: result.assigned, uncovered: result.uncovered },
    { requested: 100, assigned: 75, uncovered: 25 },
  );
  assert.deepEqual(result.bySize, [
    { size: "T3", requested: 70, assigned: 55, uncovered: 15 },
    { size: "T4", requested: 30, assigned: 20, uncovered: 10 },
  ]);
});

test("legacy arrears never enter valid current-quota quantities or size rows", () => {
  const result = summarizeCoverage({
    ordiniBySize: { T3: 100 },
    ordiniEvasiBySize: { T3: 75 },
    ordiniEvasiTotali: 75,
    ordiniArretratiBySize: { T4: 900 },
    ordiniArretratiEvasiBySize: { T4: 800 },
  });
  assert.equal(result.requested, 100);
  assert.equal(result.assigned, 75);
  assert.equal(result.uncovered, 25);
  assert.deepEqual(result.bySize, [{ size: "T3", requested: 100, assigned: 75, uncovered: 25 }]);
});

test("arrears show previous-only residual rather than current uncovered demand", () => {
  const result = summarizeArrears({
    ordiniBySize: { T3: 80 },
    ordiniArretratiBySize: { T3: 40, T4: 12 },
    ordiniArretratiEvasiBySize: { T3: 25, T4: 12 },
  });
  assert.deepEqual(
    { entering: result.entering, recovered: result.recovered, open: result.open },
    { entering: 52, recovered: 37, open: 15 },
  );
});

test("missing allocations preserve known demand without inventing zeros", () => {
  const result = summarizeCoverage({
    ordiniBySize: { "TP-3000": 100 },
    ordiniEvasiTotali: 60,
  });
  assert.equal(result.assigned, 60);
  assert.deepEqual(result.bySize, [{ size: "TP-3000", requested: 100, assigned: null, uncovered: null }]);
});

test("invalid allocation details stay unavailable, not fully covered or zero requested", () => {
  for (const value of [NaN, -1, 1.5]) {
    const result = summarizeCoverage({
      ordiniBySize: { "TP-3000": 100 },
      ordiniEvasiBySize: { "TP-3000": value },
      ordiniEvasiTotali: 60,
    });
    assert.deepEqual(result.bySize, [{ size: "TP-3000", requested: 100, assigned: null, uncovered: null }]);
  }
  assert.equal(summarizeArrears({
    ordiniArretratiBySize: { "TP-4000": 10 },
    ordiniArretratiEvasiBySize: { "TP-4000": 11 },
  }).available, false);
});

test("December exposes TP-4000 prior backlog independently of new uncovered orders", () => {
  const month = {
    ordiniBySize: { "TP-3000": 25_442_857, "TP-4000": 666_667 },
    ordiniEvasiBySize: { "TP-3000": 5_025_461, "TP-4000": 0 },
    ordiniEvasiTotali: 5_025_461,
    ordiniArretratiBySize: { "TP-4000": 1_000_000 },
    ordiniArretratiEvasiBySize: { "TP-4000": 0 },
  };
  const current = summarizeCoverage(month);
  const arrears = summarizeArrears(month);
  assert.equal(current.uncovered, 21_084_063);
  assert.deepEqual(arrears.bySize, [{ size: "TP-4000", entering: 1_000_000, recovered: 0, open: 1_000_000 }]);
  assert.equal(current.uncovered! + arrears.open!, 22_084_063);
});

test("present sparse maps and empty stock are distinct from absent maps", () => {
  assert.deepEqual(summarizeCoverage({
    ordiniBySize: { "TP-3000": 10 },
    ordiniEvasiBySize: {},
    ordiniEvasiTotali: 0,
  }).bySize, [{ size: "TP-3000", requested: 10, assigned: 0, uncovered: 10 }]);
  assert.equal(summarizeCoverage({ ordiniEvasiTotali: 0 }).available, false);
  assert.equal(summarizeArrears({ ordiniArretratiBySize: {}, ordiniArretratiEvasiBySize: {} }).available, true);
});