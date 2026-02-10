import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Save, RotateCcw, Skull, Info } from "lucide-react";

const CATEGORIES = ['T1', 'T3', 'T10'] as const;
const MONTHS = [
  { num: 1, short: 'Gen', name: 'Gennaio' },
  { num: 2, short: 'Feb', name: 'Febbraio' },
  { num: 3, short: 'Mar', name: 'Marzo' },
  { num: 4, short: 'Apr', name: 'Aprile' },
  { num: 5, short: 'Mag', name: 'Maggio' },
  { num: 6, short: 'Giu', name: 'Giugno' },
  { num: 7, short: 'Lug', name: 'Luglio' },
  { num: 8, short: 'Ago', name: 'Agosto' },
  { num: 9, short: 'Set', name: 'Settembre' },
  { num: 10, short: 'Ott', name: 'Ottobre' },
  { num: 11, short: 'Nov', name: 'Novembre' },
  { num: 12, short: 'Dic', name: 'Dicembre' },
];

const CATEGORY_LABELS: Record<string, string> = {
  T1: 'T1 (> 30.000 an/kg)',
  T3: 'T3 (6.000 - 30.000 an/kg)',
  T10: 'T10 (< 6.000 an/kg)',
};

const CATEGORY_COLORS: Record<string, string> = {
  T1: 'bg-red-50 border-red-200',
  T3: 'bg-amber-50 border-amber-200',
  T10: 'bg-green-50 border-green-200',
};

const CATEGORY_HEADER_COLORS: Record<string, string> = {
  T1: 'bg-red-100 text-red-800',
  T3: 'bg-amber-100 text-amber-800',
  T10: 'bg-green-100 text-green-800',
};

interface MortalityRate {
  id: number;
  category: string;
  month: number;
  monthlyPercentage: number;
  notes: string | null;
}

type EditableRates = Record<string, Record<number, number>>;

export default function GestioneMortalita() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editableRates, setEditableRates] = useState<EditableRates>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ cat: string; month: number } | null>(null);

  const { data: rates, isLoading } = useQuery<MortalityRate[]>({
    queryKey: ["/api/proiezione-crescita/mortality-rates"],
  });

  useEffect(() => {
    if (rates) {
      const map: EditableRates = {};
      for (const cat of CATEGORIES) {
        map[cat] = {};
        for (const m of MONTHS) {
          const found = rates.find(r => r.category === cat && r.month === m.num);
          map[cat][m.num] = found ? found.monthlyPercentage : 0;
        }
      }
      setEditableRates(map);
      setHasChanges(false);
    }
  }, [rates]);

  const saveMutation = useMutation({
    mutationFn: async (payload: { rates: Array<{ category: string; month: number; monthlyPercentage: number }> }) => {
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

  const handleCellChange = (cat: string, month: number, value: string) => {
    const num = parseFloat(value);
    if (value === '' || (!isNaN(num) && num >= 0 && num <= 100)) {
      setEditableRates(prev => ({
        ...prev,
        [cat]: { ...prev[cat], [month]: value === '' ? 0 : num }
      }));
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    const payload: Array<{ category: string; month: number; monthlyPercentage: number }> = [];
    for (const cat of CATEGORIES) {
      for (const m of MONTHS) {
        payload.push({
          category: cat,
          month: m.num,
          monthlyPercentage: editableRates[cat]?.[m.num] ?? 0
        });
      }
    }
    saveMutation.mutate({ rates: payload });
  };

  const handleReset = () => {
    if (rates) {
      const map: EditableRates = {};
      for (const cat of CATEGORIES) {
        map[cat] = {};
        for (const m of MONTHS) {
          const found = rates.find(r => r.category === cat && r.month === m.num);
          map[cat][m.num] = found ? found.monthlyPercentage : 0;
        }
      }
      setEditableRates(map);
      setHasChanges(false);
    }
  };

  const getCategoryAvg = (cat: string) => {
    if (!editableRates[cat]) return 0;
    const values = Object.values(editableRates[cat]);
    return values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length) : 0;
  };

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
              <CardTitle className="text-lg">Tassi di Mortalità - Proiezione Crescita</CardTitle>
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
                la riduzione degli animali mese per mese. Ogni categoria rappresenta un range di taglia:
                <strong> T1</strong> = seme piccolo (&gt;30K an/kg),
                <strong> T3</strong> = taglia media (6K-30K an/kg),
                <strong> T10</strong> = taglia grande (&lt;6K an/kg).
                La mortalità <strong>non</strong> viene applicata alla giacenza già pronta (animali già a taglia target).
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse" style={{ fontFamily: "'Calibri', 'Segoe UI', sans-serif" }}>
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-gray-100 border-r-2 border-b border-gray-300 p-2 text-left min-w-[180px]">
                    Categoria
                  </th>
                  {MONTHS.map(m => (
                    <th key={m.num} className="bg-gray-100 border-b border-gray-300 p-2 text-center min-w-[70px] font-medium">
                      {m.short}
                    </th>
                  ))}
                  <th className="bg-gray-200 border-b border-l-2 border-gray-300 p-2 text-center min-w-[80px] font-bold">
                    Media
                  </th>
                </tr>
              </thead>
              <tbody>
                {CATEGORIES.map(cat => (
                  <tr key={cat} className={`${CATEGORY_COLORS[cat]} border-b border-gray-200`}>
                    <td className={`sticky left-0 z-10 border-r-2 border-gray-300 p-2 font-semibold ${CATEGORY_HEADER_COLORS[cat]}`}>
                      {CATEGORY_LABELS[cat]}
                    </td>
                    {MONTHS.map(m => {
                      const isSelected = selectedCell?.cat === cat && selectedCell?.month === m.num;
                      return (
                        <td key={m.num} className={`p-1 text-center border-r border-gray-200 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={editableRates[cat]?.[m.num] ?? 0}
                            onChange={(e) => handleCellChange(cat, m.num, e.target.value)}
                            onFocus={() => setSelectedCell({ cat, month: m.num })}
                            onBlur={() => setSelectedCell(null)}
                            className="w-full text-center h-8 text-sm border-0 bg-transparent focus:bg-white focus:border focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </td>
                      );
                    })}
                    <td className="p-2 text-center border-l-2 border-gray-300 font-bold bg-gray-50">
                      {getCategoryAvg(cat).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Riepilogo per Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CATEGORIES.map(cat => {
              const avg = getCategoryAvg(cat);
              const annualSurvival = Math.pow(1 - avg / 100, 12) * 100;
              return (
                <div key={cat} className={`p-4 rounded-lg border ${CATEGORY_COLORS[cat]}`}>
                  <div className="font-semibold text-sm mb-2">{CATEGORY_LABELS[cat]}</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Media mensile:</span>
                      <div className="font-bold text-lg">{avg.toFixed(1)}%</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Sopravvivenza annua:</span>
                      <div className="font-bold text-lg text-green-700">{annualSurvival.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
