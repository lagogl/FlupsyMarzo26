import { useState, useMemo } from "react";
import { getQueryFn } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2Icon, AlertCircleIcon, Download, Calendar, Users, Clock } from "lucide-react";
import { format, differenceInDays, parseISO, addDays } from "date-fns";
import { it } from "date-fns/locale";
import { Link } from "wouter";
import * as ExcelJS from 'exceljs';

interface TargetSizePrediction {
  id: number;
  basketId: number;
  targetSizeId: number;
  status: string;
  predictedDate: string;
  basket: {
    id: number;
    physicalNumber: number;
    flupsyId: number;
    row: string | null;
    position: number | null;
  };
  lastOperation?: {
    id: number;
    date: string;
    animalsPerKg: number | null;
    averageWeight: number | null;
    animalCount?: number | null;
    mortalityRate?: number | null;
  } | null;
  daysRemaining: number;
  currentWeight?: number;
  targetWeight?: number;
  actualSize?: Size;
  requestedSize?: Size;
  animalCount?: number;
  // Calcolati dal backend con SGR per taglia/mese + mortalità da projection_mortality_rates
  projectedAnimalCount?: number;
  projectedAnimalsPerKg?: number | null;
}

// Helper: ricava la proiezione del backend con fallback su current count (per cesta a target oggi)
function getProjectedCount(p: TargetSizePrediction): number {
  if (typeof p.projectedAnimalCount === 'number') return p.projectedAnimalCount;
  return p.animalCount || p.lastOperation?.animalCount || 0;
}

// Mortalità giornaliera fallback (deprecata: ora il backend fornisce projectedAnimalCount)
const DAILY_MORTALITY = 0.002; // mantenuta per compat. con eventuali tooltip; non usata nei calcoli

interface Flupsy {
  id: number;
  name: string;
}

interface Size {
  id: number;
  code: string;
  name: string;
  minAnimalsPerKg?: number;
  maxAnimalsPerKg?: number;
}

type FilterMode = "days" | "date" | "animals";

const today = new Date();
const todayStr = format(today, "yyyy-MM-dd");
const maxDateStr = format(addDays(today, 365), "yyyy-MM-dd");

