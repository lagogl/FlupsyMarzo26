import test from "node:test";
import assert from "node:assert/strict";
import {
  getLocalDdtReleaseBlockReason,
  type LocalDdtReleaseCandidate
} from "./ddt-local-release";

const releasableDraft = (): LocalDdtReleaseCandidate => ({
  saleId: 12,
  saleStatus: "confirmed",
  saleDdtId: 80,
  saleDdtStatus: "locale",
  documentId: 80,
  documentStatus: "locale",
  ficId: null,
  ficNumber: null,
  fcloudId: null,
  fcloudNumber: null,
  fcloudStatus: null,
  otherSaleIds: [],
  detailSaleIds: [12, 12]
});

test("rilascia solo il DDT locale non trasmesso, interamente della vendita", () => {
  assert.equal(getLocalDdtReleaseBlockReason(releasableDraft()), null);
});

test("blocca vendite non confermate e riferimenti DDT incoerenti", () => {
  assert.match(
    getLocalDdtReleaseBlockReason({ ...releasableDraft(), saleStatus: "draft" }) || "",
    /solo per una vendita confermata/
  );
  assert.match(
    getLocalDdtReleaseBlockReason({ ...releasableDraft(), documentId: 81 }) || "",
    /prenotazione DDT locale/
  );
});

test("blocca qualsiasi stato di invio o traccia FIC/FCloud, anche un errore", () => {
  for (const candidate of [
    { ...releasableDraft(), documentStatus: "invio" },
    { ...releasableDraft(), ficId: 5 },
    { ...releasableDraft(), ficNumber: "327" },
    { ...releasableDraft(), fcloudId: "cloud-5" },
    { ...releasableDraft(), fcloudNumber: "17" },
    { ...releasableDraft(), fcloudStatus: "errore" },
  ]) {
    assert.notEqual(getLocalDdtReleaseBlockReason(candidate), null);
  }
});

test("non rilascia DDT senza righe o condivisi con un'altra vendita", () => {
  assert.match(
    getLocalDdtReleaseBlockReason({ ...releasableDraft(), otherSaleIds: [13] }) || "",
    /collegato anche a un'altra vendita/
  );
  assert.match(
    getLocalDdtReleaseBlockReason({ ...releasableDraft(), detailSaleIds: [] }) || "",
    /righe DDT/
  );
  assert.match(
    getLocalDdtReleaseBlockReason({ ...releasableDraft(), detailSaleIds: [12, 13] }) || "",
    /righe DDT/
  );
});