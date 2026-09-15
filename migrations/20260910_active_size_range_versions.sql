-- Versioned, idempotent correction of the commercial size ranges.
-- Apply manually through the migration process; do not run via db:push.
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

-- Validate the catalogue by business code before touching version history.
-- The three excluded commercial codes are deliberately not part of this CTE.
DO $$
DECLARE
  expected_count integer;
  duplicate_codes text;
BEGIN
  WITH expected_ranges(code, min_animals_per_kg, max_animals_per_kg) AS (
    VALUES
      ('TP-180', 70000001, 100000000),
      ('TP-250', 30000001, 70000000),
      ('TP-300', 20000001, 30000000),
      ('TP-350', 15000001, 20000000),
      ('TP-450', 8000001, 15000000),
      ('TP-500', 2000001, 8000000),
      ('TP-600', 1900001, 2000000),
      ('TP-700', 1000001, 1900000),
      ('TP-800', 880001, 1000000),
      ('TP-1000', 600001, 880000),
      ('TP-1140', 350001, 600000),
      ('TP-1260', 300001, 350000),
      ('TP-1500', 190000, 300000),
      ('TP-1800', 100001, 189999),
      ('TP-2000', 55000, 100000),
      ('TP-2500', 30000, 54999),
      ('TP-3000', 19000, 29999),
      ('TP-3500', 14000, 18999),
      ('TP-4000', 9000, 13999),
      ('TP-4500', 7100, 8999),
      ('TP-5000', 5000, 7099),
      ('TP-6000', 4000, 4999),
      ('TP-7000', 3000, 3999),
      ('TP-8000', 2400, 2999),
      ('TP-9000', 1500, 2399),
      ('TP-10000', 900, 1499)
  )
  SELECT count(*)
  INTO expected_count
  FROM expected_ranges expected
  JOIN sizes s ON s.code = expected.code;

  IF expected_count <> 26 THEN
    RAISE EXCEPTION
      'Size range migration aborted: expected exactly 26 catalogue codes, found %',
      expected_count;
  END IF;

  WITH expected_ranges(code) AS (
    VALUES
      ('TP-180'), ('TP-250'), ('TP-300'), ('TP-350'), ('TP-450'),
      ('TP-500'), ('TP-600'), ('TP-700'), ('TP-800'), ('TP-1000'),
      ('TP-1140'), ('TP-1260'), ('TP-1500'), ('TP-1800'), ('TP-2000'),
      ('TP-2500'), ('TP-3000'), ('TP-3500'), ('TP-4000'), ('TP-4500'),
      ('TP-5000'), ('TP-6000'), ('TP-7000'), ('TP-8000'), ('TP-9000'),
      ('TP-10000')
  ),
  duplicate_rows AS (
    SELECT expected.code
    FROM expected_ranges expected
    JOIN sizes s ON s.code = expected.code
    GROUP BY expected.code
    HAVING count(s.id) <> 1
  )
  SELECT string_agg(duplicate_rows.code, ', ' ORDER BY duplicate_rows.code)
  INTO duplicate_codes
  FROM duplicate_rows;

  IF duplicate_codes IS NOT NULL THEN
    RAISE EXCEPTION
      'Size range migration aborted: missing or duplicate catalogue codes: %',
      duplicate_codes;
  END IF;
END $$;

-- Close old ranges at the cut-over boundary. Existing future versions are
-- preserved; their first date will determine the cut-off for the new range.
UPDATE size_range_versions
SET valid_to = DATE '2026-09-09'
WHERE valid_from < DATE '2026-09-10'
  AND (valid_to IS NULL OR valid_to >= DATE '2026-09-10');

-- Remove only prior cut-over rows for the three forbidden codes. No surrogate
-- IDs are assumed, and any future rows for these codes remain untouched.
DELETE FROM size_range_versions srv
USING sizes s
WHERE srv.size_id = s.id
  AND srv.valid_from = DATE '2026-09-10'
  AND s.code IN ('TP-1900', 'TP-2800', 'TP-5500');

