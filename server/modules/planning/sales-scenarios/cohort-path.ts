import type { Cohort } from "./engine";

export interface CohortPathMonth { year: number; month: number }
type Size = { sizeId: number } | null;

interface CohortPathOptions {
  entry: number;
  entryDay?: number;
  first: number;
  last: number;
  startDay: number;
  initialWeightMg: number;
  arrivalDate?: Date;
  referenceDate: Date;
  getMonth: (n: number) => CohortPathMonth;
  getSize: (weightMg: number, date: Date) => Size;
  getBiologyDays: (month: CohortPathMonth, referenceDate: Date, arrivalDate: Date) => Date[];
  advanceDay: (weightMg: number, survival: number, date: Date) => {
    weightMg: number;
    survival: number;
    mortalityFactor?: number;
  };
  trackMortality?: boolean;
}

/** Build monthly and daily snapshots for one inventory or virtual-arrival cohort. */
export function buildCohortPath(options: CohortPathOptions): Cohort["path"] {
  const {
    entry, entryDay, first, last, startDay, arrivalDate, referenceDate,
    getMonth, getSize, getBiologyDays, advanceDay,
    trackMortality,
  } = options;
  const path: Cohort["path"] = {};
  let weightMg = options.initialWeightMg;
  let survival = 1;

  for (let n = entry; n <= last; n++) {
    const { year, month } = getMonth(n);
    const day = n === entry ? (entryDay ?? (n === first ? startDay : 1)) : (n === first ? startDay : 1);
    const snapshotDate = new Date(year, month - 1, day, 12);
    const snapshotSize = getSize(weightMg, snapshotDate);
    const monthPath: Cohort["path"][number] = {
      survival,
      sizeId: snapshotSize?.sizeId ?? null,
      animalsPerKg: 1_000_000 / weightMg,
      days: {},
      ...(trackMortality ? { mortalityTracked: true, mortalityAfterSnapshot: !!arrivalDate, mortalitySteps: {} } : {}),
    };
    path[n] = monthPath;
    survival = 1;

    const daysInMonth = new Date(year, month, 0).getDate();
    const biologyDays = arrivalDate
      ? new Set(getBiologyDays({ year, month }, referenceDate, arrivalDate).map(date => date.getDate()))
      : null;

    // The cohort's arrival-day state can be sold, but that day itself has no
    // growth or mortality. In the current month, entryDay is moved forward to
    // the snapshot day by the caller so no pre-snapshot biology is replayed.
    if (arrivalDate && n === entry && entryDay != null) {
      const arrivalDateInMonth = new Date(year, month - 1, entryDay, 12);
      const arrivalSize = getSize(weightMg, arrivalDateInMonth);
      monthPath.days![entryDay] = {
        survival,
        sizeId: arrivalSize?.sizeId ?? null,
        animalsPerKg: 1_000_000 / weightMg,
      };
    }

    const firstDay = arrivalDate && n === entry ? (entryDay ?? day) + 1 : day;
    for (let d = firstDay; d <= daysInMonth; d++) {
      if (biologyDays && !biologyDays.has(d)) continue;
      const date = new Date(year, month - 1, d, 12);
      if (!arrivalDate) {
        // Preserve the established inventory convention: the daily snapshot
        // is recorded before that day's growth/mortality step.
        const size = getSize(weightMg, date);
        monthPath.days![d] = { survival, sizeId: size?.sizeId ?? null, animalsPerKg: 1_000_000 / weightMg };
      }
      const state = advanceDay(weightMg, survival, date);
      weightMg = state.weightMg;
      survival = state.survival;
      if (trackMortality && state.mortalityFactor != null) {
        const size = getSize(weightMg, date);
        monthPath.mortalitySteps![d] = {
          factor: state.mortalityFactor,
          sizeId: size?.sizeId ?? null,
          afterSnapshot: !!arrivalDate,
        };
      }
      if (trackMortality && state.mortalityFactor == null) monthPath.mortalityTracked = false;
      if (arrivalDate) {
        // Hatchery snapshots represent biology applied on this allowed date.
        const size = getSize(weightMg, date);
        monthPath.days![d] = { survival, sizeId: size?.sizeId ?? null, animalsPerKg: 1_000_000 / weightMg };
      }
    }
  }
  return path;
}