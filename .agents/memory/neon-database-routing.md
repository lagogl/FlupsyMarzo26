---
name: NEON vs DATABASE_URL routing
description: L'app deve puntare a NEON_DATABASE_URL per i dati operativi reali; DATABASE_URL è il Postgres Replit usato in dev (dati fermi a giugno 2026).
---

## Regola
In `server/db.ts`, la connection string deve essere:
```ts
const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
```

**Why:** DATABASE_URL (Replit-managed Postgres) viene aggiornato solo via sync esterno disabilitato; NEON_DATABASE_URL è il database Neon dell'utente con tutti i dati operativi aggiornati (4368+ ops vs 2940 in DATE_URL).

**How to apply:** Se si vedono 0 operazioni nel Diario o dati fermi a giugno 2026, verificare quale DB è attivo controllando nei log di avvio: `current_database: 'neondb'` = corretto; `current_database: 'heliumdb'` = sbagliato.
