import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AlertTriangle, Trash2, CheckCircle, XCircle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface CancellationBlocker {
  type: "subsequent_operations" | "later_selections" | "linked_ddt" | "manual_edits";
  message: string;
  details: Array<{ id: number; description: string }>;
}

interface CancellationCheckResult {
  success: boolean;
  canCancel: boolean;
  selectionId: number;
  selectionNumber: number;
  selectionDate: string;
  blockers: CancellationBlocker[];
  summary: {
    sourceBaskets: number;
    destinationBaskets: number;
    operationsToDelete: number;
    cyclesToDelete: number;
    cyclesToReopen: number;
  };
}

interface CancelScreeningDialogProps {
  selectionId: number;
  selectionNumber: number;
  onCancelled?: () => void;
}

export default function CancelScreeningDialog({
  selectionId,
  selectionNumber,
  onCancelled,
}: CancelScreeningDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const {
    data: checkResult,
    isLoading: isChecking,
    refetch,
  } = useQuery<CancellationCheckResult>({
    queryKey: ["/api/selections", selectionId, "cancellation-check"],
    queryFn: async () => {
      const res = await fetch(`/api/selections/${selectionId}/cancellation-check`);
      if (!res.ok) throw new Error("Errore durante la verifica");
      return res.json();
    },
    enabled: open,
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/selections/${selectionId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Errore durante la cancellazione");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Vagliatura cancellata",
        description: data.message || `Vagliatura #${selectionNumber} cancellata con successo`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/selections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/baskets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cycles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
      setOpen(false);
      onCancelled?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      refetch();
    }
  };

  const getBlockerIcon = (type: string) => {
    switch (type) {
      case "subsequent_operations":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "later_selections":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "linked_ddt":
        return <AlertTriangle className="h-4 w-4 text-purple-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getBlockerBadgeVariant = (type: string): "destructive" | "secondary" | "outline" => {
    switch (type) {
      case "subsequent_operations":
        return "secondary";
      case "later_selections":
        return "destructive";
      case "linked_ddt":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          data-testid={`button-cancel-${selectionId}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            Cancella Vagliatura #{selectionNumber}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {isChecking ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Verifica in corso...</span>
                </div>
              ) : checkResult?.canCancel ? (
                <>
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-800 font-medium">
                      Questa vagliatura può essere cancellata
                    </span>
                  </div>

                  <div className="text-sm space-y-2">
                    <p className="font-medium">Riepilogo operazioni da annullare:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>{checkResult.summary.operationsToDelete} operazioni saranno cancellate</li>
                      <li>{checkResult.summary.cyclesToDelete} cicli nuovi saranno rimossi</li>
                      <li>{checkResult.summary.cyclesToReopen} cicli origine saranno riaperti</li>
                      <li>{checkResult.summary.sourceBaskets} cestelli origine ripristinati</li>
                      <li>{checkResult.summary.destinationBaskets} cestelli destinazione liberati</li>
                    </ul>
                  </div>

                  <p className="text-sm text-orange-600 font-medium">
                    Questa azione non può essere annullata. Sei sicuro di voler procedere?
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="text-red-800 font-medium">
                      Impossibile cancellare questa vagliatura
                    </span>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium">Motivi del blocco:</p>
                    {checkResult?.blockers.map((blocker, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg bg-gray-50 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          {getBlockerIcon(blocker.type)}
                          <Badge variant={getBlockerBadgeVariant(blocker.type)}>
                            {blocker.message}
                          </Badge>
                        </div>
                        {blocker.details.length > 0 && (
                          <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                            {blocker.details.slice(0, 5).map((detail, i) => (
                              <li key={i}>{detail.description}</li>
                            ))}
                            {blocker.details.length > 5 && (
                              <li className="italic">
                                ...e altri {blocker.details.length - 5} elementi
                              </li>
                            )}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Per cancellare questa vagliatura, devi prima rimuovere le dipendenze elencate
                    sopra.
                  </p>
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-dialog">Chiudi</AlertDialogCancel>
          {checkResult?.canCancel && (
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                cancelMutation.mutate();
              }}
              disabled={cancelMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-cancel"
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancellazione...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancella Vagliatura
                </>
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
