import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePlanningLang } from "@/lib/planningI18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, ShieldCheck, ShieldAlert, TrendingUp, Package, AlertTriangle, CheckCircle2, XCircle, Eye, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import * as ExcelJS from "exceljs";

interface MonthSizeSnapshot {
  giacenzaPre: number;
  giacenzaPost: number;
  ordini: number;
  soddisfatti: number;
  gap: number;
  coperturaPct: number;
}

interface MonthlySnapshot {
  month: number;
  monthName: string;
  monthShort: string;
  perTaglia: Record<string, MonthSizeSnapshot>;
  totaleGiacenzaPre: number;
  totaleGiacenzaPost: number;
  totaleOrdini: number;
  totaleSoddisfatti: number;
  totaleGap: number;
  coperturaPctGlobale: number;
}

interface OrderDetail {
  ordineId: number;
  clienteNome: string;
  taglia: string;
  saleSize: string | null;
  quantita: number;
  dataInizioConsegna: string | null;
  dataFineConsegna: string | null;
  stato: string;
  quantitaPerMese: number;
  mesiCoperti: number;
}

interface CoverageResult {
  year: number;
  generatedAt: string;
  mesiSimulati: number;
  giacenzaIniziale: Record<string, number>;
  timeline: MonthlySnapshot[];
  riepilogoPerTaglia: Record<string, {
    giacenzaIniziale: number;
    totaleOrdini: number;
    totaleSoddisfatti: number;
    totaleGap: number;
    coperturaPct: number;
  }>;
  kpi: {
    totaleGiacenzaIniziale: number;
    totaleOrdiniAnno: number;
    totaleSoddisfacibili: number;
    totaleGap: number;
    coperturaPctGlobale: number;
    mesiCritici: number;
    mesiOk: number;
    taglieConGap: string[];
    taglieCoperte: string[];
  };
  ordiniDettaglio: OrderDetail[];
  dbEsternoDisponibile: boolean;
}

