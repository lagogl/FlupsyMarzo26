# Documentazione Tecnica: Operazioni MISURA e PESO

## Endpoint API

**POST** `/api/direct-operations`

Content-Type: `application/json`

---

## 1. OPERAZIONE MISURA (`type: "misura"`)

### Scopo

Registra una misurazione (campionamento) del contenuto di un cestello. Determina la taglia, il numero di animali per kg e gestisce la mortalità.

### Campi richiesti nel body della richiesta

| Campo | Tipo | Obbligatorio | Descrizione |
|-------|------|:---:|-------------|
| `type` | string | SI | `"misura"` |
| `basketId` | integer | SI | ID del cestello |
| `cycleId` | integer | SI | ID del ciclo attivo del cestello |
| `date` | string | SI | Data in formato `YYYY-MM-DD` |
| `totalWeight` | real | SI | Peso totale del cestello in **grammi** (> 0) |
| `sampleWeight` | real | SI | Peso del campione prelevato in **grammi** (> 0) |
| `liveAnimals` | integer | SI | Numero di animali **vivi** contati nel campione |
| `deadCount` | integer | SI | Numero di animali **morti** contati nel campione (>= 0) |
| `lotId` | integer | NO | Viene **ignorato e sovrascritto** dal backend con il lotto del ciclo attivo |
| `animalCount` | integer | NO | Viene **ricalcolato** dal backend, non usare |
| `animalsPerKg` | integer | NO | Se non fornito, viene **calcolato automaticamente** |
| `sizeId` | integer | NO | Viene **calcolato automaticamente** dal backend |
| `notes` | string | NO | Note testuali |
| `source` | string | NO | Default: `"desktop_manager"`. Per app esterna usare `"mobile_nfc"` |

### Logica di elaborazione backend (ordine di esecuzione)

#### Passo 1 - Validazione date

- La data non può essere **anteriore** all'ultima operazione dello stesso cestello/ciclo
- La data non può essere **duplicata** (stessa data e stesso tipo per lo stesso cestello)

#### Passo 2 - Enforza il lotto del ciclo attivo

- Il backend **ignora sempre** il `lotId` inviato dal client
- Recupera il ciclo attivo del cestello e usa il `lotId` associato a quel ciclo
- Questo garantisce che tutte le misure di un ciclo siano associate allo stesso lotto

#### Passo 3 - Calcolo `animalsPerKg`

Se `animalsPerKg` non è fornito nel body, viene calcolato:

```
animalsPerKg = Math.round((liveAnimals / sampleWeight) × 1000)
```

- `liveAnimals` = numero animali vivi nel campione
- `sampleWeight` = peso campione in grammi
- `× 1000` perché sampleWeight è in grammi e vogliamo animali per **kg**

#### Passo 4 - Calcolo `averageWeight` e `sizeId`

`averageWeight` (peso medio per animale in **milligrammi**):

```
averageWeight = 1.000.000 / animalsPerKg
```

`sizeId` viene determinato automaticamente confrontando `animalsPerKg` con i range `minAnimalsPerKg` / `maxAnimalsPerKg` nella tabella `sizes`.

#### Passo 5 - Calcolo mortalità cumulativa e `animalCount` (FLUSSO UNIFICATO)

Questo flusso è **identico** sia con mortalità (deadCount > 0) che senza (deadCount = 0):

1. Recupera `originalCount` = `animalCount` dell'operazione di **prima-attivazione** del ciclo
   - Filtro: `cycleId` + `type = 'prima-attivazione'`, ordinato per `id ASC`

2. Recupera `lastCount` = `animalCount` dell'**ultima operazione** del ciclo
   - Ordinato per `id DESC`

3. Calcola la percentuale di mortalità:
   ```
   Se deadCount > 0:
     mortalityRate = deadCount / (liveAnimals + deadCount)
   Se deadCount = 0:
     mortalityRate = 0
   ```

4. Calcola il nuovo conteggio animali:
   ```
   calculatedCount = Math.round(originalCount - (originalCount × mortalityRate))
   ```

5. Applica vincolo di sicurezza (gli animali morti non resuscitano):
   ```
   finalAnimalCount = Math.min(calculatedCount, lastCount)
   ```

