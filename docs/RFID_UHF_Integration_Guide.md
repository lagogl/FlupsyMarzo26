# Guida Integrazione RFID UHF - App Esterna

## Introduzione

Questo documento descrive come integrare un'applicazione esterna con lettore/scrittore RFID UHF con il database FLUPSY Delta Futuro. L'obiettivo è permettere l'identificazione rapida dei cestelli (baskets) durante le operazioni in campo.

---

## Architettura del Sistema

### Componenti Principali

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   App RFID UHF      │ ←→  │   API REST Backend  │ ←→  │   PostgreSQL DB     │
│   (Sviluppatore)    │     │   (Express.js)      │     │   (Neon/Replit)     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

### Base URL API
- **Sviluppo**: `https://[replit-url].replit.dev`
- **Produzione**: `https://[app-name].replit.app`

---

## Schema Database - Entità Principali

### 1. FLUPSY (Sistema Galleggiante)

```sql
CREATE TABLE flupsys (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,                    -- Nome identificativo (es. "FLUPSY 1")
    location TEXT,                         -- Località
    description TEXT,                      -- Descrizione
    active BOOLEAN DEFAULT TRUE,           -- Se attivo
    max_positions INTEGER DEFAULT 10,      -- Posizioni per fila
    production_center TEXT                 -- Centro produzione
);
```

### 2. BASKETS (Cestelli) - TABELLA PRINCIPALE PER RFID

```sql
CREATE TABLE baskets (
    id SERIAL PRIMARY KEY,
    physical_number INTEGER NOT NULL,      -- Numero fisico stampato sul cestello
    flupsy_id INTEGER NOT NULL,            -- FK → flupsys.id
    cycle_code TEXT,                       -- Codice ciclo (formato: CESTA-FLUPSY-YYMM)
    state TEXT DEFAULT 'available',        -- 'available' | 'active'
    current_cycle_id INTEGER,              -- FK → cycles.id (NULL se non in ciclo)
    
    -- CAMPI NFC (sistema legacy)
    nfc_data TEXT,                         -- ID univoco tag NFC (es. "basket-86-1703067234567")
    nfc_last_programmed_at TIMESTAMP,      -- Data/ora programmazione NFC
    
    -- CAMPI RFID UHF (sistema nuovo)
    rfid_uhf_epc TEXT,                     -- EPC del tag RFID UHF programmato
    rfid_uhf_programmed_at TIMESTAMP,      -- Data/ora programmazione tag RFID UHF
    
    row TEXT NOT NULL,                     -- Fila: 'DX' | 'SX' | 'C'
    position INTEGER NOT NULL,             -- Posizione nella fila (1, 2, 3...)
    group_id INTEGER                       -- FK → basket_groups.id (opzionale)
);
```

**NOTA IMPORTANTE sul Tag RFID UHF:**
- Il tag RFID UHF rimane associato al **cesto fisico** (`baskets.rfid_uhf_epc`)
- **NON va cancellato** quando si chiude un ciclo
- Il tag identifica il cesto fisico, non il ciclo
- Quando il cesto viene riutilizzato in un nuovo ciclo, il tag rimane valido

**Stati del cestello:**
| Stato | Descrizione |
|-------|-------------|
| `available` | Cestello vuoto, disponibile per nuovo ciclo |
| `active` | Cestello con ciclo attivo, contiene animali |

### 3. CYCLES (Cicli Produttivi)

```sql
CREATE TABLE cycles (
    id SERIAL PRIMARY KEY,
    basket_id INTEGER NOT NULL,            -- FK → baskets.id
    lot_id INTEGER,                        -- FK → lots.id
    start_date DATE NOT NULL,              -- Data inizio ciclo
    end_date DATE,                         -- Data fine (NULL se attivo)
    state TEXT DEFAULT 'active'            -- 'active' | 'closed'
);
```

### 4. OPERATIONS (Operazioni)

