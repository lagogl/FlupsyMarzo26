import type { ScenarioInput, ScenarioSale, ScenarioProjection, ScenarioMonth } from "../../../../shared/sales-scenarios";

export const monthNumber = (year: number, month: number) => year * 12 + month - 1;
export const monthParts = (n: number) => ({ year: Math.floor(n / 12), month: n % 12 + 1 });
export interface Cohort {
  quantity: number;
  entry: number;
  // Each value is the survival factor from the previous month, not from origin.
  path: Record<number, { survival: number; sizeId: number | null; animalsPerKg: number }>;
}
export interface Order { key: string; at: number; sizeId: number; quantity: number }
export interface World {
  first: number; last: number;
  cohorts: Cohort[];
  orders: Order[];
  orderCommitments?: Record<number, NonNullable<ScenarioMonth["orderCommitment"]>>;
  maxApk: Record<string, number>;
  sizes: number[];
  deadlineMs?: number;
}
interface Allocation extends ScenarioSale { nursery?: boolean }
interface Replay {
  months: Map<number, ScenarioMonth>;
  orders: Record<string, number>;
  applied: Record<string, number>;
}

/** Cheap linear replay over precomputed growth paths. Never changes its inputs. */
export function replay(world: World, allocations: Allocation[]): Replay {
  if (world.deadlineMs && Date.now() > world.deadlineMs) throw new Error("Scenario troppo complesso: ridurre orizzonte, taglie o righe di vendita e riprovare");
  const counts = world.cohorts.map(() => 0);
  const months = new Map<number, ScenarioMonth>();
  const orders: Record<string, number> = {};
  const applied: Record<string, number> = {};
  const receipts: Record<number, number> = {};
  for (let n = world.first; n <= world.last; n++) {
    if (world.deadlineMs && Date.now() > world.deadlineMs) throw new Error("Scenario troppo complesso: ridurre orizzonte, taglie o righe di vendita e riprovare");
    const row: ScenarioMonth = { ...monthParts(n), availableBySize: {}, stockBeforeOrdersBySize: {}, eligibleAtStartBySize: {}, ordersRequested: 0, ordersFulfilled: 0, orderShortfall: 0, orderCommitment: world.orderCommitments?.[n], salesRequested: 0, salesApplied: 0, sandNurseryApplied: 0, revenue: 0, receipts: 0, remainingAnimals: 0 };
    world.cohorts.forEach((cohort, i) => {
      if (cohort.entry === n) counts[i] += cohort.quantity;
      counts[i] *= cohort.path[n]?.survival ?? 0;
      const size = cohort.path[n]?.sizeId;
      if (size != null) row.stockBeforeOrdersBySize![size] =
        (row.stockBeforeOrdersBySize![size] ?? 0) + Math.floor(counts[i]);
      const p = cohort.path[n];
      if (p) for (const id of world.sizes) {
        if (p.animalsPerKg <= (world.maxApk[`${n}|${id}`] ?? -1))
          row.eligibleAtStartBySize![id] = (row.eligibleAtStartBySize![id] ?? 0) + Math.floor(counts[i]);
      }
    });
    const consume = (quantity: number, sizeId: number, nursery = false) => {
      let left = quantity;
      // Most mature first, deterministic across all replays.
      const eligible = world.cohorts.map((c, i) => ({ i, p: c.path[n] }))
        .filter(({ i, p }) => counts[i] > 0 && p && (nursery ? p.animalsPerKg <= 29_999
          : p.animalsPerKg <= (world.maxApk[`${n}|${sizeId}`] ?? -1)))
        .sort((a, b) => a.p.animalsPerKg - b.p.animalsPerKg || a.i - b.i);
      for (const { i } of eligible) {
        const take = Math.min(left, Math.floor(counts[i]));
        counts[i] -= take;
        left -= take;
        if (left <= 0) break;
      }
      return quantity - left;
    };
    for (const order of world.orders.filter(o => o.at === n)) {
      const used = consume(order.quantity, order.sizeId);
      orders[order.key] = used;
      row.ordersRequested += order.quantity;
      row.ordersFulfilled += used;
    }
    row.orderShortfall = row.ordersRequested - row.ordersFulfilled;
    for (const sale of allocations.filter(a => monthNumber(a.year, a.month) === n)) {
      const used = consume(sale.quantity, sale.sizeId, sale.nursery);
      applied[sale.id] = used;
      if (sale.nursery) row.sandNurseryApplied += used;
      else {
        row.salesRequested += sale.quantity;
        row.salesApplied += used;
        const revenue = used * (sale.pricePerThousand ?? 0) / 1000;
        row.revenue += revenue;
        receipts[n + sale.paymentDelayMonths] = (receipts[n + sale.paymentDelayMonths] ?? 0) + revenue;
      }
    }
    for (const id of world.sizes) row.availableBySize[id] = world.cohorts.reduce((total, c, i) => {
      const p = c.path[n];
      return total + (p && p.animalsPerKg <= (world.maxApk[`${n}|${id}`] ?? -1) ? Math.floor(counts[i]) : 0);
    }, 0);
    row.receipts = receipts[n] ?? 0;
    row.remainingAnimals = Math.floor(counts.reduce((a, b) => a + b, 0));
    months.set(n, row);
  }
  return { months, orders, applied };
}

