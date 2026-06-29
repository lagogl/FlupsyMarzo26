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
in ALL THREE places (see next section).

## WHICH path is live (critical — do not be fooled by the filename)
The vagliatura completion that actually runs is the LEGACY `completeSelectionFixed` in
`server/controllers/selection-controller.ts` — the modular route
`server/modules/operations/selections/selections.routes.ts` imports it and shadows the inline
routes.ts route. `selection-controller-fixed.ts` (despite the "fixed" name) is NOT wired up.
The two are divergent forks: legacy has quality-class + lot_ledger audit + emails; fixed has the
cohort block + recomputeLotMortality. **The cohort FASE 3 block now lives in the LEGACY file too**
(determination + create cohort + freeze cohort_composition + set `cycles.cohortId`). So the creation
rule must stay identical across THREE places: legacy `selection-controller.ts`,
`selection-controller-fixed.ts`, and `cohort-backfill.ts`.
**Deliberate omission in legacy:** the fixed file's carry-forward override of `lotPercentages`
(re-derives distribution from the frozen cohort_composition) was NOT ported, to avoid altering the
legacy's existing lot distribution / mortality / quality-class behavior. Cohort ID propagation is
unaffected; only frozen-composition fidelity on mixed-source edge cases can differ — acceptable.

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

## Fase 4 — per-lot estimate + reliability semaphore (DONE)
`cohort-survival.ts` now enriches each cohort: per-lot `estimatedLiveCount = currentLive × frozen
quota` (pro-quota on frozen composition, rounded with largest-remainder so the per-lot sum equals
`currentLiveCount` exactly), per-lot `survivalRate` = the cohort's survivalRate, and a reliability
semaphore `alta|media|bassa`. Score = 0.6·purityRatio + 0.4·dominance, where purityRatio =
(arrivalDate→firstMixDate)/(arrivalDate→today) per lot (PDF: "lotto a lungo puro" = high), dominance
= quota. Thresholds 0.66 / 0.33. Cohort-level reliability = quota-weighted avg of lot scores. UI in
`Coorti.tsx` (semaphore badge on list cards + detail header; per-lot table w/ stima & dot). List
endpoint drops `composition`; detail keeps it. **Why pro-quota stays:** Piano_Sopravvivenza Fase 4
mandates "ripartita in proporzione alla popolazione" — the semaphore communicates the uncertainty
rather than trying to eliminate it.
