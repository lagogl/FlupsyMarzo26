import test from "node:test";
import assert from "node:assert/strict";
import {
  chooseDdtReservationNumber,
  buildFicDdtListPath,
  getNextDdtNumber,
  isFicDdtInYear,
  parseFicDdtPage,
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
      const result = pages.get(key) ?? { documents: [] };
      return { ...result, documents: result.documents.map(document => ({ date: `${year}-01-01`, ...document })) };
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

test("il filtro FIC usa l'intervallo date q e richiede soltanto metadata non economici", () => {
  const path = buildFicDdtListPath(2026, 2);
  const url = new URL(path, "https://example.test");
  assert.equal(url.searchParams.get("q"), "date >= '2026-01-01' and date <= '2026-12-31'");
  assert.equal(url.searchParams.get("year"), null);
  assert.equal(url.searchParams.get("page"), "2");
  assert.equal(url.searchParams.get("type"), "delivery_note");
  assert.equal(url.searchParams.get("fields"), "id,number,date,numeration");
  assert.throws(() => buildFicDdtListPath(NaN), /non validi/);
  assert.throws(() => buildFicDdtListPath(2026, 0), /non validi/);
});

test("Ecotapes propone 586 ignorando i DDT 2025 1001-1003 e lo storico inviato 1004", async () => {
  const data = sources(new Map([["1017299:2026:1", {
    documents: [
      { number: 1003, date: "2025-06-19" },
      { number: 1002, date: "2025-04-03" },
      { number: 1001, date: "2025-02-07" },
      { number: 585, date: "2026-09-30" },
      { number: 583, date: "2026-09-26" },
    ], lastPage: 1,
  }]]), new Map([["1017299:2026", [{ number: 1004, status: "inviato" }]]]));
  assert.equal(await getNextDdtNumber(data, 1017299, 2026), 586);
});

test("una pagina di soli DDT di altro anno non tronca la ricerca delle pagine successive", async () => {
  const data = sources(new Map([
    ["10:2026:1", { documents: [{ number: 1003, date: "2025-12-31" }], lastPage: 2 }],
    ["10:2026:2", { documents: [{ number: 585, date: "2026-09-30" }], lastPage: 2 }],
  ]), new Map());
  assert.equal(await getNextDdtNumber(data, 10, 2026), 586);
  assert.equal(data.requests.length, 2);
});

test("un invio pendente protegge il numero anche se lo storico inviato è più alto", async () => {
  const data = sources(new Map([["10:2026:1", { documents: [{ number: 585 }], lastPage: 1 }]]),
    new Map([["10:2026", [{ number: 1004, status: "inviato" }, { number: 586, status: "invio" }]]]));
  const next = await getNextDdtNumber(data, 10, 2026);
  assert.equal(next, 587);
  assert.equal(chooseDdtReservationNumber(next, 586), 587);
});

test("date mancanti o non valide e risposte malformate bloccano il calcolo anziché proporre 1", async () => {
  assert.throws(() => isFicDdtInYear({}, 2026), /Data DDT/);
  assert.throws(() => isFicDdtInYear({ date: "2026-02-30" }, 2026), /Data DDT/);
  assert.equal(isFicDdtInYear({ date: "2025-12-31" }, 2026), false);
  assert.throws(() => parseFicDdtPage({}), /Elenco DDT/);
  assert.throws(() => parseFicDdtPage({ data: [null] }), /Elenco DDT/);
  assert.throws(() => parseFicDdtPage({ data: [], last_page: "bad" }), /Paginazione/);
  await assert.rejects(getNextDdtNumber({
    fetchFicPage: async () => ({ documents: [{ number: 585 }] }),
    getLocalDeliveryNotes: async () => [],
  }, 10, 2026), /Data DDT/);
});

test("la paginazione troncata fallisce senza usare un massimo parziale", async () => {
  const data = {
    fetchFicPage: async () => ({ documents: [{ number: 585, date: "2026-09-30" }], lastPage: 101 }),
    getLocalDeliveryNotes: async () => [],
  };
  await assert.rejects(getNextDdtNumber(data, 10, 2026), /incompleta/);
});

test("decodifica tutte le forme di metadata di paginazione FIC", () => {
  for (const extra of [{ last_page: 3 }, { meta: { pagination: { last_page: 3 } } }, { pagination: { last_page: 3 } }]) {
    assert.equal(parseFicDdtPage({ data: [{ number: 585, date: "2026-09-30" }], ...extra }).lastPage, 3);
  }
});

test("una prima pagina vuota con altre pagine dichiarate non propone falsamente 1", async () => {
  const data = sources(new Map([
    ["10:2026:1", { documents: [], lastPage: 2 }],
    ["10:2026:2", { documents: [{ number: 585 }], lastPage: 2 }],
  ]), new Map());
  await assert.rejects(getNextDdtNumber(data, 10, 2026), /incompleta/);
});

test("una pagina intermedia o finale vuota dichiarata non restituisce un massimo parziale", async () => {
  for (const declaredLast of [2, 3]) {
    const data = sources(new Map([
      ["10:2026:1", { documents: [{ number: 583 }], lastPage: declaredLast }],
      ["10:2026:2", { documents: [], lastPage: declaredLast }],
      ["10:2026:3", { documents: [{ number: 585 }], lastPage: declaredLast }],
    ]), new Map());
    await assert.rejects(getNextDdtNumber(data, 10, 2026), /incompleta/);
  }
});

test("un anno legittimamente vuoto parte da 1 salvo prenotazioni locali pendenti", async () => {
  const empty = new Map([["10:2027:1", { documents: [], lastPage: 1 }]]);
  assert.equal(await getNextDdtNumber(sources(empty, new Map()), 10, 2027), 1);
  assert.equal(await getNextDdtNumber(sources(empty, new Map([
    ["10:2027", [{ number: 1, status: "locale" }]],
  ])), 10, 2027), 2);
});