/**
 * Service per la gestione delle operazioni
 * Contiene tutta la logica business per operazioni (prima-attivazione, screening, etc.)
 */

import { db } from '../../../db';
import { operations, baskets, flupsys, lots, sizes, basketLotComposition, cycles } from '../../../../shared/schema';
import { sql, eq, and, or, between, desc, inArray } from 'drizzle-orm';
import { OperationsCache } from '../../../operations-cache-service';
import { isBasketMixedLot, getBasketLotComposition } from '../../../services/basket-lot-composition.service';

// Colonne per le query ottimizzate
const OPERATION_COLUMNS = {
  id: operations.id,
  date: operations.date,
  type: operations.type,
  basketId: operations.basketId,
  cycleId: operations.cycleId,
  sizeId: operations.sizeId,
  sgrId: operations.sgrId,
  lotId: operations.lotId,
  animalCount: operations.animalCount,
  totalWeight: operations.totalWeight,
  animalsPerKg: operations.animalsPerKg,
  averageWeight: operations.averageWeight,
  deadCount: operations.deadCount,
  mortalityRate: operations.mortalityRate,
  notes: operations.notes,
  metadata: operations.metadata,
  lot_id: lots.id,
  lot_arrivalDate: lots.arrivalDate,
  lot_supplier: lots.supplier,
  lot_supplierLotNumber: lots.supplierLotNumber,
  lot_quality: lots.quality,
  lot_animalCount: lots.animalCount,
  lot_weight: lots.weight,
  lot_notes: lots.notes,
  flupsyName: flupsys.name,
  // Aggiungi campi per size
  size_id: sizes.id,
  size_code: sizes.code,
  size_name: sizes.name
};

export interface OperationsOptions {
  page?: number;
  pageSize?: number;
  cycleId?: number;
  basketId?: number;
  flupsyId?: number;
  dateFrom?: Date | string | null;
  dateTo?: Date | string | null;
  type?: string;
}

