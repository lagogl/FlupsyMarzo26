---
name: Storno vendite e confine DDT
description: Regola di sicurezza per evitare ripristini inventariali dopo contabilizzazioni esterne del DDT.
---

Una vendita manuale confermata può essere stornata con movimenti compensativi solo finché non è stato generato alcun DDT. Dopo la generazione, lo storno va rifiutato anche se il DDT risulta ancora locale.

Le ristampe di un DDT già emesso devono usare gli snapshot immutabili di emittente e destinatario memorizzati nel DDT, non le anagrafiche correnti. Prima dell'emissione, se l'azienda della vendita non è configurata o riconosciuta, la generazione deve fallire esplicitamente: non sostituire mai un'altra società come fallback.

**Why:** la generazione del DDT può registrare una consegna nel sistema ordini esterno. Non esiste ancora un collegamento compensabile affidabile tra vendita, DDT e consegna esterna; riaprire le ceste produrrebbe stock disponibile mentre l'ordine resta consegnato. Inoltre, una ristampa legalmente diversa dall'originale crea un documento incoerente e un fallback aziendale può attribuire la vendita al soggetto sbagliato.

**How to apply:** mantenere atomiche le transizioni di generazione/invio DDT e bloccare lo storno quando la vendita ha un DDT o quando il DDT è in generazione/invio. Per ristampe e documenti collegati a un DDT esistente, preferire sempre gli snapshot DDT. Allentare la regola solo dopo aver introdotto uno storno tracciato anche delle consegne esterne.

## Nuova vendita dopo uno storno

Uno storno completato e tracciato deve liberare la fonte per una nuova vendita, senza eliminare lo storico né riconfermare la vendita stornata.

**Why:** Il ripristino inventariale da solo non basta se i riferimenti storici vengono ancora interpretati come prenotazioni attive. Ciò impediva all'operatore di rifare una vendita anche con la cesta correttamente ripristinata.

**How to apply:** Conservare i riferimenti per l'audit, distinguendoli dalle prenotazioni operative. Liberare solo storni tracciati; vendite attive, bozze, storni incompleti e riferimenti senza vendita riconoscibile restano bloccanti. Non inventare una nuova misura per aggirare il blocco. La nuova vendita ha una propria identità e segue configurazione e conferma normali.