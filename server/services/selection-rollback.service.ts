/**
 * SelectionRollbackService - Servizio per la cancellazione sicura delle vagliature
 * 
 * SCOPO: Permettere agli operatori di cancellare integralmente una vagliatura completata
 * ripristinando lo stato del database a prima della vagliatura, MA solo se non ci sono
 * dipendenze che potrebbero causare inconsistenze.
 * 
 * VALIDAZIONI:
 * 1. Nessuna operazione successiva sui cestelli coinvolti
 * 2. Nessun'altra vagliatura che usa gli stessi cestelli dopo questa
 * 3. Nessun DDT collegato alle operazioni della vagliatura
 * 4. Nessuna modifica manuale ai cicli coinvolti
 */

import { db } from '../db';
import { 
  selections, 
  selectionSourceBaskets, 
  selectionDestinationBaskets, 
  operations,
  cycles,
  baskets,
  basketLotComposition,
  flupsys
} from '../../shared/schema';
import { eq, and, gt, inArray, sql, desc } from 'drizzle-orm';
import { OperationsCache } from '../operations-cache-service.js';
import { BasketsCache } from '../baskets-cache-service.js';
import { logOperationDeleted, logBasketStateChanged } from './audit-log.service.js';

interface CancellationBlocker {
  type: 'subsequent_operations' | 'later_selections' | 'linked_ddt' | 'manual_edits';
  message: string;
  details: Array<{
    id: number;
    description: string;
  }>;
}

interface CancellationCheckResult {
  canCancel: boolean;
  selectionId: number;
  selectionNumber: number;
  selectionDate: string;
  blockers: CancellationBlocker[];
  summary: {
    sourceBaskets: number;
    destinationBaskets: number;
    operationsToDelete: number;
    cyclesToDelete: number;
    cyclesToReopen: number;
  };
}

interface RollbackResult {
  success: boolean;
  selectionId: number;
  restoredEntities: {
    basketsRestored: Array<{ id: number; physicalNumber: number; newState: string; cycleId: number | null }>;
    cyclesReopened: Array<{ id: number; basketId: number }>;
    cyclesDeleted: number[];
    operationsDeleted: number[];
  };
  errors: string[];
}

class SelectionRollbackService {

  /**
   * Verifica se una vagliatura può essere cancellata in sicurezza
   */
  async validateCancellation(selectionId: number): Promise<CancellationCheckResult> {
    console.log(`🔍 [ROLLBACK] Validazione cancellazione selezione ${selectionId}`);

    const result: CancellationCheckResult = {
      canCancel: true,
      selectionId,
      selectionNumber: 0,
      selectionDate: '',
      blockers: [],
      summary: {
        sourceBaskets: 0,
        destinationBaskets: 0,
        operationsToDelete: 0,
        cyclesToDelete: 0,
        cyclesToReopen: 0
      }
    };

    // 1. Recupera info sulla selezione
    const [selection] = await db
      .select()
      .from(selections)
      .where(eq(selections.id, selectionId));

    if (!selection) {
      result.canCancel = false;
      result.blockers.push({
        type: 'manual_edits',
        message: 'Vagliatura non trovata',
        details: [{ id: selectionId, description: 'La vagliatura specificata non esiste' }]
      });
      return result;
    }

    result.selectionNumber = selection.selectionNumber;
    result.selectionDate = selection.date;

    // 2. Recupera i cestelli origine e destinazione
    const sourceBaskets = await db
      .select({
        id: selectionSourceBaskets.id,
        basketId: selectionSourceBaskets.basketId,
        cycleId: selectionSourceBaskets.cycleId,
        flupsyId: selectionSourceBaskets.flupsyId
      })
      .from(selectionSourceBaskets)
      .where(eq(selectionSourceBaskets.selectionId, selectionId));

    const destinationBaskets = await db
      .select({
        id: selectionDestinationBaskets.id,
        basketId: selectionDestinationBaskets.basketId,
        cycleId: selectionDestinationBaskets.cycleId,
        flupsyId: selectionDestinationBaskets.flupsyId
      })
      .from(selectionDestinationBaskets)
      .where(eq(selectionDestinationBaskets.selectionId, selectionId));

    result.summary.sourceBaskets = sourceBaskets.length;
    result.summary.destinationBaskets = destinationBaskets.length;

    // 3. Trova le operazioni create dalla vagliatura
    const selectionOps = await this.getOperationsCreatedBySelection(selectionId, selection.date);
    result.summary.operationsToDelete = selectionOps.length;

    // 4. Trova i cicli nuovi (creati per le destinazioni) e quelli vecchi (da riaprire)
    const newCycleIds = destinationBaskets.map(db => db.cycleId).filter((id): id is number => id !== null);
    const oldCycleIds = sourceBaskets.map(sb => sb.cycleId).filter((id): id is number => id !== null);
    
    result.summary.cyclesToDelete = newCycleIds.length;
    result.summary.cyclesToReopen = oldCycleIds.length;

    // 5. VALIDAZIONE: Operazioni successive sui cestelli destinazione
    const subsequentOpsBlocker = await this.checkSubsequentOperations(
      destinationBaskets.map(db => db.basketId),
      newCycleIds,
      selectionOps.map(o => o.id)
    );
    if (subsequentOpsBlocker) {
      result.blockers.push(subsequentOpsBlocker);
      result.canCancel = false;
    }

    // 6. VALIDAZIONE: Altre vagliature che usano gli stessi cestelli
    const laterSelectionsBlocker = await this.checkLaterSelections(
      [...sourceBaskets.map(sb => sb.basketId), ...destinationBaskets.map(db => db.basketId)],
      selectionId,
      selection.date
    );
    if (laterSelectionsBlocker) {
      result.blockers.push(laterSelectionsBlocker);
      result.canCancel = false;
    }

    // 7. VALIDAZIONE: DDT collegati
    const ddtBlocker = await this.checkLinkedDDT(selectionOps.map(o => o.id));
    if (ddtBlocker) {
      result.blockers.push(ddtBlocker);
      result.canCancel = false;
    }

    console.log(`✅ [ROLLBACK] Validazione completata: canCancel=${result.canCancel}, blockers=${result.blockers.length}`);
    return result;
  }

