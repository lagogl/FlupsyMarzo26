import { db } from "../db";
import { sql } from "drizzle-orm";
import { operations } from "@shared/schema";
import { eq } from "drizzle-orm";

interface MisuraToFix {
  id: number;
  basket_id: number;
  cycle_id: number;
  date: string;
  current_animal_count: number;
  prev_animal_count: number;
  mortality_rate: number | null;
  expected_animal_count: number;
  flupsy_name: string;
  basket_number: number;
}

interface DownstreamOp {
  id: number;
  basket_id: number;
  cycle_id: number;
  date: string;
  type: string;
  animal_count: number;
  new_animal_count: number;
}

async function fixMisuraOperations() {
  console.log("🔧 CORREZIONE OPERAZIONI MISURA - Inizio");
  console.log("=" .repeat(60));
  console.log(`📅 Data esecuzione: ${new Date().toLocaleString('it-IT')}`);
  console.log("");

  const result = await db.execute(sql`
    WITH ordered_ops AS (
      SELECT 
        o.id,
        o.basket_id,
        o.cycle_id,
        o.type,
        o.date,
        o.animal_count,
        o.mortality_rate,
        b.physical_number as basket_number,
        f.name as flupsy_name,
        LAG(o.animal_count) OVER (PARTITION BY o.basket_id, o.cycle_id ORDER BY o.date, o.id) as prev_animal_count
      FROM operations o
      LEFT JOIN baskets b ON o.basket_id = b.id
      LEFT JOIN flupsys f ON b.flupsy_id = f.id
      WHERE o.cycle_id IS NOT NULL AND o.cancelled_at IS NULL
    )
    SELECT 
      id,
      basket_id,
      cycle_id,
      date::text,
      animal_count as current_animal_count,
      prev_animal_count,
      mortality_rate,
      flupsy_name,
      basket_number,
      CASE 
        WHEN prev_animal_count IS NOT NULL AND COALESCE(mortality_rate, 0) > 0
        THEN ROUND(prev_animal_count * (100 - COALESCE(mortality_rate, 0)) / 100)
        WHEN prev_animal_count IS NOT NULL
        THEN prev_animal_count
        ELSE NULL
      END as expected_animal_count
    FROM ordered_ops
    WHERE type = 'misura'
      AND prev_animal_count IS NOT NULL AND prev_animal_count > 0
      AND ABS((animal_count - prev_animal_count)::numeric / prev_animal_count::numeric) > 0.05
    ORDER BY basket_id, cycle_id, date
  `);

  const misuraToFix = result.rows as MisuraToFix[];
  console.log(`📊 Trovate ${misuraToFix.length} operazioni MISURA da correggere`);
  console.log("");

  if (misuraToFix.length === 0) {
    console.log("✅ Nessuna correzione necessaria!");
    return { corrected: 0, propagated: 0 };
  }

  let totalCorrected = 0;
  let totalPropagated = 0;
  const corrections: any[] = [];

  for (const misura of misuraToFix) {
    console.log(`\n📌 Correzione MISURA #${misura.id}`);
    console.log(`   FLUPSY: ${misura.flupsy_name}, Cesta: ${misura.basket_number}, Ciclo: ${misura.cycle_id}`);
    console.log(`   Data: ${misura.date}`);
    console.log(`   Valore attuale: ${misura.current_animal_count.toLocaleString('it-IT')}`);
    console.log(`   Valore precedente: ${misura.prev_animal_count.toLocaleString('it-IT')}`);
    console.log(`   Mortalità: ${misura.mortality_rate || 0}%`);
    console.log(`   Valore corretto: ${misura.expected_animal_count.toLocaleString('it-IT')}`);

    const diff = misura.current_animal_count - misura.expected_animal_count;
    const diffPct = ((diff / misura.expected_animal_count) * 100).toFixed(1);
    console.log(`   Differenza: ${diff.toLocaleString('it-IT')} (${diffPct}%)`);

    await db.update(operations)
      .set({ animalCount: misura.expected_animal_count })
      .where(eq(operations.id, misura.id));

    console.log(`   ✅ MISURA #${misura.id} corretta`);
    totalCorrected++;

    corrections.push({
      type: 'MISURA',
      id: misura.id,
      flupsy: misura.flupsy_name,
      basket: misura.basket_number,
      cycle: misura.cycle_id,
      date: misura.date,
      old_value: misura.current_animal_count,
      new_value: misura.expected_animal_count,
      diff: diff
    });

    const downstreamResult = await db.execute(sql`
      SELECT 
        id,
        basket_id,
        cycle_id,
        date::text,
        type,
        animal_count
      FROM operations
      WHERE basket_id = ${misura.basket_id}
        AND cycle_id = ${misura.cycle_id}
        AND date > ${misura.date}::date
        AND cancelled_at IS NULL
      ORDER BY date, id
    `);

    const downstreamOps = downstreamResult.rows as any[];

    if (downstreamOps.length > 0) {
      console.log(`   📥 Propagazione a ${downstreamOps.length} operazioni successive...`);

      let previousCount = misura.expected_animal_count;

      for (const downstream of downstreamOps) {
        const oldCount = downstream.animal_count;
        
        if (downstream.type === 'misura') {
          const downMortResult = await db.execute(sql`
            SELECT mortality_rate FROM operations WHERE id = ${downstream.id}
          `);
          const downMort = (downMortResult.rows[0] as any)?.mortality_rate || 0;
          const newCount = Math.round(previousCount * (100 - downMort) / 100);
          
          await db.update(operations)
            .set({ animalCount: newCount })
            .where(eq(operations.id, downstream.id));

          console.log(`      → Op #${downstream.id} (${downstream.type}): ${oldCount.toLocaleString('it-IT')} → ${newCount.toLocaleString('it-IT')}`);
          
          corrections.push({
            type: 'PROPAGATA',
            id: downstream.id,
            flupsy: misura.flupsy_name,
            basket: misura.basket_number,
            cycle: misura.cycle_id,
            date: downstream.date,
            old_value: oldCount,
            new_value: newCount,
            diff: oldCount - newCount
          });

          previousCount = newCount;
          totalPropagated++;
        } else if (downstream.type === 'peso') {
          await db.update(operations)
            .set({ animalCount: previousCount })
            .where(eq(operations.id, downstream.id));

          console.log(`      → Op #${downstream.id} (${downstream.type}): ${oldCount.toLocaleString('it-IT')} → ${previousCount.toLocaleString('it-IT')}`);
          
          corrections.push({
            type: 'PROPAGATA',
            id: downstream.id,
            flupsy: misura.flupsy_name,
            basket: misura.basket_number,
            cycle: misura.cycle_id,
            date: downstream.date,
            old_value: oldCount,
            new_value: previousCount,
            diff: oldCount - previousCount
          });

          totalPropagated++;
        }
      }
    }
  }

  console.log("\n" + "=" .repeat(60));
  console.log("📊 RIEPILOGO CORREZIONI");
  console.log("=" .repeat(60));
  console.log(`   Operazioni MISURA corrette: ${totalCorrected}`);
  console.log(`   Operazioni successive propagate: ${totalPropagated}`);
  console.log(`   Totale modifiche: ${totalCorrected + totalPropagated}`);
  console.log("");

  console.log("📋 DETTAGLIO CORREZIONI:");
  console.log("-" .repeat(60));
  for (const c of corrections) {
    console.log(`   [${c.type}] Op #${c.id} - ${c.flupsy} Cesta ${c.basket}: ${c.old_value.toLocaleString('it-IT')} → ${c.new_value.toLocaleString('it-IT')} (diff: ${c.diff.toLocaleString('it-IT')})`);
  }

  console.log("\n✅ CORREZIONE COMPLETATA CON SUCCESSO");
  
  return { corrected: totalCorrected, propagated: totalPropagated, corrections };
}

fixMisuraOperations()
  .then(result => {
    console.log(`\n📁 RISULTATO FINALE`);
    console.log(`   MISURA corrette: ${result.corrected}`);
    console.log(`   Propagate: ${result.propagated}`);
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Errore durante la correzione:", err);
    process.exit(1);
  });
