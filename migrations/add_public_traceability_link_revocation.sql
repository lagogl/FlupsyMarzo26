CREATE TABLE IF NOT EXISTS public_traceability_links (
  id serial PRIMARY KEY,
  token_id text NOT NULL UNIQUE,
  advanced_sale_id integer NOT NULL REFERENCES advanced_sales(id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT NOW(),
  created_by integer REFERENCES users(id) ON DELETE SET NULL,
  revoked_at timestamp,
  revoked_by integer REFERENCES users(id) ON DELETE SET NULL,
  revocation_reason text
);

CREATE INDEX IF NOT EXISTS public_traceability_links_sale_id_idx
  ON public_traceability_links(advanced_sale_id);