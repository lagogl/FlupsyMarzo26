import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, X, Search, ChevronDown, ChevronRight, GitBranch, Layers, Hash, Package, BookOpen, TrendingUp, AlertTriangle, ShoppingCart, Activity, BarChart2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";

const OP_TYPE_LABELS: Record<string, string> = {
  'prima-attivazione': 'Prima Attivazione',
  'misura': 'Misura',
  'peso': 'Peso',
  'mortalita': 'Mortalità',
  'chiusura-ciclo': 'Chiusura Ciclo',
  'chiusura-ciclo-vagliatura': 'Chiusura Vagliatura',
  'trasferimento': 'Trasferimento',
  'vendita': 'Vendita',
};

const OP_TYPE_COLORS: Record<string, string> = {
  'prima-attivazione': 'bg-blue-100 text-blue-800',
  'misura': 'bg-purple-100 text-purple-800',
  'peso': 'bg-indigo-100 text-indigo-800',
  'mortalita': 'bg-red-100 text-red-800',
  'chiusura-ciclo': 'bg-gray-100 text-gray-800',
  'chiusura-ciclo-vagliatura': 'bg-orange-100 text-orange-800',
  'trasferimento': 'bg-teal-100 text-teal-800',
  'vendita': 'bg-green-100 text-green-800',
};

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function formatNum(n: number | null | undefined) {
  if (n == null) return '—';
  return n.toLocaleString('it-IT');
}

type SelectedItem =
  | { type: 'lot'; lotId: number; label: string }
  | { type: 'cycle'; cycleId: number };

