import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ArrowUpDown, ArrowUp, ArrowDown, Target, Scale, TrendingUp, Fish, Filter, FileSpreadsheet, X } from "lucide-react";
import ExcelJS from "exceljs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface BasketReport {
  basketId: number;
  physicalNumber: number;
  flupsyId: number;
  flupsyName: string;
  cycleId: number;
  cycleStart: string;
  lotId: number | null;
  lotSupplier: string | null;
  opDate: string;
  opType: string;
  animalCount: number;
  totalWeightKg: number;
  previousTotalWeightKg: number | null;
  previousOpDate: string | null;
  weightVariationKg: number | null;
  weightVariationPct: number | null;
  animalsPerKg: number;
  avgWeightMg: number;
  deviationFromTarget: number;
  deviationFromTargetPct: number;
  currentSizeCode: string | null;
  currentSizeColor: string | null;
  formulaVersion: number;
  atOrAboveTarget: boolean;
}

interface ReportData {
  baskets: BasketReport[];
  meta: {
    totalBaskets: number;
    targetApk: number;
    targetMinApk: number;
    targetMaxApk: number;
    avgTotalWeightKg: number;
    atOrAboveTarget: number;
  };
}

type SortKey = "flupsyName" | "physicalNumber" | "lotSupplier" | "opDate" | "currentSizeCode" |
  "animalCount" | "animalsPerKg" | "avgWeightMg" | "deviationFromTarget" | "totalWeightKg" |
  "previousTotalWeightKg" | "weightVariationPct" | "formulaVersion";
type SortDir = "asc" | "desc";

const fmtN = (n: number | null | undefined, dec = 0) =>
  n === null || n === undefined ? "—" : n.toLocaleString("it-IT", { minimumFractionDigits: dec, maximumFractionDigits: dec });

const targetDeviationStyle = (dev: number) => {
  if (dev <= 0) return { badge: "bg-green-100 border-green-300", text: "text-green-700 font-bold" };
  if (dev <= 10000) return { badge: "bg-yellow-50 border-yellow-300", text: "text-yellow-700 font-semibold" };
  if (dev <= 30000) return { badge: "bg-orange-50 border-orange-300", text: "text-orange-700" };
  return { badge: "bg-red-50 border-red-200", text: "text-red-700" };
};

const variationStyle = (pct: number | null) => {
  if (pct === null) return "text-gray-400";
  if (pct >= 20) return "bg-green-100 border-green-300 text-green-800 font-semibold";
  if (pct >= 5) return "bg-green-50 border-green-200 text-green-700";
  if (pct <= -20) return "bg-red-100 border-red-300 text-red-800 font-semibold";
  if (pct <= -5) return "bg-orange-50 border-orange-200 text-orange-700";
  return "bg-gray-50 border-gray-200 text-gray-700";
};

interface ColumnFilters {
  flupsy: string;
  cesta: string;
  lotto: string;
  data: string;
  taglia: string;
  animali: string;
  pzkg: string;
  pmed: string;
  dist: string;
  bio: string;
  pen: string;
  varPct: string;
  formula: string;
}

const emptyFilters: ColumnFilters = {
  flupsy: "", cesta: "", lotto: "", data: "", taglia: "", animali: "",
  pzkg: "", pmed: "", dist: "", bio: "", pen: "", varPct: "", formula: ""
};

// Helper per filtrare valori numerici con operatori (>10, <5, >=2, =3, oppure substring)
const matchNumericFilter = (value: number | null, filter: string): boolean => {
  if (!filter.trim()) return true;
  if (value === null || value === undefined) return false;
  const f = filter.trim();
  const opMatch = f.match(/^(>=|<=|>|<|=)\s*(-?[\d.,]+)$/);
  if (opMatch) {
    const op = opMatch[1];
    const num = parseFloat(opMatch[2].replace(/\./g, "").replace(",", "."));
    if (isNaN(num)) return true;
    switch (op) {
      case ">=": return value >= num;
      case "<=": return value <= num;
      case ">": return value > num;
      case "<": return value < num;
      case "=": return value === num;
    }
  }
  // Substring match sul valore formattato
  return fmtN(value, 1).includes(f) || String(value).includes(f);
};

