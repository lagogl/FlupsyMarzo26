import test from "node:test";
import assert from "node:assert/strict";
import {
  chooseDdtReservationNumber,
  getNextDdtNumber,
  type DdtNumberingSources,
  type FicDeliveryNotePage
} from "./ddt-numbering-fic";

function sources(
  pages: Map<string, FicDeliveryNotePage>,
  localDocuments: Map<string, Array<{
    number: number;
    status: string;
    legacyNumberException?: boolean;
  }>>
): DdtNumberingSources & { requests: string[] } {
  const requests: string[] = [];
  return {
    requests,
    async fetchFicPage(companyId, year, page) {
      const key = `${companyId}:${year}:${page}`;
      requests.push(key);
      return pages.get(key) ?? { documents: [] };
    },
    async getLocalDeliveryNotes(companyId, year) {
      return localDocuments.get(`${companyId}:${year}`) ?? [];
    }
  };
}

test("usa il massimo number FIC ignorando numeration e uno storico locale più basso", async () => {
  const data = sources(new Map([
    ["10:2026:1", {
      documents: [
        { number: 312, numeration: "/A" } as { number: number },
        { number: 24, numeration: "/DDT" } as { number: number }
      ],
      lastPage: 1
    }]
  ]), new Map([["10:2026", [{ number: 24, status: "inviato" }]]]));

  assert.equal(await getNextDdtNumber(data, 10, 2026), 313);
});

test("una prenotazione locale pendente più alta avanza il progressivo", async () => {
  const data = sources(
    new Map([["10:2026:1", { documents: [{ number: 312 }], lastPage: 1 }]]),
    new Map([["10:2026", [{ number: 314, status: "locale" }]]])
  );

  assert.equal(await getNextDdtNumber(data, 10, 2026), 315);
});

test("esclude dal progressivo solo la prenotazione locale coperta da prova storica verificata", async () => {
  const data = sources(
    new Map([["10:2026:1", { documents: [{ number: 326 }], lastPage: 1 }]]),
    new Map([["10:2026", [
      { number: 327, status: "locale", legacyNumberException: true },
      { number: 328, status: "locale" },
    ]]])
  );

  assert.equal(await getNextDdtNumber(data, 10, 2026), 329);

  const onlyVerifiedExceptions = sources(
    new Map([["10:2026:1", { documents: [{ number: 326 }], lastPage: 1 }]]),
    new Map([["10:2026", [
      { number: 999, status: "locale", legacyNumberException: true },
      { number: 328, status: "inviato", legacyNumberException: true },
    ]]])
  );
  assert.equal(await getNextDdtNumber(onlyVerifiedExceptions, 10, 2026), 327);
});

test("documenti storici con numero basso non spostano il prossimo numero FIC", async () => {
  const data = sources(
    new Map([["10:2026:1", { documents: [{ number: 316 }], lastPage: 1 }]]),
    new Map([["10:2026", [
      { number: 14, status: "locale" },
      { number: 14, status: "invio" },
    ]]])
  );

  assert.equal(await getNextDdtNumber(data, 10, 2026), 317);
});

test("un DDT locale già inviato con numero più alto non altera il progressivo FIC", async () => {
  const data = sources(
    new Map([["10:2026:1", { documents: [{ number: 312 }], lastPage: 1 }]]),
    new Map([["10:2026", [{ number: 999, status: "inviato" }]]])
  );

  assert.equal(await getNextDdtNumber(data, 10, 2026), 313);
});

test("aziende e anni diversi interrogano sequenze indipendenti", async () => {
  const data = sources(new Map([
    ["10:2026:1", { documents: [{ number: 312 }], lastPage: 1 }],
    ["20:2026:1", { documents: [{ number: 40 }], lastPage: 1 }],
    ["10:2027:1", { documents: [{ number: 7 }], lastPage: 1 }]
  ]), new Map());

  assert.equal(await getNextDdtNumber(data, 10, 2026), 313);
  assert.equal(await getNextDdtNumber(data, 20, 2026), 41);
  assert.equal(await getNextDdtNumber(data, 10, 2027), 8);
  assert.deepEqual(data.requests, ["10:2026:1", "20:2026:1", "10:2027:1"]);
});

test("legge tutte le pagine FIC prima di scegliere il massimo", async () => {
  const data = sources(new Map([
    ["10:2026:1", { documents: [{ number: 120 }], lastPage: 3 }],
    ["10:2026:2", { documents: [{ number: 312 }], lastPage: 3 }],
    ["10:2026:3", { documents: [{ number: 280 }], lastPage: 3 }]
  ]), new Map());

  assert.equal(await getNextDdtNumber(data, 10, 2026), 313);
  assert.deepEqual(data.requests, ["10:2026:1", "10:2026:2", "10:2026:3"]);
});

test("DDT automatico segue il massimo FIC e locale, quello scelto può usare solo un numero libero", () => {
  assert.equal(chooseDdtReservationNumber(326, 327), 328);
  assert.equal(chooseDdtReservationNumber(328, 327, 330), 330);
  assert.equal(chooseDdtReservationNumber(328, 327, 325), 325);
  assert.throws(() => chooseDdtReservationNumber(328, 327, 326, true), /già presente/);
  assert.throws(() => chooseDdtReservationNumber(328, 327, 327, false, true), /prenotato/);
});

test("la doppia numerazione storica non autorizza altri duplicati locali o FIC", () => {
  // Il chiamante marca come occupato soltanto un record locale non eccezionato.
  assert.equal(chooseDdtReservationNumber(327, 326, 327, false, false), 327);
  assert.throws(() => chooseDdtReservationNumber(327, 326, 327, false, true), /prenotato/);
  assert.throws(() => chooseDdtReservationNumber(327, 326, 327, true, false), /Fatture in Cloud/);
});