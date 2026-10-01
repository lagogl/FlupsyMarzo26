---
name: Costo proposta scenari
description: Perché la proposta automatica può esaurire il tempo dopo l'introduzione delle disponibilità giornaliere
---

La proposta automatica deve mantenere la protezione di ciascun ordine futuro e di ciascuna vendita già accettata, anche quando una taglia diventa vendibile durante il mese. Non eliminare i replay di verifica né sostituire la tutela per ordine con un semplice saldo aggregato per rendere il calcolo più rapido.

**Why:** Con le date di attraversamento giornaliere, la proposta valuta più candidati, in due ipotesi, prima di calcolare entrambe le proiezioni complete. Anche la normale simulazione ora calcola disponibilità protette per taglia e mese: un caso che passava in sviluppo ha superato il vecchio limite di 20 secondi sul sito pubblicato. La proposta richiede ancora più replay; rimuovere una riallocazione duplicata non è bastato a renderla rapida.

**How to apply:** Per regressioni di prestazioni, misurare separatamente simulazione e proposta con uno scenario rappresentativo e confrontare quantità proposte, scoperti e incassi prima/dopo. In particolare leggere lo stato e la durata delle due route pubblicate: una proposta HTTP 200 non dimostra che la simulazione HTTP 422 sia risolta. Ottimizzare il riuso dei replay senza cambiare la semantica e mantenere budget distinti per i due percorsi.

Gli indicatori durante l'elaborazione devono mostrare attività indeterminata e tempo realmente trascorso, non percentuali ricavate dal tempo.

**Why:** Il costo dei replay varia con gli input: il tempo trascorso non permette di dedurre quanto lavoro resta.

**How to apply:** Legare lo stato di attesa alla richiesta effettiva e mantenerlo fino alla risposta o all'errore. Mostrare percentuali o fasi completate solo se il server fornisce avanzamento reale.

I limiti di tempo della ricerca devono usare lo stesso orologio dei deadline effettivi e riservare tempo anche alle proiezioni finali, incluse le verifiche del piano iniziale.

**Why:** Un confronto tra timestamp epoch e tempo monotono ha disattivato di fatto la riserva per il ricalcolo finale; il solo limite sulla ricerca successiva non copre la costruzione della proposta di partenza.

**How to apply:** Confrontare deadline epoch con orario epoch; usare l'orologio monotono solo per durate. Se il tempo residuo è insufficiente, restituire soltanto un piano già validato e segnalare il limite, senza ridurre le protezioni.