/**
 * Service per la gestione dei cestelli
 * Gestisce tutta la logica business relativa ai cestelli
 */

import { db } from '../../../db';
import { storage } from '../../../storage';
import { baskets, flupsys, cycles, operations } from '../../../../shared/schema';
import { eq, and, isNull, sql, or, not, inArray, desc, asc } from 'drizzle-orm';
import { BasketsCache } from '../../../baskets-cache-service';
import { validateBasketRow, validateBasketPosition } from '../../../utils/validation';

export class BasketsService {
  /**
   * Trova un cestello tramite NFC data
   */
  async findByNfc(params: {
    physicalNumber?: number;
    currentCycleId?: number;
    basketId?: number;
  }) {
    // Compatibilità v1.0 - cerca per basketId
    if (params.basketId) {
      const basket = await storage.getBasket(params.basketId);
      if (basket) {
        return {
          success: true,
          basket,
          identificationMethod: 'basketId',
          version: '1.0-compatible'
        };
      } else {
        return {
          success: false,
          error: 'Cestello non trovato per basketId fornito',
          basketId: params.basketId,
          status: 404
        };
      }
    }

    // Nuova logica v2.0: cerca per physicalNumber + currentCycleId
    if (params.physicalNumber !== undefined && params.currentCycleId !== undefined) {
      const foundBaskets = await db
        .select()
        .from(baskets)
        .where(
          and(
            eq(baskets.physicalNumber, params.physicalNumber),
            eq(baskets.currentCycleId, params.currentCycleId)
          )
        );

      if (foundBaskets.length === 1) {
        return {
          success: true,
          basket: foundBaskets[0],
          identificationMethod: 'physicalNumber+currentCycleId',
          version: '2.0'
        };
      } else if (foundBaskets.length === 0) {
        return {
          success: false,
          error: 'Nessun cestello trovato per la combinazione physicalNumber+currentCycleId',
          physicalNumber: params.physicalNumber,
          currentCycleId: params.currentCycleId,
          status: 404
        };
      } else {
        return {
          success: false,
          error: 'Trovati cestelli multipli per la combinazione physicalNumber+currentCycleId (errore di integrità dati)',
          physicalNumber: params.physicalNumber,
          currentCycleId: params.currentCycleId,
          foundCount: foundBaskets.length,
          status: 409
        };
      }
    }

    // Parametri insufficienti
    return {
      success: false,
      error: 'Parametri insufficienti. Fornire basketId oppure physicalNumber+currentCycleId',
      receivedParams: params,
      status: 400
    };
  }

  /**
   * Ottiene lista cestelli con filtri e paginazione (usa cache ottimizzata)
   */
  async getBaskets(options: {
    page?: number;
    pageSize?: number;
    state?: string;
    flupsyId?: number | string;
    cycleId?: number;
    includeEmpty?: boolean;
    sortBy?: string;
    sortOrder?: string;
    includeAll?: boolean;
    forceRefresh?: boolean;
  }) {
    const { getBasketsOptimized } = await import('../../../controllers/baskets-controller');
    
    // Se è richiesto un refresh forzato, pulisci il cache
    if (options.forceRefresh) {
      BasketsCache.clear();
      console.log("Cache cestelli pulito per force_refresh");
    }

    const finalPageSize = options.includeAll ? 1000 : (options.pageSize || 50);
    
    return await getBasketsOptimized({
      page: options.page || 1,
      pageSize: finalPageSize,
      state: options.state,
      flupsyId: options.flupsyId,
      cycleId: options.cycleId,
      includeEmpty: options.includeEmpty,
      sortBy: options.sortBy || 'id',
      sortOrder: options.sortOrder || 'asc',
      includeAll: options.includeAll
    });
  }

