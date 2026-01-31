import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Fan, AlertTriangle, AlertCircle, CheckCircle, Clock, TrendingUp, TrendingDown, Minus, Download, Users } from 'lucide-react';
import { getOperationTypeLabel } from '@/lib/utils';
import * as ExcelJS from 'exceljs';
import { AssignGroupDialog } from '@/components/AssignGroupDialog';

interface NewFlupsyVisualizerProps {
  selectedFlupsyIds?: number[];
}

export default function NewFlupsyVisualizer({ selectedFlupsyIds = [] }: NewFlupsyVisualizerProps) {
  const [, navigate] = useLocation();
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [isAssignGroupDialogOpen, setIsAssignGroupDialogOpen] = useState(false);

  // Fetch flupsys
  const { data: allFlupsys, isLoading: isLoadingFlupsys } = useQuery({
    queryKey: ['/api/flupsys', { includeAll: true }],
  });
  
  // Non serve fare query qui dato che è già presente più avanti
  
  // Filtra i FLUPSY in base agli ID selezionati
  const flupsys = useMemo(() => {
    if (!allFlupsys) return [];
    
    // Se non ci sono ID selezionati, non mostrare nessun FLUPSY nella dashboard all'avvio
    if (selectedFlupsyIds.length === 0) {
      // Ritorna un array vuoto per mostrare un messaggio che nessun FLUPSY è selezionato
      return [];
    }
    
    // Altrimenti, filtra i FLUPSY in base agli ID selezionati
    return allFlupsys.filter((flupsy: any) => 
      selectedFlupsyIds.includes(flupsy.id)
    );
  }, [allFlupsys, selectedFlupsyIds]);

  // Fetch ALL baskets without any filters
  const { data: allBaskets, isLoading: isLoadingBaskets } = useQuery({
    queryKey: ['/api/baskets', { includeAll: true }],
  });

  // Filter baskets client-side based on selectedFlupsyIds
  const filteredBaskets = useMemo(() => {
    if (!allBaskets) return [];

    // If no flupsyIds are selected, show all baskets
    if (selectedFlupsyIds.length === 0) {
      return allBaskets;
    }

    // Otherwise, filter baskets to only show those in the selected FLUPSYs
    return allBaskets.filter((basket: any) => selectedFlupsyIds.includes(basket.flupsyId));
  }, [allBaskets, selectedFlupsyIds]);

  // ENDPOINT OTTIMIZZATO: Carica solo l'ultima operazione per ogni cesta attiva
  // Questo è molto più efficiente rispetto a caricare tutte le operazioni
  const { data: latestOperationsMap, isLoading: isLoadingOperations } = useQuery<Record<number, any>>({
    queryKey: ['/api/baskets/latest-operations'],
    staleTime: 60000, // 1 minute per performance
  });

  // Fetch cycles for tooltip data
  const { data: cyclesData, isLoading: isLoadingCycles } = useQuery({
    queryKey: ['/api/cycles', { includeAll: true }],
    staleTime: 30000, // 30 seconds
  });
  
  const cycles = cyclesData?.cycles || [];

  // Fetch lots for tooltip data
  const { data: lots, isLoading: isLoadingLots } = useQuery({
    queryKey: ['/api/lots', { includeAll: true }],
    staleTime: 30000, // 30 seconds
  });

  // Fetch sizes for tooltip data
  const { data: sizes } = useQuery({
    queryKey: ['/api/sizes'],
    staleTime: 3600000, // 1 hour - le taglie cambiano raramente
  });

  // Fetch expected sizes for blink animation
  const { data: expectedSizesData } = useQuery<Array<{
    basketId: number;
    registeredSize: string;
    expectedSize: string;
    hasExpectedSizeChange: boolean;
    daysSinceLastMeasurement: number;
  }>>({
    queryKey: ['/api/baskets/expected-sizes'],
    staleTime: 120000, // 2 minutes
  });

  // Fetch mortality rates for filtering
  const { data: mortalityRates } = useQuery<Array<{
    basketId: number;
    cycleId: number;
    mortalityPercent: number;
  }>>({
    queryKey: ['/api/mortality-rates'],
    staleTime: 120000, // 2 minutes
  });

  // Fetch all operations for SGR and trend calculations
  const { data: allOperations } = useQuery<any[]>({
    queryKey: ['/api/operations', { includeAll: true, pageSize: 500 }],
    staleTime: 60000, // 1 minute
  });

  // Create a map for quick lookup of expected size changes
  const expectedSizesMap = useMemo(() => {
    const map = new Map<number, { expectedSize: string; daysSince: number }>();
    if (expectedSizesData) {
      for (const item of expectedSizesData) {
        if (item.hasExpectedSizeChange) {
          map.set(item.basketId, {
            expectedSize: item.expectedSize,
            daysSince: item.daysSinceLastMeasurement
          });
        }
      }
    }
    return map;
  }, [expectedSizesData]);

  // Helper to check if basket has expected size change
  const hasExpectedSizeChange = (basketId: number): boolean => {
    return expectedSizesMap.has(basketId);
  };

  // Helper to check if basket needs measurement (>7 days since last)
  const needsMeasurement = (basketId: number): boolean => {
    const info = expectedSizesData?.find(e => e.basketId === basketId);
    return info ? info.daysSinceLastMeasurement > 7 : false;
  };

  // Helper to check if basket has high mortality (>10%) - uses allOperations for consistency
  const hasHighMortality = (basket: any): boolean => {
    if (!basket || !basket.currentCycleId) return false;
    if (!allOperations || allOperations.length === 0) return false;
    
    // Find latest operation with mortality data for this basket's current cycle
    const basketOps = allOperations
      .filter((op: any) => op.basketId === basket.id && op.cycleId === basket.currentCycleId)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const latestOp = basketOps[0];
    if (!latestOp) return false;
    
    const mortality = latestOp.mortalityRate;
    return mortality !== null && mortality !== undefined && mortality > 10;
  };

  // Helper to check if basket has optimal growth (calculated from weight change)
  const hasOptimalGrowth = (basket: any): boolean => {
    const latestOp = getLatestOperation(basket.id);
    if (!latestOp?.totalWeight || !latestOp?.previousWeight) return false;
    const growth = ((latestOp.totalWeight - latestOp.previousWeight) / latestOp.previousWeight) * 100;
    return growth > 5; // More than 5% weight increase
  };

  // Helper to check if basket has slow growth
  const hasSlowGrowth = (basket: any): boolean => {
    const latestOp = getLatestOperation(basket.id);
    if (!latestOp?.totalWeight || !latestOp?.previousWeight) return false;
    const growth = ((latestOp.totalWeight - latestOp.previousWeight) / latestOp.previousWeight) * 100;
    return growth < 2 && growth >= 0; // Less than 2% weight increase
  };

  // Helper to check if basket is ready for harvest (large size only - TP-3000 or higher)
  const isReadyForHarvest = (basket: any): boolean => {
    return hasLargeSize(basket);
  };

  // Helper to check if basket has heavy weight (>20kg)
  const hasHeavyWeight = (basket: any): boolean => {
    if (!basket || (basket.state !== 'active' && basket.state !== 'occupied')) return false;
    const latestOp = getLatestOperation(basket.id);
    if (!latestOp?.totalWeight) return false;
    return latestOp.totalWeight > 20000; // More than 20kg (20000g)
  };

  // Helper to get expected size info
  const getExpectedSizeInfo = (basketId: number) => {
    return expectedSizesMap.get(basketId);
  };

  // Helper to calculate FLUPSY-specific statistics with SGR and trends
  const getFlupsyStats = (flupsyId: number) => {
    const flupsyBaskets = filteredBaskets?.filter((b: any) => 
      b.flupsyId === flupsyId && b.currentCycleId && (b.state === 'active' || b.state === 'occupied')
    ) || [];
    
    if (flupsyBaskets.length === 0) {
      return { 
        critical: 0, warning: 0, healthy: 0, noMeasure: 0, 
        avgSgr: null, avgMortality: null, activeCount: 0,
        sgrTrend: 'stable' as const, mortalityTrend: 'stable' as const
      };
    }

    let critical = 0, warning = 0, healthy = 0, noMeasure = 0;
    let totalMortality = 0, mortalityCount = 0;
    let totalPrevMortality = 0, prevMortalityCount = 0;
    let totalSgr = 0, sgrCount = 0;
    let totalPrevSgr = 0, prevSgrCount = 0;
    const today = new Date();

    // Get operations grouped by basket for this FLUPSY
    const activeCycleIds = new Set(flupsyBaskets.map((b: any) => b.currentCycleId));
    const flupsyOps = (allOperations || []).filter((op: any) => 
      op.cycleId && activeCycleIds.has(op.cycleId) && 
      (op.type === 'misura' || op.type === 'prima-attivazione')
    );

    // Group operations by basket
    const opsByBasket = new Map<number, any[]>();
    flupsyOps.forEach((op: any) => {
      if (op.basketId) {
        const ops = opsByBasket.get(op.basketId) || [];
        ops.push(op);
        opsByBasket.set(op.basketId, ops);
      }
    });

    // Sort operations by date (most recent first)
    opsByBasket.forEach((ops) => {
      ops.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    flupsyBaskets.forEach((basket: any) => {
      const basketOps = opsByBasket.get(basket.id) || [];
      const latestOp = basketOps[0];
      
      if (!latestOp) {
        noMeasure++;
        return;
      }

      // Check days since last measurement
      const opDate = new Date(latestOp.date);
      const daysDiff = Math.floor((today.getTime() - opDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 7) noMeasure++;

      // Mortality classification (current)
      const mortality = latestOp.mortalityRate;
      if (mortality !== null && mortality !== undefined) {
        totalMortality += mortality;
        mortalityCount++;
        
        if (mortality > 10) critical++;
        else if (mortality >= 5) warning++;
        else healthy++;
      } else {
        healthy++;
      }

      // Mortality trend (previous operation)
      if (basketOps.length >= 2 && basketOps[1].mortalityRate !== null && basketOps[1].mortalityRate !== undefined) {
        totalPrevMortality += basketOps[1].mortalityRate;
        prevMortalityCount++;
      }

      // SGR calculation between last 2 operations
      if (basketOps.length >= 2) {
        const op1 = basketOps[0];
        const op2 = basketOps[1];
        const apk1 = op1.measurementAnimalsPerKg || op1.animalsPerKg;
        const apk2 = op2.measurementAnimalsPerKg || op2.animalsPerKg;
        
        if (apk1 && apk2 && apk1 > 0 && apk2 > 0) {
          const weight1 = 1000000 / apk1; // mg
          const weight2 = 1000000 / apk2; // mg
          const days = Math.max(1, Math.floor((new Date(op1.date).getTime() - new Date(op2.date).getTime()) / (1000 * 60 * 60 * 24)));
          
          if (weight1 > 0 && weight2 > 0) {
            const sgr = ((Math.log(weight1) - Math.log(weight2)) / days) * 100;
            if (sgr > -50 && sgr < 50) { // Filter outliers
              totalSgr += sgr;
              sgrCount++;
            }
          }
        }

        // Previous SGR (between 2nd and 3rd operation) for trend
        if (basketOps.length >= 3) {
          const op2b = basketOps[1];
          const op3 = basketOps[2];
          const apk2b = op2b.measurementAnimalsPerKg || op2b.animalsPerKg;
          const apk3 = op3.measurementAnimalsPerKg || op3.animalsPerKg;
          
          if (apk2b && apk3 && apk2b > 0 && apk3 > 0) {
            const weight2b = 1000000 / apk2b;
            const weight3 = 1000000 / apk3;
            const days2 = Math.max(1, Math.floor((new Date(op2b.date).getTime() - new Date(op3.date).getTime()) / (1000 * 60 * 60 * 24)));
            
            if (weight2b > 0 && weight3 > 0) {
              const prevSgr = ((Math.log(weight2b) - Math.log(weight3)) / days2) * 100;
              if (prevSgr > -50 && prevSgr < 50) {
                totalPrevSgr += prevSgr;
                prevSgrCount++;
              }
            }
          }
        }
      }
    });

    const avgMortality = mortalityCount > 0 ? totalMortality / mortalityCount : null;
    const avgPrevMortality = prevMortalityCount > 0 ? totalPrevMortality / prevMortalityCount : null;
    const avgSgr = sgrCount > 0 ? totalSgr / sgrCount : null;
    const avgPrevSgr = prevSgrCount > 0 ? totalPrevSgr / prevSgrCount : null;

    // Calculate trends
    let mortalityTrend: 'up' | 'down' | 'stable' = 'stable';
    if (avgMortality !== null && avgPrevMortality !== null) {
      const mortDiff = avgMortality - avgPrevMortality;
      if (mortDiff > 0.5) mortalityTrend = 'up';
      else if (mortDiff < -0.5) mortalityTrend = 'down';
    }

    let sgrTrend: 'up' | 'down' | 'stable' = 'stable';
    if (avgSgr !== null && avgPrevSgr !== null) {
      const sgrDiff = avgSgr - avgPrevSgr;
      if (sgrDiff > 0.2) sgrTrend = 'up';
      else if (sgrDiff < -0.2) sgrTrend = 'down';
    }

    return {
      critical,
      warning,
      healthy,
      noMeasure,
      avgSgr,
      avgMortality,
      activeCount: flupsyBaskets.length,
      sgrTrend,
      mortalityTrend
    };
  };

  // Helper function to get the latest operation for a basket (usa la mappa ottimizzata)
  const getLatestOperation = (basketId: number) => {
    if (!latestOperationsMap) return null;
    
    // Prima verifica se il cestello ha un ciclo attivo
    const basket = filteredBaskets.find((b: any) => b.id === basketId);
    if (!basket || !basket.currentCycleId) {
      // Se il cestello non ha un ciclo attivo, non mostrare dati operazioni
      return null;
    }
    
    // Accesso diretto dalla mappa - O(1) invece di O(n)
    return latestOperationsMap[basketId] || null;
  };

  // Helper function to get operations for a basket (per compatibilità)
  const getOperationsForBasket = (basketId: number): any[] => {
    const latestOp = latestOperationsMap?.[basketId];
    return latestOp ? [latestOp] : [];
  };
  
  // Helper function to check if a basket has a large size (TP-3000 or higher = sellable)
  // IMPORTANTE: usa measurementAnimalsPerKg (da misura/prima-attivazione) per allineamento con expected-sizes
  const hasLargeSize = (basket: any): boolean => {
    if (!basket || (basket.state !== 'active' && basket.state !== 'occupied')) return false;
    
    const latestOperation = getLatestOperation(basket.id);
    // Usa measurementAnimalsPerKg (da misura/prima-attivazione) con fallback su animalsPerKg
    const animalsPerKg = latestOperation?.measurementAnimalsPerKg || latestOperation?.animalsPerKg;
    if (!animalsPerKg) return false;
    
    // SOGLIA VENDITA: TP-3000 = max 29000 animali/kg
    // animalsPerKg <= 29000 significa taglia vendibile (animali grandi)
    return animalsPerKg <= 29000;
  };
  
  // Helper function to get size code from the sizes table based on animalsPerKg
  const getSizeCodeFromAnimalsPerKg = (animalsPerKg: number): string => {
    if (!sizes || !Array.isArray(sizes)) return 'N/D';
    
    // Trova la taglia corrispondente in base al range min_animals_per_kg e max_animals_per_kg
    const matchingSize = sizes.find((size: any) => {
      // Se il numero di animali per kg rientra nel range di questa taglia
      return (
        (!size.minAnimalsPerKg || animalsPerKg >= size.minAnimalsPerKg) &&
        (!size.maxAnimalsPerKg || animalsPerKg <= size.maxAnimalsPerKg)
      );
    });
    
    // Se troviamo una taglia corrispondente, restituisci il suo codice
    if (matchingSize) {
      return matchingSize.code;
    }
    
    // Fallback se non troviamo una taglia corrispondente
    return `TP-${Math.round(animalsPerKg/1000)*1000}`;
  };

  // Helper function to get basket color class based on size
  // LOGICA COLORI: Verde = vendibili (TP-3000+), Rosso = non vendibili (sotto TP-3000)
  // Animali GRANDI = meno animali/kg = vendibili (VERDE)
  // Animali PICCOLI = più animali/kg = non vendibili (ROSSO)
  const getBasketColorClass = (basket: any) => {
    if (!basket) return 'bg-gray-100 border-dashed border-gray-300';
    
    // If basket is not active/occupied or has no current cycle, return a neutral color
    if ((basket.state !== 'active' && basket.state !== 'occupied') || !basket.currentCycleId) {
      return 'bg-gray-100 border-gray-300';
    }
    
    const latestOperation = getLatestOperation(basket.id);
    
    if (!latestOperation) {
      // Basket is active but has no operations
      return 'bg-blue-50 border-blue-300';
    }
    
    // IMPORTANTE: usa measurementAnimalsPerKg (da misura/prima-attivazione) per allineamento con expected-sizes
    const animalsPerKg = latestOperation.measurementAnimalsPerKg || latestOperation.animalsPerKg;
    if (!animalsPerKg) {
      return 'bg-blue-50 border-blue-300';
    }
    
    // SOGLIA VENDITA: TP-3000 = max 29000 animali/kg
    // animalsPerKg <= 29000 = VERDE (vendibili, animali grandi)
    // animalsPerKg > 29000 = ROSSO (non vendibili, animali piccoli)
    
    if (animalsPerKg <= 29000) {
      // VERDE - Vendibili (TP-3000 e superiori = animali grandi)
      // Intensità aumenta con animali più grandi (meno per kg)
      if (animalsPerKg <= 1200) {
        // TP-10000: 801-1200 - Verde più intenso
        return 'bg-green-600 border-green-800 text-white';
      } else if (animalsPerKg <= 1800) {
        // TP-9000: 1201-1800
        return 'bg-green-500 border-green-700 text-white';
      } else if (animalsPerKg <= 2300) {
        // TP-8000: 1801-2300
        return 'bg-green-400 border-green-600';
      } else if (animalsPerKg <= 3000) {
        // TP-7000: 2301-3000
        return 'bg-green-300 border-green-500';
      } else if (animalsPerKg <= 6000) {
        // TP-6000, TP-5500: 3001-6000
        return 'bg-green-200 border-green-400';
      } else if (animalsPerKg <= 9000) {
        // TP-5000: 6001-9000
        return 'bg-green-100 border-green-300';
      } else if (animalsPerKg <= 15000) {
        // TP-4500, TP-4000: 9001-15000
        return 'bg-emerald-100 border-emerald-300';
      } else if (animalsPerKg <= 20000) {
        // TP-3500: 15001-20000
        return 'bg-lime-100 border-lime-300';
      } else {
        // TP-3000: 20001-29000 - Verde più chiaro (soglia vendita)
        return 'bg-lime-50 border-lime-200';
      }
    } else {
      // ROSSO - Non vendibili (sotto TP-3000 = animali piccoli)
      // Intensità aumenta con animali più piccoli (più per kg)
      if (animalsPerKg <= 40000) {
        // TP-2800: 29001-40000 - Rosso più chiaro
        return 'bg-red-50 border-red-200';
      } else if (animalsPerKg <= 97000) {
        // TP-2500, TP-2000: 40001-97000
        return 'bg-red-100 border-red-300';
      } else if (animalsPerKg <= 190000) {
        // TP-1900, TP-1800: 97001-190000
        return 'bg-red-200 border-red-400';
      } else if (animalsPerKg <= 350000) {
        // TP-1500, TP-1260: 190001-350000
        return 'bg-red-300 border-red-500';
      } else if (animalsPerKg <= 880000) {
        // TP-1140, TP-1000: 350001-880000
        return 'bg-red-400 border-red-600';
      } else if (animalsPerKg <= 1000000) {
        // TP-800: 880001-1000000
        return 'bg-red-500 border-red-700 text-white';
      } else {
        // TP-700 e inferiori: > 1M animali/kg - Rosso più intenso
        return 'bg-red-600 border-red-800 text-white';
      }
    }
  };

  // Handle basket click to navigate to cycle detail for that basket
  const handleBasketClick = (basket: any) => {
    // Non possiamo procedere se non abbiamo i cicli
    if (!cycles || !Array.isArray(cycles)) {
      navigate(`/baskets/${basket.id}`);
      return;
    }

    // Trova tutti i cicli associati a questo cestello
    const basketCycles = cycles.filter((c: any) => c.basketId === basket.id);
    
    if (basketCycles.length === 0) {
      // Se non ci sono cicli, vai alla pagina del cestello
      navigate(`/baskets/${basket.id}`);
      return;
    }
    
    // Controlla prima se c'è un ciclo attivo
    const activeCycle = basketCycles.find((c: any) => c.state === 'active');
    
    if (activeCycle) {
      // Se c'è un ciclo attivo, usa quello
      navigate(`/cycles/${activeCycle.id}`);
      return;
    }
    
    // Altrimenti, ordina i cicli per data di inizio (decrescente) e prendi il più recente
    const sortedCycles = [...basketCycles].sort((a: any, b: any) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
    
    // Usa il ciclo più recente
    navigate(`/cycles/${sortedCycles[0].id}`);
  };

  // Render a basket position within a FLUPSY
  const renderBasketPosition = (flupsy: any, basket: any, highlightLargeSizes: boolean = false, highlightExpectedSizes: boolean = false) => {
    if (!basket) return null;
    
    // Get the latest operation for tooltip info
    const latestOperation = getLatestOperation(basket.id);
    
    // IMPORTANTE: usa measurementAnimalsPerKg (da misura/prima-attivazione) per taglia
    const measurementAnimalsPerKg = latestOperation?.measurementAnimalsPerKg || latestOperation?.animalsPerKg;
    
    // Check if this basket has a sellable size (TP-3000+)
    const isSellableSize = measurementAnimalsPerKg && measurementAnimalsPerKg <= 29000;
    
    // Check if basket has expected size change
    const expectedSizeInfo = getExpectedSizeInfo(basket.id);
    const hasExpectedChange = !!expectedSizeInfo;
    
    // Additional styling for "Con taglie grandi" mode
    let highlightClasses = '';
    let opacityClasses = '';
    
    if (highlightLargeSizes) {
      if (isSellableSize) {
        // Sellable baskets: golden ring + pulsing animation
        highlightClasses = 'ring-4 ring-yellow-400 ring-offset-2 shadow-lg animate-pulse';
      } else {
        // Non-sellable baskets: faded
        opacityClasses = 'opacity-40';
      }
    }
    
    // Expected size change mode: blink effect
    if (highlightExpectedSizes) {
      if (hasExpectedChange) {
        highlightClasses = 'animate-expected-size-blink';
      } else {
        opacityClasses = 'opacity-40';
      }
    }
    
    // Apply blink even in normal mode if basket has expected size change
    const blinkClass = hasExpectedChange && !highlightLargeSizes && !highlightExpectedSizes ? 'animate-expected-size-blink' : '';
    
    // Formato della cesta secondo l'immagine di riferimento
    return (
      <TooltipProvider key={`basket-${basket.id}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              onClick={() => handleBasketClick(basket)}
              className={`border rounded-md p-2 min-w-[140px] ${
                getBasketColorClass(basket)
              } ${highlightClasses} ${opacityClasses} ${blinkClass} cursor-pointer hover:shadow-md transition-all relative`}
            >
              {/* Star badge for sellable baskets in highlight mode */}
              {highlightLargeSizes && isSellableSize && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1 shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-800" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              )}
              {/* Mortality indicator - skull icon in top-left corner */}
              {latestOperation?.lastMortalityCount && latestOperation.lastMortalityCount > 0 && (
                <div className="absolute -top-1 -left-1" title={`Mortalità: ${latestOperation.lastMortalityCount} animali`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="10" r="7"/>
                    <circle cx="9" cy="9" r="1.5" fill="currentColor"/>
                    <circle cx="15" cy="9" r="1.5" fill="currentColor"/>
                    <path d="M9 14h6M10 17v3M14 17v3M12 14v6"/>
                  </svg>
                </div>
              )}
              <div className="text-xs text-center text-gray-500 font-medium">CESTA #{basket.physicalNumber}</div>
              
              {latestOperation && (
                <>
                  {/* Taglia registrata + taglia attesa se diversa - usa measurementAnimalsPerKg */}
                  <div className="font-bold text-sm text-center mt-1">
                    {measurementAnimalsPerKg && getSizeCodeFromAnimalsPerKg(measurementAnimalsPerKg)}
                    {hasExpectedChange && (
                      <span className="text-blue-600 ml-1">
                        → {expectedSizeInfo?.expectedSize}
                      </span>
                    )}
                  </div>
                  
                  {/* Peso totale e densità */}
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    <div className="text-[11px] text-gray-600">Qtà:</div>
                    <div className="text-[11px] text-right">
                      {latestOperation.totalWeight ? (latestOperation.totalWeight / 1000).toFixed(3).replace('.', ',') : '0'}kg
                    </div>
                    
                    <div className="text-[11px] text-gray-600">Nr.animali:</div>
                    <div className="text-[11px] text-right">
                      {latestOperation.animalCount?.toLocaleString('it-IT')}
                    </div>
                    
                    <div className="text-[11px] text-gray-600">Operazione:</div>
                    <div className="text-[11px] text-right">
                      {latestOperation.type === 'prima-attivazione' ? 'Prima Attivazione' : 
                       latestOperation.type === 'misurazione' ? 'Misurazione' :
                       latestOperation.type === 'misura' ? 'Misura' :
                       latestOperation.type === 'peso' ? 'Peso' :
                       latestOperation.type === 'vagliatura' ? 'Vagliatura' :
                       latestOperation.type === 'mortalita' ? 'Mortalità' :
                       latestOperation.type}
                    </div>
                  </div>
                </>
              )}
              
              {!latestOperation && (
                <div className="text-xs text-center my-2 text-gray-500">
                  {basket.currentCycleId ? (
                    <span className="text-blue-600">Attiva (dati in caricamento)</span>
                  ) : (
                    'In deposito'
                  )}
                </div>
              )}
            </div>
          </TooltipTrigger>
          
          {basket && latestOperation && (
            <TooltipContent side="top" className="w-64 p-3">
              <div className="space-y-2">
                <div className="flex justify-between font-bold">
                  <span>Cesta #{basket.physicalNumber}</span>
                  <span>ID: {basket.id}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Ultima operazione:</span>
                  <span>{getOperationTypeLabel(latestOperation.type)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Data:</span>
                  <span>{format(new Date(latestOperation.date), 'dd/MM/yyyy')}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Taglia:</span>
                  <span className="font-semibold">
                    {measurementAnimalsPerKg ? 
                      getSizeCodeFromAnimalsPerKg(measurementAnimalsPerKg) : 'N/D'}
                  </span>
                </div>
                
                {measurementAnimalsPerKg && (
                  <div className="flex justify-between">
                    <span className="font-medium">Densità:</span>
                    <span>{measurementAnimalsPerKg.toLocaleString('it-IT')} animali/kg</span>
                  </div>
                )}
                
                {latestOperation.lotId && (
                  <>
                    <div className="flex justify-between">
                      <span className="font-medium">Lotto:</span>
                      <span>#{latestOperation.lotId}</span>
                    </div>
                    {lots && (
                      <div className="flex justify-between">
                        <span className="font-medium">Fornitore:</span>
                        <span>{lots.find((l: any) => l.id === latestOperation.lotId)?.supplier || 'N/D'}</span>
                      </div>
                    )}
                  </>
                )}
                
                {latestOperation.lastMortalityCount && latestOperation.lastMortalityCount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span className="font-medium">Ultima mortalità:</span>
                    <span>
                      {latestOperation.lastMortalityCount} animali 
                      {latestOperation.lastMortalityRate != null && ` (${latestOperation.lastMortalityRate < 0.01 ? '<0,01' : latestOperation.lastMortalityRate.toFixed(2).replace('.', ',')}%)`}
                      {latestOperation.lastMortalityDate && ` - ${format(new Date(latestOperation.lastMortalityDate), 'dd/MM/yy')}`}
                    </span>
                  </div>
                )}
                
                {latestOperation.notes && (
                  <div className="mt-1 pt-1 border-t">
                    <span className="font-medium">Note:</span>
                    <p className="text-xs mt-1">{latestOperation.notes}</p>
                  </div>
                )}
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Get filter label name for export
  const getFilterLabel = (tab: string): string => {
    const labels: Record<string, string> = {
      all: 'Tutti i FLUPSY',
      active: 'Con cestelli attivi',
      large: 'Con taglie grandi',
      expected: 'Con taglie attese',
      highMortality: 'Con mortalità alta',
      needsMeasure: 'Da misurare',
      readyHarvest: 'Pronte raccolta',
      heavyWeight: 'Peso elevato'
    };
    return labels[tab] || tab;
  };

  // Get filtered baskets based on current tab
  const getFilteredBasketsForExport = (): { basket: any; flupsy: any; latestOp: any }[] => {
    const result: { basket: any; flupsy: any; latestOp: any }[] = [];
    
    flupsys?.forEach((flupsy: any) => {
      const flupsyBaskets = filteredBaskets?.filter((b: any) => b.flupsyId === flupsy.id) || [];
      
      flupsyBaskets.forEach((basket: any) => {
        const latestOp = getLatestOperation(basket.id);
        let include = false;
        
        switch (selectedTab) {
          case 'all':
            include = true;
            break;
          case 'active':
            include = basket.state === 'active';
            break;
          case 'large':
            include = hasLargeSize(basket);
            break;
          case 'expected':
            include = hasExpectedSizeChange(basket.id);
            break;
          case 'highMortality':
            include = hasHighMortality(basket);
            break;
          case 'needsMeasure':
            include = needsMeasurement(basket.id);
            break;
          case 'readyHarvest':
            include = isReadyForHarvest(basket);
            break;
          case 'heavyWeight':
            include = hasHeavyWeight(basket);
            break;
        }
        
        if (include) {
          result.push({ basket, flupsy, latestOp });
        }
      });
    });
    
    return result;
  };

  // Export to Excel
  const handleExportExcel = async () => {
    const filteredData = getFilteredBasketsForExport();
    if (filteredData.length === 0) return;

    const ExcelModule = (ExcelJS as any).default || ExcelJS;
    const workbook = new ExcelModule.Workbook();
    const reportDate = format(new Date(), 'dd/MM/yyyy HH:mm');
    const filterLabel = getFilterLabel(selectedTab);

    const worksheet = workbook.addWorksheet('Ceste Filtrate');

    // Title row
    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `Export Ceste - Filtro: ${filterLabel} - ${reportDate}`;
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF1E40AF' } };
    titleCell.alignment = { horizontal: 'left' };

    // Header row
    const headers = ['FLUPSY', 'Fila', 'Cesta', 'Stato', 'Taglia', 'An/kg', 'Peso (kg)', 'Mortalità %', 'Ultima misura'];
    worksheet.addRow(headers);
    const headerRow = worksheet.getRow(2);
    headerRow.eachCell((cell: any) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
      cell.alignment = { horizontal: 'center' };
    });

    // Group by FLUPSY and add data rows
    const groupedByFlupsy = new Map<string, typeof filteredData>();
    filteredData.forEach(item => {
      const flupsyName = item.flupsy?.name || 'Sconosciuto';
      if (!groupedByFlupsy.has(flupsyName)) {
        groupedByFlupsy.set(flupsyName, []);
      }
      groupedByFlupsy.get(flupsyName)!.push(item);
    });

    let currentRow = 3;
    let totalAnimals = 0;
    let totalWeight = 0;
    let totalMortality = 0;
    let mortalityCount = 0;
    let basketCount = 0;

    groupedByFlupsy.forEach((items, flupsyName) => {
      // FLUPSY group header
      worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
      const groupCell = worksheet.getCell(`A${currentRow}`);
      groupCell.value = flupsyName;
      groupCell.font = { bold: true, size: 11, color: { argb: 'FF1E40AF' } };
      groupCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
      currentRow++;

      items.forEach((item, idx) => {
        const { basket, latestOp } = item;
        const animalsPerKg = latestOp?.measurementAnimalsPerKg || latestOp?.animalsPerKg;
        const sizeCode = animalsPerKg ? getSizeCodeFromAnimalsPerKg(animalsPerKg) : 'N/D';
        const weightKg = latestOp?.totalWeight ? (latestOp.totalWeight / 1000).toFixed(2) : '';
        const mortality = latestOp?.mortalityRate;
        const lastDate = latestOp?.date ? format(new Date(latestOp.date), 'dd/MM/yyyy') : '';

        worksheet.addRow([
          '',
          basket.row || 'N/D',
          basket.physicalNumber || basket.id,
          basket.state || 'N/D',
          sizeCode,
          animalsPerKg || '',
          weightKg,
          mortality !== null && mortality !== undefined ? mortality.toFixed(2) : '',
          lastDate
        ]);

        // Alternating row colors
        const row = worksheet.getRow(currentRow);
        if (idx % 2 === 1) {
          row.eachCell((cell: any) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
          });
        }

        // Accumulate totals
        if (animalsPerKg) totalAnimals += animalsPerKg;
        if (latestOp?.totalWeight) totalWeight += latestOp.totalWeight;
        if (mortality !== null && mortality !== undefined) {
          totalMortality += mortality;
          mortalityCount++;
        }
        basketCount++;
        currentRow++;
      });
    });

    // Totals row
    worksheet.addRow([]);
    currentRow++;
    const totalsRow = worksheet.addRow([
      'TOTALE',
      '',
      basketCount + ' ceste',
      '',
      '',
      '',
      (totalWeight / 1000).toFixed(2) + ' kg',
      mortalityCount > 0 ? (totalMortality / mortalityCount).toFixed(2) + '% media' : '',
      ''
    ]);
    totalsRow.eachCell((cell: any) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    // Column widths
    worksheet.columns = [
      { width: 18 }, // FLUPSY
      { width: 8 },  // Fila
      { width: 10 }, // Cesta
      { width: 12 }, // Stato
      { width: 12 }, // Taglia
      { width: 12 }, // An/kg
      { width: 12 }, // Peso
      { width: 14 }, // Mortalità
      { width: 14 }, // Ultima misura
    ];

    // Auto filter
    worksheet.autoFilter = { from: 'A2', to: 'I2' };

    // Download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ceste_${selectedTab}_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Function to render a single FLUPSY
  const renderFlupsy = (flupsy: any, highlightLargeSizes: boolean = false, highlightExpectedSizes: boolean = false, basketFilter?: (basket: any) => boolean) => {
    // Estrai il valore max_positions dal database (accettando varie possibili denominazioni)
    const maxPositionsFromDB = flupsy.max_positions || flupsy.maxPositions || flupsy.maxPosition || flupsy["max-positions"];
    const maxPositions = maxPositionsFromDB || 10; // Fallback se il valore non è presente
    
    // Il numero di posizioni deve essere esattamente la metà del valore max_positions per ogni fila
    const positionsPerRow = Math.floor(maxPositions / 2);
    
    // Se il valore è dispari, aggiungiamo una posizione in più alla fila DX (per arrotondare)
    const dxPositions = maxPositions % 2 === 0 ? positionsPerRow : positionsPerRow + 1;
    const sxPositions = positionsPerRow;
    
    // Trova i cestelli per questo FLUPSY
    // Mostra solo i cestelli con ciclo attivo
    let dxBaskets = allBaskets
      ?.filter((b: any) => b.flupsyId === flupsy.id && b.row === 'DX' && b.currentCycleId)
      .sort((a: any, b: any) => a.position - b.position) || [];
      
    let sxBaskets = allBaskets
      ?.filter((b: any) => b.flupsyId === flupsy.id && b.row === 'SX' && b.currentCycleId)
      .sort((a: any, b: any) => a.position - b.position) || [];

    // Applica filtro aggiuntivo se specificato
    if (basketFilter) {
      dxBaskets = dxBaskets.filter(basketFilter);
      sxBaskets = sxBaskets.filter(basketFilter);
    }
    
    // Prepara gli array per contenere tutte le posizioni, incluse quelle vuote
    const dxPositionsArray = Array(dxPositions).fill(null);
    const sxPositionsArray = Array(sxPositions).fill(null);
    
    // Popola le posizioni con i cestelli esistenti
    dxBaskets.forEach((basket: any) => {
      if (basket.position > 0 && basket.position <= dxPositions) {
        dxPositionsArray[basket.position - 1] = basket;
      }
    });
    
    sxBaskets.forEach((basket: any) => {
      if (basket.position > 0 && basket.position <= sxPositions) {
        sxPositionsArray[basket.position - 1] = basket;
      }
    });

    // Calculate FLUPSY-specific stats
    const flupsyStats = getFlupsyStats(flupsy.id);

    return (
      <div key={`flupsy-${flupsy.id}`} className="mb-8">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-blue-500 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M7 12H17" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 7L12 17" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <div>
              <h3 className="text-lg font-bold">{flupsy.name}</h3>
              <div className="text-xs text-gray-500">{maxPositions} ceste</div>
            </div>
          </div>
          
          {/* Stato salute unità - FLUPSY metrics box */}
          {flupsyStats.activeCount > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
              <span className="text-[10px] font-semibold text-slate-600 whitespace-nowrap">Stato salute unità:</span>
              <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-0.5 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">
                        <AlertTriangle className="h-2.5 w-2.5 text-red-600" />
                        <span className="text-red-700">Critiche:</span>
                        <span className="font-bold text-red-600">{flupsyStats.critical}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Ceste con mortalità superiore al 10%</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-0.5 bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5">
                        <AlertCircle className="h-2.5 w-2.5 text-orange-600" />
                        <span className="text-orange-700">Attenzione:</span>
                        <span className="font-bold text-orange-600">{flupsyStats.warning}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Ceste con mortalità tra 5% e 10%</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-0.5 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
                        <CheckCircle className="h-2.5 w-2.5 text-green-600" />
                        <span className="text-green-700">In salute:</span>
                        <span className="font-bold text-green-600">{flupsyStats.healthy}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Ceste con mortalità inferiore al 5%</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <span className="text-slate-300">|</span>
                
                {/* SGR Medio con trend */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-0.5 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
                        <span className="text-blue-700">SGR:</span>
                        <span className="font-bold text-blue-600">
                          {flupsyStats.avgSgr !== null ? `${flupsyStats.avgSgr.toFixed(2)}%` : 'N/D'}
                        </span>
                        {flupsyStats.avgSgr !== null && flupsyStats.sgrTrend === 'up' && (
                          <TrendingUp className="h-2.5 w-2.5 text-green-500" />
                        )}
                        {flupsyStats.avgSgr !== null && flupsyStats.sgrTrend === 'down' && (
                          <TrendingDown className="h-2.5 w-2.5 text-red-500" />
                        )}
                        {flupsyStats.avgSgr !== null && flupsyStats.sgrTrend === 'stable' && (
                          <Minus className="h-2.5 w-2.5 text-gray-400" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      SGR medio (tasso di crescita specifico) - {flupsyStats.sgrTrend === 'up' ? 'In aumento' : flupsyStats.sgrTrend === 'down' ? 'In diminuzione' : 'Stabile'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {/* Mortalità media con trend */}
                {flupsyStats.avgMortality !== null && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 border ${
                          flupsyStats.avgMortality > 5 
                            ? 'bg-red-50 border-red-200' 
                            : 'bg-green-50 border-green-200'
                        }`}>
                          <span className={flupsyStats.avgMortality > 5 ? 'text-red-700' : 'text-green-700'}>
                            Mort:
                          </span>
                          <span className={`font-bold ${flupsyStats.avgMortality > 5 ? 'text-red-600' : 'text-green-600'}`}>
                            {flupsyStats.avgMortality.toFixed(1)}%
                          </span>
                          {flupsyStats.mortalityTrend === 'up' && (
                            <TrendingUp className="h-2.5 w-2.5 text-red-500" />
                          )}
                          {flupsyStats.mortalityTrend === 'down' && (
                            <TrendingDown className="h-2.5 w-2.5 text-green-500" />
                          )}
                          {flupsyStats.mortalityTrend === 'stable' && (
                            <Minus className="h-2.5 w-2.5 text-gray-400" />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        Mortalità media - {flupsyStats.mortalityTrend === 'up' ? 'In aumento ⚠️' : flupsyStats.mortalityTrend === 'down' ? 'In diminuzione ✓' : 'Stabile'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {flupsyStats.noMeasure > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-0.5 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                          <Clock className="h-2.5 w-2.5 text-amber-600" />
                          <span className="text-amber-700">Da misurare:</span>
                          <span className="font-bold text-amber-600">{flupsyStats.noMeasure}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Ceste senza misura da più di 7 giorni</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          )}
          
          <Badge variant="outline" className="text-xs">
            {flupsy.location || 'N/D'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* DX row */}
          <div>
            <div className="flex items-center mb-1">
              <Badge className="bg-blue-100 hover:bg-blue-200 text-blue-800 mr-2">Fila DX</Badge>
              <Separator className="flex-grow" />
            </div>
            
            <div className="flex items-center">
              {/* Elica (propeller) a sinistra */}
              <div className="mr-3 flex-shrink-0">
                <svg className="w-10 h-10 text-blue-500 animate-spin-slow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 2C14.5 4 16 8 16 12C16 16 14.5 20 12 22C9.5 20 8 16 8 12C8 8 9.5 4 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              
              {/* Ceste DX */}
              <div className="flex flex-row gap-2 overflow-x-auto pb-2">
                {dxPositionsArray.map((basket, index) => (
                  basket ? renderBasketPosition(flupsy, basket, highlightLargeSizes, highlightExpectedSizes) : (
                    <div 
                      key={`empty-dx-${index}`}
                      className="border border-dashed border-gray-300 rounded-md p-2 min-w-[140px] text-center"
                    >
                      <div className="text-xs text-gray-500">CESTA #{index + 1}</div>
                      <div className="text-xs text-gray-400 my-2">Non attiva</div>
                      <div className="text-xs text-gray-400">In deposito</div>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
          
          {/* SX row */}
          <div>
            <div className="flex items-center mb-1">
              <Badge className="bg-blue-100 hover:bg-blue-200 text-blue-800 mr-2">Fila SX</Badge>
              <Separator className="flex-grow" />
            </div>
            
            <div className="flex items-center">
              {/* Elica (propeller) a sinistra */}
              <div className="mr-3 flex-shrink-0">
                <svg className="w-10 h-10 text-blue-500 animate-spin-slow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 2C14.5 4 16 8 16 12C16 16 14.5 20 12 22C9.5 20 8 16 8 12C8 8 9.5 4 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              
              {/* Ceste SX */}
              <div className="flex flex-row gap-2 overflow-x-auto pb-2">
                {sxPositionsArray.map((basket, index) => (
                  basket ? renderBasketPosition(flupsy, basket, highlightLargeSizes, highlightExpectedSizes) : (
                    <div 
                      key={`empty-sx-${index}`}
                      className="border border-dashed border-gray-300 rounded-md p-2 min-w-[140px] text-center"
                    >
                      <div className="text-xs text-gray-500">CESTA #{index + 1}</div>
                      <div className="text-xs text-gray-400 my-2">Non attiva</div>
                      <div className="text-xs text-gray-400">In deposito</div>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {isLoadingFlupsys || isLoadingBaskets || isLoadingOperations || isLoadingCycles ? (
        <div className="text-center p-4">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Caricamento dati in corso...</p>
        </div>
      ) : flupsys.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-48 bg-gray-50 rounded-lg border border-dashed border-gray-300 p-4">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Nessun FLUPSY selezionato</h3>
          <p className="text-sm text-gray-500 text-center mb-4">
            Seleziona uno o più FLUPSY dal selettore sopra per visualizzare i dati.
          </p>
          <p className="text-xs text-gray-400 text-center">
            I FLUPSY vengono mostrati deselezionati all'avvio per ottimizzare il caricamento della dashboard.
          </p>
        </div>
      ) : (
        <>
          {/* Titolo e legenda */}
          <div className="mb-4">
            <h2 className="text-lg font-bold mb-2">Visualizzazione FLUPSY</h2>
            <p className="text-sm text-gray-500 mb-2">Disposizione delle ceste attive con dati</p>
            
          </div>
          
          {/* Tab filter for FLUPSY status */}
          <Tabs
            defaultValue="all"
            value={selectedTab}
            onValueChange={setSelectedTab}
            className="w-full"
          >
            <div className="flex items-center justify-between mb-4 gap-2">
            <TabsList className="flex-wrap h-auto gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="all" className={selectedTab === 'all' ? 'bg-gray-500 text-white' : 'bg-gray-100'}>Tutti i FLUPSY</TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Mostra tutti i FLUPSY senza filtri</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="active" className={selectedTab === 'active' ? 'bg-blue-500 text-white' : 'bg-blue-100'}>Con cestelli attivi</TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>FLUPSY con almeno un cestello con ciclo attivo</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="large" className={selectedTab === 'large' ? 'bg-green-500 text-white' : 'bg-green-100'}>Con taglie grandi</TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Cestelli con taglia TP-3000 o superiore (≤29.000 animali/kg)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="expected" className={selectedTab === 'expected' ? 'bg-yellow-500 text-white' : 'bg-yellow-100'}>Con taglie attese</TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Cestelli la cui taglia attesa differisce dalla taglia registrata</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="highMortality" className={selectedTab === 'highMortality' ? 'bg-red-500 text-white' : 'bg-red-100'}>Con mortalità alta</TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Cestelli con mortalità superiore al 10%</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="needsMeasure" className={selectedTab === 'needsMeasure' ? 'bg-orange-500 text-white' : 'bg-orange-100'}>Da misurare</TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Cestelli senza misura da più di 7 giorni</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="readyHarvest" className={selectedTab === 'readyHarvest' ? 'bg-purple-500 text-white' : 'bg-purple-100'}>Pronte raccolta</TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Cestelli con taglia TP-3000 o superiore, pronti per la vendita</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="heavyWeight" className={selectedTab === 'heavyWeight' ? 'bg-teal-500 text-white' : 'bg-teal-100'}>Peso elevato</TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Cestelli con peso totale superiore a 20 kg</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TabsList>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAssignGroupDialogOpen(true)}
                    className="flex items-center gap-2 whitespace-nowrap"
                    disabled={getFilteredBasketsForExport().length === 0}
                  >
                    <Users className="h-4 w-4" />
                    Assegna a gruppo
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Assegna le ceste del filtro attivo a un gruppo</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 whitespace-nowrap bg-green-500 hover:bg-green-600 text-white border-green-500 hover:border-green-600"
                  >
                    <Download className="h-4 w-4" />
                    Esporta Excel
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Esporta le ceste del filtro attivo in Excel</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            </div>
            
            <AssignGroupDialog
              open={isAssignGroupDialogOpen}
              onOpenChange={setIsAssignGroupDialogOpen}
              selectedBasketIds={getFilteredBasketsForExport().map(item => item.basket.id)}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/baskets'] });
                queryClient.invalidateQueries({ queryKey: ['/api/basket-groups'] });
              }}
            />
            
            <TabsContent value="all" className="space-y-4">
              {flupsys?.map((flupsy: any) => renderFlupsy(flupsy))}
            </TabsContent>
            
            <TabsContent value="active" className="space-y-4">
              {flupsys?.filter((flupsy: any) => {
                const flupsyBaskets = filteredBaskets?.filter((b: any) => b.flupsyId === flupsy.id);
                return flupsyBaskets?.some((b: any) => b.state === 'active');
              }).map((flupsy: any) => renderFlupsy(flupsy))}
            </TabsContent>
            
            <TabsContent value="large" className="space-y-4">
              {flupsys?.filter((flupsy: any) => {
                const flupsyBaskets = filteredBaskets?.filter((b: any) => b.flupsyId === flupsy.id);
                return flupsyBaskets?.some((b: any) => hasLargeSize(b));
              }).map((flupsy: any) => renderFlupsy(flupsy, true))}
            </TabsContent>
            
            <TabsContent value="expected" className="space-y-4">
              {flupsys?.filter((flupsy: any) => {
                const flupsyBaskets = filteredBaskets?.filter((b: any) => b.flupsyId === flupsy.id);
                return flupsyBaskets?.some((b: any) => hasExpectedSizeChange(b.id));
              }).map((flupsy: any) => renderFlupsy(flupsy, false, true))}
            </TabsContent>

            <TabsContent value="highMortality" className="space-y-4">
              {flupsys?.filter((flupsy: any) => {
                const flupsyBaskets = filteredBaskets?.filter((b: any) => b.flupsyId === flupsy.id);
                return flupsyBaskets?.some((b: any) => hasHighMortality(b));
              }).map((flupsy: any) => renderFlupsy(flupsy, false, false, hasHighMortality))}
            </TabsContent>

            <TabsContent value="needsMeasure" className="space-y-4">
              {flupsys?.filter((flupsy: any) => {
                const flupsyBaskets = filteredBaskets?.filter((b: any) => b.flupsyId === flupsy.id);
                return flupsyBaskets?.some((b: any) => needsMeasurement(b.id));
              }).map((flupsy: any) => renderFlupsy(flupsy, false, false, (b: any) => needsMeasurement(b.id)))}
            </TabsContent>

            <TabsContent value="readyHarvest" className="space-y-4">
              {flupsys?.filter((flupsy: any) => {
                const flupsyBaskets = filteredBaskets?.filter((b: any) => b.flupsyId === flupsy.id);
                return flupsyBaskets?.some((b: any) => isReadyForHarvest(b));
              }).map((flupsy: any) => renderFlupsy(flupsy, false, false, isReadyForHarvest))}
            </TabsContent>

            <TabsContent value="heavyWeight" className="space-y-4">
              {flupsys?.filter((flupsy: any) => {
                const flupsyBaskets = filteredBaskets?.filter((b: any) => b.flupsyId === flupsy.id);
                return flupsyBaskets?.some((b: any) => hasHeavyWeight(b));
              }).map((flupsy: any) => renderFlupsy(flupsy, false, false, hasHeavyWeight))}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}