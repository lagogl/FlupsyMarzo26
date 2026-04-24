import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Users, Check, ChevronsUpDown, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Customer {
  id: number;
  externalId?: string;
  name: string;
  businessName?: string;
  vatNumber?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
}

interface SaleOperation {
  operationId: number;
  basketId: number;
  date: string;
  animalCount: number;
  totalWeight: number;
  animalsPerKg: number;
  sizeCode: string;
  sizeName: string;
  basketPhysicalNumber: number;
  processed: boolean;
}

interface BagDraft {
  id: string;
  sourceOperationId: number | null;
  animalCount: number;
  netWeightKg: number;
  notes?: string;
}

interface CustomerSlot {
  id: string;
  useManual: boolean;
  customer: Customer | null;
  manualName: string;
  manualDetails: string;
  notes: string;
  bags: BagDraft[];
  customerComboboxOpen: boolean;
}

interface Props {
  selectedOperations: SaleOperation[];
  defaultDate: string;
  defaultCompanyId: number | null;
  onSuccess: () => void;
  onCancel: () => void;
}

let _slotCounter = 0;
let _bagCounter = 0;
const newId = (prefix: string) => `${prefix}-${++_slotCounter}-${Date.now()}`;
const newBagId = () => `bag-${++_bagCounter}-${Date.now()}`;

function makeEmptySlot(): CustomerSlot {
  return {
    id: newId("slot"),
    useManual: false,
    customer: null,
    manualName: "",
    manualDetails: "",
    notes: "",
    bags: [],
    customerComboboxOpen: false,
  };
}

