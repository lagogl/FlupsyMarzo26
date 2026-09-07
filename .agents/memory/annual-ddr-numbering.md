---
name: Numerazione annuale DDR
description: Regole di assegnazione, configurazione e ristampa del progressivo DDR.
---

Il DDR usa un progressivo separato per azienda emittente e anno della vendita. Il primo gennaio ogni nuova annualità parte da 1, salvo un diverso valore iniziale configurato dall'utente.

**Why:** il lavoro quotidiano deve restare a un solo clic, ma due operatori non devono poter ricevere lo stesso numero e una ristampa non deve avanzare il contatore.

**How to apply:** assegnare il numero atomicamente alla prima generazione del DDR, salvarlo sulla vendita e riutilizzarlo in ogni ristampa. Consentire la modifica soltanto del prossimo numero non ancora assegnato e impedire valori già utilizzati. Le strutture additive della suite documentale devono essere verificate prima dell'uso perché i rami database dell'ambiente possono non avere ancora ricevuto la migrazione.