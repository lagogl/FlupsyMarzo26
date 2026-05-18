import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gauge, Info, Camera, TrendingUp } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import PageHeader from '@/components/PageHeader';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

type IMMComponents = {
  immSize: number; immTime: number; immQuality: number; immReliability: number;
};

type CycleIMM = {
  cycleId: number; basketId: number; physicalNumber: number;
  flupsyId: number; flupsyName: string;
  lotId: number | null; qualityClass: string | null;
  startDate: string;
  semeApk: number | null; currApk: number | null;
  currAnimalCount: number | null; semeAnimalCount: number | null;
  currSizeCode: string | null; currDate: string | null;
  daysElapsed: number; sgrDaily: number; daysRemaining: number | null;
  cumulativeMortalityPct: number;
  imm: number; components: IMMComponents;
};

type IMMAggregate = {
  scope: string; scopeId: number | null; scopeName: string;
  animalCount: number; cycleCount: number;
  imm: number; immSize: number; immTime: number; immQuality: number; immReliability: number;
};

type IMMResponse = {
  success: boolean;
  data: {
    config: {
      targetSizeCode: string; targetMinApk: number; horizonDays: number;
      weightSize: number; weightTime: number; weightQuality: number; weightReliability: number;
      fallbackSgrDaily: number; baselineMortalityPct: number; maxMortalityPct: number;
    };
    totals: {
      totalAnimals: number; totalCycles: number;
      immGlobal: number; immSize: number; immTime: number; immQuality: number; immReliability: number;
    };
    distribution: Array<{
      range: string; minImm: number; maxImm: number;
      animalCount: number; cycleCount: number; pctOfTotal: number;
    }>;
    byFlupsy: IMMAggregate[];
    byLot: IMMAggregate[];
    cycles: CycleIMM[];
  };
};

type HistoryPoint = {
  snapshot_date: string;
  imm: number; imm_size: number; imm_time: number;
  imm_quality: number; imm_reliability: number;
  animal_count: number; cycle_count: number;
};

type HistoryResponse = { success: boolean; data: HistoryPoint[] };

const TARGET_OPTIONS = [
  'TP-2000', 'TP-2500', 'TP-2800', 'TP-3000', 'TP-3500',
  'TP-4000', 'TP-4500', 'TP-5000', 'TP-5500', 'TP-6000',
];

function immColor(imm: number): string {
  if (imm >= 75) return 'text-green-600';
  if (imm >= 50) return 'text-lime-600';
  if (imm >= 25) return 'text-amber-600';
  return 'text-red-600';
}

function immBgRow(imm: number): string {
  if (imm >= 75) return 'bg-green-50';
  if (imm >= 50) return 'bg-lime-50';
  if (imm >= 25) return 'bg-amber-50';
  return 'bg-red-50';
}

function distBarColor(idx: number): string {
  return ['bg-red-400', 'bg-amber-400', 'bg-lime-400', 'bg-green-500'][idx] || 'bg-gray-400';
}

function qualityBadge(q: string | null): string {
  const v = (q ?? '').toLowerCase();
  if (v === 'premium') return 'bg-purple-100 text-purple-700';
  if (v === 'normal') return 'bg-blue-100 text-blue-700';
  if (v === 'sub') return 'bg-amber-100 text-amber-700';
  return 'bg-gray-100 text-gray-600';
}

