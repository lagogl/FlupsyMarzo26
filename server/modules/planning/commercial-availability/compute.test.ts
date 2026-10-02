import test from "node:test";
import assert from "node:assert/strict";
import { commercialInputSchema } from "../../../../shared/commercial-availability";
import { scenarioInputSchema } from "../../../../shared/sales-scenarios";
import { computeCommercial } from "./compute";
import { calculateInWorker } from "./worker-pool";
import { monthNumber, projectWorld, type World } from "../sales-scenarios/engine";
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