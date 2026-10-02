---
name: Sostituzione taglie negli ordini
description: Regola fisica per sostituire una taglia richiesta nella pianificazione vendite.
---

Il numero nel codice TP non rappresenta direttamente gli animali per kg. La dimensione fisica deve essere determinata esclusivamente dai range attivi: più animali/kg significa animale più piccolo. Un ordine può usare la taglia esatta o una taglia fisicamente più grande, mai una più piccola.

**Why:** TP-1140 ha un range con molti più animali/kg di TP-2000 ed è quindi fisicamente più piccola; un ordinamento interpretato al contrario l’aveva assegnata erroneamente a ordini TP-2000.

**How to apply:** in ogni motore di pianificazione e copertura ordini, ordinare e confrontare le taglie tramite i range temporali attivi, non tramite il numero contenuto nel codice TP.

Negli esempi per questo progetto, TP-3000 è fisicamente più grande di TP-2000. Non descrivere il passaggio TP-3000 → TP-2000 come crescita.

**Why:** L'utente ha corretto esplicitamente un esempio di questo tipo; invertire le taglie ha portato a una spiegazione errata del calo di disponibilità.

**How to apply:** verificare i range prima di nominare una taglia di destinazione negli esempi; non interpretare i codici TP come animali/kg.