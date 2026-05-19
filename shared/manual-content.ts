/**
 * Contenuto del Manuale FLUPSY — bilingue (IT/EN).
 * Usato sia dalla pagina in-app `/manuale` sia dal generatore PDF.
 */

export type Lang = "it" | "en";

export interface ManualBlock {
  type: "p" | "ul" | "ol" | "note" | "warning" | "tip" | "code" | "kvtable" | "h3";
  /** Testo singolo (p, note, warning, tip, code, h3) */
  text?: { it: string; en: string };
  /** Elenco puntato/numerato (ul, ol) */
  items?: { it: string; en: string }[];
  /** Tabella chiave/valore (kvtable) */
  rows?: { k: { it: string; en: string }; v: { it: string; en: string } }[];
}

export interface ManualSection {
  id: string;
  title: { it: string; en: string };
  blocks: ManualBlock[];
}

export interface ManualChapter {
  id: string;
  title: { it: string; en: string };
  intro?: { it: string; en: string };
  sections: ManualSection[];
}

const p = (it: string, en: string): ManualBlock => ({ type: "p", text: { it, en } });
const h3 = (it: string, en: string): ManualBlock => ({ type: "h3", text: { it, en } });
const ul = (items: [string, string][]): ManualBlock => ({
  type: "ul",
  items: items.map(([it, en]) => ({ it, en })),
});
const ol = (items: [string, string][]): ManualBlock => ({
  type: "ol",
  items: items.map(([it, en]) => ({ it, en })),
});
const note = (it: string, en: string): ManualBlock => ({ type: "note", text: { it, en } });
const warn = (it: string, en: string): ManualBlock => ({ type: "warning", text: { it, en } });
const tip = (it: string, en: string): ManualBlock => ({ type: "tip", text: { it, en } });
const kv = (rows: [string, string, string, string][]): ManualBlock => ({
  type: "kvtable",
  rows: rows.map(([kit, ken, vit, ven]) => ({ k: { it: kit, en: ken }, v: { it: vit, en: ven } })),
});

