import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, Target, Calendar, Package } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell } from "recharts";

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
}

interface InventoryBySize {
  sizeCategory: string;
  sizeName: string;
  totalAnimals: number;
  animalsPerKgRange: string;
}

interface ForecastData {
  success: boolean;
  year: number;
  totalBudget: number;
  totalOrders: number;
  totalProductionForecast: number;
  overallVariance: number;
  monthlyData: MonthlyForecast[];
  currentInventory: InventoryBySize[];
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

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'on_track':
      return <Badge className="bg-green-100 text-green-800">In linea</Badge>;
    case 'warning':
      return <Badge className="bg-yellow-100 text-yellow-800">Attenzione</Badge>;
    case 'critical':
      return <Badge className="bg-red-100 text-red-800">Critico</Badge>;
    default:
      return <Badge>-</Badge>;
  }
};

const getVarianceColor = (variance: number) => {
  if (variance >= 0) return 'text-green-600';
  if (variance >= -0.1) return 'text-yellow-600';
  return 'text-red-600';
};

export default function AnalisiScostamenti() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data, isLoading, error } = useQuery<ForecastData>({
    queryKey: ['/api/ai/production-forecast', selectedYear],
    queryFn: async () => {
      const response = await fetch(`/api/ai/production-forecast?year=${selectedYear}`);
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

  const filteredData = selectedCategory === 'all' 
    ? data.monthlyData 
    : data.monthlyData.filter(d => d.sizeCategory === selectedCategory);

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
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte</SelectItem>
              <SelectItem value="T3">Solo T3</SelectItem>
              <SelectItem value="T10">Solo T10</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Totale</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.totalBudget)}</div>
            <p className="text-xs text-muted-foreground">
              T3: {formatNumber(totalT3Budget)} | T10: {formatNumber(totalT10Budget)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ordini</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.totalOrders)}</div>
            <p className="text-xs text-muted-foreground">
              Da integrare nella prossima fase
            </p>
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
                  <TableHead>Categoria</TableHead>
                  <TableHead>Taglia</TableHead>
                  <TableHead className="text-right">Animali</TableHead>
                  <TableHead className="text-right">an/kg</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.currentInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nessun dato inventario disponibile
                    </TableCell>
                  </TableRow>
                ) : (
                  data.currentInventory.map((inv, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Badge variant={inv.sizeCategory === 'T10' ? 'default' : 'secondary'}>
                          {inv.sizeCategory}
                        </Badge>
                      </TableCell>
                      <TableCell>{inv.sizeName}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatFullNumber(inv.totalAnimals)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {inv.animalsPerKgRange}
                      </TableCell>
                    </TableRow>
                  ))
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
                      <div className="font-medium">{d.monthName} - {d.sizeCategory}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Seminare entro: {d.seedingDeadline ? new Date(d.seedingDeadline).toLocaleDateString('it-IT') : 'N/A'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-orange-600">
                        +{formatNumber(d.seedingRequirement)}
                      </div>
                      <div className="text-xs text-muted-foreground">animali</div>
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
        </TabsList>

        <TabsContent value="chart" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Budget vs Produzione - T3</CardTitle>
                <CardDescription>Milioni di animali per mese</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataT3}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${value.toFixed(2)}M`} />
                    <Legend />
                    <Bar dataKey="budget" name="Budget" fill="#94a3b8" />
                    <Bar dataKey="produzione" name="Produzione" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget vs Produzione - T10</CardTitle>
                <CardDescription>Milioni di animali per mese</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataT10}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${value.toFixed(2)}M`} />
                    <Legend />
                    <Bar dataKey="budget" name="Budget" fill="#94a3b8" />
                    <Bar dataKey="produzione" name="Produzione" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Dettaglio Mensile</CardTitle>
              <CardDescription>
                Tutti gli scostamenti budget/ordini/produzione per mese e taglia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mese</TableHead>
                      <TableHead>Taglia</TableHead>
                      <TableHead className="text-right">Budget</TableHead>
                      <TableHead className="text-right">Ordini</TableHead>
                      <TableHead className="text-right">Produzione</TableHead>
                      <TableHead className="text-right">Δ Budget</TableHead>
                      <TableHead>Stato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{row.monthName}</TableCell>
                        <TableCell>
                          <Badge variant={row.sizeCategory === 'T10' ? 'default' : 'secondary'}>
                            {row.sizeCategory}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(row.budgetAnimals)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatNumber(row.ordersAnimals)}
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(row.productionForecast)}</TableCell>
                        <TableCell className={`text-right ${getVarianceColor(row.varianceBudgetProduction)}`}>
                          {row.varianceBudgetProduction >= 0 ? '+' : ''}
                          {formatNumber(row.varianceBudgetProduction)}
                        </TableCell>
                        <TableCell>{getStatusBadge(row.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