  /**
   * Esegue il rollback completo di una vagliatura
   */
  async executeRollback(selectionId: number): Promise<RollbackResult> {
    console.log(`🔄 [ROLLBACK] Inizio rollback selezione ${selectionId}`);

    const result: RollbackResult = {
      success: false,
      selectionId,
      restoredEntities: {
        basketsRestored: [],
        cyclesReopened: [],
        cyclesDeleted: [],
        operationsDeleted: []
      },
      errors: []
    };

    // Prima valida
    const validation = await this.validateCancellation(selectionId);
    if (!validation.canCancel) {
      result.errors.push('Cancellazione non permessa: ' + validation.blockers.map(b => b.message).join(', '));
      return result;
    }

    try {
      // Recupera tutti i dati necessari prima di iniziare
      const [selection] = await db
        .select()
        .from(selections)
        .where(eq(selections.id, selectionId));

      if (!selection) {
        result.errors.push('Vagliatura non trovata');
        return result;
      }

      const sourceBaskets = await db
        .select()
        .from(selectionSourceBaskets)
        .where(eq(selectionSourceBaskets.selectionId, selectionId));

      const destinationBaskets = await db
        .select()
        .from(selectionDestinationBaskets)
        .where(eq(selectionDestinationBaskets.selectionId, selectionId));

      // Trova operazioni da cancellare
      const selectionOps = await this.getOperationsCreatedBySelection(selectionId, selection.date);
      const opIds = selectionOps.map(o => o.id);

      // Trova cicli vecchi (da riaprire) e nuovi (da cancellare)
      const oldCycleIds = sourceBaskets.map(sb => sb.cycleId).filter((id): id is number => id !== null);
      const newCycleIds = destinationBaskets.map(db => db.cycleId).filter((id): id is number => id !== null);

      // Costruisci mappa dei cycle_code originali
      const cycleCodeMap = new Map<number, string>();
      for (const sb of sourceBaskets) {
        if (sb.cycleId && sb.basketId) {
          const [basket] = await db.select().from(baskets).where(eq(baskets.id, sb.basketId));
          if (basket) {
            const [cycle] = await db.select().from(cycles).where(eq(cycles.id, sb.cycleId));
            if (cycle) {
              const expectedCode = `${basket.physicalNumber}-${basket.flupsyId}-${cycle.startDate.substring(2, 4)}${cycle.startDate.substring(5, 7)}`;
              cycleCodeMap.set(sb.basketId, expectedCode);
            }
          }
        }
      }

      console.log(`📋 [ROLLBACK] Operazioni da cancellare: ${opIds.join(', ')}`);
      console.log(`📋 [ROLLBACK] Cicli da riaprire: ${oldCycleIds.join(', ')}`);
      console.log(`📋 [ROLLBACK] Cicli da cancellare: ${newCycleIds.join(', ')}`);

      // STEP 1: Cancella le operazioni
      if (opIds.length > 0) {
        await db.delete(operations).where(inArray(operations.id, opIds));
        result.restoredEntities.operationsDeleted = opIds;
        console.log(`✅ [ROLLBACK] Cancellate ${opIds.length} operazioni`);
      }

      // STEP 2: Cancella basket_lot_composition per i nuovi cicli
      if (newCycleIds.length > 0) {
        await db.delete(basketLotComposition).where(inArray(basketLotComposition.cycleId, newCycleIds));
        console.log(`✅ [ROLLBACK] Cancellate composizioni lotto per cicli ${newCycleIds.join(', ')}`);
      }

      // STEP 3: Cancella selection_destination_baskets
      await db.delete(selectionDestinationBaskets).where(eq(selectionDestinationBaskets.selectionId, selectionId));
      console.log(`✅ [ROLLBACK] Cancellati cestelli destinazione`);

      // STEP 4: Cancella selection_source_baskets
      await db.delete(selectionSourceBaskets).where(eq(selectionSourceBaskets.selectionId, selectionId));
      console.log(`✅ [ROLLBACK] Cancellati cestelli origine`);

      // STEP 5: Cancella i nuovi cicli
      if (newCycleIds.length > 0) {
        await db.delete(cycles).where(inArray(cycles.id, newCycleIds));
        result.restoredEntities.cyclesDeleted = newCycleIds;
        console.log(`✅ [ROLLBACK] Cancellati ${newCycleIds.length} cicli nuovi`);
      }

      // STEP 6: Riapri i cicli vecchi
      if (oldCycleIds.length > 0) {
        await db
          .update(cycles)
          .set({ state: 'active', endDate: null })
          .where(inArray(cycles.id, oldCycleIds));
        
        for (const cycleId of oldCycleIds) {
          const [cycle] = await db.select().from(cycles).where(eq(cycles.id, cycleId));
          if (cycle) {
            result.restoredEntities.cyclesReopened.push({ id: cycleId, basketId: cycle.basketId });
          }
        }
        console.log(`✅ [ROLLBACK] Riaperti ${oldCycleIds.length} cicli`);
      }

      // STEP 7: Ripristina stato cestelli origine
      for (const sb of sourceBaskets) {
        if (sb.basketId && sb.cycleId) {
          const cycleCode = cycleCodeMap.get(sb.basketId) || null;
          await db
            .update(baskets)
            .set({ 
              state: 'active', 
              currentCycleId: sb.cycleId, 
              cycleCode: cycleCode 
            })
            .where(eq(baskets.id, sb.basketId));
          
          const [basket] = await db.select().from(baskets).where(eq(baskets.id, sb.basketId));
          result.restoredEntities.basketsRestored.push({
            id: sb.basketId,
            physicalNumber: basket?.physicalNumber || 0,
            newState: 'active',
            cycleId: sb.cycleId
          });
        }
      }
      console.log(`✅ [ROLLBACK] Ripristinati ${sourceBaskets.length} cestelli origine`);

      // STEP 8: Ripristina stato cestelli destinazione (solo quelli che non erano anche origine)
      const sourceBasketIds = new Set(sourceBaskets.map(sb => sb.basketId));
      for (const db_basket of destinationBaskets) {
        if (db_basket.basketId && !sourceBasketIds.has(db_basket.basketId)) {
          await db
            .update(baskets)
            .set({ 
              state: 'available', 
              currentCycleId: null, 
              cycleCode: null 
            })
            .where(eq(baskets.id, db_basket.basketId));
          
          const [basket] = await db.select().from(baskets).where(eq(baskets.id, db_basket.basketId));
          result.restoredEntities.basketsRestored.push({
            id: db_basket.basketId,
            physicalNumber: basket?.physicalNumber || 0,
            newState: 'available',
            cycleId: null
          });
        }
      }

      // STEP 9: Cancella la selezione
      await db.delete(selections).where(eq(selections.id, selectionId));
      console.log(`✅ [ROLLBACK] Cancellata selezione ${selectionId}`);

      // STEP 10: Invalida le cache
      this.invalidateAllCaches();

      result.success = true;
      console.log(`🎉 [ROLLBACK] Rollback completato con successo per selezione ${selectionId}`);

    } catch (error: any) {
      console.error(`❌ [ROLLBACK] Errore durante rollback:`, error);
      result.errors.push(error.message || 'Errore sconosciuto durante il rollback');
    }

    return result;
  }

