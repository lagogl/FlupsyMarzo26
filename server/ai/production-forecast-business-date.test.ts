import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PgDialect } from "drizzle-orm/pg-core";

// Never connect to the project's live database from these calendar regressions.
process.env.NEON_DATABASE_URL = "postgresql://test:test@127.0.0.1:1/forecast-calendar-test";
process.env.DATABASE_URL = process.env.NEON_DATABASE_URL;
delete process.env.DATABASE_URL_ESTERNO;
process.env.TZ = "UTC";

const [{ ProductionForecastService }, { db }, { businessToday }] = await Promise.all([
  import("./production-forecast-service"),
  import("../db"),
  import("../utils/business-date"),
]);

function fixture() {
  const service = new ProductionForecastService();
  const subject = service as any;
  const dates: string[] = [];
  const years: number[] = [];
  const growth: Array<{ monthIndex: number; days: number }> = [];
  subject.activeSizeCandidates = [{ code: "TP-3000" }];
  subject.getProductionTargets = async (year: number) => { years.push(year); return []; };
  subject.getOrdersByMonthAndSize = async (year: number, date: string) => { years.push(year); dates.push(date); return {}; };
  for (const name of ["getSgrRates", "getCurrentInventoryBySize", "getBasketLevelInventory"]) {
    subject[name] = async (date: string) => { dates.push(date); return []; };
  }
  subject.getSgrLookup = async () => ({});
  subject.getOrdersDiagnostic = async () => ({});
  subject.aggregateBySaleSize = () => ({ "TP-3000": 100 });
  subject.simulateMonthlyGrowth = (baskets: unknown[], _lookup: unknown, monthIndex: number, _mortality: unknown, days = 30) => {
    growth.push({ monthIndex, days });
    return baskets;
  };
  return { service, subject, dates, years, growth };
}

test("forecast e piani commerciali riconoscono lo stesso giorno italiano nei casi di confine", async () => {
  const cases = [
    ["2026-09-30T22:30:00Z", "2026-10-01", 30],
    ["2026-01-31T23:30:00Z", "2026-02-01", 27],
    ["2026-07-14T22:30:00Z", "2026-07-15", 16],
    ["2026-12-31T23:30:00Z", "2027-01-01", 30],
    ["2024-02-28T23:30:00Z", "2024-02-29", 0],
    ["2026-03-29T01:30:00Z", "2026-03-29", 2],
    ["2026-10-25T01:30:00Z", "2026-10-25", 6],
    ["2026-09-30T10:00:00Z", "2026-09-30", 0],
  ] as const;
  for (const [isoInstant, civilDate, remainingDays] of cases) {
    const { service, dates, years, growth } = fixture();
    const instant = new Date(isoInstant);
    const commercial = businessToday(instant);
    const result = await service.calculateForecast(undefined, undefined, instant);
    assert.equal(result.year, commercial.year, civilDate);
    assert.equal(result.monthlyData[0].month, commercial.month, civilDate);
    assert.deepEqual(dates, [civilDate, civilDate, civilDate, civilDate]);
    assert.deepEqual(years, [commercial.year, commercial.year]);
    const currentGrowth = growth.filter(call => call.monthIndex === commercial.month - 1);
    assert.deepEqual(currentGrowth, remainingDays > 0
      ? [{ monthIndex: commercial.month - 1, days: remainingDays }] : [], civilDate);
    assert.ok(growth.filter(call => call.monthIndex > commercial.month - 1)
      .every(call => call.days === 30), "unchanged full-month growth convention");
  }
});

test("la fotografia resta quella iniziale anche se le letture attraversano la mezzanotte italiana", async () => {
  const OriginalDate = globalThis.Date;
  const originalSelect = db.select;
  const originalExecute = db.execute;
  const capturedDates: string[] = [];
  const checkQuery = (query: any) => {
    const { params } = new PgDialect().sqlToQuery(query);
    if (params.length) {
      assert.deepEqual(params, ["2026-09-30", "2026-09-30"]);
      capturedDates.push(String(params[0]));
    }
  };
  let clock = OriginalDate.parse("2026-09-30T21:59:59Z");
  class ClockDate extends OriginalDate {
    constructor(...args: ConstructorParameters<typeof Date>) {
      if (args.length === 0) super(clock);
      else super(...args);
    }
    static now() { return clock; }
  }
  try {
    globalThis.Date = ClockDate as DateConstructor;
    (db as any).select = () => {
      const chain = {
        from: () => chain,
        innerJoin: () => chain,
        where: (query: any) => { checkQuery(query); return chain; },
        orderBy: async () => [{ sizeId: 1, code: "TP-3000", minAnimalsPerKg: 6000, maxAnimalsPerKg: 10000 }],
      };
      return chain;
    };
    (db as any).execute = async (query: any) => { checkQuery(query); return { rows: [] }; };
    const { service, subject } = fixture();
    // Exercise real readers, including orders, rather than hiding range lookups.
    for (const name of ["getSgrRates", "getCurrentInventoryBySize", "getBasketLevelInventory", "getOrdersByMonthAndSize"] as const) {
      subject[name] = ProductionForecastService.prototype[name];
    }
    subject.getProductionTargets = async () => {
      clock = OriginalDate.parse("2026-09-30T22:00:01Z");
      await Promise.resolve();
      return [];
    };
    const result = await service.calculateForecast();
    assert.equal(result.monthlyData[0].month, 9);
    assert.deepEqual(capturedDates, ["2026-09-30", "2026-09-30", "2026-09-30", "2026-09-30"]);
    const nextRequest = await fixture().service.calculateForecast();
    assert.equal(nextRequest.monthlyData[0].month, 10);
  } finally {
    globalThis.Date = OriginalDate;
    db.select = originalSelect;
    db.execute = originalExecute;
  }
});

