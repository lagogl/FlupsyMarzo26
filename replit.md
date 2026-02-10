# FLUPSY Management System

## Overview
The FLUPSY Management System is a web application designed to optimize aquaculture operations for FLUPSY installations. It provides real-time tracking of baskets, cycles, operations, and inventory for shellfish cultivation. Its main purpose is to enhance operational efficiency, provide intelligent insights for sustainable aquaculture practices, and offer advanced features like growth forecasting, mortality tracking, and integration with external systems.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query
- **UI/UX**: Mobile-first, spreadsheet-like interface with color-coded performance indicators, consistent styling, and enhanced input precision. Configured as a Progressive Web Application (PWA).

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **Database ORM**: Drizzle ORM
- **API**: RESTful API with external API integration
- **Real-time**: WebSocket communication

### Database
- **Primary Database**: PostgreSQL 16
- **ORM**: Drizzle ORM
- **Schema Management**: Drizzle Kit for migrations
- **External Integration**: Supports separate external database connections for data synchronization.

### Key Features
- **Core Entities**: Manages FLUPSY Systems, Baskets, Cycles, Operations (cleaning, screening, weighing), Lots, Selections/Screenings, Advanced Sales, and DDT (Documento di Trasporto).
- **Business Logic**: Includes Inventory Management, Growth Forecasting (size-specific SGR calculations), Mortality Tracking, External Data Synchronization, Quality Control, and Advanced Sales with DDT Generation.
- **AI Integration**: Hybrid system using GPT-4o for predictive growth analysis, anomaly detection, sustainability analysis, business analytics, and AI-enhanced performance scoring, including an advanced report generator and an experimental AI-enhanced module for natural language database querying.
- **Growth Prediction System**: Interactive forecasting with automatic weight calculation, customizable projection, and variable SGR application.
- **DDT System**: Generates transport documents with three-state tracking, immutable customer data snapshots, traceability, subtotals by size, and integration with Fatture in Cloud API.
- **Dynamic Logo System**: Automates company logo integration in PDF reports.
- **NFC Tag Management**: System for programming NFC tags with manual basket state override and timestamp tracking.
- **Spreadsheet Operations Module**: Mobile-first, editable cell interface for rapid data entry, real-time validation, auto-save, batch operations, and visual performance indicators.
- **Operation Workflow**: Validated user operations are processed server-side, trigger WebSocket notifications, and update inventory calculations.
- **Mixed-Lot Basket Tracking System**: Automatic metadata enrichment for operations on mixed-lot baskets.
- **FlupsyComparison Dashboard**: Interactive comparison module with dual-mode analysis and Excel report exports.
- **Selective FLUPSY Deletion System**: Safe removal of test FLUPSY installations without impacting production data.
- **Shared Orders Module**: Direct database connection to external application for collaborative order management with automatic residual quantity calculation and delivery tracking.
- **Operators Synchronization System**: Event-driven push architecture for synchronizing operators from Delta Futuro to external app database for mobile authentication.
- **Size Range Protection System**: Database-level protection to prevent modifications to size ranges after they are used in operations.
- **Query Optimization Pattern**: Utilizes simple separate queries, application-side data aggregation with `reduce()`, and `Promise.all()` for parallel enrichment.
- **BasketSelection Data Loading**: Ensures complete datasets are loaded for accurate UI indicators.
- **Animal Count Validation System**: Dual-layer validation (frontend + backend) to prevent operations from exceeding lot's available animal count.
- **Operation Date Modification**: Supports date modification for "Misura" operations with comprehensive validation and chronological order enforcement.
- **OperationsLifecycleService**: Centralized service for handling all operation deletions to prevent state misalignment. All future deletion code paths must use this service.
- **Basket State Consistency Invariant**: All basket state updates must atomically write `state`, `currentCycleId`, and `cycleCode`. Enforced by a PostgreSQL trigger.
- **Centralized Cache Invalidation**: All cache invalidation uses a single `invalidateAllCaches()` function.
- **FK Constraints**: Full referential integrity via foreign key constraints for data integrity.
- **Nightly Integrity Check System**: Automated scheduler for checking basket state consistency and orphan records.
- **Daily Automatic Backup System (Jan 2026)**: Automated database backup scheduler running at 02:00 daily with 7-day retention policy. Uses `pg_dump --schema=public` to export all 68+ tables. Old backups beyond retention period are automatically cleaned up. **Files**: `server/services/daily-backup-scheduler.service.ts`. **Manual backups**: Available via `/database-management` page.
- **Audit Logging System**: Tracks critical operations in an `audit_logs` table.
- **Cross-FLUPSY Screening System (Nov 2024)**: Extended screening (vagliatura) module to support basket transfers between different FLUPSY installations. **Schema Extensions**: `selections` table includes `is_cross_flupsy` (boolean flag), `origin_flupsy_id`, `destination_flupsy_id`, and `transport_metadata` (JSONB with operatorName, transportTime, notes for traceability). `selection_source_baskets` includes `flupsy_id` to track source basket's origin FLUPSY. **Frontend (VagliaturaConMappa.tsx)**: Separate origin/destination FLUPSY selection with transport metadata form in riepilogo tab. Cross-FLUPSY indicator badge when origin differs from destination. **Backend (selection-controller.ts)**: `createSelection()` and `addSourceBaskets()` persist all cross-FLUPSY fields with debug logging. **Database Indexes**: Partial indexes on `is_cross_flupsy`, `origin_flupsy_id`, `destination_flupsy_id` for optimized queries. **Migration**: Documented in `docs/migrations/001_data_integrity_constraints.sql` Section 7 with rollback instructions.
- **LCI Module (Life Cycle Inventory)**: Independent module for Life Cycle Inventory management, integrated for ECOTAPES project requirements, with dedicated database tables, API, and Excel report generation.
- **AI Recommended Activities Module (Jan 2026)**: Intelligent operational recommendations system that analyzes basket data and generates prioritized activity suggestions for operators. **Features**: Analyzes days since last cleaning (pulizia), sampling (campionamento/misura), evaluates animals/kg for harvest readiness (raccolta), detects high mortality for urgent attention, suggests grading (calibratura) based on growth rates. **Thresholds**: Cleaning high priority ≥10 days, medium ≥7 days; Sampling high priority ≥10 days, medium ≥6 days. **API**: `GET /api/ai/recommended-activities?flupsyId=optional`. **Frontend**: `/attivita-consigliate` with priority-based card UI (alta/media/suggerimento), FLUPSY filter, auto-refresh every 60 seconds. **Files**: `server/ai/recommended-activities-service.ts`, `client/src/pages/AttivitaConsigliate.tsx`.
- **Production Variance Analysis Module (Jan 2026)**: AI-powered production forecast and variance analysis comparing budget targets, orders, and projected production. **Database**: `production_targets` table stores monthly sales budget by size category (T3, T10) for year 2026 with 276M total seeds. **Features**: Calculates inventory by size category (T1 >30K an/kg, T3 6K-30K an/kg, T10 <6K an/kg), projects production using SGR growth rates, identifies variance between budget and production, calculates seeding requirements with deadlines working backward from target dates, provides status indicators (on_track/warning/critical). **API**: `GET /api/ai/production-forecast?year=`, `GET /api/ai/production-targets`, `POST /api/ai/production-targets`. **Frontend**: `/analisi-scostamenti` with KPI cards, inventory table, seeding requirements, bar charts for T3/T10, detailed monthly variance table. **Files**: `server/ai/production-forecast-service.ts`, `client/src/pages/AnalisiScostamenti.tsx`.
- **Order Coverage Verification Module (Feb 2026)**: Independent dynamic simulation module that verifies if current inventory can satisfy orders over time, accounting for animal growth. **Logic**: Month-by-month simulation starting from current month: takes basket-level inventory → applies SGR growth per month → aggregates by 29 sale sizes → fulfills orders (subtracts from inventory) → captures snapshot with gap/coverage. Uses ProductionForecastService methods (no logic duplication). **API**: `GET /api/verifica-copertura?year=&months=`. **Frontend**: `/verifica-copertura` with 3 tabs: Panoramica (bar chart + monthly table + per-size coverage cards), Dettaglio (size×month matrix with color-coded coverage), Ordini (order list from external DB). **Excel Export**: 3-sheet workbook (Riepilogo Mensile, Dettaglio Taglie, Ordini Dettaglio). **Files**: `server/modules/planning/order-coverage/order-coverage.service.ts`, `client/src/pages/VerificaCoperturaOrdini.tsx`.
- **Growth Projection Module (Feb 2026)**: Planning module showing month-by-month progression of current inventory toward a target sale size (default TP-3000). **Logic**: Groups current basket-level inventory by sale size, then simulates day-by-day growth using SGR rates with mortality, showing projected size and quantity for each month. Separates inventory already at target from inventory still growing. **API**: `GET /api/proiezione-crescita?targetSize=TP-3000&year=2026`. **Frontend**: `/proiezione-crescita` with KPI cards (total inventory, already at target, still growing), summary table for sizes already at target, and detailed month-by-month progression table with color-coded cells (green when target reached) and tooltips. **Files**: `server/modules/planning/growth-projection/growth-projection.service.ts`, `client/src/pages/ProiezioneCrescita.tsx`.

