BEGIN;

CREATE TABLE ddt_number_legacy_exceptions (
  ddt_id integer PRIMARY KEY
    REFERENCES ddt(id) ON DELETE RESTRICT,
  company_id integer NOT NULL,
  numbering_year integer NOT NULL,
  local_number integer NOT NULL,
  fic_company_id integer NOT NULL,
  fic_document_id integer NOT NULL,
  fic_number integer NOT NULL,
  fic_document_type text NOT NULL,
  verified_at timestamptz NOT NULL,
  verification_method text NOT NULL,
  CONSTRAINT ddt_number_legacy_exceptions_must_mismatch
    CHECK (local_number <> fic_number),
  CONSTRAINT ddt_number_legacy_exceptions_fic_document_unique
    UNIQUE (fic_company_id, fic_document_id),
  CONSTRAINT ddt_number_legacy_exceptions_fic_type
    CHECK (fic_document_type = 'delivery_note')
);

CREATE FUNCTION reject_ddt_number_legacy_exception_change()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP <> 'INSERT' THEN
    RAISE EXCEPTION 'Verified legacy DDT number evidence is immutable'
      USING ERRCODE = '55000';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER ddt_number_legacy_exceptions_immutable
BEFORE UPDATE OR DELETE ON ddt_number_legacy_exceptions
FOR EACH ROW EXECUTE FUNCTION reject_ddt_number_legacy_exception_change();

DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM ddt
    WHERE id = 46
      AND company_id = 1052922
      AND numbering_year = 2026
      AND numero = 327
      AND fatture_in_cloud_id = 554686507
      AND ddt_stato = 'inviato'
  ) OR NOT EXISTS (
    SELECT 1 FROM ddt
    WHERE id = 47
      AND company_id = 1052922
      AND numbering_year = 2026
      AND numero = 328
      AND fatture_in_cloud_id = 554646769
      AND ddt_stato = 'inviato'
  ) THEN
    RAISE EXCEPTION 'Legacy DDT rows no longer match the read-only FIC verification; aborting migration';
  END IF;

  IF EXISTS (
    SELECT 1 FROM ddt_number_legacy_exceptions
    WHERE ddt_id IN (46, 47)
  ) THEN
    RAISE EXCEPTION 'Legacy DDT evidence already exists; inspect before applying this migration';
  END IF;
END;
$block$;

-- Read-only FIC GETs verified the remote document identities/numbers on 2026-09-24.
-- The original DDT rows are intentionally left unchanged.
INSERT INTO ddt_number_legacy_exceptions (
  ddt_id, company_id, numbering_year, local_number,
  fic_company_id, fic_document_id, fic_number, fic_document_type,
  verified_at, verification_method
) VALUES
  (
    46, 1052922, 2026, 327,
    1052922, 554686507, 315, 'delivery_note',
    '2026-09-24T14:20:48.494Z',
    'Read-only GET /c/1052922/issued_documents/554686507'
  ),
  (
    47, 1052922, 2026, 328,
    1052922, 554646769, 326, 'delivery_note',
    '2026-09-24T14:20:48.799Z',
    'Read-only GET /c/1052922/issued_documents/554646769'
  );

CREATE OR REPLACE FUNCTION enforce_ddt_annual_number_uniqueness()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  candidate_year integer := EXTRACT(YEAR FROM NEW.data)::integer;
BEGIN
  PERFORM pg_advisory_xact_lock(
    hashtext('ddt-number:' || NEW.company_id::text || ':' ||
      candidate_year::text || ':' || NEW.numero::text)
  );

  IF EXISTS (
    SELECT 1
    FROM ddt existing
    WHERE existing.company_id = NEW.company_id
      AND existing.numbering_year = candidate_year
      AND existing.numero = NEW.numero
      AND (TG_OP = 'INSERT' OR existing.id <> NEW.id)
      AND NOT EXISTS (
        SELECT 1
        FROM ddt_number_legacy_exceptions legacy
        WHERE legacy.ddt_id = existing.id
          AND legacy.company_id = existing.company_id
          AND legacy.numbering_year = existing.numbering_year
          AND legacy.local_number = existing.numero
          AND legacy.fic_company_id = existing.company_id
          AND legacy.fic_document_id = existing.fatture_in_cloud_id
          AND legacy.fic_document_type = 'delivery_note'
          AND legacy.local_number <> legacy.fic_number
          AND existing.ddt_stato = 'inviato'
      )
  ) THEN
    RAISE EXCEPTION 'DDT number % already exists for company % in year %',
      NEW.numero, NEW.company_id, candidate_year
      USING ERRCODE = '23505',
        CONSTRAINT = 'ddt_company_year_number_unique';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS ddt_company_year_number_unique_guard ON ddt;
CREATE TRIGGER ddt_company_year_number_unique_guard
BEFORE INSERT OR UPDATE OF company_id, data, numero ON ddt
FOR EACH ROW EXECUTE FUNCTION enforce_ddt_annual_number_uniqueness();

CREATE OR REPLACE FUNCTION protect_verified_legacy_ddt_number()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM ddt_number_legacy_exceptions legacy
    WHERE legacy.ddt_id = OLD.id
  ) AND (
    NEW.company_id IS DISTINCT FROM OLD.company_id
    OR NEW.data IS DISTINCT FROM OLD.data
    OR NEW.numero IS DISTINCT FROM OLD.numero
    OR NEW.ddt_stato IS DISTINCT FROM OLD.ddt_stato
    OR NEW.fatture_in_cloud_id IS DISTINCT FROM OLD.fatture_in_cloud_id
  ) THEN
    RAISE EXCEPTION 'Verified legacy DDT number evidence cannot be detached from its document'
      USING ERRCODE = '55000';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER ddt_protect_verified_legacy_number
BEFORE UPDATE OF company_id, data, numero, ddt_stato, fatture_in_cloud_id ON ddt
FOR EACH ROW EXECUTE FUNCTION protect_verified_legacy_ddt_number();

COMMIT;