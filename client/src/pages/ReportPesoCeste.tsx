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
  deviationAvgWeightMg: number;
  deviationAvgWeightPct: number;
  deviationTotalWeightKg: number;
  deviationTotalWeightPct: number;
  formulaVersion: number;
  aboveTarget: boolean;
}

interface ReportData {
  baskets: BasketReport[];
  meta: {
    totalBaskets: number;
    targetApk: number;
    targetAvgWeightMg: number;
    avgTotalWeightKg: number;
    aboveTarget: number;
  };
}

type SortKey = "avgWeightMg" | "deviationAvgWeightPct" | "totalWeightKg" | "deviationTotalWeightPct" | "animalsPerKg" | "animalCount";
type SortDir = "asc" | "desc";

const fmtN = (n: number | null | undefined, dec = 0) => {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("it-IT", { minimumFractionDigits: dec, maximumFractionDigits: dec });
};

const deviationColor = (pct: number, inverted = false) => {
  const v = inverted ? -pct : pct;
  if (v >= 20) return "text-green-700 font-semibold";
  if (v >= 5) return "text-green-600";
  if (v >= -10) return "text-amber-600";
  return "text-red-600 font-semibold";
};

const deviationBg = (pct: number, inverted = false) => {
  const v = inverted ? -pct : pct;
  if (v >= 20) return "bg-green-100 border-green-300";
  if (v >= 5) return "bg-green-50 border-green-200";
  if (v >= -10) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
};

