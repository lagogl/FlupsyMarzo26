# 📋 Integrazione App Esterna - Sistema Gestione Attività (Tasks)

**Versione:** 2.0  
**Data:** 10 Novembre 2025  
**Target:** Sviluppatori App Mobile FLUPSY

---

## 📖 Indice

1. [Panoramica](#panoramica)
2. [Architettura Database](#architettura-database)
3. [Connessione Database](#connessione-database)
4. [Schema Tabelle](#schema-tabelle)
5. [Flussi di Lavoro](#flussi-di-lavoro)
6. [Query SQL Esempio](#query-sql-esempio)
7. [Casi d'Uso Comuni](#casi-duso-comuni)
8. [Validazioni e Regole](#validazioni-e-regole)
9. [Performance e Indici](#performance-e-indici)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Panoramica

Il sistema di gestione attività di Delta Futuro permette all'app mobile FLUPSY di:

- ✅ **Leggere** le attività assegnate agli operatori
- ✅ **Aggiornare** lo stato delle attività (presa in carico, in progress, completate)
- ✅ **Tracciare** chi ha iniziato e chi ha completato ogni attività
- ✅ **Registrare** note e risultati delle operazioni
- ✅ **Visualizzare** dettagli ceste, FLUPSY e informazioni correlate

### Database Condiviso

L'app esterna accede **direttamente** al database PostgreSQL di Delta Futuro tramite:

```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

⚠️ **IMPORTANTE**: La connessione richiede SSL (`sslmode=require`) per sicurezza.

---

## 🗄️ Architettura Database

### Tabelle Coinvolte

```
selection_tasks (Attività principale)
    ↓
selection_task_assignments (Assegnazioni operatori)
    ↓
selection_task_baskets (Ceste coinvolte)
    ↓
task_operators (Anagrafica operatori)
    ↓
baskets (Dettagli ceste)
    ↓
flupsys (Dettagli FLUPSY)
```

---

## 🔌 Connessione Database

### Configurazione PostgreSQL (Node.js)

```javascript
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true
  },
  max: 20, // Numero massimo di connessioni
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connessione
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Errore connessione database:', err);
  } else {
    console.log('✅ Database connesso:', res.rows[0].now);
  }
});
```

### Configurazione React Native (con pg-native)

```javascript
import { Pool } from 'react-native-postgres';

const pool = new Pool({
  host: 'your-host.neon.tech',
  port: 5432,
  database: 'your-database',
  user: 'your-user',
  password: 'your-password',
  ssl: true,
  max: 10,
});
```

---

## 📊 Schema Tabelle

### 1️⃣ `selection_tasks` - Attività Principale

```sql
CREATE TABLE selection_tasks (
  id SERIAL PRIMARY KEY,
  selection_id INTEGER,              -- Riferimento opzionale a selezione (null per task manuali)
  task_type VARCHAR(50) NOT NULL,    -- Tipo: 'pesatura', 'vagliatura', 'pulizia', 'selezione', 'trasferimento'
  description TEXT,                  -- Descrizione dell'attività
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',  -- 'low', 'medium', 'high', 'urgent'
  status VARCHAR(20) NOT NULL DEFAULT 'pending',   -- 'pending', 'assigned', 'in_progress', 'completed', 'cancelled'
  due_date DATE,                     -- Scadenza attività
  cadence VARCHAR(20),               -- Ricorrenza: 'daily', 'weekly', 'monthly', null
  cadence_interval INTEGER DEFAULT 1,  -- Intervallo (es: ogni 2 settimane = 2)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  completed_at TIMESTAMP,            -- Data completamento task generale
  notes TEXT                         -- Note aggiuntive
);
```

**Campi Chiave:**
- `task_type`: Tipo di attività da svolgere
- `priority`: Urgenza dell'attività
- `status`: Stato globale del task
- `due_date`: Scadenza (usare per filtrare task odierni)

---

### 2️⃣ `selection_task_assignments` - Assegnazioni Operatori

```sql
CREATE TABLE selection_task_assignments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,          -- Riferimento a selection_tasks.id
  operator_id INTEGER NOT NULL,      -- ID operatore assegnato (da task_operators)
  
  -- Stato assegnazione
  status VARCHAR(20) NOT NULL DEFAULT 'assigned',  -- 'assigned', 'accepted', 'in_progress', 'completed'
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 🆕 TRACCIAMENTO PRESA IN CARICO
  started_by INTEGER,                -- ID operatore che ha iniziato (può essere diverso da operator_id)
  started_at TIMESTAMP,              -- Quando è stata presa in carico
  
  -- 🆕 TRACCIAMENTO COMPLETAMENTO
  completed_by INTEGER,              -- ID operatore che ha completato
  completed_at TIMESTAMP,            -- Quando è stata completata
  
  -- Informazioni aggiuntive
  completion_notes TEXT,             -- Note dell'operatore al completamento
  external_app_synced_at TIMESTAMP,  -- Timestamp sincronizzazione
  
  FOREIGN KEY (task_id) REFERENCES selection_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (operator_id) REFERENCES task_operators(id) ON DELETE CASCADE,
  FOREIGN KEY (started_by) REFERENCES task_operators(id) ON DELETE SET NULL,
  FOREIGN KEY (completed_by) REFERENCES task_operators(id) ON DELETE SET NULL
);

-- Indici per performance
CREATE INDEX idx_assignments_operator ON selection_task_assignments(operator_id);
CREATE INDEX idx_assignments_status ON selection_task_assignments(status);
CREATE INDEX idx_assignments_started_by ON selection_task_assignments(started_by);
CREATE INDEX idx_assignments_completed_by ON selection_task_assignments(completed_by);
CREATE INDEX idx_assignments_operator_status ON selection_task_assignments(operator_id, status);
```

**Campi Critici:**
- `operator_id`: Chi è stato **assegnato**
- `started_by`: Chi ha **realmente iniziato**
- `completed_by`: Chi ha **completato**
- `status`: Stato specifico dell'assegnazione

---

### 3️⃣ `selection_task_baskets` - Ceste Coinvolte

```sql
CREATE TABLE selection_task_baskets (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,          -- Riferimento a selection_tasks.id
  basket_id INTEGER NOT NULL,        -- Riferimento a baskets.id
  role VARCHAR(20),                  -- 'source' o 'destination' (SOLO per vagliatura con mappa)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (task_id) REFERENCES selection_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (basket_id) REFERENCES baskets.id) ON DELETE CASCADE
);
```

**Note:**
- Il campo `role` è significativo **SOLO** per operazioni di "vagliatura con mappa"
- Per altri tipi di task, il `role` può essere ignorato o essere NULL

---

### 4️⃣ `task_operators` - Anagrafica Operatori

```sql
CREATE TABLE task_operators (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  external_app_user_id INTEGER,      -- Riferimento all'utente nell'app esterna
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 5️⃣ `baskets` - Dettagli Ceste

```sql
CREATE TABLE baskets (
  id SERIAL PRIMARY KEY,
  physical_number INTEGER NOT NULL,  -- Numero fisico della cesta
  flupsy_id INTEGER NOT NULL,        -- Riferimento al FLUPSY
  status VARCHAR(20),                -- Stato cesta
  -- ... altri campi ...
  
  FOREIGN KEY (flupsy_id) REFERENCES flupsys(id)
);
```

---

### 6️⃣ `flupsys` - Dettagli FLUPSY

```sql
CREATE TABLE flupsys (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,        -- Nome FLUPSY (es: "FLUPSY 2")
  -- ... altri campi ...
);
```

---

## 🔄 Flussi di Lavoro

### Flusso 1: Operatore Visualizza Attività Assegnate

```
1. App esterna richiede task per operatore X
2. Query: SELECT tasks WHERE operator_id = X AND status != 'completed'
3. Mostra lista attività con dettagli ceste e FLUPSY
```

### Flusso 2: Operatore Prende in Carico Attività

```
1. Operatore tap su "Inizia Attività"
2. App esterna UPDATE:
   - status = 'in_progress'
   - started_by = operator_id
   - started_at = NOW()
   - external_app_synced_at = NOW()
3. Delta Futuro riceve aggiornamento in tempo reale
```

### Flusso 3: Operatore Completa Attività

```
1. Operatore tap su "Completa"
2. App esterna UPDATE:
   - status = 'completed'
   - completed_by = operator_id
   - completed_at = NOW()
   - completion_notes = "Note operatore"
   - external_app_synced_at = NOW()
3. Attività sparisce dal ticker di Delta Futuro
```

---

## 💻 Query SQL Esempio

### 1. Recuperare Attività Assegnate a un Operatore (Oggi)

```sql
SELECT 
  st.id AS task_id,
  st.task_type,
  st.description,
  st.priority,
  st.due_date,
  st.notes AS task_notes,
  sta.id AS assignment_id,
  sta.status AS assignment_status,
  sta.assigned_at,
  sta.started_at,
  sta.completed_at,
  -- Dettagli operatore
  op.first_name,
  op.last_name,
  op.email,
  -- Ceste coinvolte (come JSON array)
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'basket_id', b.id,
        'physical_number', b.physical_number,
        'flupsy_id', f.id,
        'flupsy_name', f.name
      )
    ) FILTER (WHERE b.id IS NOT NULL),
    '[]'
  ) AS baskets
FROM selection_tasks st
INNER JOIN selection_task_assignments sta ON sta.task_id = st.id
INNER JOIN task_operators op ON op.id = sta.operator_id
LEFT JOIN selection_task_baskets stb ON stb.task_id = st.id
LEFT JOIN baskets b ON b.id = stb.basket_id
LEFT JOIN flupsys f ON f.id = b.flupsy_id
WHERE 
  sta.operator_id = $1                -- ID operatore
  AND sta.status != 'completed'       -- Solo non completate
  AND st.due_date = CURRENT_DATE      -- Solo oggi
GROUP BY 
  st.id, sta.id, op.id
ORDER BY 
  CASE st.priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  st.due_date ASC NULLS LAST;
```

**Parametri:**
- `$1`: ID operatore (INTEGER)

**Ritorna:**
```json
[
  {
    "task_id": 42,
    "task_type": "pesatura",
    "description": "Pesatura settimanale",
    "priority": "high",
    "due_date": "2025-11-10",
    "task_notes": "Controllare temperatura acqua",
    "assignment_id": 123,
    "assignment_status": "assigned",
    "assigned_at": "2025-11-10T08:00:00Z",
    "started_at": null,
    "completed_at": null,
    "first_name": "Mario",
    "last_name": "Rossi",
    "email": "mario.rossi@example.com",
    "baskets": [
      {
        "basket_id": 15,
        "physical_number": 6,
        "flupsy_id": 2,
        "flupsy_name": "FLUPSY 2"
      }
    ]
  }
]
```

---

### 2. Prendere in Carico un'Attività

```sql
UPDATE selection_task_assignments
SET 
  status = 'in_progress',
  started_by = $1,                    -- ID operatore che inizia
  started_at = NOW(),
  external_app_synced_at = NOW()
WHERE 
  id = $2                             -- ID assignment
  AND status IN ('assigned', 'accepted')  -- Solo se non già in progress
RETURNING 
  id, 
  task_id, 
  status, 
  started_by, 
  started_at;
```

**Parametri:**
- `$1`: ID operatore che inizia (INTEGER)
- `$2`: ID assignment (INTEGER)

---

### 3. Completare un'Attività

```sql
UPDATE selection_task_assignments
SET 
  status = 'completed',
  completed_by = $1,                  -- ID operatore che completa
  completed_at = NOW(),
  completion_notes = $2,              -- Note opzionali
  external_app_synced_at = NOW()
WHERE 
  id = $3                             -- ID assignment
  AND status = 'in_progress'          -- Solo se è in progress
RETURNING 
  id, 
  task_id, 
  status, 
  completed_by, 
  completed_at, 
  completion_notes;
```

**Parametri:**
- `$1`: ID operatore che completa (INTEGER)
- `$2`: Note di completamento (TEXT, può essere NULL)
- `$3`: ID assignment (INTEGER)

---

### 4. Statistiche Operatore (Performance)

```sql
-- Tempo medio di esecuzione per operatore
SELECT 
  op.first_name || ' ' || op.last_name AS operatore,
  COUNT(*) AS task_completati,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60)::INTEGER AS minuti_medi,
  MIN(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60)::INTEGER AS minuti_min,
  MAX(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60)::INTEGER AS minuti_max
FROM selection_task_assignments sta
JOIN task_operators op ON op.id = sta.completed_by
WHERE 
  sta.status = 'completed'
  AND sta.started_at IS NOT NULL
  AND sta.completed_at IS NOT NULL
  AND DATE(sta.completed_at) >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY op.id, op.first_name, op.last_name
ORDER BY minuti_medi;
```

---

## 🎯 Casi d'Uso Comuni

### Caso 1: Lista Attività del Giorno per Operatore

```javascript
const operatorId = 5;
const today = new Date().toISOString().split('T')[0];

const query = `
  SELECT 
    st.id,
    st.task_type,
    st.description,
    st.priority,
    sta.status,
    json_agg(
      jsonb_build_object(
        'physical_number', b.physical_number,
        'flupsy_name', f.name
      )
    ) AS baskets
  FROM selection_tasks st
  JOIN selection_task_assignments sta ON sta.task_id = st.id
  LEFT JOIN selection_task_baskets stb ON stb.task_id = st.id
  LEFT JOIN baskets b ON b.id = stb.basket_id
  LEFT JOIN flupsys f ON f.id = b.flupsy_id
  WHERE 
    sta.operator_id = $1
    AND sta.status != 'completed'
    AND st.due_date = $2
  GROUP BY st.id, sta.id
  ORDER BY 
    CASE st.priority
      WHEN 'urgent' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END;
`;

const result = await pool.query(query, [operatorId, today]);
console.log('Task oggi:', result.rows);
```

---

### Caso 2: Iniziare un'Attività

```javascript
const operatorId = 5;
const assignmentId = 123;

const query = `
  UPDATE selection_task_assignments
  SET 
    status = 'in_progress',
    started_by = $1,
    started_at = NOW(),
    external_app_synced_at = NOW()
  WHERE 
    id = $2
    AND status IN ('assigned', 'accepted')
  RETURNING *;
`;

const result = await pool.query(query, [operatorId, assignmentId]);
console.log('Attività presa in carico:', result.rows[0]);
```

---

### Caso 3: Completare un'Attività con Note

```javascript
const operatorId = 5;
const assignmentId = 123;
const notes = 'Pesatura completata. Peso totale: 15.2kg. Temperatura acqua: 18°C';

const query = `
  UPDATE selection_task_assignments
  SET 
    status = 'completed',
    completed_by = $1,
    completed_at = NOW(),
    completion_notes = $2,
    external_app_synced_at = NOW()
  WHERE 
    id = $3
    AND status = 'in_progress'
  RETURNING *;
`;

const result = await pool.query(query, [operatorId, notes, assignmentId]);
console.log('Attività completata:', result.rows[0]);
```

---

## ✅ Validazioni e Regole

### 1. Transizioni di Stato Valide

```
assigned → accepted → in_progress → completed
   ↓          ↓           ↓
cancelled  cancelled  cancelled
```

**Regole:**
- ❌ NON si può passare da 'completed' a 'in_progress'
- ❌ NON si può completare senza aver iniziato
- ✅ Si può cancellare in qualsiasi momento

### 2. Validazione Campi

```javascript
function validateTaskUpdate(status, startedBy, completedBy, startedAt, completedAt) {
  if (status === 'in_progress') {
    if (!startedBy || !startedAt) {
      throw new Error('started_by e started_at obbligatori per in_progress');
    }
  }
  
  if (status === 'completed') {
    if (!completedBy || !completedAt) {
      throw new Error('completed_by e completed_at obbligatori per completed');
    }
    if (!startedBy || !startedAt) {
      throw new Error('Task deve essere iniziato prima di essere completato');
    }
  }
  
  return true;
}
```

---

## ⚡ Performance e Indici

### Indici Esistenti

```sql
CREATE INDEX idx_assignments_operator ON selection_task_assignments(operator_id);
CREATE INDEX idx_assignments_status ON selection_task_assignments(status);
CREATE INDEX idx_assignments_started_by ON selection_task_assignments(started_by);
CREATE INDEX idx_assignments_completed_by ON selection_task_assignments(completed_by);
CREATE INDEX idx_assignments_operator_status ON selection_task_assignments(operator_id, status);
CREATE INDEX idx_assignments_started_at ON selection_task_assignments(started_at);
CREATE INDEX idx_assignments_completed_at ON selection_task_assignments(completed_at);
```

### Best Practices

1. **Usare Prepared Statements**
   ```javascript
   // ✅ BUONO
   pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
   
   // ❌ CATTIVO - SQL injection risk
   pool.query(`SELECT * FROM tasks WHERE id = ${taskId}`);
   ```

2. **Connection Pooling**
   ```javascript
   // ✅ BUONO
   const pool = new Pool({ max: 20 });
   
   // ❌ CATTIVO
   const client = new Client();
   await client.connect();
   ```

---

## 🔧 Troubleshooting

### Problema: Connessione Rifiutata

```
Error: connect ECONNREFUSED
```

**Soluzione:**
- Verifica `DATABASE_URL`
- Controlla firewall e whitelist IP
- Assicurati di usare `ssl: true`

---

### Problema: Query Lente

```sql
-- Analizza query
EXPLAIN ANALYZE 
SELECT * FROM selection_tasks 
WHERE due_date = CURRENT_DATE;
```

---

## 📝 Changelog

### Versione 2.0 (10 Nov 2025)
- ✅ Aggiunti campi `started_by` e `completed_by`
- ✅ Indici per performance analytics
- ✅ Query esempio complete
- ✅ Accesso diretto database (non API)

---

**Fine Documentazione** 🎉
