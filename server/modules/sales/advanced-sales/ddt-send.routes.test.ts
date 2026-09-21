import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import type { AddressInfo } from "node:net";
import { registerDdtSendRoute } from "./ddt-send.routes";

type SessionUser = { id: number; username: string; role: string };

async function withServer(
  sessionUser: SessionUser | undefined,
  run: (baseUrl: string, controllerCalls: () => number) => Promise<void>
) {
  const app = express();
  let calls = 0;

  app.use((req, _res, next) => {
    (req as any).session = sessionUser ? { user: sessionUser } : {};
    next();
  });
  registerDdtSendRoute(app, (_req, res) => {
    calls += 1;
    res.status(204).end();
  });

  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const { port } = server.address() as AddressInfo;

  try {
    await run(`http://127.0.0.1:${port}`, () => calls);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close(error => error ? reject(error) : resolve())
    );
  }
}

test("DDT send route allows an authenticated operator", async () => {
  await withServer(
    { id: 7, username: "operatore", role: "user" },
    async (baseUrl, controllerCalls) => {
      const response = await fetch(`${baseUrl}/api/ddt/42/send-to-fic`, {
        method: "POST"
      });

      assert.equal(response.status, 204);
      assert.equal(controllerCalls(), 1);
    }
  );
});

test("DDT send route rejects an anonymous request before the controller", async () => {
  await withServer(undefined, async (baseUrl, controllerCalls) => {
    const response = await fetch(`${baseUrl}/api/ddt/42/send-to-fic`, {
      method: "POST"
    });

    assert.equal(response.status, 401);
    assert.equal(controllerCalls(), 0);
  });
});