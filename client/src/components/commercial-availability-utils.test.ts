import assert from "node:assert/strict";
import test from "node:test";
import { estimatedSalesValue, peakAlternativeOpportunity, priceForSize } from "./commercial-availability-utils";

const size = { id: 7, code: "TP-5000", name: "5.000", pricePerThousand: 12 };
const draft = { proposalPrices: [] };

test("commercial value converts animals using the price per thousand", () => {
  assert.equal(estimatedSalesValue(125_000, 12), 1500);
});

test("empty availability has no peak opportunity", () => {
  assert.equal(peakAlternativeOpportunity([], [size], draft), null);
});

test("commercial value remains unavailable when price is missing, including zero availability", () => {
  assert.equal(estimatedSalesValue(0, null), null);
  assert.equal(estimatedSalesValue(0, 12), 0);
});

test("explicit scenario price prevails over the catalog price", () => {
  assert.equal(priceForSize(size, { proposalPrices: [{ sizeId: 7, pricePerThousand: 15, paymentDelayMonths: 0 }] }), 15);
  assert.equal(priceForSize(size, draft), 12);
});

test("alternative peak selects one opportunity rather than summing months or sizes", () => {
  const peak = peakAlternativeOpportunity([
    { year: 2026, month: 4, availableBySize: { "7": 80_000 }, ordersRequested: 0, ordersFulfilled: 0, orderShortfall: 0, salesRequested: 0, salesApplied: 0, sandNurseryApplied: 0, revenue: 0, receipts: 0, remainingAnimals: 0 },
    { year: 2026, month: 5, availableBySize: { "7": 125_000 }, ordersRequested: 0, ordersFulfilled: 0, orderShortfall: 0, salesRequested: 0, salesApplied: 0, sandNurseryApplied: 0, revenue: 0, receipts: 0, remainingAnimals: 0 },
  ], [size], draft);
  assert.equal(peak?.animals, 125_000);
  assert.equal(peak?.month.month, 5);
});