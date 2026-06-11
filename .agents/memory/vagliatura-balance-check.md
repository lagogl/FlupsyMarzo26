---
name: Vagliatura closure balance check (Fase 1 "Niente sparizioni")
description: How the cycle-closure animal balance check works in the vagliatura path and why its thresholds are shaped the way they are.
---

# Vagliatura closure balance check

At vagliatura completion the system enforces the survival invariant **origine = destinazione + mortalità** before closing cycles. Lives in the screening completion controller (the `completeSelectionFixed` flow) and its frontend page.

**Thresholds (two distinct ones — do not collapse them):**
- **±1% balance tolerance** → below this, complete silently (even tiny mortality is recorded, never dropped).
- **≥3% suspicious threshold** → triggers the pre-existing email escalation. This stayed separate; the 1% check is only about blocking/confirmation, not email.

**Three outcomes:**
1. Loss > 1%: server returns `422 { requiresConfirmation: true, code: 'SUSPICIOUS_SCREENING' }`. Operator either confirms (re-calls with `confirmedSuspicious: true` + optional `suspiciousNote`, registering the diff as mortality) or cancels to fix counts.
2. Gain beyond 1% (destination > origin): `422 { code: 'BALANCE_ANOMALY_GAIN', requiresConfirmation: false }` — **non-bypassable**; `confirmedSuspicious` must NOT override it. Operator must correct counts.
3. `origin === 0 && destination > 0`: same non-bypassable `BALANCE_ANOMALY_GAIN` (percentage is undefined, so this needs its own explicit guard placed BEFORE the percentage checks).

**Why:** A symmetric `abs(mortality)/origin` discrepancy means a zero origin makes the % zero, which would silently let impossible gains through — hence the dedicated zero-origin guard. The server does NOT return `selectionId` in 422 bodies; the frontend injects it from the mutation variables so the confirm button can re-call.

**How to apply:** The frontend mutation must NOT throw on these two 422 codes — it maps them to dialog states. Other closure paths (manual closeCycle→pending_closures, advanced-sales, basket-transfer) already force explicit routing; Fase 1 only added this guard to the vagliatura path.
