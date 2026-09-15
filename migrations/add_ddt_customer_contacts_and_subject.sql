ALTER TABLE clienti
  ADD COLUMN IF NOT EXISTS pec text,
  ADD COLUMN IF NOT EXISTS codice_destinatario text;

ALTER TABLE ddt
  ADD COLUMN IF NOT EXISTS cliente_email text,
  ADD COLUMN IF NOT EXISTS cliente_pec text,
  ADD COLUMN IF NOT EXISTS cliente_telefono text,
  ADD COLUMN IF NOT EXISTS cliente_codice_destinatario text,
  ADD COLUMN IF NOT EXISTS cliente_fatture_in_cloud_id integer,
  ADD COLUMN IF NOT EXISTS oggetto text,
  ADD COLUMN IF NOT EXISTS causale_trasporto text DEFAULT 'Vendita';