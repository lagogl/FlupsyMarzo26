-- ============================================================================
-- MIGRAZIONE: Vincoli di Integrità Dati per FLUPSY Management System
-- Data: 2024-11-28
-- Autore: Sistema AI
-- Versione: 1.0
-- ============================================================================
-- 
-- DESCRIZIONE:
-- Questa migrazione aggiunge vincoli di integrità referenziale e trigger
-- per garantire la consistenza dei dati nel sistema FLUPSY.
--
-- COMPONENTI:
-- 1. FK Constraints per tabelle core (cycles → baskets, operations → baskets/cycles)
-- 2. FK Constraints per tabelle screening/selection
-- 3. Trigger per protezione stato cestello (triplet atomico)
-- 4. Tabella audit_logs per tracciabilità operazioni
-- ============================================================================

-- ============================================================================
-- SEZIONE 1: FOREIGN KEY CONSTRAINTS - TABELLE CORE
-- ============================================================================

-- FK: cycles → baskets (CASCADE delete)
ALTER TABLE cycles 
  DROP CONSTRAINT IF EXISTS fk_cycles_basket;
  
ALTER TABLE cycles
  ADD CONSTRAINT fk_cycles_basket 
    FOREIGN KEY (basket_id) REFERENCES baskets(id) ON DELETE CASCADE;

-- FK: operations → baskets (CASCADE delete)
ALTER TABLE operations 
  DROP CONSTRAINT IF EXISTS fk_operations_basket;
  
ALTER TABLE operations
  ADD CONSTRAINT fk_operations_basket 
    FOREIGN KEY (basket_id) REFERENCES baskets(id) ON DELETE CASCADE;

-- FK: operations → cycles (SET NULL on delete)
ALTER TABLE operations 
  DROP CONSTRAINT IF EXISTS fk_operations_cycle;
  
ALTER TABLE operations
  ADD CONSTRAINT fk_operations_cycle 
    FOREIGN KEY (cycle_id) REFERENCES cycles(id) ON DELETE SET NULL;

-- ============================================================================
-- SEZIONE 2: FOREIGN KEY CONSTRAINTS - TABELLE SCREENING
-- ============================================================================

-- FK: screening_source_baskets → baskets
ALTER TABLE screening_source_baskets 
  DROP CONSTRAINT IF EXISTS fk_screening_source_baskets_basket,
  DROP CONSTRAINT IF EXISTS fk_screening_source_baskets_cycle;