```sql
CREATE TABLE operations (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    type TEXT NOT NULL,                    -- Tipo operazione (vedi sotto)
    basket_id INTEGER NOT NULL,            -- FK → baskets.id
    cycle_id INTEGER NOT NULL,             -- FK → cycles.id
    size_id INTEGER NOT NULL,              -- FK → sizes.id (OBBLIGATORIO)
    lot_id INTEGER,                        -- FK → lots.id
    animal_count INTEGER,                  -- Numero animali
    total_weight REAL,                     -- Peso totale in GRAMMI
    animals_per_kg INTEGER,                -- Animali per kg (per calcolo taglia)
    average_weight REAL,                   -- Peso medio in milligrammi
    dead_count INTEGER,                    -- Animali morti
    mortality_rate REAL,                   -- % mortalità
    notes TEXT,
    metadata TEXT,                         -- JSON per dati extra
    source TEXT DEFAULT 'desktop_manager'  -- 'desktop_manager' | 'mobile_nfc'
);
```

**Tipi di operazione:**
| Tipo | Descrizione |
|------|-------------|
| `prima-attivazione` | Prima attivazione ciclo |
| `pulizia` | Pulizia cestello |
| `vagliatura` | Selezione per taglia |
| `trattamento` | Trattamento sanitario |
| `misura` | Misurazione/pesatura |
| `vendita` | Vendita animali |
| `cessazione` | Fine ciclo |

### 5. SIZES (Taglie)

```sql
CREATE TABLE sizes (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,             -- Es: 'T0', 'T1', 'TP-3000', 'M1'
    name TEXT NOT NULL,                    -- Nome descrittivo
    size_mm REAL,                          -- Dimensione in mm
    min_animals_per_kg INTEGER,            -- Range minimo animali/kg
    max_animals_per_kg INTEGER,            -- Range massimo animali/kg
    color TEXT                             -- Colore HEX per UI
);
```

**Calcolo taglia automatico:**
La taglia viene determinata dal valore `animals_per_kg`:
- Se `animals_per_kg` rientra nel range `min_animals_per_kg` - `max_animals_per_kg` di una taglia, quella è la taglia assegnata.

### 6. LOTS (Lotti)

```sql
CREATE TABLE lots (
    id SERIAL PRIMARY KEY,
    arrival_date DATE NOT NULL,
    supplier TEXT NOT NULL,                -- Fornitore
    supplier_lot_number TEXT,              -- Numero lotto fornitore
    animal_count INTEGER,                  -- Numero animali iniziale
    weight REAL,                           -- Peso in grammi
    size_id INTEGER,                       -- FK → sizes.id
    state TEXT DEFAULT 'active',           -- 'active' | 'exhausted'
    total_mortality INTEGER DEFAULT 0      -- Mortalità cumulativa
);
```

---

## Relazioni tra Entità

```
FLUPSY (1) ──────── (N) BASKETS
                         │
                         ├── (1) CURRENT_CYCLE ──── (N) OPERATIONS
                         │                               │
                         │                               └── SIZE
                         │                               └── LOT
                         │
                         └── NFC_DATA (tag RFID)
```

### Gerarchia Logica

1. **FLUPSY** contiene N **BASKETS**
2. Ogni **BASKET** può avere un **CYCLE** attivo (`current_cycle_id`)
3. Ogni **CYCLE** appartiene a un **LOT** (lotto di provenienza)
4. Ogni **OPERATION** registra un'azione su un **CYCLE**
5. Ogni **OPERATION** ha una **SIZE** (taglia) determinata dagli animali/kg

---

## Gestione Cicli Produttivi (CYCLES)

### Concetto di Ciclo

Un **ciclo produttivo** rappresenta il periodo di vita degli animali in un cestello, dalla prima attivazione fino alla vendita o cessazione. È l'entità centrale per tracciare tutte le operazioni.

### Stati del Ciclo

| Stato | Descrizione |
|-------|-------------|
| `active` | Ciclo in corso, animali presenti nel cestello |
| `closed` | Ciclo terminato (vendita, cessazione, vagliatura) |

### Relazione Ciclo ↔ Cestello

```
BASKET (cestello fisico)
  │
  ├── state: 'available'  →  current_cycle_id: NULL (nessun ciclo)
  │
  └── state: 'active'     →  current_cycle_id: 123 (ciclo attivo)
                               │
                               └── CYCLE id=123
                                     │
                                     ├── lot_id → LOTTO di provenienza
                                     ├── start_date → Data inizio
                                     ├── end_date → NULL (attivo) o data fine
                                     └── state → 'active' o 'closed'
```

### INVARIANTE CRITICA

**Il campo `current_cycle_id` del cestello DEVE sempre corrispondere al ciclo attivo.**

