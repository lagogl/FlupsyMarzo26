---
name: PWA service worker stale-shell lock-in
description: Why the published FLUPSY PWA can show old/broken pages even after redeploys, and how to unblock it
---

## Symptom
The published PWA shows old behaviour (e.g. a page that "always worked" suddenly shows
empty/"Nessuna ... trovata") even though the current code + shared DB are correct and the
same filter logic returns rows when replayed against the live API. Republishing does not
help: the device keeps running an old frontend.

## Why
The DB is a single shared external Neon (one `DATABASE_URL` *secret*, global → dev and the
published app hit the SAME data; the "no production Neon database" agent-tool error is a red
herring, the app does NOT use Replit-managed Postgres). So a dev/prod data split is NOT the
cause. The real cause is the service worker: an older `client/public/sw.js` cached the app
shell **Cache-First for navigations (`/`)**, pinning installed PWA clients to a stale shell.
`client/index.html` only *unregisters* the SW now, but a locked client never loads the new
index.html, so it never unregisters → deadlock.

## How to apply
- To unblock stale clients, ship a **self-destructing "kill switch" `sw.js`**: on `activate`
  delete all caches, `registration.unregister()`, then `clients.matchAll({type:'window'})`
  and `client.navigate(client.url)` to force a fresh network load. Browsers re-fetch the
  registered SW script independently of the SW fetch handler, so old clients DO pick it up —
  but only when the device opens the app **online** at least once after deploy.
- Manual fallback for stubborn devices: clear site data / reinstall the PWA.
- **Why kill-switch over a new caching SW:** avoids re-introducing stale-shell lock-in. If a
  SW is ever reintroduced, use network-first for navigations + explicit version/update UX.
- Diagnostic shortcut: replay the client-side filter against `/api/operations?includeAll=true`
  in Node; if it returns rows, the bug is client/cache, not data or server.
