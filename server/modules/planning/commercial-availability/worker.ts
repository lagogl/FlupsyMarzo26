import { parentPort } from "node:worker_threads";
import { computeCommercial } from "./compute";

parentPort!.on("message", ({ world, input }) => {
  try {
    world.deadlineMs = Date.now() + 60_000;
    parentPort!.postMessage({ result: computeCommercial(world, input) });
  } catch (error) {
    parentPort!.postMessage({ error: error instanceof Error ? error.message : "Calcolo non riuscito" });
  }
});