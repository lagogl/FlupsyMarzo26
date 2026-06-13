import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity, AlertCircle, Waves, Boxes, Container, Gauge, TrendingUp, Layers, ShieldCheck, HelpCircle, ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend,
} from 'recharts';

type ModuleType = 'flupsy' | 'raceway' | 'bins';
type Certainty = 'certo' | 'stimato';

interface ModuleSurvival {
  flupsyId: number;
  name: string;
  moduleType: ModuleType;
  currentLive: number;
  weightedSurvival: number | null;
  certoFraction: number;
  certainty: Certainty;
  activeCohorts: number;
}

interface TypeSurvival {
  moduleType: ModuleType;
  currentLive: number;
  weightedSurvival: number | null;
  certoFraction: number;
  certainty: Certainty;
  modules: number;
}

interface TrendPoint {
  date: string;
  rate30: number | null;
  rate90: number | null;
}

interface PlantSurvival {
  summary: {
    currentLive: number;
    weightedSurvival: number | null;
    certoFraction: number;
    certainty: Certainty;
    activeCohorts: number;
    activeModules: number;
  };
  byType: TypeSurvival[];
  byModule: ModuleSurvival[];
  trend: TrendPoint[];
  generatedAt: string;
}

const fmt = (n: number | null | undefined) =>
  n != null && Number.isFinite(n) ? new Intl.NumberFormat('it-IT').format(Math.round(n)) : '—';

const fmtPct = (rate: number | null | undefined, digits = 1) =>
  rate != null && Number.isFinite(rate) ? `${(rate * 100).toFixed(digits)}%` : '—';

const fmtDateShort = (d: string) => {
  try {
    return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
  } catch {
    return d;
  }
};

function survivalColor(rate: number | null): string {
  if (rate == null) return 'text-gray-400';
  if (rate >= 0.85) return 'text-emerald-600';
  if (rate >= 0.6) return 'text-amber-600';
  return 'text-red-600';
}

function survivalBarColor(rate: number | null): string {
  if (rate == null) return 'bg-gray-300';
  if (rate >= 0.85) return 'bg-emerald-500';
  if (rate >= 0.6) return 'bg-amber-500';
  return 'bg-red-500';
}

const TYPE_META: Record<ModuleType, { label: string; icon: typeof Waves; tint: string; bg: string }> = {
  flupsy: { label: 'FLUPSY', icon: Waves, tint: 'text-cyan-600', bg: 'bg-cyan-100' },
  raceway: { label: 'Raceway', icon: Container, tint: 'text-amber-600', bg: 'bg-amber-100' },
  bins: { label: 'Bins', icon: Boxes, tint: 'text-violet-600', bg: 'bg-violet-100' },
};

function CertaintyBadge({ level, fraction }: { level: Certainty; fraction?: number }) {
  if (level === 'certo') {
    return (
      <Badge
        variant="outline"
        className="gap-1 font-medium bg-emerald-100 text-emerald-800 border-emerald-300"
        title="Certo: tutti i vivi sono contati all'ultima vagliatura"
      >
        <ShieldCheck className="h-3 w-3" /> Certo
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="gap-1 font-medium bg-amber-100 text-amber-800 border-amber-300"
      title={
        fraction != null
          ? `Stimato: ${fmtPct(fraction, 0)} dei vivi è contato, il resto viene dalle misure (campione)`
          : 'Stimato: numero dedotto dalle misure dopo l\'ultima vagliatura'
      }
    >
      <HelpCircle className="h-3 w-3" /> Stimato
    </Badge>
  );
}

function SurvivalBar({ rate }: { rate: number | null }) {
  const pct = rate != null && Number.isFinite(rate) ? Math.max(0, Math.min(1, rate)) * 100 : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div className={survivalBarColor(rate)} style={{ width: `${pct}%` }} />
    </div>
  );
}

const TREND_OPTIONS: { label: string; days: number }[] = [
  { label: '90 gg', days: 90 },
  { label: '6 mesi', days: 180 },
  { label: '1 anno', days: 365 },
];

