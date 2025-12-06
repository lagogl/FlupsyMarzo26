--
-- PostgreSQL database dump
--

\restrict Vo0rYbkac8hrYKX6SGng6sHWBKBFpsPxpIgKdVp1JMdHVIRqvL8mxyvhrXBX0ha

-- Dumped from database version 16.11 (b740647)
-- Dumped by pg_dump version 16.10

-- Started on 2025-12-06 16:35:11 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.selection_tasks DROP CONSTRAINT IF EXISTS selection_tasks_selection_id_fkey;
ALTER TABLE IF EXISTS ONLY public.selection_task_baskets DROP CONSTRAINT IF EXISTS selection_task_baskets_task_id_fkey;
ALTER TABLE IF EXISTS ONLY public.selection_task_baskets DROP CONSTRAINT IF EXISTS selection_task_baskets_basket_id_fkey;
ALTER TABLE IF EXISTS ONLY public.selection_task_assignments DROP CONSTRAINT IF EXISTS selection_task_assignments_task_id_fkey;
ALTER TABLE IF EXISTS ONLY public.selection_task_assignments DROP CONSTRAINT IF EXISTS selection_task_assignments_operator_id_fkey;
ALTER TABLE IF EXISTS ONLY public.operations DROP CONSTRAINT IF EXISTS operations_cycle_id_fkey;
ALTER TABLE IF EXISTS ONLY public.operations DROP CONSTRAINT IF EXISTS operations_basket_id_fkey;
ALTER TABLE IF EXISTS ONLY public.selection_source_baskets DROP CONSTRAINT IF EXISTS fk_selection_source_baskets_cycle;
ALTER TABLE IF EXISTS ONLY public.selection_source_baskets DROP CONSTRAINT IF EXISTS fk_selection_source_baskets_basket;
ALTER TABLE IF EXISTS ONLY public.selection_destination_baskets DROP CONSTRAINT IF EXISTS fk_selection_dest_baskets_cycle;
ALTER TABLE IF EXISTS ONLY public.selection_destination_baskets DROP CONSTRAINT IF EXISTS fk_selection_dest_baskets_basket;
ALTER TABLE IF EXISTS ONLY public.screening_source_baskets DROP CONSTRAINT IF EXISTS fk_screening_source_baskets_cycle;
ALTER TABLE IF EXISTS ONLY public.screening_source_baskets DROP CONSTRAINT IF EXISTS fk_screening_source_baskets_basket;
ALTER TABLE IF EXISTS ONLY public.screening_destination_baskets DROP CONSTRAINT IF EXISTS fk_screening_dest_baskets_cycle;
ALTER TABLE IF EXISTS ONLY public.screening_destination_baskets DROP CONSTRAINT IF EXISTS fk_screening_dest_baskets_basket;
ALTER TABLE IF EXISTS ONLY public.operations DROP CONSTRAINT IF EXISTS fk_operations_size;
ALTER TABLE IF EXISTS ONLY public.cycles DROP CONSTRAINT IF EXISTS cycles_basket_id_fkey;
ALTER TABLE IF EXISTS ONLY public.baskets DROP CONSTRAINT IF EXISTS baskets_group_id_fkey;
DROP TRIGGER IF EXISTS trigger_protect_mixed_lot_metadata ON public.operations;
DROP TRIGGER IF EXISTS trigger_enrich_mixed_lot_metadata ON public.operations;
DROP TRIGGER IF EXISTS protect_size_ranges ON public.sizes;
DROP TRIGGER IF EXISTS basket_state_triplet_check ON public.baskets;
DROP TRIGGER IF EXISTS assignment_completion_trigger ON public.selection_task_assignments;
DROP INDEX IF EXISTS public.operations_cycle_id_idx;
DROP INDEX IF EXISTS public.operations_basket_id_idx;
DROP INDEX IF EXISTS public.notifications_is_read_idx;
DROP INDEX IF EXISTS public.idx_selections_origin_flupsy;
DROP INDEX IF EXISTS public.idx_selections_destination_flupsy;
DROP INDEX IF EXISTS public.idx_selections_cross_flupsy;
DROP INDEX IF EXISTS public.idx_selection_task_assignments_started_by;
DROP INDEX IF EXISTS public.idx_selection_task_assignments_started_at;
DROP INDEX IF EXISTS public.idx_selection_task_assignments_completed_by;
DROP INDEX IF EXISTS public.idx_selection_task_assignments_completed_at;
DROP INDEX IF EXISTS public.idx_operations_type;
DROP INDEX IF EXISTS public.idx_operations_lot_id;
DROP INDEX IF EXISTS public.idx_operations_date;
DROP INDEX IF EXISTS public.idx_operations_cycle_id;
DROP INDEX IF EXISTS public.idx_operations_basket_id_id;
DROP INDEX IF EXISTS public.idx_operations_basket_id;
DROP INDEX IF EXISTS public.idx_flupsys_active;
DROP INDEX IF EXISTS public.idx_external_users_username;
DROP INDEX IF EXISTS public.idx_external_users_email;
DROP INDEX IF EXISTS public.idx_external_users_delta_operator;
DROP INDEX IF EXISTS public.idx_external_users_active;
DROP INDEX IF EXISTS public.idx_baskets_state;
DROP INDEX IF EXISTS public.idx_baskets_position_not_null;
DROP INDEX IF EXISTS public.idx_baskets_physical_number;
DROP INDEX IF EXISTS public.idx_baskets_flupsy_state_cycle;
DROP INDEX IF EXISTS public.idx_baskets_flupsy_position;
DROP INDEX IF EXISTS public.idx_baskets_flupsy_id;
DROP INDEX IF EXISTS public.idx_baskets_cycle_code;
DROP INDEX IF EXISTS public.idx_baskets_current_cycle_id;
DROP INDEX IF EXISTS public.idx_audit_logs_timestamp;
DROP INDEX IF EXISTS public.idx_audit_logs_entity;
DROP INDEX IF EXISTS public.idx_audit_logs_action;
DROP INDEX IF EXISTS public.cycles_state_idx;
DROP INDEX IF EXISTS public.baskets_flupsy_id_idx;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_username_unique;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.task_operators DROP CONSTRAINT IF EXISTS task_operators_pkey;
ALTER TABLE IF EXISTS ONLY public.task_operators DROP CONSTRAINT IF EXISTS task_operators_email_key;
ALTER TABLE IF EXISTS ONLY public.target_size_annotations DROP CONSTRAINT IF EXISTS target_size_annotations_pkey;
ALTER TABLE IF EXISTS ONLY public.sync_status DROP CONSTRAINT IF EXISTS sync_status_table_name_unique;
ALTER TABLE IF EXISTS ONLY public.sync_status DROP CONSTRAINT IF EXISTS sync_status_pkey;
ALTER TABLE IF EXISTS ONLY public.sizes DROP CONSTRAINT IF EXISTS sizes_pkey;
ALTER TABLE IF EXISTS ONLY public.sizes DROP CONSTRAINT IF EXISTS sizes_code_unique;
ALTER TABLE IF EXISTS ONLY public.sgr DROP CONSTRAINT IF EXISTS sgr_pkey;
ALTER TABLE IF EXISTS ONLY public.sgr_per_taglia DROP CONSTRAINT IF EXISTS sgr_per_taglia_pkey;
ALTER TABLE IF EXISTS ONLY public.sgr_giornalieri DROP CONSTRAINT IF EXISTS sgr_giornalieri_pkey;
ALTER TABLE IF EXISTS ONLY public.selections DROP CONSTRAINT IF EXISTS selections_pkey;
ALTER TABLE IF EXISTS ONLY public.selection_tasks DROP CONSTRAINT IF EXISTS selection_tasks_pkey;
ALTER TABLE IF EXISTS ONLY public.selection_task_baskets DROP CONSTRAINT IF EXISTS selection_task_baskets_pkey;
ALTER TABLE IF EXISTS ONLY public.selection_task_assignments DROP CONSTRAINT IF EXISTS selection_task_assignments_pkey;
ALTER TABLE IF EXISTS ONLY public.selection_source_baskets DROP CONSTRAINT IF EXISTS selection_source_baskets_pkey;
ALTER TABLE IF EXISTS ONLY public.selection_lot_references DROP CONSTRAINT IF EXISTS selection_lot_references_pkey;
ALTER TABLE IF EXISTS ONLY public.selection_destination_baskets DROP CONSTRAINT IF EXISTS selection_destination_baskets_pkey;
ALTER TABLE IF EXISTS ONLY public.selection_basket_history DROP CONSTRAINT IF EXISTS selection_basket_history_pkey;
ALTER TABLE IF EXISTS ONLY public.screening_source_baskets DROP CONSTRAINT IF EXISTS screening_source_baskets_pkey;
ALTER TABLE IF EXISTS ONLY public.screening_operations DROP CONSTRAINT IF EXISTS screening_operations_pkey;
ALTER TABLE IF EXISTS ONLY public.screening_lot_references DROP CONSTRAINT IF EXISTS screening_lot_references_pkey;
ALTER TABLE IF EXISTS ONLY public.screening_impact_analysis DROP CONSTRAINT IF EXISTS screening_impact_analysis_pkey;
ALTER TABLE IF EXISTS ONLY public.screening_destination_baskets DROP CONSTRAINT IF EXISTS screening_destination_baskets_pkey;
ALTER TABLE IF EXISTS ONLY public.screening_basket_history DROP CONSTRAINT IF EXISTS screening_basket_history_pkey;
ALTER TABLE IF EXISTS ONLY public.sale_operations_ref DROP CONSTRAINT IF EXISTS sale_operations_ref_pkey;
ALTER TABLE IF EXISTS ONLY public.sale_bags DROP CONSTRAINT IF EXISTS sale_bags_pkey;
ALTER TABLE IF EXISTS ONLY public.ordini_righe DROP CONSTRAINT IF EXISTS ordini_righe_pkey;
ALTER TABLE IF EXISTS ONLY public.ordini DROP CONSTRAINT IF EXISTS ordini_pkey;
ALTER TABLE IF EXISTS ONLY public.ordini DROP CONSTRAINT IF EXISTS ordini_fatture_in_cloud_id_key;
ALTER TABLE IF EXISTS ONLY public.operators DROP CONSTRAINT IF EXISTS operators_pkey;
ALTER TABLE IF EXISTS ONLY public.operators DROP CONSTRAINT IF EXISTS operators_operator_id_key;
ALTER TABLE IF EXISTS ONLY public.operations DROP CONSTRAINT IF EXISTS operations_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.notification_settings DROP CONSTRAINT IF EXISTS notification_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.mortality_rates DROP CONSTRAINT IF EXISTS mortality_rates_pkey;
ALTER TABLE IF EXISTS ONLY public.lots DROP CONSTRAINT IF EXISTS lots_pkey;
ALTER TABLE IF EXISTS ONLY public.lot_mortality_records DROP CONSTRAINT IF EXISTS lot_mortality_records_pkey;
ALTER TABLE IF EXISTS ONLY public.lot_ledger DROP CONSTRAINT IF EXISTS lot_ledger_pkey;
ALTER TABLE IF EXISTS ONLY public.lot_ledger DROP CONSTRAINT IF EXISTS lot_ledger_idempotency_key_unique;
ALTER TABLE IF EXISTS ONLY public.lot_inventory_transactions DROP CONSTRAINT IF EXISTS lot_inventory_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.lci_settings DROP CONSTRAINT IF EXISTS lci_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.lci_settings DROP CONSTRAINT IF EXISTS lci_settings_key_key;
ALTER TABLE IF EXISTS ONLY public.lci_reports DROP CONSTRAINT IF EXISTS lci_reports_pkey;
ALTER TABLE IF EXISTS ONLY public.lci_production_snapshots DROP CONSTRAINT IF EXISTS lci_production_snapshots_pkey;
ALTER TABLE IF EXISTS ONLY public.lci_materials DROP CONSTRAINT IF EXISTS lci_materials_pkey;
ALTER TABLE IF EXISTS ONLY public.lci_consumption_logs DROP CONSTRAINT IF EXISTS lci_consumption_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.lci_consumables DROP CONSTRAINT IF EXISTS lci_consumables_pkey;
ALTER TABLE IF EXISTS ONLY public.growth_distributions DROP CONSTRAINT IF EXISTS growth_distributions_pkey;
ALTER TABLE IF EXISTS ONLY public.growth_analysis_runs DROP CONSTRAINT IF EXISTS growth_analysis_runs_pkey;
ALTER TABLE IF EXISTS ONLY public.flupsys DROP CONSTRAINT IF EXISTS flupsys_pkey;
ALTER TABLE IF EXISTS ONLY public.fatture_in_cloud_config DROP CONSTRAINT IF EXISTS fatture_in_cloud_config_pkey;
ALTER TABLE IF EXISTS ONLY public.external_users DROP CONSTRAINT IF EXISTS external_users_username_key;
ALTER TABLE IF EXISTS ONLY public.external_users DROP CONSTRAINT IF EXISTS external_users_pkey;
ALTER TABLE IF EXISTS ONLY public.external_users DROP CONSTRAINT IF EXISTS external_users_delta_operator_id_key;
ALTER TABLE IF EXISTS ONLY public.external_sales_sync DROP CONSTRAINT IF EXISTS external_sales_sync_pkey;
ALTER TABLE IF EXISTS ONLY public.external_sales_sync DROP CONSTRAINT IF EXISTS external_sales_sync_external_id_unique;
ALTER TABLE IF EXISTS ONLY public.external_delivery_details_sync DROP CONSTRAINT IF EXISTS external_delivery_details_sync_pkey;
ALTER TABLE IF EXISTS ONLY public.external_delivery_details_sync DROP CONSTRAINT IF EXISTS external_delivery_details_sync_external_id_unique;
ALTER TABLE IF EXISTS ONLY public.external_deliveries_sync DROP CONSTRAINT IF EXISTS external_deliveries_sync_pkey;
ALTER TABLE IF EXISTS ONLY public.external_deliveries_sync DROP CONSTRAINT IF EXISTS external_deliveries_sync_external_id_unique;
ALTER TABLE IF EXISTS ONLY public.external_customers_sync DROP CONSTRAINT IF EXISTS external_customers_sync_pkey;
ALTER TABLE IF EXISTS ONLY public.external_customers_sync DROP CONSTRAINT IF EXISTS external_customers_sync_external_id_unique;
ALTER TABLE IF EXISTS ONLY public.email_config DROP CONSTRAINT IF EXISTS email_config_pkey;
ALTER TABLE IF EXISTS ONLY public.email_config DROP CONSTRAINT IF EXISTS email_config_key_unique;
ALTER TABLE IF EXISTS ONLY public.ddt_righe DROP CONSTRAINT IF EXISTS ddt_righe_pkey;
ALTER TABLE IF EXISTS ONLY public.ddt DROP CONSTRAINT IF EXISTS ddt_pkey;
ALTER TABLE IF EXISTS ONLY public.cycles DROP CONSTRAINT IF EXISTS cycles_pkey;
ALTER TABLE IF EXISTS ONLY public.configurazione DROP CONSTRAINT IF EXISTS configurazione_pkey;
ALTER TABLE IF EXISTS ONLY public.configurazione DROP CONSTRAINT IF EXISTS configurazione_chiave_unique;
ALTER TABLE IF EXISTS ONLY public.clienti DROP CONSTRAINT IF EXISTS clienti_pkey;
ALTER TABLE IF EXISTS ONLY public.baskets DROP CONSTRAINT IF EXISTS baskets_pkey;
ALTER TABLE IF EXISTS ONLY public.basket_lot_composition DROP CONSTRAINT IF EXISTS basket_lot_composition_pkey;
ALTER TABLE IF EXISTS ONLY public.basket_growth_profiles DROP CONSTRAINT IF EXISTS basket_growth_profiles_pkey;
ALTER TABLE IF EXISTS ONLY public.basket_groups DROP CONSTRAINT IF EXISTS basket_groups_pkey;
ALTER TABLE IF EXISTS ONLY public.bag_allocations DROP CONSTRAINT IF EXISTS bag_allocations_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.advanced_sales DROP CONSTRAINT IF EXISTS advanced_sales_sale_number_unique;
ALTER TABLE IF EXISTS ONLY public.advanced_sales DROP CONSTRAINT IF EXISTS advanced_sales_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.task_operators ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.target_size_annotations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sync_status ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sizes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sgr_per_taglia ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sgr_giornalieri ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sgr ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.selections ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.selection_tasks ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.selection_task_baskets ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.selection_task_assignments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.selection_source_baskets ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.selection_lot_references ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.selection_destination_baskets ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.selection_basket_history ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.screening_source_baskets ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.screening_operations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.screening_lot_references ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.screening_impact_analysis ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.screening_destination_baskets ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.screening_basket_history ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sale_operations_ref ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sale_bags ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ordini_righe ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ordini ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.operations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.notifications ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.notification_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.mortality_rates ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.lots ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.lot_mortality_records ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.lot_ledger ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.lot_inventory_transactions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.lci_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.lci_reports ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.lci_production_snapshots ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.lci_materials ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.lci_consumption_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.lci_consumables ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.growth_distributions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.growth_analysis_runs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.flupsys ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.fatture_in_cloud_config ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.external_users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.external_sales_sync ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.external_delivery_details_sync ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.external_deliveries_sync ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.external_customers_sync ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.email_config ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ddt_righe ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ddt ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.cycles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.configurazione ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.clienti ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.baskets ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.basket_lot_composition ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.basket_growth_profiles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.basket_groups ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.bag_allocations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.audit_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.advanced_sales ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.task_operators_id_seq;
DROP TABLE IF EXISTS public.task_operators;
DROP SEQUENCE IF EXISTS public.target_size_annotations_id_seq;
DROP TABLE IF EXISTS public.target_size_annotations;
DROP SEQUENCE IF EXISTS public.sync_status_id_seq;
DROP TABLE IF EXISTS public.sync_status;
DROP SEQUENCE IF EXISTS public.sizes_id_seq;
DROP TABLE IF EXISTS public.sizes;
DROP SEQUENCE IF EXISTS public.sgr_per_taglia_id_seq;
DROP TABLE IF EXISTS public.sgr_per_taglia;
DROP SEQUENCE IF EXISTS public.sgr_id_seq;
DROP SEQUENCE IF EXISTS public.sgr_giornalieri_id_seq;
DROP TABLE IF EXISTS public.sgr_giornalieri;
DROP TABLE IF EXISTS public.sgr;
DROP SEQUENCE IF EXISTS public.selections_id_seq;
DROP TABLE IF EXISTS public.selections;
DROP SEQUENCE IF EXISTS public.selection_tasks_id_seq;
DROP TABLE IF EXISTS public.selection_tasks;
DROP SEQUENCE IF EXISTS public.selection_task_baskets_id_seq;
DROP TABLE IF EXISTS public.selection_task_baskets;
DROP SEQUENCE IF EXISTS public.selection_task_assignments_id_seq;
DROP TABLE IF EXISTS public.selection_task_assignments;
DROP SEQUENCE IF EXISTS public.selection_source_baskets_id_seq;
DROP TABLE IF EXISTS public.selection_source_baskets;
DROP SEQUENCE IF EXISTS public.selection_lot_references_id_seq;
DROP TABLE IF EXISTS public.selection_lot_references;
DROP SEQUENCE IF EXISTS public.selection_destination_baskets_id_seq;
DROP TABLE IF EXISTS public.selection_destination_baskets;
DROP SEQUENCE IF EXISTS public.selection_basket_history_id_seq;
DROP TABLE IF EXISTS public.selection_basket_history;
DROP SEQUENCE IF EXISTS public.screening_source_baskets_id_seq;
DROP TABLE IF EXISTS public.screening_source_baskets;
DROP SEQUENCE IF EXISTS public.screening_operations_id_seq;
DROP TABLE IF EXISTS public.screening_operations;
DROP SEQUENCE IF EXISTS public.screening_lot_references_id_seq;
DROP TABLE IF EXISTS public.screening_lot_references;
DROP SEQUENCE IF EXISTS public.screening_impact_analysis_id_seq;
DROP TABLE IF EXISTS public.screening_impact_analysis;
DROP SEQUENCE IF EXISTS public.screening_destination_baskets_id_seq;
DROP TABLE IF EXISTS public.screening_destination_baskets;
DROP SEQUENCE IF EXISTS public.screening_basket_history_id_seq;
DROP TABLE IF EXISTS public.screening_basket_history;
DROP SEQUENCE IF EXISTS public.sale_operations_ref_id_seq;
DROP TABLE IF EXISTS public.sale_operations_ref;
DROP SEQUENCE IF EXISTS public.sale_bags_id_seq;
DROP TABLE IF EXISTS public.sale_bags;
DROP SEQUENCE IF EXISTS public.ordini_righe_id_seq;
DROP TABLE IF EXISTS public.ordini_righe;
DROP SEQUENCE IF EXISTS public.ordini_id_seq;
DROP TABLE IF EXISTS public.ordini;
DROP TABLE IF EXISTS public.operators;
DROP SEQUENCE IF EXISTS public.operations_id_seq;
DROP TABLE IF EXISTS public.operations_backup_mortalita;
DROP TABLE IF EXISTS public.operations;
DROP SEQUENCE IF EXISTS public.notifications_id_seq;
DROP TABLE IF EXISTS public.notifications;
DROP SEQUENCE IF EXISTS public.notification_settings_id_seq;
DROP TABLE IF EXISTS public.notification_settings;
DROP SEQUENCE IF EXISTS public.mortality_rates_id_seq;
DROP TABLE IF EXISTS public.mortality_rates;
DROP SEQUENCE IF EXISTS public.lots_id_seq;
DROP TABLE IF EXISTS public.lots;
DROP SEQUENCE IF EXISTS public.lot_mortality_records_id_seq;
DROP TABLE IF EXISTS public.lot_mortality_records;
DROP SEQUENCE IF EXISTS public.lot_ledger_id_seq;
DROP TABLE IF EXISTS public.lot_ledger;
DROP SEQUENCE IF EXISTS public.lot_inventory_transactions_id_seq;
DROP TABLE IF EXISTS public.lot_inventory_transactions;
DROP SEQUENCE IF EXISTS public.lci_settings_id_seq;
DROP TABLE IF EXISTS public.lci_settings;
DROP SEQUENCE IF EXISTS public.lci_reports_id_seq;
DROP TABLE IF EXISTS public.lci_reports;
DROP SEQUENCE IF EXISTS public.lci_production_snapshots_id_seq;
DROP TABLE IF EXISTS public.lci_production_snapshots;
DROP SEQUENCE IF EXISTS public.lci_materials_id_seq;
DROP TABLE IF EXISTS public.lci_materials;
DROP SEQUENCE IF EXISTS public.lci_consumption_logs_id_seq;
DROP TABLE IF EXISTS public.lci_consumption_logs;
DROP SEQUENCE IF EXISTS public.lci_consumables_id_seq;
DROP TABLE IF EXISTS public.lci_consumables;
DROP SEQUENCE IF EXISTS public.growth_distributions_id_seq;
DROP TABLE IF EXISTS public.growth_distributions;
DROP SEQUENCE IF EXISTS public.growth_analysis_runs_id_seq;
DROP TABLE IF EXISTS public.growth_analysis_runs;
DROP SEQUENCE IF EXISTS public.flupsys_id_seq;
DROP TABLE IF EXISTS public.flupsys;
DROP SEQUENCE IF EXISTS public.fatture_in_cloud_config_id_seq;
DROP TABLE IF EXISTS public.fatture_in_cloud_config;
DROP SEQUENCE IF EXISTS public.external_users_id_seq;
DROP TABLE IF EXISTS public.external_users;
DROP SEQUENCE IF EXISTS public.external_sales_sync_id_seq;
DROP TABLE IF EXISTS public.external_sales_sync;
DROP SEQUENCE IF EXISTS public.external_delivery_details_sync_id_seq;
DROP TABLE IF EXISTS public.external_delivery_details_sync;
DROP SEQUENCE IF EXISTS public.external_deliveries_sync_id_seq;
DROP TABLE IF EXISTS public.external_deliveries_sync;
DROP SEQUENCE IF EXISTS public.external_customers_sync_id_seq;
DROP TABLE IF EXISTS public.external_customers_sync;
DROP SEQUENCE IF EXISTS public.email_config_id_seq;
DROP TABLE IF EXISTS public.email_config;
DROP SEQUENCE IF EXISTS public.ddt_righe_id_seq;
DROP TABLE IF EXISTS public.ddt_righe;
DROP SEQUENCE IF EXISTS public.ddt_id_seq;
DROP TABLE IF EXISTS public.ddt;
DROP SEQUENCE IF EXISTS public.cycles_id_seq;
DROP TABLE IF EXISTS public.cycles;
DROP SEQUENCE IF EXISTS public.configurazione_id_seq;
DROP TABLE IF EXISTS public.configurazione;
DROP SEQUENCE IF EXISTS public.clienti_id_seq;
DROP TABLE IF EXISTS public.clienti;
DROP SEQUENCE IF EXISTS public.baskets_id_seq;
DROP TABLE IF EXISTS public.baskets;
DROP SEQUENCE IF EXISTS public.basket_lot_composition_id_seq;
DROP TABLE IF EXISTS public.basket_lot_composition;
DROP SEQUENCE IF EXISTS public.basket_growth_profiles_id_seq;
DROP TABLE IF EXISTS public.basket_growth_profiles;
DROP SEQUENCE IF EXISTS public.basket_groups_id_seq;
DROP TABLE IF EXISTS public.basket_groups;
DROP SEQUENCE IF EXISTS public.bag_allocations_id_seq;
DROP TABLE IF EXISTS public.bag_allocations;
DROP SEQUENCE IF EXISTS public.audit_logs_id_seq;
DROP TABLE IF EXISTS public.audit_logs;
DROP SEQUENCE IF EXISTS public.advanced_sales_id_seq;
DROP TABLE IF EXISTS public.advanced_sales;
DROP TABLE IF EXISTS public._backup_weights_20251201;
DROP FUNCTION IF EXISTS public.protect_mixed_lot_metadata();
DROP FUNCTION IF EXISTS public.prevent_size_range_modification();
DROP FUNCTION IF EXISTS public.enrich_mixed_lot_metadata();
DROP FUNCTION IF EXISTS public.enforce_basket_state_triplet();
DROP FUNCTION IF EXISTS public.check_task_completion();
DROP SCHEMA IF EXISTS public;
--
-- TOC entry 4 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- TOC entry 342 (class 1255 OID 851968)
-- Name: check_task_completion(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_task_completion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Solo se l'assignment è stato completato
  IF NEW.status = 'completed' THEN
    -- Controlla se tutti gli assignment del task sono completati
    IF NOT EXISTS (
      SELECT 1 FROM selection_task_assignments 
      WHERE task_id = NEW.task_id 
      AND status != 'completed'
    ) THEN
      -- Aggiorna il task come completato
      UPDATE selection_tasks
      SET status = 'completed',
          completed_at = NOW(),
          updated_at = NOW()
      WHERE id = NEW.task_id
      AND status != 'completed';  -- Solo se non già completato
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- TOC entry 357 (class 1255 OID 1040384)
-- Name: enforce_basket_state_triplet(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_basket_state_triplet() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Verifica se uno dei tre campi viene modificato
  IF (OLD.state IS DISTINCT FROM NEW.state) OR 
     (OLD.current_cycle_id IS DISTINCT FROM NEW.current_cycle_id) OR 
     (OLD.cycle_code IS DISTINCT FROM NEW.cycle_code) THEN
    
    -- CASO 1: Attivazione cestello (state = 'active')
    -- Richiede: currentCycleId NOT NULL, cycleCode NOT NULL
    IF NEW.state = 'active' THEN
      IF NEW.current_cycle_id IS NULL THEN
        RAISE EXCEPTION 'BASKET_STATE_TRIPLET_VIOLATION: Cestello attivo richiede current_cycle_id (basket_id=%)', NEW.id;
      END IF;
      IF NEW.cycle_code IS NULL OR NEW.cycle_code = '' THEN
        RAISE EXCEPTION 'BASKET_STATE_TRIPLET_VIOLATION: Cestello attivo richiede cycle_code (basket_id=%)', NEW.id;
      END IF;
    END IF;
    
    -- CASO 2: Liberazione cestello (state = 'available' o 'disponibile')
    -- Richiede: currentCycleId NULL, cycleCode NULL
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
$$;


--
-- TOC entry 355 (class 1255 OID 425984)
-- Name: enrich_mixed_lot_metadata(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enrich_mixed_lot_metadata() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_lot_count INTEGER;
  v_composition JSONB;
  v_notes_lotti TEXT;
  v_notes_operatore TEXT;
  v_metadata JSONB;
  v_dominant_lot_id INTEGER;
  v_lot_record RECORD;
BEGIN
  -- ========================================
  -- STEP 1: Calcolo Campi Derivati (SEMPRE)
  -- ========================================
  
  -- Calcola average_weight SOLO se valori validi (>0)
  IF (NEW.total_weight IS NOT NULL AND NEW.total_weight > 0 
      AND NEW.animal_count IS NOT NULL AND NEW.animal_count > 0) THEN
    NEW.average_weight := (NEW.total_weight * 1000.0) / NEW.animal_count;
  END IF;
  
  -- Calcola animals_per_kg SOLO se non specificato e valori validi (>0)
  IF (NEW.animals_per_kg IS NULL 
      AND NEW.total_weight IS NOT NULL AND NEW.total_weight > 0
      AND NEW.animal_count IS NOT NULL AND NEW.animal_count > 0) THEN
    NEW.animals_per_kg := ROUND((NEW.animal_count::numeric / NEW.total_weight) * 1000);
  END IF;
  
  -- ========================================
  -- STEP 2: Arricchimento Metadata Lotti Misti
  -- ========================================
  
  IF (NEW.type IN ('peso', 'misura', 'prima-attivazione') AND NEW.basket_id IS NOT NULL) THEN
    
    SELECT COUNT(*) INTO v_lot_count
    FROM basket_lot_composition
    WHERE basket_id = NEW.basket_id;
    
    IF v_lot_count > 1 THEN
      
      -- Costruisci array composition
      SELECT jsonb_agg(
        jsonb_build_object(
          'lotId', blc.lot_id,
          'percentage', blc.percentage,
          'animalCount', blc.animal_count
        ) ORDER BY blc.percentage DESC
      ) INTO v_composition
      FROM basket_lot_composition blc
      WHERE blc.basket_id = NEW.basket_id;
      
      -- Identifica lotto dominante
      SELECT lot_id INTO v_dominant_lot_id
      FROM basket_lot_composition
      WHERE basket_id = NEW.basket_id
      ORDER BY percentage DESC
      LIMIT 1;
      
      -- Costruisci metadata JSON
      v_metadata := jsonb_build_object(
        'isMixed', true,
        'dominantLot', v_dominant_lot_id,
        'lotCount', v_lot_count,
        'composition', v_composition
      );
      
      -- Costruisci note leggibili composizione lotti
      v_notes_lotti := 'LOTTO MISTO: ';
      
      FOR v_lot_record IN
        SELECT 
          blc.lot_id,
          blc.percentage,
          blc.animal_count,
          COALESCE(l.supplier, 'Lotto ' || blc.lot_id) AS lot_name
        FROM basket_lot_composition blc
        LEFT JOIN lots l ON blc.lot_id = l.id
        WHERE blc.basket_id = NEW.basket_id
        ORDER BY blc.percentage DESC
      LOOP
        v_notes_lotti := v_notes_lotti || v_lot_record.lot_name || 
                   ' (' || ROUND((v_lot_record.percentage * 100)::numeric, 1) || '% - ' || 
                   v_lot_record.animal_count || ' animali)';
        
        IF v_lot_record.lot_id != (
          SELECT lot_id FROM basket_lot_composition 
          WHERE basket_id = NEW.basket_id 
          ORDER BY percentage ASC LIMIT 1
        ) THEN
          v_notes_lotti := v_notes_lotti || ' + ';
        END IF;
      END LOOP;
      
      -- ⭐ PRESERVA NOTE OPERATORE (se presenti)
      IF NEW.notes IS NOT NULL AND TRIM(NEW.notes) != '' THEN
        -- Combina: "Note operatore | LOTTO MISTO: ..."
        NEW.notes := TRIM(NEW.notes) || ' | ' || v_notes_lotti;
      ELSE
        -- Solo info lotti
        NEW.notes := v_notes_lotti;
      END IF;
      
      NEW.metadata := v_metadata;
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- TOC entry 356 (class 1255 OID 909317)
-- Name: prevent_size_range_modification(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prevent_size_range_modification() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  operations_count INTEGER;
BEGIN
  -- Controlla se ci sono operazioni che usano questa taglia
  SELECT COUNT(*) INTO operations_count
  FROM operations 
  WHERE size_id = NEW.id;
  
  -- Se ci sono operazioni collegate
  IF operations_count > 0 THEN
    -- Impedisci modifiche ai range critici
    IF (OLD.min_animals_per_kg IS DISTINCT FROM NEW.min_animals_per_kg) OR
       (OLD.max_animals_per_kg IS DISTINCT FROM NEW.max_animals_per_kg) THEN
      RAISE EXCEPTION '⛔ PROTEZIONE DATI: Impossibile modificare i range di una taglia con operazioni esistenti.

Taglia: % (ID: %)
Operazioni collegate: %

I range (minAnimalsPerKg/maxAnimalsPerKg) sono protetti per garantire l''integrità storica dei dati.

Per correggere errori:
1. Contatta l''amministratore di sistema
2. Oppure crea una nuova taglia con i range corretti

Modifiche consentite: nome, colore, note (non impattano i calcoli)',
        NEW.code,
        NEW.id,
        operations_count;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- TOC entry 343 (class 1255 OID 425986)
-- Name: protect_mixed_lot_metadata(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_mixed_lot_metadata() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Se metadata e notes sono già popolati (cestello misto), preservali
  -- Impedisci che UPDATE li sovrascriva con NULL o altri valori
  IF (OLD.metadata IS NOT NULL AND OLD.notes IS NOT NULL) THEN
    -- Preserva i valori originali del trigger INSERT
    NEW.metadata := OLD.metadata;
    NEW.notes := OLD.notes;
  END IF;
  
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- TOC entry 340 (class 1259 OID 1081344)
-- Name: _backup_weights_20251201; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._backup_weights_20251201 (
    id integer,
    original_weight real
);


--
-- TOC entry 216 (class 1259 OID 16479)
-- Name: advanced_sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.advanced_sales (
    id integer NOT NULL,
    sale_number text NOT NULL,
    customer_id integer,
    customer_name text,
    customer_details jsonb,
    sale_date date NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    total_weight real,
    total_animals integer,
    total_bags integer,
    notes text,
    pdf_path text,
    ddt_id integer,
    ddt_status text DEFAULT 'nessuno'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone,
    company_id integer
);


--
-- TOC entry 215 (class 1259 OID 16478)
-- Name: advanced_sales_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.advanced_sales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4210 (class 0 OID 0)
-- Dependencies: 215
-- Name: advanced_sales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.advanced_sales_id_seq OWNED BY public.advanced_sales.id;


--
-- TOC entry 339 (class 1259 OID 1048577)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now(),
    action character varying(50) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id integer,
    user_id integer,
    user_source character varying(50),
    old_values jsonb,
    new_values jsonb,
    metadata jsonb,
    ip_address character varying(45),
    user_agent text
);


--
-- TOC entry 338 (class 1259 OID 1048576)
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4211 (class 0 OID 0)
-- Dependencies: 338
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- TOC entry 218 (class 1259 OID 16493)
-- Name: bag_allocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bag_allocations (
    id integer NOT NULL,
    sale_bag_id integer NOT NULL,
    source_operation_id integer NOT NULL,
    source_basket_id integer NOT NULL,
    allocated_animals integer NOT NULL,
    allocated_weight real NOT NULL,
    source_animals_per_kg real,
    source_size_code text
);


--
-- TOC entry 217 (class 1259 OID 16492)
-- Name: bag_allocations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bag_allocations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4212 (class 0 OID 0)
-- Dependencies: 217
-- Name: bag_allocations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bag_allocations_id_seq OWNED BY public.bag_allocations.id;


--
-- TOC entry 325 (class 1259 OID 925697)
-- Name: basket_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.basket_groups (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    color character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    purpose text,
    highlight_order integer DEFAULT 0,
    updated_at timestamp without time zone
);


--
-- TOC entry 324 (class 1259 OID 925696)
-- Name: basket_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.basket_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4213 (class 0 OID 0)
-- Dependencies: 324
-- Name: basket_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.basket_groups_id_seq OWNED BY public.basket_groups.id;


--
-- TOC entry 304 (class 1259 OID 393228)
-- Name: basket_growth_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.basket_growth_profiles (
    id integer NOT NULL,
    basket_id integer NOT NULL,
    analysis_run_id integer,
    growth_cluster text,
    sgr_deviation real,
    confidence_score real,
    influencing_factors jsonb,
    position_score real,
    density_score real,
    supplier_score real,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


--
-- TOC entry 303 (class 1259 OID 393227)
-- Name: basket_growth_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.basket_growth_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4214 (class 0 OID 0)
-- Dependencies: 303
-- Name: basket_growth_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.basket_growth_profiles_id_seq OWNED BY public.basket_growth_profiles.id;


--
-- TOC entry 220 (class 1259 OID 16502)
-- Name: basket_lot_composition; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.basket_lot_composition (
    id integer NOT NULL,
    basket_id integer NOT NULL,
    cycle_id integer NOT NULL,
    lot_id integer NOT NULL,
    animal_count integer NOT NULL,
    percentage real NOT NULL,
    source_selection_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    notes text
);


--
-- TOC entry 219 (class 1259 OID 16501)
-- Name: basket_lot_composition_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.basket_lot_composition_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4215 (class 0 OID 0)
-- Dependencies: 219
-- Name: basket_lot_composition_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.basket_lot_composition_id_seq OWNED BY public.basket_lot_composition.id;


--
-- TOC entry 222 (class 1259 OID 16512)
-- Name: baskets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.baskets (
    id integer NOT NULL,
    physical_number integer NOT NULL,
    flupsy_id integer NOT NULL,
    cycle_code text,
    state text DEFAULT 'available'::text NOT NULL,
    current_cycle_id integer,
    nfc_data text,
    "row" text NOT NULL,
    "position" integer NOT NULL,
    nfc_last_programmed_at timestamp without time zone,
    group_id integer
);


--
-- TOC entry 221 (class 1259 OID 16511)
-- Name: baskets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.baskets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4216 (class 0 OID 0)
-- Dependencies: 221
-- Name: baskets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.baskets_id_seq OWNED BY public.baskets.id;


--
-- TOC entry 224 (class 1259 OID 16522)
-- Name: clienti; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clienti (
    id integer NOT NULL,
    denominazione text NOT NULL,
    indirizzo text DEFAULT 'N/A'::text NOT NULL,
    comune text DEFAULT 'N/A'::text NOT NULL,
    cap text DEFAULT 'N/A'::text NOT NULL,
    provincia text DEFAULT 'N/A'::text NOT NULL,
    paese text DEFAULT 'Italia'::text NOT NULL,
    email text DEFAULT 'N/A'::text NOT NULL,
    telefono text DEFAULT 'N/A'::text NOT NULL,
    piva text DEFAULT 'N/A'::text NOT NULL,
    codice_fiscale text DEFAULT 'N/A'::text NOT NULL,
    fatture_in_cloud_id integer,
    attivo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


--
-- TOC entry 223 (class 1259 OID 16521)
-- Name: clienti_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clienti_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4217 (class 0 OID 0)
-- Dependencies: 223
-- Name: clienti_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clienti_id_seq OWNED BY public.clienti.id;


--
-- TOC entry 226 (class 1259 OID 16542)
-- Name: configurazione; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configurazione (
    id integer NOT NULL,
    chiave text NOT NULL,
    valore text,
    descrizione text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 225 (class 1259 OID 16541)
-- Name: configurazione_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.configurazione_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4218 (class 0 OID 0)
-- Dependencies: 225
-- Name: configurazione_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.configurazione_id_seq OWNED BY public.configurazione.id;


--
-- TOC entry 228 (class 1259 OID 16555)
-- Name: cycles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cycles (
    id integer NOT NULL,
    basket_id integer NOT NULL,
    lot_id integer,
    start_date date NOT NULL,
    end_date date,
    state text DEFAULT 'active'::text NOT NULL
);


--
-- TOC entry 227 (class 1259 OID 16554)
-- Name: cycles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cycles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4219 (class 0 OID 0)
-- Dependencies: 227
-- Name: cycles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cycles_id_seq OWNED BY public.cycles.id;


--
-- TOC entry 230 (class 1259 OID 16565)
-- Name: ddt; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ddt (
    id integer NOT NULL,
    numero integer NOT NULL,
    data date NOT NULL,
    cliente_id integer NOT NULL,
    cliente_nome text,
    cliente_indirizzo text,
    cliente_citta text,
    cliente_cap text,
    cliente_provincia text,
    cliente_piva text,
    cliente_codice_fiscale text,
    cliente_paese text DEFAULT 'Italia'::text,
    company_id integer,
    mittente_ragione_sociale text,
    mittente_indirizzo text,
    mittente_cap text,
    mittente_citta text,
    mittente_provincia text,
    mittente_partita_iva text,
    mittente_codice_fiscale text,
    mittente_telefono text,
    mittente_email text,
    mittente_logo_path text,
    totale_colli integer DEFAULT 0 NOT NULL,
    peso_totale numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    note text,
    ddt_stato text DEFAULT 'nessuno'::text NOT NULL,
    fatture_in_cloud_id integer,
    fatture_in_cloud_numero text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


--
-- TOC entry 229 (class 1259 OID 16564)
-- Name: ddt_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ddt_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4220 (class 0 OID 0)
-- Dependencies: 229
-- Name: ddt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ddt_id_seq OWNED BY public.ddt.id;


--
-- TOC entry 232 (class 1259 OID 16579)
-- Name: ddt_righe; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ddt_righe (
    id integer NOT NULL,
    ddt_id integer NOT NULL,
    descrizione text NOT NULL,
    quantita numeric(10,2) NOT NULL,
    unita_misura text DEFAULT 'NR'::text NOT NULL,
    prezzo_unitario numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    report_dettaglio_id integer,
    advanced_sale_id integer,
    sale_bag_id integer,
    basket_id integer,
    size_code text,
    flupsy_name text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 231 (class 1259 OID 16578)
-- Name: ddt_righe_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ddt_righe_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4221 (class 0 OID 0)
-- Dependencies: 231
-- Name: ddt_righe_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ddt_righe_id_seq OWNED BY public.ddt_righe.id;


--
-- TOC entry 234 (class 1259 OID 16591)
-- Name: email_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_config (
    id integer NOT NULL,
    key text NOT NULL,
    value text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


--
-- TOC entry 233 (class 1259 OID 16590)
-- Name: email_config_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4222 (class 0 OID 0)
-- Dependencies: 233
-- Name: email_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_config_id_seq OWNED BY public.email_config.id;


--
-- TOC entry 236 (class 1259 OID 16603)
-- Name: external_customers_sync; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.external_customers_sync (
    id integer NOT NULL,
    external_id integer NOT NULL,
    customer_code text NOT NULL,
    customer_name text NOT NULL,
    customer_type text,
    vat_number text,
    tax_code text,
    address text,
    city text,
    province text,
    postal_code text,
    country text DEFAULT 'IT'::text,
    phone text,
    email text,
    is_active boolean DEFAULT true,
    notes text,
    synced_at timestamp without time zone DEFAULT now() NOT NULL,
    last_modified_external timestamp without time zone
);


--
-- TOC entry 235 (class 1259 OID 16602)
-- Name: external_customers_sync_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.external_customers_sync_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4223 (class 0 OID 0)
-- Dependencies: 235
-- Name: external_customers_sync_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.external_customers_sync_id_seq OWNED BY public.external_customers_sync.id;


--
-- TOC entry 238 (class 1259 OID 16617)
-- Name: external_deliveries_sync; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.external_deliveries_sync (
    id integer NOT NULL,
    external_id integer NOT NULL,
    data_creazione text NOT NULL,
    cliente_id integer,
    ordine_id integer,
    data_consegna text NOT NULL,
    stato text,
    numero_totale_ceste integer NOT NULL,
    peso_totale_kg numeric(12,3) NOT NULL,
    totale_animali integer NOT NULL,
    taglia_media text,
    qrcode_url text,
    note text,
    numero_progressivo integer,
    synced_at timestamp without time zone DEFAULT now() NOT NULL,
    last_sync_at text,
    last_modified_external timestamp without time zone
);


--
-- TOC entry 237 (class 1259 OID 16616)
-- Name: external_deliveries_sync_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.external_deliveries_sync_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4224 (class 0 OID 0)
-- Dependencies: 237
-- Name: external_deliveries_sync_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.external_deliveries_sync_id_seq OWNED BY public.external_deliveries_sync.id;


--
-- TOC entry 240 (class 1259 OID 16629)
-- Name: external_delivery_details_sync; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.external_delivery_details_sync (
    id integer NOT NULL,
    external_id integer NOT NULL,
    report_id integer NOT NULL,
    misurazione_id integer,
    vasca_id integer NOT NULL,
    codice_sezione text NOT NULL,
    numero_ceste integer NOT NULL,
    peso_ceste_kg numeric(12,3) NOT NULL,
    taglia text,
    animali_per_kg numeric(10,3),
    percentuale_scarto numeric(5,2),
    percentuale_mortalita numeric(5,2),
    numero_animali integer NOT NULL,
    note text,
    synced_at timestamp without time zone DEFAULT now() NOT NULL,
    last_sync_at text,
    last_modified_external timestamp without time zone
);


--
-- TOC entry 239 (class 1259 OID 16628)
-- Name: external_delivery_details_sync_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.external_delivery_details_sync_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4225 (class 0 OID 0)
-- Dependencies: 239
-- Name: external_delivery_details_sync_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.external_delivery_details_sync_id_seq OWNED BY public.external_delivery_details_sync.id;


--
-- TOC entry 242 (class 1259 OID 16641)
-- Name: external_sales_sync; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.external_sales_sync (
    id integer NOT NULL,
    external_id integer NOT NULL,
    sale_number text NOT NULL,
    sale_date date NOT NULL,
    customer_id integer,
    customer_name text,
    product_code text,
    product_name text NOT NULL,
    product_category text,
    quantity numeric(12,3) NOT NULL,
    unit_of_measure text DEFAULT 'kg'::text,
    unit_price numeric(10,4),
    total_amount numeric(12,2) NOT NULL,
    discount_percent numeric(5,2) DEFAULT '0'::numeric,
    discount_amount numeric(10,2) DEFAULT '0'::numeric,
    net_amount numeric(12,2) NOT NULL,
    vat_percent numeric(5,2) DEFAULT '22'::numeric,
    vat_amount numeric(10,2) DEFAULT '0'::numeric,
    total_with_vat numeric(12,2) NOT NULL,
    payment_method text,
    delivery_date date,
    origin text,
    lot_reference text,
    sales_person text,
    notes text,
    status text DEFAULT 'completed'::text,
    synced_at timestamp without time zone DEFAULT now() NOT NULL,
    last_modified_external timestamp without time zone
);


--
-- TOC entry 241 (class 1259 OID 16640)
-- Name: external_sales_sync_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.external_sales_sync_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4226 (class 0 OID 0)
-- Dependencies: 241
-- Name: external_sales_sync_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.external_sales_sync_id_seq OWNED BY public.external_sales_sync.id;


--
-- TOC entry 323 (class 1259 OID 811009)
-- Name: external_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.external_users (
    id integer NOT NULL,
    delta_operator_id integer NOT NULL,
    username character varying(100) NOT NULL,
    hashed_password text NOT NULL,
    temp_password_token character varying(255),
    temp_password_expires_at timestamp without time zone,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text,
    phone text,
    role text,
    is_active boolean DEFAULT true NOT NULL,
    last_sync_at timestamp without time zone DEFAULT now() NOT NULL,
    sync_version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


--
-- TOC entry 322 (class 1259 OID 811008)
-- Name: external_users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.external_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4227 (class 0 OID 0)
-- Dependencies: 322
-- Name: external_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.external_users_id_seq OWNED BY public.external_users.id;


--
-- TOC entry 244 (class 1259 OID 16659)
-- Name: fatture_in_cloud_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fatture_in_cloud_config (
    id integer NOT NULL,
    api_key text,
    api_uid text,
    company_id integer,
    access_token text,
    refresh_token text,
    expires_at timestamp without time zone,
    token_type text DEFAULT 'Bearer'::text,
    default_payment_method text,
    default_causale_trasporto text DEFAULT 'Vendita'::text,
    default_aspetto_beni text DEFAULT 'Colli'::text,
    default_porto text DEFAULT 'Franco'::text,
    numerazione_automatica boolean DEFAULT true,
    prefisso_numero text,
    invio_email_automatico boolean DEFAULT false,
    email_mittente text,
    email_oggetto_template text,
    email_corpo_template text,
    attivo boolean DEFAULT true,
    ragione_sociale text,
    indirizzo text,
    cap text,
    citta text,
    provincia text,
    partita_iva text,
    codice_fiscale text,
    telefono text,
    email text,
    logo_path text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 243 (class 1259 OID 16658)
-- Name: fatture_in_cloud_config_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fatture_in_cloud_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4228 (class 0 OID 0)
-- Dependencies: 243
-- Name: fatture_in_cloud_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fatture_in_cloud_config_id_seq OWNED BY public.fatture_in_cloud_config.id;


--
-- TOC entry 246 (class 1259 OID 16677)
-- Name: flupsys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flupsys (
    id integer NOT NULL,
    name text NOT NULL,
    location text,
    description text,
    active boolean DEFAULT true NOT NULL,
    max_positions integer DEFAULT 10 NOT NULL,
    production_center text,
    latitude real,
    longitude real,
    geo_radius integer DEFAULT 50
);


--
-- TOC entry 245 (class 1259 OID 16676)
-- Name: flupsys_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.flupsys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4229 (class 0 OID 0)
-- Dependencies: 245
-- Name: flupsys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.flupsys_id_seq OWNED BY public.flupsys.id;


--
-- TOC entry 302 (class 1259 OID 393217)
-- Name: growth_analysis_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.growth_analysis_runs (
    id integer NOT NULL,
    executed_at timestamp without time zone DEFAULT now() NOT NULL,
    date_from date,
    date_to date,
    flupsy_ids text,
    analysis_types text,
    status text DEFAULT 'completed'::text NOT NULL,
    dataset_size integer,
    results jsonb,
    insights text[],
    error_message text
);


--
-- TOC entry 301 (class 1259 OID 393216)
-- Name: growth_analysis_runs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.growth_analysis_runs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4230 (class 0 OID 0)
-- Dependencies: 301
-- Name: growth_analysis_runs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.growth_analysis_runs_id_seq OWNED BY public.growth_analysis_runs.id;


--
-- TOC entry 308 (class 1259 OID 393248)
-- Name: growth_distributions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.growth_distributions (
    id integer NOT NULL,
    analysis_run_id integer,
    size_id integer,
    lot_id integer,
    month integer,
    year integer,
    sample_size integer,
    mean_sgr real,
    median_sgr real,
    std_deviation real,
    percentile_25 real,
    percentile_50 real,
    percentile_75 real,
    percentile_90 real,
    min_sgr real,
    max_sgr real,
    distribution_type text,
    raw_data jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 307 (class 1259 OID 393247)
-- Name: growth_distributions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.growth_distributions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4231 (class 0 OID 0)
-- Dependencies: 307
-- Name: growth_distributions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.growth_distributions_id_seq OWNED BY public.growth_distributions.id;


--
-- TOC entry 329 (class 1259 OID 1024014)
-- Name: lci_consumables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lci_consumables (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    category character varying(100) NOT NULL,
    unit character varying(20) NOT NULL,
    ecoinvent_process text,
    default_annual_amount numeric(15,3),
    notes text,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 328 (class 1259 OID 1024013)
-- Name: lci_consumables_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lci_consumables_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4232 (class 0 OID 0)
-- Dependencies: 328
-- Name: lci_consumables_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lci_consumables_id_seq OWNED BY public.lci_consumables.id;


--
-- TOC entry 331 (class 1259 OID 1024025)
-- Name: lci_consumption_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lci_consumption_logs (
    id integer NOT NULL,
    consumable_id integer NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    amount numeric(15,3) NOT NULL,
    source character varying(50) DEFAULT 'manual'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    created_by integer
);


--
-- TOC entry 330 (class 1259 OID 1024024)
-- Name: lci_consumption_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lci_consumption_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4233 (class 0 OID 0)
-- Dependencies: 330
-- Name: lci_consumption_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lci_consumption_logs_id_seq OWNED BY public.lci_consumption_logs.id;


--
-- TOC entry 327 (class 1259 OID 1024001)
-- Name: lci_materials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lci_materials (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    category character varying(100) NOT NULL,
    material_type character varying(100),
    expected_life_years numeric(5,2),
    disposal_method text,
    quantity integer DEFAULT 1,
    unit character varying(20) DEFAULT 'pc'::character varying,
    unit_weight_kg numeric(10,3),
    flupsy_reference character varying(100),
    installation_date date,
    notes text,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone
);


--
-- TOC entry 326 (class 1259 OID 1024000)
-- Name: lci_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lci_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4234 (class 0 OID 0)
-- Dependencies: 326
-- Name: lci_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lci_materials_id_seq OWNED BY public.lci_materials.id;


--
-- TOC entry 333 (class 1259 OID 1024036)
-- Name: lci_production_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lci_production_snapshots (
    id integer NOT NULL,
    reference_year integer NOT NULL,
    reference_period character varying(50) NOT NULL,
    size_code character varying(20),
    output_kg numeric(15,3),
    output_pieces bigint,
    input_kg numeric(15,3),
    input_pieces bigint,
    data_source character varying(50) DEFAULT 'calculated'::character varying,
    calculation_notes text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 332 (class 1259 OID 1024035)
-- Name: lci_production_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lci_production_snapshots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4235 (class 0 OID 0)
-- Dependencies: 332
-- Name: lci_production_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lci_production_snapshots_id_seq OWNED BY public.lci_production_snapshots.id;


--
-- TOC entry 335 (class 1259 OID 1024047)
-- Name: lci_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lci_reports (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    reference_year integer NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying,
    excel_path text,
    report_data jsonb,
    ai_insights jsonb,
    created_at timestamp without time zone DEFAULT now(),
    finalized_at timestamp without time zone,
    exported_at timestamp without time zone
);


--
-- TOC entry 334 (class 1259 OID 1024046)
-- Name: lci_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lci_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4236 (class 0 OID 0)
-- Dependencies: 334
-- Name: lci_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lci_reports_id_seq OWNED BY public.lci_reports.id;


--
-- TOC entry 337 (class 1259 OID 1024058)
-- Name: lci_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lci_settings (
    id integer NOT NULL,
    key character varying(100) NOT NULL,
    value jsonb,
    description text,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 336 (class 1259 OID 1024057)
-- Name: lci_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lci_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4237 (class 0 OID 0)
-- Dependencies: 336
-- Name: lci_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lci_settings_id_seq OWNED BY public.lci_settings.id;


--
-- TOC entry 248 (class 1259 OID 16688)
-- Name: lot_inventory_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lot_inventory_transactions (
    id integer NOT NULL,
    lot_id integer NOT NULL,
    date date NOT NULL,
    transaction_type text NOT NULL,
    animal_count integer NOT NULL,
    basket_id integer,
    operation_id integer,
    selection_id integer,
    screening_id integer,
    notes text,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by text
);


--
-- TOC entry 247 (class 1259 OID 16687)
-- Name: lot_inventory_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lot_inventory_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4238 (class 0 OID 0)
-- Dependencies: 247
-- Name: lot_inventory_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lot_inventory_transactions_id_seq OWNED BY public.lot_inventory_transactions.id;


--
-- TOC entry 250 (class 1259 OID 16698)
-- Name: lot_ledger; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lot_ledger (
    id integer NOT NULL,
    date date NOT NULL,
    lot_id integer NOT NULL,
    type text NOT NULL,
    quantity numeric(18,3) NOT NULL,
    source_cycle_id integer,
    dest_cycle_id integer,
    selection_id integer,
    operation_id integer,
    basket_id integer,
    allocation_method text DEFAULT 'proportional'::text NOT NULL,
    allocation_basis jsonb,
    idempotency_key text,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 249 (class 1259 OID 16697)
-- Name: lot_ledger_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lot_ledger_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4239 (class 0 OID 0)
-- Dependencies: 249
-- Name: lot_ledger_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lot_ledger_id_seq OWNED BY public.lot_ledger.id;


--
-- TOC entry 252 (class 1259 OID 16711)
-- Name: lot_mortality_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lot_mortality_records (
    id integer NOT NULL,
    lot_id integer NOT NULL,
    calculation_date date NOT NULL,
    initial_count integer NOT NULL,
    current_count integer NOT NULL,
    sold_count integer DEFAULT 0 NOT NULL,
    mortality_count integer NOT NULL,
    mortality_percentage real NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    notes text
);


--
-- TOC entry 251 (class 1259 OID 16710)
-- Name: lot_mortality_records_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lot_mortality_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4240 (class 0 OID 0)
-- Dependencies: 251
-- Name: lot_mortality_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lot_mortality_records_id_seq OWNED BY public.lot_mortality_records.id;


--
-- TOC entry 254 (class 1259 OID 16722)
-- Name: lots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lots (
    id integer NOT NULL,
    arrival_date date NOT NULL,
    supplier text NOT NULL,
    supplier_lot_number text,
    quality text,
    animal_count integer,
    weight real,
    size_id integer,
    notes text,
    state text DEFAULT 'active'::text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    external_id text,
    description text,
    origin text,
    total_mortality integer DEFAULT 0,
    last_mortality_date date,
    mortality_notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 253 (class 1259 OID 16721)
-- Name: lots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4241 (class 0 OID 0)
-- Dependencies: 253
-- Name: lots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lots_id_seq OWNED BY public.lots.id;


--
-- TOC entry 256 (class 1259 OID 16735)
-- Name: mortality_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mortality_rates (
    id integer NOT NULL,
    size_id integer NOT NULL,
    month text NOT NULL,
    percentage real NOT NULL,
    notes text
);


--
-- TOC entry 255 (class 1259 OID 16734)
-- Name: mortality_rates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mortality_rates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4242 (class 0 OID 0)
-- Dependencies: 255
-- Name: mortality_rates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mortality_rates_id_seq OWNED BY public.mortality_rates.id;


--
-- TOC entry 258 (class 1259 OID 16744)
-- Name: notification_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_settings (
    id integer NOT NULL,
    notification_type text NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone,
    target_size_ids jsonb
);


--
-- TOC entry 257 (class 1259 OID 16743)
-- Name: notification_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notification_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4243 (class 0 OID 0)
-- Dependencies: 257
-- Name: notification_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notification_settings_id_seq OWNED BY public.notification_settings.id;


--
-- TOC entry 260 (class 1259 OID 16755)
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    related_entity_type text,
    related_entity_id integer,
    data text
);


--
-- TOC entry 259 (class 1259 OID 16754)
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4244 (class 0 OID 0)
-- Dependencies: 259
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- TOC entry 262 (class 1259 OID 16766)
-- Name: operations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.operations (
    id integer NOT NULL,
    date date NOT NULL,
    type text NOT NULL,
    basket_id integer NOT NULL,
    cycle_id integer NOT NULL,
    size_id integer NOT NULL,
    sgr_id integer,
    lot_id integer,
    animal_count integer,
    total_weight real,
    animals_per_kg integer,
    average_weight real,
    dead_count integer,
    mortality_rate real,
    notes text,
    metadata text,
    source text DEFAULT 'desktop_manager'::text NOT NULL,
    operator_id text,
    operator_name text
);


--
-- TOC entry 341 (class 1259 OID 1097728)
-- Name: operations_backup_mortalita; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.operations_backup_mortalita (
    id integer,
    date date,
    basket_id integer,
    animal_count integer,
    mortality_rate real,
    dead_count integer,
    notes text
);


--
-- TOC entry 261 (class 1259 OID 16765)
-- Name: operations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.operations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4245 (class 0 OID 0)
-- Dependencies: 261
-- Name: operations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.operations_id_seq OWNED BY public.operations.id;


--
-- TOC entry 309 (class 1259 OID 434176)
-- Name: operators; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.operators (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    operator_id character varying NOT NULL,
    name character varying NOT NULL,
    password character varying NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 311 (class 1259 OID 540673)
-- Name: ordini; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ordini (
    id integer NOT NULL,
    numero integer,
    data date NOT NULL,
    cliente_id integer NOT NULL,
    cliente_nome text,
    stato text,
    totale numeric(10,2) DEFAULT 0,
    valuta text DEFAULT 'EUR'::text,
    note text,
    fatture_in_cloud_id integer,
    company_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone,
    quantita_totale integer DEFAULT 0,
    taglia_richiesta text DEFAULT ''::text,
    data_consegna date,
    data_inizio_consegna date,
    data_fine_consegna date,
    fatture_in_cloud_numero character varying(50),
    sync_status character varying(20) DEFAULT 'locale'::character varying,
    last_sync_at timestamp without time zone,
    sync_error text,
    url_documento text
);


--
-- TOC entry 310 (class 1259 OID 540672)
-- Name: ordini_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ordini_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4246 (class 0 OID 0)
-- Dependencies: 310
-- Name: ordini_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ordini_id_seq OWNED BY public.ordini.id;


--
-- TOC entry 313 (class 1259 OID 540687)
-- Name: ordini_righe; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ordini_righe (
    id integer NOT NULL,
    ordine_id integer NOT NULL,
    codice text,
    nome text NOT NULL,
    descrizione text,
    quantita numeric(10,2) NOT NULL,
    unita_misura text DEFAULT 'NR'::text,
    prezzo_unitario numeric(10,2) DEFAULT 0 NOT NULL,
    sconto numeric(10,2) DEFAULT 0,
    totale numeric(10,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 312 (class 1259 OID 540686)
-- Name: ordini_righe_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ordini_righe_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4247 (class 0 OID 0)
-- Dependencies: 312
-- Name: ordini_righe_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ordini_righe_id_seq OWNED BY public.ordini_righe.id;


--
-- TOC entry 264 (class 1259 OID 16775)
-- Name: sale_bags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_bags (
    id integer NOT NULL,
    advanced_sale_id integer NOT NULL,
    bag_number integer NOT NULL,
    size_code text NOT NULL,
    total_weight real NOT NULL,
    original_weight real NOT NULL,
    weight_loss real DEFAULT 0,
    animal_count integer NOT NULL,
    animals_per_kg real NOT NULL,
    original_animals_per_kg real NOT NULL,
    waste_percentage real DEFAULT 0,
    notes text
);


--
-- TOC entry 263 (class 1259 OID 16774)
-- Name: sale_bags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sale_bags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4248 (class 0 OID 0)
-- Dependencies: 263
-- Name: sale_bags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sale_bags_id_seq OWNED BY public.sale_bags.id;


--
-- TOC entry 266 (class 1259 OID 16786)
-- Name: sale_operations_ref; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_operations_ref (
    id integer NOT NULL,
    advanced_sale_id integer NOT NULL,
    operation_id integer NOT NULL,
    basket_id integer NOT NULL,
    original_animals integer,
    original_weight real,
    original_animals_per_kg real,
    included_in_sale boolean DEFAULT true
);


--
-- TOC entry 265 (class 1259 OID 16785)
-- Name: sale_operations_ref_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sale_operations_ref_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4249 (class 0 OID 0)
-- Dependencies: 265
-- Name: sale_operations_ref_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sale_operations_ref_id_seq OWNED BY public.sale_operations_ref.id;


--
-- TOC entry 268 (class 1259 OID 16794)
-- Name: screening_basket_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.screening_basket_history (
    id integer NOT NULL,
    screening_id integer NOT NULL,
    source_basket_id integer NOT NULL,
    source_cycle_id integer NOT NULL,
    destination_basket_id integer NOT NULL,
    destination_cycle_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 267 (class 1259 OID 16793)
-- Name: screening_basket_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.screening_basket_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4250 (class 0 OID 0)
-- Dependencies: 267
-- Name: screening_basket_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.screening_basket_history_id_seq OWNED BY public.screening_basket_history.id;


--
-- TOC entry 270 (class 1259 OID 16802)
-- Name: screening_destination_baskets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.screening_destination_baskets (
    id integer NOT NULL,
    screening_id integer NOT NULL,
    basket_id integer NOT NULL,
    cycle_id integer,
    category text NOT NULL,
    flupsy_id integer,
    "row" text,
    "position" integer,
    position_assigned boolean DEFAULT false NOT NULL,
    animal_count integer,
    live_animals integer,
    total_weight real,
    animals_per_kg integer,
    dead_count integer,
    mortality_rate real,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


--
-- TOC entry 269 (class 1259 OID 16801)
-- Name: screening_destination_baskets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.screening_destination_baskets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4251 (class 0 OID 0)
-- Dependencies: 269
-- Name: screening_destination_baskets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.screening_destination_baskets_id_seq OWNED BY public.screening_destination_baskets.id;


--
-- TOC entry 306 (class 1259 OID 393238)
-- Name: screening_impact_analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.screening_impact_analysis (
    id integer NOT NULL,
    screening_id integer NOT NULL,
    analysis_run_id integer,
    basket_id integer,
    animals_sold integer,
    animals_repositioned integer,
    avg_sgr_before real,
    avg_sgr_after real,
    selection_bias real,
    fast_growers_removed integer,
    slow_growers_retained integer,
    distribution_before jsonb,
    distribution_after jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 305 (class 1259 OID 393237)
-- Name: screening_impact_analysis_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.screening_impact_analysis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4252 (class 0 OID 0)
-- Dependencies: 305
-- Name: screening_impact_analysis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.screening_impact_analysis_id_seq OWNED BY public.screening_impact_analysis.id;


--
-- TOC entry 272 (class 1259 OID 16813)
-- Name: screening_lot_references; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.screening_lot_references (
    id integer NOT NULL,
    screening_id integer NOT NULL,
    destination_basket_id integer NOT NULL,
    destination_cycle_id integer NOT NULL,
    lot_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 271 (class 1259 OID 16812)
-- Name: screening_lot_references_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.screening_lot_references_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4253 (class 0 OID 0)
-- Dependencies: 271
-- Name: screening_lot_references_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.screening_lot_references_id_seq OWNED BY public.screening_lot_references.id;


--
-- TOC entry 274 (class 1259 OID 16821)
-- Name: screening_operations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.screening_operations (
    id integer NOT NULL,
    date date NOT NULL,
    screening_number integer NOT NULL,
    purpose text,
    reference_size_id integer NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone,
    notes text,
    is_cross_flupsy boolean DEFAULT false,
    transport_metadata jsonb
);


--
-- TOC entry 273 (class 1259 OID 16820)
-- Name: screening_operations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.screening_operations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4254 (class 0 OID 0)
-- Dependencies: 273
-- Name: screening_operations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.screening_operations_id_seq OWNED BY public.screening_operations.id;


--
-- TOC entry 276 (class 1259 OID 16832)
-- Name: screening_source_baskets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.screening_source_baskets (
    id integer NOT NULL,
    screening_id integer NOT NULL,
    basket_id integer NOT NULL,
    cycle_id integer NOT NULL,
    dismissed boolean DEFAULT false NOT NULL,
    position_released boolean DEFAULT false NOT NULL,
    animal_count integer,
    total_weight real,
    animals_per_kg integer,
    size_id integer,
    lot_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    flupsy_id integer
);


--
-- TOC entry 275 (class 1259 OID 16831)
-- Name: screening_source_baskets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.screening_source_baskets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4255 (class 0 OID 0)
-- Dependencies: 275
-- Name: screening_source_baskets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.screening_source_baskets_id_seq OWNED BY public.screening_source_baskets.id;


--
-- TOC entry 278 (class 1259 OID 16842)
-- Name: selection_basket_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.selection_basket_history (
    id integer NOT NULL,
    selection_id integer NOT NULL,
    source_basket_id integer NOT NULL,
    source_cycle_id integer NOT NULL,
    destination_basket_id integer NOT NULL,
    destination_cycle_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 277 (class 1259 OID 16841)
-- Name: selection_basket_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.selection_basket_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4256 (class 0 OID 0)
-- Dependencies: 277
-- Name: selection_basket_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.selection_basket_history_id_seq OWNED BY public.selection_basket_history.id;


--
-- TOC entry 280 (class 1259 OID 16850)
-- Name: selection_destination_baskets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.selection_destination_baskets (
    id integer NOT NULL,
    selection_id integer NOT NULL,
    basket_id integer NOT NULL,
    cycle_id integer,
    destination_type text NOT NULL,
    flupsy_id integer,
    "position" text,
    animal_count integer,
    live_animals integer,
    total_weight real,
    animals_per_kg integer,
    size_id integer,
    dead_count integer,
    mortality_rate real,
    sample_weight real,
    sample_count integer,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone,
    category text
);


--
-- TOC entry 279 (class 1259 OID 16849)
-- Name: selection_destination_baskets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.selection_destination_baskets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4257 (class 0 OID 0)
-- Dependencies: 279
-- Name: selection_destination_baskets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.selection_destination_baskets_id_seq OWNED BY public.selection_destination_baskets.id;


--
-- TOC entry 282 (class 1259 OID 16860)
-- Name: selection_lot_references; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.selection_lot_references (
    id integer NOT NULL,
    selection_id integer NOT NULL,
    destination_basket_id integer NOT NULL,
    destination_cycle_id integer NOT NULL,
    lot_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 281 (class 1259 OID 16859)
-- Name: selection_lot_references_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.selection_lot_references_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4258 (class 0 OID 0)
-- Dependencies: 281
-- Name: selection_lot_references_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.selection_lot_references_id_seq OWNED BY public.selection_lot_references.id;


--
-- TOC entry 284 (class 1259 OID 16868)
-- Name: selection_source_baskets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.selection_source_baskets (
    id integer NOT NULL,
    selection_id integer NOT NULL,
    basket_id integer NOT NULL,
    cycle_id integer NOT NULL,
    animal_count integer,
    total_weight real,
    animals_per_kg integer,
    size_id integer,
    lot_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    flupsy_id integer
);


--
-- TOC entry 283 (class 1259 OID 16867)
-- Name: selection_source_baskets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.selection_source_baskets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4259 (class 0 OID 0)
-- Dependencies: 283
-- Name: selection_source_baskets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.selection_source_baskets_id_seq OWNED BY public.selection_source_baskets.id;


--
-- TOC entry 321 (class 1259 OID 786486)
-- Name: selection_task_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.selection_task_assignments (
    id integer NOT NULL,
    task_id integer NOT NULL,
    operator_id integer NOT NULL,
    status text DEFAULT 'assigned'::text NOT NULL,
    assigned_at timestamp without time zone DEFAULT now() NOT NULL,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    completion_notes text,
    external_app_synced_at timestamp without time zone,
    started_by integer,
    completed_by integer,
    CONSTRAINT selection_task_assignments_status_check CHECK ((status = ANY (ARRAY['assigned'::text, 'accepted'::text, 'in_progress'::text, 'completed'::text])))
);


--
-- TOC entry 320 (class 1259 OID 786485)
-- Name: selection_task_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.selection_task_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4260 (class 0 OID 0)
-- Dependencies: 320
-- Name: selection_task_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.selection_task_assignments_id_seq OWNED BY public.selection_task_assignments.id;


--
-- TOC entry 319 (class 1259 OID 786465)
-- Name: selection_task_baskets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.selection_task_baskets (
    id integer NOT NULL,
    task_id integer NOT NULL,
    basket_id integer NOT NULL,
    role text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT selection_task_baskets_role_check CHECK ((role = ANY (ARRAY['source'::text, 'destination'::text])))
);


--
-- TOC entry 318 (class 1259 OID 786464)
-- Name: selection_task_baskets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.selection_task_baskets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4261 (class 0 OID 0)
-- Dependencies: 318
-- Name: selection_task_baskets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.selection_task_baskets_id_seq OWNED BY public.selection_task_baskets.id;


--
-- TOC entry 317 (class 1259 OID 786446)
-- Name: selection_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.selection_tasks (
    id integer NOT NULL,
    selection_id integer,
    task_type text NOT NULL,
    description text,
    priority text DEFAULT 'medium'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    due_date date,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone,
    completed_at timestamp without time zone,
    notes text,
    cadence text,
    cadence_interval integer DEFAULT 1,
    cancelled_by integer,
    cancelled_at timestamp without time zone,
    CONSTRAINT selection_tasks_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))),
    CONSTRAINT selection_tasks_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'assigned'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- TOC entry 316 (class 1259 OID 786445)
-- Name: selection_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.selection_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4262 (class 0 OID 0)
-- Dependencies: 316
-- Name: selection_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.selection_tasks_id_seq OWNED BY public.selection_tasks.id;


--
-- TOC entry 286 (class 1259 OID 16876)
-- Name: selections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.selections (
    id integer NOT NULL,
    date date NOT NULL,
    selection_number integer NOT NULL,
    purpose text NOT NULL,
    screening_type text,
    reference_size_id integer,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone,
    notes text,
    is_cross_flupsy boolean DEFAULT false,
    origin_flupsy_id integer,
    destination_flupsy_id integer,
    transport_metadata jsonb
);


--
-- TOC entry 285 (class 1259 OID 16875)
-- Name: selections_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.selections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4263 (class 0 OID 0)
-- Dependencies: 285
-- Name: selections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.selections_id_seq OWNED BY public.selections.id;


--
-- TOC entry 288 (class 1259 OID 16887)
-- Name: sgr; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sgr (
    id integer NOT NULL,
    month text NOT NULL,
    percentage real NOT NULL,
    calculated_from_real boolean DEFAULT false
);


--
-- TOC entry 290 (class 1259 OID 16897)
-- Name: sgr_giornalieri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sgr_giornalieri (
    id integer NOT NULL,
    record_date timestamp without time zone NOT NULL,
    temperature real,
    ph real,
    ammonia real,
    oxygen real,
    salinity real,
    notes text,
    operator_id text,
    operator_name text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 289 (class 1259 OID 16896)
-- Name: sgr_giornalieri_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sgr_giornalieri_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4264 (class 0 OID 0)
-- Dependencies: 289
-- Name: sgr_giornalieri_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sgr_giornalieri_id_seq OWNED BY public.sgr_giornalieri.id;


--
-- TOC entry 287 (class 1259 OID 16886)
-- Name: sgr_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sgr_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4265 (class 0 OID 0)
-- Dependencies: 287
-- Name: sgr_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sgr_id_seq OWNED BY public.sgr.id;


--
-- TOC entry 300 (class 1259 OID 352257)
-- Name: sgr_per_taglia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sgr_per_taglia (
    id integer NOT NULL,
    month text NOT NULL,
    size_id integer NOT NULL,
    calculated_sgr real NOT NULL,
    sample_count integer DEFAULT 0 NOT NULL,
    last_calculated timestamp without time zone DEFAULT now() NOT NULL,
    notes text
);


--
-- TOC entry 299 (class 1259 OID 352256)
-- Name: sgr_per_taglia_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sgr_per_taglia_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4266 (class 0 OID 0)
-- Dependencies: 299
-- Name: sgr_per_taglia_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sgr_per_taglia_id_seq OWNED BY public.sgr_per_taglia.id;


--
-- TOC entry 292 (class 1259 OID 16906)
-- Name: sizes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sizes (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    size_mm real,
    min_animals_per_kg integer,
    max_animals_per_kg integer,
    notes text,
    color text
);


--
-- TOC entry 291 (class 1259 OID 16905)
-- Name: sizes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sizes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4267 (class 0 OID 0)
-- Dependencies: 291
-- Name: sizes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sizes_id_seq OWNED BY public.sizes.id;


--
-- TOC entry 294 (class 1259 OID 16917)
-- Name: sync_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sync_status (
    id integer NOT NULL,
    table_name text NOT NULL,
    last_sync_at timestamp without time zone,
    last_sync_success boolean DEFAULT true,
    sync_in_progress boolean DEFAULT false,
    record_count integer DEFAULT 0,
    error_message text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 293 (class 1259 OID 16916)
-- Name: sync_status_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sync_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4268 (class 0 OID 0)
-- Dependencies: 293
-- Name: sync_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sync_status_id_seq OWNED BY public.sync_status.id;


--
-- TOC entry 296 (class 1259 OID 16933)
-- Name: target_size_annotations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.target_size_annotations (
    id integer NOT NULL,
    basket_id integer NOT NULL,
    target_size_id integer NOT NULL,
    predicted_date date NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    reached_date date,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


--
-- TOC entry 295 (class 1259 OID 16932)
-- Name: target_size_annotations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.target_size_annotations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4269 (class 0 OID 0)
-- Dependencies: 295
-- Name: target_size_annotations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.target_size_annotations_id_seq OWNED BY public.target_size_annotations.id;


--
-- TOC entry 315 (class 1259 OID 786433)
-- Name: task_operators; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_operators (
    id integer NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text,
    phone text,
    role text,
    active boolean DEFAULT true NOT NULL,
    external_app_user_id text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone,
    notes text
);


--
-- TOC entry 314 (class 1259 OID 786432)
-- Name: task_operators_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.task_operators_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4270 (class 0 OID 0)
-- Dependencies: 314
-- Name: task_operators_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.task_operators_id_seq OWNED BY public.task_operators.id;


--
-- TOC entry 298 (class 1259 OID 16944)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    role text DEFAULT 'user'::text NOT NULL,
    language text DEFAULT 'it'::text NOT NULL,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 297 (class 1259 OID 16943)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4271 (class 0 OID 0)
-- Dependencies: 297
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3502 (class 2604 OID 16482)
-- Name: advanced_sales id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advanced_sales ALTER COLUMN id SET DEFAULT nextval('public.advanced_sales_id_seq'::regclass);


--
-- TOC entry 3712 (class 2604 OID 1048580)
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- TOC entry 3506 (class 2604 OID 16496)
-- Name: bag_allocations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bag_allocations ALTER COLUMN id SET DEFAULT nextval('public.bag_allocations_id_seq'::regclass);


--
-- TOC entry 3690 (class 2604 OID 925700)
-- Name: basket_groups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.basket_groups ALTER COLUMN id SET DEFAULT nextval('public.basket_groups_id_seq'::regclass);


--
-- TOC entry 3649 (class 2604 OID 393231)
-- Name: basket_growth_profiles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.basket_growth_profiles ALTER COLUMN id SET DEFAULT nextval('public.basket_growth_profiles_id_seq'::regclass);


--
-- TOC entry 3507 (class 2604 OID 16505)
-- Name: basket_lot_composition id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.basket_lot_composition ALTER COLUMN id SET DEFAULT nextval('public.basket_lot_composition_id_seq'::regclass);


--
-- TOC entry 3509 (class 2604 OID 16515)
-- Name: baskets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baskets ALTER COLUMN id SET DEFAULT nextval('public.baskets_id_seq'::regclass);


--
-- TOC entry 3511 (class 2604 OID 16525)
-- Name: clienti id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clienti ALTER COLUMN id SET DEFAULT nextval('public.clienti_id_seq'::regclass);


--
-- TOC entry 3523 (class 2604 OID 16545)
-- Name: configurazione id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configurazione ALTER COLUMN id SET DEFAULT nextval('public.configurazione_id_seq'::regclass);


--
-- TOC entry 3526 (class 2604 OID 16558)
-- Name: cycles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cycles ALTER COLUMN id SET DEFAULT nextval('public.cycles_id_seq'::regclass);


--
-- TOC entry 3528 (class 2604 OID 16568)
-- Name: ddt id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ddt ALTER COLUMN id SET DEFAULT nextval('public.ddt_id_seq'::regclass);


--
-- TOC entry 3534 (class 2604 OID 16582)
-- Name: ddt_righe id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ddt_righe ALTER COLUMN id SET DEFAULT nextval('public.ddt_righe_id_seq'::regclass);


--
-- TOC entry 3538 (class 2604 OID 16594)
-- Name: email_config id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_config ALTER COLUMN id SET DEFAULT nextval('public.email_config_id_seq'::regclass);


--
-- TOC entry 3540 (class 2604 OID 16606)
-- Name: external_customers_sync id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_customers_sync ALTER COLUMN id SET DEFAULT nextval('public.external_customers_sync_id_seq'::regclass);


--
-- TOC entry 3544 (class 2604 OID 16620)
-- Name: external_deliveries_sync id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_deliveries_sync ALTER COLUMN id SET DEFAULT nextval('public.external_deliveries_sync_id_seq'::regclass);


--
-- TOC entry 3546 (class 2604 OID 16632)
-- Name: external_delivery_details_sync id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_delivery_details_sync ALTER COLUMN id SET DEFAULT nextval('public.external_delivery_details_sync_id_seq'::regclass);


--
-- TOC entry 3548 (class 2604 OID 16644)
-- Name: external_sales_sync id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_sales_sync ALTER COLUMN id SET DEFAULT nextval('public.external_sales_sync_id_seq'::regclass);


--
-- TOC entry 3685 (class 2604 OID 811012)
-- Name: external_users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_users ALTER COLUMN id SET DEFAULT nextval('public.external_users_id_seq'::regclass);


--
-- TOC entry 3556 (class 2604 OID 16662)
-- Name: fatture_in_cloud_config id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fatture_in_cloud_config ALTER COLUMN id SET DEFAULT nextval('public.fatture_in_cloud_config_id_seq'::regclass);


--
-- TOC entry 3566 (class 2604 OID 16680)
-- Name: flupsys id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flupsys ALTER COLUMN id SET DEFAULT nextval('public.flupsys_id_seq'::regclass);


--
-- TOC entry 3646 (class 2604 OID 393220)
-- Name: growth_analysis_runs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_analysis_runs ALTER COLUMN id SET DEFAULT nextval('public.growth_analysis_runs_id_seq'::regclass);


--
-- TOC entry 3653 (class 2604 OID 393251)
-- Name: growth_distributions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_distributions ALTER COLUMN id SET DEFAULT nextval('public.growth_distributions_id_seq'::regclass);


--
-- TOC entry 3698 (class 2604 OID 1024017)
-- Name: lci_consumables id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lci_consumables ALTER COLUMN id SET DEFAULT nextval('public.lci_consumables_id_seq'::regclass);


--
-- TOC entry 3701 (class 2604 OID 1024028)
-- Name: lci_consumption_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lci_consumption_logs ALTER COLUMN id SET DEFAULT nextval('public.lci_consumption_logs_id_seq'::regclass);


--
-- TOC entry 3693 (class 2604 OID 1024004)
-- Name: lci_materials id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lci_materials ALTER COLUMN id SET DEFAULT nextval('public.lci_materials_id_seq'::regclass);


--
-- TOC entry 3704 (class 2604 OID 1024039)
-- Name: lci_production_snapshots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lci_production_snapshots ALTER COLUMN id SET DEFAULT nextval('public.lci_production_snapshots_id_seq'::regclass);


--
-- TOC entry 3707 (class 2604 OID 1024050)
-- Name: lci_reports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lci_reports ALTER COLUMN id SET DEFAULT nextval('public.lci_reports_id_seq'::regclass);


--
-- TOC entry 3710 (class 2604 OID 1024061)
-- Name: lci_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lci_settings ALTER COLUMN id SET DEFAULT nextval('public.lci_settings_id_seq'::regclass);


--
-- TOC entry 3570 (class 2604 OID 16691)
-- Name: lot_inventory_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lot_inventory_transactions ALTER COLUMN id SET DEFAULT nextval('public.lot_inventory_transactions_id_seq'::regclass);


--
-- TOC entry 3572 (class 2604 OID 16701)
-- Name: lot_ledger id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lot_ledger ALTER COLUMN id SET DEFAULT nextval('public.lot_ledger_id_seq'::regclass);


--
-- TOC entry 3575 (class 2604 OID 16714)
-- Name: lot_mortality_records id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lot_mortality_records ALTER COLUMN id SET DEFAULT nextval('public.lot_mortality_records_id_seq'::regclass);


--
-- TOC entry 3578 (class 2604 OID 16725)
-- Name: lots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lots ALTER COLUMN id SET DEFAULT nextval('public.lots_id_seq'::regclass);


--
-- TOC entry 3583 (class 2604 OID 16738)
-- Name: mortality_rates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mortality_rates ALTER COLUMN id SET DEFAULT nextval('public.mortality_rates_id_seq'::regclass);


--
-- TOC entry 3584 (class 2604 OID 16747)
-- Name: notification_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_settings ALTER COLUMN id SET DEFAULT nextval('public.notification_settings_id_seq'::regclass);


--
-- TOC entry 3587 (class 2604 OID 16758)
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- TOC entry 3590 (class 2604 OID 16769)
-- Name: operations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operations ALTER COLUMN id SET DEFAULT nextval('public.operations_id_seq'::regclass);


--
-- TOC entry 3659 (class 2604 OID 540676)
-- Name: ordini id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordini ALTER COLUMN id SET DEFAULT nextval('public.ordini_id_seq'::regclass);


--
-- TOC entry 3666 (class 2604 OID 540690)
-- Name: ordini_righe id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordini_righe ALTER COLUMN id SET DEFAULT nextval('public.ordini_righe_id_seq'::regclass);


--
-- TOC entry 3592 (class 2604 OID 16778)
-- Name: sale_bags id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_bags ALTER COLUMN id SET DEFAULT nextval('public.sale_bags_id_seq'::regclass);


--
-- TOC entry 3595 (class 2604 OID 16789)
-- Name: sale_operations_ref id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_operations_ref ALTER COLUMN id SET DEFAULT nextval('public.sale_operations_ref_id_seq'::regclass);


--
-- TOC entry 3597 (class 2604 OID 16797)
-- Name: screening_basket_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_basket_history ALTER COLUMN id SET DEFAULT nextval('public.screening_basket_history_id_seq'::regclass);


--
-- TOC entry 3599 (class 2604 OID 16805)
-- Name: screening_destination_baskets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_destination_baskets ALTER COLUMN id SET DEFAULT nextval('public.screening_destination_baskets_id_seq'::regclass);


--
-- TOC entry 3651 (class 2604 OID 393241)
-- Name: screening_impact_analysis id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_impact_analysis ALTER COLUMN id SET DEFAULT nextval('public.screening_impact_analysis_id_seq'::regclass);


--
-- TOC entry 3602 (class 2604 OID 16816)
-- Name: screening_lot_references id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_lot_references ALTER COLUMN id SET DEFAULT nextval('public.screening_lot_references_id_seq'::regclass);


--
-- TOC entry 3604 (class 2604 OID 16824)
-- Name: screening_operations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_operations ALTER COLUMN id SET DEFAULT nextval('public.screening_operations_id_seq'::regclass);


--
-- TOC entry 3608 (class 2604 OID 16835)
-- Name: screening_source_baskets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_source_baskets ALTER COLUMN id SET DEFAULT nextval('public.screening_source_baskets_id_seq'::regclass);


--
-- TOC entry 3612 (class 2604 OID 16845)
-- Name: selection_basket_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_basket_history ALTER COLUMN id SET DEFAULT nextval('public.selection_basket_history_id_seq'::regclass);


--
-- TOC entry 3614 (class 2604 OID 16853)
-- Name: selection_destination_baskets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_destination_baskets ALTER COLUMN id SET DEFAULT nextval('public.selection_destination_baskets_id_seq'::regclass);


--
-- TOC entry 3616 (class 2604 OID 16863)
-- Name: selection_lot_references id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_lot_references ALTER COLUMN id SET DEFAULT nextval('public.selection_lot_references_id_seq'::regclass);


--
-- TOC entry 3618 (class 2604 OID 16871)
-- Name: selection_source_baskets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_source_baskets ALTER COLUMN id SET DEFAULT nextval('public.selection_source_baskets_id_seq'::regclass);


--
-- TOC entry 3682 (class 2604 OID 786489)
-- Name: selection_task_assignments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_task_assignments ALTER COLUMN id SET DEFAULT nextval('public.selection_task_assignments_id_seq'::regclass);


--
-- TOC entry 3680 (class 2604 OID 786468)
-- Name: selection_task_baskets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_task_baskets ALTER COLUMN id SET DEFAULT nextval('public.selection_task_baskets_id_seq'::regclass);


--
-- TOC entry 3675 (class 2604 OID 786449)
-- Name: selection_tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_tasks ALTER COLUMN id SET DEFAULT nextval('public.selection_tasks_id_seq'::regclass);


--
-- TOC entry 3620 (class 2604 OID 16879)
-- Name: selections id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selections ALTER COLUMN id SET DEFAULT nextval('public.selections_id_seq'::regclass);


--
-- TOC entry 3624 (class 2604 OID 16890)
-- Name: sgr id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sgr ALTER COLUMN id SET DEFAULT nextval('public.sgr_id_seq'::regclass);


--
-- TOC entry 3626 (class 2604 OID 16900)
-- Name: sgr_giornalieri id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sgr_giornalieri ALTER COLUMN id SET DEFAULT nextval('public.sgr_giornalieri_id_seq'::regclass);


--
-- TOC entry 3643 (class 2604 OID 352260)
-- Name: sgr_per_taglia id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sgr_per_taglia ALTER COLUMN id SET DEFAULT nextval('public.sgr_per_taglia_id_seq'::regclass);


--
-- TOC entry 3629 (class 2604 OID 16909)
-- Name: sizes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sizes ALTER COLUMN id SET DEFAULT nextval('public.sizes_id_seq'::regclass);


--
-- TOC entry 3630 (class 2604 OID 16920)
-- Name: sync_status id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_status ALTER COLUMN id SET DEFAULT nextval('public.sync_status_id_seq'::regclass);


--
-- TOC entry 3636 (class 2604 OID 16936)
-- Name: target_size_annotations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.target_size_annotations ALTER COLUMN id SET DEFAULT nextval('public.target_size_annotations_id_seq'::regclass);


--
-- TOC entry 3672 (class 2604 OID 786436)
-- Name: task_operators id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_operators ALTER COLUMN id SET DEFAULT nextval('public.task_operators_id_seq'::regclass);


--
-- TOC entry 3639 (class 2604 OID 16947)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4203 (class 0 OID 1081344)
-- Dependencies: 340
-- Data for Name: _backup_weights_20251201; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._backup_weights_20251201 (id, original_weight) FROM stdin;
33	24300
34	23700
5	29000
6	24500
7	14500
8	7000
9	15000
10	16500
11	13800
12	13900
13	13250
14	10450
15	10100
16	9120
17	5700
18	10700
19	7300
20	10350
21	12000
22	15150
23	17900
24	17350
25	15100
26	11400
27	13063
28	19300
29	19500
30	19200
31	20800
32	22700
35	15500
36	29500
38	14758
39	7904
40	14200
41	14784
42	9000
43	14200
44	9000
45	12162
46	15500
47	12162
48	13400
49	9649
50	12900
51	14200
52	2874
53	14758
54	4633
55	5070
56	14784
57	6945
58	5070
59	4024
60	4024
61	16400
62	16400
63	8573
64	16500
65	7904
66	7904
67	8000
68	8000
69	8573
70	8573
71	5070
72	5070
73	1768
74	1768
75	5207
76	2280
77	4633
78	2190
80	9649
81	15500
82	16500
\.


--
-- TOC entry 4079 (class 0 OID 16479)
-- Dependencies: 216
-- Data for Name: advanced_sales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.advanced_sales (id, sale_number, customer_id, customer_name, customer_details, sale_date, status, total_weight, total_animals, total_bags, notes, pdf_path, ddt_id, ddt_status, created_at, updated_at, company_id) FROM stdin;
1	VAV-000001	58	LA VERACE Società Cooperativa	"{\\"id\\":58,\\"externalId\\":\\"\\",\\"name\\":\\"LA VERACE Società Cooperativa\\",\\"businessName\\":\\"LA VERACE Società Cooperativa\\",\\"vatNumber\\":\\"01877390383\\",\\"address\\":\\"\\",\\"city\\":\\"Goro\\",\\"province\\":\\"Ferrara\\",\\"postalCode\\":\\"44020\\",\\"phone\\":\\"\\",\\"email\\":\\"coop.laverace@virgilio.it\\"}"	2025-12-03	draft	109.1	1243359	\N	Vendita a Mauro Turri, La Verace. Accontentato	\N	\N	nessuno	2025-12-04 13:07:57.641612	2025-12-04 13:07:57.794	1052922
2	VAV-000002	82	Soc cooperativa Rosa dei Venti	"{\\"id\\":82,\\"externalId\\":\\"\\",\\"name\\":\\"Soc cooperativa Rosa dei Venti\\",\\"businessName\\":\\"Soc cooperativa Rosa dei Venti\\",\\"vatNumber\\":\\"01257010387\\",\\"address\\":\\"\\",\\"city\\":\\"Goro\\",\\"province\\":\\"FE\\",\\"postalCode\\":\\"44020\\",\\"phone\\":\\"\\",\\"email\\":\\"rosadeiventi3@gmail.com\\"}"	2025-12-04	draft	24.9	283773	\N	\N	\N	\N	nessuno	2025-12-04 13:19:44.421038	2025-12-04 13:19:44.55	1052922
\.


--
-- TOC entry 4202 (class 0 OID 1048577)
-- Dependencies: 339
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, "timestamp", action, entity_type, entity_id, user_id, user_source, old_values, new_values, metadata, ip_address, user_agent) FROM stdin;
1	2025-11-28 12:41:23.404424+00	operation_deleted	operation	79	\N	\N	{"date": "2025-11-28", "type": "peso", "cycleId": 5, "basketId": 21, "animalCount": 417600}	\N	{"deletedAt": "2025-11-28T12:41:23.299Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
\.


--
-- TOC entry 4081 (class 0 OID 16493)
-- Dependencies: 218
-- Data for Name: bag_allocations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bag_allocations (id, sale_bag_id, source_operation_id, source_basket_id, allocated_animals, allocated_weight, source_animals_per_kg, source_size_code) FROM stdin;
\.


--
-- TOC entry 4188 (class 0 OID 925697)
-- Dependencies: 325
-- Data for Name: basket_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.basket_groups (id, name, color, created_at, purpose, highlight_order, updated_at) FROM stdin;
8	PRONTO VENDITA DA CONFEZIONARE	#f98a2f	2025-11-28 10:01:23.459169	Animali pronti per la vendita ma in attesa di essere assegnati al cliente 	0	\N
9	CESTE DA VAGLIARE CON IL 1500	#e47711	2025-11-28 10:08:42.227586	Animali in elenco progressivo, da vagliare con la rete del 1500	0	\N
11	CESTE DA VAGLIARE CON LA RETE DEL 2000PLUS	#eaf73b	2025-11-28 10:11:08.959881	Raccoglie tendenzialmente i +1000 grandi che non hanno avuto la vagliatura intermedia con il 1500, i +1500 (gruppo dedicato solo alle teste) 	0	\N
10	CESTE DA VAGLIARE CON LA RETE DEL 2000	#eaee17	2025-11-28 10:09:54.070525	Raccoglie tendenzialmente i -2000 (code e medi) 	0	2025-11-28 10:11:28.793
12	CESTE DA VAGLIARE CON LA RETE DEL 3000	#a830f8	2025-11-28 10:12:19.85544	Raccoglie tutti i -3 (code e medi) e i +2.5 	0	\N
13	CESTE DA VAGLIARE CON IL 4000	#000000	2025-11-28 10:13:11.479985	Raccoglie i -4 (code e medi che non sono stati vagliati con il +3), i +3 e i +3.5	0	\N
14	CESTE DA VAGLIARE CON LA RETE DEL 5000	#a4a9b2	2025-11-28 10:14:20.595063	Raccoglie i +4 e i -5 che non sono stati vagliati con il +4	0	\N
7	VENDUTO DA RITIRARE (CLIENTE ASSEGANTO)	#f23131	2025-11-28 09:58:52.81729	Animali a cui abbiamo già assegnato un cliente, stiamo aspettando il ritiro 	0	2025-11-28 10:45:22.615
15	CESTE DA VAGLIARE CON LA RETE DEL 2500	#3ef73b	2025-11-28 10:46:04.281428	Raggruppa i +2000 che hanno bisogno di una vagliatura intermedia 	0	\N
\.


--
-- TOC entry 4167 (class 0 OID 393228)
-- Dependencies: 304
-- Data for Name: basket_growth_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.basket_growth_profiles (id, basket_id, analysis_run_id, growth_cluster, sgr_deviation, confidence_score, influencing_factors, position_score, density_score, supplier_score, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4083 (class 0 OID 16502)
-- Dependencies: 220
-- Data for Name: basket_lot_composition; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.basket_lot_composition (id, basket_id, cycle_id, lot_id, animal_count, percentage, source_selection_id, created_at, notes) FROM stdin;
1	88	75	5	555560	1	1	2025-12-01 11:28:07.15372	Da vagliatura #1 del 2025-12-01
2	92	76	5	555560	1	1	2025-12-01 11:28:07.15372	Da vagliatura #1 del 2025-12-01
3	120	77	5	671759	1	1	2025-12-01 11:28:07.15372	Da vagliatura #1 del 2025-12-01
4	98	78	5	483957	1	3	2025-12-03 14:20:09.896741	Da vagliatura #2 del 2025-12-03
5	99	79	5	3532130	1	3	2025-12-03 14:20:09.896741	Da vagliatura #2 del 2025-12-03
6	100	80	5	3532130	1	3	2025-12-03 14:20:09.896741	Da vagliatura #2 del 2025-12-03
9	83	83	5	506000	1	9	2025-12-03 15:10:53.626346	Da vagliatura #6 del 2025-12-03
10	86	84	5	506000	1	9	2025-12-03 15:10:53.626346	Da vagliatura #6 del 2025-12-03
11	6	85	4	251863	1	10	2025-12-04 13:05:12.137741	Da vagliatura #7 del 2025-12-03
12	10	86	4	216534	1	10	2025-12-04 13:05:12.137741	Da vagliatura #7 del 2025-12-03
13	21	87	3	319102	1	11	2025-12-04 13:06:49.636694	Da vagliatura #8 del 2025-12-03
14	22	88	3	455860	1	11	2025-12-04 13:06:49.636694	Da vagliatura #8 del 2025-12-03
15	8	89	4	283773	1	12	2025-12-04 13:12:18.729467	Da vagliatura #9 del 2025-12-04
16	115	90	5	602448	1	13	2025-12-05 08:24:19.857006	Da vagliatura #10 del 2025-12-04
17	97	91	5	3476369	1	13	2025-12-05 08:24:19.857006	Da vagliatura #10 del 2025-12-04
18	83	92	5	3476369	1	13	2025-12-05 08:24:19.857006	Da vagliatura #10 del 2025-12-04
\.


--
-- TOC entry 4085 (class 0 OID 16512)
-- Dependencies: 222
-- Data for Name: baskets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.baskets (id, physical_number, flupsy_id, cycle_code, state, current_cycle_id, nfc_data, "row", "position", nfc_last_programmed_at, group_id) FROM stdin;
91	11	1036	11-1036-2511	active	43	\N	SX	1	\N	12
90	10	1036	10-1036-2511	active	44	\N	DX	10	\N	12
82	2	1036	2-1036-2511	active	35	\N	DX	2	\N	10
85	5	1036	5-1036-2511	active	38	\N	DX	5	\N	10
87	7	1036	7-1036-2511	active	40	\N	DX	7	\N	10
111	1	1038	1-1038-2511	active	51	\N	DX	1	\N	11
101	1	1037	1-1037-2511	active	67	\N	DX	1	\N	11
102	2	1037	2-1037-2511	active	68	\N	DX	2	\N	11
11	11	1607	\N	available	\N	\N	SX	1	\N	\N
12	12	1607	\N	available	\N	\N	SX	2	\N	\N
13	13	1607	\N	available	\N	\N	SX	3	\N	\N
14	14	1607	\N	available	\N	\N	SX	4	\N	\N
15	15	1607	\N	available	\N	\N	SX	5	\N	\N
16	16	1607	\N	available	\N	\N	SX	6	\N	\N
17	17	1607	\N	available	\N	\N	SX	7	\N	\N
18	18	1607	\N	available	\N	\N	SX	8	\N	\N
19	19	1607	\N	available	\N	\N	SX	9	\N	\N
20	20	1607	\N	available	\N	\N	SX	10	\N	\N
2	2	1607	2-1607-2511	active	7	\N	DX	2	\N	\N
23	3	1608	3-1608-2511	active	8	\N	DX	3	\N	\N
93	13	1036	13-1036-2511	active	46	\N	SX	3	\N	13
3	3	1607	3-1607-2511	active	9	\N	DX	3	\N	\N
24	4	1608	4-1608-2511	active	10	\N	DX	4	\N	\N
4	4	1607	4-1607-2511	active	11	\N	DX	4	\N	\N
5	5	1607	5-1607-2511	active	12	\N	DX	5	\N	\N
25	5	1608	5-1608-2511	active	13	\N	DX	5	\N	\N
88	8	1036	8-1036-2512	active	75	\N	DX	8	\N	12
26	6	1608	6-1608-2511	active	14	\N	DX	6	\N	\N
27	7	1608	7-1608-2511	active	15	\N	DX	7	\N	\N
28	8	1608	8-1608-2511	active	16	\N	DX	8	\N	\N
29	9	1608	9-1608-2511	active	17	\N	DX	9	\N	\N
30	10	1608	10-1608-2511	active	18	\N	DX	10	\N	\N
31	11	1608	11-1608-2511	active	19	\N	SX	1	\N	\N
32	12	1608	12-1608-2511	active	20	\N	SX	2	\N	\N
33	13	1608	13-1608-2511	active	21	\N	SX	3	\N	\N
34	14	1608	14-1608-2511	active	22	\N	SX	4	\N	\N
35	15	1608	15-1608-2511	active	23	\N	SX	5	\N	\N
36	16	1608	16-1608-2511	active	24	\N	SX	6	\N	\N
37	17	1608	17-1608-2511	active	25	\N	SX	7	\N	\N
38	18	1608	18-1608-2511	active	26	\N	SX	8	\N	\N
39	19	1608	19-1608-2511	active	27	\N	SX	9	\N	\N
105	5	1037	\N	disponibile	\N	\N	DX	5	\N	11
98	18	1036	18-1036-2512	active	78	\N	SX	8	\N	\N
99	19	1036	19-1036-2512	active	79	\N	SX	9	\N	\N
40	20	1608	\N	available	\N	\N	SX	10	\N	\N
7	7	1607	7-1607-2511	active	29	\N	DX	7	\N	\N
100	20	1036	20-1036-2512	active	80	\N	SX	10	\N	\N
9	9	1607	9-1607-2511	active	31	\N	DX	9	\N	\N
41	1	1039	\N	available	\N	\N	DX	1	\N	\N
42	2	1039	\N	available	\N	\N	DX	2	\N	\N
43	3	1039	\N	available	\N	\N	DX	3	\N	\N
44	4	1039	\N	available	\N	\N	DX	4	\N	\N
45	5	1039	\N	available	\N	\N	DX	5	\N	\N
46	6	1039	\N	available	\N	\N	DX	6	\N	\N
47	7	1039	\N	available	\N	\N	DX	7	\N	\N
48	8	1039	\N	available	\N	\N	DX	8	\N	\N
49	9	1039	\N	available	\N	\N	DX	9	\N	\N
50	10	1039	\N	available	\N	\N	DX	10	\N	\N
51	11	1039	\N	available	\N	\N	SX	1	\N	\N
52	12	1039	\N	available	\N	\N	SX	2	\N	\N
53	13	1039	\N	available	\N	\N	SX	3	\N	\N
54	14	1039	\N	available	\N	\N	SX	4	\N	\N
55	15	1039	\N	available	\N	\N	SX	5	\N	\N
56	16	1039	\N	available	\N	\N	SX	6	\N	\N
57	17	1039	\N	available	\N	\N	SX	7	\N	\N
58	18	1039	\N	available	\N	\N	SX	8	\N	\N
59	19	1039	\N	available	\N	\N	SX	9	\N	\N
60	20	1039	\N	available	\N	\N	SX	10	\N	\N
63	3	1012	\N	available	\N	\N	DX	3	\N	\N
64	4	1012	\N	available	\N	\N	DX	4	\N	\N
65	5	1012	\N	available	\N	\N	DX	5	\N	\N
66	6	1012	\N	available	\N	\N	DX	6	\N	\N
67	7	1012	\N	available	\N	\N	DX	7	\N	\N
68	8	1012	\N	available	\N	\N	DX	8	\N	\N
69	9	1012	\N	available	\N	\N	DX	9	\N	\N
70	10	1012	\N	available	\N	\N	DX	10	\N	\N
71	11	1012	\N	available	\N	\N	SX	1	\N	\N
72	12	1012	\N	available	\N	\N	SX	2	\N	\N
73	13	1012	\N	available	\N	\N	SX	3	\N	\N
74	14	1012	\N	available	\N	\N	SX	4	\N	\N
75	15	1012	\N	available	\N	\N	SX	5	\N	\N
76	16	1012	\N	available	\N	\N	SX	6	\N	\N
77	17	1012	\N	available	\N	\N	SX	7	\N	\N
78	18	1012	\N	available	\N	\N	SX	8	\N	\N
79	19	1012	\N	available	\N	\N	SX	9	\N	\N
80	20	1012	\N	available	\N	\N	SX	10	\N	\N
94	14	1036	\N	available	\N	\N	SX	4	\N	8
86	6	1036	\N	available	\N	\N	DX	6	\N	8
6	6	1607	\N	available	\N	\N	DX	6	\N	\N
10	10	1607	\N	available	\N	\N	DX	10	\N	\N
21	1	1608	\N	available	\N	\N	DX	1	\N	\N
22	2	1608	\N	available	\N	\N	DX	2	\N	\N
8	8	1607	\N	available	\N	\N	DX	8	\N	\N
83	3	1036	3-1036-2512	active	92	\N	DX	3	\N	8
1	1	1607	\N	available	\N	\N	DX	1	\N	\N
61	1	1012	1-1012-2512	active	96	\N	DX	1	\N	\N
62	2	1012	2-1012-2512	active	97	\N	DX	2	\N	\N
109	9	1037	\N	available	\N	\N	SX	4	\N	\N
110	10	1037	\N	available	\N	\N	SX	5	\N	\N
104	4	1037	4-1037-2511	active	70	\N	DX	4	\N	9
95	15	1036	15-1036-2511	active	48	\N	SX	5	\N	12
96	16	1036	16-1036-2511	active	49	\N	SX	6	\N	12
81	1	1036	1-1036-2511	active	34	\N	DX	1	\N	12
89	9	1036	9-1036-2511	active	41	\N	DX	9	\N	12
112	2	1038	2-1038-2511	active	52	\N	DX	2	\N	12
113	3	1038	3-1038-2511	active	53	\N	DX	3	\N	10
119	9	1038	9-1038-2511	active	59	\N	DX	9	\N	10
121	11	1038	11-1038-2511	active	61	\N	SX	1	\N	10
122	12	1038	12-1038-2511	active	62	\N	SX	2	\N	10
123	13	1038	13-1038-2511	active	63	\N	SX	3	\N	10
124	14	1038	14-1038-2511	active	64	\N	SX	4	\N	10
125	15	1038	15-1038-2511	active	65	\N	SX	5	\N	10
126	16	1038	16-1038-2511	active	66	\N	SX	6	\N	10
127	17	1038	\N	available	\N	\N	SX	7	\N	\N
128	18	1038	\N	available	\N	\N	SX	8	\N	\N
129	19	1038	\N	available	\N	\N	SX	9	\N	\N
130	20	1038	\N	available	\N	\N	SX	10	\N	\N
114	4	1038	4-1038-2511	active	54	\N	DX	4	\N	11
84	4	1036	4-1036-2511	active	37	\N	DX	4	\N	\N
106	6	1037	6-1037-2511	active	72	\N	SX	1	\N	9
108	8	1037	8-1037-2511	active	74	\N	SX	3	\N	9
103	3	1037	3-1037-2511	active	69	\N	DX	3	\N	9
117	7	1038	7-1038-2511	active	57	\N	DX	7	\N	8
118	8	1038	8-1038-2511	active	58	\N	DX	8	\N	8
92	12	1036	12-1036-2512	active	76	\N	SX	2	\N	12
120	10	1038	10-1038-2512	active	77	\N	DX	10	\N	12
107	7	1037	\N	disponibile	\N	\N	SX	2	\N	11
116	6	1038	\N	available	\N	\N	DX	6	\N	11
115	5	1038	5-1038-2512	active	90	\N	DX	5	\N	11
97	17	1036	17-1036-2512	active	91	\N	SX	7	\N	11
\.


--
-- TOC entry 4087 (class 0 OID 16522)
-- Dependencies: 224
-- Data for Name: clienti; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clienti (id, denominazione, indirizzo, comune, cap, provincia, paese, email, telefono, piva, codice_fiscale, fatture_in_cloud_id, attivo, created_at, updated_at) FROM stdin;
1	ACUINUGA Aquacoltura Nutricion de Galizia		Bertamiráns, A Coruña, Spagna	15220	A Coruna	Spagna	tecnico@acuinuga.com		B70089750	N/A	\N	t	2025-11-28 08:42:47.153327	\N
2	Alba Nuova Cooperativa a mutualità prevalente		Goro	44020	FE	Italia	alba.nuova@libero.it,albanuova.coop@libero.it		01952290383	N/A	\N	t	2025-11-28 08:42:47.514331	\N
3	ALBA Società cooperativa		Rosolina RO, Italia	45010	RO	Italia			IT01187870298	N/A	\N	t	2025-11-28 08:42:47.577464	\N
4	Albarella soc. Coop.		Rosolina RO, Italia	45010	RO	Italia			00942980293	N/A	\N	t	2025-11-28 08:42:47.642317	\N
5	ALCIONE PESCA SOCIETA' AGRICOLA S.S.		PORTO VIRO	45014	RO	Italia	sebastianocamuffo@gmail.com		01564660296	N/A	\N	t	2025-11-28 08:42:48.537943	\N
6	Apollo soc.coop.arl		Goro	44020	FE	Italia	riccisound@gmail.com		01484940380	N/A	\N	t	2025-11-28 08:42:49.885955	\N
7	Aurora SSA		Goro	44020	FE	Italia	aurorasoc3@gmail.com		02086280381	N/A	\N	t	2025-11-28 08:42:50.218783	\N
8	Azzalin Celestino		Porto Viro	45014	RO	Italia	criscele@icloud.com		01498140290	N/A	\N	t	2025-11-28 08:42:51.177759	\N
9	Barboni Franco		Mesola	44026	FE	Italia	nikcurvaovest74@gmail.com		01796430385	N/A	\N	t	2025-11-28 08:42:51.718246	\N
10	Bassa Marea Soc. Coop. Agricola		Goro	44020	FE	Italia	deltaced@deltaced.it		02137160384	N/A	\N	t	2025-11-28 08:42:52.094401	\N
11	BioClam		Rosolina	45010	RO	Italia	bioclam@pec.it		01531600292	N/A	\N	t	2025-11-28 08:42:52.403786	\N
12	BORDINA ALBERTO		Rosolina	45010	RO	Italia	bordina72@gmail.com		01345320293	N/A	\N	t	2025-11-28 08:42:52.72375	\N
13	Boscarato Alessandro		Rosolina	45010	RO	Italia			01034440295	N/A	\N	t	2025-11-28 08:42:53.046556	\N
14	BROS SOCIETA' SEMPLICE AGRICOLA		COMACCHIO	44022	FERRARA	Italia			01998490385	N/A	\N	t	2025-11-28 08:42:53.853677	\N
15	CAM Conservificio Allevatori Molluschi srl		Chioggia	30015	VE	Italia	molluschi@camittico.it		00182700278	N/A	\N	t	2025-11-28 08:42:54.297618	\N
16	Cazzola Alessandro		Gorino	44020	FE	Italia	coopadriatica@libero.it		01623590385	N/A	\N	t	2025-11-28 08:42:54.632385	\N
17	Cazzola Paolo soc. Adriatica		Gorino FE, Italia	44020	FE	Italia			00971080387	N/A	\N	t	2025-11-28 08:42:54.697386	\N
18	Ceppa Società Semplice Agricola di Oselladore R.E. Bollini J.		Rosolina	45010	RO	Italia	ruggero977@gmail.com		01522020294	N/A	\N	t	2025-11-28 08:42:54.996443	\N
19	CLAMS SOCIETA' COOPERATIVA		GORO	44020	FE	Italia			01592850380	N/A	\N	t	2025-11-28 08:42:55.394938	\N
20	Consorzio Coop. Pescatori del Polesine OP soc coop		Porto Tolle	45018	RO	Italia	Avanzoveronica@consorzioscardovari.it		00224140293	N/A	\N	t	2025-11-28 08:42:55.78303	\N
21	Consorzio Delta Nord		Rosolina	45010	RO	Italia			01074500297	N/A	\N	t	2025-11-28 08:42:56.074918	\N
22	CONSORZIO MOLLUSCHICOLTORI VENETI		Rosolina RO, Italia	45010	ROVIGO	Italia			01477820292	N/A	\N	t	2025-11-28 08:42:56.14054	\N
23	Consorzio Pescatori di Goro Soc. Coop. OP		Goro	44020	FE	Italia	paola.gianella@copego.it,massimo.genari@copego.it		00040400384	N/A	\N	t	2025-11-28 08:42:56.8242	\N
24	Coop San Marco		Gorino	44020	FE	Italia	CoopSanMarco.b@gmail.com		01477960387	N/A	\N	t	2025-11-28 08:42:57.172571	\N
25	Coop Venere		Goro	44020	FE	Italia	g.trombini@libero.it		01738060381	N/A	\N	t	2025-11-28 08:42:57.49393	\N
26	Coop. Adriatica Gorino		Gorino FE, Italia	44020	FE	Italia	coopadriatica@libero.it		00423670389	N/A	\N	t	2025-11-28 08:42:57.559344	\N
27	Coop. La Vela		Goro	44020	FE	Italia	cooplavela@autlook.com		01227850383	N/A	\N	t	2025-11-28 08:42:57.956341	\N
28	Coop.Pescatori Volano scarl		Marano Lagunare	33050	UD	Italia	direzione@coopescasanvito.it		00386860308	N/A	\N	t	2025-11-28 08:42:58.294472	\N
29	Cooperativa Clodiense Bullo Stefano		Chioggia	30015	VE	Italia	pescatoriclodiense@libero.it		03271790275	N/A	\N	t	2025-11-28 08:42:58.713173	\N
30	Cooperativa del Mare		Goro	44020	FE	Italia	amministrazione@coopdelmare.it		00745110387	N/A	\N	t	2025-11-28 08:42:59.03489	\N
32	Cooperativa LA ROMANINA Soc. Coop. arl		Mesola	44026	FE	Italia	cooplaromanina@gmail.com		01427580384	N/A	\N	t	2025-11-28 08:43:00.213321	\N
33	Cooperativa Pesca Soc.Coop.		Goro	44020	FE	Italia	coopvolano@lamiapec.it		01743670380	N/A	\N	t	2025-11-28 08:43:00.615388	\N
34	COOPERATIVA PESCATORI DEL DELTA - SOCIETA' COOPERATIVA		GORO	44020	FE	Italia	cooppescatorideldelta@virgilio.it		01123310383	N/A	\N	t	2025-11-28 08:43:00.987604	\N
35	COOPERATIVA PESCATORI DI VOLANO - SOCIETA' COOPERATIVA		CODIGORO	44021	FE	Italia			01740080385	N/A	\N	t	2025-11-28 08:43:01.35211	\N
36	Cooperativa Pescatori Eridania srl		Porto Viro	45014	RO	Italia	info@eridania.191.it		00038310298	N/A	\N	t	2025-11-28 08:43:01.708197	\N
37	Cooperativa Pescatori Laghese Società Cooperativa ARL		Lagosanto	44023	FE	Italia	nicoletta.carlin@studio-duo.it		01356120384	N/A	\N	t	2025-11-28 08:43:02.011491	\N
38	Cooperativa S. ANTONIO Società Cooperativa		Goro	44020	FE	Italia	coopsantantonio@libero.it		01258950383	N/A	\N	t	2025-11-28 08:43:02.365562	\N
39	Cooperativa Sole Soc. Coop. agricola		GORO	44020	FE	Italia	deltadec@deltaced.it,paganinipaolo@gmail.com		02153890385	N/A	\N	t	2025-11-28 08:43:02.667945	\N
31	NEW AGRICOLT Innovation soc agr srl		Mesola	44026	FE	Italia	delta@deltaced.it		01708360381	N/A	\N	t	2025-11-28 08:42:59.553713	2025-11-28 08:43:16.426
40	Denodini Mar di Turri Thomas		Rosolina	45010	RO	Italia	denodinim@pec.it		01591170293	N/A	\N	t	2025-11-28 08:43:03.30581	\N
41	e-distribuzione SpA		Roma	00198	RM	Italia	alessandro.andreani@enel.com		15844561009	N/A	\N	t	2025-11-28 08:43:03.684666	\N
42	Ecotapes Zeeland B.V.		Kamperland	4493	Nederland	Paesi Bassi	ecotapes.zeeland@gmail.com		NL862293832B01	N/A	\N	t	2025-11-28 08:43:04.028972	\N
43	Ephelia soc. semplice		Gorino	44020	FE	Italia	tagliaticelestino@gmail.com		01746090388	N/A	\N	t	2025-11-28 08:43:04.337116	\N
44	Felletti Andrea		Mesola	44026	FE	Italia	carlo.trombini1986@libero.it		01990650382	N/A	\N	t	2025-11-28 08:43:04.717975	\N
45	Felletti Michela		Comacchio	44022	FE	Italia	felletti83@gmail.com		02027370382	N/A	\N	t	2025-11-28 08:43:05.018046	2025-11-28 08:43:05.309
46	Filippo Conventi		Goro	44020	FE	Italia	filippoconventi19@g.mail.com		01368760383	N/A	\N	t	2025-11-28 08:43:05.822799	\N
47	Gatti Michele		Chioggia	30015	VE	Italia	bischeroa@yahoo.it		03455450274	N/A	\N	t	2025-11-28 08:43:06.199112	\N
48	Gelli Maria Elena		Comacchio	44022	FE	Italia	felletti83@gmail.com		02013320383	N/A	\N	t	2025-11-28 08:43:06.494547	\N
49	Gloria Pesca S.S.A.		Porto Viro	45014	RO	Italia	martin85@libero.it		01481390290	N/A	\N	t	2025-11-28 08:43:06.860948	\N
50	GROBOS SOCIETA' COOPERATIVA		ROSOLINA	45010	RO	Italia			01194430292	N/A	\N	t	2025-11-28 08:43:07.162905	\N
51	I Simpson Soc. Cooperativa		Corbola	45015	RO	Italia	fratelliecognati@gmail.com		01548860293	N/A	\N	t	2025-11-28 08:43:07.510709	\N
52	LA BUSSOLA - SOCIETA' COOPERATIVA		GORO	44020	FE	Italia	labussolagoro@tiscali.it		01654200383	N/A	\N	t	2025-11-28 08:43:07.796142	\N
53	LA FENICE SOC COOP ARL		Bosco Mesola FE, Italia	44026	Ferrara	Italia	cooplafenice11@legalmail.it		01885870384	N/A	\N	t	2025-11-28 08:43:07.860048	\N
54	La Laguna		Goro	44020	FE	Italia			01816190381	N/A	\N	t	2025-11-28 08:43:08.149662	\N
55	La Perla Nera Società Semplice Agricola		Chioggia	30015	VE	Italia			04262250279	N/A	\N	t	2025-11-28 08:43:08.468384	\N
56	LA SACCA SOC. COOPERATIVA		Goro	44020	FE	Italia	cooplasacca@libero.it		01427440381	N/A	\N	t	2025-11-28 08:43:10.621072	\N
57	La Valle società Coopertiva		Comacchio (FE)	44022	FE	Italia	irene.rizzardi@gmail.com		14355303389	N/A	\N	t	2025-11-28 08:43:11.83388	\N
58	LA VERACE Società Cooperativa		Goro	44020	Ferrara	Italia	coop.laverace@virgilio.it		01877390383	N/A	\N	t	2025-11-28 08:43:13.282226	\N
59	LE NOSTRANE ss		Chioggia	30015	VE	Italia			04581990274	N/A	\N	t	2025-11-28 08:43:13.668282	\N
60	MAGI soc coop semplice		Bosco Mesola	44046	RO	Italia	mgib@mgib.it		02081590388	N/A	\N	t	2025-11-28 08:43:13.981959	\N
61	MAGICA SOCIETA' COOPERATIVA		COMACCHIO	44029	FE	Italia			01911510384	N/A	\N	t	2025-11-28 08:43:14.280465	\N
62	MARCHIOL S.P.A.		RONCADE	31056	TV	Italia			01176110268	N/A	\N	t	2025-11-28 08:43:14.635891	\N
63	MARTIN JONNI		Rosolina RO, Italia	45010	ROVIGO	Italia			01334030291	N/A	\N	t	2025-11-28 08:43:14.698291	\N
64	Milani Nicola		Gorino	44020	FE	Italia	coopadriatica@libero.it		01147900383	N/A	\N	t	2025-11-28 08:43:14.992359	\N
65	Milani Vittorio		Gorino	44020	FE	Italia	coopadriatica@libero.it		01078860382	N/A	\N	t	2025-11-28 08:43:15.39788	\N
66	Miracoli soc agr		Goro	44020	FE	Italia	raffaelecazzola84@gmail.com		01893940385	N/A	\N	t	2025-11-28 08:43:15.869173	\N
67	Moceniga Pesca S.S.		Rosolina	45010	RO	Italia	moceniga@libero.it		01082120294	N/A	\N	t	2025-11-28 08:43:16.1634	\N
68	Nuova Levante S.s.		Comacchio	44022	FE	Italia	snc.alberi@gmail.com		01729020386	N/A	\N	t	2025-11-28 08:43:16.728171	\N
69	PICO PALLINO SOCIETA' A RESPONSABILITA' LIMITATA SEMPLIFICATA		REGGIO EMILIA	42121	RE	Italia			02585550359	N/A	\N	t	2025-11-28 08:43:17.132763	\N
70	POLESINE CONSULTING S.R.L.		PORTO VIRO	45014	RO	Italia			01613480290	N/A	\N	t	2025-11-28 08:43:17.496643	\N
71	Poseidonia s.s. soc.agr. di Meloni Fulvio e Zennaro Manuel		Porto Tolle	45018	RO	Italia	criscele@icloud.com		01490310297	N/A	\N	t	2025-11-28 08:43:18.421599	\N
72	Poseidonia soc. agricola		CHIOGGIA	30015	VE	Italia			05081120288	N/A	\N	t	2025-11-28 08:43:18.77124	\N
73	REAMAR soc. coop.arl		Comacchio	44022	FE	Italia			01996720387	N/A	\N	t	2025-11-28 08:43:19.129485	\N
74	REGINA SOC. AGRICOLA S.S.		Ariano nel Polesine	45012	RO	Italia	modena.riccardo@gmail.com		01569590290	N/A	\N	t	2025-11-28 08:43:19.430543	\N
75	RO.MA.MAR Società Cooperativa a.r.l		Goro	44020	FE	Italia	ro.ma.mar.goro@gmail.com		01575130388	N/A	\N	t	2025-11-28 08:43:20.337829	\N
76	San Marco società cooperativa		Pomezia	71	RM	Italia	dantoni_sandro@hotmail.it		14512451007	N/A	\N	t	2025-11-28 08:43:20.698879	\N
77	San Pietro S.C.A.R.L.		Comacchio	44022	FE	Italia	sanpietro.pozzati@gmail.com		IT01513320380	N/A	\N	t	2025-11-28 08:43:21.620774	\N
78	SERENISSIMA PESCA SOC COOP		ROSOLINA	45010	ROVIGO	Italia			02925260271	N/A	\N	t	2025-11-28 08:43:21.974532	\N
81	Soc Coop Poseidone		Rosolina	45010	RO	Italia			01251320295	N/A	\N	t	2025-11-28 08:43:25.221612	\N
82	Soc cooperativa Rosa dei Venti		Goro	44020	FE	Italia	rosadeiventi3@gmail.com		01257010387	N/A	\N	t	2025-11-28 08:43:26.432776	\N
84	Soc. Agricola Scanno di Tironi Giuseppe		Limena	35010	PD	Italia			03407720287	N/A	\N	t	2025-11-28 08:43:28.866987	\N
85	soc. coop. Marinetta		Taglio di Po RO, Italia	45019	RO	Italia			01284160296	N/A	\N	t	2025-11-28 08:43:28.93053	\N
80	Soc.Agr.Alma pesca ss		Rosolina	45010	RO	Italia	coop.rosolina@gmail.com		00750250292	N/A	\N	t	2025-11-28 08:43:23.816322	2025-11-28 08:43:29.71
86	SOC.COOPERATIVA GORINO		GORO	44020	FE	Italia			01218150389	N/A	\N	t	2025-11-28 08:43:30.084019	\N
83	Societa agr. Alissa s.s.		Porto Viro	45014	RO	Italia	agricolafratellicavallari@gmail.com		01571890290	N/A	\N	t	2025-11-28 08:43:27.795004	2025-11-28 08:43:31.666
87	società agricola Kappa s.s. di Varagnolo Maurizio e C.		Padova	35121	PD	Italia			05020560289	N/A	\N	t	2025-11-28 08:43:31.99754	\N
88	Società agricola Moceniga Pesca s.s		Chioggia	30015	VE	Italia	robertopenzo832@yahoo.it		04443240272	N/A	\N	t	2025-11-28 08:43:32.481593	\N
89	Società Cooperativa ALBATROS		Goro	44020	FE	Italia	beppemicali73@gmail.com		01706620380	N/A	\N	t	2025-11-28 08:43:33.14985	\N
90	SOCIETA' AGRICOLA ECOTAPES SRL		Chioggia	30015	VE	Italia	ecotapes.2020@gmail.com		04621060278	N/A	\N	t	2025-11-28 08:43:33.458352	\N
91	SOCIETA' AGRICOLA TIRRENA		PORTO VIRO	45014	ROVIGO	Italia	società.agricola@legalmail.it		00305250292	N/A	\N	t	2025-11-28 08:43:33.762098	\N
92	SOCIETA' COOPERATIVA ACQUAVIVA		Comacchio	44022	FE	Italia	massimoballarinidec@libero.it		01841330382	N/A	\N	t	2025-11-28 08:43:34.08353	\N
93	SOCIETA' COOPERATIVA PESCATORI S.GIULIA		PORTO TOLLE	45018	RO	Italia			01158780294	N/A	\N	t	2025-11-28 08:43:35.06872	\N
94	SOL LEVANTE - SOCIETA' COOPERATIVA		Goro	44020	FE	Italia	coopsollevante@gmail.com		01924210386	N/A	\N	t	2025-11-28 08:43:35.842697	\N
79	Spinadin Pesca					Italia			00000000000	N/A	\N	t	2025-11-28 08:43:22.67289	2025-11-28 08:43:36.163
95	Stichting zeeschelp		KAMPERLAND	04493	EE	Paesi Bassi			NL813730089B	N/A	\N	t	2025-11-28 08:43:36.835358	\N
96	Tagliati Simone		Gorino	44020	FE	Italia	coopadriatica@libero.it		01277000384	N/A	\N	t	2025-11-28 08:43:37.422629	\N
97	Tiozzo Pagio Michael		CHIOGGIA	30015	VE	Italia			04618970273	N/A	\N	t	2025-11-28 08:43:37.77523	\N
98	Tosatti Andrea		Goro	44020	FE	Italia	andreatosatti@gmail.com		01626450389	N/A	\N	t	2025-11-28 08:43:38.203031	\N
99	Trombini Graziano		Bosco Mesola	44026	FE	Italia			00995820388	N/A	\N	t	2025-11-28 08:43:38.554255	\N
100	Trombini Silvana		Goro	44020	FE	Italia	morgan.turri@alice.it		01881110389	N/A	\N	t	2025-11-28 08:43:39.397174	\N
101	TURGIAMAR SOC. COOP.		Goro	44020	FE	Italia	studiofabianicinti@virgilio.it		01627470386	N/A	\N	t	2025-11-28 08:43:39.696061	\N
102	V.F.D. GROUP S.R.L.S.		MESOLA	44026	FE	Italia	vfdgroupfe@gmail.com		02160410383	N/A	\N	t	2025-11-28 08:43:40.074908	\N
103	VENUS - SOC. COOP.		GORO	44020	FE	Italia	coopvenusgoro@gmail.com		01252330384	N/A	\N	t	2025-11-28 08:43:40.41929	\N
104	Vi.Effe ssa		Chioggia	30015	VE	Italia	alissasocagricola@libero.it		04125900276	N/A	\N	t	2025-11-28 08:43:41.699109	\N
105	Vongola viva Soc. Agricola - Stocco Daniele		Rosolina	45010	RO	Italia	segreteria@polesineconsulting.it		01470220292	N/A	\N	t	2025-11-28 08:43:43.203578	\N
\.


--
-- TOC entry 4089 (class 0 OID 16542)
-- Dependencies: 226
-- Data for Name: configurazione; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.configurazione (id, chiave, valore, descrizione, created_at, updated_at) FROM stdin;
1	fatture_in_cloud_client_id	w2VtlcTHpHfmqQMZz8Bs4Buqk5Uuwi1I	Client ID OAuth2 Fatture in Cloud	2025-10-07 13:58:50.992733	2025-10-07 14:29:50.784
2	fatture_in_cloud_client_secret	L0YCH9FYQwYvKKYGg9O2rbwkA15Bs29X8i5wHmF70aWQGdveMzpHiMYn5UtutGtL	Client Secret OAuth2 Fatture in Cloud	2025-10-07 13:58:51.732747	2025-10-07 14:29:51.242
25	fatture_in_cloud_access_token	a/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyZWYiOiJHckNVZVBoWlA5RzhNYndkWjNkbVQycW1JT2tTdEFFYSJ9.cDCEgIXSz9gid0FV5EY1J4hEvtkJqsvQRiylOf2UzaA	Token API diretto per Fatture in Cloud	2025-10-07 14:40:20.918015	2025-10-07 14:40:20.918015
27	fatture_in_cloud_auth_mode	token	Modalità di autenticazione (token/oauth)	2025-10-07 14:40:22.59019	2025-10-07 14:40:22.59019
9	fatture_in_cloud_company_id	1052922	ID Azienda da segreti Replit	2025-10-07 14:08:48.242759	2025-10-31 16:42:16.634
\.


--
-- TOC entry 4091 (class 0 OID 16555)
-- Dependencies: 228
-- Data for Name: cycles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cycles (id, basket_id, lot_id, start_date, end_date, state) FROM stdin;
7	2	3	2025-11-26	\N	active
8	23	3	2025-11-26	\N	active
9	3	3	2025-11-26	\N	active
10	24	3	2025-11-26	\N	active
11	4	3	2025-11-26	\N	active
12	5	3	2025-11-26	\N	active
13	25	3	2025-11-26	\N	active
14	26	3	2025-11-26	\N	active
15	27	3	2025-11-26	\N	active
16	28	3	2025-11-26	\N	active
17	29	3	2025-11-26	\N	active
18	30	3	2025-11-26	\N	active
19	31	3	2025-11-26	\N	active
20	32	3	2025-11-26	\N	active
21	33	3	2025-11-26	\N	active
22	34	3	2025-11-26	\N	active
23	35	3	2025-11-26	\N	active
24	36	3	2025-11-26	\N	active
25	37	3	2025-11-26	\N	active
26	38	3	2025-11-26	\N	active
27	39	3	2025-11-26	\N	active
29	7	4	2025-11-27	\N	active
31	9	4	2025-11-27	\N	active
34	81	5	2025-11-28	\N	active
35	82	5	2025-11-28	\N	active
37	84	5	2025-11-28	\N	active
38	85	5	2025-11-28	\N	active
40	87	5	2025-11-28	\N	active
41	89	5	2025-11-28	\N	active
43	91	5	2025-11-28	\N	active
44	90	5	2025-11-28	\N	active
46	93	5	2025-11-28	\N	active
48	95	5	2025-11-28	\N	active
49	96	5	2025-11-28	\N	active
51	111	5	2025-11-28	\N	active
52	112	5	2025-11-28	\N	active
53	113	5	2025-11-28	\N	active
54	114	5	2025-11-28	\N	active
57	117	5	2025-11-28	\N	active
58	118	5	2025-11-28	\N	active
59	119	5	2025-11-28	\N	active
61	121	5	2025-11-28	\N	active
62	122	5	2025-11-28	\N	active
63	123	5	2025-11-28	\N	active
64	124	5	2025-11-28	\N	active
65	125	5	2025-11-28	\N	active
66	126	5	2025-11-28	\N	active
67	101	5	2025-11-28	\N	active
68	102	5	2025-11-28	\N	active
69	103	5	2025-11-28	\N	active
70	104	5	2025-11-28	\N	active
72	106	5	2025-11-28	\N	active
74	108	5	2025-11-28	\N	active
45	92	5	2025-11-28	2025-12-01	closed
42	88	5	2025-11-28	2025-12-01	closed
60	120	5	2025-11-28	2025-12-01	closed
75	88	5	2025-12-01	\N	active
76	92	5	2025-12-01	\N	active
77	120	5	2025-12-01	\N	active
78	98	5	2025-12-03	\N	active
79	99	5	2025-12-03	\N	active
80	100	5	2025-12-03	\N	active
71	105	5	2025-11-28	2025-12-03	closed
73	107	5	2025-11-28	2025-12-03	closed
36	83	5	2025-11-28	2025-12-03	closed
39	86	5	2025-11-28	2025-12-03	closed
47	94	5	2025-11-28	2025-12-03	closed
83	83	5	2025-12-03	2025-12-03	closed
84	86	5	2025-12-03	2025-12-03	closed
28	6	4	2025-11-27	2025-12-03	closed
32	10	4	2025-11-27	2025-12-03	closed
85	6	4	2025-12-03	2025-12-03	closed
86	10	4	2025-12-03	2025-12-03	closed
5	21	3	2025-11-26	2025-12-03	closed
6	22	3	2025-11-26	2025-12-03	closed
87	21	3	2025-12-03	2025-12-03	closed
88	22	3	2025-12-03	2025-12-03	closed
30	8	4	2025-11-27	2025-12-04	closed
89	8	4	2025-12-04	2025-12-04	closed
50	97	5	2025-11-28	2025-12-04	closed
55	115	5	2025-11-28	2025-12-04	closed
56	116	5	2025-11-28	2025-12-04	closed
90	115	5	2025-12-04	\N	active
91	97	5	2025-12-04	\N	active
92	83	5	2025-12-04	\N	active
96	61	10	2025-12-06	\N	active
97	62	11	2025-12-06	\N	active
\.


--
-- TOC entry 4093 (class 0 OID 16565)
-- Dependencies: 230
-- Data for Name: ddt; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ddt (id, numero, data, cliente_id, cliente_nome, cliente_indirizzo, cliente_citta, cliente_cap, cliente_provincia, cliente_piva, cliente_codice_fiscale, cliente_paese, company_id, mittente_ragione_sociale, mittente_indirizzo, mittente_cap, mittente_citta, mittente_provincia, mittente_partita_iva, mittente_codice_fiscale, mittente_telefono, mittente_email, mittente_logo_path, totale_colli, peso_totale, note, ddt_stato, fatture_in_cloud_id, fatture_in_cloud_numero, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4095 (class 0 OID 16579)
-- Dependencies: 232
-- Data for Name: ddt_righe; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ddt_righe (id, ddt_id, descrizione, quantita, unita_misura, prezzo_unitario, report_dettaglio_id, advanced_sale_id, sale_bag_id, basket_id, size_code, flupsy_name, created_at) FROM stdin;
\.


--
-- TOC entry 4097 (class 0 OID 16591)
-- Dependencies: 234
-- Data for Name: email_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_config (id, key, value, created_at, updated_at) FROM stdin;
1	email_recipients	{"ectprgw@gmail.com","office.deltafuturo@gmail.com"}	2025-10-12 09:01:17.917	2025-10-12 17:10:39.256
2	email_cc		2025-10-12 09:01:18.403	2025-10-12 17:10:39.702
3	email_send_time	20:00	2025-10-12 09:01:18.881	2025-10-12 17:10:40.151
4	auto_email_enabled	false	2025-10-12 09:01:19.359	2025-10-12 17:10:40.597
\.


--
-- TOC entry 4099 (class 0 OID 16603)
-- Dependencies: 236
-- Data for Name: external_customers_sync; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.external_customers_sync (id, external_id, customer_code, customer_name, customer_type, vat_number, tax_code, address, city, province, postal_code, country, phone, email, is_active, notes, synced_at, last_modified_external) FROM stdin;
\.


--
-- TOC entry 4101 (class 0 OID 16617)
-- Dependencies: 238
-- Data for Name: external_deliveries_sync; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.external_deliveries_sync (id, external_id, data_creazione, cliente_id, ordine_id, data_consegna, stato, numero_totale_ceste, peso_totale_kg, totale_animali, taglia_media, qrcode_url, note, numero_progressivo, synced_at, last_sync_at, last_modified_external) FROM stdin;
\.


--
-- TOC entry 4103 (class 0 OID 16629)
-- Dependencies: 240
-- Data for Name: external_delivery_details_sync; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.external_delivery_details_sync (id, external_id, report_id, misurazione_id, vasca_id, codice_sezione, numero_ceste, peso_ceste_kg, taglia, animali_per_kg, percentuale_scarto, percentuale_mortalita, numero_animali, note, synced_at, last_sync_at, last_modified_external) FROM stdin;
\.


--
-- TOC entry 4105 (class 0 OID 16641)
-- Dependencies: 242
-- Data for Name: external_sales_sync; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.external_sales_sync (id, external_id, sale_number, sale_date, customer_id, customer_name, product_code, product_name, product_category, quantity, unit_of_measure, unit_price, total_amount, discount_percent, discount_amount, net_amount, vat_percent, vat_amount, total_with_vat, payment_method, delivery_date, origin, lot_reference, sales_person, notes, status, synced_at, last_modified_external) FROM stdin;
\.


--
-- TOC entry 4186 (class 0 OID 811009)
-- Dependencies: 323
-- Data for Name: external_users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.external_users (id, delta_operator_id, username, hashed_password, temp_password_token, temp_password_expires_at, first_name, last_name, email, phone, role, is_active, last_sync_at, sync_version, created_at, updated_at) FROM stdin;
1	1	andrea@flupsy.local	$2b$10$Q/Y2G3A3Hp1WCsbQxYMmy.poxVSlH4nIpbbimW.LYg3EWNVkU86MW	\N	\N	Andrea	Contato	\N	\N	operatore	t	2025-11-11 17:32:08.93	2	2025-11-08 09:41:15.492728	2025-11-11 17:32:08.93
5	4	diego@flupsy.local	$2b$10$UF5xNNckghfkWHA4g9pWre4Pz4W2SsZd59cuK0BJSB6LmZ5Eb.Yyi	\N	\N	Diego 	Falconi	\N	\N	operatore	t	2025-11-11 17:32:09.022	2	2025-11-08 09:41:15.492728	2025-11-11 17:32:09.022
6	5	ever@flupsy.local	$2b$10$H5Tt8oOy1Eq9YEm4PF03l.WYPxj269lbC9cLh23WT3DC9CuadGm4m	\N	\N	Ever	Lago	\N	\N	operatore	t	2025-11-11 17:32:09.059	2	2025-11-08 09:41:15.492728	2025-11-11 17:32:09.059
2	6	davide@flupsy.local	$2b$10$gjbVRoKgm3gdvmGrCEHNEuH0vkWAkC/MagJ5sFmWZHm5GTfFitrka	\N	\N	Davide 	Boscolo	\N	\N	operatore	t	2025-11-11 17:32:09.097	2	2025-11-08 09:41:15.492728	2025-11-11 17:32:09.097
4	7	gianluca@flupsy.local	$2b$10$2RzYucmuiz58r3gDNNsDgeBblzhIN0CmyycgXE30Ti1frY1ANYsue	\N	\N	Gianluca	XX	\N	\N	operatore	t	2025-11-11 17:32:09.133	2	2025-11-08 09:41:15.492728	2025-11-11 17:32:09.133
3	8	mauro@flupsy.local	$2b$10$sNriaxbxgb0PD6jkN3CZJ.mUSIFv69VkUkpP43SnA2BjIsYrpENDe	\N	\N	Mauro	Dr. Patella	\N	\N	operatore	t	2025-11-11 17:32:09.17	2	2025-11-08 09:41:15.492728	2025-11-11 17:32:09.17
7	9	operatore9@flupsy.local	$2b$10$NnWySR4gUVFfBtVIFoblB.QnEZ5uEAhoRD47.qX0RSjJQ2hCBQJDK	temp_1762882329395_oyw97a	2025-12-11 17:32:09.395	Luca	Dr. Ferrarese	\N	\N	operatore	t	2025-11-11 17:32:09.414586	1	2025-11-11 17:32:09.414586	\N
8	10	lago.gianluigi@gmail.com	$2b$10$nFzVqq.wuQNsVqoXFJaixuI3CAngjMkM3MKar.CmOnq6BGI1ot/zS	temp_1762882329571_mak8ng	2025-12-11 17:32:09.571	Gianluigi	Lago	lago.gianluigi@gmail.com	\N	operatore	t	2025-11-11 17:32:09.589922	1	2025-11-11 17:32:09.589922	\N
9	11	paola.landri@gmail.com	$2b$10$8JAS9LsS55EIs6N6y4YuWOZ8qtwyeYA.EBjhSJ.c4edfDSjMLHiui	temp_1762882329706_hkcvy	2025-12-11 17:32:09.706	Paola	Dr.sa Landri	paola.landri@gmail.com	\N	operatore	t	2025-11-11 17:32:09.725886	1	2025-11-11 17:32:09.725886	\N
\.


--
-- TOC entry 4107 (class 0 OID 16659)
-- Dependencies: 244
-- Data for Name: fatture_in_cloud_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fatture_in_cloud_config (id, api_key, api_uid, company_id, access_token, refresh_token, expires_at, token_type, default_payment_method, default_causale_trasporto, default_aspetto_beni, default_porto, numerazione_automatica, prefisso_numero, invio_email_automatico, email_mittente, email_oggetto_template, email_corpo_template, attivo, ragione_sociale, indirizzo, cap, citta, provincia, partita_iva, codice_fiscale, telefono, email, logo_path, created_at, updated_at) FROM stdin;
1	\N	\N	1017299	\N	\N	\N	Bearer	\N	Vendita	Colli	Franco	t	\N	f	\N	\N	\N	t	Ecotapes Soc. Agr. Srl	Via Canal di Valle 5c	30015	Chioggia	VE	04621060278	04621060278	\N	ecotapes.2020@gmail.com	\N	2025-10-07 17:30:20.838329	2025-10-07 17:30:20.838329
3	\N	\N	1052922	\N	\N	\N	Bearer	\N	Vendita	Colli	Franco	t	\N	f	\N	\N	\N	t	Delta Futuro Soc. Agr. Srl	Via Emilia 47	44020	Goro	FE	02057710382	02057710382	+39 3484105353	deltafuturo.goro@gmail.com	\N	2025-10-07 18:19:09.579691	2025-10-07 18:19:09.579691
2	\N	\N	1052922	\N	\N	\N	Bearer	\N	Vendita	Colli	Franco	t	\N	f	\N	\N	\N	t	Delta Futuro Soc. Agr. Srl	Via Emilia 47	44020	Goro	FE	02057710382	02057710382	+39 3484105353	deltafuturo.goro@gmail.com	\N	2025-10-07 17:30:20.838329	2025-10-07 17:30:20.838329
\.


--
-- TOC entry 4109 (class 0 OID 16677)
-- Dependencies: 246
-- Data for Name: flupsys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.flupsys (id, name, location, description, active, max_positions, production_center, latitude, longitude, geo_radius) FROM stdin;
1039	FLUPSY 4	Ca Pisani	FLUPSY ALL. CON P. SOLARI CESTE DA 2000 E 1000 DEDICATO ALLE GRANDI TAGLIE 	t	20	Ecotapes Italia	\N	\N	50
1012	BINS	ECOTAPES - Ca Pisani	5 bins con 4 cestelli ciascuno, 20 totali 	t	20	Ecotapes Italia	\N	\N	50
1607	Flupsy 1 Bianco Vetroresina	Vasca FL lato Goro		t	20	Delta Futuro GORO	\N	\N	50
1036	FLUPSY 1 	Ca Pisani	FLUPSY IN ALLUMINIO 	t	20	Ecotapes Italia	\N	\N	50
1037	FLUPSY 2	Ca Pisani	MINI FLUPSY DEDICATO AGLI ANIMALI DI PICCOLA TAGLIA 	t	10	Ecotapes Italia	\N	\N	50
1608	Flupsy 2 nero PVC	Vasca FL lato Gorino		t	20	Delta Futuro GORO	\N	\N	50
1038	FLUPSY 3	Ca Pisani	BIG FLUPSY CON CESTE DA 700 E DA 1000	t	20	Ecotapes Italia	\N	\N	50
\.


--
-- TOC entry 4165 (class 0 OID 393217)
-- Dependencies: 302
-- Data for Name: growth_analysis_runs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.growth_analysis_runs (id, executed_at, date_from, date_to, flupsy_ids, analysis_types, status, dataset_size, results, insights, error_message) FROM stdin;
1	2025-11-28 12:15:13.249404	2025-11-28	2025-12-30	\N	\N	failed	0	\N	\N	Nessuna operazione trovata per il periodo specificato
\.


--
-- TOC entry 4171 (class 0 OID 393248)
-- Dependencies: 308
-- Data for Name: growth_distributions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.growth_distributions (id, analysis_run_id, size_id, lot_id, month, year, sample_size, mean_sgr, median_sgr, std_deviation, percentile_25, percentile_50, percentile_75, percentile_90, min_sgr, max_sgr, distribution_type, raw_data, created_at) FROM stdin;
\.


--
-- TOC entry 4192 (class 0 OID 1024014)
-- Dependencies: 329
-- Data for Name: lci_consumables; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lci_consumables (id, name, category, unit, ecoinvent_process, default_annual_amount, notes, active, created_at) FROM stdin;
\.


--
-- TOC entry 4194 (class 0 OID 1024025)
-- Dependencies: 331
-- Data for Name: lci_consumption_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lci_consumption_logs (id, consumable_id, period_start, period_end, amount, source, notes, created_at, created_by) FROM stdin;
\.


--
-- TOC entry 4190 (class 0 OID 1024001)
-- Dependencies: 327
-- Data for Name: lci_materials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lci_materials (id, name, category, material_type, expected_life_years, disposal_method, quantity, unit, unit_weight_kg, flupsy_reference, installation_date, notes, active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4196 (class 0 OID 1024036)
-- Dependencies: 333
-- Data for Name: lci_production_snapshots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lci_production_snapshots (id, reference_year, reference_period, size_code, output_kg, output_pieces, input_kg, input_pieces, data_source, calculation_notes, created_at) FROM stdin;
\.


--
-- TOC entry 4198 (class 0 OID 1024047)
-- Dependencies: 335
-- Data for Name: lci_reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lci_reports (id, name, reference_year, status, excel_path, report_data, ai_insights, created_at, finalized_at, exported_at) FROM stdin;
\.


--
-- TOC entry 4200 (class 0 OID 1024058)
-- Dependencies: 337
-- Data for Name: lci_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lci_settings (id, key, value, description, updated_at) FROM stdin;
1	lci_module_enabled	true	Abilita/disabilita modulo LCI	2025-11-25 08:28:46.684771
2	default_reference_year	2025	Anno di riferimento di default	2025-11-25 08:28:46.684771
3	company_info	{"name": "Delta Futuro", "location": "Goro (FE)", "coordinates": "44°50'21\\"N 12°19'22\\"E", "facility_type": "raceways (indoor) + FLUPSY e sand nursery (outdoor)", "facility_size_m2": 70000}	Informazioni aziendali per report LCI	2025-11-25 08:28:46.684771
\.


--
-- TOC entry 4111 (class 0 OID 16688)
-- Dependencies: 248
-- Data for Name: lot_inventory_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lot_inventory_transactions (id, lot_id, date, transaction_type, animal_count, basket_id, operation_id, selection_id, screening_id, notes, metadata, created_at, created_by) FROM stdin;
\.


--
-- TOC entry 4113 (class 0 OID 16698)
-- Dependencies: 250
-- Data for Name: lot_ledger; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lot_ledger (id, date, lot_id, type, quantity, source_cycle_id, dest_cycle_id, selection_id, operation_id, basket_id, allocation_method, allocation_basis, idempotency_key, notes, created_at) FROM stdin;
28	2025-11-27	4	activation	-207514.000	28	\N	\N	28	6	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-27 13:27:21.465247
29	2025-11-27	4	activation	-207519.000	29	\N	\N	29	7	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-27 13:28:29.148025
30	2025-11-27	4	activation	-229997.000	30	\N	\N	30	8	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-27 13:29:24.588779
31	2025-11-27	4	activation	-249725.000	31	\N	\N	31	9	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-27 13:30:11.086782
32	2025-11-27	4	activation	-201440.000	32	\N	\N	32	10	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-27 13:31:07.187886
3	2025-11-03	2	activation	-255200.000	3	\N	\N	3	1	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-26 07:51:11.702712
2	2025-11-03	1	activation	-359511.000	\N	\N	\N	2	22	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-26 07:43:48.208616
1	2025-11-03	1	activation	-435000.000	\N	\N	\N	1	21	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-26 07:42:52.666108
4	2025-11-03	2	activation	-129500.000	\N	\N	\N	4	23	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-26 07:51:56.548014
5	2025-11-26	3	activation	-417600.000	5	\N	\N	5	21	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-26 08:31:10.574576
6	2025-11-26	3	activation	-367500.000	6	\N	\N	6	22	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-26 08:33:00.169064
7	2025-11-26	3	activation	-255200.000	7	\N	\N	7	2	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-26 08:50:38.61188
8	2025-11-26	3	activation	-129500.000	8	\N	\N	8	23	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-26 08:53:55.793471
9	2025-11-26	3	activation	-372000.000	9	\N	\N	9	3	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-26 08:57:27.460131
10	2025-11-26	3	activation	-405900.000	10	\N	\N	10	24	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-26 08:59:49.769919
11	2025-11-26	3	activation	-529920.000	11	\N	\N	11	4	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-26 09:13:21.06444
12	2025-11-26	3	activation	-562950.000	12	\N	\N	12	5	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-26 09:19:47.091392
13	2025-11-26	3	activation	-530000.000	13	\N	\N	13	25	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-26 09:20:57.100704
14	2025-11-26	3	activation	-234080.000	14	\N	\N	14	26	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-26 09:23:15.952175
15	2025-11-26	3	activation	-241390.000	15	\N	\N	15	27	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-26 09:24:25.374262
16	2025-11-26	3	activation	-322848.000	16	\N	\N	16	28	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-26 09:25:25.567876
17	2025-11-26	3	activation	-205200.000	17	\N	\N	17	29	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-26 09:27:37.326416
18	2025-11-26	3	activation	-422650.000	18	\N	\N	18	30	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-26 09:29:43.312922
19	2025-11-26	3	activation	-357700.000	19	\N	\N	19	31	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-26 09:30:55.342845
20	2025-11-26	3	activation	-843525.000	20	\N	\N	20	32	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-26 09:32:33.519588
21	2025-11-26	3	activation	-972000.000	21	\N	\N	21	33	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-26 09:40:44.671461
22	2025-11-26	3	activation	-536310.000	22	\N	\N	22	34	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-26 09:41:41.665325
23	2025-11-26	3	activation	-653350.000	23	\N	\N	23	35	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-26 09:42:49.925468
24	2025-11-26	3	activation	-633275.000	24	\N	\N	24	36	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-26 09:43:38.076768
25	2025-11-26	3	activation	-551150.000	25	\N	\N	25	37	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-26 09:44:40.573742
26	2025-11-26	3	activation	-748980.000	26	\N	\N	26	38	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-26 09:45:30.678138
27	2025-11-26	3	activation	-794230.000	27	\N	\N	27	39	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-26 09:47:52.646278
33	2025-11-28	5	activation	-561195.000	\N	\N	\N	37	81	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 08:41:52.832641
34	2025-11-28	5	activation	-552291.000	34	\N	\N	38	81	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 08:43:51.872064
35	2025-11-28	5	activation	-1142556.000	35	\N	\N	39	82	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 08:45:33.248513
36	2025-11-28	5	activation	-362966.000	36	\N	\N	40	83	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 08:52:58.382201
37	2025-11-28	5	activation	-573448.000	37	\N	\N	41	84	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 08:54:21.852205
38	2025-11-28	5	activation	-1175004.000	38	\N	\N	42	85	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 08:58:01.097328
39	2025-11-28	5	activation	-362966.000	39	\N	\N	43	86	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 08:58:55.291016
40	2025-11-28	5	activation	-1175004.000	40	\N	\N	44	87	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 08:59:58.202449
41	2025-11-28	5	activation	-695530.000	41	\N	\N	45	89	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:02:33.218908
42	2025-11-28	5	activation	-691285.000	42	\N	\N	46	88	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:02:47.929217
43	2025-11-28	5	activation	-695530.000	43	\N	\N	47	91	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:09:02.445626
44	2025-11-28	5	activation	-560495.000	44	\N	\N	48	90	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:10:01.902311
45	2025-11-28	5	activation	-384566.000	45	\N	\N	49	92	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:13:23.853153
46	2025-11-28	5	activation	-241540.000	46	\N	\N	50	93	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:14:20.21201
47	2025-11-28	5	activation	-362966.000	47	\N	\N	51	94	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:15:38.107259
48	2025-11-28	5	activation	-118337.000	48	\N	\N	52	95	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:16:34.15076
49	2025-11-28	5	activation	-552291.000	49	\N	\N	53	96	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:18:24.826291
50	2025-11-28	5	activation	-3001568.000	50	\N	\N	54	97	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:19:15.414257
51	2025-11-28	5	activation	-2979484.000	51	\N	\N	55	111	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:24:21.166143
52	2025-11-28	5	activation	-573448.000	52	\N	\N	56	112	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:25:50.909458
53	2025-11-28	5	activation	-876177.000	53	\N	\N	57	113	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:31:33.831559
54	2025-11-28	5	activation	-2979484.000	54	\N	\N	58	114	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:32:20.81902
55	2025-11-28	5	activation	-2563120.000	55	\N	\N	59	115	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:33:07.302714
56	2025-11-28	5	activation	-2563120.000	56	\N	\N	60	116	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:34:06.543417
57	2025-11-28	5	activation	-1255764.000	57	\N	\N	61	117	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:35:03.105475
58	2025-11-28	5	activation	-1255764.000	58	\N	\N	62	118	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:36:04.685028
59	2025-11-28	5	activation	-1578666.000	59	\N	\N	63	119	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:36:57.191618
60	2025-11-28	5	activation	-735092.000	60	\N	\N	64	120	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:37:43.154164
61	2025-11-28	5	activation	-1142556.000	61	\N	\N	65	121	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:38:33.793162
62	2025-11-28	5	activation	-1142556.000	62	\N	\N	66	122	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:39:19.495304
63	2025-11-28	5	activation	-1779592.000	63	\N	\N	67	123	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:40:35.272268
64	2025-11-28	5	activation	-1779592.000	64	\N	\N	68	124	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:41:20.320527
65	2025-11-28	5	activation	-1578666.000	65	\N	\N	69	125	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:42:10.130857
66	2025-11-28	5	activation	-1578666.000	66	\N	\N	70	126	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:43:05.392581
67	2025-11-28	5	activation	-2979484.000	67	\N	\N	71	101	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:49:44.679879
68	2025-11-28	5	activation	-2979484.000	68	\N	\N	72	102	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:50:35.88528
69	2025-11-28	5	activation	-2667174.000	69	\N	\N	73	103	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:51:37.148422
70	2025-11-28	5	activation	-2667174.000	70	\N	\N	74	104	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:52:37.262325
71	2025-11-28	5	activation	-2991337.000	71	\N	\N	75	105	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:53:40.907958
72	2025-11-28	5	activation	-3485769.000	72	\N	\N	76	106	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:54:28.984487
73	2025-11-28	5	activation	-3001568.000	73	\N	\N	77	107	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:55:21.022791
74	2025-11-28	5	activation	-3348173.000	74	\N	\N	78	108	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-28 09:56:39.001865
75	2025-12-01	5	transfer_out	1810943.000	\N	\N	1	\N	\N	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-01T11:28:07.996Z", "sourceComposition": {"5": 1810943}, "totalSourceAnimals": 1810943}	transfer_out_sel_1_lot_5	Uscita da vagliatura #1 - 1810943 animali	2025-12-01 11:28:07.15372
76	2025-12-01	5	transfer_in	555560.000	\N	\N	1	\N	88	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-01T11:28:07.996Z", "sourceComposition": {"5": 1810943}, "totalSourceAnimals": 1810943}	transfer_in_sel_1_lot_5_cycle_88	Ingresso da vagliatura #1 - 555560 animali (100.0%)	2025-12-01 11:28:07.15372
77	2025-12-01	5	transfer_in	555560.000	\N	\N	1	\N	92	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-01T11:28:07.996Z", "sourceComposition": {"5": 1810943}, "totalSourceAnimals": 1810943}	transfer_in_sel_1_lot_5_cycle_92	Ingresso da vagliatura #1 - 555560 animali (100.0%)	2025-12-01 11:28:07.15372
78	2025-12-01	5	transfer_in	671759.000	\N	\N	1	\N	120	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-01T11:28:07.996Z", "sourceComposition": {"5": 1810943}, "totalSourceAnimals": 1810943}	transfer_in_sel_1_lot_5_cycle_120	Ingresso da vagliatura #1 - 671759 animali (100.0%)	2025-12-01 11:28:07.15372
79	2025-12-01	5	mortality	28064.000	\N	\N	1	\N	\N	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-01T11:28:07.996Z", "sourceComposition": {"5": 1810943}, "totalSourceAnimals": 1810943}	mortality_sel_1_lot_5	Mortalità da vagliatura #1 - 28064 animali (100.0%)	2025-12-01 11:28:07.15372
80	2025-12-03	5	transfer_out	5992905.000	\N	\N	3	\N	\N	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-03T11:35:10.392Z", "sourceComposition": {"5": 5992905}, "totalSourceAnimals": 5992905}	transfer_out_sel_3_lot_5	Uscita da vagliatura #2 - 5992905 animali	2025-12-03 14:20:20.606312
81	2025-12-03	5	transfer_in	483957.000	\N	\N	3	\N	98	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-03T11:35:10.392Z", "sourceComposition": {"5": 5992905}, "totalSourceAnimals": 5992905}	transfer_in_sel_3_lot_5_cycle_98	Ingresso da vagliatura #2 - 483957 animali (100.0%)	2025-12-03 14:20:20.606312
82	2025-12-03	5	transfer_in	3532130.000	\N	\N	3	\N	99	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-03T11:35:10.392Z", "sourceComposition": {"5": 5992905}, "totalSourceAnimals": 5992905}	transfer_in_sel_3_lot_5_cycle_99	Ingresso da vagliatura #2 - 3532130 animali (100.0%)	2025-12-03 14:20:20.606312
83	2025-12-03	5	transfer_in	3532130.000	\N	\N	3	\N	100	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-03T11:35:10.392Z", "sourceComposition": {"5": 5992905}, "totalSourceAnimals": 5992905}	transfer_in_sel_3_lot_5_cycle_100	Ingresso da vagliatura #2 - 3532130 animali (100.0%)	2025-12-03 14:20:20.606312
84	2025-12-03	5	transfer_out	1088898.000	\N	\N	5	\N	\N	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-03T14:36:59.495Z", "sourceComposition": {"5": 1088898}, "totalSourceAnimals": 1088898}	transfer_out_sel_5_lot_5	Uscita da vagliatura #3 - 1088898 animali	2025-12-03 14:36:52.241679
85	2025-12-03	5	sale	517316000.000	\N	\N	5	\N	83	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-03T14:36:59.495Z", "sourceComposition": {"5": 1088898}, "totalSourceAnimals": 1088898}	sale_sel_5_lot_5_cycle_83	Vendita da vagliatura #3 - 517316000 animali (100.0%)	2025-12-03 14:36:52.241679
86	2025-12-03	5	sale	517316000.000	\N	\N	5	\N	86	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-03T14:36:59.495Z", "sourceComposition": {"5": 1088898}, "totalSourceAnimals": 1088898}	sale_sel_5_lot_5_cycle_86	Vendita da vagliatura #3 - 517316000 animali (100.0%)	2025-12-03 14:36:52.241679
87	2025-12-03	5	transfer_out	1088898.000	\N	\N	9	\N	\N	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-03T15:11:00.826Z", "sourceComposition": {"5": 1088898}, "totalSourceAnimals": 1088898}	transfer_out_sel_9_lot_5	Uscita da vagliatura #6 - 1088898 animali	2025-12-03 15:10:53.626346
88	2025-12-03	5	sale	506000.000	\N	\N	9	\N	83	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-03T15:11:00.826Z", "sourceComposition": {"5": 1088898}, "totalSourceAnimals": 1088898}	sale_sel_9_lot_5_cycle_83	Vendita da vagliatura #6 - 506000 animali (100.0%)	2025-12-03 15:10:53.626346
89	2025-12-03	5	sale	506000.000	\N	\N	9	\N	86	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-03T15:11:00.826Z", "sourceComposition": {"5": 1088898}, "totalSourceAnimals": 1088898}	sale_sel_9_lot_5_cycle_86	Vendita da vagliatura #6 - 506000 animali (100.0%)	2025-12-03 15:10:53.626346
90	2025-12-03	5	mortality	76898.000	\N	\N	9	\N	\N	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-03T15:11:00.826Z", "sourceComposition": {"5": 1088898}, "totalSourceAnimals": 1088898}	mortality_sel_9_lot_5	Mortalità da vagliatura #6 - 76898 animali (100.0%)	2025-12-03 15:10:53.626346
91	2025-12-03	4	transfer_out	462714.000	\N	\N	10	\N	\N	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-04T13:05:12.762Z", "sourceComposition": {"4": 462714}, "totalSourceAnimals": 462714}	transfer_out_sel_10_lot_4	Uscita da vagliatura #7 - 462714 animali	2025-12-04 13:05:12.137741
92	2025-12-03	4	sale	251863.000	\N	\N	10	\N	6	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-04T13:05:12.762Z", "sourceComposition": {"4": 462714}, "totalSourceAnimals": 462714}	sale_sel_10_lot_4_cycle_6	Vendita da vagliatura #7 - 251863 animali (100.0%)	2025-12-04 13:05:12.137741
93	2025-12-03	4	sale	216534.000	\N	\N	10	\N	10	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-04T13:05:12.762Z", "sourceComposition": {"4": 462714}, "totalSourceAnimals": 462714}	sale_sel_10_lot_4_cycle_10	Vendita da vagliatura #7 - 216534 animali (100.0%)	2025-12-04 13:05:12.137741
94	2025-12-03	3	transfer_out	785100.000	\N	\N	11	\N	\N	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-04T13:06:50.281Z", "sourceComposition": {"3": 785100}, "totalSourceAnimals": 785100}	transfer_out_sel_11_lot_3	Uscita da vagliatura #8 - 785100 animali	2025-12-04 13:06:49.636694
95	2025-12-03	3	sale	319102.000	\N	\N	11	\N	21	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-04T13:06:50.281Z", "sourceComposition": {"3": 785100}, "totalSourceAnimals": 785100}	sale_sel_11_lot_3_cycle_21	Vendita da vagliatura #8 - 319102 animali (100.0%)	2025-12-04 13:06:49.636694
96	2025-12-03	3	sale	455860.000	\N	\N	11	\N	22	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-04T13:06:50.281Z", "sourceComposition": {"3": 785100}, "totalSourceAnimals": 785100}	sale_sel_11_lot_3_cycle_22	Vendita da vagliatura #8 - 455860 animali (100.0%)	2025-12-04 13:06:49.636694
97	2025-12-03	3	mortality	10138.000	\N	\N	11	\N	\N	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-04T13:06:50.281Z", "sourceComposition": {"3": 785100}, "totalSourceAnimals": 785100}	mortality_sel_11_lot_3	Mortalità da vagliatura #8 - 10138 animali (100.0%)	2025-12-04 13:06:49.636694
98	2025-12-04	4	transfer_out	283902.000	\N	\N	12	\N	\N	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-04T13:12:19.091Z", "sourceComposition": {"4": 283902}, "totalSourceAnimals": 283902}	transfer_out_sel_12_lot_4	Uscita da vagliatura #9 - 283902 animali	2025-12-04 13:12:18.729467
99	2025-12-04	4	sale	283773.000	\N	\N	12	\N	8	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-04T13:12:19.091Z", "sourceComposition": {"4": 283902}, "totalSourceAnimals": 283902}	sale_sel_12_lot_4_cycle_8	Vendita da vagliatura #9 - 283773 animali (100.0%)	2025-12-04 13:12:18.729467
100	2025-12-04	4	mortality	129.000	\N	\N	12	\N	\N	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-04T13:12:19.091Z", "sourceComposition": {"4": 283902}, "totalSourceAnimals": 283902}	mortality_sel_12_lot_4	Mortalità da vagliatura #9 - 129 animali (100.0%)	2025-12-04 13:12:18.729467
101	2025-12-04	5	transfer_out	8127808.000	\N	\N	13	\N	\N	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-05T08:24:20.757Z", "sourceComposition": {"5": 8127808}, "totalSourceAnimals": 8127808}	transfer_out_sel_13_lot_5	Uscita da vagliatura #10 - 8127808 animali	2025-12-05 08:24:19.857006
102	2025-12-04	5	transfer_in	602448.000	\N	\N	13	\N	115	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-05T08:24:20.757Z", "sourceComposition": {"5": 8127808}, "totalSourceAnimals": 8127808}	transfer_in_sel_13_lot_5_cycle_115	Ingresso da vagliatura #10 - 602448 animali (100.0%)	2025-12-05 08:24:19.857006
103	2025-12-04	5	transfer_in	3476369.000	\N	\N	13	\N	97	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-05T08:24:20.757Z", "sourceComposition": {"5": 8127808}, "totalSourceAnimals": 8127808}	transfer_in_sel_13_lot_5_cycle_97	Ingresso da vagliatura #10 - 3476369 animali (100.0%)	2025-12-05 08:24:19.857006
104	2025-12-04	5	transfer_in	3476369.000	\N	\N	13	\N	83	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-05T08:24:20.757Z", "sourceComposition": {"5": 8127808}, "totalSourceAnimals": 8127808}	transfer_in_sel_13_lot_5_cycle_83	Ingresso da vagliatura #10 - 3476369 animali (100.0%)	2025-12-05 08:24:19.857006
105	2025-12-04	5	mortality	572622.000	\N	\N	13	\N	\N	proportional	{"method": "proportional", "version": "1.0", "algorithm": "balanced_rounding_v1", "timestamp": "2025-12-05T08:24:20.757Z", "sourceComposition": {"5": 8127808}, "totalSourceAnimals": 8127808}	mortality_sel_13_lot_5	Mortalità da vagliatura #10 - 572622 animali (100.0%)	2025-12-05 08:24:19.857006
106	2025-11-20	9	activation	-50000.000	95	\N	\N	127	1	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-12-05 18:27:05.365448
107	2025-12-06	10	activation	-5521455.000	96	\N	\N	129	61	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-12-06 09:11:34.160081
108	2025-12-06	11	activation	-9276631.000	97	\N	\N	130	62	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-12-06 09:12:28.065385
\.


--
-- TOC entry 4115 (class 0 OID 16711)
-- Dependencies: 252
-- Data for Name: lot_mortality_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lot_mortality_records (id, lot_id, calculation_date, initial_count, current_count, sold_count, mortality_count, mortality_percentage, created_at, notes) FROM stdin;
1	5	2025-12-01	63238543	63663384	0	28064	0.044377998	2025-12-01 16:40:02.807805	\N
\.


--
-- TOC entry 4117 (class 0 OID 16722)
-- Dependencies: 254
-- Data for Name: lots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lots (id, arrival_date, supplier, supplier_lot_number, quality, animal_count, weight, size_id, notes, state, active, external_id, description, origin, total_mortality, last_mortality_date, mortality_notes, created_at) FROM stdin;
10	2025-12-04	Ecotapes Zeeland	T0.4 del 4/12	teste	5522400	520	4	ANIMALI PRESENTI A CA PISANI, PRESENTE DOPO QUALCHE GIORNO DALL'ARRIVO UNA LEGGERA MORTALITA' 	active	t	\N	\N	\N	0	\N	Aggiornato automaticamente da 0 operazioni. Mortalità: 0.00%	2025-12-06 09:02:32.358607
11	2025-12-04	Ecotapes Zeeland	T0.3 del 4/12	teste	9278710	434.6	3	ANIMALI PRESENTI A CA PISANI, PRESENTE DOPO QUALCHE GIORNO DALL'ARRIVO UNA LEGGERA MORTALITA' 	active	t	\N	\N	\N	0	\N	Aggiornato automaticamente da 0 operazioni. Mortalità: 0.00%	2025-12-06 09:04:49.295112
3	2025-11-26	Animali già in impianto	\N	normali	11087272	1	2	Registrazione dati animali flupsy da excel	active	t	\N	\N	\N	10138	2025-12-03	Aggiornato automaticamente da 25 operazioni. Mortalità: 0.00%Vagliatura #11: -10138 animali (100.00% della mortalità). 	2025-11-26 08:28:34.800111
4	2025-11-26	Ecotapes Ca Pisani	\N	normali	1332000	111000	21	Trasferimento interno da Ca Pisani	active	t	\N	\N	\N	129	2025-12-04	Aggiornato automaticamente da 7 operazioni. Mortalità: 0.00%Vagliatura #12: -129 animali (100.00% della mortalità). 	2025-11-27 13:23:04.101788
5	2025-11-28	Ca Pisani 	Lotto zero, trasferimento dati 	normali	63238543	1000	2	TAGLIE MISTE, TUTTO LO STOCK DI CA PISANI 	active	t	\N	\N	\N	677584	2025-12-04	Aggiornato automaticamente da 40 operazioni. Mortalità: 0.00%Vagliatura #1: -28064 animali (100.00% della mortalità). Vagliatura #9: -76898 animali (100.00% della mortalità). Vagliatura #13: -572622 animali (100.00% della mortalità). 	2025-11-28 08:11:23.05101
\.


--
-- TOC entry 4119 (class 0 OID 16735)
-- Dependencies: 256
-- Data for Name: mortality_rates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mortality_rates (id, size_id, month, percentage, notes) FROM stdin;
\.


--
-- TOC entry 4121 (class 0 OID 16744)
-- Dependencies: 258
-- Data for Name: notification_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_settings (id, notification_type, is_enabled, created_at, updated_at, target_size_ids) FROM stdin;
3	vendita	t	2025-10-10 07:58:13.800752	2025-10-10 12:11:02.787382	\N
4	accrescimento	t	2025-10-10 07:58:17.508655	2025-11-07 12:48:39.236598	[19, 17, 15, 16, 9, 7, 12]
\.


--
-- TOC entry 4123 (class 0 OID 16755)
-- Dependencies: 260
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, type, title, message, is_read, created_at, related_entity_type, related_entity_id, data) FROM stdin;
1	accrescimento	Taglia raggiunta	Il cestello #1 (ciclo #5) ha raggiunto la taglia TP-4000 (13284 esemplari/kg)	t	2025-12-02 00:00:04.241806	basket	21	{"cycleId":5,"basketId":21,"targetSizeId":19,"targetSizeName":"TP-4000","projectedAnimalsPerKg":13284.22693172562}
2	accrescimento	Taglia raggiunta	Il cestello #11 (ciclo #43) ha raggiunto la taglia TP-2500 (54526 esemplari/kg)	t	2025-12-02 00:00:06.542766	basket	91	{"cycleId":43,"basketId":91,"targetSizeId":16,"targetSizeName":"TP-2500","projectedAnimalsPerKg":54525.84421370801}
3	accrescimento	Taglia raggiunta	Il cestello #2 (ciclo #6) ha raggiunto la taglia TP-4000 (13855 esemplari/kg)	t	2025-12-02 00:00:17.144208	basket	22	{"cycleId":6,"basketId":22,"targetSizeId":19,"targetSizeName":"TP-4000","projectedAnimalsPerKg":13854.643749077495}
4	accrescimento	Taglia raggiunta	Il cestello #3 (ciclo #36) ha raggiunto la taglia TP-3000 (24371 esemplari/kg)	t	2025-12-02 00:00:25.143572	basket	83	{"cycleId":36,"basketId":83,"targetSizeId":17,"targetSizeName":"TP-3000","projectedAnimalsPerKg":24370.763025508742}
5	accrescimento	Taglia raggiunta	Il cestello #6 (ciclo #39) ha raggiunto la taglia TP-3000 (24371 esemplari/kg)	t	2025-12-02 00:00:26.843927	basket	86	{"cycleId":39,"basketId":86,"targetSizeId":17,"targetSizeName":"TP-3000","projectedAnimalsPerKg":24370.763025508742}
6	accrescimento	Taglia raggiunta	Il cestello #14 (ciclo #47) ha raggiunto la taglia TP-3000 (24371 esemplari/kg)	t	2025-12-02 00:00:28.743922	basket	94	{"cycleId":47,"basketId":94,"targetSizeId":17,"targetSizeName":"TP-3000","projectedAnimalsPerKg":24370.763025508742}
7	accrescimento	Taglia raggiunta	Il cestello #3 (ciclo #9) ha raggiunto la taglia TP-3000 (22906 esemplari/kg)	t	2025-12-02 00:00:30.743919	basket	3	{"cycleId":9,"basketId":3,"targetSizeId":17,"targetSizeName":"TP-3000","projectedAnimalsPerKg":22906.344331808126}
8	accrescimento	Taglia raggiunta	Il cestello #4 (ciclo #10) ha raggiunto la taglia TP-3000 (22722 esemplari/kg)	t	2025-12-02 00:00:32.743793	basket	24	{"cycleId":10,"basketId":24,"targetSizeId":17,"targetSizeName":"TP-3000","projectedAnimalsPerKg":22721.615748487093}
9	accrescimento	Taglia raggiunta	Il cestello #8 (ciclo #75) ha raggiunto la taglia TP-3000 (27558 esemplari/kg)	t	2025-12-02 00:00:38.343674	basket	88	{"cycleId":75,"basketId":88,"targetSizeId":17,"targetSizeName":"TP-3000","projectedAnimalsPerKg":27557.539682539682}
11	accrescimento	Taglia raggiunta	Il cestello #7 (ciclo #15) ha raggiunto la taglia TP-3000 (22075 esemplari/kg)	t	2025-12-02 00:00:42.443544	basket	27	{"cycleId":15,"basketId":27,"targetSizeId":17,"targetSizeName":"TP-3000","projectedAnimalsPerKg":22075.06487310413}
10	accrescimento	Taglia raggiunta	Il cestello #6 (ciclo #14) ha raggiunto la taglia TP-3000 (20690 esemplari/kg)	t	2025-12-02 00:00:40.644101	basket	26	{"cycleId":14,"basketId":26,"targetSizeId":17,"targetSizeName":"TP-3000","projectedAnimalsPerKg":20689.601709585193}
12	accrescimento	Taglia raggiunta	Il cestello #11 (ciclo #19) ha raggiunto la taglia TP-2500 (45259 esemplari/kg)	t	2025-12-02 00:00:50.445326	basket	31	{"cycleId":19,"basketId":31,"targetSizeId":16,"targetSizeName":"TP-2500","projectedAnimalsPerKg":45258.50173113612}
13	accrescimento	Taglia raggiunta	Il cestello #12 (ciclo #20) ha raggiunto la taglia TP-2000 (75277 esemplari/kg)	t	2025-12-02 00:00:52.669114	basket	32	{"cycleId":20,"basketId":32,"targetSizeId":15,"targetSizeName":"TP-2000","projectedAnimalsPerKg":75276.8949288422}
14	accrescimento	Taglia raggiunta	Il cestello #13 (ciclo #21) ha raggiunto la taglia TP-2000 (74815 esemplari/kg)	t	2025-12-02 00:00:55.14381	basket	33	{"cycleId":21,"basketId":33,"targetSizeId":15,"targetSizeName":"TP-2000","projectedAnimalsPerKg":74815.07624501847}
15	accrescimento	Taglia raggiunta	Il cestello #18 (ciclo #26) ha raggiunto la taglia TP-2500 (60683 esemplari/kg)	t	2025-12-02 00:01:05.243831	basket	38	{"cycleId":26,"basketId":38,"targetSizeId":16,"targetSizeName":"TP-2500","projectedAnimalsPerKg":60683.34165156095}
16	accrescimento	Taglia raggiunta	Il cestello #19 (ciclo #27) ha raggiunto la taglia TP-2500 (56157 esemplari/kg)	t	2025-12-02 00:01:07.442458	basket	39	{"cycleId":27,"basketId":39,"targetSizeId":16,"targetSizeName":"TP-2500","projectedAnimalsPerKg":56157.46222762224}
17	accrescimento	Taglia raggiunta	Il cestello #4 (ciclo #70) ha raggiunto la taglia TP-700 (1438337 esemplari/kg)	t	2025-12-02 00:01:16.243565	basket	104	{"cycleId":70,"basketId":104,"targetSizeId":7,"targetSizeName":"TP-700","projectedAnimalsPerKg":1438336.8478288378}
18	accrescimento	Taglia raggiunta	Il cestello #9 (ciclo #41) ha raggiunto la taglia TP-2500 (54526 esemplari/kg)	t	2025-12-02 00:01:22.043754	basket	89	{"cycleId":41,"basketId":89,"targetSizeId":16,"targetSizeName":"TP-2500","projectedAnimalsPerKg":54525.84421370801}
19	accrescimento	Taglia raggiunta	Il cestello #13 (ciclo #63) ha raggiunto la taglia TP-1500 (212091 esemplari/kg)	t	2025-12-02 00:01:31.742248	basket	123	{"cycleId":63,"basketId":123,"targetSizeId":12,"targetSizeName":"TP-1500","projectedAnimalsPerKg":212090.8719783394}
20	accrescimento	Taglia raggiunta	Il cestello #14 (ciclo #64) ha raggiunto la taglia TP-1500 (212091 esemplari/kg)	t	2025-12-02 00:01:33.843848	basket	124	{"cycleId":64,"basketId":124,"targetSizeId":12,"targetSizeName":"TP-1500","projectedAnimalsPerKg":212090.8719783394}
21	accrescimento	Taglia raggiunta	Il cestello #17 (ciclo #50) ha raggiunto la taglia TP-1000 (617700 esemplari/kg)	t	2025-12-02 00:01:37.34233	basket	97	{"cycleId":50,"basketId":97,"targetSizeId":9,"targetSizeName":"TP-1000","projectedAnimalsPerKg":617699.7364015838}
22	accrescimento	Taglia raggiunta	Il cestello #6 (ciclo #72) ha raggiunto la taglia TP-700 (1457657 esemplari/kg)	t	2025-12-02 00:01:43.242451	basket	106	{"cycleId":72,"basketId":106,"targetSizeId":7,"targetSizeName":"TP-700","projectedAnimalsPerKg":1457656.7954548197}
23	accrescimento	Taglia raggiunta	Il cestello #8 (ciclo #74) ha raggiunto la taglia TP-700 (1457657 esemplari/kg)	t	2025-12-02 00:01:44.842288	basket	108	{"cycleId":74,"basketId":108,"targetSizeId":7,"targetSizeName":"TP-700","projectedAnimalsPerKg":1457656.8020903524}
24	accrescimento	Taglia raggiunta	Il cestello #3 (ciclo #69) ha raggiunto la taglia TP-700 (1438337 esemplari/kg)	t	2025-12-02 00:01:46.642201	basket	103	{"cycleId":69,"basketId":103,"targetSizeId":7,"targetSizeName":"TP-700","projectedAnimalsPerKg":1438336.8478288378}
25	accrescimento	Taglia raggiunta	Il cestello #5 (ciclo #55) ha raggiunto la taglia TP-1000 (607299 esemplari/kg)	t	2025-12-02 00:01:48.042215	basket	115	{"cycleId":55,"basketId":115,"targetSizeId":9,"targetSizeName":"TP-1000","projectedAnimalsPerKg":607298.8645792551}
26	accrescimento	Taglia raggiunta	Il cestello #6 (ciclo #56) ha raggiunto la taglia TP-1000 (607299 esemplari/kg)	t	2025-12-02 00:01:49.442487	basket	116	{"cycleId":56,"basketId":116,"targetSizeId":9,"targetSizeName":"TP-1000","projectedAnimalsPerKg":607298.8645792551}
27	accrescimento	Taglia raggiunta	Il cestello #7 (ciclo #73) ha raggiunto la taglia TP-1000 (617700 esemplari/kg)	t	2025-12-02 00:01:51.443954	basket	107	{"cycleId":73,"basketId":107,"targetSizeId":9,"targetSizeName":"TP-1000","projectedAnimalsPerKg":617699.7364015838}
28	accrescimento	Taglia raggiunta	Il cestello #7 (ciclo #57) ha raggiunto la taglia TP-2000 (73006 esemplari/kg)	t	2025-12-02 00:01:53.243731	basket	117	{"cycleId":57,"basketId":117,"targetSizeId":15,"targetSizeName":"TP-2000","projectedAnimalsPerKg":73005.52199854137}
29	accrescimento	Taglia raggiunta	Il cestello #8 (ciclo #58) ha raggiunto la taglia TP-2000 (73006 esemplari/kg)	t	2025-12-02 00:01:54.742233	basket	118	{"cycleId":58,"basketId":118,"targetSizeId":15,"targetSizeName":"TP-2000","projectedAnimalsPerKg":73005.52199854137}
30	accrescimento	Taglia raggiunta	Il cestello #12 (ciclo #76) ha raggiunto la taglia TP-3000 (27558 esemplari/kg)	t	2025-12-02 00:01:56.342226	basket	92	{"cycleId":76,"basketId":92,"targetSizeId":17,"targetSizeName":"TP-3000","projectedAnimalsPerKg":27557.539682539682}
31	accrescimento	Taglia raggiunta	Il cestello #10 (ciclo #77) ha raggiunto la taglia TP-2500 (41914 esemplari/kg)	t	2025-12-02 00:01:58.243742	basket	120	{"cycleId":77,"basketId":120,"targetSizeId":16,"targetSizeName":"TP-2500","projectedAnimalsPerKg":41913.68524238244}
33	vendita	Nuova vendita - Cestello 6	È stata registrata un'operazione di vendita per il cestello 6 in data 03/12/2025. 517.316.000 animali.	t	2025-12-03 14:37:07.897673	operation	97	{"basketId":86,"basketNumber":6,"cycleId":82,"operationDate":"2025-12-03","animalCount":517316000}
32	vendita	Nuova vendita - Cestello 3	È stata registrata un'operazione di vendita per il cestello 3 in data 03/12/2025. 517.316.000 animali.	t	2025-12-03 14:37:06.952301	operation	95	{"basketId":83,"basketNumber":3,"cycleId":81,"operationDate":"2025-12-03","animalCount":517316000}
34	vendita	Nuova vendita - Cestello 3	È stata registrata un'operazione di vendita per il cestello 3 in data 03/12/2025. 506.000 animali.	t	2025-12-03 15:11:06.658132	operation	102	{"basketId":83,"basketNumber":3,"cycleId":83,"operationDate":"2025-12-03","animalCount":506000}
35	vendita	Nuova vendita - Cestello 6	È stata registrata un'operazione di vendita per il cestello 6 in data 03/12/2025. 506.000 animali.	t	2025-12-03 15:11:07.60092	operation	104	{"basketId":86,"basketNumber":6,"cycleId":84,"operationDate":"2025-12-03","animalCount":506000}
36	vendita	Nuova vendita - Cestello 6	È stata registrata un'operazione di vendita per il cestello 6 in data 03/12/2025. 251.863 animali.	f	2025-12-04 13:05:13.232595	operation	108	{"basketId":6,"basketNumber":6,"cycleId":85,"operationDate":"2025-12-03","animalCount":251863}
37	vendita	Nuova vendita - Cestello 10	È stata registrata un'operazione di vendita per il cestello 10 in data 03/12/2025. 216.534 animali.	f	2025-12-04 13:05:13.335365	operation	110	{"basketId":10,"basketNumber":10,"cycleId":86,"operationDate":"2025-12-03","animalCount":216534}
38	vendita	Nuova vendita - Cestello 1	È stata registrata un'operazione di vendita per il cestello 1 in data 03/12/2025. 319.102 animali.	f	2025-12-04 13:06:52.806412	operation	114	{"basketId":21,"basketNumber":1,"cycleId":87,"operationDate":"2025-12-03","animalCount":319102}
39	vendita	Nuova vendita - Cestello 2	È stata registrata un'operazione di vendita per il cestello 2 in data 03/12/2025. 455.860 animali.	f	2025-12-04 13:06:52.905799	operation	116	{"basketId":22,"basketNumber":2,"cycleId":88,"operationDate":"2025-12-03","animalCount":455860}
40	vendita	Nuova vendita avanzata - VAV-000001	È stata creata una vendita avanzata VAV-000001 per Azienda in data 03/12/2025. Cliente: LA VERACE Società Cooperativa. Totale: 1.243.359 animali.	f	2025-12-04 13:07:57.876187	advanced_sale	1	{"saleNumber":"VAV-000001","companyId":1052922,"companyName":"Azienda","customerId":58,"customerName":"LA VERACE Società Cooperativa","saleDate":"2025-12-03","totalAnimals":1243359,"totalWeight":109.1,"status":"draft"}
41	vendita	Nuova vendita - Cestello 8	È stata registrata un'operazione di vendita per il cestello 8 in data 04/12/2025. 283.773 animali.	f	2025-12-04 13:12:21.489417	operation	119	{"basketId":8,"basketNumber":8,"cycleId":89,"operationDate":"2025-12-04","animalCount":283773}
42	vendita	Nuova vendita avanzata - VAV-000002	È stata creata una vendita avanzata VAV-000002 per Azienda in data 04/12/2025. Cliente: Soc cooperativa Rosa dei Venti. Totale: 283.773 animali.	f	2025-12-04 13:19:44.633634	advanced_sale	2	{"saleNumber":"VAV-000002","companyId":1052922,"companyName":"Azienda","customerId":82,"customerName":"Soc cooperativa Rosa dei Venti","saleDate":"2025-12-04","totalAnimals":283773,"totalWeight":24.9,"status":"draft"}
43	vendita	Nuova vendita avanzata - VAV-000003	È stata creata una vendita avanzata VAV-000003 per Azienda in data 05/12/2025. Cliente: Non specificato. Totale: 10.000 animali.	f	2025-12-05 18:27:10.841553	advanced_sale	3	{"saleNumber":"VAV-000003","companyId":1052922,"companyName":"Azienda","customerId":null,"customerName":null,"saleDate":"2025-12-05","totalAnimals":10000,"totalWeight":2.1,"status":"draft"}
\.


--
-- TOC entry 4125 (class 0 OID 16766)
-- Dependencies: 262
-- Data for Name: operations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.operations (id, date, type, basket_id, cycle_id, size_id, sgr_id, lot_id, animal_count, total_weight, animals_per_kg, average_weight, dead_count, mortality_rate, notes, metadata, source, operator_id, operator_name) FROM stdin;
107	2025-12-03	prima-attivazione	6	85	20	\N	4	253896	22.1	11500	0.08774612	1	0.1	Da vagliatura #7 del 2025-12-03	\N	desktop_manager	\N	\N
109	2025-12-03	prima-attivazione	10	86	20	\N	4	218282	19	11500	0.08774603	1	0.1	Da vagliatura #7 del 2025-12-03	\N	desktop_manager	\N	\N
113	2025-12-03	prima-attivazione	21	87	20	\N	3	321678	28	11500	0.08774624	1	0.1	Da vagliatura #8 del 2025-12-03	\N	desktop_manager	\N	\N
86	2025-12-03	chiusura-ciclo-vagliatura	105	71	10	\N	5	2991337	5.207	574468	0.0017406931	\N	\N	Chiusura per vagliatura #2	\N	desktop_manager	\N	\N
87	2025-12-03	chiusura-ciclo-vagliatura	107	73	9	\N	5	3001568	4.633	647887	0.0015435265	\N	\N	Chiusura per vagliatura #2	\N	desktop_manager	\N	\N
98	2025-12-03	chiusura-ciclo-vagliatura	83	36	17	\N	\N	362966	14.2	25561	0.03912212	\N	\N	Chiusura per vagliatura #6 del 2025-12-03. Animali distribuiti: 1012000. Mortalità: 76898	\N	desktop_manager	\N	\N
99	2025-12-03	chiusura-ciclo-vagliatura	86	39	17	\N	\N	362966	14.2	25561	0.03912212	\N	\N	Chiusura per vagliatura #6 del 2025-12-03. Animali distribuiti: 1012000. Mortalità: 76898	\N	desktop_manager	\N	\N
100	2025-12-03	chiusura-ciclo-vagliatura	94	47	17	\N	\N	362966	14.2	25561	0.03912212	\N	\N	Chiusura per vagliatura #6 del 2025-12-03. Animali distribuiti: 1012000. Mortalità: 76898	\N	desktop_manager	\N	\N
101	2025-12-03	prima-attivazione	83	83	17	\N	5	506000	23	22000	0.045454547	0	0	Da vagliatura #6 del 2025-12-03	\N	desktop_manager	\N	\N
102	2025-12-03	vendita	83	83	17	\N	5	506000	23	22000	0.045454547	0	0	Vendita diretta da vagliatura #6	\N	desktop_manager	\N	\N
103	2025-12-03	prima-attivazione	86	84	17	\N	5	506000	23	22000	0.045454547	0	0	Da vagliatura #6 del 2025-12-03	\N	desktop_manager	\N	\N
104	2025-12-03	vendita	86	84	17	\N	5	506000	23	22000	0.045454547	0	0	Vendita diretta da vagliatura #6	\N	desktop_manager	\N	\N
105	2025-12-03	chiusura-ciclo-vagliatura	6	28	20	\N	\N	261274	24.3	10752	0.093005806	\N	\N	Chiusura per vagliatura #7 del 2025-12-03. Animali distribuiti: 468397. Mortalità: -5683	\N	desktop_manager	\N	\N
106	2025-12-03	chiusura-ciclo-vagliatura	10	32	21	\N	\N	201440	22.7	8874	0.112688646	\N	\N	Chiusura per vagliatura #7 del 2025-12-03. Animali distribuiti: 468397. Mortalità: -5683	\N	desktop_manager	\N	\N
108	2025-12-03	vendita	6	85	20	\N	4	251863	22.1	11500	0.08774612	1	0	Vendita diretta da vagliatura #7	\N	desktop_manager	\N	\N
110	2025-12-03	vendita	10	86	20	\N	4	216534	19	11500	0.08774603	1	0	Vendita diretta da vagliatura #7	\N	desktop_manager	\N	\N
111	2025-12-03	chiusura-ciclo-vagliatura	21	5	19	\N	\N	417600	29.5	14156	0.07064176	\N	\N	Chiusura per vagliatura #8 del 2025-12-03. Animali distribuiti: 774962. Mortalità: 10138	\N	desktop_manager	\N	\N
112	2025-12-03	chiusura-ciclo-vagliatura	22	6	19	\N	\N	367500	24.5	15000	0.06666667	\N	\N	Chiusura per vagliatura #8 del 2025-12-03. Animali distribuiti: 774962. Mortalità: 10138	\N	desktop_manager	\N	\N
114	2025-12-03	vendita	21	87	20	\N	3	319102	28	11500	0.08774624	1	0	Vendita diretta da vagliatura #8	\N	desktop_manager	\N	\N
116	2025-12-03	vendita	22	88	20	\N	3	455860	40	11500	0.08774624	1	0	Vendita diretta da vagliatura #8	\N	desktop_manager	\N	\N
117	2025-12-04	chiusura-ciclo-vagliatura	8	30	20	\N	\N	283902	23.7	11979	0.083479516	\N	\N	Chiusura per vagliatura #9 del 2025-12-04. Animali distribuiti: 283773. Mortalità: 129	\N	desktop_manager	\N	\N
119	2025-12-04	vendita	8	89	20	\N	4	283773	24.9	11500	0.08774619	1	0	Vendita diretta da vagliatura #9	\N	desktop_manager	\N	\N
120	2025-12-04	chiusura-ciclo-vagliatura	97	50	9	\N	\N	3001568	4.633	647887	0.0015435265	\N	\N	Chiusura per vagliatura #10 del 2025-12-04. Animali distribuiti: 7555186. Mortalità: 572622	\N	desktop_manager	\N	\N
121	2025-12-04	chiusura-ciclo-vagliatura	115	55	9	\N	\N	2563120	4.024	636905	0.0015699617	\N	\N	Chiusura per vagliatura #10 del 2025-12-04. Animali distribuiti: 7555186. Mortalità: 572622	\N	desktop_manager	\N	\N
122	2025-12-04	chiusura-ciclo-vagliatura	116	56	9	\N	\N	2563120	4.024	636905	0.0015699617	\N	\N	Chiusura per vagliatura #10 del 2025-12-04. Animali distribuiti: 7555186. Mortalità: 572622	\N	desktop_manager	\N	\N
115	2025-12-03	prima-attivazione	22	88	20	\N	3	459540	40	11500	0.08774624	1	0.1	Da vagliatura #8 del 2025-12-03	\N	desktop_manager	\N	\N
118	2025-12-04	prima-attivazione	8	89	20	\N	4	286064	24.9	11500	0.08774619	1	0.1	Da vagliatura #9 del 2025-12-04	\N	desktop_manager	\N	\N
123	2025-12-04	prima-attivazione	115	90	15	\N	5	608558	8.7	70159	0.01444108	3	0.3	Da vagliatura #10 del 2025-12-04	\N	desktop_manager	\N	\N
124	2025-12-04	prima-attivazione	97	91	11	\N	5	3547663	11.8	301852	0.0033943462	4	0.4	Da vagliatura #10 del 2025-12-04	\N	desktop_manager	\N	\N
125	2025-12-04	prima-attivazione	83	92	11	\N	5	3547663	11.8	301852	0.0033943462	4	0.4	Da vagliatura #10 del 2025-12-04 | LOTTO MISTO: Ca Pisani  (100.0% - 506000 animali)Ca Pisani  (100.0% - 3476369 animali)	{"isMixed": true, "lotCount": 2, "composition": [{"lotId": 5, "percentage": 1, "animalCount": 506000}, {"lotId": 5, "percentage": 1, "animalCount": 3476369}], "dominantLot": 5}	desktop_manager	\N	\N
129	2025-12-06	prima-attivazione	61	96	5	\N	10	5521455	520	10618182	0.09417807	0	\N	ANIMALI PRESENTI A CA PISANI, PRESENTE DOPO QUALCHE GIORNO DALL'ARRIVO UNA LEGGERA MORTALITA' 	\N	desktop_manager	\N	\N
89	2025-12-03	prima-attivazione	99	79	11	\N	5	3441096	11.4	309836	0.0033128979	5	2.58	Da vagliatura #2 del 2025-12-03	\N	desktop_manager	\N	\N
90	2025-12-03	prima-attivazione	100	80	11	\N	5	3441096	11.4	309836	0.0033128979	5	2.58	Da vagliatura #2 del 2025-12-03	\N	desktop_manager	\N	\N
83	2025-12-01	prima-attivazione	88	75	17	\N	5	553347	20	27778	0.03599971	4	0.4	Da vagliatura #1 del 2025-12-01	\N	desktop_manager	\N	\N
84	2025-12-01	prima-attivazione	92	76	17	\N	5	553347	20	27778	0.03599971	4	0.4	Da vagliatura #1 del 2025-12-01	\N	desktop_manager	\N	\N
85	2025-12-01	prima-attivazione	120	77	16	\N	5	667089	15.9	42249	0.023669202	7	0.7	Da vagliatura #1 del 2025-12-01	\N	desktop_manager	\N	\N
88	2025-12-03	prima-attivazione	98	78	16	\N	5	472587	8.7	54969	18.192083	2	1.18	Da vagliatura #2 del 2025-12-03	\N	desktop_manager	\N	\N
130	2025-12-06	prima-attivazione	62	97	4	\N	11	9276631	432	21473684	0.046568632	0	\N	ANIMALI PRESENTI A CA PISANI, PRESENTE DOPO QUALCHE GIORNO DALL'ARRIVO UNA LEGGERA MORTALITA' 	\N	desktop_manager	\N	\N
65	2025-11-28	prima-attivazione	121	61	13	\N	5	1142556	7.904	144550	6.917823	0	14	(-2) CODE MEDIO BELLE ex 5096	\N	desktop_manager	\N	\N
33	2025-11-28	misura	6	28	20	\N	4	261274	24.3	10752	93.00581	0	\N	\N	\N	desktop_manager	\N	\N
34	2025-11-28	misura	8	30	20	\N	4	283902	23.7	11979	83.47951	0	\N	\N	\N	desktop_manager	\N	\N
5	2025-11-26	prima-attivazione	21	5	19	\N	3	417600	29	14400	69.44444	0	\N	\N	\N	desktop_manager	\N	\N
6	2025-11-26	prima-attivazione	22	6	19	\N	3	367500	24.5	15000	66.666664	0	\N	\N	\N	desktop_manager	\N	\N
7	2025-11-26	prima-attivazione	2	7	18	\N	3	255200	14.5	17600	56.81818	0	\N	\N	\N	desktop_manager	\N	\N
8	2025-11-26	prima-attivazione	23	8	18	\N	3	129500	7	18500	54.054054	0	\N	\N	\N	desktop_manager	\N	\N
9	2025-11-26	prima-attivazione	3	9	17	\N	3	372000	15	24800	40.322582	0	\N	\N	\N	desktop_manager	\N	\N
10	2025-11-26	prima-attivazione	24	10	17	\N	3	405900	16.5	24600	40.650406	0	\N	\N	\N	desktop_manager	\N	\N
11	2025-11-26	prima-attivazione	4	11	28	\N	3	529920	13.8	38400	26.041666	0	\N	\N	\N	desktop_manager	\N	\N
12	2025-11-26	prima-attivazione	5	12	16	\N	3	562950	13.9	40500	24.691359	0	\N	\N	\N	desktop_manager	\N	\N
13	2025-11-26	prima-attivazione	25	13	28	\N	3	530000	13.25	40000	25	0	\N	\N	\N	desktop_manager	\N	\N
14	2025-11-26	prima-attivazione	26	14	17	\N	3	234080	10.45	22400	44.642857	0	\N	\N	\N	desktop_manager	\N	\N
15	2025-11-26	prima-attivazione	27	15	17	\N	3	241390	10.1	23900	41.841003	0	\N	\N	\N	desktop_manager	\N	\N
16	2025-11-26	prima-attivazione	28	16	28	\N	3	322848	9.12	35400	28.248587	0	\N	\N	\N	desktop_manager	\N	\N
17	2025-11-26	prima-attivazione	29	17	28	\N	3	205200	5.7	36000	27.777779	0	\N	\N	\N	desktop_manager	\N	\N
18	2025-11-26	prima-attivazione	30	18	28	\N	3	422650	10.7	39500	25.316456	0	\N	\N	\N	desktop_manager	\N	\N
19	2025-11-26	prima-attivazione	31	19	16	\N	3	357700	7.3	49000	20.408163	0	\N	\N	\N	desktop_manager	\N	\N
20	2025-11-26	prima-attivazione	32	20	15	\N	3	843525	10.35	81500	12.269938	0	\N	\N	\N	desktop_manager	\N	\N
21	2025-11-26	prima-attivazione	33	21	15	\N	3	972000	12	81000	12.345679	0	\N	\N	\N	desktop_manager	\N	\N
22	2025-11-26	prima-attivazione	34	22	28	\N	3	536310	15.15	35400	28.248587	0	\N	\N	\N	desktop_manager	\N	\N
23	2025-11-26	prima-attivazione	35	23	28	\N	3	653350	17.9	36500	27.39726	0	\N	\N	\N	desktop_manager	\N	\N
24	2025-11-26	prima-attivazione	36	24	28	\N	3	633275	17.35	36500	27.39726	0	\N	\N	\N	desktop_manager	\N	\N
25	2025-11-26	prima-attivazione	37	25	28	\N	3	551150	15.1	36500	27.39726	0	\N	\N	\N	desktop_manager	\N	\N
26	2025-11-26	prima-attivazione	38	26	16	\N	3	748980	11.4	65700	15.2207	0	\N	\N	\N	desktop_manager	\N	\N
27	2025-11-26	prima-attivazione	39	27	16	\N	3	794230	13.063	60800	16.447376	0	\N	\N	\N	desktop_manager	\N	\N
28	2025-11-27	prima-attivazione	6	28	20	\N	4	207514	19.3	10752	93.005775	0	\N	\N	\N	desktop_manager	\N	\N
29	2025-11-27	prima-attivazione	7	29	20	\N	4	207519	19.5	10642	93.9673	0	\N	\N	\N	desktop_manager	\N	\N
30	2025-11-27	prima-attivazione	8	30	20	\N	4	229997	19.2	11979	83.47935	0	\N	\N	\N	desktop_manager	\N	\N
31	2025-11-27	prima-attivazione	9	31	20	\N	4	249725	20.8	12006	83.29162	0	\N	\N	\N	desktop_manager	\N	\N
32	2025-11-27	prima-attivazione	10	32	21	\N	4	201440	22.7	8874	112.688644	0	\N	\N	\N	desktop_manager	\N	\N
35	2025-11-27	peso	5	12	28	\N	3	562950	15.5	36319	27.53353	0	\N	\N	\N	desktop_manager	\N	\N
36	2025-11-27	peso	21	5	19	\N	3	417600	29.5	14156	70.64176	0	\N	\N	\N	desktop_manager	\N	\N
38	2025-11-28	prima-attivazione	81	34	28	\N	5	552291	14.758	37423	26.72142	0	2	(+2.5) TESTE BELLISISME	\N	desktop_manager	\N	\N
39	2025-11-28	prima-attivazione	82	35	13	\N	5	1142556	7.904	144550	6.917823	0	14	(-2) CODE MEDIO BELLE ex 5098	\N	desktop_manager	\N	\N
40	2025-11-28	prima-attivazione	83	36	17	\N	5	362966	14.2	25561	39.12212	0	0.01	(+3)animali bellissimi ex 5101	\N	desktop_manager	\N	\N
41	2025-11-28	prima-attivazione	84	37	28	\N	5	573448	14.784	38788	25.78089	0	1	(+2.5) TESTE BELLISSIME ex 5091	\N	desktop_manager	\N	\N
42	2025-11-28	prima-attivazione	85	38	13	\N	5	1175004	9	130556	7.6595483	0	0.01	(-2) MEDI E CODE MISCHIATI, MEDIO BELLI ex 5056	\N	desktop_manager	\N	\N
66	2025-11-28	prima-attivazione	122	62	13	\N	5	1142556	7.904	144550	6.917823	0	\N	(-2) CODE MEDIO BELLE ex 5097	\N	desktop_manager	\N	\N
43	2025-11-28	prima-attivazione	86	39	17	\N	5	362966	14.2	25561	39.12212	0	0.01	(+3) animali bellissimi ex 5102	\N	desktop_manager	\N	\N
44	2025-11-28	prima-attivazione	87	40	13	\N	5	1175004	9	130556	7.6595483	0	\N	(-2) MEDI E CODE MISCHIATI, MEDIO BELLI ex 5055	\N	desktop_manager	\N	\N
45	2025-11-28	prima-attivazione	89	41	16	\N	5	695530	12.162	57188	17.485947	0	3	(-3) MEDIO BELLI, CODE E MEDI MISCHIATI ex 5083	\N	desktop_manager	\N	\N
46	2025-11-28	prima-attivazione	88	42	16	\N	5	691285	15.5	44599	22.42201	0	\N	(+2,5) ANIMALI BELLISSIMI ex 5069	\N	desktop_manager	\N	\N
47	2025-11-28	prima-attivazione	91	43	16	\N	5	695530	12.162	57188	17.485947	0	3	(-3) MEDIO BELLI, CODE E MEDI MISCHIATI ex 5084	\N	desktop_manager	\N	\N
48	2025-11-28	prima-attivazione	90	44	16	\N	5	560495	13.4	41828	23.907438	0	0.01	(-3) medi e code animali bellissimi ex 5104	\N	desktop_manager	\N	\N
49	2025-11-28	prima-attivazione	92	45	28	\N	5	384566	9.649	39855	25.090622	0	\N	(-3) CODE E MEDI ANIMALI BELLI ex 5066	\N	desktop_manager	\N	\N
50	2025-11-28	prima-attivazione	93	46	18	\N	5	241540	12.9	18724	53.407303	0	\N	(+3.5) DA VAGLIARE PER T4 ex 5066	\N	desktop_manager	\N	\N
51	2025-11-28	prima-attivazione	94	47	17	\N	5	362966	14.2	25561	39.12212	0	\N	(+3) animali bellissimi ex 5103	\N	desktop_manager	\N	\N
52	2025-11-28	prima-attivazione	95	48	16	\N	5	118337	2.874	41170	24.286572	0	\N	(-3) SCARTO, ANIMALI BRUTTI ex 5087	\N	desktop_manager	\N	\N
53	2025-11-28	prima-attivazione	96	49	28	\N	5	552291	14.758	37423	26.72142	0	2	(+2.5) TESTE BELLISSIME ex 5092	\N	desktop_manager	\N	\N
54	2025-11-28	prima-attivazione	97	50	9	\N	5	3001568	4.633	647887	1.5435265	0	1	(+1000) ANIMALIPORTATI FUORI IN CONDIZIONI PERFETTE ex 5033	\N	desktop_manager	\N	\N
55	2025-11-28	prima-attivazione	111	51	10	\N	5	2979484	5.07	587629	1.7016369	0	1	(+1000) ANIMALI BELLISSIMI ex 5059	\N	desktop_manager	\N	\N
56	2025-11-28	prima-attivazione	112	52	28	\N	5	573448	14.784	38788	25.78089	0	1	(+2.5) TESTE BELLISSIME ex 5091	\N	desktop_manager	\N	\N
57	2025-11-28	prima-attivazione	113	53	13	\N	5	876177	6.945	126157	7.926481	0	4	(-2) MEDI DI VAGLIATURA MEDIO BELLI 5002	\N	desktop_manager	\N	\N
58	2025-11-28	prima-attivazione	114	54	10	\N	5	2979484	5.07	587629	1.7016369	0	1	(+1000) ANIMALI BELLISSIMI ex 5061	\N	desktop_manager	\N	\N
59	2025-11-28	prima-attivazione	115	55	9	\N	5	2563120	4.024	636905	1.5699617	0	5	(+1000) ANIMALIPORTATI FUORI IN CONDIZIONI PERFETTE ex 5030	\N	desktop_manager	\N	\N
60	2025-11-28	prima-attivazione	116	56	9	\N	5	2563120	4.024	636905	1.5699617	0	5	(+1000) ANIMALIPORTATI FUORI IN CONDIZIONI PERFETTE ex 5031	\N	desktop_manager	\N	\N
61	2025-11-28	prima-attivazione	117	57	15	\N	5	1255764	16.4	76571	13.059779	0	\N	(+2) PRONTO VENDITA ex 5095	\N	desktop_manager	\N	\N
62	2025-11-28	prima-attivazione	118	58	15	\N	5	1255764	16.4	76571	13.059779	0	\N	(+2) PRNTO VENDITA ex 5094	\N	desktop_manager	\N	\N
63	2025-11-28	prima-attivazione	119	59	13	\N	5	1578666	8.573	184146	5.4305344	0	3	(-2)ANIMALI BELLISSIMI ex 5074	\N	desktop_manager	\N	\N
64	2025-11-28	prima-attivazione	120	60	16	\N	5	735092	16.5	44551	22.44617	0	\N	(+2,5) ANIMALI BELLISSIMI ex 5070	\N	desktop_manager	\N	\N
67	2025-11-28	prima-attivazione	123	63	12	\N	5	1779592	8	222449	4.4954123	0	\N	(-2)ANIMALI BELLISSIMI ex 5068	\N	desktop_manager	\N	\N
68	2025-11-28	prima-attivazione	124	64	12	\N	5	1779592	8	222449	4.4954123	0	\N	(-2)ANIMALI BELLISSIMI ex 5067	\N	desktop_manager	\N	\N
69	2025-11-28	prima-attivazione	125	65	13	\N	5	1578666	8.573	184146	5.4305344	0	\N	(-2)ANIMALI BELLISSIMI ex 5073	\N	desktop_manager	\N	\N
70	2025-11-28	prima-attivazione	126	66	13	\N	5	1578666	8.573	184146	5.4305344	0	3	(-2)ANIMALI BELLISSIMI ex 5072	\N	desktop_manager	\N	\N
71	2025-11-28	prima-attivazione	101	67	10	\N	5	2979484	5.07	587629	1.7016369	0	1	(+1000) ANIMALI BELLISSIMI ex 5060	\N	desktop_manager	\N	\N
72	2025-11-28	prima-attivazione	102	68	10	\N	5	2979484	5.07	587629	1.7016369	0	1	(+1000) ANIMALI BELLISSIMI ex 5062	\N	desktop_manager	\N	\N
73	2025-11-28	prima-attivazione	103	69	7	\N	5	2667174	1.768	1508772	0.66287386	0	4	(+790) ANIMALI BELLISSIMI ex 5057	\N	desktop_manager	\N	\N
74	2025-11-28	prima-attivazione	104	70	7	\N	5	2667174	1.768	1508772	0.66287386	0	4	(+790) ANIMALI BELLISSIMI ex 5058	\N	desktop_manager	\N	\N
75	2025-11-28	prima-attivazione	105	71	10	\N	5	2991337	5.207	574468	1.7406932	0	4	(+1000) ANIMALI PORTATI FUORI IN CONDIZIONI PERFETTE ex 5028	\N	desktop_manager	\N	\N
76	2025-11-28	prima-attivazione	106	72	7	\N	5	3485769	2.28	1528846	0.6540881	0	\N	(+790) MEDI DEL 1000 ANIMALI PORTATI FUORI IN OTTIME CONIDZIONI ex 5029	\N	desktop_manager	\N	\N
77	2025-11-28	prima-attivazione	107	73	9	\N	5	3001568	4.633	647887	1.5435265	0	1	(+1000) ANIMALIPORTATI FUORI IN CONDIZIONI PERFETTE ex 5032	\N	desktop_manager	\N	\N
78	2025-11-28	prima-attivazione	108	74	7	\N	5	3348173	2.19	1528846	0.6540881	0	\N	(+790) ANIMALI PORTATI FUORI IN CONDIZIONI PERFETTE ex 5034	\N	desktop_manager	\N	\N
80	2025-12-01	chiusura-ciclo-vagliatura	92	45	28	\N	\N	384566	9.649	39855	25.090622	\N	\N	Chiusura per vagliatura #1 del 2025-12-01. Animali distribuiti: 1782879. Mortalità: 28064	\N	desktop_manager	\N	\N
81	2025-12-01	chiusura-ciclo-vagliatura	88	42	16	\N	\N	691285	15.5	44599	22.42201	\N	\N	Chiusura per vagliatura #1 del 2025-12-01. Animali distribuiti: 1782879. Mortalità: 28064	\N	desktop_manager	\N	\N
82	2025-12-01	chiusura-ciclo-vagliatura	120	60	16	\N	\N	735092	16.5	44551	22.44617	\N	\N	Chiusura per vagliatura #1 del 2025-12-01. Animali distribuiti: 1782879. Mortalità: 28064	\N	desktop_manager	\N	\N
\.


--
-- TOC entry 4204 (class 0 OID 1097728)
-- Dependencies: 341
-- Data for Name: operations_backup_mortalita; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.operations_backup_mortalita (id, date, basket_id, animal_count, mortality_rate, dead_count, notes) FROM stdin;
107	2025-12-03	6	251863	0	1	Da vagliatura #7 del 2025-12-03
109	2025-12-03	10	216534	0	1	Da vagliatura #7 del 2025-12-03
113	2025-12-03	21	319102	0	1	Da vagliatura #8 del 2025-12-03
115	2025-12-03	22	455860	0	1	Da vagliatura #8 del 2025-12-03
118	2025-12-04	8	283773	0	1	Da vagliatura #9 del 2025-12-04
123	2025-12-04	115	602448	0	3	Da vagliatura #10 del 2025-12-04
124	2025-12-04	97	3476369	0	4	Da vagliatura #10 del 2025-12-04
125	2025-12-04	83	3476369	0	4	Da vagliatura #10 del 2025-12-04 | LOTTO MISTO: Ca Pisani  (100.0% - 506000 animali)Ca Pisani  (100.0% - 3476369 animali)
88	2025-12-03	98	478230	1.18	2	Da vagliatura #2 del 2025-12-03
83	2025-12-01	88	555560	0	4	Da vagliatura #1 del 2025-12-01
84	2025-12-01	92	555560	0	4	Da vagliatura #1 del 2025-12-01
85	2025-12-01	120	671759	0	7	Da vagliatura #1 del 2025-12-01
\.


--
-- TOC entry 4172 (class 0 OID 434176)
-- Dependencies: 309
-- Data for Name: operators; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.operators (id, operator_id, name, password, is_active, created_at, updated_at) FROM stdin;
8207d4c3-8a43-46d0-9d04-b7e8e1c621a9	OP001	Andrea	test123	t	2025-10-21 11:13:01.261468	2025-10-21 11:13:01.261468
7f7af1d9-1ace-4cb4-a287-a9cbb62d1a87	OP002	Davide	pass456	t	2025-10-21 11:13:01.261468	2025-10-21 11:13:01.261468
6c8b71ea-efde-425d-beb9-41966f1c5624	OP003	Mauro	pwd789	t	2025-10-21 11:13:01.261468	2025-10-21 11:13:01.261468
7af84f82-6b09-4e9e-9939-492507ce209d	OP004	Gianluca	key012	t	2025-10-21 11:13:01.261468	2025-10-21 11:13:01.261468
3d1bbc83-18cd-47d3-a3e7-659ecd8fea84	OP005	Diego	code345	t	2025-10-21 11:13:01.261468	2025-10-21 11:13:01.261468
b6eafa05-e119-44ff-9d02-53cfc6be8352	OP006	Ever	op006pwd	t	2025-11-07 07:16:52.83306	2025-11-07 07:16:52.83306
\.


--
-- TOC entry 4174 (class 0 OID 540673)
-- Dependencies: 311
-- Data for Name: ordini; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ordini (id, numero, data, cliente_id, cliente_nome, stato, totale, valuta, note, fatture_in_cloud_id, company_id, created_at, updated_at, quantita_totale, taglia_richiesta, data_consegna, data_inizio_consegna, data_fine_consegna, fatture_in_cloud_numero, sync_status, last_sync_at, sync_error, url_documento) FROM stdin;
1	1	2025-10-09	0	Consorzio Pescatori di Goro Soc. Coop. OP	N/A	631043.70	EUR	\N	474521659	\N	2025-10-30 11:22:03.58389	2025-10-31 15:28:18.373	0		\N	\N	\N	\N	locale	\N	\N	\N
2	2	2025-10-09	0	SOL LEVANTE - SOCIETA' COOPERATIVA	N/A	155000.00	EUR	\N	474533763	\N	2025-10-30 11:22:04.337139	2025-10-31 15:28:21.624	0		\N	\N	\N	\N	locale	\N	\N	\N
3	3	2025-10-09	0	Coop. Adriatica Gorino	N/A	24800.00	EUR	\N	474544514	\N	2025-10-30 11:22:05.083582	2025-10-31 15:28:24.827	0		\N	\N	\N	\N	locale	\N	\N	\N
4	4	2025-10-09	0	GORO & BOSCO SOCIETA' COOPERATIVA IN SIGLA GORO & BOSCO SOC.COOP.	N/A	41400.00	EUR	\N	474546560	\N	2025-10-30 11:22:05.585234	2025-10-31 15:28:27.91	0		\N	\N	\N	\N	locale	\N	\N	\N
5	5	2025-10-09	0	RO.MA.MAR Società Cooperativa a.r.l	N/A	36000.00	EUR	\N	474547845	\N	2025-10-30 11:22:06.332463	2025-10-31 15:28:30.849	0		\N	\N	\N	\N	locale	\N	\N	\N
6	6	2025-10-09	0	VENUS - SOC. COOP.	N/A	20700.00	EUR	\N	474551335	\N	2025-10-30 11:22:07.07858	2025-10-31 15:28:34.14	0		\N	\N	\N	\N	locale	\N	\N	\N
7	7	2025-10-09	0	SOCIETA' COOPERATIVA ACQUAVIVA	N/A	13800.00	EUR	\N	474554773	\N	2025-10-30 11:22:07.828018	2025-10-31 15:28:37.245	0		\N	\N	\N	\N	locale	\N	\N	\N
8	8	2025-10-09	0	Clams soc coop	N/A	13800.00	EUR	\N	474556087	\N	2025-10-30 11:22:08.573877	2025-10-31 15:28:40.085	0		\N	\N	\N	\N	locale	\N	\N	\N
9	9	2025-10-09	0	Coop. Adriatica Gorino	N/A	27000.00	EUR	\N	474557323	\N	2025-10-30 11:22:09.319973	2025-10-31 15:28:43.026	0		\N	\N	\N	\N	locale	\N	\N	\N
10	10	2025-10-09	0	Cooperativa Pescatori Laghese Società Cooperativa ARL	N/A	13800.00	EUR	\N	474558259	\N	2025-10-30 11:22:10.0677	2025-10-31 15:28:46.196	0		\N	\N	\N	\N	locale	\N	\N	\N
\.


--
-- TOC entry 4176 (class 0 OID 540687)
-- Dependencies: 313
-- Data for Name: ordini_righe; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ordini_righe (id, ordine_id, codice, nome, descrizione, quantita, unita_misura, prezzo_unitario, sconto, totale, created_at) FROM stdin;
143	1	38369657	RuditapesPhilippinarumTagliaT3mm(screen3000)	\N	70000000.00	nr	0.01	2.89	0.00	2025-10-31 15:28:19.830415
144	1	38369651	RuditapesPhilippinarumTagliaT2mm(screen2000)	L'ordine verrà erogato del periodo: \nGennaio-Dicembre 2026	30000000.00	nr	0.01	3.57	0.00	2025-10-31 15:28:20.077861
145	2	38369657	RuditapesPhilippinarumTagliaT3mm(screen3000)	L'ordine verrà erogato nel periodo: \nGennaio-Giugno 2026	10000000.00	nr	0.01	0.00	0.00	2025-10-31 15:28:23.032694
146	2	38369645	RuditapesPhilippinarumTagliaT3.5mm (screen3500)	Richiesta pezzature: T3-T3,5-T4 \nErogazione ordine periodo:\nLuglio-Dicembre 2026	10000000.00	nr	0.01	0.00	0.00	2025-10-31 15:28:23.283612
147	3	38369657	RuditapesPhilippinarumTagliaT3mm(screen3000)	L'ordine verrà erogato nel periodo:\nGennaio-Giugno 2026	2000000.00	nr	0.01	0.00	0.00	2025-10-31 15:28:26.363495
148	3	38369661	RuditapesPhilippinarumTagliaT5mm(screen5000)	L'ordine verrà erogato nel periodo: \nGennaio-giugno 2026	1000000.00	nr	0.01	0.00	0.00	2025-10-31 15:28:26.612324
149	4	38369657	RuditapesPhilippinarumTagliaT3mm(screen3000)	L'ordine del prodotto verrà erogato nel periodo:\nGennaio-Dicembre 2026	6000000.00	nr	0.01	0.00	0.00	2025-10-31 15:28:29.306062
150	5	38369660	RuditapesPhilippinarumTagliaT4mm(screen4000)	L'ordine verrà erogato nel periodo: \nMaggio-Agosto 2026	4000000.00	nr	0.01	0.00	0.00	2025-10-31 15:28:32.637065
151	6	38369657	RuditapesPhilippinarumTagliaT3mm(screen3000)	L'ordine del prodotto verrà erogato nel periodo: \nGennaio-Luglio 2026	3000000.00	nr	0.01	0.00	0.00	2025-10-31 15:28:35.698203
152	7	38369657	RuditapesPhilippinarumTagliaT3mm(screen3000)	L'ordine verrà erogato nel periodo: \nGennaio-Dicembre 2026	2000000.00	nr	0.01	0.00	0.00	2025-10-31 15:28:38.792167
153	8	38369657	RuditapesPhilippinarumTagliaT3mm(screen3000)	L'ordine verrà erogato nel periodo:\nGennaio-Luglio 2026	2000000.00	nr	0.01	0.00	0.00	2025-10-31 15:28:41.478947
154	9	38369660	RuditapesPhilippinarumTagliaT4mm(screen4000)	L'ordine verrà erogato nel periodo:\nGennaio-Dicembre 2026	3000000.00	nr	0.01	0.00	0.00	2025-10-31 15:28:44.630904
155	10	38369657	RuditapesPhilippinarumTagliaT3mm(screen3000)	L'ordine verrà erogato nel periodo:\nGennaio-Dicembre 2026	2000000.00	nr	0.01	0.00	0.00	2025-10-31 15:28:47.751853
\.


--
-- TOC entry 4127 (class 0 OID 16775)
-- Dependencies: 264
-- Data for Name: sale_bags; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sale_bags (id, advanced_sale_id, bag_number, size_code, total_weight, original_weight, weight_loss, animal_count, animals_per_kg, original_animals_per_kg, waste_percentage, notes) FROM stdin;
\.


--
-- TOC entry 4129 (class 0 OID 16786)
-- Dependencies: 266
-- Data for Name: sale_operations_ref; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sale_operations_ref (id, advanced_sale_id, operation_id, basket_id, original_animals, original_weight, original_animals_per_kg, included_in_sale) FROM stdin;
1	1	108	6	251863	22.1	11500	t
2	1	110	10	216534	19	11500	t
3	1	114	21	319102	28	11500	t
4	1	116	22	455860	40	11500	t
5	2	119	8	283773	24.9	11500	t
\.


--
-- TOC entry 4131 (class 0 OID 16794)
-- Dependencies: 268
-- Data for Name: screening_basket_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.screening_basket_history (id, screening_id, source_basket_id, source_cycle_id, destination_basket_id, destination_cycle_id, created_at) FROM stdin;
\.


--
-- TOC entry 4133 (class 0 OID 16802)
-- Dependencies: 270
-- Data for Name: screening_destination_baskets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.screening_destination_baskets (id, screening_id, basket_id, cycle_id, category, flupsy_id, "row", "position", position_assigned, animal_count, live_animals, total_weight, animals_per_kg, dead_count, mortality_rate, notes, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4169 (class 0 OID 393238)
-- Dependencies: 306
-- Data for Name: screening_impact_analysis; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.screening_impact_analysis (id, screening_id, analysis_run_id, basket_id, animals_sold, animals_repositioned, avg_sgr_before, avg_sgr_after, selection_bias, fast_growers_removed, slow_growers_retained, distribution_before, distribution_after, created_at) FROM stdin;
\.


--
-- TOC entry 4135 (class 0 OID 16813)
-- Dependencies: 272
-- Data for Name: screening_lot_references; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.screening_lot_references (id, screening_id, destination_basket_id, destination_cycle_id, lot_id, created_at) FROM stdin;
\.


--
-- TOC entry 4137 (class 0 OID 16821)
-- Dependencies: 274
-- Data for Name: screening_operations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.screening_operations (id, date, screening_number, purpose, reference_size_id, status, created_at, updated_at, notes, is_cross_flupsy, transport_metadata) FROM stdin;
\.


--
-- TOC entry 4139 (class 0 OID 16832)
-- Dependencies: 276
-- Data for Name: screening_source_baskets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.screening_source_baskets (id, screening_id, basket_id, cycle_id, dismissed, position_released, animal_count, total_weight, animals_per_kg, size_id, lot_id, created_at, flupsy_id) FROM stdin;
\.


--
-- TOC entry 4141 (class 0 OID 16842)
-- Dependencies: 278
-- Data for Name: selection_basket_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.selection_basket_history (id, selection_id, source_basket_id, source_cycle_id, destination_basket_id, destination_cycle_id, created_at) FROM stdin;
1	1	92	45	88	0	2025-12-01 11:28:07.15372
2	1	92	45	92	0	2025-12-01 11:28:07.15372
3	1	92	45	120	0	2025-12-01 11:28:07.15372
4	1	88	42	88	0	2025-12-01 11:28:07.15372
5	1	88	42	92	0	2025-12-01 11:28:07.15372
6	1	88	42	120	0	2025-12-01 11:28:07.15372
7	1	120	60	88	0	2025-12-01 11:28:07.15372
8	1	120	60	92	0	2025-12-01 11:28:07.15372
9	1	120	60	120	0	2025-12-01 11:28:07.15372
10	3	105	71	98	0	2025-12-03 11:35:09.618193
11	3	105	71	99	0	2025-12-03 11:35:09.618193
12	3	105	71	100	0	2025-12-03 11:35:09.618193
13	3	107	73	98	0	2025-12-03 11:35:09.618193
14	3	107	73	99	0	2025-12-03 11:35:09.618193
15	3	107	73	100	0	2025-12-03 11:35:09.618193
16	5	83	36	83	0	2025-12-03 14:36:52.241679
17	5	83	36	86	0	2025-12-03 14:36:52.241679
18	5	86	39	83	0	2025-12-03 14:36:52.241679
19	5	86	39	86	0	2025-12-03 14:36:52.241679
20	5	94	47	83	0	2025-12-03 14:36:52.241679
21	5	94	47	86	0	2025-12-03 14:36:52.241679
22	9	83	36	83	0	2025-12-03 15:10:53.626346
23	9	83	36	86	0	2025-12-03 15:10:53.626346
24	9	86	39	83	0	2025-12-03 15:10:53.626346
25	9	86	39	86	0	2025-12-03 15:10:53.626346
26	9	94	47	83	0	2025-12-03 15:10:53.626346
27	9	94	47	86	0	2025-12-03 15:10:53.626346
28	10	6	28	6	0	2025-12-04 13:05:12.137741
29	10	6	28	10	0	2025-12-04 13:05:12.137741
30	10	10	32	6	0	2025-12-04 13:05:12.137741
31	10	10	32	10	0	2025-12-04 13:05:12.137741
32	11	21	5	21	0	2025-12-04 13:06:49.636694
33	11	21	5	22	0	2025-12-04 13:06:49.636694
34	11	22	6	21	0	2025-12-04 13:06:49.636694
35	11	22	6	22	0	2025-12-04 13:06:49.636694
36	12	8	30	8	0	2025-12-04 13:12:18.729467
37	13	97	50	115	0	2025-12-05 08:24:19.857006
38	13	97	50	97	0	2025-12-05 08:24:19.857006
39	13	97	50	83	0	2025-12-05 08:24:19.857006
40	13	115	55	115	0	2025-12-05 08:24:19.857006
41	13	115	55	97	0	2025-12-05 08:24:19.857006
42	13	115	55	83	0	2025-12-05 08:24:19.857006
43	13	116	56	115	0	2025-12-05 08:24:19.857006
44	13	116	56	97	0	2025-12-05 08:24:19.857006
45	13	116	56	83	0	2025-12-05 08:24:19.857006
\.


--
-- TOC entry 4143 (class 0 OID 16850)
-- Dependencies: 280
-- Data for Name: selection_destination_baskets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.selection_destination_baskets (id, selection_id, basket_id, cycle_id, destination_type, flupsy_id, "position", animal_count, live_animals, total_weight, animals_per_kg, size_id, dead_count, mortality_rate, sample_weight, sample_count, notes, created_at, updated_at, category) FROM stdin;
14	11	21	87	sold	1608	DX1	319102	319102	28	11500	20	1	0	10	115	\N	2025-12-04 13:06:49.299011	\N	Venduta
1	1	88	75	placed	1036	DX8	555560	555560	20	27778	17	4	0	6.12	170	\N	2025-12-01 11:28:06.770213	\N	Riposizionata
2	1	92	76	placed	1036	SX2	555560	555560	20	27778	17	4	0	6.12	170	\N	2025-12-01 11:28:06.801937	\N	Riposizionata
3	1	120	77	placed	1036	DX10	671759	671759	15.9	42249	16	7	0	3.29	139	\N	2025-12-01 11:28:06.825784	\N	Riposizionata
15	11	22	88	sold	1608	DX2	455860	455860	40	11500	20	1	0	10	115	\N	2025-12-04 13:06:49.330651	\N	Venduta
16	12	8	89	sold	1607	DX8	283773	283773	24.9	11500	20	1	0	10	115	\N	2025-12-04 13:12:18.426763	\N	Venduta
17	13	115	90	placed	1038	DX5	602448	602448	8.7	70159	15	3	0	3.15	221	\N	2025-12-05 08:24:19.454337	\N	Riposizionata
18	13	97	91	placed	1036	SX7	3476369	3476369	11.8	301852	11	4	0	0.54	163	\N	2025-12-05 08:24:19.483212	\N	Riposizionata
19	13	83	92	placed	1036	DX3	3476369	3476369	11.8	301852	11	4	0	0.54	163	\N	2025-12-05 08:24:19.506396	\N	Riposizionata
5	3	98	78	placed	\N	\N	478230	\N	\N	\N	16	\N	\N	\N	\N	\N	2025-12-03 14:19:27.296541	\N	\N
6	3	99	79	placed	\N	\N	3441096	\N	\N	\N	11	\N	\N	\N	\N	\N	2025-12-03 14:19:27.296541	\N	\N
7	3	100	80	placed	\N	\N	3441096	\N	\N	\N	11	\N	\N	\N	\N	\N	2025-12-03 14:19:27.296541	\N	\N
10	9	83	83	sold	1036	DX3	506000	506000	23	22000	17	0	0	1	22	\N	2025-12-03 15:10:52.261137	\N	Venduta
11	9	86	84	sold	1036	DX6	506000	506000	23	22000	17	0	0	1	22	\N	2025-12-03 15:10:52.501406	\N	Venduta
12	10	6	85	sold	1607	DX6	251863	251863	22.1	11500	20	1	0	10	115	\N	2025-12-04 13:05:11.800223	\N	Venduta
13	10	10	86	sold	1607	DX10	216534	216534	19	11500	20	1	0	10	115	\N	2025-12-04 13:05:11.828969	\N	Venduta
\.


--
-- TOC entry 4145 (class 0 OID 16860)
-- Dependencies: 282
-- Data for Name: selection_lot_references; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.selection_lot_references (id, selection_id, destination_basket_id, destination_cycle_id, lot_id, created_at) FROM stdin;
\.


--
-- TOC entry 4147 (class 0 OID 16868)
-- Dependencies: 284
-- Data for Name: selection_source_baskets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.selection_source_baskets (id, selection_id, basket_id, cycle_id, animal_count, total_weight, animals_per_kg, size_id, lot_id, created_at, flupsy_id) FROM stdin;
1	1	92	45	384566	9649	39855	\N	5	2025-12-01 11:28:06.343462	1036
2	1	88	42	691285	15500	44599	\N	5	2025-12-01 11:28:06.420347	1036
3	1	120	60	735092	16500	44551	\N	5	2025-12-01 11:28:06.48959	1038
5	3	105	71	2991337	\N	\N	\N	5	2025-12-03 14:19:21.245363	1037
6	3	107	73	3001568	\N	\N	\N	5	2025-12-03 14:19:21.245363	1037
28	9	83	36	362966	14.2	25561	\N	5	2025-12-03 15:10:50.405614	1036
29	9	86	39	362966	14.2	25561	\N	5	2025-12-03 15:10:51.128824	1036
30	9	94	47	362966	14.2	25561	\N	5	2025-12-03 15:10:51.833602	1036
31	10	6	28	261274	24.3	10752	\N	4	2025-12-04 13:05:11.480355	1607
32	10	10	32	201440	22.7	8874	\N	4	2025-12-04 13:05:11.557182	1607
33	11	21	5	417600	29.5	14156	\N	3	2025-12-04 13:06:48.98988	1608
34	11	22	6	367500	24.5	15000	\N	3	2025-12-04 13:06:49.067681	1608
35	12	8	30	283902	23.7	11979	\N	4	2025-12-04 13:12:18.174493	1607
36	13	97	50	3001568	4.633	647887	\N	5	2025-12-05 08:24:19.078116	1036
37	13	115	55	2563120	4.024	636905	\N	5	2025-12-05 08:24:19.15525	1038
38	13	116	56	2563120	4.024	636905	\N	5	2025-12-05 08:24:19.222681	1038
\.


--
-- TOC entry 4184 (class 0 OID 786486)
-- Dependencies: 321
-- Data for Name: selection_task_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.selection_task_assignments (id, task_id, operator_id, status, assigned_at, started_at, completed_at, completion_notes, external_app_synced_at, started_by, completed_by) FROM stdin;
26	16	1	assigned	2025-11-28 10:38:21.821137	\N	\N	\N	\N	\N	\N
27	16	4	assigned	2025-11-28 10:38:21.821137	\N	\N	\N	\N	\N	\N
28	17	4	assigned	2025-11-28 11:58:42.6564	\N	\N	\N	\N	\N	\N
30	18	1	assigned	2025-11-28 12:00:08.659751	\N	\N	\N	\N	\N	\N
31	18	4	assigned	2025-11-28 12:00:08.659751	\N	\N	\N	\N	\N	\N
32	19	1	assigned	2025-11-28 12:01:09.47966	\N	\N	\N	\N	\N	\N
33	19	4	assigned	2025-11-28 12:01:09.47966	\N	\N	\N	\N	\N	\N
34	20	1	assigned	2025-11-28 12:06:16.422271	\N	\N	\N	\N	\N	\N
35	20	4	assigned	2025-11-28 12:06:16.422271	\N	\N	\N	\N	\N	\N
29	17	1	in_progress	2025-11-28 11:58:42.6564	2025-12-01 11:32:07.797083	\N	\N	2025-12-01 11:32:07.797083	1	\N
\.


--
-- TOC entry 4182 (class 0 OID 786465)
-- Dependencies: 319
-- Data for Name: selection_task_baskets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.selection_task_baskets (id, task_id, basket_id, role, created_at) FROM stdin;
39	16	103	source	2025-11-28 10:38:21.791215
40	16	104	source	2025-11-28 10:38:21.791215
41	16	106	source	2025-11-28 10:38:21.791215
42	16	108	source	2025-11-28 10:38:21.791215
43	17	81	source	2025-11-28 11:58:42.627361
44	17	88	source	2025-11-28 11:58:42.627361
45	17	89	source	2025-11-28 11:58:42.627361
46	17	90	source	2025-11-28 11:58:42.627361
47	17	91	source	2025-11-28 11:58:42.627361
48	17	92	source	2025-11-28 11:58:42.627361
49	17	95	source	2025-11-28 11:58:42.627361
50	17	96	source	2025-11-28 11:58:42.627361
51	17	112	source	2025-11-28 11:58:42.627361
52	17	120	source	2025-11-28 11:58:42.627361
53	18	93	source	2025-11-28 12:00:08.634306
54	19	93	source	2025-11-28 12:01:09.454946
55	20	93	source	2025-11-28 12:06:16.365512
\.


--
-- TOC entry 4180 (class 0 OID 786446)
-- Dependencies: 317
-- Data for Name: selection_tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.selection_tasks (id, selection_id, task_type, description, priority, status, due_date, created_at, updated_at, completed_at, notes, cadence, cadence_interval, cancelled_by, cancelled_at) FROM stdin;
16	\N	vagliatura	animali sul flupsy 2 da vagliare con la rete del 1500	medium	cancelled	2025-12-15	2025-11-28 10:38:21.751015	2025-11-28 11:45:04.689	\N	da tenere sotto osservazione 	\N	1	\N	2025-11-28 11:45:04.689
17	\N	vagliatura	vagliare con il t3	high	pending	2025-12-09	2025-11-28 11:58:42.59749	\N	\N	Elenco ceste da vagliare con il T3 per le vendite del 2 dicembre, 4 dicembre, e 9 dicembre assieme a Delta Futuro 	weekly	1	\N	\N
18	\N	vagliatura	vagliare con il t4	high	pending	2025-12-02	2025-11-28 12:00:08.606484	\N	\N	Vendita di T4 per adriatica 200.000 animali (chiedi prima a delta futuro loro hanno molto t4 dato da noi!!)	\N	1	\N	\N
19	\N	vagliatura	vagliare con il t4	high	cancelled	2025-11-10	2025-11-28 12:01:09.428541	2025-11-28 12:04:35.666	\N	vendita di t4 1.000.000 venus da concordare con Delt futuro 	\N	1	\N	2025-11-28 12:04:35.666
20	\N	vagliatura	vagliare con il t4	high	pending	2025-12-10	2025-11-28 12:06:16.297516	\N	\N	vendita di t4 da concordare con delta futuro per Venus 1.000.000	\N	1	\N	\N
\.


--
-- TOC entry 4149 (class 0 OID 16876)
-- Dependencies: 286
-- Data for Name: selections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.selections (id, date, selection_number, purpose, screening_type, reference_size_id, status, created_at, updated_at, notes, is_cross_flupsy, origin_flupsy_id, destination_flupsy_id, transport_metadata) FROM stdin;
1	2025-12-01	1	vagliatura	\N	\N	completed	2025-12-01 11:28:05.932	2025-12-01 11:28:10.553		t	1038	1036	{"notes": "", "operatorName": "ANDREA CONTATO", "transportTime": "2025-12-01T12:21"}
3	2025-12-03	2	vagliatura	\N	\N	completed	2025-12-03 14:18:18.504746	\N	\N	t	1037	1036	{"notes": "", "operatorName": "ANDREA CONTATO", "transportTime": "2025-12-03T12:34"}
9	2025-12-03	6	vagliatura	\N	\N	completed	2025-12-03 15:10:49.095	2025-12-03 15:11:05.366		f	1036	1036	\N
10	2025-12-03	7	vagliatura	\N	\N	completed	2025-12-04 13:05:11.108	2025-12-04 13:05:13.097		f	1607	1607	\N
11	2025-12-03	8	vagliatura	\N	\N	completed	2025-12-04 13:06:48.605	2025-12-04 13:06:52.677		f	1608	1608	\N
12	2025-12-04	9	vagliatura	\N	\N	completed	2025-12-04 13:12:17.807	2025-12-04 13:12:21.363		f	1607	1607	\N
13	2025-12-04	10	vagliatura	\N	\N	completed	2025-12-05 08:24:18.707	2025-12-05 08:24:21.317	DIVISIONE TAGLIE 	f	1036	1036	\N
\.


--
-- TOC entry 4151 (class 0 OID 16887)
-- Dependencies: 288
-- Data for Name: sgr; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sgr (id, month, percentage, calculated_from_real) FROM stdin;
49	settembre	3.7	t
50	gennaio	0.8	t
51	febbraio	1.2	t
52	marzo	3.4	t
53	aprile	3.7	t
54	maggio	5.7	t
55	giugno	7	t
56	luglio	7.9	t
57	agosto	8.3	t
58	ottobre	4.1	t
59	novembre	1.6	t
60	dicembre	0.8	t
\.


--
-- TOC entry 4153 (class 0 OID 16897)
-- Dependencies: 290
-- Data for Name: sgr_giornalieri; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sgr_giornalieri (id, record_date, temperature, ph, ammonia, oxygen, salinity, notes, operator_id, operator_name, created_at, updated_at) FROM stdin;
1	2025-11-28 12:49:34.811	8.2	8	0	7.8	18	Acqua limpida, ridotto numero di alghe ma animali sui bins ancora mediamente attivi 	1	Andrea Contato	2025-11-28 12:49:37.707996	2025-11-28 12:49:37.707996
\.


--
-- TOC entry 4163 (class 0 OID 352257)
-- Dependencies: 300
-- Data for Name: sgr_per_taglia; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sgr_per_taglia (id, month, size_id, calculated_sgr, sample_count, last_calculated, notes) FROM stdin;
1	gennaio	2	1.08	25	2025-10-20 18:11:57.072858	Dati stimati biologici - naissain crescita rapida
2	gennaio	3	1	28	2025-10-20 18:11:57.072858	Dati stimati biologici - seme piccolo
3	gennaio	4	1	30	2025-10-20 18:11:57.072858	Dati stimati biologici - seme piccolo
4	gennaio	5	1	32	2025-10-20 18:11:57.072858	Dati stimati biologici - seme medio
5	gennaio	1	0.92	34	2025-10-20 18:11:57.072858	Dati stimati biologici - pre-commerciale
6	gennaio	6	0.92	35	2025-10-20 18:11:57.072858	Dati stimati biologici - pre-commerciale
7	gennaio	7	0.92	36	2025-10-20 18:11:57.072858	Dati stimati biologici - pre-commerciale
8	gennaio	8	0.88	38	2025-10-20 18:11:57.072858	Dati stimati biologici
9	gennaio	9	0.88	37	2025-10-20 18:11:57.072858	Dati stimati biologici
10	gennaio	10	0.88	35	2025-10-20 18:11:57.072858	Dati stimati biologici
11	gennaio	11	0.88	33	2025-10-20 18:11:57.072858	Dati stimati biologici
12	gennaio	12	0.84	31	2025-10-20 18:11:57.072858	Dati stimati biologici
13	gennaio	13	0.84	30	2025-10-20 18:11:57.072858	Dati stimati biologici
14	gennaio	14	0.84	28	2025-10-20 18:11:57.072858	Dati stimati biologici
15	gennaio	15	0.8	27	2025-10-20 18:11:57.072858	Dati stimati biologici - taglia riferimento
16	gennaio	16	0.8	26	2025-10-20 18:11:57.072858	Dati stimati biologici - taglia riferimento
17	gennaio	17	0.76	25	2025-10-20 18:11:57.072858	Dati stimati biologici - commerciale piccola
18	gennaio	18	0.76	24	2025-10-20 18:11:57.072858	Dati stimati biologici - commerciale piccola
19	gennaio	19	0.76	23	2025-10-20 18:11:57.072858	Dati stimati biologici - commerciale piccola
20	gennaio	20	0.72	22	2025-10-20 18:11:57.072858	Dati stimati biologici - commerciale media
21	gennaio	21	0.72	21	2025-10-20 18:11:57.072858	Dati stimati biologici - commerciale media
22	gennaio	22	0.72	20	2025-10-20 18:11:57.072858	Dati stimati biologici - commerciale media
23	gennaio	23	0.68	22	2025-10-20 18:11:57.072858	Dati stimati biologici - commerciale grande
24	gennaio	24	0.68	23	2025-10-20 18:11:57.072858	Dati stimati biologici - commerciale grande
25	gennaio	25	0.64	24	2025-10-20 18:11:57.072858	Dati stimati biologici - extra grande
26	gennaio	26	0.64	25	2025-10-20 18:11:57.072858	Dati stimati biologici - extra grande
27	gennaio	27	0.6	26	2025-10-20 18:11:57.072858	Dati stimati biologici - taglia massima
28	febbraio	2	1.62	26	2025-10-20 18:12:56.627979	Dati stimati biologici - naissain crescita rapida
29	febbraio	3	1.5	29	2025-10-20 18:12:56.627979	Dati stimati biologici - seme piccolo
30	febbraio	4	1.5	31	2025-10-20 18:12:56.627979	Dati stimati biologici - seme piccolo
31	febbraio	5	1.5	33	2025-10-20 18:12:56.627979	Dati stimati biologici - seme medio
32	febbraio	1	1.38	35	2025-10-20 18:12:56.627979	Dati stimati biologici - pre-commerciale
33	febbraio	6	1.38	36	2025-10-20 18:12:56.627979	Dati stimati biologici - pre-commerciale
34	febbraio	7	1.38	37	2025-10-20 18:12:56.627979	Dati stimati biologici - pre-commerciale
35	febbraio	8	1.32	39	2025-10-20 18:12:56.627979	Dati stimati biologici
36	febbraio	9	1.32	38	2025-10-20 18:12:56.627979	Dati stimati biologici
37	febbraio	10	1.32	36	2025-10-20 18:12:56.627979	Dati stimati biologici
38	febbraio	11	1.32	34	2025-10-20 18:12:56.627979	Dati stimati biologici
39	febbraio	12	1.26	32	2025-10-20 18:12:56.627979	Dati stimati biologici
40	febbraio	13	1.26	31	2025-10-20 18:12:56.627979	Dati stimati biologici
41	febbraio	14	1.26	29	2025-10-20 18:12:56.627979	Dati stimati biologici
42	febbraio	15	1.2	28	2025-10-20 18:12:56.627979	Dati stimati biologici - taglia riferimento
43	febbraio	16	1.2	27	2025-10-20 18:12:56.627979	Dati stimati biologici - taglia riferimento
44	febbraio	17	1.14	26	2025-10-20 18:12:56.627979	Dati stimati biologici - commerciale piccola
45	febbraio	18	1.14	25	2025-10-20 18:12:56.627979	Dati stimati biologici - commerciale piccola
46	febbraio	19	1.14	24	2025-10-20 18:12:56.627979	Dati stimati biologici - commerciale piccola
47	febbraio	20	1.08	23	2025-10-20 18:12:56.627979	Dati stimati biologici - commerciale media
48	febbraio	21	1.08	22	2025-10-20 18:12:56.627979	Dati stimati biologici - commerciale media
49	febbraio	22	1.08	21	2025-10-20 18:12:56.627979	Dati stimati biologici - commerciale media
50	febbraio	23	1.02	23	2025-10-20 18:12:56.627979	Dati stimati biologici - commerciale grande
51	febbraio	24	1.02	24	2025-10-20 18:12:56.627979	Dati stimati biologici - commerciale grande
52	febbraio	25	0.96	25	2025-10-20 18:12:56.627979	Dati stimati biologici - extra grande
53	febbraio	26	0.96	26	2025-10-20 18:12:56.627979	Dati stimati biologici - extra grande
54	febbraio	27	0.9	27	2025-10-20 18:12:56.627979	Dati stimati biologici - taglia massima
55	marzo	2	4.59	27	2025-10-20 18:12:56.627979	Dati stimati biologici - naissain crescita rapida
56	marzo	3	4.25	30	2025-10-20 18:12:56.627979	Dati stimati biologici - seme piccolo
57	marzo	4	4.25	32	2025-10-20 18:12:56.627979	Dati stimati biologici - seme piccolo
58	marzo	5	4.25	34	2025-10-20 18:12:56.627979	Dati stimati biologici - seme medio
59	marzo	1	3.91	36	2025-10-20 18:12:56.627979	Dati stimati biologici - pre-commerciale
60	marzo	6	3.91	37	2025-10-20 18:12:56.627979	Dati stimati biologici - pre-commerciale
61	marzo	7	3.91	38	2025-10-20 18:12:56.627979	Dati stimati biologici - pre-commerciale
62	marzo	8	3.74	40	2025-10-20 18:12:56.627979	Dati stimati biologici
63	marzo	9	3.74	39	2025-10-20 18:12:56.627979	Dati stimati biologici
64	marzo	10	3.74	37	2025-10-20 18:12:56.627979	Dati stimati biologici
65	marzo	11	3.74	35	2025-10-20 18:12:56.627979	Dati stimati biologici
66	marzo	12	3.57	33	2025-10-20 18:12:56.627979	Dati stimati biologici
67	marzo	13	3.57	32	2025-10-20 18:12:56.627979	Dati stimati biologici
68	marzo	14	3.57	30	2025-10-20 18:12:56.627979	Dati stimati biologici
69	marzo	15	3.4	29	2025-10-20 18:12:56.627979	Dati stimati biologici - taglia riferimento
70	marzo	16	3.4	28	2025-10-20 18:12:56.627979	Dati stimati biologici - taglia riferimento
71	marzo	17	3.23	27	2025-10-20 18:12:56.627979	Dati stimati biologici - commerciale piccola
72	marzo	18	3.23	26	2025-10-20 18:12:56.627979	Dati stimati biologici - commerciale piccola
73	marzo	19	3.23	25	2025-10-20 18:12:56.627979	Dati stimati biologici - commerciale piccola
74	marzo	20	3.06	24	2025-10-20 18:12:56.627979	Dati stimati biologici - commerciale media
75	marzo	21	3.06	23	2025-10-20 18:12:56.627979	Dati stimati biologici - commerciale media
76	marzo	22	3.06	22	2025-10-20 18:12:56.627979	Dati stimati biologici - commerciale media
77	marzo	23	2.89	24	2025-10-20 18:12:56.627979	Dati stimati biologici - commerciale grande
78	marzo	24	2.89	25	2025-10-20 18:12:56.627979	Dati stimati biologici - commerciale grande
79	marzo	25	2.72	26	2025-10-20 18:12:56.627979	Dati stimati biologici - extra grande
80	marzo	26	2.72	27	2025-10-20 18:12:56.627979	Dati stimati biologici - extra grande
81	marzo	27	2.55	28	2025-10-20 18:12:56.627979	Dati stimati biologici - taglia massima
82	aprile	2	4.995	28	2025-10-20 18:13:11.940768	Dati stimati biologici - naissain crescita rapida
83	aprile	3	4.625	31	2025-10-20 18:13:11.940768	Dati stimati biologici - seme piccolo
84	aprile	4	4.625	33	2025-10-20 18:13:11.940768	Dati stimati biologici - seme piccolo
85	aprile	5	4.625	35	2025-10-20 18:13:11.940768	Dati stimati biologici - seme medio
86	aprile	1	4.255	37	2025-10-20 18:13:11.940768	Dati stimati biologici - pre-commerciale
87	aprile	6	4.255	38	2025-10-20 18:13:11.940768	Dati stimati biologici - pre-commerciale
88	aprile	7	4.255	39	2025-10-20 18:13:11.940768	Dati stimati biologici - pre-commerciale
89	aprile	8	4.07	40	2025-10-20 18:13:11.940768	Dati stimati biologici
90	aprile	9	4.07	39	2025-10-20 18:13:11.940768	Dati stimati biologici
91	aprile	10	4.07	38	2025-10-20 18:13:11.940768	Dati stimati biologici
92	aprile	11	4.07	36	2025-10-20 18:13:11.940768	Dati stimati biologici
93	aprile	12	3.885	34	2025-10-20 18:13:11.940768	Dati stimati biologici
94	aprile	13	3.885	33	2025-10-20 18:13:11.940768	Dati stimati biologici
95	aprile	14	3.885	31	2025-10-20 18:13:11.940768	Dati stimati biologici
96	aprile	15	3.7	30	2025-10-20 18:13:11.940768	Dati stimati biologici - taglia riferimento
97	aprile	16	3.7	29	2025-10-20 18:13:11.940768	Dati stimati biologici - taglia riferimento
98	aprile	17	3.515	28	2025-10-20 18:13:11.940768	Dati stimati biologici - commerciale piccola
99	aprile	18	3.515	27	2025-10-20 18:13:11.940768	Dati stimati biologici - commerciale piccola
100	aprile	19	3.515	26	2025-10-20 18:13:11.940768	Dati stimati biologici - commerciale piccola
101	aprile	20	3.33	25	2025-10-20 18:13:11.940768	Dati stimati biologici - commerciale media
102	aprile	21	3.33	24	2025-10-20 18:13:11.940768	Dati stimati biologici - commerciale media
103	aprile	22	3.33	23	2025-10-20 18:13:11.940768	Dati stimati biologici - commerciale media
104	aprile	23	3.145	25	2025-10-20 18:13:11.940768	Dati stimati biologici - commerciale grande
105	aprile	24	3.145	26	2025-10-20 18:13:11.940768	Dati stimati biologici - commerciale grande
106	aprile	25	2.96	27	2025-10-20 18:13:11.940768	Dati stimati biologici - extra grande
107	aprile	26	2.96	28	2025-10-20 18:13:11.940768	Dati stimati biologici - extra grande
108	aprile	27	2.775	29	2025-10-20 18:13:11.940768	Dati stimati biologici - taglia massima
109	maggio	2	7.695	29	2025-10-20 18:13:11.940768	Dati stimati biologici - naissain crescita rapida
110	maggio	3	7.125	32	2025-10-20 18:13:11.940768	Dati stimati biologici - seme piccolo
111	maggio	4	7.125	34	2025-10-20 18:13:11.940768	Dati stimati biologici - seme piccolo
112	maggio	5	7.125	36	2025-10-20 18:13:11.940768	Dati stimati biologici - seme medio
113	maggio	1	6.555	38	2025-10-20 18:13:11.940768	Dati stimati biologici - pre-commerciale
114	maggio	6	6.555	39	2025-10-20 18:13:11.940768	Dati stimati biologici - pre-commerciale
115	maggio	7	6.555	40	2025-10-20 18:13:11.940768	Dati stimati biologici - pre-commerciale
116	maggio	8	6.27	40	2025-10-20 18:13:11.940768	Dati stimati biologici
117	maggio	9	6.27	39	2025-10-20 18:13:11.940768	Dati stimati biologici
118	maggio	10	6.27	38	2025-10-20 18:13:11.940768	Dati stimati biologici
119	maggio	11	6.27	37	2025-10-20 18:13:11.940768	Dati stimati biologici
120	maggio	12	5.985	35	2025-10-20 18:13:11.940768	Dati stimati biologici
121	maggio	13	5.985	34	2025-10-20 18:13:11.940768	Dati stimati biologici
122	maggio	14	5.985	32	2025-10-20 18:13:11.940768	Dati stimati biologici
123	maggio	15	5.7	31	2025-10-20 18:13:11.940768	Dati stimati biologici - taglia riferimento
124	maggio	16	5.7	30	2025-10-20 18:13:11.940768	Dati stimati biologici - taglia riferimento
125	maggio	17	5.415	29	2025-10-20 18:13:11.940768	Dati stimati biologici - commerciale piccola
126	maggio	18	5.415	28	2025-10-20 18:13:11.940768	Dati stimati biologici - commerciale piccola
127	maggio	19	5.415	27	2025-10-20 18:13:11.940768	Dati stimati biologici - commerciale piccola
128	maggio	20	5.13	26	2025-10-20 18:13:11.940768	Dati stimati biologici - commerciale media
129	maggio	21	5.13	25	2025-10-20 18:13:11.940768	Dati stimati biologici - commerciale media
130	maggio	22	5.13	24	2025-10-20 18:13:11.940768	Dati stimati biologici - commerciale media
131	maggio	23	4.845	26	2025-10-20 18:13:11.940768	Dati stimati biologici - commerciale grande
132	maggio	24	4.845	27	2025-10-20 18:13:11.940768	Dati stimati biologici - commerciale grande
133	maggio	25	4.56	28	2025-10-20 18:13:11.940768	Dati stimati biologici - extra grande
134	maggio	26	4.56	29	2025-10-20 18:13:11.940768	Dati stimati biologici - extra grande
135	maggio	27	4.275	30	2025-10-20 18:13:11.940768	Dati stimati biologici - taglia massima
136	giugno	2	9.45	30	2025-10-20 18:13:11.940768	Dati stimati biologici - naissain crescita rapida
137	giugno	3	8.75	33	2025-10-20 18:13:11.940768	Dati stimati biologici - seme piccolo
138	giugno	4	8.75	35	2025-10-20 18:13:11.940768	Dati stimati biologici - seme piccolo
139	giugno	5	8.75	37	2025-10-20 18:13:11.940768	Dati stimati biologici - seme medio
140	giugno	1	8.05	39	2025-10-20 18:13:11.940768	Dati stimati biologici - pre-commerciale
141	giugno	6	8.05	40	2025-10-20 18:13:11.940768	Dati stimati biologici - pre-commerciale
142	giugno	7	8.05	40	2025-10-20 18:13:11.940768	Dati stimati biologici - pre-commerciale
143	giugno	8	7.7	40	2025-10-20 18:13:11.940768	Dati stimati biologici
144	giugno	9	7.7	39	2025-10-20 18:13:11.940768	Dati stimati biologici
145	giugno	10	7.7	38	2025-10-20 18:13:11.940768	Dati stimati biologici
146	giugno	11	7.7	37	2025-10-20 18:13:11.940768	Dati stimati biologici
147	giugno	12	7.35	36	2025-10-20 18:13:11.940768	Dati stimati biologici
148	giugno	13	7.35	35	2025-10-20 18:13:11.940768	Dati stimati biologici
149	giugno	14	7.35	33	2025-10-20 18:13:11.940768	Dati stimati biologici
150	giugno	15	7	32	2025-10-20 18:13:11.940768	Dati stimati biologici - taglia riferimento
151	giugno	16	7	31	2025-10-20 18:13:11.940768	Dati stimati biologici - taglia riferimento
152	giugno	17	6.65	30	2025-10-20 18:13:11.940768	Dati stimati biologici - commerciale piccola
153	giugno	18	6.65	29	2025-10-20 18:13:11.940768	Dati stimati biologici - commerciale piccola
154	giugno	19	6.65	28	2025-10-20 18:13:11.940768	Dati stimati biologici - commerciale piccola
155	giugno	20	6.3	27	2025-10-20 18:13:11.940768	Dati stimati biologici - commerciale media
156	giugno	21	6.3	26	2025-10-20 18:13:11.940768	Dati stimati biologici - commerciale media
157	giugno	22	6.3	25	2025-10-20 18:13:11.940768	Dati stimati biologici - commerciale media
158	giugno	23	5.95	27	2025-10-20 18:13:11.940768	Dati stimati biologici - commerciale grande
159	giugno	24	5.95	28	2025-10-20 18:13:11.940768	Dati stimati biologici - commerciale grande
160	giugno	25	5.6	29	2025-10-20 18:13:11.940768	Dati stimati biologici - extra grande
161	giugno	26	5.6	30	2025-10-20 18:13:11.940768	Dati stimati biologici - extra grande
162	giugno	27	5.25	31	2025-10-20 18:13:11.940768	Dati stimati biologici - taglia massima
163	luglio	2	10.665	31	2025-10-20 18:13:32.104078	Dati stimati biologici - naissain crescita rapida
164	luglio	3	9.875	34	2025-10-20 18:13:32.104078	Dati stimati biologici - seme piccolo
165	luglio	4	9.875	36	2025-10-20 18:13:32.104078	Dati stimati biologici - seme piccolo
166	luglio	5	9.875	38	2025-10-20 18:13:32.104078	Dati stimati biologici - seme medio
167	luglio	1	9.085	40	2025-10-20 18:13:32.104078	Dati stimati biologici - pre-commerciale
168	luglio	6	9.085	40	2025-10-20 18:13:32.104078	Dati stimati biologici - pre-commerciale
169	luglio	7	9.085	40	2025-10-20 18:13:32.104078	Dati stimati biologici - pre-commerciale
170	luglio	8	8.69	40	2025-10-20 18:13:32.104078	Dati stimati biologici
171	luglio	9	8.69	39	2025-10-20 18:13:32.104078	Dati stimati biologici
172	luglio	10	8.69	38	2025-10-20 18:13:32.104078	Dati stimati biologici
173	luglio	11	8.69	37	2025-10-20 18:13:32.104078	Dati stimati biologici
174	luglio	12	8.295	36	2025-10-20 18:13:32.104078	Dati stimati biologici
175	luglio	13	8.295	35	2025-10-20 18:13:32.104078	Dati stimati biologici
176	luglio	14	8.295	34	2025-10-20 18:13:32.104078	Dati stimati biologici
177	luglio	15	7.9	33	2025-10-20 18:13:32.104078	Dati stimati biologici - taglia riferimento
178	luglio	16	7.9	32	2025-10-20 18:13:32.104078	Dati stimati biologici - taglia riferimento
179	luglio	17	7.505	31	2025-10-20 18:13:32.104078	Dati stimati biologici - commerciale piccola
180	luglio	18	7.505	30	2025-10-20 18:13:32.104078	Dati stimati biologici - commerciale piccola
181	luglio	19	7.505	29	2025-10-20 18:13:32.104078	Dati stimati biologici - commerciale piccola
182	luglio	20	7.11	28	2025-10-20 18:13:32.104078	Dati stimati biologici - commerciale media
183	luglio	21	7.11	27	2025-10-20 18:13:32.104078	Dati stimati biologici - commerciale media
184	luglio	22	7.11	26	2025-10-20 18:13:32.104078	Dati stimati biologici - commerciale media
185	luglio	23	6.715	28	2025-10-20 18:13:32.104078	Dati stimati biologici - commerciale grande
186	luglio	24	6.715	29	2025-10-20 18:13:32.104078	Dati stimati biologici - commerciale grande
187	luglio	25	6.32	30	2025-10-20 18:13:32.104078	Dati stimati biologici - extra grande
188	luglio	26	6.32	31	2025-10-20 18:13:32.104078	Dati stimati biologici - extra grande
189	luglio	27	5.925	32	2025-10-20 18:13:32.104078	Dati stimati biologici - taglia massima
190	agosto	2	11.205	32	2025-10-20 18:13:32.104078	Dati stimati biologici - naissain crescita rapida
191	agosto	3	10.375	35	2025-10-20 18:13:32.104078	Dati stimati biologici - seme piccolo
192	agosto	4	10.375	37	2025-10-20 18:13:32.104078	Dati stimati biologici - seme piccolo
193	agosto	5	10.375	39	2025-10-20 18:13:32.104078	Dati stimati biologici - seme medio
194	agosto	1	9.545	40	2025-10-20 18:13:32.104078	Dati stimati biologici - pre-commerciale
195	agosto	6	9.545	40	2025-10-20 18:13:32.104078	Dati stimati biologici - pre-commerciale
196	agosto	7	9.545	40	2025-10-20 18:13:32.104078	Dati stimati biologici - pre-commerciale
197	agosto	8	9.13	40	2025-10-20 18:13:32.104078	Dati stimati biologici
198	agosto	9	9.13	39	2025-10-20 18:13:32.104078	Dati stimati biologici
199	agosto	10	9.13	38	2025-10-20 18:13:32.104078	Dati stimati biologici
200	agosto	11	9.13	37	2025-10-20 18:13:32.104078	Dati stimati biologici
201	agosto	12	8.715	36	2025-10-20 18:13:32.104078	Dati stimati biologici
202	agosto	13	8.715	35	2025-10-20 18:13:32.104078	Dati stimati biologici
203	agosto	14	8.715	34	2025-10-20 18:13:32.104078	Dati stimati biologici
204	agosto	15	8.3	33	2025-10-20 18:13:32.104078	Dati stimati biologici - taglia riferimento
205	agosto	16	8.3	32	2025-10-20 18:13:32.104078	Dati stimati biologici - taglia riferimento
206	agosto	17	7.885	31	2025-10-20 18:13:32.104078	Dati stimati biologici - commerciale piccola
207	agosto	18	7.885	30	2025-10-20 18:13:32.104078	Dati stimati biologici - commerciale piccola
208	agosto	19	7.885	29	2025-10-20 18:13:32.104078	Dati stimati biologici - commerciale piccola
209	agosto	20	7.47	28	2025-10-20 18:13:32.104078	Dati stimati biologici - commerciale media
210	agosto	21	7.47	27	2025-10-20 18:13:32.104078	Dati stimati biologici - commerciale media
211	agosto	22	7.47	26	2025-10-20 18:13:32.104078	Dati stimati biologici - commerciale media
212	agosto	23	7.055	28	2025-10-20 18:13:32.104078	Dati stimati biologici - commerciale grande
213	agosto	24	7.055	29	2025-10-20 18:13:32.104078	Dati stimati biologici - commerciale grande
214	agosto	25	6.64	30	2025-10-20 18:13:32.104078	Dati stimati biologici - extra grande
215	agosto	26	6.64	31	2025-10-20 18:13:32.104078	Dati stimati biologici - extra grande
216	agosto	27	6.225	32	2025-10-20 18:13:32.104078	Dati stimati biologici - taglia massima
217	settembre	2	4.995	28	2025-10-20 18:13:32.104078	Dati stimati biologici - naissain crescita rapida
218	settembre	3	4.625	31	2025-10-20 18:13:32.104078	Dati stimati biologici - seme piccolo
219	settembre	4	4.625	33	2025-10-20 18:13:32.104078	Dati stimati biologici - seme piccolo
220	settembre	5	4.625	35	2025-10-20 18:13:32.104078	Dati stimati biologici - seme medio
221	settembre	1	4.255	37	2025-10-20 18:13:32.104078	Dati stimati biologici - pre-commerciale
222	settembre	6	4.255	38	2025-10-20 18:13:32.104078	Dati stimati biologici - pre-commerciale
223	settembre	7	4.255	39	2025-10-20 18:13:32.104078	Dati stimati biologici - pre-commerciale
224	settembre	8	4.07	40	2025-10-20 18:13:32.104078	Dati stimati biologici
225	settembre	9	4.07	39	2025-10-20 18:13:32.104078	Dati stimati biologici
226	settembre	10	4.07	38	2025-10-20 18:13:32.104078	Dati stimati biologici
227	settembre	11	4.07	36	2025-10-20 18:13:32.104078	Dati stimati biologici
228	settembre	12	3.885	34	2025-10-20 18:13:32.104078	Dati stimati biologici
229	settembre	13	3.885	33	2025-10-20 18:13:32.104078	Dati stimati biologici
230	settembre	14	3.885	31	2025-10-20 18:13:32.104078	Dati stimati biologici
231	settembre	15	3.7	30	2025-10-20 18:13:32.104078	Dati stimati biologici - taglia riferimento
232	settembre	16	3.7	29	2025-10-20 18:13:32.104078	Dati stimati biologici - taglia riferimento
233	settembre	17	3.515	28	2025-10-20 18:13:32.104078	Dati stimati biologici - commerciale piccola
234	settembre	18	3.515	27	2025-10-20 18:13:32.104078	Dati stimati biologici - commerciale piccola
235	settembre	19	3.515	26	2025-10-20 18:13:32.104078	Dati stimati biologici - commerciale piccola
236	settembre	20	3.33	25	2025-10-20 18:13:32.104078	Dati stimati biologici - commerciale media
237	settembre	21	3.33	24	2025-10-20 18:13:32.104078	Dati stimati biologici - commerciale media
238	settembre	22	3.33	23	2025-10-20 18:13:32.104078	Dati stimati biologici - commerciale media
239	settembre	23	3.145	25	2025-10-20 18:13:32.104078	Dati stimati biologici - commerciale grande
240	settembre	24	3.145	26	2025-10-20 18:13:32.104078	Dati stimati biologici - commerciale grande
241	settembre	25	2.96	27	2025-10-20 18:13:32.104078	Dati stimati biologici - extra grande
242	settembre	26	2.96	28	2025-10-20 18:13:32.104078	Dati stimati biologici - extra grande
243	settembre	27	2.775	29	2025-10-20 18:13:32.104078	Dati stimati biologici - taglia massima
244	ottobre	2	5.535	29	2025-10-20 18:13:51.52297	Dati stimati biologici - naissain crescita rapida
245	ottobre	3	5.125	32	2025-10-20 18:13:51.52297	Dati stimati biologici - seme piccolo
246	ottobre	4	5.125	34	2025-10-20 18:13:51.52297	Dati stimati biologici - seme piccolo
247	ottobre	5	5.125	36	2025-10-20 18:13:51.52297	Dati stimati biologici - seme medio
248	ottobre	1	4.715	38	2025-10-20 18:13:51.52297	Dati stimati biologici - pre-commerciale
249	ottobre	6	4.715	39	2025-10-20 18:13:51.52297	Dati stimati biologici - pre-commerciale
250	ottobre	7	4.715	40	2025-10-20 18:13:51.52297	Dati stimati biologici - pre-commerciale
251	ottobre	8	4.51	40	2025-10-20 18:13:51.52297	Dati stimati biologici
252	ottobre	9	4.51	39	2025-10-20 18:13:51.52297	Dati stimati biologici
253	ottobre	10	4.51	38	2025-10-20 18:13:51.52297	Dati stimati biologici
254	ottobre	11	4.51	37	2025-10-20 18:13:51.52297	Dati stimati biologici
255	ottobre	12	4.305	35	2025-10-20 18:13:51.52297	Dati stimati biologici
256	ottobre	13	4.305	34	2025-10-20 18:13:51.52297	Dati stimati biologici
257	ottobre	14	4.305	32	2025-10-20 18:13:51.52297	Dati stimati biologici
258	ottobre	15	4.1	31	2025-10-20 18:13:51.52297	Dati stimati biologici - taglia riferimento
259	ottobre	16	4.1	30	2025-10-20 18:13:51.52297	Dati stimati biologici - taglia riferimento
260	ottobre	17	3.895	29	2025-10-20 18:13:51.52297	Dati stimati biologici - commerciale piccola
261	ottobre	18	3.895	28	2025-10-20 18:13:51.52297	Dati stimati biologici - commerciale piccola
262	ottobre	19	3.895	27	2025-10-20 18:13:51.52297	Dati stimati biologici - commerciale piccola
263	ottobre	20	3.69	26	2025-10-20 18:13:51.52297	Dati stimati biologici - commerciale media
264	ottobre	21	3.69	25	2025-10-20 18:13:51.52297	Dati stimati biologici - commerciale media
265	ottobre	22	3.69	24	2025-10-20 18:13:51.52297	Dati stimati biologici - commerciale media
266	ottobre	23	3.485	26	2025-10-20 18:13:51.52297	Dati stimati biologici - commerciale grande
267	ottobre	24	3.485	27	2025-10-20 18:13:51.52297	Dati stimati biologici - commerciale grande
268	ottobre	25	3.28	28	2025-10-20 18:13:51.52297	Dati stimati biologici - extra grande
269	ottobre	26	3.28	29	2025-10-20 18:13:51.52297	Dati stimati biologici - extra grande
270	ottobre	27	3.075	30	2025-10-20 18:13:51.52297	Dati stimati biologici - taglia massima
271	novembre	2	2.16	27	2025-10-20 18:13:51.52297	Dati stimati biologici - naissain crescita rapida
272	novembre	3	2	30	2025-10-20 18:13:51.52297	Dati stimati biologici - seme piccolo
273	novembre	4	2	32	2025-10-20 18:13:51.52297	Dati stimati biologici - seme piccolo
274	novembre	5	2	34	2025-10-20 18:13:51.52297	Dati stimati biologici - seme medio
275	novembre	1	1.84	36	2025-10-20 18:13:51.52297	Dati stimati biologici - pre-commerciale
276	novembre	6	1.84	37	2025-10-20 18:13:51.52297	Dati stimati biologici - pre-commerciale
277	novembre	7	1.84	38	2025-10-20 18:13:51.52297	Dati stimati biologici - pre-commerciale
278	novembre	8	1.76	39	2025-10-20 18:13:51.52297	Dati stimati biologici
279	novembre	9	1.76	38	2025-10-20 18:13:51.52297	Dati stimati biologici
280	novembre	10	1.76	37	2025-10-20 18:13:51.52297	Dati stimati biologici
281	novembre	11	1.76	35	2025-10-20 18:13:51.52297	Dati stimati biologici
282	novembre	12	1.68	33	2025-10-20 18:13:51.52297	Dati stimati biologici
283	novembre	13	1.68	32	2025-10-20 18:13:51.52297	Dati stimati biologici
284	novembre	14	1.68	30	2025-10-20 18:13:51.52297	Dati stimati biologici
285	novembre	15	1.6	29	2025-10-20 18:13:51.52297	Dati stimati biologici - taglia riferimento
286	novembre	16	1.6	28	2025-10-20 18:13:51.52297	Dati stimati biologici - taglia riferimento
287	novembre	17	1.52	27	2025-10-20 18:13:51.52297	Dati stimati biologici - commerciale piccola
288	novembre	18	1.52	26	2025-10-20 18:13:51.52297	Dati stimati biologici - commerciale piccola
289	novembre	19	1.52	25	2025-10-20 18:13:51.52297	Dati stimati biologici - commerciale piccola
290	novembre	20	1.44	24	2025-10-20 18:13:51.52297	Dati stimati biologici - commerciale media
291	novembre	21	1.44	23	2025-10-20 18:13:51.52297	Dati stimati biologici - commerciale media
292	novembre	22	1.44	22	2025-10-20 18:13:51.52297	Dati stimati biologici - commerciale media
293	novembre	23	1.36	24	2025-10-20 18:13:51.52297	Dati stimati biologici - commerciale grande
294	novembre	24	1.36	25	2025-10-20 18:13:51.52297	Dati stimati biologici - commerciale grande
295	novembre	25	1.28	26	2025-10-20 18:13:51.52297	Dati stimati biologici - extra grande
296	novembre	26	1.28	27	2025-10-20 18:13:51.52297	Dati stimati biologici - extra grande
297	novembre	27	1.2	28	2025-10-20 18:13:51.52297	Dati stimati biologici - taglia massima
298	dicembre	2	1.08	26	2025-10-20 18:13:51.52297	Dati stimati biologici - naissain crescita rapida
299	dicembre	3	1	29	2025-10-20 18:13:51.52297	Dati stimati biologici - seme piccolo
300	dicembre	4	1	31	2025-10-20 18:13:51.52297	Dati stimati biologici - seme piccolo
301	dicembre	5	1	33	2025-10-20 18:13:51.52297	Dati stimati biologici - seme medio
302	dicembre	1	0.92	35	2025-10-20 18:13:51.52297	Dati stimati biologici - pre-commerciale
303	dicembre	6	0.92	36	2025-10-20 18:13:51.52297	Dati stimati biologici - pre-commerciale
304	dicembre	7	0.92	37	2025-10-20 18:13:51.52297	Dati stimati biologici - pre-commerciale
305	dicembre	8	0.88	38	2025-10-20 18:13:51.52297	Dati stimati biologici
306	dicembre	9	0.88	37	2025-10-20 18:13:51.52297	Dati stimati biologici
307	dicembre	10	0.88	36	2025-10-20 18:13:51.52297	Dati stimati biologici
308	dicembre	11	0.88	34	2025-10-20 18:13:51.52297	Dati stimati biologici
309	dicembre	12	0.84	32	2025-10-20 18:13:51.52297	Dati stimati biologici
310	dicembre	13	0.84	31	2025-10-20 18:13:51.52297	Dati stimati biologici
311	dicembre	14	0.84	29	2025-10-20 18:13:51.52297	Dati stimati biologici
312	dicembre	15	0.8	28	2025-10-20 18:13:51.52297	Dati stimati biologici - taglia riferimento
313	dicembre	16	0.8	27	2025-10-20 18:13:51.52297	Dati stimati biologici - taglia riferimento
314	dicembre	17	0.76	26	2025-10-20 18:13:51.52297	Dati stimati biologici - commerciale piccola
315	dicembre	18	0.76	25	2025-10-20 18:13:51.52297	Dati stimati biologici - commerciale piccola
316	dicembre	19	0.76	24	2025-10-20 18:13:51.52297	Dati stimati biologici - commerciale piccola
317	dicembre	20	0.72	23	2025-10-20 18:13:51.52297	Dati stimati biologici - commerciale media
318	dicembre	21	0.72	22	2025-10-20 18:13:51.52297	Dati stimati biologici - commerciale media
319	dicembre	22	0.72	21	2025-10-20 18:13:51.52297	Dati stimati biologici - commerciale media
320	dicembre	23	0.68	23	2025-10-20 18:13:51.52297	Dati stimati biologici - commerciale grande
321	dicembre	24	0.68	24	2025-10-20 18:13:51.52297	Dati stimati biologici - commerciale grande
322	dicembre	25	0.64	25	2025-10-20 18:13:51.52297	Dati stimati biologici - extra grande
323	dicembre	26	0.64	26	2025-10-20 18:13:51.52297	Dati stimati biologici - extra grande
324	dicembre	27	0.6	27	2025-10-20 18:13:51.52297	Dati stimati biologici - taglia massima
\.


--
-- TOC entry 4155 (class 0 OID 16906)
-- Dependencies: 292
-- Data for Name: sizes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sizes (id, code, name, size_mm, min_animals_per_kg, max_animals_per_kg, notes, color) FROM stdin;
11	TP-1260	TP-1260	\N	300001	350000		#f472b6
13	TP-1800	TP-1800	\N	120001	190000		#c084fc
14	TP-1900	TP-1900	\N	97001	120000		#93c5fd
20	TP-4500	TP-4500	\N	9001	13000		#fbbf24
22	TP-5500	TP-5500	\N	3901	6000		#fb923c
23	TP-6000	TP-6000	\N	3001	3900		#a5f3fc
24	TP-7000	TP-7000	\N	2301	3000		#bbf7d0
25	TP-8000	TP-8000	\N	1801	2300		#fef08a
26	TP-9000	TP-9000	\N	1201	1800		#fed7aa
27	TP-10000	TP-10000	\N	801	1200		#fecaca
21	TP-5000	TP-5000	9	6001	9000	da misurazioni sul FLUPSY	#fdba74
3	TP-250	TP-250	0.25	30000001	70000000	da medie ponderate storico campionamenti Ca Pisani	#818cf8
2	TP-180	TP-180	0	70000001	100000000	Taglia tabellare 	#a78bfa
19	TP-4000	TP-4000	8	13001	15000		#fde047
28	TP-2800	TP-2800	0	29001	40000		\N
16	TP-2500	TP-2500	5	40001	70000	da misurazioni sul FLUPSY	#5eead4
8	TP-800	TP-800	1	880001	1000000	da medie ponderate storico campionamenti Ca Pisani	#facc15
12	TP-1500	TP-1500	3	190001	300000	da misurazioni sul FLUPSY	#e879f9
15	TP-2000	TP-2000	4	70001	97000	da misurazioni sul FLUPSY	#67e8f9
17	TP-3000	TP-3000	6.5	20001	29000	da misurazioni sul FLUPSY	#86efac
18	TP-3500	TP-3500	7	15001	20000	da misurazioni sul FLUPSY	#bef264
10	TP-1140	TP-1140	0	350001	600000		#f87171
7	TP-700	TP-700	0.9	1000001	1900000	da medie ponderate storico campionamenti Ca Pisani	#a3e635
9	TP-1000	TP-1000	1.2	600001	880000		\N
6	TP-600	TP-600	0.85	1900001	2000000	da medie ponderate storico campionamenti Ca Pisani	#4ade80
1	TP-500	TP-500	0.8	2000001	8000000	da medie ponderate storico campionamenti Ca Pisani	#6366f1
5	TP-450	TP-450	0.45	8000001	15000000	da medie ponderate storico campionamenti Ca Pisani	#2dd4bf
29	TP-350	TP-350	0.39	15000001	20000000	da medie ponderate storico campionamenti Ca Pisani	\N
4	TP-300	TP-300	0.35	20000001	30000000	da medie ponderate storico campionamenti Ca Pisani	#60a5fa
\.


--
-- TOC entry 4157 (class 0 OID 16917)
-- Dependencies: 294
-- Data for Name: sync_status; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sync_status (id, table_name, last_sync_at, last_sync_success, sync_in_progress, record_count, error_message, created_at, updated_at) FROM stdin;
7	external_deliveries_sync	\N	t	f	0	\N	2025-10-07 13:12:24.124451	2025-11-07 12:15:37.953797
18	external_delivery_details_sync	\N	t	f	0	\N	2025-10-07 13:36:46.459074	2025-11-07 12:15:42.411241
1	external_customers_sync	\N	t	f	0	\N	2025-10-07 13:04:45.671569	2025-11-07 12:15:42.513779
2	external_sales_sync	\N	t	f	0	\N	2025-10-07 13:04:54.54573	2025-11-07 12:15:42.535153
\.


--
-- TOC entry 4159 (class 0 OID 16933)
-- Dependencies: 296
-- Data for Name: target_size_annotations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.target_size_annotations (id, basket_id, target_size_id, predicted_date, status, reached_date, notes, created_at, updated_at) FROM stdin;
1	21	19	2025-12-02	pending	\N	\N	2025-12-02 00:00:04.065702	\N
2	91	16	2025-12-02	pending	\N	\N	2025-12-02 00:00:06.441903	\N
3	22	19	2025-12-02	pending	\N	\N	2025-12-02 00:00:17.04188	\N
4	83	17	2025-12-02	pending	\N	\N	2025-12-02 00:00:25.042316	\N
5	86	17	2025-12-02	pending	\N	\N	2025-12-02 00:00:26.642328	\N
6	94	17	2025-12-02	pending	\N	\N	2025-12-02 00:00:28.644289	\N
7	3	17	2025-12-02	pending	\N	\N	2025-12-02 00:00:30.64404	\N
8	24	17	2025-12-02	pending	\N	\N	2025-12-02 00:00:32.642278	\N
9	88	17	2025-12-02	pending	\N	\N	2025-12-02 00:00:38.242342	\N
10	26	17	2025-12-02	pending	\N	\N	2025-12-02 00:00:40.542219	\N
11	27	17	2025-12-02	pending	\N	\N	2025-12-02 00:00:42.342308	\N
12	31	16	2025-12-02	pending	\N	\N	2025-12-02 00:00:50.343791	\N
13	32	15	2025-12-02	pending	\N	\N	2025-12-02 00:00:52.643946	\N
14	33	15	2025-12-02	pending	\N	\N	2025-12-02 00:00:55.063326	\N
15	38	16	2025-12-02	pending	\N	\N	2025-12-02 00:01:05.142343	\N
16	39	16	2025-12-02	pending	\N	\N	2025-12-02 00:01:07.342484	\N
17	104	7	2025-12-02	pending	\N	\N	2025-12-02 00:01:16.142207	\N
18	89	16	2025-12-02	pending	\N	\N	2025-12-02 00:01:21.963475	\N
19	123	12	2025-12-02	pending	\N	\N	2025-12-02 00:01:31.642256	\N
20	124	12	2025-12-02	pending	\N	\N	2025-12-02 00:01:33.645498	\N
21	97	9	2025-12-02	pending	\N	\N	2025-12-02 00:01:37.142411	\N
22	106	7	2025-12-02	pending	\N	\N	2025-12-02 00:01:42.942287	\N
23	108	7	2025-12-02	pending	\N	\N	2025-12-02 00:01:44.742415	\N
24	103	7	2025-12-02	pending	\N	\N	2025-12-02 00:01:46.542638	\N
25	115	9	2025-12-02	pending	\N	\N	2025-12-02 00:01:47.942279	\N
26	116	9	2025-12-02	pending	\N	\N	2025-12-02 00:01:49.242217	\N
27	107	9	2025-12-02	pending	\N	\N	2025-12-02 00:01:51.34366	\N
28	117	15	2025-12-02	pending	\N	\N	2025-12-02 00:01:53.161906	\N
29	118	15	2025-12-02	pending	\N	\N	2025-12-02 00:01:54.642273	\N
30	92	17	2025-12-02	pending	\N	\N	2025-12-02 00:01:56.242183	\N
31	120	16	2025-12-02	pending	\N	\N	2025-12-02 00:01:58.163514	\N
\.


--
-- TOC entry 4178 (class 0 OID 786433)
-- Dependencies: 315
-- Data for Name: task_operators; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_operators (id, first_name, last_name, email, phone, role, active, external_app_user_id, created_at, updated_at, notes) FROM stdin;
1	Andrea	Contato			Tecnico	t	\N	2025-11-08 08:48:07.408553	2025-11-08 08:48:16.071	
5	Ever	Lago	\N	\N	\N	t	\N	2025-11-08 09:18:25.654419	\N	\N
6	Davide 	Boscolo	\N	\N	\N	t	\N	2025-11-08 09:18:37.346741	\N	\N
7	Gianluca	XX	\N	\N	\N	t	\N	2025-11-08 09:18:52.920025	2025-11-10 19:17:38.96	\N
8	Mauro	Dr. Patella	\N	\N	\N	t	\N	2025-11-10 19:18:01.3262	\N	\N
4	Diego 	Falconi	\N	\N	\N	t	\N	2025-11-08 09:18:11.822405	2025-11-10 19:20:10.782	\N
9	Luca	Dr. Ferrarese	\N	\N	\N	t	\N	2025-11-10 19:20:35.580575	\N	\N
10	Gianluigi	Lago	lago.gianluigi@gmail.com	+393484105353	fac totum	t	\N	2025-11-10 19:21:02.435645	\N	\N
11	Paola	Dr.sa Landri	paola.landri@gmail.com	\N	CEO	t	\N	2025-11-10 19:21:39.450273	\N	\N
\.


--
-- TOC entry 4161 (class 0 OID 16944)
-- Dependencies: 298
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, password, role, language, last_login, created_at) FROM stdin;
2	Gianluigi	$2b$10$qndfrNk0912zVUAQ5Z/c2ejj19oQ.GuTD7zatPtuJXwf2ZtCxRuzW	admin	it	2025-12-05 17:50:54.045	2025-10-08 16:36:51.390647
1	operatore_base_2024	$2b$10$xEaO6P3hEY0UW5/zBIfZmuIz2p6OHIQgGy2gGVJRt3zQCfLC/yPuC	user	it	2025-12-06 09:09:19.185	2025-10-08 16:30:49.135692
3	admin	$2b$10$Wx/sehijeI268hX2GAse.O8LVOcu.q0dWcU04d4p0tyBxxLKE.qRS	admin	it	\N	2025-10-20 17:01:46.520269
4	operatore1	$2b$10$Wx/sehijeI268hX2GAse.O8LVOcu.q0dWcU04d4p0tyBxxLKE.qRS	user	it	\N	2025-10-20 17:01:46.520269
5	viewer	$2b$10$Wx/sehijeI268hX2GAse.O8LVOcu.q0dWcU04d4p0tyBxxLKE.qRS	visitor	en	\N	2025-10-20 17:01:46.520269
\.


--
-- TOC entry 4272 (class 0 OID 0)
-- Dependencies: 215
-- Name: advanced_sales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.advanced_sales_id_seq', 3, true);


--
-- TOC entry 4273 (class 0 OID 0)
-- Dependencies: 338
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, true);


--
-- TOC entry 4274 (class 0 OID 0)
-- Dependencies: 217
-- Name: bag_allocations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.bag_allocations_id_seq', 1, false);


--
-- TOC entry 4275 (class 0 OID 0)
-- Dependencies: 324
-- Name: basket_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.basket_groups_id_seq', 16, true);


--
-- TOC entry 4276 (class 0 OID 0)
-- Dependencies: 303
-- Name: basket_growth_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.basket_growth_profiles_id_seq', 1, false);


--
-- TOC entry 4277 (class 0 OID 0)
-- Dependencies: 219
-- Name: basket_lot_composition_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.basket_lot_composition_id_seq', 18, true);


--
-- TOC entry 4278 (class 0 OID 0)
-- Dependencies: 221
-- Name: baskets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.baskets_id_seq', 130, true);


--
-- TOC entry 4279 (class 0 OID 0)
-- Dependencies: 223
-- Name: clienti_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.clienti_id_seq', 105, true);


--
-- TOC entry 4280 (class 0 OID 0)
-- Dependencies: 225
-- Name: configurazione_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.configurazione_id_seq', 35, true);


--
-- TOC entry 4281 (class 0 OID 0)
-- Dependencies: 227
-- Name: cycles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cycles_id_seq', 97, true);


--
-- TOC entry 4282 (class 0 OID 0)
-- Dependencies: 229
-- Name: ddt_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ddt_id_seq', 1, false);


--
-- TOC entry 4283 (class 0 OID 0)
-- Dependencies: 231
-- Name: ddt_righe_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ddt_righe_id_seq', 1, false);


--
-- TOC entry 4284 (class 0 OID 0)
-- Dependencies: 233
-- Name: email_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.email_config_id_seq', 4, true);


--
-- TOC entry 4285 (class 0 OID 0)
-- Dependencies: 235
-- Name: external_customers_sync_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.external_customers_sync_id_seq', 1, false);


--
-- TOC entry 4286 (class 0 OID 0)
-- Dependencies: 237
-- Name: external_deliveries_sync_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.external_deliveries_sync_id_seq', 1, false);


--
-- TOC entry 4287 (class 0 OID 0)
-- Dependencies: 239
-- Name: external_delivery_details_sync_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.external_delivery_details_sync_id_seq', 1, false);


--
-- TOC entry 4288 (class 0 OID 0)
-- Dependencies: 241
-- Name: external_sales_sync_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.external_sales_sync_id_seq', 1, false);


--
-- TOC entry 4289 (class 0 OID 0)
-- Dependencies: 322
-- Name: external_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.external_users_id_seq', 9, true);


--
-- TOC entry 4290 (class 0 OID 0)
-- Dependencies: 243
-- Name: fatture_in_cloud_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fatture_in_cloud_config_id_seq', 3, true);


--
-- TOC entry 4291 (class 0 OID 0)
-- Dependencies: 245
-- Name: flupsys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.flupsys_id_seq', 2063, true);


--
-- TOC entry 4292 (class 0 OID 0)
-- Dependencies: 301
-- Name: growth_analysis_runs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.growth_analysis_runs_id_seq', 1, true);


--
-- TOC entry 4293 (class 0 OID 0)
-- Dependencies: 307
-- Name: growth_distributions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.growth_distributions_id_seq', 1, false);


--
-- TOC entry 4294 (class 0 OID 0)
-- Dependencies: 328
-- Name: lci_consumables_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lci_consumables_id_seq', 1, false);


--
-- TOC entry 4295 (class 0 OID 0)
-- Dependencies: 330
-- Name: lci_consumption_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lci_consumption_logs_id_seq', 1, false);


--
-- TOC entry 4296 (class 0 OID 0)
-- Dependencies: 326
-- Name: lci_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lci_materials_id_seq', 1, false);


--
-- TOC entry 4297 (class 0 OID 0)
-- Dependencies: 332
-- Name: lci_production_snapshots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lci_production_snapshots_id_seq', 1, false);


--
-- TOC entry 4298 (class 0 OID 0)
-- Dependencies: 334
-- Name: lci_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lci_reports_id_seq', 1, false);


--
-- TOC entry 4299 (class 0 OID 0)
-- Dependencies: 336
-- Name: lci_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lci_settings_id_seq', 3, true);


--
-- TOC entry 4300 (class 0 OID 0)
-- Dependencies: 247
-- Name: lot_inventory_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lot_inventory_transactions_id_seq', 1, false);


--
-- TOC entry 4301 (class 0 OID 0)
-- Dependencies: 249
-- Name: lot_ledger_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lot_ledger_id_seq', 108, true);


--
-- TOC entry 4302 (class 0 OID 0)
-- Dependencies: 251
-- Name: lot_mortality_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lot_mortality_records_id_seq', 1, true);


--
-- TOC entry 4303 (class 0 OID 0)
-- Dependencies: 253
-- Name: lots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lots_id_seq', 12, true);


--
-- TOC entry 4304 (class 0 OID 0)
-- Dependencies: 255
-- Name: mortality_rates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.mortality_rates_id_seq', 1, false);


--
-- TOC entry 4305 (class 0 OID 0)
-- Dependencies: 257
-- Name: notification_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notification_settings_id_seq', 4, true);


--
-- TOC entry 4306 (class 0 OID 0)
-- Dependencies: 259
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 43, true);


--
-- TOC entry 4307 (class 0 OID 0)
-- Dependencies: 261
-- Name: operations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.operations_id_seq', 130, true);


--
-- TOC entry 4308 (class 0 OID 0)
-- Dependencies: 310
-- Name: ordini_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ordini_id_seq', 10, true);


--
-- TOC entry 4309 (class 0 OID 0)
-- Dependencies: 312
-- Name: ordini_righe_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ordini_righe_id_seq', 155, true);


--
-- TOC entry 4310 (class 0 OID 0)
-- Dependencies: 263
-- Name: sale_bags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sale_bags_id_seq', 1, false);


--
-- TOC entry 4311 (class 0 OID 0)
-- Dependencies: 265
-- Name: sale_operations_ref_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sale_operations_ref_id_seq', 6, true);


--
-- TOC entry 4312 (class 0 OID 0)
-- Dependencies: 267
-- Name: screening_basket_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.screening_basket_history_id_seq', 1, false);


--
-- TOC entry 4313 (class 0 OID 0)
-- Dependencies: 269
-- Name: screening_destination_baskets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.screening_destination_baskets_id_seq', 1, false);


--
-- TOC entry 4314 (class 0 OID 0)
-- Dependencies: 305
-- Name: screening_impact_analysis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.screening_impact_analysis_id_seq', 1, false);


--
-- TOC entry 4315 (class 0 OID 0)
-- Dependencies: 271
-- Name: screening_lot_references_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.screening_lot_references_id_seq', 1, false);


--
-- TOC entry 4316 (class 0 OID 0)
-- Dependencies: 273
-- Name: screening_operations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.screening_operations_id_seq', 1, false);


--
-- TOC entry 4317 (class 0 OID 0)
-- Dependencies: 275
-- Name: screening_source_baskets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.screening_source_baskets_id_seq', 1, false);


--
-- TOC entry 4318 (class 0 OID 0)
-- Dependencies: 277
-- Name: selection_basket_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.selection_basket_history_id_seq', 45, true);


--
-- TOC entry 4319 (class 0 OID 0)
-- Dependencies: 279
-- Name: selection_destination_baskets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.selection_destination_baskets_id_seq', 19, true);


--
-- TOC entry 4320 (class 0 OID 0)
-- Dependencies: 281
-- Name: selection_lot_references_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.selection_lot_references_id_seq', 1, false);


--
-- TOC entry 4321 (class 0 OID 0)
-- Dependencies: 283
-- Name: selection_source_baskets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.selection_source_baskets_id_seq', 38, true);


--
-- TOC entry 4322 (class 0 OID 0)
-- Dependencies: 320
-- Name: selection_task_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.selection_task_assignments_id_seq', 35, true);


--
-- TOC entry 4323 (class 0 OID 0)
-- Dependencies: 318
-- Name: selection_task_baskets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.selection_task_baskets_id_seq', 55, true);


--
-- TOC entry 4324 (class 0 OID 0)
-- Dependencies: 316
-- Name: selection_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.selection_tasks_id_seq', 20, true);


--
-- TOC entry 4325 (class 0 OID 0)
-- Dependencies: 285
-- Name: selections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.selections_id_seq', 13, true);


--
-- TOC entry 4326 (class 0 OID 0)
-- Dependencies: 289
-- Name: sgr_giornalieri_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sgr_giornalieri_id_seq', 1, true);


--
-- TOC entry 4327 (class 0 OID 0)
-- Dependencies: 287
-- Name: sgr_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sgr_id_seq', 60, true);


--
-- TOC entry 4328 (class 0 OID 0)
-- Dependencies: 299
-- Name: sgr_per_taglia_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sgr_per_taglia_id_seq', 324, true);


--
-- TOC entry 4329 (class 0 OID 0)
-- Dependencies: 291
-- Name: sizes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sizes_id_seq', 39, true);


--
-- TOC entry 4330 (class 0 OID 0)
-- Dependencies: 293
-- Name: sync_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sync_status_id_seq', 50, true);


--
-- TOC entry 4331 (class 0 OID 0)
-- Dependencies: 295
-- Name: target_size_annotations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.target_size_annotations_id_seq', 31, true);


--
-- TOC entry 4332 (class 0 OID 0)
-- Dependencies: 314
-- Name: task_operators_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.task_operators_id_seq', 11, true);


--
-- TOC entry 4333 (class 0 OID 0)
-- Dependencies: 297
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- TOC entry 3719 (class 2606 OID 16489)
-- Name: advanced_sales advanced_sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advanced_sales
    ADD CONSTRAINT advanced_sales_pkey PRIMARY KEY (id);


--
-- TOC entry 3721 (class 2606 OID 16491)
-- Name: advanced_sales advanced_sales_sale_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advanced_sales
    ADD CONSTRAINT advanced_sales_sale_number_unique UNIQUE (sale_number);


--
-- TOC entry 3908 (class 2606 OID 1048585)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3723 (class 2606 OID 16500)
-- Name: bag_allocations bag_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bag_allocations
    ADD CONSTRAINT bag_allocations_pkey PRIMARY KEY (id);


--
-- TOC entry 3892 (class 2606 OID 925705)
-- Name: basket_groups basket_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.basket_groups
    ADD CONSTRAINT basket_groups_pkey PRIMARY KEY (id);


--
-- TOC entry 3852 (class 2606 OID 393236)
-- Name: basket_growth_profiles basket_growth_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.basket_growth_profiles
    ADD CONSTRAINT basket_growth_profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 3725 (class 2606 OID 16510)
-- Name: basket_lot_composition basket_lot_composition_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.basket_lot_composition
    ADD CONSTRAINT basket_lot_composition_pkey PRIMARY KEY (id);


--
-- TOC entry 3728 (class 2606 OID 16520)
-- Name: baskets baskets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baskets
    ADD CONSTRAINT baskets_pkey PRIMARY KEY (id);


--
-- TOC entry 3738 (class 2606 OID 16540)
-- Name: clienti clienti_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clienti
    ADD CONSTRAINT clienti_pkey PRIMARY KEY (id);


--
-- TOC entry 3740 (class 2606 OID 16553)
-- Name: configurazione configurazione_chiave_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configurazione
    ADD CONSTRAINT configurazione_chiave_unique UNIQUE (chiave);


--
-- TOC entry 3742 (class 2606 OID 16551)
-- Name: configurazione configurazione_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configurazione
    ADD CONSTRAINT configurazione_pkey PRIMARY KEY (id);


--
-- TOC entry 3744 (class 2606 OID 16563)
-- Name: cycles cycles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cycles
    ADD CONSTRAINT cycles_pkey PRIMARY KEY (id);


--
-- TOC entry 3747 (class 2606 OID 16577)
-- Name: ddt ddt_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ddt
    ADD CONSTRAINT ddt_pkey PRIMARY KEY (id);


--
-- TOC entry 3749 (class 2606 OID 16589)
-- Name: ddt_righe ddt_righe_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ddt_righe
    ADD CONSTRAINT ddt_righe_pkey PRIMARY KEY (id);


--
-- TOC entry 3751 (class 2606 OID 16601)
-- Name: email_config email_config_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_config
    ADD CONSTRAINT email_config_key_unique UNIQUE (key);


--
-- TOC entry 3753 (class 2606 OID 16599)
-- Name: email_config email_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_config
    ADD CONSTRAINT email_config_pkey PRIMARY KEY (id);


--
-- TOC entry 3755 (class 2606 OID 16615)
-- Name: external_customers_sync external_customers_sync_external_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_customers_sync
    ADD CONSTRAINT external_customers_sync_external_id_unique UNIQUE (external_id);


--
-- TOC entry 3757 (class 2606 OID 16613)
-- Name: external_customers_sync external_customers_sync_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_customers_sync
    ADD CONSTRAINT external_customers_sync_pkey PRIMARY KEY (id);


--
-- TOC entry 3759 (class 2606 OID 16627)
-- Name: external_deliveries_sync external_deliveries_sync_external_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_deliveries_sync
    ADD CONSTRAINT external_deliveries_sync_external_id_unique UNIQUE (external_id);


--
-- TOC entry 3761 (class 2606 OID 16625)
-- Name: external_deliveries_sync external_deliveries_sync_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_deliveries_sync
    ADD CONSTRAINT external_deliveries_sync_pkey PRIMARY KEY (id);


--
-- TOC entry 3763 (class 2606 OID 16639)
-- Name: external_delivery_details_sync external_delivery_details_sync_external_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_delivery_details_sync
    ADD CONSTRAINT external_delivery_details_sync_external_id_unique UNIQUE (external_id);


--
-- TOC entry 3765 (class 2606 OID 16637)
-- Name: external_delivery_details_sync external_delivery_details_sync_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_delivery_details_sync
    ADD CONSTRAINT external_delivery_details_sync_pkey PRIMARY KEY (id);


--
-- TOC entry 3767 (class 2606 OID 16657)
-- Name: external_sales_sync external_sales_sync_external_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_sales_sync
    ADD CONSTRAINT external_sales_sync_external_id_unique UNIQUE (external_id);


--
-- TOC entry 3769 (class 2606 OID 16655)
-- Name: external_sales_sync external_sales_sync_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_sales_sync
    ADD CONSTRAINT external_sales_sync_pkey PRIMARY KEY (id);


--
-- TOC entry 3882 (class 2606 OID 811022)
-- Name: external_users external_users_delta_operator_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_users
    ADD CONSTRAINT external_users_delta_operator_id_key UNIQUE (delta_operator_id);


--
-- TOC entry 3884 (class 2606 OID 811020)
-- Name: external_users external_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_users
    ADD CONSTRAINT external_users_pkey PRIMARY KEY (id);


--
-- TOC entry 3886 (class 2606 OID 811024)
-- Name: external_users external_users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_users
    ADD CONSTRAINT external_users_username_key UNIQUE (username);


--
-- TOC entry 3771 (class 2606 OID 16675)
-- Name: fatture_in_cloud_config fatture_in_cloud_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fatture_in_cloud_config
    ADD CONSTRAINT fatture_in_cloud_config_pkey PRIMARY KEY (id);


--
-- TOC entry 3773 (class 2606 OID 16686)
-- Name: flupsys flupsys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flupsys
    ADD CONSTRAINT flupsys_pkey PRIMARY KEY (id);


--
-- TOC entry 3850 (class 2606 OID 393226)
-- Name: growth_analysis_runs growth_analysis_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_analysis_runs
    ADD CONSTRAINT growth_analysis_runs_pkey PRIMARY KEY (id);


--
-- TOC entry 3856 (class 2606 OID 393256)
-- Name: growth_distributions growth_distributions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_distributions
    ADD CONSTRAINT growth_distributions_pkey PRIMARY KEY (id);


--
-- TOC entry 3896 (class 2606 OID 1024023)
-- Name: lci_consumables lci_consumables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lci_consumables
    ADD CONSTRAINT lci_consumables_pkey PRIMARY KEY (id);


--
-- TOC entry 3898 (class 2606 OID 1024034)
-- Name: lci_consumption_logs lci_consumption_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lci_consumption_logs
    ADD CONSTRAINT lci_consumption_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3894 (class 2606 OID 1024012)
-- Name: lci_materials lci_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lci_materials
    ADD CONSTRAINT lci_materials_pkey PRIMARY KEY (id);


--
-- TOC entry 3900 (class 2606 OID 1024045)
-- Name: lci_production_snapshots lci_production_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lci_production_snapshots
    ADD CONSTRAINT lci_production_snapshots_pkey PRIMARY KEY (id);


--
-- TOC entry 3902 (class 2606 OID 1024056)
-- Name: lci_reports lci_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lci_reports
    ADD CONSTRAINT lci_reports_pkey PRIMARY KEY (id);


--
-- TOC entry 3904 (class 2606 OID 1024068)
-- Name: lci_settings lci_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lci_settings
    ADD CONSTRAINT lci_settings_key_key UNIQUE (key);


--
-- TOC entry 3906 (class 2606 OID 1024066)
-- Name: lci_settings lci_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lci_settings
    ADD CONSTRAINT lci_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 3776 (class 2606 OID 16696)
-- Name: lot_inventory_transactions lot_inventory_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lot_inventory_transactions
    ADD CONSTRAINT lot_inventory_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 3778 (class 2606 OID 16709)
-- Name: lot_ledger lot_ledger_idempotency_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lot_ledger
    ADD CONSTRAINT lot_ledger_idempotency_key_unique UNIQUE (idempotency_key);


--
-- TOC entry 3780 (class 2606 OID 16707)
-- Name: lot_ledger lot_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lot_ledger
    ADD CONSTRAINT lot_ledger_pkey PRIMARY KEY (id);


--
-- TOC entry 3782 (class 2606 OID 16720)
-- Name: lot_mortality_records lot_mortality_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lot_mortality_records
    ADD CONSTRAINT lot_mortality_records_pkey PRIMARY KEY (id);


--
-- TOC entry 3784 (class 2606 OID 16733)
-- Name: lots lots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lots
    ADD CONSTRAINT lots_pkey PRIMARY KEY (id);


--
-- TOC entry 3786 (class 2606 OID 16742)
-- Name: mortality_rates mortality_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mortality_rates
    ADD CONSTRAINT mortality_rates_pkey PRIMARY KEY (id);


--
-- TOC entry 3788 (class 2606 OID 16753)
-- Name: notification_settings notification_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 3791 (class 2606 OID 16764)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 3801 (class 2606 OID 16773)
-- Name: operations operations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operations
    ADD CONSTRAINT operations_pkey PRIMARY KEY (id);


--
-- TOC entry 3858 (class 2606 OID 434188)
-- Name: operators operators_operator_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operators
    ADD CONSTRAINT operators_operator_id_key UNIQUE (operator_id);


--
-- TOC entry 3860 (class 2606 OID 434186)
-- Name: operators operators_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operators
    ADD CONSTRAINT operators_pkey PRIMARY KEY (id);


--
-- TOC entry 3862 (class 2606 OID 540685)
-- Name: ordini ordini_fatture_in_cloud_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordini
    ADD CONSTRAINT ordini_fatture_in_cloud_id_key UNIQUE (fatture_in_cloud_id);


--
-- TOC entry 3864 (class 2606 OID 540683)
-- Name: ordini ordini_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordini
    ADD CONSTRAINT ordini_pkey PRIMARY KEY (id);


--
-- TOC entry 3866 (class 2606 OID 540699)
-- Name: ordini_righe ordini_righe_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordini_righe
    ADD CONSTRAINT ordini_righe_pkey PRIMARY KEY (id);


--
-- TOC entry 3803 (class 2606 OID 16784)
-- Name: sale_bags sale_bags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_bags
    ADD CONSTRAINT sale_bags_pkey PRIMARY KEY (id);


--
-- TOC entry 3805 (class 2606 OID 16792)
-- Name: sale_operations_ref sale_operations_ref_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_operations_ref
    ADD CONSTRAINT sale_operations_ref_pkey PRIMARY KEY (id);


--
-- TOC entry 3807 (class 2606 OID 16800)
-- Name: screening_basket_history screening_basket_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_basket_history
    ADD CONSTRAINT screening_basket_history_pkey PRIMARY KEY (id);


--
-- TOC entry 3809 (class 2606 OID 16811)
-- Name: screening_destination_baskets screening_destination_baskets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_destination_baskets
    ADD CONSTRAINT screening_destination_baskets_pkey PRIMARY KEY (id);


--
-- TOC entry 3854 (class 2606 OID 393246)
-- Name: screening_impact_analysis screening_impact_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_impact_analysis
    ADD CONSTRAINT screening_impact_analysis_pkey PRIMARY KEY (id);


--
-- TOC entry 3811 (class 2606 OID 16819)
-- Name: screening_lot_references screening_lot_references_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_lot_references
    ADD CONSTRAINT screening_lot_references_pkey PRIMARY KEY (id);


--
-- TOC entry 3813 (class 2606 OID 16830)
-- Name: screening_operations screening_operations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_operations
    ADD CONSTRAINT screening_operations_pkey PRIMARY KEY (id);


--
-- TOC entry 3815 (class 2606 OID 16840)
-- Name: screening_source_baskets screening_source_baskets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_source_baskets
    ADD CONSTRAINT screening_source_baskets_pkey PRIMARY KEY (id);


--
-- TOC entry 3817 (class 2606 OID 16848)
-- Name: selection_basket_history selection_basket_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_basket_history
    ADD CONSTRAINT selection_basket_history_pkey PRIMARY KEY (id);


--
-- TOC entry 3819 (class 2606 OID 16858)
-- Name: selection_destination_baskets selection_destination_baskets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_destination_baskets
    ADD CONSTRAINT selection_destination_baskets_pkey PRIMARY KEY (id);


--
-- TOC entry 3821 (class 2606 OID 16866)
-- Name: selection_lot_references selection_lot_references_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_lot_references
    ADD CONSTRAINT selection_lot_references_pkey PRIMARY KEY (id);


--
-- TOC entry 3823 (class 2606 OID 16874)
-- Name: selection_source_baskets selection_source_baskets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_source_baskets
    ADD CONSTRAINT selection_source_baskets_pkey PRIMARY KEY (id);


--
-- TOC entry 3880 (class 2606 OID 786496)
-- Name: selection_task_assignments selection_task_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_task_assignments
    ADD CONSTRAINT selection_task_assignments_pkey PRIMARY KEY (id);


--
-- TOC entry 3874 (class 2606 OID 786474)
-- Name: selection_task_baskets selection_task_baskets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_task_baskets
    ADD CONSTRAINT selection_task_baskets_pkey PRIMARY KEY (id);


--
-- TOC entry 3872 (class 2606 OID 786458)
-- Name: selection_tasks selection_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_tasks
    ADD CONSTRAINT selection_tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 3828 (class 2606 OID 16885)
-- Name: selections selections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selections
    ADD CONSTRAINT selections_pkey PRIMARY KEY (id);


--
-- TOC entry 3832 (class 2606 OID 16904)
-- Name: sgr_giornalieri sgr_giornalieri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sgr_giornalieri
    ADD CONSTRAINT sgr_giornalieri_pkey PRIMARY KEY (id);


--
-- TOC entry 3848 (class 2606 OID 352266)
-- Name: sgr_per_taglia sgr_per_taglia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sgr_per_taglia
    ADD CONSTRAINT sgr_per_taglia_pkey PRIMARY KEY (id);


--
-- TOC entry 3830 (class 2606 OID 16895)
-- Name: sgr sgr_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sgr
    ADD CONSTRAINT sgr_pkey PRIMARY KEY (id);


--
-- TOC entry 3834 (class 2606 OID 16915)
-- Name: sizes sizes_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sizes
    ADD CONSTRAINT sizes_code_unique UNIQUE (code);


--
-- TOC entry 3836 (class 2606 OID 16913)
-- Name: sizes sizes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sizes
    ADD CONSTRAINT sizes_pkey PRIMARY KEY (id);


--
-- TOC entry 3838 (class 2606 OID 16929)
-- Name: sync_status sync_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_status
    ADD CONSTRAINT sync_status_pkey PRIMARY KEY (id);


--
-- TOC entry 3840 (class 2606 OID 16931)
-- Name: sync_status sync_status_table_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_status
    ADD CONSTRAINT sync_status_table_name_unique UNIQUE (table_name);


--
-- TOC entry 3842 (class 2606 OID 16942)
-- Name: target_size_annotations target_size_annotations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.target_size_annotations
    ADD CONSTRAINT target_size_annotations_pkey PRIMARY KEY (id);


--
-- TOC entry 3868 (class 2606 OID 786444)
-- Name: task_operators task_operators_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_operators
    ADD CONSTRAINT task_operators_email_key UNIQUE (email);


--
-- TOC entry 3870 (class 2606 OID 786442)
-- Name: task_operators task_operators_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_operators
    ADD CONSTRAINT task_operators_pkey PRIMARY KEY (id);


--
-- TOC entry 3844 (class 2606 OID 16954)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3846 (class 2606 OID 16956)
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- TOC entry 3726 (class 1259 OID 376832)
-- Name: baskets_flupsy_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX baskets_flupsy_id_idx ON public.baskets USING btree (flupsy_id);


--
-- TOC entry 3745 (class 1259 OID 376833)
-- Name: cycles_state_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cycles_state_idx ON public.cycles USING btree (state);


--
-- TOC entry 3909 (class 1259 OID 1048588)
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- TOC entry 3910 (class 1259 OID 1048587)
-- Name: idx_audit_logs_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);


--
-- TOC entry 3911 (class 1259 OID 1048586)
-- Name: idx_audit_logs_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs USING btree ("timestamp" DESC);


--
-- TOC entry 3729 (class 1259 OID 385034)
-- Name: idx_baskets_current_cycle_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_baskets_current_cycle_id ON public.baskets USING btree (current_cycle_id);


--
-- TOC entry 3730 (class 1259 OID 385035)
-- Name: idx_baskets_cycle_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_baskets_cycle_code ON public.baskets USING btree (cycle_code);


--
-- TOC entry 3731 (class 1259 OID 385024)
-- Name: idx_baskets_flupsy_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_baskets_flupsy_id ON public.baskets USING btree (flupsy_id);


--
-- TOC entry 3732 (class 1259 OID 385026)
-- Name: idx_baskets_flupsy_position; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_baskets_flupsy_position ON public.baskets USING btree (flupsy_id, "row", "position");


--
-- TOC entry 3733 (class 1259 OID 385038)
-- Name: idx_baskets_flupsy_state_cycle; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_baskets_flupsy_state_cycle ON public.baskets USING btree (flupsy_id, state, current_cycle_id);


--
-- TOC entry 3734 (class 1259 OID 385036)
-- Name: idx_baskets_physical_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_baskets_physical_number ON public.baskets USING btree (physical_number);


--
-- TOC entry 3735 (class 1259 OID 385028)
-- Name: idx_baskets_position_not_null; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_baskets_position_not_null ON public.baskets USING btree (flupsy_id, "row", "position") WHERE ("position" IS NOT NULL);


--
-- TOC entry 3736 (class 1259 OID 385025)
-- Name: idx_baskets_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_baskets_state ON public.baskets USING btree (state);


--
-- TOC entry 3887 (class 1259 OID 811027)
-- Name: idx_external_users_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_external_users_active ON public.external_users USING btree (is_active);


--
-- TOC entry 3888 (class 1259 OID 811025)
-- Name: idx_external_users_delta_operator; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_external_users_delta_operator ON public.external_users USING btree (delta_operator_id);


--
-- TOC entry 3889 (class 1259 OID 811026)
-- Name: idx_external_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_external_users_email ON public.external_users USING btree (email);


--
-- TOC entry 3890 (class 1259 OID 811028)
-- Name: idx_external_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_external_users_username ON public.external_users USING btree (username);


--
-- TOC entry 3774 (class 1259 OID 385027)
-- Name: idx_flupsys_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_flupsys_active ON public.flupsys USING btree (active);


--
-- TOC entry 3792 (class 1259 OID 385031)
-- Name: idx_operations_basket_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_operations_basket_id ON public.operations USING btree (basket_id);


--
-- TOC entry 3793 (class 1259 OID 385037)
-- Name: idx_operations_basket_id_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_operations_basket_id_id ON public.operations USING btree (basket_id, id);


--
-- TOC entry 3794 (class 1259 OID 385032)
-- Name: idx_operations_cycle_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_operations_cycle_id ON public.operations USING btree (cycle_id);


--
-- TOC entry 3795 (class 1259 OID 385029)
-- Name: idx_operations_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_operations_date ON public.operations USING btree (date);


--
-- TOC entry 3796 (class 1259 OID 385033)
-- Name: idx_operations_lot_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_operations_lot_id ON public.operations USING btree (lot_id);


--
-- TOC entry 3797 (class 1259 OID 385030)
-- Name: idx_operations_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_operations_type ON public.operations USING btree (type);


--
-- TOC entry 3875 (class 1259 OID 819203)
-- Name: idx_selection_task_assignments_completed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_selection_task_assignments_completed_at ON public.selection_task_assignments USING btree (completed_at);


--
-- TOC entry 3876 (class 1259 OID 819201)
-- Name: idx_selection_task_assignments_completed_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_selection_task_assignments_completed_by ON public.selection_task_assignments USING btree (completed_by);


--
-- TOC entry 3877 (class 1259 OID 819202)
-- Name: idx_selection_task_assignments_started_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_selection_task_assignments_started_at ON public.selection_task_assignments USING btree (started_at);


--
-- TOC entry 3878 (class 1259 OID 819200)
-- Name: idx_selection_task_assignments_started_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_selection_task_assignments_started_by ON public.selection_task_assignments USING btree (started_by);


--
-- TOC entry 3824 (class 1259 OID 1064961)
-- Name: idx_selections_cross_flupsy; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_selections_cross_flupsy ON public.selections USING btree (is_cross_flupsy) WHERE (is_cross_flupsy = true);


--
-- TOC entry 3825 (class 1259 OID 1064963)
-- Name: idx_selections_destination_flupsy; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_selections_destination_flupsy ON public.selections USING btree (destination_flupsy_id) WHERE (destination_flupsy_id IS NOT NULL);


--
-- TOC entry 3826 (class 1259 OID 1064962)
-- Name: idx_selections_origin_flupsy; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_selections_origin_flupsy ON public.selections USING btree (origin_flupsy_id) WHERE (origin_flupsy_id IS NOT NULL);


--
-- TOC entry 3789 (class 1259 OID 376834)
-- Name: notifications_is_read_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_is_read_idx ON public.notifications USING btree (is_read);


--
-- TOC entry 3798 (class 1259 OID 376835)
-- Name: operations_basket_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX operations_basket_id_idx ON public.operations USING btree (basket_id);


--
-- TOC entry 3799 (class 1259 OID 376836)
-- Name: operations_cycle_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX operations_cycle_id_idx ON public.operations USING btree (cycle_id);


--
-- TOC entry 3934 (class 2620 OID 851969)
-- Name: selection_task_assignments assignment_completion_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER assignment_completion_trigger AFTER INSERT OR UPDATE ON public.selection_task_assignments FOR EACH ROW EXECUTE FUNCTION public.check_task_completion();


--
-- TOC entry 3930 (class 2620 OID 1040385)
-- Name: baskets basket_state_triplet_check; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER basket_state_triplet_check BEFORE UPDATE ON public.baskets FOR EACH ROW EXECUTE FUNCTION public.enforce_basket_state_triplet();


--
-- TOC entry 3933 (class 2620 OID 909318)
-- Name: sizes protect_size_ranges; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER protect_size_ranges BEFORE UPDATE ON public.sizes FOR EACH ROW EXECUTE FUNCTION public.prevent_size_range_modification();


--
-- TOC entry 3931 (class 2620 OID 425985)
-- Name: operations trigger_enrich_mixed_lot_metadata; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_enrich_mixed_lot_metadata BEFORE INSERT ON public.operations FOR EACH ROW EXECUTE FUNCTION public.enrich_mixed_lot_metadata();


--
-- TOC entry 3932 (class 2620 OID 425987)
-- Name: operations trigger_protect_mixed_lot_metadata; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_protect_mixed_lot_metadata BEFORE UPDATE ON public.operations FOR EACH ROW EXECUTE FUNCTION public.protect_mixed_lot_metadata();


--
-- TOC entry 3912 (class 2606 OID 925706)
-- Name: baskets baskets_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baskets
    ADD CONSTRAINT baskets_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.basket_groups(id) ON DELETE SET NULL;


--
-- TOC entry 3913 (class 2606 OID 1032192)
-- Name: cycles cycles_basket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cycles
    ADD CONSTRAINT cycles_basket_id_fkey FOREIGN KEY (basket_id) REFERENCES public.baskets(id) ON DELETE CASCADE;


--
-- TOC entry 3914 (class 2606 OID 909312)
-- Name: operations fk_operations_size; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operations
    ADD CONSTRAINT fk_operations_size FOREIGN KEY (size_id) REFERENCES public.sizes(id) ON DELETE RESTRICT;


--
-- TOC entry 3917 (class 2606 OID 1040396)
-- Name: screening_destination_baskets fk_screening_dest_baskets_basket; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_destination_baskets
    ADD CONSTRAINT fk_screening_dest_baskets_basket FOREIGN KEY (basket_id) REFERENCES public.baskets(id) ON DELETE CASCADE;


--
-- TOC entry 3918 (class 2606 OID 1040401)
-- Name: screening_destination_baskets fk_screening_dest_baskets_cycle; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_destination_baskets
    ADD CONSTRAINT fk_screening_dest_baskets_cycle FOREIGN KEY (cycle_id) REFERENCES public.cycles(id) ON DELETE SET NULL;


--
-- TOC entry 3919 (class 2606 OID 1040386)
-- Name: screening_source_baskets fk_screening_source_baskets_basket; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_source_baskets
    ADD CONSTRAINT fk_screening_source_baskets_basket FOREIGN KEY (basket_id) REFERENCES public.baskets(id) ON DELETE CASCADE;


--
-- TOC entry 3920 (class 2606 OID 1040391)
-- Name: screening_source_baskets fk_screening_source_baskets_cycle; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_source_baskets
    ADD CONSTRAINT fk_screening_source_baskets_cycle FOREIGN KEY (cycle_id) REFERENCES public.cycles(id) ON DELETE SET NULL;


--
-- TOC entry 3921 (class 2606 OID 1040416)
-- Name: selection_destination_baskets fk_selection_dest_baskets_basket; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_destination_baskets
    ADD CONSTRAINT fk_selection_dest_baskets_basket FOREIGN KEY (basket_id) REFERENCES public.baskets(id) ON DELETE CASCADE;


--
-- TOC entry 3922 (class 2606 OID 1040421)
-- Name: selection_destination_baskets fk_selection_dest_baskets_cycle; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_destination_baskets
    ADD CONSTRAINT fk_selection_dest_baskets_cycle FOREIGN KEY (cycle_id) REFERENCES public.cycles(id) ON DELETE SET NULL;


--
-- TOC entry 3923 (class 2606 OID 1040406)
-- Name: selection_source_baskets fk_selection_source_baskets_basket; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_source_baskets
    ADD CONSTRAINT fk_selection_source_baskets_basket FOREIGN KEY (basket_id) REFERENCES public.baskets(id) ON DELETE CASCADE;


--
-- TOC entry 3924 (class 2606 OID 1040411)
-- Name: selection_source_baskets fk_selection_source_baskets_cycle; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_source_baskets
    ADD CONSTRAINT fk_selection_source_baskets_cycle FOREIGN KEY (cycle_id) REFERENCES public.cycles(id) ON DELETE SET NULL;


--
-- TOC entry 3915 (class 2606 OID 1032197)
-- Name: operations operations_basket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operations
    ADD CONSTRAINT operations_basket_id_fkey FOREIGN KEY (basket_id) REFERENCES public.baskets(id) ON DELETE CASCADE;


--
-- TOC entry 3916 (class 2606 OID 1032202)
-- Name: operations operations_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operations
    ADD CONSTRAINT operations_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.cycles(id) ON DELETE CASCADE;


--
-- TOC entry 3928 (class 2606 OID 786502)
-- Name: selection_task_assignments selection_task_assignments_operator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_task_assignments
    ADD CONSTRAINT selection_task_assignments_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES public.task_operators(id) ON DELETE CASCADE;


--
-- TOC entry 3929 (class 2606 OID 786497)
-- Name: selection_task_assignments selection_task_assignments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_task_assignments
    ADD CONSTRAINT selection_task_assignments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.selection_tasks(id) ON DELETE CASCADE;


--
-- TOC entry 3926 (class 2606 OID 786480)
-- Name: selection_task_baskets selection_task_baskets_basket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_task_baskets
    ADD CONSTRAINT selection_task_baskets_basket_id_fkey FOREIGN KEY (basket_id) REFERENCES public.baskets(id) ON DELETE CASCADE;


--
-- TOC entry 3927 (class 2606 OID 786475)
-- Name: selection_task_baskets selection_task_baskets_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_task_baskets
    ADD CONSTRAINT selection_task_baskets_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.selection_tasks(id) ON DELETE CASCADE;


--
-- TOC entry 3925 (class 2606 OID 786459)
-- Name: selection_tasks selection_tasks_selection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_tasks
    ADD CONSTRAINT selection_tasks_selection_id_fkey FOREIGN KEY (selection_id) REFERENCES public.selections(id) ON DELETE CASCADE;


-- Completed on 2025-12-06 16:36:14 UTC

--
-- PostgreSQL database dump complete
--

\unrestrict Vo0rYbkac8hrYKX6SGng6sHWBKBFpsPxpIgKdVp1JMdHVIRqvL8mxyvhrXBX0ha

