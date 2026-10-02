import { test } from "node:test";
import assert from "node:assert/strict";
import { dateForMonth, frozenDraftNotice, inputMonths, responseMatchesDraft, setVisibleSize } from "./commercial-availability-format";
import { assertExportableSummary, frozenSizeLabel, summaryLines } from "./commercial-availability-export";
import type { CommercialInput, FrozenCommercialSummary } from "../../../shared/commercial-availability";

const input: CommercialInput = {
  name: "Primavera laguna", startYear: 2026, startMonth: 11, horizon: 6,
  selectedSizeIds: [2, 3], includeOrders: true, includeHatchery: false,
  growthFactor: 1, mortalityMultiplier: 1,
  sales: [{ id: "vendita-aprile", year: 2027, month: 4, day: 23, sizeId: 3, quantity: 871240 }],
  hatcheryOverrides: [{ year: 2026, month: 12, quantity: 0 }],
};
test("nascondere una taglia conserva vendite e arrivi anche a quantità zero", () => {
  const hidden = setVisibleSize(input, 3, false);
  assert.deepEqual(hidden.selectedSizeIds, [2]);
  assert.equal(hidden.sales, input.sales);
  assert.equal(hidden.sales[0].quantity, 871240);
  assert.equal(hidden.hatcheryOverrides, input.hatcheryOverrides);
  assert.equal(hidden.hatcheryOverrides[0].quantity, 0);
});
test("ritrovare una taglia non duplica né modifica il piano", () => {
  const visible = setVisibleSize(setVisibleSize(input, 3, false), 3, true);
  assert.deepEqual(visible.sales, input.sales);
  assert.deepEqual(setVisibleSize(visible, 3, true).selectedSizeIds, [2, 3]);
});
test("orizzonte attraversa l'anno senza anticipare le date di raggiungimento", () => {
  const months = inputMonths(input);
  assert.equal(months.length, 6);
  assert.deepEqual(months[2], { year: 2027, month: 1 });
  assert.deepEqual(months[5], { year: 2027, month: 4 });
  assert.equal(dateForMonth(months[5], 23), "2027-04-23");
});
test("risposte tardive della bozza precedente sono scartate", () => {
  assert.equal(responseMatchesDraft(4, 4, 10, 11), false);
});
test("risposte di un calcolo sorpassato non sostituiscono l'ultimo", () => {
  assert.equal(responseMatchesDraft(4, 5, 11, 11), false);
});
test("solo l'ultima richiesta della stessa revisione è accettata", () => {
  assert.equal(responseMatchesDraft(5, 5, 11, 11), true);
  assert.equal(responseMatchesDraft(5, 6, 11, 12), false);
});
function frozen(): FrozenCommercialSummary {
  return {
    id: 17, ownerId: "operatore-laguna", name: input.name, createdAt: new Date("2026-11-09T13:40:00Z"),
    snapshot: {
      ...{ sizes: [{ id: 3, code: "TP-3000", name: "Commerciale storico" }] },
      input: structuredClone(input), inputHash: "server-hash", referenceDate: "2026-11-09",
      generatedAt: "2026-11-09T13:39:58Z", availabilityIsAlternative: true, valid: true,
      months: [], baselineMonths: [], baselineOrderShortfall: 413, orderShortfall: 413,
      plan: [{ ...input.sales[0], day: 23, date: "2027-04-23", acceptedQuantity: 871240, shortfall: 0 }],
      totalRequested: 871240, totalAccepted: 871240, hatcheryDependent: false,
      warnings: ["Consegne non riconciliabili: dati non disponibili."], calculationMs: 2143,
    },
  };
}
test("riepilogo congelato resta identico dopo modifiche alla bozza live", () => {
  const summary = frozen();
  const before = summaryLines(summary);
  const live = structuredClone(summary.snapshot.input);
  live.sales[0].quantity = 123;
  live.includeOrders = false;
  assert.deepEqual(summaryLines(summary), before);
  assert.ok(before.some(line => line.includes("871.240")));
  assert.ok(before.some(line => line.includes("Consegne non riconciliabili")));
});
test("esportazione dichiara sempre lo scenario senza vincolo ordini", () => {
  const summary = frozen();
  summary.snapshot.input.includeOrders = false;
  assert.ok(summaryLines(summary).some(line => line.includes("Scenario senza vincolo ordini")));
});
test("piano irrealizzabile non è esportabile come riepilogo valido", () => {
  const summary = frozen();
  summary.snapshot.valid = false;
  assert.throws(() => assertExportableSummary(summary), /congiuntamente valido/);
  summary.snapshot.valid = true;
  summary.snapshot.plan[0].shortfall = 1;
  assert.throws(() => assertExportableSummary(summary), /congiuntamente valido/);
});
test("riepilogo esporta le vendite nascoste, non soltanto le taglie visibili", () => {
  const summary = frozen();
  summary.snapshot.input.selectedSizeIds = [2];
  const lines = summaryLines(summary);
  assert.ok(lines.some(line => line.includes("TP-3000") && line.includes("871.240")));
});
test("le etichette congelate non dipendono da successive modifiche del catalogo live", () => {
  const summary = frozen();
  const liveSizes = [{ id: 3, code: "TP-4000", name: "Catalogo aggiornato" }];
  assert.equal(frozenSizeLabel(summary.snapshot, 3), "TP-3000");
  liveSizes[0].code = "TP-9000";
  assert.ok(summaryLines(summary).some(line => line.includes("TP-3000")));
  assert.ok(!summaryLines(summary).some(line => line.includes("TP-9000")));
});
test("taglie senza etichetta storica sono segnalate, mai sostituite con il catalogo live", () => {
  const summary = frozen();
  assert.equal(frozenSizeLabel(summary.snapshot, 99), "Taglia ID 99 (catalogo storico non disponibile)");
  Reflect.deleteProperty(summary.snapshot, "sizes");
  assert.equal(frozenSizeLabel(summary.snapshot, 3), "Taglia ID 3 (catalogo storico non disponibile)");
});
test("congelamento tardivo è classificato come record storico, non verifica della nuova bozza", () => {
  assert.equal(frozenDraftNotice(7, 7), "");
  const warning = frozenDraftNotice(7, 8);
  assert.match(warning, /riepilogo storico/);
  assert.match(warning, /non verifica né aggiorna la bozza corrente/);
});