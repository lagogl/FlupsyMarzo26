---
name: Email fascicolo vendite
description: Regole dell'invio automatico dei documenti di vendita prima dell'esportazione a Fatture in Cloud.
---

La generazione del fascicolo completo invia automaticamente un'email operativa con riepilogo della vendita e documenti PDF allegati, prima che i dati siano esportati a Fatture in Cloud.

**Why:** i referenti devono ricevere subito la documentazione pronta, mentre un errore di invio non deve essere nascosto come se l'operazione fosse riuscita.

**How to apply:** inviare sincronicamente durante la generazione del fascicolo completo. Delta Futuro allega quattro documenti incluso il DDR numerato; Ecotapes allega tre documenti e non genera il DDR, perché usa il modulo prestampato esterno. La generazione di un singolo documento non invia l'email.