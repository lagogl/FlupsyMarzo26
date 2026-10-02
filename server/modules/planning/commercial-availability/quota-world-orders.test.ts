import test from "node:test";
import assert from "node:assert/strict";
import { quotaWorldOrders } from "./quota-world-orders";
import { monthNumber } from "../sales-scenarios/engine";

test("quota commitments preserve monthly identity, hidden sizes and future deadlines", () => {
  const first = monthNumber(2026, 10);
  const quotas = [
    { key: "1:2026-10", orderId: 1, sizeCode: "TP-3000", year: 2026, month: 10, day: 31, quantity: 700000, precision: "month" as const },
    { key: "1:2026-11", orderId: 1, sizeCode: "TP-3000", year: 2026, month: 11, day: 30, quantity: 1000000, precision: "month" as const },
    { key: "2:2027-01-12", orderId: 2, sizeCode: "TP-3500", year: 2027, month: 1, day: 12, quantity: 100, precision: "day" as const },
  ];
  const mapped = quotaWorldOrders(quotas, [{ id: 17, code: "TP-3000" }, { id: 18, code: "TP-3500" }], first);
  assert.equal(mapped.length, 3);
  assert.equal(mapped[0].day, 31);
  assert.equal(mapped[1].at, first + 1);
  assert.equal(mapped[2].sizeId, 18);
  assert.equal(mapped.reduce((sum, q) => sum + q.quantity, 0), 1700100);
  assert.throws(() => quotaWorldOrders([...quotas, quotas[0]], [{ id: 17, code: "TP-3000" }, { id: 18, code: "TP-3500" }], first), /duplicata/);
  assert.throws(() => quotaWorldOrders(quotas, [], first), /taglia non riconosciuta/);
});