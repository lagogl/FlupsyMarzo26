import { useEffect, useRef, useState } from "react";
import { Copy, Plus, RefreshCw, Save, Snowflake, Trash2 } from "lucide-react";
import { useCommercialActions, useCommercialInputs, useCommercialLibrary } from "@/hooks/use-commercial-availability";
import { useToast } from "@/hooks/use-toast";
import { getEuropeRomeDateKey } from "@/lib/queryClient";
import { dateLabel, frozenDraftNotice, monthLabel, responseMatchesDraft } from "@/lib/commercial-availability-format";
import { AvailabilityExplorer } from "@/components/commercial-availability/AvailabilityExplorer";
import { CommercialControls } from "@/components/commercial-availability/CommercialControls";
import { CommercialPlan } from "@/components/commercial-availability/CommercialPlan";
import { CommercialSummary } from "@/components/commercial-availability/CommercialSummary";
import { CommercialComparison } from "@/components/commercial-availability/CommercialComparison";
import type { CommercialInput, CommercialResult, CommercialSale, FrozenCommercialSummary, SavedCommercialScenario } from "@shared/commercial-availability";
import "@/styles/commercial-availability.css";

type Tab = "explore" | "plan" | "compare" | "library";
export default function DisponibilitaCommerciale() {
  const inputs = useCommercialInputs(), library = useCommercialLibrary(), actions = useCommercialActions();
  const { toast } = useToast();
  const [draft, setDraft] = useState<CommercialInput | null>(null);
  const [activeId, setActiveId] = useState<number>();
  const [result, setResult] = useState<CommercialResult | null>(null);
  const [previous, setPrevious] = useState<CommercialResult | null>(null);
  const [tab, setTab] = useState<Tab>("explore");
  const [summary, setSummary] = useState<FrozenCommercialSummary | null>(null);
  const [summaryNotice, setSummaryNotice] = useState("");
  const [sale, setSale] = useState<CommercialSale | null>(null);
  const [error, setError] = useState("");
  const [calculation, setCalculation] = useState(false);
  const [compareId, setCompareId] = useState("");
  const [compared, setCompared] = useState<CommercialResult | null>(null);
  const [comparing, setComparing] = useState(false);
  const [today, setToday] = useState(getEuropeRomeDateKey);
  const liveDraft = useRef<CommercialInput | null>(null);
  const revision = useRef(0), sequence = useRef(0), comparisonSequence = useRef(0);
  const acceptedRevision = useRef(-1);
  const latestResult = useRef<CommercialResult | null>(null);
  const initialized = useRef(false);
  const simulateRef = useRef(actions.simulate.mutateAsync);
  simulateRef.current = actions.simulate.mutateAsync;
  const report = (e: unknown) => e instanceof Error ? e.message : "Operazione non riuscita. Riprova.";
  const replace = (value: CommercialInput, id?: number) => {
    revision.current++; comparisonSequence.current++; liveDraft.current = structuredClone(value);
    setDraft(liveDraft.current); setActiveId(id); setCompared(null); setError(""); setSale(null);
  };
  const change = (patch: Partial<CommercialInput>) => {
    if (!liveDraft.current) return;
    revision.current++; comparisonSequence.current++; liveDraft.current = { ...liveDraft.current, ...patch };
    setDraft(liveDraft.current); setCompared(null); setError("");
  };
  const run = async (value = liveDraft.current) => {
    if (!value) return;
    const request = ++sequence.current, version = revision.current;
    const snapshot = structuredClone(value);
    setCalculation(true); setError("");
    try {
      const next = await simulateRef.current(snapshot);
      if (request !== sequence.current) return;
      if (!responseMatchesDraft(request, sequence.current, version, revision.current)) { setError("La bozza è cambiata durante il calcolo. Il risultato tardivo è stato scartato: ricalcola."); return; }
      setPrevious(latestResult.current); latestResult.current = next;
      acceptedRevision.current = version; setResult(next);
    } catch (e) { if (request === sequence.current && version === revision.current) setError(report(e)); }
    finally { if (request === sequence.current) setCalculation(false); }
  };
  useEffect(() => {
    if (!inputs.data || initialized.current) return;
    initialized.current = true;
    const value = { ...structuredClone(inputs.data.defaults), name: inputs.data.defaults.name || "Disponibilità da oggi" };
    liveDraft.current = value; setDraft(value); void run(value);
  }, [inputs.data]);
  useEffect(() => {
    const refresh = () => setToday(getEuropeRomeDateKey());
    const interval = setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(interval); window.removeEventListener("focus", refresh); sequence.current++; comparisonSequence.current++; };
  }, []);
  const current = !!result && acceptedRevision.current === revision.current && result.referenceDate === today;
  const saved = library.scenarios.data ?? [];
  const sizes = inputs.data?.sizes ?? [];
  const visibleSizes = sizes.filter(s => draft?.selectedSizeIds.includes(s.id));
  const save = async () => {
    if (!draft) return;
    const version = revision.current;
    try { const s = await actions.save.mutateAsync({ id: activeId, input: structuredClone(draft) }); if (version === revision.current) setActiveId(s.id); toast({ title: "Bozza salvata", description: "Nessun impegno operativo creato." }); }
    catch (e) { setError(report(e)); }
  };
  const duplicate = async () => {
    if (!draft) return;
    const version = revision.current;
    try {
      // Persist the actual current draft, including any unsaved edits, as a new scenario.
      const copy = await actions.save.mutateAsync({ input: { ...structuredClone(draft), name: `${draft.name.slice(0, 110)} — copia` } });
      if (version === revision.current) replace(copy.input, copy.id);
      toast({ title: "Copia salvata" });
    } catch (e) { setError(report(e)); }
  };
  const freeze = async () => {
    if (!draft || !current || !result?.valid) return;
    const version = revision.current, snapshot = structuredClone(draft);
    try {
      const frozen = await actions.freeze.mutateAsync(snapshot);
      const unchanged = version === revision.current;
      const notice = frozenDraftNotice(version, revision.current);
      setSummary(frozen); setSummaryNotice(notice); setTab("library");
      toast({ title: unchanged ? "Riepilogo congelato" : "Riepilogo storico salvato", description: notice || "Verifica eseguita nuovamente sul server." });
    } catch (e) {
      if (version === revision.current) setError(report(e));
      else toast({ title: "Congelamento della bozza precedente non riuscito", description: report(e), variant: "destructive" });
    }
  };
  const select = (s: SavedCommercialScenario) => { replace(s.input, s.id); setTab("explore"); };
  const compare = async () => {
    const s = saved.find(s => String(s.id) === compareId);
    if (!s) { setCompared(null); return; }
    const request = ++comparisonSequence.current, version = revision.current;
    setComparing(true); setError("");
    try { const comparison = await simulateRef.current(structuredClone(s.input)); if (responseMatchesDraft(request, comparisonSequence.current, version, revision.current)) setCompared(comparison); }
    catch (e) { if (request === comparisonSequence.current) setError(report(e)); }
    finally { setComparing(false); }
  };
  const replan = async () => {
    if (!draft) return;
    const version = revision.current;
    try {
      let id = activeId;
      // Save an independent source copy so replan never overwrites a historical scenario.
      const source = await actions.save.mutateAsync({ input: { ...structuredClone(draft), name: `${draft.name.slice(0, 100)} — origine copia` } });
      id = source.id;
      const copied = await actions.replan.mutateAsync(id);
      if (version === revision.current) replace(copied.input, copied.id);
      toast({ title: "Copia ripianificata da oggi", description: "Lo scenario storico e i riepiloghi restano invariati." });
    } catch (e) { setError(report(e)); }
  };
  if (inputs.isLoading || (!draft && !inputs.isError)) return <section className="commercial-workspace" aria-busy="true"><h1>Disponibilità commerciale</h1><p>Preparazione dei dati commerciali…</p>{[1,2,3,4].map(i => <div className="ca-skeleton" style={{ width: `${90 - i * 10}%`, height: i === 3 ? 180 : 22 }} key={i} />)}</section>;
  if (inputs.isError || !draft) return <section className="commercial-workspace"><h1>Disponibilità commerciale</h1><div role="alert" className="ca-note error">Impossibile caricare le fonti commerciali. {report(inputs.error)}</div><button className="ca-button" onClick={() => inputs.refetch()}>Riprova</button></section>;
  const rollover = `${draft.startYear}-${String(draft.startMonth).padStart(2, "0")}` !== today.slice(0, 7);
  return <section className="commercial-workspace">
    <header className="ca-header"><div><span className="ca-eyebrow">Pianificazione / Quantità</span><h1>Disponibilità commerciale</h1><p className="ca-muted">Esplora cosa proporre. Verifica cosa vendere insieme.</p><p className="ca-mono ca-muted">Dati: {dateLabel(result?.referenceDate ?? inputs.data!.referenceDate)} · Calcolo: {result ? new Date(result.generatedAt).toLocaleString("it-IT", { timeZone: "Europe/Rome" }) : "non eseguito"} · Inizio: {monthLabel({ year: draft.startYear, month: draft.startMonth })}</p></div>
      <div className="ca-actions"><span className={`ca-tag ${current ? "" : "warning"}`}>{current ? "Risultato aggiornato" : "Bozza da verificare"}</span><button className="ca-button" onClick={() => replace({ ...structuredClone(inputs.data!.defaults), name: "Nuova disponibilità" })}><Plus size={15} />Nuovo</button><button className="ca-button" disabled={actions.save.isPending} onClick={duplicate}><Copy size={15} />Duplica</button><button className="ca-button" disabled={actions.save.isPending || !draft.name.trim()} onClick={save}><Save size={15} />Salva bozza</button></div>
    </header>
    {rollover && <div className="ca-note warning">Questo scenario parte da un mese precedente. I risultati storici non vengono cambiati. <button className="ca-button" disabled={actions.replan.isPending || actions.save.isPending} onClick={replan}>Crea copia ripianificata da oggi</button></div>}
    {!draft.includeOrders && <div className="ca-note warning"><b>Scenario senza vincolo ordini.</b> Le disponibilità non proteggono gli impegni acquisiti. Questa dicitura accompagna anche il riepilogo e le esportazioni.</div>}
    <CommercialControls input={draft} sizes={sizes} change={change} />
    <div className="ca-row"><div aria-live="polite">{calculation ? <><p className="font-bold text-sm">Calcolo in corso · puoi continuare a modificare la bozza</p><div className="ca-skeleton" style={{ width: 230 }} /></> : <p className="ca-muted">{current ? `Replay completato in ${(result!.calculationMs / 1000).toLocaleString("it-IT", { maximumFractionDigits: 2 })} s.` : "Modifiche non ancora verificate. Le quantità precedenti non sono utilizzabili come piano valido."}</p>}</div><div className="ca-actions"><button className="ca-button primary" disabled={!draft.name.trim() || rollover} onClick={() => run()}><RefreshCw size={15} />{calculation ? "Ricalcola questa bozza" : "Verifica disponibilità e piano"}</button><button className="ca-button" disabled={!current || !result?.valid || actions.freeze.isPending || rollover} onClick={freeze}><Snowflake size={15} />{actions.freeze.isPending ? "Congelamento in corso…" : "Prepara riepilogo commerciale"}</button></div></div>
    {error && <div role="alert" className="ca-note error">{error}<button className="ml-3 underline font-bold" onClick={() => run()}>Riprova il calcolo</button></div>}
    {current && result && !result.valid && <div role="alert" className="ca-note error"><b>Il piano non è realizzabile congiuntamente.</b> Correggi le vendite non soddisfatte. Non è possibile congelarlo come riepilogo valido.</div>}
    {current && result && result.baselineOrderShortfall > 0 && <div className="ca-note warning">Scoperti ordini già presenti nella base: {result.baselineOrderShortfall.toLocaleString("it-IT")} animali. Non rappresentano capacità per nuove vendite.</div>}
    {[...new Set([...(inputs.data?.warnings ?? []), ...(current ? result?.warnings ?? [] : [])])].map(w => <div className="ca-note warning" key={w}>{w}</div>)}
    <nav className="ca-tabs" aria-label="Viste commerciali" role="tablist">{([["explore", "Esplora disponibilità"], ["plan", `Piano commerciale (${draft.sales.length})`], ["compare", "Confronto"], ["library", "Scenari e riepiloghi"]] as const).map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}</button>)}</nav>
    {tab === "explore" && (result ? <AvailabilityExplorer result={result} sizes={visibleSizes} current={current} add={s => { setSale(s); setTab("plan"); }} /> : <div className="ca-empty"><h2>Le possibilità iniziano dalle fonti.</h2><p>Verifica la bozza per esplorare le capacità alternative.</p></div>)}
    {tab === "plan" && <CommercialPlan input={draft} sizes={sizes} result={result} current={current} referenceDate={inputs.data!.referenceDate} change={sales => change({ sales })} reveal={id => { if (liveDraft.current && !liveDraft.current.selectedSizeIds.includes(id)) change({ selectedSizeIds: [...liveDraft.current.selectedSizeIds, id] }); }} initialSale={sale} clearInitial={() => setSale(null)} />}
    {tab === "compare" && <><section className="ca-panel"><div className="ca-actions"><label className="ca-field">Confronta con<select value={compareId} onChange={e => { comparisonSequence.current++; setCompareId(e.target.value); setCompared(null); }}><option value="">Base senza vendite simulate</option>{saved.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><button className="ca-button" disabled={!compareId || comparing || !current} onClick={compare}>{comparing ? "Calcolo confronto…" : "Ricalcola confronto"}</button></div>{previous && <p className="ca-muted">Ultimo piano calcolato: {previous.totalAccepted.toLocaleString("it-IT")} animali accettati. Piano attuale: {current ? result?.totalAccepted.toLocaleString("it-IT") : "da verificare"}.</p>}</section>{current && result ? <CommercialComparison result={result} compared={compared} sizes={visibleSizes} /> : <div className="ca-note warning">Verifica prima la bozza corrente per confrontare risultati aggiornati.</div>}</>}
    {tab === "library" && <><section className="ca-panel"><h2>Scenari salvati</h2><p className="ca-muted">Le bozze conservano gli input. Aprirle non aggiorna risultati storici o riepiloghi.</p>{library.scenarios.isLoading ? <div className="ca-skeleton" /> : library.scenarios.isError ? <div className="ca-note error">Scenari non disponibili. <button className="underline" onClick={() => library.scenarios.refetch()}>Riprova</button></div> : saved.length === 0 ? <div className="ca-empty">Nessuno scenario salvato. Salva la bozza per ritrovarla qui.</div> : saved.map(s => <div className="ca-row border-t py-3" key={s.id}><div><b className="text-sm">{s.name}</b><p className="ca-muted">Aggiornato {dateLabel(String(s.updatedAt))}{s.id === activeId ? " · bozza aperta" : ""}</p></div><div className="ca-actions"><button className="ca-button" onClick={() => select(s)}>Apri bozza</button><button className="ca-button" disabled={actions.duplicate.isPending} onClick={async () => { try { await actions.duplicate.mutateAsync(s.id); toast({ title: "Scenario duplicato" }); } catch (e) { setError(report(e)); } }}><Copy size={14} />Duplica salvato</button><button className="ca-button danger" disabled={actions.remove.isPending} aria-label={`Elimina scenario ${s.name}`} onClick={async () => { if (!confirm(`Eliminare la bozza "${s.name}"? I riepiloghi congelati restano disponibili.`)) return; try { await actions.remove.mutateAsync(s.id); if (activeId === s.id) setActiveId(undefined); } catch (e) { setError(report(e)); } }}><Trash2 size={14} /></button></div></div>)}</section>
      <section className="ca-panel"><h2>Riepiloghi congelati</h2>{library.summaries.isLoading ? <div className="ca-skeleton" /> : library.summaries.isError ? <div className="ca-note error">Riepiloghi non disponibili. <button className="underline" onClick={() => library.summaries.refetch()}>Riprova</button></div> : !(library.summaries.data?.length) ? <p className="ca-muted">Nessun riepilogo congelato. Prepara un riepilogo dopo la verifica congiunta del piano.</p> : <div className="ca-actions mt-3">{library.summaries.data.map(s => <button className="ca-button" key={s.id} onClick={() => { setSummary(s); setSummaryNotice(""); }}>{s.name} · {dateLabel(String(s.createdAt))}</button>)}</div>}</section>{summary && <CommercialSummary summary={summary} notice={summaryNotice} />}</>}
    <footer className="ca-muted text-xs mt-6">Previsione condizionata alle ipotesi, non una garanzia produttiva. Nessuna vendita, semina o prenotazione operativa viene registrata.</footer>
  </section>;
}