export const MANUAL: ManualChapter[] = [
  // 1. INTRODUZIONE
  {
    id: "intro",
    title: { it: "Introduzione", en: "Introduction" },
    sections: [
      {
        id: "overview",
        title: { it: "Cos'è FLUPSY Manager", en: "What FLUPSY Manager is" },
        blocks: [
          p(
            "FLUPSY Manager è il sistema gestionale per impianti di preingrasso di molluschi (vongole, ostriche, mitili) in unità FLUPSY (Floating UPweller SYstem). Traccia in tempo reale ceste, cicli vitali, operazioni, lotti di seme, vendite e documenti di trasporto (DDT).",
            "FLUPSY Manager is the management system for shellfish (clams, oysters, mussels) pre-fattening farms in FLUPSY units (Floating UPweller SYstem). It tracks in real time baskets, life cycles, operations, seed lots, sales and transport documents (DDT)."
          ),
          p(
            "Il sistema unisce dati operativi quotidiani, analisi di crescita, intelligenza artificiale (GPT-4o) per previsioni e diagnostica, e integrazione con sistemi esterni di fatturazione (Fatture in Cloud) e ambientali (Copernicus, ARPAV, ARPAE).",
            "The system combines daily operational data, growth analysis, artificial intelligence (GPT-4o) for forecasting and diagnostics, and integration with external invoicing (Fatture in Cloud) and environmental systems (Copernicus, ARPAV, ARPAE)."
          ),
        ],
      },
      {
        id: "concepts",
        title: { it: "Concetti chiave", en: "Key concepts" },
        blocks: [
          kv([
            ["FLUPSY", "FLUPSY", "Unità galleggiante che ospita le ceste. Ogni FLUPSY ha un nome, una posizione GPS, una capacità massima di ceste.", "Floating unit hosting the baskets. Each FLUPSY has a name, GPS location, max basket capacity."],
            ["Cesta (Basket)", "Basket", "Contenitore fisico identificato da un numero progressivo all'interno del FLUPSY. Può contenere un solo ciclo attivo per volta.", "Physical container identified by a sequential number within the FLUPSY. Can contain only one active cycle at a time."],
            ["Ciclo (Cycle)", "Cycle", "Periodo di vita degli animali in una cesta, da prima attivazione a vendita/chiusura. Contiene tutte le operazioni e mantiene `cycleCode` univoco.", "Life period of animals in a basket, from first activation to sale/closure. Holds all operations and a unique `cycleCode`."],
            ["Lotto (Lot)", "Lot", "Partita di seme con origine, fornitore, data di arrivo e prezzo. Più cicli possono provenire dallo stesso lotto.", "Seed batch with origin, supplier, arrival date and price. Multiple cycles can come from the same lot."],
            ["Operazione", "Operation", "Evento registrato sulla cesta: prima-attivazione, misura, peso, vagliatura, vendita, chiusura, mortalità.", "Event recorded on the basket: first-activation, measure, weight, screening, sale, closure, mortality."],
            ["Taglia (Size)", "Size", "Classe commerciale degli animali (TP-180 → TP-10000) definita per intervalli di animali/kg. Più animali/kg = animale più piccolo.", "Commercial size class (TP-180 → TP-10000) defined by animals-per-kg ranges. More animals/kg = smaller animal."],
            ["SGR", "SGR", "Specific Growth Rate, tasso di crescita giornaliero in % di peso, usato per le proiezioni.", "Specific Growth Rate, daily growth percentage by weight, used for projections."],
            ["Vagliatura (Screening)", "Screening (Vagliatura)", "Operazione di selezione che ridistribuisce animali tra setacci/micron e crea nuove ceste figlie.", "Sorting operation that redistributes animals between sieves/microns and creates new child baskets."],
            ["DDT", "DDT (Transport Doc)", "Documento di Trasporto generato automaticamente dalle vendite, con stato (bozza, emesso, integrato).", "Transport document automatically generated from sales, with state (draft, issued, integrated)."],
          ]),
        ],
      },
      {
        id: "navigation",
        title: { it: "Navigazione e menu", en: "Navigation and menu" },
        blocks: [
          p(
            "Il menu laterale è organizzato per macro-aree: Gestione Operativa, Monitoraggio, Inventario, Analisi, Pianificazione, Vendite, Sistema. Clicca su una sezione per espandere le sue voci.",
            "The side menu is organized by macro-areas: Operations, Monitoring, Inventory, Analysis, Planning, Sales, System. Click on a section to expand its items."
          ),
          tip(
            "Sul Dashboard, dal selettore in alto, puoi salvare gli ID dei FLUPSY preferiti: i menu a tendina nelle altre pagine si filtreranno di conseguenza.",
            "On the Dashboard, from the top selector, you can save your preferred FLUPSY IDs: dropdowns in other pages will be filtered accordingly."
          ),
        ],
      },
    ],
  },

  // 2. DASHBOARD
  {
    id: "dashboard",
    title: { it: "Dashboard", en: "Dashboard" },
    sections: [
      {
        id: "widgets",
        title: { it: "Widget e KPI", en: "Widgets and KPIs" },
        blocks: [
          p(
            "La Dashboard mostra una panoramica in tempo reale dell'impianto: ceste attive, animali totali, distribuzione per taglia, stato del meteo marino, notifiche e — tramite il widget IMM — l'indice di maturità del magazzino.",
            "The Dashboard shows a real-time overview of the farm: active baskets, total animals, size distribution, marine weather, notifications and — through the IMM widget — the inventory ripeness index."
          ),
          ul([
            ["Ceste attive: numero di cicli aperti.", "Active baskets: number of open cycles."],
            ["Animali totali: somma di `animal_count` ultima operazione per ciclo.", "Total animals: sum of the last `animal_count` per cycle."],
            ["Distribuzione taglie: grafico a torta con conteggio animali per taglia.", "Size distribution: pie chart with animal count by size."],
            ["Notifiche: taglie raggiunte, scadenze, anomalie.", "Notifications: target sizes reached, deadlines, anomalies."],
            ["IMM globale: punteggio 0-100, link rapido alla pagina dedicata.", "Global IMM: 0-100 score, quick link to dedicated page."],
          ]),
        ],
      },
    ],
  },

  // 3. FLUPSY e CESTE
  {
    id: "flupsy",
    title: { it: "Unità FLUPSY e Ceste", en: "FLUPSY Units and Baskets" },
    sections: [
      {
        id: "flupsy-mgmt",
        title: { it: "Gestione FLUPSY", en: "FLUPSY management" },
        blocks: [
          p(
            "Da `Unità FLUPSY` puoi creare, modificare ed eliminare le unità. Ogni FLUPSY ha: nome, descrizione, capacità (numero massimo di ceste), coordinate GPS opzionali, layout (file e colonne) per la mappa visiva.",
            "From `FLUPSY Units` you can create, edit and delete units. Each FLUPSY has: name, description, capacity (max baskets), optional GPS coordinates, layout (rows and columns) for the visual map."
          ),
          warn(
            "L'eliminazione di un FLUPSY è permessa solo se non ha ceste con cicli attivi. Usa la procedura di eliminazione selettiva per impianti di test.",
            "Deleting a FLUPSY is only allowed if it has no baskets with active cycles. Use the selective deletion procedure for test installations."
          ),
        ],
      },
      {
        id: "basket-mgmt",
        title: { it: "Gestione Ceste", en: "Basket management" },
        blocks: [
          p(
            "Ogni cesta ha: numero fisico (univoco nel FLUPSY), posizione (riga/colonna o coordinate), stato (`disponibile`, `attiva`, `pronta`), ciclo corrente. Lo stato è gestito da un invariante atomico a livello DB: `state`, `currentCycleId` e `cycleCode` vengono sempre scritti insieme.",
            "Each basket has: physical number (unique within FLUPSY), position (row/col or coordinates), state (`available`, `active`, `ready`), current cycle. State is governed by an atomic DB-level invariant: `state`, `currentCycleId` and `cycleCode` are always written together."
          ),
          tip(
            "Da `Gestione Posizioni` puoi spostare le ceste sulla mappa fisica del FLUPSY mantenendo il ciclo attivo.",
            "From `Position Management` you can move baskets on the FLUPSY map while keeping the active cycle."
          ),
        ],
      },
      {
        id: "nfc",
        title: { it: "Tag NFC", en: "NFC Tags" },
        blocks: [
          p(
            "Il modulo NFC consente di programmare etichette fisiche da applicare alle ceste. Lo stato della cesta può essere sovrascritto manualmente tramite NFC con timestamp e operatore.",
            "The NFC module allows programming physical labels to apply to baskets. The basket state can be manually overridden via NFC with timestamp and operator."
          ),
        ],
      },
    ],
  },

  // 4. OPERAZIONI
  {
    id: "operations",
    title: { it: "Operazioni", en: "Operations" },
    intro: {
      it: "Le operazioni sono il cuore del sistema. Ogni evento sulla cesta (prima attivazione, misura, peso, vagliatura, vendita, chiusura, mortalità) viene registrato come operazione con data, valori e operatore. Tutte le operazioni passano per `OperationsLifecycleService` per garantire consistenza dello stato.",
      en: "Operations are the core of the system. Every event on a basket (first activation, measure, weight, screening, sale, closure, mortality) is recorded as an operation with date, values and operator. All operations go through the `OperationsLifecycleService` to guarantee state consistency.",
    },
    sections: [
      {
        id: "op-types",
        title: { it: "Tipi di operazione", en: "Operation types" },
        blocks: [
          kv([
            ["prima-attivazione", "first-activation", "Avvio di un nuovo ciclo: definisce seme iniziale (lotto, animal_count, animals_per_kg, total_weight).", "Start of a new cycle: defines initial seed (lot, animal_count, animals_per_kg, total_weight)."],
            ["prima-attivazione-da-vagliatura", "first-activation-from-screening", "Avvio di ciclo come destinazione di una vagliatura.", "Cycle start as destination of a screening."],
            ["misura", "measure", "Misurazione di una piccola percentuale di campione per stimare animals/kg.", "Measurement of a small sample to estimate animals/kg."],
            ["peso", "weight", "Pesatura totale della cesta per ricalcolare biomassa.", "Total basket weighing to recalculate biomass."],
            ["vagliatura", "screening", "Selezione e ridistribuzione tra setacci (micron).", "Sieve-based selection and redistribution."],
            ["chiusura-ciclo-vendita", "closure-sale", "Vendita finale, chiude il ciclo.", "Final sale, closes the cycle."],
            ["chiusura-ciclo-vagliatura", "closure-screening", "Chiusura ciclo padre dopo vagliatura.", "Parent cycle closure after screening."],
            ["mortalità", "mortality", "Registrazione di mortalità rilevata.", "Detected mortality recording."],
          ]),
        ],
      },
      {
        id: "spreadsheet",
        title: { it: "Modulo Operazioni Spreadsheet", en: "Spreadsheet Operations module" },
        blocks: [
          p(
            "Interfaccia mobile-first stile foglio elettronico: una riga per cesta, celle editabili per inserimento rapido. Validazione live, auto-save, batch su selezione multipla, indicatori colorati di performance.",
            "Mobile-first spreadsheet-like interface: one row per basket, editable cells for fast input. Live validation, auto-save, batch on multi-selection, color-coded performance indicators."
          ),
          tip(
            "Per inserire una serie di misure rapide su molte ceste, usa lo Spreadsheet: il sistema applica automaticamente la regola \"Gusci che volano via\" (mortalità mascherata da conteggio iniziale).",
            "To enter a series of quick measures across many baskets, use the Spreadsheet: the system automatically applies the \"Flying shells\" rule (mortality masked by initial count)."
          ),
        ],
      },
      {
        id: "validations",
        title: { it: "Validazioni e regole", en: "Validations and rules" },
        blocks: [
          ul([
            ["Validazione conteggio animali a doppio livello (frontend + backend).", "Two-layer animal count validation (frontend + backend)."],
            ["Anomalia taglia: regressione (animals/kg che cresce) o salto > 1 classe → chiede conferma.", "Size anomaly: regression (animals/kg increases) or jump > 1 class → asks for confirmation."],
            ["Le operazioni `misura` possono avere la data modificata, rispettando l'ordine cronologico.", "`measure` operations can have their date modified, respecting chronological order."],
            ["Eliminazione operazioni: passa sempre da `OperationsLifecycleService` per evitare disallineamenti di stato.", "Operation deletion always goes through `OperationsLifecycleService` to avoid state misalignment."],
          ]),
        ],
      },
      {
        id: "shells",
        title: { it: 'Regola "Gusci che volano via"', en: '"Flying shells" rule' },
        blocks: [
          p(
            "Quando una `misura` registra mortalità % ≤ alla mortalità rolling-max delle operazioni precedenti del ciclo, il conteggio animali NON viene ridotto. I gusci morti si presumono già contati nella prima attivazione e si sono semplicemente staccati. Solo la mortalità in eccesso oltre il massimo storico riduce il conteggio.",
            "When a `measure` records mortality % ≤ the rolling-max mortality % of previous cycle operations, the animal count is NOT reduced. Dead shells are presumed to have already been counted at first activation and simply washed away. Only excess mortality beyond the historical max reduces the count."
          ),
          note(
            "Implementato in `server/utils/misura-mortality.ts`. Endpoint admin `POST /api/admin/recalc-misure/apply` per ricalcolo storico.",
            "Implemented in `server/utils/misura-mortality.ts`. Admin endpoint `POST /api/admin/recalc-misure/apply` for historical recompute."
          ),
        ],
      },
    ],
  },

  // 5. CICLI E LOTTI
  {
    id: "cycles-lots",
    title: { it: "Cicli e Lotti", en: "Cycles and Lots" },
    sections: [
      {
        id: "cycles",
        title: { it: "Cicli produttivi", en: "Production cycles" },
        blocks: [
          p(
            "Ogni ciclo è univocamente identificato da `cycleCode`. Stati: `attivo`, `chiuso`. Alla creazione viene classificato automaticamente con `qualityClass` (PREMIUM, NORMAL, SUB) in base alla storia di vagliature del lotto.",
            "Each cycle is uniquely identified by `cycleCode`. States: `active`, `closed`. At creation it's auto-classified with `qualityClass` (PREMIUM, NORMAL, SUB) based on the lot's screening history."
          ),
          h3("Report Ciclo", "Cycle Report"),
          p(
            "Dalla scheda ciclo puoi vedere la timeline completa delle operazioni, la proiezione di crescita futura e l'IMM specifico.",
            "From the cycle page you can see the full operations timeline, future growth projection and cycle-specific IMM."
          ),
        ],
      },
      {
        id: "lots",
        title: { it: "Lotti di seme", en: "Seed lots" },
        blocks: [
          p(
            "I lotti rappresentano partite di seme di provenienza esterna. Campi principali: fornitore, data arrivo, animal_count iniziale, animals_per_kg, prezzo. `Report Lotto` mostra il bilancio attuale, la distribuzione tra cicli e la timeline.",
            "Lots represent seed batches from external sources. Main fields: supplier, arrival date, initial animal_count, animals_per_kg, price. `Lot Report` shows current balance, distribution among cycles and timeline."
          ),
        ],
      },
    ],
  },

  // 6. VAGLIATURA
  {
    id: "screening",
    title: { it: "Vagliatura (Selezione)", en: "Screening (Selection)" },
    sections: [
      {
        id: "screening-flow",
        title: { it: "Flusso di vagliatura", en: "Screening flow" },
        blocks: [
          ol([
            ["Seleziona le ceste di origine (una o più).", "Select source baskets (one or more)."],
            ["Indica i setacci usati (maglia superiore + e inferiore - in micron).", "Specify the sieves used (upper + and lower - mesh in microns)."],
            ["Definisci le ceste di destinazione (anche su FLUPSY diversi → cross-FLUPSY).", "Define destination baskets (also on different FLUPSY → cross-FLUPSY)."],
            ["Inserisci i conteggi animali per ogni destinazione.", "Enter animal counts for each destination."],
            ["Conferma: il sistema chiude i cicli sorgente e apre i nuovi cicli destinazione.", "Confirm: the system closes source cycles and opens new destination cycles."],
          ]),
          tip(
            "Il `DraggableCalculator` aiuta a distribuire gli animali tra le ceste destinazione mantenendo il totale.", 
            "The `DraggableCalculator` helps distribute animals across destination baskets while keeping the total constant."
          ),
        ],
      },
      {
        id: "cross-flupsy",
        title: { it: "Vagliatura cross-FLUPSY", en: "Cross-FLUPSY screening" },
        blocks: [
          p(
            "Le ceste destinazione possono trovarsi su FLUPSY diversi da quelli di origine. La vagliatura viene marcata con `is_cross_flupsy = true` e arricchita con metadati di trasporto (mezzo, operatore, distanza).",
            "Destination baskets can be on different FLUPSYs than sources. The screening is marked `is_cross_flupsy = true` and enriched with transport metadata (vehicle, operator, distance)."
          ),
        ],
      },
    ],
  },

  // 7. VENDITE E DDT
  {
    id: "sales",
    title: { it: "Vendite Avanzate e DDT", en: "Advanced Sales and DDT" },
    sections: [
      {
        id: "sales-flow",
        title: { it: "Flusso di vendita", en: "Sales flow" },
        blocks: [
          ol([
            ["Crea una vendita selezionando cliente e ceste/cicli da vendere.", "Create a sale selecting customer and baskets/cycles to sell."],
            ["Specifica quantità, taglia e prezzo (eventualmente da listino).", "Specify quantity, size and price (optionally from price list)."],
            ["Modalità multi-cliente: una sola operazione sorgente può generare più vendite (una per cliente).", "Multi-customer mode: a single source operation can generate multiple sales (one per customer)."],
            ["Genera DDT: stato `bozza`, poi `emesso` quando confermato.", "Generate DDT: state `draft`, then `issued` when confirmed."],
            ["Integrazione Fatture in Cloud e FCloud esterno con sincronizzazione bidirezionale.", "Fatture in Cloud and external FCloud integration with bidirectional sync."],
          ]),
        ],
      },
      {
        id: "ddt",
        title: { it: "DDT (Documento di Trasporto)", en: "DDT (Transport Document)" },
        blocks: [
          p(
            "Il DDT contiene snapshot immutabile dei dati cliente, subtotali per taglia, tracciabilità completa dei cicli/lotti origine. Tre stati: `bozza`, `emesso`, `integrato`.",
            "DDT contains an immutable snapshot of customer data, subtotals by size, full traceability of source cycles/lots. Three states: `draft`, `issued`, `integrated`."
          ),
          warn(
            "Una volta integrato il DDT con Fatture in Cloud, i dati cliente non possono più essere modificati: ricrearlo se serve correggere.",
            "Once the DDT is integrated with Fatture in Cloud, customer data cannot be modified anymore: recreate it to correct."
          ),
        ],
      },
    ],
  },

  // 8. INVENTARIO
  {
    id: "inventory",
    title: { it: "Inventario e Giacenze", en: "Inventory and Stock" },
    sections: [
      {
        id: "stock",
        title: { it: "Giacenze attuali", en: "Current stock" },
        blocks: [
          p(
            "Pagina `Inventario` mostra il magazzino in tempo reale: animali per taglia, per FLUPSY, per lotto. Filtri per stato ciclo, range data e taglia.",
            "The `Inventory` page shows real-time stock: animals by size, FLUPSY, lot. Filters by cycle state, date range and size."
          ),
        ],
      },
      {
        id: "range",
        title: { it: "Calcolo per range", en: "Range calculation" },
        blocks: [
          p(
            "`Giacenze Range` calcola la giacenza tra due date arbitrarie, ricostruendo le operazioni avvenute nell'intervallo.",
            "`Range Stock` calculates stock between two arbitrary dates, reconstructing operations in the interval."
          ),
        ],
      },
    ],
  },

  // 9. IMM — il capitolo grosso
  {
    id: "imm",
    title: { it: "IMM — Indice di Maturità del Magazzino", en: "IMM — Inventory Ripeness Index" },
    intro: {
      it: "L'IMM è un punteggio 0-100 che misura quanto il magazzino di animali è vicino alla taglia commerciale obiettivo, considerando dimensione, tempo, qualità e affidabilità del dato. Più alto = più 'maturo' e pronto alla vendita.",
      en: "The IMM is a 0-100 score measuring how close the inventory is to the target commercial size, considering size, time, quality and data reliability. Higher = more 'ripe' and sale-ready.",
    },
    sections: [
      {
        id: "imm-formula",
        title: { it: "Formula e componenti", en: "Formula and components" },
        blocks: [
          p(
            "L'IMM è la media ponderata di 4 componenti, ciascuna nell'intervallo 0-100, pesata per il numero di animali del ciclo. I pesi sono configurabili e normalizzati al 100%.",
            "The IMM is the weighted average of 4 components, each in the 0-100 range, weighted by the cycle's animal count. Weights are configurable and normalized to 100%."
          ),
          kv([
            ["Size (peso default 40)", "Size (default weight 40)", "Quanto la taglia attuale (animals/kg) è vicina al target. 0 = lontanissima (animali troppo piccoli), 100 = al target o oltre.", "How close the current size (animals/kg) is to the target. 0 = very far (animals too small), 100 = at target or beyond."],
            ["Time (peso default 35)", "Time (default weight 35)", "Quanti giorni mancano al raggiungimento del target secondo l'SGR del ciclo. 100 = già pronto, 0 = oltre l'orizzonte (default 180 giorni).", "Days remaining to reach target according to cycle SGR. 100 = already ready, 0 = beyond horizon (default 180 days)."],
            ["Quality (peso default 15)", "Quality (default weight 15)", "Classe qualità del ciclo: PREMIUM=100, NORMAL=70, SUB=40, sconosciuta=50.", "Cycle quality class: PREMIUM=100, NORMAL=70, SUB=40, unknown=50."],
            ["Reliability (peso default 10)", "Reliability (default weight 10)", "Penalità sulla mortalità cumulativa: 100 a 0 % mortalità, 0 a `maxMortalityPct` (default 30%).", "Penalty on cumulative mortality: 100 at 0% mortality, 0 at `maxMortalityPct` (default 30%)."],
          ]),
          h3("Formula matematica", "Mathematical formula"),
          { type: "code", text: { it: "IMM_ciclo = (wS·S + wT·T + wQ·Q + wR·R) / (wS + wT + wQ + wR)\nIMM_globale = Σ(IMM_ciclo · animali_ciclo) / Σ(animali_ciclo)", en: "IMM_cycle = (wS·S + wT·T + wQ·Q + wR·R) / (wS + wT + wQ + wR)\nIMM_global = Σ(IMM_cycle · animals_cycle) / Σ(animals_cycle)" } },
        ],
      },
      {
        id: "imm-kpi",
        title: { it: "KPI in pagina", en: "Page KPIs" },
        blocks: [
          kv([
            ["IMM Magazzino", "Inventory IMM", "Punteggio globale 0-100 media ponderata per animali.", "Global 0-100 score weighted by animal count."],
            ["Cicli attivi inclusi", "Active cycles included", "Cicli con almeno una `misura` o `peso` valida (cancellate escluse).", "Cycles with at least one valid `measure` or `weight` (cancelled excluded)."],
            ["Totale animali", "Total animals", "Somma ultima `animal_count` per ciclo attivo (mostrata compatta).", "Sum of last `animal_count` per active cycle (compact display)."],
            ["Valore attuale (€)", "Current value (€)", "Animali × prezzo €/animale della taglia corrente (da `sales_price_list`).", "Animals × €/animal price of current size (from `sales_price_list`)."],
            ["Valore a target (€)", "Target value (€)", "Animali × prezzo €/animale alla taglia target (potenziale se tutti maturano).", "Animals × €/animal price at target size (potential if all ripen)."],
            ["Valore maturo (€)", "Ripe value (€)", "Valore target × IMM/100, stima realistica considerando lo stato attuale.", "Target value × IMM/100, realistic estimate considering current state."],
          ]),
        ],
      },
      {
        id: "imm-dist",
        title: { it: "Distribuzione e tabelle", en: "Distribution and tables" },
        blocks: [
          p(
            "Sotto i KPI trovi 4 viste:", 
            "Below the KPIs you'll find 4 views:"
          ),
          ul([
            ["Componenti IMM (media ponderata): barre Size, Time, Quality, Reliability per capire il principale fattore limitante.", "IMM components (weighted average): Size, Time, Quality, Reliability bars to understand the main limiting factor."],
            ["Distribuzione per fasce IMM: 0-25 (lontano), 25-50 (in crescita), 50-75 (avvicinamento), 75-100 (pronto).", "IMM bucket distribution: 0-25 (far), 25-50 (growing), 50-75 (approaching), 75-100 (ready)."],
            ["Tabella per FLUPSY: confronto IMM tra impianti per identificare quelli più maturi.", "Per-FLUPSY table: compare IMM across installations to spot the most ripe ones."],
            ["Tabella per Lotto: capire quali lotti stanno maturando più velocemente.", "Per-Lot table: see which lots are ripening faster."],
          ]),
        ],
      },
      {
        id: "imm-trend",
        title: { it: "Trend e snapshot giornalieri", en: "Trend and daily snapshots" },
        blocks: [
          p(
            "Ogni notte alle 03:30 lo scheduler salva uno snapshot in `imm_snapshots` (transazionale per non perdere dati). Il grafico storico mostra gli ultimi 90 giorni con IMM globale e tutte le 4 componenti.",
            "Every night at 03:30 the scheduler saves a snapshot to `imm_snapshots` (transactional to avoid data loss). The history chart shows the last 90 days with global IMM and all 4 components."
          ),
          tip(
            "Usa il pulsante `Snapshot ora` per forzare un salvataggio manuale, utile dopo grandi vagliature.",
            "Use the `Snapshot now` button to force a manual save, useful after big screenings."
          ),
        ],
      },
      {
        id: "imm-coverage",
        title: { it: "Copertura ordini", en: "Order coverage" },
        blocks: [
          p(
            "La tabella `Copertura ordini per taglia` confronta:",
            "The `Order coverage by size` table compares:"
          ),
          ul([
            ["Domanda: animali richiesti dagli ordini (parsing campo `nome` con regex `screen(\\d+)`).", "Demand: animals required by orders (parsing `name` field with regex `screen(\\d+)`)."],
            ["Offerta: animali disponibili nella taglia (somma cicli attivi).", "Supply: animals available at that size (sum of active cycles)."],
            ["Pronti (IMM≥75): solo quelli effettivamente maturi.", "Ready (IMM≥75): only those actually ripe."],
            ["Gap: domanda − offerta_matura. Negativo = surplus.", "Gap: demand − ripe_supply. Negative = surplus."],
            ["Copertura %: quanto è coperta la domanda con offerta matura.", "Coverage %: how much demand is covered by ripe supply."],
          ]),
        ],
      },
      {
        id: "imm-config",
        title: { it: "Configurazione persistita", en: "Persistent configuration" },
        blocks: [
          p(
            "Dalla card `Configurazione pesi e soglie` puoi modificare e salvare su DB: i 4 pesi, l'orizzonte (giorni), l'SGR di fallback, la mortalità baseline e massima, la taglia target di default.",
            "From the `Weights and thresholds` card you can edit and save to DB: the 4 weights, horizon (days), fallback SGR, baseline/max mortality, default target size."
          ),
          note(
            "I parametri salvati sono usati come base; i parametri passati in query URL li sovrascrivono temporaneamente.",
            "Saved parameters are used as base; URL query parameters temporarily override them."
          ),
        ],
      },
      {
        id: "imm-export",
        title: { it: "Export Excel", en: "Excel export" },
        blocks: [
          p(
            "Il pulsante `Esporta Excel` genera un file con 6 fogli: Riepilogo, Distribuzione, Per FLUPSY, Per Lotto, Cicli attivi, Copertura ordini. Utile per analisi offline o condivisione con il gestionale aziendale.",
            "The `Export Excel` button generates a file with 6 sheets: Summary, Distribution, By FLUPSY, By Lot, Active Cycles, Order Coverage. Useful for offline analysis or sharing with corporate ERP."
          ),
        ],
      },
      {
        id: "imm-interpret",
        title: { it: "Interpretazione e uso operativo", en: "Interpretation and operational use" },
        blocks: [
          kv([
            ["0-25", "0-25", "Magazzino lontano dal target: animali piccoli o lotti molto giovani. Pianificare cicli di crescita lunghi.", "Inventory far from target: small animals or very young lots. Plan long growth cycles."],
            ["25-50", "25-50", "In crescita. Monitorare SGR e mortalità, valutare vagliature di selezione.", "Growing. Monitor SGR and mortality, evaluate selection screenings."],
            ["50-75", "50-75", "Avvicinamento al target: organizzare la pianificazione vendite.", "Approaching target: start sales planning."],
            ["75-100", "75-100", "Pronto alla vendita. Verificare ordini e priorità di evasione.", "Ready for sale. Check orders and fulfillment priorities."],
          ]),
          tip(
            "Confronta componenti Size e Time: se Size è alto ma Time è basso, gli animali sono grandi ma manca poco al target. Se Time è alto ma Size è basso, c'è un'incongruenza — controllare l'SGR del ciclo.",
            "Compare Size and Time components: if Size is high but Time is low, animals are large but close to target. If Time is high but Size is low, there's an inconsistency — check the cycle SGR."
          ),
          warn(
            "L'IMM non include automaticamente le scadenze degli ordini perché gli ordini condivisi non hanno `due_date`. Aggiungere date di consegna per attivare boost di urgenza.",
            "IMM does not automatically include order deadlines because shared orders lack `due_date`. Add delivery dates to enable urgency boost."
          ),
        ],
      },
    ],
  },

  // 10. AMBIENTALE
  {
    id: "environmental",
    title: { it: "Diario Ambientale", en: "Environmental Log" },
    sections: [
      {
        id: "env-data",
        title: { it: "Dati ambientali", en: "Environmental data" },
        blocks: [
          p(
            "Ad ogni login il sistema acquisisce automaticamente un snapshot dei dati marini dalla rete Copernicus/Open-Meteo (temperatura, salinità, ossigeno, corrente) e dalle boe ARPAV Vallona e ARPAE Gorino 2. La pagina dedicata mostra trend grafici, tabella e export CSV.",
            "On each login the system automatically captures a snapshot of marine data from Copernicus/Open-Meteo network (temperature, salinity, oxygen, current) and from ARPAV Vallona and ARPAE Gorino 2 buoys. The dedicated page shows trend charts, table and CSV export."
          ),
        ],
      },
    ],
  },

  // 11. AI E ANALISI
  {
    id: "ai",
    title: { it: "AI e Analisi", en: "AI and Analytics" },
    sections: [
      {
        id: "ai-features",
        title: { it: "Funzionalità AI (GPT-4o)", en: "AI features (GPT-4o)" },
        blocks: [
          ul([
            ["AI Dashboard: KPI con commento generato dall'IA.", "AI Dashboard: KPIs with AI-generated commentary."],
            ["Attività Consigliate: lista priorità giornaliere generate analizzando lo stato delle ceste.", "Recommended Activities: daily prioritized list generated by analyzing basket state."],
            ["AI Report Generator: report PDF con narrativa.", "AI Report Generator: PDF reports with narrative."],
            ["AI Enhanced (beta): query in linguaggio naturale sul database.", "AI Enhanced (beta): natural language queries on the database."],
            ["Analisi Scostamenti: confronto AI tra budget, ordini e produzione proiettata.", "Variance Analysis: AI comparison of budget, orders and projected production."],
            ["Anomaly detection sulle operazioni di misura.", "Anomaly detection on measure operations."],
          ]),
        ],
      },
    ],
  },

  // 12. PIANIFICAZIONE
  {
    id: "planning",
    title: { it: "Pianificazione", en: "Planning" },
    sections: [
      {
        id: "growth-projection",
        title: { it: "Proiezione di crescita", en: "Growth projection" },
        blocks: [
          p(
            "Simulazione giorno-per-giorno della crescita dell'inventario attuale fino al raggiungimento di una taglia target, con mortalità incorporata. Mostra progressione mensile e quando ogni ciclo sarà pronto.",
            "Day-by-day simulation of current inventory growth until target size, with mortality incorporated. Shows monthly progression and when each cycle will be ready."
          ),
        ],
      },
      {
        id: "sales-planning",
        title: { it: "Pianificazione Vendite Ottimizzata", en: "Optimized Sales Planning" },
        blocks: [
          p(
            "Modulo dual-engine (greedy + LP) che bilancia cassa, ricavi e copertura ordini su orizzonti 6-36 mesi. Tre modalità: `cassa` (massimizza liquidità), `bilanciato`, `ricavo` (massimizza fatturato).",
            "Dual-engine module (greedy + LP) balancing cash, revenue and order coverage over 6-36 month horizons. Three modes: `cash` (maximize liquidity), `balanced`, `revenue` (maximize turnover)."
          ),
        ],
      },
    ],
  },

  // 13. SISTEMA E BACKUP
  {
    id: "system",
    title: { it: "Sistema, Backup e Sicurezza", en: "System, Backup and Security" },
    sections: [
      {
        id: "backup",
        title: { it: "Backup automatico", en: "Automatic backup" },
        blocks: [
          p(
            "Backup giornaliero automatico del database con retention 7 giorni. Restore manuale dalla pagina `Database Backup`. Logging audit per tutte le operazioni critiche in `audit_logs`.",
            "Daily automatic database backup with 7-day retention. Manual restore from `Database Backup` page. Audit logging for all critical operations in `audit_logs`."
          ),
        ],
      },
      {
        id: "integrity",
        title: { it: "Controllo integrità notturno", en: "Nightly integrity check" },
        blocks: [
          p(
            "Scheduler automatico che verifica consistenza stato ceste (state/currentCycleId/cycleCode), record orfani e violazioni di FK. Eventuali anomalie vengono notificate.",
            "Automatic scheduler verifying basket state consistency (state/currentCycleId/cycleCode), orphan records and FK violations. Any anomaly is notified."
          ),
        ],
      },
      {
        id: "secrets",
        title: { it: "Variabili d'ambiente", en: "Environment variables" },
        blocks: [
          ul([
            ["`DATABASE_URL`: connessione PostgreSQL.", "`DATABASE_URL`: PostgreSQL connection."],
            ["`OPENAI_API_KEY`: chiave OpenAI per le funzioni AI.", "`OPENAI_API_KEY`: OpenAI key for AI features."],
            ["`FATTUREINCLOUD_*`: token di integrazione fatturazione.", "`FATTUREINCLOUD_*`: invoicing integration tokens."],
            ["`EXTERNAL_API_KEY`: protezione endpoint esterni.", "`EXTERNAL_API_KEY`: external endpoint protection."],
          ]),
        ],
      },
    ],
  },

  // 14. TROUBLESHOOTING
  {
    id: "troubleshooting",
    title: { it: "Risoluzione problemi", en: "Troubleshooting" },
    sections: [
      {
        id: "common",
        title: { it: "Problemi comuni", en: "Common issues" },
        blocks: [
          kv([
            ["Cesta in stato incoerente", "Inconsistent basket state", "Eseguire controllo integrità notturno o usare endpoint admin di riallineamento.", "Run nightly integrity check or use admin re-alignment endpoint."],
            ["IMM = 0 ma ci sono cicli", "IMM = 0 but cycles exist", "I cicli potrebbero non avere `misura`/`peso` valida. Inserire una misura.", "Cycles may lack a valid `measure`/`weight`. Enter a measure."],
            ["DDT non integrato", "DDT not integrated", "Verificare token Fatture in Cloud nelle impostazioni.", "Check Fatture in Cloud token in settings."],
            ["WebSocket disconnesso", "WebSocket disconnected", "Aggiornare la pagina; in sviluppo è normale durante hot-reload.", "Refresh the page; in dev it's normal during hot-reload."],
            ["Notifica taglia raggiunta errata", "Wrong target-size notification", "Verificare unità: `animals_per_kg` viene letta direttamente, non calcolata da peso.", "Check units: `animals_per_kg` is read directly, not computed from weight."],
          ]),
        ],
      },
    ],
  },

  // 15. APPENDICE TAGLIE
  {
    id: "size-scale",
    title: { it: "Appendice: Scala Taglie", en: "Appendix: Size Scale" },
    sections: [
      {
        id: "size-rules",
        title: { it: "Regole della scala", en: "Scale rules" },
        blocks: [
          warn(
            "L'ID nella tabella `sizes` è ARBITRARIO: non confrontare mai le taglie usando l'ID.",
            "The ID in the `sizes` table is ARBITRARY: never compare sizes using ID."
          ),
          p(
            "L'unico modo corretto è verificare in quale intervallo `(min_animals_per_kg, max_animals_per_kg)` cade il valore `animals_per_kg` misurato, poi ordinare per `min_animals_per_kg` crescente.",
            "The only correct way is to check which `(min_animals_per_kg, max_animals_per_kg)` range the measured `animals_per_kg` falls into, then sort by `min_animals_per_kg` ascending."
          ),
          ul([
            ["Più animali/kg → animale più piccolo → taglia commerciale più piccola.", "More animals/kg → smaller animal → smaller commercial size."],
            ["Meno animali/kg → animale più grande → taglia commerciale più grande.", "Fewer animals/kg → bigger animal → bigger commercial size."],
            ["TP-10000 (801-1.200/kg) = animali più grandi. TP-180 (70M-100M/kg) = larve.", "TP-10000 (801-1,200/kg) = biggest. TP-180 (70M-100M/kg) = larvae."],
          ]),
        ],
      },
      {
        id: "weight-units",
        title: { it: "Unità di peso", en: "Weight units" },
        blocks: [
          kv([
            ["Database", "Database", "Tutti i pesi in GRAMMI.", "All weights in GRAMS."],
            ["Form di input", "Input forms", "Accettano GRAMMI con etichetta chiara.", "Accept GRAMS with clear label."],
            ["Visualizzazione \"Peso (kg)\"", "Display \"Weight (kg)\"", "I valori sono divisi per 1000 nella UI.", "Values are divided by 1000 in the UI."],
          ]),
        ],
      },
    ],
  },
];

export function getChapter(id: string): ManualChapter | undefined {
  return MANUAL.find((c) => c.id === id);
}
