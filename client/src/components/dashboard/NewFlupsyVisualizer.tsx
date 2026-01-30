import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Fan } from 'lucide-react';
import { getOperationTypeLabel } from '@/lib/utils';

interface NewFlupsyVisualizerProps {
  selectedFlupsyIds?: number[];
}

export default function NewFlupsyVisualizer({ selectedFlupsyIds = [] }: NewFlupsyVisualizerProps) {
  const [, navigate] = useLocation();
  const [selectedTab, setSelectedTab] = useState<string>("all");

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

  // Helper to check if basket has high mortality (>10%)
  const hasHighMortality = (basket: any): boolean => {
    if (!basket || !basket.currentCycleId) return false;
    const mortality = mortalityRates?.find(m => 
      m.basketId === basket.id && m.cycleId === basket.currentCycleId
    );
    return mortality ? mortality.mortalityPercent > 10 : false;
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

  // Helper to check if basket is ready for harvest (large size + heavy weight)
  const isReadyForHarvest = (basket: any): boolean => {
    if (!hasLargeSize(basket)) return false;
    const latestOp = getLatestOperation(basket.id);
    if (!latestOp?.totalWeight) return false;
    return latestOp.totalWeight > 20000; // More than 20kg
  };

  // Helper to get expected size info
  const getExpectedSizeInfo = (basketId: number) => {
    return expectedSizesMap.get(basketId);
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

  // Function to render a single FLUPSY
  const renderFlupsy = (flupsy: any, highlightLargeSizes: boolean = false, highlightExpectedSizes: boolean = false) => {
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
    const dxBaskets = allBaskets
      ?.filter((b: any) => b.flupsyId === flupsy.id && b.row === 'DX' && b.currentCycleId)
      .sort((a: any, b: any) => a.position - b.position) || [];
      
    const sxBaskets = allBaskets
      ?.filter((b: any) => b.flupsyId === flupsy.id && b.row === 'SX' && b.currentCycleId)
      .sort((a: any, b: any) => a.position - b.position) || [];
    
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

    return (
      <div key={`flupsy-${flupsy.id}`} className="mb-8">
        <div className="flex items-center justify-between mb-2">
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
          <Badge variant="outline" className="text-xs">
            Ca {flupsy.location || 'Pisani'}
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
            <TabsList className="mb-4 flex-wrap h-auto gap-1">
              <TabsTrigger value="all" className="data-[state=active]:bg-gray-200">Tutti i FLUPSY</TabsTrigger>
              <TabsTrigger value="active" className="data-[state=active]:bg-blue-200">Con cestelli attivi</TabsTrigger>
              <TabsTrigger value="large" className="data-[state=active]:bg-green-200">Con taglie grandi</TabsTrigger>
              <TabsTrigger value="expected" className="data-[state=active]:bg-yellow-200">Con taglie attese</TabsTrigger>
              <TabsTrigger value="highMortality" className="data-[state=active]:bg-red-200">Con mortalità alta</TabsTrigger>
              <TabsTrigger value="needsMeasure" className="data-[state=active]:bg-orange-200">Da misurare</TabsTrigger>
              <TabsTrigger value="readyHarvest" className="data-[state=active]:bg-purple-200">Pronte raccolta</TabsTrigger>
            </TabsList>
            
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
              }).map((flupsy: any) => renderFlupsy(flupsy))}
            </TabsContent>

            <TabsContent value="needsMeasure" className="space-y-4">
              {flupsys?.filter((flupsy: any) => {
                const flupsyBaskets = filteredBaskets?.filter((b: any) => b.flupsyId === flupsy.id);
                return flupsyBaskets?.some((b: any) => needsMeasurement(b.id));
              }).map((flupsy: any) => renderFlupsy(flupsy))}
            </TabsContent>

            <TabsContent value="readyHarvest" className="space-y-4">
              {flupsys?.filter((flupsy: any) => {
                const flupsyBaskets = filteredBaskets?.filter((b: any) => b.flupsyId === flupsy.id);
                return flupsyBaskets?.some((b: any) => isReadyForHarvest(b));
              }).map((flupsy: any) => renderFlupsy(flupsy))}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}