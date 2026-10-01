import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";

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
      getBasketLevelInventory: async () => [],
      getOrdersByMonthAndSize: async () => ({}),
    };
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
    export function findProjectedSize() { return null; }
    export function stepOneDay(state) { return state; }
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
  (globalThis as any).__task149Orders = [
    {
      id: 1,
      quantita: 50,
      quantitaTotale: 50,
      tagliaRichiesta: "TP-2000",
      dataInizioConsegna: "2027-01-01",
      dataConsegna: null,
      dataFineConsegna: null,
    },
    {
      id: 2,
      quantita: 100,
      quantitaTotale: 100,
      tagliaRichiesta: "TP-1000",
      dataInizioConsegna: "2027-01-01",
      dataConsegna: null,
      dataFineConsegna: null,
    },
    {
      id: 3,
      quantita: 20,
      quantitaTotale: 20,
      tagliaRichiesta: "unrecognized-size",
      dataInizioConsegna: "2027-01-01",
      dataConsegna: null,
      dataFineConsegna: null,
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
    assert.deepEqual(january.deliveryCoverage.bySize["TAGLIA NON RICONOSCIUTA"], {
      requested: 20,
      covered: 0,
      uncovered: 20,
      arrearsFulfilled: 0,
      unverifiable: 0,
    });
    assert.equal(result.deliveryCoverageUnverifiable, 0);
  });
});