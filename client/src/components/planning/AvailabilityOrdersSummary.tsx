import { useMemo, useState } from "react";
import { CalendarDays, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orderedSizes, summarizeCoverage } from "@/lib/availability-summary";
import { getDeliveryOrderCoverage } from "@/lib/current-order-coverage";
import { translateMonthLabel, usePlanningLang } from "@/lib/planningI18n";

interface Month {
  month: number;
  year: number;
  monthLabel: string;
  ordiniBySize?: Record<string, number>;
  ordiniEvasiBySize?: Record<string, number>;
  ordiniEvasiTotali?: number;
  ordiniArretratiBySize?: Record<string, number>;
  ordiniArretratiEvasiBySize?: Record<string, number>;
  ordiniArretratiTotali?: number;
  deliveryCoverage?: { requested: number; covered: number; uncovered: number; arrearsFulfilled: number; unverifiable: number; bySize: Record<string, { requested: number; covered: number; uncovered: number; arrearsFulfilled: number; unverifiable: number }> };
  disponibilitaBiologicaBySize?: Record<string, number>;
  disponibilitaBiologicaTotale?: number;
  giacenzaLordaConSchiuditoio: number;
  assegnatiDaTargetOSuperiori?: number;
  assegnatiDaTaglieInferiori?: number;
  scopertoTarget?: number;
  recuperoSchiuditoio?: "nessuno-scoperto" | "recuperabile" | "non-recuperabile" | "non-verificabile";
  budgetProduzione: number;
  forecastEvadibileTarget: number;
  forecastNonCoperto: number;
  schiuditoioNecessario: number;
  arriviSchiuditoio: number;
  arrivalTooLate?: boolean;
}

function number(value: number | undefined, lang: string) {
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString(lang === "it" ? "it-IT" : "en-GB") : "—";
}

function Metric({ title, value, tone = "neutral" }: { title: string; value: string; tone?: "neutral" | "alert" }) {
  return <div className="min-w-0 rounded-lg border border-[#d8e3e0] bg-[#f5f8f6] px-3 py-2">
    <div className="text-[10px] font-semibold uppercase tracking-wide text-[#59726d]">{title}</div>
    <div className={`mt-1 break-words text-sm font-semibold tabular-nums xl:text-lg ${tone === "alert" ? "text-[#a94436]" : "text-[#193f3a]"}`}>{value}</div>
  </div>;
}