#### Passo 6 - Calcolo `animalCount` alternativo (se mancante)

Se `animalCount` non è stato impostato e sono disponibili `liveAnimals`, `sampleWeight` e `totalWeight`:

```
animalCount = Math.round((liveAnimals / sampleWeight) × totalWeight)
```

### Campi salvati nel database (tabella `operations`)

| Colonna DB | Valore salvato |
|------------|---------------|
| `type` | `"misura"` |
| `basket_id` | basketId fornito |
| `cycle_id` | cycleId fornito |
| `date` | data fornita |
| `lot_id` | **Lotto del ciclo attivo** (non quello del client) |
| `size_id` | **Calcolato automaticamente** da animalsPerKg |
| `animal_count` | **Calcolato**: `Math.min(originalCount - mortalità%, lastCount)` |
| `total_weight` | Peso totale in grammi (dal client) |
| `animals_per_kg` | Calcolato: `(liveAnimals / sampleWeight) × 1000` |
| `average_weight` | Calcolato: `1.000.000 / animalsPerKg` (milligrammi) |
| `dead_count` | Numero morti dal campione (dal client) |
| `sample_count` | `liveAnimals + deadCount` (dimensione totale campione) |
| `mortality_rate` | Percentuale: `(deadCount / totalSample) × 100` |
| `notes` | Note dal client |
| `source` | `"desktop_manager"` o `"mobile_nfc"` |

**NOTA IMPORTANTE**: i campi `liveAnimals` e `sampleWeight` sono **transitori** (usati solo per i calcoli) e **NON vengono salvati** nella tabella `operations`. Non sono colonne dello schema.

---

## 2. OPERAZIONE PESO (`type: "peso"`)

### Scopo

Registra solo una pesata rapida del cestello. **Non modifica** la taglia, il numero di animali per kg, né il conteggio animali. Copia tutto dall'ultima misura/prima-attivazione.

### Campi richiesti nel body della richiesta

| Campo | Tipo | Obbligatorio | Descrizione |
|-------|------|:---:|-------------|
| `type` | string | SI | `"peso"` |
| `basketId` | integer | SI | ID del cestello |
| `cycleId` | integer | SI | ID del ciclo attivo del cestello |
| `date` | string | SI | Data in formato `YYYY-MM-DD` |
| `totalWeight` | real | SI | Peso totale del cestello in **grammi** |

Tutti gli altri campi vengono **ignorati** perché il backend li copia dall'ultima operazione.

### Logica di elaborazione backend

#### Passo 1 - Recupero dati dall'ultima misura/prima-attivazione

- Cerca l'ultima operazione del ciclo con `type IN ('misura', 'prima-attivazione')` e `date <= data_peso`
- Se non trovata: restituisce errore 400 ("Nessuna operazione di misura o prima-attivazione trovata")
- **Copia** i seguenti campi dall'operazione trovata:
  - `sizeId`
  - `sgrId`
  - `lotId`
  - `animalCount`
  - `animalsPerKg`
  - `averageWeight`
- Imposta `deadCount = 0` e `mortalityRate = 0`

#### Passo 2 - Validazione date

Stesse regole della misura: no date duplicate, no date anteriori all'ultima operazione.

#### Passo 3 - Sovrascrittura `animalCount`

Dopo il passo 1, il backend fa un'ulteriore verifica: recupera l'`animalCount` dell'**ultima operazione** del cestello (qualsiasi tipo) e lo usa al posto di quello copiato dalla misura. Questo gestisce il caso in cui ci siano state altre operazioni tra l'ultima misura e il peso.

### Campi salvati nel database

| Colonna DB | Valore salvato |
|------------|---------------|
| `type` | `"peso"` |
| `basket_id` | basketId fornito |
| `cycle_id` | cycleId fornito |
| `date` | data fornita |
| `lot_id` | **Copiato** dall'ultima misura/prima-attivazione |
| `size_id` | **Copiato** dall'ultima misura/prima-attivazione |
| `animal_count` | **Copiato** dall'ultima operazione del cestello |
| `total_weight` | Peso totale in grammi (**unico valore dal client**) |
| `animals_per_kg` | **Copiato** dall'ultima misura/prima-attivazione |
| `average_weight` | **Copiato** dall'ultima misura/prima-attivazione |
| `dead_count` | 0 (sempre) |
| `mortality_rate` | 0 (sempre) |
| `source` | `"desktop_manager"` o `"mobile_nfc"` |

