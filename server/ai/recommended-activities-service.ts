import { db } from '../db';
import { operations, baskets, cycles, flupsys, sizes } from '../../shared/schema';
import { eq, desc, and, isNotNull, sql } from 'drizzle-orm';

export type ActivityType = 'pulizia' | 'campionamento' | 'calibratura' | 'misura' | 'raccolta';
export type Priority = 'alta' | 'media' | 'suggerimento';

export interface RecommendedActivity {
  id: string;
  type: ActivityType;
  priority: Priority;
  basketId: number;
  basketPhysicalNumber: number;
  flupsyId: number;
  flupsyName: string;
  cycleId: number | null;
  reason: string;
  daysSinceLastOperation: number | null;
  lastOperationDate: string | null;
  additionalInfo?: string;
}

export interface RecommendedActivitiesResult {
  date: string;
  totalActivities: number;
  highPriority: number;
  mediumPriority: number;
  suggestions: number;
  activities: RecommendedActivity[];
}

const THRESHOLDS = {
  PULIZIA_ALTA: 10,
  PULIZIA_MEDIA: 7,
  CAMPIONAMENTO_ALTA: 10,
  CAMPIONAMENTO_MEDIA: 6,
  MISURA_ALTA: 8,
  MISURA_MEDIA: 5,
};

export class RecommendedActivitiesService {

