---
name: drizzle-kit push _key vs _unique drift
description: Why post-merge db:push hangs on interactive truncate prompts and how to resolve it safely
---

## Symptom
`scripts/post-merge.sh` runs `npm run db:push` (= `drizzle-kit push`) and hangs for the
full timeout. stdout shows an interactive prompt like: "You're about to add
`<table>_<col>_unique` unique constraint to the table, which contains N items ... Do you
want to truncate <table> table? ❯ No, add without truncating / Yes, truncate". stdin is
closed during post-merge, so the TUI prompt never gets an answer and the script stalls.

## Root cause
The unique constraint ALREADY exists in the DB under Postgres' default name
`<table>_<col>_key`, but a column declared `.unique()` in `shared/schema.ts` makes
drizzle-kit expect the name `<table>_<col>_unique`. The names differ → drizzle reports
drift and prompts. It is a pure NAME mismatch — no duplicate data, nothing truncated.

## Fix (two parts)
1. Make push non-interactive: post-merge script uses `npm run db:push -- --force`.
   `--force` only applies the schema-declared changes; for these name mismatches it does
   NOT truncate (verified: row counts preserved, no duplicate constraint created).
2. Resolve the drift cleanly so the alarming prompt stops recurring:
   `ALTER TABLE <t> RENAME CONSTRAINT <t>_<col>_key TO <t>_<col>_unique;`
   Only rename constraints whose column is actually declared `.unique()` in schema.ts.
   Renaming a NON-schema-tracked unique to `_unique` creates the REVERSE drift, so leave
   those alone (e.g. constraints created via raw SQL, and composite uniques).

## How to find the ones to rename
- List DB `_key` uniques: `SELECT conname, conrelid::regclass FROM pg_constraint WHERE contype='u' AND conname LIKE '%\_key'`.
- Keep only single-column ones whose `<table>.<column>` matches a `.unique()` declaration
  in `shared/schema.ts`. Verify the owning pgTable of each `.unique()` line (a column name
  alone is ambiguous — e.g. `key`/`email`/`username` appear in several tables).

## Also
- post-merge timeout must be generous: `npm install` + push together take ~140s; the
  default 20s was far too short. Set via `setPostMergeConfig({ scriptPath, timeoutMs: 180000 })`.
- **Why:** silent data loss on this production aquaculture DB is unacceptable; `--force`
  here is safe because the diffs are non-destructive (constraint renames / additions), and
  renaming to the expected name turns future pushes into clean no-ops.
