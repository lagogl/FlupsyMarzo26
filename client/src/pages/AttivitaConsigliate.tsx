import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Brush, 
  FlaskConical, 
  Scale, 
  Ruler, 
  Fish,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Brain,
  RefreshCw,
  Target,
  Layers,
  Factory
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Link } from "wouter";

type ActivityType = 'pulizia' | 'campionamento' | 'calibratura' | 'misura' | 'raccolta';
type Priority = 'alta' | 'media' | 'suggerimento';

interface RecommendedActivity {
  id: string;
  type: ActivityType;
  priority: Priority;
  basketId: number;
  basketPhysicalNumber: number;
  flupsyId: number;
  flupsyName: string;
  cycleId: number | null;
  reason: string;
  daysSinceLastOperation: number | null;
  lastOperationDate: string | null;
  additionalInfo?: string;
}

interface ActivitiesResponse {
  success: boolean;
  date: string;
  totalActivities: number;
  highPriority: number;
  mediumPriority: number;
  suggestions: number;
  activities: RecommendedActivity[];
}

const activityConfig: Record<ActivityType, { icon: typeof Brush; label: string; color: string }> = {
  pulizia: { icon: Brush, label: 'Pulizia', color: 'bg-blue-500' },
  campionamento: { icon: FlaskConical, label: 'Campionamento', color: 'bg-purple-500' },
  calibratura: { icon: Scale, label: 'Calibratura', color: 'bg-orange-500' },
  misura: { icon: Ruler, label: 'Misura', color: 'bg-green-500' },
  raccolta: { icon: Fish, label: 'Raccolta', color: 'bg-teal-500' },
};

