export type SaleBagInput = {
  animalCount: number;
  allocations?: Array<{
    sourceOperationId: number;
    sourceBasketId: number;
    allocatedAnimals: number;
  }>;
};

export type SourceKeyInput = {
  operationId: number;
  basketId: number;
  originalAnimals?: number | null;
};

export function validateManualSaleBags(
  bags: SaleBagInput[],
  allowedSources: SourceKeyInput[]
): string | null {
  const allowed = new Set(
    allowedSources.map(source => `${source.operationId}:${source.basketId}`)
  );

  for (const [index, bag] of bags.entries()) {
    const animalCount = Number(bag.animalCount);
    const allocations = Array.isArray(bag.allocations) ? bag.allocations : [];
    const allocatedTotal = allocations.reduce(
      (sum, allocation) => sum + Number(allocation.allocatedAnimals || 0),
      0
    );

    if (!Number.isInteger(animalCount) || animalCount <= 0) {
      return `Il sacco ${index + 1} ha un numero animali non valido`;
    }
    if (allocations.length === 0 || allocatedTotal !== animalCount) {
      return `Le allocazioni del sacco ${index + 1} non corrispondono al totale animali`;
    }
    for (const allocation of allocations) {
      const quantity = Number(allocation.allocatedAnimals);
      const sourceKey = `${Number(allocation.sourceOperationId)}:${Number(allocation.sourceBasketId)}`;
      if (!allowed.has(sourceKey) || !Number.isInteger(quantity) || quantity <= 0) {
        return `Il sacco ${index + 1} contiene un'allocazione non valida o estranea alla vendita`;
      }
    }
  }

  return null;
}

export function validateBasketAllocationLimits(
  bags: SaleBagInput[],
  sources: SourceKeyInput[],
  inventoryDifference: number
): string | null {
  const allocated = new Map<number, number>();
  for (const bag of bags) {
    for (const allocation of bag.allocations || []) {
      allocated.set(
        allocation.sourceBasketId,
        (allocated.get(allocation.sourceBasketId) || 0) + Number(allocation.allocatedAnimals || 0)
      );
    }
  }
  const orderedSources = [...sources].sort((a, b) => a.basketId - b.basketId);
  const surplusShares = inventoryDifference > 0
    ? allocateIntegerByWeight(inventoryDifference, orderedSources.map(source => ({
        basketId: source.basketId,
        weight: Number(source.originalAnimals || 0)
      })))
    : [];
  const surplusByBasket = new Map(surplusShares.map(item => [item.basketId, item.quantity]));
  for (const source of sources) {
    const allowed = Number(source.originalAnimals || 0) + (surplusByBasket.get(source.basketId) || 0);
    if ((allocated.get(source.basketId) || 0) > allowed) {
      return `La cesta ${source.basketId} supera la disponibilità fotografata nella vendita`;
    }
  }
  return null;
}

export function allocateIntegerByWeight<T extends { weight: number }>(
  total: number,
  shares: T[]
): Array<T & { quantity: number }> {
  const weightTotal = shares.reduce((sum, item) => sum + Number(item.weight || 0), 0);
  if (!Number.isInteger(total) || total < 0 || shares.length === 0 || weightTotal <= 0) {
    return [];
  }

  let assigned = 0;
  return shares.map((item, index) => {
    const quantity = index === shares.length - 1
      ? total - assigned
      : Math.floor(total * (item.weight / weightTotal));
    assigned += quantity;
    return { ...item, quantity };
  });
}

export function buildCycleCode(
  physicalNumber: number,
  flupsyId: number,
  startDate: string
): string {
  return `${physicalNumber}-${flupsyId}-${startDate.substring(2, 4)}${startDate.substring(5, 7)}`;
}

export function getRestoreBlockReason(source: {
  physicalNumber: number;
  basketState: string;
  currentCycleId: number | null;
  cycleState: string;
  cycleId: number;
  hasLaterCycle?: boolean;
}): string | null {
  if (source.basketState !== 'available' || source.currentCycleId !== null) {
    return `La cesta ${source.physicalNumber} è già stata riutilizzata e non può essere ripristinata`;
  }
  if (source.hasLaterCycle) {
    return `La cesta ${source.physicalNumber} è già stata riutilizzata in un ciclo successivo e non può essere ripristinata`;
  }
  if (source.cycleState !== 'closed') {
    return `Il ciclo ${source.cycleId} non è chiuso e non può essere ripristinato in sicurezza`;
  }
  return null;
}