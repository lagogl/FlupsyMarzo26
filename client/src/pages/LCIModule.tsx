import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Leaf, Package, Zap, FileText, Plus, Trash2, Edit, Download, BarChart3, Calendar, Eye, FileSpreadsheet, Clock, ChevronRight, Smartphone, Monitor } from "lucide-react";
import { Helmet } from "react-helmet";

interface LciMaterial {
  id: number;
  name: string;
  category: string;
  materialType: string | null;
  expectedLifeYears: string | null;
  disposalMethod: string | null;
  quantity: number;
  unit: string;
  unitWeightKg: string | null;
  flupsyReference: string | null;
  installationDate: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string | null;
}

interface LciConsumable {
  id: number;
  name: string;
  category: string;
  unit: string;
  ecoinventProcess: string | null;
  defaultAnnualAmount: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
}

interface LciConsumptionLog {
  id: number;
  consumableId: number;
  periodStart: string;
  periodEnd: string;
  amount: string;
  source: string;
  notes: string | null;
  createdAt: string;
}

interface LciStatus {
  enabled: boolean;
  settings: {
    id: number;
    key: string;
    value: any;
    description: string;
    updatedAt: string;
  }[];
}

interface LCIReportPreview {
  companyInfo: {
    name: string;
    location: string;
    coordinates: string;
    facilityType: string;
    facilitySizeM2: number;
  };
  referenceYear: number;
  materials: any[];
  consumables: any[];
  production: any[];
  summary: {
    totalMaterialsKg: number;
    totalAnnualizedMaterialsKg: number;
    totalProductionKg: number;
    totalInputPieces: number;
    totalOutputPieces: number;
    overallSurvivalRate: number;
  };
}

const MATERIAL_CATEGORIES = ['FLUPSY', 'Raceway', 'Filtri', 'Pompe', 'Illuminazione', 'Strutture', 'Elettrico', 'Altro'];
const CONSUMABLE_CATEGORIES = ['Energia', 'Carburante', 'Chimico', 'Acqua', 'Altro'];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isTouchDevice && isSmallScreen);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

function useViewPreference() {
  const [forceDesktop, setForceDesktopState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lci-view-preference') === 'desktop';
    }
    return false;
  });

  const setForceDesktop = (value: boolean) => {
    setForceDesktopState(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lci-view-preference', value ? 'desktop' : 'mobile');
    }
  };

  return { forceDesktop, setForceDesktop };
}

