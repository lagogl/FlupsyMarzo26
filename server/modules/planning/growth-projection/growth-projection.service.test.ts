import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { buildFutureOrderQuotas } from "../future-order-quotas";

process.env.TZ = "UTC";

const sizeRows = [
  { id: 1, code: "TP-1000" },
  { id: 2, code: "TP-2000" },
  { id: 3, code: "TP-3000" },
  { id: 4, code: "TP-300" },
];

const rangeRows = [
  { sizeId: 2, minAnimalsPerKg: 1000, maxAnimalsPerKg: 2000, validFrom: "2020-01-01", validTo: null },
  { sizeId: 3, minAnimalsPerKg: 2000, maxAnimalsPerKg: 3000, validFrom: "2020-01-01", validTo: null },
  { sizeId: 4, minAnimalsPerKg: 3000, maxAnimalsPerKg: 3300, validFrom: "2020-01-01", validTo: null },
  // This valid catalog size is not physically available at the snapshot yet.
  { sizeId: 1, minAnimalsPerKg: 1, maxAnimalsPerKg: 1000, validFrom: "2027-01-01", validTo: null },
];

const virtualModules: Record<string, string> = {
  "../../../ai/production-forecast-service": `
    export const productionForecastService = {
      getSgrLookup: async () => ({}),
      getBasketLevelInventory: async () => globalThis.__quotaInventory ?? [],
      getOrdersByMonthAndSize: async () => { throw new Error("Legacy monthly demand must not be loaded"); },
    };
  `,
  "../future-order-quota-source": `
    export async function loadFutureOrderQuotas(referenceDate) {
      globalThis.__quotaLoadDates = [...(globalThis.__quotaLoadDates ?? []), referenceDate];
      return { quotas: globalThis.__futureQuotas, warnings: globalThis.__quotaWarnings ?? [] };
    }
  `,
  "../../../utils/business-date": `
    export function getBusinessReferenceDate(instant) {
      return new Date(instant.getFullYear(), instant.getMonth(), instant.getDate());
    }
  `,
  "../../../db": `
    function emptyQuery() {
      const query = {
        from() { return query; },
        where() { return Promise.resolve([]); },
        then(resolve, reject) { return Promise.resolve([]).then(resolve, reject); },
      };
      return query;
    }
    export const db = {
      select() { return emptyQuery(); },
      execute: async () => ({ rows: [] }),
    };
  `,
  "../../../db-esterno": `
    function query() {
      return {
        from() { return this; },
        where() { return Promise.resolve(globalThis.__task149Orders); },
      };
    }
    export const dbEsterno = { select: query };
    export const isDbEsternoAvailable = () => true;
  `,
  "../../../../shared/schema": `
    export const hatcheryArrivals = "hatcheryArrivals";
    export const productionTargets = "productionTargets";
    export const projectionMortalityRates = "projectionMortalityRates";
    export const sandNurserySeedings = "sandNurserySeedings";
  `,
  "../../../schema-esterno": `
    export const ordiniCondivisi = {
      id: "id",
      quantita: "quantita",
      quantitaTotale: "quantitaTotale",
      tagliaRichiesta: "tagliaRichiesta",
      dataInizioConsegna: "dataInizioConsegna",
      dataConsegna: "dataConsegna",
      dataFineConsegna: "dataFineConsegna",
      stato: "stato",
      cancellato: "cancellato",
    };
  `,
  "drizzle-orm": `
    const sql = Object.assign(
      (strings, ...values) => ({ strings: Array.from(strings), values }),
      { join: (parts, separator) => ({ parts, separator }) },
    );
    export { sql };
    export const eq = (...args) => ({ op: "eq", args });
    export const inArray = (...args) => ({ op: "inArray", args });
  `,
  "../../../services/growth-simulation.service": `
    const allSizes = ${JSON.stringify(sizeRows)};
    const sizeRangeVersions = ${JSON.stringify(rangeRows)};
    export async function loadGrowthSimulationContext() {
      return {
        allSizes,
        sizeRangeVersions,
        sgrByMonthAndSize: {},
        sgrFallbackByMonth: {},
        globalFallback: 0,
        mortalityByMonthAndSize: {},
        findSizeIdForWeight: () => 1,
      };
    }
    export function findRangeForSize(sizeId, date, ranges) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const key = year + "-" + month + "-" + day;
      return ranges.find(range =>
        range.sizeId === sizeId &&
        range.validFrom <= key &&
        (range.validTo === null || range.validTo >= key)
      ) ?? null;
    }
    export function findProjectedSize(weight, date, ranges) {
      return allSizes.find(size => {
        const range = findRangeForSize(size.id, date, ranges);
        const apk = 1000000 / weight;
        return range && apk >= range.minAnimalsPerKg && apk <= range.maxAnimalsPerKg;
      }) ?? null;
    }
    export function stepOneDay(context, state, date) {
      return globalThis.__quotaGrowInFebruary && date.getMonth() === 1
        ? { ...state, weightMg: 1000 }
        : state;
    }
  `,
};

