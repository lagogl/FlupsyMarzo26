import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { getTableName } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { commercialInputSchema } from "../../../../shared/commercial-availability";
import { businessToday } from "../../../utils/business-date";

/** In-memory persistence seam; production router, auth middleware, owner scopes,
 * validation and snapshot endpoint all execute unchanged. No operational writes. */
function repository() {
  const tables = new Map<string, any[]>();
  const dialect = new PgDialect();
  const chain = (table: any, kind: string) => {
    const name = getTableName(table);
    if (!tables.has(name)) tables.set(name, []);
    let params: unknown[] = [], values: any;
    const run = () => {
      const rows = tables.get(name)!;
      const matches = (row: any) => params.length === 1 ? row.ownerId === params[0] : row.id === params[0] && row.ownerId === params[1];
      if (kind === "insert") {
        const row = structuredClone({ ...values, id: rows.length + 1, createdAt: new Date(), updatedAt: new Date() });
        rows.push(row); return [structuredClone(row)];
      }
      const found = rows.filter(matches);
      if (kind === "update") for (const row of found) Object.assign(row, structuredClone(values));
      if (kind === "delete") tables.set(name, rows.filter(row => !matches(row)));
      return structuredClone(found);
    };
    const q: any = {
      where: (condition: any) => { params = dialect.sqlToQuery(condition).params; return q; },
      values: (v: any) => { values = v; return q; },
      set: (v: any) => { values = v; return q; },
      returning: () => Promise.resolve(run()),
      orderBy: () => q, limit: () => q,
      then: (ok: any, fail: any) => Promise.resolve().then(run).then(ok, fail),
    };
    return q;
  };
  return {
    select: () => ({ from: (t: any) => chain(t, "select") }),
    insert: (t: any) => chain(t, "insert"),
    update: (t: any) => chain(t, "update"),
    delete: (t: any) => chain(t, "delete"),
  };
}

test("authenticated owner-scoped CRUD, duplicate/replan and server-validated immutable summaries", async () => {
  const savedConsole = { log: console.log, info: console.info, warn: console.warn, error: console.error };
  // Legacy DB modules emit connection diagnostics during import; do not print
  // those in tests. The injected repository below never touches those clients.
  console.log = console.info = console.warn = console.error = () => {};
  let createCommercialRouter: typeof import("./index").createCommercialRouter;
  try { ({ createCommercialRouter } = await import("./index")); }
  finally { Object.assign(console, savedConsole); }
  const today = businessToday();
  const input = commercialInputSchema.parse({ name: "Originale", startYear: today.year, startMonth: today.month, selectedSizeIds: [1] });
  let valid = true, version = 1;
  const calls: { owner: string; fresh: boolean | undefined }[] = [];
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    const user = req.headers["x-test-user"];
    (req as any).session = user ? { user: { id: Number(user), username: "test", role: "user" } } : {};
    next();
  });
  app.use(createCommercialRouter!({
    db: repository() as any,
    getInputs: async () => ({ sizes: [{ id: 1, code: "TP-2000", name: "Original size" }], defaults: input, referenceDate: "2027-01-01", warnings: [] }),
    simulate: async (draft, owner, fresh) => {
      calls.push({ owner, fresh });
      return {
        input: structuredClone(draft), inputHash: `server-${version}`, referenceDate: "2027-01-01", generatedAt: "2027-01-01T10:00:00Z",
        sizes: [{ id: 1, code: "TP-2000", name: "Original size" }], availabilityIsAlternative: true, valid,
        months: [], baselineMonths: [], plan: [], totalAccepted: version, totalRequested: version,
        baselineOrderShortfall: 0, orderShortfall: 0, hatcheryDependent: false, warnings: ["Server warning"], calculationMs: 1,
      };
    },
  }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const port = (server.address() as any).port;
  const request = async (path: string, method = "GET", body?: any, user: number | null = 1) => {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      method, headers: { "Content-Type": "application/json", ...(user ? { "x-test-user": String(user) } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    return { status: res.status, data };
  };
  try {
    assert.equal((await request("/inputs", "GET", undefined, null)).status, 401);
    const created = await request("/scenarios", "POST", input);
    assert.equal(created.status, 201); const id = created.data.id;
    assert.equal((await request(`/scenarios/${id}`, "GET", undefined, 2)).status, 404);
    assert.equal((await request(`/scenarios/${id}`, "PUT", input, 2)).status, 404);
    assert.equal((await request(`/scenarios/${id}`, "DELETE", undefined, 2)).status, 404);
    assert.deepEqual((await request("/scenarios", "GET", undefined, 2)).data, []);
    assert.equal((await request(`/scenarios/${id}/duplicate`, "POST")).status, 201);
    assert.equal((await request(`/scenarios/${id}/replan`, "POST")).data.input.startMonth, today.month);
    const historical = await request("/scenarios", "POST", { ...input, startYear: today.year - 1, sales: [{ id: "old", year: today.year - 1, month: today.month, day: 1, sizeId: 1, quantity: 10 }] });
    const replanned = await request(`/scenarios/${historical.data.id}/replan`, "POST");
    assert.equal(replanned.data.input.sales[0].year, today.year);
    assert.equal(replanned.data.input.sales[0].day, today.day);
    assert.equal((await request(`/scenarios/${historical.data.id}`)).data.input.startYear, today.year - 1);
    assert.equal((await request("/simulate", "POST", { ...input, selectedSizeIds: [] })).status, 400);
    const summary = await request("/summaries", "POST", { ...input, snapshot: { totalAccepted: 99999 }, inputHash: "forged" });
    assert.equal(summary.status, 201);
    assert.equal(summary.data.snapshot.inputHash, "server-1");
    assert.equal(summary.data.snapshot.totalAccepted, 1);
    assert.deepEqual(calls.at(-1), { owner: "1", fresh: true });
    version = 2;
    await request("/simulate", "POST", input);
    assert.equal((await request(`/summaries/${summary.data.id}`)).data.snapshot.totalAccepted, 1);
    assert.equal((await request(`/summaries/${summary.data.id}`)).data.snapshot.sizes[0].name, "Original size");
    assert.equal((await request(`/summaries/${summary.data.id}`, "GET", undefined, 2)).status, 404);
    assert.equal((await request(`/summaries/${summary.data.id}`, "PUT", input)).status, 404);
    valid = false;
    assert.equal((await request("/summaries", "POST", input)).status, 422);
    assert.equal((await request("/summaries")).data.length, 1);
    assert.equal((await request(`/scenarios/${id}`, "DELETE")).status, 204);
    assert.equal((await request(`/summaries/${summary.data.id}`)).status, 200);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});