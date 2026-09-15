import { db } from "../db";
import { dbEsterno, isDbEsternoAvailable } from "../db-esterno";
import { ordiniCondivisi, ordiniDettagli } from "../schema-esterno";
import { productionTargets, sizes, operations, baskets, cycles, sgrPerTaglia } from "@shared/schema";
import { eq, and, gte, lte, desc, sql, isNull, not } from "drizzle-orm";
import {
  findSizeInRanges,
  getSizeRangeCandidates,
  toBusinessIsoDate,
} from "../utils/size-determination";

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
  statusDescription: string;
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

interface OrdersBySize {
  sizeCode: string;
  totalAnimals: number;
  aggregateCategory: 'T3' | 'T10';
}

interface ForecastSummary {
  year: number;
  totalBudget: number;
  totalOrders: number;
  totalOrdersYearAllocated?: number;
  totalProductionForecast: number;
  overallVariance: number;
  monthlyData: MonthlyForecast[];
  currentInventory: InventoryBySize[];
  sgrRates: SgrRate[];
  seedingSchedule: SeedingSchedule[];
  totalSeedingT1Required: number;
  // Nuovi campi per taglie specifiche
  ordersBySpecificSize?: OrdersBySize[];
  budgetByCategory?: Record<string, number>;
  ordersByCategory?: Record<string, number>;
  ordersAbsoluteBySize?: Record<string, number>;
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
  private activeSizeCandidates: Awaited<ReturnType<typeof getSizeRangeCandidates>> = [];

  private async refreshActiveSizeCandidates() {
    this.activeSizeCandidates = await getSizeRangeCandidates(new Date());
    if (this.activeSizeCandidates.length === 0) {
      throw new Error("Nessuna taglia con range attivo alla business date");
    }
    return this.activeSizeCandidates;
  }

  async getActiveSizeCandidates() {
    return this.refreshActiveSizeCandidates();
  }

