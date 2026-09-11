import assert from "node:assert/strict";
import test from "node:test";
import { findProjectedSize } from "./growth-simulation.service";
import { toBusinessIsoDate } from "../utils/size-determination";

const versions = [
  { sizeId: 1, code: "OLD", minAnimalsPerKg: 100, maxAnimalsPerKg: 200, validFrom: "1900-01-01", validTo: "2026-09-09" },
  { sizeId: 2, code: "NEW", minAnimalsPerKg: 100, maxAnimalsPerKg: 200, validFrom: "2026-09-10", validTo: null },
];

test("projected classification uses the range version valid on that day", () => {
  const weightMg = 1_000_000 / 150;
  assert.equal(findProjectedSize(weightMg, new Date("2026-09-09T12:00:00Z"), versions)?.sizeId, 1);
  assert.equal(findProjectedSize(weightMg, new Date("2026-09-10T12:00:00Z"), versions)?.sizeId, 2);
});

test("uses the Italian calendar date at the UTC boundary", () => {
  const italianMidnight = new Date("2026-09-09T22:00:00.000Z");
  assert.equal(toBusinessIsoDate(italianMidnight), "2026-09-10");
  assert.equal(findProjectedSize(1_000_000 / 150, italianMidnight, versions)?.sizeId, 2);
});

test("validTo remains inclusive through the end of the Italian day", () => {
  const beforeItalianMidnight = new Date("2026-09-09T21:59:59.999Z");
  assert.equal(findProjectedSize(1_000_000 / 150, beforeItalianMidnight, versions)?.sizeId, 1);
});