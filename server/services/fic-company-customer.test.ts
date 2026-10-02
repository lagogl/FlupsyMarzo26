import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  assertInlineFicCustomer, FicCustomerError, resolveFicCompanyCustomer,
  type FicCustomerRead,
} from "./fic-company-customer";
import {
  buildFicDdtCustomerEntity, normalizeSaleCustomerSnapshot,
} from "./advanced-sale-documents";

const fiscal = { ficClientId: 100, vatNumber: "01234567890", taxCode: "01234567890" };
const complete = {
  ...fiscal, name: "Cliente di prova", address: "Via Test 1",
  city: "Roma", postalCode: "00100",
};
const detail = { id: 200, vat_number: "IT01234567890", address_street: "Via Test 2" };
const missing = Object.assign(new Error("not found"), { response: { status: 404 } });

function fakeRead(responses: Record<string, any>) {
  const calls: string[] = [];
  const read: FicCustomerRead = async endpoint => {
    calls.push(endpoint);
    assert.ok(Object.hasOwn(responses, endpoint), `Unexpected GET ${endpoint}`);
    const value = responses[endpoint];
    if (value instanceof Error) throw value;
    return value;
  };
  return { calls, read };
}

test("wrong-company ID returning404 is resolved by VAT in the target company", async () => {
  const { read, calls } = fakeRead({
    "/entities/clients/100": missing,
    "/entities/clients?page=1&per_page=100": { data: [{ id: 200, vat_number: fiscal.vatNumber }], last_page: 1 },
    "/entities/clients/200": { data: detail },
  });
  assert.deepEqual(await resolveFicCompanyCustomer(fiscal, read), detail);
  assert.equal(calls.length, 3);
});

test("same ID with another fiscal identity is not adopted", async () => {
  const { read } = fakeRead({
    "/entities/clients/100": { data: { id: 100, vat_number: "99999999999" } },
    "/entities/clients?page=1&per_page=100": { data: [{ id: 200, vat_number: fiscal.vatNumber }], last_page: 1 },
    "/entities/clients/200": { data: detail },
  });
  assert.equal((await resolveFicCompanyCustomer(fiscal, read))?.id, 200);
});

test("verified company-local ID uses its detail without an unnecessary list request", async () => {
  const { read, calls } = fakeRead({ "/entities/clients/200": { data: detail } });
  assert.equal((await resolveFicCompanyCustomer({ ...fiscal, ficClientId: 200 }, read))?.id, 200);
  assert.equal(calls.length, 1);
});

test("no matching entity permits complete inline data and omits the obsolete ID", async () => {
  const { read } = fakeRead({
    "/entities/clients/100": missing,
    "/entities/clients?page=1&per_page=100": { data: [], last_page: 1 },
  });
  const client = await resolveFicCompanyCustomer(fiscal, read);
  assert.equal(client, null);
  assert.doesNotThrow(() => assertInlineFicCustomer(complete));
  const frozen = {
    clienteNome: complete.name, clientePiva: complete.vatNumber,
    clienteIndirizzo: complete.address, clienteCitta: complete.city,
    clienteCap: complete.postalCode, clienteFattureInCloudId: 100,
  };
  const entity = buildFicDdtCustomerEntity({ ...frozen, clienteFattureInCloudId: client?.id ?? null });
  assert.equal("id" in entity, false);
  assert.equal(entity.vat_number, fiscal.vatNumber);
  assert.equal(entity.address_street, complete.address);
  assert.equal(frozen.clienteFattureInCloudId, 100, "original document is not mutated");
  assert.doesNotThrow(() => assertInlineFicCustomer(normalizeSaleCustomerSnapshot(entity)));
});

