interface SaleWithDdt {
  id: number;
}

/** Only the explicit pre-send conflict response may open the recovery controls. */
export function openDdtNumberRecoveryOnConflict(
  error: unknown,
  sale: SaleWithDdt,
  actions: {
    selectSale: (id: number) => void;
    invalidateNumbers: (id: number) => void;
    openDialog: (sale: SaleWithDdt) => void;
  }
): boolean {
  if ((error as { data?: { code?: string } })?.data?.code !== "FIC_DDT_NUMBER_CONFLICT") return false;
  actions.selectSale(sale.id);
  actions.invalidateNumbers(sale.id);
  actions.openDialog(sale);
  return true;
}