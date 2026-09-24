export type DdrSale = {
  id: number;
  companyId: number | null;
  saleDate: string | Date;
  ddrNumber: number | null;
  ddrYear: number | null;
  status?: string | null;
  ddrReservation?: DdrReservation | null;
};

export type DdrReservation = {
  state: 'reserved' | 'issuance_started' | 'issued' | 'released';
  number: number;
  year: number;
  assignedAt?: string;
  issuanceStartedAt?: string;
  issuedAt?: string;
  releasedAt?: string;
  releasedBy?: number | null;
  releaseReason?: string;
};

export type DdrNumberingTransaction = {
  lockSale(saleId: number): Promise<DdrSale | null>;
  ensureSequence(companyId: number, year: number): Promise<void>;
  lockNextNumber(companyId: number, year: number): Promise<number>;
  isNumberTaken(companyId: number, year: number, number: number): Promise<boolean>;
  assignSale(saleId: number, number: number, year: number): Promise<void>;
  advanceSequence(companyId: number, year: number, nextNumber: number): Promise<void>;
  setReservation(saleId: number, reservation: DdrReservation): Promise<void>;
  releaseSaleNumber(saleId: number, number: number, year: number): Promise<void>;
  highestAssignedNumber(companyId: number, year: number, excludingSaleId: number): Promise<number>;
};

export type DdrNumberingStore = {
  transaction<T>(work: (tx: DdrNumberingTransaction) => Promise<T>): Promise<T>;
};

export async function ensureDdrNumber(
  store: DdrNumberingStore,
  saleId: number,
  requestedNumber?: number,
  options: { issuanceAttempt?: boolean } = {}
): Promise<{ number: number; year: number }> {
  return store.transaction(async tx => {
    const sale = await tx.lockSale(saleId);
    if (!sale) throw new Error('Vendita non trovata');
    if (sale.status === 'cancelled') {
      throw new Error('Non è possibile assegnare o generare un DDR per una vendita stornata');
    }
    if (sale.ddrNumber && sale.ddrYear) {
      if (requestedNumber !== undefined && requestedNumber !== sale.ddrNumber) {
        throw new Error('Il DDR è già numerato: non è possibile rinumerare un documento emesso');
      }
      if (options.issuanceAttempt && sale.ddrReservation?.state !== 'issued') {
        await tx.setReservation(saleId, {
          state: 'issuance_started',
          number: sale.ddrNumber,
          year: sale.ddrYear,
          ...(sale.ddrReservation?.assignedAt ? { assignedAt: sale.ddrReservation.assignedAt } : {}),
          issuanceStartedAt: new Date().toISOString()
        });
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

    let assigned = requestedNumber ?? nextNumber;
    if (requestedNumber !== undefined) {
      if (await tx.isNumberTaken(sale.companyId, year, assigned)) {
        throw new Error(`DDR n. ${assigned}/${year} già assegnato a un'altra vendita`);
      }
    } else {
      while (await tx.isNumberTaken(sale.companyId, year, assigned)) assigned += 1;
    }
    await tx.assignSale(saleId, assigned, year);
    await tx.setReservation(saleId, {
      state: options.issuanceAttempt ? 'issuance_started' : 'reserved',
      number: assigned,
      year,
      assignedAt: new Date().toISOString(),
      ...(options.issuanceAttempt ? { issuanceStartedAt: new Date().toISOString() } : {})
    });
    await tx.advanceSequence(sale.companyId, year, Math.max(nextNumber, assigned + 1));
    return { number: assigned, year };
  });
}

/**
 * Release only a reservation created by this flow and never used for a PDF.
 * Missing/legacy markers and any attempted issuance are deliberately retained.
 */
export async function releaseUnusedDdrNumber(
  tx: DdrNumberingTransaction,
  saleId: number,
  reason: string,
  releasedBy?: number | null
): Promise<
  | { released: false; reason: string }
  | { released: true; number: number; year: number }
> {
  const sale = await tx.lockSale(saleId);
  if (!sale) throw new Error('Vendita non trovata');
  if (sale.status && sale.status !== 'confirmed') {
    return { released: false, reason: 'È possibile rilasciare il DDR solo per una vendita confermata' };
  }
  if (!sale.ddrNumber || !sale.ddrYear) return { released: false, reason: 'La vendita non ha un DDR prenotato' };
  if (sale.ddrReservation?.state !== 'reserved'
    || sale.ddrReservation.number !== sale.ddrNumber
    || sale.ddrReservation.year !== sale.ddrYear) {
    return {
      released: false,
      reason: 'DDR non rilasciabile: emissione già avviata o stato non verificabile'
    };
  }
  if (!sale.companyId) throw new Error('Azienda emittente non associata alla vendita');

  const number = sale.ddrNumber;
  const year = sale.ddrYear;
  await tx.ensureSequence(sale.companyId, year);
  const nextNumber = await tx.lockNextNumber(sale.companyId, year);
  const highestOtherNumber = await tx.highestAssignedNumber(sale.companyId, year, saleId);
  await tx.releaseSaleNumber(saleId, number, year);
  await tx.setReservation(saleId, {
    ...sale.ddrReservation,
    state: 'released',
    releasedAt: new Date().toISOString(),
    releasedBy: releasedBy ?? null,
    releaseReason: reason
  });

  // Rewind only when this is still the most recent reservation. If a later
  // DDR exists, leave the sequence untouched; the allocator also skips any
  // occupied numbers when it searches forward.
  if (nextNumber === number + 1 && highestOtherNumber < number) {
    await tx.advanceSequence(sale.companyId, year, number);
  }
  return { released: true, number, year };
}

export function validateNextDdrNumber(nextNumber: number, highestAssigned: number): number {
  const minimum = highestAssigned + 1;
  if (!Number.isInteger(nextNumber) || nextNumber < minimum) {
    throw new Error(`Il prossimo numero non può essere inferiore a ${minimum}`);
  }
  return nextNumber;
}