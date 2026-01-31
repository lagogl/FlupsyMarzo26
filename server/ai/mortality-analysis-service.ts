import { db } from '../db';
import { sql } from 'drizzle-orm';

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type MortalityPattern = 'spike' | 'persistent' | 'localized' | 'improving' | 'stable';

export interface MortalityAlert {
  id: string;
  severity: AlertSeverity;
  pattern: MortalityPattern;
  title: string;
  description: string;
  affectedBaskets: number[];
  affectedFlupsys: string[];
  recommendation: string;
  dataPoints: {
    currentWeekDeaths: number;
    previousWeekDeaths: number;
    avgMortalityRate: number;
    basketsAffected: number;
  };
}

export interface BasketMortalityDetail {
  basketId: number;
  physicalNumber: number;
  flupsyName: string;
  totalDeaths: number;
  mortalityEvents: number;
  avgMortalityRate: number;
  lastMortalityDate: string;
  daysSinceLastMortality: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface MortalityAnalysisResult {
  date: string;
  alerts: MortalityAlert[];
  topAffectedBaskets: BasketMortalityDetail[];
  summary: {
    totalAlertsCount: number;
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    overallStatus: 'critical' | 'warning' | 'healthy';
    recentMortalityPercentage: number;
  };
  patterns: {
    hasMortalitySpike: boolean;
    hasPersistentMortality: boolean;
    hasLocalizedProblem: boolean;
    isImproving: boolean;
  };
}

export class MortalityAnalysisService {

