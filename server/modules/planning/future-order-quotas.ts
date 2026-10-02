import type { ordiniCondivisi, consegneCondivise } from "../../schema-esterno";

export interface FutureOrderQuota {
  key: string;
  orderId: number;
  sizeCode: string;
  year: number;
  month: number;
  day: number;
  quantity: number;
  precision: "day" | "month";
}

export type QuotaOrder = Pick<typeof ordiniCondivisi.$inferSelect,
  "id" | "quantita" | "quantitaTotale" | "tagliaRichiesta" |
  "dataConsegna" | "dataInizioConsegna" | "dataFineConsegna"> & {
  stato: string | null;
  cancellato: boolean | null;
};
export type QuotaDelivery = Pick<typeof consegneCondivise.$inferSelect,
  "dataConsegna" | "quantitaConsegnata" | "saleSizeCode">;

/** NULL is an active legacy value, not an implicitly cancelled order. */
export function isActiveFutureOrder(order: Pick<QuotaOrder, "stato" | "cancellato">): boolean {
  return order.cancellato !== true &&
    !["completato", "annullato", "completed", "cancelled", "canceled"].includes(order.stato?.trim().toLowerCase() ?? "");
}

/** Same normalization as productionForecastService.normalizeTagliaCode. */
export function normalizeFutureOrderSize(value: string | null): string | null {
  if (!value?.trim()) return null;
  const size = value.toUpperCase().trim();
  if (/^TP-\d+$/.test(size)) return size;
  const match = size.match(/(\d+)/);
  return match ? `TP-${match[1]}` : size;
}

export function parseQuotaDate(value: string): { year: number; month: number; day: number } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`Data quota non valida: ${value}`);
  const [year, month, day] = value.split("-").map(Number);
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (year < 100 || month < 1 || month > 12 || day < 1 || day > days) {
    throw new Error(`Data quota non valida: ${value}`);
  }
  return { year, month, day };
}

const iso = (q: Pick<FutureOrderQuota, "year" | "month" | "day">) =>
  `${q.year}-${String(q.month).padStart(2, "0")}-${String(q.day).padStart(2, "0")}`;

/** Allocate the ORIGINAL quantity first. Expiry never moves demand into another period. */
export function buildFutureOrderQuotas(
  orders: QuotaOrder[],
  referenceDate: string,
  verifiedDeliveries: ReadonlyMap<number, readonly QuotaDelivery[]> = new Map(),
): { quotas: FutureOrderQuota[]; warnings: string[] } {
  parseQuotaDate(referenceDate);
  const quotas: FutureOrderQuota[] = [], warnings: string[] = [];
  for (const order of orders) {
    if (!isActiveFutureOrder(order)) continue;
    const sizeCode = normalizeFutureOrderSize(order.tagliaRichiesta);
    if (!sizeCode) throw new Error(`Ordine ${order.id}: taglia richiesta assente`);
    if (order.quantitaTotale && order.quantita && order.quantitaTotale !== order.quantita) {
      throw new Error(`Ordine ${order.id}: quantità totali non riconciliate`);
    }
    const gross = order.quantitaTotale || order.quantita;
    if (!Number.isSafeInteger(gross) || gross <= 0) throw new Error(`Ordine ${order.id}: quantità assente o non valida`);
    // A partial range is authoritative too: do not fill it with the deprecated date.
    const start = order.dataInizioConsegna || order.dataFineConsegna || order.dataConsegna;
    const end = order.dataFineConsegna || order.dataInizioConsegna || order.dataConsegna;
    if (!start || !end) throw new Error(`Ordine ${order.id}: date consegna assenti`);
    const from = parseQuotaDate(start), to = parseQuotaDate(end);
    if (end < start) throw new Error(`Ordine ${order.id}: intervallo consegna invertito`);
    const original: FutureOrderQuota[] = [];
    if (start === end) {
      original.push({ key: `order:${order.id}:day:${start}`, orderId: order.id, sizeCode,
        ...from, quantity: gross, precision: "day" });
    } else {
      const first = from.year * 12 + from.month - 1, last = to.year * 12 + to.month - 1;
      const count = last - first + 1, base = Math.floor(gross / count), remainder = gross % count;
      for (let index = 0; index < count; index++) {
        const period = first + index, year = Math.floor(period / 12), month = period % 12 + 1;
        original.push({ key: `order:${order.id}:month:${year}-${String(month).padStart(2, "0")}`,
          orderId: order.id, sizeCode, year, month,
          day: new Date(Date.UTC(year, month, 0)).getUTCDate(),
          quantity: base + (index < remainder ? 1 : 0), precision: "month" });
      }
    }
    const totals = new Map<string, number>();
    let ambiguous = false;
    for (const delivery of verifiedDeliveries.get(order.id) ?? []) {
      let period: FutureOrderQuota | undefined;
      try {
        const date = parseQuotaDate(delivery.dataConsegna);
        // An exact-date order has only one quota: certified advance deliveries
        // are uniquely attributable to that deadline, unlike a monthly range.
        period = original.find(q => q.precision === "day" ? delivery.dataConsegna <= iso(q)
          : q.year === date.year && q.month === date.month);
      } catch {
        // Certification does not establish which scheduling period an invalid date belongs to.
      }
      if (!period || normalizeFutureOrderSize(delivery.saleSizeCode) !== sizeCode
        || delivery.dataConsegna > referenceDate
        || !Number.isSafeInteger(delivery.quantitaConsegnata) || delivery.quantitaConsegnata <= 0) {
        ambiguous = true;
        continue;
      }
      totals.set(period.key, (totals.get(period.key) ?? 0) + delivery.quantitaConsegnata);
    }
    if (ambiguous) warnings.push(`Ordine ${order.id}: consegne fuori periodo o ambigue; mantenute quote lorde cautelative, riconciliare.`);
    for (const quota of original) {
      const delivered = totals.get(quota.key) ?? 0;
      if (!ambiguous && delivered > quota.quantity) {
        warnings.push(`Ordine ${order.id}: consegne superiori alla quota ${quota.key}; mantenuta quota lorda, nessun trasferimento ad altri periodi.`);
      } else if (!ambiguous) {
        quota.quantity -= delivered;
      }
      if (iso(quota) >= referenceDate) quotas.push(quota);
    }
  }
  return { quotas, warnings };
}