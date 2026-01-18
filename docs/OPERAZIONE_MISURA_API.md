# 📋 OPERAZIONE "MISURA" - Documentazione Tecnica API

## 1. DESCRIZIONE

L'operazione "misura" registra un campionamento/misurazione biometrica degli animali in una cesta attiva. Serve a tracciare la crescita e il numero di animali nel tempo.

---

## 2. ENDPOINT API

```
POST /api/operations/bypass-lock
```

**Headers richiesti:**
```
Content-Type: application/json
```

---

## 3. PAYLOAD RICHIESTA

```json
{
  "type": "misura",
  "basketId": 123,
  "date": "2026-01-18",
  "animalCount": 50000,
  "totalWeight": 2500,
  "notes": "Campionamento settimanale"
}
```

| Campo | Tipo | Obbligatorio | Descrizione |
|-------|------|--------------|-------------|
| `type` | string | ✅ | Deve essere esattamente `"misura"` |
| `basketId` | integer | ✅ | ID della cesta nel database |
| `date` | string | ✅ | Data operazione formato `YYYY-MM-DD` |
| `animalCount` | integer | ❌ | Numero animali campionati |
| `totalWeight` | real | ❌ | Peso totale in **GRAMMI** |
| `notes` | string | ❌ | Note testuali libere |

---

## 4. VALIDAZIONI BACKEND (in ordine)

1. **`basketId` e `date` obbligatori**
   - Errore: `400 - "basketId e date sono obbligatori per operazioni misura"`

2. **Cesta deve esistere**
   - Query: `SELECT * FROM baskets WHERE id = :basketId`
   - Errore: `404 - "Cestello non trovato"`

3. **Cesta deve essere ATTIVA**
   - Campo: `baskets.state` deve essere `"active"`
   - Errore: `400 - "Il cestello deve essere attivo per operazioni di misura"`

4. **Cesta deve avere un ciclo attivo**
   - Campo: `baskets.currentCycleId` non deve essere NULL
   - Errore: `400 - "Cestello non ha un ciclo attivo"`

5. **Il ciclo deve esistere**
   - Query: `SELECT * FROM cycles WHERE id = :currentCycleId`
   - Errore: `404 - "Ciclo attivo non trovato"`

---

## 5. LOGICA DI INSERIMENTO

```sql
INSERT INTO operations (
  basket_id,
  cycle_id,
  lot_id,
  type,
  date,
  animal_count,
  total_weight,
  notes,
  metadata
) VALUES (
  :basketId,
  :cycleId,           -- Recuperato da baskets.current_cycle_id
  :lotId,             -- Recuperato da cycles.lot_id (può essere NULL)
  'misura',
  :formattedDate,     -- Formato 'YYYY-MM-DD'
  :animalCount,       -- NULL se non fornito
  :totalWeight,       -- NULL se non fornito (in GRAMMI)
  :notes,             -- NULL se non fornito
  :metadata           -- JSON se lotto misto, altrimenti NULL
);
```

**Nota importante:** Il `cycleId` viene **ricavato automaticamente** dalla cesta (`baskets.currentCycleId`), NON viene passato nella richiesta.

---

## 6. GESTIONE LOTTI MISTI (AUTOMATICA)

Se la cesta contiene animali da più lotti (composizione mista), il backend automaticamente:

1. Recupera la composizione lotti dalla tabella `basket_lot_composition`
2. Arricchisce le `notes` con: `"LOTTO MISTO: Fornitore1 (60.0% - 30000 animali) + Fornitore2 (40.0% - 20000 animali)"`
3. Aggiunge `metadata` JSON:

```json
{
  "isMixed": true,
  "dominantLot": 5,
  "lotCount": 2,
  "composition": [
    { "lotId": 5, "percentage": 60.0, "animalCount": 30000 },
    { "lotId": 8, "percentage": 40.0, "animalCount": 20000 }
  ]
}
```

---

## 7. RISPOSTA SUCCESSO

```json
{
  "success": true,
  "message": "Operazione misura creata con successo",
  "cycleId": 456
}
```

**Codice HTTP:** `200 OK`

---

## 8. RISPOSTE ERRORE

| Codice | Messaggio | Causa |
|--------|-----------|-------|
| 400 | `basketId e date sono obbligatori per operazioni misura` | Campi mancanti |
| 400 | `Il cestello deve essere attivo per operazioni di misura` | Cesta non attiva |
| 400 | `Cestello non ha un ciclo attivo` | currentCycleId è NULL |
| 404 | `Cestello non trovato` | basketId non esiste |
| 404 | `Ciclo attivo non trovato` | Ciclo corrotto/eliminato |

---

## 9. SCHEMA DATABASE (tabella `operations`)

