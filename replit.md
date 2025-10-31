# FLUPSY Management System

## Overview
The FLUPSY Management System is a web application designed to optimize aquaculture operations, specifically for FLUPSY (Floating Upwelling System) installations. It provides real-time tracking of baskets, cycles, operations, and inventory for shellfish cultivation. Key capabilities include advanced growth forecasting, mortality tracking, and integration with external systems to enhance operational efficiency and provide intelligent insights for sustainable aquaculture practices.

## Recent Changes
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
- **Shared Orders Module**: Direct database connection to external application for collaborative order management. Features dual-write strategy (local + external DB), automatic residual quantity calculation via SQL view, state-based filtering, delivery tracking with app origin attribution, and UI for managing partial deliveries across multiple applications.
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