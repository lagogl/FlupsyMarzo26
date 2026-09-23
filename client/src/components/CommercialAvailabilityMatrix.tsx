import { useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import type { ScenarioInput, ScenarioProjection, ScenarioResult } from "@shared/sales-scenarios";
import { SALES_SCENARIO_SIZE_CODES } from "@shared/sales-scenario-size-policy";
import { availabilityForSize, estimatedSalesValue, peakAlternativeOpportunity, priceForSize, type CommercialSize } from "@/components/commercial-availability-utils";

const monthNames = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const amount = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 });
const exactAmount = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 2 });
const money = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const exactMoney = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
const monthLabel = (month: { year: number; month: number }) => `${monthNames[month.month - 1]} ${month.year}`;

export function CommercialAvailabilityMatrix({ result, sizes, draft }: { result: ScenarioResult | null; sizes: CommercialSize[]; draft: Pick<ScenarioInput, "proposalPrices"> }) {
  const [mode, setMode] = useState<"prudent" | "expected">("prudent");
  const commercialSizes = useMemo(() => SALES_SCENARIO_SIZE_CODES.map((code) => sizes.find((size) => size.code === code)).filter((size): size is CommercialSize => Boolean(size)), [sizes]);
  const projection: ScenarioProjection | null = result ? result[mode] : null;
  const peak = projection ? peakAlternativeOpportunity(projection.months, commercialSizes, draft) : null;
  const availableMonths = projection?.months.filter((month) => commercialSizes.some((size) => availabilityForSize(month, size) > 0)).length ?? 0;

  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <header className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">Disponibilità commerciale</h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">Ogni cella è un&apos;alternativa commerciale: non sommare mesi o taglie. Il valore è una <b>stima di vendita</b>, non un incasso.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="rounded-md bg-slate-100 p-1" role="group" aria-label="Modalità disponibilità">
          <button type="button" onClick={() => setMode("prudent")} aria-pressed={mode === "prudent"} className={`rounded px-3 py-1.5 text-xs font-bold ${mode === "prudent" ? "bg-[#123b47] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Prudente</button>
          <button type="button" onClick={() => setMode("expected")} aria-pressed={mode === "expected"} className={`rounded px-3 py-1.5 text-xs font-bold ${mode === "expected" ? "bg-[#123b47] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Atteso</button>
        </div>
        <button onClick={() => projection && exportCsv(projection, commercialSizes, draft, mode, result?.generatedAt ?? "")} disabled={!projection} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"><FileDown className="mr-1 inline h-4 w-4" />CSV</button>
      </div>
    </header>
    {!projection ? <div className="m-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">Ricalcola uno scenario per visualizzare la matrice commerciale.</div> : <>
      <div className="grid gap-2 border-b border-slate-100 bg-[#f7faf8] p-3 md:grid-cols-3">
        <Summary label="Modalità" value={mode === "prudent" ? "Prudente" : "Atteso"} detail="Le quantità seguono questa ipotesi." />
        <Summary label="Mesi disponibili" value={amount.format(availableMonths)} detail={`su ${amount.format(projection.months.length)} mesi di scenario`} />
        <Summary label="Massima quantità in una singola cella" value={peak ? `${amount.format(peak.animals)} animali` : "—"} detail={peak ? `${peak.size.code} · ${monthLabel(peak.month)}${peak.value === null ? " · non valorizzato" : ` · ${money.format(peak.value)} stimati`}` : "Nessuna disponibilità"} />
      </div>
      <div className="max-h-[600px] overflow-auto">
        <table className="w-full min-w-[1280px] border-separate border-spacing-0 text-left text-sm">
          <caption className="sr-only">Matrice disponibilità commerciale {mode}: animali e valore stimato per mese e taglia.</caption>
          <thead className="sticky top-0 z-20 bg-[#eaf1ee] text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th scope="col" className="sticky left-0 z-30 min-w-36 border-b border-r border-slate-200 bg-[#eaf1ee] px-3 py-3">Mese</th>
              {commercialSizes.map((size) => <th key={size.id} scope="col" className="min-w-32 border-b border-r border-slate-200 px-3 py-3 text-center"><span className="block font-extrabold text-[#123b47]">{size.code}</span><span className="normal-case font-medium text-slate-500">animali · valore</span></th>)}
              <th scope="col" className="min-w-32 border-b border-slate-200 px-3 py-3">Scoperto ordini</th>
            </tr>
          </thead>
          <tbody>
            {projection.months.map((month) => <tr key={`${month.year}-${month.month}`} className="group">
              <th scope="row" className="sticky left-0 z-10 border-b border-r border-slate-200 bg-white px-3 py-3 font-extrabold capitalize text-slate-800 group-hover:bg-[#f7faf8]">{monthLabel(month)}</th>
              {commercialSizes.map((size) => <AvailabilityCell key={size.id} animals={availabilityForSize(month, size)} price={priceForSize(size, draft)} size={size.code} month={monthLabel(month)} />)}
              <td className={`border-b border-slate-200 px-3 py-3 font-mono font-bold ${month.orderShortfall > 0 ? "bg-red-50 text-red-800" : "text-slate-400"}`}>{month.orderShortfall > 0 ? <><span aria-label={`${exactAmount.format(month.orderShortfall)} animali scoperti`}>{amount.format(month.orderShortfall)}</span><span className="sr-only"> animali scoperti</span></> : "—"}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
      <footer className="border-t border-slate-100 px-4 py-3 text-xs text-slate-600">Prezzo: proposta dello scenario se impostato, altrimenti listino catalogo. Senza prezzo la cella resta <b>non valorizzata</b>; non equivale a zero.</footer>
    </>}
  </section>;
}

function Summary({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-md border border-slate-200 bg-white px-3 py-2"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-0.5 font-mono text-base font-extrabold text-slate-800">{value}</p><p className="text-xs text-slate-500">{detail}</p></div>;
}

function AvailabilityCell({ animals, price, size, month }: { animals: number; price: number | null; size: string; month: string }) {
  const value = estimatedSalesValue(animals, price);
  const exact = `${exactAmount.format(animals)} animali${value === null ? "; valore stimato non valorizzato: prezzo non disponibile" : `; valore stimato ${exactMoney.format(value)}`}`;
  return <td className="border-b border-r border-slate-200 px-3 py-2.5 text-right align-middle" title={exact}>
    <span className="sr-only">{month}, {size}: {exact}</span>
    <div aria-hidden="true" className={`font-mono font-extrabold ${animals > 0 ? "text-[#0d5b58]" : "text-slate-400"}`}>{amount.format(animals)}</div>
    <div aria-hidden="true" className={`mt-0.5 text-xs font-semibold ${value === null ? "text-amber-800" : "text-slate-500"}`}>{value === null ? "non valorizzato" : money.format(value)}</div>
  </td>;
}

function exportCsv(projection: ScenarioProjection, sizes: CommercialSize[], draft: Pick<ScenarioInput, "proposalPrices">, mode: "prudent" | "expected", generatedAt: string) {
  const lines = [`# Generato il;${generatedAt}`, `# Modalità;${mode === "prudent" ? "Prudente" : "Atteso"}`, "# AVVISO;Disponibilità alternative, non additive", "Mese;Codice taglia;Nome taglia;Modalità;Quantità animali;Prezzo €/1.000;Valore stimato vendite;Stato valore;Scoperto ordini mensile"];
  projection.months.forEach((month) => sizes.forEach((size) => {
    const animals = availabilityForSize(month, size);
    const price = priceForSize(size, draft);
    const value = estimatedSalesValue(animals, price);
    lines.push([monthLabel(month), size.code, size.name, mode === "prudent" ? "Prudente" : "Atteso", animals, price ?? "", value ?? "", value === null ? "Non valorizzato: prezzo assente" : "Stimato", month.orderShortfall].join(";"));
  }));
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" }));
  anchor.download = `disponibilita-commerciale-${mode}.csv`;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}