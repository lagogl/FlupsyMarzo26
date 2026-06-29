import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Skull, AlertCircle, TrendingDown, Boxes, Layers, HelpCircle, ChevronRight, Waves, Container,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Cell,
} from 'recharts';

interface MonthRow { mese: string; origine: number; destinazione: number; morti: number; mortalitaPct: number | null; }
interface ModuleRow { flupsyId: number; name: string; moduleType: string; origine: number; morti: number; mortalitaPct: number | null; }
interface LotRow {
  lotId: number; supplier: string | null; supplierLotNumber: string | null; arrivalDate: string | null;
  mortiWindow: number; attivati: number; mortalitaPct: number | null;
}
interface MortalityReport {
  windowDays: number;
  totals: { origine: number; destinazione: number; morti: number; mortalitaPct: number | null; mortiAllTime: number };
  perMonth: MonthRow[];
  perFlupsy: ModuleRow[];
  perLot: LotRow[];
  generatedAt: string;
}

const fmt = (n: number | null | undefined) =>
  n != null && Number.isFinite(n) ? new Intl.NumberFormat('it-IT').format(Math.round(n)) : '—';

const fmtPct = (rate: number | null | undefined, digits = 1) =>
  rate != null && Number.isFinite(rate) ? `${(rate * 100).toFixed(digits)}%` : '—';

const MONTHS_IT = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
const fmtMese = (m: string) => {
  const [y, mm] = m.split('-');
  const idx = Number(mm) - 1;
  return idx >= 0 && idx < 12 ? `${MONTHS_IT[idx]} ${y.slice(2)}` : m;
};

function pctColor(rate: number | null): string {
  if (rate == null) return 'text-gray-400';
  if (rate <= 0.1) return 'text-emerald-600';
  if (rate <= 0.25) return 'text-amber-600';
  return 'text-red-600';
}

const TYPE_META: Record<string, { label: string; icon: typeof Waves; tint: string }> = {
  flupsy: { label: 'FLUPSY', icon: Waves, tint: 'text-cyan-600' },
  raceway: { label: 'Raceway', icon: Container, tint: 'text-amber-600' },
  bins: { label: 'Bins', icon: Boxes, tint: 'text-violet-600' },
};

const WINDOW_OPTIONS: { label: string; days: number }[] = [
  { label: '6 mesi', days: 180 },
  { label: '1 anno', days: 365 },
  { label: 'Tutto', days: 3650 },
];