Quando il ciclo viene chiuso:
1. `cycles.state` → `'closed'`
2. `cycles.end_date` → data di chiusura
3. `baskets.state` → `'available'`
4. `baskets.current_cycle_id` → `NULL`

Questa sincronizzazione è **atomica** e gestita dal backend.

### Ciclo di Vita Completo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CICLO DI VITA CESTELLO                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   CESTELLO VUOTO                                                            │
│   state: 'available'                                                        │
│   current_cycle_id: NULL                                                    │
│         │                                                                   │
│         ▼                                                                   │
│   ┌─────────────────────┐                                                   │
│   │  PRIMA ATTIVAZIONE  │  ← Operazione type='prima-attivazione'            │
│   │  (Creazione Ciclo)  │                                                   │
│   └─────────────────────┘                                                   │
│         │                                                                   │
│         ▼                                                                   │
│   CESTELLO ATTIVO                                                           │
│   state: 'active'                                                           │
│   current_cycle_id: 123                                                     │
│         │                                                                   │
│         │  ┌──────────────────────────────────────────┐                     │
│         │  │         OPERAZIONI SUL CICLO             │                     │
│         │  ├──────────────────────────────────────────┤                     │
│         │  │  • misura (pesatura)                     │                     │
│         │  │  • pulizia                               │                     │
│         │  │  • trattamento                           │                     │
│         │  │  • vagliatura (può creare nuovi cicli)   │                     │
│         │  └──────────────────────────────────────────┘                     │
│         │                                                                   │
│         ▼                                                                   │
│   ┌─────────────────────┐                                                   │
│   │  CHIUSURA CICLO     │  ← Operazione type='vendita' o 'cessazione'       │
│   └─────────────────────┘                                                   │
│         │                                                                   │
│         ▼                                                                   │
│   CESTELLO VUOTO                                                            │
│   state: 'available'  (torna disponibile per nuovo ciclo)                   │
│   current_cycle_id: NULL                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### API Cicli

#### Lista tutti i cicli
```
GET /api/cycles?state=active&includeAll=true
```

**Risposta:**
```json
{
  "cycles": [
    {
      "id": 123,
      "basketId": 86,
      "lotId": 45,
      "startDate": "2024-10-15",
      "endDate": null,
      "state": "active",
      "basketPhysicalNumber": 6,
      "flupsyId": 1,
      "flupsyName": "FLUPSY 1",
      "lotSupplier": "Fornitore ABC"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalCount": 45,
    "totalPages": 5
  }
}
```

#### Cicli attivi con dettagli
```
GET /api/cycles/active-with-details
```

#### Singolo ciclo
```
GET /api/cycles/:id
```

#### Cicli di un cestello (storico)
```
GET /api/cycles/basket/:basketId
```

**Risposta:** Array di tutti i cicli (attivi e chiusi) di quel cestello, ordinati per data decrescente.

#### Creazione nuovo ciclo
```
POST /api/cycles
```

**Body:**
```json
{
  "basketId": 86,
  "lotId": 45,
  "startDate": "2024-12-20"
}
```

**Note:**
- Il backend imposta automaticamente `state: 'active'`
- Il backend aggiorna `baskets.current_cycle_id` e `baskets.state`
- Va creata anche un'operazione di tipo `prima-attivazione`

#### Chiusura ciclo
```
POST /api/cycles/:id/close
```

**Body (opzionale):**
```json
{
  "endDate": "2024-12-20"
}
```

**Effetti automatici:**
1. `cycles.state` → `'closed'`
2. `cycles.end_date` → data fornita o oggi
3. `baskets.state` → `'available'`
4. `baskets.current_cycle_id` → `NULL`

### Storico Operazioni di un Ciclo

```
GET /api/operations?cycleId=123
```

Restituisce tutte le operazioni registrate per quel ciclo, ordinate per data.

### Operazioni e loro Effetti sul Ciclo

| Operazione | Effetto sul Ciclo |
|------------|-------------------|
| `prima-attivazione` | Crea il ciclo, attiva cestello |
| `misura` | Registra dati, ciclo rimane attivo |
| `pulizia` | Registra operazione, ciclo attivo |
| `vagliatura` | Può chiudere ciclo e creare nuovi cicli nei cestelli destinazione |
| `vendita` | Chiude il ciclo |
| `cessazione` | Chiude il ciclo (senza vendita) |

