import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { animals, dateForMonth, dateLabel, inputMonths, monthLabel } from "@/lib/commercial-availability-format";
import type { CommercialInput, CommercialInputs, CommercialResult, CommercialSale } from "@shared/commercial-availability";

export function CommercialPlan({ input, sizes, result, current, referenceDate, change, reveal, initialSale, clearInitial }: {
  input: CommercialInput; sizes: CommercialInputs["sizes"]; result: CommercialResult | null; current: boolean; referenceDate: string;
  change: (sales: CommercialSale[]) => void; reveal: (id: number) => void; initialSale: CommercialSale | null; clearInitial: () => void;
}) {
  const [editing, setEditing] = useState<CommercialSale | null>(null);
  const sale = initialSale ?? editing;
  const [error, setError] = useState("");
  const open = (value: CommercialSale) => { clearInitial(); setEditing({ ...value }); setError(""); };
  const close = () => { setEditing(null); clearInitial(); setError(""); };
  const update = (patch: Partial<CommercialSale>) => { const next = { ...sale!, ...patch }; if (initialSale) { clearInitial(); } setEditing(next); };
  const submit = () => {
    if (!sale) return;
    const date = dateForMonth(sale, sale.day ?? 1);
    if (!Number.isInteger(sale.quantity) || sale.quantity <= 0 || sale.quantity > 2_000_000_000 || (sale.day ?? 1) > new Date(sale.year, sale.month, 0).getDate() || date < referenceDate) { setError("Inserisci una quantità intera positiva e una data valida, non precedente alla data di riferimento."); return; }
    change([...input.sales.filter(row => row.id !== sale.id), sale]); close();
  };
  const hidden = input.sales.filter(row => !input.selectedSizeIds.includes(row.sizeId));
  return <section className="ca-panel"><div className="ca-row"><div><h2>Piano commerciale</h2><p className="ca-muted">Le vendite vengono validate insieme. Nessun ordine reale viene creato.</p></div><button className="ca-button" onClick={() => open({ id: crypto.randomUUID(), year: input.startYear, month: input.startMonth, day: Number(referenceDate.slice(8, 10)), sizeId: sizes[0]?.id, quantity: 1 })} disabled={!sizes.length}><Plus size={15} />Aggiungi vendita</button></div>
    {hidden.length > 0 && <div className="ca-note warning">{hidden.length} vendite in taglie nascoste restano nel piano e consumano disponibilità. <button className="underline font-bold" onClick={() => hidden.forEach(row => reveal(row.sizeId))}>Mostra le taglie del piano</button></div>}
    {input.sales.length === 0 ? <div className="ca-empty"><h2>Il piano è ancora libero.</h2><p>Scegli una capacità nella matrice oppure aggiungi una vendita.<br />Quantità, taglia e data saranno verificate in un unico replay.</p></div> : <div className="ca-table-wrap"><table className="ca-table"><thead><tr><th>Data</th><th>Taglia</th><th>Richiesti</th><th>Verifica congiunta</th><th>Azioni</th></tr></thead><tbody>{input.sales.map(row => {
      const applied = current ? result?.plan.find(r => r.id === row.id) : undefined;
      return <tr key={row.id}><td>{row.day ? dateLabel(dateForMonth(row, row.day)) : monthLabel(row)}</td><td>{sizes.find(s => s.id === row.sizeId)?.code ?? `Taglia ${row.sizeId}`}{!input.selectedSizeIds.includes(row.sizeId) && <span className="ca-tag warning block">Fuori filtro</span>}</td><td className="ca-mono">{animals(row.quantity)}</td><td>{applied ? <><span className={`ca-tag ${applied.shortfall ? "warning" : ""}`}>{applied.shortfall ? "Non soddisfatta" : "Validata"}</span><p>{animals(applied.acceptedQuantity)} accettati{applied.shortfall > 0 ? ` · ${animals(applied.shortfall)} mancanti` : ""}</p></> : <span className="ca-muted">Da verificare</span>}</td><td><div className="ca-actions"><button className="ca-button" aria-label={`Modifica o sposta vendita ${row.id}`} onClick={() => open(row)}><Pencil size={14} /><span>Modifica / sposta</span></button><button className="ca-button danger" aria-label={`Elimina vendita ${row.id}`} onClick={() => { if (confirm("Eliminare questa vendita simulata?")) change(input.sales.filter(s => s.id !== row.id)); }}><Trash2 size={14} /></button></div></td></tr>;
    })}</tbody></table></div>}
    <Dialog open={!!sale} onOpenChange={value => { if (!value) close(); }}><DialogContent className="commercial-workspace ca-panel ca-modal"><DialogTitle>{input.sales.some(s => s.id === sale?.id) ? "Modifica o sposta la vendita" : "Nuova vendita simulata"}</DialogTitle><DialogDescription>La verifica aggiornerà anche tutte le taglie e i mesi successivi.</DialogDescription>{sale && <form onSubmit={e => { e.preventDefault(); submit(); }}><div className="ca-grid">
      <label className="ca-field">Mese<select value={`${sale.year}-${sale.month}`} onChange={e => { const [year, month] = e.target.value.split("-").map(Number); update({ year, month, day: 1 }); }}>{inputMonths(input).map(m => <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>{monthLabel(m)}</option>)}</select></label>
      <label className="ca-field">Giorno<input type="number" min={1} max={new Date(sale.year, sale.month, 0).getDate()} required value={sale.day ?? 1} onChange={e => update({ day: Number(e.target.value) })} /></label>
      <label className="ca-field">Taglia<select value={sale.sizeId} onChange={e => update({ sizeId: Number(e.target.value) })}>{sizes.map(s => <option key={s.id} value={s.id}>{s.code}</option>)}</select></label>
      <label className="ca-field">Animali<input type="number" min={1} max={2_000_000_000} step={1} required value={sale.quantity} onChange={e => update({ quantity: Number(e.target.value) })} /></label>
    </div>{error && <div role="alert" className="ca-note error">{error}</div>}<div className="ca-actions mt-5"><button type="submit" className="ca-button primary">Applica alla bozza</button><button type="button" className="ca-button" onClick={close}>Annulla</button></div></form>}</DialogContent></Dialog>
  </section>;
}