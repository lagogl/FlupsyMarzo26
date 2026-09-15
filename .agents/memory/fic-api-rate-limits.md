---
name: Limiti richieste Fatture in Cloud
description: Gestione affidabile dei limiti API durante sincronizzazioni estese o consecutive.
---

Le chiamate a Fatture in Cloud devono essere cadenzate globalmente; una risposta 429 va riprovata rispettando `Retry-After`, con attesa progressiva quando l’header manca.

**Why:** una sincronizzazione ordini seguita subito da 120 clienti ha esaurito il limite API. La lettura cliente richiedeva inoltre due volte lo stesso dettaglio quando mancavano via e CAP.

**How to apply:** riusare il dettaglio già recuperato, evitare richieste che non possono aggiungere dati e far passare nuove integrazioni FIC dallo stesso meccanismo di rate limiting.