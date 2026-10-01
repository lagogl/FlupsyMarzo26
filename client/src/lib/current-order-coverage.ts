export interface CurrentOrderCoverage {
  available: boolean;
  requested: number | null;
  covered: number | null;
  uncovered: number | null;
  percent: number | null;
  complete: boolean;
}

export interface DeliveryOrderCoverageMetrics {
  requested: number;
  covered: number;
  uncovered: number;
  arrearsFulfilled: number;
  unverifiable: number;
}

/**
 * Calculates coverage using the actual allocation for current-month orders.
 * Missing or invalid data stays unavailable instead of being treated as zero.
 */
export function getCurrentOrderCoverage(
  requested: number | null | undefined,
  allocated: number | null | undefined,
): CurrentOrderCoverage {
  if (
    typeof requested !== "number" ||
    !Number.isFinite(requested) ||
    requested < 0 ||
    typeof allocated !== "number" ||
    !Number.isFinite(allocated) ||
    allocated < 0
  ) {
    return {
      available: false,
      requested: null,
      covered: null,
      uncovered: null,
      percent: null,
      complete: false,
    };
  }

  const covered = Math.min(requested, allocated);
  const uncovered = requested - covered;
  return {
    available: true,
    requested,
    covered,
    uncovered,
    percent: requested > 0 ? (covered / requested) * 100 : null,
    complete: requested > 0 && uncovered === 0,
  };
}

function unavailableDeliveryCoverage(): DeliveryOrderCoverage {
  return {
    available: false,
    requested: null,
    covered: null,
    uncovered: null,
    percent: null,
    complete: false,
    arrearsFulfilled: null,
    unverifiable: null,
  };
}

function isDeliveryOrderCoverageMetrics(value: unknown): value is DeliveryOrderCoverageMetrics {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const metrics = value as Record<string, unknown>;
  return ["requested", "covered", "uncovered", "arrearsFulfilled", "unverifiable"].every(key =>
    typeof metrics[key] === "number" &&
    Number.isFinite(metrics[key]) &&
    Number.isInteger(metrics[key]) &&
    (metrics[key] as number) >= 0
  );
}

export interface DeliveryOrderCoverageData extends DeliveryOrderCoverageMetrics {
  bySize: Record<string, DeliveryOrderCoverageMetrics>;
}

/**
 * Reads the separate order-by-deadline calculation. Missing/malformed API data
 * stays unavailable; in particular, it must never be mistaken for zero demand.
 */
export function getDeliveryOrderCoverage(
  data: DeliveryOrderCoverageData | null | undefined,
  size?: string,
): DeliveryOrderCoverage {
  if (
    !data ||
    typeof data !== "object" ||
    !data.bySize ||
    typeof data.bySize !== "object" ||
    Array.isArray(data.bySize)
  ) return unavailableDeliveryCoverage();

  let metrics: unknown = data;
  if (size !== undefined) {
    metrics = Object.prototype.hasOwnProperty.call(data.bySize, size)
      ? data.bySize[size]
      : { requested: 0, covered: 0, uncovered: 0, arrearsFulfilled: 0, unverifiable: 0 };
  }
  if (
    !isDeliveryOrderCoverageMetrics(metrics) ||
    metrics.covered > metrics.requested ||
    metrics.uncovered !== metrics.requested - metrics.covered
  ) return unavailableDeliveryCoverage();

  const coverage = getCurrentOrderCoverage(metrics.requested, metrics.covered);
  if (!coverage.available) return unavailableDeliveryCoverage();
  return {
    ...coverage,
    arrearsFulfilled: metrics.arrearsFulfilled,
    unverifiable: metrics.unverifiable,
  };
}

/**
 * The API reports orders whose month cannot be established separately from
 * per-month deadline coverage. Invalid/missing values remain unavailable.
 */
export function getDeliveryCoverageUnverifiable(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) &&
    Number.isInteger(value) && value >= 0
    ? value
    : null;
}

export interface DeliveryOrderCoverage extends CurrentOrderCoverage {
  arrearsFulfilled: number | null;
  unverifiable: number | null;
}