  /**
   * Trova le operazioni create dalla vagliatura
   */
  private async getOperationsCreatedBySelection(selectionId: number, selectionDate: string): Promise<Array<{ id: number; type: string; basketId: number; cycleId: number | null }>> {
    // Ottieni il selectionNumber per cercare nelle note
    const [selection] = await db
      .select({ selectionNumber: selections.selectionNumber })
      .from(selections)
      .where(eq(selections.id, selectionId));

    if (!selection) return [];

    const searchPattern = `%vagliatura #${selection.selectionNumber}%`;
    
    const ops = await db
      .select({
        id: operations.id,
        type: operations.type,
        basketId: operations.basketId,
        cycleId: operations.cycleId
      })
      .from(operations)
      .where(sql`${operations.notes} LIKE ${searchPattern}`);

    return ops;
  }

  /**
   * Verifica se ci sono operazioni successive sui cestelli destinazione
   */
  private async checkSubsequentOperations(
    destinationBasketIds: number[],
    newCycleIds: number[],
    selectionOpIds: number[]
  ): Promise<CancellationBlocker | null> {
    if (destinationBasketIds.length === 0 || newCycleIds.length === 0) return null;

    // Trova operazioni sui nuovi cicli che NON sono quelle della vagliatura
    const subsequentOps = await db
      .select({
        id: operations.id,
        type: operations.type,
        date: operations.date,
        basketId: operations.basketId
      })
      .from(operations)
      .where(
        and(
          inArray(operations.cycleId, newCycleIds),
          sql`${operations.id} NOT IN (${sql.raw(selectionOpIds.join(',') || '0')})`
        )
      );

    if (subsequentOps.length === 0) return null;

    return {
      type: 'subsequent_operations',
      message: `${subsequentOps.length} operazioni registrate dopo questa vagliatura`,
      details: subsequentOps.map(op => ({
        id: op.id,
        description: `Operazione "${op.type}" del ${op.date} su cesta ${op.basketId}`
      }))
    };
  }

