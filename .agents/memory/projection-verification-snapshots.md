---
name: Fotografie delle verifiche di proiezione
description: Come confrontare una nuova logica con un Excel di verifica storico senza confondere cambiamenti di modello e dati.
---

Quando si rigenera un Excel storico per verificare una nuova logica, conservare gli input e la fotografia originali, riprodurre prima il risultato precedente e poi applicare la correzione. Una nuova estrazione live va presentata come una fotografia distinta, non come confronto a parità di dati.

**Why:** Inventario, ordini e data di riferimento cambiano; un confronto con dati odierni non può attribuire le differenze soltanto alla correzione del modello.

**How to apply:** Usare gli input archiviati nel workbook, non interrogare il database per completarli senza dichiararlo. Se gli input non bastano, segnalare il limite invece di inventare la fotografia storica. Conservare il file precedente, indicare data e perimetro della verifica nel nuovo file, distinguere gli scarti di riconciliazione dalle differenze vecchio/nuovo.

Prima di normalizzare chiavi di tassi archiviate, verificare eventuali collisioni fra nomi italiani e inglesi; non sovrascrivere automaticamente il valore che il motore avrebbe effettivamente scelto.

**Why:** Un archivio può contenere entrambe le lingue con valori diversi; normalizzarle indiscriminatamente cambia gli input e invalida la riproduzione di controllo.

**How to apply:** Riprodurre la selezione del motore e verificare la coincidenza con il precedente prima di applicare la nuova logica. Le formule di audit possono ricalcolare l'aritmetica, ma non vanno descritte come un simulatore decisionale completo se taglie, tassi selezionati e prelievi sono congelati.