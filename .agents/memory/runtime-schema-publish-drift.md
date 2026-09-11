---
name: Schema runtime e Publish
description: Evitare che oggetti PostgreSQL creati a runtime siano interpretati come drift distruttivo durante la pubblicazione.
---

## Regola
Ogni tabella, indice o vincolo necessario creato dal server o da una libreria a runtime deve essere dichiarato anche nella fonte schema Drizzle e verificato nel database operativo dopo merge o pubblicazione.

**Why:** La pubblicazione confronta sviluppo e produzione. Se un oggetto esiste nel database ma manca dalla fonte schema o dal database di sviluppo, può essere proposto come `DROP`, anche se è necessario per sessioni, prestazioni o unicità. È già accaduto che una tabella dichiarata nello schema risultasse comunque assente dal database operativo, causando errori 500 a catena.

**How to apply:** Quando si aggiunge DDL runtime, aggiungere nello stesso intervento la dichiarazione Drizzle con lo stesso nome, colonne e condizioni. Anche se l’app usa `NEON_DATABASE_URL`, Replit Publishing calcola il diff dal database di sviluppo `DATABASE_URL`: lo schema critico deve quindi essere presente in entrambi. Prima di approvare Publish, verificare che il SQL non elimini oggetti necessari; dopo merge o pubblicazione controllare con `to_regclass` che gli oggetti critici esistano su entrambe le connessioni.