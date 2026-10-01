import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSalesScenarioActions, useSalesScenarioInputs, useSalesScenarios } from "@/hooks/use-sales-scenarios";
import { ScenarioHelp } from "@/components/ScenariVenditaHelp";
import { CommercialAvailabilityMatrix } from "@/components/CommercialAvailabilityMatrix";
import { ScenarioCalculationProgress } from "@/components/ScenarioCalculationProgress";
import { SALES_SCENARIO_SIZE_CODES } from "@shared/sales-scenario-size-policy";
import { calculateScenarioComparison, comparisonErrorMessage } from "@/lib/sales-scenario-comparison";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { SavedScenario, ScenarioInput, ScenarioMonth, ScenarioProposal, ScenarioResult, ScenarioSale } from "@shared/sales-scenarios";
import { AlertTriangle, Check, Copy, Loader2, Plus, RefreshCw, Save, Sparkles, Trash2, X } from "lucide-react";

const months = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const quantity = new Intl.NumberFormat("it-IT");
const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const emptyInput = (): ScenarioInput => ({ name: "", startYear: new Date().getFullYear(), startMonth: new Date().getMonth() + 1, horizon: 12, growthFactor: 1, prudentGrowthFactor: .8, mortalityMultiplier: 1, prudentMortalityMultiplier: 1.25, prudentHatcheryFactor: .8, selectedSizeIds: [], sales: [], sandNursery: [], cashGoal: 0, cashDeadline: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 }, proposalPrices: [] });
const monthLabel = (v: { year?: number; month?: number; startYear?: number; startMonth?: number }) => `${months[(v.month ?? v.startMonth ?? 1) - 1]} ${v.year ?? v.startYear ?? ""}`;
const parse = (value: string) => Number(value) || 0;
const help = {
  name: "Nome descrittivo usato per riconoscere lo scenario quando lo salvi e lo confronti.",
  start: "Mese iniziale corrente secondo il fuso di Roma. È definito dal sistema e non è modificabile.",
  horizon: "Durata della simulazione: scegli un orizzonte da 6 a 24 mesi.",
  cashGoal: "Euro di vendite AGGIUNTIVE da incassare entro la scadenza. Non sottrae costi e non comprende gli ordini già acquisiti.",
  growth: "Moltiplicatore della crescita prevista: 1 usa la crescita base.",
  prudentGrowth: "Moltiplicatore prudente della crescita: 0,8 applica una crescita inferiore del 20% rispetto alla base.",
  mortality: "Moltiplicatore della mortalità prevista: 1 usa la mortalità base.",
  prudentMortality: "Moltiplicatore della mortalità prudente. Per esempio 1,25 trasforma una mortalità del 3% in 3,75%: non significa mortalità del 25%.",
  prudentHatchery: "Quota prudente della produzione futura di schiuditoio: 0,8 considera disponibile l'80%.",
  saleMonth: "Mese di inizio della vendita nello scenario, secondo la convenzione del mese iniziale della proiezione.",
  size: "Taglie di vendita ammesse: TP-2000, TP-3000, TP-4000, TP-5000, TP-6000, TP-7000, TP-8000, TP-9000 e TP-10000. Le taglie intermedie sono escluse dalle nuove vendite, ma restano nella simulazione di crescita e negli ordini acquisiti.",
  quantity: "Numero intero totale di animali, per esempio 1000000. Non sono kg e non vanno reinseriti gli ordini già acquisiti.",
  price: "Prezzo in euro per 1.000 animali. Esempio: 8 € × 1.000.000 / 1.000 = 8.000 €. Se il prezzo manuale resta vuoto, la riga non viene valorizzata.",
  delay: "Ritardo intero dell'incasso in mesi: 0 indica lo stesso mese, 1 il mese successivo.",
  nursery: "Quantità Sand Nursery usata soltanto in questo scenario. Non produce effetti operativi e la simulazione continua a proteggere gli ordini futuri già acquisiti.",
  proposalDeadline: "Scadenza entro cui deve essere ricevuto l'incasso dell'obiettivo; non è il mese della vendita.",
  proposalPrice: "Prezzo automatico in euro per 1.000 animali. Per generare una proposta deve essere positivo.",
  proposalDelay: "Ritardo intero e non negativo usato dalla proposta automatica: 0 stesso mese, 1 mese successivo.",
  selectedSizes: "Scegli almeno una delle nove taglie commerciali. Solo le taglie selezionate saranno disponibili nel piano, nelle proposte e nella matrice; crescita e ordini acquisiti continuano a usare il catalogo completo.",
  scenarioSelection: "Seleziona lo scenario salvato da includere nel confronto ricalcolato.",
  save: "Salva la bozza e i suoi input. Non ricalcola la proiezione e non crea ordini reali.",
  recalculate: "Ricalcola risultati e disponibilità con gli input correnti. Non salva la bozza e non crea ordini reali.",
  generate: "Genera soltanto un'anteprima di vendite aggiuntive: non crea né modifica ordini reali.",
  apply: "Aggiunge le righe proposte alla bozza in modo additivo. Non crea ordini reali e non sostituisce le righe esistenti.",
} as const;

