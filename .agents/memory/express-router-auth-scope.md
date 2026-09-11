---
name: Auth su router Express generici
description: Evitare che middleware di autenticazione su router montati a un prefisso ampio intercettino endpoint non correlati.
---

Su router Express montati a un prefisso generico come `/api`, applicare autenticazione e autorizzazione alle singole route oppure montare il router su un prefisso che identifica esclusivamente quelle risorse. Non usare un middleware globale sul router generico confidando che Express verifichi prima la corrispondenza delle route interne.

**Why:** Express esegue il middleware del router prima di sapere se un handler interno corrisponde. Un controllo globale può quindi imporre la sessione o il ruolo admin anche alle route registrate dopo, comprese integrazioni protette da API key o endpoint pubblici intenzionali.

**How to apply:** quando si aggiunge un router sotto `/api`, verificare con richieste runtime sia gli endpoint da proteggere sia almeno un endpoint pubblico e uno protetto da API key registrati successivamente.