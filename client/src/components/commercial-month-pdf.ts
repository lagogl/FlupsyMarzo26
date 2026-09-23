import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import type { ScenarioInput, ScenarioMonth } from "@shared/sales-scenarios";
import {
  availabilityDayForSize, availabilityForSize, eligibleAtStartForSize,
  estimatedSalesValue, orderCommitmentForMonth, priceForSize,
  stockBeforeOrdersForSize, type CommercialSize,
} from "./commercial-availability-utils";

const months = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const number = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 });
const currency = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const ink = rgb(0.07, 0.23, 0.27);
const muted = rgb(0.35, 0.42, 0.44);
const teal = rgb(0.05, 0.36, 0.34);
const paper = rgb(0.96, 0.98, 0.97);

export function monthlyCommercialData(
  month: ScenarioMonth, sizes: CommercialSize[], draft: Pick<ScenarioInput, "proposalPrices">,
) {
  const commitment = orderCommitmentForMonth(month);
  return {
    orders: {
      requested: month.ordersRequested,
      fulfilled: month.ordersFulfilled,
      shortfall: month.orderShortfall,
      value: commitment?.valueEuro ?? null,
      partialValue: (commitment?.missingValueAnimals ?? 0) > 0,
    },
    plannedSales: { requested: month.salesRequested, applied: month.salesApplied },
    alternatives: sizes.map(size => {
      const exact = stockBeforeOrdersForSize(month, size);
      const eligible = eligibleAtStartForSize(month, size);
      const sellable = availabilityForSize(month, size);
      return {
        code: size.code,
        exact,
        larger: exact === null || eligible === null ? null : Math.max(0, eligible - exact),
        eligible,
        sellable,
        day: availabilityDayForSize(month, size),
        value: estimatedSalesValue(sellable, priceForSize(size, draft)),
      };
    }),
  };
}

