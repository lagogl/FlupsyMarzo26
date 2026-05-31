---
name: Operations registry loads ALL ops, filters client-side
description: Why /operations must fetch with includeAll and how pagination/filter counts must be derived
---

# Registro Operazioni (/operations) filters client-side over the FULL dataset

The Operations page (`client/src/pages/Operations.tsx`) does all filtering (search,
type, date, flupsy, cycle, lot, stato) **client-side** over the array returned by
`GET /api/operations`. Therefore that fetch MUST return every operation, not a page.

**Why:** the page historically requested only the 500 most-recent rows (date DESC) and
then filtered locally. Once total operations exceeded 500, any operation older than the
500-row cutoff was never sent to the client, so filtering by an older date/type returned
"Nessuna operazione trovata" even though the rows existed in the DB. Users saw an empty
table while the footer still said "di 500".

**How to apply:**
- The query uses `queryKey: ['/api/operations', { includeAll: true }]`. The backend must
  honor `includeAll=true`: `operations.controller` reads `req.query.includeAll==='true'`
  and passes it; `operations.service` skips `.limit/.offset` when set and includes
  `includeAll` in its cache key. `getOperationsOptimized` deliberately does NOT pass it
  (its real pagination is unchanged).
- Pagination is purely a client-side view concern: `totalOperations`/`totalPages` must be
  derived from `filteredOperations.length` (NOT the raw fetched `operations.length`), and
  the rendered rows must be a `paginatedOperations` slice of `filteredOperations` by
  `currentPage`/`pageSize`. Both the desktop table and the `md:hidden` mobile list must
  render the same slice and share the `filteredOperations.length === 0` empty state — the
  mobile list was a separate `operations.map(...)` that bypassed both.
- Reset `currentPage` to 1 when it exceeds the recomputed `totalPages` (e.g. after a
  filter narrows results), or the user lands on a blank page.

**Tradeoff/limit:** returning all rows means the server query grows with data volume
(~3.6s for 2080 rows with the heavy join). Acceptable for now; if it becomes slow, move
filtering server-side (the service already supports `type`/`dateFrom`/`dateTo` filters)
rather than re-capping the fetch.
