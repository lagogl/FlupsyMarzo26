---
name: Container flow classification (raceway/bins/flupsy/mini)
description: How to classify and reconstruct animal movements between container types from lot_ledger + selections
---

# Container types are FLUPSY rows distinguished only by NAME

There is NO separate "container type" column. Raceway, bins, flupsy and mini-flupsy
are all rows in the `flupsys` table, told apart by name pattern:
- `ILIKE '%raceway%'` → RACEWAY (e.g. "RACEWAY DF 1".."6")
- `ILIKE '%bins%'` → BINS (e.g. "BINS Delta Futuro", "BINS Ecotapes")
- `ILIKE '%mini flupsy%'` → MINI FLUPSY (e.g. "FLUPSY 2 (mini flupsy)") — check BEFORE the generic flupsy
- else `ILIKE '%flupsy%'` → FLUPSY

**Why:** the user asked for raceway→bins→flupsy flow analysis; there is no schema concept of these stages, only naming convention. Order of the CASE matters: "mini flupsy" must be matched before plain "flupsy".

# Reconstructing movements between containers

Use `lot_ledger` rows with `type='transfer_in'` (each = animals arriving somewhere).
Origin/destination flupsy must be resolved from TWO sources because the ledger
populates different columns depending on the movement kind:

- **Vagliature (selections)**: ~70% of transfer_in rows have `source_cycle_id` AND
  `dest_cycle_id` NULL but `selection_id` set. For these, origin/dest flupsy come
  from `selections.origin_flupsy_id` / `selections.destination_flupsy_id`.
- **Trasferimenti diretti**: the rest have source/dest cycle ids; derive flupsy via
  `cycle → baskets.flupsy_id`.

Unified rule: `COALESCE(selections.origin_flupsy_id, sourceCycle→basket.flupsy_id)`
and likewise for destination. If you only use cycle→basket and ignore selections,
the vast majority collapses into an unclassifiable "(altro)" bucket.

**Caveat — counts are MOVEMENTS, not unique animals.** transfer_in is event-level;
the same animal passing raceway→bins→flupsy is counted at each hop. Don't sum stages
as if unique. For "arrived at flupsy from outside", exclude FLUPSY/MINI origins to
avoid internal flupsy↔flupsy moves inflating the total.

**Caveat — cycle→basket.flupsy_id is the CURRENT basket position**, not historical.
The selections columns are the authoritative historical origin/dest; prefer them.

# Real-world finding (Roem/Ecotapes, late 2025–mid 2026)

The strict chain raceway→bins→flupsy barely exists. Animals mostly go raceway→raceway
(internal sorting), raceway→mini/flupsy directly; bins is a side/temporary stop and
bins→flupsy is ~0. Report should show the full origin→destination matrix, not a forced chain.

Implemented as report module `server/modules/reports/lot-flow` + page `LotFlowReport.tsx`
(route `/flusso-animali`).
