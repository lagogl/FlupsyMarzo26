import test from "node:test";
import assert from "node:assert/strict";
import { PgDialect } from "drizzle-orm/pg-core";
import { activeDeliveryOrdersCondition } from "./delivery-order-source";

test("daily coverage keeps null-state open orders but excludes explicit cancellation and completion", () => {
  const query = new PgDialect().sqlToQuery(activeDeliveryOrdersCondition());
  assert.match(query.sql, /"cancellato" IS DISTINCT FROM TRUE/);
  assert.match(query.sql, /"stato" IS DISTINCT FROM 'Annullato'/);
  assert.match(query.sql, /"stato" IS DISTINCT FROM 'Completato'/);
  assert.equal((query.sql.match(/AND/g) ?? []).length, 2);
});