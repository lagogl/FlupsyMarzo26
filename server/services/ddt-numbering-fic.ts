export interface FicDeliveryNotePage {
  documents: Array<{ number?: unknown }>;
  lastPage?: number;
}

export interface LocalDeliveryNote {
  number?: unknown;
  status?: unknown;
}

export interface DdtNumberingSources {
  fetchFicPage(companyId: number, year: number, page: number): Promise<FicDeliveryNotePage>;
  getLocalDeliveryNotes(companyId: number, year: number): Promise<LocalDeliveryNote[]>;
}

export async function getNextDdtNumber(
  sources: DdtNumberingSources,
  companyId: number,
  year: number
): Promise<number> {
  let ficMax = 0;

  for (let page = 1; page <= 100; page++) {
    const result = await sources.fetchFicPage(companyId, year, page);
    for (const document of result.documents) {
      ficMax = Math.max(ficMax, Number(document.number) || 0);
    }
    if (!result.documents.length || (result.lastPage && page >= result.lastPage)) break;
  }

  const localPendingMax = (await sources.getLocalDeliveryNotes(companyId, year))
    .filter(document => document.status === "locale" || document.status === "invio")
    .reduce((max, document) => Math.max(max, Number(document.number) || 0), 0);
  return Math.max(ficMax, localPendingMax) + 1;
}