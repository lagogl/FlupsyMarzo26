import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useRoute, useSearch, Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  GitMerge, ArrowLeft, Calendar, Hash, Activity, Heart,
  AlertCircle, Layers, Package, Skull, ShoppingCart, ArrowRightLeft, Shuffle,
  Filter, X,
} from 'lucide-react';

type Reliability = 'alta' | 'media' | 'bassa';

interface CohortCompositionEntry {
  lotId: number;
  animalCount: number;
  percentage: number;
  estimatedLiveCount: number;
  estimatedExitCount: number;
  estimatedMortalityCount: number;
  survivalRate: number | null;
  mortalityRate: number | null;
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
  soldCount: number;
  transferredCount: number;
  resortedCount: number;
  exitCount: number;
  mortalityCount: number;
  mortalityRate: number | null;
  realSurvivalRate: number | null;
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

function mortalityColor(rate: number | null): string {
  if (rate == null) return 'text-gray-400';
  if (rate <= 0.15) return 'text-emerald-600';
  if (rate <= 0.4) return 'text-amber-600';
  return 'text-red-600';
}

function pct(n: number, total: number): number {
  return total > 0 ? (n / total) * 100 : 0;
}

/**
 * Barra impilata che scompone i vivi iniziali in: vivi correnti, venduti, trasferiti,
 * ri-vagliati e mortalità reale (principio "niente sparizioni").
 */
function CohortBreakdownBar({ c }: { c: CohortSurvival }) {
  const total = c.initialAnimalCount || 0;
  const segments = [
    { label: 'Vivi', value: c.currentLiveCount, cls: 'bg-emerald-500' },
    { label: 'Venduti', value: c.soldCount, cls: 'bg-blue-500' },
    { label: 'Trasferiti', value: c.transferredCount, cls: 'bg-indigo-500' },
    { label: 'Ri-vagliati', value: c.resortedCount, cls: 'bg-violet-500' },
    { label: 'Mortalità', value: c.mortalityCount, cls: 'bg-red-500' },
  ].filter((s) => s.value > 0);
  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100" data-testid="bar-cohort-breakdown">
      {segments.map((s) => (
        <div
          key={s.label}
          className={s.cls}
          style={{ width: `${pct(s.value, total)}%` }}
          title={`${s.label}: ${fmt(s.value)} (${pct(s.value, total).toFixed(1)}%)`}
        />
      ))}
    </div>
  );
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

const RELIABILITY_META: Record<Reliability, { label: string; tooltip: string; dot: string; badge: string }> = {
  alta: {
    label: 'Affidabilità alta',
    tooltip:
      'Affidabilità alta: i lotti che compongono questa coorte sono rimasti puri a lungo prima di essere mescolati ' +
      'e/o uno di essi domina nettamente la composizione. ' +
      'La suddivisione dei vivi per lotto è ben tracciata e le stime per lotto sono affidabili.',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  media: {
    label: 'Affidabilità media',
    tooltip:
      'Affidabilità media: i lotti sono stati mescolati relativamente presto oppure nessuno di essi domina ' +
      'nettamente la composizione. ' +
      'I vivi totali della coorte sono affidabili, ma la suddivisione per singolo lotto è una stima con margine di incertezza.',
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  bassa: {
    label: 'Affidabilità bassa',
    tooltip:
      'Affidabilità bassa: i lotti sono stati mescolati molto presto o la composizione è molto frammentata tra tanti lotti. ' +
      'La suddivisione per lotto è una stima approssimativa. ' +
      'Il dato totale rimane valido, ma interpretare le quote per lotto con prudenza.',
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-800 border-red-300',
  },
};

function ReliabilityBadge({ level, short = false }: { level: Reliability; short?: boolean }) {
  const meta = RELIABILITY_META[level] ?? RELIABILITY_META.media;
  return (
    <Badge variant="outline" className={`gap-1.5 font-medium ${meta.badge}`} title={meta.tooltip}>
      <span className={`inline-block h-2 w-2 rounded-full ${meta.dot}`} />
      {short ? level.charAt(0).toUpperCase() + level.slice(1) : meta.label}
    </Badge>
  );
}

function ReliabilityDot({ level }: { level: Reliability }) {
  const meta = RELIABILITY_META[level] ?? RELIABILITY_META.media;
  return (
    <span className="inline-flex items-center gap-1.5" title={meta.tooltip}>
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
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const flupsyIdParam = searchParams.get('flupsyId');
  const flupsyId = flupsyIdParam != null && flupsyIdParam !== '' ? Number(flupsyIdParam) : null;
  const flupsyName = searchParams.get('flupsyName');
  const isFiltered = flupsyId != null && Number.isFinite(flupsyId);

  const { data, isLoading, isError } = useQuery<{ success: boolean; cohorts: CohortSurvival[] }>({
    queryKey: isFiltered ? ['/api/cohorts', { flupsyId }] : ['/api/cohorts'],
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

      {isFiltered && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 rounded-lg border bg-muted/40 px-4 py-3" data-testid="banner-flupsy-filter">
          <div className="flex items-center gap-2 text-sm">
            <Filter className="h-4 w-4 text-violet-600" />
            <span>
              Coorti filtrate per il modulo{' '}
              <span className="font-semibold">{flupsyName || `#${flupsyId}`}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/coorti')}
              data-testid="button-clear-flupsy-filter"
            >
              <X className="h-4 w-4 mr-1" /> Rimuovi filtro
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/cruscotto-sopravvivenza')}
              data-testid="button-back-to-dashboard"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Torna al cruscotto
            </Button>
          </div>
        </div>
      )}

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
                      <Skull className="h-3 w-3" /> Mortalità reale
                    </div>
                    <div className={`text-2xl font-bold ${mortalityColor(c.mortalityRate)}`} data-testid={`text-mortality-${c.id}`}>
                      {fmtPct(c.mortalityRate)}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Vivi in coorte {fmtPct(c.survivalRate)}
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 justify-end">
                      <Activity className="h-3 w-3" /> {c.activeCycles} cicli attivi
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 border-t pt-2">
                  <CohortBreakdownBar c={c} />
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />Vivi {fmt(c.currentLiveCount)}</span>
                    {c.exitCount > 0 && (
                      <span className="flex items-center gap-1"><ArrowRightLeft className="h-3 w-3 text-indigo-500" />Usciti {fmt(c.exitCount)}</span>
                    )}
                    {c.mortalityCount > 0 && (
                      <span className="flex items-center gap-1"><Skull className="h-3 w-3 text-red-500" />Morti {fmt(c.mortalityCount)}</span>
                    )}
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
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Skull className="h-3 w-3" /> Mortalità reale
                  </div>
                  <div className={`text-2xl font-bold ${mortalityColor(cohort.mortalityRate)}`} data-testid="text-detail-mortality">
                    {fmtPct(cohort.mortalityRate)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{fmt(cohort.mortalityCount)} animali</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Vivi iniziali</div>
                  <div className="text-xl font-semibold">{fmt(cohort.initialAnimalCount)}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Vivi correnti</div>
                  <div className="text-xl font-semibold">{fmt(cohort.currentLiveCount)}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">in coorte {fmtPct(cohort.survivalRate)}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Cicli attivi</div>
                  <div className="text-xl font-semibold">{fmt(cohort.activeCycles)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <CohortBreakdownBar c={cohort} />
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
                  <div className="rounded-md bg-emerald-50 px-2 py-1.5">
                    <div className="text-[11px] text-emerald-700 flex items-center gap-1"><Heart className="h-3 w-3" />Vivi</div>
                    <div className="font-semibold">{fmt(cohort.currentLiveCount)}</div>
                  </div>
                  <div className="rounded-md bg-blue-50 px-2 py-1.5">
                    <div className="text-[11px] text-blue-700 flex items-center gap-1"><ShoppingCart className="h-3 w-3" />Venduti</div>
                    <div className="font-semibold">{fmt(cohort.soldCount)}</div>
                  </div>
                  <div className="rounded-md bg-indigo-50 px-2 py-1.5">
                    <div className="text-[11px] text-indigo-700 flex items-center gap-1"><ArrowRightLeft className="h-3 w-3" />Trasferiti</div>
                    <div className="font-semibold">{fmt(cohort.transferredCount)}</div>
                  </div>
                  <div className="rounded-md bg-violet-50 px-2 py-1.5">
                    <div className="text-[11px] text-violet-700 flex items-center gap-1"><Shuffle className="h-3 w-3" />Ri-vagliati</div>
                    <div className="font-semibold">{fmt(cohort.resortedCount)}</div>
                  </div>
                  <div className="rounded-md bg-red-50 px-2 py-1.5">
                    <div className="text-[11px] text-red-700 flex items-center gap-1"><Skull className="h-3 w-3" />Mortalità</div>
                    <div className="font-semibold">{fmt(cohort.mortalityCount)}</div>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Principio "niente sparizioni": la mortalità è ciò che resta dopo aver scontato vivi
                  correnti e uscite dichiarate (vendite, trasferimenti, ri-vagliature verso altre coorti).
                </p>
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
                        <th className="py-2 px-4 font-medium text-right">Mortalità (stima)</th>
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
                            <td className="py-2 px-4 text-right">
                              <span className={mortalityColor(entry.mortalityRate)}>
                                {fmt(entry.estimatedMortalityCount)}
                              </span>
                              <span className="ml-1 text-xs text-muted-foreground">
                                ({fmtPct(entry.mortalityRate)})
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
