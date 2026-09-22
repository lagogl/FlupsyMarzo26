BEGIN;

CREATE TABLE IF NOT EXISTS sand_nursery_seedings (
  id serial PRIMARY KEY,
  year integer NOT NULL,
  month integer NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp,
  CONSTRAINT sand_nursery_seedings_year_check
    CHECK (year BETWEEN 2000 AND 2200),
  CONSTRAINT sand_nursery_seedings_month_check
    CHECK (month BETWEEN 1 AND 12),
  CONSTRAINT sand_nursery_seedings_quantity_check
    CHECK (quantity >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS sand_nursery_seedings_year_month_unique
  ON sand_nursery_seedings (year, month);

COMMIT;