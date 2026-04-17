import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";

interface LotInventoryPanelProps {
  lotId: number;
  lotName?: string;
}

// Tipi per i dati
interface InventoryTransaction {
  id: number;
  lotId: number;
  date: string;
  transactionType: string;
  animalCount: number;
  notes: string | null;
  referenceOperationId: number | null;
  basketId: number | null;
  basketPhysicalNumber: number | null;
  flupsyId: number | null;
  flupsyName: string | null;
  selectionId: number | null;
  cycleId: number | null;
  createdAt: string;
}

interface MortalityRecord {
  id: number;
  lotId: number;
  calculationDate: string;
  initialCount: number;
  currentCount: number;
  soldCount: number;
  mortalityCount: number;
  mortalityPercentage: number;
  notes: string | null;
}

interface InventoryData {
  // Legacy fields (per compatibilità)
  initialCount: number;
  currentCount: number;
  soldCount: number;
  mortalityCount: number;
  mortalityPercentage: number;
  
  // Dual Tracking fields
  storage?: {
    available: number;
    activatedTotal: number;
  };
  cultivation?: {
    active: number;
    immessi: number;
    mortality: number;
    sold: number;
  };
  balance?: {
    initial: number;
    storageAvailable: number;
    inCultivation: number;
    totalSold: number;
    totalMortality: number;
    verified: boolean;
  };
}

