import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schemaEsterno from './schema-esterno';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL_ESTERNO) {
  console.warn(
    "⚠️ DATABASE_URL_ESTERNO non configurato. Modulo ordini condivisi disabilitato.",
  );
}

// Pool per database esterno (solo se configurato)
export const poolEsterno = process.env.DATABASE_URL_ESTERNO 
  ? new Pool({ connectionString: process.env.DATABASE_URL_ESTERNO })
  : null;

export const dbEsterno = poolEsterno 
  ? drizzle({ client: poolEsterno, schema: schemaEsterno })
  : null;

// Helper per verificare se il DB esterno è disponibile
export function isDbEsternoAvailable(): boolean {
  return dbEsterno !== null;
}

// Helper per query dirette SQL (quando serve) con retry automatico
export async function queryEsterno(sql: string, params: any[] = [], maxRetries: number = 3): Promise<any[]> {
  if (!poolEsterno) {
    throw new Error('Database esterno non configurato');
  }
  
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await poolEsterno.query(sql, params);
      return result.rows;
    } catch (error: any) {
      lastError = error;
      
      // Errori di connessione che richiedono retry
      const isConnectionError = 
        error.code === '57P01' || // terminating connection
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.message?.includes('connection') ||
        error.message?.includes('timeout');
      
      if (isConnectionError && attempt < maxRetries) {
        console.log(`🔄 Tentativo ${attempt}/${maxRetries} fallito, riprovo tra ${attempt * 500}ms...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 500)); // Exponential backoff
        continue;
      }
      
      // Se non è un errore di connessione o abbiamo esaurito i tentativi, rilancia
      throw error;
    }
  }
  
  throw lastError;
}
