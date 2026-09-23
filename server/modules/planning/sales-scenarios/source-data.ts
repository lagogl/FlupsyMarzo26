import { sql } from "drizzle-orm";
import { ordiniCondivisi } from "../../../schema-esterno";
import { monthNumber } from "./engine";

// Legacy hatchery rows used the aggregate T1 label for incoming TP-300 seed.
// Do not guess a representative commercial size for other aggregate labels.
export function hatcherySizeCode(category: string): string {
  const code = category.trim().toUpperCase();
  return code === "T1" ? "TP-300" : code;
}

/** An existing order is relevant only if its first delivery month belongs to
 * this scenario or a future month. Earlier open/partial orders are not moved
 * into the current month. */
export function scenarioOrderDeliveryMonth(date: string | Date | null, firstMonth: number): number | null {
  if (!date) throw new Error("Data consegna ordine mancante");
  const text = date instanceof Date ? date.toISOString() : String(date);
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T| )/.exec(text);
  if (!match) throw new Error("Data consegna ordine non valida");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 2020 || year > 2200 || month < 1 || month > 12 || day < 1 || day > new Date(year, month, 0).getDate()) throw new Error("Data consegna ordine non valida");
  const at = monthNumber(year, month);
  return at < firstMonth ? null : at;
}

export function scenarioOrderDeliveryDay(date: string | Date): number {
  const text = date instanceof Date ? date.toISOString() : String(date);
  return Number(/^(\d{4})-(\d{2})-(\d{2})/.exec(text)![3]);
}

// NULL cancellation is not a cancellation. Unknown/null states remain reserved
// conservatively; only explicitly cancelled/completed orders are excluded.
export function activeOrdersCondition() {
  return sql`${ordiniCondivisi.cancellato} IS DISTINCT FROM TRUE
    AND ${ordiniCondivisi.stato} IS DISTINCT FROM 'Annullato'
    AND ${ordiniCondivisi.stato} IS DISTINCT FROM 'Completato'`;
}