-- ============================================
-- AGGIUNGI COLONNE MANCANTI ALLA TABELLA ORDINI
-- ============================================
-- Script per completare la struttura della tabella ordini esistente
-- aggiungendo le colonne necessarie per la sincronizzazione FIC

-- Aggiungi colonne mancanti (se non esistono già)
ALTER TABLE ordini 
  ADD COLUMN IF NOT EXISTS numero INTEGER,
  ADD COLUMN IF NOT EXISTS cliente_nome TEXT,
  ADD COLUMN IF NOT EXISTS totale NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valuta TEXT DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS note TEXT;

-- Aggiungi created_at e updated_at per tracking
ALTER TABLE ordini
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

-- Verifica finale - mostra tutte le colonne
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ordini' 
ORDER BY ordinal_position;

COMMENT ON COLUMN ordini.numero IS 'Numero progressivo ordine (può essere NULL per ordini locali)';
COMMENT ON COLUMN ordini.cliente_nome IS 'Nome cliente (denormalizzato per performance)';
COMMENT ON COLUMN ordini.totale IS 'Importo totale ordine';
COMMENT ON COLUMN ordini.valuta IS 'Valuta (default EUR)';

-- ============================================
-- Fine script
-- ============================================
SELECT 'Script completato! Verifica colonne sopra.' as messaggio;
