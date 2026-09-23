---
name: Scenari commerciali isolati
description: Confini funzionali e prudenza delle simulazioni commerciali rispetto a Scostamenti.
---

Gli scenari commerciali devono restare separati da Scostamenti e non registrare ordini, vendite o semine operative. Nel nuovo simulatore vendite e semine consumano lo stesso pool; nel vecchio modulo i percorsi Forecast e ordini restano separati.

**Why:** L'utente ha autorizzato scenari e proposta automatica solo preservando il comportamento del modulo esistente. Condividere il pool dentro Scostamenti cambierebbe una convenzione intenzionale.

**How to apply:** Riutilizzare soltanto fonti e kernel di crescita in lettura; verificare ogni vendita contro gli ordini futuri anche oltre l'orizzonte visibile, senza peggiorare gli scoperti preesistenti. Le disponibilità per mese/taglia sono alternative, non sommabili. La proposta automatica è una ricerca deterministica fattibile, non una promessa di ottimo economico; distinguere incassi da ricavi e dichiarare l'esclusione dei costi.

Nel contesto commerciale degli scenari, “T2–T10” indica le sole taglie TP a migliaia intere, non tutte le classi comprese tra gli estremi e non le categorie aggregate del vecchio Forecast.

**Why:** L'utente ha chiarito esplicitamente di escludere le taglie intermedie; i nomi aggregati T3/T10 nel codice storico non identificano questa scelta commerciale.

**How to apply:** Mantenere la selezione commerciale distinta dal catalogo biologico completo: l'esclusione dalla vendita non deve eliminare animali in crescita né obblighi verso ordini già acquisiti.