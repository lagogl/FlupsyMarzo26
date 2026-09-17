import test from "node:test";
import assert from "node:assert/strict";
import {
  aggregateManualAllocationsBySaleSize,
  parseManualOrderReconciliationRequest
} from "./manual-order-reconciliation";

test("normalizza righe ripetute dello stesso ordine e aggrega per vendita e taglia", () => {
  const request = parseManualOrderReconciliationRequest({
    idempotencyKey: "retry-1",
    allocations: [
      { saleId: 1, sizeCode: "L", orderId: 8, quantity: 2 },
      { saleId: 1, sizeCode: "L", orderId: 8, quantity: 3 },
      { saleId: 1, sizeCode: "M", orderId: 8, quantity: 4 }
    ]
  });
  assert.deepEqual(request.allocations, [
    { saleId: 1, sizeCode: "L", orderId: 8, quantity: 5 },
    { saleId: 1, sizeCode: "M", orderId: 8, quantity: 4 }
  ]);
  assert.equal(aggregateManualAllocationsBySaleSize(request.allocations).get("1:L"), 5);
  assert.equal(aggregateManualAllocationsBySaleSize(request.allocations).get("1:M"), 4);
});

test("rifiuta una vendita distribuita su ordini diversi", () => {
  assert.throws(
    () => parseManualOrderReconciliationRequest({
      idempotencyKey: "retry-2",
      allocations: [
        { saleId: 1, sizeCode: "L", orderId: 8, quantity: 5 },
        { saleId: 1, sizeCode: "M", orderId: 9, quantity: 4 }
      ]
    }),
    /un solo ordine/
  );
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