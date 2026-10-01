import assert from "node:assert/strict";
import test from "node:test";

// Keep all imports that can initialize database clients below these offline-only
// settings. None of the route handlers in this file use a real database.
const offlineDatabaseUrl = "postgresql://offline:offline@127.0.0.1:1/ai-controller-calendar-test";
process.env.NEON_DATABASE_URL = offlineDatabaseUrl;
process.env.DATABASE_URL = offlineDatabaseUrl;
delete process.env.DATABASE_URL_ESTERNO;
process.env.OPENAI_API_KEY = "offline";
process.env.TZ = "UTC";

const [{ registerAIRoutes }, { productionForecastService }] = await Promise.all([
  import("./ai-controller"),
  import("../ai/production-forecast-service"),
]);

type RouteHandler = (req: any, res: any) => Promise<unknown> | unknown;

function lastRouteHandler(path: string): RouteHandler {
  const routes: Array<{ method: string; path: string; handlers: RouteHandler[] }> = [];
  const app = new Proxy({}, {
    get: (_target, method) => (...args: any[]) => {
      const [routePath, ...handlers] = args;
      routes.push({ method: String(method), path: routePath, handlers });
    },
  });

  registerAIRoutes(app as any);
  const route = routes.find(candidate => candidate.method === "get" && candidate.path === path);
  assert.ok(route, `GET ${path} was registered`);
  const handler = route.handlers.at(-1);
  assert.equal(typeof handler, "function", `GET ${path} has a terminal handler`);
  return handler!;
}

function responseMock() {
  return {
    statusCode: 200,
    headers: {} as Record<string, string>,
    payload: undefined as unknown,
    body: undefined as Buffer | undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.payload = payload;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name.toLowerCase()] = value;
      return this;
    },
    send(body: Buffer | Uint8Array) {
      this.body = Buffer.from(body);
      return this;
    },
  };
}

const januaryFixture = {
  year: 2027,
  month: 1,
  monthName: "Gennaio",
  sizeCategory: "T3",
  budgetAnimals: 1000,
  ordersAnimals: 500,
  productionForecast: 4300,
  varianceBudgetOrders: 500,
  varianceBudgetProduction: 3300,
  varianceOrdersProduction: 3800,
  seedingRequirement: 0,
  seedingDeadline: null,
  status: "on_track" as const,
  statusDescription: "Coperto",
  stockResiduo: 3354,
  giacenzaInizioMese: 7654,
  seminaT1Richiesta: 0,
  meseSeminaT1: null,
  giorniCrescita: 30,
};

function forecastFixture(year: number) {
  return {
    year,
    totalBudget: 1000,
    totalOrders: 500,
    totalOrdersYearAllocated: 500,
    totalProductionForecast: 4300,
    overallVariance: 3300,
    monthlyData: [{ ...januaryFixture, year }],
    currentInventory: [],
    sgrRates: [],
    seedingSchedule: [],
    totalSeedingT1Required: 0,
    ordersBySpecificSize: [{ sizeCode: "TP-3000", totalAnimals: 500, aggregateCategory: "T3" as const }],
    ordersAbsoluteBySize: { "TP-3000": 500 },
  };
}

const originalDate = globalThis.Date;

async function withClock<T>(instant: string, run: () => Promise<T>): Promise<T> {
  const timestamp = originalDate.parse(instant);
  class FixedDate extends originalDate {
    constructor(...args: ConstructorParameters<typeof Date>) {
      if (args.length === 0) super(timestamp);
      else super(...args);
    }
    static now() {
      return timestamp;
    }
  }
  globalThis.Date = FixedDate as DateConstructor;
  try {
    return await run();
  } finally {
    globalThis.Date = originalDate;
  }
}

async function withForecastFixture<T>(
  run: (calls: Array<{ year: number; mortalityRates: unknown; referenceInstant: Date }>) => Promise<T>,
): Promise<T> {
  const service = productionForecastService as any;
  const methodNames = [
    "calculateForecast",
    "getProductionTargets",
    "getSgrRates",
    "getTotalInventoryByCategory",
    "getSgrLookup",
    "getCurrentInventoryBySize",
    "getBasketLevelInventory",
    "getOrdersByMonthAndSize",
  ];
  const originals = new Map(methodNames.map(name => [name, service[name]]));
  const calls: Array<{ year: number; mortalityRates: unknown; referenceInstant: Date }> = [];

  service.calculateForecast = async (year: number, mortalityRates: unknown, referenceInstant: Date) => {
    calls.push({ year, mortalityRates, referenceInstant });
    return forecastFixture(year);
  };
  service.getProductionTargets = async () => [{ month: 1, sizeCategory: "T3", targetAnimals: 1000 }];
  service.getSgrRates = async () => { throw new Error("Export must reuse forecast SGR snapshot"); };
  service.getTotalInventoryByCategory = async (referenceInstant: Date) => {
    assert.equal(referenceInstant, calls.at(-1)!.referenceInstant);
    return { "TP-3000": 7654 };
  };
  service.getSgrLookup = async () => ({});
  service.getCurrentInventoryBySize = async () => [];
  service.getBasketLevelInventory = async () => [];
  service.getOrdersByMonthAndSize = async () => ({});

  try {
    return await run(calls);
  } finally {
    for (const [name, original] of originals) service[name] = original;
  }
}

