import type { EventEmitter } from "node:events";

/**
 * Idle connection errors are emitted by pg pools outside an awaited query.
 * Handle them without logging the error/client objects (which contain secrets).
 * Failed active queries still reject normally; no query is retried here.
 */
export function handleIdlePoolErrors(
  pool: Pick<EventEmitter, "on">,
  log: (message: string) => void = console.error,
) {
  pool.on("error", () => {
    log("[database] Connessione inattiva interrotta; il pool la sostituirà alla prossima richiesta.");
  });
}