---
name: Animal count vs mortality convention
description: How live-animal count is derived from a sample, and the rule that mortality must NOT be applied twice.
---

# Live-count from sample: no double mortality discount

**Sampling convention (confirmed by user):** the dead animals ARE included in the
sample weight. Therefore `animalsPerKg` computed as `liveSampleCount / sampleWeight × 1000`
is already a **live-only density over total biomass**.

**The rule:** live count = `animalsPerKg × totalWeight`. Do **NOT** multiply again by
`(1 − mortality)` / survivalRate — that double-discounts and under-counts live animals by
exactly the mortality fraction (e.g. 50% mortality → count halved). The error grows with
mortality and compounds across repeated vagliature (dead accumulate → measured mortality
rises → factors multiply toward zero).

**Why:** the density already excludes dead (live count over a weight that includes dead),
so the dead are subtracted once at the numerator; subtracting again via `(1 − mortality)`
is the bug. Weight of a dead animal is irrelevant — it cancels because it sits in both
sample weight and total weight proportionally (assuming a representative sample).

**How to apply:** any data-entry calc that turns a sample into a basket count
(vagliatura, vendita, prima-attivazione, peso) must use `density × totalWeight` only.
`mortalityRate` is still stored as an informational field. This applies ONLY because dead
are in the sample weight — if a module ever weighs the sample with dead removed, the
`(1 − mortality)` would be needed instead.

## Per-path status (which compute live count)
- **vagliatura "con mappa"**: `DraggableCalculator` (Formula v2) + `VagliaturaConMappa`
  inline `calculateMeasurementValues` (manual dialog). Both fixed to no-survival.
- **operazioni form** (`OperationFormCompact`): `vendita` block and generic/
  `prima-attivazione` block fixed to no-survival. The misura preview block here is
  cosmetic (server overrides).
- **misura**: count is governed SERVER-side by `computeMisuraAnimalCount`
  (`server/utils/misura-mortality.ts`, the "gusci che volano via" rule) used in
  `routes.ts` MISURA ALLINEATA and `server/direct-operations.ts`. It does NOT do
  density×survival (keeps prior count if mortality ≤ historical max, else applies only the
  delta). Leave it — it has no double-discount and is intentional.
- **SpreadsheetOperations**: plain density × totalWeight client-side; misura routed to the
  server gusci rule. No double-discount.
- Taglia/size always uses live density (`animalsPerKg`) and was always correct.

## Historical data
Operations recorded before this fix (formula_version 2 vagliatura destinations, and any
vendita/prima-attivazione with deadCount>0) are under-counted by `(1 − mortality)`. A
backfill would need to multiply the stored `animal_count` by `1/(1 − mortalityRate)` for
those rows — NOT yet done; ask before running it.
