import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import MainLayout from "@/layouts/MainLayout";
import Dashboard from "@/pages/Dashboard";
import Baskets from "@/pages/Baskets";
import BasketDetail from "@/pages/BasketDetail";
import BasketGroups from "@/pages/BasketGroups";
import Operations from "@/pages/Operations";
import OperationDetail from "@/pages/OperationDetail";
import EditOperation from "@/pages/EditOperation";
import SpreadsheetOperations from "@/pages/SpreadsheetOperations";
import Cycles from "@/pages/Cycles";
import CyclesPaginated from "@/pages/CyclesPaginated";
import CycleDetail from "@/pages/CycleDetail";
import Lots from "@/pages/Lots";
import Statistics from "@/pages/Statistics";
import Sizes from "@/pages/Sizes";
import Sgr from "@/pages/Sgr";
import Settings from "@/pages/Settings";
import Flupsys from "@/pages/Flupsys";
import FlupsyDetails from "@/pages/FlupsyDetails";
import FlupsyFullView from "@/pages/FlupsyFullView";
import FlupsyPositions from "@/pages/FlupsyPositions";
import FlupsyBaskets from "@/pages/FlupsyBaskets";
import FlupsyComparison from "@/pages/FlupsyComparison";
import FlupsyComparisonEnhanced from "@/pages/FlupsyComparisonEnhanced";
import Inventory from "@/pages/Inventory";
import TestView from "@/pages/TestView";
import NFCTagManager from "@/pages/NFCTagManager";
import NFCPrimaAttivazione from "@/pages/NFCPrimaAttivazione";
import RFIDUHFTagManager from "@/pages/RFIDUHFTagManager";
import GrowJourney from "@/pages/GrowJourney";
import BasketSelection from "@/pages/BasketSelection";
import DiarioDiBordo from "@/pages/DiarioDiBordo";
import DiarioAmbientale from "@/pages/DiarioAmbientale";
import NotificationSettings from "@/pages/NotificationSettings";
import NotificationManager from "@/pages/NotificationManager";
import EcoImpact from "@/pages/EcoImpact";
import SalesReports from "@/pages/SalesReports";
import AuthPage from "@/pages/AuthPage";
// Modulo screening rimosso - ora si usa solo Vagliatura con Mappa
// Modulo selezione rimosso - ora si usa solo Vagliatura con Mappa
// Importazione per il nuovo modulo di Vagliatura con Mappa
import VagliaturaConMappa from "@/pages/VagliaturaConMappa";
import BasketTransfer from "@/pages/BasketTransfer";
// Importazioni per la gestione delle pagine di amministrazione
import BackupPage from "@/pages/BackupPage";
import AmministrazioneUtilita from "@/pages/AmministrazioneUtilita";
// Importazione modulo vendite avanzate
import AdvancedSales from "@/pages/AdvancedSales";
import FattureInCloudConfig from "@/pages/FattureInCloudConfig";
// Importazione modulo ordini condivisi
import OrdiniCondivisi from "@/pages/OrdiniCondivisi";
// Importazione AI Dashboard
import AIDashboard from "@/pages/AIDashboard";
import AIReportGenerator from "@/pages/AIReportGenerator";
import AIEnhanced from "@/pages/AIEnhanced";
// Importazione Giacenze Range
import GiacenzeRange from "@/pages/GiacenzeRange";
// Importazione Storico Vagliature
import ScreeningsList from "@/pages/ScreeningsList";
import ScreeningDetail from "@/pages/ScreeningDetail";
// Importazione Lots Analytics
import LotsAnalytics from "@/pages/LotsAnalytics";
import MixedLotsAnalytics from "@/pages/MixedLotsAnalytics";
import LotLedgerStatistics from "@/pages/LotLedgerStatistics";
// Importazione AI Growth Variability Analysis
import GrowthVariabilityAnalysis from "@/pages/GrowthVariabilityAnalysis";
// Importazione LCI Module (ECOTAPES)
import LCIModule from "@/pages/LCIModule";
// Importazione Storia Animali (Genealogia)
import LineageAnimali from "@/pages/LineageAnimali";
import ReportLotto from "@/pages/ReportLotto";
import VagliatureSospette from "@/pages/VagliatureSospette";
import SgrLineage from "@/pages/SgrLineage";
// Importazione Task Management (Gestione Attività)
import TaskManagement from "@/pages/TaskManagement";
// Importazione Attività Consigliate AI
import AttivitaConsigliate from "@/pages/AttivitaConsigliate";
// Importazione Verifica Copertura Ordini
import VerificaCoperturaOrdini from "@/pages/VerificaCoperturaOrdini";
// Importazione Proiezione Crescita
import ProiezioneCrescita from "@/pages/ProiezioneCrescita";
import PianificazioneVendite from "@/pages/PianificazioneVendite";
import MappaGISLaguna from "@/pages/MappaGISLaguna";
// Importazione Gestione Mortalità
import GestioneMortalita from "@/pages/GestioneMortalita";
// Importazione Operators (Gestione Operatori)
import Operators from "@/pages/Operators";
// Importazione Menu Settings (Impostazioni Personali)
import MenuSettings from "@/pages/MenuSettings";
// Importazione Pending Closures (Chiusure Ciclo Pendenti)
import PendingClosures from "@/pages/PendingClosures";
import CesteDaRiallineare from "@/pages/CesteDaRiallineare";
import ReportPesoCeste from "@/pages/ReportPesoCeste";
// Importazione IMM (Indice di Maturità del Magazzino)
import IMM from "@/pages/IMM";
import Manuale from "@/pages/Manuale";
// Operazioni Avanzate rimosse per ottimizzazione prestazioni
import { initializeWebSocket } from "./lib/websocket";
import { useEffect } from "react";
import { WebSocketIndicator } from "@/components/WebSocketIndicator";
// Importiamo il sistema di tooltip contestuali
import { TooltipProvider } from "@/contexts/TooltipContext";
import { ContextualTooltip } from "@/components/ui/contextual-tooltip";
// Importiamo il sistema di autenticazione
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      {/* Pagina di autenticazione */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Pagine protette */}
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/flupsys" component={Flupsys}/>
      <ProtectedRoute path="/flupsys/:id" component={FlupsyDetails}/>
      <ProtectedRoute path="/flupsys/:id/positions" component={FlupsyPositions}/>
      <ProtectedRoute path="/flupsys/:id/baskets" component={FlupsyBaskets}/>
      <ProtectedRoute path="/flupsy-view" component={FlupsyFullView}/>

      <ProtectedRoute path="/flupsy-comparison" component={FlupsyComparison}/>
      <ProtectedRoute path="/flupsy-comparison-enhanced" component={FlupsyComparisonEnhanced}/>
      <ProtectedRoute path="/baskets" component={Baskets}/>
      <ProtectedRoute path="/basket-groups" component={BasketGroups}/>
      <ProtectedRoute path="/baskets/:id" component={BasketDetail}/>
      <ProtectedRoute path="/operations" component={Operations}/>
      <ProtectedRoute path="/operations/new" component={Operations}/>
      <ProtectedRoute path="/operations/edit/:id" component={EditOperation}/>
      <ProtectedRoute path="/operations/:id" component={OperationDetail}/>
      <ProtectedRoute path="/spreadsheet-operations" component={SpreadsheetOperations}/>
      <ProtectedRoute path="/cycles" component={CyclesPaginated}/>
      <ProtectedRoute path="/cycles/:id" component={CycleDetail}/>
      <ProtectedRoute path="/pending-closures" component={PendingClosures}/>
      <ProtectedRoute path="/ceste-da-riallineare" component={CesteDaRiallineare}/>
      <ProtectedRoute path="/report-peso-ceste" component={ReportPesoCeste}/>
      <ProtectedRoute path="/lots" component={Lots}/>
      <ProtectedRoute path="/statistics" component={Statistics} requiredUsername="gianluigi"/>
      <ProtectedRoute path="/lots-analytics" component={LotsAnalytics} requiredUsername="gianluigi"/>
      <ProtectedRoute path="/mixed-lots-analytics" component={MixedLotsAnalytics} requiredUsername="gianluigi"/>
      <ProtectedRoute path="/report-lotto/:lotId" component={ReportLotto}/>
      <ProtectedRoute path="/report-lotto" component={ReportLotto}/>
      <ProtectedRoute path="/vagliature-sospette" component={VagliatureSospette} requiredUsername="gianluigi"/>
      <ProtectedRoute path="/lot-ledger-statistics" component={LotLedgerStatistics} requiredUsername="gianluigi"/>
      <ProtectedRoute path="/inventory" component={Inventory}/>
      <ProtectedRoute path="/imm" component={IMM}/>
      <ProtectedRoute path="/manuale" component={Manuale}/>
      <ProtectedRoute path="/manual" component={Manuale}/>
      <ProtectedRoute path="/sizes" component={Sizes}/>
      <ProtectedRoute path="/sgr" component={Sgr} requiredUsername="gianluigi"/>
      <ProtectedRoute path="/sgr-lineage" component={SgrLineage}/>
      <ProtectedRoute path="/settings" component={Settings} requiredRole="admin" />
      <ProtectedRoute path="/test" component={TestView}/>
      <ProtectedRoute path="/nfc-prima-attivazione" component={NFCPrimaAttivazione}/>
      <ProtectedRoute path="/nfc-tags" component={NFCTagManager}/>
      <ProtectedRoute path="/gestione-tag-nfc" component={NFCTagManager}/>
      <ProtectedRoute path="/rfid-uhf-tags" component={RFIDUHFTagManager}/>
      <ProtectedRoute path="/grow-journey" component={GrowJourney}/>
      <ProtectedRoute path="/basket-selection" component={BasketSelection}/>
      <ProtectedRoute path="/backup" component={BackupPage} requiredRole="admin" />
      <ProtectedRoute path="/diario-di-impianto" component={DiarioDiBordo} requiredUsername="gianluigi"/>
      <ProtectedRoute path="/diario-di-bordo" component={DiarioDiBordo}/>
      <ProtectedRoute path="/notification-settings" component={NotificationManager} />
      <ProtectedRoute path="/menu-settings" component={MenuSettings} />
      <ProtectedRoute path="/amministrazione-utilita" component={AmministrazioneUtilita} requiredRole="admin" />
      <ProtectedRoute path="/eco-impact" component={EcoImpact} requiredUsername="gianluigi"/>
      <ProtectedRoute path="/sales-reports" component={SalesReports} requiredUsername="gianluigi"/>
      <ProtectedRoute path="/ai-dashboard" component={AIDashboard} requiredUsername="gianluigi"/>
      <ProtectedRoute path="/ai-report-generator" component={AIReportGenerator} requiredUsername="gianluigi"/>
      <ProtectedRoute path="/ai-enhanced" component={AIEnhanced} requiredUsername="gianluigi"/>
      <ProtectedRoute path="/attivita-consigliate" component={AttivitaConsigliate} requiredUsername="gianluigi"/>
      <ProtectedRoute path="/verifica-copertura" component={VerificaCoperturaOrdini}/>
      <ProtectedRoute path="/proiezione-crescita" component={ProiezioneCrescita}/>
      <ProtectedRoute path="/pianificazione-vendite" component={PianificazioneVendite} requiredUsername="gianluigi"/>
      <ProtectedRoute path="/gestione-mortalita" component={GestioneMortalita}/>
      <ProtectedRoute path="/giacenze-range" component={GiacenzeRange}/>
      <ProtectedRoute path="/growth-variability-analysis" component={GrowthVariabilityAnalysis} requiredUsername="gianluigi"/>
      <ProtectedRoute path="/task-management" component={TaskManagement}/>
      <ProtectedRoute path="/operators" component={Operators}/>
      <ProtectedRoute path="/lci" component={LCIModule} requiredUsername="gianluigi"/>
      <ProtectedRoute path="/storia-animali" component={LineageAnimali}/>
      <ProtectedRoute path="/diario-ambientale" component={DiarioAmbientale}/>
      <ProtectedRoute path="/mappa-gis" component={MappaGISLaguna}/>
      
      {/* Redirezione per pagine rimosse */}
      <Route path="/tp3000-forecast">
        {() => <Redirect to="/" />}
      </Route>
      <Route path="/nfc-manager">
        {() => <Redirect to="/nfc-tags" />}
      </Route>
      <Route path="/orders">
        {() => <Redirect to="/" />}
      </Route>
      
      {/* Modulo screening rimosso - ora si usa solo Vagliatura con Mappa */}
      <Route path="/screening">
        {() => <Redirect to="/vagliatura" />}
      </Route>
      
      {/* Modulo selezione rimosso - ora si usa solo Vagliatura con Mappa */}
      
      {/* Mappa termica FLUPSY (accessibile a tutti gli utenti autenticati) */}
      <ProtectedRoute path="/flupsy-heatmap" component={FlupsyHeatmap}/>

      {/* Vagliatura con Mappa routes */}
      <ProtectedRoute path="/vagliatura" component={VagliaturaConMappa}/>
      <ProtectedRoute path="/vagliatura-con-mappa" component={VagliaturaConMappa}/>

      {/* Trasferimento Ciclo */}
      <ProtectedRoute path="/trasferimento-ciclo" component={BasketTransfer}/>
      
      {/* Storico Vagliature routes */}
      <ProtectedRoute path="/screenings" component={ScreeningsList}/>
      <ProtectedRoute path="/screenings/:id" component={ScreeningDetail}/>
      
      {/* Vendite Avanzate routes */}
      <ProtectedRoute path="/advanced-sales" component={AdvancedSales}/>
      
      {/* Fatture in Cloud routes */}
      <ProtectedRoute path="/fatture-in-cloud" component={FattureInCloudConfig} />
      
      {/* Ordini Condivisi routes */}
      <ProtectedRoute path="/ordini-condivisi" component={OrdiniCondivisi} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

