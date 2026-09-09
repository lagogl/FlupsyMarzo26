import assert from "node:assert/strict";
import test from "node:test";
import { buildAggregatedFicDdtItems } from "./external-product-catalog";

function row(overrides: Record<string, unknown>) {
  return {
    id: 1,
    ddtId: 10,
    descrizione: "Sacco #1 · F2C7",
    quantita: "100.00",
    unitaMisura: "NR",
    prezzoUnitario: "0.00",
    reportDettaglioId: null,
    advancedSaleId: 20,
    saleBagId: 30,
    basketId: 40,
    sizeCode: "TP-3000",
    flupsyName: "F. 2 nero PVC",
    ficProductId: "123",
    ficProductCode: "TPH3000",
    ficProductName: "Seme vivo vongola TP-3000",
    fcloudProductId: null,
    fcloudProductCode: null,
    fcloudProductName: null,
    createdAt: new Date(),
    ...overrides
  };
}

test("aggrega i sacchi con lo stesso codice prodotto FIC", () => {
  const items = buildAggregatedFicDdtItems([
    row({ id: 1, quantita: "100.00", descrizione: "Sacco #1 · F2C7" }),
    row({ id: 2, quantita: "250.00", descrizione: "Sacco #2 · F2C8" })
  ] as any);

  assert.equal(items.length, 1);
  assert.deepEqual(items[0], {
    product_id: 123,
    name: "Seme vivo vongola TP-3000",
    description: "TP-3000 · Sacco #1 · F2C7 ; Sacco #2 · F2C8",
    qty: 350,
    measure: "NR",
    net_price: 0
  });
});

test("esclude le righe di subtotale dal payload FIC", () => {
  const items = buildAggregatedFicDdtItems([
    row({ id: 1 }),
    row({
      id: 2,
      descrizione: "SUBTOTALE TP-3000",
      quantita: "100.00",
      ficProductCode: null,
      ficProductName: null
    })
  ] as any);

  assert.equal(items.length, 1);
  assert.equal(items[0].qty, 100);
});

test("rifiuta una riga prodotto senza identificativo FIC", () => {
  assert.throws(
    () => buildAggregatedFicDdtItems([row({ ficProductId: null })] as any),
    /senza prodotto FIC valido/
  );
});

test("rifiuta un DDT composto soltanto da subtotali", () => {
  assert.throws(
    () => buildAggregatedFicDdtItems([
      row({ descrizione: "SUBTOTALE TP-3000", ficProductCode: null })
    ] as any),
    /non contiene righe prodotto/
  );
});