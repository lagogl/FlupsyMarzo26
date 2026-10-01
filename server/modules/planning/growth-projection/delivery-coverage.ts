import {
  findRangeForSize,
  stepOneDay,
  type GrowthSimulationContext,
} from "../../../services/growth-simulation.service";
import {
  formatProjectionBusinessDate,
  getHatcheryArrivalDate,
  getSimulatedHatcheryQuantity,
  compareProjectionMonths,
  projectionMonthOf,
  simulateBasketLedgerForMonth,
  type ProjectionMonth,
} from "./growth-projection-simulation";
import { allocateOrdersAgainstBaskets } from "./order-allocation";

export interface DeliveryCoverageOrder {
  id: number;
  size: string;
  quantity: number;
  deliveryDate: string | null;
}

export function canonicalDeliveryDate(fields: {
  dataInizioConsegna?: string | null;
  dataConsegna?: string | null;
  dataFineConsegna?: string | null;
}): string | null {
  return fields.dataInizioConsegna || fields.dataConsegna || fields.dataFineConsegna || null;
}

export interface DeliveryCoverageSizeSummary {
  requested: number;
  covered: number;
  uncovered: number;
  arrearsFulfilled: number;
  unverifiable: number;
}

export interface DeliveryCoverageSummary extends DeliveryCoverageSizeSummary {
  bySize: Record<string, DeliveryCoverageSizeSummary>;
}

export interface DeliveryCoverageBasket {
  basketId: number;
  weightMg: number;
  animalCount: number;
  growthStartsAfter?: Date;
}

export interface DeliveryCoverageInput {
  orders: DeliveryCoverageOrder[];
  startingBaskets: DeliveryCoverageBasket[];
  months: ProjectionMonth[];
  referenceDate: Date;
  simulationContext: GrowthSimulationContext;
  hatcheryByYearMonth: Record<string, { actual: number | null; forecast: number }>;
  overrideMonthlyMortality?: number;
}

export interface DeliveryCoverageResult {
  byYearMonth: Record<string, DeliveryCoverageSummary>;
  unknownMonthUnverifiable: number;
}

export function emptyDeliveryCoverageSummary(): DeliveryCoverageSummary {
  return {
    requested: 0,
    covered: 0,
    uncovered: 0,
    arrearsFulfilled: 0,
    unverifiable: 0,
    bySize: {},
  };
}

/** Size identity is permanent; physical ranges are resolved at the deadline. */
export function mapDeliveryOrderSize(
  requestedSize: string | null,
  context: GrowthSimulationContext,
): string | null {
  if (!requestedSize) return null;
  const normalized = requestedSize.toUpperCase().trim().replace(/\s+/g, "").replace(/\./g, "").replace(/,/g, "");
  const catalogCodes = new Set(
    context.allSizes
      .map((size: any) => String(size.code)),
  );
  if (catalogCodes.has(normalized)) return normalized;
  if (!normalized.startsWith("TP-") && normalized.startsWith("TP")) {
    const withDash = `TP-${normalized.substring(2)}`;
    if (catalogCodes.has(withDash)) return withDash;
  }
  const number = Number.parseInt(requestedSize.replace(/\D/g, ""), 10) || 0;
  if (number > 0) {
    const tpName = `TP-${number}`;
    if (catalogCodes.has(tpName)) return tpName;
  }
  return null;
}

function ensureSizeSummary(
  summary: DeliveryCoverageSummary,
  size: string,
): DeliveryCoverageSizeSummary {
  if (!summary.bySize[size]) {
    summary.bySize[size] = {
      requested: 0,
      covered: 0,
      uncovered: 0,
      arrearsFulfilled: 0,
      unverifiable: 0,
    };
  }
  return summary.bySize[size];
}

function addSizeMetric(
  summary: DeliveryCoverageSummary,
  size: string,
  metric: keyof DeliveryCoverageSizeSummary,
  quantity: number,
): void {
  summary[metric] += quantity;
  ensureSizeSummary(summary, size)[metric] += quantity;
}