  /**
   * Ottiene cestelli con dettagli completi del flupsy
   */
  async getBasketsWithFlupsyDetails() {
    const result = await db
      .select({
        id: baskets.id,
        physicalNumber: baskets.physicalNumber,
        cycleCode: baskets.cycleCode,
        state: baskets.state,
        flupsyId: baskets.flupsyId,
        flupsyName: flupsys.name
      })
      .from(baskets)
      .leftJoin(flupsys, eq(baskets.flupsyId, flupsys.id));

    return result;
  }

  /**
   * Ottiene dettagli di uno o più cestelli
   */
  async getBasketDetails(id?: number) {
    if (id) {
      const basket = await storage.getBasket(id);
      return basket ? [basket] : [];
    }
    // Se non c'è ID, ritorna tutti i cestelli (per compatibilità)
    return await storage.getBaskets();
  }

  /**
   * Verifica esistenza cestello per numero fisico nel flupsy
   */
  async checkBasketExists(flupsyId: number, physicalNumber: number) {
    const existingBaskets = await db
      .select()
      .from(baskets)
      .where(
        and(
          eq(baskets.flupsyId, flupsyId),
          eq(baskets.physicalNumber, physicalNumber)
        )
      );

    return {
      exists: existingBaskets.length > 0,
      basket: existingBaskets[0] || null
    };
  }

  /**
   * Verifica se una posizione è occupata nel flupsy
   */
  async checkPosition(flupsyId: number, row: string, position: number) {
    const occupyingBasket = await db
      .select()
      .from(baskets)
      .where(
        and(
          eq(baskets.flupsyId, flupsyId),
          eq(baskets.row, row),
          eq(baskets.position, position)
        )
      )
      .limit(1);

    return {
      occupied: occupyingBasket.length > 0,
      basket: occupyingBasket[0] || null
    };
  }

  /**
   * Ottiene il prossimo numero disponibile per un flupsy
   */
  async getNextNumber(flupsyId: number) {
    const flupsyBaskets = await storage.getBasketsByFlupsy(flupsyId);
    const usedNumbers = flupsyBaskets.map(b => b.physicalNumber);
    
    let nextNumber = 1;
    while (usedNumbers.includes(nextNumber) && nextNumber <= 20) {
      nextNumber++;
    }

    return { 
      nextNumber: nextNumber <= 20 ? nextNumber : -1
    };
  }

  /**
   * Calcola le prossime posizioni disponibili per un flupsy
   */
  async getNextPosition(flupsyId: number) {
    const flupsy = await storage.getFlupsy(flupsyId);
    if (!flupsy) {
      throw new Error("FLUPSY non trovato");
    }

    const maxPositions = Math.floor((flupsy.maxPositions || 20) / 2);
    const flupsyBaskets = await storage.getBasketsByFlupsy(flupsyId);

    const occupiedPositions = new Map<string, number[]>();
    occupiedPositions.set('DX', []);
    occupiedPositions.set('SX', []);

    flupsyBaskets.forEach(basket => {
      if (basket.row && basket.position) {
        const row = basket.row.toUpperCase();
        if (!occupiedPositions.has(row)) {
          occupiedPositions.set(row, []);
        }
        occupiedPositions.get(row)!.push(basket.position);
      }
    });

    const availablePositions: { [key: string]: number } = {};

    occupiedPositions.forEach((positions, currentRow) => {
      let nextPosition = 1;
      while (positions.includes(nextPosition) && nextPosition <= maxPositions) {
        nextPosition++;
      }
      
      availablePositions[currentRow] = nextPosition > maxPositions ? -1 : nextPosition;
    });

    return { 
      maxPositions, 
      availablePositions
    };
  }

  /**
   * Ottiene cestelli disponibili per la selezione
   */
  async getAvailableBaskets() {
    const availableBaskets = await db.select()
      .from(baskets)
      .where(eq(baskets.state, 'available'));
    
    return {
      success: true,
      baskets: availableBaskets,
      count: availableBaskets.length
    };
  }

