import { useMemo } from 'react';
import { Link } from 'wouter';
import { AlertTriangle, AlertCircle, CheckCircle, Activity, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface HealthSgrCardProps {
  operations: any[];
  activeCycles: any[];
  activeBaskets: any[];
}

export default function HealthSgrCard({ operations, activeCycles, activeBaskets }: HealthSgrCardProps) {
  const stats = useMemo(() => {
    if (!operations || !activeCycles || !activeBaskets || activeBaskets.length === 0) {
      return {
        critical: 0,
        warning: 0,
        healthy: 0,
        avgSgr: null,
        avgMortality: null,
        sgrTrend: 'stable' as const,
        mortalityTrend: 'stable' as const,
        noRecentOps: 0,
        avgDaysSinceMeasure: null,
        maxDaysSinceMeasure: null
      };
    }

    const activeCycleIds = new Set(activeCycles.map((c: any) => c.id));
    
    const relevantOps = operations.filter((op: any) => 
      op.cycleId && activeCycleIds.has(op.cycleId) && 
      (op.type === 'misura' || op.type === 'prima-attivazione')
    );

    const latestOpsByBasket = new Map<number, any>();
    relevantOps.forEach((op: any) => {
      if (op.basketId) {
        const existing = latestOpsByBasket.get(op.basketId);
        if (!existing || new Date(op.date) > new Date(existing.date)) {
          latestOpsByBasket.set(op.basketId, op);
        }
      }
    });

    let critical = 0;
    let warning = 0;
    let healthy = 0;
    let totalMortality = 0;
    let mortalityCount = 0;
    let totalPrevMortality = 0;
    let prevMortalityCount = 0;
    let totalSgr = 0;
    let sgrCount = 0;
    let totalPrevSgr = 0;
    let prevSgrCount = 0;
    let noRecentOps = 0;
    
    const daysSinceLastMeasure: number[] = [];
    const today = new Date();

    // Raggruppa operazioni per cesta e ordina per data
    const opsByBasket = new Map<number, any[]>();
    relevantOps.forEach((op: any) => {
      if (op.basketId) {
        const ops = opsByBasket.get(op.basketId) || [];
        ops.push(op);
        opsByBasket.set(op.basketId, ops);
      }
    });

    // Ordina le operazioni di ogni cesta per data (più recente prima)
    opsByBasket.forEach((ops, basketId) => {
      ops.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    activeBaskets.forEach((basket: any) => {
      const basketOps = opsByBasket.get(basket.id) || [];
      const latestOp = basketOps[0];
      
      if (!latestOp) {
        noRecentOps++;
        daysSinceLastMeasure.push(999);
        return;
      }

      const opDate = new Date(latestOp.date);
      const daysDiff = Math.floor((today.getTime() - opDate.getTime()) / (1000 * 60 * 60 * 24));
      daysSinceLastMeasure.push(daysDiff);
      
      if (daysDiff > 7) {
        noRecentOps++;
      }

      // Mortalità attuale (ultima operazione)
      if (latestOp.mortalityRate !== null && latestOp.mortalityRate !== undefined) {
        totalMortality += latestOp.mortalityRate;
        mortalityCount++;
      }

      // Mortalità precedente (penultima operazione) per trend
      if (basketOps.length >= 2 && basketOps[1].mortalityRate !== null && basketOps[1].mortalityRate !== undefined) {
        totalPrevMortality += basketOps[1].mortalityRate;
        prevMortalityCount++;
      }

      // Calcolo SGR attuale tra le ultime 2 operazioni
      if (basketOps.length >= 2) {
        const op1 = basketOps[0];
        const op2 = basketOps[1];
        
        if (op1.totalWeight && op2.totalWeight && op1.totalWeight > 0 && op2.totalWeight > 0) {
          const date1 = new Date(op1.date);
          const date2 = new Date(op2.date);
          const days = Math.max(1, Math.floor((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24)));
          const sgr = ((Math.log(op1.totalWeight) - Math.log(op2.totalWeight)) / days) * 100;
          
          if (sgr > -50 && sgr < 50) {
            totalSgr += sgr;
            sgrCount++;
          }
        }
      }

      // Calcolo SGR precedente tra 3a e 4a operazione per trend
      if (basketOps.length >= 4) {
        const op3 = basketOps[2];
        const op4 = basketOps[3];
        
        if (op3.totalWeight && op4.totalWeight && op3.totalWeight > 0 && op4.totalWeight > 0) {
          const date3 = new Date(op3.date);
          const date4 = new Date(op4.date);
          const days = Math.max(1, Math.floor((date3.getTime() - date4.getTime()) / (1000 * 60 * 60 * 24)));
          const prevSgr = ((Math.log(op3.totalWeight) - Math.log(op4.totalWeight)) / days) * 100;
          
          if (prevSgr > -50 && prevSgr < 50) {
            totalPrevSgr += prevSgr;
            prevSgrCount++;
          }
        }
      }

      const mortality = latestOp.mortalityRate || 0;

      // Classificazione basata su mortalità
      if (mortality > 10) {
        critical++;
      } else if (mortality > 5) {
        warning++;
      } else {
        healthy++;
      }
    });

    const validDays = daysSinceLastMeasure.filter(d => d < 999);
    const avgDaysSinceMeasure = validDays.length > 0 
      ? validDays.reduce((a, b) => a + b, 0) / validDays.length 
      : null;
    const maxDaysSinceMeasure = validDays.length > 0 
      ? Math.max(...validDays) 
      : null;

    const avgMortality = mortalityCount > 0 ? totalMortality / mortalityCount : null;
    const avgPrevMortality = prevMortalityCount > 0 ? totalPrevMortality / prevMortalityCount : null;
    const avgSgr = sgrCount > 0 ? totalSgr / sgrCount : null;
    const avgPrevSgr = prevSgrCount > 0 ? totalPrevSgr / prevSgrCount : null;

    // Calcolo trend (soglia 5% per considerare variazione significativa)
    let sgrTrend: 'up' | 'down' | 'stable' = 'stable';
    if (avgSgr !== null && avgPrevSgr !== null) {
      const sgrChange = ((avgSgr - avgPrevSgr) / Math.abs(avgPrevSgr)) * 100;
      if (sgrChange > 5) sgrTrend = 'up';
      else if (sgrChange < -5) sgrTrend = 'down';
    }

    let mortalityTrend: 'up' | 'down' | 'stable' = 'stable';
    if (avgMortality !== null && avgPrevMortality !== null) {
      const mortChange = ((avgMortality - avgPrevMortality) / Math.abs(avgPrevMortality || 1)) * 100;
      if (mortChange > 5) mortalityTrend = 'up'; // mortalità aumenta = negativo
      else if (mortChange < -5) mortalityTrend = 'down'; // mortalità diminuisce = positivo
    }

    return {
      critical,
      warning,
      healthy,
      avgSgr,
      avgMortality,
      sgrTrend,
      mortalityTrend,
      noRecentOps,
      avgDaysSinceMeasure,
      maxDaysSinceMeasure
    };
  }, [operations, activeCycles, activeBaskets]);

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-purple-100 border-l-4 border-purple-500 h-full">
      <CardContent className="p-4 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Activity className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-800">Stato Impianto</div>
            <div className="text-xs text-gray-500">Salute ceste e trend SGR</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 mb-3">
          <div className="bg-red-50 border border-red-200 rounded px-2 py-1 text-center">
            <div className="flex items-center justify-center gap-1">
              <AlertTriangle className="h-3 w-3 text-red-600" />
              <span className="text-[10px] text-red-700">Critiche</span>
            </div>
            <div className="text-lg font-bold text-red-600">{stats.critical}</div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded px-2 py-1 text-center">
            <div className="flex items-center justify-center gap-1">
              <AlertCircle className="h-3 w-3 text-orange-600" />
              <span className="text-[10px] text-orange-700">Attenzione</span>
            </div>
            <div className="text-lg font-bold text-orange-600">{stats.warning}</div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded px-2 py-1 text-center">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span className="text-[10px] text-green-700">In Salute</span>
            </div>
            <div className="text-lg font-bold text-green-600">{stats.healthy}</div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center bg-white rounded px-2 py-1">
              <span className="text-gray-600">SGR Medio</span>
              <div className="flex items-center gap-1">
                <span className={`font-semibold ${
                  stats.avgSgr !== null && stats.avgSgr > 0 
                    ? 'text-blue-600' 
                    : 'text-gray-600'
                }`}>
                  {stats.avgSgr !== null ? `${stats.avgSgr.toFixed(2)}%` : 'N/D'}
                </span>
                {stats.sgrTrend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                {stats.sgrTrend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                {stats.sgrTrend === 'stable' && stats.avgSgr !== null && <Minus className="h-3 w-3 text-gray-400" />}
              </div>
            </div>
            
            <div className="flex justify-between items-center bg-white rounded px-2 py-1">
              <span className="text-gray-600">Mortalità Media</span>
              <div className="flex items-center gap-1">
                <span className={`font-semibold ${
                  stats.avgMortality !== null && stats.avgMortality > 5 
                    ? 'text-red-600' 
                    : 'text-green-600'
                }`}>
                  {stats.avgMortality !== null ? `${stats.avgMortality.toFixed(1)}%` : 'N/D'}
                </span>
                {stats.mortalityTrend === 'up' && <TrendingUp className="h-3 w-3 text-red-500" />}
                {stats.mortalityTrend === 'down' && <TrendingDown className="h-3 w-3 text-green-500" />}
                {stats.mortalityTrend === 'stable' && stats.avgMortality !== null && <Minus className="h-3 w-3 text-gray-400" />}
              </div>
            </div>

            <div className="flex justify-between items-center bg-white rounded px-2 py-1">
              <span className="text-gray-600">Giorni da ultima misura</span>
              <span className="font-semibold text-gray-700">
                {stats.avgDaysSinceMeasure !== null && stats.maxDaysSinceMeasure !== null
                  ? `${stats.avgDaysSinceMeasure.toFixed(0)} med / ${stats.maxDaysSinceMeasure} max`
                  : 'N/D'}
              </span>
            </div>

            <div className="flex justify-between items-center bg-amber-50 rounded px-2 py-1">
              <span className="text-gray-600 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Ceste senza misura {">"}7gg
              </span>
              <span className={`font-semibold ${stats.noRecentOps > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {stats.noRecentOps}
              </span>
            </div>
          </div>

          <Link href="/spreadsheet-operations" className="block mt-2">
            <div className="text-[10px] text-center text-purple-600 hover:text-purple-800">
              Vai allo Spreadsheet →
            </div>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
