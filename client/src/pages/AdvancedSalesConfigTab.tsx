import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, Copy, AlertCircle, FileText, Package } from "lucide-react";

interface BasketSupply {
  basketId: number;
  basketPhysicalNumber: number;
  flupsyName?: string | null;
  operationId: number;
  sizeCode: string;
  sizeName: string;
  totalAnimals: number;
  totalWeightKg: number;
  animalsPerKg: number;
}

interface BagConfiguration {
  sizeCode: string;
  animalCount: number;
  originalWeight: number;
  weightLoss: number;
  wastePercentage: number;
  originalAnimalsPerKg: number;
  notes?: string;
  allocations: Array<{
    sourceOperationId: number;
    sourceBasketId: number;
    allocatedAnimals: number;
    allocatedWeight: number;
    sourceAnimalsPerKg: number;
    sourceSizeCode: string;
  }>;
}

interface Props {
  baseSupplyByBasket: Record<number, BasketSupply>;
  bagConfigs: BagConfiguration[];
  remainingByBasket: Record<number, number>;
  allocatedByBasket: Record<number, number>;
  onAddBag: (basketId: number | null, animalCount: number, netWeightKg: number, identifier?: string, section?: string) => void;
  onRemoveBag: (index: number) => void;
  onCloneBag: (index: number) => void;
  onUpdateBag: (index: number, updates: Partial<BagConfiguration>) => void;
  onSave: () => void;
  onGeneratePDF: () => void;
  isSaving: boolean;
  currentSaleId: number | null;
  isAggregated?: boolean;
  onRequestAutomaticGeneration?: () => void;
}

