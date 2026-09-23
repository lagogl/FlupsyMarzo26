BEGIN;
CREATE TABLE IF NOT EXISTS sales_scenarios (
  id serial PRIMARY KEY,
  name text NOT NULL,
  input jsonb NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
COMMIT;