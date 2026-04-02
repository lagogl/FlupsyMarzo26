/**
 * CORREZIONE LOGICA VAGLIATURA - Implementazione corretta per gestire:
 * 1. Cessazione SEMPRE dei cestelli origine (non riattivazione)
 * 2. Calcolo e registrazione mortalità del lotto
 * 3. Tracciabilità completa della vagliatura
 * 4. Operazione "chiusura-ciclo-vagliatura" per storicizzazione
 */
import { Request, Response } from "express";
import { db } from "../db";
import { eq, and, or, isNull, isNotNull, sql } from "drizzle-orm";
import { 
  selections, 
  selectionSourceBaskets, 
  selectionDestinationBaskets, 
  selectionBasketHistory, 
  selectionLotReferences,
  basketLotComposition,
  operations,
  cycles,
  baskets,
  basketPositionHistory,
  flupsys,
  sizes,
  lots,
  lotLedger
} from "../../shared/schema";
import { format } from "date-fns";

/**
 * COMPLETA SELEZIONE - IMPLEMENTAZIONE CORRETTA
 * 
 * LOGICA CORRETTA:
 * 1. TUTTI i cestelli origine vengono SEMPRE cessati (operazione "chiusura-ciclo-vagliatura")
 * 2. I cestelli destinazione ricevono nuovi cicli normalmente
 * 3. La mortalità viene calcolata e registrata sul lotto
 * 4. Tracciabilità completa per ricostruire la storia
 */
