import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useRoute, Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  GitMerge, ArrowLeft, Calendar, Hash, Activity, Heart,
  AlertCircle, Layers, Package,
} from 'lucide-react';

type Reliability = 'alta' | 'media' | 'bassa';

interface CohortCompositionEntry {
  lotId: number;
  animalCount: number;
  percentage: number;
  estimatedLiveCount: number;
  survivalRate: number | null;
  reliability: Reliability;
  reliabilityScore: number;
}

interface CohortSurvival {
  id: number;
  code: string;
  sourceSelectionId: number | null;
  mixDate: string;
  status: string;
  initialAnimalCount: number;
  currentLiveCount: number;
  activeCycles: number;
  survivalRate: number | null;
  reliability: Reliability;
  reliabilityScore: number;
  composition?: CohortCompositionEntry[];
}

interface Lot {
  id: number;
  supplier: string;
  supplierLotNumber: string | null;
  arrivalDate: string;
}

const fmt = (n: number | null | undefined) =>
  n != null && Number.isFinite(n) ? new Intl.NumberFormat('it-IT').format(Math.round(n)) : '—';

const fmtPct = (rate: number | null | undefined) =>
  rate != null && Number.isFinite(rate) ? `${(rate * 100).toFixed(1)}%` : '—';

const fmtDate = (d: string | null | undefined) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('it-IT'); } catch { return d; }
};

function survivalColor(rate: number | null): string {
  if (rate == null) return 'text-gray-400';
  if (rate >= 0.85) return 'text-emerald-600';
  if (rate >= 0.6) return 'text-amber-600';
  return 'text-red-600';
}

function statusBadge(status: string) {
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'attiva') {
    return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Attiva</Badge>;
  }
  if (s === 'closed' || s === 'chiusa') {
    return <Badge variant="secondary">Chiusa</Badge>;
  }
  return <Badge variant="outline">{status}</Badge>;
}

