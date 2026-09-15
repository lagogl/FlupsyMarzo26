import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileSpreadsheet,
  Layers3,
  PackageCheck,
  ShieldCheck,
  ShieldQuestion,
  TrendingDown,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';

interface FlowRow { origine: string; destinazione: string; eventi: number; animali: number }
interface StageBalanceRow {
  tappa: string; entrati: number; usciti: number; morti: number; saldo: number; giacenza: number; perditaNonSpiegata: number;
}
interface MortalityStage {
  tappa: string; eventi: number; animaliLavorati: number; mortalitaRilevata: number;
  eventiConMortalita: number; mortalitaPct: number; eventoPeggiore: number; eventiBassaAffidabilita: number;
}
interface MortalityEvent {
  id: string; operationId: string; kind: 'selection' | 'screening'; date: string; operationNumber: number;
  tappa: string; flupsy: string; sourceAnimals: number; destinationAnimals: number;
  mortality: number; mortalityPct: number; confidence: 'high' | 'medium' | 'low'; mixedLots: boolean;
}
interface FlowResponse {
  from: string; to: string; suppliers: string[] | string; matrix: FlowRow[]; stageBalance: StageBalanceRow[];
  mortalityStages?: MortalityStage[]; mortalityEvents?: MortalityEvent[];
}

const CATS = ['RACEWAY', 'BINS', 'FLUPSY', 'MINI FLUPSY', '(altro)'];
const CAT_COLOR: Record<string, string> = {
  RACEWAY: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  BINS: 'bg-slate-100 text-slate-700 border-slate-200',
  FLUPSY: 'bg-teal-50 text-teal-800 border-teal-200',
  'MINI FLUPSY': 'bg-sky-50 text-sky-800 border-sky-200',
  '(altro)': 'bg-stone-100 text-stone-600 border-stone-200',
};
const fmt = (n: number) => Math.round(n).toLocaleString('it-IT');
const pct = (n: number) => `${Number(n || 0).toFixed(1)}%`;
const toIso = (d: Date) => d.toISOString().slice(0, 10);

function ConfidenceBadge({ value }: { value: MortalityEvent['confidence'] }) {
  const labels = { high: 'Alta', medium: 'Media', low: 'Bassa' };
  const styles = {
    high: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    medium: 'border-amber-200 bg-amber-50 text-amber-800',
    low: 'border-rose-200 bg-rose-50 text-rose-800',
  };
  return <Badge variant="outline" className={`font-medium ${styles[value]}`}>{labels[value]}</Badge>;
}

