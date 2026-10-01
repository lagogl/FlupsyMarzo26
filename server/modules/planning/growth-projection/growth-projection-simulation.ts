export interface ProjectionMonth {
  year: number;
  month: number;
}

export interface ProjectionBasket {
  weightMg: number;
  animalCount: number;
  growthStartsAfter?: Date;
}

export interface BasketStepResult {
  weightMg: number;
  count: number;
}

function monthOrdinal({ year, month }: ProjectionMonth): number {
  return year * 12 + month - 1;
}

export function compareProjectionMonths(a: ProjectionMonth, b: ProjectionMonth): number {
  return monthOrdinal(a) - monthOrdinal(b);
}

export function projectionMonthOf(date: Date): ProjectionMonth {
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function projectionMonthDate(month: ProjectionMonth, day = 1): Date {
  return new Date(month.year, month.month - 1, day);
}

export function formatProjectionBusinessDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Return simulation dates after the measured snapshot. Past months are not
 * replayed, the reference month starts tomorrow, and future months start on 1.
 */
export function getProjectionSimulationDays(
  month: ProjectionMonth,
  referenceDate: Date,
): Date[] {
  const relation = compareProjectionMonths(month, projectionMonthOf(referenceDate));
  if (relation < 0) return [];

  const firstDay = relation === 0 ? referenceDate.getDate() + 1 : 1;
  const daysInMonth = new Date(month.year, month.month, 0).getDate();
  const dates: Date[] = [];
  for (let day = firstDay; day <= daysInMonth; day++) {
    dates.push(projectionMonthDate(month, day));
  }
  return dates;
}

export function getHatcheryArrivalDate(month: ProjectionMonth): Date {
  return projectionMonthDate(month, 15);
}

/** Unresolved carryover can appear in several alternative delivery scenarios. */
export function mergeAlternativeHatcheryRequirement(
  previousRequirement: number,
  additionalRequirement: number,
): number {
  return Math.max(previousRequirement, additionalRequirement);
}

/**
 * Historical arrivals are already represented by the measured inventory.
 * In the reference month only the not-yet-arrived forecast balance is modeled;
 * future months use the full forecast.
 */
export function getSimulatedHatcheryQuantity(
  month: ProjectionMonth,
  referenceDate: Date,
  forecastQuantity: number,
  actualArrivedQuantity: number,
): number {
  const forecast = Math.max(0, forecastQuantity);
  const relation = compareProjectionMonths(month, projectionMonthOf(referenceDate));
  if (relation < 0) return 0;
  if (relation > 0) return forecast;
  return Math.max(0, forecast - Math.max(0, actualArrivedQuantity));
}

export function selectActualArrivedQuantity(
  manualFallback: number | null,
  liveLotTotal: number | null,
  liveLotCount: number,
): number {
  if (liveLotCount > 0) return Math.max(0, liveLotTotal ?? 0);
  return Math.max(0, manualFallback ?? 0);
}

export function simulateBasketLedgerForMonth<T extends ProjectionBasket>(
  baskets: readonly T[],
  dates: readonly Date[],
  step: (state: { weightMg: number; count: number }, date: Date) => BasketStepResult,
): T[] {
  let result = baskets.map((basket) => ({ ...basket }));
  for (const date of dates) {
    result = result.map((basket) => {
      if (
        basket.growthStartsAfter &&
        date.getTime() <= basket.growthStartsAfter.getTime()
      ) {
        return basket;
      }
      const next = step(
        { weightMg: basket.weightMg, count: basket.animalCount },
        date,
      );
      return {
        ...basket,
        weightMg: next.weightMg,
        animalCount: Math.round(next.count),
      };
    });
  }
  return result;
}

export interface ArrivalGrowthResult {
  reachedTarget: boolean;
  survivalFactor: number;
  reachedDate: Date | null;
}

/**
 * Simulate a TP-300 arrival from the day after its conventional 15th arrival.
 * If the reference month is already at/past the 15th, only snapshot-forward
 * days are modeled; no pre-snapshot growth or mortality is reconstructed.
 */
export function simulateArrivalUntilTarget(
  arrivalMonth: ProjectionMonth,
  deliveryMonth: ProjectionMonth,
  referenceDate: Date,
  initialWeightMg: number,
  step: (state: { weightMg: number; count: number }, date: Date) => BasketStepResult,
  isAtTarget: (weightMg: number, date: Date) => boolean,
): ArrivalGrowthResult {
  if (compareProjectionMonths(arrivalMonth, deliveryMonth) > 0) {
    return { reachedTarget: false, survivalFactor: 1, reachedDate: null };
  }
  if (
    compareProjectionMonths(arrivalMonth, projectionMonthOf(referenceDate)) < 0
  ) {
    return { reachedTarget: false, survivalFactor: 1, reachedDate: null };
  }

  const arrivalDate = getHatcheryArrivalDate(arrivalMonth);
  let weightMg = initialWeightMg;
  let count = 1;
  const effectiveArrivalDate = arrivalDate.getTime() < referenceDate.getTime()
    ? referenceDate
    : arrivalDate;
  if (isAtTarget(weightMg, effectiveArrivalDate)) {
    return { reachedTarget: true, survivalFactor: count, reachedDate: effectiveArrivalDate };
  }
  let month = { ...arrivalMonth };
  while (compareProjectionMonths(month, deliveryMonth) <= 0) {
    const dates = getProjectionSimulationDays(month, referenceDate)
      .filter((date) => date.getTime() > arrivalDate.getTime());
    for (const date of dates) {
      const next = step({ weightMg, count }, date);
      weightMg = next.weightMg;
      count = next.count;
      if (isAtTarget(weightMg, date)) {
        return { reachedTarget: true, survivalFactor: count, reachedDate: date };
      }
    }
    if (month.month === 12) {
      month = { year: month.year + 1, month: 1 };
    } else {
      month = { year: month.year, month: month.month + 1 };
    }
  }

  return { reachedTarget: false, survivalFactor: count, reachedDate: null };
}