export default function MultiCustomerSaleForm({
  selectedOperations,
  defaultDate,
  defaultCompanyId,
  onSuccess,
  onCancel,
}: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [companyId, setCompanyId] = useState<number | null>(defaultCompanyId);
  const [saleDate, setSaleDate] = useState<string>(defaultDate);
  const [slots, setSlots] = useState<CustomerSlot[]>([makeEmptySlot(), makeEmptySlot()]);

  const { data: customersData } = useQuery<{ customers: Customer[] }>({
    queryKey: ['/api/advanced-sales/customers'],
    queryFn: () => apiRequest('/api/advanced-sales/customers'),
  });
  const { data: companiesData } = useQuery<{ companies: any[] }>({
    queryKey: ['/api/fatture-in-cloud/companies/local'],
    queryFn: () => apiRequest('/api/fatture-in-cloud/companies/local'),
  });

  const operationByBasket = useMemo(() => {
    const m = new Map<number, SaleOperation>();
    selectedOperations.forEach((op) => m.set(op.basketId, op));
    return m;
  }, [selectedOperations]);

  const operationById = useMemo(() => {
    const m = new Map<number, SaleOperation>();
    selectedOperations.forEach((op) => m.set(op.operationId, op));
    return m;
  }, [selectedOperations]);

  // Allocazioni per operazione (somma su tutte le card cliente)
  const allocatedByOperation = useMemo(() => {
    const m = new Map<number, number>();
    slots.forEach((s) => {
      s.bags.forEach((b) => {
        if (b.sourceOperationId) {
          m.set(b.sourceOperationId, (m.get(b.sourceOperationId) || 0) + (b.animalCount || 0));
        }
      });
    });
    return m;
  }, [slots]);

  const totalAvailable = useMemo(
    () => selectedOperations.reduce((s, op) => s + (op.animalCount || 0), 0),
    [selectedOperations]
  );
  const totalAllocated = useMemo(
    () => Array.from(allocatedByOperation.values()).reduce((s, n) => s + n, 0),
    [allocatedByOperation]
  );
  const totalResidual = totalAvailable - totalAllocated;

  // Errori per cestello (sovra-allocazione)
  const operationErrors = useMemo(() => {
    const errors: Record<number, string> = {};
    for (const op of selectedOperations) {
      const allocated = allocatedByOperation.get(op.operationId) || 0;
      if (allocated > op.animalCount) {
        errors[op.operationId] = `Sovra-allocato di ${(allocated - op.animalCount).toLocaleString('it-IT')}`;
      }
    }
    return errors;
  }, [selectedOperations, allocatedByOperation]);

  const hasOverAllocation = Object.keys(operationErrors).length > 0;

  // Validazioni globali
  const validationIssues = useMemo(() => {
    const issues: string[] = [];
    if (!companyId) issues.push("Seleziona l'azienda");
    if (!saleDate) issues.push("Seleziona la data della vendita");
    if (slots.length === 0) issues.push("Aggiungi almeno un cliente");
    slots.forEach((s, i) => {
      const idx = i + 1;
      const hasCustomer = s.useManual ? !!s.manualName.trim() : !!s.customer;
      if (!hasCustomer) issues.push(`Cliente #${idx}: seleziona o inserisci nominativo`);
      if (s.bags.length === 0) issues.push(`Cliente #${idx}: aggiungi almeno un sacco`);
      s.bags.forEach((b, j) => {
        if (!b.sourceOperationId) issues.push(`Cliente #${idx}, sacco #${j + 1}: scegli il cestello sorgente`);
        if (!b.animalCount || b.animalCount <= 0) issues.push(`Cliente #${idx}, sacco #${j + 1}: inserisci il numero di animali`);
        if (!b.netWeightKg || b.netWeightKg <= 0) issues.push(`Cliente #${idx}, sacco #${j + 1}: inserisci il peso (kg)`);
      });
    });
    if (hasOverAllocation) issues.push("Risolvi le sovra-allocazioni evidenziate");
    return issues;
  }, [slots, companyId, saleDate, hasOverAllocation]);

  const canSubmit = validationIssues.length === 0 && slots.length > 0;

  const submitMutation = useMutation({
    mutationFn: (payload: any) => apiRequest('/api/advanced-sales/multi', 'POST', payload),
    onSuccess: (resp: any) => {
      toast({
        variant: "success",
        title: "Vendite create",
        description: `Generate ${resp?.summary?.salesCreated ?? slots.length} vendite. Residuo: ${(resp?.summary?.residual ?? totalResidual).toLocaleString('it-IT')} animali.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/advanced-sales'] });
      queryClient.invalidateQueries({ queryKey: ['/api/advanced-sales/operations'] });
      onSuccess();
    },
    onError: (err: any) => {
      toast({
        title: "Errore",
        description: err?.message || "Impossibile creare le vendite multi-cliente",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!canSubmit) return;
    const payload = {
      operationIds: selectedOperations.map((op) => op.operationId),
      companyId,
      saleDate,
      sales: slots.map((s) => {
        const customerData = s.useManual
          ? { name: s.manualName.trim(), details: s.manualDetails.trim() || undefined }
          : s.customer;
        return {
          customerData: s.useManual ? null : customerData,
          manualCustomer: s.useManual ? { name: s.manualName.trim(), details: s.manualDetails.trim() || undefined } : null,
          notes: s.notes || undefined,
          bags: s.bags.map((b) => {
            const op = operationById.get(b.sourceOperationId!);
            const originalWeightGrams = b.netWeightKg * 1000;
            return {
              sizeCode: op?.sizeCode || '',
              animalCount: b.animalCount,
              originalWeight: originalWeightGrams,
              weightLoss: 0,
              wastePercentage: 0,
              originalAnimalsPerKg: op?.animalsPerKg || 0,
              notes: b.notes || undefined,
              allocations: [{
                sourceOperationId: b.sourceOperationId!,
                sourceBasketId: op?.basketId || 0,
                allocatedAnimals: b.animalCount,
                allocatedWeight: originalWeightGrams,
                sourceAnimalsPerKg: op?.animalsPerKg || 0,
                sourceSizeCode: op?.sizeCode || '',
              }],
            };
          }),
        };
      }),
    };
    submitMutation.mutate(payload);
  };

  // ----- handlers slot -----
  const addSlot = () => setSlots((prev) => [...prev, makeEmptySlot()]);
  const removeSlot = (id: string) => setSlots((prev) => prev.filter((s) => s.id !== id));
  const updateSlot = (id: string, patch: Partial<CustomerSlot>) => {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };
  const addBag = (slotId: string) => {
    setSlots((prev) => prev.map((s) => {
      if (s.id !== slotId) return s;
      return {
        ...s,
        bags: [...s.bags, { id: newBagId(), sourceOperationId: null, animalCount: 0, netWeightKg: 0 }],
      };
    }));
  };
  const removeBag = (slotId: string, bagId: string) => {
    setSlots((prev) => prev.map((s) => {
      if (s.id !== slotId) return s;
      return { ...s, bags: s.bags.filter((b) => b.id !== bagId) };
    }));
  };
  const updateBag = (slotId: string, bagId: string, patch: Partial<BagDraft>) => {
    setSlots((prev) => prev.map((s) => {
      if (s.id !== slotId) return s;
      return { ...s, bags: s.bags.map((b) => (b.id === bagId ? { ...b, ...patch } : b)) };
    }));
  };

  const SLOT_COLORS = [
    "bg-blue-50 border-blue-200",
    "bg-green-50 border-green-200",
    "bg-amber-50 border-amber-200",
    "bg-purple-50 border-purple-200",
    "bg-rose-50 border-rose-200",
    "bg-cyan-50 border-cyan-200",
  ];
  const SLOT_HEADER_COLORS = [
    "bg-blue-100/60",
    "bg-green-100/60",
    "bg-amber-100/60",
    "bg-purple-100/60",
    "bg-rose-100/60",
    "bg-cyan-100/60",
  ];

  if (selectedOperations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nessuna operazione selezionata. Torna al tab "Operazioni" per selezionare almeno un cestello.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Riepilogo operazioni selezionate — sticky */}
      <div className="sticky top-0 z-20 bg-background pt-1 pb-2 -mx-1 px-1">
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Vendita Multi-Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Operazioni selezionate ({selectedOperations.length})</Label>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {selectedOperations.map((op) => {
                const allocated = allocatedByOperation.get(op.operationId) || 0;
                const remaining = op.animalCount - allocated;
                const isOver = allocated > op.animalCount;
                return (
                  <div
                    key={op.operationId}
                    data-testid={`op-summary-${op.operationId}`}
                    className={`p-2 rounded-md border text-sm ${isOver ? 'border-destructive bg-destructive/10' : 'border-border'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">#{op.basketPhysicalNumber}</span>
                      <Badge variant="outline">{op.sizeCode}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Disp: {op.animalCount.toLocaleString('it-IT')}
                    </div>
                    <div className={`text-xs ${isOver ? 'text-destructive font-medium' : remaining === 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                      Allocati: {allocated.toLocaleString('it-IT')} | Residuo: {remaining.toLocaleString('it-IT')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Animali disponibili</div>
              <div className="text-2xl font-bold" data-testid="text-total-available">
                {totalAvailable.toLocaleString('it-IT')}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Allocati ai clienti</div>
              <div className="text-2xl font-bold" data-testid="text-total-allocated">
                {totalAllocated.toLocaleString('it-IT')}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Residuo (resta disponibile)</div>
              <div
                className={`text-2xl font-bold ${totalResidual < 0 ? 'text-destructive' : totalResidual === 0 ? 'text-green-600' : ''}`}
                data-testid="text-total-residual"
              >
                {totalResidual.toLocaleString('it-IT')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Dati comuni */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dati comuni a tutte le vendite</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="multi-company">Azienda</Label>
            <Select
              value={companyId?.toString() || ""}
              onValueChange={(v) => setCompanyId(parseInt(v))}
            >
              <SelectTrigger id="multi-company" data-testid="select-multi-company">
                <SelectValue placeholder="Seleziona azienda" />
              </SelectTrigger>
              <SelectContent>
                {companiesData?.companies?.map((c: any) => (
                  <SelectItem key={c.companyId} value={c.companyId.toString()}>
                    {c.ragioneSociale}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="multi-date">Data vendita</Label>
            <Input
              id="multi-date"
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              data-testid="input-multi-date"
            />
          </div>
        </CardContent>
      </Card>

      {/* Slot clienti */}
      <div className="space-y-4">
        {slots.map((slot, idx) => (
          <Card key={slot.id} data-testid={`customer-slot-${idx}`} className={SLOT_COLORS[idx % SLOT_COLORS.length]}>
            <CardHeader className={`flex flex-row items-center justify-between space-y-0 rounded-t-lg ${SLOT_HEADER_COLORS[idx % SLOT_HEADER_COLORS.length]}`}>
              <CardTitle className="text-base">Cliente #{idx + 1}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeSlot(slot.id)}
                disabled={slots.length <= 1}
                data-testid={`button-remove-slot-${idx}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={slot.useManual}
                  onCheckedChange={(c) => updateSlot(slot.id, { useManual: c === true })}
                  id={`manual-${slot.id}`}
                />
                <Label htmlFor={`manual-${slot.id}`} className="text-sm font-normal cursor-pointer">
                  Inserimento manuale cliente
                </Label>
              </div>

              {slot.useManual ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input
                    placeholder="Nome cliente"
                    value={slot.manualName}
                    onChange={(e) => updateSlot(slot.id, { manualName: e.target.value })}
                    data-testid={`input-manual-name-${idx}`}
                  />
                  <Input
                    placeholder="Dettagli aziendali (opzionale)"
                    value={slot.manualDetails}
                    onChange={(e) => updateSlot(slot.id, { manualDetails: e.target.value })}
                  />
                </div>
              ) : (
                <Popover
                  open={slot.customerComboboxOpen}
                  onOpenChange={(o) => updateSlot(slot.id, { customerComboboxOpen: o })}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                      data-testid={`button-select-customer-${idx}`}
                    >
                      {slot.customer
                        ? `${slot.customer.name}${slot.customer.businessName ? ` - ${slot.customer.businessName}` : ''}`
                        : "Seleziona cliente"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Cerca cliente..." />
                      <CommandList>
                        <CommandEmpty>Nessun cliente trovato.</CommandEmpty>
                        <CommandGroup>
                          {customersData?.customers?.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={`${c.name} ${c.vatNumber || ''}`.toLowerCase()}
                              onSelect={() => updateSlot(slot.id, { customer: c, customerComboboxOpen: false })}
                            >
                              <Check className={`mr-2 h-4 w-4 ${slot.customer?.id === c.id ? 'opacity-100' : 'opacity-0'}`} />
                              <div className="flex flex-col">
                                <span className="font-medium">{c.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {c.vatNumber ? `P.IVA ${c.vatNumber}` : 'Nessuna P.IVA'}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}

              <Textarea
                placeholder="Note vendita (opzionale)"
                value={slot.notes}
                onChange={(e) => updateSlot(slot.id, { notes: e.target.value })}
                className="min-h-[60px]"
              />

              {/* Sacchi */}
              <div className="border-t pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Sacchi ({slot.bags.length})</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addBag(slot.id)}
                    data-testid={`button-add-bag-${idx}`}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Aggiungi sacco
                  </Button>
                </div>

                {slot.bags.length === 0 ? (
                  <div className="text-sm text-muted-foreground italic py-2">
                    Nessun sacco. Aggiungi almeno un sacco per questo cliente.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {slot.bags.map((bag, bIdx) => {
                      const op = bag.sourceOperationId ? operationById.get(bag.sourceOperationId) : null;
                      const remaining = op
                        ? op.animalCount - (allocatedByOperation.get(op.operationId) || 0) + (bag.animalCount || 0)
                        : 0;
                      const overflow = op && bag.animalCount > remaining;
                      return (
                        <div
                          key={bag.id}
                          className={`grid grid-cols-12 gap-2 p-2 rounded-md border ${overflow ? 'border-destructive bg-destructive/5' : 'border-border'}`}
                          data-testid={`bag-row-${idx}-${bIdx}`}
                        >
                          <div className="col-span-4">
                            <Label className="text-xs">Cestello sorgente</Label>
                            <Select
                              value={bag.sourceOperationId?.toString() || ""}
                              onValueChange={(v) => updateBag(slot.id, bag.id, { sourceOperationId: parseInt(v) })}
                            >
                              <SelectTrigger data-testid={`select-source-${idx}-${bIdx}`}>
                                <SelectValue placeholder="Cestello..." />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedOperations.map((o) => (
                                  <SelectItem key={o.operationId} value={o.operationId.toString()}>
                                    #{o.basketPhysicalNumber} ({o.sizeCode}) — {o.animalCount.toLocaleString('it-IT')} disp.
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-3">
                            <Label className="text-xs">Animali</Label>
                            <Input
                              type="number"
                              min={0}
                              value={bag.animalCount || ''}
                              onChange={(e) => updateBag(slot.id, bag.id, { animalCount: parseInt(e.target.value) || 0 })}
                              data-testid={`input-bag-animals-${idx}-${bIdx}`}
                            />
                          </div>
                          <div className="col-span-3">
                            <Label className="text-xs">
                              Peso netto (kg) <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={bag.netWeightKg || ''}
                              onChange={(e) => updateBag(slot.id, bag.id, { netWeightKg: parseFloat(e.target.value) || 0 })}
                              data-testid={`input-bag-weight-${idx}-${bIdx}`}
                              className={(!bag.netWeightKg || bag.netWeightKg <= 0) ? 'border-destructive' : ''}
                            />
                          </div>
                          <div className="col-span-2 flex items-end justify-end">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeBag(slot.id, bag.id)}
                              data-testid={`button-remove-bag-${idx}-${bIdx}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          {op && (
                            <div className="col-span-12 text-xs text-muted-foreground">
                              Cestello #{op.basketPhysicalNumber}: {op.animalsPerKg.toLocaleString('it-IT')} animali/kg —
                              {overflow
                                ? <span className="text-destructive font-medium ml-1">supera la disponibilità</span>
                                : <span className="ml-1">residuo dopo questo sacco: {(remaining - bag.animalCount).toLocaleString('it-IT')}</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addSlot}
          className="w-full"
          data-testid="button-add-customer-slot"
        >
          <Plus className="h-4 w-4 mr-2" /> Aggiungi cliente
        </Button>
      </div>

      {/* Validazione + azioni */}
      {validationIssues.length > 0 && (
        <Card className="border-destructive/40">
          <CardContent className="py-3">
            <div className="flex items-start gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium mb-1">Da completare prima di creare le vendite:</div>
                <ul className="list-disc ml-5 space-y-0.5 text-muted-foreground">
                  {validationIssues.slice(0, 6).map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                  {validationIssues.length > 6 && (
                    <li>...e altri {validationIssues.length - 6}</li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onCancel} data-testid="button-multi-cancel">
          Annulla
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || submitMutation.isPending}
          data-testid="button-multi-submit"
        >
          {submitMutation.isPending
            ? "Creazione in corso..."
            : `Crea ${slots.length} vendit${slots.length === 1 ? 'a' : 'e'}`}
        </Button>
      </div>
    </div>
  );
}
