---
name: Cohort exits vs mortality
description: How cohort/lot survival separates real mortality from declared exits (sale/transfer/re-sort) — the "niente sparizioni" principle.
---

# Cohort survival: mortality vs declared exits

Cohort survival must NOT treat sold/transferred/re-sorted animals as dead.

**Rule:** `mortality = vivi iniziali − vivi correnti − uscite dichiarate`, clamped ≥ 0.
The legacy `survivalRate = currentLive/initial` is kept only for backward compat
(per-lot estimatedLiveCount still derives from it); the trustworthy number is
`mortalityRate` / `realSurvivalRate`.

**Why:** Without this, fully-closed cohorts whose animals were all sold/transferred
showed 0% survival — alarming but false. Most cohorts' real mortality is single-digit %.

**How exits are classified (`computeExitsByCohort` in server/services/cohort-survival.ts):**
- **sold** — `vendita` operations on the cohort's cycles.
- **transferred** — transfer to a destination cycle that did NOT inherit `cohort_id`
  (transfer dest never inherits cohort_id, so it's a genuine exit).
- **resorted** — vagliatura re-mix into a NEW/other cohort (or null-cohort dest):
  trace selection_source_baskets → selection → selection_destination_baskets.
- **EXCLUDED:** carry-forward vagliatura portion (dest keeps the SAME cohort_id) —
  those animals are already in currentLive; counting them would double-count.

`resorted` is a deliberate third exit category beyond the literal "sale/transfer"
scope — required because re-mix cycles move huge volumes; without it mortality is
not trustworthy.

**Allocation MUST be destination-level, not whole-operation gated.** A single
vagliatura is commonly MIXED: part stays in the same cohort (carry-forward), part
sold, part placed into another cohort. Per selection compute total_a (all dest
live), sold_a (sold dest live), and same_a (placed dest live whose dest cohort =
the SOURCE cohort of that cycle — keyed on (selection_id, cohort_id) to handle
multi-cohort selections). Then split the source's animal_count proportionally:
sold = count·sold_a/total_a, resorted = count·GREATEST(total_a−sold_a−same_a,0)/total_a,
carry-forward = count·same_a/total_a (NOT an exit). **Do NOT** gate the whole op
with `NOT (cohort_id = ANY(dest_cohorts))` — that drops all exits whenever any
destination stays in-cohort, inflating mortality. (Also: never use bare
`= ANY(array)` when the array may contain NULL — Postgres returns NULL, not false;
strip with array_remove or avoid the pattern entirely.)

**Clamping:** total exits are clamped to `(initial − currentLive)` and the three
sub-counts rescaled proportionally, so exits never exceed the gap. Leftover gap is
mortality. cessazione/manual closures naturally fall into the mortality residual.

Per-lot estimates (estimatedExitCount/estimatedMortalityCount) use the same
`distributePreservingSum` pro-quota split as estimatedLiveCount, so per-lot sums
reconcile exactly to the cohort totals.

**Plant dashboard headline uses realSurvivalRate, NOT legacy survivalRate.**
The Cruscotto Sopravvivenza weighted survival (`plant-survival.ts` rateByCohort)
must read `cohort.realSurvivalRate` (= 1 − mortalityRate, exits excluded). The legacy
`survivalRate` (currentLive/initial) makes the headline crash to ~30% after any big
wave of vagliature/sales/transfers even with near-zero real mortality (those animals
exited, they didn't die). The trend chart (dst/src at vagliature) is a separate metric
and is correctly left on its own computation.
