---
name: Date consegna ordini FIC
description: Regola di precedenza tra periodi di consegna manuali e sincronizzazione ordini da Fatture in Cloud.
---

Le date di consegna già presenti su un ordine sono autoritative. La sincronizzazione da Fatture in Cloud può valorizzare un intervallo ancora assente quando riesce a estrarlo dall’oggetto, ma non deve cancellare o sostituire un intervallo già salvato.

**Why:** l’oggetto FIC spesso non contiene un periodo interpretabile; scrivere il risultato nullo dell’estrazione cancellava pochi minuti dopo le date inserite manualmente.

**How to apply:** in qualsiasi import o risincronizzazione degli ordini, aggiornare il periodo solo quando quello locale è assente e la sorgente fornisce entrambe le date valide.