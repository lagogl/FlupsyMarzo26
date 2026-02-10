import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, TrendingUp, CheckCircle2, Clock, Target, Plus, Trash2, Save, Percent, Download, Copy, Grid3X3 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useCallback, useRef } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

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
  ordiniEvasi: number;
  budgetProduzione: number;
  arriviSchiuditoio: number;
  giacenzaLordaInventario: number;
  giacenzaLordaConSchiuditoio: number;
  giacenzaNetTarget: number;
  schiuditoioNecessario: number;
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
}

function ExcelTable({ data, mc, showHatcheryForm, setShowHatcheryForm, toast }: {
  data: GrowthProjectionResult;
  mc: MonthlyContext[];
  showHatcheryForm: boolean;
  setShowHatcheryForm: (v: boolean) => void;
  toast: any;
}) {
  const tableRef = useRef<HTMLTableElement>(null);
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [selectedCol, setSelectedCol] = useState<number | null>(null);

  const rows: SpreadsheetRow[] = [
    {
      label: "Giacenza lorda (inventario)",
      tooltip: "Numero totale di animali presenti nell'inventario reale (cestelli attivi) che hanno raggiunto o superato la taglia target selezionata. Considera solo la crescita simulata dell'inventario esistente, senza includere arrivi futuri dallo schiuditoio.",
      color: "#3b82f6",
      bgClass: "bg-blue-50",
      textClass: "text-blue-700",
      values: mc.map(m => m.giacenzaLordaInventario),
    },
    {
      label: "Giacenza lorda (con schiuditoio)",
      tooltip: "Numero totale di animali a taglia target includendo sia l'inventario reale sia il contributo degli arrivi pianificati dallo schiuditoio. Gli animali TP-300 inseriti come arrivi vengono simulati in crescita mese per mese usando SGR e mortalità, e conteggiati quando raggiungono la taglia target.",
      color: "#06b6d4",
      bgClass: "bg-cyan-50",
      textClass: "text-cyan-700",
      values: mc.map(m => m.giacenzaLordaConSchiuditoio),
    },
    {
      label: `Ordini richiesti ${data.targetSize}`,
      tooltip: `Quantità totale di animali di taglia ${data.targetSize} (o compatibile) richiesta dagli ordini clienti per quel mese. Include ordini da database esterno e ordini avanzati. Rappresenta la domanda da soddisfare.`,
      color: "#ea580c",
      bgClass: "bg-orange-50",
      textClass: "text-orange-700",
      values: mc.map(m => m.ordiniTarget),
    },
    {
      label: `Ordini evadibili ${data.targetSize}`,
      tooltip: `Quantità di ordini che possono essere effettivamente evasi con l'inventario disponibile (incluso schiuditoio). Verde = ordini completamente coperti. Rosso = copertura parziale, c'è un gap tra domanda e disponibilità. Gli ordini vengono evasi dal più grande al più piccolo per ottimizzare l'uso dello stock.`,
      color: "#a855f7",
      bgClass: "bg-purple-50",
      textClass: "text-purple-700",
      values: mc.map(m => m.ordiniEvasi),
      isWarning: (colIdx: number) => {
        const m = mc[colIdx];
        return m ? m.ordiniTarget > 0 && m.ordiniEvasi < m.ordiniTarget : false;
      },
      isSuccess: (colIdx: number) => {
        const m = mc[colIdx];
        return m ? m.ordiniTarget > 0 && m.ordiniEvasi >= m.ordiniTarget : false;
      },
    },
    {
      label: `Giacenza residua ${data.targetSize}`,
      tooltip: `Animali rimasti dopo aver evaso gli ordini del mese. Calcolato come: Giacenza lorda (con schiuditoio) meno Ordini evadibili. Un valore positivo indica surplus disponibile. Un valore negativo indica carenza di stock.`,
      color: "#16a34a",
      bgClass: "bg-green-50",
      textClass: "text-green-700",
      values: mc.map(m => m.giacenzaNetTarget),
      isBold: true,
    },
    {
      label: `Schiuditoio necessario ${data.targetSize}`,
      tooltip: `Numero di animali TP-300 che devono ARRIVARE dallo schiuditoio in questo mese per poter crescere e coprire i gap degli ordini futuri. Il calcolo simula la crescita da TP-300 alla taglia target usando SGR e mortalità, e posiziona il fabbisogno nel mese di arrivo (non nel mese di consegna). Se il valore è 0, non ci sono gap futuri che richiedono arrivi in questo mese.`,
      color: "#be185d",
      bgClass: "bg-pink-50",
      textClass: "text-pink-700",
      values: mc.map(m => m.schiuditoioNecessario || 0),
      isWarning: (colIdx: number) => {
        const m = mc[colIdx];
        return m ? (m.schiuditoioNecessario || 0) > 0 : false;
      },
    },
    {
      label: "Budget Produzione",
      tooltip: "Budget di vendita pianificato per il mese, espresso in numero di animali. Rappresenta l'obiettivo commerciale mensile definito nel piano di produzione annuale.",
      color: "#f59e0b",
      bgClass: "bg-amber-50",
      textClass: "text-amber-700",
      values: mc.map(m => m.budgetProduzione),
    },
    {
      label: "Arrivi Schiuditoio (TP-300)",
      tooltip: "Quantità di animali TP-300 (~30M an/kg) pianificati in arrivo dallo schiuditoio per questo mese. Questi valori sono inseriti manualmente e vengono usati nella simulazione di crescita per calcolare il loro contributo futuro alla giacenza a taglia target.",
      color: "#10b981",
      bgClass: "bg-emerald-50",
      textClass: "text-emerald-700",
      values: mc.map(m => m.arriviSchiuditoio),
    },
  ];

  const excelColLetter = (idx: number) => String.fromCharCode(65 + idx);

  const handleExportExcel = useCallback(() => {
    const headers = ["Indicatore", ...mc.map(m => m.monthLabel)];
    const wsData = [headers];
    for (const row of rows) {
      wsData.push([
        row.label,
        ...row.values.map(v => typeof v === 'number' ? String(v) : String(v))
      ]);
    }
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const colWidths = [{ wch: 35 }, ...mc.map(() => ({ wch: 16 }))];
    ws['!cols'] = colWidths;

    for (let r = 1; r <= rows.length; r++) {
      for (let c = 1; c <= mc.length; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        const cell = ws[cellRef];
        if (cell) {
          const numVal = parseFloat(String(cell.v).replace(/[^\d.-]/g, ''));
          if (!isNaN(numVal)) {
            cell.v = numVal;
            cell.t = 'n';
            cell.z = '#,##0';
          }
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Proiezione Crescita");
    XLSX.writeFile(wb, `Proiezione_Crescita_${data.targetSize}.xlsx`);
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

  const handleCellClick = (rowIdx: number, colIdx: number) => {
    setSelectedCell({ row: rowIdx, col: colIdx });
    setSelectedRow(null);
    setSelectedCol(null);
  };

  const handleRowHeaderClick = (rowIdx: number) => {
    setSelectedRow(rowIdx);
    setSelectedCell(null);
    setSelectedCol(null);
  };

  const handleColHeaderClick = (colIdx: number) => {
    setSelectedCol(colIdx);
    setSelectedCell(null);
    setSelectedRow(null);
  };

  const isCellSelected = (rowIdx: number, colIdx: number) => {
    if (selectedCell && selectedCell.row === rowIdx && selectedCell.col === colIdx) return true;
    if (selectedRow === rowIdx) return true;
    if (selectedCol === colIdx) return true;
    return false;
  };

  const getCellFormula = (rowIdx: number, colIdx: number): string => {
    const m = mc[colIdx];
    if (!m) return "";
    const fn = formatNumber;

    switch (rowIdx) {
      case 0:
        return `= Simulazione crescita SGR giorno per giorno (solo inventario reale) → animali con ≤${fn(data.targetMaxAnimalsPerKg)} an/kg = ${fn(m.giacenzaLordaInventario)}`;
      case 1: {
        const diff = m.giacenzaLordaConSchiuditoio - m.giacenzaLordaInventario;
        if (diff > 0) {
          return `= Giacenza inventario (${fn(m.giacenzaLordaInventario)}) + Contributo schiuditoio cresciuto (${fn(diff)}) = ${fn(m.giacenzaLordaConSchiuditoio)}`;
        }
        return `= Giacenza inventario (${fn(m.giacenzaLordaInventario)}) + Schiuditoio (non ancora a taglia) = ${fn(m.giacenzaLordaConSchiuditoio)}`;
      }
      case 2: {
        return m.ordiniTarget > 0
          ? `= Totale ordini richiesti per ${data.targetSize} a ${m.monthName}: ${fn(m.ordiniTarget)} animali`
          : `= Nessun ordine per ${m.monthName}`;
      }
      case 3: {
        if (m.ordiniEvasi > 0 && m.ordiniEvasi >= m.ordiniTarget) {
          return `= ${fn(m.ordiniEvasi)} evadibili su ${fn(m.ordiniTarget)} richiesti → Copertura completa ✓`;
        }
        if (m.ordiniEvasi > 0) {
          return `= ${fn(m.ordiniEvasi)} evadibili su ${fn(m.ordiniTarget)} richiesti → Mancano ${fn(m.ordiniTarget - m.ordiniEvasi)} animali`;
        }
        if (m.ordiniTarget > 0) {
          return `= 0 evadibili su ${fn(m.ordiniTarget)} richiesti → Nessuno stock disponibile a ${data.targetSize}`;
        }
        return `= Nessun ordine per ${m.monthName}`;
      }
      case 4: {
        return `= Giacenza lorda con schiuditoio (${fn(m.giacenzaLordaConSchiuditoio)}) - Ordini evadibili (${fn(m.ordiniEvasi)}) = ${fn(m.giacenzaNetTarget)}`;
      }
      case 5: {
        const necessario = m.schiuditoioNecessario || 0;
        if (necessario > 0) {
          return `= TP-300 che devono arrivare in ${m.monthName} per crescere fino a ${data.targetSize} e coprire gap ordini futuri = ${fn(necessario)} animali (gap ÷ fattore sopravvivenza SGR + mortalità)`;
        }
        return `= Nessun arrivo TP-300 necessario in ${m.monthName}`;
      }
      case 6:
        return m.budgetProduzione > 0
          ? `= Budget vendite pianificato per ${m.monthName}: ${fn(m.budgetProduzione)} animali`
          : `= Nessun budget pianificato per ${m.monthName}`;
      case 7:
        return m.arriviSchiuditoio > 0
          ? `= Arrivo schiuditoio pianificato: ${fn(m.arriviSchiuditoio)} animali (taglia TP-300, ~30M an/kg)`
          : `= Nessun arrivo schiuditoio pianificato per ${m.monthName}`;
      default:
        return "";
    }
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
            <Button
              variant={showHatcheryForm ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowHatcheryForm(!showHatcheryForm)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Arrivi Schiuditoio
            </Button>
          </div>
        </div>
        {selectedCell && (
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
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto border-t border-gray-300">
          <TooltipProvider delayDuration={200}>
          <table
            ref={tableRef}
            className="w-full text-sm border-collapse select-none"
            style={{ fontFamily: "'Calibri', 'Segoe UI', sans-serif" }}
            onClick={() => { setSelectedCell(null); setSelectedRow(null); setSelectedCol(null); }}
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
                        <div className="px-2 py-2 flex items-center gap-2 cursor-help">
                          <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: row.color }}></span>
                          <span className={`font-semibold text-[13px] ${row.textClass}`}>{row.label}</span>
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
                        onClick={(e) => { e.stopPropagation(); handleCellClick(rowIdx, colIdx); }}
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
  const [hatcheryInputs, setHatcheryInputs] = useState<Record<string, string>>({});
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
        <Card className={activeMortality !== undefined ? "border-orange-300 bg-orange-50/50" : ""}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Percent className="h-4 w-4" />
              Mortalità mensile
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder={activeMortality !== undefined ? String(activeMortality) : "Auto"}
                value={mortalityInput}
                onChange={e => setMortalityInput(e.target.value)}
                className="h-8 w-20 text-sm"
              />
              <span className="text-sm text-muted-foreground">%</span>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleApplyMortality}
                disabled={!mortalityInput || isNaN(parseFloat(mortalityInput))}>
                Applica
              </Button>
              {activeMortality !== undefined && (
                <Button size="sm" variant="ghost" className="h-8 text-xs text-orange-600" onClick={handleResetMortality}>
                  Reset
                </Button>
              )}
            </div>
            {activeMortality !== undefined && (
              <p className="text-xs text-orange-600 mt-1 font-semibold">{activeMortality}% fissa su tutto il ciclo</p>
            )}
          </CardContent>
        </Card>
      </div>

      <ExcelTable
        data={data}
        mc={mc}
        showHatcheryForm={showHatcheryForm}
        setShowHatcheryForm={setShowHatcheryForm}
        toast={toast}
      />

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
