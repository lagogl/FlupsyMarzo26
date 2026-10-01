import type { ScenarioInput, ScenarioSale, ScenarioProjection, ScenarioMonth } from "../../../../shared/sales-scenarios";

export const monthNumber = (year: number, month: number) => year * 12 + month - 1;
export const monthParts = (n: number) => ({ year: Math.floor(n / 12), month: n % 12 + 1 });
export interface Cohort {
  quantity: number;
  entry: number;
  /** Day the cohort becomes available in its entry month (inclusive). */
  entryDay?: number;
  // Each value is the survival factor from the previous month, not from origin.
  path: Record<number, { survival: number; sizeId: number | null; animalsPerKg: number;
    days?: Record<number, { survival: number; sizeId: number | null; animalsPerKg: number }>;
  }>;
}
export interface Order { key: string; at: number; day?: number; sizeId: number; quantity: number }
export interface World {
  first: number; last: number;
  cohorts: Cohort[];
  orders: Order[];
  orderCommitments?: Record<number, NonNullable<ScenarioMonth["orderCommitment"]>>;
  maxApk: Record<string, number>;
  sizes: number[];
  startDay?: number;
  deadlineMs?: number;
}
export interface ProposalOptimization {
  baselineReceipts: number;
  optimizedReceipts: number;
  improvementEuro: number;
  plansEvaluated: number;
  candidatesEvaluated: number;
  searchTimeMs: number;
  timeLimited: boolean;
  strategy: string;
  baselineFeasible?: boolean;
  baselineStatus?: "feasible" | "unsafe" | "not-completed" | "partial";
}
export interface ProposalTimings {
  allocationMs: number;
  candidateReplayMs: number;
  receiptReplayMs: number;
  optimization?: ProposalOptimization;
}
interface Allocation extends ScenarioSale { nursery?: boolean; day?: number }
interface Replay {
  months: Map<number, ScenarioMonth>;
  orders: Record<string, number>;
  applied: Record<string, number>;
  dayStock?: Record<number, number>;
  nurseryStock?: number;
  stocksByDay?: Map<number, { dayStock: Record<number, number>; nurseryStock: number }>;
}

const eventCache = new WeakMap<World, Map<number, number[]>>();
function eventDays(world: World, n: number, firstDay: number, finalDay: number, budget?: ProposalWorkBudget) {
  checkProposalBudget(budget);
  let cached = eventCache.get(world);
  if (!cached) { cached = new Map(); eventCache.set(world, cached); }
  const existing = cached.get(n);
  if (existing) return existing;
  const days = new Set([firstDay, finalDay]);
  for (const c of world.cohorts) {
    checkProposalBudget(budget);
    if (c.entry === n && c.entryDay != null && c.entryDay > firstDay && c.entryDay <= finalDay)
      days.add(c.entryDay);
    const path = c.path[n]?.days;
    if (!path) continue;
    for (let day = firstDay + 1; day <= finalDay; day++) {
      checkProposalBudget(budget);
      const before = path[day - 1], after = path[day];
      if (before && after && (before.sizeId !== after.sizeId
        || (before.animalsPerKg > 29_999) !== (after.animalsPerKg > 29_999))) days.add(day);
    }
  }
  const sorted = [...days].sort((a, b) => a - b);
  cached.set(n, sorted);
  return sorted;
}

