import test from "node:test";
import assert from "node:assert/strict";
import {
  buildFicDeliveryRangeUpdate,
  synchronizeFicClientRecord
} from "./fatture-in-cloud-controller";

test("la sincronizzazione FIC senza date conserva il periodo inserito manualmente", () => {
  const ordine = {
    dataInizioConsegna: "2026-05-15",
    dataFineConsegna: "2026-10-20"
  };

  const aggiornamento = buildFicDeliveryRangeUpdate(
    ordine,
    "Ordine COPEGO senza periodo"
  );

  assert.deepEqual(aggiornamento, {});
  assert.deepEqual({ ...ordine, ...aggiornamento }, {
    dataInizioConsegna: "2026-05-15",
    dataFineConsegna: "2026-10-20"
  });
});

test("le date FIC riempiono un ordine che non ha ancora un periodo", () => {
  const aggiornamento = buildFicDeliveryRangeUpdate(
    {
      dataInizioConsegna: null,
      dataFineConsegna: null
    },
    "COPEGO da maggio ad ottobre 26"
  );

  assert.deepEqual(aggiornamento, {
    dataInizioConsegna: "2026-05-01",
    dataFineConsegna: "2026-10-31"
  });
});

test("la sincronizzazione clienti conserva, recupera e non richiede inutilmente il codice allevamento", async () => {
  const records = new Map<number, any>([
    [1, { id: 1, fattureInCloudId: 101, codiceAllevamento: "025FE126" }],
    [2, { id: 2, fattureInCloudId: 102, codiceAllevamento: "" }],
    [3, { id: 3, fattureInCloudId: 103, codiceAllevamento: "025FE777" }]
  ]);
  const detailCalls: number[] = [];

  const dependencies = {
    async findByFicId(ficId: number) {
      return [...records.values()].find(record => record.fattureInCloudId === ficId) ?? null;
    },
    async findByVatNumber() {
      return null;
    },
    async findByName() {
      return null;
    },
    async fetchDetail(id: number) {
      detailCalls.push(id);
      assert.equal(id, 102);
      return {
        id,
        address_street: "Via Completa 2",
        address_postal_code: "44020",
        code: "025FE999"
      };
    },
    async update(id: number, values: Record<string, unknown>) {
      records.set(id, { ...records.get(id), ...values });
    },
    async insert() {
      assert.fail("i clienti del test esistono già");
    }
  };

  await synchronizeFicClientRecord({
    id: 101,
    name: "Cliente preservato",
    address_street: "Via Uno 1",
    address_postal_code: "44020"
  }, dependencies);
  await synchronizeFicClientRecord({
    id: 102,
    name: "Cliente incompleto",
    address_street: "Via Due 2",
    address_postal_code: "44020"
  }, dependencies);
  await synchronizeFicClientRecord({
    id: 103,
    name: "Cliente completo",
    address_street: "Via Tre 3",
    address_postal_code: "44020"
  }, dependencies);

  assert.equal(records.get(1).codiceAllevamento, "025FE126");
  assert.equal(records.get(2).codiceAllevamento, "025FE999");
  assert.equal(records.get(3).codiceAllevamento, "025FE777");
  assert.deepEqual(detailCalls, [102]);
});