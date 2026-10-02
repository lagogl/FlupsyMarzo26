import { Worker } from "node:worker_threads";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { CommercialInput } from "../../../../shared/commercial-availability";
import type { World } from "../sales-scenarios/engine";
import type { computeCommercial } from "./compute";
import { CommercialBusyError } from "./admission";

type Calculation = ReturnType<typeof computeCommercial>;
interface Job { world: World; input: CommercialInput; resolve: (r: Calculation) => void; reject: (e: Error) => void }
const queue: Job[] = [];
let active = 0;
/** Bounded worker concurrency, queued rather than the old global 429 lock.
 * Identical requests are deduplicated in service; different owners never share
 * persisted state. The replay's CPU work cannot block the HTTP event loop. */
export function calculateInWorker(world: World, input: CommercialInput): Promise<Calculation> {
  return new Promise((resolve, reject) => {
    if (queue.length >= 16) { reject(new CommercialBusyError()); return; }
    queue.push({ world, input, resolve, reject }); drain();
  });
}
function drain() {
  while (active < 2 && queue.length) {
    const job = queue.shift()!;
    const compiled = resolve("dist/commercial-availability-worker.cjs");
    let worker: Worker;
    try {
    worker = existsSync(compiled) && process.env.NODE_ENV === "production"
      ? new Worker(compiled)
      : new Worker(`
          const { tsImport } = require("tsx/esm/api");
          tsImport(${JSON.stringify(pathToFileURL(resolve("server/modules/planning/commercial-availability/worker.ts")).href)}, ${JSON.stringify(pathToFileURL(resolve("package.json")).href)});
        `, { eval: true });
    } catch {
      job.reject(new Error("Impossibile avviare il calcolo commerciale"));
      continue;
    }
    active++;
    let settled = false;
    const finish = (error?: Error, result?: Calculation) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      void worker.terminate();
      active--;
      if (error) job.reject(error); else job.resolve(result!);
      drain();
    };
    const timer = setTimeout(() => finish(new Error("Calcolo troppo complesso: ridurre taglie o orizzonte e riprovare")), 75_000);
    worker.once("message", message => finish(message.error ? new Error(message.error) : undefined, message.result));
    worker.once("error", () => finish(new Error("Impossibile avviare il calcolo commerciale")));
    worker.once("exit", code => { if (!settled) finish(new Error(`Calcolo commerciale interrotto (${code})`)); });
    try { worker.postMessage({ world: job.world, input: job.input }); }
    catch { finish(new Error("Impossibile preparare il calcolo commerciale")); }
  }
}