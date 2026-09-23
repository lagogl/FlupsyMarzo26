import test from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { createCommercialMonthPdf, monthlyCommercialData } from "./commercial-month-pdf";
import type { ScenarioMonth } from "@shared/sales-scenarios";

const month: ScenarioMonth = {
  year: 2026, month: 9,
  availableBySize: { "3": 0, "4": 1200 },
  stockBeforeOrdersBySize: { "3": 3000, "4": 1000 },
  eligibleAtStartBySize: { "3": 4000, "4": 1000 },
  availabilityDayBySize: { "4": 17 },
  ordersRequested: 5000, ordersFulfilled: 3000, orderShortfall: 2000,
  orderCommitment: { animals: 5000, valueEuro: 70, valuedAnimals: 4000, missingValueAnimals: 1000 },
  salesRequested: 300, salesApplied: 200, sandNurseryApplied: 0,
  revenue: 0, receipts: 0, remainingAnimals: 0,
};
const sizes = [
  { id: 3, code: "TP-3000", name: "TP-3000", pricePerThousand: 7 },
  { id: 4, code: "TP-4000", name: "TP-4000", pricePerThousand: null },
];

test("monthly report preserves order coverage and alternative, not additive, size availability", () => {
  const data = monthlyCommercialData(month, sizes, { proposalPrices: [] });
  assert.deepEqual(data.orders, { requested: 5000, fulfilled: 3000, shortfall: 2000, value: 70, partialValue: true });
  assert.deepEqual(data.plannedSales, { requested: 300, applied: 200 });
  assert.deepEqual(data.alternatives.map(({ code, exact, larger, eligible, sellable, day, value }) =>
    ({ code, exact, larger, eligible, sellable, day, value })), [
    { code: "TP-3000", exact: 3000, larger: 1000, eligible: 4000, sellable: 0, day: null, value: 0 },
    { code: "TP-4000", exact: 1000, larger: 0, eligible: 1000, sellable: 1200, day: 17, value: null },
  ]);
});

test("generates a readable PDF for the selected month and mode", async () => {
  const bytes = await createCommercialMonthPdf(month, sizes, { name: "Scenario di prova", proposalPrices: [] }, "prudent", "2026-09-23T12:00:00Z", []);
  assert.ok(bytes.byteLength > 1000);
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(), 1);
});