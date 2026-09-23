import type { ScenarioInput, ScenarioSale, ScenarioProjection, ScenarioMonth } from "../../../../shared/sales-scenarios";

export const monthNumber = (year: number, month: number) => year * 12 + month - 1;
export const monthParts = (n: number) => ({ year: Math.floor(n / 12), month: n % 12 + 1 });
export interface Cohort {
  quantity: number;
  entry: number;
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
export interface ProposalTimings { allocationMs: number; candidateReplayMs: number; receiptReplayMs: number }
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
function eventDays(world: World, n: number, firstDay: number, finalDay: number) {
  let cached = eventCache.get(world);
  if (!cached) { cached = new Map(); eventCache.set(world, cached); }
  const existing = cached.get(n);
  if (existing) return existing;
  const days = new Set([firstDay, finalDay]);
  for (const c of world.cohorts) {
    const path = c.path[n]?.days;
    if (!path) continue;
    for (let day = firstDay + 1; day <= finalDay; day++) {
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
export function replay(world: World, allocations: Allocation[], stockAt?: { n: number; day: number; days?: number[] }, fulfillmentOnly = false): Replay {
  if (world.deadlineMs && Date.now() > world.deadlineMs) throw new Error("Scenario troppo complesso: ridurre orizzonte, taglie o righe di vendita e riprovare");
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
    const day = order.day ?? (order.at === world.first ? world.startDay ?? 1 : 1);
    let days = ordersByDate.get(order.at);
    if (!days) { days = new Map(); ordersByDate.set(order.at, days); }
    const entries = days.get(day) ?? [];
    entries.push(order);
    days.set(day, entries);
  }
  for (const sale of allocations) {
    const n = monthNumber(sale.year, sale.month);
    const day = sale.day ?? (n === world.first ? world.startDay ?? 1 : 1);
    let days = salesByDate.get(n);
    if (!days) { days = new Map(); salesByDate.set(n, days); }
    const entries = days.get(day) ?? [];
    entries.push(sale);
    days.set(day, entries);
  }
  for (let n = world.first; n <= world.last; n++) {
    if (world.deadlineMs && Date.now() > world.deadlineMs) throw new Error("Scenario troppo complesso: ridurre orizzonte, taglie o righe di vendita e riprovare");
    const row: ScenarioMonth = { ...monthParts(n), availableBySize: {}, stockBeforeOrdersBySize: {}, eligibleAtStartBySize: {}, ordersRequested: 0, ordersFulfilled: 0, orderShortfall: 0, orderCommitment: world.orderCommitments?.[n], salesRequested: 0, salesApplied: 0, sandNurseryApplied: 0, revenue: 0, receipts: 0, remainingAnimals: 0 };
    const previousLastDay = new Date(monthParts(n - 1).year, monthParts(n - 1).month, 0).getDate();
    world.cohorts.forEach((cohort, i) => {
      if (cohort.entry === n) counts[i] += cohort.quantity;
      const previous = cohort.path[n - 1];
      const previousSnapshot = previous?.days?.[previousLastDay]?.survival;
      counts[i] *= (cohort.path[n]?.survival ?? 0) / (previousSnapshot || 1);
      const size = cohort.path[n]?.sizeId;
      if (!fulfillmentOnly && size != null) row.stockBeforeOrdersBySize![size] =
        (row.stockBeforeOrdersBySize![size] ?? 0) + Math.floor(counts[i]);
      const p = cohort.path[n];
      if (!fulfillmentOnly && p) for (const id of world.sizes) {
        if (p.animalsPerKg <= (world.maxApk[`${n}|${id}`] ?? -1))
          row.eligibleAtStartBySize![id] = (row.eligibleAtStartBySize![id] ?? 0) + Math.floor(counts[i]);
      }
    });
    const consume = (quantity: number, sizeId: number, day: number, nursery = false, order = false) => {
      let left = quantity;
      // Most mature first, deterministic across all replays.
      const eligible = world.cohorts.map((c, i) => ({ i, p: c.path[n]?.days?.[day] ?? c.path[n] }))
        .filter(({ i, p }) => counts[i] > 0 && p && (nursery ? p.animalsPerKg <= 29_999
          : p.animalsPerKg <= (order ? world.maxApk[`${n}|${day}|${sizeId}`] ?? world.maxApk[`${n}|${sizeId}`] ?? -1
            : world.maxApk[`${n}|${sizeId}`] ?? -1)))
        .sort((a, b) => a.p.animalsPerKg - b.p.animalsPerKg || a.i - b.i);
      for (const { i } of eligible) {
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
    const dates = new Set(eventDays(world, n, firstDay, finalDay));
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
      if (world.deadlineMs && Date.now() > world.deadlineMs) throw new Error("Scenario troppo complesso: ridurre orizzonte, taglie o righe di vendita e riprovare");
      if (day > firstDay) world.cohorts.forEach((c, i) => {
        const previous = c.path[n]?.days?.[previousDay];
        const current = c.path[n]?.days?.[day];
        if (previous && current) counts[i] *= previous.survival > 0 ? current.survival / previous.survival : 0;
      });
      for (const order of monthOrders?.get(day) ?? []) {
        const used = consume(order.quantity, order.sizeId, day, false, true);
        orders[order.key] = used;
        row.ordersRequested += order.quantity;
        row.ordersFulfilled += used;
      }
      for (const sale of monthSales?.get(day) ?? []) {
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
        const p = c.path[n]?.days?.[finalDay] ?? c.path[n];
        return total + (p && p.animalsPerKg <= (world.maxApk[`${n}|${id}`] ?? -1) ? Math.floor(counts[i]) : 0);
      }, 0);
      row.receipts = receipts[n] ?? 0;
      row.remainingAnimals = Math.floor(counts.reduce((a, b) => a + b, 0));
      months.set(n, row);
    }
  }
  return { months, orders, applied, dayStock, nurseryStock, stocksByDay };
}

/** Protect EACH future order and EACH already accepted allocation, not just totals. */
export function safeCapacity(world: World, accepted: Allocation[], candidate: Allocation, upper: number, baseline?: Replay): number {
  const n = monthNumber(candidate.year, candidate.month);
  const day = candidate.day ?? (n === world.first ? world.startDay ?? 1 : 1);
  const reference = baseline ?? replay(world, accepted, { n, day }, true);
  const feasible = (q: number) => {
    const trial = replay(world, [...accepted, { ...candidate, quantity: q }], undefined, true);
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
function bestCapacity(world: World, accepted: Allocation[], candidate: Allocation, upper: number) {
  const n = monthNumber(candidate.year, candidate.month);
  const firstDay = n === world.first ? world.startDay ?? 1 : 1;
  const days = new Set<number>([firstDay]);
  for (const cohort of world.cohorts) {
    const p = cohort.path[n];
    if (!p) continue;
    for (const [text, state] of Object.entries(p.days ?? {}).sort(([a], [b]) => Number(a) - Number(b))) {
      const day = Number(text);
      if (day <= firstDay) continue;
      const limit = candidate.nursery ? 29_999 : world.maxApk[`${n}|${candidate.sizeId}`] ?? -1;
      if (state.animalsPerKg <= limit && (p.days?.[day - 1]?.animalsPerKg ?? Infinity) > limit) days.add(day);
    }
  }
  let best = { quantity: 0, day: firstDay };
  const orderedDays = [...days].sort((a, b) => a - b);
  const reference = replay(world, accepted, { n, day: firstDay, days: orderedDays }, true);
  for (const day of orderedDays) {
    const quantity = safeCapacity(world, accepted, { ...candidate, day }, upper, reference);
    if (quantity > best.quantity) best = { quantity, day };
  }
  return best;
}

export function allocateScenario(world: World, input: ScenarioInput): Allocation[] {
  const requested: Allocation[] = [...input.sales, ...input.sandNursery.map((s, i) => ({
    ...s, id: `__nursery-${i}`, sizeId: 0, pricePerThousand: null, paymentDelayMonths: 0, nursery: true,
  }))];
  requested.sort((a, b) => monthNumber(a.year, a.month) - monthNumber(b.year, b.month) || Number(!!a.nursery) - Number(!!b.nursery));
  const accepted: Allocation[] = [];
  for (const candidate of requested) {
    const best = bestCapacity(world, accepted, candidate, candidate.quantity);
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

export function proposeSales(expected: World, prudent: World, input: ScenarioInput, timings?: ProposalTimings): ScenarioSale[] {
  const measure = <T>(phase: keyof ProposalTimings, operation: () => T): T => {
    if (!timings) return operation();
    const start = performance.now();
    try { return operation(); }
    finally { timings[phase] += performance.now() - start; }
  };
  const proposed: ScenarioSale[] = [];
  const first = monthNumber(input.startYear, input.startMonth);
  const deadline = monthNumber(input.cashDeadline.year, input.cashDeadline.month);
  const prices = input.proposalPrices
    .filter(p => expected.sizes.includes(p.sizeId) && prudent.sizes.includes(p.sizeId))
    .sort((a, b) => b.pricePerThousand - a.pricePerThousand || a.sizeId - b.sizeId);
  let next: ScenarioInput = { ...input, sales: input.sales.slice() };
  if (next.sales.length >= 100) return proposed;
  let prudentAccepted = measure("allocationMs", () => allocateScenario(prudent, next));
  let expectedAccepted = measure("allocationMs", () => allocateScenario(expected, next));
  const receiptsByDeadline = (accepted: Allocation[]) =>
    measure("receiptReplayMs", () => [...replay(prudent, accepted).months].reduce((total, [n, month]) =>
      total + (n >= first && n <= deadline ? month.receipts : 0), 0));
  let currentReceipts = receiptsByDeadline(prudentAccepted);
  // Earliest receipt first, best €/1000 within the month. A heuristic, not an optimum.
  for (let receipt = first; receipt <= deadline; receipt++) {
    for (const price of prices) {
      const gap = input.cashGoal - currentReceipts;
      if (gap <= 0) return proposed;
      const at = receipt - price.paymentDelayMonths;
      if (at < first || at >= first + input.horizon) continue;
      const candidate: ScenarioSale = { ...price, ...monthParts(at), id: `auto-${at}-${price.sizeId}-${proposed.length}`, quantity: Math.ceil(gap * 1000 / price.pricePerThousand) };
      while (next.sales.some(s => s.id === candidate.id)) candidate.id += "-n";
      const wanted = Math.min(2_000_000_000, candidate.quantity);
      candidate.quantity = measure("candidateReplayMs", () => Math.min(
        bestCapacity(prudent, prudentAccepted, candidate, wanted).quantity,
        bestCapacity(expected, expectedAccepted, candidate, wanted).quantity,
      ));
      if (candidate.quantity > 0) {
        proposed.push(candidate);
        next = { ...next, sales: [...next.sales, candidate] };
        prudentAccepted = measure("allocationMs", () => allocateScenario(prudent, next));
        expectedAccepted = measure("allocationMs", () => allocateScenario(expected, next));
        currentReceipts = receiptsByDeadline(prudentAccepted);
      }
      if (next.sales.length >= 100) return proposed;
    }
  }
  return proposed;
}