import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  firstName: z.string().min(1, "Il nome è obbligatorio"),
  lastName: z.string().min(1, "Il cognome è obbligatorio"),
  email: z.string().email("Email non valida").optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.string().optional(),
  active: z.boolean().default(true),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface OperatorFormProps {
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
  initialData?: Partial<FormValues>;
  isLoading?: boolean;
}

export default function OperatorForm({ 
  onSubmit, 
  onCancel,
  initialData,
  isLoading = false
}: OperatorFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      role: initialData?.role || "",
      active: initialData?.active !== undefined ? initialData.active : true,
      notes: initialData?.notes || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Mario" 
                    {...field} 
                    data-testid="input-firstname"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cognome *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Rossi" 
                    {...field} 
                    data-testid="input-lastname"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder="mario.rossi@example.com" 
                    {...field} 
                    data-testid="input-email"
                  />
                </FormControl>
                <FormDescription>
                  Opzionale, per notifiche via email
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefono</FormLabel>
                <FormControl>
                  <Input 
                    type="tel"
                    placeholder="+39 123 456 7890" 
                    {...field} 
                    data-testid="input-phone"
                  />
                </FormControl>
                <FormDescription>
                  Opzionale
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ruolo</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Es: operatore, supervisore, tecnico" 
                  {...field} 
                  data-testid="input-role"
                />
              </FormControl>
              <FormDescription>
                Ruolo o mansione dell'operatore (opzionale)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="checkbox-active"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Operatore attivo
                </FormLabel>
                <FormDescription>
                  Disattiva per nascondere l'operatore dalle selezioni senza eliminarlo
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Note aggiuntive sull'operatore" 
                  {...field}
                  rows={3}
                  data-testid="textarea-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            variant="outline" 
            type="button" 
            onClick={onCancel}
            disabled={isLoading}
            data-testid="button-cancel"
          >
            Annulla
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            data-testid="button-submit"
          >
            {isLoading ? "Salvataggio..." : (initialData ? "Aggiorna" : "Crea Operatore")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
