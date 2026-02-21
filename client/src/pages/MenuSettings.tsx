import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import PageHeader from "@/components/PageHeader";
import { 
  Save, Settings, Star, Lock, Eye, EyeOff,
  Home, Package, FileText, RefreshCw, Package2, BarChart2, 
  Scale, TrendingUp, Waves, Boxes, GitCompare, Tag, LineChart,
  LayoutDashboard, PieChart, BarChart, BarChart3, Filter, Database, 
  Leaf, LayoutGrid, CloudIcon, Table, Brain, CalendarDays, Globe, 
  History, FileSpreadsheet, Split, ClipboardList, Users, FolderOpen, 
  Sparkles, Radio, AlertCircle, ShieldCheck, Skull, Bell
} from "lucide-react";

const allMenuItems = [
  { path: "/", label: "Dashboard", category: "Operativo", icon: <Home className="h-4 w-4" /> },
  { path: "/mappa-gis", label: "Mappa GIS Laguna", category: "Operativo", icon: <Globe className="h-4 w-4" /> },
  { path: "/lots", label: "Gestione Lotti", category: "Operativo", icon: <Package2 className="h-4 w-4" /> },
  { path: "/baskets", label: "Gestione Ceste", category: "Operativo", icon: <Package className="h-4 w-4" /> },
  { path: "/basket-groups", label: "Gruppi Ceste", category: "Operativo", icon: <FolderOpen className="h-4 w-4" /> },
  { path: "/operations", label: "Operazioni", category: "Operativo", icon: <FileText className="h-4 w-4" /> },
  { path: "/spreadsheet-operations", label: "Operazioni Rapide", category: "Operativo", icon: <Table className="h-4 w-4" /> },
  { path: "/vagliatura-con-mappa", label: "Vagliatura", category: "Operativo", icon: <LayoutGrid className="h-4 w-4" /> },
  { path: "/screenings", label: "Storico Vagliature", category: "Operativo", icon: <History className="h-4 w-4" /> },
  { path: "/nfc-tags", label: "Tag NFC", category: "Operativo", icon: <Tag className="h-4 w-4" /> },
  { path: "/rfid-uhf-tags", label: "Tag RFID UHF", category: "Operativo", icon: <Radio className="h-4 w-4" /> },
  { path: "/flupsys", label: "Unità FLUPSY", category: "Monitoraggio", icon: <Waves className="h-4 w-4" /> },
  { path: "/flupsy-comparison", label: "Confronto FLUPSY", category: "Monitoraggio", icon: <GitCompare className="h-4 w-4" /> },
  { path: "/grow-journey", label: "Percorso Crescita", category: "Monitoraggio", icon: <LineChart className="h-4 w-4" /> },
  { path: "/basket-selection", label: "Selezione Avanzata", category: "Monitoraggio", icon: <BarChart2 className="h-4 w-4" /> },
  { path: "/task-management", label: "Gestione Attività", category: "Monitoraggio", icon: <ClipboardList className="h-4 w-4" /> },
  { path: "/operators", label: "Operatori", category: "Monitoraggio", icon: <Users className="h-4 w-4" /> },
  { path: "/cycles", label: "Cicli Produttivi", category: "Giacenze", icon: <RefreshCw className="h-4 w-4" /> },
  { path: "/pending-closures", label: "Chiusure Pendenti", category: "Giacenze", icon: <AlertCircle className="h-4 w-4" /> },
  { path: "/sizes", label: "Tabella Taglie", category: "Giacenze", icon: <Scale className="h-4 w-4" /> },
  { path: "/inventory", label: "Giacenze", category: "Giacenze", icon: <Boxes className="h-4 w-4" /> },
  { path: "/giacenze-range", label: "Calcolo Giacenze", category: "Giacenze", icon: <CalendarDays className="h-4 w-4" /> },
  { path: "/ai-dashboard", label: "Dashboard AI", category: "Analisi", icon: <Brain className="h-4 w-4" /> },
  { path: "/attivita-consigliate", label: "Attività Consigliate", category: "Analisi", icon: <ClipboardList className="h-4 w-4" /> },
  { path: "/ai-report-generator", label: "Report AI", category: "Analisi", icon: <FileSpreadsheet className="h-4 w-4" /> },
  { path: "/ai-enhanced", label: "AI Enhanced (BETA)", category: "Analisi", icon: <Sparkles className="h-4 w-4" /> },
  { path: "/growth-variability-analysis", label: "Variabilità Crescita AI", category: "Analisi", icon: <BarChart3 className="h-4 w-4" /> },
  { path: "/statistics", label: "Statistiche", category: "Analisi", icon: <BarChart className="h-4 w-4" /> },
  { path: "/lots-analytics", label: "Analisi Lotti", category: "Analisi", icon: <BarChart2 className="h-4 w-4" /> },
  { path: "/mixed-lots-analytics", label: "Analisi Lotti Misti", category: "Analisi", icon: <Split className="h-4 w-4" /> },
  { path: "/lot-ledger-statistics", label: "Statistiche Registro Lotti", category: "Analisi", icon: <Filter className="h-4 w-4" /> },
  { path: "/sgr", label: "Indici SGR", category: "Analisi", icon: <TrendingUp className="h-4 w-4" /> },
  { path: "/sales-reports", label: "Report Vendite", category: "Analisi", icon: <PieChart className="h-4 w-4" /> },
  { path: "/diario-di-impianto", label: "Diario di Impianto", category: "Analisi", icon: <FileText className="h-4 w-4" /> },
  { path: "/eco-impact", label: "Impatto Ambientale", category: "Analisi", icon: <Leaf className="h-4 w-4" /> },
  { path: "/lci", label: "LCI - ECOTAPES", category: "Analisi", icon: <Leaf className="h-4 w-4" /> },
  { path: "/proiezione-crescita", label: "Scostamenti", category: "Pianificazione", icon: <TrendingUp className="h-4 w-4" /> },
  { path: "/gestione-mortalita", label: "Gestione Mortalità", category: "Pianificazione", icon: <Skull className="h-4 w-4" /> },
  { path: "/advanced-sales", label: "Gestione Vendite", category: "Vendite", icon: <Package className="h-4 w-4" /> },
  { path: "/fatture-in-cloud", label: "Fatture in Cloud", category: "Vendite", icon: <CloudIcon className="h-4 w-4" /> },
  { path: "/ordini-condivisi", label: "Ordini Condivisi", category: "Vendite", icon: <Globe className="h-4 w-4" /> },
  { path: "/settings", label: "Impostazioni", category: "Sistema", icon: <Settings className="h-4 w-4" /> },
  { path: "/notification-settings", label: "Gestione Notifiche", category: "Sistema", icon: <Bell className="h-4 w-4" /> },
  { path: "/backup", label: "Backup Database", category: "Sistema", icon: <Database className="h-4 w-4" /> },
  { path: "/amministrazione-utilita", label: "Utilità Admin", category: "Sistema", icon: <Settings className="h-4 w-4" /> },
];

