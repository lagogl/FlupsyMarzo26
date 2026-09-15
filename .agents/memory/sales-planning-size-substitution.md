---
name: Sostituzione taglie negli ordini
description: Regola fisica per sostituire una taglia richiesta nella pianificazione vendite.
---

Il numero nel codice TP non rappresenta direttamente gli animali per kg. La dimensione fisica deve essere determinata esclusivamente dai range attivi: più animali/kg significa animale più piccolo. Un ordine può usare la taglia esatta o una taglia fisicamente più grande, mai una più piccola.

**Why:** TP-1140 ha un range con molti più animali/kg di TP-2000 ed è quindi fisicamente più piccola; un ordinamento interpretato al contrario l’aveva assegnata erroneamente a ordini TP-2000.

**How to apply:** in ogni motore di pianificazione e copertura ordini, ordinare e confrontare le taglie tramite i range temporali attivi, non tramite il numero contenuto nel codice TP.