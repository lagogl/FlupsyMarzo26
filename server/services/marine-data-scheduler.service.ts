import { marineDataService } from './marine-data.service';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
let schedulerInterval: NodeJS.Timeout | null = null;

export function startMarineDataScheduler(): void {
  if (schedulerInterval) {
    console.log('[MarineDataScheduler] Scheduler already running');
    return;
  }
  
  console.log('[MarineDataScheduler] Starting automatic marine data collection (every 6 hours)...');
  
  (async () => {
    try {
      console.log('[MarineDataScheduler] Checking for missing data to backfill...');
      const backfillResult = await marineDataService.fillMissingData(7);
      if (backfillResult.filled > 0) {
        console.log(`[MarineDataScheduler] Backfill completed: ${backfillResult.message}`);
      } else {
        console.log('[MarineDataScheduler] No data gaps to fill');
      }
    } catch (err) {
      console.warn('[MarineDataScheduler] Backfill error (non-critical):', err);
    }
    
    try {
      const result = await marineDataService.fetchAndStoreData();
      if (result.success) {
        console.log('[MarineDataScheduler] Initial data fetch completed successfully');
      } else {
        console.warn('[MarineDataScheduler] Initial fetch failed:', result.error);
      }
    } catch (err) {
      console.error('[MarineDataScheduler] Initial fetch error:', err);
    }
  })();
  
  schedulerInterval = setInterval(async () => {
    console.log('[MarineDataScheduler] Running scheduled marine data collection...');
    try {
      const result = await marineDataService.fetchAndStoreData();
      if (result.success) {
        console.log('[MarineDataScheduler] Scheduled data collection completed');
      } else {
        console.warn('[MarineDataScheduler] Scheduled collection failed:', result.error);
      }
    } catch (err) {
      console.error('[MarineDataScheduler] Scheduled collection error:', err);
    }
  }, SIX_HOURS_MS);
  
  console.log(`[MarineDataScheduler] Next collection in ${SIX_HOURS_MS / 1000 / 60 / 60} hours`);
}

export function stopMarineDataScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[MarineDataScheduler] Scheduler stopped');
  }
}
