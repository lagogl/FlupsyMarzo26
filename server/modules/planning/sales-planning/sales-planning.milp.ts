/**
 * Motore di ottimizzazione esatta basato su Linear Programming.
 * Risolve il problema di pianificazione vendite trovando l'allocazione
 * provatamente ottima di animali per (cestello, mese), date:
 * - vincolo conservazione (ogni cestello segue dinamica alive[t] = alive[t-1]*(1-mort) - x[t])
 * - vincolo ordini (con slack penalizzato)
 * - vincolo cassa minima (con slack penalizzato)
 * - obiettivo: max ricavo - λ_ordini × shortfall - λ_cassa × cash_gap
 */
// @ts-ignore - javascript-lp-solver non ha tipi
import solver from "javascript-lp-solver";
import { productionForecastService, ProductionForecastService } from "../../../ai/production-forecast-service";
import { db } from "../../../db";
import {
  hatcheryArrivals,
  projectionMortalityRates,
  salesPriceList,
  salesCashTargets,
} from "../../../../shared/schema";
import { inArray } from "drizzle-orm";

const MONTH_NAMES = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const MONTH_SHORT = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];

export type SalesPlanningMode = 'cassa' | 'ricavo' | 'bilanciato';

interface MilpBasket {
  id: string;          // identificatore univoco "B<basketId>" o "H<year>-<month>" per arrivi
  basketIdNumeric: number;
  isHatchery: boolean;
  initialAnimals: number;
  // per ogni mese m del piano: stato del cestello a fine mese SE non venduto
  // (peso animale e taglia commerciale)
  monthState: Array<{ kgPerAnimal: number; sizeCode: string; mortalityRate: number /* tasso giornaliero applicato in quel mese */ }>;
}

interface MonthStep { monthIndex: number; year: number; month1Based: number; }

interface MilpResult {
  totalRevenue: number;
  totalKgSold: number;
  totalAnimalsSold: number;
  totalAnimalsRemaining: number;
  monthsBelowCashTarget: number;
  totalShortfall: number;
  monthlyPlan: Array<{
    month: number; year: number; monthShort: string; monthLabel: string; monthName: string;
    sales: Array<{ basketId: number; isHatchery: boolean; sizeCode: string; animalCount: number; weightKg: number; revenue: number; reason: 'lp' }>;
    totalKg: number; totalRevenue: number; cashTarget: number; cashGap: number;
    ordersBySize: Record<string, number>;
    ordersFulfilledBySize: Record<string, number>;
    orderShortfallBySize: Record<string, number>;
    remainingAnimals: number;
    totalSellableAtStart: number;
    sellableBySize: Record<string, number>;
  }>;
  solverStatus: { feasible: boolean; bounded: boolean; iterations?: number; objective?: number };
}

export class SalesPlanningMilpService {

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

  /**
   * Pre-calcola, per ogni cestello e ogni mese, kg/animale e taglia commerciale,
   * IGNORANDO eventuali vendite (la mortalità è applicata indipendentemente
   * perché la dinamica alive[t] = alive[t-1]*(1-mort) - x[t] è lineare anche così:
   * non c'è feedback non lineare tra vendita e mortalità di altri animali).
   */
  private buildBasketTrajectories(
    initialBaskets: Array<{ basketId: number; weightMg: number; animalCount: number; isHatchery: boolean; arrivalMonthIndex: number; }>,
    monthSteps: MonthStep[],
    sgrLookup: any,
    dbMortRates: Record<string, Record<number, number>>,
    customMortFraction: number | null,
    currentDay: number,
  ): MilpBasket[] {
    const fallback: Record<string, number> = { T1: 0.05, T3: 0.03, T10: 0.02 };
    const result: MilpBasket[] = [];

    for (const ib of initialBaskets) {
      let weightMg = ib.weightMg;
      const monthState: MilpBasket['monthState'] = [];

      for (let i = 0; i < monthSteps.length; i++) {
        const step = monthSteps[i];
        const m0 = step.monthIndex;
        const daysInMonth = new Date(step.year, m0 + 1, 0).getDate();
        let simulDays = i === 0 ? Math.max(0, daysInMonth - currentDay) : daysInMonth;

        // Se cestello arriva in mese futuro, non simulare per i mesi precedenti
        if (i < ib.arrivalMonthIndex) {
          monthState.push({ kgPerAnimal: 0, sizeCode: 'TP-300', mortalityRate: 0 });
          continue;
        }
        if (i === ib.arrivalMonthIndex && ib.isHatchery) {
          // arriva ad inizio mese, simula tutto il mese
          simulDays = daysInMonth;
        }

        // Crescita giornaliera
        for (let d = 0; d < simulDays; d++) {
          const apk = 1000000 / weightMg;
          const sgr = productionForecastService.getSgrForAnimalsPerKg(sgrLookup, m0, apk);
          weightMg = weightMg * (1 + sgr / 100);
        }

        const apkEnd = 1000000 / weightMg;
        const sizeCode = productionForecastService.mapAnimalsPerKgToSaleSize(apkEnd);
        // Tasso mortalità mensile per questo mese e taglia
        let monthlyMortality: number;
        if (customMortFraction !== null) {
          monthlyMortality = customMortFraction;
        } else {
          const dbRate = dbMortRates[sizeCode]?.[step.month1Based];
          const cat = productionForecastService.getCategoryFromAnimalsPerKg(apkEnd);
          monthlyMortality = dbRate !== undefined ? dbRate : (fallback[cat] || 0.03);
        }

        monthState.push({
          kgPerAnimal: 1 / apkEnd,
          sizeCode,
          mortalityRate: monthlyMortality,
        });
      }

      result.push({
        id: ib.isHatchery ? `H${ib.basketId}` : `B${ib.basketId}`,
        basketIdNumeric: ib.basketId,
        isHatchery: ib.isHatchery,
        initialAnimals: ib.animalCount,
        monthState,
      });
    }
    return result;
  }

