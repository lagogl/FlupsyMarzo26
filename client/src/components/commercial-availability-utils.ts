import type { ScenarioInput, ScenarioMonth } from "@shared/sales-scenarios";

export type CommercialSize = { id: number; code: string; name: string; pricePerThousand: number | null };
export type AcquiredOrderCommitment = {
  animals: number;
  valueEuro: number | null;
  valuedAnimals: number;
  missingValueAnimals: number;
};

/** Keeps the matrix usable while older scenario responses do not yet carry commitments. */
export function orderCommitmentForMonth(month: ScenarioMonth): AcquiredOrderCommitment | null {
  const commitment = (month as ScenarioMonth & { orderCommitment?: AcquiredOrderCommitment }).orderCommitment;
  return commitment && Number.isFinite(commitment.animals)
    ? commitment
    : null;
}

export function priceForSize(size: CommercialSize, draft: Pick<ScenarioInput, "proposalPrices">): number | null {
  const explicit = draft.proposalPrices.find((price) => price.sizeId === size.id);
  return explicit ? explicit.pricePerThousand : size.pricePerThousand;
}

export function estimatedSalesValue(animals: number, pricePerThousand: number | null): number | null {
  return pricePerThousand === null || !Number.isFinite(pricePerThousand) ? null : animals / 1000 * pricePerThousand;
}

export function availabilityForSize(month: ScenarioMonth, size: CommercialSize): number {
  return month.availableBySize[String(size.id)] ?? month.availableBySize[size.code] ?? 0;
}

/** Null means the result predates this calculation; a missing size in a
 * current result means zero stock, not missing data. */
export function stockBeforeOrdersForSize(month: ScenarioMonth, size: CommercialSize): number | null {
  const stock = month.stockBeforeOrdersBySize;
  return stock ? stock[String(size.id)] ?? 0 : null;
}

export function peakAlternativeOpportunity(months: ScenarioMonth[], sizes: CommercialSize[], draft: Pick<ScenarioInput, "proposalPrices">) {
  return months.flatMap((month) => sizes.map((size) => {
    const animals = availabilityForSize(month, size);
    return { month, size, animals, value: estimatedSalesValue(animals, priceForSize(size, draft)) };
  })).filter((opportunity) => opportunity.animals > 0).reduce<{ month: ScenarioMonth; size: CommercialSize; animals: number; value: number | null } | null>(
    (peak, current) => !peak || current.animals > peak.animals ? current : peak,
    null,
  );
}