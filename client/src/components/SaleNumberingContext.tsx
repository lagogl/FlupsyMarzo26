export type SaleNumberingContextData = {
  companyId?: number;
  year?: number;
  ddt?: {
    highestFic?: number | null;
    highestLocal?: number | null;
    excludedLegacyNumbers?: number[];
    proposed?: number | null;
    number?: number | null;
    status?: string | null;
    canRelease?: boolean;
  };
  ddr?: {
    applicable?: boolean;
    highestAssigned?: number | null;
    proposed?: number | null;
    number?: number | null;
    year?: number | null;
    canRelease?: boolean;
  };
};

type NumberingSection = "all" | "ddt" | "ddr";

type SaleNumberingContextProps = {
  companyId?: number | null;
  companyName?: string | null;
  year?: number | null;
  data?: SaleNumberingContextData | null;
  isLoading?: boolean;
  isError?: boolean;
  section?: NumberingSection;
  compact?: boolean;
};

export function getSaleNumberingYear(saleDate: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(saleDate);
  if (!match) return null;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  return year > 0
    && date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
    ? year
    : null;
}

function NumberValue({ value, emptyText = "Nessun numero registrato" }: {
  value?: number | null;
  emptyText?: string;
}) {
  return value == null
    ? <span className="font-medium text-muted-foreground">{emptyText}</span>
    : <span className="font-bold tabular-nums">{value.toLocaleString("it-IT")}</span>;
}

function NumberingMetric({
  label,
  value,
  description,
  highlight = false,
  emptyText
}: {
  label: string;
  value?: number | null;
  description?: string;
  highlight?: boolean;
  emptyText?: string;
}) {
  return (
    <div className={`rounded-md border px-3 py-2 ${highlight ? "border-blue-300 bg-blue-50" : "bg-background"}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-lg ${highlight ? "text-blue-900" : ""}`}>
        <NumberValue value={value} emptyText={emptyText} />
      </div>
      {description && <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>}
    </div>
  );
}

export default function SaleNumberingContext({
  companyId,
  companyName,
  year,
  data,
  isLoading = false,
  isError = false,
  section = "all",
  compact = false
}: SaleNumberingContextProps) {
  if (!companyId || !year) {
    return (
      <div className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
        Seleziona azienda e data della vendita per vedere i progressivi dell’anno corretto.
      </div>
    );
  }

  const title = `Progressivi documenti · ${companyName || `azienda ${companyId}`} · anno ${year}`;

  if (isLoading) {
    return <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">{title} · Caricamento...</div>;
  }

  if (isError || !data) {
    return (
      <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        {title}: impossibile leggere i progressivi in questo momento. La vendita può comunque proseguire.
      </div>
    );
  }

  const showDdt = section === "all" || section === "ddt";
  const showDdr = section === "all" || section === "ddr";
  const ddrApplicable = data.ddr?.applicable;

  return (
    <section
      aria-label={title}
      className={`rounded-md border border-slate-300 bg-slate-50 ${compact ? "space-y-2 p-2" : "space-y-3 p-3"}`}
      data-testid={`sale-numbering-context-${section}`}
    >
      {!compact && <div className="text-xs font-semibold uppercase tracking-wide text-slate-700">{title}</div>}
      {showDdt && (
        <div className="space-y-1.5">
          {section === "all" && <div className="text-sm font-semibold">DDT · {year}</div>}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <NumberingMetric
              label="Numero più alto presente su FIC"
              value={data.ddt?.highestFic}
              description={`Fatture in Cloud · ${year}`}
            />
            <NumberingMetric
              label="Numero più alto prenotato localmente"
              value={data.ddt?.highestLocal}
              description={`Solo DDT locali o in invio · ${year}; esclusi quelli già inviati`}
              emptyText="Nessuna prenotazione pendente"
            />
            <NumberingMetric
              label="Prossimo numero proposto"
              value={data.ddt?.proposed}
              description="La proposta può essere modificata prima della preparazione"
              highlight
              emptyText={data.ddt?.number != null
                ? "Non applicabile: vendita già numerata"
                : "Proposta non disponibile"}
            />
          </div>
          {!!data.ddt?.excludedLegacyNumbers?.length && (
            <div className="text-xs text-amber-900">
              Numeri storici locali {data.ddt.excludedLegacyNumbers.join(", ")} esclusi dal progressivo:
              i documenti collegati su FIC hanno numeri differenti. Le righe storiche restano inalterate.
            </div>
          )}
          {data.ddt?.number != null && (
            <div className="text-xs font-medium text-slate-700">
              Numero assegnato a questa vendita: DDT n. {data.ddt.number}
            </div>
          )}
        </div>
      )}
      {showDdr && (
        <div className="space-y-1.5">
          {section === "all" && <div className="text-sm font-semibold">DDR · {data.ddr?.year ?? year}</div>}
          {ddrApplicable === false ? (
            <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
              DDR non gestito dall’app per questa azienda: si utilizzano i moduli esterni.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <NumberingMetric
                  label="Numero più alto DDR già assegnato"
                  value={data.ddr?.highestAssigned}
                  description={`Azienda emittente · ${data.ddr?.year ?? year}`}
                />
                <NumberingMetric
                  label="Prossimo numero proposto"
                  value={data.ddr?.proposed}
                  description={`Progressivo DDR · ${data.ddr?.year ?? year}`}
                  highlight
                  emptyText={data.ddr?.number != null
                    ? "Non applicabile: vendita già numerata"
                    : "Proposta non disponibile"}
                />
              </div>
              {data.ddr?.number != null && (
                <div className="text-xs font-medium text-slate-700">
                  Numero assegnato a questa vendita: DDR n. {data.ddr.number}/{data.ddr.year ?? year}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}