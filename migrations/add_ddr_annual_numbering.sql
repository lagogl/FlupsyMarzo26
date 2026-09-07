ALTER TABLE advanced_sales
  ADD COLUMN IF NOT EXISTS ddr_number integer,
  ADD COLUMN IF NOT EXISTS ddr_year integer;

CREATE TABLE IF NOT EXISTS ddr_number_sequences (
  id serial PRIMARY KEY,
  company_id integer NOT NULL,
  year integer NOT NULL,
  next_number integer NOT NULL DEFAULT 1,
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT ddr_number_sequences_company_year_unique UNIQUE (company_id, year),
  CONSTRAINT ddr_number_sequences_positive CHECK (next_number > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS advanced_sales_ddr_number_unique
  ON advanced_sales (company_id, ddr_year, ddr_number)
  WHERE ddr_number IS NOT NULL;