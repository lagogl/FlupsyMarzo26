import { productionForecastService, ProductionForecastService } from "../../../ai/production-forecast-service";
import { db } from "../../../db";
import {
  hatcheryArrivals,
  projectionMortalityRates,
  salesPriceList,
  salesCashTargets,
} from "../../../../shared/schema";
import { inArray } from "drizzle-orm";

const MONTH_NAMES = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];
const MONTH_SHORT = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

export type SalesPlanningMode = 'cassa' | 'ricavo' | 'bilanciato' | 'ordini';

interface SimBasket {
  basketId: number;
  isHatchery: boolean;
  weightMg: number; // peso in mg per singolo animale
  animalCount: number;
}

interface SaleAllocation {
  basketId: number;
  isHatchery: boolean;
  sizeCode: string;
  animalCount: number;
  weightKg: number;
  revenue: number;
  reason: 'ordine' | 'cassa' | 'liquidazione';
}

interface MonthlyPlan {
  month: number;
  year: number;
  monthShort: string;
  monthLabel: string;
  monthName: string;
  sales: SaleAllocation[];
  totalKg: number;
  totalRevenue: number;
  cashTarget: number;
  cashGap: number;
  ordersBySize: Record<string, number>;
  ordersFulfilledBySize: Record<string, number>;
  orderShortfallBySize: Record<string, number>;
  remainingAnimals: number;
  totalSellableAtStart: number;
  sellableBySize: Record<string, number>;
}

export interface SalesPlanningResult {
  mode: SalesPlanningMode;
  year: number;
  startMonth: number;
  monthsHorizon: number;
  totalRevenue: number;
  totalKgSold: number;
  totalAnimalsSold: number;
  totalAnimalsRemaining: number;
  monthsBelowCashTarget: number;
  totalShortfall: number;
  monthlyPlan: MonthlyPlan[];
  generatedAt: string;
}

interface MonthStep { monthIndex: number; year: number; month1Based: number; }

export class SalesPlanningService {

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

  private async getMortalityLookup(): Promise<Record<string, Record<number, number>>> {
    const rows = await db.select().from(projectionMortalityRates);
    const lookup: Record<string, Record<number, number>> = {};
    for (const row of rows) {
      if (!lookup[row.sizeName]) lookup[row.sizeName] = {};
      lookup[row.sizeName][row.month] = row.monthlyPercentage / 100;
    }
    return lookup;
  }

  async getPriceList(): Promise<Record<string, number>> {
    const rows = await db.select().from(salesPriceList);
    const map: Record<string, number> = {};
    for (const r of rows) map[r.sizeCode] = r.pricePerAnimal;
    return map;
  }

  async getCashTargets(year: number): Promise<Record<number, number>> {
    const rows = await db.select().from(salesCashTargets);
    const map: Record<number, number> = {};
    for (const r of rows) {
      if (r.year === year) map[r.month] = r.minRevenue;
    }
    return map;
  }

  private apkOf(b: SimBasket): number { return 1000000 / b.weightMg; }

  private sizeOf(b: SimBasket): string {
    return productionForecastService.mapAnimalsPerKgToSaleSize(this.apkOf(b));
  }

  /** Indice taglia in SALE_SIZES (più alto = più piccolo / più giovane) */
  private sizeRank(size: string): number {
    return ProductionForecastService.SALE_SIZES.indexOf(size);
  }

  /** Vende parte (o tutto) di un basket, ritorna allocazione */
  private sellFromBasket(
    b: SimBasket,
    animalsToSell: number,
    priceMap: Record<string, number>,
    reason: SaleAllocation['reason']
  ): SaleAllocation | null {
    const take = Math.min(b.animalCount, Math.max(0, Math.floor(animalsToSell)));
    if (take <= 0) return null;
    const apk = this.apkOf(b);
    const weightKg = take / apk;
    const sizeCode = this.sizeOf(b);
    const price = priceMap[sizeCode] || 0;
    // price = €/animale → revenue = animali × price
    const revenue = take * price;
    b.animalCount -= take;
    return {
      basketId: b.basketId,
      isHatchery: b.isHatchery,
      sizeCode,
      animalCount: take,
      weightKg,
      revenue,
      reason,
    };
  }

