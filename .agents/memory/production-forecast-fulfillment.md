---
name: Forecast produttivo evadibile
description: Significato e regola del Forecast Evadibile nella proiezione di crescita.
---

Il Forecast di Produzione usa solo la categoria coerente con la taglia target: T3 per range da 6.000 animali/kg in su, T10 sotto 6.000. Il Forecast Evadibile è il minimo tra quel forecast e la giacenza lorda disponibile della taglia target, includendo lo schiuditoio.

Il Forecast disponibile per Sand Nursery è `max(0, giacenza lorda con schiuditoio − Forecast di Produzione)`.

**Why:** sommare T3 e T10 sovrastima il forecast della singola taglia target; l’indicatore deve mostrare quanta parte del relativo forecast pianificato è sostenibile dalla disponibilità prevista, senza confonderlo con gli ordini confermati o con una seconda vendita.

**How to apply:** selezionare la categoria dal range temporalmente valido della taglia target e trattare gli indicatori forecast come separati; il Forecast Evadibile non deve sottrarre animali, generare arretrato o modificare ordini evadibili e giacenza residua. Il residuo Sand Nursery non può essere negativo.