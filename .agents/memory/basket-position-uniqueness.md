---
name: Basket position uniqueness
description: Why (flupsy_id,row,position) on baskets must be a DEFERRABLE unique constraint, not a plain unique index.
---

# Basket grid position is cosmetic, but must be unique per slot

`baskets.(row, position)` is **only a visual grid coordinate** — no cycle/operation/inventory
logic depends on it. Different screens handle a position collision differently: the strict
"Visualizzazione FLUPSY" grid renders empty slots as "non attiva" and hides one of two
colliding baskets, while the "Mappa termica" lists baskets and shows both — which looks like
contradictory bugs but is the same underlying data problem.

## The rule
Two baskets must never share the same `(flupsy_id, row, position)`. Enforced by constraint
`baskets_flupsy_row_position_unique`.

**Why:** a stray write left two active baskets at the same DX-3 slot while DX-1 was empty,
making cesta #1 appear "non attiva" in one view and duplicated in another.

## Critical: it MUST be DEFERRABLE INITIALLY IMMEDIATE (not a unique index)
`POST /api/baskets/switch-positions` swaps two baskets. PostgreSQL checks a plain/non-deferrable
unique index **per row**, so a swap hits a transient duplicate and fails with "duplicate key
value violates unique constraint". A DEFERRABLE constraint defers the check to **end of
statement**, so a single-statement swap passes while real duplicates still fail.

**The swap MUST be one atomic `UPDATE ... SET col = CASE WHEN id=a THEN ... ELSE ... END WHERE
id IN (a,b)` statement** — two separate UPDATEs (even in one transaction with INITIALLY
IMMEDIATE) fail the per-statement check. The **active** handler is the modular one
(`server/modules/operations/baskets/baskets.service.ts` `switchPositions`), which wins over the
legacy inline `app.post` in `server/routes.ts` by registration order (`app.use('/api/baskets',
...)` is registered first). The modular service was rewritten from `Promise.all` of two
`updateBasket` calls to the single atomic statement — keep it that way.

**How to apply:** keep it as `ALTER TABLE baskets ADD CONSTRAINT ... UNIQUE(...) DEFERRABLE
INITIALLY IMMEDIATE`. Drizzle schema declares it via `unique("baskets_flupsy_row_position_unique")`
but **cannot express DEFERRABLE** — if `db:push` ever recreates it as non-deferrable, the swap
feature breaks. Re-apply the deferrable ALTER after any such push. Verify with a rolled-back
swap test before declaring done.
