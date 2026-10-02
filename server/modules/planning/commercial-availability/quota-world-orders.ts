import type { Order } from "../sales-scenarios/engine";
import { monthNumber } from "../sales-scenarios/engine";

type Quota = {
  key: string; orderId: number; sizeCode: string; year: number; month: number;
  day: number; quantity: number; precision: "day" | "month";
};

/** Preserve every quota, including hidden physical sizes and later commitments. */
export function quotaWorldOrders(
  quotas: Quota[], sizes: { id: number; code: string }[], first: number,
): Order[] {
  const keys = new Set<string>();
  return quotas.map(quota => {
    const size = sizes.find(s => s.code === quota.sizeCode);
    if (!size) throw new Error(`Ordine ${quota.orderId}: taglia non riconosciuta. Correggere l'ordine prima di simulare`);
    const at = monthNumber(quota.year, quota.month);
    if (at < first || at > first + 59) throw new Error("Quota ordine fuori dall'orizzonte supportato di 60 mesi");
    if (keys.has(quota.key)) throw new Error("Chiave quota ordine duplicata");
    keys.add(quota.key);
    if (!Number.isSafeInteger(quota.quantity) || quota.quantity < 0) throw new Error("Quantità quota ordine non valida");
    return { key: quota.key, at, day: quota.day, sizeId: size.id, quantity: quota.quantity };
  });
}