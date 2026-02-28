import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeftRight, Search, CheckCircle2, XCircle, AlertCircle,
  ChevronRight, Trash2, Info, RefreshCw, Scale, Loader2
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SourceBasket {
  id: number;
  physical_number: number;
  flupsy_id: number;
  flupsy_name: string;
  state: string;
  current_cycle_id: number;
  cycle_code: string;
  lot_id: number;
  lot_supplier: string;
  supplier_lot_number: string;
  animal_count: number;
  animals_per_kg: number;
  size_code: string;
  size_name: string;
  mortality_rate: number;
  sgr_id: number;
  last_op_date: string;
  last_op_type: string;
}

interface DestBasket {
  id: number;
  physical_number: number;
  flupsy_id: number;
  flupsy_name: string;
  state: string;
}

interface DestAssignment {
  basket: DestBasket;
  animalCount: number;
}

function formatNumber(n: number | null | undefined) {
  if (n == null) return "—";
  return n.toLocaleString("it-IT");
}

function formatDate(s: string | null | undefined) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("it-IT");
}

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function BasketTransfer() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [date, setDate] = useState(today());
  const [mode, setMode] = useState<"total" | "partial">("total");
  const [selectedSource, setSelectedSource] = useState<SourceBasket | null>(null);
  const [assignments, setAssignments] = useState<DestAssignment[]>([]);
  const [sourceSearch, setSourceSearch] = useState("");
  const [destSearch, setDestSearch] = useState("");
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  // In partial mode the source basket keeps an explicit user-set quantity
  const [sourceRetention, setSourceRetention] = useState<number>(0);

  const { data: sourceData, isLoading: sourceLoading } = useQuery<{ baskets: SourceBasket[] }>({
    queryKey: ["/api/basket-transfer/source-baskets"],
    refetchInterval: 30000,
  });

  const { data: destData, isLoading: destLoading } = useQuery<{ baskets: DestBasket[] }>({
    queryKey: ["/api/basket-transfer/destination-baskets"],
    refetchInterval: 30000,
  });

  const executeTransfer = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/basket-transfer/execute", {
        sourceBasketId: selectedSource!.id,
        date,
        mode,
        sourceRetention: mode === "partial" ? sourceRetention : undefined,
        destinations: assignments.map(a => ({
          basketId: a.basket.id,
          animalCount: a.animalCount,
        })),
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Trasferimento completato",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/basket-transfer/source-baskets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/basket-transfer/destination-baskets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/baskets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
      setSelectedSource(null);
      setAssignments([]);
      setMode("total");
    },
    onError: (err: any) => {
      toast({
        title: "Errore trasferimento",
        description: err.message || "Si è verificato un errore",
        variant: "destructive",
      });
    },
  });

  // Reset sourceRetention when the source basket changes or when switching to total mode
  useEffect(() => {
    setSourceRetention(0);
  }, [selectedSource?.id, mode]);

  const sourceBaskets = (sourceData?.baskets ?? []).filter(b => {
    const q = sourceSearch.toLowerCase();
    return !q || String(b.physical_number).includes(q) || b.flupsy_name?.toLowerCase().includes(q);
  });

  const usedDestIds = new Set(assignments.map(a => a.basket.id));
  const availableDestBaskets = (destData?.baskets ?? []).filter(b => {
    if (usedDestIds.has(b.id)) return false;
    const q = destSearch.toLowerCase();
    return !q || String(b.physical_number).includes(q) || b.flupsy_name?.toLowerCase().includes(q);
  });

  const totalAssigned = assignments.reduce((s, a) => s + (a.animalCount || 0), 0);
  const sourceAnimals = selectedSource?.animal_count ?? 0;
  // In partial mode: remaining = unallocated animals across ALL participants (source + dests)
  // In total mode:  remaining = what still needs to be assigned to destinations
  const remaining = mode === "partial"
    ? sourceAnimals - sourceRetention - totalAssigned
    : sourceAnimals - totalAssigned;

  const distributeEqually = useCallback(() => {
    if (!selectedSource || assignments.length === 0) return;
    const destCount = assignments.length;
    if (mode === "total") {
      // Total mode: split all animals equally among N destinations
      const base = Math.floor(sourceAnimals / destCount);
      const rem = sourceAnimals - base * destCount;
      setAssignments(prev => prev.map((a, i) => ({
        ...a,
        animalCount: i < rem ? base + 1 : base,
      })));
    } else {
      // Partial mode: source basket ALSO participates — divide among (N destinations + 1 source).
      const totalParts = destCount + 1;
      const basePerPart = Math.floor(sourceAnimals / totalParts);
      const remainder = sourceAnimals - basePerPart * totalParts;
      // Source always gets the base share; remainder goes to first N destination baskets
      setSourceRetention(basePerPart);
      setAssignments(prev => prev.map((a, i) => ({
        ...a,
        animalCount: i < remainder ? basePerPart + 1 : basePerPart,
      })));
    }
  }, [selectedSource, assignments.length, sourceAnimals, mode]);

  const addDest = useCallback((b: DestBasket) => {
    if (usedDestIds.has(b.id)) return;
    // In modalità totale: auto-riempi con il saldo rimanente (comodità per distribuzione totale).
    // In modalità parziale: parti da 0 — è l'utente a decidere quanti trasferire.
    const initial = mode === "total" ? Math.max(0, sourceAnimals - totalAssigned) : 0;
    setAssignments(prev => [...prev, { basket: b, animalCount: initial }]);
  }, [usedDestIds, sourceAnimals, totalAssigned, mode]);

  const removeDest = useCallback((basketId: number) => {
    setAssignments(prev => prev.filter(a => a.basket.id !== basketId));
  }, []);

  const updateCount = useCallback((basketId: number, value: number) => {
    setAssignments(prev => prev.map(a =>
      a.basket.id === basketId ? { ...a, animalCount: value } : a
    ));
  }, []);

  const totalAllParticipants = mode === "partial"
    ? sourceRetention + totalAssigned
    : totalAssigned;

  const canSubmit = !!selectedSource && assignments.length > 0 && totalAssigned > 0;

  const validationMessage = (() => {
    if (!selectedSource) return "Seleziona una cesta sorgente";
    if (assignments.length === 0) return "Aggiungi almeno una cesta destinazione";
    if (totalAssigned <= 0) return "Assegna almeno 1 animale alle destinazioni";
    if (mode === "partial" && totalAllParticipants !== sourceAnimals)
      return `La somma di tutte le ceste (${formatNumber(totalAllParticipants)}) deve essere uguale al totale sorgente (${formatNumber(sourceAnimals)})`;
    if (mode === "total" && totalAssigned !== sourceAnimals)
      return `In modalità totale occorre trasferire tutti i ${formatNumber(sourceAnimals)} animali`;
    return null;
  })();

  const effectiveCanSubmit = canSubmit && validationMessage === null;

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-violet-100 p-2 rounded-lg">
          <ArrowLeftRight className="h-6 w-6 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trasferimento Ciclo</h1>
          <p className="text-sm text-gray-500">Sposta animali da una cesta attiva ad una o più ceste disponibili</p>
        </div>
      </div>

      {/* Configurazione */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configurazione Trasferimento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Data operazione</label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Modalità</label>
              <Select value={mode} onValueChange={(v: "total" | "partial") => setMode(v)}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">Totale — cesta liberata</SelectItem>
                  <SelectItem value="partial">Parziale — cesta rimane attiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {mode === "total" && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Il ciclo sorgente verrà chiuso e la cesta sarà liberata
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* PANNELLO SORGENTE */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Cesta Sorgente</span>
              {sourceLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            </CardTitle>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Cerca per numero o FLUPSY..."
                value={sourceSearch}
                onChange={e => setSourceSearch(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-96 space-y-2 pr-2">
            {sourceBaskets.length === 0 && !sourceLoading && (
              <p className="text-sm text-gray-400 text-center py-8">Nessuna cesta attiva trovata</p>
            )}
            {sourceBaskets.map(b => {
              const selected = selectedSource?.id === b.id;
              return (
                <div
                  key={b.id}
                  onClick={() => {
                    setSelectedSource(selected ? null : b);
                    setAssignments([]);
                  }}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selected
                      ? "border-violet-500 bg-violet-50"
                      : "border-gray-200 hover:border-violet-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-gray-800">#{b.physical_number}</span>
                      <Badge variant="outline" className="text-xs text-violet-700 border-violet-300">
                        {b.flupsy_name}
                      </Badge>
                      {selected && <CheckCircle2 className="h-4 w-4 text-violet-600" />}
                    </div>
                    <span className="text-xs text-gray-400">{b.cycle_code}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-x-3 text-xs text-gray-600 mt-1">
                    <span><span className="text-gray-400">Animali:</span> {formatNumber(b.animal_count)}</span>
                    <span><span className="text-gray-400">an/kg:</span> {formatNumber(b.animals_per_kg)}</span>
                    <span><span className="text-gray-400">Taglia:</span> {b.size_code ?? "—"}</span>
                    <span className="col-span-2"><span className="text-gray-400">Lotto:</span> {b.lot_supplier ?? "—"} {b.supplier_lot_number ?? ""}</span>
                    <span><span className="text-gray-400">Ultima op:</span> {formatDate(b.last_op_date)}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* PANNELLO DESTINAZIONI */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Ceste Disponibili (destinazione)</span>
              {destLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            </CardTitle>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Cerca per numero o FLUPSY..."
                value={destSearch}
                onChange={e => setDestSearch(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-96 pr-2">
            {!selectedSource && (
              <div className="text-center py-8 text-gray-400">
                <ArrowLeftRight className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Seleziona prima una cesta sorgente</p>
              </div>
            )}
            {selectedSource && availableDestBaskets.length === 0 && !destLoading && (
              <p className="text-sm text-gray-400 text-center py-8">Nessuna cesta disponibile</p>
            )}
            {selectedSource && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableDestBaskets.map(b => (
                  <div
                    key={b.id}
                    onClick={() => addDest(b)}
                    draggable
                    onDragStart={() => setDraggingId(b.id)}
                    onDragEnd={() => setDraggingId(null)}
                    className={`p-2 rounded-lg border-2 cursor-pointer transition-all text-center select-none ${
                      draggingId === b.id
                        ? "border-violet-500 bg-violet-100 scale-95"
                        : "border-gray-200 hover:border-violet-400 hover:bg-violet-50"
                    }`}
                  >
                    <div className="font-bold text-base text-gray-800">#{b.physical_number}</div>
                    <div className="text-xs text-gray-500 truncate">{b.flupsy_name}</div>
                    <div className="mt-1">
                      <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50">
                        libera
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* TABELLA ASSEGNAZIONI */}
      {assignments.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Distribuzione Animali</span>
              <div className="flex flex-col items-end gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={distributeEqually}
                  className="text-xs h-7"
                  title={
                    mode === "total"
                      ? `Divide ${formatNumber(sourceAnimals)} animali equamente su ${assignments.length} ceste`
                      : `Divide ${formatNumber(sourceAnimals)} animali su ${assignments.length + 1} quote (${assignments.length} destinazioni + 1 sorgente che trattiene la sua parte)`
                  }
                >
                  <Scale className="h-3.5 w-3.5 mr-1" /> Distribuisci equamente
                </Button>
                {mode === "partial" && assignments.length > 0 && (
                  <span className="text-xs text-gray-400 italic">
                    {(() => {
                      const n = assignments.length + 1; // N dests + 1 source
                      const base = Math.floor(sourceAnimals / n);
                      const rem = sourceAnimals - base * n;
                      const destVal = rem > 0 ? `${formatNumber(base + 1)}/${formatNumber(base)}` : formatNumber(base);
                      return `÷ ${n} ceste: dest. ${destVal} · sorgente trattiene ${formatNumber(base)}`;
                    })()}
                  </span>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-gray-500">
                    <th className="text-left py-2 px-2 font-medium">Cesta</th>
                    <th className="text-left py-2 px-2 font-medium">FLUPSY</th>
                    <th className="text-center py-2 px-2 font-medium w-36">
                      {mode === "partial" ? "Animali" : "Animali da trasferire"}
                    </th>
                    <th className="text-center py-2 px-2 font-medium w-24">% sul tot.</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {/* Riga sorgente EDITABILE — visibile solo in modalità parziale */}
                  {mode === "partial" && selectedSource && (
                    <tr className="border-b bg-violet-50 border-l-4 border-l-violet-400">
                      <td className="py-2 px-2">
                        <span className="font-bold text-violet-800">#{selectedSource.physical_number}</span>
                        <span className="ml-1 text-xs text-violet-500">(sorgente)</span>
                      </td>
                      <td className="py-2 px-2 text-gray-600 text-xs">{selectedSource.flupsy_name}</td>
                      <td className="py-2 px-2">
                        <Input
                          type="number"
                          min={0}
                          max={sourceAnimals}
                          value={sourceRetention || ""}
                          onChange={e => setSourceRetention(parseInt(e.target.value) || 0)}
                          className="h-7 text-center text-sm w-32 mx-auto border-violet-300 focus:ring-violet-400"
                          placeholder="0"
                        />
                      </td>
                      <td className="py-2 px-2 text-center text-violet-600 text-xs font-medium">
                        {sourceAnimals > 0 ? ((sourceRetention / sourceAnimals) * 100).toFixed(1) : "0"}%
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="text-xs text-violet-400 italic">trattiene</span>
                      </td>
                    </tr>
                  )}
                  {assignments.map(a => {
                    const pct = sourceAnimals > 0 ? ((a.animalCount / sourceAnimals) * 100).toFixed(1) : "0";
                    return (
                      <tr key={a.basket.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2 font-medium">#{a.basket.physical_number}</td>
                        <td className="py-2 px-2 text-gray-600 text-xs">{a.basket.flupsy_name}</td>
                        <td className="py-2 px-2">
                          <Input
                            type="number"
                            min={1}
                            max={sourceAnimals}
                            value={a.animalCount || ""}
                            onChange={e => updateCount(a.basket.id, parseInt(e.target.value) || 0)}
                            className="h-7 text-center text-sm w-32 mx-auto"
                          />
                        </td>
                        <td className="py-2 px-2 text-center text-gray-500 text-xs">{pct}%</td>
                        <td className="py-2 px-2">
                          <button
                            onClick={() => removeDest(a.basket.id)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  {/* In partial mode show the grand total across ALL participants */}
                  {mode === "partial" && (
                    <tr className="bg-gray-50 border-t">
                      <td colSpan={2} className="py-2 px-2 text-xs font-medium text-gray-600">
                        Totale complessivo (tutte le ceste)
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className={`font-bold text-sm ${
                          totalAllParticipants > sourceAnimals ? "text-red-600" :
                          totalAllParticipants === sourceAnimals ? "text-green-600" : "text-amber-600"
                        }`}>
                          {formatNumber(totalAllParticipants)} / {formatNumber(sourceAnimals)}
                        </span>
                      </td>
                      <td colSpan={2} className="py-2 px-2 text-center">
                        {totalAllParticipants === sourceAnimals && <CheckCircle2 className="h-4 w-4 text-green-500 inline" />}
                        {totalAllParticipants > sourceAnimals && <XCircle className="h-4 w-4 text-red-500 inline" />}
                      </td>
                    </tr>
                  )}
                  <tr className={`border-t-2 ${
                    remaining < 0 ? "bg-red-50" :
                    remaining === 0 ? "bg-green-50" : "bg-blue-50"
                  }`}>
                    <td colSpan={2} className="py-2 px-2 text-xs font-semibold text-gray-700">
                      {mode === "partial" ? "Non assegnati" : "Da assegnare"}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className={`font-bold text-base ${
                        remaining < 0 ? "text-red-600" :
                        remaining === 0 ? "text-green-600" : "text-blue-700"
                      }`}>
                        {remaining < 0 ? "−" : ""}{formatNumber(Math.abs(remaining))}
                      </span>
                    </td>
                    <td colSpan={2} className="py-2 px-2 text-xs text-gray-500">
                      {remaining > 0 && (
                        <span className="text-blue-600">da distribuire tra le ceste</span>
                      )}
                      {remaining === 0 && (
                        <span className="text-green-600 font-medium">distribuzione completa ✓</span>
                      )}
                      {remaining < 0 && (
                        <span className="text-red-600 font-medium">superato di {formatNumber(Math.abs(remaining))}</span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {validationMessage && (
              <div className="mt-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                <Info className="h-4 w-4 shrink-0" />
                {validationMessage}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* RIEPILOGO + AZIONE */}
      {selectedSource && (
        <Card className="border-violet-200 bg-violet-50/30">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-gray-500 text-xs">Sorgente</span>
                  <div className="font-bold">
                    #{selectedSource.physical_number} — {selectedSource.flupsy_name}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Animali disponibili</span>
                  <div className="font-bold">{formatNumber(selectedSource.animal_count)}</div>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Destinazioni</span>
                  <div className="font-bold">{assignments.length}</div>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Modalità</span>
                  <div className="font-bold capitalize">{mode}</div>
                </div>
              </div>

              <Button
                onClick={() => setShowConfirm(true)}
                disabled={!effectiveCanSubmit || executeTransfer.isPending}
                className="bg-violet-600 hover:bg-violet-700 text-white min-w-36"
              >
                {executeTransfer.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> In corso...</>
                ) : (
                  <><ArrowLeftRight className="h-4 w-4 mr-2" /> Esegui Trasferimento</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CONFIRM DIALOG */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Trasferimento Ciclo</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  Stai per trasferire <strong>{formatNumber(totalAssigned)}</strong> animali dalla cesta{" "}
                  <strong>#{selectedSource?.physical_number} ({selectedSource?.flupsy_name})</strong> a{" "}
                  <strong>{assignments.length}</strong> ceste destinazione.
                </p>
                {mode === "total" && (
                  <p className="text-amber-700 bg-amber-50 rounded px-2 py-1">
                    Il ciclo sorgente verrà chiuso e la cesta sarà liberata.
                  </p>
                )}
                <p>L'operazione è atomica e non reversibile dall'interfaccia.</p>
                <div className="border rounded p-2 bg-gray-50 space-y-1">
                  {assignments.map(a => (
                    <div key={a.basket.id} className="flex justify-between text-xs">
                      <span>#{a.basket.physical_number} ({a.basket.flupsy_name})</span>
                      <span className="font-medium">{formatNumber(a.animalCount)} animali</span>
                    </div>
                  ))}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => executeTransfer.mutate()}
              className="bg-violet-600 hover:bg-violet-700"
            >
              Conferma Trasferimento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
