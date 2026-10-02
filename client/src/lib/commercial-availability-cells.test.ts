import test from "node:test";
import assert from "node:assert/strict";
import type { CommercialMonth } from "../../../shared/commercial-availability";
import { cellShortfall, cellMortality, matrixMagnitude, magnitudePercent } from "./commercial-availability-cells";

const month = (availableBySize: Record<string, number>, shortfallsBySize?: CommercialMonth["shortfallsBySize"]) =>
  ({ availableBySize, shortfallsBySize }) as CommercialMonth;

test("monthly mortality distinguishes a numeric zero from absent historical values", () => {
  const row = { ...month({ 1: 0 }), mortalityBySize: { 1: 0, 2: 1234, 3: NaN, 4: -1 } };
  assert.equal(cellMortality(row, 1), 0);
  assert.equal(cellMortality(row, 2), 1234);
  assert.equal(cellMortality(row, 3), undefined);
  assert.equal(cellMortality(row, 4), undefined);
  assert.equal(cellMortality(row, 5), undefined);
  assert.equal(cellMortality(month({ 1: 0 }), 1), undefined);
});
test("bar scale is linear and shared across visible sizes and months, including deficits", () => {
  const months = [
    month({ 1: 100, 2: 500, 3: 9000 }, { 1: { orders: 100, sales: 200 } }),
    month({ 1: 200, 2: 0 }, { 2: { orders: 300, sales: 300 } }),
  ];
  assert.equal(matrixMagnitude(months, [1, 2]), 600);
  assert.equal(magnitudePercent(300, 600), 50);
  assert.equal(magnitudePercent(600, 600), 100);
  assert.equal(magnitudePercent(0, 600), 0);
  assert.equal(matrixMagnitude(months, [3]), 9000);
});
test("empty and missing values do not become negative quantities or fabricated deficits", () => {
  const historic = month({ 1: 0 });
  assert.equal(cellShortfall(historic, 1), undefined);
  assert.equal(matrixMagnitude([historic], [1]), 0);
  assert.equal(magnitudePercent(0, 0), 0);
  assert.equal(magnitudePercent(-3, 100), 0);
  assert.equal(magnitudePercent(200, 100), 100);
  assert.equal(matrixMagnitude([month({})], [1]), 0);
});