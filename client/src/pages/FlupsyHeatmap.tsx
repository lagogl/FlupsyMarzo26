import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { AlertTriangle, LayoutGrid } from "lucide-react";

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

// Returns { bg, text } hex colors for a TP-XXXX code
function getSizeHexColor(sizeCode: string): { bg: string; text: string } {
  if (!sizeCode || !sizeCode.startsWith("TP-")) return { bg: "#f1f5f9", text: "#64748b" };
  const num = parseInt(sizeCode.substring(3));
  if (num <= 500)   return { bg: "#dc2626", text: "#fff" };   // red-600
  if (num <= 1000)  return { bg: "#ef4444", text: "#fff" };   // red-500
  if (num <= 2000)  return { bg: "#f59e0b", text: "#fff" };   // amber-500
  if (num <= 3000)  return { bg: "#eab308", text: "#fff" };   // yellow-500
  if (num <= 6000)  return { bg: "#22c55e", text: "#fff" };   // green-500
  if (num <= 10000) return { bg: "#3b82f6", text: "#fff" };   // blue-500
  return { bg: "#1e293b", text: "#fff" };                      // slate-900
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

// --- Main Page ---

export default function FlupsyHeatmap() {
  const [, navigate] = useLocation();

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
        let activeCount = 0;
        let mortSum = 0;
        let mortN = 0;

        baskets.forEach((b: any) => {
          if (b.currentCycleId) {
            activeCount++;
            const op = latestOpsMap?.[b.id];
            if (op) {
              totalAnimals += op.animalCount || 0;
              if (op.lastMortalityRate != null) {
                mortSum += op.lastMortalityRate;
                mortN++;
              }
            }
          }
        });

        return {
          flupsy,
          dxBaskets,
          sxBaskets,
          totalAnimals,
          activeCount,
          totalBaskets: baskets.length,
          avgMort: mortN > 0 ? mortSum / mortN : null,
        };
      })
      .filter((d) => d.totalBaskets > 0);
  }, [allFlupsys, allBaskets, latestOpsMap]);

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
              Vista Mappa FLUPSY
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
            {avgMort !== null && (
              <span className={`text-xs ${mortColor}`}>
                {avgMort > 10 && <AlertTriangle className="inline h-3 w-3 mr-0.5" />}
                Mort. {avgMort.toFixed(1)}%
              </span>
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
            <div className="flex flex-wrap gap-1.5">
              {baskets.map((basket: any) => (
                <BasketTile
                  key={basket.id}
                  basket={basket}
                  op={latestOpsMap[basket.id]}
                  sizes={sizes}
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
  onNavigate: (path: string) => void;
}

function BasketTile({ basket, op, sizes, onNavigate }: BasketTileProps) {
  const isActive = !!basket.currentCycleId;
  const animalsPerKg = op?.measurementAnimalsPerKg || op?.animalsPerKg;
  const sizeCode = isActive && animalsPerKg ? getSizeCodeFromAnimalsPerKg(animalsPerKg, sizes) : null;
  const { bg, text } = sizeCode && sizeCode !== "N/D"
    ? getSizeHexColor(sizeCode)
    : isActive
    ? { bg: "#dbeafe", text: "#1d4ed8" }   // blue-100 / blue-700 → active, no size
    : { bg: "#f1f5f9", text: "#94a3b8" };  // slate-100 / slate-400 → empty

  const animalCount = op?.animalCount ?? null;
  const mort = op?.lastMortalityRate ?? null;
  const highMort = mort !== null && mort > 10;

  const tile = (
    <div
      onClick={() => isActive && basket.currentCycleId && onNavigate(`/cycles/${basket.currentCycleId}`)}
      style={{ backgroundColor: bg, color: text }}
      className={`
        relative flex flex-col items-center justify-center
        rounded-xl w-[68px] h-[72px] select-none
        transition-all duration-150
        ${isActive ? "cursor-pointer hover:scale-105 hover:shadow-md" : "cursor-default opacity-50"}
      `}
    >
      {/* High mortality dot */}
      {highMort && (
        <div
          className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-white shadow"
          title="Alta mortalità"
        />
      )}

      {/* Basket number */}
      <div className="text-[10px] font-medium opacity-75 leading-none">
        #{basket.physicalNumber}
      </div>

      {sizeCode && sizeCode !== "N/D" ? (
        <>
          <div className="text-[12px] font-black leading-tight mt-1">{sizeCode}</div>
          <div className="text-[10px] opacity-90 leading-none mt-0.5 font-medium">
            {fmtAnimals(animalCount)}
          </div>
        </>
      ) : isActive ? (
        <div className="text-[10px] opacity-75 text-center mt-1 leading-snug px-1">
          Attiva<br />N/D
        </div>
      ) : (
        <div className="text-[10px] opacity-60 text-center mt-1 leading-snug">
          Vuota
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
              <span className="text-gray-500">Taglia</span>
              <span className="font-semibold">{sizeCode}</span>
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
