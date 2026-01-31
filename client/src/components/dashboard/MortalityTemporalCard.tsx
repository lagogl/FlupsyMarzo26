import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skull, TrendingUp, TrendingDown, Minus, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MortalityTemporalData {
  success: boolean;
  periods: {
    recent: {
      basketsAffected: number;
      totalDead: number;
      totalSampled: number;
      avgMortalityRate: number;
      label: string;
      oldestDate?: string;
      newestDate?: string;
    };
    medium: {
      basketsAffected: number;
      totalDead: number;
      totalSampled: number;
      avgMortalityRate: number;
      label: string;
    };
    old: {
      basketsAffected: number;
      totalDead: number;
      totalSampled: number;
      avgMortalityRate: number;
      label: string;
    };
  };
  weeklyComparison: {
    currentWeek: number;
    previousWeek: number;
    trend: 'up' | 'down' | 'stable';
    trendPercent: number;
  };
  totalMortality: number;
  recentMortalityRatio: number;
  populationStats: {
    totalInitial: number;
    totalCurrent: number;
    estimatedTotalDead: number;
    estimatedMortalityPercent: number;
  };
}

interface MortalityTemporalCardProps {
  flupsyId?: number;
}

export default function MortalityTemporalCard({ flupsyId }: MortalityTemporalCardProps) {
  const { data, isLoading, error } = useQuery<MortalityTemporalData>({
    queryKey: ['/api/stats/mortality-temporal', { flupsyId }],
  });

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Analisi Mortalità Temporale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.success) {
    return null;
  }

  const { periods, weeklyComparison, totalMortality, recentMortalityRatio, populationStats } = data;
  
  const TrendIcon = weeklyComparison.trend === 'up' ? TrendingUp : 
                    weeklyComparison.trend === 'down' ? TrendingDown : Minus;
  
  const trendColor = weeklyComparison.trend === 'up' ? 'text-red-500' : 
                     weeklyComparison.trend === 'down' ? 'text-green-500' : 'text-gray-500';

  const isRecentCritical = periods.recent.totalDead > 0 && periods.recent.avgMortalityRate > 10;
  const hasRecentMortality = periods.recent.totalDead > 0;

  return (
    <Card className={`${isRecentCritical ? 'border-red-300 bg-red-50/50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Skull className="h-4 w-4" />
            Analisi Mortalità Temporale
          </CardTitle>
          {isRecentCritical && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Attenzione
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`p-2 rounded-lg ${periods.recent.totalDead > 0 ? 'bg-red-100 border border-red-200' : 'bg-gray-100'}`}>
                  <div className="flex items-center gap-1 text-xs text-red-700 font-medium">
                    <AlertTriangle className="h-3 w-3" />
                    Recente
                  </div>
                  <div className="text-lg font-bold text-red-600">
                    {periods.recent.avgMortalityRate.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-red-500">
                    {periods.recent.basketsAffected} ceste
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">Ultimi 3 giorni</p>
                <p>Mortalità ponderata: {periods.recent.avgMortalityRate.toFixed(2)}%</p>
                <p>Ceste con mortalità: {periods.recent.basketsAffected}</p>
                {periods.recent.newestDate && <p>Ultima: {new Date(periods.recent.newestDate).toLocaleDateString('it-IT')}</p>}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`p-2 rounded-lg ${periods.medium.totalDead > 0 ? 'bg-yellow-100 border border-yellow-200' : 'bg-gray-100'}`}>
                  <div className="flex items-center gap-1 text-xs text-yellow-700 font-medium">
                    <Clock className="h-3 w-3" />
                    Monitorare
                  </div>
                  <div className="text-lg font-bold text-yellow-600">
                    {periods.medium.avgMortalityRate.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-yellow-600">
                    {periods.medium.basketsAffected} ceste
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">4-7 giorni fa</p>
                <p>Mortalità ponderata: {periods.medium.avgMortalityRate.toFixed(2)}%</p>
                <p>Ceste con mortalità: {periods.medium.basketsAffected}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`p-2 rounded-lg ${periods.old.totalDead > 0 ? 'bg-green-100 border border-green-200' : 'bg-gray-100'}`}>
                  <div className="flex items-center gap-1 text-xs text-green-700 font-medium">
                    <CheckCircle className="h-3 w-3" />
                    Storica
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    {periods.old.avgMortalityRate.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-green-600">
                    {periods.old.basketsAffected} ceste
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">Oltre 7 giorni fa</p>
                <p>Mortalità ponderata: {periods.old.avgMortalityRate.toFixed(2)}%</p>
                <p>Ceste con mortalità: {periods.old.basketsAffected}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Trend settimanale
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
            <TrendIcon className="h-4 w-4" />
            {weeklyComparison.trend === 'up' && '+'}
            {weeklyComparison.trendPercent}%
            <span className="text-xs text-muted-foreground ml-1">
              ({weeklyComparison.currentWeek} vs {weeklyComparison.previousWeek})
            </span>
          </div>
        </div>

        {hasRecentMortality && (
          <div className="text-xs text-center py-1 bg-red-50 text-red-700 rounded border border-red-200">
            {Math.round(recentMortalityRatio * 100)}% della mortalità è recente (ultimi 3 giorni)
          </div>
        )}

        {populationStats && populationStats.estimatedTotalDead > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs text-center py-2 bg-gray-50 text-gray-700 rounded border border-gray-200 cursor-help">
                  <span className="font-medium">Morti stimati totali:</span>{' '}
                  <span className="text-red-600 font-bold">
                    ~{populationStats.estimatedTotalDead.toLocaleString('it-IT')}
                  </span>{' '}
                  <span className="text-muted-foreground">
                    ({populationStats.estimatedMortalityPercent.toFixed(2)}% della popolazione)
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">Stima basata sulla differenza animali</p>
                <p>Animali iniziali: {populationStats.totalInitial.toLocaleString('it-IT')}</p>
                <p>Animali attuali: {populationStats.totalCurrent.toLocaleString('it-IT')}</p>
                <p>Differenza (morti stimati): {populationStats.estimatedTotalDead.toLocaleString('it-IT')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
