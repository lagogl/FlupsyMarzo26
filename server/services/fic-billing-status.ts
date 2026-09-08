export type FicBillingStatus =
  | "not_sent"
  | "delivery_note_local"
  | "delivery_note_only"
  | "invoiced"
  | "ambiguous"
  | "unavailable";

export interface BillingEvidence {
  status: FicBillingStatus;
  invoiceId: number | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  invoicedQuantity: number | null;
  deliveryNoteQuantity?: number | null;
  checkedAt: string;
  reason?: string;
}

const normalizedNumber = (value: unknown) =>
  String(value ?? "").toLowerCase().replace(/\s+/g, "").replace(/^0+/, "");

const asId = (value: unknown): number | null => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

function referencedDeliveryNoteIds(invoice: any): number[] {
  const ids = new Set<number>();
  if (String(invoice?.original_document?.type || "").toLowerCase() === "delivery_note") {
    const id = asId(invoice.original_document.id);
    if (id) ids.add(id);
  }
  if (String(invoice?.delivery_note?.type || "").toLowerCase() === "delivery_note") {
    const id = asId(invoice.delivery_note.id);
    if (id) ids.add(id);
  }
  for (const collection of [
    invoice?.related_documents,
    invoice?.linked_documents,
    invoice?.source_documents,
    invoice?.delivery_notes
  ]) {
    if (!Array.isArray(collection)) continue;
    for (const document of collection) {
      const type = String(document?.type ?? document?.document_type ?? "").toLowerCase();
      if (type !== "delivery_note") continue;
      const id = asId(document?.id ?? document?.document_id);
      if (id) ids.add(id);
    }
  }
  return [...ids];
}

