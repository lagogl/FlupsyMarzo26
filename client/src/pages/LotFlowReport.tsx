import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Loader2, Waves, Package, Boxes, GitBranch, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';

interface FlowRow {
  origine: string;
  destinazione: string;
  eventi: number;
  animali: number;
}

interface StageBalanceRow {
  tappa: string;
  entrati: number;
  usciti: number;
  morti: number;
  saldo: number;
  giacenza: number;
  perditaNonSpiegata: number;
}

interface FlowResponse {
  from: string;
  to: string;
  suppliers: string[] | string;
  matrix: FlowRow[];
  stageBalance: StageBalanceRow[];
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

  const exportUrl = `/api/reports/lot-flow/export?from=${fromIso}&to=${toIsoStr}&suppliers=${encodeURIComponent(suppliers)}`;

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

  // Percorso corretto: RACEWAY → (BINS → MINI FLUPSY → FLUPSY) → vendita.
  // Bins e mini-flupsy possono mancare; la vendita avviene da flupsy o mini-flupsy.
  // Uscite dalle raceway verso le tappe di ingrasso successive.
  const racewayForward = sumBetween(['RACEWAY'], ['BINS', 'MINI FLUPSY', 'FLUPSY']);
  // Passaggio dai bins alle tappe successive (mini-flupsy o flupsy).
  const binsForward = sumBetween(['BINS'], ['MINI FLUPSY', 'FLUPSY']);
  // Passaggio dal mini-flupsy al flupsy.
  const miniToFlupsy = sumBetween(['MINI FLUPSY'], ['FLUPSY']);
  // Arrivi al flupsy (ultima tappa prima della vendita) da qualunque tappa precedente.
  const arrivedAtFlupsy = sumBetween(['RACEWAY', 'BINS', 'MINI FLUPSY', '(altro)'], ['FLUPSY']);

  const stageCards = [
    {
      title: '1️⃣ Raceway → ingrasso',
      desc: 'Uscite dalle raceway verso bins, mini-flupsy o flupsy',
      icon: <Boxes className="h-5 w-5 text-amber-600" />,
      data: racewayForward,
      color: 'border-amber-200',
    },
    {
      title: '2️⃣ Bins → Mini / Flupsy',
      desc: 'Avanzamento dai bins (tappa opzionale)',
      icon: <Waves className="h-5 w-5 text-emerald-600" />,
      data: binsForward,
      color: 'border-emerald-200',
    },
    {
      title: '3️⃣ Mini-flupsy → Flupsy',
      desc: 'Avanzamento dal mini-flupsy (tappa opzionale)',
      icon: <GitBranch className="h-5 w-5 text-teal-600" />,
      data: miniToFlupsy,
      color: 'border-teal-200',
    },
    {
      title: '✅ Arrivati al Flupsy',
      desc: 'Ingressi nel flupsy, ultima tappa prima della vendita',
      icon: <Package className="h-5 w-5 text-indigo-600" />,
      data: arrivedAtFlupsy,
      color: 'border-indigo-300 bg-indigo-50/40',
    },
  ];

  // Ordine del percorso per evidenziare nella matrice i passaggi "in avanti".
  const PATH_ORDER: Record<string, number> = {
    RACEWAY: 0, BINS: 1, 'MINI FLUPSY': 2, FLUPSY: 3,
  };
  const isForwardStep = (o: string, d: string) =>
    o in PATH_ORDER && d in PATH_ORDER && PATH_ORDER[d] > PATH_ORDER[o];

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
          <div className="flex flex-col gap-1 ml-auto">
            <Label className="text-xs">&nbsp;</Label>
            <Button asChild variant="outline" className="gap-2">
              <a href={exportUrl} download>
                <FileSpreadsheet className="h-4 w-4" />
                Esporta Excel
              </a>
            </Button>
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

