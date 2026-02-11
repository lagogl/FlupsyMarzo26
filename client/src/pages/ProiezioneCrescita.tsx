import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, TrendingUp, CheckCircle2, Clock, Target, Plus, Trash2, Save, Percent, Download, Copy, Grid3X3, DollarSign, Edit3, ChevronDown, ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useCallback, useRef, useMemo } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SizeMonthProjection {
  month: number;
  year: number;
  monthName: string;
  monthShort: string;
  monthLabel: string;
  avgAnimalsPerKg: number;
  projectedSize: string;
  quantity: number;
  reachedTarget: boolean;
}

interface SizeGroupProjection {
  currentSize: string;
  currentAvgAnimalsPerKg: number;
  currentQuantity: number;
  basketCount: number;
  alreadyAtTarget: boolean;
  monthReached: string | null;
  months: SizeMonthProjection[];
}

interface MonthlyContext {
  month: number;
  year: number;
  monthName: string;
  monthShort: string;
  monthLabel: string;
  ordiniTarget: number;
  ordiniTotali: number;
  ordiniBySize: Record<string, number>;
  ordiniArretrati: number;
  ordiniEvasi: number;
  budgetProduzione: number;
  domandaEffettiva: number;
  arriviSchiuditoio: number;
  giacenzaLordaInventario: number;
  giacenzaLordaConSchiuditoio: number;
  giacenzaNetTarget: number;
  schiuditoioNecessario: number;
  perditeMortalita: number;
}

interface GrowthProjectionResult {
  targetSize: string;
  targetMaxAnimalsPerKg: number;
  generatedAt: string;
  year: number;
  mortalityPercent: number | null;
  totalCurrentQuantity: number;
  totalAlreadyAtTarget: number;
  totalNotYetAtTarget: number;
  groups: SizeGroupProjection[];
  monthlyContext: MonthlyContext[];
}

interface HatcheryArrival {
  id: number;
  year: number;
  month: number;
  quantity: number;
  sizeCategory: string;
  notes: string | null;
}

interface ProductionTarget {
  id: number;
  year: number;
  month: number;
  sizeCategory: string;
  targetAnimals: number;
  targetWeight: number | null;
  notes: string | null;
}

function formatNumber(n: number): string {
  return n.toLocaleString("it-IT");
}

interface SpreadsheetRow {
  label: string;
  tooltip: string;
  color: string;
  bgClass: string;
  textClass: string;
  values: (number | string)[];
  isNegative?: boolean;
  isBold?: boolean;
  isWarning?: (colIdx: number) => boolean;
  isSuccess?: (colIdx: number) => boolean;
  isExpandable?: boolean;
  isSubRow?: boolean;
  subRowSize?: string;
  groupKey?: string;
}