function validCivilDateKey(value: string | null): string | null {
  if (value === null || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return null;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  return day <= daysInMonth ? value : null;
}

function knownMonthFromDateKey(value: string | null): string | null {
  if (value === null) return null;
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (year < 1 || month < 1 || month > 12) return null;
  return `${year}-${month}`;
}

function monthKey(month: ProjectionMonth): string {
  return `${month.year}-${month.month}`;
}

function nextMonth(month: ProjectionMonth): ProjectionMonth {
  return month.month === 12
    ? { year: month.year + 1, month: 1 }
    : { year: month.year, month: month.month + 1 };
}

function dayAfter(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

function compareDay(a: Date, b: Date): number {
  const keyA = formatProjectionBusinessDate(a);
  const keyB = formatProjectionBusinessDate(b);
  return keyA < keyB ? -1 : keyA > keyB ? 1 : 0;
}

export function getDeliveryCoverageHatcheryYears(
  referenceDate: Date,
  lastMonth: ProjectionMonth | undefined,
): number[] {
  if (!lastMonth || compareProjectionMonths(lastMonth, projectionMonthOf(referenceDate)) < 0) {
    return [];
  }
  return Array.from(
    { length: lastMonth.year - referenceDate.getFullYear() + 1 },
    (_, index) => referenceDate.getFullYear() + index,
  );
}

function assertQuantity(quantity: number, orderId: number): void {
  if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity < 0) {
    throw new Error(`Invalid delivery order quantity for order ${orderId}`);
  }
}

/**
 * Replays a separate daily stock ledger for delivery-date checks. It never
 * mutates the monthly order ledger or the isolated Forecast/Sand Nursery path.
 */
export function calculateDeliveryDateCoverage(
  input: DeliveryCoverageInput,
): DeliveryCoverageResult {
  const byYearMonth: Record<string, DeliveryCoverageSummary> = {};
  const projectionMonths = new Set(input.months.map(monthKey));
  for (const month of input.months) {
    byYearMonth[monthKey(month)] = emptyDeliveryCoverageSummary();
  }
  const lastMonth = input.months[input.months.length - 1];
  if (!lastMonth) return { byYearMonth, unknownMonthUnverifiable: 0 };
  const lastDay = new Date(lastMonth.year, lastMonth.month, 0);
  const lastVisibleDay = formatProjectionBusinessDate(lastDay);

  const dueByDay: Record<string, Record<string, number>> = {};
  let unknownMonthUnverifiable = 0;
  for (const order of input.orders) {
    assertQuantity(order.quantity, order.id);
    if (order.quantity === 0) continue;
    const canonicalDate = validCivilDateKey(order.deliveryDate);
    if (!canonicalDate) {
      const knownMonth = knownMonthFromDateKey(order.deliveryDate);
      if (knownMonth && projectionMonths.has(knownMonth)) {
        addSizeMetric(byYearMonth[knownMonth], order.size, "unverifiable", order.quantity);
      } else if (!knownMonth) {
        unknownMonthUnverifiable += order.quantity;
      }
      continue;
    }

    const orderMonth = knownMonthFromDateKey(canonicalDate)!;
    if (canonicalDate < formatProjectionBusinessDate(input.referenceDate)) {
      if (projectionMonths.has(orderMonth)) {
        addSizeMetric(byYearMonth[orderMonth], order.size, "unverifiable", order.quantity);
      }
      continue;
    }
    if (canonicalDate > lastVisibleDay) continue;
    if (!dueByDay[canonicalDate]) dueByDay[canonicalDate] = {};
    dueByDay[canonicalDate][order.size] =
      (dueByDay[canonicalDate][order.size] ?? 0) + order.quantity;
  }

  const referenceDate = new Date(
    input.referenceDate.getFullYear(),
    input.referenceDate.getMonth(),
    input.referenceDate.getDate(),
  );
  const startMonth = projectionMonthOf(referenceDate);
  if (compareDay(lastDay, referenceDate) < 0) {
    return { byYearMonth, unknownMonthUnverifiable };
  }
  const replayMonths: ProjectionMonth[] = [];
  for (let month = startMonth; month.year < lastMonth.year ||
    (month.year === lastMonth.year && month.month <= lastMonth.month); month = nextMonth(month)) {
    replayMonths.push(month);
  }

  const baskets: DeliveryCoverageBasket[] = input.startingBaskets.map((basket) => ({
    ...basket,
  }));
  let backlogBySize: Record<string, number> = {};
  let nextHatcheryBasketId = 950_000;
  const arrivalsByDay: Record<string, DeliveryCoverageBasket[]> = {};
  for (const month of replayMonths) {
    const hatcheryEntry = input.hatcheryByYearMonth[monthKey(month)];
    if (!hatcheryEntry) continue;
    const quantity = getSimulatedHatcheryQuantity(
      month,
      referenceDate,
      hatcheryEntry.forecast,
      hatcheryEntry.actual ?? 0,
    );
    if (quantity <= 0) continue;

    const arrivalDate = getHatcheryArrivalDate(month);
    const effectiveArrivalDate =
      compareDay(arrivalDate, referenceDate) < 0 ? referenceDate : arrivalDate;
    const dateKey = formatProjectionBusinessDate(effectiveArrivalDate);
    const tp300 = input.simulationContext.allSizes.find((size: any) => size.code === "TP-300");
    const arrivalRange = tp300
      ? findRangeForSize(tp300.id, effectiveArrivalDate, input.simulationContext.sizeRangeVersions)
      : null;
    if (!arrivalRange) {
      throw new Error("TP-300 has no valid range for hatchery delivery coverage");
    }
    if (!arrivalsByDay[dateKey]) arrivalsByDay[dateKey] = [];
    arrivalsByDay[dateKey].push({
      basketId: nextHatcheryBasketId++,
      weightMg: 1_000_000 / arrivalRange.maxAnimalsPerKg,
      animalCount: quantity,
      growthStartsAfter: effectiveArrivalDate,
    });
  }

  let cursor = referenceDate;
  while (compareDay(cursor, lastDay) <= 0) {
    const dateKey = formatProjectionBusinessDate(cursor);
    const isSnapshotDay = compareDay(cursor, referenceDate) === 0;
    const arrivalsToday = arrivalsByDay[dateKey] ?? [];

    // Orders requested on the snapshot day use measured stock only; the
    // forecasted arrival convention must not invent stock for that snapshot.
    if (!isSnapshotDay && arrivalsToday.length > 0) baskets.push(...arrivalsToday);
    if (!isSnapshotDay) {
      const nextBaskets = simulateBasketLedgerForMonth(
        baskets,
        [cursor],
        (state, date) => requireStep(input, state, date),
      );
      baskets.splice(0, baskets.length, ...nextBaskets);
    }

    const currentOrders = dueByDay[dateKey] ?? {};
    const monthSummary = byYearMonth[monthKey(projectionMonthOf(cursor))];
    const maxAnimalsPerKgBySize: Record<string, number | undefined> = {};
    for (const size of new Set([...Object.keys(backlogBySize), ...Object.keys(currentOrders)])) {
      const sizeRow = input.simulationContext.allSizes.find((candidate: any) => candidate.code === size);
      const range = sizeRow
        ? findRangeForSize(sizeRow.id, cursor, input.simulationContext.sizeRangeVersions)
        : null;
      maxAnimalsPerKgBySize[size] = range?.maxAnimalsPerKg;
    }

    if (Object.keys(backlogBySize).length > 0 || Object.keys(currentOrders).length > 0) {
      const allocationBaskets = baskets.map((basket) => ({
        // Remove reciprocal floating point noise at exact physical boundaries.
        animalsPerKg: Math.round((1_000_000 / basket.weightMg) * 1_000_000_000) / 1_000_000_000,
        animalCount: basket.animalCount,
      }));
      const allocation = allocateOrdersAgainstBaskets(
        allocationBaskets,
        currentOrders,
        backlogBySize,
        maxAnimalsPerKgBySize,
      );
      for (let index = 0; index < baskets.length; index++) {
        baskets[index].animalCount = allocationBaskets[index].animalCount;
      }

      if (monthSummary) {
        for (const [size, quantity] of Object.entries(currentOrders)) {
          addSizeMetric(monthSummary, size, "requested", quantity);
          const covered = allocation.currentFulfilledBySize[size] ?? 0;
          addSizeMetric(monthSummary, size, "covered", covered);
          addSizeMetric(monthSummary, size, "uncovered", quantity - covered);
        }
        for (const [size, quantity] of Object.entries(allocation.arrearsFulfilledBySize)) {
          addSizeMetric(monthSummary, size, "arrearsFulfilled", quantity);
        }
      }
      backlogBySize = allocation.endingBacklogBySize;
    }

    // A virtual cohort dated on the snapshot day is introduced only after
    // snapshot-day orders were checked, and grows from the following day.
    if (isSnapshotDay && arrivalsToday.length > 0) baskets.push(...arrivalsToday);
    cursor = dayAfter(cursor);
  }

  return { byYearMonth, unknownMonthUnverifiable };
}

function requireStep(
  input: DeliveryCoverageInput,
  state: { weightMg: number; count: number },
  date: Date,
): { weightMg: number; count: number } {
  // Kept in a named helper so the daily ledger has the same biology kernel
  // and optional mortality override as the established projection.
  return stepOneDay(input.simulationContext, state, date, input.overrideMonthlyMortality);
}