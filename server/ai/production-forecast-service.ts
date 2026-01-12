import { db } from "../db";
import { productionTargets, sizes, operations, baskets, cycles, sgrPerTaglia } from "@shared/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

interface SgrByMonthSize {
  [key: string]: number; // key = "month_sizeId" e.g., "gennaio_3"
}

interface MonthlyForecast {
  year: number;
  month: number;
  monthName: string;
  sizeCategory: string;
  budgetAnimals: number;
  ordersAnimals: number;
  productionForecast: number;
  varianceBudgetOrders: number;
  varianceBudgetProduction: number;
  varianceOrdersProduction: number;
  seedingRequirement: number;
  seedingDeadline: string | null;
  status: 'on_track' | 'warning' | 'critical';
  stockResiduo: number;
  giacenzaInizioMese: number;
  seminaT1Richiesta: number;
  meseSeminaT1: string | null;
  giorniCrescita: number;
}

interface SeedingSchedule {
  seedingMonth: number;
  seedingYear: number;
  seedingMonthName: string;
  targetMonth: number;
  targetYear: number;
  targetMonthName: string;
  targetSize: string;
  seedT1Amount: number;
  growthDays: number;
}

interface ForecastSummary {
  year: number;
  totalBudget: number;
  totalOrders: number;
  totalProductionForecast: number;
  overallVariance: number;
  monthlyData: MonthlyForecast[];
  currentInventory: InventoryBySize[];
  sgrRates: SgrRate[];
  seedingSchedule: SeedingSchedule[];
  totalSeedingT1Required: number;
}

interface InventoryBySize {
  sizeCategory: string;
  sizeName: string;
  totalAnimals: number;
  animalsPerKgRange: string;
}

interface SgrRate {
  month: string;
  sizeId: number;
  sizeName: string;
  sgr: number;
}

const MONTH_NAMES = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const MONTH_NAMES_LOWER = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'
];

export class ProductionForecastService {
  
  private sgrFallback: Record<string, number> = {};
  
  async getSgrLookup(): Promise<SgrByMonthSize> {
    const [sgrPerTagliaData, sgrFallbackData] = await Promise.all([
      db.execute(sql`SELECT month, size_id, calculated_sgr FROM sgr_per_taglia`),
      db.execute(sql`SELECT month, percentage FROM sgr`)
    ]);
    
    for (const row of sgrFallbackData.rows as any[]) {
      this.sgrFallback[row.month] = row.percentage;
    }
    
    const lookup: SgrByMonthSize = {};
    for (const row of sgrPerTagliaData.rows as any[]) {
      const key = `${row.month}_${row.size_id}`;
      lookup[key] = row.calculated_sgr;
    }
    return lookup;
  }
  
  getSgrWithFallback(sgrLookup: SgrByMonthSize, monthName: string, sizeId: number): number {
    const key = `${monthName}_${sizeId}`;
    if (sgrLookup[key] !== undefined && sgrLookup[key] !== null) {
      return sgrLookup[key];
    }
    if (this.sgrFallback[monthName] !== undefined) {
      return this.sgrFallback[monthName];
    }
    return 2.0;
  }

  getSgrForMonthAndSize(sgrLookup: SgrByMonthSize, monthIndex: number, fromCategory: string, toCategory: string): number {
    const monthName = MONTH_NAMES_LOWER[monthIndex];
    
    let sizeId: number;
    if (fromCategory === 'T1' && toCategory === 'T3') {
      sizeId = 3;
    } else if (fromCategory === 'T3' && toCategory === 'T10') {
      sizeId = 21;
    } else {
      sizeId = 3;
    }
    
    return this.getSgrWithFallback(sgrLookup, monthName, sizeId);
  }

