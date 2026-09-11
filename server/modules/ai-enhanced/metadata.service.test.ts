import assert from "node:assert/strict";
import test from "node:test";
import { AI_SAFE_TABLES, getSafeAIMetadata } from "./metadata.service";

test("AI metadata excludes commercial, identity and configuration tables", () => {
  const names = new Set(getSafeAIMetadata().map(table => table.name));

  for (const blocked of [
    "users",
    "user_sessions",
    "clienti",
    "advanced_sales",
    "ddt",
    "ddt_righe",
    "external_customers_sync",
    "notification_settings",
    "configurazione"
  ]) {
    assert.equal(names.has(blocked), false, `${blocked} must not be exposed to AI`);
  }
});

test("AI metadata contains only allowlisted tables and no sensitive fields", () => {
  const allowed = new Set<string>(AI_SAFE_TABLES);
  const sensitiveField = /(password|secret|token|api.?key|email|phone|address|customer|client)/i;

  for (const table of getSafeAIMetadata()) {
    assert.equal(allowed.has(table.name), true);
    assert.equal(table.fields.some(field => field.isPII || sensitiveField.test(field.name)), false);
    assert.equal(table.relationships.every(relationship => allowed.has(relationship.targetTable)), true);
  }
});