-- ============================================
-- SETUP COMPLETO DATABASE ESTERNO - ORDINI CONDIVISI
-- ============================================
-- Script definitivo per preparare il database esterno alla condivisione
-- ordini e consegne con Delta Futuro
--
-- PREREQUISITI:
-- - Tabelle 'ordini' e 'ordini_dettagli' devono già esistere
-- - PostgreSQL 12 o superiore

-- ============================================
-- 1. AGGIUNGI COLONNE A TABELLA ORDINI
-- ============================================

-- Colonne base per gestione ordini
ALTER TABLE ordini 
  ADD COLUMN IF NOT EXISTS numero INTEGER,
  ADD COLUMN IF NOT EXISTS cliente_nome TEXT,
  ADD COLUMN IF NOT EXISTS totale NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valuta TEXT DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS note TEXT;

-- Colonne per range di consegna
ALTER TABLE ordini 
  ADD COLUMN IF NOT EXISTS data_inizio_consegna DATE,
  ADD COLUMN IF NOT EXISTS data_fine_consegna DATE;

-- Colonne per quantità e taglia a livello ordine
ALTER TABLE ordini
  ADD COLUMN IF NOT EXISTS quantita_totale INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS taglia_richiesta TEXT DEFAULT '';

-- Colonne per sincronizzazione Fatture in Cloud
ALTER TABLE ordini
  ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'locale',
  ADD COLUMN IF NOT EXISTS fatture_in_cloud_id INTEGER,
  ADD COLUMN IF NOT EXISTS fatture_in_cloud_numero VARCHAR(50),
  ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS sync_error TEXT,
  ADD COLUMN IF NOT EXISTS url_documento TEXT,
  ADD COLUMN IF NOT EXISTS company_id INTEGER;

-- Colonne di tracking temporale
ALTER TABLE ordini
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

-- ============================================
-- 2. AGGIUNGI COLONNE A TABELLA ORDINI_DETTAGLI
-- ============================================

-- Colonne necessarie per righe ordini
ALTER TABLE ordini_dettagli
  ADD COLUMN IF NOT EXISTS riga_numero INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS codice_prodotto VARCHAR(100),
  ADD COLUMN IF NOT EXISTS taglia VARCHAR(50) DEFAULT '',
  ADD COLUMN IF NOT EXISTS descrizione TEXT,
  ADD COLUMN IF NOT EXISTS quantita NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS unita_misura TEXT DEFAULT 'NR',
  ADD COLUMN IF NOT EXISTS prezzo_unitario NUMERIC(10,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sconto NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS importo_riga NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fic_item_id INTEGER,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Aggiungi ordine_id se non esiste (foreign key)
ALTER TABLE ordini_dettagli
  ADD COLUMN IF NOT EXISTS ordine_id INTEGER;

-- ============================================
-- 3. INDICI E VINCOLI
-- ============================================

-- Unique constraint su fatture_in_cloud_id (se non esiste)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ordini_fatture_in_cloud_id_unique'
  ) THEN
    ALTER TABLE ordini
      ADD CONSTRAINT ordini_fatture_in_cloud_id_unique 
      UNIQUE (fatture_in_cloud_id);
  END IF;
END $$;

