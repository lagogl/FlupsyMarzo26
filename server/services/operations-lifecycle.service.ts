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
  cycleImpacts,
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

class OperationsLifecycleService {
  
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

      // 1. Recupera i dettagli dell'operazione
      const [operation] = await db
        .select()
        .from(operations)
        .where(eq(operations.id, operationId));

      if (!operation) {
        console.log(`❌ [LIFECYCLE] Operazione ${operationId} non trovata`);
        result.errors.push(`Operazione ${operationId} non trovata`);
        return result;
      }

      result.operationType = operation.type;
      console.log(`📋 [LIFECYCLE] Operazione trovata: tipo=${operation.type}, basketId=${operation.basketId}, cycleId=${operation.cycleId}`);

      // 2. Verifica se è una prima-attivazione (richiede cascade completo)
      if (operation.type === 'prima-attivazione' && operation.cycleId) {
        console.log(`🔗 [LIFECYCLE] Prima-attivazione rilevata - avvio cascade completo`);
        return await this.deletePrimaAttivazioneWithCascade(operation, result);
      }

      // 3. Per operazioni normali:
      // 3a. PRIMA gestisci la composizione lotti misti (CRITICO - deve essere fatto PRIMA della delete)
      console.log(`🎯 [LIFECYCLE] Gestione composizione lotti misti per operazione ${operationId}`);
      await handleBasketLotCompositionOnDelete(operation);
      result.cleanedTables.push('basket_lot_composition (checked)');

      // 3b. Elimina operation_impacts associati
      try {
        await db.execute(sql`DELETE FROM operation_impacts WHERE operation_id = ${operationId}`);
        result.cleanedTables.push('operation_impacts');
      } catch (e) {
        console.log(`⚠️ [LIFECYCLE] Nessun operation_impacts per operazione ${operationId}`);
      }

      // 3c. Elimina l'operazione
      console.log(`🗑️ [LIFECYCLE] Eliminazione operazione normale ${operationId}`);
      await db.delete(operations).where(eq(operations.id, operationId));
      result.cleanedTables.push('operations');

      // 4. Invalida cache
      this.invalidateAllCaches();

      // 5. Invia notifiche WebSocket
      this.broadcastOperationDeleted(operation);

      result.success = true;
      console.log(`✅ [LIFECYCLE] Operazione ${operationId} eliminata con successo`);
      
