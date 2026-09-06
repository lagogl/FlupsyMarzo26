---
name: Tracciabilità pubblica delle vendite
description: Regole di sicurezza e comunicazione per i QR cliente collegati ai rapporti di consegna.
---

I QR dei rapporti di consegna devono contenere soltanto un URL con token cifrato e autenticato. La pagina pubblica è in sola lettura, non indicizzabile e mostra una sintesi commerciale della genealogia ricavata da lotto, ciclo e composizioni miste. Nella comunicazione pubblica, l'origine ROEM va presentata come “Ecotapes Zeeland 2” e non devono mai comparire valori numerici negativi.

**Why:** gli ID interni sono enumerabili e le API operative contengono cliente, note e dettagli tecnici non destinati all'esterno. Nei lotti misti non è corretto presentare la timeline come tracciamento del singolo animale.

**How to apply:** non inserire ID di vendita o lotto nel link pubblico; non esporre nome cliente, note, posizioni, mortalità grezza o identificativi tecnici. Descrivere sempre i dati come percorso documentato del lotto e delle sue componenti. Nei grafici usare solo misure valide e positive; se si mostra una progressione sempre crescente, etichettarla esplicitamente come miglior valore osservato. Il link deve usare l'host pubblico corrente e non URL di sviluppo hardcoded.