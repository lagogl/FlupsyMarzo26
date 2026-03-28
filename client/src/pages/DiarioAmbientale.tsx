import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { RefreshCw, Download, Thermometer, Waves, Droplets, Wind, Activity, CloudSun, Database } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import type { EnvironmentalLog } from '@shared/schema';

type Periodo = '30' | '60' | '90' | '180' | '365' | '730' | 'all';

const PERIODI: { value: Periodo; label: string }[] = [
  { value: '30', label: 'Ultimi 30 giorni' },
  { value: '60', label: 'Ultimi 60 giorni' },
  { value: '90', label: 'Ultimi 90 giorni' },
  { value: '180', label: 'Ultimi 6 mesi' },
  { value: '365', label: 'Ultimo anno' },
  { value: '730', label: 'Ultimi 2 anni' },
  { value: 'all', label: 'Tutto' },
];

function fmt(v?: number | null, dec = 2): string {
  if (v == null) return '—';
  return v.toFixed(dec);
}

function fmtDate(d: string): string {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function wmoLabel(code?: number | null): string {
  if (code == null) return '—';
  if (code === 0) return '☀️ Sereno';
  if (code <= 2) return '🌤 Poco nuvoloso';
  if (code === 3) return '☁️ Coperto';
  if (code <= 49) return '🌫 Nebbia';
  if (code <= 59) return '🌧 Pioggerellina';
  if (code <= 69) return '🌧 Pioggia';
  if (code <= 79) return '🌨 Neve';
  if (code <= 84) return '🌦 Rovesci';
  if (code <= 99) return '⛈ Temporale';
  return `Cod.${code}`;
}

// Palette colori per fonte/parametro
const COLORS = {
  // Copernicus (dati marini satellitari) — blu
  sst: '#1d4ed8',
  chlorophyll: '#15803d',
  salinity: '#1e40af',
  waveHeight: '#0284c7',
  wavePeriod: '#0369a1',
  // Boa Vallona ARPAV — verde
  vallonaTempAcqua: '#16a34a',
  vallonaPh: '#7c3aed',
  vallonaSalinita: '#92400e',
  vallonaOssigenoSat: '#dc2626',
  vallonaClorofilla: '#4d7c0f',
  // Boa Gorino 2 ARPAE — teal
  gorino2TempAcqua: '#0d9488',
  gorino2Ph: '#9333ea',
  gorino2Salinita: '#d97706',
  gorino2OssigenoSat: '#ef4444',
  gorino2Clorofilla: '#22c55e',
  // Meteo aria Open-Meteo — arancio/giallo
  tempAria: '#ea580c',
  precipitazione: '#0ea5e9',
  ventoVelocita: '#f59e0b',
  ventoRaffica: '#b45309',
};

type ChartKey = keyof typeof COLORS;

interface ChartParam { key: ChartKey; label: string; unit: string; color: string; source?: string }
interface ChartGroup { title: string; icon: React.ReactNode; params: ChartParam[] }

// Badge sorgente — usato sia nei grafici che in tabella
const SOURCE_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  copernicus: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Copernicus' },
  openmeteo:  { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Open-Meteo' },
  arpav:      { bg: 'bg-green-100', text: 'text-green-800', label: 'ARPAV Vallona' },
  arpae:      { bg: 'bg-teal-100', text: 'text-teal-800', label: 'ARPAE Gorino 2' },
};

function SourceBadge({ src }: { src: keyof typeof SOURCE_BADGE }) {
  const s = SOURCE_BADGE[src];
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

const CHART_GROUPS: ChartGroup[] = [
  {
    title: 'Temperatura Acqua (°C)',
    icon: <Thermometer className="h-4 w-4 text-blue-600" />,
    params: [
      { key: 'sst',             label: 'SST — Copernicus',   unit: '°C', color: COLORS.sst,             source: 'copernicus' },
      { key: 'vallonaTempAcqua', label: 'Temp — Boa Vallona', unit: '°C', color: COLORS.vallonaTempAcqua, source: 'arpav' },
      { key: 'gorino2TempAcqua', label: 'Temp — Boa Gorino 2',unit: '°C', color: COLORS.gorino2TempAcqua, source: 'arpae' },
    ],
  },
  {
    title: 'Temperatura Aria (°C)',
    icon: <CloudSun className="h-4 w-4 text-orange-500" />,
    params: [
      { key: 'tempAria', label: 'Temp aria — Open-Meteo', unit: '°C', color: COLORS.tempAria, source: 'openmeteo' },
    ],
  },
  {
    title: 'pH',
    icon: <Activity className="h-4 w-4 text-purple-600" />,
    params: [
      { key: 'vallonaPh',  label: 'pH — Boa Vallona',  unit: '', color: COLORS.vallonaPh,  source: 'arpav' },
      { key: 'gorino2Ph',  label: 'pH — Boa Gorino 2', unit: '', color: COLORS.gorino2Ph,  source: 'arpae' },
    ],
  },
  {
    title: 'Salinità (‰)',
    icon: <Droplets className="h-4 w-4 text-amber-600" />,
    params: [
      { key: 'salinity',       label: 'Salinità — Copernicus',  unit: '‰', color: COLORS.salinity,       source: 'copernicus' },
      { key: 'vallonaSalinita', label: 'Salinità — Boa Vallona', unit: '‰', color: COLORS.vallonaSalinita, source: 'arpav' },
      { key: 'gorino2Salinita', label: 'Salinità — Boa Gorino 2',unit: '‰', color: COLORS.gorino2Salinita, source: 'arpae' },
    ],
  },
  {
    title: 'Ossigeno Saturazione (%)',
    icon: <Wind className="h-4 w-4 text-red-500" />,
    params: [
      { key: 'vallonaOssigenoSat',  label: 'O₂ sat. — Boa Vallona',  unit: '%', color: COLORS.vallonaOssigenoSat,  source: 'arpav' },
      { key: 'gorino2OssigenoSat',  label: 'O₂ sat. — Boa Gorino 2', unit: '%', color: COLORS.gorino2OssigenoSat,  source: 'arpae' },
    ],
  },
  {
    title: 'Altezza Onde (m)',
    icon: <Waves className="h-4 w-4 text-cyan-600" />,
    params: [
      { key: 'waveHeight', label: 'Onde — Open-Meteo Marine', unit: 'm', color: COLORS.waveHeight, source: 'openmeteo' },
    ],
  },
  {
    title: 'Clorofilla (µg/L)',
    icon: <Activity className="h-4 w-4 text-green-600" />,
    params: [
      { key: 'chlorophyll',     label: 'Chl-a — Copernicus',   unit: 'µg/L', color: COLORS.chlorophyll,     source: 'copernicus' },
      { key: 'vallonaClorofilla', label: 'Chl — Boa Vallona',  unit: 'µg/L', color: COLORS.vallonaClorofilla, source: 'arpav' },
      { key: 'gorino2Clorofilla', label: 'Chl — Boa Gorino 2', unit: 'µg/L', color: COLORS.gorino2Clorofilla, source: 'arpae' },
    ],
  },
  {
    title: 'Vento & Precipitazioni',
    icon: <Wind className="h-4 w-4 text-amber-500" />,
    params: [
      { key: 'ventoVelocita',  label: 'Vento km/h — Open-Meteo',   unit: 'km/h', color: COLORS.ventoVelocita,  source: 'openmeteo' },
      { key: 'ventoRaffica',   label: 'Raffica km/h — Open-Meteo', unit: 'km/h', color: COLORS.ventoRaffica,   source: 'openmeteo' },
      { key: 'precipitazione', label: 'Pioggia mm — Open-Meteo',   unit: 'mm',   color: COLORS.precipitazione, source: 'openmeteo' },
    ],
  },
];

function MiniChart({ data, group }: { data: EnvironmentalLog[]; group: ChartGroup }) {
  const chartData = data.slice().reverse().map(row => {
    const point: Record<string, any> = { date: fmtDate(row.date) };
    for (const p of group.params) {
      point[p.key] = (row as any)[p.key] ?? null;
    }
    return point;
  });

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {group.icon}
          {group.title}
        </CardTitle>
        <div className="flex flex-wrap gap-1 mt-0.5">
          {[...new Set(group.params.map(p => p.source).filter(Boolean))].map(src => (
            <SourceBadge key={src} src={src as keyof typeof SOURCE_BADGE} />
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 10 }} width={42} />
            <Tooltip
              formatter={(value: any, name: string) => {
                const p = group.params.find(pp => pp.key === name);
                return [`${value != null ? Number(value).toFixed(2) : '—'} ${p?.unit ?? ''}`, p?.label ?? name];
              }}
            />
            <Legend
              iconSize={10}
              wrapperStyle={{ fontSize: 10 }}
              formatter={(name: string) => {
                const p = group.params.find(pp => pp.key === name);
                return p?.label ?? name;
              }}
            />
            {group.params.map(p => (
              <Line
                key={p.key}
                type="monotone"
                dataKey={p.key}
                name={p.key}
                stroke={p.color}
                dot={false}
                strokeWidth={1.5}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Struttura colonne tabella con raggruppamento per fonte
const TABLE_GROUPS = [
  {
    label: 'Copernicus / Open-Meteo Marine',
    src: 'copernicus' as const,
    bg: 'bg-blue-700',
    cellBg: 'bg-blue-50',
    cols: [
      { key: 'sst',        head: 'SST °C' },
      { key: 'waveHeight', head: 'Onde m' },
      { key: 'wavePeriod', head: 'Periodo s' },
      { key: 'chlorophyll',head: 'Chl-a µg/L' },
      { key: 'salinity',   head: 'Salinità ‰' },
    ],
  },
  {
    label: 'Boa Vallona (ARPAV)',
    src: 'arpav' as const,
    bg: 'bg-green-700',
    cellBg: 'bg-green-50',
    cols: [
      { key: 'vallonaTempAcqua',  head: 'Temp °C' },
      { key: 'vallonaPh',         head: 'pH' },
      { key: 'vallonaSalinita',   head: 'Sal ‰' },
      { key: 'vallonaOssigenoSat',head: 'O₂ %' },
      { key: 'vallonaTorbidita',  head: 'Torb' },
      { key: 'vallonaClorofilla', head: 'Chl µg/L' },
    ],
  },
  {
    label: 'Boa Gorino 2 (ARPAE)',
    src: 'arpae' as const,
    bg: 'bg-teal-700',
    cellBg: 'bg-teal-50',
    cols: [
      { key: 'gorino2TempAcqua',  head: 'Temp °C' },
      { key: 'gorino2Ph',         head: 'pH' },
      { key: 'gorino2Salinita',   head: 'Sal ‰' },
      { key: 'gorino2OssigenoSat',head: 'O₂ %' },
      { key: 'gorino2Torbidita',  head: 'Torb' },
      { key: 'gorino2Clorofilla', head: 'Chl µg/L' },
    ],
  },
  {
    label: 'Meteo Aria (Open-Meteo)',
    src: 'openmeteo' as const,
    bg: 'bg-orange-600',
    cellBg: 'bg-orange-50',
    cols: [
      { key: 'tempAria',       head: 'T.aria °C' },
      { key: 'precipitazione', head: 'Pioggia mm' },
      { key: 'ventoVelocita',  head: 'Vento km/h' },
      { key: 'ventoRaffica',   head: 'Raffica km/h' },
      { key: 'condizioneMeteo',head: 'Condizione', fmt: (v: any) => wmoLabel(v) },
    ],
  },
];

export default function DiarioAmbientale() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [periodo, setPeriodo] = useState<Periodo>('90');
  const [tab, setTab] = useState<'grafici' | 'tabella'>('grafici');
  const [tablePage, setTablePage] = useState(1);
  const TABLE_PAGE_SIZE = 50;

  const days = periodo === 'all' ? 9999 : parseInt(periodo);

  const { data: logs, isLoading } = useQuery<EnvironmentalLog[]>({
    queryKey: ['/api/environmental-log', days],
    queryFn: async () => {
      const url = periodo === 'all'
        ? '/api/environmental-log?days=9999'
        : `/api/environmental-log?days=${days}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Errore caricamento diario ambientale');
      return res.json();
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/environmental-log/refresh', { method: 'POST' });
      if (!res.ok) throw new Error('Errore refresh');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/environmental-log'] });
      toast({ title: 'Dati aggiornati', description: 'Snapshot ambientale acquisito.' });
    },
    onError: (e: any) => {
      toast({ title: 'Errore', description: e.message, variant: 'destructive' });
    },
  });

  const [backfillRunning, setBackfillRunning] = useState(false);
  const [backfillProgress, setBackfillProgress] = useState<any>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const startBackfill = async () => {
    const startDate = '2020-01-01';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const endDate = yesterday.toISOString().split('T')[0];

    setBackfillRunning(true);
    setBackfillProgress({ status: 'running', message: 'Avvio recupero dati storici...' });

    try {
      await fetch('/api/environmental-log/backfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
      });

      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch('/api/environmental-log/backfill/progress');
          const prog = await res.json();
          setBackfillProgress(prog);
          if (prog.status === 'completed' || prog.status === 'error') {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            setBackfillRunning(false);
            queryClient.invalidateQueries({ queryKey: ['/api/environmental-log'] });
            toast({
              title: prog.status === 'completed' ? 'Backfill completato' : 'Errore backfill',
              description: prog.message,
              variant: prog.status === 'completed' ? 'default' : 'destructive',
            });
          }
        } catch (e) { /* ignore poll errors */ }
      }, 2000);
    } catch (e: any) {
      setBackfillRunning(false);
      toast({ title: 'Errore', description: e.message, variant: 'destructive' });
    }
  };

  const totalRecords = logs?.length ?? 0;
  const latest = logs?.[0];

  function handleExportCSV() {
    if (!logs || logs.length === 0) return;
    const headers = [
      'Data', 'Utente',
      // Copernicus
      '[Copernicus] SST (°C)', '[Open-Meteo] Onde (m)', '[Open-Meteo] Periodo onde (s)',
      '[Copernicus] Chl-a (µg/L)', '[Copernicus] Salinità (‰)',
      // Vallona
      '[ARPAV Vallona] Temp (°C)', '[ARPAV Vallona] pH', '[ARPAV Vallona] Salinità (‰)',
      '[ARPAV Vallona] O₂ (%)', '[ARPAV Vallona] Torbidità', '[ARPAV Vallona] Chl (µg/L)',
      // Gorino 2
      '[ARPAE Gorino2] Temp (°C)', '[ARPAE Gorino2] pH', '[ARPAE Gorino2] Salinità (‰)',
      '[ARPAE Gorino2] O₂ (%)', '[ARPAE Gorino2] Torbidità', '[ARPAE Gorino2] Chl (µg/L)',
      // Meteo aria
      '[Open-Meteo] Temp aria (°C)', '[Open-Meteo] Pioggia (mm)',
      '[Open-Meteo] Vento (km/h)', '[Open-Meteo] Raffica (km/h)', '[Open-Meteo] Condizione meteo',
    ];
    const rows = logs.map(r => [
      fmtDate(r.date), r.username ?? '',
      r.sst ?? '', r.waveHeight ?? '', r.wavePeriod ?? '', r.chlorophyll ?? '', r.salinity ?? '',
      r.vallonaTempAcqua ?? '', r.vallonaPh ?? '', r.vallonaSalinita ?? '', r.vallonaOssigenoSat ?? '', r.vallonaTorbidita ?? '', r.vallonaClorofilla ?? '',
      r.gorino2TempAcqua ?? '', r.gorino2Ph ?? '', r.gorino2Salinita ?? '', r.gorino2OssigenoSat ?? '', r.gorino2Torbidita ?? '', r.gorino2Clorofilla ?? '',
      r.tempAria ?? '', r.precipitazione ?? '', r.ventoVelocita ?? '', r.ventoRaffica ?? '',
      r.condizioneMeteo != null ? wmoLabel(r.condizioneMeteo) : '',
    ]);
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diario_ambientale_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-teal-700">Diario Ambientale</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Monitoraggio quotidiano: Copernicus, Open-Meteo, Boa Vallona (ARPAV), Boa Gorino 2 (ARPAE)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={periodo} onValueChange={v => { setPeriodo(v as Periodo); setTablePage(1); }}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODI.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
            Acquisisci
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={!logs || logs.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={startBackfill}
            disabled={backfillRunning}
            className="text-teal-700 border-teal-300 hover:bg-teal-50"
          >
            <Database className={`h-4 w-4 mr-1 ${backfillRunning ? 'animate-pulse' : ''}`} />
            Dati Storici
          </Button>
        </div>
      </div>

      {backfillProgress && backfillProgress.status === 'running' && (
        <Card className="border-teal-200 bg-teal-50/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-teal-600 animate-pulse" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-teal-700">{backfillProgress.message}</span>
                  <span className="text-teal-600">
                    {backfillProgress.inserted + backfillProgress.skipped}/{backfillProgress.total}
                  </span>
                </div>
                <Progress
                  value={backfillProgress.total > 0 ? ((backfillProgress.inserted + backfillProgress.skipped) / backfillProgress.total) * 100 : 0}
                  className="h-2"
                />
                <p className="text-xs text-teal-600 mt-1">
                  Inseriti: {backfillProgress.inserted} | Saltati: {backfillProgress.skipped} | Errori: {backfillProgress.errors}
                  {backfillProgress.currentDate && ` | Data: ${fmtDate(backfillProgress.currentDate)}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legenda fonti */}
      <div className="flex flex-wrap gap-2 text-xs">
        {Object.entries(SOURCE_BADGE).map(([k, v]) => (
          <span key={k} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${v.bg} ${v.text} font-medium`}>
            {v.label}
          </span>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-teal-200">
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-gray-500">Record totali</div>
            <div className="text-2xl font-bold text-teal-700">{isLoading ? '…' : totalRecords}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-gray-500">Ultimo aggiornamento</div>
            <div className="text-base font-semibold">{latest ? fmtDate(latest.date) : '—'}</div>
            <div className="text-xs text-gray-400">{latest?.username ?? ''}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-gray-500 flex items-center gap-1">
              SST <SourceBadge src="copernicus" />
            </div>
            <div className="text-base font-semibold text-blue-700">{fmt(latest?.sst)}°C</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-gray-500 flex items-center gap-1">
              Temp aria <SourceBadge src="openmeteo" />
            </div>
            <div className="text-base font-semibold text-orange-600">{fmt(latest?.tempAria)}°C</div>
            {latest?.condizioneMeteo != null && (
              <div className="text-xs text-gray-500">{wmoLabel(latest.condizioneMeteo)}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(['grafici', 'tabella'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'grafici' ? 'Grafici' : 'Tabella dati'}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && (!logs || logs.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nessun dato disponibile per il periodo selezionato.</p>
            <p className="text-xs mt-1">Clicca "Acquisisci" per registrare il primo snapshot.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && logs && logs.length > 0 && (
        <>
          {tab === 'grafici' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CHART_GROUPS.map(group => (
                <MiniChart key={group.title} data={logs} group={group} />
              ))}
            </div>
          )}

          {tab === 'tabella' && (() => {
            const totalPages = Math.ceil(logs.length / TABLE_PAGE_SIZE);
            const pageStart = (tablePage - 1) * TABLE_PAGE_SIZE;
            const pageEnd = pageStart + TABLE_PAGE_SIZE;
            const pageRows = logs.slice(pageStart, pageEnd);
            return (
              <>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>{logs.length} record totali</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={tablePage <= 1}
                      onClick={() => setTablePage(p => Math.max(1, p - 1))}
                    >
                      ← Prec
                    </Button>
                    <span className="text-xs font-medium">
                      Pagina {tablePage} di {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={tablePage >= totalPages}
                      onClick={() => setTablePage(p => Math.min(totalPages, p + 1))}
                    >
                      Succ →
                    </Button>
                  </div>
                </div>
                <div className="overflow-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead rowSpan={2} className="bg-gray-800 text-white text-xs font-bold border-r align-middle">Data</TableHead>
                        <TableHead rowSpan={2} className="bg-gray-800 text-white text-xs font-bold border-r align-middle">Utente</TableHead>
                        {TABLE_GROUPS.map(g => (
                          <TableHead
                            key={g.label}
                            colSpan={g.cols.length}
                            className={`${g.bg} text-white text-xs font-bold text-center border-x`}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <SourceBadge src={g.src} />
                              <span className="hidden sm:inline">{g.label}</span>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                      <TableRow>
                        {TABLE_GROUPS.map(g =>
                          g.cols.map(col => (
                            <TableHead key={col.key} className={`${g.bg} text-white/90 text-[10px] font-medium border-x whitespace-nowrap`}>
                              {col.head}
                            </TableHead>
                          ))
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pageRows.map((row, idx) => (
                        <TableRow key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                          <TableCell className="text-xs font-mono border-r">{fmtDate(row.date)}</TableCell>
                          <TableCell className="text-xs border-r">{row.username ?? '—'}</TableCell>
                          {TABLE_GROUPS.map(g =>
                            g.cols.map(col => (
                              <TableCell key={col.key} className={`text-xs ${g.cellBg}`}>
                                {col.fmt
                                  ? col.fmt((row as any)[col.key])
                                  : fmt((row as any)[col.key])}
                              </TableCell>
                            ))
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={tablePage <= 1}
                      onClick={() => setTablePage(1)}
                    >
                      Prima
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={tablePage <= 1}
                      onClick={() => setTablePage(p => Math.max(1, p - 1))}
                    >
                      ← Prec
                    </Button>
                    <Select value={String(tablePage)} onValueChange={v => setTablePage(Number(v))}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: totalPages }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>
                            Pag. {i + 1} di {totalPages}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={tablePage >= totalPages}
                      onClick={() => setTablePage(p => Math.min(totalPages, p + 1))}
                    >
                      Succ →
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={tablePage >= totalPages}
                      onClick={() => setTablePage(totalPages)}
                    >
                      Ultima
                    </Button>
                  </div>
                )}
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}
