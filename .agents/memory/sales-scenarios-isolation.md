---
name: Scenari commerciali isolati
description: Confini funzionali e prudenza delle simulazioni commerciali rispetto a Scostamenti.
---

Gli scenari commerciali devono restare separati da Scostamenti e non registrare ordini, vendite o semine operative. Nel nuovo simulatore vendite e semine consumano lo stesso pool; nel vecchio modulo i percorsi Forecast e ordini restano separati.

**Why:** L'utente ha autorizzato scenari e proposta automatica solo preservando il comportamento del modulo esistente. Condividere il pool dentro Scostamenti cambierebbe una convenzione intenzionale.

**How to apply:** Riutilizzare soltanto fonti e kernel di crescita in lettura; verificare ogni vendita contro gli ordini futuri anche oltre l'orizzonte visibile, senza peggiorare gli scoperti preesistenti. Le disponibilità per mese/taglia sono alternative, non sommabili. La proposta automatica è una ricerca deterministica fattibile, non una promessa di ottimo economico; distinguere incassi da ricavi e dichiarare l'esclusione dei costi.