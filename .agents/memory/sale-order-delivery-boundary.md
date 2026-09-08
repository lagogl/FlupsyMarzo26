---
name: Consegne ordini da vendite
description: Regola operativa e di sicurezza per aggiornare gli ordini a partire dalle vendite avanzate.
---

La generazione e la ristampa di un DDT non devono registrare consegne negli ordini. Per le nuove vendite, la registrazione avviene soltanto dopo il successo del comando “Invia a FIC”. Ogni consegna deve avere un riferimento strutturato e univoco a vendita, ordine e taglia.

**Why:** generare documenti non equivale a consegnare; inoltre note testuali e tentativi ripetuti possono creare doppie consegne o usare ordini della taglia sbagliata.

**How to apply:** verificare cliente/P.IVA, taglia, cronologia e residuo; se entrambe le P.IVA esistono devono coincidere. Ripartire in modo deterministico su più ordini. Lo storico conferma l’esatto piano mostrato tramite impronta, applica il batch in una sola transazione e serializza per vendita; se piano o residuo cambiano richiede una nuova conferma. Casi parziali o senza capienza restano manuali.