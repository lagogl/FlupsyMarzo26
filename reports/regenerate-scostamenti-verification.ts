/**
 * Offline audit: replay the archived 2026-09-28 inputs, without loading live data.
 * Run: TZ=Europe/Rome npx tsx reports/regenerate-scostamenti-verification.ts
 */
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import XLSX from "xlsx";
import {
  findProjectedSize, findRangeForSize, stepOneDay, type GrowthSimulationContext,
} from "../server/services/growth-simulation.service";
import {
  formatProjectionBusinessDate, getHatcheryArrivalDate, getProjectionSimulationDays,
  getSimulatedHatcheryQuantity, simulateBasketLedgerForMonth,
} from "../server/modules/planning/growth-projection/growth-projection-simulation";
import { pool } from "../server/db";

const source = "reports/Validazione_Scostamenti_T3_Ott2026_Set2027.xlsx";
const output = "reports/Validazione_Scostamenti_T3_Ott2026_Set2027_NuovaLogica.xlsx";
const archive = XLSX.readFile(source);
const rows = (name: string): any[][] => XLSX.utils.sheet_to_json(archive.Sheets[name], { header: 1, defval: null });
const basketInputs = rows("Ceste iniziali");
const arrivalInputs = rows("Arrivi schiuditoio");
const monthlyInputs = rows("Mesi e controlli").slice(1);
const sgrInputs = rows("SGR archivio");
const mortalityInputs = rows("Mortalita archivio");
const ranges = rows("Range taglie").slice(1).map(r => ({
  sizeId: Number(r[0]), code: String(r[1]), minAnimalsPerKg: Number(r[2]),
  maxAnimalsPerKg: Number(r[3]), validFrom: String(r[4]),
  validTo: r[5] === "aperto" || r[5] === null ? null : String(r[5]),
}));
const italianMonths = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const snapshot = new Date("2026-09-28T10:04:03.663Z");
const allSizes = [...new Map(ranges.map(r => [r.sizeId, { id: r.sizeId, code: r.code }])).values()];
const context: GrowthSimulationContext = {
  allSizes, sizeRangeVersions: ranges, sgrByMonthAndSize: {}, sgrFallbackByMonth: {},
  globalFallback: NaN, mortalityByMonthAndSize: {},
  findSizeIdForWeight: (weight, date) => findProjectedSize(weight, date, ranges)?.sizeId ?? null,
};
const sgrRefs = new Map<string, number>();
const fallbackRefs = new Map<string, number>();
let globalRef = 0, mortalityFallbackRef = 0;
const mortalityRefs = new Map<string, number>();
for (let i = 1; i < sgrInputs.length; i++) {
  const [month, sizeId, rate, kind] = sgrInputs[i];
  if (kind === "taglia" && italianMonths.includes(month)) {
    context.sgrByMonthAndSize[`${month}|${sizeId}`] = rate;
    sgrRefs.set(`${month}|${sizeId}`, i + 1);
  } else if (kind === "fallback mese") {
    context.sgrFallbackByMonth[month] = rate;
    fallbackRefs.set(month, i + 1);
  } else if (kind === "fallback globale") {
    context.globalFallback = rate;
    globalRef = i + 1;
  }
}
assert.ok(Number.isFinite(context.globalFallback));
for (let i = 1; i < mortalityInputs.length; i++) {
  const [month, code, rate, kind] = mortalityInputs[i];
  if (kind === "taglia") {
    context.mortalityByMonthAndSize[`${month}|${code}`] = rate;
    mortalityRefs.set(`${month}|${code}`, i + 1);
  } else {
    assert.equal(rate, 0.03);
    mortalityFallbackRef = i + 1;
  }
}
assert.ok(mortalityFallbackRef > 0);
const target = allSizes.find(s => s.code === "TP-3000")!;
const hatchery = allSizes.find(s => s.code === "TP-300")!;
assert.ok(target && hatchery);