export default function LCIModule() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { forceDesktop, setForceDesktop } = useViewPreference();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [consumableDialogOpen, setConsumableDialogOpen] = useState(false);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<LciMaterial | null>(null);
  const [editingConsumable, setEditingConsumable] = useState<LciConsumable | null>(null);
  const [selectedConsumableForLog, setSelectedConsumableForLog] = useState<LciConsumable | null>(null);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [showPreview, setShowPreview] = useState(false);
  const [quickLogSheet, setQuickLogSheet] = useState(false);

  const { data: status, isLoading: statusLoading } = useQuery<LciStatus>({
    queryKey: ['/api/lci/status'],
  });

  const { data: materials = [], isLoading: materialsLoading } = useQuery<LciMaterial[]>({
    queryKey: ['/api/lci/materials'],
  });

  const { data: consumables = [], isLoading: consumablesLoading } = useQuery<LciConsumable[]>({
    queryKey: ['/api/lci/consumables'],
  });

  const { data: consumptionLogs = [] } = useQuery<LciConsumptionLog[]>({
    queryKey: ['/api/lci/consumption-logs'],
  });

  const { data: reportPreview, isLoading: previewLoading, refetch: refetchPreview } = useQuery<LCIReportPreview>({
    queryKey: ['/api/lci/export/preview', reportYear],
    queryFn: async () => {
      const res = await fetch(`/api/lci/export/preview/${reportYear}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Errore durante il caricamento dell\'anteprima');
      return res.json();
    },
    enabled: showPreview,
  });

  const createMaterialMutation = useMutation({
    mutationFn: async (data: Partial<LciMaterial>) => {
      return apiRequest('/api/lci/materials', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lci/materials'] });
      setMaterialDialogOpen(false);
      setEditingMaterial(null);
      toast({ title: "Materiale creato", description: "Il materiale è stato aggiunto con successo." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMaterialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<LciMaterial> }) => {
      return apiRequest(`/api/lci/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lci/materials'] });
      setMaterialDialogOpen(false);
      setEditingMaterial(null);
      toast({ title: "Materiale aggiornato", description: "Il materiale è stato aggiornato con successo." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/lci/materials/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lci/materials'] });
      toast({ title: "Materiale rimosso", description: "Il materiale è stato disattivato." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const createConsumableMutation = useMutation({
    mutationFn: async (data: Partial<LciConsumable>) => {
      return apiRequest('/api/lci/consumables', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lci/consumables'] });
      setConsumableDialogOpen(false);
      setEditingConsumable(null);
      toast({ title: "Consumabile creato", description: "Il consumabile è stato aggiunto con successo." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteConsumableMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/lci/consumables/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lci/consumables'] });
      toast({ title: "Consumabile rimosso", description: "Il consumabile è stato disattivato." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const createLogMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/lci/consumption-logs', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lci/consumption-logs'] });
      setLogDialogOpen(false);
      setQuickLogSheet(false);
      setSelectedConsumableForLog(null);
      toast({ title: "Log registrato", description: "Il consumo è stato registrato con successo." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleMaterialSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      materialType: formData.get('materialType') as string || null,
      quantity: parseInt(formData.get('quantity') as string) || 1,
      unit: formData.get('unit') as string || 'pc',
      unitWeightKg: formData.get('unitWeightKg') as string || null,
      expectedLifeYears: formData.get('expectedLifeYears') as string || null,
      notes: formData.get('notes') as string || null,
    };

    if (editingMaterial) {
      updateMaterialMutation.mutate({ id: editingMaterial.id, data });
    } else {
      createMaterialMutation.mutate(data);
    }
  };

  const handleConsumableSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      unit: formData.get('unit') as string,
      defaultAnnualAmount: formData.get('defaultAnnualAmount') as string || null,
      ecoinventProcess: formData.get('ecoinventProcess') as string || null,
      notes: formData.get('notes') as string || null,
    };

    createConsumableMutation.mutate(data);
  };

  const handleLogSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedConsumableForLog) return;
    
    const formData = new FormData(e.currentTarget);
    const data = {
      consumableId: selectedConsumableForLog.id,
      periodStart: formData.get('periodStart') as string,
      periodEnd: formData.get('periodEnd') as string,
      amount: formData.get('amount') as string,
      source: 'manual',
      notes: formData.get('notes') as string || null,
    };

    createLogMutation.mutate(data);
  };

  const handleExportExcel = async () => {
    try {
      toast({ title: "Generazione in corso...", description: "Preparazione del file Excel ECOTAPES" });
      
      const response = await fetch(`/api/lci/export/excel/${reportYear}`);
      if (!response.ok) throw new Error('Errore durante la generazione del report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LCI_ECOTAPES_${reportYear}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: "Report generato", description: "Il file Excel è stato scaricato con successo." });
    } catch (error: any) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  };

  const companyInfo = status?.settings.find(s => s.key === 'company_info')?.value;
  const activeMaterials = materials.filter(m => m.active);
  const activeConsumables = consumables.filter(c => c.active);

  const totalMaterialWeight = activeMaterials.reduce((sum, m) => {
    return sum + (m.quantity || 1) * (parseFloat(m.unitWeightKg || '0') || 0);
  }, 0);

  const materialsByCategory = MATERIAL_CATEGORIES.map(cat => ({
    category: cat,
    count: activeMaterials.filter(m => m.category === cat).length,
    weight: activeMaterials.filter(m => m.category === cat).reduce((sum, m) => 
      sum + (m.quantity || 1) * (parseFloat(m.unitWeightKg || '0') || 0), 0),
  })).filter(c => c.count > 0);

  const getConsumableName = (consumableId: number) => {
    const c = consumables.find(c => c.id === consumableId);
    return c?.name || 'Sconosciuto';
  };

  const showMobileUI = isMobile && !forceDesktop;

  if (statusLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  if (showMobileUI) {
    return (
      <>
        <Helmet>
          <title>LCI Mobile - ECOTAPES | Delta Futuro</title>
          <meta name="description" content="Life Cycle Inventory mobile interface for field data collection" />
        </Helmet>

        <div className="flex flex-col h-[100dvh] bg-background">
          <header className="sticky top-0 z-50 bg-background border-b px-4 py-3 safe-area-top">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Leaf className="h-6 w-6 text-green-600" />
                <span className="font-semibold text-lg">LCI Mobile</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setForceDesktop(true)}
                className="text-xs"
                data-testid="button-switch-desktop"
              >
                <Monitor className="h-4 w-4 mr-1" />
                Desktop
              </Button>
            </div>
          </header>

          <ScrollArea className="flex-1">
            <div className="p-4 pb-24 space-y-4">
              {activeTab === "dashboard" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="touch-manipulation" data-testid="mobile-card-materials">
                      <CardContent className="p-4 text-center">
                        <Package className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                        <div className="text-2xl font-bold">{activeMaterials.length}</div>
                        <div className="text-xs text-muted-foreground">Materiali</div>
                      </CardContent>
                    </Card>

                    <Card className="touch-manipulation" data-testid="mobile-card-weight">
                      <CardContent className="p-4 text-center">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <div className="text-2xl font-bold">{totalMaterialWeight.toFixed(0)}</div>
                        <div className="text-xs text-muted-foreground">kg Totali</div>
                      </CardContent>
                    </Card>

                    <Card className="touch-manipulation" data-testid="mobile-card-consumables">
                      <CardContent className="p-4 text-center">
                        <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                        <div className="text-2xl font-bold">{activeConsumables.length}</div>
                        <div className="text-xs text-muted-foreground">Consumabili</div>
                      </CardContent>
                    </Card>

                    <Card className="touch-manipulation" data-testid="mobile-card-logs">
                      <CardContent className="p-4 text-center">
                        <Clock className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                        <div className="text-2xl font-bold">{consumptionLogs.length}</div>
                        <div className="text-xs text-muted-foreground">Log</div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Azione Rapida</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        className="w-full h-14 text-lg" 
                        onClick={() => setQuickLogSheet(true)}
                        data-testid="button-quick-log"
                      >
                        <Plus className="h-6 w-6 mr-3" />
                        Registra Consumo
                      </Button>
                      <div className="grid grid-cols-2 gap-3">
                        <Button 
                          variant="outline" 
                          className="h-12"
                          onClick={() => { setEditingMaterial(null); setMaterialDialogOpen(true); }}
                          data-testid="button-mobile-add-material"
                        >
                          <Package className="h-5 w-5 mr-2" />
                          Materiale
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-12"
                          onClick={() => { setEditingConsumable(null); setConsumableDialogOpen(true); }}
                          data-testid="button-mobile-add-consumable"
                        >
                          <Zap className="h-5 w-5 mr-2" />
                          Consumabile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {materialsByCategory.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Materiali per Categoria</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {materialsByCategory.map(cat => (
                          <div key={cat.category} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{cat.category}</Badge>
                              <span className="text-sm text-muted-foreground">{cat.count}</span>
                            </div>
                            <span className="font-medium text-sm">{cat.weight.toFixed(1)} kg</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {activeTab === "materials" && (
                <>
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Materiali</h2>
                    <Button 
                      size="sm"
                      onClick={() => { setEditingMaterial(null); setMaterialDialogOpen(true); }}
                      data-testid="button-mobile-materials-add"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Aggiungi
                    </Button>
                  </div>

                  {materialsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
                    </div>
                  ) : activeMaterials.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                        <p className="text-muted-foreground">Nessun materiale</p>
                        <Button 
                          className="mt-4"
                          onClick={() => { setEditingMaterial(null); setMaterialDialogOpen(true); }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Aggiungi il primo
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {activeMaterials.map(material => (
                        <Card 
                          key={material.id} 
                          className="touch-manipulation active:scale-[0.98] transition-transform"
                          data-testid={`mobile-material-${material.id}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-base">{material.name}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">{material.category}</Badge>
                                  {material.materialType && (
                                    <span className="text-xs text-muted-foreground">{material.materialType}</span>
                                  )}
                                </div>
                                <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                                  <div>
                                    <div className="text-muted-foreground text-xs">Quantità</div>
                                    <div className="font-medium">{material.quantity} {material.unit}</div>
                                  </div>
                                  <div>
                                    <div className="text-muted-foreground text-xs">Peso Tot.</div>
                                    <div className="font-medium">
                                      {((material.quantity || 1) * (parseFloat(material.unitWeightKg || '0') || 0)).toFixed(1)} kg
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-muted-foreground text-xs">Vita Utile</div>
                                    <div className="font-medium">{material.expectedLifeYears ? `${material.expectedLifeYears}a` : '-'}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10"
                                  onClick={() => { setEditingMaterial(material); setMaterialDialogOpen(true); }}
                                >
                                  <Edit className="h-5 w-5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10"
                                  onClick={() => deleteMaterialMutation.mutate(material.id)}
                                >
                                  <Trash2 className="h-5 w-5 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === "consumables" && (
                <>
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Consumabili</h2>
                    <Button 
                      size="sm"
                      onClick={() => { setEditingConsumable(null); setConsumableDialogOpen(true); }}
                      data-testid="button-mobile-consumables-add"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Aggiungi
                    </Button>
                  </div>

                  {consumablesLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
                    </div>
                  ) : activeConsumables.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Zap className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                        <p className="text-muted-foreground">Nessun consumabile</p>
                        <Button 
                          className="mt-4"
                          onClick={() => { setEditingConsumable(null); setConsumableDialogOpen(true); }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Aggiungi il primo
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {activeConsumables.map(consumable => (
                        <Card 
                          key={consumable.id} 
                          className="touch-manipulation active:scale-[0.98] transition-transform"
                          data-testid={`mobile-consumable-${consumable.id}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1" onClick={() => { setSelectedConsumableForLog(consumable); setQuickLogSheet(true); }}>
                                <div className="font-medium text-base">{consumable.name}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">{consumable.category}</Badge>
                                  <span className="text-xs text-muted-foreground">{consumable.unit}</span>
                                </div>
                                {consumable.defaultAnnualAmount && (
                                  <div className="mt-2 text-sm text-muted-foreground">
                                    Default: {consumable.defaultAnnualAmount} {consumable.unit}/anno
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="default"
                                  size="icon"
                                  className="h-12 w-12 bg-green-600 hover:bg-green-700"
                                  onClick={() => { setSelectedConsumableForLog(consumable); setQuickLogSheet(true); }}
                                  data-testid={`button-mobile-log-${consumable.id}`}
                                >
                                  <Plus className="h-6 w-6" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-12 w-12"
                                  onClick={() => deleteConsumableMutation.mutate(consumable.id)}
                                >
                                  <Trash2 className="h-5 w-5 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === "reports" && (
                <>
                  <h2 className="text-lg font-semibold">Report Excel</h2>
                  
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      <div className="space-y-2">
                        <Label>Anno di Riferimento</Label>
                        <Select value={reportYear.toString()} onValueChange={(v) => setReportYear(parseInt(v))}>
                          <SelectTrigger className="h-12" data-testid="mobile-select-year">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[2023, 2024, 2025, 2026].map(year => (
                              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button 
                        className="w-full h-14 text-lg"
                        onClick={handleExportExcel}
                        data-testid="button-mobile-export"
                      >
                        <Download className="h-6 w-6 mr-3" />
                        Scarica Excel ECOTAPES
                      </Button>

                      <Button 
                        variant="outline"
                        className="w-full h-12"
                        onClick={() => { setShowPreview(true); refetchPreview(); }}
                        data-testid="button-mobile-preview"
                      >
                        <Eye className="h-5 w-5 mr-2" />
                        Anteprima
                      </Button>

                      {showPreview && reportPreview && (
                        <div className="border rounded-lg p-4 space-y-3 text-sm bg-muted/30">
                          <div className="font-medium">Riepilogo {reportYear}</div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-muted-foreground text-xs">Materiali</div>
                              <div>{reportPreview.materials.length} elementi</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground text-xs">Peso Tot.</div>
                              <div>{reportPreview.summary.totalMaterialsKg.toFixed(1)} kg</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground text-xs">Consumabili</div>
                              <div>{reportPreview.consumables.length} tipi</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground text-xs">Produzione</div>
                              <div>{reportPreview.summary.totalProductionKg.toFixed(1)} kg</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="text-sm font-medium mb-2">Il report include:</div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Riepilogo azienda e totali</li>
                        <li>• Inventario materiali</li>
                        <li>• Consumi annuali</li>
                        <li>• Dati produzione</li>
                      </ul>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </ScrollArea>

          <nav className="fixed bottom-0 left-0 right-0 bg-background border-t safe-area-bottom z-50">
            <div className="grid grid-cols-4 h-16">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex flex-col items-center justify-center gap-1 ${activeTab === "dashboard" ? "text-primary" : "text-muted-foreground"}`}
                data-testid="mobile-nav-dashboard"
              >
                <BarChart3 className="h-5 w-5" />
                <span className="text-xs">Home</span>
              </button>
              <button
                onClick={() => setActiveTab("materials")}
                className={`flex flex-col items-center justify-center gap-1 ${activeTab === "materials" ? "text-primary" : "text-muted-foreground"}`}
                data-testid="mobile-nav-materials"
              >
                <Package className="h-5 w-5" />
                <span className="text-xs">Materiali</span>
              </button>
              <button
                onClick={() => setActiveTab("consumables")}
                className={`flex flex-col items-center justify-center gap-1 ${activeTab === "consumables" ? "text-primary" : "text-muted-foreground"}`}
                data-testid="mobile-nav-consumables"
              >
                <Zap className="h-5 w-5" />
                <span className="text-xs">Consumabili</span>
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className={`flex flex-col items-center justify-center gap-1 ${activeTab === "reports" ? "text-primary" : "text-muted-foreground"}`}
                data-testid="mobile-nav-reports"
              >
                <FileText className="h-5 w-5" />
                <span className="text-xs">Report</span>
              </button>
            </div>
          </nav>

          <Sheet 
            open={quickLogSheet} 
            onOpenChange={(open) => {
              if (!open) {
                setSelectedConsumableForLog(null);
              }
              setQuickLogSheet(open);
            }}
          >
            <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-2xl">
              <SheetHeader className="text-left">
                <SheetTitle className="text-xl">Registra Consumo</SheetTitle>
                <SheetDescription>
                  {selectedConsumableForLog ? selectedConsumableForLog.name : 'Seleziona un consumabile'}
                </SheetDescription>
              </SheetHeader>
              
              {!selectedConsumableForLog ? (
                <div className="py-4 space-y-3">
                  {activeConsumables.length === 0 ? (
                    <div className="text-center py-8">
                      <Zap className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-muted-foreground mb-4">Nessun consumabile disponibile</p>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setQuickLogSheet(false);
                          setConsumableDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Crea Consumabile
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-2">Seleziona il consumabile da registrare:</p>
                      {activeConsumables.map(c => (
                        <Button
                          key={c.id}
                          variant="outline"
                          className="w-full h-16 justify-between text-left touch-manipulation"
                          onClick={() => setSelectedConsumableForLog(c)}
                          data-testid={`sheet-select-consumable-${c.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Zap className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{c.name}</div>
                              <div className="text-xs text-muted-foreground">{c.category} - {c.unit}</div>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </Button>
                      ))}
                    </>
                  )}
                  <Button 
                    variant="ghost" 
                    className="w-full h-12 mt-2"
                    onClick={() => setQuickLogSheet(false)}
                  >
                    Chiudi
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleLogSubmit} className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base">Quantità ({selectedConsumableForLog.unit})</Label>
                    <Input 
                      name="amount" 
                      type="number" 
                      step="0.001" 
                      inputMode="decimal"
                      required 
                      className="h-14 text-lg"
                      placeholder="es. 1500"
                      data-testid="sheet-input-amount"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Data Inizio</Label>
                      <Input 
                        name="periodStart" 
                        type="date" 
                        required 
                        className="h-12"
                        defaultValue={new Date().toISOString().split('T')[0]}
                        data-testid="sheet-input-start"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data Fine</Label>
                      <Input 
                        name="periodEnd" 
                        type="date" 
                        required 
                        className="h-12"
                        defaultValue={new Date().toISOString().split('T')[0]}
                        data-testid="sheet-input-end"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Note (opzionale)</Label>
                    <Input 
                      name="notes" 
                      className="h-12"
                      placeholder="es. Lettura contatore"
                      data-testid="sheet-input-notes"
                    />
                  </div>

                  <SheetFooter className="gap-2 sm:gap-0">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-12"
                      onClick={() => setSelectedConsumableForLog(null)}
                    >
                      Indietro
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 h-12 text-lg"
                      disabled={createLogMutation.isPending}
                      data-testid="sheet-button-save"
                    >
                      {createLogMutation.isPending ? 'Salvataggio...' : 'Registra'}
                    </Button>
                  </SheetFooter>
                </form>
              )}
            </SheetContent>
          </Sheet>

          <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingMaterial ? 'Modifica Materiale' : 'Nuovo Materiale'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleMaterialSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input id="name" name="name" defaultValue={editingMaterial?.name} required className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <Select name="category" defaultValue={editingMaterial?.category || MATERIAL_CATEGORIES[0]}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIAL_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantità</Label>
                    <Input id="quantity" name="quantity" type="number" defaultValue={editingMaterial?.quantity || 1} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unità</Label>
                    <Input id="unit" name="unit" defaultValue={editingMaterial?.unit || 'pc'} className="h-12" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unitWeightKg">Peso (kg)</Label>
                    <Input id="unitWeightKg" name="unitWeightKg" type="number" step="0.001" defaultValue={editingMaterial?.unitWeightKg || ''} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expectedLifeYears">Vita (anni)</Label>
                    <Input id="expectedLifeYears" name="expectedLifeYears" type="number" step="0.5" defaultValue={editingMaterial?.expectedLifeYears || ''} className="h-12" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="materialType">Tipo Materiale</Label>
                  <Input id="materialType" name="materialType" placeholder="es. PVC, HDPE, Acciaio..." defaultValue={editingMaterial?.materialType || ''} className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Note</Label>
                  <Input id="notes" name="notes" defaultValue={editingMaterial?.notes || ''} className="h-12" />
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full h-12" disabled={createMaterialMutation.isPending || updateMaterialMutation.isPending}>
                    {(createMaterialMutation.isPending || updateMaterialMutation.isPending) ? 'Salvataggio...' : 'Salva'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={consumableDialogOpen} onOpenChange={setConsumableDialogOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nuovo Consumabile</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleConsumableSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cons-name">Nome *</Label>
                  <Input id="cons-name" name="name" required className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <Select name="category" defaultValue={CONSUMABLE_CATEGORIES[0]}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONSUMABLE_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cons-unit">Unità di Misura *</Label>
                  <Input id="cons-unit" name="unit" placeholder="es. kWh, L, kg, m³" required className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cons-amount">Consumo Annuale Default</Label>
                  <Input id="cons-amount" name="defaultAnnualAmount" type="number" step="0.001" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cons-notes">Note</Label>
                  <Input id="cons-notes" name="notes" className="h-12" />
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full h-12" disabled={createConsumableMutation.isPending}>
                    {createConsumableMutation.isPending ? 'Salvataggio...' : 'Salva'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>LCI Module - ECOTAPES | Delta Futuro</title>
        <meta name="description" content="Life Cycle Inventory module for ECOTAPES project - track materials, consumables and environmental impact" />
      </Helmet>

      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2" data-testid="text-lci-title">
              <Leaf className="h-8 w-8 text-green-600" />
              LCI Module - ECOTAPES
            </h1>
            <p className="text-muted-foreground mt-1">
              Life Cycle Inventory per {companyInfo?.name || 'Delta Futuro'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {forceDesktop && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setForceDesktop(false)}
                data-testid="button-switch-mobile"
              >
                <Smartphone className="h-4 w-4 mr-1" />
                Vista Mobile
              </Button>
            )}
            <Badge variant={status?.enabled ? "default" : "secondary"} className="w-fit">
              {status?.enabled ? "Modulo Attivo" : "Modulo Disabilitato"}
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard" className="flex items-center gap-2" data-testid="tab-dashboard">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-2" data-testid="tab-materials">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Materiali</span>
            </TabsTrigger>
            <TabsTrigger value="consumables" className="flex items-center gap-2" data-testid="tab-consumables">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Consumabili</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2" data-testid="tab-logs">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Log Consumo</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2" data-testid="tab-reports">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Report</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Materiali Attivi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-materials-count">{activeMaterials.length}</div>
                  <p className="text-xs text-muted-foreground">in {materialsByCategory.length} categorie</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Peso Totale</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-weight">{totalMaterialWeight.toFixed(1)} kg</div>
                  <p className="text-xs text-muted-foreground">materiali inventariati</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Consumabili Attivi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-consumables-count">{activeConsumables.length}</div>
                  <p className="text-xs text-muted-foreground">tipologie monitorate</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Log Consumo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-logs-count">{consumptionLogs.length}</div>
                  <p className="text-xs text-muted-foreground">registrazioni effettuate</p>
                </CardContent>
              </Card>
            </div>

            {materialsByCategory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Materiali per Categoria</CardTitle>
                  <CardDescription>Distribuzione del peso per categoria di materiale</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {materialsByCategory.map(cat => (
                      <div key={cat.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{cat.category}</Badge>
                          <span className="text-sm text-muted-foreground">{cat.count} elementi</span>
                        </div>
                        <span className="font-medium">{cat.weight.toFixed(1)} kg</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="materials" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Inventario Materiali</h2>
              <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingMaterial(null)} data-testid="button-add-material">
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi Materiale
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingMaterial ? 'Modifica Materiale' : 'Nuovo Materiale'}</DialogTitle>
                    <DialogDescription>Inserisci i dati del materiale o attrezzatura</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleMaterialSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome *</Label>
                      <Input id="name" name="name" defaultValue={editingMaterial?.name} required data-testid="input-material-name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria *</Label>
                      <Select name="category" defaultValue={editingMaterial?.category || MATERIAL_CATEGORIES[0]}>
                        <SelectTrigger data-testid="select-material-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MATERIAL_CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantità</Label>
                        <Input id="quantity" name="quantity" type="number" defaultValue={editingMaterial?.quantity || 1} data-testid="input-material-quantity" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unit">Unità</Label>
                        <Input id="unit" name="unit" defaultValue={editingMaterial?.unit || 'pc'} data-testid="input-material-unit" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="unitWeightKg">Peso Unit. (kg)</Label>
                        <Input id="unitWeightKg" name="unitWeightKg" type="number" step="0.001" defaultValue={editingMaterial?.unitWeightKg || ''} data-testid="input-material-weight" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expectedLifeYears">Vita Utile (anni)</Label>
                        <Input id="expectedLifeYears" name="expectedLifeYears" type="number" step="0.5" defaultValue={editingMaterial?.expectedLifeYears || ''} data-testid="input-material-life" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="materialType">Tipo Materiale</Label>
                      <Input id="materialType" name="materialType" placeholder="es. PVC, HDPE, Acciaio..." defaultValue={editingMaterial?.materialType || ''} data-testid="input-material-type" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Note</Label>
                      <Input id="notes" name="notes" defaultValue={editingMaterial?.notes || ''} data-testid="input-material-notes" />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={createMaterialMutation.isPending || updateMaterialMutation.isPending} data-testid="button-save-material">
                        {(createMaterialMutation.isPending || updateMaterialMutation.isPending) ? 'Salvataggio...' : 'Salva'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {materialsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : activeMaterials.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessun materiale registrato</p>
                  <p className="text-sm">Aggiungi materiali e attrezzature per iniziare il tracking LCI</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Quantità</TableHead>
                      <TableHead className="text-right">Peso Tot.</TableHead>
                      <TableHead className="text-right">Vita Utile</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeMaterials.map(material => (
                      <TableRow key={material.id} data-testid={`row-material-${material.id}`}>
                        <TableCell className="font-medium">{material.name}</TableCell>
                        <TableCell><Badge variant="outline">{material.category}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{material.materialType || '-'}</TableCell>
                        <TableCell className="text-right">{material.quantity} {material.unit}</TableCell>
                        <TableCell className="text-right">
                          {((material.quantity || 1) * (parseFloat(material.unitWeightKg || '0') || 0)).toFixed(1)} kg
                        </TableCell>
                        <TableCell className="text-right">{material.expectedLifeYears ? `${material.expectedLifeYears} anni` : '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setEditingMaterial(material); setMaterialDialogOpen(true); }}
                              data-testid={`button-edit-material-${material.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMaterialMutation.mutate(material.id)}
                              data-testid={`button-delete-material-${material.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="consumables" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Consumabili</h2>
              <Dialog open={consumableDialogOpen} onOpenChange={setConsumableDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingConsumable(null)} data-testid="button-add-consumable">
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi Consumabile
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Nuovo Consumabile</DialogTitle>
                    <DialogDescription>Definisci un nuovo tipo di consumabile da tracciare</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleConsumableSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cons-name">Nome *</Label>
                      <Input id="cons-name" name="name" required data-testid="input-consumable-name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cons-category">Categoria *</Label>
                      <Select name="category" defaultValue={CONSUMABLE_CATEGORIES[0]}>
                        <SelectTrigger data-testid="select-consumable-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONSUMABLE_CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cons-unit">Unità di Misura *</Label>
                      <Input id="cons-unit" name="unit" placeholder="es. kWh, L, kg, m³" required data-testid="input-consumable-unit" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cons-amount">Consumo Annuale Default</Label>
                      <Input id="cons-amount" name="defaultAnnualAmount" type="number" step="0.001" data-testid="input-consumable-amount" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cons-ecoinvent">Processo Ecoinvent</Label>
                      <Input id="cons-ecoinvent" name="ecoinventProcess" placeholder="Riferimento Ecoinvent" data-testid="input-consumable-ecoinvent" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cons-notes">Note</Label>
                      <Input id="cons-notes" name="notes" data-testid="input-consumable-notes" />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={createConsumableMutation.isPending} data-testid="button-save-consumable">
                        {createConsumableMutation.isPending ? 'Salvataggio...' : 'Salva'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {consumablesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : activeConsumables.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessun consumabile definito</p>
                  <p className="text-sm">Aggiungi energia, carburante, prodotti chimici e altri consumabili</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Unità</TableHead>
                      <TableHead className="text-right">Consumo Annuale</TableHead>
                      <TableHead>Processo Ecoinvent</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeConsumables.map(consumable => (
                      <TableRow key={consumable.id} data-testid={`row-consumable-${consumable.id}`}>
                        <TableCell className="font-medium">{consumable.name}</TableCell>
                        <TableCell><Badge variant="outline">{consumable.category}</Badge></TableCell>
                        <TableCell>{consumable.unit}</TableCell>
                        <TableCell className="text-right">
                          {consumable.defaultAnnualAmount ? `${consumable.defaultAnnualAmount} ${consumable.unit}/anno` : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm truncate max-w-[200px]">
                          {consumable.ecoinventProcess || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setSelectedConsumableForLog(consumable); setLogDialogOpen(true); }}
                              data-testid={`button-log-consumable-${consumable.id}`}
                            >
                              <Plus className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteConsumableMutation.mutate(consumable.id)}
                              data-testid={`button-delete-consumable-${consumable.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}

            <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Registra Consumo</DialogTitle>
                  <DialogDescription>
                    {selectedConsumableForLog ? `Registra il consumo per: ${selectedConsumableForLog.name}` : ''}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleLogSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="log-start">Data Inizio *</Label>
                      <Input id="log-start" name="periodStart" type="date" required data-testid="input-log-start" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="log-end">Data Fine *</Label>
                      <Input id="log-end" name="periodEnd" type="date" required data-testid="input-log-end" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="log-amount">Quantità Consumata ({selectedConsumableForLog?.unit}) *</Label>
                    <Input id="log-amount" name="amount" type="number" step="0.001" required data-testid="input-log-amount" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="log-notes">Note</Label>
                    <Input id="log-notes" name="notes" data-testid="input-log-notes" />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createLogMutation.isPending} data-testid="button-save-log">
                      {createLogMutation.isPending ? 'Salvataggio...' : 'Registra'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Log Consumo</h2>
            </div>

            {consumptionLogs.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessun log di consumo registrato</p>
                  <p className="text-sm">Registra i consumi dalla tab Consumabili usando il pulsante +</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Consumabile</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead className="text-right">Quantità</TableHead>
                      <TableHead>Fonte</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Registrato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consumptionLogs.map(log => (
                      <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                        <TableCell className="font-medium">{getConsumableName(log.consumableId)}</TableCell>
                        <TableCell>
                          {new Date(log.periodStart).toLocaleDateString('it-IT')} - {new Date(log.periodEnd).toLocaleDateString('it-IT')}
                        </TableCell>
                        <TableCell className="text-right font-mono">{log.amount}</TableCell>
                        <TableCell><Badge variant="secondary">{log.source}</Badge></TableCell>
                        <TableCell className="text-muted-foreground text-sm">{log.notes || '-'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(log.createdAt).toLocaleDateString('it-IT')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Export Report LCI
                </CardTitle>
                <CardDescription>Genera report Excel compatibile con ECOTAPES</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="space-y-2">
                    <Label htmlFor="report-year">Anno di Riferimento</Label>
                    <Select value={reportYear.toString()} onValueChange={(v) => setReportYear(parseInt(v))}>
                      <SelectTrigger className="w-32" data-testid="select-report-year">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2023, 2024, 2025, 2026].map(year => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => { setShowPreview(true); refetchPreview(); }}
                      data-testid="button-preview-report"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Anteprima
                    </Button>
                    <Button onClick={handleExportExcel} data-testid="button-export-excel">
                      <Download className="h-4 w-4 mr-2" />
                      Scarica Excel
                    </Button>
                  </div>
                </div>

                {showPreview && (
                  <div className="border rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Anteprima Report {reportYear}
                    </h3>
                    
                    {previewLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-64" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    ) : reportPreview ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium mb-2">Riepilogo Materiali</h4>
                          <p>Elementi: {reportPreview.materials.length}</p>
                          <p>Peso Totale: {reportPreview.summary.totalMaterialsKg.toFixed(1)} kg</p>
                          <p>Peso Annualizzato: {reportPreview.summary.totalAnnualizedMaterialsKg.toFixed(1)} kg/anno</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Riepilogo Consumabili</h4>
                          <p>Tipologie: {reportPreview.consumables.length}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Riepilogo Produzione</h4>
                          <p>Taglie: {reportPreview.production.length}</p>
                          <p>Produzione: {reportPreview.summary.totalProductionKg.toFixed(1)} kg</p>
                          <p>Animali Output: {reportPreview.summary.totalOutputPieces.toLocaleString()}</p>
                          <p>Sopravvivenza: {reportPreview.summary.overallSurvivalRate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Azienda</h4>
                          <p>{reportPreview.companyInfo.name}</p>
                          <p>{reportPreview.companyInfo.location}</p>
                          <p>{reportPreview.companyInfo.facilityType}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Nessun dato disponibile per questo anno</p>
                    )}
                  </div>
                )}

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Il report Excel includerà:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Foglio Riepilogo con informazioni aziendali e totali</li>
                    <li>• Foglio Materiali con inventario completo e pesi annualizzati</li>
                    <li>• Foglio Consumabili con consumi annuali per categoria</li>
                    <li>• Foglio Produzione con dati input/output per taglia</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
