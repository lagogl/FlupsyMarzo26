import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, X, Search, ChevronDown, ChevronRight, GitBranch, Layers, Hash, Package, BookOpen, TrendingUp, AlertTriangle, ShoppingCart, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  // - Cicli figli (prima-attivazione da vagliatura): dead_count assoluto (conteggio fisico)
  const rootCycleLosses = rootCycles.reduce((sum: number, c: any) => {
    const ops = [...(c.operations || [])].sort((a: any, b: any) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    if (ops.length < 1) return sum;
    const first = ops[0].animal_count || 0;
    const last = ops[ops.length - 1].animal_count || 0;
    return sum + Math.max(0, first - last);
  }, 0);

  const childCycles = cycles.filter((c: any) => c.parent_cycle_id !== null);
  const vagliaturaDeaths = childCycles.reduce((sum: number, c: any) => {
    const fa = (c.operations || []).find((op: any) => op.type === 'prima-attivazione');
    return sum + (fa?.dead_count || 0);
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
      const children = cycles.filter(ch => ch.parent_cycle_id === c.id);
      const childDeaths = children.reduce((sum: number, ch: any) => {
        const fa = (ch.operations || []).find((o: any) => o.type === 'prima-attivazione');
        return sum + (fa?.dead_count || 0);
      }, 0);
      const childAnimals = children.reduce((sum: number, ch: any) => {
        const fa = (ch.operations || []).find((o: any) => o.type === 'prima-attivazione');
        return sum + (fa?.animal_count || 0);
      }, 0);
      const sizes = [...new Set(children.map((ch: any) => {
        const fa = (ch.operations || []).find((o: any) => o.type === 'prima-attivazione');
        return fa?.size_code;
      }).filter(Boolean))] as string[];
      return { parentId: c.id, date: op?.date, childCount: children.length, childDeaths, childAnimals, sizes };
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
            {v.childDeaths > 0 && (
              <span className="text-red-600">
                {' '}Morti durante vagliatura: <strong>{formatNum(v.childDeaths)}</strong>
                {v.childAnimals > 0
                  ? ` (${(v.childDeaths / (v.childAnimals + v.childDeaths) * 100).toFixed(2)}%)`
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
              (in produzione: {formatNum(rootCycleLosses)} per proiezione campioni{initialAnimals > 0 ? ` = ${(rootCycleLosses / initialAnimals * 100).toFixed(2)}%` : ''}
              {' '}· alla vagliatura: {formatNum(vagliaturaDeaths)} fisici{initialAnimals > 0 ? ` = ${(vagliaturaDeaths / initialAnimals * 100).toFixed(2)}%` : ''})
            </span>
          )}
          {rootCycleLosses > 0 && vagliaturaDeaths === 0 && (
            <span className="text-gray-500 text-xs ml-1">(per proiezione campioni di misura)</span>
          )}
          {vagliaturaDeaths > 0 && rootCycleLosses === 0 && (
            <span className="text-gray-500 text-xs ml-1">(conteggio fisico alla vagliatura)</span>
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

export default function LineageAnimali() {
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState('');
  const [searchMode, setSearchMode] = useState<'lot' | 'cycle'>('lot');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [exporting, setExporting] = useState(false);

  const { data: lotsData } = useQuery<any[]>({ queryKey: ['/api/lots?includeAll=true'] });

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

    // Ricerca per ID lotto (solo numeri): corrispondenza esatta o prefisso
    if (/^\d+$/.test(q)) {
      return allLots.filter(l => String(l.id) === q || String(l.id).startsWith(q)).slice(0, 12);
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
            </div>

            {/* Spiegazione contestuale */}
            <p className="text-xs text-gray-400 italic -mt-1">
              {searchMode === 'lot'
                ? 'Seleziona il lotto di origine degli animali → vedrai tutti i cicli di quella partita, dalle ceste iniziali fino alla destinazione finale.'
                : 'Inserisci il numero di un ciclo specifico → vedrai quel ramo genealogico con tutta la sua discendenza.'}
            </p>

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
                      className="px-4 py-2.5 hover:bg-emerald-50 cursor-pointer border-b last:border-0"
                      onClick={() => addLot(lot)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 font-mono">#{lot.id}</span>
                          <Package className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span className="font-semibold text-sm">{lot.supplier ?? '—'}</span>
                          {lot.supplierLotNumber && (
                            <span className="text-gray-500 text-xs">· {lot.supplierLotNumber}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-[10px] ${lot.state === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {lot.state === 'active' ? 'Attivo' : 'Archiviato'}
                          </Badge>
                          <span className="text-xs text-gray-400">{formatDate(lot.arrivalDate)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Dropdown ciclo */}
              {searchMode === 'cycle' && searchInput.length > 0 && parseInt(searchInput) > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 bg-white border rounded-b-lg shadow-lg">
                  <div
                    className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer flex items-center gap-2"
                    onClick={() => { const n = parseInt(searchInput); if (n) addCycle(n); }}
                  >
                    <Hash className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Segui ciclo <strong>#{searchInput}</strong> e tutta la sua discendenza</span>
                    <span className="text-xs text-gray-400 ml-auto">↵ Invio</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chips selezionati */}
            {selectedItems.length > 0 && (
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

            {!queryEnabled && (
              <p className="text-sm text-gray-400 italic">
                Seleziona un lotto per vedere la storia completa di quella partita di animali, oppure cerca un ciclo specifico.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risultati */}
      {isLoading && (
        <div className="text-center py-12 text-gray-400">
          <GitBranch className="w-10 h-10 mx-auto mb-3 animate-pulse" />
          <p>Caricamento genealogia animali...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-red-500">
          Errore nel caricamento dei dati.
        </div>
      )}

      {data?.groups?.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-400">
          Nessun dato genealogico trovato.
        </div>
      )}

      {data?.groups?.map((group: any) => (
        <LineageGroup key={group.lineageGroupId} group={group} />
      ))}
    </div>
  );
}
