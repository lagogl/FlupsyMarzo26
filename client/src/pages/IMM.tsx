import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gauge, Info } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

type CycleIMM = {
  cycleId: number;
  basketId: number;
  physicalNumber: number;
  flupsyId: number;
  flupsyName: string;
  lotId: number | null;
  qualityClass: string | null;
  startDate: string;
  semeApk: number | null;
  currApk: number | null;
  currAnimalCount: number | null;
  currSizeCode: string | null;
  currDate: string | null;
  daysElapsed: number;
  sgrDaily: number;
  daysRemaining: number | null;
  imm: number;
  components: { immSize: number; immTime: number };
};

type IMMAggregate = {
  scope: string;
  scopeId: number | null;
  scopeName: string;
  animalCount: number;
  cycleCount: number;
  imm: number;
};

type IMMResponse = {
  success: boolean;
  data: {
    config: {
      targetSizeCode: string;
      targetMinApk: number;
      horizonDays: number;
      weightSize: number;
      weightTime: number;
      fallbackSgrDaily: number;
    };
    totals: { totalAnimals: number; totalCycles: number; immGlobal: number };
    distribution: Array<{
      range: string;
      minImm: number;
      maxImm: number;
      animalCount: number;
      cycleCount: number;
      pctOfTotal: number;
    }>;
    byFlupsy: IMMAggregate[];
    byLot: IMMAggregate[];
    cycles: CycleIMM[];
  };
};

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

export default function IMM() {
  const [targetSizeCode, setTargetSizeCode] = useState('TP-3000');
  const [horizonDays, setHorizonDays] = useState(180);

  const queryKey = ['/api/imm/inventory', { targetSizeCode, horizonDays }];
  const { data, isLoading } = useQuery<IMMResponse>({ queryKey });

  const d = data?.data;
  const imm = d?.totals.immGlobal ?? 0;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <PageHeader
        title="IMM — Indice di Maturità del Magazzino"
        description="Punteggio 0–100 che indica quanto il magazzino è vicino alla taglia commerciale obiettivo."
      />

      {/* Config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" /> Parametri calcolo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Taglia target</Label>
              <Select value={targetSizeCode} onValueChange={setTargetSizeCode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Orizzonte (giorni)</Label>
              <Input
                type="number"
                value={horizonDays}
                onChange={(e) => setHorizonDays(Math.max(30, Number(e.target.value) || 180))}
                min={30}
                max={730}
              />
            </div>
            <div className="text-xs text-gray-500 self-end pb-2">
              Pesi correnti (Fase 1): Size 40% · Time 35% (normalizzati).
              Quality e Reliability verranno aggiunti nella Fase 2.
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
              Media ponderata per numero animali. Target {d?.config.targetSizeCode}.
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
                <TableHead className="text-right">IMM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(d?.byFlupsy ?? []).map((r) => (
                <TableRow key={r.scopeId ?? r.scopeName}>
                  <TableCell className="font-medium">{r.scopeName}</TableCell>
                  <TableCell className="text-right">{r.cycleCount}</TableCell>
                  <TableCell className="text-right">{r.animalCount.toLocaleString('it-IT')}</TableCell>
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
                <TableHead className="text-right">IMM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(d?.byLot ?? []).map((r) => (
                <TableRow key={r.scopeId ?? r.scopeName}>
                  <TableCell className="font-medium">{r.scopeName}</TableCell>
                  <TableCell className="text-right">{r.cycleCount}</TableCell>
                  <TableCell className="text-right">{r.animalCount.toLocaleString('it-IT')}</TableCell>
                  <TableCell className={`text-right font-bold ${immColor(r.imm)}`}>{r.imm.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top cicli */}
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
                  <TableHead className="text-right">Giorni → target</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead className="text-right">Time</TableHead>
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
                    <TableCell className="text-right text-xs">
                      {c.daysRemaining == null
                        ? '∞'
                        : c.daysRemaining <= 0
                        ? <span className="text-green-700 font-semibold">pronto</span>
                        : c.daysRemaining}
                    </TableCell>
                    <TableCell className="text-right text-xs">{c.components.immSize.toFixed(0)}</TableCell>
                    <TableCell className="text-right text-xs">{c.components.immTime.toFixed(0)}</TableCell>
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
