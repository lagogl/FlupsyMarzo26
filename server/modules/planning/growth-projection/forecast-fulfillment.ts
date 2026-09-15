export function calculateFulfillableProductionForecast(
  productionForecast: number,
  availableTargetStock: number,
): number {
  return Math.min(
    Math.max(0, productionForecast),
    Math.max(0, availableTargetStock),
  );
}