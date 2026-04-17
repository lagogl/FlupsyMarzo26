import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle2, Clock, Ruler, ArrowRight, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { queryClient } from '@/lib/queryClient';

interface RealignmentBasket {
  basketId: number;
  physicalNumber: number;
  flupsyId: number;
  flupsyName: string;
  cycleId: number;
  cycleCode: string | null;
  cycleStart: string;
  lastOpDate: string | null;
  lastOpType: string | null;
  lastAnimalCount: number | null;
  lastApk: number | null;
  lastTotalWeight: number | null;
  v2OpCount: number;
  v1OpCount: number;
  totalOpCount: number;
  lastMisuraDate: string | null;
  daysSinceMisura: number | null;
  isAligned: boolean;
  priority: 'alta' | 'media' | 'bassa';
}

interface Response {
  baskets: RealignmentBasket[];
  summary: {
    total: number;
    aligned: number;
    toRealign: number;
    highPriority: number;
  };
}

const priorityColors: Record<string, string> = {
  alta: 'bg-red-100 text-red-800 border-red-300',
  media: 'bg-amber-100 text-amber-800 border-amber-300',
  bassa: 'bg-blue-100 text-blue-800 border-blue-300',
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function CesteDaRiallineare() {
  const { data, isLoading, refetch, isFetching } = useQuery<Response>({
    queryKey: ['/api/realignment-status'],
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/realignment-status'] });
    refetch();
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ruler className="h-6 w-6 text-blue-600" />
            Ceste da Riallineare
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cicli attivi che non hanno ancora ricevuto una misura con la nuova formula (senza cascata mortalità).
            Una nuova Misura riallinea automaticamente i conteggi.
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Aggiorna
        </Button>
      </div>

      {/* Riepilogo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Cicli attivi</div>
            <div className="text-2xl font-bold">{data?.summary.total ?? '—'}</div>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="text-xs text-red-700 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Da riallineare
            </div>
            <div className="text-2xl font-bold text-red-700">{data?.summary.toRealign ?? '—'}</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardContent className="p-4">
            <div className="text-xs text-amber-700 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Priorità alta
            </div>
            <div className="text-2xl font-bold text-amber-700">{data?.summary.highPriority ?? '—'}</div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="text-xs text-green-700 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Già allineate (v2)
            </div>
            <div className="text-2xl font-bold text-green-700">{data?.summary.aligned ?? '—'}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Elenco</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}
          {!isLoading && data && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Priorità</TableHead>
                    <TableHead>Cesta</TableHead>
                    <TableHead>FLUPSY</TableHead>
                    <TableHead>Ciclo</TableHead>
                    <TableHead>Ultima Misura</TableHead>
                    <TableHead className="text-right">Vivi attuali</TableHead>
                    <TableHead className="text-right">apk</TableHead>
                    <TableHead className="text-right">Op. v2 / v1</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.baskets.map((b) => (
                    <TableRow key={b.basketId} className={b.isAligned ? 'opacity-60' : ''}>
                      <TableCell>
                        {b.isAligned ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                            ok
                          </Badge>
                        ) : (
                          <Badge variant="outline" className={priorityColors[b.priority]}>
                            {b.priority}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">#{b.physicalNumber}</TableCell>
                      <TableCell className="text-sm">{b.flupsyName}</TableCell>
                      <TableCell className="text-xs font-mono">{b.cycleCode || `#${b.cycleId}`}</TableCell>
                      <TableCell className="text-sm">
                        {formatDate(b.lastMisuraDate)}
                        {b.daysSinceMisura != null && (
                          <div className="text-xs text-muted-foreground">{b.daysSinceMisura} giorni fa</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {b.lastAnimalCount != null ? b.lastAnimalCount.toLocaleString('it-IT') : '—'}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {b.lastApk != null ? b.lastApk.toLocaleString('it-IT') : '—'}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        <span className="text-green-700 font-semibold">{b.v2OpCount}</span>
                        {' / '}
                        <span className="text-amber-700">{b.v1OpCount}</span>
                      </TableCell>
                      <TableCell>
                        {b.isAligned ? (
                          <span className="text-xs text-green-700 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Allineata
                          </span>
                        ) : (
                          <span className="text-xs text-amber-700">Solo v1</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/baskets/${b.basketId}`}>
                          <Button size="sm" variant="ghost">
                            Apri <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.baskets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        Nessun ciclo attivo trovato.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground border-l-4 border-blue-300 bg-blue-50 p-3 rounded">
        <strong>Come funziona:</strong> il sistema marca le nuove operazioni con <code>formula_version=2</code>.
        Quando registri una nuova Misura su una cesta "da riallineare", il conteggio vivi e la taglia vengono ricalcolati
        direttamente dal sample (peso campione + animali vivi/morti), senza ereditare distorsioni dalla cascata mortalità precedente.
      </div>
    </div>
  );
}
