BEGIN;

CREATE TABLE IF NOT EXISTS size_range_versions (
  id serial PRIMARY KEY,
  size_id integer NOT NULL REFERENCES sizes(id) ON DELETE RESTRICT,
  min_animals_per_kg integer NOT NULL,
  max_animals_per_kg integer NOT NULL,
  valid_from date NOT NULL,
  valid_to date,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT size_range_versions_min_lte_max_check
    CHECK (min_animals_per_kg <= max_animals_per_kg),
  CONSTRAINT size_range_versions_period_check
    CHECK (valid_to IS NULL OR valid_to >= valid_from)
);

CREATE UNIQUE INDEX IF NOT EXISTS size_range_versions_size_valid_from_unique
  ON size_range_versions (size_id, valid_from);

CREATE INDEX IF NOT EXISTS size_range_versions_validity_idx
  ON size_range_versions (valid_from, valid_to);

-- Versione iniziale: fotografia dei range esistenti. La data remota permette
-- di classificare record storici precedenti all'avvio dell'applicazione.
INSERT INTO size_range_versions (
  size_id,
  min_animals_per_kg,
  max_animals_per_kg,
  valid_from,
  valid_to
)
SELECT
  id,
  min_animals_per_kg,
  max_animals_per_kg,
  DATE '1900-01-01',
  NULL
FROM sizes
WHERE min_animals_per_kg IS NOT NULL
  AND max_animals_per_kg IS NOT NULL
ON CONFLICT (size_id, valid_from) DO NOTHING;

COMMIT;