function Metric({ label, value, caution }: { label: string; value: string; caution?: boolean }) {
  return <div className={`rounded-lg border px-3 py-2 ${caution ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}><div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div><div className="mono mt-1 text-base font-medium text-slate-800">{value}</div></div>;
}

export default function ScenariVendita() {
  const { toast } = useToast();
  const inputs = useSalesScenarioInputs();
  const scenarios = useSalesScenarios();
  const { save, remove, simulate, propose } = useSalesScenarioActions();
  const [draft, setDraft] = useState<ScenarioInput | null>(null);
  const [activeId, setActiveId] = useState<number | undefined>();
  const [tab, setTab] = useState<"scenari" | "confronto" | "disponibilita">("scenari");
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [proposal, setProposal] = useState<ScenarioProposal | null>(null);
  const [dirty, setDirty] = useState(false);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const serializedDraft = useRef("");
  const calculationLock = useRef(false);
  const [calculation, setCalculation] = useState<{ kind: "proposal" | "simulation"; startedAt: number } | null>(null);

  useEffect(() => { if (inputs.data && !draft) setDraft(structuredClone(inputs.data.defaults)); }, [inputs.data, draft]);
  useEffect(() => { serializedDraft.current = draft ? JSON.stringify(draft) : ""; }, [draft]);
  const sizes = inputs.data?.sizes ?? [];
  const selectedSizeIds = draft?.selectedSizeIds ?? sizes.map(s => s.id);
  const selectedIdSet = new Set(selectedSizeIds);
  const selectedSizes = sizes.filter(s => selectedIdSet.has(s.id));
  const allowedSaleIds = new Set(selectedSizes.map(s => s.id));
  const excludedSales = draft?.sales.filter(s => !allowedSaleIds.has(s.sizeId)) ?? [];
  const excludedPrices = draft?.proposalPrices.filter(s => !allowedSaleIds.has(s.sizeId)) ?? [];
  const saved = scenarios.data ?? [];
  const update = (fn: (v: ScenarioInput) => ScenarioInput) => { setDraft(current => current ? fn(current) : current); setDirty(true); setResult(null); setProposal(null); };
  const editField = <K extends keyof ScenarioInput>(key: K, value: ScenarioInput[K]) => update(v => ({ ...v, [key]: value }));
  const selectScenario = (s: SavedScenario) => { setActiveId(s.id); setDraft(structuredClone(s.input)); setDirty(false); setResult(null); setProposal(null); };
  const newScenario = () => { setActiveId(undefined); setDraft(inputs.data ? structuredClone(inputs.data.defaults) : emptyInput()); setDirty(true); setResult(null); setProposal(null); };
  const run = async () => {
    if (!draft || calculationLock.current) return;
    const requestInput = structuredClone(draft);
    const fingerprint = JSON.stringify(requestInput);
    calculationLock.current = true;
    setCalculation({ kind: "simulation", startedAt: Date.now() });
    try {
      const response = await simulate.mutateAsync(requestInput);
      if (serializedDraft.current !== fingerprint) {
        toast({ title: "Input modificati durante il calcolo", description: "Il risultato ricevuto è stato scartato. Ricalcola lo scenario.", variant: "destructive" });
        return;
      }
      setResult(response);
      setDirty(false);
    } catch (e) {
      toast({ title: "Simulazione non disponibile", description: e instanceof Error ? e.message : "Controlla i dati inseriti.", variant: "destructive" });
    } finally {
      calculationLock.current = false;
      setCalculation(null);
    }
  };
  const saveDraft = async () => { if (!draft) return; try { const savedScenario = await save.mutateAsync({ id: activeId, input: draft }); setActiveId(savedScenario.id); setDirty(false); toast({ title: "Scenario salvato" }); } catch (e) { toast({ title: "Salvataggio non riuscito", description: e instanceof Error ? e.message : "Riprova.", variant: "destructive" }); } };
  const requestProposal = async () => {
    if (!draft || calculationLock.current) return;
    const requestInput = structuredClone(draft);
    const fingerprint = JSON.stringify(requestInput);
    calculationLock.current = true;
    setCalculation({ kind: "proposal", startedAt: Date.now() });
    try {
      const response = await propose.mutateAsync(requestInput);
      if (serializedDraft.current !== fingerprint) {
        toast({ title: "Input modificati durante la proposta", description: "L'anteprima ricevuta è stata scartata.", variant: "destructive" });
        return;
      }
      setProposal(response);
    } catch (e) {
      toast({ title: "Proposta non disponibile", description: e instanceof Error ? e.message : "Riprova.", variant: "destructive" });
    } finally {
      calculationLock.current = false;
      setCalculation(null);
    }
  };
  const applyProposal = () => { if (!proposal) return; update(v => ({ ...v, sales: [...v.sales, ...proposal.proposedSales.map(x => ({ ...x, id: crypto.randomUUID() }))] })); setProposal(null); toast({ title: "Righe proposte aggiunte alla bozza", description: "Nessun ordine reale è stato creato." }); };
  const deleteScenario = async () => { if (!activeId || !confirm("Eliminare definitivamente questo scenario salvato?")) return; try { await remove.mutateAsync(activeId); newScenario(); toast({ title: "Scenario eliminato" }); } catch { toast({ title: "Eliminazione non riuscita", variant: "destructive" }); } };
  const duplicate = () => { if (!draft) return; update(v => ({ ...structuredClone(v), name: `${v.name} — copia` })); setActiveId(undefined); };
  const currentMonths = useMemo(() => draft ? Array.from({ length: draft.horizon }, (_, i) => { const n = draft.startYear * 12 + draft.startMonth - 1 + i; return { year: Math.floor(n / 12), month: n % 12 + 1 }; }) : [], [draft]);
  const canUse = !!draft && !!draft.name.trim() && !calculation && !simulate.isPending && !propose.isPending;

  if (inputs.isLoading) return <div className="sales-scenarios m-4 animate-pulse rounded-xl border border-slate-200 bg-white p-8 text-slate-500">Preparazione dei dati commerciali…</div>;
  if (inputs.isError || !draft) return <div className="sales-scenarios m-4 rounded-xl border border-red-200 bg-red-50 p-6 text-red-800"><b>Impossibile caricare gli input commerciali.</b><button className="ml-3 underline" onClick={() => inputs.refetch()}>Riprova</button></div>;

  return <TooltipProvider delayDuration={200}><section className="sales-scenarios mx-auto max-w-[1650px] space-y-3 p-2 md:p-3">
    {(excludedSales.length > 0 || excludedPrices.length > 0) && <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
      <b>Lo scenario contiene righe per taglie non selezionate o non più vendibili.</b>
      <p>La selezione commerciale comprende {selectedSizes.map(s => s.code).join(", ") || "nessuna taglia"}. Le nove taglie ammesse sono {SALES_SCENARIO_SIZE_CODES.join(", ")}. Nessuna riga è stata modificata automaticamente.</p>
      {excludedSales.length > 0 && <p>Modifica la taglia o elimina le righe del piano vendite: {excludedSales.map(s => `${monthLabel(s)} (taglia ID ${s.sizeId})`).join("; ")}. Il salvataggio e il calcolo saranno rifiutati finché queste righe non saranno corrette.</p>}
      {excludedPrices.length > 0 && <div className="mt-2">
        <p>{excludedPrices.length} prezzi automatici riguardano taglie escluse e non possono essere utilizzati.</p>
        <button type="button" className="mt-1 rounded border border-red-400 px-3 py-1 font-bold" onClick={() => update(v => ({ ...v, proposalPrices: v.proposalPrices.filter(p => allowedSaleIds.has(p.sizeId)) }))}>Rimuovi dalla bozza i prezzi delle taglie escluse</button>
      </div>}
    </div>}
    <header id="sales-scenario-top" className="scroll-mt-24 rounded-xl border border-teal-900 bg-[#123b47] px-4 py-4 text-stone-50 shadow-sm md:px-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-teal-200">Pianificazione commerciale</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight">Scenari di vendita</h1><p className="mt-1 max-w-2xl text-sm text-teal-100">Simula incassi e copertura senza generare ordini. Le disponibilità sono alternative, non additive.</p></div><div className="flex flex-wrap gap-2"><button onClick={newScenario} className="rounded-md border border-teal-200/40 px-3 py-2 text-sm font-bold hover:bg-white/10"><Plus className="mr-1 inline h-4 w-4" />Nuovo</button><button onClick={duplicate} disabled={!draft} className="rounded-md border border-teal-200/40 px-3 py-2 text-sm font-bold hover:bg-white/10"><Copy className="mr-1 inline h-4 w-4" />Duplica</button><ScenarioHelp text={help.save}><button onClick={saveDraft} disabled={!draft || save.isPending} className="rounded-md bg-[#e8b75d] px-3 py-2 text-sm font-extrabold text-slate-900 hover:bg-[#f0c773] disabled:opacity-50"><Save className="mr-1 inline h-4 w-4" />Salva</button></ScenarioHelp></div></div>
    </header>
    <div className="flex max-w-full overflow-x-auto border-b border-slate-200 px-1" role="tablist">{([["scenari","Scenari"],["confronto","Confronto"],["disponibilita","Disponibilità commerciale"]] as const).map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`shrink-0 border-b-2 px-3 py-2 text-sm font-bold ${tab === id ? "border-teal-700 text-teal-800" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{label}</button>)}</div>
    {tab === "scenari" && <div className="grid min-w-0 gap-3 xl:grid-cols-[270px_minmax(0,1fr)]">
      <aside className="min-w-0 rounded-xl border border-slate-200 bg-white p-3"><div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-extrabold">Salvati</h2><span className="mono text-xs text-slate-500">{saved.length}</span></div>{scenarios.isLoading ? <p className="text-sm text-slate-500">Caricamento…</p> : saved.length === 0 ? <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">Nessuno scenario salvato.</p> : <div className="space-y-1">{saved.map(s => <button key={s.id} onClick={() => selectScenario(s)} className={`w-full rounded-md border px-3 py-2 text-left text-sm ${activeId === s.id ? "border-teal-600 bg-teal-50 text-teal-900" : "border-transparent hover:bg-slate-50"}`}><b className="block truncate">{s.name}</b><span className="text-xs text-slate-500">agg. {new Date(s.updatedAt).toLocaleDateString("it-IT")}</span></button>)}</div>}</aside>
      <div className="min-w-0 space-y-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 md:p-4"><div className="grid gap-3 md:grid-cols-4"><Field label="Nome scenario" help={help.name}><input value={draft.name} onChange={e => editField("name", e.target.value)} placeholder="es. Vendite primavera" /></Field><Field label="Inizio (Roma)" help={help.start}><div tabIndex={0} role="textbox" aria-readonly="true" className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-slate-700">{monthLabel(draft)}</div></Field><Field label="Orizzonte" help={help.horizon}><select value={draft.horizon} onChange={e => { const next = parse(e.target.value); const end = draft.startYear * 12 + draft.startMonth - 1 + next; const outside = [...draft.sales, ...draft.sandNursery, draft.cashDeadline].some(r => r.year * 12 + r.month - 1 >= end); if (outside && !confirm("Ridurre l'orizzonte rimuoverà le righe fuori periodo e riporterà la scadenza entro i limiti. Continuare?")) return; update(v => ({ ...v, horizon: next, sales: v.sales.filter(r => r.year * 12 + r.month - 1 < end), sandNursery: v.sandNursery.filter(r => r.year * 12 + r.month - 1 < end), cashDeadline: v.cashDeadline.year * 12 + v.cashDeadline.month - 1 < end ? v.cashDeadline : { year: Math.floor((end - 1) / 12), month: (end - 1) % 12 + 1 } })); }}>{[6,9,12,15,18,24].map(v => <option key={v} value={v}>{v} mesi</option>)}</select></Field><Field label="Obiettivo cassa" help={help.cashGoal}><input type="number" min="0" value={draft.cashGoal || ""} onChange={e => editField("cashGoal", parse(e.target.value))} /></Field></div><div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 md:grid-cols-5"><Factor label="Crescita attesa" help={help.growth} value={draft.growthFactor} onChange={v => editField("growthFactor", v)} /><Factor label="Crescita prudente" help={help.prudentGrowth} value={draft.prudentGrowthFactor} onChange={v => editField("prudentGrowthFactor", v)} /><Factor label="Mortalità attesa" help={help.mortality} value={draft.mortalityMultiplier} onChange={v => editField("mortalityMultiplier", v)} /><Factor label="Mortalità prudente" help={help.prudentMortality} value={draft.prudentMortalityMultiplier} onChange={v => editField("prudentMortalityMultiplier", v)} /><Factor label="Schiuditoio prudente" help={help.prudentHatchery} value={draft.prudentHatcheryFactor} onChange={v => editField("prudentHatcheryFactor", v)} /></div><SizeSelection draft={draft} sizes={sizes} selectedIds={selectedSizeIds} update={update} /></div>
        <SalesTable draft={draft} sizes={selectedSizes} months={currentMonths} update={update} />
        <div className="grid gap-3 lg:grid-cols-2"><NurseryPlan draft={draft} months={currentMonths} update={update} /><ProposalForm draft={draft} sizes={selectedSizes} months={currentMonths} update={update} onPropose={requestProposal} calculation={calculation} /></div>
        {dirty && <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"><AlertTriangle className="h-4 w-4 shrink-0" /><b>Risultato non aggiornato.</b> Hai modificato gli input: ricalcola prima di usare la proiezione.</div>}
        {calculation?.kind === "simulation" && <ScenarioCalculationProgress kind="simulation" startedAt={calculation.startedAt} />}
        <div className="flex flex-wrap justify-between gap-2"><button onClick={deleteScenario} disabled={!activeId || remove.isPending} className="rounded-md px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-40"><Trash2 className="mr-1 inline h-4 w-4" />Elimina</button><ScenarioHelp text={help.recalculate}><button onClick={run} disabled={!canUse} className="rounded-md bg-teal-700 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-800 disabled:opacity-50">{simulate.isPending ? <Loader2 className="mr-1 inline h-4 w-4 motion-safe:animate-spin" /> : <RefreshCw className="mr-1 inline h-4 w-4" />}Ricalcola scenario</button></ScenarioHelp></div>
        {proposal && !calculation && <ProposalPreview proposal={proposal} onApply={applyProposal} onClose={() => setProposal(null)} />}
        {result && <ResultPanel result={result} cashGoal={draft.cashGoal} />}
      </div>
    </div>}
    {tab === "confronto" && <Comparison scenarios={saved} selected={compareIds} setSelected={setCompareIds} />}
    {tab === "disponibilita" && <CommercialAvailabilityMatrix result={result} sizes={selectedSizes} draft={draft} />}
  </section></TooltipProvider>;
}