  calculateGrowthDaysBackward(
    sgrLookup: SgrByMonthSize,
    targetMonth: number,
    targetYear: number,
    targetCategory: string
  ): { seedingMonth: number; seedingYear: number; totalDays: number } {
    const T1_ANIMALS_PER_KG = 50000000;
    const T3_ANIMALS_PER_KG = 18000;
    const T10_ANIMALS_PER_KG = 5000;

    let currentWeight = 1000000 / (targetCategory === 'T3' ? T3_ANIMALS_PER_KG : T10_ANIMALS_PER_KG);
    const targetWeight = targetCategory === 'T10' 
      ? 1000000 / T1_ANIMALS_PER_KG
      : 1000000 / T1_ANIMALS_PER_KG;

    let currentMonth = targetMonth - 1;
    let currentYear = targetYear;
    let totalDays = 0;
    let phase = targetCategory === 'T10' ? 'T3_TO_T10' : 'T1_TO_T3';

    const T3_WEIGHT = 1000000 / T3_ANIMALS_PER_KG;

    while (totalDays < 400) {
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }

      const fromCat = phase === 'T3_TO_T10' ? 'T3' : 'T1';
      const toCat = phase === 'T3_TO_T10' ? 'T10' : 'T3';
      const dailySgr = this.getSgrForMonthAndSize(sgrLookup, currentMonth, fromCat, toCat) / 100;

      const daysInMonth = 30;
      
      for (let day = 0; day < daysInMonth && totalDays < 400; day++) {
        const previousWeight = currentWeight / (1 + dailySgr);
        currentWeight = previousWeight;
        totalDays++;

        if (phase === 'T3_TO_T10' && currentWeight <= T3_WEIGHT) {
          phase = 'T1_TO_T3';
        }
        
        if (phase === 'T1_TO_T3' && currentWeight <= targetWeight) {
          return {
            seedingMonth: currentMonth + 1,
            seedingYear: currentYear,
            totalDays
          };
        }
      }

      currentMonth--;
    }

