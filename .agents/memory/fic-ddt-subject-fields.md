---
name: Oggetto e causale DDT FIC
description: Campi distinti dell'API Fatture in Cloud per oggetto visibile e causale di trasporto del DDT.
---

Per i DDT Fatture in Cloud, valorizzare lo stesso oggetto in `subject` e `visible_subject`; conservare la causale di trasporto separatamente in `dn_ai_causal`.

**Why:** la documentazione ufficiale indica che `subject` non appare sul PDF, mentre `visible_subject` è l'oggetto visibile. Ometterne uno impedisce una propagazione coerente tra DDT e fattura conseguente.

**How to apply:** congelare oggetto e causale nello snapshot locale del DDT e usarli nelle ristampe e negli invii successivi. Non riutilizzare le note operative come oggetto o causale.