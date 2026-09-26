---
name: Email fascicolo vendite
description: Regole dell'invio automatico dei documenti di vendita senza bloccare la stampa.
---

La stampa del fascicolo non deve inviare email. L'email operativa unica, con il fascicolo completo, parte solo dopo che FIC ha accettato il DDT ufficiale e il numero è stato salvato. Una precedente regola che inviava anche alla stampa è stata esplicitamente superata.

**Why:** stampare più volte inviava copie ripetute, perfino con un DDT ancora in bozza; il separato avviso dopo FIC aggiungeva una seconda email. L'utente vuole una sola comunicazione con documenti ufficiali e rinvio soltanto su iniziativa dell'operatore quando necessario.

**How to apply:** PDF e ristampe non contattano Gmail; dopo il successo FIC inviare una volta il fascicolo con DDT ufficiale (Delta quattro PDF incluso DDR numerato; Ecotapes tre). Memorizzare l'esito per vendita; nessun retry automatico se Gmail dà un esito incerto, perché potrebbe avere già accettato il messaggio. Consentire il rinvio manuale motivato e tracciato solo dopo verifica. Il guasto email non deve annullare l'invio FIC.

La cronologia degli invii va conservata nello stato della vendita e oscurata nelle risposte pubbliche: nel database operativo la tabella generale `audit_logs` non è presente, benché altri controller facciano riferimento a quel nome. Non costruire nei PDF spediti via email un URL pubblico di tracciabilità usando Host o X-Forwarded-Proto della richiesta: sono intestazioni controllabili dal chiamante. Se si ripristina il QR negli allegati email, serve un'origine pubblica attendibile e verificata.