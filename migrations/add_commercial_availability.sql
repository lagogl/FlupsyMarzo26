-- Additive only; deliberately not applied automatically or via db:push.
CREATE TABLE IF NOT EXISTS commercial_availability_scenarios (
  id serial PRIMARY KEY,
  owner_id text NOT NULL,
  name text NOT NULL,
  input jsonb NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS commercial_availability_scenarios_owner_idx
  ON commercial_availability_scenarios(owner_id);
CREATE TABLE IF NOT EXISTS commercial_availability_summaries (
  id serial PRIMARY KEY,
  owner_id text NOT NULL,
  name text NOT NULL,
  snapshot jsonb NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS commercial_availability_summaries_owner_idx
  ON commercial_availability_summaries(owner_id);
CREATE OR REPLACE FUNCTION reject_commercial_summary_update() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Frozen commercial summaries are immutable';
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS commercial_summary_immutable ON commercial_availability_summaries;
CREATE TRIGGER commercial_summary_immutable
  BEFORE UPDATE ON commercial_availability_summaries
  FOR EACH ROW EXECUTE FUNCTION reject_commercial_summary_update();