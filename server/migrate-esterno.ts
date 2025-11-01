import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL_ESTERNO;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL_ESTERNO non configurato');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  
  try {
    console.log('🔄 Connessione al database esterno...');
    
    // Leggi il file SQL
    const sqlPath = join(process.cwd(), 'sql', 'add-cancellato-field.sql');
    const sql = readFileSync(sqlPath, 'utf-8');
    
    console.log('📝 Esecuzione migrazione...');
    const result = await pool.query(sql);
    
    console.log('✅ Migrazione completata con successo!');
    console.log('📊 Risultato:', result.rows);
    
  } catch (error: any) {
    console.error('❌ Errore durante la migrazione:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
