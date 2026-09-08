import { Fragment, useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Package, FileText, Download, Eye, CheckCircle, Check, ChevronsUpDown, ChevronDown, Calculator, Truck, ExternalLink, Loader2, Trash2, Users, Waves, Link2Off } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import AdvancedSalesConfigTab from "./AdvancedSalesConfigTab";
import CancelSaleOperationDialog from "@/components/CancelSaleOperationDialog";
import MultiCustomerSaleForm from "@/components/MultiCustomerSaleForm";

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

interface Customer {
  id: number;
  externalId: string;
  name: string;
  businessName: string;
  vatNumber: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
}

interface BagConfiguration {
  sizeCode: string;
  animalCount: number;
  originalWeight: number;
  weightLoss: number;
  wastePercentage: number;
  originalAnimalsPerKg: number;
  notes?: string;
  allocations: {
    sourceOperationId: number;
    sourceBasketId: number;
    allocatedAnimals: number;
    allocatedWeight: number;
    sourceAnimalsPerKg: number;
    sourceSizeCode: string;
  }[];
}

interface BasketSupply {
  basketId: number;
  basketPhysicalNumber: number;
  operationId: number;
  sizeCode: string;
  sizeName: string;
  totalAnimals: number;
  totalWeightKg: number;
  animalsPerKg: number;
  flupsyId?: number;
  flupsyName?: string | null;
  row?: string;
  position?: number;
  cycleId?: number;
  date?: string;
  compositions?: Array<{
    lotId: number;
    animalCount: number;
    percentage: number;
    lotSupplier?: string | null;
    lotSupplierLotNumber?: string | null;
  }>;
}

interface TraceabilityLink {
  id: number;
  createdAt: string;
  createdByUsername: string | null;
  revokedAt: string | null;
  revokedByUsername: string | null;
  revocationReason: string | null;
}