  /**
   * Ottiene un singolo cestello per ID
   */
  async getBasket(id: number) {
    const basket = await storage.getBasket(id);
    if (!basket) {
      throw new Error("Basket not found");
    }
    return basket;
  }

  /**
   * Crea un nuovo cestello
   */
  async createBasket(data: any) {
    const { flupsyId, physicalNumber, row, position } = data;

    // Validazioni
    if (!row || !position) {
      throw new Error("La fila (row) e la posizione (position) sono campi obbligatori");
    }

    const flupsyBaskets = await storage.getBasketsByFlupsy(flupsyId);
    
    // Verifica limite 20 cestelli
    if (flupsyBaskets.length >= 20) {
      throw new Error("Limite massimo di 20 ceste per FLUPSY raggiunto");
    }

    // Verifica numero duplicato
    const basketWithSameNumber = flupsyBaskets.find(b => b.physicalNumber === physicalNumber);
    if (basketWithSameNumber) {
      throw new Error(`Esiste già una cesta con il numero ${physicalNumber} in questa unità FLUPSY`);
    }

    // Verifica posizione occupata
    const existingBasket = flupsyBaskets.find(basket => 
      basket.row === row && 
      basket.position === position
    );
    
    if (existingBasket) {
      const basketState = existingBasket.state === 'active' ? 'attiva' : 'disponibile';
      throw new Error(`La posizione ${row}-${position} è già occupata dalla cesta #${existingBasket.physicalNumber} (${basketState})`);
    }

    // Crea il cestello
    const newBasket = await storage.createBasket(data);

    // Invalida cache posizioni
    try {
      const { positionCache } = await import('../../../position-cache-service');
      positionCache.invalidate(newBasket.id);
    } catch (error) {
      console.warn('Failed to invalidate position cache:', error);
    }

    // Broadcast via WebSocket
    if (typeof (global as any).broadcastUpdate === 'function') {
      (global as any).broadcastUpdate('basket_created', {
        basket: newBasket,
        message: `Nuovo cestello ${newBasket.physicalNumber} creato`
      });
    }

    return newBasket;
  }

  /**
   * Sposta un cestello in una nuova posizione
   */
  async moveBasket(id: number, data: { flupsyId: number; row: string; position: number }) {
    const validatedRow = validateBasketRow(data.row);
    const validatedPosition = validateBasketPosition(data.position);

    // Verifica in parallelo l'esistenza del cestello e se la posizione è occupata
    const [basket, basketAtPosition] = await Promise.all([
      storage.getBasket(id),
      db.select()
        .from(baskets)
        .where(and(
          eq(baskets.flupsyId, data.flupsyId),
          eq(baskets.row, validatedRow),
          eq(baskets.position, validatedPosition)
        ))
        .limit(1)
        .then(results => results[0])
    ]);

    if (!basket) {
      throw new Error("Basket not found");
    }

    // Se la posizione è occupata da un altro cestello
    if (basketAtPosition && basketAtPosition.id !== id) {
      return {
        positionOccupied: true,
        basketAtPosition: {
          id: basketAtPosition.id,
          physicalNumber: basketAtPosition.physicalNumber,
          flupsyId: basketAtPosition.flupsyId,
          row: basketAtPosition.row,
          position: basketAtPosition.position
        },
        message: `Esiste già una cesta (numero ${basketAtPosition.physicalNumber}) in questa posizione`
      };
    }

    // Pre-invalida cache posizioni
    try {
      const { positionCache } = await import('../../../position-cache-service');
      positionCache.invalidate(id);
    } catch (error) {
      // Non bloccare se la cache fallisce
    }

    // Aggiorna il cestello
    const updatedBasket = await storage.updateBasket(id, {
      flupsyId: data.flupsyId,
      row: validatedRow,
      position: validatedPosition
    });

    // Recupera il cestello completo
    const completeBasket = await storage.getBasket(id);

    // Notifica WebSocket
    if (typeof (global as any).broadcastUpdate === 'function' && completeBasket) {
      (global as any).broadcastUpdate('basket_moved', {
        basket: completeBasket,
        previousPosition: null,
        newPosition: { flupsyId: data.flupsyId, row: validatedRow, position: validatedPosition },
        message: `Cestello ${completeBasket.physicalNumber} spostato`
      });
    }

    return completeBasket || updatedBasket;
  }