export default function ReportPesoCeste() {
  const [selectedFlupsys, setSelectedFlupsys] = useState<number[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("deviationAvgWeightPct");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showOnlyAboveTarget, setShowOnlyAboveTarget] = useState(false);

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
    setSelectedFlupsys(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    if (!data) return [];
    let rows = data.baskets;
    if (selectedFlupsys.length > 0) rows = rows.filter(b => selectedFlupsys.includes(b.flupsyId));
    if (showOnlyAboveTarget) rows = rows.filter(b => b.aboveTarget);
    return [...rows].sort((a, b) => {
      const av = a[sortKey] as number;
      const bv = b[sortKey] as number;
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [data, selectedFlupsys, showOnlyAboveTarget, sortKey, sortDir]);

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === "desc" ? <ArrowDown className="h-3 w-3 ml-1 text-blue-600" /> : <ArrowUp className="h-3 w-3 ml-1 text-blue-600" />;
  };

  const aboveCount = filtered.filter(b => b.aboveTarget).length;

  return (
    <div className="container mx-auto py-4 px-2 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Report Peso Ceste</h1>
          <p className="text-muted-foreground text-sm">Scostamenti da TP-3000 — selezione ceste per vagliatura</p>
        </div>
        <Badge variant="outline" className="self-start sm:self-center flex items-center gap-1 text-sm px-3 py-1">
          <Target className="h-4 w-4" />
          Target TP-3000: 333 mg/animale · 3.000 pz/kg
        </Badge>
      </div>

      {/* Cards riepilogo */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs text-muted-foreground font-medium">Ceste analizzate</CardTitle></CardHeader>
            <CardContent className="px-4 pb-3"><div className="text-2xl font-bold">{filtered.length}</div></CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs text-green-700 font-medium flex items-center gap-1"><TrendingUp className="h-3 w-3"/>Sopra target TP-3000</CardTitle></CardHeader>
            <CardContent className="px-4 pb-3"><div className="text-2xl font-bold text-green-700">{aboveCount}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1"><Scale className="h-3 w-3"/>Biomassa media/cesta</CardTitle></CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-2xl font-bold">{fmtN(data.meta.avgTotalWeightKg, 1)} kg</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1"><Fish className="h-3 w-3"/>Totale FLUPSY attivi</CardTitle></CardHeader>
            <CardContent className="px-4 pb-3"><div className="text-2xl font-bold">{flupsyOptions.length}</div></CardContent>
          </Card>
        </div>
      )}

      {/* Filtri */}
      <Card>
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              Filtra FLUPSY:
            </div>
            {flupsyOptions.map(f => (
              <div key={f.id} className="flex items-center gap-1.5">
                <Checkbox
                  id={`flupsy-${f.id}`}
                  checked={selectedFlupsys.includes(f.id)}
                  onCheckedChange={() => toggleFlupsy(f.id)}
                />
                <Label htmlFor={`flupsy-${f.id}`} className="text-sm cursor-pointer">{f.name}</Label>
              </div>
            ))}
            {selectedFlupsys.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedFlupsys([])}>Tutti</Button>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              <Checkbox
                id="above-target"
                checked={showOnlyAboveTarget}
                onCheckedChange={(v) => setShowOnlyAboveTarget(!!v)}
              />
              <Label htmlFor="above-target" className="text-sm cursor-pointer text-green-700 font-medium">Solo sopra TP-3000</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabella */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
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
                <th
                  className="text-right px-3 py-2 font-medium cursor-pointer hover:bg-muted select-none whitespace-nowrap"
                  onClick={() => handleSort("animalsPerKg")}
                >
                  <span className="flex items-center justify-end">pz/kg <SortIcon k="animalsPerKg" /></span>
                </th>
                <th
                  className="text-right px-3 py-2 font-medium cursor-pointer hover:bg-muted select-none whitespace-nowrap"
                  onClick={() => handleSort("avgWeightMg")}
                >
                  <span className="flex items-center justify-end">Peso medio (mg) <SortIcon k="avgWeightMg" /></span>
                </th>
                <th
                  className="text-center px-3 py-2 font-medium cursor-pointer hover:bg-muted select-none whitespace-nowrap"
                  onClick={() => handleSort("deviationAvgWeightPct")}
                >
                  <span className="flex items-center justify-center">
                    Scost. da TP-3000 <SortIcon k="deviationAvgWeightPct" />
                  </span>
                </th>
                <th
                  className="text-right px-3 py-2 font-medium cursor-pointer hover:bg-muted select-none whitespace-nowrap"
                  onClick={() => handleSort("totalWeightKg")}
                >
                  <span className="flex items-center justify-end">Biomassa (kg) <SortIcon k="totalWeightKg" /></span>
                </th>
                <th
                  className="text-center px-3 py-2 font-medium cursor-pointer hover:bg-muted select-none whitespace-nowrap"
                  onClick={() => handleSort("deviationTotalWeightPct")}
                >
                  <span className="flex items-center justify-center">
                    Scost. da media <SortIcon k="deviationTotalWeightPct" />
                  </span>
                </th>
                <th className="text-center px-3 py-2 font-medium">Formula</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-10 text-muted-foreground">Nessuna cesta trovata</td></tr>
              ) : filtered.map((b, i) => (
                <tr key={b.basketId} className={`border-b hover:bg-muted/30 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                  <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{b.flupsyName}</td>
                  <td className="px-3 py-2 font-semibold">#{b.physicalNumber}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground max-w-[120px] truncate" title={b.lotSupplier || "—"}>
                    {b.lotSupplier ? b.lotSupplier.slice(0, 18) + (b.lotSupplier.length > 18 ? "…" : "") : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                    {b.opDate ? format(new Date(b.opDate), "dd/MM/yy", { locale: it }) : "—"}
                    <span className="ml-1 opacity-60">({b.opType})</span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{fmtN(b.animalsPerKg)}</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold">{fmtN(b.avgWeightMg, 1)}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs ${deviationBg(b.deviationAvgWeightPct)}`}>
                      <span className={deviationColor(b.deviationAvgWeightPct)}>
                        {b.deviationAvgWeightPct >= 0 ? "+" : ""}{fmtN(b.deviationAvgWeightPct, 1)}%
                      </span>
                      <span className="text-muted-foreground opacity-70">
                        ({b.deviationAvgWeightMg >= 0 ? "+" : ""}{fmtN(b.deviationAvgWeightMg, 1)} mg)
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{fmtN(b.totalWeightKg, 1)}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs ${
                      b.deviationTotalWeightPct >= 20 ? "bg-blue-50 border-blue-200" :
                      b.deviationTotalWeightPct >= -10 ? "bg-gray-50 border-gray-200" :
                      "bg-orange-50 border-orange-200"
                    }`}>
                      <span className={
                        b.deviationTotalWeightPct >= 20 ? "text-blue-700 font-semibold" :
                        b.deviationTotalWeightPct >= -10 ? "text-gray-600" : "text-orange-700"
                      }>
                        {b.deviationTotalWeightPct >= 0 ? "+" : ""}{fmtN(b.deviationTotalWeightPct, 1)}%
                      </span>
                      <span className="text-muted-foreground opacity-70">
                        ({b.deviationTotalWeightKg >= 0 ? "+" : ""}{fmtN(b.deviationTotalWeightKg, 1)} kg)
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Badge variant="outline" className={`text-[10px] ${b.formulaVersion === 2 ? "bg-green-50 text-green-700 border-green-300" : "bg-amber-50 text-amber-700 border-amber-300"}`}>
                      v{b.formulaVersion}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-xs text-muted-foreground pb-4 space-y-1">
        <p><strong>Scost. da TP-3000</strong>: differenza % tra il peso medio attuale dell'animale e il target 333 mg (TP-3000 = 3.000 pz/kg). Valori positivi (verde) = animali già sopra il target.</p>
        <p><strong>Scost. da media</strong>: differenza % della biomassa totale della cesta rispetto alla media del gruppo selezionato. Aiuta a identificare ceste eccezionalmente pesanti o leggere.</p>
        <p><strong>Formula</strong>: v2 = dati affidabili (nuova formula), v1 = dati con vecchia formula (potrebbero essere distorti).</p>
      </div>
    </div>
  );
}
