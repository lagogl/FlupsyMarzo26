---
name: Prenotazione progressivo DDT
description: Regola per assegnare numeri DDT senza duplicati tra preparazione locale e invio remoto.
---

Il progressivo DDT è separato per azienda e anno e viene prenotato quando si crea il DDT locale. FIC è la fonte primaria: usare il massimo del campo numerico `number` fra tutti i DDT restituiti per l’azienda/anno, senza filtrare per `numeration`. Il locale conta solo per DDT ancora `locale` o `invio`.

La testata, le righe e il collegamento alla vendita devono essere un unico commit. Anche il claim di generazione o invio appartiene alla stessa transazione locale: una sola richiesta lo acquisisce, le concorrenti falliscono e un errore non lascia documenti parziali. Un invio remoto dall’esito incerto resta bloccato per verifica, non viene ripetuto alla cieca.

La riconciliazione automatica di un DDT già presente su FIC è distinta dal calcolo del massimo: richiede azienda, numero, data, serie e cliente verificabili e coincidenti. Se manca una di queste prove, non adottare il documento remoto.

**Why:** usare soltanto l'ultimo numero remoto assegna ripetutamente lo stesso progressivo finché i DDT locali non vengono inviati; richieste concorrenti possono inoltre ottenere lo stesso numero. Un retry remoto non coordinato può creare un secondo documento o collegare quello di un altro cliente.

**How to apply:** leggere tutte le pagine FIC, serializzare l’assegnazione per azienda/anno, usare il massimo tra FIC e prenotazioni locali pendenti, rendere idempotente la sorgente del DDT e non rinumerare automaticamente documenti storici o già inviati.