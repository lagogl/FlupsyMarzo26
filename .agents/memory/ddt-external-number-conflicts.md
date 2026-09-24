---
name: Conflitti numerazione DDT esterna
description: Confine tra prenotazione locale e disponibilità del numero su Fatture in Cloud durante l'invio.
---

La prenotazione locale del DDT, anche sotto lock per azienda e anno, non riserva quel numero su Fatture in Cloud. Un altro client può occupare il numero tra preparazione e invio. Verificare di nuovo la disponibilità remota immediatamente prima della prima scrittura esterna; se è già occupato, bloccare l'invio senza creare il documento su FCloud.

**Why:** FCloud viene contattato prima di FIC. Un conflitto rilevato solo al POST FIC lascerebbe un documento già creato su FCloud e una bozza non completata. Anche il ricontrollo non garantisce atomicità fra servizi: un client esterno può intervenire dopo la lettura.

**How to apply:** Qualsiasi recupero di un numero in conflitto deve distinguere bozze certamente solo locali da documenti già inviati o con esito esterno incerto. Non rinumerare automaticamente questi ultimi; serve riconciliazione esplicita prima di qualsiasi nuovo tentativo.