/** Replay on event dates; daily survival ratios cover skipped days. Never changes inputs. */
export function replay(
  world: World,
  allocations: Allocation[],
  stockAt?: { n: number; day: number; days?: number[] },
  fulfillmentOnly = false,
  budget?: ProposalWorkBudget,
): Replay {
  assertWorldDeadline(world);
  checkProposalBudget(budget);
  const counts = world.cohorts.map(() => 0);
  const months = new Map<number, ScenarioMonth>();
  const orders: Record<string, number> = {};
  const applied: Record<string, number> = {};
  let dayStock: Record<number, number> | undefined;
  let nurseryStock: number | undefined;
  const stocksByDay = stockAt?.days ? new Map<number, { dayStock: Record<number, number>; nurseryStock: number }>() : undefined;
  const receipts: Record<number, number> = {};
  const ordersByDate = new Map<number, Map<number, Order[]>>();
  const salesByDate = new Map<number, Map<number, Allocation[]>>();
  for (const order of world.orders) {
    checkProposalBudget(budget);
    const day = order.day ?? (order.at === world.first ? world.startDay ?? 1 : 1);
    let days = ordersByDate.get(order.at);
    if (!days) { days = new Map(); ordersByDate.set(order.at, days); }
    const entries = days.get(day) ?? [];
    entries.push(order);
    days.set(day, entries);
  }
  for (const sale of allocations) {
    checkProposalBudget(budget);
    const n = monthNumber(sale.year, sale.month);
    const day = sale.day ?? (n === world.first ? world.startDay ?? 1 : 1);
    let days = salesByDate.get(n);
    if (!days) { days = new Map(); salesByDate.set(n, days); }
    const entries = days.get(day) ?? [];
    entries.push(sale);
    days.set(day, entries);
  }
  for (let n = world.first; n <= world.last; n++) {
    assertWorldDeadline(world);
    checkProposalBudget(budget);
    const row: ScenarioMonth = { ...monthParts(n), availableBySize: {}, stockBeforeOrdersBySize: {}, eligibleAtStartBySize: {}, ordersRequested: 0, ordersFulfilled: 0, orderShortfall: 0, orderCommitment: world.orderCommitments?.[n], salesRequested: 0, salesApplied: 0, sandNurseryApplied: 0, revenue: 0, receipts: 0, remainingAnimals: 0 };
    const previousLastDay = new Date(monthParts(n - 1).year, monthParts(n - 1).month, 0).getDate();
    world.cohorts.forEach((cohort, i) => {
      checkProposalBudget(budget);
      const firstDay = n === world.first ? world.startDay ?? 1 : 1;
      if (cohort.entry === n && (cohort.entryDay ?? firstDay) <= firstDay) counts[i] += cohort.quantity;
      const previous = cohort.path[n - 1];
      const previousSnapshot = previous?.days?.[previousLastDay]?.survival;
      const monthSnapshot = cohort.path[n];
      const firstDaySnapshot = monthSnapshot?.days?.[firstDay];
      // Daily hatchery snapshots include biology on their date, including the
      // first of subsequent months. Monthly survival only carries the prior
      // month baseline. Inventory first-day snapshots have survival 1.
      counts[i] *= (monthSnapshot?.survival ?? 0)
        * (firstDaySnapshot?.survival ?? 1) / (previousSnapshot || 1);
      const size = (firstDaySnapshot ?? monthSnapshot)?.sizeId;
      if (!fulfillmentOnly && size != null) row.stockBeforeOrdersBySize![size] =
        (row.stockBeforeOrdersBySize![size] ?? 0) + Math.floor(counts[i]);
      const p = firstDaySnapshot ?? monthSnapshot;
      if (!fulfillmentOnly && p) for (const id of world.sizes) {
        if (p.animalsPerKg <= (world.maxApk[`${n}|${id}`] ?? -1))
          row.eligibleAtStartBySize![id] = (row.eligibleAtStartBySize![id] ?? 0) + Math.floor(counts[i]);
      }
    });
    const consume = (quantity: number, sizeId: number, day: number, nursery = false, order = false) => {
      let left = quantity;
      // Most mature first, deterministic across all replays.
      const eligible: { i: number; p: NonNullable<Cohort["path"][number]> }[] = [];
      world.cohorts.forEach((c, i) => {
        checkProposalBudget(budget);
        const p = c.path[n]?.days?.[day] ?? c.path[n];
        if (counts[i] > 0 && p && (nursery ? p.animalsPerKg <= 29_999
          : p.animalsPerKg <= (order ? world.maxApk[`${n}|${day}|${sizeId}`] ?? world.maxApk[`${n}|${sizeId}`] ?? -1
            : world.maxApk[`${n}|${sizeId}`] ?? -1))) eligible.push({ i, p });
      });
      eligible.sort((a, b) => a.p.animalsPerKg - b.p.animalsPerKg || a.i - b.i);
      for (const { i } of eligible) {
        checkProposalBudget(budget);
        const take = Math.min(left, Math.floor(counts[i]));
        counts[i] -= take;
        left -= take;
        if (left <= 0) break;
      }
      return quantity - left;
    };
    const firstDay = n === world.first ? world.startDay ?? 1 : 1;
    const { year, month } = monthParts(n);
    const finalDay = new Date(year, month, 0).getDate();
    const dates = new Set(eventDays(world, n, firstDay, finalDay, budget));
    const monthOrders = ordersByDate.get(n);
    const monthSales = salesByDate.get(n);
    for (const day of monthOrders?.keys() ?? []) dates.add(day);
    for (const day of monthSales?.keys() ?? []) dates.add(day);
    if (stockAt?.n === n) {
      dates.add(stockAt.day);
      for (const day of stockAt.days ?? []) dates.add(day);
    }
    let previousDay = firstDay;
    for (const day of [...dates].sort((a, b) => a - b)) {
      assertWorldDeadline(world);
      checkProposalBudget(budget);
      if (day > firstDay) world.cohorts.forEach((c, i) => {
        checkProposalBudget(budget);
        const previous = c.path[n]?.days?.[previousDay];
        const current = c.path[n]?.days?.[day];
        if (previous && current) counts[i] *= previous.survival > 0 ? current.survival / previous.survival : 0;
      });
      // An arrival is present from its entry date, but does not accrue growth
      // or mortality on that date. Add it only immediately before that day's
      // orders/sales; dates before the entry cannot consume the virtual stock.
      if (day > firstDay) {
        world.cohorts.forEach((cohort, i) => {
          checkProposalBudget(budget);
          if (cohort.entry === n && cohort.entryDay != null && cohort.entryDay === day)
            counts[i] += cohort.quantity;
        });
      }
      for (const order of monthOrders?.get(day) ?? []) {
        checkProposalBudget(budget);
        const used = consume(order.quantity, order.sizeId, day, false, true);
        orders[order.key] = used;
        row.ordersRequested += order.quantity;
        row.ordersFulfilled += used;
      }
      for (const sale of monthSales?.get(day) ?? []) {
        checkProposalBudget(budget);
        const used = consume(sale.quantity, sale.sizeId, day, sale.nursery);
        applied[sale.id] = used;
        if (sale.nursery) row.sandNurseryApplied += used;
        else {
          row.salesRequested += sale.quantity;
          row.salesApplied += used;
          if (!fulfillmentOnly) {
            const revenue = used * (sale.pricePerThousand ?? 0) / 1000;
            row.revenue += revenue;
            receipts[n + sale.paymentDelayMonths] = (receipts[n + sale.paymentDelayMonths] ?? 0) + revenue;
          }
        }
      }
      if (stockAt?.n === n && (stockAt.day === day || stockAt.days?.includes(day))) {
        const stock: Record<number, number> = {};
        let nursery = 0;
        world.cohorts.forEach((c, i) => {
          checkProposalBudget(budget);
          const p = c.path[n]?.days?.[day] ?? c.path[n];
          if (p && p.animalsPerKg <= 29_999) nursery += Math.floor(counts[i]);
          if (p) for (const id of world.sizes) {
            if (p.animalsPerKg <= (world.maxApk[`${n}|${id}`] ?? -1))
              stock[id] = (stock[id] ?? 0) + Math.floor(counts[i]);
          }
        });
        if (stockAt.day === day) { dayStock = stock; nurseryStock = nursery; }
        stocksByDay?.set(day, { dayStock: stock, nurseryStock: nursery });
      }
      previousDay = day;
    }
    row.orderShortfall = row.ordersRequested - row.ordersFulfilled;
    if (!fulfillmentOnly) {
      for (const id of world.sizes) row.availableBySize[id] = world.cohorts.reduce((total, c, i) => {
        checkProposalBudget(budget);
        const p = c.path[n]?.days?.[finalDay] ?? c.path[n];
        return total + (p && p.animalsPerKg <= (world.maxApk[`${n}|${id}`] ?? -1) ? Math.floor(counts[i]) : 0);
      }, 0);
      row.receipts = receipts[n] ?? 0;
      row.remainingAnimals = Math.floor(counts.reduce((a, b) => {
        checkProposalBudget(budget);
        return a + b;
      }, 0));
      months.set(n, row);
    }
  }
  return { months, orders, applied, dayStock, nurseryStock, stocksByDay };
}

