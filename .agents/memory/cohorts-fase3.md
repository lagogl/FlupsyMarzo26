---
name: Cohorts (Fase 3 — coorti di mescolamento)
description: How mixing cohorts work — survival mechanism, creation rules, live/backfill parity. Read before touching cohort logic.
---

# Coorti di mescolamento (Fase 3)

A "coorte" is the unit of measured survival created at a vagliatura mix. It freezes the per-lot
live-count snapshot at mix time and carries it forward as ONE counted unit — no pro-quota
re-estimation. Measured survival = current live ÷ frozen initial.

## Creation rule (MUST stay identical in live path and backfill)
At each completed vagliatura, given source cycles' cohortId and whether any source is "pure"
(no cohort / no cycle), and `totalAnimalsDestination` (live in destination):

- exactly 1 source cohort AND no pure source → **carry forward** the same cohortId (no new snapshot).
- (≥1 source cohort OR mixed lots) AND **totalDest > 0** → **create new cohort** (freeze composition).
- otherwise → **no cohort** (pure lot never mixed; cohortId stays null).

**Why the `totalDest > 0` guard:** without it the live path could create a cohort with
`initialAnimalCount = 0` and empty composition, while backfill skips it → live/backfill divergence.
Both paths now require it. **How to apply:** if you ever edit one path's branch condition, mirror it
in the other (`selection-controller-fixed.ts` cohort-determination block and `cohort-backfill.ts`).

## Frozen composition source differs by path (intentional, equivalent up to rounding)
- Live: `lotPercentages × totalAnimalsDestination`, remainder added to dominant lot.
- Backfill: historical `basket_lot_composition` by `source_selection_id` (verità contata in dest),
  fallback to source lots for legacy selections without that table.
Invariant in both: `SUM(cohort_composition.animal_count) = cohorts.initial_animal_count`.

## Survival read
`cohort-survival.ts`: current live = sum over ACTIVE cohort cycles of the latest operation's
`animal_count` (`DISTINCT ON (cycle_id) ... ORDER BY date DESC, id DESC`), summed per cohort.
survivalRate = currentLive / initialAnimalCount.

## Backfill is idempotent
`POST /api/admin/backfill-cohorts` resets cohort_id + cohorts + cohort_composition, then rebuilds
chronologically. It pre-loads all data in a few bulk queries and writes in batch — NEVER do
per-selection round-trips inside one transaction (the naive version timed out / rolled back on Neon).

## Scope boundary
Precise per-lot numbers and a reliability semaphore are Fase 4 — out of Fase 3 scope.
