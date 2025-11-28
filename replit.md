# FLUPSY Management System

## Overview
The FLUPSY Management System is a web application designed to optimize aquaculture operations, specifically for FLUPSY (Floating Upwelling System) installations. It provides real-time tracking of baskets, cycles, operations, and inventory for shellfish cultivation. Key capabilities include advanced growth forecasting, mortality tracking, and integration with external systems to enhance operational efficiency and provide intelligent insights for sustainable aquaculture practices.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query
- **UI/UX**: Mobile-first, spreadsheet-like interface with color-coded performance indicators, consistent styling, and enhanced input precision. Configured as a Progressive Web Application (PWA) for offline capabilities.

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
- **SGR Per Taglia System**: Advanced growth rate calculation based on historical data, specific per size category, with automated scheduling, AI data quality validation, and an intelligent fallback chain.
- **AI Integration**: Hybrid system using GPT-4o (OpenAI) for predictive growth analysis, anomaly detection, sustainability analysis, business analytics, and AI-enhanced performance scoring.
- **AI Report Generator**: Advanced report generation module offering dynamic schema auto-generation, pre-configured templates, multi-format export, preventive validation, conversational memory, intelligent query caching, and AI insights.
- **AI Enhanced Module (EXPERIMENTAL)**: Isolated module that provides GPT-4o (ChatGPT Omni) with full database knowledge for natural language queries. Features include: database metadata service (54 tables documented), intelligent SQL query generation, multi-table analysis, API key authentication, table/column whitelisting, query validation, and audit logging. **Migrated from DeepSeek to Claude 3.5 Sonnet (Nov 2024), then to GPT-4o (Nov 2024)** for optimal SQL generation quality, JSON output reliability, and type hint adherence. Uses user's personal OpenAI API key (`OPENAI_API_KEY`). **Security**: Protected by server-side authentication. Blocks access to sensitive tables (`users`, `email_config`) and columns (`password`, `api_key`, `token`). Designed for testing only - requires full authentication system for production use. See `server/modules/ai-enhanced/README.md` for configuration.
- **AI Dashboard Module**: Unified AI module providing predictive growth analysis, anomaly detection, sustainability analysis, and business analytics. **Migrated from DeepSeek to GPT-4o (Nov 2024)** to use the same provider as AI Enhanced. Uses user's personal OpenAI API key (`OPENAI_API_KEY`).
- **Growth Prediction System**: Interactive forecasting with automatic weight calculation from size data, customizable projection, and variable SGR application.
- **DDT System**: Generates transport documents for advanced sales with three-state tracking, immutable customer data snapshots, traceability, subtotals by size, and integration with Fatture in Cloud API.
- **Dynamic Logo System**: Automates company logo integration in PDF reports based on Fatture in Cloud Company ID.
- **NFC Tag Management**: Comprehensive system for programming NFC tags with manual basket state override, timestamp tracking, and robust data storage.
- **Spreadsheet Operations Module**: Mobile-first, editable cell interface for rapid data entry, real-time validation, auto-save, batch operations, and visual performance indicators.
- **Operation Workflow**: Validated user operations are processed server-side, trigger WebSocket notifications, and update inventory calculations, with source tracking.
- **Mixed-Lot Basket Tracking System**: Automatic metadata enrichment for operations on mixed-lot baskets via dual PostgreSQL triggers.
- **FlupsyComparison Dashboard**: Interactive comparison module with dual-mode analysis and comprehensive Excel report exports.
- **Selective FLUPSY Deletion System**: Safe removal of test FLUPSY installations without impacting production data, featuring a preview module, transactional cascade delete, and rigid confirmation protocol.
- **Shared Orders Module**: Direct database connection to external application for collaborative order management with a single shared database, automatic residual quantity calculation, PostgreSQL trigger-based automatic order status updates, and delivery tracking with app origin attribution.
- **Operators Synchronization System**: Event-driven push architecture for synchronizing operators from Delta Futuro (master) to external app database for mobile authentication, including temporary password generation, mandatory first-login password change, and nightly reconciliation.
- **Size Range Protection System**: Database-level protection via foreign key constraint and PostgreSQL trigger to prevent modifications to size ranges after they are used in operations, ensuring historical data integrity.
- **Query Optimization Pattern**: Utilizes simple separate queries, application-side data aggregation with `reduce()`, and `Promise.all()` for parallel enrichment in Drizzle ORM.
- **BasketSelection Data Loading**: Critical page that requires complete datasets - uses `includeAll=true` on all queries (/api/baskets, /api/operations, /api/cycles) to ensure availability indicators (green dots) display correctly for all FLUPSY and sizes with active cycles. Without complete data, paginated results exclude items beyond the first page, causing incorrect UI indicators.
- **Database Constraints**: The `size_id` field in the `operations` table is mandatory (NOT NULL) - every operation MUST have an associated size, regardless of operation type.
- **Animal Count Validation System**: Dual-layer validation (frontend + backend) prevents prima-attivazione operations from exceeding lot's available animal count. Frontend displays real-time balance (total, used, available) with visual alerts and disables submit button when limit exceeded. Backend (operations.service.ts lines 424-463) performs final validation, calculating used animals from existing prima-attivazione operations and rejecting oversubscription with detailed error message.
- **Operation Date Modification**: "Misura" operations support date modification with comprehensive validation. Backend enforces chronological order constraints and prevents duplicate operations on the same date for the same basket. Frontend uses DatePicker component with correct `onSelect` prop integration for date changes. All operation fields except FLUPSY and basket are editable, maintaining immutability of core identifiers.
- **OperationsLifecycleService (Unified Deletion)**: Centralized service (`server/services/operations-lifecycle.service.ts`) that handles ALL operation deletions to prevent basket/cycle/operation state misalignment. **Architecture**: Single entry point for all delete operations, replaces scattered db-storage and operations.service delete logic. **Cascade Order** for prima-attivazione: (1) Pre-fetch operation IDs, (2) Handle basket_lot_composition for all ops, (3) Delete operation_impacts using pre-fetched IDs, (4) Cleanup cycle-related tables, (5) Delete all operations, (6) Delete cycle, (7) Reset basket via atomic setBasketCycleState(). **For normal operations**: (1) Handle basket_lot_composition, (2) Delete operation_impacts, (3) Delete operation, (4) Invalidate caches. **Routes updated**: routes.ts, direct-operations.ts, operations.service.ts all delegate to lifecycle service. **MANDATORY**: All future deletion code paths MUST use OperationsLifecycleService.deleteOperation() - no direct db.delete() calls for operations.
- **Basket State Consistency Invariant (Nov 2024)**: All basket state updates MUST write three fields atomically: `state`, `currentCycleId`, `cycleCode`. **Pattern**: When activating a basket, set `state: 'active'`, `currentCycleId: <cycle_id>`, `cycleCode: '<physicalNumber>-<flupsyId>-<YYMM>'`. When freeing a basket, set `state: 'available'`, `currentCycleId: null`, `cycleCode: null`. **Sold basket semantics**: When basket contents are sold, the physical basket becomes `available` (not `active`) because it's freed for reuse. **CycleCode derivation**: Must use actual `basket.flupsyId` from database, never hardcode fallback to `1`. **Enforced in**: routes.ts, selection-controller.ts, screening-controller.ts, database-consistency-service.ts, operations-lifecycle.service.ts. **Guard**: Consider adding repo-wide check for `update(baskets)` to verify triplet updates.

