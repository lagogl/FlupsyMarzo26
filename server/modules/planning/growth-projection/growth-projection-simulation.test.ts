import test from "node:test";
import assert from "node:assert/strict";
import {
  formatProjectionBusinessDate,
  getHatcheryArrivalDate,
  getProjectionSimulationDays,
  getSimulatedHatcheryQuantity,
  mergeAlternativeHatcheryRequirement,
  selectActualArrivedQuantity,
  simulateArrivalUntilTarget,
  simulateBasketLedgerForMonth,
} from "./growth-projection-simulation";

const localDate = (year: number, month: number, day: number) =>
  new Date(year, month - 1, day);

const dateLabels = (dates: Date[]) =>
  dates.map((date) => formatProjectionBusinessDate(date));

test("i fabbisogni alternativi dello stesso mese non duplicano l'arretrato", () => {
  const firstDeadline = mergeAlternativeHatcheryRequirement(0, 40);
  assert.equal(mergeAlternativeHatcheryRequirement(firstDeadline, 50), 50);
  assert.equal(mergeAlternativeHatcheryRequirement(firstDeadline, 30), 40);
});

test("una taglia già raggiunta all'ingresso non richiede un giorno fittizio di crescita", () => {
  const reference = localDate(2025, 4, 30);
  const result = simulateArrivalUntilTarget(
    { year: 2025, month: 4 },
    { year: 2025, month: 4 },
    reference,
    1,
    () => {
      throw new Error("Nessun giorno di crescita disponibile");
    },
    (weightMg) => weightMg >= 1,
  );
  assert.equal(result.reachedTarget, true);
  assert.equal(result.survivalFactor, 1);
  assert.equal(result.reachedDate?.getTime(), reference.getTime());
});

test("gli arrivi attuali compensano il forecast solo per la quota non ancora arrivata", () => {
  const reference = localDate(2025, 4, 10);
  const current = { year: 2025, month: 4 };

  assert.equal(getSimulatedHatcheryQuantity(current, reference, 100, 35), 65);
  assert.equal(getSimulatedHatcheryQuantity(current, reference, 100, 125), 0);
  assert.equal(getSimulatedHatcheryQuantity(current, reference, 0, 35), 0);
  assert.equal(getSimulatedHatcheryQuantity(current, reference, 100, 0), 100);
});

test("mesi passati non reiniettano hatchery e i mesi futuri usano tutto il forecast", () => {
  const reference = localDate(2025, 12, 20);

  assert.equal(
    getSimulatedHatcheryQuantity({ year: 2025, month: 11 }, reference, 100, 20),
    0,
  );
  assert.equal(
    getSimulatedHatcheryQuantity({ year: 2026, month: 1 }, reference, 100, 20),
    100,
  );
  assert.equal(
    getSimulatedHatcheryQuantity({ year: 2026, month: 1 }, reference, -1, 0),
    0,
  );
});

test("il reale live prevale sul fallback manuale solo quando esistono lotti arrivati", () => {
  assert.equal(selectActualArrivedQuantity(12, null, 0), 12);
  assert.equal(selectActualArrivedQuantity(12, 40, 2), 40);
  assert.equal(selectActualArrivedQuantity(12, 0, 1), 0);
  assert.equal(selectActualArrivedQuantity(null, null, 0), 0);
});

test("il calendario conserva la regola del giorno dopo snapshot e gestisce passato, futuro e anno nuovo", () => {
  assert.deepEqual(
    dateLabels(getProjectionSimulationDays({ year: 2025, month: 4 }, localDate(2025, 4, 14))),
    Array.from({ length: 16 }, (_, index) => `2025-04-${String(index + 15).padStart(2, "0")}`),
  );
  assert.deepEqual(
    dateLabels(getProjectionSimulationDays({ year: 2025, month: 4 }, localDate(2025, 4, 15))),
    Array.from({ length: 15 }, (_, index) => `2025-04-${String(index + 16).padStart(2, "0")}`),
  );
  assert.deepEqual(
    dateLabels(getProjectionSimulationDays({ year: 2025, month: 4 }, localDate(2025, 4, 16))),
    Array.from({ length: 14 }, (_, index) => `2025-04-${String(index + 17).padStart(2, "0")}`),
  );
  assert.deepEqual(
    getProjectionSimulationDays({ year: 2025, month: 3 }, localDate(2025, 4, 14)),
    [],
  );
  assert.deepEqual(
    dateLabels(getProjectionSimulationDays({ year: 2024, month: 2 }, localDate(2024, 1, 31))),
    Array.from({ length: 29 }, (_, index) => `2024-02-${String(index + 1).padStart(2, "0")}`),
  );
  assert.deepEqual(
    dateLabels(getProjectionSimulationDays({ year: 2024, month: 2 }, localDate(2024, 2, 28))),
    ["2024-02-29"],
  );
  assert.deepEqual(
    getProjectionSimulationDays({ year: 2024, month: 2 }, localDate(2024, 2, 29)),
    [],
  );
  assert.deepEqual(
    dateLabels(getProjectionSimulationDays({ year: 2026, month: 1 }, localDate(2025, 12, 31))),
    Array.from({ length: 31 }, (_, index) => `2026-01-${String(index + 1).padStart(2, "0")}`),
  );
  assert.deepEqual(
    getProjectionSimulationDays({ year: 2025, month: 4 }, localDate(2025, 4, 30)),
    [],
  );
});