function ExcelTable({ data, mc, toast }: {
  data: GrowthProjectionResult;
  mc: MonthlyContext[];
  toast: any;
}) {
  const tableRef = useRef<HTMLTableElement>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [anchorCell, setAnchorCell] = useState<{row: number, col: number} | null>(null);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [selectedCol, setSelectedCol] = useState<number | null>(null);
  const [ordersExpanded, setOrdersExpanded] = useState(false);

  const cellKey = (r: number, c: number) => `${r},${c}`;
  const parseKey = (k: string) => { const [r, c] = k.split(',').map(Number); return { row: r, col: c }; };

  const selectedCell = useMemo(() => {
    if (selectedCells.size === 1) {
      return parseKey([...selectedCells][0]);
    }
    return null;
  }, [selectedCells]);

  const allOrderSizes = (() => {
    const sizeSet = new Set<string>();
    for (const m of mc) {
      if (m.ordiniBySize) {
        for (const sz of Object.keys(m.ordiniBySize)) {
          if (m.ordiniBySize[sz] > 0) sizeSet.add(sz);
        }
      }
    }
    return [...sizeSet].sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
  })();

  const rows: SpreadsheetRow[] = [
    {
      label: "Giacenza lorda (inventario)",
      tooltip: "Numero totale di animali presenti nell'inventario reale (cestelli attivi) che hanno raggiunto o superato la taglia target selezionata. Considera solo la crescita simulata dell'inventario esistente, senza includere arrivi futuri dallo schiuditoio.",
      color: "#3b82f6",
      bgClass: "",
      textClass: "text-gray-800",
      values: mc.map(m => m.giacenzaLordaInventario),
    },
    {
      label: "Giacenza lorda (con schiuditoio)",
      tooltip: "Numero totale di animali a taglia target includendo sia l'inventario reale sia il contributo degli arrivi pianificati dallo schiuditoio. Gli animali TP-300 inseriti come arrivi vengono simulati in crescita mese per mese usando SGR e mortalità, e conteggiati quando raggiungono la taglia target.",
      color: "#06b6d4",
      bgClass: "",
      textClass: "text-gray-800",
      values: mc.map(m => m.giacenzaLordaConSchiuditoio),
    },
    {
      label: "Perdite per mortalità",
      tooltip: "Numero di animali persi nel mese a causa della mortalità. Calcolato come differenza tra il totale animali a inizio mese e il totale dopo la simulazione giorno per giorno. La mortalità NON viene applicata alla giacenza già pronta (animali già a taglia target). I tassi sono configurabili nella pagina Gestione Mortalità.",
      color: "#dc2626",
      bgClass: "",
      textClass: "text-gray-600",
      values: mc.map(m => m.perditeMortalita || 0),
    },
    {
      label: `Ordini clienti (Totale)`,
      tooltip: `Somma di tutti gli ordini clienti per tutte le taglie nel mese. Clicca la freccia per espandere e vedere il dettaglio per singola taglia. Taglie presenti negli ordini: ${allOrderSizes.join(', ') || 'nessuna'}.`,
      color: "#ea580c",
      bgClass: "",
      textClass: "text-gray-800",
      values: mc.map(m => m.ordiniTotali || 0),
      isBold: true,
      isExpandable: true,
      groupKey: "ordini",
    },
    ...(ordersExpanded ? allOrderSizes.map(sz => ({
      label: `  ↳ ${sz}`,
      tooltip: `Ordini clienti specifici per taglia ${sz}. Quantità richiesta per questo mese.`,
      color: "#fb923c",
      bgClass: "bg-orange-50/50",
      textClass: "text-gray-600",
      values: mc.map(m => (m.ordiniBySize?.[sz]) || 0),
      isSubRow: true,
      subRowSize: sz,
      groupKey: "ordini",
    })) : []),
    {
      label: "Budget Produzione",
      tooltip: "Budget di vendita pianificato per il mese, espresso in numero di animali. Rappresenta l'obiettivo commerciale mensile definito nel piano di produzione annuale.",
      color: "#f59e0b",
      bgClass: "",
      textClass: "text-gray-800",
      values: mc.map(m => m.budgetProduzione),
    },
    {
      label: `Domanda effettiva`,
      tooltip: `Il maggiore tra ordini clienti e budget produzione per il mese. Questo valore guida i calcoli di evasione, giacenza residua e fabbisogno schiuditoio. Se il budget è superiore agli ordini, il sistema pianifica per il budget.`,
      color: "#7c3aed",
      bgClass: "",
      textClass: "text-gray-900",
      values: mc.map(m => m.domandaEffettiva),
      isBold: true,
    },
    {
      label: `Arretrato mese precedente`,
      tooltip: `Ordini non evasi nei mesi precedenti per mancanza di prodotto, trascinati a questo mese per tentare di evaderli. Se presente, questi animali si sommano alla domanda del mese corrente nel tentativo di evasione.`,
      color: "#b91c1c",
      bgClass: "",
      textClass: "text-gray-600",
      values: mc.map(m => m.ordiniArretrati || 0),
      isWarning: (colIdx: number) => {
        const m = mc[colIdx];
        return m ? (m.ordiniArretrati || 0) > 0 : false;
      },
    },
    {
      label: `Ordini evadibili ${data.targetSize}`,
      tooltip: `Quantità della domanda effettiva (+ arretrato) che può essere evasa con l'inventario disponibile (incluso schiuditoio). Verde = domanda completamente coperta. Rosso = copertura parziale, c'è un gap.`,
      color: "#a855f7",
      bgClass: "",
      textClass: "text-gray-800",
      values: mc.map(m => m.ordiniEvasi),
      isWarning: (colIdx: number) => {
        const m = mc[colIdx];
        const totalDemand = m ? m.domandaEffettiva + (m.ordiniArretrati || 0) : 0;
        return m ? totalDemand > 0 && m.ordiniEvasi < totalDemand : false;
      },
      isSuccess: (colIdx: number) => {
        const m = mc[colIdx];
        const totalDemand = m ? m.domandaEffettiva + (m.ordiniArretrati || 0) : 0;
        return m ? totalDemand > 0 && m.ordiniEvasi >= totalDemand : false;
      },
    },
    {
      label: `Giacenza residua ${data.targetSize}`,
      tooltip: `Animali rimasti dopo aver evaso gli ordini del mese. Calcolato come: Giacenza lorda (con schiuditoio) meno Ordini evadibili. Un valore positivo indica surplus disponibile. Un valore negativo indica carenza di stock.`,
      color: "#16a34a",
      bgClass: "",
      textClass: "text-gray-900",
      values: mc.map(m => m.giacenzaNetTarget),
      isBold: true,
    },
    {
      label: `Schiuditoio necessario ${data.targetSize}`,
      tooltip: `Numero di animali TP-300 che devono ARRIVARE dallo schiuditoio in questo mese per poter crescere e coprire i gap degli ordini futuri. Il calcolo simula la crescita da TP-300 alla taglia target usando SGR e mortalità, e posiziona il fabbisogno nel mese di arrivo (non nel mese di consegna). Se il valore è 0, non ci sono gap futuri che richiedono arrivi in questo mese.`,
      color: "#be185d",
      bgClass: "",
      textClass: "text-gray-600",
      values: mc.map(m => m.schiuditoioNecessario || 0),
      isWarning: (colIdx: number) => {
        const m = mc[colIdx];
        return m ? (m.schiuditoioNecessario || 0) > 0 : false;
      },
    },
    {
      label: "Arrivi Schiuditoio (TP-300)",
      tooltip: "Quantità di animali TP-300 (~30M an/kg) pianificati in arrivo dallo schiuditoio per questo mese. Questi valori sono inseriti manualmente e vengono usati nella simulazione di crescita per calcolare il loro contributo futuro alla giacenza a taglia target.",
      color: "#10b981",
      bgClass: "",
      textClass: "text-gray-800",
      values: mc.map(m => m.arriviSchiuditoio),
    },
  ];

  const excelColLetter = (idx: number) => String.fromCharCode(65 + idx);

  const handleExportExcel = useCallback(async () => {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    wb.creator = "FLUPSY Management";
    wb.created = new Date();
    const ws = wb.addWorksheet("Scostamenti", {
      views: [{ state: 'frozen', xSplit: 1, ySplit: 2 }]
    });

    const titleRow = ws.addRow([`Scostamenti - Target ${data.targetSize}`]);
    titleRow.font = { bold: true, size: 14, color: { argb: "FF1E3A5F" } };
    ws.mergeCells(1, 1, 1, mc.length + 1);
    titleRow.alignment = { horizontal: "center", vertical: "middle" };
    titleRow.height = 30;

    const headerLabels = ["INDICATORE", ...mc.map(m => m.monthLabel)];
    const headerRow = ws.addRow(headerLabels);
    headerRow.height = 24;
    headerRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
      cell.alignment = { horizontal: colNumber === 1 ? "left" : "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin", color: { argb: "FF0D253F" } },
        bottom: { style: "thin", color: { argb: "FF0D253F" } },
        left: { style: "thin", color: { argb: "FF0D253F" } },
        right: { style: "thin", color: { argb: "FF0D253F" } },
      };
    });

    const lightGray = "FFF7F7F7";
    const white = "FFFFFFFF";
    const thinBorder = {
      top: { style: "thin" as const, color: { argb: "FFD0D0D0" } },
      bottom: { style: "thin" as const, color: { argb: "FFD0D0D0" } },
      left: { style: "thin" as const, color: { argb: "FFD0D0D0" } },
      right: { style: "thin" as const, color: { argb: "FFD0D0D0" } },
    };

    const excelRows: SpreadsheetRow[] = [];
    for (const row of rows) {
      excelRows.push(row);
      if (row.isExpandable && row.groupKey === "ordini" && !ordersExpanded) {
        for (const sz of allOrderSizes) {
          excelRows.push({
            label: `  ↳ ${sz}`,
            tooltip: `Ordini clienti ${sz}`,
            color: "#fb923c",
            bgClass: "bg-orange-50/50",
            textClass: "text-gray-600",
            values: mc.map(m => (m.ordiniBySize?.[sz]) || 0),
            isSubRow: true,
            subRowSize: sz,
            groupKey: "ordini",
          });
        }
      }
    }

    excelRows.forEach((row, rowIdx) => {
      const rowData = [row.label, ...row.values.map(v => typeof v === "number" ? v : 0)];
      const excelRow = ws.addRow(rowData);
      const stripeBg = rowIdx % 2 === 0 ? white : lightGray;
      const isSubRowExcel = !!row.isSubRow;

      excelRow.eachCell((cell, colNumber) => {
        cell.border = thinBorder;
        if (colNumber === 1) {
          cell.font = { bold: !isSubRowExcel, size: isSubRowExcel ? 9 : 10, color: { argb: isSubRowExcel ? "FF888888" : "FF333333" }, italic: isSubRowExcel };
          cell.alignment = { horizontal: "left", vertical: "middle", indent: isSubRowExcel ? 2 : 0 };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isSubRowExcel ? "FFFFF7ED" : stripeBg } };
        } else {
          const colIdx = colNumber - 2;
          cell.numFmt = "#,##0";
          cell.alignment = { horizontal: "right", vertical: "middle" };

          const warn = row.isWarning ? row.isWarning(colIdx) : false;
          const success = row.isSuccess ? row.isSuccess(colIdx) : false;

          if (warn) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
            cell.font = { bold: true, size: 10, color: { argb: "FFDC2626" } };
          } else if (success) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
            cell.font = { bold: true, size: 10, color: { argb: "FF16A34A" } };
          } else if (isSubRowExcel) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF7ED" } };
            cell.font = { size: 9, color: { argb: "FF666666" } };
          } else {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: stripeBg } };
            cell.font = { size: 10, color: { argb: "FF333333" }, bold: !!row.isBold };
          }
        }
      });
    });

    ws.columns = [{ width: 38 }, ...mc.map(() => ({ width: 16 }))];

    ws.autoFilter = {
      from: { row: 2, column: 1 },
      to: { row: 2 + excelRows.length, column: mc.length + 1 },
    };

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Scostamenti_${data.targetSize}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Esportato", description: "File Excel scaricato" });
  }, [mc, rows, data.targetSize]);

  const handleCopyTable = useCallback(() => {
    const headers = ["Indicatore", ...mc.map(m => m.monthLabel)].join("\t");
    const dataRows = rows.map(row =>
      [row.label, ...row.values.map(v => typeof v === 'number' ? v : String(v))].join("\t")
    );
    const text = [headers, ...dataRows].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copiato", description: "Tabella copiata negli appunti" });
    });
  }, [mc, rows]);

  const multiCellStats = useMemo(() => {
    const allKeys = new Set(selectedCells);
    if (selectedRow !== null) {
      for (let c = 0; c < mc.length; c++) allKeys.add(cellKey(selectedRow, c));
    }
    if (selectedCol !== null) {
      for (let r = 0; r < rows.length; r++) allKeys.add(cellKey(r, selectedCol));
    }
    if (allKeys.size < 2) return null;
    const nums: number[] = [];
    for (const k of allKeys) {
      const { row: r, col: c } = parseKey(k);
      const v = rows[r]?.values[c];
      if (typeof v === 'number' && v !== 0) nums.push(v);
    }
    if (nums.length === 0) return null;
    const sum = nums.reduce((a, b) => a + b, 0);
    return {
      somma: sum,
      media: sum / nums.length,
      conteggio: nums.length,
      minimo: Math.min(...nums),
      massimo: Math.max(...nums),
      celle: allKeys.size,
    };
  }, [selectedCells, selectedRow, selectedCol, rows, mc]);

  const handleCellClick = (rowIdx: number, colIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const key = cellKey(rowIdx, colIdx);

    if (e.shiftKey && anchorCell) {
      const minR = Math.min(anchorCell.row, rowIdx);
      const maxR = Math.max(anchorCell.row, rowIdx);
      const minC = Math.min(anchorCell.col, colIdx);
      const maxC = Math.max(anchorCell.col, colIdx);
      const newSet = new Set<string>();
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          newSet.add(cellKey(r, c));
        }
      }
      setSelectedCells(newSet);
      setSelectedRow(null);
      setSelectedCol(null);
    } else if (e.ctrlKey || e.metaKey) {
      const newSet = new Set(selectedCells);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      setSelectedCells(newSet);
      setAnchorCell({ row: rowIdx, col: colIdx });
      setSelectedRow(null);
      setSelectedCol(null);
    } else {
      setSelectedCells(new Set([key]));
      setAnchorCell({ row: rowIdx, col: colIdx });
      setSelectedRow(null);
      setSelectedCol(null);
    }
  };

  const handleRowHeaderClick = (rowIdx: number) => {
    setSelectedRow(rowIdx);
    setSelectedCells(new Set());
    setSelectedCol(null);
    setAnchorCell(null);
  };

  const handleColHeaderClick = (colIdx: number) => {
    setSelectedCol(colIdx);
    setSelectedCells(new Set());
    setSelectedRow(null);
    setAnchorCell(null);
  };

  const isCellSelected = (rowIdx: number, colIdx: number) => {
    if (selectedCells.has(cellKey(rowIdx, colIdx))) return true;
    if (selectedRow === rowIdx) return true;
    if (selectedCol === colIdx) return true;
    return false;
  };

  const getCellFormula = (rowIdx: number, colIdx: number): string => {
    const m = mc[colIdx];
    if (!m) return "";
    const fn = formatNumber;
    const row = rows[rowIdx];
    if (!row) return "";

    if (row.isSubRow && row.subRowSize) {
      const qty = m.ordiniBySize?.[row.subRowSize] || 0;
      return qty > 0
        ? `= Ordini clienti ${row.subRowSize} per ${m.monthName}: ${fn(qty)} animali`
        : `= Nessun ordine ${row.subRowSize} per ${m.monthName}`;
    }

    const label = row.label;
    if (label.startsWith("Giacenza lorda (inventario)")) {
      return `= Simulazione crescita SGR giorno per giorno (solo inventario reale) → animali con ≤${fn(data.targetMaxAnimalsPerKg)} an/kg = ${fn(m.giacenzaLordaInventario)}`;
    }
    if (label.startsWith("Giacenza lorda (con schiuditoio)")) {
      const diff = m.giacenzaLordaConSchiuditoio - m.giacenzaLordaInventario;
      if (diff > 0) {
        return `= Giacenza inventario (${fn(m.giacenzaLordaInventario)}) + Contributo schiuditoio cresciuto (${fn(diff)}) = ${fn(m.giacenzaLordaConSchiuditoio)}`;
      }
      return `= Giacenza inventario (${fn(m.giacenzaLordaInventario)}) + Schiuditoio (non ancora a taglia) = ${fn(m.giacenzaLordaConSchiuditoio)}`;
    }
    if (label.startsWith("Perdite per mortalità")) {
      const perdite = m.perditeMortalita || 0;
      if (perdite > 0) {
        return `= Animali persi nel mese per mortalità: ${fn(perdite)} (tassi applicati per taglia, esclusa giacenza già pronta)`;
      }
      return `= Nessuna perdita per mortalità in ${m.monthName}`;
    }
    if (label.startsWith("Ordini clienti")) {
      const tot = m.ordiniTotali || 0;
      if (tot > 0) {
        const breakdown = allOrderSizes
          .filter(sz => (m.ordiniBySize?.[sz] || 0) > 0)
          .map(sz => `${sz}: ${fn(m.ordiniBySize[sz])}`)
          .join(', ');
        return `= Totale ordini tutte le taglie per ${m.monthName}: ${fn(tot)} animali (${breakdown})`;
      }
      return `= Nessun ordine clienti per ${m.monthName}`;
    }
    if (label === "Budget Produzione") {
      return m.budgetProduzione > 0
        ? `= Budget vendite pianificato per ${m.monthName}: ${fn(m.budgetProduzione)} animali`
        : `= Nessun budget pianificato per ${m.monthName}`;
    }
    if (label === "Domanda effettiva") {
      return `= MAX(Ordini ${data.targetSize} ${fn(m.ordiniTarget)}, Budget ${fn(m.budgetProduzione)}) = ${fn(m.domandaEffettiva)} animali. Questo valore guida evasione e fabbisogno schiuditoio.`;
    }
    if (label.startsWith("Arretrato mese precedente")) {
      const arretrato = m.ordiniArretrati || 0;
      if (arretrato > 0) {
        return `= Domanda non evasa trascinata dai mesi precedenti: ${fn(arretrato)} animali. Sommata alla domanda del mese (${fn(m.domandaEffettiva)}) = ${fn(m.domandaEffettiva + arretrato)} totale da evadere`;
      }
      return `= Nessun arretrato da mesi precedenti`;
    }
    if (label.startsWith("Ordini evadibili")) {
      const totalDemand = m.domandaEffettiva + (m.ordiniArretrati || 0);
      if (m.ordiniEvasi > 0 && m.ordiniEvasi >= totalDemand) {
        return `= ${fn(m.ordiniEvasi)} evadibili su ${fn(totalDemand)} richiesti (${fn(m.domandaEffettiva)} domanda + ${fn(m.ordiniArretrati || 0)} arretrato) → Copertura completa ✓`;
      }
      if (m.ordiniEvasi > 0) {
        const nonEvasi = totalDemand - m.ordiniEvasi;
        return `= ${fn(m.ordiniEvasi)} evadibili su ${fn(totalDemand)} richiesti → Mancano ${fn(nonEvasi)} animali (trascinati al mese successivo)`;
      }
      if (totalDemand > 0) {
        return `= 0 evadibili su ${fn(totalDemand)} richiesti → ${fn(totalDemand)} animali trascinati al mese successivo`;
      }
      return `= Nessuna domanda per ${m.monthName}`;
    }
    if (label.startsWith("Giacenza residua")) {
      return `= Giacenza lorda con schiuditoio (${fn(m.giacenzaLordaConSchiuditoio)}) - Ordini evadibili (${fn(m.ordiniEvasi)}) = ${fn(m.giacenzaNetTarget)}`;
    }
    if (label.startsWith("Schiuditoio necessario")) {
      const necessario = m.schiuditoioNecessario || 0;
      if (necessario > 0) {
        return `= TP-300 che devono arrivare in ${m.monthName} per crescere fino a ${data.targetSize} e coprire gap futuri = ${fn(necessario)} animali (gap ÷ fattore sopravvivenza SGR + mortalità)`;
      }
      return `= Nessun arrivo TP-300 necessario in ${m.monthName}`;
    }
    if (label.startsWith("Arrivi Schiuditoio")) {
      return m.arriviSchiuditoio > 0
        ? `= Arrivo schiuditoio pianificato: ${fn(m.arriviSchiuditoio)} animali (taglia TP-300, ~30M an/kg)`
        : `= Nessun arrivo schiuditoio pianificato per ${m.monthName}`;
    }
    return "";
  };

  const cellFormula = selectedCell ? getCellFormula(selectedCell.row, selectedCell.col) : "";
  const cellValue = selectedCell ? rows[selectedCell.row]?.values[selectedCell.col] : "";

  return (
    <Card className="border-gray-300 shadow-sm">
      <CardHeader className="pb-1 pt-3 px-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4 text-green-700" />
            <CardTitle className="text-sm font-semibold text-green-800">Tabella Riepilogativa Mensile</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleCopyTable}>
              <Copy className="h-3 w-3" /> Copia
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-green-700" onClick={handleExportExcel}>
              <Download className="h-3 w-3" /> Excel
            </Button>
          </div>
        </div>
        {selectedCell && !multiCellStats && (
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center gap-2 bg-gray-100 rounded px-2 py-1.5 text-xs border">
              <span className="font-mono font-bold text-green-700 min-w-[24px]">fx</span>
              <span className="text-gray-300">│</span>
              <span className="font-mono text-gray-700 flex-1 text-[11px] leading-relaxed">
                {cellFormula}
              </span>
            </div>
          </div>
        )}
        {multiCellStats && (
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded px-3 py-2 text-xs border border-blue-200">
              <span className="font-mono font-bold text-blue-700 min-w-[24px]">Σ</span>
              <span className="text-blue-200">│</span>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 flex-1">
                <span className="inline-flex items-center gap-1">
                  <span className="text-gray-500 font-medium">Somma:</span>
                  <span className="font-mono font-bold text-blue-800">{formatNumber(multiCellStats.somma)}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="text-gray-500 font-medium">Media:</span>
                  <span className="font-mono font-bold text-blue-800">{formatNumber(Math.round(multiCellStats.media))}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="text-gray-500 font-medium">Conteggio:</span>
                  <span className="font-mono font-bold text-blue-800">{multiCellStats.conteggio}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="text-gray-500 font-medium">Min:</span>
                  <span className="font-mono font-bold text-blue-800">{formatNumber(multiCellStats.minimo)}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="text-gray-500 font-medium">Max:</span>
                  <span className="font-mono font-bold text-blue-800">{formatNumber(multiCellStats.massimo)}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-gray-400">
                  ({multiCellStats.celle} celle)
                </span>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto border-t border-gray-300">
          <TooltipProvider delayDuration={200}>
          <table
            ref={tableRef}
            className="w-full text-sm border-collapse select-none"
            style={{ fontFamily: "'Calibri', 'Segoe UI', sans-serif" }}
            onClick={() => { setSelectedCells(new Set()); setSelectedRow(null); setSelectedCol(null); setAnchorCell(null); }}
          >
            <thead>
              <tr>
                <th
                  className="sticky left-0 z-20 bg-gradient-to-b from-gray-100 to-gray-200 border-r-2 border-b border-gray-300 p-0 min-w-[220px]"
                  style={{ borderRight: '2px solid #9ca3af' }}
                >
                  <div className="px-2 py-1.5 text-left text-[13px] font-semibold text-gray-600 tracking-wide uppercase">
                    Indicatore
                  </div>
                </th>
                {mc.map((m, i) => (
                  <th
                    key={i}
                    className={`border-b border-r border-gray-300 p-0 min-w-[110px] cursor-pointer transition-colors ${selectedCol === i ? 'bg-blue-200' : 'bg-gradient-to-b from-gray-100 to-gray-200'}`}
                    onClick={(e) => { e.stopPropagation(); handleColHeaderClick(i); }}
                  >
                    <div className="px-2 py-1.5 text-center text-[13px] font-semibold text-gray-600">
                      {m.monthLabel}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="group">
                  <td
                    className={`sticky left-0 z-10 border-b border-gray-200 p-0 cursor-pointer transition-colors ${selectedRow === rowIdx ? 'bg-blue-100' : row.bgClass}`}
                    style={{ borderRight: '2px solid #9ca3af' }}
                    onClick={(e) => { e.stopPropagation(); handleRowHeaderClick(rowIdx); }}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`px-2 py-2 flex items-center gap-2 ${row.isExpandable ? 'cursor-pointer' : 'cursor-help'}`}
                          onClick={row.isExpandable ? (e) => { e.stopPropagation(); setOrdersExpanded(!ordersExpanded); } : undefined}
                        >
                          {row.isExpandable ? (
                            ordersExpanded
                              ? <ChevronDown className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                              : <ChevronRight className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                          ) : row.isSubRow ? (
                            <span className="w-2.5 h-2.5 flex-shrink-0" />
                          ) : (
                            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: row.color }}></span>
                          )}
                          <span className={`font-semibold text-[13px] ${row.textClass} ${row.isSubRow ? 'text-[12px] font-normal' : ''}`}>{row.label}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs text-sm p-3 leading-relaxed bg-gray-900 text-white border border-gray-700 shadow-lg">
                        {row.tooltip}
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  {row.values.map((val, colIdx) => {
                    const isSelected = isCellSelected(rowIdx, colIdx);
                    const numVal = typeof val === 'number' ? val : null;
                    const isNeg = numVal !== null && numVal < 0;
                    const isEmpty = numVal === 0 && !row.isNegative;
                    const warn = row.isWarning ? row.isWarning(colIdx) : false;
                    const success = row.isSuccess ? row.isSuccess(colIdx) : false;
                    const displayVal = typeof val === 'string'
                      ? val
                      : numVal === 0
                        ? (row.isNegative ? '-' : '-')
                        : formatNumber(numVal!);

                    const cellBg = isSelected ? '' : warn ? 'bg-red-50' : success ? 'bg-green-50' : '';
                    const textColor = isEmpty ? 'text-gray-300' : warn ? 'text-red-600 font-bold' : success ? 'text-green-700 font-bold' : isNeg ? 'text-red-600' : row.textClass;

                    return (
                      <td
                        key={colIdx}
                        className={`border-b border-r border-gray-200 p-0 cursor-cell transition-all ${cellBg} ${isSelected ? 'ring-2 ring-blue-500 ring-inset bg-blue-50 z-10 relative' : ''}`}
                        onClick={(e) => handleCellClick(rowIdx, colIdx, e)}
                      >
                        <div className={`px-2 py-2 text-right tabular-nums ${row.isBold ? 'font-bold' : 'font-semibold'} text-[14px] ${textColor}`}>
                          {displayVal}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProiezioneCrescita() {
  const { toast } = useToast();
  const [showHatcheryForm, setShowHatcheryForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [hatcheryInputs, setHatcheryInputs] = useState<Record<string, string>>({});
  const [budgetInputs, setBudgetInputs] = useState<Record<string, string>>({});
  const [mortalityInput, setMortalityInput] = useState<string>("");
  const [activeMortality, setActiveMortality] = useState<number | undefined>(undefined);

  const queryParams: Record<string, any> = {};
  if (activeMortality !== undefined) {
    queryParams.mortalityPercent = activeMortality;
  }

  const { data, isLoading, error } = useQuery<GrowthProjectionResult>({
    queryKey: ["/api/proiezione-crescita", queryParams],
  });

  const hatcheryYears = data?.monthlyContext
    ? [...new Set(data.monthlyContext.map(m => m.year))]
    : [new Date().getFullYear()];

  const { data: hatcheryData } = useQuery<HatcheryArrival[]>({
    queryKey: ["/api/proiezione-crescita/hatchery-arrivals", { year: hatcheryYears[0] }],
    enabled: !!data,
  });

  const { data: hatcheryData2 } = useQuery<HatcheryArrival[]>({
    queryKey: ["/api/proiezione-crescita/hatchery-arrivals", { year: hatcheryYears[1] }],
    enabled: !!data && hatcheryYears.length > 1,
  });

  const allHatcheryData = [...(hatcheryData || []), ...(hatcheryData2 || [])];

  const { data: budgetData } = useQuery<ProductionTarget[]>({
    queryKey: ["/api/proiezione-crescita/production-targets", { year: hatcheryYears[0] }],
    enabled: !!data,
  });

  const { data: budgetData2 } = useQuery<ProductionTarget[]>({
    queryKey: ["/api/proiezione-crescita/production-targets", { year: hatcheryYears[1] }],
    enabled: !!data && hatcheryYears.length > 1,
  });

  const allBudgetData = [...(budgetData || []), ...(budgetData2 || [])];

  const saveBudget = useMutation({
    mutationFn: async (payload: { year: number; month: number; sizeCategory: string; targetAnimals: number }) => {
      return apiRequest("/api/proiezione-crescita/production-targets", "POST", payload);
    },
    onSuccess: () => {
      for (const y of hatcheryYears) {
        queryClient.invalidateQueries({ queryKey: ["/api/proiezione-crescita/production-targets", { year: y }] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/proiezione-crescita"] });
      toast({ title: "Salvato", description: "Budget produzione aggiornato" });
    }
  });

  const saveHatchery = useMutation({
    mutationFn: async (payload: { year: number; month: number; quantity: number }) => {
      return apiRequest("/api/proiezione-crescita/hatchery-arrivals", "POST", payload);
    },
    onSuccess: () => {
      for (const y of hatcheryYears) {
        queryClient.invalidateQueries({ queryKey: ["/api/proiezione-crescita/hatchery-arrivals", { year: y }] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/proiezione-crescita"] });
      toast({ title: "Salvato", description: "Arrivo schiuditoio salvato" });
    }
  });

  const deleteHatchery = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/proiezione-crescita/hatchery-arrivals/${id}`, "DELETE");
    },
    onSuccess: () => {
      for (const y of hatcheryYears) {
        queryClient.invalidateQueries({ queryKey: ["/api/proiezione-crescita/hatchery-arrivals", { year: y }] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/proiezione-crescita"] });
      toast({ title: "Eliminato", description: "Arrivo schiuditoio eliminato" });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg">Calcolo proiezione crescita...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">Errore nel caricamento della proiezione crescita.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const groupsBelow = data.groups.filter(g => !g.alreadyAtTarget);
  const groupsAbove = data.groups.filter(g => g.alreadyAtTarget);
  const mc = data.monthlyContext;

  const handleSaveHatchery = (year: number, month: number) => {
    const key = `${year}-${month}`;
    const val = parseInt(hatcheryInputs[key] || "0");
    if (val > 0) {
      saveHatchery.mutate({ year, month, quantity: val });
      setHatcheryInputs(prev => ({ ...prev, [key]: "" }));
    }
  };

  const handleSaveBudget = (year: number, month: number, sizeCategory: string) => {
    const key = `${year}-${month}-${sizeCategory}`;
    const raw = budgetInputs[key];
    const val = parseInt(raw || "0");
    if (isNaN(val) || val < 0) return;
    saveBudget.mutate({ year, month, sizeCategory, targetAnimals: val });
    setBudgetInputs(prev => ({ ...prev, [key]: "" }));
  };

  const handleApplyMortality = () => {
    const val = parseFloat(mortalityInput);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      setActiveMortality(val);
    }
  };

  const handleResetMortality = () => {
    setActiveMortality(undefined);
    setMortalityInput("");
  };

  const hatcheryMonths = mc.map(m => ({ year: m.year, month: m.month, label: m.monthLabel }));

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Proiezione Crescita verso {data.targetSize}</h1>
          <p className="text-sm text-muted-foreground">
            Progressione 12 mesi con ordini (sottratti dalla giacenza), budget e arrivi schiuditoio
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              Giacenza Totale
            </div>
            <div className="text-2xl font-bold">{formatNumber(data.totalCurrentQuantity)}</div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-green-700 mb-1">
              <CheckCircle2 className="h-4 w-4" />
              Già a {data.targetSize}+
            </div>
            <div className="text-2xl font-bold text-green-700">{formatNumber(data.totalAlreadyAtTarget)}</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-amber-700 mb-1">
              <Clock className="h-4 w-4" />
              In crescita
            </div>
            <div className="text-2xl font-bold text-amber-700">{formatNumber(data.totalNotYetAtTarget)}</div>
          </CardContent>
        </Card>
      </div>

      <ExcelTable
        data={data}
        mc={mc}
        toast={toast}
      />

      <div className="flex items-center gap-2">
        <Button
          variant={showBudgetForm ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs gap-1"
          onClick={() => setShowBudgetForm(!showBudgetForm)}
        >
          <DollarSign className="h-3.5 w-3.5" />
          Budget Produzione
        </Button>
        <Button
          variant={showHatcheryForm ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs gap-1"
          onClick={() => setShowHatcheryForm(!showHatcheryForm)}
        >
          <Plus className="h-3.5 w-3.5" />
          Arrivi Schiuditoio
        </Button>
      </div>

      {showBudgetForm && (
        <Card className="border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-amber-700 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Budget Produzione
              <span className="ml-3 text-base font-normal text-gray-600">
                Totale: <span className="font-semibold text-amber-700">{formatNumber(allBudgetData.reduce((sum, b) => sum + b.targetAnimals, 0))}</span> animali
              </span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Inserisci gli obiettivi di vendita mensili per categoria (T3 = 6K-30K an/kg, T10 = {'<'}6K an/kg)
            </p>
          </CardHeader>
          <CardContent>
            {["T3", "T10"].map(cat => (
              <div key={cat} className="mb-4">
                <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-sm ${cat === "T3" ? "bg-amber-500" : "bg-orange-500"}`}></span>
                  {cat} {cat === "T3" ? "(6K-30K an/kg)" : "(<6K an/kg)"}
                  <span className="font-normal text-gray-500">
                    — Totale: {formatNumber(allBudgetData.filter(b => b.sizeCategory === cat).reduce((sum, b) => sum + b.targetAnimals, 0))}
                  </span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {mc.map(({ year, month, monthLabel }) => {
                    const existing = allBudgetData.find(b => b.year === year && b.month === month && b.sizeCategory === cat);
                    const inputKey = `${year}-${month}-${cat}`;
                    return (
                      <div key={inputKey} className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-muted-foreground">{monthLabel}</label>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            placeholder="0"
                            className={`h-8 text-sm ${existing ? 'font-semibold text-amber-700' : ''}`}
                            value={budgetInputs[inputKey] ?? (existing ? String(existing.targetAnimals) : "")}
                            onChange={e => setBudgetInputs(prev => ({ ...prev, [inputKey]: e.target.value }))}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-600"
                            onClick={() => {
                              const raw = budgetInputs[inputKey] ?? (existing ? String(existing.targetAnimals) : "0");
                              const val = parseInt(raw || "0");
                              if (!isNaN(val) && val >= 0) {
                                saveBudget.mutate({ year, month, sizeCategory: cat, targetAnimals: val });
                                setBudgetInputs(prev => { const n = {...prev}; delete n[inputKey]; return n; });
                              }
                            }}
                            disabled={budgetInputs[inputKey] === undefined || budgetInputs[inputKey] === (existing ? String(existing.targetAnimals) : "")}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {showHatcheryForm && (
        <Card className="border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-emerald-700">
              Inserisci Arrivi Schiuditoio (TP-300)
              <span className="ml-3 text-base font-normal text-gray-600">
                Totale: <span className="font-semibold text-emerald-700">{formatNumber(allHatcheryData.reduce((sum, h) => sum + h.quantity, 0))}</span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {hatcheryMonths.map(({ year, month, label }) => {
                const existing = allHatcheryData.find(h => h.year === year && h.month === month);
                const inputKey = `${year}-${month}`;
                return (
                  <div key={inputKey} className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-muted-foreground">{label}</label>
                    {existing ? (
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold text-emerald-700 flex-1">{formatNumber(existing.quantity)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500"
                          onClick={() => deleteHatchery.mutate(existing.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          placeholder="0"
                          className="h-8 text-sm"
                          value={hatcheryInputs[inputKey] || ""}
                          onChange={e => setHatcheryInputs(prev => ({ ...prev, [inputKey]: e.target.value }))}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-emerald-600"
                          onClick={() => handleSaveHatchery(year, month)}
                          disabled={!hatcheryInputs[inputKey] || parseInt(hatcheryInputs[inputKey]) <= 0}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {groupsAbove.length > 0 && (
        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-green-700">
              Già a taglia {data.targetSize} o superiore
              <span className="ml-3 text-base font-normal text-gray-600">
                Totale: <span className="font-semibold text-green-700">{formatNumber(groupsAbove.reduce((sum, g) => sum + g.currentQuantity, 0))}</span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-green-50">
                    <th className="text-left p-2 font-semibold">Taglia Attuale</th>
                    <th className="text-right p-2 font-semibold">Cestelli</th>
                    <th className="text-right p-2 font-semibold">Quantità</th>
                    <th className="text-right p-2 font-semibold">An/kg medio</th>
                  </tr>
                </thead>
                <tbody>
                  {groupsAbove.map(g => (
                    <tr key={g.currentSize} className="border-b hover:bg-green-50/50">
                      <td className="p-2 font-medium">{g.currentSize}</td>
                      <td className="p-2 text-right">{g.basketCount}</td>
                      <td className="p-2 text-right">{formatNumber(g.currentQuantity)}</td>
                      <td className="p-2 text-right">{formatNumber(g.currentAvgAnimalsPerKg)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {groupsBelow.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              Progressione mensile verso {data.targetSize}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Per ogni taglia attuale, la taglia proiettata mese per mese
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <TooltipProvider>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2 font-semibold sticky left-0 bg-muted/50 z-10 min-w-[100px]">Taglia Attuale</th>
                      <th className="text-right p-2 font-semibold min-w-[80px]">Cestelli</th>
                      <th className="text-right p-2 font-semibold min-w-[100px]">Quantità</th>
                      <th className="text-center p-2 font-semibold min-w-[110px]">Raggiunge</th>
                      {groupsBelow[0]?.months.map((m, i) => (
                        <th key={i} className="text-center p-2 font-semibold min-w-[90px]">{m.monthLabel}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {groupsBelow.map(g => (
                      <tr key={g.currentSize} className="border-b hover:bg-muted/30">
                        <td className="p-2 font-medium sticky left-0 bg-background z-10">{g.currentSize}</td>
                        <td className="p-2 text-right">{g.basketCount}</td>
                        <td className="p-2 text-right">{formatNumber(g.currentQuantity)}</td>
                        <td className="p-2 text-center">
                          {g.monthReached ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              <CheckCircle2 className="h-3 w-3" />
                              {g.monthReached}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                              Non nel periodo
                            </span>
                          )}
                        </td>
                        {g.months.map((m, i) => {
                          const reached = m.reachedTarget;
                          const bg = reached ? "bg-green-100 text-green-800" : "bg-amber-50 text-amber-800";
                          return (
                            <td key={i} className={`p-2 text-center ${bg}`}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="cursor-default">
                                    <div className="font-semibold text-xs">{m.projectedSize}</div>
                                    <div className="text-[10px] opacity-70">{formatNumber(m.quantity)}</div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-semibold">{m.monthName}</p>
                                  <p>Taglia: {m.projectedSize}</p>
                                  <p>An/kg: {formatNumber(m.avgAnimalsPerKg)}</p>
                                  <p>Quantità: {formatNumber(m.quantity)}</p>
                                  {reached && <p className="text-green-600 font-semibold">Target {data.targetSize} raggiunto!</p>}
                                </TooltipContent>
                              </Tooltip>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
