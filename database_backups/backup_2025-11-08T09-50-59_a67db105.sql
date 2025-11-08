--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (165f042)
-- Dumped by pg_dump version 16.9

-- Started on 2025-11-08 09:50:59 UTC

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
DROP TRIGGER IF EXISTS trigger_protect_mixed_lot_metadata ON public.operations;
DROP TRIGGER IF EXISTS trigger_enrich_mixed_lot_metadata ON public.operations;
DROP INDEX IF EXISTS public.operations_cycle_id_idx;
DROP INDEX IF EXISTS public.operations_basket_id_idx;
DROP INDEX IF EXISTS public.notifications_is_read_idx;
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
ALTER TABLE IF EXISTS ONLY public.bag_allocations DROP CONSTRAINT IF EXISTS bag_allocations_pkey;
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
ALTER TABLE IF EXISTS public.bag_allocations ALTER COLUMN id DROP DEFAULT;
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
DROP SEQUENCE IF EXISTS public.bag_allocations_id_seq;
DROP TABLE IF EXISTS public.bag_allocations;
DROP SEQUENCE IF EXISTS public.advanced_sales_id_seq;
DROP TABLE IF EXISTS public.advanced_sales;
DROP FUNCTION IF EXISTS public.protect_mixed_lot_metadata();
DROP FUNCTION IF EXISTS public.enrich_mixed_lot_metadata();
DROP SCHEMA IF EXISTS public;
--
-- TOC entry 4 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- TOC entry 336 (class 1255 OID 425984)
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
-- TOC entry 324 (class 1255 OID 425986)
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
-- TOC entry 4068 (class 0 OID 0)
-- Dependencies: 215
-- Name: advanced_sales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.advanced_sales_id_seq OWNED BY public.advanced_sales.id;


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
-- TOC entry 4069 (class 0 OID 0)
-- Dependencies: 217
-- Name: bag_allocations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bag_allocations_id_seq OWNED BY public.bag_allocations.id;


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
-- TOC entry 4070 (class 0 OID 0)
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
-- TOC entry 4071 (class 0 OID 0)
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
    nfc_last_programmed_at timestamp without time zone
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
-- TOC entry 4072 (class 0 OID 0)
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
-- TOC entry 4073 (class 0 OID 0)
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
-- TOC entry 4074 (class 0 OID 0)
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
-- TOC entry 4075 (class 0 OID 0)
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
-- TOC entry 4076 (class 0 OID 0)
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
-- TOC entry 4077 (class 0 OID 0)
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
-- TOC entry 4078 (class 0 OID 0)
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
-- TOC entry 4079 (class 0 OID 0)
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
-- TOC entry 4080 (class 0 OID 0)
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
-- TOC entry 4081 (class 0 OID 0)
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
-- TOC entry 4082 (class 0 OID 0)
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
-- TOC entry 4083 (class 0 OID 0)
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
-- TOC entry 4084 (class 0 OID 0)
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
    production_center text
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
-- TOC entry 4085 (class 0 OID 0)
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
-- TOC entry 4086 (class 0 OID 0)
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
-- TOC entry 4087 (class 0 OID 0)
-- Dependencies: 307
-- Name: growth_distributions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.growth_distributions_id_seq OWNED BY public.growth_distributions.id;


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
-- TOC entry 4088 (class 0 OID 0)
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
-- TOC entry 4089 (class 0 OID 0)
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
-- TOC entry 4090 (class 0 OID 0)
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
-- TOC entry 4091 (class 0 OID 0)
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
-- TOC entry 4092 (class 0 OID 0)
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
-- TOC entry 4093 (class 0 OID 0)
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
-- TOC entry 4094 (class 0 OID 0)
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
    size_id integer,
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
-- TOC entry 4095 (class 0 OID 0)
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
-- TOC entry 4096 (class 0 OID 0)
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
-- TOC entry 4097 (class 0 OID 0)
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
-- TOC entry 4098 (class 0 OID 0)
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
-- TOC entry 4099 (class 0 OID 0)
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
-- TOC entry 4100 (class 0 OID 0)
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
-- TOC entry 4101 (class 0 OID 0)
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
-- TOC entry 4102 (class 0 OID 0)
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
-- TOC entry 4103 (class 0 OID 0)
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
    notes text
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
-- TOC entry 4104 (class 0 OID 0)
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
    created_at timestamp without time zone DEFAULT now() NOT NULL
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
-- TOC entry 4105 (class 0 OID 0)
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
-- TOC entry 4106 (class 0 OID 0)
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
-- TOC entry 4107 (class 0 OID 0)
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
-- TOC entry 4108 (class 0 OID 0)
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
    created_at timestamp without time zone DEFAULT now() NOT NULL
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
-- TOC entry 4109 (class 0 OID 0)
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
-- TOC entry 4110 (class 0 OID 0)
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
-- TOC entry 4111 (class 0 OID 0)
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
-- TOC entry 4112 (class 0 OID 0)
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
    notes text
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
-- TOC entry 4113 (class 0 OID 0)
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
    notes text
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
-- TOC entry 4114 (class 0 OID 0)
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
-- TOC entry 4115 (class 0 OID 0)
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
-- TOC entry 4116 (class 0 OID 0)
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
-- TOC entry 4117 (class 0 OID 0)
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
-- TOC entry 4118 (class 0 OID 0)
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
-- TOC entry 4119 (class 0 OID 0)
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
-- TOC entry 4120 (class 0 OID 0)
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
-- TOC entry 4121 (class 0 OID 0)
-- Dependencies: 297
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3451 (class 2604 OID 16482)
-- Name: advanced_sales id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advanced_sales ALTER COLUMN id SET DEFAULT nextval('public.advanced_sales_id_seq'::regclass);


--
-- TOC entry 3455 (class 2604 OID 16496)
-- Name: bag_allocations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bag_allocations ALTER COLUMN id SET DEFAULT nextval('public.bag_allocations_id_seq'::regclass);


--
-- TOC entry 3593 (class 2604 OID 393231)
-- Name: basket_growth_profiles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.basket_growth_profiles ALTER COLUMN id SET DEFAULT nextval('public.basket_growth_profiles_id_seq'::regclass);


--
-- TOC entry 3456 (class 2604 OID 16505)
-- Name: basket_lot_composition id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.basket_lot_composition ALTER COLUMN id SET DEFAULT nextval('public.basket_lot_composition_id_seq'::regclass);


--
-- TOC entry 3458 (class 2604 OID 16515)
-- Name: baskets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baskets ALTER COLUMN id SET DEFAULT nextval('public.baskets_id_seq'::regclass);


--
-- TOC entry 3460 (class 2604 OID 16525)
-- Name: clienti id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clienti ALTER COLUMN id SET DEFAULT nextval('public.clienti_id_seq'::regclass);


--
-- TOC entry 3472 (class 2604 OID 16545)
-- Name: configurazione id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configurazione ALTER COLUMN id SET DEFAULT nextval('public.configurazione_id_seq'::regclass);


--
-- TOC entry 3475 (class 2604 OID 16558)
-- Name: cycles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cycles ALTER COLUMN id SET DEFAULT nextval('public.cycles_id_seq'::regclass);


--
-- TOC entry 3477 (class 2604 OID 16568)
-- Name: ddt id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ddt ALTER COLUMN id SET DEFAULT nextval('public.ddt_id_seq'::regclass);


--
-- TOC entry 3483 (class 2604 OID 16582)
-- Name: ddt_righe id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ddt_righe ALTER COLUMN id SET DEFAULT nextval('public.ddt_righe_id_seq'::regclass);


--
-- TOC entry 3487 (class 2604 OID 16594)
-- Name: email_config id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_config ALTER COLUMN id SET DEFAULT nextval('public.email_config_id_seq'::regclass);


--
-- TOC entry 3489 (class 2604 OID 16606)
-- Name: external_customers_sync id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_customers_sync ALTER COLUMN id SET DEFAULT nextval('public.external_customers_sync_id_seq'::regclass);


--
-- TOC entry 3493 (class 2604 OID 16620)
-- Name: external_deliveries_sync id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_deliveries_sync ALTER COLUMN id SET DEFAULT nextval('public.external_deliveries_sync_id_seq'::regclass);


--
-- TOC entry 3495 (class 2604 OID 16632)
-- Name: external_delivery_details_sync id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_delivery_details_sync ALTER COLUMN id SET DEFAULT nextval('public.external_delivery_details_sync_id_seq'::regclass);


--
-- TOC entry 3497 (class 2604 OID 16644)
-- Name: external_sales_sync id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_sales_sync ALTER COLUMN id SET DEFAULT nextval('public.external_sales_sync_id_seq'::regclass);


--
-- TOC entry 3629 (class 2604 OID 811012)
-- Name: external_users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_users ALTER COLUMN id SET DEFAULT nextval('public.external_users_id_seq'::regclass);


--
-- TOC entry 3505 (class 2604 OID 16662)
-- Name: fatture_in_cloud_config id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fatture_in_cloud_config ALTER COLUMN id SET DEFAULT nextval('public.fatture_in_cloud_config_id_seq'::regclass);


--
-- TOC entry 3515 (class 2604 OID 16680)
-- Name: flupsys id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flupsys ALTER COLUMN id SET DEFAULT nextval('public.flupsys_id_seq'::regclass);


--
-- TOC entry 3590 (class 2604 OID 393220)
-- Name: growth_analysis_runs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_analysis_runs ALTER COLUMN id SET DEFAULT nextval('public.growth_analysis_runs_id_seq'::regclass);


--
-- TOC entry 3597 (class 2604 OID 393251)
-- Name: growth_distributions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_distributions ALTER COLUMN id SET DEFAULT nextval('public.growth_distributions_id_seq'::regclass);


--
-- TOC entry 3518 (class 2604 OID 16691)
-- Name: lot_inventory_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lot_inventory_transactions ALTER COLUMN id SET DEFAULT nextval('public.lot_inventory_transactions_id_seq'::regclass);


--
-- TOC entry 3520 (class 2604 OID 16701)
-- Name: lot_ledger id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lot_ledger ALTER COLUMN id SET DEFAULT nextval('public.lot_ledger_id_seq'::regclass);


--
-- TOC entry 3523 (class 2604 OID 16714)
-- Name: lot_mortality_records id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lot_mortality_records ALTER COLUMN id SET DEFAULT nextval('public.lot_mortality_records_id_seq'::regclass);


--
-- TOC entry 3526 (class 2604 OID 16725)
-- Name: lots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lots ALTER COLUMN id SET DEFAULT nextval('public.lots_id_seq'::regclass);


--
-- TOC entry 3531 (class 2604 OID 16738)
-- Name: mortality_rates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mortality_rates ALTER COLUMN id SET DEFAULT nextval('public.mortality_rates_id_seq'::regclass);


--
-- TOC entry 3532 (class 2604 OID 16747)
-- Name: notification_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_settings ALTER COLUMN id SET DEFAULT nextval('public.notification_settings_id_seq'::regclass);


--
-- TOC entry 3535 (class 2604 OID 16758)
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- TOC entry 3538 (class 2604 OID 16769)
-- Name: operations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operations ALTER COLUMN id SET DEFAULT nextval('public.operations_id_seq'::regclass);


--
-- TOC entry 3603 (class 2604 OID 540676)
-- Name: ordini id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordini ALTER COLUMN id SET DEFAULT nextval('public.ordini_id_seq'::regclass);


--
-- TOC entry 3610 (class 2604 OID 540690)
-- Name: ordini_righe id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordini_righe ALTER COLUMN id SET DEFAULT nextval('public.ordini_righe_id_seq'::regclass);


--
-- TOC entry 3540 (class 2604 OID 16778)
-- Name: sale_bags id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_bags ALTER COLUMN id SET DEFAULT nextval('public.sale_bags_id_seq'::regclass);


--
-- TOC entry 3543 (class 2604 OID 16789)
-- Name: sale_operations_ref id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_operations_ref ALTER COLUMN id SET DEFAULT nextval('public.sale_operations_ref_id_seq'::regclass);


--
-- TOC entry 3545 (class 2604 OID 16797)
-- Name: screening_basket_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_basket_history ALTER COLUMN id SET DEFAULT nextval('public.screening_basket_history_id_seq'::regclass);


--
-- TOC entry 3547 (class 2604 OID 16805)
-- Name: screening_destination_baskets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_destination_baskets ALTER COLUMN id SET DEFAULT nextval('public.screening_destination_baskets_id_seq'::regclass);


--
-- TOC entry 3595 (class 2604 OID 393241)
-- Name: screening_impact_analysis id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_impact_analysis ALTER COLUMN id SET DEFAULT nextval('public.screening_impact_analysis_id_seq'::regclass);


--
-- TOC entry 3550 (class 2604 OID 16816)
-- Name: screening_lot_references id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_lot_references ALTER COLUMN id SET DEFAULT nextval('public.screening_lot_references_id_seq'::regclass);


--
-- TOC entry 3552 (class 2604 OID 16824)
-- Name: screening_operations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_operations ALTER COLUMN id SET DEFAULT nextval('public.screening_operations_id_seq'::regclass);


--
-- TOC entry 3555 (class 2604 OID 16835)
-- Name: screening_source_baskets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_source_baskets ALTER COLUMN id SET DEFAULT nextval('public.screening_source_baskets_id_seq'::regclass);


--
-- TOC entry 3559 (class 2604 OID 16845)
-- Name: selection_basket_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_basket_history ALTER COLUMN id SET DEFAULT nextval('public.selection_basket_history_id_seq'::regclass);


--
-- TOC entry 3561 (class 2604 OID 16853)
-- Name: selection_destination_baskets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_destination_baskets ALTER COLUMN id SET DEFAULT nextval('public.selection_destination_baskets_id_seq'::regclass);


--
-- TOC entry 3563 (class 2604 OID 16863)
-- Name: selection_lot_references id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_lot_references ALTER COLUMN id SET DEFAULT nextval('public.selection_lot_references_id_seq'::regclass);


--
-- TOC entry 3565 (class 2604 OID 16871)
-- Name: selection_source_baskets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_source_baskets ALTER COLUMN id SET DEFAULT nextval('public.selection_source_baskets_id_seq'::regclass);


--
-- TOC entry 3626 (class 2604 OID 786489)
-- Name: selection_task_assignments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_task_assignments ALTER COLUMN id SET DEFAULT nextval('public.selection_task_assignments_id_seq'::regclass);


--
-- TOC entry 3624 (class 2604 OID 786468)
-- Name: selection_task_baskets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_task_baskets ALTER COLUMN id SET DEFAULT nextval('public.selection_task_baskets_id_seq'::regclass);


--
-- TOC entry 3619 (class 2604 OID 786449)
-- Name: selection_tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_tasks ALTER COLUMN id SET DEFAULT nextval('public.selection_tasks_id_seq'::regclass);


--
-- TOC entry 3567 (class 2604 OID 16879)
-- Name: selections id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selections ALTER COLUMN id SET DEFAULT nextval('public.selections_id_seq'::regclass);


--
-- TOC entry 3570 (class 2604 OID 16890)
-- Name: sgr id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sgr ALTER COLUMN id SET DEFAULT nextval('public.sgr_id_seq'::regclass);


--
-- TOC entry 3572 (class 2604 OID 16900)
-- Name: sgr_giornalieri id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sgr_giornalieri ALTER COLUMN id SET DEFAULT nextval('public.sgr_giornalieri_id_seq'::regclass);


--
-- TOC entry 3587 (class 2604 OID 352260)
-- Name: sgr_per_taglia id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sgr_per_taglia ALTER COLUMN id SET DEFAULT nextval('public.sgr_per_taglia_id_seq'::regclass);


--
-- TOC entry 3573 (class 2604 OID 16909)
-- Name: sizes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sizes ALTER COLUMN id SET DEFAULT nextval('public.sizes_id_seq'::regclass);


--
-- TOC entry 3574 (class 2604 OID 16920)
-- Name: sync_status id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_status ALTER COLUMN id SET DEFAULT nextval('public.sync_status_id_seq'::regclass);


--
-- TOC entry 3580 (class 2604 OID 16936)
-- Name: target_size_annotations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.target_size_annotations ALTER COLUMN id SET DEFAULT nextval('public.target_size_annotations_id_seq'::regclass);


--
-- TOC entry 3616 (class 2604 OID 786436)
-- Name: task_operators id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_operators ALTER COLUMN id SET DEFAULT nextval('public.task_operators_id_seq'::regclass);


--
-- TOC entry 3583 (class 2604 OID 16947)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3955 (class 0 OID 16479)
-- Dependencies: 216
-- Data for Name: advanced_sales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.advanced_sales (id, sale_number, customer_id, customer_name, customer_details, sale_date, status, total_weight, total_animals, total_bags, notes, pdf_path, ddt_id, ddt_status, created_at, updated_at, company_id) FROM stdin;
\.


--
-- TOC entry 3957 (class 0 OID 16493)
-- Dependencies: 218
-- Data for Name: bag_allocations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bag_allocations (id, sale_bag_id, source_operation_id, source_basket_id, allocated_animals, allocated_weight, source_animals_per_kg, source_size_code) FROM stdin;
\.


