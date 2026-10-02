import type { Workbook, Worksheet } from "exceljs";
import {
  commercialInputSchema,
  type CommercialInput,
  type CommercialInputs,
  type CommercialResult,
  type SavedCommercialScenario,
} from "../../../shared/commercial-availability";

const INTEGER_FORMAT = "#,##0";
const TEAL = "FF123B47";
const WHITE = "FFFFFFFF";
const STRIPE = "FFF7FAFA";
const BORDER = "FFD9E3E4";
const DISCLAIMER = "Previsione condizionata alle ipotesi, non una garanzia produttiva.";
const ALTERNATIVE_NOTE = "Le disponibilità per taglia e mese sono alternative: non sommare celle, righe o mesi.";

/** Inputs for a draft or freshly calculated commercial workbook. */
export interface CommercialWorkbookOptions {
  input: CommercialInput;
  sizes: CommercialInputs["sizes"];
  result?: CommercialResult;
}

/** Saved scenario library input; scenarios are exported as drafts, never results. */
export interface CommercialScenarioLibraryOptions {
  scenarios: SavedCommercialScenario[];
  sizes: CommercialInputs["sizes"];
}

type Size = CommercialInputs["sizes"][number];
type MonthKey = { year: number; month: number };

function monthKey(month: MonthKey) {
  return `${month.year}-${String(month.month).padStart(2, "0")}`;
}

function monthLabel(month: MonthKey) {
  return new Intl.DateTimeFormat("it-IT", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(month.year, month.month - 1, 1)));
}

function canonicalInput(input: CommercialInput): string {
  return JSON.stringify(commercialInputSchema.parse(input));
}

function resultMatchesInput(input: CommercialInput, result?: CommercialResult): result is CommercialResult {
  if (!result) return false;
  try {
    return canonicalInput(input) === canonicalInput(result.input);
  } catch {
    return false;
  }
}

function finishSheet(sheet: Worksheet, options: { matrix?: boolean; filter?: boolean } = {}) {
  const { matrix = false, filter = true } = options;
  sheet.views = [{
    state: "frozen",
    xSplit: matrix ? 1 : 0,
    ySplit: 1,
    topLeftCell: matrix ? "B2" : "A2",
    activeCell: matrix ? "B2" : "A2",
  }];
  sheet.properties.defaultRowHeight = 22;
  sheet.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
  };
  sheet.headerFooter.oddFooter = "&CCommerciale · Pagina &P di &N";
  sheet.pageSetup.horizontalDpi = 300;
  sheet.pageSetup.verticalDpi = 300;
  sheet.pageSetup.printTitlesRow = "1:1";
  if (sheet.rowCount > 0) {
    const header = sheet.getRow(1);
    header.height = 38;
    header.font = { bold: true, color: { argb: WHITE }, size: 10 };
    header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL } };
    header.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    header.eachCell(cell => {
      cell.border = { bottom: { style: "medium", color: { argb: TEAL } } };
    });
    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
      const row = sheet.getRow(rowNumber);
      row.height = 25;
      row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: rowNumber % 2 === 0 ? WHITE : STRIPE },
        };
        cell.alignment = { vertical: "middle", wrapText: true };
        cell.border = { bottom: { style: "hair", color: { argb: BORDER } } };
        if (typeof cell.value === "number") cell.numFmt = Number.isInteger(cell.value) ? INTEGER_FORMAT : "0.00";
        if (typeof cell.value === "string") {
          const width = Math.max(10, (sheet.getColumn(columnNumber).width ?? 18) - 2);
          const lines = cell.value.split("\n").reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / width)), 0);
          row.height = Math.max(row.height ?? 25, Math.min(180, lines * 16 + 8));
        }
        if (columnNumber === 1 && typeof cell.value === "string") cell.alignment = { vertical: "middle", wrapText: true };
      });
    }
    if (filter && sheet.rowCount > 1 && sheet.columnCount > 0) {
      sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: sheet.rowCount, column: sheet.columnCount },
      };
    }
    sheet.pageSetup.printArea = `A1:${sheet.getColumn(sheet.columnCount).letter}${sheet.rowCount}`;
  }
}

