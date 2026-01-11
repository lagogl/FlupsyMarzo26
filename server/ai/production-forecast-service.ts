import { db } from "../db";
import { productionTargets, sizes, operations, baskets, cycles } from "@shared/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

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

  async calculateForecast(year: number): Promise<ForecastSummary> {
    const targets = await this.getProductionTargets(year);
    const sgrRates = await this.getSgrRates();
    const currentInventory = await this.getCurrentInventoryBySize();
    const inventoryByCategory = await this.getTotalInventoryByCategory();

    const avgSgrT1toT3 = 0.95;
    const avgSgrT3toT10 = 0.85;
    const mortalityRate = 0.15;

    const DAYS_T1_TO_T3 = 180;
    const DAYS_T3_TO_T10 = 120;
    const DAYS_T1_TO_T10 = DAYS_T1_TO_T3 + DAYS_T3_TO_T10;

    const monthlyData: MonthlyForecast[] = [];
    const seedingSchedule: SeedingSchedule[] = [];
    
    let stockT1 = inventoryByCategory.T1 || 0;
    let stockT3 = inventoryByCategory.T3 || 0;
    let stockT10 = inventoryByCategory.T10 || 0;

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    for (let month = 1; month <= 12; month++) {
      const monthsFromNow = month - currentMonth;
      
      if (monthsFromNow > 0) {
        const t1ToT3Transition = stockT1 * 0.15;
        stockT1 = Math.max(0, (stockT1 - t1ToT3Transition) * (1 - mortalityRate * 0.1));
        stockT3 += t1ToT3Transition * (1 - mortalityRate);
        
        const t3ToT10Transition = stockT3 * 0.10;
        stockT3 = Math.max(0, stockT3 - t3ToT10Transition);
        stockT10 += t3ToT10Transition * (1 - mortalityRate);
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

        if (target.sizeCategory === 'T3') {
          availableForSale = stockT3;
          soldAnimals = Math.min(availableForSale, budgetAnimals);
          stockT3 = Math.max(0, stockT3 - soldAnimals);
          giorniCrescita = DAYS_T1_TO_T3;
          
        } else if (target.sizeCategory === 'T10') {
          availableForSale = stockT10;
          soldAnimals = Math.min(availableForSale, budgetAnimals);
          stockT10 = Math.max(0, stockT10 - soldAnimals);
          giorniCrescita = DAYS_T1_TO_T10;
        }

        const deficit = budgetAnimals - soldAnimals;
        let seminaT1Richiesta = 0;
        
        if (deficit > 0) {
          if (target.sizeCategory === 'T3') {
            seminaT1Richiesta = Math.ceil(deficit / ((1 - mortalityRate) * (1 - mortalityRate)));
          } else if (target.sizeCategory === 'T10') {
            seminaT1Richiesta = Math.ceil(deficit / Math.pow(1 - mortalityRate, 3));
          }
          
          const targetDate = new Date(year, month - 1, 15);
          const seedingDate = new Date(targetDate);
          seedingDate.setDate(seedingDate.getDate() - giorniCrescita);
          
          seedingDeadline = seedingDate.toISOString().split('T')[0];
          meseSeminaT1 = MONTH_NAMES[seedingDate.getMonth()] + ' ' + seedingDate.getFullYear();
          
          seedingSchedule.push({
            seedingMonth: seedingDate.getMonth() + 1,
            seedingYear: seedingDate.getFullYear(),
            seedingMonthName: MONTH_NAMES[seedingDate.getMonth()],
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
