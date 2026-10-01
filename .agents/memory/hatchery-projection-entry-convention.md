---
name: Convenzione ingressi schiuditoio nelle proiezioni
description: Scelta dell'utente per quantità residue del mese corrente e ingressi TP-300 a metà mese.
---

Nelle proiezioni di crescita/Scostamenti gli ingressi ancora attesi sono convenzionalmente sempre TP-300 il 15 del mese. Non richiedere data o taglia specifiche per ogni ingresso: l'utente ha scelto esplicitamente questa semplificazione.

Nel mese della fotografia usare solo MAX(0, previsione totale mensile meno quantità già arrivate fino alla fotografia). Sottrarre le quantità originarie degli arrivi, non la giacenza residua dopo mortalità o vendite. I lotti già rappresentati nell'inventario non devono essere reinseriti; nei mesi futuri usare la previsione, nei mesi passati nessuna nuova immissione.

**Why:** Sommare il reale mensile all'inventario corrente duplicava animali già presenti. L'utente vuole una convenzione semplice per gli ingressi futuri, non una pianificazione dettagliata per lotto.

**How to apply:** Crescita e mortalità iniziano dopo il 15. Se nella fotografia il 15 è già passato, simulare solo i giorni successivi alla fotografia, senza crescita retroattiva del residuo. Applicare la stessa convenzione a quantità, stock, Forecast, fabbisogno e indicazione di arrivo troppo tardivo.