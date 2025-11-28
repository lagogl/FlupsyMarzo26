/**
 * Servizio Audit Log per tracciare operazioni critiche
 * Registra chi ha fatto cosa, quando e come
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';

export type AuditAction = 
  | 'operation_created'
  | 'operation_deleted' 
  | 'operation_updated'
  | 'basket_state_changed'
  | 'cycle_created'
  | 'cycle_closed'
  | 'cycle_deleted'
  | 'selection_completed'
  | 'screening_completed'
  | 'ddt_generated'
  | 'user_login'
  | 'user_logout'
  | 'emergency_delete';

export type EntityType = 
  | 'operation'
  | 'basket'
  | 'cycle'
  | 'selection'
  | 'screening'
  | 'ddt'
  | 'user';

export interface AuditLogEntry {
  action: AuditAction;
  entityType: EntityType;
  entityId?: number;
  userId?: number;
  userSource?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Registra un evento nell'audit log
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    await db.execute(sql`
      INSERT INTO audit_logs (
        action, 
        entity_type, 
        entity_id, 
        user_id, 
        user_source,
        old_values, 
        new_values, 
        metadata,
        ip_address,
        user_agent
      ) VALUES (
        ${entry.action},
        ${entry.entityType},
        ${entry.entityId || null},
        ${entry.userId || null},
        ${entry.userSource || null},
        ${entry.oldValues ? JSON.stringify(entry.oldValues) : null}::jsonb,
        ${entry.newValues ? JSON.stringify(entry.newValues) : null}::jsonb,
        ${entry.metadata ? JSON.stringify(entry.metadata) : null}::jsonb,
        ${entry.ipAddress || null},
        ${entry.userAgent || null}
      )
    `);
  } catch (error) {
    console.error('⚠️ Errore durante la scrittura audit log:', error);
  }
}

/**
 * Registra l'eliminazione di un'operazione
 */
export async function logOperationDeleted(
  operationId: number,
  operation: any,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    action: 'operation_deleted',
    entityType: 'operation',
    entityId: operationId,
    oldValues: {
      type: operation.type,
      basketId: operation.basketId,
      cycleId: operation.cycleId,
      date: operation.date,
      animalCount: operation.animalCount
    },
    metadata: {
      ...metadata,
      deletedAt: new Date().toISOString()
    }
  });
}

/**
 * Registra il cambio di stato di un cestello
 */
export async function logBasketStateChanged(
  basketId: number,
  oldState: { state: string; currentCycleId: number | null; cycleCode: string | null },
  newState: { state: string; currentCycleId: number | null; cycleCode: string | null },
  reason?: string
): Promise<void> {
  await logAuditEvent({
    action: 'basket_state_changed',
    entityType: 'basket',
    entityId: basketId,
    oldValues: oldState,
    newValues: newState,
    metadata: { reason }
  });
}

/**
 * Registra la creazione di un ciclo
 */
export async function logCycleCreated(
  cycleId: number,
  basketId: number,
  cycleCode: string
): Promise<void> {
  await logAuditEvent({
    action: 'cycle_created',
    entityType: 'cycle',
    entityId: cycleId,
    newValues: { basketId, cycleCode },
    metadata: { createdAt: new Date().toISOString() }
  });
}

/**
 * Registra la chiusura di un ciclo
 */
export async function logCycleClosed(
  cycleId: number,
  basketId: number,
  endDate: string
): Promise<void> {
  await logAuditEvent({
    action: 'cycle_closed',
    entityType: 'cycle',
    entityId: cycleId,
    newValues: { basketId, endDate },
    metadata: { closedAt: new Date().toISOString() }
  });
}

/**
 * Registra un'eliminazione di emergenza
 */
export async function logEmergencyDelete(
  entityType: EntityType,
  entityId: number,
  reason: string,
  deletedData?: any
): Promise<void> {
  await logAuditEvent({
    action: 'emergency_delete',
    entityType,
    entityId,
    oldValues: deletedData,
    metadata: { 
      reason,
      isEmergency: true,
      deletedAt: new Date().toISOString()
    }
  });
}

/**
 * Recupera gli ultimi log di audit
 */
export async function getRecentAuditLogs(limit: number = 50): Promise<any[]> {
  const result = await db.execute(sql`
    SELECT * FROM audit_logs 
    ORDER BY timestamp DESC 
    LIMIT ${limit}
  `);
  return result.rows;
}

/**
 * Recupera i log per un'entità specifica
 */
export async function getAuditLogsForEntity(
  entityType: EntityType, 
  entityId: number
): Promise<any[]> {
  const result = await db.execute(sql`
    SELECT * FROM audit_logs 
    WHERE entity_type = ${entityType} AND entity_id = ${entityId}
    ORDER BY timestamp DESC
  `);
  return result.rows;
}