test("l'anno richiesto esplicitamente resta invariato", async () => {
  const { service, years } = fixture();
  const result = await service.calculateForecast(2024, undefined, new Date("2026-12-31T23:30:00Z"));
  assert.equal(result.year, 2024);
  assert.deepEqual(years, [2024, 2024]);
});

function stockFixture(
  orders: Record<number, Record<string, Record<string, number>>> = {},
  targets: Record<number, any[]> = {},
) {
  const base = fixture();
  const { subject, years, dates, growth } = base;
  subject.activeSizeCandidates = [{
    sizeId: 1, code: "TP-3000", minAnimalsPerKg: 1, maxAnimalsPerKg: 100000,
  }];
  subject.getProductionTargets = async (year: number) => {
    years.push(year);
    return targets[year] || [];
  };
  subject.getOrdersByMonthAndSize = async (year: number, date: string) => {
    years.push(year);
    dates.push(date);
    return orders[year] || {};
  };
  const initial = [{ basketId: 1, animalsPerKg: 20000, animalCount: 10000 }];
  subject.getBasketLevelInventory = async (date: string) => { dates.push(date); return initial; };
  subject.aggregateBySaleSize = ProductionForecastService.prototype.aggregateBySaleSize;
  subject.getSgrForAnimalsPerKg = () => 1;
  subject.simulateMonthlyGrowth = (...args: any[]) => {
    growth.push({ monthIndex: args[2], days: args[4] ?? 30 });
    return (ProductionForecastService.prototype.simulateMonthlyGrowth as any).apply(subject, args);
  };
  return { ...base, initial };
}

test("ottobre 2026 → gennaio 2027: crescita, mortalità e domanda dei mesi intermedi sono continue", async () => {
  const { service, subject, initial, growth, years, dates } = stockFixture(
    { 2026: { "11": { "TP-3000": 1200 } }, 2027: { "1": { "TP-3000": 500 } } },
    { 2026: [{ month: 12, sizeCategory: "T3", targetAnimals: 700 }] },
  );
  const rates = { T1: 0.05, T3: 0.03, T10: 0.02 };
  const result = await service.calculateForecast(2027, rates, new Date("2026-10-15T10:00:00Z"));
  let expected = initial;
  for (const [monthIndex, days, demand] of [[9, 16, 0], [10, 30, 1200], [11, 30, 700], [0, 30, 0]]) {
    expected = ProductionForecastService.prototype.simulateMonthlyGrowth.call(subject, expected, {}, monthIndex, rates, days);
    if (demand) expected = service.removeAnimalsFromSaleSize(expected, "TP-3000", demand);
  }
  const january = result.monthlyData.find(row => row.month === 1)!;
  assert.equal(january.year, 2027);
  assert.equal(january.giacenzaInizioMese, expected[0].animalCount);
  assert.equal(january.productionForecast, 500);
  assert.equal(january.stockResiduo, expected[0].animalCount - 500);
  assert.deepEqual(growth.slice(0, 4), [
    { monthIndex: 9, days: 16 }, { monthIndex: 10, days: 30 },
    { monthIndex: 11, days: 30 }, { monthIndex: 0, days: 30 },
  ]);
  assert.equal(growth.length, 15);
  assert.deepEqual(years, [2027, 2027, 2026, 2026]);
  assert.ok(dates.every(date => date === "2026-10-15"));
  assert.ok(result.monthlyData.every(row => row.year === 2027));
  assert.equal(result.totalOrdersYearAllocated, 500, "intermediate-year demand is not included in reported totals");
  assert.equal(result.totalBudget, 0);
  assert.deepEqual(result.seedingSchedule, []);
  assert.deepEqual(initial, [{ basketId: 1, animalsPerKg: 20000, animalCount: 10000 }], "no input mutation");
});

