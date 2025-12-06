import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { lotSchema } from "@shared/schema";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Definire un'interfaccia per le dimensioni
interface Size {
  id: number;
  code: string;
  name: string;
  minAnimalsPerKg?: number;
  maxAnimalsPerKg?: number;
  color?: string;
}

// Creare un modello di form
const formSchema = z.object({
  arrivalDate: z.string(),  // Semplifico da date a string
  supplier: z.string().min(1, "Il nome del fornitore è obbligatorio"),
  supplierLotNumber: z.string().optional(),
  quality: z.string().default("normali"),
  animalCount: z.number().int().optional().nullable(),
  weight: z.number().optional().nullable(),
  sizeId: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  state: z.string().optional(),
  // Nuovi campi per il calcolo automatico
  sampleWeight: z.number().min(0).optional().nullable(), // Peso del campione in grammi
  sampleCount: z.number().int().optional().nullable(), // Numero di animali nel campione
});

export type FormValues = z.infer<typeof formSchema>;

interface LotFormProps {
  onSubmit: (values: FormValues) => void;
  defaultValues?: Partial<FormValues>;
  isLoading?: boolean;
  isEditing?: boolean;
}

export default function LotFormNew({ 
  onSubmit, 
  defaultValues,
  isLoading = false,
  isEditing = false
}: LotFormProps) {
  
  // Assicuriamo che i valori di default includano sempre la qualità normali
  const finalDefaultValues = {
    arrivalDate: new Date().toISOString().split('T')[0],
    quality: "normali",
    ...defaultValues,
  };
  // Fetch sizes for dropdown
  const { data: sizes = [] } = useQuery<Size[]>({
    queryKey: ['/api/sizes'],
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: finalDefaultValues,
  });
  
  // Stato per i calcoli automatici
  const [totalWeightGrams, setTotalWeightGrams] = useState<number | null>(null);
  const [calculatedTotalAnimals, setCalculatedTotalAnimals] = useState<number | null>(null);
  const [suggestedSizeId, setSuggestedSizeId] = useState<number | null>(null);
  const [manualPiecesPerKg, setManualPiecesPerKg] = useState<number | null>(null);
  
  // Toggle per modalità manuale
  const [isManualMode, setIsManualMode] = useState(false);
  
  // Funzioni di calcolo
  const calculatePiecesPerKg = (count: number, weightGrams: number): number => {
    return Math.round(count / (weightGrams / 1000));
  };
  
  const calculateTotalAnimals = (weightGrams: number, piecesPerKg: number): number => {
    return Math.round(weightGrams * (piecesPerKg / 1000));
  };
  
  // Funzione per determinare la taglia in base ai pezzi per kg
  // Usa i dati reali dalla tabella sizes invece di valori hardcoded
  const determineSizeId = (piecesPerKg: number): number | null => {
    if (!sizes || sizes.length === 0 || !piecesPerKg) return null;
    
    console.log(`Determinazione taglia per ${piecesPerKg} pezzi/kg`);
    
    // Usa direttamente i dati dalla tabella sizes
    // I campi sono: minAnimalsPerKg, maxAnimalsPerKg (camelCase dal backend)
    const matchingSize = sizes.find(size => {
      const min = size.minAnimalsPerKg || size.min_animals_per_kg;
      const max = size.maxAnimalsPerKg || size.max_animals_per_kg;
      return min && max && piecesPerKg >= min && piecesPerKg <= max;
    });
    
    if (matchingSize) {
      const min = matchingSize.minAnimalsPerKg || matchingSize.min_animals_per_kg;
      const max = matchingSize.maxAnimalsPerKg || matchingSize.max_animals_per_kg;
      console.log(`Taglia trovata dal database: ${matchingSize.code} (${min}-${max})`);
      return matchingSize.id;
    }
    
    // Se nessuna taglia corrisponde esattamente, usiamo una logica fallback
    console.log("Nessuna taglia trovata nel range esatto, usando logica fallback");
    
    // Ordina le taglie per valore minimo (crescente)
    const taglieOrdinate = [...sizes]
      .filter(s => (s.minAnimalsPerKg || s.min_animals_per_kg) && (s.maxAnimalsPerKg || s.max_animals_per_kg))
      .sort((a, b) => {
        const aMin = a.minAnimalsPerKg || a.min_animals_per_kg || 0;
        const bMin = b.minAnimalsPerKg || b.min_animals_per_kg || 0;
        return aMin - bMin;
      });
    
    if (taglieOrdinate.length === 0) {
      console.log("Nessuna taglia valida trovata nel database");
      return null;
    }
    
    const firstSize = taglieOrdinate[0];
    const lastSize = taglieOrdinate[taglieOrdinate.length - 1];
    const firstMin = firstSize.minAnimalsPerKg || firstSize.min_animals_per_kg || 0;
    const lastMax = lastSize.maxAnimalsPerKg || lastSize.max_animals_per_kg || 0;
    
    // Se il valore è inferiore al minimo della taglia più piccola, usa quella
    if (piecesPerKg < firstMin) {
      console.log(`Valore troppo piccolo (${piecesPerKg} < ${firstMin}), usando la taglia più piccola: ${firstSize.code}`);
      return firstSize.id;
    }
    
    // Se il valore è maggiore del massimo della taglia più grande, usa quella
    if (piecesPerKg > lastMax) {
      console.log(`Valore troppo grande (${piecesPerKg} > ${lastMax}), usando la taglia più grande: ${lastSize.code}`);
      return lastSize.id;
    }
    
    // Fallback finale - usa TP-1000 se tutto fallisce
    const fallbackSize = sizes.find(s => s.code === "TP-1000");
    console.log(`Impossibile determinare la taglia, usando fallback: TP-1000`);
    return fallbackSize?.id || null;
  };
  
  // Monitorare i cambiamenti nei campi e aggiornare i calcoli
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      // Modalità automatica
      if (!isManualMode) {
        // Se cambiano i valori del campione, aggiorna i pezzi per kg
        if (name === "sampleWeight" || name === "sampleCount") {
          const sampleWeight = form.getValues("sampleWeight");
          const sampleCount = form.getValues("sampleCount");
          
          if (sampleWeight && sampleCount) {
            // Calcola pezzi per kg
            const piecesPerKg = calculatePiecesPerKg(sampleCount, sampleWeight);
            form.setValue("weight", piecesPerKg);
            
            // Determina la taglia in base ai pezzi per kg e aggiorna il campo
            const autoSizeId = determineSizeId(piecesPerKg);
            setSuggestedSizeId(autoSizeId);
            if (autoSizeId) {
              form.setValue("sizeId", autoSizeId);
            }
            
            // Se è presente anche il peso totale, calcola gli animali totali
            if (totalWeightGrams) {
              const totalAnimals = calculateTotalAnimals(totalWeightGrams, piecesPerKg);
              setCalculatedTotalAnimals(totalAnimals);
              
              // Aggiorna animalCount con il valore calcolato
              setTimeout(() => {
                form.setValue("animalCount", totalAnimals);
              }, 50);
            }
          }
        }
        
        // Se viene aggiornato il peso per kg manualmente, aggiorna anche la taglia suggerita
        if (name === "weight") {
          const piecesPerKg = form.getValues("weight");
          if (piecesPerKg) {
            const autoSizeId = determineSizeId(piecesPerKg);
            setSuggestedSizeId(autoSizeId);
            if (autoSizeId) {
              form.setValue("sizeId", autoSizeId);
            }
          }
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, totalWeightGrams, sizes, isManualMode]);
  
  // Gestione calcoli modalità manuale
  useEffect(() => {
    if (isManualMode && manualPiecesPerKg && totalWeightGrams) {
      // Calcola taglia automaticamente
      const autoSizeId = determineSizeId(manualPiecesPerKg);
      setSuggestedSizeId(autoSizeId);
      if (autoSizeId) {
        form.setValue("sizeId", autoSizeId);
      }
      
      // Calcola numero totale animali
      const totalAnimals = calculateTotalAnimals(totalWeightGrams, manualPiecesPerKg);
      setCalculatedTotalAnimals(totalAnimals);
      form.setValue("animalCount", totalAnimals);
      form.setValue("weight", manualPiecesPerKg);
    }
  }, [isManualMode, manualPiecesPerKg, totalWeightGrams, sizes]);
  
  // Funzione per il submit che gestisce i calcoli finali
  const handleSubmit = (data: FormValues) => {
    // Assicurati che i calcoli finali siano inclusi nei dati inviati
    if (calculatedTotalAnimals !== null) {
      data.animalCount = calculatedTotalAnimals;
    }
    
    // Importante: aggiorna il campo weight con il peso totale in grammi
    if (totalWeightGrams !== null) {
      data.weight = totalWeightGrams;
    }
    
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="mx-auto">
        <div className="flex flex-col space-y-5">
          {/* Prima riga: allineata come nell'ultimo screenshot */}
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-4 mb-1">
              <div>
                <div className="text-sm font-medium">Data Arrivo</div>
              </div>
              <div>
                <div className="text-sm font-medium">Fornitore</div>
              </div>
              <div>
                <div className="text-sm font-medium">N. Lotto Fornitore</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="arrivalDate"
                render={({ field }) => (
                  <FormItem className="m-0 p-0">
                    <FormControl>
                      <Input type="date" {...field} className="text-sm h-9 w-full" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem className="m-0 p-0">
                    <FormControl>
                      <Input placeholder="Nome fornitore" {...field} className="text-sm h-9 w-full" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplierLotNumber"
                render={({ field }) => {
                  const supplier = form.watch("supplier") || "";
                  const isZeelandSupplier = supplier === "Zeeland" || supplier === "Ecotapes Zeeland";
                  
                  return (
                    <FormItem className="m-0 p-0">
                      <FormControl>
                        <Input 
                          placeholder="Numero lotto" 
                          {...field}
                          className="text-sm h-9 w-full"
                        />
                      </FormControl>
                      {isZeelandSupplier && <p className="text-xs text-red-500 mt-1">* Richiesto per Zeeland</p>}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>
          </div>
          
          {/* Seconda riga: Qualità */}
          <div>
            <FormField
              control={form.control}
              name="quality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Qualità</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value || "normali"}
                      className="flex space-x-6 pt-1"
                    >
                      <div className="flex items-center">
                        <RadioGroupItem value="teste" id="quality-teste" />
                        <Label htmlFor="quality-teste" className="ml-1.5 flex items-center cursor-pointer text-sm">
                          <span>Teste</span>
                          <span className="text-yellow-500 ml-1">★★★</span>
                        </Label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="normali" id="quality-normali" />
                        <Label htmlFor="quality-normali" className="ml-1.5 flex items-center cursor-pointer text-sm">
                          <span>Normali</span>
                          <span className="text-yellow-500 ml-1">★★</span>
                        </Label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="code" id="quality-code" />
                        <Label htmlFor="quality-code" className="ml-1.5 flex items-center cursor-pointer text-sm">
                          <span>Tails</span>
                          <span className="text-yellow-500 ml-1">★</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Toggle per modalità di calcolo */}
          <div className="flex items-center space-x-3 pt-2 pb-1">
            <Switch
              id="manual-mode"
              checked={isManualMode}
              onCheckedChange={setIsManualMode}
              data-testid="switch-manual-mode"
            />
            <Label htmlFor="manual-mode" className="text-sm font-medium cursor-pointer">
              {isManualMode ? "Inserimento Manuale" : "Calcolo Automatico"}
            </Label>
          </div>

          {/* Sezione per i calcoli automatici - allineata secondo lo screenshot */}
          <div className="flex items-start">
            <div className="w-full">
              <div className="flex flex-col space-y-2 mb-3">
                <div className="text-sm font-medium">
                  {isManualMode ? "Inserimento Manuale" : "Calcolo automatico"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {isManualMode 
                    ? "Inserisci pezzi per kg e peso totale per calcolare automaticamente taglia e numero animali"
                    : "Inserisci peso e pezzi campione per calcolare automaticamente i totali"
                  }
                </div>
              </div>
            </div>
          </div>
          
          {/* Campi di input - cambiano in base alla modalità */}
          {!isManualMode ? (
            // MODALITÀ AUTOMATICA
            <div className="flex space-x-4">
              {/* Primo campo - Peso Campione */}
              <div className="w-1/3">
                <FormField
                  control={form.control}
                  name="sampleWeight"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm font-medium">Peso Campione (g)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          min="0"
                          inputMode="decimal"
                          placeholder="Peso campione"
                          data-testid="input-sample-weight"
                          {...field}
                          value={field.value === null ? '' : field.value}
                          onChange={(e) => {
                            const rawValue = e.target.value;
                            if (!rawValue) {
                              field.onChange(null);
                              return;
                            }
                            
                            const numValue = parseFloat(rawValue);
                            if (!isNaN(numValue) && numValue >= 0) {
                              field.onChange(numValue);
                            }
                          }}
                          className="text-sm h-9 bg-white w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Secondo campo - N° Animali Campione */}
              <div className="w-1/3">
                <FormField
                  control={form.control}
                  name="sampleCount"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm font-medium">N° Animali Campione</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="0"
                          step="1"
                          placeholder="N° animali"
                          data-testid="input-sample-count"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            const rawValue = e.target.value;
                            if (!rawValue) {
                              field.onChange(null);
                              return;
                            }
                            
                            const numValue = parseInt(rawValue, 10);
                            if (!isNaN(numValue) && numValue >= 0) {
                              field.onChange(numValue);
                            }
                          }}
                          className="text-sm h-9 bg-white w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Terzo campo - Peso Totale */}
              <div className="w-1/3">
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-sm font-medium">Peso Totale (g)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      placeholder="Peso totale"
                      data-testid="input-total-weight"
                      value={totalWeightGrams || ""}
                      onChange={(e) => {
                        const rawValue = e.target.value;
                        if (!rawValue) {
                          setTotalWeightGrams(null);
                          return;
                        }
                        
                        const numValue = parseFloat(rawValue);
                        if (!isNaN(numValue) && numValue >= 0) {
                          setTotalWeightGrams(numValue);
                          
                          // Se abbiamo già un valore per pezzi per kg, calcola il totale animali
                          const piecesPerKg = form.getValues("weight");
                          if (numValue && piecesPerKg) {
                            const totalAnimals = calculateTotalAnimals(numValue, piecesPerKg);
                            setCalculatedTotalAnimals(totalAnimals);
                            form.setValue("animalCount", totalAnimals);
                          }
                        }
                      }}
                      className="text-sm h-9 bg-white w-full"
                    />
                  </FormControl>
                </FormItem>
              </div>
            </div>
          ) : (
            // MODALITÀ MANUALE
            <div className="flex space-x-4">
              {/* Primo campo - Pezzi per Kg (editabile) */}
              <div className="w-1/2">
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-sm font-medium">Pezzi per Kg</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Es. 250000"
                      data-testid="input-manual-pieces-per-kg"
                      value={manualPiecesPerKg || ""}
                      onChange={(e) => {
                        const rawValue = e.target.value;
                        if (!rawValue) {
                          setManualPiecesPerKg(null);
                          return;
                        }
                        
                        const numValue = parseInt(rawValue, 10);
                        if (!isNaN(numValue) && numValue >= 0) {
                          setManualPiecesPerKg(numValue);
                        }
                      }}
                      className="text-sm h-9 bg-white w-full"
                    />
                  </FormControl>
                </FormItem>
              </div>
              
              {/* Secondo campo - Peso Totale */}
              <div className="w-1/2">
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-sm font-medium">Peso Totale (g)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      placeholder="Peso totale"
                      data-testid="input-manual-total-weight"
                      value={totalWeightGrams || ""}
                      onChange={(e) => {
                        const rawValue = e.target.value;
                        if (!rawValue) {
                          setTotalWeightGrams(null);
                          return;
                        }
                        
                        const numValue = parseFloat(rawValue);
                        if (!isNaN(numValue) && numValue >= 0) {
                          setTotalWeightGrams(numValue);
                        }
                      }}
                      className="text-sm h-9 bg-white w-full"
                    />
                  </FormControl>
                </FormItem>
              </div>
            </div>
          )}
          
          {/* Riquadro verde per i campi calcolati */}
          <div className="bg-green-50 p-3 rounded-md border border-green-100 mb-4">
            <div className="text-xs font-medium text-green-800 mb-2">Valori calcolati automaticamente</div>
            
            <div className="grid grid-cols-3 gap-4">
              {/* Taglia calcolata */}
              <FormField
                control={form.control}
                name="sizeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-green-800">Taglia (calcolata)</FormLabel>
                    <FormControl>
                      <Input 
                        type="text" 
                        placeholder="Calcolata automaticamente"
                        data-testid="display-calculated-size"
                        value={field.value !== null && field.value !== undefined 
                          ? (sizes.find(s => s.id === field.value)?.code || "") 
                          : ''}
                        readOnly
                        className="bg-white text-sm h-9 border-green-200"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Pezzi per kg calcolati (solo in modalità automatica) */}
              {!isManualMode && (
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-green-800">Pezzi per Kg</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          placeholder="Calcolato automaticamente"
                          data-testid="display-calculated-pieces-per-kg"
                          {...field}
                          value={field.value !== null && field.value !== undefined 
                            ? field.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") 
                            : ''}
                          readOnly
                          className="bg-white text-sm h-9 border-green-200"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
              
              {/* Animali totali calcolati */}
              <FormItem>
                <FormLabel className="text-sm text-green-800">N° Animali Totali</FormLabel>
                <FormControl>
                  <Input 
                    type="text" 
                    placeholder="Calcolato automaticamente"
                    data-testid="display-calculated-total-animals"
                    value={calculatedTotalAnimals !== null 
                      ? calculatedTotalAnimals.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") 
                      : ''}
                    readOnly
                    className="bg-white text-sm h-9 border-green-200"
                  />
                </FormControl>
              </FormItem>
            </div>
          </div>
          
          {/* Campo note */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Note</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Note opzionali" 
                    data-testid="textarea-notes"
                    {...field} 
                    value={field.value || ""}
                    className="text-sm resize-none h-20" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Pulsanti di azione */}
          <div className="flex justify-end space-x-2 mt-4">
            <Button 
              type="submit" 
              disabled={isLoading}
              data-testid="button-create-lot"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Creazione..." : "Crea Lotto"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
