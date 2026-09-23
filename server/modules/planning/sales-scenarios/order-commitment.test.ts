import test from "node:test";
import assert from "node:assert/strict";
import { aggregateOrderCommitments } from "./order-commitment";

const first = 2027 * 12;
const order = (quantity: number, deliveryMonth: number, total: unknown, currency: unknown = "EUR") => ({
  quantity, deliveryMonth, total, currency,
});

test("sums two positive EUR headers in the same month", () => {
  assert.deepEqual(aggregateOrderCommitments([
    order(100, first, "12.50"),
    order(250, first, 8.5),
  ], first), {
    [first]: { animals: 350, valueEuro: 21, valuedAnimals: 350, missingValueAnimals: 0 },
  });
});

test("missing or non-EUR value nulls the whole month without partial value", () => {
  assert.deepEqual(aggregateOrderCommitments([
    order(100, first, 10),
    order(75, first, 20, "USD"),
    order(25, first, null),
  ], first), {
    [first]: { animals: 200, valueEuro: null, valuedAnimals: 100, missingValueAnimals: 100 },
  });
});

test("aggregates months, skips empty orders, and clamps delivery before scenario start", () => {
  assert.deepEqual(aggregateOrderCommitments([
    order(10, first - 3, 5),
    order(20, first + 1, 0),
    order(0, first + 1, 99),
  ], first), {
    [first]: { animals: 10, valueEuro: 5, valuedAnimals: 10, missingValueAnimals: 0 },
    [first + 1]: { animals: 20, valueEuro: null, valuedAnimals: 0, missingValueAnimals: 20 },
  });
});