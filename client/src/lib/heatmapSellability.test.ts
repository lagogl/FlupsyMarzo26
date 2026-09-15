import test from "node:test";
import assert from "node:assert/strict";
import {
  ActiveSizeRange,
  getActiveSellableMax,
  isActiveSellableSize,
} from "./heatmapSellability";

const activeSizes: ActiveSizeRange[] = [
  { code: "TP-2500", minAnimalsPerKg: 31_778, maxAnimalsPerKg: 40_000 },
  { code: "TP-3000", minAnimalsPerKg: 19_001, maxAnimalsPerKg: 31_777 },
  { code: "TP-5000", minAnimalsPerKg: 12_001, maxAnimalsPerKg: 19_000 },
  { code: "TP-10000", minAnimalsPerKg: 1, maxAnimalsPerKg: 12_000 },
];

const tp3000 = activeSizes.find((size) => size.code === "TP-3000");
assert.ok(tp3000?.maxAnimalsPerKg != null);
const tp3000Limit = Number(tp3000.maxAnimalsPerKg);

test("considera vendibile TP-3000 usando il limite del suo range attivo", () => {
  assert.equal(isActiveSellableSize(tp3000Limit, activeSizes), true);
});


test("considera vendibili le taglie con animali più grandi di TP-3000", () => {
  assert.equal(isActiveSellableSize(tp3000Limit - 1, activeSizes), true);
  assert.equal(isActiveSellableSize(12_000, activeSizes), true);
});

test("non considera vendibili TP-2500 e le taglie con animali più piccoli", () => {
  assert.equal(isActiveSellableSize(tp3000Limit + 1, activeSizes), false);
  assert.equal(isActiveSellableSize(40_000, activeSizes), false);
});

test("segue una modifica del limite attivo TP-3000 senza soglie numeriche fisse", () => {
  const changedSizes: ActiveSizeRange[] = [
    { code: "TP-2500", minAnimalsPerKg: 28_001, maxAnimalsPerKg: 40_000 },
    { code: "TP-3000", minAnimalsPerKg: 18_001, maxAnimalsPerKg: 28_000 },
    { code: "TP-5000", minAnimalsPerKg: 1, maxAnimalsPerKg: 18_000 },
  ];

  assert.equal(getActiveSellableMax(changedSizes), 28_000);
  assert.equal(isActiveSellableSize(28_000, changedSizes), true);
  assert.equal(isActiveSellableSize(28_001, changedSizes), false);
});

test("fallisce in modo chiuso se il range TP-3000 non è attivo", () => {
  const sizesWithoutBoundary = activeSizes.filter((size) => size.code !== "TP-3000");
  assert.equal(getActiveSellableMax(sizesWithoutBoundary), null);
  assert.equal(isActiveSellableSize(12_000, sizesWithoutBoundary), false);
});