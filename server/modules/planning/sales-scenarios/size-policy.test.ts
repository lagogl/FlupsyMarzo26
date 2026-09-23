import test from "node:test";
import assert from "node:assert/strict";
import { SALES_SCENARIO_SIZE_CODES, isScenarioSaleSize, selectedScenarioSizeIds, validateScenarioSaleSizes } from "../../../../shared/sales-scenario-size-policy";
import { scenarioInputSchema } from "../../../../shared/sales-scenarios";

const catalog = [
  ...SALES_SCENARIO_SIZE_CODES.map((code, i) => ({ id: i + 1, code })),
  { id: 20, code: "TP-2500" }, { id: 21, code: "TP-300" },
];

test("commercial whitelist is exactly the nine confirmed identities, not numeric intervals", () => {
  assert.equal(SALES_SCENARIO_SIZE_CODES.length, 9);
  for (const code of SALES_SCENARIO_SIZE_CODES) assert.equal(isScenarioSaleSize(code), true);
  for (const code of ["TP-300", "TP-1800", "TP-2500", "TP-3500", "TP-4500", "TP-5500", "TP-11000", "T3"]) {
    assert.equal(isScenarioSaleSize(code), false, code);
  }
});

test("manual and persisted input validation rejects excluded and unknown sizes without modifying input", () => {
  const input = { sales: [{ sizeId: 20 }], proposalPrices: [] };
  const before = JSON.stringify(input);
  assert.throws(() => validateScenarioSaleSizes(input, catalog), /TP-2500.*Modificare o eliminare/);
  assert.equal(JSON.stringify(input), before);
  assert.throws(() => validateScenarioSaleSizes({ sales: [{ sizeId: 999 }], proposalPrices: [] }, catalog), /ID 999/);
  assert.doesNotThrow(() => validateScenarioSaleSizes({ sales: [{ sizeId: 1 }], proposalPrices: [{ sizeId: 9 }] }, catalog));
});

test("legacy automatic prices require explicit removal with an actionable error", () => {
  assert.throws(() => validateScenarioSaleSizes({ sales: [], proposalPrices: [{ sizeId: 21 }] }, catalog), /TP-300.*Rimuovere i prezzi esclusi/);
});

test("missing legacy selection means all nine allowed sizes while an explicit subset is preserved", () => {
  assert.deepEqual(selectedScenarioSizeIds({}, catalog), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(selectedScenarioSizeIds({ selectedSizeIds: [2, 8] }, catalog), [2, 8]);
  assert.doesNotThrow(() => validateScenarioSaleSizes({ selectedSizeIds: [2, 8], sales: [{ sizeId: 2 }], proposalPrices: [{ sizeId: 8 }] }, catalog));
});

test("empty, unknown, excluded and unselected commercial sizes are rejected", () => {
  const base = { name: "Test", startYear: 2027, startMonth: 1, horizon: 1, cashDeadline: { year: 2027, month: 1 } };
  assert.equal(scenarioInputSchema.safeParse({ ...base, selectedSizeIds: [] }).success, false);
  assert.throws(() => validateScenarioSaleSizes({ selectedSizeIds: [], sales: [], proposalPrices: [] }, catalog), /almeno una/);
  assert.throws(() => validateScenarioSaleSizes({ selectedSizeIds: [999], sales: [], proposalPrices: [] }, catalog), /ID 999/);
  assert.throws(() => validateScenarioSaleSizes({ selectedSizeIds: [20], sales: [], proposalPrices: [] }, catalog), /TP-2500/);
  assert.throws(() => validateScenarioSaleSizes({ selectedSizeIds: [2], sales: [{ sizeId: 1 }], proposalPrices: [] }, catalog), /non selezionate/);
  assert.throws(() => validateScenarioSaleSizes({ selectedSizeIds: [2], sales: [], proposalPrices: [{ sizeId: 1 }] }, catalog), /non selezionate/);
});