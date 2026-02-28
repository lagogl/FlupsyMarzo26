/**
 * rollback-transfer.ts
 *
 * Annulla atomicamente un trasferimento ciclo dato l'ID dell'operazione sorgente.
 *
 * Uso:
 *   npx tsx scripts/rollback-transfer.ts <sourceOperationId>
 *
 * Esempio:
 *   npx tsx scripts/rollback-transfer.ts 612
 */

import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function rollbackTransfer(sourceOpId: number) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Leggi operazione sorgente
    const srcRes = await client.query(
      `SELECT id, basket_id, cycle_id, type, date, lot_id, cancelled_at
       FROM operations WHERE id = $1`,
      [sourceOpId]
    );
    if (srcRes.rowCount === 0) throw new Error(`Operazione ${sourceOpId} non trovata`);
    const src = srcRes.rows[0];
    if (src.cancelled_at) throw new Error(`Operazione ${sourceOpId} è già cancellata`);
    if (src.type !== "trasferimento") throw new Error(`Operazione ${sourceOpId} non è di tipo 'trasferimento' (tipo: ${src.type})`);

    console.log(`\nOperazione sorgente trovata:`);
    console.log(`  ID: ${src.id} | Cesta: ${src.basket_id} | Ciclo: ${src.cycle_id} | Data: ${src.date}`);

    // 2. Trova le prima-attivazione collegate tramite lot_ledger transfer_in
    const transferInsRes = await client.query(
      `SELECT ll.basket_id, ll.dest_cycle_id, ll.operation_id
       FROM lot_ledger ll
       WHERE ll.idempotency_key LIKE $1
         AND ll.type = 'transfer_in'`,
      [`transfer_in_${sourceOpId}_%`]
    );
    console.log(`\nDestinazioni trovate: ${transferInsRes.rowCount}`);

    for (const row of transferInsRes.rows) {
      const { basket_id, dest_cycle_id, operation_id } = row;

      // 2a. Cancella operazione prima-attivazione destinazione
      if (operation_id) {
        await client.query(
          `UPDATE operations SET cancelled_at = NOW(), notes = CONCAT(notes, ' | ANNULLATO DA ROLLBACK SCRIPT') WHERE id = $1`,
          [operation_id]
        );
        console.log(`  ✓ Cancellata operazione prima-attivazione ${operation_id} su cesta ${basket_id}`);
      }

      // 2b. Chiudi ciclo destinazione
      if (dest_cycle_id) {
        await client.query(
          `UPDATE cycles SET state = 'closed', end_date = NOW()::date WHERE id = $1`,
          [dest_cycle_id]
        );
        console.log(`  ✓ Chiuso ciclo ${dest_cycle_id}`);
      }

      // 2c. Libera cesta destinazione
      await client.query(
        `UPDATE baskets SET state = 'available', current_cycle_id = NULL, cycle_code = NULL WHERE id = $1`,
        [basket_id]
      );
      console.log(`  ✓ Cesta ${basket_id} riportata a disponibile`);

      // 2d. Cancella record lot_ledger transfer_in
      await client.query(
        `DELETE FROM lot_ledger WHERE idempotency_key = $1`,
        [`transfer_in_${sourceOpId}_${src.lot_id}_${basket_id}`]
      );
    }

    // 3. Cancella lot_ledger transfer_out
    await client.query(
      `DELETE FROM lot_ledger WHERE idempotency_key = $1`,
      [`transfer_out_${sourceOpId}_${src.lot_id}_${src.basket_id}`]
    );
    console.log(`\n  ✓ Rimosso record lot_ledger transfer_out`);

    // 4. Cancella operazione sorgente
    await client.query(
      `UPDATE operations SET cancelled_at = NOW(), notes = CONCAT(notes, ' | ANNULLATO DA ROLLBACK SCRIPT') WHERE id = $1`,
      [sourceOpId]
    );
    console.log(`  ✓ Cancellata operazione sorgente ${sourceOpId}`);

    // 5. Se il ciclo sorgente è stato chiuso (trasferimento totale): riapri ciclo e ripristina cesta
    const cycleRes = await client.query(
      `SELECT id, state, basket_id FROM cycles WHERE id = $1`,
      [src.cycle_id]
    );
    if (cycleRes.rowCount && cycleRes.rows[0].state === "closed") {
      await client.query(
        `UPDATE cycles SET state = 'active', end_date = NULL WHERE id = $1`,
        [src.cycle_id]
      );

      // Rigenera cycle_code dal ciclo
      const basketRes = await client.query(
        `SELECT b.physical_number, b.flupsy_id FROM baskets b WHERE b.id = $1`,
        [src.basket_id]
      );
      const b = basketRes.rows[0];
      const d = new Date(src.date);
      const yy = d.getFullYear().toString().slice(-2);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const cycleCode = `${b.physical_number}-${b.flupsy_id}-${yy}${mm}`;

      await client.query(
        `UPDATE baskets SET state = 'active', current_cycle_id = $1, cycle_code = $2 WHERE id = $3`,
        [src.cycle_id, cycleCode, src.basket_id]
      );
      console.log(`  ✓ Ciclo sorgente ${src.cycle_id} riaperto, cesta ${src.basket_id} riattivata (code: ${cycleCode})`);
    }

    await client.query("COMMIT");
    console.log(`\n✅ ROLLBACK COMPLETATO — trasferimento ${sourceOpId} annullato con successo.\n`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`\n❌ ROLLBACK FALLITO — nessuna modifica applicata.`);
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

const arg = process.argv[2];
if (!arg || isNaN(Number(arg))) {
  console.error("Uso: npx tsx scripts/rollback-transfer.ts <sourceOperationId>");
  process.exit(1);
}

rollbackTransfer(Number(arg));
