import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2, Download, Activity, Gauge, Percent, Wind, Thermometer, Waves,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAcquaScada } from '@/components/dashboard/AcquaScadaCards';

type ScadaParamKey = 'o2sat' | 'o2mgl' | 'o2temp' | 'vasca' | 'laguna';

const SCADA_PARAMS: { key: ScadaParamKey; label: string; unit: string; color: string; digits: number }[] = [
  { key: 'o2sat', label: 'Saturazione O2', unit: '%', color: '#2563eb', digits: 1 },
  { key: 'o2mgl', label: 'Ossigeno disciolto', unit: 'mg/L', color: '#059669', digits: 2 },
  { key: 'o2temp', label: 'Temperatura acqua', unit: '°C', color: '#dc2626', digits: 1 },
  { key: 'vasca', label: 'Livello vasca idrovore', unit: 'cm', color: '#0284c7', digits: 1 },
  { key: 'laguna', label: 'Livello laguna', unit: 'cm', color: '#0891b2', digits: 1 },
];

const SCADA_RANGE_OPTIONS = [
  { value: '0.25', label: 'Ultime 6 ore' },
  { value: '1', label: 'Ultime 24 ore' },
  { value: '7', label: 'Ultimi 7 giorni' },
  { value: '30', label: 'Ultimi 30 giorni' },
];

interface HistoryResponse {
  parameter: string;
  description: string | null;
  unit: string | null;
  from: string;
  to: string;
  count: number;
  readings: { value: number; timestamp: string }[];
}

function fmt(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined) return '-';
  return v.toFixed(digits);
}

