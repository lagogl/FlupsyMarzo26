import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import {
  Loader2, RefreshCw, Download, Activity, Thermometer, Droplets,
  FlaskConical, Wind, Sun, AlertTriangle, Waves,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface SeneyeReading {
  id: number;
  deviceId: string;
  deviceName: string;
  recordDate: string;
  temperature: number | null;
  ph: number | null;
  nh3: number | null;
  nh4: number | null;
  o2: number | null;
  lux: number | null;
  par: number | null;
  kelvin: number | null;
}

interface CurrentResponse {
  source: 'live' | 'stored';
  reading: {
    deviceName: string;
    temperature: number | null;
    ph: number | null;
    nh3: number | null;
    nh4: number | null;
    o2: number | null;
    lux: number | null;
    par: number | null;
    kelvin: number | null;
    recordDate?: string;
  };
  warning?: string;
}

type ParamKey = 'temperature' | 'ph' | 'nh3' | 'nh4' | 'o2' | 'lux' | 'par';

const PARAMS: { key: ParamKey; label: string; unit: string; color: string }[] = [
  { key: 'temperature', label: 'Temperatura', unit: '°C', color: '#dc2626' },
  { key: 'ph', label: 'pH', unit: '', color: '#7c3aed' },
  { key: 'nh3', label: 'Ammoniaca NH3', unit: 'ppm', color: '#ca8a04' },
  { key: 'nh4', label: 'NH4', unit: '', color: '#0891b2' },
  { key: 'o2', label: 'Ossigeno O2', unit: 'mg/L', color: '#2563eb' },
  { key: 'lux', label: 'Luce (lux)', unit: 'lux', color: '#16a34a' },
  { key: 'par', label: 'PAR', unit: '', color: '#db2777' },
];

const RANGE_OPTIONS = [
  { value: '1', label: 'Ultime 24 ore' },
  { value: '7', label: 'Ultimi 7 giorni' },
  { value: '30', label: 'Ultimi 30 giorni' },
  { value: '90', label: 'Ultimi 90 giorni' },
  { value: 'all', label: 'Tutto lo storico' },
];

function fmt(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined) return '-';
  return v.toFixed(digits);
}

