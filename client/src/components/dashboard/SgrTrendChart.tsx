import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

interface SgrTrendChartProps {
  operations: any[];
  cycles: any[];
}

export default function SgrTrendChart({ operations, cycles }: SgrTrendChartProps) {
  const chartData = useMemo(() => {
    if (!operations || !cycles) {
      return { weeklyData: [], trend: 'stable' as const, currentAvg: null, previousAvg: null };
    }

    const activeCycleIds = new Set(cycles.filter((c: any) => c.status === 'active').map((c: any) => c.id));
    
    const relevantOps = operations.filter((op: any) => 
      op.cycleId && activeCycleIds.has(op.cycleId) && 
      (op.type === 'misura' || op.type === 'prima-attivazione') &&
      op.sgrPeso && op.sgrPeso > 0
    ).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const weeklyMap = new Map<string, { total: number; count: number; date: Date }>();
    
    relevantOps.forEach((op: any) => {
      const date = new Date(op.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      const existing = weeklyMap.get(weekKey) || { total: 0, count: 0, date: weekStart };
      existing.total += op.sgrPeso;
      existing.count += 1;
      weeklyMap.set(weekKey, existing);
    });

    const weeklyData = Array.from(weeklyMap.entries())
      .map(([key, data]) => ({
        week: key,
        weekLabel: formatWeekLabel(data.date),
        avgSgr: data.total / data.count,
        count: data.count
      }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-8);

    let trend: 'up' | 'down' | 'stable' = 'stable';
    let currentAvg: number | null = null;
    let previousAvg: number | null = null;

    if (weeklyData.length >= 2) {
      currentAvg = weeklyData[weeklyData.length - 1].avgSgr;
      previousAvg = weeklyData[weeklyData.length - 2].avgSgr;
      
      if (currentAvg > previousAvg * 1.05) trend = 'up';
      else if (currentAvg < previousAvg * 0.95) trend = 'down';
    } else if (weeklyData.length === 1) {
      currentAvg = weeklyData[0].avgSgr;
    }

    return { weeklyData, trend, currentAvg, previousAvg };
  }, [operations, cycles]);

  function formatWeekLabel(date: Date): string {
    const day = date.getDate();
    const month = date.toLocaleDateString('it-IT', { month: 'short' });
    return `${day} ${month}`;
  }

  const maxSgr = Math.max(...chartData.weeklyData.map(d => d.avgSgr), 1);
  const minSgr = Math.min(...chartData.weeklyData.map(d => d.avgSgr), 0);
  const range = maxSgr - minSgr || 1;

  const getBarHeight = (sgr: number) => {
    return Math.max(10, ((sgr - minSgr) / range) * 100);
  };

  const getSgrColor = (sgr: number) => {
    if (sgr >= 1.5) return 'bg-green-500';
    if (sgr >= 1.0) return 'bg-green-400';
    if (sgr >= 0.5) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-l-4 border-indigo-500 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Activity className="h-5 w-5 text-indigo-600" />
            </div>
            Trend SGR Medio Impianto
          </CardTitle>
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 shadow-sm">
            <span className="text-sm text-gray-600">Attuale:</span>
            <span className="font-bold text-lg text-indigo-600">
              {chartData.currentAvg !== null ? chartData.currentAvg.toFixed(2) : 'N/D'}
            </span>
            {chartData.trend === 'up' && <TrendingUp className="h-5 w-5 text-green-500" />}
            {chartData.trend === 'down' && <TrendingDown className="h-5 w-5 text-red-500" />}
            {chartData.trend === 'stable' && <Minus className="h-5 w-5 text-gray-400" />}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.weeklyData.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-end justify-between h-32 gap-1 px-2">
              {chartData.weeklyData.map((week, idx) => (
                <div key={week.week} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full relative group"
                    style={{ height: '100px' }}
                  >
                    <div 
                      className={`absolute bottom-0 w-full rounded-t-md transition-all ${getSgrColor(week.avgSgr)} hover:opacity-80`}
                      style={{ height: `${getBarHeight(week.avgSgr)}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        SGR: {week.avgSgr.toFixed(2)} ({week.count} op.)
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between gap-1 px-2 border-t pt-2">
              {chartData.weeklyData.map((week) => (
                <div key={week.week} className="flex-1 text-center">
                  <span className="text-[10px] text-gray-500">{week.weekLabel}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4 text-xs pt-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span className="text-gray-600">Ottimo (≥1.5)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-400"></div>
                <span className="text-gray-600">Buono (≥1.0)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-400"></div>
                <span className="text-gray-600">Medio (≥0.5)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-400"></div>
                <span className="text-gray-600">Basso ({"<"}0.5)</span>
              </div>
            </div>

            {chartData.previousAvg !== null && chartData.currentAvg !== null && (
              <div className="bg-white rounded-lg p-2 text-center text-sm">
                <span className="text-gray-600">Variazione settimanale: </span>
                <span className={`font-semibold ${
                  chartData.currentAvg > chartData.previousAvg ? 'text-green-600' : 
                  chartData.currentAvg < chartData.previousAvg ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {chartData.currentAvg > chartData.previousAvg ? '+' : ''}
                  {((chartData.currentAvg - chartData.previousAvg) / chartData.previousAvg * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nessun dato SGR disponibile</p>
              <p className="text-xs">Effettua operazioni di misura per visualizzare il trend</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