export default function AdvancedSalesConfigTab({
  baseSupplyByBasket,
  bagConfigs,
  remainingByBasket,
  allocatedByBasket,
  onAddBag,
  onRemoveBag,
  onCloneBag,
  onUpdateBag,
  onSave,
  onGeneratePDF,
  isSaving,
  currentSaleId,
  isAggregated = false,
  onRequestAutomaticGeneration
}: Props) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedBasketId, setSelectedBasketId] = useState<number | null>(null);
  const [newBagAnimals, setNewBagAnimals] = useState("");
  const [newBagWeightKg, setNewBagWeightKg] = useState("");

  const basketsArray = Object.values(baseSupplyByBasket);
  const hasValidationErrors = !isAggregated && Object.values(remainingByBasket).some(r => r < 0);
  const totalAvailable = basketsArray.reduce((sum, supply) => sum + supply.totalAnimals, 0);
  const totalAllocated = bagConfigs.reduce((sum, bag) => sum + bag.animalCount, 0);
  const difference = totalAllocated - totalAvailable;

  const handleAddBagSubmit = () => {
    if ((!isAggregated && !selectedBasketId) || !newBagAnimals || !newBagWeightKg) return;
    
    onAddBag(
      isAggregated ? null : selectedBasketId,
      parseInt(newBagAnimals),
      parseFloat(newBagWeightKg)
    );
    
    // Reset form
    setShowAddDialog(false);
    setSelectedBasketId(null);
    setNewBagAnimals("");
    setNewBagWeightKg("");
  };

  const calculateAnimalsPerKg = (bag: BagConfiguration): number => {
    const netWeightGrams = bag.originalWeight - bag.weightLoss;
    return bag.animalCount / (netWeightGrams / 1000);
  };

  const bagOrigins = (bag: BagConfiguration): string[] => [...new Set(
    bag.allocations.map(allocation => {
      const supply = baseSupplyByBasket[allocation.sourceBasketId];
      if (!supply) return `Cesta #${allocation.sourceBasketId}`;
      return [
        supply.flupsyName ? `FLUPSY ${supply.flupsyName}` : null,
        `Cesta #${supply.basketPhysicalNumber}`
      ].filter(Boolean).join(" · ");
    })
  )];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Dettagli Sacchi</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Inserisci i dettagli per ogni sacco
            </p>
          </div>
          <div className="flex gap-2">
          {isAggregated && onRequestAutomaticGeneration && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={onRequestAutomaticGeneration}
            >
              <Package className="h-4 w-4" />
              Un sacco per cesta
            </Button>
          )}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-add-bag">
                <Plus className="h-4 w-4" />
                Aggiungi Sacco
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Aggiungi Nuovo Sacco</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {!isAggregated && <div>
                  <Label>Cestello Sorgente</Label>
                  <Select
                    value={selectedBasketId?.toString()}
                    onValueChange={(v) => setSelectedBasketId(parseInt(v))}
                  >
                    <SelectTrigger data-testid="select-basket">
                      <SelectValue placeholder="Seleziona cestello" />
                    </SelectTrigger>
                    <SelectContent>
                      {basketsArray.map((supply) => (
                        <SelectItem 
                          key={supply.basketId} 
                          value={supply.basketId.toString()}
                          data-testid={`basket-option-${supply.basketId}`}
                        >
                          {supply.flupsyName ? `FLUPSY ${supply.flupsyName} · ` : ""}
                          Cesta #{supply.basketPhysicalNumber} - {supply.sizeCode}
                          ({(remainingByBasket[supply.basketId] || 0).toLocaleString()} disponibili)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>}
                {isAggregated && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Il sacco attingerà automaticamente dal totale aggregato delle ceste selezionate.
                    </AlertDescription>
                  </Alert>
                )}
                <div>
                  <Label>Animali Calcolati</Label>
                  <Input
                    type="number"
                    placeholder="Es. 50000"
                    value={newBagAnimals}
                    onChange={(e) => setNewBagAnimals(e.target.value)}
                    data-testid="input-animals"
                  />
                </div>
                <div>
                  <Label>Peso Netto (kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Es. 25.00"
                    value={newBagWeightKg}
                    onChange={(e) => setNewBagWeightKg(e.target.value)}
                    data-testid="input-weight"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleAddBagSubmit}
                  disabled={(!isAggregated && !selectedBasketId) || !newBagAnimals || !newBagWeightKg}
                  data-testid="button-submit-bag"
                >
                  Aggiungi
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Validation Errors */}
        {hasValidationErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Attenzione: alcuni cestelli hanno più animali allocati di quelli disponibili!
              Rimuovi o modifica i sacchi per procedere.
            </AlertDescription>
          </Alert>
        )}

        {isAggregated && (
          <Alert variant={difference === 0 ? "default" : "destructive"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Origine: <strong>{totalAvailable.toLocaleString("it-IT")}</strong> animali ·
              Sacchi: <strong>{totalAllocated.toLocaleString("it-IT")}</strong> ·
              Scostamento: <strong>{difference > 0 ? "+" : ""}{difference.toLocaleString("it-IT")}</strong>
              {difference < 0 && " (perdita/mortalità presunta da motivare)"}
              {difference > 0 && " (eccedenza inventariale da motivare)"}
            </AlertDescription>
          </Alert>
        )}

        {/* Cestelli Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {basketsArray.map((supply) => {
            const allocated = allocatedByBasket[supply.basketId] || 0;
            const remaining = remainingByBasket[supply.basketId] || 0;
            const isOverAllocated = !isAggregated && remaining < 0;
            
            return (
              <Card key={supply.basketId} className={isOverAllocated ? "border-red-500" : ""}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    Cestello #{supply.basketPhysicalNumber}
                    <Badge variant="outline">{supply.sizeCode}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Disponibili:</span>
                    <span className="font-medium">{supply.totalAnimals.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Allocati:</span>
                    <span className="font-medium">{allocated.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rimanenti:</span>
                      <span className={`font-medium ${remaining < 0 ? 'text-amber-600' : 'text-green-600'}`}>
                      {remaining.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bags Table */}
        {bagConfigs.length > 0 ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sacco #</TableHead>
                  <TableHead>FLUPSY / Cesta</TableHead>
                  <TableHead>Peso Netto (kg)</TableHead>
                  <TableHead>Scarto (%)</TableHead>
                  <TableHead>Animali/kg</TableHead>
                  <TableHead>Animali Calcolati</TableHead>
                  <TableHead>Taglia</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bagConfigs.map((bag, index) => {
                  const netWeightKg = (bag.originalWeight - bag.weightLoss) / 1000;
                  const animalsPerKg = calculateAnimalsPerKg(bag);
                  return (
                    <TableRow key={index} data-testid={`bag-row-${index}`}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="min-w-48 text-sm">
                        {bagOrigins(bag).map(origin => <div key={origin}>{origin}</div>)}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={netWeightKg.toFixed(2)}
                          onChange={(e) => {
                            const newNetWeightGrams = parseFloat(e.target.value) * 1000;
                            onUpdateBag(index, { originalWeight: newNetWeightGrams });
                          }}
                          className="w-24"
                          data-testid={`input-weight-${index}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={bag.wastePercentage}
                          onChange={(e) => {
                            onUpdateBag(index, { wastePercentage: parseFloat(e.target.value) || 0 });
                          }}
                          className="w-20"
                          data-testid={`input-waste-${index}`}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{animalsPerKg.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={bag.animalCount}
                          onChange={(e) => {
                            const newCount = parseInt(e.target.value) || 0;
                            onUpdateBag(index, { animalCount: newCount });
                          }}
                          className="w-28"
                          data-testid={`input-animals-${index}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{bag.sizeCode}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCloneBag(index)}
                            data-testid={`button-clone-${index}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveBag(index)}
                            data-testid={`button-remove-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nessun sacco configurato. Clicca "Aggiungi Sacco" per iniziare.
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            onClick={onSave}
            disabled={isSaving || bagConfigs.length === 0 || hasValidationErrors}
            className="flex-1"
            data-testid="button-save-config"
          >
            {isSaving ? "Salvataggio..." : "Salva Configurazione"}
          </Button>
          
          {currentSaleId && bagConfigs.length > 0 && (
            <Button
              onClick={onGeneratePDF}
              variant="outline"
              className="flex-1"
              data-testid="button-generate-pdf"
            >
              <FileText className="h-4 w-4 mr-2" />
              Genera PDF
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
