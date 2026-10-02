import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { animals, dateForMonth, dateLabel, monthLabel } from "@/lib/commercial-availability-format";
import { cellShortfall, cellMortality, monthlyMortality, matrixMagnitude, magnitudePercent } from "@/lib/commercial-availability-cells";
import type { CommercialInputs, CommercialResult, CommercialSale, CommercialMonth } from "@shared/commercial-availability";

type Cell = { month: CommercialMonth; size: CommercialInputs["sizes"][number] };
function MonthlyMortalitySummary({ month, visibleSizeIds }: { month: CommercialMonth; visibleSizeIds: number[] }) {
  const mortality = monthlyMortality(month, visibleSizeIds);
  const display = (value: number | undefined) => value == null ? "n.d." : animals(value);
  return <div className="ca-month-mortality">
    <div className="ca-month-mortality-total"><span>Morti totali</span><strong className="ca-mono">{display(mortality?.total)}</strong></div>
    <dl>
      <div><dt>Taglie fisiche visibili</dt><dd className="ca-mono">{display(mortality?.visible)}</dd></div>
      <div><dt>Altre taglie fisiche</dt><dd className="ca-mono">{display(mortality?.other)}</dd></div>
      <div><dt>Non classificati</dt><dd className="ca-mono">{display(mortality?.unclassified)}</dd></div>
    </dl>
    {mortality && mortality.unclassified > 0 && <p className="ca-mortality-range-note">Non classificati: animali fuori dagli intervalli delle taglie fisiche configurate.</p>}
    {!mortality && <p className="ca-mortality-range-note">Mortalità non disponibile per questo risultato. Ricalcola la bozza.</p>}
  </div>;
}
export function AvailabilityExplorer({ result, sizes, current, add }: { result: CommercialResult; sizes: CommercialInputs["sizes"]; current: boolean; add: (sale: CommercialSale) => void }) {
  const [detail, setDetail] = useState<Cell | null>(null);
  const quantity = (cell: Cell) => cell.month.availableBySize[String(cell.size.id)];
  const day = (cell: Cell) => cell.month.availabilityDayBySize?.[String(cell.size.id)];
  const visibleSizeIds = sizes.map(s => s.id);
  const maximum = matrixMagnitude(result.months, visibleSizeIds);
  const cellButton = (cell: Cell) => {
    const value = quantity(cell), reachedDay = day(cell);
    const shortfall = cellShortfall(cell.month, cell.size.id);
    const missing = shortfall ? shortfall.orders + shortfall.sales : undefined;
    const mortality = cellMortality(cell.month, cell.size.id);
    return <button className="ca-cell" onClick={() => setDetail(cell)} aria-label={`${cell.size.code}, ${monthLabel(cell.month)}: ${value == null ? "dato mancante" : `${animals(value)} animali`}${reachedDay ? ` dal ${reachedDay}` : ""}${missing != null && missing > 0 ? `; mancano ${animals(missing)} animali per ordini inclusi e vendite simulate` : ""}; ${mortality == null ? "mortalità della sola taglia fisica non disponibile" : `morti previsti nel mese (sola taglia fisica): ${animals(mortality)} animali`}${!current ? "; risultato da verificare" : ""}`}>
      <strong className="ca-mono">{value == null ? "n.d." : animals(value)}</strong>
      {value != null && <span className="ca-cell-bar" aria-hidden="true"><span className="ca-capacity-bar-fill" data-quantity={value} style={{ width: `${magnitudePercent(value, maximum)}%` }} /></span>}
      <small>{value == null ? "Dato non disponibile" : value === 0 ? "Nessuna capacità" : reachedDay ? `Dal ${dateLabel(dateForMonth(cell.month, reachedDay))}` : "Data non disponibile"}</small>
      {missing != null && missing > 0 && <><small className="ca-cell-shortfall">Mancano {animals(missing)}</small><span className="ca-cell-bar ca-deficit-track" aria-hidden="true"><span className="ca-shortfall-bar-fill" data-quantity={missing} style={{ width: `${magnitudePercent(missing, maximum)}%` }} /></span></>}
      <small className="ca-cell-mortality">{mortality == null ? "Mortalità n.d. (sola taglia fisica)" : <>Morti previsti nel mese (sola taglia fisica): <b className="ca-mono">{animals(mortality)}</b></>}</small>
      {result.hatcheryDependent && value > 0 && <small>Con arrivi previsionali</small>}
    </button>;
  };
  return <>
    <div className="ca-note"><b>Massimi alternativi, non sommabili.</b> Ogni cella propone un'alternativa: gli stessi animali possono diventare taglie diverse nei mesi successivi. Solo il piano commerciale verifica insieme le vendite.</div>
    <p className="ca-muted ca-bar-legend">Barre su scala comune alle celle visibili: verde = disponibilità aggiuntiva; rosso = quantità mancante alle date richieste. {maximum > 0 && <>Barra piena: {animals(maximum)} animali.</>}{!current && <> Dati del calcolo precedente, da verificare.</>}</p>
    <div className="ca-table-wrap ca-desktop-matrix"><table className="ca-table ca-matrix"><caption className="sr-only">Capacità alternative per taglia e mese, dopo il piano simulato, e morti previsti nell'intera popolazione</caption><thead><tr><th scope="col">Taglia / animali</th>{result.months.map(m => <th scope="col" key={`${m.year}-${m.month}`}>{monthLabel(m)}</th>)}</tr></thead><tbody>
      <tr className="ca-mortality-summary-row"><th scope="row">Morti previsti nel mese<small>Intera popolazione · animali<br />Già inclusi nella disponibilità, non da sottrarre.<br />Non sono la differenza tra i massimi mensili.</small></th>{result.months.map(m => <td key={`${m.year}-${m.month}`}><MonthlyMortalitySummary month={m} visibleSizeIds={visibleSizeIds} /></td>)}</tr>
      {sizes.map(size => <tr key={size.id}><th scope="row">{size.code}</th>{result.months.map(m => <td key={`${m.year}-${m.month}`}>{cellButton({ size, month: m })}</td>)}</tr>)}</tbody></table></div>
    <div className="ca-mobile-matrix">
      <section className="ca-panel ca-mobile-mortality-summary"><h2>Morti previsti nel mese</h2><p className="ca-muted">Intera popolazione · animali. Già inclusi nella disponibilità, non da sottrarre. Non sono la differenza tra i massimi mensili.</p>{result.months.map(m => <div className="ca-mobile-mortality-month" key={`${m.year}-${m.month}`}><h3>{monthLabel(m)}</h3><MonthlyMortalitySummary month={m} visibleSizeIds={visibleSizeIds} /></div>)}</section>
      {sizes.map(size => <section className="ca-panel" key={size.id}><h2>{size.code}</h2>{result.months.map(m => <div className="ca-row" key={`${m.year}-${m.month}`}><span>{monthLabel(m)}</span><div>{cellButton({ size, month: m })}</div></div>)}</section>)}</div>
    <Dialog open={!!detail} onOpenChange={open => { if (!open) setDetail(null); }}><DialogContent className="commercial-workspace ca-modal ca-panel"><DialogTitle>Disponibilità {detail?.size.code}</DialogTitle><DialogDescription>Una possibilità alternativa, non una prenotazione di animali.</DialogDescription>{detail && <>
      <h2>{monthLabel(detail.month)} · {quantity(detail) == null ? "Dato mancante" : `${animals(quantity(detail))} animali`}</h2>
      <p>Quantità raggiungibile {day(detail) ? `dal ${dateLabel(dateForMonth(detail.month, day(detail)!))}` : "in una data non disponibile"}. Non attribuita automaticamente all'inizio del mese.</p>
      <p><b>Totali del mese · tutte le taglie:</b> ordini richiesti {animals(detail.month.ordersRequested)} animali; scoperto ordini {animals(detail.month.orderShortfall)} animali.</p>
      {(() => {
        const shortfall = cellShortfall(detail.month, detail.size.id);
        return shortfall ? <div className={shortfall.orders + shortfall.sales > 0 ? "ca-note error" : "ca-note"}>
          <p>Ordini inclusi non coperti · {detail.size.code}: {animals(shortfall.orders)} animali.</p>
          <p>Vendite simulate non soddisfatte · {detail.size.code}: {animals(shortfall.sales)} animali.</p>
          <p>Quantità mancante per questa taglia e questo mese, alle date delle richieste. Non è una disponibilità negativa né uno scoperto cumulativo dei mesi precedenti.</p>
        </div> : <p>Mancanze non disponibili per questo risultato storico. Ricalcola la bozza per verificarle.</p>;
      })()}
      <section className="ca-detail-mortality"><h3>Morti previsti nel mese · intera popolazione</h3><MonthlyMortalitySummary month={detail.month} visibleSizeIds={visibleSizeIds} />
        <p>Zero morti nella sola taglia fisica non significa zero mortalità nella popolazione: i decessi possono riguardare altre taglie o animali non classificati.</p>
        <p>La mortalità è già inclusa nella disponibilità: non sottrarre di nuovo questi animali. Il totale dei decessi mensili non è la differenza aritmetica tra i massimi di capacità dei mesi, che sono alternative non sommabili.</p>
        <p>Moltiplicatore mortalità applicato: ×{result.input.mortalityMultiplier.toLocaleString("it-IT")}. Dove il tasso non è disponibile, si usa il tasso mensile di ripiego del 3%, moltiplicato per questo coefficiente; non è un 3% aggiuntivo applicato sempre.</p>
        <p>Nel mese corrente la previsione parte dalla data dei dati, non include decessi già osservati.</p>
      </section>
      {(() => {
        const mortality = cellMortality(detail.month, detail.size.id);
        return mortality == null ? <p>Mortalità della sola taglia fisica non disponibile per questo risultato storico. Ricalcola la bozza per verificarla.</p> : <div className="ca-note">
          <p className="ca-mortality-value"><b>Morti previsti nel mese (sola taglia fisica): {animals(mortality)} animali.</b></p>
          <p>Decessi simulati attribuiti alla taglia fisica dopo la crescita, con il piano e gli ordini inclusi nel calcolo. Non è la quantità mancante e non è una percentuale.</p>
        </div>;
      })()}
      {result.hatcheryDependent && <div className="ca-note warning">Scenario con arrivi futuri previsionali. La capacità è condizionata a questi arrivi.</div>}
      <div className="ca-note">Base senza vendite simulate: {(() => { const base = result.baselineMonths.find(m => m.year === detail.month.year && m.month === detail.month.month)?.availableBySize[String(detail.size.id)]; return base == null ? "dato non disponibile" : `${animals(base)} animali`; })()}.</div>
      <button className="ca-button primary" disabled={!current || !day(detail) || !(quantity(detail) > 0)} onClick={() => { add({ id: crypto.randomUUID(), year: detail.month.year, month: detail.month.month, sizeId: detail.size.id, day: day(detail), quantity: quantity(detail) }); setDetail(null); }}>Prova una vendita da questa cella</button>
      {!current && <p>Ricalcola la bozza prima di utilizzare questa quantità.</p>}
    </>}</DialogContent></Dialog>
  </>;
}