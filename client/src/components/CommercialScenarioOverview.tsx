import React, { useEffect, useState } from "react";
import type { ScenarioInput, ScenarioProjection, ScenarioMonth } from "@shared/sales-scenarios";
import {
  availabilityDayForSize,
  availabilityForSize,
  eligibleAtStartForSize,
  estimatedSalesValue,
  orderCommitmentForMonth,
  priceForSize,
  stockBeforeOrdersForSize,
  type CommercialSize,
} from "@/components/commercial-availability-utils";

const monthNames = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const integer = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 });
const precise = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 2 });
const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const monthLabel = (month: Pick<ScenarioMonth, "year" | "month">) => `${monthNames[month.month - 1]} ${month.year}`;
const monthKey = (month: Pick<ScenarioMonth, "year" | "month">) => `${month.year}-${month.month}`;

type Props = {
  projection: ScenarioProjection;
  sizes: CommercialSize[];
  draft: Pick<ScenarioInput, "proposalPrices">;
};

/**
 * A compact operator view of the projection. Values are deliberately kept
 * per-size: alternatives are not additive and are never presented as a total.
 */
export function CommercialScenarioOverview({ projection, sizes, draft }: Props) {
  const [selectedKey, setSelectedKey] = useState(() => projection.months[0] ? monthKey(projection.months[0]) : "");
  const selectedMonth = projection.months.find((month) => monthKey(month) === selectedKey) ?? projection.months[0];

  useEffect(() => {
    if (!projection.months.some((month) => monthKey(month) === selectedKey)) {
      setSelectedKey(projection.months[0] ? monthKey(projection.months[0]) : "");
    }
  }, [projection.months, selectedKey]);

  if (!selectedMonth) {
    return <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Nessun mese nello scenario.</section>;
  }

  const selectRelativeMonth = (offset: number) => {
    const index = projection.months.findIndex((month) => monthKey(month) === monthKey(selectedMonth));
    const next = projection.months[index + offset];
    if (next) setSelectedKey(monthKey(next));
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-labelledby="commercial-overview-title">
      <header className="border-b border-slate-100 bg-[#f7faf8] px-4 py-4 sm:px-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0d5b58]">Vista operatore · {projection.months.length} mesi</p>
        <h2 id="commercial-overview-title" className="mt-1 text-lg font-extrabold text-[#123b47]">Ordini acquisiti e nuove vendite possibili</h2>
        <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-600">
          Seleziona un mese: lo stock biologico a inizio mese è distinto dagli animali ancora vendibili. «Ancora vendibile» indica quanto puoi aggiungere come nuova vendita, mantenendo coperti gli ordini acquisiti (anche futuri) e le vendite già inserite nello scenario. Le taglie sono alternative: non sommare le quantità tra schede.
        </p>
      </header>

      <div className="border-b border-slate-100 px-3 py-3 sm:px-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">Timeline scenario</h3>
          <span className="text-xs text-slate-500">Ordini e nuove vendite sono indicati separatamente</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6" role="tablist" aria-label="Mesi dello scenario">
          {projection.months.map((month) => {
            const active = monthKey(month) === monthKey(selectedMonth);
            const covered = month.ordersRequested > 0 && month.orderShortfall <= 0;
            const hasCapacity = sizes.some((size) => availabilityForSize(month, size) > 0);
            const hasStock = sizes.some((size) => (eligibleAtStartForSize(month, size) ?? 0) > 0);
            return (
              <button
                key={monthKey(month)}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls="commercial-month-detail"
                onClick={() => setSelectedKey(monthKey(month))}
                onKeyDown={(event) => {
                  if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); selectMonthByOffset(month, 1); }
                  if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); selectMonthByOffset(month, -1); }
                }}
                className={`min-h-[88px] rounded-lg border p-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d5b58] focus:ring-offset-1 ${active ? "border-[#0d5b58] bg-[#eaf5f0] shadow-sm" : "border-slate-200 bg-white hover:border-[#77a99e] hover:bg-[#f7faf8]"}`}
              >
                <span className="block text-xs font-extrabold capitalize text-[#123b47]">{monthNames[month.month - 1].slice(0, 3)} <span className="font-medium text-slate-500">{month.year}</span></span>
                <span className={`mt-2 block break-words text-xs font-bold ${month.orderShortfall > 0 ? "text-red-700" : covered ? "text-[#0d5b58]" : "text-slate-500"}`}>
                  {month.orderShortfall > 0 ? `Scoperto ${integer.format(month.orderShortfall)}` : month.ordersRequested > 0 ? "Ordini coperti" : "Nessun ordine"}
                </span>
                <span className={`mt-1 block text-[11px] font-semibold ${hasCapacity ? "text-[#0d5b58]" : hasStock ? "text-amber-800" : "text-slate-500"}`}>
                  {hasCapacity ? "Nuove vendite: sì" : hasStock ? "Stock presente · nuove vendite: 0" : "Nuove vendite: 0"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div id="commercial-month-detail" role="tabpanel" className="px-4 py-4 sm:px-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Mese selezionato</p>
            <h3 className="mt-0.5 text-xl font-extrabold capitalize text-[#123b47]">{monthLabel(selectedMonth)}</h3>
          </div>
          <div className="flex gap-1" aria-label="Naviga tra i mesi">
            <button type="button" onClick={() => selectRelativeMonth(-1)} disabled={monthKey(selectedMonth) === monthKey(projection.months[0])} className="rounded border border-slate-300 px-2.5 py-1 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Mese precedente">←</button>
            <button type="button" onClick={() => selectRelativeMonth(1)} disabled={monthKey(selectedMonth) === monthKey(projection.months[projection.months.length - 1])} className="rounded border border-slate-300 px-2.5 py-1 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Mese successivo">→</button>
          </div>
        </div>

        <OrderSummary month={selectedMonth} />
        <div className="mt-5">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-extrabold text-[#123b47]">Stock e nuove vendite per taglia richiesta</h3>
            <p className="text-xs text-slate-500">Ogni scheda è un'alternativa, non una quota da sommare</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sizes.map((size) => <SizeCard key={size.id} month={selectedMonth} size={size} draft={draft} />)}
          </div>
        </div>
      </div>
    </section>
  );

  function selectMonthByOffset(month: ScenarioMonth, offset: number) {
    const index = projection.months.findIndex((candidate) => monthKey(candidate) === monthKey(month));
    const next = projection.months[index + offset];
    if (next) setSelectedKey(monthKey(next));
  }
}

function OrderSummary({ month }: { month: ScenarioMonth }) {
  const commitment = orderCommitmentForMonth(month);
  return (
    <div className="rounded-lg border border-amber-200 bg-[#fffdf5] p-3" aria-label={`Riepilogo ordini ${monthLabel(month)}`}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-extrabold text-amber-950">Riepilogo ordini del mese</h3>
        <span className="text-xs text-amber-800">Valore ordini acquisiti, non ricavi</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Metric label="Richiesti" value={integer.format(month.ordersRequested)} />
        <Metric label="Soddisfatti simulazione" value={integer.format(month.ordersFulfilled)} />
        <Metric label="Scoperto" value={integer.format(month.orderShortfall)} danger={month.orderShortfall > 0} />
        <Metric label="Valore ordini acquisiti" value={commitment?.valueEuro == null ? month.ordersRequested > 0 ? "non valorizzato" : "—" : euro.format(commitment.valueEuro)} muted={commitment?.valueEuro == null} />
      </div>
    </div>
  );
}

function Metric({ label, value, danger = false, muted = false }: { label: string; value: string; danger?: boolean; muted?: boolean }) {
  return <div><p className="text-[10px] font-bold uppercase tracking-wide text-amber-800">{label}</p><p className={`mt-0.5 font-mono text-base font-extrabold ${muted ? "text-amber-800" : danger ? "text-red-700" : "text-slate-800"}`}>{value}</p></div>;
}

function SizeCard({ month, size, draft }: { month: ScenarioMonth; size: CommercialSize; draft: Pick<ScenarioInput, "proposalPrices"> }) {
  const exact = stockBeforeOrdersForSize(month, size);
  const eligible = eligibleAtStartForSize(month, size);
  const larger = exact === null || eligible === null ? null : Math.max(0, eligible - exact);
  const sellable = availabilityForSize(month, size);
  const day = availabilityDayForSize(month, size);
  const price = priceForSize(size, draft);
  const value = estimatedSalesValue(sellable, price);
  const stockTotal = eligible === null ? null : Math.max(0, eligible);
  const exactShare = stockTotal && exact !== null ? Math.min(100, exact / stockTotal * 100) : 0;
  const largerShare = stockTotal && larger !== null ? Math.min(100, larger / stockTotal * 100) : 0;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(18,59,71,0.05)]">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2">
        <div><h4 className="text-base font-extrabold text-[#123b47]">{size.code}</h4><p className="text-xs text-slate-500">{size.name}</p></div>
        <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">alternativa</span>
      </div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">Stock biologico a inizio mese</p>
      <div className="mt-1 flex h-3 overflow-hidden rounded-full bg-slate-100" aria-label={`Stock iniziale: ${exact === null ? "da ricalcolare" : precise.format(exact)} taglia esatta e ${larger === null ? "da ricalcolare" : precise.format(larger)} più grandi`}>
        <span className="bg-[#123b47]" style={{ width: `${exactShare}%` }} />
        <span className="bg-[#9bc5b2]" style={{ width: `${largerShare}%` }} />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div><span className="block text-slate-500">Taglia esatta</span><strong className="font-mono text-slate-800">{exact === null ? "ricalcolare" : integer.format(exact)}</strong></div>
        <div><span className="block text-slate-500">Fisicamente più grandi</span><strong className="font-mono text-slate-800">{larger === null ? "ricalcolare" : integer.format(larger)}</strong></div>
      </div>
      <div className="mt-3 rounded-md border border-[#b7d9c9] bg-[#f0f8f3] p-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#0d5b58]">Ancora vendibile per nuove vendite</p>
        <p className="mt-0.5 font-mono text-xl font-extrabold text-[#0d5b58]">{integer.format(sellable)} <span className="font-sans text-xs font-bold">animali · taglia o superiore</span></p>
        <p className="text-xs text-[#27695e]">{sellable > 0 ? day === null ? "Giorno: da ricalcolare" : `Primo giorno ottenibile: ${day}` : "Nessun animale in più vendibile nel mese"}</p>
      </div>
      <p className="mt-2 text-xs text-slate-500">Valore nuove vendite: {value === null ? "non valorizzato" : `${euro.format(value)} stimati`} · prezzo della taglia richiesta, non della taglia effettiva superiore.</p>
    </article>
  );
}