class OperationsService {
  /**
   * Ottiene operazioni con paginazione, filtri e cache
   */
  async getOperations(options: OperationsOptions = {}) {
    const startTime = Date.now();
    console.log('Richiesta operazioni ottimizzata con opzioni:', options);
    
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const offset = (page - 1) * pageSize;
    
    // Converte date da string a oggetti Date se necessario
    const dateFrom = options.dateFrom instanceof Date ? options.dateFrom : 
                    options.dateFrom ? new Date(options.dateFrom) : null;
    
    const dateTo = options.dateTo instanceof Date ? options.dateTo : 
                  options.dateTo ? new Date(options.dateTo) : null;
    
    // Genera chiave di cache
    const cacheKey = OperationsCache.generateCacheKey({
      page,
      pageSize,
      cycleId: options.cycleId,
      flupsyId: options.flupsyId,
      basketId: options.basketId,
      dateFrom: dateFrom?.toISOString().split('T')[0],
      dateTo: dateTo?.toISOString().split('T')[0],
      type: options.type
    });
    
    // Controlla se i risultati sono in cache
    const cachedResults = OperationsCache.get(cacheKey);
    if (cachedResults) {
      console.log(`Operazioni recuperate dalla cache in ${Date.now() - startTime}ms`);
      return cachedResults;
    }
    
    try {
      // Costruisci le condizioni di filtro
      const whereConditions: any[] = [];
      
      if (options.cycleId) {
        whereConditions.push(eq(operations.cycleId, options.cycleId));
      }
      
      if (options.basketId) {
        whereConditions.push(eq(operations.basketId, options.basketId));
      }
      
      // Filtro per intervallo di date
      if (dateFrom && dateTo) {
        const fromDateStr = dateFrom.toISOString().split('T')[0];
        const toDateStr = dateTo.toISOString().split('T')[0];
        whereConditions.push(between(operations.date, fromDateStr, toDateStr));
      } else if (dateFrom) {
        const fromDateStr = dateFrom.toISOString().split('T')[0];
        whereConditions.push(sql`${operations.date} >= ${fromDateStr}`);
      } else if (dateTo) {
        const toDateStr = dateTo.toISOString().split('T')[0];
        whereConditions.push(sql`${operations.date} <= ${toDateStr}`);
      }
      
      if (options.type) {
        whereConditions.push(sql`${operations.type} = ${options.type}`);
      }
      
      // Filtro per flupsyId con subquery ottimizzata
      if (options.flupsyId) {
        const basketSubquery = db
          .select({ id: baskets.id })
          .from(baskets)
          .where(eq(baskets.flupsyId, options.flupsyId));
        
        const basketIds = await basketSubquery;
        
        if (basketIds.length > 0) {
          const ids = basketIds.map(b => b.id);
          whereConditions.push(inArray(operations.basketId, ids));
        } else {
          console.log(`Nessun cestello trovato per flupsyId ${options.flupsyId}`);
          return { operations: [], totalCount: 0 };
        }
      }
      
      const whereClause = whereConditions.length > 0 
        ? and(...whereConditions) 
        : undefined;
      
      // Query per conteggio
      const countQuery = db
        .select({ count: sql`count(*)`.as('count') })
        .from(operations);
      
      if (whereClause) {
        countQuery.where(whereClause);
      }
      
      const countResult = await countQuery;
      const totalCount = parseInt(countResult[0].count as string);
      
      // Query principale con paginazione e JOIN
      let query = db
        .select(OPERATION_COLUMNS)
        .from(operations)
        .leftJoin(lots, eq(operations.lotId, lots.id))
        .leftJoin(baskets, eq(operations.basketId, baskets.id))
        .leftJoin(flupsys, eq(baskets.flupsyId, flupsys.id))
        .leftJoin(sizes, eq(operations.sizeId, sizes.id))
        .orderBy(desc(operations.date))
        .limit(pageSize)
        .offset(offset);
      
      if (whereClause) {
        query.where(whereClause);
      }
      
      const results = await query;
      
      // Batch preload composizioni
      const basketCyclePairs = results
        .filter(row => row.basketId && row.cycleId)
        .map(row => ({ basketId: row.basketId, cycleId: row.cycleId }));
      
      const compositionsMap = new Map<string, any[]>();
      
      if (basketCyclePairs.length > 0) {
        // Ottimizzazione: usa IN invece di OR multipli
        const uniqueBasketIds = [...new Set(basketCyclePairs.map(p => p.basketId))];
        const uniqueCycleIds = [...new Set(basketCyclePairs.map(p => p.cycleId))];
        
        // Crea un Set delle coppie valide per filtro rapido
        const validPairs = new Set(basketCyclePairs.map(p => `${p.basketId}-${p.cycleId}`));
        
        const allCompositions = await db
          .select({
            basketId: basketLotComposition.basketId,
            cycleId: basketLotComposition.cycleId,
            lotId: basketLotComposition.lotId,
            animalCount: basketLotComposition.animalCount,
            percentage: basketLotComposition.percentage,
            notes: basketLotComposition.notes,
            lotArrivalDate: lots.arrivalDate,
            lotSupplier: lots.supplier,
            lotSupplierLotNumber: lots.supplierLotNumber,
            lotQuality: lots.quality,
            lotAnimalCount: lots.animalCount,
            lotWeight: lots.weight,
            lotNotes: lots.notes
          })
          .from(basketLotComposition)
          .leftJoin(lots, eq(basketLotComposition.lotId, lots.id))
          .where(
            and(
              inArray(basketLotComposition.basketId, uniqueBasketIds),
              inArray(basketLotComposition.cycleId, uniqueCycleIds)
            )
          )
          .orderBy(desc(basketLotComposition.percentage));
        
        // Filtra solo le coppie valide (in memoria)
        for (const comp of allCompositions) {
          const key = `${comp.basketId}-${comp.cycleId}`;
          if (validPairs.has(key)) {
            if (!compositionsMap.has(key)) {
              compositionsMap.set(key, []);
            }
            compositionsMap.get(key)!.push(comp);
          }
        }
      }
      
      // Trasforma risultati
      const transformedResults = results.map((row) => {
        let lot = null;
        let lotComposition = null;
        
        if (row.basketId && row.cycleId) {
          const key = `${row.basketId}-${row.cycleId}`;
          const composition = compositionsMap.get(key);
          
          if (composition && composition.length > 0) {
            if (composition.length === 1) {
              lot = {
                id: composition[0].lotId,
                arrivalDate: composition[0].lotArrivalDate,
                supplier: composition[0].lotSupplier,
                supplierLotNumber: composition[0].lotSupplierLotNumber,
                quality: composition[0].lotQuality,
                animalCount: composition[0].lotAnimalCount,
                weight: composition[0].lotWeight,
                notes: composition[0].lotNotes
              };
            } else {
              lot = {
                id: composition[0].lotId,
                arrivalDate: composition[0].lotArrivalDate,
                supplier: composition[0].lotSupplier,
                supplierLotNumber: composition[0].lotSupplierLotNumber,
                quality: composition[0].lotQuality,
                animalCount: composition[0].lotAnimalCount,
                weight: composition[0].lotWeight,
                notes: composition[0].lotNotes
              };
              
              lotComposition = composition.map(c => ({
                lotId: c.lotId,
                animalCount: c.animalCount,
                percentage: c.percentage,
                lot: {
                  id: c.lotId,
                  arrivalDate: c.lotArrivalDate,
                  supplier: c.lotSupplier,
                  supplierLotNumber: c.lotSupplierLotNumber,
                  quality: c.lotQuality,
                  animalCount: c.lotAnimalCount,
                  weight: c.lotWeight,
                  notes: c.lotNotes
                }
              }));
            }
          } else if (row.lot_id) {
            lot = {
              id: row.lot_id,
              arrivalDate: row.lot_arrivalDate,
              supplier: row.lot_supplier,
              supplierLotNumber: row.lot_supplierLotNumber,
              quality: row.lot_quality,
              animalCount: row.lot_animalCount,
              weight: row.lot_weight,
              notes: row.lot_notes
            };
          }
        } else if (row.lot_id) {
          lot = {
            id: row.lot_id,
            arrivalDate: row.lot_arrivalDate,
            supplier: row.lot_supplier,
            supplierLotNumber: row.lot_supplierLotNumber,
            quality: row.lot_quality,
            animalCount: row.lot_animalCount,
            weight: row.lot_weight,
            notes: row.lot_notes
          };
        }
        
        const operation: any = {
          id: row.id,
          date: row.date,
          type: row.type,
          basketId: row.basketId,
          cycleId: row.cycleId,
          sizeId: row.sizeId,
          sgrId: row.sgrId,
          lotId: row.lotId,
          animalCount: row.animalCount,
          totalWeight: row.totalWeight,
          animalsPerKg: row.animalsPerKg,
          averageWeight: row.averageWeight,
          deadCount: row.deadCount,
          mortalityRate: row.mortalityRate,
          notes: row.notes,
          metadata: row.metadata,
          flupsyName: row.flupsyName
        };
        
        // Aggiungi oggetto size se presente
        if (row.size_id) {
          operation.size = {
            id: row.size_id,
            code: row.size_code,
            name: row.size_name
          };
        }
        
        if (lot) {
          operation.lot = lot;
        }
        
        if (lotComposition) {
          operation.lotComposition = lotComposition;
        }
        
        return operation;
      });
      
      const duration = Date.now() - startTime;
      if (duration > 1000) {
        console.log(`[PERFORMANCE] Query operazioni lenta: ${duration}ms`);
      }
      console.log(`Query operazioni completata in ${duration}ms: ${transformedResults.length} risultati su ${totalCount} totali`);
      
      const result = { operations: transformedResults, totalCount };
      
      // Salva in cache
      OperationsCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Errore recupero operazioni:', error);
      throw error;
    }
  }

