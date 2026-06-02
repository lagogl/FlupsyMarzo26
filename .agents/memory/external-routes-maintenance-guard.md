---
name: External routes maintenance guard
description: A catch-all guard 503s every /api/external/* route except an explicit allowlist; new external routes must be whitelisted there.
---

`server/routes.ts` registers `app.all("/api/external/*", ...)` that returns 503 ("manutenzione") for ALL `/api/external/*` paths except an explicit allowlist (currently `/api/external/notify-update` and `/api/external/operations`). This guard runs BEFORE `implementDirectOperationRoute(app)` registers the actual external handlers in `server/direct-operations.ts`.

**Why:** Any new `POST /api/external/...` route will be silently shadowed (503) and never reach its real handler/middleware unless you add its exact path to that allowlist `if` condition.

**How to apply:** When adding an external-facing route under `/api/external/`, add its path to the allowlist check in the `app.all("/api/external/*", ...)` guard, then verify reachability (e.g. curl should return 401/handler response, not the 503 maintenance JSON). Note: `direct-operations.ts` exposes `handleDirectOperation` on both the open `/api/direct-operations` (browser, no auth) and the protected `/api/external/operations` (header `x-api-key` === `process.env.SYNC_API_KEY`).