type Basket = {
  basketId: number; weightMg: number; animalCount: number; isHatchery: boolean;
  growthStartsAfter?: Date; entryDate: string; inputRow: number; previousDetailRow?: number;
};
type Monthly = {
  key: string; year: number; month: number; dates: Date[]; arrival: number;
  inventory: number; total: number; deaths: number; orders: number; carryIn: number;
  fulfilled: number; carryOut: number; threshold: number; manualChecks: number;
};
const initialBaskets = (): Basket[] => basketInputs.slice(1).map((r, i) => ({
  basketId: Number(r[0]), weightMg: Number(r[4]), animalCount: Number(r[3]),
  isHatchery: false, entryDate: String(r[6]), inputRow: i + 2,
}));

const workbook = new ExcelJS.Workbook();
workbook.creator = "Verifica offline Scostamenti";
workbook.created = new Date();
workbook.calcProperties.fullCalcOnLoad = true;
function sheet(name: string, header: string[], data: any[][] = []) {
  const s = workbook.addWorksheet(name);
  s.addRow(header); s.addRows(data);
  s.views = [{ state: "frozen", ySplit: 1, xSplit: 1 }];
  s.getRow(1).height = 36;
  s.getRow(1).eachCell(c => {
    c.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF17365D" } };
    c.alignment = { vertical: "middle", wrapText: true };
  });
  s.columns.forEach((c, i) => { c.width = i === 0 ? 19 : 18; c.numFmt = "#,##0;[Red]-#,##0"; });
  s.pageSetup = { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  s.pageSetup.printTitlesRow = "1:1";
  return s;
}
const formula = (formula: string, result: number): ExcelJS.CellFormulaValue => {
  assert.ok(Number.isFinite(result), `Nonfinite formula result: ${formula}`);
  return { formula, result };
};
const guide = sheet("Guida e metodo", ["Sezione", "Contenuto"]);
guide.getColumn(2).width = 125;
const summary = sheet("Riepilogo 12 mesi", ["Indicatore", ...monthlyInputs.slice(1).map(r => `${italianMonths[Number(r[2]) - 1]} ${r[1]}`)]);
summary.getColumn(1).width = 43;
const monthly = sheet("Mesi e controlli", [
  "Mese", "Anno", "N. mese", "Giorni inventario", "T3 inv. Excel", "T3 inv. motore",
  "Scarto inventario", "T3 con sch. Excel", "T3 con sch. motore", "Scarto con sch.",
  "T3 da schiuditoio", "Arrivi immessi", "Ordini target", "Arretrati ingresso",
  "Ordini evasi", "Soglia TP-3000 APK", "Perdite mortalità", "Prelievo Excel",
  "Scarto ordini", "Arretrati uscita", "Scarto conservazione", "Controllo stati",
]);
const comparison = sheet("Confronto vecchio-nuovo", [
  "Mese", "T3 inv. precedente", "T3 inv. nuovo", "Delta inventario",
  "T3 con sch. precedente", "T3 con sch. nuovo", "Delta con sch.",
  "Arrivi precedenti", "Arrivi nuovi", "Delta arrivi", "Evasi precedenti",
  "Evasi nuovi", "Arretrati uscita precedenti", "Arretrati uscita nuovi",
]);
const arrivalSheet = sheet("Arrivi schiuditoio", [
  "Mese", "Previsione", "Reale manuale archiviato", "Reale lotti archiviato",
  "Reale usato nel residuo", "Relazione fotografia", "Nuovo arrivo immesso",
  "Data convenzionale", "TP-300 APK max", "Peso iniziale mg",
  "Vecchio arrivo immesso", "Primo giorno crescita",
]);
const detail = sheet("Dettaglio ceste", [
  "Mese", "ID cesta / batch", "Origine", "Animali inizio", "Peso inizio mg",
  "Data ingresso / fonte", "Giorni crescita mese", "Peso finale mg", "APK finale",
  "Animali prima ordini", "Soglia TP-3000 APK", "T3 lordo prima ordini",
  "Prelievo ordine", "Animali dopo ordini", "Scarto stato vs motore",
]);
const daily = sheet("Passi giornalieri", [
  "Data", "Mese", "ID cesta / batch", "Origine", "Peso iniziale mg", "Animali iniziali",
  "Taglia prima crescita", "SGR giornaliero", "Peso finale mg", "Taglia dopo crescita",
  "Mortalità mensile", "Giorni calendario mese", "Mortalità giornaliera",
  "Animali finali arrotondati", "APK finale", "Soglia TP-3000 APK",
  "A taglia target (1/0)", "T3 lordo", "Perdite giornaliere",
]);
for (const name of ["Ceste iniziali", "Range taglie", "SGR archivio", "Mortalita archivio"]) {
  const data = rows(name); sheet(name, data[0], data.slice(1));
}
for (const [s, cols] of [[daily, [8, 11, 13]], [workbook.getWorksheet("SGR archivio")!, [3]], [workbook.getWorksheet("Mortalita archivio")!, [3]]] as const) {
  for (const column of cols) s.getColumn(column).numFmt = "0.0000%";
}
for (const [s, cols] of [[daily, [5, 9]], [detail, [5, 8]], [arrivalSheet, [10]], [workbook.getWorksheet("Ceste iniziali")!, [5]]] as const) {
  for (const column of cols) s.getColumn(column).numFmt = "0.0000000000";
}

function allocation(baskets: Basket[], threshold: number, demand: number) {
  let left = demand;
  const taken = new Map<number, number>();
  const eligible = baskets.filter(b => 1_000_000 / b.weightMg <= threshold && b.animalCount > 0)
    .sort((a, b) => (1_000_000 / a.weightMg) - (1_000_000 / b.weightMg));
  for (const b of eligible) {
    if (left <= 0) break;
    const take = Math.min(b.animalCount, left);
    taken.set(b.basketId, take); b.animalCount -= take; left -= take;
  }
  return { taken, remaining: left, fulfilled: demand - left };
}
function run(corrected: boolean): Monthly[] {
  let baskets = initialBaskets(), carry = 0;
  const results: Monthly[] = [];
  for (let mi = 0; mi < monthlyInputs.length; mi++) {
    const input = monthlyInputs[mi], arrivalInput = arrivalInputs[mi + 1];
    const key = String(input[0]), year = Number(input[1]), month = Number(input[2]);
    const projectionMonth = { year, month };
    const dates = getProjectionSimulationDays(projectionMonth, snapshot);
    const threshold = findRangeForSize(target.id, new Date(year, month - 1, 1), ranges)!.maxAnimalsPerKg;
    const actual = Number(arrivalInput[3] ?? arrivalInput[2] ?? 0);
    const arrival = corrected
      ? getSimulatedHatcheryQuantity(projectionMonth, snapshot, Number(arrivalInput[1]), actual)
      : Number(arrivalInput[5]);
    const arrivalDate = getHatcheryArrivalDate(projectionMonth);
    const hatcheryApk = findRangeForSize(hatchery.id, arrivalDate, ranges)!.maxAnimalsPerKg;
    if (corrected) {
      const relation = year * 12 + month - (snapshot.getFullYear() * 12 + snapshot.getMonth() + 1);
      const expected = relation < 0 ? 0 : relation > 0 ? Number(arrivalInput[1]) : Math.max(0, Number(arrivalInput[1]) - actual);
      assert.equal(arrival, expected);
      arrivalSheet.addRow([
        key, arrivalInput[1], arrivalInput[2], arrivalInput[3], actual,
        relation < 0 ? "passato" : relation > 0 ? "futuro" : "corrente",
        formula(relation < 0 ? "0" : relation > 0 ? `B${mi + 2}` : `MAX(0,B${mi + 2}-E${mi + 2})`, arrival),
        formatProjectionBusinessDate(arrivalDate), hatcheryApk,
        formula(`1000000/I${mi + 2}`, 1_000_000 / hatcheryApk),
        arrivalInput[5], formatProjectionBusinessDate(new Date(year, month - 1, Math.max(16, mi === 0 ? snapshot.getDate() + 1 : 16))),
      ]);
    }
    if (arrival > 0) baskets.push({
      basketId: -1000 - mi, weightMg: 1_000_000 / hatcheryApk, animalCount: arrival,
      isHatchery: true, entryDate: formatProjectionBusinessDate(arrivalDate), inputRow: mi + 2,
      ...(corrected ? { growthStartsAfter: arrivalDate } : {}),
    });
    const totalBefore = baskets.reduce((sum, b) => sum + b.animalCount, 0);
    const calculated = simulateBasketLedgerForMonth(baskets, dates, (state, date) => stepOneDay(context, state, date));
    const detailStart = detail.rowCount + 1;
    let manualChecks = 0;
    const pendingDetail = new Map<number, { row: number; values: any[]; lastDaily: number | null; endCount: number }>();
    if (corrected) {
      for (let bi = 0; bi < baskets.length; bi++) {
        const b = baskets[bi], startCount = b.animalCount, startWeight = b.weightMg;
        const eligibleDates = dates.filter(d => !b.growthStartsAfter || d > b.growthStartsAfter);
        let count = startCount, weight = startWeight, previousDaily: number | null = null;
        const firstWeightRef = b.previousDetailRow
          ? `'Dettaglio ceste'!H${b.previousDetailRow}`
          : b.isHatchery ? `'Arrivi schiuditoio'!J${b.inputRow}` : `'Ceste iniziali'!E${b.inputRow}`;
        const firstCountRef = b.previousDetailRow
          ? `'Dettaglio ceste'!N${b.previousDetailRow}`
          : b.isHatchery ? `'Arrivi schiuditoio'!G${b.inputRow}` : `'Ceste iniziali'!D${b.inputRow}`;
        for (const date of eligibleDates) {
          const drow = daily.rowCount + 1;
          const sizeBefore = findProjectedSize(weight, date, ranges);
          const sgrKey = `${italianMonths[date.getMonth()]}|${sizeBefore?.sizeId}`;
          const sgrRow = sgrRefs.get(sgrKey) ?? fallbackRefs.get(italianMonths[date.getMonth()]) ?? globalRef;
          const sgr = Number(sgrInputs[sgrRow - 1][2]);
          const weightAfter = weight * (1 + sgr);
          const sizeAfter = findProjectedSize(weightAfter, date, ranges);
          const mortalityRow = mortalityRefs.get(`${month}|${sizeAfter?.code}`) ?? mortalityFallbackRef;
          const mortality = Number(mortalityInputs[mortalityRow - 1][2]);
          const daysInMonth = new Date(year, month, 0).getDate();
          const countAfter = Math.round(count * (1 - mortality / daysInMonth));
          const apk = 1_000_000 / weightAfter, atTarget = apk <= threshold ? 1 : 0;
          daily.addRow([
            formatProjectionBusinessDate(date), key, b.basketId, b.isHatchery ? "schiuditoio" : "inventario",
            formula(previousDaily ? `I${previousDaily}` : firstWeightRef, weight),
            formula(previousDaily ? `N${previousDaily}` : firstCountRef, count),
            sizeBefore?.code ?? "senza range", formula(`'SGR archivio'!C${sgrRow}`, sgr),
            formula(`E${drow}*(1+H${drow})`, weightAfter),
            sizeAfter?.code ?? "senza range", formula(`'Mortalita archivio'!C${mortalityRow}`, mortality),
            daysInMonth, formula(`K${drow}/L${drow}`, mortality / daysInMonth),
            formula(`ROUND(F${drow}*(1-M${drow}),0)`, countAfter),
            formula(`1000000/I${drow}`, apk), threshold,
            formula(`IF(O${drow}<=P${drow},1,0)`, atTarget),
            formula(`N${drow}*Q${drow}`, countAfter * atTarget),
            formula(`F${drow}-N${drow}`, count - countAfter),
          ]);
          weight = weightAfter; count = countAfter; previousDaily = drow;
        }
        assert.equal(count, calculated[bi].animalCount, `Count mismatch ${key}/${b.basketId}`);
        assert.equal(weight, calculated[bi].weightMg, `Weight mismatch ${key}/${b.basketId}`);
        manualChecks++;
        const row = detailStart + bi;
        pendingDetail.set(b.basketId, {
          row, lastDaily: previousDaily, endCount: count,
          values: [
            key, b.basketId, b.isHatchery ? "schiuditoio" : "inventario",
            formula(firstCountRef, startCount), formula(firstWeightRef, startWeight),
            b.entryDate, eligibleDates.length,
            formula(previousDaily ? `'Passi giornalieri'!I${previousDaily}` : `E${row}`, weight),
            formula(`1000000/H${row}`, 1_000_000 / weight),
            formula(previousDaily ? `'Passi giornalieri'!N${previousDaily}` : `D${row}`, count),
            threshold, formula(`IF(I${row}<=K${row},J${row},0)`, 1_000_000 / weight <= threshold ? count : 0),
          ],
        });
      }
    }
    baskets = calculated;
    const inventory = baskets.filter(b => !b.isHatchery && 1_000_000 / b.weightMg <= threshold).reduce((s, b) => s + b.animalCount, 0);
    const total = baskets.filter(b => 1_000_000 / b.weightMg <= threshold).reduce((s, b) => s + b.animalCount, 0);
    const deaths = totalBefore - baskets.reduce((s, b) => s + b.animalCount, 0);
    const orders = Number(input[12]), carryIn = carry;
    const allocated = allocation(baskets, threshold, orders + carryIn);
    carry = allocated.remaining;
    if (corrected) for (const b of baskets) {
      const audit = pendingDetail.get(b.basketId)!;
      const take = allocated.taken.get(b.basketId) ?? 0;
      detail.addRow([...audit.values, take,
        formula(`J${audit.row}-M${audit.row}`, b.animalCount),
        formula(`J${audit.row}-M${audit.row}-${b.animalCount}`, 0)]);
      b.previousDetailRow = audit.row;
      assert.equal(audit.endCount - take, b.animalCount);
    }
    results.push({ key, year, month, dates, arrival, inventory, total, deaths, orders, carryIn,
      fulfilled: allocated.fulfilled, carryOut: carry, threshold, manualChecks });
    if (!corrected) {
      assert.equal(inventory, Number(input[5]), `Archived inventory mismatch ${key}`);
      assert.equal(total, Number(input[8]), `Archived total mismatch ${key}`);
      assert.equal(deaths, Number(input[16]), `Archived mortality mismatch ${key}`);
      assert.equal(allocated.fulfilled, Number(input[14]), `Archived orders mismatch ${key}`);
    }
  }
  return results;
}

async function main() {
  const old = run(false);
  const updated = run(true);
  const endDetail = detail.rowCount, endDaily = daily.rowCount;
  for (let mi = 0; mi < updated.length; mi++) {
    const m = updated[mi], o = old[mi], row = mi + 2;
    monthly.addRow([
      m.key, m.year, m.month, m.dates.length,
      formula(`SUMIFS('Dettaglio ceste'!L$2:L$${endDetail},'Dettaglio ceste'!A$2:A$${endDetail},A${row},'Dettaglio ceste'!C$2:C$${endDetail},"inventario")`, m.inventory),
      m.inventory, formula(`E${row}-F${row}`, 0),
      formula(`SUMIF('Dettaglio ceste'!A$2:A$${endDetail},A${row},'Dettaglio ceste'!L$2:L$${endDetail})`, m.total),
      m.total, formula(`H${row}-I${row}`, 0), formula(`H${row}-E${row}`, m.total - m.inventory),
      formula(`'Arrivi schiuditoio'!G${row}`, m.arrival), m.orders, m.carryIn, m.fulfilled, m.threshold,
      formula(`SUMIF('Passi giornalieri'!B$2:B$${endDaily},A${row},'Passi giornalieri'!S$2:S$${endDaily})`, m.deaths),
      formula(`SUMIF('Dettaglio ceste'!A$2:A$${endDetail},A${row},'Dettaglio ceste'!M$2:M$${endDetail})`, m.fulfilled),
      formula(`R${row}-O${row}`, 0), m.carryOut, formula(`M${row}+N${row}-O${row}-T${row}`, 0),
      formula(`SUMIF('Dettaglio ceste'!A$2:A$${endDetail},A${row},'Dettaglio ceste'!O$2:O$${endDetail})`, 0),
    ]);
    comparison.addRow([
      m.key, o.inventory, m.inventory, formula(`C${row}-B${row}`, m.inventory - o.inventory),
      o.total, m.total, formula(`F${row}-E${row}`, m.total - o.total),
      o.arrival, m.arrival, formula(`I${row}-H${row}`, m.arrival - o.arrival),
      o.fulfilled, m.fulfilled, o.carryOut, m.carryOut,
    ]);
  }
  const summaryDefinitions: Array<[string, (m: Monthly, old: Monthly, row: number) => any]> = [
    ["T3 lordo inventario · nuova logica", (m, _, r) => formula(`'Mesi e controlli'!E${r}`, m.inventory)],
    ["T3 lordo inventario · precedente", (_, o, r) => formula(`'Confronto vecchio-nuovo'!B${r}`, o.inventory)],
    ["Differenza inventario", (m, o, r) => formula(`'Confronto vecchio-nuovo'!D${r}`, m.inventory - o.inventory)],
    ["T3 lordo con schiuditoio · nuova logica", (m, _, r) => formula(`'Mesi e controlli'!H${r}`, m.total)],
    ["T3 lordo con schiuditoio · precedente", (_, o, r) => formula(`'Confronto vecchio-nuovo'!E${r}`, o.total)],
    ["Differenza con schiuditoio", (m, o, r) => formula(`'Confronto vecchio-nuovo'!G${r}`, m.total - o.total)],
    ["Arrivi immessi · nuova logica", (m, _, r) => formula(`'Mesi e controlli'!L${r}`, m.arrival)],
    ["Arrivi immessi · precedente", (_, o, r) => formula(`'Confronto vecchio-nuovo'!H${r}`, o.arrival)],
    ["T3 lordo da schiuditoio · nuova logica", (m, _, r) => formula(`'Mesi e controlli'!K${r}`, m.total - m.inventory)],
    ["Perdite mortalità · nuova logica", (m, _, r) => formula(`'Mesi e controlli'!Q${r}`, m.deaths)],
    ["Ordini evasi · nuova logica", (m, _, r) => formula(`'Mesi e controlli'!O${r}`, m.fulfilled)],
    ["Arretrati uscita · nuova logica", (m, _, r) => formula(`'Mesi e controlli'!T${r}`, m.carryOut)],
  ];
  for (const [label, value] of summaryDefinitions) summary.addRow([label, ...updated.slice(1).map((m, i) => value(m, old[i + 1], i + 3))]);
  guide.addRows([
    ["Obiettivo", "Rigenerazione delle prime due righe di Scostamenti: T3 lordo da inventario e T3 lordo con schiuditoio. Quantità in animali, non kg."],
    ["Orizzonte", "Ottobre 2026 – settembre 2027. Settembre 2026 è il mese di raccordo, simulato dal 29 al 30."],
    ["Fotografia preservata", "2026-09-28T10:04:03.663Z: stesse 71 ceste, stessi tassi, range e ordini del file precedente. NON è una nuova estrazione live."],
    ["Rigenerazione", new Date().toISOString()],
    ["Fonte", source],
    ["Mese corrente", "MAX(0, previsione - arrivi originari già registrati alla fotografia). Settembre: MAX(0,65.000.000-75.438.784)=0; nessuna reiniezione degli arrivi già nell'inventario."],
    ["Mesi futuri", "Intera previsione mensile; i mesi passati non reiniettano animali. La regola non riduce le quantità originarie per la mortalità successiva."],
    ["Data e taglia", "Nuovi ingressi sempre TP-300 il 15, dal massimo APK del range valido il 15. Crescita e mortalità dal 16. Se la fotografia è dopo il 15, solo giorni successivi alla fotografia, senza crescita retroattiva."],
    ["Motore su snapshot", "Le colonne 'motore' usano simulateBasketLedgerForMonth e stepOneDay dell'app con un contesto ricostruito esclusivamente dai fogli archivio. Nessuna chiamata al database o ad API esterne."],
    ["Verifica indipendente", `Ricostruzione separata dei passi giornalieri, confrontata peso per peso e conteggio per conteggio con il motore: ${updated.reduce((s, m) => s + m.manualChecks, 0)} stati mensili, tutti coincidenti.`],
    ["Verifica precedente", "La vecchia logica è riprodotta sugli stessi dati; inventario, lordo con schiuditoio, mortalità ed evasione coincidono esattamente con i valori app archiviati nei 13 mesi."],
    ["SGR", "Peso finale = peso iniziale × (1 + SGR giornaliero). SGR in frazione, selezionato sulla taglia PRIMA della crescita. Le chiavi italiane sono quelle del motore; le righe inglesi archiviate non sostituiscono le corrispondenti righe italiane."],
    ["Mortalità", "Tasso selezionato sulla taglia DOPO la crescita. Conteggio finale = ROUND(conteggio iniziale × (1 - mortalità mensile / giorni calendario del mese), 0). Default 3% mensile se manca un tasso."],
    ["Ordini e arretrati", "Giacenza lorda fotografata prima degli ordini. Domanda = ordini + arretrati; prelievo dalle ceste idonee, le più grandi prima. Il prelievo riduce la disponibilità dei mesi successivi. Nessun doppio utilizzo."],
    ["Scarti", "Mesi e controlli: colonne G, J, S, U, V a zero. Il confronto vecchio-nuovo invece contiene differenze reali dovute alla correzione, non errori di riconciliazione."],
    ["Ricalcolo Excel", "Formule di crescita, mortalità, conteggi, collegamenti tra mesi e somme hanno risultati memorizzati e sono ricalcolabili. La selezione dei tassi, la classificazione temporale e i prelievi sono congelati: modificare un input NON riesegue il motore decisionale."],
    ["Limiti", "Questo file verifica le prime due righe dello scenario ordini, non il percorso Forecast/semina né tutti i fabbisogni. Non confrontarlo con l'app odierna come se inventario e data fossero uguali."],
    ["Totali", "Le giacenze mensili non sono additive: non sommarle come produzione annua. Il riepilogo riporta i 12 mesi interi, Mesi e controlli include il raccordo."],
    ["Dati originali", "Le quattro schede archivio sono riportate inalterate. Il file precedente non è sovrascritto."],
    ["Esito", "PASS: riproduzione del precedente, residuo e calendario al 15, stati indipendenti e conservazione ordini verificati. Non è una validazione del modello biologico."],
  ]);
  guide.getColumn(1).numFmt = "@"; guide.getColumn(2).numFmt = "@";
  guide.eachRow((row, i) => { if (i > 1) { row.height = 42; row.alignment = { wrapText: true, vertical: "top" }; } });
  for (const s of workbook.worksheets) {
    s.autoFilter = { from: { row: 1, column: 1 }, to: { row: s.rowCount, column: s.columnCount } };
    if (s !== guide && s !== summary && !["Ceste iniziali", "Range taglie", "SGR archivio", "Mortalita archivio"].includes(s.name)) {
      s.getRow(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE7E6E6" } };
    }
  }
  for (const col of ["G", "J", "S", "U", "V"]) monthly.addConditionalFormatting({
    ref: `${col}2:${col}14`, rules: [{ type: "cellIs", operator: "equal", formulae: ["0"], priority: 1,
      style: { fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2F0D9" } } } }],
  });
  await workbook.xlsx.writeFile(output);
  // Reopen the actual deliverable: check cached outputs, formulas and archived input fidelity.
  const reopened = XLSX.readFile(output, { cellFormula: true });
  assert.equal(reopened.SheetNames.length, workbook.worksheets.length);
  for (const name of ["Ceste iniziali", "Range taglie", "SGR archivio", "Mortalita archivio"]) {
    assert.deepEqual(XLSX.utils.sheet_to_json(reopened.Sheets[name], { header: 1, defval: null }), rows(name));
  }
  for (let i = 0; i < updated.length; i++) for (const col of ["G", "J", "S", "U", "V"]) {
    const cell = reopened.Sheets["Mesi e controlli"][`${col}${i + 2}`];
    assert.equal(cell.v, 0); assert.ok(cell.f);
  }
  let formulaCount = 0;
  for (const name of reopened.SheetNames) for (const [address, cell] of Object.entries(reopened.Sheets[name])) {
    if (address.startsWith("!")) continue;
    const c = cell as XLSX.CellObject;
    assert.notEqual(c.t, "e", `Excel error ${name}!${address}`);
    if (c.f) { formulaCount++; assert.ok(Number.isFinite(c.v), `Missing formula result ${name}!${address}`); }
  }
  console.log(JSON.stringify({ output, sheets: workbook.worksheets.length, initialBaskets: basketInputs.length - 1,
    dailyRows: daily.rowCount - 1, monthlyStates: detail.rowCount - 1, formulaCount,
    snapshot: snapshot.toISOString(), months: updated.map((m, i) => ({
      month: m.key, oldInventory: old[i].inventory, newInventory: m.inventory,
      oldTotal: old[i].total, newTotal: m.total, oldArrival: old[i].arrival, newArrival: m.arrival,
    })), checks: "PASS" }, null, 2));
}
main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => pool.end());