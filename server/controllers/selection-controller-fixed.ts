/**
 * CORREZIONE LOGICA VAGLIATURA - Implementazione corretta per gestire:
 * 1. Cessazione SEMPRE dei cestelli origine (non riattivazione)
 * 2. Calcolo e registrazione mortalità del lotto
 * 3. Tracciabilità completa della vagliatura
 * 4. Operazione "chiusura-ciclo-vagliatura" per storicizzazione
 */
import { Request, Response } from "express";
import { db } from "../db";
import { eq, and, or, isNull, isNotNull, inArray, sql } from "drizzle-orm";
import { 
  selections, 
  selectionSourceBaskets, 
  selectionDestinationBaskets, 
  selectionBasketHistory, 
  selectionLotReferences,
  basketLotComposition,
  cohorts,
  cohortComposition,
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
import { sendSuspiciousScreeningEmail } from "../services/screening-suspicious-email";
import { recomputeLotMortality } from "../services/lot-mortality";

const SUSPICIOUS_THRESHOLD_PCT = 3;
// FASE 1 "Niente sparizioni": tolleranza del bilancio di chiusura (origine = destinazione + mortalità).
// Oltre questa soglia (in valore assoluto) serve la conferma esplicita dell'operatore.
const BALANCE_TOLERANCE_PCT = 1;

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
      meshSotto2: selectionDestinationBaskets.meshSotto2,
      screeningPosition: selectionDestinationBaskets.screeningPosition
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

    // CALCOLA MORTALITÀ (bilancio di chiusura ciclo: origine = destinazione + mortalità)
    const totalAnimalsOrigin = sourceBaskets.reduce((sum, sb) => sum + (sb.animalCount || 0), 0);
    const totalAnimalsDestination = destinationBaskets.reduce((sum, db) => sum + (db.animalCount || 0), 0);
    const mortality = totalAnimalsOrigin - totalAnimalsDestination;
    // Discrepanza simmetrica: vale sia per le perdite (mortalità) sia per i guadagni impossibili.
    const discrepancyPct = totalAnimalsOrigin > 0
      ? (Math.abs(mortality) / totalAnimalsOrigin) * 100
      : 0;

    console.log(`📊 BILANCIO VAGLIATURA:`);
    console.log(`   Animali origine: ${totalAnimalsOrigin}`);
    console.log(`   Animali destinazione: ${totalAnimalsDestination}`);
    console.log(`   Differenza: ${mortality} (${mortality > 0 ? 'perdita' : mortality < 0 ? 'guadagno' : 'pari'}) — discrepanza ${discrepancyPct.toFixed(2)}%`);

    const confirmedSuspicious = req.body?.confirmedSuspicious === true;
    const suspiciousNote: string | null = typeof req.body?.suspiciousNote === 'string'
      ? req.body.suspiciousNote.trim().slice(0, 1000) || null
      : null;

    // ====== FASE 1 — NIENTE SPARIZIONI: BILANCIO DI CHIUSURA ======
    // Regola: origine = destinazione + mortalità. Tolleranza ±1% per il rumore di conteggio.

    // 0) Origine a zero ma destinazione con animali → guadagno impossibile (la % non è calcolabile).
    if (totalAnimalsOrigin === 0 && totalAnimalsDestination > 0) {
      console.warn(`⛔ Vagliatura #${selection[0].selectionNumber} ANOMALIA: origine = 0 ma destinazione = ${totalAnimalsDestination}`);
      return res.status(422).json({
        success: false,
        requiresConfirmation: false,
        code: 'BALANCE_ANOMALY_GAIN',
        threshold: BALANCE_TOLERANCE_PCT,
        totalAnimalsOrigin,
        totalAnimalsDestination,
        mortality,
        discrepancyPct: 100,
        message: `Anomalia: l'origine non ha animali ma in destinazione ne risultano ${totalAnimalsDestination.toLocaleString('it-IT')}. Non è possibile avere più animali in uscita che in entrata: controlla i conteggi.`,
      });
    }

    // 1) Guadagno impossibile: destinazione > origine oltre tolleranza → ANOMALIA, blocco non aggirabile.
    if (mortality < 0 && discrepancyPct > BALANCE_TOLERANCE_PCT) {
      console.warn(`⛔ Vagliatura #${selection[0].selectionNumber} ANOMALIA: destinazione (${totalAnimalsDestination}) > origine (${totalAnimalsOrigin}) di ${Math.abs(mortality)} (${discrepancyPct.toFixed(2)}%)`);
      return res.status(422).json({
        success: false,
        requiresConfirmation: false,
        code: 'BALANCE_ANOMALY_GAIN',
        threshold: BALANCE_TOLERANCE_PCT,
        totalAnimalsOrigin,
        totalAnimalsDestination,
        mortality,
        discrepancyPct,
        message: `Anomalia: in destinazione risultano ${Math.abs(mortality).toLocaleString('it-IT')} animali in più rispetto all'origine (${discrepancyPct.toFixed(2)}%). Non è possibile avere più animali in uscita che in entrata: controlla i conteggi.`,
      });
    }

    // 2) Perdita oltre tolleranza → conferma esplicita (registra mortalità) oppure correggi.
    const isMismatch = mortality > 0 && discrepancyPct > BALANCE_TOLERANCE_PCT;
    // Soglia "sospetta" più alta (≥3%) → invio email di alert (escalation).
    const isSuspicious = mortality > 0 && discrepancyPct >= SUSPICIOUS_THRESHOLD_PCT;

    if (isMismatch && !confirmedSuspicious) {
      console.warn(`⚠️ Vagliatura #${selection[0].selectionNumber} bilancio fuori tolleranza: ${discrepancyPct.toFixed(2)}% > ${BALANCE_TOLERANCE_PCT}% — richiesta conferma operatore`);
      return res.status(422).json({
        success: false,
        requiresConfirmation: true,
        code: 'SUSPICIOUS_SCREENING',
        threshold: BALANCE_TOLERANCE_PCT,
        suspiciousThreshold: SUSPICIOUS_THRESHOLD_PCT,
        isSuspicious,
        totalAnimalsOrigin,
        totalAnimalsDestination,
        mortality,
        discrepancyPct,
        message: `Bilancio: origine ${totalAnimalsOrigin.toLocaleString('it-IT')}, destinazione ${totalAnimalsDestination.toLocaleString('it-IT')}. Differenza di ${mortality.toLocaleString('it-IT')} animali (${discrepancyPct.toFixed(2)}%). Vuoi registrare la differenza come mortalità?`,
      });
    }

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
      
      // ====== FASE 3: DETERMINAZIONE COORTE DI MESCOLAMENTO ======
      // Stabilisce se questa vagliatura: (a) avanza un'unica coorte esistente senza nuovi lotti
      // (trascina avanti lo stesso cohortId, NESSUNA ri-foto), (b) crea una nuova coorte
      // (mescolamento reale: lotti puri diversi, coorti diverse, o coorte + lotto esterno) con
      // foto congelata dai vivi correnti, oppure (c) lotto puro mai mescolato → nessuna coorte.
      const sourceCycleIds = Array.from(new Set(
        sourceBasketData.map(sb => sb.cycleId).filter((x): x is number => x != null)
      ));
      const sourceCohortIds = new Set<number>();
      let hasPureSource = false;
      if (sourceCycleIds.length > 0) {
        const srcCycles = await tx.select({ id: cycles.id, cohortId: cycles.cohortId })
          .from(cycles)
          .where(inArray(cycles.id, sourceCycleIds));
        for (const c of srcCycles) {
          if (c.cohortId != null) sourceCohortIds.add(c.cohortId);
          else hasPureSource = true;
        }
        if (srcCycles.length < sourceCycleIds.length) hasPureSource = true;
      } else {
        hasPureSource = true;
      }

      let targetCohortId: number | null = null;
      let createNewCohort = false;

      if (sourceCohortIds.size === 1 && !hasPureSource) {
        // Avanzamento di un'unica coorte esistente, nessun nuovo lotto/coorte: trascina avanti.
        targetCohortId = Array.from(sourceCohortIds)[0];
        console.log(`🧬 FASE 3: Avanzamento coorte esistente #${targetCohortId} (foto congelata invariata, nessuna ri-stima)`);
      } else if ((sourceCohortIds.size >= 1 || isMixedLot) && totalAnimalsDestination > 0) {
        // Mescolamento reale con vivi in destinazione → nuova coorte.
        // Il vincolo totalAnimalsDestination > 0 mantiene la parità con il backfill ed evita
        // coorti con vivi iniziali = 0 (composizione vuota).
        createNewCohort = true;
      }
      // else: lotto puro mai mescolato → targetCohortId resta null (nessuna coorte).

      if (createNewCohort) {
        const cohortCode = `COORTE #${selection[0].selectionNumber} (${selection[0].date})`;
        const mergedCohorts = Array.from(sourceCohortIds);
        const [newCohort] = await tx.insert(cohorts).values({
          code: cohortCode,
          sourceSelectionId: Number(id),
          mixDate: selection[0].date,
          initialAnimalCount: totalAnimalsDestination,
          status: 'active',
          notes: mergedCohorts.length > 0
            ? `Mescolamento vagliatura #${selection[0].selectionNumber}. Fonde coorti precedenti: ${mergedCohorts.join(', ')}.`
            : `Mescolamento vagliatura #${selection[0].selectionNumber} di ${lotComposition.size} lotti.`,
        }).returning();
        targetCohortId = newCohort.id;

        // Congela la composizione: proporzioni dell'origine applicate al totale vivi destinazione (verità contata).
        let frozenTotal = 0;
        const frozenRows: { lotId: number; animals: number; percentage: number }[] = [];
        for (const [lotId, percentage] of Array.from(lotPercentages.entries())) {
          const animals = Math.round(totalAnimalsDestination * percentage);
          frozenRows.push({ lotId, animals, percentage });
          frozenTotal += animals;
        }
        const frozenRemainder = totalAnimalsDestination - frozenTotal;
        if (frozenRemainder !== 0 && frozenRows.length > 0) {
          const dom = frozenRows.reduce((a, b) => (b.animals > a.animals ? b : a), frozenRows[0]);
          dom.animals += frozenRemainder;
        }
        for (const fr of frozenRows) {
          if (fr.animals > 0) {
            await tx.insert(cohortComposition).values({
              cohortId: newCohort.id,
              lotId: fr.lotId,
              animalCount: fr.animals,
              percentage: fr.percentage,
            });
          }
        }
        console.log(`🧬 FASE 3: Creata coorte #${newCohort.id} "${cohortCode}" — ${totalAnimalsDestination} vivi congelati su ${frozenRows.filter(f => f.animals > 0).length} lotti`);
      } else if (targetCohortId != null) {
        // AVANZAMENTO di una coorte esistente: la ripartizione interna per lotto DEVE derivare
        // dalla foto congelata della coorte (cohort_composition), NON da una nuova stima pro-quota
        // dalle origini. Questo elimina la deriva sistematica tra una vagliatura e l'altra
        // (constraint Fase 3: "ripartizione interna congelata al mix, mai ri-stimata").
        const frozen = await tx.select({
          lotId: cohortComposition.lotId,
          percentage: cohortComposition.percentage,
        })
          .from(cohortComposition)
          .where(eq(cohortComposition.cohortId, targetCohortId));
        if (frozen.length > 0) {
          lotPercentages = new Map<number, number>();
          for (const fr of frozen) lotPercentages.set(fr.lotId, Number(fr.percentage));
          const dom = frozen.reduce((a, b) => (Number(b.percentage) > Number(a.percentage) ? b : a), frozen[0]);
          primaryLotId = dom.lotId;
          isMixedLot = frozen.length > 1;
          console.log(`🧬 FASE 3: Ripartizione interna dalla foto congelata coorte #${targetCohortId} (${frozen.length} lotti, nessuna ri-stima pro-quota)`);
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
          state: 'active',
          cohortId: targetCohortId, // FASE 3: coorte di mescolamento (null se lotto puro)
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
      console.log(`🏷️ DEBUG: destinationBaskets.length=${destinationBaskets.length}, basketToCycleMap.size=${basketToCycleMap.size}`);
      console.log(`🏷️ DEBUG: basketToCycleMap entries:`, JSON.stringify(Array.from(basketToCycleMap.entries())));
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
          
          const position = destBasket.screeningPosition as string | null;
          console.log(`🏷️ DEBUG basket ${destBasket.basketId} (type=${typeof destBasket.basketId}): meshSopra=${meshUp}, meshSotto=${meshDown}, pos=${position}`);
          console.log(`🏷️ DEBUG resolvedCycleId=${basketToCycleMap.get(destBasket.basketId)}, mapKey lookup for ${destBasket.basketId}`);
          if (!meshUp && !meshDown && !position) {
            console.log(`🏷️ DEBUG: cestello ${destBasket.basketId} SALTATO (no mesh, no position)`);
            continue;
          }
          
          let labelBase = datePrefix;
          if (meshUp) labelBase += ` +${meshUp}`;
          if (meshDown) labelBase += ` -${meshDown}`;
          if (meshUp2) labelBase += ` +${meshUp2}`;
          if (meshDown2) labelBase += ` -${meshDown2}`;
          if (!meshUp && !meshDown && position) {
            labelBase += position === 'sopra' ? ' [+]' : ' [-]';
          }
          
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

      // ====== MORTALITÀ LOTTO ======
      // FASE 2 "Mortalità per differenza di vivi": NON si somma più in modo incrementale
      // (questo causava doppio conteggio e attribuiva tutto a un solo lotto). La mortalità
      // viene RICALCOLATA in modo canonico e idempotente dopo il commit della transazione,
      // a partire da tutte le vagliature del lotto (vedi sotto, fuori dalla transazione).

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
      const finalNotes = (isMismatch && confirmedSuspicious)
        ? `[Bilancio confermato dall'operatore — differenza ${discrepancyPct.toFixed(2)}% (${mortality.toLocaleString('it-IT')} animali) registrata come mortalità${isSuspicious ? ' — SOGLIA SOSPETTA superata' : ''}]${suspiciousNote ? ` Nota: ${suspiciousNote}` : ''}${selection[0].notes ? ` | ${selection[0].notes}` : ''}`
        : selection[0].notes;

      await tx.update(selections)
        .set({
          status: 'completed',
          updatedAt: new Date(),
          notes: finalNotes,
        })
        .where(eq(selections.id, Number(id)));

      console.log(`✅ VAGLIATURA COMPLETATA CORRETTAMENTE!`);
    });

    // ====== FASE 2: RICALCOLO CANONICO MORTALITÀ LOTTI (contata una sola volta) ======
    try {
      const affected = await db.execute(sql`
        SELECT DISTINCT lot_id FROM selection_source_baskets
        WHERE selection_id = ${Number(id)} AND lot_id IS NOT NULL
      `);
      const affectedLotIds = (affected.rows as any[])
        .map((r) => Number(r.lot_id))
        .filter((n) => !Number.isNaN(n));
      if (affectedLotIds.length > 0) {
        await recomputeLotMortality(affectedLotIds);
        console.log(`📈 FASE 2: Mortalità ricalcolata per lotti ${affectedLotIds.join(", ")}`);
      }
    } catch (recErr) {
      console.error(`⚠️ FASE 2: Errore ricalcolo mortalità (vagliatura comunque salvata):`, recErr);
    }

    // ====== EMAIL ALERT VAGLIATURA SOSPETTA ======
    if (isSuspicious) {
      try {
        // Ricostruisci dettagli ceste per l'email (con info FLUPSY/lotto/taglia)
        const sourceDetails = await db.execute(sql`
          SELECT ssb.basket_id, b.physical_number, f.name AS flupsy_name, ssb.lot_id, ssb.animal_count
          FROM selection_source_baskets ssb
          LEFT JOIN baskets b ON b.id = ssb.basket_id
          LEFT JOIN flupsys f ON f.id = b.flupsy_id
          WHERE ssb.selection_id = ${Number(id)}
        `);
        const destDetails = await db.execute(sql`
          SELECT sdb.basket_id, b.physical_number, f.name AS flupsy_name, s.code AS size_code, sdb.animal_count
          FROM selection_destination_baskets sdb
          LEFT JOIN baskets b ON b.id = sdb.basket_id
          LEFT JOIN flupsys f ON f.id = b.flupsy_id
          LEFT JOIN sizes s ON s.id = sdb.size_id
          WHERE sdb.selection_id = ${Number(id)}
        `);
        const lotIds = Array.from(new Set(
          (sourceDetails.rows as any[]).map(r => r.lot_id).filter((x: any) => x != null)
        ));

        await sendSuspiciousScreeningEmail({
          selectionId: Number(id),
          selectionNumber: selection[0].selectionNumber,
          date: selection[0].date,
          totalAnimalsOrigin,
          totalAnimalsDestination,
          mortality,
          discrepancyPct,
          threshold: SUSPICIOUS_THRESHOLD_PCT,
          suspiciousNote,
          sourceBaskets: (sourceDetails.rows as any[]).map(r => ({
            basketId: r.basket_id,
            physicalNumber: r.physical_number,
            flupsyName: r.flupsy_name,
            lotId: r.lot_id,
            animalCount: r.animal_count ?? 0,
          })),
          destinationBaskets: (destDetails.rows as any[]).map(r => ({
            basketId: r.basket_id,
            physicalNumber: r.physical_number,
            flupsyName: r.flupsy_name,
            sizeCode: r.size_code,
            animalCount: r.animal_count ?? 0,
          })),
          lotIds: lotIds as number[],
        });
        console.log(`📧 Email alert vagliatura sospetta #${selection[0].selectionNumber} inviata`);
      } catch (emailErr) {
        console.error(`⚠️ Errore invio email vagliatura sospetta #${selection[0].selectionNumber} (vagliatura comunque salvata):`, emailErr);
      }
    }

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