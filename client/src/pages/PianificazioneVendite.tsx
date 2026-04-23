import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Banknote, TrendingUp, Scale, AlertTriangle, CheckCircle2, Loader2, Calculator, HelpCircle, ChevronDown, ChevronUp, Info, Download } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Bar, ComposedChart } from "recharts";
import { usePlanningLang, MONTHS_EN } from "@/lib/planningI18n";

const SALE_SIZES = [
  'TP-10000', 'TP-9000', 'TP-8000', 'TP-7000', 'TP-6000', 'TP-5500',
  'TP-5000', 'TP-4500', 'TP-4000', 'TP-3500', 'TP-3000', 'TP-2800',
  'TP-2500', 'TP-2000', 'TP-1900', 'TP-1800', 'TP-1500', 'TP-1260',
  'TP-1140', 'TP-1000', 'TP-800', 'TP-700', 'TP-600', 'TP-500',
  'TP-450', 'TP-350', 'TP-300', 'TP-250', 'TP-180'
];

const MONTHS_IT = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

type Mode = 'cassa' | 'ricavo' | 'bilanciato';
type Engine = 'greedy' | 'lp';

interface PriceListEntry { id: number; sizeCode: string; pricePerAnimal: number; notes: string | null; }
interface CashTarget { id: number; year: number; month: number; minRevenue: number; }

interface InputData {
  generatedAt: string;
  year: number;
  inventory: {
    totalBaskets: number;
    totalAnimals: number;
    bySize: Record<string, { count: number; animals: number }>;
    baskets: Array<{ basketId: number; animalCount: number; animalsPerKg: number; sizeCode: string; weightGrams: number }>;
  };
  hatchery: Array<{ year: number; month: number; monthName: string; quantity: number; actualQuantity: number | null; notes: string | null }>;
  sgr: { sgrSizes: string[]; sgrTable: Array<Record<string, string | number>> };
  mortality: Record<string, Record<string, number>>;
  priceList: PriceListEntry[];
  cashTargets: CashTarget[];
  orders: Array<{ monthNum: number; month: string; size: string; animals: number }>;
}

interface PlanResult {
  mode: Mode;
  year: number;
  startMonth: number;
  monthsHorizon: number;
  totalRevenue: number;
  totalKgSold: number;
  totalAnimalsSold: number;
  totalAnimalsRemaining: number;
  monthsBelowCashTarget: number;
  totalShortfall: number;
  monthlyPlan: Array<{
    month: number; year: number; monthShort: string; monthLabel: string; monthName: string;
    sales: Array<{ basketId: number; isHatchery: boolean; sizeCode: string; animalCount: number; weightKg: number; revenue: number; reason: 'ordine' | 'cassa' | 'liquidazione' }>;
    totalKg: number; totalRevenue: number; cashTarget: number; cashGap: number;
    ordersBySize: Record<string, number>;
    ordersFulfilledBySize: Record<string, number>;
    orderShortfallBySize: Record<string, number>;
    remainingAnimals: number;
  }>;
}

const fmtEur = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const fmtKg = (n: number) => new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 }).format(n) + ' kg';
const fmtNum = (n: number) => new Intl.NumberFormat('it-IT').format(Math.round(n));

