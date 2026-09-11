---
name: Consegna accessi iniziali
description: Regola di sicurezza per creare account locali e consegnare password temporanee.
---

Le password temporanee degli account applicativi devono essere casuali, salvate soltanto come hash e consegnate tramite una connessione email autorizzata. Non devono apparire in chat, log o file del progetto. Se la consegna fallisce, annullare la creazione dell’account appena inserito.

**Why:** Le credenziali SMTP configurate possono non essere accettate dal provider anche quando le variabili esistono; la connessione Gmail OAuth autorizzata consente l’invio senza leggere o trasferire token.

**How to apply:** Per provisioning amministrativo una tantum, verificare prima che lo username non esista, creare l’account con hash bcrypt, inviare la credenziale tramite Gmail e rimuovere solo il nuovo account se l’invio non riesce.