---

## 3. Schema tabella `operations` (riferimento completo)

```sql
CREATE TABLE operations (
  id             SERIAL PRIMARY KEY,
  date           DATE NOT NULL,
  type           TEXT NOT NULL,           -- enum: 'misura', 'peso', 'prima-attivazione', etc.
  basket_id      INTEGER NOT NULL,        -- FK -> baskets(id) ON DELETE CASCADE
  cycle_id       INTEGER NOT NULL,        -- FK -> cycles(id) ON DELETE CASCADE
  size_id        INTEGER NOT NULL,        -- FK -> sizes(id) ON DELETE RESTRICT
  sgr_id         INTEGER,                 -- FK -> sgr(id)
  lot_id         INTEGER,                 -- FK -> lots(id)
  animal_count   INTEGER,                 -- Numero animali vivi stimato
  total_weight   REAL,                    -- Peso totale in GRAMMI
  animals_per_kg INTEGER,                 -- Animali per kg (intero)
  average_weight REAL,                    -- Peso medio in MILLIGRAMMI (1.000.000 / animals_per_kg)
  dead_count     INTEGER,                 -- Morti nel campione
  sample_count   INTEGER,                 -- Dimensione totale campione (vivi + morti)
  mortality_rate REAL,                    -- Percentuale mortalità (es: 5.2 = 5.2%)
  notes          TEXT,
  metadata       TEXT,                    -- JSON string per metadati aggiuntivi
  source         TEXT NOT NULL DEFAULT 'desktop_manager'  -- 'desktop_manager' o 'mobile_nfc'
);
```

---

## 4. Schema tabella `sizes` (taglie)

```sql
CREATE TABLE sizes (
  id                 SERIAL PRIMARY KEY,
  code               TEXT NOT NULL UNIQUE,    -- Es: T0, T1, M1, M2, M3
  name               TEXT NOT NULL,
  size_mm            REAL,                    -- Dimensione in millimetri
  min_animals_per_kg INTEGER,                 -- Range minimo animali/kg
  max_animals_per_kg INTEGER,                 -- Range massimo animali/kg
  notes              TEXT,
  color              TEXT                     -- Colore HEX per UI
);
```

La taglia viene determinata trovando il record dove `animalsPerKg` cade nel range `[min_animals_per_kg, max_animals_per_kg]`.

---

## 5. Schema tabella `cycles` (cicli)

```sql
CREATE TABLE cycles (
  id         SERIAL PRIMARY KEY,
  basket_id  INTEGER NOT NULL,    -- FK -> baskets(id) ON DELETE CASCADE
  lot_id     INTEGER,             -- FK -> lots(id) - il lotto associato al ciclo
  start_date DATE NOT NULL,
  end_date   DATE,                -- NULL se il ciclo è ancora attivo
  state      TEXT NOT NULL DEFAULT 'active'  -- 'active' o 'closed'
);
```

---

## 6. Convenzioni unita di misura

| Grandezza | Unita nel DB | Note |
|-----------|-------------|------|
| `totalWeight` | **grammi** | Input e storage in grammi. Per display in kg: dividere per 1000 |
| `sampleWeight` | **grammi** | Peso campione in grammi (campo transitorio, non salvato) |
| `averageWeight` | **milligrammi** | Calcolato: `1.000.000 / animalsPerKg` |
| `animalsPerKg` | **animali/kg** | Numero intero |
| `mortalityRate` | **percentuale** | Es: 5.2 significa 5.2% |

---

## 7. Esempi pratici

### Esempio 1: Payload MISURA con mortalita

```json
{
  "type": "misura",
  "basketId": 42,
  "cycleId": 15,
  "date": "2026-02-09",
  "totalWeight": 5200,
  "sampleWeight": 120,
  "liveAnimals": 850,
  "deadCount": 12,
  "source": "mobile_nfc"
}
```

**Calcoli eseguiti dal backend:**

