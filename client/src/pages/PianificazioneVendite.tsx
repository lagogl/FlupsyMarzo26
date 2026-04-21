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
import { Banknote, TrendingUp, Scale, AlertTriangle, CheckCircle2, Loader2, Calculator, HelpCircle, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

export default function PianificazioneVendite() {
  const { toast } = useToast();
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
      animali: m.sales.reduce((a, s) => a + s.animalCount, 0),
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
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="risultati" data-testid="tab-risultati">Risultati Piano</TabsTrigger>
          <TabsTrigger value="dati" data-testid="tab-dati">Dati di Input</TabsTrigger>
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
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
                <div>
                  <LabelWithHelp tip="Anno solare di riferimento per il piano. Determina quali ordini cliente e quali budget di cassa vengono caricati. Range valido: 2020–2100.">
                    Anno
                  </LabelWithHelp>
                  <Input type="number" value={year} onChange={e => setYear(parseInt(e.target.value) || currentYear)} data-testid="input-year" />
                </div>
                <div>
                  <LabelWithHelp tip="Mese da cui parte la simulazione. La crescita degli animali è simulata giorno per giorno a partire dal 1° del mese scelto, con SGR specifico per taglia e mortalità mensile per taglia.">
                    Mese inizio
                  </LabelWithHelp>
                  <Select value={String(startMonth)} onValueChange={v => setStartMonth(parseInt(v))}>
                    <SelectTrigger data-testid="select-start-month"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MONTHS_IT.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <LabelWithHelp tip="Numero di mesi futuri da pianificare a partire dal mese di inizio. Orizzonti lunghi (24–60 mesi) catturano l'effetto della crescita ma rallentano il motore LP.">
                    Orizzonte (mesi)
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
                        {PRESET_HORIZONS.map(h => <SelectItem key={h} value={String(h)}>{h} mesi</SelectItem>)}
                        <SelectItem value="custom">Personalizzato…</SelectItem>
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
                  <LabelWithHelp tip={`Strategia di vendita.\n\n💰 Cassa rapida: vendi il prima possibile per coprire il budget cassa mensile (priorità liquidità).\n\n⚖️ Bilanciato: soddisfa ordini cliente + budget cassa, lascia crescere il resto.\n\n📈 Ricavo massimo: trattieni gli animali fin che cresce il valore, liquidi a fine orizzonte.`}>
                    Modalità
                  </LabelWithHelp>
                  <Select value={mode} onValueChange={v => setMode(v as Mode)}>
                    <SelectTrigger data-testid="select-mode"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cassa">💰 Cassa rapida</SelectItem>
                      <SelectItem value="bilanciato">⚖️ Bilanciato</SelectItem>
                      <SelectItem value="ricavo">📈 Ricavo massimo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <LabelWithHelp tip={`Algoritmo che decide cosa vendere.\n\n⚡ Greedy: euristica veloce (<100 ms). Sceglie mese per mese il cestello "migliore". Buona ma non garantita ottima.\n\n🧮 Ottimo LP: risolve un problema di programmazione lineare con tutte le variabili insieme (qualche secondo). Garantisce la soluzione matematicamente ottima rispetto all'obiettivo della modalità scelta.`}>
                    Motore
                  </LabelWithHelp>
                  <Select value={engine} onValueChange={v => setEngine(v as Engine)}>
                    <SelectTrigger data-testid="select-engine"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="greedy">⚡ Greedy (veloce)</SelectItem>
                      <SelectItem value="lp">🧮 Ottimo LP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => refetchPlan()} disabled={isFetching} data-testid="button-calculate">
                  {isFetching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calculator className="h-4 w-4 mr-2" />}
                  Calcola Piano
                </Button>
              </div>

              {/* Guida espandibile ai parametri */}
              <Collapsible open={guideOpen} onOpenChange={setGuideOpen} className="mt-4">
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2" data-testid="button-toggle-guide">
                    <Info className="h-4 w-4" />
                    {guideOpen ? 'Nascondi guida ai parametri' : 'Mostra guida ai parametri'}
                    {guideOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="border rounded-lg bg-muted/30 p-4 space-y-4 text-sm">
                    <div>
                      <h4 className="font-semibold mb-1 flex items-center gap-2">📅 Anno</h4>
                      <p className="text-muted-foreground">
                        Anno solare di riferimento del piano. Il sistema usa questo valore per filtrare gli <strong>ordini cliente</strong> da soddisfare e i <strong>budget cassa</strong> definiti nelle relative schede. Se l'orizzonte attraversa il 31 dicembre, anche gli ordini e i budget dell'anno successivo vengono inclusi automaticamente.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-1 flex items-center gap-2">🗓️ Mese inizio</h4>
                      <p className="text-muted-foreground">
                        Mese da cui parte la simulazione. La crescita di ogni cestello è simulata <strong>giorno per giorno</strong> usando l'SGR specifico per ogni taglia e la mortalità mensile per taglia. Se imposti un mese passato (es. gennaio in aprile), il piano "rivede" lo storico nella simulazione: utile per back-test, ma non per pianificazioni future.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-1 flex items-center gap-2">📏 Orizzonte (mesi)</h4>
                      <p className="text-muted-foreground">
                        Numero di mesi futuri pianificati a partire dal mese di inizio. <strong>Orizzonti brevi (6–12 mesi)</strong> sono adatti a piani operativi a corto termine. <strong>Orizzonti lunghi (24–36 mesi)</strong> permettono al motore di sfruttare la crescita futura (es. trattenere TP-3000 oggi per venderlo come TP-7000 fra 8 mesi), ma rallentano il motore LP (1–10 secondi su 36 mesi con molti cestelli).
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-1 flex items-center gap-2">⚙️ Modalità</h4>
                      <ul className="text-muted-foreground space-y-2 ml-2">
                        <li>
                          <strong className="text-foreground">💰 Cassa rapida</strong> — Massimizza la copertura del <em>budget cassa</em> mensile (definito nella scheda Budget Cassa). Il motore vende appena ha taglie con prezzo &gt; 0, anche se piccole, per generare liquidità immediata. Usa questa modalità quando hai bisogno di pagare fornitori, stipendi o rate a scadenza fissa.
                        </li>
                        <li>
                          <strong className="text-foreground">⚖️ Bilanciato</strong> — Compromesso fra tre obiettivi: (1) soddisfare gli ordini cliente alla taglia richiesta nel mese richiesto, (2) coprire il budget cassa mensile, (3) lasciar crescere il resto per ricavi futuri. È la modalità di default consigliata per la pianificazione operativa normale.
                        </li>
                        <li>
                          <strong className="text-foreground">📈 Ricavo massimo</strong> — Trattiene gli animali il più possibile per farli crescere verso le taglie più redditizie (TP-7000, TP-9000, TP-10000), poi liquida tutto verso fine orizzonte. Ignora il budget cassa. Usa questa modalità per stimare il <strong>valore teorico massimo</strong> dell'inventario corrente.
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-1 flex items-center gap-2">🧠 Motore</h4>
                      <ul className="text-muted-foreground space-y-2 ml-2">
                        <li>
                          <strong className="text-foreground">⚡ Greedy</strong> — Euristica rapida (&lt;100 ms). Esamina i cestelli mese per mese e sceglie ad ogni passo l'opzione localmente migliore. <em>Pro</em>: istantaneo, sempre stabile. <em>Contro</em>: non vede il futuro, può lasciare ricavo "sul tavolo" su orizzonti lunghi.
                        </li>
                        <li>
                          <strong className="text-foreground">🧮 Ottimo LP</strong> — Programmazione lineare risolta con un solver matematico. Considera <strong>tutte</strong> le decisioni dei mesi futuri simultaneamente e produce la soluzione provatamente ottima rispetto alla funzione obiettivo della modalità scelta. <em>Pro</em>: massimo ricavo possibile, copertura ordini ottimale. <em>Contro</em>: tempo di calcolo 1–10 s in base a numero di cestelli e orizzonte.
                        </li>
                      </ul>
                      <div className="mt-2 p-2 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs">
                        <strong>💡 Consiglio</strong>: usa <strong>Greedy</strong> per esplorare scenari rapidamente (cambia parametri e ricalcola), poi conferma il piano definitivo con <strong>Ottimo LP</strong>.
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <h4 className="font-semibold mb-1 flex items-center gap-2">📋 Dati richiesti per ottenere risultati significativi</h4>
                      <ul className="text-muted-foreground space-y-1 list-disc ml-5">
                        <li><strong>Listino prezzi</strong> (scheda <em>Listino Prezzi</em>): prezzo €/animale per ciascuna taglia commerciale. Le taglie senza prezzo non verranno mai vendute dal motore.</li>
                        <li><strong>Budget cassa</strong> (scheda <em>Budget Cassa</em>): obiettivo di ricavo minimo mensile, usato dalle modalità Cassa rapida e Bilanciato.</li>
                        <li><strong>Ordini cliente</strong> (modulo Ordini): vengono caricati automaticamente per anno+mese+taglia richiesta.</li>
                        <li><strong>Inventario corrente</strong>: cestelli attivi con cicli aperti, recuperati dal database.</li>
                        <li><strong>Arrivi schiuditoio futuri</strong>: pianificazioni di nuovi ingressi vengono integrate come "cestelli virtuali" disponibili dal mese di arrivo previsto.</li>
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
                  Motore: {plan.engine === 'lp' ? '🧮 LP Ottimo' : '⚡ Greedy'}
                </Badge>
                {plan.engine === 'lp' && plan.solverStatus && (
                  <>
                    <Badge variant={plan.solverStatus.feasible ? 'default' : 'destructive'} className="text-xs">
                      {plan.solverStatus.feasible ? '✓ Soluzione fattibile' : '✗ Modello infattibile'}
                    </Badge>
                    {plan.solverStatus.objective !== undefined && (
                      <Badge variant="secondary" className="text-xs">
                        Obiettivo: {fmtEur(plan.solverStatus.objective)}
                      </Badge>
                    )}
                  </>
                )}
              </div>

              {/* KPI */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card><CardContent className="pt-4">
                  <div className="text-xs text-muted-foreground">Ricavo totale</div>
                  <div className="text-xl font-bold text-emerald-600" data-testid="kpi-revenue">{fmtEur(plan.totalRevenue)}</div>
                </CardContent></Card>
                <Card><CardContent className="pt-4">
                  <div className="text-xs text-muted-foreground">Animali venduti</div>
                  <div className="text-xl font-bold" data-testid="kpi-animals">{fmtNum(plan.totalAnimalsSold)}</div>
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
                        <RechartsTooltip formatter={(v: any, name: string) => name === 'animali' ? `${fmtNum(v)} animali` : fmtEur(v)} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="ricavo" fill="#10b981" name="Ricavo" />
                        <Line yAxisId="left" type="monotone" dataKey="target" stroke="#ef4444" name="Target cassa" strokeWidth={2} />
                        <Line yAxisId="right" type="monotone" dataKey="animali" stroke="#3b82f6" name="Animali venduti" strokeDasharray="4 2" />
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
                        <TableHead className="text-right">Animali venduti</TableHead>
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
              Imposta i parametri e premi <strong>Calcola Piano</strong> per generare la pianificazione.
            </CardContent></Card>
          )}
        </TabsContent>

        {/* === DATI DI INPUT === */}
        <TabsContent value="dati" className="space-y-4">
          {inputLoading ? (
            <Card><CardContent className="pt-6 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Caricamento dati in corso…
            </CardContent></Card>
          ) : inputData ? (
            <>
              {/* Riepilogo KPI */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card><CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Cestelli attivi</p>
                  <p className="text-2xl font-bold">{fmtNum(inputData.inventory.totalBaskets)}</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Animali in inventario</p>
                  <p className="text-2xl font-bold text-blue-600">{fmtNum(inputData.inventory.totalAnimals)}</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Taglie con prezzo</p>
                  <p className="text-2xl font-bold">{inputData.priceList.filter(p => p.pricePerAnimal > 0).length}</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Ordini caricati ({inputData.year})</p>
                  <p className="text-2xl font-bold">{inputData.orders.length}</p>
                </CardContent></Card>
              </div>

              {/* Inventario per taglia */}
              <Card>
                <CardHeader><CardTitle className="text-base">🦪 Inventario corrente per taglia</CardTitle>
                  <CardDescription>Cestelli attivi e animali disponibili al momento del calcolo</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Taglia</TableHead>
                        <TableHead className="text-right">Cestelli</TableHead>
                        <TableHead className="text-right">Animali</TableHead>
                        <TableHead>% del totale</TableHead>
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
                  <CardHeader><CardTitle className="text-base">🐣 Arrivi schiuditoio pianificati</CardTitle>
                    <CardDescription>Animali in ingresso che saranno aggiunti alla simulazione al mese di arrivo</CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Anno</TableHead>
                          <TableHead>Mese</TableHead>
                          <TableHead className="text-right">Quantità prevista</TableHead>
                          <TableHead className="text-right">Quantità effettiva</TableHead>
                          <TableHead className="text-right">Subtotale effettivo</TableHead>
                          <TableHead>Note</TableHead>
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
                  <CardHeader><CardTitle className="text-base">📦 Ordini cliente {inputData.year}</CardTitle>
                    <CardDescription>Ordini aperti per mese e taglia che il motore cercherà di soddisfare</CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mese</TableHead>
                          <TableHead>Taglia</TableHead>
                          <TableHead className="text-right">Animali richiesti</TableHead>
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
                <CardHeader><CardTitle className="text-base">📈 SGR mensile per taglia (% giornaliero)</CardTitle>
                  <CardDescription>Specific Growth Rate usato per simulare la crescita giorno per giorno. Valori in % al giorno.</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mese</TableHead>
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
                  <CardHeader><CardTitle className="text-base">💀 Mortalità mensile per taglia (%)</CardTitle>
                    <CardDescription>Percentuale di mortalità mensile applicata a ciascuna classe di taglia durante la simulazione</CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Taglia</TableHead>
                          {Array.from({ length: 12 }, (_, i) => (
                            <TableHead key={i} className="text-right text-xs">
                              {['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'][i]}
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
                Dati aggiornati: {new Date(inputData.generatedAt).toLocaleString('it-IT')}
                {' · '}
                <button onClick={() => refetchInputData()} className="underline hover:text-foreground">Aggiorna</button>
              </p>
            </>
          ) : (
            <Card><CardContent className="pt-6 text-center text-muted-foreground">
              Errore nel caricamento dei dati di input.
            </CardContent></Card>
          )}
        </TabsContent>

        {/* === LISTINO === */}
        <TabsContent value="listino">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Banknote className="h-5 w-5 text-emerald-600" />Listino prezzi (€ per animale)</CardTitle>
              <CardDescription>Gli animali sono venduti a numero. Imposta il prezzo per singolo animale per ciascuna taglia commerciale. Lascia vuoto (o 0) per non vendere quella taglia.</CardDescription>
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
