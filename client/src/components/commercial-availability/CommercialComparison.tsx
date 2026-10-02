import { animals, monthLabel } from "@/lib/commercial-availability-format";
import type { CommercialInputs, CommercialResult } from "@shared/commercial-availability";

export function CommercialComparison({ result, compared, sizes }: { result: CommercialResult; compared: CommercialResult | null; sizes: CommercialInputs["sizes"] }) {
  return <section className="ca-panel"><h2>{compared ? `Confronto con ${compared.input.name}` : "Confronto con la base senza vendite simulate"}</h2><p className="ca-muted">Differenze per singola alternativa, mai un totale delle capacità. La base usa le stesse ipotesi e inclusioni della bozza.</p>
    <div className="ca-note">Piano attuale: {animals(result.totalAccepted)} animali accettati di {animals(result.totalRequested)} richiesti. Scoperto ordini: {animals(result.baselineOrderShortfall)} nella base → {animals(result.orderShortfall)} dopo il piano.</div>
    {compared && <div className="ca-note">Scenario confrontato: {animals(compared.totalAccepted)} accettati di {animals(compared.totalRequested)} richiesti. {compared.valid ? "Piano valido." : "Piano non valido."} Ordini {compared.input.includeOrders ? "inclusi" : "esclusi"}; schiuditoio {compared.input.includeHatchery ? "incluso" : "escluso"}; crescita {compared.input.growthFactor}; mortalità {compared.input.mortalityMultiplier}.</div>}
    <div className="ca-table-wrap"><table className="ca-table"><thead><tr><th>Mese</th><th>Taglia</th><th>{compared ? "Confrontato" : "Base"}</th><th>Bozza attuale</th><th>Variazione</th></tr></thead><tbody>{result.months.flatMap(m => sizes.map(size => {
      const before = (compared?.months ?? result.baselineMonths).find(b => b.year === m.year && b.month === m.month)?.availableBySize[String(size.id)];
      const after = m.availableBySize[String(size.id)];
      return <tr key={`${m.year}-${m.month}-${size.id}`}><td>{monthLabel(m)}</td><td>{size.code}</td><td className="ca-mono">{before == null ? "n.d." : animals(before)}</td><td className="ca-mono">{after == null ? "n.d." : animals(after)}</td><td className="ca-mono">{before == null || after == null ? "Non confrontabile" : `${after - before > 0 ? "+" : ""}${animals(after - before)}`}</td></tr>;
    }))}</tbody></table></div>
  </section>;
}