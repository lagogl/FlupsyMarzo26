import test from "node:test";
import assert from "node:assert/strict";
import { commercialInputSchema } from "../../../../shared/commercial-availability";
import { scenarioInputSchema } from "../../../../shared/sales-scenarios";
import { computeCommercial } from "./compute";
import { calculateInWorker } from "./worker-pool";
import { monthNumber, monthParts, projectWorld, type World } from "../sales-scenarios/engine";
import { buildCohortPath } from "../sales-scenarios/cohort-path";
import { verifiedResidual } from "./order-residuals";
import { scenarioArrivalPlans } from "./arrival-options";
import { resolveHatcheryArrivalPlans } from "../hatchery-arrival-policy";
import { createAdmission, CommercialBusyError } from "./admission";

const first = monthNumber(2027, 1);
const input = (sales: unknown[] = [], selectedSizeIds = [1, 2]) => commercialInputSchema.parse({
  name: "Test", startYear: 2027, startMonth: 1, horizon: 6, selectedSizeIds, sales,
});
const sale = (quantity = 400, month = 1, sizeId = 1, day?: number) => ({ id: "sale", year: 2027, month, sizeId, quantity, ...(day ? { day } : {}) });
function world(): World {
  return {
    first, last: first + 7, startDay: 10, sizes: [1, 2], orders: [],
    maxApk: Object.fromEntries(Array.from({ length: 8 }, (_, i) => [[`${first + i}|1`, 10000], [`${first + i}|2`, 5000]]).flat()),
    cohorts: [{
      quantity: 1000, entry: first,
      path: Object.fromEntries(Array.from({ length: 8 }, (_, i) => [first + i, { survival: 1, sizeId: i ? 2 : 1, animalsPerKg: i ? 4000 : 8000 }])),
    }],
  };
}
test("sales consume once across months/sizes; edit/delete restore baseline", () => {
  const w = world(), original = JSON.stringify(w);
  const base = computeCommercial(w, input());
  const plan = computeCommercial(w, input([sale()]));
  assert.equal(plan.months[1].availableBySize[2], 600);
  assert.equal(plan.plan[0].date, "2027-01-10");
  assert.equal(plan.totalAccepted, 400);
  assert.equal(computeCommercial(w, input([sale(200)])).months[1].availableBySize[2], 800);
  assert.deepEqual(computeCommercial(w, input()).months, base.months);
  assert.equal(JSON.stringify(w), original);
});
test("visibility never drops hidden sale consumption", () => {
  const plan = computeCommercial(world(), input([sale()], [2]));
  assert.equal(plan.totalAccepted, 400);
  assert.equal(plan.months[1].availableBySize[2], 600);
  assert.deepEqual(Object.keys(plan.months[0].availableBySize), ["2"]);
});
test("cell deficits separate unmet included orders from unmet simulated sales", () => {
  const w = world();
  w.orders = [{ key: "jan", at: first, day: 10, sizeId: 1, quantity: 1200 }];
  const result = computeCommercial(w, input([sale(400)]));
  assert.equal(result.months[0].availableBySize[1], 0);
  assert.deepEqual(result.months[0].shortfallsBySize?.[1], { orders: 200, sales: 400 });
  assert.deepEqual(result.baselineMonths[0].shortfallsBySize?.[1], { orders: 200, sales: 0 });
  assert.deepEqual(result.months[1].shortfallsBySize?.[1], { orders: 0, sales: 0 });
  const removed = computeCommercial(w, input());
  assert.deepEqual(removed.months[0].shortfallsBySize?.[1], { orders: 200, sales: 0 });
});
test("zero additional capacity is not automatically a negative balance", () => {
  const w = world();
  w.orders = [{ key: "jan", at: first, day: 10, sizeId: 1, quantity: 1000 }];
  const result = computeCommercial(w, input());
  assert.equal(result.months[0].availableBySize[1], 0);
  assert.deepEqual(result.months[0].shortfallsBySize?.[1], { orders: 0, sales: 0 });
});
test("deficits belong to the requested size and month, without cumulative or cross-size copying", () => {
  const w = world();
  w.orders = [{ key: "large-jan", at: first, day: 10, sizeId: 2, quantity: 700 }];
  const result = computeCommercial(w, input());
  assert.deepEqual(result.months[0].shortfallsBySize?.[2], { orders: 700, sales: 0 });
  assert.deepEqual(result.months[0].shortfallsBySize?.[1], { orders: 0, sales: 0 });
  assert.equal(result.months[0].availableBySize[1], 1000);
  assert.deepEqual(result.months[1].shortfallsBySize?.[2], { orders: 0, sales: 0 });
});
test("hidden sale deficits are retained without attributing them to visible sizes", () => {
  const result = computeCommercial(world(), input([sale(1200)], [2]));
  assert.deepEqual(result.months[0].shortfallsBySize?.[1], { orders: 0, sales: 200 });
  assert.deepEqual(result.months[0].shortfallsBySize?.[2], { orders: 0, sales: 0 });
  assert.equal(result.months[1].availableBySize[2], 0);
});
test("an early unmet sale can coexist with later additional availability in the same month", () => {
  const w = world();
  w.cohorts[0].path[first].days = Object.fromEntries(Array.from({ length: 31 }, (_, i) => [
    i + 1, { survival: 1, sizeId: i < 19 ? 1 : 2, animalsPerKg: i < 19 ? 8000 : 4000 },
  ]));
  const result = computeCommercial(w, input([sale(100, 1, 2, 15)]));
  assert.deepEqual(result.months[0].shortfallsBySize?.[2], { orders: 0, sales: 100 });
  assert.equal(result.months[0].availableBySize[2], 1000);
  assert.equal(result.months[0].availabilityDayBySize?.[2], 20);
});
test("future orders beyond horizon and existing uncovered orders are protected per order", () => {
  const w = world();
  w.orders = [{ key: "future", at: first + 7, day: 5, sizeId: 2, quantity: 800 }];
  const result = computeCommercial(w, input([sale()]));
  assert.equal(result.totalAccepted, 200);
  assert.equal(result.valid, false);
  assert.equal(result.orderShortfall, 0);
  w.orders[0].quantity = 1200;
  const uncovered = computeCommercial(w, input([sale()]));
  assert.equal(uncovered.baselineOrderShortfall, 200);
  assert.equal(uncovered.totalAccepted, 0);
  assert.equal(uncovered.orderShortfall, 200);
});
test("explicit dates never move to a later size acquisition date", () => {
  const w = world();
  const p = w.cohorts[0].path[first];
  p.days = Object.fromEntries(Array.from({ length: 31 }, (_, i) => [i + 1, { survival: 1, sizeId: i < 19 ? 1 : 2, animalsPerKg: i < 19 ? 8000 : 4000 }]));
  const early = computeCommercial(w, input([sale(100, 1, 2, 15)]));
  assert.equal(early.valid, false);
  assert.equal(early.plan[0].date, "2027-01-15");
  const monthly = computeCommercial(w, input([sale(100, 1, 2)]));
  assert.equal(monthly.plan[0].date, "2027-01-20");
  assert.equal(monthly.valid, true);
  assert.throws(() => computeCommercial(w, input([sale(100, 1, 1, 2)])), /precedente/);
});
test("future hatchery cohort cannot be consumed before its entry day", () => {
  const w = world(); w.cohorts[0].entryDay = 20;
  assert.equal(computeCommercial(w, input([sale(100, 1, 1, 15)])).totalAccepted, 0);
  assert.equal(computeCommercial(w, input([sale(100, 1, 1, 20)])).totalAccepted, 100);
});
test("hatchery switch and overrides replace future residuals without rewriting original forecasts", () => {
  const plans = resolveHatcheryArrivalPlans(
    [{ year: 2027, month: 1, quantity: 1000, actualQuantity: null }],
    [{ year: 2027, month: 1, total: 400, lotCount: 1 }], new Date(2027, 0, 20));
  assert.equal(plans[0].quantity, 600);
  assert.deepEqual(scenarioArrivalPlans(plans, false, []), []);
  assert.equal(scenarioArrivalPlans(plans, true, [{ year: 2027, month: 1, quantity: 500 }])[0].quantity, 500);
  assert.equal(plans[0].quantity, 600);
  const inventory = world();
  const before = computeCommercial(inventory, input()).months[0].availableBySize[1];
  assert.equal(before, 1000, "actual arrived inventory remains independently present");
});
test("order exclusion removes only order constraints, never inventory", () => {
  const w = world();
  w.orders = [{ key: "future", at: first + 7, day: 5, sizeId: 2, quantity: 800 }];
  assert.equal(computeCommercial(w, input([sale()])).totalAccepted, 200);
  const without = { ...w, orders: [] };
  assert.equal(computeCommercial(without, input([sale()])).totalAccepted, 400);
  assert.equal(without.cohorts[0].quantity, 1000);
});
test("commercial dated ranges honor mid-month catalog changes without changing legacy defaults", () => {
  const w = world();
  w.datedSaleRanges = true;
  w.cohorts[0].path[first].days = Object.fromEntries(Array.from({ length: 31 }, (_, i) => [i + 1, { survival: 1, sizeId: 1, animalsPerKg: 8000 }]));
  for (let i = 0; i < 8; i++) for (let day = 1; day <= 31; day++) for (const sizeId of [1, 2])
    w.maxApk[`${first + i}|${day}|${sizeId}`] = i === 0 && day < 20 ? 5000 : 10000;
  const monthly = computeCommercial(w, input([sale(100)]));
  assert.equal(monthly.plan[0].date, "2027-01-20");
  assert.equal(computeCommercial(w, input([sale(100, 1, 1, 15)])).valid, false);
  delete w.datedSaleRanges;
  assert.equal(computeCommercial(w, input([sale(100, 1, 1, 15)])).valid, true);
});
test("baseline agrees with existing engine at identical inputs", () => {
  const w = world();
  const legacy = scenarioInputSchema.parse({ name: "Test", startYear: 2027, startMonth: 1, horizon: 6, selectedSizeIds: [1, 2], sales: [{ ...sale(), pricePerThousand: null, paymentDelayMonths: 0 }], cashDeadline: { year: 2027, month: 6 } });
  const previous = projectWorld(w, legacy);
  const current = computeCommercial(w, input([sale()]));
  assert.deepEqual(current.months.map(m => m.availableBySize), previous.months.map(m => m.availableBySize));
  assert.equal(current.totalAccepted, previous.months.reduce((s, m) => s + m.salesApplied, 0));
});
function mortalityWorld(factor: number): World {
  const path = buildCohortPath({
    entry: first, first, last: first + 5, startDay: 10, initialWeightMg: 100,
    referenceDate: new Date(2027, 0, 10, 12), getMonth: monthParts,
    getSize: weightMg => ({ sizeId: weightMg >= 200 ? 2 : 1 }),
    getBiologyDays: () => [],
    trackMortality: true,
    advanceDay: (weightMg, survival) => ({
      weightMg: weightMg + 10, survival: survival * factor, mortalityFactor: factor,
    }),
  });
  return {
    first, last: first + 5, startDay: 10, sizes: [1, 2], orders: [],
    maxApk: Object.fromEntries(Array.from({ length: 6 }, (_, i) => [
      [`${first + i}|1`, 10000], [`${first + i}|2`, 10000],
    ]).flat()),
    cohorts: [{ quantity: 1000, entry: first, path }],
  };
}
test("commercial mortality is known zero when tracked and unavailable for legacy paths", () => {
  const knownZero = computeCommercial(mortalityWorld(1), input());
  assert.equal(knownZero.months[0].mortalityBySize?.[1], 0);
  assert.equal(knownZero.months[0].mortalityBySize?.[2], 0);
  assert.equal(computeCommercial(world(), input()).months[0].mortalityBySize, undefined);
});
test("inventory terminal biology is counted in its own month, never again at the next month start", async () => {
  const { replay } = await import("../sales-scenarios/engine");
  const result = replay(mortalityWorld(0.9), [], undefined, false, undefined, { trackMortality: true });
  const total = (n: number) => Object.values(result.mortalityByMonth![n]).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(total(first) - 1000 * (1 - 0.9 ** 22)) < 1e-9);
  assert.ok(Math.abs(total(first + 1) - 1000 * 0.9 ** 22 * (1 - 0.9 ** 28)) < 1e-9);
});
test("commercial mortality follows physical size after growth and respects accepted exits", () => {
  const tracked = mortalityWorld(0.9);
  const withoutSales = computeCommercial(tracked, input());
  const withSale = computeCommercial(tracked, input([sale(400, 1, 1, 10)]));
  assert.ok((withoutSales.months[0].mortalityBySize?.[1] ?? 0) > (withSale.months[0].mortalityBySize?.[1] ?? 0));
  assert.ok((withSale.months[0].mortalityBySize?.[2] ?? 0) > 0, "post-growth size is used for mortality attribution");
  assert.ok((withSale.months[1].mortalityBySize?.[2] ?? 0) > 0);
  assert.ok(computeCommercial(tracked, input([], [2])).months[0].mortalityBySize?.[1] !== undefined,
    "mortality attribution retains physical sizes hidden from availability");
});
test("mortality observation does not change replay allocations or stock arithmetic", async () => {
  const { replay } = await import("../sales-scenarios/engine");
  const w = mortalityWorld(0.9);
  const allocations = [{ ...sale(100, 1, 1, 10), pricePerThousand: null, paymentDelayMonths: 0 }];
  const normal = replay(w, allocations);
  const observed = replay(w, allocations, undefined, false, undefined, { trackMortality: true });
  assert.deepEqual(observed.months, normal.months);
  assert.deepEqual(observed.applied, normal.applied);
  assert.deepEqual(observed.orders, normal.orders);
  assert.ok(observed.mortalityByMonth);
});
test("hatchery first-day and final-day biology is each observed exactly once", async () => {
  const { replay } = await import("../sales-scenarios/engine");
  const steps = Object.fromEntries(Array.from({ length: 31 }, (_, index) => [
    index + 1, { factor: 0.9, sizeId: 1, afterSnapshot: true },
  ]));
  const snapshots = {
    1: { survival: 0.9, sizeId: 1, animalsPerKg: 10000 },
    31: { survival: 0.9 ** 31, sizeId: 1, animalsPerKg: 10000 },
  };
  const w: World = {
    first, last: first, startDay: 1, sizes: [1], orders: [], maxApk: { [`${first}|1`]: 10000 },
    cohorts: [{ quantity: 1000, entry: first, entryDay: 1, path: {
      [first]: { survival: 1, sizeId: 1, animalsPerKg: 10000, days: snapshots, mortalityTracked: true, mortalitySteps: steps },
    } }],
  };
  const result = replay(w, [], undefined, false, undefined, { trackMortality: true });
  assert.ok(Math.abs(result.mortalityByMonth![first][1] - 1000 * (1 - 0.9 ** 31)) < 1e-9);
  assert.equal(result.months.get(first)?.remainingAnimals, Math.floor(1000 * 0.9 ** 31));
});
test("schema rejects invalid dates, duplicate IDs, out-of-horizon rows and malformed switches", () => {
  assert.throws(() => input([sale(), sale()]));
  assert.throws(() => input([sale(5, 8)]));
  assert.throws(() => input([sale(5, 2, 1, 31)]));
  assert.equal(commercialInputSchema.safeParse({ ...input(), includeOrders: "false" }).success, false);
});
test("only analytical confirmed deliveries become certified residuals", () => {
  const d: any = { id: 1, ordineId: 1, dataConsegna: "2027-01-01", quantitaConsegnata: 200, appOrigine: "delta_futuro", sourceReference: "advanced-sale:1:order:1:size:TP-3000", advancedSaleId: 1, advancedSaleNumber: "V1", saleSizeCode: "TP-3000" };
  const sales = [{ id: 1, status: "confirmed", saleDate: "2027-01-01", saleNumber: "V1" }];
  const bags = new Map([["1|TP-3000", 200]]);
  assert.deepEqual(verifiedResidual(1000, [d], sales, bags, "2027-01-10"), { quantity: 800, verified: true });
  assert.deepEqual(verifiedResidual(1000, [{ ...d, sourceReference: null }], sales, bags, "2027-01-10"), { quantity: 1000, verified: false });
  assert.equal(verifiedResidual(1000, [d, d], sales, bags, "2027-01-10").quantity, 1000);
  assert.equal(verifiedResidual(1000, [d], [{ ...sales[0], status: "cancelled" }], bags, "2027-01-10").verified, false);
  assert.equal(verifiedResidual(1000, [d], sales, new Map(), "2027-01-10").verified, false);
  assert.throws(() => verifiedResidual(0, [], [], bags, "2027-01-10"), /Quantità/);
});
test("concurrent worker requests are queued without a global 429 and remain isolated", async () => {
  const results = await Promise.all([100, 200, 300, 400].map(q => calculateInWorker(world(), input([sale(q)]))));
  assert.deepEqual(results.map(r => r.totalAccepted), [100, 200, 300, 400]);
});
test("admission bounds pending work globally and per owner and releases idempotently", () => {
  const admit = createAdmission(3, 2);
  const a = admit("one"), b = admit("one");
  assert.throws(() => admit("one"), CommercialBusyError);
  const c = admit("two");
  assert.throws(() => admit("three"), CommercialBusyError);
  a(); a();
  const d = admit("three");
  assert.throws(() => admit("four"), CommercialBusyError);
  b(); c(); d();
  const e = admit("one"); e();
});