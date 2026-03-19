import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, GitBranch, Package2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const SGR_OP_TYPES = new Set(['prima-attivazione', 'misura', 'chiusura-ciclo-vagliatura', 'chiusura-ciclo']);

function sgrColor(v: number | null) {
  if (v === null) return "text-gray-400";
  if (v > 3) return "text-green-700 font-bold";
  if (v > 0) return "text-green-600";
  if (v === 0) return "text-gray-500";
  return "text-red-600";
}

function qualityBadge(qc: string | null) {
  if (qc === 'premium') return <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">TESTE</span>;
  if (qc === 'normal')  return <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">MEDI</span>;
  if (qc === 'sub')     return <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">CODE</span>;
  return <span className="text-gray-400 text-xs">-</span>;
}

function stateBadge(s: string) {
  if (s === 'active') return <span className="px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700 border border-green-200">attivo</span>;
  return <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500 border border-gray-200">chiuso</span>;
}

function fmtDate(d: string | null) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('it-IT');
}

function fmtApk(v: number | null) {
  if (!v || v === 0) return '-';
  return v.toLocaleString('it-IT');
}

export default function SgrLineage() {
  const [selectedLot, setSelectedLot] = useState<string>('all');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [expandedLots, setExpandedLots] = useState<Set<number>>(new Set());
  const [sortCol, setSortCol] = useState<string>('sgr');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const { data: cyclesResp, isLoading: cyclesLoading } = useQuery<any>({
    queryKey: ['/api/cycles', 'sgr-lineage-all'],
    queryFn: () => fetch('/api/cycles?includeAll=true').then(r => r.json()),
  });
  const { data: opsResp, isLoading: opsLoading } = useQuery<any>({
    queryKey: ['/api/operations', 'sgr-lineage-all'],
    queryFn: () => fetch('/api/operations?pageSize=9999').then(r => r.json()),
  });

  const isLoading = cyclesLoading || opsLoading;

  const { rows, lots, sites } = useMemo(() => {
    const emptyr = { rows: [], lots: [], sites: [] };
    if (!cyclesResp || !opsResp) return emptyr;

    const cycles: any[] = cyclesResp?.cycles || cyclesResp || [];
    const allOps: any[] = opsResp?.operations || opsResp || [];

    // Filter ops to SGR-relevant types with valid animalsPerKg
    const opsByCycle: Record<number, any[]> = {};
    for (const op of allOps) {
      if (!SGR_OP_TYPES.has(op.type) || !(op.animalsPerKg > 0)) continue;
      if (!opsByCycle[op.cycleId]) opsByCycle[op.cycleId] = [];
      opsByCycle[op.cycleId].push(op);
    }
    for (const cid of Object.keys(opsByCycle)) {
      opsByCycle[+cid].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    // Group cycles by lineage_group_id (null → each cycle is its own group)
    const groups: Record<string, any[]> = {};
    for (const c of cycles) {
      const key = c.lineageGroupId != null ? `lg_${c.lineageGroupId}` : `solo_${c.id}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    }

    const rows: any[] = [];

    for (const [, groupCycles] of Object.entries(groups)) {
      const cycleIds = new Set(groupCycles.map((c: any) => c.id));

      // Root = no parentCycleId, or parentCycleId not in this group
      const rootCycles = groupCycles.filter((c: any) => !c.parentCycleId || !cycleIds.has(c.parentCycleId));
      // Leaves = not referenced as parent by anyone in the group
      const parentIds = new Set(groupCycles.filter((c: any) => c.parentCycleId).map((c: any) => c.parentCycleId));
      const leafCycles = groupCycles.filter((c: any) => !parentIds.has(c.id));

      if (rootCycles.length === 0 || leafCycles.length === 0) continue;

      // Root earliest prima-attivazione
      const rootOpsAll = rootCycles.flatMap((rc: any) => opsByCycle[rc.id] || []);
      if (rootOpsAll.length === 0) continue;
      const rootOpsFirst = rootOpsAll.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const rootFirstOp = rootOpsFirst[0];

      const rootApk  = rootFirstOp.animalsPerKg;
      const rootDate = rootFirstOp.date;
      const rootCycle = rootCycles[0];

      // Chain depth for each leaf
      const getDepth = (leaf: any): number => {
        let d = 1, cur = leaf;
        while (cur?.parentCycleId) {
          cur = groupCycles.find((c: any) => c.id === cur.parentCycleId);
          if (!cur) break;
          d++;
        }
        return d;
      };

      for (const leaf of leafCycles) {
        const leafOps = opsByCycle[leaf.id] || [];
        if (leafOps.length === 0) continue;

        const leafLastOp = leafOps[leafOps.length - 1];
        const leafApk  = leafLastOp.animalsPerKg;
        const leafDate = leafLastOp.date;

        const totalDays = Math.max(1, Math.round(
          (new Date(leafDate).getTime() - new Date(rootDate).getTime()) / (1000 * 60 * 60 * 24)
        ));

        const sgr = rootApk > 0 && leafApk > 0
          ? rootApk !== leafApk ? (Math.log(rootApk / leafApk) / totalDays) * 100 : 0
          : null;

        const isSolo = groupCycles.length === 1;
        const depth  = isSolo ? 1 : getDepth(leaf);

        rows.push({
          lotId:           rootCycle.lotId,
          lotSupplier:     rootCycle.lotSupplier || '-',
          lotArrivalDate:  rootCycle.lotArrivalDate || null,
          lineageGroupId:  rootCycle.lineageGroupId,
          rootCycleId:     rootCycle.id,
          rootBasketNum:   rootCycle.basketPhysicalNumber,
          rootFlupsyName:  rootCycle.flupsyName || '-',
          leafCycleId:     leaf.id,
          leafBasketNum:   leaf.basketPhysicalNumber,
          leafFlupsyName:  leaf.flupsyName || '-',
          leafFlupsyLoc:   leaf.flupsyLocation || '-',
          leafState:       leaf.state,
          qualityClass:    leaf.qualityClass,
          rootDate,
          leafDate,
          totalDays,
          rootApk,
          leafApk,
          sgr: sgr !== null ? Math.round(sgr * 100) / 100 : null,
          depth,
          isSolo,
        });
      }
    }

    // Filter options
    const lotSet   = new Map<number, string>();
    const siteSet  = new Set<string>();
    for (const r of rows) {
      lotSet.set(r.lotId, r.lotSupplier);
      if (r.leafFlupsyLoc) siteSet.add(r.leafFlupsyLoc);
    }

    return {
      rows,
      lots: Array.from(lotSet.entries()).map(([id, sup]) => ({ id, supplier: sup })).sort((a, b) => a.supplier.localeCompare(b.supplier)),
      sites: Array.from(siteSet).sort(),
    };
  }, [cyclesResp, opsResp]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let r = rows;
    if (selectedLot  !== 'all') r = r.filter(x => x.lotId === parseInt(selectedLot));
    if (selectedSite !== 'all') r = r.filter(x => x.leafFlupsyLoc === selectedSite);
    return [...r].sort((a, b) => {
      let va: any = a[sortCol] ?? (sortDir === 'desc' ? -Infinity : Infinity);
      let vb: any = b[sortCol] ?? (sortDir === 'desc' ? -Infinity : Infinity);
      return sortDir === 'desc' ? vb - va : va - vb;
    });
  }, [rows, selectedLot, selectedSite, sortCol, sortDir]);

  // Group by lot for display
  const byLot = useMemo(() => {
    const m = new Map<number, any[]>();
    for (const r of filtered) {
      if (!m.has(r.lotId)) m.set(r.lotId, []);
      m.get(r.lotId)!.push(r);
    }
    return Array.from(m.entries()).map(([lotId, chains]) => {
      const validSgrs = chains.map((c: any) => c.sgr).filter((v: any): v is number => v !== null);
      const avgSgr = validSgrs.length ? validSgrs.reduce((a: number, b: number) => a + b, 0) / validSgrs.length : null;
      return { lotId, supplier: chains[0].lotSupplier, arrivalDate: chains[0].lotArrivalDate, chains, avgSgr };
    }).sort((a, b) => (b.avgSgr ?? -999) - (a.avgSgr ?? -999));
  }, [filtered]);

  // Global stats
  const allSgrs   = filtered.map(r => r.sgr).filter((v): v is number => v !== null);
  const globalAvg = allSgrs.length ? allSgrs.reduce((a, b) => a + b, 0) / allSgrs.length : null;
  const globalMax = allSgrs.length ? Math.max(...allSgrs) : null;
  const globalMin = allSgrs.length ? Math.min(...allSgrs) : null;

  function toggleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortCol(col); setSortDir('desc'); }
  }

  function toggleLot(lotId: number) {
    setExpandedLots(prev => {
      const next = new Set(prev);
      if (next.has(lotId)) next.delete(lotId);
      else next.add(lotId);
      return next;
    });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <PageHeader title="SGR per Lotto" subtitle="Calcolo SGR lungo tutta la catena genealogica" />
        <div className="flex items-center justify-center h-48 text-gray-500">Caricamento dati in corso...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <PageHeader title="SGR per Lotto" subtitle="SGR calcolato dall'inizio del lotto attraverso tutta la catena padre → figli" />

      {/* Filtri */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600">Lotto</label>
          <select value={selectedLot} onChange={e => setSelectedLot(e.target.value)}
            className="h-8 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400">
            <option value="all">Tutti i lotti</option>
            {lots.map(l => <option key={l.id} value={l.id}>{l.supplier} (#{l.id})</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600">Sito</label>
          <select value={selectedSite} onChange={e => setSelectedSite(e.target.value)}
            className="h-8 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400">
            <option value="all">Tutti i siti</option>
            {sites.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="ml-auto text-xs text-gray-400 self-center">
          {filtered.length} catene · {byLot.length} lotti
        </div>
      </div>

      {/* Statistiche globali */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'SGR Medio',       value: globalAvg !== null ? `${globalAvg.toFixed(2)} %/g` : '—', cls: 'text-blue-700' },
          { label: 'SGR Massimo',     value: globalMax !== null ? `${globalMax.toFixed(2)} %/g` : '—', cls: 'text-green-700' },
          { label: 'SGR Minimo',      value: globalMin !== null ? `${globalMin.toFixed(2)} %/g` : '—', cls: 'text-orange-600' },
          { label: 'Catene analizzate', value: filtered.length.toString(),                              cls: 'text-gray-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
            <div className="text-xs text-gray-500 mb-1">{s.label}</div>
            <div className={`text-lg font-bold ${s.cls}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Lotti espandibili */}
      <div className="space-y-3">
        {byLot.map(({ lotId, supplier, arrivalDate, chains, avgSgr }) => {
          const expanded   = expandedLots.has(lotId);
          const activeCount = chains.filter((c: any) => c.leafState === 'active').length;

          return (
            <div key={lotId} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {/* Header lotto */}
              <button onClick={() => toggleLot(lotId)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                <Package2 className="h-4 w-4 text-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800 text-sm">{supplier}</span>
                    <span className="text-xs text-gray-400">#{lotId}</span>
                    {arrivalDate && <span className="text-xs text-gray-500">· arr. {fmtDate(arrivalDate)}</span>}
                    <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">{chains.length} catene</span>
                    {activeCount > 0 && (
                      <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-100">{activeCount} attive</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">SGR medio lotto</div>
                    <div className={`text-sm font-bold ${sgrColor(avgSgr)}`}>
                      {avgSgr !== null ? `${avgSgr.toFixed(2)} %/g` : '—'}
                    </div>
                  </div>
                  {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </div>
              </button>

              {/* Tabella catene */}
              {expanded && (
                <div className="border-t border-gray-100 overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left border-b border-gray-200 text-gray-600 font-semibold whitespace-nowrap">Catena</th>
                        <th className="px-3 py-2 text-left border-b border-gray-200 text-gray-600 font-semibold whitespace-nowrap">Cesta attuale</th>
                        <th className="px-3 py-2 text-center border-b border-gray-200 text-gray-600 font-semibold">Qualità</th>
                        <th className="px-3 py-2 text-center border-b border-gray-200 text-gray-600 font-semibold">Stato</th>
                        <th className="px-3 py-2 text-center border-b border-gray-200 text-gray-600 font-semibold cursor-pointer hover:bg-gray-100 whitespace-nowrap select-none"
                            onClick={() => toggleSort('rootDate')}>
                          Inizio lotto {sortCol === 'rootDate' && (sortDir === 'desc' ? '↓' : '↑')}
                        </th>
                        <th className="px-3 py-2 text-center border-b border-gray-200 text-gray-600 font-semibold cursor-pointer hover:bg-gray-100 whitespace-nowrap select-none"
                            onClick={() => toggleSort('leafDate')}>
                          Ultima misura {sortCol === 'leafDate' && (sortDir === 'desc' ? '↓' : '↑')}
                        </th>
                        <th className="px-3 py-2 text-center border-b border-gray-200 text-gray-600 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => toggleSort('totalDays')}>
                          Giorni {sortCol === 'totalDays' && (sortDir === 'desc' ? '↓' : '↑')}
                        </th>
                        <th className="px-3 py-2 text-right border-b border-gray-200 text-gray-600 font-semibold whitespace-nowrap">Inizio An/kg</th>
                        <th className="px-3 py-2 text-right border-b border-gray-200 text-gray-600 font-semibold whitespace-nowrap">Attuale An/kg</th>
                        <th className="px-3 py-2 text-right border-b border-gray-200 text-green-700 font-bold cursor-pointer hover:bg-gray-100 whitespace-nowrap select-none"
                            onClick={() => toggleSort('sgr')}>
                          SGR %/g {sortCol === 'sgr' && (sortDir === 'desc' ? '↓' : '↑')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {chains.map((c: any, idx: number) => (
                        <tr key={`${c.rootCycleId}-${c.leafCycleId}`}
                            className={`border-b border-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-blue-50/30 transition-colors`}>
                          {/* Catena */}
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              {!c.isSolo && <GitBranch className="h-3 w-3 text-blue-400 shrink-0" />}
                              <span className="text-gray-700 whitespace-nowrap">
                                {c.isSolo
                                  ? `#${c.rootBasketNum}`
                                  : `#${c.rootBasketNum} → #${c.leafBasketNum}`}
                              </span>
                              {!c.isSolo && c.depth > 1 && (
                                <span className="text-gray-400 ml-1">({c.depth}°)</span>
                              )}
                            </div>
                            <div className="text-gray-400 mt-0.5 truncate max-w-36">{c.rootFlupsyName}</div>
                          </td>
                          {/* Cesta attuale */}
                          <td className="px-3 py-2">
                            <div className="font-medium text-gray-700">#{c.leafBasketNum}</div>
                            <div className="text-gray-400 truncate max-w-36">{c.leafFlupsyName}</div>
                          </td>
                          {/* Qualità */}
                          <td className="px-3 py-2 text-center">{qualityBadge(c.qualityClass)}</td>
                          {/* Stato */}
                          <td className="px-3 py-2 text-center">{stateBadge(c.leafState)}</td>
                          {/* Date */}
                          <td className="px-3 py-2 text-center text-gray-600 whitespace-nowrap">{fmtDate(c.rootDate)}</td>
                          <td className="px-3 py-2 text-center text-gray-600 whitespace-nowrap">{fmtDate(c.leafDate)}</td>
                          {/* Giorni */}
                          <td className="px-3 py-2 text-center text-gray-500">{c.totalDays}</td>
                          {/* An/kg */}
                          <td className="px-3 py-2 text-right text-gray-500 whitespace-nowrap">{fmtApk(c.rootApk)}</td>
                          <td className="px-3 py-2 text-right text-gray-500 whitespace-nowrap">{fmtApk(c.leafApk)}</td>
                          {/* SGR */}
                          <td className="px-3 py-2 text-right">
                            {c.sgr !== null ? (
                              <div className={`flex items-center justify-end gap-1 ${sgrColor(c.sgr)}`}>
                                {c.sgr > 0
                                  ? <TrendingUp className="h-3 w-3" />
                                  : c.sgr < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                                <span className="font-semibold">{c.sgr.toFixed(2)}</span>
                              </div>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {chains.length > 1 && (
                      <tfoot>
                        <tr className="bg-blue-50 border-t border-blue-100">
                          <td colSpan={9} className="px-3 py-1.5 text-xs font-semibold text-blue-700 text-right">Media lotto →</td>
                          <td className="px-3 py-1.5 text-right">
                            {avgSgr !== null
                              ? <span className={`font-bold text-sm ${sgrColor(avgSgr)}`}>{avgSgr.toFixed(2)}</span>
                              : <span className="text-gray-400">—</span>}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </div>
          );
        })}

        {byLot.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-gray-400">
            Nessun dato disponibile con i filtri selezionati.
          </div>
        )}
      </div>

      {/* Nota metodologica */}
      <div className="mt-5 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700 leading-relaxed">
        <strong>Metodo di calcolo:</strong> SGR = ln(An/kg inizio ÷ An/kg attuale) ÷ giorni totali × 100.<br />
        Il punto di partenza è la prima operazione con peso del ciclo radice (senza parent).
        Il punto finale è l'ultima operazione con peso del ciclo foglia corrente.
        Le generazioni intermedie (vagliature) sono trasparenti al calcolo.
        Operazioni considerate: Prima Attivazione, Misura, Chiusura Ciclo, Chiusura Vagliatura.
      </div>
    </div>
  );
}
