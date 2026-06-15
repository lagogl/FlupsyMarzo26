# Guida alla Mappa Termica FLUPSY

*Guida pratica per gli operatori — come leggere la mappa e cosa fare per ogni segnalazione.*

---

## 1. A cosa serve

La **Mappa termica** è la schermata di colpo d'occhio sullo stato di tutte le ceste.
In un'unica pagina mostra, per ogni cesta:

- la **taglia** raggiunta (tramite il colore),
- quanti **animali** contiene (densità),
- la **mortalità**,
- e le **segnalazioni** che richiedono la tua attenzione.

L'obiettivo è capire in pochi secondi **dove intervenire**: cosa è pronto per la vendita, cosa va misurato, cosa va diviso.

---

## 2. I colori delle taglie (legenda in alto)

Ogni cesta è colorata in base alla sua taglia commerciale. La scala va dal **rosso** (animali piccoli, non vendibili) al **verde** (animali grandi, vendibili):

| Colore | Taglia | Significato |
|---|---|---|
| 🔴 Rosso scuro | **TP-500** | Seme (molto piccolo) |
| 🔴 Rosso | **TP-1000** | Piccolo |
| 🟠 Ambra | **TP-2000** | Pre-crescita |
| 🟢 Lime (verde chiaro) | **TP-2500** | **Vicina alla vendita** (quasi pronta) |
| 🟢 Verde chiaro | **TP-3000** | Quasi vendibile (soglia di vendita) |
| 🟢 Verde | **TP-6000** | Accrescimento |
| 🟢 Verde scuro | **TP-10000** | Grande |
| ⚪ Grigio | *Vuota* | Cesta senza animali |

> **Regola pratica del colore:** più tende al **verde**, più la cesta è vicina o pronta alla vendita.

**💡 Suggerimento:** passa il mouse (o tieni premuto il dito su mobile) **sopra una taglia della legenda** per vedere **quanti animali** ci sono in quella taglia e **in quante ceste** sono distribuiti.

---

## 3. I tre riquadri di riepilogo

Sotto la legenda trovi tre numeri chiave, con il confronto rispetto a ieri:

- **Animali totali** — il totale degli animali in tutte le ceste visibili.
- **Quasi vendibili +** — gli animali che hanno raggiunto (o stanno per raggiungere) la taglia di vendita.
- **Mortalità media** — la percentuale media di mortalità.

---

## 4. Le segnalazioni operative

È la parte più importante: la mappa **evidenzia automaticamente** le ceste che richiedono attenzione, con etichette colorate.

**💡 Suggerimento:** passa il mouse sopra ogni etichetta (filtri in alto, segnalazioni nella tabella, riepiloghi in fondo) per leggere **la spiegazione completa** di quel tipo di avviso.

### Cosa significano gli avvisi e cosa fare

| Avviso | Cosa significa | Cosa fare |
|---|---|---|
| **Capacità superata** | La cesta ha già superato il limite massimo della sua taglia (per numero di animali o per peso). La % indica di quanto è oltre. | Dividere la cesta o venderla al più presto. |
| **Capacità vicina** | Secondo la crescita prevista, raggiungerà il peso massimo della sua taglia entro pochi giorni (es. "~2gg"). | Pianificare per tempo divisione o vendita. |
| **Pronta per vendita** | Ha raggiunto una taglia adatta alla vendita. | Valutare la commercializzazione. |
| **Peso in calo** | Il peso totale è diminuito rispetto alla misura precedente. | Verificare: mortalità, vendita/trasferimento parziale o errore di misura. |
| **Taglia regredita** | La taglia risulta più piccola di prima. Gli animali non rimpiccioliscono. | Controllare: di solito è un errore di conteggio o di misura. |
| **Alta mortalità** | L'ultima operazione ha registrato mortalità sopra la soglia. | Controllare problemi sanitari o ambientali. |
| **Mortalità ciclo alta** | La mortalità accumulata dall'inizio del ciclo è elevata. | Valutare l'andamento complessivo del ciclo. |
| **Peso elevato** | Il peso totale supera la soglia in kg impostata. | Gestire o ripartire la cesta molto carica. |
| **Da misurare** | È passato troppo tempo dall'ultima misurazione. | Effettuare una nuova misurazione. |
| **Operazioni ferme** | Nessuna operazione da troppi giorni. | Verificare che la cesta non sia stata dimenticata. |
| **Stima peggiorata** | La taglia stimata oggi è inferiore a quella misurata prima. | Crescita più lenta del previsto: tenere d'occhio. |
| **Mai misurata** | Mai misurata dopo l'attivazione. | Effettuare la prima misurazione. |

---

## 5. Filtri e soglie

- In alto trovi i **filtri colorati**: cliccando su un avviso lo **attivi o disattivi** (quando è disattivato appare barrato con la scritta *off*). Così vedi solo le segnalazioni che ti interessano.
- Il pulsante **Soglie** permette di personalizzare i valori limite (es. quanti giorni senza misura, % di mortalità, kg di peso) oltre i quali scatta l'avviso.

---

## 6. Le ceste nella mappa

Ogni quadratino rappresenta una cesta nel suo FLUPSY e nella sua posizione (FILA DX / SX):

- il **colore** indica la taglia,
- il **riempimento** indica quanto è carica rispetto alle altre,
- un **pallino** segnala mortalità elevata.

Cliccando su una cesta si accede al suo dettaglio.

---

## 7. Dove viene usata l'Intelligenza Artificiale (AI)

È importante essere chiari su questo punto.

### La Mappa termica NON usa l'AI generativa

Tutti i numeri, i colori e le segnalazioni della mappa termica sono calcolati con **regole e formule precise** sui dati reali delle ceste (peso, conteggio animali, date delle operazioni). Sono quindi **verificabili e ripetibili**.

In particolare, la previsione **"Capacità vicina (~N giorni)"** usa il **modello di crescita SGR** (Specific Growth Rate): un calcolo matematico basato sui tassi di crescita storici mese per mese, **non** una risposta generata dall'AI. Simula la crescita giorno per giorno (tenendo conto anche della mortalità) e stima quando la cesta raggiungerà il peso massimo della sua taglia.

> In sintesi: ciò che vedi sulla mappa termica è **frutto di calcoli deterministici**, non di stime "creative".

### Dove l'AI viene usata nel resto dell'applicazione

L'Intelligenza Artificiale (modello GPT-4o) è utilizzata in **altre sezioni** del sistema, ad esempio:

- **Attività consigliate** — suggerimenti operativi prioritizzati in base allo stato delle ceste.
- **Analisi degli scostamenti di produzione** — confronto tra obiettivi, ordini e produzione prevista.
- **Rilevamento anomalie e analisi di sostenibilità**.
- **Generazione di report** e analisi di business.

Queste funzioni sono di **supporto alle decisioni**: forniscono consigli e analisi, ma le scelte operative restano sempre dell'operatore.

---

## 8. In breve

1. **Guarda i colori** → capisci subito a che taglia sono le ceste.
2. **Leggi le segnalazioni** → sai dove intervenire.
3. **Passa il mouse** sugli elementi → ottieni spiegazioni e numeri di dettaglio.
4. **Usa i filtri e le soglie** → adatti la mappa alle tue priorità.
5. **Ricorda:** la mappa calcola, l'AI (altrove) consiglia, **tu decidi**.