export async function completeSelectionFixed(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    console.log(`🔄 AVVIO COMPLETAMENTO VAGLIATURA CORRETTO - Selezione ID: ${id}`);
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: "ID selezione non fornito"
      });
    }

    // Verifica che la selezione esista
    const selection = await db.select().from(selections)
      .where(eq(selections.id, Number(id)))
      .limit(1);
      
    if (!selection || selection.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Selezione con ID ${id} non trovata`
      });
    }

    // Verifica che la selezione sia in stato draft
    if (selection[0].status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: `La selezione non può essere completata perché è in stato "${selection[0].status}"`
      });
    }

    // Recupera i cestelli di origine
    const sourceBaskets = await db.select({
      basketId: selectionSourceBaskets.basketId,
      animalCount: selectionSourceBaskets.animalCount,
      lotId: selectionSourceBaskets.lotId,
      cycleId: selectionSourceBaskets.cycleId
    })
    .from(selectionSourceBaskets)
    .where(eq(selectionSourceBaskets.selectionId, Number(id)));

    // Recupera i cestelli di destinazione
    const destinationBaskets = await db.select({
      basketId: selectionDestinationBaskets.basketId,
      destinationType: selectionDestinationBaskets.destinationType,
      flupsyId: selectionDestinationBaskets.flupsyId,
      position: selectionDestinationBaskets.position,
      animalCount: selectionDestinationBaskets.animalCount,
      totalWeight: selectionDestinationBaskets.totalWeight,
      animalsPerKg: selectionDestinationBaskets.animalsPerKg,
      sizeId: selectionDestinationBaskets.sizeId,
      deadCount: selectionDestinationBaskets.deadCount,
      mortalityRate: selectionDestinationBaskets.mortalityRate,
      meshSopra: selectionDestinationBaskets.meshSopra,
      meshSotto: selectionDestinationBaskets.meshSotto,
      meshSopra2: selectionDestinationBaskets.meshSopra2,
      meshSotto2: selectionDestinationBaskets.meshSotto2
    })
    .from(selectionDestinationBaskets)
    .where(eq(selectionDestinationBaskets.selectionId, Number(id)));

    if (sourceBaskets.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Nessun cestello di origine trovato per questa selezione"
      });
    }

    if (destinationBaskets.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Nessun cestello di destinazione trovato per questa selezione"
      });
    }

    // CALCOLA MORTALITÀ
    const totalAnimalsOrigin = sourceBaskets.reduce((sum, sb) => sum + (sb.animalCount || 0), 0);
    const totalAnimalsDestination = destinationBaskets.reduce((sum, db) => sum + (db.animalCount || 0), 0);
    const mortality = totalAnimalsOrigin - totalAnimalsDestination;
    
    console.log(`📊 CALCOLO MORTALITÀ:`);
    console.log(`   Animali origine: ${totalAnimalsOrigin}`);
    console.log(`   Animali destinazione: ${totalAnimalsDestination}`);
    console.log(`   Mortalità calcolata: ${mortality} (${mortality > 0 ? 'perdita' : 'guadagno'})`);

    // TRANSAZIONE CORRETTA
    await db.transaction(async (tx) => {
      
      // ====== IDENTIFICAZIONE CESTELLI DUPLICATI ======
      // Identifica cestelli che sono sia origine che destinazione
      const overlappingBasketIds = new Set(
        sourceBaskets
          .filter(sb => destinationBaskets.some(db => db.basketId === sb.basketId))
          .map(sb => sb.basketId)
      );
      
      if (overlappingBasketIds.size > 0) {
        console.log(`⚠️ Cestelli sia origine che destinazione: ${Array.from(overlappingBasketIds).join(', ')}`);
      }
      
      // ====== FASE 1: CHIUSURA CESTELLI ORIGINE (TUTTI) ======
      console.log(`🔒 FASE 1: Chiusura ${sourceBaskets.length} cestelli origine`);
      
      for (const sourceBasket of sourceBaskets) {
        console.log(`   Processando cestello origine ${sourceBasket.basketId}...`);
        
        // Controlla se questo cestello è anche destinazione
        const isAlsoDestination = overlappingBasketIds.has(sourceBasket.basketId);
        
        // Ottieni info cestello
        const basketInfo = await tx.select()
          .from(baskets)
          .where(eq(baskets.id, sourceBasket.basketId))
          .limit(1);

        if (basketInfo.length > 0 && basketInfo[0].currentCycleId) {
          
          // 1. OPERAZIONE CHIUSURA-CICLO-VAGLIATURA (specifica per tracciabilità)
          await tx.insert(operations).values({
            date: selection[0].date,
            type: 'chiusura-ciclo-vagliatura',
            basketId: sourceBasket.basketId,
            cycleId: basketInfo[0].currentCycleId,
            animalCount: sourceBasket.animalCount,
            notes: `Chiusura per vagliatura #${selection[0].selectionNumber} del ${selection[0].date}. ` +
                   `Animali distribuiti: ${totalAnimalsDestination}. Mortalità: ${mortality}`,
            source: 'desktop_manager' // Operazione da gestionale desktop
          });

          // 2. CHIUDI IL CICLO
          await tx.update(cycles)
            .set({ 
              state: 'closed', 
              endDate: selection[0].date 
            })
            .where(eq(cycles.id, basketInfo[0].currentCycleId));

          // 3. LIBERA IL CESTELLO SOLO SE NON È ANCHE DESTINAZIONE
          // Se è anche destinazione, la fase 2 gestirà lo stato finale
          if (!isAlsoDestination) {
            await tx.update(baskets)
              .set({ 
                state: 'available',
                currentCycleId: null
              })
              .where(eq(baskets.id, sourceBasket.basketId));
            console.log(`   ✅ Cestello ${sourceBasket.basketId} cessato e reso disponibile`);
          } else {
            console.log(`   ⚠️ Cestello ${sourceBasket.basketId} cessato ma è anche destinazione (stato gestito dopo)`);
          }
        }
      }

      // ====== FASE 2: ATTIVAZIONE CESTELLI DESTINAZIONE ======
      console.log(`🆕 FASE 2: Attivazione ${destinationBaskets.length} cestelli destinazione`);
      
      // ====== DISTRIBUZIONE PROPORZIONALE DEI LOTTI ======
      // Raccogli lotti dalle origini REALI considerando anche composizioni miste
      const sourceBasketData = await tx.select()
        .from(selectionSourceBaskets)
        .where(eq(selectionSourceBaskets.selectionId, Number(id)));
      
      const lotComposition = new Map<number, number>();
      
      for (const sourceBasket of sourceBasketData) {
        // Prima verifica se il cestello ha una composizione mista in basketLotComposition
        const mixedComposition = await tx.select()
          .from(basketLotComposition)
          .where(eq(basketLotComposition.cycleId, sourceBasket.cycleId!));
        
        if (mixedComposition.length > 0) {
          // Cestello con composizione mista: usa i dati da basketLotComposition
          console.log(`🔀 Cestello ${sourceBasket.basketId} ha composizione MISTA (${mixedComposition.length} lotti)`);
          for (const comp of mixedComposition) {
            const current = lotComposition.get(comp.lotId) || 0;
            lotComposition.set(comp.lotId, current + comp.animalCount);
            console.log(`   🔍 Lotto ${comp.lotId}: ${comp.animalCount} animali (${(comp.percentage * 100).toFixed(1)}%)`);
          }
        } else {
          // Cestello mono-lotto: recupera lotId dal ciclo se non presente nella selezione
          // Questo gestisce anche i cicli "legacy" che non hanno basketLotComposition
          const cycleData = await tx.select({ lotId: cycles.lotId })
            .from(cycles)
            .where(eq(cycles.id, sourceBasket.cycleId!))
            .limit(1);
            
          const lotId = sourceBasket.lotId || cycleData[0]?.lotId;
          if (lotId) {
            const current = lotComposition.get(lotId) || 0;
            lotComposition.set(lotId, current + (sourceBasket.animalCount || 0));
            console.log(`📦 Lotto ${lotId} recuperato dal ${sourceBasket.lotId ? 'selezione' : 'ciclo'}: ${sourceBasket.animalCount} animali (cestello ${sourceBasket.basketId})`);
          } else {
            console.log(`⚠️ ATTENZIONE: Cestello ${sourceBasket.basketId} senza lotto - verrà usato il default`);
          }
        }
      }
      
      // Gestione caso senza lotti: usa lotto di default
      let primaryLotId: number;
      let lotPercentages = new Map<number, number>();
      let isMixedLot = false;
      
      if (lotComposition.size === 0) {
        console.log(`⚠️ ATTENZIONE: Nessun lotto trovato nei cestelli origine, uso lotto di default`);
        // Usa il primo lotto disponibile nel sistema come default
        const [defaultLot] = await tx.select({ id: lots.id }).from(lots).limit(1);
        if (!defaultLot) {
          await tx.rollback();
          return res.status(500).json({
            success: false,
            error: "ERRORE CRITICO: Nessun lotto disponibile nel sistema per completare la vagliatura"
          });
        }
        primaryLotId = defaultLot.id;
        lotPercentages.set(primaryLotId, 1.0); // 100% al lotto default
        console.log(`🎯 Lotto default assegnato: ${primaryLotId} (100%)`);
      } else {
        // Calcola percentuali per distribuzione proporzionale
        const totalAnimals = Array.from(lotComposition.values()).reduce((a, b) => a + b, 0);
        isMixedLot = lotComposition.size > 1;
        
        for (const [lotId, count] of Array.from(lotComposition.entries())) {
          lotPercentages.set(lotId, count / totalAnimals);
        }
        
        // Trova il lotto PRINCIPALE per il ciclo (maggior quantità)
        const dominantLot = Array.from(lotComposition.entries())
          .sort(([, a], [, b]) => b - a)[0];
        primaryLotId = dominantLot[0];
        
        console.log(`🎯 Lotto principale: ${primaryLotId} (${dominantLot[1]} animali)`);
        if (isMixedLot) {
          console.log(`🔀 Vagliatura MISTA rilevata: ${lotComposition.size} lotti diversi`);
          console.log(`📊 Composizione percentuale:`, Array.from(lotPercentages.entries()).map(([id, perc]) => `Lotto ${id}: ${(perc * 100).toFixed(1)}%`));
        }
      }
      
      const basketToCycleMap = new Map<number, number>();
      
      for (const destBasket of destinationBaskets) {
        const wasAlsoSource = overlappingBasketIds.has(destBasket.basketId);
        console.log(`   Processando cestello destinazione ${destBasket.basketId}${wasAlsoSource ? ' (era anche origine)' : ''}...`);
        
        // 1. CREA NUOVO CICLO CON LOTTO PRINCIPALE
        const [newCycle] = await tx.insert(cycles).values({
          basketId: destBasket.basketId,
          lotId: primaryLotId, // ✅ LOTTO PRINCIPALE per compatibilità DB
          startDate: selection[0].date,
          state: 'active'
        }).returning();

        basketToCycleMap.set(destBasket.basketId, newCycle.id);
        
        // 1.1. AGGIORNA cycle_id in selection_destination_baskets
        await tx.update(selectionDestinationBaskets)
          .set({ cycleId: newCycle.id })
          .where(
            and(
              eq(selectionDestinationBaskets.selectionId, Number(id)),
              eq(selectionDestinationBaskets.basketId, destBasket.basketId)
            )
          );

        // 1.5. DISTRIBUZIONE PROPORZIONALE DEI LOTTI
        console.log(`   📊 Distribuzione proporzionale ${lotPercentages.size} lotti nel cestello ${destBasket.basketId}:`);
        let totalDistributed = 0;
        const lotDistributions: { lotId: number; animals: number }[] = [];
        
        // Calcola animali per ogni lotto secondo le percentuali  
        const basketAnimalCount = destBasket.animalCount || 0;
        for (const [lotId, percentage] of Array.from(lotPercentages.entries())) {
          const proportionalAnimals = Math.round(basketAnimalCount * percentage);
          lotDistributions.push({ lotId, animals: proportionalAnimals });
          totalDistributed += proportionalAnimals;
          console.log(`      Lotto ${lotId}: ${proportionalAnimals} animali (${(percentage * 100).toFixed(1)}%)`);
        }
        
        // Gestione remainder per arrotondamenti
        const remainder = basketAnimalCount - totalDistributed;
        if (remainder !== 0 && lotDistributions.length > 0) {
          lotDistributions[0].animals += remainder; // Assegna il remainder al lotto principale
          console.log(`      Remainder ${remainder} animali assegnati al lotto principale ${lotDistributions[0].lotId}`);
        }
        
        // Registra composizione nella tabella basketLotComposition
        for (const { lotId, animals } of lotDistributions) {
          if (animals > 0) { // Solo se ci sono animali da registrare
            const percentage = basketAnimalCount > 0 ? (animals / basketAnimalCount) : 0;
            await tx.insert(basketLotComposition).values({
              basketId: destBasket.basketId,
              cycleId: newCycle.id,
              lotId: lotId,
              animalCount: animals,
              percentage: percentage,
              sourceSelectionId: Number(id), // Tracciabilità della vagliatura
              notes: `Da vagliatura #${selection[0].selectionNumber} del ${selection[0].date}`
            });
          }
        }

        // 2. DETERMINA TAGLIA
        let actualSizeId = destBasket.sizeId;
        if (!actualSizeId || actualSizeId === 0) {
          if (destBasket.animalsPerKg) {
            actualSizeId = await determineSizeId(destBasket.animalsPerKg);
          }
        }

        // 3. OPERAZIONE PRIMA-ATTIVAZIONE (APPROCCIO IBRIDO)
        let operationNotes = `Da vagliatura #${selection[0].selectionNumber} del ${selection[0].date}${wasAlsoSource ? ' (cestello riutilizzato)' : ''}`;
        
        if (isMixedLot) {
          // Crea stringa con composizione dettagliata
          const compositionDetails = lotDistributions
            .map(({ lotId, animals }) => {
              const percentage = basketAnimalCount > 0 ? ((animals / basketAnimalCount) * 100).toFixed(1) : '0.0';
              return `Lotto ${lotId} (${percentage}%, ${animals.toLocaleString('it-IT')} pz)`;
            })
            .join(', ');
          
          operationNotes += ` - LOTTO MISTO: ${compositionDetails}`;
        }
        
        const operationMetadata = isMixedLot 
          ? JSON.stringify({ isMixed: true, sourceSelection: Number(id), dominantLot: primaryLotId, lotCount: lotComposition.size })
          : null;
        
        await tx.insert(operations).values({
          date: selection[0].date,
          type: 'prima-attivazione',
          basketId: destBasket.basketId,
          cycleId: newCycle.id,
          lotId: primaryLotId, // ✅ LOTTO DOMINANTE per query veloci
          animalCount: destBasket.animalCount,
          totalWeight: destBasket.totalWeight,
          animalsPerKg: destBasket.animalsPerKg,
          averageWeight: destBasket.totalWeight && destBasket.animalCount 
                        ? Math.round((destBasket.totalWeight / destBasket.animalCount) * 1000) 
                        : 0,
          deadCount: destBasket.deadCount || 0,
          mortalityRate: destBasket.mortalityRate || 0,
          sizeId: actualSizeId,
          metadata: operationMetadata,
          notes: operationNotes,
          source: 'desktop_manager' // Operazione da gestionale desktop
        });

        // 4. GESTISCI POSIZIONAMENTO O VENDITA
        if (destBasket.destinationType === 'sold') {
          // VENDITA IMMEDIATA (APPROCCIO IBRIDO)
          let saleNotes = `Vendita diretta da vagliatura #${selection[0].selectionNumber}`;
          
          if (isMixedLot) {
            // Crea stringa con composizione dettagliata
            const compositionDetails = lotDistributions
              .map(({ lotId, animals }) => {
                const percentage = basketAnimalCount > 0 ? ((animals / basketAnimalCount) * 100).toFixed(1) : '0.0';
                return `Lotto ${lotId} (${percentage}%, ${animals.toLocaleString('it-IT')} pz)`;
              })
              .join(', ');
            
            saleNotes += ` - LOTTO MISTO: ${compositionDetails}`;
          }
          
          const [saleOperation] = await tx.insert(operations).values({
            date: selection[0].date,
            type: 'vendita',
            basketId: destBasket.basketId,
            cycleId: newCycle.id,
            animalCount: destBasket.animalCount,
            totalWeight: destBasket.totalWeight,
            animalsPerKg: destBasket.animalsPerKg,
            averageWeight: destBasket.totalWeight && destBasket.animalCount 
                          ? Math.round((destBasket.totalWeight / destBasket.animalCount) * 1000) 
                          : 0,
            deadCount: destBasket.deadCount || 0,
            mortalityRate: destBasket.mortalityRate || 0,
            sizeId: actualSizeId,
            lotId: primaryLotId, // ✅ LOTTO DOMINANTE per query veloci
            metadata: operationMetadata,
            notes: saleNotes,
            source: 'desktop_manager' // Operazione da gestionale desktop
          }).returning();

          // ✅ REGISTRA VENDITA NEL LOT_LEDGER
          // Per ogni lotto nella distribuzione, registra la vendita
          for (const { lotId, animals } of lotDistributions) {
            const allocationBasisData = {
              selectionId: Number(id),
              totalAnimals: basketAnimalCount,
              lotDistributions: lotDistributions.map(ld => ({
                lotId: ld.lotId,
                animals: ld.animals,
                percentage: basketAnimalCount > 0 ? (ld.animals / basketAnimalCount) : 0
              }))
            };
            
            await tx.insert(lotLedger).values({
              date: selection[0].date,
              lotId: lotId,
              type: 'sale',
              quantity: String(animals), // Converti in stringa per numeric
              basketId: destBasket.basketId,
              operationId: saleOperation.id,
              selectionId: Number(id),
              allocationMethod: 'proportional',
              allocationBasis: allocationBasisData,
              idempotencyKey: `sale-selection-${id}-basket-${destBasket.basketId}-lot-${lotId}`,
              notes: `Vendita da vagliatura #${selection[0].selectionNumber}`
            });
          }
          
          console.log(`   ✅ Registrate ${lotDistributions.length} vendite nel lot_ledger per operazione ${saleOperation.id}`);

          // Chiudi ciclo per vendita
          await tx.update(cycles)
            .set({ state: 'closed', endDate: selection[0].date })
            .where(eq(cycles.id, newCycle.id));

          // Rendi cestello disponibile per nuovo ciclo
          // Il cestello venduto mantiene la sua posizione fisica nel FLUPSY
          await tx.update(baskets)
            .set({ 
              state: 'available',
              currentCycleId: null
              // NON cambiamo position e row - il cestello rimane nella sua posizione fisica
            })
            .where(eq(baskets.id, destBasket.basketId));
          
          console.log(`   ✅ Cestello ${destBasket.basketId} venduto - ciclo chiuso, cestello disponibile nel FLUPSY`);

        } else {
          // POSIZIONAMENTO NORMALE
          const positionStr = String(destBasket.position || '');
          const match = positionStr.match(/^([A-Z]+)(\d+)$/);
          
          if (match) {
            const row = match[1];
            const position = parseInt(match[2]);
            
            await tx.update(baskets)
              .set({
                flupsyId: destBasket.flupsyId,
                row: row,
                position: position,
                state: 'active',
                currentCycleId: newCycle.id
              })
              .where(eq(baskets.id, destBasket.basketId));
          }
          
          console.log(`   ✅ Cestello ${destBasket.basketId} riposizionato con ciclo attivo`);
        }
      }

      // ====== FASE 2.5: GENERAZIONE SCREENING LABELS ======
      console.log(`🏷️ FASE 2.5: Generazione etichette vagliatura`);
      {
        const selDate = new Date(selection[0].date);
        const datePrefix = `${selDate.getDate().toString().padStart(2, '0')}/${(selDate.getMonth() + 1).toString().padStart(2, '0')}`;
        
        const labelCounts = new Map<string, number>();
        const cycleLabels: Array<{ cycleId: number; label: string }> = [];
        
        for (const destBasket of destinationBaskets) {
          const meshUp = destBasket.meshSopra;
          const meshDown = destBasket.meshSotto;
          const meshUp2 = destBasket.meshSopra2;
          const meshDown2 = destBasket.meshSotto2;
          
          if (!meshUp && !meshDown) {
            continue;
          }
          
          let labelBase = datePrefix;
          if (meshUp) labelBase += ` +${meshUp}`;
          if (meshDown) labelBase += ` -${meshDown}`;
          if (meshUp2) labelBase += ` +${meshUp2}`;
          if (meshDown2) labelBase += ` -${meshDown2}`;
          
          const count = (labelCounts.get(labelBase) || 0) + 1;
          labelCounts.set(labelBase, count);
          
          const resolvedCycleId = basketToCycleMap.get(destBasket.basketId);
          if (!resolvedCycleId) continue;
          cycleLabels.push({ cycleId: resolvedCycleId, label: labelBase });
        }
        
        const labelTotals = new Map<string, number>(labelCounts);
        const labelCounters = new Map<string, number>();
        
        for (const { cycleId, label } of cycleLabels) {
          const total = labelTotals.get(label) || 1;
          let finalLabel = label;
          if (total > 1) {
            const counter = (labelCounters.get(label) || 0) + 1;
            labelCounters.set(label, counter);
            finalLabel = `${label} (${counter})`;
          }
          
          await tx.update(cycles)
            .set({ screeningLabel: finalLabel })
            .where(eq(cycles.id, cycleId));
          
          console.log(`   🏷️ Ciclo ${cycleId}: "${finalLabel}"`);
        }
      }

      // ====== FASE 3: REGISTRAZIONE MORTALITÀ SUL LOTTO ======
      if (primaryLotId && mortality !== 0) {
        console.log(`📈 FASE 3: Registrazione mortalità ${mortality} su lotto ${primaryLotId}`);
        
        // Aggiorna mortalità del lotto
        await tx.update(lots)
          .set({ 
            totalMortality: sql`COALESCE(total_mortality, 0) + ${mortality}`,
            lastMortalityDate: selection[0].date,
            mortalityNotes: sql`COALESCE(mortality_notes, '') || ${`Vagliatura #${selection[0].selectionNumber}: ${mortality} animali. `}`
          })
          .where(eq(lots.id, primaryLotId));
      }

      // ====== FASE 4: STORICIZZAZIONE RELAZIONI ======
      console.log(`📝 FASE 4: Storicizzazione relazioni vagliatura`);
      
      // Registra relazioni fonte->destinazione per tracciabilità
      for (const sourceBasket of sourceBaskets) {
        for (const destBasket of destinationBaskets) {
          await tx.insert(selectionBasketHistory).values({
            selectionId: Number(id),
            sourceBasketId: sourceBasket.basketId,
            sourceCycleId: sourceBasket.cycleId,
            destinationBasketId: destBasket.basketId,
            destinationCycleId: 0 // Sarà aggiornato con l'ID reale del nuovo ciclo
          });
        }
      }

      // ====== FASE 5: FINALIZZAZIONE SELEZIONE ======
      await tx.update(selections)
        .set({ 
          status: 'completed',
          updatedAt: new Date()
        })
        .where(eq(selections.id, Number(id)));

      console.log(`✅ VAGLIATURA COMPLETATA CORRETTAMENTE!`);
    });

    // Invia notifiche WebSocket
    if (typeof (global as any).broadcastUpdate === 'function') {
      (global as any).broadcastUpdate('selection_completed', {
        selectionId: Number(id),
        message: `Vagliatura #${selection[0].selectionNumber} completata con successo`,
        mortality: mortality,
        totalAnimalsOrigin: totalAnimalsOrigin,
        totalAnimalsDestination: totalAnimalsDestination
      });
    }

    return res.status(200).json({
      success: true,
      message: `Vagliatura #${selection[0].selectionNumber} completata con successo`,
      selectionId: Number(id),
      mortality: mortality,
      totalAnimalsOrigin: totalAnimalsOrigin,
      totalAnimalsDestination: totalAnimalsDestination,
      sourceBasketsClosed: sourceBaskets.length,
      destinationBasketsActivated: destinationBaskets.length
    });

  } catch (error) {
    console.error("❌ ERRORE DURANTE COMPLETAMENTO VAGLIATURA:", error);
    return res.status(500).json({
      success: false,
      error: `Errore durante il completamento della vagliatura: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}

/**
 * Determina automaticamente l'ID della taglia basandosi sugli animali per kg
 * Uses shared utility function for consistent sizing logic
 */
async function determineSizeId(animalsPerKg: number): Promise<number | null> {
  const { determineSizeByAnimalsPerKg } = await import('../utils/size-determination.js');
  return determineSizeByAnimalsPerKg(animalsPerKg);
}