### Weight Unit Conventions (Dec 2024)
- **Database Storage**: All weights (`total_weight` in operations table) are stored in **GRAMS**.
- **Form Input**: All weight input fields accept values in **GRAMS** with labels clearly indicating "(g)" or "(grammi)".
- **Display Output**: When displaying to users with "Peso (kg)" label, always **divide by 1000** to convert from grams to kilograms.
- **Key Files Updated**: NewFlupsyVisualizer.tsx, SimpleFlupsyVisualizer.tsx, VagliaturaConMappa.tsx, BasketSelection.tsx, AdvancedSales.tsx, Baskets.tsx, ScreeningDetail.tsx, Operations.tsx.
- **Export Files**: Excel/CSV exports that show "Peso (kg)" must also divide totalWeight by 1000.

### System Design Choices
- **Data Flow**: User input flows from React components to PostgreSQL via TanStack Query, Express API, and Drizzle ORM, with real-time updates via WebSocket.
- **External Integration Flow**: Standardized JSON data exchange with API key authentication, focusing on data consistency and conflict resolution.
- **Deployment Strategy**: Node.js 20 on Replit with PostgreSQL 16 for development; Vite/esbuild for production with autoscale deployment, PWA assets automatically served.

## External Dependencies

### Core Libraries
- `@tanstack/react-query`
- `drizzle-orm`
- `@neondatabase/serverless`
- `express`
- `pg`
- `ws`

### UI Libraries
- `@radix-ui/***`
- `tailwindcss`
- `lucide-react`
- `react-hook-form`
- `@hookform/resolvers`

### Third-party Integrations
- OpenAI GPT-4o (for AI capabilities)
- Fatture in Cloud (for client and DDT management)