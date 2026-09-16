export function calculateFulfillableProductionForecast(
  productionForecast: number,
  availableTargetStock: number,
): number {
  return Math.min(
    Math.max(0, productionForecast),
    Math.max(0, availableTargetStock),
  );
}

export function addForecastAllocationToLedger(
  previousCommittedOrSeeded: number,
  fulfillableForecast: number,
  sandNurserySeeding: number,
): number {
  return Math.max(0, previousCommittedOrSeeded)
    + Math.max(0, fulfillableForecast)
    + Math.max(0, sandNurserySeeding);
}

export function getProductionTargetCategory(
  targetMaxAnimalsPerKg: number,
): "T3" | "T10" {
  return targetMaxAnimalsPerKg < 6_000 ? "T10" : "T3";
}