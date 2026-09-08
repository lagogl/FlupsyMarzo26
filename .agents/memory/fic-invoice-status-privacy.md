---
name: Stato fatturazione FIC senza valori economici
description: Confine dati per verificare la fatturazione delle vendite avanzate senza mescolare i due gestionali.
---

La pagina vendite può mostrare stato, numero/data fattura e quantità DDT, ma non deve trasferire, memorizzare in cache o registrare nei log prezzi, importi, IVA, sconti, pagamenti o testo libero delle fatture FIC.

**Why:** gli operatori devono verificare che il DDT sia stato fatturato, mentre la gestione economica resta esclusivamente in Fatture in Cloud.

**How to apply:** sanificare subito le risposte FIC con una whitelist; dichiarare “Fatturata” solo con relazione tipizzata `delivery_note` e ID DDT FIC esatto. Numero/data o altre somiglianze restano ambigue. Mostrare la quantità locale del DDT separatamente.