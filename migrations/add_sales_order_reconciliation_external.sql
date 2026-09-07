-- Database esterno ordini: tracciamento idempotente vendita -> consegna.
ALTER TABLE consegne_condivise
  ADD COLUMN IF NOT EXISTS advanced_sale_id INTEGER,
  ADD COLUMN IF NOT EXISTS advanced_sale_number VARCHAR(30),
  ADD COLUMN IF NOT EXISTS sale_size_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS ddt_id INTEGER,
  ADD COLUMN IF NOT EXISTS source_reference VARCHAR(160);

CREATE UNIQUE INDEX IF NOT EXISTS consegne_condivise_source_reference_unique
  ON consegne_condivise (source_reference)
  WHERE source_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS consegne_condivise_advanced_sale_id_idx
  ON consegne_condivise (advanced_sale_id);