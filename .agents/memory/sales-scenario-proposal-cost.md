---
name: Costo proposta scenari
description: Perché la proposta automatica può esaurire il tempo dopo l'introduzione delle disponibilità giornaliere
---

La proposta automatica deve mantenere la protezione di ciascun ordine futuro e di ciascuna vendita già accettata, anche quando una taglia diventa vendibile durante il mese. Non eliminare i replay di verifica né sostituire la tutela per ordine con un semplice saldo aggregato per rendere il calcolo più rapido.

**Why:** Con le date di attraversamento giornaliere, la proposta valuta più candidati, in due ipotesi, prima di calcolare entrambe le proiezioni complete. Un orizzonte ordinario di dodici mesi con vendite già inserite ha superato il vecchio limite interattivo, mentre la sola simulazione passava. Rimuovere una riallocazione duplicata non è bastato: la verifica per candidato è il costo principale.

**How to apply:** Per regressioni di prestazioni, misurare separatamente simulazione e proposta con uno scenario rappresentativo e confrontare quantità proposte, scoperti e incassi prima/dopo. Ottimizzare il riuso dei replay e delle verifiche senza cambiare la semantica; riservare alla proposta un budget distinto dalla simulazione semplice.