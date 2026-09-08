---
name: Indirizzi clienti FIC
description: Differenza tra dati sintetici e dettaglio anagrafico nell'API clienti Fatture in Cloud.
---

La risposta dell'elenco clienti Fatture in Cloud può avere la via vuota anche quando la scheda completa contiene l'indirizzo. Alcuni clienti locali non hanno ID FIC: in quel caso cercare per P. IVA; se anche FIC non li trova, il dato va completato in anagrafica.

**Why:** salvare direttamente la risposta sintetica ha cancellato localmente indirizzi presenti in Fatture in Cloud, producendo documenti con la riga della via vuota.

**How to apply:** unire campo per campo snapshot storico, anagrafica locale e dettaglio FIC, senza sostituire valori storici già presenti. Recuperare il dettaglio per ID o P. IVA e scorrere tutte le pagine: FIC espone spesso `last_page` alla radice della risposta, non sotto `meta`. Non usare la presenza del CAP come prova che via e codice allevamento siano completi.