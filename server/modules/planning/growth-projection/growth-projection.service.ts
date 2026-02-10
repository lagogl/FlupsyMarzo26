import { productionForecastService, ProductionForecastService } from "../../../ai/production-forecast-service";
import { db } from "../../../db";
import { hatcheryArrivals, productionTargets } from "../../../../shared/schema";
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

  async project(targetSize: string = 'TP-3000', year?: number): Promise<GrowthProjectionResult> {
    const now = new Date();
    const startYear = year || now.getFullYear();
    const mortalityRates: Record<string, number> = { T1: 0.05, T3: 0.03, T10: 0.02 };

    const threshold = ProductionForecastService.SALE_SIZE_THRESHOLDS.find(t => t.size === targetSize);
    if (!threshold) throw new Error(`Taglia target ${targetSize} non trovata`);
    const targetMaxAnimalsPerKg = threshold.maxAnimalsPerKg;

    const currentMonth0 = now.getMonth();
    const currentDay = now.getDate();

    const monthSteps = this.buildMonthSteps(currentMonth0, startYear, 12);

    const yearsNeeded = [...new Set(monthSteps.map(s => s.year))];

    const [sgrLookup, basketInventory, ...ordersByYearArr] = await Promise.all([
      productionForecastService.getSgrLookup(),
      productionForecastService.getBasketLevelInventory(),
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

    let globalBaskets: Array<{basketId: number, weightMg: number, animalCount: number}> = [];
    for (const sizeKey of sortedSizes) {
      for (const b of grouped[sizeKey]) {
        globalBaskets.push({
          basketId: b.basketId,
          weightMg: 1000000 / b.animalsPerKg,
          animalCount: b.animalCount
        });
      }
    }

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
          animalCount: hatcheryThisMonth
        });
      }

      if (simulDays > 0) {
        const dailyMortalityFraction = 1 / daysInMonth;
        for (let day = 0; day < simulDays; day++) {
          globalBaskets = globalBaskets.map(b => {
            const apk = 1000000 / b.weightMg;
            const category = productionForecastService.getCategoryFromAnimalsPerKg(apk);
            const sgr = productionForecastService.getSgrForAnimalsPerKg(sgrLookup, m0, apk);
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

      const ordiniMonth = ordersByYearMonth[ymKey] || {};
      const ordiniTarget = ordiniMonth[targetSize] || 0;

      const label = crossesYear ? `${MONTH_SHORT[m0]} ${String(y).slice(-2)}` : MONTH_SHORT[m0];

      monthlyContext.push({
        month: step.month1Based,
        year: y,
        monthName: `${MONTH_NAMES[m0]} ${y}`,
        monthShort: MONTH_SHORT[m0],
        monthLabel: label,
        ordiniTarget,
        budgetProduzione: budgetByYearMonth[ymKey] || 0,
        arriviSchiuditoio: hatcheryThisMonth,
        giacenzaCumulativaTarget: giacenzaTarget
      });
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
              const category = productionForecastService.getCategoryFromAnimalsPerKg(apk);
              const sgr = productionForecastService.getSgrForAnimalsPerKg(sgrLookup, m0, apk);
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
      totalCurrentQuantity: totalCurrentQty,
      totalAlreadyAtTarget: totalAlready,
      totalNotYetAtTarget: totalCurrentQty - totalAlready,
      groups,
      monthlyContext
    };
  }
}

export const growthProjectionService = new GrowthProjectionService();
