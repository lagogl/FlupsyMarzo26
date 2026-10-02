import type { ordiniCondivisi } from "../../schema-esterno";
import { buildFutureOrderQuotas, isActiveFutureOrder, parseQuotaDate, type FutureOrderQuota } from "./future-order-quotas";
import { resolveCertifiedOrderDeliveries } from "./commercial-availability/order-residuals";

export type { FutureOrderQuota } from "./future-order-quotas";

/** Read-only adapter: original orders plus fully certified, period-local deliveries. */
export async function loadFutureOrderQuotas(
  referenceDate: string,
  rawOrders?: (typeof ordiniCondivisi.$inferSelect)[],
): Promise<{ quotas: FutureOrderQuota[]; warnings: string[] }> {
  parseQuotaDate(referenceDate);
  let orders = rawOrders;
  if (!orders) {
    const [{ dbEsterno }, { ordiniCondivisi: table }] = await Promise.all([
      import("../../db-esterno"), import("../../schema-esterno"),
    ]);
    if (!dbEsterno) throw new Error("Fonte ordini condivisi non disponibile");
    orders = await dbEsterno.select().from(table);
  }
  const active = orders.filter(isActiveFutureOrder);
  // Fail explicitly on invalid scheduling data before querying delivery sources.
  buildFutureOrderQuotas(active, referenceDate);
  const certified = await resolveCertifiedOrderDeliveries(active, referenceDate);
  const result = buildFutureOrderQuotas(active, referenceDate, certified.verifiedDeliveries);
  return { quotas: result.quotas, warnings: [...certified.warnings, ...result.warnings] };
}