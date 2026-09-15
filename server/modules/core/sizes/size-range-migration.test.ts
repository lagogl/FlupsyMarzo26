import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../../../../migrations/20260910_active_size_range_versions.sql", import.meta.url),
  "utf8",
);

test("the cut-over migration defines exactly 26 active ranges", () => {
  const insertCteStart = migration.lastIndexOf(
    "WITH expected_ranges(code, min_animals_per_kg, max_animals_per_kg)",
  );
  const insertCteEnd = migration.indexOf("),\nresolved_ranges AS", insertCteStart);
  const valuesBlock = migration.slice(insertCteStart, insertCteEnd);
  const rows = [...valuesBlock.matchAll(/\(\s*'([^']+)',\s*(\d+),\s*(\d+)\)/g)];
  assert.equal(rows.length, 26);

  const activeCodes = rows.map(row => row[1]);
  assert.equal(new Set(activeCodes).size, 26);
  assert.deepEqual(
    ["TP-1900", "TP-2800", "TP-5500"].filter(code => activeCodes.includes(code)),
    [],
  );
  assert.deepEqual(
    rows.map(row => [row[1], Number(row[2]), Number(row[3])]),
    [
      ["TP-180", 70000001, 100000000], ["TP-250", 30000001, 70000000],
      ["TP-300", 20000001, 30000000], ["TP-350", 15000001, 20000000],
      ["TP-450", 8000001, 15000000], ["TP-500", 2000001, 8000000],
      ["TP-600", 1900001, 2000000], ["TP-700", 1000001, 1900000],
      ["TP-800", 880001, 1000000], ["TP-1000", 600001, 880000],
      ["TP-1140", 350001, 600000], ["TP-1260", 300001, 350000],
      ["TP-1500", 190000, 300000], ["TP-1800", 100001, 189999],
      ["TP-2000", 55000, 100000], ["TP-2500", 30000, 54999],
      ["TP-3000", 19000, 29999], ["TP-3500", 14000, 18999],
      ["TP-4000", 9000, 13999], ["TP-4500", 7100, 8999],
      ["TP-5000", 5000, 7099], ["TP-6000", 4000, 4999],
      ["TP-7000", 3000, 3999], ["TP-8000", 2400, 2999],
      ["TP-9000", 1500, 2399], ["TP-10000", 900, 1499],
    ],
  );
});

test("the migration resolves size IDs through codes", () => {
  assert.match(migration, /JOIN sizes s ON s\.code = expected\.code/);
  assert.match(migration, /INSERT INTO size_range_versions[\s\S]*SELECT[\s\S]*FROM resolved_ranges/);
  assert.doesNotMatch(migration, /VALUES\s*\(\s*\d+\s*,\s*\d+\s*,/);
  assert.doesNotMatch(migration, /size_id\s+NOT IN\s*\(\s*\d/);
});

test("the cut-over migration closes the previous ranges", () => {
  assert.match(
    migration,
    /SET valid_to = DATE '2026-09-09'[\s\S]*valid_from < DATE '2026-09-10'/,
  );
  assert.match(migration, /next_version\.valid_from > DATE '2026-09-10'/);
  assert.match(migration, /MIN\(next_version\.valid_from\) - 1/);
});