### Best Practice per App RFID

1. **Prima di registrare operazioni**: Verificare sempre che `basket.state === 'active'` e `basket.currentCycleId` non sia NULL

2. **Per nuove attivazioni**: Usare cestelli con `state === 'available'`

3. **Non modificare direttamente**: I campi `current_cycle_id` e `state` del cestello sono gestiti dal backend durante creazione/chiusura ciclo

4. **Storico completo**: Usare `GET /api/cycles/basket/:basketId` per vedere tutti i cicli passati di un cestello

---

## Gestione Tag RFID/NFC

### Come Funziona Attualmente

1. **Sul tag fisico**: Viene scritto un URL con dati JSON codificati nel fragment:
   ```
   https://app.example.com/cycles/123#nfc={"basketId":86,"physicalNumber":6,...}
   ```

2. **Nel database**: Il campo `nfc_data` contiene un **identificatore univoco**:
   ```
   basket-86-1703067234567
   ```
   
3. **Timestamp**: Il campo `nfc_last_programmed_at` registra quando il tag è stato programmato.

### Struttura Dati Tag (v2.0)

```json
{
  "basketId": 86,              // ID database cestello
  "physicalNumber": 6,         // Numero fisico stampato
  "currentCycleId": 123,       // ID ciclo attivo
  "cycleCode": "6-1-2312",     // Codice ciclo
  "flupsyId": 1,               // ID FLUPSY
  "row": "DX",                 // Fila
  "position": 3,               // Posizione
  "version": "2.0",            // Versione formato
  "timestamp": 1703067234567   // Timestamp programmazione
}
```

---

## API Endpoints per Integrazione RFID

### 1. Ricerca Cestello tramite Tag

**Endpoint:** `GET /api/baskets/find-by-nfc`

**Query Parameters:**
| Parametro | Tipo | Descrizione |
|-----------|------|-------------|
| `basketId` | number | ID database cestello (prioritario) |
| `physicalNumber` | number | Numero fisico cestello |
| `currentCycleId` | number | ID ciclo per disambiguazione |

**Esempio richiesta:**
```bash
GET /api/baskets/find-by-nfc?basketId=86
```

**Risposta successo:**
```json
{
  "success": true,
  "basket": {
    "id": 86,
    "physicalNumber": 6,
    "flupsyId": 1,
    "state": "active",
    "currentCycleId": 123,
    "nfcData": "basket-86-1703067234567",
    "row": "DX",
    "position": 3
  },
  "identificationMethod": "basketId",
  "version": "1.0-compatible"
}
```

### 2. Lista Tutti i Cestelli

**Endpoint:** `GET /api/baskets`

**Query Parameters:**
| Parametro | Tipo | Descrizione |
|-----------|------|-------------|
| `flupsyId` | number | Filtra per FLUPSY |
| `state` | string | Filtra per stato ('active', 'available') |
| `includeAll` | boolean | Include tutti senza paginazione |

### 3. Dettagli Cestello

**Endpoint:** `GET /api/baskets/details/:id`

**Risposta:**
```json
[{
  "id": 86,
  "physicalNumber": 6,
  "flupsyId": 1,
  "flupsyName": "FLUPSY 1",
  "currentCycleId": 123,
  "cycleCode": "6-1-2312",
  "state": "active",
  "row": "DX",
  "position": 3,
  "nfcData": "basket-86-1703067234567",
  "nfcLastProgrammedAt": "2024-12-20T10:30:00Z"
}]
```

### 4. Aggiornamento Tag RFID (Programmazione)

**Endpoint:** `PATCH /api/baskets/:id`

**Body:**
```json
{
  "nfcData": "basket-86-1703067234567",
  "nfcLastProgrammedAt": "2024-12-20T10:30:00.000Z"
}
```

**Importante:** Non modificare `state` o `currentCycleId` durante la programmazione tag. Lo stato dipende dal ciclo, non dal tag.

### 5. Rimozione Associazione Tag

**Endpoint:** `PATCH /api/baskets/:id`

**Body:**
```json
{
  "nfcData": null,
  "nfcLastProgrammedAt": null
}
```

### 6. Lista Cicli Attivi

**Endpoint:** `GET /api/cycles`

**Query Parameters:**
| Parametro | Tipo | Descrizione |
|-----------|------|-------------|
| `state` | string | 'active' o 'closed' |