  private formatNumber(num: number): string {
    if (Math.abs(num) >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (Math.abs(num) >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
  }
  
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

    // Scegli una taglia rappresentativa dal catalogo corrente, non da un
    // codice/ID statico che potrebbe non avere più una versione attiva.
    const representativeAnimalsPerKg = fromCategory === 'T3' && toCategory === 'T10'
      ? 5000
      : 18000;
    const candidate = findSizeInRanges(representativeAnimalsPerKg, this.activeSizeCandidates);
    if (!candidate) {
      throw new Error(`Nessun range attivo per la fase ${fromCategory}->${toCategory}`);
    }
    
    return this.getSgrWithFallback(sgrLookup, monthName, candidate.sizeId);
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
    const businessDate = toBusinessIsoDate(new Date());
    const sgrData = await db.execute(sql`
      SELECT spt.month, spt.size_id, spt.calculated_sgr, s.name as size_name
      FROM sgr_per_taglia spt
      JOIN sizes s ON s.id = spt.size_id
      JOIN size_range_versions srv ON srv.size_id = s.id
        AND srv.valid_from <= ${businessDate}::date
        AND (srv.valid_to IS NULL OR srv.valid_to >= ${businessDate}::date)
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
    const activeCandidates = await this.refreshActiveSizeCandidates();
    const inventory = await db.execute(sql`
      WITH latest_ops AS (
        SELECT DISTINCT ON (o.basket_id) 
          o.basket_id,
          o.animals_per_kg,
          o.animal_count,
          o.size_id,
          s.code as size_code,
          s.name as size_name
        FROM operations o
        JOIN baskets b ON b.id = o.basket_id
        LEFT JOIN sizes s ON s.id = o.size_id
        WHERE b.state = 'active'
          AND o.type IN ('misura', 'peso', 'prima-attivazione')
          AND o.animal_count > 0
        ORDER BY o.basket_id, o.date DESC, o.id DESC
      )
      SELECT *
      FROM latest_ops
    `);

    type InventoryBucket = {
      sizeCategory: string;
      sizeName: string;
      totalAnimals: number;
      minAnimalsPerKg: number;
      maxAnimalsPerKg: number;
    };
    const buckets = new Map<string, InventoryBucket>();
    for (const row of inventory.rows as any[]) {
      const historicalName = row.size_name || row.size_code || `SIZE-${row.size_id ?? "unknown"}`;
      const animalsPerKg = Number(row.animals_per_kg);
      const validAnimalsPerKg = Number.isFinite(animalsPerKg) && animalsPerKg > 0
        ? animalsPerKg
        : null;
      const activeMatch = validAnimalsPerKg === null
        ? null
        : findSizeInRanges(validAnimalsPerKg, activeCandidates);
      const sizeCategory = activeMatch?.code || historicalName;
      // Keep historical size identity in sizeName while exposing the current
      // category separately when the saved sizeId is no longer active.
      const key = `${historicalName}|${sizeCategory}`;
      const bucket = buckets.get(key) || {
        sizeCategory,
        sizeName: historicalName,
        totalAnimals: 0,
        minAnimalsPerKg: activeMatch?.minAnimalsPerKg ?? validAnimalsPerKg ?? 0,
        maxAnimalsPerKg: activeMatch?.maxAnimalsPerKg ?? validAnimalsPerKg ?? 0,
      };
      bucket.totalAnimals += Number(row.animal_count) || 0;
      buckets.set(key, bucket);
    }

    return [...buckets.values()]
      .sort((a, b) => b.minAnimalsPerKg - a.minAnimalsPerKg)
      .map(bucket => ({
        sizeCategory: bucket.sizeCategory,
        sizeName: bucket.sizeName,
        totalAnimals: bucket.totalAnimals,
        animalsPerKgRange: `${bucket.minAnimalsPerKg}-${bucket.maxAnimalsPerKg}`,
      }));
  }

  async getTotalInventoryByCategory(): Promise<Record<string, number>> {
    const activeCandidates = await this.refreshActiveSizeCandidates();
    const result = await db.execute(sql`
      WITH latest_ops AS (
        SELECT DISTINCT ON (o.basket_id) 
          o.basket_id,
          o.animal_count,
          o.animals_per_kg,
          o.size_id,
          s.code as size_code,
          s.name as size_name
        FROM operations o
        JOIN baskets b ON b.id = o.basket_id
        LEFT JOIN sizes s ON s.id = o.size_id
        WHERE b.state = 'active'
          AND o.type IN ('misura', 'peso', 'prima-attivazione')
          AND o.animal_count > 0
        ORDER BY o.basket_id, o.date DESC, o.id DESC
      )
      SELECT *
      FROM latest_ops
    `);

    const inventory: Record<string, number> = {};
    for (const size of activeCandidates.map((candidate) => candidate.code)) {
      inventory[size] = 0;
    }
    for (const row of result.rows as any[]) {
      const activeMatch = findSizeInRanges(Number(row.animals_per_kg), activeCandidates);
      const historicalName = row.size_name || row.size_code || `SIZE-${row.size_id ?? "unknown"}`;
      const category = activeMatch?.code || historicalName;
      inventory[category] = (inventory[category] || 0) + (Number(row.animal_count) || 0);
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
    const match = findSizeInRanges(animalsPerKg, this.activeSizeCandidates);
    if (!match) {
      throw new Error(`Nessuna taglia attiva per ${animalsPerKg} animali/kg`);
    }
    return this.getSgrWithFallback(sgrLookup, monthName, match.sizeId);
  }

  async getBasketLevelInventory(): Promise<Array<{basketId: number, animalsPerKg: number, animalCount: number}>> {
    await this.refreshActiveSizeCandidates();
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
    mortalityRates: { T1: number; T3: number; T10: number },
    days: number = 30
  ): Array<{basketId: number, animalsPerKg: number, animalCount: number}> {
    const mortalityFraction = days / 30;
    return baskets.map(basket => {
      const category = this.getCategoryFromAnimalsPerKg(basket.animalsPerKg);
      const mortality = mortalityRates[category] * mortalityFraction;
      const sgr = this.getSgrForAnimalsPerKg(sgrLookup, monthIndex, basket.animalsPerKg);
      const currentWeight = 1000000 / basket.animalsPerKg;
      const newWeight = currentWeight * Math.pow(1 + sgr / 100, days);
      const newAnimalsPerKg = Math.round(1000000 / newWeight);
      const survivingAnimals = Math.round(basket.animalCount * (1 - mortality));
      
      return {
        basketId: basket.basketId,
        animalsPerKg: newAnimalsPerKg,
        animalCount: survivingAnimals
      };
    });
  }

  removeAnimalsFromCategory(
    baskets: Array<{basketId: number, animalsPerKg: number, animalCount: number}>,
    category: string,
    toRemove: number
  ): Array<{basketId: number, animalsPerKg: number, animalCount: number}> {
    const categoryBaskets = baskets.filter(b => this.getCategoryFromAnimalsPerKg(b.animalsPerKg) === category);
    const totalInCategory = categoryBaskets.reduce((sum, b) => sum + b.animalCount, 0);
    if (totalInCategory <= 0 || toRemove <= 0) return baskets;

    const removalRatio = Math.min(1, toRemove / totalInCategory);
    return baskets.map(b => {
      if (this.getCategoryFromAnimalsPerKg(b.animalsPerKg) === category) {
        return {
          ...b,
          animalCount: Math.round(b.animalCount * (1 - removalRatio))
        };
      }
      return b;
    }).filter(b => b.animalCount > 0);
  }

  aggregateByCategory(baskets: Array<{basketId: number, animalsPerKg: number, animalCount: number}>): Record<string, number> {
    const result: Record<string, number> = { T1: 0, T3: 0, T10: 0 };
    for (const basket of baskets) {
      const category = this.getCategoryFromAnimalsPerKg(basket.animalsPerKg);
      result[category] += basket.animalCount;
    }
    return result;
  }

  aggregateBySaleSize(baskets: Array<{basketId: number, animalsPerKg: number, animalCount: number}>): Record<string, number> {
    const result: Record<string, number> = {};
    for (const size of this.activeSizeCandidates.map((candidate) => candidate.code)) {
      result[size] = 0;
    }
    for (const basket of baskets) {
      const saleSize = this.mapAnimalsPerKgToSaleSize(basket.animalsPerKg);
      result[saleSize] += basket.animalCount;
    }
    return result;
  }

  removeAnimalsFromSaleSize(
    baskets: Array<{basketId: number, animalsPerKg: number, animalCount: number}>,
    saleSize: string,
    toRemove: number
  ): Array<{basketId: number, animalsPerKg: number, animalCount: number}> {
    const saleSizeBaskets = baskets.filter(b => this.mapAnimalsPerKgToSaleSize(b.animalsPerKg) === saleSize);
    const totalInSize = saleSizeBaskets.reduce((sum, b) => sum + b.animalCount, 0);
    if (totalInSize <= 0 || toRemove <= 0) return baskets;

    const removalRatio = Math.min(1, toRemove / totalInSize);
    return baskets.map(b => {
      if (this.mapAnimalsPerKgToSaleSize(b.animalsPerKg) === saleSize) {
        return {
          ...b,
          animalCount: Math.round(b.animalCount * (1 - removalRatio))
        };
      }
      return b;
    }).filter(b => b.animalCount > 0);
  }

  mapAnimalsPerKgToSaleSize(animalsPerKg: number): string {
    const match = findSizeInRanges(animalsPerKg, this.activeSizeCandidates);
    if (!match) {
      throw new Error(`Nessuna taglia attiva per ${animalsPerKg} animali/kg`);
    }
    return match.code;
  }

  mapOrderSizeToSaleSize(tagliaCode: string): string | null {
    if (!tagliaCode) return null;
    const normalized = tagliaCode.toUpperCase().trim().replace(/\s+/g, '').replace(/\./g, '').replace(/,/g, '');
    if (this.activeSizeCandidates.some((candidate) => candidate.code === normalized)) return normalized;
    if (!normalized.startsWith('TP-') && normalized.startsWith('TP')) {
      const withDash = 'TP-' + normalized.substring(2);
      if (this.activeSizeCandidates.some((candidate) => candidate.code === withDash)) return withDash;
    }
    const num = parseInt(tagliaCode.replace(/\D/g, '')) || 0;
    if (num > 0) {
      const tpName = `TP-${num}`;
      if (this.activeSizeCandidates.some((candidate) => candidate.code === tpName)) return tpName;
    }
    return null;
  }
  
  mapTagliaToAggregateCategory(tagliaRichiesta: string | null): 'T3' | 'T10' | null {
    if (!tagliaRichiesta) return null;
    const taglia = tagliaRichiesta.toUpperCase();
    if (taglia.includes('2000') || taglia.includes('3000') || taglia.includes('3500')) {
      return 'T3';
    }
    if (taglia.includes('4000') || taglia.includes('5000')) {
      return 'T10';
    }
    return 'T3';
  }
  
  // Normalizza taglia richiesta al formato standard
  normalizeTagliaCode(tagliaRichiesta: string | null): string | null {
    if (!tagliaRichiesta) return null;
    const taglia = tagliaRichiesta.toUpperCase().trim();
    // Match standard format TP-XXXX
    if (taglia.match(/^TP-\d+$/)) return taglia;
    // Try to extract number
    const match = taglia.match(/(\d+)/);
    if (match) {
      return `TP-${match[1]}`;
    }
    return taglia;
  }
  
  // Mappa taglia richiesta ordine -> categoria (T3/T10) - legacy compatibility
  mapTagliaToCategory(tagliaRichiesta: string | null): 'T3' | 'T10' | null {
    return this.mapTagliaToAggregateCategory(tagliaRichiesta);
  }
  
  // Mappa taglia specifica a categoria inventario per simulazione crescita
  mapSizeToInventoryCategory(taglia: string): 'T1' | 'T3' | 'T10' {
    const normalized = taglia.toUpperCase();
    if (normalized.includes('4000') || normalized.includes('5000')) return 'T10';
    if (normalized.includes('2000') || normalized.includes('3000') || normalized.includes('3500')) return 'T3';
    return 'T3';
  }
  
  // Ottieni mortalità per taglia specifica
  getMortalityForSize(taglia: string, mortalityRates: Record<string, number>): number {
    // Prima prova taglia esatta
    if (mortalityRates[taglia] !== undefined) return mortalityRates[taglia];
    // Poi categoria aggregata
    const cat = this.mapSizeToInventoryCategory(taglia);
    if (mortalityRates[cat] !== undefined) return mortalityRates[cat];
    // Default
    return cat === 'T10' ? 0.02 : 0.03;
  }

  // Diagnostica ordini: mostra tutti gli ordini con date e calcoli di allocazione
  async getOrdersDiagnostic(): Promise<any> {
    if (!isDbEsternoAvailable() || !dbEsterno) {
      return { error: 'DB esterno non disponibile', ordini: [] };
    }

    try {
      const ordini = await dbEsterno
        .select({
          id: ordiniCondivisi.id,
          clienteNome: ordiniCondivisi.clienteNome,
          quantita: ordiniCondivisi.quantita,
          quantitaTotale: ordiniCondivisi.quantitaTotale,
          tagliaRichiesta: ordiniCondivisi.tagliaRichiesta,
          dataInizioConsegna: ordiniCondivisi.dataInizioConsegna,
          dataFineConsegna: ordiniCondivisi.dataFineConsegna,
          stato: ordiniCondivisi.stato
        })
        .from(ordiniCondivisi)
        .where(
          and(
            not(eq(ordiniCondivisi.stato, 'Annullato')),
            not(eq(ordiniCondivisi.cancellato, true))
          )
        );

      const dettagliOrdini = ordini.map(o => {
        const dataInizio = o.dataInizioConsegna ? new Date(o.dataInizioConsegna) : null;
        const dataFine = o.dataFineConsegna ? new Date(o.dataFineConsegna) : null;
        const quantita = o.quantitaTotale || o.quantita || 0;
        
        let mesiTotali = 0;
        let annoInizio = null;
        let annoFine = null;
        let isMultiAnno = false;
        
        if (dataInizio && dataFine) {
          annoInizio = dataInizio.getFullYear();
          annoFine = dataFine.getFullYear();
          isMultiAnno = annoInizio !== annoFine;
          mesiTotali = (annoFine - annoInizio) * 12 + (dataFine.getMonth() - dataInizio.getMonth()) + 1;
        }

        return {
          id: o.id,
          cliente: o.clienteNome,
          taglia: o.tagliaRichiesta,
          categoria: this.mapTagliaToCategory(o.tagliaRichiesta),
          quantitaTotale: quantita,
          dataInizio: dataInizio?.toISOString().split('T')[0] || null,
          dataFine: dataFine?.toISOString().split('T')[0] || null,
          annoInizio,
          annoFine,
          isMultiAnno,
          mesiTotali,
          quantitaPerMese: mesiTotali > 0 ? Math.round(quantita / mesiTotali) : quantita,
          stato: o.stato
        };
      });

      // Riepilogo per taglia
      const totaliPerTaglia: Record<string, number> = {};
      const totaliPerCategoria: Record<string, number> = { T3: 0, T10: 0, ALTRO: 0 };
      let ordiniMultiAnno = 0;

      for (const o of dettagliOrdini) {
        const taglia = o.taglia || 'SENZA_TAGLIA';
        totaliPerTaglia[taglia] = (totaliPerTaglia[taglia] || 0) + o.quantitaTotale;
        
        if (o.categoria) {
          totaliPerCategoria[o.categoria] += o.quantitaTotale;
        } else {
          totaliPerCategoria.ALTRO += o.quantitaTotale;
        }
        
        if (o.isMultiAnno) ordiniMultiAnno++;
      }

      return {
        totaleOrdini: ordini.length,
        ordiniMultiAnno,
        totaleAnimali: Object.values(totaliPerTaglia).reduce((a, b) => a + b, 0),
        totaliPerTaglia,
        totaliPerCategoria,
        ordini: dettagliOrdini.slice(0, 100) // Primi 100 per non sovraccaricare
      };
    } catch (error) {
      console.error('Errore diagnostica ordini:', error);
      return { error: String(error), ordini: [] };
    }
  }

  // Recupera ordini aggregati per mese e taglia specifica dall'anno specificato
  async getOrdersByMonthAndSize(year: number): Promise<Record<string, Record<string, number>>> {
    await this.refreshActiveSizeCandidates();
    const activeSaleSizes = this.activeSizeCandidates.map((candidate) => candidate.code);
    // Struttura: { "1": { "TP-2000": 1000000, "TP-3000": 500000, ... }, "2": {...} }
    const result: Record<string, Record<string, number>> = {};
    for (let m = 1; m <= 12; m++) {
      result[m.toString()] = {};
      for (const size of activeSaleSizes) {
        result[m.toString()][size] = 0;
      }
    }

    if (!isDbEsternoAvailable() || !dbEsterno) {
      console.log('⚠️ DB esterno non disponibile per ordini');
      return result;
    }

    try {
      const ordini = await dbEsterno
        .select({
          id: ordiniCondivisi.id,
          quantita: ordiniCondivisi.quantita,
          quantitaTotale: ordiniCondivisi.quantitaTotale,
          tagliaRichiesta: ordiniCondivisi.tagliaRichiesta,
          dataInizioConsegna: ordiniCondivisi.dataInizioConsegna,
          dataFineConsegna: ordiniCondivisi.dataFineConsegna,
          stato: ordiniCondivisi.stato
        })
        .from(ordiniCondivisi)
        .where(
          and(
            not(eq(ordiniCondivisi.stato, 'Annullato')),
            not(eq(ordiniCondivisi.cancellato, true))
          )
        );

      for (const ordine of ordini) {
        const tagliaCode = this.normalizeTagliaCode(ordine.tagliaRichiesta);
        if (!tagliaCode) continue;
        const saleSize = this.mapOrderSizeToSaleSize(tagliaCode);
        if (!saleSize) continue;

        const quantita = ordine.quantitaTotale || ordine.quantita || 0;
        if (quantita <= 0) continue;

        let dataInizio = ordine.dataInizioConsegna ? new Date(ordine.dataInizioConsegna) : null;
        let dataFine = ordine.dataFineConsegna ? new Date(ordine.dataFineConsegna) : null;

        if (dataInizio && !dataFine) dataFine = dataInizio;
        if (!dataInizio && dataFine) dataInizio = dataFine;

        if (!dataInizio || !dataFine) {
          const quantitaPerMese = Math.round(quantita / 12);
          for (let m = 1; m <= 12; m++) {
            if (!result[m.toString()][saleSize]) result[m.toString()][saleSize] = 0;
            result[m.toString()][saleSize] += quantitaPerMese;
          }
          continue;
        }

        if (dataInizio.getFullYear() > year) continue;
        if (dataFine.getFullYear() < year) continue;

        const mesiTotaliOrdine = (dataFine.getFullYear() - dataInizio.getFullYear()) * 12 
          + (dataFine.getMonth() - dataInizio.getMonth()) + 1;
        
        if (mesiTotaliOrdine <= 0) continue;

        const quantitaPerMese = Math.round(quantita / mesiTotaliOrdine);

        const meseInizioAnno = dataInizio.getFullYear() === year ? dataInizio.getMonth() + 1 : 1;
        const meseFineAnno = dataFine.getFullYear() === year ? dataFine.getMonth() + 1 : 12;

        for (let m = meseInizioAnno; m <= meseFineAnno; m++) {
          if (!result[m.toString()][saleSize]) {
            result[m.toString()][saleSize] = 0;
          }
          result[m.toString()][saleSize] += quantitaPerMese;
        }
      }

      console.log(`📊 Ordini per taglia ${year}:`, JSON.stringify(result));
    } catch (error) {
      console.error('Errore recupero ordini per forecast:', error);
    }

    return result;
  }

  // Legacy: Recupera ordini aggregati per mese e categoria (T3/T10) dall'anno specificato
  async getOrdersByMonthAndCategory(year: number): Promise<Record<string, Record<string, number>>> {
    // Struttura: { "1": { "T3": 1000000, "T10": 500000 }, "2": {...} }
    const result: Record<string, Record<string, number>> = {};
    for (let m = 1; m <= 12; m++) {
      result[m.toString()] = { T3: 0, T10: 0 };
    }

    if (!isDbEsternoAvailable() || !dbEsterno) {
      console.log('⚠️ DB esterno non disponibile per ordini');
      return result;
    }

    try {
      // Recupera ordini attivi dell'anno con date di consegna
      const ordini = await dbEsterno
        .select({
          id: ordiniCondivisi.id,
          quantita: ordiniCondivisi.quantita,
          quantitaTotale: ordiniCondivisi.quantitaTotale,
          tagliaRichiesta: ordiniCondivisi.tagliaRichiesta,
          dataInizioConsegna: ordiniCondivisi.dataInizioConsegna,
          dataFineConsegna: ordiniCondivisi.dataFineConsegna,
          stato: ordiniCondivisi.stato
        })
        .from(ordiniCondivisi)
        .where(
          and(
            not(eq(ordiniCondivisi.stato, 'Annullato')),
            not(eq(ordiniCondivisi.cancellato, true))
          )
        );

      for (const ordine of ordini) {
        const categoria = this.mapTagliaToCategory(ordine.tagliaRichiesta);
        if (!categoria) continue;

        const quantita = ordine.quantitaTotale || ordine.quantita || 0;
        if (quantita <= 0) continue;

        // Parse date consegna
        const dataInizio = ordine.dataInizioConsegna ? new Date(ordine.dataInizioConsegna) : null;
        const dataFine = ordine.dataFineConsegna ? new Date(ordine.dataFineConsegna) : null;

        if (!dataInizio || !dataFine) continue;

        // Verifica che l'ordine tocchi l'anno richiesto
        if (dataInizio.getFullYear() > year) continue;
        if (dataFine.getFullYear() < year) continue;

        // Calcola il numero TOTALE di mesi coperti dall'ordine (cross-year)
        const mesiTotaliOrdine = (dataFine.getFullYear() - dataInizio.getFullYear()) * 12 
          + (dataFine.getMonth() - dataInizio.getMonth()) + 1;
        
        if (mesiTotaliOrdine <= 0) continue;

        // Distribuisci la quantità TOTALE su tutti i mesi dell'ordine
        const quantitaPerMese = Math.round(quantita / mesiTotaliOrdine);

        // Alloca SOLO i mesi che cadono nell'anno richiesto
        const meseInizioAnno = dataInizio.getFullYear() === year ? dataInizio.getMonth() + 1 : 1;
        const meseFineAnno = dataFine.getFullYear() === year ? dataFine.getMonth() + 1 : 12;

        for (let m = meseInizioAnno; m <= meseFineAnno; m++) {
          result[m.toString()][categoria] += quantitaPerMese;
        }
      }

      console.log(`📊 Ordini ${year} caricati:`, JSON.stringify(result));
    } catch (error) {
      console.error('Errore recupero ordini per forecast:', error);
    }

    return result;
  }

  // Recupera ordini aggregati per taglia specifica per l'anno (usato nell'export Excel)
  async getOrdersBySpecificSize(year: number): Promise<OrdersBySize[]> {
    const ordersByMonth = await this.getOrdersByMonthAndSize(year);
    const ordersBySpecificSize: OrdersBySize[] = [];
    const sizeAnnualTotals: Record<string, number> = {};
    
    // Aggrega ordini annuali per taglia
    for (let m = 1; m <= 12; m++) {
      const monthData = ordersByMonth[m.toString()] || {};
      for (const [sizeCode, qty] of Object.entries(monthData)) {
        sizeAnnualTotals[sizeCode] = (sizeAnnualTotals[sizeCode] || 0) + qty;
      }
    }
    
    // Converti in array con categoria aggregata
    for (const [sizeCode, totalAnimals] of Object.entries(sizeAnnualTotals)) {
      if (totalAnimals > 0) {
        ordersBySpecificSize.push({
          sizeCode,
          totalAnimals,
          aggregateCategory: this.mapTagliaToAggregateCategory(sizeCode) || 'T3'
        });
      }
    }
    
    // Ordina per numero taglia
    ordersBySpecificSize.sort((a, b) => {
      const numA = parseInt(a.sizeCode.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.sizeCode.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    return ordersBySpecificSize;
  }

  async calculateForecast(
    year: number, 
    mortalityRates: { T1: number; T3: number; T10: number } = { T1: 0.05, T3: 0.03, T10: 0.02 }
  ): Promise<ForecastSummary> {
    const [
      targets,
      sgrRates,
      currentInventory,
      sgrLookup,
      ordersBySizeMonth,
      basketInventory
    ] = await Promise.all([
      this.getProductionTargets(year),
      this.getSgrRates(),
      this.getCurrentInventoryBySize(),
      this.getSgrLookup(),
      this.getOrdersByMonthAndSize(year),
      this.getBasketLevelInventory()
    ]);
    const activeSaleSizes = this.activeSizeCandidates.map((candidate) => candidate.code);
    
    let basketInventoryMutable = [...basketInventory];
    
    const monthlyData: MonthlyForecast[] = [];
    const seedingSchedule: SeedingSchedule[] = [];
    
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    
    let stockBySaleSize = this.aggregateBySaleSize(basketInventoryMutable);

    // Le categorie sono whitelist di business, ma il catalogo operativo è
    // sempre l'intersezione con i range attivi alla data corrente.
    const T3_CODES = new Set(['TP-2000', 'TP-2500', 'TP-3000', 'TP-3500']);
    const T10_CODES = new Set(['TP-4000', 'TP-4500', 'TP-5000', 'TP-6000', 'TP-7000', 'TP-8000', 'TP-9000', 'TP-10000']);
    const T3_SIZES = activeSaleSizes.filter(size => T3_CODES.has(size));
    const T10_SIZES = activeSaleSizes.filter(size => T10_CODES.has(size));
    const T1_SIZES = activeSaleSizes.filter(s => !T3_CODES.has(s) && !T10_CODES.has(s));

    const mapBudgetToSaleSize = (category: string): string[] => {
      if (category === 'T3') return T3_SIZES;
      if (category === 'T10') return T10_SIZES;
      return T1_SIZES;
    };

    const getMortalityForSaleSize = (saleSize: string): number => {
      if (T10_SIZES.includes(saleSize)) return mortalityRates.T10;
      if (T3_SIZES.includes(saleSize)) return mortalityRates.T3;
      return mortalityRates.T1;
    };

    for (let month = 1; month <= 12; month++) {
      const isPastMonth = month < currentMonth;
      const isCurrentMonth = month === currentMonth;
      const isFutureMonth = month > currentMonth;
      
      if (isCurrentMonth) {
        const daysInMonth = new Date(year, month, 0).getDate();
        const currentDay = today.getDate();
        const remainingDays = Math.max(0, daysInMonth - currentDay);
        if (remainingDays > 0) {
          basketInventoryMutable = this.simulateMonthlyGrowth(basketInventoryMutable, sgrLookup, month - 1, mortalityRates, remainingDays);
          stockBySaleSize = this.aggregateBySaleSize(basketInventoryMutable);
        }
      } else if (isFutureMonth) {
        basketInventoryMutable = this.simulateMonthlyGrowth(basketInventoryMutable, sgrLookup, month - 1, mortalityRates);
        stockBySaleSize = this.aggregateBySaleSize(basketInventoryMutable);
      }
      
      const monthOrders = ordersBySizeMonth[month.toString()] || {};
      const monthTargets = targets.filter(t => t.month === month);
      
      const saleSizesToProcess = new Set<string>();
      for (const saleSize of activeSaleSizes) {
        if ((monthOrders[saleSize] || 0) > 0) saleSizesToProcess.add(saleSize);
        if ((stockBySaleSize[saleSize] || 0) > 0 && !isPastMonth) saleSizesToProcess.add(saleSize);
      }
      for (const target of monthTargets) {
        const mappedSizes = mapBudgetToSaleSize(target.sizeCategory);
        mappedSizes.forEach(s => saleSizesToProcess.add(s));
      }
      
      for (const saleSize of saleSizesToProcess) {
        const ordersAnimals = monthOrders[saleSize] || 0;
        
        let budgetAnimals = 0;
        for (const target of monthTargets) {
          const mappedSizes = mapBudgetToSaleSize(target.sizeCategory);
          if (mappedSizes.includes(saleSize)) {
            budgetAnimals += Math.round(target.targetAnimals / mappedSizes.length);
          }
        }

        let availableForSale = 0;
        let soldAnimals = 0;
        let seedingRequirement = 0;
        let seedingDeadline: string | null = null;
        let meseSeminaT1: string | null = null;
        let giorniCrescita = 0;
        let giacenzaInizioMese = 0;

        if (isPastMonth) {
          giacenzaInizioMese = 0;
          soldAnimals = 0;
          availableForSale = 0;
        } else {
          giacenzaInizioMese = stockBySaleSize[saleSize] || 0;
          availableForSale = giacenzaInizioMese;
          const demand = Math.max(budgetAnimals, ordersAnimals);
          soldAnimals = Math.min(availableForSale, demand);
          stockBySaleSize[saleSize] = Math.max(0, (stockBySaleSize[saleSize] || 0) - soldAnimals);
          if (soldAnimals > 0) {
            basketInventoryMutable = this.removeAnimalsFromSaleSize(basketInventoryMutable, saleSize, soldAnimals);
          }
        }

        const deficit = budgetAnimals - soldAnimals;
        let seminaT1Richiesta = 0;
        
        const growthCategory = T10_SIZES.includes(saleSize) ? 'T10' : T3_SIZES.includes(saleSize) ? 'T3' : 'T1';
        const growthMonths = growthCategory === 'T10' ? 10 : growthCategory === 'T3' ? 6 : 3;
        const cumulativeMortalityT1 = Math.pow(1 - mortalityRates.T1, growthMonths);
        const cumulativeMortalityT3 = growthCategory === 'T10' 
          ? Math.pow(1 - mortalityRates.T3, 4) 
          : 1;
        
        if (deficit > 0) {
          const survivalRate = cumulativeMortalityT1 * cumulativeMortalityT3;
          seminaT1Richiesta = Math.ceil(deficit / survivalRate);
          
          const growthCalc = this.calculateGrowthDaysBackward(
            sgrLookup,
            month,
            year,
            growthCategory
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
            targetSize: saleSize,
            seedT1Amount: Math.round(seminaT1Richiesta),
            growthDays: giorniCrescita
          });
          
          seedingRequirement = Math.round(seminaT1Richiesta);
        }

        const productionForecast = soldAnimals;
        const varianceBudgetOrders = ordersAnimals - budgetAnimals;
        const varianceBudgetProduction = productionForecast - budgetAnimals;
        const varianceOrdersProduction = productionForecast - ordersAnimals;

        const deficitBudgetPct = budgetAnimals > 0 ? ((budgetAnimals - productionForecast) / budgetAnimals) * 100 : 0;
        const deficitOrdiniPct = ordersAnimals > 0 ? ((ordersAnimals - productionForecast) / ordersAnimals) * 100 : 0;
        const deficitOrdiniAssoluto = ordersAnimals - productionForecast;

        let status: 'on_track' | 'warning' | 'critical' = 'on_track';
        let statusDescription = 'Coperto';

        const hasBudgetCritical = deficitBudgetPct > 20;
        const hasBudgetWarning = deficitBudgetPct > 10;
        const hasOrdersCritical = deficitOrdiniPct > 30;
        const hasOrdersWarning = deficitOrdiniAssoluto > 0;

        if (hasBudgetCritical && hasOrdersCritical) {
          status = 'critical';
          statusDescription = `Budget -${Math.round(deficitBudgetPct)}% / Ordini -${Math.round(deficitOrdiniPct)}%`;
        } else if (hasBudgetCritical) {
          status = 'critical';
          statusDescription = `Budget -${Math.round(deficitBudgetPct)}%`;
        } else if (hasOrdersCritical) {
          status = 'critical';
          statusDescription = `Ordini -${Math.round(deficitOrdiniPct)}%`;
        } else if (hasBudgetWarning && hasOrdersWarning) {
          status = 'warning';
          statusDescription = `Budget -${Math.round(deficitBudgetPct)}% / Ordini -${this.formatNumber(deficitOrdiniAssoluto)}`;
        } else if (hasBudgetWarning) {
          status = 'warning';
          statusDescription = `Budget -${Math.round(deficitBudgetPct)}%`;
        } else if (hasOrdersWarning) {
          status = 'warning';
          statusDescription = `Ordini -${this.formatNumber(deficitOrdiniAssoluto)}`;
        }

        if (giacenzaInizioMese === 0 && budgetAnimals === 0 && ordersAnimals === 0 && isPastMonth) continue;

        const stockResiduo = stockBySaleSize[saleSize] || 0;

        monthlyData.push({
          year,
          month,
          monthName: MONTH_NAMES[month - 1],
          sizeCategory: saleSize,
          budgetAnimals,
          ordersAnimals,
          productionForecast: Math.round(productionForecast),
          varianceBudgetOrders,
          varianceBudgetProduction: Math.round(varianceBudgetProduction),
          varianceOrdersProduction: Math.round(varianceOrdersProduction),
          seedingRequirement,
          seedingDeadline,
          status,
          statusDescription,
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
    const ordersByCategoryAgg: Record<string, number> = {};
    for (const m of monthlyData) {
      ordersByCategoryAgg[m.sizeCategory] = (ordersByCategoryAgg[m.sizeCategory] || 0) + m.ordersAnimals;
    }

    // Ottieni totale assoluto ordini (non allocato per anno) per il KPI
    const ordersDiagnostic = await this.getOrdersDiagnostic();
    const totalOrdersAbsolute = ordersDiagnostic.totaleAnimali || totalOrders;
    const ordersAbsoluteByCategory = ordersDiagnostic.totaliPerCategoria || ordersByCategoryAgg;
    const ordersAbsoluteBySize = ordersDiagnostic.totaliPerTaglia || {};
    
    const ordersBySpecificSize: OrdersBySize[] = [];
    const sizeAnnualTotals: Record<string, number> = {};
    
    for (let m = 1; m <= 12; m++) {
      const monthData = ordersBySizeMonth[m.toString()] || {};
      for (const [sizeCode, qty] of Object.entries(monthData)) {
        sizeAnnualTotals[sizeCode] = (sizeAnnualTotals[sizeCode] || 0) + qty;
      }
    }
    
    for (const [sizeCode, totalAnimals] of Object.entries(sizeAnnualTotals)) {
      if (totalAnimals > 0) {
        ordersBySpecificSize.push({
          sizeCode,
          totalAnimals,
          aggregateCategory: this.mapTagliaToAggregateCategory(sizeCode) || 'T3'
        });
      }
    }
    
    ordersBySpecificSize.sort((a, b) => {
      const numA = parseInt(a.sizeCode.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.sizeCode.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    const budgetByCategory: Record<string, number> = {};
    
    for (const m of monthlyData) {
      budgetByCategory[m.sizeCategory] = (budgetByCategory[m.sizeCategory] || 0) + m.budgetAnimals;
    }

    return {
      year,
      totalBudget,
      totalOrders: totalOrdersAbsolute, // Usa totale assoluto per KPI
      totalOrdersYearAllocated: totalOrders, // Mantieni anche quello allocato per anno
      totalProductionForecast,
      overallVariance: totalProductionForecast - totalBudget,
      monthlyData,
      currentInventory,
      sgrRates,
      seedingSchedule,
      totalSeedingT1Required,
      ordersBySpecificSize,
      budgetByCategory,
      ordersByCategory: ordersAbsoluteByCategory, // Usa totali assoluti
      ordersAbsoluteBySize
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