  /**
   * Scambia le posizioni di due cestelli
   */
  async switchPositions(basket1Id: number, basket2Id: number) {
    // Recupera i due cestelli
    const [basket1, basket2] = await Promise.all([
      storage.getBasket(basket1Id),
      storage.getBasket(basket2Id)
    ]);

    if (!basket1 || !basket2) {
      throw new Error("Uno o entrambi i cestelli non trovati");
    }

    // Salva le posizioni originali
    const position1 = {
      flupsyId: basket1.flupsyId,
      row: basket1.row,
      position: basket1.position
    };

    const position2 = {
      flupsyId: basket2.flupsyId,
      row: basket2.row,
      position: basket2.position
    };

    // Esegui lo scambio in una transazione
    const [updatedBasket1, updatedBasket2] = await Promise.all([
      storage.updateBasket(basket1Id, position2),
      storage.updateBasket(basket2Id, position1)
    ]);

    // Invalida cache posizioni
    try {
      const { positionCache } = await import('../../../position-cache-service');
      await Promise.all([
        positionCache.invalidate(basket1Id),
        positionCache.invalidate(basket2Id)
      ]);
    } catch (error) {
      // Non bloccare se la cache fallisce
    }

    // Notifica WebSocket
    if (typeof (global as any).broadcastUpdate === 'function') {
      (global as any).broadcastUpdate('baskets_switched', {
        basket1: updatedBasket1,
        basket2: updatedBasket2,
        message: `Posizioni scambiate tra cestelli ${basket1.physicalNumber} e ${basket2.physicalNumber}`
      });
    }

    return {
      basket1: updatedBasket1,
      basket2: updatedBasket2
    };
  }

  /**
   * Aggiorna un cestello
   */
  async updateBasket(id: number, data: any) {
    // Verifica che il cestello esista
    const basket = await storage.getBasket(id);
    if (!basket) {
      throw new Error("Basket not found");
    }

    const hasActiveCycle = basket.currentCycleId !== null;

    // Se il cestello non è attivo e si sta cercando di cambiare la posizione
    if (!hasActiveCycle && 
        ((data.row !== undefined && data.row !== basket.row) || 
         (data.position !== undefined && data.position !== basket.position))) {
      throw new Error("Impossibile cambiare la posizione di un cestello non attivo. Solo i cestelli con ciclo attivo possono essere riposizionati.");
    }

    // Se la posizione sta cambiando, verifica che non ci siano duplicati
    if ((data.row !== undefined && data.row !== basket.row) || 
        (data.position !== undefined && data.position !== basket.position)) {
      
      if (data.row && data.position) {
        const flupsyId = data.flupsyId || basket.flupsyId;
        const flupsyBaskets = await storage.getBasketsByFlupsy(flupsyId);
        
        const basketAtPosition = flupsyBaskets.find(b => 
          b.id !== id && 
          b.row === data.row && 
          b.position === data.position
        );
        
        if (basketAtPosition) {
          return {
            positionOccupied: true,
            basketAtPosition: {
              id: basketAtPosition.id,
              physicalNumber: basketAtPosition.physicalNumber,
              flupsyId: basketAtPosition.flupsyId,
              row: basketAtPosition.row,
              position: basketAtPosition.position
            },
            message: `Esiste già una cesta (numero ${basketAtPosition.physicalNumber}) in questa posizione`
          };
        }
      }
    }

    // Aggiorna il cestello
    const updatedBasket = await storage.updateBasket(id, data);
    
    // Ottieni il cestello completo
    const completeBasket = await storage.getBasket(id);

    // Invalida cache cestelli
    try {
      BasketsCache.clear();
      console.log('✅ Cache cestelli invalidata dopo aggiornamento');
    } catch (error) {
      console.error('Errore nell\'invalidazione cache cestelli:', error);
    }

    // Broadcast via WebSocket
    if (typeof (global as any).broadcastUpdate === 'function' && completeBasket) {
      (global as any).broadcastUpdate('basket_updated', {
        basket: completeBasket,
        message: `Cestello ${completeBasket.physicalNumber} aggiornato`
      });
    }

    return completeBasket || updatedBasket;
  }

