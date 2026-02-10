import { productionForecastService, ProductionForecastService } from "../../../ai/production-forecast-service";
import { db } from "../../../db";
import { hatcheryArrivals, productionTargets } from "../../../../shared/schema";
import { eq } from "drizzle-orm";

const MONTH_NAMES = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const MONTH_SHORT = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

interface SizeMonthProjection {
  month: number;
  monthName: string;
  monthShort: string;
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
  monthName: string;
  monthShort: string;
  ordiniTarget: number;
  budgetProduzione: number;
  arriviSchiuditoio: number;
  giacenzaCumulativaTarget: number;
}

interface GrowthProjectionResult {
  targetSize: string;
  targetMaxAnimalsPerKg: number;
  generatedAt: string;
  year: number;
  totalCurrentQuantity: number;
  totalAlreadyAtTarget: number;
  totalNotYetAtTarget: number;
  groups: SizeGroupProjection[];
  monthlyContext: MonthlyContext[];
}

export class GrowthProjectionService {

  async project(targetSize: string = 'TP-3000', year?: number): Promise<GrowthProjectionResult> {
    const now = new Date();
    const projYear = year || now.getFullYear();
    const mortalityRates = { T1: 0.05, T3: 0.03, T10: 0.02 };

    const threshold = ProductionForecastService.SALE_SIZE_THRESHOLDS.find(t => t.size === targetSize);
    if (!threshold) throw new Error(`Taglia target ${targetSize} non trovata`);
    const targetMaxAnimalsPerKg = threshold.maxAnimalsPerKg;

    const [sgrLookup, basketInventory, ordersByMonth, budgetRows, hatcheryRows] = await Promise.all([
      productionForecastService.getSgrLookup(),
      productionForecastService.getBasketLevelInventory(),
      productionForecastService.getOrdersByMonthAndSize(projYear),
      db.select().from(productionTargets).where(eq(productionTargets.year, projYear)),
      db.select().from(hatcheryArrivals).where(eq(hatcheryArrivals.year, projYear))
    ]);

    const budgetByMonth: Record<number, number> = {};
    for (const row of budgetRows) {
      if (!budgetByMonth[row.month]) budgetByMonth[row.month] = 0;
      budgetByMonth[row.month] += row.targetAnimals;
    }

    const hatcheryByMonth: Record<number, number> = {};
    for (const row of hatcheryRows) {
      if (!hatcheryByMonth[row.month]) hatcheryByMonth[row.month] = 0;
      hatcheryByMonth[row.month] += row.quantity;
    }

    const grouped: Record<string, Array<{basketId: number, animalsPerKg: number, animalCount: number}>> = {};
    for (const b of basketInventory) {
      const saleSize = productionForecastService.mapAnimalsPerKgToSaleSize(b.animalsPerKg);
      if (!grouped[saleSize]) grouped[saleSize] = [];
      grouped[saleSize].push({ ...b });
    }

    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    const groups: SizeGroupProjection[] = [];

    const sortedSizes = Object.keys(grouped).sort((a, b) => {
      const idxA = ProductionForecastService.SALE_SIZES.indexOf(a);
      const idxB = ProductionForecastService.SALE_SIZES.indexOf(b);
      return idxB - idxA;
    });

    let hatcheryBasketCounter = 900000;

    const allWorkingBaskets: Array<{basketId: number, weightMg: number, animalCount: number}>[] = [];
    for (const sizeKey of sortedSizes) {
      allWorkingBaskets.push(grouped[sizeKey].map(b => ({
        basketId: b.basketId,
        weightMg: 1000000 / b.animalsPerKg,
        animalCount: b.animalCount
      })));
    }

    let globalBaskets = allWorkingBaskets.flat();

    const monthlyContext: MonthlyContext[] = [];

    for (let m = currentMonth; m < 12; m++) {
      const daysInMonth = new Date(projYear, m + 1, 0).getDate();
      let simulDays = daysInMonth;
      if (m === currentMonth) {
        simulDays = Math.max(0, daysInMonth - currentDay);
      }

      const hatcheryThisMonth = hatcheryByMonth[m + 1] || 0;
      if (hatcheryThisMonth > 0) {
        const tp300Threshold = ProductionForecastService.SALE_SIZE_THRESHOLDS.find(t => t.size === 'TP-300');
        const hatcheryApk = tp300Threshold ? tp300Threshold.maxAnimalsPerKg : 30000000;
        globalBaskets.push({
          basketId: hatcheryBasketCounter++,
          weightMg: 1000000 / hatcheryApk,
          animalCount: hatcheryThisMonth
        });
      }

      if (simulDays > 0) {
        const dailyMortalityFraction = 1 / daysInMonth;
        for (let day = 0; day < simulDays; day++) {
          globalBaskets = globalBaskets.map(b => {
            const apk = 1000000 / b.weightMg;
            const category = productionForecastService.getCategoryFromAnimalsPerKg(apk);
            const sgr = productionForecastService.getSgrForAnimalsPerKg(sgrLookup, m, apk);
            const newWeight = b.weightMg * (1 + sgr / 100);
            const dailyMortality = mortalityRates[category] * dailyMortalityFraction;
            const surviving = Math.round(b.animalCount * (1 - dailyMortality));
            return { basketId: b.basketId, weightMg: newWeight, animalCount: surviving };
          });
        }
      }

      let giacenzaTarget = 0;
      for (const b of globalBaskets) {
        const apk = 1000000 / b.weightMg;
        if (apk <= targetMaxAnimalsPerKg) {
          giacenzaTarget += b.animalCount;
        }
      }

      const ordiniMonth = ordersByMonth[(m + 1).toString()] || {};
      const ordiniTarget = ordiniMonth[targetSize] || 0;

      monthlyContext.push({
        month: m + 1,
        monthName: MONTH_NAMES[m],
        monthShort: MONTH_SHORT[m],
        ordiniTarget,
        budgetProduzione: budgetByMonth[m + 1] || 0,
        arriviSchiuditoio: hatcheryThisMonth,
        giacenzaCumulativaTarget: giacenzaTarget
      });
    }

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

      for (let m = currentMonth; m < 12; m++) {
        const daysInMonth = new Date(projYear, m + 1, 0).getDate();
        let simulDays = daysInMonth;
        if (m === currentMonth) {
          simulDays = Math.max(0, daysInMonth - currentDay);
        }

        if (simulDays > 0) {
          const dailyMortalityFraction = 1 / daysInMonth;
          for (let day = 0; day < simulDays; day++) {
            workingBaskets = workingBaskets.map(b => {
              const apk = 1000000 / b.weightMg;
              const category = productionForecastService.getCategoryFromAnimalsPerKg(apk);
              const sgr = productionForecastService.getSgrForAnimalsPerKg(sgrLookup, m, apk);
              const newWeight = b.weightMg * (1 + sgr / 100);
              const dailyMortality = mortalityRates[category] * dailyMortalityFraction;
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
          monthReached = MONTH_NAMES[m];
        }

        months.push({
          month: m + 1,
          monthName: MONTH_NAMES[m],
          monthShort: MONTH_SHORT[m],
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
      year: projYear,
      totalCurrentQuantity: totalCurrentQty,
      totalAlreadyAtTarget: totalAlready,
      totalNotYetAtTarget: totalCurrentQty - totalAlready,
      groups,
      monthlyContext
    };
  }
}

export const growthProjectionService = new GrowthProjectionService();