--
-- TOC entry 4043 (class 0 OID 393228)
-- Dependencies: 304
-- Data for Name: basket_growth_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.basket_growth_profiles (id, basket_id, analysis_run_id, growth_cluster, sgr_deviation, confidence_score, influencing_factors, position_score, density_score, supplier_score, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3959 (class 0 OID 16502)
-- Dependencies: 220
-- Data for Name: basket_lot_composition; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.basket_lot_composition (id, basket_id, cycle_id, lot_id, animal_count, percentage, source_selection_id, created_at, notes) FROM stdin;
\.


--
-- TOC entry 3961 (class 0 OID 16512)
-- Dependencies: 222
-- Data for Name: baskets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.baskets (id, physical_number, flupsy_id, cycle_code, state, current_cycle_id, nfc_data, "row", "position", nfc_last_programmed_at) FROM stdin;
24	4	1012	\N	available	\N	\N	DX	4	\N
25	5	1012	\N	available	\N	\N	DX	5	\N
26	6	1012	\N	available	\N	\N	DX	6	\N
27	7	1012	\N	available	\N	\N	DX	7	\N
28	8	1012	\N	available	\N	\N	DX	8	\N
29	9	1012	\N	available	\N	\N	DX	9	\N
30	10	1012	\N	available	\N	\N	DX	10	\N
31	11	1012	\N	available	\N	\N	SX	1	\N
32	12	1012	\N	available	\N	\N	SX	2	\N
33	13	1012	\N	available	\N	\N	SX	3	\N
34	14	1012	\N	available	\N	\N	SX	4	\N
35	15	1012	\N	available	\N	\N	SX	5	\N
36	16	1012	\N	available	\N	\N	SX	6	\N
37	17	1012	\N	available	\N	\N	SX	7	\N
38	18	1012	\N	available	\N	\N	SX	8	\N
39	19	1012	\N	available	\N	\N	SX	9	\N
40	20	1012	\N	available	\N	\N	SX	10	\N
41	1	1036	\N	available	\N	\N	DX	1	\N
42	2	1036	\N	available	\N	\N	DX	2	\N
43	3	1036	\N	available	\N	\N	DX	3	\N
44	4	1036	\N	available	\N	\N	DX	4	\N
45	5	1036	\N	available	\N	\N	DX	5	\N
46	6	1036	\N	available	\N	\N	DX	6	\N
47	7	1036	\N	available	\N	\N	DX	7	\N
48	8	1036	\N	available	\N	\N	DX	8	\N
49	9	1036	\N	available	\N	\N	DX	9	\N
50	10	1036	\N	available	\N	\N	DX	10	\N
51	11	1036	\N	available	\N	\N	SX	1	\N
52	12	1036	\N	available	\N	\N	SX	2	\N
53	13	1036	\N	available	\N	\N	SX	3	\N
54	14	1036	\N	available	\N	\N	SX	4	\N
55	15	1036	\N	available	\N	\N	SX	5	\N
56	16	1036	\N	available	\N	\N	SX	6	\N
57	17	1036	\N	available	\N	\N	SX	7	\N
58	18	1036	\N	available	\N	\N	SX	8	\N
59	19	1036	\N	available	\N	\N	SX	9	\N
60	20	1036	\N	available	\N	\N	SX	10	\N
68	8	1037	\N	available	\N	\N	SX	3	\N
69	9	1037	\N	available	\N	\N	SX	4	\N
70	10	1037	\N	available	\N	\N	SX	5	\N
72	2	1038	\N	available	\N	\N	DX	2	\N
73	3	1038	\N	available	\N	\N	DX	3	\N
74	4	1038	\N	available	\N	\N	DX	4	\N
75	5	1038	\N	available	\N	\N	DX	5	\N
76	6	1038	\N	available	\N	\N	DX	6	\N
77	7	1038	\N	available	\N	\N	DX	7	\N
78	8	1038	\N	available	\N	\N	DX	8	\N
79	9	1038	\N	available	\N	\N	DX	9	\N
80	10	1038	\N	available	\N	\N	DX	10	\N
81	11	1038	\N	available	\N	\N	SX	1	\N
82	12	1038	\N	available	\N	\N	SX	2	\N
83	13	1038	\N	available	\N	\N	SX	3	\N
84	14	1038	\N	available	\N	\N	SX	4	\N
85	15	1038	\N	available	\N	\N	SX	5	\N
86	16	1038	\N	available	\N	\N	SX	6	\N
87	17	1038	\N	available	\N	\N	SX	7	\N
88	18	1038	\N	available	\N	\N	SX	8	\N
89	19	1038	\N	available	\N	\N	SX	9	\N
90	20	1038	\N	available	\N	\N	SX	10	\N
91	1	1039	\N	available	\N	\N	DX	1	\N
92	2	1039	\N	available	\N	\N	DX	2	\N
93	3	1039	\N	available	\N	\N	DX	3	\N
94	4	1039	\N	available	\N	\N	DX	4	\N
95	5	1039	\N	available	\N	\N	DX	5	\N
96	6	1039	\N	available	\N	\N	DX	6	\N
97	7	1039	\N	available	\N	\N	DX	7	\N
98	8	1039	\N	available	\N	\N	DX	8	\N
99	9	1039	\N	available	\N	\N	DX	9	\N
100	10	1039	\N	available	\N	\N	DX	10	\N
101	11	1039	\N	available	\N	\N	SX	1	\N
102	12	1039	\N	available	\N	\N	SX	2	\N
103	13	1039	\N	available	\N	\N	SX	3	\N
104	14	1039	\N	available	\N	\N	SX	4	\N
105	15	1039	\N	available	\N	\N	SX	5	\N
106	16	1039	\N	available	\N	\N	SX	6	\N
107	17	1039	\N	available	\N	\N	SX	7	\N
108	18	1039	\N	available	\N	\N	SX	8	\N
109	19	1039	\N	available	\N	\N	SX	9	\N
110	20	1039	\N	available	\N	\N	SX	10	\N
65	5	1037	5-1037-2511	active	8	basket-65-1762498386822	DX	5	2025-11-07 06:53:06.823
66	6	1037	6-1037-2511	active	9	basket-66-1762498404221	SX	1	2025-11-07 06:53:24.222
67	7	1037	7-1037-2511	active	10	basket-67-1762498430726	SX	2	2025-11-07 06:53:50.726
71	1	1038	1-1038-2511	active	11	\N	DX	1	\N
21	1	1012	1-1012-2511	active	1	\N	DX	1	\N
22	2	1012	2-1012-2511	active	2	\N	DX	2	\N
23	3	1012	3-1012-2511	active	3	\N	DX	3	\N
61	1	1037	1-1037-2511	active	4	basket-61-1762498218572	DX	1	2025-11-07 06:50:18.572
62	2	1037	2-1037-2511	active	5	basket-62-1762498314093	DX	2	2025-11-07 06:51:54.093
63	3	1037	3-1037-2511	active	6	basket-63-1762498335548	DX	3	2025-11-07 06:52:15.548
64	4	1037	4-1037-2511	active	7	basket-64-1762498358882	DX	4	2025-11-07 06:52:38.882
\.


--
-- TOC entry 3963 (class 0 OID 16522)
-- Dependencies: 224
-- Data for Name: clienti; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clienti (id, denominazione, indirizzo, comune, cap, provincia, paese, email, telefono, piva, codice_fiscale, fatture_in_cloud_id, attivo, created_at, updated_at) FROM stdin;
6	Azienda AGROZOOTECNICA ZAPPINO s.s.		Sannicandro Garganico	71015	FG	Italia			03788880718	N/A	\N	t	2025-10-30 09:46:10.133707	\N
17	CAZZOLA ROSOLINO		Gorino	44020	FE	Italia	coopadriatica@libero.it		01556750386	N/A	\N	t	2025-10-30 09:46:26.579069	\N
32	Cooperativa Amica		Goro	44020	FE	Italia				N/A	\N	t	2025-10-30 09:46:49.150757	\N
51	Fratelli & Cognati soc. agr.		Chioggia	30015	VE	Italia				N/A	\N	t	2025-10-30 09:47:20.850157	\N
41	Crivellari Marco		Rosolina	45010	RO	Italia	coop.rosolina@tiscalinet.it		01452270299	N/A	\N	t	2025-10-30 09:47:04.465065	\N
42	Delta Nord		Rosolina			Italia	consorziodeltanord@libero.it			N/A	\N	t	2025-10-30 09:47:05.75711	\N
39	Cooperativa Sole Soc. Coop. agricola		GORO	44020	FE	Italia	deltadec@deltaced.it,paganinipaolo@gmail.com		02153890385	N/A	\N	t	2025-10-30 09:47:01.382536	2025-11-03 10:40:38.78
47	Fabbris Angelo		Chioggia	30015	VE	Italia				N/A	\N	t	2025-10-30 09:47:14.6321	\N
48	Falconi Paride		Rosolina	45010	RO	Italia	coop.rosolina@tiscalinet.it		01211310295	N/A	\N	t	2025-10-30 09:47:16.508753	\N
54	GORO PESCA srl		Goro	44020	FE	Italia	info@goropesca.it		00479450389	N/A	\N	t	2025-10-30 09:47:25.771303	\N
56	Grossato Mirco		Rosolina	45010	RO	Italia			01353390299	N/A	\N	t	2025-10-30 09:47:28.967999	\N
2	ALBA Società cooperativa		Rosolina RO, Italia	45010	RO	Italia			IT01187870298	N/A	\N	t	2025-10-30 09:46:04.416619	2025-11-03 10:40:22.279
5	Aurora SSA		Goro	44020	FE	Italia	aurorasoc3@gmail.com		02086280381	N/A	\N	t	2025-10-30 09:46:08.583434	2025-11-03 10:40:23.444
7	Azzalin Celestino		Porto Viro	45014	RO	Italia	criscele@icloud.com		01498140290	N/A	\N	t	2025-10-30 09:46:11.639188	2025-11-03 10:40:23.815
8	Barboni Franco		Mesola	44026	FE	Italia	nikcurvaovest74@gmail.com		01796430385	N/A	\N	t	2025-10-30 09:46:13.186773	2025-11-03 10:40:25.586
9	Bassa Marea Soc. Coop. Agricola		Goro	44020	FE	Italia	deltaced@deltaced.it		02137160384	N/A	\N	t	2025-10-30 09:46:14.690014	2025-11-03 10:40:25.898
10	BioClam		Rosolina	45010	RO	Italia	bioclam@pec.it		01531600292	N/A	\N	t	2025-10-30 09:46:16.23613	2025-11-03 10:40:26.213
11	BORDINA ALBERTO		Rosolina	45010	RO	Italia	bordina72@gmail.com		01345320293	N/A	\N	t	2025-10-30 09:46:17.729096	2025-11-03 10:40:26.569
12	Boscarato Alessandro		Rosolina	45010	RO	Italia			01034440295	N/A	\N	t	2025-10-30 09:46:19.740473	2025-11-03 10:40:27.174
13	BROS SOCIETA' SEMPLICE AGRICOLA		COMACCHIO	44022	FERRARA	Italia			01998490385	N/A	\N	t	2025-10-30 09:46:21.261715	2025-11-03 10:40:27.473
15	Cazzola Alessandro		Gorino	44020	FE	Italia	coopadriatica@libero.it		01623590385	N/A	\N	t	2025-10-30 09:46:24.30311	2025-11-03 10:40:28.19
16	Cazzola Paolo soc. Adriatica		Gorino FE, Italia	44020	FE	Italia			00971080387	N/A	\N	t	2025-10-30 09:46:25.0435	2025-11-03 10:40:28.238
18	Ceppa Società Semplice Agricola di Oselladore R.E. Bollini J.		Rosolina	45010	RO	Italia	ruggero977@gmail.com		01522020294	N/A	\N	t	2025-10-30 09:46:27.803368	2025-11-03 10:40:28.546
20	Consorzio Coop. Pescatori del Polesine OP soc coop		Porto Tolle	45018	RO	Italia	Avanzoveronica@consorzioscardovari.it		00224140293	N/A	\N	t	2025-10-30 09:46:31.992319	2025-11-03 10:40:30.367
21	Consorzio Delta Nord		Rosolina	45010	RO	Italia			01074500297	N/A	\N	t	2025-10-30 09:46:33.545294	2025-11-03 10:40:30.678
22	CONSORZIO MOLLUSCHICOLTORI VENETI		Rosolina RO, Italia	45010	ROVIGO	Italia			01477820292	N/A	\N	t	2025-10-30 09:46:34.286704	2025-11-03 10:40:30.727
23	Consorzio Pescatori di Goro Soc. Coop. OP		Goro	44020	FE	Italia	paola.gianella@copego.it,massimo.genari@copego.it		00040400384	N/A	\N	t	2025-10-30 09:46:35.87053	2025-11-03 10:40:31.088
25	Coop San Marco		Gorino	44020	FE	Italia	CoopSanMarco.b@gmail.com		01477960387	N/A	\N	t	2025-10-30 09:46:38.951598	2025-11-03 10:40:31.432
26	Coop Venere		Goro	44020	FE	Italia	g.trombini@libero.it		01738060381	N/A	\N	t	2025-10-30 09:46:40.521874	2025-11-03 10:40:31.775
27	Coop. Adriatica Gorino		Gorino FE, Italia	44020	FE	Italia	coopadriatica@libero.it		00423670389	N/A	\N	t	2025-10-30 09:46:41.263601	2025-11-03 10:40:31.821
28	Coop. La Vela		Goro	44020	FE	Italia	cooplavela@autlook.com		01227850383	N/A	\N	t	2025-10-30 09:46:43.262144	2025-11-03 10:40:32.183
30	Coop.Pescatori Volano scarl		Marano Lagunare	33050	UD	Italia	direzione@coopescasanvito.it		00386860308	N/A	\N	t	2025-10-30 09:46:46.354354	2025-11-03 10:40:32.498
33	Cooperativa Clodiense Bullo Stefano		Chioggia	30015	VE	Italia	pescatoriclodiense@libero.it		03271790275	N/A	\N	t	2025-10-30 09:46:50.642781	2025-11-03 10:40:32.82
34	Cooperativa del Mare		Goro	44020	FE	Italia	amministrazione@coopdelmare.it		00745110387	N/A	\N	t	2025-10-30 09:46:52.326166	2025-11-03 10:40:33.134
37	COOPERATIVA PESCATORI DI VOLANO - SOCIETA' COOPERATIVA		CODIGORO	44021	FE	Italia			01740080385	N/A	\N	t	2025-10-30 09:46:58.344862	2025-11-03 10:40:35.944
29	Cooperativa Pescatori Eridania srl		Porto Viro	45014	RO	Italia	info@eridania.191.it		00038310298	N/A	\N	t	2025-10-30 09:46:44.831426	2025-11-03 10:40:36.786
40	Cooperativa Pescatori Laghese Società Cooperativa ARL		Lagosanto	44023	FE	Italia	nicoletta.carlin@studio-duo.it		01356120384	N/A	\N	t	2025-10-30 09:47:02.87002	2025-11-03 10:40:37.507
38	Cooperativa S. ANTONIO Società Cooperativa		Goro	44020	FE	Italia	coopsantantonio@libero.it		01258950383	N/A	\N	t	2025-10-30 09:46:59.896211	2025-11-03 10:40:38.483
43	Denodini Mar di Turri Thomas		Rosolina	45010	RO	Italia	denodinim@pec.it		01591170293	N/A	\N	t	2025-10-30 09:47:07.502051	2025-11-03 10:40:39.15
44	e-distribuzione SpA		Roma	00198	RM	Italia	alessandro.andreani@enel.com		15844561009	N/A	\N	t	2025-10-30 09:47:08.979362	2025-11-03 10:40:40.257
46	Ephelia soc. semplice		Gorino	44020	FE	Italia	tagliaticelestino@gmail.com		01746090388	N/A	\N	t	2025-10-30 09:47:13.337913	2025-11-03 10:40:41.488
49	Felletti Andrea		Mesola	44026	FE	Italia	carlo.trombini1986@libero.it		01990650382	N/A	\N	t	2025-10-30 09:47:18.001924	2025-11-03 10:40:41.847
50	Felletti Michela		Chioggia	30015	VE	Italia	zennaromanuel@libero.it		04246560272	N/A	\N	t	2025-10-30 09:47:19.474329	2025-11-03 10:40:42.171
24	Filippo Conventi		Goro	44020	FE	Italia	filippoconventi19@g.mail.com		01368760383	N/A	\N	t	2025-10-30 09:46:37.461053	2025-11-03 10:40:42.758
52	Gatti Michele		Chioggia	30015	VE	Italia	bischeroa@yahoo.it		03455450274	N/A	\N	t	2025-10-30 09:47:22.485173	2025-11-03 10:40:43.609
53	Gelli Maria Elena		Comacchio	44022	FE	Italia	felletti83@gmail.com		02013320383	N/A	\N	t	2025-10-30 09:47:24.118745	2025-11-03 10:40:44.083
55	GROBOS SOCIETA' COOPERATIVA		ROSOLINA	45010	RO	Italia			01194430292	N/A	\N	t	2025-10-30 09:47:27.312389	2025-11-03 10:40:44.957
57	I Simpson Soc. Cooperativa		Corbola	45015	RO	Italia	fratelliecognati@gmail.com		01548860293	N/A	\N	t	2025-10-30 09:47:30.586776	2025-11-03 10:40:45.317
58	LA BUSSOLA - SOCIETA' COOPERATIVA		GORO	44020	FE	Italia	labussolagoro@tiscali.it		01654200383	N/A	\N	t	2025-10-30 09:47:32.078473	2025-11-03 10:40:45.614
31	Alba Nuova Cooperativa a mutualità prevalente		Goro	44020	FE	Italia	alba.nuova@libero.it,albanuova.coop@libero.it		01952290383	N/A	\N	t	2025-10-30 09:46:47.918501	2025-11-03 10:40:22.232
3	Albarella soc. Coop.		Rosolina RO, Italia	45010	RO	Italia			00942980293	N/A	\N	t	2025-10-30 09:46:05.156477	2025-11-03 10:40:22.325
4	Apollo soc.coop.arl		Goro	44020	FE	Italia	riccisound@gmail.com		01484940380	N/A	\N	t	2025-10-30 09:46:06.950538	2025-11-03 10:40:23.114
19	Spinadin Pesca					Italia			00000000000	N/A	\N	t	2025-10-30 09:46:29.859005	2025-11-03 10:41:05.258
61	LA PASSERA Soc. Coop. a.r.l.		Rosolina	45010	RO	Italia			03465620270	N/A	\N	t	2025-10-30 09:47:35.850218	\N
73	Naldi Gabriele		Rosolina	45010	RO	Italia	coop.rosolina@tiscalinet.it		01211390297	N/A	\N	t	2025-10-30 09:47:53.947492	\N
75	PARALOVO ANDREA		GORO	44020	FE	Italia			01861610382	N/A	\N	t	2025-10-30 09:47:58.528606	\N
76	PASSARELLA ANDREA		GORO	44020	FE	Italia			01397850387	N/A	\N	t	2025-10-30 09:48:00.011184	\N
80	PROAMEIXA FERNÁNDEZ, S.L.		Rianxo	15985	A Coruña	Spagna	info@proameixa.com		ESB70015821	N/A	\N	t	2025-10-30 09:48:06.877384	\N
85	SAN PIETRO S.C.A.R.L.		Comacchio	44022	FE	Italia	sanpietro.pozzati@gmail.com		01513320380	N/A	\N	t	2025-10-30 09:48:15.31495	\N
86	SANGIA' SOCIETA' COOPERATIVA		GORO	44020	FE	Italia	anghe965@gmail.com		02055560383	N/A	\N	t	2025-10-30 09:48:16.859319	\N
90	Soc. Agri Smeraldo		Porto Viro	45014	RO	Italia				N/A	\N	t	2025-10-30 09:48:22.663717	\N
92	Soc. Agricola ORO DEL DELTA s.s. di Vaccari Lorenzo & C.		Porto Viro	45014	RO	Italia			01578080291	N/A	\N	t	2025-10-30 09:48:25.782974	\N
84	San Marco società cooperativa		Pomezia	71	RM	Italia	dantoni_sandro@hotmail.it		14512451007	N/A	\N	t	2025-10-30 09:48:13.759899	2025-11-03 10:40:55.113
98	Società agricola Delta Futuro srl		Goro	44020	FE	Italia	deltafuturo.goro@gmail.com		02057710382	N/A	\N	t	2025-10-30 09:48:35.423235	\N
68	MARTIN JONNI		Rosolina RO, Italia	45010	ROVIGO	Italia			01334030291	N/A	\N	t	2025-10-30 09:47:45.85679	2025-11-03 10:40:48.711
102	Società cooperativa agricola San Rocco		Goro	44020	FE	Italia			02118120381	N/A	\N	t	2025-10-30 09:48:42.815818	\N
104	società cooperativa Pesca		Goro	44020	FE	Italia				N/A	\N	t	2025-10-30 09:48:45.857843	\N
105	SOCIETA' AGRICOLA SEALBA 2 S.S.		CHIOGGIA	30015	VE	Italia			04767040274	N/A	\N	t	2025-10-30 09:48:47.341741	\N
107	SOCIETA' COOPERATIVA PECSATORI SANTA GIULIA		PORTO TOLLE	45018	RO	Italia	coop.santagiulia@libero.it		01158780294	N/A	\N	t	2025-10-30 09:48:50.425368	\N
69	Milani Nicola		Gorino	44020	FE	Italia	coopadriatica@libero.it		01147900383	N/A	\N	t	2025-10-30 09:47:47.399801	2025-11-03 10:40:49.025
63	Cooperativa LA ROMANINA Soc. Coop. arl		Mesola	44026	FE	Italia	cooplaromanina@gmail.com		01427580384	N/A	\N	t	2025-10-30 09:47:39.154878	2025-11-03 10:40:34.135
96	Cooperativa Pesca Soc.Coop.		Goro	44020	FE	Italia	coopvolano@lamiapec.it		01743670380	N/A	\N	t	2025-10-30 09:48:31.041367	2025-11-03 10:40:35.281
59	LA FENICE SOC COOP ARL		Bosco Mesola FE, Italia	44026	Ferrara	Italia	cooplafenice11@legalmail.it		01885870384	N/A	\N	t	2025-10-30 09:47:32.821618	2025-11-03 10:40:45.66
60	La Laguna		Goro	44020	FE	Italia			01816190381	N/A	\N	t	2025-10-30 09:47:34.349334	2025-11-03 10:40:45.949
62	La Perla Nera Società Semplice Agricola		Chioggia	30015	VE	Italia			04262250279	N/A	\N	t	2025-10-30 09:47:37.414851	2025-11-03 10:40:46.549
65	La Valle società Coopertiva		Comacchio (FE)	44022	FE	Italia	irene.rizzardi@gmail.com		14355303389	N/A	\N	t	2025-10-30 09:47:42.122399	2025-11-03 10:40:47.168
66	LA VERACE Società Cooperativa		Goro	44020	Ferrara	Italia	coop.laverace@virgilio.it		01877390383	N/A	\N	t	2025-10-30 09:47:43.610378	2025-11-03 10:40:47.456
70	Milani Vittorio		Gorino	44020	FE	Italia	coopadriatica@libero.it		01078860382	N/A	\N	t	2025-10-30 09:47:49.345709	2025-11-03 10:40:49.316
71	Miracoli soc agr		Goro	44020	FE	Italia	raffaelecazzola84@gmail.com		01893940385	N/A	\N	t	2025-10-30 09:47:50.922424	2025-11-03 10:40:49.635
72	Moceniga Pesca S.S.		Rosolina	45010	RO	Italia	moceniga@libero.it		01082120294	N/A	\N	t	2025-10-30 09:47:52.45688	2025-11-03 10:40:49.921
74	Nuova Levante S.s.		Comacchio	44022	FE	Italia	snc.alberi@gmail.com		01729020386	N/A	\N	t	2025-10-30 09:47:57.053476	2025-11-03 10:40:51.291
77	POLESINE CONSULTING S.R.L.		PORTO VIRO	45014	RO	Italia			01613480290	N/A	\N	t	2025-10-30 09:48:01.504771	2025-11-03 10:40:51.94
78	Poseidonia s.s. soc.agr. di Meloni Fulvio e Zennaro Manuel		Porto Tolle	45018	RO	Italia	criscele@icloud.com		01490310297	N/A	\N	t	2025-10-30 09:48:03.502241	2025-11-03 10:40:52.837
79	Poseidonia soc. agricola		CHIOGGIA	30015	VE	Italia			05081120288	N/A	\N	t	2025-10-30 09:48:05.064932	2025-11-03 10:40:53.785
81	REAMAR soc. coop.arl		Comacchio	44022	FE	Italia			01996720387	N/A	\N	t	2025-10-30 09:48:08.415504	2025-11-03 10:40:54.153
87	SERENISSIMA PESCA SOC COOP		ROSOLINA	45010	ROVIGO	Italia			02925260271	N/A	\N	t	2025-10-30 09:48:18.350139	2025-11-03 10:40:56.166
88	Soc Coop Poseidone		Rosolina	45010	RO	Italia			01251320295	N/A	\N	t	2025-10-30 09:48:19.90363	2025-11-03 10:40:57.842
89	Soc cooperativa Rosa dei Venti		Goro	44020	FE	Italia	rosadeiventi3@gmail.com		01257010387	N/A	\N	t	2025-10-30 09:48:21.429816	2025-11-03 10:40:58.515
93	Soc. Agricola Scanno di Tironi Giuseppe		Limena	35010	PD	Italia			03407720287	N/A	\N	t	2025-10-30 09:48:27.310545	2025-11-03 10:40:59.784
67	MAGI soc coop semplice		Bosco Mesola	44046	RO	Italia	mgib@mgib.it		02081590388	N/A	\N	t	2025-10-30 09:47:45.114766	2025-11-03 10:40:48.366
82	REGINA SOC. AGRICOLA S.S.		Ariano nel Polesine	45012	RO	Italia	modena.riccardo@gmail.com		01569590290	N/A	\N	t	2025-10-30 09:48:09.945435	2025-11-03 10:40:54.473
83	RO.MA.MAR Società Cooperativa a.r.l		Goro	44020	FE	Italia	ro.ma.mar.goro@gmail.com		01575130388	N/A	\N	t	2025-10-30 09:48:12.128947	2025-11-03 10:40:54.825
117	ZANELLATI VALERIA		Goro	44020	FE	Italia	filippoconventi19@gmail.com		02002050389	N/A	\N	t	2025-10-30 09:49:11.374724	\N
125	San Pietro S.C.A.R.L.		Comacchio	44022	FE	Italia	sanpietro.pozzati@gmail.com		IT01513320380	N/A	\N	t	2025-10-31 16:46:01.046533	2025-11-03 10:40:55.452
94	soc. coop. Marinetta		Taglio di Po RO, Italia	45019	RO	Italia			01284160296	N/A	\N	t	2025-10-30 09:48:28.05257	2025-11-03 10:40:59.83
95	Soc.Agr.Alma pesca ss		Rosolina	45010	RO	Italia	coop.rosolina@gmail.com		00750250292	N/A	\N	t	2025-10-30 09:48:29.544791	2025-11-03 10:41:00.272
97	SOC.COOPERATIVA GORINO		GORO	44020	FE	Italia			01218150389	N/A	\N	t	2025-10-30 09:48:32.519715	2025-11-03 10:41:00.853
91	Societa agr. Alissa s.s.		Porto Viro	45014	RO	Italia	agricolafratellicavallari@gmail.com		01571890290	N/A	\N	t	2025-10-30 09:48:24.250979	2025-11-03 10:41:01.433
99	società agricola Kappa s.s. di Varagnolo Maurizio e C.		Padova	35121	PD	Italia			05020560289	N/A	\N	t	2025-10-30 09:48:36.964566	2025-11-03 10:41:01.836
100	Società agricola Moceniga Pesca s.s		Chioggia	30015	VE	Italia	robertopenzo832@yahoo.it		04443240272	N/A	\N	t	2025-10-30 09:48:38.517866	2025-11-03 10:41:02.261
103	Società Cooperativa ALBATROS		Goro	44020	FE	Italia	beppemicali73@gmail.com		01706620380	N/A	\N	t	2025-10-30 09:48:44.534885	2025-11-03 10:41:02.557
45	SOCIETA' AGRICOLA ECOTAPES SRL		Chioggia	30015	VE	Italia	ecotapes.2020@gmail.com		04621060278	N/A	\N	t	2025-10-30 09:47:10.535324	2025-11-03 10:41:02.867
106	SOCIETA' AGRICOLA TIRRENA		PORTO VIRO	45014	ROVIGO	Italia	società.agricola@legalmail.it		00305250292	N/A	\N	t	2025-10-30 09:48:48.877062	2025-11-03 10:41:03.404
101	SOCIETA' COOPERATIVA ACQUAVIVA		Comacchio	44022	FE	Italia	massimoballarinidec@libero.it		01841330382	N/A	\N	t	2025-10-30 09:48:41.257111	2025-11-03 10:41:03.7
1	ACUINUGA Aquacoltura Nutricion de Galizia		Bertamiráns, A Coruña, Spagna	15220	A Coruna	Spagna	tecnico@acuinuga.com		B70089750	N/A	\N	t	2025-10-30 09:46:03.663007	2025-11-03 10:40:21.794
14	CAM Conservificio Allevatori Molluschi srl		Chioggia	30015	VE	Italia	molluschi@camittico.it		00182700278	N/A	\N	t	2025-10-30 09:46:22.757775	2025-11-03 10:40:27.821
118	CLAMS SOCIETA' COOPERATIVA		GORO	44020	FE	Italia			01592850380	N/A	\N	t	2025-10-31 16:44:48.153707	2025-11-03 10:40:29.368
108	SOL LEVANTE - SOCIETA' COOPERATIVA		Goro	44020	FE	Italia	coopsollevante@gmail.com		01924210386	N/A	\N	t	2025-10-30 09:48:51.940235	2025-11-03 10:41:03.989
126	Stichting zeeschelp		KAMPERLAND	04493	EE	Paesi Bassi			NL813730089B	N/A	\N	t	2025-10-31 16:46:25.462395	2025-11-03 10:41:05.581
36	COOPERATIVA PESCATORI DEL DELTA - SOCIETA' COOPERATIVA		GORO	44020	FE	Italia	cooppescatorideldelta@virgilio.it		01123310383	N/A	\N	t	2025-10-30 09:46:56.863072	2025-11-03 10:40:35.554
119	Ecotapes Zeeland B.V.		Kamperland	4493	Nederland	Paesi Bassi	ecotapes.zeeland@gmail.com		NL862293832B01	N/A	\N	t	2025-10-31 16:45:15.868223	2025-11-03 10:40:41.156
121	Felletti Michela		Comacchio	44022	FE	Italia	felletti83@gmail.com		02027370382	N/A	\N	t	2025-10-31 16:45:26.387804	2025-11-03 10:40:42.464
120	Gloria Pesca S.S.A.		Porto Viro	45014	RO	Italia	martin85@libero.it		01481390290	N/A	\N	t	2025-10-31 16:45:24.902112	2025-11-03 10:40:44.381
64	LA SACCA SOC. COOPERATIVA		Goro	44020	FE	Italia	cooplasacca@libero.it		01427440381	N/A	\N	t	2025-10-30 09:47:40.637544	2025-11-03 10:40:46.841
122	LE NOSTRANE ss		Chioggia	30015	VE	Italia			04581990274	N/A	\N	t	2025-10-31 16:45:38.876703	2025-11-03 10:40:48.072
123	MARCHIOL S.P.A.		RONCADE	31056	TV	Italia			01176110268	N/A	\N	t	2025-10-31 16:45:41.561303	2025-11-03 10:40:48.665
109	Tagliati Simone		Gorino	44020	FE	Italia	coopadriatica@libero.it		01277000384	N/A	\N	t	2025-10-30 09:48:54.717131	2025-11-03 10:41:05.854
35	NEW AGRICOLT Innovation soc agr srl		Mesola	44026	FE	Italia	delta@deltaced.it		01708360381	N/A	\N	t	2025-10-30 09:46:55.37506	2025-11-03 10:40:50.994
124	PICO PALLINO SOCIETA' A RESPONSABILITA' LIMITATA SEMPLIFICATA		REGGIO EMILIA	42121	RE	Italia			02585550359	N/A	\N	t	2025-10-31 16:45:51.088352	2025-11-03 10:40:51.574
110	Tiozzo Pagio Michael		CHIOGGIA	30015	VE	Italia			04618970273	N/A	\N	t	2025-10-30 09:48:56.266842	2025-11-03 10:41:06.446
111	Tosatti Andrea		Goro	44020	FE	Italia	andreatosatti@gmail.com		01626450389	N/A	\N	t	2025-10-30 09:48:58.920686	2025-11-03 10:41:06.734
112	Trombini Graziano		Bosco Mesola	44026	FE	Italia			00995820388	N/A	\N	t	2025-10-30 09:49:00.475641	2025-11-03 10:41:07.006
113	Trombini Silvana		Goro	44020	FE	Italia	morgan.turri@alice.it		01881110389	N/A	\N	t	2025-10-30 09:49:01.967711	2025-11-03 10:41:07.922
127	TURGIAMAR SOC. COOP.		Goro	44020	FE	Italia	studiofabianicinti@virgilio.it		01627470386	N/A	\N	t	2025-10-31 16:46:33.080311	2025-11-03 10:41:08.328
114	VENUS - SOC. COOP.		GORO	44020	FE	Italia	coopvenusgoro@gmail.com		01252330384	N/A	\N	t	2025-10-30 09:49:06.072993	2025-11-03 10:41:08.713
115	Vi.Effe ssa		Chioggia	30015	VE	Italia	alissasocagricola@libero.it		04125900276	N/A	\N	t	2025-10-30 09:49:08.169669	2025-11-03 10:41:09
116	Vongola viva Soc. Agricola - Stocco Daniele		Rosolina	45010	RO	Italia	segreteria@polesineconsulting.it		01470220292	N/A	\N	t	2025-10-30 09:49:09.832099	2025-11-03 10:41:09.753
\.


--
-- TOC entry 3965 (class 0 OID 16542)
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
-- TOC entry 3967 (class 0 OID 16555)
-- Dependencies: 228
-- Data for Name: cycles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cycles (id, basket_id, lot_id, start_date, end_date, state) FROM stdin;
1	21	1	2025-11-05	\N	active
2	22	2	2025-11-05	\N	active
3	23	3	2025-11-05	\N	active
4	61	5	2025-11-06	\N	active
5	62	5	2025-11-06	\N	active
6	63	4	2025-11-06	\N	active
7	64	4	2025-11-06	\N	active
8	65	4	2025-11-06	\N	active
9	66	4	2025-11-06	\N	active
10	67	5	2025-11-06	\N	active
11	71	10	2025-11-07	\N	active
\.


--
-- TOC entry 3969 (class 0 OID 16565)
-- Dependencies: 230
-- Data for Name: ddt; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ddt (id, numero, data, cliente_id, cliente_nome, cliente_indirizzo, cliente_citta, cliente_cap, cliente_provincia, cliente_piva, cliente_codice_fiscale, cliente_paese, company_id, mittente_ragione_sociale, mittente_indirizzo, mittente_cap, mittente_citta, mittente_provincia, mittente_partita_iva, mittente_codice_fiscale, mittente_telefono, mittente_email, mittente_logo_path, totale_colli, peso_totale, note, ddt_stato, fatture_in_cloud_id, fatture_in_cloud_numero, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3971 (class 0 OID 16579)
-- Dependencies: 232
-- Data for Name: ddt_righe; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ddt_righe (id, ddt_id, descrizione, quantita, unita_misura, prezzo_unitario, report_dettaglio_id, advanced_sale_id, sale_bag_id, basket_id, size_code, flupsy_name, created_at) FROM stdin;
\.


--
-- TOC entry 3973 (class 0 OID 16591)
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
-- TOC entry 3975 (class 0 OID 16603)
-- Dependencies: 236
-- Data for Name: external_customers_sync; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.external_customers_sync (id, external_id, customer_code, customer_name, customer_type, vat_number, tax_code, address, city, province, postal_code, country, phone, email, is_active, notes, synced_at, last_modified_external) FROM stdin;
147	4	4	ACUINUGA Aquacoltura Nutricion de Galizia	azienda	B70089750	B70089750					Spagna		tecnico@acuinuga.com	t	\N	2025-11-07 12:15:32.540933	\N
148	133	133	ALBA Società cooperativa	azienda	IT01187870298	01187870298					Italia			t	\N	2025-11-07 12:15:32.57137	\N
149	24	24	Alba Nuova Cooperativa a mutualità prevalente	azienda	01952290383	01952290383					Italia		alba.nuova@libero.it,albanuova.coop@libero.it	t	\N	2025-11-07 12:15:32.592708	\N
150	5	5	Albarella soc. Coop.	azienda	00942980293	00942980293					Italia			t	\N	2025-11-07 12:15:32.614022	\N
151	6	6	Apollo soc.coop.arl	azienda	01484940380	01484940380					Italia		riccisound@gmail.com	t	\N	2025-11-07 12:15:32.635419	\N
152	7	7	Aurora SSA	azienda	02086280381	02086280381					Italia		aurorasoc3@gmail.com	t	\N	2025-11-07 12:15:32.657083	\N
153	8	8	Azienda AGROZOOTECNICA ZAPPINO s.s.	azienda	03788880718	03788880718					Italia			t	\N	2025-11-07 12:15:32.678455	\N
154	9	9	Azzalin Celestino	azienda	01498140290	zzlcst74h30a059Y					Italia		criscele@icloud.com	t	\N	2025-11-07 12:15:32.699823	\N
155	158	158	BORDINA ALBERTO	azienda	01345320293	BRDLRT72M14G224B					Italia		bordina72@gmail.com	t	\N	2025-11-07 12:15:32.721315	\N
156	14	14	BROS SOCIETA SEMPLICE AGRICOLA	azienda	1998490385	1998490385	Piazza Vincenzino Folegatti, 22, 44022 Comacchio FE, Italia	COMACCHIO	FERRARA	44022	Italia		agricolabros@legalmail.it	t	\N	2025-11-07 12:15:32.743022	\N
157	135	135	BROS SOCIETA' SEMPLICE AGRICOLA	azienda	01998490385	01998490385					Italia			t	\N	2025-11-07 12:15:32.764544	\N
158	134	134	Barboni Franco	azienda	01796430385	brbfnc57l02f156u					Italia		nikcurvaovest74@gmail.com	t	\N	2025-11-07 12:15:32.785632	\N
159	210	210	Bassa Marea Soc. Coop. Agricola	azienda	02137160384	02137160384					Italia		deltaced@deltaced.it	t	\N	2025-11-07 12:15:32.806933	\N
160	11	11	BioClam	azienda	01531600292	01531600292					Italia		bioclam@pec.it	t	\N	2025-11-07 12:15:32.829025	\N
161	12	12	Bordina Alberto - Coop. La Passera	azienda	1345320293	1345320293	Via Venezia 87	Rosolina Mare	RO	45010	Italia		lapasssera@pec.it	t	Polesine consulting	2025-11-07 12:15:32.850395	\N
162	13	13	Boscarato Alessandro	azienda	01034440295	BSCLSN64C18H573H					Italia			t	\N	2025-11-07 12:15:32.871769	\N
163	15	15	CAM Conservificio Allevatori Molluschi srl	azienda	00182700278	00182700278					Italia		molluschi@camittico.it	t	\N	2025-11-07 12:15:32.893116	\N
164	170	170	CAZZOLA ROSOLINO	azienda	01556750386	CZZRLN56S12E107P					Italia		coopadriatica@libero.it	t	\N	2025-11-07 12:15:32.91627	\N
165	215	215	CLAMS SOCIETA' COOPERATIVA	azienda	01592850380	01592850380					Italia			t	\N	2025-11-07 12:15:32.938286	\N
166	125	125	CO.PE.GO.	azienda				GORO	ferr	44020	Italia			t		2025-11-07 12:15:32.959648	\N
167	138	138	CONSORZIO MOLLUSCHICOLTORI VENETI	azienda	01477820292	01477820292					Italia			t	\N	2025-11-07 12:15:32.981174	\N
168	28	28	COOPERATIVA PESCATORI DEL DELTA - SOCIETA COOPERATIVA	azienda	1123310383	1123310383	VIA BARCHESSA, 28	GORO	FE	44020	Italia	17119.47.00	cooppescatorideldelta@virgilio.it	t	\N	2025-11-07 12:15:33.002737	\N
169	164	164	COOPERATIVA PESCATORI DEL DELTA - SOCIETA' COOPERATIVA	azienda	01123310383	01123310383					Italia		cooppescatorideldelta@virgilio.it	t	\N	2025-11-07 12:15:33.024286	\N
170	145	145	COOPERATIVA PESCATORI DI VOLANO - SOCIETA' COOPERATIVA	azienda	01740080385	01740080385					Italia			t	\N	2025-11-07 12:15:33.045594	\N
171	166	166	COOPERATIVA SOLE SOCIETA’ COOPERATIVA AGRICOLA	azienda	  02153890385	  02153890385	VIA CESARE BATTISTI N. 114/1	GORO	FERRARA	44020	Italia	0533/996343	DELTACED@DELTACED.IT	t	 SDI: USAL8PV	2025-11-07 12:15:33.067111	\N
172	168	168	Cazzola Alessandro	azienda	01623590385	CZZLSN84T09C814W					Italia		coopadriatica@libero.it	t	\N	2025-11-07 12:15:33.089468	\N
173	159	159	Cazzola Paolo soc. Adriatica	azienda	00971080387	CZZPLA61T01E107T					Italia			t	\N	2025-11-07 12:15:33.111234	\N
174	16	16	Ceppa Società Semplice Agricola di Oselladore R.E. Bollini J.	azienda	01522020294	01522020294					Italia		ruggero977@gmail.com	t	\N	2025-11-07 12:15:33.132703	\N
175	216	216	Cliente da Assegnare	azienda	00000000000	00000000000					Italia			t	Cliente temporaneo per ordini importati da Fatture in Cloud senza cliente assegnato	2025-11-07 12:15:33.154341	\N
176	167	167	Consorzio Coop. Pescatori del Polesine OP soc coop	azienda	00224140293	00224140293					Italia		Avanzoveronica@consorzioscardovari.it	t	\N	2025-11-07 12:15:33.175876	\N
177	30	30	Consorzio Delta Nord	azienda	01074500297	01074500297					Italia			t	\N	2025-11-07 12:15:33.197412	\N
178	139	139	Consorzio Pescatori di Goro Soc. Coop. OP	azienda	00040400384	00040400384					Italia		paola.gianella@copego.it,massimo.genari@copego.it	t	\N	2025-11-07 12:15:33.21879	\N
179	19	19	Coop San Marco	azienda	01477960387	01477960387					Italia		CoopSanMarco.b@gmail.com	t	\N	2025-11-07 12:15:33.240268	\N
180	20	20	Coop Venere	azienda	01738060381	01738060381					Italia		g.trombini@libero.it	t	\N	2025-11-07 12:15:33.26185	\N
181	21	21	Coop. Adriatica Gorino	azienda	00423670389	82002630380					Italia		coopadriatica@libero.it	t	\N	2025-11-07 12:15:33.28373	\N
182	22	22	Coop. La Vela	azienda	01227850383	01227850383					Italia		cooplavela@autlook.com	t	\N	2025-11-07 12:15:33.305024	\N
183	33	33	Coop. Mare -Elena Maccapani	azienda	745110387	745110387	Via Ellis Paesanti 47	Gorino	FE	44020	Italia	533999898	coopmare@libero.it	t	cel 339 89 99 976	2025-11-07 12:15:33.32627	\N
184	140	140	Coop.Pescatori Volano scarl	azienda	00386860308	00386860308					Italia		direzione@coopescasanvito.it	t	\N	2025-11-07 12:15:33.347578	\N
185	141	141	Cooperativa Amica	azienda							Italia			t	\N	2025-11-07 12:15:33.368824	\N
186	25	25	Cooperativa Clodiense Bullo Stefano	azienda	03271790275	03271790275					Italia		pescatoriclodiense@libero.it	t	\N	2025-11-07 12:15:33.390032	\N
187	121	121	Cooperativa GORO & BOSCO	azienda	01708360381	01708360381					Italia		coopgorobosco@gmail.com	t	\N	2025-11-07 12:15:33.411631	\N
188	169	169	Cooperativa LA ROMANINA Soc. Coop. arl	azienda	01427580384	01427580384					Italia		cooplaromanina@gmail.com	t	\N	2025-11-07 12:15:33.43325	\N
189	143	143	Cooperativa Pesca Soc.Coop.	azienda	01743670380	01743670380					Italia		coopvolano@lamiapec.it	t	\N	2025-11-07 12:15:33.454921	\N
190	23	23	Cooperativa Pescatori Eridania srl	azienda	00038310298	00038310298					Italia		info@eridania.191.it	t	\N	2025-11-07 12:15:33.47645	\N
191	29	29	Cooperativa Pescatori Laghese Società Cooperativa ARL	azienda	01356120384	01356120384					Italia		nicoletta.carlin@studio-duo.it	t	\N	2025-11-07 12:15:33.497783	\N
192	147	147	Cooperativa S. ANTONIO Società Cooperativa	azienda	01258950383	01258950383					Italia		coopsantantonio@libero.it	t	\N	2025-11-07 12:15:33.519146	\N
193	211	211	Cooperativa Sole Soc. Coop. agricola	azienda	02153890385	02153890385					Italia		deltadec@deltaced.it,paganinipaolo@gmail.com	t	\N	2025-11-07 12:15:33.540381	\N
194	26	26	Cooperativa del Mare	azienda	00745110387	00745110387					Italia		amministrazione@coopdelmare.it	t	\N	2025-11-07 12:15:33.562281	\N
195	171	171	Crivellari Marco	azienda	01452270299	CRVMRC92E01L736C					Italia		coop.rosolina@tiscalinet.it	t	\N	2025-11-07 12:15:33.583426	\N
196	149	149	Delta Nord	azienda							Italia		consorziodeltanord@libero.it	t	\N	2025-11-07 12:15:33.605388	\N
197	31	31	Denodini Mar di Turri Thomas	azienda	01591170293	01591170293					Italia		denodinim@pec.it	t	\N	2025-11-07 12:15:33.627097	\N
198	151	151	Ecotapes Zeeland B.V.	azienda	NL862293832B01	NL862293832B01					Paesi Bassi		ecotapes.zeeland@gmail.com	t	\N	2025-11-07 12:15:33.648287	\N
199	152	152	Elena Maccapani	azienda							Italia		coopmare@libero.it;amministrazione@coopdelmare.it	t	\N	2025-11-07 12:15:33.670299	\N
200	34	34	Ephelia soc. semplice	azienda	01746090388	01746090388					Italia		tagliaticelestino@gmail.com	t	\N	2025-11-07 12:15:33.691783	\N
201	35	35	Fabbris Angelo	azienda							Italia			t	\N	2025-11-07 12:15:33.712874	\N
202	172	172	Falconi Paride	azienda	01211310295	FLCPRD66M24H573J					Italia		coop.rosolina@tiscalinet.it	t	\N	2025-11-07 12:15:33.734479	\N
203	36	36	Felletti Andrea	azienda	01990650382	01990650382					Italia		carlo.trombini1986@libero.it	t	\N	2025-11-07 12:15:33.755697	\N
204	37	37	Felletti Michela	azienda	04246560272	04246560272					Italia		zennaromanuel@libero.it	t	\N	2025-11-07 12:15:33.777	\N
205	18	18	Filippo Conventi	azienda	01368760383	CNVFPP78R19H620B					Italia		filippoconventi19@g.mail.com	t	\N	2025-11-07 12:15:33.798397	\N
206	153	153	Fratelli & Cognati soc. agr.	azienda							Italia			t	\N	2025-11-07 12:15:33.819893	\N
207	38	38	GORO PESCA srl	azienda	00479450389	00479450389					Italia		info@goropesca.it	t	\N	2025-11-07 12:15:33.84143	\N
208	39	39	GROBOS SOCIETA' COOPERATIVA	azienda	01194430292	01194430292					Italia			t	\N	2025-11-07 12:15:33.863689	\N
209	154	154	Gatti Michele	azienda	03455450274	fbbngl70s03c638y					Italia		bischeroa@yahoo.it	t	\N	2025-11-07 12:15:33.895538	\N
210	155	155	Gelli Maria Elena	azienda	02013320383	FLLNDR83B22c912T					Italia		felletti83@gmail.com	t	\N	2025-11-07 12:15:33.917258	\N
211	212	212	Gloria Pesca S.S.A.	azienda	01481390290	01481390290					Italia		martin85@libero.it	t	\N	2025-11-07 12:15:33.938592	\N
212	156	156	Goro &Bosco soc.coop.arl	azienda	02027370382	fllmhl87a64c814l					Italia		felletti83@gmail.com	t	\N	2025-11-07 12:15:33.959932	\N
213	173	173	Grossato Mirco	azienda	01353390299	01353390299					Italia			t	\N	2025-11-07 12:15:33.981218	\N
214	40	40	Grossato Mirco- soc. agr. La Passera	azienda	1353390299	1353390299	Via Zaffoni 14	Rosolina	RO	45010	Italia		lapasssera@pec.it	t	\N	2025-11-07 12:15:34.002429	\N
215	157	157	I Simpson Soc. Cooperativa	azienda	01548860293	01548860293					Italia		fratelliecognati@gmail.com	t	\N	2025-11-07 12:15:34.023896	\N
216	41	41	LA BUSSOLA - SOCIETA' COOPERATIVA	azienda	01654200383	01654200383					Italia		labussolagoro@tiscali.it	t	\N	2025-11-07 12:15:34.045606	\N
217	42	42	LA FENICE SOC COOP ARL	azienda	01885870384	01885870384					Italia		cooplafenice11@legalmail.it	t	\N	2025-11-07 12:15:34.067051	\N
218	44	44	LA PASSERA Soc. Coop. a.r.l.	azienda	03465620270	03465620270					Italia			t	\N	2025-11-07 12:15:34.088647	\N
219	46	46	LA ROMANINA Soc. Coop. arl	azienda	1427580384	1427580384	Via Biverare 77/a	Mesola	FE	44026	Italia	17091.43.00	cooplaromanina@gmail.com	t	\N	2025-11-07 12:15:34.110069	\N
220	174	174	LA SACCA SOC. COOPERATIVA	azienda	01427440381	01427440381					Italia		cooplasacca@libero.it	t	\N	2025-11-07 12:15:34.131623	\N
221	48	48	LA VERACE Società Cooperativa	azienda	01877390383	01877390383					Italia		coop.laverace@virgilio.it	t	\N	2025-11-07 12:15:34.156763	\N
222	205	205	LE NOSTRANE ss	azienda	04581990274	04581990274					Italia			t	\N	2025-11-07 12:15:34.178762	\N
223	43	43	La Laguna	azienda	01816190381	01816190381					Italia			t	\N	2025-11-07 12:15:34.20151	\N
224	45	45	La Perla Nera Società Semplice Agricola	azienda	04262250279	04262250279					Italia			t	\N	2025-11-07 12:15:34.222907	\N
225	130	130	La Sacca	azienda				GORO	Ferrara	44020	Italia			t		2025-11-07 12:15:34.244095	\N
226	47	47	La Valle società Coopertiva	azienda	14355303389	01435530389					Italia		irene.rizzardi@gmail.com	t	\N	2025-11-07 12:15:34.265555	\N
227	49	49	MAGI soc coop semplice	azienda	02081590388	02081590388					Italia		mgib@mgib.it	t	\N	2025-11-07 12:15:34.286943	\N
228	206	206	MARCHIOL S.P.A.	azienda	01176110268	01176110268					Italia			t	\N	2025-11-07 12:15:34.308088	\N
229	50	50	MARTIN JONNI	azienda	01334030291	MRTJNN74P10A059O					Italia			t	\N	2025-11-07 12:15:34.329275	\N
230	51	51	Milani Nicola	azienda	01147900383	MLNNCL72C06D548A					Italia		coopadriatica@libero.it	t	\N	2025-11-07 12:15:34.35101	\N
231	177	177	Milani Vittorio	azienda	01078860382	MLNVTR67P24E107C					Italia		coopadriatica@libero.it	t	\N	2025-11-07 12:15:34.372367	\N
232	52	52	Miracoli soc agr	azienda	01893940385	gllmln85l64g916p					Italia		raffaelecazzola84@gmail.com	t	\N	2025-11-07 12:15:34.393641	\N
233	53	53	Moceniga Pesca S.S.	azienda	01082120294	01082120294					Italia		moceniga@libero.it	t	\N	2025-11-07 12:15:34.415046	\N
234	54	54	NEW AGRICOLT Innovation soc agr srl	azienda	1708360381	1708360381	Via Corriera 1	Mesola	FE	44026	Italia	3486707567	delta@deltaced.it	t	\N	2025-11-07 12:15:34.436265	\N
235	178	178	Naldi Gabriele	azienda	01211390297	NLDGRL54E31C814T					Italia		coop.rosolina@tiscalinet.it	t	\N	2025-11-07 12:15:34.457608	\N
236	55	55	Nuova Levante S.s.	azienda	01729020386	01729020386					Italia		snc.alberi@gmail.com	t	\N	2025-11-07 12:15:34.478934	\N
237	179	179	PARALOVO ANDREA	azienda	01861610382	PRLNDR93T06C814P					Italia			t	\N	2025-11-07 12:15:34.501329	\N
238	56	56	PARALOVO ANDREA soci coop Adriatica	azienda	1861610382	PRLNDR93T06C814P	VIA GORINO, 115	GORO	FE	44020	Italia			t	\N	2025-11-07 12:15:34.522865	\N
239	180	180	PASSARELLA ANDREA	azienda	01397850387	PSSNDR79C26C912R					Italia			t	\N	2025-11-07 12:15:34.544441	\N
240	57	57	PASSARELLA ANDREA soci Coop Adriatica	azienda	1397850387	PSSNDR79C26C912R	VIA MARINAI D'ITALIA, 50	GORO	FE	44020	Italia			t	\N	2025-11-07 12:15:34.57062	\N
241	214	214	PICO PALLINO SOCIETA' A RESPONSABILITA' LIMITATA SEMPLIFICATA	azienda	02585550359	02585550359					Italia			t	\N	2025-11-07 12:15:34.592569	\N
242	131	131	PO	azienda							Italia			t		2025-11-07 12:15:34.613871	\N
243	58	58	POLESINE CONSULTING S.R.L.	azienda	01613480290	01613480290					Italia			t	\N	2025-11-07 12:15:34.635422	\N
244	60	60	PROAMEIXA FERNÁNDEZ, S.L.	azienda	ESB70015821	B70015821					Spagna		info@proameixa.com	t	\N	2025-11-07 12:15:34.656571	\N
245	182	182	Poseidonia s.s. soc.agr. di Meloni Fulvio e Zennaro Manuel	azienda	01490310297	01490310297					Italia		criscele@icloud.com	t	\N	2025-11-07 12:15:34.677972	\N
246	59	59	Poseidonia soc. agricola	azienda	05081120288	05081120288					Italia			t	\N	2025-11-07 12:15:34.699394	\N
247	61	61	REAMAR soc. coop.arl	azienda	01996720387	01996720387					Italia			t	\N	2025-11-07 12:15:34.720762	\N
248	62	62	REGINA SOC. AGRICOLA S.S.	azienda	01569590290	mdnrcr78d14c967m					Italia		modena.riccardo@gmail.com	t	\N	2025-11-07 12:15:34.741906	\N
249	183	183	RO.MA.MAR Società Cooperativa a.r.l	azienda	01575130388	01575130388					Italia		ro.ma.mar.goro@gmail.com	t	\N	2025-11-07 12:15:34.763019	\N
250	63	63	RO.MA:MAR Società Cooperativa a.r.l.	azienda	1575130388	1575130388	Via Nuova 58	Goro	FE	44020	Italia	3475824517	ro.ma.mar.goro@gmail.com	t	Tipo B - Zona C7 - Licenza n. 8641 del 30.04.2024	2025-11-07 12:15:34.78426	\N
251	184	184	SAN PIETRO S.C.A.R.L.	azienda	01513320380	01513320380					Italia		sanpietro.pozzati@gmail.com	t	\N	2025-11-07 12:15:34.805883	\N
252	65	65	SANGIA SOCIETA COOPERATIVA	azienda	2055560383	2055560383	VIA CESARE BATTISTI, 114/1	GORO	FE	44020	Italia			t	\N	2025-11-07 12:15:34.827414	\N
253	186	186	SANGIA' SOCIETA' COOPERATIVA	azienda	02055560383	02055560383					Italia		anghe965@gmail.com	t	\N	2025-11-07 12:15:34.848833	\N
254	66	66	SERENISSIMA PESCA SOC COOP	azienda	02925260271	02925260271					Italia			t	\N	2025-11-07 12:15:34.870123	\N
255	75	75	SOC.COOPERATIVA GORINO	azienda	01218150389	01218150389					Italia			t	\N	2025-11-07 12:15:34.891243	\N
256	163	163	SOCIETA' AGRICOLA ECOTAPES SRL	azienda	04621060278	04621060278					Italia		ecotapes.2020@gmail.com	t	\N	2025-11-07 12:15:34.917562	\N
257	194	194	SOCIETA' AGRICOLA SEALBA 2 S.S.	azienda	04767040274	04767040274					Italia			t	\N	2025-11-07 12:15:34.938998	\N
258	195	195	SOCIETA' AGRICOLA TIRRENA	azienda	00305250292	00305250292					Italia		società.agricola@legalmail.it	t	\N	2025-11-07 12:15:34.960489	\N
259	79	79	SOCIETA' COOPERATIVA ACQUAVIVA	azienda	01841330382	01841330382					Italia		massimoballarinidec@libero.it	t	\N	2025-11-07 12:15:34.98172	\N
260	124	124	SOCIETA' COOPERATIVA PESCATORI S.GIULIA	azienda	01158780294	01158780294					Italia			t	\N	2025-11-07 12:15:35.002997	\N
261	80	80	SOL LEVANTE - SOCIETA' COOPERATIVA	azienda	01924210386	01924210386					Italia		coopsollevante@gmail.com	t	\N	2025-11-07 12:15:35.024224	\N
262	64	64	San Marco società cooperativa	azienda	14512451007	14512451007					Italia		dantoni_sandro@hotmail.it	t	\N	2025-11-07 12:15:35.047504	\N
263	207	207	San Pietro S.C.A.R.L.	azienda	IT01513320380	IT01513320380					Italia		sanpietro.pozzati@gmail.com	t	\N	2025-11-07 12:15:35.068622	\N
264	67	67	Soc Coop Poseidone	azienda	01251320295	01251320295					Italia			t	\N	2025-11-07 12:15:35.090203	\N
265	68	68	Soc Coop SANT'ANTONIO	azienda	1258950383	1258950383	Via Ellis Paesanti n. 24	Goro	FE	44020	Italia	3334642867	coopsantantonio@libero.it	t	Codice allevamento: BFE1 sacca di Goro	2025-11-07 12:15:35.111922	\N
266	69	69	Soc cooperativa Rosa dei Venti	azienda	01257010387	01257010387					Italia		rosadeiventi3@gmail.com	t	\N	2025-11-07 12:15:35.133606	\N
267	187	187	Soc. Agri Smeraldo	azienda							Italia			t	\N	2025-11-07 12:15:35.154826	\N
268	71	71	Soc. Agricola ORO DEL DELTA s.s. di Vaccari Lorenzo & C.	azienda	01578080291	01578080291					Italia			t	\N	2025-11-07 12:15:35.176105	\N
269	188	188	Soc. Agricola Scanno di Tironi Giuseppe	azienda	03407720287	03407720287					Italia			t	\N	2025-11-07 12:15:35.198213	\N
270	73	73	Soc. Cooperativa Pesca VOLANO	azienda	1743670380	1743670380	Piazza Cesare Battisti 114/1	Goro	FE	44020	Italia	3464775067	coopvolano@lamiapec.it	t	\N	2025-11-07 12:15:35.219565	\N
271	72	72	Soc.Agr.Alma pesca ss	azienda	00750250292	00750250292					Italia		coop.rosolina@gmail.com	t	\N	2025-11-07 12:15:35.24112	\N
272	70	70	Societa agr. Alissa s.s.	azienda	01571890290	01571890290					Italia		agricolafratellicavallari@gmail.com	t	\N	2025-11-07 12:15:35.262438	\N
273	193	193	Società Cooperativa ALBATROS	azienda	01706620380	01706620380					Italia		beppemicali73@gmail.com	t	\N	2025-11-07 12:15:35.283881	\N
274	77	77	Società agricola Delta Futuro srl	azienda	02057710382	02057710382					Italia		deltafuturo.goro@gmail.com	t	\N	2025-11-07 12:15:35.305477	\N
275	191	191	Società agricola Moceniga Pesca s.s	azienda	04443240272	pnzrrt63a06c638a					Italia		robertopenzo832@yahoo.it	t	\N	2025-11-07 12:15:35.326778	\N
276	192	192	Società cooperativa agricola San Rocco	azienda	02118120381	02118120381					Italia			t	\N	2025-11-07 12:15:35.348069	\N
277	137	137	Spinadin Pesca	azienda	00000000000	00000000000					Italia			t	\N	2025-11-07 12:15:35.369158	\N
278	208	208	Stichting zeeschelp	azienda	NL813730089B	NL813730089B					Paesi Bassi			t	\N	2025-11-07 12:15:35.39045	\N
279	209	209	TURGIAMAR SOC. COOP.	azienda	01627470386	01627470386					Italia		studiofabianicinti@virgilio.it	t	\N	2025-11-07 12:15:35.412391	\N
280	196	196	Tagliati Simone	azienda	01277000384	TGLSMN75T15C912W					Italia		coopadriatica@libero.it	t	\N	2025-11-07 12:15:35.433724	\N
281	198	198	Tiozzo Pagio Michael	azienda	04618970273	TZZMHL86M22C638J					Italia			t	\N	2025-11-07 12:15:35.45514	\N
282	123	123	Tirrenia	azienda							Italia			t		2025-11-07 12:15:35.476403	\N
283	199	199	Tosatti Andrea	azienda	01626450389	TSTNDR82T02D548G					Italia		andreatosatti@gmail.com	t	\N	2025-11-07 12:15:35.498221	\N
284	200	200	Trombini Graziano	azienda	00995820388	prmgzn55l18e107y					Italia			t	\N	2025-11-07 12:15:35.519478	\N
285	201	201	Trombini Silvana	azienda	01881110389	01881110389					Italia		morgan.turri@alice.it	t	\N	2025-11-07 12:15:35.542503	\N
286	122	122	VENUS - SOC. COOP.	azienda	01252330384	01252330384					Italia		coopvenusgoro@gmail.com	t	\N	2025-11-07 12:15:35.563733	\N
287	202	202	Vi.Effe ssa	azienda	04125900276	04125900276					Italia		alissasocagricola@libero.it	t	\N	2025-11-07 12:15:35.585304	\N
288	203	203	Vongola viva Soc. Agricola - Stocco Daniele	azienda	01470220292	01470220292					Italia		segreteria@polesineconsulting.it	t	\N	2025-11-07 12:15:35.606353	\N
289	204	204	ZANELLATI VALERIA	azienda	02002050389	ZNLVLR84R50C967J					Italia		filippoconventi19@gmail.com	t	\N	2025-11-07 12:15:35.627466	\N
290	32	32	e-distribuzione SpA	azienda	15844561009	05779711000					Italia		alessandro.andreani@enel.com	t	\N	2025-11-07 12:15:35.648926	\N
291	189	189	soc. coop. Marinetta	azienda	01284160296	01284160296					Italia			t	\N	2025-11-07 12:15:35.670163	\N
292	190	190	società agricola Kappa s.s. di Varagnolo Maurizio e C.	azienda	05020560289	TRRGPP50E25G224S					Italia			t	\N	2025-11-07 12:15:35.691416	\N
\.


--
-- TOC entry 3977 (class 0 OID 16617)
-- Dependencies: 238
-- Data for Name: external_deliveries_sync; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.external_deliveries_sync (id, external_id, data_creazione, cliente_id, ordine_id, data_consegna, stato, numero_totale_ceste, peso_totale_kg, totale_animali, taglia_media, qrcode_url, note, numero_progressivo, synced_at, last_sync_at, last_modified_external) FROM stdin;
53	111	2025-11-05T09:40:32.571+00:00	22	\N	2025-11-05T00:00:00.000+00:00	Generato Automaticamente	2	59.300	51030	\N	\N	Vendita multi-sezione generata il 05/11/2025	54	2025-11-07 12:15:36.82396	\N	2025-11-07 12:15:36.82396
54	112	2025-11-05T09:41:06.756+00:00	22	\N	2025-11-05T00:00:00.000+00:00	Generato Automaticamente	1	56.600	50940	\N	\N	Vendita multi-sezione generata il 05/11/2025	55	2025-11-07 12:15:36.849044	\N	2025-11-07 12:15:36.849044
55	110	2025-10-08T12:10:30.765+00:00	22	\N	2025-10-08T00:00:00.000+00:00	Generato Automaticamente	2	45.600	45600	\N	\N	Vendita multi-sezione generata il 08/10/2025	53	2025-11-07 12:15:36.871469	\N	2025-11-07 12:15:36.871469
56	109	2025-10-08T12:07:36.822+00:00	22	\N	2025-10-08T00:00:00.000+00:00	Generato Automaticamente	3	56.500	53041	\N	\N	Vendita multi-sezione generata il 08/10/2025	52	2025-11-07 12:15:36.892456	\N	2025-11-07 12:15:36.892456
57	108	2025-10-07T12:20:07.176+00:00	69	\N	2025-10-07T00:00:00.000+00:00	Generato Automaticamente	2	44.800	210127	\N	\N	Vendita multi-sezione generata il 07/10/2025	51	2025-11-07 12:15:36.913781	\N	2025-11-07 12:15:36.913781
58	106	2025-10-06T14:31:29.956+00:00	21	\N	2025-10-06T00:00:00.000+00:00	Generato Automaticamente	2	18.000	160200	\N	\N	Vendita multi-sezione generata il 06/10/2025	49	2025-11-07 12:15:36.93577	\N	2025-11-07 12:15:36.93577
59	105	2025-10-06T14:30:32.874+00:00	22	\N	2025-10-06T00:00:00.000+00:00	Generato Automaticamente	5	96.200	337547	\N	\N	Vendita multi-sezione generata il 06/10/2025	48	2025-11-07 12:15:36.957741	\N	2025-11-07 12:15:36.957741
60	107	2025-10-06T14:32:36.654+00:00	69	\N	2025-10-06T00:00:00.000+00:00	Generato Automaticamente	2	30.600	272340	\N	\N	Vendita multi-sezione generata il 06/10/2025	50	2025-11-07 12:15:36.978789	\N	2025-11-07 12:15:36.978789
61	104	2025-09-23T13:57:54.224+00:00	22	\N	2025-09-23T00:00:00.000+00:00	Generato Automaticamente	3	34.700	213132	\N	\N	Vendita multi-sezione generata il 23/09/2025	47	2025-11-07 12:15:37.000379	\N	2025-11-07 12:15:37.000379
62	103	2025-09-22T15:35:36.405+00:00	22	\N	2025-09-22T00:00:00.000+00:00	Generato Automaticamente	3	40.200	174893	\N	\N	Vendita multi-sezione generata il 22/09/2025	46	2025-11-07 12:15:37.021771	\N	2025-11-07 12:15:37.021771
63	102	2025-09-15T14:15:09.168+00:00	167	\N	2025-09-15T00:00:00.000+00:00	Generato Automaticamente	5	48.900	198593	\N	\N	Vendita multi-sezione generata il 15/09/2025	45	2025-11-07 12:15:37.043111	\N	2025-11-07 12:15:37.043111
64	98	2025-09-12T12:27:14.148+00:00	22	\N	2025-09-12T00:00:00.000+00:00	Generato Automaticamente	2	19.800	50556	\N	\N	Vendita multi-sezione generata il 12/09/2025	43	2025-11-07 12:15:37.064443	\N	2025-11-07 12:15:37.064443
65	101	2025-09-12T13:55:41.959+00:00	21	\N	2025-09-12T00:00:00.000+00:00	Generato Automaticamente	2	17.100	158790	\N	\N	Vendita multi-sezione generata il 12/09/2025	44	2025-11-07 12:15:37.085827	\N	2025-11-07 12:15:37.085827
66	96	2025-09-11T13:19:44.658+00:00	22	\N	2025-09-11T00:00:00.000+00:00	Generato Automaticamente	1	14.200	24504	\N	\N	Vendita multi-sezione generata il 11/09/2025	42	2025-11-07 12:15:37.107006	\N	2025-11-07 12:15:37.107006
67	95	2025-09-11T10:56:31.952+00:00	69	\N	2025-09-11T00:00:00.000+00:00	Generato Automaticamente	4	74.100	411620	\N	\N	Vendita multi-sezione generata il 11/09/2025	41	2025-11-07 12:15:37.129556	\N	2025-11-07 12:15:37.129556
68	94	2025-09-10T13:03:48.036+00:00	26	\N	2025-09-10T00:00:00.000+00:00	Generato Automaticamente	2	43.500	110562	\N	\N	Vendita multi-sezione generata il 10/09/2025	40	2025-11-07 12:15:37.150936	\N	2025-11-07 12:15:37.150936
69	93	2025-09-09T10:44:48.985+00:00	26	\N	2025-09-09T00:00:00.000+00:00	Generato Automaticamente	5	77.300	238889	\N	\N	Vendita multi-sezione generata il 09/09/2025	39	2025-11-07 12:15:37.172389	\N	2025-11-07 12:15:37.172389
70	92	2025-09-08T11:11:24.594+00:00	22	\N	2025-09-08T00:00:00.000+00:00	Generato Automaticamente	4	42.150	36883	\N	\N	Vendita multi-sezione generata il 08/09/2025	38	2025-11-07 12:15:37.193735	\N	2025-11-07 12:15:37.193735
71	91	2025-09-08T11:09:48.120+00:00	22	\N	2025-09-08T00:00:00.000+00:00	Generato Automaticamente	2	18.420	46967	\N	\N	Vendita multi-sezione generata il 08/09/2025	37	2025-11-07 12:15:37.21513	\N	2025-11-07 12:15:37.21513
72	89	2025-08-26T13:35:31.101+00:00	22	\N	2025-08-27T00:00:00.000+00:00	Generato Automaticamente	8	144.680	117007	\N	\N	Vendita multi-sezione generata il 26/08/2025	35	2025-11-07 12:15:37.236592	\N	2025-11-07 12:15:37.236592
73	88	2025-08-26T13:22:04.048+00:00	22	\N	2025-08-27T00:00:00.000+00:00	Generato Automaticamente	3	59.540	62219	\N	\N	Vendita multi-sezione generata il 26/08/2025	34	2025-11-07 12:15:37.257871	\N	2025-11-07 12:15:37.257871
74	90	2025-08-26T13:37:44.379+00:00	22	\N	2025-08-26T00:00:00.000+00:00	Generato Automaticamente	4	86.960	90873	\N	\N	Vendita multi-sezione generata il 26/08/2025	36	2025-11-07 12:15:37.279244	\N	2025-11-07 12:15:37.279244
75	86	2025-08-20T13:41:44.467+00:00	69	\N	2025-08-20T00:00:00.000+00:00	Generato Automaticamente	4	75.800	212654	\N	\N	Vendita multi-sezione generata il 20/08/2025	32	2025-11-07 12:15:37.301823	\N	2025-11-07 12:15:37.301823
76	84	2025-08-13T14:50:54.033+00:00	29	\N	2025-08-13T00:00:00.000+00:00	Generato Automaticamente	3	41.800	177710	\N	\N	Vendita multi-sezione generata il 13/08/2025	31	2025-11-07 12:15:37.323298	\N	2025-11-07 12:15:37.323298
77	82	2025-08-12T17:21:12.606+00:00	22	\N	2025-08-12T00:00:00.000+00:00	Generato Automaticamente	3	49.550	146088	\N	\N	Vendita multi-sezione generata il 12/08/2025	29	2025-11-07 12:15:37.344802	\N	2025-11-07 12:15:37.344802
78	81	2025-08-12T10:54:22.366+00:00	68	\N	2025-08-12T00:00:00.000+00:00	Generato Automaticamente	12	180.600	144573	\N	\N	Vendita multi-sezione generata il 12/08/2025	28	2025-11-07 12:15:37.366442	\N	2025-11-07 12:15:37.366442
79	83	2025-08-12T17:23:45.387+00:00	22	\N	2025-08-12T00:00:00.000+00:00	Generato Automaticamente	3	50.430	149913	\N	\N	Vendita multi-sezione generata il 12/08/2025	30	2025-11-07 12:15:37.387735	\N	2025-11-07 12:15:37.387735
80	69	2025-07-17T09:30:58.353+00:00	8	\N	2025-07-17T00:00:00.000+00:00	Generato Automaticamente	10	400.000	8000	\N	\N	\N	27	2025-11-07 12:15:37.409056	\N	2025-11-07 12:15:37.409056
81	68	2025-07-01T16:07:38.386+00:00	125	\N	2025-06-20T00:00:00.000+00:00	Generato Automaticamente	1	25.600	24576	\N	\N	Vendita multi-sezione generata il 01/07/2025	26	2025-11-07 12:15:37.430411	\N	2025-11-07 12:15:37.430411
82	66	2025-06-19T06:03:11.733+00:00	26	\N	2025-06-19T00:00:00.000+00:00	Generato Automaticamente	1	5.500	25080	\N	\N	Vendita multi-sezione generata il 19/06/2025	25	2025-11-07 12:15:37.451786	\N	2025-11-07 12:15:37.451786
83	65	2025-06-19T05:59:42.496+00:00	26	\N	2025-06-19T00:00:00.000+00:00	Generato Automaticamente	10	179.200	384241	\N	\N	Vendita multi-sezione generata il 19/06/2025	24	2025-11-07 12:15:37.473666	\N	2025-11-07 12:15:37.473666
84	64	2025-06-17T08:56:12.372+00:00	28	\N	2025-06-17T00:00:00.000+00:00	Generato Automaticamente	4	77.500	164292	\N	\N	Vendita multi-sezione generata il 17/06/2025	23	2025-11-07 12:15:37.494947	\N	2025-11-07 12:15:37.494947
85	62	2025-06-16T13:16:03.539+00:00	28	\N	2025-06-16T00:00:00.000+00:00	Generato Automaticamente	19	436.210	717655	\N	\N	Vendita multi-sezione generata il 16/06/2025	21	2025-11-07 12:15:37.516238	\N	2025-11-07 12:15:37.516238
86	60	2025-06-11T11:10:00.379+00:00	68	\N	2025-06-11T00:00:00.000+00:00	Generato Automaticamente	16	300.970	316428	\N	\N	Vendita multi-sezione generata il 11/06/2025	19	2025-11-07 12:15:37.537519	\N	2025-11-07 12:15:37.537519
87	59	2025-06-06T06:08:03.362+00:00	26	\N	2025-06-06T00:00:00.000+00:00	Generato Automaticamente	11	180.700	99375	\N	\N	Vendita multi-sezione generata il 06/06/2025	18	2025-11-07 12:15:37.558947	\N	2025-11-07 12:15:37.558947
88	58	2025-05-28T11:52:59.708+00:00	26	\N	2025-05-17T00:00:00.000+00:00	Generato Automaticamente	2	54.800	68500	\N	\N	Vendita multi-sezione generata il 28/05/2025	17	2025-11-07 12:15:37.580455	\N	2025-11-07 12:15:37.580455
89	57	2025-05-28T11:51:23.457+00:00	28	\N	2025-05-15T00:00:00.000+00:00	Generato Automaticamente	4	84.750	93564	\N	\N	Vendita multi-sezione generata il 28/05/2025	16	2025-11-07 12:15:37.602935	\N	2025-11-07 12:15:37.602935
90	52	2025-05-14T13:58:14.200+00:00	26	\N	2025-05-14T00:00:00.000+00:00	Generato Automaticamente	7	167.630	247869	\N	\N	Report di vendita multi-sezione generato il 14/05/2025	14	2025-11-07 12:15:37.625461	\N	2025-11-07 12:15:37.625461
91	48	2025-05-09T14:06:02.203+00:00	22	\N	2025-05-09T00:00:00.000+00:00	Generato Automaticamente	9	190.780	254650	\N	\N	Report di vendita multi-sezione generato il 09/05/2025	12	2025-11-07 12:15:37.646901	\N	2025-11-07 12:15:37.646901
92	49	2025-05-09T14:22:38.800+00:00	28	\N	2025-05-08T00:00:00.000+00:00	Generato Automaticamente	12	282.000	350050	\N	\N	Report di vendita multi-sezione generato il 09/05/2025	13	2025-11-07 12:15:37.668263	\N	2025-11-07 12:15:37.668263
93	56	2025-05-28T11:48:17.535+00:00	28	\N	2025-04-30T00:00:00.000+00:00	Generato Automaticamente	13	266.440	326121	\N	\N	Vendita multi-sezione generata il 28/05/2025	15	2025-11-07 12:15:37.689726	\N	2025-11-07 12:15:37.689726
94	28	2025-04-30T16:29:35.464+00:00	68	\N	2025-04-29T00:00:00.000+00:00	Generato Automaticamente	15	273.180	365128	\N	\N	Report generato automaticamente dalla vendita del 29/04/2025	11	2025-11-07 12:15:37.711189	\N	2025-11-07 12:15:37.711189
95	22	2025-04-28T10:36:27.503+00:00	26	\N	2025-04-18T00:00:00.000+00:00	Generato Automaticamente	33	758.270	837381	\N	\N	Report generato automaticamente dalla vendita del 18/04/2025	9	2025-11-07 12:15:37.733286	\N	2025-11-07 12:15:37.733286
96	27	2025-04-30T16:12:29.640+00:00	80	\N	2025-04-18T00:00:00.000+00:00	Generato Automaticamente	4	92.770	188438	\N	\N	Report generato automaticamente dalla vendita del 18/04/2025	10	2025-11-07 12:15:37.754821	\N	2025-11-07 12:15:37.754821
97	17	2025-04-12T07:49:51.629+00:00	28	\N	2025-04-10T00:00:00.000+00:00	Generato Automaticamente	1	135.890	160894	\N	\N	Report generato automaticamente dalla vendita del 10/04/2025	7	2025-11-07 12:15:37.77677	\N	2025-11-07 12:15:37.77677
98	18	2025-04-12T07:50:41.837+00:00	28	\N	2025-04-10T00:00:00.000+00:00	Generato Automaticamente	1	103.760	122852	\N	\N	Report generato automaticamente dalla vendita del 10/04/2025	8	2025-11-07 12:15:37.800847	\N	2025-11-07 12:15:37.800847
99	16	2025-04-12T07:48:53.459+00:00	28	\N	2025-04-09T00:00:00.000+00:00	Generato Automaticamente	1	268.440	318101	\N	\N	Report generato automaticamente dalla vendita del 09/04/2025	6	2025-11-07 12:15:37.822522	\N	2025-11-07 12:15:37.822522
100	15	2025-04-12T07:42:00.365+00:00	28	\N	2025-04-09T00:00:00.000+00:00	Generato Automaticamente	1	42.230	50000	\N	\N	Report generato automaticamente dalla vendita del 09/04/2025	5	2025-11-07 12:15:37.843967	\N	2025-11-07 12:15:37.843967
101	14	2025-04-12T07:23:12.517+00:00	28	\N	2025-04-04T00:00:00.000+00:00	Generato Automaticamente	1	140.570	168543	\N	\N	Report generato automaticamente dalla vendita del 04/04/2025	4	2025-11-07 12:15:37.865405	\N	2025-11-07 12:15:37.865405
102	11	2025-04-10T17:00:52.224+00:00	28	\N	2025-04-03T00:00:00.000+00:00	Generato Automaticamente	1	261.000	285273	\N	\N	Report generato automaticamente dalla vendita del 03/04/2025	2	2025-11-07 12:15:37.886633	\N	2025-11-07 12:15:37.886633
103	13	2025-04-12T07:19:29.210+00:00	28	\N	2025-04-03T00:00:00.000+00:00	Generato Automaticamente	1	45.800	50014	\N	\N	Report generato automaticamente dalla vendita del 03/04/2025	3	2025-11-07 12:15:37.908387	\N	2025-11-07 12:15:37.908387
104	7	2025-04-05T17:41:13.350+00:00	28	\N	2025-02-28T00:00:00.000+00:00	Generato Automaticamente	14	288.930	332112	\N	#/report-viewer?id=7	Report generato automaticamente dalla vendita del 28/02/2025	1	2025-11-07 12:15:37.929671	\N	2025-11-07 12:15:37.929671
\.


--
-- TOC entry 3979 (class 0 OID 16629)
-- Dependencies: 240
-- Data for Name: external_delivery_details_sync; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.external_delivery_details_sync (id, external_id, report_id, misurazione_id, vasca_id, codice_sezione, numero_ceste, peso_ceste_kg, taglia, animali_per_kg, percentuale_scarto, percentuale_mortalita, numero_animali, note, synced_at, last_sync_at, last_modified_external) FROM stdin;
376	323	65	1270	19	B	1	17.000	TP-5000	4252.000	49.00	\N	36865	Dettaglio cesta #6 - Sezione B	2025-11-07 12:15:41.873952	\N	2025-11-07 12:15:41.873952
377	324	65	1270	19	B	1	21.500	TP-5000	5561.000	51.00	\N	58585	Dettaglio cesta #7 - Sezione B	2025-11-07 12:15:41.89626	\N	2025-11-07 12:15:41.89626
378	325	65	1270	19	B	1	18.500	TP-5000	4396.000	55.00	\N	36597	Dettaglio cesta #8 - Sezione B	2025-11-07 12:15:41.917944	\N	2025-11-07 12:15:41.917944
379	326	65	1270	19	B	1	11.400	TP-5000	4800.000	50.00	\N	27360	Dettaglio cesta #9 - Sezione B	2025-11-07 12:15:41.939344	\N	2025-11-07 12:15:41.939344
380	327	65	1270	19	B	1	13.300	TP-5000	4800.000	50.00	\N	31920	Dettaglio cesta #10 - Sezione B	2025-11-07 12:15:41.960535	\N	2025-11-07 12:15:41.960535
381	328	66	1271	19	B	1	5.500	TP-5000	4800.000	5.00	\N	25080	Dettaglio cesta #1 - Sezione B	2025-11-07 12:15:41.981827	\N	2025-11-07 12:15:41.981827
382	330	68	1285	19	B	1	25.600	TP-10000	1500.000	36.00	\N	24576	Dettaglio cesta #1 - Sezione B	2025-11-07 12:15:42.003118	\N	2025-11-07 12:15:42.003118
383	355	81	1344	17	A	1	18.400	TP-10000	922.000	8.00	\N	15608	Dettaglio cesta #1 - Sezione A	2025-11-07 12:15:42.024243	\N	2025-11-07 12:15:42.024243
384	356	81	1344	17	A	1	15.700	TP-10000	988.000	3.00	\N	15046	Dettaglio cesta #2 - Sezione A	2025-11-07 12:15:42.045406	\N	2025-11-07 12:15:42.045406
385	357	81	1344	17	A	1	17.400	TP-10000	913.000	12.00	\N	13980	Dettaglio cesta #3 - Sezione A	2025-11-07 12:15:42.067315	\N	2025-11-07 12:15:42.067315
386	358	81	1344	17	A	1	16.200	TP-10000	1030.000	16.00	\N	14016	Dettaglio cesta #4 - Sezione A	2025-11-07 12:15:42.088799	\N	2025-11-07 12:15:42.088799
387	359	81	1344	17	A	1	18.400	TP-10000	1052.000	15.00	\N	16453	Dettaglio cesta #5 - Sezione A	2025-11-07 12:15:42.10996	\N	2025-11-07 12:15:42.10996
388	360	81	1344	17	A	1	14.400	TP-10000+	388.000	2.00	\N	5475	Dettaglio cesta #6 - Sezione A	2025-11-07 12:15:42.132055	\N	2025-11-07 12:15:42.132055
389	361	81	1344	17	A	1	14.500	TP-10000+	428.000	2.00	\N	6082	Dettaglio cesta #7 - Sezione A	2025-11-07 12:15:42.154016	\N	2025-11-07 12:15:42.154016
390	362	81	1344	17	A	1	12.800	TP-10000+	559.000	3.00	\N	6941	Dettaglio cesta #8 - Sezione A	2025-11-07 12:15:42.175477	\N	2025-11-07 12:15:42.175477
391	363	81	1344	17	A	1	10.600	TP-10000	1061.000	3.00	\N	10909	Dettaglio cesta #9 - Sezione A	2025-11-07 12:15:42.196837	\N	2025-11-07 12:15:42.196837
392	364	81	1344	17	A	1	14.700	TP-10000	1085.000	4.00	\N	15312	Dettaglio cesta #10 - Sezione A	2025-11-07 12:15:42.218297	\N	2025-11-07 12:15:42.218297
393	365	81	1344	17	A	1	14.600	TP-10000	1003.000	6.00	\N	13765	Dettaglio cesta #11 - Sezione A	2025-11-07 12:15:42.23938	\N	2025-11-07 12:15:42.23938
394	366	81	1344	17	A	1	12.900	TP-10000	869.000	2.00	\N	10986	Dettaglio cesta #12 - Sezione A	2025-11-07 12:15:42.26082	\N	2025-11-07 12:15:42.26082
395	367	82	1345	19	C	1	22.750	TP-9000	1970.000	2.00	\N	43921	Dettaglio cesta #1 - Sezione C	2025-11-07 12:15:42.282215	\N	2025-11-07 12:15:42.282215
396	368	82	1345	19	C	1	16.750	TP-7000	3890.000	2.00	\N	63854	Dettaglio cesta #2 - Sezione C	2025-11-07 12:15:42.30345	\N	2025-11-07 12:15:42.30345
397	369	82	1345	19	C	1	10.050	TP-7000	3890.000	2.00	\N	38313	Dettaglio cesta #3 - Sezione C	2025-11-07 12:15:42.3249	\N	2025-11-07 12:15:42.3249
398	370	83	1346	19	C	1	22.500	TP-9000	1970.000	2.00	\N	43439	Dettaglio cesta #1 - Sezione C	2025-11-07 12:15:42.346152	\N	2025-11-07 12:15:42.346152
399	371	83	1346	19	C	1	18.230	TP-7000	3890.000	2.00	\N	69496	Dettaglio cesta #2 - Sezione C	2025-11-07 12:15:42.367496	\N	2025-11-07 12:15:42.367496
400	372	83	1346	19	C	1	9.700	TP-7000	3890.000	2.00	\N	36978	Dettaglio cesta #3 - Sezione C	2025-11-07 12:15:42.388759	\N	2025-11-07 12:15:42.388759
201	14	7	249	17	A	1	19.590	TP-10000	1185.000	0.03	\N	22518	Dettaglio cesta #1	2025-11-07 12:15:38.078171	\N	2025-11-07 12:15:38.078171
202	15	7	249	17	A	1	20.080	TP-10000	1185.000	0.03	\N	23081	Dettaglio cesta #2	2025-11-07 12:15:38.104515	\N	2025-11-07 12:15:38.104515
203	16	7	249	17	A	1	19.810	TP-10000	1185.000	0.03	\N	22771	Dettaglio cesta #3	2025-11-07 12:15:38.125908	\N	2025-11-07 12:15:38.125908
204	17	7	249	17	A	1	19.890	TP-10000	1185.000	0.03	\N	22863	Dettaglio cesta #4	2025-11-07 12:15:38.147428	\N	2025-11-07 12:15:38.147428
205	18	7	249	17	A	1	20.290	TP-10000	1185.000	0.03	\N	23322	Dettaglio cesta #5	2025-11-07 12:15:38.168688	\N	2025-11-07 12:15:38.168688
206	19	7	249	17	A	1	19.710	TP-10000	1185.000	0.03	\N	22656	Dettaglio cesta #6	2025-11-07 12:15:38.19073	\N	2025-11-07 12:15:38.19073
207	20	7	249	17	A	1	19.820	TP-10000	1185.000	0.03	\N	22782	Dettaglio cesta #7	2025-11-07 12:15:38.214453	\N	2025-11-07 12:15:38.214453
208	21	7	249	17	A	1	19.940	TP-10000	1185.000	0.03	\N	22920	Dettaglio cesta #8	2025-11-07 12:15:38.235791	\N	2025-11-07 12:15:38.235791
209	22	7	249	17	A	1	19.610	TP-10000	1185.000	0.03	\N	22541	Dettaglio cesta #9	2025-11-07 12:15:38.257511	\N	2025-11-07 12:15:38.257511
210	23	7	249	17	A	1	21.650	TP-10000	1185.000	0.03	\N	24886	Dettaglio cesta #10	2025-11-07 12:15:38.279184	\N	2025-11-07 12:15:38.279184
211	24	7	249	17	A	1	21.870	TP-10000	1185.000	0.03	\N	25138	Dettaglio cesta #11	2025-11-07 12:15:38.300793	\N	2025-11-07 12:15:38.300793
212	25	7	249	17	A	1	22.380	TP-10000	1185.000	0.03	\N	25725	Dettaglio cesta #12	2025-11-07 12:15:38.32216	\N	2025-11-07 12:15:38.32216
213	26	7	249	17	A	1	23.740	TP-10000	1185.000	0.03	\N	27288	Dettaglio cesta #13	2025-11-07 12:15:38.343316	\N	2025-11-07 12:15:38.343316
214	27	7	249	17	A	1	20.550	TP-10000	1185.000	0.03	\N	23621	Dettaglio cesta #14	2025-11-07 12:15:38.364966	\N	2025-11-07 12:15:38.364966
215	46	11	253	17	A	1	261.000	TP-10000	1093.000	0.00	\N	285273	Dettaglio cesta #1	2025-11-07 12:15:38.386226	\N	2025-11-07 12:15:38.386226
216	48	13	255	17	B	1	45.800	TP-10000	1092.000	0.00	\N	50014	Dettaglio cesta #1	2025-11-07 12:15:38.407448	\N	2025-11-07 12:15:38.407448
217	49	14	256	17	B	1	140.570	TP-10000	1199.000	0.00	\N	168543	Dettaglio cesta #1	2025-11-07 12:15:38.42864	\N	2025-11-07 12:15:38.42864
218	50	15	257	17	A	1	42.230	TP-10000	1184.000	0.00	\N	50000	Dettaglio cesta #1	2025-11-07 12:15:38.449862	\N	2025-11-07 12:15:38.449862
219	51	16	258	17	B	1	268.440	TP-10000	1185.000	0.00	\N	318101	Dettaglio cesta #1	2025-11-07 12:15:38.471271	\N	2025-11-07 12:15:38.471271
220	52	17	259	17	A	1	135.890	TP-10000	1184.000	0.00	\N	160894	Dettaglio cesta #1	2025-11-07 12:15:38.492487	\N	2025-11-07 12:15:38.492487
221	53	18	260	17	B	1	103.760	TP-10000	1184.000	0.00	\N	122852	Dettaglio cesta #1	2025-11-07 12:15:38.51431	\N	2025-11-07 12:15:38.51431
222	58	22	401	19	A	1	25.230	TP-10000	1169.000	0.02	\N	29051	Dettaglio cesta #1	2025-11-07 12:15:38.535697	\N	2025-11-07 12:15:38.535697
223	59	22	401	19	A	1	24.710	TP-9000	1405.000	0.03	\N	33780	Dettaglio cesta #2	2025-11-07 12:15:38.557168	\N	2025-11-07 12:15:38.557168
224	60	22	401	19	A	1	25.900	TP-9000	1717.000	0.10	\N	39934	Dettaglio cesta #3	2025-11-07 12:15:38.578315	\N	2025-11-07 12:15:38.578315
225	61	22	401	19	A	1	24.470	TP-8000	1973.000	0.11	\N	43210	Dettaglio cesta #4	2025-11-07 12:15:38.599708	\N	2025-11-07 12:15:38.599708
226	62	22	401	19	A	1	23.750	TP-9000	1304.000	0.02	\N	30320	Dettaglio cesta #5	2025-11-07 12:15:38.620855	\N	2025-11-07 12:15:38.620855
227	63	22	401	19	A	1	23.860	TP-9000	1215.000	0.02	\N	28410	Dettaglio cesta #6	2025-11-07 12:15:38.642	\N	2025-11-07 12:15:38.642
228	64	22	401	19	A	1	24.020	TP-9000	1512.000	0.06	\N	34212	Dettaglio cesta #7	2025-11-07 12:15:38.663725	\N	2025-11-07 12:15:38.663725
229	65	22	401	19	A	1	23.660	TP-10000	1102.000	0.08	\N	23987	Dettaglio cesta #8	2025-11-07 12:15:38.685505	\N	2025-11-07 12:15:38.685505
230	66	22	401	19	A	1	23.770	TP-10000	1107.000	0.17	\N	21866	Dettaglio cesta #9	2025-11-07 12:15:38.70664	\N	2025-11-07 12:15:38.70664
231	67	22	401	19	A	1	25.170	TP-10000	1183.000	0.02	\N	29181	Dettaglio cesta #10	2025-11-07 12:15:38.72908	\N	2025-11-07 12:15:38.72908
232	68	22	401	19	A	1	23.340	TP-10000	1101.000	0.10	\N	23128	Dettaglio cesta #11	2025-11-07 12:15:38.752528	\N	2025-11-07 12:15:38.752528
233	69	22	401	19	A	1	24.940	TP-9000	1222.000	0.17	\N	25296	Dettaglio cesta #12	2025-11-07 12:15:38.774395	\N	2025-11-07 12:15:38.774395
234	70	22	401	19	A	1	24.910	TP-9000	1207.000	0.18	\N	24654	Dettaglio cesta #13	2025-11-07 12:15:38.795569	\N	2025-11-07 12:15:38.795569
235	71	22	401	19	A	1	26.320	TP-9000	1272.000	0.10	\N	30131	Dettaglio cesta #14	2025-11-07 12:15:38.816968	\N	2025-11-07 12:15:38.816968
236	72	22	401	19	A	1	25.480	TP-9000	1234.000	0.10	\N	28298	Dettaglio cesta #15	2025-11-07 12:15:38.838072	\N	2025-11-07 12:15:38.838072
237	73	22	401	19	A	1	24.380	TP-10000	1187.000	0.12	\N	25466	Dettaglio cesta #16	2025-11-07 12:15:38.859341	\N	2025-11-07 12:15:38.859341
238	74	22	401	19	A	1	24.160	TP-9000	1391.000	0.13	\N	29238	Dettaglio cesta #17	2025-11-07 12:15:38.880469	\N	2025-11-07 12:15:38.880469
239	75	22	401	19	A	1	24.160	TP-10000	1185.000	0.12	\N	25194	Dettaglio cesta #18	2025-11-07 12:15:38.901977	\N	2025-11-07 12:15:38.901977
240	76	22	401	19	A	1	24.280	TP-9000	1347.000	0.10	\N	29435	Dettaglio cesta #19	2025-11-07 12:15:38.923984	\N	2025-11-07 12:15:38.923984
241	77	22	401	19	A	1	23.730	TP-9000	1276.000	0.17	\N	25132	Dettaglio cesta #20	2025-11-07 12:15:38.945077	\N	2025-11-07 12:15:38.945077
242	78	22	401	19	A	1	21.190	TP-9000	1309.000	0.07	\N	25796	Dettaglio cesta #21	2025-11-07 12:15:38.966329	\N	2025-11-07 12:15:38.966329
243	79	22	401	19	A	1	24.160	TP-9000	1633.000	0.16	\N	33141	Dettaglio cesta #22	2025-11-07 12:15:38.992226	\N	2025-11-07 12:15:38.992226
244	80	22	401	19	A	1	21.160	TP-9000	1520.000	0.04	\N	30877	Dettaglio cesta #23	2025-11-07 12:15:39.013773	\N	2025-11-07 12:15:39.013773
245	81	22	401	19	A	1	15.700	TP-9000	1244.000	0.19	\N	15820	Dettaglio cesta #24	2025-11-07 12:15:39.035365	\N	2025-11-07 12:15:39.035365
246	82	22	401	19	A	1	24.140	TP-9000	1266.000	0.13	\N	26588	Dettaglio cesta #25	2025-11-07 12:15:39.05683	\N	2025-11-07 12:15:39.05683
247	83	22	401	19	A	1	22.650	TP-9000	1410.000	0.30	\N	22356	Dettaglio cesta #26	2025-11-07 12:15:39.078178	\N	2025-11-07 12:15:39.078178
248	84	22	401	19	A	1	22.540	TP-9000	1534.000	0.24	\N	26278	Dettaglio cesta #27	2025-11-07 12:15:39.099726	\N	2025-11-07 12:15:39.099726
249	85	22	401	19	A	1	21.340	TP-9000	1244.000	0.22	\N	20707	Dettaglio cesta #28	2025-11-07 12:15:39.121715	\N	2025-11-07 12:15:39.121715
250	86	22	401	19	A	1	20.570	TP-9000	1309.000	0.21	\N	21272	Dettaglio cesta #29	2025-11-07 12:15:39.142928	\N	2025-11-07 12:15:39.142928
251	87	22	401	19	A	1	21.020	TP-9000	1220.000	0.22	\N	20003	Dettaglio cesta #30	2025-11-07 12:15:39.164131	\N	2025-11-07 12:15:39.164131
252	88	22	401	19	A	1	21.080	TP-10000+	360.000	0.15	\N	6450	Dettaglio cesta #31	2025-11-07 12:15:39.185332	\N	2025-11-07 12:15:39.185332
253	89	22	401	19	A	1	21.260	TP-10000+	340.000	0.30	\N	5060	Dettaglio cesta #32	2025-11-07 12:15:39.206336	\N	2025-11-07 12:15:39.206336
254	90	22	401	19	A	1	11.220	TP-10000+	330.000	0.16	\N	3110	Dettaglio cesta #33	2025-11-07 12:15:39.230696	\N	2025-11-07 12:15:39.230696
255	107	27	415	19	A	1	28.620	TP-7000	3100.000	0.35	\N	57669	Dettaglio cesta #1	2025-11-07 12:15:39.251813	\N	2025-11-07 12:15:39.251813
256	108	27	415	19	A	1	23.270	TP-7000	3150.000	0.35	\N	47645	Dettaglio cesta #2	2025-11-07 12:15:39.273851	\N	2025-11-07 12:15:39.273851
257	109	27	415	19	A	1	23.090	TP-7000	3150.000	0.35	\N	47277	Dettaglio cesta #3	2025-11-07 12:15:39.295052	\N	2025-11-07 12:15:39.295052
258	110	27	415	19	A	1	17.790	TP-7000	3100.000	0.35	\N	35847	Dettaglio cesta #4	2025-11-07 12:15:39.316449	\N	2025-11-07 12:15:39.316449
259	111	28	416	17	E	1	16.690	TP-10000	1470.000	0.07	\N	22719	Dettaglio cesta #1	2025-11-07 12:15:39.337524	\N	2025-11-07 12:15:39.337524
260	112	28	416	17	E	1	15.780	TP-10000	1470.000	0.07	\N	21480	Dettaglio cesta #2	2025-11-07 12:15:39.3586	\N	2025-11-07 12:15:39.3586
261	113	28	416	17	E	1	22.650	TP-10000	1470.000	0.07	\N	30832	Dettaglio cesta #3	2025-11-07 12:15:39.380374	\N	2025-11-07 12:15:39.380374
262	114	28	416	17	E	1	14.470	TP-10000	1470.000	0.07	\N	19697	Dettaglio cesta #4	2025-11-07 12:15:39.401482	\N	2025-11-07 12:15:39.401482
263	115	28	416	17	E	1	16.300	TP-10000	1470.000	0.07	\N	22188	Dettaglio cesta #5	2025-11-07 12:15:39.422459	\N	2025-11-07 12:15:39.422459
264	116	28	416	17	E	1	21.050	TP-10000	1470.000	0.07	\N	28654	Dettaglio cesta #6	2025-11-07 12:15:39.443623	\N	2025-11-07 12:15:39.443623
265	117	28	416	17	E	1	15.800	TP-10000	1470.000	0.07	\N	21507	Dettaglio cesta #7	2025-11-07 12:15:39.464703	\N	2025-11-07 12:15:39.464703
266	118	28	416	17	E	1	17.520	TP-10000	1470.000	0.07	\N	23849	Dettaglio cesta #8	2025-11-07 12:15:39.486005	\N	2025-11-07 12:15:39.486005
267	119	28	416	17	E	1	18.210	TP-10000	1470.000	0.07	\N	24788	Dettaglio cesta #9	2025-11-07 12:15:39.507331	\N	2025-11-07 12:15:39.507331
268	120	28	416	17	E	1	20.620	TP-10000	1470.000	0.07	\N	28068	Dettaglio cesta #10	2025-11-07 12:15:39.528775	\N	2025-11-07 12:15:39.528775
269	121	28	416	17	E	1	22.880	TP-10000	1470.000	0.07	\N	31145	Dettaglio cesta #11	2025-11-07 12:15:39.550002	\N	2025-11-07 12:15:39.550002
270	122	28	416	17	E	1	20.300	TP-10000	1470.000	0.07	\N	27633	Dettaglio cesta #12	2025-11-07 12:15:39.571505	\N	2025-11-07 12:15:39.571505
271	123	28	416	17	E	1	21.200	TP-7000	3000.000	0.55	\N	28620	Dettaglio cesta #13	2025-11-07 12:15:39.592946	\N	2025-11-07 12:15:39.592946
272	124	28	416	17	E	1	23.710	TP-7000	3000.000	0.55	\N	32008	Dettaglio cesta #14	2025-11-07 12:15:39.613956	\N	2025-11-07 12:15:39.613956
273	125	28	416	17	E	1	6.000	TP-10000+	330.000	0.02	\N	1940	Dettaglio cesta #15	2025-11-07 12:15:39.635394	\N	2025-11-07 12:15:39.635394
274	183	48	995	17	C	1	21.050	TP-10000	1369.000	2.50	\N	28097	Dettaglio cesta #1 - Sezione C	2025-11-07 12:15:39.656677	\N	2025-11-07 12:15:39.656677
275	184	48	995	17	C	1	22.430	TP-10000	1369.000	2.50	\N	29939	Dettaglio cesta #2 - Sezione C	2025-11-07 12:15:39.6787	\N	2025-11-07 12:15:39.6787
276	185	48	995	17	C	1	22.740	TP-10000	1369.000	2.50	\N	30353	Dettaglio cesta #3 - Sezione C	2025-11-07 12:15:39.69987	\N	2025-11-07 12:15:39.69987
277	186	48	995	17	C	1	20.530	TP-10000	1369.000	2.50	\N	27403	Dettaglio cesta #4 - Sezione C	2025-11-07 12:15:39.721784	\N	2025-11-07 12:15:39.721784
278	187	48	995	17	C	1	23.050	TP-10000	1369.000	2.50	\N	30767	Dettaglio cesta #5 - Sezione C	2025-11-07 12:15:39.743046	\N	2025-11-07 12:15:39.743046
279	188	48	995	17	C	1	22.250	TP-10000	1369.000	2.50	\N	29699	Dettaglio cesta #6 - Sezione C	2025-11-07 12:15:39.764252	\N	2025-11-07 12:15:39.764252
280	189	48	995	17	C	1	22.950	TP-10000	1369.000	2.50	\N	30633	Dettaglio cesta #7 - Sezione C	2025-11-07 12:15:39.787554	\N	2025-11-07 12:15:39.787554
281	190	48	995	17	C	1	19.630	TP-10000	1369.000	2.50	\N	26202	Dettaglio cesta #8 - Sezione C	2025-11-07 12:15:39.808982	\N	2025-11-07 12:15:39.808982
282	191	48	996	17	D	1	16.150	TP-10000	1369.000	2.50	\N	21557	Dettaglio cesta #9 - Sezione D	2025-11-07 12:15:39.83026	\N	2025-11-07 12:15:39.83026
283	192	49	997	17	A	1	13.500	TP-10000	1000.000	2.50	\N	13163	Dettaglio cesta #1 - Sezione A	2025-11-07 12:15:39.851666	\N	2025-11-07 12:15:39.851666
284	193	49	997	17	A	1	10.500	TP-10000+	450.000	2.50	\N	4607	Dettaglio cesta #2 - Sezione A	2025-11-07 12:15:39.873003	\N	2025-11-07 12:15:39.873003
285	194	49	997	17	A	1	28.000	TP-10000	1000.000	2.50	\N	27300	Dettaglio cesta #3 - Sezione A	2025-11-07 12:15:39.894206	\N	2025-11-07 12:15:39.894206
286	195	49	998	17	D	1	25.500	TP-10000	1360.000	2.50	\N	33813	Dettaglio cesta #4 - Sezione D	2025-11-07 12:15:39.915506	\N	2025-11-07 12:15:39.915506
287	196	49	997	17	A	1	25.500	TP-10000	1360.000	2.50	\N	33813	Dettaglio cesta #5 - Sezione A	2025-11-07 12:15:39.936937	\N	2025-11-07 12:15:39.936937
288	197	49	999	17	B	1	25.000	TP-10000	1360.000	2.50	\N	33150	Dettaglio cesta #6 - Sezione B	2025-11-07 12:15:39.958201	\N	2025-11-07 12:15:39.958201
289	198	49	999	17	B	1	24.500	TP-10000	1360.000	2.50	\N	32487	Dettaglio cesta #7 - Sezione B	2025-11-07 12:15:39.979717	\N	2025-11-07 12:15:39.979717
290	199	49	1000	17	C	1	26.000	TP-10000	1360.000	2.50	\N	34476	Dettaglio cesta #8 - Sezione C	2025-11-07 12:15:40.001142	\N	2025-11-07 12:15:40.001142
291	200	49	1000	17	C	1	24.000	TP-10000	1360.000	2.50	\N	31824	Dettaglio cesta #9 - Sezione C	2025-11-07 12:15:40.022453	\N	2025-11-07 12:15:40.022453
292	201	49	1000	17	C	1	25.500	TP-10000	1360.000	2.50	\N	33813	Dettaglio cesta #10 - Sezione C	2025-11-07 12:15:40.043672	\N	2025-11-07 12:15:40.043672
293	202	49	1000	17	C	1	27.000	TP-10000	1360.000	2.50	\N	35802	Dettaglio cesta #11 - Sezione C	2025-11-07 12:15:40.064853	\N	2025-11-07 12:15:40.064853
294	203	49	1000	17	C	1	27.000	TP-10000	1360.000	2.50	\N	35802	Dettaglio cesta #12 - Sezione C	2025-11-07 12:15:40.086309	\N	2025-11-07 12:15:40.086309
295	211	52	1004	17	E	1	24.500	TP-10000	1520.000	1.20	\N	36793	Dettaglio cesta #1 - Sezione E	2025-11-07 12:15:40.107437	\N	2025-11-07 12:15:40.107437
296	212	52	1004	17	E	1	26.720	TP-10000	1520.000	1.20	\N	40127	Dettaglio cesta #2 - Sezione E	2025-11-07 12:15:40.128874	\N	2025-11-07 12:15:40.128874
297	213	52	1005	17	D	1	26.630	TP-10000	1520.000	1.20	\N	39992	Dettaglio cesta #3 - Sezione D	2025-11-07 12:15:40.153079	\N	2025-11-07 12:15:40.153079
298	214	52	1005	17	D	1	25.750	TP-10000	1520.000	1.20	\N	38670	Dettaglio cesta #4 - Sezione D	2025-11-07 12:15:40.174347	\N	2025-11-07 12:15:40.174347
299	215	52	1005	17	D	1	22.030	TP-7000	2452.000	14.70	\N	46077	Dettaglio cesta #5 - Sezione D	2025-11-07 12:15:40.199726	\N	2025-11-07 12:15:40.199726
300	216	52	1004	17	E	1	27.350	TP-7000	2538.000	49.10	\N	35332	Dettaglio cesta #6 - Sezione E	2025-11-07 12:15:40.223589	\N	2025-11-07 12:15:40.223589
301	217	52	1004	17	E	1	14.650	TP-7000	2500.000	70.30	\N	10878	Dettaglio cesta #7 - Sezione E	2025-11-07 12:15:40.244726	\N	2025-11-07 12:15:40.244726
302	224	56	1203	17	D	1	19.620	TP-10000	1360.000	10.00	\N	24015	Dettaglio cesta #1 - Sezione D	2025-11-07 12:15:40.265887	\N	2025-11-07 12:15:40.265887
303	225	56	1203	17	D	1	19.840	TP-10000	1360.000	10.00	\N	24284	Dettaglio cesta #2 - Sezione D	2025-11-07 12:15:40.286948	\N	2025-11-07 12:15:40.286948
304	226	56	1203	17	D	1	23.220	TP-10000	1360.000	10.00	\N	28421	Dettaglio cesta #3 - Sezione D	2025-11-07 12:15:40.308168	\N	2025-11-07 12:15:40.308168
305	227	56	1203	17	D	1	23.890	TP-10000	1360.000	10.00	\N	29241	Dettaglio cesta #4 - Sezione D	2025-11-07 12:15:40.329576	\N	2025-11-07 12:15:40.329576
306	228	56	1203	17	D	1	23.510	TP-10000	1360.000	10.00	\N	28776	Dettaglio cesta #5 - Sezione D	2025-11-07 12:15:40.351035	\N	2025-11-07 12:15:40.351035
307	229	56	1203	17	D	1	22.100	TP-10000	1360.000	10.00	\N	27050	Dettaglio cesta #6 - Sezione D	2025-11-07 12:15:40.373071	\N	2025-11-07 12:15:40.373071
308	230	56	1203	17	D	1	23.720	TP-10000	1360.000	10.00	\N	29033	Dettaglio cesta #7 - Sezione D	2025-11-07 12:15:40.395086	\N	2025-11-07 12:15:40.395086
309	231	56	1203	17	D	1	9.250	TP-10000	1360.000	10.00	\N	11322	Dettaglio cesta #8 - Sezione D	2025-11-07 12:15:40.41631	\N	2025-11-07 12:15:40.41631
310	232	56	1203	17	D	1	20.410	TP-10000	1360.000	10.00	\N	24982	Dettaglio cesta #9 - Sezione D	2025-11-07 12:15:40.437486	\N	2025-11-07 12:15:40.437486
311	233	56	1203	17	D	1	26.550	TP-10000	1360.000	10.00	\N	32497	Dettaglio cesta #10 - Sezione D	2025-11-07 12:15:40.45861	\N	2025-11-07 12:15:40.45861
312	234	56	1203	17	D	1	22.860	TP-10000	1360.000	10.00	\N	27981	Dettaglio cesta #11 - Sezione D	2025-11-07 12:15:40.480165	\N	2025-11-07 12:15:40.480165
313	235	56	1203	17	D	1	18.220	TP-10000	1360.000	10.00	\N	22301	Dettaglio cesta #12 - Sezione D	2025-11-07 12:15:40.501521	\N	2025-11-07 12:15:40.501521
314	236	56	1203	17	D	1	13.250	TP-10000	1360.000	10.00	\N	16218	Dettaglio cesta #13 - Sezione D	2025-11-07 12:15:40.522892	\N	2025-11-07 12:15:40.522892
315	237	57	1204	17	E	1	19.600	TP-10000	1380.000	20.00	\N	21638	Dettaglio cesta #1 - Sezione E	2025-11-07 12:15:40.543946	\N	2025-11-07 12:15:40.543946
316	238	57	1205	17	D	1	21.340	TP-10000	1380.000	20.00	\N	23559	Dettaglio cesta #2 - Sezione D	2025-11-07 12:15:40.565539	\N	2025-11-07 12:15:40.565539
317	239	57	1206	17	C	1	19.660	TP-10000	1380.000	20.00	\N	21705	Dettaglio cesta #3 - Sezione C	2025-11-07 12:15:40.586867	\N	2025-11-07 12:15:40.586867
318	240	57	1206	17	C	1	24.150	TP-10000	1380.000	20.00	\N	26662	Dettaglio cesta #4 - Sezione C	2025-11-07 12:15:40.608319	\N	2025-11-07 12:15:40.608319
319	241	58	1207	17	C	1	28.200	TP-8000	2500.000	50.00	\N	35250	Dettaglio cesta #1 - Sezione C	2025-11-07 12:15:40.629619	\N	2025-11-07 12:15:40.629619
320	242	58	1207	17	C	1	26.600	TP-8000	2500.000	50.00	\N	33250	Dettaglio cesta #2 - Sezione C	2025-11-07 12:15:40.650766	\N	2025-11-07 12:15:40.650766
321	243	59	1243	19	A	1	6.000	TP-7000	3300.000	91.00	\N	1782	Dettaglio cesta #1 - Sezione A	2025-11-07 12:15:40.67308	\N	2025-11-07 12:15:40.67308
322	244	59	1243	19	A	1	16.000	TP-7000	3429.000	79.90	\N	11028	Dettaglio cesta #2 - Sezione A	2025-11-07 12:15:40.694403	\N	2025-11-07 12:15:40.694403
323	245	59	1243	19	A	1	17.000	TP-7000	3563.000	86.20	\N	8359	Dettaglio cesta #3 - Sezione A	2025-11-07 12:15:40.715648	\N	2025-11-07 12:15:40.715648
324	246	59	1243	19	A	1	14.500	TP-7000	3500.000	90.80	\N	4669	Dettaglio cesta #4 - Sezione A	2025-11-07 12:15:40.736827	\N	2025-11-07 12:15:40.736827
325	247	59	1243	19	A	1	18.500	TP-7000	2970.000	91.60	\N	4615	Dettaglio cesta #5 - Sezione A	2025-11-07 12:15:40.757872	\N	2025-11-07 12:15:40.757872
326	248	59	1243	19	A	1	14.200	TP-7000	2980.000	92.40	\N	3216	Dettaglio cesta #6 - Sezione A	2025-11-07 12:15:40.778949	\N	2025-11-07 12:15:40.778949
327	249	59	1243	19	A	1	18.500	TP-10000+	280.000	12.00	\N	4196	Dettaglio cesta #7 - Sezione A	2025-11-07 12:15:40.800101	\N	2025-11-07 12:15:40.800101
328	250	59	1243	19	A	1	30.600	TP-10000	1523.000	24.00	\N	35419	Dettaglio cesta #8 - Sezione A	2025-11-07 12:15:40.822105	\N	2025-11-07 12:15:40.822105
329	251	59	1243	19	A	1	16.500	TP-10000	800.000	40.00	\N	7920	Dettaglio cesta #9 - Sezione A	2025-11-07 12:15:40.843372	\N	2025-11-07 12:15:40.843372
330	252	59	1243	19	A	1	7.400	TP-10000	750.000	1.00	\N	5495	Dettaglio cesta #10 - Sezione A	2025-11-07 12:15:40.864356	\N	2025-11-07 12:15:40.864356
331	253	59	1243	19	A	1	21.500	TP-10000	880.000	33.00	\N	12676	Dettaglio cesta #11 - Sezione A	2025-11-07 12:15:40.88548	\N	2025-11-07 12:15:40.88548
332	254	60	1244	19	A	1	30.700	TP-10000	1450.000	18.00	\N	36502	Dettaglio cesta #1 - Sezione A	2025-11-07 12:15:40.906555	\N	2025-11-07 12:15:40.906555
333	255	60	1244	19	A	1	23.600	TP-10000	1600.000	18.00	\N	30963	Dettaglio cesta #2 - Sezione A	2025-11-07 12:15:40.927793	\N	2025-11-07 12:15:40.927793
334	256	60	1244	19	A	1	25.570	TP-10000	1430.000	16.00	\N	30715	Dettaglio cesta #3 - Sezione A	2025-11-07 12:15:40.949014	\N	2025-11-07 12:15:40.949014
335	257	60	1244	19	A	1	13.300	TP-10000	1790.000	29.50	\N	16784	Dettaglio cesta #4 - Sezione A	2025-11-07 12:15:40.975882	\N	2025-11-07 12:15:40.975882
336	258	60	1244	19	A	1	15.530	TP-10000	810.000	9.00	\N	11447	Dettaglio cesta #5 - Sezione A	2025-11-07 12:15:40.997472	\N	2025-11-07 12:15:40.997472
337	259	60	1244	19	A	1	18.470	TP-7000	3050.000	90.00	\N	5633	Dettaglio cesta #6 - Sezione A	2025-11-07 12:15:41.018936	\N	2025-11-07 12:15:41.018936
338	260	60	1244	19	A	1	20.500	TP-7000	3050.000	90.00	\N	6252	Dettaglio cesta #7 - Sezione A	2025-11-07 12:15:41.040049	\N	2025-11-07 12:15:41.040049
339	261	60	1244	19	A	1	18.450	TP-7000	3050.000	90.00	\N	5627	Dettaglio cesta #8 - Sezione A	2025-11-07 12:15:41.061944	\N	2025-11-07 12:15:41.061944
340	262	60	1244	19	A	1	19.000	TP-7000	3050.000	83.00	\N	9852	Dettaglio cesta #9 - Sezione A	2025-11-07 12:15:41.083364	\N	2025-11-07 12:15:41.083364
341	263	60	1244	19	A	1	17.650	TP-7000	3900.000	64.00	\N	24781	Dettaglio cesta #10 - Sezione A	2025-11-07 12:15:41.104594	\N	2025-11-07 12:15:41.104594
342	264	60	1244	19	A	1	12.550	TP-7000	3900.000	64.00	\N	17620	Dettaglio cesta #11 - Sezione A	2025-11-07 12:15:41.126066	\N	2025-11-07 12:15:41.126066
343	265	60	1244	19	A	1	16.320	TP-7000	3900.000	64.00	\N	22913	Dettaglio cesta #12 - Sezione A	2025-11-07 12:15:41.147524	\N	2025-11-07 12:15:41.147524
344	266	60	1244	19	A	1	13.630	TP-7000	3900.000	64.00	\N	19137	Dettaglio cesta #13 - Sezione A	2025-11-07 12:15:41.168847	\N	2025-11-07 12:15:41.168847
345	267	60	1244	19	A	1	22.570	TP-7000	3900.000	64.00	\N	31688	Dettaglio cesta #14 - Sezione A	2025-11-07 12:15:41.190167	\N	2025-11-07 12:15:41.190167
346	268	60	1244	19	A	1	17.370	TP-7000	3900.000	64.00	\N	24387	Dettaglio cesta #15 - Sezione A	2025-11-07 12:15:41.213201	\N	2025-11-07 12:15:41.213201
347	269	60	1244	19	A	1	15.760	TP-7000	3900.000	64.00	\N	22127	Dettaglio cesta #16 - Sezione A	2025-11-07 12:15:41.234513	\N	2025-11-07 12:15:41.234513
348	289	62	1255	19	B	1	9.000	TP-10000	800.000	4.00	\N	6912	Dettaglio cesta #1 - Sezione B	2025-11-07 12:15:41.25585	\N	2025-11-07 12:15:41.25585
349	290	62	1255	19	B	1	29.460	TP-10000	1600.000	4.00	\N	45251	Dettaglio cesta #2 - Sezione B	2025-11-07 12:15:41.277046	\N	2025-11-07 12:15:41.277046
350	291	62	1255	19	B	1	28.000	TP-10000	1680.000	7.00	\N	43747	Dettaglio cesta #3 - Sezione B	2025-11-07 12:15:41.315618	\N	2025-11-07 12:15:41.315618
351	292	62	1255	19	B	1	28.540	TP-10000	1720.000	4.00	\N	47125	Dettaglio cesta #4 - Sezione B	2025-11-07 12:15:41.33711	\N	2025-11-07 12:15:41.33711
352	293	62	1255	19	B	1	28.150	TP-10000	1680.000	12.00	\N	41617	Dettaglio cesta #5 - Sezione B	2025-11-07 12:15:41.358539	\N	2025-11-07 12:15:41.358539
353	294	62	1255	19	B	1	28.100	TP-7000	1720.000	10.70	\N	43160	Dettaglio cesta #6 - Sezione B	2025-11-07 12:15:41.380018	\N	2025-11-07 12:15:41.380018
354	295	62	1255	19	B	1	20.220	TP-7000	3500.000	14.00	\N	60862	Dettaglio cesta #7 - Sezione B	2025-11-07 12:15:41.401539	\N	2025-11-07 12:15:41.401539
355	296	62	1255	19	B	1	20.750	TP-7000	4000.000	15.70	\N	69969	Dettaglio cesta #8 - Sezione B	2025-11-07 12:15:41.423373	\N	2025-11-07 12:15:41.423373
356	297	62	1255	19	B	1	27.610	TP-7000	4000.000	59.00	\N	45280	Dettaglio cesta #9 - Sezione B	2025-11-07 12:15:41.444776	\N	2025-11-07 12:15:41.444776
357	298	62	1255	19	B	1	23.200	TP-7000	3600.000	61.00	\N	32573	Dettaglio cesta #10 - Sezione B	2025-11-07 12:15:41.466208	\N	2025-11-07 12:15:41.466208
358	299	62	1255	19	B	1	25.150	TP-7000	3600.000	60.00	\N	36216	Dettaglio cesta #11 - Sezione B	2025-11-07 12:15:41.487496	\N	2025-11-07 12:15:41.487496
359	300	62	1255	19	B	1	13.100	TP-7000	3600.000	60.00	\N	18864	Dettaglio cesta #12 - Sezione B	2025-11-07 12:15:41.50881	\N	2025-11-07 12:15:41.50881
360	301	62	1255	19	B	1	17.560	TP-7000	3600.000	60.00	\N	25286	Dettaglio cesta #13 - Sezione B	2025-11-07 12:15:41.530625	\N	2025-11-07 12:15:41.530625
361	302	62	1255	19	B	1	20.550	TP-7000	3600.000	60.00	\N	29592	Dettaglio cesta #14 - Sezione B	2025-11-07 12:15:41.551992	\N	2025-11-07 12:15:41.551992
362	303	62	1255	19	B	1	24.360	TP-7000	3600.000	60.00	\N	35078	Dettaglio cesta #15 - Sezione B	2025-11-07 12:15:41.573371	\N	2025-11-07 12:15:41.573371
363	304	62	1255	19	B	1	25.400	TP-7000	3600.000	60.00	\N	36576	Dettaglio cesta #16 - Sezione B	2025-11-07 12:15:41.594817	\N	2025-11-07 12:15:41.594817
364	305	62	1255	19	B	1	27.500	TP-7000	3600.000	60.00	\N	39600	Dettaglio cesta #17 - Sezione B	2025-11-07 12:15:41.615941	\N	2025-11-07 12:15:41.615941
365	306	62	1255	19	B	1	23.000	TP-7000	3600.000	60.00	\N	33120	Dettaglio cesta #18 - Sezione B	2025-11-07 12:15:41.638417	\N	2025-11-07 12:15:41.638417
366	307	62	1255	19	B	1	16.560	TP-7000	3600.000	55.00	\N	26827	Dettaglio cesta #19 - Sezione B	2025-11-07 12:15:41.65978	\N	2025-11-07 12:15:41.65978
367	314	64	1257	19	B	1	27.000	TP-10000	1900.000	16.00	\N	43092	Dettaglio cesta #1 - Sezione B	2025-11-07 12:15:41.681149	\N	2025-11-07 12:15:41.681149
368	315	64	1257	19	B	1	20.000	TP-5000	4800.000	50.00	\N	48000	Dettaglio cesta #2 - Sezione B	2025-11-07 12:15:41.702915	\N	2025-11-07 12:15:41.702915
369	316	64	1257	19	B	1	9.000	TP-5000	4800.000	50.00	\N	21600	Dettaglio cesta #3 - Sezione B	2025-11-07 12:15:41.724356	\N	2025-11-07 12:15:41.724356
370	317	64	1257	19	B	1	21.500	TP-5000	4800.000	50.00	\N	51600	Dettaglio cesta #4 - Sezione B	2025-11-07 12:15:41.745785	\N	2025-11-07 12:15:41.745785
371	318	65	1270	19	B	1	16.500	TP-10000	1777.000	16.00	\N	24629	Dettaglio cesta #1 - Sezione B	2025-11-07 12:15:41.767005	\N	2025-11-07 12:15:41.767005
372	319	65	1270	19	B	1	22.200	TP-10000	1733.000	16.00	\N	32317	Dettaglio cesta #2 - Sezione B	2025-11-07 12:15:41.788142	\N	2025-11-07 12:15:41.788142
373	320	65	1270	19	B	1	19.000	TP-5000	4613.000	60.00	\N	35059	Dettaglio cesta #3 - Sezione B	2025-11-07 12:15:41.809432	\N	2025-11-07 12:15:41.809432
374	321	65	1270	19	B	1	19.000	TP-5000	4295.000	47.00	\N	43251	Dettaglio cesta #4 - Sezione B	2025-11-07 12:15:41.830761	\N	2025-11-07 12:15:41.830761
375	322	65	1270	19	B	1	20.800	TP-5000	4200.000	34.00	\N	57658	Dettaglio cesta #5 - Sezione B	2025-11-07 12:15:41.852151	\N	2025-11-07 12:15:41.852151
\.


--
-- TOC entry 3981 (class 0 OID 16641)
-- Dependencies: 242
-- Data for Name: external_sales_sync; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.external_sales_sync (id, external_id, sale_number, sale_date, customer_id, customer_name, product_code, product_name, product_category, quantity, unit_of_measure, unit_price, total_amount, discount_percent, discount_amount, net_amount, vat_percent, vat_amount, total_with_vat, payment_method, delivery_date, origin, lot_reference, sales_person, notes, status, synced_at, last_modified_external) FROM stdin;
40	126	126	2025-11-03	0	\N	TP-3000	TP-3000	Molluschi	3000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:35.86373	\N
41	107	107	2025-11-03	0	\N	TP-3000	TP-3000	Molluschi	6000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:35.889474	\N
42	106	106	2025-11-03	0	\N	TP-3000	TP-3000	Molluschi	2000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:35.911588	\N
43	127	127	2025-11-03	0	\N	TP-3500	TP-3500	Molluschi	10000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:35.932836	\N
44	108	108	2025-11-03	0	\N	TP-2000	TP-2000	Molluschi	2000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:35.9547	\N
45	120	120	2025-11-03	0	\N	TP-5000	TP-5000	Molluschi	1000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:35.976363	\N
46	117	117	2025-11-03	0	\N	TP-3000	TP-3000	Molluschi	4000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:35.997917	\N
47	125	125	2025-11-03	0	\N	TP-3000	TP-3000	Molluschi	10000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:36.019522	\N
48	110	110	2025-11-03	0	\N	TP-3000	TP-3000	Molluschi	70000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:36.041509	\N
49	118	118	2025-11-03	0	\N	TP-3000	TP-3000	Molluschi	2000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:36.062906	\N
50	119	119	2025-11-03	0	\N	TP-3000	TP-3000	Molluschi	2000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:36.084457	\N
51	121	121	2025-11-03	0	\N	TP-3000	TP-3000	Molluschi	2000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:36.105915	\N
52	122	122	2025-11-03	0	\N	TP-3000	TP-3000	Molluschi	2000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:36.128462	\N
53	123	123	2025-11-03	0	\N	TP-3000	TP-3000	Molluschi	2000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:36.149804	\N
54	124	124	2025-11-03	0	\N	TP-3000	TP-3000	Molluschi	6000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:36.171685	\N
55	128	128	2025-11-03	0	\N	TP-2000	TP-2000	Molluschi	30000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:36.193117	\N
56	109	109	2025-11-03	0	\N	TP-3000	TP-3000	Molluschi	10000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:36.215938	\N
57	105	105	2025-11-01	214	PICO PALLINO SOCIETA' A RESPONSABILITA' LIMITATA SEMPLIFICATA	TP-8000	TP-8000	Molluschi	1500000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:36.238034	\N
58	90	90	2025-10-31	216	Cliente da Assegnare	TP-3000	TP-3000	Molluschi	6000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:36.259773	\N
59	89	89	2025-10-31	121	Cooperativa GORO & BOSCO	TP-3000	TP-3000	Molluschi	3000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:36.281845	\N
60	96	96	2025-10-09	216	Cliente da Assegnare	TP-3000	TP-3000	Molluschi	3000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:36.303463	\N
61	94	94	2025-10-09	0	\N	TP-3000	TP-3000	Molluschi	6000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:36.324858	\N
62	91	91	2025-10-09	216	Cliente da Assegnare	TP-3000	TP-3000	Molluschi	100000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:36.347532	\N
63	101	101	2025-10-09	216	Cliente da Assegnare	TP-3000	TP-3000	Molluschi	3000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:36.369207	\N
64	97	97	2025-10-09	216	Cliente da Assegnare	TP-3000	TP-3000	Molluschi	2000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:36.391671	\N
65	92	92	2025-10-09	216	Cliente da Assegnare	TP-3000	TP-3000	Molluschi	20000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:36.414234	\N
66	93	93	2025-10-09	216	Cliente da Assegnare	TP-4000	TP-4000	Molluschi	3000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:36.436887	\N
67	99	99	2025-10-09	216	Cliente da Assegnare	TP-3000	TP-3000	Molluschi	2000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:36.458435	\N
68	98	98	2025-10-09	216	Cliente da Assegnare	TP-3000	TP-3000	Molluschi	2000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:36.480676	\N
69	95	95	2025-10-09	216	Cliente da Assegnare	TP-4000	TP-4000	Molluschi	4000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	\N	interno	\N	sistema	Stato: Aperto - Consegna: Non iniziato	Aperto	2025-11-07 12:15:36.502431	\N
70	52	52	2025-09-15	167	Consorzio Coop. Pescatori del Polesine OP soc coop	TP-5000	TP-5000	Molluschi	3000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	2025-09-16	interno	\N	sistema	Stato: Parziale - Consegna: Non iniziato	Parziale	2025-11-07 12:15:36.523989	\N
71	51	51	2025-08-13	29	Cooperativa Pescatori Laghese Società Cooperativa ARL	TP-7000	TP-7000	Molluschi	200000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	2025-08-13	interno	\N	sistema	Stato: Parziale - Consegna: Non iniziato	Parziale	2025-11-07 12:15:36.545617	\N
72	45	45	2025-06-25	21	Coop. Adriatica Gorino	TP-3000	TP-3000	Molluschi	2000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	2025-09-25	interno	\N	sistema	Stato: Parziale - Consegna: Non iniziato	Parziale	2025-11-07 12:15:36.566908	\N
73	46	46	2025-06-25	69	Soc cooperativa Rosa dei Venti	TP-10000	TP-10000	Molluschi	1500000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	2025-10-25	interno	\N	sistema	Stato: Parziale - Consegna: Non iniziato	Parziale	2025-11-07 12:15:36.588942	\N
74	37	37	2025-06-20	125	CO.PE.GO.	TP-10000	TP-10000	Molluschi	24576.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	2025-06-20	interno	\N	sistema	Stato: Completato - Consegna: Non iniziato	Completato	2025-11-07 12:15:36.610625	\N
75	22	22	2025-04-02	22	Coop. La Vela	TP-5000	TP-5000	Molluschi	2100000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	2025-05-15	interno	\N	sistema	Stato: Parziale - Consegna: Non iniziato	Parziale	2025-11-07 12:15:36.632468	\N
76	31	31	2025-04-02	26	Cooperativa del Mare	TP-9000	TP-9000	Molluschi	15000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	2025-06-15	interno	\N	sistema	Stato: Parziale - Consegna: Non iniziato	Parziale	2025-11-07 12:15:36.654267	\N
77	32	32	2025-04-01	80	SOL LEVANTE - SOCIETA' COOPERATIVA	TP-5000	TP-5000	Molluschi	5000000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	2025-04-29	interno	\N	sistema	Stato: Parziale - Consegna: Non iniziato	Parziale	2025-11-07 12:15:36.675675	\N
78	36	36	2025-03-05	22	Coop. La Vela	TP-10000	TP-10000	Molluschi	400000.000	animali	0.0000	0.00	0.00	0.00	0.00	0.00	0.00	0.00	contanti	2025-05-09	interno	\N	sistema	Stato: Completato - Consegna: Non iniziato	Completato	2025-11-07 12:15:36.697283	\N
\.


--
-- TOC entry 4062 (class 0 OID 811009)
-- Dependencies: 323
-- Data for Name: external_users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.external_users (id, delta_operator_id, username, hashed_password, temp_password_token, temp_password_expires_at, first_name, last_name, email, phone, role, is_active, last_sync_at, sync_version, created_at, updated_at) FROM stdin;
1	1	andrea@flupsy.local	$2b$10$Q/Y2G3A3Hp1WCsbQxYMmy.poxVSlH4nIpbbimW.LYg3EWNVkU86MW	\N	\N	Andrea	Andrea	andrea@flupsy.local	\N	operatore	t	2025-11-08 09:41:15.492728	1	2025-11-08 09:41:15.492728	\N
2	2	davide@flupsy.local	$2b$10$gjbVRoKgm3gdvmGrCEHNEuH0vkWAkC/MagJ5sFmWZHm5GTfFitrka	\N	\N	Davide	Davide	davide@flupsy.local	\N	operatore	t	2025-11-08 09:41:15.492728	1	2025-11-08 09:41:15.492728	\N
3	3	mauro@flupsy.local	$2b$10$sNriaxbxgb0PD6jkN3CZJ.mUSIFv69VkUkpP43SnA2BjIsYrpENDe	\N	\N	Mauro	Mauro	mauro@flupsy.local	\N	operatore	t	2025-11-08 09:41:15.492728	1	2025-11-08 09:41:15.492728	\N
4	4	gianluca@flupsy.local	$2b$10$2RzYucmuiz58r3gDNNsDgeBblzhIN0CmyycgXE30Ti1frY1ANYsue	\N	\N	Gianluca	Gianluca	gianluca@flupsy.local	\N	operatore	t	2025-11-08 09:41:15.492728	1	2025-11-08 09:41:15.492728	\N
5	5	diego@flupsy.local	$2b$10$UF5xNNckghfkWHA4g9pWre4Pz4W2SsZd59cuK0BJSB6LmZ5Eb.Yyi	\N	\N	Diego	Diego	diego@flupsy.local	\N	operatore	t	2025-11-08 09:41:15.492728	1	2025-11-08 09:41:15.492728	\N
6	6	ever@flupsy.local	$2b$10$H5Tt8oOy1Eq9YEm4PF03l.WYPxj269lbC9cLh23WT3DC9CuadGm4m	\N	\N	Ever	Ever	ever@flupsy.local	\N	operatore	t	2025-11-08 09:41:15.492728	1	2025-11-08 09:41:15.492728	\N
\.


--
-- TOC entry 3983 (class 0 OID 16659)
-- Dependencies: 244
-- Data for Name: fatture_in_cloud_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fatture_in_cloud_config (id, api_key, api_uid, company_id, access_token, refresh_token, expires_at, token_type, default_payment_method, default_causale_trasporto, default_aspetto_beni, default_porto, numerazione_automatica, prefisso_numero, invio_email_automatico, email_mittente, email_oggetto_template, email_corpo_template, attivo, ragione_sociale, indirizzo, cap, citta, provincia, partita_iva, codice_fiscale, telefono, email, logo_path, created_at, updated_at) FROM stdin;
1	\N	\N	1017299	\N	\N	\N	Bearer	\N	Vendita	Colli	Franco	t	\N	f	\N	\N	\N	t	Ecotapes Soc. Agr. Srl	Via Canal di Valle 5c	30015	Chioggia	VE	04621060278	04621060278	\N	ecotapes.2020@gmail.com	\N	2025-10-07 17:30:20.838329	2025-10-07 17:30:20.838329
3	\N	\N	1052922	\N	\N	\N	Bearer	\N	Vendita	Colli	Franco	t	\N	f	\N	\N	\N	t	Delta Futuro Soc. Agr. Srl	Via Emilia 47	44020	Goro	FE	02057710382	02057710382	+39 3484105353	deltafuturo.goro@gmail.com	\N	2025-10-07 18:19:09.579691	2025-10-07 18:19:09.579691
2	\N	\N	1052922	\N	\N	\N	Bearer	\N	Vendita	Colli	Franco	t	\N	f	\N	\N	\N	t	Delta Futuro Soc. Agr. Srl	Via Emilia 47	44020	Goro	FE	02057710382	02057710382	+39 3484105353	deltafuturo.goro@gmail.com	\N	2025-10-07 17:30:20.838329	2025-10-07 17:30:20.838329
\.


--
-- TOC entry 3985 (class 0 OID 16677)
-- Dependencies: 246
-- Data for Name: flupsys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.flupsys (id, name, location, description, active, max_positions, production_center) FROM stdin;
1012	BINS	ECOTAPES - Ca Pisani	5 bins con 4 cestelli ciascuno, 20 totali 	t	20	Ecotapes Italia
1036	FLUPSY 1 	Ca Pisani	FLUPSY IN ALLUMINIO 	t	20	Ecotapes Italia
1037	FLUPSY 2	Ca Pisani	MINI FLUPSY DEDICATO AGLI ANIMALI DI PICCOLA TAGLIA 	t	10	Ecotapes Italia
1038	FLUPSY 3	Ca Pisani	BIG FLUPSY CON CESTE DA 700 E DA 1000	t	20	
1039	FLUPSY 4	Ca Pisani	FLUPSY ALL. CON P. SOLARI CESTE DA 2000 E 1000 DEDICATO ALLE GRANDI TAGLIE 	t	20	Ecotapes Italia
\.


--
-- TOC entry 4041 (class 0 OID 393217)
-- Dependencies: 302
-- Data for Name: growth_analysis_runs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.growth_analysis_runs (id, executed_at, date_from, date_to, flupsy_ids, analysis_types, status, dataset_size, results, insights, error_message) FROM stdin;
1	2025-11-07 12:14:43.919321	2025-11-07	2025-12-01	\N	\N	completed	5	{"distributions": [], "basketProfiles": [], "executionTimeMs": 6003, "screeningImpacts": []}	{"Nessun dato di crescita disponibile per analisi statistica.","Distribuzione cluster crescita: 0% fast, 0% average, 0% slow.","Variabilità non analizzabile senza campioni o distribuzioni registrati.","Impatto vagliature nullo: 0 screening effettuati.","Assenza di pattern stagionali/temporali per mancanza dati.","Raccomandazione: implementare raccolta dati su crescita e fattori ambientali."}	\N
\.


--
-- TOC entry 4047 (class 0 OID 393248)
-- Dependencies: 308
-- Data for Name: growth_distributions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.growth_distributions (id, analysis_run_id, size_id, lot_id, month, year, sample_size, mean_sgr, median_sgr, std_deviation, percentile_25, percentile_50, percentile_75, percentile_90, min_sgr, max_sgr, distribution_type, raw_data, created_at) FROM stdin;
\.


--
-- TOC entry 3987 (class 0 OID 16688)
-- Dependencies: 248
-- Data for Name: lot_inventory_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lot_inventory_transactions (id, lot_id, date, transaction_type, animal_count, basket_id, operation_id, selection_id, screening_id, notes, metadata, created_at, created_by) FROM stdin;
\.


--
-- TOC entry 3989 (class 0 OID 16698)
-- Dependencies: 250
-- Data for Name: lot_ledger; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lot_ledger (id, date, lot_id, type, quantity, source_cycle_id, dest_cycle_id, selection_id, operation_id, basket_id, allocation_method, allocation_basis, idempotency_key, notes, created_at) FROM stdin;
1	2025-11-05	1	activation	-16414605.000	1	\N	\N	1	21	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-05 13:04:33.24609
2	2025-11-05	2	activation	-2002434.000	2	\N	\N	2	22	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-05 13:05:23.804299
3	2025-11-05	3	activation	-9462050.000	3	\N	\N	3	23	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-05 13:07:30.330926
4	2025-11-06	5	activation	-2103570.000	4	\N	\N	4	61	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-06 12:30:26.404212
5	2025-11-06	5	activation	-2103570.000	5	\N	\N	5	62	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-06 12:47:08.689839
6	2025-11-06	4	activation	-3485769.000	6	\N	\N	6	63	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-06 12:48:50.861009
7	2025-11-06	4	activation	-3348173.000	7	\N	\N	7	64	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-06 12:50:59.264821
8	2025-11-06	4	activation	-2765957.000	8	\N	\N	8	65	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-06 12:54:23.571451
9	2025-11-06	4	activation	-2991337.000	9	\N	\N	9	66	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-06 12:59:23.398489
10	2025-11-06	5	activation	-3001568.000	10	\N	\N	10	67	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-06 13:03:43.716705
11	2025-11-07	10	activation	-124520.000	11	\N	\N	16	71	measured	\N	\N	Auto-generato da operazione prima-attivazione	2025-11-07 13:22:16.097938
\.


--
-- TOC entry 3991 (class 0 OID 16711)
-- Dependencies: 252
-- Data for Name: lot_mortality_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lot_mortality_records (id, lot_id, calculation_date, initial_count, current_count, sold_count, mortality_count, mortality_percentage, created_at, notes) FROM stdin;
\.


--
-- TOC entry 3993 (class 0 OID 16722)
-- Dependencies: 254
-- Data for Name: lots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lots (id, arrival_date, supplier, supplier_lot_number, quality, animal_count, weight, size_id, notes, state, active, external_id, description, origin, total_mortality, last_mortality_date, mortality_notes, created_at) FROM stdin;
4	2025-11-06	Ca Pisani 	tp-700	teste	9599900	100000	15	TRASFERIMENTO DATI APP 	active	t	\N	\N	\N	0	\N	Aggiornato automaticamente da 3 operazioni. Mortalità: 0.00%	2025-11-06 11:58:43.360651
5	2025-11-06	Ca Pisani 	tp-1000	teste	18327853	1000	3	TRASFERIMENTO DATI APP 	active	t	\N	\N	\N	0	\N	Aggiornato automaticamente da 2 operazioni. Mortalità: 0.00%	2025-11-06 12:00:38.907073
10	2025-11-06	Ca Pisani 	TP-2500	teste	5377768	1000	5	TRASFERIMENTO DATI APP 	active	t	\N	\N	\N	0	\N	Aggiornato automaticamente da 0 operazioni. Mortalità: 0.00%	2025-11-06 12:06:51.272113
1	2025-11-05	Ecotapes Zeeland	1	teste	16340000	760	3	animali presenti a ca pisani, spostamento da vecchia APP 	active	t	\N	\N	\N	0	\N	Aggiornato automaticamente da 0 operazioni. Mortalità: 0.00%	2025-11-05 12:45:44.429507
2	2025-11-05	Ecotapes Zeeland	1	teste	2003400	95.4	3	animali presenti a ca pisani, spostamento da vecchia APP 	active	t	\N	\N	\N	0	\N	Aggiornato automaticamente da 0 operazioni. Mortalità: 0.00%	2025-11-05 12:47:10.283102
3	2025-11-05	Ecotapes Zeeland	2	teste	9593653	659	4	animali presenti a ca pisani, spostamento da vecchia APP 	active	t	\N	\N	\N	0	\N	Aggiornato automaticamente da 0 operazioni. Mortalità: 0.00%	2025-11-05 12:49:35.113796
6	2025-11-06	Ca Pisani 	tp-1600	teste	3952942	1000	1	TRASFERIMENTO DATI APP 	active	t	\N	\N	\N	0	\N	\N	2025-11-06 12:03:31.293535
7	2025-11-06	Ca Pisani 	TP-1800	teste	13016730	1000	4	TRASFERIMENTO DATI APP 	active	t	\N	\N	\N	0	\N	\N	2025-11-06 12:04:35.553997
8	2025-11-06	Ca Pisani 	TP-1900	teste	876177	1000	9	TRASFERIMENTO DATI APP 	active	t	\N	\N	\N	0	\N	\N	2025-11-06 12:05:32.006864
11	2025-11-06	Ca Pisani 	TP-2000	teste	4022823	1000	1	TRASFERIMENTO DATI APP 	active	t	\N	\N	\N	0	\N	\N	2025-11-06 12:07:35.844196
12	2025-11-06	Ca Pisani 	TP-3000	teste	1436147	1000	8	TRASFERIMENTO DATI APP 	active	t	\N	\N	\N	0	\N	\N	2025-11-06 12:08:27.940531
13	2025-11-06	Ca Pisani 	TP-3500	teste	502427	1000	10	TRASFERIMENTO DATI APP 	active	t	\N	\N	\N	0	\N	\N	2025-11-06 12:09:11.414655
\.


--
-- TOC entry 3995 (class 0 OID 16735)
-- Dependencies: 256
-- Data for Name: mortality_rates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mortality_rates (id, size_id, month, percentage, notes) FROM stdin;
\.


--
-- TOC entry 3997 (class 0 OID 16744)
-- Dependencies: 258
-- Data for Name: notification_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_settings (id, notification_type, is_enabled, created_at, updated_at, target_size_ids) FROM stdin;
3	vendita	t	2025-10-10 07:58:13.800752	2025-10-10 12:11:02.787382	\N
4	accrescimento	t	2025-10-10 07:58:17.508655	2025-11-07 12:48:39.236598	[19, 17, 15, 16, 9, 7, 12]
\.


--
-- TOC entry 3999 (class 0 OID 16755)
-- Dependencies: 260
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, type, title, message, is_read, created_at, related_entity_type, related_entity_id, data) FROM stdin;
\.


--
-- TOC entry 4001 (class 0 OID 16766)
-- Dependencies: 262
-- Data for Name: operations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.operations (id, date, type, basket_id, cycle_id, size_id, sgr_id, lot_id, animal_count, total_weight, animals_per_kg, average_weight, dead_count, mortality_rate, notes, metadata, source, operator_id, operator_name) FROM stdin;
12	2025-11-07	peso	64	7	10	\N	4	3348173	6200	540028	0	\N	\N	Operazione aggiornata da Andrea il 07/11/2025 alle 09:57:41	\N	mobile_nfc	OP001	Andrea
13	2025-11-07	peso	63	6	10	\N	4	3485769	6200	562221	0	\N	\N	Operazione aggiornata da Andrea il 07/11/2025 alle 10:01:11	\N	mobile_nfc	OP001	Andrea
14	2025-11-07	peso	66	9	12	\N	4	2991337	14000	213667	0	\N	\N	Operazione aggiornata da Andrea il 07/11/2025 alle 10:09:56	\N	mobile_nfc	OP001	Andrea
15	2025-11-07	peso	65	8	12	\N	4	2765957	11400	242628	4.121539	\N	\N	Operazione automatica via NFC - Cestello #5	\N	mobile_nfc	OP001	Andrea
16	2025-11-07	prima-attivazione	71	11	16	\N	10	124520	2033	61250	16.326694	0	90	SPOSTAMENTO DATI APP 	\N	desktop_manager	\N	\N
1	2025-11-05	prima-attivazione	21	1	3	\N	1	16414605	763	21500000	0.046482995	0	\N	questi animali sono divisi su 8 cestelli diversi 	\N	desktop_manager	\N	\N
2	2025-11-05	prima-attivazione	22	2	3	\N	2	2002434	95	21000000	0.04744226	0	\N	\N	\N	desktop_manager	\N	\N
3	2025-11-05	prima-attivazione	23	3	4	\N	3	9462050	650	14557000	0.06869547	0	\N	animali divisi su 4 cestelli 	\N	desktop_manager	\N	\N
4	2025-11-06	prima-attivazione	61	4	9	\N	5	2103570	3100	678571	1.4736853	0	\N	(+1000) TESTE, ANIMALI BELLISSIMI - DA VAGLIARE CON RETE DEL T2000 PLUS	\N	desktop_manager	\N	\N
5	2025-11-06	prima-attivazione	62	5	9	\N	5	2103570	3100	678571	1.4736853	0	\N	(+1000) TESTE, ANIMALI BELLISSIMI - DA VAGLIARE CON RETE DEL T2000 PLUS	\N	desktop_manager	\N	\N
6	2025-11-06	prima-attivazione	63	6	7	\N	4	3485769	2280	1528846	0.6540881	0	\N	(+790) MEDI DEL 1000 ANIMALI PORTATI FUORI IN OTTIME CONIDZIONI - CESTE DA VAGLIARE CON 1500	\N	desktop_manager	\N	\N
7	2025-11-06	prima-attivazione	64	7	7	\N	4	3348173	2190	1528846	0.6540881	0	\N	(+790) ANIMALIPORTATI FUORI IN CONDIZIONI PERFETTE - CESTE DA VAGLIARE CON 1500	\N	desktop_manager	\N	\N
8	2025-11-06	prima-attivazione	65	8	7	\N	4	2765957	1600	1728723	0.57846165	0	\N	(+790) MEDI DI VAGLIATURA BELLISSIMI - DA VAGLIARE CON RETE DEL T2000 PLUS	\N	desktop_manager	\N	\N
9	2025-11-06	prima-attivazione	66	9	10	\N	4	2991337	5207	574468	1.7406932	5	3.57	(+1000) ANIMALI PORTATI FUORI IN CONDIZIONI PERFETTE - DA VAGLIARE CON RETE DEL T2000 PLUS	\N	desktop_manager	\N	\N
10	2025-11-06	prima-attivazione	67	10	9	\N	5	3001568	4633	647887	1.5435265	2	1.43	(+1000) ANIMALIPORTATI FUORI IN CONDIZIONI PERFETTE - DA VAGLIARE CON RETE DEL T2000 PLUS	\N	desktop_manager	\N	\N
11	2025-11-07	peso	67	10	10	\N	5	3001568	8400	357330	0	\N	\N	Operazione aggiornata da Andrea il 07/11/2025 alle 09:53:23	\N	mobile_nfc	OP001	Andrea
\.


--
-- TOC entry 4048 (class 0 OID 434176)
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
-- TOC entry 4050 (class 0 OID 540673)
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
-- TOC entry 4052 (class 0 OID 540687)
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
-- TOC entry 4003 (class 0 OID 16775)
-- Dependencies: 264
-- Data for Name: sale_bags; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sale_bags (id, advanced_sale_id, bag_number, size_code, total_weight, original_weight, weight_loss, animal_count, animals_per_kg, original_animals_per_kg, waste_percentage, notes) FROM stdin;
\.


--
-- TOC entry 4005 (class 0 OID 16786)
-- Dependencies: 266
-- Data for Name: sale_operations_ref; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sale_operations_ref (id, advanced_sale_id, operation_id, basket_id, original_animals, original_weight, original_animals_per_kg, included_in_sale) FROM stdin;
\.


--
-- TOC entry 4007 (class 0 OID 16794)
-- Dependencies: 268
-- Data for Name: screening_basket_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.screening_basket_history (id, screening_id, source_basket_id, source_cycle_id, destination_basket_id, destination_cycle_id, created_at) FROM stdin;
\.


--
-- TOC entry 4009 (class 0 OID 16802)
-- Dependencies: 270
-- Data for Name: screening_destination_baskets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.screening_destination_baskets (id, screening_id, basket_id, cycle_id, category, flupsy_id, "row", "position", position_assigned, animal_count, live_animals, total_weight, animals_per_kg, dead_count, mortality_rate, notes, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4045 (class 0 OID 393238)
-- Dependencies: 306
-- Data for Name: screening_impact_analysis; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.screening_impact_analysis (id, screening_id, analysis_run_id, basket_id, animals_sold, animals_repositioned, avg_sgr_before, avg_sgr_after, selection_bias, fast_growers_removed, slow_growers_retained, distribution_before, distribution_after, created_at) FROM stdin;
\.


--
-- TOC entry 4011 (class 0 OID 16813)
-- Dependencies: 272
-- Data for Name: screening_lot_references; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.screening_lot_references (id, screening_id, destination_basket_id, destination_cycle_id, lot_id, created_at) FROM stdin;
\.


--
-- TOC entry 4013 (class 0 OID 16821)
-- Dependencies: 274
-- Data for Name: screening_operations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.screening_operations (id, date, screening_number, purpose, reference_size_id, status, created_at, updated_at, notes) FROM stdin;
\.


--
-- TOC entry 4015 (class 0 OID 16832)
-- Dependencies: 276
-- Data for Name: screening_source_baskets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.screening_source_baskets (id, screening_id, basket_id, cycle_id, dismissed, position_released, animal_count, total_weight, animals_per_kg, size_id, lot_id, created_at) FROM stdin;
\.


--
-- TOC entry 4017 (class 0 OID 16842)
-- Dependencies: 278
-- Data for Name: selection_basket_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.selection_basket_history (id, selection_id, source_basket_id, source_cycle_id, destination_basket_id, destination_cycle_id, created_at) FROM stdin;
\.


--
-- TOC entry 4019 (class 0 OID 16850)
-- Dependencies: 280
-- Data for Name: selection_destination_baskets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.selection_destination_baskets (id, selection_id, basket_id, cycle_id, destination_type, flupsy_id, "position", animal_count, live_animals, total_weight, animals_per_kg, size_id, dead_count, mortality_rate, sample_weight, sample_count, notes, created_at, updated_at, category) FROM stdin;
\.


--
-- TOC entry 4021 (class 0 OID 16860)
-- Dependencies: 282
-- Data for Name: selection_lot_references; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.selection_lot_references (id, selection_id, destination_basket_id, destination_cycle_id, lot_id, created_at) FROM stdin;
\.


--
-- TOC entry 4023 (class 0 OID 16868)
-- Dependencies: 284
-- Data for Name: selection_source_baskets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.selection_source_baskets (id, selection_id, basket_id, cycle_id, animal_count, total_weight, animals_per_kg, size_id, lot_id, created_at) FROM stdin;
\.


--
-- TOC entry 4060 (class 0 OID 786486)
-- Dependencies: 321
-- Data for Name: selection_task_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.selection_task_assignments (id, task_id, operator_id, status, assigned_at, started_at, completed_at, completion_notes, external_app_synced_at) FROM stdin;
1	2	6	assigned	2025-11-08 09:19:54.520417	\N	\N	\N	\N
2	2	1	assigned	2025-11-08 09:19:54.520417	\N	\N	\N	\N
3	3	5	assigned	2025-11-08 09:28:16.505698	\N	\N	\N	\N
\.


--
-- TOC entry 4058 (class 0 OID 786465)
-- Dependencies: 319
-- Data for Name: selection_task_baskets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.selection_task_baskets (id, task_id, basket_id, role, created_at) FROM stdin;
1	1	61	source	2025-11-08 08:36:21.295619
2	1	64	source	2025-11-08 08:36:21.295619
3	1	66	source	2025-11-08 08:36:21.295619
4	1	67	source	2025-11-08 08:36:21.295619
5	2	61	source	2025-11-08 09:19:54.287348
6	2	64	source	2025-11-08 09:19:54.287348
7	2	65	source	2025-11-08 09:19:54.287348
8	3	66	source	2025-11-08 09:28:16.257508
9	3	67	source	2025-11-08 09:28:16.257508
\.


--
-- TOC entry 4056 (class 0 OID 786446)
-- Dependencies: 317
-- Data for Name: selection_tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.selection_tasks (id, selection_id, task_type, description, priority, status, due_date, created_at, updated_at, completed_at, notes, cadence, cadence_interval) FROM stdin;
2	\N	pesatura	rileva il peso	medium	pending	2025-11-08	2025-11-08 09:19:54.052528	\N	\N		\N	1
3	\N	pulizia	pulire da epibionti	urgent	pending	2025-11-09	2025-11-08 09:28:15.999821	\N	\N		\N	1
1	\N	pesatura		medium	completed	2025-11-09	2025-11-08 08:36:21.060201	2025-11-08 09:41:01.929	2025-11-08 09:41:01.929		weekly	1
\.


--
-- TOC entry 4025 (class 0 OID 16876)
-- Dependencies: 286
-- Data for Name: selections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.selections (id, date, selection_number, purpose, screening_type, reference_size_id, status, created_at, updated_at, notes) FROM stdin;
\.


--
-- TOC entry 4027 (class 0 OID 16887)
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
-- TOC entry 4029 (class 0 OID 16897)
-- Dependencies: 290
-- Data for Name: sgr_giornalieri; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sgr_giornalieri (id, record_date, temperature, ph, ammonia, oxygen, salinity, notes) FROM stdin;
\.


--
-- TOC entry 4039 (class 0 OID 352257)
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
-- TOC entry 4031 (class 0 OID 16906)
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
9	TP-1000	TP-1000	1.2	600000	880001	da medie ponderate storico campionamenti Ca Pisani	#fb923c
10	TP-1140	TP-1140	0	350001	599999		#f87171
28	TP-2800	TP-2800	0	32001	40000		\N
2	TP-180	TP-180	0	70000000	100000000	Taglia tabellare 	#a78bfa
3	TP-250	TP-250	0.25	30000000	70000001	da medie ponderate storico campionamenti Ca Pisani	#818cf8
29	TP-350	TP-350	0.39	15000000	20000001	da medie ponderate storico campionamenti Ca Pisani	\N
4	TP-300	TP-300	0.35	20000000	30000001	da medie ponderate storico campionamenti Ca Pisani	#60a5fa
5	TP-450	TP-450	0.45	8000000	15000001	da medie ponderate storico campionamenti Ca Pisani	#2dd4bf
1	TP-500	TP-500	0.8	2000000	8000001	da medie ponderate storico campionamenti Ca Pisani	#6366f1
7	TP-700	TP-700	0.9	1000000	1900001	da medie ponderate storico campionamenti Ca Pisani	#a3e635
6	TP-600	TP-600	0.85	1900000	2000001	da medie ponderate storico campionamenti Ca Pisani	#4ade80
8	TP-800	TP-800	1	880000	1000001	da medie ponderate storico campionamenti Ca Pisani	#facc15
12	TP-1500	TP-1500	3	190001	300000	da misurazioni sul FLUPSY	#e879f9
15	TP-2000	TP-2000	4	70001	97000	da misurazioni sul FLUPSY	#67e8f9
16	TP-2500	TP-2500	5	41001	70000	da misurazioni sul FLUPSY	#5eead4
17	TP-3000	TP-3000	6.5	20001	29000	da misurazioni sul FLUPSY	#86efac
18	TP-3500	TP-3500	7	15001	20000	da misurazioni sul FLUPSY	#bef264
19	TP-4000	TP-4000	8	9501	15000		#fde047
\.


--
-- TOC entry 4033 (class 0 OID 16917)
-- Dependencies: 294
-- Data for Name: sync_status; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sync_status (id, table_name, last_sync_at, last_sync_success, sync_in_progress, record_count, error_message, created_at, updated_at) FROM stdin;
7	external_deliveries_sync	2025-11-07 12:15:37.943	t	f	52	\N	2025-10-07 13:12:24.124451	2025-11-07 12:15:37.953797
18	external_delivery_details_sync	2025-11-07 12:15:42.4	t	f	200	\N	2025-10-07 13:36:46.459074	2025-11-07 12:15:42.411241
1	external_customers_sync	2025-11-07 12:15:42.421	t	f	146	\N	2025-10-07 13:04:45.671569	2025-11-07 12:15:42.513779
2	external_sales_sync	2025-11-07 12:15:42.421	t	f	39	\N	2025-10-07 13:04:54.54573	2025-11-07 12:15:42.535153
\.


--
-- TOC entry 4035 (class 0 OID 16933)
-- Dependencies: 296
-- Data for Name: target_size_annotations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.target_size_annotations (id, basket_id, target_size_id, predicted_date, status, reached_date, notes, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4054 (class 0 OID 786433)
-- Dependencies: 315
-- Data for Name: task_operators; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_operators (id, first_name, last_name, email, phone, role, active, external_app_user_id, created_at, updated_at, notes) FROM stdin;
1	Andrea	Contato			Tecnico	t	\N	2025-11-08 08:48:07.408553	2025-11-08 08:48:16.071	
4	Diego 	X	\N	\N	\N	t	\N	2025-11-08 09:18:11.822405	\N	\N
5	Ever	Lago	\N	\N	\N	t	\N	2025-11-08 09:18:25.654419	\N	\N
6	Davide 	Boscolo	\N	\N	\N	t	\N	2025-11-08 09:18:37.346741	\N	\N
7	Gianluca	Y	\N	\N	\N	t	\N	2025-11-08 09:18:52.920025	\N	\N
\.


--
-- TOC entry 4037 (class 0 OID 16944)
-- Dependencies: 298
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, password, role, language, last_login, created_at) FROM stdin;
1	operatore_base_2024	$2b$10$xEaO6P3hEY0UW5/zBIfZmuIz2p6OHIQgGy2gGVJRt3zQCfLC/yPuC	user	it	2025-11-08 07:58:12.463	2025-10-08 16:30:49.135692
3	admin	$2b$10$Wx/sehijeI268hX2GAse.O8LVOcu.q0dWcU04d4p0tyBxxLKE.qRS	admin	it	\N	2025-10-20 17:01:46.520269
4	operatore1	$2b$10$Wx/sehijeI268hX2GAse.O8LVOcu.q0dWcU04d4p0tyBxxLKE.qRS	user	it	\N	2025-10-20 17:01:46.520269
5	viewer	$2b$10$Wx/sehijeI268hX2GAse.O8LVOcu.q0dWcU04d4p0tyBxxLKE.qRS	visitor	en	\N	2025-10-20 17:01:46.520269
2	Gianluigi	$2b$10$qndfrNk0912zVUAQ5Z/c2ejj19oQ.GuTD7zatPtuJXwf2ZtCxRuzW	admin	it	2025-11-06 14:52:59.117	2025-10-08 16:36:51.390647
\.


--
-- TOC entry 4122 (class 0 OID 0)
-- Dependencies: 215
-- Name: advanced_sales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.advanced_sales_id_seq', 1, false);


--
-- TOC entry 4123 (class 0 OID 0)
-- Dependencies: 217
-- Name: bag_allocations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.bag_allocations_id_seq', 1, false);


--
-- TOC entry 4124 (class 0 OID 0)
-- Dependencies: 303
-- Name: basket_growth_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.basket_growth_profiles_id_seq', 1, false);


--
-- TOC entry 4125 (class 0 OID 0)
-- Dependencies: 219
-- Name: basket_lot_composition_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.basket_lot_composition_id_seq', 1, false);


--
-- TOC entry 4126 (class 0 OID 0)
-- Dependencies: 221
-- Name: baskets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.baskets_id_seq', 110, true);


--
-- TOC entry 4127 (class 0 OID 0)
-- Dependencies: 223
-- Name: clienti_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.clienti_id_seq', 127, true);


--
-- TOC entry 4128 (class 0 OID 0)
-- Dependencies: 225
-- Name: configurazione_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.configurazione_id_seq', 35, true);


--
-- TOC entry 4129 (class 0 OID 0)
-- Dependencies: 227
-- Name: cycles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cycles_id_seq', 11, true);


--
-- TOC entry 4130 (class 0 OID 0)
-- Dependencies: 229
-- Name: ddt_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ddt_id_seq', 1, false);


--
-- TOC entry 4131 (class 0 OID 0)
-- Dependencies: 231
-- Name: ddt_righe_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ddt_righe_id_seq', 1, false);


--
-- TOC entry 4132 (class 0 OID 0)
-- Dependencies: 233
-- Name: email_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.email_config_id_seq', 4, true);


--
-- TOC entry 4133 (class 0 OID 0)
-- Dependencies: 235
-- Name: external_customers_sync_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.external_customers_sync_id_seq', 292, true);


--
-- TOC entry 4134 (class 0 OID 0)
-- Dependencies: 237
-- Name: external_deliveries_sync_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.external_deliveries_sync_id_seq', 104, true);


--
-- TOC entry 4135 (class 0 OID 0)
-- Dependencies: 239
-- Name: external_delivery_details_sync_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.external_delivery_details_sync_id_seq', 400, true);


--
-- TOC entry 4136 (class 0 OID 0)
-- Dependencies: 241
-- Name: external_sales_sync_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.external_sales_sync_id_seq', 78, true);


--
-- TOC entry 4137 (class 0 OID 0)
-- Dependencies: 322
-- Name: external_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.external_users_id_seq', 6, true);


--
-- TOC entry 4138 (class 0 OID 0)
-- Dependencies: 243
-- Name: fatture_in_cloud_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fatture_in_cloud_config_id_seq', 3, true);


--
-- TOC entry 4139 (class 0 OID 0)
-- Dependencies: 245
-- Name: flupsys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.flupsys_id_seq', 1182, true);


--
-- TOC entry 4140 (class 0 OID 0)
-- Dependencies: 301
-- Name: growth_analysis_runs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.growth_analysis_runs_id_seq', 1, true);


--
-- TOC entry 4141 (class 0 OID 0)
-- Dependencies: 307
-- Name: growth_distributions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.growth_distributions_id_seq', 1, false);


--
-- TOC entry 4142 (class 0 OID 0)
-- Dependencies: 247
-- Name: lot_inventory_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lot_inventory_transactions_id_seq', 1, false);


--
-- TOC entry 4143 (class 0 OID 0)
-- Dependencies: 249
-- Name: lot_ledger_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lot_ledger_id_seq', 11, true);


--
-- TOC entry 4144 (class 0 OID 0)
-- Dependencies: 251
-- Name: lot_mortality_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lot_mortality_records_id_seq', 1, false);


--
-- TOC entry 4145 (class 0 OID 0)
-- Dependencies: 253
-- Name: lots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lots_id_seq', 13, true);


--
-- TOC entry 4146 (class 0 OID 0)
-- Dependencies: 255
-- Name: mortality_rates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.mortality_rates_id_seq', 1, false);


--
-- TOC entry 4147 (class 0 OID 0)
-- Dependencies: 257
-- Name: notification_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notification_settings_id_seq', 4, true);


--
-- TOC entry 4148 (class 0 OID 0)
-- Dependencies: 259
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- TOC entry 4149 (class 0 OID 0)
-- Dependencies: 261
-- Name: operations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.operations_id_seq', 16, true);


--
-- TOC entry 4150 (class 0 OID 0)
-- Dependencies: 310
-- Name: ordini_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ordini_id_seq', 10, true);


--
-- TOC entry 4151 (class 0 OID 0)
-- Dependencies: 312
-- Name: ordini_righe_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ordini_righe_id_seq', 155, true);


--
-- TOC entry 4152 (class 0 OID 0)
-- Dependencies: 263
-- Name: sale_bags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sale_bags_id_seq', 1, false);


--
-- TOC entry 4153 (class 0 OID 0)
-- Dependencies: 265
-- Name: sale_operations_ref_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sale_operations_ref_id_seq', 1, false);


--
-- TOC entry 4154 (class 0 OID 0)
-- Dependencies: 267
-- Name: screening_basket_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.screening_basket_history_id_seq', 1, false);


--
-- TOC entry 4155 (class 0 OID 0)
-- Dependencies: 269
-- Name: screening_destination_baskets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.screening_destination_baskets_id_seq', 1, false);


--
-- TOC entry 4156 (class 0 OID 0)
-- Dependencies: 305
-- Name: screening_impact_analysis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.screening_impact_analysis_id_seq', 1, false);


--
-- TOC entry 4157 (class 0 OID 0)
-- Dependencies: 271
-- Name: screening_lot_references_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.screening_lot_references_id_seq', 1, false);


--
-- TOC entry 4158 (class 0 OID 0)
-- Dependencies: 273
-- Name: screening_operations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.screening_operations_id_seq', 1, false);


--
-- TOC entry 4159 (class 0 OID 0)
-- Dependencies: 275
-- Name: screening_source_baskets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.screening_source_baskets_id_seq', 1, false);


--
-- TOC entry 4160 (class 0 OID 0)
-- Dependencies: 277
-- Name: selection_basket_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.selection_basket_history_id_seq', 1, false);


--
-- TOC entry 4161 (class 0 OID 0)
-- Dependencies: 279
-- Name: selection_destination_baskets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.selection_destination_baskets_id_seq', 1, false);


--
-- TOC entry 4162 (class 0 OID 0)
-- Dependencies: 281
-- Name: selection_lot_references_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.selection_lot_references_id_seq', 1, false);


--
-- TOC entry 4163 (class 0 OID 0)
-- Dependencies: 283
-- Name: selection_source_baskets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.selection_source_baskets_id_seq', 1, false);


--
-- TOC entry 4164 (class 0 OID 0)
-- Dependencies: 320
-- Name: selection_task_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.selection_task_assignments_id_seq', 3, true);


--
-- TOC entry 4165 (class 0 OID 0)
-- Dependencies: 318
-- Name: selection_task_baskets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.selection_task_baskets_id_seq', 9, true);


--
-- TOC entry 4166 (class 0 OID 0)
-- Dependencies: 316
-- Name: selection_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.selection_tasks_id_seq', 3, true);


--
-- TOC entry 4167 (class 0 OID 0)
-- Dependencies: 285
-- Name: selections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.selections_id_seq', 1, false);


--
-- TOC entry 4168 (class 0 OID 0)
-- Dependencies: 289
-- Name: sgr_giornalieri_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sgr_giornalieri_id_seq', 1, false);


--
-- TOC entry 4169 (class 0 OID 0)
-- Dependencies: 287
-- Name: sgr_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sgr_id_seq', 60, true);


--
-- TOC entry 4170 (class 0 OID 0)
-- Dependencies: 299
-- Name: sgr_per_taglia_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sgr_per_taglia_id_seq', 324, true);


--
-- TOC entry 4171 (class 0 OID 0)
-- Dependencies: 291
-- Name: sizes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sizes_id_seq', 39, true);


--
-- TOC entry 4172 (class 0 OID 0)
-- Dependencies: 293
-- Name: sync_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sync_status_id_seq', 50, true);


--
-- TOC entry 4173 (class 0 OID 0)
-- Dependencies: 295
-- Name: target_size_annotations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.target_size_annotations_id_seq', 1, false);


--
-- TOC entry 4174 (class 0 OID 0)
-- Dependencies: 314
-- Name: task_operators_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.task_operators_id_seq', 7, true);


--
-- TOC entry 4175 (class 0 OID 0)
-- Dependencies: 297
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- TOC entry 3639 (class 2606 OID 16489)
-- Name: advanced_sales advanced_sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advanced_sales
    ADD CONSTRAINT advanced_sales_pkey PRIMARY KEY (id);


--
-- TOC entry 3641 (class 2606 OID 16491)
-- Name: advanced_sales advanced_sales_sale_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advanced_sales
    ADD CONSTRAINT advanced_sales_sale_number_unique UNIQUE (sale_number);


--
-- TOC entry 3643 (class 2606 OID 16500)
-- Name: bag_allocations bag_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bag_allocations
    ADD CONSTRAINT bag_allocations_pkey PRIMARY KEY (id);


--
-- TOC entry 3769 (class 2606 OID 393236)
-- Name: basket_growth_profiles basket_growth_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.basket_growth_profiles
    ADD CONSTRAINT basket_growth_profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 3645 (class 2606 OID 16510)
-- Name: basket_lot_composition basket_lot_composition_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.basket_lot_composition
    ADD CONSTRAINT basket_lot_composition_pkey PRIMARY KEY (id);


--
-- TOC entry 3648 (class 2606 OID 16520)
-- Name: baskets baskets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baskets
    ADD CONSTRAINT baskets_pkey PRIMARY KEY (id);


--
-- TOC entry 3658 (class 2606 OID 16540)
-- Name: clienti clienti_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clienti
    ADD CONSTRAINT clienti_pkey PRIMARY KEY (id);


--
-- TOC entry 3660 (class 2606 OID 16553)
-- Name: configurazione configurazione_chiave_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configurazione
    ADD CONSTRAINT configurazione_chiave_unique UNIQUE (chiave);


--
-- TOC entry 3662 (class 2606 OID 16551)
-- Name: configurazione configurazione_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configurazione
    ADD CONSTRAINT configurazione_pkey PRIMARY KEY (id);


--
-- TOC entry 3664 (class 2606 OID 16563)
-- Name: cycles cycles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cycles
    ADD CONSTRAINT cycles_pkey PRIMARY KEY (id);


--
-- TOC entry 3667 (class 2606 OID 16577)
-- Name: ddt ddt_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ddt
    ADD CONSTRAINT ddt_pkey PRIMARY KEY (id);


--
-- TOC entry 3669 (class 2606 OID 16589)
-- Name: ddt_righe ddt_righe_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ddt_righe
    ADD CONSTRAINT ddt_righe_pkey PRIMARY KEY (id);


--
-- TOC entry 3671 (class 2606 OID 16601)
-- Name: email_config email_config_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_config
    ADD CONSTRAINT email_config_key_unique UNIQUE (key);


--
-- TOC entry 3673 (class 2606 OID 16599)
-- Name: email_config email_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_config
    ADD CONSTRAINT email_config_pkey PRIMARY KEY (id);


--
-- TOC entry 3675 (class 2606 OID 16615)
-- Name: external_customers_sync external_customers_sync_external_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_customers_sync
    ADD CONSTRAINT external_customers_sync_external_id_unique UNIQUE (external_id);


--
-- TOC entry 3677 (class 2606 OID 16613)
-- Name: external_customers_sync external_customers_sync_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_customers_sync
    ADD CONSTRAINT external_customers_sync_pkey PRIMARY KEY (id);


--
-- TOC entry 3679 (class 2606 OID 16627)
-- Name: external_deliveries_sync external_deliveries_sync_external_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_deliveries_sync
    ADD CONSTRAINT external_deliveries_sync_external_id_unique UNIQUE (external_id);


--
-- TOC entry 3681 (class 2606 OID 16625)
-- Name: external_deliveries_sync external_deliveries_sync_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_deliveries_sync
    ADD CONSTRAINT external_deliveries_sync_pkey PRIMARY KEY (id);


--
-- TOC entry 3683 (class 2606 OID 16639)
-- Name: external_delivery_details_sync external_delivery_details_sync_external_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_delivery_details_sync
    ADD CONSTRAINT external_delivery_details_sync_external_id_unique UNIQUE (external_id);


--
-- TOC entry 3685 (class 2606 OID 16637)
-- Name: external_delivery_details_sync external_delivery_details_sync_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_delivery_details_sync
    ADD CONSTRAINT external_delivery_details_sync_pkey PRIMARY KEY (id);


--
-- TOC entry 3687 (class 2606 OID 16657)
-- Name: external_sales_sync external_sales_sync_external_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_sales_sync
    ADD CONSTRAINT external_sales_sync_external_id_unique UNIQUE (external_id);


--
-- TOC entry 3689 (class 2606 OID 16655)
-- Name: external_sales_sync external_sales_sync_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_sales_sync
    ADD CONSTRAINT external_sales_sync_pkey PRIMARY KEY (id);


--
-- TOC entry 3795 (class 2606 OID 811022)
-- Name: external_users external_users_delta_operator_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_users
    ADD CONSTRAINT external_users_delta_operator_id_key UNIQUE (delta_operator_id);


--
-- TOC entry 3797 (class 2606 OID 811020)
-- Name: external_users external_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_users
    ADD CONSTRAINT external_users_pkey PRIMARY KEY (id);


--
-- TOC entry 3799 (class 2606 OID 811024)
-- Name: external_users external_users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_users
    ADD CONSTRAINT external_users_username_key UNIQUE (username);


--
-- TOC entry 3691 (class 2606 OID 16675)
-- Name: fatture_in_cloud_config fatture_in_cloud_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fatture_in_cloud_config
    ADD CONSTRAINT fatture_in_cloud_config_pkey PRIMARY KEY (id);


--
-- TOC entry 3693 (class 2606 OID 16686)
-- Name: flupsys flupsys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flupsys
    ADD CONSTRAINT flupsys_pkey PRIMARY KEY (id);


--
-- TOC entry 3767 (class 2606 OID 393226)
-- Name: growth_analysis_runs growth_analysis_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_analysis_runs
    ADD CONSTRAINT growth_analysis_runs_pkey PRIMARY KEY (id);


--
-- TOC entry 3773 (class 2606 OID 393256)
-- Name: growth_distributions growth_distributions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_distributions
    ADD CONSTRAINT growth_distributions_pkey PRIMARY KEY (id);


--
-- TOC entry 3696 (class 2606 OID 16696)
-- Name: lot_inventory_transactions lot_inventory_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lot_inventory_transactions
    ADD CONSTRAINT lot_inventory_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 3698 (class 2606 OID 16709)
-- Name: lot_ledger lot_ledger_idempotency_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lot_ledger
    ADD CONSTRAINT lot_ledger_idempotency_key_unique UNIQUE (idempotency_key);


--
-- TOC entry 3700 (class 2606 OID 16707)
-- Name: lot_ledger lot_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lot_ledger
    ADD CONSTRAINT lot_ledger_pkey PRIMARY KEY (id);


--
-- TOC entry 3702 (class 2606 OID 16720)
-- Name: lot_mortality_records lot_mortality_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lot_mortality_records
    ADD CONSTRAINT lot_mortality_records_pkey PRIMARY KEY (id);


--
-- TOC entry 3704 (class 2606 OID 16733)
-- Name: lots lots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lots
    ADD CONSTRAINT lots_pkey PRIMARY KEY (id);


--
-- TOC entry 3706 (class 2606 OID 16742)
-- Name: mortality_rates mortality_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mortality_rates
    ADD CONSTRAINT mortality_rates_pkey PRIMARY KEY (id);


--
-- TOC entry 3708 (class 2606 OID 16753)
-- Name: notification_settings notification_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 3711 (class 2606 OID 16764)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 3721 (class 2606 OID 16773)
-- Name: operations operations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operations
    ADD CONSTRAINT operations_pkey PRIMARY KEY (id);


--
-- TOC entry 3775 (class 2606 OID 434188)
-- Name: operators operators_operator_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operators
    ADD CONSTRAINT operators_operator_id_key UNIQUE (operator_id);


--
-- TOC entry 3777 (class 2606 OID 434186)
-- Name: operators operators_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operators
    ADD CONSTRAINT operators_pkey PRIMARY KEY (id);


--
-- TOC entry 3779 (class 2606 OID 540685)
-- Name: ordini ordini_fatture_in_cloud_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordini
    ADD CONSTRAINT ordini_fatture_in_cloud_id_key UNIQUE (fatture_in_cloud_id);


--
-- TOC entry 3781 (class 2606 OID 540683)
-- Name: ordini ordini_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordini
    ADD CONSTRAINT ordini_pkey PRIMARY KEY (id);


--
-- TOC entry 3783 (class 2606 OID 540699)
-- Name: ordini_righe ordini_righe_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordini_righe
    ADD CONSTRAINT ordini_righe_pkey PRIMARY KEY (id);


--
-- TOC entry 3723 (class 2606 OID 16784)
-- Name: sale_bags sale_bags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_bags
    ADD CONSTRAINT sale_bags_pkey PRIMARY KEY (id);


--
-- TOC entry 3725 (class 2606 OID 16792)
-- Name: sale_operations_ref sale_operations_ref_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_operations_ref
    ADD CONSTRAINT sale_operations_ref_pkey PRIMARY KEY (id);


--
-- TOC entry 3727 (class 2606 OID 16800)
-- Name: screening_basket_history screening_basket_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_basket_history
    ADD CONSTRAINT screening_basket_history_pkey PRIMARY KEY (id);


--
-- TOC entry 3729 (class 2606 OID 16811)
-- Name: screening_destination_baskets screening_destination_baskets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_destination_baskets
    ADD CONSTRAINT screening_destination_baskets_pkey PRIMARY KEY (id);


--
-- TOC entry 3771 (class 2606 OID 393246)
-- Name: screening_impact_analysis screening_impact_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_impact_analysis
    ADD CONSTRAINT screening_impact_analysis_pkey PRIMARY KEY (id);


--
-- TOC entry 3731 (class 2606 OID 16819)
-- Name: screening_lot_references screening_lot_references_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_lot_references
    ADD CONSTRAINT screening_lot_references_pkey PRIMARY KEY (id);


--
-- TOC entry 3733 (class 2606 OID 16830)
-- Name: screening_operations screening_operations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_operations
    ADD CONSTRAINT screening_operations_pkey PRIMARY KEY (id);


--
-- TOC entry 3735 (class 2606 OID 16840)
-- Name: screening_source_baskets screening_source_baskets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_source_baskets
    ADD CONSTRAINT screening_source_baskets_pkey PRIMARY KEY (id);


--
-- TOC entry 3737 (class 2606 OID 16848)
-- Name: selection_basket_history selection_basket_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_basket_history
    ADD CONSTRAINT selection_basket_history_pkey PRIMARY KEY (id);


--
-- TOC entry 3739 (class 2606 OID 16858)
-- Name: selection_destination_baskets selection_destination_baskets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_destination_baskets
    ADD CONSTRAINT selection_destination_baskets_pkey PRIMARY KEY (id);


--
-- TOC entry 3741 (class 2606 OID 16866)
-- Name: selection_lot_references selection_lot_references_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_lot_references
    ADD CONSTRAINT selection_lot_references_pkey PRIMARY KEY (id);


--
-- TOC entry 3743 (class 2606 OID 16874)
-- Name: selection_source_baskets selection_source_baskets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_source_baskets
    ADD CONSTRAINT selection_source_baskets_pkey PRIMARY KEY (id);


--
-- TOC entry 3793 (class 2606 OID 786496)
-- Name: selection_task_assignments selection_task_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_task_assignments
    ADD CONSTRAINT selection_task_assignments_pkey PRIMARY KEY (id);


--
-- TOC entry 3791 (class 2606 OID 786474)
-- Name: selection_task_baskets selection_task_baskets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_task_baskets
    ADD CONSTRAINT selection_task_baskets_pkey PRIMARY KEY (id);


--
-- TOC entry 3789 (class 2606 OID 786458)
-- Name: selection_tasks selection_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_tasks
    ADD CONSTRAINT selection_tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 3745 (class 2606 OID 16885)
-- Name: selections selections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selections
    ADD CONSTRAINT selections_pkey PRIMARY KEY (id);


--
-- TOC entry 3749 (class 2606 OID 16904)
-- Name: sgr_giornalieri sgr_giornalieri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sgr_giornalieri
    ADD CONSTRAINT sgr_giornalieri_pkey PRIMARY KEY (id);


--
-- TOC entry 3765 (class 2606 OID 352266)
-- Name: sgr_per_taglia sgr_per_taglia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sgr_per_taglia
    ADD CONSTRAINT sgr_per_taglia_pkey PRIMARY KEY (id);


--
-- TOC entry 3747 (class 2606 OID 16895)
-- Name: sgr sgr_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sgr
    ADD CONSTRAINT sgr_pkey PRIMARY KEY (id);


--
-- TOC entry 3751 (class 2606 OID 16915)
-- Name: sizes sizes_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sizes
    ADD CONSTRAINT sizes_code_unique UNIQUE (code);


--
-- TOC entry 3753 (class 2606 OID 16913)
-- Name: sizes sizes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sizes
    ADD CONSTRAINT sizes_pkey PRIMARY KEY (id);


--
-- TOC entry 3755 (class 2606 OID 16929)
-- Name: sync_status sync_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_status
    ADD CONSTRAINT sync_status_pkey PRIMARY KEY (id);


--
-- TOC entry 3757 (class 2606 OID 16931)
-- Name: sync_status sync_status_table_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_status
    ADD CONSTRAINT sync_status_table_name_unique UNIQUE (table_name);


--
-- TOC entry 3759 (class 2606 OID 16942)
-- Name: target_size_annotations target_size_annotations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.target_size_annotations
    ADD CONSTRAINT target_size_annotations_pkey PRIMARY KEY (id);


--
-- TOC entry 3785 (class 2606 OID 786444)
-- Name: task_operators task_operators_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_operators
    ADD CONSTRAINT task_operators_email_key UNIQUE (email);


--
-- TOC entry 3787 (class 2606 OID 786442)
-- Name: task_operators task_operators_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_operators
    ADD CONSTRAINT task_operators_pkey PRIMARY KEY (id);


--
-- TOC entry 3761 (class 2606 OID 16954)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3763 (class 2606 OID 16956)
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- TOC entry 3646 (class 1259 OID 376832)
-- Name: baskets_flupsy_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX baskets_flupsy_id_idx ON public.baskets USING btree (flupsy_id);


--
-- TOC entry 3665 (class 1259 OID 376833)
-- Name: cycles_state_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cycles_state_idx ON public.cycles USING btree (state);


--
-- TOC entry 3649 (class 1259 OID 385034)
-- Name: idx_baskets_current_cycle_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_baskets_current_cycle_id ON public.baskets USING btree (current_cycle_id);


--
-- TOC entry 3650 (class 1259 OID 385035)
-- Name: idx_baskets_cycle_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_baskets_cycle_code ON public.baskets USING btree (cycle_code);


--
-- TOC entry 3651 (class 1259 OID 385024)
-- Name: idx_baskets_flupsy_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_baskets_flupsy_id ON public.baskets USING btree (flupsy_id);


--
-- TOC entry 3652 (class 1259 OID 385026)
-- Name: idx_baskets_flupsy_position; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_baskets_flupsy_position ON public.baskets USING btree (flupsy_id, "row", "position");


--
-- TOC entry 3653 (class 1259 OID 385038)
-- Name: idx_baskets_flupsy_state_cycle; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_baskets_flupsy_state_cycle ON public.baskets USING btree (flupsy_id, state, current_cycle_id);


--
-- TOC entry 3654 (class 1259 OID 385036)
-- Name: idx_baskets_physical_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_baskets_physical_number ON public.baskets USING btree (physical_number);


--
-- TOC entry 3655 (class 1259 OID 385028)
-- Name: idx_baskets_position_not_null; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_baskets_position_not_null ON public.baskets USING btree (flupsy_id, "row", "position") WHERE ("position" IS NOT NULL);


--
-- TOC entry 3656 (class 1259 OID 385025)
-- Name: idx_baskets_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_baskets_state ON public.baskets USING btree (state);


--
-- TOC entry 3800 (class 1259 OID 811027)
-- Name: idx_external_users_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_external_users_active ON public.external_users USING btree (is_active);


--
-- TOC entry 3801 (class 1259 OID 811025)
-- Name: idx_external_users_delta_operator; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_external_users_delta_operator ON public.external_users USING btree (delta_operator_id);


--
-- TOC entry 3802 (class 1259 OID 811026)
-- Name: idx_external_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_external_users_email ON public.external_users USING btree (email);


--
-- TOC entry 3803 (class 1259 OID 811028)
-- Name: idx_external_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_external_users_username ON public.external_users USING btree (username);


--
-- TOC entry 3694 (class 1259 OID 385027)
-- Name: idx_flupsys_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_flupsys_active ON public.flupsys USING btree (active);


--
-- TOC entry 3712 (class 1259 OID 385031)
-- Name: idx_operations_basket_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_operations_basket_id ON public.operations USING btree (basket_id);


--
-- TOC entry 3713 (class 1259 OID 385037)
-- Name: idx_operations_basket_id_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_operations_basket_id_id ON public.operations USING btree (basket_id, id);


--
-- TOC entry 3714 (class 1259 OID 385032)
-- Name: idx_operations_cycle_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_operations_cycle_id ON public.operations USING btree (cycle_id);


--
-- TOC entry 3715 (class 1259 OID 385029)
-- Name: idx_operations_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_operations_date ON public.operations USING btree (date);


--
-- TOC entry 3716 (class 1259 OID 385033)
-- Name: idx_operations_lot_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_operations_lot_id ON public.operations USING btree (lot_id);


--
-- TOC entry 3717 (class 1259 OID 385030)
-- Name: idx_operations_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_operations_type ON public.operations USING btree (type);


--
-- TOC entry 3709 (class 1259 OID 376834)
-- Name: notifications_is_read_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_is_read_idx ON public.notifications USING btree (is_read);


--
-- TOC entry 3718 (class 1259 OID 376835)
-- Name: operations_basket_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX operations_basket_id_idx ON public.operations USING btree (basket_id);


--
-- TOC entry 3719 (class 1259 OID 376836)
-- Name: operations_cycle_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX operations_cycle_id_idx ON public.operations USING btree (cycle_id);


--
-- TOC entry 3809 (class 2620 OID 425985)
-- Name: operations trigger_enrich_mixed_lot_metadata; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_enrich_mixed_lot_metadata BEFORE INSERT ON public.operations FOR EACH ROW EXECUTE FUNCTION public.enrich_mixed_lot_metadata();


--
-- TOC entry 3810 (class 2620 OID 425987)
-- Name: operations trigger_protect_mixed_lot_metadata; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_protect_mixed_lot_metadata BEFORE UPDATE ON public.operations FOR EACH ROW EXECUTE FUNCTION public.protect_mixed_lot_metadata();


--
-- TOC entry 3807 (class 2606 OID 786502)
-- Name: selection_task_assignments selection_task_assignments_operator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_task_assignments
    ADD CONSTRAINT selection_task_assignments_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES public.task_operators(id) ON DELETE CASCADE;


--
-- TOC entry 3808 (class 2606 OID 786497)
-- Name: selection_task_assignments selection_task_assignments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_task_assignments
    ADD CONSTRAINT selection_task_assignments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.selection_tasks(id) ON DELETE CASCADE;


--
-- TOC entry 3805 (class 2606 OID 786480)
-- Name: selection_task_baskets selection_task_baskets_basket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_task_baskets
    ADD CONSTRAINT selection_task_baskets_basket_id_fkey FOREIGN KEY (basket_id) REFERENCES public.baskets(id) ON DELETE CASCADE;


--
-- TOC entry 3806 (class 2606 OID 786475)
-- Name: selection_task_baskets selection_task_baskets_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_task_baskets
    ADD CONSTRAINT selection_task_baskets_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.selection_tasks(id) ON DELETE CASCADE;


--
-- TOC entry 3804 (class 2606 OID 786459)
-- Name: selection_tasks selection_tasks_selection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selection_tasks
    ADD CONSTRAINT selection_tasks_selection_id_fkey FOREIGN KEY (selection_id) REFERENCES public.selections(id) ON DELETE CASCADE;


-- Completed on 2025-11-08 09:51:56 UTC

--
-- PostgreSQL database dump complete
--

