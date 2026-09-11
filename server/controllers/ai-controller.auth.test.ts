import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import type { AddressInfo } from "node:net";
import { registerAIRoutes } from "./ai-controller";

async function withServer(
  configure: (app: express.Express) => void,
  run: (baseUrl: string) => Promise<void>
) {
  const app = express();
  app.use(express.json());
  configure(app);
  registerAIRoutes(app);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
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

test("general AI operational endpoints reject anonymous requests", async () => {
  await withServer(() => undefined, async baseUrl => {
    const probes: Array<[string, string]> = [
      ["POST", "/api/ai/predictive-growth"],
      ["GET", "/api/ai/anomaly-detection"],
      ["GET", "/api/ai/business-analytics"],
      ["GET", "/api/ai/mortality-analysis"],
      ["GET", "/api/ai/production-forecast"],
      ["GET", "/api/ai/production-forecast/export-simple"],
      ["POST", "/api/ai/scenario-analysis"]
    ];

    for (const [method, path] of probes) {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: { "content-type": "application/json" },
        body: method === "POST" ? "{}" : undefined
      });
      assert.equal(response.status, 401, `${method} ${path}`);
    }
  });
});

test("production target mutation rejects an authenticated non-admin", async () => {
  await withServer(app => {
    app.use((req, _res, next) => {
      (req as any).session = {
        user: { id: 7, username: "operatore", role: "user" }
      };
      next();
    });
  }, async baseUrl => {
    const response = await fetch(`${baseUrl}/api/ai/production-targets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        year: 2026,
        month: 9,
        sizeCategory: "TP-5000",
        targetAnimals: 100
      })
    });
    assert.equal(response.status, 403);
  });
});