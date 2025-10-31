-- ============================================
-- SETUP DATABASE ESTERNO - ORDINI CONDIVISI
-- ============================================
-- Esegui questo script sul database dell'app esterna per prepararlo
-- alla gestione ordini condivisi tra Delta Futuro e app esterna

-- ============================================
-- 1. CREA O MODIFICA TABELLA ORDINI
-- ============================================

-- Crea tabella ordini se non esiste
CREATE TABLE IF NOT EXISTS ordini (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(50) NOT NULL,
  data DATE NOT NULL,
  cliente_id INTEGER,
  cliente_nome TEXT NOT NULL,
  stato VARCHAR(50) NOT NULL DEFAULT 'Aperto',
  note TEXT,
  totale DECIMAL(10,2) DEFAULT 0,
  fatture_in_cloud_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Aggiungi colonne per range di consegna (se non esistono)
ALTER TABLE ordini 
  ADD COLUMN IF NOT EXISTS data_consegna DATE,
  ADD COLUMN IF NOT EXISTS data_inizio_consegna DATE,
  ADD COLUMN IF NOT EXISTS data_fine_consegna DATE;

-- Aggiungi colonne per gestione quantità e taglia a livello ordine
ALTER TABLE ordini
  ADD COLUMN IF NOT EXISTS quantita_totale INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS taglia_richiesta TEXT NOT NULL DEFAULT '';

-- Aggiungi colonne per sincronizzazione Fatture in Cloud
ALTER TABLE ordini
  ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'locale',
  ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS sync_error TEXT,
  ADD COLUMN IF NOT EXISTS url_documento TEXT;

-- Aggiungi company_id se non esiste
ALTER TABLE ordini
  ADD COLUMN IF NOT EXISTS company_id INTEGER;

-- Assicurati che fatture_in_cloud_id sia unique
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

-- Commento sugli stati supportati
COMMENT ON COLUMN ordini.stato IS 'Stati: Aperto | In Lavorazione | Parziale | Completato | Annullato';

-- ============================================
-- 2. CREA O MODIFICA TABELLA ORDINI_DETTAGLI
-- ============================================

-- Rinomina ordini_righe in ordini_dettagli (se necessario)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ordini_righe') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ordini_dettagli') THEN
    ALTER TABLE ordini_righe RENAME TO ordini_dettagli;
  END IF;
END $$;

-- Crea tabella ordini_dettagli se non esiste
CREATE TABLE IF NOT EXISTS ordini_dettagli (
  id SERIAL PRIMARY KEY,
  ordine_id INTEGER NOT NULL,
  riga_numero INTEGER NOT NULL DEFAULT 1,
  codice_prodotto VARCHAR(100),
  taglia VARCHAR(50) NOT NULL DEFAULT '',
  descrizione TEXT,
  quantita DECIMAL(10,2) NOT NULL,
  unita_misura TEXT DEFAULT 'NR',
  prezzo_unitario DECIMAL(10,4) NOT NULL DEFAULT 0,
  sconto DECIMAL(10,2) DEFAULT 0,
  importo_riga DECIMAL(10,2) DEFAULT 0,
  fic_item_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Aggiungi colonne mancanti (se esistono già, vengono saltate)
ALTER TABLE ordini_dettagli
  ADD COLUMN IF NOT EXISTS riga_numero INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS taglia VARCHAR(50) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS fic_item_id INTEGER;

-- Rinomina colonne per compatibilità (gestisce errore se già rinominate)
DO $$ 
BEGIN
  -- Rinomina codice -> codice_prodotto
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='ordini_dettagli' AND column_name='codice') THEN
    ALTER TABLE ordini_dettagli RENAME COLUMN codice TO codice_prodotto;
  END IF;
  
  -- Rinomina nome -> descrizione (se nome esiste e descrizione no)
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='ordini_dettagli' AND column_name='nome') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name='ordini_dettagli' AND column_name='descrizione') THEN
    ALTER TABLE ordini_dettagli RENAME COLUMN nome TO descrizione;
  END IF;
  
  -- Rinomina totale -> importo_riga
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='ordini_dettagli' AND column_name='totale') THEN
    ALTER TABLE ordini_dettagli RENAME COLUMN totale TO importo_riga;
  END IF;
END $$;

-- Modifica prezzo_unitario per supportare 4 decimali (se già esiste)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='ordini_dettagli' AND column_name='prezzo_unitario') THEN
    ALTER TABLE ordini_dettagli ALTER COLUMN prezzo_unitario TYPE DECIMAL(10,4);
  END IF;
END $$;

-- Aggiungi CASCADE delete (IMPORTANTE per eliminazione ordini)
DO $$
BEGIN
  -- Drop vecchio constraint se esiste
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ordini_dettagli_ordine_id_fkey') THEN
    ALTER TABLE ordini_dettagli DROP CONSTRAINT ordini_dettagli_ordine_id_fkey;
  END IF;
  
  -- Aggiungi nuovo constraint con CASCADE
  ALTER TABLE ordini_dettagli
    ADD CONSTRAINT ordini_dettagli_ordine_id_fkey 
      FOREIGN KEY (ordine_id) 
      REFERENCES ordini(id) 
      ON DELETE CASCADE;
