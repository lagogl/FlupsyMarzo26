import { test } from "node:test";
import assert from "node:assert/strict";
import type { CommercialInput, CommercialMonth, CommercialResult, SavedCommercialScenario } from "../../../shared/commercial-availability";
import { buildCommercialScenarioLibrary, buildCommercialWorkbook } from "./commercial-availability-workbook";

const sizes = [
  { id: 1, code: "S1", name: "Piccola" },
  { id: 2, code: "S2", name: "Grande" },
];

function draft(): CommercialInput {
  return {
    name: "=Bozza primavera",
    startYear: 2027,
    startMonth: 1,
    horizon: 12,
    selectedSizeIds: [1],
    includeOrders: true,
    includeHatchery: true,
    growthFactor: 1.1,
    mortalityMultiplier: 1.2,
    sales: [{ id: "sale-hidden", year: 2027, month: 1, day: 15, sizeId: 2, quantity: 875_000 }],
    hatcheryOverrides: [{ year: 2027, month: 2, quantity: 0 }],
  };
}

function makeMonth(year: number, month: number, first = false): CommercialMonth {
  return {
    year,
    month,
    availableBySize: first ? { "1": 0 } : { "1": 250_000 },
    availabilityDayBySize: first ? { "1": 18 } : { "1": 10 },
    shortfallsBySize: first ? { "1": { orders: 0, sales: 14 } } : undefined,
    ordersRequested: 100,
    ordersFulfilled: 100,
    orderShortfall: 0,
    salesRequested: 1,
    salesApplied: 1,
    sandNurseryApplied: 0,
    revenue: 0,
    receipts: 0,
    remainingAnimals: 0,
  };
}

function matchingResult(input: CommercialInput): CommercialResult {
  const months = Array.from({ length: 12 }, (_, offset) => {
    const index = input.startYear * 12 + input.startMonth - 1 + offset;
    return makeMonth(Math.floor(index / 12), index % 12 + 1, offset === 0);
  });
  return {
    sizes,
    input: structuredClone(input),
    inputHash: "hash",
    referenceDate: "2027-01-01",
    generatedAt: "2027-01-01T12:00:00.000Z",
    availabilityIsAlternative: true,
    valid: true,
    months,
    baselineMonths: months,
    plan: [{
      ...input.sales[0],
      day: 15,
      date: "2027-01-15",
      acceptedQuantity: 875_000,
      shortfall: 0,
    }],
    totalRequested: 875_000,
    totalAccepted: 875_000,
    baselineOrderShortfall: 0,
    orderShortfall: 0,
    hatcheryDependent: true,
    warnings: [],
    calculationMs: 9,
  };
}

async function roundTrip(workbook: Awaited<ReturnType<typeof buildCommercialWorkbook>>) {
  const ExcelJS = (await import("exceljs")).default;
  const bytes = await workbook.xlsx.writeBuffer();
  const reloaded = new ExcelJS.Workbook();
  await reloaded.xlsx.load(bytes);
  return reloaded;
}

test("matched workbook round-trips exact numeric zero and missing shortfalls with matrix formatting", async () => {
  const input = draft();
  const workbook = await buildCommercialWorkbook({ input, sizes, result: matchingResult(input) });
  const loaded = await roundTrip(workbook);
  const availability = loaded.getWorksheet("Disponibilità")!;
  assert.equal(availability.rowCount, 2, "Matrix only exports visible sizes; hidden sales remain in plan");
  assert.equal(availability.getCell(2, 2).value, 0);
  assert.equal(availability.getCell(3, 2).value, null);
  assert.equal(availability.getCell(1, 2).value, "gennaio 2027");
  assert.equal(availability.getCell(1, 13).value, "dicembre 2027");
  assert.equal(availability.getCell(2, 2).numFmt, "#,##0");
  assert.equal(availability.views[0].state, "frozen");
  assert.equal((availability.views[0] as { xSplit?: number }).xSplit, 1);
  assert.equal((availability.views[0] as { ySplit?: number }).ySplit, 1);
  assert.ok(availability.autoFilter);

  const orders = loaded.getWorksheet("Mancanze ordini")!;
  const sales = loaded.getWorksheet("Mancanze vendite")!;
  assert.equal(orders.getCell(2, 2).value, 0);
  assert.equal(sales.getCell(2, 2).value, 14);
  assert.equal(orders.getCell(3, 2).value, null);
  assert.equal(orders.getCell(2, 2).numFmt, "#,##0");
  assert.equal(loaded.getWorksheet("Piano commerciale")!.getCell(2, 6).value, 875_000);
  assert.equal(loaded.getWorksheet("Piano commerciale")!.getCell(2, 8).value, "2027-01-15");
  assert.equal(loaded.getWorksheet("Guida")!.getCell(2, 2).value, "PIANO VERIFICATO");
  assert.equal(loaded.getWorksheet("Arrivi futuri")!.getCell(2, 2).value, null);
  assert.equal(loaded.getWorksheet("Arrivi futuri")!.getCell(2, 3).value, 0);
  assert.equal(loaded.getWorksheet("Guida")!.getCell(1, 2).value, "=Bozza primavera");
  assert.equal(loaded.getWorksheet("Ipotesi")!.getCell(7, 2).value, 1.1);
  assert.equal(loaded.getWorksheet("Ipotesi")!.getCell(7, 2).numFmt, "0.00");
});

