import React, { useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createAvailabilityWorkbook } from "./commercial-availability-excel";
import { CommercialScenarioOverview } from "./CommercialScenarioOverview";
import type { ScenarioInput, ScenarioProjection, ScenarioResult } from "@shared/sales-scenarios";
import { availabilityDayForSize, availabilityForSize, eligibleAtStartForSize, estimatedSalesValue, orderCommitmentForMonth, peakAlternativeOpportunity, priceForSize, stockBeforeOrdersForSize, type CommercialSize } from "@/components/commercial-availability-utils";

const monthNames = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const amount = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 });
const exactAmount = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 2 });
const money = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const exactMoney = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
const monthLabel = (month: { year: number; month: number }) => `${monthNames[month.month - 1]} ${month.year}`;

export function CommercialAvailabilityMatrix({ result, sizes, draft }: { result: ScenarioResult | null; sizes: CommercialSize[]; draft: Pick<ScenarioInput, "proposalPrices"> }) {
  const [mode, setMode] = useState<"prudent" | "expected">("prudent");
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();
  const commercialSizes = useMemo(() => sizes, [sizes]);
  const projection: ScenarioProjection | null = result?.[mode].months.every(month => month.eligibleAtStartBySize && month.availabilityDayBySize)
    ? result[mode] : null;
  const peak = projection ? peakAlternativeOpportunity(projection.months, commercialSizes, draft) : null;
  const availableMonths = projection?.months.filter((month) => commercialSizes.some((size) => availabilityForSize(month, size) > 0)).length ?? 0;
  const exportExcel = async () => {
    if (!projection || exporting) return;
    setExporting(true);
    try {
      const workbook = await createAvailabilityWorkbook(projection, commercialSizes, draft, mode, result?.generatedAt ?? "");
      const buffer = await workbook.xlsx.writeBuffer();
      const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `disponibilita-commerciale-${mode}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast({ title: "Esportazione Excel non riuscita", description: "Impossibile generare il file. Riprova.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <header className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">Disponibilità commerciale</h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">Per ogni taglia, lo stock a inizio mese distingue taglia esatta e animali fisicamente più grandi, anche se non selezionati. <b className="text-[#0d5b58]">Ancora vendibile per nuove vendite</b> indica quanti animali della taglia richiesta o superiore si possono vendere in più nel mese, senza lasciare scoperti gli ordini acquisiti (anche futuri) o le vendite già previste. Non sommare cifre, celle o mesi.</p>
        <p className="mt-1 max-w-3xl text-xs text-amber-800">Gli ordini acquisiti mostrano quantità ordinate e valore totale degli ordini nel primo mese di consegna, anche per taglie non selezionate. Non indicano animali già disponibili, né nuovi incassi. Valori IVA inclusa/esclusa non determinati.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="rounded-md bg-slate-100 p-1" role="group" aria-label="Modalità disponibilità">
          <button type="button" onClick={() => setMode("prudent")} aria-pressed={mode === "prudent"} className={`rounded px-3 py-1.5 text-xs font-bold ${mode === "prudent" ? "bg-[#123b47] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Prudente</button>
          <button type="button" onClick={() => setMode("expected")} aria-pressed={mode === "expected"} className={`rounded px-3 py-1.5 text-xs font-bold ${mode === "expected" ? "bg-[#123b47] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Atteso</button>
        </div>
        <button onClick={exportExcel} disabled={!projection || exporting} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"><FileDown className="mr-1 inline h-4 w-4" />{exporting ? "Esportazione…" : "Excel (.xlsx)"}</button>
      </div>
    </header>
    {!projection ? <div className="m-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">Ricalcola uno scenario per visualizzare la disponibilità della taglia selezionata o superiore e il giorno di vendita.</div> : <>
      <div className="grid gap-2 border-b border-slate-100 bg-[#f7faf8] p-3 md:grid-cols-3">
        <Summary label="Modalità" value={mode === "prudent" ? "Prudente" : "Atteso"} detail="Le quantità seguono questa ipotesi." />
        <Summary label="Mesi disponibili" value={amount.format(availableMonths)} detail={`su ${amount.format(projection.months.length)} mesi di scenario`} />
        <Summary label="Massima nuova vendita in una cella" value={peak ? `${amount.format(peak.animals)} animali` : "—"} detail={peak ? `${peak.size.code} · ${monthLabel(peak.month)}${peak.value === null ? " · non valorizzato" : ` · ${money.format(peak.value)} stimati`}` : "Nessuna nuova vendita disponibile"} />
      </div>
      <div className="border-b border-slate-100 bg-slate-50 p-3 sm:p-4">
        <CommercialScenarioOverview projection={projection} sizes={commercialSizes} draft={draft} />
        <a href="#commercial-availability-detail" className="mt-3 inline-block text-sm font-bold text-[#0d5b58] underline underline-offset-2 hover:text-[#123b47]">Vai ai dati dettagliati ↓</a>
      </div>
      <div id="commercial-availability-detail" className="flex scroll-mt-24 flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-extrabold text-[#123b47]">Dati dettagliati · tabella completa</h3>
        <a href="#sales-scenario-top" className="text-sm font-bold text-[#0d5b58] underline underline-offset-2 hover:text-[#123b47]">Torna alla testata ↑</a>
      </div>
      <div className="overflow-x-auto">
          <table className="w-full min-w-[1440px] border-separate border-spacing-0 text-left text-sm">
          <caption className="sr-only">Matrice disponibilità commerciale {mode}: taglia esatta e più grandi a inizio mese, animali ancora vendibili per nuove vendite della taglia o superiore e giorno di vendita, con ordini acquisiti.</caption>
          <thead className="sticky top-0 z-20 bg-[#eaf1ee] text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th scope="col" className="sticky left-0 z-30 min-w-36 border-b border-r border-slate-200 bg-[#eaf1ee] px-3 py-3">Mese</th>
               {commercialSizes.map((size) => <th key={size.id} scope="col" className="min-w-56 border-b border-r border-slate-200 px-3 py-3 text-center"><span className="block font-extrabold text-[#123b47]">{size.code}</span><span className="normal-case font-medium text-slate-500">taglia o superiore · nuove vendite</span></th>)}
              <th scope="col" className="min-w-32 border-b border-r border-slate-200 bg-[#fff8e8] px-3 py-3 text-center"><span className="block font-extrabold text-amber-900">Ordini acquisiti</span><span className="normal-case font-medium text-amber-800">animali</span></th>
              <th scope="col" className="min-w-36 border-b border-r border-slate-200 bg-[#fff8e8] px-3 py-3 text-center"><span className="block font-extrabold text-amber-900">Ordini acquisiti</span><span className="normal-case font-medium text-amber-800">valore €</span></th>
              <th scope="col" className="min-w-32 border-b border-slate-200 px-3 py-3">Scoperto ordini</th>
            </tr>
          </thead>
          <tbody>
            {projection.months.map((month) => <tr key={`${month.year}-${month.month}`} className="group">
              <th scope="row" className="sticky left-0 z-10 border-b border-r border-slate-200 bg-white px-3 py-3 font-extrabold capitalize text-slate-800 group-hover:bg-[#f7faf8]">{monthLabel(month)}</th>
               {commercialSizes.map((size) => <AvailabilityCell key={size.id} stock={stockBeforeOrdersForSize(month, size)} eligible={eligibleAtStartForSize(month, size)} animals={availabilityForSize(month, size)} day={availabilityDayForSize(month, size)} price={priceForSize(size, draft)} size={size.code} month={monthLabel(month)} />)}
              <CommitmentCell commitment={orderCommitmentForMonth(month)} field="animals" month={monthLabel(month)} />
              <CommitmentCell commitment={orderCommitmentForMonth(month)} field="valueEuro" month={monthLabel(month)} />
              <td className={`border-b border-slate-200 px-3 py-3 font-mono font-bold ${month.orderShortfall > 0 ? "bg-red-50 text-red-800" : "text-slate-400"}`}>{month.orderShortfall > 0 ? <><span aria-label={`${exactAmount.format(month.orderShortfall)} animali scoperti`}>{amount.format(month.orderShortfall)}</span><span className="sr-only"> animali scoperti</span></> : "—"}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
        <footer className="border-t border-slate-100 px-4 py-3 text-xs text-slate-600">A inizio mese: taglia esatta e animali fisicamente più grandi, prima degli ordini del mese (oggi per il mese corrente). Ancora vendibile: quantità aggiuntiva per nuove vendite della taglia richiesta o superiore al giorno indicato, mantenendo coperti gli ordini acquisiti alle rispettive date e le vendite dello scenario. Non è tutto lo stock iniziale. Le celle sono alternative: gli stessi animali possono coprire più taglie, quindi non sommarle né calcolare lo scoperto sottraendo una colonna. Il valore usa il prezzo della taglia richiesta, non una quotazione della taglia effettiva superiore. Senza prezzo: non valorizzato.</footer>
    </>}
  </section>;
}

function Summary({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-md border border-slate-200 bg-white px-3 py-2"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-0.5 font-mono text-base font-extrabold text-slate-800">{value}</p><p className="text-xs text-slate-500">{detail}</p></div>;
}

function AvailabilityCell({ stock, eligible, animals, day, price, size, month }: { stock: number | null; eligible: number | null; animals: number; day: number | null; price: number | null; size: string; month: string }) {
  const value = estimatedSalesValue(animals, price);
  const bigger = stock === null || eligible === null ? null : Math.max(0, eligible - stock);
  const timing = animals > 0 ? day === null ? "ricalcolare per la data" : `il giorno ${day}` : "";
  const exact = `a inizio mese ${bigger === null ? "ricalcolare lo scenario" : `${exactAmount.format(stock!)} della taglia, ${exactAmount.format(bigger)} più grandi`}; ancora vendibili per nuove vendite della taglia o superiore ${exactAmount.format(animals)} animali ${timing}${value === null ? "; valore stimato non valorizzato: prezzo non disponibile" : `; valore stimato ${exactMoney.format(value)}`}`;
  return <td className="border-b border-r border-slate-200 px-3 py-2.5 text-right align-middle" title={exact}>
    <span className="sr-only">{month}, {size}: {exact}</span>
    <div aria-hidden="true" className="flex items-baseline justify-between gap-2 text-xs text-slate-600"><span>Taglia esatta · inizio</span><span className="font-mono font-semibold text-slate-800">{stock === null ? "ricalcolare" : amount.format(stock)}</span></div>
    <div aria-hidden="true" className="flex items-baseline justify-between gap-2 text-xs text-violet-800"><span>Più grandi · inizio</span><span className="font-mono font-semibold">{bigger === null ? "ricalcolare" : amount.format(bigger)}</span></div>
    <div aria-hidden="true" className="mt-1 flex items-baseline justify-between gap-2 border-t border-slate-100 pt-1 text-xs text-[#0d5b58]"><span>Nuove vendite (≥ taglia)</span><span className={`font-mono text-sm font-extrabold ${animals > 0 ? "text-[#0d5b58]" : "text-slate-500"}`}>{amount.format(animals)}</span></div>
    {animals > 0 && <div aria-hidden="true" className="text-xs text-[#0d5b58]">{timing}</div>}
    <div aria-hidden="true" className={`mt-0.5 text-xs font-semibold ${value === null ? "text-amber-800" : "text-slate-500"}`}>{value === null ? "non valorizzato" : money.format(value)} stimati</div>
  </td>;
}

function CommitmentCell({ commitment, field, month }: { commitment: ReturnType<typeof orderCommitmentForMonth>; field: "animals" | "valueEuro"; month: string }) {
  const value = commitment?.[field] ?? null;
  const display = !commitment ? "—" : value === null ? "non valorizzato" : field === "animals" ? amount.format(value) : money.format(value);
  return <td className="border-b border-r border-slate-200 bg-[#fffdf5] px-3 py-2.5 text-right align-middle" title={`${month}, Ordini acquisiti: ${display}`}>
    <span className="sr-only">{month}, Ordini acquisiti: {display}</span>
    <span aria-hidden="true" className={`font-mono font-extrabold ${value === null ? "text-amber-800" : "text-slate-700"}`}>{display}</span>
  </td>;
}
