import assert from "node:assert/strict";
import test from "node:test";
import { canContinueToFicAfterFCloudDateError } from "./fcloud-ddt-service";

const dateOrderError = new Error(
  'FCloud DDT create error 400: {"message":"La data DDT (2026-09-18) non può essere anteriore all’ultimo DDT emesso (2026-09-21)."}'
);

test("consente FIC quando FCloud rifiuta la data e il numero era già anteriore", () => {
  assert.equal(canContinueToFicAfterFCloudDateError({
    error: dateOrderError,
    reservedNumber: 326,
    latestReservedNumber: 327
  }), true);
});

test("non applica la deroga all'ultimo numero prenotato", () => {
  assert.equal(canContinueToFicAfterFCloudDateError({
    error: dateOrderError,
    reservedNumber: 327,
    latestReservedNumber: 327
  }), false);
});

test("non applica la deroga ad altri errori FCloud", () => {
  assert.equal(canContinueToFicAfterFCloudDateError({
    error: new Error("FCloud DDT create error 400: cliente non valido"),
    reservedNumber: 326,
    latestReservedNumber: 327
  }), false);
});