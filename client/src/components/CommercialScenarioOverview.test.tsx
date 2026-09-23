import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CommercialScenarioOverview } from "./CommercialScenarioOverview";
import type { ScenarioProjection } from "@shared/sales-scenarios";

test("operator overview separates order coverage, biological stock, and protected new sales", () => {
  const projection: ScenarioProjection = {
    months: [{
      year: 2026, month: 9,
      availableBySize: { "3": 0, "4": 0 },
      stockBeforeOrdersBySize: { "3": 3_034_227, "4": 1_816_008 },
      eligibleAtStartBySize: { "3": 5_703_836, "4": 1_816_008 },
      availabilityDayBySize: {},
      ordersRequested: 29_000_000, ordersFulfilled: 10_000_000, orderShortfall: 19_000_000,
      orderCommitment: { animals: 29_000_000, valueEuro: 210_400, valuedAnimals: 29_000_000, missingValueAnimals: 0 },
      salesRequested: 0, salesApplied: 0, sandNurseryApplied: 0,
      revenue: 0, receipts: 0, remainingAnimals: 0,
    }],
    totalRevenue: 0, totalReceipts: 0, receiptsByDeadline: 0,
    finalStock: 0, totalOrderShortfall: 19_000_000, unfulfilledSales: 0, goalReached: false,
  };
  const html = renderToStaticMarkup(
    <CommercialScenarioOverview
      projection={projection}
      sizes={[
        { id: 3, code: "TP-3000", name: "TP-3000", pricePerThousand: 7 },
        { id: 4, code: "TP-4000", name: "TP-4000", pricePerThousand: 9 },
      ]}
      draft={{ name: "Scenario prova", proposalPrices: [] }}
      mode="prudent"
      generatedAt="2026-09-23T00:00:00Z"
      warnings={[]}
    />,
  );
  for (const value of ["29.000.000", "10.000.000", "19.000.000", "3.034.227", "2.669.609", "1.816.008", "210.400"]) {
    assert.ok(html.includes(value), `missing ${value}`);
  }
  assert.match(html, /Stock presente · nuove vendite: 0/);
  assert.match(html, /Nessun animale in più vendibile nel mese/);
  assert.match(html, /Ancora vendibile per nuove vendite/);
  assert.match(html, /ordini acquisiti \(anche futuri\)/);
  assert.match(html, /Le taglie sono alternative: non sommare le quantità tra schede/);
  assert.match(html, /Scheda settembre 2026 \(PDF\)/);
});