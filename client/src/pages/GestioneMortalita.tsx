import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Save, RotateCcw, Skull, Info, Copy, ClipboardPaste, Check } from "lucide-react";

const MONTHS = [
  { num: 1, short: 'Gen' },
  { num: 2, short: 'Feb' },
  { num: 3, short: 'Mar' },
  { num: 4, short: 'Apr' },
  { num: 5, short: 'Mag' },
  { num: 6, short: 'Giu' },
  { num: 7, short: 'Lug' },
  { num: 8, short: 'Ago' },
  { num: 9, short: 'Set' },
  { num: 10, short: 'Ott' },
  { num: 11, short: 'Nov' },
  { num: 12, short: 'Dic' },
];

interface MortalityRate {
  id: number;
  sizeName: string;
  month: number;
  monthlyPercentage: number;
  notes: string | null;
}

interface SizeRecord {
  id: number;
  name: string;
  minAnimalsPerKg: number;
  maxAnimalsPerKg: number;
}

type CellKey = `${string}|${number}`;
type EditableRates = Record<string, Record<number, number>>;

export default function GestioneMortalita() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editableRates, setEditableRates] = useState<EditableRates>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedCells, setSelectedCells] = useState<Set<CellKey>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [copiedValue, setCopiedValue] = useState<number | null>(null);
  const [lastPasted, setLastPasted] = useState(false);
  const [selectionAnchor, setSelectionAnchor] = useState<{ sizeIdx: number; monthIdx: number } | null>(null);

  const { data: rates, isLoading: ratesLoading } = useQuery<MortalityRate[]>({
    queryKey: ["/api/proiezione-crescita/mortality-rates"],
  });

  const { data: sizes, isLoading: sizesLoading } = useQuery<SizeRecord[]>({
    queryKey: ["/api/sizes"],
  });

  const sortedSizes = useMemo(() => {
    if (!sizes) return [];
    return [...sizes].sort((a, b) => b.minAnimalsPerKg - a.minAnimalsPerKg);
  }, [sizes]);

  useEffect(() => {
    if (rates && sortedSizes.length > 0) {
      const map: EditableRates = {};
      for (const size of sortedSizes) {
        map[size.name] = {};
        for (const m of MONTHS) {
          const found = rates.find(r => r.sizeName === size.name && r.month === m.num);
          map[size.name][m.num] = found ? found.monthlyPercentage : 0;
        }
      }
      setEditableRates(map);
      setHasChanges(false);
    }
  }, [rates, sortedSizes]);

  const cellKey = (size: string, month: number): CellKey => `${size}|${month}`;
  const parseCellKey = (key: CellKey) => {
    const [size, monthStr] = key.split('|');
    return { size, month: parseInt(monthStr) };
  };

  const handleCellMouseDown = useCallback((sizeIdx: number, monthIdx: number, e: React.MouseEvent) => {
    e.preventDefault();
    const size = sortedSizes[sizeIdx]?.name;
    const month = MONTHS[monthIdx]?.num;
    if (!size || !month) return;

    if (e.shiftKey && selectionAnchor) {
      const minSi = Math.min(selectionAnchor.sizeIdx, sizeIdx);
      const maxSi = Math.max(selectionAnchor.sizeIdx, sizeIdx);
      const minMi = Math.min(selectionAnchor.monthIdx, monthIdx);
      const maxMi = Math.max(selectionAnchor.monthIdx, monthIdx);
      const newSet = new Set<CellKey>();
      for (let si = minSi; si <= maxSi; si++) {
        for (let mi = minMi; mi <= maxMi; mi++) {
          newSet.add(cellKey(sortedSizes[si].name, MONTHS[mi].num));
        }
      }
      setSelectedCells(newSet);
    } else {
      setSelectedCells(new Set([cellKey(size, month)]));
      setSelectionAnchor({ sizeIdx, monthIdx });
      setIsSelecting(true);
    }
    setLastPasted(false);
  }, [sortedSizes, selectionAnchor]);

  const handleCellMouseEnter = useCallback((sizeIdx: number, monthIdx: number) => {
    if (!isSelecting || !selectionAnchor) return;
    const minSi = Math.min(selectionAnchor.sizeIdx, sizeIdx);
    const maxSi = Math.max(selectionAnchor.sizeIdx, sizeIdx);
    const minMi = Math.min(selectionAnchor.monthIdx, monthIdx);
    const maxMi = Math.max(selectionAnchor.monthIdx, monthIdx);
    const newSet = new Set<CellKey>();
    for (let si = minSi; si <= maxSi; si++) {
      for (let mi = minMi; mi <= maxMi; mi++) {
        newSet.add(cellKey(sortedSizes[si].name, MONTHS[mi].num));
      }
    }
    setSelectedCells(newSet);
  }, [isSelecting, selectionAnchor, sortedSizes]);

  useEffect(() => {
    const handleMouseUp = () => setIsSelecting(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleCopySelected = useCallback(() => {
    if (selectedCells.size === 0) return;
    const firstKey = Array.from(selectedCells)[0];
    const { size, month } = parseCellKey(firstKey);
    const val = editableRates[size]?.[month] ?? 0;
    setCopiedValue(val);
    setLastPasted(false);
    toast({ title: "Copiato", description: `Valore ${val}% copiato` });
  }, [selectedCells, editableRates, toast]);

  const handlePasteToSelected = useCallback(() => {
    if (copiedValue === null || selectedCells.size === 0) return;
    setEditableRates(prev => {
      const next = { ...prev };
      for (const key of selectedCells) {
        const { size, month } = parseCellKey(key);
        next[size] = { ...next[size], [month]: copiedValue };
      }
      return next;
    });
    setHasChanges(true);
    setLastPasted(true);
    toast({ title: "Incollato", description: `${copiedValue}% applicato a ${selectedCells.size} celle` });
  }, [copiedValue, selectedCells, toast]);

  const handleFillValue = useCallback((value: number) => {
    if (selectedCells.size === 0) return;
    setEditableRates(prev => {
      const next = { ...prev };
      for (const key of selectedCells) {
        const { size, month } = parseCellKey(key);
        next[size] = { ...next[size], [month]: value };
      }
      return next;
    });
    setHasChanges(true);
    toast({ title: "Applicato", description: `${value}% applicato a ${selectedCells.size} celle` });
  }, [selectedCells, toast]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (selectedCells.size > 0) {
          handleCopySelected();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (selectedCells.size > 0 && copiedValue !== null) {
          e.preventDefault();
          handlePasteToSelected();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleCopySelected, handlePasteToSelected, selectedCells, copiedValue]);

  const handleCellChange = (sizeName: string, month: number, value: string) => {
    const num = parseFloat(value);
    if (value === '' || (!isNaN(num) && num >= 0 && num <= 100)) {
      setEditableRates(prev => ({
        ...prev,
        [sizeName]: { ...prev[sizeName], [month]: value === '' ? 0 : num }
      }));
      setHasChanges(true);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: { rates: Array<{ sizeName: string; month: number; monthlyPercentage: number }> }) => {
      return apiRequest("/api/proiezione-crescita/mortality-rates/bulk", "PUT", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/proiezione-crescita/mortality-rates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/proiezione-crescita"] });
      setHasChanges(false);
      toast({ title: "Salvato", description: "Tassi di mortalità aggiornati con successo" });
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile salvare i tassi di mortalità", variant: "destructive" });
    }
  });

  const handleSave = () => {
    const payload: Array<{ sizeName: string; month: number; monthlyPercentage: number }> = [];
    for (const size of sortedSizes) {
      for (const m of MONTHS) {
        payload.push({
          sizeName: size.name,
          month: m.num,
          monthlyPercentage: editableRates[size.name]?.[m.num] ?? 0
        });
      }
    }
    saveMutation.mutate({ rates: payload });
  };

  const handleReset = () => {
    if (rates && sortedSizes.length > 0) {
      const map: EditableRates = {};
      for (const size of sortedSizes) {
        map[size.name] = {};
        for (const m of MONTHS) {
          const found = rates.find(r => r.sizeName === size.name && r.month === m.num);
          map[size.name][m.num] = found ? found.monthlyPercentage : 0;
        }
      }
      setEditableRates(map);
      setHasChanges(false);
    }
  };

  const getSizeAvg = (sizeName: string) => {
    if (!editableRates[sizeName]) return 0;
    const values = Object.values(editableRates[sizeName]);
    return values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length) : 0;
  };

  const getRowColor = (sizeName: string) => {
    const size = sortedSizes.find(s => s.name === sizeName);
    if (!size) return '';
    if (size.minAnimalsPerKg > 30000) return 'bg-red-50/60';
    if (size.minAnimalsPerKg > 6000) return 'bg-amber-50/60';
    return 'bg-green-50/60';
  };

  const getHeaderColor = (sizeName: string) => {
    const size = sortedSizes.find(s => s.name === sizeName);
    if (!size) return '';
    if (size.minAnimalsPerKg > 30000) return 'bg-red-100 text-red-800';
    if (size.minAnimalsPerKg > 6000) return 'bg-amber-100 text-amber-800';
    return 'bg-green-100 text-green-800';
  };

  const handleSelectRow = (sizeName: string) => {
    const newSet = new Set<CellKey>();
    for (const m of MONTHS) {
      newSet.add(cellKey(sizeName, m.num));
    }
    setSelectedCells(newSet);
    setLastPasted(false);
  };

  const handleSelectColumn = (month: number) => {
    const newSet = new Set<CellKey>();
    for (const size of sortedSizes) {
      newSet.add(cellKey(size.name, month));
    }
    setSelectedCells(newSet);
    setLastPasted(false);
  };

  const handleSelectAll = () => {
    const newSet = new Set<CellKey>();
    for (const size of sortedSizes) {
      for (const m of MONTHS) {
        newSet.add(cellKey(size.name, m.num));
      }
    }
    setSelectedCells(newSet);
    setLastPasted(false);
  };

  const isLoading = ratesLoading || sizesLoading;

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[300px]">
        <div className="text-gray-500">Caricamento tassi di mortalità...</div>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-4 space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Skull className="h-5 w-5 text-red-600" />
              <CardTitle className="text-lg">Tassi di Mortalità per Taglia</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Button variant="outline" size="sm" onClick={handleReset} disabled={saveMutation.isPending}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Annulla
                </Button>
              )}
              <Button size="sm" onClick={handleSave} disabled={!hasChanges || saveMutation.isPending}>
                <Save className="h-4 w-4 mr-1" />
                {saveMutation.isPending ? "Salvataggio..." : "Salva"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-4 pb-3">
            <div className="flex items-start gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-md p-3">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                Questi tassi di mortalità mensile (%) vengono utilizzati nel modulo <strong>Proiezione Crescita</strong> per simulare
                la riduzione degli animali mese per mese per ogni taglia.
                La mortalità <strong>non</strong> viene applicata alla giacenza già pronta (animali già a taglia target).
              </div>
            </div>
          </div>

          <div className="px-4 pb-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500 mr-1">
              {selectedCells.size > 0 ? `${selectedCells.size} celle selezionate` : 'Seleziona celle trascinando o con Shift+click'}
            </span>
            <div className="flex items-center gap-1 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopySelected}
                disabled={selectedCells.size === 0}
                className="h-7 text-xs px-2"
              >
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copia
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePasteToSelected}
                disabled={copiedValue === null || selectedCells.size === 0}
                className="h-7 text-xs px-2"
              >
                {lastPasted ? <Check className="h-3.5 w-3.5 mr-1 text-green-600" /> : <ClipboardPaste className="h-3.5 w-3.5 mr-1" />}
                Incolla {copiedValue !== null ? `(${copiedValue}%)` : ''}
              </Button>
              <div className="border-l border-gray-300 mx-1 h-5" />
              <span className="text-xs text-gray-500 mr-1">Riempi:</span>
              {[0, 1, 2, 3, 5, 8, 10].map(v => (
                <Button
                  key={v}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFillValue(v)}
                  disabled={selectedCells.size === 0}
                  className="h-7 text-xs px-1.5 min-w-[32px]"
                >
                  {v}%
                </Button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto select-none">
            <table className="w-full border-collapse" style={{ fontFamily: "'Calibri', 'Segoe UI', sans-serif" }}>
              <thead>
                <tr>
                  <th
                    className="sticky left-0 z-10 bg-gray-100 border-r-2 border-b border-gray-300 p-2 text-left min-w-[100px] text-sm cursor-pointer hover:bg-gray-200"
                    onClick={handleSelectAll}
                    title="Seleziona tutto"
                  >
                    Taglia
                  </th>
                  {MONTHS.map((m, mi) => (
                    <th
                      key={m.num}
                      className="bg-gray-100 border-b border-gray-300 p-1 text-center min-w-[52px] font-medium text-sm cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSelectColumn(m.num)}
                      title={`Seleziona colonna ${m.short}`}
                    >
                      {m.short}
                    </th>
                  ))}
                  <th className="bg-gray-200 border-b border-l-2 border-gray-300 p-1 text-center min-w-[60px] font-bold text-sm">
                    Media
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedSizes.map((size, si) => (
                  <tr key={size.name} className={`${getRowColor(size.name)} border-b border-gray-200`}>
                    <td
                      className={`sticky left-0 z-10 border-r-2 border-gray-300 p-1.5 font-semibold text-sm cursor-pointer hover:opacity-80 ${getHeaderColor(size.name)}`}
                      onClick={() => handleSelectRow(size.name)}
                      title={`Seleziona riga ${size.name}`}
                    >
                      {size.name}
                    </td>
                    {MONTHS.map((m, mi) => {
                      const key = cellKey(size.name, m.num);
                      const isSel = selectedCells.has(key);
                      return (
                        <td
                          key={m.num}
                          className={`p-0 text-center border-r border-gray-200 ${isSel ? 'bg-blue-100 ring-1 ring-inset ring-blue-400' : ''}`}
                          onMouseDown={(e) => handleCellMouseDown(si, mi, e)}
                          onMouseEnter={() => handleCellMouseEnter(si, mi)}
                        >
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={editableRates[size.name]?.[m.num] ?? 0}
                            onChange={(e) => handleCellChange(size.name, m.num, e.target.value)}
                            className="w-full text-center h-7 text-sm font-medium border-0 bg-transparent focus:bg-white focus:border focus:border-blue-400 rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none pointer-events-auto"
                            onFocus={() => {
                              if (selectedCells.size <= 1) {
                                setSelectedCells(new Set([key]));
                              }
                            }}
                          />
                        </td>
                      );
                    })}
                    <td className="p-1 text-center border-l-2 border-gray-300 font-bold bg-gray-50 text-sm">
                      {getSizeAvg(size.name).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2 text-xs text-gray-400 border-t">
            Suggerimento: Trascina per selezionare un'area, Shift+click per estendere. Click su riga/colonna per selezionare tutto. Ctrl+C / Ctrl+V per copia/incolla rapido.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
