import test from "node:test";
import assert from "node:assert/strict";
import { calculateScenarioComparison, comparisonErrorMessage } from "./sales-scenario-comparison";
import type { SavedScenario, ScenarioResult } from "@shared/sales-scenarios";

const scenarios = [
  { id: 1, name: "Uno", input: { name: "Uno" } },
  { id: 2, name: "Due", input: { name: "Due" } },
] as Pick<SavedScenario, "id" | "name" | "input">[];

test("comparison simulates selected scenarios one at a time and reports progress", async () => {
  let running = 0;
  const progress: string[] = [];
  const results = await calculateScenarioComparison(scenarios, async (input) => {
    assert.equal(running, 0, "a previous simulation must finish first");
    running++;
    await Promise.resolve();
    running--;
    return { generatedAt: input.name } as ScenarioResult;
  }, (index, total, name) => progress.push(`${index}/${total} ${name}`));

  assert.deepEqual(progress, ["1/2 Uno", "2/2 Due"]);
  assert.equal(results[1].generatedAt, "Uno");
  assert.equal(results[2].generatedAt, "Due");
});

test("comparison stops on failure instead of showing incomplete results", async () => {
  const called: string[] = [];
  await assert.rejects(calculateScenarioComparison(scenarios, async (input) => {
    called.push(input.name);
    throw new Error('429: {"message":"Un calcolo è già in corso."}');
  }, () => {}), /429/);
  assert.deepEqual(called, ["Uno"]);
  assert.equal(comparisonErrorMessage(new Error('429: {"message":"Un calcolo è già in corso."}')), "Un calcolo è già in corso.");
});