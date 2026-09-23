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
  input: { selectedSizeIds?: number[]; sales: { sizeId: number }[]; proposalPrices: { sizeId: number }[] },
  catalog: { id: number; code: string }[],
): void {
  const describe = (id: number) => catalog.find(s => s.id === id)?.code ?? `ID ${id}`;
  const allowed = new Set(catalog.filter(s => isScenarioSaleSize(s.code)).map(s => s.id));
  if (input.selectedSizeIds?.length === 0) throw new Error("Selezionare almeno una taglia commerciale");
  const invalidSelected = (input.selectedSizeIds ?? []).filter(id => !allowed.has(id));
  if (invalidSelected.length) {
    throw new Error(`Taglie commerciali selezionate non ammesse: ${[...new Set(invalidSelected.map(describe))].join(", ")}. Sono consentite esclusivamente ${SALES_SCENARIO_SIZE_CODES.join(", ")}.`);
  }
  const selected = input.selectedSizeIds ? new Set(input.selectedSizeIds) : allowed;
  const invalidSales = input.sales.filter(s => !selected.has(s.sizeId));
  if (invalidSales.length) {
    throw new Error(`Taglie vendita non selezionate o non ammesse: ${[...new Set(invalidSales.map(s => describe(s.sizeId)))].join(", ")}. Modificare o eliminare le relative righe del piano vendite.`);
  }
  const invalidPrices = input.proposalPrices.filter(s => !selected.has(s.sizeId));
  if (invalidPrices.length) {
    throw new Error(`Prezzi automatici per taglie non selezionate o non ammesse: ${[...new Set(invalidPrices.map(s => describe(s.sizeId)))].join(", ")}. Rimuovere i prezzi esclusi dalla bozza prima di salvare o ricalcolare.`);
  }
}

export function selectedScenarioSizeIds(
  input: { selectedSizeIds?: number[] },
  catalog: { id: number; code: string }[],
): number[] {
  return input.selectedSizeIds ?? catalog.filter(s => isScenarioSaleSize(s.code)).map(s => s.id);
}