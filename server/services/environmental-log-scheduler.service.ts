import { recordEnvironmentalSnapshot } from './environmental-log.service';

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
let schedulerInterval: NodeJS.Timeout | null = null;

function msUntilNextRun(targetHour: number): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(targetHour, 0, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}

async function runSnapshot(): Promise<void> {
  console.log('[EnvLogScheduler] Acquisizione snapshot ambientale automatica...');
  try {
    await recordEnvironmentalSnapshot(undefined, 'scheduler');
    console.log('[EnvLogScheduler] Snapshot completato.');
  } catch (err) {
    console.error('[EnvLogScheduler] Errore snapshot:', err);
  }
}

export function startEnvironmentalLogScheduler(): void {
  if (schedulerInterval) {
    console.log('[EnvLogScheduler] Scheduler già attivo');
    return;
  }

  // Esegui subito all'avvio (cattura il dato del giorno se manca)
  runSnapshot();

  // Esegui ogni 12 ore: alle 06:00 e 18:00
  // Prima esecuzione: alla prossima ora target più vicina
  const msTo06 = msUntilNextRun(6);
  const msTo18 = msUntilNextRun(18);
  const msToFirst = Math.min(msTo06, msTo18);
  const nextRun = new Date(Date.now() + msToFirst);

  console.log(`[EnvLogScheduler] Prossima esecuzione schedulata: ${nextRun.toLocaleString('it-IT')}`);

  setTimeout(() => {
    runSnapshot();
    // Dopo la prima esecuzione pianificata, continua ogni 12 ore
    schedulerInterval = setInterval(runSnapshot, TWELVE_HOURS_MS);
  }, msToFirst);
}

export function stopEnvironmentalLogScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[EnvLogScheduler] Scheduler fermato.');
  }
}