  /**
   * Ottiene singola operazione per ID
   */
  async getOperationById(id: number) {
    const operation = await db
      .select()
      .from(operations)
      .where(eq(operations.id, id))
      .limit(1);
    
    return operation[0] || null;
  }

  /**
   * Ottiene operazioni per cestello
   */
  async getOperationsByBasket(basketId: number) {
    const ops = await db
      .select()
      .from(operations)
      .where(eq(operations.basketId, basketId))
      .orderBy(desc(operations.date));
    
    return ops;
  }

  /**
   * Ottiene operazioni per ciclo
   */
  async getOperationsByCycle(cycleId: number) {
    const ops = await db
      .select()
      .from(operations)
      .where(eq(operations.cycleId, cycleId))
      .orderBy(desc(operations.date));
    
    return ops;
  }

  /**
   * Ottiene operazioni per intervallo di date
   */
  async getOperationsByDateRange(startDate: string, endDate: string) {
    const ops = await db
      .select()
      .from(operations)
      .where(
        and(
          sql`${operations.date} >= ${startDate}`,
          sql`${operations.date} <= ${endDate}`
        )
      )
      .orderBy(desc(operations.date));
    
    return ops;
  }

  /**
   * Crea una nuova operazione
   * Con validazione sul numero di animali per "prima-attivazione"
   */
  async createOperation(data: any) {
    console.log('🚀 CREATE OPERATION SERVICE - Ricevuto:', JSON.stringify(data, null, 2));
    
    // VALIDAZIONE: Controlla il numero di animali per "prima-attivazione"
    // Usa data.lotId direttamente (può arrivare dal frontend senza cycleId)
    if (data.type === 'prima-attivazione' && data.lotId && data.animalCount) {
      console.log(`🔍 VALIDAZIONE ANIMALI - Operazione prima-attivazione: ${data.animalCount} animali da lotto ${data.lotId}`);
      
      // Recupera il lotto direttamente da data.lotId
      const lot = await db.select().from(lots).where(eq(lots.id, data.lotId)).limit(1);
      if (lot.length === 0) {
        throw new Error(`Lotto non trovato: ${data.lotId}`);
      }
      
      const lotData = lot[0];
      const totalAnimalsInLot = lotData.animalCount || 0;
      console.log(`✓ Lotto trovato: ID ${lotData.id}, totale animali: ${totalAnimalsInLot}`);
      
      // Calcola animali già utilizzati in altre operazioni "prima-attivazione" dello stesso lotto
      const existingOperations = await db
        .select({ animalCount: operations.animalCount })
        .from(operations)
        .where(
          and(
            eq(operations.type, 'prima-attivazione'),
            eq(operations.lotId, lotData.id)
          )
        );
      
      const usedAnimals = existingOperations.reduce((sum, op) => sum + (op.animalCount || 0), 0);
      const availableAnimals = totalAnimalsInLot - usedAnimals;
      
      console.log(`📊 BILANCIO ANIMALI LOTTO: Totale=${totalAnimalsInLot}, Usati=${usedAnimals}, Disponibili=${availableAnimals}`);
      
      // Valida
      if (data.animalCount > availableAnimals) {
        const message = `Non puoi usare ${data.animalCount} animali. Il lotto ha solo ${availableAnimals} animali disponibili (Totale: ${totalAnimalsInLot}, Già usati: ${usedAnimals})`;
        console.error(`❌ ${message}`);
        throw new Error(message);
      }
      
      console.log(`✅ Validazione OK: ${data.animalCount} animali <= ${availableAnimals} disponibili`);
    }
    
    // Arricchimento metadata e note per operazioni peso/misura su cestelli misti
    if ((data.type === 'peso' || data.type === 'misura') && data.basketId) {
      const isMixed = await isBasketMixedLot(data.basketId);
      
      if (isMixed) {
        console.log(`✨ METADATA ENRICHMENT - Operazione ${data.type} su cestello misto #${data.basketId}`);
        
        const composition = await getBasketLotComposition(data.basketId);
        
        if (composition && composition.length > 0) {
          // Calcola lotto dominante e conteggio lotti
          const dominantLot = composition.reduce((prev, current) => 
            (current.percentage > prev.percentage) ? current : prev
          );
          
          // Genera metadata
          const metadata = {
            isMixed: true,
            dominantLot: dominantLot.lotId,
            lotCount: composition.length,
            composition: composition.map(c => ({
              lotId: c.lotId,
              percentage: c.percentage,
              animalCount: c.animalCount
            }))
          };
          
          // Genera note leggibili
          const notesParts = composition.map(c => {
            const lotName = c.lot?.supplier || `Lotto ${c.lotId}`;
            const percentage = (c.percentage * 100).toFixed(1);
            return `${lotName} (${percentage}% - ${c.animalCount} animali)`;
          });
          const notes = `LOTTO MISTO: ${notesParts.join(' + ')}`;
          
          console.log('METADATA ENRICHMENT - Metadata generati:', JSON.stringify(metadata, null, 2));
          console.log('METADATA ENRICHMENT - Note generate:', notes);
          
          // Arricchisci data
          data.metadata = metadata;
          data.notes = notes;
        }
      }
    }
    
    const [newOperation] = await db
      .insert(operations)
      .values({
        ...data,
        source: data.source || 'desktop_manager' // Imposta source predefinito se non specificato
      })
      .returning();
    
    // Invalida cache
    OperationsCache.clear();
    
    return newOperation;
  }

