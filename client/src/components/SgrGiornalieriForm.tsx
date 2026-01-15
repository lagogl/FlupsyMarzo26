import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { sgrGiornalieriSchema } from "@shared/schema";
import { z } from "zod";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SITI = ["Ca Pisani", "Delta Futuro"] as const;
const METEO_OPTIONS = [
  "Sole", "Nuvoloso", "Parzialmente nuvoloso", "Coperto", 
  "Pioggia leggera", "Pioggia", "Temporale", "Nebbia", 
  "Vento forte", "Neve", "Grandine"
] as const;

const formSchema = sgrGiornalieriSchema.extend({
  recordDate: z.coerce.date().default(new Date()),
  temperature: z.coerce.number().min(0).max(50).optional().nullable(),
  pH: z.coerce.number().min(0).max(14).optional().nullable(),
  ammonia: z.coerce.number().min(0).max(10).optional().nullable(),
  oxygen: z.coerce.number().min(0).max(30).optional().nullable(),
  salinity: z.coerce.number().min(0).max(50).optional().nullable(),
  airTempMin: z.coerce.number().min(-20).max(50).optional().nullable(),
  airTempMax: z.coerce.number().min(-20).max(60).optional().nullable(),
  waterTemperature: z.coerce.number().min(0).max(50).optional().nullable(),
  secchiDisk: z.coerce.number().min(0).max(20).optional().nullable(),
  microalgaeConcentration: z.coerce.number().min(0).optional().nullable(),
  nh3: z.coerce.number().min(0).max(10).optional().nullable(),
  meteo: z.string().optional().nullable(),
  waterColor: z.string().optional().nullable(),
  microalgaeSpecies: z.string().optional().nullable(),
  mortality: z.string().optional().nullable(),
  site: z.string().optional().nullable(),
  operatorName: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface SgrGiornalieriFormProps {
  onSubmit: (values: FormValues) => void;
  defaultValues?: Partial<FormValues>;
  isLoading?: boolean;
}

export default function SgrGiornalieriForm({ 
  onSubmit, 
  defaultValues = {
    recordDate: new Date(),
    temperature: null, pH: null, ammonia: null, oxygen: null, salinity: null,
    airTempMin: null, airTempMax: null, waterTemperature: null, secchiDisk: null,
    microalgaeConcentration: null, nh3: null, meteo: "", waterColor: "",
    microalgaeSpecies: "", mortality: "", site: "", operatorName: "", notes: ""
  }, 
  isLoading = false 
}: SgrGiornalieriFormProps) {
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const handleFormSubmit = (values: FormValues) => {
    try {
      onSubmit(values);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio.",
        variant: "destructive"
      });
    }
  };

  const NumField = ({ name, label, step = "0.1", placeholder }: { name: keyof FormValues; label: string; step?: string; placeholder?: string }) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-1">
          <FormLabel className="text-xs">{label}</FormLabel>
          <FormControl>
            <Input 
              type="number" 
              step={step}
              placeholder={placeholder}
              className="h-8 text-sm"
              {...field}
              value={field.value === null || field.value === undefined ? '' : field.value}
              onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const TextField = ({ name, label, placeholder }: { name: keyof FormValues; label: string; placeholder?: string }) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-1">
          <FormLabel className="text-xs">{label}</FormLabel>
          <FormControl>
            <Input 
              placeholder={placeholder}
              className="h-8 text-sm"
              {...field}
              value={field.value || ''}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-3">
        <h3 className="text-lg font-semibold">Registrazione parametri giornalieri</h3>
        <p className="text-xs text-muted-foreground">Tutti i campi sono opzionali</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="recordDate"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs">Data e ora</FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local"
                      className="h-8 text-sm"
                      {...field}
                      value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                      onChange={e => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="site"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs">Sito</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Seleziona sito" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SITI.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <TextField name="operatorName" label="Operatore" placeholder="Nome" />
          </div>

          <div className="grid grid-cols-5 gap-2">
            <NumField name="temperature" label="Temp. Acqua (°C)" placeholder="22.5" />
            <NumField name="waterTemperature" label="Temp. Acqua 2 (°C)" placeholder="22" />
            <NumField name="airTempMin" label="Aria Min (°C)" placeholder="15" />
            <NumField name="airTempMax" label="Aria Max (°C)" placeholder="28" />
            <FormField
              control={form.control}
              name="meteo"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs">Meteo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Condizioni" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {METEO_OPTIONS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-5 gap-2">
            <NumField name="salinity" label="Salinità (‰)" placeholder="35" />
            <NumField name="pH" label="pH" placeholder="7.8" />
            <NumField name="oxygen" label="Ossigeno (mg/L)" placeholder="8.5" />
            <NumField name="secchiDisk" label="Secchi (m)" placeholder="2.5" />
            <TextField name="waterColor" label="Colore Acqua" placeholder="Verde" />
          </div>

          <div className="grid grid-cols-5 gap-2">
            <NumField name="ammonia" label="Ammoniaca (mg/L)" step="0.01" placeholder="0.03" />
            <NumField name="nh3" label="NH3 (mg/L)" step="0.001" placeholder="0.01" />
            <NumField name="microalgaeConcentration" label="Microalghe (cell/ml)" step="1000" placeholder="50000" />
            <TextField name="microalgaeSpecies" label="Specie Alghe" placeholder="Diatomee" />
            <TextField name="mortality" label="Mortalità" placeholder="Bassa" />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs">Note</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Note aggiuntive..."
                    rows={2}
                    className="text-sm resize-none"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full h-9" disabled={isLoading}>
            {isLoading ? "Salvataggio..." : "Salva dati giornalieri"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