  async getPriceList(): Promise<Record<string, number>> {
    const rows = await db.select().from(salesPriceList);
    const map: Record<string, number> = {};
    for (const r of rows) map[r.sizeCode] = r.pricePerAnimal;
    return map;
  }

  async getCashTargetsForYears(years: number[]): Promise<Record<string, number>> {
    if (years.length === 0) return {};
    const rows = await db.select().from(salesCashTargets);
    const map: Record<string, number> = {};
    for (const r of rows) {
      if (years.includes(r.year)) map[`${r.year}-${r.month}`] = r.minRevenue;
    }
    return map;
  }

  async plan(opts: {
    year?: number;
    startMonth?: number;
    monthsHorizon?: number;
    mode?: SalesPlanningMode;
    mortalityPercent?: number;
  }): Promise<MilpResult> {
    const now = new Date();
    const startYear = opts.year || now.getFullYear();
    const horizon = Math.max(1, Math.min(60, opts.monthsHorizon || 12));
    const mode: SalesPlanningMode = opts.mode || 'bilanciato';
    const currentMonth0 = opts.startMonth != null ? opts.startMonth - 1 : now.getMonth();
    const currentDay = now.getDate();
    const monthSteps = this.buildMonthSteps(currentMonth0, startYear, horizon);
    const yearsNeeded = [...new Set(monthSteps.map(s => s.year))];
    const useCustomMortality = opts.mortalityPercent !== undefined && opts.mortalityPercent !== null;
    const customMonthlyRate = useCustomMortality ? opts.mortalityPercent! / 100 : null;

    const [sgrLookup, basketInventory, dbMortRates, priceMap, cashTargetsMap, ...ordersByYearArr] = await Promise.all([
      productionForecastService.getSgrLookup(),
      productionForecastService.getBasketLevelInventory(),
      this.getMortalityLookup(),
      this.getPriceList(),
      this.getCashTargetsForYears(yearsNeeded),
      ...yearsNeeded.map(y =>
        productionForecastService.getOrdersByMonthAndSize(y).then(orders => ({ year: y, orders }))
      ),
    ]);

    // Hatchery
    const hatcheryRows = yearsNeeded.length > 0
      ? await db.select().from(hatcheryArrivals).where(inArray(hatcheryArrivals.year, yearsNeeded))
      : [];
    const hatcheryByYearMonth: Record<string, { actual: number | null; forecast: number }> = {};
    for (const row of hatcheryRows) {
      const k = `${row.year}-${row.month}`;
      if (!hatcheryByYearMonth[k]) hatcheryByYearMonth[k] = { actual: null, forecast: 0 };
      hatcheryByYearMonth[k].forecast += row.quantity;
      if (row.actualQuantity !== null && row.actualQuantity !== undefined) {
        hatcheryByYearMonth[k].actual = (hatcheryByYearMonth[k].actual ?? 0) + row.actualQuantity;
      }
    }

    const ordersByYearMonth: Record<string, Record<string, number>> = {};
    for (const { year: y, orders } of ordersByYearArr) {
      for (const [mStr, sizeMap] of Object.entries(orders)) {
        ordersByYearMonth[`${y}-${mStr}`] = sizeMap as Record<string, number>;
      }
    }

    // Costruisci lista cestelli iniziali + arrivi schiuditoio futuri come "cestelli virtuali"
    const tp300Threshold = ProductionForecastService.SALE_SIZE_THRESHOLDS.find(t => t.size === 'TP-300');
    const startApkHatchery = tp300Threshold ? tp300Threshold.maxAnimalsPerKg : 30000000;

    const initialBaskets: Array<{ basketId: number; weightMg: number; animalCount: number; isHatchery: boolean; arrivalMonthIndex: number; }> = [];
    for (const b of basketInventory) {
      initialBaskets.push({
        basketId: b.basketId,
        weightMg: 1000000 / b.animalsPerKg,
        animalCount: b.animalCount,
        isHatchery: false,
        arrivalMonthIndex: 0,
      });
    }
    let hCounter = 900000;
    for (let i = 0; i < monthSteps.length; i++) {
      const step = monthSteps[i];
      const k = `${step.year}-${step.month1Based}`;
      const h = hatcheryByYearMonth[k];
      if (!h) continue;
      const todayYear = now.getFullYear();
      const todayMonth1 = now.getMonth() + 1;
      const isPastOrCurrent = step.year < todayYear || (step.year === todayYear && step.month1Based <= todayMonth1);
      const qty = isPastOrCurrent ? (h.actual ?? 0) : h.forecast;
      if (qty <= 0) continue;
      initialBaskets.push({
        basketId: hCounter++,
        weightMg: 1000000 / startApkHatchery,
        animalCount: qty,
        isHatchery: true,
        arrivalMonthIndex: i,
      });
    }

    const baskets = this.buildBasketTrajectories(
      initialBaskets, monthSteps, sgrLookup, dbMortRates, customMonthlyRate, currentDay
    );

    // ==== COSTRUZIONE MODELLO LP ====
    // Variabili x[b][m] = animali venduti dal cestello b nel mese m (>=0)
    // Variabili alive[b][m] = animali vivi nel cestello b a FINE mese m (>=0)
    //   alive[b][m] = (alive[b][m-1] * (1 - mort[b][m])) - x[b][m]
    //   alive[b][-1] = initialAnimals (al momento di arrivo)
    // Slack: order_short[m][sz] >= 0, cash_short[m] >= 0
    // Obiettivo: max sum(x*price*kg) - λ_ord*sum(order_short*price) - λ_cash*sum(cash_short)

    const variables: Record<string, Record<string, number>> = {};
    const constraints: Record<string, { min?: number; max?: number; equal?: number }> = {};

    // Coefficienti penalità — intelligente in base alla modalità
    // Penalità ordini: sempre alta (sono vincolo), ma "pesata" dal prezzo della taglia
    //   per evitare distorsioni. Usiamo costante alta indipendente.
    const LAMBDA_ORDERS = 1000; // €/animale di shortfall
    let LAMBDA_CASH: number;
    let revenueWeight: number;
    if (mode === 'cassa') {
      LAMBDA_CASH = 10;       // ogni € di gap pesa 10€
      revenueWeight = 0.1;    // valorizza poco il ricavo extra (preferisci coprire cassa subito)
    } else if (mode === 'ricavo') {
      LAMBDA_CASH = 0;        // ignora vincolo cassa
      revenueWeight = 1;
    } else { // bilanciato
      LAMBDA_CASH = 2;
      revenueWeight = 1;
    }

    // 1) Variabili x[b,m] e alive[b,m]
    for (const b of baskets) {
      for (let m = 0; m < monthSteps.length; m++) {
        if (m < (b.isHatchery ? this.findArrivalIndex(b, monthSteps) : 0)) continue;
        const xName = `x_${b.id}_${m}`;
        const aliveName = `a_${b.id}_${m}`;

        const state = b.monthState[m];
        const price = priceMap[state.sizeCode] || 0;
        // price = €/animale → revenuePerAnimal = price
        const revenuePerAnimal = price;

        // Coefficiente in obiettivo
        variables[xName] = { obj: revenueWeight * revenuePerAnimal };
        variables[aliveName] = { obj: 0 };
      }
    }

    // 2) Vincoli di conservazione: alive[b,m] + x[b,m] - alive[b,m-1]*(1-mort) = 0
    // Caso m == arrivalMonthIndex: alive[b,m] + x[b,m] = initialAnimals*(1-mort)
    for (const b of baskets) {
      const arrivalIdx = b.isHatchery ? this.findArrivalIndex(b, monthSteps) : 0;
      for (let m = arrivalIdx; m < monthSteps.length; m++) {
        const cName = `cons_${b.id}_${m}`;
        const state = b.monthState[m];
        const survival = 1 - state.mortalityRate;

        // Variabili coinvolte: alive[b,m], x[b,m], alive[b,m-1]
        const xName = `x_${b.id}_${m}`;
        const aliveName = `a_${b.id}_${m}`;
        variables[xName][cName] = 1;
        variables[aliveName][cName] = 1;

        if (m === arrivalIdx) {
          constraints[cName] = { equal: b.initialAnimals * survival };
        } else {
          const alivePrev = `a_${b.id}_${m - 1}`;
          if (variables[alivePrev]) {
            variables[alivePrev][cName] = -survival;
          }
          constraints[cName] = { equal: 0 };
        }
      }
    }

    // 3) Vincoli ordini per (mese, taglia)
    for (let m = 0; m < monthSteps.length; m++) {
      const step = monthSteps[m];
      const k = `${step.year}-${step.month1Based}`;
      const ordersThisMonth = ordersByYearMonth[k] || {};
      for (const [sz, qty] of Object.entries(ordersThisMonth)) {
        if (typeof qty !== 'number' || qty <= 0) continue;
        const cName = `ord_${m}_${sz}`;
        constraints[cName] = { min: qty };

        // Slack negativa (riduce il vincolo per coprire shortfall) — diventa shortfall variabile
        const slackName = `os_${m}_${sz}`;
        variables[slackName] = { obj: -LAMBDA_ORDERS, [cName]: 1 };

        // Tutti i cestelli che a mese m sono di quella taglia (esatta) o più grande
        for (const b of baskets) {
          const arrivalIdx = b.isHatchery ? this.findArrivalIndex(b, monthSteps) : 0;
          if (m < arrivalIdx) continue;
          const state = b.monthState[m];
          if (this.sizeIsAtLeast(state.sizeCode, sz)) {
            const xName = `x_${b.id}_${m}`;
            variables[xName][cName] = (variables[xName][cName] || 0) + 1;
          }
        }
      }
    }

    // 4) Vincoli cassa per mese (solo se LAMBDA_CASH > 0 e c'è target)
    for (let m = 0; m < monthSteps.length; m++) {
      const step = monthSteps[m];
      const k = `${step.year}-${step.month1Based}`;
      const target = cashTargetsMap[k] || 0;
      if (target <= 0) continue;
      const cName = `cash_${m}`;
      constraints[cName] = { min: target };
      // slack: cash_short[m]
      const slackName = `cs_${m}`;
      variables[slackName] = { obj: -LAMBDA_CASH, [cName]: 1 };

      for (const b of baskets) {
        const arrivalIdx = b.isHatchery ? this.findArrivalIndex(b, monthSteps) : 0;
        if (m < arrivalIdx) continue;
        const state = b.monthState[m];
        const price = priceMap[state.sizeCode] || 0;
        // price = €/animale → revenuePerAnimal = price
        const revenuePerAnimal = price;
        if (revenuePerAnimal === 0) continue;
        const xName = `x_${b.id}_${m}`;
        variables[xName][cName] = (variables[xName][cName] || 0) + revenuePerAnimal;
      }
    }

    const model = {
      optimize: 'obj',
      opType: 'max',
      constraints,
      variables,
    };

    const t0 = Date.now();
    const solution = solver.Solve(model);
    const elapsed = Date.now() - t0;
    console.log(`🧮 LP solver completato in ${elapsed}ms, feasible=${solution.feasible}, bounded=${solution.bounded}, obj=${solution.result?.toFixed(2)}`);

    // ==== RICOSTRUZIONE PIANO MENSILE ====
    const monthlyPlan: MilpResult['monthlyPlan'] = [];
    const crossesYear = yearsNeeded.length > 1;

    for (let m = 0; m < monthSteps.length; m++) {
      const step = monthSteps[m];
      const m0 = step.monthIndex;
      const k = `${step.year}-${step.month1Based}`;
      const ordersThisMonth = ordersByYearMonth[k] || {};
      const ordersBySize: Record<string, number> = {};
      const fulfilledBySize: Record<string, number> = {};
      const shortfallBySize: Record<string, number> = {};
      for (const [sz, q] of Object.entries(ordersThisMonth)) {
        if (typeof q === 'number' && q > 0) ordersBySize[sz] = q;
      }

      const sales: MilpResult['monthlyPlan'][0]['sales'] = [];
      const sellableBySize: Record<string, number> = {};
      let totalSellableAtStart = 0;

      for (const b of baskets) {
        const arrivalIdx = b.isHatchery ? this.findArrivalIndex(b, monthSteps) : 0;
        if (m < arrivalIdx) continue;
        const state = b.monthState[m];
        if (!state || state.kgPerAnimal === 0) continue;

        // Animali vivi disponibili in questo mese (post-mortalità, pre-vendita)
        const xName = `x_${b.id}_${m}`;
        const aliveName = `a_${b.id}_${m}`;
        const sold = solution[xName] || 0;
        const aliveEnd = solution[aliveName] || 0;
        const availableThisMonth = sold + aliveEnd;

        const price = priceMap[state.sizeCode] || 0;
        if (availableThisMonth > 0.5 && price > 0) {
          const qty = Math.round(availableThisMonth);
          sellableBySize[state.sizeCode] = (sellableBySize[state.sizeCode] || 0) + qty;
          totalSellableAtStart += qty;
        }

        if (sold < 0.5) continue; // ignora rumore numerico
        const weightKg = sold * state.kgPerAnimal;
        const revenue = sold * price;
        sales.push({
          basketId: b.basketIdNumeric,
          isHatchery: b.isHatchery,
          sizeCode: state.sizeCode,
          animalCount: Math.round(sold),
          weightKg,
          revenue,
          reason: 'lp',
        });
      }

      // Ordini soddisfatti per taglia
      for (const [sz, qty] of Object.entries(ordersBySize)) {
        const slackName = `os_${m}_${sz}`;
        const shortfall = solution[slackName] || 0;
        if (shortfall > 0.5) shortfallBySize[sz] = Math.round(shortfall);
        fulfilledBySize[sz] = Math.max(0, qty - shortfall);
      }

      const totalKg = sales.reduce((s, a) => s + a.weightKg, 0);
      const totalRevenue = sales.reduce((s, a) => s + a.revenue, 0);
      const cashTarget = cashTargetsMap[k] || 0;
      const cashSlackName = `cs_${m}`;
      const cashGap = cashTarget > 0 ? Math.max(0, solution[cashSlackName] || 0) : 0;
      const remainingAnimals = baskets.reduce((s, b) => {
        const aliveName = `a_${b.id}_${m}`;
        return s + Math.max(0, solution[aliveName] || 0);
      }, 0);
      const label = crossesYear ? `${MONTH_SHORT[m0]} ${String(step.year).slice(-2)}` : MONTH_SHORT[m0];

      monthlyPlan.push({
        month: step.month1Based,
        year: step.year,
        monthShort: MONTH_SHORT[m0],
        monthLabel: label,
        monthName: `${MONTH_NAMES[m0]} ${step.year}`,
        sales,
        totalKg,
        totalRevenue,
        cashTarget,
        cashGap,
        ordersBySize,
        ordersFulfilledBySize: fulfilledBySize,
        orderShortfallBySize: shortfallBySize,
        remainingAnimals: Math.round(remainingAnimals),
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
      (s, m) => s + Object.values(m.orderShortfallBySize).reduce((a, b) => a + b, 0), 0
    );

    return {
      totalRevenue,
      totalKgSold,
      totalAnimalsSold,
      totalAnimalsRemaining,
      monthsBelowCashTarget,
      totalShortfall,
      monthlyPlan,
      solverStatus: {
        feasible: !!solution.feasible,
        bounded: !!solution.bounded,
        objective: solution.result,
      },
    };
  }

  private findArrivalIndex(b: MilpBasket, monthSteps: MonthStep[]): number {
    if (!b.isHatchery) return 0;
    // hatchery basketId encoded "H<...>", arrival inferred from first non-zero state
    for (let i = 0; i < b.monthState.length; i++) {
      if (b.monthState[i].kgPerAnimal > 0) return i;
    }
    return 0;
  }

  private sizeIsAtLeast(actual: string, required: string): boolean {
    const idxA = ProductionForecastService.SALE_SIZES.indexOf(actual);
    const idxR = ProductionForecastService.SALE_SIZES.indexOf(required);
    if (idxA < 0 || idxR < 0) return false;
    // SALE_SIZES è ordinato dal più grande (TP-10000, idx 0) al più piccolo (TP-180, idx N).
    // "at least" significa stesso o più grande → indice <= indice richiesto.
    return idxA <= idxR;
  }
}

export const salesPlanningMilpService = new SalesPlanningMilpService();
