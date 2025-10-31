-- ============================================
-- SETUP DATABASE ESTERNO - ORDINI CONDIVISI
-- ============================================
-- Script per preparare il database dell'app esterna alla condivisione
-- ordini e consegne con Delta Futuro
--
-- PREREQUISITI:
-- - Tabelle 'ordini' e 'ordini_dettagli' devono già esistere
-- - Questo script SOLO aggiunge colonne necessarie e crea consegne_condivise

-- ============================================
-- 1. AGGIUNGI COLONNE A TABELLA ORDINI ESISTENTE
-- ============================================

-- Verifica che la tabella ordini esista
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ordini') THEN
    RAISE EXCEPTION 'Tabella "ordini" non trovata! Questo script richiede che la tabella ordini esista già.';
  END IF;
END $$;

-- Aggiungi colonne per range di consegna (se non esistono)
ALTER TABLE ordini 
  ADD COLUMN IF NOT EXISTS data_inizio_consegna DATE,
  ADD COLUMN IF NOT EXISTS data_fine_consegna DATE;

-- Aggiungi colonne per quantità e taglia a livello ordine (necessarie per residui)
ALTER TABLE ordini
  ADD COLUMN IF NOT EXISTS quantita_totale INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS taglia_richiesta TEXT DEFAULT '';

-- Aggiungi colonne per sincronizzazione Fatture in Cloud
ALTER TABLE ordini
  ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'locale',
  ADD COLUMN IF NOT EXISTS fatture_in_cloud_id INTEGER,
  ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS company_id INTEGER;

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

-- ============================================
-- 2. AGGIUNGI COLONNE A TABELLA ORDINI_DETTAGLI ESISTENTE
-- ============================================

-- Verifica che la tabella ordini_dettagli esista
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ordini_dettagli') THEN
    RAISE EXCEPTION 'Tabella "ordini_dettagli" non trovata! Questo script richiede che la tabella ordini_dettagli esista già.';
  END IF;
END $$;

-- Aggiungi colonne necessarie per sincronizzazione
ALTER TABLE ordini_dettagli
  ADD COLUMN IF NOT EXISTS taglia VARCHAR(50) DEFAULT '',
  ADD COLUMN IF NOT EXISTS fic_item_id INTEGER;

-- ============================================
-- 3. CREA TABELLA CONSEGNE CONDIVISE (NUOVA)
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

-- ============================================
-- 4. CREA VISTA ORDINI CON RESIDUO
-- ============================================

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
  (COALESCE(o.quantita_totale, 0) - COALESCE(SUM(c.quantita_consegnata), 0))::INTEGER as quantita_residua,
  CASE 
    WHEN COALESCE(SUM(c.quantita_consegnata), 0) = 0 THEN 'Aperto'
    WHEN COALESCE(SUM(c.quantita_consegnata), 0) >= COALESCE(o.quantita_totale, 0) THEN 'Completato'
    ELSE 'Parziale'
  END as stato_calcolato
FROM ordini o
LEFT JOIN consegne_condivise c ON c.ordine_id = o.id
GROUP BY 
  o.id, o.numero, o.data, o.cliente_id, o.cliente_nome, 
  o.stato, o.quantita_totale, o.taglia_richiesta,
  o.data_inizio_consegna, o.data_fine_consegna,
  o.fatture_in_cloud_id, o.sync_status;

COMMENT ON VIEW ordini_con_residuo IS 'Vista con calcolo automatico quantità consegnata e residua per ordini condivisi';

-- ============================================
-- 5. INDICI PER PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_ordini_fatture_in_cloud_id ON ordini(fatture_in_cloud_id);
CREATE INDEX IF NOT EXISTS idx_ordini_sync_status ON ordini(sync_status);
CREATE INDEX IF NOT EXISTS idx_ordini_data_inizio_consegna ON ordini(data_inizio_consegna);

CREATE INDEX IF NOT EXISTS idx_ordini_dettagli_taglia ON ordini_dettagli(taglia);

CREATE INDEX IF NOT EXISTS idx_consegne_ordine_id ON consegne_condivise(ordine_id);
CREATE INDEX IF NOT EXISTS idx_consegne_data_consegna ON consegne_condivise(data_consegna);
CREATE INDEX IF NOT EXISTS idx_consegne_app_origine ON consegne_condivise(app_origine);

-- ============================================
-- 6. VERIFICA FINALE
-- ============================================

SELECT 
  '✅ Setup completato!' as messaggio,
  (SELECT COUNT(*) FROM ordini) as totale_ordini,
  (SELECT COUNT(*) FROM ordini_dettagli) as totale_dettagli,
  (SELECT COUNT(*) FROM consegne_condivise) as totale_consegne;

SELECT '📊 Colonne aggiunte a ordini:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ordini' 
  AND column_name IN ('quantita_totale', 'taglia_richiesta', 'data_inizio_consegna', 'data_fine_consegna', 'sync_status', 'fatture_in_cloud_id')
ORDER BY column_name;