-- Upsert by sizes.code. If a later version already exists, close this
-- cut-over version on the day before that later version instead of reopening
-- it with valid_to = NULL.
WITH expected_ranges(code, min_animals_per_kg, max_animals_per_kg) AS (
  VALUES
    ('TP-180', 70000001, 100000000),
    ('TP-250', 30000001, 70000000),
    ('TP-300', 20000001, 30000000),
    ('TP-350', 15000001, 20000000),
    ('TP-450', 8000001, 15000000),
    ('TP-500', 2000001, 8000000),
    ('TP-600', 1900001, 2000000),
    ('TP-700', 1000001, 1900000),
    ('TP-800', 880001, 1000000),
    ('TP-1000', 600001, 880000),
    ('TP-1140', 350001, 600000),
    ('TP-1260', 300001, 350000),
    ('TP-1500', 190000, 300000),
    ('TP-1800', 100001, 189999),
    ('TP-2000', 55000, 100000),
    ('TP-2500', 30000, 54999),
    ('TP-3000', 19000, 29999),
    ('TP-3500', 14000, 18999),
    ('TP-4000', 9000, 13999),
    ('TP-4500', 7100, 8999),
    ('TP-5000', 5000, 7099),
    ('TP-6000', 4000, 4999),
    ('TP-7000', 3000, 3999),
    ('TP-8000', 2400, 2999),
    ('TP-9000', 1500, 2399),
    ('TP-10000', 900, 1499)
),
resolved_ranges AS (
  SELECT
    s.id AS size_id,
    expected.min_animals_per_kg,
    expected.max_animals_per_kg,
    COALESCE(
      (
        SELECT MIN(next_version.valid_from) - 1
        FROM size_range_versions next_version
        WHERE next_version.size_id = s.id
          AND next_version.valid_from > DATE '2026-09-10'
      ),
      NULL
    ) AS valid_to
  FROM expected_ranges expected
  JOIN sizes s ON s.code = expected.code
)
INSERT INTO size_range_versions (
  size_id,
  min_animals_per_kg,
  max_animals_per_kg,
  valid_from,
  valid_to
)
SELECT
  size_id,
  min_animals_per_kg,
  max_animals_per_kg,
  DATE '2026-09-10',
  valid_to
FROM resolved_ranges
ON CONFLICT (size_id, valid_from) DO UPDATE
SET min_animals_per_kg = EXCLUDED.min_animals_per_kg,
    max_animals_per_kg = EXCLUDED.max_animals_per_kg,
    valid_to = EXCLUDED.valid_to;

-- Final assertions run inside the transaction, so any finding rolls back all
-- changes instead of leaving a partially corrected catalogue.
DO $$
DECLARE
  active_count integer;
  active_expected_count integer;
  forbidden_active text;
  range_mismatch text;
  overlap_count integer;