function addAnalyticalSheet(workbook: Workbook, name: string, headers: string[], widths: number[]) {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = headers.map((header, index) => ({ header, width: widths[index] ?? 18 }));
  return sheet;
}

function sizeCatalog(sizes: Size[], result?: CommercialResult, input?: CommercialInput) {
  const all = new Map<number, Size>();
  for (const size of result?.sizes ?? []) all.set(size.id, size);
  for (const size of sizes) if (!all.has(size.id)) all.set(size.id, size);
  const ensure = (id: number) => {
    if (!all.has(id)) all.set(id, { id, code: `ID ${id}`, name: `Taglia ID ${id}` });
  };
  for (const id of input?.selectedSizeIds ?? []) ensure(id);
  for (const sale of input?.sales ?? []) ensure(sale.sizeId);
  return [...all.values()];
}

function sizeLabel(catalog: Map<number, Size>, id: number) {
  const size = catalog.get(id);
  return size ? `${size.code} · ${size.name}` : `Taglia ID ${id}`;
}

function setWorkbookMetadata(workbook: Workbook, title: string) {
  workbook.creator = "Pianificazione commerciale";
  workbook.subject = title;
  workbook.title = title;
  workbook.company = "Pianificazione commerciale";
}

function buildGuide(workbook: Workbook, input: CommercialInput, result?: CommercialResult, fresh = false) {
  const sheet = workbook.addWorksheet("Guida");
  sheet.columns = [{ width: 31 }, { width: 96 }];
  const status = fresh ? (result!.valid ? "PIANO VERIFICATO" : "PIANO NON VALIDO") : "BOZZA NON VERIFICATA";
  const rows: unknown[][] = [
    ["Disponibilità commerciale", input.name],
    ["Stato del calcolo", status],
    ["Nota sul risultato", fresh
      ? (result!.valid ? "Risultato aggiornato: input canonicalizzato identico alla bozza." : "Il calcolo corrisponde alla bozza ma il piano è segnalato non valido.")
      : "Sono inclusi solo gli input modificabili; nessuna disponibilità o copertura è ricavata da risultati assenti o non corrispondenti."],
    ["Avvertenza", DISCLAIMER],
    ["Disponibilità", ALTERNATIVE_NOTE],
    ["Mancanze storiche", "Le celle vuote nelle mancanze indicano dato assente/non disponibile (anche per snapshot precedenti), non quantità zero."],
    ["Morti previsti", "Numero assoluto di decessi simulati nel mese, attribuiti alla taglia fisica dopo la crescita. Già inclusi nella disponibilità: non sottrarli di nuovo. Celle vuote = dato non disponibile, non zero."],
    ["Arrivi futuri", "Il programma base non è riportato; una cella vuota non significa zero. Uno zero nell'override è un valore esplicito."],
    ["Vendite accettate", fresh ? "Quantità e date provengono dal risultato associato a questa identica bozza." : "Accettati, mancanti e date accettate restano vuoti finché la bozza non viene ricalcolata."],
    ["Ipotesi condizionali", "Crescita, mortalità, ordini e arrivi futuri sono ipotesi di scenario, non impegni operativi né garanzie."],
  ];
  if (fresh) {
    rows.push(["Data di riferimento", result!.referenceDate], ["Calcolato il", result!.generatedAt]);
    for (const warning of result!.warnings ?? []) rows.push(["Avviso", warning]);
  } else if (result) {
    rows.push(["Risultato ignorato", "Il risultato allegato non corrisponde agli input correnti oppure non è canonicalizzabile; è stato escluso."]);
  }
  for (const row of rows) sheet.addRow(row);
  finishSheet(sheet, { filter: false });
  sheet.getColumn(1).font = { bold: true, color: { argb: TEAL } };
  sheet.getCell(1, 1).font = { bold: true, color: { argb: WHITE }, size: 10 };
  return sheet;
}

