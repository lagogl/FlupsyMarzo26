---
name: Scenari commerciali isolati
description: Confini funzionali e prudenza delle simulazioni commerciali rispetto a Scostamenti.
---

Gli scenari commerciali devono restare separati da Scostamenti e non registrare ordini, vendite o semine operative. Nel nuovo simulatore vendite e semine consumano lo stesso pool; nel vecchio modulo i percorsi Forecast e ordini restano separati.

**Why:** L'utente ha autorizzato scenari e proposta automatica solo preservando il comportamento del modulo esistente. Condividere il pool dentro Scostamenti cambierebbe una convenzione intenzionale.

**How to apply:** Riutilizzare soltanto fonti e kernel di crescita in lettura; verificare ogni vendita contro gli ordini futuri anche oltre l'orizzonte visibile, senza peggiorare gli scoperti preesistenti. Le disponibilità per mese/taglia sono alternative, non sommabili. La proposta automatica è una ricerca deterministica fattibile, non una promessa di ottimo economico; distinguere incassi da ricavi e dichiarare l'esclusione dei costi.

Nel riepilogo di crescita, invece, la copertura degli ordini deve rappresentare un'assegnazione comune a tutte le taglie: ogni animale può soddisfare un solo ordine. La percentuale degli ordini correnti esclude le quantità assegnate agli arretrati; gli arretrati restano richieste prioritarie e riducono lo stock disponibile anche nei mesi successivi. Il percorso Forecast resta separato.

**Why:** Il 2026-10-01 l'utente ha autorizzato la correzione della copertura complessiva degli ordini, mantenendo invariato il Forecast. Le disponibilità alternative per taglia venivano sommate come se fossero consegne simultaneamente possibili.

**How to apply:** Distinguere sempre capacità alternativa commerciale e copertura degli ordini realmente allocata. Nella simulazione mensile servire prima gli arretrati, poi le richieste fisicamente più vincolanti, usando gli animali idonei più vicini alla taglia richiesta per preservare quelli più grandi. Una percentuale arrotondata non può attestare copertura completa quando resta uno scoperto.

Nel perimetro commerciale considerare solo ordini il cui primo mese di consegna cade nel mese iniziale dello scenario o dopo. Ordini precedenti ancora aperti/parziali non vanno spostati nel primo mese né mostrati fra gli impegni.

**Why:** L'utente ha chiarito che gli arretrati precedenti non devono gravare sullo scenario avviato dalla giacenza reale corrente.

**How to apply:** Applicare la stessa soglia temporale alla protezione degli ordini, agli importi/quantità mostrati e al file Excel; continuare a proteggere tutti gli ordini pertinenti oltre l'orizzonte visibile.

Nel contesto commerciale degli scenari, “T2–T10” indica le sole taglie TP a migliaia intere: T3 significa TP-3000, T4 significa TP-4000 e così via. Non indica tutte le classi comprese tra gli estremi né le categorie aggregate del vecchio Forecast.

**Why:** L'utente ha chiarito esplicitamente di escludere le taglie intermedie e poi confermato l'equivalenza commerciale T3=TP-3000, T4=TP-4000; i nomi aggregati T3/T10 nel codice storico non identificano questa scelta commerciale.

**How to apply:** Mantenere la selezione commerciale distinta dal catalogo biologico completo: l'esclusione dalla vendita non deve eliminare animali in crescita né obblighi verso ordini già acquisiti.

La tabella commerciale deve distinguere la disponibilità alternativa per nuove vendite dalla quantità già richiesta dagli ordini acquisiti. Il valore di questi ultimi, quando affidabile, è il totale dell'ordine nel primo mese di consegna e non un nuovo incasso; la base IVA non è nota. Se manca un valore in EUR anche per un solo ordine del mese, non mostrare una somma parziale come totale.

**Why:** La quantità ordinata può includere taglie non selezionate e non coincide necessariamente con animali già disponibili o con il residuo da consegnare. Sommare valori eterogenei o incompleti creerebbe una lettura commerciale falsa.

**How to apply:** Tenere separati valori degli ordini e stime di nuove vendite in UI ed export; non inferire prezzi degli ordini dal listino dello scenario.

La matrice commerciale distingue gli animali biologicamente classificati nella taglia all'inizio del mese (dopo crescita e impegni precedenti, prima degli ordini del mese) dal vendibile aggiuntivo protetto. Il primo numero non va sommato al secondo.

**Why:** Il commerciale deve poter vedere le disponibilità di animali che alimentano il calcolo degli scoperti senza scambiare una giacenza lorda per quantità libera da offrire. Gli ordini possono usare taglie più grandi e la copertura di ordini futuri limita il vendibile: lo scoperto non si ricava sottraendo ordini dalla singola cella.

**How to apply:** Allineare UI ed Excel sulle due fasi della simulazione; mostrare esplicitamente l'assenza del dato nei vecchi risultati invece di presentarla come zero.

Per ogni taglia commerciale selezionata, il vendibile è UNA capacità protetta che comprende sia animali di taglia esatta sia fisicamente più grandi, anche se la taglia effettiva non era selezionata. Le cifre per taglia esatta e superiore all'inizio del mese sono una ripartizione informativa, non due disponibilità da sommare.

**Why:** L'utente ha chiarito che la precedente matrice per sola taglia esatta faceva sembrare scomparsi animali cresciuti oltre le taglie selezionate; vuole un quadro semplice di quanti può contare di vendere come taglia richiesta o superiore.

