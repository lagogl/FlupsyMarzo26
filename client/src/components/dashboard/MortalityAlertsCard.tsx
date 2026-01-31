import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, AlertCircle, Info, TrendingUp, TrendingDown, Target, CheckCircle, Skull, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface MortalityAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  pattern: string;
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

interface MortalityAnalysisData {
  success: boolean;
  date: string;
  alerts: MortalityAlert[];
  topAffectedBaskets: {
    basketId: number;
    physicalNumber: number;
    flupsyName: string;
    totalDeaths: number;
    mortalityEvents: number;
    avgMortalityRate: number;
    lastMortalityDate: string;
    daysSinceLastMortality: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }[];
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

export default function MortalityAlertsCard() {
  const [isOpen, setIsOpen] = useState(false);
  
  const { data, isLoading, error } = useQuery<MortalityAnalysisData>({
    queryKey: ['/api/ai/mortality-analysis'],
    staleTime: 300000,
    refetchInterval: 300000,
  });

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Analisi AI Mortalità
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.success) {
    return null;
  }

  const { alerts, summary, topAffectedBaskets, patterns } = data;

  const SeverityIcon = ({ severity }: { severity: string }) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const StatusBadge = () => {
    const config = {
      critical: { bg: 'bg-red-100', text: 'text-red-700', label: 'Critico', icon: AlertTriangle },
      warning: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Attenzione', icon: AlertCircle },
      healthy: { bg: 'bg-green-100', text: 'text-green-700', label: 'Normale', icon: CheckCircle }
    };
    const status = config[summary.overallStatus];
    const Icon = status.icon;
    
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${status.bg} ${status.text}`}>
        <Icon className="h-3 w-3" />
        {status.label}
      </span>
    );
  };

  const TrendIcon = ({ trend }: { trend: string }) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-3 w-3 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="h-3 w-3 text-green-500" />;
      default:
        return <Activity className="h-3 w-3 text-gray-500" />;
    }
  };

  return (
    <Card className={`${summary.overallStatus === 'critical' ? 'border-red-300' : summary.overallStatus === 'warning' ? 'border-yellow-300' : ''}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Skull className="h-4 w-4" />
              Analisi AI Mortalità
            </CardTitle>
            <div className="flex items-center gap-2">
              <StatusBadge />
              <CollapsibleTrigger className="hover:bg-gray-100 p-1 rounded">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className={`p-1.5 rounded ${summary.criticalCount > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
              <div className="text-lg font-bold text-red-600">{summary.criticalCount}</div>
              <div className="text-[10px] text-muted-foreground">Critici</div>
            </div>
            <div className={`p-1.5 rounded ${summary.warningCount > 0 ? 'bg-yellow-50' : 'bg-gray-50'}`}>
              <div className="text-lg font-bold text-yellow-600">{summary.warningCount}</div>
              <div className="text-[10px] text-muted-foreground">Attenzione</div>
            </div>
            <div className="p-1.5 rounded bg-blue-50">
              <div className="text-lg font-bold text-blue-600">{summary.infoCount}</div>
              <div className="text-[10px] text-muted-foreground">Info</div>
            </div>
            <div className="p-1.5 rounded bg-gray-50">
              <div className="text-lg font-bold">{summary.recentMortalityPercentage}%</div>
              <div className="text-[10px] text-muted-foreground">Recente</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {patterns.hasMortalitySpike && (
              <Badge variant="destructive" className="text-[10px]">Picco</Badge>
            )}
            {patterns.hasPersistentMortality && (
              <Badge variant="outline" className="text-[10px] border-yellow-400 text-yellow-700">Persistente</Badge>
            )}
            {patterns.hasLocalizedProblem && (
              <Badge variant="outline" className="text-[10px] border-orange-400 text-orange-700">Localizzata</Badge>
            )}
            {patterns.isImproving && (
              <Badge variant="outline" className="text-[10px] border-green-400 text-green-700">In miglioramento</Badge>
            )}
          </div>

          <CollapsibleContent className="space-y-3">
            {alerts.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <div className="text-xs font-medium text-muted-foreground">Alert Attivi</div>
                {alerts.slice(0, 3).map((alert) => (
                  <TooltipProvider key={alert.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={`p-2 rounded-lg border cursor-pointer ${
                          alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                          alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                          'bg-blue-50 border-blue-200'
                        }`}>
                          <div className="flex items-start gap-2">
                            <SeverityIcon severity={alert.severity} />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium truncate">{alert.title}</div>
                              <div className="text-[10px] text-muted-foreground truncate">{alert.description}</div>
                            </div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <div className="space-y-2">
                          <p className="font-medium">{alert.title}</p>
                          <p className="text-sm">{alert.description}</p>
                          <p className="text-sm text-green-600">
                            <strong>Raccomandazione:</strong> {alert.recommendation}
                          </p>
                          {alert.affectedFlupsys.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              FLUPSY: {alert.affectedFlupsys.join(', ')}
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            )}

            {topAffectedBaskets.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <div className="text-xs font-medium text-muted-foreground">Ceste più colpite</div>
                <div className="space-y-1">
                  {topAffectedBaskets.slice(0, 5).map((basket) => (
                    <div key={basket.basketId} className="flex items-center justify-between text-xs p-1.5 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <TrendIcon trend={basket.trend} />
                        <span className="font-medium">#{basket.physicalNumber}</span>
                        <span className="text-muted-foreground">{basket.flupsyName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-red-600 font-medium">{basket.totalDeaths} morti</span>
                        <span className="text-muted-foreground">({basket.mortalityEvents} eventi)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}
