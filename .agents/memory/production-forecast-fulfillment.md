---
name: Forecast produttivo evadibile
description: Significato e regola del Forecast Evadibile nella proiezione di crescita.
---

Il Forecast di Produzione usa solo la categoria coerente con la taglia target: T3 per range da 6.000 animali/kg in su, T10 sotto 6.000. Il Forecast Evadibile è il minimo tra quel forecast e la disponibilità della taglia target rimasta dopo le prenotazioni Forecast dei mesi precedenti, includendo lo schiuditoio.

Ogni Forecast Evadibile prenota gli animali nel percorso Forecast e riduce la disponibilità dei mesi successivi. Il percorso ordini resta indipendente: ordini evadibili, arretrato e giacenza residua ordini non devono cambiare. Il Forecast disponibile per Sand Nursery è invece la differenza mensile tra la giacenza lorda con schiuditoio mostrata e il Forecast Evadibile.

**Why:** senza prenotazione, gli stessi animali coprivano il Forecast di Produzione di più mesi. Separare i due percorsi evita questo riuso senza alterare la simulazione degli ordini confermati.

**How to apply:** selezionare la categoria dal range temporalmente valido; sottrarre mensilmente solo il Forecast Evadibile dalla giacenza dedicata al Forecast. Non generare arretrato Forecast e non usare queste prenotazioni nel percorso ordini. Per Sand Nursery usare `max(0, giacenza lorda mostrata − Forecast Evadibile del mese)`.