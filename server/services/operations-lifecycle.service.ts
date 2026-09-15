/**
 * OperationsLifecycleService - Servizio centralizzato per la gestione del ciclo di vita delle operazioni
 * 
 * SCOPO: Unificare TUTTA la logica di cancellazione operazioni, cicli e reset cestelli
 * per evitare disallineamenti di stato causati da percorsi di cancellazione diversi.
 * 
 * PROBLEMA RISOLTO: Prima esistevano due implementazioni:
 * - db-storage.ts deleteOperation() - logica completa con cascade
 * - operations.service.ts deleteOperation() - logica minima senza cascade
 * 
 * Ora TUTTI i percorsi di cancellazione devono passare attraverso questo servizio.
 */

import { db } from '../db';
import { 
  operations, 
  cycles, 
  baskets,
  basketLotComposition,
  lotLedger,
  screeningSourceBaskets,
  screeningDestinationBaskets,
  screeningBasketHistory,
  screeningLotReferences,
  selectionSourceBaskets,
  selectionDestinationBaskets,
  selectionBasketHistory,
  selectionLotReferences
} from '../../shared/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { OperationsCache } from '../operations-cache-service.js';
import { BasketsCache } from '../baskets-cache-service.js';
import { positionCache } from '../position-cache-service.js';
import { handleBasketLotCompositionOnDelete } from './basket-lot-composition.service.js';
import { logOperationDeletedIfAvailable } from './audit-log.service.js';
import { runAtomicDeletion } from './atomic-deletion.js';

interface DeleteOperationResult {
  success: boolean;
  operationId: number;
  operationType: string;
  cycleDeleted?: number | null;
  basketReset?: number | null;
  cleanedTables: string[];
  errors: string[];
}

interface SetBasketCycleStateParams {
  basketId: number;
  currentCycleId: number | null;
  cycleCode: string | null;
  state: 'available' | 'active' | 'cessated';
}

interface OperationsLifecycleDependencies {
  handleCompositionDelete: typeof handleBasketLotCompositionOnDelete;
  logDeleted: typeof logOperationDeletedIfAvailable;
  afterCommit?: (
    service: OperationsLifecycleService,
    operation: typeof operations.$inferSelect,
    cascade?: { cycleId: number; basketId: number }
  ) => void | Promise<void>;
}

type DatabaseTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const defaultDependencies: OperationsLifecycleDependencies = {
  handleCompositionDelete: handleBasketLotCompositionOnDelete,
  logDeleted: logOperationDeletedIfAvailable
};

export class OperationsLifecycleService {
  private readonly dependencies: OperationsLifecycleDependencies;

  constructor(
    private readonly database: any = db,
    dependencies: Partial<OperationsLifecycleDependencies> = {}
  ) {
    this.dependencies = { ...defaultDependencies, ...dependencies };
  }
  
