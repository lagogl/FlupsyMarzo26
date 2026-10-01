export const PLANNING_TABLE_PREFERENCES_KEY = "growth-projection:scostamenti:table-preferences";

export type TableOrientation = "indicators-rows" | "months-rows";
export interface PlanningTablePreferences {
  hiddenRows: Set<string>;
  orientation: TableOrientation;
}
type PreferenceStorage = Pick<Storage, "getItem" | "setItem">;

export function readPlanningTablePreferences(storage?: PreferenceStorage): PlanningTablePreferences {
  const defaults: PlanningTablePreferences = { hiddenRows: new Set(), orientation: "indicators-rows" };
  try {
    const raw = (storage ?? window.localStorage).getItem(PLANNING_TABLE_PREFERENCES_KEY);
    if (raw === null) return defaults;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") throw new Error("Invalid preferences");
    const saved = value as Record<string, unknown>;
    if (!Array.isArray(saved.hiddenRows) || !saved.hiddenRows.every(key => typeof key === "string") ||
      (saved.orientation !== "indicators-rows" && saved.orientation !== "months-rows")) {
      throw new Error("Invalid preferences");
    }
    return { hiddenRows: new Set(saved.hiddenRows), orientation: saved.orientation };
  } catch {
    console.warn("Impossibile leggere le preferenze della tabella Scostamenti.");
    return defaults;
  }
}

export function savePlanningTablePreferences(preferences: PlanningTablePreferences, storage?: PreferenceStorage): boolean {
  try {
    (storage ?? window.localStorage).setItem(PLANNING_TABLE_PREFERENCES_KEY, JSON.stringify({
      hiddenRows: [...preferences.hiddenRows],
      orientation: preferences.orientation,
    }));
    return true;
  } catch {
    console.warn("Impossibile salvare le preferenze della tabella Scostamenti.");
    return false;
  }
}