import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateDeliveryDateCoverage,
  canonicalDeliveryDate,
  getDeliveryCoverageHatcheryYears,
  mapDeliveryOrderSize,
  type DeliveryCoverageBasket,
  type DeliveryCoverageOrder,
} from "./delivery-coverage";
import {
  allocateForecastAndSandNursery,
  calculateFulfillableProductionForecast,
} from "./forecast-fulfillment";
import { allocateOrdersAgainstBaskets } from "./order-allocation";

const sizes = [
  { id: 1, code: "TP-1000" },
  { id: 2, code: "TP-2000" },
  { id: 3, code: "TP-300" },
];

function range(
  sizeId: number,
  code: string,
  minAnimalsPerKg: number,
  maxAnimalsPerKg: number,
  validFrom = "2020-01-01",
) {
  return {
    sizeId,
    code,
    minAnimalsPerKg,
    maxAnimalsPerKg,
    validFrom,
    validTo: null,
  };
}

function context(ranges = [
  range(1, "TP-1000", 1, 1000),
  range(2, "TP-2000", 1000, 2000),
  range(3, "TP-300", 2000, 3300),
]) {
  return {
    allSizes: sizes,
    sizeRangeVersions: ranges,
    sgrByMonthAndSize: {},
    sgrFallbackByMonth: {},
    globalFallback: 1,
    mortalityByMonthAndSize: {
      ...Object.fromEntries(Array.from({ length: 12 }, (_, month) => [
        [`${month + 1}|TP-1000`, 0.31],
        [`${month + 1}|TP-2000`, 0.31],
      ]).flat()),
    },
    findSizeIdForWeight: () => 2,
  };
}

function basket(
  animalCount: number,
  animalsPerKg: number,
  extra: Partial<DeliveryCoverageBasket> = {},
): DeliveryCoverageBasket {
  return {
    basketId: 1,
    animalCount,
    weightMg: 1_000_000 / animalsPerKg,
    ...extra,
  };
}

function order(
  id: number,
  size: string,
  quantity: number,
  deliveryDate: string | null,
): DeliveryCoverageOrder {
  return { id, size, quantity, deliveryDate };
}

test("daily deadlines separate snapshot stock, same-day coverage and late arrears", () => {
  const startingBaskets = [basket(100, 2000)];
  const result = calculateDeliveryDateCoverage({
    orders: [
      order(1, "TP-1000", 5, "2026-12-14"),
      order(2, "TP-1000", 100, "2026-12-15"),
    ],
    startingBaskets,
    months: [{ year: 2026, month: 12 }],
    referenceDate: new Date(2026, 11, 14),
    simulationContext: context(),
    hatcheryByYearMonth: {},
  });

  const december = result.byYearMonth["2026-12"];
  assert.equal(december.requested, 105);
  assert.equal(december.covered, 94);
  assert.equal(december.uncovered, 11);
  assert.equal(december.arrearsFulfilled, 5);
  assert.equal(december.bySize["TP-1000"].covered, 94);
  assert.deepEqual(startingBaskets, [basket(100, 2000)]);
});

test("hatchery batches are unavailable before arrival and do not grow on the arrival date", () => {
  const result = calculateDeliveryDateCoverage({
    orders: [
      order(1, "TP-300", 20, "2026-12-14"),
      order(2, "TP-300", 20, "2026-12-15"),
    ],
    startingBaskets: [],
    months: [{ year: 2026, month: 12 }],
    referenceDate: new Date(2026, 11, 14),
    simulationContext: context(),
    hatcheryByYearMonth: {
      "2026-12": { forecast: 100, actual: 0 },
    },
  });

  const december = result.byYearMonth["2026-12"];
  assert.equal(december.requested, 40);
  assert.equal(december.covered, 20);
  assert.equal(december.uncovered, 20);
  assert.equal(december.arrearsFulfilled, 20);
});

test("one stock pool is shared across sizes and due dates across month/year boundaries", () => {
  const result = calculateDeliveryDateCoverage({
    orders: [
      order(1, "TP-1000", 50, "2026-12-31"),
      order(2, "TP-2000", 100, "2027-01-01"),
      order(3, "TP-1000", 100, "2027-01-02"),
    ],
    startingBaskets: [basket(150, 1000)],
    months: [{ year: 2026, month: 12 }, { year: 2027, month: 1 }],
    referenceDate: new Date(2026, 11, 31),
    simulationContext: context(),
    hatcheryByYearMonth: {},
  });

  assert.equal(result.byYearMonth["2026-12"].covered, 50);
  assert.equal(result.byYearMonth["2027-1"].requested, 200);
  assert.equal(result.byYearMonth["2027-1"].covered, 99);
  assert.equal(result.byYearMonth["2027-1"].uncovered, 101);
  assert.equal(result.byYearMonth["2027-1"].arrearsFulfilled, 0);
});

test("replay includes intermediate deadlines and hatchery arrivals before the visible horizon", () => {
  const result = calculateDeliveryDateCoverage({
    orders: [
      order(1, "TP-300", 20, "2026-12-14"),
      order(2, "TP-300", 40, "2026-12-16"),
      order(3, "TP-300", 50, "2027-01-01"),
    ],
    startingBaskets: [],
    months: [{ year: 2027, month: 1 }],
    referenceDate: new Date(2026, 10, 20),
    simulationContext: { ...context(), globalFallback: 0 },
    hatcheryByYearMonth: {
      "2026-12": { forecast: 100, actual: 0 },
    },
  });

  assert.equal(result.byYearMonth["2027-1"].requested, 50);
  assert.equal(result.byYearMonth["2027-1"].covered, 40);
  assert.equal(result.byYearMonth["2027-1"].uncovered, 10);
  assert.equal(result.byYearMonth["2027-1"].unverifiable, 0);
});

