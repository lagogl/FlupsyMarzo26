---
name: Indirizzi clienti FIC
description: Differenza tra dati sintetici e dettaglio anagrafico nell'API clienti Fatture in Cloud.
---

La risposta dell'elenco clienti Fatture in Cloud può avere `address_street` vuoto anche quando la scheda completa del cliente contiene la via.

**Why:** salvare direttamente la risposta sintetica ha cancellato localmente indirizzi presenti in Fatture in Cloud, producendo documenti con la riga della via vuota.

**How to apply:** durante la sincronizzazione, quando manca la via ma esiste l'ID FIC, richiedere il dettaglio del cliente e unire i dati prima dell'aggiornamento locale. Non usare la presenza del CAP come prova che l'indirizzo sia completo.