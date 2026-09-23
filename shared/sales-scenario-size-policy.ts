// Explicit commercial selection confirmed by the user, not a physical-size
// ordering. Growth and acquired orders must continue to use the full catalog.
export const SALES_SCENARIO_SIZE_CODES = [
  "TP-2000", "TP-3000", "TP-4000", "TP-5000", "TP-6000",
  "TP-7000", "TP-8000", "TP-9000", "TP-10000",
] as const;

export function isScenarioSaleSize(code: string): boolean {
  return (SALES_SCENARIO_SIZE_CODES as readonly string[]).includes(code);
}

export function validateScenarioSaleSizes(
  input: { sales: { sizeId: number }[]; proposalPrices: { sizeId: number }[] },
  catalog: { id: number; code: string }[],
): void {
  const describe = (id: number) => catalog.find(s => s.id === id)?.code ?? `ID ${id}`;
  const allowed = new Set(catalog.filter(s => isScenarioSaleSize(s.code)).map(s => s.id));
  const invalidSales = input.sales.filter(s => !allowed.has(s.sizeId));
  if (invalidSales.length) {
    throw new Error(`Taglie vendita non ammesse: ${[...new Set(invalidSales.map(s => describe(s.sizeId)))].join(", ")}. Modificare o eliminare le relative righe del piano vendite. Sono consentite esclusivamente ${SALES_SCENARIO_SIZE_CODES.join(", ")}.`);
  }
  const invalidPrices = input.proposalPrices.filter(s => !allowed.has(s.sizeId));
  if (invalidPrices.length) {
    throw new Error(`Prezzi automatici per taglie non ammesse: ${[...new Set(invalidPrices.map(s => describe(s.sizeId)))].join(", ")}. Rimuovere i prezzi esclusi dalla bozza prima di salvare o ricalcolare. Sono consentite esclusivamente ${SALES_SCENARIO_SIZE_CODES.join(", ")}.`);
  }
}