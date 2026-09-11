import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import type { AddressInfo } from "node:net";
import selectionsRoutes from "./operations/selections/selections.routes";
import tasksRoutes from "./operations/tasks/tasks.routes";
import mortalityRatesRoutes from "./core/mortality-rates/mortality-rates.routes";
import sgrRoutes from "./core/sgr/sgr.routes";

async function withServer(
  sessionUser: { id: number; username: string; role: string } | undefined,
  run: (baseUrl: string) => Promise<void>
) {
  const app = express();
  app.use(express.json());
  if (sessionUser) {
    app.use((req, _res, next) => {
      (req as any).session = { user: sessionUser };
      next();
    });
  }
  app.use("/api", selectionsRoutes);
  app.use("/api", tasksRoutes);
  app.use("/api", mortalityRatesRoutes);
  app.use("/api", sgrRoutes);

  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close(error => error ? reject(error) : resolve())
    );
  }
}

async function request(baseUrl: string, method: string, path: string) {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: method === "GET" ? undefined : "{}"
  });
}

test("operational routers reject anonymous requests before controllers", async () => {
  await withServer(undefined, async baseUrl => {
    for (const [method, path] of [
      ["GET", "/api/selections"],
      ["POST", "/api/selections"],
      ["GET", "/api/tasks"],
      ["POST", "/api/tasks"],
      ["GET", "/api/operators"],
      ["GET", "/api/mortality-rates"],
      ["POST", "/api/mortality-rates"],
      ["GET", "/api/sgr"]
    ]) {
      const response = await request(baseUrl, method, path);
      assert.equal(response.status, 401, `${method} ${path}`);
    }
  });
});

test("configuration migrations reject authenticated non-admin users", async () => {
  await withServer(
    { id: 7, username: "operatore", role: "user" },
    async baseUrl => {
      for (const [method, path] of [
        ["POST", "/api/selections/migrate-basket-lot-data"],
        ["POST", "/api/mortality-rates"],
        ["PATCH", "/api/mortality-rates/1"]
      ]) {
        const response = await request(baseUrl, method, path);
        assert.equal(response.status, 403, `${method} ${path}`);
      }
    }
  );
});