  static async getRecommendedActivities(flupsyId?: number): Promise<RecommendedActivitiesResult> {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    const activities: RecommendedActivity[] = [];

    const activeBaskets = await db
      .select({
        basketId: baskets.id,
        physicalNumber: baskets.physicalNumber,
        flupsyId: baskets.flupsyId,
        flupsyName: flupsys.name,
        currentCycleId: baskets.currentCycleId,
        state: baskets.state,
      })
      .from(baskets)
      .innerJoin(flupsys, eq(baskets.flupsyId, flupsys.id))
      .where(
        flupsyId 
          ? and(eq(baskets.state, 'active'), eq(baskets.flupsyId, flupsyId))
          : eq(baskets.state, 'active')
      );

    console.log(`📋 Analisi attività consigliate per ${activeBaskets.length} cestelli attivi`);

    for (const basket of activeBaskets) {
      const basketOperations = await db
        .select({
          id: operations.id,
          date: operations.date,
          type: operations.type,
          animalsPerKg: operations.animalsPerKg,
          totalWeight: operations.totalWeight,
          mortalityRate: operations.mortalityRate,
          sizeId: operations.sizeId,
        })
        .from(operations)
        .where(
          and(
            eq(operations.basketId, basket.basketId),
            basket.currentCycleId ? eq(operations.cycleId, basket.currentCycleId) : sql`1=1`
          )
        )
        .orderBy(desc(operations.date))
        .limit(30);

      const lastPulizia = basketOperations.find(op => op.type === 'pulizia');
      const lastMisura = basketOperations.find(op => op.type === 'misura');
      const lastPeso = basketOperations.find(op => op.type === 'peso');
      const lastAnyOperation = basketOperations[0];

      const daysSincePulizia = lastPulizia 
        ? Math.floor((today.getTime() - new Date(lastPulizia.date).getTime()) / (1000 * 60 * 60 * 24))
        : null;
      
      const daysSinceMisura = lastMisura
        ? Math.floor((today.getTime() - new Date(lastMisura.date).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const daysSincePeso = lastPeso
        ? Math.floor((today.getTime() - new Date(lastPeso.date).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      if (daysSincePulizia === null || daysSincePulizia >= THRESHOLDS.PULIZIA_ALTA) {
        activities.push({
          id: `pulizia-${basket.basketId}`,
          type: 'pulizia',
          priority: 'alta',
          basketId: basket.basketId,
          basketPhysicalNumber: basket.physicalNumber,
          flupsyId: basket.flupsyId,
          flupsyName: basket.flupsyName,
          cycleId: basket.currentCycleId,
          reason: daysSincePulizia === null 
            ? 'Nessuna pulizia registrata per questo ciclo'
            : `Ultima pulizia: ${daysSincePulizia} giorni fa - Rischio fouling elevato`,
          daysSinceLastOperation: daysSincePulizia,
          lastOperationDate: lastPulizia?.date?.toString() || null,
        });
      } else if (daysSincePulizia >= THRESHOLDS.PULIZIA_MEDIA) {
        activities.push({
          id: `pulizia-${basket.basketId}`,
          type: 'pulizia',
          priority: 'media',
          basketId: basket.basketId,
          basketPhysicalNumber: basket.physicalNumber,
          flupsyId: basket.flupsyId,
          flupsyName: basket.flupsyName,
          cycleId: basket.currentCycleId,
          reason: `Ultima pulizia: ${daysSincePulizia} giorni fa - Consigliata manutenzione`,
          daysSinceLastOperation: daysSincePulizia,
          lastOperationDate: lastPulizia?.date?.toString() || null,
        });
      }

      const daysSinceCampionamento = daysSinceMisura !== null ? daysSinceMisura : daysSincePeso;
      const lastCampionamento = lastMisura || lastPeso;
      
      if (daysSinceCampionamento === null || daysSinceCampionamento >= THRESHOLDS.CAMPIONAMENTO_ALTA) {
        activities.push({
          id: `campionamento-${basket.basketId}`,
          type: 'campionamento',
          priority: 'alta',
          basketId: basket.basketId,
          basketPhysicalNumber: basket.physicalNumber,
          flupsyId: basket.flupsyId,
          flupsyName: basket.flupsyName,
          cycleId: basket.currentCycleId,
          reason: daysSinceCampionamento === null
            ? 'Nessun campionamento/misura registrato per questo ciclo'
            : `Ultimo campionamento: ${daysSinceCampionamento} giorni fa - Monitoraggio crescita necessario`,
          daysSinceLastOperation: daysSinceCampionamento,
          lastOperationDate: lastCampionamento?.date?.toString() || null,
        });
      } else if (daysSinceCampionamento >= THRESHOLDS.CAMPIONAMENTO_MEDIA) {
        activities.push({
          id: `campionamento-${basket.basketId}`,
          type: 'campionamento',
          priority: 'media',
          basketId: basket.basketId,
          basketPhysicalNumber: basket.physicalNumber,
          flupsyId: basket.flupsyId,
          flupsyName: basket.flupsyName,
          cycleId: basket.currentCycleId,
          reason: `Ultimo campionamento: ${daysSinceCampionamento} giorni fa - Consigliato monitoraggio`,
          daysSinceLastOperation: daysSinceCampionamento,
          lastOperationDate: lastCampionamento?.date?.toString() || null,
        });
      }

      const latestWithAnimalsPerKg = basketOperations.find(op => op.animalsPerKg && op.animalsPerKg > 0);
      if (latestWithAnimalsPerKg && latestWithAnimalsPerKg.animalsPerKg) {
        const animalsPerKg = latestWithAnimalsPerKg.animalsPerKg;
        
        if (animalsPerKg <= 6000) {
          activities.push({
            id: `raccolta-${basket.basketId}`,
            type: 'raccolta',
            priority: animalsPerKg <= 4000 ? 'alta' : 'suggerimento',
            basketId: basket.basketId,
            basketPhysicalNumber: basket.physicalNumber,
            flupsyId: basket.flupsyId,
            flupsyName: basket.flupsyName,
            cycleId: basket.currentCycleId,
            reason: animalsPerKg <= 4000 
              ? `Taglia commerciale raggiunta (${animalsPerKg} an/kg) - Pronto per raccolta`
              : `Taglia quasi commerciale (${animalsPerKg} an/kg) - Valutare raccolta`,
            daysSinceLastOperation: null,
            lastOperationDate: null,
            additionalInfo: `Peso medio: ${(1000000 / animalsPerKg).toFixed(0)} mg`,
          });
        }

        if (animalsPerKg >= 8000 && animalsPerKg <= 15000) {
          const recentOps = basketOperations.filter(op => op.animalsPerKg && op.animalsPerKg > 0).slice(0, 3);
          if (recentOps.length >= 2) {
            const growthRate = recentOps[0].animalsPerKg && recentOps[1].animalsPerKg
              ? ((1000000 / recentOps[0].animalsPerKg) - (1000000 / recentOps[1].animalsPerKg)) / (1000000 / recentOps[1].animalsPerKg) * 100
              : 0;
            
            if (growthRate > 15) {
              activities.push({
                id: `calibratura-${basket.basketId}`,
                type: 'calibratura',
                priority: 'suggerimento',
                basketId: basket.basketId,
                basketPhysicalNumber: basket.physicalNumber,
                flupsyId: basket.flupsyId,
                flupsyName: basket.flupsyName,
                cycleId: basket.currentCycleId,
                reason: `Crescita rapida rilevata (+${growthRate.toFixed(1)}%) - Valutare calibratura/separazione`,
                daysSinceLastOperation: null,
                lastOperationDate: null,
                additionalInfo: `Attuale: ${animalsPerKg} an/kg`,
              });
            }
          }
        }
      }

      const recentHighMortality = basketOperations.find(op => 
        op.mortalityRate && op.mortalityRate > 5 &&
        Math.floor((today.getTime() - new Date(op.date).getTime()) / (1000 * 60 * 60 * 24)) <= 7
      );
      
      if (recentHighMortality) {
        activities.push({
          id: `misura-urgente-${basket.basketId}`,
          type: 'misura',
          priority: 'alta',
          basketId: basket.basketId,
          basketPhysicalNumber: basket.physicalNumber,
          flupsyId: basket.flupsyId,
          flupsyName: basket.flupsyName,
          cycleId: basket.currentCycleId,
          reason: `Mortalità elevata rilevata (${recentHighMortality.mortalityRate?.toFixed(1)}%) - Verifica urgente condizioni`,
          daysSinceLastOperation: null,
          lastOperationDate: recentHighMortality.date?.toString() || null,
          additionalInfo: 'Controllare parametri acqua e stato animali',
        });
      }
    }

    activities.sort((a, b) => {
      const priorityOrder = { 'alta': 0, 'media': 1, 'suggerimento': 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.flupsyName.localeCompare(b.flupsyName) || a.basketPhysicalNumber - b.basketPhysicalNumber;
    });

    const highPriority = activities.filter(a => a.priority === 'alta').length;
    const mediumPriority = activities.filter(a => a.priority === 'media').length;
    const suggestions = activities.filter(a => a.priority === 'suggerimento').length;

    console.log(`✅ Attività consigliate generate: ${activities.length} totali (${highPriority} alta, ${mediumPriority} media, ${suggestions} suggerimenti)`);

    return {
      date: todayString,
      totalActivities: activities.length,
      highPriority,
      mediumPriority,
      suggestions,
      activities,
    };
  }
}
