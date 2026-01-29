import { useMemo } from 'react';
import { Link } from 'wouter';
import { AlertTriangle, AlertCircle, CheckCircle, Activity, Clock } from 'lucide-react';
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
        avgMortality: null,
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
    let noRecentOps = 0;
    
    const daysSinceLastMeasure: number[] = [];
    const today = new Date();

    activeBaskets.forEach((basket: any) => {
      const latestOp = latestOpsByBasket.get(basket.id);
      
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

      if (latestOp.mortalityRate !== null && latestOp.mortalityRate !== undefined) {
        totalMortality += latestOp.mortalityRate;
        mortalityCount++;
      }

      const mortality = latestOp.mortalityRate || 0;

      // Classificazione basata solo su mortalità (SGR non disponibile nelle operazioni)
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

    return {
      critical,
      warning,
      healthy,
      avgMortality,
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
              <span className="text-gray-600">Mortalità Media</span>
              <span className={`font-semibold ${
                stats.avgMortality !== null && stats.avgMortality > 5 
                  ? 'text-red-600' 
                  : 'text-green-600'
              }`}>
                {stats.avgMortality !== null ? `${stats.avgMortality.toFixed(1)}%` : 'N/D'}
              </span>
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