test("draft and stale result exports never leak availability or accepted quantities", async () => {
  const input = draft();
  const stale = matchingResult(input);
  stale.months[0].availableBySize["1"] = 99_000_000;
  stale.plan[0].acceptedQuantity = 1;
  stale.input.sales[0].quantity += 1;
  for (const result of [undefined, stale]) {
    const loaded = await roundTrip(await buildCommercialWorkbook({ input, sizes, result }));
    assert.equal(loaded.getWorksheet("Disponibilità"), undefined);
    assert.equal(loaded.getWorksheet("Date disponibilità"), undefined);
    assert.equal(loaded.getWorksheet("Mancanze ordini"), undefined);
    assert.equal(loaded.getWorksheet("Piano commerciale")!.getCell(2, 5).value, 875_000);
    assert.equal(loaded.getWorksheet("Piano commerciale")!.getCell(2, 6).value, null);
    assert.equal(loaded.getWorksheet("Piano commerciale")!.getCell(2, 7).value, null);
    assert.equal(loaded.getWorksheet("Piano commerciale")!.getCell(2, 8).value, null);
    assert.equal(loaded.getWorksheet("Guida")!.getCell(2, 2).value, "BOZZA NON VERIFICATA");
  }
});

test("a matching but invalid result remains explicitly labeled invalid", async () => {
  const input = draft();
  const invalid = matchingResult(input);
  invalid.valid = false;
  const loaded = await roundTrip(await buildCommercialWorkbook({ input, sizes, result: invalid }));
  assert.equal(loaded.getWorksheet("Guida")!.getCell(2, 2).value, "PIANO NON VALIDO");
  assert.equal(loaded.getWorksheet("Ipotesi")!.getCell(11, 2).value, "PIANO NON VALIDO");
});

function savedScenario(id: number, input: CommercialInput): SavedCommercialScenario {
  return {
    id,
    ownerId: "owner",
    name: input.name,
    input,
    createdAt: new Date("2027-01-01T10:00:00Z"),
    updatedAt: new Date("2027-01-02T10:00:00Z"),
  };
}

test("scenario library keeps every saved draft, hidden-size sales, dates, and explicit zero overrides", async () => {
  const first = draft();
  const second = {
    ...draft(),
    name: "Scenario estivo",
    startMonth: 7,
    horizon: 6 as const,
    selectedSizeIds: [1, 2],
    sales: [{ id: "sale-visible", year: 2027, month: 7, sizeId: 1, quantity: 31 }],
    hatcheryOverrides: [{ year: 2027, month: 8, quantity: 42 }],
  };
  const workbook = await buildCommercialScenarioLibrary({
    scenarios: [savedScenario(10, first), savedScenario(11, second)],
    sizes,
  });
  const loaded = await roundTrip(workbook);
  const list = loaded.getWorksheet("Scenari")!;
  assert.equal(list.rowCount, 3);
  assert.equal(list.getCell(2, 1).value, 10);
  assert.equal(list.getCell(3, 1).value, 11);
  assert.equal(list.getCell(2, 7).value, "2027-01");
  assert.equal(list.getCell(2, 8).value, 12);
  assert.equal(list.getCell(2, 9).value, "S1");
  assert.match(String(list.getCell(2, 6).value), /nessun risultato/i);

  const sales = loaded.getWorksheet("Vendite scenari")!;
  assert.equal(sales.rowCount, 3);
  assert.equal(sales.getCell(2, 6).value, 2);
  assert.equal(sales.getCell(2, 9).value, "Taglia nascosta: vendita conservata");
  assert.equal(sales.getCell(2, 5).value, "2027-01-15");
  assert.equal(sales.getCell(3, 3).value, "sale-visible");

  const arrivals = loaded.getWorksheet("Arrivi scenari")!;
  assert.equal(arrivals.getCell(2, 5).value, 0);
  assert.equal(arrivals.getCell(3, 5).value, 42);
  assert.equal(arrivals.getCell(2, 4).value, null);
  assert.match(String(arrivals.getCell(2, 10).value), /Zero esplicito/);
  assert.match(String(loaded.getWorksheet("Nota")!.getCell(2, 2).value), /non contiene calcoli congelati/);
});