  async plan(opts: {
    year?: number;
    startMonth?: number;
    monthsHorizon?: number;
    mode?: SalesPlanningMode;
    mortalityPercent?: number;
  }): Promise<SalesPlanningResult> {
    const now = new Date();
    const startYear = opts.year || now.getFullYear();
    const horizon = Math.max(1, Math.min(60, opts.monthsHorizon || 12));
    const mode: SalesPlanningMode = opts.mode || 'bilanciato';
    const fallbackMortalityRates: Record<string, number> = { T1: 0.05, T3: 0.03, T10: 0.02 };

    const currentMonth0 = opts.startMonth != null ? opts.startMonth - 1 : now.getMonth();
    const currentDay = now.getDate();
    const monthSteps = this.buildMonthSteps(currentMonth0, startYear, horizon);
    const yearsNeeded = [...new Set(monthSteps.map(s => s.year))];

    const [sgrLookup, basketInventory, dbMortalityRates, priceMap, cashTargetsMap, ...ordersByYearArr] = await Promise.all([
      productionForecastService.getSgrLookup(),
      productionForecastService.getBasketLevelInventory(),
      this.getMortalityLookup(),
      this.getPriceList(),
      this.getCashTargets(startYear),
      ...yearsNeeded.map(y =>
        productionForecastService.getOrdersByMonthAndSize(y).then(orders => ({ year: y, orders }))
      ),
    ]);

    // Cash targets per (year, month)
    const cashByYearMonth: Record<string, number> = {};
    for (const [m, v] of Object.entries(cashTargetsMap)) {
      cashByYearMonth[`${startYear}-${m}`] = v;
    }
    // Anche per anni successivi: replico stesso mese-anno default 0
    for (const y of yearsNeeded) {
      if (y === startYear) continue;
      const others = await this.getCashTargets(y);
      for (const [m, v] of Object.entries(others)) cashByYearMonth[`${y}-${m}`] = v;
    }

    const ordersByYearMonth: Record<string, Record<string, number>> = {};
    for (const { year: y, orders } of ordersByYearArr) {
      for (const [monthStr, sizeMap] of Object.entries(orders)) {
        ordersByYearMonth[`${y}-${monthStr}`] = sizeMap as Record<string, number>;
      }
    }

    const [hatcheryRows] = await Promise.all([
      yearsNeeded.length > 0
        ? db.select().from(hatcheryArrivals).where(inArray(hatcheryArrivals.year, yearsNeeded))
        : Promise.resolve([]),
    ]);

    const hatcheryByYearMonth: Record<string, { actual: number | null; forecast: number }> = {};
    for (const row of hatcheryRows) {
      const key = `${row.year}-${row.month}`;
      if (!hatcheryByYearMonth[key]) hatcheryByYearMonth[key] = { actual: null, forecast: 0 };
      hatcheryByYearMonth[key].forecast += row.quantity;
      if (row.actualQuantity !== null && row.actualQuantity !== undefined) {
        hatcheryByYearMonth[key].actual = (hatcheryByYearMonth[key].actual ?? 0) + row.actualQuantity;
      }
    }

    // Inventario iniziale → SimBasket
    let baskets: SimBasket[] = basketInventory.map(b => ({
      basketId: b.basketId,
      isHatchery: false,
      weightMg: 1000000 / b.animalsPerKg,
      animalCount: b.animalCount,
    }));

    let hatcheryCounter = 900000;
    const useCustomMortality = opts.mortalityPercent !== undefined && opts.mortalityPercent !== null;
    const customMonthlyRate = useCustomMortality ? opts.mortalityPercent! / 100 : 0;

    const tp300Threshold = ProductionForecastService.SALE_SIZE_THRESHOLDS.find(t => t.size === 'TP-300');
    const startApkHatchery = tp300Threshold ? tp300Threshold.maxAnimalsPerKg : 30000000;

    const monthlyPlan: MonthlyPlan[] = [];
    const crossesYear = yearsNeeded.length > 1;

    for (let i = 0; i < monthSteps.length; i++) {
      const step = monthSteps[i];
      const m0 = step.monthIndex;
      const y = step.year;
      const daysInMonth = new Date(y, m0 + 1, 0).getDate();
      const simulDays = i === 0 ? Math.max(0, daysInMonth - currentDay) : daysInMonth;

      // Inserisci arrivi schiuditoio
      const ymKey = `${y}-${step.month1Based}`;
      const hEntry = hatcheryByYearMonth[ymKey];
      const todayYear = now.getFullYear();
      const todayMonth1 = now.getMonth() + 1;
      const isPastOrCurrent = y < todayYear || (y === todayYear && step.month1Based <= todayMonth1);
      const hatcheryQty = hEntry ? (isPastOrCurrent ? (hEntry.actual ?? 0) : hEntry.forecast) : 0;
      if (hatcheryQty > 0) {
        baskets.push({
          basketId: hatcheryCounter++,
          isHatchery: true,
          weightMg: 1000000 / startApkHatchery,
          animalCount: hatcheryQty,
        });
      }

      // Crescita giorno per giorno + mortalità
      if (simulDays > 0) {
        const dailyMortFraction = 1 / daysInMonth;
        for (let d = 0; d < simulDays; d++) {
          baskets = baskets.map(b => {
            const apk = this.apkOf(b);
            const sgr = productionForecastService.getSgrForAnimalsPerKg(sgrLookup, m0, apk);
            const newWeight = b.weightMg * (1 + sgr / 100);
            let dailyMort: number;
            if (useCustomMortality) {
              dailyMort = customMonthlyRate * dailyMortFraction;
            } else {
              const sizeName = productionForecastService.mapAnimalsPerKgToSaleSize(apk);
              const dbRate = dbMortalityRates[sizeName]?.[m0 + 1];
              const cat = productionForecastService.getCategoryFromAnimalsPerKg(apk);
              const monthlyRate = dbRate !== undefined ? dbRate : (fallbackMortalityRates[cat] || 0.03);
              dailyMort = monthlyRate * dailyMortFraction;
            }
            const surviving = Math.round(b.animalCount * (1 - dailyMort));
            return { ...b, weightMg: newWeight, animalCount: surviving };
          });
        }
      }

      // Allocazione vendite
      const ordersThisMonth = ordersByYearMonth[ymKey] || {};
      const ordersBySize: Record<string, number> = {};
      const fulfilledBySize: Record<string, number> = {};
      const shortfallBySize: Record<string, number> = {};
      for (const [sz, q] of Object.entries(ordersThisMonth)) {
        if (typeof q === 'number' && q > 0) ordersBySize[sz] = q;
      }

      const sales: SaleAllocation[] = [];

      // Calcola animali vendibili all'inizio del mese (prima di qualsiasi vendita)
      const sellableBySize: Record<string, number> = {};
      const totalSellableAtStart = baskets
        .filter(b => b.animalCount > 0 && (priceMap[this.sizeOf(b)] || 0) > 0)
        .reduce((s, b) => {
          const sz = this.sizeOf(b);
          sellableBySize[sz] = (sellableBySize[sz] || 0) + b.animalCount;
          return s + b.animalCount;
        }, 0);

      // 1) Soddisfare ordini (vincolo)
      for (const [sizeCode, qtyNeeded] of Object.entries(ordersBySize)) {
        let remaining = qtyNeeded;
        // Prendi baskets della stessa taglia O più piccola/grande che si avvicina (preferisci match esatto, poi taglie più grandi vicino - vendiamo il più "pronto")
        const candidates = baskets
          .filter(b => b.animalCount > 0)
          .map(b => ({ b, sz: this.sizeOf(b), rank: this.sizeRank(this.sizeOf(b)) }))
          .filter(x => x.sz === sizeCode || x.rank < this.sizeRank(sizeCode)) // match esatto o taglia più grande (rank minore = più grande)
          .sort((a, b) => {
            // Prima match esatto, poi taglie più grandi più vicine
            const aExact = a.sz === sizeCode ? 0 : 1;
            const bExact = b.sz === sizeCode ? 0 : 1;
            if (aExact !== bExact) return aExact - bExact;
            return b.rank - a.rank; // più vicino al target (rank più alto = più piccolo)
          });
        for (const c of candidates) {
          if (remaining <= 0) break;
          const alloc = this.sellFromBasket(c.b, remaining, priceMap, 'ordine');
          if (alloc) {
            sales.push(alloc);
            remaining -= alloc.animalCount;
            fulfilledBySize[alloc.sizeCode] = (fulfilledBySize[alloc.sizeCode] || 0) + alloc.animalCount;
          }
        }
        if (remaining > 0) shortfallBySize[sizeCode] = remaining;
      }

      // 2) Modalità-specifico: cassa / bilanciato → vendi per coprire target cassa
      const cashTarget = cashByYearMonth[ymKey] || 0;
      const isLastMonth = i === monthSteps.length - 1;

      let revenueSoFar = sales.reduce((s, a) => s + a.revenue, 0);

      if (mode === 'cassa' || mode === 'bilanciato') {
        if (cashTarget > 0 && revenueSoFar < cashTarget) {
          // Vendi baskets sellable (con prezzo) ordinati per strategia
          const sellable = baskets
            .filter(b => b.animalCount > 0 && (priceMap[this.sizeOf(b)] || 0) > 0);
          // Cassa: priorità alle taglie più piccole vendibili (€/kg minore → vendo meno valore in eccesso)
          // Bilanciato: stesso ma cerca di vendere il "minimo"
          sellable.sort((a, b) => this.sizeRank(this.sizeOf(b)) - this.sizeRank(this.sizeOf(a)));

          for (const b of sellable) {
            if (revenueSoFar >= cashTarget) break;
            const apk = this.apkOf(b);
            const sizeCode = this.sizeOf(b);
            const price = priceMap[sizeCode] || 0;
            if (price <= 0) continue;
            const need = cashTarget - revenueSoFar;
            // Quanti animali per coprire? need_kg = need/price; need_animals = need_kg * apk
            const needAnimals = Math.ceil((need / price) * apk);
            const alloc = this.sellFromBasket(b, needAnimals, priceMap, 'cassa');
            if (alloc) {
              sales.push(alloc);
              revenueSoFar += alloc.revenue;
            }
          }
        }
      }

      // 3) Liquidazione finale (modalità ricavo): vendi tutto al massimo prezzo nell'ultimo mese
      if (mode === 'ricavo' && isLastMonth) {
        const sellable = baskets.filter(b => b.animalCount > 0 && (priceMap[this.sizeOf(b)] || 0) > 0);
        for (const b of sellable) {
          const alloc = this.sellFromBasket(b, b.animalCount, priceMap, 'liquidazione');
          if (alloc) sales.push(alloc);
        }
      }

      const totalKg = sales.reduce((s, a) => s + a.weightKg, 0);
      const totalRevenue = sales.reduce((s, a) => s + a.revenue, 0);
      const cashGap = Math.max(0, cashTarget - totalRevenue);
      const remainingAnimals = baskets.reduce((s, b) => s + b.animalCount, 0);
      const label = crossesYear ? `${MONTH_SHORT[m0]} ${String(y).slice(-2)}` : MONTH_SHORT[m0];

      monthlyPlan.push({
        month: step.month1Based,
        year: y,
        monthShort: MONTH_SHORT[m0],
        monthLabel: label,
        monthName: `${MONTH_NAMES[m0]} ${y}`,
        sales,
        totalKg,
        totalRevenue,
        cashTarget,
        cashGap,
        ordersBySize,
        ordersFulfilledBySize: fulfilledBySize,
        orderShortfallBySize: shortfallBySize,
        remainingAnimals,
        totalSellableAtStart,
        sellableBySize,
      });
    }

    const totalRevenue = monthlyPlan.reduce((s, m) => s + m.totalRevenue, 0);
    const totalKgSold = monthlyPlan.reduce((s, m) => s + m.totalKg, 0);
    const totalAnimalsSold = monthlyPlan.reduce((s, m) => s + m.sales.reduce((sa, a) => sa + a.animalCount, 0), 0);
    const totalAnimalsRemaining = monthlyPlan.length > 0 ? monthlyPlan[monthlyPlan.length - 1].remainingAnimals : 0;
    const monthsBelowCashTarget = monthlyPlan.filter(m => m.cashTarget > 0 && m.cashGap > 0).length;
    const totalShortfall = monthlyPlan.reduce(
      (s, m) => s + Object.values(m.orderShortfallBySize).reduce((a, b) => a + b, 0),
      0
    );

    return {
      mode,
      year: startYear,
      startMonth: currentMonth0 + 1,
      monthsHorizon: horizon,
      totalRevenue,
      totalKgSold,
      totalAnimalsSold,
      totalAnimalsRemaining,
      monthsBelowCashTarget,
      totalShortfall,
      monthlyPlan,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const salesPlanningService = new SalesPlanningService();
