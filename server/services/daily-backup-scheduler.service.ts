/**
 * Servizio di backup automatico giornaliero
 * Esegue backup del database ogni notte alle 02:00
 * e mantiene solo gli ultimi N giorni di backup
 */

import { createDatabaseBackup, listDatabaseBackups, deleteDatabaseBackup } from '../database-service';

export interface BackupSchedulerConfig {
  hour: number;
  minute: number;
  retentionDays: number;
}

export interface BackupResult {
  success: boolean;
  backupId?: string;
  filename?: string;
  size?: number;
  error?: string;
  cleanedUp?: number;
}

const DEFAULT_CONFIG: BackupSchedulerConfig = {
  hour: 2,
  minute: 0,
  retentionDays: 7
};

let schedulerInterval: NodeJS.Timeout | null = null;
let lastBackupResult: BackupResult | null = null;
let config: BackupSchedulerConfig = DEFAULT_CONFIG;

function getNextRunTime(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(config.hour, config.minute, 0, 0);
  
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  
  return next;
}

function getTimeUntilNextRun(): number {
  return getNextRunTime().getTime() - Date.now();
}

async function cleanupOldBackups(): Promise<number> {
  try {
    const backups = await listDatabaseBackups();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays);
    
    let deleted = 0;
    for (const backup of backups) {
      const backupDate = new Date(backup.timestamp);
      if (backupDate < cutoffDate) {
        try {
          await deleteDatabaseBackup(backup.filename);
          deleted++;
          console.log(`🗑️ BACKUP CLEANUP: Eliminato backup vecchio: ${backup.filename}`);
        } catch (err) {
          console.error(`⚠️ Errore eliminazione backup ${backup.filename}:`, err);
        }
      }
    }
    
    return deleted;
  } catch (error) {
    console.error('Errore durante pulizia backup:', error);
    return 0;
  }
}

export async function runScheduledBackup(): Promise<BackupResult> {
  console.log('💾 BACKUP SCHEDULER: Avvio backup automatico giornaliero...');
  const startTime = Date.now();
  
  try {
    const backupInfo = await createDatabaseBackup();
    
    const cleanedUp = await cleanupOldBackups();
    
    const duration = Date.now() - startTime;
    
    lastBackupResult = {
      success: true,
      backupId: backupInfo.id,
      filename: backupInfo.filename,
      size: backupInfo.size,
      cleanedUp
    };
    
    console.log(`✅ BACKUP SCHEDULER: Backup completato in ${duration}ms`);
    console.log(`   📁 File: ${backupInfo.filename}`);
    console.log(`   📊 Dimensione: ${(backupInfo.size / 1024 / 1024).toFixed(2)} MB`);
    if (cleanedUp > 0) {
      console.log(`   🗑️ Backup eliminati: ${cleanedUp} (retention: ${config.retentionDays} giorni)`);
    }
    
    return lastBackupResult;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    
    lastBackupResult = {
      success: false,
      error: errorMessage
    };
    
    console.error('❌ BACKUP SCHEDULER: Errore durante il backup:', errorMessage);
    return lastBackupResult;
  }
}

function scheduleNextBackup(): void {
  if (schedulerInterval) {
    clearTimeout(schedulerInterval);
  }
  
  const msUntilNextRun = getTimeUntilNextRun();
  const nextRun = getNextRunTime();
  
  console.log(`📅 BACKUP SCHEDULER: Prossimo backup: ${nextRun.toLocaleString('it-IT')}`);
  
  schedulerInterval = setTimeout(async () => {
    await runScheduledBackup();
    scheduleNextBackup();
  }, msUntilNextRun);
}

export function startBackupScheduler(customConfig?: Partial<BackupSchedulerConfig>): void {
  if (customConfig) {
    config = { ...DEFAULT_CONFIG, ...customConfig };
  }
  
  console.log('📅 BACKUP SCHEDULER: Avvio scheduler backup automatico...');
  console.log(`   ⏰ Orario: ${String(config.hour).padStart(2, '0')}:${String(config.minute).padStart(2, '0')}`);
  console.log(`   📆 Retention: ${config.retentionDays} giorni`);
  
  scheduleNextBackup();
}

export function stopBackupScheduler(): void {
  if (schedulerInterval) {
    clearTimeout(schedulerInterval);
    schedulerInterval = null;
    console.log('⏹️ BACKUP SCHEDULER: Scheduler fermato');
  }
}

export function getLastBackupResult(): BackupResult | null {
  return lastBackupResult;
}

export function getSchedulerStatus(): {
  active: boolean;
  nextRun: Date | null;
  lastResult: BackupResult | null;
  config: BackupSchedulerConfig;
} {
  return {
    active: schedulerInterval !== null,
    nextRun: schedulerInterval ? getNextRunTime() : null,
    lastResult: lastBackupResult,
    config
  };
}
