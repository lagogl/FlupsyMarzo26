import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Loader2, MapPin, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface SaleOperationDetails {
  operationId: number;
  date: string;
  animalCount: number;
  totalWeight: number;
  animalsPerKg: number;
  cancelledAt: string | null;
  cancellationReason: string | null;
  cycleId: number;
  basketId: number;
  basketPhysicalNumber: number;
  basketFlupsyId: number;
  basketRow: string;
  basketPosition: number;
  basketState: string;
  sizeCode: string;
  sizeName: string;
  cycleState: string;
}

interface Flupsy {
  id: number;
  name: string;
  maxPositions: number;
}

interface CancelSaleOperationDialogProps {
  operationId: number;
  basketPhysicalNumber: number;
  onCancelled?: () => void;
}

export default function CancelSaleOperationDialog({
  operationId,
  basketPhysicalNumber,
  onCancelled,
}: CancelSaleOperationDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFlupsyId, setSelectedFlupsyId] = useState<number | null>(null);
  const [selectedRow, setSelectedRow] = useState<string>("");
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [reason, setReason] = useState("Cliente non ha ritirato");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: detailsResponse,
    isLoading: isLoadingDetails,
  } = useQuery<{ success: boolean; operation: SaleOperationDetails; availableFlupsys: Flupsy[] }>({
    queryKey: ["/api/advanced-sales/operations", operationId, "details"],
    queryFn: async () => {
      const res = await fetch(`/api/advanced-sales/operations/${operationId}/details`);
      if (!res.ok) throw new Error("Errore durante il recupero dei dettagli");
      return res.json();
    },
    enabled: open,
  });

  const { data: allBaskets } = useQuery<any[]>({
    queryKey: ["/api/baskets"],
    queryFn: async () => {
      const res = await fetch(`/api/baskets?includeAll=true`);
      if (!res.ok) throw new Error("Errore durante il recupero delle posizioni");
      return res.json();
    },
    enabled: open,
  });

  // Filtra i cestelli del FLUPSY selezionato lato client
  const occupiedPositions = selectedFlupsyId 
    ? (allBaskets || []).filter((b: any) => b.flupsyId === selectedFlupsyId)
    : [];

  const { data: selectedFlupsy } = useQuery<Flupsy>({
    queryKey: ["/api/flupsys", selectedFlupsyId],
    queryFn: async () => {
      const res = await fetch(`/api/flupsys/${selectedFlupsyId}`);
      if (!res.ok) throw new Error("Errore durante il recupero del FLUPSY");
      return res.json();
    },
    enabled: !!selectedFlupsyId,
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/advanced-sales/operations/${operationId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetFlupsyId: selectedFlupsyId,
          targetRow: selectedRow,
          targetPosition: selectedPosition,
          reason,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Errore durante l'annullamento");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Vendita annullata",
        description: data.message || `Vendita annullata. Cesta ripristinata.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/advanced-sales/operations"] });
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

  const operation = detailsResponse?.operation;
  const availableFlupsys = detailsResponse?.availableFlupsys || [];

  // Filtra solo le ceste con stato 'available' nel FLUPSY selezionato
  const availableBaskets = selectedFlupsyId 
    ? occupiedPositions.filter((b: any) => b.state === 'available')
    : [];

  const canSubmit = selectedFlupsyId && selectedRow && selectedPosition !== null;

  const handleBasketClick = (basket: any) => {
    setSelectedRow(basket.row);
    setSelectedPosition(basket.position);
  };

  const renderAvailableBaskets = () => {
    if (!selectedFlupsyId) return null;

    if (availableBaskets.length === 0) {
      return (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <p className="text-sm text-yellow-800">
            Nessuna cesta disponibile in questo FLUPSY.
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            Seleziona un altro FLUPSY con ceste libere.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2 mt-4">
        <Label className="text-sm font-medium">Seleziona cesta disponibile ({availableBaskets.length} disponibili)</Label>
        <div className="p-3 bg-muted rounded-lg">
          <div className="grid grid-cols-5 gap-2">
            {availableBaskets.map((basket: any) => {
              const selected = selectedRow === basket.row && selectedPosition === basket.position;
              return (
                <button
                  key={basket.id}
                  type="button"
                  onClick={() => handleBasketClick(basket)}
                  className={`p-2 rounded border text-xs font-medium transition-all
                    ${selected 
                      ? "bg-blue-500 border-blue-600 text-white ring-2 ring-blue-300" 
                      : "bg-green-50 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400"
                    }`}
                  data-testid={`basket-${basket.id}`}
                >
                  <div className="font-bold">#{basket.physicalNumber}</div>
                  <div className="text-[10px] opacity-75">{basket.row}-{basket.position}</div>
                </button>
              );
            })}
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground mt-3">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-50 border border-green-300"></span> Disponibile
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-blue-500 border border-blue-600"></span> Selezionata
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          data-testid={`cancel-sale-${operationId}`}
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Annulla
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-orange-500" />
            Annulla Vendita
          </DialogTitle>
          <DialogDescription>
            Annulla la vendita e ripristina la cesta #{basketPhysicalNumber} in un FLUPSY
          </DialogDescription>
        </DialogHeader>

        {isLoadingDetails ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : operation ? (
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-orange-800">Questa operazione:</p>
                  <ul className="list-disc list-inside text-orange-700 mt-1 space-y-1">
                    <li>Riattiva il ciclo chiuso</li>
                    <li>Ripristina la cesta nella posizione selezionata</li>
                    <li>Registra il ripristino nel libro lotti</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Data vendita:</span>
                <p className="font-medium">{format(new Date(operation.date), "dd/MM/yyyy")}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Cestello:</span>
                <p className="font-medium">#{operation.basketPhysicalNumber}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Animali:</span>
                <p className="font-medium">{operation.animalCount?.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Peso:</span>
                <p className="font-medium">{((operation.totalWeight || 0) / 1000).toFixed(2)} kg</p>
              </div>
              <div>
                <span className="text-muted-foreground">Taglia:</span>
                <Badge variant="outline">{operation.sizeCode}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="flupsy-select">FLUPSY di destinazione</Label>
              <Select
                value={selectedFlupsyId?.toString() || ""}
                onValueChange={(value) => {
                  setSelectedFlupsyId(parseInt(value));
                  setSelectedRow("");
                  setSelectedPosition(null);
                }}
              >
                <SelectTrigger id="flupsy-select" data-testid="select-flupsy">
                  <SelectValue placeholder="Seleziona FLUPSY..." />
                </SelectTrigger>
                <SelectContent>
                  {availableFlupsys.map((f) => (
                    <SelectItem key={f.id} value={f.id.toString()}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {renderAvailableBaskets()}

            {selectedRow && selectedPosition && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-blue-800">
                  Posizione selezionata: <strong>{selectedRow}-{selectedPosition}</strong> in{" "}
                  <strong>{selectedFlupsy?.name}</strong>
                </span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo annullamento</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="es. Cliente non ha ritirato"
                rows={2}
                data-testid="cancel-reason"
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            Nessun dettaglio disponibile
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} data-testid="cancel-dialog-close">
            Chiudi
          </Button>
          <Button
            onClick={() => cancelMutation.mutate()}
            disabled={!canSubmit || cancelMutation.isPending}
            className="bg-orange-500 hover:bg-orange-600"
            data-testid="confirm-cancel-sale"
          >
            {cancelMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Annullamento...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                Annulla Vendita
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
