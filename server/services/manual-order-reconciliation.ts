export type ManualOrderAllocation = {
  saleId: number;
  sizeCode: string;
  orderId: number;
  quantity: number;
};

export type ManualOrderReconciliationRequest = {
  idempotencyKey: string;
  allocations: ManualOrderAllocation[];
};

function requestError(message: string): never {
  const error: any = new Error(message);
  error.code = "MANUAL_ORDER_RECONCILIATION_VALIDATION";
  throw error;
}

/** Parses untrusted manual reconciliation input without any database dependency. */
export function parseManualOrderReconciliationRequest(value: unknown): ManualOrderReconciliationRequest {
  const body = value as any;
  if (!body || typeof body.idempotencyKey !== "string" || !body.idempotencyKey.trim()) {
    requestError("Chiave di idempotenza obbligatoria");
  }
  if (!Array.isArray(body.allocations) || body.allocations.length === 0 || body.allocations.length > 500) {
    requestError("Indicare da 1 a 500 allocazioni");
  }

  const grouped = new Map<string, ManualOrderAllocation>();
  for (const item of body.allocations) {
    const saleId = Number(item?.saleId);
    const orderId = Number(item?.orderId);
    const sizeCode = typeof item?.sizeCode === "string" ? item.sizeCode.trim() : "";
    const quantity = Number(item?.quantity);
    if (!Number.isInteger(saleId) || saleId <= 0 ||
        !Number.isInteger(orderId) || orderId <= 0 ||
        !sizeCode || !Number.isInteger(quantity) || quantity <= 0) {
      requestError("Ogni allocazione richiede saleId, orderId, sizeCode e quantità intera positiva");
    }
    const key = `${saleId}:${sizeCode}:${orderId}`;
    const current = grouped.get(key);
    grouped.set(key, current ? { ...current, quantity: current.quantity + quantity } : {
      saleId, orderId, sizeCode, quantity
    });
  }
  return { idempotencyKey: body.idempotencyKey.trim(), allocations: [...grouped.values()] };
}

export function aggregateManualAllocationsBySaleSize(allocations: ManualOrderAllocation[]) {
  const quantities = new Map<string, number>();
  for (const allocation of allocations) {
    const key = `${allocation.saleId}:${allocation.sizeCode}`;
    quantities.set(key, (quantities.get(key) || 0) + allocation.quantity);
  }
  return quantities;
}