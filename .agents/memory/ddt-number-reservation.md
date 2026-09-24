---
name: Prenotazione progressivo DDT
description: Regola per assegnare numeri DDT senza duplicati tra preparazione locale e invio remoto.
---

Il progressivo DDT è separato per azienda e anno e viene prenotato quando si crea il DDT locale. FIC è la fonte primaria: usare il massimo del campo numerico `number` fra tutti i DDT restituiti per l’azienda/anno, senza filtrare per `numeration`. Il locale conta solo per DDT ancora `locale` o `invio`.

Anche nella risposta di creazione FIC il numero assegnato è `number`; `numeration` è il sezionale (per esempio `/ddt`) e non va mai salvato o mostrato come numero. Prima dell’invio è ammessa solo un’anteprima marcata come bozza, senza numero locale; PDF, email e interfaccia possono chiamare il DDT “ufficiale” solo se lo stato è `inviato` e il numero FIC è valido.

La testata, le righe e il collegamento alla vendita devono essere un unico commit. Anche il claim di generazione o invio appartiene alla stessa transazione locale: una sola richiesta lo acquisisce, le concorrenti falliscono e un errore non lascia documenti parziali. Un invio remoto dall’esito incerto resta bloccato per verifica, non viene ripetuto alla cieca.

La riconciliazione automatica di un DDT già presente su FIC è distinta dal calcolo del massimo: richiede azienda, numero, data, serie e cliente verificabili e coincidenti. Se manca una di queste prove, non adottare il documento remoto.

Il recupero manuale è un'eccezione solo per una bozza interamente locale quando FIC conferma che il vecchio numero è diventato occupato. **Why:** un esito remoto incerto non equivale a un rifiuto certo: cambiare numero o riprovare potrebbe duplicare un documento esterno. **How to apply:** rileggere FIC, confrontare lo stato sotto lock con lo snapshot iniziale e bloccare il recupero se compare qualsiasi traccia di invio esterno.

**Why:** usare soltanto l'ultimo numero remoto assegna ripetutamente lo stesso progressivo finché i DDT locali non vengono inviati; richieste concorrenti possono inoltre ottenere lo stesso numero. Un retry remoto non coordinato può creare un secondo documento o collegare quello di un altro cliente.

**How to apply:** leggere tutte le pagine FIC, serializzare l’assegnazione per azienda/anno, usare il massimo tra FIC e prenotazioni locali pendenti, rendere idempotente la sorgente del DDT e non rinumerare automaticamente documenti storici o già inviati. Se esistono duplicati legacy, non spostarli nella sequenza FIC: usare una guardia PostgreSQL su INSERT/UPDATE della chiave, con lock transazionale e `23505`→`409`, che blocchi nuovi duplicati ma lasci leggibile lo storico. I lock applicativi restano un'ottimizzazione, non la garanzia DB.

Eccezione approvata: uno storico locale segnato come inviato può conservare un numero diverso da quello del suo documento FIC. Non alterare né cancellare lo storico per fare posto al progressivo corretto; un duplicato locale è ammissibile solo con prova separata e immutabile dell'identità e del numero FIC reale, verifica live che il nuovo numero sia libero su FIC e guardia DB che continui a impedire altri duplicati.

**Why:** correggere alla cieca lo storico cancellerebbe la tracciabilità; usare il suo massimo locale salterebbe numeri FIC che sono liberi. L'utente ha autorizzato l'eccezione tracciata, non un riuso generalizzato.

**How to apply:** escludere dal progressivo solo record legacy con prova verificata, distinguere sempre numero locale storico e numero ufficiale FIC e non liberare mai una prenotazione con invio esterno iniziato o incerto.