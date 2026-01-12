import type { Express, Request, Response } from "express";
import { AIService, PredictiveGrowthData } from "../ai/ai-service";
import { db } from "../db";
import { baskets, operations, cycles, sgrGiornalieri, sizes, basketLotComposition, lots, flupsys } from "../../shared/schema";
import { eq, desc, and, gte, lte, sql, isNotNull } from "drizzle-orm";

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

  // Export Excel Analitico con tutti i calcoli commentati
  app.get("/api/ai/production-forecast/export-analytical", async (req: Request, res: Response) => {
    try {
      const XLSX = require('xlsx');
      const { year, mortalityT1, mortalityT3, mortalityT10 } = req.query;
      const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
      
      const mortalityRates = {
        T1: mortalityT1 ? parseFloat(mortalityT1 as string) / 100 : 0.05,
        T3: mortalityT3 ? parseFloat(mortalityT3 as string) / 100 : 0.03,
        T10: mortalityT10 ? parseFloat(mortalityT10 as string) / 100 : 0.02
      };
      
      const { productionForecastService } = await import('../ai/production-forecast-service');
      
      const targets = await productionForecastService.getProductionTargets(targetYear);
      const sgrRates = await productionForecastService.getSgrRates();
      const inventoryByCategory = await productionForecastService.getTotalInventoryByCategory();
      const sgrLookup = await productionForecastService.getSgrLookup();
      
      const MONTH_NAMES = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
      
      // FOGLIO 1: PARAMETRI E INVENTARIO INIZIALE
      const parametriData = [
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
        ['Categoria', 'Animali', 'Criterio Classificazione'],
        ['T1 (Seme piccolo)', inventoryByCategory.T1 || 0, 'Animali con min_animals_per_kg > 30.000'],
        ['T3 (Seme medio)', inventoryByCategory.T3 || 0, 'Animali con min_animals_per_kg tra 6.001 e 30.000'],
        ['T10 (Seme grande)', inventoryByCategory.T10 || 0, 'Animali con min_animals_per_kg <= 6.000'],
        ['TOTALE INVENTARIO', (inventoryByCategory.T1 || 0) + (inventoryByCategory.T3 || 0) + (inventoryByCategory.T10 || 0), 'Somma di tutte le categorie'],
      ];
      
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
      
      // FOGLIO 3: CALCOLI DETTAGLIATI MESE PER MESE
      const calcData: any[] = [
        ['CALCOLI DETTAGLIATI MENSILI'],
        [''],
        ['Legenda formule:'],
        ['- Stock Residuo = Stock precedente - Venduto + Transizioni da categoria inferiore - Mortalità'],
        ['- Venduto = MIN(Stock disponibile, Budget)'],
        ['- Deficit = Budget - Venduto (se negativo = surplus, se positivo = manca stock)'],
        ['- Sopravvivenza Cumulativa T3 = (1 - Mortalità_T1)^mesi_crescita'],
        ['- Sopravvivenza Cumulativa T10 = (1 - Mortalità_T1)^6 × (1 - Mortalità_T3)^4'],
        ['- Semina T1 = Deficit / Sopravvivenza_Cumulativa'],
        ['- Giorni Crescita = Calcolato all\'indietro usando SGR mensili reali'],
        [''],
        ['Mese', 'Taglia', 'Stock Inizio Mese', 'Transizione Entrata', 'Mortalità Applicata', 
         'Stock Disponibile', 'Budget', 'Venduto', 'Stock Fine Mese', 'Deficit', 
         'Mesi Crescita', 'Sopravvivenza %', 'Semina T1 Richiesta', 'Mese Semina', 'Giorni Crescita', 'Stato', 'Commento Calcolo']
      ];
      
      let stockT1 = inventoryByCategory.T1 || 0;
      let stockT3 = inventoryByCategory.T3 || 0;
      let stockT10 = inventoryByCategory.T10 || 0;
      
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      
      for (let month = 1; month <= 12; month++) {
        const monthsFromNow = month - currentMonth;
        
        const stockT1Inizio = stockT1;
        const stockT3Inizio = stockT3;
        const stockT10Inizio = stockT10;
        
        let t1ToT3Transition = 0;
        let t3ToT10Transition = 0;
        let mortalityT1Applied = 0;
        let mortalityT3Applied = 0;
        let mortalityT10Applied = 0;
        
        if (monthsFromNow > 0) {
          t1ToT3Transition = stockT1 * 0.15;
          mortalityT1Applied = (stockT1 - t1ToT3Transition) * mortalityRates.T1;
          stockT1 = Math.max(0, (stockT1 - t1ToT3Transition) * (1 - mortalityRates.T1));
          stockT3 += t1ToT3Transition * (1 - mortalityRates.T1);
          
          t3ToT10Transition = stockT3 * 0.10;
          mortalityT3Applied = (stockT3 - t3ToT10Transition) * mortalityRates.T3;
          stockT3 = Math.max(0, (stockT3 - t3ToT10Transition) * (1 - mortalityRates.T3));
          stockT10 += t3ToT10Transition * (1 - mortalityRates.T3);
          
          mortalityT10Applied = stockT10 * mortalityRates.T10;
          stockT10 = stockT10 * (1 - mortalityRates.T10);
        }
        
        const monthTargets = targets.filter((t: any) => t.month === month);
        
        for (const target of monthTargets) {
          const budgetAnimals = target.targetAnimals || 0;
          
          let stockInizio = 0;
          let transizione = 0;
          let mortalita = 0;
          let stockDisponibile = 0;
          let venduto = 0;
          let stockFine = 0;
          
          if (target.sizeCategory === 'T3') {
            stockInizio = stockT3Inizio;
            transizione = t1ToT3Transition * (1 - mortalityRates.T1);
            mortalita = mortalityT3Applied;
            stockDisponibile = stockT3;
            venduto = Math.min(stockT3, budgetAnimals);
            stockT3 = Math.max(0, stockT3 - venduto);
            stockFine = stockT3;
          } else if (target.sizeCategory === 'T10') {
            stockInizio = stockT10Inizio;
            transizione = t3ToT10Transition * (1 - mortalityRates.T3);
            mortalita = mortalityT10Applied;
            stockDisponibile = stockT10;
            venduto = Math.min(stockT10, budgetAnimals);
            stockT10 = Math.max(0, stockT10 - venduto);
            stockFine = stockT10;
          }
          
          const deficit = budgetAnimals - venduto;
          
          const growthMonths = target.sizeCategory === 'T3' ? 6 : 10;
          const survivalT1 = Math.pow(1 - mortalityRates.T1, growthMonths);
          const survivalT3 = target.sizeCategory === 'T10' ? Math.pow(1 - mortalityRates.T3, 4) : 1;
          const totalSurvival = survivalT1 * survivalT3;
          
          let seminaT1 = 0;
          let meseSemina = '-';
          let giorniCrescita = 0;
          let stato = 'In linea';
          let commento = '';
          
          if (deficit > 0) {
            seminaT1 = Math.ceil(deficit / totalSurvival);
            
            const growthCalc = productionForecastService.calculateGrowthDaysBackward(
              sgrLookup, month, targetYear, target.sizeCategory
            );
            giorniCrescita = growthCalc.totalDays;
            meseSemina = MONTH_NAMES[growthCalc.seedingMonth - 1] + ' ' + growthCalc.seedingYear;
            
            commento = `Deficit ${deficit.toLocaleString('it-IT')} animali. ` +
              `Sopravvivenza: ${(totalSurvival * 100).toFixed(1)}% = ` +
              `(1-${mortalityRates.T1*100}%)^${growthMonths}` +
              (target.sizeCategory === 'T10' ? ` × (1-${mortalityRates.T3*100}%)^4` : '') +
              `. Semina = ${deficit.toLocaleString('it-IT')} / ${(totalSurvival * 100).toFixed(1)}% = ${seminaT1.toLocaleString('it-IT')}`;
            stato = 'Critico';
          } else {
            commento = `Stock sufficiente. Venduto ${venduto.toLocaleString('it-IT')} su budget ${budgetAnimals.toLocaleString('it-IT')}.`;
            if (venduto >= budgetAnimals) {
              stato = 'In linea';
            }
          }
          
          calcData.push([
            MONTH_NAMES[month - 1],
            target.sizeCategory,
            Math.round(stockInizio),
            Math.round(transizione),
            Math.round(mortalita),
            Math.round(stockDisponibile),
            budgetAnimals,
            Math.round(venduto),
            Math.round(stockFine),
            Math.round(deficit),
            growthMonths,
            (totalSurvival * 100).toFixed(1) + '%',
            Math.round(seminaT1),
            meseSemina,
            giorniCrescita,
            stato,
            commento
          ]);
        }
      }
      
      // FOGLIO 4: RIEPILOGO SEMINE
      const semineData: any[] = [
        ['RIEPILOGO SEMINE T1 RICHIESTE'],
        [''],
        ['Questo foglio mostra quando e quanto seminare T1 per coprire i deficit di produzione.'],
        ['Il mese di semina è calcolato all\'indietro dal mese target usando i valori SGR reali.'],
        [''],
        ['Mese Target', 'Taglia Target', 'Deficit Animali', 'Semina T1 Richiesta', 'Mese Semina', 
         'Giorni Crescita', 'Formula Sopravvivenza', 'Sopravvivenza %']
      ];
      
      // Ricalcola per foglio semine
      stockT1 = inventoryByCategory.T1 || 0;
      stockT3 = inventoryByCategory.T3 || 0;
      stockT10 = inventoryByCategory.T10 || 0;
      
      for (let month = 1; month <= 12; month++) {
        const monthsFromNow = month - currentMonth;
        
        if (monthsFromNow > 0) {
          const t1ToT3 = stockT1 * 0.15;
          stockT1 = Math.max(0, (stockT1 - t1ToT3) * (1 - mortalityRates.T1));
          stockT3 += t1ToT3 * (1 - mortalityRates.T1);
          
          const t3ToT10 = stockT3 * 0.10;
          stockT3 = Math.max(0, (stockT3 - t3ToT10) * (1 - mortalityRates.T3));
          stockT10 += t3ToT10 * (1 - mortalityRates.T3);
          stockT10 = stockT10 * (1 - mortalityRates.T10);
        }
        
        const monthTargets = targets.filter((t: any) => t.month === month);
        
        for (const target of monthTargets) {
          const budget = target.targetAnimals || 0;
          let available = target.sizeCategory === 'T3' ? stockT3 : stockT10;
          const sold = Math.min(available, budget);
          
          if (target.sizeCategory === 'T3') {
            stockT3 = Math.max(0, stockT3 - sold);
          } else {
            stockT10 = Math.max(0, stockT10 - sold);
          }
          
          const deficit = budget - sold;
          if (deficit > 0) {
            const growthMonths = target.sizeCategory === 'T3' ? 6 : 10;
            const survT1 = Math.pow(1 - mortalityRates.T1, growthMonths);
            const survT3 = target.sizeCategory === 'T10' ? Math.pow(1 - mortalityRates.T3, 4) : 1;
            const total = survT1 * survT3;
            
            const formula = target.sizeCategory === 'T10' 
              ? `(1-${mortalityRates.T1*100}%)^${growthMonths} × (1-${mortalityRates.T3*100}%)^4`
              : `(1-${mortalityRates.T1*100}%)^${growthMonths}`;
            
            const growthCalc = productionForecastService.calculateGrowthDaysBackward(
              sgrLookup, month, targetYear, target.sizeCategory
            );
            
            semineData.push([
              MONTH_NAMES[month - 1] + ' ' + targetYear,
              target.sizeCategory,
              deficit,
              Math.ceil(deficit / total),
              MONTH_NAMES[growthCalc.seedingMonth - 1] + ' ' + growthCalc.seedingYear,
              growthCalc.totalDays,
              formula,
              (total * 100).toFixed(1) + '%'
            ]);
          }
        }
      }
      
      // Crea workbook
      const wb = XLSX.utils.book_new();
      
      const ws1 = XLSX.utils.aoa_to_sheet(parametriData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Parametri e Inventario');
      
      const ws2 = XLSX.utils.aoa_to_sheet(sgrData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Tabella SGR');
      
      const ws3 = XLSX.utils.aoa_to_sheet(calcData);
      ws3['!cols'] = Array(17).fill({ wch: 18 });
      XLSX.utils.book_append_sheet(wb, ws3, 'Calcoli Dettagliati');
      
      const ws4 = XLSX.utils.aoa_to_sheet(semineData);
      XLSX.utils.book_append_sheet(wb, ws4, 'Riepilogo Semine');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Report_Analitico_Scostamenti_${targetYear}.xlsx`);
      res.send(buffer);
      
    } catch (error) {
      console.error('Errore export analitico:', error);
      res.status(500).json({ success: false, error: 'Errore generazione report analitico' });
    }
  });

  console.log('🤖 Route AI registrate con successo');
}