function CycleRow({ cycle, depth, allCycles }: { cycle: any; depth: number; allCycles: any[] }) {
  const [open, setOpen] = useState(true);
  const [opsOpen, setOpsOpen] = useState(false);
  const isRoot = !cycle.parent_cycle_id;
  const children = allCycles.filter(c => c.parent_cycle_id === cycle.id);
  const indent = depth * 16;

  return (
    <>
      <tr className={`border-b ${isRoot ? 'bg-emerald-50' : depth === 1 ? 'bg-blue-50' : 'bg-slate-50'} hover:brightness-95 transition-all`}>
        <td className="py-2 px-3" style={{ paddingLeft: indent + 12 }}>
          <div className="flex items-center gap-1">
            {children.length > 0 && (
              <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-gray-700">
                {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
            )}
            {isRoot && <GitBranch className="w-3 h-3 text-emerald-600 flex-shrink-0" />}
            {!isRoot && <Layers className="w-3 h-3 text-blue-400 flex-shrink-0" />}
            <span className="font-mono text-sm font-semibold">#{cycle.id}</span>
            {isRoot && <Badge className="ml-1 text-[10px] bg-emerald-600">RADICE</Badge>}
          </div>
        </td>
        <td className="py-2 px-3 text-sm font-semibold">Cesta #{cycle.basket_physical_number}</td>
        <td className="py-2 px-3 text-sm text-gray-600">{cycle.flupsy_name}</td>
        <td className="py-2 px-3 text-sm">{cycle.lot_name ?? '—'}<br /><span className="text-xs text-gray-500">{cycle.lot_supplier ?? ''}</span></td>
        <td className="py-2 px-3 text-sm">{formatDate(cycle.start_date)}</td>
        <td className="py-2 px-3 text-sm">{formatDate(cycle.end_date)}</td>
        <td className="py-2 px-3">
          <Badge className={cycle.state === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
            {cycle.state === 'active' ? 'Attivo' : 'Chiuso'}
          </Badge>
        </td>
        <td className="py-2 px-3 text-sm">{cycle.parent_cycle_id ? `#${cycle.parent_cycle_id}` : '—'}</td>
        <td className="py-2 px-3 text-sm font-medium text-emerald-700">{cycle.last_size_code ?? '—'}</td>
        <td className="py-2 px-3 text-sm">{formatNum(cycle.last_animal_count)}</td>
        <td className="py-2 px-3 text-sm">{cycle.last_total_weight ? `${(cycle.last_total_weight / 1000).toFixed(2)} kg` : '—'}</td>
        <td className="py-2 px-3 text-sm text-gray-500">{cycle.operations?.length ?? 0}</td>
        <td className="py-2 px-3">
          {cycle.operations?.length > 0 && (
            <button
              onClick={() => setOpsOpen(!opsOpen)}
              className="text-xs text-blue-600 hover:underline whitespace-nowrap"
            >
              {opsOpen ? 'Nascondi' : 'Mostra'}
            </button>
          )}
        </td>
      </tr>

      {opsOpen && cycle.operations?.length > 0 && (
        <tr>
          <td colSpan={13} className="p-0 bg-white">
            <div className="mx-4 my-2 border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="py-1 px-3 text-left font-medium text-gray-600">Data</th>
                    <th className="py-1 px-3 text-left font-medium text-gray-600">Tipo</th>
                    <th className="py-1 px-3 text-right font-medium text-gray-600">N° Animali</th>
                    <th className="py-1 px-3 text-right font-medium text-gray-600">Animali/Kg</th>
                    <th className="py-1 px-3 text-right font-medium text-gray-600">Peso (g)</th>
                    <th className="py-1 px-3 text-right font-medium text-gray-600">Morti</th>
                    <th className="py-1 px-3 text-left font-medium text-gray-600">Taglia</th>
                    <th className="py-1 px-3 text-left font-medium text-gray-600">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {cycle.operations.map((op: any) => (
                    <tr key={op.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="py-1 px-3">{formatDate(op.date)}</td>
                      <td className="py-1 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${OP_TYPE_COLORS[op.type] ?? 'bg-gray-100 text-gray-700'}`}>
                          {OP_TYPE_LABELS[op.type] ?? op.type}
                        </span>
                      </td>
                      <td className="py-1 px-3 text-right">{formatNum(op.animal_count)}</td>
                      <td className="py-1 px-3 text-right">{formatNum(op.animals_per_kg)}</td>
                      <td className="py-1 px-3 text-right">{op.total_weight ? `${op.total_weight}` : '—'}</td>
                      <td className="py-1 px-3 text-right">{formatNum(op.dead_count)}</td>
                      <td className="py-1 px-3">{op.size_code ?? '—'}</td>
                      <td className="py-1 px-3 text-gray-500 max-w-xs truncate" title={op.notes ?? ''}>
                        {op.notes ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}

      {open && children.map(child => (
        <CycleRow key={child.id} cycle={child} depth={depth + 1} allCycles={allCycles} />
      ))}
    </>
  );
}

function computeGroupStats(group: any) {
  const cycles = group.cycles as any[];
  const rootCycles = cycles.filter((c: any) => !c.parent_cycle_id);

  const initialAnimals = rootCycles.reduce((sum: number, c: any) => {
    const fa = (c.operations || []).find((op: any) => op.type === 'prima-attivazione');
    return sum + (fa?.animal_count || 0);
  }, 0);

  const rootCycleLosses = rootCycles.reduce((sum: number, c: any) => {
    const ops = [...(c.operations || [])].sort((a: any, b: any) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    if (ops.length < 1) return sum;
    return sum + Math.max(0, (ops[0].animal_count || 0) - (ops[ops.length - 1].animal_count || 0));
  }, 0);

  const vagliaturaDeaths = cycles.reduce((sum: number, c: any) => {
    const closeOp = (c.operations || []).find((op: any) => op.type === 'chiusura-ciclo-vagliatura');
    if (!closeOp) return sum;
    const parsed = parseVagliaturaNote(closeOp.notes);
    if (!parsed || parsed.mortality <= 0) return sum;
    const totalOrigin = parsed.distributed + parsed.mortality;
    if (totalOrigin <= 0) return sum;
    return sum + Math.round(parsed.mortality * ((closeOp.animal_count || 0) / totalOrigin));
  }, 0);

  // Perdite organiche nei cicli FIGLI (non radice): animali che muoiono naturalmente
  // tra la prima-attivazione del figlio e la sua ultima operazione, non catturate
  // da rootCycleLosses (che copre solo i radici) né da vagliaturaDeaths (che copre
  // solo le morti nel setaccio, non quelle organiche tra una vagliatura e l'altra).
  const nonRootCycles = cycles.filter((c: any) => !!c.parent_cycle_id);
  const childOrganicLosses = nonRootCycles.reduce((sum: number, c: any) => {
    const ops = [...(c.operations || [])].sort((a: any, b: any) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const primaAtt = ops.find((op: any) => op.type === 'prima-attivazione');
    if (!primaAtt || ops.length < 1) return sum;
    const lastOp = ops[ops.length - 1];
    return sum + Math.max(0, (primaAtt.animal_count || 0) - (lastOp.animal_count || 0));
  }, 0);

  const allOps = cycles.flatMap((c: any) => c.operations || []);
  const salesOps = allOps.filter((op: any) => op.type === 'vendita');
  const totalSold = salesOps.reduce((sum: number, op: any) => sum + (op.animal_count || 0), 0);
  const activeCycles = cycles.filter((c: any) => c.state === 'active');
  const totalActive = activeCycles.reduce((sum: number, c: any) => sum + (c.last_animal_count || 0), 0);

  const allDates = allOps.map((op: any) => op.date).filter(Boolean).sort();
  const firstDate = allDates[0] ?? null;
  const lastDate = allDates[allDates.length - 1] ?? null;

  return {
    initialAnimals,
    rootCycleLosses,
    vagliaturaDeaths,
    childOrganicLosses,
    totalDeaths: rootCycleLosses + vagliaturaDeaths + childOrganicLosses,
    totalSold,
    totalActive,
    activeCycleCount: activeCycles.length,
    totalCycles: cycles.length,
    firstDate,
    lastDate,
  };
}

function LotSummary({ groups, selectedItems }: { groups: any[]; selectedItems: any[] }) {
  const lotLabels = selectedItems.filter((s: any) => s.type === 'lot').map((s: any) => s.label);

  const agg = groups.reduce(
    (acc, g) => {
      const s = computeGroupStats(g);
      acc.initialAnimals += s.initialAnimals;
      acc.totalDeaths += s.totalDeaths;
      acc.rootCycleLosses += s.rootCycleLosses;
      acc.vagliaturaDeaths += s.vagliaturaDeaths;
      acc.childOrganicLosses += s.childOrganicLosses;
      acc.totalSold += s.totalSold;
      acc.totalActive += s.totalActive;
      acc.activeCycleCount += s.activeCycleCount;
      acc.totalCycles += s.totalCycles;
      if (!acc.firstDate || (s.firstDate && s.firstDate < acc.firstDate)) acc.firstDate = s.firstDate;
      if (!acc.lastDate || (s.lastDate && s.lastDate > acc.lastDate)) acc.lastDate = s.lastDate;
      return acc;
    },
    {
      initialAnimals: 0,
      totalDeaths: 0,
      rootCycleLosses: 0,
      vagliaturaDeaths: 0,
      childOrganicLosses: 0,
      totalSold: 0,
      totalActive: 0,
      activeCycleCount: 0,
      totalCycles: 0,
      firstDate: null as string | null,
      lastDate: null as string | null,
    }
  );

  const mortalityPct = agg.initialAnimals > 0 ? (agg.totalDeaths / agg.initialAnimals * 100) : 0;
  const soldPct = agg.initialAnimals > 0 ? (agg.totalSold / agg.initialAnimals * 100) : 0;
  const activePct = agg.initialAnimals > 0 ? (agg.totalActive / agg.initialAnimals * 100) : 0;
  const mortalityColor = mortalityPct > 30 ? 'text-red-700' : mortalityPct > 10 ? 'text-orange-600' : 'text-green-700';

  return (
    <Card className="mb-5 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Package className="w-5 h-5" />
          <span>Riepilogo Lotto</span>
          {lotLabels.length > 0 && (
            <span className="text-sm font-normal text-blue-600">— {lotLabels.join(', ')}</span>
          )}
          <span className="ml-auto text-sm font-normal text-blue-500">
            {groups.length} {groups.length === 1 ? 'gruppo genealogico' : 'gruppi genealogici'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-lg border border-blue-100 p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">Animali in ingresso</div>
            <div className="text-xl font-bold text-blue-700">{formatNum(agg.initialAnimals)}</div>
            {agg.firstDate && (
              <div className="text-xs text-gray-400 mt-1">dal {formatDate(agg.firstDate)}</div>
            )}
          </div>
          <div className="bg-white rounded-lg border border-red-100 p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">Mortalità totale</div>
            <div className={`text-xl font-bold ${mortalityColor}`}>{formatNum(agg.totalDeaths)}</div>
            <div className={`text-xs font-semibold mt-1 ${mortalityColor}`}>{mortalityPct.toFixed(1)}% degli iniziali</div>
          </div>
          <div className="bg-white rounded-lg border border-green-100 p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">Venduti</div>
            <div className="text-xl font-bold text-green-700">{formatNum(agg.totalSold)}</div>
            {soldPct > 0 && (
              <div className="text-xs text-green-500 mt-1">{soldPct.toFixed(1)}% degli iniziali</div>
            )}
          </div>
          <div className="bg-white rounded-lg border border-emerald-100 p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">In produzione</div>
            <div className="text-xl font-bold text-emerald-700">{formatNum(agg.totalActive)}</div>
            <div className="text-xs text-emerald-500 mt-1">{agg.activeCycleCount} {agg.activeCycleCount === 1 ? 'cesta attiva' : 'ceste attive'}</div>
          </div>
        </div>

        <div className="text-xs text-gray-600 space-y-1 border-t border-blue-100 pt-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span><strong>Cicli totali:</strong> {agg.totalCycles}</span>
            <span><strong>Bilancio:</strong> {formatNum(agg.initialAnimals)} ingresso → {formatNum(agg.totalDeaths)} morti ({mortalityPct.toFixed(1)}%) · {formatNum(agg.totalSold)} venduti ({soldPct.toFixed(1)}%) · {formatNum(agg.totalActive)} in crescita ({activePct.toFixed(1)}%)</span>
          </div>
          {agg.totalDeaths > 0 && (
            <div className="text-gray-400">
              Breakdown mortalità: {formatNum(agg.rootCycleLosses)} da misure ({agg.initialAnimals > 0 ? (agg.rootCycleLosses / agg.initialAnimals * 100).toFixed(1) : 0}%)
              {agg.vagliaturaDeaths > 0 && <> · {formatNum(agg.vagliaturaDeaths)} alla vagliatura ({agg.initialAnimals > 0 ? (agg.vagliaturaDeaths / agg.initialAnimals * 100).toFixed(1) : 0}%)</>}
              {agg.childOrganicLosses > 0 && <> · {formatNum(agg.childOrganicLosses)} organiche post-vagliatura ({agg.initialAnimals > 0 ? (agg.childOrganicLosses / agg.initialAnimals * 100).toFixed(1) : 0}%)</>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PlantSummary({ groups }: { groups: any[] }) {
  const [sortCol, setSortCol] = useState<'mortality' | 'active' | 'initial' | 'date'>('active');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  const agg = useMemo(() => groups.reduce(
    (acc, g) => {
      const s = computeGroupStats(g);
      acc.initialAnimals += s.initialAnimals;
      acc.totalDeaths += s.totalDeaths;
      acc.rootCycleLosses += s.rootCycleLosses;
      acc.vagliaturaDeaths += s.vagliaturaDeaths;
      acc.childOrganicLosses += s.childOrganicLosses;
      acc.totalSold += s.totalSold;
      acc.totalActive += s.totalActive;
      acc.activeCycleCount += s.activeCycleCount;
      acc.totalCycles += s.totalCycles;
      acc.totalGroups += 1;
      if (!acc.firstDate || (s.firstDate && s.firstDate < acc.firstDate)) acc.firstDate = s.firstDate;
      if (!acc.lastDate || (s.lastDate && s.lastDate > acc.lastDate)) acc.lastDate = s.lastDate;
      return acc;
    },
    {
      initialAnimals: 0, totalDeaths: 0, rootCycleLosses: 0, vagliaturaDeaths: 0,
      childOrganicLosses: 0,
      totalSold: 0, totalActive: 0, activeCycleCount: 0, totalCycles: 0, totalGroups: 0,
      firstDate: null as string | null, lastDate: null as string | null,
    }
  ), [groups]);

  const mortalityPct = agg.initialAnimals > 0 ? (agg.totalDeaths / agg.initialAnimals * 100) : 0;
  const soldPct = agg.initialAnimals > 0 ? (agg.totalSold / agg.initialAnimals * 100) : 0;
  const activePct = agg.initialAnimals > 0 ? (agg.totalActive / agg.initialAnimals * 100) : 0;
  const mortalityColor = mortalityPct > 30 ? 'text-red-700' : mortalityPct > 10 ? 'text-orange-600' : 'text-green-700';

  const groupRows = useMemo(() => {
    return groups.map(g => {
      const s = computeGroupStats(g);
      const rootCycle = g.rootCycle ?? g.cycles?.find((c: any) => !c.parent_cycle_id);
      const lotLabel = rootCycle ? [rootCycle.lot_supplier, rootCycle.lot_name].filter(Boolean).join(' ') || `Lotto #${rootCycle.lot_id}` : '—';
      const mortPct = s.initialAnimals > 0 ? (s.totalDeaths / s.initialAnimals * 100) : 0;
      return { ...s, mortPct, lotLabel, rootCycle, groupId: g.lineageGroupId };
    }).sort((a, b) => {
      let va = 0, vb = 0;
      if (sortCol === 'mortality') { va = a.mortPct; vb = b.mortPct; }
      else if (sortCol === 'active') { va = a.totalActive; vb = b.totalActive; }
      else if (sortCol === 'initial') { va = a.initialAnimals; vb = b.initialAnimals; }
      else if (sortCol === 'date') { va = a.firstDate ? new Date(a.firstDate).getTime() : 0; vb = b.firstDate ? new Date(b.firstDate).getTime() : 0; }
      return sortDir === 'desc' ? vb - va : va - vb;
    });
  }, [groups, sortCol, sortDir]);

  function toggleSort(col: typeof sortCol) {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortCol(col); setSortDir('desc'); }
  }

  const SortTh = ({ col, label }: { col: typeof sortCol; label: string }) => (
    <th
      className="py-2 px-3 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:text-indigo-700 select-none"
      onClick={() => toggleSort(col)}
    >
      {label} {sortCol === col ? (sortDir === 'desc' ? '↓' : '↑') : ''}
    </th>
  );

  return (
    <div className="space-y-4">
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-indigo-800">
            <Layers className="w-5 h-5" />
            <span>Situazione Totale Impianto</span>
            <span className="ml-auto text-sm font-normal text-indigo-500">
              {agg.totalGroups} gruppi · {agg.totalCycles} cicli totali
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded-lg border border-indigo-100 p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">Animali in ingresso</div>
              <div className="text-xl font-bold text-indigo-700">{formatNum(agg.initialAnimals)}</div>
              {agg.firstDate && <div className="text-xs text-gray-400 mt-1">dal {formatDate(agg.firstDate)}</div>}
            </div>
            <div className="bg-white rounded-lg border border-red-100 p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">Mortalità totale</div>
              <div className={`text-xl font-bold ${mortalityColor}`}>{formatNum(agg.totalDeaths)}</div>
              <div className={`text-xs font-semibold mt-1 ${mortalityColor}`}>{mortalityPct.toFixed(1)}% degli iniziali</div>
            </div>
            <div className="bg-white rounded-lg border border-green-100 p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">Venduti</div>
              <div className="text-xl font-bold text-green-700">{formatNum(agg.totalSold)}</div>
              {soldPct > 0 && <div className="text-xs text-green-500 mt-1">{soldPct.toFixed(1)}% degli iniziali</div>}
            </div>
            <div className="bg-white rounded-lg border border-emerald-100 p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">In produzione</div>
              <div className="text-xl font-bold text-emerald-700">{formatNum(agg.totalActive)}</div>
              <div className="text-xs text-emerald-500 mt-1">{agg.activeCycleCount} {agg.activeCycleCount === 1 ? 'cesta attiva' : 'ceste attive'}</div>
            </div>
          </div>
          <div className="text-xs text-gray-600 space-y-1 border-t border-indigo-100 pt-3">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span><strong>Bilancio globale:</strong> {formatNum(agg.initialAnimals)} ingresso → {formatNum(agg.totalDeaths)} morti ({mortalityPct.toFixed(1)}%) · {formatNum(agg.totalSold)} venduti ({soldPct.toFixed(1)}%) · {formatNum(agg.totalActive)} in crescita ({activePct.toFixed(1)}%)</span>
            </div>
            {agg.totalDeaths > 0 && (
              <div className="text-gray-400">
                Breakdown mortalità: {formatNum(agg.rootCycleLosses)} da misure ({agg.initialAnimals > 0 ? (agg.rootCycleLosses / agg.initialAnimals * 100).toFixed(1) : 0}%)
                {agg.vagliaturaDeaths > 0 && <> · {formatNum(agg.vagliaturaDeaths)} alla vagliatura ({agg.initialAnimals > 0 ? (agg.vagliaturaDeaths / agg.initialAnimals * 100).toFixed(1) : 0}%)</>}
                {agg.childOrganicLosses > 0 && <> · {formatNum(agg.childOrganicLosses)} organiche post-vagliatura ({agg.initialAnimals > 0 ? (agg.childOrganicLosses / agg.initialAnimals * 100).toFixed(1) : 0}%)</>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-700 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Dettaglio per gruppo genealogico
            <span className="ml-auto text-xs font-normal text-gray-400">Clicca intestazione per ordinare</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Gruppo</th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Lotto / Fornitore</th>
                  <SortTh col="date" label="Inizio" />
                  <SortTh col="initial" label="Ingresso" />
                  <SortTh col="mortality" label="Mortalità %" />
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Morti</th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Venduti</th>
                  <SortTh col="active" label="Attivi" />
                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Ceste</th>
                </tr>
              </thead>
              <tbody>
                {groupRows.map((row, i) => {
                  const mortColor = row.mortPct > 30 ? 'text-red-600 font-bold' : row.mortPct > 10 ? 'text-orange-500' : 'text-gray-700';
                  const hasActive = row.totalActive > 0;
                  return (
                    <tr key={row.groupId} className={`border-b last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${hasActive ? '' : 'opacity-60'}`}>
                      <td className="py-2 px-3 text-xs text-gray-400 font-mono">#{row.groupId}</td>
                      <td className="py-2 px-3 text-xs max-w-[140px] truncate">{row.lotLabel}</td>
                      <td className="py-2 px-3 text-xs text-gray-500">{row.firstDate ? formatDate(row.firstDate) : '—'}</td>
                      <td className="py-2 px-3 text-xs font-medium">{formatNum(row.initialAnimals)}</td>
                      <td className={`py-2 px-3 text-xs ${mortColor}`}>{row.mortPct.toFixed(1)}%</td>
                      <td className="py-2 px-3 text-xs text-red-500">{formatNum(row.totalDeaths)}</td>
                      <td className="py-2 px-3 text-xs text-green-600">{formatNum(row.totalSold)}</td>
                      <td className="py-2 px-3 text-xs font-semibold text-emerald-700">{formatNum(row.totalActive)}</td>
                      <td className="py-2 px-3 text-xs text-gray-500">{row.activeCycleCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function parseVagliaturaNote(notes: string | null | undefined): { distributed: number; mortality: number } | null {
  if (!notes) return null;
  const distMatch = notes.match(/Animali distribuiti: (\d+)/);
  const mortMatch = notes.match(/Mortalità: (-?\d+)/);
  if (!distMatch || !mortMatch) return null;
  return {
    distributed: parseInt(distMatch[1]),
    mortality: parseInt(mortMatch[1]),
  };
}

function LineageSummary({ group }: { group: any }) {
  const cycles = group.cycles as any[];
  const rootCycles = cycles.filter(c => !c.parent_cycle_id);

  const allOps = cycles.flatMap(c =>
    (c.operations || []).map((op: any) => ({
      ...op,
      cycleId: c.id,
      basketNum: c.basket_physical_number,
      flupsyName: c.flupsy_name,
    }))
  );

  // MORTALITÀ CORRETTA:
  // - Cicli radice: differenza animal_count (prima op → ultima op) = morti proiettati sul totale
  // - Cicli con chiusura-vagliatura: quota proporzionale della mortalità globale della vagliatura,
  //   calcolata dalla nota "Animali distribuiti: X. Mortalità: Y" salvata dal sistema al momento della vagliatura.
  //   Proporzione = animalCount di questo ciclo / (X + Y) = quota di questo lotto sul totale origine.
  const rootCycleLosses = rootCycles.reduce((sum: number, c: any) => {
    const ops = [...(c.operations || [])].sort((a: any, b: any) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    if (ops.length < 1) return sum;
    const first = ops[0].animal_count || 0;
    const last = ops[ops.length - 1].animal_count || 0;
    return sum + Math.max(0, first - last);
  }, 0);

  const vagliaturaDeaths = cycles.reduce((sum: number, c: any) => {
    const closeOp = (c.operations || []).find((op: any) => op.type === 'chiusura-ciclo-vagliatura');
    if (!closeOp) return sum;
    const parsed = parseVagliaturaNote(closeOp.notes);
    if (!parsed || parsed.mortality <= 0) return sum;
    const totalOrigin = parsed.distributed + parsed.mortality;
    if (totalOrigin <= 0) return sum;
    const thisBasketAnimals = closeOp.animal_count || 0;
    return sum + Math.round(parsed.mortality * (thisBasketAnimals / totalOrigin));
  }, 0);

  const totalDeaths = rootCycleLosses + vagliaturaDeaths;
  const initialAnimals = rootCycles.reduce((sum: number, c: any) => {
    const firstAct = (c.operations || []).find((op: any) => op.type === 'prima-attivazione');
    return sum + (firstAct?.animal_count || 0);
  }, 0);
  const mortalityPct = initialAnimals > 0 ? (totalDeaths / initialAnimals * 100) : 0;

  const rootOps = rootCycles
    .flatMap(c => c.operations || [])
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const sizeMilestones: { size: string; date: string; animalsPerKg: number }[] = [];
  let lastSize = '';
  for (const op of rootOps) {
    if (op.size_code && op.size_code !== lastSize) {
      sizeMilestones.push({ size: op.size_code, date: op.date, animalsPerKg: op.animals_per_kg });
      lastSize = op.size_code;
    }
  }

  const vagliaturaEvents = cycles
    .filter(c => (c.operations || []).some((op: any) => op.type === 'chiusura-ciclo-vagliatura'))
    .map(c => {
      const op = (c.operations || []).find((op: any) => op.type === 'chiusura-ciclo-vagliatura');
      const children = cycles.filter((ch: any) => ch.parent_cycle_id === c.id);
      const childAnimals = children.reduce((sum: number, ch: any) => {
        const fa = (ch.operations || []).find((o: any) => o.type === 'prima-attivazione');
        return sum + (fa?.animal_count || 0);
      }, 0);
      const sizes = [...new Set(children.map((ch: any) => {
        const fa = (ch.operations || []).find((o: any) => o.type === 'prima-attivazione');
        return fa?.size_code;
      }).filter(Boolean))] as string[];

      const parsed = parseVagliaturaNote(op?.notes);
      let proportionalMortality = 0;
      let totalVagliaturaOrigin = 0;
      let totalVagliatraMortality = 0;
      let proportion = 0;
      if (parsed && parsed.mortality > 0) {
        totalVagliaturaOrigin = parsed.distributed + parsed.mortality;
        totalVagliatraMortality = parsed.mortality;
        const thisBasketAnimals = op?.animal_count || 0;
        proportion = totalVagliaturaOrigin > 0 ? thisBasketAnimals / totalVagliaturaOrigin : 0;
        proportionalMortality = Math.round(parsed.mortality * proportion);
      }

      return {
        parentId: c.id,
        date: op?.date,
        childCount: children.length,
        proportionalMortality,
        totalVagliaturaOrigin,
        totalVagliatraMortality,
        proportion,
        childAnimals,
        sizes,
      };
    });

  const salesOps = allOps.filter(op => op.type === 'vendita');
  const totalSold = salesOps.reduce((sum: number, op: any) => sum + (op.animal_count || 0), 0);
  const activeCycles = cycles.filter(c => c.state === 'active');
  const totalActiveAnimals = activeCycles.reduce((sum: number, c: any) => sum + (c.last_animal_count || 0), 0);

  const rootStart = rootCycles[0]?.start_date;
  const rootEnd = rootCycles[0]?.end_date;
  const rootDays = rootStart && rootEnd
    ? Math.floor((new Date(rootEnd).getTime() - new Date(rootStart).getTime()) / 86400000)
    : null;
  const today = new Date().toISOString().split('T')[0];
  const daysTotal = rootStart
    ? Math.floor((new Date(today).getTime() - new Date(rootStart).getTime()) / 86400000)
    : 0;

  return (
    <div className="mx-4 mt-3 mb-1 rounded-lg border border-amber-200 bg-amber-50 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 border-b border-amber-200">
        <BookOpen className="w-4 h-4 text-amber-700" />
        <span className="font-semibold text-amber-800 text-sm">Riepilogo Analitico</span>
      </div>
      <div className="px-4 py-3 space-y-2 text-sm text-gray-700 leading-relaxed">

        {rootCycles.map(rc => {
          const fa = (rc.operations || []).find((op: any) => op.type === 'prima-attivazione');
          const weightMg = fa?.animals_per_kg ? Math.round(1000000 / fa.animals_per_kg) : null;
          return (
            <p key={rc.id}>
              <TrendingUp className="w-3.5 h-3.5 inline text-blue-600 mr-1" />
              <span className="font-semibold text-blue-700">Arrivo:</span>{' '}
              Il <strong>{formatDate(rc.start_date)}</strong>, <strong>{formatNum(fa?.animal_count)}</strong> animali
              entrano in Cesta #{rc.basket_physical_number} ({rc.flupsy_name}) alla taglia <strong>{fa?.size_code ?? '—'}</strong>
              {fa?.animals_per_kg ? ` — ${formatNum(fa.animals_per_kg)}/kg` : ''}
              {weightMg ? ` (peso medio ~${weightMg < 1000 ? weightMg + ' mg' : (weightMg / 1000).toFixed(1) + ' g'})` : ''}.
              {' '}<em className="text-gray-500">Lotto: {rc.lot_name ?? '—'} / {rc.lot_supplier ?? '—'}</em>
            </p>
          );
        })}

        {sizeMilestones.length > 1 && (
          <p>
            <Activity className="w-3.5 h-3.5 inline text-indigo-600 mr-1" />
            <span className="font-semibold text-indigo-700">Crescita{rootDays ? ` (${rootDays} giorni)` : ''}:</span>{' '}
            {sizeMilestones.map((m, i) => (
              <span key={i}>
                {i > 0 && <span className="text-gray-400 mx-1">→</span>}
                <strong>{m.size}</strong>{' '}
                <span className="text-gray-500 text-xs">({formatDate(m.date)}{m.animalsPerKg ? `, ${formatNum(m.animalsPerKg)}/kg` : ''})</span>
              </span>
            ))}.
          </p>
        )}

        {vagliaturaEvents.map((v, i) => (
          <p key={i}>
            <GitBranch className="w-3.5 h-3.5 inline text-orange-600 mr-1" />
            <span className="font-semibold text-orange-700">Vagliatura{vagliaturaEvents.length > 1 ? ` #${i + 1}` : ''}:</span>{' '}
            Il <strong>{formatDate(v.date)}</strong> — animali distribuiti in{' '}
            <strong>{v.childCount} {v.childCount === 1 ? 'cesta' : 'ceste'}</strong>
            {v.sizes.length > 0 ? ` (taglie: ${v.sizes.join(', ')})` : ''}.
            {v.childAnimals > 0 && <> Totale consegnato: <strong>{formatNum(v.childAnimals)}</strong> animali.</>}
            {v.proportionalMortality > 0 && (
              <span className="text-red-600">
                {' '}Morti stimati (quota proporzionale): <strong>{formatNum(v.proportionalMortality)}</strong>
                {v.totalVagliaturaOrigin > 0
                  ? ` (${(v.proportion * 100).toFixed(1)}% del totale vagliatura · globale: ${formatNum(v.totalVagliatraMortality)} su ${formatNum(v.totalVagliaturaOrigin)} origine)`
                  : ''}.
              </span>
            )}
          </p>
        ))}

        {salesOps.length > 0 && (
          <p>
            <ShoppingCart className="w-3.5 h-3.5 inline text-green-600 mr-1" />
            <span className="font-semibold text-green-700">Vendita{salesOps.length > 1 ? `e (${salesOps.length})` : ''}:</span>{' '}
            {salesOps.map((op, i) => (
              <span key={i}>
                {i > 0 && ' · '}
                Il <strong>{formatDate(op.date)}</strong>: <strong>{formatNum(op.animal_count)}</strong> animali
                {op.size_code ? <> taglia <strong>{op.size_code}</strong></> : ''}
                {op.animals_per_kg ? ` (${formatNum(op.animals_per_kg)}/kg` + (op.animals_per_kg > 0 ? `, ~${(1000000 / op.animals_per_kg / 1000).toFixed(0)}g cad.)` : ')') : ''}
                {' '}— Cesta #{op.basketNum} ({op.flupsyName})
              </span>
            ))}.
            {' '}Totale venduto: <strong>{formatNum(totalSold)}</strong> animali.
          </p>
        )}

        {activeCycles.length > 0 && (
          <p>
            <Activity className="w-3.5 h-3.5 inline text-emerald-600 mr-1" />
            <span className="font-semibold text-emerald-700">In produzione:</span>{' '}
            <strong>{activeCycles.length} {activeCycles.length === 1 ? 'cesta attiva' : 'ceste attive'}</strong> con{' '}
            <strong>{formatNum(totalActiveAnimals)}</strong> animali in crescita.{' '}
            <span className="text-gray-500 text-xs">
              ({activeCycles.map((c: any) => `Cesta #${c.basket_physical_number} ${c.flupsy_name} — ${c.last_size_code ?? '?'}`).join(', ')})
            </span>
          </p>
        )}

        <p>
          <AlertTriangle className="w-3.5 h-3.5 inline text-red-500 mr-1" />
          <span className="font-semibold text-red-700">Mortalità totale:</span>{' '}
          <strong>{formatNum(totalDeaths)}</strong> animali persi
          {initialAnimals > 0 && (
            <> — <strong className={mortalityPct > 10 ? 'text-red-600' : mortalityPct > 3 ? 'text-orange-600' : 'text-green-700'}>{mortalityPct.toFixed(2)}%</strong> degli animali iniziali</>
          )}.
          {rootCycleLosses > 0 && vagliaturaDeaths > 0 && (
            <span className="text-gray-500 text-xs ml-1">
              (in produzione: {formatNum(rootCycleLosses)} da proiezione campioni{initialAnimals > 0 ? ` = ${(rootCycleLosses / initialAnimals * 100).toFixed(2)}%` : ''}
              {' '}· alla vagliatura: {formatNum(vagliaturaDeaths)} stimati proporzionalmente{initialAnimals > 0 ? ` = ${(vagliaturaDeaths / initialAnimals * 100).toFixed(2)}%` : ''})
            </span>
          )}
          {rootCycleLosses > 0 && vagliaturaDeaths === 0 && (
            <span className="text-gray-500 text-xs ml-1">(da proiezione campioni di misura)</span>
          )}
          {vagliaturaDeaths > 0 && rootCycleLosses === 0 && (
            <span className="text-gray-500 text-xs ml-1">(stimati proporzionalmente dalla mortalità globale della vagliatura)</span>
          )}.
          {' '}<span className="text-gray-500 text-xs">
            Cicli totali: {cycles.length} · Durata complessiva: {daysTotal > 0 ? `${daysTotal} giorni` : '—'}.
          </span>
        </p>
      </div>
    </div>
  );
}

function LineageGroup({ group }: { group: any }) {
  const rootCycles = group.cycles.filter((c: any) => !c.parent_cycle_id || c.parent_cycle_id === null);
  const totalAnimals = group.cycles.reduce((sum: number, c: any) => {
    if (c.state === 'active') return sum + (c.last_animal_count || 0);
    return sum;
  }, 0);
  const activeCycles = group.cycles.filter((c: any) => c.state === 'active').length;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-emerald-600" />
            <span>Gruppo Genealogico #{group.lineageGroupId}</span>
            {group.rootCycle && (
              <span className="text-sm text-gray-500 font-normal">
                — origine: Cesta #{group.rootCycle.basket_physical_number} ({group.rootCycle.flupsy_name})
                il {formatDate(group.rootCycle.start_date)}
              </span>
            )}
          </div>
          <div className="flex gap-2 text-sm font-normal">
            <Badge className="bg-blue-100 text-blue-800">{group.cycles.length} cicli</Badge>
            <Badge className="bg-green-100 text-green-800">{activeCycles} attivi</Badge>
            <Badge className="bg-purple-100 text-purple-800">{formatNum(totalAnimals)} animali attivi</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <LineageSummary group={group} />
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Ciclo</th>
                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Cesta</th>
                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">FLUPSY</th>
                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Lotto / Fornitore</th>
                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Inizio</th>
                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Fine</th>
                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Stato</th>
                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Genitore</th>
                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Taglia</th>
                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">N° Animali</th>
                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Peso Tot.</th>
                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Op.</th>
                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600">Dettaglio</th>
              </tr>
            </thead>
            <tbody>
              {rootCycles.map((cycle: any) => (
                <CycleRow key={cycle.id} cycle={cycle} depth={0} allCycles={group.cycles} />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ── SGR helper ────────────────────────────────────────────────────────────────
function computeSGRForCycles(cycles: any[]): { avgSGR: number | null; intervals: number } {
  let total = 0, count = 0;
  for (const c of cycles) {
    const wOps = (c.operations || [])
      .filter((op: any) => (op.type === 'peso' || op.type === 'misura') && op.average_weight != null && op.average_weight > 0)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    for (let i = 1; i < wOps.length; i++) {
      const days = (new Date(wOps[i].date).getTime() - new Date(wOps[i - 1].date).getTime()) / 86400000;
      if (days < 3) continue;
      const sgr = (Math.log(wOps[i].average_weight) - Math.log(wOps[i - 1].average_weight)) / days * 100;
      if (sgr > 0 && sgr < 15) { total += sgr; count++; }
    }
  }
  return { avgSGR: count > 0 ? total / count : null, intervals: count };
}

const CHART_COLORS = ['#f59e0b','#3b82f6','#10b981','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899','#84cc16','#14b8a6'];

const LOT_METRICS = [
  { key: 'initialAnimals', label: 'Ingresso', unit: '', isPercent: false },
  { key: 'mortalityPct', label: 'Mortalità %', unit: '%', isPercent: true },
  { key: 'totalDeaths', label: 'Morti totali', unit: '', isPercent: false },
  { key: 'rootCycleLosses', label: 'Morti da misure', unit: '', isPercent: false },
  { key: 'vagliaturaDeaths', label: 'Morti vagliatura', unit: '', isPercent: false },
  { key: 'childOrganicLosses', label: 'Morti organiche', unit: '', isPercent: false },
  { key: 'totalSold', label: 'Venduti', unit: '', isPercent: false },
  { key: 'soldPct', label: 'Venduti %', unit: '%', isPercent: true },
  { key: 'totalActive', label: 'In produzione', unit: '', isPercent: false },
  { key: 'activePct', label: 'In produzione %', unit: '%', isPercent: true },
  { key: 'activeCycleCount', label: 'Ceste attive', unit: '', isPercent: false },
  { key: 'totalCycles', label: 'Cicli totali', unit: '', isPercent: false },
  { key: 'avgSGR', label: 'SGR medio %/g', unit: '', isPercent: false },
  { key: 'groupCount', label: 'Gruppi genealogici', unit: '', isPercent: false },
];

function getLotShortLabel(lotInfo: any) {
  const sup = lotInfo.supplier ? lotInfo.supplier.substring(0, 14) : '';
  return `#${lotInfo.id}${sup ? ' · ' + sup : ''}`;
}

// ── Analisi Lotti ──────────────────────────────────────────────────────────────
function LotAnalysis({ allGroups, allLots }: { allGroups: any[]; allLots: any[] }) {
  const [expandedLots, setExpandedLots] = useState<Set<number>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [sortCol, setSortCol] = useState<string>('arrival');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [exporting, setExporting] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [chartLotIds, setChartLotIds] = useState<Set<number>>(new Set());
  const [chartMetrics, setChartMetrics] = useState<Set<string>>(new Set(['mortalityPct', 'soldPct', 'activePct']));
  const [chartType, setChartType] = useState<'bar' | 'radar'>('bar');
  const [normalize, setNormalize] = useState(false);

  const lotGroups = useMemo(() => {
    const map = new Map<number, { lotInfo: any; groups: any[] }>();
    for (const g of allGroups) {
      const root = g.rootCycle ?? (g.cycles ?? []).find((c: any) => !c.parent_cycle_id);
      if (!root) continue;
      const lotId = root.lot_id;
      if (!map.has(lotId)) {
        const lotInfo = allLots.find(l => l.id === lotId) ?? { id: lotId, supplier: root.lot_supplier, supplierLotNumber: root.lot_name };
        map.set(lotId, { lotInfo, groups: [] });
      }
      map.get(lotId)!.groups.push(g);
    }
    return Array.from(map.values());
  }, [allGroups, allLots]);

  const lotStats = useMemo(() => lotGroups.map(({ lotInfo, groups }) => {
    let initialAnimals = 0, totalDeaths = 0, rootCycleLosses = 0;
    let vagliaturaDeaths = 0, childOrganicLosses = 0;
    let totalSold = 0, totalActive = 0, activeCycleCount = 0, totalCycles = 0;
    let firstDate: string | null = null, lastDate: string | null = null;
    for (const g of groups) {
      const s = computeGroupStats(g);
      initialAnimals += s.initialAnimals; totalDeaths += s.totalDeaths;
      rootCycleLosses += s.rootCycleLosses; vagliaturaDeaths += s.vagliaturaDeaths;
      childOrganicLosses += s.childOrganicLosses; totalSold += s.totalSold;
      totalActive += s.totalActive; activeCycleCount += s.activeCycleCount; totalCycles += s.totalCycles;
      if (!firstDate || (s.firstDate && s.firstDate < firstDate)) firstDate = s.firstDate;
      if (!lastDate || (s.lastDate && s.lastDate > lastDate)) lastDate = s.lastDate;
    }
    const allCycles = groups.flatMap((g: any) => g.cycles ?? []);
    const { avgSGR, intervals: sgrIntervals } = computeSGRForCycles(allCycles);
    const mortalityPct = initialAnimals > 0 ? (totalDeaths / initialAnimals * 100) : 0;
    const soldPct = initialAnimals > 0 ? (totalSold / initialAnimals * 100) : 0;
    const activePct = initialAnimals > 0 ? (totalActive / initialAnimals * 100) : 0;
    return {
      lotInfo, groups, initialAnimals, totalDeaths, rootCycleLosses, vagliaturaDeaths,
      childOrganicLosses, totalSold, totalActive, activeCycleCount, totalCycles,
      firstDate, lastDate, avgSGR, sgrIntervals, mortalityPct, soldPct, activePct,
      isOpen: activeCycleCount > 0,
    };
  }), [lotGroups]);

  const sorted = useMemo(() => [...lotStats].sort((a, b) => {
    let va = 0, vb = 0;
    if (sortCol === 'mortality') { va = a.mortalityPct; vb = b.mortalityPct; }
    else if (sortCol === 'initial') { va = a.initialAnimals; vb = b.initialAnimals; }
    else if (sortCol === 'active') { va = a.totalActive; vb = b.totalActive; }
    else if (sortCol === 'sgr') { va = a.avgSGR ?? -1; vb = b.avgSGR ?? -1; }
    else { va = a.lotInfo.arrivalDate ? new Date(a.lotInfo.arrivalDate).getTime() : 0; vb = b.lotInfo.arrivalDate ? new Date(b.lotInfo.arrivalDate).getTime() : 0; }
    return sortDir === 'desc' ? vb - va : va - vb;
  }), [lotStats, sortCol, sortDir]);

  const totals = useMemo(() => lotStats.reduce((acc, s) => {
    acc.initialAnimals += s.initialAnimals; acc.totalDeaths += s.totalDeaths;
    acc.totalSold += s.totalSold; acc.totalActive += s.totalActive;
    acc.activeCycleCount += s.activeCycleCount; acc.totalCycles += s.totalCycles;
    return acc;
  }, { initialAnimals: 0, totalDeaths: 0, totalSold: 0, totalActive: 0, activeCycleCount: 0, totalCycles: 0 }), [lotStats]);

  function toggleLot(id: number) {
    setExpandedLots(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleGroup(id: number) {
    setExpandedGroups(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortCol(col); setSortDir('desc'); }
  }

  async function handleExcel() {
    setExporting(true);
    try {
      const XLSX = (await import('xlsx')).default ?? (await import('xlsx'));
      const wb = XLSX.utils.book_new();
      const s1 = XLSX.utils.json_to_sheet(sorted.map(s => ({
        'ID Lotto': s.lotInfo.id, 'Fornitore': s.lotInfo.supplier ?? '—',
        'N. Lotto Fornitore': s.lotInfo.supplierLotNumber ?? '—',
        'Taglia Ingresso': s.lotInfo.size?.code ?? '—',
        'Data Arrivo': s.lotInfo.arrivalDate ? formatDate(s.lotInfo.arrivalDate) : '—',
        'Stato': s.isOpen ? 'Aperto' : 'Chiuso',
        'Animali Ingresso': s.initialAnimals, 'Morti Totali': s.totalDeaths,
        'Mortalità %': +s.mortalityPct.toFixed(2),
        'Morti da Misure': s.rootCycleLosses, 'Morti Vagliatura': s.vagliaturaDeaths,
        'Morti Organiche Post-Vag.': s.childOrganicLosses,
        'Venduti': s.totalSold, 'Venduti %': +s.soldPct.toFixed(2),
        'In Produzione': s.totalActive, 'In Produzione %': +s.activePct.toFixed(2),
        'Ceste Attive': s.activeCycleCount, 'Cicli Totali': s.totalCycles,
        'Gruppi Genealogici': s.groups.length,
        'SGR Medio %/g': s.avgSGR != null ? +s.avgSGR.toFixed(4) : '',
        'Intervalli SGR': s.sgrIntervals,
        'Prima Attività': s.firstDate ? formatDate(s.firstDate) : '—',
        'Ultima Attività': s.lastDate ? formatDate(s.lastDate) : '—',
      })));
      XLSX.utils.book_append_sheet(wb, s1, 'Riepilogo Lotti');

      const cycleRows: any[] = [];
      for (const s of sorted) {
        for (const g of s.groups) {
          for (const c of (g.cycles ?? [])) {
            const ops = [...(c.operations || [])].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const pa = ops.find((op: any) => op.type === 'prima-attivazione');
            const { avgSGR: cSGR } = computeSGRForCycles([c]);
            cycleRows.push({
              'ID Lotto': s.lotInfo.id, 'Fornitore': s.lotInfo.supplier ?? '—',
              'ID Gruppo': g.lineageGroupId, 'ID Ciclo': c.id,
              'Tipo': c.parent_cycle_id ? 'Figlio' : 'Radice',
              'Cesta #': c.basket_physical_number, 'FLUPSY': c.flupsy_name ?? '—',
              'Stato': c.state === 'active' ? 'Attivo' : 'Chiuso',
              'Data Inizio': c.start_date ? formatDate(c.start_date) : '—',
              'Data Fine': c.end_date ? formatDate(c.end_date) : '—',
              'Animali In': pa?.animal_count || 0,
              'Animali Attivi': c.state === 'active' ? (c.last_animal_count || 0) : 0,
              'Ultima Taglia': c.last_size_code ?? '—',
              'Ultimo An/kg': c.last_animals_per_kg ?? '',
              'SGR %/g': cSGR != null ? +cSGR.toFixed(4) : '',
              'N. Operazioni': (c.operations || []).length,
            });
          }
        }
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cycleRows), 'Dettaglio Cicli');
      XLSX.writeFile(wb, `analisi_lotti_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e: any) { console.error(e); }
    finally { setExporting(false); }
  }

  const SortTh = ({ col, label }: { col: string; label: string }) => (
    <th onClick={() => toggleSort(col)} className="py-2 px-2 text-right text-xs font-semibold text-gray-600 cursor-pointer hover:text-amber-700 select-none whitespace-nowrap">
      {label}{sortCol === col ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
    </th>
  );

  function toggleChartLot(id: number) {
    setChartLotIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleChartMetric(key: string) {
    setChartMetrics(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }
  function getMetricValue(s: any, key: string): number {
    if (key === 'groupCount') return (s.groups ?? []).length;
    return (s as any)[key] ?? 0;
  }

  const activeLots = chartLotIds.size > 0 ? sorted.filter(s => chartLotIds.has(s.lotInfo.id)) : sorted.slice(0, 8);
  const selectedMetrics = LOT_METRICS.filter(m => chartMetrics.has(m.key));

  const barChartData = activeLots.map(s => {
    const entry: any = { name: getLotShortLabel(s.lotInfo), isOpen: s.isOpen };
    for (const m of selectedMetrics) {
      const raw = getMetricValue(s, m.key);
      if (normalize) {
        const maxV = Math.max(...activeLots.map(ss => getMetricValue(ss, m.key)), 0.0001);
        entry[m.key] = +(raw / maxV * 100).toFixed(2);
        entry[`${m.key}_raw`] = raw;
      } else {
        entry[m.key] = m.isPercent ? +raw.toFixed(2) : raw;
        entry[`${m.key}_raw`] = raw;
      }
    }
    return entry;
  });

  const radarChartData = selectedMetrics.map(m => {
    const entry: any = { metric: m.label };
    const maxV = Math.max(...activeLots.map(s => getMetricValue(s, m.key)), 0.0001);
    for (const s of activeLots) {
      const lotKey = getLotShortLabel(s.lotInfo);
      entry[lotKey] = +(getMetricValue(s, m.key) / maxV * 100).toFixed(2);
      entry[`${lotKey}_raw`] = getMetricValue(s, m.key);
    }
    return entry;
  });

  const totMortPct = totals.initialAnimals > 0 ? (totals.totalDeaths / totals.initialAnimals * 100) : 0;

  return (
    <div className="space-y-4">
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <TrendingUp className="w-5 h-5" />
            Analisi Lotti — Riepilogo Globale
            <span className="ml-auto text-sm font-normal text-amber-600">{lotStats.length} lotti · {totals.totalCycles} cicli totali</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Lotti', val: lotStats.length, sub: `${lotStats.filter(l => l.isOpen).length} aperti · ${lotStats.filter(l => !l.isOpen).length} chiusi`, color: 'amber' },
              { label: 'Animali in ingresso', val: formatNum(totals.initialAnimals), sub: null, color: 'blue' },
              { label: 'Mortalità totale', val: formatNum(totals.totalDeaths), sub: `${totMortPct.toFixed(1)}%`, color: totMortPct > 30 ? 'red' : totMortPct > 10 ? 'orange' : 'green' },
              { label: 'Venduti', val: formatNum(totals.totalSold), sub: `${totals.initialAnimals > 0 ? (totals.totalSold / totals.initialAnimals * 100).toFixed(1) : 0}%`, color: 'green' },
              { label: 'In produzione', val: formatNum(totals.totalActive), sub: `${totals.activeCycleCount} ceste attive`, color: 'emerald' },
            ].map(({ label, val, sub, color }) => (
              <div key={label} className={`bg-white rounded-lg border border-${color}-100 p-3 text-center`}>
                <div className="text-xs text-gray-500 mb-1">{label}</div>
                <div className={`text-xl font-bold text-${color}-700`}>{val}</div>
                {sub && <div className={`text-xs text-${color}-500 mt-1`}>{sub}</div>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── CONFRONTO GRAFICO ─────────────────────────────────────────────── */}
      <Card className="border-indigo-200">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => setChartOpen(o => !o)}>
          <CardTitle className="text-sm text-gray-700 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-600" />
            <span className="text-indigo-700 font-semibold">Confronto Grafico Interattivo</span>
            <span className="text-xs font-normal text-gray-400 ml-1">
              {chartOpen ? '— clicca per chiudere' : '— clicca per aprire'}
            </span>
            <span className="ml-auto text-xs font-normal text-indigo-500">
              {activeLots.length} lotti · {selectedMetrics.length} metriche
            </span>
            {chartOpen ? <ChevronDown className="w-4 h-4 text-indigo-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </CardTitle>
        </CardHeader>

        {chartOpen && (
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-3 mb-4 p-3 bg-indigo-50/40 rounded-lg border border-indigo-100">
              {/* Chart type */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 font-medium">Tipo:</span>
                {(['bar', 'radar'] as const).map(t => (
                  <button key={t} onClick={() => setChartType(t)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${chartType === t ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-indigo-50'}`}>
                    {t === 'bar' ? '📊 Barre' : '🕸 Radar'}
                  </button>
                ))}
              </div>
              {/* Normalize */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 font-medium">Scala:</span>
                <button onClick={() => setNormalize(false)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${!normalize ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-indigo-50'}`}>
                  Valori reali
                </button>
                <button onClick={() => setNormalize(true)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${normalize ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-indigo-50'}`}>
                  Normalizzato %
                </button>
              </div>
              {/* Select all lots */}
              <div className="flex items-center gap-1.5 ml-auto">
                <button onClick={() => setChartLotIds(new Set())}
                  className="px-2 py-1 rounded text-xs text-indigo-600 border border-indigo-200 hover:bg-indigo-50">
                  Top 8 lotti
                </button>
                <button onClick={() => setChartLotIds(new Set(sorted.map(s => s.lotInfo.id)))}
                  className="px-2 py-1 rounded text-xs text-indigo-600 border border-indigo-200 hover:bg-indigo-50">
                  Tutti
                </button>
                <button onClick={() => setChartMetrics(new Set(LOT_METRICS.map(m => m.key)))}
                  className="px-2 py-1 rounded text-xs text-indigo-600 border border-indigo-200 hover:bg-indigo-50">
                  Tutte le metriche
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Lot selector */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 border-b">
                  Lotti da confrontare
                  <span className="ml-1 text-gray-400">({activeLots.length} selezionati)</span>
                </div>
                <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                  {sorted.map((s, idx) => {
                    const id = s.lotInfo.id;
                    const checked = chartLotIds.size === 0 ? idx < 8 : chartLotIds.has(id);
                    const color = CHART_COLORS[sorted.indexOf(s) % CHART_COLORS.length];
                    return (
                      <label key={id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5">
                        <input type="checkbox" checked={checked}
                          onChange={() => {
                            if (chartLotIds.size === 0) {
                              const defaultSet = new Set(sorted.slice(0, 8).map(ss => ss.lotInfo.id));
                              if (checked) defaultSet.delete(id); else defaultSet.add(id);
                              setChartLotIds(defaultSet);
                            } else toggleChartLot(id);
                          }}
                          className="rounded" />
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                        <span className="text-[11px] text-gray-700 truncate flex-1">{getLotShortLabel(s.lotInfo)}</span>
                        <span className={`text-[9px] px-1 rounded ${s.isOpen ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          {s.isOpen ? '●' : '○'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Metric selector */}
              <div className="md:col-span-2 border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 border-b flex items-center justify-between">
                  <span>Metriche da visualizzare <span className="text-gray-400">({selectedMetrics.length} selezionate)</span></span>
                  <div className="flex gap-1">
                    <button onClick={() => setChartMetrics(new Set(LOT_METRICS.map(m => m.key)))}
                      className="text-[10px] text-indigo-500 hover:underline">tutte</button>
                    <span className="text-gray-300">|</span>
                    <button onClick={() => setChartMetrics(new Set())}
                      className="text-[10px] text-gray-400 hover:underline">nessuna</button>
                  </div>
                </div>
                <div className="p-2 grid grid-cols-2 md:grid-cols-3 gap-1">
                  {LOT_METRICS.map(m => (
                    <label key={m.key} className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 rounded px-1.5 py-1">
                      <input type="checkbox" checked={chartMetrics.has(m.key)}
                        onChange={() => toggleChartMetric(m.key)} className="rounded" />
                      <span className="text-[11px] text-gray-700 leading-tight">{m.label}</span>
                      {m.isPercent && <span className="text-[9px] text-blue-400">%</span>}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart */}
            {selectedMetrics.length === 0 || activeLots.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed">
                Seleziona almeno un lotto e una metrica
              </div>
            ) : chartType === 'bar' ? (
              <div>
                <div className="text-xs text-gray-500 mb-2 text-center">
                  {normalize ? 'Valori normalizzati al massimo per metrica (100% = valore più alto tra i lotti selezionati)' : 'Valori reali per lotto'}
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={barChartData} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => normalize ? `${v}%` : v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                    <Tooltip
                      formatter={(value: any, name: string) => {
                        const m = LOT_METRICS.find(mm => mm.key === name);
                        if (!m) return [value, name];
                        if (normalize) return [`${value}% (norm.)`, m.label];
                        return [m.isPercent ? `${value}%` : Number(value).toLocaleString('it-IT'), m.label];
                      }}
                      contentStyle={{ fontSize: 11 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                      formatter={(value) => LOT_METRICS.find(m => m.key === value)?.label ?? value} />
                    {selectedMetrics.map((m, idx) => (
                      <Bar key={m.key} dataKey={m.key} fill={CHART_COLORS[idx % CHART_COLORS.length]}
                        radius={[2, 2, 0, 0]} maxBarSize={40} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div>
                <div className="text-xs text-gray-500 mb-2 text-center">
                  Radar normalizzato: 100% = valore massimo tra i lotti per ogni asse
                </div>
                <ResponsiveContainer width="100%" height={380}>
                  <RadarChart data={radarChartData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} tickFormatter={v => `${v}%`} />
                    <Tooltip
                      formatter={(value: any, name: string) => {
                        const entry = radarChartData.find(d => d[name] === value);
                        const raw = entry?.[`${name}_raw`];
                        const m = LOT_METRICS.find(mm => mm.label === radarChartData[0]?.metric);
                        if (raw != null) return [`${value}% (val: ${typeof raw === 'number' && raw >= 1000 ? Number(raw).toLocaleString('it-IT') : raw})`, name];
                        return [`${value}%`, name];
                      }}
                      contentStyle={{ fontSize: 11 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {activeLots.map((s, idx) => {
                      const lotKey = getLotShortLabel(s.lotInfo);
                      return (
                        <Radar key={lotKey} name={lotKey} dataKey={lotKey}
                          stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                          fill={CHART_COLORS[idx % CHART_COLORS.length]}
                          fillOpacity={0.12} strokeWidth={2} dot={{ r: 3 }} />
                      );
                    })}
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-700 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Dettaglio per lotto
            <span className="text-xs font-normal text-gray-400 ml-1">▶ per espandere gruppi e cicli</span>
            <Button size="sm" variant="outline" className="ml-auto text-xs" onClick={handleExcel} disabled={exporting}>
              <Download className="w-3.5 h-3.5 mr-1" />{exporting ? 'Esportando...' : 'Excel'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-amber-50 border-b border-amber-100">
                  <th className="py-2 px-2 w-6"></th>
                  <th className="py-2 px-2 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:text-amber-700" onClick={() => toggleSort('arrival')}>
                    Lotto{sortCol === 'arrival' ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
                  </th>
                  <th className="py-2 px-2 text-left text-xs font-semibold text-gray-600">Fornitore</th>
                  <th className="py-2 px-2 text-left text-xs font-semibold text-gray-600">Stato</th>
                  <SortTh col="initial" label="Ingresso" />
                  <SortTh col="mortality" label="Mort.%" />
                  <th className="py-2 px-2 text-right text-xs font-semibold text-gray-600">Morti</th>
                  <th className="py-2 px-2 text-right text-xs font-semibold text-gray-600">Misure</th>
                  <th className="py-2 px-2 text-right text-xs font-semibold text-gray-600">Vagliatura</th>
                  <th className="py-2 px-2 text-right text-xs font-semibold text-gray-600">Organiche</th>
                  <th className="py-2 px-2 text-right text-xs font-semibold text-gray-600">Venduti</th>
                  <SortTh col="active" label="Attivi" />
                  <th className="py-2 px-2 text-right text-xs font-semibold text-gray-600">Ceste/Cicli</th>
                  <SortTh col="sgr" label="SGR %/g" />
                  <th className="py-2 px-2 text-left text-xs font-semibold text-gray-600">Periodo</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, i) => {
                  const lotId = s.lotInfo.id;
                  const exp = expandedLots.has(lotId);
                  const mc = s.mortalityPct > 30 ? 'text-red-600 font-bold' : s.mortalityPct > 10 ? 'text-orange-500 font-semibold' : 'text-gray-700';
                  return (
                    <> 
                      <tr key={`lot-${lotId}`}
                        className={`border-b cursor-pointer ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-amber-50/60 transition-colors`}
                        onClick={() => toggleLot(lotId)}
                      >
                        <td className="py-2 px-2 text-center">
                          {exp ? <ChevronDown className="w-3.5 h-3.5 text-amber-600 mx-auto" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400 mx-auto" />}
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-gray-400 font-mono">#{lotId}</span>
                            {s.lotInfo.size?.code && <span className="text-[10px] text-blue-600 font-medium px-1 bg-blue-50 rounded">{s.lotInfo.size.code}</span>}
                          </div>
                          {s.lotInfo.supplierLotNumber && <div className="text-[10px] text-gray-400">{s.lotInfo.supplierLotNumber}</div>}
                        </td>
                        <td className="py-2 px-2 font-medium text-gray-800 max-w-[120px] truncate">{s.lotInfo.supplier ?? '—'}</td>
                        <td className="py-2 px-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${s.isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {s.isOpen ? '● Aperto' : '○ Chiuso'}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right font-medium">{formatNum(s.initialAnimals)}</td>
                        <td className={`py-2 px-2 text-right ${mc}`}>{s.mortalityPct.toFixed(1)}%</td>
                        <td className="py-2 px-2 text-right text-red-500">{formatNum(s.totalDeaths)}</td>
                        <td className="py-2 px-2 text-right text-red-400">{formatNum(s.rootCycleLosses)}</td>
                        <td className="py-2 px-2 text-right text-orange-400">{formatNum(s.vagliaturaDeaths)}</td>
                        <td className="py-2 px-2 text-right text-amber-500">{formatNum(s.childOrganicLosses)}</td>
                        <td className="py-2 px-2 text-right text-green-600">{formatNum(s.totalSold)}</td>
                        <td className="py-2 px-2 text-right font-semibold text-emerald-700">{formatNum(s.totalActive)}</td>
                        <td className="py-2 px-2 text-right text-gray-500">{s.activeCycleCount}/{s.totalCycles}</td>
                        <td className="py-2 px-2 text-right">
                          {s.avgSGR != null ? <span className="text-indigo-700 font-medium">{s.avgSGR.toFixed(3)}</span> : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-2 px-2 text-gray-400 text-[10px] whitespace-nowrap">
                          {s.firstDate ? formatDate(s.firstDate) : '—'}{s.lastDate && s.lastDate !== s.firstDate ? ` → ${formatDate(s.lastDate)}` : ''}
                        </td>
                      </tr>
                      {exp && (
                        <tr key={`lot-${lotId}-bk`} className="bg-amber-50/30 border-b">
                          <td colSpan={15} className="px-10 py-1">
                            <span className="text-[11px] text-gray-500">
                              <span className="font-semibold text-gray-700">Breakdown mortalità: </span>
                              {formatNum(s.rootCycleLosses)} da misure ({s.initialAnimals > 0 ? (s.rootCycleLosses / s.initialAnimals * 100).toFixed(1) : 0}%)
                              {s.vagliaturaDeaths > 0 && <> · {formatNum(s.vagliaturaDeaths)} vagliatura ({s.initialAnimals > 0 ? (s.vagliaturaDeaths / s.initialAnimals * 100).toFixed(1) : 0}%)</>}
                              {s.childOrganicLosses > 0 && <> · {formatNum(s.childOrganicLosses)} organiche post-vag. ({s.initialAnimals > 0 ? (s.childOrganicLosses / s.initialAnimals * 100).toFixed(1) : 0}%)</>}
                              {s.sgrIntervals > 0 && <> · SGR su {s.sgrIntervals} intervalli di crescita</>}
                            </span>
                          </td>
                        </tr>
                      )}
                      {exp && s.groups.map((g: any) => {
                        const gs = computeGroupStats(g);
                        const gm = gs.initialAnimals > 0 ? (gs.totalDeaths / gs.initialAnimals * 100) : 0;
                        const { avgSGR: gSGR } = computeSGRForCycles(g.cycles ?? []);
                        const gExp = expandedGroups.has(g.lineageGroupId);
                        const rootC = g.rootCycle ?? (g.cycles ?? []).find((c: any) => !c.parent_cycle_id);
                        return (
                          <>
                            <tr key={`g-${g.lineageGroupId}`}
                              className="bg-blue-50/40 border-b cursor-pointer hover:bg-blue-50 transition-colors"
                              onClick={(e) => { e.stopPropagation(); toggleGroup(g.lineageGroupId); }}
                            >
                              <td className="py-1.5 px-2 pl-6 text-center">
                                {gExp ? <ChevronDown className="w-3 h-3 text-blue-500 mx-auto" /> : <ChevronRight className="w-3 h-3 text-gray-400 mx-auto" />}
                              </td>
                              <td className="py-1.5 px-2 font-mono text-[10px] text-blue-500">
                                Gruppo #{g.lineageGroupId}
                                {rootC && <span className="text-gray-400 font-sans ml-1">· C#{rootC.basket_physical_number}</span>}
                              </td>
                              <td className="py-1.5 px-2 text-[11px] text-gray-600 max-w-[120px] truncate">{rootC?.flupsy_name ?? '—'}</td>
                              <td className="py-1.5 px-2">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${gs.activeCycleCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                  {gs.activeCycleCount > 0 ? '● Aperto' : '○ Chiuso'}
                                </span>
                              </td>
                              <td className="py-1.5 px-2 text-right text-[11px]">{formatNum(gs.initialAnimals)}</td>
                              <td className={`py-1.5 px-2 text-right text-[11px] ${gm > 30 ? 'text-red-500' : gm > 10 ? 'text-orange-400' : 'text-gray-600'}`}>{gm.toFixed(1)}%</td>
                              <td className="py-1.5 px-2 text-right text-[11px] text-red-400">{formatNum(gs.totalDeaths)}</td>
                              <td className="py-1.5 px-2 text-right text-[11px] text-red-300">{formatNum(gs.rootCycleLosses)}</td>
                              <td className="py-1.5 px-2 text-right text-[11px] text-orange-300">{formatNum(gs.vagliaturaDeaths)}</td>
                              <td className="py-1.5 px-2 text-right text-[11px] text-amber-400">{formatNum(gs.childOrganicLosses)}</td>
                              <td className="py-1.5 px-2 text-right text-[11px] text-green-500">{formatNum(gs.totalSold)}</td>
                              <td className="py-1.5 px-2 text-right text-[11px] font-medium text-emerald-600">{formatNum(gs.totalActive)}</td>
                              <td className="py-1.5 px-2 text-right text-[11px] text-gray-400">{gs.activeCycleCount}/{gs.totalCycles}</td>
                              <td className="py-1.5 px-2 text-right text-[11px]">
                                {gSGR != null ? <span className="text-indigo-500">{gSGR.toFixed(3)}</span> : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="py-1.5 px-2 text-[10px] text-gray-400">{gs.firstDate ? formatDate(gs.firstDate) : '—'}</td>
                            </tr>
                            {gExp && (g.cycles ?? []).map((c: any) => {
                              const ops = [...(c.operations || [])].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
                              const pa = ops.find((op: any) => op.type === 'prima-attivazione');
                              const { avgSGR: cSGR } = computeSGRForCycles([c]);
                              return (
                                <tr key={`c-${c.id}`} className="bg-indigo-50/20 border-b">
                                  <td></td>
                                  <td className="py-1 px-2 pl-10 font-mono text-[10px] text-indigo-500">
                                    Ciclo #{c.id}
                                    {c.parent_cycle_id && <span className="text-[9px] text-gray-400 font-sans"> ← #{c.parent_cycle_id}</span>}
                                  </td>
                                  <td className="py-1 px-2 text-[10px] text-gray-500">C#{c.basket_physical_number} {c.flupsy_name ?? '—'}</td>
                                  <td className="py-1 px-2">
                                    <span className={`px-1 text-[9px] rounded font-medium ${c.state === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                      {c.state === 'active' ? 'Attivo' : 'Chiuso'}
                                    </span>
                                  </td>
                                  <td className="py-1 px-2 text-right text-[10px]">{formatNum(pa?.animal_count)}</td>
                                  <td colSpan={7}></td>
                                  <td className="py-1 px-2 text-right text-[10px] text-emerald-600">{c.state === 'active' ? formatNum(c.last_animal_count) : '—'}</td>
                                  <td className="py-1 px-2 text-right text-[10px] text-gray-400">{(c.operations || []).length} op.</td>
                                  <td className="py-1 px-2 text-right text-[10px]">
                                    {cSGR != null ? <span className="text-indigo-400">{cSGR.toFixed(3)}</span> : <span className="text-gray-300">—</span>}
                                  </td>
                                  <td className="py-1 px-2 text-[10px] text-gray-400">
                                    {c.start_date ? formatDate(c.start_date) : '—'}{c.end_date ? ` → ${formatDate(c.end_date)}` : ' → in corso'}
                                  </td>
                                </tr>
                              );
                            })}
                          </>
                        );
                      })}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LineageAnimali() {
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState('');
  const [searchMode, setSearchMode] = useState<'lot' | 'cycle' | 'plant' | 'lots-analysis'>('lot');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [exporting, setExporting] = useState(false);

  const { data: lotsData } = useQuery<any[]>({ queryKey: ['/api/lots?includeAll=true'] });
  const { data: cyclesData } = useQuery<any>({ queryKey: ['/api/cycles?includeAll=true'], staleTime: 30000 });

  const allLots = useMemo(() => {
    if (!lotsData) return [];
    return (lotsData as any[]).sort((a, b) => {
      const da = new Date(b.arrivalDate ?? 0).getTime();
      const db2 = new Date(a.arrivalDate ?? 0).getTime();
      return da - db2;
    });
  }, [lotsData]);

  function lotLabel(lot: any) {
    const parts = [lot.supplier, lot.supplierLotNumber].filter(Boolean);
    return parts.join(' — ') || `Lotto #${lot.id}`;
  }

  const filteredLots = useMemo(() => {
    if (searchMode !== 'lot' || !searchInput || searchInput.length < 1) return [];
    const q = searchInput.trim();

    // Ricerca per ID lotto (solo numeri): corrispondenza esatta sempre in cima, poi prefisso
    if (/^\d+$/.test(q)) {
      const exact = allLots.filter(l => String(l.id) === q);
      const prefix = allLots.filter(l => String(l.id) !== q && String(l.id).startsWith(q));
      return [...exact, ...prefix].slice(0, 15);
    }

    // Ricerca testuale: corrispondenza solo all'inizio del testo o di una parola
    // (evita di trovare "3" dentro "0.35" o "T0.3")
    const ql = q.toLowerCase();
    const matchesWord = (text: string) => {
      const t = text.toLowerCase();
      return t.startsWith(ql) || t.includes(' ' + ql);
    };
    return allLots.filter(l =>
      matchesWord(l.supplier ?? '') ||
      matchesWord(l.supplierLotNumber ?? '')
    ).slice(0, 12);
  }, [searchInput, allLots, searchMode]);

  const allCyclesList = useMemo(() => {
    if (!cyclesData) return [];
    const arr = Array.isArray(cyclesData) ? cyclesData : (cyclesData.cycles ?? []);
    return arr.sort((a: any, b: any) => b.id - a.id);
  }, [cyclesData]);

  const filteredCycles = useMemo(() => {
    if (searchMode !== 'cycle' || !searchInput || searchInput.length < 1) return [];
    const q = searchInput.trim();
    if (!/^\d+$/.test(q)) return [];
    const exact = allCyclesList.filter((c: any) => String(c.id) === q);
    const prefix = allCyclesList.filter((c: any) => String(c.id) !== q && String(c.id).startsWith(q));
    return [...exact, ...prefix].slice(0, 15);
  }, [searchInput, allCyclesList, searchMode]);

  function addLot(lot: any) {
    const id = lot.id;
    if (!selectedItems.some(s => s.type === 'lot' && s.lotId === id)) {
      setSelectedItems(prev => [...prev, { type: 'lot', lotId: id, label: lotLabel(lot) }]);
    }
    setSearchInput('');
  }

  function addCycle(cycleId: number) {
    if (!selectedItems.some(s => s.type === 'cycle' && s.cycleId === cycleId)) {
      setSelectedItems(prev => [...prev, { type: 'cycle', cycleId }]);
    }
    setSearchInput('');
  }

  function removeItem(item: SelectedItem) {
    setSelectedItems(prev => prev.filter(s => {
      if (s.type !== item.type) return true;
      if (s.type === 'lot' && item.type === 'lot') return s.lotId !== item.lotId;
      if (s.type === 'cycle' && item.type === 'cycle') return s.cycleId !== item.cycleId;
      return true;
    }));
  }

  const lotIds = selectedItems.filter(s => s.type === 'lot').map(s => (s as any).lotId);
  const cycleIds = selectedItems.filter(s => s.type === 'cycle').map(s => (s as any).cycleId);

  const queryEnabled = selectedItems.length > 0;
  const queryParams = [
    lotIds.length > 0 ? `lotIds=${lotIds.join(',')}` : '',
    cycleIds.length > 0 ? `cycleIds=${cycleIds.join(',')}` : '',
  ].filter(Boolean).join('&');
  const queryUrl = `/api/lineage?${queryParams}`;

  const { data, isLoading, error } = useQuery<any>({
    queryKey: ['/api/lineage', queryParams],
    queryFn: () => fetch(queryUrl).then(r => r.json()),
    enabled: queryEnabled,
  });

  const { data: plantData, isLoading: plantLoading } = useQuery<any>({
    queryKey: ['/api/lineage/all'],
    queryFn: () => fetch('/api/lineage/all').then(r => r.json()),
    enabled: searchMode === 'plant' || searchMode === 'lots-analysis',
    staleTime: 60000,
  });

  async function handleExport() {
    if (!queryEnabled) return;
    setExporting(true);
    try {
      const resp = await fetch(`/api/lineage/export?${queryParams}`);
      if (!resp.ok) throw new Error('Export fallito');
      const blob = await resp.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `storia_animali_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
    } catch (e: any) {
      toast({ title: 'Errore export', description: e.message, variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key !== 'Enter') return;
    const num = parseInt(searchInput);
    if (!num) return;
    if (searchMode === 'cycle') addCycle(num);
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-emerald-600" />
            Storia Animali
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Segui gli animali dalla semina alla vendita — cerca per lotto o per ciclo
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={!queryEnabled || exporting || isLoading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          {exporting ? 'Esportando...' : 'Esporta Excel'}
        </Button>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3">

            {/* Mode toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => { setSearchMode('lot'); setSearchInput(''); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  searchMode === 'lot'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                Cerca per lotto
              </button>
              <button
                onClick={() => { setSearchMode('cycle'); setSearchInput(''); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  searchMode === 'cycle'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Hash className="w-3.5 h-3.5" />
                Cerca per ciclo #
              </button>
              <button
                onClick={() => { setSearchMode('plant'); setSearchInput(''); setSelectedItems([]); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  searchMode === 'plant'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Situazione Impianto
              </button>
              <button
                onClick={() => { setSearchMode('lots-analysis'); setSearchInput(''); setSelectedItems([]); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  searchMode === 'lots-analysis'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Analisi Lotti
              </button>
            </div>

            {/* Spiegazione contestuale */}
            <p className="text-xs text-gray-400 italic -mt-1">
              {searchMode === 'lot'
                ? 'Seleziona il lotto di origine degli animali → vedrai tutti i cicli di quella partita, dalle ceste iniziali fino alla destinazione finale.'
                : searchMode === 'cycle'
                ? 'Inserisci il numero di un ciclo specifico → vedrai quel ramo genealogico con tutta la sua discendenza.'
                : searchMode === 'plant'
                ? 'Visione globale di tutti i gruppi genealogici in impianto — mortalità, vendite e produzione aggregati in tempo reale.'
                : 'Tabella completa per lotto: mortalità%, breakdown, SGR medio, espandibile per gruppo genealogico e singolo ciclo. Esporta in Excel.'}
            </p>

            {searchMode !== 'plant' && searchMode !== 'lots-analysis' && (
            <div className="relative">
              {searchMode === 'lot'
                ? <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                : <Hash className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              }
              <Input
                className="pl-9"
                placeholder={searchMode === 'lot'
                  ? 'Fornitore (es. Ca Pisani, Ecotapes) oppure ID lotto (es. 11, 5)...'
                  : 'Numero ciclo (es. 92, 197)...'}
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />

              {/* Dropdown lotti */}
              {filteredLots.length > 0 && searchMode === 'lot' && (
                <div className="absolute z-50 top-full left-0 right-0 bg-white border rounded-b-lg shadow-lg max-h-64 overflow-y-auto">
                  {filteredLots.map(lot => (
                    <div
                      key={lot.id}
                      className="px-4 py-2.5 hover:bg-emerald-50 cursor-pointer border-b last:border-0 flex items-center gap-2"
                      onClick={() => addLot(lot)}
                    >
                      <span className="text-[10px] text-gray-400 font-mono w-8 shrink-0">#{lot.id}</span>
                      <Package className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-sm">{lot.supplier ?? '—'}</span>
                      {lot.supplierLotNumber && (
                        <span className="text-gray-500 text-xs shrink-0">· {lot.supplierLotNumber}</span>
                      )}
                      {lot.size?.code && (
                        <span className="text-xs text-blue-600 font-medium shrink-0">{lot.size.code}</span>
                      )}
                      {lot.animalCount != null && (
                        <span className="text-xs text-gray-400 shrink-0">{Number(lot.animalCount).toLocaleString('it-IT')} an.</span>
                      )}
                      <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                        lot.state === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {lot.state === 'active' ? 'Attivo' : 'Archiviato'}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">{formatDate(lot.arrivalDate)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Dropdown ciclo */}
              {searchMode === 'cycle' && searchInput.length > 0 && parseInt(searchInput) > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 bg-white border rounded-b-lg shadow-lg max-h-64 overflow-y-auto">
                  {filteredCycles.length > 0 ? (
                    filteredCycles.map((c: any) => (
                      <div
                        key={c.id}
                        className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer border-b last:border-0 flex items-center gap-2"
                        onClick={() => addCycle(c.id)}
                      >
                        <span className="text-[10px] text-gray-400 font-mono w-8 shrink-0">#{c.id}</span>
                        <Hash className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="text-sm font-medium">Cesta #{c.basketPhysicalNumber}</span>
                        {c.flupsyName && (
                          <span className="text-xs text-gray-500 truncate">· {c.flupsyName}</span>
                        )}
                        <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                          c.state === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {c.state === 'active' ? 'Attivo' : 'Chiuso'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div
                      className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer flex items-center gap-2"
                      onClick={() => { const n = parseInt(searchInput); if (n) addCycle(n); }}
                    >
                      <Hash className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Segui ciclo <strong>#{searchInput}</strong> e tutta la sua discendenza</span>
                      <span className="text-xs text-gray-400 ml-auto">↵ Invio</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            )}

            {/* Chips selezionati */}
            {searchMode !== 'plant' && selectedItems.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedItems.map((item, i) => (
                  <Badge key={i} className={`flex items-center gap-1.5 px-2.5 py-1 text-sm font-normal ${
                    item.type === 'lot' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {item.type === 'lot'
                      ? <><Package className="w-3 h-3" />{(item as any).label}</>
                      : <><Hash className="w-3 h-3" />Ciclo #{(item as any).cycleId}</>
                    }
                    <button onClick={() => removeItem(item)} className="ml-0.5 hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                <button
                  onClick={() => setSelectedItems([])}
                  className="text-xs text-red-500 hover:underline self-center"
                >
                  Cancella tutto
                </button>
              </div>
            )}

            {searchMode !== 'plant' && !queryEnabled && (
              <p className="text-sm text-gray-400 italic">
                Seleziona un lotto per vedere la storia completa di quella partita di animali, oppure cerca un ciclo specifico.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risultati */}
      {((searchMode !== 'plant' && searchMode !== 'lots-analysis' && isLoading) || ((searchMode === 'plant' || searchMode === 'lots-analysis') && plantLoading)) && (
        <div className="text-center py-12 text-gray-400">
          <GitBranch className="w-10 h-10 mx-auto mb-3 animate-pulse" />
          <p>{(searchMode === 'plant' || searchMode === 'lots-analysis') ? 'Caricamento dati...' : 'Caricamento genealogia animali...'}</p>
        </div>
      )}

      {searchMode !== 'plant' && searchMode !== 'lots-analysis' && error && (
        <div className="text-center py-8 text-red-500">
          Errore nel caricamento dei dati.
        </div>
      )}

      {searchMode !== 'plant' && searchMode !== 'lots-analysis' && data?.groups?.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-400">
          Nessun dato genealogico trovato.
        </div>
      )}

      {searchMode !== 'plant' && searchMode !== 'lots-analysis' && lotIds.length > 0 && data?.groups?.length > 0 && (
        <LotSummary groups={data.groups} selectedItems={selectedItems} />
      )}

      {searchMode !== 'plant' && searchMode !== 'lots-analysis' && data?.groups?.map((group: any) => (
        <LineageGroup key={group.lineageGroupId} group={group} />
      ))}

      {/* Modalità Situazione Impianto */}
      {searchMode === 'plant' && !plantLoading && plantData?.groups && (
        <PlantSummary groups={plantData.groups} />
      )}

      {/* Modalità Analisi Lotti */}
      {searchMode === 'lots-analysis' && !plantLoading && plantData?.groups && (
        <LotAnalysis allGroups={plantData.groups} allLots={allLots} />
      )}
    </div>
  );
}
