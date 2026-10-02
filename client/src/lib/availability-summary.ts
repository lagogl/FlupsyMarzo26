import { getCurrentOrderCoverage } from "./current-order-coverage";

export interface AvailabilityMonth {
  ordiniBySize?: Record<string, number>;
  ordiniEvasiBySize?: Record<string, number>;
  ordiniEvasiTotali?: number;
  ordiniArretratiBySize?: Record<string, number>;
  ordiniArretratiEvasiBySize?: Record<string, number>;
}

export function orderedSizes(...maps: Array<Record<string, number> | undefined>): string[] {
  const sizes = new Set(maps.flatMap(map => map && typeof map === "object" && !Array.isArray(map) ? Object.keys(map) : []));
  return [...sizes].sort((a, b) => (parseInt(a.replace(/\D/g, ""), 10) || 0) - (parseInt(b.replace(/\D/g, ""), 10) || 0));
}

function isQuantity(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isQuantityMap(map: unknown): map is Record<string, number> {
  return !!map && typeof map === "object" && !Array.isArray(map) &&
    Object.values(map).every(isQuantity);
}

export function summarizeCoverage(month: AvailabilityMonth) {
  const sizes = orderedSizes(month.ordiniBySize);
  if (!isQuantityMap(month.ordiniBySize) || !isQuantity(month.ordiniEvasiTotali)) {
    return { available: false as const, requested: null, assigned: null, uncovered: null, bySize: [] as Array<{ size: string; requested: number | null; assigned: number | null; uncovered: number | null }> };
  }
  const requested = sizes.reduce((sum, size) => sum + month.ordiniBySize![size], 0);
  const total = getCurrentOrderCoverage(requested, month.ordiniEvasiTotali);
  const hasAllocations = isQuantityMap(month.ordiniEvasiBySize);
  const bySize = sizes.map(size => {
    const assigned = hasAllocations ? month.ordiniEvasiBySize![size] ?? 0 : undefined;
    const coverage = getCurrentOrderCoverage(month.ordiniBySize?.[size], assigned);
    // Demand remains known even when the allocation detail is unavailable.
    return { size, requested: month.ordiniBySize![size], assigned: coverage.covered, uncovered: coverage.uncovered };
  });
  return { available: total.available, requested: total.requested, assigned: total.covered, uncovered: total.uncovered, bySize };
}

// Legacy-only reader: preserve frozen historical values, never use for future quota demand.
export function summarizeArrears(month: AvailabilityMonth) {
  const sizes = orderedSizes(month.ordiniArretratiBySize, month.ordiniArretratiEvasiBySize);
  if (!isQuantityMap(month.ordiniArretratiBySize) || !isQuantityMap(month.ordiniArretratiEvasiBySize)) {
    return { available: false as const, entering: null, recovered: null, open: null, bySize: [] as Array<{ size: string; entering: number | null; recovered: number | null; open: number | null }> };
  }
  const bySize = sizes.map(size => {
    const entering = month.ordiniArretratiBySize![size] ?? 0;
    const recovered = month.ordiniArretratiEvasiBySize![size] ?? 0;
    const valid = recovered <= entering;
    return { size, entering: valid ? entering : null, recovered: valid ? recovered : null, open: valid ? entering - recovered : null };
  });
  const validRows = bySize.every(row => row.open !== null);
  return {
    available: validRows,
    entering: validRows ? bySize.reduce((sum, row) => sum + row.entering!, 0) : null,
    recovered: validRows ? bySize.reduce((sum, row) => sum + row.recovered!, 0) : null,
    open: validRows ? bySize.reduce((sum, row) => sum + row.open!, 0) : null,
    bySize,
  };
}