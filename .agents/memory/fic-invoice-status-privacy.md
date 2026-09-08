---
name: Stato fatturazione FIC senza valori economici
description: Confine dati per verificare la fatturazione delle vendite avanzate senza mescolare i due gestionali.
---

La pagina vendite può mostrare stato, numero/data fattura e quantità DDT, ma non deve trasferire, memorizzare in cache o registrare nei log prezzi, importi, IVA, sconti, pagamenti o testo libero delle fatture FIC.

**Why:** gli operatori devono verificare che il DDT sia stato fatturato, mentre la gestione economica resta esclusivamente in Fatture in Cloud.

**How to apply:** sanificare subito le risposte FIC con una whitelist; dichiarare “Fatturata” solo con relazione tipizzata `delivery_note` e ID DDT FIC esatto. Numero/data o altre somiglianze restano ambigue. Mostrare la quantità locale del DDT separatamente.

Per fatture manuali prive di relazione FIC strutturata è ammessa una seconda prova solo se coincidono contemporaneamente ID cliente FIC, data fattura/DDT, quantità congelata nelle righe DDT e un riferimento testuale esplicitamente datato nella forma “DDT … del/data …”. L’associazione deve essere univoca considerando tutti i DDT pertinenti, non soltanto quelli visibili nella pagina; fatture già collegate strutturalmente non sono riutilizzabili.

**Why:** FIC può produrre fatture valide senza popolare i campi di relazione documentale; il solo testo o la sola quantità genererebbero falsi positivi.

**How to apply:** trasformare subito il testo in una data-riferimento minima e scartarlo; in caso di collisione tra vendite o fatture mostrare stato ambiguo, mai “Fatturata”.