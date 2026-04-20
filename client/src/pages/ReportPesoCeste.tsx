import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ArrowUpDown, ArrowUp, ArrowDown, Target, Scale, TrendingUp, Fish, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
  animalsPerKg: number;
  avgWeightMg: number;
  deviationFromTarget: number;
  deviationFromTargetPct: number;
  deviationTotalWeightKg: number;
  deviationTotalWeightPct: number;
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

type SortKey = "animalsPerKg" | "deviationFromTargetPct" | "totalWeightKg" | "deviationTotalWeightPct" | "avgWeightMg" | "animalCount";
type SortDir = "asc" | "desc";

const fmtN = (n: number | null | undefined, dec = 0) =>
  n === null || n === undefined ? "—" : n.toLocaleString("it-IT", { minimumFractionDigits: dec, maximumFractionDigits: dec });

// Colore scostamento da TP-3000: negativo (pz/kg < soglia) = già in range/sopra = verde
const targetDeviationStyle = (dev: number) => {
  if (dev <= 0) return { badge: "bg-green-100 border-green-300", text: "text-green-700 font-bold" };
  if (dev <= 10000) return { badge: "bg-yellow-50 border-yellow-300", text: "text-yellow-700 font-semibold" };
  if (dev <= 30000) return { badge: "bg-orange-50 border-orange-300", text: "text-orange-700" };
  return { badge: "bg-red-50 border-red-200", text: "text-red-700" };
};


