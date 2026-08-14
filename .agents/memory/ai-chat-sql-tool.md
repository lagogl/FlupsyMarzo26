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

**Why:** review di sicurezza ha bocciato la prima versione basata solo su regex; un utente autenticato o prompt injection poteva creare tabelle o saturare il DB.

**Modello:** configurabile con `OPENAI_MODEL` (shared env var). I modelli di ragionamento (o-series, gpt-5*) non accettano `temperature` né `max_tokens`: il codice li rileva e usa `max_completion_tokens`. Attualmente gpt-5-mini: analisi molto più profonde di gpt-4.1-mini a costo simile.

**Interfaccia "Analisi AI Database"** (menu Analisi, pagina /analisi-ai-database): chat dedicata alla sola analisi DB, endpoint /api/ai-chat/analysis dietro login + password fissa richiesta dall'utente (env ANALYSIS_UI_PASSWORD con fallback hardcoded, scelta consapevole dell'utente; unlock con anti brute-force per IP). Modello scelto per-messaggio dal client, whitelist server-side.

**Pitfall dati:** `selection_source_baskets.size_id` è spesso NULL — il modello concludeva "nessun animale in ingresso per taglia". Il prompt impone: bilancio totale IN−OUT prima di tutto, poi fasce di `animals_per_kg` (≷15000) per il confronto taglie.
