// File server/debug-db.ts
// Script di diagnostica per verificare la connessione al database

import { pool, db } from './db';
import { operations, flupsys, baskets } from '../shared/schema';
import { sql } from 'drizzle-orm';

export interface DatabaseDiagnosticDependencies {
  pool: {
    query(query: string): Promise<unknown>;
  };
  db: {
    execute(query: unknown): Promise<unknown>;
    select(selection: unknown): {
      from(table: unknown): Promise<Array<{ count: unknown }>>;
    };
  };
}

/**
 * Verifica la connessione e l'accesso alle tabelle usando esclusivamente query
 * read-only, così la diagnostica è sicura anche se il processo si interrompe.
 */
export async function testDatabaseConnection(
  dependencies?: DatabaseDiagnosticDependencies,
) {
  const { pool: diagnosticPool, db: diagnosticDb } = dependencies ??
    ({ pool, db } as unknown as DatabaseDiagnosticDependencies);
  console.log("===== AVVIO TEST DIAGNOSTICI DATABASE =====");
  
  try {
    // 1. Test Connessione Base
    console.log("Test 1: Connessione diretta con pool...");
    const connectionResult = await diagnosticPool.query('SELECT 1 as test');
    console.log("Risultato test connessione diretta:", connectionResult);
    
    // 2. Test Query Semplice con drizzle
    console.log("Test 2: Query semplice con drizzle...");
    const drizzleResult = await diagnosticDb.execute(sql`SELECT current_database(), current_user`);
    console.log("Risultato test drizzle:", drizzleResult);
    
    // 3. Test Lettura Tabella con drizzle
    console.log("Test 3: Conteggio righe nelle tabelle principali...");
    
    const flupsyCount = await diagnosticDb.select({ count: sql`count(*)` }).from(flupsys);
    console.log(`- Tabella flupsys: ${flupsyCount[0].count} righe`);
    
    const basketsCount = await diagnosticDb.select({ count: sql`count(*)` }).from(baskets);
    console.log(`- Tabella baskets: ${basketsCount[0].count} righe`);
    
    const operationsCount = await diagnosticDb.select({ count: sql`count(*)` }).from(operations);
    console.log(`- Tabella operations: ${operationsCount[0].count} righe`);
    
    console.log("===== DIAGNOSTICA DATABASE COMPLETATA CON SUCCESSO =====");
    return true;
  } catch (error) {
    console.error("===== ERRORE DURANTE I TEST DIAGNOSTICI DEL DATABASE =====");
    console.error("Dettagli errore:", error);
    console.error("Stack trace:", (error as Error).stack);
    return false;
  }
}