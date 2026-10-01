import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PgDialect } from "drizzle-orm/pg-core";
import { getPendingLocalDdtMaximum } from "./ddt-local-numbering";
import { chooseDdtReservationNumber } from "./ddt-numbering-fic";

test("la query del massimo locale vale solo per azienda, anno e prenotazioni pendenti", async () => {
  const dialect = new PgDialect();
  const highest = await getPendingLocalDdtMaximum(async query => {
    const compiled = dialect.sqlToQuery(query);
    assert.deepEqual(compiled.params, [1017299, 2026]);
    assert.match(compiled.sql, /ddt_stato IN \('locale', 'invio'\)/);
    assert.match(compiled.sql, /company_id = \$1/);
    assert.match(compiled.sql, /numbering_year = \$2/);
    return { rows: [{ highest_number: null }] };
  }, 1017299, 2026);
  assert.equal(highest, null);
  assert.equal(chooseDdtReservationNumber(586, highest ?? 0), 586);
});

test("la rilettura sotto lock vede prenotazioni nuove e non il massimo storico inviato", async () => {
  const preview = await getPendingLocalDdtMaximum(async () => ({ rows: [{ highest_number: null }] }), 10, 2026);
  const underLock = await getPendingLocalDdtMaximum(async () => ({ rows: [{ highest_number: 586 }] }), 10, 2026);
  assert.equal(chooseDdtReservationNumber(586, preview ?? 0), 586);
  assert.equal(chooseDdtReservationNumber(586, underLock ?? 0), 587);
});

test("una prenotazione locale corrotta blocca l'assegnazione", async () => {
  await assert.rejects(getPendingLocalDdtMaximum(async () => ({
    rows: [{ highest_number: "invalid" }],
  }), 10, 2026), /non valida/);
});

test("anteprima e transazione di creazione riusano la stessa query pending-only", () => {
  const source = readFileSync(new URL("../controllers/advanced-sales-controller.ts", import.meta.url), "utf8");
  const preview = source.slice(source.indexOf("async function buildSaleNumberingContext"), source.indexOf("export async function getSaleNumberingContext"));
  const generation = source.slice(source.indexOf("const numberingKey = `advanced-ddt:"), source.indexOf("const [createdDdt] = await tx.insert(ddt)"));
  assert.match(preview, /getPendingLocalDdtMaximum\(query => db\.execute\(query\), companyId, year\)/);
  assert.match(generation, /getPendingLocalDdtMaximum\([\s\S]*query => tx\.execute\(query\), companyId, numberingYear/);
  assert.match(generation, /pg_advisory_xact_lock/);
  assert.match(generation, /document\.numero = \$\{requestedNumber\}/);
  assert.doesNotMatch(preview + generation, /MAX\(document\.numero\)/);
  assert.match(source, /buildFicDdtListPath\(ficYear, page\)/);
  assert.match(source, /isFicDdtInYear\(document, ficYear\)/);
});

test("i percorsi DDT da report e prossimo numero multi-azienda condividono filtro e massimo pendente", () => {
  const source = readFileSync(new URL("../controllers/fatture-in-cloud-controller.ts", import.meta.url), "utf8");
  const report = source.slice(source.indexOf("router.post('/ddt'"), source.indexOf("router.get('/next-ddt-numbers'"));
  const next = source.slice(source.indexOf("router.get('/next-ddt-numbers'"), source.indexOf("router.get('/ddt-numeration-analysis'"));
  for (const section of [report, next]) {
    assert.match(section, /getNextDdtNumber\(/);
    assert.match(section, /buildFicDdtListPath\(year, page\)/);
    assert.match(section, /getPendingLocalDdtMaximum\(/);
    assert.doesNotMatch(section, /issued_documents\?type=delivery_note&year=/);
  }
  assert.match(report, /getPendingLocalDdtMaximum\([\s\S]*tx\.execute\(query\)/);
  assert.match(report, /candidateDetail\?\.number/);
  assert.match(next, /!highest \|\| Number\(document.number\) > Number\(highest.number\)/);
});