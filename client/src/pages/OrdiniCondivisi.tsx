import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Package, PackageCheck, PackageOpen, TruckIcon, Calendar, AlertCircle } from 'lucide-react';
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
  totale: string;
  valuta: string;
  note: string | null;
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

export default function OrdiniCondivisi() {
  const { toast } = useToast();
  const [filtroStato, setFiltroStato] = useState<string>('tutti');
  const [dialogConsegnaAperto, setDialogConsegnaAperto] = useState(false);
  const [ordineSelezionato, setOrdineSelezionato] = useState<OrdineCondiviso | null>(null);
  
  // Form consegna
  const [dataConsegna, setDataConsegna] = useState(new Date().toISOString().split('T')[0]);
  const [quantitaConsegna, setQuantitaConsegna] = useState('');
  const [noteConsegna, setNoteConsegna] = useState('');

  // Query ordini
  const { data: ordiniResponse, isLoading: loadingOrdini } = useQuery<{ success: boolean; ordini: OrdineCondiviso[]; count: number }>({
    queryKey: ['/api/ordini-condivisi', filtroStato],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filtroStato !== 'tutti') {
        params.append('stato', filtroStato);
      }
      const url = `/api/ordini-condivisi${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Errore nel caricamento ordini');
      return response.json();
    },
    enabled: true
  });

  // Query consegne
  const { data: consegneResponse } = useQuery<{ success: boolean; consegne: Consegna[]; count: number }>({
    queryKey: ['/api/ordini-condivisi/consegne'],
    enabled: true
  });
  
  const ordini = ordiniResponse?.ordini;
  const consegne = consegneResponse?.consegne;

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

  const ordiniFiltrati = ordini?.filter((ord) => {
    if (filtroStato === 'tutti') return true;
    return ord.statoCalcolato === filtroStato;
  }) || [];

  const getStatoBadge = (stato: string) => {
    switch (stato) {
      case 'Aperto':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          <PackageOpen className="w-3 h-3 mr-1" />
          Aperto
        </Badge>;
      case 'Parziale':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
          <Package className="w-3 h-3 mr-1" />
          Parziale
        </Badge>;
      case 'Completato':
        return <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <PackageCheck className="w-3 h-3 mr-1" />
          Completato
        </Badge>;
      default:
        return <Badge variant="outline">{stato}</Badge>;
    }
  };

  if (loadingOrdini) {
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Caricamento ordini condivisi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ordini Condivisi</h1>
          <p className="text-muted-foreground mt-1">
            Gestisci consegne parziali sincronizzate tra applicazioni
          </p>
        </div>
      </div>

      {/* Warning se database non disponibile */}
      {!ordini && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                  Database esterno non configurato
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  Configura la variabile DATABASE_URL_ESTERNO nei Secrets per attivare il modulo ordini condivisi.
                  Consulta il file ORDINI-CONDIVISI-SETUP.md per le istruzioni.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtri */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Label htmlFor="filtro-stato">Stato ordine:</Label>
            <Select value={filtroStato} onValueChange={setFiltroStato}>
              <SelectTrigger className="w-48" data-testid="select-stato-ordini">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tutti">Tutti</SelectItem>
                <SelectItem value="Aperto">Aperto</SelectItem>
                <SelectItem value="Parziale">Parziale</SelectItem>
                <SelectItem value="Completato">Completato</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabella ordini */}
      <Card>
        <CardHeader>
          <CardTitle>Ordini ({ordiniFiltrati.length})</CardTitle>
          <CardDescription>
            Ordini sincronizzati da Fatture in Cloud con calcolo residuo automatico
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ordiniFiltrati.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessun ordine trovato
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Taglia</TableHead>
                  <TableHead className="text-right">Totale</TableHead>
                  <TableHead className="text-right">Consegnato</TableHead>
                  <TableHead className="text-right">Residuo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordiniFiltrati.map((ordine) => (
                  <TableRow key={ordine.id} data-testid={`row-ordine-${ordine.id}`}>
                    <TableCell className="font-mono">{ordine.numero || `#${ordine.id}`}</TableCell>
                    <TableCell>
                      {format(new Date(ordine.data), 'dd/MM/yyyy', { locale: it })}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={ordine.clienteNome}>
                      {ordine.clienteNome}
                    </TableCell>
                    <TableCell>{ordine.tagliaRichiesta || '-'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {ordine.quantitaTotale.toLocaleString('it-IT')}
                    </TableCell>
                    <TableCell className="text-right">
                      {ordine.quantitaConsegnata.toLocaleString('it-IT')}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {ordine.quantitaResidua.toLocaleString('it-IT')}
                    </TableCell>
                    <TableCell>{getStatoBadge(ordine.statoCalcolato)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => apriDialogConsegna(ordine)}
                        disabled={ordine.quantitaResidua === 0}
                        data-testid={`button-consegna-${ordine.id}`}
                      >
                        <TruckIcon className="w-4 h-4 mr-1" />
                        Consegna
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Storico consegne */}
      {consegne && consegne.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Storico Consegne</CardTitle>
            <CardDescription>
              Ultime consegne registrate da entrambe le applicazioni
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Ordine</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Quantità</TableHead>
                  <TableHead>Origine</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consegne.slice(0, 20).map((consegna) => (
                  <TableRow key={consegna.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {format(new Date(consegna.dataConsegna), 'dd/MM/yyyy', { locale: it })}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {consegna.ordineNumero || `#${consegna.ordineId}`}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={consegna.clienteNome}>
                      {consegna.clienteNome}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {consegna.quantita.toLocaleString('it-IT')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={consegna.appOrigine === 'delta_futuro' ? 'default' : 'secondary'}>
                        {consegna.appOrigine === 'delta_futuro' ? 'Delta Futuro' : 'App Esterna'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={consegna.note || ''}>
                      {consegna.note || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
