// Entirely synthetic quantities: no customer names, database snapshots or credentials.
const deadline = (requested, covered, arrearsFulfilled = 0, unverifiable = 0) => ({
  requested, covered, uncovered: requested - covered, arrearsFulfilled, unverifiable,
});

const complete = {
  month: 10, year: 2026, monthName: "Ottobre", monthShort: "Ott", monthLabel: "Ott 2026",
  ordiniTarget: 7000, ordiniTotali: 10000,
  ordiniBySize: { "TP-1000": 3000, "TP-3000": 7000 },
  ordiniEvasiBySize: { "TP-1000": 2000, "TP-3000": 5500 },
  ordiniEvasiTotali: 7500,
  ordiniArretratiBySize: { "TP-3000": 4000, "TP-4000": 1200 },
  ordiniArretratiEvasiBySize: { "TP-3000": 2500, "TP-4000": 1200 },
  ordiniArretratiTotali: 5200, ordiniEvasiArretratiTotali: 3700,
  ordiniScopertiBySize: { "TP-1000": 1000, "TP-3000": 1500 },
  disponibilitaBiologicaBySize: { "TP-300": 6000, "TP-1000": 3000, "TP-3000": 8000, "TP-4000": 3000 },
  disponibilitaBiologicaTotale: 20000,
  assegnatiDaTargetOSuperiori: 5300, assegnatiDaTaglieInferiori: 2200,
  scopertoTarget: 1500, recuperoSchiuditoio: "non-recuperabile",
  deliveryCoverage: {
    ...deadline(10000, 4000, 600, 200),
    bySize: { "TP-1000": deadline(3000, 1000), "TP-3000": deadline(7000, 3000, 600, 200) },
  },
  ordiniArretrati: 4000, ordiniEvasi: 8000,
  budgetProduzione: 13000, forecastImpegnatoOSeminatoPrecedente: 1700,
  disponibilitaForecastInizioMese: 11000, forecastEvadibileTarget: 11000,
  forecastNonCoperto: 2000, seminaSandNurseryPianificata: 0, disponibilitaSandNursery: 0,
  domandaEffettiva: 7000, arriviSchiuditoio: 6000,
  giacenzaLordaInventario: 9000, giacenzaLordaConSchiuditoio: 11000,
  giacenzaNetTarget: 2000, schiuditoioNecessario: 0, perditeMortalita: 500,
};

const missing = { ...complete, month: 11, monthName: "Novembre", monthShort: "Nov", monthLabel: "Nov 2026" };
for (const field of [
  "ordiniEvasiBySize", "ordiniEvasiTotali", "ordiniArretratiBySize",
  "ordiniArretratiEvasiBySize", "ordiniEvasiArretratiTotali",
  "disponibilitaBiologicaBySize", "disponibilitaBiologicaTotale",
  "assegnatiDaTargetOSuperiori", "assegnatiDaTaglieInferiori",
  "scopertoTarget", "recuperoSchiuditoio", "deliveryCoverage",
]) delete missing[field];

const group = (size, quantity, alreadyAtTarget) => ({
  currentSize: size, currentAvgAnimalsPerKg: alreadyAtTarget ? 2500 : 20000,
  currentQuantity: quantity, basketCount: 2, alreadyAtTarget,
  monthReached: alreadyAtTarget ? null : "Ott 2026",
  months: [complete, missing].map(m => ({
    month: m.month, year: m.year, monthName: m.monthName, monthShort: m.monthShort,
    monthLabel: m.monthLabel, avgAnimalsPerKg: 2500, projectedSize: "TP-3000",
    quantity: 4321, reachedTarget: true,
  })),
});

export const projection = {
  targetSize: "TP-3000", targetMaxAnimalsPerKg: 3000,
  generatedAt: "2026-10-01T08:00:00.000Z", year: 2026, mortalityPercent: 5,
  monthsHorizon: 2, monthsToReachTarget: 4,
  totalCurrentQuantity: 166665, totalAlreadyAtTarget: 77777, totalNotYetAtTarget: 88888,
  groups: [group("TP-3000", 77777, true), group("TP-300", 88888, false)],
  monthlyContext: [complete, missing], deliveryCoverageUnverifiable: 333,
  orderQuotaWarnings: ["Ordine fixture 12: consegne fuori periodo o ambigue; mantenute quote lorde cautelative, riconciliare."],
};

export const apiFixtures = {
  "/api/users/current": { success: true, user: { id: 1, username: "growth-browser-fixture", role: "user", language: "it" } },
  "/api/proiezione-crescita": projection,
  "/api/proiezione-crescita/hatchery-arrivals": [],
  "/api/proiezione-crescita/production-targets": [],
  "/api/menu-preferences/1": { success: true, data: { menuItems: [], hiddenMenuItems: [], compactModeEnabled: false } },
  "/api/cycles/pending-closures/count": { count: 0 },
  "/api/notifications": { success: true, notifications: [] },
  "/api/proxy/tide-data": [],
};