**How to apply:** Proteggere ordini futuri e altre vendite accettate sulla capacità inclusiva, mantenendo alternative non additive tra celle. Esplicitare che l'eventuale valore usa il prezzo della taglia richiesta, non una quotazione certa delle taglie effettive superiori.

Nel solo scenario commerciale, usare prima gli animali fisicamente più piccoli fra quelli idonei per vendite, con lo stesso criterio in tutte le verifiche e nel ricalcolo. Ordini e semine mantengono il consumo storico. Non trasferire questa scelta a Scostamenti.

**Why:** Consumare prima i grandi può respingere una vendita piccola fattibile perché sottrae la sola coorte che copre un ordine più restrittivo. Cambiare anche gli ordini ha redistribuito scoperti fra singoli impegni nel confronto reale prudente; cambiare le semine ha spostato allocazioni e aggravato il costo dei replay. Cambiare solo la proposta creerebbe piani non riproducibili nel ricalcolo; il best-fit resta euristico, non un ottimo globale con biologia eterogenea.

**How to apply:** Mantenere i controlli per singolo impegno oltre l'orizzonte e confrontare cambiamenti del criterio sugli stessi input reali; gli ordini conservano la priorità sulle vendite nello stesso giorno.

I limiti di tempo della proposta non devono cancellare il prefisso già verificato tramite riallocazione canonica e replay di entrambi i mondi.

**Why:** Il best-fit può aumentare le verifiche; scartare tutto se la ricerca non termina ha trasformato incassi fattibili in zero nel confronto sulla giacenza reale.

**How to apply:** Restituire solo righe già validate, segnalando ricerca limitata; riusare le graduatorie fisiche immutable per mondo, mai quantità o esiti di fulfillment di altri replay.

Negli scenari, una vendita inserita per mese senza giorno esplicito si colloca nel primo giorno che massimizza la capacità protetta di quella taglia durante il mese; gli ordini acquisiti si consumano alla data di prima consegna (se già trascorsa nel mese corrente, oggi). Le opportunità esposte per taglia sono alternative, non una somma di stock cumulativi.

**Why:** Una coorte può attraversare una taglia commerciale tra due primi del mese senza mai comparire nei soli snapshot mensili. Vendere sempre al primo giorno la perde; aggregare i passaggi giornalieri la conterebbe più volte o peggiorerebbe la copertura di ordini con scadenze precedenti.

**How to apply:** Conservare distinta la giacenza biologica di inizio mese dalla capacità vendibile datata; usare lo stesso calendario per allocazione, proposta e protezione degli scoperti, inclusi gli ordini oltre l'orizzonte visibile. Non interpretare il giorno di massima capacità come promessa di disponibilità continua dopo quel giorno.

Nella Disponibilità commerciale, l'immutabilità del riepilogo comprende anche il significato delle etichette, non solo quantità e ipotesi.

**Why:** Un catalogo taglie aggiornato dopo il congelamento non deve cambiare la lettura commerciale di una previsione storica, neppure in una nuova esportazione.

**How to apply:** Ogni nuova informazione descrittiva usata nei riepiloghi deve essere congelata insieme ai risultati; non integrare silenziosamente lo storico con anagrafiche live.

Nella Disponibilità commerciale non riproporre l'elenco di note gialle sopra la matrice.

**Why:** L'utente ha chiesto di eliminarlo perché non lo ritiene indicativo.

**How to apply:** Tenere la vista operativa essenziale; la rimozione dell'elenco non deve cancellare ipotesi e avvisi dai riepiloghi storici o dalle esportazioni.

Le mancanze nella matrice commerciale includono ordini attivati e vendite simulate, ma restano distinte dalla capacità aggiuntiva.

**Why:** L'utente ha scelto entrambe le categorie per capire gli sforamenti. Una capacità zero può significare stock già impegnato senza alcun deficit; un impegno scoperto prima nel mese può coesistere con capacità disponibile più tardi.

**How to apply:** Attribuire le mancanze alla taglia richiesta e al mese della richiesta, distinguendo ordini e vendite nel dettaglio; non trasformarle in disponibilità negativa o riportarle cumulativamente nei mesi successivi.

Nelle celle commerciali mostrare in rosso i morti previsti in numero assoluto, distinti dalle richieste mancanti e dalle percentuali.

**Why:** L'utente vuole capire se modificare la mortalità nelle proprie ipotesi di scenario. Il numero indica i decessi biologici mensili sulla popolazione ancora presente, non quanto si potrebbe vendere in uno scenario senza mortalità.

**How to apply:** Attribuire ogni decesso una sola volta alla taglia fisica dopo la crescita. Affiancare alle righe fisiche il totale mensile della popolazione, distinguendo taglie visibili, altre taglie e animali fuori dai range: l'utente richiede questa visibilità perché lo zero delle sole taglie selezionate è fuorviante. Non duplicare i decessi nelle taglie commerciali sostituibili, non contare animali già usciti e non ricostruire vecchi riepiloghi con dati nuovi.

Non spiegare un calo di disponibilità con mortalità visibile zero usando soltanto uno screenshot: verificare la mortalità di tutte le taglie fisiche e degli animali non classificati nello stesso ricalcolo.

**Why:** La disponibilità inclusiva e i decessi della sola taglia fisica hanno perimetri diversi. Una spiegazione ipotetica ha invertito le taglie; la riproduzione dei risultati ha invece identificato decessi non classificati e mortalità di taglie nascoste.

**How to apply:** Prima di attribuire una causa certa, riprodurre le quantità e distinguere massimi vendibili datati, decessi mensili, fallback biologici e arrotondamenti. Non presentare zero nella riga come zero sull'intera popolazione.