ALTER TABLE screening_source_baskets
  ADD CONSTRAINT fk_screening_source_baskets_basket 
    FOREIGN KEY (basket_id) REFERENCES baskets(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_screening_source_baskets_cycle 
    FOREIGN KEY (cycle_id) REFERENCES cycles(id) ON DELETE SET NULL;

-- FK: screening_destination_baskets → baskets
ALTER TABLE screening_destination_baskets 
  DROP CONSTRAINT IF EXISTS fk_screening_dest_baskets_basket,
  DROP CONSTRAINT IF EXISTS fk_screening_dest_baskets_cycle;

ALTER TABLE screening_destination_baskets
  ADD CONSTRAINT fk_screening_dest_baskets_basket 
    FOREIGN KEY (basket_id) REFERENCES baskets(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_screening_dest_baskets_cycle 
    FOREIGN KEY (cycle_id) REFERENCES cycles(id) ON DELETE SET NULL;

-- ============================================================================
-- SEZIONE 3: FOREIGN KEY CONSTRAINTS - TABELLE SELECTION
-- ============================================================================

-- FK: selection_source_baskets → baskets
ALTER TABLE selection_source_baskets 
  DROP CONSTRAINT IF EXISTS fk_selection_source_baskets_basket,
  DROP CONSTRAINT IF EXISTS fk_selection_source_baskets_cycle;

ALTER TABLE selection_source_baskets
  ADD CONSTRAINT fk_selection_source_baskets_basket 
    FOREIGN KEY (basket_id) REFERENCES baskets(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_selection_source_baskets_cycle 
    FOREIGN KEY (cycle_id) REFERENCES cycles(id) ON DELETE SET NULL;

-- FK: selection_destination_baskets → baskets
ALTER TABLE selection_destination_baskets 
  DROP CONSTRAINT IF EXISTS fk_selection_dest_baskets_basket,
  DROP CONSTRAINT IF EXISTS fk_selection_dest_baskets_cycle;

ALTER TABLE selection_destination_baskets
  ADD CONSTRAINT fk_selection_dest_baskets_basket 
    FOREIGN KEY (basket_id) REFERENCES baskets(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_selection_dest_baskets_cycle 
    FOREIGN KEY (cycle_id) REFERENCES cycles(id) ON DELETE SET NULL;

-- ============================================================================
-- SEZIONE 4: TRIGGER PROTEZIONE STATO CESTELLO (TRIPLET ATOMICO)
-- ============================================================================
-- 
-- INVARIANTE: Quando si modifica state, currentCycleId o cycleCode,
-- tutti e tre devono essere coerenti:
-- - state='active' → currentCycleId NOT NULL, cycleCode NOT NULL
-- - state='available'/'disponibile' → currentCycleId NULL, cycleCode NULL
--

CREATE OR REPLACE FUNCTION enforce_basket_state_triplet()
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica se uno dei tre campi viene modificato
  IF (OLD.state IS DISTINCT FROM NEW.state) OR 
     (OLD.current_cycle_id IS DISTINCT FROM NEW.current_cycle_id) OR 
     (OLD.cycle_code IS DISTINCT FROM NEW.cycle_code) THEN
    
    -- CASO 1: Attivazione cestello (state = 'active')
    IF NEW.state = 'active' THEN
      IF NEW.current_cycle_id IS NULL THEN
        RAISE EXCEPTION 'BASKET_STATE_TRIPLET_VIOLATION: Cestello attivo richiede current_cycle_id (basket_id=%)', NEW.id;
      END IF;
      IF NEW.cycle_code IS NULL OR NEW.cycle_code = '' THEN
        RAISE EXCEPTION 'BASKET_STATE_TRIPLET_VIOLATION: Cestello attivo richiede cycle_code (basket_id=%)', NEW.id;
      END IF;
    END IF;
    
    -- CASO 2: Liberazione cestello (state = 'available' o 'disponibile')
    IF NEW.state IN ('available', 'disponibile') THEN
      IF NEW.current_cycle_id IS NOT NULL THEN
        RAISE EXCEPTION 'BASKET_STATE_TRIPLET_VIOLATION: Cestello disponibile non può avere current_cycle_id (basket_id=%, cycle_id=%)', NEW.id, NEW.current_cycle_id;
      END IF;
      IF NEW.cycle_code IS NOT NULL AND NEW.cycle_code != '' THEN
        RAISE EXCEPTION 'BASKET_STATE_TRIPLET_VIOLATION: Cestello disponibile non può avere cycle_code (basket_id=%, code=%)', NEW.id, NEW.cycle_code;
      END IF;
    END IF;
    
    -- Log per debug (opzionale)
    RAISE NOTICE 'BASKET_STATE_TRIPLET: basket_id=%, state=%->%, cycle_id=%->%, code=%->%', 
      NEW.id, OLD.state, NEW.state, OLD.current_cycle_id, NEW.current_cycle_id, OLD.cycle_code, NEW.cycle_code;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Rimuovi trigger esistente se presente
DROP TRIGGER IF EXISTS basket_state_triplet_check ON baskets;

-- Crea trigger BEFORE UPDATE
CREATE TRIGGER basket_state_triplet_check
  BEFORE UPDATE ON baskets
  FOR EACH ROW
  EXECUTE FUNCTION enforce_basket_state_triplet();

-- ============================================================================
-- SEZIONE 5: TABELLA AUDIT LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER,
  user_id INTEGER,
  user_source VARCHAR(50),
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Indici per query comuni
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Commento esplicativo
COMMENT ON TABLE audit_logs IS 'Registro di tutte le operazioni critiche per tracciabilità e compliance';

-- ============================================================================
-- SEZIONE 6: VERIFICA CONSTRAINTS
-- ============================================================================

-- Query per verificare che i constraints siano stati applicati correttamente
-- Eseguire dopo la migrazione per confermare il successo

-- SELECT 
--   tc.table_name, 
--   tc.constraint_name, 
--   tc.constraint_type,
--   kcu.column_name,
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name 
-- FROM information_schema.table_constraints AS tc 
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY'
--   AND tc.table_name IN ('cycles', 'operations', 'screening_source_baskets', 
--                          'screening_destination_baskets', 'selection_source_baskets',
--                          'selection_destination_baskets');

-- ============================================================================
-- NOTE DI ROLLBACK (in caso di necessità)
-- ============================================================================
-- 
-- Per rimuovere i constraints:
-- ALTER TABLE cycles DROP CONSTRAINT IF EXISTS fk_cycles_basket;
-- ALTER TABLE operations DROP CONSTRAINT IF EXISTS fk_operations_basket;
-- ALTER TABLE operations DROP CONSTRAINT IF EXISTS fk_operations_cycle;
-- ALTER TABLE screening_source_baskets DROP CONSTRAINT IF EXISTS fk_screening_source_baskets_basket;
-- ALTER TABLE screening_source_baskets DROP CONSTRAINT IF EXISTS fk_screening_source_baskets_cycle;
-- ALTER TABLE screening_destination_baskets DROP CONSTRAINT IF EXISTS fk_screening_dest_baskets_basket;
-- ALTER TABLE screening_destination_baskets DROP CONSTRAINT IF EXISTS fk_screening_dest_baskets_cycle;
-- ALTER TABLE selection_source_baskets DROP CONSTRAINT IF EXISTS fk_selection_source_baskets_basket;
-- ALTER TABLE selection_source_baskets DROP CONSTRAINT IF EXISTS fk_selection_source_baskets_cycle;
-- ALTER TABLE selection_destination_baskets DROP CONSTRAINT IF EXISTS fk_selection_dest_baskets_basket;
-- ALTER TABLE selection_destination_baskets DROP CONSTRAINT IF EXISTS fk_selection_dest_baskets_cycle;
-- 
-- Per rimuovere il trigger:
-- DROP TRIGGER IF EXISTS basket_state_triplet_check ON baskets;
-- DROP FUNCTION IF EXISTS enforce_basket_state_triplet();
--
-- Per rimuovere la tabella audit_logs:
-- DROP TABLE IF EXISTS audit_logs;
-- ============================================================================

-- ============================================================================
-- SEZIONE 7: CROSS-FLUPSY VAGLIATURA SUPPORT
-- Data: 2024-11-28
-- ============================================================================
--
-- DESCRIZIONE:
-- Estensione dello schema per supportare operazioni di vagliatura (screening)
-- tra FLUPSY diversi. Permette di trasferire cestelli da un FLUPSY di origine
-- a un FLUPSY di destinazione diverso.
--
-- NUOVE COLONNE:
-- 1. selections.is_cross_flupsy - Flag per indicare vagliatura cross-FLUPSY
-- 2. selections.origin_flupsy_id - ID del FLUPSY di origine
-- 3. selections.destination_flupsy_id - ID del FLUPSY di destinazione
-- 4. selections.transport_metadata - Metadati trasporto (operatore, tempo, note)
-- 5. selection_source_baskets.flupsy_id - FLUPSY di origine del cestello
-- ============================================================================

-- Colonne cross-FLUPSY nella tabella selections
ALTER TABLE selections 
  ADD COLUMN IF NOT EXISTS is_cross_flupsy BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS origin_flupsy_id INTEGER,
  ADD COLUMN IF NOT EXISTS destination_flupsy_id INTEGER,
  ADD COLUMN IF NOT EXISTS transport_metadata JSONB;

-- Commenti esplicativi
COMMENT ON COLUMN selections.is_cross_flupsy IS 'True se la vagliatura coinvolge FLUPSY diversi';
COMMENT ON COLUMN selections.origin_flupsy_id IS 'ID del FLUPSY di origine per cross-FLUPSY';
COMMENT ON COLUMN selections.destination_flupsy_id IS 'ID del FLUPSY di destinazione per cross-FLUPSY';
COMMENT ON COLUMN selections.transport_metadata IS 'JSON: {operatorName, transportTime, notes} per tracciabilità trasporto';

-- Colonna flupsyId nella tabella selection_source_baskets
ALTER TABLE selection_source_baskets
  ADD COLUMN IF NOT EXISTS flupsy_id INTEGER;

COMMENT ON COLUMN selection_source_baskets.flupsy_id IS 'FLUPSY di origine del cestello (per cross-FLUPSY)';

-- Indici per ottimizzare le query cross-FLUPSY
CREATE INDEX IF NOT EXISTS idx_selections_cross_flupsy ON selections(is_cross_flupsy) WHERE is_cross_flupsy = true;
CREATE INDEX IF NOT EXISTS idx_selections_origin_flupsy ON selections(origin_flupsy_id) WHERE origin_flupsy_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_selections_destination_flupsy ON selections(destination_flupsy_id) WHERE destination_flupsy_id IS NOT NULL;

-- ============================================================================
-- NOTE DI ROLLBACK SEZIONE 7:
-- ============================================================================
-- 
-- Per rimuovere le colonne cross-FLUPSY:
-- ALTER TABLE selections DROP COLUMN IF EXISTS is_cross_flupsy;
-- ALTER TABLE selections DROP COLUMN IF EXISTS origin_flupsy_id;
-- ALTER TABLE selections DROP COLUMN IF EXISTS destination_flupsy_id;
-- ALTER TABLE selections DROP COLUMN IF EXISTS transport_metadata;
-- ALTER TABLE selection_source_baskets DROP COLUMN IF EXISTS flupsy_id;
-- DROP INDEX IF EXISTS idx_selections_cross_flupsy;
-- DROP INDEX IF EXISTS idx_selections_origin_flupsy;
-- DROP INDEX IF EXISTS idx_selections_destination_flupsy;
-- ============================================================================
