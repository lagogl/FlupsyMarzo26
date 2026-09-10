import test from "node:test";
import assert from "node:assert/strict";
import { calculateGrowthProjectionIndicators, ProjectionIndicatorMonth } from "./growthProjectionIndicators";

function month(overrides: Partial<ProjectionIndicatorMonth> = {}): ProjectionIndicatorMonth {
  return {
    monthLabel: "Gen",
    domandaEffettiva: 0,
    ordiniArretrati: 0,
    ordiniEvasi: 0,
    arriviSchiuditoio: 0,
    giacenzaLordaInventario: 0,
    giacenzaLordaConSchiuditoio: 0,
    schiuditoioNecessario: 0,
    ...overrides,
  };
}

test("calcola la copertura su domanda corrente e solo arretrato iniziale", () => {
  const result = calculateGrowthProjectionIndicators([
    month({ domandaEffettiva: 100, ordiniArretrati: 40, ordiniEvasi: 90 }),
    month({ monthLabel: "Feb", domandaEffettiva: 60, ordiniArretrati: 50, ordiniEvasi: 50 }),
  ]);

  assert.equal(result.totalDemand, 200);
  assert.equal(result.totalFulfilled, 140);
  assert.equal(result.coverage, 70);
});

test("include l'arretrato in uscita dell'ultimo mese nel picco", () => {
  const result = calculateGrowthProjectionIndicators([
    month({ domandaEffettiva: 100, ordiniEvasi: 80 }),
    month({ monthLabel: "Feb", domandaEffettiva: 50, ordiniArretrati: 20, ordiniEvasi: 65 }),
    month({ monthLabel: "Mar", domandaEffettiva: 90, ordiniArretrati: 5, ordiniEvasi: 30 }),
  ]);

  assert.equal(result.peakBacklog, 65);
  assert.equal(result.peakBacklogMonth?.monthLabel, "Mar");
});

test("misura il contributo dello schiuditoio come differenza mensile, senza sommare stock", () => {
  const result = calculateGrowthProjectionIndicators([
    month({ giacenzaLordaInventario: 100, giacenzaLordaConSchiuditoio: 130 }),
    month({ monthLabel: "Feb", giacenzaLordaInventario: 80, giacenzaLordaConSchiuditoio: 125 }),
  ]);

  assert.equal(result.hatcheryContribution, 45);
  assert.equal(result.hatcheryPeakMonth?.monthLabel, "Feb");
});

test("gestisce una proiezione senza arrivi", () => {
  const result = calculateGrowthProjectionIndicators([
    month({ giacenzaLordaInventario: 100, giacenzaLordaConSchiuditoio: 100 }),
  ]);

  assert.equal(result.totalArrivals, 0);
  assert.equal(result.hatcheryContribution, 0);
  assert.equal(result.lateMonths, 0);
  assert.equal(result.stockViewsEqual, true);
});

test("conta solo gli arrivi pianificati che maturano oltre l'orizzonte", () => {
  const result = calculateGrowthProjectionIndicators([
    month({ arriviSchiuditoio: 100, arrivalTooLate: false }),
    month({ monthLabel: "Feb", arriviSchiuditoio: 200, arrivalTooLate: true }),
    month({ monthLabel: "Mar", arriviSchiuditoio: 0, arrivalTooLate: true }),
  ]);

  assert.equal(result.totalArrivals, 300);
  assert.equal(result.lateMonths, 1);
});