  /**
   * Elimina un cestello
   */
  async deleteBasket(id: number) {
    // Verifica che il cestello esista
    const basket = await storage.getBasket(id);
    if (!basket) {
      throw new Error("Basket not found");
    }

    // Verifica che non abbia un ciclo attivo
    if (basket.currentCycleId !== null) {
      throw new Error("Cannot delete a basket with an active cycle. Close the cycle first.");
    }

    // Elimina il cestello
    const result = await storage.deleteBasket(id);
    if (!result) {
      throw new Error("Failed to delete basket");
    }

    return { message: "Basket deleted successfully" };
  }

  /**
   * Corregge cestelli con row NULL
   */
  async fixNullRows() {
    const nullRowBaskets = await db
      .select()
      .from(baskets)
      .where(
        and(
          isNull(baskets.row),
          not(isNull(baskets.position))
        )
      );

    console.log(`Found ${nullRowBaskets.length} baskets with NULL row but non-NULL position`);

    const updates = [];
    for (const basket of nullRowBaskets) {
      const defaultRow = 'DX';
      console.log(`Fixing basket ${basket.id} (physical #${basket.physicalNumber}): setting row to ${defaultRow}`);
      
      updates.push(
        db
          .update(baskets)
          .set({ row: defaultRow })
          .where(eq(baskets.id, basket.id))
      );
    }

    if (updates.length > 0) {
      await Promise.all(updates);
      console.log(`Fixed ${updates.length} baskets`);
    }

    return {
      fixed: updates.length,
      baskets: nullRowBaskets
    };
  }

