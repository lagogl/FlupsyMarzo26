import test from "node:test";
import assert from "node:assert/strict";
import {
  addForecastAllocationToLedger,
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

test("accumula solo forecast evadibile e semina Sand Nursery nel registro Forecast", () => {
  const afterApril = addForecastAllocationToLedger(0, 10_000_000, 393_057);
  const afterMay = addForecastAllocationToLedger(afterApril, 50_000_000, 27_469_094);

  assert.equal(afterApril, 10_393_057);
  assert.equal(afterMay, 87_862_151);
});

test("il registro Forecast ignora quantità negative", () => {
  assert.equal(addForecastAllocationToLedger(-1, 10_000_000, -2), 10_000_000);
});

test("seleziona la categoria del forecast in base al range della taglia target", () => {
  assert.equal(getProductionTargetCategory(30_000), "T3");
  assert.equal(getProductionTargetCategory(6_000), "T3");
  assert.equal(getProductionTargetCategory(5_999), "T10");
});