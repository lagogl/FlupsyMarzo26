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
import { Banknote, TrendingUp, Scale, AlertTriangle, CheckCircle2, Loader2, Calculator } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Bar, ComposedChart } from "recharts";

const SALE_SIZES = [
  'TP-10000', 'TP-9000', 'TP-8000', 'TP-7000', 'TP-6000', 'TP-5500',
  'TP-5000', 'TP-4500', 'TP-4000', 'TP-3500', 'TP-3000', 'TP-2800',
  'TP-2500', 'TP-2000', 'TP-1900', 'TP-1800', 'TP-1500', 'TP-1260',
  'TP-1140', 'TP-1000', 'TP-800', 'TP-700', 'TP-600', 'TP-500',
  'TP-450', 'TP-350', 'TP-300', 'TP-250', 'TP-180'
];

const MONTHS_IT = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

type Mode = 'cassa' | 'ricavo' | 'bilanciato';

interface PriceListEntry { id: number; sizeCode: string; pricePerKg: number; notes: string | null; }
interface CashTarget { id: number; year: number; month: number; minRevenue: number; }

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

export default function PianificazioneVendite() {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = useState(currentYear);
  const [startMonth, setStartMonth] = useState(currentMonth);
  const [monthsHorizon, setMonthsHorizon] = useState(12);
  const [mode, setMode] = useState<Mode>('bilanciato');

  // === Listino Prezzi ===
  const { data: priceList = [], isLoading: priceLoading } = useQuery<PriceListEntry[]>({
    queryKey: ['/api/pianificazione-vendite/price-list'],
  });
  const priceMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of priceList) m[p.sizeCode] = p.pricePerKg;
    return m;
  }, [priceList]);
  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({});

  const savePriceMutation = useMutation({
    mutationFn: async (vars: { sizeCode: string; pricePerKg: number }) =>
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
  const { data: plan, isLoading: planLoading, refetch: refetchPlan, isFetching } = useQuery<PlanResult>({
    queryKey: ['/api/pianificazione-vendite', year, startMonth, monthsHorizon, mode],
    queryFn: async () => {
      const r = await fetch(`/api/pianificazione-vendite?year=${year}&startMonth=${startMonth}&monthsHorizon=${monthsHorizon}&mode=${mode}`);
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
    savePriceMutation.mutate({ sizeCode, pricePerKg: num });
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
      kg: Math.round(m.totalKg),
    }));
  }, [plan]);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-[1600px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Calculator className="h-7 w-7 text-blue-600" />
            Pianificazione Vendite Ottimizzata
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bilanciamento tra cassa, ricavo massimo e copertura ordini su orizzonte multi-mensile.
          </p>
        </div>
      </div>

      <Tabs defaultValue="risultati" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-xl">
          <TabsTrigger value="risultati" data-testid="tab-risultati">Risultati Piano</TabsTrigger>
          <TabsTrigger value="listino" data-testid="tab-listino">Listino Prezzi</TabsTrigger>
          <TabsTrigger value="cassa" data-testid="tab-cassa">Budget Cassa</TabsTrigger>
        </TabsList>

        {/* === RISULTATI === */}
        <TabsContent value="risultati" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Parametri di calcolo</CardTitle>
              <CardDescription>Imposta i parametri e calcola il piano</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                <div>
                  <Label>Anno</Label>
                  <Input type="number" value={year} onChange={e => setYear(parseInt(e.target.value) || currentYear)} data-testid="input-year" />
                </div>
                <div>
                  <Label>Mese inizio</Label>
                  <Select value={String(startMonth)} onValueChange={v => setStartMonth(parseInt(v))}>
                    <SelectTrigger data-testid="select-start-month"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MONTHS_IT.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Orizzonte (mesi)</Label>
                  <Select value={String(monthsHorizon)} onValueChange={v => setMonthsHorizon(parseInt(v))}>
                    <SelectTrigger data-testid="select-horizon"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[6, 12, 18, 24, 36].map(h => <SelectItem key={h} value={String(h)}>{h} mesi</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Modalità</Label>
                  <Select value={mode} onValueChange={v => setMode(v as Mode)}>
                    <SelectTrigger data-testid="select-mode"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cassa">💰 Cassa rapida</SelectItem>
                      <SelectItem value="bilanciato">⚖️ Bilanciato</SelectItem>
                      <SelectItem value="ricavo">📈 Ricavo massimo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => refetchPlan()} disabled={isFetching} data-testid="button-calculate">
                  {isFetching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calculator className="h-4 w-4 mr-2" />}
                  Calcola Piano
                </Button>
              </div>

              <div className="mt-3 text-xs text-muted-foreground grid grid-cols-1 md:grid-cols-3 gap-2">
                <div><strong>💰 Cassa rapida:</strong> vendi appena possibile per coprire il budget mensile.</div>
                <div><strong>⚖️ Bilanciato:</strong> soddisfa ordini + budget cassa, lascia crescere il resto.</div>
                <div><strong>📈 Ricavo massimo:</strong> trattieni il più possibile, liquidi a fine orizzonte.</div>
              </div>
            </CardContent>
          </Card>

          {plan && (
            <>
              {/* KPI */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card><CardContent className="pt-4">
                  <div className="text-xs text-muted-foreground">Ricavo totale</div>
                  <div className="text-xl font-bold text-emerald-600" data-testid="kpi-revenue">{fmtEur(plan.totalRevenue)}</div>
                </CardContent></Card>
                <Card><CardContent className="pt-4">
                  <div className="text-xs text-muted-foreground">Kg venduti</div>
                  <div className="text-xl font-bold">{fmtKg(plan.totalKgSold)}</div>
                </CardContent></Card>
                <Card><CardContent className="pt-4">
                  <div className="text-xs text-muted-foreground">Animali venduti</div>
                  <div className="text-xl font-bold">{fmtNum(plan.totalAnimalsSold)}</div>
                </CardContent></Card>
                <Card><CardContent className="pt-4">
                  <div className="text-xs text-muted-foreground">Mesi sotto budget</div>
                  <div className={`text-xl font-bold ${plan.monthsBelowCashTarget > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {plan.monthsBelowCashTarget} / {plan.monthsHorizon}
                  </div>
                </CardContent></Card>
                <Card><CardContent className="pt-4">
                  <div className="text-xs text-muted-foreground">Ordini scoperti</div>
                  <div className={`text-xl font-bold ${plan.totalShortfall > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {fmtNum(plan.totalShortfall)}
                  </div>
                </CardContent></Card>
              </div>

              {/* Grafico */}
              <Card>
                <CardHeader><CardTitle className="text-lg">Andamento mensile cassa</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mese" />
                        <YAxis yAxisId="left" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                        <YAxis yAxisId="right" orientation="right" />
                        <RechartsTooltip formatter={(v: any, name: string) => name === 'kg' ? `${fmtNum(v)} kg` : fmtEur(v)} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="ricavo" fill="#10b981" name="Ricavo" />
                        <Line yAxisId="left" type="monotone" dataKey="target" stroke="#ef4444" name="Target cassa" strokeWidth={2} />
                        <Line yAxisId="right" type="monotone" dataKey="kg" stroke="#3b82f6" name="Kg venduti" strokeDasharray="4 2" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Tabella mensile */}
              <Card>
                <CardHeader><CardTitle className="text-lg">Dettaglio mensile</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mese</TableHead>
                        <TableHead className="text-right">Kg venduti</TableHead>
                        <TableHead className="text-right">Ricavo</TableHead>
                        <TableHead className="text-right">Target</TableHead>
                        <TableHead className="text-right">Gap</TableHead>
                        <TableHead className="text-right">Ordini scoperti</TableHead>
                        <TableHead>Vendite</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plan.monthlyPlan.map(m => {
                        const shortfallTotal = Object.values(m.orderShortfallBySize).reduce((a, b) => a + b, 0);
                        return (
                          <TableRow key={`${m.year}-${m.month}`}>
                            <TableCell className="font-medium">{m.monthName}</TableCell>
                            <TableCell className="text-right">{fmtKg(m.totalKg)}</TableCell>
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
                                    if (!acc[k]) acc[k] = { sizeCode: s.sizeCode, reason: s.reason, kg: 0, rev: 0 };
                                    acc[k].kg += s.weightKg;
                                    acc[k].rev += s.revenue;
                                    return acc;
                                  }, {} as Record<string, { sizeCode: string; reason: string; kg: number; rev: number }>)
                                ).map(([k, v]) => (
                                  <Badge key={k} variant={v.reason === 'ordine' ? 'default' : v.reason === 'liquidazione' ? 'secondary' : 'outline'} className="text-xs">
                                    {v.sizeCode} · {fmtKg(v.kg)} · {fmtEur(v.rev)}
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
              Imposta i parametri e premi <strong>Calcola Piano</strong> per generare la pianificazione.
            </CardContent></Card>
          )}
        </TabsContent>

        {/* === LISTINO === */}
        <TabsContent value="listino">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Banknote className="h-5 w-5 text-emerald-600" />Listino prezzi (€/kg)</CardTitle>
              <CardDescription>Imposta il prezzo unitario per ciascuna taglia commerciale. Lascia vuoto per non vendere quella taglia.</CardDescription>
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
                          step="0.01"
                          placeholder="€/kg"
                          value={display}
                          onChange={e => setPriceEdits(prev => ({ ...prev, [sz]: e.target.value }))}
                          className="flex-1"
                          data-testid={`input-price-${sz}`}
                        />
                        <Button size="sm" variant={dirty ? 'default' : 'ghost'} onClick={() => handleSavePrice(sz)} disabled={!dirty}>
                          Salva
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
              <CardTitle className="text-lg flex items-center gap-2"><Scale className="h-5 w-5 text-blue-600" />Budget cassa minimo (€/mese)</CardTitle>
              <CardDescription>Imposta il ricavo minimo richiesto ogni mese per l'anno {year}. Lascia 0 per non vincolare.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex items-center gap-2">
                <Label>Anno</Label>
                <Input type="number" value={year} onChange={e => setYear(parseInt(e.target.value) || currentYear)} className="w-32" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {MONTHS_IT.map((label, i) => {
                  const month = i + 1;
                  const current = cashMap[month];
                  const editing = cashEdits[month];
                  const display = editing !== undefined ? editing : (current !== undefined ? String(current) : '');
                  const dirty = editing !== undefined && editing !== (current !== undefined ? String(current) : '');
                  return (
                    <div key={month} className="flex items-center gap-2 p-2 border rounded">
                      <span className="text-sm w-20">{label}</span>
                      <Input
                        type="number"
                        step="100"
                        placeholder="€"
                        value={display}
                        onChange={e => setCashEdits(prev => ({ ...prev, [month]: e.target.value }))}
                        className="flex-1"
                        data-testid={`input-cash-${month}`}
                      />
                      <Button size="sm" variant={dirty ? 'default' : 'ghost'} onClick={() => handleSaveCash(month)} disabled={!dirty}>
                        Salva
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