const matchTextFilter = (value: string | null | undefined, filter: string): boolean => {
  if (!filter.trim()) return true;
  if (!value) return false;
  return value.toLowerCase().includes(filter.trim().toLowerCase());
};

export default function ReportPesoCeste() {
  const [selectedFlupsys, setSelectedFlupsys] = useState<number[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("animalsPerKg");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showOnlyAtTarget, setShowOnlyAtTarget] = useState(false);
  const [colFilters, setColFilters] = useState<ColumnFilters>(emptyFilters);

  const { data, isLoading, isError } = useQuery<ReportData>({
    queryKey: ["/api/report/peso-ceste"],
    queryFn: async () => {
      const res = await fetch("/api/report/peso-ceste");
      if (!res.ok) throw new Error("Errore caricamento dati");
      return res.json();
    },
  });

  const flupsyOptions = useMemo(() => {
    if (!data) return [];
    const map = new Map<number, string>();
    data.baskets.forEach(b => map.set(b.flupsyId, b.flupsyName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const toggleFlupsy = (id: number) => {
    setSelectedFlupsys(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      const numericAsc = key === "animalsPerKg";
      const stringDesc = false;
      setSortDir(numericAsc ? "asc" : (typeof key === "string" && ["flupsyName", "lotSupplier", "currentSizeCode"].includes(key) ? "asc" : "desc"));
    }
  };

  const filtered = useMemo(() => {
    if (!data) return [];
    let rows = data.baskets;
    if (selectedFlupsys.length > 0) rows = rows.filter(b => selectedFlupsys.includes(b.flupsyId));
    if (showOnlyAtTarget) rows = rows.filter(b => b.atOrAboveTarget);
    // Filtri per colonna
    rows = rows.filter(b =>
      matchTextFilter(b.flupsyName, colFilters.flupsy) &&
      matchTextFilter(String(b.physicalNumber), colFilters.cesta) &&
      matchTextFilter(b.lotSupplier, colFilters.lotto) &&
      matchTextFilter(b.opDate ? format(new Date(b.opDate), "dd/MM/yy", { locale: it }) : "", colFilters.data) &&
      matchTextFilter(b.currentSizeCode, colFilters.taglia) &&
      matchNumericFilter(b.animalCount, colFilters.animali) &&
      matchNumericFilter(b.animalsPerKg, colFilters.pzkg) &&
      matchNumericFilter(b.avgWeightMg, colFilters.pmed) &&
      matchNumericFilter(b.deviationFromTarget, colFilters.dist) &&
      matchNumericFilter(b.totalWeightKg, colFilters.bio) &&
      matchNumericFilter(b.previousTotalWeightKg, colFilters.pen) &&
      matchNumericFilter(b.weightVariationPct, colFilters.varPct) &&
      matchTextFilter(`v${b.formulaVersion}`, colFilters.formula)
    );
    return [...rows].sort((a, b) => {
      const av = a[sortKey] as any;
      const bv = b[sortKey] as any;
      if (av === null && bv === null) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [data, selectedFlupsys, showOnlyAtTarget, sortKey, sortDir, colFilters]);

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="h-2.5 w-2.5 ml-0.5 opacity-40 inline" />;
    return sortDir === "desc"
      ? <ArrowDown className="h-2.5 w-2.5 ml-0.5 text-blue-600 inline" />
      : <ArrowUp className="h-2.5 w-2.5 ml-0.5 text-blue-600 inline" />;
  };

  const atTargetCount = filtered.filter(b => b.atOrAboveTarget).length;
  const closeCount = filtered.filter(b => !b.atOrAboveTarget && b.deviationFromTarget <= 10000).length;

  // Totali per la riga di sintesi
  const totals = useMemo(() => {
    const bioSum = filtered.reduce((s, b) => s + (b.totalWeightKg || 0), 0);
    const penSum = filtered.reduce((s, b) => s + (b.previousTotalWeightKg || 0), 0);
    const animalsSum = filtered.reduce((s, b) => s + (b.animalCount || 0), 0);
    const validVar = filtered.filter(b => b.weightVariationPct !== null);
    const avgVar = validVar.length > 0 ? validVar.reduce((s, b) => s + (b.weightVariationPct || 0), 0) / validVar.length : null;
    return {
      count: filtered.length,
      animalsSum,
      bioSum: Math.round(bioSum * 10) / 10,
      penSum: Math.round(penSum * 10) / 10,
      bioDelta: Math.round((bioSum - penSum) * 10) / 10,
      avgVar: avgVar !== null ? Math.round(avgVar * 10) / 10 : null,
    };
  }, [filtered]);

  const clearFilters = () => setColFilters(emptyFilters);
  const hasColFilters = Object.values(colFilters).some(v => v.trim() !== "");

  // ============ EXPORT EXCEL ============
  const exportExcel = async () => {
    if (!data) return;
    const wb = new ExcelJS.Workbook();
    wb.creator = "FLUPSY Management System";
    wb.created = new Date();
    const ws = wb.addWorksheet("Report Peso Ceste");

    // Titolo
    ws.mergeCells("A1:M1");
    const titleCell = ws.getCell("A1");
    titleCell.value = `Report Peso Ceste — Target TP-3000: ${fmtN(data.meta.targetMinApk)}–${fmtN(data.meta.targetMaxApk)} pz/kg`;
    titleCell.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(1).height = 24;

    // Sottotitolo con data export
    ws.mergeCells("A2:M2");
    const subCell = ws.getCell("A2");
    subCell.value = `Esportato il ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: it })} — ${filtered.length} ceste`;
    subCell.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FF555555" } };
    subCell.alignment = { horizontal: "center" };

    // Riga vuota
    ws.addRow([]);

    // Header colonne
    const headers = [
      "FLUPSY", "Cesta", "Lotto", "Ultima op.", "Taglia", "Animali (n.)",
      "pz/kg", "Peso medio (mg)", "Distanza TP-3000 (pz/kg)", "Biomassa (kg)",
      "Peso penultimo (kg)", "Variazione %", "Formula"
    ];
    const headerRow = ws.addRow(headers);
    headerRow.eachCell(cell => {
      cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E40AF" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      };
    });
    headerRow.height = 32;

    // Dati — col 1=FLUPSY 2=Cesta 3=Lotto 4=Data 5=Taglia 6=Animali
    // 7=pz/kg 8=PesoMedio 9=Distanza 10=Biomassa 11=PesoPen 12=Variaz 13=Form
    filtered.forEach((b, idx) => {
      const row = ws.addRow([
        b.flupsyName,
        `#${b.physicalNumber}`,
        b.lotSupplier || "",
        b.opDate ? format(new Date(b.opDate), "dd/MM/yy", { locale: it }) : "",
        b.currentSizeCode || "",
        b.animalCount,
        b.animalsPerKg,
        b.avgWeightMg,
        b.deviationFromTarget,
        b.totalWeightKg,
        b.previousTotalWeightKg,
        b.weightVariationPct,
        `v${b.formulaVersion}`,
      ]);
      const altFill = idx % 2 === 0 ? "FFFFFFFF" : "FFF3F4F6";
      row.eachCell((cell, colNum) => {
        cell.font = { name: "Calibri", size: 10 };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: altFill } };
        cell.border = {
          top: { style: "hair", color: { argb: "FFDDDDDD" } },
          bottom: { style: "hair", color: { argb: "FFDDDDDD" } },
          left: { style: "hair", color: { argb: "FFDDDDDD" } },
          right: { style: "hair", color: { argb: "FFDDDDDD" } },
        };
        if (colNum === 6 || colNum === 7 || colNum === 9) {
          cell.alignment = { horizontal: "right" };
          cell.numFmt = "#,##0";
        } else if ([8, 10, 11].includes(colNum)) {
          cell.alignment = { horizontal: "right" };
          cell.numFmt = "#,##0.0";
        } else if (colNum === 12) {
          cell.alignment = { horizontal: "center" };
          cell.numFmt = "+0.0%;-0.0%;0.0%";
          if (typeof cell.value === "number") {
            (cell as any).value = (cell.value as number) / 100;
          }
        } else {
          cell.alignment = { horizontal: colNum === 1 || colNum === 3 ? "left" : "center" };
        }
      });
      // Colore taglia (col 5)
      if (b.currentSizeColor) {
        row.getCell(5).fill = {
          type: "pattern", pattern: "solid",
          fgColor: { argb: "FF" + b.currentSizeColor.replace("#", "") + "" }
        };
      }
      // Colore distanza target (col 9)
      if (b.atOrAboveTarget) {
        row.getCell(9).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
        row.getCell(9).font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF065F46" } };
      } else if (b.deviationFromTarget <= 10000) {
        row.getCell(9).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
      } else if (b.deviationFromTarget <= 30000) {
        row.getCell(9).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFED7AA" } };
      } else {
        row.getCell(9).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
      }
      // Colore variazione (col 12)
      if (b.weightVariationPct !== null) {
        const v = b.weightVariationPct;
        if (v >= 20) row.getCell(12).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
        else if (v >= 5) row.getCell(12).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFECFDF5" } };
        else if (v <= -20) row.getCell(12).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
        else if (v <= -5) row.getCell(12).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFEDD5" } };
      }
    });

    // Riga totali
    const totalsRow = ws.addRow([
      "TOTALI", `${totals.count} ceste`, "", "", "",
      totals.animalsSum, "", "", "", totals.bioSum, totals.penSum,
      totals.avgVar !== null ? totals.avgVar / 100 : null, ""
    ]);
    totalsRow.eachCell((cell, colNum) => {
      cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF374151" } };
      cell.alignment = { horizontal: colNum === 1 ? "left" : (colNum === 12 ? "center" : "right") };
      cell.border = { top: { style: "medium", color: { argb: "FF000000" } } };
      if (colNum === 6) cell.numFmt = "#,##0";
      if (colNum === 10 || colNum === 11) cell.numFmt = "#,##0.0";
      if (colNum === 12) cell.numFmt = "+0.0%;-0.0%;0.0%";
    });

    // Larghezze colonne
    ws.columns = [
      { width: 22 }, { width: 7 }, { width: 18 }, { width: 11 }, { width: 9 },
      { width: 13 }, { width: 10 }, { width: 12 }, { width: 14 }, { width: 11 },
      { width: 13 }, { width: 12 }, { width: 8 },
    ];

    // Freeze panes (riga header sempre visibile)
    ws.views = [{ state: "frozen", ySplit: 4 }];

    // AutoFilter sulla zona dati
    ws.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4 + filtered.length, column: 13 },
    };

    // Download
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-peso-ceste-${format(new Date(), "yyyyMMdd-HHmm")}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-3 px-2 space-y-3 max-w-full">
      {/* Intestazione */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Report Peso Ceste</h1>
          <p className="text-muted-foreground text-xs">Selezione ceste da vagliare — priorità per taglia TP-3000</p>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <Badge variant="outline" className="flex items-center gap-1 text-xs px-2.5 py-1 border-green-300 bg-green-50 text-green-800">
              <Target className="h-3.5 w-3.5" />
              Target TP-3000: {fmtN(data.meta.targetMinApk)}–{fmtN(data.meta.targetMaxApk)} pz/kg
            </Badge>
          )}
          <Button
            size="sm"
            onClick={exportExcel}
            disabled={!data || filtered.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8"
            data-testid="button-export-excel"
          >
            <FileSpreadsheet className="h-4 w-4 mr-1.5" />Esporta Excel
          </Button>
        </div>
      </div>

      {/* Cards riepilogo + legenda compatta */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16" />)}</div>
      ) : data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Card className="py-1">
            <CardContent className="px-3 py-1.5">
              <div className="text-[10px] text-muted-foreground font-medium uppercase">Ceste analizzate</div>
              <div className="text-xl font-bold leading-tight">{filtered.length}</div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50 py-1">
            <CardContent className="px-3 py-1.5">
              <div className="text-[10px] text-green-700 font-medium uppercase flex items-center gap-1"><TrendingUp className="h-2.5 w-2.5"/>In range / sopra TP-3000</div>
              <div className="text-xl font-bold text-green-700 leading-tight">{atTargetCount}</div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50/50 py-1">
            <CardContent className="px-3 py-1.5">
              <div className="text-[10px] text-yellow-700 font-medium uppercase flex items-center gap-1"><Fish className="h-2.5 w-2.5"/>Vicine al target</div>
              <div className="text-xl font-bold text-yellow-700 leading-tight">{closeCount}</div>
            </CardContent>
          </Card>
          <Card className="py-1">
            <CardContent className="px-3 py-1.5">
              <div className="text-[10px] text-muted-foreground font-medium uppercase flex items-center gap-1"><Scale className="h-2.5 w-2.5"/>Biomassa totale visibile</div>
              <div className="text-xl font-bold leading-tight">{fmtN(totals.bioSum, 1)} kg</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtri FLUPSY + clear */}
      <Card>
        <CardContent className="py-2 px-3">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1 font-medium text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />FLUPSY:
            </div>
            {flupsyOptions.map(f => (
              <div key={f.id} className="flex items-center gap-1">
                <Checkbox id={`f-${f.id}`} checked={selectedFlupsys.includes(f.id)} onCheckedChange={() => toggleFlupsy(f.id)} className="h-3.5 w-3.5" />
                <Label htmlFor={`f-${f.id}`} className="text-xs cursor-pointer">{f.name}</Label>
              </div>
            ))}
            {selectedFlupsys.length > 0 && <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setSelectedFlupsys([])}>Tutti</Button>}
            <div className="flex items-center gap-1 ml-2">
              <Checkbox id="at-target" checked={showOnlyAtTarget} onCheckedChange={(v) => setShowOnlyAtTarget(!!v)} className="h-3.5 w-3.5" />
              <Label htmlFor="at-target" className="text-xs cursor-pointer text-green-700 font-medium">Solo ≥ TP-3000</Label>
            </div>
            {hasColFilters && (
              <Button variant="ghost" size="sm" className="h-6 text-xs ml-auto text-blue-600" onClick={clearFilters}>
                <X className="h-3 w-3 mr-1" />Pulisci filtri colonne
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabella stile Excel */}
      {isLoading ? (
        <div className="space-y-1">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-7 w-full" />)}</div>
      ) : isError ? (
        <div className="text-center text-destructive py-8">Errore nel caricamento dei dati</div>
      ) : (
        <div className="rounded border border-gray-300 overflow-hidden">
          <table className="w-full text-[11px] table-fixed border-collapse" data-testid="table-report">
            <colgroup>
              <col style={{ width: "10%" }} />
              <col style={{ width: "4%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "6%" }} />
              <col style={{ width: "6%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "6%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "4%" }} />
            </colgroup>
            <thead>
              <tr className="bg-blue-700 text-white text-[12px] leading-tight">
                <th className="px-2 py-2.5 text-left font-bold cursor-pointer hover:bg-blue-800 select-none border-r border-blue-500 whitespace-nowrap" onClick={() => handleSort("flupsyName")}>FLUPSY<SortIcon k="flupsyName" /></th>
                <th className="px-1 py-2.5 text-center font-bold cursor-pointer hover:bg-blue-800 select-none border-r border-blue-500 whitespace-nowrap" onClick={() => handleSort("physicalNumber")}>Cesta<SortIcon k="physicalNumber" /></th>
                <th className="px-2 py-2.5 text-left font-bold cursor-pointer hover:bg-blue-800 select-none border-r border-blue-500 whitespace-nowrap" onClick={() => handleSort("lotSupplier")}>Lotto<SortIcon k="lotSupplier" /></th>
                <th className="px-1 py-2.5 text-center font-bold cursor-pointer hover:bg-blue-800 select-none border-r border-blue-500 whitespace-nowrap" onClick={() => handleSort("opDate")}>Data<SortIcon k="opDate" /></th>
                <th className="px-1 py-2.5 text-center font-bold cursor-pointer hover:bg-blue-800 select-none border-r border-blue-500 whitespace-nowrap" onClick={() => handleSort("currentSizeCode")}>Taglia<SortIcon k="currentSizeCode" /></th>
                <th className="px-1 py-2.5 text-right font-bold cursor-pointer hover:bg-blue-800 select-none border-r border-blue-500" onClick={() => handleSort("animalCount")}>
                  <div>Animali</div><div className="text-[10px] font-normal opacity-90">(n.)<SortIcon k="animalCount" /></div>
                </th>
                <th className="px-1 py-2.5 text-right font-bold cursor-pointer hover:bg-blue-800 select-none border-r border-blue-500 whitespace-nowrap" onClick={() => handleSort("animalsPerKg")}>pz/kg<SortIcon k="animalsPerKg" /></th>
                <th className="px-1 py-2.5 text-right font-bold cursor-pointer hover:bg-blue-800 select-none border-r border-blue-500" onClick={() => handleSort("avgWeightMg")}>
                  <div>Peso medio</div><div className="text-[10px] font-normal opacity-90">(mg)<SortIcon k="avgWeightMg" /></div>
                </th>
                <th className="px-1 py-2.5 text-center font-bold cursor-pointer hover:bg-blue-800 select-none border-r border-blue-500" onClick={() => handleSort("deviationFromTarget")}>
                  <div>Distanza</div><div className="text-[10px] font-normal opacity-90">TP-3000<SortIcon k="deviationFromTarget" /></div>
                </th>
                <th className="px-1 py-2.5 text-right font-bold cursor-pointer hover:bg-blue-800 select-none border-r border-blue-500" onClick={() => handleSort("totalWeightKg")}>
                  <div>Biomassa</div><div className="text-[10px] font-normal opacity-90">(kg)<SortIcon k="totalWeightKg" /></div>
                </th>
                <th className="px-1 py-2.5 text-right font-bold cursor-pointer hover:bg-blue-800 select-none border-r border-blue-500" onClick={() => handleSort("previousTotalWeightKg")}>
                  <div>Peso pen.</div><div className="text-[10px] font-normal opacity-90">(kg)<SortIcon k="previousTotalWeightKg" /></div>
                </th>
                <th className="px-1 py-2.5 text-center font-bold cursor-pointer hover:bg-blue-800 select-none border-r border-blue-500 whitespace-nowrap" onClick={() => handleSort("weightVariationPct")}>Variazione %<SortIcon k="weightVariationPct" /></th>
                <th className="px-1 py-2.5 text-center font-bold cursor-pointer hover:bg-blue-800 select-none whitespace-nowrap" onClick={() => handleSort("formulaVersion")}>Form.<SortIcon k="formulaVersion" /></th>
              </tr>
              {/* Riga filtri per colonna */}
              <tr className="bg-blue-50 border-b border-blue-200">
                <th className="px-1 py-1"><Input value={colFilters.flupsy} onChange={(e) => setColFilters(f => ({ ...f, flupsy: e.target.value }))} placeholder="filtra" className="h-6 text-[10px] px-1.5 py-0" /></th>
                <th className="px-1 py-1"><Input value={colFilters.cesta} onChange={(e) => setColFilters(f => ({ ...f, cesta: e.target.value }))} placeholder="#" className="h-6 text-[10px] px-1.5 py-0" /></th>
                <th className="px-1 py-1"><Input value={colFilters.lotto} onChange={(e) => setColFilters(f => ({ ...f, lotto: e.target.value }))} placeholder="filtra" className="h-6 text-[10px] px-1.5 py-0" /></th>
                <th className="px-1 py-1"><Input value={colFilters.data} onChange={(e) => setColFilters(f => ({ ...f, data: e.target.value }))} placeholder="dd/mm" className="h-6 text-[10px] px-1.5 py-0" /></th>
                <th className="px-1 py-1"><Input value={colFilters.taglia} onChange={(e) => setColFilters(f => ({ ...f, taglia: e.target.value }))} placeholder="TP-" className="h-6 text-[10px] px-1.5 py-0" /></th>
                <th className="px-1 py-1"><Input value={colFilters.animali} onChange={(e) => setColFilters(f => ({ ...f, animali: e.target.value }))} placeholder=">100000" className="h-6 text-[10px] px-1.5 py-0" /></th>
                <th className="px-1 py-1"><Input value={colFilters.pzkg} onChange={(e) => setColFilters(f => ({ ...f, pzkg: e.target.value }))} placeholder=">15000" className="h-6 text-[10px] px-1.5 py-0" /></th>
                <th className="px-1 py-1"><Input value={colFilters.pmed} onChange={(e) => setColFilters(f => ({ ...f, pmed: e.target.value }))} placeholder=">50" className="h-6 text-[10px] px-1.5 py-0" /></th>
                <th className="px-1 py-1"><Input value={colFilters.dist} onChange={(e) => setColFilters(f => ({ ...f, dist: e.target.value }))} placeholder="<10000" className="h-6 text-[10px] px-1.5 py-0" /></th>
                <th className="px-1 py-1"><Input value={colFilters.bio} onChange={(e) => setColFilters(f => ({ ...f, bio: e.target.value }))} placeholder=">10" className="h-6 text-[10px] px-1.5 py-0" /></th>
                <th className="px-1 py-1"><Input value={colFilters.pen} onChange={(e) => setColFilters(f => ({ ...f, pen: e.target.value }))} placeholder=">5" className="h-6 text-[10px] px-1.5 py-0" /></th>
                <th className="px-1 py-1"><Input value={colFilters.varPct} onChange={(e) => setColFilters(f => ({ ...f, varPct: e.target.value }))} placeholder=">10" className="h-6 text-[10px] px-1.5 py-0" /></th>
                <th className="px-1 py-1"><Input value={colFilters.formula} onChange={(e) => setColFilters(f => ({ ...f, formula: e.target.value }))} placeholder="v2" className="h-6 text-[10px] px-1.5 py-0" /></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={13} className="text-center py-8 text-muted-foreground">Nessuna cesta trovata</td></tr>
              ) : filtered.map((b, i) => {
                const tStyle = targetDeviationStyle(b.deviationFromTarget);
                const vCls = variationStyle(b.weightVariationPct);
                return (
                  <tr key={b.basketId} className={`border-b border-gray-200 hover:bg-blue-50/50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`} data-testid={`row-basket-${b.basketId}`}>
                    <td className="px-1.5 py-1 truncate text-[10px] text-gray-600" title={b.flupsyName}>{b.flupsyName}</td>
                    <td className="px-1 py-1 text-center font-semibold">#{b.physicalNumber}</td>
                    <td className="px-1.5 py-1 truncate text-[10px] text-gray-600" title={b.lotSupplier || ""}>{b.lotSupplier || "—"}</td>
                    <td className="px-1 py-1 text-center text-[10px] text-gray-600 whitespace-nowrap">
                      {b.opDate ? format(new Date(b.opDate), "dd/MM/yy", { locale: it }) : "—"}
                    </td>
                    <td className="px-1 py-1 text-center">
                      {b.currentSizeCode ? (
                        <span
                          className="inline-block px-1.5 py-0 rounded text-[10px] font-mono font-semibold border"
                          style={{
                            borderColor: b.currentSizeColor || undefined,
                            backgroundColor: b.currentSizeColor ? b.currentSizeColor + '40' : undefined
                          }}
                        >
                          {b.currentSizeCode}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-1 py-1 text-right font-mono tabular-nums" title={`${b.animalCount.toLocaleString("it-IT")} animali`}>{fmtN(b.animalCount)}</td>
                    <td className="px-1 py-1 text-right font-mono font-semibold tabular-nums">{fmtN(b.animalsPerKg)}</td>
                    <td className="px-1 py-1 text-right font-mono tabular-nums">{fmtN(b.avgWeightMg, 1)}</td>
                    <td className="px-1 py-1 text-center">
                      <span className={`inline-block px-1.5 py-0 rounded border text-[10px] ${tStyle.badge} ${tStyle.text}`}>
                        {b.atOrAboveTarget ? "✓ in range" : `+${fmtN(b.deviationFromTarget)}`}
                      </span>
                    </td>
                    <td className="px-1 py-1 text-right font-mono tabular-nums">{fmtN(b.totalWeightKg, 1)}</td>
                    <td className="px-1 py-1 text-right font-mono tabular-nums text-gray-600">
                      {b.previousTotalWeightKg !== null ? fmtN(b.previousTotalWeightKg, 1) : "—"}
                    </td>
                    <td className="px-1 py-1 text-center">
                      {b.weightVariationPct !== null ? (
                        <span className={`inline-block px-1.5 py-0 rounded border text-[10px] tabular-nums ${vCls}`}>
                          {b.weightVariationPct > 0 ? "+" : ""}{fmtN(b.weightVariationPct, 1)}% ({b.weightVariationKg && b.weightVariationKg > 0 ? "+" : ""}{fmtN(b.weightVariationKg, 1)}kg)
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-1 py-1 text-center">
                      <span className={`inline-block px-1 py-0 rounded text-[9px] font-semibold border ${b.formulaVersion === 2 ? "bg-green-50 text-green-700 border-green-300" : "bg-amber-50 text-amber-700 border-amber-300"}`}>
                        v{b.formulaVersion}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-gray-700 text-white font-semibold">
                  <td className="px-1.5 py-1.5 text-left">TOTALI</td>
                  <td className="px-1 py-1.5 text-center">{totals.count}</td>
                  <td className="px-1.5 py-1.5"></td>
                  <td className="px-1 py-1.5"></td>
                  <td className="px-1 py-1.5"></td>
                  <td className="px-1 py-1.5 text-right tabular-nums">{fmtN(totals.animalsSum)}</td>
                  <td className="px-1 py-1.5"></td>
                  <td className="px-1 py-1.5"></td>
                  <td className="px-1 py-1.5"></td>
                  <td className="px-1 py-1.5 text-right tabular-nums">{fmtN(totals.bioSum, 1)}</td>
                  <td className="px-1 py-1.5 text-right tabular-nums">{fmtN(totals.penSum, 1)}</td>
                  <td className="px-1 py-1.5 text-center tabular-nums">
                    {totals.avgVar !== null ? `${totals.avgVar > 0 ? "+" : ""}${fmtN(totals.avgVar, 1)}% media` : "—"}
                  </td>
                  <td className="px-1 py-1.5"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* Legenda compatta */}
      <div className="text-[10px] text-muted-foreground pb-3 space-y-0.5 border-t pt-2">
        <p>
          <strong>Filtri colonna</strong>: per i numeri usa operatori <code className="bg-gray-100 px-1">&gt;100</code>, <code className="bg-gray-100 px-1">&lt;50</code>, <code className="bg-gray-100 px-1">&gt;=10</code>, <code className="bg-gray-100 px-1">=15</code> oppure scrivi un numero per substring match. Per il testo, ricerca substring case-insensitive.
        </p>
        <p>
          <strong>Δ TP-3000</strong>: pz/kg ancora da ridurre per arrivare a TP-3000 (≤ {data ? fmtN(data.meta.targetMaxApk) : "29.000"} pz/kg). 🟢 In range / 🟡 ≤10k / 🟠 ≤30k / 🔴 &gt;30k.
        </p>
        <p>
          <strong>Variazione %</strong>: confronto tra biomassa attuale (Bio) e penultima (Pen.). Verde = crescita; rosso/arancio = calo (mortalità o vagliatura).
        </p>
        <p>
          <strong>Esporta Excel</strong>: scarica un foglio .xlsx con intestazioni colorate, righe alternate, colori sulle colonne stato e riga totali.
        </p>
      </div>
    </div>
  );
}
