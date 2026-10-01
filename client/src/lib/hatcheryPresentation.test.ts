import test from "node:test";
import assert from "node:assert/strict";
import { aggregateHatcheryPresentation, buildHatcheryActualUpdate, getAdditionalHatcheryNeed } from "./hatcheryPresentation";

const record = (overrides: Partial<Parameters<typeof aggregateHatcheryPresentation>[0][number]> = {}) => ({
  id: 1,
  year: 2026,
  month: 4,
  quantity: 0,
  actualQuantity: null,
  sizeCategory: "TP-300",
  ...overrides,
});

test("aggregates category forecasts and counts monthly actual and injected context only once", () => {
  const [summary] = aggregateHatcheryPresentation([
    record({ id: 1, quantity: 60, calculatedActual: 30, calculatedActualLotCount: 2 }),
    record({ id: 2, quantity: 40, sizeCategory: "TP-500", calculatedActual: 30, calculatedActualLotCount: 2 }),
  ], [{ year: 2026, month: 4, arriviSchiuditoio: 70 }]);

  assert.equal(summary.forecastQuantity, 100);
  assert.equal(summary.actualQuantity, 30);
  assert.equal(summary.injectedQuantity, 70);
});

test("a live zero actual takes precedence over stale manual values", () => {
  const [summary] = aggregateHatcheryPresentation([
    record({ actualQuantity: 15, calculatedActual: 0, calculatedActualLotCount: 1 }),
    record({ id: 2, actualQuantity: 20, calculatedActual: 0, calculatedActualLotCount: 1 }),
  ]);

  assert.equal(summary.actualQuantity, 0);
  assert.equal(summary.calculatedActualLotCount, 1);
});

test("uses the sum of manual actuals only when there are no arrived lots", () => {
  const [summary] = aggregateHatcheryPresentation([
    record({ actualQuantity: 12 }),
    record({ id: 2, actualQuantity: 8 }),
  ]);

  assert.equal(summary.actualQuantity, 20);
});

test("keeps recommendations as additional needs instead of discounting planned arrivals again", () => {
  const additionalNeed = getAdditionalHatcheryNeed(60);

  assert.equal(additionalNeed, 60);
});

test("manual category editing preserves other records and never posts the monthly aggregate", () => {
  const records = [
    record({ id: 1, actualQuantity: 15, sizeCategory: "TP-300" }),
    record({ id: 2, actualQuantity: 20, sizeCategory: "TP-500" }),
  ];
  assert.equal(aggregateHatcheryPresentation(records)[0].actualQuantity, 35);
  const update = buildHatcheryActualUpdate(records[0], 20);
  assert.equal(update.sizeCategory, "TP-300");
  const saved = records.map(row => row.sizeCategory === update.sizeCategory
    ? { ...row, actualQuantity: update.actualQuantity }
    : row);
  assert.equal(aggregateHatcheryPresentation(saved)[0].actualQuantity, 40);
  assert.equal(saved[1].actualQuantity, 20);
});