// Componente principale per il pannello dell'inventario dei lotti
export default function LotInventoryPanel({ lotId, lotName }: LotInventoryPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [notes, setNotes] = useState("");

  // Query per ottenere i dati dell'inventario corrente
  const inventoryQuery = useQuery({
    queryKey: ["/api/lot-inventory", lotId, "current"],
    queryFn: async () => {
      const response = await fetch(`/api/lot-inventory/${lotId}/current`);
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      return data.inventory as InventoryData;
    },
    enabled: !!lotId,
  });

  // Query per ottenere le transazioni del lotto
  const transactionsQuery = useQuery({
    queryKey: ["/api/lot-inventory", lotId, "transactions"],
    queryFn: async () => {
      const response = await fetch(`/api/lot-inventory/${lotId}/transactions`);
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      return data.transactions as InventoryTransaction[];
    },
    enabled: !!lotId,
  });

  // Query per mortalità v2 (calcolata dalle operazioni con nuova formula)
  const mortalityV2Query = useQuery({
    queryKey: ["/api/lots", lotId, "mortality-v2"],
    queryFn: async () => {
      const response = await fetch(`/api/lots/${lotId}/mortality-v2`);
      const data = await response.json();
      return data as {
        summary: {
          totalCycles: number; cyclesV2: number; cyclesV1: number; cyclesNoData: number;
          totalInitial: number; totalCurrent: number; totalSold: number;
          totalMortality: number; totalMortalityPct: number; dataQualityScore: number;
        };
        cycles: Array<{
          cycleId: number; basketId: number; physicalNumber: number; flupsyName: string;
          cycleState: string; startDate: string; endDate: string | null;
          initialCount: number; currentCount: number; soldCount: number;
          mortalityCount: number; mortalityPct: number; dataQuality: 'v2'|'v1'|'none';
        }>;
      };
    },
    enabled: !!lotId,
  });

  // Query per ottenere la cronologia delle mortalità
  const mortalityHistoryQuery = useQuery({
    queryKey: ["/api/lot-inventory", lotId, "mortality-history"],
    queryFn: async () => {
      const response = await fetch(`/api/lot-inventory/${lotId}/mortality-history`);
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      return data.records as MortalityRecord[];
    },
    enabled: !!lotId,
  });

  // Mutation per registrare un nuovo calcolo di mortalità
  const recordMortalityMutation = useMutation({
    mutationFn: async () => {
      return apiRequest({
        url: `/api/lot-inventory/${lotId}/mortality-calculation`,
        method: "POST",
        body: { notes },
      });
    },
    onSuccess: () => {
      toast({
        title: "Calcolo di mortalità registrato",
        description: "Il calcolo di mortalità è stato registrato con successo",
      });
      setNotes("");
      // Invalida le query per aggiornare i dati
      queryClient.invalidateQueries({ queryKey: ["/api/lot-inventory", lotId, "mortality-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lot-inventory", lotId, "current"] });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Si è verificato un errore: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleRecordMortality = () => {
    recordMortalityMutation.mutate();
  };

  // Traduzione dei tipi di transazione
  const translateTransactionType = (type: string) => {
    const translations: Record<string, string> = {
      "arrivo-lotto": "Arrivo lotto",
      "in": "Ingresso",
      "activation": "Prima Attivazione",
      "vendita": "Vendita",
      "sale": "Vendita",
      "trasferimento": "Trasferimento",
      "transfer": "Trasferimento",
      "mortalita": "Mortalità",
      "mortality": "Mortalità",
      "aggiustamento": "Aggiustamento",
      "adjustment": "Aggiustamento",
    };
    return translations[type] || type;
  };

  // Formatta il numero con 2 decimali e separatore di migliaia
  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return "-";
    return new Intl.NumberFormat("it-IT", {
      maximumFractionDigits: 2,
    }).format(num);
  };
  
  // Funzione sicura per gestire percentuali che potrebbero essere stringhe o numeri
  const formatPercentage = (value: any): string => {
    if (value === null || value === undefined) return "0.00";
    if (typeof value === 'string') return parseFloat(value).toFixed(2);
    if (typeof value === 'number') return value.toFixed(2);
    return "0.00";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Inventario Lotto {lotName || `#${lotId}`}</CardTitle>
        <CardDescription>
          Tracciamento degli animali e calcolo della mortalità
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Riepilogo</TabsTrigger>
            <TabsTrigger value="transactions">Transazioni</TabsTrigger>
            <TabsTrigger value="mortality">Mortalità</TabsTrigger>
          </TabsList>

          {/* Tab Riepilogo */}
          <TabsContent value="summary">
            {inventoryQuery.isLoading ? (
              <div className="space-y-4 py-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : inventoryQuery.isError ? (
              <div className="py-4 text-center text-destructive">
                Errore nel caricamento dei dati
              </div>
            ) : (
              <div className="space-y-6 py-4">
                {/* SEZIONE NEW: MORTALITÀ v2 (nuova formula) */}
                {mortalityV2Query.data && mortalityV2Query.data.summary.totalCycles > 0 && (
                  <div className="space-y-3 p-4 border-2 border-blue-200 dark:border-blue-900 rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        🧮 Mortalità da Misure (Nuova Formula)
                      </h3>
                      <Badge variant="outline" className={
                        mortalityV2Query.data.summary.dataQualityScore >= 80 ? "bg-green-100 text-green-800 border-green-300" :
                        mortalityV2Query.data.summary.dataQualityScore >= 30 ? "bg-amber-100 text-amber-800 border-amber-300" :
                        "bg-red-100 text-red-800 border-red-300"
                      }>
                        Affidabilità: {mortalityV2Query.data.summary.dataQualityScore}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Iniziali (Σ cicli)</Label>
                        <div className="text-lg font-bold">{formatNumber(mortalityV2Query.data.summary.totalInitial)}</div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Attuali in coltura</Label>
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">{formatNumber(mortalityV2Query.data.summary.totalCurrent)}</div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Venduti</Label>
                        <div className="text-lg font-bold">{formatNumber(mortalityV2Query.data.summary.totalSold)}</div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Mortalità</Label>
                        <div className="text-lg font-bold text-red-600 dark:text-red-400">
                          {formatNumber(mortalityV2Query.data.summary.totalMortality)}
                          <span className="text-sm ml-2">({mortalityV2Query.data.summary.totalMortalityPct}%)</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground border-t pt-2">
                      Calcolata su {mortalityV2Query.data.summary.totalCycles} cicli del lotto:
                      {' '}<span className="text-green-700">{mortalityV2Query.data.summary.cyclesV2} con formula nuova</span>,
                      {' '}<span className="text-amber-700">{mortalityV2Query.data.summary.cyclesV1} solo formula vecchia</span>
                      {mortalityV2Query.data.summary.cyclesNoData > 0 && (<>, <span className="text-red-700">{mortalityV2Query.data.summary.cyclesNoData} senza dati</span></>)}.
                      {mortalityV2Query.data.summary.dataQualityScore < 80 && (
                        <span className="block mt-1 italic">⚠ Per dati più affidabili, registra una nuova Misura sui cicli ancora "v1" (vedi dashboard "Ceste da Riallineare").</span>
                      )}
                    </div>
                    {mortalityV2Query.data.cycles.length > 0 && (
                      <details className="text-sm">
                        <summary className="cursor-pointer font-medium hover:underline">Dettaglio per ciclo ({mortalityV2Query.data.cycles.length})</summary>
                        <div className="mt-2 max-h-64 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Cesta</TableHead>
                                <TableHead>FLUPSY</TableHead>
                                <TableHead className="text-right">Iniziali</TableHead>
                                <TableHead className="text-right">Attuali</TableHead>
                                <TableHead className="text-right">Venduti</TableHead>
                                <TableHead className="text-right">Mortalità %</TableHead>
                                <TableHead>Dati</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {mortalityV2Query.data.cycles.map((c) => (
                                <TableRow key={c.cycleId}>
                                  <TableCell>#{c.physicalNumber} {c.cycleState === 'closed' && <Badge variant="secondary" className="ml-1 text-[10px]">chiuso</Badge>}</TableCell>
                                  <TableCell className="text-xs">{c.flupsyName}</TableCell>
                                  <TableCell className="text-right">{formatNumber(c.initialCount)}</TableCell>
                                  <TableCell className="text-right">{formatNumber(c.currentCount)}</TableCell>
                                  <TableCell className="text-right">{formatNumber(c.soldCount)}</TableCell>
                                  <TableCell className="text-right font-medium">{c.mortalityPct}%</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={
                                      c.dataQuality === 'v2' ? 'bg-green-50 text-green-700 border-green-300' :
                                      c.dataQuality === 'v1' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                                      'bg-gray-50 text-gray-600'
                                    }>{c.dataQuality}</Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </details>
                    )}
                  </div>
                )}

                {/* SEZIONE A: STOCCAGGIO LOTTO */}
                <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <h3 className="text-lg font-semibold">📦 Stoccaggio Lotto</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Conteggio iniziale</Label>
                      <div className="text-2xl font-bold">
                        {formatNumber(inventoryQuery.data?.balance?.initial || inventoryQuery.data?.initialCount)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Disponibile nel lotto</Label>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {formatNumber(inventoryQuery.data?.storage?.available || 0)}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Immessi in allevamento: <span className="font-semibold">{formatNumber(inventoryQuery.data?.storage?.activatedTotal || 0)}</span> animali
                  </div>
                </div>

                {/* SEZIONE B: IN ALLEVAMENTO */}
                <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <h3 className="text-lg font-semibold">🌊 In Allevamento</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Totale immesso</Label>
                      <div className="text-xl font-semibold">
                        {formatNumber(inventoryQuery.data?.cultivation?.immessi || 0)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Attualmente in coltura</Label>
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">
                        {formatNumber(inventoryQuery.data?.cultivation?.active || inventoryQuery.data?.currentCount)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      Mortalità in allevamento: <span className="font-semibold text-red-600 dark:text-red-400">
                        {formatNumber(inventoryQuery.data?.cultivation?.mortality || 0)}
                      </span>
                    </div>
                    <div>
                      Vendite da selezioni: <span className="font-semibold">
                        {formatNumber(inventoryQuery.data?.cultivation?.sold || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* SEZIONE C: BILANCIO COMPLESSIVO */}
                <div className="space-y-3 p-4 border-2 rounded-lg bg-primary/5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">📊 Bilancio Complessivo</h3>
                    {inventoryQuery.data?.balance?.verified && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30">
                        ✓ Verificato
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Conteggio iniziale:</span>
                      <span className="font-semibold">{formatNumber(inventoryQuery.data?.balance?.initial || inventoryQuery.data?.initialCount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Disponibile lotto:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{formatNumber(inventoryQuery.data?.balance?.storageAvailable || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">In allevamento:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">{formatNumber(inventoryQuery.data?.balance?.inCultivation || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Venduto totale:</span>
                      <span className="font-semibold">{formatNumber(inventoryQuery.data?.balance?.totalSold || inventoryQuery.data?.soldCount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mortalità totale:</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">{formatNumber(inventoryQuery.data?.balance?.totalMortality || inventoryQuery.data?.mortalityCount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Percentuale mortalità:</span>
                      <span className="font-semibold">{formatPercentage(inventoryQuery.data?.mortalityPercentage)}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Label htmlFor="mortality-notes">Note (opzionale)</Label>
                  <Textarea
                    id="mortality-notes"
                    placeholder="Inserisci eventuali note sul calcolo della mortalità"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleRecordMortality}
                  disabled={recordMortalityMutation.isPending}
                  className="w-full"
                >
                  {recordMortalityMutation.isPending 
                    ? "Registrazione in corso..." 
                    : "Registra calcolo di mortalità"}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Tab Transazioni */}
          <TabsContent value="transactions">
            {transactionsQuery.isLoading ? (
              <div className="space-y-2 py-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : transactionsQuery.isError ? (
              <div className="py-4 text-center text-destructive">
                Errore nel caricamento delle transazioni
              </div>
            ) : !transactionsQuery.data || transactionsQuery.data.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Nessuna transazione registrata
              </div>
            ) : (
              <Table>
                <TableCaption>Elenco delle transazioni per questo lotto</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Quantità</TableHead>
                    <TableHead>Cesta</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-center">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsQuery.data && transactionsQuery.data.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {transaction.date ? format(new Date(transaction.date), "dd/MM/yyyy") : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          transaction.transactionType === "arrivo-lotto" || transaction.transactionType === "in"
                            ? "default" 
                            : transaction.transactionType === "vendita" || transaction.transactionType === "sale"
                              ? "destructive" 
                              : transaction.transactionType === "mortality" || transaction.transactionType === "mortalita"
                                ? "outline"
                                : "secondary"
                        }>
                          {translateTransactionType(transaction.transactionType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {transaction.animalCount > 0 ? "+" : ""}
                        {formatNumber(transaction.animalCount)}
                      </TableCell>
                      <TableCell>
                        {transaction.basketId && transaction.basketPhysicalNumber ? (
                          <div className="text-sm">
                            <span className="font-medium">#{transaction.basketPhysicalNumber}</span>
                            {transaction.flupsyName && (
                              <span className="text-muted-foreground ml-1 text-xs">
                                ({transaction.flupsyName})
                              </span>
                            )}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {transaction.notes || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {transaction.cycleId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/cycles/${transaction.cycleId}`)}
                            title="Vedi dettagli ciclo e operazioni"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          {/* Tab Mortalità */}
          <TabsContent value="mortality">
            {mortalityHistoryQuery.isLoading ? (
              <div className="space-y-2 py-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : mortalityHistoryQuery.isError ? (
              <div className="py-4 text-center text-destructive">
                Errore nel caricamento dei dati di mortalità
              </div>
            ) : !mortalityHistoryQuery.data || mortalityHistoryQuery.data.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Nessun calcolo di mortalità registrato
              </div>
            ) : (
              <Table>
                <TableCaption>Cronologia dei calcoli di mortalità</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Iniziale</TableHead>
                    <TableHead className="text-right">Attuale</TableHead>
                    <TableHead className="text-right">Venduti</TableHead>
                    <TableHead className="text-right">Mortalità</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mortalityHistoryQuery.data && mortalityHistoryQuery.data.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {record.calculationDate ? format(new Date(record.calculationDate), "dd/MM/yyyy") : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(record.initialCount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(record.currentCount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(record.soldCount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(record.mortalityCount)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPercentage(record.mortalityPercentage)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-xs text-muted-foreground">
          Ultimo aggiornamento: {
            !inventoryQuery.isLoading && !inventoryQuery.isError 
              ? format(new Date(), "dd/MM/yyyy HH:mm:ss")
              : "-"
          }
        </div>
        <Button 
          variant="outline" 
          onClick={() => {
            // Invalidare tutte le query relative all'inventario di questo lotto
            queryClient.invalidateQueries({ queryKey: ["/api/lot-inventory", lotId, "current"] });
            queryClient.invalidateQueries({ queryKey: ["/api/lot-inventory", lotId, "transactions"] });
            queryClient.invalidateQueries({ queryKey: ["/api/lot-inventory", lotId, "mortality-history"] });
            
            // Mostra una notifica all'utente
            toast({
              title: "Aggiornamento in corso",
              description: "Recupero i dati più recenti dell'inventario...",
            });
          }}
        >
          Aggiorna
        </Button>
      </CardFooter>
    </Card>
  );
}