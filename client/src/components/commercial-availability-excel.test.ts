import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { createAvailabilityWorkbook } from "./commercial-availability-excel";
import type { ScenarioProjection } from "@shared/sales-scenarios";

test("xlsx keeps beginning-of-month stock separate from new-sale capacity and orders", async () => {
  const projection: ScenarioProjection = {
    months: [{
      year: 2027, month: 8,
      stockBeforeOrdersBySize: { "7": 250_000 },
      availableBySize: { "7": 30_000 },
      ordersRequested: 200_000, ordersFulfilled: 180_000, orderShortfall: 20_000,
      orderCommitment: { animals: 200_000, valueEuro: 4000, valuedAnimals: 200_000, missingValueAnimals: 0 },
      salesRequested: 0, salesApplied: 0, sandNurseryApplied: 0,
      revenue: 0, receipts: 0, remainingAnimals: 70_000,
    }],
    totalRevenue: 0, totalReceipts: 0, receiptsByDeadline: 0, finalStock: 70_000,
    totalOrderShortfall: 20_000, unfulfilledSales: 0, goalReached: false,
  };
  const workbook = await createAvailabilityWorkbook(
    projection, [{ id: 7, code: "TP-5000", name: "TP-5000", pricePerThousand: 10 }],
    { proposalPrices: [] }, "prudent", "2027-08-01",
  );
  const copy = new ExcelJS.Workbook();
  await copy.xlsx.load(await workbook.xlsx.writeBuffer());
  const sheet = copy.getWorksheet("Disponibilità")!;
  assert.match(String(sheet.getCell("B1").value), /inizio mese/i);
  assert.match(String(sheet.getCell("C1").value), /nuove vendite/i);
  assert.equal(sheet.getCell("B2").value, 250_000);
  assert.equal(sheet.getCell("C2").value, 30_000);
  assert.equal(sheet.getCell("D2").value, 300);
  assert.equal(sheet.getCell("E2").value, 200_000);
  assert.equal(sheet.getCell("F2").value, 4000);
  assert.equal(sheet.getCell("G2").value, 20_000);
});