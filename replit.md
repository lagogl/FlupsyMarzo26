# FLUPSY Management System

## Overview
The FLUPSY Management System is a web application designed to optimize aquaculture operations for FLUPSY installations. It provides real-time tracking of baskets, cycles, operations, and inventory for shellfish cultivation. Its main purpose is to enhance operational efficiency, provide intelligent insights for sustainable aquaculture practices, and offer advanced features like growth forecasting, mortality tracking, and integration with external systems, with the overarching goal of improving business vision and market potential in aquaculture.

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

### Key Features
- **Core Entities**: Manages FLUPSY Systems, Baskets, Cycles, Operations, Lots, Selections/Screenings, Advanced Sales, and DDT (Documento di Trasporto).
- **Business Logic**: Inventory Management, Growth Forecasting (size-specific SGR calculations), Mortality Tracking, External Data Synchronization, Quality Control, and Advanced Sales with DDT Generation.
- **AI Integration**: Hybrid system using GPT-4o for predictive growth analysis, anomaly detection, sustainability analysis, business analytics, AI-enhanced performance scoring, report generation, and experimental natural language database querying.
- **Growth Prediction System**: Interactive forecasting with automatic weight calculation and customizable projections.
- **DDT System**: Generates transport documents with three-state tracking, immutable customer data snapshots, traceability, subtotals by size, and integration with Fatture in Cloud API.
- **Dynamic Logo System**: Automates company logo integration in PDF reports.
- **NFC Tag Management**: System for programming NFC tags with manual basket state override and timestamp tracking.
- **Spreadsheet Operations Module**: Mobile-first, editable cell interface for rapid data entry, real-time validation, auto-save, batch operations, and visual performance indicators.
- **Operation Workflow**: Validated user operations processed server-side, triggering WebSocket notifications and inventory updates.
- **Mixed-Lot Basket Tracking System**: Automatic metadata enrichment for operations on mixed-lot baskets.
- **FlupsyComparison Dashboard**: Interactive comparison module with dual-mode analysis and Excel report exports.
- **Selective FLUPSY Deletion System**: Safe removal of test FLUPSY installations.
- **Shared Orders Module**: Direct database connection to external application for collaborative order management with automatic residual quantity calculation and delivery tracking.
- **Operators Synchronization System**: Event-driven push architecture for synchronizing operators from Delta Futuro to an external app database for mobile authentication.
- **Size Range Protection System**: Database-level protection against modification of size ranges after use.
- **Query Optimization Pattern**: Utilizes simple separate queries, application-side data aggregation with `reduce()`, and `Promise.all()`.
- **Basket Selection Data Loading**: Ensures complete datasets for accurate UI indicators.
- **Animal Count Validation System**: Dual-layer validation (frontend + backend) for operation limits.
- **Operation Date Modification**: Supports date modification for "Misura" operations with validation and chronological order enforcement.
- **OperationsLifecycleService**: Centralized service for handling all operation deletions to prevent state misalignment.
- **Basket State Consistency Invariant**: All basket state updates atomically write `state`, `currentCycleId`, and `cycleCode`, enforced by a PostgreSQL trigger.
- **Persistent FLUPSY Preferences**: Users can save preferred FLUPSY IDs from the Dashboard, filtering relevant dropdowns.
- **Centralized Cache Invalidation**: All cache invalidation uses a single `invalidateAllCaches()` function.
- **External App Cache Notification**: Protected endpoint for external apps to trigger immediate cache invalidation.
- **FK Constraints**: Full referential integrity via foreign key constraints.
- **Nightly Integrity Check System**: Automated scheduler for checking basket state consistency and orphan records.
- **Daily Automatic Backup System**: Automated daily database backup with 7-day retention policy.
- **Audit Logging System**: Tracks critical operations in an `audit_logs` table.
- **Cross-FLUPSY Screening System**: Extended screening module to support basket transfers between different FLUPSY installations, including `is_cross_flupsy` flag and transport metadata.
- **LCI Module (Life Cycle Inventory)**: Independent module for Life Cycle Inventory management, integrated for ECOTAPES project, with dedicated database tables, API, and Excel report generation.
- **AI Recommended Activities Module**: Intelligent operational recommendations system analyzing basket data and generating prioritized activity suggestions (e.g., cleaning, sampling, harvest readiness).
- **Production Variance Analysis Module**: AI-powered production forecast and variance analysis comparing budget targets, orders, and projected production, calculating inventory by size category and seeding requirements.
- **Order Coverage Verification Module**: Dynamic simulation module verifying inventory sufficiency for orders over time, accounting for growth, with monthly snapshots and gap/coverage analysis.
- **Growth Projection Module**: Planning module showing month-by-month progression of current inventory toward a target sale size (default TP-3000), simulating day-by-day growth with mortality.
- **Basket Transfer Module**: Atomic transfer of animals from one active basket to one or more available baskets, with total or partial transfer modes and atomic database transactions.

### Weight Unit Conventions
- **Database Storage**: All weights are stored in **GRAMS**.
- **Form Input**: All weight input fields accept values in **GRAMS** with clear labels.
- **Display Output**: When displaying to users with "Peso (kg)" label, values are divided by 1000 for conversion to kilograms.

### System Design Choices
- **Data Flow**: User input flows from React components to PostgreSQL via TanStack Query, Express API, and Drizzle ORM, with real-time updates via WebSocket.
- **External Integration Flow**: Standardized JSON data exchange with API key authentication, focusing on data consistency and conflict resolution.
- **Deployment Strategy**: Node.js 20 on Replit with PostgreSQL 16 for development; Vite/esbuild for production with autoscale deployment and PWA assets.

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