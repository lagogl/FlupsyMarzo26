---
name: Scenari commerciali isolati
description: Confini funzionali e prudenza delle simulazioni commerciali rispetto a Scostamenti.
---

Gli scenari commerciali devono restare separati da Scostamenti e non registrare ordini, vendite o semine operative. Nel nuovo simulatore vendite e semine consumano lo stesso pool; nel vecchio modulo i percorsi Forecast e ordini restano separati.

**Why:** L'utente ha autorizzato scenari e proposta automatica solo preservando il comportamento del modulo esistente. Condividere il pool dentro Scostamenti cambierebbe una convenzione intenzionale.

**How to apply:** Riutilizzare soltanto fonti e kernel di crescita in lettura; verificare ogni vendita contro gli ordini futuri anche oltre l'orizzonte visibile, senza peggiorare gli scoperti preesistenti. Le disponibilità per mese/taglia sono alternative, non sommabili. La proposta automatica è una ricerca deterministica fattibile, non una promessa di ottimo economico; distinguere incassi da ricavi e dichiarare l'esclusione dei costi.

Nel perimetro commerciale considerare solo ordini il cui primo mese di consegna cade nel mese iniziale dello scenario o dopo. Ordini precedenti ancora aperti/parziali non vanno spostati nel primo mese né mostrati fra gli impegni.

**Why:** L'utente ha chiarito che gli arretrati precedenti non devono gravare sullo scenario avviato dalla giacenza reale corrente.

**How to apply:** Applicare la stessa soglia temporale alla protezione degli ordini, agli importi/quantità mostrati e al file Excel; continuare a proteggere tutti gli ordini pertinenti oltre l'orizzonte visibile.

Nel contesto commerciale degli scenari, “T2–T10” indica le sole taglie TP a migliaia intere: T3 significa TP-3000, T4 significa TP-4000 e così via. Non indica tutte le classi comprese tra gli estremi né le categorie aggregate del vecchio Forecast.

**Why:** L'utente ha chiarito esplicitamente di escludere le taglie intermedie e poi confermato l'equivalenza commerciale T3=TP-3000, T4=TP-4000; i nomi aggregati T3/T10 nel codice storico non identificano questa scelta commerciale.

**How to apply:** Mantenere la selezione commerciale distinta dal catalogo biologico completo: l'esclusione dalla vendita non deve eliminare animali in crescita né obblighi verso ordini già acquisiti.

La tabella commerciale deve distinguere la disponibilità alternativa per nuove vendite dalla quantità già richiesta dagli ordini acquisiti. Il valore di questi ultimi, quando affidabile, è il totale dell'ordine nel primo mese di consegna e non un nuovo incasso; la base IVA non è nota. Se manca un valore in EUR anche per un solo ordine del mese, non mostrare una somma parziale come totale.

**Why:** La quantità ordinata può includere taglie non selezionate e non coincide necessariamente con animali già disponibili o con il residuo da consegnare. Sommare valori eterogenei o incompleti creerebbe una lettura commerciale falsa.

**How to apply:** Tenere separati valori degli ordini e stime di nuove vendite in UI ed export; non inferire prezzi degli ordini dal listino dello scenario.