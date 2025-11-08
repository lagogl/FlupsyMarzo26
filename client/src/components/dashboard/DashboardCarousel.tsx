import { useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight, AlertTriangle, TrendingUp, Users, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface Task {
  id: number;
  taskType: string;
  description: string;
  priority: string;
  status: string;
  dueDate: string | null;
  assignments?: Array<{
    operatorFirstName: string;
    operatorLastName: string;
  }>;
}

interface DashboardCarouselProps {
  tasks?: Task[];
  operationStats?: {
    totalWeight: number;
    totalAnimalsProcessed: number;
    mostCommonOperation: string | null;
  };
  activeOperatorsCount?: number;
}

export default function DashboardCarousel({ 
  tasks = [], 
  operationStats,
  activeOperatorsCount = 0 
}: DashboardCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      align: 'start',
    },
    [Autoplay({ delay: 5000, stopOnInteraction: true })]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const urgentTasks = tasks
    .filter(t => t.priority === 'urgent' || t.priority === 'high')
    .filter(t => t.status !== 'completed' && t.status !== 'cancelled')
    .slice(0, 5);

  const tasksNearDueDate = tasks
    .filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      const dueDate = new Date(t.dueDate);
      const today = new Date();
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 3;
    })
    .slice(0, 3);

  const completedToday = tasks.filter(t => {
    if (!t.status || t.status !== 'completed') return false;
    return true;
  }).length;

  const taskTypeLabels: Record<string, string> = {
    pesatura: "Pesatura",
    vagliatura: "Vagliatura",
    pulizia: "Pulizia",
    selezione: "Selezione",
    trasferimento: "Trasferimento",
  };

  const priorityColors = {
    urgent: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-blue-500",
    low: "bg-slate-500",
  };

  const slides = [];

  if (urgentTasks.length > 0) {
    slides.push(
      <div key="urgent-tasks" className="flex-[0_0_100%] min-w-0 px-2">
        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-6 h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-900 dark:text-red-100">Attività Urgenti</h3>
              <p className="text-sm text-red-700 dark:text-red-300">Richiedono attenzione immediata</p>
            </div>
          </div>
          <div className="space-y-2">
            {urgentTasks.map(task => (
              <div key={task.id} className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3 border border-red-200/50 dark:border-red-800/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                        {task.priority === 'urgent' ? 'Urgente' : 'Alta'}
                      </Badge>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {taskTypeLabels[task.taskType] || task.taskType}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 truncate">{task.description || 'Nessuna descrizione'}</p>
                    {task.dueDate && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Scadenza: {format(new Date(task.dueDate), 'dd MMM', { locale: it })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (operationStats && (operationStats.totalWeight > 0 || operationStats.totalAnimalsProcessed > 0)) {
    slides.push(
      <div key="stats" className="flex-[0_0_100%] min-w-0 px-2">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">Attività Oggi</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">Statistiche odierne</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {operationStats.totalWeight > 0 && (
              <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4 border border-blue-200/50 dark:border-blue-800/50">
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Peso Lavorato</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {(operationStats.totalWeight / 1000).toFixed(1)} kg
                </p>
              </div>
            )}
            {operationStats.totalAnimalsProcessed > 0 && (
              <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4 border border-blue-200/50 dark:border-blue-800/50">
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Animali Processati</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {operationStats.totalAnimalsProcessed.toLocaleString('it-IT')}
                </p>
              </div>
            )}
            {completedToday > 0 && (
              <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4 border border-blue-200/50 dark:border-blue-800/50">
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Attività Completate</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{completedToday}</p>
              </div>
            )}
            {activeOperatorsCount > 0 && (
              <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4 border border-blue-200/50 dark:border-blue-800/50">
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Operatori Attivi</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{activeOperatorsCount}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (tasksNearDueDate.length > 0) {
    slides.push(
      <div key="due-soon" className="flex-[0_0_100%] min-w-0 px-2">
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-6 h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">In Scadenza</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">Prossimi 3 giorni</p>
            </div>
          </div>
          <div className="space-y-2">
            {tasksNearDueDate.map(task => (
              <div key={task.id} className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3 border border-amber-200/50 dark:border-amber-800/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {taskTypeLabels[task.taskType] || task.taskType}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 truncate">{task.description || 'Nessuna descrizione'}</p>
                    {task.dueDate && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Scadenza: {format(new Date(task.dueDate), 'dd MMMM', { locale: it })}
                      </p>
                    )}
                    {task.assignments && task.assignments.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Users className="h-3 w-3 text-gray-500" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {task.assignments.length} {task.assignments.length === 1 ? 'operatore' : 'operatori'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="mb-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-900 dark:text-green-100">Tutto sotto controllo</h3>
              <p className="text-sm text-green-700 dark:text-green-300">Nessuna attività urgente al momento</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 relative" data-testid="dashboard-carousel">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 shadow-md"
            onClick={scrollPrev}
            data-testid="carousel-prev"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 shadow-md"
            onClick={scrollNext}
            data-testid="carousel-next"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}
    </div>
  );
}