-- Foreign key ordini_dettagli -> ordini (se non esiste)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ordini_dettagli_ordine_id_fkey'
  ) THEN
    ALTER TABLE ordini_dettagli
      ADD CONSTRAINT ordini_dettagli_ordine_id_fkey 
      FOREIGN KEY (ordine_id) REFERENCES ordini(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Rimuovi vincolo foreign key su cliente_id se esiste (causa problemi sync)
ALTER TABLE ordini DROP CONSTRAINT IF EXISTS fk_cliente;

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_ordini_fatture_in_cloud_id ON ordini(fatture_in_cloud_id);
CREATE INDEX IF NOT EXISTS idx_ordini_sync_status ON ordini(sync_status);
CREATE INDEX IF NOT EXISTS idx_ordini_data_inizio_consegna ON ordini(data_inizio_consegna);
CREATE INDEX IF NOT EXISTS idx_ordini_cliente_id ON ordini(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ordini_data ON ordini(data);

CREATE INDEX IF NOT EXISTS idx_ordini_dettagli_ordine_id ON ordini_dettagli(ordine_id);
CREATE INDEX IF NOT EXISTS idx_ordini_dettagli_taglia ON ordini_dettagli(taglia);
CREATE INDEX IF NOT EXISTS idx_ordini_dettagli_codice_prodotto ON ordini_dettagli(codice_prodotto);

-- ============================================
-- 4. CREA TABELLA CONSEGNE CONDIVISE (se non esiste)
-- ============================================

CREATE TABLE IF NOT EXISTS consegne_condivise (
  id SERIAL PRIMARY KEY,
  ordine_id INTEGER NOT NULL REFERENCES ordini(id) ON DELETE RESTRICT,
  data_consegna DATE NOT NULL,
  quantita_consegnata INTEGER NOT NULL,
  app_origine VARCHAR(50) NOT NULL, -- 'delta_futuro' o 'app_esterna'
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE consegne_condivise IS 'Consegne parziali condivise tra Delta Futuro e app esterna';
COMMENT ON COLUMN consegne_condivise.app_origine IS 'Origine consegna: delta_futuro | app_esterna';

-- Indici consegne
CREATE INDEX IF NOT EXISTS idx_consegne_ordine_id ON consegne_condivise(ordine_id);
CREATE INDEX IF NOT EXISTS idx_consegne_data_consegna ON consegne_condivise(data_consegna);
CREATE INDEX IF NOT EXISTS idx_consegne_app_origine ON consegne_condivise(app_origine);

-- ============================================
-- 5. CREA VISTA ORDINI CON RESIDUO
-- ============================================

DROP VIEW IF EXISTS ordini_con_residuo;

CREATE VIEW ordini_con_residuo AS
SELECT 
  o.id,
  COALESCE(o.fatture_in_cloud_numero, o.numero::text, '') as numero,
  o.data,
  o.cliente_id,
  COALESCE(c.denominazione, o.cliente_nome, '') as cliente_nome,
  o.stato,
  o.quantita_totale,
  o.taglia_richiesta,
  o.data_inizio_consegna,
  o.data_fine_consegna,
  o.fatture_in_cloud_id,
  o.sync_status,
  COALESCE(SUM(cc.quantita_consegnata), 0)::INTEGER as quantita_consegnata,
  (COALESCE(o.quantita_totale, 0) - COALESCE(SUM(cc.quantita_consegnata), 0))::INTEGER as quantita_residua,
  CASE 
    WHEN COALESCE(SUM(cc.quantita_consegnata), 0) = 0 THEN 'Aperto'
    WHEN COALESCE(SUM(cc.quantita_consegnata), 0) >= COALESCE(o.quantita_totale, 0) THEN 'Completato'
    ELSE 'Parziale'
  END as stato_calcolato
FROM ordini o
LEFT JOIN clienti c ON c.id = o.cliente_id
LEFT JOIN consegne_condivise cc ON cc.ordine_id = o.id
GROUP BY 
  o.id, o.fatture_in_cloud_numero, o.numero, o.data, o.cliente_id, 
  c.denominazione, o.cliente_nome, o.stato, o.quantita_totale, o.taglia_richiesta,
  o.data_inizio_consegna, o.data_fine_consegna,
  o.fatture_in_cloud_id, o.sync_status;

COMMENT ON VIEW ordini_con_residuo IS 'Vista con calcolo automatico quantità consegnata e residua per ordini condivisi';

-- ============================================
-- 6. COMMENTI SULLE COLONNE
-- ============================================

COMMENT ON COLUMN ordini.numero IS 'Numero progressivo ordine (può essere NULL per ordini locali)';
COMMENT ON COLUMN ordini.cliente_nome IS 'Nome cliente (denormalizzato per performance)';
COMMENT ON COLUMN ordini.totale IS 'Importo totale ordine in EUR';
COMMENT ON COLUMN ordini.valuta IS 'Valuta (default EUR)';
COMMENT ON COLUMN ordini.quantita_totale IS 'Totale animali ordinati (somma righe)';
COMMENT ON COLUMN ordini.taglia_richiesta IS 'Taglie richieste separate da virgola (es: TP-2000, TP-3000)';
COMMENT ON COLUMN ordini.sync_status IS 'Stato sincronizzazione: locale | in_sync | sincronizzato | errore';
COMMENT ON COLUMN ordini.fatture_in_cloud_id IS 'ID ordine in Fatture in Cloud (NULL per ordini locali)';

COMMENT ON COLUMN ordini_dettagli.unita_misura IS 'Unità di misura (default: NR = numero)';
COMMENT ON COLUMN ordini_dettagli.taglia IS 'Taglia prodotto (es: TP-2000, TP-3000)';
COMMENT ON COLUMN ordini_dettagli.fic_item_id IS 'ID riga in Fatture in Cloud';

-- ============================================
-- 7. VERIFICA FINALE
-- ============================================

SELECT '✅ Setup completato con successo!' as messaggio;

SELECT 'Colonne tabella ORDINI:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'ordini' 
ORDER BY ordinal_position;

SELECT 'Colonne tabella ORDINI_DETTAGLI:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'ordini_dettagli' 
ORDER BY ordinal_position;

SELECT 'Tabelle create:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('ordini', 'ordini_dettagli', 'consegne_condivise')
ORDER BY table_name;

SELECT 'Vista ordini_con_residuo:' as info;
SELECT COUNT(*) as totale_ordini_visibili FROM ordini_con_residuo;

-- Fine script
