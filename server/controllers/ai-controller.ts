import type { Express, Request, Response } from "express";
import { AIService, PredictiveGrowthData } from "../ai/ai-service";
import { db } from "../db";
import { baskets, operations, cycles, sgrGiornalieri, sizes, basketLotComposition, lots, flupsys } from "../../shared/schema";
import { eq, desc, and, gte, lte, sql, isNotNull } from "drizzle-orm";
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { 
  createFormattedWorkbook, 
  applyHeaderStyle, 
  applyDataRowStyle, 
  applyTotalRowStyle,
  applyTitleStyle,
  applySectionTitleStyle,
  applyStatusStyle,
  setColumnWidths,
  applyNumberFormat
} from '../utils/excel-formatter';

/**
 * Controller per i servizi AI
 * Gestisce le richieste API per i moduli AI integrati
 */
export function registerAIRoutes(app: Express) {
  
  // Health check AI
  app.get("/api/ai/health", async (req: Request, res: Response) => {
    try {
      const health = await AIService.healthCheck();
      res.json({ success: true, ...health });
    } catch (error) {
      console.error('Errore health check AI:', error);
      res.status(500).json({ success: false, error: 'AI service non disponibile' });
    }
  });

  // Modulo 1: Previsioni di crescita avanzate (supporta lotti misti)
  app.post("/api/ai/predictive-growth", async (req: Request, res: Response) => {
    try {
      const { flupsyId, basketIds, basketId, targetSizeId, days = 30 } = req.body;

      console.log('🤖 AI PREDICTIVE REQUEST (v2 - Mixed Lots):', { flupsyId, basketIds, basketId, targetSizeId, days });
      
      // Supporta sia analisi singola che per FLUPSY intera
      if (!flupsyId && !basketId) {
        return res.status(400).json({ success: false, error: 'flupsyId o basketId richiesto' });
      }

      let basketsToAnalyze: any[] = [];
      
      if (flupsyId) {
        // Analisi per FLUPSY intera - recupera cestelli attivi (supporta sia lotti singoli che misti)
        basketsToAnalyze = await db.select({
          basketId: baskets.id,
          physicalNumber: baskets.physicalNumber,
          flupsyId: baskets.flupsyId,
          state: baskets.state,
          cycleId: cycles.id,
          cycleLotId: cycles.lotId,
          flupsyName: flupsys.name
        })
          .from(baskets)
          .innerJoin(cycles, eq(baskets.id, cycles.basketId))
          .innerJoin(flupsys, eq(baskets.flupsyId, flupsys.id))
          .where(and(
            eq(baskets.flupsyId, flupsyId),
            eq(cycles.state, 'active')
          ));
        console.log(`🔍 Trovati ${basketsToAnalyze.length} cestelli attivi per FLUPSY ${flupsyId}`);
      } else if (basketId) {
        // Analisi per singolo cestello
        basketsToAnalyze = await db.select({
          basketId: baskets.id,
          physicalNumber: baskets.physicalNumber,
          flupsyId: baskets.flupsyId,
          state: baskets.state,
          cycleId: cycles.id,
          cycleLotId: cycles.lotId,
          flupsyName: flupsys.name
        })
          .from(baskets)
          .innerJoin(cycles, eq(baskets.id, cycles.basketId))
          .innerJoin(flupsys, eq(baskets.flupsyId, flupsys.id))
          .where(eq(baskets.id, basketId));
        console.log(`🔍 Analisi singolo cestello ${basketId}`);
      }

      if (basketsToAnalyze.length === 0) {
        return res.status(404).json({ success: false, error: 'Nessun cestello con lotti attivi trovato' });
      }

      // Analisi AI per cestelli (supporta sia lotti singoli che misti)
      const basketPredictions = [];
      for (const basket of basketsToAnalyze) {
        
        // Recupera composizione lotti: prima prova con basketLotComposition (lotti misti), poi usa il lotId del ciclo (lotto singolo)
        let lotComposition = await db.select({
          lotId: basketLotComposition.lotId,
          animalCount: basketLotComposition.animalCount,
          percentage: basketLotComposition.percentage,
          supplier: lots.supplier,
          supplierLotNumber: lots.supplierLotNumber,
          arrivalDate: lots.arrivalDate,
          totalMortality: lots.totalMortality
        })
          .from(basketLotComposition)
          .innerJoin(lots, eq(basketLotComposition.lotId, lots.id))
          .where(eq(basketLotComposition.basketId, basket.basketId));
        
        // Se non ci sono lotti misti, usa il lotto singolo dal ciclo
        if (lotComposition.length === 0 && basket.cycleLotId) {
          const singleLot = await db.select({
            id: lots.id,
            supplier: lots.supplier,
            supplierLotNumber: lots.supplierLotNumber,
            arrivalDate: lots.arrivalDate,
            totalMortality: lots.totalMortality,
            animalCount: lots.animalCount
          })
            .from(lots)
            .where(eq(lots.id, basket.cycleLotId))
            .limit(1);
          
          if (singleLot.length > 0) {
            lotComposition = [{
              lotId: singleLot[0].id,
              animalCount: singleLot[0].animalCount,
              percentage: 100,
              supplier: singleLot[0].supplier,
              supplierLotNumber: singleLot[0].supplierLotNumber,
              arrivalDate: singleLot[0].arrivalDate,
              totalMortality: singleLot[0].totalMortality
            }];
          }
        }
        
        // Calcola metriche avanzate per lotti misti
        const mixedLotMetrics = {
          isMixed: lotComposition.length > 1,
          dominantLot: lotComposition.reduce((max, lot) => 
            lot.percentage > max.percentage ? lot : max, lotComposition[0]),
          averageMortality: lotComposition.reduce((sum, lot) => 
            sum + ((lot.totalMortality || 0) * (lot.percentage / 100)), 0),
          riskLevel: lotComposition.some(lot => (lot.totalMortality || 0) > 5000) ? 'high' : 'normal'
        };
        
        console.log(`📊 Cestello ${basket.physicalNumber}: ${lotComposition.length} lotti, mortalità media: ${mixedLotMetrics.averageMortality}`);
        
        // Chiamata AI con dati potenziati
        const prediction = await AIService.predictiveGrowth(basket.basketId, targetSizeId, days, {
          mixedLots: true,
          lotComposition: lotComposition,
          mixedMetrics: mixedLotMetrics
        });
        
        basketPredictions.push({
          basketId: basket.basketId,
          basketNumber: basket.physicalNumber,
          lotCount: basket.lotCount,
          totalAnimals: basket.totalAnimals,
          isMixed: mixedLotMetrics.isMixed,
          riskLevel: mixedLotMetrics.riskLevel,
          lotComposition: lotComposition,
          prediction: prediction
        });
      }

      // Calcola summary avanzato per lotti misti
      const mixedBasketsCount = basketPredictions.filter(bp => bp.isMixed).length;
      const highRiskBasketsCount = basketPredictions.filter(bp => bp.riskLevel === 'high').length;
      const totalLots = basketPredictions.reduce((sum, bp) => sum + bp.lotCount, 0);
      const avgAnimalsPerBasket = basketPredictions.reduce((sum, bp) => sum + bp.totalAnimals, 0) / basketPredictions.length;

      // Calcola confidenza media CORRETTA: media di tutti i giorni di tutti i cestelli
      let totalConfidence = 0;
      let totalPredictions = 0;
      basketPredictions.forEach(bp => {
        if (bp.prediction?.predictions) {
          bp.prediction.predictions.forEach(pred => {
            totalConfidence += pred.confidence || 0;
            totalPredictions++;
          });
        }
      });
      const avgConfidence = totalPredictions > 0 ? totalConfidence / totalPredictions : 0;

      res.json({
        success: true,
        prediction: {
          flupsyId,
          basketPredictions,
          mixedLotsAnalysis: {
            mixedBasketsCount,
            pureBasketsCount: basketPredictions.length - mixedBasketsCount,
            highRiskBaskets: highRiskBasketsCount,
            totalLotsInvolved: totalLots,
            averageAnimalsPerBasket: Math.round(avgAnimalsPerBasket)
          },
          summary: {
            totalBaskets: basketsToAnalyze.length,
            analyzedBaskets: basketPredictions.length,
            avgGrowthRate: avgConfidence,
            insights: [
              `Analisi completata per ${basketPredictions.length} cestelli (${mixedBasketsCount} con lotti misti)`,
              `${totalLots} lotti totali coinvolti nell'analisi`,
              highRiskBasketsCount > 0 ? `⚠️ ${highRiskBasketsCount} cestelli ad alto rischio mortalità` : '✅ Tutti i cestelli a rischio normale',
              flupsyId ? `FLUPSY analizzato: ${basketsToAnalyze[0]?.flupsyName || flupsyId}` : 'Analisi singola'
            ],
            recommendations: [
              'Monitoraggio continuo raccomandato, specialmente per lotti misti',
              mixedBasketsCount > 0 ? 'Considera consolidamento lotti per ridurre complessità' : 'Distribuzione lotti ottimale',
              highRiskBasketsCount > 0 ? 'Priorità interventi per cestelli alto rischio' : 'Continua gestione standard',
              'Traccia evoluzione lotti attraverso operazioni di vagliatura'
            ]
          }
        },
        metadata: {
          flupsyId,
          basketIds: basketsToAnalyze.map(b => b.basketId),
          targetSizeId,
          days,
          provider: 'deepseek_ai_v2_mixed_lots',
          analysisVersion: '2.0',
          supportsMixedLots: true
        }
      });

    } catch (error) {
      console.error('Errore previsioni crescita AI:', error);
      res.status(500).json({ success: false, error: 'Errore elaborazione AI' });
    }
  });

  // Modulo 1: Ottimizzazione posizioni cestelli
  app.post("/api/ai/optimize-positions", async (req: Request, res: Response) => {
    try {
      const { flupsyId } = req.body;

      if (!flupsyId) {
        return res.status(400).json({ success: false, error: 'flupsyId richiesto' });
      }

      // Recupera cestelli del FLUPSY con dati recenti
      const flupsyBaskets = await db.select({
        basketId: baskets.id,
        physicalNumber: baskets.physicalNumber,
        row: baskets.row,
        position: baskets.position,
        currentCycleId: baskets.currentCycleId
      })
      .from(baskets)
      .where(eq(baskets.flupsyId, flupsyId));

      // Per ogni cestello, recupera operazione più recente
      const basketsWithData = await Promise.all(
        flupsyBaskets.map(async (basket) => {
          const lastOp = await db.select()
            .from(operations)
            .where(eq(operations.basketId, basket.basketId))
            .orderBy(desc(operations.date))
            .limit(1);

          // Dati ambientali simulati per zona (in futuro da sensori reali)
          const environmentalData = {
            temperature: 18 + Math.random() * 4, // 18-22°C
            ph: 7.8 + Math.random() * 0.4, // 7.8-8.2
            oxygen: 6 + Math.random() * 2, // 6-8 mg/L
            salinity: 32 + Math.random() * 3, // 32-35 ppt
          };

          return {
            basketId: basket.basketId,
            currentPosition: { row: basket.row, position: basket.position },
            growthData: {
              basketId: basket.basketId,
              currentWeight: lastOp[0]?.totalWeight || 0,
              currentAnimalsPerKg: lastOp[0]?.animalsPerKg || 0,
              environmentalData,
              historicalGrowth: []
            }
          };
        })
      );

      // Zone ambientali simulate (in futuro da sensori IoT)
      const environmentalZones = [
        { zone: 'DX-alta', conditions: { flow: 'alto', light: 'medio', temperature: 19.5 } },
        { zone: 'DX-bassa', conditions: { flow: 'medio', light: 'alto', temperature: 20.0 } },
        { zone: 'SX-alta', conditions: { flow: 'medio', light: 'basso', temperature: 19.0 } },
        { zone: 'SX-bassa', conditions: { flow: 'basso', light: 'medio', temperature: 19.8 } }
      ];

      const optimization = await AIService.predictiveGrowth.optimizeBasketPositions({
        flupsyId,
        baskets: basketsWithData,
        environmentalZones
      });

      res.json({
        success: true,
        optimization,
        metadata: {
          flupsyId,
          analyzedBaskets: basketsWithData.length,
          environmentalZones: environmentalZones.length
        }
      });

    } catch (error) {
      console.error('Errore ottimizzazione posizioni AI:', error);
      res.status(500).json({ success: false, error: 'Errore elaborazione AI' });
    }
  });

  // Modulo 3: Rilevamento anomalie (supporta lotti misti)
  app.get("/api/ai/anomaly-detection", async (req: Request, res: Response) => {
    try {
      const { flupsyId, days = 7 } = req.query;

      console.log('🔍 AI ANOMALY DETECTION (v2 - Mixed Lots):', { flupsyId, days });

      // Data limite per operazioni recenti
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - Number(days));
      
      // Query operations con dati composizione lotti
      let operationsQuery = db.select({
        operationId: operations.id,
        date: operations.date,
        type: operations.type,
        basketId: operations.basketId,
        basketPhysical: baskets.physicalNumber,
        cycleId: operations.cycleId,
        animalCount: operations.animalCount,
        totalWeight: operations.totalWeight,
        averageWeight: operations.averageWeight,
        deadCount: operations.deadCount,
        mortalityRate: operations.mortalityRate,
        flupsyId: baskets.flupsyId,
        flupsyName: flupsys.name,
        // Dati composizione lotto
        lotId: basketLotComposition.lotId,
        lotPercentage: basketLotComposition.percentage,
        lotAnimalCount: basketLotComposition.animalCount,
        supplier: lots.supplier,
        supplierLotNumber: lots.supplierLotNumber,
        lotTotalMortality: lots.totalMortality
      })
      .from(operations)
      .innerJoin(baskets, eq(operations.basketId, baskets.id))
      .innerJoin(flupsys, eq(baskets.flupsyId, flupsys.id))
      .innerJoin(cycles, eq(operations.cycleId, cycles.id))
      .leftJoin(basketLotComposition, eq(cycles.id, basketLotComposition.cycleId))
      .leftJoin(lots, eq(basketLotComposition.lotId, lots.id))
      .where(gte(operations.date, dateLimit.toISOString().split('T')[0]));

      if (flupsyId && flupsyId !== 'undefined' && flupsyId !== 'null') {
        operationsQuery = operationsQuery.where(
          and(
            eq(baskets.flupsyId, Number(flupsyId)),
            gte(operations.date, dateLimit.toISOString().split('T')[0])
          )
        );
      }

      const recentOperations = await operationsQuery.limit(200);

      console.log(`🔍 Analizzando ${recentOperations.length} operazioni con composizione lotti`);

      // Raggruppa operazioni per cestello per analisi lotti misti
      const basketOperations = recentOperations.reduce((acc, op) => {
        if (!acc[op.basketId]) {
          acc[op.basketId] = {
            basketId: op.basketId,
            basketPhysical: op.basketPhysical,
            flupsyName: op.flupsyName,
            operations: [],
            lots: new Set(),
            totalMortality: 0,
            averageMortality: 0,
            isMixed: false
          };
        }
        acc[op.basketId].operations.push(op);
        if (op.lotId) acc[op.basketId].lots.add(op.lotId);
        if (op.mortalityRate) acc[op.basketId].totalMortality += op.mortalityRate;
        return acc;
      }, {} as Record<number, any>);

      // Calcola metriche anomalie per lotti misti
      const basketAnalysis = Object.values(basketOperations).map((basket: any) => {
        const mortalityOperations = basket.operations.filter((op: any) => op.mortalityRate > 0);
        basket.averageMortality = mortalityOperations.length > 0 ? 
          basket.totalMortality / mortalityOperations.length : 0;
        basket.isMixed = basket.lots.size > 1;
        
        // Identifica anomalie specifiche lotti misti
        const anomalies = [];
        
        if (basket.averageMortality > 15) {
          anomalies.push({
            type: 'high_mortality',
            severity: 'critical',
            description: `Mortalità critica: ${basket.averageMortality.toFixed(1)}%`,
            mixedLotImpact: basket.isMixed ? 'Possibile incompatibilità tra lotti' : 'Lotto singolo'
          });
        }
        
        if (basket.isMixed && basket.lots.size > 3) {
          anomalies.push({
            type: 'excessive_fragmentation',
            severity: 'medium',
            description: `Eccessiva frammentazione: ${basket.lots.size} lotti diversi`,
            mixedLotImpact: 'Gestione complessa, rischio errori operativi'
          });
        }

        return { ...basket, anomalies };
      });

      // Prepara dati per analisi AI
      const anomaliesData = {
        operations: recentOperations.slice(0, 50),
        basketAnalysis: basketAnalysis.slice(0, 20),
        mixedLotsMetrics: {
          totalBaskets: basketAnalysis.length,
          mixedBaskets: basketAnalysis.filter(b => b.isMixed).length,
          averageLotFragmentation: basketAnalysis.reduce((sum, b) => sum + b.lots.size, 0) / basketAnalysis.length,
          criticalBaskets: basketAnalysis.filter(b => b.anomalies.some((a: any) => a.severity === 'critical')).length
        },
        timeframe: `${days} giorni`,
        flupsyId: flupsyId || 'tutti'
      };

      const anomalyAnalysis = await AIService.detectAnomalies(anomaliesData);

      res.json({
        success: true,
        anomalies: anomalyAnalysis,
        basketAnalysis: basketAnalysis,
        mixedLotsInsights: {
          totalBaskets: basketAnalysis.length,
          mixedBasketsPercentage: Math.round((basketAnalysis.filter(b => b.isMixed).length / basketAnalysis.length) * 100),
          averageLotsPerBasket: anomaliesData.mixedLotsMetrics.averageLotFragmentation.toFixed(1),
          criticalAnomalies: basketAnalysis.filter(b => b.anomalies.some((a: any) => a.severity === 'critical')).length
        },
        metadata: {
          timeframe: `${days} giorni`,
          totalOperations: recentOperations.length,
          flupsyId: flupsyId || 'tutti',
          provider: 'deepseek_ai_v2_mixed_lots',
          analysisVersion: '2.0',
          supportsMixedLots: true
        }
      });

    } catch (error) {
      console.error('❌ Errore rilevamento anomalie AI:', error);
      res.status(500).json({ success: false, error: 'Errore elaborazione AI' });
    }
  });

  // Modulo 3: Analisi business intelligence (supporta lotti misti)
  app.get("/api/ai/business-analytics", async (req: Request, res: Response) => {
    try {
      const { timeframe = '30' } = req.query;
      const days = Number(timeframe);
      
      console.log('💼 AI BUSINESS ANALYTICS (v2 - Mixed Lots):', { days });
      
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);

      // Query operazioni con composizione lotti per business analytics accurate
      const recentOperations = await db.select({
        operationId: operations.id,
        date: operations.date,
        type: operations.type,
        basketId: operations.basketId,
        basketPhysical: baskets.physicalNumber,
        cycleId: operations.cycleId,
        animalCount: operations.animalCount,
        totalWeight: operations.totalWeight,
        averageWeight: operations.averageWeight,
        flupsyId: baskets.flupsyId,
        flupsyName: flupsys.name,
        // Dati lotti per analisi business
        lotId: basketLotComposition.lotId,
        lotPercentage: basketLotComposition.percentage,
        lotAnimalCount: basketLotComposition.animalCount,
        supplier: lots.supplier,
        supplierLotNumber: lots.supplierLotNumber,
        lotArrivalDate: lots.arrivalDate
      })
      .from(operations)
      .innerJoin(baskets, eq(operations.basketId, baskets.id))
      .innerJoin(flupsys, eq(baskets.flupsyId, flupsys.id))
      .innerJoin(cycles, eq(operations.cycleId, cycles.id))
      .leftJoin(basketLotComposition, eq(cycles.id, basketLotComposition.cycleId))
      .leftJoin(lots, eq(basketLotComposition.lotId, lots.id))
      .where(gte(operations.date, dateLimit.toISOString().split('T')[0]))
      .orderBy(desc(operations.date))
      .limit(100);

      const recentCycles = await db.select()
        .from(cycles)
        .where(gte(cycles.startDate, dateLimit.toISOString().split('T')[0]))
        .limit(50);

      console.log(`💼 Analizzando ${recentOperations.length} operazioni con ${recentCycles.length} cicli per business analytics`);

      // Calcola metriche business avanzate per lotti misti
      const businessMetrics = {
        production: {
          totalKgProduced: recentOperations.reduce((sum, op) => sum + ((op.totalWeight || 0) / 1000), 0),
          totalOperations: recentOperations.length,
          uniqueLots: new Set(recentOperations.filter(op => op.lotId).map(op => op.lotId)).size,
          activeCycles: recentCycles.length,
          productionPerCycle: recentCycles.length > 0 ? 
            recentOperations.reduce((sum, op) => sum + ((op.totalWeight || 0) / 1000), 0) / recentCycles.length : 0
        },
        efficiency: {
          avgLotUtilization: 0, // Calcolato di seguito
          mixedLotAdvantage: 0, // Calcolato di seguito
          supplierDiversification: new Set(recentOperations.filter(op => op.supplier).map(op => op.supplier)).size
        },
        financial: {
          estimatedRevenue: 0, // Calcolato di seguito
          revenuePerLot: 0,
          costEfficiency: 0
        }
      };

      // Simula calcoli finanziari basati su performance lotti misti
      const totalProduction = businessMetrics.production.totalKgProduced;
      const avgPricePerKg = 15; // €15/kg stimato
      businessMetrics.financial.estimatedRevenue = totalProduction * avgPricePerKg;
      businessMetrics.financial.revenuePerLot = businessMetrics.production.uniqueLots > 0 ? 
        businessMetrics.financial.estimatedRevenue / businessMetrics.production.uniqueLots : 0;

      // Calcola efficienza lotti misti
      const lotPerformance = recentOperations.reduce((acc, op) => {
        if (!op.lotId) return acc;
        if (!acc[op.lotId]) {
          acc[op.lotId] = { totalWeight: 0, operations: 0, baskets: new Set() };
        }
        acc[op.lotId].totalWeight += (op.totalWeight || 0) / 1000;
        acc[op.lotId].operations += 1;
        acc[op.lotId].baskets.add(op.basketId);
        return acc;
      }, {} as Record<number, any>);

      businessMetrics.efficiency.avgLotUtilization = Object.values(lotPerformance).length > 0 ?
        Object.values(lotPerformance).reduce((sum: number, lot: any) => sum + lot.baskets.size, 0) / Object.values(lotPerformance).length : 0;

      businessMetrics.efficiency.mixedLotAdvantage = businessMetrics.efficiency.avgLotUtilization > 1 ? 
        (businessMetrics.efficiency.avgLotUtilization - 1) * 10 : 0; // % vantaggio

      // Simula dati vendite per lotti misti
      const salesData = recentOperations
        .filter(op => op.type === 'vendita' || op.type === 'raccolta-finale')
        .map(op => ({
          date: op.date.toString(),
          amount: (op.totalWeight || 0) * avgPricePerKg / 1000, // Euro
          quantity: (op.totalWeight || 0) / 1000, // kg
          price: avgPricePerKg,
          lotId: op.lotId,
          supplier: op.supplier
        }));

      const businessData = {
        operations: recentOperations.slice(0, 30),
        cycles: recentCycles.slice(0, 20),
        salesData: salesData,
        mixedLotsMetrics: businessMetrics,
        lotPerformance: Object.entries(lotPerformance).slice(0, 10).map(([lotId, perf]: [string, any]) => ({
          lotId: parseInt(lotId),
          performance: perf,
          revenue: perf.totalWeight * avgPricePerKg,
          efficiency: perf.totalWeight / perf.operations
        }))
      };

      const businessAnalysis = await AIService.businessAnalytics(days, businessData);

      res.json({
        success: true,
        analysis: businessAnalysis,
        businessMetrics: businessMetrics,
        businessInsights: {
          totalRevenueEstimate: Math.round(businessMetrics.financial.estimatedRevenue),
          productionEfficiency: Math.round(businessMetrics.production.productionPerCycle * 100) / 100,
          lotDiversification: businessMetrics.production.uniqueLots,
          mixedLotAdvantage: Math.round(businessMetrics.efficiency.mixedLotAdvantage * 10) / 10,
          supplierReliance: Math.round((1 / businessMetrics.efficiency.supplierDiversification) * 100)
        },
        metadata: {
          timeframe: `${days} giorni`,
          provider: 'deepseek_ai_v2_mixed_lots',
          analysisVersion: '2.0',
          supportsMixedLots: true
        }
      });

    } catch (error) {
      console.error('❌ Errore business analytics AI:', error);
      res.status(500).json({ success: false, error: 'Errore elaborazione AI' });
    }
  });

  // Modulo 8: Analisi sostenibilità (supporta lotti misti)
  app.get("/api/ai/sustainability", async (req: Request, res: Response) => {
    try {
      const { flupsyId, timeframe = '30' } = req.query;
      const days = Number(timeframe);
      
      console.log('🌱 AI SUSTAINABILITY ANALYSIS (v2 - Mixed Lots):', { flupsyId, days });
      
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);

      // Query operations con composizione lotti per calcoli precisi
      let operationsQuery = db.select({
        operationId: operations.id,
        date: operations.date,
        type: operations.type,
        basketId: operations.basketId,
        basketPhysical: baskets.physicalNumber,
        cycleId: operations.cycleId,
        animalCount: operations.animalCount,
        totalWeight: operations.totalWeight,
        averageWeight: operations.averageWeight,
        flupsyId: baskets.flupsyId,
        flupsyName: flupsys.name,
        // Composizione lotti per calcoli sostenibilità accurati
        lotId: basketLotComposition.lotId,
        lotPercentage: basketLotComposition.percentage,
        lotAnimalCount: basketLotComposition.animalCount,
        supplier: lots.supplier,
        supplierLotNumber: lots.supplierLotNumber,
        supplierDistance: sql<number>`CASE 
          WHEN ${lots.supplier} = 'Ecotapes Zeeland' THEN 800
          WHEN ${lots.supplier} = 'Roem' THEN 600 
          WHEN ${lots.supplier} = 'Taylor Shellfish' THEN 8500
          ELSE 1000 END`, // km stimati per carbon footprint
        lotArrivalDate: lots.arrivalDate
      })
      .from(operations)
      .innerJoin(baskets, eq(operations.basketId, baskets.id))
      .innerJoin(flupsys, eq(baskets.flupsyId, flupsys.id))
      .innerJoin(cycles, eq(operations.cycleId, cycles.id))
      .leftJoin(basketLotComposition, eq(cycles.id, basketLotComposition.cycleId))
      .leftJoin(lots, eq(basketLotComposition.lotId, lots.id))
      .where(gte(operations.date, dateLimit.toISOString().split('T')[0]));

      if (flupsyId && flupsyId !== 'undefined' && flupsyId !== 'null') {
        operationsQuery = operationsQuery.where(
          and(
            eq(baskets.flupsyId, Number(flupsyId)),
            gte(operations.date, dateLimit.toISOString().split('T')[0])
          )
        );
      }

      const sustainabilityOps = await operationsQuery.limit(100);

      console.log(`🌱 Analizzando ${sustainabilityOps.length} operazioni con composizione lotti per sostenibilità`);

      // Calcola metriche sostenibilità avanzate per lotti misti
      const sustainabilityMetrics = {
        production: {
          totalKgProduced: sustainabilityOps.reduce((sum, op) => sum + ((op.totalWeight || 0) / 1000), 0),
          totalOperations: sustainabilityOps.length,
          uniqueBaskets: new Set(sustainabilityOps.map(op => op.basketId)).size,
          uniqueLots: new Set(sustainabilityOps.filter(op => op.lotId).map(op => op.lotId)).size
        },
        transport: {
          avgSupplierDistance: sustainabilityOps.length > 0 ? 
            sustainabilityOps.reduce((sum, op) => sum + (op.supplierDistance || 0), 0) / sustainabilityOps.length : 0,
          carbonFootprintKg: 0, // Calcolato di seguito
          supplierDiversity: new Set(sustainabilityOps.filter(op => op.supplier).map(op => op.supplier)).size
        },
        efficiency: {
          mixedLotComplexity: 0, // Calcolato di seguito
          operationsPerBasket: sustainabilityOps.length > 0 ? 
            sustainabilityOps.length / new Set(sustainabilityOps.map(op => op.basketId)).size : 0,
          avgLotFragmentation: 0 // Calcolato di seguito
        }
      };

      // Calcola carbon footprint basato su distanza fornitori pesata per quantità
      let totalWeightedDistance = 0;
      let totalWeight = 0;
      sustainabilityOps.forEach(op => {
        if (op.totalWeight && op.supplierDistance) {
          totalWeightedDistance += (op.totalWeight / 1000) * op.supplierDistance;
          totalWeight += (op.totalWeight / 1000);
        }
      });
      
      sustainabilityMetrics.transport.carbonFootprintKg = totalWeight > 0 ? 
        (totalWeightedDistance * 0.2) / totalWeight : 0; // 0.2 kg CO2 per km*kg stimato

      // Raggruppa per cestello per calcolare complessità lotti misti
      const basketComplexity = sustainabilityOps.reduce((acc, op) => {
        if (!acc[op.basketId]) {
          acc[op.basketId] = new Set();
        }
        if (op.lotId) acc[op.basketId].add(op.lotId);
        return acc;
      }, {} as Record<number, Set<number>>);

      sustainabilityMetrics.efficiency.mixedLotComplexity = Object.values(basketComplexity).length > 0 ?
        Object.values(basketComplexity).reduce((sum, lotSet) => sum + lotSet.size, 0) / Object.values(basketComplexity).length : 0;

      sustainabilityMetrics.efficiency.avgLotFragmentation = sustainabilityMetrics.efficiency.mixedLotComplexity;

      // Recupera dati ambientali
      const environmentalData = await db.select()
        .from(sgrGiornalieri)
        .where(gte(sgrGiornalieri.recordDate, dateLimit))
        .limit(days);

      const sustainabilityData = {
        operations: sustainabilityOps.slice(0, 20), // Limita per AI
        environmentalData: environmentalData.map(env => ({
          date: env.recordDate?.toISOString(),
          temperature: env.temperature,
          ph: env.pH,
          oxygen: env.oxygen,
          salinity: env.salinity
        })),
        mixedLotsMetrics: sustainabilityMetrics,
        insights: {
          isMixedLotSystem: sustainabilityMetrics.production.uniqueLots > sustainabilityMetrics.production.uniqueBaskets,
          complexityLevel: sustainabilityMetrics.efficiency.avgLotFragmentation > 2 ? 'high' : 
                         sustainabilityMetrics.efficiency.avgLotFragmentation > 1.5 ? 'medium' : 'low',
          supplierConcentration: sustainabilityMetrics.transport.supplierDiversity < 3 ? 'concentrated' : 'diversified',
          carbonEfficiencyClass: sustainabilityMetrics.transport.carbonFootprintKg < 50 ? 'A' :
                                sustainabilityMetrics.transport.carbonFootprintKg < 100 ? 'B' : 
                                sustainabilityMetrics.transport.carbonFootprintKg < 200 ? 'C' : 'D'
        }
      };

      const sustainabilityAnalysis = await AIService.sustainabilityAnalysis(flupsyId ? Number(flupsyId) : undefined, days, sustainabilityData);

      res.json({
        success: true,
        analysis: sustainabilityAnalysis,
        mixedLotsMetrics: sustainabilityMetrics,
        sustainabilityInsights: {
          productionEfficiency: Math.round(sustainabilityMetrics.production.totalKgProduced / sustainabilityMetrics.production.totalOperations * 100) / 100,
          carbonIntensity: Math.round(sustainabilityMetrics.transport.carbonFootprintKg * 100) / 100,
          operationalComplexity: Math.round(sustainabilityMetrics.efficiency.avgLotFragmentation * 10) / 10,
          supplierDiversity: sustainabilityMetrics.transport.supplierDiversity,
          sustainabilityScore: Math.max(0, 100 - (sustainabilityMetrics.transport.carbonFootprintKg / 2) - (sustainabilityMetrics.efficiency.avgLotFragmentation * 5))
        },
        metadata: {
          timeframe: `${days} giorni`,
          flupsyId: flupsyId || 'tutti',
          provider: 'deepseek_ai_v2_mixed_lots',
          analysisVersion: '2.0',
          supportsMixedLots: true
        }
      });

    } catch (error) {
      console.error('Errore analisi sostenibilità AI:', error);
      res.status(500).json({ success: false, error: 'Errore elaborazione AI' });
    }
  });

  // Modulo 8: Verifica compliance
  app.get("/api/ai/compliance", async (req: Request, res: Response) => {
    try {
      const { timeframe = '30' } = req.query;
      const days = Number(timeframe);
      
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);

      // Recupera operazioni recenti per verifica compliance
      const recentOperations = await db.select()
        .from(operations)
        .where(gte(operations.date, dateLimit.toISOString().split('T')[0]))
        .limit(50);

      // Recupera dati ambientali per compliance
      const environmentalReadings = await db.select()
        .from(sgrGiornalieri)
        .where(gte(sgrGiornalieri.recordDate, dateLimit))
        .limit(days);

      // Certificazioni e normative simulate (in futuro da database dedicato)
      const certifications = [
        'Biologico EU',
        'Acquacoltura Sostenibile ASC',
        'Global G.A.P.'
      ];

      const regulations = [
        'Reg. EU 848/2018 (Biologico)',
        'Reg. EU 1379/2013 (Mercato ittico)',
        'D.Lgs 148/2008 (Benessere animale)',
        'Normativa regionale acquacoltura'
      ];

      const complianceData = {
        operations: recentOperations.slice(0, 15),
        environmentalReadings: environmentalReadings.map(reading => ({
          date: reading.recordDate?.toISOString(),
          temperature: reading.temperature,
          ph: reading.pH,
          oxygen: reading.oxygen,
          ammonia: reading.ammonia,
          salinity: reading.salinity
        })),
        certifications,
        regulations
      };

      const complianceAnalysis = await AIService.sustainability.checkCompliance(complianceData);

      res.json({
        success: true,
        compliance: complianceAnalysis,
        metadata: {
          timeframe: `${days} giorni`,
          operationsChecked: recentOperations.length,
          environmentalReadings: environmentalReadings.length,
          certificationsMonitored: certifications.length,
          regulationsChecked: regulations.length
        }
      });

    } catch (error) {
      console.error('Errore verifica compliance AI:', error);
      res.status(500).json({ success: false, error: 'Errore elaborazione AI' });
    }
  });

  // Modulo: Attività Consigliate AI
  app.get("/api/ai/recommended-activities", async (req: Request, res: Response) => {
    try {
      const { flupsyId } = req.query;
      const { RecommendedActivitiesService } = await import('../ai/recommended-activities-service');
      
      const activities = await RecommendedActivitiesService.getRecommendedActivities(
        flupsyId ? parseInt(flupsyId as string) : undefined
      );
      
      res.json({ success: true, ...activities });
    } catch (error) {
      console.error('Errore attività consigliate AI:', error);
      res.status(500).json({ success: false, error: 'Errore elaborazione attività consigliate' });
    }
  });

  // Modulo: Analisi Pattern Mortalità con Alert Anomalie
  app.get("/api/ai/mortality-analysis", async (req: Request, res: Response) => {
    try {
      const { flupsyId } = req.query;
      const { MortalityAnalysisService } = await import('../ai/mortality-analysis-service');
      
      const analysis = await MortalityAnalysisService.analyzePatterns(
        flupsyId ? parseInt(flupsyId as string) : undefined
      );
      
      res.json({ success: true, ...analysis });
    } catch (error) {
      console.error('Errore analisi mortalità AI:', error);
      res.status(500).json({ success: false, error: 'Errore elaborazione analisi mortalità' });
    }
  });

  // Modulo: Analisi Scostamenti Produzione
  app.get("/api/ai/production-forecast", async (req: Request, res: Response) => {
    try {
      const { year, mortalityT1, mortalityT3, mortalityT10 } = req.query;
      const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
      
      const mortalityRates = {
        T1: mortalityT1 ? parseFloat(mortalityT1 as string) / 100 : 0.05,
        T3: mortalityT3 ? parseFloat(mortalityT3 as string) / 100 : 0.03,
        T10: mortalityT10 ? parseFloat(mortalityT10 as string) / 100 : 0.02
      };
      
      const { productionForecastService } = await import('../ai/production-forecast-service');
      const forecast = await productionForecastService.calculateForecast(targetYear, mortalityRates);
      
      res.json({ success: true, ...forecast });
    } catch (error) {
      console.error('Errore forecast produzione AI:', error);
      res.status(500).json({ success: false, error: 'Errore elaborazione forecast produzione' });
    }
  });

  // GET targets per anno
  app.get("/api/ai/production-targets", async (req: Request, res: Response) => {
    try {
      const { year } = req.query;
      const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
      
      const { productionForecastService } = await import('../ai/production-forecast-service');
      const targets = await productionForecastService.getProductionTargets(targetYear);
      
      res.json({ success: true, targets });
    } catch (error) {
      console.error('Errore recupero targets:', error);
      res.status(500).json({ success: false, error: 'Errore recupero targets' });
    }
  });

  // Diagnostica ordini - verifica date e distribuzione per taglia
  app.get("/api/ai/orders-diagnostic", async (req: Request, res: Response) => {
    try {
      const { productionForecastService } = await import('../ai/production-forecast-service');
      const diagnostic = await productionForecastService.getOrdersDiagnostic();
      res.json({ success: true, ...diagnostic });
    } catch (error) {
      console.error('Errore diagnostica ordini:', error);
      res.status(500).json({ success: false, error: 'Errore diagnostica ordini' });
    }
  });

  // POST/PUT target singolo
  app.post("/api/ai/production-targets", async (req: Request, res: Response) => {
    try {
      const { year, month, sizeCategory, targetAnimals, targetWeight, notes } = req.body;
      
      if (!year || !month || !sizeCategory || !targetAnimals) {
        return res.status(400).json({ success: false, error: 'Campi obbligatori mancanti' });
      }
      
      const { productionForecastService } = await import('../ai/production-forecast-service');
      await productionForecastService.upsertTarget({
        year,
        month,
        sizeCategory,
        targetAnimals,
        targetWeight,
        notes
      });
      
      res.json({ success: true, message: 'Target aggiornato' });
    } catch (error) {
      console.error('Errore aggiornamento target:', error);
      res.status(500).json({ success: false, error: 'Errore aggiornamento target' });
    }
  });

  // Export Excel Semplice formattato
  app.get("/api/ai/production-forecast/export-simple", async (req: Request, res: Response) => {
    try {
      const { year, mortalityT1, mortalityT3, mortalityT10, category } = req.query;
      const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
      
      const mortalityRates = {
        T1: mortalityT1 ? parseFloat(mortalityT1 as string) / 100 : 0.05,
        T3: mortalityT3 ? parseFloat(mortalityT3 as string) / 100 : 0.03,
        T10: mortalityT10 ? parseFloat(mortalityT10 as string) / 100 : 0.02
      };
      
      const { productionForecastService } = await import('../ai/production-forecast-service');
      const forecast = await productionForecastService.calculateForecast(targetYear, mortalityRates);
      
      let monthlyData = forecast.monthlyData || [];
      const ordersAbsoluteBySize = forecast.ordersAbsoluteBySize || {};
      const absoluteBySizeRecord = ordersAbsoluteBySize as Record<string, number>;
      
      if (category && category !== 'all') {
        monthlyData = monthlyData.filter((m: any) => m.sizeCategory === category);
      }
      
      const ordersAbsoluteFiltered = category && category !== 'all'
        ? (absoluteBySizeRecord[category as string] || 0)
        : Object.values(absoluteBySizeRecord).reduce((sum, v) => sum + v, 0);
      
      const workbook = createFormattedWorkbook();
      const ws = workbook.addWorksheet('Scostamenti Produzione');
      
      const headers = ['Mese', 'Taglia', 'Giacenza', 'Budget', 'Ordini', 'Produzione', 
                       'Δ vs Budget', 'Δ vs Ordini', 'Stock', 'Semina T1', 'Mese Semina', 'Stato'];
      setColumnWidths(ws, [15, 12, 15, 15, 15, 15, 15, 15, 15, 15, 15, 22]);
      
      const titleRow = ws.addRow([`Analisi Scostamenti Produzione ${targetYear}`]);
      applyTitleStyle(titleRow);
      ws.mergeCells(1, 1, 1, headers.length);
      
      ws.addRow([`Generato il ${new Date().toLocaleDateString('it-IT')} - Mortalità T1: ${mortalityRates.T1*100}%, T3: ${mortalityRates.T3*100}%, T10: ${mortalityRates.T10*100}%`]);
      ws.getRow(2).getCell(1).font = { italic: true, size: 10, color: { argb: '666666' } };
      ws.mergeCells(2, 1, 2, headers.length);
      
      ws.addRow([]);
      
      const headerRow = ws.addRow(headers);
      applyHeaderStyle(headerRow);
      
      const statusColIndex = 11;
      monthlyData.forEach((row: any, index: number) => {
        const rowData = [
          row.monthName,
          row.sizeCategory,
          row.giacenzaInizioMese,
          row.budgetAnimals,
          row.ordersAnimals || 0,
          row.productionForecast,
          row.varianceBudgetProduction,
          row.varianceOrdersProduction || 0,
          row.stockResiduo,
          row.seminaT1Richiesta || 0,
          row.meseSeminaT1 || '-',
          row.statusDescription || (row.status === 'on_track' ? 'Coperto' : row.status === 'warning' ? 'Attenzione' : 'Critico')
        ];
        const excelRow = ws.addRow(rowData);
        applyDataRowStyle(excelRow, index % 2 === 1);
        
        applyStatusStyle(excelRow.getCell(statusColIndex + 1), String(rowData[statusColIndex]));
        
        for (let col = 3; col <= 10; col++) {
          if (typeof rowData[col - 1] === 'number') {
            applyNumberFormat(excelRow.getCell(col));
          }
        }
      });
      
      const totals = [
        'TOTALE',
        '-',
        '-',
        monthlyData.reduce((sum: number, r: any) => sum + r.budgetAnimals, 0),
        ordersAbsoluteFiltered,
        monthlyData.reduce((sum: number, r: any) => sum + r.productionForecast, 0),
        monthlyData.reduce((sum: number, r: any) => sum + r.varianceBudgetProduction, 0),
        monthlyData.reduce((sum: number, r: any) => sum + r.varianceOrdersProduction, 0),
        '-',
        monthlyData.reduce((sum: number, r: any) => sum + r.seminaT1Richiesta, 0),
        '-',
        '-'
      ];
      const totalRow = ws.addRow(totals);
      applyTotalRowStyle(totalRow);
      for (let col = 4; col <= 10; col++) {
        if (typeof totals[col - 1] === 'number') {
          applyNumberFormat(totalRow.getCell(col));
        }
      }
      
      // FOGLIO 2: Ordini per Taglia Specifica
      const ws2 = workbook.addWorksheet('Ordini per Taglia');
      setColumnWidths(ws2, [15, 20, 15, 20]);
      
      // Calcola totale assoluto ordini per il foglio 2
      const totalOrdersAbsolute = Object.values(absoluteBySizeRecord).reduce((sum, v) => sum + v, 0);
      
      const title2 = ws2.addRow([`Ordini Assoluti per Taglia Specifica - Totale: ${(totalOrdersAbsolute / 1000000).toFixed(1)}M`]);
      applyTitleStyle(title2);
      ws2.mergeCells(1, 1, 1, 4);
      
      ws2.addRow([`Generato il ${new Date().toLocaleDateString('it-IT')}`]);
      ws2.getRow(2).getCell(1).font = { italic: true, size: 10, color: { argb: '666666' } };
      ws2.mergeCells(2, 1, 2, 4);
      
      ws2.addRow([]);
      
      const header2 = ws2.addRow(['Taglia', 'Ordini Totali', 'Categoria', '% sul Totale']);
      applyHeaderStyle(header2);
      
      const sortedSizes = Object.keys(ordersAbsoluteBySize)
        .filter(s => (ordersAbsoluteBySize as Record<string, number>)[s] > 0)
        .sort((a, b) => {
          const numA = parseInt(a.replace(/\D/g, '')) || 0;
          const numB = parseInt(b.replace(/\D/g, '')) || 0;
          return numA - numB;
        });
      
      sortedSizes.forEach((size, index) => {
        const value = (ordersAbsoluteBySize as Record<string, number>)[size] || 0;
        const isT3 = size.includes('2000') || size.includes('3000') || size.includes('3500');
        const percentage = totalOrdersAbsolute > 0 ? ((value / totalOrdersAbsolute) * 100).toFixed(1) : '0';
        const row = ws2.addRow([size, value, isT3 ? 'T3' : 'T10', `${percentage}%`]);
        applyDataRowStyle(row, index % 2 === 1);
        applyNumberFormat(row.getCell(2));
      });
      
      const totalRow2 = ws2.addRow(['TOTALE', totalOrdersAbsolute, '-', '100%']);
      applyTotalRowStyle(totalRow2);
      applyNumberFormat(totalRow2.getCell(2));
      
      const buffer = await workbook.xlsx.writeBuffer();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Scostamenti_Produzione_${targetYear}.xlsx`);
      res.send(Buffer.from(buffer));
      
    } catch (error) {
      console.error('Errore export semplice:', error);
      res.status(500).json({ success: false, error: 'Errore generazione export' });
    }
  });

  // Export Excel Analitico con tutti i calcoli commentati
  app.get("/api/ai/production-forecast/export-analytical", async (req: Request, res: Response) => {
    try {
      const { year, mortalityT1, mortalityT3, mortalityT10 } = req.query;
      const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
      
      const mortalityRates = {
        T1: mortalityT1 ? parseFloat(mortalityT1 as string) / 100 : 0.05,
        T3: mortalityT3 ? parseFloat(mortalityT3 as string) / 100 : 0.03,
        T10: mortalityT10 ? parseFloat(mortalityT10 as string) / 100 : 0.02
      };
      
      const { productionForecastService } = await import('../ai/production-forecast-service');
      
      // Recupera forecast principale (include ordersAbsoluteBySize)
      const forecast = await productionForecastService.calculateForecast(targetYear, mortalityRates);
      const ordersAbsoluteBySize = forecast.ordersAbsoluteBySize || {};
      const totalOrdersAbsolute = Object.values(ordersAbsoluteBySize as Record<string, number>).reduce((sum, v) => sum + v, 0);
      
      const targets = await productionForecastService.getProductionTargets(targetYear);
      const sgrRates = await productionForecastService.getSgrRates();
      const inventoryByCategory = await productionForecastService.getTotalInventoryByCategory();
      const ordersBySpecificSize = forecast.ordersBySpecificSize || [];
      
      const MONTH_NAMES = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
      
      // FOGLIO 1: PARAMETRI E INVENTARIO INIZIALE
      const parametriData: any[] = [
        ['REPORT ANALITICO SCOSTAMENTI PRODUZIONE'],
        [''],
        ['=== PARAMETRI UTILIZZATI ==='],
        ['Parametro', 'Valore', 'Commento'],
        ['Anno Target', targetYear, 'Anno di riferimento per il budget'],
        ['Mortalità T1 (%)', mortalityRates.T1 * 100, 'Mortalità mensile applicata durante fase T1 (seme piccolo)'],
        ['Mortalità T3 (%)', mortalityRates.T3 * 100, 'Mortalità mensile applicata durante fase T3 (seme medio)'],
        ['Mortalità T10 (%)', mortalityRates.T10 * 100, 'Mortalità mensile applicata durante fase T10 (seme grande)'],
        [''],
        ['=== INVENTARIO INIZIALE (da operazioni attive) ==='],
        ['Taglia Vendita', 'Animali', 'Criterio Classificazione'],
        ['TP-1000 (Seme)', inventoryByCategory['TP-1000'] || 0, 'Animali con animals_per_kg > 97.000'],
        ['TP-2000', inventoryByCategory['TP-2000'] || 0, 'Animali con animals_per_kg tra 29.001 e 97.000'],
        ['TP-3000', inventoryByCategory['TP-3000'] || 0, 'Animali con animals_per_kg tra 15.001 e 29.000'],
        ['TP-4000', inventoryByCategory['TP-4000'] || 0, 'Animali con animals_per_kg tra 9.001 e 15.000'],
        ['TP-5000', inventoryByCategory['TP-5000'] || 0, 'Animali con animals_per_kg <= 9.000'],
        ['TOTALE INVENTARIO', Object.values(inventoryByCategory).reduce((sum: number, v) => sum + (v as number || 0), 0), 'Somma di tutte le taglie'],
        [''],
        ['=== ORDINI TOTALI ASSOLUTI (da Fatture in Cloud) ==='],
        ['Taglia', 'Ordini Totali', 'Categoria', '% sul Totale']
      ];
      
      // Aggiungi ordini per taglia specifica
      const sortedSizes = Object.keys(ordersAbsoluteBySize)
        .filter(s => (ordersAbsoluteBySize as Record<string, number>)[s] > 0)
        .sort((a, b) => {
          const numA = parseInt(a.replace(/\D/g, '')) || 0;
          const numB = parseInt(b.replace(/\D/g, '')) || 0;
          return numA - numB;
        });
      
      for (const size of sortedSizes) {
        const value = (ordersAbsoluteBySize as Record<string, number>)[size] || 0;
        const isT3 = size.includes('2000') || size.includes('3000') || size.includes('3500');
        const percentage = totalOrdersAbsolute > 0 ? ((value / totalOrdersAbsolute) * 100).toFixed(1) : '0';
        parametriData.push([size, value, isT3 ? 'T3' : 'T10', `${percentage}%`]);
      }
      parametriData.push(['TOTALE ORDINI', totalOrdersAbsolute, '-', '100%']);
      
      // FOGLIO 2: TABELLA SGR PER MESE
      const sgrData = [
        ['TABELLA SGR (Specific Growth Rate) PER MESE E TAGLIA'],
        [''],
        ['Commento: SGR = tasso di crescita giornaliero specifico. Varia stagionalmente.'],
        ['I valori provengono dalla tabella sgr_per_taglia del database.'],
        ['SGR più alto = crescita più veloce (estate). SGR più basso = crescita lenta (inverno).'],
        [''],
        ['Mese', 'Size ID', 'Taglia', 'SGR (%/giorno)', 'Commento']
      ];
      
      for (const sgr of sgrRates) {
        let comment = '';
        if (sgr.sgr >= 8) comment = 'Crescita molto rapida (estate)';
        else if (sgr.sgr >= 5) comment = 'Crescita buona (primavera/autunno)';
        else if (sgr.sgr >= 2) comment = 'Crescita moderata';
        else comment = 'Crescita lenta (inverno)';
        
        sgrData.push([sgr.month, sgr.sizeId, sgr.sizeName, sgr.sgr, comment]);
      }
      
      // FOGLIO 3: CALCOLI DETTAGLIATI MESE PER MESE (usa dati dal forecast calcolato)
      const calcData: any[] = [
        ['CALCOLI DETTAGLIATI MENSILI'],
        [''],
        ['Legenda:'],
        ['- Giacenza = Stock disponibile a inizio mese per questa taglia (simulazione con SGR)'],
        ['- Produzione = MIN(Giacenza, MAX(Budget, Ordini)) - animali vendibili questo mese'],
        ['- Δ vs Budget = Produzione - Budget (negativo = manca stock)'],
        ['- Δ vs Ordini = Produzione - Ordini (negativo = ordini scoperti)'],
        ['- Semina T1 = Animali da seminare per coprire il deficit futuro'],
        [''],
        ['Mese', 'Taglia', 'Giacenza', 'Budget', 'Ordini', 'Produzione', 
         'Δ vs Budget', 'Δ vs Ordini', 'Stock Residuo', 'Semina T1', 'Mese Semina', 'Giorni Crescita', 'Stato', 'Commento']
      ];
      
      const monthlyData = forecast.monthlyData || [];
      
      for (const row of monthlyData) {
        const deficitBudget = row.budgetAnimals - row.productionForecast;
        const deficitOrdini = row.ordersAnimals - row.productionForecast;
        
        let commento = '';
        if (deficitBudget > 0) {
          commento = `Deficit Budget ${deficitBudget.toLocaleString('it-IT')} animali. ` +
            `Ordini: ${row.ordersAnimals.toLocaleString('it-IT')} (Δ ${deficitOrdini.toLocaleString('it-IT')}).`;
          if (row.seminaT1Richiesta > 0) {
            commento += ` Semina richiesta: ${row.seminaT1Richiesta.toLocaleString('it-IT')}.`;
          }
        } else if (deficitOrdini > 0) {
          commento = `Budget coperto. ATTENZIONE: ordini ${row.ordersAnimals.toLocaleString('it-IT')} > produzione ${row.productionForecast.toLocaleString('it-IT')} (gap: ${deficitOrdini.toLocaleString('it-IT')}).`;
        } else if (row.budgetAnimals > 0 || row.ordersAnimals > 0) {
          commento = `Stock sufficiente. Produzione ${row.productionForecast.toLocaleString('it-IT')} su budget ${row.budgetAnimals.toLocaleString('it-IT')}, ordini ${row.ordersAnimals.toLocaleString('it-IT')}.`;
        } else {
          commento = row.giacenzaInizioMese > 0 ? `Giacenza ${row.giacenzaInizioMese.toLocaleString('it-IT')} senza domanda.` : '-';
        }
        
        calcData.push([
          row.monthName,
          row.sizeCategory,
          Math.round(row.giacenzaInizioMese),
          row.budgetAnimals,
          row.ordersAnimals,
          Math.round(row.productionForecast),
          Math.round(row.varianceBudgetProduction),
          Math.round(row.varianceOrdersProduction),
          Math.round(row.stockResiduo),
          Math.round(row.seminaT1Richiesta || 0),
          row.meseSeminaT1 || '-',
          row.giorniCrescita || 0,
          row.statusDescription || 'Coperto',
          commento
        ]);
      }
      
      // FOGLIO 4: RIEPILOGO SEMINE (usa dati dal forecast)
      const semineData: any[] = [
        ['RIEPILOGO SEMINE T1 RICHIESTE'],
        [''],
        ['Questo foglio mostra quando e quanto seminare T1 per coprire i deficit di produzione.'],
        ['Il mese di semina è calcolato all\'indietro dal mese target usando i valori SGR reali.'],
        [''],
        ['Mese Target', 'Taglia Target', 'Semina T1 Richiesta', 'Mese Semina', 'Giorni Crescita']
      ];
      
      const seedingSchedule = forecast.seedingSchedule || [];
      for (const s of seedingSchedule) {
        semineData.push([
          s.targetMonthName + ' ' + s.targetYear,
          s.targetSize,
          s.seedT1Amount,
          s.seedingMonthName + ' ' + s.seedingYear,
          s.growthDays
        ]);
      }
      
      // Crea workbook formattato con ExcelJS
      const workbook = createFormattedWorkbook();
      
      // FOGLIO 1: Parametri e Inventario
      const ws1 = workbook.addWorksheet('Parametri e Inventario');
      setColumnWidths(ws1, [25, 20, 50]);
      
      let rowNum = 1;
      for (const rowData of parametriData) {
        const row = ws1.addRow(rowData);
        if (rowNum === 1) {
          applyTitleStyle(row);
          ws1.mergeCells(rowNum, 1, rowNum, 3);
        } else if (String(rowData[0]).startsWith('===')) {
          applySectionTitleStyle(row);
          ws1.mergeCells(rowNum, 1, rowNum, 3);
        } else if (rowData[0] === 'Parametro' || rowData[0] === 'Categoria' || rowData[0] === 'Taglia') {
          applyHeaderStyle(row);
        } else if (rowData[0] && rowData[0] !== '') {
          applyDataRowStyle(row, rowNum % 2 === 0);
        }
        rowNum++;
      }
      
      // FOGLIO 2: Tabella SGR
      const ws2 = workbook.addWorksheet('Tabella SGR');
      setColumnWidths(ws2, [15, 10, 20, 15, 35]);
      
      rowNum = 1;
      for (const rowData of sgrData) {
        const row = ws2.addRow(rowData);
        if (rowNum === 1) {
          applyTitleStyle(row);
          ws2.mergeCells(rowNum, 1, rowNum, 5);
        } else if (rowData[0] === 'Mese') {
          applyHeaderStyle(row);
        } else if (rowData[0] && !String(rowData[0]).startsWith('Commento') && rowData[0] !== '' && rowData[0] !== 'I valori') {
          applyDataRowStyle(row, rowNum % 2 === 0);
        }
        rowNum++;
      }
      
      // FOGLIO 3: Calcoli Dettagliati (principale) - 14 colonne
      const ws3 = workbook.addWorksheet('Calcoli Dettagliati');
      setColumnWidths(ws3, [12, 12, 15, 12, 12, 15, 12, 12, 15, 12, 15, 12, 18, 45]);
      
      rowNum = 1;
      const statusColIdx = 12;
      for (const rowData of calcData) {
        const row = ws3.addRow(rowData);
        if (rowNum === 1) {
          applyTitleStyle(row);
          ws3.mergeCells(rowNum, 1, rowNum, 14);
        } else if (rowData[0] === 'Mese') {
          applyHeaderStyle(row);
        } else if (String(rowData[0]).startsWith('-') || String(rowData[0]).startsWith('Legenda')) {
          row.getCell(1).font = { italic: true, size: 10, color: { argb: '666666' } };
        } else if (rowData[0] && rowData[0] !== '') {
          applyDataRowStyle(row, rowNum % 2 === 0);
          if (rowData[statusColIdx]) {
            applyStatusStyle(row.getCell(statusColIdx + 1), String(rowData[statusColIdx]));
          }
          for (let col = 3; col <= 12; col++) {
            if (typeof rowData[col - 1] === 'number') {
              applyNumberFormat(row.getCell(col));
            }
          }
        }
        rowNum++;
      }
      
      // FOGLIO 4: Riepilogo Semine - 5 colonne
      const ws4 = workbook.addWorksheet('Riepilogo Semine');
      setColumnWidths(ws4, [20, 15, 18, 18, 15]);
      
      rowNum = 1;
      for (const rowData of semineData) {
        const row = ws4.addRow(rowData);
        if (rowNum === 1) {
          applyTitleStyle(row);
          ws4.mergeCells(rowNum, 1, rowNum, 5);
        } else if (rowData[0] === 'Mese Target') {
          applyHeaderStyle(row);
        } else if (String(rowData[0]).startsWith('Questo') || String(rowData[0]).startsWith('Il mese')) {
          row.getCell(1).font = { italic: true, size: 10, color: { argb: '666666' } };
          ws4.mergeCells(rowNum, 1, rowNum, 5);
        } else if (rowData[0] && rowData[0] !== '') {
          applyDataRowStyle(row, rowNum % 2 === 0);
          if (typeof rowData[2] === 'number') applyNumberFormat(row.getCell(3));
          if (typeof rowData[4] === 'number') applyNumberFormat(row.getCell(5));
        }
        rowNum++;
      }
      
      // FOGLIO 5: Ordini per Taglia Specifica
      const ws5 = workbook.addWorksheet('Ordini per Taglia');
      setColumnWidths(ws5, [15, 20, 15, 30]);
      
      const ordiniTagliaData: any[] = [
        ['ORDINI PER TAGLIA SPECIFICA'],
        [''],
        ['Codice Taglia', 'Animali Totali', 'Categoria', 'Commento'],
      ];
      
      const sizeDescriptions: Record<string, string> = {
        'TP-2000': 'Seme piccolo (2.000 an/kg) - Categoria T3',
        'TP-3000': 'Seme medio (3.000 an/kg) - Categoria T3',
        'TP-3500': 'Seme medio-grande (3.500 an/kg) - Categoria T3',
        'TP-4000': 'Seme grande (4.000 an/kg) - Categoria T10',
        'TP-5000': 'Seme molto grande (5.000 an/kg) - Categoria T10',
      };
      
      let totalT3Ordini = 0;
      let totalT10Ordini = 0;
      
      // Usa ordersAbsoluteBySize per i totali assoluti (285.5M) invece di ordersBySpecificSize (281M allocato per anno)
      const absoluteSizes = Object.keys(ordersAbsoluteBySize)
        .filter(s => (ordersAbsoluteBySize as Record<string, number>)[s] > 0)
        .sort((a, b) => {
          const numA = parseInt(a.replace(/\D/g, '')) || 0;
          const numB = parseInt(b.replace(/\D/g, '')) || 0;
          return numA - numB;
        });
      
      for (const sizeCode of absoluteSizes) {
        const totalAnimals = (ordersAbsoluteBySize as Record<string, number>)[sizeCode] || 0;
        const isT3 = sizeCode.includes('2000') || sizeCode.includes('3000') || sizeCode.includes('3500');
        const category = isT3 ? 'T3' : 'T10';
        const description = sizeDescriptions[sizeCode] || `Taglia ${sizeCode}`;
        ordiniTagliaData.push([sizeCode, totalAnimals, category, description]);
        if (isT3) totalT3Ordini += totalAnimals;
        else totalT10Ordini += totalAnimals;
      }
      
      ordiniTagliaData.push(['']);
      ordiniTagliaData.push(['SUBTOTALE T3', totalT3Ordini, 'T3', 'Taglie TP-2000, TP-3000, TP-3500']);
      ordiniTagliaData.push(['SUBTOTALE T10', totalT10Ordini, 'T10', 'Taglie TP-4000, TP-5000']);
      ordiniTagliaData.push(['TOTALE ORDINI', totalT3Ordini + totalT10Ordini, '-', 'Somma di tutte le taglie']);
      
      rowNum = 1;
      for (const rowData of ordiniTagliaData) {
        const row = ws5.addRow(rowData);
        if (rowNum === 1) {
          applyTitleStyle(row);
          ws5.mergeCells(rowNum, 1, rowNum, 4);
        } else if (rowData[0] === 'Codice Taglia') {
          applyHeaderStyle(row);
        } else if (String(rowData[0]).startsWith('SUBTOTALE') || String(rowData[0]).startsWith('TOTALE')) {
          applyTotalRowStyle(row);
          if (typeof rowData[1] === 'number') applyNumberFormat(row.getCell(2));
        } else if (rowData[0] && rowData[0] !== '') {
          applyDataRowStyle(row, rowNum % 2 === 0);
          if (typeof rowData[1] === 'number') applyNumberFormat(row.getCell(2));
        }
        rowNum++;
      }
      
      const buffer = await workbook.xlsx.writeBuffer();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Report_Analitico_Scostamenti_${targetYear}.xlsx`);
      res.send(Buffer.from(buffer));
      
    } catch (error) {
      console.error('Errore export analitico:', error);
      res.status(500).json({ success: false, error: 'Errore generazione report analitico' });
    }
  });

  // Endpoint per analisi scenario AI
  app.post("/api/ai/scenario-analysis", async (req: Request, res: Response) => {
    try {
      const { question, context, year = new Date().getFullYear() } = req.body;
      
      if (!question) {
        return res.status(400).json({ success: false, error: 'Domanda richiesta' });
      }
      
      // Validazione e defaults per context
      const safeContext = {
        currentInventory: context?.currentInventory || [],
        monthlyData: context?.monthlyData || [],
        ordersAbsoluteBySize: context?.ordersAbsoluteBySize || {},
        mortalityBySize: context?.mortalityBySize || {},
        mortalityAdjustment: context?.mortalityAdjustment || 0
      };
      
      console.log('🤖 AI Scenario Analysis:', { question, year, hasContext: !!context });
      
      const { scenarioAnalysisService } = await import('../ai/scenario-analysis-service');
      
      const result = await scenarioAnalysisService.analyzeScenario(question, safeContext, year);
      
      res.json({ 
        success: true, 
        ...result 
      });
      
    } catch (error) {
      console.error('Errore analisi scenario AI:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Errore durante l\'analisi AI',
        answer: 'Si è verificato un errore. Riprova più tardi.',
        recommendations: [],
        dataPoints: [],
        confidence: 0
      });
    }
  });

  console.log('🤖 Route AI registrate con successo');
}