  /**
   * ENDPOINT OTTIMIZZATO: Restituisce l'ultima operazione per ogni cesta attiva
   * Usa window function (ROW_NUMBER) per performance ottimali
   * Ritorna una mappa basketId -> operazione per O(1) lookup
   */
  async getLatestOperations(): Promise<Record<number, any>> {
    const startTime = Date.now();
    
    // Query ottimizzata con window function per ottenere l'ultima operazione per ogni cesta
    // Include anche l'ultima operazione con mortalità > 0
    const result = await db.execute(sql`
      WITH ranked_operations AS (
        SELECT 
          o.*,
          ROW_NUMBER() OVER (
            PARTITION BY o.basket_id 
            ORDER BY o.date DESC, o.id DESC
          ) as rn
        FROM operations o
        INNER JOIN baskets b ON o.basket_id = b.id
        WHERE b.current_cycle_id IS NOT NULL
      ),
      last_mortality AS (
        SELECT 
          o.basket_id,
          o.dead_count,
          CASE 
            WHEN o.animal_count > 0 AND o.dead_count > 0 
            THEN (o.dead_count::numeric / o.animal_count::numeric * 100)
            ELSE o.mortality_rate
          END as calculated_mortality_rate,
          o.date as mortality_date,
          o.type as mortality_op_type,
          ROW_NUMBER() OVER (
            PARTITION BY o.basket_id 
            ORDER BY o.date DESC, o.id DESC
          ) as rn
        FROM operations o
        INNER JOIN baskets b ON o.basket_id = b.id
        WHERE b.current_cycle_id IS NOT NULL
          AND o.dead_count IS NOT NULL 
          AND o.dead_count > 0
      )
      SELECT 
        ro.id,
        ro.basket_id as "basketId",
        ro.cycle_id as "cycleId",
        ro.type,
        ro.date,
        ro.total_weight as "totalWeight",
        ro.animal_count as "animalCount",
        ro.animals_per_kg as "animalsPerKg",
        ro.average_weight as "averageWeight",
        ro.dead_count as "deadCount",
        ro.mortality_rate as "mortalityRate",
        ro.lot_id as "lotId",
        ro.size_id as "sizeId",
        ro.notes,
        lm.dead_count as "lastMortalityCount",
        lm.calculated_mortality_rate as "lastMortalityRate",
        lm.mortality_date as "lastMortalityDate",
        lm.mortality_op_type as "lastMortalityOpType"
      FROM ranked_operations ro
      LEFT JOIN last_mortality lm ON ro.basket_id = lm.basket_id AND lm.rn = 1
      WHERE ro.rn = 1
      ORDER BY ro.basket_id
    `);
    
    // Converti il risultato in una mappa basketId -> operazione
    const operationsMap: Record<number, any> = {};
    for (const row of result.rows as any[]) {
      operationsMap[row.basketId] = {
        id: row.id,
        basketId: row.basketId,
        cycleId: row.cycleId,
        type: row.type,
        date: row.date,
        totalWeight: row.totalWeight ? parseFloat(row.totalWeight) : null,
        animalCount: row.animalCount,
        animalsPerKg: row.animalsPerKg,
        averageWeight: row.averageWeight ? parseFloat(row.averageWeight) : null,
        deadCount: row.deadCount,
        mortalityRate: row.mortalityRate ? parseFloat(row.mortalityRate) : null,
        lotId: row.lotId,
        sizeId: row.sizeId,
        notes: row.notes,
        lastMortalityCount: row.lastMortalityCount,
        lastMortalityRate: row.lastMortalityRate ? parseFloat(row.lastMortalityRate) : null,
        lastMortalityDate: row.lastMortalityDate,
        lastMortalityOpType: row.lastMortalityOpType
      };
    }
    
    const queryTime = Date.now() - startTime;
    console.log(`[PERF] getLatestOperations: ${Object.keys(operationsMap).length} operazioni in ${queryTime}ms`);
    
    return operationsMap;
  }

  /**
   * Genera il prossimo codice RFID UHF disponibile (Cesta-001 a Cesta-999)
   */
  async getNextRfidUhfCode(): Promise<{ success: boolean; nextCode: string; nextNumber: number }> {
    const result = await db.execute(sql`
      SELECT MAX(
        CAST(
          NULLIF(REGEXP_REPLACE(rfid_uhf_user_data, '[^0-9]', '', 'g'), '')
          AS INTEGER
        )
      ) as max_number
      FROM baskets
      WHERE rfid_uhf_user_data IS NOT NULL
        AND rfid_uhf_user_data LIKE 'Cesta-%'
    `);
    
    const rows = result.rows as any[];
    const maxNumber = rows[0]?.max_number || 0;
    const nextNumber = maxNumber + 1;
    
    if (nextNumber > 999) {
      throw new Error('Limite massimo codici RFID UHF raggiunto (999)');
    }
    
    const nextCode = `Cesta-${String(nextNumber).padStart(3, '0')}`;
    
    return {
      success: true,
      nextCode,
      nextNumber
    };
  }

