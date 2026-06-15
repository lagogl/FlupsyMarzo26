#!/bin/bash
set -e

npm install

# SAFETY: back up the database BEFORE any schema migration.
# drizzle-kit push --force auto-confirms destructive operations (TRUNCATE/DROP).
# In June 2026 this silently emptied the basket_groups table. Taking a fresh dump
# right before the push guarantees the data can always be recovered.
if [ -n "$DATABASE_URL" ]; then
  mkdir -p database_backups
  BACKUP_FILE="database_backups/pre_push_$(date +%Y-%m-%dT%H-%M-%S).sql"
  echo "Creating safety backup before db:push -> $BACKUP_FILE"
  if ! pg_dump "$DATABASE_URL" > "$BACKUP_FILE"; then
    echo "ERROR: pre-push backup failed. Aborting db:push to protect existing data."
    rm -f "$BACKUP_FILE"
    exit 1
  fi
  # Retention: keep only the 10 most recent pre-push safety backups.
  ls -1t database_backups/pre_push_*.sql 2>/dev/null | tail -n +11 | xargs -r rm -f
fi

npm run db:push -- --force
