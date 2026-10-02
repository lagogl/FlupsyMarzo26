import type { CommercialMonth, CommercialCellShortfall } from "@shared/commercial-availability";

export function cellShortfall(month: CommercialMonth, sizeId: number): CommercialCellShortfall | undefined {
  return month.shortfallsBySize?.[String(sizeId)];
}

/** Absence in a historical result is not evidence of zero deaths. */
export function cellMortality(month: CommercialMonth, sizeId: number): number | undefined {
  const value = month.mortalityBySize?.[String(sizeId)];
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
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