  /**
   * Assegna un codice RFID UHF progressivo a un cestello
   * @param basketId ID del cestello
   * @param epc (opzionale) EPC fisico del tag (Bank 1)
   */
  async assignRfidUhf(basketId: number, epc?: string): Promise<{
    success: boolean;
    message?: string;
    basket?: any;
    rfidCode?: string;
    status?: number;
  }> {
    // Verifica che il cestello esista
    const basket = await storage.getBasket(basketId);
    if (!basket) {
      return {
        success: false,
        message: 'Cestello non trovato',
        status: 404
      };
    }

    // Verifica se ha già un codice RFID UHF
    if (basket.rfidUhfUserData) {
      return {
        success: false,
        message: `Cestello già associato a ${basket.rfidUhfUserData}. Rimuovi prima l'associazione esistente.`,
        status: 400
      };
    }

    // Genera il prossimo codice
    const { nextCode } = await this.getNextRfidUhfCode();
    
    // Aggiorna il cestello
    const now = new Date().toISOString();
    const updateData: any = {
      rfidUhfUserData: nextCode,
      rfidUhfProgrammedAt: now
    };
    
    // Se è stato fornito l'EPC fisico, salvalo
    if (epc) {
      updateData.rfidUhfEpc = epc;
    }
    
    const [updated] = await db
      .update(baskets)
      .set(updateData)
      .where(eq(baskets.id, basketId))
      .returning();
    
    // Invalida cache
    BasketsCache.clear();
    
    console.log(`✅ RFID UHF assegnato: Cestello #${basket.physicalNumber} → ${nextCode}`);
    
    return {
      success: true,
      message: `Codice ${nextCode} assegnato con successo`,
      basket: updated,
      rfidCode: nextCode
    };
  }

  /**
   * Rimuove l'associazione RFID UHF da un cestello
   */
  async removeRfidUhf(basketId: number): Promise<{
    success: boolean;
    message?: string;
    status?: number;
  }> {
    // Verifica che il cestello esista
    const basket = await storage.getBasket(basketId);
    if (!basket) {
      return {
        success: false,
        message: 'Cestello non trovato',
        status: 404
      };
    }

    if (!basket.rfidUhfUserData && !basket.rfidUhfEpc) {
      return {
        success: false,
        message: 'Cestello non ha associazione RFID UHF',
        status: 400
      };
    }

    const oldCode = basket.rfidUhfUserData;
    
    // Rimuovi l'associazione
    await db
      .update(baskets)
      .set({
        rfidUhfEpc: null,
        rfidUhfUserData: null,
        rfidUhfProgrammedAt: null
      })
      .where(eq(baskets.id, basketId));
    
    // Invalida cache
    BasketsCache.clear();
    
    console.log(`🗑️ RFID UHF rimosso: Cestello #${basket.physicalNumber} (era ${oldCode})`);
    
    return {
      success: true,
      message: `Associazione RFID UHF rimossa (era ${oldCode})`
    };
  }