export default function LotFlowReport() {
  const [from, setFrom] = useState<Date>(new Date('2025-12-01'));
  const [to, setTo] = useState<Date>(new Date());
  const [roem, setRoem] = useState(true);
  const [ecotapes, setEcotapes] = useState(true);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const suppliers = useMemo(() => {
    const list: string[] = [];
    if (roem) list.push('roem');
    if (ecotapes) list.push('ecotapes', 'zeeland');
    return list.length ? list.join(',') : 'all';
  }, [roem, ecotapes]);
  const fromIso = toIso(from);
  const toIsoStr = toIso(to);
  const exportUrl = `/api/reports/lot-flow/export?from=${fromIso}&to=${toIsoStr}&suppliers=${encodeURIComponent(suppliers)}`;
  const { data, isLoading, isError, refetch } = useQuery<FlowResponse>({
    queryKey: ['/api/reports/lot-flow', fromIso, toIsoStr, suppliers],
    queryFn: async () => {
      const res = await fetch(`/api/reports/lot-flow?from=${fromIso}&to=${toIsoStr}&suppliers=${encodeURIComponent(suppliers)}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Errore caricamento report');
      return res.json();
    },
  });
  const matrix = data?.matrix ?? [];
  const stages = data?.mortalityStages ?? [];
  const events = data?.mortalityEvents ?? [];
  const totalMortality = stages.reduce((sum, s) => sum + (s.mortalitaRilevata || 0), 0);
  const totalProcessed = stages.reduce((sum, s) => sum + (s.animaliLavorati || 0), 0);
  const totalEvents = new Set(events.filter((event) => event.mortality > 0).map((event) => event.operationId)).size;
  const lowConfidence = new Set(
    events.filter((event) => event.confidence !== 'high').map((event) => event.operationId),
  ).size;
  const worstStage = [...stages].filter((stage) => stage.mortalitaRilevata > 0).sort((a, b) => b.mortalitaPct - a.mortalitaPct)[0];
  const sortedEvents = [...events].filter((event) => event.mortality > 0).sort((a, b) => (b.mortalityPct - a.mortalityPct) || (b.mortality - a.mortality));
  const visibleEvents = showAllEvents ? sortedEvents : sortedEvents.slice(0, 12);
  const timeline = useMemo(() => {
    const byDate = new Map<string, { mortality: number; processed: number; events: number }>();
    events.forEach((event) => {
      const date = event.date.slice(0, 10);
      const current = byDate.get(date) ?? { mortality: 0, processed: 0, events: 0 };
      byDate.set(date, { mortality: current.mortality + event.mortality, processed: current.processed + event.sourceAnimals, events: current.events + 1 });
    });
    return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [events]);
  const maxTimelineMortality = Math.max(...timeline.map(([, value]) => value.mortality), 1);
  const cell = (o: string, d: string) => matrix.find((r) => r.origine === o && r.destinazione === d);
  const pathOrder: Record<string, number> = { RACEWAY: 0, BINS: 1, 'MINI FLUPSY': 2, FLUPSY: 3 };

  return (
    <div className="min-h-[100dvh] bg-[#f3f7f6] text-slate-900">
      <div className="container mx-auto max-w-[1480px] space-y-5 p-4 md:p-6">
        <PageHeader title="Diagnostica mortalità" subtitle="FLUPSY Ecotapes / Delta Futuro · lettura operativa dei decessi rilevati per tappa ed evento" />

        <Card className="border-slate-200/80 bg-[#fbfdfc] shadow-sm">
          <CardContent className="flex flex-wrap items-end gap-4 p-4">
            <div className="flex flex-col gap-1"><Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Dal</Label><DatePicker date={from} setDate={(d: Date | undefined) => d && setFrom(d)} /></div>
            <div className="flex flex-col gap-1"><Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Al</Label><DatePicker date={to} setDate={(d: Date | undefined) => d && setTo(d)} /></div>
            <div className="flex flex-col gap-2"><Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Fornitori</Label><div className="flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm"><Checkbox checked={roem} onCheckedChange={(v) => setRoem(!!v)} />Roem</label>
              <label className="flex cursor-pointer items-center gap-2 text-sm"><Checkbox checked={ecotapes} onCheckedChange={(v) => setEcotapes(!!v)} />Ecotapes Zeeland</label>
            </div></div>
            <Button asChild variant="outline" className="ml-auto gap-2 border-slate-300 bg-white hover:border-teal-400 hover:bg-teal-50"><a href={exportUrl} download><FileSpreadsheet className="h-4 w-4 text-teal-700" />Esporta Excel</a></Button>
          </CardContent>
        </Card>

        <div className="flex items-start gap-3 rounded-lg border border-teal-200 bg-teal-50/70 px-4 py-3 text-sm text-teal-950">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
          <p><strong>Regola di lettura:</strong> questa pagina conta solo mortalità osservata in operazioni completate di screening o selezione. Le differenze di inventario non spiegate sono mostrate separatamente: non sono mortalità affidabile.</p>
        </div>

        {isLoading ? <div className="grid gap-4 md:grid-cols-4"><div className="h-32 animate-pulse rounded-xl bg-slate-200/70 md:col-span-4" /><div className="h-72 animate-pulse rounded-xl bg-slate-200/70 md:col-span-2" /><div className="h-72 animate-pulse rounded-xl bg-slate-200/70 md:col-span-2" /></div> :
          isError ? <Card className="border-rose-200"><CardContent className="flex flex-col items-center gap-3 py-14 text-center"><AlertTriangle className="h-8 w-8 text-rose-600" /><h2 className="font-semibold">Report non disponibile</h2><p className="text-sm text-slate-500">Non è stato possibile leggere i dati del periodo selezionato.</p><Button onClick={() => refetch()} variant="outline">Riprova</Button></CardContent></Card> :
          <div className="space-y-5">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
               <Card className="border-teal-200 bg-[#e5f2ef] shadow-none transition-transform hover:-translate-y-0.5"><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-teal-800">Mortalità rilevata</span><TrendingDown className="h-4 w-4 text-teal-700" /></div><div className="mt-3 text-3xl font-semibold tracking-tight text-teal-950">{fmt(totalMortality)}</div><p className="mt-1 text-xs text-teal-800">animali osservati in {totalEvents} eventi con mortalità</p></CardContent></Card>
              <Card className="border-slate-200 bg-white shadow-none transition-transform hover:-translate-y-0.5"><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Incidenza sul lavorato</span><PackageCheck className="h-4 w-4 text-slate-500" /></div><div className="mt-3 text-3xl font-semibold tracking-tight">{pct(totalProcessed ? totalMortality / totalProcessed * 100 : 0)}</div><p className="mt-1 text-xs text-slate-500">{fmt(totalProcessed)} animali processati</p></CardContent></Card>
              <Card className="border-amber-200 bg-[#fff8e9] shadow-none transition-transform hover:-translate-y-0.5"><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-amber-800">Tappa più critica</span><AlertTriangle className="h-4 w-4 text-amber-700" /></div><div className="mt-3 truncate text-2xl font-semibold tracking-tight text-amber-950">{worstStage?.tappa ?? '—'}</div><p className="mt-1 text-xs text-amber-800">{worstStage ? `${pct(worstStage.mortalitaPct)} · ${fmt(worstStage.mortalitaRilevata)} animali` : 'nessun dato'}</p></CardContent></Card>
              <Card className="border-rose-200 bg-[#fff0ef] shadow-none transition-transform hover:-translate-y-0.5"><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-rose-800">Attribuzione da verificare</span><ShieldQuestion className="h-4 w-4 text-rose-700" /></div><div className="mt-3 text-3xl font-semibold tracking-tight text-rose-950">{fmt(lowConfidence)}</div><p className="mt-1 text-xs text-rose-800">eventi a bassa affidabilità</p></CardContent></Card>
            </section>

            <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
              <Card className="border-slate-200/80 shadow-sm"><CardHeader className="border-b border-slate-100 pb-4"><div className="flex items-center gap-2"><Layers3 className="h-5 w-5 text-teal-700" /><div><CardTitle className="text-base">Dove viene rilevata</CardTitle><CardDescription>Morti osservate e quota sul totale di animali lavorati per tappa.</CardDescription></div></div></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="p-3 text-left">Tappa</th><th className="p-3 text-right">Eventi</th><th className="p-3 text-right">Lavorati</th><th className="p-3 text-right">Morti</th><th className="p-3 text-right">% sul lavorato</th><th className="p-3 text-right">Peggior evento</th></tr></thead><tbody>{stages.map((s) => <tr key={s.tappa} className="border-t border-slate-100 transition-colors hover:bg-teal-50/50"><td className="p-3"><Badge variant="outline" className={CAT_COLOR[s.tappa] ?? CAT_COLOR['(altro)']}>{s.tappa}</Badge>{s.eventiBassaAffidabilita > 0 && <span className="ml-2 text-[10px] text-rose-700">verifica {s.eventiBassaAffidabilita}</span>}</td><td className="p-3 text-right tabular-nums">{fmt(s.eventi)}</td><td className="p-3 text-right tabular-nums text-slate-500">{fmt(s.animaliLavorati)}</td><td className="p-3 text-right font-semibold tabular-nums text-teal-800">{fmt(s.mortalitaRilevata)}</td><td className="p-3 text-right font-semibold tabular-nums">{pct(s.mortalitaPct)}</td><td className="p-3 text-right tabular-nums text-rose-700">{pct(s.eventoPeggiore)}</td></tr>)}</tbody></table></div>{!stages.length && <p className="p-8 text-center text-sm text-slate-500">Nessuna mortalità osservata nel periodo.</p>}</CardContent></Card>

              <Card className="border-slate-200/80 shadow-sm"><CardHeader className="border-b border-slate-100 pb-4"><div className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-teal-700" /><div><CardTitle className="text-base">Andamento nel periodo</CardTitle><CardDescription>Morti osservate per giorno di operazione. Passa sopra una barra per leggere il dettaglio.</CardDescription></div></div></CardHeader><CardContent className="p-4">{timeline.length ? <div className="flex h-52 items-end gap-1.5 overflow-x-auto border-b border-slate-200 pb-0">{timeline.map(([date, value]) => <div key={date} className="group flex min-w-[28px] flex-1 flex-col items-center justify-end gap-1" title={`${format(new Date(date), 'dd MMM', { locale: it })}: ${fmt(value.mortality)} morti, ${value.events} eventi`}><span className="text-[10px] font-semibold text-teal-800 opacity-0 transition-opacity group-hover:opacity-100">{fmt(value.mortality)}</span><div className="w-full min-w-[18px] rounded-t bg-teal-600 transition-all group-hover:bg-amber-500" style={{ height: `${Math.max(value.mortality / maxTimelineMortality * 150, 4)}px` }} /><span className="mb-2 rotate-[-55deg] whitespace-nowrap text-[10px] text-slate-500">{format(new Date(date), 'dd/MM')}</span></div>)}</div> : <div className="flex h-52 items-center justify-center text-sm text-slate-500">Nessun evento nel periodo.</div>}<div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-teal-600" /> altezza = animali morti rilevati · il dato non include differenze inventariali</div></CardContent></Card>
            </div>

            <Card className="border-slate-200/80 shadow-sm"><CardHeader className="border-b border-slate-100 pb-4"><div className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-teal-700" /><div><CardTitle className="text-base">Eventi peggiori</CardTitle><CardDescription>Top {Math.min(12, sortedEvents.length)} per percentuale di mortalità. Selezione e screening sono operazioni osservate; i lotti misti riducono l'affidabilità dell'attribuzione.</CardDescription></div></div></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="p-3 text-left">Data / operazione</th><th className="p-3 text-left">Tipo</th><th className="p-3 text-left">Tappa · Flupsy</th><th className="p-3 text-right">Origine</th><th className="p-3 text-right">Destinazione</th><th className="p-3 text-right">Mortalità</th><th className="p-3 text-right">Quota</th><th className="p-3 text-left">Affidabilità</th></tr></thead><tbody>{visibleEvents.map((event) => <tr key={event.id} className="border-t border-slate-100 transition-colors hover:bg-amber-50/50"><td className="p-3"><div className="font-medium">{format(new Date(event.date), 'dd/MM/yyyy', { locale: it })}</div><div className="text-xs text-slate-500">operazione {event.operationNumber}</div></td><td className="p-3"><Badge variant="outline" className="border-slate-300">{event.kind === 'screening' ? 'Screening' : 'Selezione'}</Badge></td><td className="p-3"><div>{event.tappa}</div><div className="text-xs text-slate-500">{event.flupsy}</div></td><td className="p-3 text-right tabular-nums">{fmt(event.sourceAnimals)}</td><td className="p-3 text-right tabular-nums">{fmt(event.destinationAnimals)}</td><td className="p-3 text-right font-semibold tabular-nums text-teal-800">{fmt(event.mortality)}</td><td className="p-3 text-right font-semibold tabular-nums text-rose-700">{pct(event.mortalityPct)}</td><td className="p-3"><div className="flex items-center gap-2"><ConfidenceBadge value={event.confidence} />{event.mixedLots && <span className="text-[10px] text-amber-700">lotti misti</span>}</div></td></tr>)}</tbody></table></div>{!sortedEvents.length && <p className="p-8 text-center text-sm text-slate-500">Nessun evento completato nel periodo.</p>}{sortedEvents.length > 12 && <div className="flex justify-center border-t border-slate-100 p-3"><Button variant="ghost" className="gap-2 text-teal-800 hover:bg-teal-50" onClick={() => setShowAllEvents((current) => !current)}>{showAllEvents ? <><ChevronUp className="h-4 w-4" />Mostra meno</> : <><ChevronDown className="h-4 w-4" />Mostra tutti gli eventi ({sortedEvents.length})</>}</Button></div>}</CardContent></Card>

            <Card className="border-amber-200 bg-[#fffdf6] shadow-sm"><CardHeader className="pb-3"><div className="flex items-center gap-2"><ShieldQuestion className="h-5 w-5 text-amber-700" /><div><CardTitle className="text-base text-amber-950">Riconciliazione inventario: contesto, non mortalità</CardTitle><CardDescription>Il bilancio dei movimenti aiuta a trovare anomalie, ma non attribuisce una causa biologica.</CardDescription></div></div></CardHeader><CardContent className="overflow-x-auto pt-0"><table className="w-full text-sm"><thead className="text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="p-2 text-left">Tappa</th><th className="p-2 text-right">Entrati</th><th className="p-2 text-right">Usciti vivi</th><th className="p-2 text-right">Morti registrati</th><th className="p-2 text-right">Giacenza attuale</th><th className="p-2 text-right">Differenza da verificare</th></tr></thead><tbody>{(data?.stageBalance ?? []).map((r) => <tr key={r.tappa} className="border-t border-amber-100"><td className="p-2"><Badge variant="outline" className={CAT_COLOR[r.tappa] ?? CAT_COLOR['(altro)']}>{r.tappa}</Badge></td><td className="p-2 text-right tabular-nums">{fmt(r.entrati)}</td><td className="p-2 text-right tabular-nums">{fmt(r.usciti)}</td><td className="p-2 text-right tabular-nums">{fmt(r.morti)}</td><td className="p-2 text-right tabular-nums">{fmt(r.giacenza)}</td><td className="p-2 text-right font-semibold tabular-nums text-amber-800">{fmt(r.perditaNonSpiegata)}</td></tr>)}</tbody></table><p className="mt-3 text-xs leading-relaxed text-amber-900">Saldo teorico − giacenza è una differenza inventariale. Confronta movimenti del periodo con una giacenza corrente e quindi non è una misura affidabile di mortalità, soprattutto su finestre storiche brevi. Per la diagnosi usare la mortalità osservata sopra.</p></CardContent></Card>

            <Card className="border-slate-200/80 shadow-sm"><CardHeader><CardTitle className="text-base">Movimenti tra tappe</CardTitle><CardDescription>Contesto operativo: animali movimentati, non animali unici. Le celle evidenziate rappresentano passaggi in avanti nel percorso.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead><tr><th className="p-2 text-left text-xs text-slate-500">DA ↓ / A →</th>{CATS.map((c) => <th key={c} className="p-2 text-center"><Badge variant="outline" className={CAT_COLOR[c]}>{c}</Badge></th>)}</tr></thead><tbody>{CATS.map((o) => <tr key={o} className="border-t border-slate-100"><td className="p-2"><Badge variant="outline" className={CAT_COLOR[o]}>{o}</Badge></td>{CATS.map((d) => { const c = cell(o, d); const forward = pathOrder[o] !== undefined && pathOrder[d] !== undefined && pathOrder[d] > pathOrder[o]; return <td key={d} className={`p-2 text-center tabular-nums ${forward ? 'bg-amber-50 font-semibold' : ''} ${!c ? 'text-slate-300' : ''}`}>{c ? <><div>{fmt(c.animali)}</div><div className="text-[10px] text-slate-500">{c.eventi} mov.</div></> : '—'}</td>; })}</tr>)}</tbody></table><p className="mt-3 flex items-center gap-1 text-xs text-slate-500"><ArrowRight className="h-3 w-3" /> La matrice descrive il flusso di movimenti e non deve essere letta come stima di mortalità.</p></CardContent></Card>
          </div>}
      </div>
    </div>
  );
}