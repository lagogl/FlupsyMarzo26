---
name: Prenotazione progressivo DDT
description: Regola per assegnare numeri DDT senza duplicati tra preparazione locale e invio remoto.
---

Il progressivo DDT è separato per azienda e anno e viene prenotato quando si crea il DDT locale. FIC è la fonte primaria: usare il massimo del campo numerico `number` fra tutti i DDT restituiti per l’azienda/anno, senza filtrare per `numeration`. Il locale conta solo per DDT ancora `locale` o `invio`.

Per la lista FIC `issued_documents`, il solo parametro `year` non filtra effettivamente l'anno. Usare `q` con un intervallo sulla data del documento e verificare comunque le date restituite prima di calcolare il massimo.

**Why:** Una lettura live ha restituito documenti dell'anno precedente nonostante `year` fosse specificato; i loro progressivi più alti alteravano il numero proposto. La stessa lettura con `q=date >= 'YYYY-01-01' and date <= 'YYYY-12-31'` ha restituito soltanto l'anno richiesto.

**How to apply:** Filtrare e paginare la lista per data, non fidarsi del parametro `year`. Distinguere inoltre il numero locale storico da quello ufficiale del documento FIC collegato: una discrepanza su un documento già inviato non è una prenotazione pendente e non va sanata rinumerando lo storico.

Anche nella risposta di creazione FIC il numero assegnato è `number`; `numeration` è il sezionale (per esempio `/ddt`) e non va mai salvato o mostrato come numero. Prima dell’invio è ammessa solo un’anteprima marcata come bozza, senza numero locale; PDF, email e interfaccia possono chiamare il DDT “ufficiale” solo se lo stato è `inviato` e il numero FIC è valido.

La testata, le righe e il collegamento alla vendita devono essere un unico commit. Anche il claim di generazione o invio appartiene alla stessa transazione locale: una sola richiesta lo acquisisce, le concorrenti falliscono e un errore non lascia documenti parziali. Un invio remoto dall’esito incerto resta bloccato per verifica, non viene ripetuto alla cieca.

La riconciliazione automatica di un DDT già presente su FIC è distinta dal calcolo del massimo: richiede azienda, numero, data, serie e cliente verificabili e coincidenti. Se manca una di queste prove, non adottare il documento remoto.

Il recupero manuale è un'eccezione solo per una bozza interamente locale quando FIC conferma che il vecchio numero è diventato occupato. **Why:** un esito remoto incerto non equivale a un rifiuto certo: cambiare numero o riprovare potrebbe duplicare un documento esterno. **How to apply:** rileggere FIC, confrontare lo stato sotto lock con lo snapshot iniziale e bloccare il recupero se compare qualsiasi traccia di invio esterno.

**Why:** usare soltanto l'ultimo numero remoto assegna ripetutamente lo stesso progressivo finché i DDT locali non vengono inviati; richieste concorrenti possono inoltre ottenere lo stesso numero. Un retry remoto non coordinato può creare un secondo documento o collegare quello di un altro cliente.

**How to apply:** leggere tutte le pagine FIC, serializzare l’assegnazione per azienda/anno, usare il massimo tra FIC e prenotazioni locali pendenti, rendere idempotente la sorgente del DDT e non rinumerare automaticamente documenti storici o già inviati. Se esistono duplicati legacy, non spostarli nella sequenza FIC: usare una guardia PostgreSQL su INSERT/UPDATE della chiave, con lock transazionale e `23505`→`409`, che blocchi nuovi duplicati ma lasci leggibile lo storico. I lock applicativi restano un'ottimizzazione, non la garanzia DB.

Eccezione approvata: uno storico locale segnato come inviato può conservare un numero diverso da quello del suo documento FIC. Non alterare né cancellare lo storico per fare posto al progressivo corretto; un duplicato locale è ammissibile solo con prova separata e immutabile dell'identità e del numero FIC reale, verifica live che il nuovo numero sia libero su FIC e guardia DB che continui a impedire altri duplicati.

**Why:** correggere alla cieca lo storico cancellerebbe la tracciabilità; usare il suo massimo locale salterebbe numeri FIC che sono liberi. L'utente ha autorizzato l'eccezione tracciata, non un riuso generalizzato.

**How to apply:** lo storico già inviato non alimenta il massimo delle prenotazioni locali, anche se il suo numero differisce da FIC. Le prove legacy servono per le eccezioni ai controlli di unicità, non per ignorare prenotazioni pendenti. Distinguere sempre numero locale storico e numero ufficiale FIC e non liberare mai una prenotazione con invio esterno iniziato o incerto.

Una lista FIC paginata deve essere completa prima di proporre un numero: una pagina vuota mentre i metadata dichiarano pagine documentali non può essere trattata come fine elenco.

**Why:** usare un massimo parziale può proporre un numero già occupato; una prima pagina anomala vuota può addirittura far ripartire da 1.

**How to apply:** fallire esplicitamente su pagine mancanti o limiti di paginazione raggiunti. Consentire il progressivo 1 soltanto quando l'anno è realmente privo di DDT e non esistono prenotazioni locali pendenti.