---
name: Alias route e autorizzazione
description: Regola di revisione per evitare bypass tramite endpoint legacy o equivalenti.
---

Quando si aggiunge autenticazione o autorizzazione a un’operazione, cercare tutti gli endpoint che invocano lo stesso controller, servizio o job. Eliminare gli alias legacy oppure applicare la stessa policy e migrare i client al percorso canonico.

**Why:** una route amministrativa protetta può restare aggirabile se una vecchia route pubblica richiama direttamente la medesima funzione.

**How to apply:** cercare sia il percorso HTTP sia il nome del controller o servizio; verificare router modulari, route inline e funzioni registratrici che ricevono direttamente `app`. Includere nei probe runtime alias distruttivi, route test con effetti reali e integrazioni esterne.