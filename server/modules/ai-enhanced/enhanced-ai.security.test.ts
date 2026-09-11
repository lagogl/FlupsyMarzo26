import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeQueryLimit,
  prepareSafeQuery,
  validateSQLQuery
} from "./enhanced-ai.controller";

test("enhanced AI rejects SQL forms that can bypass the allowlist", () => {
  for (const query of [
    'SELECT id FROM "users"',
    "SELECT * FROM operations",
    "SELECT o.* FROM operations o",
    "SELECT id FROM operations; SELECT id FROM users",
    "SELECT id FROM operations -- hide trailing SQL",
    "WITH hidden AS (SELECT id FROM users) SELECT id FROM hidden",
    "SELECT nextval('operations_id_seq')",
    "SELECT pg_sleep(10)"
  ]) {
    assert.equal(validateSQLQuery(query).valid, false, query);
  }
});

test("enhanced AI accepts a simple explicit-column query on an allowed table", () => {
  assert.equal(
    validateSQLQuery("SELECT id, basket_id FROM operations LIMIT 20").valid,
    true
  );
});

test("enhanced AI clamps and sanitizes query limits", () => {
  assert.equal(normalizeQueryLimit(25), 25);
  assert.equal(normalizeQueryLimit(-4), 1);
  assert.equal(normalizeQueryLimit(50000), 1000);
  assert.equal(normalizeQueryLimit("20"), 20);
  assert.equal(normalizeQueryLimit("1; DROP TABLE users"), 200);
  assert.equal(normalizeQueryLimit(2.5), 200);
});

test("enhanced AI always enforces the server-side result limit", () => {
  assert.equal(
    prepareSafeQuery("SELECT id FROM operations", 100),
    "SELECT id FROM operations LIMIT 100;"
  );
  assert.equal(
    prepareSafeQuery("SELECT id FROM operations LIMIT 20", 100),
    "SELECT id FROM operations LIMIT 20;"
  );
  assert.equal(
    prepareSafeQuery("SELECT id FROM operations LIMIT 100000000", 100),
    "SELECT id FROM operations LIMIT 100;"
  );
  assert.equal(
    prepareSafeQuery("SELECT id AS unlimited FROM operations", 100),
    "SELECT id AS unlimited FROM operations LIMIT 100;"
  );
});