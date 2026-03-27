import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { RefreshCw, Download, Thermometer, Waves, Droplets, Wind, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { EnvironmentalLog } from '@shared/schema';

type Periodo = '30' | '60' | '90' | '180' | 'all';

const PERIODI: { value: Periodo; label: string }[] = [
  { value: '30', label: 'Ultimi 30 giorni' },
  { value: '60', label: 'Ultimi 60 giorni' },
  { value: '90', label: 'Ultimi 90 giorni' },
  { value: '180', label: 'Ultimi 180 giorni' },
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

// Colori coerenti per le linee del grafico
const COLORS = {
  sst: '#2563eb',
  waveHeight: '#0891b2',
  vallonaTempAcqua: '#059669',
  vallonaPh: '#7c3aed',
  vallonaSalinita: '#b45309',
  vallonaOssigenoSat: '#dc2626',
  vallonaClorofilla: '#16a34a',
  gorino2TempAcqua: '#0d9488',
  gorino2Ph: '#9333ea',
  gorino2Salinita: '#d97706',
  gorino2OssigenoSat: '#ef4444',
  gorino2Clorofilla: '#22c55e',
};

type ChartParam = keyof typeof COLORS;

interface ChartGroup {
  title: string;
  icon: React.ReactNode;
  params: { key: ChartParam; label: string; unit: string; color: string }[];
}

const CHART_GROUPS: ChartGroup[] = [
  {
    title: 'Temperatura Acqua (°C)',
    icon: <Thermometer className="h-4 w-4 text-blue-600" />,
    params: [
      { key: 'sst', label: 'SST Copernicus', unit: '°C', color: COLORS.sst },
      { key: 'vallonaTempAcqua', label: 'Boa Vallona', unit: '°C', color: COLORS.vallonaTempAcqua },
      { key: 'gorino2TempAcqua', label: 'Boa Gorino 2', unit: '°C', color: COLORS.gorino2TempAcqua },
    ],
  },
  {
    title: 'pH',
    icon: <Activity className="h-4 w-4 text-purple-600" />,
    params: [
      { key: 'vallonaPh', label: 'Vallona pH', unit: '', color: COLORS.vallonaPh },
      { key: 'gorino2Ph', label: 'Gorino 2 pH', unit: '', color: COLORS.gorino2Ph },
    ],
  },
  {
    title: 'Salinità (‰)',
    icon: <Droplets className="h-4 w-4 text-amber-600" />,
    params: [
      { key: 'vallonaSalinita', label: 'Vallona salinità', unit: '‰', color: COLORS.vallonaSalinita },
      { key: 'gorino2Salinita', label: 'Gorino 2 salinità', unit: '‰', color: COLORS.gorino2Salinita },
    ],
  },
  {
    title: 'Ossigeno Saturazione (%)',
    icon: <Wind className="h-4 w-4 text-red-500" />,
    params: [
      { key: 'vallonaOssigenoSat', label: 'Vallona O₂ sat.', unit: '%', color: COLORS.vallonaOssigenoSat },
      { key: 'gorino2OssigenoSat', label: 'Gorino 2 O₂ sat.', unit: '%', color: COLORS.gorino2OssigenoSat },
    ],
  },
  {
    title: 'Altezza Onde (m)',
    icon: <Waves className="h-4 w-4 text-cyan-600" />,
    params: [
      { key: 'waveHeight', label: 'Onde (Open-Meteo)', unit: 'm', color: COLORS.waveHeight },
    ],
  },
  {
    title: 'Clorofilla (µg/L)',
    icon: <Activity className="h-4 w-4 text-green-600" />,
    params: [
      { key: 'vallonaClorofilla', label: 'Vallona Chl', unit: 'µg/L', color: COLORS.vallonaClorofilla },
      { key: 'gorino2Clorofilla', label: 'Gorino 2 Chl', unit: 'µg/L', color: COLORS.gorino2Clorofilla },
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
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {group.icon}
          {group.title}
        </CardTitle>
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
            <YAxis tick={{ fontSize: 10 }} width={40} />
            <Tooltip
              formatter={(value: any, name: string) => {
                const p = group.params.find(pp => pp.key === name);
                return [`${value != null ? Number(value).toFixed(2) : '—'} ${p?.unit ?? ''}`, p?.label ?? name];
              }}
            />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
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

export default function DiarioAmbientale() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [periodo, setPeriodo] = useState<Periodo>('90');
  const [tab, setTab] = useState<'grafici' | 'tabella'>('grafici');

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

  const totalRecords = logs?.length ?? 0;
  const latest = logs?.[0];

  // Esporta CSV
  function handleExportCSV() {
    if (!logs || logs.length === 0) return;
    const headers = [
      'Data', 'Utente',
      'SST (°C)', 'Onde (m)', 'Periodo Onde (s)', 'Clorofilla Mar (µg/L)', 'Salinità Mar (‰)',
      'Vallona Temp (°C)', 'Vallona pH', 'Vallona Salinità (‰)', 'Vallona O₂ (%)', 'Vallona Torbidità', 'Vallona Clorofilla (µg/L)',
      'Gorino2 Temp (°C)', 'Gorino2 pH', 'Gorino2 Salinità (‰)', 'Gorino2 O₂ (%)', 'Gorino2 Torbidità', 'Gorino2 Clorofilla (µg/L)',
    ];
    const rows = logs.map(r => [
      fmtDate(r.date), r.username ?? '',
      r.sst ?? '', r.waveHeight ?? '', r.wavePeriod ?? '', r.chlorophyll ?? '', r.salinity ?? '',
      r.vallonaTempAcqua ?? '', r.vallonaPh ?? '', r.vallonaSalinita ?? '', r.vallonaOssigenoSat ?? '', r.vallonaTorbidita ?? '', r.vallonaClorofilla ?? '',
      r.gorino2TempAcqua ?? '', r.gorino2Ph ?? '', r.gorino2Salinita ?? '', r.gorino2OssigenoSat ?? '', r.gorino2Torbidita ?? '', r.gorino2Clorofilla ?? '',
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
            Monitoraggio quotidiano: boe Vallona (ARPAV) e Gorino 2 (ARPAE), dati marini
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={periodo} onValueChange={v => setPeriodo(v as Periodo)}>
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
        </div>
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
            <div className="text-xs text-gray-500">SST (ultimo)</div>
            <div className="text-base font-semibold text-blue-700">{fmt(latest?.sst)}°C</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-gray-500">Temp. Vallona (ultimo)</div>
            <div className="text-base font-semibold text-green-700">{fmt(latest?.vallonaTempAcqua)}°C</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab('grafici')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'grafici'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Grafici
        </button>
        <button
          onClick={() => setTab('tabella')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'tabella'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Tabella dati
        </button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
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

          {tab === 'tabella' && (
            <div className="overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-teal-700">
                    <TableHead className="text-white font-bold text-xs">Data</TableHead>
                    <TableHead className="text-white font-bold text-xs">Utente</TableHead>
                    <TableHead className="text-white font-bold text-xs">SST °C</TableHead>
                    <TableHead className="text-white font-bold text-xs">Onde m</TableHead>
                    <TableHead className="text-white font-bold text-xs">Chl Mar</TableHead>
                    <TableHead className="text-white font-bold text-xs">Sal Mar</TableHead>
                    <TableHead className="text-white font-bold text-xs bg-green-800">V Temp</TableHead>
                    <TableHead className="text-white font-bold text-xs bg-green-800">V pH</TableHead>
                    <TableHead className="text-white font-bold text-xs bg-green-800">V Sal</TableHead>
                    <TableHead className="text-white font-bold text-xs bg-green-800">V O₂%</TableHead>
                    <TableHead className="text-white font-bold text-xs bg-green-800">V Torb</TableHead>
                    <TableHead className="text-white font-bold text-xs bg-green-800">V Chl</TableHead>
                    <TableHead className="text-white font-bold text-xs bg-teal-900">G Temp</TableHead>
                    <TableHead className="text-white font-bold text-xs bg-teal-900">G pH</TableHead>
                    <TableHead className="text-white font-bold text-xs bg-teal-900">G Sal</TableHead>
                    <TableHead className="text-white font-bold text-xs bg-teal-900">G O₂%</TableHead>
                    <TableHead className="text-white font-bold text-xs bg-teal-900">G Torb</TableHead>
                    <TableHead className="text-white font-bold text-xs bg-teal-900">G Chl</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((row, idx) => (
                    <TableRow
                      key={row.id}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-teal-50/40'}
                    >
                      <TableCell className="text-xs font-mono">{fmtDate(row.date)}</TableCell>
                      <TableCell className="text-xs">{row.username ?? '—'}</TableCell>
                      <TableCell className="text-xs">{fmt(row.sst)}</TableCell>
                      <TableCell className="text-xs">{fmt(row.waveHeight)}</TableCell>
                      <TableCell className="text-xs">{fmt(row.chlorophyll)}</TableCell>
                      <TableCell className="text-xs">{fmt(row.salinity)}</TableCell>
                      <TableCell className="text-xs bg-green-50">{fmt(row.vallonaTempAcqua)}</TableCell>
                      <TableCell className="text-xs bg-green-50">{fmt(row.vallonaPh)}</TableCell>
                      <TableCell className="text-xs bg-green-50">{fmt(row.vallonaSalinita)}</TableCell>
                      <TableCell className="text-xs bg-green-50">{fmt(row.vallonaOssigenoSat)}</TableCell>
                      <TableCell className="text-xs bg-green-50">{fmt(row.vallonaTorbidita)}</TableCell>
                      <TableCell className="text-xs bg-green-50">{fmt(row.vallonaClorofilla)}</TableCell>
                      <TableCell className="text-xs bg-teal-50">{fmt(row.gorino2TempAcqua)}</TableCell>
                      <TableCell className="text-xs bg-teal-50">{fmt(row.gorino2Ph)}</TableCell>
                      <TableCell className="text-xs bg-teal-50">{fmt(row.gorino2Salinita)}</TableCell>
                      <TableCell className="text-xs bg-teal-50">{fmt(row.gorino2OssigenoSat)}</TableCell>
                      <TableCell className="text-xs bg-teal-50">{fmt(row.gorino2Torbidita)}</TableCell>
                      <TableCell className="text-xs bg-teal-50">{fmt(row.gorino2Clorofilla)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-2 text-xs text-gray-400 border-t flex gap-4">
                <span><span className="inline-block w-3 h-3 bg-green-100 border border-green-300 rounded-sm mr-1" />V = Boa Vallona (ARPAV)</span>
                <span><span className="inline-block w-3 h-3 bg-teal-100 border border-teal-300 rounded-sm mr-1" />G = Boa Gorino 2 (ARPAE)</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
