export interface CurrentOrderCoverage {
  available: boolean;
  requested: number | null;
  covered: number | null;
  uncovered: number | null;
  percent: number | null;
  complete: boolean;
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
