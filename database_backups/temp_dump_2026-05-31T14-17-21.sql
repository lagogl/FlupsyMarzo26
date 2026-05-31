--
-- PostgreSQL database dump
--

\restrict fu8FXxzArkAO3NwBeLxNAD3Nvc3ZHNW3ncyzweWEkhjPD8g9E783FoBjDEkm4gu

-- Dumped from database version 16.14 (fce0ac2)
-- Dumped by pg_dump version 16.10

-- Started on 2026-05-31 14:17:21 UTC

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

ALTER TABLE IF EXISTS ONLY public.user_menu_preferences DROP CONSTRAINT IF EXISTS user_menu_preferences_user_id_fkey;
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
ALTER TABLE IF EXISTS ONLY public.environmental_log DROP CONSTRAINT IF EXISTS environmental_log_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cycles DROP CONSTRAINT IF EXISTS cycles_basket_id_fkey;
ALTER TABLE IF EXISTS ONLY public.baskets DROP CONSTRAINT IF EXISTS baskets_group_id_fkey;
DROP TRIGGER IF EXISTS trigger_protect_mixed_lot_metadata ON public.operations;
DROP TRIGGER IF EXISTS trigger_enrich_mixed_lot_metadata ON public.operations;
DROP TRIGGER IF EXISTS protect_size_ranges ON public.sizes;
DROP TRIGGER IF EXISTS basket_state_triplet_check ON public.baskets;
DROP TRIGGER IF EXISTS assignment_completion_trigger ON public.selection_task_assignments;
DROP INDEX IF EXISTS public.pending_closures_destination_idx;
DROP INDEX IF EXISTS public.pending_closures_cycle_id_idx;
DROP INDEX IF EXISTS public.operations_cycle_id_idx;
DROP INDEX IF EXISTS public.operations_basket_id_idx;
DROP INDEX IF EXISTS public.notifications_is_read_idx;
DROP INDEX IF EXISTS public.marine_data_recorded_at_idx;
DROP INDEX IF EXISTS public.imm_snapshots_scope_id_idx;
DROP INDEX IF EXISTS public.imm_snapshots_date_scope_idx;
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
DROP INDEX IF EXISTS public.cycles_parent_cycle_idx;
DROP INDEX IF EXISTS public.cycles_lineage_group_idx;
DROP INDEX IF EXISTS public.baskets_flupsy_id_idx;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_username_unique;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.user_menu_preferences DROP CONSTRAINT IF EXISTS user_menu_preferences_pkey;
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
ALTER TABLE IF EXISTS ONLY public.sales_price_list DROP CONSTRAINT IF EXISTS sales_price_list_size_code_key;
ALTER TABLE IF EXISTS ONLY public.sales_price_list DROP CONSTRAINT IF EXISTS sales_price_list_pkey;
ALTER TABLE IF EXISTS ONLY public.sales_cash_targets DROP CONSTRAINT IF EXISTS sales_cash_targets_year_month_key;
ALTER TABLE IF EXISTS ONLY public.sales_cash_targets DROP CONSTRAINT IF EXISTS sales_cash_targets_pkey;
ALTER TABLE IF EXISTS ONLY public.sale_operations_ref DROP CONSTRAINT IF EXISTS sale_operations_ref_pkey;
ALTER TABLE IF EXISTS ONLY public.sale_bags DROP CONSTRAINT IF EXISTS sale_bags_pkey;
ALTER TABLE IF EXISTS ONLY public.rfid_tags DROP CONSTRAINT IF EXISTS rfid_tags_pkey;
ALTER TABLE IF EXISTS ONLY public.rfid_tags DROP CONSTRAINT IF EXISTS rfid_tags_basket_number_key;
ALTER TABLE IF EXISTS ONLY public.projection_mortality_rates DROP CONSTRAINT IF EXISTS projection_mortality_rates_pkey;
ALTER TABLE IF EXISTS ONLY public.production_targets DROP CONSTRAINT IF EXISTS production_targets_pkey;
ALTER TABLE IF EXISTS ONLY public.pending_closures DROP CONSTRAINT IF EXISTS pending_closures_pkey;
ALTER TABLE IF EXISTS ONLY public.ordini_righe DROP CONSTRAINT IF EXISTS ordini_righe_pkey;
ALTER TABLE IF EXISTS ONLY public.ordini DROP CONSTRAINT IF EXISTS ordini_pkey;
ALTER TABLE IF EXISTS ONLY public.ordini DROP CONSTRAINT IF EXISTS ordini_fatture_in_cloud_id_key;
ALTER TABLE IF EXISTS ONLY public.operators DROP CONSTRAINT IF EXISTS operators_pkey;
ALTER TABLE IF EXISTS ONLY public.operators DROP CONSTRAINT IF EXISTS operators_operator_id_key;
ALTER TABLE IF EXISTS ONLY public.operations DROP CONSTRAINT IF EXISTS operations_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.notification_settings DROP CONSTRAINT IF EXISTS notification_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.mortality_rates DROP CONSTRAINT IF EXISTS mortality_rates_pkey;
ALTER TABLE IF EXISTS ONLY public.mortality_expectations DROP CONSTRAINT IF EXISTS mortality_expectations_pkey;
ALTER TABLE IF EXISTS ONLY public.mesh_vagliatura DROP CONSTRAINT IF EXISTS mesh_vagliatura_pkey;
ALTER TABLE IF EXISTS ONLY public.mesh_vagliatura DROP CONSTRAINT IF EXISTS mesh_vagliatura_microni_key;
ALTER TABLE IF EXISTS ONLY public.marine_data DROP CONSTRAINT IF EXISTS marine_data_pkey;
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
ALTER TABLE IF EXISTS ONLY public.imm_snapshots DROP CONSTRAINT IF EXISTS imm_snapshots_pkey;
ALTER TABLE IF EXISTS ONLY public.imm_config DROP CONSTRAINT IF EXISTS imm_config_pkey;
ALTER TABLE IF EXISTS ONLY public.hatchery_arrivals DROP CONSTRAINT IF EXISTS hatchery_arrivals_pkey;
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
ALTER TABLE IF EXISTS ONLY public.environmental_log DROP CONSTRAINT IF EXISTS environmental_log_pkey;
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
ALTER TABLE IF EXISTS public.user_menu_preferences ALTER COLUMN id DROP DEFAULT;
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
ALTER TABLE IF EXISTS public.sales_price_list ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sales_cash_targets ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sale_operations_ref ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sale_bags ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.rfid_tags ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.projection_mortality_rates ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.production_targets ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.pending_closures ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ordini_righe ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ordini ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.operations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.notifications ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.notification_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.mortality_rates ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.mortality_expectations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.mesh_vagliatura ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.marine_data ALTER COLUMN id DROP DEFAULT;
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
ALTER TABLE IF EXISTS public.imm_snapshots ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.hatchery_arrivals ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.growth_distributions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.growth_analysis_runs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.flupsys ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.fatture_in_cloud_config ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.external_users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.external_sales_sync ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.external_delivery_details_sync ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.external_deliveries_sync ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.external_customers_sync ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.environmental_log ALTER COLUMN id DROP DEFAULT;
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
DROP SEQUENCE IF EXISTS public.user_menu_preferences_id_seq;
DROP TABLE IF EXISTS public.user_menu_preferences;
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
DROP SEQUENCE IF EXISTS public.sales_price_list_id_seq;
DROP TABLE IF EXISTS public.sales_price_list;
DROP SEQUENCE IF EXISTS public.sales_cash_targets_id_seq;
DROP TABLE IF EXISTS public.sales_cash_targets;
DROP SEQUENCE IF EXISTS public.sale_operations_ref_id_seq;
DROP TABLE IF EXISTS public.sale_operations_ref;
DROP SEQUENCE IF EXISTS public.sale_bags_id_seq;
DROP TABLE IF EXISTS public.sale_bags;
DROP SEQUENCE IF EXISTS public.rfid_tags_id_seq;
DROP TABLE IF EXISTS public.rfid_tags;
DROP SEQUENCE IF EXISTS public.projection_mortality_rates_id_seq;
DROP TABLE IF EXISTS public.projection_mortality_rates;
DROP SEQUENCE IF EXISTS public.production_targets_id_seq;
DROP TABLE IF EXISTS public.production_targets;
DROP SEQUENCE IF EXISTS public.pending_closures_id_seq;
DROP TABLE IF EXISTS public.pending_closures;
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
DROP SEQUENCE IF EXISTS public.mortality_expectations_id_seq;
DROP TABLE IF EXISTS public.mortality_expectations;
DROP SEQUENCE IF EXISTS public.mesh_vagliatura_id_seq;
DROP TABLE IF EXISTS public.mesh_vagliatura;
DROP SEQUENCE IF EXISTS public.marine_data_id_seq;
DROP TABLE IF EXISTS public.marine_data;
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
DROP SEQUENCE IF EXISTS public.imm_snapshots_id_seq;
DROP TABLE IF EXISTS public.imm_snapshots;
DROP TABLE IF EXISTS public.imm_config;
DROP SEQUENCE IF EXISTS public.hatchery_arrivals_id_seq;
DROP TABLE IF EXISTS public.hatchery_arrivals;
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
DROP SEQUENCE IF EXISTS public.environmental_log_id_seq;
DROP TABLE IF EXISTS public.environmental_log;
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
DROP TABLE IF EXISTS public._backup_weights_correction_20251206;
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
-- TOC entry 370 (class 1255 OID 851968)
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
-- TOC entry 385 (class 1255 OID 1040384)
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
-- TOC entry 383 (class 1255 OID 425984)
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
-- TOC entry 384 (class 1255 OID 909317)
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
-- TOC entry 371 (class 1255 OID 425986)
-- Name: protect_mixed_lot_metadata(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_mixed_lot_metadata() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    -- Proteggi i metadati del lotto misto da sovrascrittura accidentale con NULL
    -- Ma PERMETTI aggiornamenti espliciti delle note
    IF (OLD.metadata IS NOT NULL) THEN
      -- Preserva sempre i metadata (questi non vanno mai modificati manualmente)
      NEW.metadata := OLD.metadata;
      
      -- Per le note: permetti aggiornamenti espliciti (quando il nuovo valore è diverso dal vecchio)
      -- Blocca solo se qualcuno tenta di impostare notes a NULL
      IF (NEW.notes IS NULL AND OLD.notes IS NOT NULL) THEN
        NEW.notes := OLD.notes;
      END IF;
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
-- TOC entry 342 (class 1259 OID 1130496)
-- Name: _backup_weights_correction_20251206; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._backup_weights_correction_20251206 (
    id integer,
    type text,
    date date,
    original_weight real,
    animal_count integer,
    animals_per_kg integer
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
-- TOC entry 4407 (class 0 OID 0)
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
-- TOC entry 4408 (class 0 OID 0)
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
-- TOC entry 4409 (class 0 OID 0)
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
-- TOC entry 4410 (class 0 OID 0)
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
-- TOC entry 4411 (class 0 OID 0)
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
-- TOC entry 4412 (class 0 OID 0)
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
    group_id integer,
    rfid_uhf_epc text,
    rfid_uhf_programmed_at timestamp without time zone,
    rfid_uhf_user_data text,
    tare_weight_g integer,
    net_mesh integer
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
-- TOC entry 4413 (class 0 OID 0)
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
-- TOC entry 4414 (class 0 OID 0)
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
-- TOC entry 4415 (class 0 OID 0)
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
    state text DEFAULT 'active'::text NOT NULL,
    sieve_up integer,
    sieve_down integer,
    parent_cycle_id integer,
    lineage_group_id integer,
    quality_class text,
    screening_label text
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
-- TOC entry 4416 (class 0 OID 0)
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
    updated_at timestamp without time zone,
    fcloud_ddt_id text,
    fcloud_ddt_numero text,
    fcloud_stato text
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
-- TOC entry 4417 (class 0 OID 0)
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
-- TOC entry 4418 (class 0 OID 0)
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
-- TOC entry 4419 (class 0 OID 0)
-- Dependencies: 233
-- Name: email_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_config_id_seq OWNED BY public.email_config.id;


--
-- TOC entry 360 (class 1259 OID 1794049)
-- Name: environmental_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.environmental_log (
    id integer NOT NULL,
    date date NOT NULL,
    recorded_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id integer,
    username text,
    sst real,
    wave_height real,
    wave_period real,
    chlorophyll real,
    salinity real,
    vallona_temp_acqua real,
    vallona_ph real,
    vallona_salinita real,
    vallona_ossigeno_sat real,
    vallona_torbidita real,
    vallona_clorofilla real,
    vallona_timestamp text,
    gorino2_temp_acqua real,
    gorino2_ph real,
    gorino2_salinita real,
    gorino2_ossigeno_sat real,
    gorino2_torbidita real,
    gorino2_clorofilla real,
    gorino2_timestamp text,
    temp_aria real,
    precipitazione real,
    vento_velocita real,
    vento_raffica real,
    condizione_meteo integer
);


--
-- TOC entry 359 (class 1259 OID 1794048)
-- Name: environmental_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.environmental_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4420 (class 0 OID 0)
-- Dependencies: 359
-- Name: environmental_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.environmental_log_id_seq OWNED BY public.environmental_log.id;


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
-- TOC entry 4421 (class 0 OID 0)
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
-- TOC entry 4422 (class 0 OID 0)
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
-- TOC entry 4423 (class 0 OID 0)
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
-- TOC entry 4424 (class 0 OID 0)
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
-- TOC entry 4425 (class 0 OID 0)
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
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    ddt_numeration_serie text DEFAULT ''::text
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
-- TOC entry 4426 (class 0 OID 0)
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
-- TOC entry 4427 (class 0 OID 0)
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
-- TOC entry 4428 (class 0 OID 0)
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
-- TOC entry 4429 (class 0 OID 0)
-- Dependencies: 307
-- Name: growth_distributions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.growth_distributions_id_seq OWNED BY public.growth_distributions.id;


--
-- TOC entry 356 (class 1259 OID 1572865)
-- Name: hatchery_arrivals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hatchery_arrivals (
    id integer NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    quantity integer NOT NULL,
    size_category text DEFAULT 'TP-300'::text NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone,
    actual_quantity integer,
    actual_locked_at timestamp without time zone
);


--
-- TOC entry 355 (class 1259 OID 1572864)
-- Name: hatchery_arrivals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hatchery_arrivals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4430 (class 0 OID 0)
-- Dependencies: 355
-- Name: hatchery_arrivals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hatchery_arrivals_id_seq OWNED BY public.hatchery_arrivals.id;


--
-- TOC entry 369 (class 1259 OID 2023439)
-- Name: imm_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.imm_config (
    id integer DEFAULT 1 NOT NULL,
    target_size_code text DEFAULT 'TP-3000'::text NOT NULL,
    horizon_days integer DEFAULT 180 NOT NULL,
    weight_size real DEFAULT 40 NOT NULL,
    weight_time real DEFAULT 35 NOT NULL,
    weight_quality real DEFAULT 15 NOT NULL,
    weight_reliability real DEFAULT 10 NOT NULL,
    fallback_sgr_daily real DEFAULT 0.005 NOT NULL,
    baseline_mortality_pct real DEFAULT 5 NOT NULL,
    max_mortality_pct real DEFAULT 30 NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT imm_config_singleton CHECK ((id = 1))
);


--
-- TOC entry 368 (class 1259 OID 2023425)
-- Name: imm_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.imm_snapshots (
    id integer NOT NULL,
    snapshot_date date NOT NULL,
    scope text NOT NULL,
    scope_id integer,
    scope_name text,
    target_size_code text NOT NULL,
    animal_count integer DEFAULT 0 NOT NULL,
    cycle_count integer DEFAULT 0 NOT NULL,
    imm real NOT NULL,
    imm_size real,
    imm_time real,
    imm_quality real,
    imm_reliability real,
    config text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 367 (class 1259 OID 2023424)
-- Name: imm_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.imm_snapshots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4431 (class 0 OID 0)
-- Dependencies: 367
-- Name: imm_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.imm_snapshots_id_seq OWNED BY public.imm_snapshots.id;


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
-- TOC entry 4432 (class 0 OID 0)
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
-- TOC entry 4433 (class 0 OID 0)
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
-- TOC entry 4434 (class 0 OID 0)
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
-- TOC entry 4435 (class 0 OID 0)
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
-- TOC entry 4436 (class 0 OID 0)
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
-- TOC entry 4437 (class 0 OID 0)
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
-- TOC entry 4438 (class 0 OID 0)
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
-- TOC entry 4439 (class 0 OID 0)
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
-- TOC entry 4440 (class 0 OID 0)
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
-- TOC entry 4441 (class 0 OID 0)
-- Dependencies: 253
-- Name: lots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lots_id_seq OWNED BY public.lots.id;


--
-- TOC entry 354 (class 1259 OID 1417217)
-- Name: marine_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marine_data (
    id integer NOT NULL,
    recorded_at timestamp without time zone NOT NULL,
    latitude real NOT NULL,
    longitude real NOT NULL,
    chlorophyll_a real,
    sea_surface_temperature real,
    salinity real,
    wave_height real,
    current_speed real,
    source text DEFAULT 'open-meteo'::text NOT NULL,
    raw_data jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    location_name text
);


--
-- TOC entry 353 (class 1259 OID 1417216)
-- Name: marine_data_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.marine_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4442 (class 0 OID 0)
-- Dependencies: 353
-- Name: marine_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.marine_data_id_seq OWNED BY public.marine_data.id;


--
-- TOC entry 362 (class 1259 OID 1810433)
-- Name: mesh_vagliatura; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mesh_vagliatura (
    id integer NOT NULL,
    microni integer NOT NULL,
    descrizione text,
    attivo boolean DEFAULT true NOT NULL
);


--
-- TOC entry 361 (class 1259 OID 1810432)
-- Name: mesh_vagliatura_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mesh_vagliatura_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4443 (class 0 OID 0)
-- Dependencies: 361
-- Name: mesh_vagliatura_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mesh_vagliatura_id_seq OWNED BY public.mesh_vagliatura.id;


--
-- TOC entry 348 (class 1259 OID 1343489)
-- Name: mortality_expectations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mortality_expectations (
    id integer NOT NULL,
    seed_size text DEFAULT 'TP-1000'::text NOT NULL,
    sale_size text NOT NULL,
    total_mortality_percent real NOT NULL,
    effective_from date DEFAULT CURRENT_DATE NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


--
-- TOC entry 347 (class 1259 OID 1343488)
-- Name: mortality_expectations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mortality_expectations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4444 (class 0 OID 0)
-- Dependencies: 347
-- Name: mortality_expectations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mortality_expectations_id_seq OWNED BY public.mortality_expectations.id;


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
-- TOC entry 4445 (class 0 OID 0)
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
-- TOC entry 4446 (class 0 OID 0)
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
-- TOC entry 4447 (class 0 OID 0)
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
    operator_name text,
    cancelled_at timestamp without time zone,
    cancellation_reason text,
    restored_to_flupsy_id integer,
    sample_count integer,
    formula_version integer DEFAULT 1 NOT NULL
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
-- TOC entry 4448 (class 0 OID 0)
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
-- TOC entry 4449 (class 0 OID 0)
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
-- TOC entry 4450 (class 0 OID 0)
-- Dependencies: 312
-- Name: ordini_righe_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ordini_righe_id_seq OWNED BY public.ordini_righe.id;


--
-- TOC entry 352 (class 1259 OID 1400833)
-- Name: pending_closures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pending_closures (
    id integer NOT NULL,
    cycle_id integer NOT NULL,
    basket_id integer NOT NULL,
    flupsy_id integer NOT NULL,
    lot_id integer NOT NULL,
    operation_id integer NOT NULL,
    closure_date date NOT NULL,
    animal_count integer NOT NULL,
    total_weight real,
    size_id integer,
    destination text DEFAULT 'pending'::text NOT NULL,
    destination_basket_id integer,
    destination_notes text,
    resolved_at timestamp without time zone,
    resolved_by text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    cycle_code text
);


--
-- TOC entry 351 (class 1259 OID 1400832)
-- Name: pending_closures_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pending_closures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4451 (class 0 OID 0)
-- Dependencies: 351
-- Name: pending_closures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pending_closures_id_seq OWNED BY public.pending_closures.id;


--
-- TOC entry 346 (class 1259 OID 1294337)
-- Name: production_targets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.production_targets (
    id integer NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    size_category text NOT NULL,
    target_animals integer NOT NULL,
    target_weight real,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


--
-- TOC entry 345 (class 1259 OID 1294336)
-- Name: production_targets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.production_targets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4452 (class 0 OID 0)
-- Dependencies: 345
-- Name: production_targets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.production_targets_id_seq OWNED BY public.production_targets.id;


--
-- TOC entry 358 (class 1259 OID 1589249)
-- Name: projection_mortality_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projection_mortality_rates (
    id integer NOT NULL,
    size_name text NOT NULL,
    month integer NOT NULL,
    monthly_percentage real NOT NULL,
    notes text,
    updated_at timestamp without time zone
);


--
-- TOC entry 357 (class 1259 OID 1589248)
-- Name: projection_mortality_rates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.projection_mortality_rates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4453 (class 0 OID 0)
-- Dependencies: 357
-- Name: projection_mortality_rates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.projection_mortality_rates_id_seq OWNED BY public.projection_mortality_rates.id;


--
-- TOC entry 344 (class 1259 OID 1236997)
-- Name: rfid_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rfid_tags (
    id integer NOT NULL,
    basket_number integer NOT NULL,
    epc text,
    status text DEFAULT 'reserved'::text NOT NULL,
    programmed_at timestamp without time zone,
    associated_basket_id integer,
    associated_cycle_id integer,
    associated_at timestamp without time zone,
    operator_id integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 343 (class 1259 OID 1236996)
-- Name: rfid_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rfid_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4454 (class 0 OID 0)
-- Dependencies: 343
-- Name: rfid_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rfid_tags_id_seq OWNED BY public.rfid_tags.id;


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
-- TOC entry 4455 (class 0 OID 0)
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
-- TOC entry 4456 (class 0 OID 0)
-- Dependencies: 265
-- Name: sale_operations_ref_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sale_operations_ref_id_seq OWNED BY public.sale_operations_ref.id;


--
-- TOC entry 366 (class 1259 OID 1867789)
-- Name: sales_cash_targets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_cash_targets (
    id integer NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    min_revenue real NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 365 (class 1259 OID 1867788)
-- Name: sales_cash_targets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sales_cash_targets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4457 (class 0 OID 0)
-- Dependencies: 365
-- Name: sales_cash_targets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sales_cash_targets_id_seq OWNED BY public.sales_cash_targets.id;


--
-- TOC entry 364 (class 1259 OID 1867777)
-- Name: sales_price_list; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_price_list (
    id integer NOT NULL,
    size_code text NOT NULL,
    price_per_animal real NOT NULL,
    notes text,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 363 (class 1259 OID 1867776)
-- Name: sales_price_list_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sales_price_list_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4458 (class 0 OID 0)
-- Dependencies: 363
-- Name: sales_price_list_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sales_price_list_id_seq OWNED BY public.sales_price_list.id;


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
-- TOC entry 4459 (class 0 OID 0)
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
-- TOC entry 4460 (class 0 OID 0)
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
-- TOC entry 4461 (class 0 OID 0)
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
-- TOC entry 4462 (class 0 OID 0)
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
-- TOC entry 4463 (class 0 OID 0)
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
-- TOC entry 4464 (class 0 OID 0)
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
-- TOC entry 4465 (class 0 OID 0)
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
    category text,
    sieve_up integer,
    sieve_down integer,
    screening_position text,
    mesh_sopra integer,
    mesh_sotto integer,
    mesh_sopra_2 integer,
    mesh_sotto_2 integer
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
-- TOC entry 4466 (class 0 OID 0)
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
-- TOC entry 4467 (class 0 OID 0)
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
-- TOC entry 4468 (class 0 OID 0)
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
-- TOC entry 4469 (class 0 OID 0)
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
-- TOC entry 4470 (class 0 OID 0)
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
-- TOC entry 4471 (class 0 OID 0)
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
-- TOC entry 4472 (class 0 OID 0)
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
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    site text,
    air_temp_min real,
    air_temp_max real,
    meteo text,
    water_temperature real,
    secchi_disk real,
    microalgae_concentration real,
    nh3 real,
    water_color text,
    microalgae_species text,
    mortality text,
    zone text
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
-- TOC entry 4473 (class 0 OID 0)
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
-- TOC entry 4474 (class 0 OID 0)
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
-- TOC entry 4475 (class 0 OID 0)
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
-- TOC entry 4476 (class 0 OID 0)
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
-- TOC entry 4477 (class 0 OID 0)
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
-- TOC entry 4478 (class 0 OID 0)
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
-- TOC entry 4479 (class 0 OID 0)
-- Dependencies: 314
-- Name: task_operators_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.task_operators_id_seq OWNED BY public.task_operators.id;


--
-- TOC entry 350 (class 1259 OID 1384449)
-- Name: user_menu_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_menu_preferences (
    id integer NOT NULL,
    user_id integer NOT NULL,
    menu_items text[] DEFAULT '{}'::text[] NOT NULL,
    compact_mode_enabled boolean DEFAULT false NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    preferred_flupsy_ids integer[] DEFAULT '{}'::integer[] NOT NULL,
    hidden_menu_items text[] DEFAULT '{}'::text[] NOT NULL
);


--
-- TOC entry 349 (class 1259 OID 1384448)
-- Name: user_menu_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_menu_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4480 (class 0 OID 0)
-- Dependencies: 349
-- Name: user_menu_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_menu_preferences_id_seq OWNED BY public.user_menu_preferences.id;


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
-- TOC entry 4481 (class 0 OID 0)
-- Dependencies: 297
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3575 (class 2604 OID 16482)
-- Name: advanced_sales id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advanced_sales ALTER COLUMN id SET DEFAULT nextval('public.advanced_sales_id_seq'::regclass);


--
-- TOC entry 3787 (class 2604 OID 1048580)
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- TOC entry 3579 (class 2604 OID 16496)
-- Name: bag_allocations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bag_allocations ALTER COLUMN id SET DEFAULT nextval('public.bag_allocations_id_seq'::regclass);


--
-- TOC entry 3765 (class 2604 OID 925700)
-- Name: basket_groups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.basket_groups ALTER COLUMN id SET DEFAULT nextval('public.basket_groups_id_seq'::regclass);


--
-- TOC entry 3724 (class 2604 OID 393231)
-- Name: basket_growth_profiles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.basket_growth_profiles ALTER COLUMN id SET DEFAULT nextval('public.basket_growth_profiles_id_seq'::regclass);


--
-- TOC entry 3580 (class 2604 OID 16505)
-- Name: basket_lot_composition id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.basket_lot_composition ALTER COLUMN id SET DEFAULT nextval('public.basket_lot_composition_id_seq'::regclass);


--
-- TOC entry 3582 (class 2604 OID 16515)
-- Name: baskets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baskets ALTER COLUMN id SET DEFAULT nextval('public.baskets_id_seq'::regclass);


--
-- TOC entry 3584 (class 2604 OID 16525)
-- Name: clienti id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clienti ALTER COLUMN id SET DEFAULT nextval('public.clienti_id_seq'::regclass);


--
-- TOC entry 3596 (class 2604 OID 16545)
-- Name: configurazione id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configurazione ALTER COLUMN id SET DEFAULT nextval('public.configurazione_id_seq'::regclass);


--
-- TOC entry 3599 (class 2604 OID 16558)
-- Name: cycles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cycles ALTER COLUMN id SET DEFAULT nextval('public.cycles_id_seq'::regclass);


--
-- TOC entry 3601 (class 2604 OID 16568)
-- Name: ddt id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ddt ALTER COLUMN id SET DEFAULT nextval('public.ddt_id_seq'::regclass);


--
-- TOC entry 3607 (class 2604 OID 16582)
-- Name: ddt_righe id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ddt_righe ALTER COLUMN id SET DEFAULT nextval('public.ddt_righe_id_seq'::regclass);


--
-- TOC entry 3611 (class 2604 OID 16594)
-- Name: email_config id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_config ALTER COLUMN id SET DEFAULT nextval('public.email_config_id_seq'::regclass);


--
-- TOC entry 3814 (class 2604 OID 1794052)
-- Name: environmental_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.environmental_log ALTER COLUMN id SET DEFAULT nextval('public.environmental_log_id_seq'::regclass);


--
-- TOC entry 3613 (class 2604 OID 16606)
-- Name: external_customers_sync id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_customers_sync ALTER COLUMN id SET DEFAULT nextval('public.external_customers_sync_id_seq'::regclass);


--
-- TOC entry 3617 (class 2604 OID 16620)
-- Name: external_deliveries_sync id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_deliveries_sync ALTER COLUMN id SET DEFAULT nextval('public.external_deliveries_sync_id_seq'::regclass);


--
-- TOC entry 3619 (class 2604 OID 16632)
-- Name: external_delivery_details_sync id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_delivery_details_sync ALTER COLUMN id SET DEFAULT nextval('public.external_delivery_details_sync_id_seq'::regclass);


--
-- TOC entry 3621 (class 2604 OID 16644)
-- Name: external_sales_sync id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_sales_sync ALTER COLUMN id SET DEFAULT nextval('public.external_sales_sync_id_seq'::regclass);


--
-- TOC entry 3760 (class 2604 OID 811012)
-- Name: external_users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_users ALTER COLUMN id SET DEFAULT nextval('public.external_users_id_seq'::regclass);


--
-- TOC entry 3629 (class 2604 OID 16662)
-- Name: fatture_in_cloud_config id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fatture_in_cloud_config ALTER COLUMN id SET DEFAULT nextval('public.fatture_in_cloud_config_id_seq'::regclass);


--
-- TOC entry 3640 (class 2604 OID 16680)
-- Name: flupsys id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flupsys ALTER COLUMN id SET DEFAULT nextval('public.flupsys_id_seq'::regclass);


--
-- TOC entry 3721 (class 2604 OID 393220)
-- Name: growth_analysis_runs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_analysis_runs ALTER COLUMN id SET DEFAULT nextval('public.growth_analysis_runs_id_seq'::regclass);


--
-- TOC entry 3728 (class 2604 OID 393251)
-- Name: growth_distributions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_distributions ALTER COLUMN id SET DEFAULT nextval('public.growth_distributions_id_seq'::regclass);


--
-- TOC entry 3810 (class 2604 OID 1572868)
-- Name: hatchery_arrivals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hatchery_arrivals ALTER COLUMN id SET DEFAULT nextval('public.hatchery_arrivals_id_seq'::regclass);


--
-- TOC entry 3822 (class 2604 OID 2023428)
-- Name: imm_snapshots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imm_snapshots ALTER COLUMN id SET DEFAULT nextval('public.imm_snapshots_id_seq'::regclass);


--
-- TOC entry 3773 (class 2604 OID 1024017)
-- Name: lci_consumables id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lci_consumables ALTER COLUMN id SET DEFAULT nextval('public.lci_consumables_id_seq'::regclass);


--
-- TOC entry 3776 (class 2604 OID 1024028)
-- Name: lci_consumption_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lci_consumption_logs ALTER COLUMN id SET DEFAULT nextval('public.lci_consumption_logs_id_seq'::regclass);


--
-- TOC entry 3768 (class 2604 OID 1024004)
-- Name: lci_materials id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lci_materials ALTER COLUMN id SET DEFAULT nextval('public.lci_materials_id_seq'::regclass);


--
-- TOC entry 3779 (class 2604 OID 1024039)
-- Name: lci_production_snapshots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lci_production_snapshots ALTER COLUMN id SET DEFAULT nextval('public.lci_production_snapshots_id_seq'::regclass);


--
-- TOC entry 3782 (class 2604 OID 1024050)
-- Name: lci_reports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lci_reports ALTER COLUMN id SET DEFAULT nextval('public.lci_reports_id_seq'::regclass);


--
-- TOC entry 3785 (class 2604 OID 1024061)
-- Name: lci_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lci_settings ALTER COLUMN id SET DEFAULT nextval('public.lci_settings_id_seq'::regclass);


--
-- TOC entry 3644 (class 2604 OID 16691)
-- Name: lot_inventory_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lot_inventory_transactions ALTER COLUMN id SET DEFAULT nextval('public.lot_inventory_transactions_id_seq'::regclass);


--
-- TOC entry 3646 (class 2604 OID 16701)
-- Name: lot_ledger id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lot_ledger ALTER COLUMN id SET DEFAULT nextval('public.lot_ledger_id_seq'::regclass);


--
-- TOC entry 3649 (class 2604 OID 16714)
-- Name: lot_mortality_records id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lot_mortality_records ALTER COLUMN id SET DEFAULT nextval('public.lot_mortality_records_id_seq'::regclass);


--
-- TOC entry 3652 (class 2604 OID 16725)
-- Name: lots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lots ALTER COLUMN id SET DEFAULT nextval('public.lots_id_seq'::regclass);


--
-- TOC entry 3807 (class 2604 OID 1417220)
-- Name: marine_data id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marine_data ALTER COLUMN id SET DEFAULT nextval('public.marine_data_id_seq'::regclass);


--
-- TOC entry 3816 (class 2604 OID 1810436)
-- Name: mesh_vagliatura id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mesh_vagliatura ALTER COLUMN id SET DEFAULT nextval('public.mesh_vagliatura_id_seq'::regclass);


--
-- TOC entry 3794 (class 2604 OID 1343492)
-- Name: mortality_expectations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mortality_expectations ALTER COLUMN id SET DEFAULT nextval('public.mortality_expectations_id_seq'::regclass);


--
-- TOC entry 3657 (class 2604 OID 16738)
-- Name: mortality_rates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mortality_rates ALTER COLUMN id SET DEFAULT nextval('public.mortality_rates_id_seq'::regclass);


--
-- TOC entry 3658 (class 2604 OID 16747)
-- Name: notification_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_settings ALTER COLUMN id SET DEFAULT nextval('public.notification_settings_id_seq'::regclass);


--
-- TOC entry 3661 (class 2604 OID 16758)
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- TOC entry 3664 (class 2604 OID 16769)
-- Name: operations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operations ALTER COLUMN id SET DEFAULT nextval('public.operations_id_seq'::regclass);


--
-- TOC entry 3734 (class 2604 OID 540676)
-- Name: ordini id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordini ALTER COLUMN id SET DEFAULT nextval('public.ordini_id_seq'::regclass);


--
-- TOC entry 3741 (class 2604 OID 540690)
-- Name: ordini_righe id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordini_righe ALTER COLUMN id SET DEFAULT nextval('public.ordini_righe_id_seq'::regclass);


--
-- TOC entry 3804 (class 2604 OID 1400836)
-- Name: pending_closures id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_closures ALTER COLUMN id SET DEFAULT nextval('public.pending_closures_id_seq'::regclass);


--
-- TOC entry 3792 (class 2604 OID 1294340)
-- Name: production_targets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_targets ALTER COLUMN id SET DEFAULT nextval('public.production_targets_id_seq'::regclass);


--
-- TOC entry 3813 (class 2604 OID 1589252)
-- Name: projection_mortality_rates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projection_mortality_rates ALTER COLUMN id SET DEFAULT nextval('public.projection_mortality_rates_id_seq'::regclass);


--
-- TOC entry 3789 (class 2604 OID 1237000)
-- Name: rfid_tags id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rfid_tags ALTER COLUMN id SET DEFAULT nextval('public.rfid_tags_id_seq'::regclass);


--
-- TOC entry 3667 (class 2604 OID 16778)
-- Name: sale_bags id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_bags ALTER COLUMN id SET DEFAULT nextval('public.sale_bags_id_seq'::regclass);


--
-- TOC entry 3670 (class 2604 OID 16789)
-- Name: sale_operations_ref id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_operations_ref ALTER COLUMN id SET DEFAULT nextval('public.sale_operations_ref_id_seq'::regclass);


--
-- TOC entry 3820 (class 2604 OID 1867792)
-- Name: sales_cash_targets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_cash_targets ALTER COLUMN id SET DEFAULT nextval('public.sales_cash_targets_id_seq'::regclass);


--
-- TOC entry 3818 (class 2604 OID 1867780)
-- Name: sales_price_list id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_price_list ALTER COLUMN id SET DEFAULT nextval('public.sales_price_list_id_seq'::regclass);


--
-- TOC entry 3672 (class 2604 OID 16797)
-- Name: screening_basket_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_basket_history ALTER COLUMN id SET DEFAULT nextval('public.screening_basket_history_id_seq'::regclass);


--
-- TOC entry 3674 (class 2604 OID 16805)
-- Name: screening_destination_baskets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_destination_baskets ALTER COLUMN id SET DEFAULT nextval('public.screening_destination_baskets_id_seq'::regclass);


--
-- TOC entry 3726 (class 2604 OID 393241)
-- Name: screening_impact_analysis id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_impact_analysis ALTER COLUMN id SET DEFAULT nextval('public.screening_impact_analysis_id_seq'::regclass);


--
-- TOC entry 3677 (class 2604 OID 16816)
-- Name: screening_lot_references id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_lot_references ALTER COLUMN id SET DEFAULT nextval('public.screening_lot_references_id_seq'::regclass);


--
-- TOC entry 3679 (class 2604 OID 16824)
-- Name: screening_operations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_operations ALTER COLUMN id SET DEFAULT nextval('public.screening_operations_id_seq'::regclass);


--
-- TOC entry 3683 (class 2604 OID 16835)
-- Name: screening_source_baskets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_source_baskets ALTER COLUMN id SET DEFAULT nextval('public.screening_source_baskets_id_seq'::regclass);


--
-- TOC entry 3687 (class 2604 OID 16845)
-- Name: selection_basket_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_basket_history ALTER COLUMN id SET DEFAULT nextval('public.selection_basket_history_id_seq'::regclass);


--
-- TOC entry 3689 (class 2604 OID 16853)
-- Name: selection_destination_baskets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_destination_baskets ALTER COLUMN id SET DEFAULT nextval('public.selection_destination_baskets_id_seq'::regclass);


--
-- TOC entry 3691 (class 2604 OID 16863)
-- Name: selection_lot_references id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_lot_references ALTER COLUMN id SET DEFAULT nextval('public.selection_lot_references_id_seq'::regclass);


--
-- TOC entry 3693 (class 2604 OID 16871)
-- Name: selection_source_baskets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_source_baskets ALTER COLUMN id SET DEFAULT nextval('public.selection_source_baskets_id_seq'::regclass);


--
-- TOC entry 3757 (class 2604 OID 786489)
-- Name: selection_task_assignments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_task_assignments ALTER COLUMN id SET DEFAULT nextval('public.selection_task_assignments_id_seq'::regclass);


--
-- TOC entry 3755 (class 2604 OID 786468)
-- Name: selection_task_baskets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_task_baskets ALTER COLUMN id SET DEFAULT nextval('public.selection_task_baskets_id_seq'::regclass);


--
-- TOC entry 3750 (class 2604 OID 786449)
-- Name: selection_tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_tasks ALTER COLUMN id SET DEFAULT nextval('public.selection_tasks_id_seq'::regclass);


--
-- TOC entry 3695 (class 2604 OID 16879)
-- Name: selections id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selections ALTER COLUMN id SET DEFAULT nextval('public.selections_id_seq'::regclass);


--
-- TOC entry 3699 (class 2604 OID 16890)
-- Name: sgr id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sgr ALTER COLUMN id SET DEFAULT nextval('public.sgr_id_seq'::regclass);


--
-- TOC entry 3701 (class 2604 OID 16900)
-- Name: sgr_giornalieri id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sgr_giornalieri ALTER COLUMN id SET DEFAULT nextval('public.sgr_giornalieri_id_seq'::regclass);


--
-- TOC entry 3718 (class 2604 OID 352260)
-- Name: sgr_per_taglia id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sgr_per_taglia ALTER COLUMN id SET DEFAULT nextval('public.sgr_per_taglia_id_seq'::regclass);


--
-- TOC entry 3704 (class 2604 OID 16909)
-- Name: sizes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sizes ALTER COLUMN id SET DEFAULT nextval('public.sizes_id_seq'::regclass);


--
-- TOC entry 3705 (class 2604 OID 16920)
-- Name: sync_status id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_status ALTER COLUMN id SET DEFAULT nextval('public.sync_status_id_seq'::regclass);


--
-- TOC entry 3711 (class 2604 OID 16936)
-- Name: target_size_annotations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.target_size_annotations ALTER COLUMN id SET DEFAULT nextval('public.target_size_annotations_id_seq'::regclass);


--
-- TOC entry 3747 (class 2604 OID 786436)
-- Name: task_operators id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_operators ALTER COLUMN id SET DEFAULT nextval('public.task_operators_id_seq'::regclass);


--
-- TOC entry 3798 (class 2604 OID 1384452)
-- Name: user_menu_preferences id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_menu_preferences ALTER COLUMN id SET DEFAULT nextval('public.user_menu_preferences_id_seq'::regclass);


--
-- TOC entry 3714 (class 2604 OID 16947)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4372 (class 0 OID 1081344)
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
-- TOC entry 4374 (class 0 OID 1130496)
-- Dependencies: 342
-- Data for Name: _backup_weights_correction_20251206; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._backup_weights_correction_20251206 (id, type, date, original_weight, animal_count, animals_per_kg) FROM stdin;
107	prima-attivazione	2025-12-03	22.1	253896	11500
109	prima-attivazione	2025-12-03	19	218282	11500
113	prima-attivazione	2025-12-03	28	321678	11500
86	chiusura-ciclo-vagliatura	2025-12-03	5.207	2991337	574468
87	chiusura-ciclo-vagliatura	2025-12-03	4.633	3001568	647887
98	chiusura-ciclo-vagliatura	2025-12-03	14.2	362966	25561
99	chiusura-ciclo-vagliatura	2025-12-03	14.2	362966	25561
100	chiusura-ciclo-vagliatura	2025-12-03	14.2	362966	25561
101	prima-attivazione	2025-12-03	23	506000	22000
102	vendita	2025-12-03	23	506000	22000
103	prima-attivazione	2025-12-03	23	506000	22000
104	vendita	2025-12-03	23	506000	22000
105	chiusura-ciclo-vagliatura	2025-12-03	24.3	261274	10752
106	chiusura-ciclo-vagliatura	2025-12-03	22.7	201440	8874
108	vendita	2025-12-03	22.1	251863	11500
110	vendita	2025-12-03	19	216534	11500
111	chiusura-ciclo-vagliatura	2025-12-03	29.5	417600	14156
112	chiusura-ciclo-vagliatura	2025-12-03	24.5	367500	15000
114	vendita	2025-12-03	28	319102	11500
116	vendita	2025-12-03	40	455860	11500
117	chiusura-ciclo-vagliatura	2025-12-04	23.7	283902	11979
119	vendita	2025-12-04	24.9	283773	11500
120	chiusura-ciclo-vagliatura	2025-12-04	4.633	3001568	647887
121	chiusura-ciclo-vagliatura	2025-12-04	4.024	2563120	636905
122	chiusura-ciclo-vagliatura	2025-12-04	4.024	2563120	636905
115	prima-attivazione	2025-12-03	40	459540	11500
118	prima-attivazione	2025-12-04	24.9	286064	11500
123	prima-attivazione	2025-12-04	8.7	608558	70159
124	prima-attivazione	2025-12-04	11.8	3547663	301852
125	prima-attivazione	2025-12-04	11.8	3547663	301852
89	prima-attivazione	2025-12-03	11.4	3441096	309836
90	prima-attivazione	2025-12-03	11.4	3441096	309836
83	prima-attivazione	2025-12-01	20	553347	27778
84	prima-attivazione	2025-12-01	20	553347	27778
85	prima-attivazione	2025-12-01	15.9	667089	42249
88	prima-attivazione	2025-12-03	8.7	472587	54969
65	prima-attivazione	2025-11-28	7.904	1142556	144550
33	misura	2025-11-28	24.3	261274	10752
34	misura	2025-11-28	23.7	283902	11979
5	prima-attivazione	2025-11-26	29	417600	14400
6	prima-attivazione	2025-11-26	24.5	367500	15000
7	prima-attivazione	2025-11-26	14.5	255200	17600
8	prima-attivazione	2025-11-26	7	129500	18500
9	prima-attivazione	2025-11-26	15	372000	24800
10	prima-attivazione	2025-11-26	16.5	405900	24600
11	prima-attivazione	2025-11-26	13.8	529920	38400
12	prima-attivazione	2025-11-26	13.9	562950	40500
13	prima-attivazione	2025-11-26	13.25	530000	40000
14	prima-attivazione	2025-11-26	10.45	234080	22400
15	prima-attivazione	2025-11-26	10.1	241390	23900
16	prima-attivazione	2025-11-26	9.12	322848	35400
17	prima-attivazione	2025-11-26	5.7	205200	36000
18	prima-attivazione	2025-11-26	10.7	422650	39500
19	prima-attivazione	2025-11-26	7.3	357700	49000
20	prima-attivazione	2025-11-26	10.35	843525	81500
21	prima-attivazione	2025-11-26	12	972000	81000
22	prima-attivazione	2025-11-26	15.15	536310	35400
23	prima-attivazione	2025-11-26	17.9	653350	36500
24	prima-attivazione	2025-11-26	17.35	633275	36500
25	prima-attivazione	2025-11-26	15.1	551150	36500
26	prima-attivazione	2025-11-26	11.4	748980	65700
27	prima-attivazione	2025-11-26	13.063	794230	60800
28	prima-attivazione	2025-11-27	19.3	207514	10752
29	prima-attivazione	2025-11-27	19.5	207519	10642
30	prima-attivazione	2025-11-27	19.2	229997	11979
31	prima-attivazione	2025-11-27	20.8	249725	12006
32	prima-attivazione	2025-11-27	22.7	201440	8874
35	peso	2025-11-27	15.5	562950	36319
36	peso	2025-11-27	29.5	417600	14156
38	prima-attivazione	2025-11-28	14.758	552291	37423
39	prima-attivazione	2025-11-28	7.904	1142556	144550
40	prima-attivazione	2025-11-28	14.2	362966	25561
41	prima-attivazione	2025-11-28	14.784	573448	38788
42	prima-attivazione	2025-11-28	9	1175004	130556
66	prima-attivazione	2025-11-28	7.904	1142556	144550
43	prima-attivazione	2025-11-28	14.2	362966	25561
44	prima-attivazione	2025-11-28	9	1175004	130556
45	prima-attivazione	2025-11-28	12.162	695530	57188
46	prima-attivazione	2025-11-28	15.5	691285	44599
47	prima-attivazione	2025-11-28	12.162	695530	57188
48	prima-attivazione	2025-11-28	13.4	560495	41828
49	prima-attivazione	2025-11-28	9.649	384566	39855
50	prima-attivazione	2025-11-28	12.9	241540	18724
51	prima-attivazione	2025-11-28	14.2	362966	25561
52	prima-attivazione	2025-11-28	2.874	118337	41170
53	prima-attivazione	2025-11-28	14.758	552291	37423
54	prima-attivazione	2025-11-28	4.633	3001568	647887
55	prima-attivazione	2025-11-28	5.07	2979484	587629
56	prima-attivazione	2025-11-28	14.784	573448	38788
57	prima-attivazione	2025-11-28	6.945	876177	126157
58	prima-attivazione	2025-11-28	5.07	2979484	587629
59	prima-attivazione	2025-11-28	4.024	2563120	636905
60	prima-attivazione	2025-11-28	4.024	2563120	636905
61	prima-attivazione	2025-11-28	16.4	1255764	76571
62	prima-attivazione	2025-11-28	16.4	1255764	76571
63	prima-attivazione	2025-11-28	8.573	1578666	184146
64	prima-attivazione	2025-11-28	16.5	735092	44551
67	prima-attivazione	2025-11-28	8	1779592	222449
68	prima-attivazione	2025-11-28	8	1779592	222449
69	prima-attivazione	2025-11-28	8.573	1578666	184146
70	prima-attivazione	2025-11-28	8.573	1578666	184146
71	prima-attivazione	2025-11-28	5.07	2979484	587629
72	prima-attivazione	2025-11-28	5.07	2979484	587629
73	prima-attivazione	2025-11-28	1.768	2667174	1508772
74	prima-attivazione	2025-11-28	1.768	2667174	1508772
75	prima-attivazione	2025-11-28	5.207	2991337	574468
76	prima-attivazione	2025-11-28	2.28	3485769	1528846
77	prima-attivazione	2025-11-28	4.633	3001568	647887
78	prima-attivazione	2025-11-28	2.19	3348173	1528846
80	chiusura-ciclo-vagliatura	2025-12-01	9.649	384566	39855
81	chiusura-ciclo-vagliatura	2025-12-01	15.5	691285	44599
82	chiusura-ciclo-vagliatura	2025-12-01	16.5	735092	44551
\.


--
-- TOC entry 4248 (class 0 OID 16479)
-- Dependencies: 216
-- Data for Name: advanced_sales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.advanced_sales (id, sale_number, customer_id, customer_name, customer_details, sale_date, status, total_weight, total_animals, total_bags, notes, pdf_path, ddt_id, ddt_status, created_at, updated_at, company_id) FROM stdin;
41	VAV-000013	18	Ceppa Società Semplice Agricola di Oselladore R.E. Bollini J.	"{\\"id\\":18,\\"externalId\\":\\"\\",\\"name\\":\\"Ceppa Società Semplice Agricola di Oselladore R.E. Bollini J.\\",\\"businessName\\":\\"Ceppa Società Semplice Agricola di Oselladore R.E. Bollini J.\\",\\"vatNumber\\":\\"01522020294\\",\\"address\\":\\"\\",\\"city\\":\\"Rosolina\\",\\"province\\":\\"RO\\",\\"postalCode\\":\\"45010\\",\\"phone\\":\\"\\",\\"email\\":\\"ruggero977@gmail.com\\"}"	2026-04-30	confirmed	24	569935	4	\N	\N	\N	nessuno	2026-04-30 11:01:25.098853	2026-04-30 11:01:29.303	1017299
40	VAV-000012	81	Soc Coop Poseidone	"{\\"id\\":81,\\"externalId\\":\\"\\",\\"name\\":\\"Soc Coop Poseidone\\",\\"businessName\\":\\"Soc Coop Poseidone\\",\\"vatNumber\\":\\"01251320295\\",\\"address\\":\\"\\",\\"city\\":\\"Rosolina\\",\\"province\\":\\"RO\\",\\"postalCode\\":\\"45010\\",\\"phone\\":\\"\\",\\"email\\":\\"\\"}"	2026-04-30	confirmed	38	950200	2	\N	\N	\N	nessuno	2026-04-30 11:01:25.098853	2026-04-30 11:01:30.998	1017299
42	VAV-000014	103	VENUS - SOC. COOP.	"{\\"id\\":103,\\"externalId\\":\\"\\",\\"name\\":\\"VENUS - SOC. COOP.\\",\\"businessName\\":\\"VENUS - SOC. COOP.\\",\\"vatNumber\\":\\"01252330384\\",\\"address\\":\\"\\",\\"city\\":\\"GORO\\",\\"province\\":\\"FE\\",\\"postalCode\\":\\"44020\\",\\"phone\\":\\"\\",\\"email\\":\\"coopvenusgoro@gmail.com\\"}"	2026-05-07	confirmed	4.5	108000	1	\N	\N	9	locale	2026-05-07 11:48:18.312522	2026-05-07 11:51:07.478	1052922
43	VAV-000015	138	Soc Coop Pescatori Rosolina	"{\\"id\\":138,\\"externalId\\":\\"65131263\\",\\"name\\":\\"Soc Coop Pescatori Rosolina\\",\\"businessName\\":\\"Soc Coop Pescatori Rosolina\\",\\"vatNumber\\":\\"00750250292\\",\\"address\\":\\"\\",\\"city\\":\\"Rosolina\\",\\"province\\":\\"RO\\",\\"postalCode\\":\\"45010\\",\\"phone\\":\\"\\",\\"email\\":\\"coop.rosolina@tiscali.it\\"}"	2026-05-08	confirmed	29	2290228	2	\N	\N	10	locale	2026-05-08 07:46:33.168136	2026-05-08 07:48:09.288	1052922
7	VAV-000006	81	Soc Coop Poseidone	"{\\"id\\":81,\\"externalId\\":\\"\\",\\"name\\":\\"Soc Coop Poseidone\\",\\"businessName\\":\\"Soc Coop Poseidone\\",\\"vatNumber\\":\\"01251320295\\",\\"address\\":\\"\\",\\"city\\":\\"Rosolina\\",\\"province\\":\\"RO\\",\\"postalCode\\":\\"45010\\",\\"phone\\":\\"\\",\\"email\\":\\"\\"}"	2025-12-19	confirmed	39.1	1058575	3	Poseidone T3 18/12/2025	\N	\N	nessuno	2025-12-18 13:19:39.747233	2025-12-18 13:34:52.501	1017299
4	VAV-000003	58	LA VERACE Società Cooperativa	"{\\"id\\":58,\\"externalId\\":\\"\\",\\"name\\":\\"LA VERACE Società Cooperativa\\",\\"businessName\\":\\"LA VERACE Società Cooperativa\\",\\"vatNumber\\":\\"01877390383\\",\\"address\\":\\"\\",\\"city\\":\\"Goro\\",\\"province\\":\\"Ferrara\\",\\"postalCode\\":\\"44020\\",\\"phone\\":\\"\\",\\"email\\":\\"coop.laverace@virgilio.it\\"}"	2025-12-09	confirmed	65000	1617753	3	ottimi animali 	\N	1	inviato	2025-12-09 11:22:57.47786	2025-12-09 13:40:47.415	1017299
45	VAV-000017	103	VENUS - SOC. COOP.	"{\\"id\\":103,\\"externalId\\":\\"\\",\\"name\\":\\"VENUS - SOC. COOP.\\",\\"businessName\\":\\"VENUS - SOC. COOP.\\",\\"vatNumber\\":\\"01252330384\\",\\"address\\":\\"\\",\\"city\\":\\"GORO\\",\\"province\\":\\"FE\\",\\"postalCode\\":\\"44020\\",\\"phone\\":\\"\\",\\"email\\":\\"coopvenusgoro@gmail.com\\"}"	2026-05-19	confirmed	4.3	99260	1	t3 100.000	\N	12	locale	2026-05-20 13:22:04.959612	2026-05-20 13:24:58.884	1052922
44	VAV-000016	26	Coop. Adriatica Gorino	"{\\"id\\":26,\\"externalId\\":\\"\\",\\"name\\":\\"Coop. Adriatica Gorino\\",\\"businessName\\":\\"Coop. Adriatica Gorino\\",\\"vatNumber\\":\\"00423670389\\",\\"address\\":\\"\\",\\"city\\":\\"Gorino FE, Italia\\",\\"province\\":\\"FE\\",\\"postalCode\\":\\"44020\\",\\"phone\\":\\"\\",\\"email\\":\\"coopadriatica@libero.it\\"}"	2026-05-19	confirmed	22.64	150000	1	150.000 t4	\N	11	locale	2026-05-20 11:38:41.836332	2026-05-20 11:39:48.092	1052922
46	VAV-000018	138	Soc Coop Pescatori Rosolina	"{\\"id\\":138,\\"externalId\\":\\"65131263\\",\\"name\\":\\"Soc Coop Pescatori Rosolina\\",\\"businessName\\":\\"Soc Coop Pescatori Rosolina\\",\\"vatNumber\\":\\"00750250292\\",\\"address\\":\\"\\",\\"city\\":\\"Rosolina\\",\\"province\\":\\"RO\\",\\"postalCode\\":\\"45010\\",\\"phone\\":\\"\\",\\"email\\":\\"coop.rosolina@tiscali.it\\"}"	2026-05-22	confirmed	40.5	2895523	5	\N	\N	13	locale	2026-05-22 12:07:40.696977	2026-05-22 12:11:57.499	1052922
47	VAV-000019	37	Cooperativa Pescatori Laghese Società Cooperativa ARL	"{\\"id\\":37,\\"externalId\\":\\"\\",\\"name\\":\\"Cooperativa Pescatori Laghese Società Cooperativa ARL\\",\\"businessName\\":\\"Cooperativa Pescatori Laghese Società Cooperativa ARL\\",\\"vatNumber\\":\\"01356120384\\",\\"address\\":\\"\\",\\"city\\":\\"Lagosanto\\",\\"province\\":\\"FE\\",\\"postalCode\\":\\"44023\\",\\"phone\\":\\"\\",\\"email\\":\\"nicoletta.carlin@studio-duo.it\\"}"	2026-05-22	draft	4300	83328	\N	\N	\N	\N	nessuno	2026-05-22 12:12:33.299235	2026-05-22 12:12:33.376	1052922
6	VAV-000005	26	Coop. Adriatica Gorino	"{\\"id\\":26,\\"externalId\\":\\"\\",\\"name\\":\\"Coop. Adriatica Gorino\\",\\"businessName\\":\\"Coop. Adriatica Gorino\\",\\"vatNumber\\":\\"00423670389\\",\\"address\\":\\"\\",\\"city\\":\\"Gorino FE, Italia\\",\\"province\\":\\"FE\\",\\"postalCode\\":\\"44020\\",\\"phone\\":\\"\\",\\"email\\":\\"coopadriatica@libero.it\\"}"	2025-12-18	confirmed	24.5	233608	5	\N	\N	\N	nessuno	2025-12-18 12:02:39.980736	2025-12-18 12:04:39.424	1052922
8	VAV-000007	26	Coop. Adriatica Gorino	"{\\"id\\":26,\\"externalId\\":\\"\\",\\"name\\":\\"Coop. Adriatica Gorino\\",\\"businessName\\":\\"Coop. Adriatica Gorino\\",\\"vatNumber\\":\\"00423670389\\",\\"address\\":\\"\\",\\"city\\":\\"Gorino FE, Italia\\",\\"province\\":\\"FE\\",\\"postalCode\\":\\"44020\\",\\"phone\\":\\"\\",\\"email\\":\\"coopadriatica@libero.it\\"}"	2025-12-19	confirmed	24	220113	5	\N	\N	\N	nessuno	2025-12-19 12:44:53.042779	2025-12-19 12:46:17.813	1052922
18	VAV-000009	125	SOCIETA' AGRICOLA TIRRENA	"{\\"id\\":125,\\"externalId\\":\\"65131277\\",\\"name\\":\\"SOCIETA' AGRICOLA TIRRENA\\",\\"businessName\\":\\"SOCIETA' AGRICOLA TIRRENA\\",\\"vatNumber\\":\\"00305250292\\",\\"address\\":\\"\\",\\"city\\":\\"PORTO VIRO\\",\\"province\\":\\"ROVIGO\\",\\"postalCode\\":\\"45014\\",\\"phone\\":\\"\\",\\"email\\":\\"office.deltafuturo@gmail.com\\"}"	2026-03-25	confirmed	26	152911	2	\N	\N	6	inviato	2026-03-28 06:11:41.181896	2026-03-28 06:16:24.152	1052922
11	VAV-000008	114	Soc Coop Poseidone	"{\\"id\\":114,\\"externalId\\":\\"65131264\\",\\"name\\":\\"Soc Coop Poseidone\\",\\"businessName\\":\\"Soc Coop Poseidone\\",\\"vatNumber\\":\\"01251320295\\",\\"address\\":\\"\\",\\"city\\":\\"Rosolina\\",\\"province\\":\\"RO\\",\\"postalCode\\":\\"45010\\",\\"phone\\":\\"\\",\\"email\\":\\"\\"}"	2026-02-17	confirmed	33	628056	1	\N	\N	\N	nessuno	2026-02-23 07:39:36.964118	2026-02-23 07:41:17.157	1017299
2	VAV-000002	82	Soc cooperativa Rosa dei Venti	"{\\"id\\":82,\\"externalId\\":\\"\\",\\"name\\":\\"Soc cooperativa Rosa dei Venti\\",\\"businessName\\":\\"Soc cooperativa Rosa dei Venti\\",\\"vatNumber\\":\\"01257010387\\",\\"address\\":\\"\\",\\"city\\":\\"Goro\\",\\"province\\":\\"FE\\",\\"postalCode\\":\\"44020\\",\\"phone\\":\\"\\",\\"email\\":\\"rosadeiventi3@gmail.com\\"}"	2025-12-04	confirmed	24900	283773	\N	\N	\N	\N	nessuno	2025-12-04 13:19:44.421038	2025-12-09 11:31:29.598	1052922
1	VAV-000001	58	LA VERACE Società Cooperativa	"{\\"id\\":58,\\"externalId\\":\\"\\",\\"name\\":\\"LA VERACE Società Cooperativa\\",\\"businessName\\":\\"LA VERACE Società Cooperativa\\",\\"vatNumber\\":\\"01877390383\\",\\"address\\":\\"\\",\\"city\\":\\"Goro\\",\\"province\\":\\"Ferrara\\",\\"postalCode\\":\\"44020\\",\\"phone\\":\\"\\",\\"email\\":\\"coop.laverace@virgilio.it\\"}"	2025-12-03	confirmed	109100	1243359	\N	Vendita a Mauro Turri, La Verace. Accontentato	\N	\N	nessuno	2025-12-04 13:07:57.641612	2025-12-09 11:31:31.758	1052922
19	VAV-000010	121	Coop. La Vela	"{\\"id\\":121,\\"externalId\\":\\"65131219\\",\\"name\\":\\"Coop. La Vela\\",\\"businessName\\":\\"Coop. La Vela\\",\\"vatNumber\\":\\"01227850383\\",\\"address\\":\\"\\",\\"city\\":\\"Goro\\",\\"province\\":\\"FE\\",\\"postalCode\\":\\"44020\\",\\"phone\\":\\"\\",\\"email\\":\\"cooplavela@autlook.com\\"}"	2026-04-07	confirmed	50.2	1042421	3	\N	\N	7	locale	2026-04-09 09:42:37.811145	2026-04-22 17:23:16.527	1052922
24	VAV-000011	110	Coop. Adriatica Gorino	"{\\"id\\":110,\\"externalId\\":\\"65131218\\",\\"name\\":\\"Coop. Adriatica Gorino\\",\\"businessName\\":\\"Coop. Adriatica Gorino\\",\\"vatNumber\\":\\"00423670389\\",\\"address\\":\\"\\",\\"city\\":\\"Gorino FE, Italia\\",\\"province\\":\\"FE\\",\\"postalCode\\":\\"44020\\",\\"phone\\":\\"\\",\\"email\\":\\"coopadriatica@libero.it\\"}"	2026-04-24	confirmed	12.5	259233	1	\N	\N	8	locale	2026-04-24 07:08:59.019083	2026-04-24 07:25:30.349	1052922
\.


--
-- TOC entry 4371 (class 0 OID 1048577)
-- Dependencies: 339
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, "timestamp", action, entity_type, entity_id, user_id, user_source, old_values, new_values, metadata, ip_address, user_agent) FROM stdin;
1	2025-11-28 12:41:23.404424+00	operation_deleted	operation	79	\N	\N	{"date": "2025-11-28", "type": "peso", "cycleId": 5, "basketId": 21, "animalCount": 417600}	\N	{"deletedAt": "2025-11-28T12:41:23.299Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
2	2025-12-07 09:47:17.933734+00	operation_deleted	operation	135	\N	\N	{"date": "2025-12-05", "type": "misura", "cycleId": 99, "basketId": 41, "animalCount": 3100198}	\N	{"deletedAt": "2025-12-07T09:47:17.815Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
3	2025-12-07 09:47:42.96485+00	operation_deleted	operation	134	\N	\N	{"date": "2025-12-04", "type": "prima-attivazione", "cycleId": 99, "basketId": 41, "animalCount": 3725166}	\N	{"cycleId": 99, "basketId": 41, "deletedAt": "2025-12-07T09:47:42.839Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
4	2025-12-29 07:04:58.22712+00	operation_deleted	operation	226	\N	\N	{"date": "2025-12-29", "type": "prima-attivazione", "cycleId": 129, "basketId": 63, "animalCount": 2023200}	\N	{"cycleId": 129, "basketId": 63, "deletedAt": "2025-12-29T07:04:58.213Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
5	2025-12-30 07:19:52.928522+00	operation_deleted	operation	228	\N	\N	{"date": "2025-12-30", "type": "prima-attivazione", "cycleId": 131, "basketId": 64, "animalCount": 3182880}	\N	{"cycleId": 131, "basketId": 64, "deletedAt": "2025-12-30T07:19:52.916Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
6	2026-01-06 15:21:55.791641+00	operation_deleted	operation	230	\N	\N	{"date": "2026-01-06", "type": "peso", "cycleId": 62, "basketId": 122, "animalCount": 1274120}	\N	{"deletedAt": "2026-01-06T15:21:55.680Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
7	2026-01-06 15:23:42.727538+00	operation_deleted	operation	231	\N	\N	{"date": "2026-01-06", "type": "peso", "cycleId": 62, "basketId": 122, "animalCount": 1274120}	\N	{"deletedAt": "2026-01-06T15:23:42.614Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
8	2026-01-06 15:26:40.253995+00	operation_deleted	operation	232	\N	\N	{"date": "2026-01-06", "type": "peso", "cycleId": 62, "basketId": 122, "animalCount": 1274120}	\N	{"deletedAt": "2026-01-06T15:26:40.140Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
9	2026-01-06 15:53:07.824225+00	operation_deleted	operation	233	\N	\N	{"date": "2026-01-06", "type": "peso", "cycleId": 62, "basketId": 122, "animalCount": 1274120}	\N	{"deletedAt": "2026-01-06T15:53:07.708Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
10	2026-01-06 15:54:59.82951+00	operation_deleted	operation	234	\N	\N	{"date": "2026-01-06", "type": "peso", "cycleId": 62, "basketId": 122, "animalCount": 1274120}	\N	{"deletedAt": "2026-01-06T15:54:59.713Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
11	2026-01-06 16:26:48.308954+00	operation_deleted	operation	235	\N	\N	{"date": "2026-01-06", "type": "peso", "cycleId": 62, "basketId": 122, "animalCount": 1274120}	\N	{"deletedAt": "2026-01-06T16:26:48.193Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
12	2026-01-06 16:30:02.887645+00	operation_deleted	operation	236	\N	\N	{"date": "2026-01-06", "type": "peso", "cycleId": 62, "basketId": 122, "animalCount": 1274120}	\N	{"deletedAt": "2026-01-06T16:30:02.774Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
13	2026-01-06 16:40:33.366089+00	operation_deleted	operation	237	\N	\N	{"date": "2026-01-06", "type": "peso", "cycleId": 62, "basketId": 122, "animalCount": 1274120}	\N	{"deletedAt": "2026-01-06T16:40:33.251Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
14	2026-01-06 16:57:43.325158+00	operation_deleted	operation	238	\N	\N	{"date": "2026-01-06", "type": "peso", "cycleId": 62, "basketId": 122, "animalCount": 1274120}	\N	{"deletedAt": "2026-01-06T16:57:43.213Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
15	2026-01-06 17:04:34.378532+00	operation_deleted	operation	239	\N	\N	{"date": "2026-01-06", "type": "peso", "cycleId": 62, "basketId": 122, "animalCount": 1274120}	\N	{"deletedAt": "2026-01-06T17:04:34.274Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
16	2026-01-06 17:14:01.034524+00	operation_deleted	operation	240	\N	\N	{"date": "2026-01-06", "type": "misura", "cycleId": 62, "basketId": 122, "animalCount": 375000}	\N	{"deletedAt": "2026-01-06T17:14:00.930Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
17	2026-01-06 17:23:46.400352+00	operation_deleted	operation	241	\N	\N	{"date": "2026-01-06", "type": "misura", "cycleId": 62, "basketId": 122, "animalCount": 212500}	\N	{"deletedAt": "2026-01-06T17:23:46.273Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
29	2026-01-12 09:36:10.174653+00	operation_deleted	operation	265	\N	\N	{"date": "2026-01-12", "type": "misura", "cycleId": 126, "basketId": 113, "animalCount": 628174}	\N	{"deletedAt": "2026-01-12T09:36:10.163Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
30	2026-01-12 09:36:14.707094+00	operation_deleted	operation	264	\N	\N	{"date": "2025-12-22", "type": "misura", "cycleId": 51, "basketId": 111, "animalCount": 2492154}	\N	{"deletedAt": "2026-01-12T09:36:14.696Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
18	2026-01-09 12:27:18.001715+00	operation_deleted	operation	161	\N	\N	{"date": "2025-12-09", "type": "prima-attivazione", "cycleId": 109, "basketId": 96, "animalCount": 681298}	\N	{"cycleId": 109, "basketId": 96, "deletedAt": "2026-01-09T12:27:17.991Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "basket_lot_composition (1)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
19	2026-01-09 12:50:15.230385+00	operation_deleted	operation	186	\N	\N	{"date": "2025-12-11", "type": "chiusura-ciclo-vagliatura", "cycleId": 44, "basketId": 90, "animalCount": 560495}	\N	{"deletedAt": "2026-01-09T12:50:15.219Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
20	2026-01-09 12:51:06.360297+00	operation_deleted	operation	224	\N	\N	{"date": "2025-12-23", "type": "prima-attivazione", "cycleId": 127, "basketId": 84, "animalCount": 279106}	\N	{"cycleId": 127, "basketId": 84, "deletedAt": "2026-01-09T12:51:06.349Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "basket_lot_composition (1)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
21	2026-01-09 12:51:17.095641+00	operation_deleted	operation	225	\N	\N	{"date": "2025-12-23", "type": "prima-attivazione", "cycleId": 128, "basketId": 92, "animalCount": 449415}	\N	{"cycleId": 128, "basketId": 92, "deletedAt": "2026-01-09T12:51:17.085Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "basket_lot_composition (1)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
22	2026-01-09 12:51:26.90851+00	operation_deleted	operation	196	\N	\N	{"date": "2025-12-12", "type": "misura", "cycleId": 125, "basketId": 95, "animalCount": 628174}	\N	{"deletedAt": "2026-01-09T12:51:26.898Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
23	2026-01-09 12:51:44.236804+00	operation_deleted	operation	88	\N	\N	{"date": "2025-12-03", "type": "prima-attivazione", "cycleId": 78, "basketId": 98, "animalCount": 472587}	\N	{"cycleId": 78, "basketId": 98, "deletedAt": "2026-01-09T12:51:44.226Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "basket_lot_composition (1)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
24	2026-01-09 13:04:59.803364+00	operation_deleted	operation	190	\N	\N	{"date": "2025-12-11", "type": "prima-attivazione", "cycleId": 122, "basketId": 90, "animalCount": 476592}	\N	{"cycleId": 122, "basketId": 90, "deletedAt": "2026-01-09T13:04:59.792Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "basket_lot_composition (1)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
25	2026-01-09 13:05:40.022305+00	operation_deleted	operation	193	\N	\N	{"date": "2025-12-11", "type": "prima-attivazione", "cycleId": 125, "basketId": 95, "animalCount": 584796}	\N	{"cycleId": 125, "basketId": 95, "deletedAt": "2026-01-09T13:05:40.011Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "basket_lot_composition (1)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
26	2026-01-09 13:05:48.916487+00	operation_deleted	operation	256	\N	\N	{"date": "2026-01-09", "type": "prima-attivazione", "cycleId": 140, "basketId": 98, "animalCount": 297270}	\N	{"cycleId": 140, "basketId": 98, "deletedAt": "2026-01-09T13:05:48.906Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
27	2026-01-12 09:15:29.862533+00	operation_deleted	operation	182	\N	\N	{"date": "2025-12-11", "type": "prima-attivazione", "cycleId": 120, "basketId": 81, "animalCount": 681738}	\N	{"cycleId": 120, "basketId": 81, "deletedAt": "2026-01-12T09:15:29.852Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
28	2026-01-12 09:32:41.733191+00	operation_deleted	operation	56	\N	\N	{"date": "2025-11-28", "type": "prima-attivazione", "cycleId": 52, "basketId": 112, "animalCount": 573448}	\N	{"cycleId": 52, "basketId": 112, "deletedAt": "2026-01-12T09:32:41.722Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
31	2026-01-12 09:36:22.071506+00	operation_deleted	operation	197	\N	\N	{"date": "2025-12-12", "type": "misura", "cycleId": 126, "basketId": 113, "animalCount": 628174}	\N	{"deletedAt": "2026-01-12T09:36:22.060Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
32	2026-01-12 09:36:27.627962+00	operation_deleted	operation	194	\N	\N	{"date": "2025-12-11", "type": "prima-attivazione", "cycleId": 126, "basketId": 113, "animalCount": 584796}	\N	{"cycleId": 126, "basketId": 113, "deletedAt": "2026-01-12T09:36:27.617Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "basket_lot_composition (1)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
33	2026-01-12 09:39:11.26183+00	operation_deleted	operation	123	\N	\N	{"date": "2025-12-04", "type": "prima-attivazione", "cycleId": 90, "basketId": 115, "animalCount": 608558}	\N	{"cycleId": 90, "basketId": 115, "deletedAt": "2026-01-12T09:39:11.250Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "basket_lot_composition (1)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
34	2026-01-12 09:41:52.693949+00	operation_deleted	operation	61	\N	\N	{"date": "2025-11-28", "type": "prima-attivazione", "cycleId": 57, "basketId": 117, "animalCount": 1255764}	\N	{"cycleId": 57, "basketId": 117, "deletedAt": "2026-01-12T09:41:52.683Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
35	2026-01-12 09:42:07.152091+00	operation_deleted	operation	44	\N	\N	{"date": "2025-11-28", "type": "prima-attivazione", "cycleId": 40, "basketId": 87, "animalCount": 1175004}	\N	{"cycleId": 40, "basketId": 87, "deletedAt": "2026-01-12T09:42:07.140Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
36	2026-01-12 09:42:45.155613+00	operation_deleted	operation	62	\N	\N	{"date": "2025-11-28", "type": "prima-attivazione", "cycleId": 58, "basketId": 118, "animalCount": 1255764}	\N	{"cycleId": 58, "basketId": 118, "deletedAt": "2026-01-12T09:42:45.144Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
37	2026-01-12 09:45:49.991972+00	operation_deleted	operation	85	\N	\N	{"date": "2025-12-01", "type": "prima-attivazione", "cycleId": 77, "basketId": 120, "animalCount": 667089}	\N	{"cycleId": 77, "basketId": 120, "deletedAt": "2026-01-12T09:45:49.980Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "basket_lot_composition (1)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
38	2026-01-12 09:55:04.546059+00	operation_deleted	operation	145	\N	\N	{"date": "2025-12-04", "type": "prima-attivazione", "cycleId": 101, "basketId": 116, "animalCount": 335421}	\N	{"cycleId": 101, "basketId": 116, "deletedAt": "2026-01-12T09:55:04.532Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "basket_lot_composition (1)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
39	2026-01-12 09:55:13.098403+00	operation_deleted	operation	146	\N	\N	{"date": "2025-12-04", "type": "prima-attivazione", "cycleId": 102, "basketId": 127, "animalCount": 319059}	\N	{"cycleId": 102, "basketId": 127, "deletedAt": "2026-01-12T09:55:13.087Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "basket_lot_composition (1)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
40	2026-01-12 09:55:20.922899+00	operation_deleted	operation	147	\N	\N	{"date": "2025-12-04", "type": "prima-attivazione", "cycleId": 103, "basketId": 128, "animalCount": 299425}	\N	{"cycleId": 103, "basketId": 128, "deletedAt": "2026-01-12T09:55:20.909Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "basket_lot_composition (1)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
41	2026-01-12 09:55:32.595037+00	operation_deleted	operation	148	\N	\N	{"date": "2025-12-04", "type": "prima-attivazione", "cycleId": 104, "basketId": 129, "animalCount": 273245}	\N	{"cycleId": 104, "basketId": 129, "deletedAt": "2026-01-12T09:55:32.580Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "basket_lot_composition (1)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
42	2026-01-15 16:53:07.298312+00	operation_deleted	operation	304	\N	\N	{"date": "2026-01-15", "type": "misura", "cycleId": 12, "basketId": 5, "animalCount": 553721}	\N	{"deletedAt": "2026-01-15T16:53:07.196Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
43	2026-01-15 17:09:24.620092+00	operation_deleted	operation	305	\N	\N	{"date": "2026-01-15", "type": "misura", "cycleId": 12, "basketId": 5, "animalCount": 553718}	\N	{"deletedAt": "2026-01-15T17:09:24.501Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
44	2026-01-16 07:51:13.278594+00	operation_deleted	operation	306	\N	\N	{"date": "2026-01-16", "type": "misura", "cycleId": 135, "basketId": 88, "animalCount": 147575}	\N	{"deletedAt": "2026-01-16T07:51:13.265Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
45	2026-01-16 11:46:45.989554+00	operation_deleted	operation	307	\N	\N	{"date": "2026-01-16", "type": "misura", "cycleId": 145, "basketId": 131, "animalCount": 4198323}	\N	{"deletedAt": "2026-01-16T11:46:45.977Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
46	2026-01-18 15:20:22.256515+00	operation_deleted	operation	330	\N	\N	{"date": "2026-01-18", "type": "misura", "cycleId": 67, "basketId": 101, "animalCount": 2930640}	\N	{"deletedAt": "2026-01-18T15:20:22.244Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
47	2026-01-18 15:21:50.581667+00	operation_deleted	operation	331	\N	\N	{"date": "2026-01-18", "type": "misura", "cycleId": 67, "basketId": 101, "animalCount": 2883372}	\N	{"deletedAt": "2026-01-18T15:21:50.569Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
48	2026-01-18 15:27:54.178721+00	operation_deleted	operation	332	\N	\N	{"date": "2026-01-18", "type": "misura", "cycleId": 67, "basketId": 101, "animalCount": 2864889}	\N	{"deletedAt": "2026-01-18T15:27:54.166Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
49	2026-01-18 15:30:43.902187+00	operation_deleted	operation	333	\N	\N	{"date": "2026-01-18", "type": "misura", "cycleId": 67, "basketId": 101, "animalCount": 2864889}	\N	{"deletedAt": "2026-01-18T15:30:43.891Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
50	2026-01-18 15:47:45.859526+00	operation_deleted	operation	334	\N	\N	{"date": "2026-01-18", "type": "misura", "cycleId": 67, "basketId": 101, "animalCount": 2837604}	\N	{"deletedAt": "2026-01-18T15:47:45.848Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
51	2026-01-18 16:05:32.875872+00	operation_deleted	operation	335	\N	\N	{"date": "2026-01-18", "type": "misura", "cycleId": 67, "basketId": 101, "animalCount": 2837604}	\N	{"deletedAt": "2026-01-18T16:05:32.863Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
52	2026-01-26 14:47:55.885945+00	operation_deleted	operation	344	\N	\N	{"date": "2026-01-26", "type": "peso", "cycleId": 130, "basketId": 63, "animalCount": 2023200}	\N	{"deletedAt": "2026-01-26T14:47:55.874Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
53	2026-01-27 14:41:36.985862+00	operation_deleted	operation	380	\N	\N	{"date": "2026-01-28", "type": "misura", "cycleId": 139, "basketId": 96, "animalCount": 431838}	\N	{"deletedAt": "2026-01-27T14:41:36.974Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
54	2026-01-28 16:08:52.240212+00	operation_deleted	operation	403	\N	\N	{"date": "2026-01-28", "type": "peso", "cycleId": 142, "basketId": 112, "animalCount": 952086}	\N	{"deletedAt": "2026-01-28T16:08:52.123Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
55	2026-01-28 16:12:31.112089+00	operation_deleted	operation	404	\N	\N	{"date": "2026-01-28", "type": "peso", "cycleId": 142, "basketId": 112, "animalCount": 952086}	\N	{"deletedAt": "2026-01-28T16:12:30.996Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
56	2026-01-28 16:20:11.387876+00	operation_deleted	operation	405	\N	\N	{"date": "2026-01-28", "type": "peso", "cycleId": 142, "basketId": 112, "animalCount": 952086}	\N	{"deletedAt": "2026-01-28T16:20:11.269Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
57	2026-01-28 16:21:47.196502+00	operation_deleted	operation	406	\N	\N	{"date": "2026-01-28", "type": "peso", "cycleId": 142, "basketId": 112, "animalCount": 952086}	\N	{"deletedAt": "2026-01-28T16:21:47.082Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
58	2026-01-28 16:28:44.489381+00	operation_deleted	operation	407	\N	\N	{"date": "2026-01-28", "type": "peso", "cycleId": 142, "basketId": 112, "animalCount": 952086}	\N	{"deletedAt": "2026-01-28T16:28:44.370Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
59	2026-01-28 18:01:17.068025+00	operation_deleted	operation	408	\N	\N	{"date": "2026-01-28", "type": "peso", "cycleId": 142, "basketId": 112, "animalCount": 952086}	\N	{"deletedAt": "2026-01-28T18:01:16.948Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
60	2026-01-30 10:18:32.202796+00	operation_deleted	operation	412	\N	\N	{"date": "2026-01-24", "type": "misura", "cycleId": 152, "basketId": 138, "animalCount": 1453761}	\N	{"deletedAt": "2026-01-30T10:18:32.192Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
61	2026-01-30 10:39:19.721197+00	operation_deleted	operation	414	\N	\N	{"date": "2026-01-30", "type": "misura", "cycleId": 152, "basketId": 138, "animalCount": 1456887}	\N	{"deletedAt": "2026-01-30T10:39:19.710Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
62	2026-01-30 10:39:23.410923+00	operation_deleted	operation	395	\N	\N	{"date": "2026-01-22", "type": "prima-attivazione", "cycleId": 152, "basketId": 138, "animalCount": 1456887}	\N	{"cycleId": 152, "basketId": 138, "deletedAt": "2026-01-30T10:39:23.399Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
63	2026-01-30 10:58:20.00798+00	operation_deleted	operation	417	\N	\N	{"date": "2026-01-31", "type": "misura", "cycleId": 157, "basketId": 138, "animalCount": 4010625}	\N	{"deletedAt": "2026-01-30T10:58:19.997Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
64	2026-01-30 11:00:53.890602+00	operation_deleted	operation	420	\N	\N	{"date": "2026-01-31", "type": "misura", "cycleId": 157, "basketId": 138, "animalCount": 5085638}	\N	{"deletedAt": "2026-01-30T11:00:53.880Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
65	2026-02-05 11:07:22.991772+00	operation_deleted	operation	438	\N	\N	{"date": "2026-02-05", "type": "misura", "cycleId": 145, "basketId": 131, "animalCount": 3944287}	\N	{"deletedAt": "2026-02-05T11:07:22.877Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
66	2026-02-05 11:19:16.186693+00	operation_deleted	operation	439	\N	\N	{"date": "2026-02-05", "type": "misura", "cycleId": 145, "basketId": 131, "animalCount": 3944287}	\N	{"deletedAt": "2026-02-05T11:19:16.074Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
67	2026-02-09 09:50:19.654738+00	operation_deleted	operation	468	\N	\N	{"date": "2026-02-06", "type": "misura", "cycleId": 149, "basketId": 134, "animalCount": 75263}	\N	{"deletedAt": "2026-02-09T09:50:19.640Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
68	2026-02-09 10:21:22.847791+00	operation_deleted	operation	469	\N	\N	{"date": "2026-02-06", "type": "misura", "cycleId": 149, "basketId": 134, "animalCount": 322891}	\N	{"deletedAt": "2026-02-09T10:21:22.836Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
69	2026-02-09 10:47:25.544116+00	operation_deleted	operation	474	\N	\N	{"date": "2026-02-09", "type": "misura", "cycleId": 149, "basketId": 134, "animalCount": 322891}	\N	{"deletedAt": "2026-02-09T10:47:25.429Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
70	2026-02-09 10:59:22.840994+00	operation_deleted	operation	421	\N	\N	{"date": "2026-01-30", "type": "misura", "cycleId": 157, "basketId": 138, "animalCount": 5907867}	\N	{"deletedAt": "2026-02-09T10:59:22.830Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
71	2026-02-09 11:04:58.525354+00	operation_deleted	operation	476	\N	\N	{"date": "2026-02-07", "type": "misura", "cycleId": 157, "basketId": 138, "animalCount": 5907867}	\N	{"deletedAt": "2026-02-09T11:04:58.514Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
72	2026-02-09 11:38:30.651735+00	operation_deleted	operation	470	\N	\N	{"date": "2026-02-09", "type": "misura", "cycleId": 160, "basketId": 137, "animalCount": 191667}	\N	{"deletedAt": "2026-02-09T11:38:30.640Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
73	2026-02-10 08:58:12.681276+00	operation_deleted	operation	482	\N	\N	{"date": "2026-02-10", "type": "peso", "cycleId": 68, "basketId": 102, "animalCount": 2866625}	\N	{"deletedAt": "2026-02-10T08:58:12.670Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
74	2026-02-23 07:05:12.200774+00	operation_deleted	operation	546	\N	\N	{"date": "2026-02-17", "type": "vendita", "cycleId": 182, "basketId": 92, "animalCount": 121628}	\N	{"deletedAt": "2026-02-23T07:05:12.190Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
75	2026-02-23 13:34:35.595844+00	operation_deleted	operation	548	\N	\N	{"date": "2026-02-23", "type": "prima-attivazione", "cycleId": 183, "basketId": 137, "animalCount": 2606843}	\N	{"cycleId": 183, "basketId": 137, "deletedAt": "2026-02-23T13:34:35.584Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
76	2026-02-23 13:35:59.529369+00	operation_deleted	operation	549	\N	\N	{"date": "2026-02-17", "type": "prima-attivazione", "cycleId": 184, "basketId": 137, "animalCount": 2607}	\N	{"cycleId": 184, "basketId": 137, "deletedAt": "2026-02-23T13:35:59.518Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
77	2026-02-28 13:19:04.414166+00	operation_deleted	operation	618	\N	\N	{"date": "2026-02-28", "type": "prima-attivazione", "cycleId": 219, "basketId": 23, "animalCount": 743802}	\N	{"cycleId": 219, "basketId": 23, "deletedAt": "2026-02-28T13:19:04.401Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
78	2026-02-28 13:19:10.275421+00	operation_deleted	operation	616	\N	\N	{"date": "2026-02-28", "type": "prima-attivazione", "cycleId": 217, "basketId": 21, "animalCount": 743801}	\N	{"cycleId": 217, "basketId": 21, "deletedAt": "2026-02-28T13:19:10.263Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
79	2026-02-28 13:19:15.590865+00	operation_deleted	operation	617	\N	\N	{"date": "2026-02-28", "type": "prima-attivazione", "cycleId": 218, "basketId": 22, "animalCount": 743802}	\N	{"cycleId": 218, "basketId": 22, "deletedAt": "2026-02-28T13:19:15.578Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
80	2026-02-28 13:19:21.436686+00	operation_deleted	operation	619	\N	\N	{"date": "2026-02-28", "type": "prima-attivazione", "cycleId": 220, "basketId": 28, "animalCount": 743802}	\N	{"cycleId": 220, "basketId": 28, "deletedAt": "2026-02-28T13:19:21.424Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
81	2026-03-03 09:33:00.721891+00	operation_deleted	operation	625	\N	\N	{"date": "2026-02-27", "type": "trasferimento", "cycleId": 169, "basketId": 87, "animalCount": 1329856}	\N	{"deletedAt": "2026-03-03T09:33:00.710Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
89	2026-03-27 08:34:53.606541+00	operation_deleted	operation	938	\N	\N	{"date": "2026-03-25", "type": "vendita", "cycleId": 246, "basketId": 20, "animalCount": 152911}	\N	{"deletedAt": "2026-03-27T08:34:53.594Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
90	2026-04-03 08:16:01.438095+00	operation_deleted	operation	1033	\N	\N	{"date": "2026-04-02", "type": "misura", "cycleId": 335, "basketId": 30, "animalCount": 252202}	\N	{"deletedAt": "2026-04-03T08:16:01.424Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
91	2026-04-08 08:09:45.435567+00	operation_deleted	operation	1092	\N	\N	{"date": "2026-04-08", "type": "peso", "cycleId": 386, "basketId": 16, "animalCount": 4873810}	\N	{"deletedAt": "2026-04-08T08:09:45.423Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
92	2026-04-10 08:48:06.402396+00	operation_deleted	operation	1159	\N	\N	{"date": "2026-04-10", "type": "misura", "cycleId": 293, "basketId": 162, "animalCount": 5288595}	\N	{"deletedAt": "2026-04-10T08:48:06.388Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
93	2026-04-17 12:28:39.877232+00	operation_deleted	operation	1274	\N	\N	{"date": "2026-04-17", "type": "peso", "cycleId": 356, "basketId": 6, "animalCount": 226204}	\N	{"deletedAt": "2026-04-17T12:28:39.865Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
94	2026-04-17 13:35:28.044459+00	operation_deleted	operation	1305	\N	\N	{"date": "2026-04-17", "type": "peso", "cycleId": 356, "basketId": 6, "animalCount": 226204}	\N	{"deletedAt": "2026-04-17T13:35:28.033Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
95	2026-04-17 13:35:41.115853+00	operation_deleted	operation	1306	\N	\N	{"date": "2026-04-17", "type": "peso", "cycleId": 366, "basketId": 9, "animalCount": 49177}	\N	{"deletedAt": "2026-04-17T13:35:41.105Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
96	2026-04-17 13:35:53.582349+00	operation_deleted	operation	1307	\N	\N	{"date": "2026-04-17", "type": "peso", "cycleId": 306, "basketId": 12, "animalCount": 234992}	\N	{"deletedAt": "2026-04-17T13:35:53.572Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
97	2026-04-23 12:24:07.139989+00	operation_deleted	operation	1400	\N	\N	{"date": "2026-04-23", "type": "misura", "cycleId": 488, "basketId": 114, "animalCount": 303432}	\N	{"deletedAt": "2026-04-23T12:24:07.128Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
98	2026-04-23 12:25:40.219978+00	operation_deleted	operation	1401	\N	\N	{"date": "2026-04-23", "type": "misura", "cycleId": 195, "basketId": 153, "animalCount": 529841}	\N	{"deletedAt": "2026-04-23T12:25:40.209Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
99	2026-04-24 07:04:40.697174+00	operation_deleted	operation	1420	\N	\N	{"date": "2026-04-24", "type": "misura", "cycleId": 491, "basketId": 129, "animalCount": 311285}	\N	{"deletedAt": "2026-04-24T07:04:40.686Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
100	2026-04-24 09:13:35.675917+00	operation_deleted	operation	1422	\N	\N	{"date": "2026-04-24", "type": "vendita", "cycleId": 493, "basketId": 127, "animalCount": 434014}	\N	{"deletedAt": "2026-04-24T09:13:35.663Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
101	2026-04-24 09:13:41.920774+00	operation_deleted	operation	1421	\N	\N	{"date": "2026-04-24", "type": "vendita", "cycleId": 491, "basketId": 129, "animalCount": 288904}	\N	{"deletedAt": "2026-04-24T09:13:41.909Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
102	2026-04-24 10:25:35.353356+00	operation_deleted	operation	1428	\N	\N	{"date": "2026-04-24", "type": "prima-attivazione", "cycleId": 506, "basketId": 81, "animalCount": 440141}	\N	{"cycleId": 506, "basketId": 81, "deletedAt": "2026-04-24T10:25:35.243Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets (nessun record)", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
103	2026-04-24 10:26:33.275038+00	operation_deleted	operation	1429	\N	\N	{"date": "2026-04-24", "type": "prima-attivazione", "cycleId": 507, "basketId": 82, "animalCount": 40065}	\N	{"cycleId": 507, "basketId": 82, "deletedAt": "2026-04-24T10:26:33.168Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets (nessun record)", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
104	2026-04-24 14:16:38.64568+00	operation_deleted	operation	1443	\N	\N	{"date": "2026-04-24", "type": "misura", "cycleId": 482, "basketId": 139, "animalCount": 2854593}	\N	{"deletedAt": "2026-04-24T14:16:38.633Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
105	2026-04-24 14:17:01.654312+00	operation_deleted	operation	1444	\N	\N	{"date": "2026-04-24", "type": "misura", "cycleId": 467, "basketId": 146, "animalCount": 6533352}	\N	{"deletedAt": "2026-04-24T14:17:01.641Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
106	2026-04-24 14:17:13.16377+00	operation_deleted	operation	1445	\N	\N	{"date": "2026-04-24", "type": "misura", "cycleId": 457, "basketId": 140, "animalCount": 7941090}	\N	{"deletedAt": "2026-04-24T14:17:13.149Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
107	2026-04-24 16:59:51.840994+00	operation_deleted	operation	783	\N	\N	{"date": "2026-03-12", "type": "prima-attivazione", "cycleId": 290, "basketId": 157, "animalCount": 2048000}	\N	{"cycleId": 290, "basketId": 157, "deletedAt": "2026-04-24T16:59:51.828Z", "cascadeType": "prima-attivazione", "cleanedTables": ["basket_lot_composition (checked for all ops)", "lot_ledger (nullified refs)", "screening_source_baskets", "screening_destination_baskets", "screening_basket_history", "screening_lot_references", "selection_source_baskets (nessun record)", "selection_destination_baskets", "selection_basket_history", "selection_lot_references", "operations (1 record)", "cycles", "baskets (reset state)"], "operationsDeleted": 1}	\N	\N
108	2026-04-27 11:33:30.926786+00	operation_deleted	operation	1493	\N	\N	{"date": "2026-04-27", "type": "misura", "cycleId": 515, "basketId": 64, "animalCount": 2894288}	\N	{"deletedAt": "2026-04-27T11:33:30.914Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
109	2026-05-04 10:57:13.754225+00	operation_deleted	operation	1632	\N	\N	{"date": "2026-05-05", "type": "misura", "cycleId": 565, "basketId": 151, "animalCount": 1100000}	\N	{"deletedAt": "2026-05-04T10:57:13.742Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
110	2026-05-05 09:05:30.088487+00	operation_deleted	operation	1665	\N	\N	{"date": "2026-05-06", "type": "peso", "cycleId": 541, "basketId": 94, "animalCount": 388904}	\N	{"deletedAt": "2026-05-05T09:05:30.077Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
111	2026-05-15 07:38:56.312849+00	operation_deleted	operation	1956	\N	\N	{"date": "2026-05-15", "type": "peso", "cycleId": 658, "basketId": 30, "animalCount": 1267066}	\N	{"deletedAt": "2026-05-15T07:38:56.298Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
112	2026-05-15 07:39:41.255273+00	operation_deleted	operation	1958	\N	\N	{"date": "2026-05-15", "type": "peso", "cycleId": 662, "basketId": 32, "animalCount": 858635}	\N	{"deletedAt": "2026-05-15T07:39:41.242Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
113	2026-05-20 11:10:08.040026+00	operation_deleted	operation	2084	\N	\N	{"date": "2026-05-20", "type": "misura", "cycleId": 698, "basketId": 184, "animalCount": 6409639}	\N	{"deletedAt": "2026-05-20T11:10:08.028Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
114	2026-05-21 12:04:35.027493+00	operation_deleted	operation	2115	\N	\N	{"date": "2026-05-21", "type": "misura", "cycleId": 721, "basketId": 10, "animalCount": 680000}	\N	{"deletedAt": "2026-05-21T12:04:35.013Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
115	2026-05-21 12:06:05.253264+00	operation_deleted	operation	2116	\N	\N	{"date": "2026-05-21", "type": "misura", "cycleId": 658, "basketId": 30, "animalCount": 1267066}	\N	{"deletedAt": "2026-05-21T12:06:05.241Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
116	2026-05-22 12:31:43.876476+00	operation_deleted	operation	2163	\N	\N	{"date": "2026-05-22", "type": "peso", "cycleId": 660, "basketId": 24, "animalCount": 1192983}	\N	{"deletedAt": "2026-05-22T12:31:43.864Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
117	2026-05-22 12:32:02.473729+00	operation_deleted	operation	2164	\N	\N	{"date": "2026-05-22", "type": "peso", "cycleId": 712, "basketId": 37, "animalCount": 749296}	\N	{"deletedAt": "2026-05-22T12:32:02.460Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
118	2026-05-25 13:01:07.855585+00	operation_deleted	operation	2208	\N	\N	{"date": "2026-05-25", "type": "misura", "cycleId": 671, "basketId": 27, "animalCount": 841099}	\N	{"deletedAt": "2026-05-25T13:01:07.843Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
119	2026-05-25 13:14:14.850405+00	operation_deleted	operation	2186	\N	\N	{"date": "2026-05-26", "type": "misura", "cycleId": 753, "basketId": 16, "animalCount": 336550}	\N	{"deletedAt": "2026-05-25T13:14:14.839Z", "cascadeType": "normal", "cleanedTables": ["basket_lot_composition (checked)", "operations"]}	\N	\N
\.


--
-- TOC entry 4250 (class 0 OID 16493)
-- Dependencies: 218
-- Data for Name: bag_allocations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bag_allocations (id, sale_bag_id, source_operation_id, source_basket_id, allocated_animals, allocated_weight, source_animals_per_kg, source_size_code) FROM stdin;
14	14	211	86	476750	15200	33000	
15	15	212	91	400382	17200	23278	
16	16	213	92	181443	6700	27081	
17	17	220	9	45857	5000	9172	
18	18	220	9	45857	5000	9172	
19	19	220	9	45857	5000	9172	
20	20	220	9	45857	5000	9172	
21	21	220	9	36685	4000	9172	
24	24	547	91	628056	33000	19032	
41	41	966	20	58812	10000	6761	
42	42	966	20	94099	16000	6761	
46	46	1151	22	325321	16500	23162	
47	47	1150	23	368109	16500	23968	
48	48	1152	31	348991	16600	24846	
53	53	1421	129	259233	12500	18760	
1	1	155	81	540923	22000	25192	
2	2	157	84	535806	21000	26142	
3	3	163	88	541024	22000	24592	
73	73	1589	114	551200	22000	26500	TP-3000
74	74	1588	111	399000	16000	26500	TP-3000
75	75	1591	122	99735	6800	16350	TP-3500
76	76	1592	96	106000	2200	26500	TP-3000
9	9	209	7	47673	5000	9535	
10	10	209	7	47673	5000	9535	
77	77	1590	120	323300	6000	26500	TP-3000
78	78	1588	111	40900	9000	26500	TP-3000
11	11	209	7	47673	5000	9535	
12	12	209	7	47673	5000	9535	
13	13	209	7	42916	4500	9535	
79	79	1765	89	108000	4500	24000	
80	80	1732	82	1145114	14500	78973	
81	81	1734	90	1145114	14500	78973	
82	82	2042	20	150000	22640	12279	
84	84	2094	150	99260	4300	23171	
85	85	2156	132	714011	9700	75887	
86	86	2160	134	598753	9100	67832	
87	87	2153	131	454824	6500	72137	
88	88	2158	133	566613	8700	69286	
89	89	2162	135	561322	6500	89028	
\.


--
-- TOC entry 4357 (class 0 OID 925697)
-- Dependencies: 325
-- Data for Name: basket_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.basket_groups (id, name, color, created_at, purpose, highlight_order, updated_at) FROM stdin;
9	CESTE DA VAGLIARE CON IL 1500	#e47711	2025-11-28 10:08:42.227586	Animali in elenco progressivo, da vagliare con la rete del 1500	0	\N
11	CESTE DA VAGLIARE CON LA RETE DEL 2000PLUS	#eaf73b	2025-11-28 10:11:08.959881	Raccoglie tendenzialmente i +1000 grandi che non hanno avuto la vagliatura intermedia con il 1500, i +1500 (gruppo dedicato solo alle teste) 	0	\N
10	CESTE DA VAGLIARE CON LA RETE DEL 2000	#eaee17	2025-11-28 10:09:54.070525	Raccoglie tendenzialmente i -2000 (code e medi) 	0	2025-11-28 10:11:28.793
12	CESTE DA VAGLIARE CON LA RETE DEL 3000	#a830f8	2025-11-28 10:12:19.85544	Raccoglie tutti i -3 (code e medi) e i +2.5 	0	\N
13	CESTE DA VAGLIARE CON IL 4000	#000000	2025-11-28 10:13:11.479985	Raccoglie i -4 (code e medi che non sono stati vagliati con il +3), i +3 e i +3.5	0	\N
14	CESTE DA VAGLIARE CON LA RETE DEL 5000	#a4a9b2	2025-11-28 10:14:20.595063	Raccoglie i +4 e i -5 che non sono stati vagliati con il +4	0	\N
7	VENDUTO DA RITIRARE (CLIENTE ASSEGANTO)	#f23131	2025-11-28 09:58:52.81729	Animali a cui abbiamo già assegnato un cliente, stiamo aspettando il ritiro 	0	2025-11-28 10:45:22.615
15	CESTE DA VAGLIARE CON LA RETE DEL 2500	#3ef73b	2025-11-28 10:46:04.281428	Raggruppa i +2000 che hanno bisogno di una vagliatura intermedia 	0	\N
8	PRONTO VENDITA DA CONFEZIONARE	#ff00dd	2025-11-28 10:01:23.459169	Animali pronti per la vendita ma in attesa di essere assegnati al cliente 	0	2025-12-11 07:52:42.317
\.


--
-- TOC entry 4336 (class 0 OID 393228)
-- Dependencies: 304
-- Data for Name: basket_growth_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.basket_growth_profiles (id, basket_id, analysis_run_id, growth_cluster, sgr_deviation, confidence_score, influencing_factors, position_score, density_score, supplier_score, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4252 (class 0 OID 16502)
-- Dependencies: 220
-- Data for Name: basket_lot_composition; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.basket_lot_composition (id, basket_id, cycle_id, lot_id, animal_count, percentage, source_selection_id, created_at, notes) FROM stdin;
1	88	75	5	555560	1	1	2025-12-01 11:28:07.15372	Da vagliatura #1 del 2025-12-01
2	92	76	5	555560	1	1	2025-12-01 11:28:07.15372	Da vagliatura #1 del 2025-12-01
5	99	79	5	3532130	1	3	2025-12-03 14:20:09.896741	Da vagliatura #2 del 2025-12-03
6	100	80	5	3532130	1	3	2025-12-03 14:20:09.896741	Da vagliatura #2 del 2025-12-03
9	83	83	5	506000	1	9	2025-12-03 15:10:53.626346	Da vagliatura #6 del 2025-12-03
10	86	84	5	506000	1	9	2025-12-03 15:10:53.626346	Da vagliatura #6 del 2025-12-03
11	6	85	4	251863	1	10	2025-12-04 13:05:12.137741	Da vagliatura #7 del 2025-12-03
12	10	86	4	216534	1	10	2025-12-04 13:05:12.137741	Da vagliatura #7 del 2025-12-03
13	21	87	3	319102	1	11	2025-12-04 13:06:49.636694	Da vagliatura #8 del 2025-12-03
14	22	88	3	455860	1	11	2025-12-04 13:06:49.636694	Da vagliatura #8 del 2025-12-03
15	8	89	4	283773	1	12	2025-12-04 13:12:18.729467	Da vagliatura #9 del 2025-12-04
17	97	91	5	3476369	1	13	2025-12-05 08:24:19.857006	Da vagliatura #10 del 2025-12-04
18	83	92	5	3476369	1	13	2025-12-05 08:24:19.857006	Da vagliatura #10 del 2025-12-04
19	86	100	3	301061	1	14	2025-12-09 07:19:52.785746	Da vagliatura #11 del 2025-12-04
24	81	105	5	540923	1	15	2025-12-09 11:09:06.328571	Da vagliatura #12 del 2025-12-09
25	84	106	5	535806	1	15	2025-12-09 11:09:06.328571	Da vagliatura #12 del 2025-12-09
26	88	107	5	568697	1	15	2025-12-09 11:09:06.328571	Da vagliatura #12 del 2025-12-09
27	92	108	5	181441	1	15	2025-12-09 11:09:06.328571	Da vagliatura #12 del 2025-12-09
29	25	110	3	337061	1	16	2025-12-10 15:01:44.829099	Da vagliatura #13 del 2025-12-10
30	29	111	3	293586	1	16	2025-12-10 15:01:44.829099	Da vagliatura #13 del 2025-12-10
31	30	112	3	280320	1	16	2025-12-10 15:01:44.829099	Da vagliatura #13 del 2025-12-10
32	31	113	3	256520	1	16	2025-12-10 15:01:44.829099	Da vagliatura #13 del 2025-12-10
33	34	114	3	403153	1	16	2025-12-10 15:01:44.829099	Da vagliatura #13 del 2025-12-10
34	35	115	3	703152	1	16	2025-12-10 15:01:44.829099	Da vagliatura #13 del 2025-12-10
35	36	116	3	208815	1	16	2025-12-10 15:01:44.829099	Da vagliatura #13 del 2025-12-10
36	37	117	3	211636	1	16	2025-12-10 15:01:44.829099	Da vagliatura #13 del 2025-12-10
37	21	118	3	245725	1	16	2025-12-10 15:01:44.829099	Da vagliatura #13 del 2025-12-10
38	22	119	3	235022	1	16	2025-12-10 15:01:44.829099	Da vagliatura #13 del 2025-12-10
39	89	121	5	182229	1	17	2025-12-12 09:59:31.591822	Da vagliatura #14 del 2025-12-11
41	91	123	5	400388	1	17	2025-12-12 09:59:31.591822	Da vagliatura #14 del 2025-12-11
42	93	124	5	584796	1	17	2025-12-12 09:59:31.591822	Da vagliatura #14 del 2025-12-11
47	133	147	10	1568332	0.27601513	19	2026-01-28 12:42:50.011616	Da vagliatura #16 del 2026-01-22
48	133	147	11	2634966	0.463735	19	2026-01-28 12:42:50.011616	Da vagliatura #16 del 2026-01-22
49	133	147	20	574677	0.10113901	19	2026-01-28 12:42:50.011616	Da vagliatura #16 del 2026-01-22
50	133	147	23	904076	0.15911086	19	2026-01-28 12:42:50.011616	Da vagliatura #16 del 2026-01-22
51	135	148	10	527349	0.27601528	19	2026-01-28 12:42:50.011616	Da vagliatura #16 del 2026-01-22
52	135	148	11	886002	0.4637348	19	2026-01-28 12:42:50.011616	Da vagliatura #16 del 2026-01-22
53	135	148	20	193234	0.10113897	19	2026-01-28 12:42:50.011616	Da vagliatura #16 del 2026-01-22
54	135	148	23	303994	0.15911093	19	2026-01-28 12:42:50.011616	Da vagliatura #16 del 2026-01-22
55	134	149	10	89123	0.27601576	19	2026-01-28 12:42:50.011616	Da vagliatura #16 del 2026-01-22
56	134	149	11	149736	0.46373543	19	2026-01-28 12:42:50.011616	Da vagliatura #16 del 2026-01-22
57	134	149	20	32657	0.1011394	19	2026-01-28 12:42:50.011616	Da vagliatura #16 del 2026-01-22
58	134	149	23	51375	0.15910941	19	2026-01-28 12:42:50.011616	Da vagliatura #16 del 2026-01-22
59	136	150	10	1621910	0.27601543	19	2026-01-28 12:42:50.011616	Da vagliatura #16 del 2026-01-22
60	136	150	11	2724979	0.4637349	19	2026-01-28 12:42:50.011616	Da vagliatura #16 del 2026-01-22
61	136	150	20	594308	0.10113889	19	2026-01-28 12:42:50.011616	Da vagliatura #16 del 2026-01-22
62	136	150	23	934960	0.1591108	19	2026-01-28 12:42:50.011616	Da vagliatura #16 del 2026-01-22
63	137	151	10	866754	0.27601504	19	2026-01-28 12:42:50.011616	Da vagliatura #16 del 2026-01-22
64	137	151	11	1456240	0.46373495	19	2026-01-28 12:42:50.011616	Da vagliatura #16 del 2026-01-22
65	137	151	20	317601	0.101139024	19	2026-01-28 12:42:50.011616	Da vagliatura #16 del 2026-01-22
66	137	151	23	499647	0.159111	19	2026-01-28 12:42:50.011616	Da vagliatura #16 del 2026-01-22
67	116	158	11	1199474	1	20	2026-02-03 12:33:39.843535	Da vagliatura #17 del 2026-02-03
68	117	159	11	1199474	1	20	2026-02-03 12:33:39.843535	Da vagliatura #17 del 2026-02-03
69	137	160	11	231295	1	20	2026-02-03 12:33:39.843535	Da vagliatura #17 del 2026-02-03
70	81	164	5	3033538	1	21	2026-02-12 15:57:56.581255	Da vagliatura #18 del 2026-02-11
71	127	165	5	1408271	1	21	2026-02-12 15:57:56.581255	Da vagliatura #18 del 2026-02-11
72	120	166	5	783785	1	21	2026-02-12 15:57:56.581255	Da vagliatura #18 del 2026-02-11
73	128	167	5	1603477	1	21	2026-02-12 15:57:56.581255	Da vagliatura #18 del 2026-02-11
74	129	168	5	740903	1	21	2026-02-12 15:57:56.581255	Da vagliatura #18 del 2026-02-11
75	87	169	5	3166323	1	21	2026-02-12 15:57:56.581255	Da vagliatura #18 del 2026-02-11
76	118	170	5	4684586	1	21	2026-02-12 15:57:56.581255	Da vagliatura #18 del 2026-02-11
77	133	171	11	4932700	1	22	2026-02-16 08:51:35.575035	Da vagliatura #19 del 2026-02-13
78	136	172	11	4850384	1	22	2026-02-16 08:51:35.575035	Da vagliatura #19 del 2026-02-13
79	146	173	11	1883744	1	23	2026-02-16 09:14:43.765441	Da vagliatura #20 del 2026-02-13
80	134	174	11	3653843	1	23	2026-02-16 09:14:43.765441	Da vagliatura #20 del 2026-02-13
81	135	175	11	484656	1	23	2026-02-16 09:14:43.765441	Da vagliatura #20 del 2026-02-13
82	130	176	11	2115057	1	24	2026-02-16 09:24:08.471824	Da vagliatura #21 del 2026-02-16
83	86	177	5	208618	0.41211098	25	2026-02-16 13:33:04.887111	Da vagliatura #22 del 2026-02-16
84	86	177	25	209116	0.41309476	25	2026-02-16 13:33:04.887111	Da vagliatura #22 del 2026-02-16
85	86	177	24	88484	0.17479426	25	2026-02-16 13:33:04.887111	Da vagliatura #22 del 2026-02-16
86	88	178	5	208618	0.41211098	25	2026-02-16 13:33:04.887111	Da vagliatura #22 del 2026-02-16
87	88	178	25	209116	0.41309476	25	2026-02-16 13:33:04.887111	Da vagliatura #22 del 2026-02-16
88	88	178	24	88484	0.17479426	25	2026-02-16 13:33:04.887111	Da vagliatura #22 del 2026-02-16
89	84	179	5	208618	0.41211098	25	2026-02-16 13:33:04.887111	Da vagliatura #22 del 2026-02-16
90	84	179	25	209116	0.41309476	25	2026-02-16 13:33:04.887111	Da vagliatura #22 del 2026-02-16
91	84	179	24	88484	0.17479426	25	2026-02-16 13:33:04.887111	Da vagliatura #22 del 2026-02-16
92	90	180	5	208618	0.41211098	25	2026-02-16 13:33:04.887111	Da vagliatura #22 del 2026-02-16
93	90	180	25	209116	0.41309476	25	2026-02-16 13:33:04.887111	Da vagliatura #22 del 2026-02-16
94	90	180	24	88484	0.17479426	25	2026-02-16 13:33:04.887111	Da vagliatura #22 del 2026-02-16
95	91	181	5	271967	0.4121124	25	2026-02-16 13:33:04.887111	Da vagliatura #22 del 2026-02-16
96	91	181	25	272615	0.41309434	25	2026-02-16 13:33:04.887111	Da vagliatura #22 del 2026-02-16
97	91	181	24	115352	0.17479324	25	2026-02-16 13:33:04.887111	Da vagliatura #22 del 2026-02-16
98	92	182	5	56627	0.41210845	25	2026-02-16 13:33:04.887111	Da vagliatura #22 del 2026-02-16
99	92	182	25	56763	0.41309822	25	2026-02-16 13:33:04.887111	Da vagliatura #22 del 2026-02-16
100	92	182	24	24018	0.17479332	25	2026-02-16 13:33:04.887111	Da vagliatura #22 del 2026-02-16
101	151	191	27	735118	0.5758775	26	2026-02-24 14:18:33.244495	Da vagliatura #23 del 2026-02-24
102	151	191	28	541400	0.42412248	26	2026-02-24 14:18:33.244495	Da vagliatura #23 del 2026-02-24
103	131	192	27	1908036	0.57587785	26	2026-02-24 14:18:33.244495	Da vagliatura #23 del 2026-02-24
104	131	192	28	1405229	0.42412212	26	2026-02-24 14:18:33.244495	Da vagliatura #23 del 2026-02-24
105	132	193	27	741337	0.5758776	26	2026-02-24 14:18:33.244495	Da vagliatura #23 del 2026-02-24
106	132	193	28	545980	0.42412242	26	2026-02-24 14:18:33.244495	Da vagliatura #23 del 2026-02-24
107	83	197	5	634206	0.9614324	27	2026-02-25 14:39:31.296827	Da vagliatura #24 del 2026-02-25
108	83	197	26	25441	0.0385676	27	2026-02-25 14:39:31.296827	Da vagliatura #24 del 2026-02-25
109	85	198	5	634206	0.9614324	27	2026-02-25 14:39:31.296827	Da vagliatura #24 del 2026-02-25
110	85	198	26	25441	0.0385676	27	2026-02-25 14:39:31.296827	Da vagliatura #24 del 2026-02-25
111	97	199	5	154517	0.96143484	27	2026-02-25 14:39:31.296827	Da vagliatura #24 del 2026-02-25
112	97	199	26	6198	0.038565163	27	2026-02-25 14:39:31.296827	Da vagliatura #24 del 2026-02-25
113	99	200	5	154517	0.96143484	27	2026-02-25 14:39:31.296827	Da vagliatura #24 del 2026-02-25
114	99	200	26	6198	0.038565163	27	2026-02-25 14:39:31.296827	Da vagliatura #24 del 2026-02-25
115	100	201	5	154517	0.96143484	27	2026-02-25 14:39:31.296827	Da vagliatura #24 del 2026-02-25
116	100	201	26	6198	0.038565163	27	2026-02-25 14:39:31.296827	Da vagliatura #24 del 2026-02-25
117	95	202	5	154517	0.96143484	27	2026-02-25 14:39:31.296827	Da vagliatura #24 del 2026-02-25
118	95	202	26	6198	0.038565163	27	2026-02-25 14:39:31.296827	Da vagliatura #24 del 2026-02-25
119	92	203	5	652734	0.96143275	27	2026-02-25 14:39:31.296827	Da vagliatura #24 del 2026-02-25
120	92	203	26	26184	0.03856725	27	2026-02-25 14:39:31.296827	Da vagliatura #24 del 2026-02-25
121	91	204	5	652734	0.96143275	27	2026-02-25 14:39:31.296827	Da vagliatura #24 del 2026-02-25
122	91	204	26	26184	0.03856725	27	2026-02-25 14:39:31.296827	Da vagliatura #24 del 2026-02-25
123	93	205	5	652734	0.96143275	27	2026-02-25 14:39:31.296827	Da vagliatura #24 del 2026-02-25
124	93	205	26	26184	0.03856725	27	2026-02-25 14:39:31.296827	Da vagliatura #24 del 2026-02-25
125	98	206	5	652734	0.96143275	27	2026-02-25 14:39:31.296827	Da vagliatura #24 del 2026-02-25
126	98	206	26	26184	0.03856725	27	2026-02-25 14:39:31.296827	Da vagliatura #24 del 2026-02-25
127	96	207	5	652734	0.96143275	27	2026-02-25 14:39:31.296827	Da vagliatura #24 del 2026-02-25
128	96	207	26	26184	0.03856725	27	2026-02-25 14:39:31.296827	Da vagliatura #24 del 2026-02-25
129	112	208	5	83004	0.9614289	27	2026-02-25 14:39:31.296827	Da vagliatura #24 del 2026-02-25
130	112	208	26	3330	0.03857113	27	2026-02-25 14:39:31.296827	Da vagliatura #24 del 2026-02-25
131	82	209	5	634206	0.9614324	27	2026-02-25 14:39:31.296827	Da vagliatura #24 del 2026-02-25
132	82	209	26	25441	0.0385676	27	2026-02-25 14:39:31.296827	Da vagliatura #24 del 2026-02-25
133	138	210	34	1001941	0.50912905	28	2026-02-26 08:22:25.611776	Da vagliatura #25 del 2026-02-25
134	138	210	30	966010	0.49087095	28	2026-02-26 08:22:25.611776	Da vagliatura #25 del 2026-02-25
135	139	211	34	2435483	0.50912917	28	2026-02-26 08:22:25.611776	Da vagliatura #25 del 2026-02-25
136	139	211	30	2348142	0.49087083	28	2026-02-26 08:22:25.611776	Da vagliatura #25 del 2026-02-25
137	155	212	34	1632881	0.5091291	28	2026-02-26 08:22:25.611776	Da vagliatura #25 del 2026-02-25
138	155	212	30	1574323	0.49087086	28	2026-02-26 08:22:25.611776	Da vagliatura #25 del 2026-02-25
139	119	213	27	1287317	0.39545652	29	2026-02-26 08:32:21.258031	Da vagliatura #26 del 2026-02-26
140	119	213	34	1967951	0.60454345	29	2026-02-26 08:32:21.258031	Da vagliatura #26 del 2026-02-26
141	140	225	32	765591	0.28575453	30	2026-03-03 11:42:03.676182	Da vagliatura #27 del 2026-03-02
142	140	225	33	409665	0.15290624	30	2026-03-03 11:42:03.676182	Da vagliatura #27 del 2026-03-02
143	140	225	31	1503935	0.5613392	30	2026-03-03 11:42:03.676182	Da vagliatura #27 del 2026-03-02
144	141	226	32	2368440	0.2857546	30	2026-03-03 11:42:03.676182	Da vagliatura #27 del 2026-03-02
145	141	226	33	1267342	0.15290605	30	2026-03-03 11:42:03.676182	Da vagliatura #27 del 2026-03-02
146	141	226	31	4652589	0.5613394	30	2026-03-03 11:42:03.676182	Da vagliatura #27 del 2026-03-02
147	142	227	32	190426	0.2857533	30	2026-03-03 11:42:03.676182	Da vagliatura #27 del 2026-03-02
148	142	227	33	101897	0.15290666	30	2026-03-03 11:42:03.676182	Da vagliatura #27 del 2026-03-02
149	142	227	31	374077	0.56134003	30	2026-03-03 11:42:03.676182	Da vagliatura #27 del 2026-03-02
150	119	228	31	2679190	0.45146337	31	2026-03-03 11:45:49.347364	Da vagliatura #28 del 2026-03-03
151	119	228	34	3255267	0.5485366	31	2026-03-03 11:45:49.347364	Da vagliatura #28 del 2026-03-03
152	157	237	34	5934457	0.7372441	32	2026-03-06 07:21:06.267131	Da vagliatura #29 del 2026-03-06
153	157	237	11	2115057	0.26275587	32	2026-03-06 07:21:06.267131	Da vagliatura #29 del 2026-03-06
158	81	281	55	57120	1	35	2026-03-14 15:45:00.15035	Da vagliatura #32 del 2026-03-14
159	82	282	55	221850	1	35	2026-03-14 15:45:00.15035	Da vagliatura #32 del 2026-03-14
160	83	283	55	517920	1	35	2026-03-14 15:45:00.15035	Da vagliatura #32 del 2026-03-14
161	81	286	56	28860	1	36	2026-03-14 17:23:42.093671	Da vagliatura #30 del 2026-03-14
162	82	287	56	34088	1	36	2026-03-14 17:23:42.093671	Da vagliatura #30 del 2026-03-14
163	101	288	34	4504626	1	37	2026-03-16 09:01:51.57286	Da vagliatura #30 del 2026-03-13
164	102	289	34	3699475	1	37	2026-03-16 09:01:51.57286	Da vagliatura #30 del 2026-03-13
165	24	294	25	250516	0.40638626	38	2026-03-17 07:03:11.002309	Da vagliatura #31 del 2026-03-16
166	24	294	5	295895	0.47999993	38	2026-03-17 07:03:11.002309	Da vagliatura #31 del 2026-03-16
167	24	294	24	70037	0.1136138	38	2026-03-17 07:03:11.002309	Da vagliatura #31 del 2026-03-16
168	21	295	25	86749	0.40638322	38	2026-03-17 07:03:11.002309	Da vagliatura #31 del 2026-03-16
169	21	295	5	102464	0.4800015	38	2026-03-17 07:03:11.002309	Da vagliatura #31 del 2026-03-16
170	21	295	24	24253	0.11361528	38	2026-03-17 07:03:11.002309	Da vagliatura #31 del 2026-03-16
171	25	296	25	160782	0.40638664	38	2026-03-17 07:03:11.002309	Da vagliatura #31 del 2026-03-16
172	25	296	5	189906	0.4799994	38	2026-03-17 07:03:11.002309	Da vagliatura #31 del 2026-03-16
173	25	296	24	44950	0.11361396	38	2026-03-17 07:03:11.002309	Da vagliatura #31 del 2026-03-16
174	26	297	25	189540	0.40638676	38	2026-03-17 07:03:11.002309	Da vagliatura #31 del 2026-03-16
175	26	297	5	223873	0.47999907	38	2026-03-17 07:03:11.002309	Da vagliatura #31 del 2026-03-16
176	26	297	24	52990	0.113614194	38	2026-03-17 07:03:11.002309	Da vagliatura #31 del 2026-03-16
177	28	298	25	172546	0.4063855	38	2026-03-17 07:03:11.002309	Da vagliatura #31 del 2026-03-16
178	28	298	5	203802	0.48000056	38	2026-03-17 07:03:11.002309	Da vagliatura #31 del 2026-03-16
179	28	298	24	48239	0.11361393	38	2026-03-17 07:03:11.002309	Da vagliatura #31 del 2026-03-16
180	4	299	25	260733	0.40638506	38	2026-03-17 07:03:11.002309	Da vagliatura #31 del 2026-03-16
181	4	299	5	307964	0.4800005	38	2026-03-17 07:03:11.002309	Da vagliatura #31 del 2026-03-16
182	4	299	24	72894	0.11361444	38	2026-03-17 07:03:11.002309	Da vagliatura #31 del 2026-03-16
183	16	300	25	97065	0.40638646	38	2026-03-17 07:03:11.002309	Da vagliatura #31 del 2026-03-16
184	16	300	5	114647	0.4799978	38	2026-03-17 07:03:11.002309	Da vagliatura #31 del 2026-03-16
185	16	300	24	27137	0.113615714	38	2026-03-17 07:03:11.002309	Da vagliatura #31 del 2026-03-16
186	7	301	25	68760	0.40638298	38	2026-03-17 07:03:11.002309	Da vagliatura #31 del 2026-03-16
187	7	301	5	81216	0.48	38	2026-03-17 07:03:11.002309	Da vagliatura #31 del 2026-03-16
188	7	301	24	19224	0.11361702	38	2026-03-17 07:03:11.002309	Da vagliatura #31 del 2026-03-16
189	133	302	11	2309153	1	39	2026-03-17 08:01:18.441629	Da vagliatura #32 del 2026-03-16
190	135	303	11	2361854	1	39	2026-03-17 08:01:18.441629	Da vagliatura #32 del 2026-03-16
191	134	304	11	3092980	1	39	2026-03-17 08:01:18.441629	Da vagliatura #32 del 2026-03-16
192	11	305	5	397091	0.5728607	40	2026-03-17 15:15:12.978123	Da vagliatura #33 del 2026-03-17
193	11	305	25	296081	0.42713928	40	2026-03-17 15:15:12.978123	Da vagliatura #33 del 2026-03-17
194	12	306	5	364453	0.57286006	40	2026-03-17 15:15:12.978123	Da vagliatura #33 del 2026-03-17
195	12	306	25	271746	0.42713994	40	2026-03-17 15:15:12.978123	Da vagliatura #33 del 2026-03-17
196	13	307	5	275153	0.57286185	40	2026-03-17 15:15:12.978123	Da vagliatura #33 del 2026-03-17
197	13	307	25	205160	0.42713815	40	2026-03-17 15:15:12.978123	Da vagliatura #33 del 2026-03-17
198	1	308	5	254179	0.5728597	40	2026-03-17 15:15:12.978123	Da vagliatura #33 del 2026-03-17
199	1	308	25	189523	0.4271403	40	2026-03-17 15:15:12.978123	Da vagliatura #33 del 2026-03-17
200	3	309	5	181044	1	41	2026-03-17 15:30:28.268137	Da vagliatura #34 del 2026-03-17
201	9	310	5	523099	1	41	2026-03-17 15:30:28.268137	Da vagliatura #34 del 2026-03-17
202	14	311	5	538565	1	41	2026-03-17 15:30:28.268137	Da vagliatura #34 del 2026-03-17
203	15	312	5	573276	1	41	2026-03-17 15:30:28.268137	Da vagliatura #34 del 2026-03-17
204	5	313	5	703361	1	41	2026-03-17 15:30:28.268137	Da vagliatura #34 del 2026-03-17
205	22	314	5	408316	1	42	2026-03-18 13:45:17.993658	Da vagliatura #35 del 2026-03-18
206	27	315	5	570603	1	42	2026-03-18 13:45:17.993658	Da vagliatura #35 del 2026-03-18
207	30	316	5	620221	1	42	2026-03-18 13:45:17.993658	Da vagliatura #35 del 2026-03-18
208	38	317	5	520986	1	42	2026-03-18 13:45:17.993658	Da vagliatura #35 del 2026-03-18
209	23	318	5	396944	1	43	2026-03-18 13:53:23.761793	Da vagliatura #36 del 2026-03-18
210	32	319	5	477274	1	43	2026-03-18 13:53:23.761793	Da vagliatura #36 del 2026-03-18
211	33	320	5	496365	1	43	2026-03-18 13:53:23.761793	Da vagliatura #36 del 2026-03-18
212	39	321	5	501138	1	43	2026-03-18 13:53:23.761793	Da vagliatura #36 del 2026-03-18
213	29	322	5	346482	0.8687548	44	2026-03-19 13:21:53.731695	Da vagliatura #37 del 2026-03-19
214	29	322	11	52344	0.13124521	44	2026-03-19 13:21:53.731695	Da vagliatura #37 del 2026-03-19
215	31	323	5	529813	0.8687553	44	2026-03-19 13:21:53.731695	Da vagliatura #37 del 2026-03-19
216	31	323	11	80040	0.13124475	44	2026-03-19 13:21:53.731695	Da vagliatura #37 del 2026-03-19
217	34	324	5	496868	0.86875516	44	2026-03-19 13:21:53.731695	Da vagliatura #37 del 2026-03-19
218	34	324	11	75063	0.13124485	44	2026-03-19 13:21:53.731695	Da vagliatura #37 del 2026-03-19
219	35	325	5	546321	0.8687551	44	2026-03-19 13:21:53.731695	Da vagliatura #37 del 2026-03-19
220	35	325	11	82534	0.13124488	44	2026-03-19 13:21:53.731695	Da vagliatura #37 del 2026-03-19
221	36	326	5	608758	0.86875576	44	2026-03-19 13:21:53.731695	Da vagliatura #37 del 2026-03-19
222	36	326	11	91966	0.13124426	44	2026-03-19 13:21:53.731695	Da vagliatura #37 del 2026-03-19
223	37	327	5	196513	0.8687577	44	2026-03-19 13:21:53.731695	Da vagliatura #37 del 2026-03-19
224	37	327	11	29687	0.13124226	44	2026-03-19 13:21:53.731695	Da vagliatura #37 del 2026-03-19
225	2	328	5	529459	0.8700995	45	2026-03-19 14:20:24.524808	Da vagliatura #38 del 2026-03-19
226	2	328	11	79045	0.12990054	45	2026-03-19 14:20:24.524808	Da vagliatura #38 del 2026-03-19
227	6	329	5	557325	0.8700984	45	2026-03-19 14:20:24.524808	Da vagliatura #38 del 2026-03-19
228	6	329	11	83206	0.1299016	45	2026-03-19 14:20:24.524808	Da vagliatura #38 del 2026-03-19
229	8	330	5	512739	0.8700992	45	2026-03-19 14:20:24.524808	Da vagliatura #38 del 2026-03-19
230	8	330	11	76549	0.12990083	45	2026-03-19 14:20:24.524808	Da vagliatura #38 del 2026-03-19
231	10	331	5	519564	0.87009907	45	2026-03-19 14:20:24.524808	Da vagliatura #38 del 2026-03-19
232	10	331	11	77568	0.12990093	45	2026-03-19 14:20:24.524808	Da vagliatura #38 del 2026-03-19
233	17	332	5	479299	0.87009853	45	2026-03-19 14:20:24.524808	Da vagliatura #38 del 2026-03-19
234	17	332	11	71557	0.12990147	45	2026-03-19 14:20:24.524808	Da vagliatura #38 del 2026-03-19
235	40	333	5	258991	0.8700988	45	2026-03-19 14:20:24.524808	Da vagliatura #38 del 2026-03-19
236	40	333	11	38666	0.1299012	45	2026-03-19 14:20:24.524808	Da vagliatura #38 del 2026-03-19
237	27	334	5	617461	1	46	2026-03-20 13:40:51.891351	Da vagliatura #39 del 2026-03-20
238	30	335	5	688706	1	46	2026-03-20 13:40:51.891351	Da vagliatura #39 del 2026-03-20
239	31	336	5	799755	1	46	2026-03-20 13:40:51.891351	Da vagliatura #39 del 2026-03-20
240	32	337	5	633658	1	47	2026-03-20 13:45:27.461093	Da vagliatura #40 del 2026-03-20
241	35	338	5	639216	1	47	2026-03-20 13:45:27.461093	Da vagliatura #40 del 2026-03-20
242	36	339	5	762870	1	47	2026-03-20 13:45:27.461093	Da vagliatura #40 del 2026-03-20
243	38	340	5	762870	1	47	2026-03-20 13:45:27.461093	Da vagliatura #40 del 2026-03-20
276	20	246	5	182158	100	\N	2026-03-28 05:59:59.55484	\N
244	33	341	5	431087	1	48	2026-03-20 13:58:19.636768	Da vagliatura #41 del 2026-03-20
245	34	342	5	431087	1	48	2026-03-20 13:58:19.636768	Da vagliatura #41 del 2026-03-20
246	39	343	5	959853	1	48	2026-03-20 13:58:19.636768	Da vagliatura #41 del 2026-03-20
247	33	352	5	555471	1	49	2026-03-23 16:55:58.69248	Da vagliatura #42 del 2026-03-23
248	31	353	5	167201	1	49	2026-03-23 16:55:58.69248	Da vagliatura #42 del 2026-03-23
249	34	354	5	568592	1	49	2026-03-23 16:55:58.69248	Da vagliatura #42 del 2026-03-23
250	2	355	5	687147	1	49	2026-03-23 16:55:58.69248	Da vagliatura #42 del 2026-03-23
251	6	356	5	791713	1	49	2026-03-23 16:55:58.69248	Da vagliatura #42 del 2026-03-23
252	8	357	5	725730	1	49	2026-03-23 16:55:58.69248	Da vagliatura #42 del 2026-03-23
253	104	359	44	24417	0.005122473	50	2026-03-25 11:29:57.107336	Da vagliatura #43 del 2026-03-24
254	104	359	35	1143722	0.23994286	50	2026-03-25 11:29:57.107336	Da vagliatura #43 del 2026-03-24
255	104	359	36	576966	0.121042415	50	2026-03-25 11:29:57.107336	Da vagliatura #43 del 2026-03-24
256	104	359	37	2092359	0.43895862	50	2026-03-25 11:29:57.107336	Da vagliatura #43 del 2026-03-24
257	104	359	11	669376	0.14042923	50	2026-03-25 11:29:57.107336	Da vagliatura #43 del 2026-03-24
258	104	359	43	259803	0.0545044	50	2026-03-25 11:29:57.107336	Da vagliatura #43 del 2026-03-24
259	135	360	44	21631	0.00512233	50	2026-03-25 11:29:57.107336	Da vagliatura #43 del 2026-03-24
260	135	360	35	1013251	0.23994295	50	2026-03-25 11:29:57.107336	Da vagliatura #43 del 2026-03-24
261	135	360	36	511148	0.12104242	50	2026-03-25 11:29:57.107336	Da vagliatura #43 del 2026-03-24
262	135	360	37	1853671	0.43895864	50	2026-03-25 11:29:57.107336	Da vagliatura #43 del 2026-03-24
263	135	360	11	593016	0.14042918	50	2026-03-25 11:29:57.107336	Da vagliatura #43 del 2026-03-24
264	135	360	43	230166	0.05450447	50	2026-03-25 11:29:57.107336	Da vagliatura #43 del 2026-03-24
265	143	361	44	40068	0.005122455	50	2026-03-25 11:29:57.107336	Da vagliatura #43 del 2026-03-24
266	143	361	35	1876841	0.23994292	50	2026-03-25 11:29:57.107336	Da vagliatura #43 del 2026-03-24
267	143	361	36	946797	0.12104235	50	2026-03-25 11:29:57.107336	Da vagliatura #43 del 2026-03-24
268	143	361	37	3433548	0.43895862	50	2026-03-25 11:29:57.107336	Da vagliatura #43 del 2026-03-24
269	143	361	11	1098442	0.14042926	50	2026-03-25 11:29:57.107336	Da vagliatura #43 del 2026-03-24
270	143	361	43	426335	0.054504387	50	2026-03-25 11:29:57.107336	Da vagliatura #43 del 2026-03-24
271	22	367	5	399293	1	51	2026-03-27 14:33:59.555841	Da vagliatura #44 del 2026-03-27
272	23	368	5	380879	1	51	2026-03-27 14:33:59.555841	Da vagliatura #44 del 2026-03-27
273	29	369	5	192268	1	51	2026-03-27 14:33:59.555841	Da vagliatura #44 del 2026-03-27
274	37	370	5	444331	1	51	2026-03-27 14:33:59.555841	Da vagliatura #44 del 2026-03-27
275	40	371	5	528167	1	51	2026-03-27 14:33:59.555841	Da vagliatura #44 del 2026-03-27
277	1	372	5	101600	1	52	2026-03-31 13:30:33.441222	Da vagliatura #45 del 2026-03-31
278	3	373	5	306250	1	52	2026-03-31 13:30:33.441222	Da vagliatura #45 del 2026-03-31
279	14	374	5	337968	1	52	2026-03-31 13:30:33.441222	Da vagliatura #45 del 2026-03-31
280	17	375	5	141594	1	52	2026-03-31 13:30:33.441222	Da vagliatura #45 del 2026-03-31
281	21	376	5	231561	1	53	2026-03-31 13:43:13.92346	Da vagliatura #46 del 2026-03-31
282	22	377	5	275252	1	53	2026-03-31 13:43:13.92346	Da vagliatura #46 del 2026-03-31
283	23	378	5	384479	1	53	2026-03-31 13:43:13.92346	Da vagliatura #46 del 2026-03-31
284	29	379	5	297098	1	53	2026-03-31 13:43:13.92346	Da vagliatura #46 del 2026-03-31
285	31	380	5	463123	1	53	2026-03-31 13:43:13.92346	Da vagliatura #46 del 2026-03-31
286	36	381	5	425986	1	53	2026-03-31 13:43:13.92346	Da vagliatura #46 del 2026-03-31
287	7	382	5	163505	1	53	2026-03-31 13:43:13.92346	Da vagliatura #46 del 2026-03-31
288	14	383	5	250138	1	53	2026-03-31 13:43:13.92346	Da vagliatura #46 del 2026-03-31
289	16	386	31	1647650	0.33806202	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
290	16	386	27	609631	0.12508304	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
291	16	386	34	771658	0.15832748	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
292	16	386	42	237137	0.048655365	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
293	16	386	41	455953	0.09355166	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
294	16	386	46	505454	0.103708185	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
295	16	386	64	646327	0.13261227	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
296	17	387	31	1647650	0.33806202	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
297	17	387	27	609631	0.12508304	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
298	17	387	34	771658	0.15832748	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
299	17	387	42	237137	0.048655365	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
300	17	387	41	455953	0.09355166	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
301	17	387	46	505454	0.103708185	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
302	17	387	64	646327	0.13261227	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
303	131	388	31	2924892	0.33806226	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
304	131	388	27	1082210	0.12508303	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
305	131	388	34	1369839	0.1583275	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
306	131	388	42	420962	0.048655253	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
307	131	388	41	809402	0.093551576	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
308	131	388	46	897276	0.103708155	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
309	131	388	64	1147352	0.13261221	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
310	139	389	31	2796228	0.3380623	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
311	139	389	27	1034604	0.125083	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
312	139	389	34	1309581	0.15832755	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
313	139	389	42	402444	0.048655234	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
314	139	389	41	773797	0.09355159	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
315	139	389	46	857806	0.10370823	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
316	139	389	64	1096880	0.13261212	54	2026-04-02 12:27:57.811588	Da vagliatura #47 del 2026-03-31
317	61	393	27	366130	0.19366834	55	2026-04-03 08:09:07.819802	Da vagliatura #48 del 2026-04-03
318	61	393	47	1524370	0.80633163	55	2026-04-03 08:09:07.819802	Da vagliatura #48 del 2026-04-03
335	14	402	5	36648	1	59	2026-04-07 08:22:13.651501	Da vagliatura #48 del 2026-04-07
336	21	403	5	154603	1	59	2026-04-07 08:22:13.651501	Da vagliatura #48 del 2026-04-07
337	113	440	47	1229912	0.2713468	60	2026-04-14 08:51:53.727406	Da vagliatura #49 del 2026-04-13
338	113	440	48	439612	0.0969885	60	2026-04-14 08:51:53.727406	Da vagliatura #49 del 2026-04-13
339	113	440	66	421674	0.09303096	60	2026-04-14 08:51:53.727406	Da vagliatura #49 del 2026-04-13
340	113	440	50	229974	0.05073754	60	2026-04-14 08:51:53.727406	Da vagliatura #49 del 2026-04-13
341	113	440	40	1137024	0.2508536	60	2026-04-14 08:51:53.727406	Da vagliatura #49 del 2026-04-13
342	113	440	51	1074424	0.23704259	60	2026-04-14 08:51:53.727406	Da vagliatura #49 del 2026-04-13
343	132	441	47	1617477	0.27134684	60	2026-04-14 08:51:53.727406	Da vagliatura #49 del 2026-04-13
344	132	441	48	578141	0.09698854	60	2026-04-14 08:51:53.727406	Da vagliatura #49 del 2026-04-13
345	132	441	66	554550	0.09303093	60	2026-04-14 08:51:53.727406	Da vagliatura #49 del 2026-04-13
346	132	441	50	302443	0.05073763	60	2026-04-14 08:51:53.727406	Da vagliatura #49 del 2026-04-13
347	132	441	40	1495318	0.2508535	60	2026-04-14 08:51:53.727406	Da vagliatura #49 del 2026-04-13
348	132	441	51	1412992	0.23704256	60	2026-04-14 08:51:53.727406	Da vagliatura #49 del 2026-04-13
349	137	442	47	539048	0.27134678	60	2026-04-14 08:51:53.727406	Da vagliatura #49 del 2026-04-13
350	137	442	48	192674	0.09698852	60	2026-04-14 08:51:53.727406	Da vagliatura #49 del 2026-04-13
351	137	442	66	184812	0.09303094	60	2026-04-14 08:51:53.727406	Da vagliatura #49 del 2026-04-13
352	137	442	50	100794	0.05073783	60	2026-04-14 08:51:53.727406	Da vagliatura #49 del 2026-04-13
353	137	442	40	498337	0.2508536	60	2026-04-14 08:51:53.727406	Da vagliatura #49 del 2026-04-13
354	137	442	51	470900	0.23704234	60	2026-04-14 08:51:53.727406	Da vagliatura #49 del 2026-04-13
355	81	443	5	395255	1	61	2026-04-14 11:07:41.547099	Da vagliatura #50 del 2026-04-14
356	97	444	5	305639	1	61	2026-04-14 11:07:41.547099	Da vagliatura #50 del 2026-04-14
357	86	445	5	395692	1	61	2026-04-14 11:07:41.547099	Da vagliatura #50 del 2026-04-14
358	112	446	5	395692	1	61	2026-04-14 11:07:41.547099	Da vagliatura #50 del 2026-04-14
359	100	447	5	415152	1	61	2026-04-14 11:07:41.547099	Da vagliatura #50 del 2026-04-14
360	88	448	5	626881	1	61	2026-04-14 11:07:41.547099	Da vagliatura #50 del 2026-04-14
361	82	449	5	587701	1	61	2026-04-14 11:07:41.547099	Da vagliatura #50 del 2026-04-14
362	95	450	5	217410	1	61	2026-04-14 11:07:41.547099	Da vagliatura #50 del 2026-04-14
363	122	451	5	194841	1	62	2026-04-15 10:15:43.023309	Da vagliatura #51 del 2026-04-15
364	129	452	5	194018	1	62	2026-04-15 10:15:43.023309	Da vagliatura #51 del 2026-04-15
365	117	453	5	614631	1	62	2026-04-15 10:15:43.023309	Da vagliatura #51 del 2026-04-15
366	91	454	5	116721	1	62	2026-04-15 10:15:43.023309	Da vagliatura #51 del 2026-04-15
367	96	455	5	199952	1	62	2026-04-15 10:15:43.023309	Da vagliatura #51 del 2026-04-15
368	114	458	5	353415	1	63	2026-04-16 12:51:45.281804	Da vagliatura #52 del 2026-04-16
369	115	459	5	353415	1	63	2026-04-16 12:51:45.281804	Da vagliatura #52 del 2026-04-16
370	121	460	5	364694	1	63	2026-04-16 12:51:45.281804	Da vagliatura #52 del 2026-04-16
371	125	461	5	168258	1	63	2026-04-16 12:51:45.281804	Da vagliatura #52 del 2026-04-16
372	123	462	5	498761	1	63	2026-04-16 12:51:45.281804	Da vagliatura #52 del 2026-04-16
373	127	463	5	505688	1	63	2026-04-16 12:51:45.281804	Da vagliatura #52 del 2026-04-16
374	111	464	5	456139	1	63	2026-04-16 12:51:45.281804	Da vagliatura #52 del 2026-04-16
375	120	465	5	456139	1	63	2026-04-16 12:51:45.281804	Da vagliatura #52 del 2026-04-16
376	90	468	5	315931	1	64	2026-04-20 11:38:31.143395	Da vagliatura #53 del 2026-04-20
377	93	469	5	252235	1	64	2026-04-20 11:38:31.143395	Da vagliatura #53 del 2026-04-20
378	117	470	37	2122888	0.33448863	65	2026-04-21 07:45:43.070088	Da vagliatura #54 del 2026-04-20
379	117	470	31	4223779	0.66551137	65	2026-04-21 07:45:43.070088	Da vagliatura #54 del 2026-04-20
380	94	471	5	407846	1	66	2026-04-21 09:30:07.330403	Da vagliatura #55 del 2026-04-21
381	96	472	5	703151	1	66	2026-04-21 09:30:07.330403	Da vagliatura #55 del 2026-04-21
382	93	473	5	431679	1	67	2026-04-21 11:14:13.446294	Da vagliatura #56 del 2026-04-21
383	96	474	5	493151	1	67	2026-04-21 11:14:13.446294	Da vagliatura #56 del 2026-04-21
384	82	475	5	471212	1	68	2026-04-21 11:46:34.516023	Da vagliatura #57 del 2026-04-21
385	88	476	5	518009	1	68	2026-04-21 11:46:34.516023	Da vagliatura #57 del 2026-04-21
386	95	477	5	780768	1	68	2026-04-21 11:46:34.516023	Da vagliatura #57 del 2026-04-21
387	100	478	5	675664	1	68	2026-04-21 11:46:34.516023	Da vagliatura #57 del 2026-04-21
388	112	479	60	623624	0.21201274	69	2026-04-22 08:36:14.407484	Da vagliatura #58 del 2026-04-21
389	112	479	37	901103	0.30634695	69	2026-04-22 08:36:14.407484	Da vagliatura #58 del 2026-04-21
390	112	479	31	952864	0.32394406	69	2026-04-22 08:36:14.407484	Da vagliatura #58 del 2026-04-21
391	112	479	52	212636	0.072289616	69	2026-04-22 08:36:14.407484	Da vagliatura #58 del 2026-04-21
392	112	479	53	251219	0.08540663	69	2026-04-22 08:36:14.407484	Da vagliatura #58 del 2026-04-21
393	131	480	60	1133184	0.21201283	69	2026-04-22 08:36:14.407484	Da vagliatura #58 del 2026-04-21
394	131	480	37	1637389	0.30634695	69	2026-04-22 08:36:14.407484	Da vagliatura #58 del 2026-04-21
395	131	480	31	1731443	0.32394397	69	2026-04-22 08:36:14.407484	Da vagliatura #58 del 2026-04-21
396	131	480	52	386380	0.07228969	69	2026-04-22 08:36:14.407484	Da vagliatura #58 del 2026-04-21
397	131	480	53	456488	0.085406534	69	2026-04-22 08:36:14.407484	Da vagliatura #58 del 2026-04-21
398	135	481	60	285511	0.21201307	69	2026-04-22 08:36:14.407484	Da vagliatura #58 del 2026-04-21
399	135	481	37	412547	0.3063467	69	2026-04-22 08:36:14.407484	Da vagliatura #58 del 2026-04-21
400	135	481	31	436245	0.32394424	69	2026-04-22 08:36:14.407484	Da vagliatura #58 del 2026-04-21
401	135	481	52	97350	0.072289586	69	2026-04-22 08:36:14.407484	Da vagliatura #58 del 2026-04-21
402	135	481	53	115014	0.085406415	69	2026-04-22 08:36:14.407484	Da vagliatura #58 del 2026-04-21
403	81	485	5	344884	1	70	2026-04-22 08:54:58.968278	Da vagliatura #59 del 2026-04-22
404	84	486	5	344884	1	70	2026-04-22 08:54:58.968278	Da vagliatura #59 del 2026-04-22
405	112	494	31	5168675	1	71	2026-04-22 13:05:19.734317	Da vagliatura #60 del 2026-04-22
406	117	495	31	5133332	1	71	2026-04-22 13:05:19.734317	Da vagliatura #60 del 2026-04-22
407	116	496	34	177646	0.80812097	72	2026-04-23 08:50:01.773569	Da vagliatura #61 del 2026-04-23
408	116	496	11	42180	0.19187903	72	2026-04-23 08:50:01.773569	Da vagliatura #61 del 2026-04-23
409	118	497	34	1500375	0.80812	72	2026-04-23 08:50:01.773569	Da vagliatura #61 del 2026-04-23
410	118	497	11	356249	0.19187999	72	2026-04-23 08:50:01.773569	Da vagliatura #61 del 2026-04-23
411	124	498	34	1363978	0.8081204	72	2026-04-23 08:50:01.773569	Da vagliatura #61 del 2026-04-23
412	124	498	11	323862	0.19187956	72	2026-04-23 08:50:01.773569	Da vagliatura #61 del 2026-04-23
413	126	499	34	2168819	0.8081204	72	2026-04-23 08:50:01.773569	Da vagliatura #61 del 2026-04-23
414	126	499	11	514963	0.1918796	72	2026-04-23 08:50:01.773569	Da vagliatura #61 del 2026-04-23
435	101	509	61	866585	0.18929477	75	2026-04-24 12:52:09.671523	Da vagliatura #62 del 2026-04-24
436	101	509	65	127300	0.027807109	75	2026-04-24 12:52:09.671523	Da vagliatura #62 del 2026-04-24
437	101	509	68	394289	0.08612755	75	2026-04-24 12:52:09.671523	Da vagliatura #62 del 2026-04-24
438	101	509	67	707901	0.15463221	75	2026-04-24 12:52:09.671523	Da vagliatura #62 del 2026-04-24
439	101	509	76	936762	0.20462406	75	2026-04-24 12:52:09.671523	Da vagliatura #62 del 2026-04-24
440	101	509	62	1290135	0.281814	75	2026-04-24 12:52:09.671523	Da vagliatura #62 del 2026-04-24
441	101	509	63	254994	0.055700283	75	2026-04-24 12:52:09.671523	Da vagliatura #62 del 2026-04-24
442	133	510	61	1467207	0.18929483	75	2026-04-24 12:52:09.671523	Da vagliatura #62 del 2026-04-24
443	133	510	65	215531	0.027807191	75	2026-04-24 12:52:09.671523	Da vagliatura #62 del 2026-04-24
444	133	510	68	667566	0.086127445	75	2026-04-24 12:52:09.671523	Da vagliatura #62 del 2026-04-24
445	133	510	67	1198540	0.15463218	75	2026-04-24 12:52:09.671523	Da vagliatura #62 del 2026-04-24
446	133	510	76	1586022	0.204624	75	2026-04-24 12:52:09.671523	Da vagliatura #62 del 2026-04-24
447	133	510	62	2184315	0.28181404	75	2026-04-24 12:52:09.671523	Da vagliatura #62 del 2026-04-24
448	133	510	63	431728	0.055700306	75	2026-04-24 12:52:09.671523	Da vagliatura #62 del 2026-04-24
449	136	511	61	858136	0.18929473	75	2026-04-24 12:52:09.671523	Da vagliatura #62 del 2026-04-24
450	136	511	65	126059	0.027807135	75	2026-04-24 12:52:09.671523	Da vagliatura #62 del 2026-04-24
451	136	511	68	390445	0.08612758	75	2026-04-24 12:52:09.671523	Da vagliatura #62 del 2026-04-24
452	136	511	67	700999	0.15463215	75	2026-04-24 12:52:09.671523	Da vagliatura #62 del 2026-04-24
453	136	511	76	927629	0.20462406	75	2026-04-24 12:52:09.671523	Da vagliatura #62 del 2026-04-24
454	136	511	62	1277557	0.28181407	75	2026-04-24 12:52:09.671523	Da vagliatura #62 del 2026-04-24
455	136	511	63	252508	0.0557003	75	2026-04-24 12:52:09.671523	Da vagliatura #62 del 2026-04-24
456	62	513	47	1617477	27.134684	\N	2026-04-24 16:41:17.502242	Trasferimento #1459 da cesta #2 — 27.13% del cestello
457	62	513	48	578141	9.6988535	\N	2026-04-24 16:41:17.502242	Trasferimento #1459 da cesta #2 — 9.70% del cestello
458	62	513	66	554550	9.303093	\N	2026-04-24 16:41:17.502242	Trasferimento #1459 da cesta #2 — 9.30% del cestello
459	62	513	50	302443	5.073763	\N	2026-04-24 16:41:17.502242	Trasferimento #1459 da cesta #2 — 5.07% del cestello
460	62	513	40	1495318	25.085352	\N	2026-04-24 16:41:17.502242	Trasferimento #1459 da cesta #2 — 25.09% del cestello
461	62	513	51	1412992	23.704256	\N	2026-04-24 16:41:17.502242	Trasferimento #1459 da cesta #2 — 23.70% del cestello
462	63	514	47	184817	27.134756	\N	2026-04-24 16:42:51.208887	Trasferimento #1461 da cesta #7 — 27.13% del cestello
463	63	514	48	66060	9.698902	\N	2026-04-24 16:42:51.208887	Trasferimento #1461 da cesta #7 — 9.70% del cestello
464	63	514	66	63364	9.303077	\N	2026-04-24 16:42:51.208887	Trasferimento #1461 da cesta #7 — 9.30% del cestello
465	63	514	50	34558	5.0737915	\N	2026-04-24 16:42:51.208887	Trasferimento #1461 da cesta #7 — 5.07% del cestello
466	63	514	40	170858	25.085302	\N	2026-04-24 16:42:51.208887	Trasferimento #1461 da cesta #7 — 25.09% del cestello
467	63	514	51	161451	23.70417	\N	2026-04-24 16:42:51.208887	Trasferimento #1461 da cesta #7 — 23.70% del cestello
468	64	515	60	1092389	21.201277	\N	2026-04-24 17:02:50.679442	Trasferimento #1465 da cesta #1 — 21.20% del cestello
469	64	515	37	1578443	30.634697	\N	2026-04-24 17:02:50.679442	Trasferimento #1465 da cesta #1 — 30.63% del cestello
470	64	515	31	1669111	32.394398	\N	2026-04-24 17:02:50.679442	Trasferimento #1465 da cesta #1 — 32.39% del cestello
471	64	515	52	372470	7.228963	\N	2026-04-24 17:02:50.679442	Trasferimento #1465 da cesta #1 — 7.23% del cestello
472	64	515	53	440055	8.540665	\N	2026-04-24 17:02:50.679442	Trasferimento #1465 da cesta #1 — 8.54% del cestello
473	102	516	61	1467207	18.929483	\N	2026-04-25 09:16:51.982768	Trasferimento #1467 da cesta #3 — 18.93% del cestello
474	102	516	65	215531	2.780719	\N	2026-04-25 09:16:51.982768	Trasferimento #1467 da cesta #3 — 2.78% del cestello
475	102	516	68	667566	8.612744	\N	2026-04-25 09:16:51.982768	Trasferimento #1467 da cesta #3 — 8.61% del cestello
476	102	516	67	1198540	15.463219	\N	2026-04-25 09:16:51.982768	Trasferimento #1467 da cesta #3 — 15.46% del cestello
477	102	516	76	1586022	20.4624	\N	2026-04-25 09:16:51.982768	Trasferimento #1467 da cesta #3 — 20.46% del cestello
478	102	516	62	2184315	28.181404	\N	2026-04-25 09:16:51.982768	Trasferimento #1467 da cesta #3 — 28.18% del cestello
479	102	516	63	431728	5.5700307	\N	2026-04-25 09:16:51.982768	Trasferimento #1467 da cesta #3 — 5.57% del cestello
480	101	518	62	1747800	0.25491032	76	2026-04-27 10:48:10.020835	Da vagliatura #63 del 2026-04-27
481	101	518	69	515333	0.07515946	76	2026-04-27 10:48:10.020835	Da vagliatura #63 del 2026-04-27
482	101	518	70	4353796	0.63498545	76	2026-04-27 10:48:10.020835	Da vagliatura #63 del 2026-04-27
483	101	518	71	239600	0.034944795	76	2026-04-27 10:48:10.020835	Da vagliatura #63 del 2026-04-27
484	103	519	62	1020095	0.25491026	76	2026-04-27 10:48:10.020835	Da vagliatura #63 del 2026-04-27
485	103	519	69	300771	0.07515929	76	2026-04-27 10:48:10.020835	Da vagliatura #63 del 2026-04-27
486	103	519	70	2541073	0.6349855	76	2026-04-27 10:48:10.020835	Da vagliatura #63 del 2026-04-27
487	103	519	71	139842	0.03494494	76	2026-04-27 10:48:10.020835	Da vagliatura #63 del 2026-04-27
488	131	520	62	1201239	0.25491023	76	2026-04-27 10:48:10.020835	Da vagliatura #63 del 2026-04-27
489	131	520	69	354181	0.07515936	76	2026-04-27 10:48:10.020835	Da vagliatura #63 del 2026-04-27
490	131	520	70	2992306	0.63498557	76	2026-04-27 10:48:10.020835	Da vagliatura #63 del 2026-04-27
491	131	520	71	164674	0.034944825	76	2026-04-27 10:48:10.020835	Da vagliatura #63 del 2026-04-27
492	132	521	62	1020095	25.491026	\N	2026-04-27 11:17:35.677988	Trasferimento #1518 da cesta #3 — 25.49% del cestello
493	132	521	69	300771	7.5159287	\N	2026-04-27 11:17:35.677988	Trasferimento #1518 da cesta #3 — 7.52% del cestello
494	132	521	70	2541073	63.49855	\N	2026-04-27 11:17:35.677988	Trasferimento #1518 da cesta #3 — 63.50% del cestello
495	132	521	71	139842	3.494494	\N	2026-04-27 11:17:35.677988	Trasferimento #1518 da cesta #3 — 3.49% del cestello
496	111	522	5	373614	1	77	2026-04-28 09:21:09.360853	Da vagliatura #64 del 2026-04-28
497	114	523	5	468142	1	77	2026-04-28 09:21:09.360853	Da vagliatura #64 del 2026-04-28
498	120	524	5	274584	1	77	2026-04-28 09:21:09.360853	Da vagliatura #64 del 2026-04-28
499	122	525	5	80416	1	77	2026-04-28 09:21:09.360853	Da vagliatura #64 del 2026-04-28
500	123	526	5	435424	1	77	2026-04-28 09:21:09.360853	Da vagliatura #64 del 2026-04-28
501	125	527	5	435424	1	77	2026-04-28 09:21:09.360853	Da vagliatura #64 del 2026-04-28
502	127	528	5	435424	1	77	2026-04-28 09:21:09.360853	Da vagliatura #64 del 2026-04-28
503	70	529	31	2888889	1	78	2026-04-28 11:30:14.675293	Da vagliatura #65 del 2026-04-28
504	67	530	47	5059898	1	79	2026-04-28 11:32:54.458515	Da vagliatura #66 del 2026-04-28
505	68	531	47	3162437	1	79	2026-04-28 11:32:54.458515	Da vagliatura #66 del 2026-04-28
506	69	532	81	12262963	1	80	2026-04-28 11:37:41.288178	Da vagliatura #67 del 2026-04-28
507	66	533	47	6871429	1	81	2026-04-28 11:41:34.127019	Da vagliatura #68 del 2026-04-28
508	115	534	34	942620	0.37479606	82	2026-04-29 11:35:51.938116	Da vagliatura #69 del 2026-04-29
509	115	534	31	1572401	0.6252039	82	2026-04-29 11:35:51.938116	Da vagliatura #69 del 2026-04-29
510	118	535	34	942620	0.37479606	82	2026-04-29 11:35:51.938116	Da vagliatura #69 del 2026-04-29
511	118	535	31	1572401	0.6252039	82	2026-04-29 11:35:51.938116	Da vagliatura #69 del 2026-04-29
512	119	536	34	942620	0.37479606	82	2026-04-29 11:35:51.938116	Da vagliatura #69 del 2026-04-29
513	119	536	31	1572401	0.6252039	82	2026-04-29 11:35:51.938116	Da vagliatura #69 del 2026-04-29
514	82	537	34	391850	0.3747964	82	2026-04-29 11:35:51.938116	Da vagliatura #69 del 2026-04-29
515	82	537	31	653651	0.6252036	82	2026-04-29 11:35:51.938116	Da vagliatura #69 del 2026-04-29
516	90	538	34	391850	0.3747964	82	2026-04-29 11:35:51.938116	Da vagliatura #69 del 2026-04-29
517	90	538	31	653651	0.6252036	82	2026-04-29 11:35:51.938116	Da vagliatura #69 del 2026-04-29
518	99	539	34	391850	0.3747964	82	2026-04-29 11:35:51.938116	Da vagliatura #69 del 2026-04-29
519	99	539	31	653651	0.6252036	82	2026-04-29 11:35:51.938116	Da vagliatura #69 del 2026-04-29
520	93	540	34	226777	0.37479588	82	2026-04-29 11:35:51.938116	Da vagliatura #69 del 2026-04-29
521	93	540	31	378291	0.6252041	82	2026-04-29 11:35:51.938116	Da vagliatura #69 del 2026-04-29
522	94	541	34	145760	0.37479687	82	2026-04-29 11:35:51.938116	Da vagliatura #69 del 2026-04-29
523	94	541	31	243144	0.62520313	82	2026-04-29 11:35:51.938116	Da vagliatura #69 del 2026-04-29
524	96	552	5	120000	1	83	2026-04-30 10:07:52.344492	Da vagliatura #70 del 2026-04-30
525	83	553	5	421800	1	83	2026-04-30 10:07:52.344492	Da vagliatura #70 del 2026-04-30
526	88	554	5	423650	1	83	2026-04-30 10:07:52.344492	Da vagliatura #70 del 2026-04-30
527	87	555	5	421800	1	83	2026-04-30 10:07:52.344492	Da vagliatura #70 del 2026-04-30
528	173	556	62	1020095	25.491026	\N	2026-04-30 10:25:55.51594	Trasferimento #1595 da cesta #2 — 25.49% del cestello
529	173	556	69	300771	7.5159287	\N	2026-04-30 10:25:55.51594	Trasferimento #1595 da cesta #2 — 7.52% del cestello
530	173	556	70	2541073	63.49855	\N	2026-04-30 10:25:55.51594	Trasferimento #1595 da cesta #2 — 63.50% del cestello
531	173	556	71	139842	3.494494	\N	2026-04-30 10:25:55.51594	Trasferimento #1595 da cesta #2 — 3.49% del cestello
532	115	558	34	455381	37.47964	\N	2026-05-04 07:37:41.319175	Trasferimento parziale #1607 — 37.48% del cestello (quota trattenuta)
533	115	558	31	759628	62.52036	\N	2026-05-04 07:37:41.319175	Trasferimento parziale #1607 — 62.52% del cestello (quota trattenuta)
534	120	559	34	487239	37.479576	\N	2026-05-04 07:37:41.319175	Trasferimento #1607 da cesta #5 — 37.48% del cestello
535	120	559	31	812773	62.520424	\N	2026-05-04 07:37:41.319175	Trasferimento #1607 da cesta #5 — 62.52% del cestello
536	118	560	34	468503	37.47961	\N	2026-05-04 07:40:25.268246	Trasferimento parziale #1611 — 37.48% del cestello (quota trattenuta)
537	118	560	31	781518	62.52039	\N	2026-05-04 07:40:25.268246	Trasferimento parziale #1611 — 62.52% del cestello (quota trattenuta)
538	122	561	34	474117	37.479607	\N	2026-05-04 07:40:25.268246	Trasferimento #1611 da cesta #8 — 37.48% del cestello
539	122	561	31	790883	62.520393	\N	2026-05-04 07:40:25.268246	Trasferimento #1611 da cesta #8 — 62.52% del cestello
540	89	562	34	167342	80.811874	\N	2026-05-04 07:45:55.382194	Trasferimento #1614 da cesta #6 — 80.81% del cestello
541	89	562	11	39734	19.188124	\N	2026-05-04 07:45:55.382194	Trasferimento #1614 da cesta #6 — 19.19% del cestello
542	119	563	34	471126	37.479595	\N	2026-05-04 07:47:21.136757	Trasferimento parziale #1617 — 37.48% del cestello (quota trattenuta)
543	119	563	31	785894	62.520405	\N	2026-05-04 07:47:21.136757	Trasferimento parziale #1617 — 62.52% del cestello (quota trattenuta)
544	116	564	34	471494	37.47962	\N	2026-05-04 07:47:21.136757	Trasferimento #1617 da cesta #9 — 37.48% del cestello
545	116	564	31	786507	62.52038	\N	2026-05-04 07:47:21.136757	Trasferimento #1617 da cesta #9 — 62.52% del cestello
546	151	565	73	223915	0.20355909	85	2026-05-04 10:42:20.613952	Da vagliatura #72 del 2026-05-04
547	151	565	59	200266	0.18206	85	2026-05-04 10:42:20.613952	Da vagliatura #72 del 2026-05-04
548	151	565	58	38474	0.034976363	85	2026-05-04 10:42:20.613952	Da vagliatura #72 del 2026-05-04
549	151	565	79	14720	0.013381818	85	2026-05-04 10:42:20.613952	Da vagliatura #72 del 2026-05-04
550	151	565	75	283344	0.25758547	85	2026-05-04 10:42:20.613952	Da vagliatura #72 del 2026-05-04
551	151	565	78	98090	0.08917273	85	2026-05-04 10:42:20.613952	Da vagliatura #72 del 2026-05-04
552	151	565	80	169347	0.15395182	85	2026-05-04 10:42:20.613952	Da vagliatura #72 del 2026-05-04
553	151	565	31	27036	0.024578182	85	2026-05-04 10:42:20.613952	Da vagliatura #72 del 2026-05-04
554	151	565	72	44808	0.040734544	85	2026-05-04 10:42:20.613952	Da vagliatura #72 del 2026-05-04
555	152	566	73	1563546	0.20355931	85	2026-05-04 10:42:20.613952	Da vagliatura #72 del 2026-05-04
556	152	566	59	1398408	0.18205987	85	2026-05-04 10:42:20.613952	Da vagliatura #72 del 2026-05-04
557	152	566	58	268654	0.03497628	85	2026-05-04 10:42:20.613952	Da vagliatura #72 del 2026-05-04
558	152	566	79	102784	0.013381531	85	2026-05-04 10:42:20.613952	Da vagliatura #72 del 2026-05-04
559	152	566	75	1978524	0.25758564	85	2026-05-04 10:42:20.613952	Da vagliatura #72 del 2026-05-04
560	152	566	78	684940	0.08917289	85	2026-05-04 10:42:20.613952	Da vagliatura #72 del 2026-05-04
561	152	566	80	1182506	0.1539514	85	2026-05-04 10:42:20.613952	Da vagliatura #72 del 2026-05-04
562	152	566	31	188787	0.024578331	85	2026-05-04 10:42:20.613952	Da vagliatura #72 del 2026-05-04
563	152	566	72	312885	0.04073475	85	2026-05-04 10:42:20.613952	Da vagliatura #72 del 2026-05-04
564	110	567	73	921519	0.20355943	85	2026-05-04 10:42:20.613952	Da vagliatura #72 del 2026-05-04
565	110	567	59	824190	0.18205988	85	2026-05-04 10:42:20.613952	Da vagliatura #72 del 2026-05-04
566	110	567	58	158338	0.034976155	85	2026-05-04 10:42:20.613952	Da vagliatura #72 del 2026-05-04
567	110	567	79	60579	0.01338163	85	2026-05-04 10:42:20.613952	Da vagliatura #72 del 2026-05-04
568	110	567	75	1166097	0.25758561	85	2026-05-04 10:42:20.613952	Da vagliatura #72 del 2026-05-04
569	110	567	78	403688	0.08917287	85	2026-05-04 10:42:20.613952	Da vagliatura #72 del 2026-05-04
570	110	567	80	696942	0.15395136	85	2026-05-04 10:42:20.613952	Da vagliatura #72 del 2026-05-04
571	110	567	31	111267	0.024578381	85	2026-05-04 10:42:20.613952	Da vagliatura #72 del 2026-05-04
572	110	567	72	184407	0.040734682	85	2026-05-04 10:42:20.613952	Da vagliatura #72 del 2026-05-04
573	151	568	75	6285714	1	87	2026-05-04 11:01:26.16603	Da vagliatura #74 del 2026-05-04
574	107	569	81	4167742	1	88	2026-05-04 14:04:58.808347	Da vagliatura #75 del 2026-05-04
575	25	570	81	2286600	1	88	2026-05-04 14:04:58.808347	Da vagliatura #75 del 2026-05-04
576	101	571	62	742815	25.49103	\N	2026-05-04 14:50:43.66999	Trasferimento parziale #1638 — 25.49% del cestello (quota trattenuta)
577	101	571	69	219017	7.5159616	\N	2026-05-04 14:50:43.66999	Trasferimento parziale #1638 — 7.52% del cestello (quota trattenuta)
578	101	571	70	1850363	63.498528	\N	2026-05-04 14:50:43.66999	Trasferimento parziale #1638 — 63.50% del cestello (quota trattenuta)
579	101	571	71	101830	3.4944792	\N	2026-05-04 14:50:43.66999	Trasferimento parziale #1638 — 3.49% del cestello (quota trattenuta)
580	103	572	62	742815	25.49103	\N	2026-05-04 14:50:43.66999	Trasferimento #1638 da cesta #1 — 25.49% del cestello
581	103	572	69	219017	7.5159616	\N	2026-05-04 14:50:43.66999	Trasferimento #1638 da cesta #1 — 7.52% del cestello
582	103	572	70	1850363	63.498528	\N	2026-05-04 14:50:43.66999	Trasferimento #1638 da cesta #1 — 63.50% del cestello
583	103	572	71	101830	3.4944792	\N	2026-05-04 14:50:43.66999	Trasferimento #1638 da cesta #1 — 3.49% del cestello
584	105	573	47	586617	27.134678	\N	2026-05-04 15:03:18.644624	Trasferimento #1641 da cesta #3 — 27.13% del cestello
585	105	573	48	209677	9.698863	\N	2026-05-04 15:03:18.644624	Trasferimento #1641 da cesta #3 — 9.70% del cestello
586	105	573	66	201121	9.303095	\N	2026-05-04 15:03:18.644624	Trasferimento #1641 da cesta #3 — 9.30% del cestello
587	105	573	50	109688	5.073751	\N	2026-05-04 15:03:18.644624	Trasferimento #1641 da cesta #3 — 5.07% del cestello
588	105	573	40	542313	25.085342	\N	2026-05-04 15:03:18.644624	Trasferimento #1641 da cesta #3 — 25.09% del cestello
589	105	573	51	512456	23.704271	\N	2026-05-04 15:03:18.644624	Trasferimento #1641 da cesta #3 — 23.70% del cestello
590	109	574	47	586617	27.134678	\N	2026-05-04 15:03:18.644624	Trasferimento #1641 da cesta #3 — 27.13% del cestello
591	109	574	48	209677	9.698863	\N	2026-05-04 15:03:18.644624	Trasferimento #1641 da cesta #3 — 9.70% del cestello
592	109	574	66	201121	9.303095	\N	2026-05-04 15:03:18.644624	Trasferimento #1641 da cesta #3 — 9.30% del cestello
593	109	574	50	109688	5.073751	\N	2026-05-04 15:03:18.644624	Trasferimento #1641 da cesta #3 — 5.07% del cestello
594	109	574	40	542313	25.085342	\N	2026-05-04 15:03:18.644624	Trasferimento #1641 da cesta #3 — 25.09% del cestello
595	109	574	51	512456	23.704271	\N	2026-05-04 15:03:18.644624	Trasferimento #1641 da cesta #3 — 23.70% del cestello
596	104	581	62	742815	25.49103	\N	2026-05-05 13:51:31.872866	Trasferimento #1676 da cesta #1 — 25.49% del cestello
597	104	581	69	219017	7.5159616	\N	2026-05-05 13:51:31.872866	Trasferimento #1676 da cesta #1 — 7.52% del cestello
598	104	581	70	1850363	63.498528	\N	2026-05-05 13:51:31.872866	Trasferimento #1676 da cesta #1 — 63.50% del cestello
599	104	581	71	101830	3.4944792	\N	2026-05-05 13:51:31.872866	Trasferimento #1676 da cesta #1 — 3.49% del cestello
600	101	582	47	586617	27.134678	\N	2026-05-05 13:55:06.573528	Trasferimento #1678 da cesta #9 — 27.13% del cestello
601	101	582	48	209677	9.698863	\N	2026-05-05 13:55:06.573528	Trasferimento #1678 da cesta #9 — 9.70% del cestello
602	101	582	66	201121	9.303095	\N	2026-05-05 13:55:06.573528	Trasferimento #1678 da cesta #9 — 9.30% del cestello
603	101	582	50	109688	5.073751	\N	2026-05-05 13:55:06.573528	Trasferimento #1678 da cesta #9 — 5.07% del cestello
604	101	582	40	542313	25.085342	\N	2026-05-05 13:55:06.573528	Trasferimento #1678 da cesta #9 — 25.09% del cestello
605	101	582	51	512456	23.704271	\N	2026-05-05 13:55:06.573528	Trasferimento #1678 da cesta #9 — 23.70% del cestello
606	107	583	61	1212447	18.929491	\N	2026-05-05 13:56:40.44465	Trasferimento #1680 da cesta #2 — 18.93% del cestello
607	107	583	65	178107	2.7807195	\N	2026-05-05 13:56:40.44465	Trasferimento #1680 da cesta #2 — 2.78% del cestello
608	107	583	68	551652	8.6127405	\N	2026-05-05 13:56:40.44465	Trasferimento #1680 da cesta #2 — 8.61% del cestello
609	107	583	67	990430	15.463222	\N	2026-05-05 13:56:40.44465	Trasferimento #1680 da cesta #2 — 15.46% del cestello
610	107	583	76	1310631	20.462402	\N	2026-05-05 13:56:40.44465	Trasferimento #1680 da cesta #2 — 20.46% del cestello
611	107	583	62	1805038	28.181398	\N	2026-05-05 13:56:40.44465	Trasferimento #1680 da cesta #2 — 28.18% del cestello
612	107	583	63	356764	5.570026	\N	2026-05-05 13:56:40.44465	Trasferimento #1680 da cesta #2 — 5.57% del cestello
613	107	584	61	606223	18.92948	\N	2026-05-05 13:59:14.955645	Trasferimento parziale #1683 — 18.93% del cestello (quota trattenuta)
614	107	584	65	89054	2.7807355	\N	2026-05-05 13:59:14.955645	Trasferimento parziale #1683 — 2.78% del cestello (quota trattenuta)
615	107	584	68	275826	8.612742	\N	2026-05-05 13:59:14.955645	Trasferimento parziale #1683 — 8.61% del cestello (quota trattenuta)
616	107	584	67	495215	15.463223	\N	2026-05-05 13:59:14.955645	Trasferimento parziale #1683 — 15.46% del cestello (quota trattenuta)
617	107	584	76	655315	20.46239	\N	2026-05-05 13:59:14.955645	Trasferimento parziale #1683 — 20.46% del cestello (quota trattenuta)
618	107	584	62	902519	28.181402	\N	2026-05-05 13:59:14.955645	Trasferimento parziale #1683 — 28.18% del cestello (quota trattenuta)
619	107	584	63	178382	5.570027	\N	2026-05-05 13:59:14.955645	Trasferimento parziale #1683 — 5.57% del cestello (quota trattenuta)
620	109	585	61	606224	18.929504	\N	2026-05-05 13:59:14.955645	Trasferimento #1683 da cesta #7 — 18.93% del cestello
621	109	585	65	89053	2.7807033	\N	2026-05-05 13:59:14.955645	Trasferimento #1683 da cesta #7 — 2.78% del cestello
622	109	585	68	275826	8.61274	\N	2026-05-05 13:59:14.955645	Trasferimento #1683 da cesta #7 — 8.61% del cestello
623	109	585	67	495215	15.463219	\N	2026-05-05 13:59:14.955645	Trasferimento #1683 da cesta #7 — 15.46% del cestello
624	109	585	76	655316	20.462416	\N	2026-05-05 13:59:14.955645	Trasferimento #1683 da cesta #7 — 20.46% del cestello
625	109	585	62	902519	28.181395	\N	2026-05-05 13:59:14.955645	Trasferimento #1683 da cesta #7 — 28.18% del cestello
626	109	585	63	178382	5.570025	\N	2026-05-05 13:59:14.955645	Trasferimento #1683 da cesta #7 — 5.57% del cestello
627	123	591	47	935158	0.72510463	89	2026-05-06 11:57:25.464229	Da vagliatura #76 del 2026-05-06
628	123	591	31	354529	0.27489537	89	2026-05-06 11:57:25.464229	Da vagliatura #76 del 2026-05-06
629	125	592	47	938099	0.7251046	89	2026-05-06 11:57:25.464229	Da vagliatura #76 del 2026-05-06
630	125	592	31	355644	0.2748954	89	2026-05-06 11:57:25.464229	Da vagliatura #76 del 2026-05-06
631	68	593	47	1815115	0.7251042	89	2026-05-06 11:57:25.464229	Da vagliatura #76 del 2026-05-06
632	68	593	31	688132	0.27489576	89	2026-05-06 11:57:25.464229	Da vagliatura #76 del 2026-05-06
633	67	594	47	2325749	0.72510433	89	2026-05-06 11:57:25.464229	Da vagliatura #76 del 2026-05-06
634	67	594	31	881719	0.27489564	89	2026-05-06 11:57:25.464229	Da vagliatura #76 del 2026-05-06
635	5	596	70	719039	0.60281503	90	2026-05-06 12:51:05.349621	Da vagliatura #77 del 2026-05-06
636	5	596	47	473763	0.39718494	90	2026-05-06 12:51:05.349621	Da vagliatura #77 del 2026-05-06
637	3	597	70	719039	0.60281503	90	2026-05-06 12:51:05.349621	Da vagliatura #77 del 2026-05-06
638	3	597	47	473763	0.39718494	90	2026-05-06 12:51:05.349621	Da vagliatura #77 del 2026-05-06
639	1	598	70	719039	0.60281503	90	2026-05-06 12:51:05.349621	Da vagliatura #77 del 2026-05-06
640	1	598	47	473763	0.39718494	90	2026-05-06 12:51:05.349621	Da vagliatura #77 del 2026-05-06
641	2	599	70	719039	0.60281503	90	2026-05-06 12:51:05.349621	Da vagliatura #77 del 2026-05-06
642	2	599	47	473763	0.39718494	90	2026-05-06 12:51:05.349621	Da vagliatura #77 del 2026-05-06
643	6	600	70	546839	0.60281456	90	2026-05-06 12:51:05.349621	Da vagliatura #77 del 2026-05-06
644	6	600	47	360304	0.39718544	90	2026-05-06 12:51:05.349621	Da vagliatura #77 del 2026-05-06
645	4	601	70	632956	0.6028152	90	2026-05-06 12:51:05.349621	Da vagliatura #77 del 2026-05-06
646	4	601	47	417044	0.39718476	90	2026-05-06 12:51:05.349621	Da vagliatura #77 del 2026-05-06
647	105	602	70	337576	0.60281426	90	2026-05-06 12:51:05.349621	Da vagliatura #77 del 2026-05-06
648	105	602	47	222424	0.3971857	90	2026-05-06 12:51:05.349621	Da vagliatura #77 del 2026-05-06
649	104	603	70	732377	0.5145182	91	2026-05-06 13:02:50.588601	Da vagliatura #78 del 2026-05-06
650	104	603	83	691046	0.48548183	91	2026-05-06 13:02:50.588601	Da vagliatura #78 del 2026-05-06
651	108	604	70	1974608	0.51451856	91	2026-05-06 13:02:50.588601	Da vagliatura #78 del 2026-05-06
652	108	604	83	1863170	0.48548144	91	2026-05-06 13:02:50.588601	Da vagliatura #78 del 2026-05-06
653	143	605	70	547260	0.51451814	91	2026-05-06 13:02:50.588601	Da vagliatura #78 del 2026-05-06
654	143	605	83	516376	0.4854819	91	2026-05-06 13:02:50.588601	Da vagliatura #78 del 2026-05-06
655	82	606	31	1145114	1	92	2026-05-07 07:59:53.706787	Da vagliatura #79 del 2026-05-07
656	90	607	31	1145114	1	92	2026-05-07 07:59:53.706787	Da vagliatura #79 del 2026-05-07
657	93	608	31	891935	1	92	2026-05-07 07:59:53.706787	Da vagliatura #79 del 2026-05-07
658	223	613	73	1563546	20.35593	\N	2026-05-07 10:34:31.933952	Trasferimento #1744 da cesta #2 — 20.36% del cestello
659	223	613	59	1398408	18.205986	\N	2026-05-07 10:34:31.933952	Trasferimento #1744 da cesta #2 — 18.21% del cestello
660	223	613	58	268654	3.497628	\N	2026-05-07 10:34:31.933952	Trasferimento #1744 da cesta #2 — 3.50% del cestello
661	223	613	79	102784	1.3381531	\N	2026-05-07 10:34:31.933952	Trasferimento #1744 da cesta #2 — 1.34% del cestello
662	223	613	75	1978524	25.758564	\N	2026-05-07 10:34:31.933952	Trasferimento #1744 da cesta #2 — 25.76% del cestello
663	223	613	78	684940	8.917289	\N	2026-05-07 10:34:31.933952	Trasferimento #1744 da cesta #2 — 8.92% del cestello
664	223	613	80	1182506	15.395141	\N	2026-05-07 10:34:31.933952	Trasferimento #1744 da cesta #2 — 15.40% del cestello
665	223	613	31	188787	2.457833	\N	2026-05-07 10:34:31.933952	Trasferimento #1744 da cesta #2 — 2.46% del cestello
666	223	613	72	312885	4.073475	\N	2026-05-07 10:34:31.933952	Trasferimento #1744 da cesta #2 — 4.07% del cestello
667	94	621	34	72862	37.479683	\N	2026-05-07 11:44:36.63799	Trasferimento parziale #1760 — 37.48% del cestello (quota trattenuta)
668	94	621	31	121542	62.520317	\N	2026-05-07 11:44:36.63799	Trasferimento parziale #1760 — 62.52% del cestello (quota trattenuta)
669	100	622	34	72898	37.47969	\N	2026-05-07 11:44:36.63799	Trasferimento #1760 da cesta #14 — 37.48% del cestello
670	100	622	31	121602	62.52031	\N	2026-05-07 11:44:36.63799	Trasferimento #1760 da cesta #14 — 62.52% del cestello
671	89	623	34	108000	1	93	2026-05-07 11:47:17.718093	Da vagliatura #80 del 2026-05-07
672	103	624	47	935158	72.51046	\N	2026-05-08 07:44:39.688449	Trasferimento #1770 da cesta #13 — 72.51% del cestello
673	103	624	31	354529	27.489538	\N	2026-05-08 07:44:39.688449	Trasferimento #1770 da cesta #13 — 27.49% del cestello
674	101	625	47	938099	72.51046	\N	2026-05-08 07:45:00.317033	Trasferimento #1772 da cesta #15 — 72.51% del cestello
675	101	625	31	355644	27.48954	\N	2026-05-08 07:45:00.317033	Trasferimento #1772 da cesta #15 — 27.49% del cestello
676	102	628	11	1337874	0.3970465	94	2026-05-08 10:21:15.965305	Da vagliatura #81 del 2026-05-08
677	102	628	87	918035	0.2724491	94	2026-05-08 10:21:15.965305	Da vagliatura #81 del 2026-05-08
678	102	628	86	1113656	0.3305044	94	2026-05-08 10:21:15.965305	Da vagliatura #81 del 2026-05-08
679	183	629	11	1342381	0.39704642	94	2026-05-08 10:21:15.965305	Da vagliatura #81 del 2026-05-08
680	183	629	87	921128	0.27244917	94	2026-05-08 10:21:15.965305	Da vagliatura #81 del 2026-05-08
681	183	629	86	1117408	0.33050442	94	2026-05-08 10:21:15.965305	Da vagliatura #81 del 2026-05-08
682	132	630	11	199345	0.397047	94	2026-05-08 10:21:15.965305	Da vagliatura #81 del 2026-05-08
683	132	630	87	136788	0.2724486	94	2026-05-08 10:21:15.965305	Da vagliatura #81 del 2026-05-08
684	132	630	86	165936	0.3305044	94	2026-05-08 10:21:15.965305	Da vagliatura #81 del 2026-05-08
685	83	631	5	84866	1	95	2026-05-08 10:43:32.523035	Da vagliatura #82 del 2026-05-08
686	87	632	5	215060	1	95	2026-05-08 10:43:32.523035	Da vagliatura #82 del 2026-05-08
687	88	633	5	217169	1	95	2026-05-08 10:43:32.523035	Da vagliatura #82 del 2026-05-08
688	90	634	5	229819	1	95	2026-05-08 10:43:32.523035	Da vagliatura #82 del 2026-05-08
689	115	635	31	1360906	1	96	2026-05-08 14:11:35.159088	Da vagliatura #83 del 2026-05-08
690	116	636	31	1366438	1	96	2026-05-08 14:11:35.159088	Da vagliatura #83 del 2026-05-08
691	118	637	31	1366438	1	96	2026-05-08 14:11:35.159088	Da vagliatura #83 del 2026-05-08
692	119	638	31	1366438	1	96	2026-05-08 14:11:35.159088	Da vagliatura #83 del 2026-05-08
693	122	639	31	1970149	1	96	2026-05-08 14:11:35.159088	Da vagliatura #83 del 2026-05-08
694	69	640	47	352883	1	97	2026-05-11 08:13:41.048107	Da vagliatura #84 del 2026-05-11
695	70	641	47	901670	1	97	2026-05-11 08:13:41.048107	Da vagliatura #84 del 2026-05-11
696	82	642	47	860312	1	97	2026-05-11 08:13:41.048107	Da vagliatura #84 del 2026-05-11
697	6	643	70	1264045	1	98	2026-05-11 13:33:05.844078	Da vagliatura #85 del 2026-05-11
698	15	644	70	1123596	1	98	2026-05-11 13:33:05.844078	Da vagliatura #85 del 2026-05-11
699	7	645	70	1235955	1	98	2026-05-11 13:33:05.844078	Da vagliatura #85 del 2026-05-11
700	8	646	70	599479	1	98	2026-05-11 13:33:05.844078	Da vagliatura #85 del 2026-05-11
701	5	647	70	599479	1	98	2026-05-11 13:33:05.844078	Da vagliatura #85 del 2026-05-11
702	10	648	70	599479	1	98	2026-05-11 13:33:05.844078	Da vagliatura #85 del 2026-05-11
703	13	649	70	599479	1	98	2026-05-11 13:33:05.844078	Da vagliatura #85 del 2026-05-11
704	9	650	70	539531	1	98	2026-05-11 13:33:05.844078	Da vagliatura #85 del 2026-05-11
705	31	651	47	133532	0.14540157	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
706	31	651	62	331066	0.36049423	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
707	31	651	37	210337	0.22903371	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
708	31	651	31	243432	0.2650705	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
709	37	652	47	133532	0.14540157	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
710	37	652	62	331066	0.36049423	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
711	37	652	37	210337	0.22903371	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
712	37	652	31	243432	0.2650705	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
713	34	653	47	133532	0.14540157	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
714	34	653	62	331066	0.36049423	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
715	34	653	37	210337	0.22903371	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
716	34	653	31	243432	0.2650705	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
717	36	654	47	133532	0.14540157	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
718	36	654	62	331066	0.36049423	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
719	36	654	37	210337	0.22903371	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
720	36	654	31	243432	0.2650705	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
721	35	655	47	200299	0.14540224	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
722	35	655	62	496599	0.3604941	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
723	35	655	37	315505	0.22903326	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
724	35	655	31	365148	0.2650704	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
725	29	656	47	184234	0.14540206	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
726	29	656	62	456770	0.36049426	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
727	29	656	37	290200	0.22903305	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
728	29	656	31	335862	0.26507065	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
729	28	657	47	184234	0.14540206	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
730	28	657	62	456770	0.36049426	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
731	28	657	37	290200	0.22903305	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
732	28	657	31	335862	0.26507065	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
733	30	658	47	184234	0.14540206	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
734	30	658	62	456770	0.36049426	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
735	30	658	37	290200	0.22903305	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
736	30	658	31	335862	0.26507065	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
737	22	659	47	180229	0.14540213	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
738	22	659	62	446840	0.3604941	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
739	22	659	37	283892	0.22903363	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
740	22	659	31	328560	0.26507014	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
741	24	660	47	180229	0.14540213	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
742	24	660	62	446840	0.3604941	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
743	24	660	37	283892	0.22903363	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
744	24	660	31	328560	0.26507014	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
745	39	661	47	125521	0.14540263	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
746	39	661	62	311202	0.36049417	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
747	39	661	37	197716	0.2290328	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
748	39	661	31	228826	0.2650704	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
749	32	662	47	125521	0.14540263	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
750	32	662	62	311202	0.36049417	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
751	32	662	37	197716	0.2290328	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
752	32	662	31	228826	0.2650704	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
753	33	663	47	125521	0.14540263	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
754	33	663	62	311202	0.36049417	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
755	33	663	37	197716	0.2290328	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
756	33	663	31	228826	0.2650704	99	2026-05-12 11:27:27.626853	Da vagliatura #86 del 2026-05-12
757	109	664	70	2313833	0.58506674	100	2026-05-12 13:19:35.991104	Da vagliatura #87 del 2026-05-12
758	109	664	11	201125	0.050855678	100	2026-05-12 13:19:35.991104	Da vagliatura #87 del 2026-05-12
759	109	664	62	1439861	0.3640776	100	2026-05-12 13:19:35.991104	Da vagliatura #87 del 2026-05-12
760	216	665	70	1399360	0.58506685	100	2026-05-12 13:19:35.991104	Da vagliatura #87 del 2026-05-12
761	216	665	11	121636	0.05085553	100	2026-05-12 13:19:35.991104	Da vagliatura #87 del 2026-05-12
762	216	665	62	870799	0.3640776	100	2026-05-12 13:19:35.991104	Da vagliatura #87 del 2026-05-12
763	107	666	77	2118076	0.30615348	101	2026-05-12 14:10:36.927848	Da vagliatura #88 del 2026-05-12
764	107	666	75	4800271	0.6938465	101	2026-05-12 14:10:36.927848	Da vagliatura #88 del 2026-05-12
765	193	667	77	2850547	0.30615348	101	2026-05-12 14:10:36.927848	Da vagliatura #88 del 2026-05-12
766	193	667	75	6460296	0.6938465	101	2026-05-12 14:10:36.927848	Da vagliatura #88 del 2026-05-12
767	208	668	77	636799	0.30615336	101	2026-05-12 14:10:36.927848	Da vagliatura #88 del 2026-05-12
768	208	668	75	1443201	0.69384664	101	2026-05-12 14:10:36.927848	Da vagliatura #88 del 2026-05-12
769	217	669	77	89377	0.30615377	101	2026-05-12 14:10:36.927848	Da vagliatura #88 del 2026-05-12
770	217	669	75	202558	0.6938462	101	2026-05-12 14:10:36.927848	Da vagliatura #88 del 2026-05-12
771	26	670	81	268681	0.3194404	102	2026-05-13 09:07:20.463208	Da vagliatura #89 del 2026-05-13
772	26	670	31	572418	0.6805596	102	2026-05-13 09:07:20.463208	Da vagliatura #89 del 2026-05-13
773	27	671	81	268681	0.3194404	102	2026-05-13 09:07:20.463208	Da vagliatura #89 del 2026-05-13
774	27	671	31	572418	0.6805596	102	2026-05-13 09:07:20.463208	Da vagliatura #89 del 2026-05-13
775	38	672	81	336912	0.3194405	102	2026-05-13 09:07:20.463208	Da vagliatura #89 del 2026-05-13
776	38	672	31	717782	0.68055946	102	2026-05-13 09:07:20.463208	Da vagliatura #89 del 2026-05-13
777	12	673	81	336912	0.3194405	102	2026-05-13 09:07:20.463208	Da vagliatura #89 del 2026-05-13
778	12	673	31	717782	0.68055946	102	2026-05-13 09:07:20.463208	Da vagliatura #89 del 2026-05-13
779	19	680	34	72898	37.47969	\N	2026-05-15 06:11:19.660751	Trasferimento #1931 da cesta #20 — 37.48% del cestello
780	19	680	31	121602	62.52031	\N	2026-05-15 06:11:19.660751	Trasferimento #1931 da cesta #20 — 62.52% del cestello
781	20	681	34	72862	37.479683	\N	2026-05-15 06:11:33.392117	Trasferimento #1933 da cesta #14 — 37.48% del cestello
782	20	681	31	121542	62.520317	\N	2026-05-15 06:11:33.392117	Trasferimento #1933 da cesta #14 — 62.52% del cestello
783	67	684	47	1162342	72.51042	\N	2026-05-15 06:23:50.706421	Trasferimento parziale #1942 — 72.51% del cestello (quota trattenuta)
784	67	684	31	440658	27.489582	\N	2026-05-15 06:23:50.706421	Trasferimento parziale #1942 — 27.49% del cestello (quota trattenuta)
785	178	685	47	1163407	72.51045	\N	2026-05-15 06:23:50.706421	Trasferimento #1942 da cesta #7 — 72.51% del cestello
786	178	685	31	441061	27.489548	\N	2026-05-15 06:23:50.706421	Trasferimento #1942 da cesta #7 — 27.49% del cestello
787	194	686	47	1815115	72.51042	\N	2026-05-15 08:35:09.79876	Trasferimento #1968 da cesta #8 — 72.51% del cestello
788	194	686	31	688132	27.489576	\N	2026-05-15 08:35:09.79876	Trasferimento #1968 da cesta #8 — 27.49% del cestello
789	66	689	47	1163407	72.51045	\N	2026-05-15 13:40:11.172838	Trasferimento #1998 da cesta #6 — 72.51% del cestello
790	66	689	31	441061	27.489548	\N	2026-05-15 13:40:11.172838	Trasferimento #1998 da cesta #6 — 27.49% del cestello
791	21	690	47	2177694	1	103	2026-05-18 09:11:10.6271	Da vagliatura #90 del 2026-05-18
792	40	691	47	133532	14.540156	\N	2026-05-18 11:46:31.507222	Trasferimento #2004 da cesta #16 — 14.54% del cestello
793	40	691	62	331066	36.049423	\N	2026-05-18 11:46:31.507222	Trasferimento #2004 da cesta #16 — 36.05% del cestello
794	40	691	37	210337	22.903372	\N	2026-05-18 11:46:31.507222	Trasferimento #2004 da cesta #16 — 22.90% del cestello
795	40	691	31	243432	26.50705	\N	2026-05-18 11:46:31.507222	Trasferimento #2004 da cesta #16 — 26.51% del cestello
796	36	694	47	662884	1	104	2026-05-18 11:56:50.959545	Da vagliatura #91 del 2026-05-18
797	66	695	47	612500	1	104	2026-05-18 11:56:50.959545	Da vagliatura #91 del 2026-05-18
798	67	696	47	612500	1	104	2026-05-18 11:56:50.959545	Da vagliatura #91 del 2026-05-18
799	106	697	85	509155	0.18114173	105	2026-05-18 12:06:59.039951	Da vagliatura #92 del 2026-05-18
800	106	697	84	237042	0.08433227	105	2026-05-18 12:06:59.039951	Da vagliatura #92 del 2026-05-18
801	106	697	74	98487	0.035038654	105	2026-05-18 12:06:59.039951	Da vagliatura #92 del 2026-05-18
802	106	697	89	188898	0.06720412	105	2026-05-18 12:06:59.039951	Da vagliatura #92 del 2026-05-18
803	106	697	88	85663	0.030476268	105	2026-05-18 12:06:59.039951	Da vagliatura #92 del 2026-05-18
804	106	697	90	375205	0.13348643	105	2026-05-18 12:06:59.039951	Da vagliatura #92 del 2026-05-18
805	106	697	91	1316360	0.46832052	105	2026-05-18 12:06:59.039951	Da vagliatura #92 del 2026-05-18
806	184	698	85	1161053	0.18114172	105	2026-05-18 12:06:59.039951	Da vagliatura #92 del 2026-05-18
807	184	698	84	540540	0.08433236	105	2026-05-18 12:06:59.039951	Da vagliatura #92 del 2026-05-18
808	184	698	74	224584	0.03503848	105	2026-05-18 12:06:59.039951	Da vagliatura #92 del 2026-05-18
809	184	698	89	430753	0.06720394	105	2026-05-18 12:06:59.039951	Da vagliatura #92 del 2026-05-18
810	184	698	88	195343	0.030476443	105	2026-05-18 12:06:59.039951	Da vagliatura #92 del 2026-05-18
811	184	698	90	855601	0.13348661	105	2026-05-18 12:06:59.039951	Da vagliatura #92 del 2026-05-18
812	184	698	91	3001765	0.46832046	105	2026-05-18 12:06:59.039951	Da vagliatura #92 del 2026-05-18
813	204	699	85	337900	0.18114223	105	2026-05-18 12:06:59.039951	Da vagliatura #92 del 2026-05-18
814	204	699	84	157312	0.08433219	105	2026-05-18 12:06:59.039951	Da vagliatura #92 del 2026-05-18
815	204	699	74	65360	0.035038345	105	2026-05-18 12:06:59.039951	Da vagliatura #92 del 2026-05-18
816	204	699	89	125361	0.06720382	105	2026-05-18 12:06:59.039951	Da vagliatura #92 del 2026-05-18
817	204	699	88	56850	0.030476283	105	2026-05-18 12:06:59.039951	Da vagliatura #92 del 2026-05-18
818	204	699	90	249004	0.13348666	105	2026-05-18 12:06:59.039951	Da vagliatura #92 del 2026-05-18
819	204	699	91	873598	0.4683205	105	2026-05-18 12:06:59.039951	Da vagliatura #92 del 2026-05-18
820	19	703	31	213067	1	106	2026-05-18 13:31:20.673728	Da vagliatura #93 del 2026-05-18
821	20	704	31	86346	1	106	2026-05-18 13:31:20.673728	Da vagliatura #93 del 2026-05-18
822	20	707	5	33516	0.21662778	107	2026-05-19 15:38:33.768584	Da vagliatura #94 del 2026-05-19
823	20	707	31	121201	0.7833722	107	2026-05-19 15:38:33.768584	Da vagliatura #94 del 2026-05-19
824	19	708	5	43504	0.21662319	107	2026-05-19 15:38:33.768584	Da vagliatura #94 del 2026-05-19
825	19	708	31	157324	0.7833768	107	2026-05-19 15:38:33.768584	Da vagliatura #94 del 2026-05-19
826	35	709	62	206788	0.3063694	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
827	35	709	31	293945	0.43549794	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
828	35	709	70	145919	0.21618815	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
829	35	709	47	28311	0.041944522	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
830	33	710	62	253083	0.30636844	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
831	33	710	31	359754	0.4354985	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
832	33	710	70	178588	0.21618886	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
833	33	710	47	34649	0.041944183	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
834	40	711	62	225186	0.30636883	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
835	40	711	31	320098	0.435498	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
836	40	711	70	158902	0.21618849	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
837	40	711	47	30830	0.041944664	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
838	37	712	62	229561	0.30636892	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
839	37	712	31	326317	0.43549812	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
840	37	712	70	161989	0.21618827	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
841	37	712	47	31429	0.041944705	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
842	31	713	62	332043	0.3063684	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
843	31	713	31	471994	0.43549797	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
844	31	713	70	234306	0.21618873	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
845	31	713	47	45460	0.04194489	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
846	20	714	62	121090	0.3063685	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
847	20	714	31	172128	0.43549916	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
848	20	714	70	85447	0.21618852	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
849	20	714	47	16578	0.04194382	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
850	17	715	62	121090	0.3063685	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
851	17	715	31	172128	0.43549916	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
852	17	715	70	85447	0.21618852	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
853	17	715	47	16578	0.04194382	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
854	16	716	62	217218	0.3063689	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
855	16	716	31	308772	0.43549863	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
856	16	716	70	153279	0.21618797	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
857	16	716	47	29739	0.04194452	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
858	8	717	62	234898	0.30636817	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
859	8	717	31	333904	0.4354978	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
860	8	717	70	165756	0.216189	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
861	8	717	47	32160	0.041945018	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
862	9	718	62	341002	0.30636913	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
863	9	718	31	484728	0.435498	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
864	9	718	70	240627	0.21618842	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
865	9	718	47	46686	0.04194447	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
866	5	719	62	341002	0.30636913	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
867	5	719	31	484728	0.435498	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
868	5	719	70	240627	0.21618842	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
869	5	719	47	46686	0.04194447	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
870	11	720	62	434776	0.306368	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
871	11	720	31	618029	0.4354985	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
872	11	720	70	306800	0.21618879	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
873	11	720	47	59525	0.041944712	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
874	10	721	62	208331	0.30636913	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
875	10	721	31	296139	0.43549854	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
876	10	721	70	147008	0.21618824	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
877	10	721	47	28522	0.041944116	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
878	18	722	62	83344	0.3063712	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
879	18	722	31	118471	0.43549752	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
880	18	722	70	58811	0.2161883	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
881	18	722	47	11410	0.041942976	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
882	13	723	62	258586	0.3063692	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
883	13	723	31	367575	0.43549785	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
884	13	723	70	182470	0.21618797	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
885	13	723	47	35403	0.04194499	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
886	12	724	62	394002	0.3063691	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
887	12	724	31	560067	0.43549836	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
888	12	724	70	278026	0.21618818	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
889	12	724	47	53942	0.041944362	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
890	14	725	62	427534	0.30636904	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
891	14	725	31	607732	0.43549815	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
892	14	725	70	301688	0.21618833	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
893	14	725	47	58533	0.041944496	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
894	38	726	62	35426	0.30637112	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
895	38	726	31	50357	0.4354974	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
896	38	726	70	24998	0.2161877	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
897	38	726	47	4850	0.04194377	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
898	34	727	62	114212	0.30636925	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
899	34	727	31	162350	0.43549755	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
900	34	727	70	80593	0.21618758	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
901	34	727	47	15637	0.041945644	108	2026-05-19 16:05:15.971622	Da vagliatura #95 del 2026-05-19
902	171	728	85	580527	18.114183	\N	2026-05-20 11:11:14.464269	Trasferimento #2085 da cesta #2 — 18.11% del cestello
903	171	728	84	270270	8.433235	\N	2026-05-20 11:11:14.464269	Trasferimento #2085 da cesta #2 — 8.43% del cestello
904	171	728	74	112292	3.5038474	\N	2026-05-20 11:11:14.464269	Trasferimento #2085 da cesta #2 — 3.50% del cestello
905	171	728	89	215376	6.7203774	\N	2026-05-20 11:11:14.464269	Trasferimento #2085 da cesta #2 — 6.72% del cestello
906	171	728	88	97671	3.0476282	\N	2026-05-20 11:11:14.464269	Trasferimento #2085 da cesta #2 — 3.05% del cestello
907	171	728	90	427801	13.348675	\N	2026-05-20 11:11:14.464269	Trasferimento #2085 da cesta #2 — 13.35% del cestello
908	171	728	91	1500883	46.832054	\N	2026-05-20 11:11:14.464269	Trasferimento #2085 da cesta #2 — 46.83% del cestello
909	172	729	85	580526	18.114159	\N	2026-05-20 11:11:14.464269	Trasferimento #2085 da cesta #2 — 18.11% del cestello
910	172	729	84	270270	8.433238	\N	2026-05-20 11:11:14.464269	Trasferimento #2085 da cesta #2 — 8.43% del cestello
911	172	729	74	112292	3.5038483	\N	2026-05-20 11:11:14.464269	Trasferimento #2085 da cesta #2 — 3.50% del cestello
912	172	729	89	215377	6.720411	\N	2026-05-20 11:11:14.464269	Trasferimento #2085 da cesta #2 — 6.72% del cestello
913	172	729	88	97672	3.0476604	\N	2026-05-20 11:11:14.464269	Trasferimento #2085 da cesta #2 — 3.05% del cestello
914	172	729	90	427800	13.348648	\N	2026-05-20 11:11:14.464269	Trasferimento #2085 da cesta #2 — 13.35% del cestello
915	172	729	91	1500882	46.832035	\N	2026-05-20 11:11:14.464269	Trasferimento #2085 da cesta #2 — 46.83% del cestello
916	39	730	62	35426	30.637114	\N	2026-05-20 11:37:29.086961	Trasferimento #2089 da cesta #18 — 30.64% del cestello
917	39	730	31	50357	43.54974	\N	2026-05-20 11:37:29.086961	Trasferimento #2089 da cesta #18 — 43.55% del cestello
918	39	730	70	24998	21.61877	\N	2026-05-20 11:37:29.086961	Trasferimento #2089 da cesta #18 — 21.62% del cestello
919	39	730	47	4850	4.194377	\N	2026-05-20 11:37:29.086961	Trasferimento #2089 da cesta #18 — 4.19% del cestello
920	19	731	31	99260	1	109	2026-05-20 13:19:31.249394	Da vagliatura #96 del 2026-05-19
921	150	732	31	99260	1	109	2026-05-20 13:19:31.249394	Da vagliatura #96 del 2026-05-19
922	193	734	77	1472856	30.615341	\N	2026-05-20 14:05:45.650046	Trasferimento parziale #2097 — 30.62% del cestello (quota trattenuta)
923	193	734	75	3337987	69.38466	\N	2026-05-20 14:05:45.650046	Trasferimento parziale #2097 — 69.38% del cestello (quota trattenuta)
924	173	735	77	1377691	30.615356	\N	2026-05-20 14:05:45.650046	Trasferimento #2097 da cesta #1 — 30.62% del cestello
925	173	735	75	3122309	69.38464	\N	2026-05-20 14:05:45.650046	Trasferimento #2097 da cesta #1 — 69.38% del cestello
926	2	736	91	404384	0.32135054	110	2026-05-21 09:17:45.594388	Da vagliatura #97 del 2026-05-21
927	2	736	70	202715	0.16109088	110	2026-05-21 09:17:45.594388	Da vagliatura #97 del 2026-05-21
928	2	736	75	651290	0.5175586	110	2026-05-21 09:17:45.594388	Da vagliatura #97 del 2026-05-21
929	4	737	91	486699	0.32134998	110	2026-05-21 09:17:45.594388	Da vagliatura #97 del 2026-05-21
930	4	737	70	243980	0.16109128	110	2026-05-21 09:17:45.594388	Da vagliatura #97 del 2026-05-21
931	4	737	75	783866	0.51755875	110	2026-05-21 09:17:45.594388	Da vagliatura #97 del 2026-05-21
932	23	738	91	471249	0.32135034	110	2026-05-21 09:17:45.594388	Da vagliatura #97 del 2026-05-21
933	23	738	70	236234	0.16109079	110	2026-05-21 09:17:45.594388	Da vagliatura #97 del 2026-05-21
934	23	738	75	758982	0.5175589	110	2026-05-21 09:17:45.594388	Da vagliatura #97 del 2026-05-21
935	38	739	91	294626	0.32135046	110	2026-05-21 09:17:45.594388	Da vagliatura #97 del 2026-05-21
936	38	739	70	147694	0.16109079	110	2026-05-21 09:17:45.594388	Da vagliatura #97 del 2026-05-21
937	38	739	75	474517	0.51755875	110	2026-05-21 09:17:45.594388	Da vagliatura #97 del 2026-05-21
938	25	740	91	320932	0.3213504	110	2026-05-21 09:17:45.594388	Da vagliatura #97 del 2026-05-21
939	25	740	70	160881	0.16109075	110	2026-05-21 09:17:45.594388	Da vagliatura #97 del 2026-05-21
940	25	740	75	516885	0.5175589	110	2026-05-21 09:17:45.594388	Da vagliatura #97 del 2026-05-21
941	106	741	77	633740	30.615341	\N	2026-05-21 12:12:53.846092	Trasferimento #2120 da cesta #6 — 30.62% del cestello
942	106	741	75	1436268	69.38466	\N	2026-05-21 12:12:53.846092	Trasferimento #2120 da cesta #6 — 69.38% del cestello
943	131	746	31	468893	1	111	2026-05-22 12:06:23.020399	Da vagliatura #98 del 2026-05-22
944	8	747	31	288550	1	111	2026-05-22 12:06:23.020399	Da vagliatura #98 del 2026-05-22
945	132	748	31	736099	1	111	2026-05-22 12:06:23.020399	Da vagliatura #98 del 2026-05-22
946	133	749	31	602786	1	111	2026-05-22 12:06:23.020399	Da vagliatura #98 del 2026-05-22
947	134	750	31	617273	1	111	2026-05-22 12:06:23.020399	Da vagliatura #98 del 2026-05-22
948	135	751	31	810157	1	111	2026-05-22 12:06:23.020399	Da vagliatura #98 del 2026-05-22
949	10	752	62	104166	30.637058	\N	2026-05-25 07:46:31.098457	Trasferimento parziale #2182 — 30.64% del cestello (quota trattenuta)
950	10	752	31	148069	43.549706	\N	2026-05-25 07:46:31.098457	Trasferimento parziale #2182 — 43.55% del cestello (quota trattenuta)
951	10	752	70	73504	21.618824	\N	2026-05-25 07:46:31.098457	Trasferimento parziale #2182 — 21.62% del cestello (quota trattenuta)
952	10	752	47	14261	4.1944118	\N	2026-05-25 07:46:31.098457	Trasferimento parziale #2182 — 4.19% del cestello (quota trattenuta)
953	16	753	62	104166	30.637058	\N	2026-05-25 07:46:31.098457	Trasferimento #2182 da cesta #10 — 30.64% del cestello
954	16	753	31	148069	43.549706	\N	2026-05-25 07:46:31.098457	Trasferimento #2182 da cesta #10 — 43.55% del cestello
955	16	753	70	73504	21.618824	\N	2026-05-25 07:46:31.098457	Trasferimento #2182 da cesta #10 — 21.62% del cestello
956	16	753	47	14261	4.1944118	\N	2026-05-25 07:46:31.098457	Trasferimento #2182 da cesta #10 — 4.19% del cestello
957	104	754	75	3704263	0.68086296	112	2026-05-25 11:47:57.123996	Da vagliatura #99 del 2026-05-25
958	104	754	70	1736278	0.319137	112	2026-05-25 11:47:57.123996	Da vagliatura #99 del 2026-05-25
959	226	755	75	1330547	0.6808632	112	2026-05-25 11:47:57.123996	Da vagliatura #99 del 2026-05-25
960	226	755	70	623659	0.31913677	112	2026-05-25 11:47:57.123996	Da vagliatura #99 del 2026-05-25
961	110	756	75	3704263	68.086296	\N	2026-05-25 11:48:27.174178	Trasferimento #2193 da cesta #4 — 68.09% del cestello
962	110	756	70	1736278	31.913702	\N	2026-05-25 11:48:27.174178	Trasferimento #2193 da cesta #4 — 31.91% del cestello
963	101	757	81	325389	0.17395012	113	2026-05-26 07:52:52.791207	Da vagliatura #100 del 2026-05-26
964	101	757	75	1154273	0.61706424	113	2026-05-26 07:52:52.791207	Da vagliatura #100 del 2026-05-26
965	101	757	11	390926	0.20898563	113	2026-05-26 07:52:52.791207	Da vagliatura #100 del 2026-05-26
966	103	758	81	476024	0.17395028	113	2026-05-26 07:52:52.791207	Da vagliatura #100 del 2026-05-26
967	103	758	75	1688628	0.6170641	113	2026-05-26 07:52:52.791207	Da vagliatura #100 del 2026-05-26
968	103	758	11	571900	0.20898561	113	2026-05-26 07:52:52.791207	Da vagliatura #100 del 2026-05-26
969	106	759	81	358772	0.17395006	113	2026-05-26 07:52:52.791207	Da vagliatura #100 del 2026-05-26
970	106	759	75	1272695	0.61706424	113	2026-05-26 07:52:52.791207	Da vagliatura #100 del 2026-05-26
971	106	759	11	431033	0.2089857	113	2026-05-26 07:52:52.791207	Da vagliatura #100 del 2026-05-26
972	104	760	81	542969	0.17395025	113	2026-05-26 07:52:52.791207	Da vagliatura #100 del 2026-05-26
973	104	760	75	1926106	0.617064	113	2026-05-26 07:52:52.791207	Da vagliatura #100 del 2026-05-26
974	104	760	11	652329	0.20898576	113	2026-05-26 07:52:52.791207	Da vagliatura #100 del 2026-05-26
975	107	761	81	204802	0.17395005	113	2026-05-26 07:52:52.791207	Da vagliatura #100 del 2026-05-26
976	107	761	75	726507	0.61706394	113	2026-05-26 07:52:52.791207	Da vagliatura #100 del 2026-05-26
977	107	761	11	246052	0.20898603	113	2026-05-26 07:52:52.791207	Da vagliatura #100 del 2026-05-26
978	1	762	81	204802	0.17395005	113	2026-05-26 07:52:52.791207	Da vagliatura #100 del 2026-05-26
979	1	762	75	726507	0.61706394	113	2026-05-26 07:52:52.791207	Da vagliatura #100 del 2026-05-26
980	1	762	11	246052	0.20898603	113	2026-05-26 07:52:52.791207	Da vagliatura #100 del 2026-05-26
981	18	763	31	362303	1	114	2026-05-26 10:08:18.680375	Da vagliatura #101 del 2026-05-26
982	19	764	31	362303	1	114	2026-05-26 10:08:18.680375	Da vagliatura #101 del 2026-05-26
983	20	765	31	374182	1	114	2026-05-26 10:08:18.680375	Da vagliatura #101 del 2026-05-26
984	34	766	31	472018	1	114	2026-05-26 10:08:18.680375	Da vagliatura #101 del 2026-05-26
985	8	767	31	472018	1	114	2026-05-26 10:08:18.680375	Da vagliatura #101 del 2026-05-26
986	13	768	31	472018	1	114	2026-05-26 10:08:18.680375	Da vagliatura #101 del 2026-05-26
987	5	769	31	472018	1	114	2026-05-26 10:08:18.680375	Da vagliatura #101 del 2026-05-26
988	102	770	11	1985292	0.34689242	115	2026-05-27 11:08:09.687572	Da vagliatura #102 del 2026-05-27
989	102	770	75	2642422	0.46171352	115	2026-05-27 11:08:09.687572	Da vagliatura #102 del 2026-05-27
990	102	770	91	1095363	0.19139408	115	2026-05-27 11:08:09.687572	Da vagliatura #102 del 2026-05-27
991	183	771	11	504892	0.34689227	115	2026-05-27 11:08:09.687572	Da vagliatura #102 del 2026-05-27
992	183	771	75	672011	0.46171346	115	2026-05-27 11:08:09.687572	Da vagliatura #102 del 2026-05-27
993	183	771	91	278569	0.19139427	115	2026-05-27 11:08:09.687572	Da vagliatura #102 del 2026-05-27
994	68	772	85	580527	18.114183	\N	2026-05-27 13:22:53.488647	Trasferimento #2276 da cesta #6 — 18.11% del cestello
995	68	772	84	270270	8.433235	\N	2026-05-27 13:22:53.488647	Trasferimento #2276 da cesta #6 — 8.43% del cestello
996	68	772	74	112292	3.5038474	\N	2026-05-27 13:22:53.488647	Trasferimento #2276 da cesta #6 — 3.50% del cestello
997	68	772	89	215376	6.7203774	\N	2026-05-27 13:22:53.488647	Trasferimento #2276 da cesta #6 — 6.72% del cestello
998	68	772	88	97671	3.0476282	\N	2026-05-27 13:22:53.488647	Trasferimento #2276 da cesta #6 — 3.05% del cestello
999	68	772	90	427801	13.348675	\N	2026-05-27 13:22:53.488647	Trasferimento #2276 da cesta #6 — 13.35% del cestello
1000	68	772	91	1500883	46.832054	\N	2026-05-27 13:22:53.488647	Trasferimento #2276 da cesta #6 — 46.83% del cestello
1001	69	773	85	580526	18.114159	\N	2026-05-27 13:23:02.232056	Trasferimento #2278 da cesta #7 — 18.11% del cestello
1002	69	773	84	270270	8.433238	\N	2026-05-27 13:23:02.232056	Trasferimento #2278 da cesta #7 — 8.43% del cestello
1003	69	773	74	112292	3.5038483	\N	2026-05-27 13:23:02.232056	Trasferimento #2278 da cesta #7 — 3.50% del cestello
1004	69	773	89	215377	6.720411	\N	2026-05-27 13:23:02.232056	Trasferimento #2278 da cesta #7 — 6.72% del cestello
1005	69	773	88	97672	3.0476604	\N	2026-05-27 13:23:02.232056	Trasferimento #2278 da cesta #7 — 3.05% del cestello
1006	69	773	90	427800	13.348648	\N	2026-05-27 13:23:02.232056	Trasferimento #2278 da cesta #7 — 13.35% del cestello
1007	69	773	91	1500882	46.832035	\N	2026-05-27 13:23:02.232056	Trasferimento #2278 da cesta #7 — 46.83% del cestello
1008	39	774	70	170824	0.19685423	116	2026-05-28 11:20:39.815875	Da vagliatura #103 del 2026-05-28
1009	39	774	31	392298	0.45207652	116	2026-05-28 11:20:39.815875	Da vagliatura #103 del 2026-05-28
1010	39	774	75	304647	0.35106924	116	2026-05-28 11:20:39.815875	Da vagliatura #103 del 2026-05-28
1011	33	775	70	236011	0.1968548	116	2026-05-28 11:20:39.815875	Da vagliatura #103 del 2026-05-28
1012	33	775	31	541998	0.45207602	116	2026-05-28 11:20:39.815875	Da vagliatura #103 del 2026-05-28
1013	33	775	75	420900	0.35106918	116	2026-05-28 11:20:39.815875	Da vagliatura #103 del 2026-05-28
1014	25	776	75	697456	0.50281703	117	2026-05-28 13:43:57.261244	Da vagliatura #104 del 2026-05-28
1015	25	776	70	539011	0.38858926	117	2026-05-28 13:43:57.261244	Da vagliatura #104 del 2026-05-28
1016	25	776	47	150630	0.1085937	117	2026-05-28 13:43:57.261244	Da vagliatura #104 del 2026-05-28
1017	12	777	75	697456	0.50281703	117	2026-05-28 13:43:57.261244	Da vagliatura #104 del 2026-05-28
1018	12	777	70	539011	0.38858926	117	2026-05-28 13:43:57.261244	Da vagliatura #104 del 2026-05-28
1019	12	777	47	150630	0.1085937	117	2026-05-28 13:43:57.261244	Da vagliatura #104 del 2026-05-28
1020	104	778	75	1285892	0.50281674	117	2026-05-28 13:43:57.261244	Da vagliatura #104 del 2026-05-28
1021	104	778	70	993769	0.38858917	117	2026-05-28 13:43:57.261244	Da vagliatura #104 del 2026-05-28
1022	104	778	47	277716	0.10859408	117	2026-05-28 13:43:57.261244	Da vagliatura #104 del 2026-05-28
1023	105	779	75	1299059	0.50281703	117	2026-05-28 13:43:57.261244	Da vagliatura #104 del 2026-05-28
1024	105	779	70	1003944	0.38858908	117	2026-05-28 13:43:57.261244	Da vagliatura #104 del 2026-05-28
1025	105	779	47	280559	0.10859387	117	2026-05-28 13:43:57.261244	Da vagliatura #104 del 2026-05-28
1026	108	780	75	1299059	0.50281703	117	2026-05-28 13:43:57.261244	Da vagliatura #104 del 2026-05-28
1027	108	780	70	1003944	0.38858908	117	2026-05-28 13:43:57.261244	Da vagliatura #104 del 2026-05-28
1028	108	780	47	280559	0.10859387	117	2026-05-28 13:43:57.261244	Da vagliatura #104 del 2026-05-28
1029	109	781	75	1299059	0.50281703	117	2026-05-28 13:43:57.261244	Da vagliatura #104 del 2026-05-28
1030	109	781	70	1003944	0.38858908	117	2026-05-28 13:43:57.261244	Da vagliatura #104 del 2026-05-28
1031	109	781	47	280559	0.10859387	117	2026-05-28 13:43:57.261244	Da vagliatura #104 del 2026-05-28
1032	1	782	75	532613	0.5028166	117	2026-05-28 13:43:57.261244	Da vagliatura #104 del 2026-05-28
1033	1	782	70	411617	0.38858956	117	2026-05-28 13:43:57.261244	Da vagliatura #104 del 2026-05-28
1034	1	782	47	115029	0.10859384	117	2026-05-28 13:43:57.261244	Da vagliatura #104 del 2026-05-28
1035	21	783	75	532613	0.5028166	117	2026-05-28 13:43:57.261244	Da vagliatura #104 del 2026-05-28
1036	21	783	70	411617	0.38858956	117	2026-05-28 13:43:57.261244	Da vagliatura #104 del 2026-05-28
1037	21	783	47	115029	0.10859384	117	2026-05-28 13:43:57.261244	Da vagliatura #104 del 2026-05-28
1038	101	784	75	929377	0.50281686	117	2026-05-28 13:43:57.261244	Da vagliatura #104 del 2026-05-28
1039	101	784	70	718245	0.38858902	117	2026-05-28 13:43:57.261244	Da vagliatura #104 del 2026-05-28
1040	101	784	47	200719	0.10859414	117	2026-05-28 13:43:57.261244	Da vagliatura #104 del 2026-05-28
1041	102	785	11	992646	34.689247	\N	2026-05-28 13:46:19.948667	Trasferimento parziale #2302 — 34.69% del cestello (quota trattenuta)
1042	102	785	75	1321211	46.17136	\N	2026-05-28 13:46:19.948667	Trasferimento parziale #2302 — 46.17% del cestello (quota trattenuta)
1043	102	785	91	547681	19.139393	\N	2026-05-28 13:46:19.948667	Trasferimento parziale #2302 — 19.14% del cestello (quota trattenuta)
1044	107	786	11	992646	34.689236	\N	2026-05-28 13:46:19.948667	Trasferimento #2302 da cesta #2 — 34.69% del cestello
1045	107	786	75	1321211	46.171345	\N	2026-05-28 13:46:19.948667	Trasferimento #2302 da cesta #2 — 46.17% del cestello
1046	107	786	91	547682	19.139421	\N	2026-05-28 13:46:19.948667	Trasferimento #2302 da cesta #2 — 19.14% del cestello
1047	110	787	75	1852131	68.086296	\N	2026-05-28 13:46:54.14651	Trasferimento parziale #2305 — 68.09% del cestello (quota trattenuta)
1048	110	787	70	868139	31.913708	\N	2026-05-28 13:46:54.14651	Trasferimento parziale #2305 — 31.91% del cestello (quota trattenuta)
1049	103	788	75	1852132	68.0863	\N	2026-05-28 13:46:54.14651	Trasferimento #2305 da cesta #10 — 68.09% del cestello
1050	103	788	70	868139	31.913696	\N	2026-05-28 13:46:54.14651	Trasferimento #2305 da cesta #10 — 31.91% del cestello
1051	18	789	31	446202	1	118	2026-05-29 09:03:07.103632	Da vagliatura #105 del 2026-05-29
1052	19	790	31	301752	1	118	2026-05-29 09:03:07.103632	Da vagliatura #105 del 2026-05-29
1053	81	791	31	438471	1	118	2026-05-29 09:03:07.103632	Da vagliatura #105 del 2026-05-29
1054	2	792	31	1056539	0.826091	119	2026-05-29 09:25:13.017675	Da vagliatura #106 del 2026-05-29
1055	2	792	75	222423	0.173909	119	2026-05-29 09:25:13.017675	Da vagliatura #106 del 2026-05-29
1056	39	793	31	388386	0.8260913	119	2026-05-29 09:25:13.017675	Da vagliatura #106 del 2026-05-29
1057	39	793	75	81763	0.1739087	119	2026-05-29 09:25:13.017675	Da vagliatura #106 del 2026-05-29
1058	37	794	31	388386	0.8260913	119	2026-05-29 09:25:13.017675	Da vagliatura #106 del 2026-05-29
1059	37	794	75	81763	0.1739087	119	2026-05-29 09:25:13.017675	Da vagliatura #106 del 2026-05-29
1060	82	795	31	882403	0.8260909	119	2026-05-29 09:25:13.017675	Da vagliatura #106 del 2026-05-29
1061	82	795	75	185764	0.17390914	119	2026-05-29 09:25:13.017675	Da vagliatura #106 del 2026-05-29
1062	83	796	31	882403	0.8260909	119	2026-05-29 09:25:13.017675	Da vagliatura #106 del 2026-05-29
1063	83	796	75	185764	0.17390914	119	2026-05-29 09:25:13.017675	Da vagliatura #106 del 2026-05-29
1064	84	797	31	987513	0.82609075	119	2026-05-29 09:25:13.017675	Da vagliatura #106 del 2026-05-29
1065	84	797	75	207892	0.17390926	119	2026-05-29 09:25:13.017675	Da vagliatura #106 del 2026-05-29
1066	85	798	31	987513	0.82609075	119	2026-05-29 09:25:13.017675	Da vagliatura #106 del 2026-05-29
1067	85	798	75	207892	0.17390926	119	2026-05-29 09:25:13.017675	Da vagliatura #106 del 2026-05-29
\.


--
-- TOC entry 4254 (class 0 OID 16512)
-- Dependencies: 222
-- Data for Name: baskets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.baskets (id, physical_number, flupsy_id, cycle_code, state, current_cycle_id, nfc_data, "row", "position", nfc_last_programmed_at, group_id, rfid_uhf_epc, rfid_uhf_programmed_at, rfid_uhf_user_data, tare_weight_g, net_mesh) FROM stdin;
17	17	1607	\N	available	\N	\N	SX	7	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
22	2	1608	2-1608-2605	active	659	\N	DX	2	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	700
23	3	1608	3-1608-2605	active	738	\N	DX	3	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	700
24	4	1608	4-1608-2605	active	660	\N	DX	4	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	700
97	17	1036	\N	available	\N	\N	SX	7	\N	8	\N	2025-12-28 14:22:19.980854	\N	\N	\N
3	3	1607	3-1607-2605	active	678	\N	DX	3	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	700
98	18	1036	\N	available	\N	\N	SX	8	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
30	10	1608	10-1608-2605	active	658	\N	DX	10	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
143	13	2627	\N	available	\N	\N	SX	3	\N	\N	0000000000000000AA100004	2026-02-09 14:37:22.152	Cesta-013	\N	\N
94	14	1036	\N	available	\N	\N	SX	4	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
15	15	1607	15-1607-2605	active	644	\N	SX	5	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	1000
111	1	1038	\N	available	\N	\N	DX	1	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
96	16	1036	\N	available	\N	\N	SX	6	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
26	6	1608	6-1608-2605	active	670	\N	DX	6	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
145	15	2627	\N	available	\N	\N	SX	5	\N	\N	\N	2026-01-14 13:28:56.122	Cesta-015	\N	\N
49	9	1039	\N	available	\N	\N	DX	9	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
50	10	1039	\N	available	\N	\N	DX	10	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
51	11	1039	\N	available	\N	\N	SX	1	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
52	12	1039	\N	available	\N	\N	SX	2	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
53	13	1039	\N	available	\N	\N	SX	3	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
54	14	1039	\N	available	\N	\N	SX	4	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
144	14	2627	\N	available	\N	\N	SX	4	\N	\N	0000000000000000AA100005	2026-02-09 14:37:50.868	Cesta-014	\N	\N
55	15	1039	\N	available	\N	\N	SX	5	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
56	16	1039	\N	available	\N	\N	SX	6	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
57	17	1039	\N	available	\N	\N	SX	7	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
58	18	1039	\N	available	\N	\N	SX	8	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
59	19	1039	\N	available	\N	\N	SX	9	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
60	20	1039	\N	available	\N	\N	SX	10	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
27	7	1608	7-1608-2605	active	671	\N	DX	7	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
116	6	1038	\N	available	\N	\N	DX	6	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
8	8	1607	8-1607-2605	active	767	\N	DX	8	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
115	5	1038	\N	available	\N	\N	DX	5	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
71	11	1012	\N	available	\N	\N	SX	1	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
72	12	1012	\N	available	\N	\N	SX	2	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
73	13	1012	\N	available	\N	\N	SX	3	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
74	14	1012	\N	available	\N	\N	SX	4	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
75	15	1012	\N	available	\N	\N	SX	5	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
76	16	1012	\N	available	\N	\N	SX	6	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
77	17	1012	\N	available	\N	\N	SX	7	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
78	18	1012	\N	available	\N	\N	SX	8	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
79	19	1012	\N	available	\N	\N	SX	9	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
80	20	1012	\N	available	\N	\N	SX	10	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
68	8	1012	8-1012-2605	active	772	\N	DX	8	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
69	9	1012	9-1012-2605	active	773	\N	DX	9	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
70	10	1012	\N	available	\N	\N	DX	10	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
146	16	2627	\N	available	\N	\N	SX	6	\N	\N	\N	2026-01-14 13:28:56.17	Cesta-016	\N	\N
138	8	2627	\N	available	\N	\N	DX	8	\N	\N	\N	\N	Cesta-008	\N	\N
41	1	1039	\N	available	\N	\N	DX	3	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
142	12	2627	\N	available	\N	\N	SX	2	\N	\N	0000000000000000AA100003	2026-02-09 14:36:37.793	Cesta-012	\N	\N
141	11	2627	\N	available	\N	\N	SX	1	\N	\N	0000000000000000AA100002	2026-02-09 14:35:57.614	Cesta-011	\N	\N
140	10	2627	\N	available	\N	\N	DX	10	\N	\N	0000000000000000BB200108	2026-02-09 14:30:35.011	Cesta-010	\N	\N
109	9	1037	9-1037-2605	active	781	\N	SX	4	\N	\N	0000000000000000BB200106	2026-04-01 07:51:50.408	\N	\N	\N
89	9	1036	\N	available	\N	\N	DX	9	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
113	3	1038	\N	available	\N	\N	DX	3	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
62	2	1012	\N	available	\N	\N	DX	2	\N	\N	\N	\N	\N	\N	\N
133	3	2627	\N	available	\N	\N	DX	3	\N	\N	\N	\N	Cesta-003	\N	\N
117	7	1038	\N	available	\N	\N	DX	7	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
93	13	1036	\N	available	\N	\N	SX	3	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
101	1	1037	1-1037-2605	active	784	\N	DX	1	\N	\N	0000000000000000BB200092	2026-03-17 13:03:40.555	\N	\N	700
1	1	1607	1-1607-2605	active	782	\N	DX	1	\N	11	\N	2025-12-28 14:22:19.980854	\N	\N	700
90	10	1036	\N	available	\N	\N	DX	10	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
16	16	1607	\N	available	\N	\N	SX	6	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
2	2	1607	\N	available	\N	\N	DX	2	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	700
82	2	1036	2-1036-2605	active	795	\N	DX	2	\N	\N	\N	2025-12-28 14:22:19.980854	\N	22000	1000
85	5	1036	5-1036-2605	active	798	\N	DX	5	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
66	6	1012	6-1012-2605	active	695	\N	DX	6	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
67	7	1012	7-1012-2605	active	696	\N	DX	7	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
95	15	1036	\N	available	\N	\N	SX	5	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
6	6	1607	6-1607-2605	active	643	\N	DX	6	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
65	5	1012	\N	available	\N	\N	DX	5	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
112	2	1038	\N	available	\N	\N	DX	2	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
130	20	1038	\N	available	\N	\N	SX	10	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
39	19	1608	19-1608-2605	active	793	\N	SX	9	\N	15	\N	2025-12-28 14:22:19.980854	\N	\N	\N
102	2	1037	2-1037-2605	active	785	\N	DX	2	\N	\N	0000000000000000BB200091	2026-03-17 13:03:59.378	\N	\N	500
32	12	1608	12-1608-2605	active	662	\N	SX	2	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	1000
29	9	1608	9-1608-2605	active	656	\N	DX	9	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
28	8	1608	8-1608-2605	active	657	\N	DX	8	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
127	17	1038	\N	available	\N	\N	SX	7	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
99	19	1036	\N	available	\N	\N	SX	9	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
121	11	1038	\N	available	\N	\N	SX	1	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
129	19	1038	\N	available	\N	\N	SX	9	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
86	6	1036	\N	available	\N	\N	DX	6	\N	\N	\N	2025-12-28 14:13:09.76	\N	\N	\N
35	15	1608	\N	available	\N	\N	SX	5	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	1000
139	9	2627	\N	available	\N	\N	DX	9	\N	\N	0000000000000000BB200107	2026-02-09 14:29:28.503	Cesta-009	\N	\N
114	4	1038	\N	available	\N	\N	DX	4	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
148	18	2627	\N	available	\N	\N	SX	8	\N	\N	\N	2026-01-14 13:28:56.275	Cesta-018	\N	\N
106	6	1037	6-1037-2605	active	759	\N	SX	1	\N	\N	0000000000000000BB200109	2026-04-01 07:50:55.881	\N	\N	500
123	13	1038	\N	available	\N	\N	SX	3	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
185	3	5336	\N	available	\N	\N	DX	3	\N	\N	\N	2026-04-30 10:24:54.292	Cesta-055	\N	\N
186	4	5336	\N	available	\N	\N	DX	4	\N	\N	\N	2026-04-30 10:24:54.335	Cesta-056	\N	\N
4	4	1607	4-1607-2605	active	737	\N	DX	4	\N	\N	\N	2025-12-28 14:22:19.980854	\N	33900	700
187	5	5336	\N	available	\N	\N	DX	5	\N	\N	\N	2026-04-30 10:24:54.379	Cesta-057	\N	\N
188	6	5336	\N	available	\N	\N	SX	1	\N	\N	\N	2026-04-30 10:24:54.422	Cesta-058	\N	\N
189	7	5336	\N	available	\N	\N	SX	2	\N	\N	\N	2026-04-30 10:24:54.466	Cesta-059	\N	\N
190	8	5336	\N	available	\N	\N	SX	3	\N	\N	\N	2026-04-30 10:24:54.511	Cesta-060	\N	\N
191	9	5336	\N	available	\N	\N	SX	4	\N	\N	\N	2026-04-30 10:24:54.555	Cesta-061	\N	\N
192	10	5336	\N	available	\N	\N	SX	5	\N	\N	\N	2026-04-30 10:24:54.599	Cesta-062	\N	\N
183	1	5336	1-5336-2605	active	771	\N	DX	1	\N	\N	\N	2026-04-30 10:24:54.199	Cesta-053	\N	\N
184	2	5336	\N	available	\N	\N	DX	2	\N	\N	\N	2026-04-30 10:24:54.246	Cesta-054	\N	\N
119	9	1038	\N	available	\N	\N	DX	9	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
33	13	1608	13-1608-2605	active	775	\N	SX	3	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	1000
118	8	1038	\N	available	\N	\N	DX	8	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
125	15	1038	\N	available	\N	\N	SX	5	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
122	12	1038	\N	available	\N	\N	SX	2	\N	\N	434553544130303300000000	2026-01-04 15:22:11.99	\N	\N	\N
100	20	1036	\N	available	\N	\N	SX	10	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
104	4	1037	4-1037-2605	active	778	\N	DX	4	\N	\N	0000000000000000BB200100	2026-03-25 07:37:20.214	\N	\N	\N
147	17	2627	\N	available	\N	\N	SX	7	\N	\N	\N	2026-01-14 13:28:56.228	Cesta-017	\N	\N
105	5	1037	5-1037-2605	active	779	\N	DX	5	\N	\N	0000000000000000BB200101	2026-04-01 07:20:53.002	\N	\N	\N
124	14	1038	\N	available	\N	\N	SX	4	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
126	16	1038	\N	available	\N	\N	SX	6	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
128	18	1038	\N	available	\N	\N	SX	8	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
108	8	1037	8-1037-2605	active	780	\N	SX	3	\N	\N	0000000000000000BB200103	2026-04-01 07:51:24.174	\N	\N	\N
149	19	2627	\N	available	\N	\N	SX	9	\N	\N	\N	2026-01-14 13:28:56.321	Cesta-019	\N	\N
107	7	1037	7-1037-2605	active	786	\N	SX	2	\N	\N	0000000000000000BB200105	2026-04-01 07:50:31.727	\N	\N	700
110	10	1037	10-1037-2605	active	787	\N	SX	5	\N	\N	0000000000000000BB200102	2026-04-01 07:52:17.644	\N	\N	\N
103	3	1037	3-1037-2605	active	788	\N	DX	3	\N	\N	0000000000000000BB200104	2026-03-25 14:09:22.306	\N	\N	\N
150	20	2627	\N	available	\N	\N	SX	10	\N	\N	\N	2026-01-14 13:28:56.369	Cesta-020	\N	\N
87	7	1036	\N	available	\N	\N	DX	7	\N	\N	\N	2025-12-28 14:14:21.478	\N	\N	\N
25	5	1608	5-1608-2605	active	776	\N	DX	5	\N	11	E2004713DD10602263E9010F	2026-01-04 15:24:03.408	\N	\N	700
88	8	1036	\N	available	\N	\N	DX	8	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
218	6	5399	\N	available	\N	\N	SX	1	\N	\N	\N	2026-05-05 14:22:37.105	Cesta-088	\N	\N
120	10	1038	\N	available	\N	\N	DX	10	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
21	1	1608	1-1608-2605	active	783	\N	DX	1	\N	11	\N	2025-12-28 14:22:19.980854	\N	\N	700
213	1	5399	\N	available	\N	\N	DX	1	\N	\N	\N	2026-05-05 14:22:36.856	Cesta-083	\N	\N
214	2	5399	\N	available	\N	\N	DX	2	\N	\N	\N	2026-05-05 14:22:36.906	Cesta-084	\N	\N
219	7	5399	\N	available	\N	\N	SX	2	\N	\N	\N	2026-05-05 14:22:37.158	Cesta-089	\N	\N
220	8	5399	\N	available	\N	\N	SX	3	\N	\N	\N	2026-05-05 14:22:37.209	Cesta-090	\N	\N
221	9	5399	\N	available	\N	\N	SX	4	\N	\N	\N	2026-05-05 14:22:37.261	Cesta-091	\N	\N
222	10	5399	\N	available	\N	\N	SX	5	\N	\N	\N	2026-05-05 14:22:37.311	Cesta-092	\N	\N
215	3	5399	\N	available	\N	\N	DX	3	\N	\N	\N	2026-05-05 14:22:36.956	Cesta-085	\N	\N
20	20	1607	\N	available	\N	\N	SX	10	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
19	19	1607	\N	available	\N	\N	SX	9	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
135	5	2627	\N	available	\N	\N	DX	5	\N	\N	\N	\N	Cesta-005	\N	\N
216	4	5399	\N	available	\N	\N	DX	4	\N	\N	\N	2026-05-05 14:22:37.005	Cesta-086	\N	\N
81	1	1036	1-1036-2605	active	791	\N	DX	1	\N	\N	434553544130303100000000	2026-01-04 12:30:41.987	\N	\N	\N
217	5	5399	\N	available	\N	\N	DX	5	\N	\N	\N	2026-05-05 14:22:37.055	Cesta-087	\N	\N
31	11	1608	\N	available	\N	\N	SX	1	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	1000
83	3	1036	3-1036-2605	active	796	\N	DX	3	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
194	2	5397	2-5397-2605	active	706	\N	DX	2	\N	\N	\N	2026-05-05 14:20:26.802	Cesta-064	\N	\N
12	12	1607	12-1607-2605	active	777	\N	SX	2	\N	11	\N	2025-12-28 14:22:19.980854	\N	\N	1000
161	11	3889	\N	available	\N	\N	SX	1	\N	\N	\N	2026-02-24 13:57:40.037	Cesta-031	\N	\N
156	6	3889	\N	available	\N	\N	DX	6	\N	\N	\N	2026-02-24 13:57:39.799	Cesta-026	\N	\N
163	13	3889	\N	available	\N	\N	SX	3	\N	\N	\N	2026-02-24 13:57:40.127	Cesta-033	\N	\N
164	14	3889	\N	available	\N	\N	SX	4	\N	\N	\N	2026-02-24 13:57:40.174	Cesta-034	\N	\N
154	4	3889	\N	available	\N	\N	DX	4	\N	\N	\N	2026-02-24 13:57:39.71	Cesta-024	\N	\N
157	7	3889	\N	available	\N	\N	DX	7	\N	\N	\N	2026-02-24 13:57:39.85	Cesta-027	\N	\N
160	10	3889	\N	available	\N	\N	DX	10	\N	\N	\N	2026-02-24 13:57:39.992	Cesta-030	\N	\N
152	2	3889	\N	available	\N	\N	DX	2	\N	\N	\N	2026-02-24 13:57:39.62	Cesta-022	\N	\N
151	1	3889	\N	available	\N	\N	DX	1	\N	\N	\N	2026-02-24 13:57:39.512	Cesta-021	\N	\N
18	18	1607	\N	available	\N	\N	SX	8	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
91	11	1036	\N	available	\N	\N	SX	1	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
162	12	3889	\N	available	\N	\N	SX	2	\N	\N	\N	2026-02-24 13:57:40.082	Cesta-032	\N	\N
9	9	1607	\N	available	\N	\N	DX	9	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
158	8	3889	\N	available	\N	\N	DX	8	\N	\N	\N	2026-02-24 13:57:39.899	Cesta-028	\N	\N
40	20	1608	\N	available	\N	\N	SX	10	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
165	15	3889	\N	available	\N	\N	SX	5	\N	\N	\N	2026-02-24 13:57:40.219	Cesta-035	\N	\N
153	3	3889	\N	available	\N	\N	DX	3	\N	\N	\N	2026-02-24 13:57:39.665	Cesta-023	\N	\N
166	16	3889	\N	available	\N	\N	SX	6	\N	\N	\N	2026-02-24 13:57:40.263	Cesta-036	\N	\N
167	17	3889	\N	available	\N	\N	SX	7	\N	\N	\N	2026-02-24 13:57:40.311	Cesta-037	\N	\N
168	18	3889	\N	available	\N	\N	SX	8	\N	\N	\N	2026-02-24 13:57:40.357	Cesta-038	\N	\N
169	19	3889	\N	available	\N	\N	SX	9	\N	\N	\N	2026-02-24 13:57:40.403	Cesta-039	\N	\N
170	20	3889	\N	available	\N	\N	SX	10	\N	\N	\N	2026-02-24 13:57:40.45	Cesta-040	\N	\N
159	9	3889	\N	available	\N	\N	DX	9	\N	\N	\N	2026-02-24 13:57:39.944	Cesta-029	\N	\N
155	5	3889	\N	available	\N	\N	DX	5	\N	\N	\N	2026-02-24 13:57:39.754	Cesta-025	\N	\N
195	3	5397	\N	available	\N	\N	DX	3	\N	\N	\N	2026-05-05 14:20:26.85	Cesta-065	\N	\N
196	4	5397	\N	available	\N	\N	DX	4	\N	\N	\N	2026-05-05 14:20:26.899	Cesta-066	\N	\N
197	5	5397	\N	available	\N	\N	DX	5	\N	\N	\N	2026-05-05 14:20:26.946	Cesta-067	\N	\N
198	6	5397	\N	available	\N	\N	SX	1	\N	\N	\N	2026-05-05 14:20:26.995	Cesta-068	\N	\N
199	7	5397	\N	available	\N	\N	SX	2	\N	\N	\N	2026-05-05 14:20:27.044	Cesta-069	\N	\N
200	8	5397	\N	available	\N	\N	SX	3	\N	\N	\N	2026-05-05 14:20:27.092	Cesta-070	\N	\N
201	9	5397	\N	available	\N	\N	SX	4	\N	\N	\N	2026-05-05 14:20:27.14	Cesta-071	\N	\N
202	10	5397	\N	available	\N	\N	SX	5	\N	\N	\N	2026-05-05 14:20:27.189	Cesta-072	\N	\N
34	14	1608	14-1608-2605	active	766	\N	SX	4	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	1000
13	13	1607	13-1607-2605	active	768	\N	SX	3	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	1000
5	5	1607	5-1607-2605	active	769	\N	DX	5	\N	\N	20240926140600400000003B	2026-01-04 15:47:42.964	\N	\N	1000
227	5	5400	\N	available	\N	\N	DX	5	\N	\N	\N	2026-05-05 14:22:41.861	Cesta-097	\N	\N
228	6	5400	\N	available	\N	\N	SX	1	\N	\N	\N	2026-05-05 14:22:41.91	Cesta-098	\N	\N
229	7	5400	\N	available	\N	\N	SX	2	\N	\N	\N	2026-05-05 14:22:41.957	Cesta-099	\N	\N
230	8	5400	\N	available	\N	\N	SX	3	\N	\N	\N	2026-05-05 14:22:42.002	Cesta-100	\N	\N
231	9	5400	\N	available	\N	\N	SX	4	\N	\N	\N	2026-05-05 14:22:42.049	Cesta-101	\N	\N
232	10	5400	\N	available	\N	\N	SX	5	\N	\N	\N	2026-05-05 14:22:42.096	Cesta-102	\N	\N
11	11	1607	\N	available	\N	\N	SX	1	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	1000
14	14	1607	\N	available	\N	\N	SX	4	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	1000
7	7	1607	7-1607-2605	active	733	\N	DX	7	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
38	18	1608	18-1608-2605	active	739	\N	SX	8	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
223	1	5400	1-5400-2605	active	743	\N	DX	1	\N	\N	\N	2026-05-05 14:22:41.675	Cesta-093	\N	\N
224	2	5400	2-5400-2605	active	744	\N	DX	2	\N	\N	\N	2026-05-05 14:22:41.723	Cesta-094	\N	\N
225	3	5400	3-5400-2605	active	745	\N	DX	3	\N	\N	\N	2026-05-05 14:22:41.769	Cesta-095	\N	\N
42	2	1039	\N	available	\N	\N	DX	2	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
43	3	1039	\N	available	\N	\N	DX	3	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
44	4	1039	\N	available	\N	\N	DX	4	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
45	5	1039	\N	available	\N	\N	DX	5	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
46	6	1039	\N	available	\N	\N	DX	6	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
47	7	1039	\N	available	\N	\N	DX	7	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
48	8	1039	\N	available	\N	\N	DX	8	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
131	1	2627	\N	available	\N	\N	DX	1	\N	\N	0000000000000000BB200110	2026-02-05 10:57:26.792	Cesta-001	\N	\N
132	2	2627	\N	available	\N	\N	DX	2	\N	\N	\N	\N	Cesta-002	\N	\N
10	10	1607	10-1607-2605	active	752	\N	DX	10	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
193	1	5397	\N	available	\N	\N	DX	1	\N	\N	\N	2026-05-05 14:20:26.748	Cesta-063	\N	\N
226	4	5400	4-5400-2605	active	755	\N	DX	4	\N	\N	\N	2026-05-05 14:22:41.814	Cesta-096	\N	\N
204	2	5398	\N	available	\N	\N	DX	2	\N	\N	\N	2026-05-05 14:21:29.847	Cesta-074	\N	\N
92	12	1036	\N	available	\N	\N	SX	2	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
203	1	5398	1-5398-2605	active	705	\N	DX	1	\N	\N	\N	2026-05-05 14:21:29.801	Cesta-073	\N	\N
136	6	2627	\N	available	\N	\N	DX	6	\N	\N	\N	\N	Cesta-006	\N	\N
37	17	1608	17-1608-2605	active	794	\N	SX	7	\N	15	\N	2025-12-28 14:22:19.980854	\N	\N	\N
84	4	1036	4-1036-2605	active	797	\N	DX	4	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
208	6	5398	\N	available	\N	\N	SX	1	\N	\N	\N	2026-05-05 14:21:30.051	Cesta-078	\N	\N
36	16	1608	16-1608-2605	active	694	\N	SX	6	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
205	3	5398	3-5398-2605	active	742	\N	DX	3	\N	\N	\N	2026-05-05 14:21:29.893	Cesta-075	\N	\N
134	4	2627	\N	available	\N	\N	DX	4	\N	\N	\N	\N	Cesta-004	\N	\N
209	7	5398	\N	available	\N	\N	SX	2	\N	\N	\N	2026-05-05 14:21:30.098	Cesta-079	\N	\N
64	4	1012	\N	available	\N	\N	DX	4	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
63	3	1012	\N	available	\N	\N	DX	3	\N	\N	\N	2025-12-28 14:22:19.980854	\N	\N	\N
210	8	5398	\N	available	\N	\N	SX	3	\N	\N	\N	2026-05-05 14:21:30.144	Cesta-080	\N	\N
211	9	5398	\N	available	\N	\N	SX	4	\N	\N	\N	2026-05-05 14:21:30.191	Cesta-081	\N	\N
61	1	1012	\N	available	\N	\N	DX	1	\N	\N	E20047056CD0602376610112	2026-01-18 16:55:22.848	\N	\N	\N
212	10	5398	\N	available	\N	\N	SX	5	\N	\N	\N	2026-05-05 14:21:30.237	Cesta-082	\N	\N
137	7	2627	\N	available	\N	\N	DX	7	\N	\N	\N	\N	Cesta-007	\N	\N
206	4	5398	\N	available	\N	\N	DX	4	\N	\N	\N	2026-05-05 14:21:29.95	Cesta-076	\N	\N
207	5	5398	\N	available	\N	\N	DX	5	\N	\N	\N	2026-05-05 14:21:30.005	Cesta-077	\N	\N
\.


--
-- TOC entry 4256 (class 0 OID 16522)
-- Dependencies: 224
-- Data for Name: clienti; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clienti (id, denominazione, indirizzo, comune, cap, provincia, paese, email, telefono, piva, codice_fiscale, fatture_in_cloud_id, attivo, created_at, updated_at) FROM stdin;
114	Soc Coop Poseidone		Rosolina	45010	RO	Italia			01251320295	01251320295	65131264	t	2025-12-10 14:24:58.479865	2026-05-12 12:54:06.246
115	SOCIETA' COOPERATIVA ACQUAVIVA		Comacchio	44022	FE	Italia	massimoballarinidec@libero.it		01841330382	01841330382	100567340	t	2025-12-10 14:25:01.723435	2026-05-12 12:54:11.647
113	SOCIETA' COOPERATIVA PESCATORI S.GIULIA		PORTO TOLLE	45018	RO	Italia			01158780294	01158780294	102995720	t	2025-12-10 14:24:56.017935	2026-05-12 12:54:11.925
109	SOL LEVANTE - SOCIETA' COOPERATIVA		Goro	44020	FE	Italia	coopsollevante@gmail.com		01924210386	01924210386	96632864	t	2025-12-10 14:24:38.052524	2026-05-12 12:54:12.209
116	TURGIAMAR SOC. COOP.		Goro	44020	FE	Italia	studiofabianicinti@virgilio.it		01627470386	01627470386	65131283	t	2025-12-10 14:25:04.290874	2026-05-12 12:54:15.261
8	Azzalin Celestino		Porto Viro	45014	RO	Italia	criscele@icloud.com		01498140290	zzlcst74h30a059Y	65131203	t	2025-11-28 08:42:51.177759	2026-05-12 12:53:42.035
9	Barboni Franco		Mesola	44026	FE	Italia	nikcurvaovest74@gmail.com		01796430385	brbfnc57l02f156u	65131204	t	2025-11-28 08:42:51.718246	2026-05-12 12:53:42.421
11	BioClam		Rosolina	45010	RO	Italia	bioclam@pec.it		01531600292	01531600292	65131205	t	2025-11-28 08:42:52.403786	2026-05-12 12:53:43.009
12	BORDINA ALBERTO		Rosolina	45010	RO	Italia	bordina72@gmail.com		01345320293	BRDLRT72M14G224B	100990747	t	2025-11-28 08:42:52.72375	2026-05-12 12:53:43.293
13	Boscarato Alessandro		Rosolina	45010	RO	Italia			01034440295	BSCLSN64C18H573H	65131206	t	2025-11-28 08:42:53.046556	2026-05-12 12:53:43.582
14	BROS SOCIETA' SEMPLICE AGRICOLA		COMACCHIO	44022	FERRARA	Italia			01998490385	01998490385	65131207	t	2025-11-28 08:42:53.853677	2026-05-12 12:53:44.197
117	CLAMS SOCIETA' COOPERATIVA		GORO	44020	FE	Italia	vincenzo.rizzardi@libero.it		01592850380	01592850380	102900420	t	2025-12-10 14:25:06.806046	2026-05-12 12:53:45.661
112	VENUS - SOC. COOP.		GORO	44020	FE	Italia	coopvenusgoro@gmail.com		01252330384	01252330384	96266019	t	2025-12-10 14:24:53.568225	2026-05-12 12:54:15.89
2	Alba Nuova Cooperativa a mutualità prevalente		Goro	44020	FE	Italia	alba.nuova@libero.it,albanuova.coop@libero.it		01952290383	01952290383	65131223	t	2025-11-28 08:42:47.514331	2026-05-12 12:53:40.684
3	ALBA Società cooperativa		Rosolina RO, Italia	45010	RO	Italia			IT01187870298	01187870298	65131199	t	2025-11-28 08:42:47.577464	2026-05-12 12:53:40.73
108	Consorzio Pescatori di Goro Soc. Coop. OP		Goro	44020	FE	Italia	paola.gianella@copego.it,massimo.genari@copego.it		00040400384	00040400384	96265343	t	2025-12-10 14:24:33.375535	2026-05-12 12:53:46.577
110	Coop. Adriatica Gorino		Gorino FE, Italia	44020	FE	Italia	coopadriatica@libero.it		00423670389	82002630380	65131218	t	2025-12-10 14:24:42.750743	2026-05-12 12:53:47.203
137	Cooperativa GORO & BOSCO		Bosco Mesola	44026	Ferrara	Italia	coopgorobosco@gmail.com		01708360381	01708360381	65131227	t	2026-01-13 14:56:57.459943	2026-05-12 12:53:48.633
10	Bassa Marea Soc. Coop. Agricola		Goro	44020	FE	Italia	deltaced@deltaced.it		02137160384	N/A	\N	t	2025-11-28 08:42:52.094401	2026-01-13 14:49:37.873
111	Cooperativa LA ROMANINA Soc. Coop. arl		Mesola	44026	FE	Italia	cooplaromanina@gmail.com		01427580384	01427580384	100965128	t	2025-12-10 14:24:51.074226	2026-05-12 12:53:48.93
118	Cooperativa Pescatori Laghese Società Cooperativa ARL		Lagosanto	44023	FE	Italia	nicoletta.carlin@studio-duo.it		01356120384	01356120384	97305199	t	2025-12-10 14:25:11.763793	2026-05-12 12:53:50.488
119	Cooperativa Sole Soc. Coop. agricola		GORO	44020	FE	Italia	deltadec@deltaced.it,paganinipaolo@gmail.com		02153890385	02153890385	102726284	t	2025-12-10 14:25:14.194965	2026-05-12 12:53:51.564
107	NEW AGRICOLT Innovation soc agr srl		Mesola	44026	FE	Italia	delta@deltaced.it		01708360381	01708360381	65131252	t	2025-12-10 14:24:27.899223	2026-05-12 12:54:01.746
106	PINCO E PALLINO SOCIETA' A RESPONSABILITA' LIMITATA		ROMA	00195	RM	Italia			12671561004	12671561004	104337346	t	2025-12-10 11:10:56.370873	2026-05-12 12:54:02.687
138	Soc Coop Pescatori Rosolina		Rosolina	45010	RO	Italia	coop.rosolina@tiscali.it		00750250292	00750250292	65131263	t	2026-01-13 14:57:44.950959	2026-05-12 12:54:05.94
4	Albarella soc. Coop.		Rosolina RO, Italia	45010	RO	Italia			00942980293	00942980293	65131200	t	2025-11-28 08:42:47.642317	2026-05-12 12:53:40.775
6	Apollo soc.coop.arl		Goro	44020	FE	Italia	riccisound@gmail.com		01484940380	01484940380	65131201	t	2025-11-28 08:42:49.885955	2026-05-12 12:53:41.381
7	Aurora SSA		Goro	44020	FE	Italia	aurorasoc3@gmail.com		02086280381	02086280381	65131202	t	2025-11-28 08:42:50.218783	2026-05-12 12:53:41.74
5	ALCIONE PESCA SOCIETA' AGRICOLA S.S.		PORTO VIRO	45014	RO	Italia	sebastianocamuffo@gmail.com		01564660296	N/A	\N	t	2025-11-28 08:42:48.537943	2026-01-13 14:49:31.401
125	SOCIETA' AGRICOLA TIRRENA		PORTO VIRO	45014	RO	Italia	office.deltafuturo@gmail.com		00305250292	00305250292	65131277	t	2025-12-10 14:25:37.098778	2026-05-12 12:54:11.346
126	Ceppa Società Semplice Agricola di Oselladore R.E. Bollini J.		Rosolina	45010	RO	Italia	ruggero977@gmail.com		01522020294	01522020294	65131210	t	2025-12-10 14:25:38.752536	2026-05-12 12:53:45.38
121	Coop. La Vela		Goro	44020	FE	Italia	cooplavela@outlook.com		01227850383	01227850383	65131219	t	2025-12-10 14:25:21.559719	2026-05-12 12:53:47.5
30	Cooperativa del Mare		Goro	44020	FE	Italia	amministrazione@coopdelmare.it		00745110387	00745110387	65131226	t	2025-11-28 08:42:59.03489	2026-05-12 12:53:48.346
33	Cooperativa Pesca Soc.Coop.		Goro	44020	FE	Italia	coopvolano@lamiapec.it		01743670380	01743670380	65131228	t	2025-11-28 08:43:00.615388	2026-05-12 12:53:49.273
35	COOPERATIVA PESCATORI DI VOLANO - SOCIETA' COOPERATIVA		CODIGORO	44021	FE	Italia			01740080385	01740080385	65131229	t	2025-11-28 08:43:01.35211	2026-05-12 12:53:49.908
36	Cooperativa Pescatori Eridania srl		Porto Viro	45014	RO	Italia	info@eridania.191.it		00038310298	00038310298	65131221	t	2025-11-28 08:43:01.708197	2026-05-12 12:53:50.195
131	COOPERATIVA PESCATORI PO SOCIETA' COOPERATIVA		PORTO TOLLE	45018	RO	Italia			00243290293	00243290293	105431458	t	2026-01-12 17:31:26.406069	2026-05-12 12:53:50.783
38	Cooperativa S. ANTONIO Società Cooperativa		Goro	44020	FE	Italia	coopsantantonio@libero.it		01258950383	01258950383	96815833	t	2025-11-28 08:43:02.365562	2026-05-12 12:53:51.076
120	LA BUSSOLA - SOCIETA' COOPERATIVA		GORO	44020	FE	Italia	labussolagoro@tiscali.it		01654200383	01654200383	102579187	t	2025-12-10 14:25:16.850454	2026-05-12 12:53:56.659
124	LA SACCA SOC. COOPERATIVA		Goro	44020	FE	Italia	cooplasacca@libero.it		01427440381	01427440381	99972334	t	2025-12-10 14:25:35.538357	2026-05-12 12:53:57.566
127	LA VERACE Società Cooperativa		Goro	44020	Ferrara	Italia	coop.laverace@virgilio.it		01877390383	01877390383	65131247	t	2025-12-10 14:25:40.407678	2026-05-12 12:53:58.424
62	MARCHIOL S.P.A.		RONCADE	31056	TV	Italia			01176110268	01176110268	81609557	t	2025-11-28 08:43:14.635891	2026-05-12 12:53:59.66
63	MARTIN JONNI		Rosolina RO, Italia	45010	ROVIGO	Italia			01334030291	MRTJNN74P10A059O	65131249	t	2025-11-28 08:43:14.698291	2026-05-12 12:53:59.704
34	COOPERATIVA PESCATORI DEL DELTA - SOCIETA' COOPERATIVA		GORO	44020	FE	Italia	cooppescatorideldelta@virgilio.it		01123310383	N/A	\N	t	2025-11-28 08:43:00.987604	2026-01-13 14:50:06.89
64	Milani Nicola		Gorino	44020	FE	Italia	coopadriatica@libero.it		01147900383	MLNNCL72C06D548A	100482692	t	2025-11-28 08:43:14.992359	2026-05-12 12:54:00.299
65	Milani Vittorio		Gorino	44020	FE	Italia	coopadriatica@libero.it		01078860382	MLNVTR67P24E107C	100482760	t	2025-11-28 08:43:15.39788	2026-05-12 12:54:00.581
66	Miracoli soc agr		Goro	44020	FE	Italia	raffaelecazzola84@gmail.com		01893940385	gllmln85l64g916p	65131250	t	2025-11-28 08:43:15.869173	2026-05-12 12:54:00.857
40	Denodini Mar di Turri Thomas		Rosolina	45010	RO	Italia	denodinim@pec.it		01591170293	01591170293	65131232	t	2025-11-28 08:43:03.30581	2026-05-12 12:53:51.954
67	Moceniga Pesca S.S.		Rosolina	45010	RO	Italia	moceniga@libero.it		01082120294	01082120294	65131251	t	2025-11-28 08:43:16.1634	2026-05-12 12:54:01.205
68	Nuova Levante S.s.		Comacchio	44022	FE	Italia	snc.alberi@gmail.com		01729020386	01729020386	65131253	t	2025-11-28 08:43:16.728171	2026-05-12 12:54:02.035
69	PICO PALLINO SOCIETA' A RESPONSABILITA' LIMITATA SEMPLIFICATA		REGGIO EMILIA	42121	RE	Italia			02585550359	02585550359	102896618	t	2025-11-28 08:43:17.132763	2026-05-12 12:54:02.345
70	POLESINE CONSULTING S.R.L.		PORTO VIRO	45014	RO	Italia			01613480290	01613480290	65131254	t	2025-11-28 08:43:17.496643	2026-05-12 12:54:02.977
31	NEW AGRICOLT Innovation soc agr srl		Mesola	44026	FE	Italia	delta@deltaced.it		01708360381	N/A	\N	t	2025-11-28 08:42:59.553713	2026-01-13 14:50:54.594
123	ALCIONE PESCA SOCIETA' AGRICOLA S.S.		PORTO VIRO	45014	RO	Italia	sebastianocamuffo@gmail.com		01564660296	01564660296	103080366	t	2025-12-10 14:25:32.484954	2026-05-12 12:53:41.07
122	Bassa Marea Soc. Coop. Agricola		Goro	44020	FE	Italia	deltaced@deltaced.it		02137160384	02137160384	102432099	t	2025-12-10 14:25:26.739403	2026-05-12 12:53:42.704
41	e-distribuzione SpA		Roma	00198	RM	Italia	alessandro.andreani@enel.com		15844561009	05779711000	90391936	t	2025-11-28 08:43:03.684666	2026-05-12 12:53:52.242
42	Ecotapes Zeeland B.V.		Kamperland	4493	Nederland	Paesi Bassi	ecotapes.zeeland@gmail.com		NL862293832B01	NL862293832B01	71624329	t	2025-11-28 08:43:04.028972	2026-05-12 12:53:52.515
37	Cooperativa Pescatori Laghese Società Cooperativa ARL		Lagosanto	44023	FE	Italia	nicoletta.carlin@studio-duo.it		01356120384	N/A	\N	t	2025-11-28 08:43:02.011491	2026-01-13 14:50:10.554
139	EL CALIGO SOCIETA' COOPERATIVA		ROSOLINA	45010	RO	Italia			01104660293	01104660293	105531723	t	2026-01-13 15:09:05.032983	2026-05-12 12:53:52.788
128	Soc cooperativa Rosa dei Venti		Goro	44020	FE	Italia	rosadeiventi3@gmail.com		01257010387	01257010387	65131265	t	2025-12-10 14:25:42.004003	2026-05-12 12:54:06.531
32	Cooperativa LA ROMANINA Soc. Coop. arl		Mesola	44026	FE	Italia	cooplaromanina@gmail.com		01427580384	N/A	\N	t	2025-11-28 08:43:00.213321	2026-01-13 14:50:04.408
39	Cooperativa Sole Soc. Coop. agricola		GORO	44020	FE	Italia	deltadec@deltaced.it,paganinipaolo@gmail.com		02153890385	N/A	\N	t	2025-11-28 08:43:02.667945	2026-01-13 14:50:14.2
85	soc. coop. Marinetta		Taglio di Po RO, Italia	45019	RO	Italia			01284160296	01284160296	65131269	t	2025-11-28 08:43:28.93053	2026-05-12 12:54:07.215
96	Tagliati Simone		Gorino	44020	FE	Italia	coopadriatica@libero.it		01277000384	TGLSMN75T15C912W	100482617	t	2025-11-28 08:43:37.422629	2026-05-12 12:54:13.146
79	Spinadin Pesca					Italia			00000000000	00000000000	65131278	t	2025-11-28 08:43:22.67289	2026-05-12 12:54:12.555
92	SOCIETA' COOPERATIVA ACQUAVIVA		Comacchio	44022	FE	Italia	massimoballarinidec@libero.it		01841330382	N/A	\N	t	2025-11-28 08:43:34.08353	2026-01-13 14:51:30.201
99	Trombini Graziano		Bosco Mesola	44026	FE	Italia			00995820388	prmgzn55l18e107y	65131281	t	2025-11-28 08:43:38.554255	2026-05-12 12:54:14.676
87	società agricola Kappa s.s. di Varagnolo Maurizio e C.		Padova	35121	PD	Italia			05020560289	TRRGPP50E25G224S	65131274	t	2025-11-28 08:43:31.99754	2026-05-12 12:54:08.492
86	SOC.COOPERATIVA GORINO		GORO	44020	FE	Italia			01218150389	01218150389	65131272	t	2025-11-28 08:43:30.084019	2026-05-12 12:54:07.898
15	CAM Conservificio Allevatori Molluschi srl		Chioggia	30015	VE	Italia	molluschi@camittico.it		00182700278	00182700278	65131208	t	2025-11-28 08:42:54.297618	2026-05-12 12:53:44.553
129	LA FENICE SOC COOP ARL		Bosco Mesola FE, Italia	44026	Ferrara	Italia	cooplafenice11@legalmail.it		01885870384	01885870384	65131243	t	2026-01-12 17:31:10.857941	2026-05-12 12:53:56.702
130	Soc.Agr.Alma pesca ss		Rosolina	45010	RO	Italia	coop.rosolina@gmail.com		00750250292	00750250292	65131270	t	2026-01-12 17:31:19.701609	2026-05-12 12:54:07.607
88	Società agricola Moceniga Pesca s.s		Chioggia	30015	VE	Italia	robertopenzo832@yahoo.it		04443240272	pnzrrt63a06c638a	65131275	t	2025-11-28 08:43:32.481593	2026-05-12 12:54:09.153
80	Soc.Agr.Alma pesca ss		Rosolina	45010	RO	Italia	coop.rosolina@gmail.com		00750250292	N/A	\N	t	2025-11-28 08:43:23.816322	2026-01-13 14:51:18.565
81	Soc Coop Poseidone		Rosolina	45010	RO	Italia			01251320295	N/A	\N	t	2025-11-28 08:43:25.221612	2026-01-13 14:51:13
97	Tiozzo Pagio Michael		CHIOGGIA	30015	VE	Italia			04618970273	TZZMHL86M22C638J	65131279	t	2025-11-28 08:43:37.77523	2026-05-12 12:54:14.093
95	Stichting zeeschelp		KAMPERLAND	04493	EE	Paesi Bassi			NL813730089B	NL813730089B	86988184	t	2025-11-28 08:43:36.835358	2026-05-12 12:54:12.857
84	Soc. Agricola Scanno di Tironi Giuseppe		Limena	35010	PD	Italia			03407720287	03407720287	65131268	t	2025-11-28 08:43:28.866987	2026-05-12 12:54:07.17
93	SOCIETA' COOPERATIVA PESCATORI S.GIULIA		PORTO TOLLE	45018	RO	Italia			01158780294	N/A	\N	t	2025-11-28 08:43:35.06872	2026-01-13 14:51:31.446
94	SOL LEVANTE - SOCIETA' COOPERATIVA		Goro	44020	FE	Italia	coopsollevante@gmail.com		01924210386	N/A	\N	t	2025-11-28 08:43:35.842697	2026-01-13 14:51:32.742
133	SOCIETA' AGRICOLA RI.OS. S.S. DI MANCIN GIAN PIETRO E C.		PORTO VIRO	45014	RO	Italia			01253210296	01253210296	105499768	t	2026-01-13 14:28:22.659761	2026-05-12 12:54:10.475
83	Societa agr. Alissa s.s.		Porto Viro	45014	RO	Italia	agricolafratellicavallari@gmail.com		01571890290	01571890290	65131273	t	2025-11-28 08:43:27.795004	2026-05-12 12:54:08.204
71	Poseidonia s.s. soc.agr. di Meloni Fulvio e Zennaro Manuel		Porto Tolle	45018	RO	Italia	criscele@icloud.com		01490310297	01490310297	65131255	t	2025-11-28 08:43:18.421599	2026-05-12 12:54:03.264
89	Società Cooperativa ALBATROS		Goro	44020	FE	Italia	beppemicali73@gmail.com		01706620380	01706620380	97247090	t	2025-11-28 08:43:33.14985	2026-05-12 12:54:09.425
72	Poseidonia soc. agricola		CHIOGGIA	30015	VE	Italia			05081120288	05081120288	65131256	t	2025-11-28 08:43:18.77124	2026-05-12 12:54:03.55
103	VENUS - SOC. COOP.		GORO	44020	FE	Italia	coopvenusgoro@gmail.com		01252330384	N/A	\N	t	2025-11-28 08:43:40.41929	2026-01-13 14:38:33.251
100	Trombini Silvana		Goro	44020	FE	Italia	morgan.turri@alice.it		01881110389	01881110389	65131282	t	2025-11-28 08:43:39.397174	2026-05-12 12:54:14.951
73	REAMAR soc. coop.arl		Comacchio	44022	FE	Italia			01996720387	01996720387	65131258	t	2025-11-28 08:43:19.129485	2026-05-12 12:54:03.834
101	TURGIAMAR SOC. COOP.		Goro	44020	FE	Italia	studiofabianicinti@virgilio.it		01627470386	N/A	\N	t	2025-11-28 08:43:39.696061	2026-01-13 14:38:30.387
134	RO.MA.MAR Società Cooperativa a.r.l		Goro	44020	FE	Italia	ro.ma.mar.goro@gmail.com		01575130388	01575130388	100062527	t	2026-01-13 14:28:56.858309	2026-05-12 12:54:04.406
76	San Marco società cooperativa		Pomezia	71	RM	Italia	dantoni_sandro@hotmail.it		14512451007	14512451007	65131260	t	2025-11-28 08:43:20.698879	2026-05-12 12:54:04.702
98	Tosatti Andrea		Goro	44020	FE	Italia	andreatosatti@gmail.com		01626450389	TSTNDR82T02D548G	65131280	t	2025-11-28 08:43:38.203031	2026-05-12 12:54:14.392
102	V.F.D. GROUP S.R.L.S.		MESOLA	44026	FE	Italia	vfdgroupfe@gmail.com		02160410383	02160410383	103139823	t	2025-11-28 08:43:40.074908	2026-05-12 12:54:15.563
104	Vi.Effe ssa		Chioggia	30015	VE	Italia	alissasocagricola@libero.it		04125900276	04125900276	65131284	t	2025-11-28 08:43:41.699109	2026-05-12 12:54:16.292
18	Ceppa Società Semplice Agricola di Oselladore R.E. Bollini J.		Rosolina	45010	RO	Italia	ruggero977@gmail.com		01522020294	N/A	\N	t	2025-11-28 08:42:54.996443	2026-01-13 14:49:48.06
19	CLAMS SOCIETA' COOPERATIVA		GORO	44020	FE	Italia			01592850380	N/A	\N	t	2025-11-28 08:42:55.394938	2026-01-13 14:49:49.239
105	Vongola viva Soc. Agricola - Stocco Daniele		Rosolina	45010	RO	Italia	segreteria@polesineconsulting.it		01470220292	01470220292	65131285	t	2025-11-28 08:43:43.203578	2026-05-12 12:54:16.581
90	SOCIETA' AGRICOLA ECOTAPES SRL		Chioggia	30015	VE	Italia	ecotapes.2020@gmail.com		04621060278	04621060278	96373675	t	2025-11-28 08:43:33.458352	2026-05-12 12:54:10.2
135	ACUINUGA Aquacoltura Nutricion de Galizia		Bertamiráns, A Coruña, Spagna	15220	A Coruna	Spagna	tecnico@acuinuga.com		B70089750	B70089750	65131198	t	2026-01-13 14:36:04.338506	2026-05-12 12:53:40.402
75	RO.MA.MAR Società Cooperativa a.r.l		Goro	44020	FE	Italia	ro.ma.mar.goro@gmail.com		01575130388	N/A	\N	t	2025-11-28 08:43:20.337829	2026-01-13 14:51:05.9
132	COOPERATIVA PESCATORI DEL DELTA - SOCIETA' COOPERATIVA		GORO	44020	FE	Italia	cooppescatorideldelta@virgilio.it		01123310383	01123310383	95752509	t	2026-01-12 17:31:33.120082	2026-05-12 12:53:49.568
74	REGINA SOC. AGRICOLA S.S.		Ariano nel Polesine	45012	RO	Italia	modena.riccardo@gmail.com		01569590290	mdnrcr78d14c967m	65131259	t	2025-11-28 08:43:19.430543	2026-05-12 12:54:04.112
77	San Pietro S.C.A.R.L.		Comacchio	44022	FE	Italia	sanpietro.pozzati@gmail.com		IT01513320380	IT01513320380	99967982	t	2025-11-28 08:43:21.620774	2026-05-12 12:54:05.062
91	SOCIETA' AGRICOLA TIRRENA		PORTO VIRO	45014	ROVIGO	Italia	società.agricola@legalmail.it		00305250292	N/A	\N	t	2025-11-28 08:43:33.762098	2026-01-13 14:51:28.963
82	Soc cooperativa Rosa dei Venti		Goro	44020	FE	Italia	rosadeiventi3@gmail.com		01257010387	N/A	\N	t	2025-11-28 08:43:26.432776	2026-01-13 14:51:14.282
78	SERENISSIMA PESCA SOC COOP		ROSOLINA	45010	ROVIGO	Italia			02925260271	02925260271	65131261	t	2025-11-28 08:43:21.974532	2026-05-12 12:54:05.348
23	Consorzio Pescatori di Goro Soc. Coop. OP		Goro	44020	FE	Italia	paola.gianella@copego.it,massimo.genari@copego.it		00040400384	N/A	\N	t	2025-11-28 08:42:56.8242	2026-01-13 14:49:53.302
26	Coop. Adriatica Gorino		Gorino FE, Italia	44020	FE	Italia	coopadriatica@libero.it		00423670389	N/A	\N	t	2025-11-28 08:42:57.559344	2026-01-13 14:49:56.29
27	Coop. La Vela		Goro	44020	FE	Italia	cooplavela@autlook.com		01227850383	N/A	\N	t	2025-11-28 08:42:57.956341	2026-01-13 14:49:57.524
52	LA BUSSOLA - SOCIETA' COOPERATIVA		GORO	44020	FE	Italia	labussolagoro@tiscali.it		01654200383	N/A	\N	t	2025-11-28 08:43:07.796142	2026-01-13 14:50:35.422
53	LA FENICE SOC COOP ARL		Bosco Mesola FE, Italia	44026	Ferrara	Italia	cooplafenice11@legalmail.it		01885870384	N/A	\N	t	2025-11-28 08:43:07.860048	2026-01-13 14:50:35.886
56	LA SACCA SOC. COOPERATIVA		Goro	44020	FE	Italia	cooplasacca@libero.it		01427440381	N/A	\N	t	2025-11-28 08:43:10.621072	2026-01-13 14:50:39.752
58	LA VERACE Società Cooperativa		Goro	44020	Ferrara	Italia	coop.laverace@virgilio.it		01877390383	N/A	\N	t	2025-11-28 08:43:13.282226	2026-01-13 14:50:42.881
46	Filippo Conventi		Goro	44020	FE	Italia	filippoconventi19@g.mail.com		01368760383	CNVFPP78R19H620B	100386131	t	2025-11-28 08:43:05.822799	2026-05-12 12:53:54.512
47	Gatti Michele		Chioggia	30015	VE	Italia	bischeroa@yahoo.it		03455450274	fbbngl70s03c638y	65131239	t	2025-11-28 08:43:06.199112	2026-05-12 12:53:54.805
48	Gelli Maria Elena		Comacchio	44022	FE	Italia	felletti83@gmail.com		02013320383	FLLNDR83B22c912T	65131240	t	2025-11-28 08:43:06.494547	2026-05-12 12:53:55.083
49	Gloria Pesca S.S.A.		Porto Viro	45014	RO	Italia	martin85@libero.it		01481390290	01481390290	102488681	t	2025-11-28 08:43:06.860948	2026-05-12 12:53:55.384
50	GROBOS SOCIETA' COOPERATIVA		ROSOLINA	45010	RO	Italia			01194430292	01194430292	102900137	t	2025-11-28 08:43:07.162905	2026-05-12 12:53:55.728
16	Cazzola Alessandro		Gorino	44020	FE	Italia	coopadriatica@libero.it		01623590385	CZZLSN84T09C814W	100482827	t	2025-11-28 08:42:54.632385	2026-05-12 12:53:44.885
17	Cazzola Paolo soc. Adriatica		Gorino FE, Italia	44020	FE	Italia			00971080387	CZZPLA61T01E107T	65131209	t	2025-11-28 08:42:54.697386	2026-05-12 12:53:44.93
20	Consorzio Coop. Pescatori del Polesine OP soc coop		Porto Tolle	45018	RO	Italia	avanzoveronica@consorzioscardovari.it		00224140293	00224140293	65131212	t	2025-11-28 08:42:55.78303	2026-05-12 12:53:45.955
21	Consorzio Delta Nord		Rosolina	45010	RO	Italia			01074500297	01074500297	65131214	t	2025-11-28 08:42:56.074918	2026-05-12 12:53:46.245
51	I Simpson Soc. Cooperativa		Corbola	45015	RO	Italia	fratelliecognati@gmail.com		01548860293	01548860293	65131242	t	2025-11-28 08:43:07.510709	2026-05-12 12:53:56.015
22	CONSORZIO MOLLUSCHICOLTORI VENETI		Rosolina RO, Italia	45010	ROVIGO	Italia			01477820292	01477820292	65131215	t	2025-11-28 08:42:56.14054	2026-05-12 12:53:46.288
24	Coop San Marco		Gorino	44020	FE	Italia	CoopSanMarco.b@gmail.com		01477960387	01477960387	65131216	t	2025-11-28 08:42:57.172571	2026-05-12 12:53:46.872
25	Coop Venere		Goro	44020	FE	Italia	g.trombini@libero.it		01738060381	01738060381	65131217	t	2025-11-28 08:42:57.49393	2026-05-12 12:53:47.158
28	Coop.Pescatori Volano scarl		Marano Lagunare	33050	UD	Italia	direzione@coopescasanvito.it		00386860308	00386860308	65131222	t	2025-11-28 08:42:58.294472	2026-05-12 12:53:47.788
29	Cooperativa Clodiense Bullo Stefano		Chioggia	30015	VE	Italia	pescatoriclodiense@libero.it		03271790275	03271790275	65131225	t	2025-11-28 08:42:58.713173	2026-05-12 12:53:48.071
43	Ephelia soc. semplice		Gorino	44020	FE	Italia	tagliaticelestino@gmail.com		01746090388	01746090388	65131234	t	2025-11-28 08:43:04.337116	2026-05-12 12:53:53.222
44	Felletti Andrea		Mesola	44026	FE	Italia	carlo.trombini1986@libero.it		01990650382	01990650382	65131236	t	2025-11-28 08:43:04.717975	2026-05-12 12:53:53.552
136	L'ACQUAVIVA S.R.L.		PORTO VIRO	45014	RO	Italia	lacquaviva@pec.it,info@l-acquaviva.it		01277230296	01277230296	104674086	t	2026-01-13 14:37:14.213742	2026-05-12 12:53:56.359
45	Felletti Michela		Comacchio	44022	FE	Italia	felletti83@gmail.com		02027370382	fllmhl87a64c814l	65131241	t	2025-11-28 08:43:05.018046	2026-05-12 12:53:54.222
54	La Laguna SOCIETà COOPERATIVA		Goro	44020	FE	Italia			01816190381	01816190381	65131244	t	2025-11-28 08:43:08.149662	2026-05-12 12:53:57.009
55	La Perla Nera Società Semplice Agricola		Chioggia	30015	VE	Italia			04262250279	04262250279	65131245	t	2025-11-28 08:43:08.468384	2026-05-12 12:53:57.28
57	La Valle società Coopertiva		Comacchio (FE)	44022	FE	Italia	irene.rizzardi@gmail.com		14355303389	01435530389	65131246	t	2025-11-28 08:43:11.83388	2026-05-12 12:53:57.862
59	LE NOSTRANE ss		Chioggia	30015	VE	Italia			04581990274	04581990274	96814952	t	2025-11-28 08:43:13.668282	2026-05-12 12:53:58.78
60	MAGI soc coop semplice		Bosco Mesola	44046	RO	Italia	mgib@mgib.it		02081590388	02081590388	65131248	t	2025-11-28 08:43:13.981959	2026-05-12 12:53:59.07
61	MAGICA SOCIETA' COOPERATIVA		COMACCHIO	44029	FE	Italia			01911510384	01911510384	103139999	t	2025-11-28 08:43:14.280465	2026-05-12 12:53:59.354
\.


--
-- TOC entry 4258 (class 0 OID 16542)
-- Dependencies: 226
-- Data for Name: configurazione; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.configurazione (id, chiave, valore, descrizione, created_at, updated_at) FROM stdin;
1	fatture_in_cloud_client_id	w2VtlcTHpHfmqQMZz8Bs4Buqk5Uuwi1I	Client ID OAuth2 Fatture in Cloud	2025-10-07 13:58:50.992733	2025-10-07 14:29:50.784
2	fatture_in_cloud_client_secret	L0YCH9FYQwYvKKYGg9O2rbwkA15Bs29X8i5wHmF70aWQGdveMzpHiMYn5UtutGtL	Client Secret OAuth2 Fatture in Cloud	2025-10-07 13:58:51.732747	2025-10-07 14:29:51.242
25	fatture_in_cloud_access_token	a/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyZWYiOiJHckNVZVBoWlA5RzhNYndkWjNkbVQycW1JT2tTdEFFYSJ9.cDCEgIXSz9gid0FV5EY1J4hEvtkJqsvQRiylOf2UzaA	Token API diretto per Fatture in Cloud	2025-10-07 14:40:20.918015	2025-10-07 14:40:20.918015
27	fatture_in_cloud_auth_mode	token	Modalità di autenticazione (token/oauth)	2025-10-07 14:40:22.59019	2025-10-07 14:40:22.59019
9	fatture_in_cloud_company_id	1052922	ID Azienda da segreti Replit	2025-10-07 14:08:48.242759	2026-01-13 18:42:36.259
\.


--
-- TOC entry 4260 (class 0 OID 16555)
-- Dependencies: 228
-- Data for Name: cycles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cycles (id, basket_id, lot_id, start_date, end_date, state, sieve_up, sieve_down, parent_cycle_id, lineage_group_id, quality_class, screening_label) FROM stdin;
237	157	34	2026-03-06	2026-03-13	closed	\N	\N	228	157	premium	\N
700	14	31	2026-05-18	2026-05-19	closed	\N	\N	676	154	normal	08/05 +1000 (1)
437	95	5	2026-04-10	2026-04-14	closed	\N	\N	435	50	normal	31/03 [-]
251	16	24	2026-03-11	2026-03-16	closed	\N	\N	133	133	\N	\N
390	141	69	2026-03-31	2026-04-27	closed	\N	\N	\N	\N	\N	\N
294	24	5	2026-03-16	2026-04-08	closed	\N	\N	262	72	sub	16/03 [-]
348	98	5	2026-03-23	2026-04-20	closed	\N	\N	336	72	\N	\N
245	12	25	2026-03-11	2026-03-17	closed	\N	\N	178	65	\N	\N
238	3	5	2026-03-09	2026-03-17	closed	\N	\N	221	72	\N	\N
248	5	5	2026-03-11	2026-03-17	closed	\N	\N	204	50	\N	\N
239	22	5	2026-03-11	2026-03-18	closed	\N	\N	209	50	\N	\N
266	30	5	2026-03-11	2026-03-18	closed	\N	\N	165	72	\N	\N
366	9	5	2026-03-27	2026-04-21	closed	\N	\N	353	72	\N	\N
358	103	11	2026-03-24	2026-04-08	closed	\N	\N	302	97	\N	\N
385	105	34	2026-04-01	2026-04-08	closed	\N	\N	288	157	\N	\N
257	33	5	2026-03-11	2026-03-18	closed	\N	\N	231	54	\N	\N
242	32	5	2026-03-11	2026-03-18	closed	\N	\N	198	50	\N	\N
263	23	5	2026-03-11	2026-03-18	closed	\N	\N	232	54	\N	\N
260	31	11	2026-03-11	2026-03-19	closed	\N	\N	159	97	\N	\N
254	34	5	2026-03-11	2026-03-19	closed	\N	\N	233	51	\N	\N
456	138	74	2026-04-14	2026-05-07	closed	\N	\N	\N	\N	\N	\N
384	101	34	2026-04-01	2026-04-08	closed	\N	\N	288	157	\N	\N
289	102	34	2026-03-13	2026-04-08	closed	\N	\N	237	157	normal	13/03 [-]
293	162	60	2026-03-12	2026-04-21	closed	\N	\N	\N	\N	\N	\N
315	27	5	2026-03-18	2026-03-20	closed	\N	\N	256	72	sub	\N
316	30	5	2026-03-18	2026-03-20	closed	\N	\N	256	72	sub	\N
323	31	5	2026-03-19	2026-03-20	closed	\N	\N	261	72	sub	\N
317	38	5	2026-03-18	2026-03-20	closed	\N	\N	256	72	sub	\N
80	100	5	2025-12-03	2026-02-25	closed	\N	\N	73	73	premium	\N
193	132	27	2026-02-24	2026-02-26	closed	\N	\N	145	145	premium	\N
371	40	5	2026-03-27	2026-04-08	closed	\N	\N	314	72	normal	27/03 [-]
269	158	52	2026-03-11	2026-04-21	closed	\N	\N	\N	\N	\N	\N
519	103	70	2026-04-27	2026-04-27	closed	\N	\N	391	391	sub	27/04 -500 (1)
407	126	34	2026-04-08	2026-04-23	closed	\N	\N	385	157	\N	\N
363	144	66	2026-03-26	2026-04-13	closed	\N	\N	\N	\N	\N	\N
411	128	31	2026-04-08	2026-04-29	closed	\N	\N	386	154	normal	31/03 +790
405	152	73	2026-04-02	2026-05-04	closed	\N	\N	\N	\N	\N	\N
518	101	70	2026-04-27	2026-05-01	closed	\N	\N	391	391	premium	27/04 +790
520	131	70	2026-04-27	2026-05-12	closed	\N	\N	391	391	sub	27/04 -500 (2)
325	35	5	2026-03-19	2026-03-20	closed	\N	\N	261	72	sub	\N
326	36	5	2026-03-19	2026-03-20	closed	\N	\N	261	72	sub	\N
324	34	5	2026-03-19	2026-03-20	closed	\N	\N	261	72	sub	\N
336	31	5	2026-03-20	2026-03-23	closed	\N	\N	316	72	sub	\N
13	25	3	2025-11-26	2025-12-10	closed	\N	\N	\N	13	\N	\N
17	29	3	2025-11-26	2025-12-10	closed	\N	\N	\N	17	\N	\N
18	30	3	2025-11-26	2025-12-10	closed	\N	\N	\N	18	\N	\N
19	31	3	2025-11-26	2025-12-10	closed	\N	\N	\N	19	\N	\N
22	34	3	2025-11-26	2025-12-10	closed	\N	\N	\N	22	\N	\N
23	35	3	2025-11-26	2025-12-10	closed	\N	\N	\N	23	\N	\N
24	36	3	2025-11-26	2025-12-10	closed	\N	\N	\N	24	\N	\N
25	37	3	2025-11-26	2025-12-10	closed	\N	\N	\N	25	\N	\N
29	7	4	2025-11-27	2025-12-18	closed	\N	\N	\N	29	\N	\N
31	9	4	2025-11-27	2025-12-19	closed	\N	\N	\N	31	\N	\N
35	82	5	2025-11-28	2026-02-25	closed	\N	\N	\N	35	\N	\N
38	85	5	2025-11-28	2026-02-25	closed	\N	\N	\N	38	\N	\N
41	89	5	2025-11-28	2025-12-11	closed	\N	\N	\N	41	\N	\N
42	88	5	2025-11-28	2025-12-01	closed	\N	\N	\N	42	\N	\N
43	91	5	2025-11-28	2025-12-11	closed	\N	\N	\N	43	\N	\N
44	90	5	2025-11-28	2025-12-11	closed	\N	\N	\N	44	\N	\N
45	92	5	2025-11-28	2025-12-01	closed	\N	\N	\N	45	\N	\N
46	93	5	2025-11-28	2025-12-11	closed	\N	\N	\N	46	\N	\N
48	95	5	2025-11-28	2025-12-11	closed	\N	\N	\N	48	\N	\N
51	111	5	2025-11-28	2026-02-27	closed	\N	\N	\N	51	\N	\N
53	113	5	2025-11-28	2025-12-11	closed	\N	\N	\N	53	\N	\N
54	114	5	2025-11-28	2026-02-27	closed	\N	\N	\N	54	\N	\N
60	120	5	2025-11-28	2025-12-01	closed	\N	\N	\N	60	\N	\N
65	125	5	2025-11-28	2026-02-16	closed	\N	\N	\N	65	\N	\N
71	105	5	2025-11-28	2025-12-03	closed	\N	\N	\N	71	\N	\N
73	107	5	2025-11-28	2025-12-03	closed	\N	\N	\N	73	\N	\N
137	84	25	2026-01-09	2026-02-16	closed	\N	\N	\N	137	\N	\N
142	112	26	2026-01-12	2026-02-25	closed	\N	\N	\N	142	\N	\N
344	136	61	2026-03-23	2026-04-24	closed	\N	\N	\N	\N	\N	\N
362	133	65	2026-03-26	2026-04-24	closed	\N	\N	\N	\N	\N	\N
145	131	27	2026-01-13	2026-02-24	closed	\N	\N	\N	145	\N	\N
146	132	28	2026-01-14	2026-02-24	closed	\N	\N	\N	146	\N	\N
153	139	30	2026-01-22	2026-02-25	closed	\N	\N	\N	153	\N	\N
154	140	31	2026-01-29	2026-03-02	closed	\N	\N	\N	154	\N	\N
155	141	32	2026-01-29	2026-03-02	closed	\N	\N	\N	155	\N	\N
156	142	33	2026-01-29	2026-03-02	closed	\N	\N	\N	156	\N	\N
157	138	34	2026-01-22	2026-02-25	closed	\N	\N	\N	157	\N	\N
365	150	68	2026-03-26	2026-04-24	closed	\N	\N	\N	\N	\N	\N
364	145	67	2026-03-26	2026-04-24	closed	\N	\N	\N	\N	\N	\N
441	132	47	2026-04-13	2026-04-21	closed	\N	\N	214	214	sub	13/04 -500 (1)
442	137	47	2026-04-13	2026-04-24	closed	\N	\N	214	214	sub	13/04 -500 (2)
432	111	5	2026-04-10	2026-04-16	closed	\N	\N	313	72	sub	17/03 [-]
425	87	5	2026-04-08	2026-04-20	closed	\N	\N	343	72	sub	20/03 [-]
421	92	5	2026-04-08	2026-04-20	closed	\N	\N	296	72	sub	16/03 [-]
353	31	5	2026-03-23	2026-03-27	closed	\N	\N	329	72	normal	\N
314	22	5	2026-03-18	2026-03-27	closed	\N	\N	256	72	premium	\N
322	29	5	2026-03-19	2026-03-27	closed	\N	\N	261	72	premium	\N
327	37	5	2026-03-19	2026-03-27	closed	\N	\N	261	72	premium	\N
295	21	5	2026-03-16	2026-03-31	closed	\N	\N	262	72	premium	\N
301	7	5	2026-03-16	2026-03-31	closed	\N	\N	262	72	premium	\N
374	14	5	2026-03-31	2026-03-31	closed	\N	\N	308	50	premium	\N
375	17	5	2026-03-31	2026-03-31	closed	\N	\N	308	50	premium	\N
300	16	5	2026-03-16	2026-03-31	closed	\N	\N	262	72	premium	\N
288	101	34	2026-03-13	2026-04-01	closed	\N	\N	237	157	premium	\N
347	165	64	2026-03-19	2026-03-31	closed	\N	\N	\N	\N	\N	\N
391	142	70	2026-03-31	2026-04-27	closed	\N	\N	\N	\N	\N	\N
255	26	5	2026-03-11	2026-03-16	closed	\N	\N	208	50	\N	\N
252	1	5	2026-03-11	2026-03-17	closed	\N	\N	207	50	\N	\N
243	13	25	2026-03-11	2026-03-17	closed	\N	\N	177	65	\N	\N
249	15	5	2026-03-11	2026-03-17	closed	\N	\N	203	50	\N	\N
436	114	5	2026-04-10	2026-04-16	closed	\N	\N	372	50	normal	31/03 [-]
258	29	5	2026-03-11	2026-03-19	closed	\N	\N	224	72	\N	\N
261	37	5	2026-03-11	2026-03-19	closed	\N	\N	235	72	\N	\N
240	2	5	2026-03-11	2026-03-19	closed	\N	\N	197	50	\N	\N
264	6	5	2026-03-11	2026-03-19	closed	\N	\N	236	72	\N	\N
267	10	5	2026-03-11	2026-03-19	closed	\N	\N	167	72	\N	\N
523	114	5	2026-04-28	2026-04-30	closed	\N	\N	462	72	premium	28/04 +3000 (2)
521	132	70	2026-04-27	2026-04-30	closed	\N	\N	519	391	sub	27/04 -500 (1)
457	140	75	2026-04-14	2026-05-04	closed	\N	\N	\N	\N	\N	\N
360	135	37	2026-03-24	2026-04-20	closed	\N	\N	163	163	sub	24/03 +500 -790
356	6	5	2026-03-23	2026-04-21	closed	\N	\N	329	72	sub	23/03 [-]
349	84	5	2026-03-23	2026-04-21	closed	\N	\N	339	72	\N	\N
319	32	5	2026-03-18	2026-03-20	closed	\N	\N	263	54	sub	\N
361	143	37	2026-03-24	2026-04-21	closed	\N	\N	163	163	sub	24/03 -500
270	159	53	2026-03-11	2026-04-21	closed	\N	\N	\N	\N	\N	\N
379	29	5	2026-03-31	2026-04-11	closed	\N	\N	367	72	normal	31/03 T3
357	8	5	2026-03-23	2026-04-10	closed	\N	\N	329	72	sub	23/03 [-]
372	1	5	2026-03-31	2026-04-10	closed	\N	\N	308	50	normal	31/03 [-]
191	151	27	2026-02-24	2026-04-25	closed	\N	\N	145	145	sub	24/02
195	153	45	2026-02-24	2026-04-25	closed	\N	\N	\N	195	\N	\N
212	155	34	2026-02-25	2026-04-25	closed	\N	\N	157	157	sub	25/02
434	115	5	2026-04-10	2026-04-16	closed	\N	\N	355	72	sub	23/03 [-]
320	33	5	2026-03-18	2026-03-20	closed	\N	\N	263	54	sub	\N
321	39	5	2026-03-18	2026-03-20	closed	\N	\N	263	54	sub	\N
339	36	5	2026-03-20	2026-03-23	closed	\N	\N	326	72	sub	\N
328	2	5	2026-03-19	2026-03-23	closed	\N	\N	264	72	sub	\N
177	86	25	2026-02-16	2026-03-11	closed	\N	\N	65	65	sub	\N
231	114	5	2026-02-27	2026-03-11	closed	\N	\N	54	54	sub	\N
114	34	3	2025-12-10	2025-12-31	closed	\N	\N	23	23	sub	\N
115	35	3	2025-12-10	2025-12-31	closed	\N	\N	23	23	sub	\N
116	36	3	2025-12-10	2025-12-23	closed	\N	\N	23	23	sub	\N
117	37	3	2025-12-10	2025-12-23	closed	\N	\N	23	23	sub	\N
118	21	3	2025-12-10	2025-12-31	closed	\N	\N	23	23	sub	\N
119	22	3	2025-12-10	2025-12-31	closed	\N	\N	23	23	sub	\N
86	10	4	2025-12-03	2025-12-03	closed	\N	\N	28	28	sub	\N
107	88	5	2025-12-09	2025-12-10	closed	\N	\N	37	37	sub	\N
108	92	5	2025-12-09	2025-12-19	closed	\N	\N	37	37	sub	\N
180	90	25	2026-02-16	2026-03-11	closed	\N	\N	65	65	sub	\N
124	93	5	2025-12-11	2026-02-16	closed	\N	\N	53	53	sub	\N
234	125	5	2026-02-27	2026-03-11	closed	\N	\N	51	51	sub	\N
164	81	5	2026-02-11	2026-03-02	closed	\N	\N	72	72	sub	\N
169	87	5	2026-02-11	2026-02-27	closed	\N	\N	72	72	sub	\N
147	133	11	2026-01-22	2026-02-13	closed	\N	\N	97	97	sub	\N
148	135	11	2026-01-22	2026-02-13	closed	\N	\N	97	97	sub	\N
149	134	11	2026-01-22	2026-02-13	closed	\N	\N	97	97	sub	\N
150	136	11	2026-01-22	2026-02-13	closed	\N	\N	97	97	sub	\N
59	119	5	2025-11-28	2026-02-25	closed	\N	\N	\N	59	\N	\N
61	121	5	2025-11-28	2026-02-25	closed	\N	\N	\N	61	\N	\N
62	122	5	2025-11-28	2026-02-25	closed	\N	\N	\N	62	\N	\N
63	123	5	2025-11-28	2026-02-25	closed	\N	\N	\N	63	\N	\N
64	124	5	2025-11-28	2026-02-25	closed	\N	\N	\N	64	\N	\N
66	126	5	2025-11-28	2026-02-25	closed	\N	\N	\N	66	\N	\N
134	86	24	2026-01-09	2026-02-16	closed	\N	\N	\N	134	\N	\N
135	88	24	2026-01-09	2026-02-16	closed	\N	\N	\N	135	\N	\N
136	91	24	2026-01-09	2026-02-16	closed	\N	\N	\N	136	\N	\N
138	92	25	2026-01-09	2026-02-16	closed	\N	\N	\N	138	\N	\N
139	96	25	2026-01-09	2026-02-16	closed	\N	\N	\N	139	\N	\N
141	90	25	2026-01-09	2026-02-16	closed	\N	\N	\N	141	\N	\N
376	21	5	2026-03-31	2026-04-07	closed	\N	\N	367	72	normal	31/03 T3
216	21	49	2026-02-28	2026-02-28	closed	\N	\N	\N	216	\N	\N
329	6	5	2026-03-19	2026-03-23	closed	\N	\N	264	72	sub	\N
330	8	5	2026-03-19	2026-03-23	closed	\N	\N	264	72	sub	\N
332	17	5	2026-03-19	2026-03-23	closed	\N	\N	264	72	sub	\N
302	133	11	2026-03-16	2026-03-24	closed	\N	\N	171	97	normal	\N
194	152	44	2026-02-24	2026-03-24	closed	\N	\N	\N	194	\N	\N
303	135	11	2026-03-16	2026-03-24	closed	\N	\N	171	97	normal	\N
190	150	43	2026-02-17	2026-03-24	closed	\N	\N	\N	190	\N	\N
383	14	5	2026-03-31	2026-04-07	closed	\N	\N	367	72	premium	31/03 T4
318	23	5	2026-03-18	2026-03-27	closed	\N	\N	263	54	premium	\N
333	40	5	2026-03-19	2026-03-27	closed	\N	\N	264	72	premium	\N
387	17	31	2026-03-31	2026-04-08	closed	\N	\N	226	154	normal	31/03 +790
297	26	5	2026-03-16	2026-04-08	closed	\N	\N	262	72	sub	16/03 [-]
378	23	5	2026-03-31	2026-04-09	closed	\N	\N	367	72	normal	31/03 T3
246	20	5	2026-03-11	2026-03-28	closed	\N	\N	121	53	\N	\N
367	22	5	2026-03-27	2026-03-31	closed	\N	\N	314	72	premium	\N
368	23	5	2026-03-27	2026-03-31	closed	\N	\N	314	72	premium	\N
369	29	5	2026-03-27	2026-03-31	closed	\N	\N	314	72	premium	\N
226	141	31	2026-03-02	2026-03-31	closed	\N	\N	154	154	sub	\N
192	131	27	2026-02-24	2026-03-31	closed	\N	\N	145	145	sub	\N
211	139	34	2026-02-25	2026-03-31	closed	\N	\N	157	157	sub	\N
189	149	42	2026-02-17	2026-03-31	closed	\N	\N	\N	189	\N	\N
188	148	41	2026-02-23	2026-03-31	closed	\N	\N	\N	188	\N	\N
196	154	46	2026-02-24	2026-03-31	closed	\N	\N	\N	196	\N	\N
377	22	5	2026-03-31	2026-04-09	closed	\N	\N	367	72	normal	31/03 T3
380	31	5	2026-03-31	2026-04-09	closed	\N	\N	367	72	normal	31/03 T3
381	36	5	2026-03-31	2026-04-10	closed	\N	\N	367	72	normal	31/03 T3
373	3	5	2026-03-31	2026-04-10	closed	\N	\N	308	50	normal	31/03 [-]
382	7	5	2026-03-31	2026-04-11	closed	\N	\N	367	72	premium	31/03 T4
214	132	47	2026-02-26	2026-04-13	closed	\N	\N	\N	214	\N	\N
215	138	48	2026-02-26	2026-04-13	closed	\N	\N	\N	215	\N	\N
185	137	38	2026-02-17	2026-04-13	closed	\N	\N	\N	185	\N	\N
186	146	39	2026-02-17	2026-04-13	closed	\N	\N	\N	186	\N	\N
229	140	50	2026-03-03	2026-04-13	closed	\N	\N	\N	229	\N	\N
187	147	40	2026-02-17	2026-04-13	closed	\N	\N	\N	187	\N	\N
509	101	62	2026-04-24	2026-04-27	closed	\N	\N	345	345	premium	24/04 +790
392	148	71	2026-03-31	2026-04-27	closed	\N	\N	\N	\N	\N	\N
462	123	5	2026-04-16	2026-04-28	closed	\N	\N	438	72	premium	16/04 +2500
350	86	5	2026-03-23	2026-04-14	closed	\N	\N	341	72	\N	\N
702	25	31	2026-05-18	2026-05-19	closed	\N	\N	688	154	normal	07/05 -2000
490	125	5	2026-04-22	2026-04-28	closed	\N	\N	471	72	premium	21/04 +3000
341	33	5	2026-03-20	2026-03-23	closed	\N	\N	324	72	normal	\N
524	120	5	2026-04-28	2026-04-30	closed	\N	\N	462	72	premium	28/04 +3000 (3)
342	34	5	2026-03-20	2026-03-23	closed	\N	\N	324	72	normal	\N
308	1	5	2026-03-17	2026-03-31	closed	\N	\N	252	50	premium	\N
291	160	58	2026-03-16	2026-05-04	closed	\N	\N	\N	\N	\N	\N
482	139	78	2026-04-22	2026-05-04	closed	\N	\N	\N	\N	\N	\N
479	112	31	2026-04-21	2026-04-22	closed	\N	\N	389	154	normal	21/04 +790
471	94	5	2026-04-21	2026-04-22	closed	\N	\N	426	72	premium	21/04 +3000
468	90	5	2026-04-20	2026-04-22	closed	\N	\N	348	72	premium	20/04 +3000
461	125	5	2026-04-16	2026-04-20	closed	\N	\N	438	72	premium	16/04 -3000
475	82	5	2026-04-21	2026-04-22	closed	\N	\N	349	72	premium	21/04 +3000 (1)
469	93	5	2026-04-20	2026-04-21	closed	\N	\N	348	72	premium	20/04 +2500
472	96	5	2026-04-21	2026-04-21	closed	\N	\N	426	72	premium	21/04 +2500
460	121	5	2026-04-16	2026-04-22	closed	\N	\N	438	72	sub	16/04 -2500 (3)
510	133	62	2026-04-24	2026-04-25	closed	\N	\N	345	345	sub	24/04 -500 (1)
298	28	5	2026-03-16	2026-04-08	closed	\N	\N	262	72	sub	16/03 [-]
335	30	5	2026-03-20	2026-04-08	closed	\N	\N	316	72	normal	20/03 [+]
334	27	5	2026-03-20	2026-04-08	closed	\N	\N	316	72	normal	20/03 [+]
352	33	5	2026-03-23	2026-04-08	closed	\N	\N	329	72	normal	23/03 [+]
296	25	5	2026-03-16	2026-04-08	closed	\N	\N	262	72	sub	16/03 [-]
299	4	5	2026-03-16	2026-04-10	closed	\N	\N	262	72	sub	16/03 [-]
355	2	5	2026-03-23	2026-04-10	closed	\N	\N	329	72	sub	23/03 [-]
476	88	5	2026-04-21	2026-04-22	closed	\N	\N	349	72	sub	21/04 +3000 (2)
477	95	5	2026-04-21	2026-04-22	closed	\N	\N	349	72	sub	21/04 -3000 (1)
345	163	62	2026-03-19	2026-04-24	closed	\N	\N	\N	\N	\N	\N
346	164	63	2026-03-19	2026-04-24	closed	\N	\N	\N	\N	\N	\N
426	94	5	2026-04-08	2026-04-21	closed	\N	\N	340	72	sub	20/03 [-]
480	131	31	2026-04-21	2026-04-24	closed	\N	\N	389	154	sub	21/04 -500
233	111	5	2026-02-27	2026-03-11	closed	\N	\N	51	51	premium	\N
87	21	3	2025-12-03	2025-12-03	closed	\N	\N	5	5	premium	\N
88	22	3	2025-12-03	2025-12-03	closed	\N	\N	5	5	premium	\N
100	86	3	2025-12-04	2025-12-19	closed	\N	\N	10	10	premium	\N
110	25	3	2025-12-10	2025-12-31	closed	\N	\N	23	23	premium	\N
111	29	3	2025-12-10	2025-12-31	closed	\N	\N	23	23	premium	\N
112	30	3	2025-12-10	2025-12-23	closed	\N	\N	23	23	premium	\N
113	31	3	2025-12-10	2025-12-31	closed	\N	\N	23	23	premium	\N
5	21	3	2025-11-26	2025-12-03	closed	\N	\N	\N	5	\N	\N
6	22	3	2025-11-26	2025-12-03	closed	\N	\N	\N	6	\N	\N
7	2	3	2025-11-26	2025-12-04	closed	\N	\N	\N	7	\N	\N
8	23	3	2025-11-26	2025-12-04	closed	\N	\N	\N	8	\N	\N
9	3	3	2025-11-26	2025-12-04	closed	\N	\N	\N	9	\N	\N
10	24	3	2025-11-26	2025-12-04	closed	\N	\N	\N	10	\N	\N
85	6	4	2025-12-03	2025-12-03	closed	\N	\N	28	28	premium	\N
11	4	3	2025-11-26	2026-01-16	closed	\N	\N	\N	11	\N	\N
89	8	4	2025-12-04	2025-12-04	closed	\N	\N	30	30	premium	\N
83	83	5	2025-12-03	2025-12-03	closed	\N	\N	36	36	premium	\N
84	86	5	2025-12-03	2025-12-03	closed	\N	\N	36	36	premium	\N
105	81	5	2025-12-09	2025-12-09	closed	\N	\N	37	37	premium	\N
106	84	5	2025-12-09	2025-12-09	closed	\N	\N	37	37	premium	\N
12	5	3	2025-11-26	2025-12-31	closed	\N	\N	\N	12	\N	\N
14	26	3	2025-11-26	2025-12-04	closed	\N	\N	\N	14	\N	\N
91	97	5	2025-12-04	2026-02-25	closed	\N	\N	50	50	premium	\N
92	83	5	2025-12-04	2026-02-25	closed	\N	\N	50	50	premium	\N
166	120	5	2026-02-11	2026-03-11	closed	\N	\N	72	72	premium	\N
165	127	5	2026-02-11	2026-03-11	closed	\N	\N	72	72	premium	\N
123	91	5	2025-12-11	2025-12-19	closed	\N	\N	53	53	premium	\N
15	27	3	2025-11-26	2025-12-04	closed	\N	\N	\N	15	\N	\N
75	88	5	2025-12-01	2025-12-09	closed	\N	\N	60	60	premium	\N
76	92	5	2025-12-01	2025-12-09	closed	\N	\N	60	60	premium	\N
121	89	5	2025-12-11	2026-03-11	closed	\N	\N	53	53	premium	\N
232	121	5	2026-02-27	2026-03-11	closed	\N	\N	54	54	premium	\N
167	128	5	2026-02-11	2026-03-11	closed	\N	\N	72	72	premium	\N
181	91	25	2026-02-16	2026-02-23	closed	\N	\N	65	65	premium	\N
182	92	25	2026-02-16	2026-02-17	closed	\N	\N	65	65	premium	\N
16	28	3	2025-11-26	2025-12-31	closed	\N	\N	\N	16	\N	\N
179	84	25	2026-02-16	2026-03-11	closed	\N	\N	65	65	sub	\N
178	88	25	2026-02-16	2026-03-11	closed	\N	\N	65	65	sub	\N
20	32	3	2025-11-26	2025-12-31	closed	\N	\N	\N	20	\N	\N
21	33	3	2025-11-26	2025-12-31	closed	\N	\N	\N	21	\N	\N
26	38	3	2025-11-26	2025-12-31	closed	\N	\N	\N	26	\N	\N
79	99	5	2025-12-03	2026-02-25	closed	\N	\N	73	73	premium	\N
27	39	3	2025-11-26	2025-12-31	closed	\N	\N	\N	27	\N	\N
28	6	4	2025-11-27	2025-12-03	closed	\N	\N	\N	28	\N	\N
30	8	4	2025-11-27	2025-12-04	closed	\N	\N	\N	30	\N	\N
32	10	4	2025-11-27	2025-12-03	closed	\N	\N	\N	32	\N	\N
151	137	11	2026-01-22	2026-02-03	closed	\N	\N	97	97	premium	\N
34	81	5	2025-11-28	2025-12-09	closed	\N	\N	\N	34	\N	\N
36	83	5	2025-11-28	2025-12-03	closed	\N	\N	\N	36	\N	\N
37	84	5	2025-11-28	2025-12-09	closed	\N	\N	\N	37	\N	\N
210	138	34	2026-02-25	2026-02-26	closed	\N	\N	157	157	premium	\N
39	86	5	2025-11-28	2025-12-03	closed	\N	\N	\N	39	\N	\N
47	94	5	2025-11-28	2025-12-03	closed	\N	\N	\N	47	\N	\N
49	96	5	2025-11-28	2025-12-09	closed	\N	\N	\N	49	\N	\N
50	97	5	2025-11-28	2025-12-04	closed	\N	\N	\N	50	\N	\N
55	115	5	2025-11-28	2025-12-04	closed	\N	\N	\N	55	\N	\N
56	116	5	2025-11-28	2025-12-04	closed	\N	\N	\N	56	\N	\N
67	101	5	2025-11-28	2026-02-11	closed	\N	\N	\N	67	\N	\N
68	102	5	2025-11-28	2026-02-11	closed	\N	\N	\N	68	\N	\N
69	103	5	2025-11-28	2026-02-11	closed	\N	\N	\N	69	\N	\N
743	223	95	2026-05-21	\N	active	\N	\N	\N	\N	\N	\N
703	19	31	2026-05-18	2026-05-19	closed	\N	\N	680	154	normal	18/05 +3000
247	28	25	2026-03-11	2026-03-16	closed	\N	\N	180	65	\N	\N
262	40	5	2026-03-11	2026-03-16	closed	\N	\N	166	72	\N	\N
202	95	5	2026-02-25	2026-03-16	closed	\N	\N	92	50	premium	\N
200	99	5	2026-02-25	2026-03-16	closed	\N	\N	92	50	premium	\N
201	100	5	2026-02-25	2026-03-16	closed	\N	\N	92	50	premium	\N
199	97	5	2026-02-25	2026-03-16	closed	\N	\N	92	50	premium	\N
241	17	25	2026-03-11	2026-03-16	closed	\N	\N	179	65	\N	\N
171	133	11	2026-02-13	2026-03-16	closed	\N	\N	150	97	normal	\N
174	134	11	2026-02-13	2026-03-16	closed	\N	\N	148	97	normal	\N
533	66	47	2026-04-28	2026-05-06	closed	\N	\N	513	214	sub	28/04 +500
539	99	31	2026-04-29	2026-05-07	closed	\N	\N	411	154	normal	29/04 -2000 (3)
175	135	11	2026-02-13	2026-03-16	closed	\N	\N	148	97	normal	\N
172	136	11	2026-02-13	2026-03-16	closed	\N	\N	150	97	normal	\N
250	11	5	2026-03-11	2026-03-17	closed	\N	\N	205	50	\N	\N
253	9	5	2026-03-11	2026-03-17	closed	\N	\N	206	50	\N	\N
388	131	31	2026-03-31	2026-04-20	closed	\N	\N	226	154	sub	31/03 +500
512	61	81	2026-04-24	2026-04-28	closed	\N	\N	508	508	\N	\N
306	12	5	2026-03-17	2026-04-21	closed	\N	\N	252	50	sub	17/03 [-]
221	81	5	2026-03-02	2026-03-09	closed	\N	\N	164	72	normal	\N
209	82	5	2026-02-25	2026-03-11	closed	\N	\N	92	50	normal	\N
389	139	31	2026-03-31	2026-04-21	closed	\N	\N	226	154	sub	31/03 -500
265	38	5	2026-03-11	2026-03-18	closed	\N	\N	234	51	\N	\N
386	16	31	2026-03-31	2026-04-08	closed	\N	\N	226	154	normal	31/03 +790
540	93	31	2026-04-29	2026-05-07	closed	\N	\N	411	154	normal	29/04 -2000 (4)
256	27	5	2026-03-11	2026-03-18	closed	\N	\N	222	72	\N	\N
268	39	5	2026-03-11	2026-03-18	closed	\N	\N	168	72	\N	\N
244	35	5	2026-03-11	2026-03-19	closed	\N	\N	223	72	\N	\N
259	8	11	2026-03-11	2026-03-19	closed	\N	\N	158	97	\N	\N
310	9	5	2026-03-17	2026-03-23	closed	\N	\N	238	72	sub	\N
311	14	5	2026-03-17	2026-03-23	closed	\N	\N	238	72	sub	\N
173	146	11	2026-02-13	2026-02-16	closed	\N	\N	148	97	normal	\N
354	34	5	2026-03-23	2026-04-08	closed	\N	\N	329	72	normal	23/03 [+]
161	143	35	2026-02-05	2026-03-24	closed	\N	\N	\N	161	\N	\N
162	144	36	2026-02-06	2026-03-24	closed	\N	\N	\N	162	\N	\N
160	137	11	2026-02-03	2026-02-16	closed	\N	\N	151	97	normal	\N
225	140	31	2026-03-02	2026-03-03	closed	\N	\N	154	154	premium	\N
163	145	37	2026-02-12	2026-03-24	closed	\N	\N	\N	163	\N	\N
309	3	5	2026-03-17	2026-03-31	closed	\N	\N	238	72	premium	\N
227	142	31	2026-03-02	2026-03-31	closed	\N	\N	154	154	sub	\N
403	21	5	2026-04-07	2026-04-10	closed	\N	\N	376	72	normal	07/04 +4000 (2)
466	144	76	2026-04-16	2026-04-24	closed	\N	\N	\N	\N	\N	\N
176	130	11	2026-02-16	2026-03-06	closed	\N	\N	173	97	normal	\N
213	119	34	2026-02-26	2026-03-03	closed	\N	\N	210	157	premium	\N
228	119	34	2026-03-03	2026-03-06	closed	\N	\N	213	157	premium	\N
197	83	5	2026-02-25	2026-03-11	closed	\N	\N	92	50	normal	\N
313	5	5	2026-03-17	2026-04-10	closed	\N	\N	238	72	sub	17/03 [-]
198	85	5	2026-02-25	2026-03-11	closed	\N	\N	92	50	normal	\N
223	87	5	2026-02-27	2026-03-11	closed	\N	\N	169	72	normal	\N
230	156	51	2026-03-03	2026-04-13	closed	\N	\N	\N	230	\N	\N
525	122	5	2026-04-28	2026-04-30	closed	\N	\N	462	72	premium	28/04 +4000
204	91	5	2026-02-25	2026-03-11	closed	\N	\N	92	50	normal	\N
203	92	5	2026-02-25	2026-03-11	closed	\N	\N	92	50	normal	\N
205	93	5	2026-02-25	2026-03-11	closed	\N	\N	92	50	normal	\N
305	11	5	2026-03-17	2026-04-10	closed	\N	\N	252	50	sub	17/03 [-]
207	96	5	2026-02-25	2026-03-11	closed	\N	\N	92	50	normal	\N
206	98	5	2026-02-25	2026-03-11	closed	\N	\N	92	50	normal	\N
370	37	5	2026-03-27	2026-04-08	closed	\N	\N	314	72	normal	27/03 [-]
208	112	5	2026-02-25	2026-03-11	closed	\N	\N	92	50	premium	\N
222	113	5	2026-03-02	2026-03-11	closed	\N	\N	164	72	normal	\N
292	161	59	2026-03-16	2026-05-04	closed	\N	\N	\N	\N	\N	\N
224	115	5	2026-02-27	2026-03-11	closed	\N	\N	169	72	normal	\N
158	116	11	2026-02-03	2026-03-11	closed	\N	\N	151	97	premium	\N
483	143	79	2026-04-22	2026-05-04	closed	\N	\N	\N	\N	\N	\N
159	117	11	2026-02-03	2026-03-11	closed	\N	\N	151	97	premium	\N
235	118	5	2026-02-27	2026-03-11	closed	\N	\N	170	72	normal	\N
331	10	5	2026-03-19	2026-04-10	closed	\N	\N	264	72	sub	19/03 [-]
236	124	5	2026-02-27	2026-03-11	closed	\N	\N	170	72	normal	\N
340	38	5	2026-03-20	2026-04-08	closed	\N	\N	326	72	sub	20/03 [-]
168	129	5	2026-02-11	2026-03-11	closed	\N	\N	72	72	premium	\N
404	149	72	2026-04-02	2026-05-04	closed	\N	\N	\N	\N	\N	\N
440	113	47	2026-04-13	2026-05-04	closed	\N	\N	214	214	premium	13/04 +790
530	67	47	2026-04-28	2026-05-05	closed	\N	\N	514	214	normal	28/04 +500 (1)
531	68	47	2026-04-28	2026-05-06	closed	\N	\N	514	214	normal	28/04 +500 (2)
543	137	85	2026-04-29	2026-05-07	closed	\N	\N	\N	\N	\N	\N
541	94	31	2026-04-29	2026-05-07	closed	\N	\N	411	154	normal	29/04 -2000 (5)
307	13	5	2026-03-17	2026-04-10	closed	\N	\N	252	50	sub	17/03 [-]
170	118	5	2026-02-11	2026-02-27	closed	\N	\N	72	72	sub	\N
70	104	5	2025-11-28	2026-02-11	closed	\N	\N	\N	70	\N	\N
72	106	5	2025-11-28	2026-02-11	closed	\N	\N	\N	72	\N	\N
74	108	5	2025-11-28	2026-02-11	closed	\N	\N	\N	74	\N	\N
96	61	10	2025-12-06	2026-01-22	closed	\N	\N	\N	96	\N	\N
97	62	11	2025-12-06	2026-01-22	closed	\N	\N	\N	97	\N	\N
130	63	20	2025-12-23	2026-01-22	closed	\N	\N	\N	130	\N	\N
132	64	23	2025-12-23	2026-01-22	closed	\N	\N	\N	132	\N	\N
304	134	11	2026-03-16	2026-05-08	closed	\N	\N	171	97	normal	16/03 [-]
359	104	37	2026-03-24	2026-04-08	closed	\N	\N	163	163	premium	24/03 +790
133	94	24	2026-01-07	2026-03-11	closed	\N	\N	\N	133	\N	\N
337	32	5	2026-03-20	2026-04-08	closed	\N	\N	326	72	normal	20/03 [+]
338	35	5	2026-03-20	2026-04-08	closed	\N	\N	326	72	normal	20/03 [+]
343	39	5	2026-03-20	2026-04-08	closed	\N	\N	324	72	sub	20/03 [-]
312	15	5	2026-03-17	2026-04-10	closed	\N	\N	238	72	sub	17/03 [-]
351	88	5	2026-03-23	2026-04-14	closed	\N	\N	342	72	\N	\N
402	14	5	2026-04-07	2026-04-15	closed	\N	\N	376	72	normal	07/04 +4000 (1)
487	111	5	2026-04-22	2026-04-28	closed	\N	\N	485	72	normal	22/04 +2500 (1)
488	114	5	2026-04-22	2026-04-28	closed	\N	\N	486	72	normal	22/04 +2500 (2)
489	120	5	2026-04-22	2026-04-28	closed	\N	\N	473	72	premium	21/04 +2500 (1)
492	122	5	2026-04-22	2026-04-28	closed	\N	\N	474	72	premium	21/04 +2500 (2)
515	64	31	2026-04-24	2026-04-28	closed	\N	\N	480	154	sub	21/04 -500
516	102	62	2026-04-25	2026-05-03	closed	\N	\N	510	345	sub	24/04 -500 (1)
514	63	47	2026-04-24	2026-04-28	closed	\N	\N	442	214	sub	13/04 -500 (2)
704	20	31	2026-05-18	2026-05-19	closed	\N	\N	680	154	normal	18/05 +4000
413	90	5	2026-04-08	2026-04-20	closed	\N	\N	298	72	sub	16/03 [-]
415	93	5	2026-04-08	2026-04-20	closed	\N	\N	297	72	sub	16/03 [-]
409	118	34	2026-04-08	2026-04-23	closed	\N	\N	289	157	normal	13/03 [-]
423	82	5	2026-04-08	2026-04-14	closed	\N	\N	354	72	normal	23/03 [+]
424	97	5	2026-04-08	2026-04-14	closed	\N	\N	370	72	normal	27/03 [-]
414	81	5	2026-04-08	2026-04-14	closed	\N	\N	337	72	normal	20/03 [+]
430	11	5	2026-04-10	2026-04-15	closed	\N	\N	381	72	normal	31/03 T3
495	117	31	2026-04-22	2026-05-04	closed	\N	\N	470	154	normal	22/04 +790 (2)
513	62	47	2026-04-21	2026-04-28	closed	\N	\N	441	214	sub	13/04 -500 (1)
497	118	34	2026-04-23	2026-04-29	closed	\N	\N	409	157	premium	23/04 +1600 (1)
412	119	31	2026-04-08	2026-04-29	closed	\N	\N	387	154	normal	31/03 +790
438	125	5	2026-04-10	2026-04-16	closed	\N	\N	357	72	sub	23/03 [-]
428	127	5	2026-04-10	2026-04-16	closed	\N	\N	305	50	sub	17/03 [-]
493	127	5	2026-04-22	2026-04-24	closed	\N	\N	475	72	premium	21/04 +3000 (1)
431	120	5	2026-04-10	2026-04-16	closed	\N	\N	307	50	sub	17/03 [-]
453	117	5	2026-04-15	2026-04-17	closed	\N	\N	420	72	premium	15/04 +3000
443	81	5	2026-04-14	2026-04-17	closed	\N	\N	417	72	premium	14/04 +3000 (1)
451	122	5	2026-04-15	2026-04-20	closed	\N	\N	420	72	premium	15/04 +4000
444	97	5	2026-04-14	2026-04-17	closed	\N	\N	417	72	premium	14/04 +3000 (2)
498	124	34	2026-04-23	2026-04-29	closed	\N	\N	409	157	premium	23/04 +1600 (2)
452	129	5	2026-04-15	2026-04-21	closed	\N	\N	420	72	sub	15/04 -3000 (1)
448	88	5	2026-04-14	2026-04-21	closed	\N	\N	417	72	sub	14/04 -3000 (4)
450	95	5	2026-04-14	2026-04-21	closed	\N	\N	417	72	sub	14/04 -3000 (6)
455	96	5	2026-04-15	2026-04-21	closed	\N	\N	420	72	sub	15/04 -3000 (3)
499	126	34	2026-04-23	2026-04-29	closed	\N	\N	409	157	sub	23/04 +1600 (3)
433	121	5	2026-04-10	2026-04-16	closed	\N	\N	299	72	sub	16/03 [-]
416	85	5	2026-04-08	2026-04-20	closed	\N	\N	338	72	normal	20/03 [+]
454	91	5	2026-04-15	2026-04-21	closed	\N	\N	420	72	sub	15/04 -3000 (2)
449	82	5	2026-04-14	2026-04-21	closed	\N	\N	417	72	sub	14/04 -3000 (5)
447	100	5	2026-04-14	2026-04-21	closed	\N	\N	417	72	sub	14/04 -3000 (3)
445	86	5	2026-04-14	2026-04-21	closed	\N	\N	417	72	sub	14/04 -3000 (1)
446	112	5	2026-04-14	2026-04-21	closed	\N	\N	417	72	sub	14/04 -3000 (2)
478	100	5	2026-04-21	2026-04-22	closed	\N	\N	349	72	sub	21/04 -3000 (2)
464	111	5	2026-04-16	2026-04-22	closed	\N	\N	438	72	sub	16/04 -2500 (5)
458	114	5	2026-04-16	2026-04-22	closed	\N	\N	438	72	sub	16/04 -2500 (1)
459	115	5	2026-04-16	2026-04-22	closed	\N	\N	438	72	sub	16/04 -2500 (2)
465	120	5	2026-04-16	2026-04-22	closed	\N	\N	438	72	sub	16/04 -2500 (6)
463	127	5	2026-04-16	2026-04-22	closed	\N	\N	438	72	sub	16/04 -2500 (4)
422	83	5	2026-04-08	2026-04-20	closed	\N	\N	294	72	sub	16/03 [-]
439	89	5	2026-04-10	2026-04-20	closed	\N	\N	312	72	sub	17/03 [-]
485	81	5	2026-04-22	2026-04-22	closed	\N	\N	477	72	normal	22/04 +2500 (1)
486	84	5	2026-04-22	2026-04-22	closed	\N	\N	477	72	normal	22/04 +2500 (2)
473	93	5	2026-04-21	2026-04-22	closed	\N	\N	472	72	premium	21/04 +2500 (1)
474	96	5	2026-04-21	2026-04-22	closed	\N	\N	472	72	premium	21/04 +2500 (2)
470	117	31	2026-04-20	2026-04-22	closed	\N	\N	388	154	normal	20/04 +790
529	70	31	2026-04-28	2026-05-05	closed	\N	\N	515	154	normal	28/04 +500
408	116	34	2026-04-08	2026-04-23	closed	\N	\N	384	157	\N	\N
406	124	11	2026-04-08	2026-04-23	closed	\N	\N	358	97	\N	\N
536	119	31	2026-04-29	2026-05-04	closed	\N	\N	411	154	normal	29/04 -1600 (3)
494	112	31	2026-04-22	2026-04-29	closed	\N	\N	470	154	normal	22/04 +790 (1)
410	130	37	2026-04-08	2026-04-29	closed	\N	\N	359	163	premium	24/03 +790
491	129	5	2026-04-22	2026-04-24	closed	\N	\N	468	72	premium	20/04 +3000
535	118	31	2026-04-29	2026-05-04	closed	\N	\N	411	154	normal	29/04 -1600 (2)
496	116	34	2026-04-23	2026-05-04	closed	\N	\N	409	157	premium	23/04 +2000
484	147	80	2026-04-22	2026-05-04	closed	\N	\N	\N	\N	\N	\N
467	146	77	2026-04-16	2026-05-07	closed	\N	\N	\N	\N	\N	\N
508	154	81	2026-04-24	2026-04-24	closed	\N	\N	\N	\N	\N	\N
435	125	5	2026-04-10	2026-04-10	closed	\N	\N	373	50	normal	31/03 [-]
427	112	5	2026-04-10	2026-04-14	closed	\N	\N	331	72	sub	19/03 [-]
429	10	5	2026-04-10	2026-04-15	closed	\N	\N	403	72	normal	07/04 +4000 (2)
420	91	5	2026-04-08	2026-04-15	closed	\N	\N	352	72	normal	23/03 [+]
418	96	5	2026-04-08	2026-04-15	closed	\N	\N	334	72	normal	20/03 [+]
417	100	5	2026-04-08	2026-04-14	closed	\N	\N	335	72	normal	20/03 [+]
419	99	5	2026-04-08	2026-04-15	closed	\N	\N	371	72	normal	27/03 [-]
517	144	83	2026-04-16	2026-04-30	closed	\N	\N	\N	\N	\N	\N
534	115	31	2026-04-29	2026-05-04	closed	\N	\N	411	154	normal	29/04 -1600 (1)
481	135	31	2026-04-21	2026-05-04	closed	\N	\N	389	154	sub	21/04 [-]
532	69	81	2026-04-28	2026-05-04	closed	\N	\N	512	508	sub	28/04 -790
557	183	83	2026-04-30	2026-05-06	closed	\N	\N	517	517	\N	\N
537	82	31	2026-04-29	2026-05-07	closed	\N	\N	411	154	normal	29/04 -2000 (1)
587	135	89	2026-05-05	2026-05-07	closed	\N	\N	\N	\N	\N	\N
586	132	88	2026-05-05	2026-05-07	closed	\N	\N	\N	\N	\N	\N
588	139	90	2026-05-05	2026-05-07	closed	\N	\N	\N	\N	\N	\N
551	142	87	2026-04-29	2026-05-07	closed	\N	\N	\N	\N	\N	\N
548	141	86	2026-04-29	2026-05-07	closed	\N	\N	\N	\N	\N	\N
589	140	91	2026-05-05	2026-05-07	closed	\N	\N	\N	\N	\N	\N
609	203	77	2026-05-07	2026-05-12	closed	\N	\N	467	467	\N	\N
615	213	85	2026-05-07	2026-05-18	closed	\N	\N	543	543	\N	\N
705	203	92	2026-05-19	\N	active	\N	\N	\N	\N	\N	\N
544	23	31	2026-04-29	2026-04-29	closed	\N	\N	494	154	normal	22/04 +790 (1)
706	194	93	2026-05-19	\N	active	\N	\N	\N	\N	\N	\N
547	21	37	2026-04-29	2026-04-29	closed	\N	\N	410	163	premium	24/03 +790
567	110	75	2026-05-04	2026-05-21	closed	\N	\N	457	457	premium	04/05 +790
526	123	5	2026-04-28	2026-04-30	closed	\N	\N	462	72	normal	28/04 -3000 (1)
527	125	5	2026-04-28	2026-04-30	closed	\N	\N	462	72	normal	28/04 -3000 (2)
528	127	5	2026-04-28	2026-04-30	closed	\N	\N	462	72	normal	28/04 -3000 (3)
707	20	31	2026-05-19	2026-05-20	closed	\N	\N	703	154	normal	19/05 +4000
708	19	31	2026-05-19	2026-05-19	closed	\N	\N	703	154	normal	19/05 +3000
732	150	31	2026-05-19	2026-05-19	closed	\N	\N	708	154	normal	19/05 +3000 (2)
603	104	70	2026-05-06	2026-05-21	closed	\N	\N	556	391	normal	06/05 +1000
598	1	70	2026-05-06	2026-05-11	closed	\N	\N	572	391	premium	06/05 +1000 (3)
599	2	70	2026-05-06	2026-05-11	closed	\N	\N	572	391	premium	06/05 +1000 (4)
597	3	70	2026-05-06	2026-05-11	closed	\N	\N	572	391	premium	06/05 +1000 (2)
522	111	5	2026-04-28	2026-04-30	closed	\N	\N	462	72	premium	28/04 +3000 (1)
552	96	5	2026-04-30	2026-05-01	closed	\N	\N	526	72	normal	30/04 +3000 (1)
731	19	31	2026-05-19	2026-05-22	closed	\N	\N	708	154	normal	19/05 +3000 (1)
734	193	75	2026-05-20	2026-05-25	closed	\N	\N	667	457	normal	12/05 -500 (1)
741	106	75	2026-05-21	2026-05-26	closed	\N	\N	668	457	normal	12/05 -500 (2)
755	226	75	2026-05-25	\N	active	\N	\N	734	457	normal	25/05 -500
754	104	75	2026-05-25	2026-05-25	closed	\N	\N	734	457	normal	25/05 +790
772	68	91	2026-05-27	\N	active	\N	\N	728	589	sub	18/05 -500 (1)
602	105	70	2026-05-06	2026-05-28	closed	\N	\N	572	391	normal	06/05 -1000
604	108	70	2026-05-06	2026-05-28	closed	\N	\N	556	391	sub	06/05 -790
555	87	5	2026-04-30	2026-05-08	closed	\N	\N	526	72	normal	30/04 +3000 (4)
565	151	75	2026-05-04	2026-05-04	closed	\N	\N	457	457	sub	04/05 -500
554	88	5	2026-04-30	2026-05-08	closed	\N	\N	526	72	normal	30/04 +3000 (3)
550	22	37	2026-04-29	2026-05-12	closed	\N	\N	547	163	premium	24/03 +790
594	67	47	2026-05-06	2026-05-14	closed	\N	\N	533	214	sub	06/05 -1000 (2)
569	107	81	2026-05-04	2026-05-04	closed	\N	\N	532	508	normal	04/05 +790
571	101	70	2026-05-01	2026-05-04	closed	\N	\N	518	391	premium	27/04 +790
574	109	47	2026-05-04	2026-05-04	closed	\N	\N	440	214	premium	13/04 +790
583	107	62	2026-05-03	2026-05-05	closed	\N	\N	516	345	sub	24/04 -500 (1)
578	67	47	2026-05-05	2026-05-06	closed	\N	\N	530	214	normal	28/04 +500 (1)
577	69	31	2026-05-05	2026-05-06	closed	\N	\N	529	154	normal	28/04 +500
558	115	31	2026-05-04	2026-05-08	closed	\N	\N	534	154	normal	29/04 -1600 (1)
564	116	31	2026-05-04	2026-05-08	closed	\N	\N	536	154	normal	29/04 -1600 (3)
590	65	47	2026-05-06	2026-05-06	closed	\N	\N	578	214	normal	28/04 +500 (1)
572	103	70	2026-05-01	2026-05-06	closed	\N	\N	518	391	premium	27/04 +790
573	105	47	2026-05-04	2026-05-06	closed	\N	\N	440	214	premium	13/04 +790
581	104	70	2026-05-04	2026-05-06	closed	\N	\N	571	391	premium	27/04 +790
582	101	47	2026-05-04	2026-05-06	closed	\N	\N	574	214	premium	13/04 +790
545	23	31	2026-04-29	2026-05-12	closed	\N	\N	544	154	normal	22/04 +790 (1)
546	24	31	2026-04-29	2026-05-12	closed	\N	\N	544	154	normal	22/04 +790 (1)
605	143	70	2026-05-06	2026-05-12	closed	\N	\N	556	391	sub	06/05 -500
613	223	75	2026-05-07	2026-05-12	closed	\N	\N	566	457	premium	04/05 +500
614	224	75	2026-05-07	2026-05-12	closed	\N	\N	568	457	sub	04/05 -500
593	68	47	2026-05-06	2026-05-15	closed	\N	\N	533	214	sub	06/05 -1000 (1)
538	90	31	2026-04-29	2026-05-07	closed	\N	\N	411	154	normal	29/04 -2000 (2)
606	82	31	2026-05-07	2026-05-07	closed	\N	\N	537	154	normal	07/05 +2000 (1)
607	90	31	2026-05-07	2026-05-07	closed	\N	\N	537	154	normal	07/05 +2000 (2)
566	152	75	2026-05-04	2026-05-07	closed	\N	\N	457	457	premium	04/05 +500
568	151	75	2026-05-04	2026-05-07	closed	\N	\N	565	457	sub	04/05 -500
562	89	34	2026-05-04	2026-05-07	closed	\N	\N	496	157	premium	23/04 +2000
591	123	47	2026-05-06	2026-05-07	closed	\N	\N	533	214	normal	06/05 +1000 (1)
592	125	47	2026-05-06	2026-05-07	closed	\N	\N	533	214	normal	06/05 +1000 (2)
576	113	31	2026-05-04	2026-05-07	closed	\N	\N	495	154	normal	22/04 +790 (2)
575	117	31	2026-05-04	2026-05-07	closed	\N	\N	495	154	normal	22/04 +790 (2)
553	83	5	2026-04-30	2026-05-08	closed	\N	\N	526	72	normal	30/04 +3000 (2)
560	118	31	2026-05-04	2026-05-08	closed	\N	\N	535	154	normal	29/04 -1600 (2)
563	119	31	2026-05-04	2026-05-08	closed	\N	\N	536	154	normal	29/04 -1600 (3)
559	120	31	2026-05-04	2026-05-08	closed	\N	\N	534	154	normal	29/04 -1600 (1)
561	122	31	2026-05-04	2026-05-08	closed	\N	\N	535	154	normal	29/04 -1600 (2)
595	69	47	2026-05-06	2026-05-11	closed	\N	\N	590	214	normal	28/04 +500 (1)
579	70	47	2026-05-05	2026-05-11	closed	\N	\N	530	214	normal	28/04 +500 (1)
601	4	70	2026-05-06	2026-05-11	closed	\N	\N	572	391	premium	06/05 +1000 (6)
596	5	70	2026-05-06	2026-05-11	closed	\N	\N	572	391	premium	06/05 +1000 (1)
600	6	70	2026-05-06	2026-05-11	closed	\N	\N	572	391	premium	06/05 +1000 (5)
584	107	62	2026-05-05	2026-05-12	closed	\N	\N	583	345	sub	24/04 -500 (1)
585	109	62	2026-05-05	2026-05-12	closed	\N	\N	583	345	sub	24/04 -500 (1)
549	21	37	2026-04-29	2026-05-12	closed	\N	\N	547	163	premium	24/03 +790
570	25	81	2026-05-04	2026-05-13	closed	\N	\N	532	508	normal	04/05 +1000
608	93	31	2026-05-07	2026-05-15	closed	\N	\N	537	154	normal	07/05 -2000
580	106	81	2026-05-04	2026-05-18	closed	\N	\N	569	508	normal	04/05 +790
542	133	84	2026-04-29	2026-05-07	closed	\N	\N	\N	\N	\N	\N
676	2	31	2026-05-14	2026-05-18	closed	\N	\N	635	154	normal	08/05 +1000 (1)
688	23	31	2026-05-15	2026-05-18	closed	\N	\N	608	154	normal	07/05 -2000
680	19	31	2026-05-14	2026-05-18	closed	\N	\N	622	154	normal	29/04 -2000 (5)
681	20	31	2026-05-14	2026-05-18	closed	\N	\N	621	154	normal	29/04 -2000 (5)
682	17	5	2026-05-14	2026-05-19	closed	\N	\N	631	72	normal	08/05 +3000
691	40	62	2026-05-18	2026-05-19	closed	\N	\N	654	345	normal	12/05 +1600 (4)
663	33	62	2026-05-12	2026-05-19	closed	\N	\N	585	345	normal	12/05 +1600 (8)
672	38	31	2026-05-13	2026-05-19	closed	\N	\N	626	154	normal	13/05 +1600 (1)
623	89	34	2026-05-07	2026-05-07	closed	\N	\N	562	157	premium	07/05 +3000
651	31	62	2026-05-12	2026-05-19	closed	\N	\N	585	345	normal	12/05 +1600 (1)
661	39	62	2026-05-12	2026-05-20	closed	\N	\N	585	345	normal	12/05 +1600 (6)
667	193	75	2026-05-12	2026-05-20	closed	\N	\N	613	457	normal	12/05 -500 (1)
618	216	87	2026-05-07	2026-05-08	closed	\N	\N	551	551	\N	\N
619	217	86	2026-05-07	2026-05-08	closed	\N	\N	548	548	\N	\N
668	208	75	2026-05-12	2026-05-21	closed	\N	\N	613	457	normal	12/05 -500 (2)
670	26	31	2026-05-13	\N	active	\N	\N	626	154	normal	13/05 -1600 (1)
665	216	70	2026-05-12	2026-05-25	closed	\N	\N	520	391	sub	12/05 -500
669	217	75	2026-05-12	2026-05-25	closed	\N	\N	613	457	normal	12/05 -500 (3)
692	101	81	2026-05-18	2026-05-26	closed	\N	\N	580	508	normal	04/05 +790
693	103	81	2026-05-18	2026-05-26	closed	\N	\N	580	508	normal	04/05 +790
634	90	5	2026-05-08	2026-05-15	closed	\N	\N	553	72	normal	08/05 -3000 (3)
686	194	47	2026-05-15	2026-05-18	closed	\N	\N	593	214	sub	06/05 -1000 (1)
666	107	75	2026-05-12	2026-05-26	closed	\N	\N	613	457	premium	12/05 +790
628	102	11	2026-05-08	2026-05-26	closed	\N	\N	304	97	normal	08/05 +790
629	183	11	2026-05-08	2026-05-27	closed	\N	\N	304	97	normal	08/05 -500 (1)
690	21	47	2026-05-18	2026-05-28	closed	\N	\N	686	214	normal	18/05 +1000
664	109	70	2026-05-12	2026-05-28	closed	\N	\N	520	391	normal	12/05 +790
621	94	31	2026-05-07	2026-05-14	closed	\N	\N	541	154	normal	29/04 -2000 (5)
631	83	5	2026-05-08	2026-05-14	closed	\N	\N	553	72	normal	08/05 +3000
641	70	47	2026-05-11	2026-05-14	closed	\N	\N	579	214	normal	11/05 -1600 (2)
632	87	5	2026-05-08	2026-05-15	closed	\N	\N	553	72	normal	08/05 -3000 (1)
643	6	70	2026-05-11	\N	active	\N	\N	598	391	normal	11/05 -1600 (1)
644	15	70	2026-05-11	\N	active	\N	\N	598	391	normal	11/05 -1600 (2)
625	101	47	2026-05-07	2026-05-12	closed	\N	\N	592	214	normal	06/05 +1000 (2)
624	103	47	2026-05-07	2026-05-12	closed	\N	\N	591	214	normal	06/05 +1000 (1)
656	29	62	2026-05-12	\N	active	\N	\N	585	345	sub	12/05 -1600 (1)
657	28	62	2026-05-12	\N	active	\N	\N	585	345	sub	12/05 -1600 (2)
658	30	62	2026-05-12	\N	active	\N	\N	585	345	sub	12/05 -1600 (3)
659	22	62	2026-05-12	\N	active	\N	\N	585	345	sub	12/05 -1600 (4)
660	24	62	2026-05-12	\N	active	\N	\N	585	345	sub	12/05 -1600 (5)
662	32	62	2026-05-12	\N	active	\N	\N	585	345	normal	12/05 +1600 (7)
630	132	11	2026-05-08	2026-05-12	closed	\N	\N	304	97	normal	08/05 -500 (2)
511	136	62	2026-04-24	2026-05-12	closed	\N	\N	345	345	sub	24/04 -500 (2)
626	26	31	2026-05-07	2026-05-13	closed	\N	\N	576	154	normal	22/04 +790 (2)
627	27	31	2026-05-07	2026-05-13	closed	\N	\N	575	154	normal	22/04 +790 (2)
671	27	31	2026-05-13	\N	active	\N	\N	626	154	normal	13/05 -1600 (2)
638	119	31	2026-05-08	2026-05-14	closed	\N	\N	559	154	normal	08/05 +1000 (4)
636	116	31	2026-05-08	2026-05-14	closed	\N	\N	559	154	normal	08/05 +1000 (2)
635	115	31	2026-05-08	2026-05-14	closed	\N	\N	559	154	normal	08/05 +1000 (1)
637	118	31	2026-05-08	2026-05-14	closed	\N	\N	559	154	normal	08/05 +1000 (3)
639	122	31	2026-05-08	2026-05-14	closed	\N	\N	559	154	normal	08/05 -1000
678	3	31	2026-05-14	\N	active	\N	\N	639	154	normal	08/05 -1000
642	82	47	2026-05-11	2026-05-14	closed	\N	\N	579	214	normal	11/05 +1600
622	100	31	2026-05-07	2026-05-14	closed	\N	\N	541	154	normal	29/04 -2000 (5)
640	69	47	2026-05-11	2026-05-15	closed	\N	\N	579	214	normal	11/05 -1600 (1)
633	88	5	2026-05-08	2026-05-15	closed	\N	\N	553	72	normal	08/05 -3000 (2)
687	218	47	2026-05-15	2026-05-18	closed	\N	\N	640	214	normal	11/05 -1600 (1)
654	36	62	2026-05-12	2026-05-18	closed	\N	\N	585	345	normal	12/05 +1600 (4)
689	66	47	2026-05-15	2026-05-18	closed	\N	\N	685	214	sub	06/05 -1000 (2)
684	67	47	2026-05-14	2026-05-18	closed	\N	\N	594	214	sub	06/05 -1000 (2)
694	36	47	2026-05-18	\N	active	\N	\N	689	214	normal	18/05 +1600
616	214	84	2026-05-07	2026-05-18	closed	\N	\N	542	542	\N	\N
617	215	74	2026-05-07	2026-05-18	closed	\N	\N	456	456	\N	\N
620	207	91	2026-05-07	2026-05-18	closed	\N	\N	589	589	\N	\N
695	66	47	2026-05-18	\N	active	\N	\N	689	214	sub	18/05 -1600 (1)
696	67	47	2026-05-18	\N	active	\N	\N	689	214	sub	18/05 -1600 (2)
610	204	89	2026-05-07	2026-05-18	closed	\N	\N	587	587	\N	\N
611	205	88	2026-05-07	2026-05-18	closed	\N	\N	586	586	\N	\N
612	206	90	2026-05-07	2026-05-18	closed	\N	\N	588	588	\N	\N
746	131	31	2026-05-22	2026-05-22	closed	\N	\N	719	345	normal	\N
724	12	31	2026-05-19	2026-05-28	closed	\N	\N	655	345	normal	19/05 -2000 (7)
701	23	31	2026-05-18	2026-05-19	closed	\N	\N	688	154	normal	07/05 -2000
655	35	62	2026-05-12	2026-05-19	closed	\N	\N	585	345	normal	12/05 +1600 (5)
652	37	62	2026-05-12	2026-05-19	closed	\N	\N	585	345	normal	12/05 +1600 (2)
653	34	62	2026-05-12	2026-05-19	closed	\N	\N	585	345	normal	12/05 +1600 (3)
647	5	70	2026-05-11	2026-05-19	closed	\N	\N	598	391	premium	11/05 +1600 (2)
648	10	70	2026-05-11	2026-05-19	closed	\N	\N	598	391	premium	11/05 +1600 (3)
649	13	70	2026-05-11	2026-05-19	closed	\N	\N	598	391	premium	11/05 +1600 (4)
679	1	47	2026-05-14	2026-05-19	closed	\N	\N	642	214	normal	11/05 +1600
650	9	70	2026-05-11	2026-05-19	closed	\N	\N	598	391	premium	11/05 +1600 (5)
673	12	31	2026-05-13	2026-05-19	closed	\N	\N	626	154	normal	13/05 +1600 (2)
677	4	31	2026-05-14	2026-05-19	closed	\N	\N	637	154	normal	08/05 +1000 (3)
646	8	70	2026-05-11	2026-05-19	closed	\N	\N	598	391	premium	11/05 +1600 (1)
674	16	31	2026-05-14	2026-05-19	closed	\N	\N	638	154	normal	08/05 +1000 (4)
645	7	70	2026-05-11	2026-05-19	closed	\N	\N	598	391	normal	11/05 -1600 (3)
675	11	31	2026-05-14	2026-05-19	closed	\N	\N	636	154	normal	08/05 +1000 (2)
715	17	31	2026-05-19	2026-05-26	closed	\N	\N	655	345	normal	19/05 +2500 (3)
699	204	91	2026-05-18	2026-05-27	closed	\N	\N	620	589	sub	18/05 -500 (2)
756	110	75	2026-05-25	2026-05-28	closed	\N	\N	754	457	normal	25/05 +790
722	18	31	2026-05-19	2026-05-26	closed	\N	\N	655	345	normal	19/05 +2500 (4)
714	20	31	2026-05-19	2026-05-26	closed	\N	\N	655	345	normal	19/05 +2500 (2)
747	8	31	2026-05-22	2026-05-26	closed	\N	\N	719	345	normal	\N
771	183	75	2026-05-27	\N	active	\N	\N	735	457	normal	27/05 -790
757	101	75	2026-05-26	2026-05-28	closed	\N	\N	666	457	premium	\N
773	69	91	2026-05-27	\N	active	\N	\N	729	589	sub	18/05 -500 (1)
698	184	91	2026-05-18	2026-05-20	closed	\N	\N	620	589	sub	18/05 -500 (1)
726	38	31	2026-05-19	2026-05-19	closed	\N	\N	655	345	normal	19/05 +2500 (5)
733	7	47	2026-05-18	\N	active	\N	\N	683	214	normal	11/05 -1600 (2)
697	106	91	2026-05-18	2026-05-21	closed	\N	\N	620	589	premium	18/05 +790
737	4	75	2026-05-21	\N	active	\N	\N	567	457	normal	21/05 -1600 (1)
738	23	75	2026-05-21	\N	active	\N	\N	567	457	normal	21/05 -1600 (2)
739	38	75	2026-05-21	\N	active	\N	\N	567	457	premium	21/05 +1600 (1)
758	103	75	2026-05-26	2026-05-28	closed	\N	\N	666	457	premium	\N
742	205	94	2026-05-21	\N	active	\N	\N	\N	\N	\N	\N
744	224	96	2026-05-21	\N	active	\N	\N	\N	\N	\N	\N
745	225	97	2026-05-21	\N	active	\N	\N	\N	\N	\N	\N
723	13	31	2026-05-19	2026-05-22	closed	\N	\N	655	345	normal	19/05 +2000 (5)
719	5	31	2026-05-19	2026-05-22	closed	\N	\N	655	345	normal	19/05 -2000 (4)
717	8	31	2026-05-19	2026-05-22	closed	\N	\N	655	345	normal	19/05 +2000 (4)
716	16	31	2026-05-19	2026-05-22	closed	\N	\N	655	345	normal	19/05 +2000 (3)
709	35	31	2026-05-19	2026-05-22	closed	\N	\N	655	345	normal	19/05 +2000 (1)
748	132	31	2026-05-22	2026-05-22	closed	\N	\N	719	345	normal	\N
749	133	31	2026-05-22	2026-05-22	closed	\N	\N	719	345	normal	\N
750	134	31	2026-05-22	2026-05-22	closed	\N	\N	719	345	normal	\N
751	135	31	2026-05-22	2026-05-22	closed	\N	\N	719	345	normal	\N
721	10	31	2026-05-19	2026-05-25	closed	\N	\N	655	345	normal	19/05 -2000 (6)
752	10	31	2026-05-25	\N	active	\N	\N	721	345	normal	19/05 -2000 (6)
759	106	75	2026-05-26	\N	active	\N	\N	666	457	normal	\N
730	39	31	2026-05-19	2026-05-26	closed	\N	\N	726	345	normal	19/05 +2500 (5)
711	40	31	2026-05-19	2026-05-26	closed	\N	\N	655	345	normal	19/05 +2500 (1)
710	33	31	2026-05-19	2026-05-26	closed	\N	\N	655	345	normal	19/05 +2000 (2)
727	34	31	2026-05-19	2026-05-26	closed	\N	\N	655	345	normal	19/05 +2000 (6)
774	39	31	2026-05-28	2026-05-29	closed	\N	\N	724	345	normal	28/05 +2000
718	9	31	2026-05-19	2026-05-29	closed	\N	\N	655	345	normal	19/05 -2000 (3)
720	11	31	2026-05-19	2026-05-29	closed	\N	\N	655	345	normal	19/05 -2000 (5)
766	34	31	2026-05-26	\N	active	\N	\N	710	345	normal	26/05 -3000 (1)
767	8	31	2026-05-26	\N	active	\N	\N	710	345	normal	26/05 -3000 (2)
768	13	31	2026-05-26	\N	active	\N	\N	710	345	normal	26/05 -3000 (3)
769	5	31	2026-05-26	\N	active	\N	\N	710	345	normal	26/05 -3000 (4)
740	25	75	2026-05-21	2026-05-28	closed	\N	\N	567	457	premium	21/05 +1600 (2)
725	14	31	2026-05-19	2026-05-29	closed	\N	\N	655	345	normal	19/05 -2000 (8)
775	33	31	2026-05-28	\N	active	\N	\N	724	345	normal	28/05 -2000
760	104	75	2026-05-26	2026-05-28	closed	\N	\N	666	457	premium	\N
761	107	75	2026-05-26	2026-05-28	closed	\N	\N	666	457	premium	\N
762	1	75	2026-05-26	2026-05-28	closed	\N	\N	666	457	premium	\N
776	25	75	2026-05-28	\N	active	\N	\N	664	391	normal	28/05 +1600 (1)
777	12	75	2026-05-28	\N	active	\N	\N	664	391	normal	28/05 +1600 (2)
778	104	75	2026-05-28	\N	active	\N	\N	664	391	normal	28/05 -1600 (1)
770	102	75	2026-05-27	2026-05-28	closed	\N	\N	735	457	normal	27/05 +790
763	18	31	2026-05-26	2026-05-29	closed	\N	\N	710	345	normal	26/05 +3000 (1)
764	19	31	2026-05-26	2026-05-29	closed	\N	\N	710	345	normal	26/05 +3000 (2)
765	20	31	2026-05-26	2026-05-29	closed	\N	\N	710	345	normal	26/05 +3000 (3)
753	16	31	2026-05-25	2026-05-29	closed	\N	\N	721	345	normal	19/05 -2000 (6)
779	105	75	2026-05-28	\N	active	\N	\N	664	391	normal	28/05 -1600 (2)
780	108	75	2026-05-28	\N	active	\N	\N	664	391	normal	28/05 -1600 (3)
781	109	75	2026-05-28	\N	active	\N	\N	664	391	normal	28/05 -1600 (4)
782	1	75	2026-05-28	\N	active	\N	\N	664	391	normal	28/05 +1600 (3)
783	21	75	2026-05-28	\N	active	\N	\N	664	391	normal	28/05 +1600 (4)
784	101	75	2026-05-28	\N	active	\N	\N	664	391	normal	28/05 -1600 (5)
785	102	75	2026-05-28	\N	active	\N	\N	770	457	normal	27/05 +790
786	107	75	2026-05-28	\N	active	\N	\N	770	457	normal	27/05 +790
787	110	75	2026-05-28	\N	active	\N	\N	756	457	normal	25/05 +790
788	103	75	2026-05-28	\N	active	\N	\N	756	457	normal	25/05 +790
789	18	31	2026-05-29	2026-05-29	closed	\N	\N	765	345	normal	29/05 +3000 (1)
790	19	31	2026-05-29	2026-05-29	closed	\N	\N	765	345	normal	29/05 +3000 (2)
791	81	31	2026-05-29	\N	active	\N	\N	765	345	normal	29/05 -3000
736	2	75	2026-05-21	2026-05-29	closed	\N	\N	567	457	normal	21/05 -2000
712	37	31	2026-05-19	2026-05-29	closed	\N	\N	655	345	normal	19/05 -2000 (1)
713	31	31	2026-05-19	2026-05-29	closed	\N	\N	655	345	normal	19/05 -2000 (2)
792	2	31	2026-05-29	2026-05-29	closed	\N	\N	725	345	normal	29/05 +2000 (1)
793	39	31	2026-05-29	\N	active	\N	\N	725	345	normal	29/05 +2000 (2)
794	37	31	2026-05-29	\N	active	\N	\N	725	345	normal	29/05 +2000 (3)
795	82	31	2026-05-29	\N	active	\N	\N	725	345	normal	29/05 -2000 (1)
796	83	31	2026-05-29	\N	active	\N	\N	725	345	normal	29/05 -2000 (2)
797	84	31	2026-05-29	\N	active	\N	\N	725	345	normal	29/05 -2000 (3)
798	85	31	2026-05-29	\N	active	\N	\N	725	345	normal	29/05 -2000 (4)
\.


--
-- TOC entry 4262 (class 0 OID 16565)
-- Dependencies: 230
-- Data for Name: ddt; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ddt (id, numero, data, cliente_id, cliente_nome, cliente_indirizzo, cliente_citta, cliente_cap, cliente_provincia, cliente_piva, cliente_codice_fiscale, cliente_paese, company_id, mittente_ragione_sociale, mittente_indirizzo, mittente_cap, mittente_citta, mittente_provincia, mittente_partita_iva, mittente_codice_fiscale, mittente_telefono, mittente_email, mittente_logo_path, totale_colli, peso_totale, note, ddt_stato, fatture_in_cloud_id, fatture_in_cloud_numero, created_at, updated_at, fcloud_ddt_id, fcloud_ddt_numero, fcloud_stato) FROM stdin;
1	14	2025-12-09	58	LA VERACE Società Cooperativa		Goro	44020	Ferrara	01877390383		Italia	1017299	Ecotapes Soc. Agr. Srl	Via Canal di Valle 5c	30015	Chioggia	VE	04621060278	04621060278	\N	ecotapes.2020@gmail.com	\N	3	65000.00	ottimi animali 	inviato	489202683	/ddt	2025-12-09 13:39:57.116939	2026-03-14 10:06:23.394	c118678d-1f01-49e2-87ed-ce5ea08b8a9f	1	inviato
13	22	2026-05-22	138	Soc Coop Pescatori Rosolina		Rosolina	45010	RO	00750250292	00750250292	Italia	1052922	Delta Futuro Soc. Agr. Srl	Via Emilia 47	44020	Goro	FE	02057710382	02057710382	+39 3484105353	deltafuturo.goro@gmail.com	\N	5	40500.00	\N	locale	\N	\N	2026-05-22 12:11:57.323731	\N	\N	\N	\N
6	15	2026-03-25	125	SOCIETA' AGRICOLA TIRRENA		PORTO VIRO	45014	ROVIGO	00305250292	00305250292	Italia	1052922	Delta Futuro Soc. Agr. Srl	Via Emilia 47	44020	Goro	FE	02057710382	02057710382	+39 3484105353	deltafuturo.goro@gmail.com	\N	2	26000.00	\N	inviato	513998606	15	2026-03-28 06:16:15.687708	2026-03-28 06:16:34.806	b1cdb8a0-b16e-4f5f-9c6d-db0e7ebc21ad	2	inviato
7	16	2026-04-07	121	Coop. La Vela		Goro	44020	FE	01227850383	01227850383	Italia	1052922	Delta Futuro Soc. Agr. Srl	Via Emilia 47	44020	Goro	FE	02057710382	02057710382	+39 3484105353	deltafuturo.goro@gmail.com	\N	3	50200.00	\N	locale	\N	\N	2026-04-22 17:23:15.313947	\N	\N	\N	\N
8	17	2026-04-24	110	Coop. Adriatica Gorino		Gorino FE, Italia	44020	FE	00423670389	82002630380	Italia	1052922	Delta Futuro Soc. Agr. Srl	Via Emilia 47	44020	Goro	FE	02057710382	02057710382	+39 3484105353	deltafuturo.goro@gmail.com	\N	1	12500.00	\N	locale	\N	\N	2026-04-24 07:17:30.770233	\N	\N	\N	\N
9	18	2026-05-07	103	VENUS - SOC. COOP.		GORO	44020	FE	01252330384		Italia	1052922	Delta Futuro Soc. Agr. Srl	Via Emilia 47	44020	Goro	FE	02057710382	02057710382	+39 3484105353	deltafuturo.goro@gmail.com	\N	1	4500.00	\N	locale	\N	\N	2026-05-07 11:51:07.413563	\N	\N	\N	\N
10	19	2026-05-08	138	Soc Coop Pescatori Rosolina		Rosolina	45010	RO	00750250292	00750250292	Italia	1052922	Delta Futuro Soc. Agr. Srl	Via Emilia 47	44020	Goro	FE	02057710382	02057710382	+39 3484105353	deltafuturo.goro@gmail.com	\N	2	29000.00	\N	locale	\N	\N	2026-05-08 07:48:09.196432	\N	\N	\N	\N
11	20	2026-05-19	26	Coop. Adriatica Gorino		Gorino FE, Italia	44020	FE	00423670389		Italia	1052922	Delta Futuro Soc. Agr. Srl	Via Emilia 47	44020	Goro	FE	02057710382	02057710382	+39 3484105353	deltafuturo.goro@gmail.com	\N	1	22640.00	150.000 t4	locale	\N	\N	2026-05-20 11:39:48.030417	\N	\N	\N	\N
12	21	2026-05-19	103	VENUS - SOC. COOP.		GORO	44020	FE	01252330384		Italia	1052922	Delta Futuro Soc. Agr. Srl	Via Emilia 47	44020	Goro	FE	02057710382	02057710382	+39 3484105353	deltafuturo.goro@gmail.com	\N	1	4300.00	t3 100.000	locale	\N	\N	2026-05-20 13:24:58.825354	\N	\N	\N	\N
\.


--
-- TOC entry 4264 (class 0 OID 16579)
-- Dependencies: 232
-- Data for Name: ddt_righe; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ddt_righe (id, ddt_id, descrizione, quantita, unita_misura, prezzo_unitario, report_dettaglio_id, advanced_sale_id, sale_bag_id, basket_id, size_code, flupsy_name, created_at) FROM stdin;
1	1	Sacco #1 - Cestelli: 1 | 540.923 animali | 22000 kg | 24.587 anim/kg	540923.00	NR	0.00	\N	4	1	81	TP-3000	\N	2025-12-09 13:39:57.349418
2	1	Sacco #2 - Cestelli: 4 | 535.806 animali | 21000 kg | 25.515 anim/kg	535806.00	NR	0.00	\N	4	2	84	TP-3000	\N	2025-12-09 13:39:57.581699
3	1	Sacco #3 - Cestelli: 8 | 541.024 animali | 22000 kg | 24.592 anim/kg	541024.00	NR	0.00	\N	4	3	88	TP-3000	\N	2025-12-09 13:39:57.811062
4	1	SUBTOTALE TP-3000	1617753.00	NR	0.00	\N	4	\N	\N	TP-3000	\N	2025-12-09 13:39:58.041637
18	6	Sacco #1 - Cestelli: 20 | 58.812 animali | 10.00 kg | 5881 anim/kg	58812.00	NR	0.00	\N	18	41	20	TP-5500	\N	2026-03-28 06:16:15.713001
19	6	Sacco #2 - Cestelli: 20 | 94.099 animali | 16.00 kg | 5881 anim/kg	94099.00	NR	0.00	\N	18	42	20	TP-5500	\N	2026-03-28 06:16:15.739954
20	6	SUBTOTALE TP-5500	152911.00	NR	0.00	\N	18	\N	\N	TP-5500	\N	2026-03-28 06:16:15.762366
21	7	Sacco #1 - Cestelli: 2 | 325.321 animali | 16.50 kg | 19.716 anim/kg	325321.00	NR	0.00	\N	19	46	22	TP-3500	\N	2026-04-22 17:23:15.536199
22	7	SUBTOTALE TP-3500	325321.00	NR	0.00	\N	19	\N	\N	TP-3500	\N	2026-04-22 17:23:15.760224
23	7	Sacco #2 - Cestelli: 3 | 368.109 animali | 17.10 kg | 21.527 anim/kg	368109.00	NR	0.00	\N	19	47	23	TP-3000	\N	2026-04-22 17:23:15.97893
24	7	Sacco #3 - Cestelli: 11 | 348.991 animali | 16.60 kg | 21.024 anim/kg	348991.00	NR	0.00	\N	19	48	31	TP-3000	\N	2026-04-22 17:23:16.19813
25	7	SUBTOTALE TP-3000	717100.00	NR	0.00	\N	19	\N	\N	TP-3000	\N	2026-04-22 17:23:16.417815
26	8	Sacco #1 - Cestelli: 19 | 21.380 animali | 12.50 kg | 1710 anim/kg	21380.00	NR	0.00	\N	24	50	129	TP-9000	\N	2026-04-24 07:17:30.807951
27	8	SUBTOTALE TP-9000	21380.00	NR	0.00	\N	24	\N	\N	TP-9000	\N	2026-04-24 07:17:30.83807
28	9	Sacco #1 - Cestelli: 9 | 108.000 animali | 4.50 kg | 24.000 anim/kg	108000.00	NR	0.00	\N	42	79	89	TP-3000	\N	2026-05-07 11:51:07.439766
29	9	SUBTOTALE TP-3000	108000.00	NR	0.00	\N	42	\N	\N	TP-3000	\N	2026-05-07 11:51:07.466141
30	10	Sacco #1 - Cestelli: 2 | 1.145.114 animali | 14.50 kg | 78.973 anim/kg	1145114.00	NR	0.00	\N	43	80	82	TP-2000	\N	2026-05-08 07:48:09.225238
31	10	Sacco #2 - Cestelli: 10 | 1.145.114 animali | 14.50 kg | 78.973 anim/kg	1145114.00	NR	0.00	\N	43	81	90	TP-2000	\N	2026-05-08 07:48:09.250476
32	10	SUBTOTALE TP-2000	2290228.00	NR	0.00	\N	43	\N	\N	TP-2000	\N	2026-05-08 07:48:09.275651
33	11	Sacco #1 - Cestelli: 20 | 150.000 animali | 22.64 kg | 6625 anim/kg	150000.00	NR	0.00	\N	44	82	20	TP-5000	\N	2026-05-20 11:39:48.055515
34	11	SUBTOTALE TP-5000	150000.00	NR	0.00	\N	44	\N	\N	TP-5000	\N	2026-05-20 11:39:48.082181
35	12	Sacco #1 - Cestelli: 20 | 99.260 animali | 4.30 kg | 23.084 anim/kg	99260.00	NR	0.00	\N	45	84	150	TP-3000	\N	2026-05-20 13:24:58.851356
36	12	SUBTOTALE TP-3000	99260.00	NR	0.00	\N	45	\N	\N	TP-3000	\N	2026-05-20 13:24:58.873799
37	13	Sacco #1 - Cestelli: 2 | 714.011 animali | 9.70 kg | 73.609 anim/kg	714011.00	NR	0.00	\N	46	85	132	TP-2000	\N	2026-05-22 12:11:57.348318
38	13	Sacco #5 - Cestelli: 5 | 561.322 animali | 6.50 kg | 86.357 anim/kg	561322.00	NR	0.00	\N	46	89	135	TP-2000	\N	2026-05-22 12:11:57.374327
39	13	SUBTOTALE TP-2000	1275333.00	NR	0.00	\N	46	\N	\N	TP-2000	\N	2026-05-22 12:11:57.396468
40	13	Sacco #2 - Cestelli: 4 | 598.753 animali | 9.10 kg | 65.797 anim/kg	598753.00	NR	0.00	\N	46	86	134	TP-2500	\N	2026-05-22 12:11:57.419719
41	13	Sacco #3 - Cestelli: 1 | 454.824 animali | 6.50 kg | 69.973 anim/kg	454824.00	NR	0.00	\N	46	87	131	TP-2500	\N	2026-05-22 12:11:57.442496
42	13	Sacco #4 - Cestelli: 3 | 566.613 animali | 8.70 kg | 65.128 anim/kg	566613.00	NR	0.00	\N	46	88	133	TP-2500	\N	2026-05-22 12:11:57.465163
43	13	SUBTOTALE TP-2500	1620190.00	NR	0.00	\N	46	\N	\N	TP-2500	\N	2026-05-22 12:11:57.487736
\.


--
-- TOC entry 4266 (class 0 OID 16591)
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
-- TOC entry 4392 (class 0 OID 1794049)
-- Dependencies: 360
-- Data for Name: environmental_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.environmental_log (id, date, recorded_at, user_id, username, sst, wave_height, wave_period, chlorophyll, salinity, vallona_temp_acqua, vallona_ph, vallona_salinita, vallona_ossigeno_sat, vallona_torbidita, vallona_clorofilla, vallona_timestamp, gorino2_temp_acqua, gorino2_ph, gorino2_salinita, gorino2_ossigeno_sat, gorino2_torbidita, gorino2_clorofilla, gorino2_timestamp, temp_aria, precipitazione, vento_velocita, vento_raffica, condizione_meteo) FROM stdin;
12	2020-01-10	2026-03-28 08:17:32.394898	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2.9	0	10.8	23.8	3
13	2020-01-11	2026-03-28 08:17:32.831403	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6	0	21.6	37.4	3
14	2020-01-12	2026-03-28 08:17:33.268497	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.1	0	14.2	33.1	0
15	2020-01-13	2026-03-28 08:17:33.704639	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.1	0	9.2	21.2	3
16	2020-01-14	2026-03-28 08:17:34.139865	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.4	0	8.8	18	3
17	2020-01-15	2026-03-28 08:17:34.577481	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.9	0	8.3	15.5	3
18	2020-01-16	2026-03-28 08:17:35.013676	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4	0	11.7	20.5	3
19	2020-01-17	2026-03-28 08:17:35.448875	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.9	0	14.2	24.5	3
20	2020-01-18	2026-03-28 08:17:35.885276	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8	17.7	24.1	43.6	61
21	2020-01-19	2026-03-28 08:17:36.321519	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.9	0.1	27.3	48.6	51
22	2020-01-20	2026-03-28 08:17:36.758219	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.9	0	31.8	56.5	3
23	2020-01-21	2026-03-28 08:17:37.196298	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.7	0	24.1	42.8	3
24	2020-01-22	2026-03-28 08:17:37.63182	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.8	0	9.9	20.5	3
25	2020-01-23	2026-03-28 08:17:38.068513	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.2	0	14.1	27.4	1
26	2020-01-24	2026-03-28 08:17:38.505262	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.1	0.3	8.3	16.2	51
27	2020-01-25	2026-03-28 08:17:40.056082	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.2	1.4	15.8	27.7	51
28	2020-01-26	2026-03-28 08:17:40.504997	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7	3.3	8	18	55
29	2020-01-27	2026-03-28 08:17:40.944227	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.2	0	9	20.5	3
30	2020-01-28	2026-03-28 08:17:41.382759	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10	0	31.5	54.7	3
31	2020-01-29	2026-03-28 08:17:41.820587	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.3	0	21.3	50	1
1	2026-03-27	2026-03-27 20:33:02.717	9	scheduler	11.6	0.22	2.85	4.13	34.02	10.73	8.25	20.47	90.44	\N	8.81	2026-03-27T13:00:00	11.21	8.2	17.13	92.6	\N	\N	2026-03-27T17:00:00	8	0	7	13.7	1
32	2020-01-30	2026-03-28 08:17:42.259905	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.8	0	17	29.2	3
33	2020-01-31	2026-03-28 08:17:42.697541	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.9	0	9.3	16.9	3
34	2020-02-01	2026-03-28 08:17:43.135678	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9	0.1	9.5	18.7	51
35	2020-02-02	2026-03-28 08:17:43.575106	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.4	0.2	9.5	19.8	51
36	2020-02-03	2026-03-28 08:17:44.013888	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.3	0	10.5	22.3	3
37	2020-02-04	2026-03-28 08:17:44.452447	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.5	3	30.9	56.5	61
38	2020-02-05	2026-03-28 08:17:44.891201	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.8	0	37.5	67	1
39	2020-02-06	2026-03-28 08:17:45.328659	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.6	0	28.1	51.5	1
40	2020-02-07	2026-03-28 08:17:45.767064	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.7	0	11.2	21.2	1
41	2020-02-08	2026-03-28 08:17:46.204654	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.4	0	11.6	14.4	3
42	2020-02-09	2026-03-28 08:17:46.644276	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.6	0	12	20.2	3
43	2020-02-10	2026-03-28 08:17:47.083177	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.2	0	21.8	38.5	3
44	2020-02-11	2026-03-28 08:17:47.523074	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.4	0	17	32.8	3
45	2020-02-12	2026-03-28 08:17:47.962263	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.3	0	16.4	31	2
85	2020-03-23	2026-03-28 08:18:05.529242	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.1	0	41.7	77.8	3
3	2020-01-01	2026-03-28 08:17:28.447934	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.5	0	11.3	21.6	3
4	2020-01-02	2026-03-28 08:17:28.890408	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6	0	14.1	28.8	3
5	2020-01-03	2026-03-28 08:17:29.327242	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.1	0	9.9	20.5	3
6	2020-01-04	2026-03-28 08:17:29.763256	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.1	0	10.8	21.6	3
7	2020-01-05	2026-03-28 08:17:30.200494	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.7	0	21.1	37.1	1
8	2020-01-06	2026-03-28 08:17:30.638628	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.8	0	16.2	29.2	3
9	2020-01-07	2026-03-28 08:17:31.075449	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2.9	0.3	12.6	24.5	51
10	2020-01-08	2026-03-28 08:17:31.521799	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3	0	14.5	27.7	3
11	2020-01-09	2026-03-28 08:17:31.958256	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.5	0	11.4	19.1	3
46	2020-02-13	2026-03-28 08:17:48.400901	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.5	0.7	17.9	32	53
47	2020-02-14	2026-03-28 08:17:48.839364	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.4	6.6	19.6	56.9	63
48	2020-02-15	2026-03-28 08:17:49.278081	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.8	0	15.7	27.4	3
49	2020-02-16	2026-03-28 08:17:49.716788	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.4	0	7.6	18.4	3
50	2020-02-17	2026-03-28 08:17:50.155864	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.9	0	14.7	25.6	3
51	2020-02-18	2026-03-28 08:17:50.595308	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.2	0.5	9	20.2	51
52	2020-02-19	2026-03-28 08:17:51.034854	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.9	0	13.6	27	3
53	2020-02-20	2026-03-28 08:17:51.47915	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9	0	17.1	34.2	0
54	2020-02-21	2026-03-28 08:17:51.922182	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8	0	12	24.1	2
55	2020-02-22	2026-03-28 08:17:52.361065	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.3	0	16.9	36	3
56	2020-02-23	2026-03-28 08:17:52.799624	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9	0	14.8	28.1	3
57	2020-02-24	2026-03-28 08:17:53.237952	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.1	0	15.1	26.6	3
58	2020-02-25	2026-03-28 08:17:53.676906	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.9	0	20.2	36.4	3
59	2020-02-26	2026-03-28 08:17:54.115604	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.4	0.1	35.3	67.3	51
60	2020-02-27	2026-03-28 08:17:54.554095	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.2	0.7	26.7	51.8	51
61	2020-02-28	2026-03-28 08:17:54.992373	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.5	0.4	25.1	55.1	51
62	2020-02-29	2026-03-28 08:17:55.430712	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.1	0	12.4	23	3
63	2020-03-01	2026-03-28 08:17:55.869044	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.1	13.6	25.6	52.2	61
64	2020-03-02	2026-03-28 08:17:56.308149	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.9	4.2	37.7	66.6	55
65	2020-03-03	2026-03-28 08:17:56.751382	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.2	2.8	31.4	55.1	53
66	2020-03-04	2026-03-28 08:17:57.189784	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.7	9.2	30.8	55.8	63
67	2020-03-05	2026-03-28 08:17:57.628474	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.3	2.8	20.2	34.2	53
68	2020-03-06	2026-03-28 08:17:58.067008	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.8	6.7	37.4	69.8	61
69	2020-03-07	2026-03-28 08:17:58.505564	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.8	3.2	23.9	42.8	53
70	2020-03-08	2026-03-28 08:17:58.944763	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.6	0	21.7	38.9	2
71	2020-03-09	2026-03-28 08:17:59.383346	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.2	0	10.5	22.3	3
72	2020-03-10	2026-03-28 08:17:59.821576	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.5	0	11.9	22.3	3
73	2020-03-11	2026-03-28 08:18:00.260676	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.2	0	12.3	28.4	1
74	2020-03-12	2026-03-28 08:18:00.700051	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.2	0	11.2	21.2	3
75	2020-03-13	2026-03-28 08:18:01.138378	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.2	0.2	11.9	22.3	51
76	2020-03-14	2026-03-28 08:18:01.577148	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.5	0.8	32.3	57.6	53
77	2020-03-15	2026-03-28 08:18:02.01641	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.2	0	26.8	47.5	3
78	2020-03-16	2026-03-28 08:18:02.45705	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.6	0	10.7	21.6	0
79	2020-03-17	2026-03-28 08:18:02.896828	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.5	0	9.5	22	2
80	2020-03-18	2026-03-28 08:18:03.336483	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.2	0.1	11.9	27.4	51
81	2020-03-19	2026-03-28 08:18:03.775032	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12	0	10.8	24.5	0
82	2020-03-20	2026-03-28 08:18:04.213605	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.5	0	10.9	26.6	3
83	2020-03-21	2026-03-28 08:18:04.652048	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.5	0.1	18.4	32.8	51
84	2020-03-22	2026-03-28 08:18:05.090669	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.4	0	33.2	61.6	3
86	2020-03-24	2026-03-28 08:18:05.967876	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7	0	41.5	75.2	3
87	2020-03-25	2026-03-28 08:18:06.406352	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.5	0.4	41.9	77	51
88	2020-03-26	2026-03-28 08:18:06.84559	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7	3.6	40.7	76	53
89	2020-03-27	2026-03-28 08:18:07.285612	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.3	0.3	31.3	60.5	51
90	2020-03-28	2026-03-28 08:18:07.72409	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.6	0	20.4	35.6	3
91	2020-03-29	2026-03-28 08:18:08.163064	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.6	0	9.9	23.4	2
92	2020-03-30	2026-03-28 08:18:08.601975	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.4	0.1	39.1	72	51
93	2020-03-31	2026-03-28 08:18:10.394183	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.6	2.7	36.6	68.8	55
94	2020-04-01	2026-03-28 08:18:10.833498	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.1	0	27.2	49.3	0
95	2020-04-02	2026-03-28 08:18:11.271897	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.2	0	11.2	24.1	1
96	2020-04-03	2026-03-28 08:18:11.71243	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.3	0	9.5	20.5	0
97	2020-04-04	2026-03-28 08:18:12.151585	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.6	0	20.7	35.6	1
98	2020-04-05	2026-03-28 08:18:12.59028	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.7	0	28.1	53.3	0
99	2020-04-06	2026-03-28 08:18:13.027668	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14	0	23.4	42.5	0
100	2020-04-07	2026-03-28 08:18:13.467648	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.7	0	18.6	32.8	0
101	2020-04-08	2026-03-28 08:18:13.907309	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.4	0	17.8	35.3	0
102	2020-04-09	2026-03-28 08:18:14.348669	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.4	0	10.8	23	0
103	2020-04-10	2026-03-28 08:18:14.78717	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.5	0	11	21.2	0
104	2020-04-11	2026-03-28 08:18:15.225398	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.8	0	12.2	23	0
105	2020-04-12	2026-03-28 08:18:15.663984	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.1	0	15.6	29.9	3
106	2020-04-13	2026-03-28 08:18:16.102512	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.6	0	24.9	49.7	3
107	2020-04-14	2026-03-28 08:18:16.541279	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.2	0.5	39.8	75.6	51
108	2020-04-15	2026-03-28 08:18:16.980519	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.7	0	20.9	38.5	3
109	2020-04-16	2026-03-28 08:18:17.419107	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.2	0	14.8	30.6	3
110	2020-04-17	2026-03-28 08:18:17.858097	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.3	0	13	29.5	3
111	2020-04-18	2026-03-28 08:18:18.296655	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14	0	12.6	28.1	3
112	2020-04-19	2026-03-28 08:18:18.737444	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15	0	12.4	27.7	3
113	2020-04-20	2026-03-28 08:18:19.176137	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.9	5.5	26.9	51.8	53
114	2020-04-21	2026-03-28 08:18:19.614839	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.8	1.3	27.8	52.6	53
115	2020-04-22	2026-03-28 08:18:20.053016	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.3	0	31.8	57.6	1
116	2020-04-23	2026-03-28 08:18:20.492226	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.4	0	17.5	34.2	0
117	2020-04-24	2026-03-28 08:18:20.929714	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.2	0	16.6	33.5	3
118	2020-04-25	2026-03-28 08:18:21.368177	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.3	0	21.6	37.4	3
119	2020-04-26	2026-03-28 08:18:21.806618	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.4	0.1	17.4	37.1	51
120	2020-04-27	2026-03-28 08:18:22.245163	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.7	0	13.7	26.6	1
121	2020-04-28	2026-03-28 08:18:22.683494	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.9	0.4	17.1	37.1	51
122	2020-04-29	2026-03-28 08:18:23.12233	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.8	3.8	15.3	39.2	61
123	2020-04-30	2026-03-28 08:18:23.558703	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.5	0.3	17.8	39.6	51
124	2020-05-01	2026-03-28 08:18:23.997513	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.4	1.1	24.1	44.3	51
125	2020-05-02	2026-03-28 08:18:24.436421	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.6	0	14.5	33.5	3
126	2020-05-03	2026-03-28 08:18:24.875155	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.1	0.8	25.6	54	51
127	2020-05-04	2026-03-28 08:18:25.314623	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.8	0	16.3	34.2	2
128	2020-05-05	2026-03-28 08:18:25.753154	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17	0	18.8	38.5	3
129	2020-05-06	2026-03-28 08:18:26.191261	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.6	1.3	24.9	46.8	53
130	2020-05-07	2026-03-28 08:18:26.629602	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.9	0	15.2	32.4	1
131	2020-05-08	2026-03-28 08:18:27.068151	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17	0	15	32	3
132	2020-05-09	2026-03-28 08:18:27.505701	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18	0.1	17.2	33.5	51
133	2020-05-10	2026-03-28 08:18:27.944382	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.5	0	19.1	39.2	3
134	2020-05-11	2026-03-28 08:18:28.382833	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.2	5.4	26.8	50.8	61
135	2020-05-12	2026-03-28 08:18:28.822014	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.8	0.9	30.4	58.3	51
136	2020-05-13	2026-03-28 08:18:29.261367	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.3	0.3	15.8	37.1	51
137	2020-05-14	2026-03-28 08:18:29.699723	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.5	2.4	21.2	38.2	61
138	2020-05-15	2026-03-28 08:18:30.138324	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.9	1.7	22.5	46.1	53
139	2020-05-16	2026-03-28 08:18:30.577043	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.9	0.9	21.2	39.6	53
140	2020-05-17	2026-03-28 08:18:31.015558	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.1	0.1	20.2	36.7	51
141	2020-05-18	2026-03-28 08:18:31.452702	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.9	0.4	16.8	31.7	51
142	2020-05-19	2026-03-28 08:18:31.891823	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.5	8.2	32.2	65.9	61
143	2020-05-20	2026-03-28 08:18:32.330523	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.9	3.6	29.2	52.2	61
144	2020-05-21	2026-03-28 08:18:32.768951	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.5	0	23	40.7	1
145	2020-05-22	2026-03-28 08:18:33.208114	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.3	0	14.4	31.3	3
146	2020-05-23	2026-03-28 08:18:33.646559	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.2	0	15.8	29.9	3
147	2020-05-24	2026-03-28 08:18:34.085282	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.3	1.6	26.8	54	61
148	2020-05-25	2026-03-28 08:18:34.524782	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.2	0	16.1	32.4	3
149	2020-05-26	2026-03-28 08:18:34.971319	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.3	0	28.1	50.4	2
150	2020-05-27	2026-03-28 08:18:35.410088	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.8	0	18.8	34.2	1
151	2020-05-28	2026-03-28 08:18:35.848506	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.9	1.3	18.6	37.8	55
152	2020-05-29	2026-03-28 08:18:36.287627	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17	2.2	22.2	42.1	53
153	2020-05-30	2026-03-28 08:18:36.726127	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18	0	14.6	31	3
154	2020-05-31	2026-03-28 08:18:37.164618	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.9	0	13.8	24.8	3
155	2020-06-01	2026-03-28 08:18:37.603133	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.4	0	15.9	31.7	1
156	2020-06-02	2026-03-28 08:18:38.040774	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.3	0	19.5	39.2	3
157	2020-06-03	2026-03-28 08:18:38.479656	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.7	0	16.3	32.8	3
158	2020-06-04	2026-03-28 08:18:38.918076	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.1	15.1	28.7	59.4	61
159	2020-06-05	2026-03-28 08:18:39.357583	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.7	9.8	29.4	52.6	63
160	2020-06-06	2026-03-28 08:18:39.796289	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.3	0	17.7	37.4	1
161	2020-06-07	2026-03-28 08:18:40.234108	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.8	0.1	19.9	47.2	51
162	2020-06-08	2026-03-28 08:18:40.6727	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.4	21.2	17.7	40	63
163	2020-06-09	2026-03-28 08:18:41.111695	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.7	12.2	15.9	32.8	63
164	2020-06-10	2026-03-28 08:18:41.551367	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.2	6.2	12.4	31.3	63
165	2020-06-11	2026-03-28 08:18:41.989212	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18	3.6	10.1	27	61
166	2020-06-12	2026-03-28 08:18:42.427518	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.4	0.2	15.5	32.8	51
167	2020-06-13	2026-03-28 08:18:42.865732	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.1	0.4	20	40	51
168	2020-06-14	2026-03-28 08:18:43.314257	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.1	7.3	18.7	34.6	61
169	2020-06-15	2026-03-28 08:18:43.751743	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.6	5.4	7.6	16.9	61
170	2020-06-16	2026-03-28 08:18:44.191033	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21	0.1	9.8	22	51
171	2020-06-17	2026-03-28 08:18:44.629074	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.8	0.2	15.5	31.3	51
172	2020-06-18	2026-03-28 08:18:45.06841	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.7	0	18	36.7	1
173	2020-06-19	2026-03-28 08:18:45.505687	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.9	1.7	14.2	31	55
174	2020-06-20	2026-03-28 08:18:45.944591	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.4	1.1	20.4	37.8	53
175	2020-06-21	2026-03-28 08:18:46.383332	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22	0	14.8	33.5	3
176	2020-06-22	2026-03-28 08:18:46.82199	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24	0	10.2	23	3
177	2020-06-23	2026-03-28 08:18:47.261404	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.5	0	10.7	21.6	1
178	2020-06-24	2026-03-28 08:18:47.700434	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.7	1.1	23.7	44.6	53
179	2020-06-25	2026-03-28 08:18:48.139107	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.7	3.7	23.2	45	61
180	2020-06-26	2026-03-28 08:18:48.57766	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23	0	17.9	34.9	3
181	2020-06-27	2026-03-28 08:18:49.016138	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.8	0	12.2	31.3	1
182	2020-06-28	2026-03-28 08:18:49.454524	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25	0	12	27.7	1
183	2020-06-29	2026-03-28 08:18:51.252921	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.7	0.3	24	43.2	51
184	2020-06-30	2026-03-28 08:18:51.691447	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26	0	18.5	38.2	3
185	2020-07-01	2026-03-28 08:18:52.130298	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.1	0	10.7	25.6	3
186	2020-07-02	2026-03-28 08:18:52.568765	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.2	0.2	12.5	29.2	51
187	2020-07-03	2026-03-28 08:18:53.007289	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.3	7.7	21.5	41	61
188	2020-07-04	2026-03-28 08:18:53.445952	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.4	0.5	24.7	47.2	51
189	2020-07-05	2026-03-28 08:18:53.884572	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25	0	12.7	27.7	0
190	2020-07-06	2026-03-28 08:18:54.323897	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.6	0	8.6	22	3
191	2020-07-07	2026-03-28 08:18:54.762396	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22	2.2	57	109.4	61
192	2020-07-08	2026-03-28 08:18:55.201023	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.1	0	11.5	25.9	3
193	2020-07-09	2026-03-28 08:18:55.639932	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.6	0	10.7	23.4	3
194	2020-07-10	2026-03-28 08:18:56.079078	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.6	0	13.1	29.9	3
195	2020-07-11	2026-03-28 08:18:56.525325	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.3	7	38.4	71.6	61
196	2020-07-12	2026-03-28 08:18:56.969564	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.3	0	27.1	54	2
197	2020-07-13	2026-03-28 08:18:57.40861	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.6	0	24.1	42.5	3
198	2020-07-14	2026-03-28 08:18:57.847305	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.7	0	21.1	42.8	3
199	2020-07-15	2026-03-28 08:18:58.285662	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23	0	17	31.3	3
200	2020-07-16	2026-03-28 08:18:58.724196	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.3	0.7	12.4	30.6	51
201	2020-07-17	2026-03-28 08:18:59.161971	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.1	14.6	16.6	37.4	63
202	2020-07-18	2026-03-28 08:18:59.600332	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.9	0	22.2	40.7	3
203	2020-07-19	2026-03-28 08:19:00.038705	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.7	0	13.4	27	1
204	2020-07-20	2026-03-28 08:19:00.478617	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.3	0	17.3	35.3	1
205	2020-07-21	2026-03-28 08:19:00.917244	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25	0	14.1	31.3	1
206	2020-07-22	2026-03-28 08:19:01.354723	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.8	0	13.7	30.6	3
207	2020-07-23	2026-03-28 08:19:01.793246	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.2	8	19.6	36	63
208	2020-07-24	2026-03-28 08:19:02.231744	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.9	4.6	31.6	58.3	63
209	2020-07-25	2026-03-28 08:19:02.670236	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.4	0.8	15.7	32.8	51
210	2020-07-26	2026-03-28 08:19:03.107934	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.8	0	15.6	34.2	3
211	2020-07-27	2026-03-28 08:19:03.546764	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.1	0	10.2	24.5	2
212	2020-07-28	2026-03-28 08:19:03.985948	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.2	0	16.1	34.6	1
213	2020-07-29	2026-03-28 08:19:04.424528	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27	0	11	27.7	1
214	2020-07-30	2026-03-28 08:19:04.862913	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.8	0	15.9	31.7	3
215	2020-07-31	2026-03-28 08:19:05.301608	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.6	0	12.6	31.7	2
216	2020-08-01	2026-03-28 08:19:05.740353	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.7	0	13.4	29.2	3
217	2020-08-02	2026-03-28 08:19:06.17684	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.7	1.4	25.7	49.3	53
218	2020-08-03	2026-03-28 08:19:06.615382	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.4	17.6	26.2	51.8	65
219	2020-08-04	2026-03-28 08:19:07.052987	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.2	16.3	21.3	48.2	63
220	2020-08-05	2026-03-28 08:19:07.49235	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.1	0.1	31	56.9	51
221	2020-08-06	2026-03-28 08:19:07.931063	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.7	0	26.1	49	3
222	2020-08-07	2026-03-28 08:19:08.369979	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.2	0	19.5	37.1	0
223	2020-08-08	2026-03-28 08:19:08.812274	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.4	0	18.5	37.4	0
224	2020-08-09	2026-03-28 08:19:09.250348	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.9	0	10.5	21.2	1
225	2020-08-10	2026-03-28 08:19:09.688939	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.3	0	10.8	26.6	2
226	2020-08-11	2026-03-28 08:19:10.126853	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.8	0	13.9	29.5	3
227	2020-08-12	2026-03-28 08:19:10.56479	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.6	0	13.5	30.2	3
228	2020-08-13	2026-03-28 08:19:11.003706	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.9	0	12.5	27.7	3
229	2020-08-14	2026-03-28 08:19:11.442764	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26	1	17.1	35.6	53
230	2020-08-15	2026-03-28 08:19:11.8809	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.3	1.2	10.2	25.6	55
231	2020-08-16	2026-03-28 08:19:12.319548	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.1	0	12.2	28.8	3
232	2020-08-17	2026-03-28 08:19:12.758074	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.4	7	12.3	52.6	63
233	2020-08-18	2026-03-28 08:19:13.198168	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.3	3.8	9.7	33.8	61
234	2020-08-19	2026-03-28 08:19:13.638143	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.5	0	10.5	25.9	3
235	2020-08-20	2026-03-28 08:19:14.076535	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.2	0	11.8	27	3
236	2020-08-21	2026-03-28 08:19:14.515173	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.7	0	13	29.9	0
237	2020-08-22	2026-03-28 08:19:14.953428	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.3	0	14.8	32.8	0
238	2020-08-23	2026-03-28 08:19:15.392691	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.5	5	19.1	36.7	63
239	2020-08-24	2026-03-28 08:19:15.834828	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.3	1.2	20.6	42.1	55
240	2020-08-25	2026-03-28 08:19:16.27324	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.4	0	23.2	41.8	2
241	2020-08-26	2026-03-28 08:19:16.712284	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.1	0	16.7	33.8	3
242	2020-08-27	2026-03-28 08:19:17.15153	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.5	1.1	13.4	29.5	53
243	2020-08-28	2026-03-28 08:19:17.590049	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.9	0.7	19.1	34.2	51
244	2020-08-29	2026-03-28 08:19:18.029546	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.3	0.1	30	55.1	51
245	2020-08-30	2026-03-28 08:19:18.468016	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.8	2.7	35.2	69.8	61
246	2020-08-31	2026-03-28 08:19:18.906449	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.6	19.3	23	42.5	63
247	2020-09-01	2026-03-28 08:19:19.345036	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.8	5.1	28.3	53.6	61
248	2020-09-02	2026-03-28 08:19:19.783399	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.4	0.4	12.2	27.4	51
249	2020-09-03	2026-03-28 08:19:20.221568	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.9	0	14.1	27.7	2
250	2020-09-04	2026-03-28 08:19:20.660424	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22	0	9.7	22.7	2
251	2020-09-05	2026-03-28 08:19:21.098458	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.2	0	12.8	27.7	0
252	2020-09-06	2026-03-28 08:19:21.537219	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.3	0	12.8	28.1	0
253	2020-09-07	2026-03-28 08:19:21.975939	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.2	4.2	20.8	44.6	61
254	2020-09-08	2026-03-28 08:19:22.443529	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.8	0	15.1	28.8	1
255	2020-09-09	2026-03-28 08:19:22.883174	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23	0	12.3	26.3	1
256	2020-09-10	2026-03-28 08:19:23.322465	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.3	0	10.9	25.9	3
257	2020-09-11	2026-03-28 08:19:23.761771	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24	0	14.6	25.6	3
258	2020-09-12	2026-03-28 08:19:24.201949	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.1	0	16.8	34.2	0
259	2020-09-13	2026-03-28 08:19:24.64226	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.6	0	13.6	30.2	0
260	2020-09-14	2026-03-28 08:19:25.08248	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.9	0	19.1	37.4	0
261	2020-09-15	2026-03-28 08:19:25.522801	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.2	0	16.4	31.7	2
262	2020-09-16	2026-03-28 08:19:25.963086	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.7	0	10.2	24.5	1
263	2020-09-17	2026-03-28 08:19:26.403317	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25	0	25.5	44.6	1
264	2020-09-18	2026-03-28 08:19:26.843723	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.6	0	25.1	44.6	0
265	2020-09-19	2026-03-28 08:19:27.286125	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.6	0	13.4	31.3	3
266	2020-09-20	2026-03-28 08:19:27.727459	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.7	0	10.6	28.4	3
267	2020-09-21	2026-03-28 08:19:28.166632	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.7	6.4	12.3	27.4	63
268	2020-09-22	2026-03-28 08:19:28.607091	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.5	13.8	8	22	63
269	2020-09-23	2026-03-28 08:19:29.047437	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.2	2.4	12.1	31.3	55
270	2020-09-24	2026-03-28 08:19:29.488214	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.1	0.1	22	39.2	51
271	2020-09-25	2026-03-28 08:19:29.928587	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.7	16.3	34.8	71.3	65
272	2020-09-26	2026-03-28 08:19:30.421499	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.3	15.7	40.3	72.7	63
273	2020-09-27	2026-03-28 08:19:32.213127	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15	13.6	28	51.5	63
274	2020-09-28	2026-03-28 08:19:32.653447	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.6	11.8	32.1	60.1	63
275	2020-09-29	2026-03-28 08:19:33.092812	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.4	0	10.2	16.6	3
276	2020-09-30	2026-03-28 08:19:33.533254	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.6	0	11.3	22.7	3
277	2020-10-01	2026-03-28 08:19:33.97368	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.9	0.2	14.5	25.6	51
278	2020-10-02	2026-03-28 08:19:34.413429	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.6	0	29.9	57.2	3
279	2020-10-03	2026-03-28 08:19:34.853684	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.8	6.2	24.9	61.2	63
280	2020-10-04	2026-03-28 08:19:35.292752	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.4	0.5	29.4	54.4	53
281	2020-10-05	2026-03-28 08:19:35.733045	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.8	9.4	23.9	46.1	63
282	2020-10-06	2026-03-28 08:19:36.173391	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.7	0	20	34.9	3
283	2020-10-07	2026-03-28 08:19:36.613935	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.8	2.2	19.1	42.1	55
284	2020-10-08	2026-03-28 08:19:37.054173	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.6	0	9.9	19.1	3
285	2020-10-09	2026-03-28 08:19:37.494488	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.8	0	8	18	3
286	2020-10-10	2026-03-28 08:19:37.934619	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.8	0.7	14.4	29.9	53
287	2020-10-11	2026-03-28 08:19:38.375013	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.1	33.2	42	76.3	63
288	2020-10-12	2026-03-28 08:19:38.815403	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.6	1.9	32.7	60.5	53
289	2020-10-13	2026-03-28 08:19:39.257165	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.6	0	13.2	30.6	2
290	2020-10-14	2026-03-28 08:19:39.696711	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.7	4.9	13.9	24.5	61
291	2020-10-15	2026-03-28 08:19:40.137333	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.1	31.6	34.6	65.5	63
292	2020-10-16	2026-03-28 08:19:40.577424	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.3	5.4	22.1	41.8	61
293	2020-10-17	2026-03-28 08:19:41.017755	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.8	0.2	8.7	23.8	51
294	2020-10-18	2026-03-28 08:19:41.463651	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.7	0.4	10.5	22.7	51
295	2020-10-19	2026-03-28 08:19:41.903811	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.5	0.1	8.7	20.2	51
296	2020-10-20	2026-03-28 08:19:42.344195	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.4	0	9.6	13.7	3
297	2020-10-21	2026-03-28 08:19:42.785256	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.1	0	8.9	19.1	3
298	2020-10-22	2026-03-28 08:19:43.225824	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.3	0	9.8	20.9	3
299	2020-10-23	2026-03-28 08:19:43.666856	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.2	1.1	16.6	29.5	51
300	2020-10-24	2026-03-28 08:19:44.107342	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.4	6.5	11.6	23	55
301	2020-10-25	2026-03-28 08:19:44.548418	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.4	0.4	13.7	25.9	51
302	2020-10-26	2026-03-28 08:19:44.988623	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17	0	29.3	53.3	3
303	2020-10-27	2026-03-28 08:19:45.429068	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.8	5	30.5	59	61
304	2020-10-28	2026-03-28 08:19:45.869341	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.5	0	13.2	26.6	3
305	2020-10-29	2026-03-28 08:19:46.309635	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.1	0	10.4	21.6	3
306	2020-10-30	2026-03-28 08:19:46.757622	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.9	0	8.8	15.8	3
307	2020-10-31	2026-03-28 08:19:47.198208	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.4	0	6.9	15.8	3
308	2020-11-01	2026-03-28 08:19:47.639636	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.7	0	11	24.8	3
309	2020-11-02	2026-03-28 08:19:48.079814	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.9	0	6.8	15.5	3
310	2020-11-03	2026-03-28 08:19:48.520292	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.4	0.1	7.4	16.9	51
311	2020-11-04	2026-03-28 08:19:48.960416	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.5	0	9.8	22.7	3
312	2020-11-05	2026-03-28 08:19:49.400854	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15	0	20	38.5	3
313	2020-11-06	2026-03-28 08:19:49.841769	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.8	0	14.1	29.5	1
314	2020-11-07	2026-03-28 08:19:50.282953	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.2	0	14.8	30.2	0
315	2020-11-08	2026-03-28 08:19:50.723304	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.5	0	10.4	20.5	3
316	2020-11-09	2026-03-28 08:19:51.163652	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.4	0	10	15.8	3
317	2020-11-10	2026-03-28 08:19:51.606109	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13	0	17.9	35.6	3
318	2020-11-11	2026-03-28 08:19:52.046269	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.8	1.5	13.3	24.5	53
319	2020-11-12	2026-03-28 08:19:52.486272	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.3	1.6	11.6	24.5	53
320	2020-11-13	2026-03-28 08:19:52.927004	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12	0	7.9	15.5	3
321	2020-11-14	2026-03-28 08:19:53.367478	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.9	0	10	21.2	3
322	2020-11-15	2026-03-28 08:19:53.807653	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.1	0	11.1	20.2	3
323	2020-11-16	2026-03-28 08:19:54.2485	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.1	10.4	31.7	56.5	61
324	2020-11-17	2026-03-28 08:19:54.688803	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.9	0	26.3	49.3	3
325	2020-11-18	2026-03-28 08:19:55.129927	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.9	0	16.3	29.2	1
326	2020-11-19	2026-03-28 08:19:55.570293	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.5	0	10.1	18.7	2
327	2020-11-20	2026-03-28 08:19:56.010707	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12	1.9	43.4	84.2	53
328	2020-11-21	2026-03-28 08:19:56.451535	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.6	0	38.5	73.1	0
329	2020-11-22	2026-03-28 08:19:56.892289	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.1	0	23.9	43.2	3
330	2020-11-23	2026-03-28 08:19:57.33326	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.1	0	9.7	17.3	3
331	2020-11-24	2026-03-28 08:19:57.780378	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.8	0	13	25.9	3
332	2020-11-25	2026-03-28 08:19:58.219863	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.9	0	12.1	24.1	1
333	2020-11-26	2026-03-28 08:19:58.660424	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7	0	10.6	21.2	3
334	2020-11-27	2026-03-28 08:19:59.101506	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.5	0	9.7	20.2	3
335	2020-11-28	2026-03-28 08:19:59.542414	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.2	0.5	21.1	36.7	53
336	2020-11-29	2026-03-28 08:19:59.981817	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.4	3	25.3	48.2	55
337	2020-11-30	2026-03-28 08:20:00.42264	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.5	0	13.8	24.5	0
338	2020-12-01	2026-03-28 08:20:00.862941	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.6	2.8	30.9	54.7	53
339	2020-12-02	2026-03-28 08:20:01.303253	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.9	33.7	38.2	71.3	63
340	2020-12-03	2026-03-28 08:20:01.743466	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.9	5.7	26.2	56.2	63
341	2020-12-04	2026-03-28 08:20:02.184133	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.2	0	38.2	67	3
342	2020-12-05	2026-03-28 08:20:02.624781	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.1	8.5	42.9	76.3	61
343	2020-12-06	2026-03-28 08:20:03.065504	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.2	16.9	32	57.2	63
344	2020-12-07	2026-03-28 08:20:03.503835	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.5	1.6	16.1	32	53
345	2020-12-08	2026-03-28 08:20:03.944686	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.3	15.7	28.5	50.8	63
346	2020-12-09	2026-03-28 08:20:04.385133	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.1	14.1	26	48.2	63
347	2020-12-10	2026-03-28 08:20:04.826529	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.6	2.5	10.1	21.6	53
348	2020-12-11	2026-03-28 08:20:05.266776	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.7	0	11.5	24.5	3
349	2020-12-12	2026-03-28 08:20:05.707166	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.4	0.4	14	25.6	51
350	2020-12-13	2026-03-28 08:20:06.146911	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.1	0	16.4	30.2	3
351	2020-12-14	2026-03-28 08:20:06.587787	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6	0	14.1	24.5	3
352	2020-12-15	2026-03-28 08:20:07.028327	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.1	0	11.4	22.7	3
353	2020-12-16	2026-03-28 08:20:07.468395	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.3	1	6.6	23	51
354	2020-12-17	2026-03-28 08:20:07.909411	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.2	0.1	8.2	17.6	51
355	2020-12-18	2026-03-28 08:20:08.350329	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.3	0.2	10.2	20.9	51
356	2020-12-19	2026-03-28 08:20:08.790563	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.8	0.3	6.9	16.9	51
357	2020-12-20	2026-03-28 08:20:09.231849	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9	0.1	11.2	19.8	51
358	2020-12-21	2026-03-28 08:20:09.67209	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.6	0.1	10.4	19.4	51
359	2020-12-22	2026-03-28 08:20:10.112677	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.3	1.6	7	23.4	61
360	2020-12-23	2026-03-28 08:20:10.553832	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.3	0	5	9.4	3
361	2020-12-24	2026-03-28 08:20:10.994823	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.6	0	22.9	39.6	3
362	2020-12-25	2026-03-28 08:20:11.435086	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.5	12.3	39.6	74.2	61
363	2020-12-26	2026-03-28 08:20:13.206379	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8	0	38.6	72	3
364	2020-12-27	2026-03-28 08:20:13.646617	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.5	0	31.3	56.5	3
365	2020-12-28	2026-03-28 08:20:14.087444	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.3	10	45.9	87.5	61
366	2020-12-29	2026-03-28 08:20:14.527042	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.3	1.5	25.2	45.7	51
367	2020-12-30	2026-03-28 08:20:14.96832	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5	1.3	12.1	22.7	53
368	2020-12-31	2026-03-28 08:20:15.40879	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.8	0.1	16.3	30.2	51
369	2021-01-01	2026-03-28 08:20:15.847925	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.3	4.8	19.4	33.5	61
370	2021-01-02	2026-03-28 08:20:16.288642	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.8	10.1	19.4	41	63
371	2021-01-03	2026-03-28 08:20:16.729246	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.8	2.3	14.8	27	55
372	2021-01-04	2026-03-28 08:20:17.17015	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.8	3.8	10.9	18.7	55
373	2021-01-05	2026-03-28 08:20:17.610348	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.9	12.9	12.5	25.9	63
374	2021-01-06	2026-03-28 08:20:18.050946	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.3	0.2	13.9	27.7	51
375	2021-01-07	2026-03-28 08:20:18.491414	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.5	0	9.7	21.6	3
376	2021-01-08	2026-03-28 08:20:18.931628	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.2	0.1	17.9	33.1	51
377	2021-01-09	2026-03-28 08:20:19.371694	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.4	0.1	21.2	41.4	51
378	2021-01-10	2026-03-28 08:20:19.812092	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6	0.3	33	59.8	51
379	2021-01-11	2026-03-28 08:20:20.252463	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.1	0	32.8	59	3
380	2021-01-12	2026-03-28 08:20:20.693399	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2.7	0	17	31.3	3
381	2021-01-13	2026-03-28 08:20:21.133624	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1.8	0	11.6	21.2	2
382	2021-01-14	2026-03-28 08:20:21.575399	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.2	0	24.3	46.8	3
383	2021-01-15	2026-03-28 08:20:22.023214	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.3	0	24.3	43.6	3
384	2021-01-16	2026-03-28 08:20:22.463909	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.5	0	17.6	31.3	3
385	2021-01-17	2026-03-28 08:20:22.904811	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.6	0	12.3	26.3	3
386	2021-01-18	2026-03-28 08:20:23.34492	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2.9	0	17.1	30.2	3
387	2021-01-19	2026-03-28 08:20:23.785787	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.2	0	9	17.3	3
388	2021-01-20	2026-03-28 08:20:24.226148	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.1	0	8.7	16.2	3
389	2021-01-21	2026-03-28 08:20:24.665935	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.4	0.4	10.5	18	51
390	2021-01-22	2026-03-28 08:20:25.106221	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10	7.7	43.6	76	61
391	2021-01-23	2026-03-28 08:20:25.546485	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.4	2.2	37.1	76.3	53
392	2021-01-24	2026-03-28 08:20:25.986727	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6	2.7	17.6	33.1	53
393	2021-01-25	2026-03-28 08:20:26.427093	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5	0.5	19.8	50.8	51
394	2021-01-26	2026-03-28 08:20:26.871917	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.7	0	15.1	27.4	3
395	2021-01-27	2026-03-28 08:20:27.310883	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1.8	0	13.7	24.8	3
396	2021-01-28	2026-03-28 08:20:27.75036	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2.5	0	10.8	19.1	3
397	2021-01-29	2026-03-28 08:20:28.19059	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.6	1.1	18	61.9	53
398	2021-01-30	2026-03-28 08:20:28.631203	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.4	4	14.9	25.9	55
399	2021-01-31	2026-03-28 08:20:29.071401	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8	11.2	29.2	52.6	63
400	2021-02-01	2026-03-28 08:20:29.512453	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6	0.1	16	28.4	51
401	2021-02-02	2026-03-28 08:20:29.952752	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.1	0	11.8	21.2	3
402	2021-02-03	2026-03-28 08:20:30.393195	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.1	1	9	16.9	51
403	2021-02-04	2026-03-28 08:20:30.835898	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.4	0.2	12.2	21.6	51
404	2021-02-05	2026-03-28 08:20:31.275874	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.4	0	8.9	16.6	3
405	2021-02-06	2026-03-28 08:20:31.716576	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.8	0.2	16.6	27.7	51
406	2021-02-07	2026-03-28 08:20:32.157128	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.1	7.4	26.2	49	61
407	2021-02-08	2026-03-28 08:20:32.59759	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.7	1.2	20.6	43.2	51
408	2021-02-09	2026-03-28 08:20:33.038442	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10	4.5	18.9	32.4	61
409	2021-02-10	2026-03-28 08:20:33.486834	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.5	7	26.4	58.3	55
410	2021-02-11	2026-03-28 08:20:33.927164	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.7	0.4	28.1	50.8	51
411	2021-02-12	2026-03-28 08:20:34.36723	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4	0	26.4	49.3	3
412	2021-02-13	2026-03-28 08:20:34.807797	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1.6	0.6	38	72	71
413	2021-02-14	2026-03-28 08:20:35.248238	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.2	0	35.9	66.6	1
414	2021-02-15	2026-03-28 08:20:35.688881	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2.1	0	10.9	24.5	3
415	2021-02-16	2026-03-28 08:20:36.129222	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.2	0	10.7	19.8	3
416	2021-02-17	2026-03-28 08:20:36.56891	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6	0	9.7	19.4	3
417	2021-02-18	2026-03-28 08:20:37.009148	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6	0	8.6	15.1	3
418	2021-02-19	2026-03-28 08:20:37.450799	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.2	0	9.1	19.1	3
419	2021-02-20	2026-03-28 08:20:37.891675	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.2	0	9.7	19.4	3
420	2021-02-21	2026-03-28 08:20:38.331876	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.7	0	10	22.7	3
421	2021-02-22	2026-03-28 08:20:38.772477	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.1	0	8.2	18.4	3
422	2021-02-23	2026-03-28 08:20:39.215024	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.5	0	9	21.6	3
423	2021-02-24	2026-03-28 08:20:39.660848	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.7	0	11.3	22	3
424	2021-02-25	2026-03-28 08:20:40.101366	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.2	0	11.8	21.2	0
425	2021-02-26	2026-03-28 08:20:40.54182	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9	0	11	20.5	0
426	2021-02-27	2026-03-28 08:20:40.982225	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.3	0	23.4	41	3
427	2021-02-28	2026-03-28 08:20:41.422502	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.4	0	26.8	48.2	0
428	2021-03-01	2026-03-28 08:20:41.862775	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.7	0	12.2	25.9	0
429	2021-03-02	2026-03-28 08:20:42.303255	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.4	0	12.1	25.2	0
430	2021-03-03	2026-03-28 08:20:42.744634	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.1	0	10.5	21.2	0
431	2021-03-04	2026-03-28 08:20:43.185017	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8	0	13.6	24.1	3
432	2021-03-05	2026-03-28 08:20:43.625358	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.9	2.9	12.7	28.1	55
433	2021-03-06	2026-03-28 08:20:44.065716	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.1	4.7	35.8	66.6	61
434	2021-03-07	2026-03-28 08:20:44.505878	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.9	0	10.4	24.5	2
435	2021-03-08	2026-03-28 08:20:44.953585	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.9	0	11.4	25.9	3
436	2021-03-09	2026-03-28 08:20:45.403209	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.9	0	16.6	32.8	3
437	2021-03-10	2026-03-28 08:20:45.843954	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.8	0	16.8	31	3
438	2021-03-11	2026-03-28 08:20:46.28462	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.2	0	18.8	32	3
439	2021-03-12	2026-03-28 08:20:46.724004	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.6	9	22.9	45	61
440	2021-03-13	2026-03-28 08:20:47.164571	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.4	0	25	43.9	3
441	2021-03-14	2026-03-28 08:20:47.605507	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.7	3	36.8	67.7	55
442	2021-03-15	2026-03-28 08:20:48.046434	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.8	0	17	31	3
443	2021-03-16	2026-03-28 08:20:48.486823	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.5	0.1	19.7	34.6	51
444	2021-03-17	2026-03-28 08:20:48.927221	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.9	0.2	14.2	29.9	51
445	2021-03-18	2026-03-28 08:20:49.36759	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.3	1.9	14	29.2	61
446	2021-03-19	2026-03-28 08:20:49.807885	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.4	0.2	15.6	32.4	51
447	2021-03-20	2026-03-28 08:20:50.248297	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7	0.4	34.2	61.2	51
448	2021-03-21	2026-03-28 08:20:50.687984	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.3	0	34.4	62.6	3
449	2021-03-22	2026-03-28 08:20:51.128241	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9	0	17.8	32.4	2
450	2021-03-23	2026-03-28 08:20:51.568012	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.4	0	15.5	31.3	3
451	2021-03-24	2026-03-28 08:20:52.008747	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.5	0	12.1	30.2	0
452	2021-03-25	2026-03-28 08:20:52.449129	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.2	0	11.6	25.2	3
453	2021-03-26	2026-03-28 08:20:54.254763	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.2	0	11.2	25.2	3
454	2021-03-27	2026-03-28 08:20:54.696346	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.4	0	14.3	29.9	3
455	2021-03-28	2026-03-28 08:20:55.136398	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.7	0	10.7	23	3
456	2021-03-29	2026-03-28 08:20:55.576973	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.6	0	11.6	27	3
457	2021-03-30	2026-03-28 08:20:56.016946	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.8	0	8.6	20.2	1
458	2021-03-31	2026-03-28 08:20:56.457506	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.8	0	10	18.4	0
459	2021-04-01	2026-03-28 08:20:56.8984	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.5	0	12.2	25.9	3
460	2021-04-02	2026-03-28 08:20:57.339959	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.7	0	13.5	23.8	2
461	2021-04-03	2026-03-28 08:20:57.780299	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.5	1.4	31	56.9	53
462	2021-04-04	2026-03-28 08:20:58.220759	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.5	0	28	52.2	3
463	2021-04-05	2026-03-28 08:20:58.661343	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.8	0	21.3	40.3	3
464	2021-04-06	2026-03-28 08:20:59.100994	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.5	9.3	59.1	109.8	71
465	2021-04-07	2026-03-28 08:20:59.541543	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.6	0	11	28.4	3
466	2021-04-08	2026-03-28 08:20:59.982409	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.1	0	20.8	38.5	1
467	2021-04-09	2026-03-28 08:21:00.423617	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.6	0	16.6	33.1	3
468	2021-04-10	2026-03-28 08:21:00.864085	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.5	0	19.5	37.4	3
469	2021-04-11	2026-03-28 08:21:01.304675	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.7	13.5	23.4	43.9	61
470	2021-04-12	2026-03-28 08:21:01.74507	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.4	22.1	25.6	59.8	63
471	2021-04-13	2026-03-28 08:21:02.185395	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.1	11.7	47.5	87.1	61
472	2021-04-14	2026-03-28 08:21:02.625811	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.7	0	14	31.3	2
473	2021-04-15	2026-03-28 08:21:03.067194	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.1	0	19.9	40	3
474	2021-04-16	2026-03-28 08:21:03.507726	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.8	0	14.5	29.9	2
475	2021-04-17	2026-03-28 08:21:03.948215	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.7	0	20.8	38.9	3
476	2021-04-18	2026-03-28 08:21:04.388689	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.6	0.5	21.1	41.8	51
477	2021-04-19	2026-03-28 08:21:04.8297	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.7	0	16.6	34.6	3
478	2021-04-20	2026-03-28 08:21:05.270902	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.8	0.1	15.6	38.2	51
479	2021-04-21	2026-03-28 08:21:05.711213	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.4	0	16.6	33.5	3
480	2021-04-22	2026-03-28 08:21:06.151597	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.8	0	14.5	31	3
481	2021-04-23	2026-03-28 08:21:06.59184	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.6	0.1	11.8	27.7	51
482	2021-04-24	2026-03-28 08:21:07.032167	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.7	0	10.9	25.6	0
483	2021-04-25	2026-03-28 08:21:07.472682	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.6	0	13.4	28.1	3
484	2021-04-26	2026-03-28 08:21:07.912024	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.7	6.5	23.7	44.6	61
485	2021-04-27	2026-03-28 08:21:08.352688	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13	6.2	15.3	31	55
486	2021-04-28	2026-03-28 08:21:08.792751	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14	0.4	16.7	30.6	51
487	2021-04-29	2026-03-28 08:21:09.233276	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.5	2.3	22.1	40.7	53
488	2021-04-30	2026-03-28 08:21:09.67741	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.6	0.8	15.8	35.3	53
489	2021-05-01	2026-03-28 08:21:10.118045	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.3	7.5	25.1	50.4	63
490	2021-05-02	2026-03-28 08:21:10.560504	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.1	0.4	24.7	46.8	51
491	2021-05-03	2026-03-28 08:21:11.000521	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.8	1.3	27	50	51
492	2021-05-04	2026-03-28 08:21:11.440481	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.4	0	19	35.6	3
493	2021-05-05	2026-03-28 08:21:11.880236	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.1	0	23.7	51.1	3
494	2021-05-06	2026-03-28 08:21:12.322737	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.7	0.2	28.3	49.7	51
495	2021-05-07	2026-03-28 08:21:12.763388	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18	2.5	31	55.8	53
496	2021-05-08	2026-03-28 08:21:13.203611	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.1	0	26.5	55.1	3
497	2021-05-09	2026-03-28 08:21:13.643844	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.2	0	10.1	26.3	3
498	2021-05-10	2026-03-28 08:21:14.084209	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.9	0	17.8	35.6	3
499	2021-05-11	2026-03-28 08:21:14.524433	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.1	3.3	16.8	45	53
500	2021-05-12	2026-03-28 08:21:14.964661	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.7	10.3	19.5	38.9	61
501	2021-05-13	2026-03-28 08:21:15.405089	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.6	6.6	16.7	41	61
502	2021-05-14	2026-03-28 08:21:15.845252	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.3	7.5	12.7	37.8	61
503	2021-05-15	2026-03-28 08:21:16.28605	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.7	0.6	20.4	36.4	51
504	2021-05-16	2026-03-28 08:21:16.726236	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.2	2.4	21.3	37.4	55
505	2021-05-17	2026-03-28 08:21:17.1666	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.4	0.2	34.8	72	51
506	2021-05-18	2026-03-28 08:21:17.606837	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.7	0	20.9	37.1	3
507	2021-05-19	2026-03-28 08:21:18.047054	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.8	3.4	30.6	64.1	61
508	2021-05-20	2026-03-28 08:21:18.487443	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.9	0	14.9	31	3
509	2021-05-21	2026-03-28 08:21:18.92806	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.6	0	25	45	3
510	2021-05-22	2026-03-28 08:21:19.368446	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.7	0.3	26.7	53.6	51
511	2021-05-23	2026-03-28 08:21:19.808917	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.1	2.4	24.1	42.1	55
512	2021-05-24	2026-03-28 08:21:20.249342	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17	24.4	24.1	47.2	63
513	2021-05-25	2026-03-28 08:21:20.689421	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.7	0.5	18.6	42.1	51
514	2021-05-26	2026-03-28 08:21:21.1289	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.4	0	13.7	31	1
515	2021-05-27	2026-03-28 08:21:21.573903	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.2	0	19.4	38.2	3
516	2021-05-28	2026-03-28 08:21:22.01968	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.3	0	17	29.9	2
517	2021-05-29	2026-03-28 08:21:22.46003	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.7	2	16.5	31.7	53
518	2021-05-30	2026-03-28 08:21:22.901242	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.2	0.1	17.7	32.8	51
519	2021-05-31	2026-03-28 08:21:23.341951	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.7	0	19.1	34.6	3
520	2021-06-01	2026-03-28 08:21:23.781946	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18	0	14.7	31.7	1
521	2021-06-02	2026-03-28 08:21:24.221596	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.4	0	15.3	34.9	1
522	2021-06-03	2026-03-28 08:21:24.661377	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.1	0	14.3	31.7	3
523	2021-06-04	2026-03-28 08:21:25.100691	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.4	0	13.4	28.4	3
524	2021-06-05	2026-03-28 08:21:25.5407	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.6	0.3	15.3	33.1	51
525	2021-06-06	2026-03-28 08:21:25.980868	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.3	3.6	14	28.4	61
526	2021-06-07	2026-03-28 08:21:26.421571	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.1	8.2	16.4	34.9	63
527	2021-06-08	2026-03-28 08:21:26.865485	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.3	0	11.6	25.9	3
528	2021-06-09	2026-03-28 08:21:27.305205	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.5	0	14.8	32	3
529	2021-06-10	2026-03-28 08:21:27.745571	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.5	0	21.6	40.3	3
530	2021-06-11	2026-03-28 08:21:28.185845	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.3	0	15.2	28.1	3
531	2021-06-12	2026-03-28 08:21:28.625999	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.9	0	15.2	32.4	3
532	2021-06-13	2026-03-28 08:21:29.066799	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.1	0	21.7	43.6	1
533	2021-06-14	2026-03-28 08:21:29.507436	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23	0	24.7	47.9	1
534	2021-06-15	2026-03-28 08:21:29.947566	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.7	0	21.7	38.9	2
535	2021-06-16	2026-03-28 08:21:30.387819	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.5	0	9.6	24.8	3
536	2021-06-17	2026-03-28 08:21:30.828305	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.4	0	16.3	33.1	1
537	2021-06-18	2026-03-28 08:21:31.268547	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.5	3.9	18.8	34.6	61
538	2021-06-19	2026-03-28 08:21:31.709019	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.1	0	15.6	34.9	3
539	2021-06-20	2026-03-28 08:21:32.149541	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.8	0	15.4	33.1	3
540	2021-06-21	2026-03-28 08:21:32.592098	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.3	0	20	39.6	2
541	2021-06-22	2026-03-28 08:21:33.032669	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.2	0	18.9	40.7	1
542	2021-06-23	2026-03-28 08:21:33.474049	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.7	0	12.5	40.7	3
543	2021-06-24	2026-03-28 08:21:35.254208	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.5	0	21.6	39.6	3
544	2021-06-25	2026-03-28 08:21:35.694893	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.3	0	19.4	38.9	3
545	2021-06-26	2026-03-28 08:21:36.13528	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.3	0.2	13.2	28.1	51
546	2021-06-27	2026-03-28 08:21:36.576164	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.1	0	11.8	29.5	3
547	2021-06-28	2026-03-28 08:21:37.017377	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.3	0	15.3	31.7	3
548	2021-06-29	2026-03-28 08:21:37.457521	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.1	0	24.6	45.4	3
549	2021-06-30	2026-03-28 08:21:37.897722	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.6	0	29.4	55.8	3
550	2021-07-01	2026-03-28 08:21:38.338379	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.5	0.2	25.7	53.3	51
551	2021-07-02	2026-03-28 08:21:38.781077	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.7	0.2	24.4	48.2	51
552	2021-07-03	2026-03-28 08:21:39.221877	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.1	2.2	13.9	33.8	61
553	2021-07-04	2026-03-28 08:21:39.662852	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23	26.8	14.8	38.9	63
554	2021-07-05	2026-03-28 08:21:40.103186	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.5	0.4	16.8	32.4	51
555	2021-07-06	2026-03-28 08:21:40.543781	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.3	0	12.2	30.2	1
556	2021-07-07	2026-03-28 08:21:40.98391	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.6	0	17.6	35.3	0
557	2021-07-08	2026-03-28 08:21:41.424043	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.3	4.5	25.4	50	63
558	2021-07-09	2026-03-28 08:21:41.864379	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.1	0	19.2	38.5	2
559	2021-07-10	2026-03-28 08:21:42.304654	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.4	0	11.3	28.4	2
560	2021-07-11	2026-03-28 08:21:42.744684	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.9	0	13.5	28.4	2
561	2021-07-12	2026-03-28 08:21:43.184177	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.1	0	18.8	40.3	3
562	2021-07-13	2026-03-28 08:21:43.624323	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.4	0.5	26.5	50	51
563	2021-07-14	2026-03-28 08:21:44.064651	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.8	0.2	24.4	50.8	51
564	2021-07-15	2026-03-28 08:21:44.505498	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.7	0	11.7	24.5	3
565	2021-07-16	2026-03-28 08:21:44.945883	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.1	4.6	14.4	37.4	53
566	2021-07-17	2026-03-28 08:21:45.385033	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.1	1.7	32.1	61.2	55
567	2021-07-18	2026-03-28 08:21:45.825355	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.6	0	29.8	52.9	3
568	2021-07-19	2026-03-28 08:21:46.266084	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26	0.1	18.7	37.4	51
569	2021-07-20	2026-03-28 08:21:46.706886	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.6	0	14.8	31.3	2
570	2021-07-21	2026-03-28 08:21:47.146418	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.7	0	17.4	36.7	3
571	2021-07-22	2026-03-28 08:21:47.587871	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.6	0	17.8	33.5	2
572	2021-07-23	2026-03-28 08:21:48.028858	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26	0	14.5	31.7	2
573	2021-07-24	2026-03-28 08:21:48.474222	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.9	0	16.6	36	3
574	2021-07-25	2026-03-28 08:21:48.914598	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.1	0	21.7	46.1	3
575	2021-07-26	2026-03-28 08:21:49.35495	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.7	0.1	18.9	39.6	51
576	2021-07-27	2026-03-28 08:21:49.795418	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.1	0.1	17	38.2	51
577	2021-07-28	2026-03-28 08:21:50.235949	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26	0.1	14.3	31.3	51
578	2021-07-29	2026-03-28 08:21:50.676673	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.3	0	12.6	29.5	1
579	2021-07-30	2026-03-28 08:21:51.116138	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.7	0	12.7	27	1
580	2021-07-31	2026-03-28 08:21:51.556403	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.8	0	21.1	40.7	2
581	2021-08-01	2026-03-28 08:21:51.996678	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.6	0.2	23.8	46.4	51
582	2021-08-02	2026-03-28 08:21:52.436833	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.6	1.5	13.4	27.7	53
583	2021-08-03	2026-03-28 08:21:52.877479	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.4	1.1	12	26.3	53
584	2021-08-04	2026-03-28 08:21:53.317915	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.9	0.5	15	33.1	53
585	2021-08-05	2026-03-28 08:21:53.758603	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.1	0.1	27.1	54.4	51
586	2021-08-06	2026-03-28 08:21:54.199088	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.2	0	16	32.4	3
587	2021-08-07	2026-03-28 08:21:54.637991	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.6	0	25.7	49	2
588	2021-08-08	2026-03-28 08:21:55.077981	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.4	0.1	25.8	46.1	51
589	2021-08-09	2026-03-28 08:21:55.517097	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.8	0	13.3	25.9	2
590	2021-08-10	2026-03-28 08:21:55.957687	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26	0	11.5	28.4	3
591	2021-08-11	2026-03-28 08:21:56.397647	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.8	0	13	28.8	1
592	2021-08-12	2026-03-28 08:21:56.837838	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.3	0	10.5	25.9	1
593	2021-08-13	2026-03-28 08:21:57.278521	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.9	0	9.8	22.3	3
594	2021-08-14	2026-03-28 08:21:57.718666	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28	0	10.6	23	1
595	2021-08-15	2026-03-28 08:21:58.159767	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.3	0	10.8	26.6	1
596	2021-08-16	2026-03-28 08:21:58.599933	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.3	0.4	38.1	70.2	51
597	2021-08-17	2026-03-28 08:21:59.040539	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.1	0.2	33.3	64.1	51
598	2021-08-18	2026-03-28 08:21:59.480402	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.9	0	18.2	38.2	2
599	2021-08-19	2026-03-28 08:21:59.92028	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.5	0	15.3	28.4	1
600	2021-08-20	2026-03-28 08:22:00.361153	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.2	0	8.9	21.6	1
601	2021-08-21	2026-03-28 08:22:00.801591	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.1	0	9.2	24.5	1
602	2021-08-22	2026-03-28 08:22:01.241657	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.5	0	14.8	30.6	3
603	2021-08-23	2026-03-28 08:22:01.683366	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.9	3.6	35	68	63
604	2021-08-24	2026-03-28 08:22:02.12434	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.1	0	24.2	44.3	3
605	2021-08-25	2026-03-28 08:22:02.565719	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.6	0	30.2	56.5	2
606	2021-08-26	2026-03-28 08:22:03.006615	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.8	0	18	36.4	2
607	2021-08-27	2026-03-28 08:22:03.447374	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.3	9.3	29.2	53.6	61
608	2021-08-28	2026-03-28 08:22:03.8876	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.2	0	25.3	49.3	3
609	2021-08-29	2026-03-28 08:22:04.327322	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.4	0.1	22.1	40.7	51
610	2021-08-30	2026-03-28 08:22:04.76756	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.3	1.2	17.2	36	53
611	2021-08-31	2026-03-28 08:22:05.207637	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.1	7.3	15.1	30.2	63
612	2021-09-01	2026-03-28 08:22:05.648508	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.6	0	11.7	27.4	1
613	2021-09-02	2026-03-28 08:22:06.089384	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22	0	18.1	37.4	0
614	2021-09-03	2026-03-28 08:22:06.529638	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22	0.1	9.4	23	51
615	2021-09-04	2026-03-28 08:22:06.969129	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.8	0	11.2	25.9	3
616	2021-09-05	2026-03-28 08:22:07.412043	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.2	0	13.9	28.1	1
617	2021-09-06	2026-03-28 08:22:07.852035	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.2	0	20	37.8	3
618	2021-09-07	2026-03-28 08:22:08.29236	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.6	0	15.1	31	3
619	2021-09-08	2026-03-28 08:22:08.732282	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.8	0	16.6	32.4	2
620	2021-09-09	2026-03-28 08:22:09.172505	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22	0	10.5	24.8	2
621	2021-09-10	2026-03-28 08:22:09.612484	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.6	0	9.8	24.5	2
622	2021-09-11	2026-03-28 08:22:10.052277	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.3	0	9.7	23.8	3
623	2021-09-12	2026-03-28 08:22:10.492471	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.7	0	10.4	25.2	2
624	2021-09-13	2026-03-28 08:22:10.932906	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.5	0	10.2	25.2	3
625	2021-09-14	2026-03-28 08:22:11.373863	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.5	0	11.5	25.9	3
626	2021-09-15	2026-03-28 08:22:11.813931	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.6	0	20.7	36.7	3
627	2021-09-16	2026-03-28 08:22:12.25316	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.8	6.5	19.5	44.6	55
628	2021-09-17	2026-03-28 08:22:12.693415	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.3	6.7	12.9	34.6	55
629	2021-09-18	2026-03-28 08:22:13.134882	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.8	7.5	17.8	36.4	63
630	2021-09-19	2026-03-28 08:22:13.575778	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.7	14.7	19.1	34.6	63
631	2021-09-20	2026-03-28 08:22:14.0166	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.4	1.5	19.8	37.8	53
632	2021-09-21	2026-03-28 08:22:14.456917	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.2	6.7	27.6	49	61
633	2021-09-22	2026-03-28 08:22:15.639614	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.7	0	11.7	26.6	3
634	2021-09-23	2026-03-28 08:22:16.079666	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.3	0	14.3	29.5	3
635	2021-09-24	2026-03-28 08:22:16.51986	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.7	0	11.6	25.6	0
636	2021-09-25	2026-03-28 08:22:16.959981	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.9	0	11.3	27	3
637	2021-09-26	2026-03-28 08:22:17.40041	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.1	10.6	17.6	32.8	63
638	2021-09-27	2026-03-28 08:22:17.84076	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.1	2.2	12.7	27	53
639	2021-09-28	2026-03-28 08:22:18.280197	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.4	0	9	22.3	3
640	2021-09-29	2026-03-28 08:22:18.720343	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21	0	13.9	22.7	3
641	2021-09-30	2026-03-28 08:22:19.163128	\N	backfill	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.7	0	34	60.1	3
642	2021-10-01	2026-03-28 08:22:19.603276	\N	backfill	\N	0.44	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.8	0	9.6	22	1
643	2021-10-02	2026-03-28 08:22:20.043636	\N	backfill	\N	0.12	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.4	0	11.5	24.5	3
644	2021-10-03	2026-03-28 08:22:20.484889	\N	backfill	\N	0.86	5.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21	0.1	17.6	34.6	51
645	2021-10-04	2026-03-28 08:22:20.924286	\N	backfill	\N	0.64	5.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.6	1	22.7	39.6	51
646	2021-10-05	2026-03-28 08:22:21.364691	\N	backfill	\N	0.66	5.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.5	0.4	25.3	50.4	51
647	2021-10-06	2026-03-28 08:22:21.805315	\N	backfill	\N	1.36	5.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.4	44.7	40.9	79.2	65
648	2021-10-07	2026-03-28 08:22:22.245601	\N	backfill	\N	2.2	6.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.1	16.1	47.1	84.6	61
649	2021-10-08	2026-03-28 08:22:22.685805	\N	backfill	\N	2	6.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.2	0	45.6	82.1	3
650	2021-10-09	2026-03-28 08:22:23.125166	\N	backfill	\N	1.24	5.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.9	0	34	63.7	1
651	2021-10-10	2026-03-28 08:22:23.565386	\N	backfill	\N	1.14	5.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.2	0.3	35.5	66.6	51
652	2021-10-11	2026-03-28 08:22:24.006088	\N	backfill	\N	0.98	5.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.8	0.5	22.3	46.4	51
653	2021-10-12	2026-03-28 08:22:24.446688	\N	backfill	\N	0.28	3.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.5	0.1	15.8	27	51
654	2021-10-13	2026-03-28 08:22:24.886907	\N	backfill	\N	0.6	4.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.6	2.4	21.1	44.3	55
655	2021-10-14	2026-03-28 08:22:25.326656	\N	backfill	\N	0.62	4.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.8	0	17.7	32	3
656	2021-10-15	2026-03-28 08:22:25.766553	\N	backfill	\N	0.48	3.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.2	0	19.3	36.7	3
657	2021-10-16	2026-03-28 08:22:26.205052	\N	backfill	\N	0.62	3.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.3	0	18.3	35.3	3
658	2021-10-17	2026-03-28 08:22:26.643541	\N	backfill	\N	0.42	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.4	0	11.5	24.5	0
659	2021-10-18	2026-03-28 08:22:27.083164	\N	backfill	\N	0.1	2.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.6	0	8	18.4	3
660	2021-10-19	2026-03-28 08:22:27.523485	\N	backfill	\N	0.12	2.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.7	0	9.3	16.6	3
661	2021-10-20	2026-03-28 08:22:27.963867	\N	backfill	\N	0.22	2.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.8	0	19.9	32.8	3
662	2021-10-21	2026-03-28 08:22:28.40308	\N	backfill	\N	0.44	4.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.3	0	23.7	41.8	3
663	2021-10-22	2026-03-28 08:22:28.845018	\N	backfill	\N	0.32	4.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.5	0.7	10.2	24.8	53
664	2021-10-23	2026-03-28 08:22:29.283867	\N	backfill	\N	0.5	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.5	1.1	13.8	25.6	51
665	2021-10-24	2026-03-28 08:22:29.723445	\N	backfill	\N	0.72	4.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.2	0	17.6	32.4	3
666	2021-10-25	2026-03-28 08:22:30.163522	\N	backfill	\N	0.5	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.9	2.4	17.1	31.7	61
667	2021-10-26	2026-03-28 08:22:30.603188	\N	backfill	\N	0.18	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.1	1.8	13.8	26.3	53
668	2021-10-27	2026-03-28 08:22:31.043508	\N	backfill	\N	0.62	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15	0	18	33.8	3
669	2021-10-28	2026-03-28 08:22:31.485604	\N	backfill	\N	0.42	3.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.8	0	14.8	25.2	0
670	2021-10-29	2026-03-28 08:22:31.927413	\N	backfill	\N	0.28	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.6	0	10.6	20.9	3
671	2021-10-30	2026-03-28 08:22:32.371587	\N	backfill	\N	0.14	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.2	0.8	10.4	19.4	51
672	2021-10-31	2026-03-28 08:22:32.812157	\N	backfill	\N	0.08	5.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.4	0	8.1	17.3	3
673	2021-11-01	2026-03-28 08:22:33.252749	\N	backfill	\N	1.48	7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.6	13.5	41.2	71.3	63
674	2021-11-02	2026-03-28 08:22:33.693146	\N	backfill	\N	0.96	7.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.7	0.1	24.5	49.3	51
675	2021-11-03	2026-03-28 08:22:34.133393	\N	backfill	\N	1.16	5.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.5	5.4	27.7	46.8	61
676	2021-11-04	2026-03-28 08:22:34.573975	\N	backfill	\N	1.32	7.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.5	2.7	44.2	80.6	61
677	2021-11-05	2026-03-28 08:22:35.01461	\N	backfill	\N	0.82	7.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.8	0	24.2	41.4	3
678	2021-11-06	2026-03-28 08:22:35.455116	\N	backfill	\N	1.02	5.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.3	0	30	54.4	3
679	2021-11-07	2026-03-28 08:22:35.895154	\N	backfill	\N	0.62	4.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.4	1.9	19	34.2	61
680	2021-11-08	2026-03-28 08:22:36.336101	\N	backfill	\N	0.94	4.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.3	1.8	28.9	49.7	55
681	2021-11-09	2026-03-28 08:22:36.777786	\N	backfill	\N	1	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13	0	28.8	49.3	3
682	2021-11-10	2026-03-28 08:22:37.217032	\N	backfill	\N	0.74	4.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13	0	19.2	34.9	3
683	2021-11-11	2026-03-28 08:22:37.658048	\N	backfill	\N	0.18	4.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.9	0	11	22	3
684	2021-11-12	2026-03-28 08:22:38.098243	\N	backfill	\N	0.14	4.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.2	0	11.6	24.5	3
685	2021-11-13	2026-03-28 08:22:38.538595	\N	backfill	\N	0.1	4.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.2	0.9	8.2	16.9	51
686	2021-11-14	2026-03-28 08:22:38.979117	\N	backfill	\N	0.78	4.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.5	11.9	22.9	38.9	63
687	2021-11-15	2026-03-28 08:22:39.419684	\N	backfill	\N	1	4.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.5	1.6	27.6	49.3	53
688	2021-11-16	2026-03-28 08:22:39.859806	\N	backfill	\N	0.9	4.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.6	2.7	24.8	42.5	53
689	2021-11-17	2026-03-28 08:22:40.301065	\N	backfill	\N	0.72	5.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.8	3.6	18.3	33.1	53
690	2021-11-18	2026-03-28 08:22:40.741129	\N	backfill	\N	0.52	4.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.9	0.1	17.1	28.8	51
691	2021-11-19	2026-03-28 08:22:41.180986	\N	backfill	\N	0.38	4.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11	0	10.9	22	3
692	2021-11-20	2026-03-28 08:22:41.620153	\N	backfill	\N	0.14	4.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.6	0	12.1	22	3
693	2021-11-21	2026-03-28 08:22:42.060359	\N	backfill	\N	0.04	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.1	0	10.4	19.1	3
694	2021-11-22	2026-03-28 08:22:42.500506	\N	backfill	\N	0.72	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.8	6.1	22.9	37.8	61
695	2021-11-23	2026-03-28 08:22:42.941617	\N	backfill	\N	0.96	4.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.3	0	29.6	50.8	3
696	2021-11-24	2026-03-28 08:22:43.3818	\N	backfill	\N	0.68	4.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.6	0	13.7	26.6	2
697	2021-11-25	2026-03-28 08:22:43.822744	\N	backfill	\N	0.62	3.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.8	4.6	24.7	42.8	53
698	2021-11-26	2026-03-28 08:22:44.262872	\N	backfill	\N	0.5	9.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.9	9.9	20.2	34.9	61
699	2021-11-27	2026-03-28 08:22:44.702092	\N	backfill	\N	0.52	8.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.1	0.2	26	45.4	51
700	2021-11-28	2026-03-28 08:22:45.142337	\N	backfill	\N	0.38	5.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.7	4.4	23.8	42.1	63
701	2021-11-29	2026-03-28 08:22:45.585171	\N	backfill	\N	0.66	5.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.6	3.8	28	49.3	55
702	2021-11-30	2026-03-28 08:22:46.025561	\N	backfill	\N	0.4	3.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.9	0	21.7	37.8	3
703	2021-12-01	2026-03-28 08:22:46.46576	\N	backfill	\N	0.34	4.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.1	0	19.9	34.2	3
704	2021-12-02	2026-03-28 08:22:46.90606	\N	backfill	\N	0.58	4.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.2	8	24.8	41	61
705	2021-12-03	2026-03-28 08:22:47.34656	\N	backfill	\N	0.72	4.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.4	1.4	29	50.8	53
706	2021-12-04	2026-03-28 08:22:47.786803	\N	backfill	\N	0.5	4.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.4	0.8	17.5	28.8	51
707	2021-12-05	2026-03-28 08:22:48.226651	\N	backfill	\N	0.52	4.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.7	1.9	22.5	38.2	55
708	2021-12-06	2026-03-28 08:22:48.666671	\N	backfill	\N	0.64	3.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.5	2.8	29.5	50.8	53
709	2021-12-07	2026-03-28 08:22:49.107655	\N	backfill	\N	0.48	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.5	0	12	22	3
710	2021-12-08	2026-03-28 08:22:49.547723	\N	backfill	\N	0.82	5.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.4	16.3	34.7	60.8	63
711	2021-12-09	2026-03-28 08:22:49.987777	\N	backfill	\N	0.68	5.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.7	3.3	23.5	40.7	53
712	2021-12-10	2026-03-28 08:22:50.427077	\N	backfill	\N	0.48	5.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.4	2.8	17.9	29.9	55
713	2021-12-11	2026-03-28 08:22:50.874383	\N	backfill	\N	0.9	4.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8	0.7	28.5	51.1	51
714	2021-12-12	2026-03-28 08:22:51.321895	\N	backfill	\N	0.6	4.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.2	0	14.9	25.6	3
715	2021-12-13	2026-03-28 08:22:51.7687	\N	backfill	\N	0.12	4.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.2	0	12	20.2	3
716	2021-12-14	2026-03-28 08:22:52.215615	\N	backfill	\N	0.14	2.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.4	0	8.7	17.6	3
717	2021-12-15	2026-03-28 08:22:52.662427	\N	backfill	\N	0.54	3.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.3	0	14.6	25.6	3
718	2021-12-16	2026-03-28 08:22:53.109793	\N	backfill	\N	0.56	3.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.5	0	18.4	31	3
719	2021-12-17	2026-03-28 08:22:53.556657	\N	backfill	\N	0.42	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.1	0	15.5	31	3
720	2021-12-18	2026-03-28 08:22:54.00376	\N	backfill	\N	0.4	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.8	0	12.6	22.7	3
721	2021-12-19	2026-03-28 08:22:54.450589	\N	backfill	\N	0.22	2.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2.1	0	13.6	26.3	3
722	2021-12-20	2026-03-28 08:22:54.897508	\N	backfill	\N	0.7	3.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7	0	26.9	48.2	3
723	2021-12-21	2026-03-28 08:22:56.697175	\N	backfill	\N	0.64	4.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.4	0.2	21.1	34.9	51
724	2021-12-22	2026-03-28 08:22:57.144466	\N	backfill	\N	0.5	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.4	1.4	18.3	30.6	53
725	2021-12-23	2026-03-28 08:22:57.589899	\N	backfill	\N	0.34	3.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.1	0.1	14.1	25.2	51
726	2021-12-24	2026-03-28 08:22:58.036401	\N	backfill	\N	0.08	3.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.7	0	9.2	18.4	3
727	2021-12-25	2026-03-28 08:22:58.482994	\N	backfill	\N	0.16	4.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.4	13	12.7	25.6	63
728	2021-12-26	2026-03-28 08:22:58.929894	\N	backfill	\N	0.3	5.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.6	2.4	11.8	20.5	53
729	2021-12-27	2026-03-28 08:22:59.376585	\N	backfill	\N	0.4	4.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.7	0.8	11.5	20.5	51
730	2021-12-28	2026-03-28 08:22:59.823335	\N	backfill	\N	0.16	5.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.2	0.5	11.2	20.2	51
731	2021-12-29	2026-03-28 08:23:00.270011	\N	backfill	\N	0.1	4.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.4	0	11.4	22	3
732	2021-12-30	2026-03-28 08:23:00.716712	\N	backfill	\N	0.12	4.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.8	0	11.4	22	3
733	2021-12-31	2026-03-28 08:23:01.163897	\N	backfill	\N	0.04	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.8	0	9.6	18	3
734	2022-01-01	2026-03-28 08:23:01.61162	\N	backfill	\N	0.04	2.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.3	0	9	19.8	3
735	2022-01-02	2026-03-28 08:23:02.0585	\N	backfill	\N	0.04	2.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4	0	11.1	22.7	3
736	2022-01-03	2026-03-28 08:23:02.505832	\N	backfill	\N	0.1	2.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.5	0	9.2	17.3	3
737	2022-01-04	2026-03-28 08:23:02.953586	\N	backfill	\N	0.16	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.6	0.1	15.9	28.1	51
738	2022-01-05	2026-03-28 08:23:03.400536	\N	backfill	\N	0.94	5.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.2	20.3	58.6	103.7	73
739	2022-01-06	2026-03-28 08:23:03.847721	\N	backfill	\N	1.28	5.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.4	14.9	45.1	80.6	63
740	2022-01-07	2026-03-28 08:23:04.294697	\N	backfill	\N	0.88	4.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.5	0	28.5	49.7	3
741	2022-01-08	2026-03-28 08:23:04.741747	\N	backfill	\N	0.5	3.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.5	0	16.3	31	3
742	2022-01-09	2026-03-28 08:23:05.188555	\N	backfill	\N	0.42	2.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4	5	17.9	34.6	53
743	2022-01-10	2026-03-28 08:23:05.63445	\N	backfill	\N	0.74	4.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.8	0.1	19.8	33.8	51
744	2022-01-11	2026-03-28 08:23:06.080501	\N	backfill	\N	1.14	5.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.8	0	36.7	63.4	0
745	2022-01-12	2026-03-28 08:23:06.527512	\N	backfill	\N	1.22	5.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.7	0	34.9	62.3	3
746	2022-01-13	2026-03-28 08:23:06.974567	\N	backfill	\N	0.88	4.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.5	0	25.5	44.3	2
747	2022-01-14	2026-03-28 08:23:07.420477	\N	backfill	\N	0.24	5.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.5	0	14.1	24.5	0
748	2022-01-15	2026-03-28 08:23:07.867765	\N	backfill	\N	0.24	4.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.3	0	13.7	26.6	0
749	2022-01-16	2026-03-28 08:23:08.314996	\N	backfill	\N	0.26	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5	0	10.7	19.4	0
750	2022-01-17	2026-03-28 08:23:08.761908	\N	backfill	\N	0.16	2.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.5	0	11	19.1	3
751	2022-01-18	2026-03-28 08:23:09.208856	\N	backfill	\N	0.48	3.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.1	0	26.4	44.3	3
752	2022-01-19	2026-03-28 08:23:09.657132	\N	backfill	\N	0.18	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.1	0	11.3	19.1	3
753	2022-01-20	2026-03-28 08:23:10.10404	\N	backfill	\N	0.2	4.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.1	1.3	14.5	28.1	53
754	2022-01-21	2026-03-28 08:23:10.550878	\N	backfill	\N	0.48	4.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.2	0.2	23	41.4	51
755	2022-01-22	2026-03-28 08:23:10.998099	\N	backfill	\N	0.38	4.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.1	0	15.5	29.5	3
756	2022-01-23	2026-03-28 08:23:11.44503	\N	backfill	\N	0.26	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.2	0	13.4	24.1	3
757	2022-01-24	2026-03-28 08:23:11.892052	\N	backfill	\N	0.48	4.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.2	0	16	26.3	3
758	2022-01-25	2026-03-28 08:23:12.338977	\N	backfill	\N	0.5	4.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.9	0	14.6	26.3	3
759	2022-01-26	2026-03-28 08:23:12.786213	\N	backfill	\N	0.12	4.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2.8	0	9.8	18.7	3
760	2022-01-27	2026-03-28 08:23:13.233757	\N	backfill	\N	0.04	2.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2.9	0	9.4	18	3
761	2022-01-28	2026-03-28 08:23:13.680781	\N	backfill	\N	0.14	2.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.4	0	14.5	29.2	3
762	2022-01-29	2026-03-28 08:23:14.127883	\N	backfill	\N	0.26	2.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.3	0	10.2	16.6	3
763	2022-01-30	2026-03-28 08:23:14.575162	\N	backfill	\N	0.1	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2.7	0	11.5	21.6	3
764	2022-01-31	2026-03-28 08:23:15.021991	\N	backfill	\N	0.24	2.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.3	0	13.5	25.2	3
765	2022-02-01	2026-03-28 08:23:15.468869	\N	backfill	\N	0.26	4.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.4	0	21.3	36.7	3
766	2022-02-02	2026-03-28 08:23:15.916563	\N	backfill	\N	0.26	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.9	0	14	30.6	3
767	2022-02-03	2026-03-28 08:23:16.363601	\N	backfill	\N	0.48	3.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.3	0	22.4	40.7	3
768	2022-02-04	2026-03-28 08:23:16.810512	\N	backfill	\N	0.4	4.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.9	0	10.3	18.4	3
769	2022-02-05	2026-03-28 08:23:17.257667	\N	backfill	\N	0.3	5.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.7	0	9.4	20.9	3
770	2022-02-06	2026-03-28 08:23:17.704927	\N	backfill	\N	0.24	5.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.8	0	10.6	20.2	3
771	2022-02-07	2026-03-28 08:23:18.152561	\N	backfill	\N	0.36	5.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.6	0	31.8	54.4	3
772	2022-02-08	2026-03-28 08:23:18.599779	\N	backfill	\N	0.26	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.2	0	13	22.7	1
773	2022-02-09	2026-03-28 08:23:19.046713	\N	backfill	\N	0.02	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.5	0	8.2	19.4	1
774	2022-02-10	2026-03-28 08:23:19.493858	\N	backfill	\N	0.02	2.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.3	0	10.7	19.8	3
775	2022-02-11	2026-03-28 08:23:19.941743	\N	backfill	\N	0.22	2.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.7	0.1	35.5	56.2	51
776	2022-02-12	2026-03-28 08:23:20.390077	\N	backfill	\N	0.62	3.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.3	2.5	38.1	69.1	61
777	2022-02-13	2026-03-28 08:23:20.837178	\N	backfill	\N	0.4	3.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.9	0	10.6	22.3	3
778	2022-02-14	2026-03-28 08:23:21.283313	\N	backfill	\N	0.22	3.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.9	0.2	14.3	25.6	51
779	2022-02-15	2026-03-28 08:23:21.732057	\N	backfill	\N	0.58	6.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.6	8.9	25.6	44.3	61
780	2022-02-16	2026-03-28 08:23:22.179147	\N	backfill	\N	0.42	6.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.8	0	9.5	20.9	3
781	2022-02-17	2026-03-28 08:23:22.625596	\N	backfill	\N	0.16	6.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.8	0	10.5	22	3
782	2022-02-18	2026-03-28 08:23:23.071648	\N	backfill	\N	0.24	5.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.5	0	14.7	25.2	3
783	2022-02-19	2026-03-28 08:23:23.518029	\N	backfill	\N	0.16	4.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.9	3.4	14.8	25.2	61
784	2022-02-20	2026-03-28 08:23:23.965046	\N	backfill	\N	0.22	5.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.9	0.9	14.8	27.4	51
785	2022-02-21	2026-03-28 08:23:24.411723	\N	backfill	\N	0.2	5.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.5	2	16.7	31.3	53
786	2022-02-22	2026-03-28 08:23:24.858667	\N	backfill	\N	0.18	4.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.9	0	12.5	27.4	3
787	2022-02-23	2026-03-28 08:23:25.304483	\N	backfill	\N	0.12	4.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.8	0	10.5	23.8	0
788	2022-02-24	2026-03-28 08:23:25.751119	\N	backfill	\N	0.08	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.6	0	12	23.4	3
789	2022-02-25	2026-03-28 08:23:26.197994	\N	backfill	\N	0.64	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.6	4.3	51.6	90.4	61
790	2022-02-26	2026-03-28 08:23:26.644935	\N	backfill	\N	1.4	5.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.8	0.3	35.6	60.8	51
791	2022-02-27	2026-03-28 08:23:27.09184	\N	backfill	\N	1.32	5.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.3	0	36.6	66.2	3
792	2022-02-28	2026-03-28 08:23:27.538603	\N	backfill	\N	1.06	4.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.5	0.2	27.8	49.3	51
793	2022-03-01	2026-03-28 08:23:27.984271	\N	backfill	\N	1.04	5.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6	0	29.6	52.2	2
794	2022-03-02	2026-03-28 08:23:28.431207	\N	backfill	\N	0.14	4.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.3	0	11.3	19.4	3
795	2022-03-03	2026-03-28 08:23:28.877995	\N	backfill	\N	0.06	5.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.2	0	12.4	24.1	3
796	2022-03-04	2026-03-28 08:23:29.325384	\N	backfill	\N	0.64	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.8	0.6	22.2	36	51
797	2022-03-05	2026-03-28 08:23:29.772204	\N	backfill	\N	0.92	4.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.7	0	29.8	54.4	3
798	2022-03-06	2026-03-28 08:23:30.219181	\N	backfill	\N	0.96	4.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.5	0	27.7	47.9	3
799	2022-03-07	2026-03-28 08:23:30.666199	\N	backfill	\N	0.72	4.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.1	0	23.4	42.1	3
800	2022-03-08	2026-03-28 08:23:31.113021	\N	backfill	\N	0.72	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.8	0	26.4	45.7	3
801	2022-03-09	2026-03-28 08:23:31.560148	\N	backfill	\N	0.14	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.6	0	12.1	21.2	3
802	2022-03-10	2026-03-28 08:23:32.011076	\N	backfill	\N	0.4	4.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.8	0	26	43.6	0
803	2022-03-11	2026-03-28 08:23:32.458173	\N	backfill	\N	0.66	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.7	0	27.1	46.8	3
804	2022-03-12	2026-03-28 08:23:32.905229	\N	backfill	\N	0.42	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.1	0	17.7	31	3
805	2022-03-13	2026-03-28 08:23:33.352728	\N	backfill	\N	0.16	4.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.3	0	11	24.8	2
806	2022-03-14	2026-03-28 08:23:33.799765	\N	backfill	\N	0.14	4.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.7	0	12.9	24.8	3
807	2022-03-15	2026-03-28 08:23:34.247182	\N	backfill	\N	0.12	3.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.8	0	10.4	22.7	3
808	2022-03-16	2026-03-28 08:23:34.697431	\N	backfill	\N	0.08	3.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.6	0	15.4	28.8	3
809	2022-03-17	2026-03-28 08:23:35.144762	\N	backfill	\N	0.22	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.4	0	13.8	24.5	3
810	2022-03-18	2026-03-28 08:23:35.592249	\N	backfill	\N	0.8	4.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.3	0	24.8	42.5	3
811	2022-03-19	2026-03-28 08:23:36.03947	\N	backfill	\N	1.06	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.1	0	22.6	38.2	1
812	2022-03-20	2026-03-28 08:23:36.48552	\N	backfill	\N	0.48	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9	0	21.4	40.3	2
813	2022-03-21	2026-03-28 08:23:38.295343	\N	backfill	\N	0.44	5.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.9	0	15.6	31.3	2
814	2022-03-22	2026-03-28 08:23:38.742586	\N	backfill	\N	0.52	5.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.7	0	17.6	32	0
815	2022-03-23	2026-03-28 08:23:39.188279	\N	backfill	\N	0.18	4.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.9	0	11.8	24.1	0
816	2022-03-24	2026-03-28 08:23:39.634913	\N	backfill	\N	0.04	2.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11	0	11.4	19.4	0
817	2022-03-25	2026-03-28 08:23:40.08216	\N	backfill	\N	0.02	2.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.6	0	12	20.2	3
818	2022-03-26	2026-03-28 08:23:40.53093	\N	backfill	\N	0.1	2.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.5	0	12.2	22.3	3
819	2022-03-27	2026-03-28 08:23:40.977794	\N	backfill	\N	0.04	2.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12	0	11.5	21.6	2
820	2022-03-28	2026-03-28 08:23:41.425123	\N	backfill	\N	0.24	2.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10	0	15.5	31.3	2
821	2022-03-29	2026-03-28 08:23:41.872481	\N	backfill	\N	0.26	3.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.2	0	15.3	32.8	3
822	2022-03-30	2026-03-28 08:23:42.318728	\N	backfill	\N	0.26	4.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.2	1	9	16.9	51
823	2022-03-31	2026-03-28 08:23:42.766079	\N	backfill	\N	0.54	7.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.6	20.4	19.7	38.9	63
824	2022-04-01	2026-03-28 08:23:43.213524	\N	backfill	\N	0.48	7.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.7	2.3	22	40.7	61
825	2022-04-02	2026-03-28 08:23:43.65928	\N	backfill	\N	0.42	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.3	2.6	21.2	39.2	53
826	2022-04-03	2026-03-28 08:23:44.106646	\N	backfill	\N	0.62	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.9	3	31.6	55.4	61
827	2022-04-04	2026-03-28 08:23:44.552605	\N	backfill	\N	0.32	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.2	0.5	15.5	27	51
828	2022-04-05	2026-03-28 08:23:45.000329	\N	backfill	\N	0.12	2.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.7	0	17.3	33.8	2
829	2022-04-06	2026-03-28 08:23:45.447666	\N	backfill	\N	0.28	3.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.2	0	17.7	35.6	3
830	2022-04-07	2026-03-28 08:23:45.893499	\N	backfill	\N	0.34	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.8	0	22.8	41.4	3
831	2022-04-08	2026-03-28 08:23:46.341529	\N	backfill	\N	0.48	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.3	0	29.8	50.4	3
832	2022-04-09	2026-03-28 08:23:46.788261	\N	backfill	\N	2.5	6.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.5	7	59.1	104.4	61
833	2022-04-10	2026-03-28 08:23:47.235662	\N	backfill	\N	0.96	5.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10	0	21.7	40.7	3
834	2022-04-11	2026-03-28 08:23:47.682795	\N	backfill	\N	0.22	2.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.1	0	15.5	32.4	3
835	2022-04-12	2026-03-28 08:23:48.129619	\N	backfill	\N	0.2	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.1	0	10	24.8	3
836	2022-04-13	2026-03-28 08:23:48.577267	\N	backfill	\N	0.08	3.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.4	0	10.2	24.8	3
837	2022-04-14	2026-03-28 08:23:49.024293	\N	backfill	\N	0.08	3.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.8	0	12.2	24.5	3
838	2022-04-15	2026-03-28 08:23:49.471073	\N	backfill	\N	0.04	2.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14	0	10.5	23.4	3
839	2022-04-16	2026-03-28 08:23:49.917857	\N	backfill	\N	0.88	4.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.7	0	38.3	65.5	3
840	2022-04-17	2026-03-28 08:23:50.365132	\N	backfill	\N	1.32	5.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.2	0	41.9	74.2	3
841	2022-04-18	2026-03-28 08:23:50.812098	\N	backfill	\N	0.72	4.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.1	0	27.4	46.8	3
842	2022-04-19	2026-03-28 08:23:51.259192	\N	backfill	\N	0.5	4.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.7	0	16.6	32	3
843	2022-04-20	2026-03-28 08:23:51.705652	\N	backfill	\N	0.7	4.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.6	0	26.3	44.6	3
844	2022-04-21	2026-03-28 08:23:52.152724	\N	backfill	\N	0.62	3.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.7	6.9	25.7	45.7	63
845	2022-04-22	2026-03-28 08:23:52.599927	\N	backfill	\N	1.14	5.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.5	17.8	33.4	57.6	61
846	2022-04-23	2026-03-28 08:23:53.046926	\N	backfill	\N	0.46	6.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.8	0.7	31.7	55.1	53
847	2022-04-24	2026-03-28 08:23:53.494034	\N	backfill	\N	0.46	4.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.2	7.2	27	52.6	63
848	2022-04-25	2026-03-28 08:23:53.94089	\N	backfill	\N	0.26	4.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13	0.1	17.9	34.9	51
849	2022-04-26	2026-03-28 08:23:54.388079	\N	backfill	\N	0.24	3.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.8	8.2	14.4	32.4	63
850	2022-04-27	2026-03-28 08:23:54.834955	\N	backfill	\N	0.38	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.1	0	16.4	33.5	3
851	2022-04-28	2026-03-28 08:23:55.2821	\N	backfill	\N	0.24	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.5	0	12.3	26.3	3
852	2022-04-29	2026-03-28 08:23:55.729036	\N	backfill	\N	0.46	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.8	0	19.9	37.1	1
853	2022-04-30	2026-03-28 08:23:56.183939	\N	backfill	\N	0.22	2.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.9	0	13.2	27.7	3
854	2022-05-01	2026-03-28 08:23:56.640693	\N	backfill	\N	0.42	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.7	0.3	20.6	35.6	51
855	2022-05-02	2026-03-28 08:23:57.087778	\N	backfill	\N	0.48	3.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.9	0	20	38.2	3
856	2022-05-03	2026-03-28 08:23:57.534722	\N	backfill	\N	0.16	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.9	0	10.2	22.7	3
857	2022-05-04	2026-03-28 08:23:57.98173	\N	backfill	\N	0.06	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.6	0	12.6	27	3
858	2022-05-05	2026-03-28 08:23:58.429024	\N	backfill	\N	0.44	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.3	4.5	21	40	55
859	2022-05-06	2026-03-28 08:23:58.875917	\N	backfill	\N	0.66	4.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.3	17.5	23.8	41.8	63
860	2022-05-07	2026-03-28 08:23:59.322803	\N	backfill	\N	0.5	4.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16	1.3	16.2	32.8	53
861	2022-05-08	2026-03-28 08:23:59.769774	\N	backfill	\N	0.42	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.4	3.8	18.4	37.8	63
862	2022-05-09	2026-03-28 08:24:00.216809	\N	backfill	\N	0.36	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.8	0	17.8	29.5	3
863	2022-05-10	2026-03-28 08:24:00.663797	\N	backfill	\N	0.14	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.1	0	10.1	20.9	1
864	2022-05-11	2026-03-28 08:24:01.110774	\N	backfill	\N	0.12	4.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.1	0	16.4	31.7	3
865	2022-05-12	2026-03-28 08:24:01.557953	\N	backfill	\N	0.14	2.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.8	0	16.7	28.1	3
866	2022-05-13	2026-03-28 08:24:02.004935	\N	backfill	\N	0.12	2.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.4	0	13.5	27.4	3
867	2022-05-14	2026-03-28 08:24:02.451973	\N	backfill	\N	0.06	2.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21	0	12	27	3
868	2022-05-15	2026-03-28 08:24:02.89952	\N	backfill	\N	0.08	2.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.7	0	11.3	23.8	3
869	2022-05-16	2026-03-28 08:24:03.346669	\N	backfill	\N	0.18	2.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.9	0	13	21.6	3
870	2022-05-17	2026-03-28 08:24:03.793857	\N	backfill	\N	0.16	2.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.1	0.7	15.2	27.4	53
871	2022-05-18	2026-03-28 08:24:04.241077	\N	backfill	\N	0.36	3.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.6	0	22.7	40.3	3
872	2022-05-19	2026-03-28 08:24:04.687903	\N	backfill	\N	0.48	3.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.6	0	20.5	34.6	2
873	2022-05-20	2026-03-28 08:24:05.134956	\N	backfill	\N	0.22	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.5	0	16.7	33.8	3
874	2022-05-21	2026-03-28 08:24:05.582065	\N	backfill	\N	0.14	2.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.4	0	11.5	29.5	3
875	2022-05-22	2026-03-28 08:24:06.028859	\N	backfill	\N	0.04	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.4	0	9.2	23	3
876	2022-05-23	2026-03-28 08:24:06.475225	\N	backfill	\N	0.22	2.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.4	0	14.5	33.5	3
877	2022-05-24	2026-03-28 08:24:06.921687	\N	backfill	\N	0.66	4.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.6	1.1	21.9	41.4	55
878	2022-05-25	2026-03-28 08:24:07.368745	\N	backfill	\N	0.5	4.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.5	0	24.3	45.4	3
879	2022-05-26	2026-03-28 08:24:07.815806	\N	backfill	\N	0.26	4.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.2	0.3	19.1	37.8	51
880	2022-05-27	2026-03-28 08:24:08.261816	\N	backfill	\N	0.18	5.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.1	0	15.6	30.2	3
881	2022-05-28	2026-03-28 08:24:08.708585	\N	backfill	\N	1.28	5.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21	5	29.8	58.7	63
882	2022-05-29	2026-03-28 08:24:09.155794	\N	backfill	\N	1.22	5.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.3	12.3	29.3	52.6	63
883	2022-05-30	2026-03-28 08:24:09.603153	\N	backfill	\N	0.64	4.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.7	2	20.1	35.3	53
884	2022-05-31	2026-03-28 08:24:10.04992	\N	backfill	\N	0.2	4.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.9	1.4	13.3	29.2	55
885	2022-06-01	2026-03-28 08:24:10.496935	\N	backfill	\N	0.16	4.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.2	2.9	10.9	26.6	61
886	2022-06-02	2026-03-28 08:24:10.944744	\N	backfill	\N	0.14	3.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.6	0	12.3	29.2	3
887	2022-06-03	2026-03-28 08:24:11.391976	\N	backfill	\N	0.34	3.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.9	0.3	17.7	35.6	51
888	2022-06-04	2026-03-28 08:24:11.839518	\N	backfill	\N	0.06	2.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23	0	16	32	3
889	2022-06-05	2026-03-28 08:24:12.286673	\N	backfill	\N	0.28	2.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.8	0	16.4	32.8	3
890	2022-06-06	2026-03-28 08:24:12.733992	\N	backfill	\N	0.16	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.7	0	12.8	27.7	3
891	2022-06-07	2026-03-28 08:24:13.181048	\N	backfill	\N	0.34	2.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.8	5.7	20.4	37.8	61
892	2022-06-08	2026-03-28 08:24:13.628084	\N	backfill	\N	0.4	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.2	2.6	20.3	36.4	63
893	2022-06-09	2026-03-28 08:24:14.074885	\N	backfill	\N	0.74	3.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.8	42.8	29.8	52.9	65
894	2022-06-10	2026-03-28 08:24:14.521908	\N	backfill	\N	0.34	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23	0	22.1	41.4	3
895	2022-06-11	2026-03-28 08:24:14.968922	\N	backfill	\N	0.38	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.1	0	17.4	29.5	1
896	2022-06-12	2026-03-28 08:24:15.416607	\N	backfill	\N	0.06	2.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.4	0	14.8	25.9	1
897	2022-06-13	2026-03-28 08:24:15.863488	\N	backfill	\N	0.2	2.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.2	0	15.3	30.6	3
898	2022-06-14	2026-03-28 08:24:16.310549	\N	backfill	\N	0.72	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.6	0	23.4	42.5	1
899	2022-06-15	2026-03-28 08:24:16.7575	\N	backfill	\N	0.16	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.7	0	13.1	27.7	3
900	2022-06-16	2026-03-28 08:24:17.204542	\N	backfill	\N	0.1	2.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.1	0.3	14.8	29.5	51
901	2022-06-17	2026-03-28 08:24:17.653771	\N	backfill	\N	0.18	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.4	0	20.1	35.3	3
902	2022-06-18	2026-03-28 08:24:18.101172	\N	backfill	\N	0.34	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.1	0	20.6	38.2	3
903	2022-06-19	2026-03-28 08:24:19.582967	\N	backfill	\N	0.16	2.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.6	0	14	31	1
904	2022-06-20	2026-03-28 08:24:20.029697	\N	backfill	\N	0.34	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.1	0	19.6	37.8	3
905	2022-06-21	2026-03-28 08:24:20.477074	\N	backfill	\N	0.38	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.2	0	19.7	34.9	3
906	2022-06-22	2026-03-28 08:24:20.92454	\N	backfill	\N	0.24	2.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.4	4.5	20.1	37.8	61
907	2022-06-23	2026-03-28 08:24:21.371772	\N	backfill	\N	0.12	2.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.6	0	21.2	38.2	3
908	2022-06-24	2026-03-28 08:24:21.818566	\N	backfill	\N	0.2	2.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.1	0.1	22.4	41	51
909	2022-06-25	2026-03-28 08:24:22.265398	\N	backfill	\N	0.28	4.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.5	0	17.9	32.8	3
910	2022-06-26	2026-03-28 08:24:22.712468	\N	backfill	\N	0.24	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.7	0	14.8	29.9	1
911	2022-06-27	2026-03-28 08:24:23.159252	\N	backfill	\N	0.3	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.4	0	18.2	36.7	0
912	2022-06-28	2026-03-28 08:24:23.605073	\N	backfill	\N	0.44	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.3	1.1	33.1	58.7	53
913	2022-06-29	2026-03-28 08:24:24.050196	\N	backfill	\N	0.42	3.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.4	1.2	24.7	48.2	51
914	2022-06-30	2026-03-28 08:24:24.495329	\N	backfill	\N	0.18	3.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.2	0	11.3	26.6	1
915	2022-07-01	2026-03-28 08:24:24.940344	\N	backfill	\N	0.62	3.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.5	0.1	30.5	53.3	51
916	2022-07-02	2026-03-28 08:24:25.385405	\N	backfill	\N	0.32	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27	0	14.8	28.8	3
917	2022-07-03	2026-03-28 08:24:25.830715	\N	backfill	\N	0.12	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.9	0	13.9	26.6	3
918	2022-07-04	2026-03-28 08:24:26.275979	\N	backfill	\N	0.14	2.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.3	0.1	25.5	48.2	51
919	2022-07-05	2026-03-28 08:24:26.725934	\N	backfill	\N	0.4	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.4	0.3	15.8	35.3	51
920	2022-07-06	2026-03-28 08:24:27.171191	\N	backfill	\N	0.52	3.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.8	0	29	54	2
921	2022-07-07	2026-03-28 08:24:27.617598	\N	backfill	\N	0.8	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.7	0	30.7	59.4	3
922	2022-07-08	2026-03-28 08:24:28.063092	\N	backfill	\N	0.58	3.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25	0	15.7	32.4	0
923	2022-07-09	2026-03-28 08:24:28.508215	\N	backfill	\N	0.56	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.9	0	19.6	33.5	3
924	2022-07-10	2026-03-28 08:24:28.953169	\N	backfill	\N	0.24	3.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.1	0	18.1	33.1	3
925	2022-07-11	2026-03-28 08:24:29.398929	\N	backfill	\N	0.58	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.4	0.2	24.2	46.1	51
926	2022-07-12	2026-03-28 08:24:29.844097	\N	backfill	\N	0.42	3.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.5	0.8	27.8	46.4	51
927	2022-07-13	2026-03-28 08:24:30.28912	\N	backfill	\N	0.2	3.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.9	0	15.2	31	3
928	2022-07-14	2026-03-28 08:24:30.73474	\N	backfill	\N	0.04	2.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.2	0	12.1	25.2	3
929	2022-07-15	2026-03-28 08:24:31.17883	\N	backfill	\N	0.16	2.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.3	0	16.6	35.6	2
930	2022-07-16	2026-03-28 08:24:31.624389	\N	backfill	\N	0.46	3.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.5	0	21.2	35.6	3
931	2022-07-17	2026-03-28 08:24:32.068437	\N	backfill	\N	0.78	4.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.8	0	23	50.8	3
932	2022-07-18	2026-03-28 08:24:32.513634	\N	backfill	\N	0.26	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.5	0	14.8	29.9	3
933	2022-07-19	2026-03-28 08:24:32.958614	\N	backfill	\N	0.1	2.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.2	0	10	25.6	2
934	2022-07-20	2026-03-28 08:24:33.404096	\N	backfill	\N	0.08	2.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.8	0	10.5	22.7	0
935	2022-07-21	2026-03-28 08:24:33.849217	\N	backfill	\N	0.04	2.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.8	0	10	24.1	1
936	2022-07-22	2026-03-28 08:24:34.29475	\N	backfill	\N	0.02	2.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.2	0	8.9	23.8	3
937	2022-07-23	2026-03-28 08:24:34.74014	\N	backfill	\N	0.18	2.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.7	0	10.7	23.8	3
938	2022-07-24	2026-03-28 08:24:35.186053	\N	backfill	\N	0.42	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.5	0	20.8	34.2	2
939	2022-07-25	2026-03-28 08:24:35.630543	\N	backfill	\N	0.12	2.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	29.1	0	15.5	31	3
940	2022-07-26	2026-03-28 08:24:36.075961	\N	backfill	\N	0.38	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.3	0.6	15.1	69.1	51
941	2022-07-27	2026-03-28 08:24:36.521198	\N	backfill	\N	0.58	3.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.5	1.8	20.7	41	61
942	2022-07-28	2026-03-28 08:24:36.96594	\N	backfill	\N	0.42	3.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.6	0	14.5	31	3
943	2022-07-29	2026-03-28 08:24:37.410887	\N	backfill	\N	0.18	2.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.8	0.1	11.4	25.2	51
944	2022-07-30	2026-03-28 08:24:37.856408	\N	backfill	\N	0.16	2.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.6	20.9	16.7	30.6	65
945	2022-07-31	2026-03-28 08:24:38.301439	\N	backfill	\N	0.2	2.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.4	0	17.4	32	1
946	2022-08-01	2026-03-28 08:24:38.746943	\N	backfill	\N	0.12	2.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.5	0	13.2	28.1	0
947	2022-08-02	2026-03-28 08:24:39.191576	\N	backfill	\N	0.62	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26	1.1	33.6	59	53
948	2022-08-03	2026-03-28 08:24:39.638244	\N	backfill	\N	0.18	2.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.3	0	9.6	22	0
949	2022-08-04	2026-03-28 08:24:40.083438	\N	backfill	\N	0.06	2.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.7	0	10	20.2	1
950	2022-08-05	2026-03-28 08:24:40.529277	\N	backfill	\N	0.02	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.3	0	10.2	24.8	0
951	2022-08-06	2026-03-28 08:24:40.974303	\N	backfill	\N	0.76	4.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.4	0	31.8	59	1
952	2022-08-07	2026-03-28 08:24:41.419438	\N	backfill	\N	0.72	4.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.4	5.3	19.5	33.1	63
953	2022-08-08	2026-03-28 08:24:41.865839	\N	backfill	\N	0.46	3.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.9	0	22.1	39.2	3
954	2022-08-09	2026-03-28 08:24:42.312481	\N	backfill	\N	0.6	3.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.2	0	17.4	32.8	3
955	2022-08-10	2026-03-28 08:24:42.757572	\N	backfill	\N	0.58	3.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26	0	23.7	44.3	3
956	2022-08-11	2026-03-28 08:24:43.203224	\N	backfill	\N	0.62	3.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.1	0	24.1	43.6	3
957	2022-08-12	2026-03-28 08:24:43.649125	\N	backfill	\N	0.62	3.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.5	1.7	32.4	65.2	61
958	2022-08-13	2026-03-28 08:24:44.094635	\N	backfill	\N	0.56	3.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24	2.1	17.6	36.4	61
959	2022-08-14	2026-03-28 08:24:44.539851	\N	backfill	\N	0.46	3.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.8	0	15.3	28.4	3
960	2022-08-15	2026-03-28 08:24:44.984601	\N	backfill	\N	0.36	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.3	0.2	15.6	31	51
961	2022-08-16	2026-03-28 08:24:45.429719	\N	backfill	\N	0.4	4.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.5	0.3	26.2	45.4	51
962	2022-08-17	2026-03-28 08:24:45.874836	\N	backfill	\N	0.28	4.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.9	0.1	15.6	33.1	51
963	2022-08-18	2026-03-28 08:24:46.319715	\N	backfill	\N	0.66	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.2	2.5	23.1	42.1	55
964	2022-08-19	2026-03-28 08:24:46.764217	\N	backfill	\N	0.76	3.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.6	3	27.6	51.8	61
965	2022-08-20	2026-03-28 08:24:47.209099	\N	backfill	\N	0.28	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.8	0	14.6	27.4	3
966	2022-08-21	2026-03-28 08:24:47.654047	\N	backfill	\N	0.08	2.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.9	0	18.2	31.3	1
967	2022-08-22	2026-03-28 08:24:48.099107	\N	backfill	\N	0.2	2.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.1	0	16.6	28.1	1
968	2022-08-23	2026-03-28 08:24:48.544067	\N	backfill	\N	0.32	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.1	0	18.4	31.3	3
969	2022-08-24	2026-03-28 08:24:48.989172	\N	backfill	\N	0.42	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.3	0	20.3	34.9	1
970	2022-08-25	2026-03-28 08:24:49.434927	\N	backfill	\N	0.32	2.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.5	0	17.3	32.8	1
971	2022-08-26	2026-03-28 08:24:49.880574	\N	backfill	\N	0.22	2.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.9	0	16.9	29.5	2
972	2022-08-27	2026-03-28 08:24:50.326339	\N	backfill	\N	0.24	2.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.8	0.9	14.6	29.2	53
973	2022-08-28	2026-03-28 08:24:50.770897	\N	backfill	\N	0.24	2.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.1	1	15.6	37.1	53
974	2022-08-29	2026-03-28 08:24:51.216066	\N	backfill	\N	0.18	2.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.2	0.3	20.1	35.3	51
975	2022-08-30	2026-03-28 08:24:51.661953	\N	backfill	\N	0.42	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.3	0.7	17.8	36	51
976	2022-08-31	2026-03-28 08:24:52.107169	\N	backfill	\N	0.3	3.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.1	8.6	16.6	31.7	63
977	2022-09-01	2026-03-28 08:24:52.552244	\N	backfill	\N	0.58	4.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.6	0.4	26.2	45	51
978	2022-09-02	2026-03-28 08:24:52.997833	\N	backfill	\N	0.66	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.1	0.1	13.5	25.9	51
979	2022-09-03	2026-03-28 08:24:53.443294	\N	backfill	\N	0.1	2.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.1	0.5	14.1	28.4	51
980	2022-09-04	2026-03-28 08:24:53.888278	\N	backfill	\N	0.22	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.5	0.3	13.2	27.4	51
981	2022-09-05	2026-03-28 08:24:54.333615	\N	backfill	\N	0.12	2.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.7	0	11.1	20.2	3
982	2022-09-06	2026-03-28 08:24:54.779062	\N	backfill	\N	0.08	3.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.5	0	14	27.4	3
983	2022-09-07	2026-03-28 08:24:55.224158	\N	backfill	\N	0.46	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.2	8.7	21	39.2	65
984	2022-09-08	2026-03-28 08:24:55.669363	\N	backfill	\N	0.42	3.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.3	1	21.4	38.9	53
985	2022-09-09	2026-03-28 08:24:56.114705	\N	backfill	\N	0.52	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.3	0.8	23.9	42.8	53
986	2022-09-10	2026-03-28 08:24:56.559973	\N	backfill	\N	0.46	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.2	2.3	14.4	25.2	61
987	2022-09-11	2026-03-28 08:24:57.004789	\N	backfill	\N	0.46	3.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.7	0.6	25.5	48.2	51
988	2022-09-12	2026-03-28 08:24:57.449548	\N	backfill	\N	0.14	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.7	0	10.2	21.6	2
989	2022-09-13	2026-03-28 08:24:57.894309	\N	backfill	\N	0.2	2.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.2	0	14.5	29.2	3
990	2022-09-14	2026-03-28 08:24:58.33952	\N	backfill	\N	0.34	3.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.4	0	20.7	40	3
991	2022-09-15	2026-03-28 08:24:58.785297	\N	backfill	\N	0.42	4.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.6	0	27.3	45.7	3
992	2022-09-16	2026-03-28 08:24:59.230667	\N	backfill	\N	0.32	4.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.6	3.3	22.4	45	61
993	2022-09-17	2026-03-28 08:25:01.053447	\N	backfill	\N	1.76	6.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.8	36.6	50.4	87.5	63
994	2022-09-18	2026-03-28 08:25:01.499501	\N	backfill	\N	0.3	4.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.9	0	12.4	23.8	2
995	2022-09-19	2026-03-28 08:25:01.945091	\N	backfill	\N	0.18	4.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.3	0	20	30.6	3
996	2022-09-20	2026-03-28 08:25:02.390665	\N	backfill	\N	0.44	4.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.8	0	20	38.5	1
997	2022-09-21	2026-03-28 08:25:02.835679	\N	backfill	\N	0.78	4.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.4	0.4	23.6	42.8	51
998	2022-09-22	2026-03-28 08:25:03.279847	\N	backfill	\N	0.36	3.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.7	0	10.6	19.4	3
999	2022-09-23	2026-03-28 08:25:03.725172	\N	backfill	\N	0.14	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17	0	13.2	24.8	3
1000	2022-09-24	2026-03-28 08:25:04.170355	\N	backfill	\N	0.54	3.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.5	11.3	25.6	42.8	63
1001	2022-09-25	2026-03-28 08:25:04.615112	\N	backfill	\N	0.64	5.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.4	2	31	52.2	61
1002	2022-09-26	2026-03-28 08:25:05.060127	\N	backfill	\N	0.32	5.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.3	5.3	12.9	27	63
1003	2022-09-27	2026-03-28 08:25:05.506277	\N	backfill	\N	0.3	4.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.8	0.4	20.3	35.6	51
1004	2022-09-28	2026-03-28 08:25:05.951741	\N	backfill	\N	0.36	4.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.9	0.8	20.9	35.6	51
1005	2022-09-29	2026-03-28 08:25:06.397456	\N	backfill	\N	0.42	4.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.4	0.1	23.8	42.8	51
1006	2022-09-30	2026-03-28 08:25:06.843396	\N	backfill	\N	0.36	4.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.3	36.2	19.4	31.7	65
1007	2022-10-01	2026-03-28 08:25:07.288753	\N	backfill	\N	0.38	4.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.6	1	19.5	37.1	53
1008	2022-10-02	2026-03-28 08:25:07.733735	\N	backfill	\N	0.2	4.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.8	0	15.5	28.8	3
1009	2022-10-03	2026-03-28 08:25:08.180305	\N	backfill	\N	0.18	3.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.9	0	14.1	25.9	3
1010	2022-10-04	2026-03-28 08:25:08.626675	\N	backfill	\N	0.32	3.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.2	0.7	12.8	26.6	51
1011	2022-10-05	2026-03-28 08:25:09.072	\N	backfill	\N	0.24	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19	0	11.2	24.1	3
1012	2022-10-06	2026-03-28 08:25:09.516703	\N	backfill	\N	0.06	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.1	0	9.1	20.5	3
1013	2022-10-07	2026-03-28 08:25:09.963055	\N	backfill	\N	0.18	2.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.7	0	12	25.2	3
1014	2022-10-08	2026-03-28 08:25:10.408313	\N	backfill	\N	0.08	2.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.9	0	10.5	19.8	3
1015	2022-10-09	2026-03-28 08:25:10.852942	\N	backfill	\N	0.38	3.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.9	0.5	23.5	44.3	51
1016	2022-10-10	2026-03-28 08:25:11.298109	\N	backfill	\N	0.38	3.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.9	1.8	12.5	23.8	55
1017	2022-10-11	2026-03-28 08:25:11.744518	\N	backfill	\N	0.12	5.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.9	0	10.8	23.8	3
1018	2022-10-12	2026-03-28 08:25:12.190176	\N	backfill	\N	0.26	5.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.1	0	13.4	22.7	3
1019	2022-10-13	2026-03-28 08:25:12.636299	\N	backfill	\N	0.28	4.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.3	0	12.9	25.9	3
1020	2022-10-14	2026-03-28 08:25:13.081854	\N	backfill	\N	0.12	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.6	0	11.9	25.9	3
1021	2022-10-15	2026-03-28 08:25:13.526771	\N	backfill	\N	0.04	5.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.3	0	11.4	21.2	3
1022	2022-10-16	2026-03-28 08:25:13.971617	\N	backfill	\N	0.04	3.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.7	0	10.2	20.5	3
1023	2022-10-17	2026-03-28 08:25:14.417096	\N	backfill	\N	0.04	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.3	0	9.4	20.5	3
1024	2022-10-18	2026-03-28 08:25:14.86226	\N	backfill	\N	0.04	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18	0	11.5	22.3	1
1025	2022-10-19	2026-03-28 08:25:15.3075	\N	backfill	\N	0.06	2.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.8	0	9.2	19.4	3
1026	2022-10-20	2026-03-28 08:25:15.752455	\N	backfill	\N	0.3	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.6	0	16.4	32	3
1027	2022-10-21	2026-03-28 08:25:16.204513	\N	backfill	\N	0.26	3.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.2	0.4	14.8	24.5	51
1028	2022-10-22	2026-03-28 08:25:16.649972	\N	backfill	\N	0.62	5.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.4	2.9	20.5	41	63
1029	2022-10-23	2026-03-28 08:25:17.095148	\N	backfill	\N	0.38	5.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.3	0	11.7	20.5	3
1030	2022-10-24	2026-03-28 08:25:17.547429	\N	backfill	\N	0.38	4.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.3	0	17.8	31.7	3
1031	2022-10-25	2026-03-28 08:25:17.99198	\N	backfill	\N	0.38	4.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.9	0.6	12.7	24.1	53
1032	2022-10-26	2026-03-28 08:25:18.437525	\N	backfill	\N	0.16	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.5	0	8.3	15.8	3
1033	2022-10-27	2026-03-28 08:25:18.881522	\N	backfill	\N	0.04	2.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.3	0	9.8	17.6	3
1034	2022-10-28	2026-03-28 08:25:19.327234	\N	backfill	\N	0.06	2.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.1	0	9.5	19.1	3
1035	2022-10-29	2026-03-28 08:25:19.772422	\N	backfill	\N	0.02	3.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.9	0	8.1	16.9	3
1036	2022-10-30	2026-03-28 08:25:20.218158	\N	backfill	\N	0.04	3.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.3	0	9.3	17.6	3
1037	2022-10-31	2026-03-28 08:25:20.663953	\N	backfill	\N	0.02	2.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.1	0	8.8	14.4	3
1038	2022-11-01	2026-03-28 08:25:21.109131	\N	backfill	\N	0.02	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.2	0	7.8	16.9	3
1039	2022-11-02	2026-03-28 08:25:21.554292	\N	backfill	\N	0.1	1.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.8	0.7	10.7	20.9	51
1040	2022-11-03	2026-03-28 08:25:22.0002	\N	backfill	\N	0.28	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.2	4.1	15.8	25.6	61
1041	2022-11-04	2026-03-28 08:25:22.445387	\N	backfill	\N	0.92	6.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.8	15.6	30.9	52.6	63
1042	2022-11-05	2026-03-28 08:25:22.89252	\N	backfill	\N	1	5.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16	4.8	33.4	58.3	63
1043	2022-11-06	2026-03-28 08:25:23.33875	\N	backfill	\N	0.58	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.5	0	21.4	37.4	3
1044	2022-11-07	2026-03-28 08:25:23.784369	\N	backfill	\N	0.24	4.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12	0	10	16.9	2
1045	2022-11-08	2026-03-28 08:25:24.229917	\N	backfill	\N	0.04	4.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.7	0	8.9	13	3
1046	2022-11-09	2026-03-28 08:25:24.67473	\N	backfill	\N	0.14	3.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14	0	9.2	16.9	3
1047	2022-11-10	2026-03-28 08:25:25.119857	\N	backfill	\N	0.32	4.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.2	11.1	12.9	24.1	61
1048	2022-11-11	2026-03-28 08:25:25.563832	\N	backfill	\N	0.36	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.5	0	14.4	27.7	3
1049	2022-11-12	2026-03-28 08:25:26.00798	\N	backfill	\N	0.46	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.7	0	19.8	32.4	3
1050	2022-11-13	2026-03-28 08:25:26.453926	\N	backfill	\N	1.06	5.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.2	3.5	23.7	40.7	55
1051	2022-11-14	2026-03-28 08:25:26.899173	\N	backfill	\N	0.5	4.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.7	3.7	14.5	25.9	53
1052	2022-11-15	2026-03-28 08:25:27.356144	\N	backfill	\N	0.28	6.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.9	6.4	14	23	61
1053	2022-11-16	2026-03-28 08:25:27.801442	\N	backfill	\N	0.4	4.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.3	9.5	15.5	31.3	61
1054	2022-11-17	2026-03-28 08:25:28.247908	\N	backfill	\N	0.28	5.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.4	4.4	11.3	21.6	63
1055	2022-11-18	2026-03-28 08:25:28.69324	\N	backfill	\N	0.36	5.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.8	16	19.2	35.3	63
1056	2022-11-19	2026-03-28 08:25:29.139073	\N	backfill	\N	0.76	4.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.4	14.1	20	34.6	63
1057	2022-11-20	2026-03-28 08:25:29.590404	\N	backfill	\N	1.06	5.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.4	2.3	28.7	50.4	53
1058	2022-11-21	2026-03-28 08:25:30.03649	\N	backfill	\N	0.28	4.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.5	0.1	13.8	24.5	51
1059	2022-11-22	2026-03-28 08:25:30.482723	\N	backfill	\N	2.46	6.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.3	46.8	54.4	96.8	65
1060	2022-11-23	2026-03-28 08:25:30.927894	\N	backfill	\N	1.56	6.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.6	5.4	29.2	63	61
1061	2022-11-24	2026-03-28 08:25:31.372953	\N	backfill	\N	0.16	4.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8	0	13.4	24.8	3
1062	2022-11-25	2026-03-28 08:25:31.818079	\N	backfill	\N	0.26	2.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.7	0	12.3	19.4	3
1063	2022-11-26	2026-03-28 08:25:32.263504	\N	backfill	\N	0.94	4.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.1	1.6	28.6	49.3	61
1064	2022-11-27	2026-03-28 08:25:32.708762	\N	backfill	\N	0.74	4.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11	0	19.4	41	3
1065	2022-11-28	2026-03-28 08:25:33.153345	\N	backfill	\N	0.36	3.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.4	0.9	14.1	23.8	51
1066	2022-11-29	2026-03-28 08:25:33.598318	\N	backfill	\N	0.82	4.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.8	4.6	23.1	40.3	53
1067	2022-11-30	2026-03-28 08:25:34.043841	\N	backfill	\N	0.8	4.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.1	0.2	27.8	47.9	51
1068	2022-12-01	2026-03-28 08:25:34.487822	\N	backfill	\N	0.68	4.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10	0.3	23.7	42.8	51
1069	2022-12-02	2026-03-28 08:25:34.93306	\N	backfill	\N	0.52	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.9	4.3	16.3	28.1	55
1070	2022-12-03	2026-03-28 08:25:35.377807	\N	backfill	\N	0.7	3.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.4	7.9	23.2	38.9	61
1071	2022-12-04	2026-03-28 08:25:35.822827	\N	backfill	\N	1.34	6.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.2	8.6	30	49.7	61
1072	2022-12-05	2026-03-28 08:25:36.267948	\N	backfill	\N	0.42	6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.3	2.5	16.9	28.4	53
1073	2022-12-06	2026-03-28 08:25:36.712665	\N	backfill	\N	0.28	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.7	0	13.4	24.1	3
1074	2022-12-07	2026-03-28 08:25:37.157959	\N	backfill	\N	0.32	4.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.1	0	15.8	28.4	3
1075	2022-12-08	2026-03-28 08:25:37.603089	\N	backfill	\N	0.36	4.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.4	1	17.9	29.9	53
1076	2022-12-09	2026-03-28 08:25:38.049469	\N	backfill	\N	0.62	5.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.1	11.2	22.2	50.8	61
1077	2022-12-10	2026-03-28 08:25:38.494683	\N	backfill	\N	0.48	5.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.2	3.6	26.7	44.3	53
1078	2022-12-11	2026-03-28 08:25:38.940094	\N	backfill	\N	0.84	4.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.4	22.9	31.6	56.5	63
1079	2022-12-12	2026-03-28 08:25:39.385357	\N	backfill	\N	0.66	4.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5	0.2	23.7	42.5	51
1080	2022-12-13	2026-03-28 08:25:39.8304	\N	backfill	\N	0.48	3.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.2	1.5	17.4	30.6	51
1081	2022-12-14	2026-03-28 08:25:40.275857	\N	backfill	\N	0.44	4.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.6	0	17.3	34.6	3
1082	2022-12-15	2026-03-28 08:25:40.720998	\N	backfill	\N	0.66	6.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.5	20.6	25.3	45	63
1083	2022-12-16	2026-03-28 08:25:42.531813	\N	backfill	\N	0.66	6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.2	8.6	15.9	27	63
1084	2022-12-17	2026-03-28 08:25:42.976775	\N	backfill	\N	0.7	6.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.5	0	24.4	42.5	3
1085	2022-12-18	2026-03-28 08:25:43.421936	\N	backfill	\N	0.68	4.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.6	0	17.3	31.3	3
1086	2022-12-19	2026-03-28 08:25:43.867151	\N	backfill	\N	0.34	3.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.6	0	9.8	18.7	3
1087	2022-12-20	2026-03-28 08:25:44.312845	\N	backfill	\N	0.06	2.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.9	0	10.2	18.4	3
1088	2022-12-21	2026-03-28 08:25:44.758445	\N	backfill	\N	0.04	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.8	1.1	7.4	14.8	51
1089	2022-12-22	2026-03-28 08:25:45.203607	\N	backfill	\N	0.04	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.2	1.6	8.5	19.4	51
1090	2022-12-23	2026-03-28 08:25:45.648728	\N	backfill	\N	0.06	2.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.6	0	11.4	19.1	3
1091	2022-12-24	2026-03-28 08:25:46.093801	\N	backfill	\N	0.08	2.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.1	0	9.3	16.9	3
1092	2022-12-25	2026-03-28 08:25:46.537951	\N	backfill	\N	0.04	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.3	0	8.4	16.6	3
1093	2022-12-26	2026-03-28 08:25:46.984171	\N	backfill	\N	0.04	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.7	0	8	17.6	3
1094	2022-12-27	2026-03-28 08:25:47.429686	\N	backfill	\N	0.14	4.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.5	0	7.9	21.2	3
1095	2022-12-28	2026-03-28 08:25:47.874764	\N	backfill	\N	0.14	4.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.8	0.2	11.5	19.1	51
1096	2022-12-29	2026-03-28 08:25:48.319896	\N	backfill	\N	0.12	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.8	0.8	8.4	18	51
1097	2022-12-30	2026-03-28 08:25:48.766246	\N	backfill	\N	0.24	4.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.3	3.2	10.4	19.1	55
1098	2022-12-31	2026-03-28 08:25:49.211414	\N	backfill	\N	0.22	5.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.7	0	9.4	16.2	3
1099	2023-01-01	2026-03-28 08:25:49.65828	\N	backfill	\N	0.14	5.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.2	0	8.1	16.9	3
1100	2023-01-02	2026-03-28 08:25:50.103518	\N	backfill	\N	0.04	3.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.8	0	7.9	15.5	3
1101	2023-01-03	2026-03-28 08:25:50.548365	\N	backfill	\N	0.02	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.3	0.1	7.5	15.1	51
1102	2023-01-04	2026-03-28 08:25:50.99301	\N	backfill	\N	0.04	2.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.8	0.2	10.9	19.1	51
1103	2023-01-05	2026-03-28 08:25:51.437882	\N	backfill	\N	0.24	2.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.7	0.1	16.9	31.7	51
1104	2023-01-06	2026-03-28 08:25:51.883519	\N	backfill	\N	0.04	1.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.4	0	7.9	17.6	3
1105	2023-01-07	2026-03-28 08:25:52.327535	\N	backfill	\N	0.1	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.4	0	9.1	19.4	3
1106	2023-01-08	2026-03-28 08:25:52.772518	\N	backfill	\N	0.58	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10	4	28.5	47.9	61
1107	2023-01-09	2026-03-28 08:25:53.217513	\N	backfill	\N	0.8	5.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10	13.2	33.8	60.1	63
1108	2023-01-10	2026-03-28 08:25:53.662652	\N	backfill	\N	0.5	5.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.7	0	15.3	26.3	3
1109	2023-01-11	2026-03-28 08:25:54.107614	\N	backfill	\N	0.14	6.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.2	0	10	18	3
1110	2023-01-12	2026-03-28 08:25:54.55158	\N	backfill	\N	0.14	2.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.9	0.4	14.8	26.6	51
1111	2023-01-13	2026-03-28 08:25:54.997355	\N	backfill	\N	0.06	4.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.8	0.1	8	15.1	51
1112	2023-01-14	2026-03-28 08:25:55.442604	\N	backfill	\N	0.12	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.5	0	12.1	24.5	3
1113	2023-01-15	2026-03-28 08:25:55.887814	\N	backfill	\N	0.16	3.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.4	3.4	18	39.6	61
1114	2023-01-16	2026-03-28 08:25:56.333969	\N	backfill	\N	0.52	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.8	11.1	23.5	47.5	63
1115	2023-01-17	2026-03-28 08:25:56.779595	\N	backfill	\N	0.56	5.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.8	10.7	19.6	35.6	63
1116	2023-01-18	2026-03-28 08:25:57.224883	\N	backfill	\N	0.58	7.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.1	0.3	12	27.7	51
1117	2023-01-19	2026-03-28 08:25:57.67008	\N	backfill	\N	0.72	6.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.3	19.7	17.6	30.2	75
1118	2023-01-20	2026-03-28 08:25:58.115169	\N	backfill	\N	0.98	4.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.1	14	37.1	64.4	73
1119	2023-01-21	2026-03-28 08:25:58.56035	\N	backfill	\N	1.38	5.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.7	0.4	38.5	66.2	51
1120	2023-01-22	2026-03-28 08:25:59.006212	\N	backfill	\N	1.56	5.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.8	0.7	45.3	77	51
1121	2023-01-23	2026-03-28 08:25:59.45095	\N	backfill	\N	1.72	6.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.2	6	46.4	80.6	63
1122	2023-01-24	2026-03-28 08:25:59.895522	\N	backfill	\N	1.04	5.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9	2.1	27	46.1	53
1123	2023-01-25	2026-03-28 08:26:00.340881	\N	backfill	\N	1.1	5.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.5	0	28.5	49	3
1124	2023-01-26	2026-03-28 08:26:00.785462	\N	backfill	\N	0.98	4.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.4	0	24.4	45.7	3
1125	2023-01-27	2026-03-28 08:26:01.230332	\N	backfill	\N	1.42	5.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.6	0.1	34.7	62.6	51
1126	2023-01-28	2026-03-28 08:26:01.675365	\N	backfill	\N	1.06	4.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.1	0	29.4	51.5	3
1127	2023-01-29	2026-03-28 08:26:02.11964	\N	backfill	\N	0.66	3.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.4	0	20.9	39.2	3
1128	2023-01-30	2026-03-28 08:26:02.572725	\N	backfill	\N	0.2	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.3	0	10.7	22.7	3
1129	2023-01-31	2026-03-28 08:26:03.017995	\N	backfill	\N	0.06	5.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.4	0	11	18.7	3
1130	2023-02-01	2026-03-28 08:26:03.463098	\N	backfill	\N	0.1	2.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.1	0	12	26.6	3
1131	2023-02-02	2026-03-28 08:26:03.908181	\N	backfill	\N	0.04	2.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.2	0	10.2	20.2	3
1132	2023-02-03	2026-03-28 08:26:04.353388	\N	backfill	\N	0.18	2.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.9	0	13.4	27.7	3
1133	2023-02-04	2026-03-28 08:26:04.798925	\N	backfill	\N	0.7	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.3	0	29.5	51.1	3
1134	2023-02-05	2026-03-28 08:26:05.24437	\N	backfill	\N	0.88	4.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.1	0	26.6	44.3	3
1135	2023-02-06	2026-03-28 08:26:05.688573	\N	backfill	\N	0.64	4.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.6	0	24.8	42.8	3
1136	2023-02-07	2026-03-28 08:26:06.134545	\N	backfill	\N	0.94	4.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.4	0	20.6	37.4	1
1137	2023-02-08	2026-03-28 08:26:06.579846	\N	backfill	\N	0.84	4.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.6	0	26	45	3
1138	2023-02-09	2026-03-28 08:26:07.025536	\N	backfill	\N	0.9	4.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3	0	27.6	47.5	3
1139	2023-02-10	2026-03-28 08:26:07.470832	\N	backfill	\N	0.4	3.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2.4	0	16.8	32.8	0
1140	2023-02-11	2026-03-28 08:26:07.916185	\N	backfill	\N	0.26	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3	0	13	22	3
1141	2023-02-12	2026-03-28 08:26:08.362098	\N	backfill	\N	0.2	4.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.7	0	11.1	18	2
1142	2023-02-13	2026-03-28 08:26:08.807125	\N	backfill	\N	0.32	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.6	0	10.8	22.7	0
1143	2023-02-14	2026-03-28 08:26:09.251551	\N	backfill	\N	0.08	5.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.4	0	9.2	18.4	0
1144	2023-02-15	2026-03-28 08:26:09.696174	\N	backfill	\N	0.14	4.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.6	0	11	22.7	3
1145	2023-02-16	2026-03-28 08:26:10.142354	\N	backfill	\N	0.12	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.2	0	6.8	18	3
1146	2023-02-17	2026-03-28 08:26:10.58732	\N	backfill	\N	0.12	4.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.8	0	11.5	21.6	3
1147	2023-02-18	2026-03-28 08:26:11.032911	\N	backfill	\N	0.08	3.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.1	0	9.5	19.8	3
1148	2023-02-19	2026-03-28 08:26:11.47812	\N	backfill	\N	0.08	3.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.2	0	12.8	22.3	3
1149	2023-02-20	2026-03-28 08:26:11.924065	\N	backfill	\N	0.1	2.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.7	0	13.4	23.8	3
1150	2023-02-21	2026-03-28 08:26:12.369455	\N	backfill	\N	0.04	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.8	0	7.9	18	3
1151	2023-02-22	2026-03-28 08:26:12.815273	\N	backfill	\N	0.02	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.2	0	7.9	19.4	3
1152	2023-02-23	2026-03-28 08:26:13.260514	\N	backfill	\N	0.02	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.9	0.2	8.1	16.9	51
1153	2023-02-24	2026-03-28 08:26:13.705522	\N	backfill	\N	0.16	2.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.1	0	13.4	24.5	3
1154	2023-02-25	2026-03-28 08:26:14.1507	\N	backfill	\N	0.34	4.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.4	1.8	19	32	53
1155	2023-02-26	2026-03-28 08:26:14.595886	\N	backfill	\N	2.22	6.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.7	8.1	47.4	83.5	55
1156	2023-02-27	2026-03-28 08:26:15.041204	\N	backfill	\N	1.96	6.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.7	0.1	41	72	51
1157	2023-02-28	2026-03-28 08:26:15.486858	\N	backfill	\N	1.16	4.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.5	0	26.7	47.2	3
1158	2023-03-01	2026-03-28 08:26:15.9321	\N	backfill	\N	1.28	5.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7	9.7	35.5	64.4	61
1159	2023-03-02	2026-03-28 08:26:16.377543	\N	backfill	\N	1	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.1	3	25	42.1	53
1160	2023-03-03	2026-03-28 08:26:16.822868	\N	backfill	\N	0.44	4.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.2	0	16.1	33.1	3
1161	2023-03-04	2026-03-28 08:26:17.268872	\N	backfill	\N	0.28	3.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.9	0	13.7	28.1	1
1162	2023-03-05	2026-03-28 08:26:17.713938	\N	backfill	\N	0.14	6.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.9	0	13.7	24.1	3
1163	2023-03-06	2026-03-28 08:26:18.159403	\N	backfill	\N	0.2	3.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.8	0.7	17.8	32.8	53
1164	2023-03-07	2026-03-28 08:26:18.603635	\N	backfill	\N	0.38	3.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.2	0.1	25.3	42.8	51
1165	2023-03-08	2026-03-28 08:26:19.049629	\N	backfill	\N	0.34	4.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.2	0	19.6	33.8	3
1166	2023-03-09	2026-03-28 08:26:19.494916	\N	backfill	\N	0.38	4.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.6	0	20.9	34.9	3
1167	2023-03-10	2026-03-28 08:26:19.940391	\N	backfill	\N	0.32	4.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.4	0.9	22	38.2	51
1168	2023-03-11	2026-03-28 08:26:20.386334	\N	backfill	\N	0.54	5.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.9	0	25.8	44.6	3
1169	2023-03-12	2026-03-28 08:26:20.83139	\N	backfill	\N	0.62	4.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.3	0	21.3	39.2	3
1170	2023-03-13	2026-03-28 08:26:21.275903	\N	backfill	\N	0.18	4.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.9	0	12.1	25.9	3
1171	2023-03-14	2026-03-28 08:26:21.719949	\N	backfill	\N	0.5	4.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.8	11.4	28.5	52.9	63
1172	2023-03-15	2026-03-28 08:26:22.165326	\N	backfill	\N	0.48	5.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.1	3.1	25.9	44.3	63
1173	2023-03-16	2026-03-28 08:26:23.965228	\N	backfill	\N	0.22	5.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.8	0	13.7	26.6	3
1174	2023-03-17	2026-03-28 08:26:24.410448	\N	backfill	\N	0.12	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.2	0	9.5	20.5	3
1175	2023-03-18	2026-03-28 08:26:24.85586	\N	backfill	\N	0.04	4.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.8	0	11.2	25.9	3
1176	2023-03-19	2026-03-28 08:26:25.299896	\N	backfill	\N	0.04	2.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.5	3.4	9.8	23	55
1177	2023-03-20	2026-03-28 08:26:25.745338	\N	backfill	\N	0.1	2.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.7	6.7	13.5	27	55
1178	2023-03-21	2026-03-28 08:26:26.190532	\N	backfill	\N	0.12	4.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11	0	11.4	20.5	3
1179	2023-03-22	2026-03-28 08:26:26.635746	\N	backfill	\N	0.08	5.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.9	0	10.6	20.5	3
1180	2023-03-23	2026-03-28 08:26:27.081976	\N	backfill	\N	0.04	4.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.2	0	10.5	21.6	3
1181	2023-03-24	2026-03-28 08:26:27.527265	\N	backfill	\N	0.22	2.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.7	0	19.5	32.8	3
1182	2023-03-25	2026-03-28 08:26:27.973104	\N	backfill	\N	0.34	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.9	0.1	25.5	51.5	51
1183	2023-03-26	2026-03-28 08:26:28.418823	\N	backfill	\N	0.42	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.1	4.9	27.2	47.5	61
1184	2023-03-27	2026-03-28 08:26:28.863948	\N	backfill	\N	0.42	3.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.8	0.4	38.6	66.2	51
1185	2023-03-28	2026-03-28 08:26:29.309781	\N	backfill	\N	0.48	3.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.4	0	23.2	48.2	3
1186	2023-03-29	2026-03-28 08:26:29.754212	\N	backfill	\N	0.26	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.3	0	15.7	28.4	3
1187	2023-03-30	2026-03-28 08:26:30.199137	\N	backfill	\N	0.3	4.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.2	0.4	14.4	25.9	51
1188	2023-03-31	2026-03-28 08:26:30.644143	\N	backfill	\N	0.48	4.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13	0.1	23.4	39.6	51
1189	2023-04-01	2026-03-28 08:26:31.089264	\N	backfill	\N	0.46	5.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.4	0	14.5	27.4	3
1190	2023-04-02	2026-03-28 08:26:31.534009	\N	backfill	\N	0.42	5.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.2	0.5	22.9	39.6	53
1191	2023-04-03	2026-03-28 08:26:31.979165	\N	backfill	\N	0.96	4.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.6	0.2	42.8	74.5	51
1192	2023-04-04	2026-03-28 08:26:32.42443	\N	backfill	\N	1.6	5.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.9	0	42.5	73.4	3
1193	2023-04-05	2026-03-28 08:26:32.869632	\N	backfill	\N	0.8	4.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.9	0	26.7	48.6	3
1194	2023-04-06	2026-03-28 08:26:33.314145	\N	backfill	\N	0.22	3.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.2	0	13.5	23.8	1
1195	2023-04-07	2026-03-28 08:26:33.759246	\N	backfill	\N	0.14	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.7	0	13.7	29.9	3
1196	2023-04-08	2026-03-28 08:26:34.20418	\N	backfill	\N	0.34	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.9	0.1	26.5	44.3	51
1197	2023-04-09	2026-03-28 08:26:34.649297	\N	backfill	\N	0.54	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.3	0.1	23.9	45.4	51
1198	2023-04-10	2026-03-28 08:26:35.0944	\N	backfill	\N	0.58	3.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.1	0	22.7	38.9	3
1199	2023-04-11	2026-03-28 08:26:35.538655	\N	backfill	\N	0.26	4.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.6	0	15.2	27.7	3
1200	2023-04-12	2026-03-28 08:26:35.984063	\N	backfill	\N	0.2	2.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.1	0	15.5	26.3	3
1201	2023-04-13	2026-03-28 08:26:36.42934	\N	backfill	\N	1.18	4.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.7	9.5	31.4	58	63
1202	2023-04-14	2026-03-28 08:26:36.874838	\N	backfill	\N	1.04	5.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.3	2.9	29.3	51.1	53
1203	2023-04-15	2026-03-28 08:26:37.320148	\N	backfill	\N	0.52	4.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.4	0	19.6	36	3
1204	2023-04-16	2026-03-28 08:26:37.765832	\N	backfill	\N	0.64	3.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.7	0	22.7	42.5	3
1205	2023-04-17	2026-03-28 08:26:38.210855	\N	backfill	\N	0.42	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.5	0.3	19.2	35.6	51
1206	2023-04-18	2026-03-28 08:26:38.656093	\N	backfill	\N	0.3	3.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.5	0.1	19.4	37.4	51
1207	2023-04-19	2026-03-28 08:26:39.101932	\N	backfill	\N	0.16	3.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.2	0.1	14	23.4	51
1208	2023-04-20	2026-03-28 08:26:39.546375	\N	backfill	\N	0.58	3.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14	15.2	20.1	37.8	63
1209	2023-04-21	2026-03-28 08:26:39.990912	\N	backfill	\N	0.44	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.1	13.8	24.9	51.1	63
1210	2023-04-22	2026-03-28 08:26:40.436017	\N	backfill	\N	0.08	2.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.7	0	12.8	27	3
1211	2023-04-23	2026-03-28 08:26:40.881586	\N	backfill	\N	0.62	3.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.4	0	15	31	3
1212	2023-04-24	2026-03-28 08:26:41.326578	\N	backfill	\N	0.52	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.9	8.8	30.2	59	63
1213	2023-04-25	2026-03-28 08:26:41.7714	\N	backfill	\N	0.7	5.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.7	15.6	29.5	55.4	63
1214	2023-04-26	2026-03-28 08:26:42.216406	\N	backfill	\N	0.24	5.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.3	0	16.7	33.1	3
1215	2023-04-27	2026-03-28 08:26:42.661544	\N	backfill	\N	0.22	2.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.1	0	15.5	27	3
1216	2023-04-28	2026-03-28 08:26:43.10847	\N	backfill	\N	0.12	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.6	0	12.2	27.7	3
1217	2023-04-29	2026-03-28 08:26:43.554226	\N	backfill	\N	0.18	3.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15	0.6	10.8	20.5	51
1218	2023-04-30	2026-03-28 08:26:43.99951	\N	backfill	\N	0.16	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.2	0	18.5	30.2	3
1219	2023-05-01	2026-03-28 08:26:44.444728	\N	backfill	\N	0.7	3.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.6	9.2	24.3	42.8	61
1220	2023-05-02	2026-03-28 08:26:44.888936	\N	backfill	\N	1.16	5.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.5	45.2	40.4	69.8	63
1221	2023-05-03	2026-03-28 08:26:45.333171	\N	backfill	\N	1	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16	6.3	30.3	54	63
1222	2023-05-04	2026-03-28 08:26:45.778208	\N	backfill	\N	0.48	4.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.7	0	15.5	28.8	3
1223	2023-05-05	2026-03-28 08:26:46.223404	\N	backfill	\N	0.08	5.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.5	0	10.7	23	3
1224	2023-05-06	2026-03-28 08:26:46.674786	\N	backfill	\N	0.04	5.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.1	0	10.7	22.3	3
1225	2023-05-07	2026-03-28 08:26:47.130918	\N	backfill	\N	0.02	4.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.2	2.3	12.9	23	61
1226	2023-05-08	2026-03-28 08:26:47.577442	\N	backfill	\N	0.32	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.8	4.5	24.2	45.4	63
1227	2023-05-09	2026-03-28 08:26:48.022051	\N	backfill	\N	0.44	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.5	0	12.2	27.7	3
1228	2023-05-10	2026-03-28 08:26:48.468305	\N	backfill	\N	0.8	4.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.1	45.7	27.4	47.2	63
1229	2023-05-11	2026-03-28 08:26:48.913056	\N	backfill	\N	0.92	4.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.7	12.4	27.9	50.8	63
1230	2023-05-12	2026-03-28 08:26:49.35792	\N	backfill	\N	0.28	4.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.3	2.1	19.2	36.7	61
1231	2023-05-13	2026-03-28 08:26:49.801593	\N	backfill	\N	0.24	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15	4.8	16.6	37.8	61
1232	2023-05-14	2026-03-28 08:26:50.246516	\N	backfill	\N	0.46	5.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.8	2.1	21.6	40.3	53
1233	2023-05-15	2026-03-28 08:26:50.691678	\N	backfill	\N	0.34	6.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.3	0	19.5	31.7	3
1234	2023-05-16	2026-03-28 08:26:51.136583	\N	backfill	\N	1.58	5.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.6	27.5	45.9	83.2	63
1235	2023-05-17	2026-03-28 08:26:51.581247	\N	backfill	\N	1.16	5.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.9	14.2	36	62.6	63
1236	2023-05-18	2026-03-28 08:26:52.026301	\N	backfill	\N	0.7	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.9	0	20.1	38.5	3
1237	2023-05-19	2026-03-28 08:26:52.47143	\N	backfill	\N	0.56	4.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.8	1.7	20.5	37.8	53
1238	2023-05-20	2026-03-28 08:26:52.916565	\N	backfill	\N	0.58	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.9	2.4	22.7	38.2	55
1239	2023-05-21	2026-03-28 08:26:53.361608	\N	backfill	\N	0.5	3.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.4	0.1	21.7	37.8	51
1240	2023-05-22	2026-03-28 08:26:53.806457	\N	backfill	\N	0.42	3.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.9	0	19.6	34.6	3
1241	2023-05-23	2026-03-28 08:26:54.251602	\N	backfill	\N	0.06	5.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.7	0	10.9	20.5	3
1242	2023-05-24	2026-03-28 08:26:54.696631	\N	backfill	\N	0.22	3.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.6	0	15	31	3
1243	2023-05-25	2026-03-28 08:26:55.140707	\N	backfill	\N	0.44	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.3	0	22.7	45.4	3
1244	2023-05-26	2026-03-28 08:26:55.586057	\N	backfill	\N	0.1	2.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.1	0	14.2	24.1	3
1245	2023-05-27	2026-03-28 08:26:56.031662	\N	backfill	\N	0.34	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.1	0	20.4	38.5	3
1246	2023-05-28	2026-03-28 08:26:56.47708	\N	backfill	\N	0.36	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.1	0	15.8	28.4	3
1247	2023-05-29	2026-03-28 08:26:56.926065	\N	backfill	\N	0.32	2.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.3	0	23.4	41.4	3
1248	2023-05-30	2026-03-28 08:26:57.371197	\N	backfill	\N	0.46	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.4	0	22.5	43.2	3
1249	2023-05-31	2026-03-28 08:26:57.81615	\N	backfill	\N	0.52	3.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.7	0	25.9	45	3
1250	2023-06-01	2026-03-28 08:26:58.261081	\N	backfill	\N	0.22	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.6	0	10	22	3
1251	2023-06-02	2026-03-28 08:26:58.706382	\N	backfill	\N	0.18	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22	0	13.7	23.8	3
1252	2023-06-03	2026-03-28 08:26:59.15126	\N	backfill	\N	0.32	3.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.4	3.6	18	37.1	61
1253	2023-06-04	2026-03-28 08:26:59.596272	\N	backfill	\N	0.36	2.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.7	5.9	15.7	30.6	63
1254	2023-06-05	2026-03-28 08:27:00.040659	\N	backfill	\N	0.18	2.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.3	17.2	12.2	22.3	61
1255	2023-06-06	2026-03-28 08:27:00.48724	\N	backfill	\N	0.14	4.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.6	7.3	8.9	23.4	63
1256	2023-06-07	2026-03-28 08:27:00.933039	\N	backfill	\N	0.1	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.5	1.2	7.9	18.4	51
1257	2023-06-08	2026-03-28 08:27:01.378504	\N	backfill	\N	0.24	3.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.3	9.4	13.7	30.2	63
1258	2023-06-09	2026-03-28 08:27:01.823634	\N	backfill	\N	0.04	2.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.5	0.1	10.4	27	51
1259	2023-06-10	2026-03-28 08:27:02.268874	\N	backfill	\N	0.06	2.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.7	11	12.2	32.4	63
1260	2023-06-11	2026-03-28 08:27:02.714012	\N	backfill	\N	0.36	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.2	0	20.2	35.6	3
1261	2023-06-12	2026-03-28 08:27:03.159338	\N	backfill	\N	0.36	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.5	0	21	39.2	3
1262	2023-06-13	2026-03-28 08:27:03.604531	\N	backfill	\N	0.62	3.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.4	2.9	25	47.2	63
1263	2023-06-14	2026-03-28 08:27:05.402944	\N	backfill	\N	0.2	2.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22	0	16.3	29.9	3
1264	2023-06-15	2026-03-28 08:27:05.847969	\N	backfill	\N	0.4	3.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.2	0	22	38.5	3
1265	2023-06-16	2026-03-28 08:27:06.292001	\N	backfill	\N	0.26	4.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.8	0	17.3	32.8	2
1266	2023-06-17	2026-03-28 08:27:06.745788	\N	backfill	\N	0.2	3.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.7	0	13.3	25.6	0
1267	2023-06-18	2026-03-28 08:27:07.190364	\N	backfill	\N	0.22	2.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.7	0	16.8	33.5	3
1268	2023-06-19	2026-03-28 08:27:07.635451	\N	backfill	\N	0.2	2.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.1	0	12.3	20.5	3
1269	2023-06-20	2026-03-28 08:27:08.079645	\N	backfill	\N	0.08	2.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.4	0	14	32	3
1270	2023-06-21	2026-03-28 08:27:08.5246	\N	backfill	\N	0.08	2.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.3	0	13.9	27.7	3
1271	2023-06-22	2026-03-28 08:27:08.968575	\N	backfill	\N	0.18	2.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.8	0	16.9	28.8	3
1272	2023-06-23	2026-03-28 08:27:09.415419	\N	backfill	\N	0.42	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.1	2.7	29.9	66.6	61
1273	2023-06-24	2026-03-28 08:27:09.860849	\N	backfill	\N	0.76	4.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.3	0	29.5	54	3
1274	2023-06-25	2026-03-28 08:27:10.306137	\N	backfill	\N	0.54	3.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.5	0	19.9	37.8	0
1275	2023-06-26	2026-03-28 08:27:10.751229	\N	backfill	\N	0.08	2.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.8	0	14.7	29.2	1
1276	2023-06-27	2026-03-28 08:27:11.196415	\N	backfill	\N	0.4	2.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.4	2.1	26.9	51.5	61
1277	2023-06-28	2026-03-28 08:27:11.641653	\N	backfill	\N	0.58	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.9	0.1	21.9	47.9	51
1278	2023-06-29	2026-03-28 08:27:12.088501	\N	backfill	\N	0.24	3.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.5	0	11.5	24.8	1
1279	2023-06-30	2026-03-28 08:27:12.533881	\N	backfill	\N	0.2	2.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.6	5.3	17.7	38.2	61
1280	2023-07-01	2026-03-28 08:27:12.978027	\N	backfill	\N	0.26	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.9	2.3	11.3	22.7	61
1281	2023-07-02	2026-03-28 08:27:13.423628	\N	backfill	\N	0.12	5.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24	0.3	11.2	26.6	51
1282	2023-07-03	2026-03-28 08:27:13.869028	\N	backfill	\N	0.52	4.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.8	9.1	24	47.2	63
1283	2023-07-04	2026-03-28 08:27:14.314201	\N	backfill	\N	0.62	3.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24	0.4	24.5	42.1	51
1284	2023-07-05	2026-03-28 08:27:14.759841	\N	backfill	\N	0.26	2.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.7	0	15.8	28.4	3
1285	2023-07-06	2026-03-28 08:27:15.205232	\N	backfill	\N	0.38	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23	6.9	18.3	33.1	63
1286	2023-07-07	2026-03-28 08:27:15.650335	\N	backfill	\N	0.3	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.4	0	14.8	32.8	3
1287	2023-07-08	2026-03-28 08:27:16.095886	\N	backfill	\N	0.04	2.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.3	0	10.7	24.1	3
1288	2023-07-09	2026-03-28 08:27:16.542459	\N	backfill	\N	0.02	2.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.1	0	11.5	26.3	1
1289	2023-07-10	2026-03-28 08:27:16.987948	\N	backfill	\N	0.02	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.7	0	12.1	24.8	3
1290	2023-07-11	2026-03-28 08:27:17.432064	\N	backfill	\N	0.28	2.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.1	0	14.5	31.7	2
1291	2023-07-12	2026-03-28 08:27:17.878334	\N	backfill	\N	0.78	4.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.8	0	20.1	37.8	3
1292	2023-07-13	2026-03-28 08:27:18.323109	\N	backfill	\N	0.76	4.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.1	9.7	33.1	61.9	63
1293	2023-07-14	2026-03-28 08:27:18.768008	\N	backfill	\N	0.44	4.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.7	0.3	13.3	23.8	51
1294	2023-07-15	2026-03-28 08:27:19.213173	\N	backfill	\N	0.12	4.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.5	0	14.6	31.3	3
1295	2023-07-16	2026-03-28 08:27:19.658468	\N	backfill	\N	0.1	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.7	0	14.5	31.7	0
1296	2023-07-17	2026-03-28 08:27:20.103979	\N	backfill	\N	0.14	2.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.9	0	13.2	24.5	1
1297	2023-07-18	2026-03-28 08:27:20.550078	\N	backfill	\N	0.4	3.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.9	0	14.8	29.5	1
1298	2023-07-19	2026-03-28 08:27:20.995778	\N	backfill	\N	0.46	3.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.7	0.1	18.1	40.7	51
1299	2023-07-20	2026-03-28 08:27:21.441601	\N	backfill	\N	0.44	3.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.5	0.5	15.1	27	51
1300	2023-07-21	2026-03-28 08:27:21.88746	\N	backfill	\N	0.48	3.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.2	4.1	30.7	66.6	63
1301	2023-07-22	2026-03-28 08:27:22.333145	\N	backfill	\N	0.36	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.2	5.2	12	32	61
1302	2023-07-23	2026-03-28 08:27:22.778311	\N	backfill	\N	0.44	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.3	0.3	15.7	31.3	51
1303	2023-07-24	2026-03-28 08:27:23.223601	\N	backfill	\N	0.74	3.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.6	0	30.9	56.9	3
1304	2023-07-25	2026-03-28 08:27:23.668594	\N	backfill	\N	0.92	4.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.7	6.9	31.1	55.1	63
1305	2023-07-26	2026-03-28 08:27:24.1138	\N	backfill	\N	0.72	4.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.5	0.9	24.7	48.2	53
1306	2023-07-27	2026-03-28 08:27:24.557643	\N	backfill	\N	0.58	3.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.4	0	14.9	29.9	1
1307	2023-07-28	2026-03-28 08:27:25.003003	\N	backfill	\N	0.16	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25	0.4	14.6	26.6	51
1308	2023-07-29	2026-03-28 08:27:25.453552	\N	backfill	\N	0.2	2.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.4	0.1	14.1	26.6	51
1309	2023-07-30	2026-03-28 08:27:25.900545	\N	backfill	\N	0.2	2.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.7	13.3	13.7	30.2	63
1310	2023-07-31	2026-03-28 08:27:26.345072	\N	backfill	\N	0.1	2.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.3	0	11.2	26.6	3
1311	2023-08-01	2026-03-28 08:27:26.790413	\N	backfill	\N	0.24	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.5	0	18.4	32.4	3
1312	2023-08-02	2026-03-28 08:27:27.235949	\N	backfill	\N	0.98	4.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.5	0.3	27.5	48.6	51
1313	2023-08-03	2026-03-28 08:27:27.681555	\N	backfill	\N	0.42	3.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.2	0.2	28.7	57.2	51
1314	2023-08-04	2026-03-28 08:27:28.127101	\N	backfill	\N	0.6	4.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.8	17.2	20.7	44.6	63
1315	2023-08-05	2026-03-28 08:27:28.572375	\N	backfill	\N	0.72	4.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.6	24.4	30.5	56.9	63
1316	2023-08-06	2026-03-28 08:27:29.017573	\N	backfill	\N	0.4	4.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.7	2	16.3	35.3	55
1317	2023-08-07	2026-03-28 08:27:29.46265	\N	backfill	\N	0.48	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.6	0	30.8	59.4	2
1318	2023-08-08	2026-03-28 08:27:29.908526	\N	backfill	\N	0.48	3.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.9	0	17.3	35.6	3
1319	2023-08-09	2026-03-28 08:27:30.35486	\N	backfill	\N	0.34	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.6	0	12.6	25.6	3
1320	2023-08-10	2026-03-28 08:27:30.80105	\N	backfill	\N	0.3	2.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.6	0.4	21.6	47.2	51
1321	2023-08-11	2026-03-28 08:27:31.246799	\N	backfill	\N	0.08	2.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.9	0	9.7	23.8	3
1322	2023-08-12	2026-03-28 08:27:31.692	\N	backfill	\N	0.04	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24	0	8.9	20.5	3
1323	2023-08-13	2026-03-28 08:27:32.13801	\N	backfill	\N	0.08	3.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.8	0	8.7	22	3
1324	2023-08-14	2026-03-28 08:27:32.583007	\N	backfill	\N	0.08	4.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.9	0	12.4	27.4	2
1325	2023-08-15	2026-03-28 08:27:33.029926	\N	backfill	\N	0.1	2.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.2	0	11.8	26.6	0
1326	2023-08-16	2026-03-28 08:27:33.475483	\N	backfill	\N	0.22	2.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.3	0	12.4	25.9	1
1327	2023-08-17	2026-03-28 08:27:33.920804	\N	backfill	\N	0.08	2.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.3	12.6	19.1	38.2	65
1328	2023-08-18	2026-03-28 08:27:34.366159	\N	backfill	\N	0.24	2.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.1	7.8	20.5	49	65
1329	2023-08-19	2026-03-28 08:27:34.811812	\N	backfill	\N	0.12	2.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.8	0	15.2	26.6	3
1330	2023-08-20	2026-03-28 08:27:35.257186	\N	backfill	\N	0.38	2.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.9	0	20.3	41	0
1331	2023-08-21	2026-03-28 08:27:35.702517	\N	backfill	\N	0.3	2.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.5	0	16	29.2	0
1332	2023-08-22	2026-03-28 08:27:36.148229	\N	backfill	\N	0.08	2.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.6	0	10.9	23.8	1
1333	2023-08-23	2026-03-28 08:27:36.592588	\N	backfill	\N	0.12	2.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.2	0	8	20.5	2
1334	2023-08-24	2026-03-28 08:27:37.038276	\N	backfill	\N	0.12	2.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.4	0	10.3	24.8	2
1335	2023-08-25	2026-03-28 08:27:37.483403	\N	backfill	\N	0.14	2.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.2	0	13	28.1	3
1336	2023-08-26	2026-03-28 08:27:37.928771	\N	backfill	\N	0.22	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.3	0	17.8	34.2	1
1337	2023-08-27	2026-03-28 08:27:38.374356	\N	backfill	\N	0.38	3.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.5	0.1	21.3	36.7	51
1338	2023-08-28	2026-03-28 08:27:38.819669	\N	backfill	\N	0.54	5.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.9	13	31.4	56.5	63
1339	2023-08-29	2026-03-28 08:27:39.263643	\N	backfill	\N	0.48	5.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.7	19.9	16.3	37.8	63
1340	2023-08-30	2026-03-28 08:27:39.70857	\N	backfill	\N	0.84	4.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.3	23.3	37.6	70.6	63
1341	2023-08-31	2026-03-28 08:27:40.153757	\N	backfill	\N	0.34	3.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.5	0.3	12.8	31.3	51
1342	2023-09-01	2026-03-28 08:27:40.598794	\N	backfill	\N	0.18	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.7	0.5	11.6	23	51
1343	2023-09-02	2026-03-28 08:27:41.044613	\N	backfill	\N	0.1	2.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.7	0	10.1	23.8	3
1344	2023-09-03	2026-03-28 08:27:41.489211	\N	backfill	\N	0.02	2.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.7	0	9.5	20.2	3
1345	2023-09-04	2026-03-28 08:27:41.935005	\N	backfill	\N	0.42	3.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.1	0	20.5	38.9	3
1346	2023-09-05	2026-03-28 08:27:42.380323	\N	backfill	\N	0.8	4.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.2	0	29.5	58	3
1347	2023-09-06	2026-03-28 08:27:42.826159	\N	backfill	\N	0.68	4.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.5	0	20.3	40	0
1348	2023-09-07	2026-03-28 08:27:43.272541	\N	backfill	\N	0.56	3.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.1	0	21.6	42.8	0
1349	2023-09-08	2026-03-28 08:27:43.718013	\N	backfill	\N	0.56	3.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.2	0	20.4	38.2	0
1350	2023-09-09	2026-03-28 08:27:44.163108	\N	backfill	\N	0.44	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.3	0	17.1	33.5	0
1351	2023-09-10	2026-03-28 08:27:44.608212	\N	backfill	\N	0.22	2.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.8	0	12	26.3	0
1352	2023-09-11	2026-03-28 08:27:45.053468	\N	backfill	\N	0.04	4.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.1	0	9	18.7	3
1353	2023-09-12	2026-03-28 08:27:46.885112	\N	backfill	\N	0.12	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.7	0	14	30.6	3
1354	2023-09-13	2026-03-28 08:27:47.33058	\N	backfill	\N	0.28	3.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.1	0.9	13.1	27.4	53
1355	2023-09-14	2026-03-28 08:27:47.775983	\N	backfill	\N	0.12	2.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.1	2.2	12.7	29.9	61
1356	2023-09-15	2026-03-28 08:27:48.221748	\N	backfill	\N	0.12	2.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.8	2.7	14.2	30.6	61
1357	2023-09-16	2026-03-28 08:27:48.667401	\N	backfill	\N	0.06	2.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.9	3.1	8.7	19.1	61
1358	2023-09-17	2026-03-28 08:27:49.112662	\N	backfill	\N	0.08	2.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.2	0.9	11.1	27.7	51
1359	2023-09-18	2026-03-28 08:27:49.558022	\N	backfill	\N	0.54	3.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.9	0.1	22	39.2	51
1360	2023-09-19	2026-03-28 08:27:50.003469	\N	backfill	\N	0.3	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.6	0.4	16.4	32.4	51
1361	2023-09-20	2026-03-28 08:27:50.448983	\N	backfill	\N	0.24	2.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.1	1.4	10.6	31	53
1362	2023-09-21	2026-03-28 08:27:50.89319	\N	backfill	\N	0.3	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.6	4.2	15.9	31.7	61
1363	2023-09-22	2026-03-28 08:27:51.338499	\N	backfill	\N	0.42	4.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.1	3	26.4	47.9	55
1364	2023-09-23	2026-03-28 08:27:51.783868	\N	backfill	\N	0.62	6.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.9	13.9	25	49.3	63
1365	2023-09-24	2026-03-28 08:27:52.228981	\N	backfill	\N	0.6	4.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.8	2.3	23.7	45.4	61
1366	2023-09-25	2026-03-28 08:27:52.673533	\N	backfill	\N	0.64	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.2	0.2	21	42.5	51
1367	2023-09-26	2026-03-28 08:27:53.122975	\N	backfill	\N	0.5	3.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.8	0	22.5	39.2	0
1368	2023-09-27	2026-03-28 08:27:53.568436	\N	backfill	\N	0.64	3.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.7	0	24.8	49	3
1369	2023-09-28	2026-03-28 08:27:54.013673	\N	backfill	\N	0.56	3.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.6	0	18.1	32.8	3
1370	2023-09-29	2026-03-28 08:27:54.459284	\N	backfill	\N	0.28	2.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.2	0	12.2	25.9	3
1371	2023-09-30	2026-03-28 08:27:54.904597	\N	backfill	\N	0.06	2.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.4	0	8	20.5	3
1372	2023-10-01	2026-03-28 08:27:55.349173	\N	backfill	\N	0.06	2.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.3	0	9.8	23.4	2
1373	2023-10-02	2026-03-28 08:27:55.794164	\N	backfill	\N	0.04	2.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.3	0	8.8	20.9	3
1374	2023-10-03	2026-03-28 08:27:56.239365	\N	backfill	\N	0.06	2.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.6	0	11.5	25.2	3
1375	2023-10-04	2026-03-28 08:27:56.684413	\N	backfill	\N	0.64	3.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.5	2.5	19.2	43.2	61
1376	2023-10-05	2026-03-28 08:27:57.130653	\N	backfill	\N	0.48	3.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.3	0	10.5	24.1	3
1377	2023-10-06	2026-03-28 08:27:57.575617	\N	backfill	\N	0.16	2.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.2	0	11.7	26.3	3
1378	2023-10-07	2026-03-28 08:27:58.021584	\N	backfill	\N	0.08	2.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.9	0	10.9	22	3
1379	2023-10-08	2026-03-28 08:27:58.466116	\N	backfill	\N	0.04	2.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.6	0	11.5	24.5	3
1380	2023-10-09	2026-03-28 08:27:58.911246	\N	backfill	\N	0.08	2.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.5	0	9.6	20.2	3
1381	2023-10-10	2026-03-28 08:27:59.355976	\N	backfill	\N	0.14	2.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20	0	9.7	21.2	3
1382	2023-10-11	2026-03-28 08:27:59.80147	\N	backfill	\N	0.04	2.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.6	0	9.2	19.8	3
1383	2023-10-12	2026-03-28 08:28:00.247296	\N	backfill	\N	0.04	2.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.5	0	10	22.3	3
1384	2023-10-13	2026-03-28 08:28:00.692015	\N	backfill	\N	0.16	4.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20	0	14.2	27.7	3
1385	2023-10-14	2026-03-28 08:28:01.137969	\N	backfill	\N	0.18	2.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.4	0	14.5	25.9	3
1386	2023-10-15	2026-03-28 08:28:01.586578	\N	backfill	\N	0.9	4.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.4	3.8	27.8	57.6	55
1387	2023-10-16	2026-03-28 08:28:02.038608	\N	backfill	\N	0.92	5.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.2	0	24.4	45.4	3
1388	2023-10-17	2026-03-28 08:28:02.483956	\N	backfill	\N	0.52	3.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15	0	17.8	35.3	3
1389	2023-10-18	2026-03-28 08:28:02.93005	\N	backfill	\N	0.3	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.2	4.6	13	24.1	53
1390	2023-10-19	2026-03-28 08:28:03.376241	\N	backfill	\N	0.82	7.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.8	4.5	7.1	22.3	63
1391	2023-10-20	2026-03-28 08:28:03.821579	\N	backfill	\N	0.92	7.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.7	1	33.2	61.2	53
1392	2023-10-21	2026-03-28 08:28:04.267454	\N	backfill	\N	0.66	6.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.8	2	26.1	47.5	61
1393	2023-10-22	2026-03-28 08:28:04.712779	\N	backfill	\N	0.36	8.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18	0	12.7	28.8	3
1394	2023-10-23	2026-03-28 08:28:05.157439	\N	backfill	\N	0.22	6.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17	0	15.3	26.3	3
1395	2023-10-24	2026-03-28 08:28:05.602024	\N	backfill	\N	1.02	5.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.9	12.3	31.9	57.6	61
1396	2023-10-25	2026-03-28 08:28:06.046818	\N	backfill	\N	0.44	6.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.2	0.1	18.6	38.5	51
1397	2023-10-26	2026-03-28 08:28:06.492182	\N	backfill	\N	0.2	5.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.2	4.2	19.7	45	61
1398	2023-10-27	2026-03-28 08:28:06.937501	\N	backfill	\N	0.58	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.6	1.7	35.3	61.6	55
1399	2023-10-28	2026-03-28 08:28:07.382598	\N	backfill	\N	0.4	5.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.4	0	16.3	37.1	3
1400	2023-10-29	2026-03-28 08:28:07.827701	\N	backfill	\N	0.32	4.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.2	0	18.8	37.8	3
1401	2023-10-30	2026-03-28 08:28:08.271698	\N	backfill	\N	1.38	6.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.3	6.4	34.4	63	61
1402	2023-10-31	2026-03-28 08:28:08.716823	\N	backfill	\N	1.16	7.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.1	4.9	46.7	89.6	63
1403	2023-11-01	2026-03-28 08:28:09.161997	\N	backfill	\N	0.34	7.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14	0.6	10.1	18.7	51
1404	2023-11-02	2026-03-28 08:28:09.606201	\N	backfill	\N	1.3	7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.8	30.3	41.6	74.9	65
1405	2023-11-03	2026-03-28 08:28:10.051279	\N	backfill	\N	0.96	6.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.1	4.8	39.4	83.5	63
1406	2023-11-04	2026-03-28 08:28:10.496323	\N	backfill	\N	0.62	6.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.8	0.2	35.5	61.6	51
1407	2023-11-05	2026-03-28 08:28:10.94137	\N	backfill	\N	0.92	7.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.7	13.5	38.2	73.8	63
1408	2023-11-06	2026-03-28 08:28:11.386843	\N	backfill	\N	0.28	7.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.3	0	17.8	32	3
1409	2023-11-07	2026-03-28 08:28:11.832159	\N	backfill	\N	0.2	5.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.1	0.3	11.9	27.4	51
1410	2023-11-08	2026-03-28 08:28:12.277441	\N	backfill	\N	0.12	4.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.5	0	15.3	27.4	1
1411	2023-11-09	2026-03-28 08:28:12.722615	\N	backfill	\N	0.2	5.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.1	0.7	12.2	20.9	53
1412	2023-11-10	2026-03-28 08:28:13.168453	\N	backfill	\N	0.38	4.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.9	13.3	16.1	28.8	61
1413	2023-11-11	2026-03-28 08:28:13.613854	\N	backfill	\N	0.34	7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.2	0	20.7	36.4	3
1414	2023-11-12	2026-03-28 08:28:14.059432	\N	backfill	\N	0.18	5.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.2	0.4	10.7	21.2	51
1415	2023-11-13	2026-03-28 08:28:14.504646	\N	backfill	\N	0.12	4.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.6	0	9	16.9	3
1416	2023-11-14	2026-03-28 08:28:14.951148	\N	backfill	\N	0.26	5.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.6	0	12.6	25.2	3
1417	2023-11-15	2026-03-28 08:28:15.396398	\N	backfill	\N	0.36	5.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12	0	15.3	31	3
1418	2023-11-16	2026-03-28 08:28:15.841691	\N	backfill	\N	0.16	6.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11	0	8.4	17.6	3
1419	2023-11-17	2026-03-28 08:28:16.287388	\N	backfill	\N	0.32	4.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.9	0	25.5	49.7	3
1420	2023-11-18	2026-03-28 08:28:16.732673	\N	backfill	\N	0.3	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.6	0	10.5	23.8	3
1421	2023-11-19	2026-03-28 08:28:17.178395	\N	backfill	\N	0.06	2.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.7	0	8.9	21.6	3
1422	2023-11-20	2026-03-28 08:28:17.624091	\N	backfill	\N	0.06	2.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10	0.3	12.5	21.2	51
1423	2023-11-21	2026-03-28 08:28:18.068643	\N	backfill	\N	1	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.8	21.5	31.4	55.4	63
1424	2023-11-22	2026-03-28 08:28:18.51319	\N	backfill	\N	1.36	5.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.1	0	42.9	78.1	3
1425	2023-11-23	2026-03-28 08:28:18.958575	\N	backfill	\N	1.16	5.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.9	0	28.6	50.8	3
1426	2023-11-24	2026-03-28 08:28:19.403487	\N	backfill	\N	0.24	7.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.6	0.2	13.4	27	51
1427	2023-11-25	2026-03-28 08:28:19.848537	\N	backfill	\N	0.7	4.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9	0	32	61.6	3
1428	2023-11-26	2026-03-28 08:28:20.294859	\N	backfill	\N	0.46	3.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7	0	25.9	50	2
1429	2023-11-27	2026-03-28 08:28:20.739897	\N	backfill	\N	0.1	3.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.4	0.5	10.1	21.2	51
1430	2023-11-28	2026-03-28 08:28:21.185309	\N	backfill	\N	0.36	4.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.7	4.1	17.3	36	55
1431	2023-11-29	2026-03-28 08:28:21.630965	\N	backfill	\N	0.38	4.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.5	0.3	15.1	30.6	51
1432	2023-11-30	2026-03-28 08:28:22.077024	\N	backfill	\N	0.42	5.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.5	5	19.1	33.8	53
1433	2023-12-01	2026-03-28 08:28:22.522242	\N	backfill	\N	0.62	6.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11	0.3	27.9	49.3	51
1434	2023-12-02	2026-03-28 08:28:22.967391	\N	backfill	\N	0.98	5.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13	1.8	35.5	69.5	55
1435	2023-12-03	2026-03-28 08:28:23.413583	\N	backfill	\N	1.16	5.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.3	0.1	35.2	64.4	51
1436	2023-12-04	2026-03-28 08:28:23.858744	\N	backfill	\N	0.5	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.5	1.7	21.4	37.8	53
1437	2023-12-05	2026-03-28 08:28:24.303774	\N	backfill	\N	0.42	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.8	9.5	18.8	36.4	61
1438	2023-12-06	2026-03-28 08:28:24.748837	\N	backfill	\N	0.4	3.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.5	0	18.9	36.4	3
1439	2023-12-07	2026-03-28 08:28:25.193951	\N	backfill	\N	0.28	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.4	0	9.6	19.8	3
1440	2023-12-08	2026-03-28 08:28:25.639147	\N	backfill	\N	0.22	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5	1.2	12.4	26.3	51
1441	2023-12-09	2026-03-28 08:28:26.085103	\N	backfill	\N	0.22	2.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.9	0.1	15	31.3	51
1442	2023-12-10	2026-03-28 08:28:26.536043	\N	backfill	\N	0.18	4.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.7	4.3	16.4	32	61
1443	2023-12-11	2026-03-28 08:28:28.354209	\N	backfill	\N	0.3	5.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.9	0	12.7	22.7	3
1444	2023-12-12	2026-03-28 08:28:28.800146	\N	backfill	\N	0.28	5.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.7	0	10.4	19.4	3
1445	2023-12-13	2026-03-28 08:28:29.245695	\N	backfill	\N	0.36	6.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.5	14.7	12.7	25.2	63
1446	2023-12-14	2026-03-28 08:28:29.691706	\N	backfill	\N	0.22	7.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.6	0	12.3	24.1	3
1447	2023-12-15	2026-03-28 08:28:30.137223	\N	backfill	\N	0.8	7.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.3	0	26	46.1	3
1448	2023-12-16	2026-03-28 08:28:30.582504	\N	backfill	\N	0.82	4.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10	0	25.4	48.2	0
1449	2023-12-17	2026-03-28 08:28:31.027256	\N	backfill	\N	0.64	3.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.8	0	18.9	33.1	3
1450	2023-12-18	2026-03-28 08:28:31.47171	\N	backfill	\N	0.1	3.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.8	0	12.5	21.6	3
1451	2023-12-19	2026-03-28 08:28:31.917116	\N	backfill	\N	0.04	3.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.6	0	11.4	20.9	2
1452	2023-12-20	2026-03-28 08:28:32.361671	\N	backfill	\N	0.16	4.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.3	0	14.2	24.1	3
1453	2023-12-21	2026-03-28 08:28:32.805665	\N	backfill	\N	0.22	3.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.4	0	16.3	29.2	3
1454	2023-12-22	2026-03-28 08:28:33.251159	\N	backfill	\N	0.26	2.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.4	0	23.8	40.7	3
1455	2023-12-23	2026-03-28 08:28:33.696131	\N	backfill	\N	0.24	2.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.1	0	27	45	3
1456	2023-12-24	2026-03-28 08:28:34.14136	\N	backfill	\N	0.1	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6	0	12.1	25.9	3
1457	2023-12-25	2026-03-28 08:28:34.587293	\N	backfill	\N	0.16	4.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.5	0	9	16.9	3
1458	2023-12-26	2026-03-28 08:28:35.033441	\N	backfill	\N	0.18	5.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.2	0	8.2	15.1	3
1459	2023-12-27	2026-03-28 08:28:35.477761	\N	backfill	\N	0.06	4.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.3	0	6.6	16.2	3
1460	2023-12-28	2026-03-28 08:28:35.923476	\N	backfill	\N	0.04	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.1	0	10.6	21.6	3
1461	2023-12-29	2026-03-28 08:28:36.368172	\N	backfill	\N	0.04	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.6	0	9.8	16.6	3
1462	2023-12-30	2026-03-28 08:28:36.813611	\N	backfill	\N	0.04	3.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.1	0.5	7.4	16.6	51
1463	2023-12-31	2026-03-28 08:28:37.25924	\N	backfill	\N	0.5	3.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.1	0.2	20.2	35.3	51
1464	2024-01-01	2026-03-28 08:28:37.703708	\N	backfill	\N	0.56	5.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.3	0.4	23.2	48.6	51
1465	2024-01-02	2026-03-28 08:28:38.148677	\N	backfill	\N	0.16	5.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6	0	11.4	20.9	3
1466	2024-01-03	2026-03-28 08:28:38.59344	\N	backfill	\N	0.2	4.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.6	0.1	9.3	16.6	51
1467	2024-01-04	2026-03-28 08:28:39.038907	\N	backfill	\N	0.18	4.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.1	0	16.2	31.3	3
1468	2024-01-05	2026-03-28 08:28:39.484207	\N	backfill	\N	0.54	4.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.7	8.3	25	42.5	61
1469	2024-01-06	2026-03-28 08:28:39.929582	\N	backfill	\N	0.64	5.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.7	37.3	34.5	60.5	63
1470	2024-01-07	2026-03-28 08:28:40.375305	\N	backfill	\N	1.14	5.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.4	18	33	60.8	63
1471	2024-01-08	2026-03-28 08:28:40.820349	\N	backfill	\N	1.36	5.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.4	0.1	37.2	69.5	51
1472	2024-01-09	2026-03-28 08:28:41.26624	\N	backfill	\N	1.26	5.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6	0	29.2	56.2	3
1473	2024-01-10	2026-03-28 08:28:41.711579	\N	backfill	\N	0.8	5.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.4	0	21.1	37.1	3
1474	2024-01-11	2026-03-28 08:28:42.157111	\N	backfill	\N	0.58	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.6	0	17.5	34.2	3
1475	2024-01-12	2026-03-28 08:28:42.602132	\N	backfill	\N	0.34	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.3	0	12	24.1	3
1476	2024-01-13	2026-03-28 08:28:43.047976	\N	backfill	\N	0.34	3.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2.2	0	10.1	19.8	3
1477	2024-01-14	2026-03-28 08:28:43.493316	\N	backfill	\N	0.08	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3	0	9.2	19.4	3
1478	2024-01-15	2026-03-28 08:28:43.938566	\N	backfill	\N	0.18	4.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.9	0.2	12.3	21.2	51
1479	2024-01-16	2026-03-28 08:28:44.383739	\N	backfill	\N	0.4	4.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.3	0.2	14.3	28.4	51
1480	2024-01-17	2026-03-28 08:28:44.828923	\N	backfill	\N	0.3	4.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7	4.9	20.1	35.6	61
1481	2024-01-18	2026-03-28 08:28:45.274145	\N	backfill	\N	0.4	7.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.7	1	17.9	39.2	53
1482	2024-01-19	2026-03-28 08:28:45.719858	\N	backfill	\N	1.68	6.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.7	4.5	46.1	86.4	61
1483	2024-01-20	2026-03-28 08:28:46.165169	\N	backfill	\N	1.36	5.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.9	0	35.4	63.7	2
1484	2024-01-21	2026-03-28 08:28:46.610449	\N	backfill	\N	0.6	3.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4	0	15.9	32.8	3
1485	2024-01-22	2026-03-28 08:28:47.054738	\N	backfill	\N	0.12	3.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1.7	0.3	12.9	22	51
1486	2024-01-23	2026-03-28 08:28:47.500135	\N	backfill	\N	0.06	4.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5	0	10.3	23.4	3
1487	2024-01-24	2026-03-28 08:28:47.945306	\N	backfill	\N	0.04	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.8	0	9.5	16.6	3
1488	2024-01-25	2026-03-28 08:28:48.390784	\N	backfill	\N	0.06	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.6	0	8.9	18	3
1489	2024-01-26	2026-03-28 08:28:48.835824	\N	backfill	\N	0.04	2.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.2	0	7.9	19.4	3
1490	2024-01-27	2026-03-28 08:28:49.280706	\N	backfill	\N	0.04	2.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.7	0	9.9	20.5	3
1491	2024-01-28	2026-03-28 08:28:49.725134	\N	backfill	\N	0.04	1.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.9	0	8.7	19.1	3
1492	2024-01-29	2026-03-28 08:28:50.170401	\N	backfill	\N	0.1	1.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2.4	0	10.6	21.6	3
1493	2024-01-30	2026-03-28 08:28:50.615353	\N	backfill	\N	0.1	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1.9	0	10.8	22	3
1494	2024-01-31	2026-03-28 08:28:51.060473	\N	backfill	\N	0.08	7.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	0	8.3	20.2	3
1495	2024-02-01	2026-03-28 08:28:51.505672	\N	backfill	\N	0.04	4.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2.7	0	10.1	20.5	3
1496	2024-02-02	2026-03-28 08:28:51.951368	\N	backfill	\N	0.04	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.3	0	8	16.2	3
1497	2024-02-03	2026-03-28 08:28:52.396394	\N	backfill	\N	0.02	3.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.1	0	4	15.8	3
1498	2024-02-04	2026-03-28 08:28:52.841442	\N	backfill	\N	0.02	3.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.8	0	8	20.2	3
1499	2024-02-05	2026-03-28 08:28:53.286817	\N	backfill	\N	0.02	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.8	0	8.8	22	3
1500	2024-02-06	2026-03-28 08:28:53.732048	\N	backfill	\N	0.04	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.9	0	9.3	20.5	3
1501	2024-02-07	2026-03-28 08:28:54.177587	\N	backfill	\N	0.14	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.6	0.2	9.6	19.8	51
1502	2024-02-08	2026-03-28 08:28:54.622903	\N	backfill	\N	0.12	4.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.2	0	8.9	17.6	3
1503	2024-02-09	2026-03-28 08:28:55.067057	\N	backfill	\N	0.6	4.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.9	6.2	22	37.8	53
1504	2024-02-10	2026-03-28 08:28:55.511354	\N	backfill	\N	0.64	5.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11	10.6	24.6	42.5	61
1505	2024-02-11	2026-03-28 08:28:55.95726	\N	backfill	\N	0.66	7.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.9	10.7	19.7	37.4	63
1506	2024-02-12	2026-03-28 08:28:56.402279	\N	backfill	\N	0.4	7.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.4	4.9	13.2	27.4	61
1507	2024-02-13	2026-03-28 08:28:56.847069	\N	backfill	\N	0.12	7.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.9	0	11.7	23.4	3
1508	2024-02-14	2026-03-28 08:28:57.292298	\N	backfill	\N	0.06	7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7	0	6.2	16.6	3
1509	2024-02-15	2026-03-28 08:28:57.737435	\N	backfill	\N	0.02	3.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.7	0	6.4	13.7	3
1510	2024-02-16	2026-03-28 08:28:58.185191	\N	backfill	\N	0.02	4.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.4	0	5.5	14.8	3
1511	2024-02-17	2026-03-28 08:28:58.63133	\N	backfill	\N	0.02	4.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.1	0	5.8	14.4	3
1512	2024-02-18	2026-03-28 08:28:59.07638	\N	backfill	\N	0.04	4.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.4	0.2	9	20.9	51
1513	2024-02-19	2026-03-28 08:28:59.521455	\N	backfill	\N	0.04	2.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.5	0.2	8.8	17.6	51
1514	2024-02-20	2026-03-28 08:28:59.96681	\N	backfill	\N	0.1	2.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.8	0	9.7	20.9	3
1515	2024-02-21	2026-03-28 08:29:00.41233	\N	backfill	\N	0.06	2.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.6	0	9.8	17.6	3
1516	2024-02-22	2026-03-28 08:29:00.857407	\N	backfill	\N	0.66	3.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.1	1	25.6	44.6	53
1517	2024-02-23	2026-03-28 08:29:01.302616	\N	backfill	\N	1.08	6.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.4	18.6	40.1	75.6	63
1518	2024-02-24	2026-03-28 08:29:01.747973	\N	backfill	\N	0.72	6.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.5	0	23.9	46.8	3
1519	2024-02-25	2026-03-28 08:29:02.193588	\N	backfill	\N	0.36	5.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.5	0.2	10.7	22.7	51
1520	2024-02-26	2026-03-28 08:29:02.638676	\N	backfill	\N	0.56	6.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.8	7.2	23.8	41.4	61
1521	2024-02-27	2026-03-28 08:29:03.083981	\N	backfill	\N	0.76	4.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.2	14.4	29.3	51.5	61
1522	2024-02-28	2026-03-28 08:29:03.528316	\N	backfill	\N	0.8	5.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.1	22.1	27.3	48.6	63
1523	2024-02-29	2026-03-28 08:29:03.973813	\N	backfill	\N	0.68	4.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.1	16.6	27.5	47.5	63
1524	2024-03-01	2026-03-28 08:29:04.419155	\N	backfill	\N	0.68	4.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.5	12.3	23.2	47.9	63
1525	2024-03-02	2026-03-28 08:29:04.864256	\N	backfill	\N	0.52	5.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.6	3.5	13.3	28.4	61
1526	2024-03-03	2026-03-28 08:29:05.309537	\N	backfill	\N	0.64	5.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.2	0.1	21.7	41.8	51
1527	2024-03-04	2026-03-28 08:29:05.754671	\N	backfill	\N	0.74	5.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.8	8.2	26.1	52.2	61
1528	2024-03-05	2026-03-28 08:29:06.199914	\N	backfill	\N	0.44	6.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.9	1.4	17.9	30.6	55
1529	2024-03-06	2026-03-28 08:29:06.645358	\N	backfill	\N	0.2	6.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.2	0.1	16.1	31	51
1530	2024-03-07	2026-03-28 08:29:07.090657	\N	backfill	\N	0.2	2.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.5	3.4	11.5	29.2	55
1531	2024-03-08	2026-03-28 08:29:07.536131	\N	backfill	\N	0.66	3.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10	3.3	21.3	41.8	53
1532	2024-03-09	2026-03-28 08:29:07.981371	\N	backfill	\N	0.74	6.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.1	5.3	18.7	38.9	61
1533	2024-03-10	2026-03-28 08:29:09.781018	\N	backfill	\N	1.04	6.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.5	8.6	34.4	65.5	63
1534	2024-03-11	2026-03-28 08:29:10.225685	\N	backfill	\N	0.8	8.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.3	0	16.4	28.8	3
1535	2024-03-12	2026-03-28 08:29:10.670195	\N	backfill	\N	0.3	8.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.6	0	11.7	24.8	3
1536	2024-03-13	2026-03-28 08:29:11.115271	\N	backfill	\N	0.2	7.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.7	1.1	10.4	22	51
1537	2024-03-14	2026-03-28 08:29:11.560299	\N	backfill	\N	0.04	5.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.4	0	9.4	19.1	3
1538	2024-03-15	2026-03-28 08:29:12.005243	\N	backfill	\N	0.02	4.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.1	0	8.2	19.8	3
1539	2024-03-16	2026-03-28 08:29:12.450192	\N	backfill	\N	0.02	2.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.7	0.9	9	16.2	51
1540	2024-03-17	2026-03-28 08:29:12.895503	\N	backfill	\N	0.02	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.3	0	7.4	19.1	3
1541	2024-03-18	2026-03-28 08:29:13.340542	\N	backfill	\N	0.06	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12	5.1	11.1	20.2	53
1542	2024-03-19	2026-03-28 08:29:13.785669	\N	backfill	\N	0.1	2.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.6	0	11	23.4	3
1543	2024-03-20	2026-03-28 08:29:14.230915	\N	backfill	\N	0.12	2.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.8	0	11.6	20.2	3
1544	2024-03-21	2026-03-28 08:29:14.676027	\N	backfill	\N	0.04	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.7	0.3	12.1	25.9	51
1545	2024-03-22	2026-03-28 08:29:15.121524	\N	backfill	\N	0.18	4.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.1	0.2	13.4	24.8	51
1546	2024-03-23	2026-03-28 08:29:15.566581	\N	backfill	\N	0.34	2.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.2	0	24.1	46.4	3
1547	2024-03-24	2026-03-28 08:29:16.01145	\N	backfill	\N	0.66	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.6	0.6	33.1	59	53
1548	2024-03-25	2026-03-28 08:29:16.457305	\N	backfill	\N	0.24	5.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.7	0	15.8	28.8	3
1549	2024-03-26	2026-03-28 08:29:16.902409	\N	backfill	\N	0.94	6.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.5	14.9	26.8	48.2	63
1550	2024-03-27	2026-03-28 08:29:17.34793	\N	backfill	\N	0.8	6.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.5	22.8	32.6	60.8	63
1551	2024-03-28	2026-03-28 08:29:17.793159	\N	backfill	\N	0.58	5.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.5	5.2	30.6	60.5	63
1552	2024-03-29	2026-03-28 08:29:18.238588	\N	backfill	\N	0.58	6.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.4	0	16.9	32.8	3
1553	2024-03-30	2026-03-28 08:29:18.683557	\N	backfill	\N	1.08	6.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.5	0.6	31.2	54.4	53
1554	2024-03-31	2026-03-28 08:29:19.129689	\N	backfill	\N	1	7.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.2	8.1	20.9	38.5	63
1555	2024-04-01	2026-03-28 08:29:19.575431	\N	backfill	\N	0.92	7.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.2	6.1	24.4	45.4	63
1556	2024-04-02	2026-03-28 08:29:20.020537	\N	backfill	\N	0.62	7.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.1	0.4	19.5	42.1	51
1557	2024-04-03	2026-03-28 08:29:20.465524	\N	backfill	\N	0.2	5.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.4	0.3	12.9	27.7	51
1558	2024-04-04	2026-03-28 08:29:20.910546	\N	backfill	\N	0.14	3.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.5	0	14.1	27.4	3
1559	2024-04-05	2026-03-28 08:29:21.356128	\N	backfill	\N	0.14	2.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.9	0	14.8	30.6	3
1560	2024-04-06	2026-03-28 08:29:21.801915	\N	backfill	\N	0.12	2.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.9	0	13.2	26.3	3
1561	2024-04-07	2026-03-28 08:29:22.247095	\N	backfill	\N	0.06	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.6	0	10.5	23	3
1562	2024-04-08	2026-03-28 08:29:22.692207	\N	backfill	\N	0.02	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.8	0	9.7	23.8	3
1563	2024-04-09	2026-03-28 08:29:23.137508	\N	backfill	\N	0.32	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.5	0	12.9	29.5	3
1564	2024-04-10	2026-03-28 08:29:23.582977	\N	backfill	\N	0.9	4.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16	10.1	33.1	60.1	63
1565	2024-04-11	2026-03-28 08:29:24.028425	\N	backfill	\N	0.76	4.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.9	0	21.6	41	3
1566	2024-04-12	2026-03-28 08:29:24.473103	\N	backfill	\N	0.32	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.9	0	15.3	29.2	0
1567	2024-04-13	2026-03-28 08:29:24.918557	\N	backfill	\N	0.08	2.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.1	0	10.3	20.5	3
1568	2024-04-14	2026-03-28 08:29:25.363043	\N	backfill	\N	0.14	2.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.1	0	14.8	28.4	3
1569	2024-04-15	2026-03-28 08:29:25.808068	\N	backfill	\N	0.36	2.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.8	0	25.8	46.1	3
1570	2024-04-16	2026-03-28 08:29:26.252861	\N	backfill	\N	1.9	6.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.5	1.2	50.8	108.4	55
1571	2024-04-17	2026-03-28 08:29:26.706772	\N	backfill	\N	1.28	6.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.4	1.2	22.2	51.5	55
1572	2024-04-18	2026-03-28 08:29:27.151932	\N	backfill	\N	0.58	5.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.2	7.3	24.9	44.6	63
1573	2024-04-19	2026-03-28 08:29:27.596793	\N	backfill	\N	0.62	3.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.3	0.2	25.4	45	51
1574	2024-04-20	2026-03-28 08:29:28.042569	\N	backfill	\N	0.4	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12	0.8	21	44.3	53
1575	2024-04-21	2026-03-28 08:29:28.487756	\N	backfill	\N	0.24	3.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.5	0.1	16.9	32	51
1576	2024-04-22	2026-03-28 08:29:28.933709	\N	backfill	\N	1.12	5.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.6	31.8	36.9	66.6	63
1577	2024-04-23	2026-03-28 08:29:29.378141	\N	backfill	\N	1.04	5.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.6	6.7	26.4	54.7	63
1578	2024-04-24	2026-03-28 08:29:29.823337	\N	backfill	\N	0.54	3.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.6	6.2	22.5	46.1	61
1579	2024-04-25	2026-03-28 08:29:30.268545	\N	backfill	\N	0.8	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.3	2.5	22.9	44.6	61
1580	2024-04-26	2026-03-28 08:29:30.713288	\N	backfill	\N	0.22	3.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.2	0.6	13.8	31	51
1581	2024-04-27	2026-03-28 08:29:31.158529	\N	backfill	\N	0.2	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.8	1.2	11.4	26.3	55
1582	2024-04-28	2026-03-28 08:29:31.604593	\N	backfill	\N	0.28	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.3	0	15.2	29.9	3
1583	2024-04-29	2026-03-28 08:29:32.049569	\N	backfill	\N	0.12	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16	0	9.4	21.6	3
1584	2024-04-30	2026-03-28 08:29:32.495003	\N	backfill	\N	0.04	2.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.8	0	8.7	20.2	3
1585	2024-05-01	2026-03-28 08:29:32.939998	\N	backfill	\N	0.82	4.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.7	2.7	29.3	54.7	55
1586	2024-05-02	2026-03-28 08:29:33.385232	\N	backfill	\N	0.86	5.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.5	1.4	35.6	68.8	53
1587	2024-05-03	2026-03-28 08:29:33.830397	\N	backfill	\N	0.3	4.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.9	0.5	14.5	25.9	51
1588	2024-05-04	2026-03-28 08:29:34.276564	\N	backfill	\N	0.08	4.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.4	0.5	11	26.3	51
1589	2024-05-05	2026-03-28 08:29:34.722206	\N	backfill	\N	0.34	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.8	0.4	18.4	34.6	51
1590	2024-05-06	2026-03-28 08:29:35.16686	\N	backfill	\N	0.24	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.1	0	13	28.1	3
1591	2024-05-07	2026-03-28 08:29:35.611637	\N	backfill	\N	0.22	5.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.7	1.9	12.7	26.6	53
1592	2024-05-08	2026-03-28 08:29:36.056433	\N	backfill	\N	0.24	5.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.3	0.4	24.9	43.9	51
1593	2024-05-09	2026-03-28 08:29:36.501526	\N	backfill	\N	0.56	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.4	0	22.8	43.2	3
1594	2024-05-10	2026-03-28 08:29:36.946387	\N	backfill	\N	0.52	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.6	0	19.6	34.2	3
1595	2024-05-11	2026-03-28 08:29:37.391324	\N	backfill	\N	0.14	2.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.1	0	9.3	20.2	2
1596	2024-05-12	2026-03-28 08:29:37.836135	\N	backfill	\N	0.04	4.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.8	0	10.5	22.7	3
1597	2024-05-13	2026-03-28 08:29:38.281193	\N	backfill	\N	0.18	2.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.6	0.5	12.6	28.4	51
1598	2024-05-14	2026-03-28 08:29:38.726672	\N	backfill	\N	0.42	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.6	1.1	19.7	35.3	51
1599	2024-05-15	2026-03-28 08:29:39.171571	\N	backfill	\N	0.98	5.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.2	35.8	32	60.8	65
1600	2024-05-16	2026-03-28 08:29:39.61628	\N	backfill	\N	0.98	5.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.7	9.2	34.2	59	63
1601	2024-05-17	2026-03-28 08:29:40.061169	\N	backfill	\N	0.68	6.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.1	0.3	18.8	40.3	51
1602	2024-05-18	2026-03-28 08:29:40.507093	\N	backfill	\N	0.32	5.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.7	1	11.6	26.6	53
1603	2024-05-19	2026-03-28 08:29:40.95201	\N	backfill	\N	0.18	4.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.9	0.2	12.6	27.7	51
1604	2024-05-20	2026-03-28 08:29:41.397081	\N	backfill	\N	0.24	3.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.9	0.7	16.5	35.3	51
1605	2024-05-21	2026-03-28 08:29:41.841478	\N	backfill	\N	0.4	3.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.1	17.7	21.1	38.9	65
1606	2024-05-22	2026-03-28 08:29:42.287256	\N	backfill	\N	0.28	4.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18	1.7	20.4	40.3	53
1607	2024-05-23	2026-03-28 08:29:42.732481	\N	backfill	\N	0.14	5.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.6	0.9	14.7	31.3	53
1608	2024-05-24	2026-03-28 08:29:43.177518	\N	backfill	\N	0.04	3.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.1	0.5	10.8	26.6	51
1609	2024-05-25	2026-03-28 08:29:43.622556	\N	backfill	\N	0.06	2.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.5	5.6	16.5	37.4	63
1610	2024-05-26	2026-03-28 08:29:44.067053	\N	backfill	\N	0.12	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.6	0	14.3	24.8	2
1611	2024-05-27	2026-03-28 08:29:44.512793	\N	backfill	\N	0.06	2.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.2	0	9.4	25.6	3
1612	2024-05-28	2026-03-28 08:29:44.958124	\N	backfill	\N	0.12	2.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.6	2.6	10	20.9	61
1613	2024-05-29	2026-03-28 08:29:45.403514	\N	backfill	\N	0.28	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20	1.6	20.1	34.6	61
1614	2024-05-30	2026-03-28 08:29:45.848517	\N	backfill	\N	0.22	3.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20	11.7	12.4	27.7	63
1615	2024-05-31	2026-03-28 08:29:46.293711	\N	backfill	\N	0.42	4.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.1	2.2	23	47.9	53
1616	2024-06-01	2026-03-28 08:29:46.738939	\N	backfill	\N	0.36	5.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.9	0	17.1	33.5	2
1617	2024-06-02	2026-03-28 08:29:47.18434	\N	backfill	\N	0.36	4.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.7	3	16	31.7	55
1618	2024-06-03	2026-03-28 08:29:47.629607	\N	backfill	\N	0.2	4.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.2	6.6	13.2	30.2	63
1619	2024-06-04	2026-03-28 08:29:48.076145	\N	backfill	\N	0.08	4.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20	0.2	14	29.9	51
1620	2024-06-05	2026-03-28 08:29:48.521475	\N	backfill	\N	0.2	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21	0.2	18.1	32.4	51
1621	2024-06-06	2026-03-28 08:29:48.967076	\N	backfill	\N	0.14	2.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.5	0	9.7	23.8	3
1622	2024-06-07	2026-03-28 08:29:49.412368	\N	backfill	\N	0.06	2.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.8	0	11.8	26.3	3
1623	2024-06-08	2026-03-28 08:29:51.228197	\N	backfill	\N	0.26	2.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.3	0	14	31.7	3
1624	2024-06-09	2026-03-28 08:29:51.673083	\N	backfill	\N	0.4	3.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.4	3.7	22.2	48.2	61
1625	2024-06-10	2026-03-28 08:29:52.128415	\N	backfill	\N	0.38	5.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.8	5.4	17.4	39.6	63
1626	2024-06-11	2026-03-28 08:29:52.573727	\N	backfill	\N	0.28	4.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.9	5	17.5	38.9	55
1627	2024-06-12	2026-03-28 08:29:53.019685	\N	backfill	\N	0.68	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.5	2.2	15.8	33.5	61
1628	2024-06-13	2026-03-28 08:29:53.465025	\N	backfill	\N	0.78	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.4	4.6	19.3	42.8	55
1629	2024-06-14	2026-03-28 08:29:53.910313	\N	backfill	\N	0.28	2.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20	0	12.2	27.4	3
1630	2024-06-15	2026-03-28 08:29:54.355502	\N	backfill	\N	0.28	2.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21	0	16.4	33.8	3
1631	2024-06-16	2026-03-28 08:29:54.800847	\N	backfill	\N	0.34	3.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22	1.1	18.2	42.1	51
1632	2024-06-17	2026-03-28 08:29:55.245824	\N	backfill	\N	0.2	4.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.4	0	12.3	28.1	1
1633	2024-06-18	2026-03-28 08:29:55.691123	\N	backfill	\N	0.08	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.1	0	13.5	29.9	3
1634	2024-06-19	2026-03-28 08:29:56.135834	\N	backfill	\N	0.18	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.6	0	13	27.7	3
1635	2024-06-20	2026-03-28 08:29:56.580111	\N	backfill	\N	0.14	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.1	0	11.7	27	3
1636	2024-06-21	2026-03-28 08:29:57.024959	\N	backfill	\N	0.24	2.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.7	0.1	27.8	51.5	51
1637	2024-06-22	2026-03-28 08:29:57.469481	\N	backfill	\N	0.4	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25	0	19.1	50	3
1638	2024-06-23	2026-03-28 08:29:57.914796	\N	backfill	\N	0.52	4.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.7	11.1	20.4	49.7	63
1639	2024-06-24	2026-03-28 08:29:58.359424	\N	backfill	\N	0.8	4.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.1	5.6	33.9	64.8	63
1640	2024-06-25	2026-03-28 08:29:58.804475	\N	backfill	\N	0.54	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.4	4.6	18.5	37.1	61
1641	2024-06-26	2026-03-28 08:29:59.249167	\N	backfill	\N	0.28	4.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.9	6.9	16.1	32.4	63
1642	2024-06-27	2026-03-28 08:29:59.693901	\N	backfill	\N	0.16	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.9	0	10.8	22	3
1643	2024-06-28	2026-03-28 08:30:00.137741	\N	backfill	\N	0.1	3.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.7	0	10.5	24.1	2
1644	2024-06-29	2026-03-28 08:30:00.582656	\N	backfill	\N	0.02	3.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.4	0	14	25.2	3
1645	2024-06-30	2026-03-28 08:30:01.029389	\N	backfill	\N	0.16	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.4	0.3	19.5	40	51
1646	2024-07-01	2026-03-28 08:30:01.474535	\N	backfill	\N	0.3	5.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.9	12.2	26	53.6	63
1647	2024-07-02	2026-03-28 08:30:01.919578	\N	backfill	\N	0.36	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.2	1.7	16.1	33.1	55
1648	2024-07-03	2026-03-28 08:30:02.36596	\N	backfill	\N	0.52	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.7	13.5	23.8	46.1	63
1649	2024-07-04	2026-03-28 08:30:02.811124	\N	backfill	\N	0.22	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.6	2.1	10.6	25.2	61
1650	2024-07-05	2026-03-28 08:30:03.256517	\N	backfill	\N	0.06	2.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.6	0	10.5	24.5	1
1651	2024-07-06	2026-03-28 08:30:03.702468	\N	backfill	\N	0.42	3.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.7	0.5	17.7	34.2	51
1652	2024-07-07	2026-03-28 08:30:04.14756	\N	backfill	\N	0.36	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.1	0.1	16.6	37.1	51
1653	2024-07-08	2026-03-28 08:30:04.592474	\N	backfill	\N	0.22	5.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.9	0.3	10.3	25.6	51
1654	2024-07-09	2026-03-28 08:30:05.037414	\N	backfill	\N	0.08	4.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.8	0	10.7	24.8	0
1655	2024-07-10	2026-03-28 08:30:05.483013	\N	backfill	\N	0.06	2.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.1	0	9.4	20.5	3
1656	2024-07-11	2026-03-28 08:30:05.928637	\N	backfill	\N	0.04	1.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.3	0	13.3	28.4	1
1657	2024-07-12	2026-03-28 08:30:06.373706	\N	backfill	\N	0.14	2.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.2	0	13.4	29.5	3
1658	2024-07-13	2026-03-28 08:30:06.818888	\N	backfill	\N	0.26	2.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.3	1.2	15.7	31	51
1659	2024-07-14	2026-03-28 08:30:07.264206	\N	backfill	\N	0.1	2.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.9	0	12.6	25.9	3
1660	2024-07-15	2026-03-28 08:30:07.709767	\N	backfill	\N	0.04	2.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.5	0	8.8	22.3	3
1661	2024-07-16	2026-03-28 08:30:08.155232	\N	backfill	\N	0.02	2.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.1	0	14.3	30.2	1
1662	2024-07-17	2026-03-28 08:30:08.600613	\N	backfill	\N	0.04	1.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.6	0	14	29.5	3
1663	2024-07-18	2026-03-28 08:30:09.045633	\N	backfill	\N	0.2	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.9	0	16.7	33.8	1
1664	2024-07-19	2026-03-28 08:30:09.490826	\N	backfill	\N	0.28	2.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	29.2	0	19.4	31.7	3
1665	2024-07-20	2026-03-28 08:30:09.936332	\N	backfill	\N	0.66	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.8	3.6	27.1	42.5	63
1666	2024-07-21	2026-03-28 08:30:10.382005	\N	backfill	\N	0.32	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27	0	12.9	30.2	3
1667	2024-07-22	2026-03-28 08:30:10.827223	\N	backfill	\N	0.26	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.5	19.1	17.8	34.9	65
1668	2024-07-23	2026-03-28 08:30:11.272629	\N	backfill	\N	0.26	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28	0	19.5	39.2	2
1669	2024-07-24	2026-03-28 08:30:11.716772	\N	backfill	\N	0.46	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.1	0	17.1	47.9	3
1670	2024-07-25	2026-03-28 08:30:12.161388	\N	backfill	\N	0.42	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.2	0	17.9	42.1	3
1671	2024-07-26	2026-03-28 08:30:12.605798	\N	backfill	\N	0.26	3.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.1	0	16.1	32.8	1
1672	2024-07-27	2026-03-28 08:30:13.051366	\N	backfill	\N	0.12	2.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.5	0	13.2	29.5	1
1673	2024-07-28	2026-03-28 08:30:13.496139	\N	backfill	\N	0.4	2.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.4	0	16.4	34.6	1
1674	2024-07-29	2026-03-28 08:30:13.942384	\N	backfill	\N	0.58	3.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28	0	18.7	36.4	3
1675	2024-07-30	2026-03-28 08:30:14.387855	\N	backfill	\N	0.26	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.5	0	12.6	27	2
1676	2024-07-31	2026-03-28 08:30:14.832975	\N	backfill	\N	0.1	2.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.7	0	15.3	33.1	1
1677	2024-08-01	2026-03-28 08:30:15.278976	\N	backfill	\N	0.32	2.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.6	5.6	25.5	45.7	63
1678	2024-08-02	2026-03-28 08:30:15.724277	\N	backfill	\N	0.3	3.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.2	2	10.5	43.2	61
1679	2024-08-03	2026-03-28 08:30:16.177926	\N	backfill	\N	0.12	2.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.3	0.1	14.5	33.5	51
1680	2024-08-04	2026-03-28 08:30:16.623893	\N	backfill	\N	0.3	2.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.6	0.1	17.4	38.9	51
1681	2024-08-05	2026-03-28 08:30:17.069122	\N	backfill	\N	0.26	2.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.2	0	20.1	34.6	3
1682	2024-08-06	2026-03-28 08:30:17.514925	\N	backfill	\N	0.2	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.3	0.1	11.6	27.7	51
1683	2024-08-07	2026-03-28 08:30:17.960002	\N	backfill	\N	0.16	2.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.5	0.3	12.7	24.1	51
1684	2024-08-08	2026-03-28 08:30:18.40556	\N	backfill	\N	0.08	2.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.6	0	11.4	23	3
1685	2024-08-09	2026-03-28 08:30:18.850362	\N	backfill	\N	0.04	2.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.4	0	8.8	22.3	3
1686	2024-08-10	2026-03-28 08:30:19.295409	\N	backfill	\N	0.04	2.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.9	0	8.2	21.6	3
1687	2024-08-11	2026-03-28 08:30:19.740524	\N	backfill	\N	0.02	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.8	0	8	21.6	3
1688	2024-08-12	2026-03-28 08:30:20.186209	\N	backfill	\N	0.04	3.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.7	0	11.3	24.1	3
1689	2024-08-13	2026-03-28 08:30:20.629973	\N	backfill	\N	0.04	2.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	29.4	0	10.5	27.7	2
1690	2024-08-14	2026-03-28 08:30:21.075218	\N	backfill	\N	0.18	2.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	29.4	0	13.8	31.7	3
1691	2024-08-15	2026-03-28 08:30:21.52081	\N	backfill	\N	0.1	2.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.1	0	10.5	22	3
1692	2024-08-16	2026-03-28 08:30:21.966265	\N	backfill	\N	0.04	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.5	0	9.8	22	3
1693	2024-08-17	2026-03-28 08:30:22.411407	\N	backfill	\N	0.08	2.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.6	0	12.8	27	3
1694	2024-08-18	2026-03-28 08:30:22.860487	\N	backfill	\N	0.1	2.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.5	4	10.2	38.9	63
1695	2024-08-19	2026-03-28 08:30:23.306078	\N	backfill	\N	0.5	3.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.6	28.1	22.3	46.4	65
1696	2024-08-20	2026-03-28 08:30:23.751343	\N	backfill	\N	0.66	3.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.8	18.2	18.1	36.7	63
1697	2024-08-21	2026-03-28 08:30:24.196556	\N	backfill	\N	0.16	4.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.8	0	10.1	21.2	1
1698	2024-08-22	2026-03-28 08:30:24.641585	\N	backfill	\N	0.52	3.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.5	0	18.4	36.4	3
1699	2024-08-23	2026-03-28 08:30:25.086718	\N	backfill	\N	0.12	2.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.5	0	10.9	22.7	3
1700	2024-08-24	2026-03-28 08:30:25.532579	\N	backfill	\N	0.04	2.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.9	0	10.4	23.8	2
1701	2024-08-25	2026-03-28 08:30:25.977714	\N	backfill	\N	0.04	2.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.4	0	9.5	22.3	3
1702	2024-08-26	2026-03-28 08:30:26.423418	\N	backfill	\N	0.46	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.6	0	25.2	49	3
1703	2024-08-27	2026-03-28 08:30:26.877449	\N	backfill	\N	0.48	3.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.2	0	18.3	35.3	3
1704	2024-08-28	2026-03-28 08:30:27.322398	\N	backfill	\N	0.24	2.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.2	0	13.3	25.9	2
1705	2024-08-29	2026-03-28 08:30:27.767666	\N	backfill	\N	0.1	2.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.2	0	11.3	23.8	0
1706	2024-08-30	2026-03-28 08:30:28.212325	\N	backfill	\N	0.12	2.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.9	0	9.9	21.2	2
1707	2024-08-31	2026-03-28 08:30:28.656893	\N	backfill	\N	0.1	2.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.7	0	11.9	23	3
1708	2024-09-01	2026-03-28 08:30:29.101144	\N	backfill	\N	0.12	2.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.5	0	9.4	20.2	3
1709	2024-09-02	2026-03-28 08:30:29.545948	\N	backfill	\N	0.08	2.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26	1.7	33.5	65.2	55
1710	2024-09-03	2026-03-28 08:30:29.99071	\N	backfill	\N	0.2	2.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.9	0	9.4	21.6	3
1711	2024-09-04	2026-03-28 08:30:30.435727	\N	backfill	\N	0.14	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.6	0.7	9.6	22	51
1712	2024-09-05	2026-03-28 08:30:30.880773	\N	backfill	\N	0.94	4.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.6	35.3	27.2	54.7	65
1713	2024-09-06	2026-03-28 08:30:32.681673	\N	backfill	\N	0.4	5.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.2	0.7	8.8	26.6	51
1714	2024-09-07	2026-03-28 08:30:33.126917	\N	backfill	\N	0.16	4.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24	1.6	8.5	20.9	51
1715	2024-09-08	2026-03-28 08:30:33.572146	\N	backfill	\N	0.32	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.6	28.2	14.5	30.2	63
1716	2024-09-09	2026-03-28 08:30:34.017403	\N	backfill	\N	0.42	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.4	12	23.3	41.8	63
1717	2024-09-10	2026-03-28 08:30:34.4627	\N	backfill	\N	0.42	5.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.1	0.8	12.5	29.9	53
1718	2024-09-11	2026-03-28 08:30:34.907917	\N	backfill	\N	0.4	5.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.7	0	20	37.1	3
1719	2024-09-12	2026-03-28 08:30:35.353396	\N	backfill	\N	0.84	4.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.7	1.1	36.7	68.8	51
1720	2024-09-13	2026-03-28 08:30:35.79834	\N	backfill	\N	0.94	4.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.7	0.1	35.3	68	51
1721	2024-09-14	2026-03-28 08:30:36.243428	\N	backfill	\N	0.42	3.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.9	0	26.4	47.2	3
1722	2024-09-15	2026-03-28 08:30:36.687984	\N	backfill	\N	0.28	2.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.5	0	23.7	43.6	3
1723	2024-09-16	2026-03-28 08:30:37.133416	\N	backfill	\N	0.36	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.9	0.4	19.2	40	51
1724	2024-09-17	2026-03-28 08:30:37.578538	\N	backfill	\N	1.82	5.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18	3.4	37.4	68.8	53
1725	2024-09-18	2026-03-28 08:30:38.023828	\N	backfill	\N	1.68	6.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.3	3.8	30.9	55.4	61
1726	2024-09-19	2026-03-28 08:30:38.469043	\N	backfill	\N	0.86	4.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.3	9.3	30.9	59.8	61
1727	2024-09-20	2026-03-28 08:30:38.914111	\N	backfill	\N	0.84	4.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.9	0.3	31.4	55.4	51
1728	2024-09-21	2026-03-28 08:30:39.359509	\N	backfill	\N	0.46	3.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.3	0	15.1	31	1
1729	2024-09-22	2026-03-28 08:30:39.80478	\N	backfill	\N	0.12	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.8	0	10.1	20.2	3
1730	2024-09-23	2026-03-28 08:30:40.250784	\N	backfill	\N	0.58	4.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.2	7.9	22.4	41	63
1731	2024-09-24	2026-03-28 08:30:40.696076	\N	backfill	\N	0.56	4.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.5	0.8	19.3	36.7	51
1732	2024-09-25	2026-03-28 08:30:41.141163	\N	backfill	\N	0.28	5.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.2	0.1	16.1	28.1	51
1733	2024-09-26	2026-03-28 08:30:41.586393	\N	backfill	\N	0.5	3.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.2	0.3	25.4	43.6	51
1734	2024-09-27	2026-03-28 08:30:42.031559	\N	backfill	\N	0.72	4.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.4	1.1	26.7	53.3	55
1735	2024-09-28	2026-03-28 08:30:42.476956	\N	backfill	\N	0.6	5.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.8	1.1	30.8	57.2	53
1736	2024-09-29	2026-03-28 08:30:42.922749	\N	backfill	\N	0.54	3.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18	0	24.8	46.8	3
1737	2024-09-30	2026-03-28 08:30:43.368129	\N	backfill	\N	0.5	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.6	0	18.1	32	3
1738	2024-10-01	2026-03-28 08:30:43.813408	\N	backfill	\N	0.18	2.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.8	0.6	14.7	31.7	51
1739	2024-10-02	2026-03-28 08:30:44.311094	\N	backfill	\N	0.42	5.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.9	9.4	22.1	49.3	61
1740	2024-10-03	2026-03-28 08:30:44.756517	\N	backfill	\N	1.8	5.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.9	53.1	44	79.9	63
1741	2024-10-04	2026-03-28 08:30:45.203818	\N	backfill	\N	2.12	6.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.3	7.6	32.7	69.5	61
1742	2024-10-05	2026-03-28 08:30:45.649741	\N	backfill	\N	0.52	5.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.3	1.7	17.5	34.9	53
1743	2024-10-06	2026-03-28 08:30:46.094164	\N	backfill	\N	0.36	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.7	0	12.7	24.5	3
1744	2024-10-07	2026-03-28 08:30:46.53782	\N	backfill	\N	0.22	6.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.5	0	11	19.1	3
1745	2024-10-08	2026-03-28 08:30:46.982893	\N	backfill	\N	1.14	6.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.7	15.4	38	72	63
1746	2024-10-09	2026-03-28 08:30:47.428714	\N	backfill	\N	0.94	6.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.8	0	21.1	42.5	3
1747	2024-10-10	2026-03-28 08:30:47.873817	\N	backfill	\N	0.52	4.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.8	10.4	27.1	50.4	63
1748	2024-10-11	2026-03-28 08:30:48.31833	\N	backfill	\N	0.52	4.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.4	0	19.2	41	3
1749	2024-10-12	2026-03-28 08:30:48.763688	\N	backfill	\N	0.42	3.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.3	0.6	17.9	32	53
1750	2024-10-13	2026-03-28 08:30:49.208784	\N	backfill	\N	0.12	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17	0	14.2	30.2	3
1751	2024-10-14	2026-03-28 08:30:49.653984	\N	backfill	\N	0.08	2.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.7	0.6	13.2	22.7	51
1752	2024-10-15	2026-03-28 08:30:50.099184	\N	backfill	\N	0.04	2.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17	0	7	19.1	3
1753	2024-10-16	2026-03-28 08:30:50.54467	\N	backfill	\N	0.22	2.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.3	7.3	15.5	31.7	63
1754	2024-10-17	2026-03-28 08:30:50.988724	\N	backfill	\N	0.44	3.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.2	16.1	17.7	35.3	63
1755	2024-10-18	2026-03-28 08:30:51.433583	\N	backfill	\N	0.72	5.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.8	7.9	19.1	36.7	63
1756	2024-10-19	2026-03-28 08:30:51.878511	\N	backfill	\N	0.9	5.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18	16.1	26.1	47.9	63
1757	2024-10-20	2026-03-28 08:30:52.324393	\N	backfill	\N	0.88	5.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.3	0	23.9	41.8	3
1758	2024-10-21	2026-03-28 08:30:52.769691	\N	backfill	\N	0.36	6.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.1	0	8.5	19.8	3
1759	2024-10-22	2026-03-28 08:30:53.214808	\N	backfill	\N	0.18	6.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.7	0.1	9.9	22.7	51
1760	2024-10-23	2026-03-28 08:30:53.660774	\N	backfill	\N	0.12	4.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.1	24.4	11.2	22	63
1761	2024-10-24	2026-03-28 08:30:54.106262	\N	backfill	\N	0.4	3.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.9	2.8	14.1	28.4	53
1762	2024-10-25	2026-03-28 08:30:54.551436	\N	backfill	\N	0.22	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.2	5	16	28.1	61
1763	2024-10-26	2026-03-28 08:30:54.996475	\N	backfill	\N	0.3	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.4	0.7	14.9	30.6	51
1764	2024-10-27	2026-03-28 08:30:55.441515	\N	backfill	\N	0.22	3.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.6	0.9	12.9	27	53
1765	2024-10-28	2026-03-28 08:30:55.887347	\N	backfill	\N	0.14	4.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.1	0	7	14.8	3
1766	2024-10-29	2026-03-28 08:30:56.333303	\N	backfill	\N	0.1	4.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.1	0	9.4	23	3
1767	2024-10-30	2026-03-28 08:30:56.787078	\N	backfill	\N	0.06	2.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.8	0	11.5	19.8	3
1768	2024-10-31	2026-03-28 08:30:57.232218	\N	backfill	\N	0.14	2.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.4	0	9.8	21.2	3
1769	2024-11-01	2026-03-28 08:30:57.6774	\N	backfill	\N	0.04	3.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.9	0	9.6	19.8	3
1770	2024-11-02	2026-03-28 08:30:58.122475	\N	backfill	\N	0.08	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.3	0	9.3	21.2	3
1771	2024-11-03	2026-03-28 08:30:58.571297	\N	backfill	\N	0.48	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.8	0	15.8	33.1	3
1772	2024-11-04	2026-03-28 08:30:59.017062	\N	backfill	\N	0.5	3.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.8	0	10.1	18.4	3
1773	2024-11-05	2026-03-28 08:30:59.462314	\N	backfill	\N	0.34	3.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.6	0	10.7	25.2	3
1774	2024-11-06	2026-03-28 08:30:59.907716	\N	backfill	\N	0.2	2.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.1	0	13.9	26.3	3
1775	2024-11-07	2026-03-28 08:31:00.353031	\N	backfill	\N	0.14	2.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.3	0	12.3	20.9	3
1776	2024-11-08	2026-03-28 08:31:00.798177	\N	backfill	\N	0.14	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.9	0	11.1	24.5	3
1777	2024-11-09	2026-03-28 08:31:01.243663	\N	backfill	\N	0.22	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.8	0	11.5	24.1	3
1778	2024-11-10	2026-03-28 08:31:01.688913	\N	backfill	\N	0.7	4.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.7	0	18	36.4	3
1779	2024-11-11	2026-03-28 08:31:02.132825	\N	backfill	\N	0.72	4.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.5	0	17.3	29.9	3
1780	2024-11-12	2026-03-28 08:31:02.57878	\N	backfill	\N	0.7	4.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.1	0	18.2	36.7	3
1781	2024-11-13	2026-03-28 08:31:03.032213	\N	backfill	\N	0.68	4.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.5	0.2	20.5	38.5	51
1782	2024-11-14	2026-03-28 08:31:03.477624	\N	backfill	\N	1.04	5.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.2	1.7	26.4	46.8	53
1783	2024-11-15	2026-03-28 08:31:03.922985	\N	backfill	\N	0.74	4.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9	0	13.8	26.3	1
1784	2024-11-16	2026-03-28 08:31:04.36839	\N	backfill	\N	0.46	3.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.3	0	13.2	23.8	3
1785	2024-11-17	2026-03-28 08:31:04.812765	\N	backfill	\N	0.08	5.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.8	0	10.5	20.2	3
1786	2024-11-18	2026-03-28 08:31:05.258695	\N	backfill	\N	0.12	4.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.3	0	11.9	21.2	3
1787	2024-11-19	2026-03-28 08:31:05.704104	\N	backfill	\N	0.1	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.4	0	9.4	19.1	3
1788	2024-11-20	2026-03-28 08:31:06.149359	\N	backfill	\N	0.48	4.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.2	0.4	23.4	43.6	51
1789	2024-11-21	2026-03-28 08:31:06.595046	\N	backfill	\N	0.56	4.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8	3.2	26.8	51.1	61
1790	2024-11-22	2026-03-28 08:31:07.04043	\N	backfill	\N	0.58	7.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.6	7.4	26	49.7	63
1791	2024-11-23	2026-03-28 08:31:07.485693	\N	backfill	\N	0.4	7.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.4	0	18.9	32	3
1792	2024-11-24	2026-03-28 08:31:07.930768	\N	backfill	\N	0.06	8.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.3	0	6.3	14.4	3
1793	2024-11-25	2026-03-28 08:31:08.377244	\N	backfill	\N	0.04	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.3	0	7.6	15.8	3
1794	2024-11-26	2026-03-28 08:31:08.822493	\N	backfill	\N	0.1	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.4	1.9	10.1	20.9	53
1795	2024-11-27	2026-03-28 08:31:09.267811	\N	backfill	\N	0.14	4.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.7	6	10.2	22.3	61
1796	2024-11-28	2026-03-28 08:31:09.712854	\N	backfill	\N	0.14	4.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.6	0.1	13.7	27.4	51
1797	2024-11-29	2026-03-28 08:31:10.158144	\N	backfill	\N	0.38	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.1	0.2	23.7	40	51
1798	2024-11-30	2026-03-28 08:31:10.603334	\N	backfill	\N	0.92	4.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.4	0	30	53.3	0
1799	2024-12-01	2026-03-28 08:31:11.048014	\N	backfill	\N	0.88	4.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.3	0	21.4	36.4	1
1800	2024-12-02	2026-03-28 08:31:11.493075	\N	backfill	\N	0.74	3.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.3	0	23.5	43.9	3
1801	2024-12-03	2026-03-28 08:31:11.9443	\N	backfill	\N	0.38	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.6	5	14.9	25.2	61
1802	2024-12-04	2026-03-28 08:31:12.388887	\N	backfill	\N	0.84	4.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.6	2.9	28.4	47.9	53
1803	2024-12-05	2026-03-28 08:31:14.212295	\N	backfill	\N	1.42	5.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.3	0	33.7	58	3
1804	2024-12-06	2026-03-28 08:31:14.657388	\N	backfill	\N	0.5	6.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.7	0	12.4	24.1	3
1805	2024-12-07	2026-03-28 08:31:15.102442	\N	backfill	\N	0.54	6.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.8	0	17.6	31	3
1806	2024-12-08	2026-03-28 08:31:15.547605	\N	backfill	\N	1.8	6.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.4	67	49.3	85	63
1807	2024-12-09	2026-03-28 08:31:15.993046	\N	backfill	\N	1.7	6.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.3	0.1	37.5	67.3	51
1808	2024-12-10	2026-03-28 08:31:16.438441	\N	backfill	\N	1.14	5.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10	0.1	25.2	45.4	51
1809	2024-12-11	2026-03-28 08:31:16.884589	\N	backfill	\N	0.66	4.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.9	0	17.7	34.6	3
1810	2024-12-12	2026-03-28 08:31:17.332376	\N	backfill	\N	0.56	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.4	0.2	16.3	32.8	51
1811	2024-12-13	2026-03-28 08:31:17.778526	\N	backfill	\N	0.44	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.8	3.9	14.6	29.2	61
1812	2024-12-14	2026-03-28 08:31:18.223779	\N	backfill	\N	0.48	6.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6	2.3	18.6	31	53
1813	2024-12-15	2026-03-28 08:31:18.668952	\N	backfill	\N	0.22	6.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4	0	11.5	24.5	3
1814	2024-12-16	2026-03-28 08:31:19.114295	\N	backfill	\N	0.1	6.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.5	0	7.4	19.1	3
1815	2024-12-17	2026-03-28 08:31:19.559494	\N	backfill	\N	0.04	5.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.4	0	7.4	18.4	3
1816	2024-12-18	2026-03-28 08:31:20.005194	\N	backfill	\N	0.02	2.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.9	0	7.5	14.8	3
1817	2024-12-19	2026-03-28 08:31:20.450778	\N	backfill	\N	0.44	3.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8	0.8	27.9	45.7	51
1818	2024-12-20	2026-03-28 08:31:20.896001	\N	backfill	\N	1.66	6.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.2	2.5	55.2	98.3	53
1819	2024-12-21	2026-03-28 08:31:21.341549	\N	backfill	\N	0.4	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.7	0	14.8	24.8	3
1820	2024-12-22	2026-03-28 08:31:21.786627	\N	backfill	\N	0.72	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.8	0.9	29.9	51.5	51
1821	2024-12-23	2026-03-28 08:31:22.230856	\N	backfill	\N	0.92	5.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.3	4.9	31.6	60.8	61
1822	2024-12-24	2026-03-28 08:31:22.675311	\N	backfill	\N	0.38	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.2	0	23.9	40.7	3
1823	2024-12-25	2026-03-28 08:31:23.120819	\N	backfill	\N	0.76	4.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.2	0	26	45	3
1824	2024-12-26	2026-03-28 08:31:23.566836	\N	backfill	\N	0.88	4.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.1	0	32.6	57.6	2
1825	2024-12-27	2026-03-28 08:31:24.012307	\N	backfill	\N	0.66	3.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.2	0	18.5	32.8	2
1826	2024-12-28	2026-03-28 08:31:24.458789	\N	backfill	\N	0.16	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.6	0	13	22	3
1827	2024-12-29	2026-03-28 08:31:24.904502	\N	backfill	\N	0.08	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5	0	9.4	18	1
1828	2024-12-30	2026-03-28 08:31:25.350061	\N	backfill	\N	0.04	4.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.6	0	5.5	13.7	3
1829	2024-12-31	2026-03-28 08:31:25.796475	\N	backfill	\N	0.02	4.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.3	0	5.2	16.6	3
1830	2025-01-01	2026-03-28 08:31:26.241726	\N	backfill	\N	0.02	2.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.9	0	8.4	18	3
1831	2025-01-02	2026-03-28 08:31:26.685859	\N	backfill	\N	0.26	4.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.6	0.2	19.9	33.5	51
1832	2025-01-03	2026-03-28 08:31:27.131437	\N	backfill	\N	0.5	4.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.7	5	20.1	45.4	61
1833	2025-01-04	2026-03-28 08:31:27.58048	\N	backfill	\N	0.42	4.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5	0	14.6	29.9	3
1834	2025-01-05	2026-03-28 08:31:28.026038	\N	backfill	\N	0.12	4.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.4	0	8.2	15.8	3
1835	2025-01-06	2026-03-28 08:31:28.471274	\N	backfill	\N	0.42	4.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.9	1.3	15.9	25.2	51
1836	2025-01-07	2026-03-28 08:31:28.91636	\N	backfill	\N	0.52	5.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.5	4.4	22.4	37.1	55
1837	2025-01-08	2026-03-28 08:31:29.362313	\N	backfill	\N	0.3	6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.5	0	8.7	15.1	3
1838	2025-01-09	2026-03-28 08:31:29.807411	\N	backfill	\N	0.42	5.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.1	5.8	28.9	50	63
1839	2025-01-10	2026-03-28 08:31:30.252624	\N	backfill	\N	0.64	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.5	0	35.6	69.8	3
1840	2025-01-11	2026-03-28 08:31:30.697472	\N	backfill	\N	0.6	3.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.3	0.1	25	42.1	51
1841	2025-01-12	2026-03-28 08:31:31.142559	\N	backfill	\N	0.76	4.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7	0	29.8	53.3	0
1842	2025-01-13	2026-03-28 08:31:31.58762	\N	backfill	\N	1.52	5.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.8	0	41.6	78.5	1
1843	2025-01-14	2026-03-28 08:31:32.032572	\N	backfill	\N	1.32	5.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.4	0	31.5	55.4	0
1844	2025-01-15	2026-03-28 08:31:32.479187	\N	backfill	\N	0.6	4.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.3	5.9	18.1	32	75
1845	2025-01-16	2026-03-28 08:31:32.924846	\N	backfill	\N	1.06	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.8	0.2	36.5	63.7	51
1846	2025-01-17	2026-03-28 08:31:33.37037	\N	backfill	\N	0.64	4.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.4	0	21.6	36.7	3
1847	2025-01-18	2026-03-28 08:31:33.815601	\N	backfill	\N	0.66	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.8	0	20.1	37.8	3
1848	2025-01-19	2026-03-28 08:31:34.261311	\N	backfill	\N	0.48	4.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.2	0.9	15.4	25.2	51
1849	2025-01-20	2026-03-28 08:31:34.706931	\N	backfill	\N	0.32	5.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.1	3.7	16	26.6	61
1850	2025-01-21	2026-03-28 08:31:35.152963	\N	backfill	\N	0.22	5.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.6	3.5	10.9	24.5	61
1851	2025-01-22	2026-03-28 08:31:35.59908	\N	backfill	\N	0.06	6.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.9	1.7	8.4	15.5	51
1852	2025-01-23	2026-03-28 08:31:36.04384	\N	backfill	\N	0.3	4.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.6	3.9	11	22.3	61
1853	2025-01-24	2026-03-28 08:31:36.489794	\N	backfill	\N	0.28	5.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.9	0.1	13.3	22	51
1854	2025-01-25	2026-03-28 08:31:36.935248	\N	backfill	\N	0.18	6.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.8	0	6.9	13.3	3
1855	2025-01-26	2026-03-28 08:31:37.380372	\N	backfill	\N	0.5	5.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.3	3.2	27.1	51.1	61
1856	2025-01-27	2026-03-28 08:31:37.825103	\N	backfill	\N	0.72	5.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.5	3.6	24.6	43.9	63
1857	2025-01-28	2026-03-28 08:31:38.270819	\N	backfill	\N	1	4.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.8	9.8	37.5	68.4	63
1858	2025-01-29	2026-03-28 08:31:38.7175	\N	backfill	\N	0.48	6.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.3	0	21	35.3	3
1859	2025-01-30	2026-03-28 08:31:39.16418	\N	backfill	\N	0.2	5.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.7	0	10.4	20.5	3
1860	2025-01-31	2026-03-28 08:31:39.609486	\N	backfill	\N	0.16	6.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.7	13.2	16.5	27	61
1861	2025-02-01	2026-03-28 08:31:40.054934	\N	backfill	\N	0.48	3.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.5	9.9	21.2	36.7	63
1862	2025-02-02	2026-03-28 08:31:40.499985	\N	backfill	\N	0.4	3.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8	0	16.1	32.4	3
1863	2025-02-03	2026-03-28 08:31:40.944507	\N	backfill	\N	0.7	4.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.9	0	26.1	48.2	3
1864	2025-02-04	2026-03-28 08:31:41.389596	\N	backfill	\N	0.76	4.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.3	0	21.3	40.3	3
1865	2025-02-05	2026-03-28 08:31:41.834527	\N	backfill	\N	0.34	3.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.4	0	10.2	22	3
1866	2025-02-06	2026-03-28 08:31:42.280744	\N	backfill	\N	0.52	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.5	0	16.7	29.2	1
1867	2025-02-07	2026-03-28 08:31:42.72526	\N	backfill	\N	0.52	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.4	0	14.2	27.7	3
1868	2025-02-08	2026-03-28 08:31:43.169811	\N	backfill	\N	0.34	3.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.9	2.1	17	31.7	53
1869	2025-02-09	2026-03-28 08:31:43.615066	\N	backfill	\N	0.4	4.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.8	3.7	18.2	32	61
1870	2025-02-10	2026-03-28 08:31:44.060204	\N	backfill	\N	0.22	5.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.1	0	8.8	15.5	3
1871	2025-02-11	2026-03-28 08:31:44.504983	\N	backfill	\N	0.06	4.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.5	1.1	5.2	15.8	53
1872	2025-02-12	2026-03-28 08:31:44.950697	\N	backfill	\N	0.12	3.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.1	6.1	9.9	18	61
1873	2025-02-13	2026-03-28 08:31:45.396618	\N	backfill	\N	0.12	4.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.1	0.7	7.8	19.4	51
1874	2025-02-14	2026-03-28 08:31:45.841345	\N	backfill	\N	1.14	6.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.2	21.5	43.9	86.8	63
1875	2025-02-15	2026-03-28 08:31:46.286144	\N	backfill	\N	1.12	5.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.1	0	36	68.4	3
1876	2025-02-16	2026-03-28 08:31:46.731113	\N	backfill	\N	0.74	4.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.8	0	19.7	37.1	3
1877	2025-02-17	2026-03-28 08:31:47.176486	\N	backfill	\N	0.72	4.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.7	0.2	18.7	33.1	51
1878	2025-02-18	2026-03-28 08:31:47.621729	\N	backfill	\N	0.48	3.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.1	0	19.7	38.9	3
1879	2025-02-19	2026-03-28 08:31:48.067473	\N	backfill	\N	0.66	4.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.8	0	12.7	28.4	3
1880	2025-02-20	2026-03-28 08:31:48.51234	\N	backfill	\N	0.28	3.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.7	0	14.7	30.6	2
1881	2025-02-21	2026-03-28 08:31:48.958789	\N	backfill	\N	0.08	5.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.5	0	8.3	19.4	3
1882	2025-02-22	2026-03-28 08:31:49.403574	\N	backfill	\N	0.16	4.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.1	0	13.5	29.9	3
1883	2025-02-23	2026-03-28 08:31:49.848857	\N	backfill	\N	0.16	3.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.3	0.4	11.3	21.2	51
1884	2025-02-24	2026-03-28 08:31:50.294125	\N	backfill	\N	0.1	3.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8	0.2	8.2	19.8	51
1885	2025-02-25	2026-03-28 08:31:50.740212	\N	backfill	\N	0.08	3.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9	0.2	11.2	25.2	51
1886	2025-02-26	2026-03-28 08:31:51.185189	\N	backfill	\N	0.78	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.3	15.7	19.7	33.5	61
1887	2025-02-27	2026-03-28 08:31:51.630294	\N	backfill	\N	0.7	5.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.4	0.2	18.2	33.8	51
1888	2025-02-28	2026-03-28 08:31:52.076526	\N	backfill	\N	0.36	5.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.7	1	17.6	29.9	53
1889	2025-03-01	2026-03-28 08:31:52.522826	\N	backfill	\N	0.66	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.5	0.6	21	39.2	51
1890	2025-03-02	2026-03-28 08:31:52.967794	\N	backfill	\N	0.9	4.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.9	0	24.7	41.4	3
1891	2025-03-03	2026-03-28 08:31:53.412382	\N	backfill	\N	0.38	3.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.9	0	13.2	26.6	0
1892	2025-03-04	2026-03-28 08:31:53.85779	\N	backfill	\N	0.2	3.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.1	0	11.6	25.2	0
1893	2025-03-05	2026-03-28 08:31:55.686426	\N	backfill	\N	0.04	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.9	0	8.5	18	0
1894	2025-03-06	2026-03-28 08:31:56.131482	\N	backfill	\N	0.04	5.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.2	0	8.5	17.3	3
1895	2025-03-07	2026-03-28 08:31:56.576416	\N	backfill	\N	0.02	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.6	0	9.2	23	1
1896	2025-03-08	2026-03-28 08:31:57.021556	\N	backfill	\N	0.04	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.1	0	6.8	17.6	3
1897	2025-03-09	2026-03-28 08:31:57.466284	\N	backfill	\N	0.16	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.4	0.1	12.6	22.3	51
1898	2025-03-10	2026-03-28 08:31:57.911435	\N	backfill	\N	0.52	5.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.2	11	25.5	44.6	61
1899	2025-03-11	2026-03-28 08:31:58.357512	\N	backfill	\N	0.4	6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.5	1	20.4	34.6	51
1900	2025-03-12	2026-03-28 08:31:58.801951	\N	backfill	\N	0.38	5.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.6	25.4	21.2	41.8	63
1901	2025-03-13	2026-03-28 08:31:59.247777	\N	backfill	\N	0.48	5.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.8	6	24.4	47.5	55
1902	2025-03-14	2026-03-28 08:31:59.693026	\N	backfill	\N	0.56	6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.1	30.5	19.3	39.2	63
1903	2025-03-15	2026-03-28 08:32:00.138878	\N	backfill	\N	0.58	7.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.5	10.6	15.9	29.9	63
1904	2025-03-16	2026-03-28 08:32:00.583859	\N	backfill	\N	0.48	6.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.6	0.2	16.6	31	51
1905	2025-03-17	2026-03-28 08:32:01.028935	\N	backfill	\N	0.76	6.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.7	0.1	33.4	57.6	51
1906	2025-03-18	2026-03-28 08:32:01.473909	\N	backfill	\N	0.94	4.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.5	0	31.5	57.6	3
1907	2025-03-19	2026-03-28 08:32:01.919301	\N	backfill	\N	0.28	3.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.1	0	10.3	24.1	0
1908	2025-03-20	2026-03-28 08:32:02.364483	\N	backfill	\N	0.06	4.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.3	0	12.5	27.7	2
1909	2025-03-21	2026-03-28 08:32:02.809157	\N	backfill	\N	0.1	2.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10	0	9.3	21.6	3
1910	2025-03-22	2026-03-28 08:32:03.254501	\N	backfill	\N	0.6	5.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.6	9.8	22.5	38.9	63
1911	2025-03-23	2026-03-28 08:32:03.699446	\N	backfill	\N	0.72	5.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.4	1.5	25.3	42.8	53
1912	2025-03-24	2026-03-28 08:32:04.144531	\N	backfill	\N	0.56	6.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.3	12.1	12.9	28.4	65
1913	2025-03-25	2026-03-28 08:32:04.589785	\N	backfill	\N	0.34	9.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.7	3.2	12.6	21.2	61
1914	2025-03-26	2026-03-28 08:32:05.034487	\N	backfill	\N	0.48	8.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.6	0.1	27.6	46.8	51
1915	2025-03-27	2026-03-28 08:32:05.479321	\N	backfill	\N	0.8	4.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.3	1.6	28.7	49.3	51
1916	2025-03-28	2026-03-28 08:32:05.924466	\N	backfill	\N	0.58	4.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.6	3.9	19	33.1	55
1917	2025-03-29	2026-03-28 08:32:06.369313	\N	backfill	\N	0.6	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.8	1.1	26.9	49.3	51
1918	2025-03-30	2026-03-28 08:32:06.814274	\N	backfill	\N	0.58	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.7	0	16.3	31	3
1919	2025-03-31	2026-03-28 08:32:07.260747	\N	backfill	\N	0.34	3.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.8	7.4	24.9	42.8	63
1920	2025-04-01	2026-03-28 08:32:07.70571	\N	backfill	\N	0.86	4.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.9	0.3	34.3	60.5	51
1921	2025-04-02	2026-03-28 08:32:08.150627	\N	backfill	\N	0.88	4.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.8	0.1	31.3	54.7	51
1922	2025-04-03	2026-03-28 08:32:08.595902	\N	backfill	\N	0.22	3.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.1	0	10.8	24.8	0
1923	2025-04-04	2026-03-28 08:32:09.041591	\N	backfill	\N	0.04	3.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.2	0	7.9	19.1	3
1924	2025-04-05	2026-03-28 08:32:09.486701	\N	backfill	\N	0.1	2.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.1	0	14.4	24.5	3
1925	2025-04-06	2026-03-28 08:32:09.931986	\N	backfill	\N	1.24	5.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.5	0	28.8	53.3	3
1926	2025-04-07	2026-03-28 08:32:10.377388	\N	backfill	\N	1.06	5.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9	0	34.3	59	3
1927	2025-04-08	2026-03-28 08:32:10.822446	\N	backfill	\N	0.18	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.1	0	11.1	20.5	3
1928	2025-04-09	2026-03-28 08:32:11.267413	\N	backfill	\N	0.12	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.3	0	12.1	27	3
1929	2025-04-10	2026-03-28 08:32:11.712598	\N	backfill	\N	0.16	3.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.6	0	10.6	21.6	3
1930	2025-04-11	2026-03-28 08:32:12.157999	\N	backfill	\N	0.16	2.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.5	0	15.8	32	1
1931	2025-04-12	2026-03-28 08:32:12.602628	\N	backfill	\N	0.12	2.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.5	0	12.4	27.7	3
1932	2025-04-13	2026-03-28 08:32:13.047644	\N	backfill	\N	0.12	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.6	5.6	12.3	20.9	53
1933	2025-04-14	2026-03-28 08:32:13.492641	\N	backfill	\N	0.84	5.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.1	17.2	21.4	36.4	61
1934	2025-04-15	2026-03-28 08:32:13.937998	\N	backfill	\N	0.98	6.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.3	10.3	20	36	61
1935	2025-04-16	2026-03-28 08:32:14.383215	\N	backfill	\N	1.02	6.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.7	15.2	27.2	47.9	63
1936	2025-04-17	2026-03-28 08:32:14.828463	\N	backfill	\N	1.16	7.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.2	8.1	40.1	69.8	63
1937	2025-04-18	2026-03-28 08:32:15.273746	\N	backfill	\N	0.62	6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.2	1.5	20.1	37.8	51
1938	2025-04-19	2026-03-28 08:32:15.719018	\N	backfill	\N	0.28	4.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.6	0	14.2	29.5	3
1939	2025-04-20	2026-03-28 08:32:16.16349	\N	backfill	\N	0.2	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.9	0.3	13.9	29.2	51
1940	2025-04-21	2026-03-28 08:32:16.608805	\N	backfill	\N	0.16	2.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.6	0	12.5	27.4	3
1941	2025-04-22	2026-03-28 08:32:17.054014	\N	backfill	\N	0.04	2.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.7	0	10.1	24.1	3
1942	2025-04-23	2026-03-28 08:32:17.499446	\N	backfill	\N	0.32	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.3	1	16.9	32.4	53
1943	2025-04-24	2026-03-28 08:32:17.944824	\N	backfill	\N	0.24	2.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.9	0.9	20.6	36	51
1944	2025-04-25	2026-03-28 08:32:18.389942	\N	backfill	\N	0.66	3.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.2	24.2	29.8	51.8	63
1945	2025-04-26	2026-03-28 08:32:18.83568	\N	backfill	\N	0.5	3.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.1	0	20.3	34.6	3
1946	2025-04-27	2026-03-28 08:32:19.281045	\N	backfill	\N	0.58	3.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.8	0	18.9	34.6	3
1947	2025-04-28	2026-03-28 08:32:19.726664	\N	backfill	\N	0.3	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.1	0	9.9	20.9	0
1948	2025-04-29	2026-03-28 08:32:20.172646	\N	backfill	\N	0.12	2.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.4	0	14.2	29.9	2
1949	2025-04-30	2026-03-28 08:32:20.618398	\N	backfill	\N	0.2	3.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.2	0	11.8	23	0
1950	2025-05-01	2026-03-28 08:32:21.063633	\N	backfill	\N	0.04	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.4	0	9	21.6	2
1951	2025-05-02	2026-03-28 08:32:21.507861	\N	backfill	\N	0.06	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.8	0	14.2	26.6	3
1952	2025-05-03	2026-03-28 08:32:21.952975	\N	backfill	\N	0.26	2.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.2	0	19.8	33.8	3
1953	2025-05-04	2026-03-28 08:32:22.398394	\N	backfill	\N	0.22	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.3	0	16.9	33.8	3
1954	2025-05-05	2026-03-28 08:32:22.844326	\N	backfill	\N	0.66	4.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.8	5.7	28.5	52.9	63
1955	2025-05-06	2026-03-28 08:32:23.289844	\N	backfill	\N	0.52	4.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.3	21.8	24.9	43.2	63
1956	2025-05-07	2026-03-28 08:32:23.733845	\N	backfill	\N	0.48	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.5	33.9	20.1	39.6	65
1957	2025-05-08	2026-03-28 08:32:24.178388	\N	backfill	\N	0.42	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.5	7.4	14.2	30.2	63
1958	2025-05-09	2026-03-28 08:32:24.623888	\N	backfill	\N	0.2	2.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.1	4.1	13.7	29.5	61
1959	2025-05-10	2026-03-28 08:32:25.069652	\N	backfill	\N	0.28	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.1	0	12.8	22	1
1960	2025-05-11	2026-03-28 08:32:25.514782	\N	backfill	\N	0.1	2.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.2	0	11	22	3
1961	2025-05-12	2026-03-28 08:32:25.960486	\N	backfill	\N	0.12	3.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.5	0.3	12.4	29.2	51
1962	2025-05-13	2026-03-28 08:32:26.405854	\N	backfill	\N	0.42	3.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.1	0.1	12	24.8	51
1963	2025-05-14	2026-03-28 08:32:26.851226	\N	backfill	\N	0.12	2.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.1	0	11.2	21.2	3
1964	2025-05-15	2026-03-28 08:32:27.29692	\N	backfill	\N	0.5	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.8	4.3	30.3	51.1	61
1965	2025-05-16	2026-03-28 08:32:27.7416	\N	backfill	\N	0.78	4.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.9	1.1	28.7	54.7	53
1966	2025-05-17	2026-03-28 08:32:28.187226	\N	backfill	\N	0.26	3.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.2	4.6	22.2	39.2	63
1967	2025-05-18	2026-03-28 08:32:28.632576	\N	backfill	\N	0.42	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.2	0	16	32.8	0
1968	2025-05-19	2026-03-28 08:32:29.083771	\N	backfill	\N	0.32	3.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.5	0.1	16.6	31.3	51
1969	2025-05-20	2026-03-28 08:32:29.528811	\N	backfill	\N	0.46	4.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.4	3.1	16.9	35.6	53
1970	2025-05-21	2026-03-28 08:32:29.981497	\N	backfill	\N	0.4	4.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18	5.1	13.1	26.3	63
1971	2025-05-22	2026-03-28 08:32:30.426696	\N	backfill	\N	0.48	4.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.1	7.4	22	43.2	61
1972	2025-05-23	2026-03-28 08:32:30.872711	\N	backfill	\N	0.86	4.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15	4.1	40.6	76.3	55
1973	2025-05-24	2026-03-28 08:32:31.31776	\N	backfill	\N	0.38	4.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.3	0	17.5	32.4	1
1974	2025-05-25	2026-03-28 08:32:31.762747	\N	backfill	\N	0.18	4.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.1	0	16.5	32.4	3
1975	2025-05-26	2026-03-28 08:32:32.207471	\N	backfill	\N	0.2	2.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.7	1.1	14	29.5	55
1976	2025-05-27	2026-03-28 08:32:32.651866	\N	backfill	\N	0.32	2.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.7	1.5	21.3	39.6	53
1977	2025-05-28	2026-03-28 08:32:33.097527	\N	backfill	\N	0.12	2.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.2	8.5	14.5	28.4	63
1978	2025-05-29	2026-03-28 08:32:33.542702	\N	backfill	\N	0.22	2.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20	0.2	13.4	24.5	51
1979	2025-05-30	2026-03-28 08:32:33.988801	\N	backfill	\N	0.24	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.3	0	16.2	31.3	3
1980	2025-05-31	2026-03-28 08:32:34.433788	\N	backfill	\N	0.14	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.8	0	10.8	21.6	3
1981	2025-06-01	2026-03-28 08:32:34.878924	\N	backfill	\N	0.18	2.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22	0	16.4	31.7	3
1982	2025-06-02	2026-03-28 08:32:35.324245	\N	backfill	\N	0.34	3.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.3	0.4	20	37.1	51
1983	2025-06-03	2026-03-28 08:32:37.122908	\N	backfill	\N	0.38	3.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.9	0	20.6	38.2	3
1984	2025-06-04	2026-03-28 08:32:37.568646	\N	backfill	\N	0.4	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.7	0	18.7	36.7	3
1985	2025-06-05	2026-03-28 08:32:38.013775	\N	backfill	\N	0.36	3.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.4	0.5	13.3	29.9	53
1986	2025-06-06	2026-03-28 08:32:38.459718	\N	backfill	\N	0.2	3.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.4	0.8	18.5	36	51
1987	2025-06-07	2026-03-28 08:32:38.90586	\N	backfill	\N	0.26	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.4	0	19.8	38.5	1
1988	2025-06-08	2026-03-28 08:32:39.351268	\N	backfill	\N	0.26	3.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.7	0	20.4	36.7	1
1989	2025-06-09	2026-03-28 08:32:39.796462	\N	backfill	\N	0.94	4.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.3	0	22.9	41.8	0
1990	2025-06-10	2026-03-28 08:32:40.241164	\N	backfill	\N	0.44	3.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.6	0	15.3	29.9	3
1991	2025-06-11	2026-03-28 08:32:40.686655	\N	backfill	\N	0.08	3.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.5	0	7.7	20.9	3
1992	2025-06-12	2026-03-28 08:32:41.132116	\N	backfill	\N	0.2	3.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.2	0	8.7	21.6	0
1993	2025-06-13	2026-03-28 08:32:41.577946	\N	backfill	\N	0.18	2.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.6	0	12.6	26.6	3
1994	2025-06-14	2026-03-28 08:32:42.023328	\N	backfill	\N	0.1	2.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.5	0	11.7	25.6	3
1995	2025-06-15	2026-03-28 08:32:42.468567	\N	backfill	\N	0.12	2.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.2	0	14.1	28.4	3
1996	2025-06-16	2026-03-28 08:32:42.915586	\N	backfill	\N	0.64	3.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.5	28.7	30.2	55.1	65
1997	2025-06-17	2026-03-28 08:32:43.360812	\N	backfill	\N	0.78	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.9	10.4	31.7	60.5	63
1998	2025-06-18	2026-03-28 08:32:43.805902	\N	backfill	\N	0.48	3.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.6	0	17.7	33.5	0
1999	2025-06-19	2026-03-28 08:32:44.254728	\N	backfill	\N	0.08	2.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.1	0	8	16.9	0
2000	2025-06-20	2026-03-28 08:32:44.700855	\N	backfill	\N	0.2	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.9	0	13.9	29.5	3
2001	2025-06-21	2026-03-28 08:32:45.146276	\N	backfill	\N	0.52	3.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.5	0	18.9	33.8	3
2002	2025-06-22	2026-03-28 08:32:45.591325	\N	backfill	\N	0.16	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24	0	10.9	24.1	3
2003	2025-06-23	2026-03-28 08:32:46.037125	\N	backfill	\N	0.28	3.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.1	0	17.9	33.8	3
2004	2025-06-24	2026-03-28 08:32:46.482367	\N	backfill	\N	0.24	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.4	0.8	13.1	27.7	51
2005	2025-06-25	2026-03-28 08:32:46.927606	\N	backfill	\N	0.1	2.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.1	0	12.4	26.6	3
2006	2025-06-26	2026-03-28 08:32:47.373094	\N	backfill	\N	0.38	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.1	0	15.4	36.4	3
2007	2025-06-27	2026-03-28 08:32:47.818468	\N	backfill	\N	0.36	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.8	0	16.8	33.8	3
2008	2025-06-28	2026-03-28 08:32:48.264833	\N	backfill	\N	0.06	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.2	0	13.4	28.4	1
2009	2025-06-29	2026-03-28 08:32:48.711304	\N	backfill	\N	0.04	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28	0	8.7	20.5	0
2010	2025-06-30	2026-03-28 08:32:49.156282	\N	backfill	\N	0.04	2.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.3	0	7.6	20.2	3
2011	2025-07-01	2026-03-28 08:32:49.601553	\N	backfill	\N	0.14	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27	3.1	17.5	33.8	61
2012	2025-07-02	2026-03-28 08:32:50.048292	\N	backfill	\N	0.16	2.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28	0	9.7	22	0
2013	2025-07-03	2026-03-28 08:32:50.493742	\N	backfill	\N	0.04	2.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.1	0.5	10.2	25.2	53
2014	2025-07-04	2026-03-28 08:32:50.938934	\N	backfill	\N	0.12	3.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.7	0.1	9.2	19.4	51
2015	2025-07-05	2026-03-28 08:32:51.383251	\N	backfill	\N	0.5	3.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.5	0.2	17.9	30.2	51
2016	2025-07-06	2026-03-28 08:32:51.828608	\N	backfill	\N	0.3	2.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.7	2.1	30.4	53.6	53
2017	2025-07-07	2026-03-28 08:32:52.274164	\N	backfill	\N	0.32	3.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.9	2.8	29.4	52.9	55
2018	2025-07-08	2026-03-28 08:32:52.718182	\N	backfill	\N	0.52	3.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.5	12.3	23.1	46.8	63
2019	2025-07-09	2026-03-28 08:32:53.163826	\N	backfill	\N	0.48	3.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.2	0	21.8	36.7	3
2020	2025-07-10	2026-03-28 08:32:53.607871	\N	backfill	\N	0.04	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.6	0	14.8	30.2	1
2021	2025-07-11	2026-03-28 08:32:54.054658	\N	backfill	\N	0.7	4.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.3	0	18.9	38.2	3
2022	2025-07-12	2026-03-28 08:32:54.499793	\N	backfill	\N	0.54	3.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.1	0	14.2	30.6	2
2023	2025-07-13	2026-03-28 08:32:54.946236	\N	backfill	\N	0.28	2.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.5	2.7	25.2	48.2	61
2024	2025-07-14	2026-03-28 08:32:55.39145	\N	backfill	\N	0.14	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.4	0.2	12.6	29.2	51
2025	2025-07-15	2026-03-28 08:32:55.836578	\N	backfill	\N	0.08	4.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.5	0	12.8	25.2	3
2026	2025-07-16	2026-03-28 08:32:56.281675	\N	backfill	\N	0.58	3.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.6	0	26	49.7	3
2027	2025-07-17	2026-03-28 08:32:56.727307	\N	backfill	\N	0.66	3.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25	0	26.3	49.7	2
2028	2025-07-18	2026-03-28 08:32:57.172495	\N	backfill	\N	0.42	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.1	0	19.2	37.8	3
2029	2025-07-19	2026-03-28 08:32:57.617481	\N	backfill	\N	0.26	2.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.4	0	15.1	33.5	3
2030	2025-07-20	2026-03-28 08:32:58.062634	\N	backfill	\N	0.22	2.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.1	0	18.8	33.8	3
2031	2025-07-21	2026-03-28 08:32:58.507719	\N	backfill	\N	0.32	3.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.1	0.9	25.2	54.4	53
2032	2025-07-22	2026-03-28 08:32:58.952675	\N	backfill	\N	0.3	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.6	4.5	14.3	34.9	61
2033	2025-07-23	2026-03-28 08:32:59.398943	\N	backfill	\N	0.16	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.5	0	14.7	31	1
2034	2025-07-24	2026-03-28 08:32:59.843608	\N	backfill	\N	0.22	2.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.7	3.8	13.1	29.5	63
2035	2025-07-25	2026-03-28 08:33:00.289287	\N	backfill	\N	0.24	2.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.1	1.7	16.1	33.1	53
2036	2025-07-26	2026-03-28 08:33:00.734003	\N	backfill	\N	0.26	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.9	12.8	18.9	33.1	63
2037	2025-07-27	2026-03-28 08:33:01.179847	\N	backfill	\N	0.24	4.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.1	3.6	16.4	29.2	63
2038	2025-07-28	2026-03-28 08:33:01.625473	\N	backfill	\N	0.76	4.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20.9	24.9	35.8	61.6	63
2039	2025-07-29	2026-03-28 08:33:02.070793	\N	backfill	\N	0.62	4.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.9	0.5	16.5	29.2	51
2040	2025-07-30	2026-03-28 08:33:02.516502	\N	backfill	\N	0.42	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.1	0.1	24.6	41.8	51
2041	2025-07-31	2026-03-28 08:33:02.962447	\N	backfill	\N	0.06	2.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.2	0	10.5	23.8	1
2042	2025-08-01	2026-03-28 08:33:03.413718	\N	backfill	\N	0.28	2.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.4	1.6	19.7	40	61
2043	2025-08-02	2026-03-28 08:33:03.866878	\N	backfill	\N	0.3	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.5	16.9	15.5	35.6	63
2044	2025-08-03	2026-03-28 08:33:04.311846	\N	backfill	\N	0.38	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.3	3.5	27.7	51.5	61
2045	2025-08-04	2026-03-28 08:33:04.757098	\N	backfill	\N	0.46	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.5	0	21.6	36.7	3
2046	2025-08-05	2026-03-28 08:33:05.201982	\N	backfill	\N	0.08	2.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.7	0	15.6	30.2	3
2047	2025-08-06	2026-03-28 08:33:05.647428	\N	backfill	\N	0.48	4.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.4	0	21.7	42.1	3
2048	2025-08-07	2026-03-28 08:33:06.092511	\N	backfill	\N	0.38	3.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.2	0	9	23	3
2049	2025-08-08	2026-03-28 08:33:06.538331	\N	backfill	\N	0.08	2.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.9	0	10.2	24.5	0
2050	2025-08-09	2026-03-28 08:33:06.983418	\N	backfill	\N	0.02	2.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.1	0	8.1	20.9	0
2051	2025-08-10	2026-03-28 08:33:07.428562	\N	backfill	\N	0.02	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.7	0	8.5	21.6	0
2052	2025-08-11	2026-03-28 08:33:07.87624	\N	backfill	\N	0.46	3.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.4	0	18.2	32.4	0
2053	2025-08-12	2026-03-28 08:33:08.321605	\N	backfill	\N	0.36	3.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.4	0	14.6	29.9	3
2054	2025-08-13	2026-03-28 08:33:08.767381	\N	backfill	\N	0.14	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.3	0	12.5	27.7	3
2055	2025-08-14	2026-03-28 08:33:09.213947	\N	backfill	\N	0.12	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.4	0	16.2	32.4	3
2056	2025-08-15	2026-03-28 08:33:09.659348	\N	backfill	\N	0.46	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.7	0	19.6	37.4	3
2057	2025-08-16	2026-03-28 08:33:10.104575	\N	backfill	\N	0.4	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	28.4	0	18.7	32.4	3
2058	2025-08-17	2026-03-28 08:33:10.54985	\N	backfill	\N	0.6	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27.5	0.3	27.6	52.9	51
2059	2025-08-18	2026-03-28 08:33:10.996022	\N	backfill	\N	0.48	3.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26.2	0	19	38.9	2
2060	2025-08-19	2026-03-28 08:33:11.441256	\N	backfill	\N	0.26	3.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26	0	13.8	30.2	2
2061	2025-08-20	2026-03-28 08:33:11.886542	\N	backfill	\N	0.26	2.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.9	18	24.5	56.2	63
2062	2025-08-21	2026-03-28 08:33:12.33202	\N	backfill	\N	0.48	4.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.4	6.7	32.3	54	61
2063	2025-08-22	2026-03-28 08:33:12.77736	\N	backfill	\N	0.24	4.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.4	1.3	13.9	32	53
2064	2025-08-23	2026-03-28 08:33:13.222474	\N	backfill	\N	0.52	3.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.1	4.1	18.1	44.3	63
2065	2025-08-24	2026-03-28 08:33:13.6673	\N	backfill	\N	0.72	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.1	4.7	21.9	42.8	63
2066	2025-08-25	2026-03-28 08:33:14.112361	\N	backfill	\N	0.32	3.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.5	0.2	8.9	18.7	51
2067	2025-08-26	2026-03-28 08:33:14.558021	\N	backfill	\N	0.12	2.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.3	0.3	13.5	28.4	51
2068	2025-08-27	2026-03-28 08:33:15.008241	\N	backfill	\N	0.28	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	24.9	0.7	16.4	33.1	51
2069	2025-08-28	2026-03-28 08:33:15.453354	\N	backfill	\N	0.7	4.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25.5	1	26.7	50	53
2070	2025-08-29	2026-03-28 08:33:15.898466	\N	backfill	\N	0.64	5.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.3	8.3	20.6	44.6	63
2071	2025-08-30	2026-03-28 08:33:16.34451	\N	backfill	\N	0.38	6.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.5	1.5	11.9	26.3	53
2072	2025-08-31	2026-03-28 08:33:16.789756	\N	backfill	\N	0.18	6.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.3	0.3	15.9	31.7	51
2073	2025-09-01	2026-03-28 08:33:18.60108	\N	backfill	\N	0.3	3.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.9	0	19.7	33.8	3
2074	2025-09-02	2026-03-28 08:33:19.047969	\N	backfill	\N	0.44	4.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.6	3.8	19.6	37.4	61
2075	2025-09-03	2026-03-28 08:33:19.49485	\N	backfill	\N	0.28	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.4	0.9	10.8	26.3	51
2076	2025-09-04	2026-03-28 08:33:19.94134	\N	backfill	\N	0.06	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.3	0	8.9	22.7	3
2077	2025-09-05	2026-03-28 08:33:20.387968	\N	backfill	\N	0.08	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.2	0.2	12.7	27	51
2078	2025-09-06	2026-03-28 08:33:20.834882	\N	backfill	\N	0.52	3.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.1	0.9	19.5	38.5	53
2079	2025-09-07	2026-03-28 08:33:21.282148	\N	backfill	\N	0.36	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.1	0	14.4	28.4	3
2080	2025-09-08	2026-03-28 08:33:21.730129	\N	backfill	\N	0.06	2.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.4	0	10	24.1	3
2081	2025-09-09	2026-03-28 08:33:22.177079	\N	backfill	\N	0.14	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23	7.5	15.9	33.8	63
2082	2025-09-10	2026-03-28 08:33:22.624511	\N	backfill	\N	0.34	5.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.2	18.7	13.7	28.1	63
2083	2025-09-11	2026-03-28 08:33:23.072415	\N	backfill	\N	0.38	7.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.2	0.2	17.7	29.9	51
2084	2025-09-12	2026-03-28 08:33:23.519506	\N	backfill	\N	0.22	6.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.9	0.1	15.9	29.5	51
2085	2025-09-13	2026-03-28 08:33:23.966479	\N	backfill	\N	0.18	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.5	1.8	13.5	23.4	53
2086	2025-09-14	2026-03-28 08:33:24.414279	\N	backfill	\N	0.14	2.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.2	1	14.3	33.1	51
2087	2025-09-15	2026-03-28 08:33:24.861247	\N	backfill	\N	0.08	2.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.1	0.3	11.5	25.6	51
2088	2025-09-16	2026-03-28 08:33:25.307914	\N	backfill	\N	0.5	3.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.1	1.5	19.9	40.3	53
2089	2025-09-17	2026-03-28 08:33:25.754782	\N	backfill	\N	0.58	3.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.5	2.1	24.2	41.8	61
2090	2025-09-18	2026-03-28 08:33:26.201911	\N	backfill	\N	0.16	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.9	0	11.2	24.1	0
2091	2025-09-19	2026-03-28 08:33:26.647791	\N	backfill	\N	0.04	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22.1	0	10.5	23.8	0
2092	2025-09-20	2026-03-28 08:33:27.094966	\N	backfill	\N	0.04	5.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.7	0	10.3	24.5	3
2093	2025-09-21	2026-03-28 08:33:27.541987	\N	backfill	\N	0.26	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.2	0	15.3	31.7	3
2094	2025-09-22	2026-03-28 08:33:27.988995	\N	backfill	\N	0.36	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23.5	0.4	21	40.3	51
2095	2025-09-23	2026-03-28 08:33:28.436103	\N	backfill	\N	0.48	3.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21.5	25.2	18.1	39.6	65
2096	2025-09-24	2026-03-28 08:33:28.883805	\N	backfill	\N	0.52	4.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.2	11.5	19.5	37.4	63
2097	2025-09-25	2026-03-28 08:33:29.33122	\N	backfill	\N	0.42	5.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.2	1	10.4	22	51
2098	2025-09-26	2026-03-28 08:33:29.778155	\N	backfill	\N	0.1	5.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.3	1.4	14.3	33.5	51
2099	2025-09-27	2026-03-28 08:33:30.225056	\N	backfill	\N	0.18	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.9	9.5	14.3	29.5	63
2100	2025-09-28	2026-03-28 08:33:30.67219	\N	backfill	\N	0.52	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18.4	2.4	20.6	40	61
2101	2025-09-29	2026-03-28 08:33:31.119765	\N	backfill	\N	0.36	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19.4	0.3	15.3	25.2	51
2102	2025-09-30	2026-03-28 08:33:31.566429	\N	backfill	\N	0.68	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.9	8	20.7	39.6	63
2103	2025-10-01	2026-03-28 08:33:32.013207	\N	backfill	\N	1.12	5.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17	0.8	29.7	53.6	51
2104	2025-10-02	2026-03-28 08:33:32.460633	\N	backfill	\N	1.04	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.8	0	33.3	58.3	1
2105	2025-10-03	2026-03-28 08:33:32.907589	\N	backfill	\N	0.66	4.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15	0.3	17.5	32.4	51
2106	2025-10-04	2026-03-28 08:33:33.355115	\N	backfill	\N	0.26	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.9	0	17.8	30.2	3
2107	2025-10-05	2026-03-28 08:33:33.801453	\N	backfill	\N	1.7	6.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.2	16.9	56.3	101.9	63
2108	2025-10-06	2026-03-28 08:33:34.248496	\N	backfill	\N	0.38	5.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.6	0	8.8	22	3
2109	2025-10-07	2026-03-28 08:33:34.694965	\N	backfill	\N	0.04	6.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.9	0	6.7	15.1	3
2110	2025-10-08	2026-03-28 08:33:35.142129	\N	backfill	\N	0.1	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.3	0	11.3	24.5	3
2111	2025-10-09	2026-03-28 08:33:35.589233	\N	backfill	\N	0.06	2.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.9	0	10.1	20.2	3
2112	2025-10-10	2026-03-28 08:33:36.03586	\N	backfill	\N	0.04	2.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.8	0	9.4	20.9	3
2113	2025-10-11	2026-03-28 08:33:36.483418	\N	backfill	\N	0.04	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.9	0	8.6	19.1	3
2114	2025-10-12	2026-03-28 08:33:36.930435	\N	backfill	\N	0.08	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.7	0	9.3	23	3
2115	2025-10-13	2026-03-28 08:33:37.377547	\N	backfill	\N	0.18	2.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.9	0	12.2	26.6	3
2116	2025-10-14	2026-03-28 08:33:37.824684	\N	backfill	\N	0.12	2.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.3	0	10.7	24.8	3
2117	2025-10-15	2026-03-28 08:33:38.283457	\N	backfill	\N	0.28	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.4	0	16.7	33.5	1
2118	2025-10-16	2026-03-28 08:33:38.731029	\N	backfill	\N	0.38	3.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.4	0	13.2	27.4	0
2119	2025-10-17	2026-03-28 08:33:39.177975	\N	backfill	\N	0.4	4.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.9	0	14	29.5	3
2120	2025-10-18	2026-03-28 08:33:39.624979	\N	backfill	\N	0.42	5.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.4	0	16.3	33.1	2
2121	2025-10-19	2026-03-28 08:33:40.073406	\N	backfill	\N	0.26	5.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.6	0	7.6	18.4	3
2122	2025-10-20	2026-03-28 08:33:40.521265	\N	backfill	\N	0.18	3.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.4	0.8	7.4	13	51
2123	2025-10-21	2026-03-28 08:33:40.968142	\N	backfill	\N	0.46	4.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.4	19.9	20	43.9	63
2124	2025-10-22	2026-03-28 08:33:41.415101	\N	backfill	\N	0.34	5.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.5	1.4	10.2	19.8	51
2125	2025-10-23	2026-03-28 08:33:41.862524	\N	backfill	\N	0.48	5.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	17.1	12.5	38.5	70.2	63
2126	2025-10-24	2026-03-28 08:33:42.309645	\N	backfill	\N	0.46	5.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.4	0	20.2	46.4	3
2127	2025-10-25	2026-03-28 08:33:42.756803	\N	backfill	\N	0.22	5.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.8	0.9	16.1	34.6	53
2128	2025-10-26	2026-03-28 08:33:43.204538	\N	backfill	\N	0.5	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.4	0.4	15.2	36	51
2129	2025-10-27	2026-03-28 08:33:43.651947	\N	backfill	\N	0.52	4.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.9	0	16.7	28.4	3
2130	2025-10-28	2026-03-28 08:33:44.09888	\N	backfill	\N	0.12	4.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.1	0	10.5	18.4	3
2131	2025-10-29	2026-03-28 08:33:44.546152	\N	backfill	\N	0.42	3.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15	0	15.2	24.8	3
2132	2025-10-30	2026-03-28 08:33:44.993257	\N	backfill	\N	0.66	4.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.8	18.6	26.7	52.2	63
2133	2025-10-31	2026-03-28 08:33:45.440289	\N	backfill	\N	0.5	5.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.6	0.5	11.3	18.4	51
2134	2025-11-01	2026-03-28 08:33:45.88756	\N	backfill	\N	0.32	5.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15.8	0.4	12.7	24.5	51
2135	2025-11-02	2026-03-28 08:33:46.334686	\N	backfill	\N	0.34	4.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16.5	1.1	19.7	36	55
2136	2025-11-03	2026-03-28 08:33:46.782189	\N	backfill	\N	0.36	3.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14.6	0.4	22.3	37.8	51
2137	2025-11-04	2026-03-28 08:33:47.229323	\N	backfill	\N	0.28	3.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.2	0	11.7	25.6	0
2138	2025-11-05	2026-03-28 08:33:47.676415	\N	backfill	\N	0.1	4.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.7	0	11.1	23.8	3
2139	2025-11-06	2026-03-28 08:33:48.12384	\N	backfill	\N	0.1	3.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.7	0	8.7	19.8	3
2140	2025-11-07	2026-03-28 08:33:48.571327	\N	backfill	\N	0.28	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.2	0	8.7	17.6	3
2141	2025-11-08	2026-03-28 08:33:49.018516	\N	backfill	\N	0.58	3.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.1	0	19.4	36.4	1
2142	2025-11-09	2026-03-28 08:33:49.465677	\N	backfill	\N	0.24	4.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.6	0.3	9.6	20.2	51
2143	2025-11-10	2026-03-28 08:33:49.912849	\N	backfill	\N	0.22	5.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.4	0	14.5	28.1	0
2144	2025-11-11	2026-03-28 08:33:50.359972	\N	backfill	\N	0.14	8.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.9	0	10	19.8	3
2145	2025-11-12	2026-03-28 08:33:50.806591	\N	backfill	\N	0.04	6.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.4	0	5.1	15.5	3
2146	2025-11-13	2026-03-28 08:33:51.253928	\N	backfill	\N	0.02	5.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.5	0	5.9	16.2	3
2147	2025-11-14	2026-03-28 08:33:51.701441	\N	backfill	\N	0.02	3.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.6	0	6.4	14.8	3
2148	2025-11-15	2026-03-28 08:33:52.147422	\N	backfill	\N	0.26	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13	0.4	7.8	18.4	51
2149	2025-11-16	2026-03-28 08:33:52.594309	\N	backfill	\N	0.54	4.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.5	0.4	19.7	33.8	51
2150	2025-11-17	2026-03-28 08:33:53.041691	\N	backfill	\N	0.52	6.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14	12.5	18.9	34.9	63
2151	2025-11-18	2026-03-28 08:33:53.488927	\N	backfill	\N	1.48	5.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.7	4.9	39.4	79.9	61
2152	2025-11-19	2026-03-28 08:33:53.936273	\N	backfill	\N	0.68	4.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.5	0	16.6	28.4	3
2153	2025-11-20	2026-03-28 08:33:54.383428	\N	backfill	\N	0.3	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.7	3.4	15.4	26.3	61
2154	2025-11-21	2026-03-28 08:33:54.830483	\N	backfill	\N	1.1	5.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.3	7.4	34.3	60.8	61
2155	2025-11-22	2026-03-28 08:33:55.277348	\N	backfill	\N	1.54	5.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.3	1.8	43.3	76.3	51
2156	2025-11-23	2026-03-28 08:33:55.725172	\N	backfill	\N	0.94	5.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.7	0	24.7	47.2	3
2157	2025-11-24	2026-03-28 08:33:56.172119	\N	backfill	\N	1.04	7.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.5	4.5	12.6	22.3	61
2158	2025-11-25	2026-03-28 08:33:56.619181	\N	backfill	\N	0.54	6.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.5	5.3	13.3	29.5	61
2159	2025-11-26	2026-03-28 08:33:57.0661	\N	backfill	\N	0.86	6.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.6	18.3	33.5	56.5	63
2160	2025-11-27	2026-03-28 08:33:57.512801	\N	backfill	\N	1.4	5.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.9	0	38.6	68.8	3
2161	2025-11-28	2026-03-28 08:33:57.95925	\N	backfill	\N	1.02	5.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.5	0	32.3	55.1	2
2162	2025-11-29	2026-03-28 08:33:58.405749	\N	backfill	\N	0.5	3.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6	0	15.6	29.2	3
2163	2025-11-30	2026-03-28 08:34:00.21498	\N	backfill	\N	0.2	6.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.7	0	9.9	18.7	3
2164	2025-12-01	2026-03-28 08:34:00.661438	\N	backfill	\N	0.36	6.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.8	0.1	19.5	34.9	51
2165	2025-12-02	2026-03-28 08:34:01.108069	\N	backfill	\N	0.26	3.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.5	1.3	10.6	22.7	51
2166	2025-12-03	2026-03-28 08:34:01.562668	\N	backfill	\N	0.28	4.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.1	1.9	15.1	28.4	53
2167	2025-12-04	2026-03-28 08:34:02.010196	\N	backfill	\N	0.44	4.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.6	0.8	15.9	29.5	51
2168	2025-12-05	2026-03-28 08:34:02.45742	\N	backfill	\N	0.5	4.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.4	0.4	16.5	28.8	51
2169	2025-12-06	2026-03-28 08:34:02.905571	\N	backfill	\N	0.32	3.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.9	0	13	24.1	3
2170	2025-12-07	2026-03-28 08:34:03.353141	\N	backfill	\N	0.24	2.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.8	0	15.4	29.2	3
2171	2025-12-08	2026-03-28 08:34:03.799892	\N	backfill	\N	0.08	2.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.1	0	10.5	17.6	3
2172	2025-12-09	2026-03-28 08:34:04.24692	\N	backfill	\N	0.02	3.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.7	0	7.6	16.6	3
2173	2025-12-10	2026-03-28 08:34:04.693913	\N	backfill	\N	0.02	3.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.4	0	8.8	20.2	3
2174	2025-12-11	2026-03-28 08:34:05.141147	\N	backfill	\N	0.04	1.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.9	0	9	20.5	3
2175	2025-12-12	2026-03-28 08:34:05.588076	\N	backfill	\N	0.16	2.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.5	0	11.3	20.5	3
2176	2025-12-13	2026-03-28 08:34:06.035655	\N	backfill	\N	0.18	2.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.2	0	10.4	20.5	3
2177	2025-12-14	2026-03-28 08:34:06.482582	\N	backfill	\N	0.04	2.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.3	0	6.8	15.5	3
2178	2025-12-15	2026-03-28 08:34:06.929657	\N	backfill	\N	0.04	2.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.2	0	8.2	15.5	3
2179	2025-12-16	2026-03-28 08:34:07.376657	\N	backfill	\N	0.66	4.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.5	1.2	19.6	37.1	51
2180	2025-12-17	2026-03-28 08:34:07.824275	\N	backfill	\N	0.56	5.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.6	5.2	15.4	31.7	53
2181	2025-12-18	2026-03-28 08:34:08.271414	\N	backfill	\N	0.26	5.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.6	0	8.9	19.1	3
2182	2025-12-19	2026-03-28 08:34:08.718404	\N	backfill	\N	0.16	5.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.5	3	7.3	14.8	53
2183	2025-12-20	2026-03-28 08:34:09.165318	\N	backfill	\N	0.18	3.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.1	0	12.7	22.7	3
2184	2025-12-21	2026-03-28 08:34:09.613954	\N	backfill	\N	0.2	2.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.6	0	16.3	27.4	3
2185	2025-12-22	2026-03-28 08:34:10.06169	\N	backfill	\N	0.42	3.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.7	0	16.6	29.5	3
2186	2025-12-23	2026-03-28 08:34:10.509033	\N	backfill	\N	0.7	3.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.3	5.6	22.9	38.9	61
2187	2025-12-24	2026-03-28 08:34:10.955452	\N	backfill	\N	1.8	6.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.1	16.5	43.8	76	63
2188	2025-12-25	2026-03-28 08:34:11.404282	\N	backfill	\N	1.66	6.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.6	20.5	37.5	65.9	71
2189	2025-12-26	2026-03-28 08:34:11.851329	\N	backfill	\N	1.12	5.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.9	0	28.8	49	3
2190	2025-12-27	2026-03-28 08:34:12.299312	\N	backfill	\N	0.56	3.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.8	0	14.6	25.6	1
2191	2025-12-28	2026-03-28 08:34:12.746446	\N	backfill	\N	0.2	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.6	0	13.3	22.7	3
2192	2025-12-29	2026-03-28 08:34:13.194024	\N	backfill	\N	0.24	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.8	0	10.9	22	3
2193	2025-12-30	2026-03-28 08:34:13.641136	\N	backfill	\N	1.04	5.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.7	0	24.7	42.1	3
2194	2025-12-31	2026-03-28 08:34:14.088151	\N	backfill	\N	0.86	5.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.4	0	18.9	33.1	2
2195	2026-01-01	2026-03-28 08:34:14.535637	\N	backfill	\N	0.16	4.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2.1	0	8.5	15.1	3
2196	2026-01-02	2026-03-28 08:34:14.982866	\N	backfill	\N	0.26	5.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.1	0	9.8	19.8	3
2197	2026-01-03	2026-03-28 08:34:15.429762	\N	backfill	\N	0.26	5.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4	0.2	12	23.8	51
2198	2026-01-04	2026-03-28 08:34:15.876798	\N	backfill	\N	0.9	5.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6	0.6	29.1	52.6	51
2199	2026-01-05	2026-03-28 08:34:16.324349	\N	backfill	\N	0.88	4.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.5	0.9	23.5	40.3	51
2200	2026-01-06	2026-03-28 08:34:16.77041	\N	backfill	\N	1.7	5.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.5	10.3	39.1	68	73
2201	2026-01-07	2026-03-28 08:34:17.217443	\N	backfill	\N	1.52	5.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.2	0	36.5	65.5	3
2202	2026-01-08	2026-03-28 08:34:17.664604	\N	backfill	\N	0.46	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.1	0	13.2	22.7	3
2203	2026-01-09	2026-03-28 08:34:18.112994	\N	backfill	\N	0.42	5.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3	0.8	13.6	27	53
2204	2026-01-10	2026-03-28 08:34:18.560105	\N	backfill	\N	0.42	6.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2.8	0	17.2	32.8	3
2205	2026-01-11	2026-03-28 08:34:19.00736	\N	backfill	\N	0.3	7.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.1	0	17.5	32.8	3
2206	2026-01-12	2026-03-28 08:34:19.454713	\N	backfill	\N	0.22	3.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1.5	0	7.9	19.1	3
2207	2026-01-13	2026-03-28 08:34:19.902462	\N	backfill	\N	0.08	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.5	0	6.6	13	3
2208	2026-01-14	2026-03-28 08:34:20.349287	\N	backfill	\N	0.08	4.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.5	0	6.1	14.8	3
2209	2026-01-15	2026-03-28 08:34:20.796226	\N	backfill	\N	0.1	4.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.1	2.4	12.4	24.1	51
2210	2026-01-16	2026-03-28 08:34:21.242971	\N	backfill	\N	0.1	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.3	0.2	8.8	17.3	51
2211	2026-01-17	2026-03-28 08:34:21.690025	\N	backfill	\N	0.34	4.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.6	0.2	16.2	29.5	51
2212	2026-01-18	2026-03-28 08:34:22.13726	\N	backfill	\N	0.66	4.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.3	1.5	18.5	30.6	51
2213	2026-01-19	2026-03-28 08:34:22.592526	\N	backfill	\N	0.82	4.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.9	0	22.1	41	3
2214	2026-01-20	2026-03-28 08:34:23.039461	\N	backfill	\N	0.7	4.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.7	0	19.2	36.4	3
2215	2026-01-21	2026-03-28 08:34:23.486907	\N	backfill	\N	0.58	4.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.9	0	18.6	34.6	3
2216	2026-01-22	2026-03-28 08:34:23.935016	\N	backfill	\N	0.32	7.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.2	0	9.8	17.3	3
2217	2026-01-23	2026-03-28 08:34:24.382148	\N	backfill	\N	0.22	7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.9	3.7	16.7	28.1	53
2218	2026-01-24	2026-03-28 08:34:24.829531	\N	backfill	\N	0.52	4.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.6	9.6	18.3	34.2	63
2219	2026-01-25	2026-03-28 08:34:25.275466	\N	backfill	\N	0.42	5.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.8	17.1	19.9	33.1	61
2220	2026-01-26	2026-03-28 08:34:25.721541	\N	backfill	\N	0.34	7.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.9	0.8	13.4	28.1	53
2221	2026-01-27	2026-03-28 08:34:26.167444	\N	backfill	\N	0.2	6.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.5	0.4	14.8	24.1	51
2222	2026-01-28	2026-03-28 08:34:26.615167	\N	backfill	\N	1.52	6.65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.3	18.8	40.2	68	63
2223	2026-01-29	2026-03-28 08:34:27.062546	\N	backfill	\N	0.52	6.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.4	0	12.3	20.5	3
2224	2026-01-30	2026-03-28 08:34:27.510042	\N	backfill	\N	0.16	6.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.2	0	7	17.3	3
2225	2026-01-31	2026-03-28 08:34:27.957101	\N	backfill	\N	0.14	5.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.4	0.1	14.7	29.2	51
2226	2026-02-01	2026-03-28 08:34:28.404281	\N	backfill	\N	0.56	3.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.8	0	18.3	35.6	1
2227	2026-02-02	2026-03-28 08:34:28.85147	\N	backfill	\N	0.5	3.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.7	1.4	19	32	53
2228	2026-02-03	2026-03-28 08:34:29.298813	\N	backfill	\N	0.64	5.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.7	5.3	28.5	50.8	55
2229	2026-02-04	2026-03-28 08:34:29.745993	\N	backfill	\N	1	5.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.8	11.7	32.8	54	61
2230	2026-02-05	2026-03-28 08:34:30.19483	\N	backfill	\N	1.02	8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9	5.4	30.1	56.5	61
2231	2026-02-06	2026-03-28 08:34:30.641938	\N	backfill	\N	0.52	6.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.7	3.3	21.1	39.2	51
2232	2026-02-07	2026-03-28 08:34:31.089216	\N	backfill	\N	0.38	7.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.7	2	12.2	25.6	53
2233	2026-02-08	2026-03-28 08:34:31.537125	\N	backfill	\N	0.1	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8	0.1	10.2	20.2	51
2234	2026-02-09	2026-03-28 08:34:31.98303	\N	backfill	\N	0.16	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.6	4.6	14.6	24.8	53
2235	2026-02-10	2026-03-28 08:34:32.428154	\N	backfill	\N	0.12	4.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.2	0.7	14.2	23.4	51
2236	2026-02-11	2026-03-28 08:34:32.87347	\N	backfill	\N	0.32	4.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.7	5.2	21.8	41.8	53
2237	2026-02-12	2026-03-28 08:34:33.31984	\N	backfill	\N	0.38	5.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.3	4.1	14.4	27.4	55
2238	2026-02-13	2026-03-28 08:34:33.765397	\N	backfill	\N	0.28	5.75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.7	0	10.1	22	3
2239	2026-02-14	2026-03-28 08:34:34.214424	\N	backfill	\N	0.58	4.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.2	2.2	22.2	37.8	53
2240	2026-02-15	2026-03-28 08:34:34.659878	\N	backfill	\N	0.64	6.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.1	2.5	28.7	51.1	53
2241	2026-02-16	2026-03-28 08:34:35.105172	\N	backfill	\N	0.52	3.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.7	0	17.6	32	3
2242	2026-02-17	2026-03-28 08:34:35.567983	\N	backfill	\N	0.38	5.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.7	0	19	38.9	3
2243	2026-02-18	2026-03-28 08:34:36.013394	\N	backfill	\N	0.18	2.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.8	0	14.8	27.7	3
2244	2026-02-19	2026-03-28 08:34:36.459036	\N	backfill	\N	0.94	6.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.6	5.1	38	66.6	61
2245	2026-02-20	2026-03-28 08:34:36.905029	\N	backfill	\N	0.7	6.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.5	0.8	25	43.9	51
2246	2026-02-21	2026-03-28 08:34:37.351044	\N	backfill	\N	0.68	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.8	0	16.1	27.4	3
2247	2026-02-22	2026-03-28 08:34:37.796074	\N	backfill	\N	0.08	5.85	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	6.9	0	8.2	21.2	3
2248	2026-02-23	2026-03-28 08:34:38.242012	\N	backfill	\N	0.02	4.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8	0	10.1	21.2	3
2249	2026-02-24	2026-03-28 08:34:38.686345	\N	backfill	\N	0.12	3.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.9	0	15.6	29.9	3
2250	2026-02-25	2026-03-28 08:34:39.131136	\N	backfill	\N	0.08	2.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.1	0	9.9	18	3
2251	2026-02-26	2026-03-28 08:34:39.576357	\N	backfill	\N	0.02	2.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.1	0	7.3	19.1	3
2252	2026-02-27	2026-03-28 08:34:40.020446	\N	backfill	\N	0.02	3.45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.8	0	8.7	18.4	3
2253	2026-02-28	2026-03-28 08:34:41.818367	\N	backfill	\N	0.02	2.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7.7	0	8	20.5	3
2254	2026-03-01	2026-03-28 08:34:42.263036	\N	backfill	\N	0.06	2.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.2	0.4	9.6	19.1	51
2255	2026-03-02	2026-03-28 08:34:42.708194	\N	backfill	\N	0.08	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10	0.7	9.8	25.6	53
2256	2026-03-03	2026-03-28 08:34:43.153199	\N	backfill	\N	0.04	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.7	0.1	7.3	16.2	51
2257	2026-03-04	2026-03-28 08:34:43.597885	\N	backfill	\N	0.04	3.15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.1	0	9.3	20.2	3
2258	2026-03-05	2026-03-28 08:34:44.042744	\N	backfill	\N	0.02	3.55	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.4	0	10	23.4	3
2259	2026-03-06	2026-03-28 08:34:44.487417	\N	backfill	\N	0.02	2.9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.2	0	6.2	19.1	3
2260	2026-03-07	2026-03-28 08:34:44.932641	\N	backfill	\N	0.02	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8.5	0	9.5	20.2	3
2261	2026-03-08	2026-03-28 08:34:45.377936	\N	backfill	\N	0.02	2.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.4	0	7.2	17.6	3
2262	2026-03-09	2026-03-28 08:34:45.823175	\N	backfill	\N	0.06	2.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.7	0	10.2	19.1	3
2263	2026-03-10	2026-03-28 08:34:46.269152	\N	backfill	\N	0.14	2.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.1	0.4	14.3	30.6	51
2264	2026-03-11	2026-03-28 08:34:46.714339	\N	backfill	\N	0.1	3.05	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.6	5.1	11.1	27.7	61
2265	2026-03-12	2026-03-28 08:34:47.159643	\N	backfill	\N	0.16	3.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.9	0.1	13	24.1	51
2266	2026-03-13	2026-03-28 08:34:47.60516	\N	backfill	\N	0.14	3.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.9	0.4	10.1	22.3	51
2267	2026-03-14	2026-03-28 08:34:48.050465	\N	backfill	\N	0.68	3.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.3	2.4	27.8	49	61
2268	2026-03-15	2026-03-28 08:34:48.495714	\N	backfill	\N	0.72	5.25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13	1.1	27.3	49.7	51
2269	2026-03-16	2026-03-28 08:34:48.941025	\N	backfill	\N	0.48	5.4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.3	0.8	27.5	47.2	53
2270	2026-03-17	2026-03-28 08:34:49.386494	\N	backfill	\N	0.64	3.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.1	1	29.7	54	51
2271	2026-03-18	2026-03-28 08:34:49.832506	\N	backfill	\N	1.32	5.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.6	2.5	44.5	81	61
2272	2026-03-19	2026-03-28 08:34:50.277391	\N	backfill	\N	1.2	4.7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.6	0	33.2	60.5	3
2273	2026-03-20	2026-03-28 08:34:50.721509	\N	backfill	\N	0.7	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.4	0	24.7	42.8	1
2274	2026-03-21	2026-03-28 08:34:51.166321	\N	backfill	\N	0.12	4.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	10.6	0	13.6	25.9	3
2275	2026-03-22	2026-03-28 08:34:51.612013	\N	backfill	\N	0.54	3.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.5	0.1	23.5	41.8	51
2276	2026-03-23	2026-03-28 08:34:52.05708	\N	backfill	\N	0.22	2.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.5	0	16.6	34.2	3
2277	2026-03-24	2026-03-28 08:34:52.502272	\N	backfill	\N	0.34	2.95	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.7	0	14.8	30.6	3
2278	2026-03-25	2026-03-28 08:34:52.947027	\N	backfill	\N	0.48	2.35	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.5	1.2	26.2	45	55
2279	2026-03-26	2026-03-28 08:34:53.391835	\N	backfill	\N	1.86	6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	9.1	44.1	64.4	115.6	65
2287	2026-04-07	2026-04-07 23:42:43.706	\N	scheduler	13.6	0.04	1.7	2.28	33.75	16.18	8.35	19.26	130.14	\N	19.6	2026-04-07T07:00:00	\N	\N	\N	\N	\N	\N	2026-04-07T06:00:00	12.4	0	4.3	9.4	0
2282	2026-04-01	2026-04-01 20:33:44.302	\N	scheduler	11.9	1.04	4.8	2.74	32.8	11.62	8.2	18.48	98.68	\N	9.24	2026-04-01T16:00:00	11.95	8.1	21.96	90	\N	\N	2026-04-01T20:00:00	12	0	27.3	55.1	3
2283	2026-04-02	2026-04-02 21:16:59.98	\N	scheduler	12	0.56	4	2.71	33.09	11.7	8.22	17.35	100.24	\N	6.73	2026-04-02T18:00:00	\N	\N	\N	\N	\N	\N	2026-04-02T21:00:00	12	0	11.2	18.7	3
2286	2026-04-06	2026-04-06 23:45:20.728	\N	scheduler	11.76	0.04	2.4	2.21	33.57	14.87	8.24	20.23	116.94	\N	7.96	2026-04-06T10:00:00	\N	\N	\N	\N	\N	\N	2026-04-06T09:00:00	11	0	4.2	9	0
2297	2026-04-17	2026-04-17 21:15:42.38	10	scheduler	14.71	0.22	4.95	7.5	33.21	18.44	8.18	19.33	105.42	\N	3.68	2026-04-17T13:00:00	19.08	8.4	23.56	131	\N	\N	2026-04-17T17:00:00	14.3	0	4.8	7.9	0
2292	2026-04-12	2026-04-12 02:33:04.086	\N	scheduler	13.76	0.3	3.2	3.98	34.21	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12.4	0	6.6	10.4	45
2288	2026-04-08	2026-04-08 22:40:44.178	\N	scheduler	12.75	0.26	3.15	3.11	34.15	17.28	8.34	20.34	129.38	\N	17.59	2026-04-08T07:00:00	18.78	8.2	20.49	0	\N	\N	2026-04-08T17:00:00	12.1	0	6.6	10.8	1
2284	2026-04-03	2026-04-03 22:59:07.588	10	scheduler	11.17	0.46	3.6	2.72	33.32	14.72	8.15	16.09	104.85	\N	4.79	2026-04-03T18:00:00	12.19	8.1	26.88	92.5	\N	\N	2026-04-03T17:00:00	9.7	0	6.8	12.6	0
2305	2026-04-25	2026-04-25 23:51:46.57	8	scheduler	15.95	0.16	2.05	5.52	34.65	20.14	8.26	25.98	115.79	\N	3.44	2026-04-25T18:00:00	20.86	7.5	24.55	86.9	\N	\N	2026-04-25T19:00:00	12.8	0	5.5	15.5	0
2298	2026-04-18	2026-04-18 22:36:37.901	\N	scheduler	15.02	0.12	3.1	7.13	32.72	20.94	8.19	19.97	114.88	\N	5.98	2026-04-18T18:00:00	\N	\N	\N	\N	\N	\N	2026-04-18T21:00:00	13.6	0	6.5	11.5	3
2290	2026-04-10	2026-04-10 22:21:55.956	\N	scheduler	13.51	0.22	3.5	3.79	34.3	17.73	8.34	23.74	128.79	\N	8.91	2026-04-10T18:00:00	18.38	7.2	20.73	74.5	\N	\N	2026-04-10T21:00:00	11.8	0	5.1	9.4	3
2281	2026-03-31	2026-03-31 23:56:47.164	\N	scheduler	11.8	0.92	4.65	2.83	32.71	13.28	8.31	18.54	118.7	\N	9.62	2026-03-31T18:00:00	12.6	8.3	23.42	110.3	\N	\N	2026-03-31T23:00:00	10.7	0	25.6	53.6	3
2280	2026-03-30	2026-03-30 18:00:07.423	2	scheduler	12.1	0.2	2.5	2.91	33.15	13.22	8.3	16.27	116.95	\N	13.59	2026-03-30T18:00:00	13.65	8.2	23.15	112.3	\N	\N	2026-03-30T17:00:00	11.4	0	9.5	23.8	3
2299	2026-04-19	2026-04-19 12:02:20.386	\N	scheduler	15.24	0.14	2.65	7.27	32.5	19.22	8.24	20.56	109.36	\N	6.15	2026-04-19T07:00:00	19.88	8.1	21.9	84.3	\N	\N	2026-04-19T06:00:00	21.6	0	9.8	16.9	3
2285	2026-04-05	2026-04-05 14:23:56.887	\N	scheduler	11.47	0.06	3.45	1.95	33.43	14.12	8.24	16.2	113.48	\N	13.93	2026-04-05T07:00:00	14.6	8.1	25.09	0	\N	\N	2026-04-05T07:00:00	20.2	0	12.8	22.7	0
2309	2026-04-28	2026-04-28 21:44:23.775	10	scheduler	16.28	0.1	2.7	5.06	35.44	20.86	8.3	42.54	110.22	\N	7.86	2026-04-28T07:00:00	\N	\N	\N	\N	\N	\N	2026-04-28T21:00:00	15.6	0	8.1	13.7	2
2301	2026-04-21	2026-04-21 23:09:27.124	2	scheduler	15.56	0.54	3.55	6.94	33.26	18.17	8.23	20.15	98.92	\N	8.2	2026-04-21T10:00:00	19.24	8.3	18.22	105.4	\N	\N	2026-04-21T18:00:00	14.2	0	18	39.2	3
2296	2026-04-16	2026-04-16 18:56:20.585	10	scheduler	15.6	0.14	4.45	6.91	33.98	17.96	8.2	20.04	105.99	\N	3.21	2026-04-16T16:00:00	\N	\N	\N	\N	\N	\N	2026-04-16T15:00:00	16.2	0	4.4	9	0
2289	2026-04-09	2026-04-09 22:45:03.862	10	scheduler	14.2	0.26	3.6	3.38	34.17	17.32	8.28	21.11	117.61	\N	5.45	2026-04-09T16:00:00	18.7	7.3	21.36	98.9	\N	\N	2026-04-09T17:00:00	10.4	0	5.1	7.2	0
2291	2026-04-11	2026-04-11 23:56:12.435	\N	scheduler	14.6	0.12	2.7	3.98	34.21	16.66	8.33	22.45	109.46	\N	10.91	2026-04-11T07:00:00	\N	\N	\N	\N	\N	\N	2026-04-11T06:00:00	11.6	0	4.7	7.9	3
2295	2026-04-15	2026-04-15 19:26:42.88	\N	scheduler	14.9	0.3	4.25	6.18	34.5	16.57	8.22	21.41	100.1	\N	2.93	2026-04-15T16:00:00	16.35	7.2	25.32	65.6	\N	\N	2026-04-15T14:00:00	15.5	0	0.8	4	3
2293	2026-04-13	2026-04-13 19:52:17.681	\N	scheduler	14.16	0.9	5.3	4.95	34.36	16.45	8.24	2.89	96.03	\N	4.5	2026-04-13T13:00:00	17.55	7.3	15.69	98.4	\N	\N	2026-04-13T13:00:00	15.9	0	19.6	32.8	3
2303	2026-04-23	2026-04-23 22:35:02.096	10	scheduler	15.79	0.2	3.6	5.51	33.59	18.15	8.26	19.49	124.02	\N	12.92	2026-04-23T16:00:00	19.28	7.8	17.8	76.2	\N	\N	2026-04-23T22:00:00	12	0	6.3	11.5	3
2300	2026-04-20	2026-04-20 18:13:59.613	10	scheduler	16.3	0.32	2.9	6.97	33.09	20.05	8.19	22.73	107.68	\N	7	2026-04-20T18:00:00	\N	\N	\N	\N	\N	\N	2026-04-20T18:00:00	16.2	0	9.6	20.5	3
2302	2026-04-22	2026-04-22 22:45:21.888	10	scheduler	15.62	0.94	4.6	5.67	33.36	18.07	8.3	15.97	122.92	\N	17.4	2026-04-22T18:00:00	18.86	7.9	18.13	82.9	\N	\N	2026-04-22T21:00:00	10.5	0	5.8	11.5	0
2304	2026-04-24	2026-04-24 23:14:13.688	8	scheduler	16.9	0.12	2.2	5.41	34.04	19.15	8.29	21.06	123.39	\N	11.26	2026-04-24T18:00:00	\N	\N	\N	\N	\N	\N	2026-04-24T21:00:00	11.9	0	7.2	12.2	0
2307	2026-04-26	2026-04-26 22:55:49.199	\N	scheduler	17.3	0.04	1.8	5.36	35.15	\N	\N	\N	\N	\N	\N	\N	20.78	7.4	26.92	75.4	\N	\N	2026-04-26T22:00:00	15.4	0	6.6	10.8	3
2308	2026-04-27	2026-04-27 23:00:45.764	2	scheduler	17.4	0.12	2.55	5.06	35.44	21.24	8.23	38.23	114.05	\N	4.76	2026-04-27T18:00:00	21.03	7.3	20.64	87	\N	\N	2026-04-27T22:00:00	13.6	0	4.5	7.6	0
2310	2026-04-29	2026-04-29 18:01:44.471	10	scheduler	17.6	0.84	4.05	5.06	35.44	21.24	8.24	22.24	101.48	\N	9.49	2026-04-29T18:00:00	21.93	8.2	16.97	112.3	\N	\N	2026-04-29T17:00:00	16.2	0	25.8	45.7	3
2311	2026-04-30	2026-04-30 16:37:54.029	\N	scheduler	17.4	0.6	4.3	5.06	35.44	18.73	8.24	28.56	100.86	\N	4.07	2026-04-30T16:00:00	19.98	7.9	16.23	60.8	\N	\N	2026-04-30T05:00:00	16.6	0	9.3	22.3	0
2312	2026-05-02	2026-05-02 18:00:32.023	\N	scheduler	17.5	0.04	2.35	4.81	35.15	19.93	8.26	24.24	119.76	\N	2.29	2026-05-02T16:00:00	19.88	8	25.51	56.8	\N	\N	2026-05-02T17:00:00	19.3	0	11.3	23	0
2	2026-03-28	2026-03-28 18:33:06.743	9	scheduler	11.44	0.32	3.1	3.14	34.23	11.2	8.24	19.09	90.65	\N	7.52	2026-03-28T10:00:00	\N	\N	\N	\N	\N	\N	2026-03-28T18:00:00	11.4	0	5.5	9.4	1
2329	2026-05-16	2026-05-16 15:02:19.366	\N	scheduler	17.7	0.16	3.6	2.94	34.48	16.75	8.21	23.4	87.12	\N	2.34	2026-05-16T13:00:00	\N	\N	\N	\N	\N	\N	2026-05-16T13:00:00	18.2	0	3.4	6.8	2
2340	2026-05-27	2026-05-27 18:00:12.382	2	scheduler	21.2	0.02	1.8	2.24	33.8	26.76	8.63	23.57	193.98	\N	5.74	2026-05-26T13:00:00	28.37	8	22.34	84.1	\N	\N	2026-05-27T17:00:00	30.3	0	12	27	3
2318	2026-05-08	2026-05-08 17:31:55.856	10	scheduler	18.1	0.2	4	3.43	36.35	20.62	8.34	53.93	139.18	\N	6.75	2026-05-08T18:00:00	21.76	7.8	23.77	53	\N	\N	2026-05-08T16:00:00	18.7	0	8.6	13	3
2327	2026-05-14	2026-05-14 17:39:56.706	10	scheduler	18.2	0.26	3.65	3.23	34.75	18.38	8.24	28.28	94.99	\N	2.65	2026-05-14T16:00:00	17.73	7.8	22.97	45.8	\N	\N	2026-05-14T11:00:00	16	0	4	23.4	3
2314	2026-05-04	2026-05-04 18:00:05.172	10	scheduler	18	0.2	2.25	4.81	35.15	21.41	8.4	23.42	150.46	\N	19.22	2026-05-04T18:00:00	21.84	8.2	21.41	97.1	\N	\N	2026-05-04T17:00:00	22.2	0	13.2	25.9	3
2319	2026-05-09	2026-05-09 14:36:47.7	\N	scheduler	18.2	0.1	4.55	3.43	36.35	20.18	8.44	41.72	152.39	\N	21.83	2026-05-09T10:00:00	21.47	7.8	19.06	4.8	\N	\N	2026-05-09T13:00:00	23.4	0	14.8	19.4	0
2330	2026-05-17	2026-05-17 14:09:43.754	\N	scheduler	18	0.1	3.4	2.94	34.48	17.42	8.26	22.31	105.29	\N	2.72	2026-05-17T13:00:00	16.71	7.8	25.34	52.3	\N	\N	2026-05-17T10:00:00	19.5	0	16.1	24.8	1
2320	2026-05-10	2026-05-10 10:40:38.047	\N	scheduler	18.1	0.18	2.55	3.43	36.35	20.43	8.49	40.08	152.51	\N	8.61	2026-05-10T10:00:00	21.18	8.1	14.6	54.6	\N	\N	2026-05-10T06:00:00	19.5	0	7.5	21.6	3
2335	2026-05-22	2026-05-22 22:43:08.797	9	scheduler	19.9	0.06	2.6	1.97	33.41	19.89	8.12	29.19	81.63	\N	0.68	2026-05-19T13:00:00	25.12	7.8	26.27	78	\N	\N	2026-05-22T16:00:00	17.3	0	5.4	8.6	0
2315	2026-05-05	2026-05-05 21:17:45.371	9	scheduler	17.9	0.4	3.75	4.13	35.62	18.99	8.23	42.85	91.44	\N	6.74	2026-05-05T13:00:00	20.46	8	24.25	81.9	\N	\N	2026-05-05T17:00:00	15.9	0	6.3	19.4	2
2316	2026-05-06	2026-05-06 18:00:12.886	10	scheduler	17.9	0.5	3.7	4.13	35.62	18.91	8.19	44.24	91.75	\N	5.83	2026-05-06T18:00:00	20.06	8	25.36	62.1	\N	\N	2026-05-06T17:00:00	15.9	1.4	5.8	19.1	95
2334	2026-05-21	2026-05-21 23:04:49.238	\N	scheduler	18.11	0.08	2.2	1.97	33.41	19.89	8.12	29.19	81.63	\N	0.68	2026-05-19T13:00:00	23.37	8	27.58	126.5	\N	\N	2026-05-21T13:00:00	15.6	0	4.8	12.2	2
2325	2026-05-12	2026-05-12 21:44:12.253	8	scheduler	17.53	0.72	3.95	2.97	34.36	19.38	8.29	41.7	87.68	\N	3.62	2026-05-12T18:00:00	18.29	8	31.54	69.2	\N	\N	2026-05-12T18:00:00	12.9	0	12	19.8	0
2317	2026-05-07	2026-05-07 23:48:44.558	10	scheduler	18	0.26	4.25	4.13	35.62	20.04	8.21	38.35	105.42	\N	1.5	2026-05-07T18:00:00	21.08	8	27.11	69.8	\N	\N	2026-05-07T17:00:00	14.9	0	7.3	15.5	1
2326	2026-05-13	2026-05-13 23:14:48.37	\N	scheduler	17.4	0.68	3.95	3.23	34.75	18.68	8.26	26.87	93.65	\N	1.48	2026-05-13T18:00:00	18.45	8	24.57	71.2	\N	\N	2026-05-13T18:00:00	12.4	0	4.4	8.6	3
2328	2026-05-15	2026-05-15 22:16:33.218	9	scheduler	16.94	0.4	5.05	2.94	36.01	17.47	8.19	25.3	81.11	\N	1.83	2026-05-15T18:00:00	17.27	8	21.29	71.8	\N	\N	2026-05-15T16:00:00	12.3	0	5.8	8.6	3
2332	2026-05-19	2026-05-19 23:49:45.962	2	scheduler	17.25	0.22	2.4	2.11	33.19	19.89	8.12	29.19	81.63	\N	0.68	2026-05-19T13:00:00	\N	\N	\N	\N	\N	\N	2026-05-19T23:00:00	13.9	0	6.6	11.5	0
2322	2026-03-29	2026-05-11 16:31:25.747929	\N	backfill	\N	0.26	3.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	11.3	0	21.1	39.6	3
2323	2026-04-04	2026-05-11 16:31:26.428956	\N	backfill	\N	0.18	3.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13.2	0	11.9	25.9	2
2294	2026-04-14	2026-04-14 19:42:09.749	10	scheduler	14.18	1.1	5.3	5.48	34.61	16.09	8.24	0.98	93.98	\N	4.17	2026-04-14T18:00:00	16.54	7	17.27	77.7	\N	\N	2026-04-14T18:00:00	14.2	0	9.1	20.5	3
2324	2026-05-01	2026-05-11 16:31:29.605754	\N	backfill	\N	0.66	3.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15	0	24.2	45	0
2313	2026-05-03	2026-05-03 20:59:40.529	\N	scheduler	16.51	0.08	4.15	4.81	35.15	20.7	8.34	42.07	132.67	\N	7.51	2026-05-03T16:00:00	21.1	8.1	20.82	82.7	\N	\N	2026-05-03T15:00:00	14.8	0	7.5	13	3
2344	2026-05-31	2026-05-31 14:15:23.114	\N	scheduler	22.2	0.04	1.65	2.29	34.18	25.58	8.39	27.22	114.13	\N	15.13	2026-05-31T07:00:00	\N	\N	\N	\N	\N	\N	2026-05-31T14:00:00	31.9	0	17.1	28.8	0
2341	2026-05-28	2026-05-28 18:00:12.354	8	scheduler	22	0.14	2.75	2.24	33.8	26.76	8.63	23.57	193.98	\N	5.74	2026-05-26T13:00:00	28.16	8.1	24.58	95.2	\N	\N	2026-05-28T17:00:00	30.6	0	16.1	19.8	2
2336	2026-05-23	2026-05-23 19:12:40.748	\N	scheduler	20	0.1	2.55	1.83	33.12	19.89	8.12	29.19	81.63	\N	0.68	2026-05-19T13:00:00	\N	\N	\N	\N	\N	\N	2026-05-23T19:00:00	21.4	0	3	7.6	0
2321	2026-05-11	2026-05-11 23:55:15.633	10	scheduler	18	0.32	2.7	2.97	34.47	21.36	8.49	38.12	124.15	\N	1.73	2026-05-11T18:00:00	21.22	8	19.9	42.7	\N	\N	2026-05-11T20:00:00	14	0	9.6	19.4	2
2333	2026-05-20	2026-05-20 21:14:42.459	9	scheduler	19	0.02	2.35	2.03	33.56	19.89	8.12	29.19	81.63	\N	0.68	2026-05-19T13:00:00	22.76	7.8	27.57	78.1	\N	\N	2026-05-20T20:00:00	16.9	0	3.8	12.6	2
2338	2026-05-25	2026-05-25 18:00:12.544	10	scheduler	20.6	0.02	1.7	1.94	33.02	25.2	8.61	22.91	173.57	\N	15.81	2026-05-25T10:00:00	26.5	8	23.51	101.9	\N	\N	2026-05-25T17:00:00	28.4	0	12.5	23.4	0
2331	2026-05-18	2026-05-18 18:29:39.514	10	scheduler	18.4	0.1	2	2.21	33.53	20.65	8.27	23.9	115.67	\N	1.83	2026-05-18T18:00:00	20.3	7.9	27.59	106.7	\N	\N	2026-05-18T18:00:00	17.1	0	11.4	26.3	3
2342	2026-05-29	2026-05-29 18:00:12.408	\N	scheduler	22	0.16	3.15	2.24	33.8	27.2	8.19	26.2	60	\N	1.24	2026-05-29T18:00:00	27.52	8.1	21.79	111.5	\N	\N	2026-05-29T17:00:00	\N	\N	\N	\N	\N
2339	2026-05-26	2026-05-26 20:04:16.467	8	scheduler	21	0.02	1.7	1.94	33.02	26.76	8.63	23.57	193.98	\N	5.74	2026-05-26T13:00:00	27.93	7.8	24.56	73	\N	\N	2026-05-26T19:00:00	23	0	7.3	14	0
2337	2026-05-24	2026-05-24 15:12:29.728	\N	scheduler	20.2	0.1	2.3	1.83	33.12	19.89	8.12	29.19	81.63	\N	0.68	2026-05-19T13:00:00	\N	\N	\N	\N	\N	\N	2026-05-24T15:00:00	29.8	0	3.4	16.2	0
2343	2026-05-30	2026-05-30 18:00:05.006	\N	scheduler	22.1	0.04	2.05	2.29	34.18	27.76	8.31	25.79	127.4	\N	2.92	2026-05-30T18:00:00	26.84	8.1	23.82	99.6	\N	\N	2026-05-30T17:00:00	26.4	0	12.1	23.4	3
\.


--
-- TOC entry 4268 (class 0 OID 16603)
-- Dependencies: 236
-- Data for Name: external_customers_sync; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.external_customers_sync (id, external_id, customer_code, customer_name, customer_type, vat_number, tax_code, address, city, province, postal_code, country, phone, email, is_active, notes, synced_at, last_modified_external) FROM stdin;
1	4	4	ACUINUGA Aquacoltura Nutricion de Galizia	azienda	B70089750	B70089750					Spagna		tecnico@acuinuga.com	t	\N	2026-02-11 05:34:50.135832	\N
2	133	133	ALBA Società cooperativa	azienda	IT01187870298	01187870298					Italia			t	\N	2026-02-11 05:34:50.377989	\N
3	217	217	ALCIONE PESCA SOCIETA' AGRICOLA S.S.	azienda	01564660296	01564660296					Italia		sebastianocamuffo@gmail.com	t	\N	2026-02-11 05:34:50.610222	\N
4	220	220	ANDROMEDA SOCIETA' COOPERATIVA	azienda	03219570276	03219570276					Italia		camuffo.michela@yahoo.it	t	\N	2026-02-11 05:34:50.842623	\N
5	24	24	Alba Nuova Cooperativa a mutualità prevalente	azienda	01952290383	01952290383					Italia		alba.nuova@libero.it,albanuova.coop@libero.it	t	\N	2026-02-11 05:34:51.075111	\N
6	5	5	Albarella soc. Coop.	azienda	00942980293	00942980293					Italia			t	\N	2026-02-11 05:34:51.307612	\N
7	6	6	Apollo soc.coop.arl	azienda	01484940380	01484940380					Italia		riccisound@gmail.com	t	\N	2026-02-11 05:34:51.540648	\N
8	7	7	Aurora SSA	azienda	02086280381	02086280381					Italia		aurorasoc3@gmail.com	t	\N	2026-02-11 05:34:51.773021	\N
9	8	8	Azienda AGROZOOTECNICA ZAPPINO s.s.	azienda	03788880718	03788880718					Italia			t	\N	2026-02-11 05:34:52.005989	\N
10	9	9	Azzalin Celestino	azienda	01498140290	zzlcst74h30a059Y					Italia		criscele@icloud.com	t	\N	2026-02-11 05:34:52.239276	\N
11	158	158	BORDINA ALBERTO	azienda	01345320293	BRDLRT72M14G224B					Italia		bordina72@gmail.com	t	\N	2026-02-11 05:34:52.471698	\N
12	14	14	BROS SOCIETA SEMPLICE AGRICOLA	azienda	1998490385	1998490385	Piazza Vincenzino Folegatti, 22, 44022 Comacchio FE, Italia	COMACCHIO	FERRARA	44022	Italia		agricolabros@legalmail.it	t	\N	2026-02-11 05:34:52.704222	\N
13	135	135	BROS SOCIETA' SEMPLICE AGRICOLA	azienda	01998490385	01998490385					Italia			t	\N	2026-02-11 05:34:52.937	\N
14	134	134	Barboni Franco	azienda	01796430385	brbfnc57l02f156u					Italia		nikcurvaovest74@gmail.com	t	\N	2026-02-11 05:34:53.169368	\N
15	210	210	Bassa Marea Soc. Coop. Agricola	azienda	02137160384	02137160384					Italia		deltaced@deltaced.it	t	\N	2026-02-11 05:34:53.402269	\N
16	11	11	BioClam	azienda	01531600292	01531600292					Italia		bioclam@pec.it	t	\N	2026-02-11 05:34:53.634708	\N
17	12	12	Bordina Alberto - Coop. La Passera	azienda	1345320293	1345320293	Via Venezia 87	Rosolina Mare	RO	45010	Italia		lapasssera@pec.it	t	Polesine consulting	2026-02-11 05:34:53.866947	\N
18	13	13	Boscarato Alessandro	azienda	01034440295	BSCLSN64C18H573H					Italia			t	\N	2026-02-11 05:34:54.099071	\N
19	15	15	CAM Conservificio Allevatori Molluschi srl	azienda	00182700278	00182700278					Italia		molluschi@camittico.it	t	\N	2026-02-11 05:34:54.331354	\N
20	170	170	CAZZOLA ROSOLINO	azienda	01556750386	CZZRLN56S12E107P					Italia		coopadriatica@libero.it	t	\N	2026-02-11 05:34:54.563565	\N
21	215	215	CLAMS SOCIETA' COOPERATIVA	azienda	01592850380	01592850380					Italia			t	\N	2026-02-11 05:34:54.796021	\N
22	125	125	CO.PE.GO.	azienda				GORO	ferr	44020	Italia			t		2026-02-11 05:34:55.028398	\N
23	138	138	CONSORZIO MOLLUSCHICOLTORI VENETI	azienda	01477820292	01477820292					Italia			t	\N	2026-02-11 05:34:55.261095	\N
24	28	28	COOPERATIVA PESCATORI DEL DELTA - SOCIETA COOPERATIVA	azienda	1123310383	1123310383	VIA BARCHESSA, 28	GORO	FE	44020	Italia	17119.47.00	cooppescatorideldelta@virgilio.it	t	\N	2026-02-11 05:34:55.493653	\N
25	164	164	COOPERATIVA PESCATORI DEL DELTA - SOCIETA' COOPERATIVA	azienda	01123310383	01123310383					Italia		cooppescatorideldelta@virgilio.it	t	\N	2026-02-11 05:34:55.726387	\N
26	145	145	COOPERATIVA PESCATORI DI VOLANO - SOCIETA' COOPERATIVA	azienda	01740080385	01740080385					Italia			t	\N	2026-02-11 05:34:55.958627	\N
27	225	225	COOPERATIVA PESCATORI PO SOCIETA' COOPERATIVA	azienda	00243290293	00243290293					Italia			t	\N	2026-02-11 05:34:56.190767	\N
28	166	166	COOPERATIVA SOLE SOCIETA’ COOPERATIVA AGRICOLA	azienda	  02153890385	  02153890385	VIA CESARE BATTISTI N. 114/1	GORO	FERRARA	44020	Italia	0533/996343	DELTACED@DELTACED.IT	t	 SDI: USAL8PV	2026-02-11 05:34:56.423078	\N
29	168	168	Cazzola Alessandro	azienda	01623590385	CZZLSN84T09C814W					Italia		coopadriatica@libero.it	t	\N	2026-02-11 05:34:56.655349	\N
30	159	159	Cazzola Paolo soc. Adriatica	azienda	00971080387	CZZPLA61T01E107T					Italia			t	\N	2026-02-11 05:34:56.888268	\N
31	16	16	Ceppa Società Semplice Agricola di Oselladore R.E. Bollini J.	azienda	01522020294	01522020294					Italia		ruggero977@gmail.com	t	\N	2026-02-11 05:34:57.120559	\N
32	167	167	Consorzio Coop. Pescatori del Polesine OP soc coop	azienda	00224140293	00224140293					Italia		avanzoveronica@consorzioscardovari.it	t	\N	2026-02-11 05:34:57.352772	\N
33	30	30	Consorzio Delta Nord	azienda	01074500297	01074500297					Italia			t	\N	2026-02-11 05:34:57.585047	\N
34	139	139	Consorzio Pescatori di Goro Soc. Coop. OP	azienda	00040400384	00040400384					Italia		paola.gianella@copego.it,massimo.genari@copego.it	t	\N	2026-02-11 05:34:57.817287	\N
35	19	19	Coop San Marco	azienda	01477960387	01477960387					Italia		CoopSanMarco.b@gmail.com	t	\N	2026-02-11 05:34:58.049561	\N
36	20	20	Coop Venere	azienda	01738060381	01738060381					Italia		g.trombini@libero.it	t	\N	2026-02-11 05:34:58.28617	\N
37	21	21	Coop. Adriatica Gorino	azienda	00423670389	82002630380					Italia		coopadriatica@libero.it	t	\N	2026-02-11 05:34:58.525632	\N
38	22	22	Coop. La Vela	azienda	01227850383	01227850383					Italia		cooplavela@autlook.com	t	\N	2026-02-11 05:34:58.757843	\N
39	33	33	Coop. Mare -Elena Maccapani	azienda	745110387	745110387	Via Ellis Paesanti 47	Gorino	FE	44020	Italia	533999898	coopmare@libero.it	t	cel 339 89 99 976	2026-02-11 05:34:58.990472	\N
40	140	140	Coop.Pescatori Volano scarl	azienda	00386860308	00386860308					Italia		direzione@coopescasanvito.it	t	\N	2026-02-11 05:34:59.222782	\N
41	141	141	Cooperativa Amica	azienda							Italia			t	\N	2026-02-11 05:34:59.455186	\N
42	25	25	Cooperativa Clodiense Bullo Stefano	azienda	03271790275	03271790275					Italia		pescatoriclodiense@libero.it	t	\N	2026-02-11 05:34:59.687527	\N
43	121	121	Cooperativa GORO & BOSCO	azienda	01708360381	01708360381					Italia		coopgorobosco@gmail.com	t	\N	2026-02-11 05:34:59.919764	\N
44	169	169	Cooperativa LA ROMANINA Soc. Coop. arl	azienda	01427580384	01427580384					Italia		cooplaromanina@gmail.com	t	\N	2026-02-11 05:35:00.153236	\N
45	143	143	Cooperativa Pesca Soc.Coop.	azienda	01743670380	01743670380					Italia		coopvolano@lamiapec.it	t	\N	2026-02-11 05:35:00.385373	\N
46	23	23	Cooperativa Pescatori Eridania srl	azienda	00038310298	00038310298					Italia		info@eridania.191.it	t	\N	2026-02-11 05:35:00.617356	\N
47	29	29	Cooperativa Pescatori Laghese Società Cooperativa ARL	azienda	01356120384	01356120384					Italia		nicoletta.carlin@studio-duo.it	t	\N	2026-02-11 05:35:00.849838	\N
48	147	147	Cooperativa S. ANTONIO Società Cooperativa	azienda	01258950383	01258950383					Italia		coopsantantonio@libero.it	t	\N	2026-02-11 05:35:01.081963	\N
49	211	211	Cooperativa Sole Soc. Coop. agricola	azienda	02153890385	02153890385					Italia		deltadec@deltaced.it,paganinipaolo@gmail.com	t	\N	2026-02-11 05:35:01.314509	\N
50	26	26	Cooperativa del Mare	azienda	00745110387	00745110387					Italia		amministrazione@coopdelmare.it	t	\N	2026-02-11 05:35:01.546863	\N
51	171	171	Crivellari Marco	azienda	01452270299	CRVMRC92E01L736C					Italia		coop.rosolina@tiscalinet.it	t	\N	2026-02-11 05:35:01.778957	\N
52	149	149	Delta Nord	azienda							Italia		consorziodeltanord@libero.it	t	\N	2026-02-11 05:35:02.01169	\N
53	31	31	Denodini Mar di Turri Thomas	azienda	01591170293	01591170293					Italia		denodinim@pec.it	t	\N	2026-02-11 05:35:02.243859	\N
54	226	226	EL CALIGO SOCIETA' COOPERATIVA	azienda	01104660293	01104660293					Italia			t	\N	2026-02-11 05:35:02.482192	\N
55	151	151	Ecotapes Zeeland B.V.	azienda	NL862293832B01	NL862293832B01					Paesi Bassi		ecotapes.zeeland@gmail.com	t	\N	2026-02-11 05:35:02.714706	\N
56	152	152	Elena Maccapani	azienda							Italia		coopmare@libero.it;amministrazione@coopdelmare.it	t	\N	2026-02-11 05:35:02.947523	\N
57	34	34	Ephelia soc. semplice	azienda	01746090388	01746090388					Italia		tagliaticelestino@gmail.com	t	\N	2026-02-11 05:35:03.179923	\N
58	35	35	Fabbris Angelo	azienda							Italia			t	\N	2026-02-11 05:35:03.412162	\N
59	172	172	Falconi Paride	azienda	01211310295	FLCPRD66M24H573J					Italia		coop.rosolina@tiscalinet.it	t	\N	2026-02-11 05:35:03.64458	\N
60	36	36	Felletti Andrea	azienda	01990650382	01990650382					Italia		carlo.trombini1986@libero.it	t	\N	2026-02-11 05:35:03.877238	\N
61	37	37	Felletti Michela	azienda	04246560272	04246560272					Italia		zennaromanuel@libero.it	t	\N	2026-02-11 05:35:04.109645	\N
62	18	18	Filippo Conventi	azienda	01368760383	CNVFPP78R19H620B					Italia		filippoconventi19@g.mail.com	t	\N	2026-02-11 05:35:04.342306	\N
63	153	153	Fratelli & Cognati soc. agr.	azienda							Italia			t	\N	2026-02-11 05:35:04.574494	\N
64	221	221	G.E.P. SOCIETA' SEMPLICE AGRICOLA	azienda	02177370380	91020580386					Italia		andreabart20@gmail.com	t	\N	2026-02-11 05:35:04.806943	\N
65	38	38	GORO PESCA srl	azienda	00479450389	00479450389					Italia		info@goropesca.it	t	\N	2026-02-11 05:35:05.039601	\N
66	39	39	GROBOS SOCIETA' COOPERATIVA	azienda	01194430292	01194430292					Italia			t	\N	2026-02-11 05:35:05.271794	\N
67	154	154	Gatti Michele	azienda	03455450274	fbbngl70s03c638y					Italia		bischeroa@yahoo.it	t	\N	2026-02-11 05:35:05.504146	\N
68	155	155	Gelli Maria Elena	azienda	02013320383	FLLNDR83B22c912T					Italia		felletti83@gmail.com	t	\N	2026-02-11 05:35:05.737553	\N
69	212	212	Gloria Pesca S.S.A.	azienda	01481390290	01481390290					Italia		martin85@libero.it	t	\N	2026-02-11 05:35:05.970614	\N
70	156	156	Goro &Bosco soc.coop.arl	azienda	02027370382	fllmhl87a64c814l					Italia		felletti83@gmail.com	t	\N	2026-02-11 05:35:06.202807	\N
71	173	173	Grossato Mirco	azienda	01353390299	01353390299					Italia			t	\N	2026-02-11 05:35:06.435054	\N
72	40	40	Grossato Mirco- soc. agr. La Passera	azienda	1353390299	1353390299	Via Zaffoni 14	Rosolina	RO	45010	Italia		lapasssera@pec.it	t	\N	2026-02-11 05:35:06.668131	\N
73	157	157	I Simpson Soc. Cooperativa	azienda	01548860293	01548860293					Italia		fratelliecognati@gmail.com	t	\N	2026-02-11 05:35:06.900594	\N
74	224	224	L'ACQUAVIVA S.R.L.	azienda	01277230296	01277230296					Italia		lacquaviva@pec.it,info@l-acquaviva.it	t	\N	2026-02-11 05:35:07.132864	\N
75	41	41	LA BUSSOLA - SOCIETA' COOPERATIVA	azienda	01654200383	01654200383					Italia		labussolagoro@tiscali.it	t	\N	2026-02-11 05:35:07.364992	\N
76	42	42	LA FENICE SOC COOP ARL	azienda	01885870384	01885870384					Italia		cooplafenice11@legalmail.it	t	\N	2026-02-11 05:35:07.597133	\N
77	44	44	LA PASSERA Soc. Coop. a.r.l.	azienda	03465620270	03465620270					Italia			t	\N	2026-02-11 05:35:07.829436	\N
78	46	46	LA ROMANINA Soc. Coop. arl	azienda	1427580384	1427580384	Via Biverare 77/a	Mesola	FE	44026	Italia	17091.43.00	cooplaromanina@gmail.com	t	\N	2026-02-11 05:35:08.061612	\N
79	174	174	LA SACCA SOC. COOPERATIVA	azienda	01427440381	01427440381					Italia		cooplasacca@libero.it	t	\N	2026-02-11 05:35:08.293933	\N
80	48	48	LA VERACE Società Cooperativa	azienda	01877390383	01877390383					Italia		coop.laverace@virgilio.it	t	\N	2026-02-11 05:35:08.526145	\N
81	205	205	LE NOSTRANE ss	azienda	04581990274	04581990274					Italia			t	\N	2026-02-11 05:35:08.758257	\N
82	43	43	La Laguna	azienda	01816190381	01816190381					Italia			t	\N	2026-02-11 05:35:08.990363	\N
83	45	45	La Perla Nera Società Semplice Agricola	azienda	04262250279	04262250279					Italia			t	\N	2026-02-11 05:35:09.223156	\N
84	130	130	La Sacca	azienda				GORO	Ferrara	44020	Italia			t		2026-02-11 05:35:09.455789	\N
85	47	47	La Valle società Coopertiva	azienda	14355303389	01435530389					Italia		irene.rizzardi@gmail.com	t	\N	2026-02-11 05:35:09.695875	\N
86	49	49	MAGI soc coop semplice	azienda	02081590388	02081590388					Italia		mgib@mgib.it	t	\N	2026-02-11 05:35:09.928088	\N
87	218	218	MAGICA SOCIETA' COOPERATIVA	azienda	01911510384	01911510384					Italia			t	\N	2026-02-11 05:35:10.162161	\N
88	206	206	MARCHIOL S.P.A.	azienda	01176110268	01176110268					Italia			t	\N	2026-02-11 05:35:10.394245	\N
89	50	50	MARTIN JONNI	azienda	01334030291	MRTJNN74P10A059O					Italia			t	\N	2026-02-11 05:35:10.626912	\N
90	51	51	Milani Nicola	azienda	01147900383	MLNNCL72C06D548A					Italia		coopadriatica@libero.it	t	\N	2026-02-11 05:35:10.860057	\N
91	177	177	Milani Vittorio	azienda	01078860382	MLNVTR67P24E107C					Italia		coopadriatica@libero.it	t	\N	2026-02-11 05:35:11.092898	\N
92	52	52	Miracoli soc agr	azienda	01893940385	gllmln85l64g916p					Italia		raffaelecazzola84@gmail.com	t	\N	2026-02-11 05:35:11.325662	\N
93	53	53	Moceniga Pesca S.S.	azienda	01082120294	01082120294					Italia		moceniga@libero.it	t	\N	2026-02-11 05:35:11.557939	\N
94	54	54	NEW AGRICOLT Innovation soc agr srl	azienda	1708360381	1708360381	Via Corriera 1	Mesola	FE	44026	Italia	3486707567	delta@deltaced.it	t	\N	2026-02-11 05:35:11.790266	\N
95	178	178	Naldi Gabriele	azienda	01211390297	NLDGRL54E31C814T					Italia		coop.rosolina@tiscalinet.it	t	\N	2026-02-11 05:35:12.022462	\N
96	55	55	Nuova Levante S.s.	azienda	01729020386	01729020386					Italia		snc.alberi@gmail.com	t	\N	2026-02-11 05:35:12.254625	\N
97	179	179	PARALOVO ANDREA	azienda	01861610382	PRLNDR93T06C814P					Italia			t	\N	2026-02-11 05:35:12.48699	\N
98	56	56	PARALOVO ANDREA soci coop Adriatica	azienda	1861610382	PRLNDR93T06C814P	VIA GORINO, 115	GORO	FE	44020	Italia			t	\N	2026-02-11 05:35:12.719609	\N
99	180	180	PASSARELLA ANDREA	azienda	01397850387	PSSNDR79C26C912R					Italia			t	\N	2026-02-11 05:35:12.952039	\N
100	57	57	PASSARELLA ANDREA soci Coop Adriatica	azienda	1397850387	PSSNDR79C26C912R	VIA MARINAI D'ITALIA, 50	GORO	FE	44020	Italia			t	\N	2026-02-11 05:35:13.184338	\N
101	214	214	PICO PALLINO SOCIETA' A RESPONSABILITA' LIMITATA SEMPLIFICATA	azienda	02585550359	02585550359					Italia			t	\N	2026-02-11 05:35:13.41674	\N
102	223	223	PINCO E PALLINO SOCIETA' A RESPONSABILITA' LIMITATA	azienda	12671561004	12671561004					Italia			t	\N	2026-02-11 05:35:13.648891	\N
103	131	131	PO	azienda							Italia			t		2026-02-11 05:35:13.881157	\N
104	58	58	POLESINE CONSULTING S.R.L.	azienda	01613480290	01613480290					Italia			t	\N	2026-02-11 05:35:14.113357	\N
105	60	60	PROAMEIXA FERNÁNDEZ, S.L.	azienda	ESB70015821	B70015821					Spagna		info@proameixa.com	t	\N	2026-02-11 05:35:14.345615	\N
106	182	182	Poseidonia s.s. soc.agr. di Meloni Fulvio e Zennaro Manuel	azienda	01490310297	01490310297					Italia		criscele@icloud.com	t	\N	2026-02-11 05:35:14.577909	\N
107	59	59	Poseidonia soc. agricola	azienda	05081120288	05081120288					Italia			t	\N	2026-02-11 05:35:14.810138	\N
108	61	61	REAMAR soc. coop.arl	azienda	01996720387	01996720387					Italia			t	\N	2026-02-11 05:35:15.042722	\N
109	62	62	REGINA SOC. AGRICOLA S.S.	azienda	01569590290	mdnrcr78d14c967m					Italia		modena.riccardo@gmail.com	t	\N	2026-02-11 05:35:15.275232	\N
110	183	183	RO.MA.MAR Società Cooperativa a.r.l	azienda	01575130388	01575130388					Italia		ro.ma.mar.goro@gmail.com	t	\N	2026-02-11 05:35:15.507787	\N
111	63	63	RO.MA:MAR Società Cooperativa a.r.l.	azienda	1575130388	1575130388	Via Nuova 58	Goro	FE	44020	Italia	3475824517	ro.ma.mar.goro@gmail.com	t	Tipo B - Zona C7 - Licenza n. 8641 del 30.04.2024	2026-02-11 05:35:15.740492	\N
112	184	184	SAN PIETRO S.C.A.R.L.	azienda	01513320380	01513320380					Italia		sanpietro.pozzati@gmail.com	t	\N	2026-02-11 05:35:15.972988	\N
113	65	65	SANGIA SOCIETA COOPERATIVA	azienda	2055560383	2055560383	VIA CESARE BATTISTI, 114/1	GORO	FE	44020	Italia			t	\N	2026-02-11 05:35:16.205264	\N
114	186	186	SANGIA' SOCIETA' COOPERATIVA	azienda	02055560383	02055560383					Italia		anghe965@gmail.com	t	\N	2026-02-11 05:35:16.437342	\N
115	66	66	SERENISSIMA PESCA SOC COOP	azienda	02925260271	02925260271					Italia			t	\N	2026-02-11 05:35:16.670293	\N
116	75	75	SOC.COOPERATIVA GORINO	azienda	01218150389	01218150389					Italia			t	\N	2026-02-11 05:35:16.902568	\N
117	163	163	SOCIETA' AGRICOLA ECOTAPES SRL	azienda	04621060278	04621060278					Italia		ecotapes.2020@gmail.com	t	\N	2026-02-11 05:35:17.134738	\N
118	222	222	SOCIETA' AGRICOLA RI.OS. S.S. DI MANCIN GIAN PIETRO E C.	azienda	01253210296	01253210296					Italia			t	\N	2026-02-11 05:35:17.367701	\N
119	194	194	SOCIETA' AGRICOLA SEALBA 2 S.S.	azienda	04767040274	04767040274					Italia			t	\N	2026-02-11 05:35:17.600036	\N
120	195	195	SOCIETA' AGRICOLA TIRRENA	azienda	00305250292	00305250292					Italia		società.agricola@legalmail.it	t	\N	2026-02-11 05:35:17.832226	\N
121	79	79	SOCIETA' COOPERATIVA ACQUAVIVA	azienda	01841330382	01841330382					Italia		massimoballarinidec@libero.it	t	\N	2026-02-11 05:35:18.06454	\N
122	124	124	SOCIETA' COOPERATIVA PESCATORI S.GIULIA	azienda	01158780294	01158780294					Italia			t	\N	2026-02-11 05:35:18.298021	\N
123	80	80	SOL LEVANTE - SOCIETA' COOPERATIVA	azienda	01924210386	01924210386					Italia		coopsollevante@gmail.com	t	\N	2026-02-11 05:35:18.53043	\N
124	64	64	San Marco società cooperativa	azienda	14512451007	14512451007					Italia		dantoni_sandro@hotmail.it	t	\N	2026-02-11 05:35:18.762607	\N
125	207	207	San Pietro S.C.A.R.L.	azienda	IT01513320380	IT01513320380					Italia		sanpietro.pozzati@gmail.com	t	\N	2026-02-11 05:35:18.994744	\N
126	67	67	Soc Coop Poseidone	azienda	01251320295	01251320295					Italia			t	\N	2026-02-11 05:35:19.227312	\N
127	68	68	Soc Coop SANT'ANTONIO	azienda	1258950383	1258950383	Via Ellis Paesanti n. 24	Goro	FE	44020	Italia	3334642867	coopsantantonio@libero.it	t	Codice allevamento: BFE1 sacca di Goro	2026-02-11 05:35:19.459793	\N
128	69	69	Soc cooperativa Rosa dei Venti	azienda	01257010387	01257010387					Italia		rosadeiventi3@gmail.com	t	\N	2026-02-11 05:35:19.691987	\N
129	187	187	Soc. Agri Smeraldo	azienda							Italia			t	\N	2026-02-11 05:35:19.924272	\N
130	71	71	Soc. Agricola ORO DEL DELTA s.s. di Vaccari Lorenzo & C.	azienda	01578080291	01578080291					Italia			t	\N	2026-02-11 05:35:20.157011	\N
131	188	188	Soc. Agricola Scanno di Tironi Giuseppe	azienda	03407720287	03407720287					Italia			t	\N	2026-02-11 05:35:20.389864	\N
132	73	73	Soc. Cooperativa Pesca VOLANO	azienda	1743670380	1743670380	Piazza Cesare Battisti 114/1	Goro	FE	44020	Italia	3464775067	coopvolano@lamiapec.it	t	\N	2026-02-11 05:35:20.637735	\N
133	232	232	Soc.Agr.Alma pesca ss	azienda	00750250292	00750250292					Italia		coop.rosolina@gmail.com	t	\N	2026-02-11 05:35:20.869873	\N
134	70	70	Societa agr. Alissa s.s.	azienda	01571890290	01571890290					Italia		agricolafratellicavallari@gmail.com	t	\N	2026-02-11 05:35:21.102323	\N
135	193	193	Società Cooperativa ALBATROS	azienda	01706620380	01706620380					Italia		beppemicali73@gmail.com	t	\N	2026-02-11 05:35:21.334675	\N
136	77	77	Società agricola Delta Futuro srl	azienda	02057710382	02057710382					Italia		deltafuturo.goro@gmail.com	t	\N	2026-02-11 05:35:21.566807	\N
137	191	191	Società agricola Moceniga Pesca s.s	azienda	04443240272	pnzrrt63a06c638a					Italia		robertopenzo832@yahoo.it	t	\N	2026-02-11 05:35:21.798966	\N
138	192	192	Società cooperativa agricola San Rocco	azienda	02118120381	02118120381					Italia			t	\N	2026-02-11 05:35:22.031403	\N
139	216	216	Spinadin Pesca	azienda	00000000000	00000000000					Italia			t	\N	2026-02-11 05:35:22.264825	\N
140	208	208	Stichting zeeschelp	azienda	NL813730089B	NL813730089B					Paesi Bassi			t	\N	2026-02-11 05:35:22.497302	\N
141	209	209	TURGIAMAR SOC. COOP.	azienda	01627470386	01627470386					Italia		studiofabianicinti@virgilio.it	t	\N	2026-02-11 05:35:22.729744	\N
142	196	196	Tagliati Simone	azienda	01277000384	TGLSMN75T15C912W					Italia		coopadriatica@libero.it	t	\N	2026-02-11 05:35:22.96195	\N
143	198	198	Tiozzo Pagio Michael	azienda	04618970273	TZZMHL86M22C638J					Italia			t	\N	2026-02-11 05:35:23.194258	\N
144	123	123	Tirrenia	azienda							Italia			t		2026-02-11 05:35:23.426934	\N
145	199	199	Tosatti Andrea	azienda	01626450389	TSTNDR82T02D548G					Italia		andreatosatti@gmail.com	t	\N	2026-02-11 05:35:23.65919	\N
146	200	200	Trombini Graziano	azie