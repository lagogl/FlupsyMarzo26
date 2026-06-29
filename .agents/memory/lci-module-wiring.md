---
name: LCI module wiring
description: Why the LCI (Life Cycle Inventory) module's tables go missing and its routes 404 — three independent gotchas and the durable fixes.
---

# LCI module wiring

Three independent traps caused the LCI module to be broken (tables missing, routes 404).

## 1. LCI tables defined outside drizzle.config scope
The LCI Drizzle tables live in `shared/lci-schema.ts`, but `drizzle.config.ts` lists
ONLY `shared/schema.ts` (and that config file is forbidden to edit). So `drizzle-kit push`
never created them AND would drop them as "out-of-scope" tables.
**Fix / rule:** `shared/schema.ts` must `export * from "./lci-schema"` so the LCI tables
enter Drizzle's scope. If that re-export is ever removed, db:push will drop the LCI tables again.

## 2. Module gated by a config ROW, but Publish copies structure not rows
`lciDataService.isModuleEnabled()` controls whether routes mount. It previously required a
`lci_module_enabled` setting row = true. The Replit Publish flow diffs dev↔prod SCHEMA (DDL),
it does NOT copy data rows, and prod is read-only — so a fresh prod `lci_settings` is empty and
the module would silently stay disabled.
**Fix / rule:** `isModuleEnabled()` defaults to ENABLED, disabled only if the row is explicitly
false. Don't reintroduce a default-false gate that depends on a prod data row.

## 3. Late registration loses to the /api 404 catch-all
`server/index.ts` has a two-phase boot (bind-first warmup, then `buildApp()`). `buildApp()`
registers `app.use('/api', ()=>404)` near the end. Express precedence = registration order, so
ANY router mounted after that catch-all (e.g. from the background-init phase) 404s even though
its log says "Registered successfully".
**Fix / rule:** register feature routers INSIDE `buildApp()` after `registerRoutes` and BEFORE
the `/api` 404 catch-all + vite/serveStatic. Never mount API routes from the background phase.

## Prod propagation
Tables were created in the DEV db directly (dev allows DDL); prod gets them via RE-PUBLISH
(dev↔prod diff). Never run DDL against prod.