function buildAvailabilityMatrix(
  workbook: Workbook,
  name: string,
  months: CommercialResult["months"],
  sizes: Size[],
  getValue: (month: CommercialResult["months"][number], id: number) => unknown,
  maximum?: number,
) {
  const sheet = addAnalyticalSheet(
    workbook,
    name,
    ["Taglia", ...months.map(monthLabel)],
    [31, ...months.map(() => 18)],
  );
  for (const size of sizes) {
    const row = sheet.addRow([`${size.code} · ${size.name}`, ...months.map(month => getValue(month, size.id))]);
    row.height = 26;
  }
  for (let column = 2; column <= months.length + 1; column += 1) {
    sheet.getColumn(column).numFmt = INTEGER_FORMAT;
    sheet.getColumn(column).alignment = { horizontal: "right", vertical: "middle" };
  }
  finishSheet(sheet, { matrix: true });
  if (name.startsWith("Mancanze") || name === "Morti previsti") {
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.eachCell((cell, columnNumber) => {
        if (columnNumber > 1 && typeof cell.value === "number" && cell.value > 0) {
          cell.font = { bold: true, color: { argb: "FF92392E" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8E9E3" } };
        }
      });
    });
  }
  if (maximum !== undefined && maximum > 0) {
    sizes.forEach((size, rowIndex) => months.forEach((month, monthIndex) => {
      const quantity = getValue(month, size.id);
      if (typeof quantity !== "number" || !Number.isFinite(quantity)) return;
      const strength = Math.max(0, Math.min(1, quantity / maximum));
      const pale = [238, 246, 246], deep = [61, 132, 137];
      const color = pale.map((start, channel) => Math.round(start + (deep[channel] - start) * strength));
      const argb = `FF${color.map(channel => channel.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
      const cell = sheet.getCell(rowIndex + 2, monthIndex + 2);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
      if (strength > 0.58) cell.font = { color: { argb: WHITE } };
    }));
  }
  return sheet;
}

function buildPlan(workbook: Workbook, input: CommercialInput, catalog: Map<number, Size>, result?: CommercialResult, fresh = false) {
  const sheet = addAnalyticalSheet(workbook, "Piano commerciale", [
    "ID vendita", "Mese richiesto", "Data richiesta", "Taglia richiesta", "Animali richiesti",
    "Animali accettati", "Animali mancanti", "Data accettata", "Esito",
  ], [24, 20, 19, 31, 21, 21, 21, 19, 25]);
  const planById = new Map((fresh ? result!.plan : []).map(row => [row.id, row]));
  for (const sale of input.sales) {
    const actual = planById.get(sale.id);
    const requestedDate = sale.day ? `${monthKey(sale)}-${String(sale.day).padStart(2, "0")}` : null;
    sheet.addRow([
      sale.id,
      monthLabel(sale),
      requestedDate,
      sizeLabel(catalog, sale.sizeId),
      sale.quantity,
      fresh && actual ? actual.acceptedQuantity : null,
      fresh && actual ? actual.shortfall : null,
      fresh && actual ? actual.date : null,
      fresh ? (actual ? (actual.shortfall > 0 ? "Parziale" : "Accettata") : "Non presente nel risultato") : "In attesa di ricalcolo",
    ]);
  }
  if (input.sales.length === 0) sheet.addRow(["Nessuna vendita inserita", null, null, null, null, null, null, null, null]);
  const totals = sheet.addRow([
    "TOTALE PIANO", null, null, null,
    input.sales.reduce((sum, sale) => sum + sale.quantity, 0),
    fresh ? result!.totalAccepted : null,
    fresh ? result!.totalRequested - result!.totalAccepted : null,
    null, fresh ? (result!.valid ? "Piano verificato" : "Piano non valido") : "Bozza non verificata",
  ]);
  for (const column of [5, 6, 7]) sheet.getColumn(column).numFmt = INTEGER_FORMAT;
  finishSheet(sheet);
  totals.font = { bold: true, color: { argb: TEAL } };
  totals.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE1EEEA" } };
  return sheet;
}

function buildAssumptions(workbook: Workbook, input: CommercialInput, result?: CommercialResult, fresh = false) {
  const sheet = addAnalyticalSheet(workbook, "Ipotesi", ["Ipotesi", "Valore", "Riferimento / significato"], [32, 28, 92]);
  const rows: unknown[][] = [
    ["Scenario", input.name, "Nome della bozza"],
    ["Orizzonte", input.horizon, "Mesi a partire dalla data iniziale"],
    ["Data iniziale", `${input.startYear}-${String(input.startMonth).padStart(2, "0")}`, "Inizio dell'orizzonte commerciale"],
    ["Includi ordini", input.includeOrders ? "Sì" : "No", "Se inclusi, gli ordini sono vincoli di scenario"],
    ["Includi schiuditoio", input.includeHatchery ? "Sì" : "No", "Arrivi previsionali condizionati alle ipotesi"],
    ["Fattore crescita", input.growthFactor, "Moltiplicatore ipotizzato"],
    ["Moltiplicatore mortalità", input.mortalityMultiplier, "Moltiplicatore ipotizzato"],
    ["Taglie selezionate", input.selectedSizeIds.join(", "), "Le vendite salvate anche per taglie nascoste restano nell'elenco vendite"],
    ["Data di riferimento", fresh ? result!.referenceDate : null, "Vuoto in assenza di un risultato corrispondente"],
    ["Esito validazione", fresh ? (result!.valid ? "PIANO VERIFICATO" : "PIANO NON VALIDO") : "BOZZA NON VERIFICATA", "La previsione non è una garanzia produttiva"],
    ["Disponibilità alternative", ALTERNATIVE_NOTE, "Nessuna somma tra taglie o mesi"],
    ["Disclaimer", DISCLAIMER, "Simulazione soggetta alle condizioni biologiche e operative"],
  ];
  rows.forEach(row => sheet.addRow(row));
  finishSheet(sheet);
  return sheet;
}

function buildOverrides(workbook: Workbook, input: CommercialInput) {
  const sheet = addAnalyticalSheet(workbook, "Arrivi futuri", [
    "Mese", "Programma base", "Override residuo scenario", "Significato",
  ], [24, 24, 31, 74]);
  if (input.hatcheryOverrides.length) {
    input.hatcheryOverrides.forEach(override => sheet.addRow([
      monthLabel(override),
      null,
      override.quantity,
      override.quantity === 0 ? "Zero esplicito nell'override; programma base non esportato." : "Sostituzione residua di scenario; programma base non esportato.",
    ]));
  } else {
    sheet.addRow(["Nessun override", null, null, "Il programma base non è mostrato né interpretato come zero."]);
  }
  sheet.getColumn(3).numFmt = INTEGER_FORMAT;
  finishSheet(sheet);
  return sheet;
}

/**
 * Builds a draft workbook, adding calculated availability only when its result
 * input canonicalizes identically to the current input.
 */
export async function buildCommercialWorkbook({ input, sizes, result }: CommercialWorkbookOptions): Promise<Workbook> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  setWorkbookMetadata(workbook, `Disponibilità commerciale · ${input.name}`);
  const canonical = commercialInputSchema.parse(input);
  const fresh = resultMatchesInput(canonical, result);
  const catalogValues = sizeCatalog(sizes, fresh ? result : undefined, canonical);
  const catalog = new Map(catalogValues.map(size => [size.id, size]));
  const visibleSizes = catalogValues.filter(size => canonical.selectedSizeIds.includes(size.id));

  buildGuide(workbook, canonical, result, fresh);
  if (fresh) {
    const max = Math.max(0, ...result.months.flatMap(month =>
      visibleSizes.map(size => month.availableBySize[String(size.id)])
        .filter((value): value is number => typeof value === "number" && Number.isFinite(value))));
    buildAvailabilityMatrix(workbook, "Disponibilità", result.months, visibleSizes,
      (month, id) => month.availableBySize[String(id)] ?? null, max);
    buildAvailabilityMatrix(workbook, "Date disponibilità", result.months, visibleSizes,
      (month, id) => {
        const day = month.availabilityDayBySize?.[String(id)];
        return day == null ? null : `${monthKey(month)}-${String(day).padStart(2, "0")}`;
      });
    for (const type of ["orders", "sales"] as const) {
      buildAvailabilityMatrix(workbook, type === "orders" ? "Mancanze ordini" : "Mancanze vendite",
        result.months, visibleSizes, (month, id) => {
          const shortfalls = month.shortfallsBySize;
          if (!shortfalls || !Object.prototype.hasOwnProperty.call(shortfalls, String(id))) return null;
          const amount = shortfalls[String(id)]?.[type];
          return typeof amount === "number" && Number.isFinite(amount) ? amount : null;
        });
    }
    buildAvailabilityMatrix(workbook, "Morti previsti", result.months, visibleSizes,
      (month, id) => month.mortalityBySize?.[String(id)] ?? null);
  }
  buildPlan(workbook, canonical, catalog, fresh ? result : undefined, fresh);
  buildAssumptions(workbook, canonical, fresh ? result : undefined, fresh);
  buildOverrides(workbook, canonical);
  return workbook;
}

function scenarioInput(scenario: SavedCommercialScenario) {
  return commercialInputSchema.safeParse(scenario.input);
}

function scenarioName(scenario: SavedCommercialScenario, parsed?: CommercialInput) {
  return parsed?.name ?? scenario.name;
}

/** Exports persisted scenarios as editable input records only, never frozen calculations. */
export async function buildCommercialScenarioLibrary({
  scenarios,
  sizes,
}: CommercialScenarioLibraryOptions): Promise<Workbook> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  setWorkbookMetadata(workbook, "Libreria scenari commerciali · soli input");
  const catalog = new Map(sizes.map(size => [size.id, size]));
  const parsed = scenarios.map(scenario => scenarioInput(scenario));

  const list = addAnalyticalSheet(workbook, "Scenari", [
    "ID scenario", "Nome salvato", "Creato il", "Aggiornato il", "Stato input", "Contenuto",
    "Mese iniziale", "Orizzonte (mesi)", "Taglie visibili",
  ], [18, 38, 24, 24, 23, 78, 22, 20, 55]);
  scenarios.forEach((scenario, index) => {
    const input = parsed[index].success ? parsed[index].data : undefined;
    list.addRow([
      scenario.id,
      scenarioName(scenario, input),
      scenario.createdAt instanceof Date ? scenario.createdAt.toISOString() : String(scenario.createdAt),
      scenario.updatedAt instanceof Date ? scenario.updatedAt.toISOString() : String(scenario.updatedAt),
      input ? "Bozza salvata" : "Input non valido",
      input
        ? "Solo input persistiti; nessun risultato, disponibilità o accettazione congelati."
        : "Input salvato non validabile; consultare i dati esportabili presenti negli altri fogli.",
      input ? monthKey({ year: input.startYear, month: input.startMonth }) : null,
      input?.horizon ?? null,
      input ? input.selectedSizeIds.map(id => catalog.get(id)?.code ?? `ID ${id}`).join(", ") : null,
    ]);
  });
  finishSheet(list);

  const sales = addAnalyticalSheet(workbook, "Vendite scenari", [
    "ID scenario", "Scenario", "ID vendita", "Mese", "Data richiesta", "ID taglia", "Taglia (catalogo live)",
    "Animali richiesti", "Nota",
  ], [18, 32, 24, 20, 19, 15, 34, 22, 40]);
  scenarios.forEach((scenario, index) => {
    const input = parsed[index].success ? parsed[index].data : undefined;
    if (!input) return;
    for (const sale of input.sales) {
      sales.addRow([
        scenario.id, scenarioName(scenario, input), sale.id, monthLabel(sale),
        sale.day ? `${monthKey(sale)}-${String(sale.day).padStart(2, "0")}` : null,
        sale.sizeId, sizeLabel(catalog, sale.sizeId), sale.quantity,
        input.selectedSizeIds.includes(sale.sizeId) ? "Taglia selezionata" : "Taglia nascosta: vendita conservata",
      ]);
    }
  });
  if (sales.rowCount === 1) sales.addRow(["Nessuna vendita nei dati validabili", null, null, null, null, null, null, null, null]);
  sales.getColumn(8).numFmt = INTEGER_FORMAT;
  finishSheet(sales);

  const arrivals = addAnalyticalSheet(workbook, "Arrivi scenari", [
    "ID scenario", "Scenario", "Mese override", "Programma base", "Override residuo", "Ordini inclusi",
    "Schiuditoio incluso", "Fattore crescita", "Moltiplicatore mortalità", "Nota",
  ], [18, 32, 22, 22, 25, 19, 21, 19, 24, 68]);
  scenarios.forEach((scenario, index) => {
    const input = parsed[index].success ? parsed[index].data : undefined;
    if (!input) {
      arrivals.addRow([scenario.id, scenario.name, null, null, null, null, null, null, null, "Input non valido; nessun valore inferito."]);
      return;
    }
    const parameters = [
      input.includeOrders ? "Sì" : "No",
      input.includeHatchery ? "Sì" : "No",
      input.growthFactor,
      input.mortalityMultiplier,
    ];
    if (input.hatcheryOverrides.length === 0) {
      arrivals.addRow([
        scenario.id, input.name, null, null, null, ...parameters,
        "Nessun override salvato; programma base non esportato e non interpretato come zero.",
      ]);
    } else {
      input.hatcheryOverrides.forEach(override => arrivals.addRow([
        scenario.id, input.name, monthLabel(override), null, override.quantity, ...parameters,
        override.quantity === 0 ? "Zero esplicito nell'override; programma base non esportato." : "Override residuo di scenario; programma base non esportato.",
      ]));
    }
  });
  arrivals.getColumn(5).numFmt = INTEGER_FORMAT;
  finishSheet(arrivals);

  const notes = workbook.addWorksheet("Nota");
  notes.columns = [{ width: 32 }, { width: 100 }];
  notes.addRows([
    ["Libreria scenari commerciali", "Esporta esclusivamente gli input persistiti."],
    ["Risultati", "Questa libreria non contiene calcoli congelati né ricalcola gli scenari."],
    ["Etichette taglia", "Le descrizioni usano il catalogo live e sono etichette dei draft, non una ricostruzione storica."],
    ["Arrivi", "Programma base non esportato; celle vuote non significano zero. Zero esplicito di override resta numerico."],
    ["Disclaimer", DISCLAIMER],
  ]);
  finishSheet(notes, { filter: false });
  return workbook;
}

function filenamePart(value: string) {
  return value.trim().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "scenario";
}

async function downloadWorkbook(workbook: Workbook, filename: string) {
  const bytes = await workbook.xlsx.writeBuffer();
  const exactBuffer = new Uint8Array(bytes).buffer;
  const blob = new Blob([exactBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Builds and downloads an editable draft/calculation workbook in the browser. */
export async function exportCommercialDraftExcel(options: CommercialWorkbookOptions): Promise<void> {
  const workbook = await buildCommercialWorkbook(options);
  await downloadWorkbook(workbook, `disponibilita-commerciale-${filenamePart(options.input.name)}.xlsx`);
}

/** Builds and downloads the persisted input-only scenario library in the browser. */
export async function exportCommercialScenarioLibraryExcel(options: CommercialScenarioLibraryOptions): Promise<void> {
  const workbook = await buildCommercialScenarioLibrary(options);
  await downloadWorkbook(workbook, "libreria-scenari-commerciali.xlsx");
}