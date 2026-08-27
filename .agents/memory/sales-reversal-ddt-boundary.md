---
name: Storno vendite e confine DDT
description: Regola di sicurezza per evitare ripristini inventariali dopo contabilizzazioni esterne del DDT.
---

Una vendita manuale confermata può essere stornata con movimenti compensativi solo finché non è stato generato alcun DDT. Dopo la generazione, lo storno va rifiutato anche se il DDT risulta ancora locale.

**Why:** la generazione del DDT può registrare una consegna nel sistema ordini esterno. Non esiste ancora un collegamento compensabile affidabile tra vendita, DDT e consegna esterna; riaprire le ceste produrrebbe stock disponibile mentre l'ordine resta consegnato.

**How to apply:** mantenere atomiche le transizioni di generazione/invio DDT e bloccare lo storno quando la vendita ha un DDT o quando il DDT è in generazione/invio. Allentare la regola solo dopo aver introdotto uno storno tracciato anche delle consegne esterne.