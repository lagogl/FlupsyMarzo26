import test from "node:test";
import assert from "node:assert/strict";
import {
  aggregateManualAllocationsBySaleSize,
  parseManualOrderReconciliationRequest
} from "./manual-order-reconciliation";

test("normalizza split ripetuti e aggrega per vendita e taglia", () => {
  const request = parseManualOrderReconciliationRequest({
    idempotencyKey: "retry-1",
    allocations: [
      { saleId: 1, sizeCode: "L", orderId: 8, quantity: 2 },
      { saleId: 1, sizeCode: "L", orderId: 8, quantity: 3 },
      { saleId: 1, sizeCode: "L", orderId: 9, quantity: 4 }
    ]
  });
  assert.deepEqual(request.allocations, [
    { saleId: 1, sizeCode: "L", orderId: 8, quantity: 5 },
    { saleId: 1, sizeCode: "L", orderId: 9, quantity: 4 }
  ]);
  assert.equal(aggregateManualAllocationsBySaleSize(request.allocations).get("1:L"), 9);
});

test("rifiuta quantità non intere, identificativi non positivi e batch oltre limite", () => {
  assert.throws(() => parseManualOrderReconciliationRequest({
    idempotencyKey: "x", allocations: [{ saleId: 0, sizeCode: "L", orderId: 1, quantity: 1 }]
  }));
  assert.throws(() => parseManualOrderReconciliationRequest({
    idempotencyKey: "x", allocations: [{ saleId: 1, sizeCode: "L", orderId: 1, quantity: 1.5 }]
  }));
  assert.throws(() => parseManualOrderReconciliationRequest({
    idempotencyKey: "x", allocations: Array.from({ length: 501 }, () => (
      { saleId: 1, sizeCode: "L", orderId: 1, quantity: 1 }
    ))
  }));
});