/** Protect EACH future order and EACH already accepted allocation, not just totals. */
export function safeCapacity(
  world: World,
  accepted: Allocation[],
  candidate: Allocation,
  upper: number,
  baseline?: Replay,
  budget?: ProposalWorkBudget,
): number {
  checkProposalBudget(budget);
  const n = monthNumber(candidate.year, candidate.month);
  const day = candidate.day ?? (n === world.first ? world.startDay ?? 1 : 1);
  const reference = baseline ?? replay(world, accepted, { n, day }, true, budget);
  const feasible = (q: number) => {
    checkProposalBudget(budget);
    const trial = replay(world, [...accepted, { ...candidate, quantity: q }], undefined, true, budget);
    return (trial.applied[candidate.id] ?? 0) >= q
      && Object.entries(reference.orders).every(([id, fulfilled]) => (trial.orders[id] ?? 0) >= fulfilled)
      && Object.entries(reference.applied).every(([id, fulfilled]) => (trial.applied[id] ?? 0) >= fulfilled);
  };
  const snapshot = reference.stocksByDay?.get(day);
  const stock = candidate.nursery ? snapshot?.nurseryStock ?? reference.nurseryStock ?? 0
    : snapshot?.dayStock[candidate.sizeId] ?? reference.dayStock?.[candidate.sizeId] ?? 0;
  let lo = 0;
  let hi = Math.max(0, Math.floor(Math.min(upper, stock)));
  if (hi === 0 || feasible(hi)) return hi;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (feasible(mid)) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** Only growth across the requested range can increase its capacity. Evaluate those dates,
 * replaying acquired orders and accepted sales at their actual dates. */
function bestCapacity(world: World, accepted: Allocation[], candidate: Allocation, upper: number, budget?: ProposalWorkBudget) {
  checkProposalBudget(budget);
  const n = monthNumber(candidate.year, candidate.month);
  const firstDay = n === world.first ? world.startDay ?? 1 : 1;
  const days = new Set<number>([firstDay]);
  for (const cohort of world.cohorts) {
    checkProposalBudget(budget);
    if (cohort.entry === n && cohort.entryDay != null && cohort.entryDay > firstDay)
      days.add(cohort.entryDay);
    const p = cohort.path[n];
    if (!p) continue;
    for (const [text, state] of Object.entries(p.days ?? {}).sort(([a], [b]) => Number(a) - Number(b))) {
      checkProposalBudget(budget);
      const day = Number(text);
      if (day <= firstDay) continue;
      const limit = candidate.nursery ? 29_999 : world.maxApk[`${n}|${candidate.sizeId}`] ?? -1;
      if (state.animalsPerKg <= limit && (p.days?.[day - 1]?.animalsPerKg ?? Infinity) > limit) days.add(day);
    }
  }
  let best = { quantity: 0, day: firstDay };
  const orderedDays = [...days].sort((a, b) => a - b);
  const reference = replay(world, accepted, { n, day: firstDay, days: orderedDays }, true, budget);
  for (const day of orderedDays) {
    checkProposalBudget(budget);
    const quantity = safeCapacity(world, accepted, { ...candidate, day }, upper, reference, budget);
    if (quantity > best.quantity) best = { quantity, day };
  }
  return best;
}

export function allocateScenario(world: World, input: ScenarioInput, budget?: ProposalWorkBudget): Allocation[] {
  checkProposalBudget(budget);
  const requested: Allocation[] = [...input.sales, ...input.sandNursery.map((s, i) => ({
    ...s, id: `__nursery-${i}`, sizeId: 0, pricePerThousand: null, paymentDelayMonths: 0, nursery: true,
  }))];
  requested.sort((a, b) => monthNumber(a.year, a.month) - monthNumber(b.year, b.month) || Number(!!a.nursery) - Number(!!b.nursery));
  const accepted: Allocation[] = [];
  for (const candidate of requested) {
    checkProposalBudget(budget);
    const best = bestCapacity(world, accepted, candidate, candidate.quantity, budget);
    accepted.push({ ...candidate, ...best });
  }
  return accepted;
}

export function projectWorld(world: World, input: ScenarioInput, availability = true): ScenarioProjection {
  const accepted = allocateScenario(world, input);
  const result = replay(world, accepted);
  const first = monthNumber(input.startYear, input.startMonth);
  const deadline = monthNumber(input.cashDeadline.year, input.cashDeadline.month);
  const months: ScenarioMonth[] = [];
  for (let n = first; n < first + input.horizon; n++) {
    const row = result.months.get(n)!;
    row.salesRequested = input.sales.filter(s => monthNumber(s.year, s.month) === n).reduce((s, a) => s + a.quantity, 0);
    if (availability) {
      row.availabilityDayBySize = {};
      for (const sizeId of world.sizes) {
        const best = bestCapacity(world, accepted, {
          id: "__availability", ...monthParts(n), sizeId, quantity: 0, pricePerThousand: null, paymentDelayMonths: 0,
        }, 2_000_000_000);
        row.availableBySize[sizeId] = best.quantity;
        if (best.quantity > 0) row.availabilityDayBySize[sizeId] = best.day;
      }
    }
    // Replay retains every biological size for orders and growth. Only the
    // commercial projection is restricted to the explicit sale catalog.
    row.availableBySize = Object.fromEntries(
      Object.entries(row.availableBySize).filter(([id]) => world.sizes.includes(Number(id))),
    );
    row.stockBeforeOrdersBySize = Object.fromEntries(
      Object.entries(row.stockBeforeOrdersBySize ?? {}).filter(([id]) => world.sizes.includes(Number(id))),
    );
    row.eligibleAtStartBySize = Object.fromEntries(
      Object.entries(row.eligibleAtStartBySize ?? {}).filter(([id]) => world.sizes.includes(Number(id))),
    );
    months.push(row);
  }
  const receiptsByDeadline = [...result.months.entries()].filter(([n]) => n >= first && n <= deadline).reduce((s, [, m]) => s + m.receipts, 0);
  return {
    months, totalRevenue: months.reduce((s, m) => s + m.revenue, 0),
    totalReceipts: months.reduce((s, m) => s + m.receipts, 0),
    receiptsByDeadline, finalStock: months.at(-1)?.remainingAnimals ?? 0,
    totalOrderShortfall: [...result.months.values()].reduce((s, m) => s + m.orderShortfall, 0),
    unfulfilledSales: months.reduce((s, m) => s + m.salesRequested - m.salesApplied, 0),
    goalReached: receiptsByDeadline >= input.cashGoal,
  };
}

interface ReceiptProfile { total: number; earlier: number }
interface ProposalOption {
  key: string;
  at: number;
  receipt: number;
  sizeId: number;
  pricePerThousand: number;
  paymentDelayMonths: number;
}
interface ProposalSearchState {
  proposed: ScenarioSale[];
  expectedAccepted: Allocation[];
  prudentAccepted: Allocation[];
  expectedReceipts: number;
  prudentReceipts: number;
  expectedEarlier: number;
  prudentEarlier: number;
  addedAnimals: number;
  used: Set<string>;
}
interface ProposalScore {
  remaining: number;
  overshoot: number;
  animals: number;
  earlier: number;
  receipts: number;
}
interface ProposalWorkBudget {
  cutoffEpochMs: number;
  cutoffPerformanceMs: number;
  worldDeadlineMs?: number;
}
interface FixedProposalPlan {
  expectedAccepted: Allocation[];
  prudentAccepted: Allocation[];
  expectedReplay: Replay;
  prudentReplay: Replay;
}
interface ProposalExecutionState {
  fixedValidated: boolean;
  baselineInProgress: boolean;
  baselineStatus: "feasible" | "unsafe" | "not-completed" | "partial";
  safeSales: ScenarioSale[];
  safeReceipts: number;
  fixedReceipts: number;
  comparisonReceipts: number;
  candidatesEvaluated: number;
  plansEvaluated: number;
  strategy: string;
  searchStartedAt?: number;
  timeLimited: boolean;
}

function proposalWorkAvailable(budget: ProposalWorkBudget | undefined, estimatedMs = 0) {
  if (!budget) return true;
  const now = Date.now();
  if (budget.worldDeadlineMs && now > budget.worldDeadlineMs)
    throw new Error("Scenario troppo complesso: ridurre orizzonte, taglie o righe di vendita e riprovare");
  return now + estimatedMs < budget.cutoffEpochMs
    && performance.now() + estimatedMs < budget.cutoffPerformanceMs;
}

class ProposalBudgetExceeded extends Error {
  constructor() { super("Proposal search work budget exhausted"); this.name = "ProposalBudgetExceeded"; }
}

function assertWorldDeadline(world: World) {
  if (world.deadlineMs && Date.now() > world.deadlineMs)
    throw new Error("Scenario troppo complesso: ridurre orizzonte, taglie o righe di vendita e riprovare");
}

function checkProposalBudget(budget?: ProposalWorkBudget) {
  if (!budget) return;
  const now = Date.now();
  if (budget.worldDeadlineMs && now > budget.worldDeadlineMs)
    throw new Error("Scenario troppo complesso: ridurre orizzonte, taglie o righe di vendita e riprovare");
  if (now >= budget.cutoffEpochMs || performance.now() >= budget.cutoffPerformanceMs)
    throw new ProposalBudgetExceeded();
}

function receiptProfileFromApplied(
  accepted: Allocation[],
  applied: Record<string, number>,
  first: number,
  deadline: number,
  budget?: ProposalWorkBudget,
): ReceiptProfile {
  let total = 0;
  let earlier = 0;
  for (const sale of accepted) {
    checkProposalBudget(budget);
    if (sale.nursery) continue;
    const saleMonth = monthNumber(sale.year, sale.month);
    const receiptMonth = saleMonth + sale.paymentDelayMonths;
    if (saleMonth < first || receiptMonth < first || receiptMonth > deadline) continue;
    const receipt = (applied[sale.id] ?? 0) * (sale.pricePerThousand ?? 0) / 1000;
    total += receipt;
    earlier += receipt * (deadline - receiptMonth + 1);
  }
  return { total, earlier };
}

function allocationQuantities(accepted: Allocation[], budget?: ProposalWorkBudget) {
  const quantities = new Map<string, number>();
  for (const sale of accepted) {
    checkProposalBudget(budget);
    quantities.set(sale.id, sale.quantity);
  }
  return quantities;
}

function fixedAndProposedAreFeasible(
  expectedAccepted: Allocation[],
  prudentAccepted: Allocation[],
  fixedExpected: Allocation[],
  fixedPrudent: Allocation[],
  proposed: ScenarioSale[],
  budget?: ProposalWorkBudget,
) {
  const e = allocationQuantities(expectedAccepted, budget), p = allocationQuantities(prudentAccepted, budget);
  for (const sale of fixedExpected) {
    checkProposalBudget(budget);
    if ((e.get(sale.id) ?? 0) < sale.quantity) return false;
  }
  for (const sale of fixedPrudent) {
    checkProposalBudget(budget);
    if ((p.get(sale.id) ?? 0) < sale.quantity) return false;
  }
  return proposed.every(sale => {
    checkProposalBudget(budget);
    return (e.get(sale.id) ?? 0) >= sale.quantity && (p.get(sale.id) ?? 0) >= sale.quantity;
  });
}

/** Validate the canonical final allocation, not just the search state's protected
 * capacity. allocateScenario reorders same-month rows, so the trial must preserve
 * every original accepted commitment under that exact order. */
function validateFinalPlan(
  world: World,
  fixedAccepted: Allocation[],
  fixedReplay: Replay,
  trialAccepted: Allocation[],
  proposed: ScenarioSale[],
  first: number,
  deadline: number,
  budget?: ProposalWorkBudget,
) {
  const trialReplay = replay(world, trialAccepted, undefined, true, budget);
  const trialRows = new Map(trialAccepted.map(sale => [sale.id, sale]));
  let valid = true;
  for (const fixed of fixedAccepted) {
    checkProposalBudget(budget);
    if ((trialReplay.applied[fixed.id] ?? 0) < (fixedReplay.applied[fixed.id] ?? 0)) valid = false;
    // Manual rows and Sand Nursery are fixed inputs: preserve the accepted
    // allocation date too, so an automatic row cannot silently move them.
    if ((trialRows.get(fixed.id)?.day ?? 0) !== (fixed.day ?? 0)) valid = false;
  }
  for (const [key, fulfilled] of Object.entries(fixedReplay.orders)) {
    checkProposalBudget(budget);
    if ((trialReplay.orders[key] ?? 0) < fulfilled) valid = false;
  }
  if (!proposed.every(sale => {
    checkProposalBudget(budget);
    return (trialReplay.applied[sale.id] ?? 0) >= sale.quantity;
  })) valid = false;
  return {
    valid,
    profile: receiptProfileFromApplied(trialAccepted, trialReplay.applied, first, deadline, budget),
  };
}

function proposalScore(
  expectedReceipts: number,
  prudentReceipts: number,
  expectedEarlier: number,
  prudentEarlier: number,
  animals: number,
  goal: number,
): ProposalScore {
  const receipts = Math.min(expectedReceipts, prudentReceipts);
  return {
    remaining: Math.max(0, goal - receipts),
    overshoot: Math.max(0, receipts - goal),
    animals,
    earlier: Math.min(expectedEarlier, prudentEarlier),
    receipts,
  };
}

/** Lexicographic policy: close the cash gap, avoid unnecessary surplus, preserve stock,
 * then prefer receipts earlier in the deadline window. */
function compareProposalScores(a: ProposalScore, b: ProposalScore) {
  const epsilon = 1e-8;
  if (Math.abs(a.remaining - b.remaining) > epsilon) return a.remaining < b.remaining ? 1 : -1;
  if (Math.abs(a.overshoot - b.overshoot) > epsilon) return a.overshoot < b.overshoot ? 1 : -1;
  if (a.animals !== b.animals) return a.animals < b.animals ? 1 : -1;
  if (Math.abs(a.earlier - b.earlier) > epsilon) return a.earlier > b.earlier ? 1 : -1;
  return 0;
}

function uniqueProposalId(at: number, sizeId: number, occupied: Set<string>) {
  const base = `auto-${at}-${sizeId}`;
  let id = base;
  let suffix = 1;
  while (occupied.has(id)) id = `${base}-${suffix++}`;
  occupied.add(id);
  return id;
}

function createProposalOptions(
  expected: World,
  prudent: World,
  input: ScenarioInput,
  first: number,
  deadline: number,
  budget?: ProposalWorkBudget,
) {
  const prices = input.proposalPrices.filter(price => {
    checkProposalBudget(budget);
    return Number.isFinite(price.pricePerThousand) && price.pricePerThousand > 0
      && Number.isInteger(price.paymentDelayMonths) && price.paymentDelayMonths >= 0
      && expected.sizes.includes(price.sizeId) && prudent.sizes.includes(price.sizeId);
  });
  const options: ProposalOption[] = [];
  for (let at = first; at < first + input.horizon; at++) {
    checkProposalBudget(budget);
    if (at > expected.last || at > prudent.last) continue;
    for (const price of prices) {
      checkProposalBudget(budget);
      const receipt = at + price.paymentDelayMonths;
      if (receipt > deadline) continue;
      options.push({
        key: `${at}|${price.sizeId}|${price.pricePerThousand}|${price.paymentDelayMonths}`,
        at, receipt, sizeId: price.sizeId, pricePerThousand: price.pricePerThousand,
        paymentDelayMonths: price.paymentDelayMonths,
      });
    }
  }
  const legacyOrder = options.slice().sort((a, b) =>
    a.receipt - b.receipt || b.pricePerThousand - a.pricePerThousand || a.sizeId - b.sizeId || a.at - b.at);
  checkProposalBudget(budget);
  const highPriceOrder = options.slice().sort((a, b) =>
    b.pricePerThousand - a.pricePerThousand || a.receipt - b.receipt || a.sizeId - b.sizeId || a.at - b.at);
  checkProposalBudget(budget);
  const bySize: ProposalOption[] = [];
  for (const sizeId of new Set(options.map(option => option.sizeId))) {
    checkProposalBudget(budget);
    bySize.push(...options.filter(option => option.sizeId === sizeId)
      .sort((a, b) => b.pricePerThousand - a.pricePerThousand || a.receipt - b.receipt || a.at - b.at).slice(0, 1));
  }
  checkProposalBudget(budget);
  const seeds = [...legacyOrder.slice(0, 2), ...highPriceOrder.slice(0, 6), ...bySize];
  const seen = new Set<string>();
  return {
    options,
    legacyOrder,
    seeds: seeds.filter(option => !seen.has(option.key) && !!seen.add(option.key)).slice(0, 10),
  };
}

/**
 * The previous deterministic receipt-first policy is retained as a guaranteed,
 * validated incumbent. It is also exported for the focused optimizer regression
 * tests and read-only benchmark comparison.
 */
export function proposeSalesGreedyBaseline(
  expected: World,
  prudent: World,
  input: ScenarioInput,
  timings?: Pick<ProposalTimings, "allocationMs" | "candidateReplayMs" | "receiptReplayMs">,
): ScenarioSale[] {
  return runGreedyBaseline(expected, prudent, input, timings).proposed;
}

function runGreedyBaseline(
  expected: World,
  prudent: World,
  input: ScenarioInput,
  timings?: Pick<ProposalTimings, "allocationMs" | "candidateReplayMs" | "receiptReplayMs">,
  fixedPlan?: FixedProposalPlan,
  budget?: ProposalWorkBudget,
  onProgress?: (state: {
    candidatesEvaluated: number;
    plansEvaluated: number;
    proposed: ScenarioSale[];
    expectedProfile: ReceiptProfile;
    prudentProfile: ReceiptProfile;
  }) => void,
) {
  const measure = <T>(phase: keyof Pick<ProposalTimings, "allocationMs" | "candidateReplayMs" | "receiptReplayMs">, operation: () => T): T => {
    if (!timings) return operation();
    const start = performance.now();
    try { return operation(); }
    finally { timings[phase] += performance.now() - start; }
  };
  const proposed: ScenarioSale[] = [];
  const first = monthNumber(input.startYear, input.startMonth);
  const deadline = monthNumber(input.cashDeadline.year, input.cashDeadline.month);
  const { legacyOrder } = createProposalOptions(expected, prudent, input, first, deadline, budget);
  const occupied = new Set(input.sales.map(sale => sale.id));
  let next: ScenarioInput = { ...input, sales: input.sales.slice() };
  let prudentAccepted = fixedPlan?.prudentAccepted.slice()
    ?? measure("allocationMs", () => allocateScenario(prudent, next, budget));
  let expectedAccepted = fixedPlan?.expectedAccepted.slice()
    ?? measure("allocationMs", () => allocateScenario(expected, next, budget));
  const fixedPrudent = prudentAccepted.slice();
  const fixedExpected = expectedAccepted.slice();
  const fixedPrudentReplay = fixedPlan?.prudentReplay
    ?? measure("receiptReplayMs", () => replay(prudent, fixedPrudent, undefined, true, budget));
  const fixedExpectedReplay = fixedPlan?.expectedReplay
    ?? measure("receiptReplayMs", () => replay(expected, fixedExpected, undefined, true, budget));
  let prudentProfile = receiptProfileFromApplied(fixedPrudent, fixedPrudentReplay.applied, first, deadline, budget);
  let expectedProfile = receiptProfileFromApplied(fixedExpected, fixedExpectedReplay.applied, first, deadline, budget);
  let complete = true;
  let unsafe = false;
  let candidatesEvaluated = 0;
  let plansEvaluated = 1;
  let candidateCostEstimateMs = 200;
  let validationCostEstimateMs = 500;
  const reportProgress = () => onProgress?.({
    candidatesEvaluated, plansEvaluated, proposed: proposed.map(sale => ({ ...sale })),
    expectedProfile, prudentProfile,
  });
  reportProgress();
  for (let optionIndex = 0; optionIndex < legacyOrder.length; optionIndex++) {
    const option = legacyOrder[optionIndex];
    if (next.sales.length >= 100) break;
    const gap = input.cashGoal - prudentProfile.total;
    if (gap <= 0) break;
    const wanted = Math.min(2_000_000_000, Math.ceil(gap * 1000 / option.pricePerThousand));
    if (wanted <= 0) continue;
    if (candidatesEvaluated >= 120 || !proposalWorkAvailable(budget, candidateCostEstimateMs)) {
      complete = false;
      break;
    }
    const candidate: ScenarioSale = {
      id: uniqueProposalId(option.at, option.sizeId, occupied),
      ...monthParts(option.at), sizeId: option.sizeId, quantity: wanted,
      pricePerThousand: option.pricePerThousand, paymentDelayMonths: option.paymentDelayMonths,
    };
    const candidateStarted = performance.now();
    candidatesEvaluated++;
    reportProgress();
    const expectedCapacity = measure("candidateReplayMs", () =>
      bestCapacity(expected, expectedAccepted, candidate, wanted, budget));
    if (!proposalWorkAvailable(budget, Math.max(20, candidateCostEstimateMs * 0.5))) {
      occupied.delete(candidate.id);
      complete = false;
      break;
    }
    const prudentCapacity = measure("candidateReplayMs", () =>
      bestCapacity(prudent, prudentAccepted, candidate, wanted, budget));
    candidateCostEstimateMs = candidateCostEstimateMs * 0.65 + (performance.now() - candidateStarted) * 0.35;
    candidate.quantity = Math.min(expectedCapacity.quantity, prudentCapacity.quantity);
    if (candidate.quantity <= 0) { occupied.delete(candidate.id); continue; }
    if (!proposalWorkAvailable(budget, validationCostEstimateMs)) {
      occupied.delete(candidate.id);
      complete = false;
      break;
    }
    const trialProposed = [...proposed, candidate];
    const trialInput = { ...input, sales: [...input.sales, ...trialProposed] };
    const trialPrudent = measure("allocationMs", () => allocateScenario(prudent, trialInput, budget));
    if (!proposalWorkAvailable(budget, validationCostEstimateMs * 0.5)) {
      occupied.delete(candidate.id);
      complete = false;
      break;
    }
    const trialExpected = measure("allocationMs", () => allocateScenario(expected, trialInput, budget));
    // The canonical allocator must agree with the incremental protected-capacity
    // calculation; never return a plan that silently loses fixed or proposed sales.
    if (!fixedAndProposedAreFeasible(trialExpected, trialPrudent, fixedExpected, fixedPrudent, trialProposed, budget)) {
      occupied.delete(candidate.id);
      unsafe = true;
      break;
    }
    if (!proposalWorkAvailable(budget, validationCostEstimateMs)) {
      occupied.delete(candidate.id);
      complete = false;
      break;
    }
    const validationStarted = performance.now();
    const trialPrudentCheck = measure("receiptReplayMs", () =>
      validateFinalPlan(prudent, fixedPrudent, fixedPrudentReplay, trialPrudent, trialProposed, first, deadline, budget));
    if (!proposalWorkAvailable(budget, validationCostEstimateMs * 0.5)) {
      occupied.delete(candidate.id);
      complete = false;
      break;
    }
    const trialExpectedCheck = measure("receiptReplayMs", () =>
      validateFinalPlan(expected, fixedExpected, fixedExpectedReplay, trialExpected, trialProposed, first, deadline, budget));
    plansEvaluated++;
    reportProgress();
    validationCostEstimateMs = validationCostEstimateMs * 0.65 + (performance.now() - validationStarted) * 0.35;
    if (!trialPrudentCheck.valid || !trialExpectedCheck.valid) {
      occupied.delete(candidate.id);
      unsafe = true;
      break;
    }
    proposed.push(candidate);
    next = trialInput;
    prudentAccepted = trialPrudent;
    expectedAccepted = trialExpected;
    prudentProfile = trialPrudentCheck.profile;
    expectedProfile = trialExpectedCheck.profile;
    reportProgress();
    if (candidatesEvaluated >= 120 && optionIndex + 1 < legacyOrder.length) {
      complete = false;
      break;
    }
  }
  return {
    proposed, expectedAccepted, prudentAccepted, fixedExpected, fixedPrudent,
    expectedProfile, prudentProfile, complete, unsafe, candidatesEvaluated, plansEvaluated,
  };
}

export function proposeSales(
  expected: World,
  prudent: World,
  input: ScenarioInput,
  timings?: ProposalTimings,
): ScenarioSale[] {
  const execution: ProposalExecutionState = {
    fixedValidated: false,
    baselineInProgress: false,
    baselineStatus: "not-completed",
    safeSales: [],
    safeReceipts: 0,
    fixedReceipts: 0,
    comparisonReceipts: 0,
    candidatesEvaluated: 0,
    plansEvaluated: 0,
    strategy: "fixed-input-only-budget-fallback",
    timeLimited: false,
  };
  try {
    return computeProposalSales(expected, prudent, input, timings, execution);
  } catch (error) {
    if (!(error instanceof ProposalBudgetExceeded)) throw error;
    if (!execution.fixedValidated) {
      throw new Error("Scenario troppo complesso: impossibile completare la validazione delle vendite manuali entro il budget di calcolo");
    }
    assertWorldDeadline(expected);
    assertWorldDeadline(prudent);
    if (execution.baselineInProgress) {
      execution.baselineStatus = execution.safeSales.length ? "partial" : "not-completed";
      execution.comparisonReceipts = execution.safeSales.length
        ? execution.safeReceipts : execution.fixedReceipts;
    }
    execution.timeLimited = true;
    if (timings) {
      const optimizedReceipts = execution.safeReceipts;
      timings.optimization = {
        baselineReceipts: execution.comparisonReceipts,
        optimizedReceipts,
        improvementEuro: optimizedReceipts - execution.comparisonReceipts,
        plansEvaluated: execution.plansEvaluated,
        candidatesEvaluated: execution.candidatesEvaluated,
        searchTimeMs: execution.searchStartedAt == null ? 0 : performance.now() - execution.searchStartedAt,
        timeLimited: true,
        strategy: execution.strategy,
        baselineFeasible: execution.baselineStatus === "feasible",
        baselineStatus: execution.baselineStatus,
      };
    }
    return execution.safeSales;
  }
}

function computeProposalSales(
  expected: World,
  prudent: World,
  input: ScenarioInput,
  timings: ProposalTimings | undefined,
  execution: ProposalExecutionState,
): ScenarioSale[] {
  const measure = <T>(phase: "allocationMs" | "candidateReplayMs" | "receiptReplayMs", operation: () => T): T => {
    if (!timings) return operation();
    const start = performance.now();
    try { return operation(); }
    finally { timings[phase] += performance.now() - start; }
  };
  const proposalStartPerf = performance.now();
  const proposalStartEpoch = Date.now();
  const worldDeadlineMs = Math.min(expected.deadlineMs ?? Infinity, prudent.deadlineMs ?? Infinity);
  if (Number.isFinite(worldDeadlineMs) && proposalStartEpoch > worldDeadlineMs) {
    assertWorldDeadline(expected);
    assertWorldDeadline(prudent);
  }
  const maxProposalMs = Number.isFinite(worldDeadlineMs) ? 60_000 : 10_000;
  const workBudget: ProposalWorkBudget = {
    cutoffEpochMs: Math.min(proposalStartEpoch + maxProposalMs, worldDeadlineMs - 28_000),
    cutoffPerformanceMs: proposalStartPerf + maxProposalMs,
    worldDeadlineMs: Number.isFinite(worldDeadlineMs) ? worldDeadlineMs : undefined,
  };
  const first = monthNumber(input.startYear, input.startMonth);
  const deadline = monthNumber(input.cashDeadline.year, input.cashDeadline.month);
  const initialInput = { ...input, sales: input.sales.slice() };
  const hasFixedInput = input.sales.length > 0 || input.sandNursery.length > 0;
  if (!hasFixedInput) execution.fixedValidated = true;
  let fixedPrudent: Allocation[] = [];
  let fixedExpected: Allocation[] = [];
  let fixedPrudentReplay: Replay | undefined;
  let fixedExpectedReplay: Replay | undefined;
  if (hasFixedInput) {
    if (!proposalWorkAvailable(workBudget, 500)) {
      throw new Error("Scenario troppo complesso: impossibile validare il piano manuale prima della scadenza di calcolo");
    }
    fixedPrudent = measure("allocationMs", () => allocateScenario(prudent, initialInput, workBudget));
    if (!proposalWorkAvailable(workBudget, 500)) {
      throw new Error("Scenario troppo complesso: impossibile completare la validazione del piano manuale prima della scadenza");
    }
    fixedExpected = measure("allocationMs", () => allocateScenario(expected, initialInput, workBudget));
  }
  if (hasFixedInput || proposalWorkAvailable(workBudget, 250)) {
    if (!proposalWorkAvailable(workBudget, 250)) {
      throw new Error("Scenario troppo complesso: impossibile verificare il piano manuale prima della scadenza");
    }
    fixedPrudentReplay = measure("receiptReplayMs", () => replay(prudent, fixedPrudent, undefined, true, workBudget));
    if (!proposalWorkAvailable(workBudget, 250)) {
      throw new Error("Scenario troppo complesso: impossibile completare la verifica del piano manuale prima della scadenza");
    }
    fixedExpectedReplay = measure("receiptReplayMs", () => replay(expected, fixedExpected, undefined, true, workBudget));
  }
  const baselinePrudent = fixedPrudentReplay
    ? receiptProfileFromApplied(fixedPrudent, fixedPrudentReplay.applied, first, deadline, workBudget)
    : { total: 0, earlier: 0 };
  const baselineExpected = fixedExpectedReplay
    ? receiptProfileFromApplied(fixedExpected, fixedExpectedReplay.applied, first, deadline, workBudget)
    : { total: 0, earlier: 0 };
  const fixedReceipts = Math.min(baselinePrudent.total, baselineExpected.total);
  if (!hasFixedInput || (fixedPrudentReplay && fixedExpectedReplay)) execution.fixedValidated = true;
  execution.fixedReceipts = fixedReceipts;
  execution.comparisonReceipts = fixedReceipts;
  execution.safeReceipts = fixedReceipts;
  execution.safeSales = [];
  execution.plansEvaluated = hasFixedInput || (!!fixedPrudentReplay && !!fixedExpectedReplay) ? 1 : 0;
  const canStartLegacy = !!fixedPrudentReplay && !!fixedExpectedReplay && proposalWorkAvailable(workBudget, 500);
  execution.baselineInProgress = canStartLegacy;
  const baseline = canStartLegacy
    ? runGreedyBaseline(expected, prudent, input, timings, {
      expectedAccepted: fixedExpected,
      prudentAccepted: fixedPrudent,
      expectedReplay: fixedExpectedReplay!,
      prudentReplay: fixedPrudentReplay!,
    }, workBudget, progress => {
      execution.candidatesEvaluated = progress.candidatesEvaluated;
      execution.plansEvaluated = progress.plansEvaluated;
      if (progress.proposed.length) {
        execution.safeSales = progress.proposed;
        execution.safeReceipts = Math.min(progress.expectedProfile.total, progress.prudentProfile.total);
        execution.strategy = "validated-greedy-prefix";
      }
    })
    : {
      proposed: [], expectedAccepted: fixedExpected, prudentAccepted: fixedPrudent,
      expectedProfile: baselineExpected, prudentProfile: baselinePrudent,
      complete: false, unsafe: false, candidatesEvaluated: 0,
      plansEvaluated: hasFixedInput || (!!fixedPrudentReplay && !!fixedExpectedReplay) ? 1 : 0,
    };
  execution.baselineInProgress = false;
  const baselineStatus = !baseline.complete
    ? baseline.proposed.length ? "partial" : "not-completed"
    : baseline.unsafe ? "unsafe" : "feasible";
  execution.baselineStatus = baselineStatus;
  const baselineSafe = baselineStatus === "feasible";
  let selected = baseline.proposed.length ? baseline.proposed : [];
  let selectedPrudent = baseline.proposed.length ? baseline.prudentAccepted : fixedPrudent;
  let selectedExpected = baseline.proposed.length ? baseline.expectedAccepted : fixedExpected;
  let selectedPrudentProfile = baseline.proposed.length ? baseline.prudentProfile : baselinePrudent;
  let selectedExpectedProfile = baseline.proposed.length ? baseline.expectedProfile : baselineExpected;
  let selectedScore = proposalScore(
    selectedExpectedProfile.total, selectedPrudentProfile.total,
    selectedExpectedProfile.earlier, selectedPrudentProfile.earlier,
    selected.reduce((sum, sale) => sum + sale.quantity, 0), input.cashGoal,
  );
  const baselineReceipts = baselineSafe || baselineStatus === "partial"
    ? Math.min(baseline.prudentProfile.total, baseline.expectedProfile.total)
    : fixedReceipts;
  execution.comparisonReceipts = baselineReceipts;
  let selectedStrategy = baselineSafe ? "legacy-greedy-baseline"
    : baseline.proposed.length ? "validated-prefix-legacy-fallback"
      : baselineStatus === "unsafe" ? "fixed-input-only-legacy-rejected" : "fixed-input-only-budget-fallback";
  let candidatesEvaluated = baseline.candidatesEvaluated;
  let plansEvaluated = baseline.plansEvaluated;
  let timeLimited = !baseline.complete;
  execution.candidatesEvaluated = candidatesEvaluated;
  execution.plansEvaluated = plansEvaluated;
  execution.strategy = selectedStrategy;
  execution.safeSales = selected.map(sale => ({ ...sale }));
  execution.safeReceipts = Math.min(selectedExpectedProfile.total, selectedPrudentProfile.total);
  const searchStart = performance.now();
  execution.searchStartedAt = searchStart;
  // The scenario service performs two full availability-matrix projections after
  // this returns. Keep a larger-than-observed reserve for those final projections.
  const searchDeadlinePerf = Math.min(searchStart + 10_000, workBudget.cutoffPerformanceMs);
  const searchDeadlineEpoch = workBudget.cutoffEpochMs;
  const searchWorkBudget: ProposalWorkBudget = {
    cutoffEpochMs: searchDeadlineEpoch,
    cutoffPerformanceMs: searchDeadlinePerf,
    worldDeadlineMs: workBudget.worldDeadlineMs,
  };
  const maxCandidates = 120;
  const maxPlans = 18;
  const maxSales = Math.max(0, 100 - input.sales.length);
  let candidateCostEstimateMs = 100;
  let planCostEstimateMs = 500;
  let candidateBudgetStopped = false;
  const { legacyOrder, seeds } = createProposalOptions(expected, prudent, input, first, deadline, searchWorkBudget);
  const stateSignature = (state: ProposalSearchState) => [
    ...state.expectedAccepted.map(sale => `e:${sale.id}:${sale.quantity}:${sale.day ?? 0}`),
    ...state.prudentAccepted.map(sale => `p:${sale.id}:${sale.quantity}:${sale.day ?? 0}`),
  ].sort().join(";");
  const capacityCache = new Map<string, { expected: { quantity: number; day: number }; prudent: { quantity: number; day: number } }>();

  const scoreState = (state: ProposalSearchState) => proposalScore(
    state.expectedReceipts, state.prudentReceipts, state.expectedEarlier, state.prudentEarlier,
    state.addedAnimals, input.cashGoal,
  );
  const searchStopped = () => candidateBudgetStopped
    || performance.now() >= searchDeadlinePerf || Date.now() >= searchDeadlineEpoch
    || candidatesEvaluated >= maxCandidates || plansEvaluated >= maxPlans;
  const searchWorkAvailable = (estimatedMs: number) =>
    performance.now() + estimatedMs < searchDeadlinePerf
      && Date.now() + estimatedMs < searchDeadlineEpoch;
  const stopAsLimited = () => {
    if (searchStopped() && seeds.length) timeLimited = true;
  };

  if (baseline.complete && fixedPrudentReplay && fixedExpectedReplay
    && input.sales.length < 100 && maxSales > 0 && input.cashGoal > fixedReceipts && seeds.length
    && searchDeadlinePerf > performance.now() && searchDeadlineEpoch > Date.now()) {
    const basePrudentProfile = baselinePrudent;
    const baseExpectedProfile = baselineExpected;
    const makeState = (): ProposalSearchState => ({
      proposed: [],
      expectedAccepted: fixedExpected.slice(),
      prudentAccepted: fixedPrudent.slice(),
      expectedReceipts: baseExpectedProfile.total,
      prudentReceipts: basePrudentProfile.total,
      expectedEarlier: baseExpectedProfile.earlier,
      prudentEarlier: basePrudentProfile.earlier,
      addedAnimals: 0,
      used: new Set(),
    });

    const tryAdd = (state: ProposalSearchState, option: ProposalOption, fraction: number) => {
      if (searchStopped()) { stopAsLimited(); return false; }
      const gap = input.cashGoal - Math.min(state.expectedReceipts, state.prudentReceipts);
      if (gap <= 0 || state.proposed.length >= maxSales) return false;
      const target = Math.min(2_000_000_000, Math.ceil(gap * 1000 / option.pricePerThousand));
      const wanted = fraction < 1 ? Math.max(1, Math.floor(target * fraction)) : target;
      const occupied = new Set([...input.sales, ...state.proposed].map(sale => sale.id));
      const candidate: ScenarioSale = {
        id: uniqueProposalId(option.at, option.sizeId, occupied),
        ...monthParts(option.at), sizeId: option.sizeId, quantity: wanted,
        pricePerThousand: option.pricePerThousand, paymentDelayMonths: option.paymentDelayMonths,
      };
      const key = `${stateSignature(state)}|${option.key}|${wanted}`;
      let capacities = capacityCache.get(key);
      if (!capacities) {
        if (candidatesEvaluated >= maxCandidates) { timeLimited = true; return false; }
        const nowPerf = performance.now();
        const nowEpoch = Date.now();
        const estimatedCost = Math.max(20, candidateCostEstimateMs);
        if (nowPerf + estimatedCost >= searchDeadlinePerf
          || nowEpoch + estimatedCost >= searchDeadlineEpoch) {
          candidateBudgetStopped = true;
          timeLimited = true;
          return false;
        }
        candidatesEvaluated++;
        execution.candidatesEvaluated = candidatesEvaluated;
        const candidateStarted = performance.now();
        const expectedCapacity = measure("candidateReplayMs", () =>
          bestCapacity(expected, state.expectedAccepted, candidate, wanted, searchWorkBudget));
        if (!searchWorkAvailable(Math.max(20, candidateCostEstimateMs * 0.5))) {
          candidateBudgetStopped = true;
          timeLimited = true;
          return false;
        }
        const prudentCapacity = measure("candidateReplayMs", () =>
          bestCapacity(prudent, state.prudentAccepted, candidate, wanted, searchWorkBudget));
        capacities = { expected: expectedCapacity, prudent: prudentCapacity };
        const observedCost = performance.now() - candidateStarted;
        candidateCostEstimateMs = candidateCostEstimateMs * 0.65 + observedCost * 0.35;
        capacityCache.set(key, capacities);
      }
      const quantity = Math.min(capacities.expected.quantity, capacities.prudent.quantity);
      if (quantity <= 0) return false;
      candidate.quantity = quantity;
      const cash = quantity * option.pricePerThousand / 1000;
      const earlier = cash * (deadline - option.receipt + 1);
      state.proposed.push(candidate);
      state.expectedAccepted.push({ ...candidate, quantity, day: capacities.expected.day });
      state.prudentAccepted.push({ ...candidate, quantity, day: capacities.prudent.day });
      state.expectedReceipts += cash;
      state.prudentReceipts += cash;
      state.expectedEarlier += earlier;
      state.prudentEarlier += earlier;
      state.addedAnimals += quantity;
      state.used.add(option.key);
      return true;
    };

    const consider = (state: ProposalSearchState, strategy: string) => {
      const candidateScore = scoreState(state);
      if (compareProposalScores(candidateScore, selectedScore) <= 0) return;
      if (searchStopped()) { stopAsLimited(); return; }
      const nowPerf = performance.now();
      const nowEpoch = Date.now();
      const estimatedCost = Math.max(50, planCostEstimateMs);
      if (nowPerf + estimatedCost >= searchDeadlinePerf
        || nowEpoch + estimatedCost >= searchDeadlineEpoch) {
        candidateBudgetStopped = true;
        timeLimited = true;
        return;
      }
      const validationStarted = performance.now();
      try {
        const trialInput = { ...input, sales: [...input.sales, ...state.proposed] };
        const trialPrudent = measure("allocationMs", () => allocateScenario(prudent, trialInput, searchWorkBudget));
        if (!searchWorkAvailable(Math.max(50, planCostEstimateMs * 0.5))) {
          candidateBudgetStopped = true;
          timeLimited = true;
          return;
        }
        const trialExpected = measure("allocationMs", () => allocateScenario(expected, trialInput, searchWorkBudget));
        const prudentCheck = measure("receiptReplayMs", () =>
          validateFinalPlan(prudent, fixedPrudent, fixedPrudentReplay!, trialPrudent, state.proposed, first, deadline, searchWorkBudget));
        if (!searchWorkAvailable(Math.max(50, planCostEstimateMs * 0.5))) {
          candidateBudgetStopped = true;
          timeLimited = true;
          return;
        }
        const expectedCheck = measure("receiptReplayMs", () =>
          validateFinalPlan(expected, fixedExpected, fixedExpectedReplay!, trialExpected, state.proposed, first, deadline, searchWorkBudget));
        plansEvaluated++;
        execution.plansEvaluated = plansEvaluated;
        if (!prudentCheck.valid || !expectedCheck.valid) return;
        const prudentProfile = prudentCheck.profile;
        const expectedProfile = expectedCheck.profile;
        const validatedScore = proposalScore(
          expectedProfile.total, prudentProfile.total, expectedProfile.earlier, prudentProfile.earlier,
          state.proposed.reduce((sum, sale) => sum + sale.quantity, 0), input.cashGoal,
        );
        if (compareProposalScores(validatedScore, selectedScore) > 0) {
          selected = state.proposed.map(sale => ({ ...sale }));
          selectedPrudent = trialPrudent;
          selectedExpected = trialExpected;
          selectedPrudentProfile = prudentProfile;
          selectedExpectedProfile = expectedProfile;
          selectedScore = validatedScore;
          selectedStrategy = strategy;
          execution.safeSales = selected.map(sale => ({ ...sale }));
          execution.safeReceipts = Math.min(expectedProfile.total, prudentProfile.total);
          execution.strategy = selectedStrategy;
        }
      } finally {
        const observed = performance.now() - validationStarted;
        planCostEstimateMs = planCostEstimateMs * 0.65 + observed * 0.35;
      }
    };

    for (let seedIndex = 0; seedIndex < seeds.length && !searchStopped(); seedIndex++) {
      const seed = seeds[seedIndex];
      const fractions = seedIndex < 4 ? [1, 0.5] : [1];
      for (const fraction of fractions) {
        if (searchStopped()) break;
        const state = makeState();
        const added = tryAdd(state, seed, fraction);
        if (added) {
          for (const option of legacyOrder) {
            if (searchStopped()) { stopAsLimited(); break; }
            if (state.used.has(option.key)) continue;
            tryAdd(state, option, 1);
            if (Math.min(state.expectedReceipts, state.prudentReceipts) >= input.cashGoal
              || state.proposed.length >= maxSales) break;
          }
          consider(state, `${fraction < 1 ? "split-" : ""}seed-${seed.at}-${seed.sizeId}-then-receipt-order`);
        }
      }
    }
    stopAsLimited();
  } else if (baseline.complete && input.cashGoal > fixedReceipts && seeds.length
    && (searchDeadlinePerf <= performance.now() || searchDeadlineEpoch <= Date.now())) {
    timeLimited = true;
  }

  execution.candidatesEvaluated = candidatesEvaluated;
  execution.plansEvaluated = plansEvaluated;
  execution.timeLimited = timeLimited;
  checkProposalBudget(workBudget);
  assertWorldDeadline(expected);
  assertWorldDeadline(prudent);
  if (timings) {
    const optimizedReceipts = Math.min(selectedExpectedProfile.total, selectedPrudentProfile.total);
    timings.optimization = {
      baselineReceipts,
      optimizedReceipts,
      improvementEuro: optimizedReceipts - baselineReceipts,
      plansEvaluated,
      candidatesEvaluated,
      searchTimeMs: performance.now() - searchStart,
      timeLimited,
      strategy: selectedStrategy,
      baselineFeasible: baselineSafe,
      baselineStatus,
    };
  }
  return selected;
}