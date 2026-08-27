---
name: Assistente AI con tool SQL read-only
description: Come l'assistente in-app interroga il DB e i vincoli di sicurezza da mantenere
---

# Assistente AI — tool SQL read-only

L'assistente in-app (widget chat) ha un tool `esegui_query_sql` con loop di tool-calling OpenAI in streaming SSE.

**Regole di sicurezza (non allentare):**
- Il vincolo read-only è imposto **dal database**: ogni query gira in `BEGIN TRANSACTION READ ONLY` + `SET LOCAL statement_timeout='8s'` su un pool pg dedicato, poi ROLLBACK. I filtri regex da soli non bastano (es. `SELECT INTO` li aggira).
- Il LIMIT esterno (`SELECT * FROM (…) __q LIMIT 200`) va **sempre** applicato: un LIMIT interno non deve poterlo bypassare.
- Cap sia sui round (8) sia sul totale di tool call per risposta (14).
- Le query AI girano su un ruolo Postgres dedicato in sola lettura, auto-provisionato all'avvio con password effimera in memoria: MAI salvare la connection string in env/`.replit` (finisce in chiaro nel repo). Le tabelle sensibili si individuano per pattern di nome/colonna dal catalogo (non solo denylist fissa) e la verifica all'avvio deve fallire chiuso — mai ripiegare sulla connessione principale. Su Neon: niente attributi tipo NOSUPERUSER in ALTER ROLE (serve superuser) e la password deve rispettare la policy di complessità.

**Why:** review di sicurezza ha bocciato la prima versione basata solo su regex; un utente autenticato o prompt injection poteva creare tabelle o saturare il DB.

**Modello:** configurabile con `OPENAI_MODEL` (shared env var). I modelli di ragionamento (o-series, gpt-5*) non accettano `temperature` né `max_tokens`: il codice li rileva e usa `max_completion_tokens`. Attualmente gpt-5-mini: analisi molto più profonde di gpt-4.1-mini a costo simile.

**Interfaccia "Analisi AI Database"**: l'endpoint di analisi è dietro login + password da env `ANALYSIS_UI_PASSWORD` — NESSUN fallback hardcoded nel sorgente (fail closed se la env manca); anti brute-force per IP e whitelist modelli server-side. Lo schema password verrà sostituito da un permesso temporaneo lato server.

**Pitfall dati:** `selection_source_baskets.size_id` è spesso NULL — il modello concludeva "nessun animale in ingresso per taglia". Il prompt impone: bilancio totale IN−OUT prima di tutto, poi fasce di `animals_per_kg` (≷15000) per il confronto taglie.
