---
name: Alias route e autorizzazione
description: Regola di revisione per evitare bypass tramite endpoint legacy o equivalenti.
---

Quando si aggiunge autenticazione o autorizzazione a un’operazione, cercare tutti gli endpoint che invocano lo stesso controller, servizio o job. Eliminare gli alias legacy oppure applicare la stessa policy e migrare i client al percorso canonico.

**Why:** una route amministrativa protetta può restare aggirabile se una vecchia route pubblica richiama direttamente la medesima funzione.

**How to apply:** cercare sia il percorso HTTP sia il nome del controller o servizio; verificare il router modulare, le route inline, i client e i file non legacy effettivamente compilati.