test("anno corrente: mesi passati senza stock live, mese corrente parziale e mesi futuri interi", async () => {
  const { service, growth } = stockFixture({
    2026: { "9": { "TP-3000": 100 }, "10": { "TP-3000": 200 }, "11": { "TP-3000": 300 } },
  });
  const result = await service.calculateForecast(2026, undefined, new Date("2026-10-15T10:00:00Z"));
  const september = result.monthlyData.find(row => row.month === 9)!;
  assert.equal(september.ordersAnimals, 100);
  assert.equal(september.productionForecast, 0);
  assert.equal(september.giacenzaInizioMese, 0);
  assert.equal(september.stockResiduo, 0);
  assert.equal(result.monthlyData.find(row => row.month === 10)!.productionForecast, 200);
  assert.equal(result.monthlyData.find(row => row.month === 11)!.productionForecast, 300);
  assert.deepEqual(growth, [
    { monthIndex: 9, days: 16 }, { monthIndex: 10, days: 30 }, { monthIndex: 11, days: 30 },
  ]);
});

test("anno passato: nessuna crescita o giacenza ricostruita, ordini e budget restano nell'anno richiesto", async () => {
  const { service, growth } = stockFixture(
    { 2025: { "1": { "TP-3000": 100 }, "12": { "TP-3000": 200 } } },
    { 2025: [{ month: 12, sizeCategory: "T3", targetAnimals: 300 }] },
  );
  const result = await service.calculateForecast(2025, undefined, new Date("2026-10-15T10:00:00Z"));
  assert.equal(result.year, 2025);
  assert.deepEqual(growth, []);
  assert.equal(result.totalOrdersYearAllocated, 300);
  assert.equal(result.totalBudget, 300);
  assert.equal(result.totalProductionForecast, 0);
  for (const row of result.monthlyData) {
    assert.equal(row.year, 2025);
    assert.equal(row.giacenzaInizioMese, 0);
    assert.equal(row.stockResiduo, 0);
  }
  assert.ok(result.seedingSchedule.every(row => row.targetYear === 2025));
});

test("dicembre → gennaio: non si usa il giorno dello snapshot per gennaio dell'anno successivo", async () => {
  for (const [instant, expected] of [
    ["2026-12-30T23:30:00Z", [{ monthIndex: 0, days: 30 }]],
    ["2026-12-31T23:30:00Z", [{ monthIndex: 0, days: 30 }]],
    ["2026-12-15T10:00:00Z", [{ monthIndex: 11, days: 16 }, { monthIndex: 0, days: 30 }]],
  ] as const) {
    const { service, growth } = stockFixture();
    const result = await service.calculateForecast(2027, undefined, new Date(instant));
    assert.equal(result.monthlyData[0].month, 1);
    assert.ok(result.monthlyData[0].giacenzaInizioMese > 0);
    assert.deepEqual(growth.slice(0, expected.length), expected);
  }
});

test("anno distante: si attraversano tutti i mesi e si consumano anche gli ordini dell'anno intermedio", async () => {
  const { service, growth, years } = stockFixture({
    2027: { "6": { "TP-3000": 10000 } },
    2028: { "1": { "TP-3000": 100 } },
  });
  const result = await service.calculateForecast(2028, undefined, new Date("2026-10-15T10:00:00Z"));
  assert.equal(growth.length, 27);
  assert.deepEqual(growth.slice(3, 15).map(row => row.monthIndex), Array.from({ length: 12 }, (_, m) => m));
  assert.deepEqual(years, [2028, 2028, 2026, 2026, 2027, 2027]);
  assert.equal(result.monthlyData.find(row => row.month === 1)!.giacenzaInizioMese, 0);
  assert.equal(result.totalOrdersYearAllocated, 100);
  assert.ok(result.monthlyData.every(row => row.year === 2028));
});

test("il lookup SGR usa la stessa data civile esplicita del forecast", async () => {
  const original = db.execute;
  try {
    (db as any).execute = async (query: any) => {
      assert.deepEqual(new PgDialect().sqlToQuery(query).params, ["2026-10-01", "2026-10-01"]);
      return { rows: [] };
    };
    await new ProductionForecastService().getSgrRates("2026-10-01");
  } finally {
    db.execute = original;
  }
});

test("API ed entrambi gli export riusano l'istante iniziale; UI e cache usano il calendario italiano", () => {
  const controller = readFileSync(new URL("../controllers/ai-controller.ts", import.meta.url), "utf8");
  const calls = controller.match(/calculateForecast\(targetYear, mortalityRates, referenceInstant\)/g);
  assert.equal(calls?.length, 3);
  assert.equal(controller.match(/businessToday\(referenceInstant\)\.year/g)?.length, 3);
  const client = readFileSync(new URL("../../client/src/lib/queryClient.ts", import.meta.url), "utf8");
  assert.match(client, /invalidateQueries\(\{ queryKey: \["\/api\/ai\/production-forecast"\] \}\)/);
  const page = readFileSync(new URL("../../client/src/pages/AnalisiScostamenti.tsx", import.meta.url), "utf8");
  assert.match(page, /currentRomeMonthKey = getEuropeRomeDateKey\(\)\.slice\(0, 7\)/);
  assert.match(page, /currentYear = Number\(currentRomeMonthKey\.slice\(0, 4\)\)/);
});