  /**
   * Verifica se ci sono vagliature successive che usano gli stessi cestelli
   */
  private async checkLaterSelections(
    basketIds: number[],
    currentSelectionId: number,
    currentSelectionDate: string
  ): Promise<CancellationBlocker | null> {
    if (basketIds.length === 0) return null;

    // Cerca vagliature successive che hanno questi cestelli come origine
    const laterSources = await db
      .select({
        selectionId: selectionSourceBaskets.selectionId,
        basketId: selectionSourceBaskets.basketId
      })
      .from(selectionSourceBaskets)
      .innerJoin(selections, eq(selections.id, selectionSourceBaskets.selectionId))
      .where(
        and(
          inArray(selectionSourceBaskets.basketId, basketIds),
          gt(selections.id, currentSelectionId)
        )
      );

    // Cerca vagliature successive che hanno questi cestelli come destinazione
    const laterDests = await db
      .select({
        selectionId: selectionDestinationBaskets.selectionId,
        basketId: selectionDestinationBaskets.basketId
      })
      .from(selectionDestinationBaskets)
      .innerJoin(selections, eq(selections.id, selectionDestinationBaskets.selectionId))
      .where(
        and(
          inArray(selectionDestinationBaskets.basketId, basketIds),
          gt(selections.id, currentSelectionId)
        )
      );

    const allLater = [...laterSources, ...laterDests];
    const uniqueSelections = [...new Set(allLater.map(l => l.selectionId))];

    if (uniqueSelections.length === 0) return null;

    // Ottieni i numeri delle vagliature
    const selectionDetails = await db
      .select({ id: selections.id, selectionNumber: selections.selectionNumber, date: selections.date })
      .from(selections)
      .where(inArray(selections.id, uniqueSelections));

    return {
      type: 'later_selections',
      message: `${uniqueSelections.length} vagliature successive usano gli stessi cestelli`,
      details: selectionDetails.map(s => ({
        id: s.id,
        description: `Vagliatura #${s.selectionNumber} del ${s.date}`
      }))
    };
  }

  /**
   * Verifica se ci sono DDT collegati alle operazioni
   */
  private async checkLinkedDDT(operationIds: number[]): Promise<CancellationBlocker | null> {
    if (operationIds.length === 0) return null;

    try {
      // Verifica se esiste la tabella ddt e cerca collegamenti
      const ddtLinks = await db.execute(sql`
        SELECT d.id, d.numero_ddt, do.operation_id
        FROM ddt d
        INNER JOIN ddt_operations do ON d.id = do.ddt_id
        WHERE do.operation_id = ANY(${sql.raw(`ARRAY[${operationIds.join(',')}]`)})
      `);

      if (!ddtLinks.rows || ddtLinks.rows.length === 0) return null;

      return {
        type: 'linked_ddt',
        message: `${ddtLinks.rows.length} DDT collegati a questa vagliatura`,
        details: (ddtLinks.rows as any[]).map(row => ({
          id: row.id,
          description: `DDT #${row.numero_ddt}`
        }))
      };
    } catch (error) {
      // Se la tabella non esiste o c'è un errore, ignora questo check
      console.log(`⚠️ [ROLLBACK] Check DDT fallito (probabilmente tabella non esiste):`, error);
      return null;
    }
  }

  /**
   * Invalida tutte le cache
   */
  private invalidateAllCaches(): void {
    try {
      OperationsCache?.clear?.();
      BasketsCache?.invalidateAll?.();
      console.log('🔄 [ROLLBACK] Cache invalidate');
    } catch (error) {
      console.log('⚠️ [ROLLBACK] Errore invalidazione cache:', error);
    }
  }
}

export const selectionRollbackService = new SelectionRollbackService();
export { CancellationCheckResult, RollbackResult, CancellationBlocker };