- `animalsPerKg` = round((850 / 120) x 1000) = **7083**
- `averageWeight` = 1.000.000 / 7083 = **141.2 mg**
- `sizeId` = determinato dalla tabella sizes dove 7083 cade nel range
- `totalSample` = 850 + 12 = **862**
- `mortalityRate` = (12 / 862) x 100 = **1.39%**
- `animalCount` = Math.min(round(originalCount - originalCount x 0.0139), lastCount)

### Esempio 2: Payload MISURA senza mortalita

```json
{
  "type": "misura",
  "basketId": 42,
  "cycleId": 15,
  "date": "2026-02-10",
  "totalWeight": 5400,
  "sampleWeight": 130,
  "liveAnimals": 900,
  "deadCount": 0,
  "source": "mobile_nfc"
}
```

**Calcoli eseguiti dal backend:**

- `animalsPerKg` = round((900 / 130) x 1000) = **6923**
- `averageWeight` = 1.000.000 / 6923 = **144.4 mg**
- `sizeId` = determinato dalla tabella sizes
- `totalSample` = 900 + 0 = **900**
- `mortalityRate` = **0%** (deadCount = 0)
- `animalCount` = Math.min(originalCount, lastCount) = **lastCount** (invariato)

### Esempio 3: Payload PESO

```json
{
  "type": "peso",
  "basketId": 42,
  "cycleId": 15,
  "date": "2026-02-09",
  "totalWeight": 5400
}
```

Il backend copiera `sizeId`, `animalsPerKg`, `averageWeight`, `lotId`, `animalCount` dall'ultima misura/prima-attivazione. L'unico dato "nuovo" e il peso totale.

---

## 8. Codici di errore

| Codice | Situazione |
|--------|-----------|
| 400 | Campi obbligatori mancanti o invalidi |
| 400 | Data duplicata o anteriore all'ultima operazione |
| 400 | Nessuna prima-attivazione trovata (per peso) |
| 400 | cycleId mancante per operazione peso |
| 404 | Cestello non trovato |
| 500 | Errore interno del server |

---

## 9. Notifica in tempo reale

Dopo la creazione di un'operazione, il backend:

1. **Invalida tutte le cache** del server
2. **Invia una notifica WebSocket** con evento `operation_created`

Per app esterne che creano operazioni **direttamente nel database** (senza passare dall'API), e necessario chiamare:

**POST** `/api/operations/notify-new`

per forzare l'invalidazione cache e la notifica WebSocket ai client connessi.

---

## 10. Diagramma di flusso MISURA

```
Client invia POST /api/direct-operations
  |
  v
[1] Validazione date (no duplicati, no date precedenti)
  |
  v
[2] Enforza lotId dal ciclo attivo
  |
  v
[3] Calcolo animalsPerKg = (liveAnimals / sampleWeight) x 1000
  |
  v
[4] Calcolo averageWeight = 1.000.000 / animalsPerKg
  |  Calcolo sizeId dalla tabella sizes
  |
  v
[5] Recupera originalCount (prima-attivazione del ciclo)
  |  Recupera lastCount (ultima operazione del ciclo)
  |
  v
[6] mortalityRate = deadCount / (liveAnimals + deadCount)
  |  Se deadCount = 0: mortalityRate = 0
  |
  v
[7] calculatedCount = originalCount - (originalCount x mortalityRate)
  |  finalAnimalCount = Math.min(calculatedCount, lastCount)
  |
  v
[8] INSERT nella tabella operations
  |
  v
[9] Invalida cache + Notifica WebSocket
  |
  v
Risposta 200 OK
```

## 11. Diagramma di flusso PESO

```
Client invia POST /api/direct-operations
  |
  v
[1] Cerca ultima operazione tipo 'misura' o 'prima-attivazione' del ciclo
  |  Se non trovata: errore 400
  |
  v
[2] Copia: sizeId, sgrId, lotId, animalCount, animalsPerKg, averageWeight
  |  Imposta: deadCount=0, mortalityRate=0
  |
  v
[3] Validazione date (no duplicati, no date precedenti)
  |
  v
[4] Sovrascrive animalCount con quello dell'ultima operazione del cestello
  |
  v
[5] INSERT nella tabella operations (con totalWeight dal client)
  |
  v
[6] Invalida cache + Notifica WebSocket
  |
  v
Risposta 200 OK
```