  /**
   * METODO PRINCIPALE: Elimina un'operazione con TUTTE le pulizie necessarie
   * 
   * Questo metodo DEVE essere usato da tutte le route e controller per garantire
   * la consistenza dei dati.
   */
  async deleteOperation(operationId: number): Promise<DeleteOperationResult> {
    const result: DeleteOperationResult = {
      success: false,
      operationId,
      operationType: 'unknown',
      cycleDeleted: null,
      basketReset: null,
      cleanedTables: [],
      errors: []
    };

    try {
      console.log(`🔄 [LIFECYCLE] Inizio eliminazione operazione ${operationId}`);

      let committedOperation: typeof operations.$inferSelect | undefined;
      let cascadeNotification: { cycleId: number; basketId: number } | undefined;

      await runAtomicDeletion(this.database, async (tx: DatabaseTransaction) => {
        // Lettura e tutte le scritture condividono la stessa transazione.
        const [operation] = await tx
          .select()
          .from(operations)
          .where(eq(operations.id, operationId));

        if (!operation) {
          throw new Error(`Operazione ${operationId} non trovata`);
        }

        committedOperation = operation;
        result.operationType = operation.type;
        console.log(`📋 [LIFECYCLE] Operazione trovata: tipo=${operation.type}, basketId=${operation.basketId}, cycleId=${operation.cycleId}`);

        if (operation.type === 'prima-attivazione' && operation.cycleId) {
          console.log(`🔗 [LIFECYCLE] Prima-attivazione rilevata - avvio cascade completo`);
          await this.deletePrimaAttivazioneWithCascade(tx, operation, result);
          cascadeNotification = { cycleId: operation.cycleId, basketId: operation.basketId };
          return;
        }

        await this.dependencies.handleCompositionDelete(operation, tx);
        result.cleanedTables.push('basket_lot_composition (checked)');
        await tx.delete(operations).where(eq(operations.id, operationId));
        result.cleanedTables.push('operations');
        await this.dependencies.logDeleted(operationId, operation, {
          cascadeType: 'normal',
          cleanedTables: result.cleanedTables
        }, tx);
      }, () => {
        // Effetti esterni esclusivamente dopo la risoluzione (commit) della transazione.
        if (this.dependencies.afterCommit) {
          return this.dependencies.afterCommit(
            this,
            committedOperation!,
            cascadeNotification
          );
        }
        this.invalidateAllCaches();
        if (cascadeNotification) {
          this.broadcastCascadeDelete(committedOperation!, cascadeNotification.cycleId, cascadeNotification.basketId);
        } else {
          this.broadcastOperationDeleted(committedOperation!);
        }
      });

      result.success = true;
      console.log(`✅ [LIFECYCLE] Operazione ${operationId} eliminata con successo`);
      
      return result;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ [LIFECYCLE] Errore durante eliminazione: ${errorMsg}`);
      // La transazione è stata annullata: nessuna pulizia può essere dichiarata completata.
      result.cleanedTables = [];
      result.cycleDeleted = null;
      result.basketReset = null;
      result.errors.push(errorMsg);
      return result;
    }
  }

  /**
   * Elimina una prima-attivazione con CASCADE COMPLETO:
   * - Tutte le operazioni del ciclo
   * - Tutti i riferimenti in tabelle correlate
   * - Il ciclo stesso
   * - Reset del cestello
   */
  private async deletePrimaAttivazioneWithCascade(
    tx: any,
    operation: typeof operations.$inferSelect,
    result: DeleteOperationResult
  ): Promise<void> {
    
    const cycleId = operation.cycleId!;
    const basketId = operation.basketId;

    console.log(`🔗 [LIFECYCLE] CASCADE per ciclo ${cycleId}, cestello ${basketId}`);

      // FASE 1: Recupera tutte le operazioni del ciclo PRIMA di eliminarle
      // (necessario per poter pulire le tabelle dipendenti)
      const cycleOperations = await tx
        .select()
        .from(operations)
        .where(eq(operations.cycleId, cycleId));

      console.log(`📝 [LIFECYCLE] Trovate ${cycleOperations.length} operazioni nel ciclo ${cycleId}`);

      // FASE 1a: Gestisci composizione lotti misti per TUTTE le operazioni (CRITICO - prima della delete)
      for (const op of cycleOperations) {
        await this.dependencies.handleCompositionDelete(op, tx);
      }
      result.cleanedTables.push('basket_lot_composition (checked for all ops)');

      // FASE 3: Pulisci tutte le altre tabelle correlate al ciclo
      await this.cleanupCycleRelatedTables(tx, cycleId, result);

      // FASE 4: ORA elimina tutte le operazioni del ciclo
      for (const op of cycleOperations) {
        await tx.delete(operations).where(eq(operations.id, op.id));
      }
      result.cleanedTables.push(`operations (${cycleOperations.length} record)`);

      // FASE 3: Elimina il ciclo
      await tx.delete(cycles).where(eq(cycles.id, cycleId));
      result.cleanedTables.push('cycles');
      result.cycleDeleted = cycleId;
      console.log(`🗑️ [LIFECYCLE] Ciclo ${cycleId} eliminato`);

      // FASE 4: Reset del cestello (CRITICO - usa il metodo unificato)
      await this.setBasketCycleStateWithExecutor(tx, {
        basketId,
        currentCycleId: null,
        cycleCode: null,
        state: 'available'
      });
      result.basketReset = basketId;
      result.cleanedTables.push('baskets (reset state)');
      console.log(`🔄 [LIFECYCLE] Cestello ${basketId} resettato a disponibile`);

      // FASE 4b: Registra nel log di audit (cascade)
      await this.dependencies.logDeleted(operation.id, operation, {
        cascadeType: 'prima-attivazione',
        cycleId,
        basketId,
        operationsDeleted: cycleOperations.length,
        cleanedTables: result.cleanedTables
      }, tx);
      console.log(`✅ [LIFECYCLE] CASCADE DB completato per prima-attivazione ${operation.id}`);
  }

  /**
   * Pulisce tutte le tabelle correlate a un ciclo
   */
  private async cleanupCycleRelatedTables(tx: any, cycleId: number, result: DeleteOperationResult): Promise<void> {
      const protectedHistoryChecks = await Promise.all([
        tx.select({ id: screeningSourceBaskets.id }).from(screeningSourceBaskets)
          .where(eq(screeningSourceBaskets.cycleId, cycleId)),
        tx.select({ id: screeningBasketHistory.id }).from(screeningBasketHistory)
          .where(eq(screeningBasketHistory.sourceCycleId, cycleId)),
        tx.select({ id: screeningBasketHistory.id }).from(screeningBasketHistory)
          .where(eq(screeningBasketHistory.destinationCycleId, cycleId)),
        tx.select({ id: screeningLotReferences.id }).from(screeningLotReferences)
          .where(eq(screeningLotReferences.destinationCycleId, cycleId)),
        tx.select({ id: selectionSourceBaskets.id }).from(selectionSourceBaskets)
          .where(eq(selectionSourceBaskets.cycleId, cycleId)),
        tx.select({ id: selectionBasketHistory.id }).from(selectionBasketHistory)
          .where(eq(selectionBasketHistory.sourceCycleId, cycleId)),
        tx.select({ id: selectionBasketHistory.id }).from(selectionBasketHistory)
          .where(eq(selectionBasketHistory.destinationCycleId, cycleId)),
        tx.select({ id: selectionLotReferences.id }).from(selectionLotReferences)
          .where(eq(selectionLotReferences.destinationCycleId, cycleId)),
      ]);

      if (protectedHistoryChecks.some(rows => rows.length > 0)) {
        throw new Error(
          `Impossibile cancellare il ciclo ${cycleId}: esistono riferimenti storici di vagliatura o selezione che devono essere conservati.`,
        );
      }
    
    // 1. basket_lot_composition
      const deletedCompositions = await tx.delete(basketLotComposition)
        .where(eq(basketLotComposition.cycleId, cycleId))
        .returning({ id: basketLotComposition.id });
      if (deletedCompositions.length > 0) {
        result.cleanedTables.push(`basket_lot_composition (${deletedCompositions.length})`);
      }

    // 3. lot_ledger (SET NULL per preservare storico)
      await tx.update(lotLedger)
        .set({ sourceCycleId: null })
        .where(eq(lotLedger.sourceCycleId, cycleId));
      await tx.update(lotLedger)
        .set({ destCycleId: null })
        .where(eq(lotLedger.destCycleId, cycleId));
      result.cleanedTables.push('lot_ledger (nullified refs)');

    // 6. screening_destination_baskets
      await tx.update(screeningDestinationBaskets)
        .set({ cycleId: null })
        .where(eq(screeningDestinationBaskets.cycleId, cycleId));
      result.cleanedTables.push('screening_destination_baskets');

    // 10. selection_destination_baskets
      await tx.update(selectionDestinationBaskets)
        .set({ cycleId: null })
        .where(eq(selectionDestinationBaskets.cycleId, cycleId));
      result.cleanedTables.push('selection_destination_baskets');

    console.log(`🧹 [LIFECYCLE] Pulizia tabelle correlate completata per ciclo ${cycleId}`);
  }

  /**
   * METODO UNIFICATO per aggiornare lo stato del cestello
   * 
   * CRITICO: Questo metodo aggiorna SEMPRE tutti e 3 i campi insieme:
   * - currentCycleId
   * - cycleCode
   * - state
   * 
   * Questo previene disallineamenti causati da aggiornamenti parziali.
   */
  async setBasketCycleState(params: SetBasketCycleStateParams): Promise<void> {
    return this.setBasketCycleStateWithExecutor(db, params);
  }

  private async setBasketCycleStateWithExecutor(executor: any, params: SetBasketCycleStateParams): Promise<void> {
    const { basketId, currentCycleId, cycleCode, state } = params;

    console.log(`🔄 [LIFECYCLE] setBasketCycleState - basketId=${basketId}, cycleId=${currentCycleId}, code=${cycleCode}, state=${state}`);

    // FIX: Rimuovi dal gruppo quando il cestello diventa available
    const updateData: any = {
      currentCycleId,
      cycleCode,
      state,
      nfcData: currentCycleId === null ? null : undefined // Reset NFC solo se si libera il cestello
    };
    
    // Quando il cestello diventa available, rimuovilo dal gruppo
    if (state === 'available') {
      updateData.groupId = null;
    }

    await executor.update(baskets)
      .set(updateData)
      .where(eq(baskets.id, basketId));

    console.log(`✅ [LIFECYCLE] Stato cestello ${basketId} aggiornato: ${state}, cycleId=${currentCycleId}`);
  }

  /**
   * METODO CENTRALIZZATO: Invalida tutte le cache rilevanti
   * 
   * IMPORTANTE: Questo metodo DEVE essere chiamato dopo qualsiasi operazione
   * che modifica dati che potrebbero essere cachati (operazioni, cestelli, cicli).
   * 
   * Cache invalidate:
   * 1. OperationsCache - cache operazioni
   * 2. BasketsCache - cache cestelli
   * 3. positionCache - cache posizioni cestelli
   * 4. UnifiedCache - cache controller unificato
   * 5. CyclesCache - cache cicli
   */
  invalidateAllCaches(): void {
    console.log('🔄 [LIFECYCLE] === INVALIDAZIONE CACHE CENTRALIZZATA ===');
    const invalidated: string[] = [];
    const errors: string[] = [];

    // 1. Cache operazioni
    try {
      OperationsCache.clear();
      invalidated.push('operations');
    } catch (e) {
      errors.push(`operations: ${e instanceof Error ? e.message : String(e)}`);
    }

    // 2. Cache cestelli
    try {
      BasketsCache.clear();
      invalidated.push('baskets');
    } catch (e) {
      errors.push(`baskets: ${e instanceof Error ? e.message : String(e)}`);
    }

    // 3. Cache posizioni
    try {
      positionCache.invalidateAll();
      invalidated.push('positions');
    } catch (e) {
      errors.push(`positions: ${e instanceof Error ? e.message : String(e)}`);
    }

    // 4. Cache unificata (async import per evitare dipendenze circolari)
    import('../controllers/operations-unified-controller.js')
      .then(module => {
        if (module.invalidateUnifiedCache) {
          module.invalidateUnifiedCache();
          console.log('🗑️ [LIFECYCLE] Cache unificata invalidata');
        }
      })
      .catch(e => console.warn('⚠️ [LIFECYCLE] Cache unificata non disponibile:', e.message));

    // 5. Cache cicli (async import per evitare dipendenze circolari)
    import('../modules/operations/cycles/cycles.controller.js')
      .then(module => {
        if (module.clearCyclesCache) {
          module.clearCyclesCache();
          console.log('🗑️ [LIFECYCLE] Cache cicli invalidata');
        }
      })
      .catch(e => console.warn('⚠️ [LIFECYCLE] Cache cicli non disponibile:', e.message));

    // Report risultato
    if (errors.length === 0) {
      console.log(`✅ [LIFECYCLE] Cache invalidate: ${invalidated.join(', ')}`);
    } else {
      console.log(`⚠️ [LIFECYCLE] Cache invalidate: ${invalidated.join(', ')}; Errori: ${errors.join(', ')}`);
    }
  }

  /**
   * Invia notifiche WebSocket per operazione eliminata
   */
  private broadcastOperationDeleted(operation: typeof operations.$inferSelect): void {
    if (typeof (global as any).broadcastUpdate === 'function') {
      (global as any).broadcastUpdate('operation_deleted', {
        operationId: operation.id,
        basketId: operation.basketId,
        operationType: operation.type,
        message: `Operazione ${operation.type} eliminata`
      });
      console.log('📡 [LIFECYCLE] Notifica WebSocket operation_deleted inviata');
    }
  }

  /**
   * Invia notifiche WebSocket per cascade delete (prima-attivazione)
   */
  private broadcastCascadeDelete(
    operation: typeof operations.$inferSelect,
    cycleId: number,
    basketId: number
  ): void {
    if (typeof (global as any).broadcastUpdate === 'function') {
      // Notifica eliminazione operazione
      (global as any).broadcastUpdate('operation_deleted', {
        operationId: operation.id,
        basketId,
        operationType: operation.type,
        cascade: true,
        message: `Prima-attivazione eliminata con cascade`
      });

      // Notifica eliminazione ciclo
      (global as any).broadcastUpdate('cycle_deleted', {
        cycleId,
        basketId,
        message: `Ciclo eliminato dopo rimozione prima attivazione`
      });

      // Notifica aggiornamento cestello
      (global as any).broadcastUpdate('basket_updated', {
        basketId,
        state: 'available',
        currentCycleId: null,
        cycleCode: null,
        message: `Cestello resettato dopo eliminazione ciclo`
      });

      console.log('📡 [LIFECYCLE] Notifiche WebSocket cascade inviate');
    }
  }

  /**
   * Verifica l'integrità dello stato di un cestello
   * Utile per diagnostica e correzioni
   */
  async verifyBasketState(basketId: number): Promise<{
    isConsistent: boolean;
    issues: string[];
    currentState: any;
  }> {
    const issues: string[] = [];

    const [basket] = await db.select().from(baskets).where(eq(baskets.id, basketId));
    
    if (!basket) {
      return { isConsistent: false, issues: ['Cestello non trovato'], currentState: null };
    }

    // Verifica 1: Se ha currentCycleId, il ciclo deve esistere
    if (basket.currentCycleId) {
      const [cycle] = await db.select().from(cycles).where(eq(cycles.id, basket.currentCycleId));
      if (!cycle) {
        issues.push(`currentCycleId=${basket.currentCycleId} punta a un ciclo inesistente`);
      } else if (cycle.state !== 'active') {
        issues.push(`currentCycleId=${basket.currentCycleId} punta a un ciclo non attivo (${cycle.state})`);
      }
    }

    // Verifica 2: Se stato è 'active', deve avere currentCycleId
    if (basket.state === 'active' && !basket.currentCycleId) {
      issues.push(`Stato='active' ma currentCycleId è null`);
    }

    // Verifica 3: Se stato è 'available', non deve avere currentCycleId
    if (basket.state === 'available' && basket.currentCycleId) {
      issues.push(`Stato='available' ma currentCycleId=${basket.currentCycleId}`);
    }

    // Verifica 4: cycleCode deve essere coerente con currentCycleId
    if (basket.currentCycleId && !basket.cycleCode) {
      issues.push(`Ha currentCycleId ma cycleCode è null`);
    }
    if (!basket.currentCycleId && basket.cycleCode) {
      issues.push(`Non ha currentCycleId ma cycleCode='${basket.cycleCode}'`);
    }

    return {
      isConsistent: issues.length === 0,
      issues,
      currentState: {
        id: basket.id,
        physicalNumber: basket.physicalNumber,
        state: basket.state,
        currentCycleId: basket.currentCycleId,
        cycleCode: basket.cycleCode
      }
    };
  }

  /**
   * Corregge lo stato di un cestello inconsistente
   */
  async fixBasketState(basketId: number): Promise<{
    fixed: boolean;
    actions: string[];
  }> {
    const verification = await this.verifyBasketState(basketId);
    const actions: string[] = [];

    if (verification.isConsistent) {
      return { fixed: true, actions: ['Nessuna correzione necessaria'] };
    }

    console.log(`🔧 [LIFECYCLE] Correzione cestello ${basketId}, problemi: ${verification.issues.join(', ')}`);

    const [basket] = await db.select().from(baskets).where(eq(baskets.id, basketId));

    // Determina lo stato corretto
    if (basket.currentCycleId) {
      // Verifica se il ciclo esiste ed è attivo
      const [cycle] = await db.select().from(cycles).where(eq(cycles.id, basket.currentCycleId));
      
      if (!cycle || cycle.state !== 'active') {
        // Il ciclo non esiste o non è attivo -> libera il cestello
        await this.setBasketCycleState({
          basketId,
          currentCycleId: null,
          cycleCode: null,
          state: 'available'
        });
        actions.push(`Reset a available (ciclo ${basket.currentCycleId} non valido)`);
      } else {
        // Il ciclo esiste ed è attivo -> assicurati che lo stato sia active
        await this.setBasketCycleState({
          basketId,
          currentCycleId: cycle.id,
          cycleCode: null,
          state: 'active'
        });
        actions.push(`Sincronizzato con ciclo attivo ${cycle.id}`);
      }
    } else {
      // Non ha currentCycleId -> deve essere available
      await this.setBasketCycleState({
        basketId,
        currentCycleId: null,
        cycleCode: null,
        state: 'available'
      });
      actions.push(`Reset a available (nessun ciclo associato)`);
    }

    return { fixed: true, actions };
  }
}

export const operationsLifecycleService = new OperationsLifecycleService();

/**
 * FUNZIONE HELPER ESPORTATA: setBasketCycleState
 * 
 * Questa funzione DEVE essere usata ovunque si modifichi lo stato di un cestello
 * per garantire consistenza tra currentCycleId, cycleCode e state.
 * 
 * @param params - Parametri per l'aggiornamento dello stato
 */
export async function setBasketCycleState(params: {
  basketId: number;
  currentCycleId: number | null;
  cycleCode: string | null;
  state: 'available' | 'active' | 'cessated';
}): Promise<void> {
  return operationsLifecycleService.setBasketCycleState(params);
}

/**
 * FUNZIONE HELPER ESPORTATA: invalidateAllCaches
 * 
 * IMPORTANTE: Questa funzione DEVE essere usata ovunque si invalidano le cache
 * invece di chiamare singolarmente le varie cache.
 * 
 * Invalida tutte le cache: operazioni, cestelli, posizioni, unificata, cicli.
 */
export function invalidateAllCaches(): void {
  return operationsLifecycleService.invalidateAllCaches();
}
