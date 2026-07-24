import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2, Download, Activity, Gauge, Percent, Wind, Thermometer, Waves, FlaskConical, Droplets,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAcquaScada } from '@/components/dashboard/AcquaScadaCards';

type ScadaParamKey =
  | 'o2sat' | 'o2mgl' | 'o2temp'
  | 'p71sat' | 'p71mgl' | 'p71temp'
  | 'p72nh3' | 'p72ph' | 'p72temp'
  | 'vasca' | 'laguna';

const SCADA_PARAMS: { key: ScadaParamKey; label: string; unit: string; color: string; digits: number; group: string }[] = [
  { key: 'o2sat',   label: 'Sat. O₂ Vivaio',    unit: '%',    color: '#2563eb', digits: 1, group: 'Vivaio (ID 70)' },
  { key: 'o2mgl',   label: 'O₂ disc. Vivaio',   unit: 'mg/L', color: '#059669', digits: 2, group: 'Vivaio (ID 70)' },
  { key: 'o2temp',  label: 'Temp. Vivaio',       unit: '°C',   color: '#dc2626', digits: 1, group: 'Vivaio (ID 70)' },
  { key: 'p71sat',  label: 'Sat. O₂ Flupsy',     unit: '%',    color: '#0d9488', digits: 1, group: 'Flupsy (ID 71)' },
  { key: 'p71mgl',  label: 'O₂ disc. Flupsy',    unit: 'mg/L', color: '#0891b2', digits: 2, group: 'Flupsy (ID 71)' },
  { key: 'p71temp', label: 'Temp. Flupsy',        unit: '°C',   color: '#b45309', digits: 1, group: 'Flupsy (ID 71)' },
  { key: 'p72nh3',  label: 'Ammoniaca NH₃',      unit: 'mg/L', color: '#7c3aed', digits: 3, group: 'NH₃/pH (ID 72)' },
  { key: 'p72ph',   label: 'pH',                 unit: 'pH',   color: '#6d28d9', digits: 2, group: 'NH₃/pH (ID 72)' },
  { key: 'p72temp', label: 'Temp. SEN0711',       unit: '°C',   color: '#9333ea', digits: 1, group: 'NH₃/pH (ID 72)' },
  { key: 'vasca',   label: 'Livello vasca',       unit: 'cm',   color: '#0284c7', digits: 1, group: 'Livelli' },
  { key: 'laguna',  label: 'Livello laguna',      unit: 'cm',   color: '#0891b2', digits: 1, group: 'Livelli' },
];

const SCADA_RANGE_OPTIONS = [
  { value: '0.25', label: 'Ultime 6 ore' },
  { value: '1',    label: 'Ultime 24 ore' },
  { value: '7',    label: 'Ultimi 7 giorni' },
  { value: '30',   label: 'Ultimi 30 giorni' },
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

const GROUPS = ['Vivaio (ID 70)', 'Flupsy (ID 71)', 'NH₃/pH (ID 72)', 'Livelli'];

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

  // Valori live per tutte le sonde
  const vivaio = live?.oxygenProbeVivaio ?? live?.oxygenProbe;
  const flupsy = live?.oxygenProbeFlupsy;
  const nh3ph  = live?.nh3phProbe;
  const levels = live?.levels;

  const liveCards = [
    { icon: <Percent className="h-4 w-4 text-blue-500" />,    label: 'Sat. O₂ Vivaio',   value: fmt(vivaio?.saturation, 1),    unit: '%' },
    { icon: <Wind className="h-4 w-4 text-emerald-600" />,    label: 'O₂ disc. Vivaio',  value: fmt(vivaio?.dissolvedOxygen, 2), unit: 'mg/L' },
    { icon: <Thermometer className="h-4 w-4 text-red-500" />, label: 'Temp. Vivaio',     value: fmt(vivaio?.temperature, 1),    unit: '°C' },
    { icon: <Percent className="h-4 w-4 text-teal-500" />,    label: 'Sat. O₂ Flupsy',   value: fmt(flupsy?.saturation, 1),    unit: '%' },
    { icon: <Droplets className="h-4 w-4 text-teal-600" />,   label: 'O₂ disc. Flupsy',  value: fmt(flupsy?.dissolvedOxygen, 2), unit: 'mg/L' },
    { icon: <FlaskConical className="h-4 w-4 text-violet-500" />, label: 'NH₃',           value: fmt(nh3ph?.ammonia, 3),         unit: 'mg/L' },
    { icon: <Gauge className="h-4 w-4 text-indigo-500" />,    label: 'pH',               value: fmt(nh3ph?.ph, 2),              unit: 'pH' },
    { icon: <Waves className="h-4 w-4 text-sky-600" />,       label: 'Livello vasca',    value: fmt(levels?.vasca?.value, 1),   unit: 'cm' },
    { icon: <Waves className="h-4 w-4 text-cyan-600" />,      label: 'Livello laguna',   value: fmt(levels?.laguna?.value, 1),  unit: 'cm' },
  ];

  const lastUpdate = vivaio?.lastUpdate
    ? new Date(vivaio.lastUpdate).toLocaleString('it-IT')
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
            <h2 className="text-xl font-bold">AcquaSCADA — Sonde DFRobot e Livelli</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Dati in tempo reale: sonde ossigeno (vivaio + Flupsy), ammoniaca/pH e livelli idrici. Letture ogni ~30 secondi.
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

      {/* Valori attuali — griglia compatta */}
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
        {liveCards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-3">
              <div className="flex items-center gap-1 text-muted-foreground text-[10px] mb-1">
                {c.icon} <span className="truncate">{c.label}</span>
              </div>
              <div className="flex items-baseline gap-0.5">
                {isLoadingLive ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <span className="text-lg font-bold">{c.value}</span>
                    {c.unit && <span className="text-[10px] text-muted-foreground">{c.unit}</span>}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {lastUpdate && (
        <p className="text-xs text-muted-foreground -mt-1">Ultima misura · {lastUpdate}</p>
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
          {/* Pulsanti raggruppati per sonda */}
          <div className="space-y-2 mb-4">
            {GROUPS.map((group) => {
              const groupParams = SCADA_PARAMS.filter((p) => p.group === group);
              return (
                <div key={group} className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-medium text-muted-foreground w-24 shrink-0">{group}</span>
                  {groupParams.map((p) => {
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