test("un batch arriva il 15 ma cresce e subisce mortalità solo dal 16; i due registri restano separati", () => {
  const reference = localDate(2025, 4, 14);
  const month = { year: 2025, month: 4 };
  const days = getProjectionSimulationDays(month, reference);
  const hatcheryArrival = getHatcheryArrivalDate(month);
  assert.equal(formatProjectionBusinessDate(hatcheryArrival), "2025-04-15");

  const initial = [
    { basketId: 1, weightMg: 100, animalCount: 100 },
    {
      basketId: 2,
      weightMg: 10,
      animalCount: 100,
      growthStartsAfter: hatcheryArrival,
    },
  ];
  const step = (state: { weightMg: number; count: number }) => ({
    weightMg: state.weightMg + 1,
    count: state.count * 0.9,
  });
  const globalLedger = simulateBasketLedgerForMonth(initial, days, step);
  const forecastLedger = simulateBasketLedgerForMonth(
    initial.map((basket) => ({ ...basket })),
    days,
    step,
  );
  assert.deepEqual(globalLedger, forecastLedger);
  assert.deepEqual(globalLedger.map((basket) => basket.weightMg), [116, 25]);
  // Mortality rounds each daily ledger step, rather than only the final count.
  assert.deepEqual(globalLedger.map((basket) => basket.animalCount), [19, 21]);
  const totalBefore = initial.reduce((sum, basket) => sum + basket.animalCount, 0);
  const totalAfter = globalLedger.reduce((sum, basket) => sum + basket.animalCount, 0);
  assert.equal(totalBefore - totalAfter, 160);
  assert.ok(totalAfter >= 0);
});

test("il calendario al 15 o dopo non ricostruisce biologicamente i giorni precedenti allo snapshot", () => {
  const month = { year: 2024, month: 2 };
  const arrival = getHatcheryArrivalDate(month);
  const basket = {
    basketId: 1,
    weightMg: 100,
    animalCount: 100,
    growthStartsAfter: arrival,
  };
  const step = (state: { weightMg: number; count: number }) => ({
    weightMg: state.weightMg + 1,
    count: state.count - 1,
  });

  const onArrivalDay = simulateBasketLedgerForMonth(
    [basket],
    getProjectionSimulationDays(month, localDate(2024, 2, 15)),
    step,
  )[0];
  const afterArrivalDay = simulateBasketLedgerForMonth(
    [basket],
    getProjectionSimulationDays(month, localDate(2024, 2, 16)),
    step,
  )[0];

  assert.equal(onArrivalDay.weightMg, 114);
  assert.equal(afterArrivalDay.weightMg, 113);
  assert.equal(onArrivalDay.animalCount, 86);
  assert.equal(afterArrivalDay.animalCount, 87);
});

test("la simulazione del fabbisogno parte dal 16 e usa soltanto giorni fino al mese di consegna", () => {
  const arrivalMonth = { year: 2024, month: 2 };
  const reference = localDate(2024, 2, 15);
  const observedDays: string[] = [];
  const growth = simulateArrivalUntilTarget(
    arrivalMonth,
    arrivalMonth,
    reference,
    1,
    (state, date) => {
      observedDays.push(formatProjectionBusinessDate(date));
      return { weightMg: state.weightMg + 1, count: state.count * 0.9 };
    },
    (weightMg) => weightMg >= 3,
  );

  assert.equal(growth.reachedTarget, true);
  assert.equal(formatProjectionBusinessDate(growth.reachedDate!), "2024-02-17");
  assert.deepEqual(observedDays, ["2024-02-16", "2024-02-17"]);
  assert.equal(growth.survivalFactor, 0.81);

  const tooLate = simulateArrivalUntilTarget(
    arrivalMonth,
    arrivalMonth,
    reference,
    1,
    (state, date) => ({ weightMg: state.weightMg + 1, count: state.count }),
    (weightMg) => weightMg >= 20,
  );
  assert.equal(tooLate.reachedTarget, false);
  assert.equal(tooLate.reachedDate, null);
});

test("un arrivo in un mese passato non produce una raccomandazione retroattiva", () => {
  const result = simulateArrivalUntilTarget(
    { year: 2024, month: 1 },
    { year: 2024, month: 3 },
    localDate(2024, 2, 10),
    1,
    (state) => ({ weightMg: state.weightMg + 1, count: state.count }),
    (weightMg) => weightMg >= 2,
  );
  assert.equal(result.reachedTarget, false);
  assert.equal(result.survivalFactor, 1);
});