  /**
   * Aggiorna un'operazione con validazioni di sicurezza
   */
  async updateOperation(id: number, data: any) {
    console.log(`🔄 UPDATE OPERATION: Aggiornamento operazione ${id}`, data);
    
    // 1. Recupera l'operazione esistente
    const [existingOperation] = await db
      .select()
      .from(operations)
      .where(eq(operations.id, id))
      .limit(1);
    
    if (!existingOperation) {
      throw new Error(`Operazione ${id} non trovata`);
    }
    
    console.log(`📋 Operazione esistente:`, existingOperation);
    
    // 2. BLOCCA modifiche a campi critici immutabili
    if (data.basketId !== undefined && data.basketId !== existingOperation.basketId) {
      throw new Error('Non è possibile modificare il cestello di un\'operazione esistente');
    }
    
    if (data.cycleId !== undefined && data.cycleId !== existingOperation.cycleId) {
      throw new Error('Non è possibile modificare il ciclo di un\'operazione esistente');
    }
    
    // 3. Se viene modificata la data, applica validazioni
    if (data.date && data.date !== existingOperation.date) {
      console.log(`📅 Modifica data: ${existingOperation.date} → ${data.date}`);
      
      const basketId = existingOperation.basketId;
      const cycleId = existingOperation.cycleId;
      
      // Recupera informazioni cestello per messaggi errore
      const [basketInfo] = await db
        .select({
          physicalNumber: baskets.physicalNumber
        })
        .from(baskets)
        .where(eq(baskets.id, basketId))
        .limit(1);
      
      const physicalNumber = basketInfo?.physicalNumber || basketId;
      
      // Recupera tutte le altre operazioni dello stesso cestello e ciclo (escludendo quella in modifica)
      // Gestisce sia cycleId definito che null
      const whereConditions = [
        eq(operations.basketId, basketId),
        sql`${operations.id} != ${id}` // Escludi l'operazione che stiamo modificando
      ];
      
      if (cycleId !== null) {
        whereConditions.push(eq(operations.cycleId, cycleId));
      } else {
        // Se cycleId è null, recupera TUTTE le operazioni del cestello per validare
        console.log(`⚠️ Operazione con cycleId null - validazione su tutte le operazioni del cestello`);
      }
      
      const otherOperations = await db
        .select()
        .from(operations)
        .where(and(...whereConditions))
        .orderBy(sql`${operations.date} ASC`); // Ordine cronologico ascendente
      
      console.log(`🔍 Trovate ${otherOperations.length} altre operazioni${cycleId ? ` nel ciclo ${cycleId}` : ' nel cestello'}`);
      
      const newDate = new Date(data.date);
      const newDateString = data.date;
      
      // VALIDAZIONE 1: Nessun'altra operazione nella stessa data
      const sameDate = otherOperations.find(op => op.date === newDateString);
      if (sameDate) {
        throw new Error(
          `Esiste già un'operazione (ID: ${sameDate.id}) per la cesta ${physicalNumber} nella data ${newDateString}. ` +
          `Ogni cesta può avere massimo una operazione per data.`
        );
      }
      
      // VALIDAZIONE 2: Rispetta ordine cronologico
      // Trova l'operazione immediatamente precedente e successiva nella nuova posizione temporale
      let previousOp = null;
      let nextOp = null;
      
      for (const op of otherOperations) {
        const opDate = new Date(op.date);
        
        if (opDate < newDate) {
          // Questa è potenzialmente l'operazione precedente
          if (!previousOp || opDate > new Date(previousOp.date)) {
            previousOp = op;
          }
        } else if (opDate > newDate) {
          // Questa è potenzialmente l'operazione successiva
          if (!nextOp || opDate < new Date(nextOp.date)) {
            nextOp = op;
          }
        }
      }
      
      // Verifica limiti temporali
      if (previousOp) {
        const prevDate = new Date(previousOp.date);
        if (newDate <= prevDate) {
          const prevDateStr = prevDate.toLocaleDateString('it-IT');
          const minValidDate = new Date(prevDate);
          minValidDate.setDate(minValidDate.getDate() + 1);
          const minValidDateStr = minValidDate.toLocaleDateString('it-IT');
          
          throw new Error(
            `⚠️ Data non valida: Esiste un'operazione precedente del ${prevDateStr}. ` +
            `La nuova data deve essere dal ${minValidDateStr} in poi.`
          );
        }
      }
      
      if (nextOp) {
        const nextDate = new Date(nextOp.date);
        if (newDate >= nextDate) {
          const nextDateStr = nextDate.toLocaleDateString('it-IT');
          const maxValidDate = new Date(nextDate);
          maxValidDate.setDate(maxValidDate.getDate() - 1);
          const maxValidDateStr = maxValidDate.toLocaleDateString('it-IT');
          
          throw new Error(
            `⚠️ Data non valida: Esiste un'operazione successiva del ${nextDateStr}. ` +
            `La nuova data deve essere fino al ${maxValidDateStr}.`
          );
        }
      }
      
      console.log(`✅ Validazione data superata`);
    }
    
    // 4. Esegui l'aggiornamento
    const [updated] = await db
      .update(operations)
      .set(data)
      .where(eq(operations.id, id))
      .returning();
    
    console.log(`✅ Operazione ${id} aggiornata con successo`);
    
    // 5. Invalida cache
    OperationsCache.clear();
    
    // 6. Notifica WebSocket se disponibile
    if (typeof (global as any).broadcastUpdate === 'function') {
      console.log("✅ WEBSOCKET: Invio notifica per operazione modificata");
      (global as any).broadcastUpdate('operation_updated', {
        operation: updated,
        message: `Operazione ${updated.type} modificata`
      });
    }
    
    return updated;
  }

