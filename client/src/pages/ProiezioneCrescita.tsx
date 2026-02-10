import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, TrendingUp, CheckCircle2, Clock, Target, Plus, Trash2, Save } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  budgetProduzione: number;
  arriviSchiuditoio: number;
  giacenzaCumulativaTarget: number;
}

interface GrowthProjectionResult {
  targetSize: string;
  targetMaxAnimalsPerKg: number;
  generatedAt: string;
  year: number;
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

const MONTH_NAMES = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

export default function ProiezioneCrescita() {
  const { toast } = useToast();
  const [showHatcheryForm, setShowHatcheryForm] = useState(false);
  const [hatcheryInputs, setHatcheryInputs] = useState<Record<string, string>>({});

  const { data, isLoading, error } = useQuery<GrowthProjectionResult>({
    queryKey: ["/api/proiezione-crescita"],
  });

  const hatcheryYears = data?.monthlyContext
    ? [...new Set(data.monthlyContext.map(m => m.year))]
    : [new Date().getFullYear()];

  const { data: hatcheryData } = useQuery<HatcheryArrival[]>({
    queryKey: ["/api/proiezione-crescita/hatchery-arrivals", hatcheryYears[0]],
    enabled: !!data,
  });

  const { data: hatcheryData2 } = useQuery<HatcheryArrival[]>({
    queryKey: ["/api/proiezione-crescita/hatchery-arrivals", hatcheryYears[1]],
    enabled: !!data && hatcheryYears.length > 1,
  });

  const allHatcheryData = [...(hatcheryData || []), ...(hatcheryData2 || [])];

  const saveHatchery = useMutation({
    mutationFn: async (payload: { year: number; month: number; quantity: number }) => {
      return apiRequest("POST", "/api/proiezione-crescita/hatchery-arrivals", payload);
    },
    onSuccess: () => {
      for (const y of hatcheryYears) {
        queryClient.invalidateQueries({ queryKey: ["/api/proiezione-crescita/hatchery-arrivals", y] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/proiezione-crescita"] });
      toast({ title: "Salvato", description: "Arrivo schiuditoio salvato" });
    }
  });

  const deleteHatchery = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/proiezione-crescita/hatchery-arrivals/${id}`);
    },
    onSuccess: () => {
      for (const y of hatcheryYears) {
        queryClient.invalidateQueries({ queryKey: ["/api/proiezione-crescita/hatchery-arrivals", y] });
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

  const hatcheryMonths = mc.map(m => ({ year: m.year, month: m.month, label: m.monthLabel, monthName: m.monthName }));

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Proiezione Crescita verso {data.targetSize}</h1>
          <p className="text-sm text-muted-foreground">
            Progressione 12 mesi con ordini, budget e arrivi schiuditoio ({`target \u2264 ${formatNumber(data.targetMaxAnimalsPerKg)} an/kg`})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              Già a {data.targetSize} o superiore
            </div>
            <div className="text-2xl font-bold text-green-700">{formatNumber(data.totalAlreadyAtTarget)}</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-amber-700 mb-1">
              <Clock className="h-4 w-4" />
              In crescita verso {data.targetSize}
            </div>
            <div className="text-2xl font-bold text-amber-700">{formatNumber(data.totalNotYetAtTarget)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Tabella Riepilogativa Mensile</CardTitle>
            <Button
              variant={showHatcheryForm ? "default" : "outline"}
              size="sm"
              onClick={() => setShowHatcheryForm(!showHatcheryForm)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Arrivi Schiuditoio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-2 font-semibold sticky left-0 bg-muted/50 z-10 min-w-[200px]">Indicatore</th>
                  {mc.map((m, i) => (
                    <th key={i} className="text-center p-2 font-semibold min-w-[100px]">{m.monthLabel}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b bg-blue-50/50">
                  <td className="p-2 font-semibold sticky left-0 bg-blue-50/50 z-10">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
                      Giacenza a {data.targetSize}
                    </span>
                  </td>
                  {mc.map((m, i) => (
                    <td key={i} className="p-2 text-center font-semibold text-blue-700">
                      {formatNumber(m.giacenzaCumulativaTarget)}
                    </td>
                  ))}
                </tr>

                <tr className="border-b bg-purple-50/50">
                  <td className="p-2 font-semibold sticky left-0 bg-purple-50/50 z-10">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-purple-500 inline-block"></span>
                      Ordini {data.targetSize}
                    </span>
                  </td>
                  {mc.map((m, i) => (
                    <td key={i} className={`p-2 text-center font-semibold ${m.ordiniTarget > 0 ? 'text-purple-700' : 'text-gray-400'}`}>
                      {m.ordiniTarget > 0 ? formatNumber(m.ordiniTarget) : '-'}
                    </td>
                  ))}
                </tr>

                <tr className="border-b bg-amber-50/50">
                  <td className="p-2 font-semibold sticky left-0 bg-amber-50/50 z-10">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                      Budget Produzione
                    </span>
                  </td>
                  {mc.map((m, i) => (
                    <td key={i} className={`p-2 text-center font-semibold ${m.budgetProduzione > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                      {m.budgetProduzione > 0 ? formatNumber(m.budgetProduzione) : '-'}
                    </td>
                  ))}
                </tr>

                <tr className="border-b bg-emerald-50/50">
                  <td className="p-2 font-semibold sticky left-0 bg-emerald-50/50 z-10">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                      Arrivi Schiuditoio (TP-300)
                    </span>
                  </td>
                  {mc.map((m, i) => (
                    <td key={i} className={`p-2 text-center font-semibold ${m.arriviSchiuditoio > 0 ? 'text-emerald-700' : 'text-gray-400'}`}>
                      {m.arriviSchiuditoio > 0 ? formatNumber(m.arriviSchiuditoio) : '-'}
                    </td>
                  ))}
                </tr>

                <tr className="border-b">
                  <td className="p-2 font-semibold sticky left-0 bg-background z-10">
                    <span className="inline-flex items-center gap-1">
                      Saldo (Giacenza - Ordini)
                    </span>
                  </td>
                  {mc.map((m, i) => {
                    const saldo = m.giacenzaCumulativaTarget - m.ordiniTarget;
                    return (
                      <td key={i} className={`p-2 text-center font-bold ${saldo >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {m.ordiniTarget > 0 ? formatNumber(saldo) : '-'}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showHatcheryForm && (
        <Card className="border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-emerald-700">Inserisci Arrivi Schiuditoio (TP-300)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {hatcheryMonths.map(({ year, month, label, monthName }) => {
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
