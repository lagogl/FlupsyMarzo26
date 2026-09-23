import type { ScenarioInput, ScenarioProjection } from "@shared/sales-scenarios";
import { availabilityForSize, estimatedSalesValue, orderCommitmentForMonth, priceForSize, type CommercialSize } from "./commercial-availability-utils";

export async function createAvailabilityWorkbook(
  projection: ScenarioProjection,
  sizes: CommercialSize[],
  draft: Pick<ScenarioInput, "proposalPrices">,
  mode: "prudent" | "expected",
  generatedAt: string,
) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const notes = workbook.addWorksheet("Informazioni");
  notes.columns = [{ width: 28 }, { width: 100 }];
  notes.addRows([
    ["Disponibilità commerciale", mode === "prudent" ? "Prudente" : "Atteso"],
    ["Generato il", generatedAt],
    ["Avvertenza", "Disponibilità e relativi valori sono alternative: non sommare mesi o taglie."],
    ["Valore", "Stima di vendita, non incasso. Senza prezzo: non valorizzato."],
    ["Ordini acquisiti", "Quantità ordinate e valore totale d'ordine nel primo mese di consegna, anche per taglie non selezionate. Non indica animali già disponibili né nuovi incassi; base IVA non determinata."],
    ["Ordini senza valore", "Valore mancante o non espresso in EUR è esportato come testo «Non valorizzato», non come zero."],
    ["Prezzi", "Prezzo dello scenario, altrimenti listino catalogo; euro per 1.000 animali."],
  ]);
  const sheet = workbook.addWorksheet("Disponibilità", {
    views: [{ state: "frozen", xSplit: 1, ySplit: 1 }],
  });
  sheet.columns = [
    { header: "Mese", width: 23 },
    ...sizes.flatMap(size => [
      { header: `${size.code} · Animali`, width: 22 },
      { header: `${size.code} · Valore €`, width: 24 },
    ]),
    { header: "Ordini acquisiti · Animali", width: 30 },
    { header: "Ordini acquisiti · Valore €", width: 30 },
    { header: "Scoperto ordini (animali)", width: 28 },
  ];
  const prices = workbook.addWorksheet("Prezzi");
  prices.columns = [
    { header: "Taglia", width: 20 },
    { header: "Prezzo €/1.000 animali", width: 28 },
  ];
  sizes.forEach(size => prices.addRow([size.code, priceForSize(size, draft) ?? "Non valorizzato"]));
  prices.getColumn(2).numFmt = '#,##0.00 "€"';
  projection.months.forEach(month => {
    const label = new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" })
      .format(new Date(month.year, month.month - 1, 1));
    sheet.addRow([
      label,
      ...sizes.flatMap(size => {
        const animals = availabilityForSize(month, size);
        return [animals, estimatedSalesValue(animals, priceForSize(size, draft)) ?? "Non valorizzato"];
      }),
      orderCommitmentForMonth(month)?.animals ?? 0,
      orderCommitmentForMonth(month)?.valueEuro ?? (orderCommitmentForMonth(month) ? "Non valorizzato" : "—"),
      month.orderShortfall,
    ]);
  });
  sizes.forEach((_, index) => {
    sheet.getColumn(index * 2 + 2).numFmt = "#,##0";
    sheet.getColumn(index * 2 + 3).numFmt = '#,##0.00 "€"';
  });
  sheet.getColumn(sizes.length * 2 + 2).numFmt = "#,##0";
  sheet.getColumn(sizes.length * 2 + 3).numFmt = '#,##0.00 "€"';
  sheet.getColumn(sizes.length * 2 + 4).numFmt = "#,##0";
  for (const tab of [sheet, prices]) {
    tab.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    tab.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF123B47" } };
    tab.getRow(1).height = 28;
    tab.autoFilter = { from: { row: 1, column: 1 }, to: { row: tab.rowCount, column: tab.columnCount } };
  }
  return workbook;
}