import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { AlertTriangle, LayoutGrid, TrendingUp, TrendingDown, Minus, Scale, Clock, Tag, Settings2, ChevronDown, ChevronUp } from "lucide-react";

// --- Helpers ---

function fmtAnimals(n: number | null | undefined): string {
  if (n == null || n === 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

function getSizeCodeFromAnimalsPerKg(animalsPerKg: number, sizes: any[]): string {
  if (!animalsPerKg || !sizes?.length) return "N/D";
  const match = sizes.find((s: any) => {
    const min = s.minAnimalsPerKg ?? s.min_animals_per_kg;
    const max = s.maxAnimalsPerKg ?? s.max_animals_per_kg;
    if (min == null || max == null) return false;
    return animalsPerKg >= Number(min) && animalsPerKg <= Number(max);
  });
  return match?.code ?? "N/D";
}

// Calcola la taglia "stimata dal peso" quando l'ultima op è peso
// e differisce dalla taglia ufficiale registrata (da ultima misura/prima-attivazione)
function getWeightedSizeInfo(
  op: any,
  sizes: any[],
): { code: string; differs: boolean; grew: boolean } | null {
  if (!op || op.type !== "peso") return null;
  const pesoApk = op.animalsPerKg;
  const measApk = op.measurementAnimalsPerKg;
  if (!pesoApk || !measApk) return null;
  const pesoSize = getSizeCodeFromAnimalsPerKg(pesoApk, sizes);
  const measSize = getSizeCodeFromAnimalsPerKg(measApk, sizes);
  if (pesoSize === "N/D" || measSize === "N/D") return null;
  return {
    code: pesoSize,
    differs: pesoSize !== measSize,
    grew: pesoApk < measApk, // meno animali/kg = animali più grandi = cresciuti
  };
}

// Returns { bg, text } hex colors for a TP-XXXX code
// TP-3000 e oltre = vendibili → tutte tonalità di verde
// Sotto TP-3000 = non vendibili → rosso/ambra/giallo
function getSizeHexColor(sizeCode: string): { bg: string; text: string } {
  if (!sizeCode || !sizeCode.startsWith("TP-")) return { bg: "#f1f5f9", text: "#64748b" };
  const num = parseInt(sizeCode.substring(3));
  if (num <= 500)   return { bg: "#dc2626", text: "#fff" };   // red-600
  if (num <= 1000)  return { bg: "#ef4444", text: "#fff" };   // red-500
  if (num <= 2000)  return { bg: "#f59e0b", text: "#fff" };   // amber-500
  // === Soglia vendibilità ===
  if (num <= 3000)  return { bg: "#4ade80", text: "#fff" };   // green-400 (TP-3000 — soglia)
  if (num <= 6000)  return { bg: "#22c55e", text: "#fff" };   // green-500
  if (num <= 10000) return { bg: "#15803d", text: "#fff" };   // green-700
  return { bg: "#064e3b", text: "#fff" };                      // green-900
}

// Readable name for legend
const LEGEND_ENTRIES = [
  { code: "TP-500",   label: "Seme" },
  { code: "TP-1000",  label: "Piccolo" },
  { code: "TP-2000",  label: "Pre-crescita" },
  { code: "TP-3000",  label: "Quasi vendibile" },
  { code: "TP-6000",  label: "Accrescimento" },
  { code: "TP-10000", label: "Grande" },
];

// --- Alert metadata ---

const ALERT_META: Record<string, { label: string; colorClass: string }> = {
  weightDecrease:    { label: "Peso in calo",         colorClass: "bg-red-100 text-red-700 border-red-200" },
  sizeRegression:    { label: "Taglia regredita",     colorClass: "bg-red-100 text-red-700 border-red-200" },
  highMortality:     { label: "Alta mortalità",       colorClass: "bg-orange-100 text-orange-700 border-orange-200" },
  highCumulativeMort:{ label: "Mortalità ciclo alta", colorClass: "bg-orange-100 text-orange-700 border-orange-200" },
  readyToSell:       { label: "Pronta per vendita",   colorClass: "bg-green-100 text-green-700 border-green-200" },
  highWeight:        { label: "Peso elevato",         colorClass: "bg-blue-100 text-blue-700 border-blue-200" },
  staleMeasurement:  { label: "Da misurare",          colorClass: "bg-amber-100 text-amber-700 border-amber-200" },
  staleOperation:    { label: "Operazioni ferme",     colorClass: "bg-slate-100 text-slate-600 border-slate-200" },
  sizeEstimateWorse: { label: "Stima peggiorata",     colorClass: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  neverMeasured:     { label: "Mai misurata",         colorClass: "bg-slate-100 text-slate-600 border-slate-200" },
};

// --- Trend KPI ---

interface TrendKpiProps {
  label: string;
  today: number | null;
  yesterday: number | null;
  format: (n: number | null) => string;
  positiveIsGood: boolean; // true = aumento è positivo; false = aumento è negativo (es. mortalità)
}

function TrendKpi({ label, today, yesterday, format, positiveIsGood }: TrendKpiProps) {
  const diff = today != null && yesterday != null ? today - yesterday : null;
  const pct = diff != null && yesterday && yesterday !== 0 ? (diff / Math.abs(yesterday)) * 100 : null;

  let trend: "up" | "down" | "flat" = "flat";
  if (diff != null) {
    if (Math.abs(diff) < (Math.abs(yesterday ?? 1) * 0.001)) trend = "flat"; // < 0.1% → flat
    else if (diff > 0) trend = "up";
    else trend = "down";
  }

  const isPositive = trend === "flat" ? null : (trend === "up") === positiveIsGood;
  const trendColor = isPositive == null ? "text-gray-400" : isPositive ? "text-green-600" : "text-red-500";
  const bgColor = isPositive == null ? "bg-gray-50 border-gray-200" : isPositive ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200";

  return (
    <div className={`rounded-xl border p-3 flex flex-col gap-1 ${bgColor}`}>
      <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-black text-gray-900 leading-none">{format(today)}</div>
      <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
        {trend === "up" && <TrendingUp className="h-3.5 w-3.5" />}
        {trend === "down" && <TrendingDown className="h-3.5 w-3.5" />}
        {trend === "flat" && <Minus className="h-3.5 w-3.5" />}
        {diff != null ? (
          <span>
            {diff > 0 ? "+" : diff < 0 ? "−" : ""}{format(Math.abs(diff))}
            {pct != null && ` (${pct > 0 ? "+" : ""}${pct.toFixed(1)}%)`}
            <span className="text-gray-400 font-normal ml-1">vs ieri</span>
          </span>
        ) : (
          <span className="text-gray-400 font-normal">Nessun dato ieri</span>
        )}
      </div>
    </div>
  );
}

// --- Main Page ---

export default function FlupsyHeatmap() {
  const [, navigate] = useLocation();

  // --- Soglie configurabili per gli alert ---
  const [highMortThreshold, setHighMortThreshold] = useState(5);
  const [cumulMortThreshold, setCumulMortThreshold] = useState(15);
  const [highWeightKgThreshold, setHighWeightKgThreshold] = useState(30);
  const [staleMeasurementDays, setStaleMeasurementDays] = useState(7);
  const [staleOpDays, setStaleOpDays] = useState(14);
  const [showAlertSettings, setShowAlertSettings] = useState(false);

  const { data: allFlupsys, isLoading: lFlupsys } = useQuery<any[]>({
    queryKey: ["/api/flupsys", { includeAll: true }],
  });
  const { data: allBaskets, isLoading: lBaskets } = useQuery<any[]>({
    queryKey: ["/api/baskets", { includeAll: true }],
  });
  const { data: latestOpsMap, isLoading: lOps } = useQuery<Record<number, any>>({
    queryKey: ["/api/baskets/latest-operations"],
    staleTime: 60000,
  });
  const { data: sizes } = useQuery<any[]>({
    queryKey: ["/api/sizes"],
    staleTime: 3600000,
  });
  const { data: dailyTrend } = useQuery<{ success: boolean; data: { yesterdayAnimals: number; yesterdayAvgMort: number | null; yesterdaySellable: number } }>({
    queryKey: ["/api/baskets/daily-trend"],
    staleTime: 300000,
  });

  const isLoading = lFlupsys || lBaskets || lOps;

  const flupsyData = useMemo(() => {
    if (!allFlupsys || !allBaskets) return [];

    return allFlupsys
      .map((flupsy: any) => {
        const baskets = allBaskets.filter((b: any) => b.flupsyId === flupsy.id);
        const dxBaskets = baskets
          .filter((b: any) => b.row === "DX")
          .sort((a: any, b: any) => a.position - b.position);
        const sxBaskets = baskets
          .filter((b: any) => b.row === "SX")
          .sort((a: any, b: any) => a.position - b.position);

        let totalAnimals = 0;
        let totalSellableAnimals = 0;       // taglia ufficiale registrata <= TP-3000
        let totalSellableWeighted = 0;       // EXTRA: solo da stima peso (ultima op peso) quando registrata non vendibile
        let activeCount = 0;
        let totalInitialAnimals = 0;
        let totalDeadCount = 0;

        // Soglia vendibilità: <= 29000 animali/kg (taglia grande, TP-3000 o superiore)
        const VENDIBILE_THRESHOLD = 29000;

        baskets.forEach((b: any) => {
          if (b.currentCycleId) {
            activeCount++;
            const op = latestOpsMap?.[b.id];
            if (op) {
              const current = op.animalCount || 0;
              const initial = op.initialAnimalCount || 0;
              totalAnimals += current;

              const registeredApk = op.measurementAnimalsPerKg;
              const latestApk = op.animalsPerKg;
              const isSellableRegistered = registeredApk != null && registeredApk <= VENDIBILE_THRESHOLD;
              const isSellableLatest = latestApk != null && latestApk <= VENDIBILE_THRESHOLD;

              if (isSellableRegistered) {
                totalSellableAnimals += current;
              } else if (isSellableLatest) {
                // Vendibile solo nell'ipotesi del peso più recente — la taglia ufficiale non lo è ancora
                totalSellableWeighted += current;
              }

              // Mortalità = differenza tra animali iniziali del ciclo e attuali
              if (initial > 0) {
                totalInitialAnimals += initial;
                if (initial > current) {
                  totalDeadCount += initial - current;
                }
              }
            }
          }
        });

        // % mortalità coerente: morti / animali_iniziali_ciclo * 100
        const avgMort =
          totalInitialAnimals > 0
            ? (totalDeadCount / totalInitialAnimals) * 100
            : null;

        return {
          flupsy,
          dxBaskets,
          sxBaskets,
          totalAnimals,
          totalSellableAnimals,
          totalSellableWeighted,
          totalDeadCount: totalInitialAnimals > 0 ? totalDeadCount : null,
          totalInitialAnimals: totalInitialAnimals > 0 ? totalInitialAnimals : null,
          activeCount,
          totalBaskets: baskets.length,
          avgMort,
        };
      })
      .filter((d) => d.totalBaskets > 0)
      // Ordina: prima per animali vendibili (desc), poi per totale animali (desc)
      .sort((a, b) => {
        if (b.totalSellableAnimals !== a.totalSellableAnimals) {
          return b.totalSellableAnimals - a.totalSellableAnimals;
        }
        return b.totalAnimals - a.totalAnimals;
      });
  }, [allFlupsys, allBaskets, latestOpsMap]);

  // Aggregati globali di oggi (somma di tutti i FLUPSY)
  const todayTotals = useMemo(() => {
    if (!flupsyData.length) return null;
    let totalAnimals = 0;
    let totalSellable = 0;
    let totalSellableWeighted = 0;
    let totalDead = 0;
    let totalInitial = 0;
    for (const d of flupsyData) {
      totalAnimals += d.totalAnimals;
      totalSellable += d.totalSellableAnimals;
      totalSellableWeighted += d.totalSellableWeighted;
      if (d.totalDeadCount != null) totalDead += d.totalDeadCount;
      if (d.totalInitialAnimals != null) totalInitial += d.totalInitialAnimals;
    }
    const avgMort = totalInitial > 0 ? (totalDead / totalInitial) * 100 : null;
    return { totalAnimals, totalSellable, totalSellableWeighted, avgMort };
  }, [flupsyData]);

  // --- Calcolo alert per cesta ---
  const alertBaskets = useMemo(() => {
    if (!allBaskets || !latestOpsMap || !sizes || !allFlupsys) return [];
    const today = new Date();
    const VENDIBILE_THRESHOLD = 29000;

    const results: Array<{
      basket: any;
      flupsy: any;
      op: any;
      alerts: string[];
      sizeCode: string;
      daysSinceOp: number;
      daysSinceMeasurement: number | null;
    }> = [];

    for (const basket of allBaskets) {
      if (!basket.currentCycleId) continue;
      const op = latestOpsMap[basket.id];
      if (!op) continue;

      const flupsy = allFlupsys.find((f: any) => f.id === basket.flupsyId);
      const alerts: string[] = [];

      const opDate = op.date ? new Date(op.date) : null;
      const daysSinceOp = opDate
        ? Math.floor((today.getTime() - opDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      const measDate = op.measurementDate ? new Date(op.measurementDate) : null;
      const daysSinceMeasurement = measDate
        ? Math.floor((today.getTime() - measDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // 1. Peso in calo rispetto all'operazione precedente
      if (op.totalWeight != null && op.prevTotalWeight != null && op.totalWeight < op.prevTotalWeight) {
        alerts.push("weightDecrease");
      }

      // 2. Taglia regredita (confronto ultima misura vs misura precedente)
      if (
        op.measurementAnimalsPerKg != null &&
        op.prevMeasurementAnimalsPerKg != null &&
        // più animali/kg = animali più piccoli = taglia peggiorata
        Number(op.measurementAnimalsPerKg) > Number(op.prevMeasurementAnimalsPerKg)
      ) {
        alerts.push("sizeRegression");
      }

      // 3. Alta mortalità ultima operazione registrata
      if (op.lastMortalityRate != null && op.lastMortalityRate > highMortThreshold) {
        alerts.push("highMortality");
      }

      // 4. Alta mortalità cumulativa del ciclo corrente
      if (op.initialAnimalCount && op.animalCount && op.initialAnimalCount > op.animalCount) {
        const cumulMort = ((op.initialAnimalCount - op.animalCount) / op.initialAnimalCount) * 100;
        if (cumulMort > cumulMortThreshold) {
          alerts.push("highCumulativeMort");
        }
      }

      // 5. Pronta per la vendita (taglia ufficiale ≤ TP-3000 → animali/kg ≤ 29.000)
      const apkForSell = op.measurementAnimalsPerKg ?? op.animalsPerKg;
      if (apkForSell != null && Number(apkForSell) <= VENDIBILE_THRESHOLD) {
        alerts.push("readyToSell");
      }

      // 6. Peso elevato (soglia configurabile in kg)
      if (op.totalWeight != null && op.totalWeight > highWeightKgThreshold * 1000) {
        alerts.push("highWeight");
      }

      // 7. Da misurare: N giorni senza misura ufficiale
      if (daysSinceMeasurement != null && daysSinceMeasurement > staleMeasurementDays) {
        alerts.push("staleMeasurement");
      }

      // 8. Operazioni ferme: N giorni senza nessuna operazione
      if (daysSinceOp > staleOpDays) {
        alerts.push("staleOperation");
      }

      // 9. Stima dal peso peggiorata (ultima pesata indica animali più piccoli della misura)
      const weightedInfo = getWeightedSizeInfo(op, sizes);
      if (weightedInfo?.differs && !weightedInfo.grew) {
        alerts.push("sizeEstimateWorse");
      }

      // 10. Mai misurata (ancora alla prima attivazione, nessuna misura successiva)
      if (op.type === "prima-attivazione" || op.type === "prima-attivazione-da-vagliatura") {
        alerts.push("neverMeasured");
      }

      if (alerts.length > 0) {
        const sizeCode = getSizeCodeFromAnimalsPerKg(Number(apkForSell) || 0, sizes);
        results.push({ basket, flupsy, op, alerts, sizeCode, daysSinceOp, daysSinceMeasurement });
      }
    }

    // Ordina: prima le anomalie critiche (peso/taglia), poi per numero di alert
    const PRIORITY = ["weightDecrease", "sizeRegression"];
    return results.sort((a, b) => {
      const aPrio = PRIORITY.some(k => a.alerts.includes(k)) ? 1 : 0;
      const bPrio = PRIORITY.some(k => b.alerts.includes(k)) ? 1 : 0;
      if (bPrio !== aPrio) return bPrio - aPrio;
      return b.alerts.length - a.alerts.length;
    });
  }, [
    allBaskets, allFlupsys, latestOpsMap, sizes,
    highMortThreshold, cumulMortThreshold, highWeightKgThreshold,
    staleMeasurementDays, staleOpDays,
  ]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400 gap-3">
        <LayoutGrid className="h-10 w-10 animate-pulse" />
        <span>Caricamento mappa FLUPSY…</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-4 pb-10 space-y-5">
        {/* Header + Legend */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <LayoutGrid className="h-6 w-6 text-indigo-500" />
              Mappa termica FLUPSY
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Mappa termica delle ceste — taglia, densità, mortalità
            </p>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {LEGEND_ENTRIES.map((l) => {
              const { bg, text } = getSizeHexColor(l.code);
              return (
                <span
                  key={l.code}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm"
                  style={{ backgroundColor: bg, color: text }}
                >
                  {l.code}
                  <span className="opacity-70 font-normal">{l.label}</span>
                </span>
              );
            })}
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 shadow-sm">
              Vuota
            </span>
          </div>
        </div>

        {/* Pannello trend giornaliero */}
        {todayTotals && (
          <div className="grid grid-cols-3 gap-3">
            <TrendKpi
              label="Animali totali"
              today={todayTotals.totalAnimals}
              yesterday={dailyTrend?.data?.yesterdayAnimals ?? null}
              format={fmtAnimals}
              positiveIsGood={true}
            />
            <div className="relative">
              <TrendKpi
                label="Quasi vendibili+"
                today={todayTotals.totalSellable}
                yesterday={dailyTrend?.data?.yesterdaySellable ?? null}
                format={fmtAnimals}
                positiveIsGood={true}
              />
              {todayTotals.totalSellableWeighted > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="absolute top-1 right-1 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-100 border border-green-500 text-green-800 text-[10px] font-bold cursor-help shadow-sm">
                      <Scale className="h-2.5 w-2.5" />
                      +{fmtAnimals(todayTotals.totalSellableWeighted)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs max-w-xs">
                    Animali aggiuntivi <span className="font-bold">potenzialmente vendibili</span> in base
                    all'ultima pesata: la taglia stimata dal peso ≤ TP-3000, ma la taglia ufficiale registrata non è ancora vendibile.
                    Serve un'operazione di <span className="font-bold">misura</span> per confermare.
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <TrendKpi
              label="Mortalità media"
              today={todayTotals.avgMort}
              yesterday={dailyTrend?.data?.yesterdayAvgMort ?? null}
              format={(n) => n != null ? `${n.toFixed(1)}%` : "—"}
              positiveIsGood={false}
            />
          </div>
        )}

        {/* FLUPSY Cards */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {flupsyData.map((d) => (
            <FlupsyCard
              key={d.flupsy.id}
              {...d}
              latestOpsMap={latestOpsMap!}
              sizes={sizes ?? []}
              onNavigate={navigate}
            />
          ))}
        </div>

        {/* ========== PANNELLO SEGNALAZIONI ========== */}
        <div className="rounded-2xl border border-amber-200 bg-white shadow overflow-hidden">

          {/* Intestazione */}
          <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h2 className="text-base font-bold text-gray-800">Segnalazioni operative</h2>
                {alertBaskets.length > 0 && (
                  <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
                    {alertBaskets.length} ceste
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowAlertSettings(s => !s)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Soglie
                {showAlertSettings
                  ? <ChevronUp className="h-3.5 w-3.5" />
                  : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Pannello soglie configurabili */}
            {showAlertSettings && (
              <div className="mt-3 pt-3 border-t border-amber-200 grid grid-cols-2 md:grid-cols-5 gap-3">
                {([
                  { label: "Mortalità ultima op. (%)", value: highMortThreshold,      setter: setHighMortThreshold,      min: 1, max: 50 },
                  { label: "Mortalità ciclo (%)",      value: cumulMortThreshold,     setter: setCumulMortThreshold,     min: 1, max: 80 },
                  { label: "Peso elevato (kg)",        value: highWeightKgThreshold,  setter: setHighWeightKgThreshold,  min: 1, max: 500 },
                  { label: "Senza misura (gg)",        value: staleMeasurementDays,   setter: setStaleMeasurementDays,   min: 1, max: 60 },
                  { label: "Senza operazioni (gg)",    value: staleOpDays,            setter: setStaleOpDays,            min: 1, max: 90 },
                ] as const).map(({ label, value, setter, min, max }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide leading-tight">{label}</label>
                    <input
                      type="number"
                      min={min}
                      max={max}
                      value={value}
                      onChange={e => (setter as (v: number) => void)(Math.max(min, Math.min(max, Number(e.target.value))))}
                      className="w-full px-2 py-1 text-sm border border-amber-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Sommario per tipo di alert */}
            {alertBaskets.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {Object.entries(ALERT_META).map(([key, meta]) => {
                  const count = alertBaskets.filter(r => r.alerts.includes(key)).length;
                  if (!count) return null;
                  return (
                    <span
                      key={key}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${meta.colorClass}`}
                    >
                      {count} {meta.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tabella ceste */}
          {alertBaskets.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
              <span className="text-2xl">✓</span>
              Nessuna segnalazione con le soglie attuali
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">FLUPSY</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Cesta</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Pos.</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Taglia</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Animali</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Peso</th>
                    <th className="px-3 py-2 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      <Clock className="inline h-3 w-3 mr-0.5" />Ultima op.
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Segnalazioni</th>
                  </tr>
                </thead>
                <tbody>
                  {alertBaskets.map(({ basket, flupsy, op, alerts, sizeCode, daysSinceOp, daysSinceMeasurement }) => {
                    const { bg } = sizeCode && sizeCode !== "N/D" ? getSizeHexColor(sizeCode) : { bg: "#cbd5e1" };
                    const hasCritical = alerts.includes("weightDecrease") || alerts.includes("sizeRegression");
                    return (
                      <tr
                        key={basket.id}
                        onClick={() => op.cycleId && navigate(`/cycles/${op.cycleId}`)}
                        className={`border-b border-gray-100 cursor-pointer transition-colors ${hasCritical ? "bg-red-50/40 hover:bg-red-50" : "hover:bg-amber-50/40"}`}
                      >
                        <td className="px-3 py-2 text-xs font-medium text-gray-700 whitespace-nowrap">{flupsy?.name ?? "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="font-bold text-gray-800">C#{basket.physicalNumber}</span>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{basket.row} {basket.position}</td>
                        <td className="px-3 py-2">
                          {sizeCode && sizeCode !== "N/D" ? (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap"
                              style={{ backgroundColor: bg + "33", color: "#1e293b", border: `1px solid ${bg}66` }}
                            >
                              {sizeCode}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">N/D</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-xs font-medium text-gray-700 whitespace-nowrap">
                          {fmtAnimals(op.animalCount)}
                        </td>
                        <td className="px-3 py-2 text-right text-xs text-gray-600 whitespace-nowrap">
                          {op.totalWeight != null ? `${(op.totalWeight / 1000).toFixed(1)} kg` : "—"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={`text-[11px] font-semibold whitespace-nowrap ${
                              daysSinceOp > staleOpDays ? "text-red-500"
                              : daysSinceOp > 7 ? "text-amber-500"
                              : "text-gray-600"
                            }`}>
                              {daysSinceOp === 0 ? "oggi" : `${daysSinceOp}gg fa`}
                            </span>
                            <span className="text-[9px] text-gray-400 whitespace-nowrap">{op.type}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {alerts.map(alertKey => {
                              const meta = ALERT_META[alertKey];
                              if (!meta) return null;
                              let detail = "";
                              if (alertKey === "highMortality" && op.lastMortalityRate != null)
                                detail = ` ${op.lastMortalityRate.toFixed(1)}%`;
                              if (alertKey === "highCumulativeMort" && op.initialAnimalCount && op.animalCount)
                                detail = ` ${((op.initialAnimalCount - op.animalCount) / op.initialAnimalCount * 100).toFixed(0)}%`;
                              if (alertKey === "highWeight" && op.totalWeight)
                                detail = ` ${(op.totalWeight / 1000).toFixed(0)}kg`;
                              if (alertKey === "staleMeasurement" && daysSinceMeasurement != null)
                                detail = ` ${daysSinceMeasurement}gg`;
                              if (alertKey === "staleOperation")
                                detail = ` ${daysSinceOp}gg`;
                              if (alertKey === "weightDecrease" && op.prevTotalWeight != null && op.totalWeight != null)
                                detail = ` ${(op.prevTotalWeight / 1000).toFixed(1)}→${(op.totalWeight / 1000).toFixed(1)}kg`;
                              return (
                                <span
                                  key={alertKey}
                                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap ${meta.colorClass}`}
                                >
                                  {meta.label}{detail}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </TooltipProvider>
  );
}

// --- FLUPSY Card ---

interface FlupsyCardProps {
  flupsy: any;
  dxBaskets: any[];
  sxBaskets: any[];
  totalAnimals: number;
  totalSellableAnimals: number;
  totalSellableWeighted: number;
  totalDeadCount: number | null;
  totalInitialAnimals: number | null;
  activeCount: number;
  totalBaskets: number;
  avgMort: number | null;
  latestOpsMap: Record<number, any>;
  sizes: any[];
  onNavigate: (path: string) => void;
}

function FlupsyCard({
  flupsy,
  dxBaskets,
  sxBaskets,
  totalAnimals,
  totalSellableAnimals,
  totalSellableWeighted,
  totalDeadCount,
  totalInitialAnimals,
  activeCount,
  totalBaskets,
  avgMort,
  latestOpsMap,
  sizes,
  onNavigate,
}: FlupsyCardProps) {
  const mortColor =
    avgMort == null
      ? "text-gray-400"
      : avgMort > 10
      ? "text-red-600 font-semibold"
      : avgMort > 5
      ? "text-amber-500 font-semibold"
      : "text-green-600";

  const allBaskets = [...dxBaskets, ...sxBaskets];
  const maxAnimals = Math.max(
    ...allBaskets.map((b: any) => latestOpsMap[b.id]?.animalCount ?? 0),
    1
  );

  // Conteggio ceste con taglia stimata dal peso diversa dalla registrata (da misurare)
  const toMeasureCount = allBaskets.filter((b: any) => {
    if (!b.currentCycleId) return false;
    const info = getWeightedSizeInfo(latestOpsMap[b.id], sizes);
    return info?.differs;
  }).length;

  const rows = [
    { label: "DX", baskets: dxBaskets },
    { label: "SX", baskets: sxBaskets },
  ].filter((r) => r.baskets.length > 0);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow overflow-hidden">
      {/* Header bar */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-base font-bold text-gray-800">{flupsy.name}</span>
            {flupsy.location && (
              <span className="ml-2 text-xs text-gray-400 italic">{flupsy.location}</span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">
              <span className="font-bold text-gray-800">{activeCount}</span>
              <span className="text-gray-400">/{totalBaskets}</span>{" "}
              <span className="text-xs">ceste attive</span>
            </span>
            <span className="text-gray-500">
              <span className="font-bold text-gray-800">{fmtAnimals(totalAnimals)}</span>{" "}
              <span className="text-xs">animali</span>
            </span>
            {totalSellableAnimals > 0 && (
              <span className="text-gray-500">
                <span className="font-bold text-green-700">{fmtAnimals(totalSellableAnimals)}</span>{" "}
                <span className="text-xs text-green-600">vendibili</span>
              </span>
            )}
            {totalSellableWeighted > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-500 text-green-700 text-xs font-bold cursor-help">
                    <Scale className="h-3 w-3" />
                    +{fmtAnimals(totalSellableWeighted)} stimati
                  </span>
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-xs">
                  Animali in ceste dove l'ultima pesata indica una taglia ≤ TP-3000
                  (vendibile), ma la taglia ufficiale registrata non è ancora vendibile.
                  Serve una <span className="font-bold">misura</span> per confermare.
                </TooltipContent>
              </Tooltip>
            )}
            {toMeasureCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold cursor-help">
                    <Scale className="h-3 w-3" />
                    {toMeasureCount} da misurare
                  </span>
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-xs">
                  Ceste in cui l'ultimo peso indica una taglia diversa da quella registrata.
                  Serve un'operazione di <span className="font-bold">misura</span> per aggiornare la taglia ufficiale.
                </TooltipContent>
              </Tooltip>
            )}
            {avgMort !== null && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={`text-xs flex items-center gap-1 cursor-help ${mortColor}`}>
                    {avgMort > 10 && <AlertTriangle className="inline h-3 w-3" />}
                    <span>Mort. {avgMort.toFixed(2)}%</span>
                    {totalDeadCount != null && totalDeadCount > 0 && (
                      <span className="opacity-75">({fmtAnimals(totalDeadCount)})</span>
                    )}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="text-xs space-y-0.5">
                  <div className="font-semibold text-gray-200 mb-1">Mortalità cumulativa ciclo attuale</div>
                  <div>Animali al carico: <span className="font-bold">{totalInitialAnimals?.toLocaleString("it-IT") ?? "—"}</span></div>
                  <div>Animali attuali: <span className="font-bold">{totalAnimals.toLocaleString("it-IT")}</span></div>
                  <div>Morti (differenza): <span className="font-bold">{totalDeadCount?.toLocaleString("it-IT") ?? "—"}</span></div>
                  <div className="border-t border-gray-600 pt-1 mt-1">
                    = (carico − attuali) / carico × 100 = <span className="font-bold">{avgMort.toFixed(2)}%</span>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {/* Rows */}
      <div className="p-4 space-y-4">
        {rows.map(({ label, baskets }) => (
          <div key={label}>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Fila {label}
            </div>
            <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
              {baskets.map((basket: any) => (
                <BasketTile
                  key={basket.id}
                  basket={basket}
                  op={latestOpsMap[basket.id]}
                  sizes={sizes}
                  maxAnimals={maxAnimals}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Basket Tile ---

interface BasketTileProps {
  basket: any;
  op: any;
  sizes: any[];
  maxAnimals: number;
  onNavigate: (path: string) => void;
}

function BasketTile({ basket, op, sizes, maxAnimals, onNavigate }: BasketTileProps) {
  const isActive = !!basket.currentCycleId;
  const animalsPerKg = op?.measurementAnimalsPerKg || op?.animalsPerKg;
  const sizeCode = isActive && animalsPerKg ? getSizeCodeFromAnimalsPerKg(animalsPerKg, sizes) : null;
  const hasSize = !!(sizeCode && sizeCode !== "N/D");

  // Taglia stimata dal peso (solo se ultima op è 'peso' e differisce dalla registrata)
  const weightedInfo = isActive ? getWeightedSizeInfo(op, sizes) : null;
  const needsRemeasure = !!weightedInfo?.differs;

  const { bg } = hasSize
    ? getSizeHexColor(sizeCode!)
    : isActive
    ? { bg: "#93c5fd" }   // blue-300 per ceste attive senza taglia
    : { bg: "#cbd5e1" };  // slate-300 per ceste vuote

  const animalCount = op?.animalCount ?? null;
  const mort = op?.lastMortalityRate ?? null;
  const highMort = mort !== null && mort > 10;

  // Fill level: rapporto tra animali di questa cesta e il massimo nel FLUPSY
  const fillPct = hasSize && animalCount && maxAnimals > 0
    ? Math.max(8, Math.round((animalCount / maxAnimals) * 100))
    : 0;

  const tile = (
    <div
      onClick={() => isActive && basket.currentCycleId && onNavigate(`/cycles/${basket.currentCycleId}`)}
      className={`
        relative overflow-hidden flex flex-col items-center justify-center gap-1
        rounded-xl w-[96px] h-[100px] select-none
        transition-all duration-150
        ${needsRemeasure ? "border-2 border-amber-500 shadow-amber-200 shadow-md" : "border border-white/30"}
        ${isActive ? "cursor-pointer hover:scale-105 hover:shadow-lg" : "cursor-default opacity-35"}
      `}
      style={{ backgroundColor: "#f0f4f8" }}
    >
      {/* === FILL LEVEL: sale dal basso, colore della taglia === */}
      <div
        className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
        style={{
          height: `${fillPct}%`,
          backgroundColor: bg,
          opacity: hasSize ? 1 : 0.3,
        }}
      />

      {/* Separatore orizzontale che indica il livello */}
      {fillPct > 0 && fillPct < 100 && (
        <div
          className="absolute left-0 right-0 h-[2px] bg-white/60"
          style={{ bottom: `${fillPct}%` }}
        />
      )}

      {/* === CONTENUTO (sopra il fill) === */}
      <div className="relative z-10 flex flex-col items-center w-full px-1.5 gap-1">

        {/* Numero cesta + badge taglia */}
        <div className="flex items-center justify-between w-full">
          <span
            className="text-[10px] font-bold leading-none"
            style={{ color: fillPct > 60 ? "#fff" : "#475569", textShadow: fillPct > 60 ? "0 1px 2px rgba(0,0,0,0.4)" : "none" }}
          >
            C#{basket.physicalNumber}
          </span>
          {hasSize && (
            <span
              className="text-[9px] font-bold rounded px-1 py-0.5 leading-none"
              style={{
                backgroundColor: fillPct > 60 ? "rgba(255,255,255,0.25)" : bg + "33",
                color: fillPct > 60 ? "#fff" : "#334155",
              }}
            >
              {sizeCode}
            </span>
          )}
        </div>

        {/* Numero animali — elemento dominante */}
        {hasSize ? (
          <div
            className="text-[15px] font-black leading-none tracking-tight"
            style={{
              color: fillPct > 40 ? "#fff" : "#1e293b",
              textShadow: fillPct > 40 ? "0 1px 3px rgba(0,0,0,0.5)" : "none",
            }}
          >
            {fmtAnimals(animalCount)}
          </div>
        ) : isActive ? (
          <div className="text-[11px] text-slate-400 text-center leading-snug">
            Attiva<br /><span className="text-[10px]">N/D</span>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 text-center">Vuota</div>
        )}

        {/* % di riempimento relativo */}
        {fillPct > 0 && (
          <div
            className="text-[9px] font-semibold leading-none"
            style={{ color: fillPct > 55 ? "rgba(255,255,255,0.8)" : "#64748b" }}
          >
            {fillPct}%
          </div>
        )}
      </div>

      {/* Alta mortalità — pallino rosso */}
      {highMort && (
        <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white shadow z-20" />
      )}

      {/* Badge "stima dal peso" — quando ultima op è peso con taglia diversa dalla registrata */}
      {needsRemeasure && weightedInfo && (
        <div
          className="absolute bottom-1 right-1 z-20 flex items-center gap-0.5 rounded px-1 py-0.5 bg-white text-amber-700 border border-amber-600 text-[8px] font-bold leading-none shadow-md"
          title="Taglia stimata dall'ultimo peso, diversa dalla taglia registrata"
        >
          <Scale className="h-2 w-2" />
          <span>{weightedInfo.code.replace("TP-", "")}</span>
          <span className="text-[7px]">{weightedInfo.grew ? "↑" : "↓"}</span>
        </div>
      )}
    </div>
  );

  if (!isActive || !op) return tile;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{tile}</TooltipTrigger>
      <TooltipContent side="top" className="w-56 text-xs">
        <div className="space-y-1.5">
          <div className="flex justify-between font-bold border-b pb-1">
            <span>Cesta #{basket.physicalNumber}</span>
            <span className="text-gray-400">Pos. {basket.position} {basket.row}</span>
          </div>
          {sizeCode && sizeCode !== "N/D" && (
            <div className="flex justify-between">
              <span className="text-gray-500">Taglia registrata</span>
              <span className="font-semibold">{sizeCode}</span>
            </div>
          )}
          {weightedInfo?.differs && (
            <div className="flex justify-between bg-amber-50 -mx-1 px-1 py-0.5 rounded">
              <span className="text-amber-700 flex items-center gap-1">
                <Scale className="h-3 w-3" /> Stima dal peso
              </span>
              <span className="font-bold text-amber-700">
                {weightedInfo.code} {weightedInfo.grew ? "↑" : "↓"}
              </span>
            </div>
          )}
          {animalCount != null && (
            <div className="flex justify-between">
              <span className="text-gray-500">Animali</span>
              <span className="font-semibold">{animalCount.toLocaleString("it-IT")}</span>
            </div>
          )}
          {op.totalWeight != null && (
            <div className="flex justify-between">
              <span className="text-gray-500">Peso</span>
              <span className="font-semibold">{(op.totalWeight / 1000).toFixed(2)} kg</span>
            </div>
          )}
          {mort !== null && (
            <div className="flex justify-between">
              <span className="text-gray-500">Mortalità</span>
              <span
                className={`font-semibold ${
                  mort > 10 ? "text-red-500" : mort > 5 ? "text-amber-500" : "text-green-500"
                }`}
              >
                {mort.toFixed(1)}%
              </span>
            </div>
          )}
          {op.date && (
            <div className="flex justify-between text-gray-400 border-t pt-1">
              <span>Ultima op.</span>
              <span>
                {format(new Date(op.date), "dd/MM/yyyy")} — {op.type}
              </span>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
