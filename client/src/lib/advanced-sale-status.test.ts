import test from "node:test";
import assert from "node:assert/strict";
import { advancedSaleStatusLabel } from "./advanced-sale-status";

test("reversed sales are not misleadingly labelled as drafts", () => {
  assert.equal(advancedSaleStatusLabel("cancelled"), "Stornata");
  assert.equal(advancedSaleStatusLabel("draft"), "Bozza");
  assert.equal(advancedSaleStatusLabel("confirmed"), "Confermata");
  assert.equal(advancedSaleStatusLabel("completed"), "Completata");
});

test("unknown statuses never appear as drafts", () => {
  assert.equal(advancedSaleStatusLabel("unexpected"), "Stato non riconosciuto");
});