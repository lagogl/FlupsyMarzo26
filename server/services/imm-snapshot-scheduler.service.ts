/**
 * Scheduler giornaliero per snapshot IMM.
 * Esegue saveDailySnapshot() alle 03:30 ogni giorno (dopo backup ore 02:00 e integrity ore 03:00).
 */
import { saveDailySnapshot } from '../modules/imm/imm.service';

interface SchedulerConfig {
  hour: number;
  minute: number;
}

const DEFAULT_CONFIG: SchedulerConfig = { hour: 3, minute: 30 };

let schedulerTimeout: NodeJS.Timeout | null = null;
let config: SchedulerConfig = DEFAULT_CONFIG;
let lastRunDate: string | null = null;

function getNextRunTime(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(config.hour, config.minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

async function runOnce(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  if (lastRunDate === today) {
    console.log(`📸 IMM SNAPSHOT: Già eseguito oggi (${today}), skip.`);
    return;
  }
  try {
    console.log('📸 IMM SNAPSHOT: Avvio snapshot giornaliero...');
    const out = await saveDailySnapshot();
    lastRunDate = today;
    console.log(`✅ IMM SNAPSHOT: ${out.inserted} record salvati per ${out.date}`);
  } catch (e) {
    console.error('❌ IMM SNAPSHOT: errore:', e);
  }
}

function scheduleNext(): void {
  const ms = getNextRunTime().getTime() - Date.now();
  schedulerTimeout = setTimeout(async () => {
    await runOnce();
    scheduleNext();
  }, ms);
  console.log(`📸 Prossimo snapshot IMM: ${getNextRunTime().toISOString()} (tra ${Math.round(ms / 60000)} min)`);
}

export function startImmSnapshotScheduler(custom?: Partial<SchedulerConfig>): void {
  if (custom) config = { ...DEFAULT_CONFIG, ...custom };
  if (schedulerTimeout) {
    clearTimeout(schedulerTimeout);
    schedulerTimeout = null;
  }
  scheduleNext();

  // Esegue uno snapshot iniziale dopo 30s dall'avvio (se non già fatto oggi)
  setTimeout(() => {
    runOnce().catch((e) => console.error('Errore snapshot iniziale IMM:', e));
  }, 30000);
}

export function stopImmSnapshotScheduler(): void {
  if (schedulerTimeout) {
    clearTimeout(schedulerTimeout);
    schedulerTimeout = null;
  }
}
