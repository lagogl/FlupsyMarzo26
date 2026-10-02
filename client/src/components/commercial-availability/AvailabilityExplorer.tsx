import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { animals, dateForMonth, dateLabel, monthLabel } from "@/lib/commercial-availability-format";
import type { CommercialInputs, CommercialResult, CommercialSale } from "@shared/commercial-availability";
import type { ScenarioMonth } from "@shared/sales-scenarios";

type Cell = { month: ScenarioMonth; size: CommercialInputs["sizes"][number] };
export function AvailabilityExplorer({ result, sizes, current, add }: { result: CommercialResult; sizes: CommercialInputs["sizes"]; current: boolean; add: (sale: CommercialSale) => void }) {
  const [detail, setDetail] = useState<Cell | null>(null);
  const quantity = (cell: Cell) => cell.month.availableBySize[String(cell.size.id)];
  const day = (cell: Cell) => cell.month.availabilityDayBySize?.[String(cell.size.id)];
  const cellButton = (cell: Cell) => {
    const value = quantity(cell), reachedDay = day(cell);
    return <button className="ca-cell" onClick={() => setDetail(cell)} aria-label={`${cell.size.code}, ${monthLabel(cell.month)}: ${value == null ? "dato mancante" : `${animals(value)} animali`}${reachedDay ? ` dal ${reachedDay}` : ""}`}>
      <strong className="ca-mono">{value == null ? "n.d." : animals(value)}</strong>
      <small>{value == null ? "Dato non disponibile" : value === 0 ? "Nessuna capacità" : reachedDay ? `Dal ${dateLabel(dateForMonth(cell.month, reachedDay))}` : "Data non disponibile"}</small>
      {result.hatcheryDependent && value > 0 && <small>Con arrivi previsionali</small>}
    </button>;
  };
  return <>
    <div className="ca-note"><b>Massimi alternativi, non sommabili.</b> Ogni cella propone un'alternativa: gli stessi animali possono diventare taglie diverse nei mesi successivi. Solo il piano commerciale verifica insieme le vendite.</div>
    <div className="ca-table-wrap ca-desktop-matrix"><table className="ca-table ca-matrix"><caption className="sr-only">Capacità alternative per taglia e mese, dopo il piano simulato</caption><thead><tr><th scope="col">Taglia / animali</th>{result.months.map(m => <th scope="col" key={`${m.year}-${m.month}`}>{monthLabel(m)}</th>)}</tr></thead><tbody>{sizes.map(size => <tr key={size.id}><th scope="row">{size.code}</th>{result.months.map(m => <td key={`${m.year}-${m.month}`}>{cellButton({ size, month: m })}</td>)}</tr>)}</tbody></table></div>
    <div className="ca-mobile-matrix">{sizes.map(size => <section className="ca-panel" key={size.id}><h2>{size.code}</h2>{result.months.map(m => <div className="ca-row" key={`${m.year}-${m.month}`}><span>{monthLabel(m)}</span><div>{cellButton({ size, month: m })}</div></div>)}</section>)}</div>
    <Dialog open={!!detail} onOpenChange={open => { if (!open) setDetail(null); }}><DialogContent className="commercial-workspace ca-modal ca-panel"><DialogTitle>Disponibilità {detail?.size.code}</DialogTitle><DialogDescription>Una possibilità alternativa, non una prenotazione di animali.</DialogDescription>{detail && <>
      <h2>{monthLabel(detail.month)} · {quantity(detail) == null ? "Dato mancante" : `${animals(quantity(detail))} animali`}</h2>
      <p>Quantità raggiungibile {day(detail) ? `dal ${dateLabel(dateForMonth(detail.month, day(detail)!))}` : "in una data non disponibile"}. Non attribuita automaticamente all'inizio del mese.</p>
      <p>Ordini del mese richiesti: {animals(detail.month.ordersRequested)}. Scoperto: {animals(detail.month.orderShortfall)}.</p>
      {result.hatcheryDependent && <div className="ca-note warning">Scenario con arrivi futuri previsionali. La capacità è condizionata a questi arrivi.</div>}
      <div className="ca-note">Base senza vendite simulate: {(() => { const base = result.baselineMonths.find(m => m.year === detail.month.year && m.month === detail.month.month)?.availableBySize[String(detail.size.id)]; return base == null ? "dato non disponibile" : `${animals(base)} animali`; })()}.</div>
      <button className="ca-button primary" disabled={!current || !day(detail) || !(quantity(detail) > 0)} onClick={() => { add({ id: crypto.randomUUID(), year: detail.month.year, month: detail.month.month, sizeId: detail.size.id, day: day(detail), quantity: quantity(detail) }); setDetail(null); }}>Prova una vendita da questa cella</button>
      {!current && <p>Ricalcola la bozza prima di utilizzare questa quantità.</p>}
    </>}</DialogContent></Dialog>
  </>;
}