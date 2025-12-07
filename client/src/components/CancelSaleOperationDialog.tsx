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

  const { data: occupiedPositions } = useQuery<any[]>({
    queryKey: ["/api/baskets", selectedFlupsyId],
    queryFn: async () => {
      const res = await fetch(`/api/baskets?flupsyId=${selectedFlupsyId}&includeAll=true`);
      if (!res.ok) throw new Error("Errore durante il recupero delle posizioni");
      return res.json();
    },
    enabled: !!selectedFlupsyId,
  });

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
  const maxPositions = selectedFlupsy?.maxPositions || 10;
  const positionsPerRow = Math.ceil(maxPositions / 2);

  const isPositionOccupied = (row: string, position: number) => {
    if (!occupiedPositions) return false;
    // Una posizione è occupata se c'è qualsiasi cesta (indipendentemente dallo stato)
    return occupiedPositions.some(
      (b: any) => b.row === row && b.position === position
    );
  };

  const canSubmit = selectedFlupsyId && selectedRow && selectedPosition !== null && !isPositionOccupied(selectedRow, selectedPosition);

  const handlePositionClick = (row: string, position: number) => {
    if (!isPositionOccupied(row, position)) {
      setSelectedRow(row);
      setSelectedPosition(position);
    }
  };

  const renderPositionGrid = () => {
    if (!selectedFlupsyId) return null;

    return (
      <div className="space-y-2 mt-4">
        <Label className="text-sm font-medium">Seleziona posizione</Label>
        <div className="p-3 bg-muted rounded-lg space-y-2">
          {["SX", "DX"].map((row) => (
            <div key={row} className="flex items-center gap-1">
              <span className="text-xs font-medium text-gray-500 w-6">{row}:</span>
              <div className="flex gap-1 flex-wrap">
                {Array.from({ length: positionsPerRow }, (_, i) => {
                  const position = i + 1;
                  const occupied = isPositionOccupied(row, position);
                  const selected = selectedRow === row && selectedPosition === position;
                  
                  return (
                    <button
                      key={`${row}-${position}`}
                      type="button"
                      onClick={() => handlePositionClick(row, position)}
                      disabled={occupied}
                      className={`w-8 h-8 rounded border text-xs font-medium transition-all
                        ${occupied 
                          ? "bg-red-100 border-red-400 text-red-700 cursor-not-allowed" 
                          : selected 
                            ? "bg-blue-500 border-blue-600 text-white ring-2 ring-blue-300" 
                            : "bg-white border-gray-300 text-gray-600 hover:bg-blue-50 hover:border-blue-300"
                        }`}
                      data-testid={`position-${row}-${position}`}
                    >
                      {position}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="flex gap-4 text-xs text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-white border border-gray-300"></span> Libera
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-100 border border-red-400"></span> Occupata
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

            {renderPositionGrid()}

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
