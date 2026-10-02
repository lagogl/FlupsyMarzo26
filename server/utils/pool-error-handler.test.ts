import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { handleIdlePoolErrors } from "./pool-error-handler";

test("idle pool errors do not crash the process or expose connection details", () => {
  const pool = new EventEmitter();
  const messages: string[] = [];
  handleIdlePoolErrors(pool, message => messages.push(message));
  const error = Object.assign(new Error("private connection details"), {
    code: "57P01",
    connection: "private connection string",
  });
  assert.doesNotThrow(() => pool.emit("error", error, { password: "private" }));
  assert.doesNotThrow(() => pool.emit("error", error));
  assert.equal(messages.length, 2);
  assert.ok(messages.every(message => message.includes("Connessione inattiva interrotta")));
  assert.ok(messages.every(message => !message.includes("private")));
});