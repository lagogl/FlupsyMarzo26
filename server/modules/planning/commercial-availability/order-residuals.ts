import { inArray } from "drizzle-orm";
import { advancedSales, saleBags } from "../../../../shared/schema";
import { consegneCondivise, ordiniCondivisi } from "../../../schema-esterno";
import { businessToday } from "../../../utils/business-date";

type Delivery = typeof consegneCondivise.$inferSelect;
type SourceSale = { id: number; status: string; saleDate: string; saleNumber: string; cancelledAt?: Date | null };
export function verifiedResidual(
  gross: number, deliveries: Delivery[], sales: SourceSale[], bagTotals: Map<string, number>, today: string,
): { quantity: number; verified: boolean } {
  if (!Number.isSafeInteger(gross) || gross <= 0) throw new Error("Quantità ordine assente o non valida");
  let delivered = 0;
  const sources = new Set<string>();
  const allocated = new Map<string, number>();
  for (const d of deliveries) {
    const sale = sales.find(s => s.id === d.advancedSaleId);
    const key = `${d.advancedSaleId}|${d.saleSizeCode}`;
    const canonicalReference = `advanced-sale:${d.advancedSaleId}:order:${d.ordineId}:size:${d.saleSizeCode}`;
    const sourceMatches = d.sourceReference === canonicalReference
      || (d.sourceReference?.startsWith(`${canonicalReference}:manual:`) && /^[a-f0-9]{24}$/.test(d.sourceReference.slice(`${canonicalReference}:manual:`.length)));
    // A source reference alone is not proof: reconcile with the real confirmed
    // sale and its analytical bags. Unknown/manual/external provenance stays gross.
    if (!sourceMatches || d.appOrigine !== "delta_futuro" || !d.sourceReference || sources.has(d.sourceReference) || !sale
      || !["confirmed", "completed"].includes(sale.status) || sale.cancelledAt
      || sale.saleNumber !== d.advancedSaleNumber || !d.saleSizeCode
      || d.dataConsegna !== sale.saleDate || d.dataConsegna > today || sale.saleDate > today
      || !Number.isSafeInteger(d.quantitaConsegnata) || d.quantitaConsegnata <= 0) return { quantity: gross, verified: false };
    sources.add(d.sourceReference);
    allocated.set(key, (allocated.get(key) ?? 0) + d.quantitaConsegnata);
    if (allocated.get(key)! > (bagTotals.get(key) ?? 0)) return { quantity: gross, verified: false };
    delivered += d.quantitaConsegnata;
  }
  if (delivered > gross) throw new Error("Consegne superiori alla quantità ordine: riconciliare prima del calcolo");
  return { quantity: gross - delivered, verified: deliveries.length > 0 };
}

export async function resolveOrderQuantities(orders: (typeof ordiniCondivisi.$inferSelect)[]) {
  const quantities = new Map<number, number>(), warnings: string[] = [];
  if (!orders.length) return { quantities, warnings };
  const [{ db }, { dbEsterno }] = await Promise.all([import("../../../db"), import("../../../db-esterno")]);
  if (!dbEsterno) throw new Error("Fonte consegne non disponibile");
  const deliveries = await dbEsterno.select().from(consegneCondivise).where(inArray(consegneCondivise.ordineId, orders.map(o => o.id)));
  const ids = [...new Set(deliveries.flatMap(d => d.advancedSaleId ? [d.advancedSaleId] : []))];
  const [sales, bags, allSaleDeliveries] = ids.length ? await Promise.all([
    db.select().from(advancedSales).where(inArray(advancedSales.id, ids)),
    db.select().from(saleBags).where(inArray(saleBags.advancedSaleId, ids)),
    dbEsterno.select().from(consegneCondivise).where(inArray(consegneCondivise.advancedSaleId, ids)),
  ]) : [[], [], []];
  const bagTotals = new Map<string, number>();
  for (const b of bags) {
    const key = `${b.advancedSaleId}|${b.sizeCode}`;
    bagTotals.set(key, (bagTotals.get(key) ?? 0) + b.animalCount);
  }
  // Prevent the same analytical sale from certifying deliveries to two orders
  // above its actual per-size total (including out-of-horizon orders).
  const acrossOrders = new Map<string, number>();
  for (const d of allSaleDeliveries) {
    const key = `${d.advancedSaleId}|${d.saleSizeCode}`;
    acrossOrders.set(key, (acrossOrders.get(key) ?? 0) + d.quantitaConsegnata);
  }
  for (const [key, quantity] of acrossOrders) if (quantity > (bagTotals.get(key) ?? 0)) bagTotals.set(key, 0);
  const t = businessToday();
  const today = `${t.year}-${String(t.month).padStart(2, "0")}-${String(t.day).padStart(2, "0")}`;
  for (const o of orders) {
    if (o.quantitaTotale && o.quantita && o.quantitaTotale !== o.quantita) throw new Error(`Ordine ${o.id}: quantità totali non riconciliate`);
    const rows = deliveries.filter(d => d.ordineId === o.id);
    const residual = verifiedResidual(o.quantitaTotale || o.quantita, rows, sales, bagTotals, today);
    quantities.set(o.id, residual.quantity);
    if (residual.verified) warnings.push(`Ordine ${o.id}: residuo analiticamente verificato ${residual.quantity} animali.`);
    else if (rows.length || o.stato === "Parziale") warnings.push(`Ordine ${o.id}: residuo non certificabile, riservata quantità lorda cautelativa ${residual.quantity}; riconciliare le consegne.`);
  }
  return { quantities, warnings };
}