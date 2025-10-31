import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { 
  RefreshCw, 
  Download, 
  Filter, 
  ChevronRight, 
  ChevronDown,
  Calendar,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import '../styles/spreadsheet.css';

interface RigaOrdine {
  id: number;
  rigaNumero: number;
  codiceProdotto: string | null;
  taglia: string;
  descrizione: string | null;
  quantita: number;
  prezzoUnitario: number;
  importoRiga: number;
}

interface OrdineCondiviso {
  id: number;
  numero: string | null;
  data: string;
  clienteNome: string;
  stato: string;
  quantitaTotale: number;
  tagliaRichiesta: string;
  quantitaConsegnata: number;
  quantitaResidua: number;
  statoCalcolato: string;
  dataInizioConsegna: string | null;
  dataFineConsegna: string | null;
  syncStatus: string;
  fattureInCloudId: number | null;
  righe?: RigaOrdine[];
}

interface Consegna {
  id: number;
  ordineId: number;
  dataConsegna: string;
  quantita: number;
  note: string | null;
  appOrigine: string;
  ordineNumero: string | null;
  clienteNome: string;
}

interface EditableRow extends OrdineCondiviso {
  isEditing: boolean;
  editedDataConsegna: string | null;
  editedQuantita: string;
}

type SortField = 'data' | 'dataConsegna' | 'cliente' | 'quantita' | 'taglia' | 'stato' | 'sync';
type SortDirection = 'asc' | 'desc' | null;

export default function OrdiniCondivisi() {
  const { toast } = useToast();
  const [ricercaCliente, setRicercaCliente] = useState('');
  const [filtroStato, setFiltroStato] = useState<string>('tutti');
  const [selezionati, setSelezionati] = useState<Set<number>>(new Set());
  const [righeEspanse, setRigheEspanse] = useState<Set<number>>(new Set());
  const [ordiniEditabili, setOrdiniEditabili] = useState<EditableRow[]>([]);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Query ordini
  const { data: ordiniResponse, isLoading: loadingOrdini } = useQuery<{ success: boolean; ordini: OrdineCondiviso[]; count: number }>({
    queryKey: ['/api/ordini-condivisi'],
    enabled: true
  });

  // Query consegne
  const { data: consegneResponse } = useQuery<{ success: boolean; consegne: Consegna[]; count: number }>({
    queryKey: ['/api/ordini-condivisi/consegne'],
    enabled: true
  });

  const ordini = ordiniResponse?.ordini || [];
  const consegne = consegneResponse?.consegne || [];

  // Inizializza ordini editabili solo quando cambiano gli ID
  useEffect(() => {
    const nuoviIds = ordini.map(o => o.id).join(',');
    const vecchiIds = ordiniEditabili.map(o => o.id).join(',');
    
    if (nuoviIds !== vecchiIds) {
      const editabili = ordini.map(o => ({
        ...o,
        isEditing: false,
        editedDataConsegna: null,
        editedQuantita: ''
      }));
      setOrdiniEditabili(editabili);
    }
  }, [ordini]);

  // Filtra e ordina
  const ordiniFiltrati = ordiniEditabili
    .filter((ord) => {
      if (ricercaCliente && !ord.clienteNome?.toLowerCase().includes(ricercaCliente.toLowerCase())) {
        return false;
      }
      if (filtroStato !== 'tutti' && ord.statoCalcolato !== filtroStato) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (!sortField || !sortDirection) return 0;
      
      let comparison = 0;
      
      switch (sortField) {
        case 'data':
          comparison = new Date(a.data).getTime() - new Date(b.data).getTime();
          break;
        case 'dataConsegna':
          const dateA = a.dataInizioConsegna ? new Date(a.dataInizioConsegna).getTime() : 0;
          const dateB = b.dataInizioConsegna ? new Date(b.dataInizioConsegna).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'cliente':
          comparison = (a.clienteNome || '').localeCompare(b.clienteNome || '');
          break;
        case 'quantita':
          comparison = (a.quantitaTotale || 0) - (b.quantitaTotale || 0);
          break;
        case 'taglia':
          comparison = (a.tagliaRichiesta || '').localeCompare(b.tagliaRichiesta || '');
          break;
        case 'stato':
          comparison = a.statoCalcolato.localeCompare(b.statoCalcolato);
          break;
        case 'sync':
          const syncA = a.fattureInCloudId ? 2 : a.syncStatus === 'errore' ? 0 : 1;
          const syncB = b.fattureInCloudId ? 2 : b.syncStatus === 'errore' ? 0 : 1;
          comparison = syncA - syncB;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // Statistiche basate su TUTTI gli ordini (non filtrati)
  const statsGlobali = {
    tutti: ordini.length,
    aperti: ordini.filter(o => o.statoCalcolato === 'Aperto').length,
    parziali: ordini.filter(o => o.statoCalcolato === 'Parziale').length,
    completati: ordini.filter(o => o.statoCalcolato === 'Completato').length,
    annullati: 0
  };

  const toggleSelezione = (id: number) => {
    const nuovi = new Set(selezionati);
    nuovi.has(id) ? nuovi.delete(id) : nuovi.add(id);
    setSelezionati(nuovi);
  };

  const toggleSelezioneTutti = () => {
    if (selezionati.size === ordiniFiltrati.length) {
      setSelezionati(new Set());
    } else {
      setSelezionati(new Set(ordiniFiltrati.map(o => o.id)));
    }
  };

  const toggleEspansione = (id: number) => {
    const nuove = new Set(righeEspanse);
    nuove.has(id) ? nuove.delete(id) : nuove.add(id);
    setRigheEspanse(nuove);
  };

  const startEdit = (id: number) => {
    setOrdiniEditabili(prev => prev.map(o => 
      o.id === id ? { ...o, isEditing: true, editedDataConsegna: null, editedQuantita: '' } : o
    ));
  };

  const cancelEdit = (id: number) => {
    setOrdiniEditabili(prev => prev.map(o => 
      o.id === id ? { ...o, isEditing: false, editedDataConsegna: null, editedQuantita: '' } : o
    ));
  };

  const updateField = (id: number, field: 'editedDataConsegna' | 'editedQuantita', value: string) => {
    setOrdiniEditabili(prev => prev.map(o => 
      o.id === id ? { ...o, [field]: value } : o
    ));
  };

  // Mutation salva consegna
  const salvaMutation = useMutation({
    mutationFn: async ({ ordineId, dataConsegna, quantita }: { ordineId: number; dataConsegna: string; quantita: number }) => {
      return apiRequest('/api/ordini-condivisi/consegne', 'POST', {
        ordineId,
        dataConsegna,
        quantita,
        note: null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ordini-condivisi'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ordini-condivisi/consegne'] });
      toast({
        title: '✅ Consegna salvata',
        description: 'La consegna è stata registrata con successo',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Errore',
        description: error.message || 'Impossibile salvare la consegna',
        variant: 'destructive',
      });
    },
  });

  const saveEdit = async (id: number) => {
    const ordine = ordiniEditabili.find(o => o.id === id);
    if (!ordine) return;

    const data = ordine.editedDataConsegna || new Date().toISOString().split('T')[0];
    const quantita = parseInt(ordine.editedQuantita);

    if (isNaN(quantita) || quantita <= 0) {
      toast({
        title: '❌ Errore',
        description: 'Inserisci una quantità valida',
        variant: 'destructive',
      });
      return;
    }

    if (quantita > ordine.quantitaResidua) {
      toast({
        title: '❌ Errore',
        description: `La quantità supera il residuo (${ordine.quantitaResidua.toLocaleString('it-IT')})`,
        variant: 'destructive',
      });
      return;
    }

    await salvaMutation.mutateAsync({ ordineId: id, dataConsegna: data, quantita });
    cancelEdit(id);
  };

  const getStatoBadge = (stato: string) => {
    switch (stato) {
      case 'Completato':
        return (
          <Badge className="bg-green-600 text-white hover:bg-green-700 text-xs px-2 py-0.5">
            Completato
          </Badge>
        );
      case 'Aperto':
        return (
          <Badge className="bg-gray-800 text-white hover:bg-gray-900 text-xs px-2 py-0.5">
            Aperto
          </Badge>
        );
      case 'Parziale':
        return (
          <Badge className="bg-gray-800 text-white hover:bg-gray-900 text-xs px-2 py-0.5">
            In Lavorazione
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-xs">{stato}</Badge>;
    }
  };

  const getSyncIcon = (ordine: OrdineCondiviso) => {
    if (ordine.syncStatus === 'errore') {
      return (
        <div className="flex items-center gap-1.5 text-red-600">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs">Errore</span>
          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 hover:bg-red-100">
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      );
    }
    if (ordine.fattureInCloudId) {
      return (
        <div className="flex items-center gap-1.5 text-green-600">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-xs font-medium">Sincronizzato</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-gray-500">
        <Clock className="w-4 h-4" />
        <span className="text-xs">Locale</span>
      </div>
    );
  };

  const formatDataConsegna = (inizio: string | null, fine: string | null) => {
    if (!inizio) return '-';
    const dataInizio = format(new Date(inizio), 'dd/MM', { locale: it });
    if (!fine) return dataInizio;
    
    const inizioDate = new Date(inizio);
    const fineDate = new Date(fine);
    
    if (inizioDate.getFullYear() === fineDate.getFullYear()) {
      return `${dataInizio} - ${format(fineDate, 'dd/MM/yyyy', { locale: it })}`;
    }
    return `${format(inizioDate, 'dd/MM/yyyy', { locale: it })} - ${format(fineDate, 'dd/MM/yyyy', { locale: it })}`;
  };

  const getConsegnePerOrdine = (ordineId: number) => {
    return consegne.filter(c => c.ordineId === ordineId);
  };

  const getRigheOrdine = (ordineId: number) => {
    const ordine = ordiniEditabili.find(o => o.id === ordineId);
    return ordine?.righe || [];
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cicla: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-3 h-3 ml-1 text-primary" />;
    }
    return <ArrowDown className="w-3 h-3 ml-1 text-primary" />;
  };

  if (loadingOrdini) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Caricamento ordini condivisi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestione Ordini</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" data-testid="button-sync-fic">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sincronizza con FIC
          </Button>
          <Button variant="outline" size="sm" data-testid="button-esporta">
            <Download className="w-4 h-4 mr-2" />
            Esporta
          </Button>
        </div>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Tutti', value: statsGlobali.tutti, stato: 'tutti' },
          { label: 'Aperti', value: statsGlobali.aperti, stato: 'Aperto' },
          { label: 'In Lavorazione', value: statsGlobali.parziali, stato: 'Parziale' },
          { label: 'Completati', value: statsGlobali.completati, stato: 'Completato' },
          { label: 'Annullati', value: statsGlobali.annullati, stato: 'annullati' }
        ].map((stat) => (
          <Card 
            key={stat.stato}
            className={`cursor-pointer transition-colors ${filtroStato === stat.stato ? 'border-primary' : 'hover:bg-accent'}`}
            onClick={() => setFiltroStato(stat.stato)}
          >
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ricerca e filtri */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Cerca cliente..."
          value={ricercaCliente}
          onChange={(e) => setRicercaCliente(e.target.value)}
          className="max-w-xs h-9 text-sm"
          data-testid="input-ricerca-cliente"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="w-4 h-4 mr-2" />
              Filtri
              {(filtroStato !== 'tutti' || ricercaCliente) && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {[filtroStato !== 'tutti' ? 1 : 0, ricercaCliente ? 1 : 0].reduce((a, b) => a + b, 0)}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Stato ordine</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setFiltroStato('tutti')}>
              <div className="flex items-center justify-between w-full">
                <span>Tutti gli ordini</span>
                {filtroStato === 'tutti' && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFiltroStato('Aperto')}>
              <div className="flex items-center justify-between w-full">
                <span>Solo Aperti</span>
                {filtroStato === 'Aperto' && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFiltroStato('Parziale')}>
              <div className="flex items-center justify-between w-full">
                <span>Solo In Lavorazione</span>
                {filtroStato === 'Parziale' && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFiltroStato('Completato')}>
              <div className="flex items-center justify-between w-full">
                <span>Solo Completati</span>
                {filtroStato === 'Completato' && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => {
                setFiltroStato('tutti');
                setRicercaCliente('');
              }}
              className="text-destructive"
            >
              <X className="w-4 h-4 mr-2" />
              Rimuovi tutti i filtri
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabella Excel-like */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <div className="p-4 border-b bg-muted/30">
            <h2 className="text-base font-semibold">Lista Ordini</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {ordiniFiltrati.length} ordini trovati
            </p>
          </div>

          {ordiniFiltrati.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Nessun ordine trovato
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-muted sticky top-0">
                  <tr className="border-b">
                    <th className="w-12 p-2 text-left border-r">
                      <Checkbox
                        checked={ordiniFiltrati.length > 0 && selezionati.size === ordiniFiltrati.length}
                        onCheckedChange={toggleSelezioneTutti}
                        className="h-4 w-4"
                        data-testid="checkbox-select-all"
                      />
                    </th>
                    <th 
                      className="p-2 text-left text-xs font-medium text-muted-foreground border-r cursor-pointer hover:bg-muted-foreground/10 transition-colors select-none"
                      onClick={() => handleSort('data')}
                    >
                      <div className="flex items-center">
                        Data Ordine
                        <SortIcon field="data" />
                      </div>
                    </th>
                    <th 
                      className="p-2 text-left text-xs font-medium text-muted-foreground border-r cursor-pointer hover:bg-muted-foreground/10 transition-colors select-none"
                      onClick={() => handleSort('dataConsegna')}
                    >
                      <div className="flex items-center">
                        Data Consegna
                        <SortIcon field="dataConsegna" />
                      </div>
                    </th>
                    <th 
                      className="p-2 text-left text-xs font-medium text-muted-foreground border-r cursor-pointer hover:bg-muted-foreground/10 transition-colors select-none"
                      onClick={() => handleSort('cliente')}
                    >
                      <div className="flex items-center">
                        Cliente
                        <SortIcon field="cliente" />
                      </div>
                    </th>
                    <th 
                      className="p-2 text-right text-xs font-medium text-muted-foreground border-r cursor-pointer hover:bg-muted-foreground/10 transition-colors select-none"
                      onClick={() => handleSort('quantita')}
                    >
                      <div className="flex items-center justify-end">
                        Quantità
                        <SortIcon field="quantita" />
                      </div>
                    </th>
                    <th 
                      className="p-2 text-left text-xs font-medium text-muted-foreground border-r cursor-pointer hover:bg-muted-foreground/10 transition-colors select-none"
                      onClick={() => handleSort('taglia')}
                    >
                      <div className="flex items-center">
                        Taglia
                        <SortIcon field="taglia" />
                      </div>
                    </th>
                    <th 
                      className="p-2 text-left text-xs font-medium text-muted-foreground border-r cursor-pointer hover:bg-muted-foreground/10 transition-colors select-none"
                      onClick={() => handleSort('stato')}
                    >
                      <div className="flex items-center">
                        Stato
                        <SortIcon field="stato" />
                      </div>
                    </th>
                    <th 
                      className="p-2 text-left text-xs font-medium text-muted-foreground border-r cursor-pointer hover:bg-muted-foreground/10 transition-colors select-none"
                      onClick={() => handleSort('sync')}
                    >
                      <div className="flex items-center">
                        Sync FIC
                        <SortIcon field="sync" />
                      </div>
                    </th>
                    <th className="p-2 text-right text-xs font-medium text-muted-foreground">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {ordiniFiltrati.map((ordine, idx) => {
                    const espanso = righeEspanse.has(ordine.id);
                    const consegneOrdine = getConsegnePerOrdine(ordine.id);
                    const righeOrdine = getRigheOrdine(ordine.id);
                    const hasDettagli = righeOrdine.length > 0;

                    return (
                      <>
                        <tr 
                          key={ordine.id}
                          className={`border-b hover:bg-muted/30 transition-colors ${
                            espanso ? 'bg-muted/20' : idx % 2 === 0 ? 'bg-white dark:bg-background' : 'bg-muted/10'
                          }`}
                          data-testid={`row-ordine-${ordine.id}`}
                        >
                          {/* Checkbox + Chevron espansione */}
                          <td className="p-2 border-r">
                            <div className="flex items-center gap-1">
                              {hasDettagli && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 w-5 p-0"
                                  onClick={() => toggleEspansione(ordine.id)}
                                >
                                  {espanso ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                </Button>
                              )}
                              <Checkbox
                                checked={selezionati.has(ordine.id)}
                                onCheckedChange={() => toggleSelezione(ordine.id)}
                                className="h-4 w-4"
                                data-testid={`checkbox-ordine-${ordine.id}`}
                              />
                            </div>
                          </td>
                          
                          {/* Data Ordine */}
                          <td className="p-2 text-sm border-r">
                            {format(new Date(ordine.data), 'dd/MM/yyyy', { locale: it })}
                          </td>
                          
                          {/* Data Consegna */}
                          <td className="p-2 text-xs text-muted-foreground border-r">
                            {ordine.dataInizioConsegna && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDataConsegna(ordine.dataInizioConsegna, ordine.dataFineConsegna)}
                              </div>
                            )}
                            {!ordine.dataInizioConsegna && '-'}
                          </td>
                          
                          {/* Cliente */}
                          <td className="p-2 text-sm max-w-[200px] truncate border-r" title={ordine.clienteNome}>
                            {ordine.clienteNome || '-'}
                          </td>
                          
                          {/* Quantità */}
                          <td className="p-2 text-sm text-right font-medium border-r">
                            {ordine.quantitaTotale ? ordine.quantitaTotale.toLocaleString('it-IT') : '0'}
                          </td>
                          
                          {/* Taglia */}
                          <td className="p-2 text-sm border-r">
                            {ordine.tagliaRichiesta || '-'}
                          </td>
                          
                          {/* Stato */}
                          <td className="p-2 border-r">
                            {getStatoBadge(ordine.statoCalcolato)}
                          </td>
                          
                          {/* Sync FIC */}
                          <td className="p-2 border-r">
                            {getSyncIcon(ordine)}
                          </td>
                          
                          {/* Azioni */}
                          <td className="p-2">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 hover:bg-muted"
                                onClick={() => startEdit(ordine.id)}
                                data-testid={`button-edit-${ordine.id}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                data-testid={`button-delete-${ordine.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Riga espansa con righe ordine */}
                        {espanso && hasDettagli && (
                          <tr className="bg-muted/10 border-b">
                            <td colSpan={10} className="p-0">
                              <div className="bg-muted/30 px-4 py-2 border-t border-b">
                                <h4 className="text-sm font-semibold">Righe Ordine</h4>
                              </div>
                              <table className="w-full text-xs">
                                <thead className="bg-muted/20">
                                  <tr>
                                    <th className="p-2 text-left border-r w-12">Riga</th>
                                    <th className="p-2 text-left border-r">Codice Prodotto</th>
                                    <th className="p-2 text-left border-r">Taglia</th>
                                    <th className="p-2 text-right border-r">Quantità</th>
                                    <th className="p-2 text-right border-r">Prezzo Unitario</th>
                                    <th className="p-2 text-right border-r">Importo</th>
                                    <th className="p-2 text-left">Descrizione</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {righeOrdine.map((riga) => (
                                    <tr key={riga.id} className="border-b hover:bg-muted/20">
                                      <td className="p-2 text-center border-r font-medium">{riga.rigaNumero}</td>
                                      <td className="p-2 border-r font-mono text-xs">{riga.codiceProdotto || '-'}</td>
                                      <td className="p-2 border-r">
                                        <Badge variant="outline" className="text-xs">{riga.taglia}</Badge>
                                      </td>
                                      <td className="p-2 text-right border-r font-semibold">
                                        {riga.quantita.toLocaleString('it-IT')}
                                      </td>
                                      <td className="p-2 text-right border-r">
                                        € {riga.prezzoUnitario.toFixed(4)}
                                      </td>
                                      <td className="p-2 text-right border-r font-medium">
                                        {riga.importoRiga > 0 ? `€ ${riga.importoRiga.toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : '-'}
                                      </td>
                                      <td className="p-2 text-xs text-muted-foreground max-w-xs truncate">
                                        {riga.descrizione || '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}

                        {/* Riga di modifica inline */}
                        {ordine.isEditing && (
                          <tr className="bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200">
                            <td colSpan={10} className="p-3">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <label className="text-xs font-medium text-muted-foreground min-w-[100px]">
                                    Data Consegna:
                                  </label>
                                  <Input
                                    type="date"
                                    value={ordine.editedDataConsegna || new Date().toISOString().split('T')[0]}
                                    onChange={(e) => updateField(ordine.id, 'editedDataConsegna', e.target.value)}
                                    className="h-8 w-40 text-sm"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="text-xs font-medium text-muted-foreground min-w-[80px]">
                                    Quantità:
                                  </label>
                                  <Input
                                    type="number"
                                    placeholder="Es: 30000"
                                    value={ordine.editedQuantita}
                                    onChange={(e) => updateField(ordine.id, 'editedQuantita', e.target.value)}
                                    className="h-8 w-32 text-sm"
                                    max={ordine.quantitaResidua}
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    / {ordine.quantitaResidua.toLocaleString('it-IT')} disponibili
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 ml-auto">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => cancelEdit(ordine.id)}
                                    className="h-8 text-xs"
                                  >
                                    Annulla
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => saveEdit(ordine.id)}
                                    disabled={salvaMutation.isPending}
                                    className="h-8 text-xs"
                                  >
                                    {salvaMutation.isPending ? 'Salvataggio...' : 'Salva Consegna'}
                                  </Button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
