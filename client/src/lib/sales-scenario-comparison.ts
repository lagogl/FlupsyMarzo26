import type { SavedScenario, ScenarioInput, ScenarioResult } from "@shared/sales-scenarios";

export async function calculateScenarioComparison(
  scenarios: Pick<SavedScenario, "id" | "name" | "input">[],
  simulate: (input: ScenarioInput) => Promise<ScenarioResult>,
  onProgress: (index: number, total: number, name: string) => void,
): Promise<Record<number, ScenarioResult>> {
  const results: Record<number, ScenarioResult> = {};
  for (const [index, scenario] of scenarios.entries()) {
    onProgress(index + 1, scenarios.length, scenario.name);
    // The simulation endpoint accepts one calculation at a time.
    results[scenario.id] = await simulate(scenario.input);
  }
  return results;
}

export function comparisonErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Impossibile ricalcolare il confronto. Riprova.";
  const payload = error.message.match(/^\d{3}:\s*(\{.*\})$/s)?.[1];
  if (payload) {
    try {
      const parsed: unknown = JSON.parse(payload);
      if (parsed && typeof parsed === "object" && "message" in parsed && typeof parsed.message === "string") {
        return parsed.message;
      }
    } catch {
      // The response was not JSON; keep the original error text below.
    }
  }
  return error.message;
}