import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle, Clock, AlertCircle, Users, Package, User, Inbox, Calendar, Hash, Trash2, CheckCheck } from "lucide-react";
import { format } from "date-fns";

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
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [taskToComplete, setTaskToComplete] = useState<number | null>(null);

  // Query operators
  const { data: operators } = useQuery({
    queryKey: ['/api/operators'],
    queryFn: () => apiRequest('/api/operators?active=true'),
  });

  // Query tasks
  const { data: tasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['/api/tasks'],
  });

  // Mutation per cancellare attività
  const deleteMutation = useMutation({
    mutationFn: (taskId: number) => 
      apiRequest(`/api/tasks/${taskId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Attività eliminata",
        description: "L'attività è stata eliminata con successo",
      });
      setTaskToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione dell'attività",
        variant: "destructive",
      });
    },
  });

  // Mutation per forzare completamento
  const completeMutation = useMutation({
    mutationFn: (taskId: number) => 
      apiRequest(`/api/tasks/${taskId}/complete`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Attività completata",
        description: "L'attività è stata forzata come completata",
      });
      setTaskToComplete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante il completamento dell'attività",
        variant: "destructive",
      });
    },
  });

  const getTasksBySelection = (selectionId: number) => {
    if (!tasks) return [];
    return tasks.filter((t: any) => t.selectionId === selectionId);
  };

  // Trova attività selezionata
  const selectedTaskData = tasks?.find((t: any) => t.id === selectedTask);

  const taskTypeLabels: Record<string, string> = {
    pesatura: "Pesatura",
    vagliatura: "Vagliatura",
    pulizia: "Pulizia",
    selezione: "Selezione",
    trasferimento: "Trasferimento",
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Monitoraggio Attività</h1>
        <p className="text-muted-foreground">
          Monitora lo stato delle attività assegnate agli operatori. Le attività vengono create dalla pagina Selezione Avanzata.
        </p>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead className="w-32">Tipo</TableHead>
                    <TableHead className="min-w-[200px]">Descrizione</TableHead>
                    <TableHead className="min-w-[250px]">Operatori Assegnati</TableHead>
                    <TableHead className="w-32">Cestelli</TableHead>
                    <TableHead className="w-24">Priorità</TableHead>
                    <TableHead className="min-w-[140px]">Stato</TableHead>
                    <TableHead className="w-32">Scadenza</TableHead>
                    <TableHead className="w-32">Ricorrenza</TableHead>
                    <TableHead className="w-24">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {tasks && tasks.length > 0 ? (
                  tasks.map((task: any) => {
                    const isCompleted = task.status === 'completed';
                    const assignedOperators = task.assignments || [];
                    const completedCount = assignedOperators.filter((a: any) => a.status === 'completed').length;
                    const baskets = task.baskets || [];
                    
                    return (
                      <TableRow 
                        key={task.id} 
                        data-testid={`task-row-${task.id}`}
                        className={isCompleted ? 'bg-green-50 dark:bg-green-950/20' : ''}
                      >
                        {/* ID */}
                        <TableCell className="font-mono">
                          <div className="flex items-center gap-2">
                            {task.id}
                            {isCompleted && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </TableCell>

                        {/* Tipo */}
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">
                              {taskTypeLabels[task.taskType] || task.taskType}
                            </span>
                            {task.createdAt && (
                              <span className="text-xs text-muted-foreground">
                                Creata: {format(new Date(task.createdAt), 'dd/MM/yy')}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Descrizione */}
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm">
                              {task.description || <span className="text-muted-foreground">Nessuna descrizione</span>}
                            </span>
                            {task.notes && (
                              <span className="text-xs text-muted-foreground italic">
                                Note: {task.notes.length > 50 ? task.notes.substring(0, 50) + '...' : task.notes}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Operatori Assegnati */}
                        <TableCell>
                          {assignedOperators.length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {assignedOperators.map((a: any) => (
                                <div key={a.id} className="flex items-center gap-2 p-2 bg-muted rounded border">
                                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {a.operatorFirstName} {a.operatorLastName}
                                    </p>
                                    {a.operatorEmail && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        {a.operatorEmail}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs ${a.status === 'completed' ? 'bg-green-100 text-green-800 border-green-300' : ''}`}
                                      >
                                        {statusLabels[a.status as keyof typeof statusLabels]}
                                      </Badge>
                                      {a.completedAt && (
                                        <span className="text-xs text-green-600">
                                          ✓ {format(new Date(a.completedAt), 'dd/MM HH:mm')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {completedCount > 0 && (
                                <div className="text-xs text-green-600 font-semibold mt-1">
                                  Progresso: {completedCount}/{assignedOperators.length} completati
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">Nessun operatore assegnato</span>
                          )}
                        </TableCell>

                        {/* Cestelli */}
                        <TableCell>
                          {baskets.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <Inbox className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  {baskets.length} {baskets.length === 1 ? 'cestello' : 'cestelli'}
                                </span>
                              </div>
                              <div className="text-xs space-y-1">
                                {baskets.slice(0, 3).map((b: any, i: number) => (
                                  <div key={b.id} className="flex items-center gap-1 flex-wrap">
                                    <Badge variant="outline" className="text-xs">
                                      {b.role === 'source' ? 'Orig' : 'Dest'}
                                    </Badge>
                                    <span className="font-medium">#{b.physicalNumber}</span>
                                    {b.flupsyName && (
                                      <span className="text-muted-foreground">
                                        - {b.flupsyName}
                                      </span>
                                    )}
                                  </div>
                                ))}
                                {baskets.length > 3 && (
                                  <span className="italic text-muted-foreground">+{baskets.length - 3} altri</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        {/* Priorità */}
                        <TableCell>
                          <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                            {priorityLabels[task.priority as keyof typeof priorityLabels]}
                          </Badge>
                        </TableCell>

                        {/* Stato */}
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge className={statusColors[task.status as keyof typeof statusColors]}>
                              {statusLabels[task.status as keyof typeof statusLabels]}
                            </Badge>
                            {task.completedAt && (
                              <span className="text-xs text-green-600 font-medium">
                                ✓ {format(new Date(task.completedAt), 'dd/MM/yy HH:mm')}
                              </span>
                            )}
                            {task.updatedAt && !task.completedAt && (
                              <span className="text-xs text-muted-foreground">
                                Agg: {format(new Date(task.updatedAt), 'dd/MM/yy')}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Scadenza */}
                        <TableCell>
                          {task.dueDate ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span className="text-sm font-medium">
                                  {format(new Date(task.dueDate), 'dd/MM/yyyy')}
                                </span>
                              </div>
                              {new Date(task.dueDate) < new Date() && task.status !== 'completed' && (
                                <Badge variant="destructive" className="text-xs">Scaduta</Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        {/* Ricorrenza */}
                        <TableCell>
                          {task.cadence ? (
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline" className="text-xs">
                                {task.cadence === 'daily' && 'Giornaliera'}
                                {task.cadence === 'weekly' && 'Settimanale'}
                                {task.cadence === 'monthly' && 'Mensile'}
                                {task.cadence === 'once' && 'Una volta'}
                              </Badge>
                              {task.cadenceInterval > 1 && (
                                <span className="text-xs text-muted-foreground">
                                  Ogni {task.cadenceInterval}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        {/* Azioni */}
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedTask(task.id)}
                              data-testid={`button-view-task-${task.id}`}
                            >
                              Dettagli
                            </Button>
                            
                            {/* Pulsante Forza Completamento (solo se non completata) */}
                            {task.status !== 'completed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setTaskToComplete(task.id)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                data-testid={`button-complete-task-${task.id}`}
                              >
                                <CheckCheck className="h-4 w-4" />
                              </Button>
                            )}

                            {/* Pulsante Elimina */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setTaskToDelete(task.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              data-testid={`button-delete-task-${task.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground">
                      Nessuna attività trovata. Le attività vengono create dalla pagina Selezione Avanzata.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog Dettagli Attività */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Dettagli Attività #{selectedTaskData?.id}
            </DialogTitle>
            <DialogDescription>
              Informazioni complete sull'attività e i suoi assegnamenti
            </DialogDescription>
          </DialogHeader>

          {selectedTaskData && (
            <div className="space-y-6">
              {/* Informazioni Generali */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Informazioni Generali
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-muted p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo Attività</p>
                    <p className="font-medium capitalize">
                      {taskTypeLabels[selectedTaskData.taskType] || selectedTaskData.taskType}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Priorità</p>
                    <Badge className={priorityColors[selectedTaskData.priority as keyof typeof priorityColors]}>
                      {priorityLabels[selectedTaskData.priority as keyof typeof priorityLabels]}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Stato</p>
                    <Badge className={statusColors[selectedTaskData.status as keyof typeof statusColors]}>
                      {statusLabels[selectedTaskData.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Scadenza</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {selectedTaskData.dueDate ? format(new Date(selectedTaskData.dueDate), 'dd/MM/yyyy') : "Nessuna scadenza"}
                    </p>
                  </div>
                  {selectedTaskData.description && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Descrizione</p>
                      <p className="font-medium">{selectedTaskData.description}</p>
                    </div>
                  )}
                  {selectedTaskData.cadence && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Ricorrenza</p>
                      <p className="font-medium capitalize">
                        {selectedTaskData.cadence === 'daily' && 'Giornaliera'}
                        {selectedTaskData.cadence === 'weekly' && 'Settimanale'}
                        {selectedTaskData.cadence === 'monthly' && 'Mensile'}
                        {selectedTaskData.cadence === 'once' && 'Una volta'}
                        {selectedTaskData.cadenceInterval > 1 && ` (ogni ${selectedTaskData.cadenceInterval})`}
                      </p>
                    </div>
                  )}
                  {selectedTaskData.notes && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Note</p>
                      <p className="font-medium text-sm">{selectedTaskData.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Operatori Assegnati */}
              {selectedTaskData.assignments && selectedTaskData.assignments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Operatori Assegnati ({selectedTaskData.assignments.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedTaskData.assignments.map((assignment: any) => (
                      <div 
                        key={assignment.id} 
                        className="flex items-center justify-between p-3 border rounded-lg bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {assignment.operatorFirstName} {assignment.operatorLastName}
                            </p>
                            {assignment.operatorEmail && (
                              <p className="text-sm text-muted-foreground">{assignment.operatorEmail}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={statusColors[assignment.status as keyof typeof statusColors]}>
                            {statusLabels[assignment.status as keyof typeof statusLabels]}
                          </Badge>
                          {assignment.assignedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Assegnato: {format(new Date(assignment.assignedAt), 'dd/MM/yyyy HH:mm')}
                            </p>
                          )}
                          {assignment.completedAt && (
                            <p className="text-xs text-green-600 mt-1">
                              Completato: {format(new Date(assignment.completedAt), 'dd/MM/yyyy HH:mm')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cestelli Coinvolti */}
              {selectedTaskData.baskets && selectedTaskData.baskets.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Inbox className="h-4 w-4" />
                      Cestelli Coinvolti ({selectedTaskData.baskets.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedTaskData.baskets.map((basket: any) => (
                        <div 
                          key={basket.id} 
                          className="p-3 border rounded-lg bg-card"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="capitalize">
                              {basket.role === 'source' ? 'Origine' : 'Destinazione'}
                            </Badge>
                            <span className="text-sm font-medium">
                              Cestello #{basket.physicalNumber}
                            </span>
                          </div>
                          <p className="text-sm">
                            <span className="font-medium">FLUPSY:</span> {basket.flupsyName || `ID ${basket.flupsyId}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Date */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Timeline
                </h3>
                <div className="space-y-2 text-sm">
                  {selectedTaskData.createdAt && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Creata:</span>
                      <span className="font-medium">
                        {format(new Date(selectedTaskData.createdAt), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                  )}
                  {selectedTaskData.updatedAt && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Aggiornata:</span>
                      <span className="font-medium">
                        {format(new Date(selectedTaskData.updatedAt), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                  )}
                  {selectedTaskData.completedAt && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-muted-foreground">Completata:</span>
                      <span className="font-medium text-green-600">
                        {format(new Date(selectedTaskData.completedAt), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <Button onClick={() => setSelectedTask(null)}>
              Chiudi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Conferma Eliminazione */}
      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro di voler eliminare questa attività?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. L'attività #{taskToDelete} e tutti i suoi assegnamenti verranno eliminati permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-task">Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => taskToDelete && deleteMutation.mutate(taskToDelete)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-delete-task"
            >
              {deleteMutation.isPending ? "Eliminazione..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Conferma Completamento */}
      <AlertDialog open={!!taskToComplete} onOpenChange={() => setTaskToComplete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Forza completamento attività</AlertDialogTitle>
            <AlertDialogDescription>
              Vuoi forzare il completamento dell'attività #{taskToComplete}? Questo segnerà l'attività come completata anche se non tutti gli operatori hanno completato la loro parte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-complete-task">Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => taskToComplete && completeMutation.mutate(taskToComplete)}
              className="bg-green-600 hover:bg-green-700"
              data-testid="confirm-complete-task"
            >
              {completeMutation.isPending ? "Completamento..." : "Completa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
