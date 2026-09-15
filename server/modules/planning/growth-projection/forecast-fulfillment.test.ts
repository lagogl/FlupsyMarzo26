import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateFulfillableProductionForecast,
  getProductionTargetCategory,
} from "./forecast-fulfillment";

test("limita il forecast alla giacenza disponibile", () => {
  assert.equal(calculateFulfillableProductionForecast(30_000_000, 20_000_000), 20_000_000);
});

test("non supera il forecast quando la giacenza è sufficiente", () => {
  assert.equal(calculateFulfillableProductionForecast(30_000_000, 40_000_000), 30_000_000);
});

test("non restituisce quantità negative", () => {
  assert.equal(calculateFulfillableProductionForecast(-1, 20_000_000), 0);
  assert.equal(calculateFulfillableProductionForecast(30_000_000, -1), 0);
});

test("seleziona la categoria del forecast in base al range della taglia target", () => {
  assert.equal(getProductionTargetCategory(30_000), "T3");
  assert.equal(getProductionTargetCategory(6_000), "T3");
  assert.equal(getProductionTargetCategory(5_999), "T10");
});