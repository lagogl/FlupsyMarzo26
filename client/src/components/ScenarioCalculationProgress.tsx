import { useEffect, useState } from "react";
import { Clock3, LoaderCircle } from "lucide-react";
import "./ScenarioCalculationProgress.css";

type ScenarioCalculationProgressProps = {
  kind: "proposal" | "simulation";
  startedAt: number;
};

function formatElapsed(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  if (totalSeconds < 60) {
    return `${totalSeconds} ${totalSeconds === 1 ? "secondo" : "secondi"}`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function ScenarioCalculationProgress({
  kind,
  startedAt,
}: ScenarioCalculationProgressProps) {
  const [now, setNow] = useState(() => Date.now());
  const elapsed = Math.max(0, now - startedAt);
  const isLongWait = elapsed >= 30_000;
  const isProposal = kind === "proposal";

  useEffect(() => {
    setNow(Date.now());
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [startedAt]);

  return (
    <section
      className={`scenario-progress scenario-progress--${kind}`}
      aria-label={isProposal ? "Preparazione proposta" : "Ricalcolo scenario"}
      data-testid="scenario-calculation-progress"
      data-kind={kind}
    >
      <div className="scenario-progress__top">
        <div className="scenario-progress__icon" aria-hidden="true">
          <LoaderCircle className="scenario-progress__spinner" size={19} strokeWidth={2} />
        </div>
        <div className="scenario-progress__heading">
          <h3>{isProposal ? "Preparazione proposta" : "Ricalcolo scenario"}</h3>
          <p className="scenario-progress__status" role="status" aria-live="polite">
            Elaborazione in corso
          </p>
        </div>
        <div
          className="scenario-progress__elapsed"
          data-testid="scenario-calculation-elapsed"
          aria-live="off"
        >
          <Clock3 size={14} aria-hidden="true" />
          <span>{formatElapsed(elapsed)}</span>
        </div>
      </div>

      <p className="scenario-progress__description">
        {isProposal
          ? "Stiamo preparando una proposta che considera disponibilità, cassa e protezione degli ordini futuri."
          : "Stiamo ricalcolando le proiezioni attese e prudenti dello scenario."}
      </p>

      <div
        className="scenario-progress__track"
        role="progressbar"
        aria-label={isProposal ? "Preparazione proposta in corso" : "Ricalcolo scenario in corso"}
        aria-valuetext="Elaborazione in corso"
      >
        <span className="scenario-progress__bar" />
      </div>

      {isLongWait && (
        <p className="scenario-progress__guidance" data-testid="scenario-calculation-wait-guidance">
          Stiamo ancora aspettando la risposta. L’esito verrà mostrato quando l’elaborazione sarà
          terminata.
        </p>
      )}
    </section>
  );
}