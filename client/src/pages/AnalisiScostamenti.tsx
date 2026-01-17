import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, Target, Calendar, Package, Settings2, RefreshCw, Download, Save, HelpCircle, Send, Sparkles } from "lucide-react";
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, Cell } from "recharts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface MortalityExpectation {
  id: number;
  seedSize: string;
  saleSize: string;
  totalMortalityPercent: number;
  effectiveFrom: string;
  notes: string | null;
}

interface MonthlyForecast {
  year: number;
  month: number;
  monthName: string;
  sizeCategory: string;
  budgetAnimals: number;
  ordersAnimals: number;
  productionForecast: number;
  varianceBudgetOrders: number;
  varianceBudgetProduction: number;
  varianceOrdersProduction: number;
  seedingRequirement: number;
  seedingDeadline: string | null;
  status: 'on_track' | 'warning' | 'critical';
  statusDescription: string;
  stockResiduo: number;
  giacenzaInizioMese: number;
  seminaT1Richiesta: number;
  meseSeminaT1: string | null;
  giorniCrescita: number;
}

interface SeedingSchedule {
  seedingMonth: number;
  seedingYear: number;
  seedingMonthName: string;
  targetMonth: number;
  targetYear: number;
  targetMonthName: string;
  targetSize: string;
  seedT1Amount: number;
  growthDays: number;
}

interface InventoryBySize {
  sizeCategory: string;
  sizeName: string;
  totalAnimals: number;
  animalsPerKgRange: string;
}

interface OrdersBySize {
  sizeCode: string;
  totalAnimals: number;
  aggregateCategory: 'T3' | 'T10';
}

interface ForecastData {
  success: boolean;
  year: number;
  totalBudget: number;
  totalOrders: number;
  totalOrdersYearAllocated?: number;
  totalProductionForecast: number;
  overallVariance: number;
  monthlyData: MonthlyForecast[];
  currentInventory: InventoryBySize[];
  seedingSchedule: SeedingSchedule[];
  totalSeedingT1Required: number;
  ordersBySpecificSize?: OrdersBySize[];
  budgetByCategory?: Record<string, number>;
  ordersByCategory?: Record<string, number>;
  ordersAbsoluteBySize?: Record<string, number>;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(0) + 'K';
  }
  return num.toLocaleString('it-IT');
};

const formatFullNumber = (num: number): string => {
  return num.toLocaleString('it-IT');
};

const getStatusBadge = (status: string, description?: string) => {
  const text = description || (status === 'on_track' ? 'Coperto' : status === 'warning' ? 'Attenzione' : 'Critico');
  switch (status) {
    case 'on_track':
      return <Badge className="bg-green-100 text-green-800">{text}</Badge>;
    case 'warning':
      return <Badge className="bg-yellow-100 text-yellow-800">{text}</Badge>;
    case 'critical':
      return <Badge className="bg-red-100 text-red-800">{text}</Badge>;
    default:
      return <Badge>-</Badge>;
  }
};

const getVarianceColor = (variance: number) => {
  if (variance >= 0) return 'text-green-600';
  if (variance >= -0.1) return 'text-yellow-600';
  return 'text-red-600';
};

const SALE_SIZES = ['TP-2000', 'TP-3000', 'TP-3500', 'TP-4000', 'TP-5000'] as const;