    return {
      seedingMonth: currentMonth + 1,
      seedingYear: currentYear,
      totalDays
    };
  }

  async getProductionTargets(year: number): Promise<any[]> {
    const targets = await db
      .select()
      .from(productionTargets)
      .where(eq(productionTargets.year, year))
      .orderBy(productionTargets.month, productionTargets.sizeCategory);
    
    return targets;
  }

  async getSgrRates(): Promise<SgrRate[]> {
    const sgrData = await db.execute(sql`
      SELECT spt.month, spt.size_id, spt.calculated_sgr, s.name as size_name
      FROM sgr_per_taglia spt
      JOIN sizes s ON s.id = spt.size_id
      ORDER BY spt.size_id, spt.month
    `);
    
    return (sgrData.rows as any[]).map(row => ({
      month: row.month,
      sizeId: row.size_id,
      sizeName: row.size_name,
      sgr: row.calculated_sgr
    }));
  }

  async getCurrentInventoryBySize(): Promise<InventoryBySize[]> {
    const inventory = await db.execute(sql`
      WITH latest_ops AS (
        SELECT DISTINCT ON (o.basket_id) 
          o.basket_id,
          o.animals_per_kg,
          o.animal_count,
          o.size_id,
          s.name as size_name,
          s.min_animals_per_kg,
          s.max_animals_per_kg
        FROM operations o
        JOIN baskets b ON b.id = o.basket_id
        JOIN sizes s ON s.id = o.size_id
        WHERE b.state = 'active'
          AND o.type IN ('misura', 'peso', 'prima-attivazione')
          AND o.animal_count > 0
        ORDER BY o.basket_id, o.date DESC, o.id DESC
      )
      SELECT 
        CASE 
          WHEN min_animals_per_kg <= 6000 THEN 'T10'
          WHEN min_animals_per_kg <= 30000 THEN 'T3'
          ELSE 'T1'
        END as size_category,
        size_name,
        SUM(animal_count) as total_animals,
        MIN(min_animals_per_kg) || '-' || MAX(max_animals_per_kg) as animals_per_kg_range
      FROM latest_ops
      GROUP BY 
        CASE 
          WHEN min_animals_per_kg <= 6000 THEN 'T10'
          WHEN min_animals_per_kg <= 30000 THEN 'T3'
          ELSE 'T1'
        END,
        size_name
      ORDER BY size_category, size_name
    `);

    return (inventory.rows as any[]).map(row => ({
      sizeCategory: row.size_category,
      sizeName: row.size_name,
      totalAnimals: parseInt(row.total_animals) || 0,
      animalsPerKgRange: row.animals_per_kg_range
    }));
  }

  async getTotalInventoryByCategory(): Promise<Record<string, number>> {
    const result = await db.execute(sql`
      WITH latest_ops AS (
        SELECT DISTINCT ON (o.basket_id) 
          o.basket_id,
          o.animal_count,
          s.min_animals_per_kg
        FROM operations o
        JOIN baskets b ON b.id = o.basket_id
        JOIN sizes s ON s.id = o.size_id
        WHERE b.state = 'active'
          AND o.type IN ('misura', 'peso', 'prima-attivazione')
          AND o.animal_count > 0
        ORDER BY o.basket_id, o.date DESC, o.id DESC
      )
      SELECT 
        CASE 
          WHEN min_animals_per_kg <= 6000 THEN 'T10'
          WHEN min_animals_per_kg <= 30000 THEN 'T3'
          ELSE 'T1'
        END as size_category,
        SUM(animal_count) as total_animals
      FROM latest_ops
      GROUP BY 
        CASE 
          WHEN min_animals_per_kg <= 6000 THEN 'T10'
          WHEN min_animals_per_kg <= 30000 THEN 'T3'
          ELSE 'T1'
        END
    `);

    const inventory: Record<string, number> = { T1: 0, T3: 0, T10: 0 };
    for (const row of result.rows as any[]) {
      inventory[row.size_category] = parseInt(row.total_animals) || 0;
    }
    return inventory;
  }

  calculateDaysToGrow(fromAnimalsPerKg: number, toAnimalsPerKg: number, avgSgr: number): number {
    if (avgSgr <= 0 || fromAnimalsPerKg <= toAnimalsPerKg) return 0;
    
    const fromWeight = 1000000 / fromAnimalsPerKg;
    const toWeight = 1000000 / toAnimalsPerKg;
    
    const days = Math.log(toWeight / fromWeight) / Math.log(1 + avgSgr / 100);
    return Math.ceil(days);
  }

  getCategoryFromAnimalsPerKg(animalsPerKg: number): 'T1' | 'T3' | 'T10' {
    if (animalsPerKg > 30000) return 'T1';
    if (animalsPerKg > 6000) return 'T3';
    return 'T10';
  }

  getSgrForAnimalsPerKg(sgrLookup: SgrByMonthSize, monthIndex: number, animalsPerKg: number): number {
    const monthName = MONTH_NAMES_LOWER[monthIndex];
    let sizeId: number;
    if (animalsPerKg > 70000000) sizeId = 2;
    else if (animalsPerKg > 30000000) sizeId = 3;
    else if (animalsPerKg > 20000000) sizeId = 4;
    else if (animalsPerKg > 15000000) sizeId = 29;
    else if (animalsPerKg > 8000000) sizeId = 5;
    else if (animalsPerKg > 2000000) sizeId = 1;
    else if (animalsPerKg > 1900000) sizeId = 6;
    else if (animalsPerKg > 1000000) sizeId = 7;
    else if (animalsPerKg > 880000) sizeId = 8;
    else if (animalsPerKg > 600000) sizeId = 9;
    else if (animalsPerKg > 350000) sizeId = 10;
    else if (animalsPerKg > 300000) sizeId = 11;
    else if (animalsPerKg > 190000) sizeId = 12;
    else if (animalsPerKg > 120000) sizeId = 13;
    else if (animalsPerKg > 97000) sizeId = 14;
    else if (animalsPerKg > 70000) sizeId = 15;
    else if (animalsPerKg > 40000) sizeId = 16;
    else if (animalsPerKg > 29000) sizeId = 28;
    else if (animalsPerKg > 20000) sizeId = 17;
    else if (animalsPerKg > 15000) sizeId = 18;
    else if (animalsPerKg > 13000) sizeId = 19;
    else if (animalsPerKg > 9000) sizeId = 20;
    else if (animalsPerKg > 6000) sizeId = 21;
    else if (animalsPerKg > 3900) sizeId = 22;
    else if (animalsPerKg > 3000) sizeId = 23;
    else if (animalsPerKg > 2300) sizeId = 24;
    else if (animalsPerKg > 1800) sizeId = 25;
    else if (animalsPerKg > 1200) sizeId = 26;
    else sizeId = 27;
    
    return this.getSgrWithFallback(sgrLookup, monthName, sizeId);
  }

  async getBasketLevelInventory(): Promise<Array<{basketId: number, animalsPerKg: number, animalCount: number}>> {
    const result = await db.execute(sql`
      SELECT DISTINCT ON (o.basket_id)
        o.basket_id,
        o.animals_per_kg,
        o.animal_count
      FROM operations o
      JOIN baskets b ON b.id = o.basket_id
      WHERE b.state = 'active'
        AND o.type IN ('misura', 'peso', 'prima-attivazione')
        AND o.animal_count > 0
        AND o.animals_per_kg > 0
      ORDER BY o.basket_id, o.date DESC, o.id DESC
    `);
    
    return (result.rows as any[]).map(row => ({
      basketId: row.basket_id,
      animalsPerKg: parseFloat(row.animals_per_kg) || 50000,
      animalCount: parseInt(row.animal_count) || 0
    }));
  }

  simulateMonthlyGrowth(
    baskets: Array<{basketId: number, animalsPerKg: number, animalCount: number}>,
    sgrLookup: SgrByMonthSize,
    monthIndex: number,
    mortalityRates: { T1: number; T3: number; T10: number }
  ): Array<{basketId: number, animalsPerKg: number, animalCount: number}> {
    return baskets.map(basket => {
      const category = this.getCategoryFromAnimalsPerKg(basket.animalsPerKg);
      const mortality = mortalityRates[category];
      const sgr = this.getSgrForAnimalsPerKg(sgrLookup, monthIndex, basket.animalsPerKg);
      const currentWeight = 1000000 / basket.animalsPerKg;
      const newWeight = currentWeight * Math.pow(1 + sgr / 100, 30);
      const newAnimalsPerKg = Math.round(1000000 / newWeight);
      const survivingAnimals = Math.round(basket.animalCount * (1 - mortality));
      
      return {
        basketId: basket.basketId,
        animalsPerKg: newAnimalsPerKg,
        animalCount: survivingAnimals
      };
    });
  }

  aggregateByCategory(baskets: Array<{basketId: number, animalsPerKg: number, animalCount: number}>): Record<string, number> {
    const result: Record<string, number> = { T1: 0, T3: 0, T10: 0 };
    for (const basket of baskets) {
      const category = this.getCategoryFromAnimalsPerKg(basket.animalsPerKg);
      result[category] += basket.animalCount;
    }
    return result;
  }

  async calculateForecast(
    year: number, 
    mortalityRates: { T1: number; T3: number; T10: number } = { T1: 0.05, T3: 0.03, T10: 0.02 }
  ): Promise<ForecastSummary> {
    const targets = await this.getProductionTargets(year);
    const sgrRates = await this.getSgrRates();
    const currentInventory = await this.getCurrentInventoryBySize();
    const sgrLookup = await this.getSgrLookup();
    
    let basketInventory = await this.getBasketLevelInventory();
    
    const monthlyData: MonthlyForecast[] = [];
    const seedingSchedule: SeedingSchedule[] = [];
    
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    
    let currentAggregated = this.aggregateByCategory(basketInventory);
    let stockT1 = currentAggregated.T1;
    let stockT3 = currentAggregated.T3;
    let stockT10 = currentAggregated.T10;

    for (let month = 1; month <= 12; month++) {
      const monthsFromNow = month - currentMonth;
      
      if (monthsFromNow > 0) {
        basketInventory = this.simulateMonthlyGrowth(basketInventory, sgrLookup, month - 1, mortalityRates);
        const newAggregated = this.aggregateByCategory(basketInventory);
        stockT1 = newAggregated.T1;
        stockT3 = newAggregated.T3;
        stockT10 = newAggregated.T10;
      }
      
      const monthTargets = targets.filter(t => t.month === month);
      
      for (const target of monthTargets) {
        const budgetAnimals = target.targetAnimals || 0;
        const ordersAnimals = 0;

        let availableForSale = 0;
        let soldAnimals = 0;
        let seedingRequirement = 0;
        let seedingDeadline: string | null = null;
        let meseSeminaT1: string | null = null;
        let giorniCrescita = 0;
        let giacenzaInizioMese = 0;

        if (target.sizeCategory === 'T3') {
          giacenzaInizioMese = stockT3;
          availableForSale = stockT3;
          soldAnimals = Math.min(availableForSale, budgetAnimals);
          stockT3 = Math.max(0, stockT3 - soldAnimals);
          
        } else if (target.sizeCategory === 'T10') {
          giacenzaInizioMese = stockT10;
          availableForSale = stockT10;
          soldAnimals = Math.min(availableForSale, budgetAnimals);
          stockT10 = Math.max(0, stockT10 - soldAnimals);
        } else if (target.sizeCategory === 'T1') {
          giacenzaInizioMese = stockT1;
        }

        const deficit = budgetAnimals - soldAnimals;
        let seminaT1Richiesta = 0;
        
        const growthMonths = target.sizeCategory === 'T3' ? 6 : 10;
        const cumulativeMortalityT1 = Math.pow(1 - mortalityRates.T1, growthMonths);
        const cumulativeMortalityT3 = target.sizeCategory === 'T10' 
          ? Math.pow(1 - mortalityRates.T3, 4) 
          : 1;
        
        if (deficit > 0) {
          const survivalRate = cumulativeMortalityT1 * cumulativeMortalityT3;
          seminaT1Richiesta = Math.ceil(deficit / survivalRate);
          
          const growthCalc = this.calculateGrowthDaysBackward(
            sgrLookup,
            month,
            year,
            target.sizeCategory
          );
          
          giorniCrescita = growthCalc.totalDays;
          meseSeminaT1 = MONTH_NAMES[growthCalc.seedingMonth - 1] + ' ' + growthCalc.seedingYear;
          
          const seedingDate = new Date(growthCalc.seedingYear, growthCalc.seedingMonth - 1, 15);
          seedingDeadline = seedingDate.toISOString().split('T')[0];
          
          seedingSchedule.push({
            seedingMonth: growthCalc.seedingMonth,
            seedingYear: growthCalc.seedingYear,
            seedingMonthName: MONTH_NAMES[growthCalc.seedingMonth - 1],
            targetMonth: month,
            targetYear: year,
            targetMonthName: MONTH_NAMES[month - 1],
            targetSize: target.sizeCategory,
            seedT1Amount: Math.round(seminaT1Richiesta),
            growthDays: giorniCrescita
          });
          
          seedingRequirement = Math.round(seminaT1Richiesta);
        }

        const productionForecast = soldAnimals;
        const varianceBudgetOrders = ordersAnimals - budgetAnimals;
        const varianceBudgetProduction = productionForecast - budgetAnimals;
        const varianceOrdersProduction = productionForecast - ordersAnimals;

        let status: 'on_track' | 'warning' | 'critical' = 'on_track';
        if (varianceBudgetProduction < -budgetAnimals * 0.2) {
          status = 'critical';
        } else if (varianceBudgetProduction < -budgetAnimals * 0.1) {
          status = 'warning';
        }

        const stockResiduo = target.sizeCategory === 'T3' ? stockT3 : 
                             target.sizeCategory === 'T10' ? stockT10 : stockT1;

        monthlyData.push({
          year,
          month,
          monthName: MONTH_NAMES[month - 1],
          sizeCategory: target.sizeCategory,
          budgetAnimals,
          ordersAnimals,
          productionForecast: Math.round(productionForecast),
          varianceBudgetOrders,
          varianceBudgetProduction: Math.round(varianceBudgetProduction),
          varianceOrdersProduction: Math.round(varianceOrdersProduction),
          seedingRequirement,
          seedingDeadline,
          status,
          stockResiduo: Math.round(stockResiduo),
          giacenzaInizioMese: Math.round(giacenzaInizioMese),
          seminaT1Richiesta: Math.round(seminaT1Richiesta),
          meseSeminaT1,
          giorniCrescita
        });
      }
    }

    seedingSchedule.sort((a, b) => {
      if (a.seedingYear !== b.seedingYear) return a.seedingYear - b.seedingYear;
      return a.seedingMonth - b.seedingMonth;
    });

    const totalBudget = monthlyData.reduce((sum, m) => sum + m.budgetAnimals, 0);
    const totalOrders = monthlyData.reduce((sum, m) => sum + m.ordersAnimals, 0);
    const totalProductionForecast = monthlyData.reduce((sum, m) => sum + m.productionForecast, 0);
    const totalSeedingT1Required = seedingSchedule.reduce((sum, s) => sum + s.seedT1Amount, 0);

    return {
      year,
      totalBudget,
      totalOrders,
      totalProductionForecast,
      overallVariance: totalProductionForecast - totalBudget,
      monthlyData,
      currentInventory,
      sgrRates,
      seedingSchedule,
      totalSeedingT1Required
    };
  }

  async upsertTarget(data: {
    year: number;
    month: number;
    sizeCategory: string;
    targetAnimals: number;
    targetWeight?: number;
    notes?: string;
  }): Promise<void> {
    const existing = await db
      .select()
      .from(productionTargets)
      .where(
        and(
          eq(productionTargets.year, data.year),
          eq(productionTargets.month, data.month),
          eq(productionTargets.sizeCategory, data.sizeCategory)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(productionTargets)
        .set({
          targetAnimals: data.targetAnimals,
          targetWeight: data.targetWeight,
          notes: data.notes,
          updatedAt: new Date()
        })
        .where(eq(productionTargets.id, existing[0].id));
    } else {
      await db.insert(productionTargets).values({
        year: data.year,
        month: data.month,
        sizeCategory: data.sizeCategory,
        targetAnimals: data.targetAnimals,
        targetWeight: data.targetWeight,
        notes: data.notes
      });
    }
  }
}

export const productionForecastService = new ProductionForecastService();
