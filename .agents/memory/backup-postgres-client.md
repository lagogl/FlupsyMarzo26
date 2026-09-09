---
name: Backup PostgreSQL client
description: Compatibilità e gestione sicura delle credenziali per backup e ripristino PostgreSQL in produzione.
---

## Regola
Il client `pg_dump`/`psql` del deployment deve avere una versione principale compatibile con il server Neon. Le credenziali devono essere passate nell’environment di un processo avviato senza shell.

**Why:** Un deployment con `pg_dump` 15 rifiuta un server PostgreSQL 16. Inoltre, costruire una command line con `PGPASSWORD=...` espone la password nei log quando il processo fallisce.

**How to apply:** Fissare esplicitamente PostgreSQL 16 nelle dipendenze di sistema e usare `execFile` con argomenti separati e `PGPASSWORD` nell’environment. Eliminare i file parziali dopo ogni fallimento.