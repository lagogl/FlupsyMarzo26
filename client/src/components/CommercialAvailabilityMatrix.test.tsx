import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CommercialAvailabilityMatrix } from "./CommercialAvailabilityMatrix";
import type { ScenarioProjection, ScenarioResult } from "@shared/sales-scenarios";

test("detailed table uses the page's vertical scroll and offers a return to the header", () => {
  const projection: ScenarioProjection = {
    months: [{
      year: 2026, month: 9, availableBySize: { 3: 0 },
      eligibleAtStartBySize: { 3: 0 }, stockBeforeOrdersBySize: { 3: 0 },
      availabilityDayBySize: {},
      ordersRequested: 0, ordersFulfilled: 0, orderShortfall: 0,
      salesRequested: 0, salesApplied: 0, sandNurseryApplied: 0,
      revenue: 0, receipts: 0, remainingAnimals: 0,
    }],
    totalRevenue: 0, totalReceipts: 0, receiptsByDeadline: 0,
    finalStock: 0, totalOrderShortfall: 0, unfulfilledSales: 0, goalReached: false,
  };
  const result: ScenarioResult = {
    prudent: projection, expected: projection, warnings: [],
    generatedAt: "2026-09-23T00:00:00Z", availabilityIsAlternative: true,
  };
  const html = renderToStaticMarkup(
    <CommercialAvailabilityMatrix
      result={result}
      sizes={[{ id: 3, code: "TP-3000", name: "TP-3000", pricePerThousand: 7 }]}
      draft={{ name: "Scenario prova", proposalPrices: [] }}
    />,
  );

  assert.match(html, /href="#commercial-availability-detail"/);
  assert.match(html, /id="commercial-availability-detail"/);
  assert.match(html, /href="#sales-scenario-top"/);
  assert.match(html, /class="overflow-x-auto"/);
  assert.doesNotMatch(html, /max-h-\[600px\]/);
});