export interface HatcheryPresentationRecord {
  id: number;
  year: number;
  month: number;
  quantity: number;
  actualQuantity: number | null;
  actualLockedAt?: string | null;
  sizeCategory: string;
  notes?: string | null;
  calculatedActual?: number;
  calculatedActualLotCount?: number | null;
}

export interface HatcheryPresentationMonth {
  year: number;
  month: number;
  records: HatcheryPresentationRecord[];
  forecastQuantity: number;
  actualQuantity: number | null;
  calculatedActualLotCount: number;
  injectedQuantity: number;
}

export interface HatcheryInjectedMonth {
  year: number;
  month: number;
  arriviSchiuditoio: number;
}

const monthKey = (year: number, month: number) => `${year}-${month}`;

export function buildHatcheryActualUpdate(
  record: Pick<HatcheryPresentationRecord, "year" | "month" | "sizeCategory">,
  actualQuantity: number,
) {
  return { year: record.year, month: record.month, sizeCategory: record.sizeCategory, actualQuantity };
}

export function getAdditionalHatcheryNeed(recommendation: number): number {
  // The recommendation is already derived from gaps after planned arrivals participate.
  return recommendation;
}

export function aggregateHatcheryPresentation(
  records: HatcheryPresentationRecord[],
  monthlyContext: HatcheryInjectedMonth[] = [],
): HatcheryPresentationMonth[] {
  const injectedByMonth = new Map(
    monthlyContext.map(month => [monthKey(month.year, month.month), month.arriviSchiuditoio]),
  );
  const grouped = new Map<string, HatcheryPresentationMonth>();

  for (const record of records) {
    const key = monthKey(record.year, record.month);
    let summary = grouped.get(key);
    if (!summary) {
      summary = {
        year: record.year,
        month: record.month,
        records: [],
        forecastQuantity: 0,
        actualQuantity: null,
        calculatedActualLotCount: 0,
        injectedQuantity: injectedByMonth.get(key) ?? 0,
      };
      grouped.set(key, summary);
    }
    summary.records.push(record);
    summary.forecastQuantity += record.quantity;
    summary.calculatedActualLotCount = Math.max(
      summary.calculatedActualLotCount,
      record.calculatedActualLotCount ?? 0,
    );
  }

  for (const summary of grouped.values()) {
    const liveActualRecord = summary.records.find(record => (record.calculatedActualLotCount ?? 0) > 0);
    if (liveActualRecord) {
      // The calculated monthly total is repeated on category records; count and value once.
      summary.actualQuantity = liveActualRecord.calculatedActual ?? 0;
      continue;
    }

    // Older responses may not yet include the lot count. Keep their positive calculated total.
    const legacyCalculatedActual = summary.records.find(record =>
      record.calculatedActualLotCount == null && (record.calculatedActual ?? 0) > 0
    );
    if (legacyCalculatedActual) {
      summary.actualQuantity = legacyCalculatedActual.calculatedActual ?? 0;
      continue;
    }

    const manualActuals = summary.records
      .map(record => record.actualQuantity)
      .filter((quantity): quantity is number => quantity !== null);
    summary.actualQuantity = manualActuals.length > 0
      ? manualActuals.reduce((total, quantity) => total + quantity, 0)
      : null;
  }

  return [...grouped.values()].sort((a, b) => a.year - b.year || a.month - b.month);
}