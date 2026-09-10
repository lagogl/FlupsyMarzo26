import assert from "node:assert/strict";
import test from "node:test";
import {
  findSizeInRanges,
  type SizeRangeCandidate,
} from "./size-determination";

const ranges: SizeRangeCandidate[] = [
  { sizeId: 1, code: "A", minAnimalsPerKg: 1, maxAnimalsPerKg: 100 },
  { sizeId: 2, code: "B", minAnimalsPerKg: 101, maxAnimalsPerKg: 200 },
  { sizeId: 3, code: "C", minAnimalsPerKg: 250, maxAnimalsPerKg: 300 },
];

test("includes both range boundaries", () => {
  assert.equal(findSizeInRanges(1, ranges)?.sizeId, 1);
  assert.equal(findSizeInRanges(100, ranges)?.sizeId, 1);
  assert.equal(findSizeInRanges(101, ranges)?.sizeId, 2);
  assert.equal(findSizeInRanges(300, ranges)?.sizeId, 3);
});

test("returns null outside the configured scale", () => {
  assert.equal(findSizeInRanges(0, ranges), null);
  assert.equal(findSizeInRanges(301, ranges), null);
});

test("uses the nearest boundary only for an internal gap", () => {
  assert.equal(findSizeInRanges(220, ranges)?.sizeId, 2);
  assert.equal(findSizeInRanges(240, ranges)?.sizeId, 3);
});

test("does not depend on input ordering", () => {
  assert.equal(findSizeInRanges(150, [...ranges].reverse())?.sizeId, 2);
});