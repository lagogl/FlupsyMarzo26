# 📋 Guida Integrazione Sistema Attività - App Esterna

## Panoramica

Il modulo **Sistema Gestione Attività** permette di assegnare compiti specifici agli operatori per le selezioni avanzate di ceste. L'app Delta Futuro crea e assegna le attività, mentre l'app esterna permette agli operatori di visualizzarle, accettarle e completarle.

---

## 🗄️ Struttura Database

### Tabella `operators` (Operatori)

```sql
CREATE TABLE operators (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  external_app_user_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP,
  notes TEXT
);
```

**Campi chiave:**
- `id`: ID univoco operatore
- `external_app_user_id`: ID utente nell'app esterna (per sincronizzazione)
- `active`: Se `false`, l'operatore è disattivato

---

### Tabella `selection_tasks` (Attività)

```sql
CREATE TABLE selection_tasks (
  id SERIAL PRIMARY KEY,
  selection_id INTEGER NOT NULL,
  task_type TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP,
  completed_at TIMESTAMP,
  notes TEXT
);
```

**Stati attività (`status`):**
- `pending`: Attività creata ma non assegnata
- `assigned`: Assegnata a operatori
- `in_progress`: In esecuzione
- `completed`: Completata
- `cancelled`: Annullata

**Priorità (`priority`):**
- `low`: Bassa
- `medium`: Media (default)
- `high`: Alta
- `urgent`: Urgente

---

### Tabella `selection_task_baskets` (Ceste dell'Attività)

```sql
CREATE TABLE selection_task_baskets (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  basket_id INTEGER NOT NULL,
  role TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Ruoli cesta (`role`):**
- `source`: Cesta di origine
- `destination`: Cesta di destinazione

---

### Tabella `selection_task_assignments` (Assegnazioni Operatori)

```sql
CREATE TABLE selection_task_assignments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  operator_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'assigned',
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  completion_notes TEXT,
  external_app_synced_at TIMESTAMP
);
```

**Stati assegnazione (`status`):**
- `assigned`: Assegnata
- `accepted`: Accettata dall'operatore
- `in_progress`: In esecuzione
- `completed`: Completata

---

## 🔌 API Endpoints per App Esterna

### Base URL
```
https://your-domain.replit.app/api
```

---

### 1. **Ottenere Attività per Operatore**

```http
GET /api/operators/:operatorId/tasks?status=assigned,in_progress
```

**Parametri Query:**
- `status`: (opzionale) Filtra per stati separati da virgola

**Esempio Response:**
```json
[
  {
    "taskId": 12,
    "taskType": "pulizia",
    "description": "Pulizia ceste dopo vagliatura",
    "priority": "high",
    "taskStatus": "assigned",
    "dueDate": "2025-11-10",
    "selectionId": 45,
    "selectionNumber": 3,
    "selectionDate": "2025-11-08",
    "assignmentId": 89,
    "assignmentStatus": "assigned",
    "assignedAt": "2025-11-08T10:00:00Z",
    "startedAt": null,
    "completedAt": null
  }
]
```

---

### 2. **Ottenere Ceste di un'Attività**

```http
GET /api/tasks/:taskId/baskets
```

**Esempio Response:**
```json
[
  {
    "id": 45,
    "basketId": 78,
    "role": "source",
    "physicalNumber": 15,
    "flupsyId": 2,
    "animalCount": 15000,
    "totalWeight": 8500,
    "animalsPerKg": 1765,
    "sizeId": 5,
    "sizeName": "TP-1500"
  }
]
```

**Note:**
- `totalWeight`: Espresso in **GRAMMI**
- Convertire in kg dividendo per 1000

---

### 3. **Aggiornare Stato Assegnazione**

```http
PATCH /api/tasks/:taskId/assignments/:assignmentId
```

**Request Body:**
```json
{
  "status": "in_progress"
}
```

**Possibili transizioni di stato:**
1. `assigned` → `accepted`
2. `accepted` → `in_progress`
3. `in_progress` → `completed`

---

### 4. **Completare un'Attività**

```http
PATCH /api/tasks/:taskId/assignments/:assignmentId
```

**Request Body:**
```json
{
  "status": "completed",
  "completionNotes": "Operazione completata con successo"
}
```

**Effetti:**
- Imposta `completedAt` timestamp
- Salva note di completamento
- Se tutte le assegnazioni sono completate, l'attività viene marcata come `completed`

---

## 📊 Query SQL di Esempio

### Query 1: Attività Pendenti per Operatore

```sql
SELECT 
  st.id as task_id,
  st.task_type,
  st.description,
  st.priority,
  st.due_date,
  s.selection_number,
  s.date as selection_date,
  sta.id as assignment_id,
  sta.status as assignment_status,
  sta.assigned_at
FROM selection_tasks st
JOIN selections s ON s.id = st.selection_id
JOIN selection_task_assignments sta ON sta.task_id = st.id
WHERE sta.operator_id = $1 
  AND sta.status IN ('assigned', 'accepted', 'in_progress')
ORDER BY 
  CASE st.priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  st.due_date ASC NULLS LAST;
