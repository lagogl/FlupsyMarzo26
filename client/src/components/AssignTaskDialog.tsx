import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const taskSchema = z.object({
  taskType: z.string().min(1, "Tipo attività richiesto"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  cadence: z.string().optional(),
  cadenceInterval: z.number().min(1).optional(),
  operatorIds: z.array(z.number()).optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface AssignTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBasketIds: number[];
  onSuccess?: () => void;
}

export function AssignTaskDialog({ 
  open, 
  onOpenChange, 
  selectedBasketIds,
  onSuccess 
}: AssignTaskDialogProps) {
  const { toast } = useToast();
  const [showCadence, setShowCadence] = useState(false);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      taskType: "",
      description: "",
      priority: "medium",
      dueDate: "",
      notes: "",
      cadence: undefined,
      cadenceInterval: 1,
      operatorIds: [],
    },
  });

  const { data: operators = [] } = useQuery<any[]>({
    queryKey: ["/api/operators"],
    enabled: open,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      return apiRequest("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          basketIds: selectedBasketIds,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Attività creata",
        description: `Attività assegnata a ${selectedBasketIds.length} ceste`,
      });
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare l'attività",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TaskFormData) => {
    createTaskMutation.mutate(data);
  };

  const taskTypes = [
    { value: "pulizia", label: "Pulizia" },
    { value: "pesatura", label: "Pesatura" },
    { value: "vagliatura", label: "Vagliatura" },
    { value: "trasferimento", label: "Trasferimento" },
    { value: "controllo", label: "Controllo qualità" },
    { value: "manutenzione", label: "Manutenzione" },
  ];

  const cadenceTypes = [
    { value: "daily", label: "Giornaliera" },
    { value: "weekly", label: "Settimanale" },
    { value: "monthly", label: "Mensile" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assegna Attività</DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            Ceste selezionate: <strong>{selectedBasketIds.length}</strong>
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="taskType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo Attività *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-task-type">
                        <SelectValue placeholder="Seleziona tipo attività" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {taskTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Descrizione dell'attività"
                      data-testid="input-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priorità</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-priority">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Bassa</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scadenza</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="date"
                      data-testid="input-due-date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>Cadenza ricorrente</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCadence(!showCadence)}
                  data-testid="button-toggle-cadence"
                >
                  {showCadence ? "Rimuovi" : "Aggiungi"}
                </Button>
              </div>

              {showCadence && (
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
                  <FormField
                    control={form.control}
                    name="cadence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo cadenza</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-cadence-type">
                              <SelectValue placeholder="Seleziona" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cadenceTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cadenceInterval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intervallo</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min={1}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            placeholder="1"
                            data-testid="input-cadence-interval"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="operatorIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assegna operatori (opzionale)</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => {
                        const operatorId = parseInt(value);
                        const current = field.value || [];
                        if (!current.includes(operatorId)) {
                          field.onChange([...current, operatorId]);
                        }
                      }}
                    >
                      <SelectTrigger data-testid="select-operators">
                        <SelectValue placeholder="Seleziona operatori" />
                      </SelectTrigger>
                      <SelectContent>
                        {operators
                          .filter((op) => op.active)
                          .map((op) => (
                            <SelectItem key={op.id} value={op.id.toString()}>
                              {op.firstName} {op.lastName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  
                  {field.value && field.value.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {field.value.map((opId) => {
                        const operator = operators.find((o) => o.id === opId);
                        return operator ? (
                          <div
                            key={opId}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-sm"
                          >
                            {operator.firstName} {operator.lastName}
                            <button
                              type="button"
                              onClick={() => {
                                field.onChange(field.value?.filter((id) => id !== opId));
                              }}
                              className="hover:text-red-600"
                              data-testid={`remove-operator-${opId}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                  <FormMessage />
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
                      {...field}
                      placeholder="Note aggiuntive"
                      rows={3}
                      data-testid="textarea-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createTaskMutation.isPending}
                data-testid="button-cancel"
              >
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={createTaskMutation.isPending}
                data-testid="button-create-task"
              >
                {createTaskMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creazione...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Crea Attività
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