async function loadProjectionService() {
  const result = await build({
    entryPoints: ["server/modules/planning/growth-projection/growth-projection.service.ts"],
    bundle: true,
    platform: "node",
    format: "esm",
    write: false,
    target: "node20",
    plugins: [{
      name: "task149-service-dependencies",
      setup(pluginBuild) {
        pluginBuild.onResolve({ filter: /.*/ }, args => {
          if (Object.hasOwn(virtualModules, args.path)) {
            return { path: args.path, namespace: "task149-mock" };
          }
          return undefined;
        });
        pluginBuild.onLoad({ filter: /.*/, namespace: "task149-mock" }, args => ({
          contents: virtualModules[args.path],
          loader: "js",
        }));
      },
    }],
  });
  const javascript = result.outputFiles[0].text;
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`;
  return import(moduleUrl) as Promise<{
    GrowthProjectionService: new () => {
      project(targetSize: string, year: number, mortality: number, startMonth: number, horizon: number): Promise<any>;
    };
  }>;
}

const { GrowthProjectionService } = await loadProjectionService();
const RealDate = globalThis.Date;

async function withSnapshotDate<T>(run: () => Promise<T>): Promise<T> {
  const instant = RealDate.parse("2026-12-31T12:00:00.000Z");
  class SnapshotDate extends RealDate {
    constructor(...args: ConstructorParameters<typeof Date>) {
      if (args.length === 0) super(instant);
      else super(...args);
    }
    static now() {
      return instant;
    }
  }
  globalThis.Date = SnapshotDate as DateConstructor;
  try {
    return await run();
  } finally {
    globalThis.Date = RealDate;
  }
}

test("project retains mixed future-effective and unrecognized January orders in deadline coverage", async () => {
  (globalThis as any).__quotaLoadDates = [];
  (globalThis as any).__quotaWarnings = ["Quota mensile verificata a fine mese"];
  (globalThis as any).__futureQuotas = [
    {
      id: 1,
      key: "1-first",
      orderId: 1, sizeCode: "TP-2000", quantity: 50,
      year: 2027, month: 1, day: 1, precision: "day",
    },
    {
      id: 2,
      key: "1-second",
      orderId: 1, sizeCode: "TP-1000", quantity: 100,
      year: 2027, month: 1, day: 1, precision: "day",
    },
    {
      id: 3,
      key: "3-month",
      orderId: 3, sizeCode: "unrecognized-size", quantity: 20,
      year: 2027, month: 1, day: 31, precision: "month",
    },
  ];

  await withSnapshotDate(async () => {
    const result = await new GrowthProjectionService().project("TP-3000", 2027, 0, 1, 12);
    const january = result.monthlyContext.find((month: any) => month.year === 2027 && month.month === 1);

    assert.ok(january, "January 2027 is present in the visible projection");
    assert.deepEqual(
      {
        requested: january.deliveryCoverage.requested,
        covered: january.deliveryCoverage.covered,
        uncovered: january.deliveryCoverage.uncovered,
      },
      { requested: 170, covered: 0, uncovered: 170 },
    );
    assert.deepEqual(january.deliveryCoverage.bySize["TP-1000"], {
      requested: 100,
      covered: 0,
      uncovered: 100,
      arrearsFulfilled: 0,
      unverifiable: 0,
    });
    assert.deepEqual(january.deliveryCoverage.bySize["TP-2000"], {
      requested: 50,
      covered: 0,
      uncovered: 50,
      arrearsFulfilled: 0,
      unverifiable: 0,
    });
    assert.deepEqual(january.deliveryCoverage.bySize["unrecognized-size"], {
      requested: 20,
      covered: 0,
      uncovered: 20,
      arrearsFulfilled: 0,
      unverifiable: 0,
    });
    assert.equal(result.deliveryCoverageUnverifiable, 0);
    assert.equal(january.ordiniTotali, january.deliveryCoverage.requested);
    assert.deepEqual(january.ordiniBySize, {
      "TP-2000": 50, "TP-1000": 100, "unrecognized-size": 20,
    });
    assert.deepEqual(january.ordiniScopertiBySize, january.ordiniBySize);
    assert.deepEqual((globalThis as any).__quotaLoadDates, ["2026-12-31"]);
    assert.deepEqual(result.orderQuotaWarnings, ["Quota mensile verificata a fine mese"]);
  });
});

test("monthly missed quotas do not reserve later stock and arrears compatibility stays empty", async () => {
  (globalThis as any).__futureQuotas = [
    { key: "1-jan", orderId: 1, sizeCode: "TP-1000", quantity: 100, year: 2027, month: 1, day: 1, precision: "day" },
    { key: "1-feb", orderId: 1, sizeCode: "TP-1000", quantity: 100, year: 2027, month: 2, day: 1, precision: "day" },
  ];
  (globalThis as any).__quotaInventory = [{ basketId: 1, animalsPerKg: 2000, animalCount: 100 }];
  (globalThis as any).__quotaGrowInFebruary = true;
  try {
    await withSnapshotDate(async () => {
      const result = await new GrowthProjectionService().project("TP-3000", 2027, 0, 1, 12);
      const [january, february] = result.monthlyContext;
      assert.equal(january.ordiniEvasiTotali, 0);
      assert.deepEqual(january.ordiniScopertiBySize, { "TP-1000": 100 });
      assert.equal(february.ordiniEvasiTotali, 100);
      assert.deepEqual(february.ordiniScopertiBySize, {});
      assert.equal(january.deliveryCoverage.uncovered, 100);
      assert.equal(february.deliveryCoverage.covered, 100);
      for (const month of result.monthlyContext) {
        assert.deepEqual(month.ordiniArretratiBySize, {});
        assert.deepEqual(month.ordiniArretratiEvasiBySize, {});
        assert.equal(month.ordiniArretratiTotali, 0);
        assert.equal(month.ordiniEvasiArretratiTotali, 0);
        assert.equal(month.ordiniArretrati, 0);
        assert.equal(month.deliveryCoverage.arrearsFulfilled, 0);
        assert.equal(month.ordiniTotali, month.deliveryCoverage.requested);
      }
      assert.equal(february.disponibilitaBiologicaTotale, 100);
      assert.equal(february.disponibilitaForecastInizioMese, 100);
      assert.equal(result.monthlyContext[2].disponibilitaForecastInizioMese, 100);
    });
  } finally {
    (globalThis as any).__quotaInventory = [];
    (globalThis as any).__quotaGrowInFebruary = false;
  }
});

test("monthly and daily demand use the same future calendar, not historical header residuals", async () => {
  const calendar = buildFutureOrderQuotas([
    {
      id: 10, quantita: 400, quantitaTotale: 400, tagliaRichiesta: "TP-2000",
      dataInizioConsegna: "2026-11-01", dataFineConsegna: "2027-02-28", dataConsegna: null,
      cancellato: false, stato: null,
    },
    {
      id: 11, quantita: 90, quantitaTotale: 90, tagliaRichiesta: "TP-2000",
      dataInizioConsegna: null, dataFineConsegna: null, dataConsegna: "2026-12-30",
      cancellato: false, stato: null,
    },
    {
      id: 12, quantita: 7, quantitaTotale: 7, tagliaRichiesta: "TP-2000",
      dataInizioConsegna: null, dataFineConsegna: null, dataConsegna: "2026-12-31",
      cancellato: false, stato: null,
    },
  ], "2026-12-31", new Map([
    [10, [{ dataConsegna: "2026-12-15", quantitaConsegnata: 20, saleSizeCode: "TP-2000" }]],
  ]));
  (globalThis as any).__futureQuotas = calendar.quotas;
  (globalThis as any).__quotaWarnings = calendar.warnings;
  (globalThis as any).__quotaLoadDates = [];
  await withSnapshotDate(async () => {
    const result = await new GrowthProjectionService().project("TP-3000", 2026, 0, 12, 12);
    const [december, january, february, march] = result.monthlyContext;
    assert.equal(december.ordiniTotali, 87);
    assert.equal(january.ordiniTotali, 100);
    assert.equal(february.ordiniTotali, 100);
    assert.equal(march.ordiniTotali, 0);
    for (const month of result.monthlyContext) {
      assert.equal(month.ordiniTotali, month.deliveryCoverage.requested);
      assert.equal(month.deliveryCoverage.unverifiable, 0);
      assert.equal(month.deliveryCoverage.arrearsFulfilled, 0);
      assert.deepEqual(month.ordiniArretratiBySize, {});
    }
    assert.deepEqual((globalThis as any).__quotaLoadDates, ["2026-12-31"]);
  });
});