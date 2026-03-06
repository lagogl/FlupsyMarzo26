/**
 * SCRIPT DI BACKFILL: Calcola e assegna quality_class ai cicli storici
 * 
 * Logica:
 * - Per ogni vagliatura storica, raggruppa i cicli figli per parent_cycle_id
 * - Confronta i loro average_weight dalla prima-attivazione
 * - Assegna quality_class in base alla posizione relativa (sopra/sotto/equal)
 * - Se tutti uguali → PREMIUM (default, nessuna distinzione possibile)
 * - Se varianza significativa → top 25% = premium, bottom 25% = sub, resto = normal
 * - Cicli radice senza vagliatura → PREMIUM (mai passati sotto un vaglio)
 * 
 * Uso: npx tsx scripts/backfill-quality-class.ts
 * (NON-DISTRUTTIVO: aggiorna solo cicli con quality_class NULL)
 */

import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL non configurato');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

interface CycleWithWeight {
  id: number;
  parent_cycle_id: number | null;
  average_weight: number | null;
  quality_class: string | null;
}

function computeQualityClass(
  screeningPos: 'sopra' | 'sotto' | null,
  parentClass: string | null
): string {
  if (!screeningPos) return parentClass || 'premium';
  const thisClass = screeningPos === 'sopra' ? 'premium' : 'sub';
  if (!parentClass || parentClass === 'premium') {
    if (thisClass === 'premium') return 'premium';
    return parentClass === 'premium' ? 'normal' : 'sub';
  }
  if (parentClass === 'sub') {
    return thisClass === 'sub' ? 'sub' : 'normal';
  }
  return 'normal';
}

async function main() {
  const client = await pool.connect();
  try {
    console.log('🚀 INIZIO BACKFILL quality_class');
    console.log('===================================');

    // 1. Recupera tutti i cicli con la loro prima-attivazione average_weight
    const { rows: cycles } = await client.query<CycleWithWeight>(`
      SELECT 
        c.id,
        c.parent_cycle_id,
        c.quality_class,
        o.average_weight
      FROM cycles c
      LEFT JOIN operations o ON o.cycle_id = c.id AND o.type = 'prima-attivazione'
      ORDER BY c.id ASC
    `);

    console.log(`📊 Trovati ${cycles.length} cicli totali`);

    // 2. Raggruppa cicli figli per parent_cycle_id
    const childrenByParent = new Map<number, CycleWithWeight[]>();
    const rootCycles: CycleWithWeight[] = [];

    for (const cycle of cycles) {
      if (cycle.parent_cycle_id === null) {
        rootCycles.push(cycle);
      } else {
        const siblings = childrenByParent.get(cycle.parent_cycle_id) || [];
        siblings.push(cycle);
        childrenByParent.set(cycle.parent_cycle_id, siblings);
      }
    }

    console.log(`🌱 Cicli radice: ${rootCycles.length}`);
    console.log(`🔗 Gruppi con parent: ${childrenByParent.size}`);

    // Mappa: cicleId → quality_class calcolata
    const qualityMap = new Map<number, string>();

    // 3. Cicli radice → tutti PREMIUM (mai stati sotto un vaglio)
    for (const cycle of rootCycles) {
      qualityMap.set(cycle.id, 'premium');
    }
    console.log(`✅ ${rootCycles.length} cicli radice → premium`);

    // 4. Elabora i gruppi di figli per parent_cycle_id in ordine di ID crescente
    //    (così processiamo prima i nonni, poi i padri, poi i figli)
    const sortedParentIds = Array.from(childrenByParent.keys()).sort((a, b) => a - b);

    let totalPremium = 0, totalNormal = 0, totalSub = 0, totalAmbiguous = 0;

    for (const parentId of sortedParentIds) {
      const siblings = childrenByParent.get(parentId)!;

      // Recupera quality_class del genitore (già calcolata nei passi precedenti)
      const parentQuality = qualityMap.get(parentId) || null;

      // Calcola le posizioni automatiche basandosi su average_weight
      const validSiblings = siblings.filter(s => s.average_weight !== null && s.average_weight > 0);

      if (validSiblings.length < 2) {
        // Non abbastanza dati per distinguere → tutti premium o stessa del genitore
        for (const sibling of siblings) {
          const qc = computeQualityClass(null, parentQuality);
          qualityMap.set(sibling.id, qc);
          totalAmbiguous++;
        }
        continue;
      }

      const weights = validSiblings.map(s => s.average_weight as number);
      const minWeight = Math.min(...weights);
      const maxWeight = Math.max(...weights);
      const range = maxWeight - minWeight;

      if (range === 0) {
        // Tutti uguali → tutti premium (o stesso del genitore)
        for (const sibling of siblings) {
          const qc = computeQualityClass(null, parentQuality);
          qualityMap.set(sibling.id, qc);
          totalAmbiguous++;
        }
        continue;
      }

      // Assegna posizione in base al peso relativo
      const threshold = range * 0.25;

      for (const sibling of siblings) {
        const w = sibling.average_weight || 0;
        let pos: 'sopra' | 'sotto' | null = null;

        if (w >= maxWeight - threshold) pos = 'sopra';      // Animali grandi → sopra
        else if (w <= minWeight + threshold) pos = 'sotto'; // Animali piccoli → sotto
        // else → null (intermedio)

        const qc = computeQualityClass(pos, parentQuality);
        qualityMap.set(sibling.id, qc);

        if (qc === 'premium') totalPremium++;
        else if (qc === 'sub') totalSub++;
        else totalNormal++;
      }
    }

    // 5. Applica gli aggiornamenti al database
    console.log('\n💾 Applicazione aggiornamenti al database...');
    let updated = 0, skipped = 0;

    for (const [cycleId, qualityClass] of qualityMap.entries()) {
      const existing = cycles.find(c => c.id === cycleId);
      if (existing?.quality_class !== null && existing?.quality_class !== undefined) {
        skipped++;
        continue; // Non sovrascrivere classificazioni già esistenti
      }
      await client.query(
        'UPDATE cycles SET quality_class = $1 WHERE id = $2',
        [qualityClass, cycleId]
      );
      updated++;
    }

    console.log('\n===================================');
    console.log('📊 RIEPILOGO BACKFILL:');
    console.log(`  ✅ Cicli aggiornati: ${updated}`);
    console.log(`  ⏭️  Cicli già classificati (saltati): ${skipped}`);
    console.log(`  ★  Premium: ${rootCycles.length + totalPremium}`);
    console.log(`  ●  Normal: ${totalNormal}`);
    console.log(`  ▼  Sub: ${totalSub}`);
    console.log(`  ?  Ambigui (tutti premium): ${totalAmbiguous}`);
    console.log('===================================');
    console.log('✅ BACKFILL COMPLETATO');

  } catch (err) {
    console.error('❌ ERRORE durante il backfill:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
