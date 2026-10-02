import { inputMonths, monthLabel, setVisibleSize } from "@/lib/commercial-availability-format";
import type { CommercialInput, CommercialInputs } from "@shared/commercial-availability";

export function CommercialControls({ input, sizes, change }: { input: CommercialInput; sizes: CommercialInputs["sizes"]; change: (patch: Partial<CommercialInput>) => void }) {
  return <section className="ca-panel"><div className="ca-grid">
    <label className="ca-field">Nome della bozza<input maxLength={120} value={input.name} onChange={e => change({ name: e.target.value })} /></label>
    <label className="ca-field">Orizzonte<select value={input.horizon} onChange={e => {
      const horizon = Number(e.target.value) as CommercialInput["horizon"];
      const end = input.startYear * 12 + input.startMonth - 1 + horizon;
      if ([...input.sales, ...input.hatcheryOverrides].some(r => r.year * 12 + r.month - 1 >= end)) { alert("Sono presenti vendite o arrivi fuori dal nuovo orizzonte. Spostali o rimuovili esplicitamente prima di ridurlo; nessuna riga è stata eliminata."); return; }
      change({ horizon });
    }}>{[6, 12, 24].map(n => <option key={n} value={n}>{n} mesi</option>)}</select></label>
    <div className="ca-field"><span>Fonti incluse</span><label className="ca-actions"><input type="checkbox" checked={input.includeOrders} onChange={e => change({ includeOrders: e.target.checked })} />Ordini futuri acquisiti</label><label className="ca-actions"><input type="checkbox" checked={input.includeHatchery} onChange={e => change({ includeHatchery: e.target.checked })} />Arrivi futuri schiuditoio</label></div>
  </div><div className="mt-4"><span className="ca-field mb-2">Taglie visibili · il filtro non elimina vendite, ordini o animali</span><div className="ca-actions">{sizes.map(size => <label key={size.id} className={`ca-size ${input.selectedSizeIds.includes(size.id) ? "selected" : ""}`}><input type="checkbox" checked={input.selectedSizeIds.includes(size.id)} disabled={input.selectedSizeIds.length === 1 && input.selectedSizeIds.includes(size.id)} onChange={e => change({ selectedSizeIds: setVisibleSize(input, size.id, e.target.checked).selectedSizeIds })} />{size.code}</label>)}</div></div>
    <details className="mt-4 border-t pt-3"><summary className="cursor-pointer text-xs font-bold">Ipotesi avanzate · solo copie di scenario</summary><p className="ca-muted">I fattori moltiplicano le regole biologiche esistenti. Gli arrivi già avvenuti restano in inventario. Nessuna modifica alla produzione reale.</p>
      <div className="ca-grid mt-3"><label className="ca-field">Fattore crescita (0–2)<input type="number" min={0} max={2} step={.05} value={input.growthFactor} onChange={e => change({ growthFactor: Number(e.target.value) })} /></label><label className="ca-field">Moltiplicatore mortalità (0–5)<input type="number" min={0} max={5} step={.05} value={input.mortalityMultiplier} onChange={e => change({ mortalityMultiplier: Number(e.target.value) })} /></label></div>
      <h2 className="mt-5">Arrivi futuri per mese</h2><p className="ca-muted">Vuoto: programma base. Zero: nessun arrivo residuo. La quantità sostituisce il residuo futuro, non il totale lordo.</p>
      {!input.includeHatchery && <div className="ca-note">Arrivi futuri esclusi: le copie sono conservate ma non applicate.</div>}
      <div className="ca-grid mt-3">{inputMonths(input).map(m => {
        const row = input.hatcheryOverrides.find(r => r.year === m.year && r.month === m.month);
        return <label className="ca-field" key={`${m.year}-${m.month}`}>{monthLabel(m)}<input type="number" min={0} max={2_000_000_000} step={1} placeholder="Programma base" value={row?.quantity ?? ""} onChange={e => change({ hatcheryOverrides: [...input.hatcheryOverrides.filter(r => r.year !== m.year || r.month !== m.month), ...(e.target.value === "" ? [] : [{ ...m, quantity: Number(e.target.value) }])] })} /></label>;
      })}</div><p className="mt-3 ca-muted">La distribuzione delle vendite per taglia, mese e giorno si modifica nel Piano commerciale.</p>
    </details>
  </section>;
}