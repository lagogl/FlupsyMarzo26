import assert from "node:assert/strict";
import test from "node:test";
import {
  deliverDdtToExternalChannels,
  type DdtExternalDeliveryDependencies
} from "./advanced-sales-controller";

const dateOrderError = new Error(
  'FCloud DDT create error 400: {"message":"La data DDT (2026-09-18) non può essere anteriore all’ultimo DDT emesso (2026-09-21)."}'
);

function createDependencies(options: {
  fcloudError?: Error;
  latestReservedNumber?: number;
  ficDocument?: any;
}) {
  const calls: string[] = [];
  const dependencies: DdtExternalDeliveryDependencies = {
    sendToFCloud: async () => {
      calls.push("fcloud");
      if (options.fcloudError) throw options.fcloudError;
      return { success: true, fcloudDdtId: "fc-1", fcloudNumero: "326" };
    },
    getLatestReservedNumber: async () => {
      calls.push("latest-number");
      return options.latestReservedNumber ?? 327;
    },
    markFCloudSent: async () => {
      calls.push("fcloud-sent");
    },
    markFCloudError: async () => {
      calls.push("fcloud-error");
    },
    sendToFic: async () => {
      calls.push("fic");
      return {
        data: {
          data: options.ficDocument ?? { id: 91, number: 326 }
        }
      };
    },
    markFicSent: async () => {
      calls.push("fic-sent");
    }
  };
  return { calls, dependencies };
}

test("un rifiuto FCloud per data prosegue verso FIC solo per un numero anteriore", async () => {
  const { calls, dependencies } = createDependencies({
    fcloudError: dateOrderError,
    latestReservedNumber: 327
  });

  const result = await deliverDdtToExternalChannels({
    reservedNumber: 326,
    dependencies
  });

  assert.equal(result.assignedFicNumber, "326");
  assert.deepEqual(calls, [
    "fcloud",
    "latest-number",
    "fcloud-error",
    "fic",
    "fic-sent"
  ]);
});

test("l'ultimo numero resta bloccato e FIC non viene chiamato", async () => {
  const { calls, dependencies } = createDependencies({
    fcloudError: dateOrderError,
    latestReservedNumber: 327
  });

  await assert.rejects(
    deliverDdtToExternalChannels({ reservedNumber: 327, dependencies }),
    /data DDT/
  );
  assert.deepEqual(calls, ["fcloud", "latest-number", "fcloud-error"]);
});

test("un errore FCloud diverso resta bloccante", async () => {
  const { calls, dependencies } = createDependencies({
    fcloudError: new Error("FCloud DDT create error 400: cliente non valido"),
    latestReservedNumber: 327
  });

  await assert.rejects(
    deliverDdtToExternalChannels({ reservedNumber: 326, dependencies }),
    /cliente non valido/
  );
  assert.deepEqual(calls, ["fcloud", "latest-number", "fcloud-error"]);
});

test("lo stato inviato viene scritto solo dopo una risposta FIC valida", async () => {
  const { calls, dependencies } = createDependencies({
    fcloudError: dateOrderError,
    latestReservedNumber: 327,
    ficDocument: { id: 91, number: 0 }
  });

  await assert.rejects(
    deliverDdtToExternalChannels({ reservedNumber: 326, dependencies }),
    /numero DDT valido/
  );
  assert.deepEqual(calls, [
    "fcloud",
    "latest-number",
    "fcloud-error",
    "fic"
  ]);
});
