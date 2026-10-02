import test from "node:test";
import assert from "node:assert/strict";
import { buildFutureOrderQuotas, isActiveFutureOrder, normalizeFutureOrderSize, type QuotaOrder, type QuotaDelivery } from "./future-order-quotas";
import { verifiedResidual } from "./commercial-availability/order-residuals";
import type { consegneCondivise } from "../../schema-esterno";

const order = (changes: Partial<QuotaOrder> = {}): QuotaOrder => ({
  id: 1, stato: "Aperto", cancellato: false, quantita: 100, quantitaTotale: 100,
  tagliaRichiesta: "tp 2000", dataConsegna: null,
  dataInizioConsegna: "2024-01-20", dataFineConsegna: "2024-03-02", ...changes,
});
const delivery = (dataConsegna: string, quantitaConsegnata: number, saleSizeCode = "TP-2000"): QuotaDelivery =>
  ({ dataConsegna, quantitaConsegnata, saleSizeCode });
const calculate = (o: QuotaOrder, date = "2024-01-01", rows: QuotaDelivery[] = []) =>
  buildFutureOrderQuotas([o], date, new Map([[o.id, rows]]));

test("uniform original integer allocation puts remainder in earliest periods and uses leap month ends", () => {
  const result = calculate(order());
  assert.deepEqual(result.quotas.map(q => [q.quantity, q.day, q.precision]), [
    [34, 31, "month"], [33, 29, "month"], [33, 31, "month"],
  ]);
  assert.equal(result.quotas.reduce((sum, q) => sum + q.quantity, 0), 100);
  assert.ok(result.quotas.every(q => q.sizeCode === "TP-2000"));
});

test("history and underdelivery expire without recovery; current monthly quota is never prorated", () => {
  const first = calculate(order(), "2024-01-01");
  const mid = calculate(order(), "2024-02-20");
  assert.deepEqual(mid.quotas.map(q => q.quantity), [33, 33]);
  assert.equal(mid.quotas[0].key, first.quotas[1].key);
  assert.deepEqual(calculate(order(), "2024-02-29").quotas.map(q => q.quantity), [33, 33]);
  assert.deepEqual(calculate(order(), "2024-03-01").quotas.map(q => q.quantity), [33]);
  assert.deepEqual(calculate(order(), "2024-04-01").quotas, []);
  const delivered = calculate(order(), "2024-02-20", [delivery("2024-01-21", 10)]);
  assert.deepEqual(delivered.quotas.map(q => q.quantity), [33, 33]);
});

test("monthly allocation spans years and nonleap February; tiny totals still conserve integers", () => {
  const result = calculate(order({
    quantita: 2, quantitaTotale: 2,
    dataInizioConsegna: "2024-12-31", dataFineConsegna: "2025-02-01",
  }), "2024-12-01");
  assert.deepEqual(result.quotas.map(q => [q.year, q.month, q.day, q.quantity]),
    [[2024, 12, 31, 1], [2025, 1, 31, 1], [2025, 2, 28, 0]]);
});

test("legacy-only and identical dates are exact deadlines: today retained, yesterday excluded", () => {
  for (const o of [
    order({ dataConsegna: "2024-02-20", dataInizioConsegna: null, dataFineConsegna: null }),
    order({ dataInizioConsegna: "2024-02-20", dataFineConsegna: "2024-02-20", dataConsegna: "2025-12-31" }),
  ]) {
    assert.equal(calculate(o, "2024-02-20").quotas[0].precision, "day");
    assert.equal(calculate(o, "2024-02-20").quotas[0].day, 20);
    assert.deepEqual(calculate(o, "2024-02-21").quotas, []);
  }
});

test("range authority wins over legacy; distinct days in one month have a monthly deadline", () => {
  const o = order({ dataInizioConsegna: "2024-02-10", dataFineConsegna: "2024-02-12", dataConsegna: "2025-01-01" });
  assert.deepEqual(calculate(o, "2024-02-20").quotas.map(q => [q.month, q.day, q.quantity, q.precision]),
    [[2, 29, 100, "month"]]);
  const partial = order({ dataInizioConsegna: "2024-02-12", dataFineConsegna: null, dataConsegna: "2025-01-01" });
  assert.deepEqual(calculate(partial, "2024-02-13").quotas, []);
});

test("deliveries reduce only the pertinent monthly quota, never future periods", () => {
  const result = calculate(order(), "2024-02-20", [
    delivery("2024-01-25", 20), delivery("2024-02-15", 10), delivery("2024-02-19", 5),
  ]);
  assert.deepEqual(result.quotas.map(q => q.quantity), [18, 33]);
  assert.deepEqual(result.warnings, []);
});

test("off-period, wrong-size, invalid-date and future deliveries retain gross with explicit warnings", () => {
  for (const row of [
    delivery("2023-12-25", 10), delivery("2024-02-15", 10, "TP-3000"),
    delivery("2024-02-30", 10), delivery("2024-02-21", 10),
  ]) {
    const result = calculate(order(), "2024-02-20", [delivery("2024-02-15", 5), row]);
    assert.deepEqual(result.quotas.map(q => q.quantity), [33, 33]);
    assert.match(result.warnings.join(" "), /ambigue/);
  }
});

