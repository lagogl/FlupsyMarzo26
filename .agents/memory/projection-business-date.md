---
name: Data aziendale delle proiezioni
description: Confine tra istanti reali Europe/Rome e date civili dei motori di pianificazione.
---

La fotografia corrente deve usare il giorno civile Europe/Rome, catturato una sola volta prima delle letture asincrone. I motori esistenti rappresentano le date civili con costruttori/getter locali: il riferimento normalizzato è un contenitore del calendario, non l'istante della mezzanotte italiana.

**Why:** Su server UTC Roma può essere già nel giorno, mese o anno successivo. Convertire invece ogni data storica a un fuso nuovo altera i calendari archiviati e i giorni di crescita/mortalità.

**How to apply:** Convertire solo gli istanti dell'orologio ai confini delle richieste; riusare la stessa fotografia per default, cutoff dei lotti e range correnti. Non reinterpretare date esplicite passate ai simulatori. Conservare timestamp reali per generatedAt e aggiornamenti; per lookup che accettano date civili preferire YYYY-MM-DD.

La fotografia deve governare anche i cataloghi temporali utilizzati per interpretare gli ordini, non soltanto la crescita e la giacenza.

**Why:** Un lettore di ordini che ricarica i range con un nuovo istante dopo la mezzanotte può mescolare taglie del nuovo giorno con giacenze e SGR del giorno precedente, pur lasciando corretto il mese della simulazione.

**How to apply:** Propagare la data civile catturata a tutti i lettori di range coinvolti nel calcolo, inclusi quelli indiretti. Nei test del cambio giorno esercitare i lettori reali con database simulato, non sostituirli tutti con funzioni vuote.

Selezionare un altro anno cambia l'orizzonte del Forecast, non la data della fotografia di partenza. La proiezione è soltanto in avanti; i valori nulli/zero di disponibilità nei mesi trascorsi non costituiscono una giacenza storica misurata.

**Why:** Non esiste una fonte affidabile di stock storico in questo percorso. Retrodatare lo stock live inventerebbe disponibilità, mentre ricominciare la simulazione a gennaio dell'anno selezionato ignorerebbe crescita, mortalità e domanda intervenute.

**How to apply:** Conservare la fotografia aziendale corrente anche per un anno selezionato diverso. Attraversare il periodo intermedio prima di mostrare l'anno richiesto; introdurre una ricostruzione storica solo con una fonte attendibile, esplicitamente distinta dai dati live.