BEGIN
  SELECT count(*)
  INTO active_count
  FROM size_range_versions srv
  JOIN sizes s ON s.id = srv.size_id
  WHERE srv.valid_from <= DATE '2026-09-10'
    AND (srv.valid_to IS NULL OR srv.valid_to >= DATE '2026-09-10');

  IF active_count <> 26 THEN
    RAISE EXCEPTION
      'Size range migration aborted: expected 26 active versions at cut-over, found %',
      active_count;
  END IF;

  WITH expected_codes(code) AS (
    VALUES
      ('TP-180'), ('TP-250'), ('TP-300'), ('TP-350'), ('TP-450'),
      ('TP-500'), ('TP-600'), ('TP-700'), ('TP-800'), ('TP-1000'),
      ('TP-1140'), ('TP-1260'), ('TP-1500'), ('TP-1800'), ('TP-2000'),
      ('TP-2500'), ('TP-3000'), ('TP-3500'), ('TP-4000'), ('TP-4500'),
      ('TP-5000'), ('TP-6000'), ('TP-7000'), ('TP-8000'), ('TP-9000'),
      ('TP-10000')
  )
  SELECT count(*)
  INTO active_expected_count
  FROM expected_codes expected
  JOIN sizes s ON s.code = expected.code
  JOIN size_range_versions srv
    ON srv.size_id = s.id
   AND srv.valid_from <= DATE '2026-09-10'
   AND (srv.valid_to IS NULL OR srv.valid_to >= DATE '2026-09-10');

  IF active_expected_count <> 26 THEN
    RAISE EXCEPTION
      'Size range migration aborted: active codes do not match expected 26-code catalogue';
  END IF;

  SELECT string_agg(s.code, ', ' ORDER BY s.code)
  INTO forbidden_active
  FROM size_range_versions srv
  JOIN sizes s ON s.id = srv.size_id
  WHERE s.code IN ('TP-1900', 'TP-2800', 'TP-5500')
    AND srv.valid_from <= DATE '2026-09-10'
    AND (srv.valid_to IS NULL OR srv.valid_to >= DATE '2026-09-10');

  IF forbidden_active IS NOT NULL THEN
    RAISE EXCEPTION
      'Size range migration aborted: forbidden active codes: %',
      forbidden_active;
  END IF;

  WITH expected_ranges(code, min_animals_per_kg, max_animals_per_kg) AS (
    VALUES
      ('TP-180', 70000001, 100000000),
      ('TP-250', 30000001, 70000000),
      ('TP-300', 20000001, 30000000),
      ('TP-350', 15000001, 20000000),
      ('TP-450', 8000001, 15000000),
      ('TP-500', 2000001, 8000000),
      ('TP-600', 1900001, 2000000),
      ('TP-700', 1000001, 1900000),
      ('TP-800', 880001, 1000000),
      ('TP-1000', 600001, 880000),
      ('TP-1140', 350001, 600000),
      ('TP-1260', 300001, 350000),
      ('TP-1500', 190000, 300000),
      ('TP-1800', 100001, 189999),
      ('TP-2000', 55000, 100000),
      ('TP-2500', 30000, 54999),
      ('TP-3000', 19000, 29999),
      ('TP-3500', 14000, 18999),
      ('TP-4000', 9000, 13999),
      ('TP-4500', 7100, 8999),
      ('TP-5000', 5000, 7099),
      ('TP-6000', 4000, 4999),
      ('TP-7000', 3000, 3999),
      ('TP-8000', 2400, 2999),
      ('TP-9000', 1500, 2399),
      ('TP-10000', 900, 1499)
  )
  SELECT string_agg(expected.code, ', ' ORDER BY expected.code)
  INTO range_mismatch
  FROM expected_ranges expected
  JOIN sizes s ON s.code = expected.code
  LEFT JOIN size_range_versions srv
    ON srv.size_id = s.id
   AND srv.valid_from = DATE '2026-09-10'
  WHERE srv.id IS NULL
     OR srv.min_animals_per_kg <> expected.min_animals_per_kg
     OR srv.max_animals_per_kg <> expected.max_animals_per_kg;

  IF range_mismatch IS NOT NULL THEN
    RAISE EXCEPTION
      'Size range migration aborted: missing cut-over range for codes: %',
      range_mismatch;
  END IF;

  SELECT count(*)
  INTO overlap_count
  FROM size_range_versions first_version
  JOIN size_range_versions next_version
    ON next_version.size_id = first_version.size_id
   AND next_version.id < first_version.id
   AND daterange(
         first_version.valid_from,
         COALESCE(first_version.valid_to, DATE '9999-12-31'),
         '[]'
       ) && daterange(
         next_version.valid_from,
         COALESCE(next_version.valid_to, DATE '9999-12-31'),
         '[]'
       );

  IF overlap_count <> 0 THEN
    RAISE EXCEPTION
      'Size range migration aborted: % overlapping version pairs remain',
      overlap_count;
  END IF;
END $$;

COMMIT;