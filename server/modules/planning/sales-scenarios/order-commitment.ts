import type { ScenarioMonth } from "../../../../shared/sales-scenarios";

export interface CommitmentOrderInput {
  quantity: number;
  deliveryMonth: number;
  total: unknown;
  currency: unknown;
}

type OrderCommitment = NonNullable<ScenarioMonth["orderCommitment"]>;

/** Aggregate full acquired-order headers by their scenario delivery month. */
export function aggregateOrderCommitments(
  orders: readonly CommitmentOrderInput[],
  firstMonth: number,
): Record<number, OrderCommitment> {
  const aggregates = new Map<number, {
    animals: number;
    valuedAnimals: number;
    missingValueAnimals: number;
    valueSum: number;
    hasInvalidValue: boolean;
  }>();

  for (const order of orders) {
    if (!(order.quantity > 0)) continue;
    const month = Math.max(firstMonth, order.deliveryMonth);
    const currency = String(order.currency ?? "").trim().toUpperCase();
    const total = Number(order.total);
    const validEuroValue = currency === "EUR" && Number.isFinite(total) && total > 0;
    const aggregate = aggregates.get(month) ?? {
      animals: 0, valuedAnimals: 0, missingValueAnimals: 0, valueSum: 0, hasInvalidValue: false,
    };
    aggregate.animals += order.quantity;
    if (validEuroValue) {
      aggregate.valuedAnimals += order.quantity;
      aggregate.valueSum += total;
    } else {
      aggregate.missingValueAnimals += order.quantity;
      aggregate.hasInvalidValue = true;
    }
    aggregates.set(month, aggregate);
  }

  return Object.fromEntries([...aggregates.entries()].map(([month, aggregate]) => [
    month,
    {
      animals: aggregate.animals,
      valueEuro: aggregate.hasInvalidValue ? null : aggregate.valueSum,
      valuedAnimals: aggregate.valuedAnimals,
      missingValueAnimals: aggregate.missingValueAnimals,
    },
  ]));
}