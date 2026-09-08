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
  };
}

export function matchInvoiceToDeliveryNote(invoice: any, deliveryNote: {
  ficId: number;
  number: number | string;
  date: string;
  customerFicId?: number | null;
}): "certain" | "ambiguous" | "none" {
  if (referencedDeliveryNoteIds(invoice).includes(deliveryNote.ficId)) return "certain";

  const originalNumber = normalizedNumber(invoice?.ei_data?.od_number);
  const originalDate = String(invoice?.ei_data?.od_date ?? "");
  const sameCustomer = !deliveryNote.customerFicId
    || asId(invoice?.entity?.id) === deliveryNote.customerFicId;
  if (
    originalNumber &&
    originalNumber === normalizedNumber(deliveryNote.number) &&
    originalDate === String(deliveryNote.date) &&
    sameCustomer
  ) return "ambiguous";

  return "none";
}

export function buildBillingEvidence(
  invoices: any[],
  deliveryNote: {
    ficId: number;
    number: number | string;
    date: string;
    customerFicId?: number | null;
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
    status: ambiguous ? "ambiguous" : "delivery_note_only",
    invoiceId: null,
    invoiceNumber: ambiguous ? [ambiguous.number, ambiguous.numeration].filter(Boolean).join("") : null,
    invoiceDate: ambiguous?.date || null,
    invoicedQuantity: null,
    checkedAt,
    reason: ambiguous ? "Fattura compatibile, ma FIC non espone un collegamento documentale certo" : undefined
  };
}