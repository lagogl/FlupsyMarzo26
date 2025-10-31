import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
  Database,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

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
}

interface Consegna {
  id: number;
  ordineId: number;
  dataConsegna: string;
  quantita: number;
  note: string | null;
  appOrigine: string;
}

export default function OrdiniCondivisi() {
  const { toast } = useToast();
  const [ricercaCliente, setRicercaCliente] = useState('');
  const [filtroStato, setFiltroStato] = useState<string>('tutti');
  const [selezionati, setSelezionati] = useState<Set<number>>(new Set());
  const [righeEspanse, setRigheEspanse] = useState<Set<number>>(new Set());
  const [dialogConsegnaAperto, setDialogConsegnaAperto] = useState(false);
  const [ordineSelezionato, setOrdineSelezionato] = useState<OrdineCondiviso | null>(null);
  
  // Form consegna
  const [dataConsegna, setDataConsegna] = useState(new Date().toISOString().split('T')[0]);
  const [quantitaConsegna, setQuantitaConsegna] = useState('');
  const [noteConsegna, setNoteConsegna] = useState('');

  // Query ordini
  const { data: ordiniResponse, isLoading: loadingOrdini } = useQuery<{ success: boolean; ordini: OrdineCondiviso[]; count: number }>({
    queryKey: ['/api/ordini-condivisi'],
    enabled: true
  });

  // Query consegne per ordine
  const { data: consegneResponse } = useQuery<{ success: boolean; consegne: Consegna[]; count: number }>({
    queryKey: ['/api/ordini-condivisi/consegne'],
    enabled: true
  });

  const ordini = ordiniResponse?.ordini || [];
  const consegne = consegneResponse?.consegne || [];

  // Mutation crea consegna
  const creazioneMutation = useMutation({
    mutationFn: async (dati: any) => {
      return apiRequest('/api/ordini-condivisi/consegne', 'POST', dati);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ordini-condivisi'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ordini-condivisi/consegne'] });
      toast({
        title: '✅ Consegna registrata',
        description: 'La consegna è stata registrata con successo',
      });
      chiudiDialogConsegna();
    },
    onError: (error: any) => {
      toast({
        title: '❌ Errore',
        description: error.message || 'Impossibile registrare la consegna',
        variant: 'destructive',
      });
    },
  });

  // Filtra ordini
  const ordiniFiltrati = ordini.filter((ord) => {
    // Filtro ricerca cliente
    if (ricercaCliente && !ord.clienteNome?.toLowerCase().includes(ricercaCliente.toLowerCase())) {
      return false;
    }
    // Filtro stato
    if (filtroStato !== 'tutti' && ord.statoCalcolato !== filtroStato) {
      return false;
    }
    return true;
  });

  // Calcola statistiche
  const stats = {
    tutti: ordini.length,
    aperti: ordini.filter(o => o.statoCalcolato === 'Aperto').length,
    parziali: ordini.filter(o => o.statoCalcolato === 'Parziale').length,
    completati: ordini.filter(o => o.statoCalcolato === 'Completato').length,
    annullati: 0
  };

  const toggleSelezione = (id: number) => {
    const nuoviSelezionati = new Set(selezionati);
    if (nuoviSelezionati.has(id)) {
      nuoviSelezionati.delete(id);
    } else {
      nuoviSelezionati.add(id);
    }
    setSelezionati(nuoviSelezionati);
  };

  const toggleEspansione = (id: number) => {
    const nuoveEspanse = new Set(righeEspanse);
    if (nuoveEspanse.has(id)) {
      nuoveEspanse.delete(id);
    } else {
      nuoveEspanse.add(id);
    }
    setRigheEspanse(nuoveEspanse);
  };

  const apriDialogConsegna = (ordine: OrdineCondiviso) => {
    setOrdineSelezionato(ordine);
    setDataConsegna(new Date().toISOString().split('T')[0]);
    setQuantitaConsegna('');
    setNoteConsegna('');
    setDialogConsegnaAperto(true);
  };

  const chiudiDialogConsegna = () => {
    setDialogConsegnaAperto(false);
    setOrdineSelezionato(null);
    setQuantitaConsegna('');
    setNoteConsegna('');
  };

  const salvaConsegna = () => {
    if (!ordineSelezionato) return;
    
    const quantita = parseInt(quantitaConsegna);
    if (isNaN(quantita) || quantita <= 0) {
      toast({
        title: '❌ Errore',
        description: 'Inserisci una quantità valida',
        variant: 'destructive',
      });
      return;
    }

    if (quantita > ordineSelezionato.quantitaResidua) {
      toast({
        title: '❌ Errore',
        description: `La quantità supera il residuo disponibile (${ordineSelezionato.quantitaResidua.toLocaleString('it-IT')} animali)`,
        variant: 'destructive',
      });
      return;
    }

    creazioneMutation.mutate({
      ordineId: ordineSelezionato.id,
      dataConsegna,
      quantita,
      note: noteConsegna || null,
    });
  };

  const getStatoBadge = (stato: string) => {
    switch (stato) {
      case 'Completato':
        return (
          <Badge className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700">
            Completato
          </Badge>
        );
      case 'Aperto':
        return (
          <Badge className="bg-gray-800 text-white hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-800">
            Aperto
          </Badge>
        );
      case 'Parziale':
        return (
          <Badge className="bg-gray-800 text-white hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-800">
            In Lavorazione<br/>(Parziale)
          </Badge>
        );
      default:
        return <Badge variant="outline">{stato}</Badge>;
    }
  };

  const getSyncBadge = (ordine: OrdineCondiviso) => {
    if (ordine.syncStatus === 'errore') {
      return (
        <div className="flex items-center gap-1">
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Errore
          </Badge>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      );
    }
    if (ordine.fattureInCloudId) {
      return (
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-xs">Sincronizzato</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Database className="w-4 h-4" />
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
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestione Ordini</h1>
        <div className="flex items-center gap-3">
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
      <div className="grid grid-cols-5 gap-4">
        <Card 
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setFiltroStato('tutti')}
        >
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Tutti</div>
            <div className="text-3xl font-bold">{stats.tutti}</div>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setFiltroStato('Aperto')}
        >
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Aperti</div>
            <div className="text-3xl font-bold">{stats.aperti}</div>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setFiltroStato('Parziale')}
        >
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">In Lavorazione</div>
            <div className="text-3xl font-bold">{stats.parziali}</div>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setFiltroStato('Completato')}
        >
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Completati</div>
            <div className="text-3xl font-bold">{stats.completati}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-accent transition-colors opacity-50">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Annullati</div>
            <div className="text-3xl font-bold">{stats.annullati}</div>
          </CardContent>
        </Card>
      </div>

      {/* Ricerca e filtri */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Cerca cliente..."
          value={ricercaCliente}
          onChange={(e) => setRicercaCliente(e.target.value)}
          className="max-w-xs"
          data-testid="input-ricerca-cliente"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" data-testid="button-filtri">
              <Filter className="w-4 h-4 mr-2" />
              Filtri
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setFiltroStato('tutti')}>
              Tutti gli ordini
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFiltroStato('Aperto')}>
              Solo Aperti
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFiltroStato('Parziale')}>
              Solo In Lavorazione
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFiltroStato('Completato')}>
              Solo Completati
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Lista ordini */}
      <Card>
        <CardContent className="p-0">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Lista Ordini</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {ordiniFiltrati.length} ordini trovati
            </p>
          </div>

          {ordiniFiltrati.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nessun ordine trovato
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Data Ordine</TableHead>
                  <TableHead>Data Consegna</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Quantità</TableHead>
                  <TableHead>Taglia</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Sync FIC</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordiniFiltrati.map((ordine) => {
                  const espanso = righeEspanse.has(ordine.id);
                  const consegneOrdine = getConsegnePerOrdine(ordine.id);
                  const hasDettagli = consegneOrdine.length > 0;

                  return (
                    <>
                      <TableRow 
                        key={ordine.id} 
                        className={espanso ? 'border-b-0' : ''}
                        data-testid={`row-ordine-${ordine.id}`}
                      >
                        <TableCell>
                          {hasDettagli && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => toggleEspansione(ordine.id)}
                              data-testid={`button-espandi-${ordine.id}`}
                            >
                              {espanso ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={selezionati.has(ordine.id)}
                            onCheckedChange={() => toggleSelezione(ordine.id)}
                            data-testid={`checkbox-ordine-${ordine.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          {format(new Date(ordine.data), 'dd/MM/yyyy', { locale: it })}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            {ordine.dataInizioConsegna && <Calendar className="w-3 h-3" />}
                            {formatDataConsegna(ordine.dataInizioConsegna, ordine.dataFineConsegna)}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={ordine.clienteNome}>
                          {ordine.clienteNome || '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {ordine.quantitaTotale ? ordine.quantitaTotale.toLocaleString('it-IT') : '0'}
                        </TableCell>
                        <TableCell>{ordine.tagliaRichiesta || '-'}</TableCell>
                        <TableCell>{getStatoBadge(ordine.statoCalcolato)}</TableCell>
                        <TableCell>{getSyncBadge(ordine)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => apriDialogConsegna(ordine)}
                              data-testid={`button-edit-${ordine.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              data-testid={`button-delete-${ordine.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Riga espansa con dettagli consegne */}
                      {espanso && hasDettagli && (
                        <TableRow key={`${ordine.id}-dettagli`} className="bg-muted/30">
                          <TableCell colSpan={10} className="py-4">
                            <div className="text-center text-sm text-muted-foreground mb-3">
                              Dettagli consegne per ordine {ordine.numero || `#${ordine.id}`}
                            </div>
                            <div className="space-y-2 max-w-4xl mx-auto">
                              {consegneOrdine.map((consegna) => (
                                <div
                                  key={consegna.id}
                                  className="flex items-center justify-between bg-background p-3 rounded-md border"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-muted-foreground" />
                                      <span className="font-medium">
                                        {format(new Date(consegna.dataConsegna), 'dd/MM/yyyy', { locale: it })}
                                      </span>
                                    </div>
                                    <div className="text-sm">
                                      Quantità: <span className="font-semibold">{consegna.quantita.toLocaleString('it-IT')}</span>
                                    </div>
                                    <Badge variant={consegna.appOrigine === 'delta_futuro' ? 'default' : 'secondary'}>
                                      {consegna.appOrigine === 'delta_futuro' ? 'Delta Futuro' : 'App Esterna'}
                                    </Badge>
                                  </div>
                                  {consegna.note && (
                                    <div className="text-sm text-muted-foreground max-w-xs truncate">
                                      {consegna.note}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog consegna */}
      <Dialog open={dialogConsegnaAperto} onOpenChange={setDialogConsegnaAperto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registra Consegna Parziale</DialogTitle>
            <DialogDescription>
              Ordine {ordineSelezionato?.numero || `#${ordineSelezionato?.id}`} - Cliente: {ordineSelezionato?.clienteNome}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Info ordine */}
            <div className="bg-muted p-3 rounded-md space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taglia richiesta:</span>
                <span className="font-medium">{ordineSelezionato?.tagliaRichiesta || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Quantità totale:</span>
                <span className="font-medium">{ordineSelezionato?.quantitaTotale.toLocaleString('it-IT')} animali</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Già consegnato:</span>
                <span className="font-medium">{ordineSelezionato?.quantitaConsegnata.toLocaleString('it-IT')} animali</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span>Residuo disponibile:</span>
                <span className="text-primary">{ordineSelezionato?.quantitaResidua.toLocaleString('it-IT')} animali</span>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-2">
              <Label htmlFor="data-consegna">Data consegna</Label>
              <Input
                id="data-consegna"
                type="date"
                value={dataConsegna}
                onChange={(e) => setDataConsegna(e.target.value)}
                data-testid="input-data-consegna"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantita-consegna">Quantità consegnata (animali)</Label>
              <Input
                id="quantita-consegna"
                type="number"
                min="1"
                max={ordineSelezionato?.quantitaResidua || 0}
                value={quantitaConsegna}
                onChange={(e) => setQuantitaConsegna(e.target.value)}
                placeholder="Es: 30000"
                data-testid="input-quantita-consegna"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note-consegna">Note (opzionale)</Label>
              <Textarea
                id="note-consegna"
                value={noteConsegna}
                onChange={(e) => setNoteConsegna(e.target.value)}
                placeholder="Es: Prima consegna di tre"
                rows={3}
                data-testid="textarea-note-consegna"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={chiudiDialogConsegna} data-testid="button-annulla-consegna">
              Annulla
            </Button>
            <Button 
              onClick={salvaConsegna} 
              disabled={creazioneMutation.isPending}
              data-testid="button-salva-consegna"
            >
              {creazioneMutation.isPending ? 'Salvataggio...' : 'Salva Consegna'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