function formatNumber(num: number): string {
  if (Math.abs(num) >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (Math.abs(num) >= 1_000) return (num / 1_000).toFixed(0) + "K";
  return num.toLocaleString("it-IT");
}

function getCoverageColor(pct: number): string {
  if (pct >= 100) return "bg-emerald-500";
  if (pct >= 75) return "bg-yellow-500";
  if (pct >= 50) return "bg-orange-500";
  return "bg-red-500";
}

function getCoverageBg(pct: number): string {
  if (pct >= 100) return "bg-emerald-50 dark:bg-emerald-950/30";
  if (pct >= 75) return "bg-yellow-50 dark:bg-yellow-950/30";
  if (pct >= 50) return "bg-orange-50 dark:bg-orange-950/30";
  return "bg-red-50 dark:bg-red-950/30";
}

function getCoverageText(pct: number): string {
  if (pct >= 100) return "text-emerald-700 dark:text-emerald-400";
  if (pct >= 75) return "text-yellow-700 dark:text-yellow-400";
  if (pct >= 50) return "text-orange-700 dark:text-orange-400";
  return "text-red-700 dark:text-red-400";
}

export default function VerificaCoperturaOrdini() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const { lang, setLang, t } = usePlanningLang();

  const { data, isLoading, error } = useQuery<CoverageResult>({
    queryKey: ["/api/verifica-copertura", year],
    queryFn: async () => {
      const res = await fetch(`/api/verifica-copertura?year=${year}`);
      if (!res.ok) throw new Error("Errore caricamento dati");
      return res.json();
    },
    staleTime: 60000,
  });

  const headerFill: ExcelJS.FillPattern = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
  const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  const evenRowFill: ExcelJS.FillPattern = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } };
  const borderStyle: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FFD1D5DB" } },
    bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
    left: { style: "thin", color: { argb: "FFD1D5DB" } },
    right: { style: "thin", color: { argb: "FFD1D5DB" } },
  };

  const styleSheet = (ws: ExcelJS.Worksheet) => {
    const headerRow = ws.getRow(1);
    headerRow.eachCell(cell => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = borderStyle;
    });
    headerRow.height = 22;

    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      row.eachCell(cell => {
        cell.border = borderStyle;
        cell.alignment = { horizontal: "center", vertical: "middle" };
        if (r % 2 === 0) cell.fill = evenRowFill;
      });
    }

    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: ws.rowCount, column: ws.columnCount } };
  };

  const exportExcel = async () => {
    if (!data) return;

    const ExcelModule = (ExcelJS as any).default || ExcelJS;
    const wb = new ExcelModule.Workbook();

    const wsOverview = wb.addWorksheet(t("vco_excel_sheet1"));
    wsOverview.columns = [
      { header: t("vco_excel_col_mese"), key: "mese", width: 14 },
      { header: t("vco_excel_col_giacenza"), key: "giacenza", width: 22 },
      { header: t("vco_excel_col_ordini"), key: "ordini", width: 16 },
      { header: t("vco_excel_col_soddisfatti"), key: "soddisfatti", width: 16 },
      { header: t("vco_excel_col_gap"), key: "gap", width: 14 },
      { header: t("vco_excel_col_copertura"), key: "copertura", width: 14 },
      { header: t("vco_excel_col_residua"), key: "residua", width: 20 },
    ];
    data.timeline.forEach(snap => {
      wsOverview.addRow({
        mese: snap.monthName,
        giacenza: snap.totaleGiacenzaPre,
        ordini: snap.totaleOrdini,
        soddisfatti: snap.totaleSoddisfatti,
        gap: snap.totaleGap,
        copertura: snap.coperturaPctGlobale,
        residua: snap.totaleGiacenzaPost,
      });
    });
    styleSheet(wsOverview);

    const sizesWithData = Object.keys(data.riepilogoPerTaglia).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, "")) || 0;
      const numB = parseInt(b.replace(/\D/g, "")) || 0;
      return numA - numB;
    });

    const wsDetail = wb.addWorksheet(t("vco_excel_sheet2"));

    const sectionFill: ExcelJS.FillPattern = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
    const sectionFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };

    const addSection = (title: string, metric: 'giacenzaPre' | 'ordini' | 'soddisfatti' | 'gap') => {
      const titleRow = wsDetail.addRow([title]);
      titleRow.font = sectionFont;
      titleRow.fill = sectionFill;
      wsDetail.mergeCells(titleRow.number, 1, titleRow.number, sizesWithData.length + 1);

      const headerRow = wsDetail.addRow([t("vco_excel_col_mese"), ...sizesWithData]);
      headerRow.font = headerFont;
      headerRow.fill = headerFill;
      headerRow.eachCell(cell => {
        cell.border = borderStyle;
        cell.alignment = { horizontal: "center" };
      });

      data.timeline.forEach(snap => {
        const vals = sizesWithData.map(size => {
          const cell = snap.perTaglia[size];
          return cell ? (cell[metric] || 0) : 0;
        });
        const row = wsDetail.addRow([snap.monthName, ...vals]);
        row.eachCell((cell, colNumber) => {
          cell.border = borderStyle;
          if (colNumber > 1) {
            cell.numFmt = '#,##0';
            cell.alignment = { horizontal: "right" };
          }
        });
      });

      wsDetail.addRow([]);
    };

    wsDetail.getColumn(1).width = 14;
    sizesWithData.forEach((_, i) => {
      wsDetail.getColumn(i + 2).width = 14;
    });

    addSection(t("vco_excel_sec_giacenza"), "giacenzaPre");
    addSection(t("vco_excel_sec_ordini"), "ordini");
    addSection(t("vco_excel_sec_soddisfatti"), "soddisfatti");
    addSection(t("vco_excel_sec_gap"), "gap");

    if (data.ordiniDettaglio.length > 0) {
      const wsOrdini = wb.addWorksheet(t("vco_excel_sheet3"));
      wsOrdini.columns = [
        { header: t("vco_excel_col_id"), key: "id", width: 10 },
        { header: t("vco_excel_col_cliente"), key: "cliente", width: 25 },
        { header: t("vco_excel_col_taglia"), key: "taglia", width: 12 },
        { header: t("vco_excel_col_salesize"), key: "saleSize", width: 14 },
        { header: t("vco_excel_col_qtytot"), key: "qty", width: 18 },
        { header: t("vco_excel_col_qtymese"), key: "qtyMese", width: 16 },
        { header: t("vco_excel_col_mesi"), key: "mesi", width: 8 },
        { header: t("vco_excel_col_inizio"), key: "inizio", width: 14 },
        { header: t("vco_excel_col_fine"), key: "fine", width: 14 },
        { header: t("vco_excel_col_stato"), key: "stato", width: 14 },
      ];
      data.ordiniDettaglio.forEach(o => {
        wsOrdini.addRow({
          id: o.ordineId,
          cliente: o.clienteNome,
          taglia: o.taglia,
          saleSize: o.saleSize || "N/D",
          qty: o.quantita,
          qtyMese: o.quantitaPerMese,
          mesi: o.mesiCoperti,
          inizio: o.dataInizioConsegna || "N/D",
          fine: o.dataFineConsegna || "N/D",
          stato: o.stato,
        });
      });
      styleSheet(wsOrdini);
    }

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Verifica_Copertura_${year}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-600" />
          <p className="text-muted-foreground">{t("vco_loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">{t("vco_error")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const chartData = data.timeline.map(snap => ({
    name: snap.monthShort,
    giacenza: snap.totaleGiacenzaPre,
    ordini: snap.totaleOrdini,
    soddisfatti: snap.totaleSoddisfatti,
    gap: snap.totaleGap,
    copertura: snap.coperturaPctGlobale,
  }));

  const sizesWithOrders = Object.entries(data.riepilogoPerTaglia)
    .filter(([, v]) => v.totaleOrdini > 0)
    .sort((a, b) => {
      const numA = parseInt(a[0].replace(/\D/g, "")) || 0;
      const numB = parseInt(b[0].replace(/\D/g, "")) || 0;
      return numA - numB;
    });

  const sizesAll = Object.entries(data.riepilogoPerTaglia)
    .sort((a, b) => {
      const numA = parseInt(a[0].replace(/\D/g, "")) || 0;
      const numB = parseInt(b[0].replace(/\D/g, "")) || 0;
      return numA - numB;
    });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-blue-600" />
            {t("vco_title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("vco_subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-md border overflow-hidden text-xs font-semibold">
            <button onClick={() => setLang("it")} className={`px-2 py-1 transition-colors ${lang === "it" ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}>IT</button>
            <button onClick={() => setLang("en")} className={`px-2 py-1 transition-colors ${lang === "en" ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}>EN</button>
          </div>
          <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2027">2027</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportExcel} className="gap-2 bg-black hover:bg-gray-800 text-white">
            <Download className="h-4 w-4" />
            {t("excel")}
          </Button>
        </div>
      </div>

      {!data.dbEsternoDisponibile && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">{t("vco_db_na")}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-blue-200">
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{t("vco_kpi_giacenza")}</div>
            <div className="text-2xl font-bold text-blue-700 mt-1">{formatNumber(data.kpi.totaleGiacenzaIniziale)}</div>
            <div className="text-xs text-muted-foreground">{t("vco_kpi_giacenza_sub")}</div>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{t("vco_kpi_ordini")}</div>
            <div className="text-2xl font-bold text-purple-700 mt-1">{formatNumber(data.kpi.totaleOrdiniAnno)}</div>
            <div className="text-xs text-muted-foreground">{t("vco_kpi_ordini_sub")}</div>
          </CardContent>
        </Card>

        <Card className={`border-2 ${data.kpi.coperturaPctGlobale >= 100 ? "border-emerald-300" : data.kpi.coperturaPctGlobale >= 75 ? "border-yellow-300" : "border-red-300"}`}>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{t("vco_kpi_copertura")}</div>
            <div className={`text-2xl font-bold mt-1 ${data.kpi.coperturaPctGlobale >= 100 ? "text-emerald-700" : data.kpi.coperturaPctGlobale >= 75 ? "text-yellow-700" : "text-red-700"}`}>
              {data.kpi.coperturaPctGlobale}%
            </div>
            <div className="text-xs text-muted-foreground">{formatNumber(data.kpi.totaleSoddisfacibili)} {t("vco_kpi_soddisfatti_sub")}</div>
          </CardContent>
        </Card>

        <Card className={data.kpi.totaleGap > 0 ? "border-red-200" : "border-emerald-200"}>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{t("vco_kpi_gap")}</div>
            <div className={`text-2xl font-bold mt-1 ${data.kpi.totaleGap > 0 ? "text-red-700" : "text-emerald-700"}`}>
              {data.kpi.totaleGap > 0 ? formatNumber(data.kpi.totaleGap) : "0"}
            </div>
            <div className="text-xs text-muted-foreground">{data.kpi.totaleGap > 0 ? t("vco_kpi_gap_pos") : t("vco_kpi_gap_neg")}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{t("vco_kpi_mesi")}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-bold text-emerald-600">{data.kpi.mesiOk}</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-lg font-bold text-red-600 ml-1">{data.kpi.mesiCritici}</span>
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-xs text-muted-foreground">{t("vco_kpi_mesi_sub")}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            {t("vco_tab_overview")}
          </TabsTrigger>
          <TabsTrigger value="detail" className="gap-1.5">
            <Eye className="h-4 w-4" />
            {t("vco_tab_detail")}
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5">
            <Package className="h-4 w-4" />
            {t("vco_tab_orders")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                {t("vco_chart_title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v: number) => formatNumber(v)} tick={{ fontSize: 11 }} />
                  <RechartsTooltip
                    formatter={(value: number, name: string) => [formatNumber(value), name]}
                    labelFormatter={(label: string) => `${t("vco_month_prefix")}${label}`}
                  />
                  <Legend />
                  <Bar dataKey="giacenza" name={t("vco_chart_giacenza")} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ordini" name={t("vco_chart_ordini")} fill="#a855f7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="soddisfatti" name={t("vco_chart_soddisfatti")} fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gap" name={t("vco_chart_gap")} fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t("vco_timeline_title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background z-10 min-w-[100px]">{t("vco_col_mese")}</TableHead>
                      <TableHead className="text-right">{t("vco_col_giacenza")}</TableHead>
                      <TableHead className="text-right">{t("vco_col_ordini")}</TableHead>
                      <TableHead className="text-right">{t("vco_col_soddisfatti")}</TableHead>
                      <TableHead className="text-right">{t("vco_col_gap")}</TableHead>
                      <TableHead className="text-center">{t("vco_col_copertura")}</TableHead>
                      <TableHead className="text-right">{t("vco_col_residuo")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.timeline.map(snap => (
                      <TableRow key={snap.month} className={snap.totaleGap > 0 ? "bg-red-50/50" : ""}>
                        <TableCell className="sticky left-0 bg-background z-10 font-medium">{snap.monthName}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatNumber(snap.totaleGiacenzaPre)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatNumber(snap.totaleOrdini)}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-emerald-700">{formatNumber(snap.totaleSoddisfatti)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {snap.totaleGap > 0 ? <span className="text-red-600 font-bold">{formatNumber(snap.totaleGap)}</span> : <span className="text-gray-400">-</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={`${getCoverageColor(snap.coperturaPctGlobale)} text-white border-0 min-w-[50px]`}>
                            {snap.coperturaPctGlobale}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-muted-foreground">{formatNumber(snap.totaleGiacenzaPost)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {sizesWithOrders.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-orange-600" />
                  {t("vco_riepilogo_taglia")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {sizesWithOrders.map(([size, info]) => (
                    <div
                      key={size}
                      className={`rounded-lg border p-3 cursor-pointer transition-all hover:shadow-md ${getCoverageBg(info.coperturaPct)} ${selectedSize === size ? "ring-2 ring-blue-500" : ""}`}
                      onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm">{size}</span>
                        <Badge className={`${getCoverageColor(info.coperturaPct)} text-white border-0`}>
                          {info.coperturaPct}%
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("vco_giacenza_iniziale")}</span>
                          <span className="font-mono">{formatNumber(info.giacenzaIniziale)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("vco_ordini_totali_label")}</span>
                          <span className="font-mono">{formatNumber(info.totaleOrdini)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("vco_soddisfacibili")}</span>
                          <span className="font-mono text-emerald-700">{formatNumber(info.totaleSoddisfatti)}</span>
                        </div>
                        {info.totaleGap > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t("vco_gap_label")}</span>
                            <span className="font-mono text-red-600 font-bold">{formatNumber(info.totaleGap)}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${getCoverageColor(info.coperturaPct)}`}
                            style={{ width: `${Math.min(100, info.coperturaPct)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="detail" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t("vco_matrice_title")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("vco_matrice_sub")}</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-[70vh] border rounded-md relative">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b">
                      <th className="sticky top-0 left-0 z-30 bg-slate-100 dark:bg-slate-800 h-10 px-2 text-left align-middle font-bold text-sm text-muted-foreground min-w-[100px] shadow-[2px_2px_4px_rgba(0,0,0,0.08)]">{t("vco_col_taglia")}</th>
                      <th className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 h-10 px-2 text-right align-middle font-bold text-sm text-muted-foreground min-w-[90px]">{t("vco_col_giac_iniz")}</th>
                      {data.timeline.map(snap => (
                        <th key={snap.month} className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 h-10 px-2 text-center align-middle font-bold text-sm text-muted-foreground min-w-[130px]">{snap.monthShort}</th>
                      ))}
                      <th className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 h-10 px-2 text-center align-middle font-bold text-sm text-muted-foreground min-w-[80px]">{t("vco_col_tot_pct")}</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {sizesAll
                      .filter(([size]) => {
                        if (selectedSize) return size === selectedSize;
                        const r = data.riepilogoPerTaglia[size];
                        return r && (r.totaleOrdini > 0 || r.giacenzaIniziale > 0);
                      })
                      .map(([size, riepilogo]) => (
                        <tr key={size} className="border-b transition-colors hover:bg-muted/50">
                          <td className="sticky left-0 bg-background z-10 p-2 align-middle font-bold text-sm">{size}</td>
                          <td className="p-2 align-middle text-right font-mono text-sm text-blue-700">
                            {riepilogo.giacenzaIniziale > 0 ? formatNumber(riepilogo.giacenzaIniziale) : <span className="text-gray-300">-</span>}
                          </td>
                          {data.timeline.map(snap => {
                            const cell = snap.perTaglia[size];
                            if (!cell || (cell.giacenzaPre === 0 && cell.ordini === 0)) {
                              return <td key={snap.month} className="p-2 align-middle text-center text-gray-300 text-sm">-</td>;
                            }
                            return (
                              <td key={snap.month} className={`text-center text-sm p-1.5 align-middle ${cell.ordini > 0 ? getCoverageBg(cell.coperturaPct) : ""}`}>
                                <div className="space-y-0.5">
                                  <div className="font-mono text-blue-700 font-medium">{formatNumber(cell.giacenzaPre)}</div>
                                  {cell.ordini > 0 && (
                                    <>
                                      <div className="font-mono text-purple-700">{formatNumber(cell.ordini)}</div>
                                      {cell.gap > 0 ? (
                                        <div className="font-mono text-red-600 font-bold">-{formatNumber(cell.gap)}</div>
                                      ) : (
                                        <div className="font-mono text-emerald-600 font-semibold">OK</div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                          <td className="p-2 align-middle text-center">
                            {riepilogo.totaleOrdini > 0 ? (
                              <Badge className={`${getCoverageColor(riepilogo.coperturaPct)} text-white border-0 text-sm`}>
                                {riepilogo.coperturaPct}%
                              </Badge>
                            ) : (
                              <span className="text-gray-300 text-sm">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-blue-600" /> {t("vco_legend_giacenza")}</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-purple-600" /> {t("vco_legend_ordini")}</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-red-500" /> {t("vco_legend_gap")}</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-emerald-500" /> {t("vco_legend_coperto")}</span>
              </div>

              {selectedSize && (
                <div className="mt-3">
                  <Button variant="outline" size="sm" onClick={() => setSelectedSize(null)}>
                    {t("vco_mostra_tutte")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-600" />
                {t("vco_ordini_attivi")} ({data.ordiniDettaglio.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.ordiniDettaglio.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>{t("vco_nessun_ordine_pre")} {year}.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>{t("vco_col_cliente")}</TableHead>
                        <TableHead>{t("vco_col_taglia")}</TableHead>
                        <TableHead className="text-right">{t("vco_col_quantita")}</TableHead>
                        <TableHead className="text-right">{t("vco_col_qty_mese")}</TableHead>
                        <TableHead>{t("vco_col_periodo")}</TableHead>
                        <TableHead>{t("vco_col_stato")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.ordiniDettaglio.map(o => (
                        <TableRow key={o.ordineId}>
                          <TableCell className="font-mono text-xs">#{o.ordineId}</TableCell>
                          <TableCell className="font-medium text-sm">{o.clienteNome}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {o.saleSize || o.taglia}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatNumber(o.quantita)}</TableCell>
                          <TableCell className="text-right font-mono text-sm text-muted-foreground">{formatNumber(o.quantitaPerMese)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {!o.dataInizioConsegna && !o.dataFineConsegna 
                              ? <span className="text-amber-500 font-medium">{t("no_date")}</span>
                              : `${o.dataInizioConsegna || "?"} → ${o.dataFineConsegna || "?"}`}
                          </TableCell>
                          <TableCell>
                            <Badge variant={o.stato === "Completato" ? "default" : "secondary"} className="text-xs">
                              {o.stato}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
