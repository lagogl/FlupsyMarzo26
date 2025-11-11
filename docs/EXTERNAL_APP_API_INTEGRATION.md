# 📡 API REST - Integrazione App Esterna FLUPSY

**Versione:** 2.2  
**Data:** 11 Novembre 2025  
**Target:** Sviluppatori App Mobile FLUPSY

---

## 📖 Indice

1. [Panoramica](#panoramica)
2. [Autenticazione](#autenticazione)
3. [Base URL](#base-url)
4. [Endpoint API](#endpoint-api)
5. [Modelli Dati](#modelli-dati)
6. [Flussi di Lavoro](#flussi-di-lavoro)
7. [Esempi Codice](#esempi-codice)
8. [Gestione Errori](#gestione-errori)
9. [Best Practices](#best-practices)

---

## 🎯 Panoramica

L'app esterna FLUPSY accede al sistema Delta Futuro tramite **API REST**. Questo permette:

- ✅ **Sicurezza**: Controllo accessi centralizzato
- ✅ **Validazione**: Dati validati server-side
- ✅ **Tracciabilità**: Ogni operazione tracciata con operatorId
- ✅ **Scalabilità**: Gestione carico e rate limiting

### Operazioni Disponibili

1. **Leggere attività assegnate** a un operatore
2. **Visualizzare dettagli ceste** di un'attività
3. **Iniziare un'attività** (presa in carico)
4. **Completare un'attività** con note

---

## 🔐 Autenticazione

**Attualmente:** Nessuna autenticazione richiesta (accesso interno)

**Prossimamente:** API Key nell'header
```http
Authorization: Bearer YOUR_API_KEY
```

---

## 🌐 Base URL

### Development
```
http://localhost:5000/api
```

### Production
```
https://your-project.replit.app/api
```

---

## 📡 Endpoint API

### 1. **GET /operators/:operatorId/tasks**

Recupera tutte le attività assegnate a un operatore specifico.

**Request:**
```http
GET /api/operators/5/tasks?status=assigned,in_progress
```

**Query Parameters:**
- `status` (opzionale): Filtra per stati separati da virgola
  - Valori: `assigned`, `accepted`, `in_progress`, `completed`

**Response 200:**
```json
[
  {
    "taskId": 42,
    "taskType": "pesatura",
    "description": "Pesatura settimanale ceste",
    "priority": "high",
    "taskStatus": "assigned",
    "dueDate": "2025-11-10",
    "selectionId": 15,
    "selectionNumber": 3,
    "selectionDate": "2025-11-08",
    "assignmentId": 123,
    "assignmentStatus": "assigned",
    "assignedAt": "2025-11-10T08:00:00.000Z",
    "startedAt": null,
    "completedAt": null
  }
]
```

**Response Codes:**
- `200 OK`: Success
- `400 Bad Request`: ID operatore non valido
- `500 Internal Server Error`: Errore server

---

### 2. **GET /tasks/:taskId/baskets**

Recupera le ceste associate a un'attività.

**Request:**
```http
GET /api/tasks/42/baskets
```

**Response 200:**
```json
[
  {
    "id": 15,
    "basketId": 78,
    "role": "source",
    "physicalNumber": 6,
    "flupsyId": 2,
    "flupsyName": "FLUPSY 2",
    "animalCount": 15000,
    "totalWeight": 8500,
    "animalsPerKg": 1765,
    "sizeId": 5,
    "sizeName": "TP-1500"
  }
]
```

**Note:**
- `totalWeight`: Espresso in **GRAMMI** (dividere per 1000 per kg)
- `role`: `source` o `destination` (rilevante solo per vagliatura con mappa)

**Response Codes:**
- `200 OK`: Success
- `400 Bad Request`: ID task non valido
- `500 Internal Server Error`: Errore server

---

### 3. **PATCH /tasks/:taskId/assignments/:assignmentId**

Aggiorna lo stato di un'assegnazione (presa in carico, completamento).

**Request - Inizia Attività:**
```http
PATCH /api/tasks/42/assignments/123
Content-Type: application/json

{
  "status": "in_progress",
  "operatorId": 5
}
```

**Request - Completa Attività:**
```http
PATCH /api/tasks/42/assignments/123
Content-Type: application/json

{
  "status": "completed",
  "operatorId": 5,
  "completionNotes": "Pesatura completata. Peso totale: 15.2kg"
}
```

**Body Parameters:**
- `status` **(obbligatorio)**: Nuovo stato
  - Valori: `assigned`, `accepted`, `in_progress`, `completed`
- `operatorId` **(obbligatorio per in_progress/completed)**: ID operatore che esegue l'azione
- `completionNotes` (opzionale): Note di completamento

**Response 200:**
```json
{
  "id": 123,
  "taskId": 42,
  "operatorId": 5,
  "status": "completed",
  "assignedAt": "2025-11-10T08:00:00.000Z",
  "startedBy": 5,
  "startedAt": "2025-11-10T09:15:00.000Z",
  "completedBy": 5,
  "completedAt": "2025-11-10T10:30:00.000Z",
  "completionNotes": "Pesatura completata. Peso totale: 15.2kg",
  "externalAppSyncedAt": "2025-11-10T10:30:00.000Z"
}
```

**Response Codes:**
- `200 OK`: Success
- `400 Bad Request`: 
  - ID non valido
  - Status non valido
  - operatorId mancante per in_progress/completed
- `404 Not Found`: Assignment non trovata
- `500 Internal Server Error`: Errore server

**Transizioni di Stato Valide:**
```
assigned → accepted → in_progress → completed
   ↓          ↓           ↓
cancelled  cancelled  cancelled
```

---

### 4. **GET /tasks/:taskId**

Recupera dettagli completi di un task (con assignments e baskets).

**Request:**
```http
GET /api/tasks/42
```

**Response 200:**
```json
{
  "id": 42,
  "selectionId": 15,
  "taskType": "pesatura",
  "description": "Pesatura settimanale",
  "priority": "high",
  "status": "assigned",
  "dueDate": "2025-11-10",
  "notes": "Controllare temperatura acqua",
  "createdAt": "2025-11-08T10:00:00.000Z",
  "assignments": [
    {
      "id": 123,
      "operatorId": 5,
      "operatorFirstName": "Mario",
      "operatorLastName": "Rossi",
      "status": "assigned",
      "assignedAt": "2025-11-10T08:00:00.000Z"
    }
  ],
  "baskets": [
    {
      "id": 15,
      "basketId": 78,
      "physicalNumber": 6,
      "flupsyId": 2,
      "flupsyName": "FLUPSY 2"
    }
  ]
}
```

---

## 📋 Modelli Dati

### Task

```typescript
interface Task {
  id: number;
  selectionId: number | null;
  taskType: 'pesatura' | 'vagliatura' | 'pulizia' | 'selezione' | 'trasferimento';
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  dueDate: string | null; // ISO date
  notes: string | null;
  createdAt: string; // ISO datetime
  updatedAt: string | null;
  completedAt: string | null;
}
```

### Assignment

```typescript
interface Assignment {
  id: number;
  taskId: number;
  operatorId: number;
  status: 'assigned' | 'accepted' | 'in_progress' | 'completed';
  assignedAt: string; // ISO datetime
  startedBy: number | null;
  startedAt: string | null;
  completedBy: number | null;
  completedAt: string | null;
  completionNotes: string | null;
  externalAppSyncedAt: string | null;
}
```

### Basket

```typescript
interface TaskBasket {
  id: number;
  basketId: number;
  role: 'source' | 'destination' | null;
  physicalNumber: number;
  flupsyId: number;
  flupsyName: string;
  animalCount: number;
  totalWeight: number; // in GRAMMI
  animalsPerKg: number;
  sizeId: number;
  sizeName: string;
}
```

---

## 🔄 Flussi di Lavoro

### Flusso 1: Visualizza Attività del Giorno

```
1. App chiama GET /api/operators/5/tasks?status=assigned,in_progress
2. Filtra lato client per due_date = oggi
3. Mostra lista attività ordinate per priorità
```

### Flusso 2: Operatore Prende in Carico

```
1. Operatore tap su task
2. App chiama GET /api/tasks/42/baskets per vedere dettagli ceste
3. Operatore tap "Inizia"
4. App chiama PATCH /api/tasks/42/assignments/123
   Body: { status: "in_progress", operatorId: 5 }
5. Server salva started_by=5, started_at=NOW()
6. App mostra task "In Corso"
```

### Flusso 3: Operatore Completa Attività

```
1. Operatore compila note
2. Operatore tap "Completa"
3. App chiama PATCH /api/tasks/42/assignments/123
   Body: { 
     status: "completed", 
     operatorId: 5,
     completionNotes: "..." 
   }
4. Server salva completed_by=5, completed_at=NOW()
5. Task sparisce dal ticker Delta Futuro
```

---

## ⚠️ IMPORTANTE: Gestione Task Completati e Cancellati

### 1. Task Completati dal Responsabile

#### Problema
Il responsabile può **completare manualmente** un task dal modulo "Gestione Attività" di Delta Futuro anche se gli operatori non hanno ancora completato i loro assignment.

In questo caso:
- `task.status` diventa `'completed'` ✅
- Ma `assignment.status` rimane `'assigned'` o `'in_progress'` ❌

#### Soluzione Backend
**✅ AUTOMATICO - Nessuna modifica necessaria all'app mobile**

Il backend filtra automaticamente i task completati dall'endpoint `/api/operators/:operatorId/tasks`.

I task completati dal responsabile **spariscono automaticamente** dalla lista dell'operatore.

---

### 2. Task Cancellati dal Responsabile

#### Problema
Il responsabile può **cancellare** un task dal modulo "Gestione Attività" di Delta Futuro.

Quando un task viene cancellato:
- `task.status` diventa `'cancelled'` 
- Il task viene marcato come soft-deleted (non eliminato fisicamente)
- I campi `cancelledBy` e `cancelledAt` vengono popolati per tracciabilità

#### Soluzione Backend
**✅ AUTOMATICO - Nessuna modifica necessaria all'app mobile**

Il backend filtra automaticamente i task cancellati dall'endpoint `/api/operators/:operatorId/tasks`.

I task cancellati **spariscono automaticamente** dalla lista dell'operatore.

---

### 📱 Cosa Deve Fare lo Sviluppatore Mobile

#### ✅ Nessun Filtro Necessario
L'endpoint `/api/operators/:operatorId/tasks` restituisce **SOLO** i task attivi:
- ✅ Mostra: task con status `'pending'`, `'assigned'`, `'in_progress'`
- ❌ Nasconde: task con status `'completed'` o `'cancelled'`

Usa i task così come arrivano dall'API:

```javascript
async function getActiveTasks(operatorId) {
  const response = await fetch(
    `${API_BASE_URL}/operators/${operatorId}/tasks?status=assigned,in_progress`
  );
  
  const tasks = await response.json();
  
  // I task sono già filtrati dal backend - usali direttamente
  return tasks;
}
```

#### ⚠️ Gestione Errori 404
Un operatore potrebbe tentare di completare un task che è stato cancellato nel frattempo.

**Implementa gestione errori** per questo scenario:

```javascript
async function completeTask(taskId, assignmentId, operatorId, notes) {
  try {
    const response = await fetch(
      `${API_BASE}/tasks/${taskId}/assignments/${assignmentId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          operatorId: operatorId,
          completionNotes: notes
        })
      }
    );
    
    if (response.status === 404) {
      // Task cancellato dal responsabile nel frattempo
      Alert.alert(
        'Attività Non Disponibile',
        'Questa attività è stata cancellata dal responsabile.'
      );
      // Aggiorna la lista per rimuovere il task cancellato
      await refreshTaskList();
      return null;
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Errore durante completamento');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Errore completamento task:', error);
    throw error;
  }
}
```

### 🎯 Riepilogo per Sviluppatore

| Scenario | Comportamento Backend | Azione App Mobile |
|----------|----------------------|-------------------|
| **Task completato dal manager** | Escluso automaticamente dall'API | ✅ Nessuna - sparisce automaticamente |
| **Task cancellato dal manager** | Escluso automaticamente dall'API | ✅ Nessuna - sparisce automaticamente |
| **Tentativo di completare task cancellato** | Restituisce 404 Not Found | ⚠️ Gestisci errore 404 e mostra messaggio |

### Perché Soft Delete?

Il sistema usa **soft delete** (status='cancelled') invece di eliminare fisicamente i task per:
- ✅ **Tracciabilità**: Sapere chi ha cancellato cosa e quando
- ✅ **Analytics**: Calcolare metriche sui task cancellati
- ✅ **Audit**: Storico completo delle attività
- ✅ **Recovery**: Possibilità futura di "ripristinare" task cancellati

---

## 💻 Esempi Codice

### JavaScript/TypeScript (Fetch API)

```javascript
const API_BASE_URL = 'https://your-project.replit.app/api';

// 1. Recupera attività per operatore
async function getTasksForOperator(operatorId) {
  const response = await fetch(
    `${API_BASE_URL}/operators/${operatorId}/tasks?status=assigned,in_progress`
  );
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}

// 2. Recupera ceste di un task
async function getTaskBaskets(taskId) {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/baskets`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const baskets = await response.json();
  
  // Converti peso da grammi a kg
  return baskets.map(b => ({
    ...b,
    totalWeightKg: b.totalWeight / 1000
  }));
}

// 3. Inizia un'attività
async function startTask(taskId, assignmentId, operatorId) {
  const response = await fetch(
    `${API_BASE_URL}/tasks/${taskId}/assignments/${assignmentId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'in_progress',
        operatorId: operatorId
      })
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Errore durante presa in carico');
  }
  
  return await response.json();
}

// 4. Completa un'attività
async function completeTask(taskId, assignmentId, operatorId, notes) {
  const response = await fetch(
    `${API_BASE_URL}/tasks/${taskId}/assignments/${assignmentId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'completed',
        operatorId: operatorId,
        completionNotes: notes
      })
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Errore durante completamento');
  }
  
  return await response.json();
}

// Esempio uso completo
async function main() {
  const operatorId = 5;
  
  try {
    // 1. Recupera task
    const tasks = await getTasksForOperator(operatorId);
    console.log('Task trovati:', tasks.length);
    
    if (tasks.length > 0) {
      const task = tasks[0];
      
      // 2. Visualizza ceste
      const baskets = await getTaskBaskets(task.taskId);
      console.log('Ceste:', baskets);
      
      // 3. Inizia task
      const started = await startTask(
        task.taskId, 
        task.assignmentId, 
        operatorId
      );
      console.log('Task iniziato:', started);
      
      // 4. Completa task
      const completed = await completeTask(
        task.taskId,
        task.assignmentId,
        operatorId,
        'Completato con successo'
      );
      console.log('Task completato:', completed);
    }
  } catch (error) {
    console.error('Errore:', error.message);
  }
}
```

### React Native

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

class TaskService {
  baseURL = 'https://your-project.replit.app/api';
  
  async getOperatorTasks(operatorId, status = 'assigned,in_progress') {
    try {
      const url = `${this.baseURL}/operators/${operatorId}/tasks?status=${status}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Errore ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Errore recupero task:', error);
      throw error;
    }
  }
  
  async startTask(taskId, assignmentId, operatorId) {
    try {
      const url = `${this.baseURL}/tasks/${taskId}/assignments/${assignmentId}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'in_progress',
          operatorId
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Errore avvio task:', error);
      throw error;
    }
  }
  
  async completeTask(taskId, assignmentId, operatorId, notes) {
    try {
      const url = `${this.baseURL}/tasks/${taskId}/assignments/${assignmentId}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          operatorId,
          completionNotes: notes
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Errore completamento task:', error);
      throw error;
    }
  }
}

export default new TaskService();
```

---

## ⚠️ Gestione Errori

### Codici di Stato HTTP

```
200 OK                  - Richiesta completata con successo
201 Created             - Risorsa creata con successo
400 Bad Request         - Parametri non validi o mancanti
404 Not Found           - Risorsa non trovata
500 Internal Server Error - Errore server
```

### Formato Errori

```json
{
  "error": "Descrizione errore leggibile"
}
```

### Gestione Errori Lato Client

```javascript
async function handleAPICall(apiFunction) {
  try {
    return await apiFunction();
  } catch (error) {
    if (error.message.includes('400')) {
      // Errore validazione
      alert('Dati non validi. Controlla i campi.');
    } else if (error.message.includes('404')) {
      // Risorsa non trovata
      alert('Attività non trovata.');
    } else if (error.message.includes('500')) {
      // Errore server
      alert('Errore del server. Riprova più tardi.');
    } else {
      // Errore rete
      alert('Errore di connessione. Controlla la rete.');
    }
    
    console.error('Errore API:', error);
  }
}
```

---

## ✅ Best Practices

### 1. Timeout e Retry

```javascript
async function fetchWithTimeout(url, options, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchWithTimeout(url, options);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 2. Cache Locale

```javascript
// Salva task in cache
async function cacheTask(task) {
  await AsyncStorage.setItem(
    `task_${task.taskId}`,
    JSON.stringify(task)
  );
}

// Recupera da cache in caso di errore rete
async function getTaskWithCache(taskId) {
  try {
    return await getTaskFromAPI(taskId);
  } catch (error) {
    const cached = await AsyncStorage.getItem(`task_${taskId}`);
    if (cached) {
      console.log('Usando task dalla cache');
      return JSON.parse(cached);
    }
    throw error;
  }
}
```

### 3. Validazione Lato Client

```javascript
function validateTaskUpdate(status, operatorId) {
  if (!status) {
    throw new Error('Status richiesto');
  }
  
  const validStatuses = ['assigned', 'accepted', 'in_progress', 'completed'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Status non valido: ${status}`);
  }
  
  if ((status === 'in_progress' || status === 'completed') && !operatorId) {
    throw new Error('operatorId richiesto per questo stato');
  }
  
  return true;
}
```

---

## 📞 Supporto

Per domande o problemi con l'integrazione API:

1. **Documentazione**: Questo documento
2. **Endpoint Test**: Usa Postman/Insomnia per testare le API
3. **Log Errori**: Controlla i log server per dettagli errori 500

---

## 📝 Changelog

### Versione 2.2 (11 Nov 2025)
- ✅ **IMPORTANTE**: Implementato soft delete per task cancellati
- ✅ Backend filtra automaticamente task completati E cancellati dall'endpoint operatori
- ✅ Nessun filtro lato client necessario - tutto gestito dal backend
- ✅ Aggiunta sezione "Gestione Errori 404" per task cancellati durante il completamento
- ✅ Tabella riepilogo comportamenti per sviluppatori
- ✅ Aggiunti campi `cancelledBy` e `cancelledAt` per tracciabilità

### Versione 2.1 (11 Nov 2025) - DEPRECATED
- ⚠️ Versione obsoleta - richiedeva filtro lato client
- ✅ Aggiunta sezione "Filtraggio Task Completati dal Responsabile"

### Versione 2.0 (10 Nov 2025)
- ✅ API REST complete per app esterna
- ✅ Tracciamento `started_by` e `completed_by`
- ✅ Validazione server-side con `operatorId` obbligatorio
- ✅ Esempi codice JavaScript/TypeScript e React Native
- ✅ Gestione errori e best practices

---

**Fine Documentazione API REST** 🎉