function ThWithTip({ children, tip, className }: { children: React.ReactNode; tip: string; className?: string }) {
  return (
    <TableHead className={className}>
      <TooltipProvider>
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <span className="cursor-help border-b border-dashed border-muted-foreground/50 inline-block">
              {children}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs whitespace-pre-line leading-relaxed">
            {tip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </TableHead>
  );
}

function LabelWithHelp({ children, tip }: { children: React.ReactNode; tip: string }) {
  return (
    <div className="flex items-center gap-1">
      <Label>{children}</Label>
      <TooltipProvider>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <button type="button" className="inline-flex">
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs whitespace-pre-line">
            {tip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

function SizeBreakdownCell({ value, bySize, colorClass, label }: {
  value: number;
  bySize: Record<string, number> | undefined;
  colorClass: string;
  label: string;
}) {
  const hasSizes = bySize && Object.keys(bySize).length > 0;
  const cell = (
    <span className={hasSizes ? "cursor-help underline decoration-dotted underline-offset-2" : undefined}>
      {fmtNum(value)}
    </span>
  );
  if (!hasSizes) return <TableCell className={`text-right font-mono ${colorClass}`}>{cell}</TableCell>;
  return (
    <TableCell className={`text-right font-mono ${colorClass}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{cell}</TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs p-0">
            <div className="p-3">
              <div className="font-semibold text-xs mb-2 text-muted-foreground uppercase tracking-wide">{label}</div>
              <table className="text-xs w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-0.5 pr-3 font-medium">Taglia</th>
                    <th className="text-right py-0.5 font-medium">Animali</th>
                    <th className="text-right py-0.5 pl-3 font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(bySize)
                    .sort(([, a], [, b]) => b - a)
                    .map(([sz, cnt]) => (
                      <tr key={sz} className="border-b border-border/40">
                        <td className={`py-0.5 pr-3 font-mono font-medium ${colorClass}`}>{sz}</td>
                        <td className="py-0.5 text-right font-mono">{fmtNum(cnt)}</td>
                        <td className="py-0.5 pl-3 text-right text-muted-foreground">{value > 0 ? `${((cnt / value) * 100).toFixed(1)}%` : '—'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </TableCell>
  );
}

export default function PianificazioneVendite() {
  const { toast } = useToast();
  const { lang, setLang, t } = usePlanningLang();
  const MONTHS = lang === "en" ? MONTHS_EN : MONTHS_IT;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = useState(currentYear);
  const [startMonth, setStartMonth] = useState(currentMonth);
  const [monthsHorizon, setMonthsHorizon] = useState(12);
  const [customHorizonStr, setCustomHorizonStr] = useState('');
  const [isCustomHorizon, setIsCustomHorizon] = useState(false);
  const [mode, setMode] = useState<Mode>('bilanciato');
  const [engine, setEngine] = useState<Engine>('greedy');
  const [guideOpen, setGuideOpen] = useState(false);

  const PRESET_HORIZONS = [6, 12, 18, 24, 36];
  const horizonSelectValue = isCustomHorizon ? 'custom' : String(monthsHorizon);

  // === Dati di Input ===
  const { data: inputData, isLoading: inputLoading, refetch: refetchInputData } = useQuery<InputData>({
    queryKey: ['/api/pianificazione-vendite/input-data', year],
    queryFn: async () => {
      const r = await fetch(`/api/pianificazione-vendite/input-data?year=${year}`);
      return r.json();
    },
    staleTime: 60_000,
  });

  // === Listino Prezzi ===
  const { data: priceList = [], isLoading: priceLoading } = useQuery<PriceListEntry[]>({
    queryKey: ['/api/pianificazione-vendite/price-list'],
  });
  const priceMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of priceList) m[p.sizeCode] = p.pricePerAnimal;
    return m;
  }, [priceList]);
  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({});

  const savePriceMutation = useMutation({
    mutationFn: async (vars: { sizeCode: string; pricePerAnimal: number }) =>
      apiRequest({ url: '/api/pianificazione-vendite/price-list', method: 'PUT', body: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pianificazione-vendite/price-list'] });
    },
  });

  // === Budget Cassa ===
  const { data: cashTargets = [] } = useQuery<CashTarget[]>({
    queryKey: ['/api/pianificazione-vendite/cash-targets', year],
    queryFn: async () => {
      const r = await fetch(`/api/pianificazione-vendite/cash-targets?year=${year}`);
      return r.json();
    },
  });
  const cashMap = useMemo(() => {
    const m: Record<number, number> = {};
    for (const c of cashTargets) m[c.month] = c.minRevenue;
    return m;
  }, [cashTargets]);
  const [cashEdits, setCashEdits] = useState<Record<number, string>>({});

  const saveCashMutation = useMutation({
    mutationFn: async (vars: { year: number; month: number; minRevenue: number }) =>
      apiRequest({ url: '/api/pianificazione-vendite/cash-targets', method: 'PUT', body: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pianificazione-vendite/cash-targets', year] });
    },
  });

  // === Piano calcolato ===
  const { data: plan, isLoading: planLoading, refetch: refetchPlan, isFetching } = useQuery<PlanResult & { engine?: Engine; solverStatus?: { feasible: boolean; bounded: boolean; objective?: number } }>({
    queryKey: ['/api/pianificazione-vendite', year, startMonth, monthsHorizon, mode, engine],
    queryFn: async () => {
      const r = await fetch(`/api/pianificazione-vendite?year=${year}&startMonth=${startMonth}&monthsHorizon=${monthsHorizon}&mode=${mode}&engine=${engine}`);
      return r.json();
    },
    enabled: false,
  });

  const handleSavePrice = (sizeCode: string) => {
    const v = priceEdits[sizeCode];
    if (v === undefined) return;
    const num = parseFloat(v.replace(',', '.'));
    if (isNaN(num) || num < 0) {
      toast({ title: 'Prezzo non valido', variant: 'destructive' });
      return;
    }
    savePriceMutation.mutate({ sizeCode, pricePerAnimal: num });
    setPriceEdits(prev => { const n = { ...prev }; delete n[sizeCode]; return n; });
  };

  const handleSaveCash = (month: number) => {
    const v = cashEdits[month];
    if (v === undefined) return;
    const num = parseFloat(v.replace(',', '.'));
    if (isNaN(num) || num < 0) {
      toast({ title: 'Importo non valido', variant: 'destructive' });
      return;
    }
    saveCashMutation.mutate({ year, month, minRevenue: num });
    setCashEdits(prev => { const n = { ...prev }; delete n[month]; return n; });
  };

  const chartData = useMemo(() => {
    if (!plan) return [];
    return plan.monthlyPlan.map(m => ({
      mese: m.monthLabel,
      ricavo: Math.round(m.totalRevenue),
      target: Math.round(m.cashTarget),
      animali: m.sales.reduce((a: number, s: any) => a + s.animalCount, 0),
      animaliOrdini: m.sales.filter((s: any) => s.reason === 'ordine').reduce((a: number, s: any) => a + s.animalCount, 0),
      animaliCassa: m.sales.filter((s: any) => s.reason === 'cassa' || s.reason === 'liquidazione').reduce((a: number, s: any) => a + s.animalCount, 0),
      ordiniTotali: Object.values(m.ordersBySize).reduce((a: number, v: number) => a + v, 0),
      ordiniBySize: Object.fromEntries(Object.entries(m.ordersBySize).filter(([, v]) => (v as number) > 0)) as Record<string, number>,
      ordiniConsegnatiBySize: m.sales.filter((s: any) => s.reason === 'ordine').reduce((acc: Record<string, number>, s: any) => { acc[s.sizeCode] = (acc[s.sizeCode] || 0) + s.animalCount; return acc; }, {} as Record<string, number>),
      vendibili: m.totalSellableAtStart ?? 0,
      sellableBySize: (m as any).sellableBySize as Record<string, number> | undefined,
    }));
  }, [plan]);

  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    if (!plan) return;
    setIsExporting(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = "FLUPSY Management";
      wb.created = new Date();

      const headerFill = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF1E3A5F" } };
      const headerFont = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
      const thinBorder = {
        top: { style: "thin" as const, color: { argb: "FFD0D0D0" } },
        bottom: { style: "thin" as const, color: { argb: "FFD0D0D0" } },
        left: { style: "thin" as const, color: { argb: "FFD0D0D0" } },
        right: { style: "thin" as const, color: { argb: "FFD0D0D0" } },
      };
      const white = "FFFFFFFF";
      const lightGray = "FFF7F7F7";
      const modeLabel = plan.mode === 'cassa' ? t("pv_mode_label_cassa") : plan.mode === 'ricavo' ? t("pv_mode_label_ricavo") : t("pv_mode_label_bilanciato");
      const engineLabel = plan.engine === 'lp' ? t("pv_engine_label_lp") : t("pv_engine_label_greedy");
      const startMonthName = MONTHS[(plan.startMonth - 1) % 12];

      // ── FOGLIO 1: Piano mensile ──────────────────────────────────────────
      const ws1 = wb.addWorksheet(t("pv_excel_sheet1"), { views: [{ state: 'frozen', xSplit: 0, ySplit: 3 }] });

      const t1 = ws1.addRow([t("pv_title")]);
      t1.font = { bold: true, size: 14, color: { argb: "FF1E3A5F" } };
      ws1.mergeCells(1, 1, 1, 7);
      t1.alignment = { horizontal: "center", vertical: "middle" };
      t1.height = 30;

      const p1 = ws1.addRow([`${t("pv_excel_param_row_pre")} ${plan.year}  |  ${t("pv_excel_param_inizio")} ${startMonthName}  |  ${t("pv_excel_param_orizzonte")} ${plan.monthsHorizon} ${t("months_label")}  |  ${t("pv_excel_param_modalita")} ${modeLabel}  |  ${t("pv_excel_param_motore")} ${engineLabel}`]);
      p1.font = { italic: true, size: 10, color: { argb: "FF555555" } };
      ws1.mergeCells(2, 1, 2, 7);
      p1.alignment = { horizontal: "center" };
      p1.height = 18;

      const h1 = ws1.addRow([t("pv_excel_col_mese"), t("pv_excel_col_animali"), t("pv_excel_col_ricavo"), t("pv_excel_col_target"), t("pv_excel_col_gap"), t("pv_excel_col_scoperti"), t("pv_excel_col_residui")]);
      h1.height = 22;
      h1.eachCell(cell => {
        cell.font = headerFont;
        cell.fill = headerFill;
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = thinBorder;
      });

      let totAnimals = 0, totRevenue = 0, totGap = 0, totShortfall = 0;
      plan.monthlyPlan.forEach((m, i) => {
        const animals = m.sales.reduce((a, s) => a + s.animalCount, 0);
        const shortfall = Object.values(m.orderShortfallBySize).reduce((a, b) => a + b, 0);
        const bg = i % 2 === 0 ? white : lightGray;
        const row = ws1.addRow([m.monthName, animals, m.totalRevenue, m.cashTarget || 0, m.cashGap || 0, shortfall, m.remainingAnimals]);
        totAnimals += animals; totRevenue += m.totalRevenue; totGap += m.cashGap || 0; totShortfall += shortfall;
        row.eachCell((cell, col) => {
          cell.border = thinBorder;
          cell.alignment = { horizontal: col === 1 ? "left" : "right", vertical: "middle" };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
          if (col > 1) cell.numFmt = col === 2 || col === 6 || col === 7 ? "#,##0" : "#,##0.00";
          if (col === 3 && m.totalRevenue > 0) cell.font = { color: { argb: "FF059669" }, bold: true };
          if (col === 5 && m.cashGap > 0) { cell.font = { color: { argb: "FFDC2626" }, bold: true }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } }; }
          if (col === 6 && shortfall > 0) { cell.font = { color: { argb: "FFD97706" }, bold: true }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } }; }
        });
      });

      const tot = ws1.addRow([t("pv_excel_totale"), totAnimals, totRevenue, "", totGap, totShortfall, ""]);
      tot.eachCell((cell, col) => {
        cell.border = thinBorder;
        cell.font = { bold: true, size: 11 };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F4FD" } };
        cell.alignment = { horizontal: col === 1 ? "left" : "right", vertical: "middle" };
        if (col > 1 && col !== 4 && col !== 7) cell.numFmt = col === 2 || col === 6 ? "#,##0" : "#,##0.00";
      });
      tot.height = 22;

      ws1.addRow([]);
      const kpiRow = ws1.addRow(["KPI", "Valore"]);
      kpiRow.eachCell(cell => { cell.font = headerFont; cell.fill = headerFill; cell.border = thinBorder; });
      const kpis = [
        [t("pv_kpi_ricavo"), plan.totalRevenue],
        [t("pv_kpi_animali"), plan.totalAnimalsSold],
        [t("pv_kpi_mesi_sotto"), plan.monthsBelowCashTarget],
        [t("pv_kpi_ordini_scoperti"), plan.totalShortfall],
        [t("pv_kpi_ordini_totali"), inputData ? inputData.orders.reduce((s, o) => s + o.animals, 0) : 0],
      ];
      kpis.forEach(([label, val], i) => {
        const r = ws1.addRow([label, val]);
        const bg2 = i % 2 === 0 ? white : lightGray;
        r.eachCell((cell, col) => {
          cell.border = thinBorder;
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg2 } };
          cell.alignment = { horizontal: col === 1 ? "left" : "right" };
          if (col === 2) cell.numFmt = typeof val === 'number' && val > 100 ? "#,##0" : "#,##0.00";
        });
      });

      ws1.columns = [{ width: 22 }, { width: 20 }, { width: 16 }, { width: 18 }, { width: 15 }, { width: 18 }, { width: 18 }];

      // ── FOGLIO 2: Dettaglio vendite per taglia ───────────────────────────
      const ws2 = wb.addWorksheet(t("pv_excel_sheet2_pre"), { views: [{ state: 'frozen', xSplit: 0, ySplit: 2 }] });
      const t2 = ws2.addRow([t("pv_excel_sheet2_pre")]);
      t2.font = { bold: true, size: 13, color: { argb: "FF1E3A5F" } };
      ws2.mergeCells(1, 1, 1, 5);
      t2.alignment = { horizontal: "center" };
      t2.height = 26;

      const h2 = ws2.addRow([t("pv_excel_col_mese"), t("size_label"), t("pv_col_animali"), t("pv_excel_col_ricavo"), t("vco_col_stato")]);
      h2.height = 22;
      h2.eachCell(cell => { cell.font = headerFont; cell.fill = headerFill; cell.alignment = { horizontal: "center", vertical: "middle" }; cell.border = thinBorder; });

      let rowIdx2 = 0;
      for (const m of plan.monthlyPlan) {
        const grouped: Record<string, { sizeCode: string; animals: number; rev: number; reason: string }> = {};
        for (const s of m.sales) {
          const k = `${s.sizeCode}|${s.reason}`;
          if (!grouped[k]) grouped[k] = { sizeCode: s.sizeCode, animals: 0, rev: 0, reason: s.reason };
          grouped[k].animals += s.animalCount;
          grouped[k].rev += s.revenue;
        }
        const entries = Object.values(grouped).sort((a, b) => b.animals - a.animals);
        for (const v of entries) {
          const bg = rowIdx2 % 2 === 0 ? white : lightGray;
          const r = ws2.addRow([m.monthName, v.sizeCode, v.animals, v.rev, v.reason]);
          r.eachCell((cell, col) => {
            cell.border = thinBorder;
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
            cell.alignment = { horizontal: col === 1 || col === 2 || col === 5 ? "left" : "right", vertical: "middle" };
            if (col === 3) cell.numFmt = "#,##0";
            if (col === 4) { cell.numFmt = "#,##0.00"; cell.font = { color: { argb: "FF059669" } }; }
            if (col === 5) {
              const reason = cell.value as string;
              if (reason === 'ordine') { cell.font = { color: { argb: "FF1D4ED8" } }; }
              else if (reason === 'cassa') { cell.font = { color: { argb: "FF7C3AED" } }; }
              else { cell.font = { color: { argb: "FF6B7280" } }; }
            }
          });
          rowIdx2++;
        }
      }
      ws2.columns = [{ width: 22 }, { width: 12 }, { width: 18 }, { width: 16 }, { width: 14 }];

      // ── FOGLIO 3: Dati grafico ───────────────────────────────────────────
      const ws3 = wb.addWorksheet(t("pv_excel_sheet3"));
      const t3 = ws3.addRow([t("pv_excel_chart_title")]);
      t3.font = { bold: true, size: 13, color: { argb: "FF1E3A5F" } };
      ws3.mergeCells(1, 1, 1, 4);
      t3.alignment = { horizontal: "center" };
      t3.height = 26;
      const h3 = ws3.addRow([t("pv_excel_col_mese"), t("pv_excel_chart_ricavo"), t("pv_excel_chart_target"), t("pv_excel_chart_animali")]);
      h3.height = 22;
      h3.eachCell(cell => { cell.font = headerFont; cell.fill = headerFill; cell.alignment = { horizontal: "center", vertical: "middle" }; cell.border = thinBorder; });
      chartData.forEach((row, i) => {
        const bg = i % 2 === 0 ? white : lightGray;
        const r = ws3.addRow([row.mese, row.ricavo, row.target, row.animali]);
        r.eachCell((cell, col) => {
          cell.border = thinBorder;
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
          cell.alignment = { horizontal: col === 1 ? "left" : "right" };
          if (col > 1) cell.numFmt = col === 4 ? "#,##0" : "#,##0.00";
          if (col === 2) cell.font = { color: { argb: "FF059669" } };
          if (col === 3) cell.font = { color: { argb: "FFDC2626" } };
          if (col === 4) cell.font = { color: { argb: "FF3B82F6" } };
        });
      });
      ws3.columns = [{ width: 14 }, { width: 16 }, { width: 18 }, { width: 20 }];

      // ── Scarica ──────────────────────────────────────────────────────────
      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PianificazioneVendite_${plan.year}_${modeLabel.replace(/\s/g,'')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: t("pv_toast_excel"), description: t("pv_toast_excel_desc") });
    } catch (e) {
      toast({ title: t("pv_toast_error"), variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-[1600px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Calculator className="h-7 w-7 text-blue-600" />
            {t("pv_title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("pv_subtitle")}
          </p>
        </div>
        <div className="flex items-center rounded-md border overflow-hidden text-xs font-semibold">
          <button onClick={() => setLang("it")} className={`px-2 py-1 transition-colors ${lang === "it" ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}>IT</button>
          <button onClick={() => setLang("en")} className={`px-2 py-1 transition-colors ${lang === "en" ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}>EN</button>
        </div>
      </div>

      <Tabs defaultValue="risultati" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="risultati" data-testid="tab-risultati">{t("pv_tab_risultati")}</TabsTrigger>
          <TabsTrigger value="dati" data-testid="tab-dati">{t("pv_tab_dati")}</TabsTrigger>
          <TabsTrigger value="listino" data-testid="tab-listino">{t("pv_tab_listino")}</TabsTrigger>
          <TabsTrigger value="cassa" data-testid="tab-cassa">{t("pv_tab_cassa")}</TabsTrigger>
        </TabsList>

        {/* === RISULTATI === */}
        <TabsContent value="risultati" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("pv_params_title")}</CardTitle>
              <CardDescription>{t("pv_params_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
                <div>
                  <LabelWithHelp tip={t("pv_tip_anno")}>
                    {t("pv_label_anno")}
                  </LabelWithHelp>
                  <Input type="number" value={year} onChange={e => setYear(parseInt(e.target.value) || currentYear)} data-testid="input-year" />
                </div>
                <div>
                  <LabelWithHelp tip={t("pv_tip_mese")}>
                    {t("pv_label_mese_inizio")}
                  </LabelWithHelp>
                  <Select value={String(startMonth)} onValueChange={v => setStartMonth(parseInt(v))}>
                    <SelectTrigger data-testid="select-start-month"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <LabelWithHelp tip={t("pv_tip_orizzonte")}>
                    {t("pv_label_orizzonte")}
                  </LabelWithHelp>
                  <div className="flex gap-2 items-center">
                    <Select value={horizonSelectValue} onValueChange={v => {
                      if (v === 'custom') {
                        setIsCustomHorizon(true);
                        setCustomHorizonStr(String(monthsHorizon));
                      } else {
                        setIsCustomHorizon(false);
                        setCustomHorizonStr('');
                        setMonthsHorizon(parseInt(v));
                      }
                    }}>
                      <SelectTrigger data-testid="select-horizon" className={isCustomHorizon ? 'w-auto' : ''}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRESET_HORIZONS.map(h => <SelectItem key={h} value={String(h)}>{h} {t("months_label")}</SelectItem>)}
                        <SelectItem value="custom">{t("custom")}</SelectItem>
                      </SelectContent>
                    </Select>
                    {isCustomHorizon && (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={1}
                          max={60}
                          value={customHorizonStr}
                          onChange={e => {
                            setCustomHorizonStr(e.target.value);
                            const n = parseInt(e.target.value);
                            if (!isNaN(n) && n >= 1 && n <= 60) setMonthsHorizon(n);
                          }}
                          className="w-20 h-9 text-sm"
                          placeholder="mesi"
                        />
                        <span className="text-sm text-muted-foreground">mesi</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <LabelWithHelp tip={t("pv_tip_modalita")}>
                    {t("pv_label_modalita")}
                  </LabelWithHelp>
                  <Select value={mode} onValueChange={v => setMode(v as Mode)}>
                    <SelectTrigger data-testid="select-mode"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cassa">{t("pv_mode_cassa")}</SelectItem>
                      <SelectItem value="bilanciato">{t("pv_mode_bilanciato")}</SelectItem>
                      <SelectItem value="ricavo">{t("pv_mode_ricavo")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <LabelWithHelp tip={t("pv_tip_motore")}>
                    {t("pv_label_motore")}
                  </LabelWithHelp>
                  <Select value={engine} onValueChange={v => setEngine(v as Engine)}>
                    <SelectTrigger data-testid="select-engine"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="greedy">{t("pv_engine_greedy")}</SelectItem>
                      <SelectItem value="lp">{t("pv_engine_lp")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 items-end">
                  <Button onClick={() => refetchPlan()} disabled={isFetching} data-testid="button-calculate">
                    {isFetching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calculator className="h-4 w-4 mr-2" />}
                    {t("pv_btn_calcola")}
                  </Button>
                  {plan && (
                    <Button variant="outline" onClick={handleExportExcel} disabled={isExporting} title="Esporta in Excel" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800">
                      {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>

              {/* Guida espandibile ai parametri */}
              <Collapsible open={guideOpen} onOpenChange={setGuideOpen} className="mt-4">
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2" data-testid="button-toggle-guide">
                    <Info className="h-4 w-4" />
                    {guideOpen ? t("pv_hide_guide") : t("pv_show_guide")}
                    {guideOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="border rounded-lg bg-muted/30 p-4 space-y-4 text-sm">
                    <div>
                      <h4 className="font-semibold mb-1">{t("pv_guide_anno_title")}</h4>
                      <p className="text-muted-foreground">{t("pv_guide_anno_text")}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{t("pv_guide_mese_title")}</h4>
                      <p className="text-muted-foreground">{t("pv_guide_mese_text")}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{t("pv_guide_orizzonte_title")}</h4>
                      <p className="text-muted-foreground">{t("pv_guide_orizzonte_text")}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{t("pv_guide_modalita_title")}</h4>
                      <ul className="text-muted-foreground space-y-2 ml-2">
                        <li><strong className="text-foreground">{t("pv_guide_cassa_title")}</strong> — {t("pv_guide_cassa_text")}</li>
                        <li><strong className="text-foreground">{t("pv_guide_bilanciato_title")}</strong> — {t("pv_guide_bilanciato_text")}</li>
                        <li><strong className="text-foreground">{t("pv_guide_ricavo_title")}</strong> — {t("pv_guide_ricavo_text")}</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{t("pv_guide_motore_title")}</h4>
                      <ul className="text-muted-foreground space-y-2 ml-2">
                        <li><strong className="text-foreground">{t("pv_guide_greedy_title")}</strong> — {t("pv_guide_greedy_text")}</li>
                        <li><strong className="text-foreground">{t("pv_guide_lp_title")}</strong> — {t("pv_guide_lp_text")}</li>
                      </ul>
                      <div className="mt-2 p-2 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs">
                        <strong>{t("pv_guide_consiglio")}</strong>: {t("pv_guide_consiglio_text")}
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <h4 className="font-semibold mb-1">{t("pv_guide_data_title")}</h4>
                      <ul className="text-muted-foreground space-y-1 list-disc ml-5">
                        <li>{t("pv_guide_data_listino")}</li>
                        <li>{t("pv_guide_data_cassa")}</li>
                        <li>{t("pv_guide_data_ordini")}</li>
                        <li>{t("pv_guide_data_inventario")}</li>
                        <li>{t("pv_guide_data_schiuditoio")}</li>
                      </ul>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          {plan && (
            <>
              {/* Engine info */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {t("pv_engine_badge_pre")} {plan.engine === 'lp' ? '🧮 LP' : '⚡ Greedy'}
                </Badge>
                {plan.engine === 'lp' && plan.solverStatus && (
                  <>
                    <Badge variant={plan.solverStatus.feasible ? 'default' : 'destructive'} className="text-xs">
                      {plan.solverStatus.feasible ? t("pv_solver_feasible") : t("pv_solver_infeasible")}
                    </Badge>
                    {plan.solverStatus.objective !== undefined && (
                      <Badge variant="secondary" className="text-xs">
                        {t("pv_solver_objective")} {fmtEur(plan.solverStatus.objective)}
                      </Badge>
                    )}
                  </>
                )}
              </div>

              {/* KPI */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card><CardContent className="pt-4">
                  <div className="text-xs text-muted-foreground">{t("pv_kpi_ricavo")}</div>
                  <div className="text-xl font-bold text-emerald-600" data-testid="kpi-revenue">{fmtEur(plan.totalRevenue)}</div>
                </CardContent></Card>
                <Card><CardContent className="pt-4">
                  <div className="text-xs text-muted-foreground">{t("pv_kpi_animali")}</div>
                  <div className="text-xl font-bold" data-testid="kpi-animals">{fmtNum(plan.totalAnimalsSold)}</div>
                </CardContent></Card>
                <Card><CardContent className="pt-4">
                  <div className="text-xs text-muted-foreground">{t("pv_kpi_mesi_sotto")}</div>
                  <div className={`text-xl font-bold ${plan.monthsBelowCashTarget > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {plan.monthsBelowCashTarget} / {plan.monthsHorizon}
                  </div>
                </CardContent></Card>
                <Card><CardContent className="pt-4">
                  <div className="text-xs text-muted-foreground">{t("pv_kpi_ordini_scoperti")}</div>
                  <div className={`text-xl font-bold ${plan.totalShortfall > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {fmtNum(plan.totalShortfall)}
                  </div>
                </CardContent></Card>
                <Card><CardContent className="pt-4">
                  <div className="text-xs text-muted-foreground">{t("pv_kpi_ordini_totali")}</div>
                  <div className="text-xl font-bold text-blue-600">
                    {inputData ? fmtNum(inputData.orders.reduce((s, o) => s + o.animals, 0)) : '—'}
                  </div>
                </CardContent></Card>
              </div>

              {/* Grafico */}
              <Card>
                <CardHeader><CardTitle className="text-lg">{t("pv_chart_title")}</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mese" />
                        <YAxis yAxisId="left" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                        <YAxis yAxisId="right" orientation="right" width={72} tickFormatter={v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}k` : String(v)} />
                        <RechartsTooltip formatter={(v: any, name: string) => (name === t("pv_chart_animali") || name === t("pv_chart_animali_cassa") || name === t("pv_chart_vendibili") || name === t("pv_chart_ordini_mese")) ? fmtNum(v) : fmtEur(v)} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="ricavo" fill="#10b981" name={t("pv_chart_ricavo")} />
                        <Line yAxisId="left" type="monotone" dataKey="target" stroke="#ef4444" name={t("pv_chart_target")} strokeWidth={2} />
                        <Line yAxisId="right" type="monotone" dataKey="vendibili" stroke="#8b5cf6" name={t("pv_chart_vendibili")} strokeDasharray="6 3" strokeWidth={2} dot={false} />
                        <Line yAxisId="right" type="monotone" dataKey="ordiniTotali" stroke="#6366f1" name={t("pv_chart_ordini_mese")} strokeWidth={2} dot={{ r: 3 }} />
                        <Line yAxisId="right" type="monotone" dataKey="animaliOrdini" stroke="#3b82f6" name={t("pv_chart_animali")} strokeDasharray="4 2" strokeWidth={2} />
                        <Line yAxisId="right" type="monotone" dataKey="animaliCassa" stroke="#f97316" name={t("pv_chart_animali_cassa")} strokeDasharray="2 2" strokeWidth={1.5} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Tabella dati grafico */}
              <Card>
                <CardHeader><CardTitle className="text-lg">{t("pv_chart_data_title")}</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <ThWithTip tip="">{t("pv_chart_data_mese")}</ThWithTip>
                        <ThWithTip className="text-right" tip={t("pv_chart_data_vendibili_tip")}>{t("pv_chart_data_vendibili")}</ThWithTip>
                        <ThWithTip className="text-right" tip={t("pv_chart_data_ordini_mese_tip")}>{t("pv_chart_data_ordini_mese")}</ThWithTip>
                        <ThWithTip className="text-right" tip={t("pv_chart_data_ordini_tip")}>{t("pv_chart_data_ordini")}</ThWithTip>
                        <ThWithTip className="text-right" tip={t("pv_chart_data_cassa_tip")}>{t("pv_chart_data_cassa")}</ThWithTip>
                        <ThWithTip className="text-right" tip={t("pv_chart_data_copertura_tip")}>{t("pv_chart_data_copertura")}</ThWithTip>
                        <ThWithTip className="text-right" tip="">{t("pv_chart_data_ricavo")}</ThWithTip>
                        <ThWithTip className="text-right" tip="">{t("pv_chart_data_target")}</ThWithTip>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chartData.map((row, i) => {
                        const copertura = row.vendibili > 0 ? (row.animaliOrdini / row.vendibili) * 100 : 0;
                        return (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{row.mese}</TableCell>
                            <SizeBreakdownCell value={row.vendibili} bySize={row.sellableBySize} colorClass="text-purple-600" label="Composizione per taglia" />
                            <SizeBreakdownCell value={row.ordiniTotali} bySize={row.ordiniBySize} colorClass="text-indigo-500" label="Ordini per taglia" />
                            <SizeBreakdownCell value={row.animaliOrdini} bySize={row.ordiniConsegnatiBySize} colorClass="text-blue-600" label="Consegnati per taglia" />
                            <TableCell className="text-right font-mono text-orange-500">{row.animaliCassa > 0 ? fmtNum(row.animaliCassa) : <span className="text-muted-foreground">—</span>}</TableCell>
                            <TableCell className="text-right font-mono">
                              <span className={copertura > 80 ? "text-amber-600 font-semibold" : copertura > 20 ? "text-emerald-600" : "text-muted-foreground"}>
                                {row.vendibili > 0 ? `${copertura.toFixed(1)}%` : '—'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-emerald-600">{fmtEur(row.ricavo)}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{row.target > 0 ? fmtEur(row.target) : '—'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Tabella mensile */}
              <Card>
                <CardHeader><CardTitle className="text-lg">{t("pv_table_title")}</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <ThWithTip tip={t("pv_col_mese_tip")}>{t("pv_col_mese")}</ThWithTip>
                        <ThWithTip className="text-right" tip={t("pv_col_animali_tip")}>{t("pv_col_animali")}</ThWithTip>
                        <ThWithTip className="text-right" tip={t("pv_col_ricavo_tip")}>{t("pv_col_ricavo")}</ThWithTip>
                        <ThWithTip className="text-right" tip={t("pv_col_target_tip")}>{t("pv_col_target")}</ThWithTip>
                        <ThWithTip className="text-right" tip={t("pv_col_gap_tip")}>{t("pv_col_gap")}</ThWithTip>
                        <ThWithTip className="text-right" tip={t("pv_col_scoperti_tip")}>{t("pv_col_scoperti")}</ThWithTip>
                        <ThWithTip tip={t("pv_col_vendite_tip")}>{t("pv_col_vendite")}</ThWithTip>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plan.monthlyPlan.map(m => {
                        const shortfallTotal = Object.values(m.orderShortfallBySize).reduce((a, b) => a + b, 0);
                        return (
                          <TableRow key={`${m.year}-${m.month}`}>
                            <TableCell className="font-medium">{m.monthName}</TableCell>
                            <TableCell className="text-right font-mono">{fmtNum(m.sales.reduce((a, s) => a + s.animalCount, 0))}</TableCell>
                            <TableCell className="text-right font-semibold text-emerald-600">{fmtEur(m.totalRevenue)}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{m.cashTarget > 0 ? fmtEur(m.cashTarget) : '—'}</TableCell>
                            <TableCell className="text-right">
                              {m.cashGap > 0 ? <Badge variant="destructive">{fmtEur(m.cashGap)}</Badge> : <CheckCircle2 className="h-4 w-4 text-emerald-500 inline" />}
                            </TableCell>
                            <TableCell className="text-right">
                              {shortfallTotal > 0 ? (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  {fmtNum(shortfallTotal)}
                                </Badge>
                              ) : <CheckCircle2 className="h-4 w-4 text-emerald-500 inline" />}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-md">
                                {m.sales.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                                {Object.entries(
                                  m.sales.reduce((acc, s) => {
                                    const k = `${s.sizeCode}|${s.reason}`;
                                    if (!acc[k]) acc[k] = { sizeCode: s.sizeCode, reason: s.reason, animals: 0, rev: 0 };
                                    acc[k].animals += s.animalCount;
                                    acc[k].rev += s.revenue;
                                    return acc;
                                  }, {} as Record<string, { sizeCode: string; reason: string; animals: number; rev: number }>)
                                ).sort((a, b) => b[1].animals - a[1].animals).map(([k, v]) => (
                                  <Badge key={k} variant={v.reason === 'ordine' ? 'default' : v.reason === 'liquidazione' ? 'secondary' : 'outline'} className="text-xs">
                                    {v.sizeCode} · {fmtNum(v.animals)} · {fmtEur(v.rev)}
                                    <span className="ml-1 opacity-70">({v.reason})</span>
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}

          {!plan && !isFetching && (
            <Card><CardContent className="pt-6 text-center text-muted-foreground">
              {t("pv_no_plan")} <strong>{t("pv_no_plan_btn")}</strong> {t("pv_no_plan_suffix")}
            </CardContent></Card>
          )}
        </TabsContent>

        {/* === DATI DI INPUT === */}
        <TabsContent value="dati" className="space-y-4">
          {inputLoading ? (
            <Card><CardContent className="pt-6 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("pv_loading_data")}
            </CardContent></Card>
          ) : inputData ? (
            <>
              {/* Riepilogo KPI */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card><CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">{t("pv_dati_kpi_cestelli")}</p>
                  <p className="text-2xl font-bold">{fmtNum(inputData.inventory.totalBaskets)}</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">{t("pv_dati_kpi_animali")}</p>
                  <p className="text-2xl font-bold text-blue-600">{fmtNum(inputData.inventory.totalAnimals)}</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">{t("pv_dati_kpi_taglie")}</p>
                  <p className="text-2xl font-bold">{inputData.priceList.filter(p => p.pricePerAnimal > 0).length}</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">{t("pv_dati_kpi_ordini")} ({inputData.year})</p>
                  <p className="text-2xl font-bold">{inputData.orders.length}</p>
                </CardContent></Card>
              </div>

              {/* Inventario per taglia */}
              <Card>
                <CardHeader><CardTitle className="text-base">{t("pv_inv_title")}</CardTitle>
                  <CardDescription>{t("pv_inv_desc")}</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("pv_inv_col_taglia")}</TableHead>
                        <TableHead className="text-right">{t("pv_inv_col_cestelli")}</TableHead>
                        <TableHead className="text-right">{t("pv_inv_col_animali")}</TableHead>
                        <TableHead>{t("pv_inv_col_pct")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(inputData.inventory.bySize)
                        .sort((a, b) => {
                          const ia = SALE_SIZES.indexOf(a[0]);
                          const ib = SALE_SIZES.indexOf(b[0]);
                          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
                        })
                        .map(([size, data]) => {
                          const pct = (data.animals / inputData.inventory.totalAnimals) * 100;
                          return (
                            <TableRow key={size}>
                              <TableCell className="font-mono font-semibold">{size}</TableCell>
                              <TableCell className="text-right">{data.count}</TableCell>
                              <TableCell className="text-right font-mono">{fmtNum(data.animals)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 min-w-[140px]">
                                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-blue-500"
                                      style={{ width: `${Math.min(pct, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
                                    {pct.toFixed(1)}%
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Arrivi schiuditoio */}
              {inputData.hatchery.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">{t("pv_hatchery_title")}</CardTitle>
                    <CardDescription>{t("pv_hatchery_desc")}</CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("pv_hatchery_col_anno")}</TableHead>
                          <TableHead>{t("pv_hatchery_col_mese")}</TableHead>
                          <TableHead className="text-right">{t("pv_hatchery_col_qty_prev")}</TableHead>
                          <TableHead className="text-right">{t("pv_hatchery_col_qty_eff")}</TableHead>
                          <TableHead className="text-right">{t("pv_hatchery_col_subtot")}</TableHead>
                          <TableHead>{t("pv_hatchery_col_note")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          let runningTotal = 0;
                          return inputData.hatchery.map((h, i) => {
                            if (h.actualQuantity !== null) runningTotal += h.actualQuantity;
                            const hasActual = h.actualQuantity !== null;
                            return (
                              <TableRow key={i}>
                                <TableCell>{h.year}</TableCell>
                                <TableCell>{h.monthName}</TableCell>
                                <TableCell className="text-right font-mono">{fmtNum(h.quantity)}</TableCell>
                                <TableCell className="text-right font-mono">
                                  {hasActual ? fmtNum(h.actualQuantity!) : <span className="text-muted-foreground">—</span>}
                                </TableCell>
                                <TableCell className="text-right font-mono font-semibold text-blue-600">
                                  {hasActual ? fmtNum(runningTotal) : <span className="text-muted-foreground">—</span>}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">{h.notes || '—'}</TableCell>
                              </TableRow>
                            );
                          });
                        })()}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Ordini cliente */}
              {inputData.orders.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">{t("pv_orders_title")} {inputData.year}</CardTitle>
                    <CardDescription>{t("pv_orders_desc")}</CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("pv_orders_col_mese")}</TableHead>
                          <TableHead>{t("pv_orders_col_taglia")}</TableHead>
                          <TableHead className="text-right">{t("pv_orders_col_animali")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inputData.orders.map((o, i) => (
                          <TableRow key={i}>
                            <TableCell>{o.month}</TableCell>
                            <TableCell className="font-mono">{o.size}</TableCell>
                            <TableCell className="text-right font-mono">{fmtNum(o.animals)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <tfoot>
                        <TableRow className="border-t-2 font-semibold bg-muted/40">
                          <TableCell colSpan={2}>Totale ordini anno</TableCell>
                          <TableCell className="text-right font-mono">
                            {fmtNum(inputData.orders.reduce((s, o) => s + o.animals, 0))}
                          </TableCell>
                        </TableRow>
                      </tfoot>
                    </Table>
                  </CardContent>
                </Card>
              )}
              {inputData.orders.length === 0 && (
                <Card><CardContent className="pt-4 text-sm text-muted-foreground">
                  Nessun ordine aperto trovato per l'anno {inputData.year}.
                </CardContent></Card>
              )}

              {/* SGR (crescita) */}
              <Card>
                <CardHeader><CardTitle className="text-base">{t("pv_sgr_title")}</CardTitle>
                  <CardDescription>{t("pv_sgr_desc")}</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("pv_sgr_col_mese")}</TableHead>
                        {inputData.sgr.sgrSizes.map(sz => <TableHead key={sz} className="text-right text-xs">{sz}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inputData.sgr.sgrTable.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{row.month as string}</TableCell>
                          {inputData.sgr.sgrSizes.map(sz => (
                            <TableCell key={sz} className="text-right font-mono text-xs">
                              {typeof row[sz] === 'number' ? (row[sz] as number).toFixed(3) : '—'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Mortalità */}
              {Object.keys(inputData.mortality).length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">{t("pv_mortality_title")}</CardTitle>
                    <CardDescription>{t("pv_mortality_desc")}</CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("pv_mortality_col_taglia")}</TableHead>
                          {Array.from({ length: 12 }, (_, i) => (
                            <TableHead key={i} className="text-right text-xs">
                              {MONTHS.map(m => m.slice(0, 3))[i]}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(inputData.mortality).map(([sizeName, months]) => (
                          <TableRow key={sizeName}>
                            <TableCell className="font-mono font-semibold">{sizeName}</TableCell>
                            {Array.from({ length: 12 }, (_, i) => (
                              <TableCell key={i} className="text-right font-mono text-xs">
                                {months[i + 1] !== undefined ? `${months[i + 1]}%` : <span className="text-muted-foreground">—</span>}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              <p className="text-xs text-muted-foreground text-right">
                {t("pv_updated_at")} {new Date(inputData.generatedAt).toLocaleString('it-IT')}
                {' · '}
                <button onClick={() => refetchInputData()} className="underline hover:text-foreground">{t("update")}</button>
              </p>
            </>
          ) : (
            <Card><CardContent className="pt-6 text-center text-muted-foreground">
              {t("pv_error_data")}
            </CardContent></Card>
          )}
        </TabsContent>

        {/* === LISTINO === */}
        <TabsContent value="listino">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Banknote className="h-5 w-5 text-emerald-600" />{t("pv_listino_title")}</CardTitle>
              <CardDescription>{t("pv_listino_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {priceLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {SALE_SIZES.map(sz => {
                    const current = priceMap[sz];
                    const editing = priceEdits[sz];
                    const display = editing !== undefined ? editing : (current !== undefined ? String(current) : '');
                    const dirty = editing !== undefined && editing !== (current !== undefined ? String(current) : '');
                    return (
                      <div key={sz} className="flex items-center gap-2 p-2 border rounded">
                        <span className="font-mono text-sm w-24">{sz}</span>
                        <Input
                          type="number"
                          step="0.0001"
                          placeholder="€/animale"
                          value={display}
                          onChange={e => setPriceEdits(prev => ({ ...prev, [sz]: e.target.value }))}
                          className="flex-1"
                          data-testid={`input-price-${sz}`}
                        />
                        <Button size="sm" variant={dirty ? 'default' : 'ghost'} onClick={() => handleSavePrice(sz)} disabled={!dirty}>
                          {t("save")}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === CASSA === */}
        <TabsContent value="cassa">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Scale className="h-5 w-5 text-blue-600" />{t("pv_cassa_title")}</CardTitle>
              <CardDescription>{t("pv_cassa_desc_pre")} {year}. {t("pv_cassa_desc_suf")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex items-center gap-2">
                <Label>{t("pv_label_anno")}</Label>
                <Input type="number" value={year} onChange={e => setYear(parseInt(e.target.value) || currentYear)} className="w-32" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {MONTHS.map((label, i) => {
                  const month = i + 1;
                  const current = cashMap[month];
                  const editing = cashEdits[month];
                  const display = editing !== undefined
                    ? editing
                    : (current !== undefined && current !== 0 ? fmtNum(current) : '');
                  const dirty = editing !== undefined && editing !== (current !== undefined ? String(current) : '');
                  return (
                    <div key={month} className="flex items-center gap-2 p-2 border rounded">
                      <span className="text-sm w-20">{label}</span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="€"
                        value={display}
                        onChange={e => {
                          const raw = e.target.value.replace(/[^\d]/g, '');
                          setCashEdits(prev => ({ ...prev, [month]: raw }));
                        }}
                        className="flex-1 tabular-nums"
                        data-testid={`input-cash-${month}`}
                      />
                      <Button size="sm" variant={dirty ? 'default' : 'ghost'} onClick={() => handleSaveCash(month)} disabled={!dirty}>
                        {t("save")}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