const priorityConfig: Record<Priority, { label: string; color: string; bgColor: string; icon: typeof AlertTriangle }> = {
  alta: { label: 'Priorità Alta', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200', icon: AlertTriangle },
  media: { label: 'Priorità Media', color: 'text-yellow-700', bgColor: 'bg-yellow-50 border-yellow-200', icon: Clock },
  suggerimento: { label: 'Suggerimento', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200', icon: CheckCircle2 },
};

function ActivityCard({ activity }: { activity: RecommendedActivity }) {
  const config = activityConfig[activity.type];
  const priorityConf = priorityConfig[activity.priority];
  const IconComponent = config.icon;

  return (
    <Card className={`${priorityConf.bgColor} border transition-all hover:shadow-md`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`${config.color} p-3 rounded-lg text-white shrink-0`}>
            <IconComponent className="h-6 w-6" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">{config.label}</h3>
              <Badge variant="outline" className={priorityConf.color}>
                {priorityConf.label}
              </Badge>
            </div>
            
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Cestello {activity.basketPhysicalNumber}</span>
              <span className="mx-2">•</span>
              <span>{activity.flupsyName}</span>
            </div>
            
            <p className="text-sm text-gray-700 mb-2">{activity.reason}</p>
            
            {activity.additionalInfo && (
              <p className="text-xs text-gray-500 italic">{activity.additionalInfo}</p>
            )}
            
            {activity.daysSinceLastOperation !== null && (
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{activity.daysSinceLastOperation} giorni fa</span>
              </div>
            )}
          </div>
          
          <div className="shrink-0">
            <Link href={`/operations?flupsyId=${activity.flupsyId}&basketId=${activity.basketId}`}>
              <Button size="sm" variant="outline">
                <Target className="h-4 w-4 mr-1" />
                Vai
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivitySection({ title, activities, icon: Icon, colorClass }: { 
  title: string; 
  activities: RecommendedActivity[]; 
  icon: typeof AlertTriangle;
  colorClass: string;
}) {
  if (activities.length === 0) return null;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${colorClass}`} />
        <h2 className={`font-semibold ${colorClass}`}>{title}</h2>
        <Badge variant="secondary">{activities.length}</Badge>
      </div>
      <div className="grid gap-3">
        {activities.map(activity => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
}

type GroupBy = 'priority' | 'flupsy' | 'type';

export default function AttivitaConsigliate() {
  const [selectedFlupsyId, setSelectedFlupsyId] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<GroupBy>("priority");

  const { data: flupsys } = useQuery<any[]>({
    queryKey: ['/api/flupsys'],
  });

  const { data: activitiesData, isLoading, refetch, isFetching } = useQuery<ActivitiesResponse>({
    queryKey: ['/api/ai/recommended-activities', selectedFlupsyId !== 'all' ? selectedFlupsyId : null],
    queryFn: async () => {
      const url = selectedFlupsyId !== 'all' 
        ? `/api/ai/recommended-activities?flupsyId=${selectedFlupsyId}`
        : '/api/ai/recommended-activities';
      const res = await fetch(url);
      return res.json();
    },
    refetchInterval: 60000,
  });

  const activities = activitiesData?.activities || [];
  
  const groupedByPriority = {
    alta: activities.filter(a => a.priority === 'alta'),
    media: activities.filter(a => a.priority === 'media'),
    suggerimento: activities.filter(a => a.priority === 'suggerimento'),
  };

  const groupedByFlupsy = activities.reduce((acc, activity) => {
    const key = activity.flupsyName || 'Sconosciuto';
    if (!acc[key]) acc[key] = [];
    acc[key].push(activity);
    return acc;
  }, {} as Record<string, RecommendedActivity[]>);

  const groupedByType = activities.reduce((acc, activity) => {
    const key = activity.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(activity);
    return acc;
  }, {} as Record<string, RecommendedActivity[]>);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader 
        title="Attività Consigliate Oggi" 
        description="Suggerimenti AI basati sui dati dell'impianto per ottimizzare crescita e ridurre mortalità"
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Analisi AI</CardTitle>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={selectedFlupsyId} onValueChange={setSelectedFlupsyId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tutti i FLUPSY" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i FLUPSY</SelectItem>
                  {flupsys?.map((flupsy: any) => (
                    <SelectItem key={flupsy.id} value={flupsy.id.toString()}>
                      {flupsy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
                <SelectTrigger className="w-[180px]">
                  <Layers className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Raggruppa per..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">Per Priorità</SelectItem>
                  <SelectItem value="flupsy">Per FLUPSY</SelectItem>
                  <SelectItem value="type">Per Tipo Attività</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
                Aggiorna
              </Button>
            </div>
          </div>
          <CardDescription>
            L'AI analizza i dati presenti nel database e genera raccomandazioni operative (pulizia, campionamento, calibratura, misure e raccolta)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          ) : activitiesData?.success ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-gray-900">{activitiesData.totalActivities}</p>
                  <p className="text-sm text-gray-600">Attività Totali</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-red-600">{activitiesData.highPriority}</p>
                  <p className="text-sm text-red-700">Priorità Alta</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-600">{activitiesData.mediumPriority}</p>
                  <p className="text-sm text-yellow-700">Priorità Media</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{activitiesData.suggestions}</p>
                  <p className="text-sm text-green-700">Suggerimenti</p>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              {activitiesData.totalActivities === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Tutto in ordine!</h3>
                  <p className="text-gray-600">
                    Non ci sono attività urgenti da svolgere. Tutti i cestelli sono aggiornati.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {groupBy === 'priority' && (
                    <>
                      <ActivitySection 
                        title="Priorità Alta" 
                        activities={groupedByPriority.alta}
                        icon={AlertTriangle}
                        colorClass="text-red-600"
                      />
                      <ActivitySection 
                        title="Priorità Media" 
                        activities={groupedByPriority.media}
                        icon={Clock}
                        colorClass="text-yellow-600"
                      />
                      <ActivitySection 
                        title="Suggerimenti" 
                        activities={groupedByPriority.suggerimento}
                        icon={CheckCircle2}
                        colorClass="text-green-600"
                      />
                    </>
                  )}
                  
                  {groupBy === 'flupsy' && (
                    <>
                      {Object.entries(groupedByFlupsy)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([flupsyName, acts]) => (
                          <ActivitySection 
                            key={flupsyName}
                            title={flupsyName} 
                            activities={acts}
                            icon={Factory}
                            colorClass="text-blue-600"
                          />
                        ))}
                    </>
                  )}
                  
                  {groupBy === 'type' && (
                    <>
                      {Object.entries(groupedByType)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([type, acts]) => {
                          const config = activityConfig[type as ActivityType];
                          return (
                            <ActivitySection 
                              key={type}
                              title={config?.label || type} 
                              activities={acts}
                              icon={config?.icon || Brush}
                              colorClass="text-gray-700"
                            />
                          );
                        })}
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Errore nel caricamento</h3>
              <p className="text-gray-600 mb-4">
                Si è verificato un errore durante il caricamento delle attività consigliate.
              </p>
              <Button onClick={() => refetch()}>Riprova</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
