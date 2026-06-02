---
name: Operations PATCH route shadowing
description: Why edits to app.patch('/api/operations/:id') in server/routes.ts have no effect; the modular router wins.
---

`/api/operations` is mounted as a modular router early in `registerRoutes` (`app.use('/api/operations', operationsModule.operationsRoutes)`). Express matches that router BEFORE the later inline `app.patch('/api/operations/:id', ...)` defined deep in `server/routes.ts`. The modular PATCH (`operations.routes.ts` → `operations.controller.ts` → `operations.service.ts updateOperation`) handles the request and the inline handler in routes.ts is effectively dead code.

**Why:** Server-side logic for editing operations (e.g. peso → recompute animalsPerKg/averageWeight/sizeId) MUST go in `operations.service.ts updateOperation`, not in the routes.ts inline PATCH, or it silently never runs.

**How to apply:** When changing create/update behavior for operations, check which router actually serves the route. POST/PATCH `/api/operations` is served by the modular router; the legacy inline handlers in routes.ts may be shadowed. CREATE for peso also already runs in `direct-operations.ts` (`/api/n` a.k.a `/api/direct-operations`) and the modular POST.