const RELIABILITY_META: Record<Reliability, { label: string; dot: string; badge: string }> = {
  alta: {
    label: 'Affidabilità alta',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  media: {
    label: 'Affidabilità media',
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  bassa: {
    label: 'Affidabilità bassa',
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-800 border-red-300',
  },
};

function ReliabilityBadge({ level, short = false }: { level: Reliability; short?: boolean }) {
  const meta = RELIABILITY_META[level] ?? RELIABILITY_META.media;
  return (
    <Badge variant="outline" className={`gap-1.5 font-medium ${meta.badge}`} title={meta.label}>
      <span className={`inline-block h-2 w-2 rounded-full ${meta.dot}`} />
      {short ? level.charAt(0).toUpperCase() + level.slice(1) : meta.label}
    </Badge>
  );
}

function ReliabilityDot({ level }: { level: Reliability }) {
  const meta = RELIABILITY_META[level] ?? RELIABILITY_META.media;
  return (
    <span className="inline-flex items-center gap-1.5" title={meta.label}>
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${meta.dot}`} />
      <span className="text-xs capitalize text-muted-foreground">{level}</span>
    </span>
  );
}

function useLotMap() {
  const { data } = useQuery<Lot[]>({ queryKey: ['/api/lots'] });
  return useMemo(() => {
    const map = new Map<number, Lot>();
    (data ?? []).forEach((l) => map.set(l.id, l));
    return map;
  }, [data]);
}

function lotLabel(lotMap: Map<number, Lot>, lotId: number): string {
  const lot = lotMap.get(lotId);
  if (!lot) return `Lotto #${lotId}`;
  const parts = [lot.supplier];
  if (lot.supplierLotNumber) parts.push(`lotto ${lot.supplierLotNumber}`);
  return `#${lotId} — ${parts.join(' · ')}`;
}

// ============ LISTA COORTI ============
function CohortsList() {
  const [, navigate] = useLocation();
  const { data, isLoading, isError } = useQuery<{ success: boolean; cohorts: CohortSurvival[] }>({
    queryKey: ['/api/cohorts'],
  });
  const cohorts = data?.cohorts ?? [];

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-violet-100">
          <GitMerge className="h-7 w-7 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Coorti di Mescolamento</h1>
          <p className="text-sm text-muted-foreground">
            Sopravvivenza misurata delle coorti create dalla vagliatura (vivi correnti ÷ vivi iniziali).
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <Card className="border-red-200">
          <CardContent className="py-8 flex items-center gap-3 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Errore nel caricamento delle coorti.
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && cohorts.length === 0 && (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center text-muted-foreground">
            <Layers className="h-10 w-10 mb-3 opacity-40" />
            <p className="font-medium">Nessuna coorte presente</p>
            <p className="text-sm">Le coorti vengono create automaticamente dalle vagliature con mescolamento di lotti.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && cohorts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cohorts.map((c) => (
            <Card
              key={c.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/coorti/${c.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Hash className="h-4 w-4 text-violet-600" />
                    {c.code}
                  </CardTitle>
                  {statusBadge(c.status)}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3" />
                  Mescolamento: {fmtDate(c.mixDate)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Heart className="h-3 w-3" /> Sopravvivenza
                    </div>
                    <div className={`text-2xl font-bold ${survivalColor(c.survivalRate)}`}>
                      {fmtPct(c.survivalRate)}
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 justify-end">
                      <Activity className="h-3 w-3" /> {c.activeCycles} cicli attivi
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm border-t pt-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Vivi iniziali</div>
                    <div className="font-semibold">{fmt(c.initialAnimalCount)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Vivi correnti</div>
                    <div className="font-semibold">{fmt(c.currentLiveCount)}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-xs text-muted-foreground">Affidabilità dato</span>
                  <ReliabilityBadge level={c.reliability} short />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ DETTAGLIO COORTE ============
function CohortDetail({ id }: { id: number }) {
  const lotMap = useLotMap();
  const { data, isLoading, isError } = useQuery<{ success: boolean; cohort: CohortSurvival }>({
    queryKey: [`/api/cohorts/${id}`],
  });
  const cohort = data?.cohort;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Link href="/coorti">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Tutte le coorti
        </Button>
      </Link>

      {isLoading && <Skeleton className="h-64 w-full rounded-xl" />}

      {!isLoading && (isError || !cohort) && (
        <Card className="border-red-200">
          <CardContent className="py-8 flex items-center gap-3 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Coorte non trovata o errore nel caricamento.
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && cohort && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <CardTitle className="text-xl flex items-center gap-2">
                  <GitMerge className="h-5 w-5 text-violet-600" />
                  {cohort.code}
                </CardTitle>
                {statusBadge(cohort.status)}
              </div>
              <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Mescolamento: {fmtDate(cohort.mixDate)}
                </span>
                <ReliabilityBadge level={cohort.reliability} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Sopravvivenza</div>
                  <div className={`text-2xl font-bold ${survivalColor(cohort.survivalRate)}`}>
                    {fmtPct(cohort.survivalRate)}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Vivi iniziali</div>
                  <div className="text-xl font-semibold">{fmt(cohort.initialAnimalCount)}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Vivi correnti</div>
                  <div className="text-xl font-semibold">{fmt(cohort.currentLiveCount)}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Cicli attivi</div>
                  <div className="text-xl font-semibold">{fmt(cohort.activeCycles)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-violet-600" />
                Stima per lotto e affidabilità
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Vivi correnti stimati per lotto = quota congelata al mescolamento × sopravvivenza
                misurata della coorte. Il semaforo indica quanto è solido il numero (verde = lotto
                rimasto a lungo puro / dominante; rosso = mescolato presto / quota piccola).
              </p>
            </CardHeader>
            <CardContent>
              {(cohort.composition ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nessuna composizione registrata per questa coorte.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 pr-4 font-medium">Lotto</th>
                        <th className="py-2 px-4 font-medium text-right">Vivi al mix</th>
                        <th className="py-2 px-4 font-medium text-right">Quota</th>
                        <th className="py-2 px-4 font-medium text-right">Vivi correnti (stima)</th>
                        <th className="py-2 pl-4 font-medium text-center">Affidabilità</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(cohort.composition ?? [])
                        .slice()
                        .sort((a, b) => b.animalCount - a.animalCount)
                        .map((entry) => (
                          <tr key={entry.lotId} className="border-b last:border-0">
                            <td className="py-2 pr-4">
                              <Link
                                href={`/report-lotto/${entry.lotId}`}
                                className="text-violet-700 hover:underline"
                              >
                                {lotLabel(lotMap, entry.lotId)}
                              </Link>
                            </td>
                            <td className="py-2 px-4 text-right">{fmt(entry.animalCount)}</td>
                            <td className="py-2 px-4 text-right">{fmtPct(entry.percentage)}</td>
                            <td className="py-2 px-4 text-right font-semibold">
                              {fmt(entry.estimatedLiveCount)}
                              <span className="ml-1 text-xs font-normal text-muted-foreground">
                                ({fmtPct(entry.survivalRate)})
                              </span>
                            </td>
                            <td className="py-2 pl-4">
                              <div className="flex justify-center">
                                <ReliabilityDot level={entry.reliability} />
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function Coorti() {
  const [matchDetail, params] = useRoute('/coorti/:id');
  if (matchDetail && params?.id) {
    return <CohortDetail id={Number(params.id)} />;
  }
  return <CohortsList />;
}