function Field({ label, help: helpText, children }: { label: string; help?: string; children: React.ReactElement }) { return <label className="block text-xs font-bold text-slate-600">{label}<div className="mt-1 [&_input]:w-full [&_input]:rounded-md [&_input]:border [&_input]:border-slate-300 [&_input]:px-2 [&_input]:py-1.5 [&_select]:w-full [&_select]:rounded-md [&_select]:border [&_select]:border-slate-300 [&_select]:bg-white [&_select]:px-2 [&_select]:py-1.5">{helpText ? <ScenarioHelp text={helpText}>{children}</ScenarioHelp> : children}</div></label>; }
function Factor({ label, help: helpText, value, onChange }: { label: string; help: string; value: number; onChange: (v: number) => void }) { return <Field label={label} help={helpText}><input type="number" min="0" max="5" step=".05" value={value} onChange={e => onChange(parse(e.target.value))} /></Field>; }
function SizeSelection({ draft, sizes, selectedIds, update }: { draft: ScenarioInput; sizes: { id: number; code: string; name: string; pricePerThousand: number | null }[]; selectedIds: number[]; update: (fn: (v: ScenarioInput) => ScenarioInput) => void }) {
  const selected = new Set(selectedIds);
  const toggle = (size: typeof sizes[number]) => {
    if (selected.has(size.id)) {
      if (selectedIds.length <= 1) return;
      update(v => ({ ...v, selectedSizeIds: selectedIds.filter(id => id !== size.id), sales: v.sales.filter(row => row.sizeId !== size.id), proposalPrices: v.proposalPrices.filter(row => row.sizeId !== size.id) }));
    } else {
      update(v => ({ ...v, selectedSizeIds: [...selectedIds, size.id], proposalPrices: size.pricePerThousand != null && size.pricePerThousand > 0 && !v.proposalPrices.some(row => row.sizeId === size.id) ? [...v.proposalPrices, { sizeId: size.id, pricePerThousand: size.pricePerThousand, paymentDelayMonths: 0 }] : v.proposalPrices }));
    }
  };
  return <div className="mt-3 border-t border-slate-100 pt-3"><div className="flex items-center gap-2"><h2 className="text-xs font-extrabold uppercase tracking-wide text-slate-600">Taglie commerciali dello scenario</h2><ScenarioHelp text={help.selectedSizes}><span className="cursor-help text-xs text-slate-400">?</span></ScenarioHelp></div><div className="mt-2 flex flex-wrap gap-2">{sizes.map(size => <label key={size.id} className={`cursor-pointer rounded-md border px-2.5 py-1.5 text-xs font-bold ${selected.has(size.id) ? "border-teal-600 bg-teal-50 text-teal-900" : "border-slate-200 bg-white text-slate-500"}`}><input className="mr-1.5" type="checkbox" checked={selected.has(size.id)} disabled={selected.has(size.id) && selectedIds.length <= 1} onChange={() => toggle(size)} />{size.code}</label>)}</div><p className="mt-1.5 text-xs text-slate-500">Selezionate {selectedIds.length} di {sizes.length}. Deve restarne almeno una.</p></div>;
}
function MonthSelect({ value, months: allowed, onChange, help: helpText }: { value: { year: number; month: number }; months: { year: number; month: number }[]; onChange: (v: { year: number; month: number }) => void; help: string }) { const options = allowed.length ? allowed : [value]; return <ScenarioHelp text={helpText}><select value={`${value.year}-${value.month}`} onChange={e => { const [year, month] = e.target.value.split("-").map(Number); onChange({ year, month }); }}>{options.map(m => <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>{monthLabel(m)}</option>)}</select></ScenarioHelp>; }
function SalesTable({ draft, sizes, months, update }: { draft: ScenarioInput; sizes: { id: number; code: string; name: string; pricePerThousand: number | null }[]; months: { year: number; month: number }[]; update: (fn: (v: ScenarioInput) => ScenarioInput) => void }) {
  const change = (id: string, patch: Partial<ScenarioSale>) => update(v => ({ ...v, sales: v.sales.map(row => row.id === id ? { ...row, ...patch } : row) }));
  const add = () => { const size = sizes[0]; if (!size || !months[0]) return; update(v => ({ ...v, sales: [...v.sales, { id: crypto.randomUUID(), ...months[0], sizeId: size.id, quantity: 0, pricePerThousand: size.pricePerThousand, paymentDelayMonths: 0 }] })); };
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-3 py-2"><div><h2 className="text-sm font-extrabold">Piano vendite manuale</h2><p className="text-xs text-slate-500">Quantità animali, prezzo per 1.000 e incasso differito.</p></div><button onClick={add} disabled={!sizes.length} className="rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-40"><Plus className="mr-1 inline h-3.5 w-3.5" />Riga</button></div><div className="max-h-[360px] overflow-auto"><table className="table-sticky w-full min-w-[800px] text-left text-sm"><thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-3 py-2">Mese</th><th className="px-3 py-2">Taglia</th><th className="px-3 py-2">Quantità</th><th className="px-3 py-2">Prezzo / 1.000</th><th className="px-3 py-2">Ritardo incasso</th><th className="w-10" /></tr></thead><tbody>{draft.sales.length === 0 ? <tr><td colSpan={6} className="px-3 py-7 text-center text-slate-500">Nessuna vendita pianificata. Aggiungi una riga oppure genera una proposta.</td></tr> : draft.sales.map(row => <tr key={row.id} className="border-t border-slate-100 bg-white"><td className="px-3 py-1.5"><MonthSelect help={help.saleMonth} value={row} months={months} onChange={v => change(row.id, v)} /></td><td className="px-3 py-1.5"><ScenarioHelp text={help.size}><select aria-label="Taglia" value={row.sizeId} onChange={e => { const size = sizes.find(x => x.id === parse(e.target.value)); change(row.id, { sizeId: parse(e.target.value), pricePerThousand: size?.pricePerThousand ?? null }); }}>{sizes.map(x => <option key={x.id} value={x.id}>{x.code} — {x.name}</option>)}</select></ScenarioHelp></td><td className="px-3 py-1.5"><ScenarioHelp text={help.quantity}><input aria-label="Quantità animali" className="w-32 rounded border border-slate-300 px-2 py-1" type="number" min="0" step="1" value={row.quantity || ""} onChange={e => change(row.id, { quantity: parse(e.target.value) })} /></ScenarioHelp></td><td className="px-3 py-1.5"><ScenarioHelp text={help.price}><input aria-label="Euro per mille animali" className="w-32 rounded border border-slate-300 px-2 py-1" type="number" min="0" value={row.pricePerThousand ?? ""} onChange={e => change(row.id, { pricePerThousand: e.target.value === "" ? null : parse(e.target.value) })} /></ScenarioHelp></td><td className="px-3 py-1.5"><ScenarioHelp text={help.delay}><input aria-label="Mesi di ritardo pagamento" className="w-20 rounded border border-slate-300 px-2 py-1" type="number" min="0" max="24" value={row.paymentDelayMonths} onChange={e => change(row.id, { paymentDelayMonths: parse(e.target.value) })} /></ScenarioHelp></td><td><button aria-label="Rimuovi riga" onClick={() => update(v => ({ ...v, sales: v.sales.filter(x => x.id !== row.id) }))} className="p-2 text-slate-400 hover:text-red-700"><X className="h-4 w-4" /></button></td></tr>)}</tbody></table></div></div>;
}
function NurseryPlan({ draft, months, update }: { draft: ScenarioInput; months: { year: number; month: number }[]; update: (fn: (v: ScenarioInput) => ScenarioInput) => void }) { return <div className="rounded-xl border border-slate-200 bg-white p-3"><h2 className="text-sm font-extrabold">Piano Sand Nursery</h2><p className="mb-2 text-xs text-slate-500">Animali programmati per mese.</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{months.map(m => { const r = draft.sandNursery.find(x => x.year === m.year && x.month === m.month); return <label key={`${m.year}-${m.month}`} className="text-xs font-bold text-slate-600">{monthLabel(m)}<ScenarioHelp text={help.nursery}><input aria-label={`Animali Sand Nursery ${monthLabel(m)}`} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 font-normal" type="number" min="0" step="1" value={r?.quantity || ""} onChange={e => update(v => ({ ...v, sandNursery: [...v.sandNursery.filter(x => x.year !== m.year || x.month !== m.month), { ...m, quantity: parse(e.target.value) }].filter(x => x.quantity > 0) }))} /></ScenarioHelp></label>; })}</div></div>; }
function ProposalForm({ draft, sizes, months, update, onPropose, calculation }: {
  draft: ScenarioInput;
  sizes: { id: number; code: string; name: string; pricePerThousand: number | null }[];
  months: { year: number; month: number }[];
  update: (fn: (v: ScenarioInput) => ScenarioInput) => void;
  onPropose: () => void;
  calculation: { kind: "proposal" | "simulation"; startedAt: number } | null;
}) {
  const loading = calculation?.kind === "proposal";
  return <div className="rounded-xl border border-amber-200 bg-[#fffaf0] p-3">
    <div className="flex justify-between gap-2"><div><h2 className="text-sm font-extrabold">Proposta automatica</h2><p className="text-xs text-slate-600">Crea solo righe in anteprima, mai ordini reali.</p></div><Sparkles className="h-5 w-5 text-amber-700" /></div>
    <div className="mt-3 grid grid-cols-2 gap-2">
      <Field label="Obiettivo entro" help={help.proposalDeadline}><MonthSelect help={help.proposalDeadline} value={draft.cashDeadline} months={months} onChange={v => update(x => ({ ...x, cashDeadline: v }))} /></Field>
      <Field label="Obiettivo cassa" help={help.cashGoal}><input type="number" min="0" value={draft.cashGoal || ""} onChange={e => update(x => ({ ...x, cashGoal: parse(e.target.value) }))} /></Field>
    </div>
    <div className="mt-2 max-h-28 overflow-auto border-t border-amber-100 pt-2">{sizes.map(size => {
      const row = draft.proposalPrices.find(p => p.sizeId === size.id);
      return <div className="grid grid-cols-[1fr_100px_55px] gap-1 py-1 text-xs" key={size.id}>
        <span className="self-center font-bold">{size.code}</span>
        <ScenarioHelp text={help.proposalPrice}><input aria-label={`Prezzo ${size.code}`} className="rounded border border-amber-200 bg-white px-1.5 py-1" type="number" min="0" value={row?.pricePerThousand ?? size.pricePerThousand ?? ""} onChange={e => update(v => ({ ...v, proposalPrices: [...v.proposalPrices.filter(x => x.sizeId !== size.id), { sizeId: size.id, pricePerThousand: parse(e.target.value), paymentDelayMonths: row?.paymentDelayMonths ?? 0 }] }))} /></ScenarioHelp>
        <ScenarioHelp text={help.proposalDelay}><input aria-label={`Ritardo ${size.code}`} className="rounded border border-amber-200 bg-white px-1.5 py-1" type="number" min="0" max="24" step="1" value={row?.paymentDelayMonths ?? 0} onChange={e => update(v => ({ ...v, proposalPrices: [...v.proposalPrices.filter(x => x.sizeId !== size.id), { sizeId: size.id, pricePerThousand: row?.pricePerThousand ?? size.pricePerThousand ?? 0, paymentDelayMonths: parse(e.target.value) }] }))} /></ScenarioHelp>
      </div>;
    })}</div>
    {calculation?.kind === "proposal" && <div className="mt-3"><ScenarioCalculationProgress kind="proposal" startedAt={calculation.startedAt} /></div>}
    <ScenarioHelp text={help.generate}><button onClick={onPropose} disabled={!!calculation || !draft.cashGoal} aria-busy={loading} className="mt-3 w-full rounded-md bg-amber-500 px-3 py-2 text-sm font-extrabold text-slate-900 hover:bg-amber-400 disabled:opacity-50">
      {loading ? <><Loader2 aria-hidden="true" className="mr-2 inline h-4 w-4 motion-safe:animate-spin" />Calcolo in corso…</> : "Genera proposta"}
    </button></ScenarioHelp>
  </div>;
}
function ProposalPreview({ proposal, onApply, onClose }: { proposal: ScenarioProposal; onApply: () => void; onClose: () => void }) { return <div className="rounded-xl border border-amber-300 bg-amber-50 p-3"><div className="flex justify-between gap-3"><div><h3 className="font-extrabold text-amber-950">Anteprima proposta</h3><p className="text-xs text-amber-900">{proposal.method}. Le righe saranno aggiunte solo alla bozza.</p></div><button onClick={onClose}><X className="h-4 w-4" /></button></div><div className="mono mt-2 max-h-28 overflow-auto text-xs text-amber-950">{proposal.proposedSales.map(s => <div key={s.id}>{monthLabel(s)} · {quantity.format(s.quantity)} animali · {euro.format(s.pricePerThousand ?? 0)} / 1.000</div>)}</div><ScenarioHelp text={help.apply}><button onClick={onApply} className="mt-3 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-bold text-white"><Check className="mr-1 inline h-4 w-4" />Applica alla bozza</button></ScenarioHelp></div>; }
function ResultPanel({ result, cashGoal }: { result: ScenarioResult; cashGoal: number }) { const columns = [{ label: "Atteso", data: result.expected }, { label: "Prudente", data: result.prudent }]; return <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-3"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-sm font-extrabold">Esito ricalcolato</h2><p className="text-xs text-slate-600">Generato {new Date(result.generatedAt).toLocaleString("it-IT")}</p></div><span className="rounded-full bg-teal-100 px-2 py-1 text-xs font-bold text-teal-900">Disponibilità alternativa</span></div><div className="grid gap-3 md:grid-cols-2">{columns.map(c => <div key={c.label} className="rounded-lg border border-slate-200 bg-white p-3"><h3 className="mb-2 text-sm font-extrabold">{c.label}</h3><div className="grid grid-cols-2 gap-2"><Metric label="Incassi" value={euro.format(c.data.totalReceipts)} /><Metric label="Entro obiettivo" value={euro.format(c.data.receiptsByDeadline)} /><Metric label="Stock finale" value={quantity.format(c.data.finalStock)} /><Metric label="Scoperto ordini" value={quantity.format(c.data.totalOrderShortfall)} caution={c.data.totalOrderShortfall > 0} /></div><p className={`mt-2 text-xs font-bold ${c.data.goalReached ? "text-teal-700" : "text-amber-700"}`}>{c.data.goalReached ? "Obiettivo cassa raggiunto" : `Obiettivo residuo: ${euro.format(Math.max(0, cashGoal - c.data.receiptsByDeadline))}`}</p></div>)}</div>{result.warnings.length > 0 && <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-sm text-amber-950"><b><AlertTriangle className="mr-1 inline h-4 w-4" />Avvisi</b><ul className="mt-1 list-disc pl-5">{result.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></div>}</div>; }
function Comparison({ scenarios, selected, setSelected }: { scenarios: SavedScenario[]; selected: number[]; setSelected: (ids: number[]) => void }) {
  const actions = useSalesScenarioActions();
  const [comparison, setComparison] = useState<{ ids: number[]; results: Record<number, ScenarioResult> } | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toggle = (id: number) => {
    setSelected(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
    setComparison(null);
    setProgress(null);
    setError(null);
  };
  const calculate = async () => {
    if (calculating) return;
    const chosen = selected.map(id => scenarios.find(s => s.id === id)).filter((s): s is SavedScenario => !!s);
    if (chosen.length < 2) return;
    setCalculating(true);
    setComparison(null);
    setError(null);
    try {
      const results = await calculateScenarioComparison(chosen, input => actions.simulate.mutateAsync(input),
        (index, total, name) => setProgress(`Ricalcolo ${index} di ${total}: ${name}…`));
      setComparison({ ids: chosen.map(s => s.id), results });
      setProgress(`Confronto aggiornato: ${chosen.length} scenari ricalcolati.`);
    } catch (e) {
      setProgress(null);
      setError(comparisonErrorMessage(e));
    } finally {
      setCalculating(false);
    }
  };
  const metrics: [string, (result: ScenarioResult) => string][] = [
    ["Incassi attesi", r => euro.format(r.expected.totalReceipts)],
    ["Incassi prudenti", r => euro.format(r.prudent.totalReceipts)],
    ["Stock finale prudente", r => quantity.format(r.prudent.finalStock)],
    ["Scoperto prudente", r => quantity.format(r.prudent.totalOrderShortfall)],
  ];
  return <div className="rounded-xl border border-slate-200 bg-white p-4">
    <h2 className="text-lg font-extrabold">Confronto scenari salvati</h2>
    <p className="mb-3 text-sm text-slate-500">Seleziona almeno due scenari: ogni colonna viene ricalcolata sui dati correnti, uno scenario alla volta.</p>
    {scenarios.length < 2 ? <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">Salva almeno due scenari per confrontarli.</p> : <>
      <div className="flex flex-wrap gap-2">{scenarios.map(s => <label key={s.id} className={`cursor-pointer rounded-md border px-3 py-2 text-sm ${selected.includes(s.id) ? "border-teal-600 bg-teal-50" : "border-slate-200"}`}><ScenarioHelp text={help.scenarioSelection}><input aria-label={`Confronta ${s.name}`} className="mr-2" type="checkbox" checked={selected.includes(s.id)} disabled={calculating} onChange={() => toggle(s.id)} /></ScenarioHelp>{s.name}</label>)}</div>
      <button type="button" onClick={calculate} disabled={selected.length < 2 || calculating} className="mt-3 rounded-md bg-teal-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">{calculating ? <><Loader2 className="mr-1 inline h-4 w-4 animate-spin" />Ricalcolo in corso…</> : "Ricalcola confronto"}</button>
      {progress && <p role="status" className="mt-3 text-sm font-medium text-teal-800">{progress}</p>}
      {error && <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">Confronto non aggiornato: {error}</p>}
      {comparison && <div className="mt-4 overflow-auto"><table className="w-full min-w-[600px] text-sm"><thead><tr className="border-b text-left"><th className="p-2">Indicatore</th>{comparison.ids.map(id => <th className="p-2" key={id}>{scenarios.find(s => s.id === id)?.name}</th>)}</tr></thead><tbody>{metrics.map(([label, fn]) => <tr className="border-b" key={label}><td className="p-2 font-bold">{label}</td>{comparison.ids.map(id => <td className="mono p-2" key={id}>{fn(comparison.results[id])}</td>)}</tr>)}</tbody></table></div>}
    </>}
  </div>;
}