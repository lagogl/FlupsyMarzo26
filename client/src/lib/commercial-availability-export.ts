import type { CommercialResult, FrozenCommercialSummary } from "@shared/commercial-availability";
import { animals, dateLabel } from "@/lib/commercial-availability-format";

const disclaimer = "Previsione condizionata alle ipotesi, non una garanzia produttiva. Simulazioni senza impegni operativi.";
export function frozenSizeLabel(result: CommercialResult, id: number) {
  // Older saved summaries can lack a catalogue snapshot. Never reconstruct
  // historical labels from today's catalogue: identify the original ID instead.
  return result.sizes?.find(size => size.id === id)?.code ?? `Taglia ID ${id} (catalogo storico non disponibile)`;
}
export function summaryLines(summary: FrozenCommercialSummary) {
  const r = summary.snapshot;
  return [
    `Riepilogo commerciale #${summary.id}: ${summary.name}`,
    `Congelato: ${dateLabel(String(summary.createdAt))}`,
    `Data dati: ${dateLabel(r.referenceDate)}. Calcolo: ${new Date(r.generatedAt).toLocaleString("it-IT", { timeZone: "Europe/Rome" })}.`,
    `Ordini: ${r.input.includeOrders ? "inclusi, con vincoli futuri" : "Scenario senza vincolo ordini"}.`,
    `Arrivi futuri schiuditoio: ${r.input.includeHatchery ? "inclusi, previsionali" : "esclusi"}.`,
    `Crescita: ${r.input.growthFactor}. Mortalità: ${r.input.mortalityMultiplier}. Orizzonte: ${r.input.horizon} mesi.`,
    `Scoperto ordini preesistente: ${animals(r.baselineOrderShortfall)}. Dopo il piano: ${animals(r.orderShortfall)}.`,
    `Piano congiuntamente validato: ${r.valid ? "sì" : "no"}.`,
    ...r.plan.map(s => `${dateLabel(s.date)} | ${frozenSizeLabel(r, s.sizeId)} | richiesti ${animals(s.quantity)} | accettati ${animals(s.acceptedQuantity)} | mancanti ${animals(s.shortfall)}`),
    `Totale piano richiesto: ${animals(r.totalRequested)}. Accettato: ${animals(r.totalAccepted)}.`,
    "Le capacità alternative non sono sommate e non costituiscono il piano.",
    ...r.input.hatcheryOverrides.map(m => `Arrivo residuo di scenario ${m.month}/${m.year}: ${animals(m.quantity)} animali.`),
    ...r.warnings.map(w => `Avviso: ${w}`),
    disclaimer,
  ];
}
export function assertExportableSummary(summary: FrozenCommercialSummary) {
  if (!summary.snapshot.valid || summary.snapshot.plan.some(row => row.shortfall > 0)) {
    throw new Error("Il riepilogo non contiene un piano congiuntamente valido. Esportazione bloccata.");
  }
}
function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob), anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function exportCommercialPdf(summary: FrozenCommercialSummary) {
  assertExportableSummary(summary);
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([595, 842]), y = 788;
  for (const [index, text] of summaryLines(summary).entries()) {
    // Standard PDF fonts use WinAnsi. Replace unsupported characters, never quantities.
    const safe = text.replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "-");
    const words = safe.split(" "); let line = "";
    const draw = (value: string) => {
      if (y < 58) { page = doc.addPage([595, 842]); y = 788; }
      page.drawText(value, { x: 42, y, size: index === 0 ? 14 : 10, font: index === 0 ? bold : font, color: rgb(.12, .25, .28) }); y -= index === 0 ? 23 : 17;
    };
    for (const word of words) { const next = line ? `${line} ${word}` : word; if (font.widthOfTextAtSize(next, index === 0 ? 14 : 10) > 510 && line) { draw(line); line = word; } else line = next; }
    if (line) draw(line); y -= 6;
  }
  const bytes = await doc.save();
  download(new Blob([new Uint8Array(bytes).buffer], { type: "application/pdf" }), `riepilogo-commerciale-${summary.id}.pdf`);
}
export async function exportCommercialExcel(summary: FrozenCommercialSummary) {
  assertExportableSummary(summary);
  const XLSX = await import("xlsx");
  const r = summary.snapshot, workbook = XLSX.utils.book_new();
  const rows = r.plan.map(s => ({ Data: s.date, Taglia: frozenSizeLabel(r, s.sizeId), "Animali richiesti": s.quantity, "Animali accettati": s.acceptedQuantity, "Animali mancanti": s.shortfall }));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows.length ? rows : [{ Nota: "Nessuna vendita simulata" }]), "Piano validato");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryLines(summary).map(line => [line])), "Ipotesi e avvisi");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Mese", "Taglia", "Capacità alternativa NON sommabile", "Giorno raggiungimento"], ...r.months.flatMap(m => Object.entries(m.availableBySize).map(([id, quantity]) => [`${m.year}-${String(m.month).padStart(2, "0")}`, frozenSizeLabel(r, Number(id)), quantity, m.availabilityDayBySize?.[id] ?? "Non disponibile"]))]), "Alternative non sommabili");
  XLSX.writeFile(workbook, `riepilogo-commerciale-${summary.id}.xlsx`);
}