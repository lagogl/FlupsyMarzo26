import type { CommercialMonth, CommercialCellShortfall } from "@shared/commercial-availability";

export function cellShortfall(month: CommercialMonth, sizeId: number): CommercialCellShortfall | undefined {
  return month.shortfallsBySize?.[String(sizeId)];
}

/** Absence in a historical result is not evidence of zero deaths. */
export function cellMortality(month: CommercialMonth, sizeId: number): number | undefined {
  const value = month.mortalityBySize?.[String(sizeId)];
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

/** Partition physical deaths once, independently of overlapping sale eligibility. */
export function monthlyMortality(month: CommercialMonth, visibleSizeIds: number[]): {
  total: number; visible: number; other: number; unclassified: number;
} | undefined {
  const deaths = month.mortalityBySize;
  if (!deaths || visibleSizeIds.some(id => cellMortality(month, id) == null)) return undefined;
  // A tracked month omits this field when no deaths are unclassified.
  // The guard above prevents historical/untracked results becoming fake zeros.
  const unclassified = month.unclassifiedMortality ?? 0;
  if (!Number.isFinite(unclassified) || unclassified < 0) return undefined;
  const visibleIds = new Set(visibleSizeIds.map(String));
  let visible = 0, other = 0;
  for (const [id, value] of Object.entries(deaths)) {
    if (!Number.isFinite(value) || value < 0) return undefined;
    if (visibleIds.has(id)) visible += value;
    else other += value;
  }
  return { total: visible + other + unclassified, visible, other, unclassified };
}

/** One linear scale for all displayed cells, including unmet request quantities. */
export function matrixMagnitude(months: CommercialMonth[], sizeIds: number[]): number {
  let max = 0;
  for (const month of months) for (const id of sizeIds) {
    const available = month.availableBySize[String(id)];
    const shortfall = cellShortfall(month, id);
    if (Number.isFinite(available)) max = Math.max(max, available);
    if (shortfall) max = Math.max(max, shortfall.orders + shortfall.sales);
  }
  return max;
}

export function magnitudePercent(quantity: number, maximum: number): number {
  return maximum > 0 ? Math.max(0, Math.min(100, quantity / maximum * 100)) : 0;
}