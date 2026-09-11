---
name: Versioni temporali dei range taglia
description: Regola per cambiare i confini animali/kg senza alterare il significato delle operazioni storiche.
---

## Regola

La taglia commerciale rimane un’identità stabile. I confini Min/Max cambiano tramite versioni con intervallo di validità; una `size_id` già registrata resta la verità storica e non viene ricalcolata.

**Why:** Nel database esistono già operazioni in cui la taglia scelta e quella ottenuta applicando i range correnti non coincidono. Alcune differenze sono intenzionali, soprattutto nelle vagliature; riclassificare il passato cambierebbe report e scelte operative.

**How to apply:** Per record storici usare prima la `size_id` salvata. Solo quando manca, classificare animali/kg con la versione valida alla data del record. Proiezioni e nuove operazioni usano la versione valida alla data futura o corrente. Le date operative seguono il calendario `Europe/Rome`, non il giorno UTC. Le modifiche ai confini devono essere atomiche, serializzate e aprire/aggiornare la versione del giorno senza lasciare intervalli nulli o sovrapposti. Le classi commerciali “800/500/350/250/200” sotto TP-10000 sono solo classi di prezzo al kg, non nuove taglie operative.