  /**
   * Elimina un'operazione
   */
  async deleteOperation(id: number) {
    const [deleted] = await db
      .delete(operations)
      .where(eq(operations.id, id))
      .returning();
    
    // Invalida cache
    OperationsCache.clear();
    
    return deleted;
  }

  /**
   * Ottiene il bilancio degli animali per un lotto
   * Usato per mostrare all'operatore quanti animali ha il lotto, quanti ne sono già stati usati, e quanti ne restano
   */
  async getLotAnimalBalance(lotId: number) {
    console.log(`📊 Calcolo bilancio animali per lotto ${lotId}`);
    
    // Recupera il lotto
    const lot = await db.select().from(lots).where(eq(lots.id, lotId)).limit(1);
    if (lot.length === 0) {
      throw new Error(`Lotto non trovato: ${lotId}`);
    }
    
    const lotData = lot[0];
    const totalAnimals = lotData.animalCount || 0;
    
    // Calcola animali già utilizzati in operazioni "prima-attivazione"
    const existingOperations = await db
      .select({ animalCount: operations.animalCount })
      .from(operations)
      .where(
        and(
          eq(operations.type, 'prima-attivazione'),
          eq(operations.lotId, lotId)
        )
      );
    
    const usedAnimals = existingOperations.reduce((sum, op) => sum + (op.animalCount || 0), 0);
    const availableAnimals = totalAnimals - usedAnimals;
    
    const balance = {
      lotId,
      supplier: lotData.supplier,
      supplierLotNumber: lotData.supplierLotNumber,
      totalAnimals,
      usedAnimals,
      availableAnimals,
      usagePercentage: totalAnimals > 0 ? (usedAnimals / totalAnimals * 100).toFixed(1) : 0
    };
    
    console.log(`✓ Bilancio calcolato:`, balance);
    return balance;
  }
}

export const operationsService = new OperationsService();
