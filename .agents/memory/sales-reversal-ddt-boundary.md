---
name: Storno vendite e confine DDT
description: Regola di sicurezza per evitare ripristini inventariali dopo contabilizzazioni esterne del DDT.
---

Una vendita manuale confermata può essere stornata con movimenti compensativi solo finché non è stato generato alcun DDT. Dopo la generazione, lo storno va rifiutato anche se il DDT risulta ancora locale.

Le ristampe di un DDT già emesso devono usare gli snapshot immutabili di emittente e destinatario memorizzati nel DDT, non le anagrafiche correnti. Prima dell'emissione, se l'azienda della vendita non è configurata o riconosciuta, la generazione deve fallire esplicitamente: non sostituire mai un'altra società come fallback.

**Why:** la generazione del DDT può registrare una consegna nel sistema ordini esterno. Non esiste ancora un collegamento compensabile affidabile tra vendita, DDT e consegna esterna; riaprire le ceste produrrebbe stock disponibile mentre l'ordine resta consegnato. Inoltre, una ristampa legalmente diversa dall'originale crea un documento incoerente e un fallback aziendale può attribuire la vendita al soggetto sbagliato.

**How to apply:** mantenere atomiche le transizioni di generazione/invio DDT e bloccare lo storno quando la vendita ha un DDT o quando il DDT è in generazione/invio. Per ristampe e documenti collegati a un DDT esistente, preferire sempre gli snapshot DDT. Allentare la regola solo dopo aver introdotto uno storno tracciato anche delle consegne esterne.