| Colonna | Tipo | Note |
|---------|------|------|
| `id` | serial | PK auto-generato |
| `date` | date | Formato ISO YYYY-MM-DD |
| `type` | text | Enum (vedi sotto) |
| `basket_id` | integer | FK → baskets.id (CASCADE DELETE) |
| `cycle_id` | integer | FK → cycles.id (CASCADE DELETE) |
| `size_id` | integer | FK → sizes.id (opzionale per misura) |
| `lot_id` | integer | FK → lots.id (ereditato dal ciclo) |
| `animal_count` | integer | Numero animali |
| `total_weight` | real | Peso in GRAMMI |
| `animals_per_kg` | integer | Calcolato: `animalCount / (totalWeight / 1000)` |
| `average_weight` | real | Calcolato: `1,000,000 / animalsPerKg` (in mg) |
| `dead_count` | integer | Animali morti (opzionale) |
| `mortality_rate` | real | Tasso mortalità % |
| `notes` | text | Note libere |
| `metadata` | text | JSON stringificato per lotti misti |
| `source` | text | Default: `"desktop_manager"` |

### Tipi di operazione (enum `type`)

```
prima-attivazione, pulizia, vagliatura, trattamento, misura, vendita, 
selezione-vendita, cessazione, peso, selezione-origine, dismissione, 
chiusura-ciclo-vagliatura, chiusura-ciclo
```

---

## 10. SCHEMA DATABASE CORRELATE

### Tabella `baskets`

| Colonna | Tipo | Note |
|---------|------|------|
| `id` | serial | PK |
| `physical_number` | integer | Numero fisico cesta |
| `flupsy_id` | integer | FK → flupsys.id |
| `cycle_code` | text | Codice ciclo (formato: numeroCesta-numeroFlupsy-YYMM) |
| `state` | text | `"available"` o `"active"` |
| `current_cycle_id` | integer | FK → cycles.id (NULL se disponibile) |
| `row` | text | `"DX"` o `"SX"` |
| `position` | integer | Posizione nella fila |

### Tabella `cycles`

| Colonna | Tipo | Note |
|---------|------|------|
| `id` | serial | PK |
| `basket_id` | integer | FK → baskets.id |
| `lot_id` | integer | FK → lots.id (può essere NULL) |
| `start_date` | date | Data inizio ciclo |
| `end_date` | date | NULL se attivo |
| `state` | text | `"active"` o `"closed"` |

### Tabella `basket_lot_composition` (per lotti misti)

| Colonna | Tipo | Note |
|---------|------|------|
| `id` | serial | PK |
| `basket_id` | integer | FK → baskets.id |
| `cycle_id` | integer | FK → cycles.id |
| `lot_id` | integer | FK → lots.id |
| `animal_count` | integer | Animali da questo lotto |
| `percentage` | real | Percentuale composizione |

---

## 11. CONVENZIONE PESI

⚠️ **IMPORTANTE:**

- **Database**: tutti i pesi sono memorizzati in **GRAMMI**
- **Input API**: valori in **GRAMMI**
- **Display UI**: convertire a kg dividendo per 1000

Esempio:
- Input: `totalWeight: 2500` (grammi)
- Database: `total_weight = 2500`
- Display: `2.5 kg`

---

## 12. FLUSSO COMPLETO

```
1. Client invia POST con type="misura", basketId, date, [animalCount], [totalWeight], [notes]
         ↓
2. Backend valida basketId e date obbligatori
         ↓
3. Backend recupera cesta da DB e verifica:
   - Esiste?
   - state = "active"?
   - currentCycleId non NULL?
         ↓
4. Backend recupera ciclo attivo dalla cesta
         ↓
5. Backend verifica composizione lotti (basket_lot_composition)
   - Se lotti misti: arricchisce notes e metadata
         ↓
6. Backend inserisce record in operations:
   - basket_id = basketId
   - cycle_id = basket.currentCycleId
   - lot_id = cycle.lotId
   - type = "misura"
   - date = formattedDate
   - animal_count, total_weight, notes, metadata
         ↓
7. Backend risponde con success=true e cycleId
```

---

## 13. ESEMPIO COMPLETO CURL

```bash
curl -X POST "https://your-domain.replit.app/api/operations/bypass-lock" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "misura",
    "basketId": 42,
    "date": "2026-01-18",
    "animalCount": 45000,
    "totalWeight": 3200,
    "notes": "Campionamento mensile - condizioni ottimali"
  }'
```

**Risposta attesa:**
```json
{
  "success": true,
  "message": "Operazione misura creata con successo",
  "cycleId": 123
}
```

---

## 14. NOTE PER L'IMPLEMENTAZIONE

1. **Non passare `cycleId`** - viene determinato automaticamente dal backend
2. **Non passare `lotId`** - viene ereditato dal ciclo attivo
3. **Pesi sempre in grammi** - non in kg
4. **Date in formato ISO** - `YYYY-MM-DD`
5. **La cesta deve essere già attiva** - non si può fare misura su cesta disponibile
6. **Gestione lotti misti automatica** - il backend arricchisce automaticamente notes/metadata

---

*Documento generato il 18 Gennaio 2026*
*FLUPSY Management System v2.0*