export default function AnalisiScostamenti() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [inputMortalityT1, setInputMortalityT1] = useState<number>(5);
  const [inputMortalityT3, setInputMortalityT3] = useState<number>(3);
  const [inputMortalityT10, setInputMortalityT10] = useState<number>(2);
  
  const [appliedMortalityT1, setAppliedMortalityT1] = useState<number>(5);
  const [appliedMortalityT3, setAppliedMortalityT3] = useState<number>(3);
  const [appliedMortalityT10, setAppliedMortalityT10] = useState<number>(2);

  // State per mortalità per taglia di vendita
  const [mortalityBySize, setMortalityBySize] = useState<Record<string, number>>({
    'TP-2000': 8,
    'TP-3000': 12,
    'TP-3500': 15,
    'TP-4000': 18,
    'TP-5000': 20
  });

  // Query per caricare le aspettative di mortalità dal database
  const { data: mortalityExpectations } = useQuery<MortalityExpectation[]>({
    queryKey: ['/api/mortality-expectations'],
    queryFn: async () => {
      const response = await fetch('/api/mortality-expectations');
      if (!response.ok) throw new Error('Errore caricamento mortalità');
      return response.json();
    }
  });

  // Sincronizza lo state locale quando arrivano i dati dal database
  useEffect(() => {
    if (mortalityExpectations && mortalityExpectations.length > 0) {
      const newMortality: Record<string, number> = {};
      mortalityExpectations.forEach(exp => {
        newMortality[exp.saleSize] = exp.totalMortalityPercent;
      });
      setMortalityBySize(prev => ({ ...prev, ...newMortality }));
    }
  }, [mortalityExpectations]);

  // Mutation per salvare le mortalità
  const saveMortalityMutation = useMutation({
    mutationFn: async (data: { saleSize: string; totalMortalityPercent: number }) => {
      const response = await fetch('/api/mortality-expectations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seedSize: 'TP-1000',
          saleSize: data.saleSize,
          totalMortalityPercent: data.totalMortalityPercent
        })
      });
      if (!response.ok) throw new Error('Errore salvataggio');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mortality-expectations'] });
    }
  });

  const handleMortalityChange = (saleSize: string, value: number) => {
    setMortalityBySize(prev => ({ ...prev, [saleSize]: value }));
  };

  const saveAllMortalities = async () => {
    try {
      for (const size of SALE_SIZES) {
        await saveMortalityMutation.mutateAsync({
          saleSize: size,
          totalMortalityPercent: mortalityBySize[size]
        });
      }
      toast({
        title: "Salvato",
        description: "Mortalità attese aggiornate con successo"
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare le mortalità",
        variant: "destructive"
      });
    }
  };

  const applyMortality = () => {
    setAppliedMortalityT1(inputMortalityT1);
    setAppliedMortalityT3(inputMortalityT3);
    setAppliedMortalityT10(inputMortalityT10);
  };

  const exportToExcel = async () => {
    if (!data) return;
    
    const params = new URLSearchParams({
      year: String(selectedYear),
      mortalityT1: String(appliedMortalityT1),
      mortalityT3: String(appliedMortalityT3),
      mortalityT10: String(appliedMortalityT10),
      category: selectedCategory
    });
    
    const response = await fetch(`/api/ai/production-forecast/export-simple?${params}`);
    if (!response.ok) {
      alert('Errore durante la generazione del report');
      return;
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Scostamenti_Produzione_${selectedYear}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const exportAnalyticalReport = async () => {
    const params = new URLSearchParams({
      year: String(selectedYear),
      mortalityT1: String(appliedMortalityT1),
      mortalityT3: String(appliedMortalityT3),
      mortalityT10: String(appliedMortalityT10)
    });
    
    const response = await fetch(`/api/ai/production-forecast/export-analytical?${params}`);
    if (!response.ok) {
      alert('Errore durante la generazione del report');
      return;
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report_Analitico_Scostamenti_${selectedYear}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const { data, isLoading, error } = useQuery<ForecastData>({
    queryKey: ['/api/ai/production-forecast', selectedYear, appliedMortalityT1, appliedMortalityT3, appliedMortalityT10],
    queryFn: async () => {
      const params = new URLSearchParams({
        year: String(selectedYear),
        mortalityT1: String(appliedMortalityT1),
        mortalityT3: String(appliedMortalityT3),
        mortalityT10: String(appliedMortalityT10)
      });
      const response = await fetch(`/api/ai/production-forecast?${params}`);
      if (!response.ok) throw new Error('Errore caricamento dati');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Caricamento analisi...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Errore</AlertTitle>
        <AlertDescription>
          Impossibile caricare i dati di analisi. Riprova più tardi.
        </AlertDescription>
      </Alert>
    );
  }

  // Mappa taglie specifiche alle categorie
  const mapSizeToCategory = (size: string): string => {
    if (size.includes('2000') || size.includes('3000') || size.includes('3500')) return 'T3';
    if (size.includes('4000') || size.includes('5000')) return 'T10';
    return size;
  };
  
  const effectiveCategory = selectedCategory.startsWith('TP-') 
    ? mapSizeToCategory(selectedCategory) 
    : selectedCategory;
  
  const filteredData = effectiveCategory === 'all' 
    ? data.monthlyData 
    : data.monthlyData.filter(d => d.sizeCategory === effectiveCategory);

  // Grafici dinamici basati sulla selezione
  const showT3Chart = effectiveCategory === 'all' || effectiveCategory === 'T3';
  const showT10Chart = effectiveCategory === 'all' || effectiveCategory === 'T10';
  
  const chartDataT3 = data.monthlyData
    .filter(d => d.sizeCategory === 'T3')
    .map(d => ({
      name: d.monthName.substring(0, 3),
      budget: d.budgetAnimals / 1000000,
      produzione: d.productionForecast / 1000000,
      ordini: d.ordersAnimals / 1000000
    }));

  const chartDataT10 = data.monthlyData
    .filter(d => d.sizeCategory === 'T10')
    .map(d => ({
      name: d.monthName.substring(0, 3),
      budget: d.budgetAnimals / 1000000,
      produzione: d.productionForecast / 1000000,
      ordini: d.ordersAnimals / 1000000
    }));
    
  
  const totalT3Budget = data.monthlyData
    .filter(d => d.sizeCategory === 'T3')
    .reduce((sum, d) => sum + d.budgetAnimals, 0);
  
  const totalT10Budget = data.monthlyData
    .filter(d => d.sizeCategory === 'T10')
    .reduce((sum, d) => sum + d.budgetAnimals, 0);

  const criticalMonths = data.monthlyData.filter(d => d.status === 'critical');
  const warningMonths = data.monthlyData.filter(d => d.status === 'warning');

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Analisi Scostamenti Produzione
          </h1>
          <p className="text-muted-foreground">
            Confronto Budget vs Ordini vs Produzione prevista
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2027">2027</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte</SelectItem>
              <SelectItem value="T3">Solo T3</SelectItem>
              <SelectItem value="T10">Solo T10</SelectItem>
              {data?.ordersAbsoluteBySize && Object.keys(data.ordersAbsoluteBySize)
                .filter(s => (data.ordersAbsoluteBySize?.[s] || 0) > 0)
                .sort((a, b) => {
                  const numA = parseInt(a.replace(/\D/g, '')) || 0;
                  const numB = parseInt(b.replace(/\D/g, '')) || 0;
                  return numA - numB;
                })
                .map(size => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))
              }
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-slate-50">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Mortalità Attesa (%) - Da TP-1000 a Taglia Vendita
          </CardTitle>
          <CardDescription className="text-xs">
            Imposta la mortalità totale attesa dalla semina (TP-1000) fino a ciascuna taglia di vendita. Il sistema distribuirà automaticamente questa mortalità settimanalmente.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-2">
          <div className="flex flex-wrap items-center gap-4">
            {(() => {
              // Usa taglie dinamiche dagli ordini, fallback a SALE_SIZES
              const dynamicSizes = data?.ordersAbsoluteBySize 
                ? Object.keys(data.ordersAbsoluteBySize)
                    .filter(s => (data.ordersAbsoluteBySize?.[s] || 0) > 0)
                    .sort((a, b) => {
                      const numA = parseInt(a.replace(/\D/g, '')) || 0;
                      const numB = parseInt(b.replace(/\D/g, '')) || 0;
                      return numA - numB;
                    })
                : [...SALE_SIZES];
              
              return dynamicSizes.map(size => {
                const isT3 = size.includes('2000') || size.includes('3000') || size.includes('3500');
                return (
                  <div key={size} className="flex items-center gap-1.5">
                    <Label 
                      htmlFor={`mortality-${size}`} 
                      className={`text-xs font-medium ${isT3 ? 'text-green-700' : 'text-purple-700'}`}
                    >
                      {size}:
                    </Label>
                    <Input
                      id={`mortality-${size}`}
                      type="number"
                      min="0"
                      max="50"
                      step="0.5"
                      value={mortalityBySize[size] || 0}
                      onChange={(e) => handleMortalityChange(size, parseFloat(e.target.value) || 0)}
                      className="w-16 h-7 text-sm"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                );
              });
            })()}
            <Button 
              onClick={saveAllMortalities}
              size="sm"
              className="h-7"
              disabled={saveMortalityMutation.isPending}
            >
              {saveMortalityMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Save className="h-3 w-3 mr-1" />
              )}
              Salva
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Totale</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.totalBudget)}</div>
            <p className="text-xs text-muted-foreground">
              T3: {formatNumber(data.budgetByCategory?.T3 || totalT3Budget)} | T10: {formatNumber(data.budgetByCategory?.T10 || totalT10Budget)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ordini Attivi</CardTitle>
            <Package className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{formatNumber(data.totalOrders)}</div>
            <p className="text-xs text-muted-foreground">
              T3: {formatNumber(data.ordersByCategory?.T3 || 0)} | T10: {formatNumber(data.ordersByCategory?.T10 || 0)}
            </p>
            {data.ordersAbsoluteBySize && Object.keys(data.ordersAbsoluteBySize).length > 0 && (
              <div className="mt-2 pt-2 border-t space-y-1">
                {SALE_SIZES.map((sizeCode) => {
                  const qty = data.ordersAbsoluteBySize?.[sizeCode] || 0;
                  if (qty === 0) return null;
                  const isT3 = sizeCode.includes('2000') || sizeCode.includes('3000') || sizeCode.includes('3500');
                  return (
                    <div key={sizeCode} className="flex justify-between text-xs">
                      <span className={isT3 ? 'text-green-700' : 'text-purple-700'}>
                        {sizeCode}
                      </span>
                      <span className="font-medium">{formatNumber(qty)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produzione Prevista</CardTitle>
            {data.overallVariance >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.totalProductionForecast)}</div>
            <p className={`text-xs ${getVarianceColor(data.overallVariance)}`}>
              {data.overallVariance >= 0 ? '+' : ''}{formatNumber(data.overallVariance)} vs budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Allerte</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalMonths.length + warningMonths.length}</div>
            <p className="text-xs text-muted-foreground">
              {criticalMonths.length} critici, {warningMonths.length} attenzione
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inventario Attuale per Taglia</CardTitle>
            <CardDescription>Animali vivi attualmente in produzione</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Taglia</TableHead>
                  <TableHead className="text-right">Animali</TableHead>
                  <TableHead className="text-right">an/kg</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.currentInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Nessun dato inventario disponibile
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {data.currentInventory.map((inv, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{inv.sizeName}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatFullNumber(inv.totalAnimals)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {inv.animalsPerKgRange}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-slate-100 font-bold">
                      <TableCell>TOTALE</TableCell>
                      <TableCell className="text-right">
                        {formatFullNumber(data.currentInventory.reduce((sum, inv) => sum + inv.totalAnimals, 0))}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">-</TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Semine Richieste</CardTitle>
            <CardDescription>Azioni correttive per raggiungere budget</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredData
                .filter(d => d.seedingRequirement > 0)
                .slice(0, 5)
                .map((d, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">Target: {d.monthName} {d.sizeCategory}</div>
                      <div className="text-sm text-orange-600 flex items-center gap-1 font-medium">
                        <Calendar className="h-3 w-3" />
                        Seminare in: {d.meseSeminaT1 || 'N/A'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ({d.giorniCrescita} giorni di crescita)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-orange-600">
                        +{formatNumber(d.seedingRequirement)}
                      </div>
                      <div className="text-xs text-muted-foreground">animali T1</div>
                    </div>
                  </div>
                ))}
              {filteredData.filter(d => d.seedingRequirement > 0).length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  Nessuna semina aggiuntiva richiesta
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="chart" className="w-full">
        <TabsList>
          <TabsTrigger value="chart">Grafici</TabsTrigger>
          <TabsTrigger value="table">Tabella Dettaglio</TabsTrigger>
          <TabsTrigger value="roadmap">🗺️ Roadmap Produzione</TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="space-y-4">
          <div className={`grid gap-4 ${showT3Chart && showT10Chart ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
            {showT3Chart && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Budget vs Ordini vs Produzione - {selectedCategory.startsWith('TP-') && effectiveCategory === 'T3' ? `${selectedCategory} (T3)` : 'T3'}
                  </CardTitle>
                  <CardDescription>Milioni di animali per mese (verde = T3)</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataT3}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip formatter={(value: number) => `${value.toFixed(2)}M`} />
                      <Legend />
                      <Bar dataKey="budget" name="Budget" fill="#94a3b8" />
                      <Bar dataKey="ordini" name="Ordini" fill="#6366f1" />
                      <Bar dataKey="produzione" name="Produzione" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {showT10Chart && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Budget vs Ordini vs Produzione - {selectedCategory.startsWith('TP-') && effectiveCategory === 'T10' ? `${selectedCategory} (T10)` : 'T10'}
                  </CardTitle>
                  <CardDescription>Milioni di animali per mese (blu = T10)</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataT10}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip formatter={(value: number) => `${value.toFixed(2)}M`} />
                      <Legend />
                      <Bar dataKey="budget" name="Budget" fill="#94a3b8" />
                      <Bar dataKey="ordini" name="Ordini" fill="#6366f1" />
                      <Bar dataKey="produzione" name="Produzione" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Dettaglio Mensile</CardTitle>
                <CardDescription>
                  Tutti gli scostamenti budget/ordini/produzione per mese e taglia
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={exportToExcel} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                  <Download className="h-4 w-4 mr-2" />
                  Esporta Excel
                </Button>
                <Button onClick={exportAnalyticalReport} variant="default" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Report Analitico
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1 cursor-help">
                              Mese <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>Mese di riferimento per vendita/consegna degli animali</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1 cursor-help">
                              Taglia <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>Taglie specifiche (TP-XXX) previste per la vendita in questo mese. T3 = animali piccoli (TP-2000/3000/3500), T10 = animali grandi (TP-4000/5000)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1 cursor-help justify-end">
                              Giacenza <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>Animali di questa taglia attualmente in allevamento all'inizio del mese</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1 cursor-help justify-end">
                              Budget <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>Animali previsti da vendere secondo il piano di vendita annuale</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead className="text-right text-indigo-600">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1 cursor-help justify-end">
                              Ordini <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>Animali effettivamente ordinati dai clienti per questo mese (dato reale da ordini)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1 cursor-help justify-end">
                              Produzione <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>Stima animali pronti per la vendita basata sulla crescita SGR della giacenza attuale</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1 cursor-help justify-end">
                              Δ vs Budget <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>Differenza Produzione - Budget. Positivo = produci più del previsto, Negativo = produci meno</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead className="text-right text-indigo-600">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1 cursor-help justify-end">
                              Δ vs Ordini <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>Differenza Produzione - Ordini. Positivo = riesci a coprire gli ordini, Negativo = non li copri</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1 cursor-help justify-end">
                              Stock <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>Animali che restano dopo aver soddisfatto budget/ordini del mese</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead className="text-right text-orange-600">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1 cursor-help justify-end">
                              Semina T1 <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>Quanti animali piccoli (T1) devi seminare ORA per coprire la domanda futura di questo mese</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead className="text-orange-600">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1 cursor-help">
                              Mese Semina <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>Quando devi seminare il T1 per averlo pronto in tempo per questo mese di vendita</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1 cursor-help">
                              Stato <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>Indicatore di rischio: Verde = coperto, Giallo = attenzione, Rosso = critico</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{row.monthName}</TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="cursor-help">
                                <Badge variant="outline" className="text-xs font-medium">
                                  {row.sizeCategory === 'T3' ? 'Semina Normale' : row.sizeCategory === 'T10' ? 'Semina Grossa' : row.sizeCategory}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="p-2">
                                <div className="flex flex-col gap-1.5">
                                  {row.sizeCategory === 'T3' ? (
                                    <>
                                      <div className="flex items-center justify-between gap-3">
                                        <Badge className="text-xs bg-blue-500 text-white">TP-2000</Badge>
                                        <span className="text-xs text-gray-600">{formatNumber(data.ordersAbsoluteBySize?.['TP-2000'] || 0)} ordini</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-3">
                                        <Badge className="text-xs bg-green-500 text-white">TP-3000</Badge>
                                        <span className="text-xs text-gray-600">{formatNumber(data.ordersAbsoluteBySize?.['TP-3000'] || 0)} ordini</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-3">
                                        <Badge className="text-xs bg-teal-500 text-white">TP-3500</Badge>
                                        <span className="text-xs text-gray-600">{formatNumber(data.ordersAbsoluteBySize?.['TP-3500'] || 0)} ordini</span>
                                      </div>
                                    </>
                                  ) : row.sizeCategory === 'T10' ? (
                                    <>
                                      <div className="flex items-center justify-between gap-3">
                                        <Badge className="text-xs bg-orange-500 text-white">TP-4000</Badge>
                                        <span className="text-xs text-gray-600">{formatNumber(data.ordersAbsoluteBySize?.['TP-4000'] || 0)} ordini</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-3">
                                        <Badge className="text-xs bg-red-500 text-white">TP-5000</Badge>
                                        <span className="text-xs text-gray-600">{formatNumber(data.ordersAbsoluteBySize?.['TP-5000'] || 0)} ordini</span>
                                      </div>
                                    </>
                                  ) : (
                                    <Badge variant="outline">{row.sizeCategory}</Badge>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-right text-purple-600 font-medium">
                          {formatNumber(row.giacenzaInizioMese)}
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(row.budgetAnimals)}</TableCell>
                        <TableCell className="text-right text-indigo-600 font-medium">
                          {row.ordersAnimals > 0 ? formatNumber(row.ordersAnimals) : '-'}
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(row.productionForecast)}</TableCell>
                        <TableCell className={`text-right ${getVarianceColor(row.varianceBudgetProduction)}`}>
                          {row.varianceBudgetProduction >= 0 ? '+' : ''}
                          {formatNumber(row.varianceBudgetProduction)}
                        </TableCell>
                        <TableCell className={`text-right ${row.ordersAnimals > 0 ? getVarianceColor(row.varianceOrdersProduction) : 'text-muted-foreground'}`}>
                          {row.ordersAnimals > 0 ? (
                            <>
                              {row.varianceOrdersProduction >= 0 ? '+' : ''}
                              {formatNumber(row.varianceOrdersProduction)}
                            </>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-right text-blue-600">
                          {formatNumber(row.stockResiduo)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-orange-600">
                          {row.seminaT1Richiesta > 0 ? formatNumber(row.seminaT1Richiesta) : '-'}
                        </TableCell>
                        <TableCell className="text-orange-600 font-medium">
                          {row.meseSeminaT1 || '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(row.status, row.statusDescription)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-slate-100 font-bold border-t-2">
                      <TableCell>TOTALE</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className="text-right">
                        {formatNumber(filteredData.reduce((sum, r) => sum + r.budgetAnimals, 0))}
                      </TableCell>
                      <TableCell className="text-right text-indigo-600">
                        {formatNumber(filteredData.reduce((sum, r) => sum + r.ordersAnimals, 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(filteredData.reduce((sum, r) => sum + r.productionForecast, 0))}
                      </TableCell>
                      <TableCell className={`text-right ${getVarianceColor(filteredData.reduce((sum, r) => sum + r.varianceBudgetProduction, 0))}`}>
                        {filteredData.reduce((sum, r) => sum + r.varianceBudgetProduction, 0) >= 0 ? '+' : ''}
                        {formatNumber(filteredData.reduce((sum, r) => sum + r.varianceBudgetProduction, 0))}
                      </TableCell>
                      <TableCell className={`text-right ${getVarianceColor(filteredData.reduce((sum, r) => sum + r.varianceOrdersProduction, 0))}`}>
                        {filteredData.reduce((sum, r) => sum + r.varianceOrdersProduction, 0) >= 0 ? '+' : ''}
                        {formatNumber(filteredData.reduce((sum, r) => sum + r.varianceOrdersProduction, 0))}
                      </TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className="text-right text-orange-600">
                        {formatNumber(filteredData.reduce((sum, r) => sum + r.seminaT1Richiesta, 0))}
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roadmap">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🗺️ Roadmap Produzione
              </CardTitle>
              <CardDescription>
                Timeline dinamica: dalla giacenza attuale agli ordini da soddisfare, passando per crescita e mortalità
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductionRoadmap 
                monthlyData={data.monthlyData}
                ordersAbsoluteBySize={data.ordersAbsoluteBySize}
                currentInventory={data.currentInventory}
                seedingSchedule={data.seedingSchedule}
                mortalityBySize={mortalityBySize}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente Roadmap Produzione con Gantt dinamico
interface ProductionRoadmapProps {
  monthlyData: MonthlyForecast[];
  ordersAbsoluteBySize: Record<string, number>;
  currentInventory: InventoryBySize[];
  seedingSchedule: SeedingSchedule[];
  mortalityBySize: Record<string, number>;
}

interface AIAnalysisResult {
  answer: string;
  recommendations: string[];
  dataPoints: Array<{ label: string; value: string; trend: 'positive' | 'negative' | 'neutral' }>;
  confidence: number;
}

function ProductionRoadmap({ monthlyData, ordersAbsoluteBySize, currentInventory, seedingSchedule, mortalityBySize }: ProductionRoadmapProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [mortalityAdjustment, setMortalityAdjustment] = useState(0);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  
  // Taglie ordinate
  const sizes = ['TP-2000', 'TP-3000', 'TP-3500', 'TP-4000', 'TP-5000'];
  
  const askAI = async (question: string) => {
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    setAiQuestion(question);
    
    try {
      const totalBaseInventory = sizes.reduce((sum, s) => {
        const inv = currentInventory.find(i => i.sizeName === s);
        return sum + (inv?.totalAnimals || 0);
      }, 0);
      
      const totalAdjustedInventory = sizes.reduce((sum, s) => {
        const baseInventory = currentInventory.find(i => i.sizeName === s)?.totalAnimals || 0;
        const baseMortality = mortalityBySize[s] || 0;
        const effectiveMortality = baseMortality * (1 + mortalityAdjustment / 100);
        const mortalityDelta = (effectiveMortality - baseMortality) / 100;
        const adjusted = baseInventory * (1 - mortalityDelta);
        return sum + Math.round(adjusted);
      }, 0);
      
      const mortalityImpact = totalAdjustedInventory - totalBaseInventory;
      
      const context = {
        currentInventory: currentInventory.map(i => ({
          sizeName: i.sizeName,
          totalAnimals: i.totalAnimals,
          sizeCategory: i.sizeCategory
        })),
        monthlyData: monthlyData.map(m => ({
          month: m.month,
          monthName: m.monthName,
          sizeCategory: m.sizeCategory,
          ordersAnimals: m.ordersAnimals,
          productionForecast: m.productionForecast,
          varianceOrdersProduction: m.varianceOrdersProduction,
          status: m.status,
          seminaT1Richiesta: m.seminaT1Richiesta,
          meseSeminaT1: m.meseSeminaT1
        })),
        ordersAbsoluteBySize,
        mortalityBySize,
        mortalityAdjustment,
        baselineInventory: totalBaseInventory,
        adjustedInventory: totalAdjustedInventory,
        mortalityImpact
      };
      
      const response = await fetch('/api/ai/scenario-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context, year: new Date().getFullYear() })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAiResult({
          answer: data.answer,
          recommendations: data.recommendations || [],
          dataPoints: data.dataPoints || [],
          confidence: data.confidence || 0.8
        });
      } else {
        setAiError(data.error || 'Errore durante l\'analisi');
      }
    } catch (error) {
      console.error('Errore AI:', error);
      setAiError('Errore di connessione. Riprova.');
    } finally {
      setAiLoading(false);
    }
  };
  
  // Calcola mortalità effettiva per taglia con adjustment
  const getEffectiveMortality = (size: string) => {
    const baseMortality = mortalityBySize[size] || 0;
    // Adjustment è relativo: +10% su base 25% = 25 * 1.10 = 27.5%
    const adjusted = baseMortality * (1 + mortalityAdjustment / 100);
    return Math.max(0, Math.min(100, adjusted));
  };
  
  // Calcola giacenza proiettata con mortalità adjusted
  const getAdjustedInventoryForSize = (size: string) => {
    const baseInventory = currentInventory.find(i => i.sizeName === size)?.totalAnimals || 0;
    const effectiveMortality = getEffectiveMortality(size);
    const baseMortality = mortalityBySize[size] || 0;
    
    // Calcola la differenza di mortalità e applica all'inventario
    const mortalityDelta = (effectiveMortality - baseMortality) / 100;
    const adjustedInventory = baseInventory * (1 - mortalityDelta);
    return Math.round(adjustedInventory);
  };
  
  // Mesi dell'anno con mapping per nomi completi italiani
  const months = [
    { name: 'Gen', month: 1, fullName: 'Gennaio' }, 
    { name: 'Feb', month: 2, fullName: 'Febbraio' }, 
    { name: 'Mar', month: 3, fullName: 'Marzo' },
    { name: 'Apr', month: 4, fullName: 'Aprile' }, 
    { name: 'Mag', month: 5, fullName: 'Maggio' }, 
    { name: 'Giu', month: 6, fullName: 'Giugno' },
    { name: 'Lug', month: 7, fullName: 'Luglio' }, 
    { name: 'Ago', month: 8, fullName: 'Agosto' }, 
    { name: 'Set', month: 9, fullName: 'Settembre' },
    { name: 'Ott', month: 10, fullName: 'Ottobre' }, 
    { name: 'Nov', month: 11, fullName: 'Novembre' }, 
    { name: 'Dic', month: 12, fullName: 'Dicembre' }
  ];
  
  // Mappa ordini per taglia e mese
  const getOrdersForSize = (size: string) => {
    return ordersAbsoluteBySize[size] || 0;
  };
  
  // Calcola giacenza per taglia
  const getInventoryForSize = (size: string) => {
    const inv = currentInventory.find(i => i.sizeName === size);
    return inv?.totalAnimals || 0;
  };
  
  // Trova mesi con ordini per una taglia
  const getOrderMonthsForSize = (size: string) => {
    const category = size.includes('2000') || size.includes('3000') || size.includes('3500') ? 'T3' : 'T10';
    return monthlyData
      .filter(d => d.sizeCategory === category && d.ordersAnimals > 0)
      .map(d => ({ month: d.month, orders: d.ordersAnimals, variance: d.varianceOrdersProduction }));
  };
  
  // Trova requisiti di semina
  const getSeedingForSize = (size: string) => {
    const category = size.includes('2000') || size.includes('3000') || size.includes('3500') ? 'T3' : 'T10';
    return monthlyData
      .filter(d => d.sizeCategory === category && d.seminaT1Richiesta > 0)
      .map(d => ({ 
        targetMonth: d.month, 
        seedingMonth: d.meseSeminaT1,
        amount: d.seminaT1Richiesta,
        status: d.status
      }));
  };
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };
  
  const currentMonth = new Date().getMonth() + 1;
  
  // Colori per status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Legenda */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 rounded" />
          <span>Giacenza attuale</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded" />
          <span>Ordine coperto</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded animate-pulse" />
          <span>Gap da coprire</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-indigo-600 rounded" />
          <span>Ordini target</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded" />
          <span>Semina richiesta</span>
        </div>
      </div>
      
      {/* Timeline Header */}
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header mesi */}
          <div className="flex border-b-2 border-gray-300 pb-2 mb-4">
            <div className="w-24 font-bold text-sm">Taglia</div>
            {months.map((m, idx) => (
              <div 
                key={m.month} 
                className={`flex-1 text-center text-sm font-medium ${
                  m.month === currentMonth ? 'bg-blue-100 rounded-t-lg text-blue-700 font-bold' : ''
                }`}
              >
                {m.name}
                {m.month === currentMonth && (
                  <div className="text-xs text-blue-500">▼ OGGI</div>
                )}
              </div>
            ))}
          </div>
          
          {/* Swimlanes per taglia */}
          {sizes.map((size, sizeIdx) => {
            const inventory = getInventoryForSize(size);
            const adjustedInventory = getAdjustedInventoryForSize(size);
            const orders = getOrdersForSize(size);
            const orderMonths = getOrderMonthsForSize(size);
            const seedingReqs = getSeedingForSize(size);
            const isT10 = size.includes('4000') || size.includes('5000');
            const effectiveMort = getEffectiveMortality(size);
            const baseMort = mortalityBySize[size] || 0;
            const inventoryDelta = adjustedInventory - inventory;
            
            return (
              <div 
                key={size}
                className={`flex items-center border-b py-3 ${sizeIdx % 2 === 0 ? 'bg-gray-50' : ''}`}
              >
                {/* Label taglia */}
                <div className="w-24 flex-shrink-0">
                  <Badge variant={isT10 ? 'default' : 'secondary'} className="font-mono">
                    {size}
                  </Badge>
                  {inventory > 0 && (
                    <div className={`text-xs mt-1 ${mortalityAdjustment !== 0 ? 'font-bold' : ''} ${
                      mortalityAdjustment > 0 ? 'text-red-600' : mortalityAdjustment < 0 ? 'text-green-600' : 'text-purple-600'
                    }`}>
                      📦 {formatNumber(adjustedInventory)}
                      {mortalityAdjustment !== 0 && inventoryDelta !== 0 && (
                        <span className="text-xs ml-1">
                          ({inventoryDelta > 0 ? '+' : ''}{formatNumber(inventoryDelta)})
                        </span>
                      )}
                    </div>
                  )}
                  {mortalityAdjustment !== 0 && (
                    <div className={`text-xs ${mortalityAdjustment > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      ☠️ {effectiveMort.toFixed(1)}%
                    </div>
                  )}
                </div>
                
                {/* Timeline */}
                <div className="flex-1 flex relative h-16">
                  {months.map((m) => {
                    const orderInMonth = orderMonths.find(o => o.month === m.month);
                    const seedingInMonth = seedingReqs.find(s => s.targetMonth === m.month);
                    const isPast = m.month < currentMonth;
                    const isCurrent = m.month === currentMonth;
                    
                    return (
                      <div 
                        key={m.month}
                        className={`flex-1 relative border-l border-gray-200 ${isPast ? 'opacity-40' : ''}`}
                      >
                        {/* Giacenza attuale (solo mese corrente) */}
                        {isCurrent && adjustedInventory > 0 && (
                          <div 
                            className={`absolute left-0 top-1 h-6 rounded-r-full flex items-center justify-end pr-1 transition-all ${
                              mortalityAdjustment > 0 ? 'bg-red-500' : mortalityAdjustment < 0 ? 'bg-green-500' : 'bg-purple-500'
                            }`}
                            style={{ width: '100%', maxWidth: '100%' }}
                            onMouseEnter={() => setHoveredItem(`inv-${size}`)}
                            onMouseLeave={() => setHoveredItem(null)}
                          >
                            <span className="text-xs text-white font-bold truncate px-1">
                              {formatNumber(adjustedInventory)}
                            </span>
                          </div>
                        )}
                        
                        {/* Ordine target */}
                        {orderInMonth && (
                          <div 
                            className={`absolute left-1 right-1 top-8 h-6 rounded flex items-center justify-center cursor-pointer transition-all ${
                              orderInMonth.variance >= 0 
                                ? 'bg-green-500 hover:bg-green-600' 
                                : 'bg-red-500 hover:bg-red-600 animate-pulse'
                            }`}
                            onMouseEnter={() => setHoveredItem(`order-${size}-${m.month}`)}
                            onMouseLeave={() => setHoveredItem(null)}
                          >
                            <span className="text-xs text-white font-bold">
                              🎯 {formatNumber(orderInMonth.orders)}
                            </span>
                          </div>
                        )}
                        
                        {/* Tooltip per ordine */}
                        {hoveredItem === `order-${size}-${m.month}` && orderInMonth && (
                          <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white p-2 rounded shadow-lg text-xs whitespace-nowrap">
                            <div className="font-bold">{size} - {m.name}</div>
                            <div>Ordini: {formatNumber(orderInMonth.orders)}</div>
                            <div className={orderInMonth.variance >= 0 ? 'text-green-400' : 'text-red-400'}>
                              {orderInMonth.variance >= 0 ? '✅ Coperto' : '❌ Gap'}: {formatNumber(Math.abs(orderInMonth.variance))}
                            </div>
                          </div>
                        )}
                        
                        {/* Semina richiesta */}
                        {seedingInMonth && (
                          <div className="absolute left-0 right-0 -top-2 flex justify-center">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(seedingInMonth.status)} animate-ping absolute`} />
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(seedingInMonth.status)} relative`} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          
          {/* Riga Semina T1 */}
          <div className="flex items-center border-b py-3 bg-orange-50">
            <div className="w-24 flex-shrink-0">
              <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                🌱 SEMINA
              </Badge>
            </div>
            <div className="flex-1 flex relative h-12">
              {months.map((m) => {
                // Trova semine richieste per questo mese (usa fullName per matching corretto)
                const seedingsThisMonth = monthlyData.filter(d => 
                  d.meseSeminaT1?.includes(m.fullName) && d.seminaT1Richiesta > 0
                );
                const totalSeeding = seedingsThisMonth.reduce((sum, s) => sum + s.seminaT1Richiesta, 0);
                const isPast = m.month < currentMonth;
                
                return (
                  <div 
                    key={m.month}
                    className={`flex-1 relative border-l border-gray-200 ${isPast ? 'opacity-40' : ''}`}
                  >
                    {totalSeeding > 0 && (
                      <div 
                        className="absolute left-1 right-1 top-2 h-8 bg-orange-500 rounded flex items-center justify-center"
                        onMouseEnter={() => setHoveredItem(`seeding-${m.month}`)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <span className="text-xs text-white font-bold">
                          🌱 {formatNumber(totalSeeding)}
                        </span>
                      </div>
                    )}
                    
                    {/* Tooltip per semina */}
                    {hoveredItem === `seeding-${m.month}` && totalSeeding > 0 && (
                      <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white p-2 rounded shadow-lg text-xs whitespace-nowrap">
                        <div className="font-bold">Semina T1 - {m.fullName}</div>
                        <div>Totale: {formatNumber(totalSeeding)} animali</div>
                        <div className="text-orange-300">Per coprire ordini futuri</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Banda rischio (semafori) */}
          <div className="flex items-center py-2 mt-2">
            <div className="w-24 flex-shrink-0 text-xs font-medium text-gray-600">
              RISCHIO
            </div>
            <div className="flex-1 flex">
              {months.map((m) => {
                const monthData = monthlyData.filter(d => d.month === m.month);
                const worstStatus = monthData.some(d => d.status === 'critical') 
                  ? 'critical' 
                  : monthData.some(d => d.status === 'warning') 
                    ? 'warning' 
                    : monthData.length > 0 ? 'on_track' : null;
                const isPast = m.month < currentMonth;
                
                return (
                  <div 
                    key={m.month}
                    className={`flex-1 flex justify-center ${isPast ? 'opacity-40' : ''}`}
                  >
                    {worstStatus && (
                      <div className={`w-4 h-4 rounded-full ${getStatusColor(worstStatus)}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Pannello AI Scenario Builder - posizionato subito dopo la roadmap */}
      <Card className="border-2 border-dashed border-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50 mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-purple-600" />
            🤖 AI Scenario Builder
            <Badge variant="outline" className="ml-2 text-purple-600 border-purple-300">Beta</Badge>
          </CardTitle>
          <CardDescription>
            Simula scenari "cosa succede se..." e analizza l'impatto sulla produzione
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Slider simulazione */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  Variazione Mortalità (%)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Simula un aumento o diminuzione della mortalità rispetto al valore atteso</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <div className="flex items-center gap-4 mt-2">
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    value={mortalityAdjustment}
                    onChange={(e) => setMortalityAdjustment(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className={`font-bold min-w-[60px] text-right ${
                    mortalityAdjustment > 0 ? 'text-red-600' : mortalityAdjustment < 0 ? 'text-green-600' : ''
                  }`}>
                    {mortalityAdjustment > 0 ? '+' : ''}{mortalityAdjustment}%
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>-20% (migliore)</span>
                  <span>0% (attuale)</span>
                  <span>+20% (peggiore)</span>
                </div>
              </div>
              
              {mortalityAdjustment !== 0 && (() => {
                const totalBaseInventory = sizes.reduce((sum, s) => sum + getInventoryForSize(s), 0);
                const totalAdjustedInventory = sizes.reduce((sum, s) => sum + getAdjustedInventoryForSize(s), 0);
                const inventoryDelta = totalAdjustedInventory - totalBaseInventory;
                const totalOrders = sizes.reduce((sum, s) => sum + getOrdersForSize(s), 0);
                const baseCoverage = totalBaseInventory > 0 && totalOrders > 0 ? (totalBaseInventory / totalOrders) * 100 : 0;
                const adjustedCoverage = totalAdjustedInventory > 0 && totalOrders > 0 ? (totalAdjustedInventory / totalOrders) * 100 : 0;
                
                return (
                  <Alert className={mortalityAdjustment > 0 ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}>
                    <AlertTriangle className={`h-4 w-4 ${mortalityAdjustment > 0 ? 'text-red-600' : 'text-green-600'}`} />
                    <AlertTitle className={mortalityAdjustment > 0 ? 'text-red-800' : 'text-green-800'}>
                      {mortalityAdjustment > 0 ? 'Scenario Pessimistico' : 'Scenario Ottimistico'}
                    </AlertTitle>
                    <AlertDescription className={mortalityAdjustment > 0 ? 'text-red-700' : 'text-green-700'}>
                      <div className="space-y-1">
                        <div>
                          {mortalityAdjustment > 0 
                            ? `📉 Perdita stimata: ${formatNumber(Math.abs(inventoryDelta))} animali`
                            : `📈 Animali salvati: ${formatNumber(Math.abs(inventoryDelta))} animali`
                          }
                        </div>
                        <div>
                          🎯 Copertura ordini: {baseCoverage.toFixed(0)}% → {adjustedCoverage.toFixed(0)}%
                          <span className={`ml-1 font-bold ${adjustedCoverage > baseCoverage ? 'text-green-700' : 'text-red-700'}`}>
                            ({adjustedCoverage > baseCoverage ? '+' : ''}{(adjustedCoverage - baseCoverage).toFixed(1)}%)
                          </span>
                        </div>
                        <div className="text-xs opacity-80 mt-2">
                          💡 {mortalityAdjustment > 0 
                            ? 'Considera di aumentare le semine o accelerare la crescita'
                            : 'Potresti ridurre le semine o pianificare nuovi ordini'}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                );
              })()}
            </div>
            
            {/* Suggerimenti AI e Input */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">💡 Chiedi all'AI</Label>
              
              {/* Input domanda personalizzata */}
              <div className="flex gap-2">
                <Input
                  placeholder="Fai una domanda sulla produzione..."
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && aiQuestion.trim() && askAI(aiQuestion)}
                  disabled={aiLoading}
                  className="text-xs"
                />
                <Button 
                  size="sm" 
                  onClick={() => aiQuestion.trim() && askAI(aiQuestion)}
                  disabled={aiLoading || !aiQuestion.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              
              {/* Domande suggerite */}
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Domande suggerite:</span>
                <div className="flex flex-wrap gap-1">
                  {[
                    "Copro gli ordini di Giugno?",
                    "Quanto seminare per Maggio?",
                    "Mese più critico?",
                    "Impatto ritardo 2 sett?"
                  ].map((question, idx) => (
                    <Button 
                      key={idx}
                      variant="ghost" 
                      size="sm" 
                      className="h-auto py-1 px-2 text-xs text-purple-600 hover:bg-purple-50"
                      onClick={() => askAI(question)}
                      disabled={aiLoading}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Risultato AI */}
              {aiLoading && (
                <div className="flex items-center justify-center p-4 bg-purple-50 rounded-lg">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-600 mr-2" />
                  <span className="text-sm text-purple-700">Analisi in corso...</span>
                </div>
              )}
              
              {aiError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Errore</AlertTitle>
                  <AlertDescription>{aiError}</AlertDescription>
                </Alert>
              )}
              
              {aiResult && !aiLoading && (
                <div className="space-y-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                  {/* Risposta principale */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-medium text-purple-700">Risposta AI</span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(aiResult.confidence * 100)}% confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-800">{aiResult.answer}</p>
                  </div>
                  
                  {/* Dati chiave */}
                  {aiResult.dataPoints.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {aiResult.dataPoints.map((dp, idx) => (
                        <div key={idx} className={`px-2 py-1 rounded text-xs ${
                          dp.trend === 'positive' ? 'bg-green-100 text-green-700' :
                          dp.trend === 'negative' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          <span className="font-medium">{dp.label}:</span> {dp.value}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Raccomandazioni */}
                  {aiResult.recommendations.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-purple-700">Raccomandazioni:</span>
                      <ul className="mt-1 space-y-1">
                        {aiResult.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                            <span className="text-purple-500">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Pannello Rischi */}
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Criticità da Risolvere
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {monthlyData
                .filter(d => d.status === 'critical' || (d.varianceOrdersProduction < 0 && d.ordersAnimals > 0))
                .slice(0, 5)
                .map((d, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded text-sm">
                    <div>
                      <span className="font-medium">{d.monthName}</span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {d.sizeCategory === 'T3' ? 'TP-2000/3000/3500' : 'TP-4000/5000'}
                      </Badge>
                    </div>
                    <div className="text-red-600 font-bold">
                      Gap: {formatNumber(Math.abs(d.varianceOrdersProduction))}
                    </div>
                  </div>
                ))}
              {monthlyData.filter(d => d.status === 'critical').length === 0 && (
                <div className="text-center text-green-600 py-2">
                  ✅ Nessuna criticità rilevata
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              Prossime Semine Richieste
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {monthlyData
                .filter(d => d.seminaT1Richiesta > 0 && d.meseSeminaT1)
                .sort((a, b) => {
                  const monthOrder = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
                  const aIdx = monthOrder.findIndex(m => a.meseSeminaT1?.includes(m));
                  const bIdx = monthOrder.findIndex(m => b.meseSeminaT1?.includes(m));
                  return aIdx - bIdx;
                })
                .slice(0, 5)
                .map((d, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-orange-50 rounded text-sm">
                    <div>
                      <span className="font-medium text-orange-700">{d.meseSeminaT1}</span>
                      <span className="text-gray-500 ml-2">→ {d.monthName}</span>
                    </div>
                    <div className="text-orange-600 font-bold">
                      🌱 {formatNumber(d.seminaT1Richiesta)}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Riepilogo ordini per taglia */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-indigo-500" />
            Riepilogo Ordini per Taglia
            {mortalityAdjustment !== 0 && (
              <Badge variant={mortalityAdjustment > 0 ? 'destructive' : 'default'} className="ml-2">
                Scenario {mortalityAdjustment > 0 ? '+' : ''}{mortalityAdjustment}%
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {sizes.map(size => {
              const orders = getOrdersForSize(size);
              const inventory = getInventoryForSize(size);
              const adjustedInventory = getAdjustedInventoryForSize(size);
              const baseCoverage = inventory > 0 && orders > 0 ? Math.min(100, (inventory / orders) * 100) : 0;
              const adjustedCoverage = adjustedInventory > 0 && orders > 0 ? Math.min(100, (adjustedInventory / orders) * 100) : 0;
              const coverageDelta = adjustedCoverage - baseCoverage;
              
              return (
                <div key={size} className={`text-center p-3 rounded-lg transition-all ${
                  mortalityAdjustment !== 0 
                    ? (mortalityAdjustment > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200')
                    : 'bg-gray-50'
                }`}>
                  <Badge variant={size.includes('4000') || size.includes('5000') ? 'default' : 'secondary'} className="mb-2">
                    {size}
                  </Badge>
                  <div className="text-lg font-bold text-indigo-600">
                    {orders > 0 ? formatNumber(orders) : '-'}
                  </div>
                  <div className="text-xs text-gray-500">ordini</div>
                  {orders > 0 && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            adjustedCoverage >= 80 ? 'bg-green-500' : adjustedCoverage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${adjustedCoverage}%` }}
                        />
                      </div>
                      <div className={`text-xs mt-1 ${mortalityAdjustment !== 0 ? 'font-bold' : ''}`}>
                        {adjustedCoverage.toFixed(0)}% coperto
                        {mortalityAdjustment !== 0 && coverageDelta !== 0 && (
                          <span className={`ml-1 ${coverageDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ({coverageDelta > 0 ? '+' : ''}{coverageDelta.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
