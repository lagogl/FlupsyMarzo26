ALTER TABLE advanced_sales
  ADD COLUMN IF NOT EXISTS generated_documents jsonb NOT NULL DEFAULT '{}'::jsonb;