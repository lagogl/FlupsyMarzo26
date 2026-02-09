/**
 * Service per la gestione dei cicli
 * Contiene tutta la logica business per i cicli produttivi
 */

import { sql, eq, and, asc, desc, isNotNull } from 'drizzle-orm';
import { db, pool } from '../../../db';
import { cycles, baskets, flupsys, lots, operations, pendingClosures } from '../../../../shared/schema';

// Cache service per cicli
interface CacheItem {
  data: any;
  expiresAt: number;
}

class CyclesCacheService {
  private cache: Map<string, CacheItem>;
  private ttl: number;

  constructor() {
    this.cache = new Map();
    this.ttl = 120 * 1000; // 2 minuti
  }

  generateCacheKey(options: Record<string, any> = {}): string {
    return Object.keys(options)
      .filter(key => options[key] !== undefined && options[key] !== null)
      .sort()
      .map(key => `${key}_${options[key]}`)
      .join('_');
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttl
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) {
      console.log(`Cache cicli: nessun dato trovato per chiave "${key}"`);
      return null;
    }

    if (cached.expiresAt < Date.now()) {
      console.log(`Cache cicli: dati scaduti per chiave "${key}"`);
      this.cache.delete(key);
      return null;
    }

    console.log(`Cache cicli: hit per chiave "${key}"`);
    return cached.data;
  }

  clear(): void {
    this.cache.clear();
    console.log('Cache cicli: svuotata');
  }
}

const cacheService = new CyclesCacheService();

export interface CyclesOptions {
  page?: number;
  pageSize?: number;
  state?: string | null;
  flupsyId?: number | null;
  startDateFrom?: string | null;
  startDateTo?: string | null;
  sortBy?: string;
  sortOrder?: string;
  includeAll?: boolean;
}

class CyclesService {
  /**
   * Ottiene cicli con paginazione, filtri e cache
   */
  async getCycles(options: CyclesOptions = {}) {
    const {
      page = 1,
      pageSize = 10,
      state = null,
      flupsyId = null,
      startDateFrom = null,
      startDateTo = null,
      sortBy = 'startDate',
      sortOrder = 'desc',
      includeAll = false
    } = options;

    const startTime = Date.now();
    console.log(`Ricerca cicli ottimizzata con parametri:`, options);

    // Genera chiave di cache
    const cacheKey = cacheService.generateCacheKey({
      page: includeAll ? undefined : page,
      pageSize: includeAll ? undefined : pageSize,
      state,
      flupsyId,
      startDateFrom,
      startDateTo,
      sortBy,
      sortOrder,
      includeAll
    });

    // Controlla cache
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      console.log(`Cicli recuperati dalla cache in ${Date.now() - startTime}ms`);
      return cachedData;
    }

