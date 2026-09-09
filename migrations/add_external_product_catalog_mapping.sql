CREATE TABLE IF NOT EXISTS external_product_catalog (
  id serial PRIMARY KEY,
  provider text NOT NULL,
  company_key text NOT NULL,
  external_product_id text,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  unit_of_measure text,
  active boolean NOT NULL DEFAULT true,
  last_synced_at timestamp NOT NULL DEFAULT now(),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT external_product_catalog_provider_company_code_unique
    UNIQUE (provider, company_key, code)
);

CREATE INDEX IF NOT EXISTS external_product_catalog_provider_company_idx
  ON external_product_catalog (provider, company_key);

CREATE TABLE IF NOT EXISTS size_external_product_mappings (
  id serial PRIMARY KEY,
  size_id integer NOT NULL REFERENCES sizes(id) ON DELETE CASCADE,
  provider text NOT NULL,
  company_key text NOT NULL,
  product_catalog_id integer NOT NULL REFERENCES external_product_catalog(id) ON DELETE RESTRICT,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT size_external_product_mappings_size_provider_company_unique
    UNIQUE (size_id, provider, company_key),
  CONSTRAINT size_external_product_mappings_product_provider_company_unique
    UNIQUE (product_catalog_id, provider, company_key)
);

ALTER TABLE ddt_righe
  ADD COLUMN IF NOT EXISTS fic_product_id text,
  ADD COLUMN IF NOT EXISTS fic_product_code text,
  ADD COLUMN IF NOT EXISTS fic_product_name text,
  ADD COLUMN IF NOT EXISTS fcloud_product_id text,
  ADD COLUMN IF NOT EXISTS fcloud_product_code text,
  ADD COLUMN IF NOT EXISTS fcloud_product_name text;