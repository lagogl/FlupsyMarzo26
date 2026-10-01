export interface FicDeliveryNotePage {
  documents: Array<{ number?: unknown; date?: unknown; id?: unknown; numeration?: unknown }>;
  lastPage?: number;
}

export interface LocalDeliveryNote {
  number?: unknown;
  status?: unknown;
  legacyNumberException?: boolean;
}

export interface DdtNumberingSources {
  fetchFicPage(companyId: number, year: number, page: number): Promise<FicDeliveryNotePage>;
  getLocalDeliveryNotes(companyId: number, year: number): Promise<LocalDeliveryNote[]>;
}

/** FIC ignores `year` on issued_documents: use its date query instead. */
export function buildFicDdtListPath(year: number, page = 1): string {
  if (!Number.isSafeInteger(year) || year < 2000 || year > 2100
    || !Number.isSafeInteger(page) || page < 1) {
    throw new Error("Anno o pagina DDT non validi");
  }
  const query = `date >= '${year}-01-01' and date <= '${year}-12-31'`;
  return `/issued_documents?type=delivery_note&q=${encodeURIComponent(query)}&page=${page}&per_page=100&fields=id,number,date,numeration`;
}

export function isFicDdtInYear(document: { date?: unknown }, year: number): boolean {
  if (typeof document.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(document.date)) {
    throw new Error("Data DDT FIC assente o non valida: impossibile verificare la numerazione");
  }
  const [y, m, d] = document.date.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    throw new Error("Data DDT FIC non valida: impossibile verificare la numerazione");
  }
  return y === year;
}

export function parseFicDdtPage(payload: unknown): FicDeliveryNotePage {
  const response = payload as { data?: unknown; last_page?: unknown;
    meta?: { pagination?: { last_page?: unknown } }; pagination?: { last_page?: unknown } } | null;
  if (!response || !Array.isArray(response.data)
    || response.data.some(document => document === null || typeof document !== "object")) {
    throw new Error("Elenco DDT FIC non valido: impossibile verificare la numerazione");
  }
  const lastPage = Number(response.last_page ?? response.meta?.pagination?.last_page
    ?? response.pagination?.last_page ?? 0);
  if (!Number.isSafeInteger(lastPage) || lastPage < 0) {
    throw new Error("Paginazione DDT FIC non valida");
  }
  return { documents: response.data, lastPage };
}

export async function getNextDdtNumber(
  sources: DdtNumberingSources,
  companyId: number,
  year: number
): Promise<number> {
  let ficMax = 0;

  for (let page = 1; page <= 100; page++) {
    const result = await sources.fetchFicPage(companyId, year, page);
    if (!result.documents.length && result.lastPage
      && (page < result.lastPage || page > 1)) {
      throw new Error("Lettura DDT FIC incompleta: pagina vuota nella sequenza dichiarata");
    }
    for (const document of result.documents) {
      if (!isFicDdtInYear(document, year)) continue;
      const number = Number(document.number);
      if (document.number == null || !Number.isSafeInteger(number) || number < 0) {
        throw new Error("Numero DDT FIC non valido: impossibile verificare la numerazione");
      }
      ficMax = Math.max(ficMax, number);
    }
    if (!result.documents.length || (result.lastPage && page >= result.lastPage)) break;
    if (page === 100) throw new Error("Lettura DDT FIC incompleta: troppe pagine");
  }

  const localPendingMax = (await sources.getLocalDeliveryNotes(companyId, year))
    .filter(document =>
      !document.legacyNumberException
      && (document.status === "locale" || document.status === "invio")
    )
    .reduce((max, document) => Math.max(max, Number(document.number) || 0), 0);
  return Math.max(ficMax, localPendingMax) + 1;
}

/** Keep the automatic sequence unchanged; an explicit override must be genuinely unused. */
export function chooseDdtReservationNumber(
  proposed: number,
  localMax: number,
  requested?: number,
  usedInFic = false,
  usedLocally = false
): number {
  if (requested === undefined) return Math.max(proposed, localMax + 1);
  if (usedInFic || usedLocally) {
    const error = new Error('Numero DDT già presente in Fatture in Cloud o prenotato localmente');
    (error as Error & { statusCode: number }).statusCode = 409;
    throw error;
  }
  return requested;
}