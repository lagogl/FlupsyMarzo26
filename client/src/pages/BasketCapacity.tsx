import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Scale, Wand2, Save, Info } from "lucide-react";

interface CapacityRow {
  sizeId: number;
  code: string;
  name: string;
  color: string | null;
  minAnimalsPerKg: number | null;
  maxAnimalsPerKg: number | null;
  maxAnimals: number | null;
  maxWeightGrams: number | null;
  suggestedMaxAnimals: number | null;
  suggestedMaxWeightGrams: number | null;
}

interface RowState {
  maxAnimals: string;
  maxWeightKg: string;
}

const fmtInt = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("it-IT").format(Math.round(n));

const gramsToKgStr = (g: number | null | undefined) =>
  g == null ? "" : String(Math.round((g / 1000) * 100) / 100);

export default function BasketCapacity() {
  const { toast } = useToast();
  const { data, isLoading } = useQuery<CapacityRow[]>({
    queryKey: ["/api/basket-capacity"],
  });

  const [rows, setRows] = useState<Record<number, RowState>>({});

  // Inizializza lo stato editabile quando arrivano i dati.
  // I campi vuoti vengono pre-compilati con i suggerimenti dai dati storici.
  useEffect(() => {
    if (!data) return;
    const next: Record<number, RowState> = {};
    for (const r of data) {
      const animals = r.maxAnimals != null ? r.maxAnimals : r.suggestedMaxAnimals;
      const weightG = r.maxWeightGrams != null ? r.maxWeightGrams : r.suggestedMaxWeightGrams;
      next[r.sizeId] = {
        maxAnimals: animals != null ? String(animals) : "",
        maxWeightKg: weightG != null ? gramsToKgStr(weightG) : "",
      };
    }
    setRows(next);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: { capacities: Array<{ sizeId: number; maxAnimals: number | null; maxWeightGrams: number | null }> }) => {
      return apiRequest("/api/basket-capacity", "POST", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/basket-capacity"] });
      toast({ title: "Capacità salvate", description: "Le capacità massime per taglia sono state aggiornate." });
    },
    onError: (err: any) => {
      toast({ title: "Errore", description: err?.message || "Impossibile salvare le capacità", variant: "destructive" });
    },
  });

  const setField = (sizeId: number, field: keyof RowState, value: string) => {
    setRows((prev) => ({ ...prev, [sizeId]: { ...prev[sizeId], [field]: value } }));
  };

  // Riempie tutti i campi con i suggerimenti dai dati storici (sovrascrive i valori correnti)
  const applySuggestions = () => {
    if (!data) return;
    const next: Record<number, RowState> = {};
    for (const r of data) {
      next[r.sizeId] = {
        maxAnimals: r.suggestedMaxAnimals != null ? String(r.suggestedMaxAnimals) : "",
        maxWeightKg: r.suggestedMaxWeightGrams != null ? gramsToKgStr(r.suggestedMaxWeightGrams) : "",
      };
    }
    setRows(next);
    toast({ title: "Pre-compilato dai dati storici", description: "Controlla i valori e premi Salva per confermare." });
  };

  const handleSave = () => {
    if (!data) return;
    const capacities = data.map((r) => {
      const st = rows[r.sizeId] || { maxAnimals: "", maxWeightKg: "" };
      const animals = st.maxAnimals.trim() === "" ? null : Math.round(Number(st.maxAnimals.replace(",", ".")));
      const kg = st.maxWeightKg.trim() === "" ? null : Number(st.maxWeightKg.replace(",", "."));
      const grams = kg == null || !Number.isFinite(kg) ? null : Math.round(kg * 1000);
      return {
        sizeId: r.sizeId,
        maxAnimals: animals != null && Number.isFinite(animals) ? animals : null,
        maxWeightGrams: grams,
      };
    });
    saveMutation.mutate({ capacities });
  };

  const configuredCount = useMemo(() => {
    if (!data) return 0;
    return data.filter((r) => {
      const st = rows[r.sizeId];
      return st && (st.maxAnimals.trim() !== "" || st.maxWeightKg.trim() !== "");
    }).length;
  }, [data, rows]);

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      <div className="flex items-center gap-3 mb-2">
        <Scale className="h-7 w-7 text-blue-600" />
        <h1 className="text-2xl font-bold">Capacità massima per taglia</h1>
      </div>
      <p className="text-muted-foreground mb-6">
        Imposta, per ogni taglia, la capacità massima di una cesta. Puoi indicare un limite di{" "}
        <strong>numero di animali</strong> e/o un limite di <strong>peso</strong>. L'allarme di
        sovraccarico scatta appena viene raggiunto il <strong>primo dei due limiti</strong>. Lascia
        vuoto un campo se non vuoi quel limite.
      </p>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Tabella capacità</CardTitle>
            <CardDescription>
              Taglie configurate: <strong>{configuredCount}</strong>
              {data ? ` su ${data.length}` : ""}
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" onClick={applySuggestions} disabled={isLoading || !data}>
              <Wand2 className="h-4 w-4 mr-2" />
              Pre-compila dai dati storici
            </Button>
            <Button onClick={handleSave} disabled={isLoading || saveMutation.isPending || !data}>
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Salvataggio…" : "Salva"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-blue-50 border border-blue-100 rounded-md p-3 mb-4">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
            <span>
              I valori suggeriti tra parentesi sono i <strong>massimi realmente raggiunti</strong> in
              passato per quella taglia. Servono come punto di partenza: correggili secondo la tua
              esperienza prima di salvare.
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Taglia</th>
                    <th className="py-2 px-2 font-medium">Max animali</th>
                    <th className="py-2 px-2 font-medium">Max peso (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.map((r) => {
                    const st = rows[r.sizeId] || { maxAnimals: "", maxWeightKg: "" };
                    return (
                      <tr key={r.sizeId} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: r.color || "#cbd5e1" }}
                            />
                            <span className="font-medium">{r.code}</span>
                          </div>
                          {r.minAnimalsPerKg != null && r.maxAnimalsPerKg != null && (
                            <div className="text-xs text-muted-foreground">
                              {fmtInt(r.minAnimalsPerKg)}–{fmtInt(r.maxAnimalsPerKg)}/kg
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2 align-top">
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            placeholder="nessun limite"
                            value={st.maxAnimals}
                            onChange={(e) => setField(r.sizeId, "maxAnimals", e.target.value)}
                            className="w-40"
                          />
                          {r.suggestedMaxAnimals != null && (
                            <div className="text-xs text-muted-foreground mt-1">
                              storico: {fmtInt(r.suggestedMaxAnimals)}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2 align-top">
                          <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.1"
                            placeholder="nessun limite"
                            value={st.maxWeightKg}
                            onChange={(e) => setField(r.sizeId, "maxWeightKg", e.target.value)}
                            className="w-40"
                          />
                          {r.suggestedMaxWeightGrams != null && (
                            <div className="text-xs text-muted-foreground mt-1">
                              storico: {gramsToKgStr(r.suggestedMaxWeightGrams)} kg
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
