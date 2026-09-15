#!/bin/bash
set -e

npm install

PRIMARY_DATABASE_URL="${NEON_DATABASE_URL:-${DATABASE_URL:-}}"
if [ -z "$PRIMARY_DATABASE_URL" ]; then
  echo "ERROR: NEON_DATABASE_URL or DATABASE_URL is required for post-merge setup."
  exit 1
fi

# Keep Drizzle aligned with the operational database selected by the application.
export DATABASE_URL="$PRIMARY_DATABASE_URL"

SCHEMA_CHANGED=true
if git rev-parse --verify HEAD^ >/dev/null 2>&1; then
  if git diff --quiet HEAD^ HEAD -- shared/schema.ts shared/lci-schema.ts drizzle.config.ts; then
    SCHEMA_CHANGED=false
  fi
fi

if [ "$SCHEMA_CHANGED" = false ]; then
  echo "No schema changes in merged commit; skipping database backup and db:push."
  exit 0
fi

# SAFETY: back up the database BEFORE any schema migration.
# drizzle-kit push --force auto-confirms destructive operations (TRUNCATE/DROP).
# In June 2026 this silently emptied the basket_groups table. Taking a fresh dump
# right before the push guarantees the data can always be recovered.
mkdir -p database_backups
BACKUP_FILE="database_backups/pre_push_$(date +%Y-%m-%dT%H-%M-%S).sql"
echo "Creating safety backup before db:push -> $BACKUP_FILE"
export PRIMARY_DATABASE_URL
readarray -d '' DB_PARTS < <(
  node -e '
    const url = new URL(process.env.PRIMARY_DATABASE_URL);
    const values = [
      url.hostname,
      url.port || "5432",
      decodeURIComponent(url.username),
      decodeURIComponent(url.password),
      decodeURIComponent(url.pathname.slice(1)),
      url.searchParams.get("sslmode") || "require",
    ];
    process.stdout.write(values.join("\0") + "\0");
  '
)
if ! PGHOST="${DB_PARTS[0]}" \
     PGPORT="${DB_PARTS[1]}" \
     PGUSER="${DB_PARTS[2]}" \
     PGPASSWORD="${DB_PARTS[3]}" \
     PGDATABASE="${DB_PARTS[4]}" \
     PGSSLMODE="${DB_PARTS[5]}" \
     pg_dump > "$BACKUP_FILE"; then
  echo "ERROR: pre-push backup failed. Aborting db:push to protect existing data."
  rm -f "$BACKUP_FILE"
  exit 1
fi
unset DB_PARTS PRIMARY_DATABASE_URL
# Retention: keep only the 10 most recent pre-push safety backups.
ls -1t database_backups/pre_push_*.sql 2>/dev/null | tail -n +11 | xargs -r rm -f

CI=true npm run db:push -- --force
