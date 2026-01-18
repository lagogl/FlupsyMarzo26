import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  SearchIcon, 
  RefreshCwIcon, 
  InfoIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  XCircle,
  Unlink
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface Basket {
  id: number;
  physicalNumber: number;
  flupsyId: number;
  row: string | null;
  position: number | null;
  state: string;
  currentCycleId: number | null;
  rfidUhfEpc: string | null;
  rfidUhfUserData: string | null;
  rfidUhfProgrammedAt: string | null;
}

interface Flupsy {
  id: number;
  name: string;
  location: string | null;
}

type SortField = 'physicalNumber' | 'flupsy' | 'position' | 'state' | 'rfidUhfUserData' | 'rfidUhfProgrammedAt';
type SortDirection = 'asc' | 'desc';

export default function RFIDUHFTagManager() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [flupsyFilter, setFlupsyFilter] = useState<string>('all');
  const [programmingFilter, setProgrammingFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('physicalNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const {
    data: baskets = [],
    isLoading: basketsLoading,
    refetch: refetchBaskets
  } = useQuery<Basket[]>({
    queryKey: ['/api/baskets?includeAll=true'],
  });

  const unlinkRfidMutation = useMutation({
    mutationFn: async (basketId: number) => {
      return await apiRequest(`/api/baskets/${basketId}/rfid-uhf`, 'DELETE');
    },
    onSuccess: async () => {
      toast({
        title: "Tag RFID scollegato",
        description: "Il tag RFID UHF è stato scollegato dalla cesta con successo.",
      });
      // Forza ricaricamento immediato della lista
      await refetchBaskets();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile scollegare il tag RFID UHF",
        variant: "destructive",
      });
    },
  });

  const {
    data: flupsys = [],
    isLoading: flupsysLoading
  } = useQuery<Flupsy[]>({
    queryKey: ['/api/flupsys'],
  });

  const getFlupsyName = (flupsyId: number): string => {
    const flupsy = flupsys.find(f => f.id === flupsyId);
    return flupsy ? flupsy.name : 'Sconosciuto';
  };

  const getBasketPosition = (basket: Basket): string => {
    if (basket.row && basket.position) {
      return `${basket.row}-${basket.position}`;
    }
    return '-';
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: it });
    } catch {
      return '-';
    }
  };

  const filteredAndSortedBaskets = useMemo(() => {
    let result = baskets.filter((basket) => {
      const matchesSearch = 
        basket.physicalNumber.toString().includes(searchTerm) ||
        (basket.rfidUhfUserData && basket.rfidUhfUserData.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (basket.rfidUhfEpc && basket.rfidUhfEpc.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (flupsyFilter !== 'all' && basket.flupsyId.toString() !== flupsyFilter) {
        return false;
      }
      
      if (programmingFilter === 'programmed' && !basket.rfidUhfEpc) {
        return false;
      }
      if (programmingFilter === 'not-programmed' && basket.rfidUhfEpc) {
        return false;
      }
      
      return matchesSearch;
    });

    result.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortField) {
        case 'physicalNumber':
          aValue = a.physicalNumber;
          bValue = b.physicalNumber;
          break;
        case 'flupsy':
          aValue = getFlupsyName(a.flupsyId);
          bValue = getFlupsyName(b.flupsyId);
          break;
        case 'position':
          aValue = getBasketPosition(a);
          bValue = getBasketPosition(b);
          break;
        case 'state':
          aValue = a.state;
          bValue = b.state;
          break;
        case 'rfidUhfUserData':
          aValue = a.rfidUhfUserData || '';
          bValue = b.rfidUhfUserData || '';
          break;
        case 'rfidUhfProgrammedAt':
          aValue = a.rfidUhfProgrammedAt || '';
          bValue = b.rfidUhfProgrammedAt || '';
          break;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [baskets, searchTerm, flupsyFilter, programmingFilter, sortField, sortDirection, flupsys]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const handleRefresh = async () => {
    await refetchBaskets();
    toast({
      title: "Lista aggiornata",
      description: "I dati sono stati ricaricati dal server.",
    });
  };

  const programmedCount = baskets.filter(b => b.rfidUhfEpc).length;
  const notProgrammedCount = baskets.filter(b => !b.rfidUhfEpc).length;

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6 text-red-600">Gestione Tag RFID UHF</h1>
      
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <InfoIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">
                Informazioni Tag RFID UHF
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                I tag RFID UHF vengono programmati esclusivamente tramite terminale C71.
                Questa pagina permette di monitorare lo stato di programmazione dei tag.
              </p>
              <p className="text-sm">
                <span className="font-medium">Bank 1 (EPC):</span> Identificativo fisico del tag |{' '}
                <span className="font-medium">Bank 3 (User):</span> Codice cesta (es. Cesta-001)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{baskets.length}</div>
            <p className="text-sm text-muted-foreground">Cestelli totali</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{programmedCount}</div>
            <p className="text-sm text-muted-foreground">Tag programmati</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-600">{notProgrammedCount}</div>
            <p className="text-sm text-muted-foreground">Da programmare</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {baskets.length > 0 ? Math.round((programmedCount / baskets.length) * 100) : 0}%
            </div>
            <p className="text-sm text-muted-foreground">Copertura</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Lista Cestelli RFID UHF</CardTitle>
          <CardDescription>
            {filteredAndSortedBaskets.length} cestelli visualizzati
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  className="pl-10"
                  placeholder="Cerca per numero, codice RFID o EPC..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-rfid"
                />
              </div>
              
              <div className="lg:w-48">
                <Select value={flupsyFilter} onValueChange={setFlupsyFilter}>
                  <SelectTrigger data-testid="select-flupsy-filter">
                    <SelectValue placeholder="Tutti i FLUPSY" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i FLUPSY</SelectItem>
                    {flupsys.map((flupsy) => (
                      <SelectItem key={flupsy.id} value={flupsy.id.toString()}>
                        {flupsy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="lg:w-48">
                <Select value={programmingFilter} onValueChange={setProgrammingFilter}>
                  <SelectTrigger data-testid="select-programming-filter">
                    <SelectValue placeholder="Stato programmazione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti</SelectItem>
                    <SelectItem value="programmed">Programmati</SelectItem>
                    <SelectItem value="not-programmed">Non programmati</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={basketsLoading}
                data-testid="button-refresh-rfid"
              >
                <RefreshCwIcon className={`h-4 w-4 mr-2 ${basketsLoading ? 'animate-spin' : ''}`} />
                Aggiorna
              </Button>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('physicalNumber')}
                    >
                      <div className="flex items-center">
                        N. Cesta
                        {getSortIcon('physicalNumber')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('flupsy')}
                    >
                      <div className="flex items-center">
                        Flupsy
                        {getSortIcon('flupsy')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('position')}
                    >
                      <div className="flex items-center">
                        Posizione
                        {getSortIcon('position')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('state')}
                    >
                      <div className="flex items-center">
                        Stato
                        {getSortIcon('state')}
                      </div>
                    </TableHead>
                    <TableHead>EPC (Bank 1)</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('rfidUhfProgrammedAt')}
                    >
                      <div className="flex items-center">
                        Data Programmazione
                        {getSortIcon('rfidUhfProgrammedAt')}
                      </div>
                    </TableHead>
                    <TableHead>Tag</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {basketsLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <RefreshCwIcon className="h-6 w-6 animate-spin mx-auto mb-2" />
                        Caricamento...
                      </TableCell>
                    </TableRow>
                  ) : filteredAndSortedBaskets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nessun cestello trovato con i filtri selezionati
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedBaskets.map((basket) => (
                      <TableRow key={basket.id} data-testid={`row-basket-rfid-${basket.id}`}>
                        <TableCell className="font-medium">#{basket.physicalNumber}</TableCell>
                        <TableCell>{getFlupsyName(basket.flupsyId)}</TableCell>
                        <TableCell>{getBasketPosition(basket)}</TableCell>
                        <TableCell>
                          <Badge variant={basket.state === 'in_use' ? 'default' : 'secondary'}>
                            {basket.state === 'in_use' ? 'In uso' : 'Disponibile'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground max-w-[200px] truncate">
                          {basket.rfidUhfEpc || '-'}
                        </TableCell>
                        <TableCell>{formatDate(basket.rfidUhfProgrammedAt)}</TableCell>
                        <TableCell>
                          {basket.rfidUhfEpc ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-orange-400" />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {basket.rfidUhfEpc && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  disabled={unlinkRfidMutation.isPending}
                                >
                                  <Unlink className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Scollega Tag RFID UHF</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Vuoi scollegare il tag RFID UHF dalla cesta #{basket.physicalNumber}?
                                    <br /><br />
                                    <strong>EPC:</strong> {basket.rfidUhfEpc}
                                    <br />
                                    <strong>Codice:</strong> {basket.rfidUhfUserData || '-'}
                                    <br /><br />
                                    Dopo lo scollegamento, la cesta potrà essere associata a un nuovo tag.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => unlinkRfidMutation.mutate(basket.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Scollega
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
