---
name: Consegne ordini da vendite
description: Regola operativa e di sicurezza per aggiornare gli ordini a partire dalle vendite avanzate.
---

La generazione e la ristampa di un DDT non devono registrare consegne negli ordini. Per le nuove vendite, la registrazione avviene soltanto dopo il successo del comando “Invia a FIC”. Ogni vendita può riferirsi a un solo ordine; uno stesso ordine può invece essere evaso da più vendite distinte. Ogni consegna deve avere un riferimento strutturato e univoco a vendita, ordine e taglia.

**Why:** generare documenti non equivale a consegnare; inoltre l’ordine normalmente copre molti animali consegnati in vendite successive, mentre dividere una singola vendita fra ordini diversi non rappresenta il processo operativo.

**How to apply:** verificare cliente/P.IVA, azienda, cronologia e residuo; se entrambe le P.IVA esistono devono coincidere. La riconciliazione automatica o manuale deve scegliere un solo ordine per l’intera vendita e associare a quell’ordine tutte le taglie compatibili della vendita, senza superarne i residui. Più vendite possono ridurre progressivamente il residuo dello stesso ordine. Applicare ogni vendita in una sola transazione, serializzare per vendita e ordine e richiedere una nuova verifica se quantità o residui cambiano.