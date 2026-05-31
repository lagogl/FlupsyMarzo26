---
name: Backend auth posture
description: This app's API routes have no server-side authentication; access control lives only in the frontend.
---
The Express backend mounts every module (e.g. `/api/diario`, `/api/buoy-data`, `/api/seneye`) without any auth middleware. There is no `requireAuth`/`isAuthenticated`/API-key check in `server/routes.ts`.

**Why:** Access control is enforced only on the React frontend via `ProtectedRoute` in `client/src/App.tsx`. The API is effectively open to anyone who can reach it.

**How to apply:** Don't add auth to a single new module in isolation — it would be inconsistent with the whole codebase and the frontend gate. If an endpoint triggers expensive/abusable side effects (outbound 3rd-party calls, writes), mitigate at the logic level instead (e.g. throttle/dedup) rather than inventing new backend auth infra.
