import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Download, X, Search, ChevronDown, ChevronRight, GitBranch, Layers } from "lucide-react";
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
        <td className="py-2 px-3 text-sm text-gray-500">{cycle.operation_count}</td>
        <td className="py-2 px-3">
          <button
            onClick={() => setOpsOpen(!opsOpen)}
            className="text-xs text-blue-600 hover:underline"
          >
            {opsOpen ? 'Nascondi' : 'Operazioni'}
          </button>
        </td>
      </tr>

      {opsOpen && cycle.operations?.length > 0 && (
        <tr>
          <td colSpan={13} className="p-0">
            <div className="bg-white border-l-4 border-blue-200 mx-2 mb-2 rounded-r-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-100">
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
        <div className="overflow-x-auto">
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
  const [selectedBaskets, setSelectedBaskets] = useState<number[]>([]);
  const [exporting, setExporting] = useState(false);

  const { data: baskets } = useQuery<any[]>({ queryKey: ['/api/baskets'] });

  const activeBaskets = useMemo(() => {
    if (!baskets) return [];
    return (baskets as any[])
      .filter(b => b.state === 'active' && b.currentCycleId)
      .sort((a, b) => a.physicalNumber - b.physicalNumber);
  }, [baskets]);

  const filteredSuggestions = useMemo(() => {
    if (!searchInput || searchInput.length < 1) return [];
    return activeBaskets.filter(b =>
      String(b.physicalNumber).includes(searchInput)
    ).slice(0, 15);
  }, [searchInput, activeBaskets]);

  function addBasket(physNum: number) {
    if (!selectedBaskets.includes(physNum)) {
      setSelectedBaskets(prev => [...prev, physNum]);
    }
    setSearchInput('');
  }

  function removeBasket(physNum: number) {
    setSelectedBaskets(prev => prev.filter(n => n !== physNum));
  }

  const queryEnabled = selectedBaskets.length > 0;
  const queryUrl = `/api/lineage?basketIds=${selectedBaskets.join(',')}`;

  const { data, isLoading, error } = useQuery<any>({
    queryKey: ['/api/lineage', selectedBaskets.join(',')],
    queryFn: () => fetch(queryUrl).then(r => r.json()),
    enabled: queryEnabled,
  });

  async function handleExport() {
    if (!queryEnabled) return;
    setExporting(true);
    try {
      const url = `/api/lineage/export?basketIds=${selectedBaskets.join(',')}`;
      const resp = await fetch(url);
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

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-emerald-600" />
            Storia Animali
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Traccia la genealogia completa degli animali dalla semina alla vendita
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

      {/* Search box */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="Cerca per numero cesta (es. 3, 11, 14)..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const num = parseInt(searchInput);
                    if (num) addBasket(num);
                  }
                }}
              />
              {filteredSuggestions.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 bg-white border rounded-b-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredSuggestions.map(b => (
                    <div
                      key={b.id}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center text-sm"
                      onClick={() => addBasket(b.physicalNumber)}
                    >
                      <span className="font-semibold">Cesta #{b.physicalNumber}</span>
                      <span className="text-gray-500 text-xs">{b.cycleCode ?? ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedBaskets.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-500 self-center">Ceste selezionate:</span>
                {selectedBaskets.map(num => (
                  <Badge key={num} className="bg-blue-100 text-blue-800 flex items-center gap-1 px-2 py-1">
                    Cesta #{num}
                    <button onClick={() => removeBasket(num)} className="ml-1 hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                <button
                  onClick={() => setSelectedBaskets([])}
                  className="text-xs text-red-500 hover:underline self-center"
                >
                  Rimuovi tutte
                </button>
              </div>
            )}

            {!queryEnabled && (
              <p className="text-sm text-gray-400 italic">
                Seleziona una o più ceste per vedere la loro storia genealogica completa.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading && (
        <div className="text-center py-12 text-gray-400">
          <GitBranch className="w-10 h-10 mx-auto mb-3 animate-pulse" />
          <p>Caricamento genealogia...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-red-500">
          Errore nel caricamento dei dati.
        </div>
      )}

      {data?.groups?.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-400">
          Nessun dato genealogico trovato per le ceste selezionate.
        </div>
      )}

      {data?.groups?.map((group: any) => (
        <LineageGroup key={group.lineageGroupId} group={group} />
      ))}
    </div>
  );
}