export default function AcquaScadaHistory() {
  const [param, setParam] = useState<ScadaParamKey>('o2mgl');
  const [rangeDays, setRangeDays] = useState<string>('1');

  const paramDef = SCADA_PARAMS.find((p) => p.key === param)!;

  const { data: live, isLoading: isLoadingLive } = useAcquaScada();

  const fromISO = useMemo(() => {
    const d = new Date();
    d.setTime(d.getTime() - parseFloat(rangeDays) * 24 * 60 * 60 * 1000);
    return d.toISOString();
  }, [rangeDays]);

  const { data: history, isLoading: isLoadingHistory, isError } = useQuery<HistoryResponse>({
    queryKey: ['/api/acquascada/history', param, rangeDays],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('parameter', param);
      params.set('from', fromISO);
      const res = await fetch(`/api/acquascada/history?${params.toString()}`);
      if (!res.ok) throw new Error('Errore nel recupero dello storico AcquaSCADA');
      return res.json();
    },
    staleTime: 60 * 1000,
  });

  const chartData = useMemo(() => {
    if (!history?.readings) return [];
    return history.readings.map((r) => ({
      ts: new Date(r.timestamp).getTime(),
      label: new Date(r.timestamp).toLocaleString('it-IT', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
      }),
      value: r.value,
    }));
  }, [history]);

  const handleExport = () => {
    if (!history?.readings || history.readings.length === 0) return;
    const rows = [...history.readings]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .map((r) => ({
        'Data/Ora': new Date(r.timestamp).toLocaleString('it-IT'),
        Parametro: paramDef.label,
        [`Valore (${paramDef.unit})`]: r.value,
      }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'AcquaSCADA');
    XLSX.writeFile(wb, `acquascada_${param}.xlsx`);
  };

  const probe = live?.oxygenProbe;
  const levels = live?.levels;
  const liveCards = [
    { icon: <Percent className="h-5 w-5 text-blue-500" />, label: 'Saturazione O2', value: fmt(probe?.saturation, 1), unit: '%' },
    { icon: <Wind className="h-5 w-5 text-emerald-600" />, label: 'Ossigeno disciolto', value: fmt(probe?.dissolvedOxygen, 2), unit: 'mg/L' },
    { icon: <Thermometer className="h-5 w-5 text-red-500" />, label: 'Temperatura acqua', value: fmt(probe?.temperature, 1), unit: '°C' },
    { icon: <Waves className="h-5 w-5 text-sky-600" />, label: 'Livello vasca', value: fmt(levels?.vasca?.value, 1), unit: 'cm' },
    { icon: <Waves className="h-5 w-5 text-cyan-600" />, label: 'Livello laguna', value: fmt(levels?.laguna?.value, 1), unit: 'cm' },
  ];

  const lastUpdate = probe?.lastUpdate
    ? new Date(probe.lastUpdate).toLocaleString('it-IT')
    : null;

  const recentRows = useMemo(() => {
    if (!history?.readings) return [];
    return [...history.readings]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 200);
  }, [history]);

  return (
    <div className="space-y-4 pt-6 border-t">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Gauge className="h-6 w-6 text-emerald-600" />
            <h2 className="text-xl font-bold">AcquaSCADA — Sonda Ossigeno DF (SEN0681) e Livelli</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Dati in tempo reale dall'impianto: ossigeno, temperatura acqua e livelli idrici
            (vasca idrovore e laguna). Le letture arrivano ogni ~5 secondi.
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={!history?.readings || history.readings.length === 0}
          className="bg-green-600 hover:bg-green-700 text-white"
          data-testid="button-export-acquascada"
        >
          <Download className="h-4 w-4 mr-2" /> Esporta Excel
        </Button>
      </div>

      {/* Valori attuali */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {liveCards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                {c.icon} {c.label}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                {isLoadingLive ? (
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
      {lastUpdate && (
        <p className="text-xs text-muted-foreground -mt-2">Ultima misura · {lastUpdate}</p>
      )}

      {/* Grafico storico */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-600" /> Andamento storico
              </CardTitle>
              <CardDescription>Seleziona la misura e il periodo da visualizzare.</CardDescription>
            </div>
            <div className="w-full md:w-52">
              <Select value={rangeDays} onValueChange={setRangeDays}>
                <SelectTrigger data-testid="select-scada-range"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SCADA_RANGE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {SCADA_PARAMS.map((p) => {
              const active = param === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setParam(p.key)}
                  data-testid={`scada-param-${p.key}`}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${active ? 'text-white border-transparent' : 'text-muted-foreground bg-muted/40 hover:bg-muted'}`}
                  style={active ? { backgroundColor: p.color } : undefined}
                >
                  {p.label}{p.unit ? ` (${p.unit})` : ''}
                </button>
              );
            })}
          </div>

          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Caricamento storico...
            </div>
          ) : isError ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Impossibile recuperare lo storico da AcquaSCADA in questo momento. Riprova tra qualche istante.
            </div>
          ) : chartData.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Nessun dato registrato nel periodo selezionato.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <RechartsLineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={40} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  domain={['auto', 'auto']}
                  tickFormatter={(v: number) => v.toFixed(paramDef.digits)}
                />
                <Tooltip
                  formatter={(v: any) => [`${Number(v).toFixed(paramDef.digits)} ${paramDef.unit}`, paramDef.label]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  name={`${paramDef.label} (${paramDef.unit})`}
                  stroke={paramDef.color}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Tabella */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Storico letture — {paramDef.label}</CardTitle>
          <CardDescription>
            {history?.count ?? 0} letture nel periodo selezionato (campionate)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Data/Ora</th>
                  <th className="py-2 px-2 font-medium text-right">{paramDef.label} ({paramDef.unit})</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingHistory ? (
                  <tr><td colSpan={2} className="py-8 text-center text-muted-foreground">Caricamento...</td></tr>
                ) : recentRows.length === 0 ? (
                  <tr><td colSpan={2} className="py-8 text-center text-muted-foreground">Nessun dato disponibile</td></tr>
                ) : (
                  recentRows.map((r, i) => (
                    <tr key={`${r.timestamp}-${i}`} className="border-b hover:bg-muted/30">
                      <td className="py-1.5 pr-4 whitespace-nowrap">{new Date(r.timestamp).toLocaleString('it-IT')}</td>
                      <td className="py-1.5 px-2 text-right">{fmt(r.value, paramDef.digits)}</td>
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