test("period overdelivery retains that gross quota and never spills into another month", () => {
  const result = calculate(order(), "2024-02-20", [delivery("2024-02-15", 40)]);
  assert.deepEqual(result.quotas.map(q => q.quantity), [33, 33]);
  assert.match(result.warnings.join(" "), /superiori alla quota/);
  const expiredOverflow = calculate(order(), "2024-02-20", [delivery("2024-01-25", 40), delivery("2024-02-15", 5)]);
  assert.deepEqual(expiredOverflow.quotas.map(q => q.quantity), [28, 33]);
  assert.equal(expiredOverflow.warnings.length, 1);
});

test("single exact quota accepts certified advance deliveries, never deliveries after its deadline", () => {
  const o = order({ dataInizioConsegna: "2024-02-20", dataFineConsegna: "2024-02-20" });
  assert.equal(calculate(o, "2024-02-20", [delivery("2024-02-20", 20)]).quotas[0].quantity, 80);
  const advance = calculate(o, "2024-02-19", [delivery("2024-02-18", 20)]);
  assert.equal(advance.quotas[0].quantity, 80);
  assert.deepEqual(advance.warnings, []);
  const ambiguous = calculate(o, "2024-02-20", [delivery("2024-02-21", 20)]);
  assert.equal(ambiguous.quotas[0].quantity, 100);
  assert.equal(ambiguous.warnings.length, 1);
  const late = calculate(o, "2024-02-22", [delivery("2024-02-21", 20)]);
  assert.deepEqual(late.quotas, []);
  assert.equal(late.warnings.length, 1);
  const notYetDelivered = calculate(o, "2024-02-18", [delivery("2024-02-19", 20)]);
  assert.equal(notYetDelivered.quotas[0].quantity, 100);
  assert.equal(notYetDelivered.warnings.length, 1);
});

test("shared active predicate excludes only explicit completed/cancelled, retaining NULL", () => {
  assert.equal(isActiveFutureOrder({ stato: null, cancellato: null }), true);
  assert.equal(isActiveFutureOrder({ stato: "Parziale", cancellato: false }), true);
  for (const stato of ["Completato", "Annullato", "COMPLETED", " cancelled "]) {
    assert.equal(calculate(order({ stato })).quotas.length, 0);
  }
  assert.equal(calculate(order({ cancellato: true })).quotas.length, 0);
});

test("missing size, dates, invalid dates and inconsistent quantities fail explicitly, even if expired", () => {
  for (const changes of [
    { tagliaRichiesta: " " },
    { dataInizioConsegna: null, dataFineConsegna: null, dataConsegna: null },
    { dataInizioConsegna: "2024-02-30" },
    { dataFineConsegna: "2024-01-01" },
    { quantitaTotale: 99 },
  ]) assert.throws(() => calculate(order(changes), "2026-01-01"));
  assert.throws(() => calculate(order(), "2024-02-30"), /Data quota/);
  assert.equal(normalizeFutureOrderSize(" tp-3000 "), "TP-3000");
  assert.equal(normalizeFutureOrderSize("2000 animali/kg"), "TP-2000");
});

test("canonical sale/bag proof still rejects external, cancelled, duplicate and overallocated sources", () => {
  const row = {
    id: 1, ordineId: 1, dataConsegna: "2024-02-15", quantitaConsegnata: 20,
    appOrigine: "delta_futuro", advancedSaleId: 9, advancedSaleNumber: "V-9",
    saleSizeCode: "TP-2000", sourceReference: "advanced-sale:9:order:1:size:TP-2000",
    ddtId: null, note: null, createdAt: new Date(),
  } satisfies typeof consegneCondivise.$inferSelect;
  const sale = { id: 9, status: "confirmed", saleDate: row.dataConsegna, saleNumber: "V-9" };
  const bags = new Map([["9|TP-2000", 20]]);
  assert.deepEqual(verifiedResidual(100, [row], [sale], bags, "2024-02-20"), { quantity: 80, verified: true });
  for (const changed of [
    { ...row, appOrigine: "app_esterna" }, { ...row, sourceReference: null },
    { ...row, advancedSaleNumber: "wrong" }, { ...row, quantitaConsegnata: 21 },
  ]) assert.equal(verifiedResidual(100, [changed], [sale], bags, "2024-02-20").verified, false);
  assert.equal(verifiedResidual(100, [row, row], [sale], bags, "2024-02-20").verified, false);
  assert.equal(verifiedResidual(100, [row], [{ ...sale, cancelledAt: new Date() }], bags, "2024-02-20").verified, false);
  assert.equal(verifiedResidual(100, [row], [sale], new Map([["9|TP-2000", 0]]), "2024-02-20").verified, false);
  assert.throws(() => verifiedResidual(10, [row], [sale], bags, "2024-02-20"), /Consegne superiori/);
});