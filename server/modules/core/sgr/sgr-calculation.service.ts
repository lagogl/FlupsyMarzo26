import { storage } from "../../../storage";
import { Operation, Size } from "../../../../shared/schema";
import { sgrAiQualityService } from "./sgr-ai-quality.service";

/**
 * Service for calculating SGR from historical operations data
 * Supports both same-cycle consecutive measurements and cross-cycle lineage pairs
 * (prima-attivazione parent → prima-attivazione child, via vagliatura)
 */
export class SgrCalculationService {
  
  /**
   * Find size for given animalsPerKg
   * Handles open bounds (null min/max) for edge sizes
   */
  private async findSizeForAnimalsPerKg(animalsPerKg: number): Promise<Size | null> {
    const sizes = await storage.getAllSizes();
    
    const matchingSize = sizes.find(size => {
      const minBound = size.minAnimalsPerKg || 0;
      const maxBound = size.maxAnimalsPerKg || Infinity;
      return animalsPerKg >= minBound && animalsPerKg <= maxBound;
    });
    
    return matchingSize || null;
  }

  /**
   * Calculate SGR between two weight values
   * Formula: SGR = [(ln(W2) - ln(W1)) / Days] × 100
   * For same-cycle: use totalWeight. For cross-cycle: use averageWeight (g/animal).
   */
  private calculateSgrBetweenWeights(
    weight1: number,
    weight2: number,
    days: number
  ): number | null {
    if (days < 5 || weight1 <= 0 || weight2 <= 0 || weight2 <= weight1) {
      return null;
    }
    return ((Math.log(weight2) - Math.log(weight1)) / days) * 100;
  }

