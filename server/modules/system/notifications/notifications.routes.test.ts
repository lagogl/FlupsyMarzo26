import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import type { AddressInfo } from "node:net";
import notificationsRoutes from "./notifications.routes";

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
  app.use("/api", notificationsRoutes);

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

test("notification routes reject anonymous requests", async () => {
  await withServer(undefined, async baseUrl => {
    const probes: Array<[string, string]> = [
      ["GET", "/api/notifications"],
      ["POST", "/api/notifications"],
      ["PUT", "/api/notifications/1/read"],
      ["PUT", "/api/notifications/read-all"],
      ["GET", "/api/notification-settings"],
      ["PUT", "/api/notification-settings/accrescimento"],
      ["POST", "/api/notifications/test-growth"]
    ];

    for (const [method, path] of probes) {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: { "content-type": "application/json" },
        body: method === "GET" ? undefined : "{}"
      });
      assert.equal(response.status, 401, `${method} ${path}`);
    }
  });
});

test("notification administration rejects authenticated non-admin users", async () => {
  await withServer(
    { id: 7, username: "operatore", role: "user" },
    async baseUrl => {
      for (const [method, path] of [
        ["POST", "/api/notifications"],
        ["GET", "/api/notification-settings"],
        ["PUT", "/api/notification-settings/accrescimento"],
        ["POST", "/api/notifications/test-growth"]
      ] as const) {
        const response = await fetch(`${baseUrl}${path}`, {
          method,
          headers: { "content-type": "application/json" },
          body: method === "GET" ? undefined : "{}"
        });
        assert.equal(response.status, 403, `${method} ${path}`);
      }
    }
  );
});