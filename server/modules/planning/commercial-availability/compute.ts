import type { CommercialInput, CommercialResult } from "../../../../shared/commercial-availability";
import { bestCapacity, replay, safeCapacity, monthNumber, monthParts, type Allocation, type World } from "../sales-scenarios/engine";

export function civilDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Quantity-only adapter. Biology, protected capacity and consumption are shared
 * with sales scenarios; no independent growth/allocation engine lives here. */
export function computeCommercial(world: World, input: CommercialInput) {
  const baseline = replay(world, []);
  const accepted: Allocation[] = [];
  const requests = [...input.sales].sort((a, b) =>
    monthNumber(a.year, a.month) - monthNumber(b.year, b.month) || (a.day ?? 32) - (b.day ?? 32));
  for (const sale of requests) {
    const candidate: Allocation = { ...sale, pricePerThousand: null, paymentDelayMonths: 0 };
    if (sale.day != null) {
      const n = monthNumber(sale.year, sale.month);
      if (n === world.first && sale.day < (world.startDay ?? 1)) throw new Error("Vendita precedente alla data dei dati");
      candidate.quantity = safeCapacity(world, accepted, candidate, sale.quantity);
      accepted.push(candidate);
    } else {
      accepted.push({ ...candidate, ...bestCapacity(world, accepted, candidate, sale.quantity) });
    }
  }
  const applied = replay(world, accepted);
  const plan = input.sales.map(s => {
    const a = accepted.find(a => a.id === s.id)!;
    const acceptedQuantity = applied.applied[s.id] ?? 0;
    return { ...s, day: a.day!, date: civilDate(s.year, s.month, a.day!), acceptedQuantity, shortfall: s.quantity - acceptedQuantity };
  });
  const projection = (allocations: Allocation[], result: ReturnType<typeof replay>) =>
    Array.from({ length: input.horizon }, (_, index) => {
      const n = world.first + index;
      const row = { ...result.months.get(n)!, availableBySize: {} as Record<string, number>, availabilityDayBySize: {} as Record<string, number> };
      row.salesRequested = allocations.length ? input.sales.filter(s => monthNumber(s.year, s.month) === n).reduce((sum, s) => sum + s.quantity, 0) : 0;
      for (const sizeId of input.selectedSizeIds) {
        const best = bestCapacity(world, allocations, { id: "__availability", ...monthParts(n), sizeId, quantity: 0, pricePerThousand: null, paymentDelayMonths: 0 }, 2_000_000_000);
        row.availableBySize[sizeId] = best.quantity;
        if (best.quantity > 0) row.availabilityDayBySize[sizeId] = best.day;
      }
      for (const field of ["stockBeforeOrdersBySize", "eligibleAtStartBySize"] as const) {
        row[field] = Object.fromEntries(Object.entries(row[field] ?? {}).filter(([id]) => input.selectedSizeIds.includes(Number(id))));
      }
      return row;
    });
  const baselineMonths = projection([], baseline);
  const months = accepted.length ? projection(accepted, applied) : structuredClone(baselineMonths);
  const shortfall = (r: ReturnType<typeof replay>) => [...r.months.values()].reduce((sum, m) => sum + m.orderShortfall, 0);
  return {
    months, baselineMonths, plan,
    totalRequested: input.sales.reduce((sum, s) => sum + s.quantity, 0),
    totalAccepted: plan.reduce((sum, s) => sum + s.acceptedQuantity, 0),
    baselineOrderShortfall: shortfall(baseline), orderShortfall: shortfall(applied),
    valid: plan.every(s => s.shortfall === 0)
      && Object.entries(baseline.orders).every(([key, qty]) => (applied.orders[key] ?? 0) >= qty),
  } satisfies Pick<CommercialResult, "months" | "baselineMonths" | "plan" | "totalRequested" | "totalAccepted" | "baselineOrderShortfall" | "orderShortfall" | "valid">;
}