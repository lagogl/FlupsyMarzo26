export interface OrderAllocationBasket {
  animalsPerKg: number;
  animalCount: number;
}

export interface OrderAllocationResult {
  currentFulfilledBySize: Record<string, number>;
  arrearsFulfilledBySize: Record<string, number>;
  endingBacklogBySize: Record<string, number>;
  currentFulfilledTotal: number;
  arrearsStartTotal: number;
  arrearsFulfilledTotal: number;
}

function assertAnimalQuantity(value: number, label: string): void {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a finite non-negative integer`);
  }
}

function normalizedPositiveQuantities(
  quantities: Record<string, number>,
  label: string,
): Record<string, number> {
  const normalized: Record<string, number> = {};
  for (const [size, quantity] of Object.entries(quantities)) {
    assertAnimalQuantity(quantity, `${label} for ${size}`);
    if (quantity > 0) normalized[size] = quantity;
  }
  return normalized;
}

function compareSizeCode(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Allocates one month's physical stock once across all current orders and
 * carried arrears. Backlog is served first, then each order class from the
 * physically hardest size (lowest max APK) to the easiest. Within an order,
 * least-mature eligible fish (highest APK) are consumed first.
 */
export function allocateOrdersAgainstBaskets(
  baskets: OrderAllocationBasket[],
  currentOrdersBySize: Record<string, number>,
  backlogBySize: Record<string, number>,
  maxAnimalsPerKgBySize: Record<string, number | undefined>,
): OrderAllocationResult {
  for (const [index, basket] of baskets.entries()) {
    assertAnimalQuantity(basket.animalCount, `Basket ${index} animal count`);
    if (!Number.isFinite(basket.animalsPerKg) || basket.animalsPerKg <= 0) {
      throw new Error(`Basket ${index} has invalid animals-per-kg value`);
    }
  }

  const currentOrders = normalizedPositiveQuantities(currentOrdersBySize, "Current order");
  const startingBacklog = normalizedPositiveQuantities(backlogBySize, "Order backlog");
  for (const [size, maxApk] of Object.entries(maxAnimalsPerKgBySize)) {
    if (maxApk !== undefined && (!Number.isFinite(maxApk) || maxApk <= 0)) {
      throw new Error(`Invalid active max animals-per-kg range for ${size}`);
    }
  }

  const currentFulfilledBySize: Record<string, number> = {};
  const arrearsFulfilledBySize: Record<string, number> = {};
  const endingBacklogBySize: Record<string, number> = {};

  const allocateDemand = (
    demandBySize: Record<string, number>,
    fulfilledBySize: Record<string, number>,
  ) => {
    const demandSizes = Object.keys(demandBySize).sort((a, b) => {
      const rangeA = maxAnimalsPerKgBySize[a];
      const rangeB = maxAnimalsPerKgBySize[b];
      if (rangeA === undefined) return rangeB === undefined ? compareSizeCode(a, b) : 1;
      if (rangeB === undefined) return -1;
      return rangeA - rangeB || compareSizeCode(a, b);
    });

    for (const size of demandSizes) {
      const maxApk = maxAnimalsPerKgBySize[size];
      let remaining = demandBySize[size];
      let fulfilled = 0;
      if (maxApk !== undefined) {
        const eligibleBaskets = baskets
          .map((basket, index) => ({ basket, index }))
          .filter(({ basket }) =>
            basket.animalCount > 0 && basket.animalsPerKg <= maxApk,
          )
          .sort((a, b) =>
            b.basket.animalsPerKg - a.basket.animalsPerKg || a.index - b.index,
          );

        for (const { basket } of eligibleBaskets) {
          if (remaining === 0) break;
          const allocated = Math.min(basket.animalCount, remaining);
          basket.animalCount -= allocated;
          remaining -= allocated;
          fulfilled += allocated;
        }
      }
      fulfilledBySize[size] = fulfilled;
      if (remaining > 0) endingBacklogBySize[size] =
        (endingBacklogBySize[size] ?? 0) + remaining;
    }
  };

  allocateDemand(startingBacklog, arrearsFulfilledBySize);
  allocateDemand(currentOrders, currentFulfilledBySize);

  const arrearsStartTotal = Object.values(startingBacklog).reduce((sum, qty) => sum + qty, 0);
  const arrearsFulfilledTotal = Object.values(arrearsFulfilledBySize).reduce((sum, qty) => sum + qty, 0);
  const currentFulfilledTotal = Object.values(currentFulfilledBySize).reduce((sum, qty) => sum + qty, 0);

  return {
    currentFulfilledBySize,
    arrearsFulfilledBySize,
    endingBacklogBySize,
    currentFulfilledTotal,
    arrearsStartTotal,
    arrearsFulfilledTotal,
  };
}