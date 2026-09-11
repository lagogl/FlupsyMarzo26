---
name: Confine dati AI Enhanced
description: Regole per impedire che metadata, prompt e query AI espongano tabelle o campi non autorizzati.
---

AI Enhanced deve usare una sola allowlist per metadata statici, introspezione dinamica e validazione SQL. Non inviare righe campione al modello. Le query SQL dirette sono riservate agli amministratori, devono essere fail-closed e devono essere eseguite in una transazione PostgreSQL read-only con timeout e limite risultati imposto dal server.

**Why:** filtrare solo la risposta HTTP non basta: il prompt interno può ancora ricevere schema e campioni completi. Inoltre una `SELECT` può avere effetti collaterali tramite funzioni PostgreSQL, aggirare limiti o accedere a identificatori che un parser regex non riconosce.

**How to apply:** quando si aggiunge una tabella o funzione SQL all’AI, aggiornare l’unica allowlist e i test avversariali. Non loggare testo di domande, query, parametri o identificativi di conversazione; usare soltanto lunghezze e conteggi.