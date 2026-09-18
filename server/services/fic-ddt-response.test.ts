import test from "node:test";
import assert from "node:assert/strict";
import { getAssignedFicDdtNumber, normalizeFicDdtNumber } from "./fic-ddt-response";

test("legge il numero assegnato e non il sezionale FIC", () => {
  assert.equal(getAssignedFicDdtNumber({ number: 128, numeration: "/ddt" }), "128");
  assert.equal(getAssignedFicDdtNumber({ number: " 129 ", numeration: "/ddt" }), "129");
});

test("rifiuta una risposta FIC priva del numero assegnato", () => {
  assert.throws(
    () => getAssignedFicDdtNumber({ numeration: "/ddt" }),
    /non ha restituito un numero DDT valido/
  );
  assert.throws(() => getAssignedFicDdtNumber({ number: 0 }));
});

test("ignora il vecchio valore errato del sezionale nelle ristampe", () => {
  assert.equal(normalizeFicDdtNumber("/ddt"), null);
  assert.equal(normalizeFicDdtNumber("421"), "421");
});

test("accetta solo interi decimali positivi canonici e sicuri", () => {
  for (const invalid of ["1e2", "0x10", "+12", "12.5", "0012", "9007199254740992"]) {
    assert.equal(normalizeFicDdtNumber(invalid), null);
  }
  assert.equal(normalizeFicDdtNumber(Number.MAX_SAFE_INTEGER + 1), null);
  assert.equal(normalizeFicDdtNumber(421), "421");
});