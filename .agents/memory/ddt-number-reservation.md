---
name: Prenotazione progressivo DDT
description: Regola per assegnare numeri DDT senza duplicati tra preparazione locale e invio remoto.
---

Il progressivo DDT è separato per azienda e anno e viene prenotato quando si crea il DDT locale. FIC è la fonte primaria: usare il massimo del campo numerico `number` fra tutti i DDT restituiti per l’azienda/anno, senza filtrare per `numeration`. Il locale conta solo per DDT ancora `locale` o `invio`.

**Why:** usare soltanto l'ultimo numero remoto assegna ripetutamente lo stesso progressivo finché i DDT locali non vengono inviati; richieste concorrenti possono inoltre ottenere lo stesso numero.

**How to apply:** leggere tutte le pagine FIC, serializzare l’assegnazione per azienda/anno, usare il massimo tra FIC e prenotazioni locali pendenti e non rinumerare automaticamente documenti storici o già inviati.