END $$;

-- ============================================
-- 3. CREA TABELLA CONSEGNE CONDIVISE
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
COMMENT ON COLUMN consegne_condivise.app_origine IS 'Origine: delta_futuro | app_esterna';

-- ============================================
-- 4. CREA VISTA ORDINI CON RESIDUO
-- ============================================

-- Drop vista se esiste (per ricrearla)
DROP VIEW IF EXISTS ordini_con_residuo;

CREATE VIEW ordini_con_residuo AS
SELECT 
  o.id,
  o.numero,
  o.data,
  o.cliente_id,
  o.cliente_nome,
  o.stato,
  o.quantita_totale,
  o.taglia_richiesta,
  o.data_inizio_consegna,
  o.data_fine_consegna,
  o.fatture_in_cloud_id,
  o.sync_status,
  COALESCE(SUM(c.quantita_consegnata), 0)::INTEGER as quantita_consegnata,
  (o.quantita_totale - COALESCE(SUM(c.quantita_consegnata), 0))::INTEGER as quantita_residua,
  CASE 
    WHEN COALESCE(SUM(c.quantita_consegnata), 0) = 0 THEN 'Aperto'
    WHEN COALESCE(SUM(c.quantita_consegnata), 0) >= o.quantita_totale THEN 'Completato'
    ELSE 'Parziale'
  END as stato_calcolato
FROM ordini o
LEFT JOIN consegne_condivise c ON c.ordine_id = o.id
GROUP BY 
  o.id, o.numero, o.data, o.cliente_id, o.cliente_nome, 
  o.stato, o.quantita_totale, o.taglia_richiesta,
  o.data_inizio_consegna, o.data_fine_consegna,
  o.fatture_in_cloud_id, o.sync_status;

COMMENT ON VIEW ordini_con_residuo IS 'Vista con calcolo automatico quantità consegnata e residua';

-- ============================================
-- 5. MIGRAZIONE DATI ESISTENTI
-- ============================================

-- Popola quantita_totale e taglia_richiesta da ordini_dettagli (se vuoti)
UPDATE ordini o
SET 
  quantita_totale = COALESCE((
    SELECT SUM(CAST(d.quantita AS INTEGER))
    FROM ordini_dettagli d
    WHERE d.ordine_id = o.id
  ), 0),
  taglia_richiesta = COALESCE((
    SELECT d.taglia
    FROM ordini_dettagli d
    WHERE d.ordine_id = o.id
    ORDER BY d.riga_numero
    LIMIT 1
  ), '')
WHERE o.quantita_totale = 0 OR o.taglia_richiesta = '';

-- Imposta sync_status di default per ordini esistenti
UPDATE ordini
SET sync_status = 'sincronizzato'
WHERE sync_status IS NULL AND fatture_in_cloud_id IS NOT NULL;

UPDATE ordini
SET sync_status = 'locale'
WHERE sync_status IS NULL;

-- ============================================
-- 6. INDICI PER PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_ordini_cliente_id ON ordini(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ordini_stato ON ordini(stato);
CREATE INDEX IF NOT EXISTS idx_ordini_data_inizio_consegna ON ordini(data_inizio_consegna);
CREATE INDEX IF NOT EXISTS idx_ordini_fatture_in_cloud_id ON ordini(fatture_in_cloud_id);
CREATE INDEX IF NOT EXISTS idx_ordini_sync_status ON ordini(sync_status);

CREATE INDEX IF NOT EXISTS idx_ordini_dettagli_ordine_id ON ordini_dettagli(ordine_id);
CREATE INDEX IF NOT EXISTS idx_ordini_dettagli_taglia ON ordini_dettagli(taglia);

CREATE INDEX IF NOT EXISTS idx_consegne_ordine_id ON consegne_condivise(ordine_id);
CREATE INDEX IF NOT EXISTS idx_consegne_data_consegna ON consegne_condivise(data_consegna);
CREATE INDEX IF NOT EXISTS idx_consegne_app_origine ON consegne_condivise(app_origine);

-- ============================================
-- 7. VERIFICA FINALE
-- ============================================

-- Conta record nelle tabelle
SELECT 
  '✅ Setup completato!' as messaggio,
  (SELECT COUNT(*) FROM ordini) as totale_ordini,
  (SELECT COUNT(*) FROM ordini_dettagli) as totale_dettagli,
  (SELECT COUNT(*) FROM consegne_condivise) as totale_consegne;

-- Mostra esempio vista (se ci sono ordini)
SELECT 'Preview ordini_con_residuo:' as info;
SELECT * FROM ordini_con_residuo LIMIT 5;