export function sanitizeFicInvoice(invoice: any): any {
  const deliveryNoteMentionDates = new Set<string>();
  const quantities: number[] = [];
  for (const item of Array.isArray(invoice?.items_list) ? invoice.items_list : []) {
    const quantity = Number(item?.qty);
    if (Number.isFinite(quantity) && quantity >= 0) quantities.push(quantity);
    for (const text of [item?.name, item?.description].filter(Boolean).map(String)) {
      for (const match of text.matchAll(/\bddt\b\s*(?:n(?:[.°])?\s*)?\d+\s+(?:del|del\s+giorno|data)\s+(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/gi)) {
        deliveryNoteMentionDates.add(
          `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`
        );
      }
    }
  }
  return {
    id: asId(invoice?.id),
    type: String(invoice?.type || ""),
    number: invoice?.number ?? null,
    numeration: String(invoice?.numeration || ""),
    date: String(invoice?.date || ""),
    entity: { id: asId(invoice?.entity?.id) },
    original_document: invoice?.original_document ? {
      id: asId(invoice.original_document.id),
      type: String(invoice.original_document.type || "")
    } : null,
    delivery_note: invoice?.delivery_note ? {
      id: asId(invoice.delivery_note.id),
      type: String(invoice.delivery_note.type || "")
    } : null,
    related_documents: Array.isArray(invoice?.related_documents)
      ? invoice.related_documents.map((document: any) => ({
          id: asId(document?.id ?? document?.document_id),
          type: String(document?.type ?? document?.document_type ?? "")
        }))
      : [],
    linked_documents: Array.isArray(invoice?.linked_documents)
      ? invoice.linked_documents.map((document: any) => ({
          id: asId(document?.id ?? document?.document_id),
          type: String(document?.type ?? document?.document_type ?? "")
        }))
      : [],
    source_documents: Array.isArray(invoice?.source_documents)
      ? invoice.source_documents.map((document: any) => ({
          id: asId(document?.id ?? document?.document_id),
          type: String(document?.type ?? document?.document_type ?? "")
        }))
      : [],
    delivery_notes: Array.isArray(invoice?.delivery_notes)
      ? invoice.delivery_notes.map((document: any) => ({
          id: asId(document?.id ?? document?.document_id),
          type: String(document?.type ?? document?.document_type ?? "")
        }))
      : [],
    ei_data: {
      od_number: String(invoice?.ei_data?.od_number || ""),
      od_date: String(invoice?.ei_data?.od_date || "")
    },
    quantities,
    delivery_note_mention_dates: [...deliveryNoteMentionDates]
  };
}

export function matchInvoiceToDeliveryNote(invoice: any, deliveryNote: {
  ficId?: number | null;
  number: number | string;
  date: string;
  customerFicId?: number | null;
  quantity?: number | null;
  allowUnstructuredMatch?: boolean;
  allowedFingerprintInvoiceId?: number | null;
}): "certain" | "ambiguous" | "none" {
  if (deliveryNote.ficId && referencedDeliveryNoteIds(invoice).includes(deliveryNote.ficId)) return "certain";

  const originalNumber = normalizedNumber(invoice?.ei_data?.od_number);
  const originalDate = String(invoice?.ei_data?.od_date ?? "");
  const sameCustomer = asId(deliveryNote.customerFicId)
    && asId(invoice?.entity?.id) === asId(deliveryNote.customerFicId);
  const allowedInvoiceId = deliveryNote.allowedFingerprintInvoiceId;
  if (deliveryNote.allowUnstructuredMatch !== false
      && (allowedInvoiceId == null || asId(invoice?.id) === allowedInvoiceId)
      && matchesInvoiceFingerprint(invoice, deliveryNote)) return "certain";
  if (
    originalNumber &&
    originalNumber === normalizedNumber(deliveryNote.number) &&
    originalDate === String(deliveryNote.date) &&
    sameCustomer
  ) return "ambiguous";

  return "none";
}

export function matchesInvoiceFingerprint(invoice: any, deliveryNote: {
  date: string;
  customerFicId?: number | null;
  quantity?: number | null;
}): boolean {
  if (referencedDeliveryNoteIds(invoice).length > 0) return false;
  const invoiceCustomerId = asId(invoice?.entity?.id);
  const ddtCustomerId = asId(deliveryNote.customerFicId);
  if (!invoiceCustomerId || !ddtCustomerId || invoiceCustomerId !== ddtCustomerId) return false;
  const ddtQuantity = Number(deliveryNote.quantity);
  if (!Number.isFinite(ddtQuantity) || ddtQuantity <= 0) return false;
  const sameDdtDate = String(invoice?.date || "") === String(deliveryNote.date);
  const mentionedDdtDate = Array.isArray(invoice?.delivery_note_mention_dates)
    && invoice.delivery_note_mention_dates.includes(String(deliveryNote.date));
  const exactQuantity = Array.isArray(invoice?.quantities)
    && invoice.quantities.filter((quantity: unknown) =>
      Number(quantity) === ddtQuantity).length === 1;
  return sameDdtDate && mentionedDdtDate && exactQuantity;
}

export function buildBillingEvidence(
  invoices: any[],
  deliveryNote: {
    ficId?: number | null;
    number: number | string;
    date: string;
    customerFicId?: number | null;
    quantity?: number | null;
    fallbackStatus?: "delivery_note_local" | "delivery_note_only";
    allowUnstructuredMatch?: boolean;
    allowedFingerprintInvoiceId?: number | null;
  },
  checkedAt: string
): BillingEvidence {
  const certain = invoices.find(invoice => matchInvoiceToDeliveryNote(invoice, deliveryNote) === "certain");
  if (certain) {
    return {
      status: "invoiced",
      invoiceId: asId(certain.id),
      invoiceNumber: [certain.number, certain.numeration].filter(Boolean).join(""),
      invoiceDate: certain.date || null,
      invoicedQuantity: null,
      checkedAt
    };
  }
  const ambiguous = invoices.find(invoice => matchInvoiceToDeliveryNote(invoice, deliveryNote) === "ambiguous");
  return {
    status: ambiguous ? "ambiguous" : (deliveryNote.fallbackStatus || "delivery_note_only"),
    invoiceId: null,
    invoiceNumber: ambiguous ? [ambiguous.number, ambiguous.numeration].filter(Boolean).join("") : null,
    invoiceDate: ambiguous?.date || null,
    invoicedQuantity: null,
    checkedAt,
    reason: ambiguous ? "Fattura compatibile, ma FIC non espone un collegamento documentale certo" : undefined
  };
}