export default function IMM() {
  const [targetSizeCode, setTargetSizeCode] = useState('TP-3000');
  const [horizonDays, setHorizonDays] = useState(180);
  const { toast } = useToast();

  const queryKey = ['/api/imm/inventory', { targetSizeCode, horizonDays }];
  const { data, isLoading } = useQuery<IMMResponse>({ queryKey });
  const d = data?.data;

  // History
  const fromDate = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  const toDate = new Date().toISOString().slice(0, 10);
  const historyKey = ['/api/imm/history', { scope: 'global', targetSizeCode, fromDate, toDate }];
  const { data: history } = useQuery<HistoryResponse>({ queryKey: historyKey });

  const snapshotMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest({
        url: `/api/imm/snapshot?targetSizeCode=${targetSizeCode}`,
        method: 'POST',
      });
      return res;
    },
    onSuccess: (res: any) => {
      toast({ title: 'Snapshot salvato', description: `${res?.inserted ?? 0} record per ${res?.date ?? 'oggi'}` });
      queryClient.invalidateQueries({ queryKey: ['/api/imm/history'] });
    },
    onError: (e: any) => {
      toast({ title: 'Errore snapshot', description: e?.message ?? 'errore', variant: 'destructive' });
    },
  });

  const imm = d?.totals.immGlobal ?? 0;
  const chartData = (history?.data ?? []).map((p) => ({
    date: p.snapshot_date,
    IMM: p.imm,
    Size: p.imm_size,
    Time: p.imm_time,
    Quality: p.imm_quality,
    Reliability: p.imm_reliability,
  }));

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <PageHeader
        title="IMM — Indice di Maturità del Magazzino"
        description="Punteggio 0–100 che indica quanto il magazzino è vicino alla taglia commerciale obiettivo. Pesa size, tempo, qualità e affidabilità (mortalità)."
      />

      {/* Config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" /> Parametri calcolo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label className="text-xs">Taglia target</Label>
              <Select value={targetSizeCode} onValueChange={setTargetSizeCode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TARGET_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Orizzonte (giorni)</Label>
              <Input
                type="number"
                value={horizonDays}
                onChange={(e) => setHorizonDays(Math.max(30, Number(e.target.value) || 180))}
                min={30} max={730}
              />
            </div>
            <div className="text-xs text-gray-500 col-span-1 md:col-span-1">
              Pesi: Size 40 · Time 35 · Quality 15 · Reliability 10 (normalizzati).
            </div>
            <div>
              <Button
                onClick={() => snapshotMutation.mutate()}
                disabled={snapshotMutation.isPending}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Camera className="h-4 w-4 mr-1" />
                {snapshotMutation.isPending ? 'Salvataggio...' : 'Snapshot ora'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI principale */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Gauge className={`h-10 w-10 ${immColor(imm)}`} />
              <div>
                <p className="text-sm text-gray-500">IMM Magazzino</p>
                <p className={`text-5xl font-bold ${immColor(imm)}`}>
                  {isLoading ? '…' : imm.toFixed(1)}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Media ponderata per animali. Target {d?.config.targetSizeCode}.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Cicli attivi inclusi</p>
            <p className="text-4xl font-bold">{d?.totals.totalCycles ?? 0}</p>
            <p className="text-xs text-gray-500 mt-2">
              Con misura/peso disponibile (cancellate escluse).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Totale animali in magazzino</p>
            <p className="text-4xl font-bold">
              {(d?.totals.totalAnimals ?? 0).toLocaleString('it-IT')}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Ultima `animal_count` per ciclo attivo.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown componenti */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Componenti IMM (media ponderata)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Size (40%)', val: d?.totals.immSize ?? 0, color: 'text-blue-600' },
              { label: 'Time (35%)', val: d?.totals.immTime ?? 0, color: 'text-cyan-600' },
              { label: 'Quality (15%)', val: d?.totals.immQuality ?? 0, color: 'text-purple-600' },
              { label: 'Reliability (10%)', val: d?.totals.immReliability ?? 0, color: 'text-orange-600' },
            ].map((c) => (
              <div key={c.label} className="text-center p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-500 mb-1">{c.label}</p>
                <p className={`text-3xl font-bold ${c.color}`}>{c.val.toFixed(1)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trend storico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Andamento storico (ultimi 90 giorni)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">
              Nessuno snapshot disponibile. Lo snapshot automatico viene salvato ogni notte alle 03:30,
              oppure clicca "Snapshot ora" per generare il primo punto.
            </p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="IMM" stroke="#16a34a" strokeWidth={3} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Size" stroke="#2563eb" strokeWidth={1} dot={false} />
                  <Line type="monotone" dataKey="Time" stroke="#0891b2" strokeWidth={1} dot={false} />
                  <Line type="monotone" dataKey="Quality" stroke="#9333ea" strokeWidth={1} dot={false} />
                  <Line type="monotone" dataKey="Reliability" stroke="#ea580c" strokeWidth={1} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribuzione fasce */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribuzione di maturità</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(d?.distribution ?? []).map((bin, idx) => (
              <div key={bin.range}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{bin.range}</span>
                  <span className="text-gray-600">
                    {bin.animalCount.toLocaleString('it-IT')} animali · {bin.cycleCount} cicli ·{' '}
                    <span className="font-semibold">{bin.pctOfTotal}%</span>
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded overflow-hidden">
                  <div
                    className={`h-full ${distBarColor(idx)} transition-all`}
                    style={{ width: `${Math.min(100, bin.pctOfTotal)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Per FLUPSY */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">IMM per FLUPSY</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>FLUPSY</TableHead>
                <TableHead className="text-right">Cicli</TableHead>
                <TableHead className="text-right">Animali</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="text-right">Time</TableHead>
                <TableHead className="text-right">Quality</TableHead>
                <TableHead className="text-right">Rel.</TableHead>
                <TableHead className="text-right">IMM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(d?.byFlupsy ?? []).map((r) => (
                <TableRow key={r.scopeId ?? r.scopeName}>
                  <TableCell className="font-medium">{r.scopeName}</TableCell>
                  <TableCell className="text-right">{r.cycleCount}</TableCell>
                  <TableCell className="text-right">{r.animalCount.toLocaleString('it-IT')}</TableCell>
                  <TableCell className="text-right text-xs">{r.immSize.toFixed(0)}</TableCell>
                  <TableCell className="text-right text-xs">{r.immTime.toFixed(0)}</TableCell>
                  <TableCell className="text-right text-xs">{r.immQuality.toFixed(0)}</TableCell>
                  <TableCell className="text-right text-xs">{r.immReliability.toFixed(0)}</TableCell>
                  <TableCell className={`text-right font-bold ${immColor(r.imm)}`}>{r.imm.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Per Lotto */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">IMM per Lotto</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lotto</TableHead>
                <TableHead className="text-right">Cicli</TableHead>
                <TableHead className="text-right">Animali</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="text-right">Time</TableHead>
                <TableHead className="text-right">Quality</TableHead>
                <TableHead className="text-right">Rel.</TableHead>
                <TableHead className="text-right">IMM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(d?.byLot ?? []).map((r) => (
                <TableRow key={r.scopeId ?? r.scopeName}>
                  <TableCell className="font-medium">{r.scopeName}</TableCell>
                  <TableCell className="text-right">{r.cycleCount}</TableCell>
                  <TableCell className="text-right">{r.animalCount.toLocaleString('it-IT')}</TableCell>
                  <TableCell className="text-right text-xs">{r.immSize.toFixed(0)}</TableCell>
                  <TableCell className="text-right text-xs">{r.immTime.toFixed(0)}</TableCell>
                  <TableCell className="text-right text-xs">{r.immQuality.toFixed(0)}</TableCell>
                  <TableCell className="text-right text-xs">{r.immReliability.toFixed(0)}</TableCell>
                  <TableCell className={`text-right font-bold ${immColor(r.imm)}`}>{r.imm.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cicli */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cicli attivi ordinati per IMM</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>FLUPSY</TableHead>
                  <TableHead>Cesta</TableHead>
                  <TableHead>Taglia</TableHead>
                  <TableHead className="text-right">An/kg</TableHead>
                  <TableHead className="text-right">Animali</TableHead>
                  <TableHead>Qualità</TableHead>
                  <TableHead className="text-right">Mort.%</TableHead>
                  <TableHead className="text-right">Gg→tgt</TableHead>
                  <TableHead className="text-right">S</TableHead>
                  <TableHead className="text-right">T</TableHead>
                  <TableHead className="text-right">Q</TableHead>
                  <TableHead className="text-right">R</TableHead>
                  <TableHead className="text-right">IMM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(d?.cycles ?? []).map((c) => (
                  <TableRow key={c.cycleId} className={immBgRow(c.imm)}>
                    <TableCell className="font-mono text-xs">#{c.cycleId}</TableCell>
                    <TableCell className="text-xs">{c.flupsyName}</TableCell>
                    <TableCell className="text-xs">#{c.physicalNumber}</TableCell>
                    <TableCell className="text-xs">{c.currSizeCode ?? '-'}</TableCell>
                    <TableCell className="text-right text-xs">{c.currApk?.toLocaleString('it-IT') ?? '-'}</TableCell>
                    <TableCell className="text-right text-xs">{c.currAnimalCount?.toLocaleString('it-IT') ?? '-'}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded ${qualityBadge(c.qualityClass)}`}>
                        {c.qualityClass ?? 'n/d'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-xs">{c.cumulativeMortalityPct.toFixed(1)}</TableCell>
                    <TableCell className="text-right text-xs">
                      {c.daysRemaining == null
                        ? '∞'
                        : c.daysRemaining <= 0
                        ? <span className="text-green-700 font-semibold">pronto</span>
                        : c.daysRemaining}
                    </TableCell>
                    <TableCell className="text-right text-xs">{c.components.immSize.toFixed(0)}</TableCell>
                    <TableCell className="text-right text-xs">{c.components.immTime.toFixed(0)}</TableCell>
                    <TableCell className="text-right text-xs">{c.components.immQuality.toFixed(0)}</TableCell>
                    <TableCell className="text-right text-xs">{c.components.immReliability.toFixed(0)}</TableCell>
                    <TableCell className={`text-right font-bold ${immColor(c.imm)}`}>{c.imm.toFixed(1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