test("intervening hatchery data years span the business snapshot through the visible horizon", () => {
  assert.deepEqual(
    getDeliveryCoverageHatcheryYears(
      new Date(2026, 10, 20),
      { year: 2027, month: 1 },
    ),
    [2026, 2027],
  );
  assert.deepEqual(
    getDeliveryCoverageHatcheryYears(
      new Date(2026, 10, 20),
      { year: 2026, month: 10 },
    ),
    [],
  );
});

test("delivery size limits use the range version active on each due date", () => {
  const result = calculateDeliveryDateCoverage({
    orders: [order(1, "TP-1000", 10, "2027-01-01")],
    startingBaskets: [basket(10, 1000)],
    months: [{ year: 2026, month: 12 }, { year: 2027, month: 1 }],
    referenceDate: new Date(2026, 11, 31),
    simulationContext: {
      ...context([
        { ...range(1, "TP-1000", 1, 1000), validTo: "2026-12-31" },
        range(2, "TP-2000", 1000, 2000),
        range(3, "TP-300", 2000, 3300),
        range(1, "TP-1000", 1, 900, "2027-01-01"),
      ]),
      globalFallback: 0,
    },
    hatcheryByYearMonth: {},
  });

  assert.equal(result.byYearMonth["2027-1"].requested, 10);
  assert.equal(result.byYearMonth["2027-1"].covered, 0);
  assert.equal(result.byYearMonth["2027-1"].uncovered, 10);
});

test("invalid, past and missing dates are unverifiable without creating deadlines", () => {
  const result = calculateDeliveryDateCoverage({
    orders: [
      order(1, "TP-1000", 3, "2026-02-31"),
      order(2, "TP-1000", 4, "2026-12-13"),
      order(3, "TP-1000", 5, null),
      order(4, "TP-1000", 6, "not-a-date"),
    ],
    startingBaskets: [basket(100, 1000)],
    months: [{ year: 2026, month: 2 }, { year: 2026, month: 12 }],
    referenceDate: new Date(2026, 11, 14),
    simulationContext: context(),
    hatcheryByYearMonth: {},
  });

  assert.equal(result.byYearMonth["2026-2"].unverifiable, 3);
  assert.equal(result.byYearMonth["2026-12"].unverifiable, 4);
  assert.equal(result.byYearMonth["2026-12"].requested, 0);
  assert.equal(result.unknownMonthUnverifiable, 11);
});

test("canonical delivery date preserves a saved start date ahead of legacy or end dates", () => {
  assert.equal(canonicalDeliveryDate({
    dataInizioConsegna: "2027-02-01",
    dataConsegna: "2027-02-10",
    dataFineConsegna: "2027-02-20",
  }), "2027-02-01");
  assert.equal(canonicalDeliveryDate({
    dataConsegna: "2027-02-10",
    dataFineConsegna: "2027-02-20",
  }), "2027-02-10");
  assert.equal(canonicalDeliveryDate({
    dataFineConsegna: "2027-02-20",
  }), "2027-02-20");
});

test("order-size identity does not depend on snapshot-day range availability", () => {
  const snapshotRanges = [
    range(1, "TP-1000", 1, 1000),
    range(2, "TP-2000", 1000, 2000),
    range(3, "TP-300", 2000, 3300),
  ];
  const nextDayRanges = [
    range(2, "TP-2000", 1, 2000),
    range(3, "TP-300", 2000, 3300),
  ];
  assert.equal(
    mapDeliveryOrderSize("TP 1000", context(snapshotRanges)),
    "TP-1000",
  );
  assert.equal(
    mapDeliveryOrderSize("TP-1000", context(nextDayRanges)),
    "TP-1000",
  );
});

test("changing daily orders leaves fixed-input monthly order and Forecast ledgers unchanged", () => {
  const measuredInventory = [basket(70, 1000)];
  const forecastInventory = [{ animalCount: 70 }];
  const months = [{ year: 2026, month: 12 }];
  const simContext = context();
  const runExistingLedgers = () => {
    const monthlyBaskets = measuredInventory.map((item) => ({
      animalsPerKg: 1_000_000 / item.weightMg,
      animalCount: item.animalCount,
    }));
    const monthlyOrders = allocateOrdersAgainstBaskets(
      monthlyBaskets,
      { "TP-1000": 20 },
      { "TP-2000": 10 },
      { "TP-1000": 1000, "TP-2000": 2000 },
    );
    const forecastBaskets = structuredClone(forecastInventory);
    const forecastFulfillable = calculateFulfillableProductionForecast(80, 70);
    const forecastAllocation = allocateForecastAndSandNursery(
      forecastBaskets,
      forecastFulfillable,
      10,
    );
    return { monthlyBaskets, monthlyOrders, forecastBaskets, forecastFulfillable, forecastAllocation };
  };

  const baseline = runExistingLedgers();
  calculateDeliveryDateCoverage({
    orders: [order(1, "TP-1000", 10, "2026-12-14")],
    startingBaskets: measuredInventory,
    months,
    referenceDate: new Date(2026, 11, 13),
    simulationContext: simContext,
    hatcheryByYearMonth: {},
  });
  calculateDeliveryDateCoverage({
    orders: [
      order(1, "TP-1000", 50, "2026-12-14"),
      order(2, "TP-2000", 90, "2026-12-20"),
    ],
    startingBaskets: measuredInventory,
    months,
    referenceDate: new Date(2026, 11, 13),
    simulationContext: simContext,
    hatcheryByYearMonth: {},
  });
  assert.deepEqual(runExistingLedgers(), baseline);
});