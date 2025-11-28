/**
 * Servizio di controllo integrità notturno
 * Esegue verifiche automatiche sulla consistenza del database
 * e segnala eventuali anomalie
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';

export interface IntegrityIssue {
  type: 'basket_state' | 'orphan_cycle' | 'orphan_operation' | 'fk_violation';
  severity: 'warning' | 'error' | 'critical';
  message: string;
  affectedIds: number[];
  details?: any;
}

export interface IntegrityCheckResult {
  timestamp: Date;
  duration: number;
  checksPerformed: number;
  issuesFound: IntegrityIssue[];
  status: 'healthy' | 'issues_found' | 'check_failed';
}

let lastCheckResult: IntegrityCheckResult | null = null;
let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * Verifica cestelli con stato inconsistente
 * (state=active ma currentCycleId=null, o state=available ma currentCycleId!=null)
 */
async function checkBasketStateConsistency(): Promise<IntegrityIssue[]> {
  const issues: IntegrityIssue[] = [];
  
  try {
    const activeWithoutCycle = await db.execute(sql`
      SELECT id, state, current_cycle_id, cycle_code, physical_number, flupsy_id
      FROM baskets 
      WHERE state = 'active' 
        AND (current_cycle_id IS NULL OR cycle_code IS NULL OR cycle_code = '')
    `);
    
    if (activeWithoutCycle.rows.length > 0) {
      issues.push({
        type: 'basket_state',
        severity: 'critical',
        message: `${activeWithoutCycle.rows.length} cestello/i attivo/i senza ciclo associato`,
        affectedIds: activeWithoutCycle.rows.map((r: any) => r.id),
        details: activeWithoutCycle.rows
      });
    }
    
    const availableWithCycle = await db.execute(sql`
      SELECT id, state, current_cycle_id, cycle_code, physical_number, flupsy_id
      FROM baskets 
      WHERE state IN ('available', 'disponibile') 
        AND (current_cycle_id IS NOT NULL OR (cycle_code IS NOT NULL AND cycle_code != ''))
    `);
    
    if (availableWithCycle.rows.length > 0) {
      issues.push({
        type: 'basket_state',
        severity: 'error',
        message: `${availableWithCycle.rows.length} cestello/i disponibile/i con ciclo residuo`,
        affectedIds: availableWithCycle.rows.map((r: any) => r.id),
        details: availableWithCycle.rows
      });
    }
  } catch (error) {
    console.error('Errore durante il controllo consistenza stato cestelli:', error);
  }
  
  return issues;
}

/**
 * Verifica cicli orfani (senza cestello associato)
 */
async function checkOrphanCycles(): Promise<IntegrityIssue[]> {
  const issues: IntegrityIssue[] = [];
  
  try {
    const orphanCycles = await db.execute(sql`
      SELECT c.id, c.basket_id, c.state, c.start_date
      FROM cycles c
      LEFT JOIN baskets b ON c.basket_id = b.id
      WHERE b.id IS NULL
    `);
    
    if (orphanCycles.rows.length > 0) {
      issues.push({
        type: 'orphan_cycle',
        severity: 'warning',
        message: `${orphanCycles.rows.length} ciclo/i senza cestello associato`,
        affectedIds: orphanCycles.rows.map((r: any) => r.id),
        details: orphanCycles.rows
      });
    }
  } catch (error) {
    console.error('Errore durante il controllo cicli orfani:', error);
  }
  
  return issues;
}

/**
 * Verifica operazioni orfane (senza cestello o ciclo associato)
 */
async function checkOrphanOperations(): Promise<IntegrityIssue[]> {
  const issues: IntegrityIssue[] = [];
  
  try {
    const orphanByBasket = await db.execute(sql`
      SELECT o.id, o.basket_id, o.cycle_id, o.type, o.date
      FROM operations o
      LEFT JOIN baskets b ON o.basket_id = b.id
      WHERE b.id IS NULL
    `);
    
    if (orphanByBasket.rows.length > 0) {
      issues.push({
        type: 'orphan_operation',
        severity: 'warning',
        message: `${orphanByBasket.rows.length} operazione/i senza cestello`,
        affectedIds: orphanByBasket.rows.map((r: any) => r.id),
        details: orphanByBasket.rows
      });
    }
    
    const orphanByCycle = await db.execute(sql`
      SELECT o.id, o.basket_id, o.cycle_id, o.type, o.date
      FROM operations o
      LEFT JOIN cycles c ON o.cycle_id = c.id
      WHERE o.cycle_id IS NOT NULL AND c.id IS NULL
    `);
    
    if (orphanByCycle.rows.length > 0) {
      issues.push({
        type: 'orphan_operation',
        severity: 'warning',
        message: `${orphanByCycle.rows.length} operazione/i con ciclo inesistente`,
        affectedIds: orphanByCycle.rows.map((r: any) => r.id),
        details: orphanByCycle.rows
      });
    }
  } catch (error) {
    console.error('Errore durante il controllo operazioni orfane:', error);
  }
  
  return issues;
}

