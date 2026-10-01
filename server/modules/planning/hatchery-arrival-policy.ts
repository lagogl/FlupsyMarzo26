import {
  getHatcheryArrivalDate,
  getProjectionSimulationDays,
  getSimulatedHatcheryQuantity,
  selectActualArrivedQuantity,
  type ProjectionMonth,
} from "./growth-projection/growth-projection-simulation";

export { getProjectionSimulationDays };

export interface HatcheryForecastRow extends ProjectionMonth {
  quantity: number;
  actualQuantity: number | null;
}

export interface HatcheryActualRow extends ProjectionMonth {
  total: number;
  lotCount: number;
}

export interface HatcheryArrivalPlan extends ProjectionMonth {
  quantity: number;
  arrivalDate: Date;
}

/**
 * One monthly balance, regardless of forecast category. Actuals are original
 * lot arrival quantities through the snapshot, never the surviving inventory.
 */
export function resolveHatcheryArrivalPlans(
  forecasts: readonly HatcheryForecastRow[],
  actuals: readonly HatcheryActualRow[],
  referenceDate: Date,
): HatcheryArrivalPlan[] {
  const months = new Map<string, ProjectionMonth & { forecast: number; manual: number | null }>();
  for (const row of forecasts) {
    const key = `${row.year}-${row.month}`;
    const month = months.get(key) ?? { year: row.year, month: row.month, forecast: 0, manual: null };
    month.forecast += row.quantity;
    if (row.actualQuantity != null) month.manual = (month.manual ?? 0) + row.actualQuantity;
    months.set(key, month);
  }
  const live = new Map(actuals.map(row => [`${row.year}-${row.month}`, row]));
  return [...months.values()]
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .map(month => {
      const actual = live.get(`${month.year}-${month.month}`);
      const arrived = selectActualArrivedQuantity(month.manual, actual?.total ?? null, actual?.lotCount ?? 0);
      return {
        year: month.year,
        month: month.month,
        quantity: getSimulatedHatcheryQuantity(month, referenceDate, month.forecast, arrived),
        arrivalDate: getHatcheryArrivalDate(month),
      };
    });
}

/** Biology starts after both the measured snapshot and the virtual entry. */
export function getHatcheryBiologyDays(
  month: ProjectionMonth,
  referenceDate: Date,
  arrivalDate?: Date,
): Date[] {
  const dates = getProjectionSimulationDays(month, referenceDate);
  return arrivalDate ? dates.filter(date => date.getTime() > arrivalDate.getTime()) : dates;
}