```

---

### Query 2: Dettagli Ceste per Attività

```sql
SELECT 
  stb.id,
  stb.basket_id,
  stb.role,
  b.physical_number,
  b.flupsy_id,
  ssb.animal_count,
  ssb.total_weight,
  ssb.animals_per_kg,
  sz.name as size_name
FROM selection_task_baskets stb
LEFT JOIN baskets b ON b.id = stb.basket_id
LEFT JOIN selection_source_baskets ssb ON ssb.basket_id = b.id
LEFT JOIN sizes sz ON sz.id = ssb.size_id
WHERE stb.task_id = $1;
```

---

### Query 3: Storico Completamenti Operatore

```sql
SELECT 
  st.task_type,
  st.description,
  sta.completed_at,
  sta.completion_notes,
  s.selection_number
FROM selection_task_assignments sta
JOIN selection_tasks st ON st.id = sta.task_id
LEFT JOIN selections s ON s.id = st.selection_id
WHERE sta.operator_id = $1 
  AND sta.status = 'completed'
ORDER BY sta.completed_at DESC
LIMIT 50;
```

---

## 🔄 Flusso di Lavoro Completo

### Sequenza Tipica

1. **App Delta Futuro**:
   - Crea selezione avanzata ceste
   - Crea attività per la selezione
   - Assegna ceste all'attività
   - Assegna operatori all'attività

2. **App Esterna** (operatore):
   - Recupera attività pendenti (`GET /api/operators/:id/tasks`)
   - Visualizza dettagli ceste (`GET /api/tasks/:id/baskets`)
   - Accetta attività (`PATCH` status → `accepted`)
   - Inizia lavoro (`PATCH` status → `in_progress`)
   - Completa attività (`PATCH` status → `completed` + note)

3. **Automatismi**:
   - Quando tutte le assegnazioni sono `completed`, l'attività diventa `completed`
   - Il campo `external_app_synced_at` traccia l'ultima sincronizzazione

---

## 📱 Esempio Integrazione App Mobile

```typescript
// API Client
const API_BASE_URL = 'https://your-domain.replit.app/api';

interface Task {
  taskId: number;
  taskType: string;
  description: string;
  priority: string;
  dueDate: string;
  assignmentId: number;
  assignmentStatus: string;
}

// 1. Ottieni attività per operatore
async function getOperatorTasks(operatorId: number): Promise<Task[]> {
  const response = await fetch(
    `${API_BASE_URL}/operators/${operatorId}/tasks?status=assigned,in_progress`
  );
  return await response.json();
}

// 2. Accetta attività
async function acceptTask(taskId: number, assignmentId: number) {
  const response = await fetch(
    `${API_BASE_URL}/tasks/${taskId}/assignments/${assignmentId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'accepted' })
    }
  );
  return await response.json();
}

// 3. Inizia attività
async function startTask(taskId: number, assignmentId: number) {
  const response = await fetch(
    `${API_BASE_URL}/tasks/${taskId}/assignments/${assignmentId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in_progress' })
    }
  );
  return await response.json();
}

// 4. Completa attività
async function completeTask(
  taskId: number, 
  assignmentId: number, 
  notes: string
) {
  const response = await fetch(
    `${API_BASE_URL}/tasks/${taskId}/assignments/${assignmentId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status: 'completed',
        completionNotes: notes
      })
    }
  );
  return await response.json();
}

// 5. Ottieni ceste attività
async function getTaskBaskets(taskId: number) {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/baskets`);
  const baskets = await response.json();
  
  // Converti peso da grammi a kg
  return baskets.map(b => ({
    ...b,
    totalWeightKg: b.totalWeight / 1000
  }));
}
```

---

## ⚠️ Note Importanti

1. **Peso in Grammi**: Il campo `total_weight` è sempre in GRAMMI. Dividere per 1000 per ottenere KG.

2. **Immutabilità Snapshot**: I dati in `selection_source_baskets` sono snapshot immutabili al momento della selezione.

3. **Sincronizzazione**: Il campo `external_app_synced_at` viene aggiornato automaticamente ad ogni modifica da app esterna.

4. **Stati Validi**: Rispettare le transizioni di stato valide per evitare errori.

5. **Operatori Attivi**: Filtrare solo operatori con `active = true`.

---

## 🐛 Debugging

### Test Connessione Database

```sql
-- Verifica operatori
SELECT * FROM operators WHERE active = true;

-- Verifica attività pendenti
SELECT * FROM selection_tasks WHERE status IN ('pending', 'assigned', 'in_progress');

-- Verifica assegnazioni
SELECT * FROM selection_task_assignments WHERE status != 'completed';
```

### Log Attività Operatore

```sql
SELECT 
  o.first_name,
  o.last_name,
  COUNT(CASE WHEN sta.status = 'completed' THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN sta.status = 'in_progress' THEN 1 END) as in_progress_tasks
FROM operators o
LEFT JOIN selection_task_assignments sta ON sta.operator_id = o.id
WHERE o.active = true
GROUP BY o.id, o.first_name, o.last_name;
```

---

## 📞 Supporto

Per domande o problemi contattare il team Delta Futuro.

**Versione Documentazione**: 1.0.0  
**Data**: 08 Novembre 2025
