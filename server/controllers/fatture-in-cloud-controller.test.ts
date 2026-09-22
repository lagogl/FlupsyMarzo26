import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import type { AddressInfo } from "node:net";
import { requireAdmin } from "../modules/system/auth";
import {
  buildFicDeliveryRangeUpdate,
  createFicClientSyncHandler,
  synchronizeFicClientRecord
} from "./fatture-in-cloud-controller";
import fattureInCloudRouter from "./fatture-in-cloud-controller";

async function withHttpServer(
  sessionUser: { id: number; username: string; role: string },
  register: (app: express.Express) => void,
  run: (baseUrl: string) => Promise<void>
) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).session = { user: sessionUser };
    next();
  });
  register(app);

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

test("la sincronizzazione FIC senza date conserva il periodo inserito manualmente", () => {
  const ordine = {
    dataInizioConsegna: "2026-05-15",
    dataFineConsegna: "2026-10-20"
  };

  const aggiornamento = buildFicDeliveryRangeUpdate(
    ordine,
    "Ordine COPEGO senza periodo"
  );

  assert.deepEqual(aggiornamento, {});
  assert.deepEqual({ ...ordine, ...aggiornamento }, {
    dataInizioConsegna: "2026-05-15",
    dataFineConsegna: "2026-10-20"
  });
});

test("le date FIC riempiono un ordine che non ha ancora un periodo", () => {
  const aggiornamento = buildFicDeliveryRangeUpdate(
    {
      dataInizioConsegna: null,
      dataFineConsegna: null
    },
    "COPEGO da maggio ad ottobre 26"
  );

  assert.deepEqual(aggiornamento, {
    dataInizioConsegna: "2026-05-01",
    dataFineConsegna: "2026-10-31"
  });
});

test("la sincronizzazione clienti conserva, recupera e non richiede inutilmente il codice allevamento", async () => {
  const records = new Map<number, any>([
    [1, { id: 1, fattureInCloudId: 101, codiceAllevamento: "025FE126" }],
    [2, { id: 2, fattureInCloudId: 102, codiceAllevamento: "" }],
    [3, { id: 3, fattureInCloudId: 103, codiceAllevamento: "025FE777" }]
  ]);
  const detailCalls: number[] = [];

  const dependencies = {
    async findByFicId(ficId: number) {
      return [...records.values()].find(record => record.fattureInCloudId === ficId) ?? null;
    },
    async findByVatNumber() {
      return null;
    },
    async findByName() {
      return null;
    },
    async fetchDetail(id: number) {
      detailCalls.push(id);
      assert.equal(id, 102);
      return {
        id,
        address_street: "Via Completa 2",
        address_postal_code: "44020",
        code: "025FE999"
      };
    },
    async update(id: number, values: Record<string, unknown>) {
      records.set(id, { ...records.get(id), ...values });
    },
    async insert() {
      assert.fail("i clienti del test esistono già");
    }
  };

  await synchronizeFicClientRecord({
    id: 101,
    name: "Cliente preservato",
    address_street: "Via Uno 1",
    address_postal_code: "44020"
  }, dependencies);
  await synchronizeFicClientRecord({
    id: 102,
    name: "Cliente incompleto",
    address_street: "Via Due 2",
    address_postal_code: "44020"
  }, dependencies);
  await synchronizeFicClientRecord({
    id: 103,
    name: "Cliente completo",
    address_street: "Via Tre 3",
    address_postal_code: "44020"
  }, dependencies);

  assert.equal(records.get(1).codiceAllevamento, "025FE126");
  assert.equal(records.get(2).codiceAllevamento, "025FE999");
  assert.equal(records.get(3).codiceAllevamento, "025FE777");
  assert.deepEqual(detailCalls, [102]);
});

test("la route di sincronizzazione clienti rifiuta un utente non amministratore", async () => {
  await withHttpServer(
    { id: 7, username: "operatore", role: "user" },
    app => app.use("/api/fatture-in-cloud", fattureInCloudRouter),
    async baseUrl => {
      const response = await fetch(`${baseUrl}/api/fatture-in-cloud/clients/sync`, {
        method: "POST"
      });
      assert.equal(response.status, 403);
    }
  );
});

test("la sincronizzazione amministrativa restituisce le statistiche e termina il progresso con complete", async () => {
  const notifications: Array<{ type: string; data: any }> = [];
  const clients = [{ id: 101 }, { id: 102 }, { id: 103 }];
  const handler = createFicClientSyncHandler({
    async refreshToken() {},
    async fetchClientsPage(page, perPage) {
      assert.equal(page, 1);
      assert.equal(perPage, 100);
      return { data: { data: clients, current_page: 1, last_page: 1, total: 3 } };
    },
    async syncClient(client) {
      return client.id === 102 ? "updated" : "created";
    },
    broadcast(type, data) {
      notifications.push({ type, data });
      return 1;
    }
  });

  await withHttpServer(
    { id: 1, username: "admin", role: "admin" },
    app => app.post("/api/fatture-in-cloud/clients/sync", requireAdmin, handler),
    async baseUrl => {
      const response = await fetch(`${baseUrl}/api/fatture-in-cloud/clients/sync`, {
        method: "POST"
      });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        success: true,
        message: "Sincronizzazione completata: 2 nuovi, 1 aggiornati",
        stats: { creati: 2, aggiornati: 1, totale: 3 }
      });
    }
  );

  assert.ok(notifications.length > 0);
  assert.deepEqual(notifications.at(-1), {
    type: "fic_sync_progress",
    data: {
      message: "✅ Sincronizzazione completata: 2 nuovi, 1 aggiornati",
      step: "complete",
      progress: 100,
      created: 2,
      updated: 1,
      total: 3
    }
  });
});

test("un errore FIC restituisce una risposta controllata senza dettagli sensibili", async () => {
  const sensitiveDetail = "Bearer segreto-token database.internal";
  const handler = createFicClientSyncHandler({
    async refreshToken() {},
    async fetchClientsPage() {
      throw new Error(sensitiveDetail);
    },
    async syncClient() {
      assert.fail("non deve sincronizzare clienti dopo un errore FIC");
    },
    broadcast() {
      return 0;
    }
  });

  await withHttpServer(
    { id: 1, username: "admin", role: "admin" },
    app => app.post("/api/fatture-in-cloud/clients/sync", requireAdmin, handler),
    async baseUrl => {
      const response = await fetch(`${baseUrl}/api/fatture-in-cloud/clients/sync`, {
        method: "POST"
      });
      const body = await response.text();
      assert.equal(response.status, 500);
      assert.doesNotMatch(body, /segreto-token|database\.internal|Bearer/);
      assert.deepEqual(JSON.parse(body), {
        success: false,
        message: "Errore durante la sincronizzazione dei clienti con Fatture in Cloud"
      });
    }
  );
});