import test from "node:test";
import assert from "node:assert/strict";
import { PgDialect } from "drizzle-orm/pg-core";
import { activeOrdersCondition, hatcherySizeCode } from "./source-data";

test("legacy T1 arrivals use TP-300 without guessing other aggregate sizes", () => {
  assert.equal(hatcherySizeCode("T1"), "TP-300");
  assert.equal(hatcherySizeCode(" tp-300 "), "TP-300");
  assert.equal(hatcherySizeCode("TP-1000"), "TP-1000");
  assert.equal(hatcherySizeCode("T3"), "T3");
});

test("order query uses null-safe cancellation and explicit terminal-state exclusions", () => {
  const query = new PgDialect().sqlToQuery(activeOrdersCondition());
  assert.match(query.sql, /"cancellato" IS DISTINCT FROM TRUE/);
  assert.match(query.sql, /"stato" IS DISTINCT FROM 'Annullato'/);
  assert.match(query.sql, /"stato" IS DISTINCT FROM 'Completato'/);
  assert.equal((query.sql.match(/AND/g) ?? []).length, 2);
});