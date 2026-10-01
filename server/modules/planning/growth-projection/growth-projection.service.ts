import { productionForecastService } from "../../../ai/production-forecast-service";
import { db } from "../../../db";
import { hatcheryArrivals, productionTargets, projectionMortalityRates, sandNurserySeedings } from "../../../../shared/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { findProjectedSize, findRangeForSize, loadGrowthSimulationContext, stepOneDay } from "../../../services/growth-simulation.service";
import {
  addForecastAllocationToLedger,
  allocateForecastAndSandNursery,
  calculateFulfillableProductionForecast,
  getProductionTargetCategory,
} from "./forecast-fulfillment";
import {
  compareProjectionMonths,
  getHatcheryArrivalDate,
  getProjectionSimulationDays,
  getSimulatedHatcheryQuantity,
  mergeAlternativeHatcheryRequirement,
  projectionMonthDate,
  projectionMonthOf,
  formatProjectionBusinessDate,
  selectActualArrivedQuantity,
  simulateArrivalUntilTarget,
  simulateBasketLedgerForMonth,
} from "./growth-projection-simulation";

const MONTH_NAMES = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const MONTH_SHORT = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

interface SizeMonthProjection {
  month: number;
  year: number;
  monthName: string;
  monthShort: string;
  monthLabel: string;
  avgAnimalsPerKg: number;
  projectedSize: string;
  quantity: number;
  reachedTarget: boolean;
}

interface SizeGroupProjection {
  currentSize: string;
  currentAvgAnimalsPerKg: number;
  currentQuantity: number;
  basketCount: number;
  alreadyAtTarget: boolean;
  monthReached: string | null;
  months: SizeMonthProjection[];
}

interface MonthlyContext {
  month: number;
  year: number;
  monthName: string;
  monthShort: string;
  monthLabel: string;
  ordiniTarget: number;
  ordiniTotali: number;
  ordiniBySize: Record<string, number>;
  ordiniEvasiBySize: Record<string, number>;
  ordiniArretrati: number;
  ordiniEvasi: number;
  budgetProduzione: number;
  forecastImpegnatoOSeminatoPrecedente: number;
  disponibilitaForecastInizioMese: number;
  forecastEvadibileTarget: number;
  forecastNonCoperto: number;
  seminaSandNurseryPianificata: number;
  disponibilitaSandNursery: number;
  domandaEffettiva: number;
  arriviSchiuditoio: number;
  arrivalTooLate: boolean;
  giacenzaLordaInventario: number;
  giacenzaLordaConSchiuditoio: number;
  giacenzaNetTarget: number;
  schiuditoioNecessario: number;
  perditeMortalita: number;
}

interface GrowthProjectionResult {
  targetSize: string;
  targetMaxAnimalsPerKg: number;
  generatedAt: string;
  year: number;
  mortalityPercent: number | null;
  monthsHorizon: number;
  monthsToReachTarget: number;
  totalCurrentQuantity: number;
  totalAlreadyAtTarget: number;
  totalNotYetAtTarget: number;
  groups: SizeGroupProjection[];
  monthlyContext: MonthlyContext[];
}

interface MonthStep {
  monthIndex: number;
  year: number;
  month1Based: number;
}

export class GrowthProjectionService {
  private async getSandNurseryRows(yearsNeeded: number[]) {
    if (yearsNeeded.length === 0) return [];
    try {
      return await db.select()
        .from(sandNurserySeedings)
        .where(inArray(sandNurserySeedings.year, yearsNeeded));
    } catch (error: any) {
      // Compatibilità temporanea per ambienti esterni non ancora migrati:
      // il default funzionale della semina manuale è zero, quindi la
      // proiezione può continuare senza consumare il residuo Forecast.
      if (error?.code === "42P01") {
        console.warn(
          "Tabella sand_nursery_seedings non presente: uso semina mensile predefinita a 0",
        );
        return [];
      }
      throw error;
    }
  }


  private buildMonthSteps(startMonth0: number, startYear: number, count: number): MonthStep[] {
    const steps: MonthStep[] = [];
    for (let i = 0; i < count; i++) {
      const totalMonth = startMonth0 + i;
      const y = startYear + Math.floor(totalMonth / 12);
      const m0 = totalMonth % 12;
      steps.push({ monthIndex: m0, year: y, month1Based: m0 + 1 });
    }
    return steps;
  }

