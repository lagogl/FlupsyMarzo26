import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, CheckCircle, Clock, AlertCircle, Users, Package } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

const taskFormSchema = z.object({
  taskType: z.string().min(1, "Tipo attività richiesto"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

const priorityColors = {
  low: "bg-slate-500",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

const statusColors = {
  pending: "bg-gray-500",
  assigned: "bg-blue-500",
  in_progress: "bg-yellow-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
};

const priorityLabels = {
  low: "Bassa",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};

const statusLabels = {
  pending: "In attesa",
  assigned: "Assegnata",
  in_progress: "In corso",
  completed: "Completata",
  cancelled: "Annullata",
};

export default function TaskManagement() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [selectedSelectionId, setSelectedSelectionId] = useState<number | null>(null);

  // Query selections
  const { data: selections, isLoading: loadingSelections } = useQuery({
    queryKey: ['/api/selections'],
  });

  // Query operators
  const { data: operators } = useQuery({
    queryKey: ['/api/operators'],
    queryFn: () => apiRequest('/api/operators?active=true'),
  });

  // Query tasks
  const { data: tasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['/api/tasks'],
  });

  // Form for creating tasks
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      priority: "medium",
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (data: TaskFormData & { selectionId: number }) =>
      apiRequest(`/api/selections/${data.selectionId}/tasks`, 'POST', data),
    onSuccess: () => {
      toast({
        title: "Successo",
        description: "Attività creata con successo",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore nella creazione dell'attività",
        variant: "destructive",
      });
    },
  });

  const handleCreateTask = (data: TaskFormData) => {
    if (!selectedSelectionId) {
      toast({
        title: "Errore",
        description: "Seleziona una selezione",
        variant: "destructive",
      });
      return;
    }

    createTaskMutation.mutate({
      ...data,
      selectionId: selectedSelectionId,
    });
  };

  const getTasksBySelection = (selectionId: number) => {
    if (!tasks) return [];
    return tasks.filter((t: any) => t.selectionId === selectionId);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestione Attività</h1>
          <p className="text-muted-foreground">
            Crea e assegna attività agli operatori per le selezioni avanzate
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-create-task">
              <Plus className="h-4 w-4" />
              Nuova Attività
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crea Nuova Attività</DialogTitle>
              <DialogDescription>
                Compila i dettagli dell'attività da assegnare agli operatori
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateTask)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="taskType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo Attività</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger data-testid="select-task-type">
                            <SelectValue placeholder="Seleziona tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pulizia">Pulizia</SelectItem>
                            <SelectItem value="pesatura">Pesatura</SelectItem>
                            <SelectItem value="vagliatura">Vagliatura</SelectItem>
                            <SelectItem value="trasferimento">Trasferimento</SelectItem>
                            <SelectItem value="controllo">Controllo Qualità</SelectItem>
                            <SelectItem value="altro">Altro</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Selezione</FormLabel>
                  <Select
                    onValueChange={(value) => setSelectedSelectionId(parseInt(value))}
                    value={selectedSelectionId?.toString()}
                  >
                    <SelectTrigger data-testid="select-selection">
                      <SelectValue placeholder="Seleziona selezione" />
                    </SelectTrigger>
                    <SelectContent>
                      {selections?.map((s: any) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          Selezione #{s.selectionNumber} - {format(new Date(s.date), 'dd/MM/yyyy')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrizione</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Descrivi l'attività in dettaglio"
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
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger data-testid="select-priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Bassa</SelectItem>
                            <SelectItem value="medium">Media</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="urgent">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
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
                          data-testid="input-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Annulla
                  </Button>
                  <Button
                    type="submit"
                    disabled={createTaskMutation.isPending}
                    data-testid="button-submit-task"
                  >
                    {createTaskMutation.isPending ? "Creazione..." : "Crea Attività"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {loadingTasks ? (
        <div>Caricamento attività...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Attività
            </CardTitle>
            <CardDescription>
              Elenco di tutte le attività create per le selezioni
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrizione</TableHead>
                  <TableHead>Selezione</TableHead>
                  <TableHead>Priorità</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Scadenza</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks && tasks.length > 0 ? (
                  tasks.map((task: any) => (
                    <TableRow key={task.id} data-testid={`task-row-${task.id}`}>
                      <TableCell className="font-mono">{task.id}</TableCell>
                      <TableCell className="capitalize">{task.taskType}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {task.description || "-"}
                      </TableCell>
                      <TableCell>#{task.selectionId}</TableCell>
                      <TableCell>
                        <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                          {priorityLabels[task.priority as keyof typeof priorityLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[task.status as keyof typeof statusColors]}>
                          {statusLabels[task.status as keyof typeof statusLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {task.dueDate ? format(new Date(task.dueDate), 'dd/MM/yyyy') : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTask(task.id)}
                          data-testid={`button-view-task-${task.id}`}
                        >
                          Dettagli
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Nessuna attività trovata. Crea la prima attività!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
