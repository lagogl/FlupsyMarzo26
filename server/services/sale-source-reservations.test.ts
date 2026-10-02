import test from "node:test";
import assert from "node:assert/strict";
import { sql } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { manualSaleSourceIsAvailable } from "./sale-source-reservations";

test("manual source availability ignores only audited cancellations and preserves historical references", () => {
  const query = new PgDialect().sqlToQuery(manualSaleSourceIsAvailable(sql`op.id`));
  assert.match(query.sql, /existing_ref\.operation_id = op\.id/);
  assert.match(query.sql, /reversed_sale\.id = existing_ref\.advanced_sale_id/);
  assert.match(query.sql, /reversed_sale\.status = 'cancelled'/);
  assert.match(query.sql, /reversed_sale\.cancelled_at IS NOT NULL/);
  assert.equal((query.sql.match(/NOT EXISTS/g) || []).length, 2);
  assert.doesNotMatch(query.sql, /DELETE|UPDATE|INSERT/);
});

test("caller operation identifiers and values remain composed safely", () => {
  const query = new PgDialect().sqlToQuery(manualSaleSourceIsAvailable(sql`${6316}`));
  assert.match(query.sql, /existing_ref\.operation_id = \$1/);
  assert.deepEqual(query.params, [6316]);
});