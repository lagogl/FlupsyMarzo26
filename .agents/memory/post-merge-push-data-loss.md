---
name: post-merge db:push --force can silently wipe tables
description: How --force in post-merge caused basket_groups data loss, and the layered fix that prevents recurrence
---

## Rule
`db:push -- --force` in `scripts/post-merge.sh` auto-confirms destructive operations
(TRUNCATE/DROP). It is NOT universally safe. If the Drizzle schema drifts from the live DB
in a way drizzle resolves destructively, `--force` silently applies it with no prompt.

**Why:** A real incident emptied the `basket_groups` table between two merges. Tell-tale
signs of a `--force` truncate (vs. a human deletion through the app): the dependent FK rows
survived as orphans (an app-level delete would have fired `ON DELETE SET NULL` and nulled
them), and the serial sequence stayed at its high-water mark (TRUNCATE keeps it; DROP+CREATE
resets to 1). The data was recoverable only because daily SQL dumps existed in
`database_backups/`.

## How to apply (layered defense)
1. **Declare every FK in `shared/schema.ts`.** A FK that exists in the DB but not in the
   schema makes drizzle perpetually want to drop it; declaring it (e.g.
   `.references(() => parent.id, { onDelete: "set null" })`) removes that drift.
2. **`scripts/post-merge.sh` takes a `pg_dump` into `database_backups/pre_push_*.sql`
   BEFORE `db:push --force`, aborting the push if the dump fails.** This guarantees a fresh
   recovery point for any future destructive push. Keeps last 10 pre-push dumps.
3. Recovery recipe: the COPY block in any `database_backups/*.sql` holds the rows; re-INSERT
   with explicit ids (the sequence is usually already past them, so no collision).