test("inline requires complete data; unknown fiscal identity is never matched by name", async () => {
  assert.throws(() => assertInlineFicCustomer({ ...complete, address: "N/A" }), {
    code: "FIC_CUSTOMER_DETAILS_REQUIRED", statusCode: 409,
  });
  await assert.rejects(resolveFicCompanyCustomer({ ficClientId: 100 }, async () => {
    assert.fail("No remote call without fiscal identity");
  }), { code: "FIC_CUSTOMER_IDENTITY_REQUIRED" });
});

test("network/auth/rate-limit failures never become an inline customer", async () => {
  for (const status of [401, 403, 429, 500]) {
    await assert.rejects(resolveFicCompanyCustomer(fiscal, async () => {
      throw Object.assign(new Error("sensitive upstream body"), { response: { status } });
    }), error => {
      assert.ok(error instanceof FicCustomerError);
      assert.equal(error.statusCode, 503);
      assert.doesNotMatch(error.message, /sensitive upstream body/);
      return true;
    });
  }
});

test("duplicate VAT across pages blocks instead of choosing the first customer", async () => {
  const { read } = fakeRead({
    "/entities/clients?page=1&per_page=100": { data: [{ id: 200, vat_number: fiscal.vatNumber }], last_page: 2 },
    "/entities/clients?page=2&per_page=100": { data: [{ id: 201, vat_number: fiscal.vatNumber }], last_page: 2 },
  });
  await assert.rejects(resolveFicCompanyCustomer({ ...fiscal, ficClientId: null }, read), {
    code: "FIC_CUSTOMER_AMBIGUOUS",
  });
});

test("repeated/incomplete pages fail closed; no silent inline fallback", async () => {
  const clients = [{ id: 201, vat_number: "99999999999" }];
  const { read } = fakeRead({
    "/entities/clients?page=1&per_page=100": { data: clients, last_page: 3 },
    "/entities/clients?page=2&per_page=100": { data: clients, last_page: 3 },
  });
  await assert.rejects(resolveFicCompanyCustomer({ ...fiscal, ficClientId: null }, read), {
    code: "FIC_CUSTOMER_LOOKUP_UNAVAILABLE",
  });
  await assert.rejects(resolveFicCompanyCustomer({ ...fiscal, ficClientId: null }, async () => ({
    data: [], last_page: 2,
  })), { code: "FIC_CUSTOMER_LOOKUP_UNAVAILABLE" });
});

test("tax-code-only customer is supported and detail fiscal changes are blocked", async () => {
  const { read } = fakeRead({
    "/entities/clients?page=1&per_page=100": { data: [{ id: 200, tax_code: "RSSMRA80A01H501U" }], last_page: 1 },
    "/entities/clients/200": { data: { id: 200, tax_code: "OTHER" } },
  });
  await assert.rejects(resolveFicCompanyCustomer({ taxCode: "rssmra80a01h501u" }, read), {
    code: "FIC_CUSTOMER_IDENTITY_CHANGED",
  });
});

test("controller scopes GETs to issuer, does not rewrite shared ID, and checks before external claim", () => {
  const controller = readFileSync("server/controllers/advanced-sales-controller.ts", "utf8");
  const completeCustomer = controller.slice(controller.indexOf("async function getCompleteSaleCustomer"), controller.indexOf("export async function getAvailableSaleOperations"));
  assert.match(completeCustomer, /pacedFicApiRequest\('GET', `\/c\/\$\{companyId\}\$\{endpoint\}`\)/);
  assert.doesNotMatch(completeCustomer, /updates\.fattureInCloudId/);
  assert.match(completeCustomer, /return \{ \.\.\.preliminary, ficClientId: '' \}/);
  const send = controller.slice(controller.indexOf("const ddtData = ddtResult[0];", controller.indexOf("export async function sendDDTToFattureInCloud")));
  assert.ok(send.indexOf("const ficCustomer = await resolveFicCompanyCustomer") >= 0);
  assert.ok(send.indexOf("const ficCustomer = await resolveFicCompanyCustomer") < send.indexOf("const [claimedDdt]"));
  assert.match(send, /entity: ficCustomerEntity/);
});