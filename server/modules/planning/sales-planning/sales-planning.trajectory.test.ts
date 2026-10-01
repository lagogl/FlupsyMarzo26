import test from "node:test";
import assert from "node:assert/strict";

// Engine imports instantiate Drizzle pools, but these trajectory tests never
// issue queries. Use a deliberately unreachable local URL to prevent DB access.
const noConnectUrl = "postgresql://test:test@127.0.0.1:1/sales-planning-no-connect";
process.env.DATABASE_URL = noConnectUrl;
process.env.NEON_DATABASE_URL = noConnectUrl;
delete process.env.DATABASE_URL_ESTERNO;

const [
  { createSalesPlanningHatcheryBaskets, simulateSalesPlanningMonth },
  { SalesPlanningMilpService, createSalesPlanningMilpHatcheryBaskets },
  { productionForecastService },
  { resolveHatcheryArrivalPlans },
] = await Promise.all([
  import("./sales-planning.service"),
  import("./sales-planning.milp"),
  import("../../../ai/production-forecast-service"),
  import("../hatchery-arrival-policy"),
]);

test("commercial engines model resolved residuals and date-accurate hatchery growth and mortality", () => {
  const currentPlans = resolveHatcheryArrivalPlans(
    [
      { year: 2026, month: 1, quantity: 100, actualQuantity: null },
      { year: 2026, month: 2, quantity: 0, actualQuantity: null },
    ],
    [{ year: 2026, month: 1, total: 20, lotCount: 1 }],
    new Date(2026, 0, 10),
  );
  assert.deepEqual(currentPlans.map((plan) => plan.quantity), [80, 0]);

  // The arrival-date range lookup is per plan: January and February cohorts
  // can carry different TP-300 upper thresholds after a range version change.
  const apkAtArrival = (plan: { month: number }) => plan.month === 1 ? 250 : 500;
  const januaryCohorts = createSalesPlanningHatcheryBaskets(
    currentPlans,
    { year: 2026, month: 1 },
    900000,
    apkAtArrival,
  );
  assert.equal(januaryCohorts.length, 1);
  assert.equal(januaryCohorts[0].animalCount, 80);
  assert.equal(januaryCohorts[0].weightMg, 1000000 / 250);
  assert.deepEqual(
    createSalesPlanningHatcheryBaskets(currentPlans, { year: 2026, month: 2 }, 900001, apkAtArrival),
    [],
  );

  const serviceMonth = (referenceDate: Date) => {
    let growthDays = 0;
    const baskets = simulateSalesPlanningMonth({
      baskets: januaryCohorts,
      month: { year: 2026, month: 1 },
      referenceDate,
      sgrLookup: {},
      dbMortalityRates: {},
      customMonthlyRate: 0.31,
      getSgr: () => {
        growthDays++;
        return 1;
      },
      getSaleSize: () => "TP-300",
      getCategory: () => "T1",
    });
    return { basket: baskets[0], growthDays };
  };
  const serviceOn15 = serviceMonth(new Date(2026, 0, 15));
  const serviceAfter15 = serviceMonth(new Date(2026, 0, 20));
  assert.equal(serviceOn15.growthDays, 16);
  assert.equal(serviceAfter15.growthDays, 11);
  assert.equal(serviceOn15.basket.animalCount, 64);
  assert.equal(serviceAfter15.basket.animalCount, 69);
  assert.ok(serviceAfter15.basket.weightMg < serviceOn15.basket.weightMg);

  const currentMonthSteps = [
    { year: 2026, monthIndex: 0, month1Based: 1 },
    { year: 2026, monthIndex: 1, month1Based: 2 },
  ];
  const currentMilpBaskets = createSalesPlanningMilpHatcheryBaskets(
    currentPlans,
    currentMonthSteps,
    900000,
    (plan) => 1000000 / apkAtArrival(plan),
  );
  assert.deepEqual(currentMilpBaskets.map((basket) => basket.animalCount), [80]);

  const originalSgr = productionForecastService.getSgrForAnimalsPerKg;
  const originalSize = productionForecastService.mapAnimalsPerKgToSaleSize;
  const originalCategory = productionForecastService.getCategoryFromAnimalsPerKg;
  try {
    (productionForecastService as any).getSgrForAnimalsPerKg = () => 1;
    (productionForecastService as any).mapAnimalsPerKgToSaleSize = () => "TP-300";
    (productionForecastService as any).getCategoryFromAnimalsPerKg = () => "T1";

    const engine = new SalesPlanningMilpService();
    const on15 = engine.buildBasketTrajectories(
      currentMilpBaskets,
      currentMonthSteps,
      {},
      {},
      0.31,
      new Date(2026, 0, 15),
    );
    const after15 = engine.buildBasketTrajectories(
      currentMilpBaskets,
      currentMonthSteps,
      {},
      {},
      0.31,
      new Date(2026, 0, 20),
    );
    assert.equal(on15[0].monthState[0].mortalityRate, 0.31 * (16 / 31));
    assert.equal(after15[0].monthState[0].mortalityRate, 0.31 * (11 / 31));
    assert.ok(Math.abs(on15[0].monthState[0].kgPerAnimal - ((1000000 / 250) * Math.pow(1.01, 16) / 1000000)) < 1e-12);
    assert.ok(Math.abs(after15[0].monthState[0].kgPerAnimal - ((1000000 / 250) * Math.pow(1.01, 11) / 1000000)) < 1e-12);

    const rolloverPlans = resolveHatcheryArrivalPlans(
      [
        { year: 2026, month: 1, quantity: 100, actualQuantity: null },
        { year: 2026, month: 2, quantity: 35, actualQuantity: null },
      ],
      [],
      new Date(2025, 11, 31),
    );
    const rolloverSteps = [
      { year: 2026, monthIndex: 0, month1Based: 1 },
      { year: 2026, monthIndex: 1, month1Based: 2 },
    ];
    const rolloverBaskets = createSalesPlanningMilpHatcheryBaskets(
      rolloverPlans,
      rolloverSteps,
      910000,
      (plan) => 1000000 / apkAtArrival(plan),
    );
    assert.deepEqual(rolloverBaskets.map((basket) => basket.animalCount), [100, 35]);
    assert.deepEqual(rolloverBaskets.map((basket) => basket.arrivalMonthIndex), [0, 1]);
    const rolloverTrajectories = engine.buildBasketTrajectories(
      rolloverBaskets,
      rolloverSteps,
      {},
      {},
      0,
      new Date(2025, 11, 31),
    );

    const januaryTrajectory = rolloverTrajectories.find((basket) => basket.basketIdNumeric === 910000)!;
    const februaryTrajectory = rolloverTrajectories.find((basket) => basket.basketIdNumeric === 910001)!;
    assert.equal(januaryTrajectory.initialAnimals, 100);
    assert.ok(Math.abs(januaryTrajectory.monthState[0].kgPerAnimal - ((1000000 / 250) * Math.pow(1.01, 16) / 1000000)) < 1e-12);
    assert.equal(februaryTrajectory.initialAnimals, 35);
    assert.equal(februaryTrajectory.monthState[0].kgPerAnimal, 0);
    assert.ok(Math.abs(februaryTrajectory.monthState[1].kgPerAnimal - ((1000000 / 500) * Math.pow(1.01, 13) / 1000000)) < 1e-12);
    assert.equal(februaryTrajectory.monthState[1].mortalityRate, 0);
  } finally {
    (productionForecastService as any).getSgrForAnimalsPerKg = originalSgr;
    (productionForecastService as any).mapAnimalsPerKgToSaleSize = originalSize;
    (productionForecastService as any).getCategoryFromAnimalsPerKg = originalCategory;
  }
});