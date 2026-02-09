import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, ShieldCheck, ShieldAlert, TrendingUp, Package, AlertTriangle, CheckCircle2, XCircle, Eye, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell } from "recharts";
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

    const wsOverview = wb.addWorksheet("Riepilogo Mensile");
    wsOverview.columns = [
      { header: "Mese", key: "mese", width: 14 },
      { header: "Giacenza Disponibile", key: "giacenza", width: 22 },
      { header: "Ordini", key: "ordini", width: 16 },
      { header: "Soddisfatti", key: "soddisfatti", width: 16 },
      { header: "Gap", key: "gap", width: 14 },
      { header: "Copertura %", key: "copertura", width: 14 },
      { header: "Giacenza Residua", key: "residua", width: 20 },
    ];
    data.timeline.forEach(t => {
      wsOverview.addRow({
        mese: t.monthName,
        giacenza: t.totaleGiacenzaPre,
        ordini: t.totaleOrdini,
        soddisfatti: t.totaleSoddisfatti,
        gap: t.totaleGap,
        copertura: t.coperturaPctGlobale,
        residua: t.totaleGiacenzaPost,
      });
    });
    styleSheet(wsOverview);

    const sizesWithData = Object.keys(data.riepilogoPerTaglia).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, "")) || 0;
      const numB = parseInt(b.replace(/\D/g, "")) || 0;
      return numA - numB;
    });

    const wsDetail = wb.addWorksheet("Dettaglio Taglie");
    const detailCols: Partial<ExcelJS.Column>[] = [
      { header: "Taglia", key: "taglia", width: 12 },
      { header: "Giac. Iniziale", key: "giacIniz", width: 16 },
      ...data.timeline.map(t => ({ header: `${t.monthShort} Giac`, key: `g${t.month}`, width: 14 })),
      ...data.timeline.map(t => ({ header: `${t.monthShort} Ord`, key: `o${t.month}`, width: 14 })),
      ...data.timeline.map(t => ({ header: `${t.monthShort} Gap`, key: `p${t.month}`, width: 14 })),
      { header: "Tot Ordini", key: "totOrd", width: 14 },
      { header: "Tot Soddisfatti", key: "totSodd", width: 16 },
      { header: "Tot Gap", key: "totGap", width: 12 },
      { header: "Copertura %", key: "cop", width: 14 },
    ];
    wsDetail.columns = detailCols;

    sizesWithData.forEach(size => {
      const r = data.riepilogoPerTaglia[size];
      const rowData: Record<string, string | number> = {
        taglia: size,
        giacIniz: r.giacenzaIniziale,
        totOrd: r.totaleOrdini,
        totSodd: r.totaleSoddisfatti,
        totGap: r.totaleGap,
        cop: r.coperturaPct,
      };
      data.timeline.forEach(t => {
        const cell = t.perTaglia[size];
        rowData[`g${t.month}`] = cell?.giacenzaPre || 0;
        rowData[`o${t.month}`] = cell?.ordini || 0;
        rowData[`p${t.month}`] = cell?.gap || 0;
      });
      wsDetail.addRow(rowData);
    });
    styleSheet(wsDetail);

    if (data.ordiniDettaglio.length > 0) {
      const wsOrdini = wb.addWorksheet("Ordini Dettaglio");
      wsOrdini.columns = [
        { header: "ID Ordine", key: "id", width: 10 },
        { header: "Cliente", key: "cliente", width: 25 },
        { header: "Taglia", key: "taglia", width: 12 },
        { header: "Taglia Vendita", key: "saleSize", width: 14 },
        { header: "Quantità Totale", key: "qty", width: 18 },
        { header: "Quantità/Mese", key: "qtyMese", width: 16 },
        { header: "Mesi", key: "mesi", width: 8 },
        { header: "Data Inizio", key: "inizio", width: 14 },
        { header: "Data Fine", key: "fine", width: 14 },
        { header: "Stato", key: "stato", width: 14 },
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
          <p className="text-muted-foreground">Simulazione in corso...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">Errore nel caricamento dei dati di copertura.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const chartData = data.timeline.map(t => ({
    name: t.monthShort,
    giacenza: t.totaleGiacenzaPre,
    ordini: t.totaleOrdini,
    soddisfatti: t.totaleSoddisfatti,
    gap: t.totaleGap,
    copertura: t.coperturaPctGlobale,
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
            Verifica Copertura Ordini
          </h1>
          <p className="text-muted-foreground mt-1">
            Simulazione dinamica: giacenze crescono, ordini si soddisfano, gap emergono
          </p>
        </div>
        <div className="flex items-center gap-3">
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
          <Button variant="outline" onClick={exportExcel} className="gap-2">
            <Download className="h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      {!data.dbEsternoDisponibile && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Database esterno non disponibile. La simulazione usa solo la giacenza attuale senza ordini.</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-blue-200">
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Giacenza Attuale</div>
            <div className="text-2xl font-bold text-blue-700 mt-1">{formatNumber(data.kpi.totaleGiacenzaIniziale)}</div>
            <div className="text-xs text-muted-foreground">animali totali</div>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Ordini Anno</div>
            <div className="text-2xl font-bold text-purple-700 mt-1">{formatNumber(data.kpi.totaleOrdiniAnno)}</div>
            <div className="text-xs text-muted-foreground">da soddisfare</div>
          </CardContent>
        </Card>

        <Card className={`border-2 ${data.kpi.coperturaPctGlobale >= 100 ? "border-emerald-300" : data.kpi.coperturaPctGlobale >= 75 ? "border-yellow-300" : "border-red-300"}`}>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Copertura</div>
            <div className={`text-2xl font-bold mt-1 ${data.kpi.coperturaPctGlobale >= 100 ? "text-emerald-700" : data.kpi.coperturaPctGlobale >= 75 ? "text-yellow-700" : "text-red-700"}`}>
              {data.kpi.coperturaPctGlobale}%
            </div>
            <div className="text-xs text-muted-foreground">{formatNumber(data.kpi.totaleSoddisfacibili)} soddisfacibili</div>
          </CardContent>
        </Card>

        <Card className={data.kpi.totaleGap > 0 ? "border-red-200" : "border-emerald-200"}>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Gap Totale</div>
            <div className={`text-2xl font-bold mt-1 ${data.kpi.totaleGap > 0 ? "text-red-700" : "text-emerald-700"}`}>
              {data.kpi.totaleGap > 0 ? formatNumber(data.kpi.totaleGap) : "0"}
            </div>
            <div className="text-xs text-muted-foreground">{data.kpi.totaleGap > 0 ? "animali mancanti" : "nessun gap"}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Mesi</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-bold text-emerald-600">{data.kpi.mesiOk}</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-lg font-bold text-red-600 ml-1">{data.kpi.mesiCritici}</span>
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-xs text-muted-foreground">ok / critici</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Panoramica
          </TabsTrigger>
          <TabsTrigger value="detail" className="gap-1.5">
            <Eye className="h-4 w-4" />
            Dettaglio
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5">
            <Package className="h-4 w-4" />
            Ordini
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Evoluzione Mensile
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
                    labelFormatter={(label: string) => `Mese: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="giacenza" name="Giacenza Disponibile" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="soddisfatti" name="Ordini Soddisfatti" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gap" name="Gap" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.gap > 0 ? "#ef4444" : "#d1d5db"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Timeline Mensile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background z-10 min-w-[100px]">Mese</TableHead>
                      <TableHead className="text-right">Giacenza</TableHead>
                      <TableHead className="text-right">Ordini</TableHead>
                      <TableHead className="text-right">Soddisfatti</TableHead>
                      <TableHead className="text-right">Gap</TableHead>
                      <TableHead className="text-center">Copertura</TableHead>
                      <TableHead className="text-right">Residuo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.timeline.map(t => (
                      <TableRow key={t.month} className={t.totaleGap > 0 ? "bg-red-50/50" : ""}>
                        <TableCell className="sticky left-0 bg-background z-10 font-medium">{t.monthName}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatNumber(t.totaleGiacenzaPre)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatNumber(t.totaleOrdini)}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-emerald-700">{formatNumber(t.totaleSoddisfatti)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {t.totaleGap > 0 ? <span className="text-red-600 font-bold">{formatNumber(t.totaleGap)}</span> : <span className="text-gray-400">-</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={`${getCoverageColor(t.coperturaPctGlobale)} text-white border-0 min-w-[50px]`}>
                            {t.coperturaPctGlobale}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-muted-foreground">{formatNumber(t.totaleGiacenzaPost)}</TableCell>
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
                  Riepilogo per Taglia (solo con ordini)
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
                          <span className="text-muted-foreground">Giacenza iniziale:</span>
                          <span className="font-mono">{formatNumber(info.giacenzaIniziale)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ordini totali:</span>
                          <span className="font-mono">{formatNumber(info.totaleOrdini)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Soddisfacibili:</span>
                          <span className="font-mono text-emerald-700">{formatNumber(info.totaleSoddisfatti)}</span>
                        </div>
                        {info.totaleGap > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Gap:</span>
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
              <CardTitle className="text-lg">Matrice Taglia x Mese</CardTitle>
              <p className="text-sm text-muted-foreground">Giacenza disponibile / Ordini / Gap per ogni combinazione. Celle colorate in base alla copertura.</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-[70vh] relative">
                <Table>
                  <TableHeader className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 shadow-sm">
                    <TableRow>
                      <TableHead className="sticky left-0 z-30 bg-slate-100 dark:bg-slate-800 min-w-[100px] font-bold text-sm">Taglia</TableHead>
                      <TableHead className="text-right min-w-[90px] font-bold text-sm">Giac. Iniz.</TableHead>
                      {data.timeline.map(t => (
                        <TableHead key={t.month} className="text-center min-w-[130px] font-bold text-sm">{t.monthShort}</TableHead>
                      ))}
                      <TableHead className="text-center min-w-[80px] font-bold text-sm">Tot %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sizesAll
                      .filter(([size]) => {
                        if (selectedSize) return size === selectedSize;
                        const r = data.riepilogoPerTaglia[size];
                        return r && (r.totaleOrdini > 0 || r.giacenzaIniziale > 0);
                      })
                      .map(([size, riepilogo]) => (
                        <TableRow key={size}>
                          <TableCell className="sticky left-0 bg-background z-10 font-bold text-sm">{size}</TableCell>
                          <TableCell className="text-right font-mono text-sm text-blue-700">
                            {riepilogo.giacenzaIniziale > 0 ? formatNumber(riepilogo.giacenzaIniziale) : <span className="text-gray-300">-</span>}
                          </TableCell>
                          {data.timeline.map(t => {
                            const cell = t.perTaglia[size];
                            if (!cell || (cell.giacenzaPre === 0 && cell.ordini === 0)) {
                              return <TableCell key={t.month} className="text-center text-gray-300 text-sm">-</TableCell>;
                            }
                            return (
                              <TableCell key={t.month} className={`text-center text-sm p-1.5 ${cell.ordini > 0 ? getCoverageBg(cell.coperturaPct) : ""}`}>
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
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center">
                            {riepilogo.totaleOrdini > 0 ? (
                              <Badge className={`${getCoverageColor(riepilogo.coperturaPct)} text-white border-0 text-sm`}>
                                {riepilogo.coperturaPct}%
                              </Badge>
                            ) : (
                              <span className="text-gray-300 text-sm">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-blue-600" /> Giacenza</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-purple-600" /> Ordini</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-red-500" /> Gap</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-emerald-500" /> Coperto</span>
              </div>

              {selectedSize && (
                <div className="mt-3">
                  <Button variant="outline" size="sm" onClick={() => setSelectedSize(null)}>
                    Mostra tutte le taglie
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
                Ordini Attivi ({data.ordiniDettaglio.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.ordiniDettaglio.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>Nessun ordine trovato per il {year}.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Taglia</TableHead>
                        <TableHead className="text-right">Quantità</TableHead>
                        <TableHead className="text-right">Qty/Mese</TableHead>
                        <TableHead>Periodo</TableHead>
                        <TableHead>Stato</TableHead>
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
                            {o.dataInizioConsegna || "?"} → {o.dataFineConsegna || "?"}
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