          {/* Bilancio per tappa: dove si perdono gli animali */}
          {data?.stageBalance && data.stageBalance.length > 0 && (
            <Card className="border-rose-200">
              <CardHeader>
                <CardTitle className="text-base">⚠️ Dove si perdono gli animali — Bilancio per tappa</CardTitle>
                <CardDescription>
                  Per ogni contenitore: quanti animali sono <strong>entrati</strong>, quanti sono{' '}
                  <strong>usciti vivi</strong> verso altre tappe o vendita, quanti risultano{' '}
                  <strong>morti</strong> e quanti sono <strong>ancora presenti adesso</strong>{' '}
                  (giacenza). La differenza che resta è la <strong>perdita non spiegata</strong>.
                  Negli <strong>entrati</strong> delle raceway contano <strong>solo gli arrivi reali
                  dai fornitori</strong> (Roem / Ecotapes Zeeland): gli spostamenti da una raceway
                  all'altra sono movimenti interni e non vengono contati come nuovi arrivi.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-xs text-muted-foreground">
                      <th className="p-2 text-left">Tappa</th>
                      <th className="p-2 text-right">Entrati</th>
                      <th className="p-2 text-right">Usciti vivi</th>
                      <th className="p-2 text-right">Morti</th>
                      <th className="p-2 text-right">% mortalità</th>
                      <th className="p-2 text-right">Saldo teorico</th>
                      <th className="p-2 text-right">Giacenza attuale</th>
                      <th className="p-2 text-right">Perdita non spiegata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.stageBalance.map((r) => {
                      const pct = r.entrati > 0 ? (r.morti / r.entrati) * 100 : 0;
                      return (
                        <tr key={r.tappa} className="border-t">
                          <td className="p-2">
                            <Badge variant="outline" className={CAT_COLOR[r.tappa] ?? CAT_COLOR['(altro)']}>
                              {r.tappa}
                            </Badge>
                          </td>
                          <td className="p-2 text-right tabular-nums">{fmt(r.entrati)}</td>
                          <td className="p-2 text-right tabular-nums">{fmt(r.usciti)}</td>
                          <td className="p-2 text-right tabular-nums text-rose-700 font-medium">{fmt(r.morti)}</td>
                          <td className={`p-2 text-right tabular-nums font-semibold ${pct >= 20 ? 'text-rose-700' : pct >= 10 ? 'text-amber-600' : 'text-emerald-700'}`}>
                            {pct.toFixed(1)}%
                          </td>
                          <td className="p-2 text-right tabular-nums text-muted-foreground">{fmt(r.saldo)}</td>
                          <td className="p-2 text-right tabular-nums text-sky-700 font-medium">{fmt(r.giacenza)}</td>
                          <td className={`p-2 text-right tabular-nums font-semibold ${r.perditaNonSpiegata > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                            {fmt(r.perditaNonSpiegata)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="mt-3 text-xs text-muted-foreground">
                  <strong>Saldo teorico</strong> = Entrati − Usciti − Morti (quanti dovrebbero esserci).{' '}
                  <strong>Giacenza attuale</strong> = animali realmente presenti adesso nelle ceste attive
                  di quella tappa (conteggio dell'ultima operazione, ripartito sui lotti selezionati).{' '}
                  <strong>Perdita non spiegata</strong> = Saldo teorico − Giacenza: animali spariti senza
                  mortalità o vendita registrata. La % mortalità è calcolata sugli animali entrati nella tappa.
                </p>
                <p className="mt-2 text-xs text-amber-700">
                  ⚠️ La <strong>perdita non spiegata</strong> è attendibile solo quando il periodo parte
                  dall'arrivo dei lotti (1 dicembre 2025): il saldo conta i movimenti del periodo scelto,
                  mentre la giacenza è quella attuale. Con un periodo più corto i due valori non sono
                  confrontabili e il risultato può apparire negativo.
                </p>
              </CardContent>
            </Card>
          )}

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
                        const isStage = isForwardStep(o, d);
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
