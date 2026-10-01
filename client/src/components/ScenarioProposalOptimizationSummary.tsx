import * as React from "react";
import type { ScenarioProposalOptimization } from "@shared/sales-scenarios";

const euro = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const integer = new Intl.NumberFormat("it-IT");

function formatEuro(value: number): string {
  return euro.format(value);
}

function formatDuration(value: number): string {
  const ms = Math.max(0, value);
  if (ms < 1000) return `${integer.format(Math.round(ms))} ms`;
  return `${new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 }).format(ms / 1000)} s`;
}

export function ScenarioProposalOptimizationSummary({
  optimization,
  cashGoal,
}: {
  optimization: ScenarioProposalOptimization;
  cashGoal: number;
}) {
  if (![cashGoal, optimization.optimizedReceipts, optimization.baselineReceipts,
    optimization.improvementEuro, optimization.plansEvaluated,
    optimization.candidatesEvaluated, optimization.searchTimeMs].every(Number.isFinite)) {
    return <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">Riepilogo dell'ottimizzazione non valido. Genera nuovamente la proposta.</p>;
  }
  const goal = Math.max(0, cashGoal);
  const receipts = Math.max(0, optimization.optimizedReceipts);
  const baselineStatus = optimization.baselineStatus ?? (optimization.baselineFeasible === false ? "unsafe" : "feasible");
  const baselineLabel = baselineStatus === "feasible"
    ? "Metodo precedente"
    : baselineStatus === "partial" ? "Piano precedente parziale" : "Piano manuale di partenza";
  const coverage = goal > 0 ? Math.min(100, Math.max(0, (receipts / goal) * 100)) : 100;
  const uncovered = Math.max(0, goal - receipts);
  const progressValue = uncovered > 0 ? Math.min(99.9, Math.floor(coverage * 10) / 10) : 100;

  return (
    <section
      aria-labelledby="proposal-optimization-title"
      className="min-w-0 rounded-lg border border-teal-200 bg-[#f3f8f5] p-3 text-teal-950"
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 id="proposal-optimization-title" className="text-sm font-extrabold tracking-tight">
            Riepilogo dell’ottimizzazione
          </h3>
          <p className="mt-0.5 text-xs leading-relaxed text-teal-800">
            Incasso minimo fra atteso e prudente entro la scadenza, includendo piano manuale e proposta.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-teal-200 bg-white/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-800">
          Due ipotesi
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="min-w-0 rounded-md border border-teal-100 bg-white/75 px-3 py-2">
          <p className="text-[10px] font-bold uppercase leading-snug tracking-wide text-teal-700">
            Incasso proposto entro scadenza
          </p>
          <p className="mt-1 break-words text-lg font-extrabold tabular-nums text-teal-950">
            {formatEuro(receipts)}
          </p>
        </div>
        <div className="min-w-0 rounded-md border border-teal-100 bg-white/75 px-3 py-2">
          <p className="text-[10px] font-bold uppercase leading-snug tracking-wide text-teal-700">
            {baselineStatus === "feasible" ? "Miglioramento vs metodo precedente" : "Miglioramento vs piano di partenza"}
          </p>
          <p className="mt-1 break-words text-lg font-extrabold tabular-nums text-teal-950">
            {formatEuro(optimization.improvementEuro)}
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-teal-700">
            {baselineLabel}: {formatEuro(optimization.baselineReceipts)}
          </p>
        </div>
        <div className="min-w-0 rounded-md border border-teal-100 bg-white/75 px-3 py-2">
          <p className="text-[10px] font-bold uppercase leading-snug tracking-wide text-teal-700">
            Obiettivo ancora da coprire
          </p>
          <p className="mt-1 break-words text-lg font-extrabold tabular-nums text-teal-950">
            {formatEuro(uncovered)}
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-teal-700">
            {uncovered === 0 ? "Obiettivo raggiunto entro la scadenza." : `Obiettivo: ${formatEuro(goal)}`}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
          <span className="font-bold text-teal-900">Copertura obiettivo</span>
          <span className="shrink-0 font-semibold tabular-nums text-teal-800">{progressValue}%</span>
        </div>
        <div
          role="progressbar"
          aria-label="Copertura dell’obiettivo di cassa entro la scadenza"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressValue}
          aria-valuetext={`${progressValue}% dell’obiettivo coperto`}
          className="h-2.5 overflow-hidden rounded-full bg-teal-100"
        >
          <div
            className="h-full rounded-full bg-teal-700 transition-[width] duration-500"
            style={{ width: `${coverage}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-teal-200/80 pt-2 text-[11px] text-teal-800">
        <span>
          <strong className="font-extrabold text-teal-950">
            {integer.format(Math.max(0, optimization.plansEvaluated))}
          </strong>{" "}
          piani valutati
        </span>
        <span>
          <strong className="font-extrabold text-teal-950">
            {integer.format(Math.max(0, optimization.candidatesEvaluated))}
          </strong>{" "}
          alternative verificate
        </span>
        <span>
          Ricerca:{" "}
          <strong className="font-extrabold text-teal-950">
            {formatDuration(optimization.searchTimeMs)}
          </strong>
        </span>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-teal-800">
        Il confronto considera vendere ora oppure attendere la crescita e valuta combinazioni di
        taglie selezionate.
      </p>
      {optimization.timeLimited && (
        <p role="status" className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-2 text-xs leading-relaxed text-amber-950">
          La ricerca ha raggiunto il limite di tempo o di verifiche; viene restituito il miglior piano validato
          trovato entro il budget.
        </p>
      )}
      {baselineStatus === "unsafe" && (
        <p className="mt-2 text-[11px] leading-relaxed text-amber-900">
          La proposta del vecchio metodo non rispettava tutti gli impegni già inseriti ed è stata esclusa. Il confronto usa il piano manuale protetto.
        </p>
      )}
      {baselineStatus === "not-completed" && (
        <p className="mt-2 text-[11px] leading-relaxed text-amber-900">
          Il vecchio metodo non ha terminato le verifiche nel tempo disponibile. Il confronto usa il piano manuale protetto.
        </p>
      )}
      {baselineStatus === "partial" && (
        <p className="mt-2 text-[11px] leading-relaxed text-amber-900">
          Il metodo precedente è stato interrotto dal budget: il confronto usa soltanto le righe già verificate.
        </p>
      )}
      <p className="mt-2 text-[11px] leading-relaxed text-teal-700">
        Migliore proposta trovata tra le alternative verificate, non un ottimo matematico garantito.
      </p>
    </section>
  );
}