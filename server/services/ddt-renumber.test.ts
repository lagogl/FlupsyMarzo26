import test from "node:test";
import assert from "node:assert/strict";
import { canRenumberDdt, matchesLockedLocalDraft, type RenumberableDdt } from "./ddt-renumber";

const local: RenumberableDdt = {
  ddtStato: "locale",
  fcloudDdtId: null,
  fcloudStato: null,
  fattureInCloudId: null,
  fattureInCloudNumero: null
};

test("solo una bozza interamente locale è rinumerabile", () => {
  assert.equal(canRenumberDdt(local), true);
  for (const state of ["invio", "inviato", "nessuno"]) {
    assert.equal(canRenumberDdt({ ...local, ddtStato: state }), false, state);
  }
});

test("ogni traccia esterna o esito incerto vieta la rinumerazione", () => {
  assert.equal(canRenumberDdt({ ...local, fcloudDdtId: "42" }), false);
  assert.equal(canRenumberDdt({ ...local, fcloudStato: "inviato" }), false);
  assert.equal(canRenumberDdt({ ...local, fcloudStato: "errore" }), false);
  assert.equal(canRenumberDdt({ ...local, fattureInCloudId: 42 }), false);
  assert.equal(canRenumberDdt({ ...local, fattureInCloudNumero: "42" }), false);
});

test("un invio o una rinumerazione concorrente invalida la bozza letta prima del lock", () => {
  const initial = { ...local, numero: 41, companyId: 10, year: 2026 };
  assert.equal(matchesLockedLocalDraft(initial, { ...initial }), true);
  assert.equal(matchesLockedLocalDraft(initial, { ...initial, ddtStato: "invio" }), false);
  assert.equal(matchesLockedLocalDraft(initial, { ...initial, ddtStato: "inviato" }), false);
  assert.equal(matchesLockedLocalDraft(initial, { ...initial, numero: 42 }), false);
  assert.equal(matchesLockedLocalDraft(initial, { ...initial, fcloudStato: "errore" }), false);
  assert.equal(matchesLockedLocalDraft(initial, { ...initial, companyId: 11 }), false);
});