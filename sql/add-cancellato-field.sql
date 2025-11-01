-- =====================================================
-- MIGRAZIONE: Aggiunta campo 'cancellato' agli ordini
-- Data: 2025-11-01
-- Scopo: Implementare soft delete per ordini eliminati da Fatture in Cloud
-- =====================================================

-- Aggiunge campo cancellato alla tabella ordini
ALTER TABLE ordini 
ADD COLUMN IF NOT EXISTS cancellato BOOLEAN NOT NULL DEFAULT FALSE;

-- Crea indice per filtrare rapidamente ordini non cancellati
CREATE INDEX IF NOT EXISTS idx_ordini_cancellato ON ordini(cancellato);

-- Commento per documentazione
COMMENT ON COLUMN ordini.cancellato IS 'Indica se l''ordine è stato cancellato da Fatture in Cloud (soft delete). Gestito automaticamente dalla sincronizzazione FIC.';

-- Verifica risultato
SELECT 
  'Campo "cancellato" aggiunto con successo' AS status,
  COUNT(*) AS ordini_totali,
  COUNT(*) FILTER (WHERE cancellato = FALSE) AS ordini_attivi,
  COUNT(*) FILTER (WHERE cancellato = TRUE) AS ordini_cancellati
FROM ordini;
