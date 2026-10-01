import test from "node:test";
import assert from "node:assert/strict";
import {
  PLANNING_TABLE_PREFERENCES_KEY,
  readPlanningTablePreferences,
  savePlanningTablePreferences,
} from "./planning-table-preferences";

function memoryStorage(initial?: string) {
  const values = new Map<string, string>();
  if (initial !== undefined) values.set(PLANNING_TABLE_PREFERENCES_KEY, initial);
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

test("first visit shows all indicators with the default orientation", () => {
  const preferences = readPlanningTablePreferences(memoryStorage());
  assert.equal(preferences.hiddenRows.size, 0);
  assert.equal(preferences.orientation, "indicators-rows");
});

test("leaving and remounting restores hidden indicators and column orientation", () => {
  const storage = memoryStorage();
  const hiddenRows = new Set(["budget", "arretrato_size_TP-4000", "order_month_end_coverage_total"]);
  assert.equal(savePlanningTablePreferences({ hiddenRows, orientation: "months-rows" }, storage), true);
  const restored = readPlanningTablePreferences(storage);
  assert.deepEqual(restored.hiddenRows, hiddenRows);
  assert.notEqual(restored.hiddenRows, hiddenRows);
  assert.equal(restored.orientation, "months-rows");
});

test("show all persists and replaces the previous hidden selection", () => {
  const storage = memoryStorage();
  savePlanningTablePreferences({ hiddenRows: new Set(["budget"]), orientation: "months-rows" }, storage);
  savePlanningTablePreferences({ hiddenRows: new Set(), orientation: "months-rows" }, storage);
  assert.equal(readPlanningTablePreferences(storage).hiddenRows.size, 0);
  assert.equal(readPlanningTablePreferences(storage).orientation, "months-rows");
});

test("temporarily absent indicators retain their saved visibility", () => {
  const storage = memoryStorage();
  savePlanningTablePreferences({ hiddenRows: new Set(["ordini_size_TP-4000"]), orientation: "indicators-rows" }, storage);
  assert.equal(readPlanningTablePreferences(storage).hiddenRows.has("ordini_size_TP-4000"), true);
});

test("invalid saved data and blocked browser storage do not prevent opening the table", () => {
  const warn = console.warn;
  console.warn = () => {};
  try {
    for (const raw of ["invalid json", "null", "[]", '{"hiddenRows":[4],"orientation":"months-rows"}',
      '{"hiddenRows":[],"orientation":"invalid"}']) {
      const result = readPlanningTablePreferences(memoryStorage(raw));
      assert.equal(result.hiddenRows.size, 0);
      assert.equal(result.orientation, "indicators-rows");
    }
    const blockedStorage = {
      getItem: (): string | null => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
    };
    assert.equal(readPlanningTablePreferences(blockedStorage).hiddenRows.size, 0);
    assert.equal(savePlanningTablePreferences({ hiddenRows: new Set(), orientation: "months-rows" }, blockedStorage), false);
  } finally {
    console.warn = warn;
  }
});