import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import type { AddressInfo } from "node:net";
import { registerIntegrationsRoutes } from "./integrations.routes";
import fattureInCloudRoutes from "../../controllers/fatture-in-cloud-controller";

async function withServer(
  sessionUser: { id: number; username: string; role: string } | undefined,
  run: (baseUrl: string) => Promise<void>
) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).session = sessionUser ? { user: sessionUser } : {};
    next();
  });
  registerIntegrationsRoutes(app);
  app.use("/api/fatture-in-cloud", fattureInCloudRoutes);

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
    redirect: "manual",
    headers: { "content-type": "application/json" },
    body: method === "GET" ? undefined : "{}"
  });
}

test("integration routes reject anonymous access", async () => {
  await withServer(undefined, async baseUrl => {
    for (const [method, path] of [
      ["GET", "/api/email/config"],
      ["POST", "/api/email/send-diario"],
      ["GET", "/api/telegram/config"],
      ["POST", "/api/telegram/send-diario"],
      ["GET", "/api/fatture-in-cloud/config"],
      ["GET", "/api/fatture-in-cloud/oauth/url"]
    ]) {
      const response = await request(baseUrl, method, path);
      assert.equal(response.status, 401, `${method} ${path}`);
    }
  });
});

test("integration administration rejects authenticated non-admin users", async () => {
  await withServer(
    { id: 7, username: "operatore", role: "user" },
    async baseUrl => {
      for (const [method, path] of [
        ["POST", "/api/email/send-diario"],
        ["POST", "/api/email/config"],
        ["POST", "/api/telegram/config"],
        ["GET", "/api/fatture-in-cloud/oauth/url"],
        ["POST", "/api/fatture-in-cloud/config"]
      ]) {
        const response = await request(baseUrl, method, path);
        assert.equal(response.status, 403, `${method} ${path}`);
      }
    }
  );
});

test("Fatture in Cloud OAuth callback rejects a missing state", async () => {
  await withServer(undefined, async baseUrl => {
    const response = await request(
      baseUrl,
      "GET",
      "/api/fatture-in-cloud/oauth/callback?code=untrusted"
    );
    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("location"),
      "/fatture-in-cloud?oauth=error&reason=invalid_state"
    );
  });
});