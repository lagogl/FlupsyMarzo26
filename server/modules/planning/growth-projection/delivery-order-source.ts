import { sql } from "drizzle-orm";
import { ordiniCondivisi } from "../../../schema-esterno";

export class DeliveryOrdersUnavailableError extends Error {
  constructor() {
    super("Copertura alle date di consegna non disponibile: database ordini esterno non configurato");
    this.name = "DeliveryOrdersUnavailableError";
  }
}

/**
 * Delivery-date coverage follows the open-order policy used for future
 * commitments: null cancellation/state values are conservatively active,
 * while explicitly cancelled or completed orders are excluded. The legacy
 * monthly aggregation intentionally retains its existing broader filter.
 */
export function activeDeliveryOrdersCondition() {
  return sql`${ordiniCondivisi.cancellato} IS DISTINCT FROM TRUE
    AND ${ordiniCondivisi.stato} IS DISTINCT FROM 'Annullato'
    AND ${ordiniCondivisi.stato} IS DISTINCT FROM 'Completato'`;
}