export function TargetSizePredictions() {
  const [days, setDays] = useState(14);
  const [targetSize, setTargetSize] = useState("TP-3000");
  const [filterMode, setFilterMode] = useState<FilterMode>("days");
  const [customDate, setCustomDate] = useState(format(addDays(today, 30), "yyyy-MM-dd"));
  const [animalTarget, setAnimalTarget] = useState<string>("1000000");

  // Compute effective days for API call
  const effectiveDays = useMemo(() => {
    if (filterMode === "days") return days;
    if (filterMode === "date") {
      const d = differenceInDays(parseISO(customDate), today);
      return Math.max(0, d);
    }
    // For animal mode, fetch a wide window and filter on frontend
    return 365;
  }, [filterMode, days, customDate]);

  const { data: sizes } = useQuery({
    queryKey: ['/api/sizes'],
    queryFn: getQueryFn<Size[]>({ on401: "throw" }),
  });

  const { data: flupsys } = useQuery({
    queryKey: ['/api/flupsys'],
    queryFn: getQueryFn<Flupsy[]>({ on401: "throw" }),
  });

  const flupsyNameMap = flupsys?.reduce((acc, f) => {
    acc[f.id] = f.name;
    return acc;
  }, {} as Record<number, string>) || {};

  const { data: allPredictions, isLoading, isError } = useQuery({
    queryKey: [`/api/size-predictions?size=${targetSize}&days=${effectiveDays}`, targetSize, effectiveDays],
    queryFn: getQueryFn<TargetSizePrediction[]>({ on401: "throw" }),
  });

  // For animal mode: walk through sorted predictions until target is met
  const parsedAnimalTarget = parseInt(animalTarget.replace(/\D/g, ""), 10) || 0;

  const { predictions, animalCoverageReachedAt } = useMemo(() => {
    if (!allPredictions) return { predictions: [], animalCoverageReachedAt: -1 };
    if (filterMode !== "animals") return { predictions: allPredictions, animalCoverageReachedAt: -1 };

    // Sort by days ascending (should already be, but ensure)
    const sorted = [...allPredictions].sort((a, b) => a.daysRemaining - b.daysRemaining);
    let cumulative = 0;
    let coverageIdx = -1;
    for (let i = 0; i < sorted.length; i++) {
      cumulative += (sorted[i].animalCount || sorted[i].lastOperation?.animalCount || 0);
      if (coverageIdx === -1 && cumulative >= parsedAnimalTarget) {
        coverageIdx = i;
      }
    }
    // Show all predictions (user can see how many are needed)
    return { predictions: sorted, animalCoverageReachedAt: coverageIdx };
  }, [allPredictions, filterMode, parsedAnimalTarget]);

  // Running cumulative for animal mode display
  const cumulativeByIndex = useMemo(() => {
    if (filterMode !== "animals" || !predictions) return [];
    const result: number[] = [];
    let sum = 0;
    predictions.forEach(p => {
      sum += (p.animalCount || p.lastOperation?.animalCount || 0);
      result.push(sum);
    });
    return result;
  }, [predictions, filterMode]);

  const visiblePredictions = useMemo(() => {
    if (filterMode !== "animals" || animalCoverageReachedAt === -1) return predictions;
    // Show one extra row after coverage is reached for context
    return predictions.slice(0, animalCoverageReachedAt + 2);
  }, [predictions, filterMode, animalCoverageReachedAt]);

  const totalAnimals = visiblePredictions?.reduce((sum, p) => {
    const count = p.animalCount || p.lastOperation?.animalCount || 0;
    return sum + count;
  }, 0) || 0;

  const totalBaskets = visiblePredictions?.length || 0;

  const avgWeight = visiblePredictions && visiblePredictions.length > 0
    ? Math.round(visiblePredictions.reduce((sum, p) => sum + (p.currentWeight || 0), 0) / visiblePredictions.length)
    : 0;

  const formatDateIT = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: it });
    } catch {
      return dateStr;
    }
  };

  const getBadgeStyle = (daysRemaining: number) => {
    if (daysRemaining <= 3) return "bg-emerald-500 hover:bg-emerald-600";
    if (daysRemaining <= 7) return "bg-amber-500 hover:bg-amber-600";
    return "bg-red-500 hover:bg-red-600";
  };

  const getDaysMessage = (daysRemaining: number) => {
    if (daysRemaining === 0) return "Oggi";
    if (daysRemaining === 1) return "Domani";
    return `Tra ${daysRemaining} giorni`;
  };

  const descriptionText = useMemo(() => {
    if (filterMode === "days") {
      return `Previsioni di crescita verso la taglia commerciale ${targetSize}${days === 14 ? " (prossime 2 settimane)" : ` (prossimi ${days} giorni)`}`;
    }
    if (filterMode === "date") {
      return `Previsioni di crescita verso la taglia commerciale ${targetSize} entro il ${format(parseISO(customDate), "dd/MM/yyyy", { locale: it })}`;
    }
    return `Ceste necessarie per raggiungere ${parsedAnimalTarget.toLocaleString('it-IT')} animali a ${targetSize}`;
  }, [filterMode, days, customDate, targetSize, parsedAnimalTarget]);

  const exportToExcel = async () => {
    if (!visiblePredictions || visiblePredictions.length === 0) return;

    const ExcelModule = (ExcelJS as any).default || ExcelJS;
    const workbook = new ExcelModule.Workbook();
    const ws = workbook.addWorksheet('Ceste in Arrivo');

    const titleRow = ws.addRow([`Ceste in arrivo a ${targetSize} - ${descriptionText} - ${format(new Date(), 'dd/MM/yyyy HH:mm')}`]);
    titleRow.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    ws.mergeCells(1, 1, 1, 13);
    titleRow.alignment = { horizontal: 'center' };

    const headers = ['Cesta', 'FLUPSY', 'Posizione', 'Animali ora', 'An/kg ora', 'Peso Medio (mg)', 'Attuale (mg)', 'Target (mg)', 'Incremento %', 'Data Arrivo', 'Giorni', 'Animali alla data', 'An/kg alla data'];
    const headerRow = ws.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    headerRow.alignment = { horizontal: 'center' };
    ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: 13 } };

    ws.columns = [
      { width: 10 }, { width: 15 }, { width: 12 }, { width: 14 },
      { width: 12 }, { width: 16 }, { width: 14 }, { width: 14 },
      { width: 14 }, { width: 14 }, { width: 10 }, { width: 16 }, { width: 14 }
    ];

    visiblePredictions.forEach((p, idx) => {
      const animalCount = p.animalCount || p.lastOperation?.animalCount || 0;
      const animalsPerKg = p.lastOperation?.animalsPerKg || 0;
      const avgWt = p.lastOperation?.averageWeight || 0;
      const currentWt = p.currentWeight || 0;
      const targetWt = p.targetWeight || 0;
      const increment = currentWt > 0 ? Math.round((targetWt / currentWt - 1) * 100) : 0;
      const position = p.basket.row && p.basket.position ? `${p.basket.row}-${p.basket.position}` : '';
      const projectedCount = getProjectedCount(p);
      const projectedAnkg = p.projectedAnimalsPerKg ?? (p.daysRemaining > 0 && targetWt > 0 ? Math.round(1_000_000 / targetWt) : animalsPerKg);

      const row = ws.addRow([
        p.basket.physicalNumber,
        flupsyNameMap[p.basket.flupsyId] || '',
        position,
        animalCount,
        animalsPerKg,
        Math.round(avgWt),
        Math.round(currentWt),
        Math.round(targetWt),
        increment,
        formatDateIT(p.predictedDate),
        p.daysRemaining,
        projectedCount,
        projectedAnkg
      ]);

      if (idx % 2 === 1) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      }
      row.getCell(4).numFmt = '#,##0';
      row.getCell(5).numFmt = '#,##0';
      row.getCell(6).numFmt = '#,##0';
      row.getCell(7).numFmt = '#,##0';
      row.getCell(8).numFmt = '#,##0';
      row.getCell(9).numFmt = '0"%"';
      row.getCell(12).numFmt = '#,##0';
      row.getCell(13).numFmt = '#,##0';
    });

    const totalProjected = visiblePredictions.reduce((s, p) => s + getProjectedCount(p), 0);
    const totalsRow = ws.addRow(['TOTALE', '', '', totalAnimals, '', '', '', '', '', `${totalBaskets} ceste`, '', totalProjected, '']);
    totalsRow.font = { bold: true };
    totalsRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
    totalsRow.getCell(4).numFmt = '#,##0';
    totalsRow.getCell(12).numFmt = '#,##0';

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ceste-Arrivo-${targetSize}_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-6">
            {totalAnimals > 0 && (
              <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg px-4 py-2 min-w-[110px]">
                <span className="text-3xl font-bold text-primary">
                  {totalAnimals.toLocaleString('it-IT')}
                </span>
                <span className="text-xs text-muted-foreground">animali totali</span>
              </div>
            )}
            <div>
              <CardTitle className="text-xl font-bold">Ceste in arrivo a {targetSize}</CardTitle>
              <CardDescription>{descriptionText}</CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Size selector */}
            <div className="w-40">
              <Select value={targetSize} onValueChange={setTargetSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Taglia target" />
                </SelectTrigger>
                <SelectContent>
                  {sizes?.map(size => (
                    <SelectItem key={size.id} value={size.code}>
                      {size.code} - {size.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mode toggle */}
            <div className="flex border rounded-md overflow-hidden">
              <button
                className={`px-2 py-1 text-xs flex items-center gap-1 transition-colors ${filterMode === "days" ? "bg-primary text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                onClick={() => setFilterMode("days")}
                title="Giorni predefiniti"
              >
                <Clock className="h-3 w-3" />
                Giorni
              </button>
              <button
                className={`px-2 py-1 text-xs flex items-center gap-1 border-l transition-colors ${filterMode === "date" ? "bg-primary text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                onClick={() => setFilterMode("date")}
                title="Data esatta"
              >
                <Calendar className="h-3 w-3" />
                Data
              </button>
              <button
                className={`px-2 py-1 text-xs flex items-center gap-1 border-l transition-colors ${filterMode === "animals" ? "bg-primary text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                onClick={() => setFilterMode("animals")}
                title="Target animali"
              >
                <Users className="h-3 w-3" />
                Animali
              </button>
            </div>

            {/* Contextual controls based on mode */}
            {filterMode === "days" && (
              <div className="flex gap-1">
                {[7, 14, 30, 90].map(d => (
                  <Button
                    key={d}
                    variant={days === d ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDays(d)}
                    className="text-xs px-2"
                  >
                    {d} {d === 7 ? "giorni" : d === 14 ? "giorni" : d === 30 ? "giorni" : "giorni"}
                  </Button>
                ))}
              </div>
            )}

            {filterMode === "date" && (
              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  value={customDate}
                  min={todayStr}
                  max={maxDateStr}
                  onChange={e => setCustomDate(e.target.value)}
                  className="h-8 text-xs w-36"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  ({effectiveDays} gg)
                </span>
              </div>
            )}

            {filterMode === "animals" && (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={animalTarget}
                  min="1"
                  step="100000"
                  onChange={e => setAnimalTarget(e.target.value)}
                  className="h-8 text-xs w-32"
                  placeholder="es. 1000000"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">animali</span>
              </div>
            )}

            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={exportToExcel}
              disabled={!visiblePredictions || visiblePredictions.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center p-8 text-red-500">
            <AlertCircleIcon className="mr-2" />
            Errore nel caricamento delle previsioni
          </div>
        ) : visiblePredictions?.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <CheckCircle2Icon size={48} className="mb-2 text-emerald-500" />
            <p className="text-center">
              {filterMode === "days" && `Nessuna cesta raggiungerà la taglia ${targetSize} nei prossimi ${days} giorni`}
              {filterMode === "date" && `Nessuna cesta raggiungerà la taglia ${targetSize} entro la data selezionata`}
              {filterMode === "animals" && `Nessuna cesta disponibile nei prossimi 365 giorni`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Animal mode: coverage info banner */}
            {filterMode === "animals" && parsedAnimalTarget > 0 && (
              <div className={`mb-3 px-3 py-2 rounded text-sm flex items-center gap-2 ${animalCoverageReachedAt >= 0 ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-amber-50 border border-amber-200 text-amber-800"}`}>
                {animalCoverageReachedAt >= 0 ? (
                  <>
                    <CheckCircle2Icon className="h-4 w-4 shrink-0" />
                    <span>
                      Target di <strong>{parsedAnimalTarget.toLocaleString('it-IT')}</strong> animali raggiunto con <strong>{animalCoverageReachedAt + 1} ceste</strong> entro il <strong>{formatDateIT(predictions[animalCoverageReachedAt].predictedDate)}</strong>
                      {" "}({predictions[animalCoverageReachedAt].daysRemaining === 0 ? "oggi" : `tra ${predictions[animalCoverageReachedAt].daysRemaining} giorni`})
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircleIcon className="h-4 w-4 shrink-0" />
                    <span>
                      Target di <strong>{parsedAnimalTarget.toLocaleString('it-IT')}</strong> animali non raggiungibile nei prossimi 365 giorni. Disponibili: <strong>{(allPredictions?.reduce((s, p) => s + (p.animalCount || p.lastOperation?.animalCount || 0), 0) || 0).toLocaleString('it-IT')}</strong>
                    </span>
                  </>
                )}
              </div>
            )}

            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-left">
                  <th className="px-3 py-2 font-semibold">Cesta</th>
                  <th className="px-3 py-2 font-semibold">FLUPSY</th>
                  <th className="px-3 py-2 font-semibold text-right">Animali ora</th>
                  {filterMode === "animals" && <th className="px-3 py-2 font-semibold text-right">Progressivo</th>}
                  <th className="px-3 py-2 font-semibold text-right">An/kg ora</th>
                  <th className="px-3 py-2 font-semibold text-right">Peso Medio</th>
                  <th className="px-3 py-2 font-semibold text-right">Attuale</th>
                  <th className="px-3 py-2 font-semibold text-right">Target</th>
                  <th className="px-3 py-2 font-semibold text-right">Incr. %</th>
                  <th className="px-3 py-2 font-semibold">Data Arrivo</th>
                  <th className="px-3 py-2 font-semibold text-right bg-blue-50">Animali alla data</th>
                  <th className="px-3 py-2 font-semibold text-right bg-blue-50">An/kg alla data</th>
                  <th className="px-3 py-2 font-semibold text-center">Stato</th>
                </tr>
              </thead>
              <tbody>
                {visiblePredictions?.map((p, idx) => {
                  const animalCount = p.animalCount || p.lastOperation?.animalCount || 0;
                  const animalsPerKg = p.lastOperation?.animalsPerKg || 0;
                  const avgWt = p.lastOperation?.averageWeight || 0;
                  const currentWt = p.currentWeight || 0;
                  const targetWt = p.targetWeight || 0;
                  const increment = currentWt > 0 ? Math.round((targetWt / currentWt - 1) * 100) : 0;
                  const cumulative = filterMode === "animals" ? cumulativeByIndex[idx] : 0;
                  const isCoverageRow = filterMode === "animals" && idx === animalCoverageReachedAt;
                  const isAfterCoverage = filterMode === "animals" && animalCoverageReachedAt >= 0 && idx > animalCoverageReachedAt;
                  const progressPct = filterMode === "animals" && parsedAnimalTarget > 0
                    ? Math.min(100, Math.round((cumulative / parsedAnimalTarget) * 100))
                    : 0;
                  // Proiezioni alla data di arrivo (calcolate dal backend con SGR + mortalità per taglia/mese)
                  const projectedCount = getProjectedCount(p);
                  const projectedAnkg = p.projectedAnimalsPerKg ?? (p.daysRemaining > 0 && targetWt > 0 ? Math.round(1_000_000 / targetWt) : animalsPerKg);
                  const projectedDiff = projectedCount - animalCount;

                  return (
                    <tr
                      key={p.id}
                      className={`${isCoverageRow ? 'bg-emerald-50 ring-1 ring-emerald-300' : isAfterCoverage ? 'bg-gray-50 opacity-60' : idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}
                    >
                      <td className="px-3 py-2">
                        <Link to={`/baskets/${p.basketId}`}>
                          <span className="font-medium text-blue-600 hover:underline">#{p.basket.physicalNumber}</span>
                        </Link>
                        {p.basket.row && p.basket.position && (
                          <span className="ml-1 text-xs text-gray-500">{p.basket.row}-{p.basket.position}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-700">{flupsyNameMap[p.basket.flupsyId] || '-'}</td>
                      <td className="px-3 py-2 text-right font-medium">{animalCount.toLocaleString('it-IT')}</td>
                      {filterMode === "animals" && (
                        <td className="px-3 py-2 text-right">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className={`font-medium ${isCoverageRow ? 'text-emerald-700' : 'text-gray-700'}`}>
                              {cumulative.toLocaleString('it-IT')}
                            </span>
                            <div className="w-20 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${progressPct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{progressPct}%</span>
                          </div>
                        </td>
                      )}
                      <td className="px-3 py-2 text-right">{animalsPerKg.toLocaleString('it-IT')}</td>
                      <td className="px-3 py-2 text-right">{Math.round(avgWt).toLocaleString('it-IT')} mg</td>
                      <td className="px-3 py-2 text-right">{Math.round(currentWt).toLocaleString('it-IT')} mg</td>
                      <td className="px-3 py-2 text-right">{Math.round(targetWt).toLocaleString('it-IT')} mg</td>
                      <td className="px-3 py-2 text-right">
                        <span className={increment > 50 ? 'text-amber-600' : increment > 20 ? 'text-blue-600' : 'text-green-600'}>
                          {increment}%
                        </span>
                      </td>
                      <td className="px-3 py-2">{formatDateIT(p.predictedDate)}</td>
                      <td className="px-3 py-2 text-right bg-blue-50/50">
                        <span className="font-medium">{projectedCount.toLocaleString('it-IT')}</span>
                        {p.daysRemaining > 0 && (
                          <div className="text-xs text-red-500">
                            {projectedDiff.toLocaleString('it-IT')}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right bg-blue-50/50">
                        <span className="font-medium">{projectedAnkg.toLocaleString('it-IT')}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge className={`text-xs ${getBadgeStyle(p.daysRemaining)}`}>
                          {getDaysMessage(p.daysRemaining)}
                        </Badge>
                        {isCoverageRow && (
                          <div className="text-xs text-emerald-700 font-semibold mt-0.5">✓ Target</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-200 font-semibold">
                  <td className="px-3 py-2">TOTALE</td>
                  <td className="px-3 py-2">{totalBaskets} ceste</td>
                  <td className="px-3 py-2 text-right">{totalAnimals.toLocaleString('it-IT')}</td>
                  {filterMode === "animals" && (
                    <td className="px-3 py-2 text-right text-xs text-gray-600">
                      {parsedAnimalTarget > 0 ? `/ ${parsedAnimalTarget.toLocaleString('it-IT')} target` : ''}
                    </td>
                  )}
                  <td className="px-3 py-2 text-right">-</td>
                  <td className="px-3 py-2 text-right">{avgWeight.toLocaleString('it-IT')} mg</td>
                  <td className="px-3 py-2" colSpan={3}></td>
                  <td className="px-3 py-2 text-right bg-blue-50/50 font-semibold">
                    {(visiblePredictions?.reduce((s, p) => s + getProjectedCount(p), 0) || 0).toLocaleString('it-IT')}
                  </td>
                  <td className="px-3 py-2 bg-blue-50/50"></td>
                  <td className="px-3 py-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
