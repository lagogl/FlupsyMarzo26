import { useMemo } from 'react';
import { Link } from 'wouter';
import { AlertTriangle, AlertCircle, CheckCircle, Activity, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HealthStatusCardProps {
  operations: any[];
  cycles: any[];
  baskets: any[];
}

export default function HealthStatusCard({ operations, cycles, baskets }: HealthStatusCardProps) {
  const healthStats = useMemo(() => {
    if (!operations || !cycles || !baskets) {
      return {
        critical: 0,
        warning: 0,
        healthy: 0,
        avgSgr: null,
        avgMortality: null,
        noRecentOps: 0,
        trend: 'stable' as const
      };
    }

    const activeCycleIds = new Set(cycles.filter((c: any) => c.status === 'active').map((c: any) => c.id));
    
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
    let totalSgr = 0;
    let sgrCount = 0;
    let totalMortality = 0;
    let mortalityCount = 0;
    let noRecentOps = 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeBaskets = baskets.filter((b: any) => 
      b.state === 'active' || b.state === 'occupied'
    );

    activeBaskets.forEach((basket: any) => {
      const latestOp = latestOpsByBasket.get(basket.id);
      
      if (!latestOp) {
        noRecentOps++;
        return;
      }

      const opDate = new Date(latestOp.date);
      if (opDate < sevenDaysAgo) {
        noRecentOps++;
      }

      if (latestOp.sgrPeso !== null && latestOp.sgrPeso !== undefined && latestOp.sgrPeso > 0) {
        totalSgr += latestOp.sgrPeso;
        sgrCount++;
      }

      if (latestOp.mortality !== null && latestOp.mortality !== undefined) {
        totalMortality += latestOp.mortality;
        mortalityCount++;
      }

      const performance = latestOp.sgrPeso || 0;
      const mortality = latestOp.mortality || 0;

      if (performance < 0.5 || mortality > 10) {
        critical++;
      } else if (performance < 1.0 || mortality > 5) {
        warning++;
      } else {
        healthy++;
      }
    });

    const avgSgr = sgrCount > 0 ? totalSgr / sgrCount : null;
    const avgMortality = mortalityCount > 0 ? totalMortality / mortalityCount : null;

    const recentOps = relevantOps
      .filter((op: any) => op.sgrPeso && op.sgrPeso > 0)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (recentOps.length >= 4) {
      const recent = recentOps.slice(0, Math.floor(recentOps.length / 2));
      const older = recentOps.slice(Math.floor(recentOps.length / 2));
      
      const recentAvg = recent.reduce((sum: number, op: any) => sum + op.sgrPeso, 0) / recent.length;
      const olderAvg = older.reduce((sum: number, op: any) => sum + op.sgrPeso, 0) / older.length;
      
      if (recentAvg > olderAvg * 1.1) trend = 'up';
      else if (recentAvg < olderAvg * 0.9) trend = 'down';
    }

    return {
      critical,
      warning,
      healthy,
      avgSgr,
      avgMortality,
      noRecentOps,
      trend
    };
  }, [operations, cycles, baskets]);

  const total = healthStats.critical + healthStats.warning + healthStats.healthy;

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-l-4 border-slate-500 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-slate-500/20 flex items-center justify-center">
            <Activity className="h-5 w-5 text-slate-600" />
          </div>
          Stato Salute Ceste
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-xs text-red-700 font-medium">Critiche</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{healthStats.critical}</div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span className="text-xs text-orange-700 font-medium">Attenzione</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{healthStats.warning}</div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-700 font-medium">In Salute</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{healthStats.healthy}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">SGR Medio Impianto</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-blue-600">
                {healthStats.avgSgr !== null ? healthStats.avgSgr.toFixed(2) : 'N/D'}
              </span>
              {healthStats.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
              {healthStats.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
              {healthStats.trend === 'stable' && <Minus className="h-4 w-4 text-gray-400" />}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Mortalità Media</span>
            <span className={`font-semibold ${
              healthStats.avgMortality !== null && healthStats.avgMortality > 5 
                ? 'text-red-600' 
                : 'text-green-600'
            }`}>
              {healthStats.avgMortality !== null ? `${healthStats.avgMortality.toFixed(1)}%` : 'N/D'}
            </span>
          </div>
          
          {healthStats.noRecentOps > 0 && (
            <div className="flex justify-between items-center pt-1 border-t">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Senza operazioni {">"} 7gg
              </span>
              <span className="font-semibold text-amber-600">{healthStats.noRecentOps}</span>
            </div>
          )}
        </div>

        <Link href="/spreadsheet-operations" className="block">
          <div className="text-xs text-center text-blue-600 hover:text-blue-800 cursor-pointer">
            Vai allo Spreadsheet Operazioni →
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}
