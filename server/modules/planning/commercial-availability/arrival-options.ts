import type { HatcheryArrivalPlan } from "../hatchery-arrival-policy";

/** Adjust future residuals only; actual inventory is not part of this function. */
export function scenarioArrivalPlans(
  plans: HatcheryArrivalPlan[], includeHatchery: boolean,
  overrides: { year: number; month: number; quantity: number }[],
): HatcheryArrivalPlan[] {
  if (!includeHatchery) return [];
  const result = plans.map(p => ({ ...p }));
  for (const override of overrides) {
    const index = result.findIndex(p => p.year === override.year && p.month === override.month);
    const replacement = { ...override, arrivalDate: new Date(override.year, override.month - 1, 15) };
    if (index >= 0) result[index] = replacement; else result.push(replacement);
  }
  return result;
}