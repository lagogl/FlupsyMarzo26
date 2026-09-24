import test from "node:test";
import assert from "node:assert/strict";
import { apiRequest } from "./queryClient";
import { openDdtNumberRecoveryOnConflict } from "./ddt-number-recovery";

test("il 409 FIC apre il recupero e permette di inviare il nuovo numero", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; number?: number }> = [];
  let selectedSale: number | null = null;
  let invalidatedSale: number | null = null;
  let dialogSale: number | null = null;
  globalThis.fetch = async (url, options) => {
    const address = String(url);
    requests.push({ url: address, number: options?.body ? JSON.parse(String(options.body)).number : undefined });
    return address.endsWith("/send-to-fic")
      ? new Response(JSON.stringify({
          success: false, code: "FIC_DDT_NUMBER_CONFLICT", error: "Numero già presente su FIC"
        }), { status: 409, headers: { "content-type": "application/json" } })
      : new Response(JSON.stringify({ success: true, number: 317 }),
          { status: 200, headers: { "content-type": "application/json" } });
  };

  try {
    const sale = { id: 12, ddtId: 34 };
    let conflict: unknown;
    try {
      await apiRequest(`/api/ddt/${sale.ddtId}/send-to-fic`, { method: "POST" });
    } catch (error) {
      conflict = error;
    }
    assert.equal(openDdtNumberRecoveryOnConflict(conflict, sale, {
      selectSale: id => { selectedSale = id; },
      invalidateNumbers: id => { invalidatedSale = id; },
      openDialog: selected => { dialogSale = selected.id; }
    }), true);
    assert.equal(selectedSale, 12);
    assert.equal(invalidatedSale, 12);
    assert.equal(dialogSale, 12);

    const result = await apiRequest(`/api/advanced-sales/${sale.id}/renumber-ddt`, {
      method: "POST", body: JSON.stringify({ number: 317 })
    });
    assert.equal(result.number, 317);
    assert.deepEqual(requests, [
      { url: "/api/ddt/34/send-to-fic", number: undefined },
      { url: "/api/advanced-sales/12/renumber-ddt", number: 317 }
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("un errore diverso non mostra i controlli di recupero", () => {
  assert.equal(openDdtNumberRecoveryOnConflict(
    { data: { code: "FIC_PRODUCT_MAPPING_REQUIRED" } },
    { id: 12 }, {
      selectSale: () => { throw new Error("unexpected"); },
      invalidateNumbers: () => { throw new Error("unexpected"); },
      openDialog: () => { throw new Error("unexpected"); }
    }
  ), false);
});