      return result;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ [LIFECYCLE] Errore durante eliminazione: ${errorMsg}`);
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
    operation: typeof operations.$inferSelect,
    result: DeleteOperationResult
  ): Promise<DeleteOperationResult> {
    
    const cycleId = operation.cycleId!;
    const basketId = operation.basketId;

    console.log(`🔗 [LIFECYCLE] CASCADE per ciclo ${cycleId}, cestello ${basketId}`);

    try {
      // FASE 1: Recupera tutte le operazioni del ciclo PRIMA di eliminarle
      // (necessario per poter pulire le tabelle dipendenti)
      const cycleOperations = await db
        .select()
        .from(operations)
        .where(eq(operations.cycleId, cycleId));

      console.log(`📝 [LIFECYCLE] Trovate ${cycleOperations.length} operazioni nel ciclo ${cycleId}`);
      const operationIds = cycleOperations.map(op => op.id);

      // FASE 1a: Gestisci composizione lotti misti per TUTTE le operazioni (CRITICO - prima della delete)
      for (const op of cycleOperations) {
        await handleBasketLotCompositionOnDelete(op);
      }
      result.cleanedTables.push('basket_lot_composition (checked for all ops)');

      // FASE 2: Pulisci operation_impacts PRIMA di eliminare le operazioni
      // (usa gli ID pre-fetchati perché dopo la delete non li troveremmo)
      if (operationIds.length > 0) {
        try {
          await db.execute(sql`DELETE FROM operation_impacts WHERE operation_id IN (${sql.join(operationIds.map(id => sql`${id}`), sql`, `)})`);
          result.cleanedTables.push('operation_impacts');
        } catch (e) {
          console.log(`⚠️ [LIFECYCLE] Nessun operation_impacts per le operazioni del ciclo`);
        }
      }

      // FASE 3: Pulisci tutte le altre tabelle correlate al ciclo
      await this.cleanupCycleRelatedTables(cycleId, result);

      // FASE 4: ORA elimina tutte le operazioni del ciclo
      for (const op of cycleOperations) {
        await db.delete(operations).where(eq(operations.id, op.id));
      }
      result.cleanedTables.push(`operations (${cycleOperations.length} record)`);

      // FASE 3: Elimina il ciclo
      await db.delete(cycles).where(eq(cycles.id, cycleId));
      result.cleanedTables.push('cycles');
      result.cycleDeleted = cycleId;
      console.log(`🗑️ [LIFECYCLE] Ciclo ${cycleId} eliminato`);

      // FASE 4: Reset del cestello (CRITICO - usa il metodo unificato)
      await this.setBasketCycleState({
        basketId,
        currentCycleId: null,
        cycleCode: null,
        state: 'available'
      });
      result.basketReset = basketId;
      result.cleanedTables.push('baskets (reset state)');
      console.log(`🔄 [LIFECYCLE] Cestello ${basketId} resettato a disponibile`);

      // FASE 5: Invalida cache
      this.invalidateAllCaches();

      // FASE 6: Invia notifiche WebSocket
      this.broadcastCascadeDelete(operation, cycleId, basketId);

      result.success = true;
      console.log(`✅ [LIFECYCLE] CASCADE completato per prima-attivazione ${operation.id}`);

      return result;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ [LIFECYCLE] Errore durante CASCADE: ${errorMsg}`);
      result.errors.push(errorMsg);
      return result;
    }
  }

  /**
   * Pulisce tutte le tabelle correlate a un ciclo
   */
  private async cleanupCycleRelatedTables(cycleId: number, result: DeleteOperationResult): Promise<void> {
    
    // 1. operation_impacts
    try {
      await db.execute(sql`
        DELETE FROM operation_impacts 
        WHERE operation_id IN (SELECT id FROM operations WHERE cycle_id = ${cycleId})
      `);
      result.cleanedTables.push('operation_impacts');
    } catch (e) {
      console.log(`⚠️ [LIFECYCLE] Tabella operation_impacts non presente o vuota`);
    }

    // 2. basket_lot_composition
    try {
      const deleted = await db.delete(basketLotComposition)
        .where(eq(basketLotComposition.cycleId, cycleId))
        .returning({ id: basketLotComposition.id });
      if (deleted.length > 0) {
        result.cleanedTables.push(`basket_lot_composition (${deleted.length})`);
      }
    } catch (e) {
      console.warn(`⚠️ [LIFECYCLE] Errore pulizia basket_lot_composition:`, e);
    }

    // 3. cycle_impacts
    try {
      const deleted = await db.delete(cycleImpacts)
        .where(eq(cycleImpacts.cycleId, cycleId))
        .returning({ id: cycleImpacts.id });
      if (deleted.length > 0) {
        result.cleanedTables.push(`cycle_impacts (${deleted.length})`);
      }
    } catch (e) {
      console.warn(`⚠️ [LIFECYCLE] Errore pulizia cycle_impacts:`, e);
    }

    // 4. lot_ledger (SET NULL per preservare storico)
    try {
      await db.update(lotLedger)
        .set({ sourceCycleId: null })
        .where(eq(lotLedger.sourceCycleId, cycleId));
      await db.update(lotLedger)
        .set({ destCycleId: null })
        .where(eq(lotLedger.destCycleId, cycleId));
      result.cleanedTables.push('lot_ledger (nullified refs)');
    } catch (e) {
      console.warn(`⚠️ [LIFECYCLE] Errore pulizia lot_ledger:`, e);
    }

    // 5. screening_source_baskets
    try {
      await db.update(screeningSourceBaskets)
        .set({ cycleId: null })
        .where(eq(screeningSourceBaskets.cycleId, cycleId));
      result.cleanedTables.push('screening_source_baskets');
    } catch (e) {
      console.warn(`⚠️ [LIFECYCLE] Errore pulizia screening_source_baskets:`, e);
    }

    // 6. screening_destination_baskets
    try {
      await db.update(screeningDestinationBaskets)
        .set({ cycleId: null })
        .where(eq(screeningDestinationBaskets.cycleId, cycleId));
      result.cleanedTables.push('screening_destination_baskets');
    } catch (e) {
      console.warn(`⚠️ [LIFECYCLE] Errore pulizia screening_destination_baskets:`, e);
    }

    // 7. screening_basket_history
    try {
      await db.update(screeningBasketHistory)
        .set({ sourceCycleId: null })
        .where(eq(screeningBasketHistory.sourceCycleId, cycleId));
      await db.update(screeningBasketHistory)
        .set({ destinationCycleId: null })
        .where(eq(screeningBasketHistory.destinationCycleId, cycleId));
      result.cleanedTables.push('screening_basket_history');
    } catch (e) {
      console.warn(`⚠️ [LIFECYCLE] Errore pulizia screening_basket_history:`, e);
    }

    // 8. screening_lot_references
    try {
      await db.update(screeningLotReferences)
        .set({ destinationCycleId: null })
        .where(eq(screeningLotReferences.destinationCycleId, cycleId));
      result.cleanedTables.push('screening_lot_references');
    } catch (e) {
      console.warn(`⚠️ [LIFECYCLE] Errore pulizia screening_lot_references:`, e);
    }

    // 9. selection_source_baskets
    try {
      await db.update(selectionSourceBaskets)
        .set({ cycleId: null })
        .where(eq(selectionSourceBaskets.cycleId, cycleId));
      result.cleanedTables.push('selection_source_baskets');
    } catch (e) {
      console.warn(`⚠️ [LIFECYCLE] Errore pulizia selection_source_baskets:`, e);
    }

    // 10. selection_destination_baskets
    try {
      await db.update(selectionDestinationBaskets)
        .set({ cycleId: null })
        .where(eq(selectionDestinationBaskets.cycleId, cycleId));
      result.cleanedTables.push('selection_destination_baskets');
    } catch (e) {
      console.warn(`⚠️ [LIFECYCLE] Errore pulizia selection_destination_baskets:`, e);
    }

    // 11. selection_basket_history
    try {
      await db.update(selectionBasketHistory)
        .set({ sourceCycleId: null })
        .where(eq(selectionBasketHistory.sourceCycleId, cycleId));
      await db.update(selectionBasketHistory)
        .set({ destinationCycleId: null })
        .where(eq(selectionBasketHistory.destinationCycleId, cycleId));
      result.cleanedTables.push('selection_basket_history');
    } catch (e) {
      console.warn(`⚠️ [LIFECYCLE] Errore pulizia selection_basket_history:`, e);
    }

    // 12. selection_lot_references
    try {
      await db.update(selectionLotReferences)
        .set({ destinationCycleId: null })
        .where(eq(selectionLotReferences.destinationCycleId, cycleId));
      result.cleanedTables.push('selection_lot_references');
    } catch (e) {
      console.warn(`⚠️ [LIFECYCLE] Errore pulizia selection_lot_references:`, e);
    }

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
    const { basketId, currentCycleId, cycleCode, state } = params;

    console.log(`🔄 [LIFECYCLE] setBasketCycleState - basketId=${basketId}, cycleId=${currentCycleId}, code=${cycleCode}, state=${state}`);

    await db.update(baskets)
      .set({
        currentCycleId,
        cycleCode,
        state,
        nfcData: currentCycleId === null ? null : undefined // Reset NFC solo se si libera il cestello
      })
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
          cycleCode: cycle.code,
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