  private async getMortalityRatesFromDb(): Promise<Record<string, Record<number, number>>> {
    const rows = await db.select().from(projectionMortalityRates);
    const lookup: Record<string, Record<number, number>> = {};
    for (const row of rows) {
      if (!lookup[row.sizeName]) lookup[row.sizeName] = {};
      lookup[row.sizeName][row.month] = row.monthlyPercentage / 100;
    }
    return lookup;
  }

  async project(targetSize: string = 'TP-3000', year?: number, mortalityPercent?: number, startMonth?: number, monthsHorizon?: number): Promise<GrowthProjectionResult> {
    const now = new Date();
    const startYear = year || now.getFullYear();
    const horizon = Math.max(12, Math.min(36, monthsHorizon || 12));
    const fallbackMortalityRates: Record<string, number> = { T1: 0.05, T3: 0.03, T10: 0.02 };

    // startMonth è 1-based (1=Gennaio…12=Dicembre); se non passato usa il mese corrente
    const currentMonth0 = startMonth != null ? startMonth - 1 : now.getMonth();
    const referenceMonth = projectionMonthOf(now);
    const startProjectionMonth = { year: startYear, month: currentMonth0 + 1 };

    const monthSteps = this.buildMonthSteps(currentMonth0, startYear, horizon);

    const yearsNeeded = [...new Set(monthSteps.map(s => s.year))];

    const [sgrLookup, basketInventory, dbMortalityRates, simCtx, ...ordersByYearArr] = await Promise.all([
      productionForecastService.getSgrLookup(),
      productionForecastService.getBasketLevelInventory(),
      this.getMortalityRatesFromDb(),
      loadGrowthSimulationContext(),
      ...yearsNeeded.map(y => productionForecastService.getOrdersByMonthAndSize(y).then(orders => ({ year: y, orders })))
    ]);
    const targetSizeRow = simCtx.allSizes.find((size: any) => size.code === targetSize);
    const projectionStartDate = compareProjectionMonths(startProjectionMonth, referenceMonth) === 0
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
      : projectionMonthDate(startProjectionMonth);
    const targetRange = targetSizeRow
      ? findRangeForSize(targetSizeRow.id, projectionStartDate, simCtx.sizeRangeVersions)
      : null;
    if (!targetRange) throw new Error(`Taglia target ${targetSize} senza range valido alla data di proiezione`);
    const targetMaxAnimalsPerKg = targetRange.maxAnimalsPerKg;
    const targetBudgetCategory = getProductionTargetCategory(targetMaxAnimalsPerKg);

    const [budgetRows, hatcheryRows, sandNurseryRows] = await Promise.all([
      yearsNeeded.length > 0
        ? db.select().from(productionTargets).where(inArray(productionTargets.year, yearsNeeded))
        : Promise.resolve([]),
      yearsNeeded.length > 0
        ? db.select().from(hatcheryArrivals).where(inArray(hatcheryArrivals.year, yearsNeeded))
        : Promise.resolve([]),
      yearsNeeded.length > 0
        ? this.getSandNurseryRows(yearsNeeded)
        : Promise.resolve([])
    ]);

    const ordersByYearMonth: Record<string, Record<string, number>> = {};
    for (const { year: y, orders } of ordersByYearArr) {
      for (const [monthStr, sizeMap] of Object.entries(orders)) {
        const key = `${y}-${monthStr}`;
        ordersByYearMonth[key] = sizeMap as Record<string, number>;
      }
    }

    const budgetByYearMonth: Record<string, number> = {};
    for (const row of budgetRows) {
      if (row.sizeCategory !== targetBudgetCategory) continue;
      const key = `${row.year}-${row.month}`;
      if (!budgetByYearMonth[key]) budgetByYearMonth[key] = 0;
      budgetByYearMonth[key] += row.targetAnimals;
    }

    const sandNurseryByYearMonth: Record<string, number> = {};
    for (const row of sandNurseryRows) {
      sandNurseryByYearMonth[`${row.year}-${row.month}`] = Math.max(0, row.quantity);
    }

    // Manteniamo separati il reale (fallback manuale) e il forecast.
    // Il reale live dei lotti, filtrato alla data di riferimento, sostituisce il
    // fallback solo quando nel mese esiste almeno un lotto arrivato.
    const hatcheryByYearMonth: Record<string, { actual: number | null; forecast: number }> = {};
    for (const row of hatcheryRows) {
      const key = `${row.year}-${row.month}`;
      if (!hatcheryByYearMonth[key]) hatcheryByYearMonth[key] = { actual: null, forecast: 0 };
      hatcheryByYearMonth[key].forecast += row.quantity;
      if (row.actualQuantity !== null && row.actualQuantity !== undefined) {
        hatcheryByYearMonth[key].actual = (hatcheryByYearMonth[key].actual ?? 0) + row.actualQuantity;
      }
    }

    // I lotti successivi alla data di riferimento non sono reale consolidato.
    if (yearsNeeded.length > 0) {
      const liveSums = await db.execute(sql`
        SELECT EXTRACT(YEAR FROM arrival_date)::int AS year,
               EXTRACT(MONTH FROM arrival_date)::int AS month,
               COALESCE(SUM(animal_count), 0)::bigint AS total,
               COUNT(*)::int AS lot_count
        FROM lots
        WHERE EXTRACT(YEAR FROM arrival_date)::int IN (${sql.join(yearsNeeded.map(y => sql`${y}`), sql`, `)})
          AND arrival_date <= ${formatProjectionBusinessDate(now)}::date
        GROUP BY 1, 2
      `);
      for (const row of liveSums.rows as any[]) {
        const key = `${Number(row.year)}-${Number(row.month)}`;
        const total = Number(row.total);
        if (!hatcheryByYearMonth[key]) hatcheryByYearMonth[key] = { actual: null, forecast: 0 };
        hatcheryByYearMonth[key].actual = selectActualArrivedQuantity(
          hatcheryByYearMonth[key].actual,
          total,
          Number(row.lot_count),
        );
      }
    }

    const grouped: Record<string, Array<{basketId: number, animalsPerKg: number, animalCount: number}>> = {};
    for (const b of basketInventory) {
      const size = findProjectedSize(1_000_000 / b.animalsPerKg, projectionStartDate, simCtx.sizeRangeVersions);
      if (!size) continue;
      const saleSize = size.code;
      if (!grouped[saleSize]) grouped[saleSize] = [];
      grouped[saleSize].push({ ...b });
    }

    const sortedSizes = Object.keys(grouped).sort((a, b) => {
      const sizeA = simCtx.allSizes.find((size: any) => size.code === a);
      const sizeB = simCtx.allSizes.find((size: any) => size.code === b);
      const rangeA = sizeA ? findRangeForSize(sizeA.id, projectionStartDate, simCtx.sizeRangeVersions) : null;
      const rangeB = sizeB ? findRangeForSize(sizeB.id, projectionStartDate, simCtx.sizeRangeVersions) : null;
      return (rangeB?.maxAnimalsPerKg ?? 0) - (rangeA?.maxAnimalsPerKg ?? 0);
    });

    let hatcheryBasketCounter = 900000;

    let globalBaskets: Array<{
      basketId: number;
      weightMg: number;
      animalCount: number;
      isHatchery: boolean;
      alreadyAtTarget: boolean;
      growthStartsAfter?: Date;
    }> = [];
    for (const sizeKey of sortedSizes) {
      for (const b of grouped[sizeKey]) {
        globalBaskets.push({
          basketId: b.basketId,
          weightMg: 1000000 / b.animalsPerKg,
          animalCount: b.animalCount,
          isHatchery: false,
          alreadyAtTarget: b.animalsPerKg <= targetMaxAnimalsPerKg
        });
      }
    }
    let forecastBaskets = globalBaskets.map(basket => ({ ...basket }));

    const useCustomMortality = mortalityPercent !== undefined && mortalityPercent !== null;
    const customMonthlyRate = useCustomMortality ? mortalityPercent! / 100 : 0;

    const monthlyContext: MonthlyContext[] = [];
    let carryOver = 0;
    let forecastCommittedOrSeededLedger = 0;
    const crossesYear = yearsNeeded.length > 1;

    for (let i = 0; i < monthSteps.length; i++) {
      const step = monthSteps[i];
      const m0 = step.monthIndex;
      const y = step.year;
      const projectionMonth = { year: y, month: step.month1Based };
      const simulationDays = getProjectionSimulationDays(projectionMonth, now);

      const ymKey = `${y}-${step.month1Based}`;
      const monthDate = compareProjectionMonths(projectionMonth, referenceMonth) === 0
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
        : projectionMonthDate(projectionMonth);
      const datedTargetRange = findRangeForSize(targetSizeRow.id, monthDate, simCtx.sizeRangeVersions);
      if (!datedTargetRange) throw new Error(`Taglia target ${targetSize} senza range valido in ${ymKey}`);
      const datedTargetMaxApk = datedTargetRange.maxAnimalsPerKg;
      const hatcheryEntry = hatcheryByYearMonth[ymKey];
      const hatcheryThisMonth = hatcheryEntry
        ? getSimulatedHatcheryQuantity(
            projectionMonth,
            now,
            hatcheryEntry.forecast,
            hatcheryEntry.actual ?? 0,
          )
        : 0;
      if (hatcheryThisMonth > 0) {
        const tp300 = simCtx.allSizes.find((size: any) => size.code === "TP-300");
        const hatcheryDate = getHatcheryArrivalDate(projectionMonth);
        const hatcheryRange = tp300
          ? findRangeForSize(tp300.id, hatcheryDate, simCtx.sizeRangeVersions)
          : null;
        if (!hatcheryRange) throw new Error("TP-300 senza range valido per l'arrivo schiuditoio");
        const hatcheryApk = hatcheryRange.maxAnimalsPerKg;
        const hatcheryBasket = {
          basketId: hatcheryBasketCounter++,
          weightMg: 1000000 / hatcheryApk,
          animalCount: hatcheryThisMonth,
          isHatchery: true,
          alreadyAtTarget: false,
          growthStartsAfter: hatcheryDate,
        };
        globalBaskets.push(hatcheryBasket);
        forecastBaskets.push({ ...hatcheryBasket });
      }

      const totalBeforeMortality = globalBaskets.reduce((s, b) => s + b.animalCount, 0);

      // Entrambi i registri usano lo stesso calendario; i batch schiuditoio
      // restano fermi fino al giorno successivo al loro arrivo (15 -> 16).
      const overrideMortality = useCustomMortality ? customMonthlyRate : undefined;
      const dailyStep = (state: { weightMg: number; count: number }, date: Date) =>
        stepOneDay(simCtx, state, date, overrideMortality);
      globalBaskets = simulateBasketLedgerForMonth(globalBaskets, simulationDays, dailyStep);
      forecastBaskets = simulateBasketLedgerForMonth(forecastBaskets, simulationDays, dailyStep);

      const totalAfterMortality = globalBaskets.reduce((s, b) => s + b.animalCount, 0);
      const perditeMortalita = Math.max(0, totalBeforeMortality - totalAfterMortality);

      let giacenzaLordaInventario = 0;
      let giacenzaLordaConSchiuditoio = 0;
      for (const b of globalBaskets) {
        const apk = 1000000 / b.weightMg;
        if (apk <= datedTargetMaxApk) {
          giacenzaLordaConSchiuditoio += b.animalCount;
          if (!b.isHatchery) {
            giacenzaLordaInventario += b.animalCount;
          }
        }
      }

      const ordiniMonth = ordersByYearMonth[ymKey] || {};
      const ordiniTarget = ordiniMonth[targetSize] || 0;
      const ordiniBySize: Record<string, number> = {};
      let ordiniTotali = 0;
      for (const [sz, qty] of Object.entries(ordiniMonth)) {
        if (typeof qty === 'number' && qty > 0) {
          ordiniBySize[sz] = qty;
          ordiniTotali += qty;
        }
      }
      const budgetMese = budgetByYearMonth[ymKey] || 0;
      const giacenzaDisponibileForecast = forecastBaskets
        .filter(b => (1000000 / b.weightMg) <= datedTargetMaxApk && b.animalCount > 0)
        .reduce((sum, b) => sum + b.animalCount, 0);
      // Snapshot del solo percorso Forecast prima delle allocazioni del mese.
      // Non confrontare questo valore con globalBaskets: quel percorso appartiene agli ordini.
      const forecastImpegnatoOSeminatoPrecedente = forecastCommittedOrSeededLedger;
      const forecastEvadibileTarget = calculateFulfillableProductionForecast(
        budgetMese,
        giacenzaDisponibileForecast,
      );
      const forecastNonCoperto = Math.max(0, budgetMese - forecastEvadibileTarget);
      const seminaSandNurseryPianificata = sandNurseryByYearMonth[ymKey] || 0;
      const forecastEligibleBaskets = forecastBaskets
        .filter(b => (1000000 / b.weightMg) <= datedTargetMaxApk && b.animalCount > 0)
        .sort((a, b) => (1000000 / a.weightMg) - (1000000 / b.weightMg));
      // Solo la quantità pianificata manualmente viene seminata in Sand Nursery.
      // Il residuo non assegnato resta nel pool Forecast per i mesi successivi.
      const { seedingApplied: disponibilitaSandNursery } =
        allocateForecastAndSandNursery(
          forecastEligibleBaskets,
          forecastEvadibileTarget,
          seminaSandNurseryPianificata,
        );
      forecastCommittedOrSeededLedger = addForecastAllocationToLedger(
        forecastCommittedOrSeededLedger,
        forecastEvadibileTarget,
        disponibilitaSandNursery,
      );
      const domandaEffettiva = ordiniTarget;
      const ordiniArretrati = carryOver;

      // Pre-compute snapshot of available animals per size threshold (before TP-target removal)
      // Used for per-size fulfillment indicator on non-target sizes
      const ordiniEvasiBySize: Record<string, number> = {};
      for (const [sz, qty] of Object.entries(ordiniBySize)) {
        if (!qty || sz === targetSize) continue;
        const orderSize = simCtx.allSizes.find((size: any) => size.code === sz);
        const orderRange = orderSize
          ? findRangeForSize(orderSize.id, monthDate, simCtx.sizeRangeVersions)
          : null;
        if (!orderRange) continue;
        const available = globalBaskets
          .filter(b => (1000000 / b.weightMg) <= orderRange.maxAnimalsPerKg && b.animalCount > 0)
          .reduce((s, b) => s + b.animalCount, 0);
        ordiniEvasiBySize[sz] = Math.min(available, qty);
      }

      const totalToFulfill = domandaEffettiva + ordiniArretrati;
      let ordiniEvasi = 0;
      if (totalToFulfill > 0) {
        let toFulfill = totalToFulfill;
        const eligibleBaskets = globalBaskets
          .filter(b => (1000000 / b.weightMg) <= datedTargetMaxApk && b.animalCount > 0)
          .sort((a, b) => (1000000 / a.weightMg) - (1000000 / b.weightMg));

        for (const eb of eligibleBaskets) {
          if (toFulfill <= 0) break;
          const take = Math.min(eb.animalCount, toFulfill);
          eb.animalCount -= take;
          toFulfill -= take;
          ordiniEvasi += take;
        }
      }
      // For target size use the accurate simulation result (includes carryOver logic)
      if (ordiniBySize[targetSize]) ordiniEvasiBySize[targetSize] = ordiniEvasi;
      carryOver = totalToFulfill - ordiniEvasi;

      let giacenzaNetTarget = 0;
      for (const b of globalBaskets) {
        const apk = 1000000 / b.weightMg;
        if (apk <= datedTargetMaxApk) {
          giacenzaNetTarget += b.animalCount;
        }
      }

      const label = crossesYear ? `${MONTH_SHORT[m0]} ${String(y).slice(-2)}` : MONTH_SHORT[m0];

      monthlyContext.push({
        month: step.month1Based,
        year: y,
        monthName: `${MONTH_NAMES[m0]} ${y}`,
        monthShort: MONTH_SHORT[m0],
        monthLabel: label,
        ordiniTarget,
        ordiniTotali,
        ordiniBySize,
        ordiniEvasiBySize,
        ordiniArretrati,
        ordiniEvasi,
        budgetProduzione: budgetMese,
        forecastImpegnatoOSeminatoPrecedente,
        disponibilitaForecastInizioMese: giacenzaDisponibileForecast,
        forecastEvadibileTarget,
        forecastNonCoperto,
        seminaSandNurseryPianificata,
        disponibilitaSandNursery,
        domandaEffettiva,
        arriviSchiuditoio: hatcheryThisMonth,
        arrivalTooLate: false,
        giacenzaLordaInventario,
        giacenzaLordaConSchiuditoio,
        giacenzaNetTarget,
        schiuditoioNecessario: 0,
        perditeMortalita
      });
    }

    // Il fabbisogno parte dal giorno successivo al 15 e usa il range TP-300
    // attivo alla data di ingresso, proprio come gli arrivi simulati.
    const tp300 = simCtx.allSizes.find((size: any) => size.code === "TP-300");
    if (!tp300) throw new Error("Taglia TP-300 non configurata");
    const overrideMortality = useCustomMortality ? customMonthlyRate : undefined;
    const simulateArrivalToMonth = (
      arrivalIndex: number,
      deliveryIndex: number,
    ) => {
      const arrivalStep = monthSteps[arrivalIndex];
      const deliveryStep = monthSteps[deliveryIndex];
      const arrivalMonth = {
        year: arrivalStep.year,
        month: arrivalStep.month1Based,
      };
      const deliveryMonth = {
        year: deliveryStep.year,
        month: deliveryStep.month1Based,
      };
      const arrivalDate = getHatcheryArrivalDate(arrivalMonth);
      const arrivalRange = findRangeForSize(tp300.id, arrivalDate, simCtx.sizeRangeVersions);
      if (!arrivalRange) return null;
      return simulateArrivalUntilTarget(
        arrivalMonth,
        deliveryMonth,
        now,
        1_000_000 / arrivalRange.maxAnimalsPerKg,
        (state, date) => stepOneDay(simCtx, state, date, overrideMortality),
        (weightMg, date) => {
          const activeTargetRange = findRangeForSize(
            targetSizeRow.id,
            date,
            simCtx.sizeRangeVersions,
          );
          return !!activeTargetRange &&
            1_000_000 / weightMg <= activeTargetRange.maxAnimalsPerKg;
        },
      );
    };

    const firstArrivalIndex = monthSteps.findIndex((step) =>
      compareProjectionMonths(
        { year: step.year, month: step.month1Based },
        referenceMonth,
      ) >= 0,
    );
    let monthsToReachTarget = -1;
    if (firstArrivalIndex >= 0) {
      const firstArrivalResult = simulateArrivalToMonth(
        firstArrivalIndex,
        monthSteps.length - 1,
      );
      if (firstArrivalResult?.reachedDate) {
        const reachedMonth = projectionMonthOf(firstArrivalResult.reachedDate);
        const reachedIndex = monthSteps.findIndex((step) =>
          step.year === reachedMonth.year && step.month1Based === reachedMonth.month,
        );
        if (reachedIndex >= 0) monthsToReachTarget = reachedIndex - firstArrivalIndex;
      }
    }

    // Ogni mese di fabbisogno è uno scenario alternativo: assegna il gap
    // all'arrivo più tardivo che raggiunge la taglia entro la fine di quel mese.
    for (let i = 0; i < monthlyContext.length; i++) {
      const gap = (monthlyContext[i].domandaEffettiva + monthlyContext[i].ordiniArretrati) - monthlyContext[i].ordiniEvasi;
      const deliveryMonth = {
        year: monthlyContext[i].year,
        month: monthlyContext[i].month,
      };
      if (gap > 0 && compareProjectionMonths(deliveryMonth, referenceMonth) >= 0) {
        for (let arrivalIndex = i; arrivalIndex >= 0; arrivalIndex--) {
          const arrivalMonth = {
            year: monthSteps[arrivalIndex].year,
            month: monthSteps[arrivalIndex].month1Based,
          };
          if (compareProjectionMonths(arrivalMonth, referenceMonth) < 0) continue;
          const growth = simulateArrivalToMonth(arrivalIndex, i);
          if (growth?.reachedTarget && growth.survivalFactor > 0) {
            monthlyContext[arrivalIndex].schiuditoioNecessario =
              mergeAlternativeHatcheryRequirement(
                monthlyContext[arrivalIndex].schiuditoioNecessario,
                Math.ceil(gap / growth.survivalFactor),
              );
            break;
          }
        }
      }
    }

    for (let i = 0; i < monthlyContext.length; i++) {
      const arrivalMonth = {
        year: monthSteps[i].year,
        month: monthSteps[i].month1Based,
      };
      const futureGrowth = compareProjectionMonths(arrivalMonth, referenceMonth) >= 0
        ? simulateArrivalToMonth(i, monthSteps.length - 1)
        : null;
      monthlyContext[i].arrivalTooLate = !futureGrowth?.reachedTarget;
    }

    const groups: SizeGroupProjection[] = [];

    for (const sizeKey of sortedSizes) {
      const basketsInGroup = grouped[sizeKey];
      const totalQty = basketsInGroup.reduce((s, b) => s + b.animalCount, 0);
      const avgApk = Math.round(
        basketsInGroup.reduce((s, b) => s + b.animalsPerKg * b.animalCount, 0) / totalQty
      );

      const alreadyAtTarget = avgApk <= targetRange.maxAnimalsPerKg;

      let workingBaskets = basketsInGroup.map(b => ({
        basketId: b.basketId,
        weightMg: 1000000 / b.animalsPerKg,
        animalCount: b.animalCount
      }));

      const months: SizeMonthProjection[] = [];
      let monthReached: string | null = alreadyAtTarget ? 'Già raggiunta' : null;

      for (let i = 0; i < monthSteps.length; i++) {
        const step = monthSteps[i];
        const m0 = step.monthIndex;
        const y = step.year;
        const simulationDays = getProjectionSimulationDays(
          { year: y, month: step.month1Based },
          now,
        );
        workingBaskets = simulateBasketLedgerForMonth(
          workingBaskets,
          simulationDays,
          (state, date) => stepOneDay(
            simCtx,
            state,
            date,
            useCustomMortality ? customMonthlyRate : undefined,
          ),
        );

        const totalAnimals = workingBaskets.reduce((s, b) => s + b.animalCount, 0);
        const weightedApk = totalAnimals > 0
          ? Math.round(workingBaskets.reduce((s, b) => s + (1000000 / b.weightMg) * b.animalCount, 0) / totalAnimals)
          : 0;

        const monthDate = new Date(y, m0 + 1, 0);
        const projectedSize = weightedApk > 0
          ? findProjectedSize(1_000_000 / weightedApk, monthDate, simCtx.sizeRangeVersions)
          : null;
        const monthTargetRange = findRangeForSize(targetSizeRow.id, monthDate, simCtx.sizeRangeVersions);
        const projSize = projectedSize?.code ?? "N/D";
        const reached = !!monthTargetRange && weightedApk <= monthTargetRange.maxAnimalsPerKg && weightedApk > 0;

        if (reached && !monthReached && !alreadyAtTarget) {
          monthReached = `${MONTH_NAMES[m0]} ${y}`;
        }

        const label = crossesYear ? `${MONTH_SHORT[m0]} ${String(y).slice(-2)}` : MONTH_SHORT[m0];

        months.push({
          month: step.month1Based,
          year: y,
          monthName: `${MONTH_NAMES[m0]} ${y}`,
          monthShort: MONTH_SHORT[m0],
          monthLabel: label,
          avgAnimalsPerKg: weightedApk,
          projectedSize: projSize,
          quantity: totalAnimals,
          reachedTarget: reached
        });
      }

      groups.push({
        currentSize: sizeKey,
        currentAvgAnimalsPerKg: avgApk,
        currentQuantity: totalQty,
        basketCount: basketsInGroup.length,
        alreadyAtTarget,
        monthReached,
        months
      });
    }

    const totalCurrentQty = groups.reduce((s, g) => s + g.currentQuantity, 0);
    const totalAlready = groups.filter(g => g.alreadyAtTarget).reduce((s, g) => s + g.currentQuantity, 0);

    return {
      targetSize,
      targetMaxAnimalsPerKg,
      generatedAt: now.toISOString(),
      year: startYear,
      mortalityPercent: mortalityPercent ?? null,
      monthsHorizon: horizon,
      monthsToReachTarget,
      totalCurrentQuantity: totalCurrentQty,
      totalAlreadyAtTarget: totalAlready,
      totalNotYetAtTarget: totalCurrentQty - totalAlready,
      groups,
      monthlyContext
    };
  }
}

export const growthProjectionService = new GrowthProjectionService();