export default function MenuSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [hiddenItems, setHiddenItems] = useState<string[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { data: menuPrefs, isLoading } = useQuery({
    queryKey: ['/api/menu-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return { data: { menuItems: [], compactModeEnabled: false } };
      const res = await fetch(`/api/menu-preferences/${user.id}`);
      return res.json();
    },
    enabled: !!user?.id
  });

  useEffect(() => {
    if (menuPrefs?.data?.menuItems) {
      setSelectedItems(menuPrefs.data.menuItems);
    }
    if (menuPrefs?.data?.hiddenMenuItems) {
      setHiddenItems(menuPrefs.data.hiddenMenuItems);
    }
  }, [menuPrefs]);

  const savePrefsMutation = useMutation({
    mutationFn: async (menuItems: string[]) => {
      return apiRequest(`/api/menu-preferences/${user?.id}`, {
        method: 'POST',
        body: JSON.stringify({ menuItems, compactModeEnabled: menuPrefs?.data?.compactModeEnabled ?? false })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-preferences', user?.id] });
      toast({ title: "Preferenze salvate", description: "Le tue preferenze menu sono state aggiornate." });
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile salvare le preferenze.", variant: "destructive" });
    }
  });

  const saveHiddenMutation = useMutation({
    mutationFn: async (items: string[]) => {
      return apiRequest(`/api/menu-preferences/${user?.id}/hidden-menu-items`, {
        method: 'POST',
        body: JSON.stringify({ hiddenMenuItems: items })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-preferences', user?.id] });
      toast({ title: "Visibilità aggiornata", description: "Le voci nascoste sono state aggiornate." });
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile salvare le modifiche.", variant: "destructive" });
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/change-password', {
        method: 'POST',
        body: JSON.stringify({ userId: user?.id, currentPassword, newPassword })
      });
    },
    onSuccess: () => {
      toast({ title: "Password modificata", description: "La password è stata cambiata con successo." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message || "Password attuale non corretta.", variant: "destructive" });
    }
  });

  const toggleItem = (path: string) => {
    setSelectedItems(prev => 
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const toggleHidden = (path: string) => {
    setHiddenItems(prev => 
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const handleSavePreferences = () => {
    savePrefsMutation.mutate(selectedItems);
  };

  const handleSaveHidden = () => {
    saveHiddenMutation.mutate(hiddenItems);
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Errore", description: "Le password non coincidono.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Errore", description: "La password deve essere di almeno 6 caratteri.", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate();
  };

  const categories = [...new Set(allMenuItems.map(item => item.category))];

  if (isLoading) {
    return <div className="p-6">Caricamento...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Impostazioni Personali"
        subtitle="Personalizza il tuo menu e gestisci il tuo account"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-500" />
            Visibilità Voci di Menu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Tutte le voci sono visibili per impostazione predefinita. Deseleziona quelle che non ti servono per nasconderle dal menu. Le nuove funzionalità appariranno automaticamente.
          </p>
          
          {categories.map(category => (
            <div key={category} className="space-y-2">
              <h3 className="font-medium text-sm text-gray-700 border-b pb-1">{category}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allMenuItems.filter(item => item.category === category).map(item => (
                  <div key={item.path} className={`flex items-center space-x-2 p-1 rounded ${hiddenItems.includes(item.path) ? 'opacity-50' : ''}`}>
                    <Checkbox 
                      id={`vis-${item.path}`}
                      checked={!hiddenItems.includes(item.path)}
                      onCheckedChange={() => toggleHidden(item.path)}
                    />
                    <Label htmlFor={`vis-${item.path}`} className="flex items-center gap-2 text-sm cursor-pointer">
                      {item.icon}
                      {item.label}
                    </Label>
                  </div>
                ))}
              </div>
              <Separator className="my-2" />
            </div>
          ))}

          <div className="flex gap-2">
            <Button onClick={handleSaveHidden} disabled={saveHiddenMutation.isPending} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {saveHiddenMutation.isPending ? "Salvataggio..." : "Salva Visibilità"}
            </Button>
            {hiddenItems.length > 0 && (
              <Button variant="outline" onClick={() => { setHiddenItems([]); saveHiddenMutation.mutate([]); }}>
                <Eye className="h-4 w-4 mr-2" />
                Mostra Tutti
              </Button>
            )}
          </div>
          {hiddenItems.length > 0 && (
            <p className="text-xs text-amber-600">{hiddenItems.length} {hiddenItems.length === 1 ? 'voce nascosta' : 'voci nascoste'}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Menu Preferiti (Compatto)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Seleziona le voci da mostrare quando attivi la modalità compatta (icona occhio nella sidebar).
            </p>
            
            {categories.map(category => (
              <div key={category} className="space-y-2">
                <h3 className="font-medium text-sm text-gray-700">{category}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allMenuItems.filter(item => item.category === category).map(item => (
                    <div key={item.path} className="flex items-center space-x-2">
                      <Checkbox 
                        id={item.path}
                        checked={selectedItems.includes(item.path)}
                        onCheckedChange={() => toggleItem(item.path)}
                      />
                      <Label htmlFor={item.path} className="flex items-center gap-2 text-sm cursor-pointer">
                        {item.icon}
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
                <Separator className="my-2" />
              </div>
            ))}

            <Button onClick={handleSavePreferences} disabled={savePrefsMutation.isPending} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {savePrefsMutation.isPending ? "Salvataggio..." : "Salva Preferenze"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-gray-500" />
              Cambia Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Password Attuale</Label>
              <Input 
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Inserisci la password attuale"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nuova Password</Label>
              <Input 
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Inserisci la nuova password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Conferma Nuova Password</Label>
              <Input 
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Conferma la nuova password"
              />
            </div>

            <Button 
              onClick={handleChangePassword} 
              disabled={changePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword}
              variant="outline"
              className="w-full"
            >
              <Lock className="h-4 w-4 mr-2" />
              {changePasswordMutation.isPending ? "Modifica in corso..." : "Cambia Password"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-500" />
            Come Funziona
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2">1. Nuove Voci Automatiche</h4>
              <p className="text-gray-600">Ogni nuova funzionalità appare automaticamente nel menu. Non devi fare nulla!</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium mb-2">2. Nascondi Voci</h4>
              <p className="text-gray-600">Deseleziona le voci che non ti servono nella sezione "Visibilità" per nasconderle dal menu.</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium mb-2">3. Menu Compatto</h4>
              <p className="text-gray-600">Attiva la modalità compatta nella sidebar per vedere solo i tuoi preferiti selezionati.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
