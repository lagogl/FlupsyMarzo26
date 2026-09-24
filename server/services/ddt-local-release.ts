export interface LocalDdtReleaseCandidate {
  saleId: number;
  saleStatus: string;
  saleDdtId: number | null;
  saleDdtStatus: string;
  documentId: number | null;
  documentStatus: string | null;
  ficId: number | null;
  ficNumber: string | null;
  fcloudId: string | null;
  fcloudNumber: string | null;
  fcloudStatus: string | null;
  otherSaleIds: number[];
  detailSaleIds: Array<number | null>;
}

export function getLocalDdtReleaseBlockReason(
  candidate: LocalDdtReleaseCandidate
): string | null {
  if (candidate.saleStatus !== "confirmed") {
    return "È possibile rilasciare il DDT solo per una vendita confermata";
  }
  if (
    candidate.saleDdtId == null
    || candidate.documentId == null
    || candidate.saleDdtId !== candidate.documentId
    || candidate.saleDdtStatus !== "locale"
  ) {
    return "La vendita non ha una prenotazione DDT locale rilasciabile";
  }
  if (candidate.documentStatus !== "locale") {
    return "DDT già in invio o con stato non verificabile";
  }
  if (
    candidate.ficId != null
    || candidate.ficNumber != null
    || candidate.fcloudId != null
    || candidate.fcloudNumber != null
    || candidate.fcloudStatus != null
  ) {
    return "Il DDT presenta dati FIC/FCloud o un esito esterno: non è possibile rilasciarlo";
  }
  if (candidate.otherSaleIds.length > 0) {
    return "Il DDT è collegato anche a un'altra vendita e non può essere rilasciato";
  }
  if (
    candidate.detailSaleIds.length === 0
    || candidate.detailSaleIds.some(saleId => saleId !== candidate.saleId)
  ) {
    return "Le righe DDT non appartengono esclusivamente a questa vendita";
  }
  return null;
}