---
name: WhatsApp group-send integration
description: Why WhatsApp Web automation is wired in this way and the constraints that shape it
---

# WhatsApp send-to-group (Heatmap "Invia su WhatsApp")

Operator sends the Heatmap alerts panel as an image to a WhatsApp group. Frontend
captures the panel (html2canvas) → backend sends via whatsapp-web.js.

**Why whatsapp-web.js and NOT openWA:** the user asked for `@open-wa/wa-automate`,
but it is **blocked by Replit's package security firewall** (403, flagged Critical
CVE via its `parse-url` dependency). Do not retry installing it. whatsapp-web.js is
the functional equivalent and passes the firewall.

**Why WhatsApp Web automation at all (not the official Meta Cloud API):** the Meta
WhatsApp Cloud API **cannot post to groups** — only individual numbers. Group
sending requires browser-based WhatsApp Web automation. Trade-off accepted: risk of
number ban, and it needs a logged-in browser session.

**Constraints that shape the design:**
- Needs a browser: Chromium installed via Nix system dep `chromium` (puppeteer has
  no bundled chrome here); resolve the path at runtime, don't hardcode the nix store path.
- One-time QR auth: a phone that is a MEMBER of the target group scans the QR.
  Session persisted on disk (LocalAuth, gitignored). QR appears ~15s after connect.
- Connection state is in-memory and resets on every server restart by design; the
  on-disk session keeps auth so it reconnects without re-scanning.
- **Production reliability needs an always-on deployment (Reserved VM).** Autoscale
  (scale-to-zero, ephemeral FS, multiple instances) breaks the persistent browser
  session — a live WhatsApp Web connection cannot survive there.
- API endpoints are unauthenticated to match the rest of this app's API layer (all
  operator/write routes are open; gating is at the UI/login level). The QR endpoint
  is the most sensitive part of that parity choice.
