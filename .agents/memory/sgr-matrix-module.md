---
name: SGR Matrix module (Matrice SGR Reale)
description: Design conventions for the real SGR Taglia×Mese matrix under ANALISI
---
# Matrice SGR Reale (`/sgr-matrix`, `GET /api/sgr-matrix`)

Computes REAL SGR from operations of ALL cycles (open+closed), grouped into a size×month matrix.

**Conventions (keep consistent):**
- Each cell shows BOTH metrics side by side: SGR-P (from `averageWeight` in mg) and SGR-M (from `animalsPerKg`). Both measure individual growth; formula `((ln(W2)-ln(W1))/days)*100` (for M: `ln(apk1)-ln(apk2)` since apk drops as animals grow).
- A "segment" = consecutive ops within the SAME cycle. Each segment is attributed to the **start month** (op1.date month, calendar 0-11 across all years) and the **start taglia** (taglia of op1).
- Taglia derived from `animalsPerKg`; if null, fall back to `1_000_000 / averageWeight` (averageWeight is mg).
- Plausibility guards: `days >= 5`, `0 < sgr < 10`. Cancelled ops (`cancelledAt`) excluded.
- Deviation column = real (avg of available P,M) − estimated (seed `sgr_per_taglia.calculatedSgr`, month stored as English name).
- flupsyId filter is inferred at read time via `cycle.basketId -> basket.flupsyId` (not historical-accurate if baskets get reassigned).

**Why:** User explicitly chose both-metrics-in-cell + reale-vs-stimato comparison. Start-month/start-taglia attribution mirrors existing `sgr-calculation.service` convention (size at T1).
