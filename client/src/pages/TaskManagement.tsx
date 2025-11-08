import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Clock, AlertCircle, Users, Package } from "lucide-react";
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
    </div>
  );
}
