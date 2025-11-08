import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, TrendingUp, Users, Calendar } from 'lucide-react';
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

interface InfoTickerProps {
  tasks?: Task[];
  operationStats?: {
    totalWeight: number;
    totalAnimalsProcessed: number;
    mostCommonOperation: string | null;
  };
  activeOperatorsCount?: number;
}

export default function InfoTicker({ 
  tasks = [], 
  operationStats,
  activeOperatorsCount = 0 
}: InfoTickerProps) {
  const taskTypeLabels: Record<string, string> = {
    pesatura: "Pesatura",
    vagliatura: "Vagliatura",
    pulizia: "Pulizia",
    selezione: "Selezione",
    trasferimento: "Trasferimento",
  };

  const messages: string[] = [];

  // Attività urgenti
  const urgentTasks = tasks
    .filter(t => t.priority === 'urgent' && t.status !== 'completed')
    .slice(0, 3);
  
  urgentTasks.forEach(task => {
    const taskName = taskTypeLabels[task.taskType] || task.taskType;
    const desc = task.description || 'Nessuna descrizione';
    messages.push(`🚨 URGENTE: ${taskName} - ${desc}`);
  });

  // Attività in scadenza
  const dueSoonTasks = tasks
    .filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      const dueDate = new Date(t.dueDate);
      const today = new Date();
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 2;
    })
    .slice(0, 2);

  dueSoonTasks.forEach(task => {
    const taskName = taskTypeLabels[task.taskType] || task.taskType;
    const dueDate = task.dueDate ? format(new Date(task.dueDate), 'dd MMM', { locale: it }) : '';
    messages.push(`⏰ In scadenza ${dueDate}: ${taskName}`);
  });

  // Statistiche giornaliere
  if (operationStats) {
    if (operationStats.totalWeight > 0) {
      messages.push(`📊 Peso lavorato oggi: ${(operationStats.totalWeight / 1000).toFixed(1)} kg`);
    }
    if (operationStats.totalAnimalsProcessed > 0) {
      messages.push(`🐚 Animali processati: ${operationStats.totalAnimalsProcessed.toLocaleString('it-IT')}`);
    }
  }

  // Operatori attivi
  if (activeOperatorsCount > 0) {
    messages.push(`👥 ${activeOperatorsCount} operatori attivi`);
  }

  // Attività completate oggi
  const completedToday = tasks.filter(t => t.status === 'completed').length;
  if (completedToday > 0) {
    messages.push(`✅ ${completedToday} attività completate oggi`);
  }

  // Messaggio di default se non ci sono info
  if (messages.length === 0) {
    messages.push('✨ Sistema operativo • Tutto sotto controllo • Nessuna attività urgente');
  }

  // Duplica i messaggi per creare l'effetto loop infinito
  const tickerContent = messages.join('   •   ');
  const duplicatedContent = `${tickerContent}   •   ${tickerContent}   •   ${tickerContent}`;

  return (
    <div className="bg-black text-white overflow-hidden py-3 border-y border-gray-800" data-testid="info-ticker">
      <div className="ticker-wrapper">
        <div className="ticker-content">
          <span className="ticker-text text-sm font-medium tracking-wide">
            {duplicatedContent}
          </span>
          <span className="ticker-text text-sm font-medium tracking-wide" aria-hidden="true">
            {duplicatedContent}
          </span>
        </div>
      </div>

      <style>{`
        .ticker-wrapper {
          width: 100%;
          overflow: hidden;
          position: relative;
        }

        .ticker-content {
          display: flex;
          animation: scroll-left 25s linear infinite;
          will-change: transform;
        }

        .ticker-text {
          white-space: nowrap;
          padding-right: 100%;
          display: inline-block;
        }

        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        /* Pausa l'animazione al hover */
        .ticker-wrapper:hover .ticker-content {
          animation-play-state: paused;
        }

        /* Supporto per prefers-reduced-motion */
        @media (prefers-reduced-motion: reduce) {
          .ticker-content {
            animation: none;
          }
          .ticker-text:not(:first-child) {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
