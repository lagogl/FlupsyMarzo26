---
name: Pulizia TypeScript senza regressioni
description: Vincoli semantici da applicare quando si riduce il debito TypeScript del progetto.
---

Una pulizia TypeScript deve preservare valori assenti, payload API, fallback, storico e comportamento delle query. Non sostituire `null` con sentinelle numeriche, non cancellare record per soddisfare FK non nullable e non cambiare endpoint o valori predefiniti senza verificarli contro il server.

**Why:** Un type-check verde può nascondere regressioni runtime e perdita dati se la correzione cambia la semantica invece di allineare i tipi. In questo progetto una revisione indipendente è necessaria perché molte pagine e servizi legacy compilano tramite bundler senza type-check.

**How to apply:** Correggere per aree, mantenere `strict`, eseguire test/build e revisionare il diff cercando cambi funzionali. Per cancellazioni con storico non scollegabile, fallire esplicitamente e lasciare la transazione invariata.