export default function SeneyeMonitor() {
  const { toast } = useToast();
  const [rangeDays, setRangeDays] = useState<string>('7');
  const [activeParams, setActiveParams] = useState<ParamKey[]>(['temperature', 'ph', 'o2']);

  // Lettura corrente (live)
  const { data: current, isLoading: isLoadingCurrent, refetch: refetchCurrent } =
    useQuery<CurrentResponse>({
      queryKey: ['/api/seneye/current'],
      refetchInterval: 5 * 60 * 1000,
    });

  // Storico
  const fromParam = useMemo(() => {
    if (rangeDays === 'all') return null;
    const d = new Date();
    d.setDate(d.getDate() - parseInt(rangeDays, 10));
    return d.toISOString();
  }, [rangeDays]);

  const { data: readings, isLoading: isLoadingReadings } = useQuery<SeneyeReading[]>({
    queryKey: ['/api/seneye/readings', rangeDays],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (fromParam) params.set('from', fromParam);
      params.set('limit', '5000');
      const res = await fetch(`/api/seneye/readings?${params.toString()}`);
      if (!res.ok) throw new Error('Errore nel recupero dello storico');
      return res.json();
    },
  });

  const pollMutation = useMutation({
    mutationFn: () => apiRequest({ url: '/api/seneye/poll', method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/seneye/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/seneye/readings'] });
      refetchCurrent();
      toast({ title: 'Lettura aggiornata', description: 'Nuovo dato della sonda salvato.' });
    },
    onError: (e: any) => {
      toast({ title: 'Errore', description: e?.message || 'Impossibile leggere la sonda', variant: 'destructive' });
    },
  });

  // Dati per il grafico in ordine cronologico crescente
  const chartData = useMemo(() => {
    if (!readings) return [];
    return [...readings]
      .sort((a, b) => new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime())
      .map((r) => {
        const row: Record<string, any> = {
          ts: new Date(r.recordDate).getTime(),
          label: new Date(r.recordDate).toLocaleString('it-IT', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
          }),
        };
        for (const p of PARAMS) row[p.key] = r[p.key];
        return row;
      });
  }, [readings]);

  const toggleParam = (key: ParamKey) => {
    setActiveParams((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleExport = () => {
    if (!readings || readings.length === 0) return;
    const rows = [...readings]
      .sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime())
      .map((r) => ({
        'Data/Ora': new Date(r.recordDate).toLocaleString('it-IT'),
        Sonda: r.deviceName,
        'Temperatura (°C)': r.temperature ?? '',
        pH: r.ph ?? '',
        'NH3 (ppm)': r.nh3 ?? '',
        NH4: r.nh4 ?? '',
        'O2 (mg/L)': r.o2 ?? '',
        Lux: r.lux ?? '',
        PAR: r.par ?? '',
        Kelvin: r.kelvin ?? '',
      }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sonda DF SIFONI');
    XLSX.writeFile(wb, 'sonda_df_sifoni.xlsx');
  };

  const cur = current?.reading;
  const liveCards = [
    { icon: <Thermometer className="h-5 w-5 text-red-500" />, label: 'Temperatura', value: fmt(cur?.temperature, 2), unit: '°C' },
    { icon: <Droplets className="h-5 w-5 text-purple-500" />, label: 'pH', value: fmt(cur?.ph, 2), unit: '' },
    { icon: <FlaskConical className="h-5 w-5 text-yellow-600" />, label: 'Ammoniaca NH3', value: fmt(cur?.nh3, 3), unit: 'ppm' },
    { icon: <Wind className="h-5 w-5 text-blue-500" />, label: 'Ossigeno O2', value: fmt(cur?.o2, 2), unit: 'mg/L' },
    { icon: <Sun className="h-5 w-5 text-green-500" />, label: 'PAR / Lux', value: `${fmt(cur?.par, 0)} / ${fmt(cur?.lux, 0)}`, unit: '' },
  ];

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Waves className="h-6 w-6 text-cyan-600" />
            <h1 className="text-2xl font-bold">Sonda DF SIFONI</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Dati ambientali in tempo reale dalla sonda Seneye <strong>DF SIFONI</strong>.
            La lettura si aggiorna automaticamente ogni 30 minuti e viene salvata nello storico.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => pollMutation.mutate()}
            disabled={pollMutation.isPending}
            data-testid="button-poll-now"
          >
            {pollMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Aggiorna ora
          </Button>
          <Button
            onClick={handleExport}
            disabled={!readings || readings.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white"
            data-testid="button-export-seneye"
          >
            <Download className="h-4 w-4 mr-2" /> Esporta Excel
          </Button>
        </div>
      </div>

      {/* Avviso configurazione / fonte */}
      {current?.warning && (
        <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>API Seneye non raggiungibile in questo momento: {current.warning}. Mostro l'ultimo dato salvato.</span>
        </div>
      )}

      {/* Letture correnti */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {liveCards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                {c.icon} {c.label}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                {isLoadingCurrent ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <span className="text-2xl font-bold">{c.value}</span>
                    {c.unit && <span className="text-xs text-muted-foreground">{c.unit}</span>}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {cur && (
        <p className="text-xs text-muted-foreground -mt-2">
          {current?.source === 'live' ? 'Dato live dall\'API Seneye' : 'Ultimo dato salvato'}
          {current?.reading.recordDate ? ` · ${new Date(current.reading.recordDate).toLocaleString('it-IT')}` : ''}
        </p>
      )}

      {/* Grafico */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-600" /> Andamento parametri
              </CardTitle>
              <CardDescription>Seleziona il periodo e i parametri da confrontare.</CardDescription>
            </div>
            <div className="w-full md:w-52">
              <Select value={rangeDays} onValueChange={setRangeDays}>
                <SelectTrigger data-testid="select-range"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RANGE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {PARAMS.map((p) => {
              const active = activeParams.includes(p.key);
              return (
                <button
                  key={p.key}
                  onClick={() => toggleParam(p.key)}
                  data-testid={`param-${p.key}`}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${active ? 'text-white border-transparent' : 'text-muted-foreground bg-muted/40 hover:bg-muted'}`}
                  style={active ? { backgroundColor: p.color } : undefined}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {isLoadingReadings ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Caricamento storico...
            </div>
          ) : chartData.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Nessun dato registrato nel periodo selezionato. I dati vengono raccolti automaticamente ogni 30 minuti.
            </div>
          ) : activeParams.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Seleziona almeno un parametro per visualizzare il grafico.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <RechartsLineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={40} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {PARAMS.filter((p) => activeParams.includes(p.key)).map((p) => (
                  <Line
                    key={p.key}
                    type="monotone"
                    dataKey={p.key}
                    name={`${p.label}${p.unit ? ` (${p.unit})` : ''}`}
                    stroke={p.color}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                ))}
              </RechartsLineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Tabella */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Storico letture</CardTitle>
          <CardDescription>{readings?.length ?? 0} letture nel periodo selezionato</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Data/Ora</th>
                  <th className="py-2 px-2 font-medium text-right">Temp °C</th>
                  <th className="py-2 px-2 font-medium text-right">pH</th>
                  <th className="py-2 px-2 font-medium text-right">NH3</th>
                  <th className="py-2 px-2 font-medium text-right">NH4</th>
                  <th className="py-2 px-2 font-medium text-right">O2</th>
                  <th className="py-2 px-2 font-medium text-right">Lux</th>
                  <th className="py-2 px-2 font-medium text-right">PAR</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingReadings ? (
                  <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Caricamento...</td></tr>
                ) : !readings || readings.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Nessun dato disponibile</td></tr>
                ) : (
                  readings.slice(0, 200).map((r) => (
                    <tr key={r.id} className="border-b hover:bg-muted/30">
                      <td className="py-1.5 pr-4 whitespace-nowrap">{new Date(r.recordDate).toLocaleString('it-IT')}</td>
                      <td className="py-1.5 px-2 text-right">{fmt(r.temperature, 2)}</td>
                      <td className="py-1.5 px-2 text-right">{fmt(r.ph, 2)}</td>
                      <td className="py-1.5 px-2 text-right">{fmt(r.nh3, 3)}</td>
                      <td className="py-1.5 px-2 text-right">{fmt(r.nh4, 2)}</td>
                      <td className="py-1.5 px-2 text-right">{fmt(r.o2, 2)}</td>
                      <td className="py-1.5 px-2 text-right">{fmt(r.lux, 0)}</td>
                      <td className="py-1.5 px-2 text-right">{fmt(r.par, 0)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
