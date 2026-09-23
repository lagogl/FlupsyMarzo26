---
name: Forecast produttivo evadibile
description: Significato e regola del Forecast Evadibile nella proiezione di crescita.
---

Il Forecast di Produzione usa solo la categoria coerente con la taglia target: T3 per range da 6.000 animali/kg in su, T10 sotto 6.000. Il Forecast Evadibile è il minimo tra quel forecast e la disponibilità della taglia target rimasta dopo le prenotazioni Forecast dei mesi precedenti, includendo lo schiuditoio.

Ogni Forecast Evadibile prenota gli animali nel percorso Forecast e riduce la disponibilità dei mesi successivi. Il percorso ordini resta indipendente: ordini evadibili, arretrato e giacenza residua ordini non devono cambiare. La tabella deve distinguere giacenza lorda, impegni o semine precedenti, disponibilità Forecast a inizio mese, Forecast evadibile e scoperto. Il residuo resta disponibile salvo la quantità manualmente destinata alla Sand Nursery, limitata al residuo stesso. Gli impegni o semine precedenti sono un registro cumulativo delle allocazioni Forecast, non la differenza tra giacenza ordini e disponibilità Forecast.

**Why:** senza prenotazione, gli stessi animali coprivano il Forecast di Produzione di più mesi. Separare i due percorsi evita questo riuso senza alterare la simulazione degli ordini confermati.

**How to apply:** selezionare la categoria dal range temporalmente valido; sottrarre mensilmente il Forecast Evadibile e poi solo la semina manuale effettivamente applicabile. Accumulare entrambe le quantità nel registro mostrato dal mese successivo. Non generare arretrato Forecast e non usare giacenza o allocazioni ordini per derivare questo registro. La cella Sand Nursery mostra il pianificato, mentre il calcolo usa il minimo tra pianificato e residuo; vedere anche sand-nursery-manual-seeding.md.