  /**
   * Calcola le taglie attese per i cestelli attivi basandosi su SGR
   * Confronta taglia registrata vs taglia prevista dalla crescita
   */
  async getExpectedSizes() {
    const startTime = Date.now();
    console.log("📊 EXPECTED SIZES: Calcolo taglie attese in corso...");

    const activeBaskets = await db
      .select()
      .from(baskets)
      .where(eq(baskets.state, 'active'));

    if (activeBaskets.length === 0) {
      return [];
    }

    const basketIds = activeBaskets.map(b => b.id);
    const cycleIds = activeBaskets.map(b => b.currentCycleId).filter(Boolean) as number[];

    const allOperations = await db
      .select()
      .from(operations)
      .where(inArray(operations.basketId, basketIds))
      .orderBy(desc(operations.date));

    const allSizes = await storage.getAllSizes();
    const allSgrs = await storage.getSgrs();
    const sgrGiornalieri = await storage.getSgrGiornalieri();

    const today = new Date();
    const currentMonth = today.toLocaleString('it-IT', { month: 'long' }).toLowerCase();

    const results: Array<{
      basketId: number;
      physicalNumber: number;
      flupsyId: number;
      cycleCode: string | null;
      registeredSize: string;
      registeredAnimalsPerKg: number;
      expectedSize: string;
      expectedAnimalsPerKg: number;
      hasExpectedSizeChange: boolean;
      daysSinceLastMeasurement: number;
      lastMeasurementDate: string | null;
      lastOperationType: string | null;
    }> = [];

    for (const basket of activeBaskets) {
      const basketOps = allOperations.filter(op => op.basketId === basket.id);
      
      const lastMeasurementOp = basketOps.find(op => 
        (op.type === 'misura' || op.type === 'prima-attivazione' || op.type === 'peso') && 
        op.animalsPerKg && op.animalsPerKg > 0
      );

      if (!lastMeasurementOp || !lastMeasurementOp.animalsPerKg) {
        continue;
      }

      const registeredAnimalsPerKg = lastMeasurementOp.animalsPerKg;
      const registeredSize = this.getSizeCodeFromAnimalsPerKg(allSizes, registeredAnimalsPerKg);

      const opDate = new Date(lastMeasurementOp.date);
      const daysSince = Math.floor((today.getTime() - opDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSince < 3) {
        continue;
      }

      const avgWeightGrams = 1000 / registeredAnimalsPerKg;
      const sgr = this.findBestSgr(registeredSize, currentMonth, allSgrs, sgrGiornalieri);
      
      if (!sgr || sgr <= 0) {
        continue;
      }

      const expectedWeightGrams = avgWeightGrams * Math.exp((sgr / 100) * daysSince);
      const expectedAnimalsPerKg = Math.round(1000 / expectedWeightGrams);
      const expectedSize = this.getSizeCodeFromAnimalsPerKg(allSizes, expectedAnimalsPerKg);

      const hasExpectedSizeChange = registeredSize !== expectedSize;

      results.push({
        basketId: basket.id,
        physicalNumber: basket.physicalNumber,
        flupsyId: basket.flupsyId,
        cycleCode: basket.cycleCode,
        registeredSize,
        registeredAnimalsPerKg,
        expectedSize,
        expectedAnimalsPerKg,
        hasExpectedSizeChange,
        daysSinceLastMeasurement: daysSince,
        lastMeasurementDate: opDate.toISOString().split('T')[0],
        lastOperationType: lastMeasurementOp.type
      });
    }

    const elapsed = Date.now() - startTime;
    const changed = results.filter(r => r.hasExpectedSizeChange).length;
    console.log(`📊 EXPECTED SIZES: Completato in ${elapsed}ms - ${results.length} ceste analizzate, ${changed} con taglia attesa diversa`);

    return results;
  }

  private getSizeCodeFromAnimalsPerKg(sizes: any[], animalsPerKg: number): string {
    const matchingSize = sizes.find((size: any) => {
      const min = size.minAnimalsPerKg || 0;
      const max = size.maxAnimalsPerKg || Infinity;
      return animalsPerKg >= min && animalsPerKg <= max;
    });

    if (matchingSize) {
      return matchingSize.code;
    }
    return `TP-${Math.round(animalsPerKg/1000)*1000}`;
  }

  private findBestSgr(sizeCode: string, month: string, sgrs: any[], sgrGiornalieri: any[]): number | null {
    const sizeSgr = sgrGiornalieri.find((s: any) => 
      s.sizeCode?.toLowerCase() === sizeCode.toLowerCase()
    );
    if (sizeSgr && sizeSgr.sgrValue > 0) {
      return sizeSgr.sgrValue;
    }

    const monthSgr = sgrs.find((s: any) => 
      s.month?.toLowerCase() === month.toLowerCase()
    );
    if (monthSgr && monthSgr.sgrRate > 0) {
      return monthSgr.sgrRate;
    }

    const avgSgr = sgrs.reduce((sum: number, s: any) => sum + (s.sgrRate || 0), 0) / sgrs.length;
    return avgSgr > 0 ? avgSgr : 2.5;
  }
}

// Export singleton instance
export const basketsService = new BasketsService();