function TrendChart({ trend, days }: { trend: TrendPoint[]; days: number }) {
  const data = useMemo(
    () =>
      trend.map((p) => ({
        date: fmtDateShort(p.date),
        '30 giorni': p.rate30 != null ? Number((p.rate30 * 100).toFixed(1)) : null,
        '90 giorni': p.rate90 != null ? Number((p.rate90 * 100).toFixed(1)) : null,
      })),
    [trend]
  );

  const hasData = trend.some((p) => p.rate30 != null || p.rate90 != null);
  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <TrendingUp className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">Nessuna vagliatura negli ultimi {days} giorni per calcolare la tendenza.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(data.length / 8))} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} width={44} />
        <RTooltip
          formatter={(value: any) => (value == null ? '—' : `${value}%`)}
          labelStyle={{ fontWeight: 600 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="90 giorni"
          stroke="#94a3b8"
          strokeWidth={2}
          dot={false}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="30 giorni"
          stroke="#0891b2"
          strokeWidth={2.5}
          dot={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function TypeCard({ t }: { t: TypeSurvival }) {
  const meta = TYPE_META[t.moduleType] ?? TYPE_META.flupsy;
  const Icon = meta.icon;
  return (
    <Card data-testid={`card-type-${t.moduleType}`}>
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${meta.bg}`}>
              <Icon className={`h-4 w-4 ${meta.tint}`} />
            </div>
            <span className="font-semibold">{meta.label}</span>
          </div>
          <CertaintyBadge level={t.certainty} fraction={t.certoFraction} />
        </div>
        <div className="flex items-end justify-between">
          <div className={`text-3xl font-bold ${survivalColor(t.weightedSurvival)}`} data-testid={`text-type-survival-${t.moduleType}`}>
            {fmtPct(t.weightedSurvival)}
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div>{fmt(t.currentLive)} vivi</div>
            <div>{t.modules} moduli</div>
          </div>
        </div>
        <SurvivalBar rate={t.weightedSurvival} />
      </CardContent>
    </Card>
  );
}

export default function CruscottoSopravvivenza() {
  const [, navigate] = useLocation();
  const [trendDays, setTrendDays] = useState(90);
  const { data, isLoading, isError } = useQuery<{ success: boolean; plant: PlantSurvival }>({
    queryKey: ['/api/plant-survival', { days: trendDays }],
  });
  const plant = data?.plant;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-emerald-100">
          <Gauge className="h-7 w-7 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Cruscotto Sopravvivenza Impianto</h1>
          <p className="text-sm text-muted-foreground">
            Sopravvivenza ponderata sul vivo attuale, tendenza 30/90 giorni e scomposizione per tipo
            modulo e singolo modulo, con semaforo certo/stimato.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      )}

      {isError && (
        <Card className="border-red-200">
          <CardContent className="py-8 flex items-center gap-3 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Errore nel caricamento del cruscotto.
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && plant && (
        <div className="space-y-6">
          {/* NUMERO GRANDE — sopravvivenza ponderata di impianto */}
          <Card className="border-emerald-100">
            <CardContent className="pt-6">
              <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5" /> Sopravvivenza ponderata sul vivo
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className={`text-6xl font-extrabold tabular-nums ${survivalColor(plant.summary.weightedSurvival)}`}
                      data-testid="text-plant-survival"
                    >
                      {fmtPct(plant.summary.weightedSurvival)}
                    </span>
                    <CertaintyBadge level={plant.summary.certainty} fraction={plant.summary.certoFraction} />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Vivi correnti</div>
                    <div className="text-xl font-semibold" data-testid="text-plant-live">{fmt(plant.summary.currentLive)}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Coorti attive</div>
                    <div className="text-xl font-semibold">{fmt(plant.summary.activeCohorts)}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Moduli attivi</div>
                    <div className="text-xl font-semibold">{fmt(plant.summary.activeModules)}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Quota contata</div>
                    <div className="text-xl font-semibold">{fmtPct(plant.summary.certoFraction, 0)}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GRAFICO DI TENDENZA */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-cyan-600" />
                    Tendenza sopravvivenza (finestra mobile 30 / 90 giorni)
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tasso misurato alle vagliature: vivi in uscita ÷ vivi in ingresso. La verità contata
                    nel tempo, mediata sulla finestra mobile.
                  </p>
                </div>
                <div className="flex items-center rounded-lg border overflow-hidden shrink-0">
                  {TREND_OPTIONS.map((opt) => (
                    <button
                      key={opt.days}
                      onClick={() => setTrendDays(opt.days)}
                      className={`px-3 py-1 text-xs font-medium transition-colors ${
                        trendDays === opt.days
                          ? 'bg-cyan-600 text-white'
                          : 'bg-white text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TrendChart trend={plant.trend} days={trendDays} />
            </CardContent>
          </Card>

          {/* SCOMPOSIZIONE PER TIPO MODULO */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4" /> Per tipo modulo
            </h2>
            {plant.byType.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  Nessun modulo con vivi correnti.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {plant.byType.map((t) => (
                  <TypeCard key={t.moduleType} t={t} />
                ))}
              </div>
            )}
          </div>

          {/* SCOMPOSIZIONE PER SINGOLO MODULO */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Waves className="h-4 w-4 text-emerald-600" />
                Per singolo modulo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {plant.byModule.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nessun modulo con vivi correnti.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 pr-4 font-medium">Modulo</th>
                        <th className="py-2 px-4 font-medium">Tipo</th>
                        <th className="py-2 px-4 font-medium text-right">Vivi correnti</th>
                        <th className="py-2 px-4 font-medium text-right">Coorti</th>
                        <th className="py-2 px-4 font-medium">Sopravvivenza</th>
                        <th className="py-2 pl-4 font-medium text-center">Affidabilità</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plant.byModule.map((m) => {
                        const meta = TYPE_META[m.moduleType] ?? TYPE_META.flupsy;
                        const Icon = meta.icon;
                        const goToCohorts = () =>
                          navigate(
                            `/coorti?flupsyId=${m.flupsyId}&flupsyName=${encodeURIComponent(m.name)}`
                          );
                        return (
                          <tr
                            key={m.flupsyId}
                            className="border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                            data-testid={`row-module-${m.flupsyId}`}
                            role="button"
                            tabIndex={0}
                            onClick={goToCohorts}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                goToCohorts();
                              }
                            }}
                            title={`Vedi le coorti del modulo ${m.name}`}
                          >
                            <td className="py-2 pr-4 font-medium">
                              <span className="inline-flex items-center gap-1.5">
                                {m.name}
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                              </span>
                            </td>
                            <td className="py-2 px-4">
                              <span className="inline-flex items-center gap-1.5 text-xs">
                                <Icon className={`h-3.5 w-3.5 ${meta.tint}`} />
                                {meta.label}
                              </span>
                            </td>
                            <td className="py-2 px-4 text-right tabular-nums">{fmt(m.currentLive)}</td>
                            <td className="py-2 px-4 text-right tabular-nums">{fmt(m.activeCohorts)}</td>
                            <td className="py-2 px-4">
                              <div className="flex items-center gap-2 min-w-[140px]">
                                <span className={`font-semibold w-14 ${survivalColor(m.weightedSurvival)}`}>
                                  {fmtPct(m.weightedSurvival)}
                                </span>
                                <div className="flex-1">
                                  <SurvivalBar rate={m.weightedSurvival} />
                                </div>
                              </div>
                            </td>
                            <td className="py-2 pl-4">
                              <div className="flex justify-center">
                                <CertaintyBadge level={m.certainty} fraction={m.certoFraction} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-[11px] text-muted-foreground">
            La sopravvivenza è la sintesi delle coorti (Fase 3/4) pesata sul vivo attuale.
            <span className="font-medium"> Certo</span> = vivi contati all'ultima vagliatura;
            <span className="font-medium"> Stimato</span> = numero dedotto dalle misure successive.
          </p>
        </div>
      )}
    </div>
  );
}
