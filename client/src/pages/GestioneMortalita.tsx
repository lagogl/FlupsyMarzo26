import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Save, RotateCcw, Skull, Info } from "lucide-react";

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

type EditableRates = Record<string, Record<number, number>>;

export default function GestioneMortalita() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editableRates, setEditableRates] = useState<EditableRates>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ size: string; month: number } | null>(null);

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

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse" style={{ fontFamily: "'Calibri', 'Segoe UI', sans-serif" }}>
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-gray-100 border-r-2 border-b border-gray-300 p-2 text-left min-w-[120px]">
                    Taglia
                  </th>
                  {MONTHS.map(m => (
                    <th key={m.num} className="bg-gray-100 border-b border-gray-300 p-2 text-center min-w-[60px] font-medium">
                      {m.short}
                    </th>
                  ))}
                  <th className="bg-gray-200 border-b border-l-2 border-gray-300 p-2 text-center min-w-[70px] font-bold">
                    Media
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedSizes.map(size => (
                  <tr key={size.name} className={`${getRowColor(size.name)} border-b border-gray-200`}>
                    <td className={`sticky left-0 z-10 border-r-2 border-gray-300 p-2 font-semibold text-xs ${getHeaderColor(size.name)}`}>
                      {size.name}
                    </td>
                    {MONTHS.map(m => {
                      const isSelected = selectedCell?.size === size.name && selectedCell?.month === m.num;
                      return (
                        <td key={m.num} className={`p-0.5 text-center border-r border-gray-200 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={editableRates[size.name]?.[m.num] ?? 0}
                            onChange={(e) => handleCellChange(size.name, m.num, e.target.value)}
                            onFocus={() => setSelectedCell({ size: size.name, month: m.num })}
                            onBlur={() => setSelectedCell(null)}
                            className="w-full text-center h-7 text-xs border-0 bg-transparent focus:bg-white focus:border focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </td>
                      );
                    })}
                    <td className="p-1 text-center border-l-2 border-gray-300 font-bold bg-gray-50 text-xs">
                      {getSizeAvg(size.name).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
