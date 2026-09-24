export type DdrSale = {
  id: number;
  companyId: number | null;
  saleDate: string | Date;
  ddrNumber: number | null;
  ddrYear: number | null;
};

export type DdrNumberingTransaction = {
  lockSale(saleId: number): Promise<DdrSale | null>;
  ensureSequence(companyId: number, year: number): Promise<void>;
  lockNextNumber(companyId: number, year: number): Promise<number>;
  isNumberTaken?(companyId: number, year: number, number: number): Promise<boolean>;
  assignSale(saleId: number, number: number, year: number): Promise<void>;
  advanceSequence(companyId: number, year: number, nextNumber: number): Promise<void>;
};

export type DdrNumberingStore = {
  transaction<T>(work: (tx: DdrNumberingTransaction) => Promise<T>): Promise<T>;
};

export async function ensureDdrNumber(
  store: DdrNumberingStore,
  saleId: number,
  requestedNumber?: number
): Promise<{ number: number; year: number }> {
  return store.transaction(async tx => {
    const sale = await tx.lockSale(saleId);
    if (!sale) throw new Error('Vendita non trovata');
    if (sale.ddrNumber && sale.ddrYear) {
      if (requestedNumber !== undefined && requestedNumber !== sale.ddrNumber) {
        throw new Error('Il DDR è già numerato: non è possibile rinumerare un documento emesso');
      }
      return { number: sale.ddrNumber, year: sale.ddrYear };
    }
    if (!sale.companyId) throw new Error('Azienda emittente non associata alla vendita');
    if (requestedNumber !== undefined && (!Number.isSafeInteger(requestedNumber) || requestedNumber < 1 || requestedNumber >= 2_147_483_647)) {
      throw new Error('Numero DDR non valido');
    }

    const year = sale.saleDate instanceof Date
      ? sale.saleDate.getFullYear()
      : Number(String(sale.saleDate).slice(0, 4));
    if (!Number.isInteger(year)) throw new Error('Anno DDR non valido');

    await tx.ensureSequence(sale.companyId, year);
    const nextNumber = await tx.lockNextNumber(sale.companyId, year);
    if (!Number.isInteger(nextNumber) || nextNumber < 1) {
      throw new Error('Progressivo DDR non valido');
    }

    const assigned = requestedNumber ?? nextNumber;
    if (requestedNumber !== undefined) {
      if (!tx.isNumberTaken) throw new Error('Verifica numerazione DDR non disponibile');
      if (await tx.isNumberTaken(sale.companyId, year, assigned)) {
        throw new Error(`DDR n. ${assigned}/${year} già assegnato a un'altra vendita`);
      }
    }
    await tx.assignSale(saleId, assigned, year);
    await tx.advanceSequence(sale.companyId, year, Math.max(nextNumber, assigned + 1));
    return { number: assigned, year };
  });
}

export function validateNextDdrNumber(nextNumber: number, highestAssigned: number): number {
  const minimum = highestAssigned + 1;
  if (!Number.isInteger(nextNumber) || nextNumber < minimum) {
    throw new Error(`Il prossimo numero non può essere inferiore a ${minimum}`);
  }
  return nextNumber;
}