async function invokeJsonRoute(path: string, query: Record<string, string>) {
  const response = responseMock();
  await lastRouteHandler(path)({ query, body: {} }, response);
  return response;
}

test("production forecast API preserves an explicit future or past year against an October 2026 snapshot", async () => {
  await withForecastFixture(async calls => withClock("2026-10-15T10:00:00.000Z", async () => {
    for (const year of [2027, 2025]) {
      const response = await invokeJsonRoute("/api/ai/production-forecast", { year: String(year) });
      assert.equal(response.statusCode, 200);
      assert.equal((response.payload as any).success, true);
      assert.equal((response.payload as any).year, year);
    }

    assert.deepEqual(calls.map(call => call.year), [2027, 2025]);
    assert.deepEqual(calls.map(call => call.referenceInstant.toISOString()), [
      "2026-10-15T10:00:00.000Z",
      "2026-10-15T10:00:00.000Z",
    ]);
    assert.deepEqual(calls[0].mortalityRates, { T1: 0.05, T3: 0.03, T10: 0.02 });
  }));
});

test("production forecast API defaults to the new year across the Rome midnight rollover", async () => {
  await withForecastFixture(async calls => withClock("2026-12-31T23:30:00.000Z", async () => {
    const response = await invokeJsonRoute("/api/ai/production-forecast", {});
    assert.equal(response.statusCode, 200);
    assert.equal((response.payload as any).year, 2027);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].year, 2027);
    assert.equal(calls[0].referenceInstant.toISOString(), "2026-12-31T23:30:00.000Z");
  }));
});

test("both production forecast exports contain the requested 2027 values in parseable Excel workbooks", async () => {
  await withForecastFixture(async calls => withClock("2026-10-15T10:00:00.000Z", async () => {
    const ExcelJS = (await import("exceljs")).default;
    const simple = responseMock();
    await lastRouteHandler("/api/ai/production-forecast/export-simple")(
      { query: { year: "2027" }, body: {} },
      simple,
    );

    assert.equal(simple.statusCode, 200);
    assert.match(simple.headers["content-disposition"], /filename=Scostamenti_Produzione_2027\.xlsx/);
    assert.equal(simple.headers["content-type"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    assert.ok(simple.body, "simple export returned an Excel file");

    const simpleWorkbook = new ExcelJS.Workbook();
    await simpleWorkbook.xlsx.load(simple.body!);
    const simpleSheet = simpleWorkbook.getWorksheet("Scostamenti Produzione");
    assert.ok(simpleSheet);
    assert.match(String(simpleSheet.getCell("A1").value), /2027/);
    assert.deepEqual(
      Array.from({ length: 12 }, (_, index) => simpleSheet.getRow(4).getCell(index + 1).value),
      ["Mese", "Taglia", "Giacenza", "Budget", "Ordini", "Produzione", "Δ vs Budget", "Δ vs Ordini", "Stock", "Semina T1", "Mese Semina", "Stato"],
    );
    assert.equal(simpleSheet.getCell("A5").value, "Gennaio");
    assert.equal(simpleSheet.getCell("C5").value, 7654);
    assert.equal(simpleSheet.getCell("F5").value, 4300);

    const analytical = responseMock();
    await lastRouteHandler("/api/ai/production-forecast/export-analytical")(
      { query: { year: "2027" }, body: {} },
      analytical,
    );

    assert.equal(analytical.statusCode, 200);
    assert.match(analytical.headers["content-disposition"], /filename=Report_Analitico_Scostamenti_2027\.xlsx/);
    assert.equal(analytical.headers["content-type"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    assert.ok(analytical.body, "analytical export returned an Excel file");

    const analyticalWorkbook = new ExcelJS.Workbook();
    await analyticalWorkbook.xlsx.load(analytical.body!);
    const parametersSheet = analyticalWorkbook.getWorksheet("Parametri e Inventario");
    assert.ok(parametersSheet);
    assert.equal(parametersSheet.getCell("A5").value, "Anno Target");
    assert.equal(parametersSheet.getCell("B5").value, 2027);

    const calculationsSheet = analyticalWorkbook.getWorksheet("Calcoli Dettagliati");
    assert.ok(calculationsSheet);
    const headerRow = calculationsSheet.getRows(1, calculationsSheet.rowCount)!
      .find(row => row.getCell(1).value === "Mese");
    assert.ok(headerRow, "analytical calculation sheet has its column header");
    const januaryRow = calculationsSheet.getRows(headerRow.number + 1, calculationsSheet.rowCount)!
      .find(row => row.getCell(1).value === "Gennaio");
    assert.ok(januaryRow, "analytical calculation sheet contains January");
    assert.equal(januaryRow.getCell(3).value, 7654);
    assert.equal(januaryRow.getCell(6).value, 4300);

    assert.deepEqual(calls.map(call => call.year), [2027, 2027]);
    assert.deepEqual(calls.map(call => call.referenceInstant.toISOString()), [
      "2026-10-15T10:00:00.000Z",
      "2026-10-15T10:00:00.000Z",
    ]);
  }));
});