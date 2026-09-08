---
name: Unità peso vendite avanzate
description: Convenzione non uniforme ma intenzionale tra totale della vendita e righe dei sacchi.
---

Il peso totale della vendita avanzata è memorizzato in grammi, mentre peso originale, perdita e peso netto dei singoli sacchi sono memorizzati in chilogrammi.

**Why:** La lista e il dettaglio convertono il totale della vendita da grammi a kg. Salvare il totale in kg nei flussi con sacchi causa una seconda divisione per 1.000 e mostra valori come 0,04 kg invece di 40 kg.

**How to apply:** Ogni flusso di creazione o configurazione deve salvare il totale principale in grammi. I generatori documentali che leggono i sacchi devono invece trattarne direttamente i pesi come kg. Per dati legacy, distinguere le vecchie righe sacco in grammi confrontando peso e densità animale.