// Componente WebSocketListener che semplicemente inizializza il WebSocket
function WebSocketListener() {
  useEffect(() => {
    // Inizializza il WebSocket quando il componente viene montato
    initializeWebSocket();
    
    // Non è necessario fare pulizia perché vogliamo mantenere la connessione
    // aperta per tutta la durata dell'applicazione
  }, []);
  
  return null; // Questo componente non renderizza nulla
}

// Importiamo il componente di integrazione WebSocket-Query
import { WebSocketQueryIntegration } from './lib/websocketQueryIntegration';
import { OperationListener } from '@/components/OperationListener';
// Riepilogo mattutino temporaneamente disabilitato (tenuto in standby).
// Per riattivarlo: ripristinare l'import e il tag <MorningSummaryOverlay /> più sotto.
// import MorningSummaryOverlay from '@/components/MorningSummaryOverlay';
import FlupsyHeatmap from '@/pages/FlupsyHeatmap';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Provider per l'autenticazione */}
      <AuthProvider>
        {/* Inizializza il WebSocket all'avvio dell'app */}
        <WebSocketListener />
        
        {/* Integrazione tra WebSocket e React Query */}
        <WebSocketQueryIntegration />
        
        {/* Listener specifico per invalidazione cache operazioni/cestelli */}
        <OperationListener />
        
        {/* Provider per i tooltip contestuali personalizzati */}
        <TooltipProvider>
          <MainLayout>
            <Router />
          </MainLayout>
          
          {/* Componente che renderizza i tooltip attivi */}
          <ContextualTooltip />
          
          {/* Indicatore di stato della connessione WebSocket */}
          <WebSocketIndicator />
          
          {/* Riepilogo mattutino temporaneamente disabilitato (standby). Per riattivare, rimuovere il commento qui sotto e l'import in alto. */}
          {/* <MorningSummaryOverlay /> */}
          
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