### 7. Operazioni di un Ciclo

**Endpoint:** `GET /api/operations?cycleId=:id`

### 8. Creazione Nuova Operazione

**Endpoint:** `POST /api/operations`

**Body esempio (pesatura):**
```json
{
  "date": "2024-12-20",
  "type": "misura",
  "basketId": 86,
  "cycleId": 123,
  "sizeId": 5,
  "animalCount": 5000,
  "totalWeight": 2500,
  "animalsPerKg": 2000,
  "notes": "Operazione da app RFID",
  "source": "mobile_nfc"
}
```

**Nota importante:** Il campo `totalWeight` è SEMPRE in **GRAMMI**.

---

## Flusso Operativo Consigliato

### Lettura Tag e Visualizzazione Dati

```
1. Scansione tag RFID UHF
      ↓
2. Estrazione dati dal tag (basketId, physicalNumber, currentCycleId)
      ↓
3. Chiamata API: GET /api/baskets/find-by-nfc?basketId=X
      ↓
4. Se trovato → Mostra dettagli cestello
   Se non trovato → Mostra errore / richiedi programmazione
      ↓
5. Chiamata API: GET /api/operations?cycleId=Y (opzionale)
      ↓
6. Mostra storico operazioni del ciclo
```

### Programmazione Nuovo Tag

```
1. Selezione cestello da lista (GET /api/baskets?state=active)
      ↓
2. Verifica che cestello sia attivo con ciclo valido
      ↓
3. Generazione ID univoco: "basket-{basketId}-{timestamp}"
      ↓
4. Scrittura su tag RFID i dati JSON (vedi struttura sopra)
      ↓
5. Aggiornamento database: PATCH /api/baskets/:id
   Body: { nfcData: "...", nfcLastProgrammedAt: "..." }
      ↓
6. Conferma successo
```

### Registrazione Operazione (es. Pesatura)

```
1. Scansione tag → Identificazione cestello
      ↓
2. GET /api/baskets/details/:id → Ottieni currentCycleId
      ↓
3. Inserimento dati operazione (peso, numero animali)
      ↓
4. Calcolo automatico:
   - animalsPerKg = (animalCount * 1000) / totalWeight
   - Ricerca taglia corrispondente in sizes
      ↓
5. POST /api/operations con tutti i campi
      ↓
6. Conferma operazione registrata
```

---

## Convenzioni Importanti

### Unità di Misura

| Campo | Unità | Note |
|-------|-------|------|
| `total_weight` | Grammi | SEMPRE in grammi nel DB |
| `average_weight` | Milligrammi | 1.000.000 / animals_per_kg |
| `size_mm` | Millimetri | Dimensione taglia |

### Calcoli Automatici

```javascript
// Calcolo animali per kg
animalsPerKg = Math.round((animalCount * 1000) / totalWeightGrams);

// Calcolo peso medio (mg)
averageWeight = 1000000 / animalsPerKg;

// Determinazione taglia
// Cerca in sizes dove: min_animals_per_kg <= animalsPerKg <= max_animals_per_kg
```

### Identificazione Univoca Tag

Il formato consigliato per `nfcData` è:
```
basket-{basketId}-{timestampMs}
```

Esempio: `basket-86-1703067234567`

Questo garantisce unicità anche se lo stesso cestello viene riprogrammato.

---

## Gestione Errori

### Codici HTTP Comuni

| Codice | Significato |
|--------|-------------|
| 200 | Successo |
| 400 | Richiesta non valida (parametri mancanti) |
| 404 | Risorsa non trovata |
| 500 | Errore interno server |

### Risposta Errore Standard

```json
{
  "success": false,
  "error": "Descrizione errore",
  "code": "ERROR_CODE"
}
```

---

## Autenticazione (TODO)

Attualmente l'API non richiede autenticazione. Per implementazioni future:

- **API Key**: Header `X-API-Key: your-api-key`
- **Bearer Token**: Header `Authorization: Bearer your-token`

---

## Contatti e Supporto

Per domande tecniche o chiarimenti sull'integrazione, contattare il team di sviluppo Delta Futuro.

---

## Changelog

| Data | Versione | Modifiche |
|------|----------|-----------|
| 2024-12-23 | 1.0 | Prima versione documentazione |
