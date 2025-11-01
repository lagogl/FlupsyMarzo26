import { useState, useEffect, useRef, Fragment } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  ChevronUp,
  Calendar,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  ChevronsDown,
  ChevronsUp,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import * as XLSX from 'xlsx';
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
  urlDocumento: string | null;
  righe?: RigaOrdine[];
}

interface Consegna {
  id: number;
  ordineId: number;
  dataConsegna: string;
  quantitaConsegnata: number;
  note: string | null;
  appOrigine: string;
  createdAt?: string;
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
  const [mostraBreakdown, setMostraBreakdown] = useState(true);
  const [filtroTaglia, setFiltroTaglia] = useState<string | null>(null);
  const [datePickerOrdineId, setDatePickerOrdineId] = useState<number | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });

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

  // Mappa colori per taglie (dal più chiaro al più scuro)
  const getTagliaColor = (taglia: string): { bg: string; border: string; text: string } => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      'TP-3000': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900' },
      'TP-5000': { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-900' },
      'TP-7000': { bg: 'bg-blue-200', border: 'border-blue-400', text: 'text-blue-900' },
      'TP-9000': { bg: 'bg-blue-300', border: 'border-blue-500', text: 'text-blue-950' },
      'TP-10000': { bg: 'bg-blue-400', border: 'border-blue-600', text: 'text-blue-950' },
    };
    return colors[taglia] || { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-900' };
  };

  // Filtra e ordina
  const ordiniFiltrati = ordiniEditabili
    .filter((ord) => {
      if (ricercaCliente && !ord.clienteNome?.toLowerCase().includes(ricercaCliente.toLowerCase())) {
        return false;
      }
      if (filtroStato !== 'tutti' && ord.stato !== filtroStato) {
        return false;
      }
      if (filtroTaglia && ord.tagliaRichiesta !== filtroTaglia) {
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
          comparison = a.stato.localeCompare(b.stato);
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
    aperti: ordini.filter(o => o.stato === 'Aperto').length,
    parziali: ordini.filter(o => o.stato === 'Parziale').length,
    completati: ordini.filter(o => o.stato === 'Completato').length,
    annullati: 0
  };

  // Calcolo totali animali
  const totaleOrdinato = ordini.reduce((sum, o) => sum + (o.quantitaTotale || 0), 0);
  const totaleConsegnato = consegne.reduce((sum, c) => sum + c.quantitaConsegnata, 0);
  
  // Calcolo per taglia
  const statsTaglia = ordini.reduce((acc: Record<string, { ordinato: number; consegnato: number }>, ordine) => {
    const taglia = ordine.tagliaRichiesta || 'N/D';
    if (!acc[taglia]) {
      acc[taglia] = { ordinato: 0, consegnato: 0 };
    }
    acc[taglia].ordinato += ordine.quantitaTotale || 0;
    
    // Aggiungi consegne per questo ordine
    const consegneOrdine = consegne.filter(c => c.ordineId === ordine.id);
    acc[taglia].consegnato += consegneOrdine.reduce((sum, c) => sum + c.quantitaConsegnata, 0);
    
    return acc;
  }, {});
  
  const taglie = Object.keys(statsTaglia).sort((a, b) => {
    const numA = parseInt(a.split('-')[1]);
    const numB = parseInt(b.split('-')[1]);
    return numA - numB;
  });

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

  const espandiTutte = () => {
    const tuttiIds = new Set(ordiniFiltrati.map(o => o.id));
    setRigheEspanse(tuttiIds);
  };

  const comprimiTutte = () => {
    setRigheEspanse(new Set());
  };

  const toggleTutte = () => {
    if (righeEspanse.size === ordiniFiltrati.length) {
      comprimiTutte();
    } else {
      espandiTutte();
    }
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

  // Mutation salva date consegna
  const salvaDateConsegnaMutation = useMutation({
    mutationFn: async ({ ordineId, dataInizio, dataFine }: { ordineId: number; dataInizio: string; dataFine: string }) => {
      return apiRequest(`/api/ordini-condivisi/${ordineId}/delivery-range`, 'PATCH', {
        dataInizioConsegna: dataInizio,
        dataFineConsegna: dataFine
      });
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['/api/ordini-condivisi'] });
      toast({
        title: '✅ Date salvate',
        description: 'Le date di consegna sono state aggiornate',
      });
      setDatePickerOrdineId(null);
      setSelectedDateRange({ from: undefined, to: undefined });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Errore',
        description: error.message || 'Impossibile salvare le date',
        variant: 'destructive',
      });
    },
  });

  const handleDateRangeSelect = (range: { from: Date | undefined; to: Date | undefined } | undefined) => {
    if (!range) {
      setSelectedDateRange({ from: undefined, to: undefined });
      return;
    }
    
    setSelectedDateRange(range);
    
    // Auto-salva quando entrambe le date sono selezionate
    if (range.from && range.to && datePickerOrdineId) {
      const dataInizio = range.from.toISOString().split('T')[0];
      const dataFine = range.to.toISOString().split('T')[0];
      salvaDateConsegnaMutation.mutate({ ordineId: datePickerOrdineId, dataInizio, dataFine });
    }
  };

  const openDatePicker = (ordineId: number, dataInizio: string | null, dataFine: string | null) => {
    setDatePickerOrdineId(ordineId);
    setSelectedDateRange({
      from: dataInizio ? new Date(dataInizio) : undefined,
      to: dataFine ? new Date(dataFine) : undefined
    });
  };

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

  const getStatoBadge = (stato: string, ordine?: OrdineCondiviso) => {
    switch (stato) {
      case 'Aperto':
        return (
          <Badge className="bg-blue-600 text-white hover:bg-blue-700 text-xs px-2 py-1 rounded-md font-medium">
            Aperto
          </Badge>
        );
      case 'Parziale':
      case 'In Lavorazione':
        const percentuale = ordine ? Math.round((ordine.quantitaConsegnata / ordine.quantitaTotale) * 100) : 0;
        return (
          <div className="flex items-center gap-1.5">
            <Badge className="bg-zinc-600 text-white hover:bg-zinc-700 text-xs px-2 py-1 rounded-md font-medium">
              In Lavorazione
            </Badge>
            {ordine && (
              <span className="text-xs font-medium text-zinc-700">{percentuale}%</span>
            )}
          </div>
        );
      case 'Completato':
        return (
          <Badge className="bg-green-600 text-white hover:bg-green-700 text-xs px-2 py-1 rounded-md font-medium">
            Completato
          </Badge>
        );
      case 'Annullato':
        return (
          <Badge className="bg-red-600 text-white hover:bg-red-700 text-xs px-2 py-1 rounded-md font-medium">
            Annullato
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
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="text-xs font-medium text-blue-600">Sincronizzato</span>
          {ordine.urlDocumento && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 px-1.5 hover:bg-blue-100 flex items-center gap-1 text-green-600"
              onClick={(e) => {
                e.stopPropagation();
                window.open(ordine.urlDocumento!, '_blank', 'noopener,noreferrer');
              }}
              data-testid={`link-fic-${ordine.id}`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">#{ordine.numero}</span>
            </Button>
          )}
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

  const sincronizzaConFIC = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/fatture-in-cloud/orders/sync', 'POST', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ordini-condivisi'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ordini-condivisi/consegne'] });
      toast({
        title: '✅ Sincronizzazione completata',
        description: 'Gli ordini sono stati sincronizzati con Fatture in Cloud',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Errore sincronizzazione',
        description: error.message || 'Impossibile sincronizzare con Fatture in Cloud',
        variant: 'destructive',
      });
    },
  });

  const esportaOrdini = () => {
    if (ordiniFiltrati.length === 0) {
      toast({
        title: '⚠️ Nessun ordine da esportare',
        description: 'Non ci sono ordini da esportare con i filtri selezionati',
        variant: 'destructive',
      });
      return;
    }

    const datiEsportazione = ordiniFiltrati.flatMap(ordine => {
      const consegneOrdine = getConsegnePerOrdine(ordine.id);
      const righeOrdine = getRigheOrdine(ordine.id);
      
      const rigaBase = {
        'Numero Ordine': ordine.numero || '',
        'Cliente': ordine.clienteNome || '',
        'Data Ordine': ordine.data ? format(new Date(ordine.data), 'dd/MM/yyyy', { locale: it }) : '',
        'Stato': ordine.stato || '',
        'Quantità Totale Ordine': ordine.quantitaTotale || 0,
        'Taglia Ordine': ordine.tagliaRichiesta || '',
      };

      const righe = righeOrdine.map(riga => ({
        ...rigaBase,
        'Tipo Riga': 'Dettaglio Prodotto',
        'Riga N.': riga.rigaNumero || '',
        'Codice Prodotto': riga.codiceProdotto || '',
        'Taglia': riga.taglia || '',
        'Descrizione': riga.descrizione || '',
        'Quantità': riga.quantita || 0,
        'Prezzo Unitario (€)': riga.prezzoUnitario || 0,
        'Importo (€)': riga.importoRiga || 0,
      }));

      const consegneRighe = consegneOrdine.map(consegna => ({
        ...rigaBase,
        'Tipo Riga': 'Consegna',
        'Data Consegna': consegna.dataConsegna ? format(new Date(consegna.dataConsegna), 'dd/MM/yyyy', { locale: it }) : '',
        'Quantità Consegnata': consegna.quantitaConsegnata || 0,
        'App Origine': consegna.appOrigine === 'delta_futuro' ? 'SandNursery' : 'Flupsy',
        'Note Consegna': consegna.note || '',
      }));

      return [...righe, ...consegneRighe];
    });

    const ws = XLSX.utils.json_to_sheet(datiEsportazione);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ordini Filtrati');

    const dataOggi = format(new Date(), 'dd-MM-yyyy');
    const nomeFile = `ordini_${filtroStato !== 'tutti' ? filtroStato.toLowerCase() + '_' : ''}${dataOggi}.xlsx`;
    
    XLSX.writeFile(wb, nomeFile);

    toast({
      title: '✅ Esportazione completata',
      description: `${ordiniFiltrati.length} ordini esportati in ${nomeFile}`,
    });
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
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Gestione Ordini</h1>
        <div className="flex items-center gap-2 flex-1 justify-end">
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
                {(filtroStato !== 'tutti' || ricercaCliente || filtroTaglia) && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                    {[filtroStato !== 'tutti' ? 1 : 0, ricercaCliente ? 1 : 0, filtroTaglia ? 1 : 0].reduce((a, b) => a + b, 0)}
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
                  setFiltroTaglia(null);
                }}
                className="text-destructive"
              >
                <X className="w-4 h-4 mr-2" />
                Rimuovi tutti i filtri
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => sincronizzaConFIC.mutate()} 
            disabled={sincronizzaConFIC.isPending}
            data-testid="button-sync-fic"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${sincronizzaConFIC.isPending ? 'animate-spin' : ''}`} />
            {sincronizzaConFIC.isPending ? 'Sincronizzazione...' : 'Sincronizza con FIC'}
          </Button>
          <Button variant="outline" size="sm" onClick={esportaOrdini} data-testid="button-esporta">
            <Download className="w-4 h-4 mr-2" />
            Esporta
          </Button>
        </div>
      </div>

      {/* Totali Animali */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-3">
            <div className="text-xs text-blue-700 mb-1 font-medium">Totale Ordinato</div>
            <div className="text-xl font-bold text-blue-900">{totaleOrdinato.toLocaleString('it-IT')}</div>
            <div className="text-xs text-muted-foreground">animali</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-3">
            <div className="text-xs text-green-700 mb-1 font-medium">Totale Consegnato</div>
            <div className="text-xl font-bold text-green-900">{totaleConsegnato.toLocaleString('it-IT')}</div>
            <div className="text-xs text-muted-foreground">animali ({((totaleConsegnato / totaleOrdinato) * 100).toFixed(1)}%)</div>
          </CardContent>
        </Card>
      </div>

      {/* Statistiche Ordini */}
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

      {/* Breakdown per Taglia */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Breakdown per Taglia</h3>
              {filtroTaglia && (
                <Badge variant="secondary" className="text-xs">
                  Filtro: {filtroTaglia}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-destructive" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setFiltroTaglia(null);
                    }}
                  />
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMostraBreakdown(!mostraBreakdown)}
              className="h-7 px-2"
              data-testid="button-toggle-breakdown"
            >
              {mostraBreakdown ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Nascondi
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Mostra
                </>
              )}
            </Button>
          </div>
          {mostraBreakdown && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {taglie.map(taglia => {
                const colors = getTagliaColor(taglia);
                const isSelected = filtroTaglia === taglia;
                return (
                  <div 
                    key={taglia} 
                    className={`
                      border-2 rounded-lg p-3 cursor-pointer transition-all
                      ${colors.bg} ${colors.border} ${colors.text}
                      ${isSelected ? 'ring-2 ring-primary shadow-lg scale-105' : 'hover:shadow-md hover:scale-102'}
                    `}
                    onClick={() => setFiltroTaglia(isSelected ? null : taglia)}
                    data-testid={`filter-taglia-${taglia}`}
                  >
                    <div className="text-base font-bold mb-2">{taglia}</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">Ordinato:</span>
                        <span className="font-semibold">{statsTaglia[taglia].ordinato.toLocaleString('it-IT')}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">Consegnato:</span>
                        <span className="font-semibold">{statsTaglia[taglia].consegnato.toLocaleString('it-IT')}</span>
                      </div>
                      <div className="flex justify-between text-xs pt-1 border-t border-current/30">
                        <span className="font-medium">Residuo:</span>
                        <span className="font-bold">
                          {(statsTaglia[taglia].ordinato - statsTaglia[taglia].consegnato).toLocaleString('it-IT')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabella Excel-like */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Lista Ordini</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {ordiniFiltrati.length} ordini trovati
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTutte}
              className="h-8 gap-2"
              data-testid="button-toggle-all-rows"
            >
              {righeEspanse.size === ordiniFiltrati.length ? (
                <>
                  <ChevronsUp className="w-4 h-4" />
                  Comprimi Tutto
                </>
              ) : (
                <>
                  <ChevronsDown className="w-4 h-4" />
                  Espandi Tutto
                </>
              )}
            </Button>
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
                      <Fragment key={ordine.id}>
                        <tr
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
                          <td className="p-2 border-r">
                            <Popover 
                              open={datePickerOrdineId === ordine.id}
                              onOpenChange={(open) => {
                                if (open) {
                                  openDatePicker(ordine.id, ordine.dataInizioConsegna, ordine.dataFineConsegna);
                                } else {
                                  setDatePickerOrdineId(null);
                                  setSelectedDateRange({ from: undefined, to: undefined });
                                }
                              }}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-auto p-1 hover:bg-blue-50 text-xs font-normal w-full justify-start"
                                  data-testid={`button-date-${ordine.id}`}
                                >
                                  {ordine.dataInizioConsegna ? (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Calendar className="w-3 h-3" />
                                      {formatDataConsegna(ordine.dataInizioConsegna, ordine.dataFineConsegna)}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Calendar className="w-3 h-3" />
                                      <span>Imposta date</span>
                                    </div>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <div className="p-3 border-b bg-muted/50">
                                  <p className="text-sm font-medium">Periodo di consegna</p>
                                  <p className="text-xs text-muted-foreground">
                                    Seleziona data inizio e data fine
                                  </p>
                                </div>
                                <CalendarComponent
                                  mode="range"
                                  selected={selectedDateRange}
                                  onSelect={handleDateRangeSelect}
                                  numberOfMonths={2}
                                  disabled={(date) => date < new Date(ordine.data)}
                                  className="rounded-md"
                                />
                              </PopoverContent>
                            </Popover>
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
                            {getStatoBadge(ordine.stato, ordine)}
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
                              {consegneOrdine.length === 0 ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                  data-testid={`button-delete-${ordine.id}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-muted-foreground/30 cursor-not-allowed"
                                  disabled
                                  title="Impossibile eliminare: ordine con consegne già effettuate"
                                  data-testid={`button-delete-${ordine.id}-disabled`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                        
                        {/* Riga espansa con righe ordine */}
                        {espanso && hasDettagli && (
                          <tr className="bg-blue-50/50 dark:bg-blue-950/20 border-b">
                            <td colSpan={10} className="p-0">
                              <div className="bg-blue-100/60 dark:bg-blue-900/30 px-4 py-2 border-t border-b border-blue-200 dark:border-blue-800">
                                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Righe Ordine</h4>
                              </div>
                              <table className="w-full text-xs">
                                <thead className="bg-blue-100/40 dark:bg-blue-900/20">
                                  <tr>
                                    <th className="p-2 text-left border-r border-blue-200 dark:border-blue-800 w-12">Riga</th>
                                    <th className="p-2 text-left border-r border-blue-200 dark:border-blue-800">Codice Prodotto</th>
                                    <th className="p-2 text-left border-r border-blue-200 dark:border-blue-800">Taglia</th>
                                    <th className="p-2 text-right border-r border-blue-200 dark:border-blue-800">Quantità</th>
                                    <th className="p-2 text-right border-r border-blue-200 dark:border-blue-800">Prezzo Unitario</th>
                                    <th className="p-2 text-right border-r border-blue-200 dark:border-blue-800">Importo</th>
                                    <th className="p-2 text-left">Descrizione</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-blue-50/30 dark:bg-blue-950/10">
                                  {righeOrdine.map((riga) => (
                                    <tr key={riga.id} className="border-b border-blue-200/50 dark:border-blue-800/50 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors">
                                      <td className="p-2 text-center border-r border-blue-200/50 dark:border-blue-800/50 font-medium">{riga.rigaNumero}</td>
                                      <td className="p-2 border-r border-blue-200/50 dark:border-blue-800/50 font-mono text-xs">{riga.codiceProdotto || '-'}</td>
                                      <td className="p-2 border-r border-blue-200/50 dark:border-blue-800/50">
                                        <Badge variant="outline" className="text-xs">{riga.taglia}</Badge>
                                      </td>
                                      <td className="p-2 text-right border-r border-blue-200/50 dark:border-blue-800/50 font-semibold">
                                        {riga.quantita.toLocaleString('it-IT')}
                                      </td>
                                      <td className="p-2 text-right border-r border-blue-200/50 dark:border-blue-800/50">
                                        € {riga.prezzoUnitario.toFixed(4)}
                                      </td>
                                      <td className="p-2 text-right border-r border-blue-200/50 dark:border-blue-800/50 font-medium">
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
                        
                        {/* Riga espansa con consegne */}
                        {espanso && consegneOrdine.length > 0 && (
                          <tr className="bg-green-50/50 dark:bg-green-950/20 border-b">
                            <td colSpan={10} className="p-0">
                              <div className="bg-green-100/60 dark:bg-green-900/30 px-4 py-2 border-t border-b border-green-200 dark:border-green-800">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">
                                    Consegne ({consegneOrdine.length})
                                  </h4>
                                  <div className="flex items-center gap-3 text-xs">
                                    <div className="flex items-center gap-1.5">
                                      <Badge className="bg-blue-600 text-white text-xs px-2 py-0.5">
                                        da SandNursery
                                      </Badge>
                                      <span className="text-green-900 dark:text-green-100 font-medium">
                                        {consegneOrdine.filter(c => c.appOrigine === 'delta_futuro').length}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Badge className="bg-orange-600 text-white text-xs px-2 py-0.5">
                                        da Flupsy
                                      </Badge>
                                      <span className="text-green-900 dark:text-green-100 font-medium">
                                        {consegneOrdine.filter(c => c.appOrigine === 'app_esterna').length}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <table className="w-full text-xs">
                                <thead className="bg-green-100/40 dark:bg-green-900/20">
                                  <tr>
                                    <th className="p-2 text-left border-r border-green-200 dark:border-green-800">Data Consegna</th>
                                    <th className="p-2 text-right border-r border-green-200 dark:border-green-800">Quantità Consegnata</th>
                                    <th className="p-2 text-left border-r border-green-200 dark:border-green-800">Origine</th>
                                    <th className="p-2 text-left border-r border-green-200 dark:border-green-800">Note</th>
                                    <th className="p-2 text-left">Data Creazione</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-green-50/30 dark:bg-green-950/10">
                                  {consegneOrdine.map((consegna) => (
                                    <tr key={consegna.id} className="border-b border-green-200/50 dark:border-green-800/50 hover:bg-green-100/50 dark:hover:bg-green-900/30 transition-colors">
                                      <td className="p-2 border-r border-green-200/50 dark:border-green-800/50">
                                        {consegna.dataConsegna ? new Date(consegna.dataConsegna).toLocaleDateString('it-IT') : '-'}
                                      </td>
                                      <td className="p-2 text-right border-r border-green-200/50 dark:border-green-800/50 font-semibold">
                                        {consegna.quantitaConsegnata.toLocaleString('it-IT')}
                                      </td>
                                      <td className="p-2 border-r border-green-200/50 dark:border-green-800/50">
                                        {consegna.appOrigine === 'delta_futuro' ? (
                                          <Badge className="bg-blue-600 text-white hover:bg-blue-700 text-xs px-2 py-0.5">
                                            da SandNursery
                                          </Badge>
                                        ) : (
                                          <Badge className="bg-orange-600 text-white hover:bg-orange-700 text-xs px-2 py-0.5">
                                            da Flupsy
                                          </Badge>
                                        )}
                                      </td>
                                      <td className="p-2 border-r border-green-200/50 dark:border-green-800/50 text-xs text-muted-foreground max-w-xs truncate">
                                        {consegna.note || '-'}
                                      </td>
                                      <td className="p-2 text-xs text-muted-foreground">
                                        {consegna.createdAt ? new Date(consegna.createdAt).toLocaleDateString('it-IT') : '-'}
                                      </td>
                                    </tr>
                                  ))}
                                  <tr className="bg-green-100/70 dark:bg-green-900/40 font-semibold">
                                    <td className="p-2 text-left border-r border-green-200 dark:border-green-800">
                                      Totale Consegnato
                                    </td>
                                    <td className="p-2 text-right border-r border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
                                      {consegneOrdine.reduce((sum, c) => sum + c.quantitaConsegnata, 0).toLocaleString('it-IT')}
                                    </td>
                                    <td colSpan={3} className="p-2"></td>
                                  </tr>
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
                      </Fragment>
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
