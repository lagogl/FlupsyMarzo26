---
name: Session auth & requireAuth
description: Server-side session auth exists; how to protect API routes and its gotchas
---

- Auth is server-side express-session backed by Postgres (`user_sessions` table, connect-pg-simple, cookie `flupsy.sid`). Login/logout/current-user live in the auth module (`server/modules/system/auth`); the inline copies in routes.ts are commented out — don't resurrect them.
- To protect any sensitive API, mount `requireAuth` from the auth module before the router (as done for `/api/ai-chat`). It returns 401 JSON when no session.
- **Why:** APIs were historically unauthenticated; the AI chat endpoint leaked a full plant-data snapshot to anyone with the URL.
- **How to apply:** new sensitive routers get `app.use('/api/x', authModule.requireAuth, router)`. Note most other `/api/*` routes are still open, and `POST /api/register` is public (anyone can create an account) — closing those is separate work.
- Client stores user in localStorage only for UI; the real auth state is the session cookie (same-origin fetches send it by default).