function MonthChart({ data }: { data: MonthRow[] }) {
  const chartData = useMemo(
    () =>
      [...data]
        .reverse()
        .map((p) => ({ mese: fmtMese(p.mese), morti: p.morti, pct: p.mortalitaPct != null ? Number((p.mortalitaPct * 100).toFixed(1)) : 0 })),
    [data]
  );
  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <TrendingDown className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">Nessuna vagliatura nel periodo selezionato.</p>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
        <XAxis dataKey="mese" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} width={56} tickFormatter={(v) => new Intl.NumberFormat('it-IT', { notation: 'compact' }).format(v)} />
        <RTooltip
          formatter={(value: any, name: any) =>
            name === 'morti' ? [fmt(value), 'Morti'] : [`${value}%`, 'Mortalità']
          }
          labelStyle={{ fontWeight: 600 }}
        />
        <Bar dataKey="morti" radius={[4, 4, 0, 0]}>
          {chartData.map((d, i) => (
            <Cell key={i} fill={d.pct <= 10 ? '#10b981' : d.pct <= 25 ? '#f59e0b' : '#ef4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function ReportMortalita() {
  const [, navigate] = useLocation();
  const [days, setDays] = useState(365);
  const { data, isLoading, isError } = useQuery<{ success: boolean; report: MortalityReport }>({
    queryKey: ['/api/mortality-report', { days }],
  });
  const report = data?.report;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100">
            <Skull className="h-7 w-7 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Report Morti</h1>
            <p className="text-sm text-muted-foreground">
              La mortalità <span className="font-medium">contata alle vagliature</span> (animali in
              ingresso − animali in uscita), per mese, per FLUPSY e per lotto.
            </p>
          </div>
        </div>
        <div className="flex items-center rounded-lg border overflow-hidden shrink-0">
          {WINDOW_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => setDays(opt.days)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                days === opt.days ? 'bg-red-600 text-white' : 'bg-white text-muted-foreground hover:bg-muted'
              }`}
              data-testid={`button-window-${opt.days}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="mb-6 border-red-100 bg-red-50/40">
        <CardContent className="py-4 flex gap-3">
          <HelpCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-900 space-y-1">
            <p>
              <span className="font-semibold">Come si contano i morti:</span> gli animali si contano
              davvero solo durante la vagliatura. I morti di un periodo sono la differenza tra quelli
              entrati in vagliatura e quelli ripartiti vivi nelle ceste di destinazione.
            </p>
            <p>
              È la stessa verità mostrata nel <span className="font-medium">Cruscotto Sopravvivenza</span>{' '}
              e nel <span className="font-medium">Report Lotto</span>.
            </p>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-6">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      )}

      {isError && (
        <Card className="border-red-200">
          <CardContent className="py-8 flex items-center gap-3 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Errore nel caricamento del report morti.
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && report && (
        <div className="space-y-6">
          {/* CARD RIEPILOGO */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-red-100">
              <CardContent className="pt-5">
                <div className="text-xs text-muted-foreground">Morti nel periodo</div>
                <div className="text-3xl font-extrabold text-red-600 tabular-nums" data-testid="text-morti-window">
                  {fmt(report.totals.morti)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="text-xs text-muted-foreground">Mortalità media</div>
                <div className={`text-3xl font-extrabold tabular-nums ${pctColor(report.totals.mortalitaPct)}`} data-testid="text-mortalita-pct">
                  {fmtPct(report.totals.mortalitaPct)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="text-xs text-muted-foreground">Animali entrati alle vagliature</div>
                <div className="text-3xl font-extrabold text-sky-700 tabular-nums">{fmt(report.totals.origine)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="text-xs text-muted-foreground">Morti totali (storico)</div>
                <div className="text-3xl font-extrabold text-gray-700 tabular-nums">{fmt(report.totals.mortiAllTime)}</div>
              </CardContent>
            </Card>
          </div>

          {/* PER MESE */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" /> Morti per mese
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MonthChart data={report.perMonth} />
              {report.perMonth.length > 0 && (
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 pr-4 font-medium">Mese</th>
                        <th className="py-2 px-4 font-medium text-right">Entrati</th>
                        <th className="py-2 px-4 font-medium text-right">Morti</th>
                        <th className="py-2 pl-4 font-medium text-right">Mortalità</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.perMonth.map((m) => (
                        <tr key={m.mese} className="border-b last:border-0" data-testid={`row-month-${m.mese}`}>
                          <td className="py-2 pr-4 font-medium">{fmtMese(m.mese)}</td>
                          <td className="py-2 px-4 text-right tabular-nums text-sky-700">{fmt(m.origine)}</td>
                          <td className="py-2 px-4 text-right tabular-nums font-semibold text-red-600">{fmt(m.morti)}</td>
                          <td className={`py-2 pl-4 text-right tabular-nums font-semibold ${pctColor(m.mortalitaPct)}`}>{fmtPct(m.mortalitaPct)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* PER FLUPSY */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-600" /> Morti per FLUPSY
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report.perFlupsy.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nessuna vagliatura nel periodo.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 pr-4 font-medium">Modulo</th>
                        <th className="py-2 px-4 font-medium">Tipo</th>
                        <th className="py-2 px-4 font-medium text-right">Entrati</th>
                        <th className="py-2 px-4 font-medium text-right">Morti</th>
                        <th className="py-2 pl-4 font-medium text-right">Mortalità</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.perFlupsy.map((m) => {
                        const meta = TYPE_META[m.moduleType] ?? TYPE_META.flupsy;
                        const Icon = meta.icon;
                        return (
                          <tr key={m.flupsyId} className="border-b last:border-0" data-testid={`row-flupsy-${m.flupsyId}`}>
                            <td className="py-2 pr-4 font-medium">{m.name}</td>
                            <td className="py-2 px-4">
                              <span className="inline-flex items-center gap-1.5 text-xs">
                                <Icon className={`h-3.5 w-3.5 ${meta.tint}`} />
                                {meta.label}
                              </span>
                            </td>
                            <td className="py-2 px-4 text-right tabular-nums text-sky-700">{fmt(m.origine)}</td>
                            <td className="py-2 px-4 text-right tabular-nums font-semibold text-red-600">{fmt(m.morti)}</td>
                            <td className={`py-2 pl-4 text-right tabular-nums font-semibold ${pctColor(m.mortalitaPct)}`}>{fmtPct(m.mortalitaPct)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* PER LOTTO */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Boxes className="h-4 w-4 text-violet-600" /> Morti per lotto
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Morti registrati nel periodo, dal registro lotti. La % è rapportata agli animali attivati
                del lotto (indicativa). Clicca un lotto per il report dettagliato.
              </p>
            </CardHeader>
            <CardContent>
              {report.perLot.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nessun morto registrato per lotto nel periodo.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 pr-4 font-medium">Lotto</th>
                        <th className="py-2 px-4 font-medium">Fornitore</th>
                        <th className="py-2 px-4 font-medium text-right">Attivati</th>
                        <th className="py-2 px-4 font-medium text-right">Morti</th>
                        <th className="py-2 pl-4 font-medium text-right">Mortalità</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.perLot.map((l) => {
                        const goToLot = () => navigate(`/report-lotto/${l.lotId}`);
                        return (
                          <tr
                            key={l.lotId}
                            className="border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                            data-testid={`row-lot-${l.lotId}`}
                            role="button"
                            tabIndex={0}
                            onClick={goToLot}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                goToLot();
                              }
                            }}
                            title={`Apri il report del lotto #${l.lotId}`}
                          >
                            <td className="py-2 pr-4 font-medium">
                              <span className="inline-flex items-center gap-1.5">
                                #{l.lotId}
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                              </span>
                            </td>
                            <td className="py-2 px-4">
                              {l.supplier || '—'}
                              {l.supplierLotNumber ? <span className="text-muted-foreground"> · {l.supplierLotNumber}</span> : null}
                            </td>
                            <td className="py-2 px-4 text-right tabular-nums">{fmt(l.attivati)}</td>
                            <td className="py-2 px-4 text-right tabular-nums font-semibold text-red-600">{fmt(l.mortiWindow)}</td>
                            <td className={`py-2 pl-4 text-right tabular-nums font-semibold ${pctColor(l.mortalitaPct)}`}>{fmtPct(l.mortalitaPct)}</td>
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
            <span className="font-medium">Entrati</span> = animali entrati alle vagliature nel periodo;{' '}
            <span className="font-medium">Morti</span> = entrati − ripartiti vivi (con tetto a 0 sulle
            anomalie). I morti per FLUPSY sono attribuiti al modulo di origine in proporzione agli animali
            entrati. I morti per lotto provengono dal registro lotti.
          </p>
        </div>
      )}
    </div>
  );
}
