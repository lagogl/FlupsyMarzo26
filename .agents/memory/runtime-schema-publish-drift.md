---
name: Schema runtime e Publish
description: Evitare che oggetti PostgreSQL creati a runtime siano interpretati come drift distruttivo durante la pubblicazione.
---

## Regola
Ogni tabella, indice o vincolo necessario creato dal server o da una libreria a runtime deve essere dichiarato anche nella fonte schema Drizzle.

**Why:** La pubblicazione confronta sviluppo e produzione. Se un oggetto esiste nel database ma manca dalla fonte schema o dal database di sviluppo, può essere proposto come `DROP`, anche se è necessario per sessioni, prestazioni o unicità.

**How to apply:** Quando si aggiunge DDL runtime, aggiungere nello stesso intervento la dichiarazione Drizzle con lo stesso nome, colonne e condizioni. Prima di approvare Publish, verificare che il SQL non elimini oggetti necessari.