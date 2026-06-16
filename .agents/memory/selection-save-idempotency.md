---
name: Selection basket save must be idempotent
description: Why selection source/destination basket saves must be replace-not-append, and the layered protection in place
---

# Selection (vagliatura) basket save must be replace-not-append

`POST /api/selections/:id/source-baskets` and `.../destination-baskets`
(`addSourceBaskets` / `addDestinationBaskets` in `server/controllers/selection-controller.ts`)
must REPLACE the rows for that selection, not append.

**Why:** the "con mappa" completion flow (`handleCompleteScreening` in
`client/src/pages/VagliaturaConMappa.tsx`) re-POSTs the full source AND destination
basket lists on every "Completa" click, *then* calls `/complete`. When the closure
balance check rejects (e.g. loss over tolerance, status 422), the operator fixes and
clicks again — so the baskets are re-sent on each attempt. An append-only save then
stacks N identical copies of every basket, inflating the destination/origin counts N×
and corrupting the closure balance (`origine = destinazione + mortalità`). The
frontend will not be changed to "save once" because retries are legitimate; the
backend must absorb re-sends safely.

**Layered protection (keep all three):**
1. Each save validates first, then does `delete(where selectionId) + bulk insert`
   inside a single `db.transaction` → idempotent and atomic (no partial state if a
   per-basket validation fails or the request errors mid-way).
2. Status guard: reject the save unless the selection is `draft`, so completed
   vagliature can't be silently overwritten/wiped.
3. DB unique constraints `(selection_id, basket_id)` on both tables
   (`selection_{source,destination}_baskets_selection_basket_unique`) as a hard stop.
   They are declared in `shared/schema.ts` AND created in the DB with matching names,
   so `db:push` sees no drift.

**Cleanup recipe** for already-duplicated rows: delete keeping `min(id)` per
`(selection_id, basket_id)`. Only `draft` selections are ever at risk.
