---
name: Data aziendale delle proiezioni
description: Confine tra istanti reali Europe/Rome e date civili dei motori di pianificazione.
---

La fotografia corrente deve usare il giorno civile Europe/Rome, catturato una sola volta prima delle letture asincrone. I motori esistenti rappresentano le date civili con costruttori/getter locali: il riferimento normalizzato è un contenitore del calendario, non l'istante della mezzanotte italiana.

**Why:** Su server UTC Roma può essere già nel giorno, mese o anno successivo. Convertire invece ogni data storica a un fuso nuovo altera i calendari archiviati e i giorni di crescita/mortalità.

**How to apply:** Convertire solo gli istanti dell'orologio ai confini delle richieste; riusare la stessa fotografia per default, cutoff dei lotti e range correnti. Non reinterpretare date esplicite passate ai simulatori. Conservare timestamp reali per generatedAt e aggiornamenti; per lookup che accettano date civili preferire YYYY-MM-DD.