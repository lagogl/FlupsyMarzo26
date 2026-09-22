export function calculateFulfillableProductionForecast(
  productionForecast: number,
  availableTargetStock: number,
): number {
  return Math.min(
    Math.max(0, productionForecast),
    Math.max(0, availableTargetStock),
  );
}

export function calculateSandNurserySeeding(
  requestedSeeding: number,
  availableAfterForecast: number,
): number {
  return Math.min(
    Math.max(0, requestedSeeding),
    Math.max(0, availableAfterForecast),
  );
}

interface ForecastBasket {
  animalCount: number;
}

function consumeAnimals(baskets: ForecastBasket[], requested: number): number {
  let remaining = Math.max(0, requested);
  let consumed = 0;
  for (const basket of baskets) {
    if (remaining <= 0) break;
    const quantity = Math.min(Math.max(0, basket.animalCount), remaining);
    basket.animalCount -= quantity;
    remaining -= quantity;
    consumed += quantity;
  }
  return consumed;
}

export function allocateForecastAndSandNursery(
  eligibleBaskets: ForecastBasket[],
  fulfillableForecast: number,
  requestedSeeding: number,
): { forecastAllocated: number; seedingApplied: number; remaining: number } {
  const forecastAllocated = consumeAnimals(eligibleBaskets, fulfillableForecast);
  const availableAfterForecast = eligibleBaskets.reduce(
    (sum, basket) => sum + Math.max(0, basket.animalCount),
    0,
  );
  const seedingApplied = calculateSandNurserySeeding(
    requestedSeeding,
    availableAfterForecast,
  );
  consumeAnimals(eligibleBaskets, seedingApplied);
  const remaining = eligibleBaskets.reduce(
    (sum, basket) => sum + Math.max(0, basket.animalCount),
    0,
  );
  return { forecastAllocated, seedingApplied, remaining };
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