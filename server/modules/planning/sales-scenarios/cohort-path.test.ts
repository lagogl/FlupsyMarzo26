import test from "node:test";
import assert from "node:assert/strict";
import { getHatcheryBiologyDays } from "../hatchery-arrival-policy";
import { monthNumber, monthParts, replay, safeCapacity, type World } from "./engine";
import { buildCohortPath } from "./cohort-path";

const january = monthNumber(2027, 1);
const getSize = () => ({ sizeId: 1 });
const advanceDay = (weightMg: number, survival: number) => ({
  weightMg: weightMg + 10,
  survival: survival * 0.9,
});
const arrivalPath = (snapshotDay: number, entryDay: number) => buildCohortPath({
  entry: january,
  entryDay,
  first: january,
  last: january,
  startDay: snapshotDay,
  initialWeightMg: 100,
  arrivalDate: new Date(2027, 0, 15, 12),
  referenceDate: new Date(2027, 0, snapshotDay, 12),
  getMonth: monthParts,
  getSize,
  getBiologyDays: getHatcheryBiologyDays,
  advanceDay,
});

test("virtual hatchery path records biology after allowed dates, including month end", () => {
  const path = arrivalPath(10, 15)[january]!;
  assert.deepEqual(Object.keys(path.days!).map(Number).slice(0, 2), [15, 16]);
  assert.equal(path.days![15].animalsPerKg, 10_000);
  assert.equal(path.days![15].survival, 1);
  assert.equal(path.days![16].animalsPerKg, 1_000_000 / 110);
  assert.equal(path.days![16].survival, 0.9);
  assert.equal(path.days![31].animalsPerKg, 1_000_000 / 260);
  assert.ok(Math.abs(path.days![31].survival - Math.pow(0.9, 16)) < 1e-12);
});

test("current hatchery path starts on the snapshot after the 15th without replaying past biology", () => {
  const path = arrivalPath(20, 20)[january]!;
  assert.deepEqual(Object.keys(path.days!).map(Number).slice(0, 2), [20, 21]);
  assert.equal(path.days![20].animalsPerKg, 10_000);
  assert.equal(path.days![20].survival, 1);
  assert.equal(path.days![21].animalsPerKg, 1_000_000 / 110);
  assert.equal(path.days![21].survival, 0.9);
});

test("inventory path preserves its pre-biology daily snapshot timing", () => {
  const path = buildCohortPath({
    entry: january,
    first: january,
    last: january,
    startDay: 10,
    initialWeightMg: 100,
    referenceDate: new Date(2027, 0, 10, 12),
    getMonth: monthParts,
    getSize,
    getBiologyDays: getHatcheryBiologyDays,
    advanceDay,
  })[january]!;
  assert.equal(path.days![10].animalsPerKg, 10_000);
  assert.equal(path.days![10].survival, 1);
  assert.equal(path.days![11].animalsPerKg, 1_000_000 / 110);
  assert.equal(path.days![11].survival, 0.9);
});

function multiMonthArrivalWorld(): World {
  const path = buildCohortPath({
    entry: january, entryDay: 15, first: january, last: january + 2,
    startDay: 10, initialWeightMg: 100,
    arrivalDate: new Date(2027, 0, 15),
    referenceDate: new Date(2027, 0, 10),
    getMonth: monthParts, getSize,
    getBiologyDays: getHatcheryBiologyDays, advanceDay,
  });
  return {
    first: january, last: january + 2, startDay: 10,
    cohorts: [{ quantity: 1_000_000, entry: january, entryDay: 15, path }],
    orders: [], sizes: [1],
    maxApk: Object.fromEntries([january, january + 1, january + 2].map(n => [`${n}|1`, 10_000])),
  };
}

test("generated hatchery paths and replay count every biological day across two subsequent months", () => {
  const world = multiMonthArrivalWorld();
  const result = replay(world, []);
  // 16 days in January after entry, all 28 February and all 31 March.
  for (const [n, biologicalDays] of [[january, 16], [january + 1, 44], [january + 2, 75]]) {
    assert.equal(result.months.get(n)!.remainingAnimals, Math.floor(1_000_000 * Math.pow(0.9, biologicalDays)));
  }
  const firstFebruary = replay(world, [], { n: january + 1, day: 1 });
  assert.equal(firstFebruary.dayStock![1], Math.floor(1_000_000 * Math.pow(0.9, 17)));
});

test("first-day orders and protected sales use the survival-limited generated stock", () => {
  const world = multiMonthArrivalWorld();
  const marchFirstCapacity = Math.floor(1_000_000 * Math.pow(0.9, 45));
  world.orders = [{ key: "march-first", at: january + 2, day: 1, sizeId: 1, quantity: marchFirstCapacity + 1 }];
  const result = replay(world, []);
  assert.equal(result.orders["march-first"], marchFirstCapacity);
  assert.equal(result.months.get(january + 2)!.orderShortfall, 1);
  const candidate = {
    id: "arrival-sale", year: 2027, month: 1, day: 15, sizeId: 1,
    quantity: 1_000_000, pricePerThousand: 1, paymentDelayMonths: 0,
  };
  const protectedQuantity = safeCapacity(world, [], candidate, 1_000_000);
  const sold = replay(world, [{ ...candidate, quantity: protectedQuantity }]);
  assert.equal(sold.orders["march-first"], marchFirstCapacity);
  // Only the fractional remainder behind the order's rounded capacity is free.
  assert.ok(protectedQuantity < 120);
});