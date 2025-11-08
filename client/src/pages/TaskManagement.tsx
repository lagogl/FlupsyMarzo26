import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Clock, AlertCircle, Users, Package, User, Inbox, Calendar, Hash } from "lucide-react";
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

  // Query operators
  const { data: operators } = useQuery({
    queryKey: ['/api/operators'],
    queryFn: () => apiRequest('/api/operators?active=true'),
  });

  // Query tasks
  const { data: tasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['/api/tasks'],
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
                      <TableCell>{task.selectionId ? `#${task.selectionId}` : "—"}</TableCell>
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
                      Nessuna attività trovata. Le attività vengono create dalla pagina Selezione Avanzata.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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
                            <span className="text-sm text-muted-foreground">
                              #{basket.physicalNumber}
                            </span>
                          </div>
                          <p className="text-sm">
                            <span className="font-medium">FLUPSY:</span> {basket.flupsyId}
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
    </div>
  );
}
