import test from "node:test";
import assert from "node:assert/strict";
import { buildBillingEvidence, matchInvoiceToDeliveryNote, sanitizeFicInvoice } from "./fic-billing-status";

const ddt = { ficId: 456, number: 25, date: "2026-09-08", customerFicId: 99 };

test("considera fatturata solo una relazione FIC strutturata con il DDT", () => {
  const invoice = {
    id: 900,
    number: 87,
    numeration: "/2026",
    date: "2026-09-10",
    original_document: { id: 456, type: "delivery_note" },
    items_list: [{ qty: 600000, net_price: 0.15 }, { qty: 400000, gross_price: 0.2 }],
    amount_net: 999999,
    entity: { id: 99 }
  };
  assert.equal(matchInvoiceToDeliveryNote(invoice, ddt), "certain");
  const sanitized = sanitizeFicInvoice(invoice);
  const evidence = buildBillingEvidence([sanitized], ddt, "2026-09-10T12:00:00.000Z");
  assert.deepEqual(evidence, {
    status: "invoiced",
    invoiceId: 900,
    invoiceNumber: "87/2026",
    invoiceDate: "2026-09-10",
    invoicedQuantity: null,
    checkedAt: "2026-09-10T12:00:00.000Z"
  });
  assert.equal(JSON.stringify(evidence).includes("price"), false);
  assert.equal(JSON.stringify(evidence).includes("amount"), false);
  assert.equal(JSON.stringify(sanitized).includes("net_price"), false);
  assert.equal(JSON.stringify(sanitized).includes("gross_price"), false);
  assert.equal(JSON.stringify(sanitized).includes("amount_net"), false);
  assert.equal(JSON.stringify(sanitized).includes("999999"), false);
});

test("un riferimento testuale al DDT non viene trattenuto né associato", () => {
  const invoice = {
    id: 901,
    number: 88,
    date: "2026-09-11",
    entity: { id: 99 },
    visible_subject: "Fatturazione DDT n. 25"
  };
  const sanitized = sanitizeFicInvoice(invoice);
  assert.equal(JSON.stringify(sanitized).includes("Fatturazione"), false);
  assert.equal(matchInvoiceToDeliveryNote(sanitized, ddt), "none");
  assert.equal(buildBillingEvidence([sanitized], ddt, "2026-09-11T12:00:00.000Z").status, "delivery_note_only");
});

test("una fattura dello stesso cliente senza riferimento non viene associata", () => {
  const invoice = { id: 902, number: 89, date: "2026-09-11", entity: { id: 99 } };
  assert.equal(matchInvoiceToDeliveryNote(invoice, ddt), "none");
  assert.equal(buildBillingEvidence([invoice], ddt, "2026-09-11T12:00:00.000Z").status, "delivery_note_only");
});

test("numero e data del documento originale non bastano per dichiarare fatturato", () => {
  const invoice = {
    id: 903,
    number: 90,
    date: "2026-09-12",
    entity: { id: 99 },
    ei_data: { od_number: "25", od_date: "2026-09-08" }
  };
  assert.equal(matchInvoiceToDeliveryNote(invoice, ddt), "ambiguous");
});

test("un original_document di tipo diverso dal DDT non è una prova certa", () => {
  const invoice = {
    id: 904,
    number: 91,
    date: "2026-09-12",
    original_document: { id: 456, type: "order" },
    entity: { id: 99 }
  };
  assert.equal(matchInvoiceToDeliveryNote(invoice, ddt), "none");
});

test("non inventa il tipo DDT per relazioni senza tipo o contraddittorie", () => {
  const wrongType = sanitizeFicInvoice({
    id: 905,
    delivery_note: { id: 456, type: "order" },
    entity: { id: 99 }
  });
  const missingType = sanitizeFicInvoice({
    id: 906,
    delivery_notes: [{ id: 456 }],
    entity: { id: 99 }
  });
  assert.equal(matchInvoiceToDeliveryNote(wrongType, ddt), "none");
  assert.equal(matchInvoiceToDeliveryNote(missingType, ddt), "none");
});