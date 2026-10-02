/**
 * FIC entity IDs are company-scoped. A shared local customer ID is only a hint:
 * verify it against the issuing company's fiscal identity before linking it.
 */
export class FicCustomerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode = 409,
  ) {
    super(message);
    this.name = "FicCustomerError";
  }
}

export interface FicCustomerIdentity {
  ficClientId?: unknown;
  vatNumber?: unknown;
  taxCode?: unknown;
}

type FicClient = Record<string, any>;
export type FicCustomerRead = (endpoint: string) => Promise<any>;

function fiscalKey(value: unknown): string {
  const text = String(value ?? "").trim();
  if (/^(N\/?A|NULL|NONE|-)?$/i.test(text)) return "";
  return text.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
    .replace(/^IT(?=\d{11}$)/, "");
}

function matchesIdentity(client: FicClient, identity: FicCustomerIdentity): boolean {
  const vat = fiscalKey(identity.vatNumber);
  if (vat) return fiscalKey(client.vat_number) === vat;
  const tax = fiscalKey(identity.taxCode);
  return Boolean(tax && fiscalKey(client.tax_code) === tax);
}

function validId(value: unknown): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function readDetail(id: number, read: FicCustomerRead): Promise<FicClient> {
  const body = await read(`/entities/clients/${id}`);
  if (!body?.data || validId(body.data.id) !== id) {
    throw new FicCustomerError(
      "Fatture in Cloud ha restituito un'anagrafica cliente incompleta. Riprova senza stornare la vendita.",
      "FIC_CUSTOMER_LOOKUP_UNAVAILABLE", 503,
    );
  }
  return body.data;
}

/**
 * null means the ENTIRE company-local lookup succeeded with no match, not that
 * the service failed. FIC supports an inline document entity without entity.id:
 * https://developers.fattureincloud.it/docs/guides/invoice-creation/
 * Never use name matching or an ID belonging to another company.
 */
export async function resolveFicCompanyCustomer(
  identity: FicCustomerIdentity,
  read: FicCustomerRead,
): Promise<FicClient | null> {
  if (!fiscalKey(identity.vatNumber) && !fiscalKey(identity.taxCode)) {
    throw new FicCustomerError(
      "Completare la partita IVA o il codice fiscale del cliente prima di preparare il DDT.",
      "FIC_CUSTOMER_IDENTITY_REQUIRED",
    );
  }
  try {
    const hintedId = validId(identity.ficClientId);
    if (hintedId) {
      try {
        const detail = await readDetail(hintedId, read);
        if (matchesIdentity(detail, identity)) return detail;
      } catch (error: any) {
        if ((error.response?.status ?? error.statusCode) !== 404) throw error;
      }
    }

    const matches = new Map<number, FicClient>();
    const seenPages = new Set<string>();
    let complete = false;
    for (let page = 1; page <= 20; page++) {
      const body = await read(`/entities/clients?page=${page}&per_page=100`);
      if (!Array.isArray(body?.data)) break;
      const clients: FicClient[] = body.data;
      const lastPage = Number(
        body.last_page || body.meta?.pagination?.last_page
        || body.pagination?.last_page
        || (Number(body.total) ? Math.ceil(Number(body.total) / 100) : 0),
      );
      if (!clients.length) {
        if (lastPage > page || (page > 1 && lastPage >= page)) break;
        complete = true;
        break;
      }
      const fingerprint = clients.map(client => client.id).join(",");
      if (seenPages.has(fingerprint)) break;
      seenPages.add(fingerprint);
      for (const client of clients) {
        if (!matchesIdentity(client, identity)) continue;
        const id = validId(client.id);
        if (!id) {
          throw new FicCustomerError(
            "L'anagrafica cliente FIC non ha un identificativo valido.",
            "FIC_CUSTOMER_LOOKUP_UNAVAILABLE", 503,
          );
        }
        matches.set(id, client);
      }
      if (matches.size > 1) {
        throw new FicCustomerError(
          "Più clienti FIC dell'azienda hanno la stessa identità fiscale. Verificare l'anagrafica prima di preparare il DDT.",
          "FIC_CUSTOMER_AMBIGUOUS",
        );
      }
      if ((lastPage > 0 && page >= lastPage) || (!lastPage && clients.length < 100)) {
        complete = true;
        break;
      }
    }
    if (!complete) {
      throw new FicCustomerError(
        "La ricerca cliente in Fatture in Cloud non è stata completata. Riprova senza stornare la vendita.",
        "FIC_CUSTOMER_LOOKUP_UNAVAILABLE", 503,
      );
    }
    if (!matches.size) return null;
    const id = matches.keys().next().value!;
    const detail = await readDetail(id, read);
    if (!matchesIdentity(detail, identity)) {
      throw new FicCustomerError(
        "L'anagrafica cliente FIC è cambiata durante la verifica. Riprova senza stornare la vendita.",
        "FIC_CUSTOMER_IDENTITY_CHANGED",
      );
    }
    return detail;
  } catch (error: any) {
    if (error instanceof FicCustomerError) throw error;
    const status = error.response?.status ?? error.statusCode;
    throw new FicCustomerError(
      status === 401 || status === 403
        ? "Autorizzazione Fatture in Cloud non valida per l'azienda. Verificare la connessione FIC senza stornare la vendita."
        : status === 429
          ? "Limite richieste Fatture in Cloud raggiunto. Attendere e riprovare senza stornare la vendita."
          : "Anagrafica Fatture in Cloud temporaneamente non disponibile. Riprova senza stornare la vendita.",
      "FIC_CUSTOMER_LOOKUP_UNAVAILABLE", 503,
    );
  }
}

/** Inline is a documented FIC mode, only with complete, explicit fiscal data. */
export function assertInlineFicCustomer(customer: {
  name?: unknown; address?: unknown; city?: unknown; postalCode?: unknown;
  vatNumber?: unknown; taxCode?: unknown;
}): void {
  const missing: string[] = [];
  for (const [key, label] of [
    ["name", "denominazione"], ["address", "indirizzo"],
    ["city", "comune"], ["postalCode", "CAP"],
  ] as const) {
    if (!fiscalKey(customer[key])) missing.push(label);
  }
  if (!fiscalKey(customer.vatNumber) && !fiscalKey(customer.taxCode)) {
    missing.push("partita IVA o codice fiscale");
  }
  if (missing.length) {
    throw new FicCustomerError(
      `Il cliente non è nella rubrica FIC dell'azienda. Completare nell'anagrafica: ${missing.join(", ")}. Non è necessario stornare la vendita.`,
      "FIC_CUSTOMER_DETAILS_REQUIRED",
    );
  }
}