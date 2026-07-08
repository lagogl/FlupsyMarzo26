---
name: Arrivi Schiuditoio "Reale" automatico
description: Il Reale del pannello Arrivi Schiuditoio si calcola sempre live dai lotti, non da snapshot salvati.
---

Il valore "Reale" degli Arrivi Schiuditoio (ProiezioneCrescita) è calcolato SEMPRE live sommando `lots.animal_count` per mese di `arrival_date`; il valore salvato manualmente (`hatchery_arrivals.actual_quantity`) è solo un fallback quando nel mese non risultano lotti.

**Why:** gli snapshot manuali diventano obsoleti man mano che arrivano nuovi lotti (es. aprile 2026 salvato 27,8M vs 57,9M reali; maggio/giugno assenti) → sotto-stima sistematica degli arrivi. `lots.animal_count` in pratica NON viene decrementato da mortalità/vendite (la mortalità va in `total_mortality`), quindi è un buon proxy della quantità arrivata.

**How to apply:** sia l'endpoint lista arrivi sia il motore di proiezione sovrascrivono l'actual con la somma live quando > 0. Non reintrodurre priorità al valore salvato senza gestire l'obsolescenza.