export default function AdvancedSales() {
  const [activeTab, setActiveTab] = useState("operations");
  const [sourceMode, setSourceMode] = useState<"operations" | "baskets">("operations");
  const [selectedOperations, setSelectedOperations] = useState<number[]>([]);
  const [selectedBaskets, setSelectedBaskets] = useState<number[]>([]);
  const [basketFlupsyFilter, setBasketFlupsyFilter] = useState("all");
  const [multiCustomerMode, setMultiCustomerMode] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [manualCustomer, setManualCustomer] = useState({ name: "", details: "" });
  const [useManualCustomer, setUseManualCustomer] = useState(false);
  const [saleDate, setSaleDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState("");
  const [showBagConfig, setShowBagConfig] = useState(false);
  const [currentSaleId, setCurrentSaleId] = useState<number | null>(null);
  const [bagConfigs, setBagConfigs] = useState<BagConfiguration[]>([]);
  const [sendingDDTId, setSendingDDTId] = useState<number | null>(null);
  const [openingFCloudId, setOpeningFCloudId] = useState<number | null>(null);
  const [baseSupplyByBasket, setBaseSupplyByBasket] = useState<Record<number, BasketSupply>>({});
  const [openCustomerCombobox, setOpenCustomerCombobox] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<{
    id: number;
    saleNumber: string;
    status: string;
    sourceType?: string;
  } | null>(null);
  const [traceabilitySale, setTraceabilitySale] = useState<{ id: number; saleNumber: string } | null>(null);
  const [traceabilityLinks, setTraceabilityLinks] = useState<TraceabilityLink[]>([]);
  const [traceabilityLoading, setTraceabilityLoading] = useState(false);
  const [revokingLinkId, setRevokingLinkId] = useState<number | null>(null);
  const [revocationReason, setRevocationReason] = useState("");
  const [reversalReason, setReversalReason] = useState("");
  const [differenceDialogOpen, setDifferenceDialogOpen] = useState(false);
  const [differenceReason, setDifferenceReason] = useState("");
  const [automaticDialogOpen, setAutomaticDialogOpen] = useState(false);
  const [generatedDocumentOverrides, setGeneratedDocumentOverrides] = useState<Record<number, Record<string, string>>>({});
  const [ddrDialogOpen, setDdrDialogOpen] = useState(false);
  const [ddrCompanyId, setDdrCompanyId] = useState("");
  const [ddrNextNumber, setDdrNextNumber] = useState("1");
  const [reconciliationOpen, setReconciliationOpen] = useState(false);
  const [reconciliationConfirmOpen, setReconciliationConfirmOpen] = useState(false);
  const [selectedReconciliationSaleIds, setSelectedReconciliationSaleIds] = useState<number[]>([]);
  const [guidedReconciliationSale, setGuidedReconciliationSale] = useState<any | null>(null);
  const [manualConfirmOpen, setManualConfirmOpen] = useState(false);
  const [manualAllocations, setManualAllocations] = useState<Record<string, string>>({});
  const [manualIdempotencyKey, setManualIdempotencyKey] = useState("");
  const ddrYear = new Date().getFullYear();

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calcola animali allocati per cestello in tempo reale
  const allocatedByBasket = useMemo(() => {
    const allocated: Record<number, number> = {};
    bagConfigs.forEach(bag => {
      bag.allocations.forEach(alloc => {
        allocated[alloc.sourceBasketId] = (allocated[alloc.sourceBasketId] || 0) + alloc.allocatedAnimals;
      });
    });
    return allocated;
  }, [bagConfigs]);

  // Calcola animali rimanenti per cestello
  const remainingByBasket = useMemo(() => {
    const remaining: Record<number, number> = {};
    Object.entries(baseSupplyByBasket).forEach(([basketId, supply]) => {
      const allocated = allocatedByBasket[parseInt(basketId)] || 0;
      remaining[parseInt(basketId)] = supply.totalAnimals - allocated;
    });
    return remaining;
  }, [baseSupplyByBasket, allocatedByBasket]);

  // Calcola totale globale degli animali disponibili (somma di tutti i cestelli)
  const totalGlobalAvailable = useMemo(() => {
    return Object.values(baseSupplyByBasket).reduce((sum, supply) => sum + supply.totalAnimals, 0);
  }, [baseSupplyByBasket]);

  // Calcola totale globale degli animali già allocati nei sacchi
  const totalGlobalAllocated = useMemo(() => {
    return bagConfigs.reduce((sum, bag) => sum + bag.animalCount, 0);
  }, [bagConfigs]);

  // Calcola animali rimanenti globalmente
  const totalGlobalRemaining = totalGlobalAvailable - totalGlobalAllocated;

  // Query per operazioni di vendita disponibili (+ storiche se richiesto)
  const [showHistorical, setShowHistorical] = useState(false);
  const { data: availableOperations, isLoading: loadingOperations } = useQuery({
    queryKey: ['/api/advanced-sales/operations', showHistorical ? 'all' : 'false'],
    queryFn: () => apiRequest(`/api/advanced-sales/operations?processed=${showHistorical ? 'all' : 'false'}`)
  });

  const { data: availableBaskets, isLoading: loadingBaskets } = useQuery({
    queryKey: ['/api/advanced-sales/baskets'],
    queryFn: async () => {
      const response = await apiRequest('/api/advanced-sales/baskets');
      return {
        ...response,
        baskets: (response.baskets || []).map((basket: any) => ({
          ...basket,
          totalAnimals: basket.animalCount,
          totalWeightKg: basket.totalWeight / 1000
        }))
      };
    }
  });
  const selectedBasketRows = (availableBaskets?.baskets || []).filter(
    (basket: BasketSupply) => selectedBaskets.includes(basket.basketId)
  );
  const selectedBasketAnimals = selectedBasketRows.reduce(
    (sum: number, basket: BasketSupply) => sum + basket.totalAnimals,
    0
  );
  const basketFlupsys = useMemo(() => {
    const byId = new Map<string, string>();
    for (const basket of (availableBaskets?.baskets || []) as BasketSupply[]) {
      const key = String(basket.flupsyId ?? basket.flupsyName ?? "unknown");
      if (!byId.has(key)) {
        byId.set(key, basket.flupsyName || `FLUPSY #${basket.flupsyId ?? "—"}`);
      }
    }
    return Array.from(byId, ([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "it", { numeric: true }));
  }, [availableBaskets?.baskets]);
  const visibleBaskets = useMemo(() => {
    return ([...(availableBaskets?.baskets || [])] as BasketSupply[])
      .filter((basket) => {
        if (basketFlupsyFilter === "all") return true;
        return String(basket.flupsyId ?? basket.flupsyName ?? "unknown") === basketFlupsyFilter;
      })
      .sort((a, b) => {
        const flupsyComparison = (a.flupsyName || "").localeCompare(
          b.flupsyName || "",
          "it",
          { numeric: true }
        );
        if (flupsyComparison !== 0) return flupsyComparison;
        const basketComparison = Number(a.basketPhysicalNumber) - Number(b.basketPhysicalNumber);
        if (basketComparison !== 0) return basketComparison;
        return Number(a.position || 0) - Number(b.position || 0);
      });
  }, [availableBaskets?.baskets, basketFlupsyFilter]);

  // Query per clienti
  const { data: customers, isLoading: loadingCustomers } = useQuery({
    queryKey: ['/api/advanced-sales/customers'],
    queryFn: () => apiRequest('/api/advanced-sales/customers')
  });

  // Query per aziende disponibili
  const { data: companies } = useQuery({
    queryKey: ['/api/fatture-in-cloud/companies/local'],
    queryFn: () => apiRequest('/api/fatture-in-cloud/companies/local')
  });

  useEffect(() => {
    if (!ddrDialogOpen || !ddrCompanyId) return;
    apiRequest(`/api/advanced-sales/ddr-sequence?companyId=${ddrCompanyId}&year=${ddrYear}`)
      .then(data => setDdrNextNumber(String(data.nextNumber || 1)))
      .catch(() => setDdrNextNumber("1"));
  }, [ddrDialogOpen, ddrCompanyId, ddrYear]);

  const saveDdrSequenceMutation = useMutation({
    mutationFn: () => apiRequest('/api/advanced-sales/ddr-sequence', {
      method: 'PUT',
      body: JSON.stringify({
        companyId: Number(ddrCompanyId),
        year: ddrYear,
        nextNumber: Number(ddrNextNumber)
      })
    }),
    onSuccess: () => {
      setDdrDialogOpen(false);
      toast({ title: "Numerazione DDR aggiornata", description: `Il prossimo DDR sarà il n. ${ddrNextNumber}/${ddrYear}` });
    },
    onError: (error: any) => toast({
      title: "Impossibile aggiornare la numerazione",
      description: error.message,
      variant: "destructive"
    })
  });

  // Query per vendite avanzate esistenti
  const { data: salesData, isLoading: loadingSales } = useQuery({
    queryKey: ['/api/advanced-sales'],
    queryFn: () => apiRequest('/api/advanced-sales?pageSize=10000')
  });
  const {
    data: reconciliationData,
    isLoading: loadingReconciliation,
    isError: reconciliationError,
    error: reconciliationErrorDetails,
    refetch: refetchReconciliation
  } = useQuery({
    queryKey: ['/api/advanced-sales/order-reconciliation/preview'],
    queryFn: () => apiRequest('/api/advanced-sales/order-reconciliation/preview'),
    enabled: reconciliationOpen
  });
  const [saleDetailsId, setSaleDetailsId] = useState<number | null>(null);
  const { data: saleDetailsData, isLoading: loadingSaleDetails } = useQuery({
    queryKey: ['/api/advanced-sales/detail', saleDetailsId],
    queryFn: () => apiRequest(`/api/advanced-sales/${saleDetailsId}`),
    enabled: saleDetailsId !== null
  });
  const {
    data: manualReconciliationData,
    isLoading: loadingManualReconciliation,
    isError: manualReconciliationError,
    refetch: refetchManualReconciliation
  } = useQuery({
    queryKey: ['/api/advanced-sales/order-reconciliation/manual', guidedReconciliationSale?.saleId],
    queryFn: () => apiRequest(`/api/advanced-sales/order-reconciliation/manual/${guidedReconciliationSale.saleId}`),
    enabled: guidedReconciliationSale?.saleId != null
  });

  // Mutation per creare vendita
  const createSaleMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/advanced-sales', 'POST', data),
    onSuccess: (response) => {
      toast({ variant: "success", title: "Successo", description: "Vendita avanzata creata con successo" });
      setCurrentSaleId(response.sale.id);
      setActiveTab("config");
      // Svuota le operazioni selezionate e aggiorna la lista disponibili
      setSelectedOperations([]);
      setSelectedBaskets([]);
      queryClient.invalidateQueries({ queryKey: ['/api/advanced-sales'] });
      queryClient.invalidateQueries({ queryKey: ['/api/advanced-sales/operations'] });
      
      // Cattura disponibilità cestelli
      const supply: Record<number, BasketSupply> = {};
      response.operations.forEach((op: any) => {
        supply[op.basketId] = {
          basketId: op.basketId,
          basketPhysicalNumber: op.basketPhysicalNumber,
          operationId: op.operationId,
          sizeCode: op.sizeCode,
          sizeName: op.sizeName,
          totalAnimals: op.animalCount,
          totalWeightKg: op.totalWeight / 1000,
          animalsPerKg: op.animalsPerKg,
          flupsyId: op.flupsyId,
          flupsyName: op.flupsyName,
          row: op.row,
          position: op.position,
          cycleId: op.cycleId,
          date: op.date,
          compositions: op.compositions || []
        };
      });
      setBaseSupplyByBasket(supply);
      
      // Inizializza con un sacco vuoto
      setBagConfigs([]);
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore", 
        description: error.message || "Errore nella creazione della vendita",
        variant: "destructive" 
      });
    }
  });

  // Mutation per configurare sacchi
  const configureBagsMutation = useMutation({
    mutationFn: ({
      saleId,
      bags,
      confirmDifference,
      differenceReason
    }: {
      saleId: number;
      bags: BagConfiguration[];
      confirmDifference?: boolean;
      differenceReason?: string;
    }) =>
      apiRequest(`/api/advanced-sales/${saleId}/bags`, 'POST', {
        bags,
        confirmDifference,
        differenceReason
      }),
    onSuccess: () => {
      toast({ variant: "success", title: "Successo", description: "Configurazione sacchi completata" });
      queryClient.invalidateQueries({ queryKey: ['/api/advanced-sales'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore", 
        description: error.message || "Errore nella configurazione dei sacchi",
        variant: "destructive" 
      });
    }
  });

  // Mutation per aggiornare stato vendita
  const updateStatusMutation = useMutation({
    mutationFn: ({ saleId, status }: { saleId: number; status: string }) =>
      apiRequest(`/api/advanced-sales/${saleId}/status`, 'PATCH', { status }),
    onSuccess: () => {
      toast({ variant: "success", title: "Successo", description: "Stato vendita aggiornato" });
      queryClient.invalidateQueries({ queryKey: ['/api/advanced-sales'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore", 
        description: error.message || "Errore nell'aggiornamento dello stato",
        variant: "destructive" 
      });
    }
  });

  // Mutation per eliminare vendita in Bozza
  const deleteSaleMutation = useMutation({
    mutationFn: ({ saleId, reason }: { saleId: number; reason?: string }) =>
      apiRequest(`/api/advanced-sales/${saleId}`, 'DELETE', reason ? { reason } : undefined),
    onSuccess: (response: any) => {
      toast({
        variant: "success",
        title: response.reversedSale ? "Vendita stornata" : "Bozza eliminata",
        description: response.message || "Operazione completata"
      });
      setSaleToDelete(null);
      setReversalReason("");
      queryClient.invalidateQueries({ queryKey: ['/api/advanced-sales'] });
      queryClient.invalidateQueries({ queryKey: ['/api/advanced-sales/operations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/advanced-sales/baskets'] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare la vendita",
        variant: "destructive"
      });
      setSaleToDelete(null);
      setReversalReason("");
    }
  });

  // Carica sacchi esistenti quando si seleziona una vendita
  useEffect(() => {
    if (currentSaleId && activeTab === "config") {
      apiRequest(`/api/advanced-sales/${currentSaleId}`)
        .then((response: any) => {
          setSourceMode(response.sale?.sourceType === "manual" ? "baskets" : "operations");
          // Carica sacchi esistenti
          if (response.bags && response.bags.length > 0) {
            const loadedBags: BagConfiguration[] = response.bags.map((bag: any) => ({
              sizeCode: bag.sizeCode,
              animalCount: bag.animalCount,
              originalWeight: bag.originalWeight,
              weightLoss: bag.weightLoss || 0,
              wastePercentage: bag.wastePercentage || 0,
              originalAnimalsPerKg: bag.originalAnimalsPerKg,
              notes: bag.notes || "",
              allocations: bag.allocations.map((alloc: any) => ({
                sourceOperationId: alloc.sourceOperationId,
                sourceBasketId: alloc.sourceBasketId,
                allocatedAnimals: alloc.allocatedAnimals,
                allocatedWeight: alloc.allocatedWeight,
                sourceAnimalsPerKg: alloc.sourceAnimalsPerKg,
                sourceSizeCode: alloc.sourceSizeCode
              }))
            }));
            setBagConfigs(loadedBags);
          } else {
            setBagConfigs([]);
          }

          // Carica operazioni disponibili
          if (response.operations && response.operations.length > 0) {
            const supply: Record<number, BasketSupply> = {};
            response.operations.forEach((op: any) => {
              supply[op.basketId] = {
                basketId: op.basketId,
                basketPhysicalNumber: op.basketPhysicalNumber,
                operationId: op.operationId,
                sizeCode: op.sizeCode || "",
                sizeName: op.sizeName || "",
                totalAnimals: op.originalAnimals,
                totalWeightKg: op.originalWeight / 1000,
                animalsPerKg: op.originalAnimalsPerKg,
                flupsyId: op.flupsyId,
                flupsyName: op.flupsyName,
                row: op.row,
                position: op.position,
                cycleId: op.cycleId,
                date: op.date,
                compositions: op.compositions || []
              };
            });
            setBaseSupplyByBasket(supply);
          }
        })
        .catch((error: any) => {
          console.error("Errore nel caricamento dei sacchi:", error);
          toast({
            title: "Errore",
            description: "Impossibile caricare i dettagli della vendita",
            variant: "destructive"
          });
        });
    }
  }, [currentSaleId, activeTab]);

  const handleOperationSelect = (operationId: number, checked: boolean) => {
    if (checked) {
      setSelectedOperations(prev => [...prev, operationId]);
    } else {
      setSelectedOperations(prev => prev.filter(id => id !== operationId));
    }
  };

  const handleBasketSelect = (basketId: number, checked: boolean) => {
    setSelectedBaskets(prev => checked
      ? [...prev, basketId]
      : prev.filter(id => id !== basketId));
  };

  const selectedSourceCount = sourceMode === "operations"
    ? selectedOperations.length
    : selectedBaskets.length;

  const handleCreateSale = () => {
    if (selectedSourceCount === 0) {
      toast({
        title: "Errore",
        description: sourceMode === "operations"
          ? "Seleziona almeno un'operazione di vendita"
          : "Seleziona almeno una cesta attiva",
        variant: "destructive"
      });
      return;
    }

    if (!selectedCompanyId) {
      toast({
        title: "Errore",
        description: "Seleziona l'azienda per questa vendita",
        variant: "destructive"
      });
      return;
    }

    if (!saleDate) {
      toast({
        title: "Errore",
        description: "Seleziona la data della vendita",
        variant: "destructive"
      });
      return;
    }

    if (useManualCustomer) {
      if (!manualCustomer.name || manualCustomer.name.trim() === '') {
        toast({
          title: "Errore",
          description: "Inserisci il nome del cliente",
          variant: "destructive"
        });
        return;
      }
    } else {
      if (!selectedCustomer) {
        toast({
          title: "Errore",
          description: "Seleziona un cliente dalla lista",
          variant: "destructive"
        });
        return;
      }
    }

    const customerData = useManualCustomer 
      ? { name: manualCustomer.name, details: manualCustomer.details }
      : selectedCustomer;

    createSaleMutation.mutate({
      sourceType: sourceMode === "baskets" ? "manual" : "operation",
      ...(sourceMode === "baskets"
        ? { basketIds: selectedBaskets }
        : { operationIds: selectedOperations }),
      companyId: selectedCompanyId,
      customerData,
      saleDate,
      notes
    });
  };

  const formatSaleDate = (value: unknown) => {
    if (!value) return "—";
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? "—" : format(date, "dd/MM/yyyy");
  };

  const formatSaleNumber = (value: unknown) =>
    Number(value || 0).toLocaleString("it-IT");

  const formatSaleWeight = (value: unknown) =>
    Number(value || 0).toLocaleString("it-IT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const buildAggregateAllocations = (
    animalCount: number,
    originalWeightGrams: number,
    capacityByBasket: Record<number, number>
  ) => {
    let remainingAnimals = animalCount;
    const allocations: BagConfiguration["allocations"] = [];
    const supplies = Object.values(baseSupplyByBasket)
      .filter(supply => (capacityByBasket[supply.basketId] || 0) > 0)
      .sort((a, b) => a.basketPhysicalNumber - b.basketPhysicalNumber);

    for (const supply of supplies) {
      if (remainingAnimals <= 0) break;
      const allocatedAnimals = Math.min(
        remainingAnimals,
        capacityByBasket[supply.basketId] || 0
      );
      if (allocatedAnimals <= 0) continue;
      allocations.push({
        sourceOperationId: supply.operationId,
        sourceBasketId: supply.basketId,
        allocatedAnimals,
        allocatedWeight: animalCount > 0
          ? originalWeightGrams * (allocatedAnimals / animalCount)
          : 0,
        sourceAnimalsPerKg: supply.animalsPerKg,
        sourceSizeCode: supply.sizeCode
      });
      remainingAnimals -= allocatedAnimals;
    }

    // Un'eccedenza confermata viene attribuita proporzionalmente alle ceste
    // perché non è fisicamente distinguibile nel pool aggregato.
    if (remainingAnimals > 0 && sourceMode === "baskets") {
      const allSupplies = Object.values(baseSupplyByBasket);
      const sourceTotal = allSupplies.reduce((sum, supply) => sum + supply.totalAnimals, 0);
      let assignedExtra = 0;
      allSupplies.forEach((supply, index) => {
        const extra = index === allSupplies.length - 1
          ? remainingAnimals - assignedExtra
          : Math.floor(remainingAnimals * (supply.totalAnimals / sourceTotal));
        assignedExtra += extra;
        if (extra <= 0) return;
        const existing = allocations.find(item => item.sourceBasketId === supply.basketId);
        if (existing) {
          existing.allocatedAnimals += extra;
        } else {
          allocations.push({
            sourceOperationId: supply.operationId,
            sourceBasketId: supply.basketId,
            allocatedAnimals: extra,
            allocatedWeight: 0,
            sourceAnimalsPerKg: supply.animalsPerKg,
            sourceSizeCode: supply.sizeCode
          });
        }
      });
      remainingAnimals = 0;
    }

    for (const allocation of allocations) {
      allocation.allocatedWeight = animalCount > 0
        ? originalWeightGrams * (allocation.allocatedAnimals / animalCount)
        : 0;
    }
    return remainingAnimals === 0 ? allocations : null;
  };

  // Aggiunge un nuovo sacco
  const addBag = (basketId: number | null, animalCount: number, netWeightKg: number, identifier?: string, section?: string) => {
    const supply = basketId ? baseSupplyByBasket[basketId] : Object.values(baseSupplyByBasket)[0];
    if (!supply || animalCount <= 0 || netWeightKg <= 0) return;

    // Validazione globale: verifica che ci siano abbastanza animali disponibili nel totale dei cestelli selezionati
    if (sourceMode === "operations" && animalCount > totalGlobalRemaining) {
      toast({
        title: "Errore",
        description: `Solo ${totalGlobalRemaining.toLocaleString()} animali disponibili in totale dai cestelli selezionati`,
        variant: "destructive"
      });
      return;
    }

    const originalWeightGrams = netWeightKg * 1000;
    const allocations = sourceMode === "baskets"
      ? buildAggregateAllocations(animalCount, originalWeightGrams, remainingByBasket)
      : [{
          sourceOperationId: supply.operationId,
          sourceBasketId: supply.basketId,
          allocatedAnimals: animalCount,
          allocatedWeight: originalWeightGrams,
          sourceAnimalsPerKg: supply.animalsPerKg,
          sourceSizeCode: supply.sizeCode
        }];

    if (!allocations) {
      toast({
        title: "Errore",
        description: "Impossibile allocare il sacco sul totale delle ceste selezionate",
        variant: "destructive"
      });
      return;
    }

    const allocatedSourceWeightKg = allocations.reduce(
      (sum, allocation) => sum + allocation.allocatedAnimals / allocation.sourceAnimalsPerKg,
      0
    );
    const weightedAnimalsPerKg = allocatedSourceWeightKg > 0
      ? animalCount / allocatedSourceWeightKg
      : supply.animalsPerKg;
    
    const newBag: BagConfiguration = {
      sizeCode: supply.sizeCode,
      animalCount,
      originalWeight: originalWeightGrams,
      weightLoss: 0,
      wastePercentage: 0,
      originalAnimalsPerKg: weightedAnimalsPerKg,
      notes: [identifier, section].filter(Boolean).join(' - ') || undefined,
      allocations
    };

    setBagConfigs([...bagConfigs, newBag]);
    toast({ variant: "success", title: "Successo", description: "Sacco aggiunto" });
  };

  // Rimuove un sacco
  const removeBag = (bagIndex: number) => {
    const newConfigs = [...bagConfigs];
    newConfigs.splice(bagIndex, 1);
    setBagConfigs(newConfigs);
  };

  // Clona un sacco
  const cloneBag = (bagIndex: number) => {
    const bag = bagConfigs[bagIndex];
    
    // Validazione globale: verifica che ci siano abbastanza animali disponibili nel totale
    if (sourceMode === "operations" && bag.animalCount > totalGlobalRemaining) {
      toast({
        title: "Errore",
        description: `Solo ${totalGlobalRemaining.toLocaleString()} animali disponibili in totale per clonare questo sacco`,
        variant: "destructive"
      });
      return;
    }

    setBagConfigs([...bagConfigs, {
      ...bag,
      allocations: bag.allocations.map(allocation => ({ ...allocation }))
    }]);
    toast({ variant: "success", title: "Successo", description: "Sacco clonato" });
  };

  // Aggiorna un campo del sacco
  const updateBag = (bagIndex: number, updates: Partial<BagConfiguration>) => {
    const newConfigs = [...bagConfigs];
    newConfigs[bagIndex] = { ...newConfigs[bagIndex], ...updates };
    
    // Nella modalità aggregata il sacco può attingere da più ceste.
    if (updates.animalCount !== undefined) {
      if (sourceMode === "baskets") {
        const capacityIncludingCurrent: Record<number, number> = { ...remainingByBasket };
        for (const allocation of bagConfigs[bagIndex].allocations) {
          capacityIncludingCurrent[allocation.sourceBasketId] =
            (capacityIncludingCurrent[allocation.sourceBasketId] || 0) + allocation.allocatedAnimals;
        }
        const allocations = buildAggregateAllocations(
          updates.animalCount,
          newConfigs[bagIndex].originalWeight,
          capacityIncludingCurrent
        );
        if (!allocations) {
          toast({
            title: "Disponibilità insufficiente",
            description: "Il nuovo totale del sacco supera il pool delle ceste selezionate",
            variant: "destructive"
          });
          return;
        }
        newConfigs[bagIndex].allocations = allocations;
      } else {
        newConfigs[bagIndex].allocations[0].allocatedAnimals = updates.animalCount;
      }
    }
    
    setBagConfigs(newConfigs);
  };

  const handleWeightLoss = (bagIndex: number, weightLossKg: number) => {
    const maxLossKg = 1.5; // kg
    const actualLossKg = Math.min(weightLossKg, maxLossKg);
    // FIX: Converti la perdita in grammi
    const actualLossGrams = actualLossKg * 1000;
    
    const newConfigs = [...bagConfigs];
    newConfigs[bagIndex].weightLoss = actualLossGrams; // salva in grammi
    
    // Ricalcola animals per kg con limite 5%
    // originalWeight è già in grammi, sottrai la perdita in grammi
    const newWeightGrams = newConfigs[bagIndex].originalWeight - actualLossGrams;
    const newAnimalsPerKg = newConfigs[bagIndex].animalCount / (newWeightGrams / 1000);
    const maxVariation = newConfigs[bagIndex].originalAnimalsPerKg * 0.05;
    
    if (Math.abs(newAnimalsPerKg - newConfigs[bagIndex].originalAnimalsPerKg) <= maxVariation) {
      // Aggiorna solo se entro il limite del 5%
      setBagConfigs(newConfigs);
    } else {
      toast({
        title: "Attenzione",
        description: "La perdita di peso supera il limite del 5% di variazione degli animali/kg",
        variant: "destructive"
      });
    }
  };

  const saveBagConfiguration = () => {
    if (!currentSaleId || bagConfigs.length === 0) return;

    const difference = totalGlobalAllocated - totalGlobalAvailable;
    if (sourceMode === "baskets" && difference !== 0) {
      setDifferenceDialogOpen(true);
      return;
    }

    configureBagsMutation.mutate({
      saleId: currentSaleId,
      bags: bagConfigs
    });
  };

  const confirmBagConfigurationDifference = () => {
    if (!currentSaleId || differenceReason.trim().length < 3) return;
    configureBagsMutation.mutate({
      saleId: currentSaleId,
      bags: bagConfigs,
      confirmDifference: true,
      differenceReason: differenceReason.trim()
    }, {
      onSuccess: () => {
        setDifferenceDialogOpen(false);
        setDifferenceReason("");
      }
    });
  };

  const generateAutomaticBags = () => {
    const automaticBags = Object.values(baseSupplyByBasket).map((supply): BagConfiguration => ({
      sizeCode: supply.sizeCode,
      animalCount: supply.totalAnimals,
      originalWeight: supply.totalWeightKg * 1000,
      weightLoss: 0,
      wastePercentage: 0,
      originalAnimalsPerKg: supply.animalsPerKg,
      notes: `Cesta ${supply.basketPhysicalNumber}${supply.flupsyName ? ` - ${supply.flupsyName}` : ''}`,
      allocations: [{
        sourceOperationId: supply.operationId,
        sourceBasketId: supply.basketId,
        allocatedAnimals: supply.totalAnimals,
        allocatedWeight: supply.totalWeightKg * 1000,
        sourceAnimalsPerKg: supply.animalsPerKg,
        sourceSizeCode: supply.sizeCode
      }]
    }));
    setBagConfigs(automaticBags);
    setAutomaticDialogOpen(false);
    toast({
      variant: "success",
      title: "Sacchi generati",
      description: `Creato un sacco completo per ciascuna delle ${automaticBags.length} ceste`
    });
  };

  const handleGeneratePDF = (saleId: number) => {
    // Apre il PDF in una nuova tab usando pdfkit
    const link = document.createElement('a');
    link.href = `/api/advanced-sales/${saleId}/report.pdf`;
    link.target = '_blank';
    link.click();
  };

  const handleDownloadPDF = (saleId: number) => {
    window.open(`/api/advanced-sales/${saleId}/download-pdf`, '_blank');
  };

  const handleDownloadSaleDocument = (
    saleId: number,
    kind: "delivery-report" | "sale-conditions" | "bivalve-transfer" | "ddt"
  ) => {
    window.open(`/api/advanced-sales/${saleId}/documents/${kind}.pdf`, '_blank', 'noopener,noreferrer');
    setGeneratedDocumentOverrides(current => ({
      ...current,
      [saleId]: { ...(current[saleId] || {}), [kind]: new Date().toISOString() }
    }));
    window.setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/advanced-sales'] });
    }, 1500);
  };

  const handleDownloadAllSaleDocuments = (sale: any) => {
    const saleId = sale.id;
    const isDeltaFuturo = ["13263", "1052922"].includes(String(sale.companyId));
    window.open(`/api/advanced-sales/${saleId}/documents/all.pdf`, '_blank', 'noopener,noreferrer');
    const generatedAt = new Date().toISOString();
    setGeneratedDocumentOverrides(current => ({
      ...current,
      [saleId]: {
        ...(current[saleId] || {}),
        "delivery-report": generatedAt,
        "sale-conditions": generatedAt,
        ddt: generatedAt,
        ...(isDeltaFuturo ? { "bivalve-transfer": generatedAt } : {})
      }
    }));
    window.setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/advanced-sales'] });
    }, 3000);
  };

  const openTraceabilityManagement = async (sale: any) => {
    setTraceabilitySale({ id: sale.id, saleNumber: sale.saleNumber });
    setTraceabilityLoading(true);
    setRevocationReason("");
    try {
      const response = await apiRequest(`/api/advanced-sales/${sale.id}/traceability-links`);
      setTraceabilityLinks(response.links || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Impossibile leggere i QR",
        description: error.message || "Riprova tra poco"
      });
    } finally {
      setTraceabilityLoading(false);
    }
  };

  const revokeTraceabilityLink = async (linkId: number) => {
    if (!traceabilitySale || revocationReason.trim().length < 3) return;
    setRevokingLinkId(linkId);
    try {
      await apiRequest(
        `/api/advanced-sales/${traceabilitySale.id}/traceability-links/${linkId}/revoke`,
        "POST",
        { reason: revocationReason.trim() }
      );
      setTraceabilityLinks(current => current.map(link =>
        link.id === linkId
          ? { ...link, revokedAt: new Date().toISOString(), revocationReason: revocationReason.trim() }
          : link
      ));
      setRevocationReason("");
      toast({ title: "QR disattivato", description: "La vendita e gli altri documenti non sono stati modificati." });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Revoca non riuscita",
        description: error.message || "Riprova tra poco"
      });
    } finally {
      setRevokingLinkId(null);
    }
  };

  const handleUpdateStatus = (saleId: number, status: string) => {
    updateStatusMutation.mutate({ saleId, status });
  };

  const generateDDTMutation = useMutation({
    mutationFn: async (saleId: number) => {
      return await apiRequest(`/api/advanced-sales/${saleId}/generate-ddt`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/advanced-sales'] });
      toast({
        title: "Successo",
        description: "DDT generato con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore nella generazione del DDT",
        variant: "destructive"
      });
    }
  });

  const handleGenerateDDT = (saleId: number) => {
    generateDDTMutation.mutate(saleId);
  };

  const sendDDTToFICMutation = useMutation({
    mutationFn: async (ddtId: number) => {
      setSendingDDTId(ddtId);
      return await apiRequest(`/api/ddt/${ddtId}/send-to-fic`, {
        method: 'POST'
      });
    },
    onSuccess: (data: any) => {
      setSendingDDTId(null);
      queryClient.invalidateQueries({ queryKey: ['/api/advanced-sales'] });
      toast({
        title: data?.orderReconciliation?.status === "manual_review"
          ? "DDT inviato, verifica ordini necessaria"
          : "Successo",
        description: data?.message || "DDT inviato con successo a Fatture in Cloud",
        variant: data?.orderReconciliation?.status === "manual_review" ? "destructive" : undefined
      });
    },
    onError: (error: any) => {
      setSendingDDTId(null);
      toast({
        title: "Errore",
        description: error.message || "Errore nell'invio del DDT a Fatture in Cloud",
        variant: "destructive"
      });
    }
  });

  const handleSendDDTToFIC = (ddtId: number) => {
    sendDDTToFICMutation.mutate(ddtId);
  };

  const applyReconciliationMutation = useMutation({
    mutationFn: (saleIds: number[]) => apiRequest('/api/advanced-sales/order-reconciliation/apply', {
      method: 'POST',
      body: JSON.stringify({
        plans: saleIds.map(saleId => {
          const plan = (reconciliationData?.sales || []).find((sale: any) => sale.saleId === saleId);
          return { saleId, planFingerprint: plan?.planFingerprint };
        })
      })
    }),
    onSuccess: (data: any) => {
      setReconciliationConfirmOpen(false);
      setSelectedReconciliationSaleIds([]);
      queryClient.invalidateQueries({ queryKey: ['/api/advanced-sales/order-reconciliation/preview'] });
      refetchReconciliation();
      toast({
        title: "Riconciliazione completata",
        description: `${data.reconciled || 0} vendite associate agli ordini senza duplicazioni.`
      });
    },
    onError: (error: any) => {
      setReconciliationConfirmOpen(false);
      toast({
        title: "Riconciliazione non completata",
        description: error.message || "Aggiornare l'anteprima e riprovare",
        variant: "destructive"
      });
    }
  });

  const openManualReconciliation = (sale: any) => {
    setGuidedReconciliationSale(sale);
    setManualAllocations({});
    setManualIdempotencyKey(crypto.randomUUID());
  };

  const closeManualReconciliation = () => {
    setGuidedReconciliationSale(null);
    setManualAllocations({});
    setManualConfirmOpen(false);
  };

  const manualSale = manualReconciliationData?.sale;
  const manualComponents = manualSale?.components || [];
  const manualTotals = useMemo(() => manualComponents.map((component: any) => {
    const assigned = (component.candidates || []).filter((candidate: any) => candidate.eligible).reduce(
      (sum: number, candidate: any) => sum + (Number(manualAllocations[`${component.sizeCode}:${candidate.orderId}`]) || 0), 0
    );
    return {
      sizeCode: component.sizeCode,
      required: Number(component.requiredAnimals) || 0,
      assigned,
      residual: (Number(component.requiredAnimals) || 0) - assigned
    };
  }), [manualComponents, manualAllocations]);
  const manualPlanValid = !!manualSale && manualComponents.length > 0 && manualComponents.every((component: any) => {
    const total = manualTotals.find(item => item.sizeCode === component.sizeCode);
    if (!total || total.assigned !== total.required) return false;
    return (component.candidates || []).every((candidate: any) => {
      const value = manualAllocations[`${component.sizeCode}:${candidate.orderId}`];
      if (!value) return true;
      const quantity = Number(value);
      return Number.isInteger(quantity) && quantity > 0 && quantity <= Number(candidate.residual);
    });
  });

  useEffect(() => {
    if (!manualReconciliationData?.sale || !guidedReconciliationSale) return;
    if (Object.keys(manualAllocations).length > 0) return;
    const initial: Record<string, string> = {};
    (guidedReconciliationSale.allocations || []).forEach((allocation: any) => {
      if (Number(allocation.quantity) > 0) {
        initial[`${allocation.sizeCode}:${allocation.orderId}`] = String(allocation.quantity);
      }
    });
    if (Object.keys(initial).length > 0) setManualAllocations(initial);
  }, [manualReconciliationData, guidedReconciliationSale, manualAllocations]);

  const manualApplyMutation = useMutation({
    mutationFn: () => apiRequest('/api/advanced-sales/order-reconciliation/manual/apply', {
      method: 'POST',
      body: JSON.stringify({
        idempotencyKey: manualIdempotencyKey,
        allocations: manualComponents.flatMap((component: any) =>
          (component.candidates || []).filter((candidate: any) => candidate.eligible).flatMap((candidate: any) => {
            const quantity = Number(manualAllocations[`${component.sizeCode}:${candidate.orderId}`]) || 0;
            return quantity > 0
              ? [{ saleId: manualSale.saleId, sizeCode: component.sizeCode, orderId: candidate.orderId, quantity }]
              : [];
          })
        )
      })
    }),
    onSuccess: (data: any) => {
      setManualConfirmOpen(false);
      closeManualReconciliation();
      queryClient.invalidateQueries({ queryKey: ['/api/advanced-sales/order-reconciliation/preview'] });
      queryClient.invalidateQueries({ queryKey: ['/api/advanced-sales'] });
      toast({
        title: data.alreadyApplied ? "Riconciliazione già applicata" : "Riconciliazione completata",
        description: `${data.reconciledRows || 0} righe ordine aggiornate.`
      });
    },
    onError: (error: any) => {
      const conflict = error?.status === 409 || error?.response?.status === 409 || String(error?.message || "").includes("409");
      toast({
        title: conflict ? "Residui aggiornati" : "Riconciliazione non completata",
        description: conflict
          ? "Un ordine è cambiato nel frattempo. Aggiorna i residui e verifica nuovamente le quantità."
          : error?.message || "Riprova tra poco",
        variant: "destructive"
      });
      if (conflict) refetchManualReconciliation();
    }
  });

  const openInFCloudMutation = useMutation({
    mutationFn: async (ddtId: number) => {
      setOpeningFCloudId(ddtId);
      return await apiRequest(`/api/ddt/${ddtId}/open-in-fcloud`, { method: 'POST' });
    },
    onSuccess: (data: any) => {
      setOpeningFCloudId(null);
      queryClient.invalidateQueries({ queryKey: ['/api/advanced-sales'] });
      if (data?.deepLinkUrl) {
        window.open(data.deepLinkUrl, '_blank');
      }
    },
    onError: (error: any) => {
      setOpeningFCloudId(null);
      toast({
        title: "Errore FCloud",
        description: error.message || "Impossibile aprire il DDT in FCloud",
        variant: "destructive"
      });
    }
  });

  const handleOpenInFCloud = (ddtId: number) => {
    openInFCloudMutation.mutate(ddtId);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestione Vendite Avanzate</h1>
          <p className="text-muted-foreground">
            Configura sacchi personalizzati e genera rapporti di vendita dettagliati
          </p>
        </div>
        <Button 
          onClick={() => setActiveTab("new")}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuova Vendita
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="operations" className="gap-2">
            <Package className="h-4 w-4" />
            Operazioni
          </TabsTrigger>
          <TabsTrigger value="new" className="gap-2">
            <Plus className="h-4 w-4" />
            Nuova Vendita
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2" disabled={!currentSaleId}>
            <Calculator className="h-4 w-4" />
            Configurazione
          </TabsTrigger>
          <TabsTrigger value="sales" className="gap-2">
            <FileText className="h-4 w-4" />
            Vendite
          </TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Operazioni di Vendita Disponibili</CardTitle>
                <label className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                  <Checkbox
                    checked={showHistorical}
                    onCheckedChange={(checked) => setShowHistorical(checked === true)}
                  />
                  Mostra vendite storiche (processate)
                </label>
              </div>
            </CardHeader>
            <CardContent>
              {loadingOperations ? (
                <div>Caricamento operazioni...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seleziona</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Cestello</TableHead>
                      <TableHead>Taglia</TableHead>
                      <TableHead>Animali</TableHead>
                      <TableHead>Peso (kg)</TableHead>
                      <TableHead>Animali/kg</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableOperations?.operations?.map((op: SaleOperation) => (
                      <TableRow key={op.operationId}>
                        <TableCell>
                          <Checkbox
                            checked={selectedOperations.includes(op.operationId)}
                            onCheckedChange={(checked) => 
                              handleOperationSelect(op.operationId, checked as boolean)
                            }
                            disabled={op.processed}
                          />
                        </TableCell>
                        <TableCell>{format(new Date(op.date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>#{op.basketPhysicalNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{op.sizeCode}</Badge>
                        </TableCell>
                        <TableCell>{op.animalCount?.toLocaleString()}</TableCell>
                        <TableCell>{op.totalWeight ? (op.totalWeight / 1000).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}</TableCell>
                        <TableCell>{op.animalsPerKg?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={op.processed ? "secondary" : "default"}>
                            {op.processed ? "Processata" : "Disponibile"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <CancelSaleOperationDialog
                            operationId={op.operationId}
                            basketPhysicalNumber={op.basketPhysicalNumber}
                            onCancelled={() => {
                              queryClient.invalidateQueries({ queryKey: ['/api/advanced-sales/operations'] });
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Origine della vendita</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <Button
                type="button"
                variant={sourceMode === "operations" ? "default" : "outline"}
                className="h-auto justify-start gap-3 py-4"
                onClick={() => {
                  setSourceMode("operations");
                  setSelectedBaskets([]);
                }}
              >
                <Package className="h-5 w-5" />
                <span className="text-left">
                  <span className="block font-semibold">Da Vagliatura con Mappa</span>
                  <span className="block text-xs opacity-80">Usa le operazioni di vendita già generate</span>
                </span>
              </Button>
              <Button
                type="button"
                variant={sourceMode === "baskets" ? "default" : "outline"}
                className="h-auto justify-start gap-3 py-4"
                onClick={() => {
                  setSourceMode("baskets");
                  setSelectedOperations([]);
                  setMultiCustomerMode(false);
                }}
              >
                <Waves className="h-5 w-5" />
                <span className="text-left">
                  <span className="block font-semibold">Ceste selezionate manualmente</span>
                  <span className="block text-xs opacity-80">Vende tutto il contenuto delle ceste scelte</span>
                </span>
              </Button>
            </CardContent>
          </Card>

          {sourceMode === "baskets" && (
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>Ceste attive vendibili</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedBaskets.length} ceste selezionate · {selectedBasketAnimals.toLocaleString("it-IT")} animali totali
                    </p>
                  </div>
                  <Badge variant="secondary">Vendita dell’intera cesta</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {loadingBaskets ? (
                  <div>Caricamento ceste...</div>
                ) : availableBaskets?.baskets?.length ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="w-full sm:w-72">
                        <Label htmlFor="basket-flupsy-filter">Filtra per FLUPSY</Label>
                        <Select value={basketFlupsyFilter} onValueChange={setBasketFlupsyFilter}>
                          <SelectTrigger id="basket-flupsy-filter" className="mt-1">
                            <SelectValue placeholder="Tutti i FLUPSY" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tutti i FLUPSY</SelectItem>
                            {basketFlupsys.map((flupsy) => (
                              <SelectItem key={flupsy.id} value={flupsy.id}>
                                {flupsy.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="pb-2 text-sm text-muted-foreground">
                        {visibleBaskets.length} ceste trovate · ordinate per numero cesta
                      </p>
                    </div>
                    <div className="max-h-[420px] overflow-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>FLUPSY</TableHead>
                            <TableHead>Cesta ↑</TableHead>
                            <TableHead>Posizione</TableHead>
                            <TableHead>Ultima misura</TableHead>
                            <TableHead>Taglia</TableHead>
                            <TableHead className="text-right">Animali</TableHead>
                            <TableHead>Lotti</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {visibleBaskets.map((basket: BasketSupply) => (
                            <TableRow key={basket.basketId}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedBaskets.includes(basket.basketId)}
                                  onCheckedChange={(checked) => handleBasketSelect(basket.basketId, checked === true)}
                                />
                              </TableCell>
                              <TableCell>{basket.flupsyName || `#${basket.flupsyId}`}</TableCell>
                              <TableCell className="font-medium">
                                #{basket.basketPhysicalNumber}
                                <span className="ml-1 text-xs text-muted-foreground">ID {basket.basketId}</span>
                              </TableCell>
                              <TableCell>{basket.row} · {basket.position}</TableCell>
                              <TableCell>{basket.date ? format(new Date(basket.date), "dd/MM/yyyy") : "—"}</TableCell>
                              <TableCell><Badge variant="outline">{basket.sizeCode}</Badge></TableCell>
                              <TableCell className="text-right font-medium">{basket.totalAnimals.toLocaleString("it-IT")}</TableCell>
                              <TableCell className="max-w-64 text-xs">
                                {basket.compositions?.length
                                  ? basket.compositions.map(item =>
                                      item.lotSupplierLotNumber || `Lotto ${item.lotId}`
                                    ).join(", ")
                                  : "Lotto del ciclo"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
                    Nessuna cesta attiva con misura valida è disponibile.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Barra modalità — sempre visibile in cima */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
              <CardTitle>Crea Nuova Vendita Avanzata</CardTitle>
              <div className="flex items-center gap-3">
                <Label htmlFor="multi-mode-toggle" className="text-sm font-normal flex items-center gap-2 cursor-pointer">
                  <Users className="h-4 w-4" />
                  Modalità multi-cliente
                </Label>
                <Switch
                  id="multi-mode-toggle"
                  checked={multiCustomerMode}
                  onCheckedChange={setMultiCustomerMode}
                  disabled={sourceMode === "baskets"}
                  data-testid="switch-multi-customer-mode"
                />
              </div>
            </CardHeader>
          </Card>

          {/* Multi-cliente: form reso FUORI dalla card per permettere lo sticky */}
          {multiCustomerMode && sourceMode === "operations" ? (
            <MultiCustomerSaleForm
              selectedOperations={(availableOperations?.operations || []).filter(
                (op: SaleOperation) => selectedOperations.includes(op.operationId)
              )}
              defaultDate={saleDate}
              defaultCompanyId={selectedCompanyId}
              onSuccess={() => {
                setSelectedOperations([]);
                setMultiCustomerMode(false);
                setActiveTab("sales");
              }}
              onCancel={() => setMultiCustomerMode(false)}
            />
          ) : (
          <Card>
            <CardContent className="space-y-4 pt-4">
              <>
              <div className="space-y-2">
                <Label>{sourceMode === "operations" ? "Operazioni Selezionate" : "Ceste Selezionate"}</Label>
                <div className="text-sm text-muted-foreground">
                  {sourceMode === "operations"
                    ? `${selectedOperations.length} operazioni selezionate`
                    : `${selectedBaskets.length} ceste · ${selectedBasketAnimals.toLocaleString("it-IT")} animali`}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cliente</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={useManualCustomer}
                    onCheckedChange={(checked) => setUseManualCustomer(checked === true)}
                  />
                  <span className="text-sm">Inserimento manuale cliente</span>
                </div>
                
                {useManualCustomer ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="Nome cliente"
                      value={manualCustomer.name}
                      onChange={(e) => setManualCustomer(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Textarea
                      placeholder="Dettagli aziendali (opzionale)"
                      value={manualCustomer.details}
                      onChange={(e) => setManualCustomer(prev => ({ ...prev, details: e.target.value }))}
                    />
                  </div>
                ) : (
                  <Popover open={openCustomerCombobox} onOpenChange={setOpenCustomerCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCustomerCombobox}
                        className="w-full justify-between"
                        data-testid="button-select-customer"
                      >
                        {selectedCustomer
                          ? `${selectedCustomer.name} - ${selectedCustomer.businessName}`
                          : "Seleziona cliente dall'anagrafica"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Cerca cliente..." data-testid="input-search-customer" />
                        <CommandList>
                          <CommandEmpty>Nessun cliente trovato.</CommandEmpty>
                          <CommandGroup>
                            {customers?.customers?.map((customer: Customer) => (
                              <CommandItem
                                key={customer.id}
                                value={`${customer.name} ${customer.vatNumber || ''}`.toLowerCase()}
                                onSelect={() => {
                                  setSelectedCustomer(customer);
                                  setOpenCustomerCombobox(false);
                                }}
                                data-testid={`item-customer-${customer.id}`}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{customer.name}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {customer.vatNumber ? `P.IVA ${customer.vatNumber}` : 'Nessuna P.IVA'}
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Azienda</Label>
                <Select
                  value={selectedCompanyId?.toString() || ""}
                  onValueChange={(value) => setSelectedCompanyId(parseInt(value))}
                >
                  <SelectTrigger id="company" data-testid="select-company">
                    <SelectValue placeholder="Seleziona l'azienda per questa vendita" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies?.companies?.map((company: any) => (
                      <SelectItem 
                        key={company.companyId} 
                        value={company.companyId.toString()}
                        data-testid={`item-company-${company.companyId}`}
                      >
                        {company.ragioneSociale}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="saleDate">Data Vendita</Label>
                <Input
                  id="saleDate"
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Note</Label>
                <Textarea
                  id="notes"
                  placeholder="Note aggiuntive per la vendita"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleCreateSale}
                disabled={selectedSourceCount === 0 || createSaleMutation.isPending}
                className="w-full"
              >
                {createSaleMutation.isPending ? "Creazione..." : "Crea Vendita"}
              </Button>
              </>
            </CardContent>
          </Card>
          )}
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <AdvancedSalesConfigTab
            baseSupplyByBasket={baseSupplyByBasket}
            bagConfigs={bagConfigs}
            remainingByBasket={remainingByBasket}
            allocatedByBasket={allocatedByBasket}
            onAddBag={addBag}
            onRemoveBag={removeBag}
            onCloneBag={cloneBag}
            onUpdateBag={updateBag}
            onSave={saveBagConfiguration}
            onGeneratePDF={() => currentSaleId && handleGeneratePDF(currentSaleId)}
            isSaving={configureBagsMutation.isPending}
            currentSaleId={currentSaleId}
            isAggregated={sourceMode === "baskets"}
            onRequestAutomaticGeneration={() => setAutomaticDialogOpen(true)}
          />
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Vendite Avanzate</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedReconciliationSaleIds([]);
                    setReconciliationOpen(true);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Riconcilia ordini
                </Button>
                <Dialog open={ddrDialogOpen} onOpenChange={setDdrDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Numerazione DDR
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Numerazione DDR {ddrYear}</DialogTitle>
                    <DialogDescription>
                      Imposta una volta il prossimo numero. Dopo ogni emissione il sistema lo incrementa automaticamente; il 1° gennaio riparte da 1.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label>Azienda emittente</Label>
                      <Select value={ddrCompanyId} onValueChange={setDdrCompanyId}>
                        <SelectTrigger><SelectValue placeholder="Seleziona azienda" /></SelectTrigger>
                        <SelectContent>
                          {companies?.companies?.map((company: any) => (
                            <SelectItem key={company.companyId} value={String(company.companyId)}>
                              {company.ragioneSociale}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Prossimo numero DDR</Label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={ddrNextNumber}
                        onChange={event => setDdrNextNumber(event.target.value)}
                        disabled={!ddrCompanyId}
                      />
                      <p className="text-xs text-muted-foreground">
                        Il numero sarà stampato come DDR n. {ddrNextNumber || "—"}/{ddrYear}.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => saveDdrSequenceMutation.mutate()}
                      disabled={!ddrCompanyId || Number(ddrNextNumber) < 1 || saveDdrSequenceMutation.isPending}
                    >
                      {saveDdrSequenceMutation.isPending ? "Salvataggio..." : "Salva progressivo"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSales ? (
                <div>Caricamento vendite...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numero</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Sacchi</TableHead>
                      <TableHead>Animali</TableHead>
                      <TableHead>Peso (kg)</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesData?.sales?.map((sale: any) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">{sale.saleNumber}</TableCell>
                        <TableCell>{sale.customerName || "N/A"}</TableCell>
                        <TableCell>{format(new Date(sale.saleDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{sale.totalBags || 0}</TableCell>
                        <TableCell>{sale.totalAnimals?.toLocaleString() || 0}</TableCell>
                        <TableCell>{sale.totalWeight ? (sale.totalWeight / 1000).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}</TableCell>
                        <TableCell>
                          <Badge variant={
                            sale.status === 'completed' ? 'default' : 
                            sale.status === 'confirmed' ? 'secondary' : 'outline'
                          }>
                            {sale.status === 'completed' ? 'Completata' :
                             sale.status === 'confirmed' ? 'Confermata' : 'Bozza'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                               onClick={() => setSaleDetailsId(sale.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Dettagli
                            </Button>
                            
                            {sale.pdfPath && (
                              <Button 
                                variant="secondary" 
                                size="sm"
                                onClick={() => handleDownloadPDF(sale.id)}
                                data-testid={`button-download-pdf-${sale.id}`}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            )}

                            {sale.totalBags > 0 && (
                              <div className="inline-flex">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-r-none border-teal-600 bg-teal-600 text-white hover:bg-teal-700 hover:text-white"
                                  onClick={() => handleDownloadAllSaleDocuments(sale)}
                                  title="Genera i documenti, invia l'email e apre il fascicolo PDF"
                                  data-testid={`button-all-sale-documents-${sale.id}`}
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  Stampa documenti
                                  <span className="ml-2 text-xs">
                                    {Object.keys({ ...(sale.generatedDocuments || {}), ...(generatedDocumentOverrides[sale.id] || {}) }).filter(kind =>
                                      (["13263", "1052922"].includes(String(sale.companyId))
                                        ? ["delivery-report", "sale-conditions", "bivalve-transfer", "ddt"]
                                        : ["delivery-report", "sale-conditions", "ddt"]
                                      ).includes(kind)
                                    ).length}/{["13263", "1052922"].includes(String(sale.companyId)) ? 4 : 3}
                                  </span>
                                </Button>
                                <Popover>
                                  <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-l-none border-l-0 border-teal-600 px-2 text-teal-700 hover:bg-teal-50"
                                    title="Apri i documenti singolarmente"
                                    data-testid={`button-sale-documents-${sale.id}`}
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                  </PopoverTrigger>
                                  <PopoverContent align="end" className="w-80 p-2">
                                  <div className="px-2 py-1.5">
                                    <p className="font-semibold">Documenti della vendita</p>
                                    <p className="text-xs text-muted-foreground">Verde: generato almeno una volta</p>
                                  </div>
                                  {([
                                    ["delivery-report", "Rapporto di consegna"],
                                    ["sale-conditions", "Dichiarazione di vendita e condizioni"],
                                    ["bivalve-transfer", "Registrazione trasferimento molluschi"],
                                    ["ddt", "Documento di trasporto (DDT)"]
                                  ] as const)
                                    .filter(([kind]) => kind !== "bivalve-transfer" || ["13263", "1052922"].includes(String(sale.companyId)))
                                    .map(([kind, label]) => {
                                    const generated = Boolean(
                                      generatedDocumentOverrides[sale.id]?.[kind] || sale.generatedDocuments?.[kind]
                                    );
                                    return (
                                      <Button
                                        key={kind}
                                        variant="ghost"
                                        className="w-full justify-start h-auto py-2.5"
                                        onClick={() => handleDownloadSaleDocument(sale.id, kind)}
                                        title={generated ? "Già generato: apri nuovamente" : "Genera documento"}
                                      >
                                        <span className={`mr-3 h-2.5 w-2.5 shrink-0 rounded-full ${generated ? "bg-emerald-500 ring-4 ring-emerald-100" : "bg-slate-300"}`} />
                                        <span className="text-left leading-tight">{label}</span>
                                      </Button>
                                    );
                                  })}
                                  <div className="mt-1 border-t pt-1">
                                    <Button
                                      variant="ghost"
                                      className="w-full justify-start text-amber-700"
                                      onClick={() => openTraceabilityManagement(sale)}
                                    >
                                      <Link2Off className="mr-3 h-4 w-4" />
                                      Gestisci QR pubblici
                                    </Button>
                                  </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            )}

                            {sale.status === 'confirmed' && sale.totalBags > 0 && (
                              <>
                                {sale.ddtStatus === 'nessuno' && (
                                  <Button 
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleGenerateDDT(sale.id)}
                                    disabled={generateDDTMutation.isPending}
                                    className="bg-green-600 hover:bg-green-700"
                                    title="Genera Documento di Trasporto"
                                    data-testid={`button-generate-ddt-${sale.id}`}
                                  >
                                    <Truck className="h-4 w-4 mr-1" />
                                    Genera DDT
                                  </Button>
                                )}

                                {sale.ddtStatus === 'locale' && sale.ddtId && (
                                  <>
                                    <Button 
                                      variant="default"
                                      size="sm"
                                      onClick={() => handleSendDDTToFIC(sale.ddtId!)}
                                      disabled={sendingDDTId === sale.ddtId}
                                      className="bg-purple-600 hover:bg-purple-700"
                                      title="Invia DDT a Fatture in Cloud"
                                      data-testid={`button-send-ddt-fic-${sale.id}`}
                                    >
                                      <Truck className="h-4 w-4 mr-1" />
                                      {sendingDDTId === sale.ddtId ? 'Invio...' : 'Invia a FIC'}
                                    </Button>

                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenInFCloud(sale.ddtId!)}
                                      disabled={openingFCloudId === sale.ddtId}
                                      className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                                      title="Apri DDT in FCloud (crea e apri nel browser)"
                                    >
                                      {openingFCloudId === sale.ddtId
                                        ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                        : <ExternalLink className="h-4 w-4 mr-1" />}
                                      {openingFCloudId === sale.ddtId ? 'Apertura...' : 'Apri FCloud'}
                                    </Button>
                                  </>
                                )}

                                {sale.ddtStatus === 'inviato' && sale.ddtId && (
                                  <>
                                    <Badge variant="default" className="bg-green-600">
                                      DDT Inviato
                                    </Badge>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenInFCloud(sale.ddtId!)}
                                      disabled={openingFCloudId === sale.ddtId}
                                      className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                                      title="Apri DDT in FCloud"
                                    >
                                      {openingFCloudId === sale.ddtId
                                        ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                        : <ExternalLink className="h-4 w-4 mr-1" />}
                                      {openingFCloudId === sale.ddtId ? 'Apertura...' : 'Apri FCloud'}
                                    </Button>
                                  </>
                                )}
                              </>
                            )}

                            {sale.status === 'draft' && (
                              <>
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => handleUpdateStatus(sale.id, 'confirmed')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Conferma
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                    onClick={() => setSaleToDelete({
                                      id: sale.id,
                                      saleNumber: sale.saleNumber,
                                      status: sale.status,
                                      sourceType: sale.sourceType
                                    })}
                                  className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 px-2"
                                  title="Elimina bozza"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}

                            {sale.sourceType === 'manual' &&
                              (sale.status === 'confirmed' || sale.status === 'completed') &&
                              !sale.ddtId &&
                              sale.ddtStatus === 'nessuno' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setReversalReason("");
                                  setSaleToDelete({
                                    id: sale.id,
                                    saleNumber: sale.saleNumber,
                                    status: sale.status,
                                    sourceType: sale.sourceType
                                  });
                                }}
                                className="border-amber-400 text-amber-700 hover:bg-amber-50"
                                title="Storna la vendita e ripristina le ceste"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Storna
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={reconciliationOpen}
        onOpenChange={(open) => {
          setReconciliationOpen(open);
          if (!open) setSelectedReconciliationSaleIds([]);
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-6xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Riconcilia vendite storiche con gli ordini</DialogTitle>
            <DialogDescription>
              Le quantità vengono registrate solo dopo la conferma. I casi parziali o senza ordine
              restano esclusi e richiedono una valutazione manuale.
            </DialogDescription>
          </DialogHeader>

          {loadingReconciliation ? (
            <div className="flex justify-center py-14">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : reconciliationError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-900">
              <p className="font-semibold">Impossibile caricare la riconciliazione</p>
              <p className="mt-1 text-sm">
                {(reconciliationErrorDetails as Error)?.message || "Errore durante il caricamento delle vendite"}
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => refetchReconciliation()}>
                Riprova
              </Button>
            </div>
          ) : (
            <div className="space-y-4 overflow-hidden">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border bg-slate-50 p-3">
                  <p className="text-xs text-muted-foreground">Da verificare</p>
                  <p className="text-xl font-semibold">{reconciliationData?.summary?.total || 0}</p>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-xs text-green-700">Associabili</p>
                  <p className="text-xl font-semibold text-green-800">{reconciliationData?.summary?.automatic || 0}</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs text-amber-700">Parziali</p>
                  <p className="text-xl font-semibold text-amber-800">{reconciliationData?.summary?.partial || 0}</p>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-xs text-red-700">Senza ordine</p>
                  <p className="text-xl font-semibold text-red-800">{reconciliationData?.summary?.manual || 0}</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Selezionate {selectedReconciliationSaleIds.length} vendite
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedReconciliationSaleIds(
                    (reconciliationData?.sales || [])
                      .filter((sale: any) => sale.status === "automatic")
                      .map((sale: any) => sale.saleId)
                  )}
                >
                  Seleziona tutte le associazioni sicure
                </Button>
              </div>

              <div className="max-h-[48vh] overflow-auto rounded-lg border">
                <Table>
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Vendita</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Taglia</TableHead>
                      <TableHead className="text-right">Animali</TableHead>
                      <TableHead>Allocazioni proposte</TableHead>
                      <TableHead>Esito</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(reconciliationData?.sales || []).map((sale: any) => {
                      const selectable = sale.status === "automatic";
                      const selected = selectedReconciliationSaleIds.includes(sale.saleId);
                      return (
                        <TableRow key={sale.saleId}>
                          <TableCell>
                            <Checkbox
                              checked={selected}
                              disabled={!selectable}
                              onCheckedChange={(checked) => setSelectedReconciliationSaleIds(current =>
                                checked
                                  ? [...current, sale.saleId]
                                  : current.filter(id => id !== sale.saleId)
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{sale.saleNumber}</p>
                            <p className="text-xs text-muted-foreground">{formatSaleDate(sale.saleDate)}</p>
                          </TableCell>
                          <TableCell className="max-w-56 whitespace-normal">{sale.customerName}</TableCell>
                          <TableCell>{(sale.components || []).map((item: any) => item.sizeCode).join(", ")}</TableCell>
                          <TableCell className="text-right">{formatSaleNumber(sale.totalAnimals)}</TableCell>
                          <TableCell className="min-w-[310px] max-w-[420px] whitespace-normal text-sm">
                            {(sale.allocations || []).length ? (
                              <div className="space-y-2">
                                {sale.allocations.map((item: any) => (
                                  <div key={`${sale.saleId}-${item.orderId}-${item.sizeCode}`} className="rounded border bg-slate-50 p-2">
                                    <div className="flex flex-wrap items-center justify-between gap-1 font-medium">
                                      <span>Ordine n. {item.orderNumber || item.orderId} · {item.sizeCode}</span>
                                      <span>{formatSaleNumber(item.quantity)}</span>
                                    </div>
                                    <div className="mt-1 text-xs text-muted-foreground">
                                      Ordine del {formatSaleDate(item.orderDate)}
                                      {item.deliveryStartDate && (
                                        <> · consegna {formatSaleDate(item.deliveryStartDate)}
                                          {item.deliveryEndDate ? `–${formatSaleDate(item.deliveryEndDate)}` : ""}
                                        </>
                                      )}
                                    </div>
                                    <div className="mt-1 text-xs">
                                      Residuo: {formatSaleNumber(item.residualBefore)} → {formatSaleNumber(item.residualAfter)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : "—"}
                            {sale.missingAnimals > 0 && (
                              <div className="mt-2 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                                Non allocati: <strong>{formatSaleNumber(sale.missingAnimals)}</strong>. {sale.reason}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col items-start gap-1.5">
                              <Badge
                                variant={sale.status === "automatic" ? "default" : "secondary"}
                                className={
                                  sale.status === "automatic"
                                    ? "bg-green-600"
                                    : sale.status === "partial"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-red-100 text-red-800"
                                }
                                title={sale.reason}
                              >
                                {sale.status === "automatic"
                                  ? "Associabile"
                                  : sale.status === "partial" ? "Parziale" : "Manuale"}
                              </Badge>
                              {!selectable && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0 text-xs"
                                   onClick={() => openManualReconciliation(sale)}
                                >
                                  Come risolvere
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                La conferma creerà consegne reali e aggiornerà i residui degli ordini selezionati.
                L’operazione è protetta dai duplicati, ma deve essere eseguita solo dopo aver controllato le proposte.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReconciliationOpen(false)}>Chiudi</Button>
            <Button
              disabled={selectedReconciliationSaleIds.length === 0 || applyReconciliationMutation.isPending}
              onClick={() => setReconciliationConfirmOpen(true)}
            >
              Applica {selectedReconciliationSaleIds.length || ""} associazioni
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={guidedReconciliationSale !== null}
        onOpenChange={(open) => !open && closeManualReconciliation()}
      >
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Riconciliazione manuale · {manualSale?.saleNumber || guidedReconciliationSale?.saleNumber}
            </DialogTitle>
            <DialogDescription>
              Assegna la vendita agli ordini riga per riga. Le quantità proposte automaticamente sono modificabili.
            </DialogDescription>
          </DialogHeader>

          {loadingManualReconciliation ? (
            <div className="space-y-3 py-6">
              <div className="h-16 animate-pulse rounded-md bg-slate-100" />
              <div className="h-40 animate-pulse rounded-md bg-slate-100" />
            </div>
          ) : manualReconciliationError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              <p className="font-semibold">Impossibile caricare i residui degli ordini.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchManualReconciliation()}>
                Aggiorna
              </Button>
            </div>
          ) : manualSale && (
            <div className="space-y-4">
              <div className="grid gap-3 rounded-lg border bg-slate-50 p-3 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="font-medium">{manualSale.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vendita</p>
                  <p className="font-medium">{manualSale.saleNumber} · {formatSaleDate(manualSale.saleDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Taglie coperte</p>
                  <p className="font-medium">{manualTotals.filter(item => item.residual === 0).length} / {manualTotals.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Stato piano</p>
                  <Badge className={manualPlanValid ? "bg-green-600" : "bg-amber-100 text-amber-900"}>
                    {manualPlanValid ? "Pronto" : "Da completare"}
                  </Badge>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Taglia / ordine</TableHead>
                      <TableHead>Ordine</TableHead>
                      <TableHead className="text-right">Ordinati</TableHead>
                      <TableHead className="text-right">Consegnati</TableHead>
                      <TableHead className="text-right">Residuo</TableHead>
                      <TableHead className="w-32 text-right">Assegna</TableHead>
                      <TableHead>Esito</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manualComponents.map((component: any) => {
                      const total = manualTotals.find(item => item.sizeCode === component.sizeCode)!;
                      return (
                        <Fragment key={component.sizeCode}>
                          <TableRow key={`${component.sizeCode}-summary`} className="bg-slate-50 font-semibold">
                            <TableCell colSpan={2}>Taglia {component.sizeCode}</TableCell>
                            <TableCell colSpan={3} className="text-right">
                              Richiesto {formatSaleNumber(total.required)} · Assegnato {formatSaleNumber(total.assigned)} · Residuo {formatSaleNumber(total.residual)}
                            </TableCell>
                            <TableCell colSpan={2} className={total.residual === 0 ? "text-right text-green-700" : "text-right text-amber-700"}>
                              {total.residual === 0 ? "Coperta" : "Da coprire"}
                            </TableCell>
                          </TableRow>
                          {(component.candidates || []).map((candidate: any) => {
                            const key = `${component.sizeCode}:${candidate.orderId}`;
                            const disabled = !candidate.eligible;
                            return (
                              <TableRow key={key} className={disabled ? "bg-slate-50 text-muted-foreground" : undefined}>
                                <TableCell className="pl-6 text-xs text-muted-foreground">{component.sizeCode}</TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <p className="font-medium">n. {candidate.orderNumber || candidate.orderId}</p>
                                  <p className="text-xs text-muted-foreground">{formatSaleDate(candidate.orderDate)}</p>
                                </TableCell>
                                <TableCell className="text-right">{formatSaleNumber(candidate.ordered)}</TableCell>
                                <TableCell className="text-right">{formatSaleNumber(candidate.delivered)}</TableCell>
                                <TableCell className="text-right font-medium">{formatSaleNumber(candidate.residual)}</TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min={1}
                                    step={1}
                                    inputMode="numeric"
                                    disabled={disabled}
                                    value={manualAllocations[key] || ""}
                                    onChange={(event) => setManualAllocations(current => ({ ...current, [key]: event.target.value }))}
                                    className="h-8 text-right"
                                    aria-label={`Quantità ${candidate.orderNumber || candidate.orderId}`}
                                  />
                                </TableCell>
                                <TableCell className="text-xs">
                                  {disabled
                                    ? <span className="text-red-700">{candidate.issue || "Ordine non compatibile"}</span>
                                    : <span className="text-green-700">Eleggibile</span>}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {!component.candidates?.length && (
                            <TableRow key={`${component.sizeCode}-empty`}>
                              <TableCell colSpan={7} className="py-3 text-sm text-muted-foreground">
                                Nessun candidato per questa taglia.
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {!manualComponents.some((component: any) => component.candidates?.length) && (
                <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  Non esistono candidati compatibili. Aggiorna gli ordini condivisi prima di riprovare.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Gli ordini incompatibili restano visibili per controllo. Inserisci solo quantità intere positive entro il residuo indicato.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeManualReconciliation}>Chiudi</Button>
            <Button variant="secondary" onClick={() => window.location.assign('/ordini-condivisi')}>
              Ordini condivisi
            </Button>
            <Button disabled={!manualPlanValid || manualApplyMutation.isPending} onClick={() => setManualConfirmOpen(true)}>
              Verifica e conferma piano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={manualConfirmOpen} onOpenChange={setManualConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confermare il piano manuale?</AlertDialogTitle>
            <AlertDialogDescription>
              Verranno registrate {manualTotals.reduce((sum, item) => sum + item.assigned, 0)} unità
              sulla vendita {manualSale?.saleNumber}, distribuite su {Object.values(manualAllocations).filter(Boolean).length} righe ordine.
              Il server ricontrollerà i residui prima di applicare una sola richiesta per l’intero piano.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              disabled={manualApplyMutation.isPending}
              onClick={() => manualApplyMutation.mutate()}
            >
              {manualApplyMutation.isPending
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Applicazione...</>
                : "Conferma riconciliazione"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={reconciliationConfirmOpen} onOpenChange={setReconciliationConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confermare la riconciliazione?</AlertDialogTitle>
            <AlertDialogDescription>
              Verranno create le consegne per {selectedReconciliationSaleIds.length} vendite e saranno
              aggiornati i residui degli ordini. Prima dell’inserimento il server ricontrollerà
              taglia e capienza; le vendite non più compatibili verranno bloccate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => applyReconciliationMutation.mutate(selectedReconciliationSaleIds)}
              disabled={applyReconciliationMutation.isPending}
            >
              {applyReconciliationMutation.isPending
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Applicazione...</>
                : "Conferma e aggiorna gli ordini"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={saleDetailsId !== null}
        onOpenChange={(open) => {
          if (!open) setSaleDetailsId(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Dettagli vendita {saleDetailsData?.sale?.saleNumber || ""}
            </DialogTitle>
            <DialogDescription>
              Riepilogo storico della vendita e delle ceste o operazioni utilizzate.
            </DialogDescription>
          </DialogHeader>

          {loadingSaleDetails ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : !saleDetailsData?.sale ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Dettagli della vendita non disponibili.
            </p>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cliente</p>
                  <p className="mt-1 font-semibold">{saleDetailsData.sale.customerName || "—"}</p>
                </div>
                <div className="rounded-lg border bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Data e stato</p>
                  <p className="mt-1 font-semibold">{formatSaleDate(saleDetailsData.sale.saleDate)}</p>
                  <Badge variant="secondary" className="mt-2">
                    {saleDetailsData.sale.status === "completed"
                      ? "Completata"
                      : saleDetailsData.sale.status === "confirmed"
                        ? "Confermata"
                        : saleDetailsData.sale.status === "cancelled"
                          ? "Stornata"
                          : "Bozza"}
                  </Badge>
                </div>
                <div className="rounded-lg border bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Animali</p>
                  <p className="mt-1 text-xl font-semibold">
                    {formatSaleNumber(saleDetailsData.sale.totalAnimals)}
                  </p>
                </div>
                <div className="rounded-lg border bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Peso e sacchi</p>
                  <p className="mt-1 text-xl font-semibold">
                    {formatSaleWeight(Number(saleDetailsData.sale.totalWeight || 0) / 1000)} kg
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatSaleNumber(saleDetailsData.sale.totalBags)} sacchi
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">Origine della vendita</h3>
                    <p className="text-sm text-muted-foreground">
                      Ceste e operazioni registrate al momento della vendita.
                    </p>
                  </div>
                  <Badge variant="outline">
                    {saleDetailsData.sale.sourceType === "manual" ? "Selezione ceste" : "Operazioni"}
                  </Badge>
                </div>

                {(saleDetailsData.operations || []).length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Operazione</TableHead>
                          <TableHead>Cesta</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Taglia</TableHead>
                          <TableHead className="text-right">Animali</TableHead>
                          <TableHead className="text-right">Peso (kg)</TableHead>
                          <TableHead className="text-right">Animali/kg</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {saleDetailsData.operations.map((operation: any) => (
                          <TableRow key={`${operation.operationId}-${operation.basketId}`}>
                            <TableCell>#{operation.operationId}</TableCell>
                            <TableCell>
                              {operation.basketPhysicalNumber
                                ? `Cesta #${operation.basketPhysicalNumber}`
                                : `ID ${operation.basketId}`}
                            </TableCell>
                            <TableCell>{formatSaleDate(operation.date)}</TableCell>
                            <TableCell>{operation.sizeCode || operation.sizeName || "—"}</TableCell>
                            <TableCell className="text-right">
                              {formatSaleNumber(operation.originalAnimals)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatSaleWeight(Number(operation.originalWeight || 0) / 1000)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatSaleNumber(operation.originalAnimalsPerKg)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                    Non risultano ceste o operazioni di origine collegate a questa vendita storica.
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold">Sacchi configurati</h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  Dettaglio dei sacchi e delle quantità finali, quando disponibile.
                </p>
                {(saleDetailsData.bags || []).length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sacco</TableHead>
                          <TableHead>Taglia</TableHead>
                          <TableHead className="text-right">Animali</TableHead>
                          <TableHead className="text-right">Peso (kg)</TableHead>
                          <TableHead className="text-right">Animali/kg</TableHead>
                          <TableHead>Origine</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {saleDetailsData.bags.map((bag: any) => (
                          <TableRow key={bag.id}>
                            <TableCell>#{bag.bagNumber}</TableCell>
                            <TableCell>{bag.sizeCode || "—"}</TableCell>
                            <TableCell className="text-right">{formatSaleNumber(bag.animalCount)}</TableCell>
                            <TableCell className="text-right">{formatSaleWeight(bag.totalWeight)}</TableCell>
                            <TableCell className="text-right">{formatSaleNumber(bag.animalsPerKg)}</TableCell>
                            <TableCell>
                              {(bag.allocations || []).length > 0
                                ? bag.allocations
                                    .map((allocation: any) =>
                                      allocation.basketPhysicalNumber
                                        ? `Cesta #${allocation.basketPhysicalNumber}`
                                        : `ID ${allocation.sourceBasketId}`
                                    )
                                    .join(", ")
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    Questa vendita storica non contiene sacchi configurati. I dati originali disponibili
                    sono riportati nella sezione “Origine della vendita”.
                  </div>
                )}
              </div>

              {saleDetailsData.sale.notes && (
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Note</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{saleDetailsData.sale.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {saleDetailsData?.sale?.status === "draft" && (
              <Button
                onClick={() => {
                  setCurrentSaleId(saleDetailsData.sale.id);
                  setSaleDetailsId(null);
                  setActiveTab("config");
                }}
              >
                Apri configurazione
              </Button>
            )}
            <Button variant="outline" onClick={() => setSaleDetailsId(null)}>
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!saleToDelete} onOpenChange={(open) => { if (!open) setSaleToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {saleToDelete?.status === 'draft'
                ? `Eliminare la bozza ${saleToDelete?.saleNumber}?`
                : `Stornare la vendita ${saleToDelete?.saleNumber}?`}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                {saleToDelete?.status === 'draft' ? (
                  <p>Stai per eliminare questa vendita in stato <strong>Bozza</strong>. L'operazione è irreversibile.</p>
                ) : (
                  <>
                    <p>
                      Verranno creati movimenti compensativi e le ceste saranno riaperte
                      soltanto se non sono già state riutilizzate.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="reversal-reason">Motivazione obbligatoria</Label>
                      <Textarea
                        id="reversal-reason"
                        value={reversalReason}
                        onChange={(event) => setReversalReason(event.target.value)}
                        placeholder="Es. cliente non ha ritirato la merce"
                      />
                    </div>
                  </>
                )}
                {saleToDelete?.status === 'draft' ? (
                  <>
                    <div className="rounded-md bg-green-50 border border-green-200 p-3 space-y-1">
                      <p className="font-semibold text-green-800">Cosa viene eliminato:</p>
                      <ul className="list-disc list-inside text-green-700 space-y-0.5">
                        <li>Il record della vendita avanzata ({saleToDelete?.saleNumber})</li>
                        <li>La configurazione dei sacchi e le allocazioni</li>
                        <li>Il DDT bozza collegato (se presente)</li>
                      </ul>
                    </div>
                    <div className="rounded-md bg-blue-50 border border-blue-200 p-3 space-y-1">
                      <p className="font-semibold text-blue-800">Cosa rimane intatto:</p>
                      <ul className="list-disc list-inside text-blue-700 space-y-0.5">
                        <li>La vagliatura sorgente e tutte le operazioni sui cestelli</li>
                        <li>Lo stato dei cestelli (invariato)</li>
                        <li>Tutti gli altri dati del sistema</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="rounded-md bg-amber-50 border border-amber-200 p-3 space-y-1">
                    <p className="font-semibold text-amber-800">Effetti dello storno:</p>
                    <ul className="list-disc list-inside text-amber-700 space-y-0.5">
                      <li>Ripristino dei cicli e delle ceste originali</li>
                      <li>Movimenti contabili compensativi, senza cancellare la storia</li>
                      <li>Registrazione della data e della motivazione dello storno</li>
                    </ul>
                  </div>
                )}
                <p className="text-muted-foreground">
                  {saleToDelete?.status === 'draft'
                    ? "Dopo l'eliminazione la situazione tornerà esattamente com'era prima della creazione di questa vendita avanzata."
                    : "Lo storno rimarrà visibile nello storico della vendita e nel libro mastro."}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => saleToDelete && deleteSaleMutation.mutate({
                saleId: saleToDelete.id,
                reason: saleToDelete.status === 'draft' ? undefined : reversalReason.trim()
              })}
              disabled={
                deleteSaleMutation.isPending ||
                (saleToDelete?.status !== 'draft' && reversalReason.trim().length < 3)
              }
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteSaleMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Eliminazione...</>
              ) : (
                <><Trash2 className="h-4 w-4 mr-1" />
                  {saleToDelete?.status === 'draft' ? "Elimina definitivamente" : "Conferma storno"}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!traceabilitySale} onOpenChange={(open) => { if (!open) setTraceabilitySale(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>QR pubblici · {traceabilitySale?.saleNumber}</DialogTitle>
            <DialogDescription>
              Disattiva un singolo collegamento senza annullare la vendita, il DDT o gli altri QR.
            </DialogDescription>
          </DialogHeader>
          {traceabilityLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : traceabilityLinks.length === 0 ? (
            <p className="py-5 text-sm text-muted-foreground">Non risultano QR revocabili emessi per questa vendita.</p>
          ) : (
            <div className="max-h-80 space-y-3 overflow-y-auto">
              {traceabilityLinks.map((link, index) => (
                <div key={link.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">QR #{traceabilityLinks.length - index}</p>
                      <p className="text-xs text-muted-foreground">
                        Emesso il {new Date(link.createdAt).toLocaleString("it-IT")}
                        {link.createdByUsername ? ` da ${link.createdByUsername}` : ""}
                      </p>
                    </div>
                    <Badge variant={link.revokedAt ? "secondary" : "default"}>
                      {link.revokedAt ? "Disattivato" : "Attivo"}
                    </Badge>
                  </div>
                  {link.revokedAt ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Revocato il {new Date(link.revokedAt).toLocaleString("it-IT")}
                      {link.revokedByUsername ? ` da ${link.revokedByUsername}` : ""}
                      {link.revocationReason ? ` · ${link.revocationReason}` : ""}
                    </p>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <Input
                        value={revocationReason}
                        onChange={event => setRevocationReason(event.target.value)}
                        placeholder="Motivo della revoca"
                        maxLength={250}
                      />
                      <Button
                        variant="destructive"
                        disabled={revocationReason.trim().length < 3 || revokingLinkId !== null}
                        onClick={() => revokeTraceabilityLink(link.id)}
                      >
                        {revokingLinkId === link.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Disattiva"}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTraceabilitySale(null)}>Chiudi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={automaticDialogOpen} onOpenChange={setAutomaticDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generare un sacco completo per ogni cesta?</AlertDialogTitle>
            <AlertDialogDescription>
              La configurazione corrente verrà sostituita con {Object.keys(baseSupplyByBasket).length} sacchi,
              ciascuno contenente tutti gli animali e il peso della relativa cesta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={generateAutomaticBags}>
              Conferma generazione
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={differenceDialogOpen} onOpenChange={setDifferenceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {totalGlobalAllocated < totalGlobalAvailable
                ? "Confermare la perdita inventariale?"
                : "Confermare l’eccedenza inventariale?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Origine: <strong>{totalGlobalAvailable.toLocaleString("it-IT")}</strong> animali.
                  Sacchi: <strong>{totalGlobalAllocated.toLocaleString("it-IT")}</strong>.
                  Scostamento: <strong>{totalGlobalAllocated - totalGlobalAvailable > 0 ? "+" : ""}
                    {(totalGlobalAllocated - totalGlobalAvailable).toLocaleString("it-IT")}</strong>
                    {" "}({totalGlobalAvailable > 0
                      ? (((totalGlobalAllocated - totalGlobalAvailable) / totalGlobalAvailable) * 100).toLocaleString("it-IT", { maximumFractionDigits: 2 })
                      : "0"}%).
                </p>
                <div className="space-y-2">
                  <Label htmlFor="difference-reason">Motivazione obbligatoria</Label>
                  <Textarea
                    id="difference-reason"
                    value={differenceReason}
                    onChange={(event) => setDifferenceReason(event.target.value)}
                    placeholder={totalGlobalAllocated < totalGlobalAvailable
                      ? "Es. perdita rilevata durante la preparazione"
                      : "Es. conteggio fisico superiore alla stima registrata"}
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Correggi i sacchi</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBagConfigurationDifference}
              disabled={differenceReason.trim().length < 3 || configureBagsMutation.isPending}
            >
              Conferma e registra
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
