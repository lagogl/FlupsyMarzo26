---
name: Prenotazione progressivo DDT
description: Regola per assegnare numeri DDT senza duplicati tra preparazione locale e invio remoto.
---

Il progressivo DDT è separato per azienda e anno e viene prenotato quando si crea il DDT locale, non soltanto quando lo si invia a Fatture in Cloud. Il prossimo numero considera sia i documenti remoti sia tutte le prenotazioni locali.

**Why:** usare soltanto l'ultimo numero remoto assegna ripetutamente lo stesso progressivo finché i DDT locali non vengono inviati; richieste concorrenti possono inoltre ottenere lo stesso numero.

**How to apply:** serializzare l'assegnazione per azienda/anno, usare il massimo tra remoto e locale e non rinumerare automaticamente documenti storici duplicati o già inviati.