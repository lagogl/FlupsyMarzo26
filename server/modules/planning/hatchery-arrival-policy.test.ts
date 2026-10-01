import test from "node:test";
import assert from "node:assert/strict";
import { getHatcheryBiologyDays, resolveHatcheryArrivalPlans } from "./hatchery-arrival-policy";
import { formatProjectionBusinessDate } from "./growth-projection/growth-projection-simulation";

const date = (year: number, month: number, day: number) => new Date(year, month - 1, day);
const forecast = (year: number, month: number, quantity = 100, actualQuantity: number | null = null) =>
  ({ year, month, quantity, actualQuantity });

test("monthly forecasts aggregate before subtracting original arrived lots once", () => {
  const plans = resolveHatcheryArrivalPlans(
    [forecast(2026, 10, 70, 90), forecast(2026, 10, 30, 50)],
    [{ year: 2026, month: 10, total: 35, lotCount: 2 }],
    date(2026, 10, 10),
  );
  assert.equal(plans.length, 1);
  assert.equal(plans[0].quantity, 65);
  assert.equal(formatProjectionBusinessDate(plans[0].arrivalDate), "2026-10-15");
});

test("live zero overrides manual actual; excess actual and absent forecast yield no added animals", () => {
  assert.equal(resolveHatcheryArrivalPlans([forecast(2026, 10, 100, 90)],
    [{ year: 2026, month: 10, total: 0, lotCount: 1 }], date(2026, 10, 20))[0].quantity, 100);
  assert.equal(resolveHatcheryArrivalPlans([forecast(2026, 10)],
    [{ year: 2026, month: 10, total: 120, lotCount: 1 }], date(2026, 10, 20))[0].quantity, 0);
  assert.deepEqual(resolveHatcheryArrivalPlans([], [], date(2026, 10, 20)), []);
  assert.equal(resolveHatcheryArrivalPlans([forecast(2026, 10, 0)],
    [], date(2026, 10, 20))[0].quantity, 0);
});

test("manual actual is only a fallback; historical months are not reinserted across year change", () => {
  const plans = resolveHatcheryArrivalPlans(
    [forecast(2026, 11), forecast(2026, 12, 100, 30), forecast(2027, 1, 100, 80)],
    [], date(2026, 12, 20),
  );
  assert.deepEqual(plans.map(p => p.quantity), [0, 70, 100]);
  assert.equal(formatProjectionBusinessDate(plans[2].arrivalDate), "2027-01-15");
});

test("before/on/after day 15 growth and mortality never reconstruct earlier days", () => {
  const month = { year: 2026, month: 10 };
  const arrival = date(2026, 10, 15);
  for (const snapshot of [10, 15, 20]) {
    const days = getHatcheryBiologyDays(month, date(2026, 10, snapshot), arrival);
    assert.equal(days[0].getDate(), Math.max(snapshot, 15) + 1);
    assert.equal(days.length, 31 - Math.max(snapshot, 15));
  }
  assert.equal(getHatcheryBiologyDays({ year: 2027, month: 1 }, date(2026, 12, 20), date(2027, 1, 15)).length, 16);
  assert.equal(getHatcheryBiologyDays({ year: 2026, month: 9 }, date(2026, 10, 10), date(2026, 9, 15)).length, 0);
});