export default function ReportPesoCeste() {
  const [selectedFlupsys, setSelectedFlupsys] = useState<number[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("animalsPerKg");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showOnlyAtTarget, setShowOnlyAtTarget] = useState(false);

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
    else { setSortKey(key); setSortDir(key === "animalsPerKg" ? "asc" : "desc"); }
  };

  const filtered = useMemo(() => {
    if (!data) return [];
    let rows = data.baskets;
    if (selectedFlupsys.length > 0) rows = rows.filter(b => selectedFlupsys.includes(b.flupsyId));
    if (showOnlyAtTarget) rows = rows.filter(b => b.atOrAboveTarget);
    return [...rows].sort((a, b) => {
      const av = a[sortKey] as number;
      const bv = b[sortKey] as number;
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [data, selectedFlupsys, showOnlyAtTarget, sortKey, sortDir]);

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === "desc" ? <ArrowDown className="h-3 w-3 ml-1 text-blue-600" /> : <ArrowUp className="h-3 w-3 ml-1 text-blue-600" />;
  };

  const atTargetCount = filtered.filter(b => b.atOrAboveTarget).length;
  const closeCount = filtered.filter(b => !b.atOrAboveTarget && b.deviationFromTarget <= 10000).length;

  return (
    <div className="container mx-auto py-4 px-2 space-y-4">
      {/* Intestazione */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Report Peso Ceste</h1>
          <p className="text-muted-foreground text-sm">Selezione ceste da vagliare — priorità per taglia TP-3000</p>
        </div>
        {data && (
          <Badge variant="outline" className="self-start sm:self-center flex items-center gap-1 text-sm px-3 py-1 border-green-300 bg-green-50 text-green-800">
            <Target className="h-4 w-4" />
            Target TP-3000: {fmtN(data.meta.targetMinApk)}–{fmtN(data.meta.targetMaxApk)} pz/kg
          </Badge>
        )}
      </div>

      {/* Legenda rapida */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1.5 px-2 py-1 rounded border bg-green-100 border-green-300 text-green-800 font-medium">🟢 In range / sopra TP-3000 (≤ {fmtN(data?.meta.targetMaxApk)} pz/kg)</span>
        <span className="flex items-center gap-1.5 px-2 py-1 rounded border bg-yellow-50 border-yellow-300 text-yellow-700">🟡 Vicini (entro 10.000 pz/kg dal target)</span>
        <span className="flex items-center gap-1.5 px-2 py-1 rounded border bg-orange-50 border-orange-300 text-orange-700">🟠 In crescita (10–30k pz/kg dal target)</span>
        <span className="flex items-center gap-1.5 px-2 py-1 rounded border bg-red-50 border-red-200 text-red-700">🔴 Ancora lontani (&gt; 30.000 pz/kg dal target)</span>
      </div>

      {/* Cards riepilogo */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}</div>
      ) : data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs text-muted-foreground font-medium">Ceste analizzate</CardTitle></CardHeader>
            <CardContent className="px-4 pb-3"><div className="text-2xl font-bold">{filtered.length}</div></CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs text-green-700 font-medium flex items-center gap-1"><TrendingUp className="h-3 w-3"/>In range TP-3000 o più grandi</CardTitle></CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-2xl font-bold text-green-700">{atTargetCount}</div>
              <div className="text-xs text-muted-foreground">pronte per vagliatura</div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs text-yellow-700 font-medium flex items-center gap-1"><Fish className="h-3 w-3"/>Vicine al target</CardTitle></CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-2xl font-bold text-yellow-700">{closeCount}</div>
              <div className="text-xs text-muted-foreground">entro 10.000 pz/kg</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1"><Scale className="h-3 w-3"/>Biomassa media/cesta</CardTitle></CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-2xl font-bold">{fmtN(data.meta.avgTotalWeightKg, 1)} kg</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtri */}
      <Card>
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />Filtra FLUPSY:
            </div>
            {flupsyOptions.map(f => (
              <div key={f.id} className="flex items-center gap-1.5">
                <Checkbox id={`f-${f.id}`} checked={selectedFlupsys.includes(f.id)} onCheckedChange={() => toggleFlupsy(f.id)} />
                <Label htmlFor={`f-${f.id}`} className="text-sm cursor-pointer">{f.name}</Label>
              </div>
            ))}
            {selectedFlupsys.length > 0 && <Button variant="ghost" size="sm" onClick={() => setSelectedFlupsys([])}>Tutti</Button>}
            <div className="ml-auto flex items-center gap-1.5">
              <Checkbox id="at-target" checked={showOnlyAtTarget} onCheckedChange={(v) => setShowOnlyAtTarget(!!v)} />
              <Label htmlFor="at-target" className="text-sm cursor-pointer text-green-700 font-medium">Solo in range / sopra TP-3000</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabella */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : isError ? (
        <div className="text-center text-destructive py-8">Errore nel caricamento dei dati</div>
      ) : (
        <div className="rounded-lg border overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-3 py-2 font-medium">FLUPSY</th>
                <th className="text-left px-3 py-2 font-medium">Cesta</th>
                <th className="text-left px-3 py-2 font-medium">Lotto</th>
                <th className="text-left px-3 py-2 font-medium">Ultima op.</th>
                <th className="text-center px-3 py-2 font-medium">Taglia attuale</th>
                <th className="text-right px-3 py-2 font-medium cursor-pointer hover:bg-muted select-none whitespace-nowrap" onClick={() => handleSort("animalsPerKg")}>
                  <span className="flex items-center justify-end">pz/kg <SortIcon k="animalsPerKg" /></span>
                </th>
                <th className="text-right px-3 py-2 font-medium cursor-pointer hover:bg-muted select-none whitespace-nowrap" onClick={() => handleSort("avgWeightMg")}>
                  <span className="flex items-center justify-end">Peso medio (mg) <SortIcon k="avgWeightMg" /></span>
                </th>
                <th className="text-center px-3 py-2 font-medium cursor-pointer hover:bg-muted select-none whitespace-nowrap" onClick={() => handleSort("deviationFromTargetPct")}>
                  <span className="flex items-center justify-center">Distanza da TP-3000 <SortIcon k="deviationFromTargetPct" /></span>
                </th>
                <th className="text-right px-3 py-2 font-medium cursor-pointer hover:bg-muted select-none whitespace-nowrap" onClick={() => handleSort("totalWeightKg")}>
                  <span className="flex items-center justify-end">Biomassa (kg) <SortIcon k="totalWeightKg" /></span>
                </th>
                <th className="text-center px-3 py-2 font-medium">Formula</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-10 text-muted-foreground">Nessuna cesta trovata</td></tr>
              ) : filtered.map((b, i) => {
                const tStyle = targetDeviationStyle(b.deviationFromTarget);
                return (
                  <tr key={b.basketId} className={`border-b hover:bg-muted/30 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                    <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{b.flupsyName}</td>
                    <td className="px-3 py-2 font-semibold">#{b.physicalNumber}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground max-w-[100px] truncate" title={b.lotSupplier || "—"}>
                      {b.lotSupplier ? b.lotSupplier.slice(0, 15) + (b.lotSupplier.length > 15 ? "…" : "") : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                      {b.opDate ? format(new Date(b.opDate), "dd/MM/yy", { locale: it }) : "—"}
                      <span className="ml-1 opacity-60">({b.opType})</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {b.currentSizeCode ? (
                        <Badge variant="outline" style={{ borderColor: b.currentSizeColor || undefined, backgroundColor: b.currentSizeColor ? b.currentSizeColor + '30' : undefined }} className="text-xs font-mono">
                          {b.currentSizeCode}
                        </Badge>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-semibold">{fmtN(b.animalsPerKg)}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmtN(b.avgWeightMg, 1)}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex flex-col items-center px-2 py-0.5 rounded border text-xs gap-0.5 ${tStyle.badge}`}>
                        {b.atOrAboveTarget ? (
                          <span className={tStyle.text}>✓ In range / sopra</span>
                        ) : (
                          <>
                            <span className={tStyle.text}>+{fmtN(b.deviationFromTarget)} pz/kg</span>
                            <span className="text-muted-foreground opacity-70">da ridurre</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{fmtN(b.totalWeightKg, 1)}</td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant="outline" className={`text-[10px] ${b.formulaVersion === 2 ? "bg-green-50 text-green-700 border-green-300" : "bg-amber-50 text-amber-700 border-amber-300"}`}>
                        v{b.formulaVersion}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legenda colonne */}
      <div className="text-xs text-muted-foreground pb-4 space-y-1 border-t pt-3">
        <p><strong>Taglia attuale</strong>: classificazione TP della cesta in base all'ultimo valore pz/kg registrato.</p>
        <p><strong>pz/kg</strong>: animali per chilogrammo (meno = animali più grandi). Ordinando crescente si vedono le ceste con gli animali più grandi in cima.</p>
        <p><strong>Peso medio (mg)</strong>: peso medio di un singolo animale = 1.000.000 / pz/kg.</p>
        <p><strong>Distanza da TP-3000</strong>: quanti pz/kg devono ancora ridursi per raggiungere TP-3000 ({data ? fmtN(data.meta.targetMinApk) : "20.001"}–{data ? fmtN(data.meta.targetMaxApk) : "29.000"} pz/kg). Verde = già in range o più grandi.</p>
        <p><strong>Formula</strong>: v2 = dato con nuova formula (affidabile), v1 = dato con vecchia formula (potenzialmente distorto).</p>
      </div>
    </div>
  );
}
