import test from "node:test";
import assert from "node:assert/strict";
import { buildFicDeliveryRangeUpdate } from "./fatture-in-cloud-controller";

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