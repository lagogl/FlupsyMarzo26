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

// Helper per query dirette SQL (quando serve)
export async function queryEsterno(sql: string, params: any[] = []): Promise<any[]> {
  if (!poolEsterno) {
    throw new Error('Database esterno non configurato');
  }
  
  const result = await poolEsterno.query(sql, params);
  return result.rows;
}
