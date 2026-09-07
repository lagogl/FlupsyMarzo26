-- Audit dello storno delle vendite manuali confermate.
-- Le colonne sono nullable perché le vendite non stornate non hanno dati di annullamento.
ALTER TABLE advanced_sales
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;