/**
 * Verifica cicli attivi con data fine (inconsistenza)
 */
async function checkCycleStateConsistency(): Promise<IntegrityIssue[]> {
  const issues: IntegrityIssue[] = [];
  
  try {
    const activeWithEndDate = await db.execute(sql`
      SELECT id, basket_id, state, start_date, end_date
      FROM cycles 
      WHERE state = 'active' AND end_date IS NOT NULL
    `);
    
    if (activeWithEndDate.rows.length > 0) {
      issues.push({
        type: 'orphan_cycle',
        severity: 'warning',
        message: `${activeWithEndDate.rows.length} ciclo/i attivo/i con data fine impostata`,
        affectedIds: activeWithEndDate.rows.map((r: any) => r.id),
        details: activeWithEndDate.rows
      });
    }
    
    const closedWithoutEndDate = await db.execute(sql`
      SELECT id, basket_id, state, start_date, end_date
      FROM cycles 
      WHERE state = 'closed' AND end_date IS NULL
    `);
    
    if (closedWithoutEndDate.rows.length > 0) {
      issues.push({
        type: 'orphan_cycle',
        severity: 'warning',
        message: `${closedWithoutEndDate.rows.length} ciclo/i chiuso/i senza data fine`,
        affectedIds: closedWithoutEndDate.rows.map((r: any) => r.id),
        details: closedWithoutEndDate.rows
      });
    }
  } catch (error) {
    console.error('Errore durante il controllo consistenza cicli:', error);
  }
  
  return issues;
}

/**
 * Esegue tutti i controlli di integrità
 */
export async function runIntegrityCheck(): Promise<IntegrityCheckResult> {
  console.log('🔍 NIGHTLY CHECK: Inizio controllo integrità database...');
  const startTime = Date.now();
  const allIssues: IntegrityIssue[] = [];
  let checksPerformed = 0;
  
  try {
    const basketIssues = await checkBasketStateConsistency();
    allIssues.push(...basketIssues);
    checksPerformed++;
    
    const orphanCycleIssues = await checkOrphanCycles();
    allIssues.push(...orphanCycleIssues);
    checksPerformed++;
    
    const orphanOperationIssues = await checkOrphanOperations();
    allIssues.push(...orphanOperationIssues);
    checksPerformed++;
    
    const cycleStateIssues = await checkCycleStateConsistency();
    allIssues.push(...cycleStateIssues);
    checksPerformed++;
    
    const duration = Date.now() - startTime;
    
    lastCheckResult = {
      timestamp: new Date(),
      duration,
      checksPerformed,
      issuesFound: allIssues,
      status: allIssues.length === 0 ? 'healthy' : 'issues_found'
    };
    
    if (allIssues.length > 0) {
      console.log(`⚠️ NIGHTLY CHECK: Trovate ${allIssues.length} anomalie in ${duration}ms`);
      allIssues.forEach(issue => {
        console.log(`  - [${issue.severity.toUpperCase()}] ${issue.message}`);
      });
    } else {
      console.log(`✅ NIGHTLY CHECK: Database consistente (${checksPerformed} controlli in ${duration}ms)`);
    }
    
    return lastCheckResult;
  } catch (error) {
    console.error('❌ NIGHTLY CHECK: Errore durante il controllo integrità:', error);
    
    lastCheckResult = {
      timestamp: new Date(),
      duration: Date.now() - startTime,
      checksPerformed,
      issuesFound: [],
      status: 'check_failed'
    };
    
    return lastCheckResult;
  }
}

/**
 * Restituisce l'ultimo risultato del controllo
 */
export function getLastCheckResult(): IntegrityCheckResult | null {
  return lastCheckResult;
}

/**
 * Avvia lo scheduler notturno (esegue ogni notte alle 03:00)
 */
export function startNightlyScheduler(): void {
  if (schedulerInterval) {
    console.log('📅 NIGHTLY SCHEDULER: Scheduler già attivo');
    return;
  }
  
  console.log('📅 NIGHTLY SCHEDULER: Avvio scheduler controllo integrità notturno...');
  
  const scheduleNextRun = () => {
    const now = new Date();
    const nextRun = new Date();
    nextRun.setHours(3, 0, 0, 0);
    
    if (now.getHours() >= 3) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    const msUntilNextRun = nextRun.getTime() - now.getTime();
    
    console.log(`📅 NIGHTLY SCHEDULER: Prossimo controllo: ${nextRun.toLocaleString('it-IT')}`);
    
    schedulerInterval = setTimeout(async () => {
      await runIntegrityCheck();
      scheduleNextRun();
    }, msUntilNextRun);
  };
  
  scheduleNextRun();
}

/**
 * Ferma lo scheduler
 */
export function stopNightlyScheduler(): void {
  if (schedulerInterval) {
    clearTimeout(schedulerInterval);
    schedulerInterval = null;
    console.log('📅 NIGHTLY SCHEDULER: Scheduler fermato');
  }
}
