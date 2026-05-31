import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Loader2, Waves, Package, Boxes, GitBranch } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

interface FlowRow {
  origine: string;
  destinazione: string;
  eventi: number;
  animali: number;
}

interface FlowResponse {
  from: string;
  to: string;
  suppliers: string[] | string;
  matrix: FlowRow[];
}

const CATS = ['RACEWAY', 'BINS', 'FLUPSY', 'MINI FLUPSY', '(altro)'];

const CAT_COLOR: Record<string, string> = {
  RACEWAY: 'bg-sky-100 text-sky-800 border-sky-200',
  BINS: 'bg-amber-100 text-amber-800 border-amber-200',
  FLUPSY: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'MINI FLUPSY': 'bg-teal-100 text-teal-800 border-teal-200',
  '(altro)': 'bg-gray-100 text-gray-600 border-gray-200',
};

function fmt(n: number): string {
  return n.toLocaleString('it-IT');
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function LotFlowReport() {
  const [from, setFrom] = useState<Date>(new Date('2025-12-01'));
  const [to, setTo] = useState<Date>(new Date());
  const [roem, setRoem] = useState(true);
  const [ecotapes, setEcotapes] = useState(true);

  const suppliers = useMemo(() => {
    const list: string[] = [];
    if (roem) list.push('roem');
    if (ecotapes) list.push('ecotapes', 'zeeland');
    return list.length ? list.join(',') : 'all';
  }, [roem, ecotapes]);

  const fromIso = toIso(from);
  const toIsoStr = toIso(to);

  const { data, isLoading } = useQuery<FlowResponse>({
    queryKey: ['/api/reports/lot-flow', fromIso, toIsoStr, suppliers],
    queryFn: async () => {
      const res = await fetch(
        `/api/reports/lot-flow?from=${fromIso}&to=${toIsoStr}&suppliers=${encodeURIComponent(suppliers)}`,
        { credentials: 'include' },
      );
      if (!res.ok) throw new Error('Errore caricamento report');
      return res.json();
    },
  });

  const matrix = data?.matrix ?? [];

  const cell = (o: string, d: string): FlowRow | undefined =>
    matrix.find((r) => r.origine === o && r.destinazione === d);

  const sumBetween = (origins: string[], dests: string[]) =>
    matrix
      .filter((r) => origins.includes(r.origine) && dests.includes(r.destinazione))
      .reduce(
        (acc, r) => ({ animali: acc.animali + r.animali, eventi: acc.eventi + r.eventi }),
        { animali: 0, eventi: 0 },
      );

  // Tappe principali richieste
  const racewayToBins = sumBetween(['RACEWAY'], ['BINS']);
  const binsToFlupsy = sumBetween(['BINS'], ['FLUPSY', 'MINI FLUPSY']);
  const racewayToFlupsyDirect = sumBetween(['RACEWAY'], ['FLUPSY', 'MINI FLUPSY']);
  // Ingressi nei flupsy/mini PROVENIENTI DA FUORI (esclude i movimenti interni
  // flupsy↔flupsy che gonfierebbero il dato di "arrivati").
  const totalToFlupsy = sumBetween(
    ['RACEWAY', 'BINS', '(altro)'],
    ['FLUPSY', 'MINI FLUPSY'],
  );

  const stageCards = [
    {
      title: '1️⃣ Raceway → Bins',
      desc: 'Animali spostati dalle raceway ai bins',
      icon: <Boxes className="h-5 w-5 text-amber-600" />,
      data: racewayToBins,
      color: 'border-amber-200',
    },
    {
      title: '2️⃣ Bins → Flupsy / Mini-flupsy',
      desc: 'Animali spostati dai bins ai flupsy',
      icon: <Waves className="h-5 w-5 text-emerald-600" />,
      data: binsToFlupsy,
      color: 'border-emerald-200',
    },
    {
      title: '↪️ Raceway → Flupsy (diretto)',
      desc: 'Spostati direttamente senza passare dai bins',
      icon: <GitBranch className="h-5 w-5 text-sky-600" />,
      data: racewayToFlupsyDirect,
      color: 'border-sky-200',
    },
    {
      title: '✅ Arrivati ai Flupsy/Mini (da fuori)',
      desc: 'Ingressi da raceway/bins, esclusi i movimenti interni tra flupsy',
      icon: <Package className="h-5 w-5 text-indigo-600" />,
      data: totalToFlupsy,
      color: 'border-indigo-300 bg-indigo-50/40',
    },
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <PageHeader
        title="Flusso Animali per Tappe"
        subtitle="Passaggi degli animali tra raceway, bins, flupsy e mini-flupsy (lotti Roem / Ecotapes Zeeland)"
      />

      {/* Filtri */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtri</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Dal</Label>
            <DatePicker date={from} setDate={(d) => d && setFrom(d)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Al</Label>
            <DatePicker date={to} setDate={(d) => d && setTo(d)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-xs">Fornitori</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox checked={roem} onCheckedChange={(v) => setRoem(!!v)} />
                Roem
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox checked={ecotapes} onCheckedChange={(v) => setEcotapes(!!v)} />
                Ecotapes Zeeland
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
        <strong>Nota:</strong> i numeri indicano i <strong>movimenti di animali</strong>, non animali
        unici. Lo stesso animale che passa più tappe (es. raceway → bins → flupsy) viene conteggiato in
        ogni passaggio.
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          {/* Cards tappe */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stageCards.map((s) => (
              <Card key={s.title} className={s.color}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    {s.icon}
                    <CardTitle className="text-sm">{s.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{fmt(s.data.animali)}</p>
                  <p className="text-xs text-muted-foreground">animali · {s.data.eventi} movimenti</p>
                  <CardDescription className="mt-1 text-xs">{s.desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Matrice completa */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Matrice completa dei passaggi</CardTitle>
              <CardDescription>
                Righe = da dove partono · Colonne = dove arrivano · valore = animali (movimenti).
                Periodo {data && format(new Date(data.from), 'dd/MM/yyyy', { locale: it })} –{' '}
                {data && format(new Date(data.to), 'dd/MM/yyyy', { locale: it })}.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-xs text-muted-foreground">DA ↓ / A →</th>
                    {CATS.map((c) => (
                      <th key={c} className="p-2 text-center">
                        <Badge variant="outline" className={CAT_COLOR[c]}>{c}</Badge>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CATS.map((o) => (
                    <tr key={o} className="border-t">
                      <td className="p-2">
                        <Badge variant="outline" className={CAT_COLOR[o]}>{o}</Badge>
                      </td>
                      {CATS.map((d) => {
                        const c = cell(o, d);
                        const isStage =
                          (o === 'RACEWAY' && d === 'BINS') ||
                          (o === 'BINS' && (d === 'FLUPSY' || d === 'MINI FLUPSY'));
                        return (
                          <td
                            key={d}
                            className={`p-2 text-center tabular-nums ${
                              isStage ? 'bg-yellow-50 font-semibold' : ''
                            } ${!c ? 'text-gray-300' : ''}`}
                          >
                            {c ? (
                              <>
                                <div>{fmt(c.animali)}</div>
                                <div className="text-[10px] text-muted-foreground">{c.eventi} mov.</div>
                              </>
                            ) : (
                              '—'
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                <ArrowRight className="h-3 w-3" />
                Le celle evidenziate in giallo sono le due tappe richieste (raceway→bins e bins→flupsy).
                "(altro)" = movimenti in cui non è stato possibile risalire al contenitore.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