- **LCI Module (Life Cycle Inventory)** - ECOTAPES Integration: Independent module for Life Cycle Inventory management supporting ECOTAPES project requirements. Provides: materials/equipment inventory with lifecycle tracking, consumables monitoring (energy, fuel, chemicals), consumption logging, automatic production data extraction from existing app (read-only), production snapshots, and Excel report generation for ECOTAPES project. **Architecture**: Completely isolated module with dedicated `lci_*` database tables (6 tables), adapter pattern for read-only access to existing data, no modifications to core app. **Database Tables**: `lci_materials`, `lci_consumables`, `lci_consumption_logs`, `lci_production_snapshots`, `lci_reports`, `lci_settings`. **API**: Available at `/api/lci/*` with endpoints for materials CRUD, consumables CRUD, consumption logs, production snapshots, report generation, and Excel export. **Excel Export**: Generates ECOTAPES-compatible workbook with sheets: Summary (company info, totals), Materials (inventory with annualized weights), Consumables (annual consumption), Production (input/output by size with survival rates). **Frontend**: Full-featured React page at `/lci` with Dashboard, Materials management, Consumables management, Consumption Logs, and Report generation with preview and download. **Feature Flag**: Enabled/disabled via `lci_settings` table - when disabled, API routes are not registered. **Documentation**: See `docs/LCI-INTEGRATION-PLAN.md` for detailed implementation plan and `server/modules/lci/README.md` for API reference. **Status**: COMPLETE - All phases implemented (backend, frontend, Excel export).

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
- OpenAI GPT-4o (for AI capabilities via Replit AI Integrations)
- Fatture in Cloud (for client and DDT management, via OAuth2 authentication and API)