export async function createCommercialMonthPdf(
  month: ScenarioMonth,
  sizes: CommercialSize[],
  draft: Pick<ScenarioInput, "name" | "proposalPrices">,
  mode: "prudent" | "expected",
  generatedAt: string,
  warnings: string[],
): Promise<Uint8Array> {
  const data = monthlyCommercialData(month, sizes, draft);
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const label = `${months[month.month - 1]} ${month.year}`;
  const width = 595.28;
  const height = 841.89;
  const margin = 38;
  let page!: PDFPage;
  let y = 0;

  const text = (value: string, x: number, top: number, size = 9, font: PDFFont = regular, color = ink) => {
    // Intl currency inserts a non-breaking space, not supported by standard PDF fonts.
    page.drawText(value.replace(/[\u00a0\u202f]/g, " "), { x, y: height - top - size, size, font, color });
  };
  const wrap = (value: string, font: PDFFont, size: number, maxWidth: number): string[] => {
    const lines: string[] = [];
    let current = "";
    for (const word of value.split(/\s+/)) {
      const next = current ? `${current} ${word}` : word;
      if (current && font.widthOfTextAtSize(next, size) > maxWidth) {
        lines.push(current);
        current = word;
      } else current = next;
    }
    if (current) lines.push(current);
    return lines;
  };
  const addPage = (continued = false) => {
    page = pdf.addPage([width, height]);
    page.drawRectangle({ x: 0, y: height - 8, width, height: 8, color: teal });
    text("DISPONIBILITÀ COMMERCIALE  /  SCHEDA MENSILE", margin, 28, 9, bold, teal);
    text(`${label}${continued ? " - continua" : ""}`, margin, 49, 19, bold);
    y = 80;
  };
  const paragraph = (value: string, size = 9, font: PDFFont = regular, color = ink) => {
    const lines = wrap(value, font, size, width - margin * 2);
    if (y + lines.length * (size + 4) > height - 50) addPage(true);
    for (const line of lines) {
      text(line, margin, y, size, font, color);
      y += size + 4;
    }
  };

  addPage();
  paragraph(`Scenario: ${draft.name}   |   Ipotesi: ${mode === "prudent" ? "Prudente" : "Atteso"}`, 10);
  const date = new Date(generatedAt);
  paragraph(`Ricalcolato: ${Number.isNaN(date.getTime()) ? "data non disponibile" : date.toLocaleString("it-IT")}   |   Documento di sintesi, non ordine né prenotazione.`, 8, regular, muted);
  y += 12;

  page.drawRectangle({ x: margin, y: height - y - 73, width: width - margin * 2, height: 73, color: paper });
  text("ORDINI ACQUISITI NEL MESE", margin + 10, y + 8, 9, bold, teal);
  const fields = [
    ["Richiesti", number.format(data.orders.requested)],
    ["Soddisfatti", number.format(data.orders.fulfilled)],
    ["Scoperto", number.format(data.orders.shortfall)],
    ["Valore ordini", data.orders.requested <= 0 ? "—" : data.orders.value === null ? "Non valorizzato" : `${currency.format(data.orders.value)}${data.orders.partialValue ? " *" : ""}`],
  ] as const;
  fields.forEach(([heading, value], index) => {
    const x = margin + 10 + index * 128;
    text(heading, x, y + 29, 8, regular, muted);
    text(value, x, y + 44, value.length > 15 ? 9 : 11, bold, index === 2 && data.orders.shortfall > 0 ? rgb(0.6, 0.15, 0.12) : ink);
  });
  y += 87;
  if (data.orders.partialValue) { paragraph("* Valore parziale o non disponibile: alcuni ordini non hanno un prezzo.", 8, regular, muted); y += 6; }

  paragraph(
    `Vendite già inserite nello scenario: ${number.format(data.plannedSales.requested)} richieste, ${number.format(data.plannedSales.applied)} applicate, ${number.format(Math.max(0, data.plannedSales.requested - data.plannedSales.applied))} non applicate.`,
    8, regular, muted,
  );
  y += 12;
  paragraph("STOCK E POSSIBILI NUOVE VENDITE", 10, bold, teal);
  paragraph("Per ciascuna taglia, lo stock idoneo include la taglia esatta e quelle fisicamente più grandi.", 8, regular, muted);
  y += 8;

  for (const row of data.alternatives) {
    if (y + 45 > height - 118) addPage(true);
    page.drawRectangle({ x: margin, y: height - y - 44, width: width - margin * 2, height: 44, color: paper });
    text(row.code, margin + 9, y + 5, 10, bold);
    text(row.sellable > 0 ? `Nuova vendita: ${number.format(row.sellable)} animali` : "Nessuna nuova vendita aggiuntiva", margin + 103, y + 5, 9, bold, teal);
    text(row.sellable > 0 ? row.day === null ? "Giorno da ricalcolare" : `Dal giorno ${row.day}` : "", margin + 384, y + 6, 8, regular, muted);
    text(
      `A inizio mese: taglia esatta ${row.exact === null ? "da ricalcolare" : number.format(row.exact)}  |  più grandi ${row.larger === null ? "da ricalcolare" : number.format(row.larger)}  |  idonei ${row.eligible === null ? "da ricalcolare" : number.format(row.eligible)}`,
      margin + 9, y + 21, 8,
    );
    text(`Valore stimato nuova vendita: ${row.sellable <= 0 ? "—" : row.value === null ? "non valorizzato (prezzo assente)" : currency.format(row.value)}`, margin + 9, y + 34, 8, regular, muted);
    y += 45;
  }
  y += 10;
  paragraph("COME LEGGERE I NUMERI", 9, bold, teal);
  paragraph("Lo stock è fotografato a inizio mese (oggi per il mese corrente), prima degli ordini del mese. La nuova vendita è una quantità aggiuntiva ipotetica al giorno indicato: mantiene coperti gli ordini acquisiti, anche futuri, e le vendite già inserite nello scenario.", 8);
  y += 5;
  paragraph("Le taglie sono alternative e possono condividere gli stessi animali: non sommare righe o mesi. Il valore degli ordini acquisiti non è un ricavo da nuove vendite; la stima delle nuove vendite usa il prezzo della taglia richiesta. Nessun valore determina il regime IVA.", 8);
  for (const warning of warnings) {
    y += 5;
    paragraph(`Avviso scenario: ${warning}`, 8, regular, muted);
  }
  pdf.getPages().forEach((sheet, index) => {
    sheet.drawText(`${index + 1} / ${pdf.getPageCount()}`, { x: width - margin - 28, y: 20, size: 8, font: regular, color: muted });
  });
  return pdf.save();
}