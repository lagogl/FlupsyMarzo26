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
- **AI Integration**: Hybrid system using DeepSeek-V3 for predictive growth analysis, anomaly detection, sustainability analysis, business analytics, and AI-enhanced performance scoring.
- **AI Report Generator**: Advanced report generation module offering dynamic schema auto-generation, pre-configured templates, multi-format export, preventive validation, conversational memory, intelligent query caching, and AI insights.
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