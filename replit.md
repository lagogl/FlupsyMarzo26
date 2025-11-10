# FLUPSY Management System

## Overview
The FLUPSY Management System is a web application designed to optimize aquaculture operations, specifically for FLUPSY (Floating Upwelling System) installations. It provides real-time tracking of baskets, cycles, operations, and inventory for shellfish cultivation. Key capabilities include advanced growth forecasting, mortality tracking, and integration with external systems to enhance operational efficiency and provide intelligent insights for sustainable aquaculture practices.

## Recent Changes
- **2025-11-10**: Enhanced Task Tracking Integration - Added `started_by` and `completed_by` fields to `selection_task_assignments` table for complete operator traceability. External app can now track which operator actually started/completed tasks (vs who was assigned). Enables performance analytics: calculate average execution time per operator, identify bottlenecks, and monitor individual productivity. Created optimized indexes for efficient query performance on temporal analysis. Schema fully aligned with external FLUPSY app integration requirements. Dashboard InfoTicker component now displays scrolling task information showing only today's incomplete tasks with full details (baskets, FLUPSY, operators, notes).
- **2025-11-08**: Designed Operators Synchronization Architecture - Architected event-driven push synchronization system from Delta Futuro to external app database. Delta Futuro is single source of truth for operator management (create/update/deactivate), with automatic push to `external_users` table in shared database for mobile app authentication. Features include: temporary password generation with mandatory first-login change, retry logic with exponential backoff, versioning for conflict resolution, and nightly reconciliation job. Complete developer documentation created (`docs/EXTERNAL_APP_OPERATORS_INTEGRATION.md`) with API specs, authentication flows, edge case handling, and code examples. Migration SQL prepared for `external_users` table. Fixed security issue: removed hardcoded database credentials from `external-db-config.ts`, now using `DATABASE_URL_ESTERNO` environment variable.
- **2025-11-01**: Unified Order Status Management (Opzione C) - Transitioned from dual-field system (`stato` + `statoCalcolato`) to single-source-of-truth approach using PostgreSQL trigger. The `aggiorna_stato_ordine()` trigger automatically updates the `stato` field in `ordini` table whenever deliveries are inserted/updated/deleted in `consegne_condivise`. Both Delta Futuro and external app now read the same `stato` field for perfect consistency. Frontend and backend simplified to use only `stato` (trigger-managed), eliminating manual status calculations. Database states recalculated for all existing orders based on actual deliveries. Documentation created for external app developers explaining trigger-based workflow and prohibition of manual state updates.
- **2025-10-31**: Implemented Shared Orders Module - Direct database connection to external app for order and delivery management without intermediate database. Dual-write strategy: orders sync from Fatture in Cloud to both local DB (backward compatibility) and external app DB (primary source). Automatic residual calculation via SQL view, UI for shared deliveries management.
- **2025-10-29**: Fixed DDT number retrieval from Fatture in Cloud API - now correctly filters by current year and sorts by date (most recent first), then by number (highest first) to retrieve accurate next DDT number for multi-company setup

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
- **SGR Per Taglia System**: Advanced growth rate calculation based on historical data, specific per size category, with an automated monthly scheduler, AI data quality validation, WebSocket-based progress tracking, and an intelligent fallback chain for SGR calculation.
- **AI Integration**: Hybrid system using DeepSeek-V3 for predictive growth analysis, anomaly detection, sustainability analysis, business analytics, and AI-enhanced performance scoring. Includes AI analysis data management linked to database reset operations.
- **AI Report Generator**: Advanced report generation module offering dynamic schema auto-generation, pre-configured templates, multi-format export (Excel, CSV, JSON), preventive validation, conversational memory for iterative refinement, intelligent query caching with real-time invalidation, and AI insights post-extraction.
- **Growth Prediction System**: Interactive forecasting with automatic weight calculation from size data, customizable projection start dates, variable monthly SGR application, and adaptive decimal formatting for weights.
- **DDT System**: Generates transport documents for advanced sales with three-state tracking, immutable customer data snapshots, traceability, subtotals by size, and integration with Fatture in Cloud API.
- **Dynamic Logo System**: Automates company logo integration in PDF reports based on Fatture in Cloud Company ID.
- **NFC Tag Management**: Comprehensive system for programming NFC tags with manual basket state override, timestamp tracking, and a robust tag data storage mechanism (`basket-{basketId}-{timestamp}`) to prevent duplicate values upon tag reuse.
- **Spreadsheet Operations Module**: Mobile-first, editable cell interface for rapid data entry, real-time validation, auto-save, batch operations, and visual performance indicators.
- **Operation Workflow**: Validated user operations are processed server-side, trigger WebSocket notifications, and update inventory calculations, with source tracking (`desktop_manager` or `mobile_nfc`) for all operations.
- **Mixed-Lot Basket Tracking System**: Automatic metadata enrichment for operations on mixed-lot baskets via dual PostgreSQL triggers, ensuring derived field calculation (average_weight, animals_per_kg), metadata enrichment, and immutability protection.
- **FlupsyComparison Dashboard**: Interactive comparison module with dual-mode analysis ("Data Futura" for time-based projections, "Taglia Target" for size-based goals), visual totalizers, and comprehensive Excel report exports.
- **Selective FLUPSY Deletion System**: Safe removal of test FLUPSY installations without impacting production data, featuring a preview module, transactional cascade delete, rigid confirmation protocol, automatic integrity verification, and cache invalidation.
- **Shared Orders Module**: Direct database connection to external application for collaborative order management. Features single shared database (Scenario B), automatic residual quantity calculation via SQL view, PostgreSQL trigger-based automatic order status (trigger updates `stato` field based on deliveries from both apps), delivery tracking with app origin attribution (`app_origine` field), and UI for managing partial deliveries across multiple applications. Order status updates automatically via `aggiorna_stato_ordine()` trigger when deliveries are inserted/updated/deleted in `consegne_condivise` table. Critical rule: apps must NEVER manually update `stato` field - trigger is the single source of truth.
- **Operators Synchronization System**: Event-driven push architecture for synchronizing operators from Delta Futuro (master) to external app database for mobile authentication. When operators are created/modified/deactivated in Delta Futuro, events are pushed to `external_users` table in shared database with retry logic and conflict resolution via versioning (`sync_version`). Features include: temporary password generation with email notification, mandatory password change on first login, JWT-based authentication in external app, automatic revocation on deactivation, and nightly reconciliation job to detect drift. External app queries `external_users` for authentication and calls Delta Futuro API for task retrieval/updates. Field `externalAppUserId` in `task_operators` maps to external app user ID. Comprehensive developer documentation available in `docs/EXTERNAL_APP_OPERATORS_INTEGRATION.md`.
- **Query Optimization Pattern**: Utilizes simple separate queries, application-side data aggregation with `reduce()`, and `Promise.all()` for parallel enrichment in Drizzle ORM.

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
- DeepSeek API (for AI capabilities)
- Fatture in Cloud (for client and DDT management, via OAuth2 authentication and API)