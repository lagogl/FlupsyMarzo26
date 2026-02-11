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
  Sparkles, Radio
} from "lucide-react";

const allMenuItems = [
  { path: "/", label: "Dashboard", category: "Operativo", icon: <Home className="h-4 w-4" /> },
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
  { path: "/sizes", label: "Tabella Taglie", category: "Giacenze", icon: <Scale className="h-4 w-4" /> },
  { path: "/inventory", label: "Giacenze", category: "Giacenze", icon: <Boxes className="h-4 w-4" /> },
  { path: "/giacenze-range", label: "Calcolo Giacenze", category: "Giacenze", icon: <CalendarDays className="h-4 w-4" /> },
  { path: "/ai-dashboard", label: "Dashboard AI", category: "Analisi", icon: <Brain className="h-4 w-4" /> },
  { path: "/attivita-consigliate", label: "Attività Consigliate", category: "Analisi", icon: <ClipboardList className="h-4 w-4" /> },
  { path: "/ai-report-generator", label: "Report AI", category: "Analisi", icon: <FileSpreadsheet className="h-4 w-4" /> },
  { path: "/statistics", label: "Statistiche", category: "Analisi", icon: <BarChart className="h-4 w-4" /> },
  { path: "/sgr", label: "Indici SGR", category: "Analisi", icon: <TrendingUp className="h-4 w-4" /> },
  { path: "/advanced-sales", label: "Gestione Vendite", category: "Vendite", icon: <Package className="h-4 w-4" /> },
  { path: "/fatture-in-cloud", label: "Fatture in Cloud", category: "Vendite", icon: <CloudIcon className="h-4 w-4" /> },
  { path: "/ordini-condivisi", label: "Ordini Condivisi", category: "Vendite", icon: <Globe className="h-4 w-4" /> },
];

export default function MenuSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
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

  const handleSavePreferences = () => {
    savePrefsMutation.mutate(selectedItems);
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Menu Preferiti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Seleziona le voci che vuoi vedere nel menu compatto. In modalità compatta vedrai solo queste voci.
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
            <Eye className="h-5 w-5 text-blue-500" />
            Come Funziona
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2">1. Seleziona i Preferiti</h4>
              <p className="text-gray-600">Scegli le voci di menu che usi più spesso marcando le caselle.</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium mb-2">2. Attiva Menu Compatto</h4>
              <p className="text-gray-600">Clicca l'icona occhio nella sidebar per passare alla modalità compatta.</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium mb-2">3. Mostra Tutto</h4>
              <p className="text-gray-600">Puoi sempre vedere tutte le voci cliccando "Mostra tutto" o l'icona occhio.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
