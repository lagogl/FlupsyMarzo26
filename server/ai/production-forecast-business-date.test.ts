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
  assert.match(page, /currentYear = Number\(getEuropeRomeDateKey\(\)\.slice\(0, 4\)\)/);
  assert.match(page, /currentMonth = Number\(getEuropeRomeDateKey\(\)\.slice\(5, 7\)\)/);
});