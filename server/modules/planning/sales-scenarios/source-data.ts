import { sql } from "drizzle-orm";
import { ordiniCondivisi } from "../../../schema-esterno";

// Legacy hatchery rows used the aggregate T1 label for incoming TP-300 seed.
// Do not guess a representative commercial size for other aggregate labels.
export function hatcherySizeCode(category: string): string {
  const code = category.trim().toUpperCase();
  return code === "T1" ? "TP-300" : code;
}

// NULL cancellation is not a cancellation. Unknown/null states remain reserved
// conservatively; only explicitly cancelled/completed orders are excluded.
export function activeOrdersCondition() {
  return sql`${ordiniCondivisi.cancellato} IS DISTINCT FROM TRUE
    AND ${ordiniCondivisi.stato} IS DISTINCT FROM 'Annullato'
    AND ${ordiniCondivisi.stato} IS DISTINCT FROM 'Completato'`;
}