    try {
      // Costruisce query base
      const whereConditions = [];

      if (state) {
        whereConditions.push(eq(cycles.state, state));
      }

      if (flupsyId) {
        whereConditions.push(eq(baskets.flupsyId, flupsyId));
      }

      if (startDateFrom || startDateTo) {
        if (startDateFrom && startDateTo) {
          whereConditions.push(
            and(
              sql`${cycles.startDate} >= ${startDateFrom}`,
              sql`${cycles.startDate} <= ${startDateTo}`
            )
          );
        } else if (startDateFrom) {
          whereConditions.push(sql`${cycles.startDate} >= ${startDateFrom}`);
        } else if (startDateTo) {
          whereConditions.push(sql`${cycles.startDate} <= ${startDateTo}`);
        }
      }

      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Query base con JOIN
      let query = db
        .select({
          id: cycles.id,
          basketId: cycles.basketId,
          lotId: cycles.lotId,
          startDate: cycles.startDate,
          endDate: cycles.endDate,
          state: cycles.state,
          basketPhysicalNumber: baskets.physicalNumber,
          basketState: baskets.state,
          flupsyId: flupsys.id,
          flupsyName: flupsys.name,
          flupsyLocation: flupsys.location,
          lotSupplier: lots.supplier,
          lotArrivalDate: lots.arrivalDate
        })
        .from(cycles)
        .leftJoin(baskets, eq(cycles.basketId, baskets.id))
        .leftJoin(flupsys, eq(baskets.flupsyId, flupsys.id))
        .leftJoin(lots, eq(cycles.lotId, lots.id));

      if (whereClause) {
        query.where(whereClause);
      }

      // Ordinamento
      const orderByColumn = sortBy === 'startDate' ? cycles.startDate : cycles.id;
      const orderByFn = sortOrder === 'asc' ? asc : desc;
      query.orderBy(orderByFn(orderByColumn));

      // Paginazione
      if (!includeAll) {
        const offset = (page - 1) * pageSize;
        query.limit(pageSize).offset(offset);
      }

      const results = await query;

      // Conteggio totale
      let totalCount = results.length;
      if (!includeAll) {
        const countQuery = db
          .select({ count: sql`count(*)`.as('count') })
          .from(cycles)
          .leftJoin(baskets, eq(cycles.basketId, baskets.id));
        
        if (whereClause) {
          countQuery.where(whereClause);
        }
        
        const countResult = await countQuery;
        totalCount = parseInt(countResult[0].count as string);
      }

      const duration = Date.now() - startTime;
      console.log(`Query cicli completata in ${duration}ms - ${results.length} cicli totali (includeAll=${includeAll})`);
      console.log(`Cicli recuperati in ${duration}ms`);

      let response;
      if (includeAll) {
        console.log(`Restituisco tutti i ${results.length} cicli (includeAll=true)`);
        response = {
          cycles: results,
          pagination: {
            page: 1,
            pageSize: results.length,
            totalCount: results.length,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false
          }
        };
      } else {
        const totalPages = Math.ceil(totalCount / pageSize);
        response = {
          cycles: results,
          pagination: {
            page,
            pageSize,
            totalCount,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
          }
        };
      }

      // Salva in cache
      cacheService.set(cacheKey, response);

      return response;
    } catch (error) {
      console.error('Errore recupero cicli:', error);
      throw error;
    }
  }

  /**
   * Ottiene cicli attivi
   */
  async getActiveCycles() {
    const activeCycles = await db
      .select()
      .from(cycles)
      .where(eq(cycles.state, 'active'))
      .orderBy(desc(cycles.startDate));
    
    return activeCycles;
  }

  /**
   * Ottiene cicli attivi con dettagli
   */
  async getActiveCyclesWithDetails() {
    const activeCycles = await db
      .select({
        id: cycles.id,
        basketId: cycles.basketId,
        lotId: cycles.lotId,
        startDate: cycles.startDate,
        endDate: cycles.endDate,
        state: cycles.state,
        basketPhysicalNumber: baskets.physicalNumber,
        flupsyName: flupsys.name
      })
      .from(cycles)
      .leftJoin(baskets, eq(cycles.basketId, baskets.id))
      .leftJoin(flupsys, eq(baskets.flupsyId, flupsys.id))
      .where(eq(cycles.state, 'active'))
      .orderBy(desc(cycles.startDate));
    
    return activeCycles;
  }

  /**
   * Ottiene singolo ciclo per ID con dati basket
   */
  async getCycleById(id: number) {
    const cycle = await db
      .select()
      .from(cycles)
      .where(eq(cycles.id, id))
      .limit(1);
    
    if (!cycle[0]) return null;
    
    const basket = await db
      .select()
      .from(baskets)
      .where(eq(baskets.id, cycle[0].basketId))
      .limit(1);
    
    return {
      ...cycle[0],
      basket: basket[0] ? {
        id: basket[0].id,
        physicalNumber: basket[0].physicalNumber,
        flupsyId: basket[0].flupsyId,
        state: basket[0].state,
      } : null
    };
  }

  /**
   * Ottiene cicli per cestello
   */
  async getCyclesByBasket(basketId: number) {
    const cyclesList = await db
      .select()
      .from(cycles)
      .where(eq(cycles.basketId, basketId))
      .orderBy(desc(cycles.startDate));
    
    return cyclesList;
  }

  /**
   * Crea nuovo ciclo
   */
  async createCycle(data: any) {
    const [newCycle] = await db
      .insert(cycles)
      .values(data)
      .returning();
    
    // Invalida cache
    cacheService.clear();
    
    return newCycle;
  }

  /**
   * Chiude un ciclo con creazione operazione e record pending
   * FASE 1: Chiusura ciclo con animali in attesa di destinazione
   * FASE 2: Operatore assegnerà destinazione (altra-cesta, sand-nursery, mortalità)
   * NOTA: Tutte le operazioni sono eseguite in transazione per garantire atomicità
   */
  async closeCycle(id: number, endDate: string, notes?: string) {
    console.log(`🔄 Avvio chiusura ciclo ${id} con data ${endDate}`);
    
    // 1. Recupera dati del ciclo (prima della transazione per validazione)
    const cycleData = await db
      .select({
        id: cycles.id,
        basketId: cycles.basketId,
        lotId: cycles.lotId,
        state: cycles.state
      })
      .from(cycles)
      .where(eq(cycles.id, id))
      .limit(1);
    
    if (!cycleData[0]) {
      throw new Error(`Ciclo ${id} non trovato`);
    }
    
    const cycle = cycleData[0];
    
    if (cycle.state === 'closed') {
      throw new Error(`Ciclo ${id} già chiuso`);
    }
    
    // 2. Recupera dati del cestello per ottenere flupsyId e cycleCode
    const basketData = await db
      .select({
        flupsyId: baskets.flupsyId,
        physicalNumber: baskets.physicalNumber,
        cycleCode: baskets.cycleCode // Per ripristino in caso di annullamento
      })
      .from(baskets)
      .where(eq(baskets.id, cycle.basketId))
      .limit(1);
    
    const basket = basketData[0];
    if (!basket) {
      throw new Error(`Cestello ${cycle.basketId} non trovato`);
    }
    
    // 3. Recupera l'ultima operazione del ciclo per avere i dati attuali
    const lastOperationData = await db
      .select({
        animalCount: operations.animalCount,
        totalWeight: operations.totalWeight,
        sizeId: operations.sizeId,
        lotId: operations.lotId
      })
      .from(operations)
      .where(eq(operations.cycleId, id))
      .orderBy(desc(operations.date), desc(operations.id))
      .limit(1);
    
    const lastOp = lastOperationData[0];
    const animalCount = lastOp?.animalCount || 0;
    const totalWeight = lastOp?.totalWeight || null;
    const sizeId = lastOp?.sizeId || null; // Mantieni null se non disponibile
    const lotId = lastOp?.lotId || cycle.lotId;
    
    console.log(`📊 Ultima operazione: ${animalCount} animali, ${totalWeight}g, sizeId=${sizeId}`);
    
    // Esegui tutte le operazioni di scrittura in transazione per atomicità
    const result = await db.transaction(async (tx) => {
      // 4. Crea operazione di tipo "chiusura-ciclo"
      const [closureOperation] = await tx
        .insert(operations)
        .values({
          date: endDate,
          type: 'chiusura-ciclo',
          basketId: cycle.basketId,
          cycleId: id,
          sizeId: sizeId || 1, // Default size 1 solo se necessario (schema richiede NOT NULL)
          lotId: lotId,
          animalCount: animalCount,
          totalWeight: totalWeight,
          notes: notes || 'Chiusura ciclo - animali in attesa di destinazione'
        })
        .returning();
      
      console.log(`✅ Creata operazione chiusura-ciclo ID ${closureOperation.id}`);
      
      // 5. Crea record pending_closures per tracciare la destinazione
      const [pendingRecord] = await tx
        .insert(pendingClosures)
        .values({
          cycleId: id,
          basketId: cycle.basketId,
          flupsyId: basket.flupsyId,
          lotId: lotId || 0,
          operationId: closureOperation.id,
          cycleCode: basket.cycleCode, // Salva per ripristino in caso di annullamento
          closureDate: endDate,
          animalCount: animalCount,
          totalWeight: totalWeight,
          sizeId: sizeId,
          destination: 'pending',
          destinationNotes: notes
        })
        .returning();
      
      console.log(`📋 Creato record pending closure ID ${pendingRecord.id}`);
      
      // 6. Chiudi il ciclo
      const [closedCycle] = await tx
        .update(cycles)
        .set({ 
          state: 'closed',
          endDate 
        })
        .where(eq(cycles.id, id))
        .returning();
      
      // 7. Aggiorna il cestello: stato available, rimuovi riferimento al ciclo
      await tx
        .update(baskets)
        .set({ 
          state: 'available',
          currentCycleId: null,
          cycleCode: null
        })
        .where(eq(baskets.id, cycle.basketId));
      
      return {
        cycle: closedCycle,
        operation: closureOperation,
        pendingClosure: pendingRecord
      };
    });
    
    console.log(`✅ Ciclo ${id} chiuso, cestello ${cycle.basketId} disponibile, ${animalCount} animali in attesa destinazione`);
    
    // Invalida cache
    cacheService.clear();
    
    return result;
  }

  /**
   * Ottiene chiusure pendenti (animali in attesa di destinazione)
   */
  async getPendingClosures(flupsyId?: number) {
    let query = db
      .select({
        id: pendingClosures.id,
        cycleId: pendingClosures.cycleId,
        basketId: pendingClosures.basketId,
        flupsyId: pendingClosures.flupsyId,
        lotId: pendingClosures.lotId,
        closureDate: pendingClosures.closureDate,
        animalCount: pendingClosures.animalCount,
        totalWeight: pendingClosures.totalWeight,
        destination: pendingClosures.destination,
        createdAt: pendingClosures.createdAt,
        basketNumber: baskets.physicalNumber,
        flupsyName: flupsys.name,
        lotSupplier: lots.supplier
      })
      .from(pendingClosures)
      .leftJoin(baskets, eq(pendingClosures.basketId, baskets.id))
      .leftJoin(flupsys, eq(pendingClosures.flupsyId, flupsys.id))
      .leftJoin(lots, eq(pendingClosures.lotId, lots.id))
      .where(eq(pendingClosures.destination, 'pending'))
      .orderBy(desc(pendingClosures.createdAt));
    
    if (flupsyId) {
      query = query.where(and(
        eq(pendingClosures.destination, 'pending'),
        eq(pendingClosures.flupsyId, flupsyId)
      ));
    }
    
    return await query;
  }

  /**
   * Conta chiusure pendenti (per notifica)
   */
  async getPendingClosuresCount() {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(pendingClosures)
      .where(eq(pendingClosures.destination, 'pending'));
    
    return result[0]?.count || 0;
  }

  /**
   * Risolve una chiusura pendente assegnando la destinazione
   * NOTA: Tutte le operazioni sono eseguite in transazione per garantire atomicità
   * @param id - ID del record pending_closures
   * @param destination - Tipo destinazione: altra-cesta, sand-nursery, mortalita
   * @param resolvedBy - Nome operatore
   * @param destinationNotes - Note opzionali
   * @param destinationBasketId - ID cestello destinazione (solo per altra-cesta, opzionale)
   */
  async resolvePendingClosure(
    id: number, 
    destination: 'altra-cesta' | 'sand-nursery' | 'mortalita',
    resolvedBy: string,
    destinationNotes?: string,
    destinationBasketId?: number
  ) {
    console.log(`🔄 Risoluzione pending closure ${id} → ${destination}`);
    
    // 1. Recupera il record pending (prima della transazione per validazione)
    const pendingData = await db
      .select()
      .from(pendingClosures)
      .where(eq(pendingClosures.id, id))
      .limit(1);
    
    if (!pendingData[0]) {
      throw new Error(`Pending closure ${id} non trovata`);
    }
    
    const pending = pendingData[0];
    
    if (pending.destination !== 'pending') {
      throw new Error(`Pending closure ${id} già risolta con destinazione: ${pending.destination}`);
    }
    
    const now = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0];
    
    // Esegui tutte le operazioni in transazione per atomicità
    const resolved = await db.transaction(async (tx) => {
      // 2. Se mortalità, aggiorna statistiche lotto
      if (destination === 'mortalita' && pending.lotId) {
        const lotData = await tx
          .select({
            totalMortality: lots.totalMortality
          })
          .from(lots)
          .where(eq(lots.id, pending.lotId))
          .limit(1);
        
        if (lotData[0]) {
          const currentMortality = lotData[0].totalMortality || 0;
          const newTotalMortality = currentMortality + pending.animalCount;
          
          await tx
            .update(lots)
            .set({
              totalMortality: newTotalMortality,
              lastMortalityDate: today,
              mortalityNotes: destinationNotes || 'Mortalità da chiusura ciclo'
            })
            .where(eq(lots.id, pending.lotId));
          
          console.log(`📊 Mortalità lotto ${pending.lotId} aggiornata: ${currentMortality} → ${newTotalMortality}`);
        }
      }
      
      // 3. Aggiorna il record pending_closures
      const [resolvedRecord] = await tx
        .update(pendingClosures)
        .set({
          destination,
          destinationBasketId: destination === 'altra-cesta' ? destinationBasketId : null,
          destinationNotes: destinationNotes || null,
          resolvedAt: now,
          resolvedBy
        })
        .where(eq(pendingClosures.id, id))
        .returning();
      
      return resolvedRecord;
    });
    
    console.log(`✅ Pending closure ${id} risolta: ${pending.animalCount} animali → ${destination}`);
    
    // Invalida cache
    cacheService.clear();
    
    return resolved;
  }

  /**
   * Annulla una chiusura pendente e ripristina lo stato precedente
   * NOTA: Funziona SOLO per chiusure non ancora risolte (destination='pending')
   * Ripristina: ciclo attivo, cestello occupato, elimina operazione e pending record
   */
  async cancelPendingClosure(id: number, cancelledBy: string, reason?: string) {
    console.log(`🔄 Annullamento pending closure ${id}`);
    
    // 1. Recupera il record pending
    const pendingData = await db
      .select()
      .from(pendingClosures)
      .where(eq(pendingClosures.id, id))
      .limit(1);
    
    if (!pendingData[0]) {
      throw new Error(`Pending closure ${id} non trovata`);
    }
    
    const pending = pendingData[0];
    
    if (pending.destination !== 'pending') {
      throw new Error(`Pending closure ${id} già risolta - impossibile annullare`);
    }
    
    // Esegui tutte le operazioni in transazione per atomicità
    await db.transaction(async (tx) => {
      // 2. Riapri il ciclo (stato active, rimuovi endDate)
      await tx
        .update(cycles)
        .set({ 
          state: 'active',
          endDate: null
        })
        .where(eq(cycles.id, pending.cycleId));
      
      console.log(`✅ Ciclo ${pending.cycleId} riaperto`);
      
      // 3. Ripristina il cestello (stato active, riferimento al ciclo)
      await tx
        .update(baskets)
        .set({ 
          state: 'active',
          currentCycleId: pending.cycleId,
          cycleCode: pending.cycleCode
        })
        .where(eq(baskets.id, pending.basketId));
      
      console.log(`✅ Cestello ${pending.basketId} ripristinato`);
      
      // 4. Elimina l'operazione di chiusura-ciclo
      await tx
        .delete(operations)
        .where(and(
          eq(operations.id, pending.operationId),
          eq(operations.type, 'chiusura-ciclo')
        ));
      
      console.log(`✅ Operazione chiusura-ciclo ${pending.operationId} eliminata`);
      
      // 5. Elimina il record pending_closures
      await tx
        .delete(pendingClosures)
        .where(eq(pendingClosures.id, id));
      
      console.log(`✅ Pending closure ${id} eliminata`);
    });
    
    console.log(`✅ Chiusura ciclo ${pending.cycleId} annullata da ${cancelledBy}${reason ? ` - Motivo: ${reason}` : ''}`);
    
    // Invalida cache
    cacheService.clear();
    
    return { 
      success: true, 
      message: `Chiusura ciclo annullata. Ciclo ${pending.cycleId} riattivato.`,
      cycleId: pending.cycleId,
      basketId: pending.basketId
    };
  }

  /**
   * Calcola SGR-Peso per un ciclo
   * SGR = (ln(peso_finale) - ln(peso_iniziale)) / giorni * 100
   * Considera solo operazioni peso e prima-attivazione
   */
  async calculateSgrPeso(cycleId: number): Promise<{
    cycleId: number;
    sgrPesoMedio: number | null;
    sgrPesoIntermedi: Array<{
      fromOperationId: number;
      toOperationId: number;
      fromDate: string;
      toDate: string;
      fromType: string;
      toType: string;
      fromWeight: number;
      toWeight: number;
      days: number;
      sgr: number;
    }>;
    totalDays: number;
    startWeight: number | null;
    endWeight: number | null;
  }> {
    console.log(`📊 SGR-PESO: Calcolo per ciclo ${cycleId}`);
    
    const relevantOps = await db
      .select()
      .from(operations)
      .where(and(
        eq(operations.cycleId, cycleId),
        sql`${operations.type} IN ('peso', 'prima-attivazione', 'misura')`,
        isNotNull(operations.averageWeight)
      ))
      .orderBy(asc(operations.date), asc(operations.id));
    
    console.log(`📊 SGR-PESO: Trovate ${relevantOps.length} operazioni rilevanti`);
    
    if (relevantOps.length < 2) {
      return {
        cycleId,
        sgrPesoMedio: null,
        sgrPesoIntermedi: [],
        totalDays: 0,
        startWeight: relevantOps.length > 0 ? relevantOps[0].averageWeight : null,
        endWeight: relevantOps.length > 0 ? relevantOps[relevantOps.length - 1].averageWeight : null
      };
    }
    
    const sgrPesoIntermedi: Array<{
      fromOperationId: number;
      toOperationId: number;
      fromDate: string;
      toDate: string;
      fromType: string;
      toType: string;
      fromWeight: number;
      toWeight: number;
      days: number;
      sgr: number;
    }> = [];
    
    for (let i = 0; i < relevantOps.length - 1; i++) {
      const op1 = relevantOps[i];
      const op2 = relevantOps[i + 1];
      
      if (!op1.averageWeight || !op2.averageWeight || op1.averageWeight <= 0 || op2.averageWeight <= 0) {
        continue;
      }
      
      const date1 = new Date(op1.date);
      const date2 = new Date(op2.date);
      const days = Math.max(1, Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24)));
      
      const sgr = ((Math.log(op2.averageWeight) - Math.log(op1.averageWeight)) / days) * 100;
      
      sgrPesoIntermedi.push({
        fromOperationId: op1.id,
        toOperationId: op2.id,
        fromDate: op1.date,
        toDate: op2.date,
        fromType: op1.type,
        toType: op2.type,
        fromWeight: op1.averageWeight,
        toWeight: op2.averageWeight,
        days,
        sgr: Math.round(sgr * 100) / 100
      });
    }
    
    let totalWeightedSgr = 0;
    let totalDaysSum = 0;
    
    for (const segment of sgrPesoIntermedi) {
      totalWeightedSgr += segment.sgr * segment.days;
      totalDaysSum += segment.days;
    }
    
    const sgrPesoMedio = totalDaysSum > 0 ? Math.round((totalWeightedSgr / totalDaysSum) * 100) / 100 : null;
    
    const firstOp = relevantOps[0];
    const lastOp = relevantOps[relevantOps.length - 1];
    const totalDays = Math.round((new Date(lastOp.date).getTime() - new Date(firstOp.date).getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(`📊 SGR-PESO: Completato - SGR medio=${sgrPesoMedio}, ${sgrPesoIntermedi.length} segmenti`);
    
    return {
      cycleId,
      sgrPesoMedio,
      sgrPesoIntermedi,
      totalDays,
      startWeight: firstOp.averageWeight,
      endWeight: lastOp.averageWeight
    };
  }
}

export const cyclesService = new CyclesService();
export { cacheService as cyclesCacheService };

/**
 * Funzione helper per invalidare la cache dei cicli
 */
export function clearCache(): void {
  cacheService.clear();
}
