import test from "node:test";
import assert from "node:assert/strict";
import {
  DDT_NUMBER_CONFLICT_MESSAGE,
  isDdtNumberConflict,
} from "./ddt-number-conflict";

test("riconosce solo il vincolo univoco della numerazione DDT", () => {
  assert.equal(isDdtNumberConflict({
    code: "23505",
    constraint: "ddt_company_year_numero_unique",
  }), true);
  assert.equal(isDdtNumberConflict({
    code: "23505",
    constraint: "another_unique_constraint",
  }), false);
  assert.equal(isDdtNumberConflict({ code: "22001" }), false);
});

test("espone un messaggio sicuro e utilizzabile per un conflitto DDT", () => {
  assert.match(DDT_NUMBER_CONFLICT_MESSAGE, /numero DDT/i);
  assert.doesNotMatch(DDT_NUMBER_CONFLICT_MESSAGE, /SQL|23505|database/i);
});