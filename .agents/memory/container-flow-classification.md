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

# Canonical production path (confirmed by user, May 2026)

Authoritative sequence: **RACEWAY → (BINS → MINI FLUPSY → FLUPSY) → vendita**.
BINS and MINI FLUPSY are OPTIONAL (can be skipped). Sale happens from FLUPSY **or**
MINI FLUPSY (not only flupsy). Use PATH_ORDER {RACEWAY:0,BINS:1,MINI FLUPSY:2,FLUPSY:3}
and treat a move as "forward/progress" when destIdx > origIdx; everything else is
internal/backward (e.g. raceway→raceway sorting, flupsy→raceway return for sale).

# lot_ledger type semantics (per-lot ledger)

- `activation` (quantity NEGATIVE): animals leave the lot storage pool INTO a cycle = "in coltivazione". Use ABS for "entrati in produzione".
- `transfer_in` / `transfer_out`: internal moves between cycles; net-zero for the lot total alive but DOUBLE-COUNT in any per-stage entrati/usciti sum. Counts are MOVEMENTS not unique animals.
- `mortality`: deaths. Recorded ~100% at LOT level via VAGLIATURA (no basket_id) → looks like "perdite occulte". Attribute to a container via COALESCE(NULLIF(selections.origin,'(altro)'), operation.cesta) to localize where losses happen.
- `sale`: sold; resolve container via basket_id→flupsy.

# Current giacenza (standing inventory) per container — HYBRID allocation

`giacenza attuale` of OUR lots per container category = for each ACTIVE basket take the
authoritative current count (`DISTINCT ON (basket_id)` latest op of type misura/peso/
prima-attivazione, ORDER BY date DESC,id DESC, **AND `cancelled_at IS NULL`**), then
ALLOCATE it to our lots by fraction `our_cnt/tot_cnt` from `basket_lot_composition`
(current cycle) when composition rows exist, else 100% if `cycles.lot_id` supplier matches,
else 0. **Do NOT** use composition.animal_count directly as giacenza (stale vs latest op);
**do NOT** assign full basket count to cycle.lot_id for mixed baskets (over-counts — e.g.
RACEWAY 21.6M full-count vs 1.95M composition-only). The hybrid (latest-count × our-fraction)
is the defensible middle.

**perditaNonSpiegata = saldo(period) − giacenza(current) is only temporally coherent
when the report window starts at lot inception** (the report defaults from 2025-12-01,
the Roem/Ecotapes arrival). For shorter windows the two are different time domains and
the value is meaningless (can go negative) — surfaced as an amber caveat in the UI.

# lot_ledger.basket_id semantics (critical for transfer resolution)

`lot_ledger.basket_id` = **destination** basket for `transfer_in` rows, **source** basket
for `transfer_out` rows (verified: across all transfer rows basket_id always equals either the
source-cycle or dest-cycle basket, never an unrelated one). Use it to resolve a transfer's
destination flupsy: for transfer_in, `basket_id`→flupsy resolves ~784/807 rows vs only ~213
via `dest_cycle→basket` (and ~569 via selection.destination_flupsy_id). **Why so much better:**
dest cycles/baskets are frequently deleted/reorganized after the move, so the dest_cycle FK
dangles; basket_id is written at insert time and survives better. Resolution precedence for a
transfer destination: `selection.destination_flupsy_id` → (transfer_in only) `basket_id`→flupsy
→ `dest_cycle→basket→flupsy`. **Never** use basket_id for the destination of a transfer_out
(there it is the origin). origine for direct transfers still resolved via source_cycle→basket→
**current** flupsy (no historical snapshot except selections' origin_flupsy_id).

**Orphaned-destination data limitation:** some forward moves (e.g. the BINS→mini/flupsy moves in
the Roem/Ecotapes dataset) point to destination baskets/cycles that were fully deleted — they
survive only in `basket_lot_composition` (which has no flupsy link), so the destination flupsy is
unrecoverable. These correctly fall into the matrix "(altro)" column; not a query bug.

# Stage-balance "entrati"/"usciti" definition (May 2026, user rule)

Per-stage `entrati`/`usciti` must NOT sum raw ledger transfer counts — that triple-counts
internal recirculation. User rule: **raceway "entrati" counts ONLY real supplier arrivals**
(activation of Roem/Ecotapes Zeeland lots); raceway↔raceway moves are internal shuffling,
not arrivals (the 231M intra-raceway transfer_in was the false inflation, raceway↔raceway
"prime attivazioni interne" in the user's words).

Implemented model in computeStageBalance:
- `entrati(X)` = forward `transfer_in` (PATH position dest > origine, PATH=
  [RACEWAY,BINS,MINI FLUPSY,FLUPSY] via `array_position`, NULL origine→excluded) + `activation`(ABS) by cesta.
  → raceway has nothing before it, so raceway entrati = supplier activations only (~261.7M). ✓
- `usciti(X)` = non-intra `transfer_in` grouped by ORIGINE (`origine IS DISTINCT FROM destinazione`) + `sale`.
  **Why use transfer_in for usciti, not transfer_out:** ledger transfer_in/transfer_out are NOT
  reliably paired and transfer_out's destination often won't resolve; using forward transfer_in
  by origine for usciti zeroes out bins exits, so use NON-intra (all-direction) transfer_in by origine.
- This combo keeps all saldos coherent/positive (tiny mini negative ~3% = noise, healthy).
- `morti(X)` unchanged (mortality attributed to origine of vagliatura, fallback cesta).

**Why the asymmetry (forward-in for entrati, non-intra-in for usciti):** entrati = genuine
forward progression + external arrivals (returns into a stage aren't new arrivals); usciti =
any departure that isn't pure intra-stage shuffle. Returns (backward) are counted as usciti of
the source but not re-counted as entrati of the destination.

# Implementation

Report module `server/modules/reports/lot-flow/lot-flow.routes.ts` (computeLotFlow matrix,
computeStageBalance, computeCurrentInventory, /lot-flow + /lot-flow/export ExcelJS with
safeCell() formula-injection guard) + page `LotFlowReport.tsx` (route `/flusso-animali`).
The strict chain rarely happens in practice; the report shows the full origin→destination
matrix plus a per-stage balance (entrati/usciti/morti/saldo/giacenza/perdita), not a forced chain.
