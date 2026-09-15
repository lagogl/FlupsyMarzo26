import test from "node:test";
import assert from "node:assert/strict";
import { canFulfillOrderWithSize } from "./size-substitution";

const activeSizeOrder = [
  "TP-1140",
  "TP-1260",
  "TP-1500",
  "TP-1800",
  "TP-2000",
  "TP-2500",
  "TP-3000",
];

test("un ordine accetta la taglia esatta", () => {
  assert.equal(canFulfillOrderWithSize("TP-2000", "TP-2000", activeSizeOrder), true);
});

test("un ordine TP-2000 accetta animali fisicamente più grandi", () => {
  assert.equal(canFulfillOrderWithSize("TP-2500", "TP-2000", activeSizeOrder), true);
  assert.equal(canFulfillOrderWithSize("TP-3000", "TP-2000", activeSizeOrder), true);
});

test("un ordine TP-2000 rifiuta animali fisicamente più piccoli", () => {
  assert.equal(canFulfillOrderWithSize("TP-1800", "TP-2000", activeSizeOrder), false);
  assert.equal(canFulfillOrderWithSize("TP-1140", "TP-2000", activeSizeOrder), false);
});

test("una taglia non presente nel catalogo attivo non è sostituibile", () => {
  assert.equal(canFulfillOrderWithSize("TP-9999", "TP-2000", activeSizeOrder), false);
  assert.equal(canFulfillOrderWithSize("TP-2000", "TP-9999", activeSizeOrder), false);
});

test("la regola vale per ogni coppia di taglie del catalogo attivo", () => {
  for (let actualRank = 0; actualRank < activeSizeOrder.length; actualRank++) {
    for (let requiredRank = 0; requiredRank < activeSizeOrder.length; requiredRank++) {
      assert.equal(
        canFulfillOrderWithSize(
          activeSizeOrder[actualRank],
          activeSizeOrder[requiredRank],
          activeSizeOrder,
        ),
        actualRank >= requiredRank,
        `${activeSizeOrder[actualRank]} rispetto a ${activeSizeOrder[requiredRank]}`,
      );
    }
  }
});