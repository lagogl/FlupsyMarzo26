/** Read-only summaries of the orders ledger; never feed these back into allocation. */
export function snapshotBiologicalAvailability(
  baskets: ReadonlyArray<{ weightMg: number; animalCount: number }>,
  classify: (weightMg: number) => string | null,
): { bySize: Record<string, number>; total: number } {
  const bySize: Record<string, number> = {};
  let total = 0;
  for (const basket of baskets) {
    if (basket.animalCount <= 0) continue;
    // Preserve unclassified animals in an explicit category, not in another size.
    const size = classify(basket.weightMg) ?? "N/D";
    bySize[size] = (bySize[size] ?? 0) + basket.animalCount;
    total += basket.animalCount;
  }
  return { bySize, total };
}

export function summarizeAllocationOrigins(
  targetStockBefore: number,
  targetStockAfter: number,
  totalAssigned: number,
): { fromTargetOrLarger: number; fromBelowTarget: number } {
  const fromTargetOrLarger = targetStockBefore - targetStockAfter;
  const fromBelowTarget = totalAssigned - fromTargetOrLarger;
  if ([fromTargetOrLarger, fromBelowTarget].some(value =>
    !Number.isSafeInteger(value) || value < 0,
  )) {
    throw new Error("Inconsistent monthly allocation origin summary");
  }
  return { fromTargetOrLarger, fromBelowTarget };
}

export type HatcheryRecoveryStatus =
  | "nessuno-scoperto"
  | "recuperabile"
  | "non-recuperabile"
  | "non-verificabile";

export function describeHatcheryRecovery(
  targetGap: number,
  isHistoricalMonth: boolean,
  hasFeasibleArrival: boolean,
): HatcheryRecoveryStatus {
  if (targetGap <= 0) return "nessuno-scoperto";
  if (isHistoricalMonth) return "non-verificabile";
  return hasFeasibleArrival ? "recuperabile" : "non-recuperabile";
}