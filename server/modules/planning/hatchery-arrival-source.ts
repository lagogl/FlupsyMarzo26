import { inArray, sql } from "drizzle-orm";
import { db } from "../../db";
import { hatcheryArrivals } from "../../../shared/schema";
import { formatProjectionBusinessDate } from "./growth-projection/growth-projection-simulation";
import { resolveHatcheryArrivalPlans, type HatcheryActualRow, type HatcheryArrivalPlan } from "./hatchery-arrival-policy";

/** Read-only: forecast rows and original lot counts as of the reference date. */
export async function loadHatcheryArrivalPlans(
  years: number[],
  referenceDate: Date,
): Promise<HatcheryArrivalPlan[]> {
  if (!years.length) return [];
  const [forecasts, live] = await Promise.all([
    db.select().from(hatcheryArrivals).where(inArray(hatcheryArrivals.year, years)),
    db.execute(sql`
      SELECT EXTRACT(YEAR FROM arrival_date)::int AS year,
             EXTRACT(MONTH FROM arrival_date)::int AS month,
             COALESCE(SUM(animal_count), 0)::bigint AS total,
             COUNT(*)::int AS lot_count
      FROM lots
      WHERE EXTRACT(YEAR FROM arrival_date)::int IN (${sql.join(years.map(year => sql`${year}`), sql`, `)})
        AND arrival_date <= ${formatProjectionBusinessDate(referenceDate)}::date
      GROUP BY 1, 2
    `),
  ]);
  const actuals: HatcheryActualRow[] = (live.rows as Record<string, unknown>[]).map(row => ({
    year: Number(row.year),
    month: Number(row.month),
    total: Number(row.total),
    lotCount: Number(row.lot_count),
  }));
  return resolveHatcheryArrivalPlans(forecasts, actuals, referenceDate);
}