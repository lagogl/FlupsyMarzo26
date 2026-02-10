import { productionForecastService, ProductionForecastService } from "../../../ai/production-forecast-service";
import { db } from "../../../db";
import { hatcheryArrivals, productionTargets, projectionMortalityRates } from "../../../../shared/schema";
import { eq, inArray } from "drizzle-orm";

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
  ordiniEvasi: number;
  budgetProduzione: number;
  arriviSchiuditoio: number;
  giacenzaLordaInventario: number;
  giacenzaLordaConSchiuditoio: number;
  giacenzaNetTarget: number;
  schiuditoioNecessario: number;
}

interface GrowthProjectionResult {
  targetSize: string;
  targetMaxAnimalsPerKg: number;
  generatedAt: string;
  year: number;
  mortalityPercent: number | null;
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

  async project(targetSize: string = 'TP-3000', year?: number, mortalityPercent?: number): Promise<GrowthProjectionResult> {
    const now = new Date();
    const startYear = year || now.getFullYear();
    const fallbackMortalityRates: Record<string, number> = { T1: 0.05, T3: 0.03, T10: 0.02 };

    const threshold = ProductionForecastService.SALE_SIZE_THRESHOLDS.find(t => t.size === targetSize);
    if (!threshold) throw new Error(`Taglia target ${targetSize} non trovata`);
    const targetMaxAnimalsPerKg = threshold.maxAnimalsPerKg;

    const currentMonth0 = now.getMonth();
    const currentDay = now.getDate();

    const monthSteps = this.buildMonthSteps(currentMonth0, startYear, 12);

    const yearsNeeded = [...new Set(monthSteps.map(s => s.year))];

    const [sgrLookup, basketInventory, dbMortalityRates, ...ordersByYearArr] = await Promise.all([
      productionForecastService.getSgrLookup(),
      productionForecastService.getBasketLevelInventory(),
      this.getMortalityRatesFromDb(),
      ...yearsNeeded.map(y => productionForecastService.getOrdersByMonthAndSize(y).then(orders => ({ year: y, orders })))
    ]);

    const [budgetRows, hatcheryRows] = await Promise.all([
      yearsNeeded.length > 0
        ? db.select().from(productionTargets).where(inArray(productionTargets.year, yearsNeeded))
        : Promise.resolve([]),
      yearsNeeded.length > 0
        ? db.select().from(hatcheryArrivals).where(inArray(hatcheryArrivals.year, yearsNeeded))
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
      const key = `${row.year}-${row.month}`;
      if (!budgetByYearMonth[key]) budgetByYearMonth[key] = 0;
      budgetByYearMonth[key] += row.targetAnimals;
    }

    const hatcheryByYearMonth: Record<string, number> = {};
    for (const row of hatcheryRows) {
      const key = `${row.year}-${row.month}`;
      if (!hatcheryByYearMonth[key]) hatcheryByYearMonth[key] = 0;
      hatcheryByYearMonth[key] += row.quantity;
    }

    const grouped: Record<string, Array<{basketId: number, animalsPerKg: number, animalCount: number}>> = {};
    for (const b of basketInventory) {
      const saleSize = productionForecastService.mapAnimalsPerKgToSaleSize(b.animalsPerKg);
      if (!grouped[saleSize]) grouped[saleSize] = [];
      grouped[saleSize].push({ ...b });
    }

    const sortedSizes = Object.keys(grouped).sort((a, b) => {
      const idxA = ProductionForecastService.SALE_SIZES.indexOf(a);
      const idxB = ProductionForecastService.SALE_SIZES.indexOf(b);
      return idxB - idxA;
    });

    let hatcheryBasketCounter = 900000;

    let globalBaskets: Array<{basketId: number, weightMg: number, animalCount: number, isHatchery: boolean, alreadyAtTarget: boolean}> = [];
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

    const useCustomMortality = mortalityPercent !== undefined && mortalityPercent !== null;
    const customMonthlyRate = useCustomMortality ? mortalityPercent! / 100 : 0;

    const monthlyContext: MonthlyContext[] = [];
    const crossesYear = yearsNeeded.length > 1;

    for (let i = 0; i < monthSteps.length; i++) {
      const step = monthSteps[i];
      const m0 = step.monthIndex;
      const y = step.year;
      const daysInMonth = new Date(y, m0 + 1, 0).getDate();
      let simulDays = daysInMonth;
      if (i === 0) {
        simulDays = Math.max(0, daysInMonth - currentDay);
      }

      const ymKey = `${y}-${step.month1Based}`;
      const hatcheryThisMonth = hatcheryByYearMonth[ymKey] || 0;
      if (hatcheryThisMonth > 0) {
        const tp300Threshold = ProductionForecastService.SALE_SIZE_THRESHOLDS.find(t => t.size === 'TP-300');
        const hatcheryApk = tp300Threshold ? tp300Threshold.maxAnimalsPerKg : 30000000;
        globalBaskets.push({
          basketId: hatcheryBasketCounter++,
          weightMg: 1000000 / hatcheryApk,
          animalCount: hatcheryThisMonth,
          isHatchery: true,
          alreadyAtTarget: false
        });
      }

      if (simulDays > 0) {
        const dailyMortalityFraction = 1 / daysInMonth;
        for (let day = 0; day < simulDays; day++) {
          globalBaskets = globalBaskets.map(b => {
            const apk = 1000000 / b.weightMg;
            const sgr = productionForecastService.getSgrForAnimalsPerKg(sgrLookup, m0, apk);
            const newWeight = b.weightMg * (1 + sgr / 100);

            if (b.alreadyAtTarget) {
              return { ...b, weightMg: newWeight };
            }

            let dailyMortality: number;
            if (useCustomMortality) {
              dailyMortality = customMonthlyRate * dailyMortalityFraction;
            } else {
              const sizeName = productionForecastService.mapAnimalsPerKgToSaleSize(apk);
              const month1Based = m0 + 1;
              const dbRate = dbMortalityRates[sizeName]?.[month1Based];
              const category = productionForecastService.getCategoryFromAnimalsPerKg(apk);
              const monthlyRate = dbRate !== undefined ? dbRate : (fallbackMortalityRates[category] || 0.03);
              dailyMortality = monthlyRate * dailyMortalityFraction;
            }

            const surviving = Math.round(b.animalCount * (1 - dailyMortality));
            return { ...b, weightMg: newWeight, animalCount: surviving };
          });
        }
      }

      let giacenzaLordaInventario = 0;
      let giacenzaLordaConSchiuditoio = 0;
      for (const b of globalBaskets) {
        const apk = 1000000 / b.weightMg;
        if (apk <= targetMaxAnimalsPerKg) {
          giacenzaLordaConSchiuditoio += b.animalCount;
          if (!b.isHatchery) {
            giacenzaLordaInventario += b.animalCount;
          }
        }
      }

      const ordiniMonth = ordersByYearMonth[ymKey] || {};
      const ordiniTarget = ordiniMonth[targetSize] || 0;

      let ordiniEvasi = 0;
      if (ordiniTarget > 0) {
        let toFulfill = ordiniTarget;
        const eligibleBaskets = globalBaskets
          .filter(b => (1000000 / b.weightMg) <= targetMaxAnimalsPerKg && b.animalCount > 0)
          .sort((a, b) => (1000000 / a.weightMg) - (1000000 / b.weightMg));

        for (const eb of eligibleBaskets) {
          if (toFulfill <= 0) break;
          const take = Math.min(eb.animalCount, toFulfill);
          eb.animalCount -= take;
          toFulfill -= take;
          ordiniEvasi += take;
        }
      }

      let giacenzaNetTarget = 0;
      for (const b of globalBaskets) {
        const apk = 1000000 / b.weightMg;
        if (apk <= targetMaxAnimalsPerKg) {
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
        ordiniEvasi,
        budgetProduzione: budgetByYearMonth[ymKey] || 0,
        arriviSchiuditoio: hatcheryThisMonth,
        giacenzaLordaInventario,
        giacenzaLordaConSchiuditoio,
        giacenzaNetTarget,
        schiuditoioNecessario: 0
      });
    }

    // Calcolo schiuditoio necessario: per ogni mese con gap (ordini > evadibili),
    // simula crescita di un lotto TP-300 in avanti fino a quel mese usando SGR + mortalità.
    // Calcola il fattore di sopravvivenza cumulativo e verifica se TP-300 raggiunge
    // la taglia target entro quel mese. Se sì: schiuditoioNecessario = gap / survivalFactor
    // (quanti TP-300 servono ORA per avere "gap" animali a taglia entro quel mese).
    const tp300Threshold = ProductionForecastService.SALE_SIZE_THRESHOLDS.find(t => t.size === 'TP-300');
    const startApk = tp300Threshold ? tp300Threshold.maxAnimalsPerKg : 30000000;

    // Precalcolo: simula crescita cumulativa da TP-300 mese per mese,
    // salvando il fattore di sopravvivenza e se ha raggiunto la taglia target
    const cumulativeGrowth: Array<{ reachedTarget: boolean; survivalFactor: number }> = [];
    let simWeightMg = 1000000 / startApk;
    let simSurvival = 1.0;
    let simReachedTarget = false;

    for (let i = 0; i < monthSteps.length; i++) {
      const step = monthSteps[i];
      const m0 = step.monthIndex;
      const y = step.year;
      const daysInMonth = new Date(y, m0 + 1, 0).getDate();
      let simulDays = daysInMonth;
      if (i === 0) {
        simulDays = Math.max(0, daysInMonth - currentDay);
      }

      if (!simReachedTarget && simulDays > 0) {
        const dailyMortalityFraction = 1 / daysInMonth;
        for (let day = 0; day < simulDays; day++) {
          const apk = 1000000 / simWeightMg;
          const sgr = productionForecastService.getSgrForAnimalsPerKg(sgrLookup, m0, apk);
          simWeightMg = simWeightMg * (1 + sgr / 100);

          let dailyMortality: number;
          if (useCustomMortality) {
            dailyMortality = customMonthlyRate * dailyMortalityFraction;
          } else {
            const sizeName = productionForecastService.mapAnimalsPerKgToSaleSize(apk);
            const month1Based = m0 + 1;
            const dbRate = dbMortalityRates[sizeName]?.[month1Based];
            const category = productionForecastService.getCategoryFromAnimalsPerKg(apk);
            const monthlyRate = dbRate !== undefined ? dbRate : (fallbackMortalityRates[category] || 0.03);
            dailyMortality = monthlyRate * dailyMortalityFraction;
          }
          simSurvival *= (1 - dailyMortality);

          if ((1000000 / simWeightMg) <= targetMaxAnimalsPerKg) {
            simReachedTarget = true;
            break;
          }
        }
      }

      cumulativeGrowth.push({
        reachedTarget: simReachedTarget,
        survivalFactor: simSurvival
      });
    }

    // Trova il mese in cui TP-300 raggiunge la taglia target (quanti mesi di crescita servono)
    const monthsToReachTarget = cumulativeGrowth.findIndex(g => g.reachedTarget);
    const growthSurvivalFactor = monthsToReachTarget >= 0
      ? cumulativeGrowth[monthsToReachTarget].survivalFactor
      : 0;

    // Per ogni mese con gap, posiziona schiuditoioNecessario nel mese di ARRIVO
    // (cioè monthsToReachTarget mesi PRIMA del mese di consegna)
    for (let i = 0; i < monthlyContext.length; i++) {
      const gap = monthlyContext[i].ordiniTarget - monthlyContext[i].ordiniEvasi;
      if (gap > 0 && monthsToReachTarget >= 0 && growthSurvivalFactor > 0) {
        const arrivalMonthIndex = i - monthsToReachTarget;
        if (arrivalMonthIndex >= 0 && arrivalMonthIndex < monthlyContext.length) {
          // Somma al mese di arrivo (più gap possono richiedere arrivi nello stesso mese)
          monthlyContext[arrivalMonthIndex].schiuditoioNecessario += Math.ceil(gap / growthSurvivalFactor);
        }
        // Se arrivalMonthIndex < 0, è troppo tardi: gli arrivi avrebbero dovuto avvenire in passato
      }
    }

    const groups: SizeGroupProjection[] = [];

    for (const sizeKey of sortedSizes) {
      const basketsInGroup = grouped[sizeKey];
      const totalQty = basketsInGroup.reduce((s, b) => s + b.animalCount, 0);
      const avgApk = Math.round(
        basketsInGroup.reduce((s, b) => s + b.animalsPerKg * b.animalCount, 0) / totalQty
      );

      const alreadyAtTarget = avgApk <= targetMaxAnimalsPerKg;

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
        const daysInMonth = new Date(y, m0 + 1, 0).getDate();
        let simulDays = daysInMonth;
        if (i === 0) {
          simulDays = Math.max(0, daysInMonth - currentDay);
        }

        if (simulDays > 0) {
          const dailyMortalityFraction = 1 / daysInMonth;
          for (let day = 0; day < simulDays; day++) {
            workingBaskets = workingBaskets.map(b => {
              const apk = 1000000 / b.weightMg;
              const sgr = productionForecastService.getSgrForAnimalsPerKg(sgrLookup, m0, apk);
              const newWeight = b.weightMg * (1 + sgr / 100);

              let dailyMortality: number;
              if (useCustomMortality) {
                dailyMortality = customMonthlyRate * dailyMortalityFraction;
              } else {
                const sizeName = productionForecastService.mapAnimalsPerKgToSaleSize(apk);
                const month1Based = m0 + 1;
                const dbRate = dbMortalityRates[sizeName]?.[month1Based];
                const category = productionForecastService.getCategoryFromAnimalsPerKg(apk);
                const monthlyRate = dbRate !== undefined ? dbRate : (fallbackMortalityRates[category] || 0.03);
                dailyMortality = monthlyRate * dailyMortalityFraction;
              }

              const surviving = Math.round(b.animalCount * (1 - dailyMortality));
              return { basketId: b.basketId, weightMg: newWeight, animalCount: surviving };
            });
          }
        }

        const totalAnimals = workingBaskets.reduce((s, b) => s + b.animalCount, 0);
        const weightedApk = totalAnimals > 0
          ? Math.round(workingBaskets.reduce((s, b) => s + (1000000 / b.weightMg) * b.animalCount, 0) / totalAnimals)
          : 0;

        const projSize = productionForecastService.mapAnimalsPerKgToSaleSize(weightedApk);
        const reached = weightedApk <= targetMaxAnimalsPerKg && weightedApk > 0;

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
      totalCurrentQuantity: totalCurrentQty,
      totalAlreadyAtTarget: totalAlready,
      totalNotYetAtTarget: totalCurrentQty - totalAlready,
      groups,
      monthlyContext
    };
  }
}

export const growthProjectionService = new GrowthProjectionService();