  static async analyzePatterns(flupsyId?: number): Promise<MortalityAnalysisResult> {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const alerts: MortalityAlert[] = [];

    console.log('🔬 Inizio analisi pattern mortalità...');

    const mortalityData = await db.execute(sql`
      WITH recent_mortality AS (
        SELECT 
          o.basket_id,
          b.physical_number,
          b.flupsy_id,
          f.name as flupsy_name,
          o.dead_count,
          o.mortality_rate,
          o.date,
          (CURRENT_DATE - DATE(o.date)) as days_ago
        FROM operations o
        JOIN baskets b ON b.id = o.basket_id
        JOIN flupsys f ON f.id = b.flupsy_id
        WHERE b.state = 'active'
          AND b.current_cycle_id IS NOT NULL
          AND o.dead_count IS NOT NULL 
          AND o.dead_count > 0
          ${flupsyId ? sql`AND b.flupsy_id = ${flupsyId}` : sql``}
      ),
      basket_stats AS (
        SELECT 
          basket_id,
          physical_number,
          flupsy_id,
          flupsy_name,
          COUNT(*) as mortality_events,
          SUM(dead_count) as total_deaths,
          AVG(mortality_rate) as avg_mortality_rate,
          MAX(date) as last_mortality_date,
          MIN(CASE WHEN days_ago <= 7 THEN days_ago END) as min_days_ago,
          SUM(CASE WHEN days_ago <= 7 THEN dead_count ELSE 0 END) as week_deaths,
          SUM(CASE WHEN days_ago <= 3 THEN dead_count ELSE 0 END) as recent_deaths
        FROM recent_mortality
        GROUP BY basket_id, physical_number, flupsy_id, flupsy_name
      ),
      weekly_comparison AS (
        SELECT 
          COALESCE(SUM(CASE WHEN days_ago <= 7 THEN dead_count ELSE 0 END), 0) as current_week,
          COALESCE(SUM(CASE WHEN days_ago > 7 AND days_ago <= 14 THEN dead_count ELSE 0 END), 0) as previous_week
        FROM recent_mortality
      ),
      flupsy_concentration AS (
        SELECT 
          flupsy_id,
          flupsy_name,
          COUNT(DISTINCT basket_id) as affected_baskets,
          SUM(dead_count) as total_deaths,
          AVG(mortality_rate) as avg_rate
        FROM recent_mortality
        WHERE days_ago <= 7
        GROUP BY flupsy_id, flupsy_name
        HAVING COUNT(DISTINCT basket_id) >= 3
      )
      SELECT 
        'basket_stats' as query_type,
        basket_id::text as id,
        physical_number::text as physical_number,
        flupsy_id::text as flupsy_id,
        flupsy_name,
        mortality_events::text as mortality_events,
        total_deaths::text as total_deaths,
        avg_mortality_rate::text as avg_mortality_rate,
        last_mortality_date::text as last_mortality_date,
        min_days_ago::text as days_since_last,
        week_deaths::text as week_deaths,
        recent_deaths::text as recent_deaths,
        NULL as current_week,
        NULL as previous_week,
        NULL as affected_baskets
      FROM basket_stats
      
      UNION ALL
      
      SELECT 
        'weekly' as query_type,
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
        current_week::text,
        previous_week::text,
        NULL
      FROM weekly_comparison
      
      UNION ALL
      
      SELECT 
        'flupsy_concentration' as query_type,
        NULL,
        NULL,
        flupsy_id::text,
        flupsy_name,
        NULL,
        total_deaths::text,
        avg_rate::text,
        NULL, NULL, NULL, NULL, NULL, NULL,
        affected_baskets::text
      FROM flupsy_concentration
    `);

    const basketStats: BasketMortalityDetail[] = [];
    let currentWeekDeaths = 0;
    let previousWeekDeaths = 0;
    const flupsyProblems: { flupsyId: string; flupsyName: string; affectedBaskets: number; deaths: number }[] = [];

    for (const row of mortalityData.rows as any[]) {
      if (row.query_type === 'basket_stats') {
        const daysSince = parseInt(row.days_since_last) || 999;
        const recentDeaths = parseInt(row.recent_deaths) || 0;
        const weekDeaths = parseInt(row.week_deaths) || 0;
        
        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (recentDeaths > weekDeaths * 0.6) trend = 'increasing';
        else if (recentDeaths < weekDeaths * 0.2) trend = 'decreasing';

        basketStats.push({
          basketId: parseInt(row.id),
          physicalNumber: parseInt(row.physical_number),
          flupsyName: row.flupsy_name,
          totalDeaths: parseInt(row.total_deaths) || 0,
          mortalityEvents: parseInt(row.mortality_events) || 0,
          avgMortalityRate: parseFloat(row.avg_mortality_rate) || 0,
          lastMortalityDate: row.last_mortality_date,
          daysSinceLastMortality: daysSince,
          trend
        });
      } else if (row.query_type === 'weekly') {
        currentWeekDeaths = parseInt(row.current_week) || 0;
        previousWeekDeaths = parseInt(row.previous_week) || 0;
      } else if (row.query_type === 'flupsy_concentration') {
        flupsyProblems.push({
          flupsyId: row.flupsy_id,
          flupsyName: row.flupsy_name,
          affectedBaskets: parseInt(row.affected_baskets) || 0,
          deaths: parseInt(row.total_deaths) || 0
        });
      }
    }

    basketStats.sort((a, b) => b.totalDeaths - a.totalDeaths);
    const topAffectedBaskets = basketStats.slice(0, 10);

    const hasMortalitySpike = previousWeekDeaths > 0 && 
      (currentWeekDeaths / previousWeekDeaths) > 1.5;
    
    const hasPersistentMortality = basketStats.filter(b => 
      b.mortalityEvents >= 3 && b.daysSinceLastMortality <= 7
    ).length >= 2;

    const hasLocalizedProblem = flupsyProblems.length > 0;

    const isImproving = previousWeekDeaths > 0 && 
      (currentWeekDeaths / previousWeekDeaths) < 0.5;

    if (hasMortalitySpike) {
      const spikePercent = previousWeekDeaths > 0 
        ? Math.round(((currentWeekDeaths - previousWeekDeaths) / previousWeekDeaths) * 100) 
        : 100;
      
      alerts.push({
        id: `spike-${todayString}`,
        severity: spikePercent > 100 ? 'critical' : 'warning',
        pattern: 'spike',
        title: 'Picco di mortalità rilevato',
        description: `La mortalità è aumentata del ${spikePercent}% rispetto alla settimana precedente`,
        affectedBaskets: topAffectedBaskets.slice(0, 5).map(b => b.basketId),
        affectedFlupsys: [...new Set(topAffectedBaskets.map(b => b.flupsyName))],
        recommendation: 'Verificare condizioni ambientali (temperatura, ossigeno, flusso d\'acqua) e ispezionare le ceste con maggiore mortalità',
        dataPoints: {
          currentWeekDeaths,
          previousWeekDeaths,
          avgMortalityRate: topAffectedBaskets.reduce((sum, b) => sum + b.avgMortalityRate, 0) / (topAffectedBaskets.length || 1),
          basketsAffected: basketStats.length
        }
      });
    }

    if (hasPersistentMortality) {
      const persistentBaskets = basketStats.filter(b => 
        b.mortalityEvents >= 3 && b.daysSinceLastMortality <= 7
      );
      
      alerts.push({
        id: `persistent-${todayString}`,
        severity: 'warning',
        pattern: 'persistent',
        title: 'Mortalità persistente in alcune ceste',
        description: `${persistentBaskets.length} ceste mostrano mortalità ripetuta (3+ eventi negli ultimi 7 giorni)`,
        affectedBaskets: persistentBaskets.map(b => b.basketId),
        affectedFlupsys: [...new Set(persistentBaskets.map(b => b.flupsyName))],
        recommendation: 'Considerare spostamento animali in ceste alternative o controllo approfondito delle condizioni',
        dataPoints: {
          currentWeekDeaths,
          previousWeekDeaths,
          avgMortalityRate: persistentBaskets.reduce((sum, b) => sum + b.avgMortalityRate, 0) / persistentBaskets.length,
          basketsAffected: persistentBaskets.length
        }
      });
    }

    for (const problem of flupsyProblems) {
      alerts.push({
        id: `localized-${problem.flupsyId}-${todayString}`,
        severity: problem.affectedBaskets >= 5 ? 'critical' : 'warning',
        pattern: 'localized',
        title: `Problema localizzato: ${problem.flupsyName}`,
        description: `${problem.affectedBaskets} ceste con mortalità nell'ultima settimana in ${problem.flupsyName}`,
        affectedBaskets: basketStats.filter(b => b.flupsyName === problem.flupsyName).map(b => b.basketId),
        affectedFlupsys: [problem.flupsyName],
        recommendation: `Ispezionare ${problem.flupsyName} per problemi strutturali, flusso d'acqua o qualità dell'ambiente`,
        dataPoints: {
          currentWeekDeaths: problem.deaths,
          previousWeekDeaths: 0,
          avgMortalityRate: 0,
          basketsAffected: problem.affectedBaskets
        }
      });
    }

    if (isImproving && !hasMortalitySpike) {
      alerts.push({
        id: `improving-${todayString}`,
        severity: 'info',
        pattern: 'improving',
        title: 'Mortalità in miglioramento',
        description: 'La mortalità è diminuita significativamente rispetto alla settimana precedente',
        affectedBaskets: [],
        affectedFlupsys: [],
        recommendation: 'Continuare con le pratiche attuali e monitorare',
        dataPoints: {
          currentWeekDeaths,
          previousWeekDeaths,
          avgMortalityRate: 0,
          basketsAffected: 0
        }
      });
    }

    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const warningCount = alerts.filter(a => a.severity === 'warning').length;
    const infoCount = alerts.filter(a => a.severity === 'info').length;

    let overallStatus: 'critical' | 'warning' | 'healthy' = 'healthy';
    if (criticalCount > 0) overallStatus = 'critical';
    else if (warningCount > 0) overallStatus = 'warning';

    const totalMortality = basketStats.reduce((sum, b) => sum + b.totalDeaths, 0);
    const recentMortality = basketStats.reduce((sum, b) => {
      if (b.daysSinceLastMortality <= 3) return sum + b.totalDeaths;
      return sum;
    }, 0);

    console.log(`🔬 Analisi completata: ${alerts.length} alert generati, status: ${overallStatus}`);

    return {
      date: todayString,
      alerts,
      topAffectedBaskets,
      summary: {
        totalAlertsCount: alerts.length,
        criticalCount,
        warningCount,
        infoCount,
        overallStatus,
        recentMortalityPercentage: totalMortality > 0 ? Math.round((recentMortality / totalMortality) * 100) : 0
      },
      patterns: {
        hasMortalitySpike,
        hasPersistentMortality,
        hasLocalizedProblem,
        isImproving
      }
    };
  }
}
