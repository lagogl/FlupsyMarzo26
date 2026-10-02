---
name: Anagrafiche clienti FIC
description: Identità per azienda, dettaglio degli indirizzi e documenti senza collegamento alla rubrica.
---

La risposta dell'elenco clienti Fatture in Cloud può avere la via vuota anche quando la scheda completa contiene l'indirizzo. Alcuni clienti locali non hanno ID FIC: in quel caso cercare per P. IVA; se anche FIC non li trova, il dato va completato in anagrafica.

**Why:** salvare direttamente la risposta sintetica ha cancellato localmente indirizzi presenti in Fatture in Cloud, producendo documenti con la riga della via vuota.

**How to apply:** prima di creare un DDT, recuperare sempre il dettaglio per ID o P. IVA e usarlo per aggiornare lo snapshot della vendita; dopo la creazione, lo snapshot DDT resta immutabile. Scorrere tutte le pagine: FIC espone spesso `last_page` alla radice, non sotto `meta`. Non usare la presenza del CAP come prova di completezza.

## Identità cliente per azienda

Un ID cliente FIC condiviso nell'anagrafica locale non prova che il cliente esista nella rubrica dell'emittente. Verificare l'identità fiscale nella società del documento; mai sostituire la società o aggiornare l'ID globale con un collegamento valido soltanto per un'altra società.

**Why:** una vendita con dati anagrafici completi non riusciva a preparare il DDT perché il recupero del cliente usava un ID estraneo alla società selezionata. L'errore generico induceva lo storno di una vendita valida.

**How to apply:** cercare per partita IVA o codice fiscale, non per nome; distinguere un 404 cliente da indisponibilità, autorizzazione e risultati ambigui. Solo una ricerca completa senza corrispondenze consente l'entità documentale senza ID con dati fiscali completi, modalità prevista da FIC e già supportata per clienti manuali. Non crea un cliente in rubrica. Prima dell'invio verificare anche i collegamenti storici usando l'identità congelata nel DDT, senza alterarne i dati fiscali o contattare FCloud prima della verifica. Gli errori correggibili devono spiegare il problema senza richiedere lo storno.