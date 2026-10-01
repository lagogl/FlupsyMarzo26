import test from "node:test";
import assert from "node:assert/strict";
import { PgDialect } from "drizzle-orm/pg-core";

const noConnectUrl = "postgresql://test:test@127.0.0.1:1/business-date-no-connect";
process.env.DATABASE_URL = noConnectUrl;
process.env.NEON_DATABASE_URL = noConnectUrl;
delete process.env.DATABASE_URL_ESTERNO;
process.env.TZ = "UTC";

const [
  { SalesPlanningService },
  { SalesPlanningMilpService },
  { GrowthProjectionService },
  { productionForecastService },
  { storage },
  { db },
  { sizeRangeVersions },
  { default: lpSolver },
  { businessToday, getBusinessReferenceDate },
  { businessToday: scenarioBusinessToday },
] = await Promise.all([
  import("./sales-planning.service"),
  import("./sales-planning.milp"),
  import("../growth-projection/growth-projection.service"),
  import("../../../ai/production-forecast-service"),
  import("../../../storage"),
  import("../../../db"),
  import("../../../../shared/schema"),
  import("javascript-lp-solver"),
  import("../../../utils/business-date"),
  import("../sales-scenarios/service"),
]);

test("default, cutoff lotti e reexport scenario seguono il giorno aziendale nei casi di confine", async () => {
  const OriginalDate = globalThis.Date;
  const dbAny = db as any;
  const solverAny = lpSolver as any;
  const originalSelect = dbAny.select;
  const originalExecute = dbAny.execute;
  const originalSolve = solverAny.Solve;
  const storageAny = storage as any;
  const storageOriginals = {
    getSizes: storageAny.getSizes,
    getSgrs: storageAny.getSgrs,
    getSgrPerTaglia: storageAny.getSgrPerTaglia,
  };
  const forecastAny = productionForecastService as any;
  const forecastMethods = [
    "getSgrLookup",
    "getBasketLevelInventory",
    "getOrdersByMonthAndSize",
    "getActiveSizeCandidates",
    "getSgrForAnimalsPerKg",
    "mapAnimalsPerKgToSaleSize",
    "getCategoryFromAnimalsPerKg",
  ] as const;
  const forecastOriginals = Object.fromEntries(
    forecastMethods.map((name) => [name, forecastAny[name]]),
  );
  const executions: any[] = [];
  const sgrCalls = { greedy: 0, milp: 0 };

  const sizes = [
    { id: 1, code: "TP-300", name: "TP-300" },
    { id: 2, code: "TP-3000", name: "TP-3000" },
  ];
  const ranges = [
    {
      sizeId: 1,
      code: "TP-300",
      minAnimalsPerKg: 1,
      maxAnimalsPerKg: 300,
      validFrom: "2000-01-01",
      validTo: null,
    },
    {
      sizeId: 2,
      code: "TP-3000",
      minAnimalsPerKg: 301,
      maxAnimalsPerKg: 3000,
      validFrom: "2000-01-01",
      validTo: null,
    },
  ];
  const inventory = [{ basketId: 1, animalsPerKg: 1000, animalCount: 100 }];
  const activeCandidates = [
    { code: "TP-300", minAnimalsPerKg: 1, maxAnimalsPerKg: 300 },
    { code: "TP-3000", minAnimalsPerKg: 301, maxAnimalsPerKg: 3000 },
  ];
  const dateCases = [
    {
      name: "winter Rome midnight/month boundary",
      instant: "2025-01-31T23:30:00.000Z",
      utcDate: "2025-01-31",
      year: 2025,
      month: 2,
      day: 1,
    },
    {
      name: "summer Rome midnight/month boundary",
      instant: "2025-07-14T22:30:00.000Z",
      utcDate: "2025-07-14",
      year: 2025,
      month: 7,
      day: 15,
    },
    {
      name: "Rome year rollover",
      instant: "2025-12-31T23:30:00.000Z",
      utcDate: "2025-12-31",
      year: 2026,
      month: 1,
      day: 1,
    },
    {
      name: "Rome spring DST after transition",
      instant: "2025-03-30T01:30:00.000Z",
      utcDate: "2025-03-30",
      year: 2025,
      month: 3,
      day: 30,
    },
    {
      name: "Rome fall DST after transition",
      instant: "2025-10-26T01:30:00.000Z",
      utcDate: "2025-10-26",
      year: 2025,
      month: 10,
      day: 26,
    },
  ];
  const monthNames = [
    "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
    "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
  ];

  try {
    // The regression concerns date defaults, not LP optimization. Keep the
    // test independent of the solver's optional branch-and-cut internals.
    solverAny.Solve = () => ({ feasible: true, bounded: true, result: 0 });

    // Keep all projections offline. The thenable query surface covers only
    // the Drizzle select chains needed by these services and the lot loader.
    dbAny.select = () => ({
      from: (table: unknown) => {
        const query = Promise.resolve(table === sizeRangeVersions ? ranges : []) as any;
        query.where = async () => [];
        query.innerJoin = async () => ranges;
        return query;
      },
    });
    dbAny.execute = async (query: unknown) => {
      executions.push(query);
      return { rows: [] };
    };

    storageAny.getSizes = async () => sizes;
    storageAny.getSgrs = async () =>
      monthNames.map((month) => ({ month, percentage: 1 }));
    storageAny.getSgrPerTaglia = async () => [];

    forecastAny.getSgrLookup = async () => ({});
    forecastAny.getBasketLevelInventory = async () => inventory;
    forecastAny.getOrdersByMonthAndSize = async () => ({});
    forecastAny.getActiveSizeCandidates = async () => activeCandidates;
    forecastAny.mapAnimalsPerKgToSaleSize = () => "TP-3000";
    forecastAny.getCategoryFromAnimalsPerKg = () => "T1";

    const greedy = new SalesPlanningService();
    greedy.getMortalityLookup = async () => ({});
    greedy.getPriceList = async () => ({});
    greedy.getCashTargets = async () => ({});
    const milp = new SalesPlanningMilpService();
    milp.getMortalityLookup = async () => ({});
    milp.getPriceList = async () => ({});
    milp.getCashTargetsForYears = async () => ({});
    const growth = new GrowthProjectionService();
    growth.getMortalityRatesFromDb = async () => ({});

    for (const dateCase of dateCases) {
      const frozenInstant = OriginalDate.parse(dateCase.instant);
      class FrozenDate extends OriginalDate {
        constructor(...args: ConstructorParameters<typeof Date>) {
          if (args.length === 0) super(frozenInstant);
          else super(...args);
        }

        static now() {
          return frozenInstant;
        }
      }
      globalThis.Date = FrozenDate as DateConstructor;

      assert.equal(
        new OriginalDate(dateCase.instant).toISOString().slice(0, 10),
        dateCase.utcDate,
        `${dateCase.name}: fixture must be on the expected UTC date`,
      );
      const expectedDate = {
        year: dateCase.year,
        month: dateCase.month,
        day: dateCase.day,
      };
      assert.deepEqual(businessToday(), expectedDate, `${dateCase.name}: utility default`);
      assert.deepEqual(
        scenarioBusinessToday(new OriginalDate(frozenInstant)),
        expectedDate,
        `${dateCase.name}: scenario reexport`,
      );

      const businessDateIso =
        `${dateCase.year}-${String(dateCase.month).padStart(2, "0")}-${String(dateCase.day).padStart(2, "0")}`;
      const daysInMonth = new OriginalDate(
        dateCase.year,
        dateCase.month,
        0,
      ).getDate();
      const simulationDays = daysInMonth - dateCase.day;
      const executionStart = executions.length;
      sgrCalls.greedy = 0;
      sgrCalls.milp = 0;

      forecastAny.getSgrForAnimalsPerKg = () => {
        sgrCalls.greedy++;
        return 1; // 1% daily growth in both commercial engines.
      };
      const greedyResult = await greedy.plan({
        monthsHorizon: 1,
        mode: "ricavo",
        mortalityPercent: 31,
      });

      // MILP uses the same growth input but keeps its aggregate monthly
      // mortality fraction instead of rounding count every simulated day.
      forecastAny.getSgrForAnimalsPerKg = () => {
        sgrCalls.milp++;
        return 1;
      };
      const milpResult = await milp.plan({
        monthsHorizon: 1,
        mode: "ricavo",
        mortalityPercent: 31,
      });
      const growthResult = await growth.project("TP-3000", undefined, 31, undefined, 12);

      for (const firstMonth of [
        greedyResult.monthlyPlan[0],
        milpResult.monthlyPlan[0],
        growthResult.monthlyContext[0],
      ]) {
        assert.equal(firstMonth.year, dateCase.year, `${dateCase.name}: default year`);
        assert.equal(firstMonth.month, dateCase.month, `${dateCase.name}: default month`);
      }

      assert.equal(sgrCalls.greedy, simulationDays, `${dateCase.name}: greedy calendar`);
      assert.equal(sgrCalls.milp, simulationDays, `${dateCase.name}: MILP calendar`);
      assert.equal(milpResult.monthlyPlan[0].sales.length, 0);

      let expectedGreedyAnimals = 100;
      for (let day = 0; day < simulationDays; day++) {
        expectedGreedyAnimals = Math.round(
          expectedGreedyAnimals * (1 - 0.31 / daysInMonth),
        );
      }
      assert.equal(
        greedyResult.monthlyPlan[0].remainingAnimals,
        expectedGreedyAnimals,
        `${dateCase.name}: greedy per-day mortality/rounding`,
      );
      assert.ok(
        Math.abs(
          growthResult.groups[0].months[0].avgAnimalsPerKg -
            Math.round(1000 / Math.pow(1.01, simulationDays)),
        ) <= 1,
        `${dateCase.name}: growth daily simulation calendar`,
      );
      assert.equal(
        growthResult.groups[0].months[0].quantity,
        expectedGreedyAnimals,
        `${dateCase.name}: growth and greedy daily rounding`,
      );

      const milpTrajectory = milp.buildBasketTrajectories(
        [{
          basketId: 1,
          weightMg: 1000,
          animalCount: 100,
          isHatchery: false,
          arrivalMonthIndex: 0,
        }],
        [{
          year: dateCase.year,
          monthIndex: dateCase.month - 1,
          month1Based: dateCase.month,
        }],
        {},
        {},
        0.31,
        getBusinessReferenceDate(new OriginalDate(frozenInstant)),
      )[0].monthState[0];
      assert.equal(sgrCalls.milp, simulationDays * 2);
      assert.ok(
        Math.abs(
          milpTrajectory.mortalityRate -
            (0.31 * simulationDays) / daysInMonth,
        ) < 1e-12,
        `${dateCase.name}: MILP aggregate mortality fraction`,
      );
      assert.ok(
        Math.abs(
          milpTrajectory.kgPerAnimal -
            (1000 * Math.pow(1.01, simulationDays)) / 1_000_000,
        ) < 1e-12,
        `${dateCase.name}: MILP daily growth calendar`,
      );

      const caseQueries = executions.slice(executionStart);
      assert.equal(caseQueries.length, 3, `${dateCase.name}: all lot lookups executed`);
      for (const query of caseQueries) {
        const compiledQuery = new PgDialect().sqlToQuery(query);
        assert.ok(
          JSON.stringify(compiledQuery.params).includes(businessDateIso),
          `${dateCase.name}: lot query should bind ${businessDateIso}`,
        );
      }
    }

    // Historical options are still honored rather than replaced with the
    // frozen current business year/month in every engine.
    const explicitYear = 2024;
    const explicitStartMonth = 11;
    sgrCalls.greedy = 0;
    sgrCalls.milp = 0;
    const explicitGreedy = await greedy.plan({
      year: explicitYear,
      startMonth: explicitStartMonth,
      monthsHorizon: 1,
      mode: "ricavo",
      mortalityPercent: 31,
    });
    const explicitMilp = await milp.plan({
      year: explicitYear,
      startMonth: explicitStartMonth,
      monthsHorizon: 1,
      mode: "ricavo",
      mortalityPercent: 31,
    });
    const explicitGrowth = await growth.project(
      "TP-3000",
      explicitYear,
      31,
      explicitStartMonth,
      12,
    );
    for (const firstMonth of [
      explicitGreedy.monthlyPlan[0],
      explicitMilp.monthlyPlan[0],
      explicitGrowth.monthlyContext[0],
    ]) {
      assert.equal(firstMonth.year, explicitYear);
      assert.equal(firstMonth.month, explicitStartMonth);
    }
    assert.equal(sgrCalls.greedy, 0);
    assert.equal(sgrCalls.milp, 0);
  } finally {
    globalThis.Date = OriginalDate;
    dbAny.select = originalSelect;
    dbAny.execute = originalExecute;
    Object.assign(storageAny, storageOriginals);
    Object.assign(forecastAny, forecastOriginals);
    solverAny.Solve = originalSolve;
  }
});