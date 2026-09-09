import test from "node:test";
import assert from "node:assert/strict";
import {
  getNextDdtNumber,
  type DdtNumberingSources,
  type FicDeliveryNotePage
} from "./ddt-numbering-fic";

function sources(
  pages: Map<string, FicDeliveryNotePage>,
  localDocuments: Map<string, Array<{ number: number; status: string }>>
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