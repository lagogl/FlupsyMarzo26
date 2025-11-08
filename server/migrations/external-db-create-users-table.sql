-- ========================================
-- MIGRATION: Creazione Tabella external_users
-- Database: Database Esterno (Condiviso)
-- Data: 2025-11-08
-- Descrizione: Tabella per autenticazione operatori sincronizzati da Delta Futuro
-- ========================================

-- Elimina tabella se esiste (SOLO PER SVILUPPO - RIMUOVERE IN PRODUZIONE)
-- DROP TABLE IF EXISTS external_users CASCADE;

-- Creazione tabella external_users
CREATE TABLE IF NOT EXISTS external_users (
  -- ========== CHIAVI PRIMARIE E RIFERIMENTI ==========
  id SERIAL PRIMARY KEY,
  delta_operator_id INTEGER UNIQUE NOT NULL,  -- FK virtuale a task_operators(id) in Delta Futuro
  
  -- ========== AUTENTICAZIONE ==========
  username VARCHAR(100) UNIQUE NOT NULL,      -- Email o codice operatore
  hashed_password TEXT NOT NULL,              -- Hash bcrypt della password
  temp_password_token VARCHAR(255),           -- Token per primo accesso (nullable)
  temp_password_expires_at TIMESTAMP,         -- Scadenza token temporaneo
  
  -- ========== DATI ANAGRAFICI (MIRROR DA DELTA FUTURO) ==========
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,                                  -- Es: 'operatore', 'supervisore', 'tecnico'
  
  -- ========== STATO E SINCRONIZZAZIONE ==========
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_sync_at TIMESTAMP NOT NULL DEFAULT NOW(),
  sync_version INTEGER NOT NULL DEFAULT 1,    -- Versione per gestione conflitti
  
  -- ========== METADATA ==========
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP,
  
  -- ========== CONSTRAINTS ==========
  CONSTRAINT chk_email_format CHECK (
    email IS NULL OR 
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  ),
  CONSTRAINT chk_username_not_empty CHECK (LENGTH(TRIM(username)) > 0),
  CONSTRAINT chk_password_not_empty CHECK (LENGTH(hashed_password) > 0)
);

-- ========== INDICI PER PERFORMANCE ==========
CREATE INDEX IF NOT EXISTS idx_external_users_delta_operator 
  ON external_users(delta_operator_id);

CREATE INDEX IF NOT EXISTS idx_external_users_email 
  ON external_users(email) 
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_external_users_active 
  ON external_users(is_active);

CREATE INDEX IF NOT EXISTS idx_external_users_username 
  ON external_users(username);

CREATE INDEX IF NOT EXISTS idx_external_users_sync_version 
  ON external_users(delta_operator_id, sync_version);

-- ========== COMMENTI ==========
COMMENT ON TABLE external_users IS 
  'Operatori sincronizzati da Delta Futuro per autenticazione app esterna';

COMMENT ON COLUMN external_users.id IS 
  'Chiave primaria locale (auto-incrementale)';

COMMENT ON COLUMN external_users.delta_operator_id IS 
  'ID operatore nel database Delta Futuro (task_operators.id) - UNIQUE';

COMMENT ON COLUMN external_users.username IS 
  'Username per login (tipicamente email operatore) - UNIQUE';

COMMENT ON COLUMN external_users.hashed_password IS 
  'Password hash bcrypt (iniziale da Delta, modificabile da operatore)';

COMMENT ON COLUMN external_users.temp_password_token IS 
  'Token password temporanea per primo accesso - NULL dopo cambio password';

COMMENT ON COLUMN external_users.temp_password_expires_at IS 
  'Scadenza token temporaneo (opzionale)';

COMMENT ON COLUMN external_users.sync_version IS 
  'Versione incrementale per gestione conflitti di sincronizzazione';

COMMENT ON COLUMN external_users.is_active IS 
  'Operatore attivo (true) o disattivato (false) - sincronizzato da Delta';

COMMENT ON COLUMN external_users.last_sync_at IS 
  'Timestamp ultima sincronizzazione da Delta Futuro';

-- ========== TRIGGER PER UPDATED_AT ==========
CREATE OR REPLACE FUNCTION update_external_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_external_users_updated_at
  BEFORE UPDATE ON external_users
  FOR EACH ROW
  EXECUTE FUNCTION update_external_users_updated_at();

-- ========== DATI DI TEST (OPZIONALE - RIMUOVERE IN PRODUZIONE) ==========
-- Operatore di test con password "Test123!"
-- INSERT INTO external_users (
--   delta_operator_id, username, hashed_password, 
--   first_name, last_name, email, phone, role, is_active
-- ) VALUES (
--   999,
--   'test.operator@example.com',
--   '$2b$10$rOJ9KZKz7QFzVz7Zp4vZ.eJ0Jx0Z8Z0Z8Z0Z8Z0Z8Z0Z8Z0Z8Z0Z8',
--   'Test',
--   'Operator',
--   'test.operator@example.com',
--   '+39333999999',
--   'operatore',
--   true
-- );

-- ========== GRANT PERMISSIONS (CONFIGURARE SECONDO NECESSITÀ) ==========
-- GRANT SELECT, INSERT, UPDATE ON external_users TO app_esterna_user;
-- GRANT USAGE, SELECT ON SEQUENCE external_users_id_seq TO app_esterna_user;

-- ========== VERIFICA CREAZIONE ==========
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'external_users'
  ) THEN
    RAISE NOTICE '✅ Tabella external_users creata con successo';
  ELSE
    RAISE EXCEPTION '❌ Errore: Tabella external_users non creata';
  END IF;
END $$;
