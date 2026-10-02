export interface ProjectionIndicatorMonth {
  monthLabel: string;
  domandaEffettiva: number;
  ordiniArretrati?: number;
  ordiniEvasi: number;
  arriviSchiuditoio: number;
  arrivalTooLate?: boolean;
  giacenzaLordaInventario: number;
  giacenzaLordaConSchiuditoio: number;
  schiuditoioNecessario: number;
}

export function calculateGrowthProjectionIndicators<T extends ProjectionIndicatorMonth>(months: T[]) {
  const totalDemand = months.reduce((sum, month) => sum + Math.max(0, month.domandaEffettiva || 0), 0);
  const totalFulfilled = months.reduce(
    (sum, month) => sum + Math.min(Math.max(0, month.domandaEffettiva || 0), Math.max(0, month.ordiniEvasi || 0)), 0,
  );

  let peakUncoveredMonth: T | null = null;
  let peakUncovered = 0;
  let hatcheryPeakMonth: T | null = null;
  let hatcheryContribution = 0;

  for (const month of months) {
    const uncovered = Math.max(
      0,
      (month.domandaEffettiva || 0) - (month.ordiniEvasi || 0),
    );
    if (peakUncoveredMonth === null || uncovered > peakUncovered) {
      peakUncoveredMonth = month;
      peakUncovered = uncovered;
    }

    const monthlyHatcheryContribution = Math.max(
      0,
      (month.giacenzaLordaConSchiuditoio || 0) - (month.giacenzaLordaInventario || 0),
    );
    if (hatcheryPeakMonth === null || monthlyHatcheryContribution > hatcheryContribution) {
      hatcheryPeakMonth = month;
      hatcheryContribution = monthlyHatcheryContribution;
    }
  }

  const totalArrivals = months.reduce((sum, month) => sum + (month.arriviSchiuditoio || 0), 0);
  const nextNeededMonth = months.find(month => (month.schiuditoioNecessario || 0) > 0) || null;

  return {
    totalDemand,
    totalFulfilled,
    coverage: totalDemand > 0 ? Math.min(100, (totalFulfilled / totalDemand) * 100) : null,
    peakUncovered,
    peakUncoveredMonth,
    totalArrivals,
    nextNeeded: nextNeededMonth?.schiuditoioNecessario || 0,
    nextNeededMonth,
    lateMonths: months.filter(month => month.arrivalTooLate && (month.arriviSchiuditoio || 0) > 0).length,
    hatcheryContribution,
    hatcheryPeakMonth,
    stockViewsEqual: months.length > 0 && months.every(
      month => month.giacenzaLordaConSchiuditoio === month.giacenzaLordaInventario,
    ),
  };
}