/** Protect EACH future order and EACH already accepted allocation, not just totals. */
export function safeCapacity(world: World, accepted: Allocation[], candidate: Allocation, upper: number): number {
  const reference = replay(world, accepted);
  const feasible = (q: number) => {
    const trial = replay(world, [...accepted, { ...candidate, quantity: q }]);
    return (trial.applied[candidate.id] ?? 0) >= q
      && Object.entries(reference.orders).every(([id, fulfilled]) => (trial.orders[id] ?? 0) >= fulfilled)
      && Object.entries(reference.applied).every(([id, fulfilled]) => (trial.applied[id] ?? 0) >= fulfilled);
  };
  const row = reference.months.get(monthNumber(candidate.year, candidate.month));
  const stock = candidate.nursery ? row?.remainingAnimals ?? 0 : row?.availableBySize[candidate.sizeId] ?? 0;
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

export function allocateScenario(world: World, input: ScenarioInput): Allocation[] {
  const requested: Allocation[] = [...input.sales, ...input.sandNursery.map((s, i) => ({
    ...s, id: `__nursery-${i}`, sizeId: 0, pricePerThousand: null, paymentDelayMonths: 0, nursery: true,
  }))];
  requested.sort((a, b) => monthNumber(a.year, a.month) - monthNumber(b.year, b.month) || Number(!!a.nursery) - Number(!!b.nursery));
  const accepted: Allocation[] = [];
  for (const candidate of requested) {
    accepted.push({ ...candidate, quantity: safeCapacity(world, accepted, candidate, candidate.quantity) });
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
      for (const sizeId of world.sizes) {
        const upper = row.availableBySize[sizeId] ?? 0;
        row.availableBySize[sizeId] = upper ? safeCapacity(world, accepted, {
          id: "__availability", ...monthParts(n), sizeId, quantity: 0, pricePerThousand: null, paymentDelayMonths: 0,
        }, upper) : 0;
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

export function proposeSales(expected: World, prudent: World, input: ScenarioInput): ScenarioSale[] {
  const proposed: ScenarioSale[] = [];
  const first = monthNumber(input.startYear, input.startMonth);
  const deadline = monthNumber(input.cashDeadline.year, input.cashDeadline.month);
  const prices = input.proposalPrices
    .filter(p => expected.sizes.includes(p.sizeId) && prudent.sizes.includes(p.sizeId))
    .sort((a, b) => b.pricePerThousand - a.pricePerThousand || a.sizeId - b.sizeId);
  let next: ScenarioInput = { ...input, sales: input.sales.slice() };
  if (next.sales.length >= 100) return proposed;
  let current = projectWorld(prudent, next, false);
  let prudentAccepted = allocateScenario(prudent, next);
  let expectedAccepted = allocateScenario(expected, next);
  // Earliest receipt first, best €/1000 within the month. A heuristic, not an optimum.
  for (let receipt = first; receipt <= deadline; receipt++) {
    for (const price of prices) {
      const gap = input.cashGoal - current.receiptsByDeadline;
      if (gap <= 0) return proposed;
      const at = receipt - price.paymentDelayMonths;
      if (at < first || at >= first + input.horizon) continue;
      const candidate: ScenarioSale = { ...price, ...monthParts(at), id: `auto-${at}-${price.sizeId}-${proposed.length}`, quantity: Math.ceil(gap * 1000 / price.pricePerThousand) };
      while (next.sales.some(s => s.id === candidate.id)) candidate.id += "-n";
      const wanted = Math.min(2_000_000_000, candidate.quantity);
      candidate.quantity = Math.min(
        safeCapacity(prudent, prudentAccepted, candidate, wanted),
        safeCapacity(expected, expectedAccepted, candidate, wanted),
      );
      if (candidate.quantity > 0) {
        proposed.push(candidate);
        next = { ...next, sales: [...next.sales, candidate] };
        current = projectWorld(prudent, next, false);
        prudentAccepted = allocateScenario(prudent, next);
        expectedAccepted = allocateScenario(expected, next);
      }
      if (next.sales.length >= 100) return proposed;
    }
  }
  return proposed;
}