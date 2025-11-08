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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Attività previste per oggi (scadenza oggi)
  const todayTasks = tasks
    .filter(t => {
      if (!t.dueDate || t.status === 'completed' || t.status === 'cancelled') return false;
      const dueDate = new Date(t.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === today.getTime();
    });

  todayTasks.forEach(task => {
    const taskName = taskTypeLabels[task.taskType] || task.taskType;
    const desc = task.description || 'Nessuna descrizione';
    const operatori = task.assignments?.length || 0;
    const icon = task.priority === 'urgent' ? '🚨' : '📋';
    messages.push(`${icon} Oggi: ${taskName} - ${desc}${operatori > 0 ? ` (${operatori} operatori)` : ''}`);
  });

  // Attività urgenti (anche se non scadono oggi)
  const urgentNotToday = tasks
    .filter(t => {
      if (t.status === 'completed' || t.status === 'cancelled') return false;
      if (t.priority !== 'urgent') return false;
      // Escludi quelle già mostrate come "oggi"
      if (t.dueDate) {
        const dueDate = new Date(t.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate.getTime() === today.getTime()) return false;
      }
      return true;
    })
    .slice(0, 2);

  urgentNotToday.forEach(task => {
    const taskName = taskTypeLabels[task.taskType] || task.taskType;
    const desc = task.description || 'Nessuna descrizione';
    messages.push(`🚨 URGENTE: ${taskName} - ${desc}`);
  });

  // Messaggio di default se non ci sono attività
  if (messages.length === 0) {
    messages.push('✨ Nessuna attività prevista per oggi • Sistema operativo');
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
