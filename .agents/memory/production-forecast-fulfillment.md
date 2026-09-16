---
name: Forecast produttivo evadibile
description: Significato e regola del Forecast Evadibile nella proiezione di crescita.
---

Il Forecast di Produzione usa solo la categoria coerente con la taglia target: T3 per range da 6.000 animali/kg in su, T10 sotto 6.000. Il Forecast Evadibile è il minimo tra quel forecast e la disponibilità della taglia target rimasta dopo le prenotazioni Forecast dei mesi precedenti, includendo lo schiuditoio.

Ogni Forecast Evadibile prenota gli animali nel percorso Forecast e riduce la disponibilità dei mesi successivi. Il percorso ordini resta indipendente: ordini evadibili, arretrato e giacenza residua ordini non devono cambiare. La tabella deve distinguere giacenza lorda, impegni o semine precedenti, disponibilità Forecast a inizio mese, Forecast evadibile e scoperto. Il residuo dopo il Forecast evadibile viene sempre seminato in Sand Nursery nello stesso mese e non resta disponibile nei mesi successivi.

**Why:** senza prenotazione, gli stessi animali coprivano il Forecast di Produzione di più mesi. Separare i due percorsi evita questo riuso senza alterare la simulazione degli ordini confermati.

**How to apply:** selezionare la categoria dal range temporalmente valido; sottrarre mensilmente il Forecast Evadibile e poi tutto il residuo seminato in Sand Nursery dalla giacenza dedicata al Forecast. Non generare arretrato Forecast e non usare queste allocazioni nel percorso ordini. La cella Sand Nursery usa `max(0, disponibilità Forecast a inizio mese − Forecast Evadibile del mese)` ed è un consumo del mese, non una disponibilità riportabile.