export default function AvailabilityOrdersSummary({ months, targetSize }: { months: Month[]; targetSize: string }) {
   const { lang } = usePlanningLang();
  const [selectedMonth, setSelectedMonth] = useState(0);
   const activeMonth = Math.min(selectedMonth, Math.max(0, months.length - 1));
   const month = months[activeMonth];
  const current = useMemo(() => month ? summarizeCoverage(month) : null, [month]);
  const biologySizes = month?.disponibilitaBiologicaBySize;
  const orderSizes = orderedSizes(month?.ordiniBySize);
  const label = (it: string, en: string) => lang === "it" ? it : en;
  if (!month) return null;
  const deadline = getDeliveryOrderCoverage(month.deliveryCoverage);
   const totalAssigned = current?.assigned ?? undefined;

  return <Card className="overflow-hidden border-[#c7d8d3] bg-[#fbfcfa] shadow-sm">
    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-[#dce7e3] bg-[#eff5f1] px-4 py-3">
      <div>
        <CardTitle className="text-base font-semibold text-[#193f3a]">{label("Disponibilità e quote ordini", "Availability & order quotas")}</CardTitle>
        <p className="mt-0.5 text-xs text-[#59726d]">{label("Solo quote future valide, al netto delle consegne certificate sulla quota. Nessun recupero degli scoperti passati. Il Forecast resta alternativo.", "Only valid future quotas, net of certified deliveries against each quota. No recovery of past shortfalls. Forecast remains an alternative.")}</p>
      </div>
      <label className="flex items-center gap-2 text-xs font-medium text-[#365c56]">
        <CalendarDays className="h-4 w-4" />
        <span>{label("Mese", "Month")}</span>
        <select aria-label={label("Seleziona mese", "Select month")} className="max-w-[220px] rounded-md border border-[#c7d8d3] bg-white px-2 py-1.5 text-sm" value={activeMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
          {months.map((item, index) => <option key={`${item.year}-${item.month}`} value={index}>{translateMonthLabel(item.monthLabel, lang)}</option>)}
        </select>
      </label>
    </CardHeader>
    <CardContent className="space-y-4 p-4">
      <div className="grid gap-3 lg:grid-cols-[0.9fr_1.6fr]">
        <section aria-labelledby="bio-title" className="min-w-0">
          <h3 id="bio-title" className="mb-2 text-xs font-bold uppercase tracking-wide text-[#35685f]">{label("Disponibilità biologica", "Biological availability")}</h3>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <Metric title={label("Totale · tutte le taglie", "Total · all sizes")} value={number(month.disponibilitaBiologicaTotale, lang)} />
            <Metric title={label(`${targetSize} o superiori`, `${targetSize} or larger`)} value={number(month.giacenzaLordaConSchiuditoio, lang)} />
          </div>
          <div className="max-h-40 overflow-auto rounded-md border border-[#dce7e3]" role="region" aria-label={label("Distribuzione biologica per taglia", "Biological size distribution")}>
            <table className="w-full text-xs"><thead className="sticky top-0 bg-[#edf4f0]"><tr><th className="px-2 py-1.5 text-left">{label("Taglia a fine mese", "End-month size")}</th><th className="px-2 py-1.5 text-right">{label("Animali", "Animals")}</th></tr></thead>
              <tbody>{biologySizes && Object.keys(biologySizes).length ? orderedSizes(biologySizes).map(size => <tr key={size} className="border-t border-[#e3ece8]"><th scope="row" className="px-2 py-1.5 text-left font-medium">{size}</th><td className="px-2 py-1.5 text-right tabular-nums">{number(biologySizes[size], lang)}</td></tr>) : <tr><td colSpan={2} className="px-2 py-3 text-center text-[#758985]">{biologySizes && month.disponibilitaBiologicaTotale === 0 ? label("Nessun animale disponibile", "No animals available") : label("Dato non disponibile: ricalcolare", "Unavailable — recalculate")}</td></tr>}</tbody>
            </table>
          </div>
        </section>
        <section className="min-w-0">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#9a5422]">{label("Ordini del mese · allocazione effettiva", "Current orders · actual allocation")}</h3>
          <div className="mb-2 grid grid-cols-3 gap-2">
            <Metric title={label("Richiesti", "Requested")} value={number(current?.requested ?? undefined, lang)} />
            <Metric title={label("Assegnati", "Assigned")} value={number(current?.assigned ?? undefined, lang)} />
            <Metric title={label("Scoperti", "Uncovered")} value={number(current?.uncovered ?? undefined, lang)} tone="alert" />
          </div>
          <div className="overflow-x-auto rounded-md border border-[#ead9c7]">
            <table className="w-full min-w-[450px] text-xs"><thead className="bg-[#fbf3e9]"><tr><th className="px-2 py-1.5 text-left">{label("Taglia richiesta", "Requested size")}</th><th className="px-2 py-1.5 text-right">{label("Richiesti", "Requested")}</th><th className="px-2 py-1.5 text-right">{label("Assegnati", "Assigned")}</th><th className="px-2 py-1.5 text-right">{label("Scoperti", "Uncovered")}</th></tr></thead>
              <tbody>{current?.available ? orderSizes.map(size => { const row = current.bySize.find(item => item.size === size); return <tr key={size} className="border-t border-[#f0e6da]"><th scope="row" className="px-2 py-1.5 text-left font-medium">{size}</th><td className="px-2 py-1.5 text-right tabular-nums">{number(row?.requested ?? undefined, lang)}</td><td className="px-2 py-1.5 text-right tabular-nums">{number(row?.assigned ?? undefined, lang)}</td><td className="px-2 py-1.5 text-right font-semibold tabular-nums text-[#a94436]">{number(row?.uncovered ?? undefined, lang)}</td></tr>; }) : <tr><td colSpan={4} className="px-2 py-3 text-center text-[#758985]">{label("Copertura non disponibile: ricalcolare", "Coverage unavailable — recalculate")}</td></tr>}</tbody>
            </table>
          </div>
          <div className="mt-2 rounded-md border border-[#e4e4d6] bg-[#faf9f1] px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wide text-[#6d7053]">{label("Copertura alla scadenza · vista separata", "Deadline coverage · separate view")}</div>
            <p className="mt-1 text-xs text-[#505747]">{deadline.available ? `${number(deadline.covered ?? undefined, lang)} ${label("coperti su", "covered of")} ${number(deadline.requested ?? undefined, lang)} ${label("richiesti con scadenza", "dated requests")} · ${number(deadline.uncovered ?? undefined, lang)} ${label("scoperti", "uncovered")}` : label("Dato non disponibile: ricalcolare", "Unavailable — recalculate")}</p>
          </div>
        </section>
      </div>

      <section className="border-t border-[#dce7e3] pt-3">
        <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-[#365c56]">{label("Animali assegnati · provenienza biologica", "Assigned animals · biological origin")}</h3>
        <p className="mb-2 text-[11px] text-[#59726d]">{label("Solo quote valide del mese. I gruppi di animali non si sovrappongono.", "Only valid quotas for this month. The animal pools do not overlap.")}</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Metric title={label(`Da ${targetSize} o superiori`, `From ${targetSize} or larger`)} value={number(month.assegnatiDaTargetOSuperiori, lang)} />
          <Metric title={label(`Da taglie inferiori a ${targetSize}`, `From sizes smaller than ${targetSize}`)} value={number(month.assegnatiDaTaglieInferiori, lang)} />
          <Metric title={label("Totale assegnato", "Total assigned")} value={number(totalAssigned, lang)} />
        </div>
      </section>
      <div className="grid gap-3 border-t border-[#dce7e3] pt-3 md:grid-cols-2">
        <section className="rounded-lg border border-[#d8e3e0] bg-[#f5f8f6] p-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-[#365c56]">{label(`Recupero scoperto mensile · ${targetSize}`, `Monthly shortfall recovery · ${targetSize}`)}</h3>
          <p className="mt-1 text-sm font-semibold text-[#193f3a]">{month.recuperoSchiuditoio ? ({
            "nessuno-scoperto": label("Nessuno scoperto target", "No target-size shortfall"),
            recuperabile: label("Deficit target recuperabile", "Target deficit recoverable"),
            "non-recuperabile": label("Deficit target non maturabile in tempo", "Target deficit cannot mature in time"),
            "non-verificabile": label("Verifica non disponibile", "Status unverifiable"),
          } as Record<string, string>)[month.recuperoSchiuditoio] : "—"}</p>
          <p className="mt-1 text-[11px] text-[#59726d]">{label("Valuta se nuovi TP-300 possono maturare entro fine mese, non alla singola data di consegna. È specifico della taglia target, non di tutte le taglie ordinate.", "Checks whether new TP-300 arrivals can mature by month-end, not by individual delivery deadlines. It applies to the target size, not every ordered size.")} {label("Scoperto target", "Target uncovered")}: {number(month.scopertoTarget, lang)}</p>
        </section>
        <section className="rounded-lg border border-[#ded9c4] bg-[#faf9f1] p-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-[#6d7053]">{label("Schiuditoio · arrivo suggerito", "Hatchery · suggested arrival")}</h3>
          <p className="mt-1 text-[11px] text-[#59726d]">{label("Raccomandazione alternativa per il mese d’ingresso, calcolata per maturare entro un mese di consegna futuro; non sostituisce lo stato di recupero alla consegna.", "Alternative recommendation for the arrival month, intended to mature by a future delivery month; it does not replace delivery-month recovery status.")} {label("Arrivo suggerito", "Suggested arrival")}: <b className="tabular-nums">{number(month.schiuditoioNecessario, lang)}</b> · {label("arrivi pianificati nel mese", "arrivals planned this month")}: <b className="tabular-nums">{number(month.arriviSchiuditoio, lang)}</b></p>
        </section>
        <section className="rounded-lg border border-[#ded9c4] bg-[#faf9f1] p-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-[#6d7053]">{label("Forecast · scenario alternativo", "Forecast · alternative scenario")}</h3>
          <p className="mt-1 text-sm text-[#464a38]">{label("Non si somma alle disponibilità o alle allocazioni ordini.", "Do not add to order availability or allocations.")} {label("Budget", "Budget")}: <b className="tabular-nums">{number(month.budgetProduzione, lang)}</b> · {label("Forecast evadibile", "Fulfillable Forecast")}: <b className="tabular-nums">{number(month.forecastEvadibileTarget, lang)}</b> · {label("non coperto", "uncovered")}: <b className="tabular-nums">{number(month.forecastNonCoperto, lang)}</b></p>
        </section>
      </div>
      <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-[#657a75]"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />{label("Le classi biologiche sono taglie esclusive a fine mese, dopo mortalità e prima delle allocazioni. La copertura mensile non garantisce la disponibilità alla data di consegna.", "Biological classes are mutually exclusive end-month sizes, after mortality and before allocations. Monthly capacity is not a delivery-date promise.")}</p>
    </CardContent>
  </Card>;
}