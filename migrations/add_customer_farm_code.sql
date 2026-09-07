ALTER TABLE clienti
  ADD COLUMN IF NOT EXISTS codice_allevamento text;

ALTER TABLE ddt
  ADD COLUMN IF NOT EXISTS cliente_codice_allevamento text;