  /**
   * Collects cross-cycle SGR pairs via cycle lineage (parentCycleId).
   *
   * A valid cross-cycle pair is:
   *   op1 = prima-attivazione of the PARENT cycle (any date)
   *   op2 = prima-attivazione of the CHILD cycle  (date in target window)
   *
   * Uses averageWeight (grams/animal) to measure growth of individuals
   * regardless of how the population was split by vagliatura.
   * The SGR is attributed to the parent's size class at op1.
   */
  private async collectCrossCyclePairs(
    allOperations: Operation[],
    windowStart: Date,
    windowEnd: Date
  ): Promise<Array<{ sizeId: number; sgr: number; parentCycleId: number; childCycleId: number }>> {
    const results: Array<{ sizeId: number; sgr: number; parentCycleId: number; childCycleId: number }> = [];

    // Build fast lookup: cycleId → list of prima-attivazioni sorted by date
    const primaByParentCycle = new Map<number, Operation>();
    const primaByChildCycle = new Map<number, Operation>();

    for (const op of allOperations) {
      if (op.type !== 'prima-attivazione' || !op.cycleId) continue;
      if (!op.averageWeight || op.averageWeight <= 0) continue;
      // Keep the earliest prima-attivazione per cycle
      if (!primaByParentCycle.has(op.cycleId)) {
        primaByParentCycle.set(op.cycleId, op);
      } else {
        const existing = primaByParentCycle.get(op.cycleId)!;
        if (new Date(op.date) < new Date(existing.date)) {
          primaByParentCycle.set(op.cycleId, op);
        }
      }
    }
    // child cycle lookup is the same dataset
    primaByParentCycle.forEach((op, cycleId) => primaByChildCycle.set(cycleId, op));

    // Get all cycles that have a parentCycleId (child cycles from vagliatura/transfer)
    const allCycles = await storage.getCycles();
    const childCycles = allCycles.filter(c => c.parentCycleId != null);

    console.log(`🔗 SGR CROSS-CYCLE: Trovati ${childCycles.length} cicli figli da analizzare`);

    for (const childCycle of childCycles) {
      const parentCycleId = childCycle.parentCycleId!;

      const parentPA = primaByChildCycle.get(parentCycleId);
      const childPA  = primaByChildCycle.get(childCycle.id);

      if (!parentPA || !childPA) continue;

      // The child's prima-attivazione must fall within the target window
      const childDate = new Date(childPA.date);
      if (childDate < windowStart || childDate > windowEnd) continue;

      // We need animalsPerKg on the parent op to determine size class
      if (!parentPA.animalsPerKg) continue;

      const days = Math.floor(
        (new Date(childPA.date).getTime() - new Date(parentPA.date).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Use averageWeight (g/animal) for cross-cycle — immune to population split
      const sgr = this.calculateSgrBetweenWeights(
        Number(parentPA.averageWeight),
        Number(childPA.averageWeight!),
        days
      );

      if (sgr === null || sgr <= 0 || sgr >= 10) continue;

      // Attribute SGR to the parent's size class (where the animals were at T1)
      const parentSize = await this.findSizeForAnimalsPerKg(parentPA.animalsPerKg);
      if (!parentSize) continue;

      results.push({
        sizeId: parentSize.id,
        sgr,
        parentCycleId,
        childCycleId: childCycle.id
      });

      console.log(
        `✅ SGR CROSS-CYCLE: Ciclo ${parentCycleId} → ${childCycle.id} | ` +
        `${String(parentPA.date).substring(0, 10)} → ${String(childPA.date).substring(0, 10)} ` +
        `(${days}gg) | ${parentSize.name} | SGR=${sgr.toFixed(3)}%`
      );
    }

    console.log(`🔗 SGR CROSS-CYCLE: ${results.length} coppie valide trovate nella finestra temporale`);
    return results;
  }

  /**
   * Calculate SGR for a specific month and year from historical operations.
   * Combines:
   *   1. Same-cycle consecutive pairs (existing logic, uses totalWeight)
   *   2. Cross-cycle lineage pairs via parentCycleId (new, uses averageWeight)
   */
  async calculateSgrForMonth(month: string, year: number): Promise<Map<number, { sgr: number; sampleCount: number }>> {
    console.log(`📊 SGR CALCULATION: Starting calculation for ${month} ${year}`);
    
    const monthNumber = this.getMonthNumber(month);
    const startDate = new Date(year, monthNumber, 1);
    const endDate = new Date(year, monthNumber + 1, 0);
    
    console.log(`📅 SGR CALCULATION: Date range ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    const allOperations = await storage.getOperations();
    
    // Filter weighing operations in the target month
    const targetOperations = allOperations.filter(op => {
      const opDate = new Date(op.date);
      return opDate >= startDate && 
             opDate <= endDate && 
             op.totalWeight && 
             op.animalsPerKg;
    });
    
    console.log(`🔍 SGR CALCULATION: Found ${targetOperations.length} weighing operations in ${month} ${year}`);
    
    // AI Quality Check on target operations
    const qualityCheck = await sgrAiQualityService.analyzeDataQuality(targetOperations);
    console.log(`🤖 AI QUALITY: ${qualityCheck.summary.valid}/${qualityCheck.summary.total} operations passed validation`);
    if (qualityCheck.anomalies.length > 0) {
      console.log(`⚠️  AI QUALITY: Found ${qualityCheck.anomalies.length} anomalies`);
    }
    
    const validTargetOperations = qualityCheck.validOperations;
    
    // Group operations by basket to find consecutive weighings (same-cycle logic)
    const basketOperations = new Map<number, Operation[]>();
    for (const op of validTargetOperations) {
      if (!basketOperations.has(op.basketId)) {
        basketOperations.set(op.basketId, []);
      }
      basketOperations.get(op.basketId)!.push(op);
    }
    
    // Also include operations 2 months before target to find cross-month pairs
    const extendedStartDate = new Date(year, monthNumber - 2, 1);
    const previousOperations = allOperations.filter(op => {
      const opDate = new Date(op.date);
      return opDate >= extendedStartDate && 
             opDate < startDate && 
             op.totalWeight && 
             op.animalsPerKg;
    });
    
    for (const op of previousOperations) {
      if (!basketOperations.has(op.basketId)) {
        basketOperations.set(op.basketId, []);
      }
      basketOperations.get(op.basketId)!.push(op);
    }
    
    for (const [basketId, ops] of basketOperations.entries()) {
      ops.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    
    // ── 1. Same-cycle SGR ────────────────────────────────────────────────────
    const sgrBySize = new Map<number, number[]>();
    
    for (const [basketId, ops] of basketOperations.entries()) {
      for (let i = 0; i < ops.length - 1; i++) {
        const op1 = ops[i];
        const op2 = ops[i + 1];
        
        const days = Math.floor(
          (new Date(op2.date).getTime() - new Date(op1.date).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (days < 5) continue;
        
        const size1 = await this.findSizeForAnimalsPerKg(op1.animalsPerKg!);
        const size2 = await this.findSizeForAnimalsPerKg(op2.animalsPerKg!);
        
        if (!size1 || !size2 || size1.id !== size2.id) continue;
        
        const sgr = this.calculateSgrBetweenWeights(
          op1.totalWeight!,
          op2.totalWeight!,
          days
        );
        
        if (sgr !== null && sgr > 0 && sgr < 10) {
          if (!sgrBySize.has(size1.id)) sgrBySize.set(size1.id, []);
          sgrBySize.get(size1.id)!.push(sgr);
        }
      }
    }

    // ── 2. Cross-cycle SGR via lineage ───────────────────────────────────────
    // Extended window: child prima-attivazione must fall in target month
    // Parent prima-attivazione can be from any time (we use allOperations)
    const crossCyclePairs = await this.collectCrossCyclePairs(
      allOperations,
      startDate,
      endDate
    );

    for (const pair of crossCyclePairs) {
      if (!sgrBySize.has(pair.sizeId)) sgrBySize.set(pair.sizeId, []);
      sgrBySize.get(pair.sizeId)!.push(pair.sgr);
    }
    
    console.log(
      `📊 SGR CALCULATION: Same-cycle coppie analizzate, ${crossCyclePairs.length} coppie cross-ciclo aggiunte`
    );

    // ── 3. Aggregate results ─────────────────────────────────────────────────
    const results = new Map<number, { sgr: number; sampleCount: number }>();
    
    for (const [sizeId, sgrValues] of sgrBySize.entries()) {
      if (sgrValues.length > 0) {
        const avgSgr = sgrValues.reduce((sum, val) => sum + val, 0) / sgrValues.length;
        results.set(sizeId, {
          sgr: avgSgr,
          sampleCount: sgrValues.length
        });
        console.log(`✅ SGR CALCULATION: Size ${sizeId}: ${avgSgr.toFixed(3)}% (${sgrValues.length} samples)`);
      }
    }
    
    console.log(`📊 SGR CALCULATION: Completed for ${month} ${year}. Found ${results.size} size groups.`);
    
    return results;
  }

  /**
   * Get month number (0-11) from month name
   */
  private getMonthNumber(monthName: string): number {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
  }

  /**
   * Calculate and store SGR for current month based on same month last year
   */
  async calculateAndStoreSgrForCurrentMonth(): Promise<{
    month: string;
    year: number;
    results: Array<{ sizeId: number; sizeName: string; sgr: number; sampleCount: number }>;
  }> {
    const now = new Date();
    const currentMonth = now.toLocaleString('en-US', { month: 'long' });
    const lastYear = now.getFullYear() - 1;
    
    console.log(`🚀 SGR CALCULATION: Calculating SGR for ${currentMonth} based on ${currentMonth} ${lastYear} data`);
    
    const sgrBySize = await this.calculateSgrForMonth(currentMonth, lastYear);
    const sizes = await storage.getAllSizes();
    const sizeMap = new Map(sizes.map(s => [s.id, s]));
    
    const results: Array<{ sizeId: number; sizeName: string; sgr: number; sampleCount: number }> = [];
    
    for (const [sizeId, data] of sgrBySize.entries()) {
      const size = sizeMap.get(sizeId);
      if (!size) continue;
      
      await storage.upsertSgrPerTaglia(
        currentMonth,
        sizeId,
        data.sgr,
        data.sampleCount,
        `Calculated from ${currentMonth} ${lastYear} historical data`
      );
      
      results.push({
        sizeId,
        sizeName: size.name,
        sgr: data.sgr,
        sampleCount: data.sampleCount
      });
    }
    
    console.log(`✅ SGR CALCULATION: Stored ${results.length} SGR values for ${currentMonth}`);
    
    return { month: currentMonth, year: lastYear, results };
  }

  /**
   * Calculate and store SGR for specific month based on same month last year
   */
  async calculateAndStoreSgrForSpecificMonth(targetMonth: string): Promise<{
    month: string;
    year: number;
    results: Array<{ sizeId: number; sizeName: string; sgr: number; sampleCount: number }>;
  }> {
    const now = new Date();
    const lastYear = now.getFullYear() - 1;
    
    console.log(`🚀 SGR CALCULATION: Calculating SGR for ${targetMonth} based on ${targetMonth} ${lastYear} data`);
    
    const sgrBySize = await this.calculateSgrForMonth(targetMonth, lastYear);
    const sizes = await storage.getAllSizes();
    const sizeMap = new Map(sizes.map(s => [s.id, s]));
    
    const results: Array<{ sizeId: number; sizeName: string; sgr: number; sampleCount: number }> = [];
    
    for (const [sizeId, data] of sgrBySize.entries()) {
      const size = sizeMap.get(sizeId);
      if (!size) continue;
      
      await storage.upsertSgrPerTaglia(
        targetMonth,
        sizeId,
        data.sgr,
        data.sampleCount,
        `Calculated from ${targetMonth} ${lastYear} historical data`
      );
      
      results.push({
        sizeId,
        sizeName: size.name,
        sgr: data.sgr,
        sampleCount: data.sampleCount
      });
    }
    
    console.log(`✅ SGR CALCULATION: Stored ${results.length} SGR values for ${targetMonth}`);
    
    return { month: targetMonth, year: lastYear, results };
  }
}

export const sgrCalculationService = new SgrCalculationService();
