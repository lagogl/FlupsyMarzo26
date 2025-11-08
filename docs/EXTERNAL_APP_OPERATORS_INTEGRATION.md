# Integrazione Sistema Operatori - App Esterna FLUPSY

**Versione:** 1.0  
**Data:** 8 Novembre 2025  
**Destinatario:** Sviluppatore App Esterna (Mobile/Web)

---

## 📋 Indice

1. [Panoramica Sistema](#panoramica-sistema)
2. [Architettura Sincronizzazione](#architettura-sincronizzazione)
3. [Database Schema](#database-schema)
4. [Flussi Operativi](#flussi-operativi)
5. [API Endpoints](#api-endpoints)
6. [Autenticazione](#autenticazione)
7. [Gestione Stati Attività](#gestione-stati-attività)
8. [Edge Cases e Gestione Errori](#edge-cases-e-gestione-errori)
9. [Testing e Validazione](#testing-e-validazione)
10. [Esempi Codice](#esempi-codice)

---

## 1. Panoramica Sistema

### Obiettivo
Consentire agli operatori registrati in **Delta Futuro (SandNursery)** di:
- Autenticarsi nell'app esterna
- Visualizzare le attività di selezione cestelli assegnate loro
- Completare le attività e aggiornare lo stato in tempo reale

### Single Source of Truth
**Delta Futuro** è il sistema master per:
- Creazione e gestione operatori
- Assegnazione attività
- Storico operazioni

**App Esterna** è responsabile di:
- Autenticazione operatori
- Interfaccia mobile per visualizzazione/completamento attività
- Invio aggiornamenti stato a Delta Futuro

### Principi Architetturali
- ✅ Delta Futuro **PUSH** dati operatori verso DB esterno
- ✅ App Esterna **QUERY** dati operatori dal proprio DB
- ✅ App Esterna **INVIA** aggiornamenti attività a Delta Futuro via API
- ❌ App Esterna **NON DEVE** creare/modificare operatori direttamente

---

## 2. Architettura Sincronizzazione

```
┌──────────────────────────────────────┐
│   DELTA FUTURO (Master)              │
│   - Gestione operatori               │
│   - Assegnazione attività            │
│   - Generazione credenziali          │
└──────────────┬───────────────────────┘
               │
               │ PUSH Event-Driven
               │ (create/update/deactivate)
               │
               ▼
┌──────────────────────────────────────┐
│   DATABASE ESTERNO                   │
│   Tabella: external_users            │
│   - Operatori sincronizzati          │
│   - Credenziali autenticazione       │
└──────────────┬───────────────────────┘
               │
               │ QUERY (SELECT)
               │
               ▼
┌──────────────────────────────────────┐
│   APP ESTERNA (Mobile/Web)           │
│   - Login operatori                  │
│   - Visualizzazione attività         │
│   - Aggiornamento stato task         │
└──────────────┬───────────────────────┘
               │
               │ API REST (POST/PATCH)
               │
               ▼
       Delta Futuro Backend
       (aggiornamento attività)
```

### Strategia di Sincronizzazione

| Evento | Direzione | Meccanismo | Latenza |
|--------|-----------|------------|---------|
| Creazione operatore | Delta → Esterno | Push immediato + retry | < 2 secondi |
| Modifica operatore | Delta → Esterno | Push immediato + retry | < 2 secondi |
| Disattivazione operatore | Delta → Esterno | Push immediato + retry | < 2 secondi |
| Completamento attività | Esterno → Delta | API REST sincrona | < 500ms |
| Riconciliazione dati | Delta → Esterno | Job notturno (3:00 AM) | N/A |

---

## 3. Database Schema

### Tabella: `external_users`

**IMPORTANTE:** Creare questa tabella nel vostro database condiviso (stesso database che contiene `ordini`, `consegne_condivise`).

```sql
CREATE TABLE external_users (
  -- Chiavi primarie e riferimenti
  id SERIAL PRIMARY KEY,
  delta_operator_id INTEGER UNIQUE NOT NULL,  -- FK virtuale a task_operators(id) in Delta Futuro
  
  -- Autenticazione
  username VARCHAR(100) UNIQUE NOT NULL,      -- Email o codice operatore
  hashed_password TEXT NOT NULL,              -- Hash bcrypt della password
  temp_password_token VARCHAR(255),           -- Token per primo accesso (nullable)
  temp_password_expires_at TIMESTAMP,         -- Scadenza token temporaneo
  
  -- Dati anagrafici (mirror da Delta Futuro)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,                                  -- Es: 'operatore', 'supervisore', 'tecnico'
  
  -- Stato e sincronizzazione
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_sync_at TIMESTAMP NOT NULL DEFAULT NOW(),
  sync_version INTEGER NOT NULL DEFAULT 1,    -- Versione per gestione conflitti
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP,
  
  -- Indici per performance
  CONSTRAINT chk_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indici
CREATE INDEX idx_external_users_delta_operator ON external_users(delta_operator_id);
CREATE INDEX idx_external_users_email ON external_users(email);
CREATE INDEX idx_external_users_active ON external_users(is_active);
CREATE INDEX idx_external_users_username ON external_users(username);

-- Commenti
COMMENT ON TABLE external_users IS 'Operatori sincronizzati da Delta Futuro per autenticazione app esterna';
COMMENT ON COLUMN external_users.delta_operator_id IS 'ID operatore nel database Delta Futuro (task_operators.id)';
COMMENT ON COLUMN external_users.sync_version IS 'Versione incrementale per gestione conflitti di sincronizzazione';
```

### Struttura Campi

| Campo | Tipo | Nullable | Descrizione | Popolato da |
|-------|------|----------|-------------|-------------|
| `id` | SERIAL | NO | Chiave primaria locale | DB Esterno (auto) |
| `delta_operator_id` | INTEGER | NO | ID operatore in Delta Futuro | Delta Futuro |
| `username` | VARCHAR(100) | NO | Username per login (tipicamente email) | Delta Futuro |
| `hashed_password` | TEXT | NO | Password hash bcrypt | Delta Futuro (iniziale) + App Esterna (cambio pwd) |
| `temp_password_token` | VARCHAR(255) | SI | Token temporaneo primo accesso | Delta Futuro |
| `temp_password_expires_at` | TIMESTAMP | SI | Scadenza token temporaneo | Delta Futuro |
| `first_name` | TEXT | NO | Nome operatore | Delta Futuro |
| `last_name` | TEXT | NO | Cognome operatore | Delta Futuro |
| `email` | TEXT | SI | Email contatto | Delta Futuro |
| `phone` | TEXT | SI | Telefono contatto | Delta Futuro |
| `role` | TEXT | SI | Ruolo operatore | Delta Futuro |
| `is_active` | BOOLEAN | NO | Operatore attivo/disattivato | Delta Futuro |
| `last_sync_at` | TIMESTAMP | NO | Ultima sincronizzazione da Delta | Delta Futuro |
| `sync_version` | INTEGER | NO | Versione record (anti-conflitti) | Delta Futuro |
| `created_at` | TIMESTAMP | NO | Data creazione | DB Esterno (auto) |
| `updated_at` | TIMESTAMP | SI | Data ultima modifica | App Esterna (cambio pwd) |

---

## 4. Flussi Operativi

### 4.1 Creazione Nuovo Operatore

```mermaid
sequenceDiagram
    participant R as Responsabile Delta
    participant D as Delta Futuro Backend
    participant DB as Database Esterno
    participant E as Email Service
    participant O as Operatore
    participant A as App Esterna

    R->>D: Crea operatore "Mario Rossi"
    D->>D: INSERT INTO task_operators
    D->>D: Genera password temporanea
    D->>DB: INSERT INTO external_users
    Note over DB: delta_operator_id = 123<br/>username = mario.rossi@example.com<br/>temp_password = "Mario.2025"
    D->>E: Invia email benvenuto
    E->>O: Email con credenziali temporanee
    O->>A: Login con credenziali temporanee
    A->>A: Richiede cambio password obbligatorio
    O->>A: Inserisce nuova password
    A->>DB: UPDATE hashed_password, temp_password_token = NULL
```

**Step dettagliati:**

1. **Delta Futuro Backend** riceve richiesta creazione operatore
2. Inserisce record in `task_operators` (database locale Delta)
3. Genera password temporanea: `{FirstName}.{Anno}` (es: `Mario.2025`)
4. **PUSH immediato** verso database esterno:
   ```sql
   INSERT INTO external_users (
     delta_operator_id, username, hashed_password, 
     first_name, last_name, email, phone, role, is_active
   ) VALUES (
     123, 'mario.rossi@example.com', '$2b$10$...', 
     'Mario', 'Rossi', 'mario.rossi@example.com', '+39123456789', 'operatore', true
   );
   ```
5. Invia email notifica con credenziali temporanee
6. Operatore riceve email e accede all'app esterna
7. **App Esterna** richiede cambio password al primo login
8. Operatore imposta nuova password
9. **App Esterna** aggiorna `hashed_password` e rimuove `temp_password_token`

### 4.2 Assegnazione Attività

```mermaid
sequenceDiagram
    participant R as Responsabile Delta
    participant D as Delta Futuro Backend
    participant A as App Esterna
    participant O as Operatore

    R->>D: Assegna attività a Mario Rossi (ID 123)
    D->>D: INSERT INTO selection_task_assignments
    Note over D: task_id = 456<br/>operator_id = 123<br/>status = 'pending'
    O->>A: Apre app e effettua login
    A->>D: GET /api/tasks/my-tasks?operatorId=123
    D-->>A: Lista attività [{id: 456, ...}]
    A->>O: Mostra attività assegnate
```

**API Request dall'App Esterna:**
```http
GET /api/tasks/my-tasks?operatorId=123
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "tasks": [
    {
      "id": 456,
      "title": "Selezione Cestello #C-001",
      "description": "Selezionare animali taglia 30-35mm",
      "basketCode": "C-001",
      "basketId": 789,
      "status": "pending",
      "assignedAt": "2025-11-08T10:30:00Z",
      "dueDate": "2025-11-10T18:00:00Z",
      "priority": "high"
    }
  ]
}
```

### 4.3 Completamento Attività

```mermaid
sequenceDiagram
    participant O as Operatore
    participant A as App Esterna
    participant D as Delta Futuro API

    O->>A: Completa attività #456
    A->>D: PATCH /api/tasks/456/complete
    Note over D: { operatorId: 123, completedAt: "..." }
    D->>D: UPDATE selection_task_assignments<br/>SET status = 'completed'
    D-->>A: 200 OK
    A->>O: Mostra conferma completamento
```

**API Request:**
```http
PATCH /api/tasks/456/complete
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "operatorId": 123,
  "completedAt": "2025-11-08T14:45:00Z",
  "notes": "Operazione completata regolarmente"
}
```

### 4.4 Modifica Operatore

**Scenario:** Responsabile modifica email operatore in Delta Futuro

```
Delta Futuro → UPDATE task_operators SET email = 'nuovo@email.com'
             ↓
             PUSH evento 'operator.updated'
             ↓
Database Esterno → UPDATE external_users 
                   SET email = 'nuovo@email.com', 
                       sync_version = sync_version + 1
```

### 4.5 Disattivazione Operatore

**Scenario:** Operatore termina contratto

```
Delta Futuro → UPDATE task_operators SET active = false
             ↓
             PUSH evento 'operator.deactivated'
             ↓
Database Esterno → UPDATE external_users 
                   SET is_active = false,
                       temp_password_token = NULL
             ↓
App Esterna → LOGIN NEGATO (account disattivato)
```

---

## 5. API Endpoints

### Endpoints Forniti da Delta Futuro

#### 5.1 Recupero Attività Operatore

```
GET /api/tasks/my-tasks
```

**Query Parameters:**
- `operatorId` (required): ID operatore in Delta Futuro (`delta_operator_id`)
- `status` (optional): Filtra per stato (`pending`, `in_progress`, `completed`, `cancelled`)
- `limit` (optional): Numero max risultati (default: 50)
- `offset` (optional): Paginazione (default: 0)

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response 200 OK:**
```json
{
  "tasks": [
    {
      "id": 123,
      "type": "selection",
      "title": "Selezione Cestello #C-042",
      "description": "Selezionare taglia 30-35mm, lotto L-2024-15",
      "status": "pending",
      "priority": "high",
      "assignedAt": "2025-11-08T10:00:00Z",
      "dueDate": "2025-11-10T18:00:00Z",
      "basketId": 789,
      "basketCode": "C-042",
      "lotId": 45,
      "lotCode": "L-2024-15",
      "targetSize": "30-35mm",
      "estimatedAnimals": 5000,
      "notes": "Priorità alta - consegna programmata"
    }
  ],
  "pagination": {
    "total": 12,
    "limit": 50,
    "offset": 0
  }
}
```

**Response 401 Unauthorized:**
```json
{
  "error": "Invalid or expired token"
}
```

#### 5.2 Dettaglio Attività

```
GET /api/tasks/{taskId}
```

**Path Parameters:**
- `taskId`: ID dell'attività

**Response 200 OK:**
```json
{
  "id": 123,
  "type": "selection",
  "title": "Selezione Cestello #C-042",
  "status": "pending",
  "assignedOperator": {
    "id": 456,
    "firstName": "Mario",
    "lastName": "Rossi"
  },
  "basket": {
    "id": 789,
    "code": "C-042",
    "currentSize": "25-30mm",
    "animalsCount": 5000
  },
  "lot": {
    "id": 45,
    "code": "L-2024-15"
  },
  "createdAt": "2025-11-08T09:00:00Z",
  "assignedAt": "2025-11-08T10:00:00Z",
  "dueDate": "2025-11-10T18:00:00Z"
}
```

#### 5.3 Aggiorna Stato Attività

```
PATCH /api/tasks/{taskId}/status
```

**Request Body:**
```json
{
  "operatorId": 456,
  "status": "in_progress",
  "notes": "Inizio lavorazione cestello"
}
```

**Status Validi:**
- `pending`: In attesa
- `in_progress`: In lavorazione
- `completed`: Completata
- `cancelled`: Annullata

**Response 200 OK:**
```json
{
  "success": true,
  "task": {
    "id": 123,
    "status": "in_progress",
    "updatedAt": "2025-11-08T11:30:00Z"
  }
}
```

#### 5.4 Completa Attività

```
PATCH /api/tasks/{taskId}/complete
```

**Request Body:**
```json
{
  "operatorId": 456,
  "completedAt": "2025-11-08T14:45:00Z",
  "notes": "Operazione completata. Selezionati 4850 animali.",
  "results": {
    "animalsProcessed": 5000,
    "animalsSelected": 4850,
    "mortalityCount": 150
  }
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "task": {
    "id": 123,
    "status": "completed",
    "completedAt": "2025-11-08T14:45:00Z"
  }
}
```

**Response 400 Bad Request:**
```json
{
  "error": "Task already completed",
  "completedAt": "2025-11-07T12:00:00Z"
}
```

---

## 6. Autenticazione

### 6.1 Login Operatore

**Implementato nell'App Esterna (non in Delta Futuro)**

```
POST /auth/login
```

**Request Body:**
```json
{
  "username": "mario.rossi@example.com",
  "password": "SecurePassword123"
}
```

**Flusso Autenticazione:**

1. App Esterna riceve username/password
2. Query su `external_users`:
   ```sql
   SELECT * FROM external_users 
   WHERE username = 'mario.rossi@example.com' 
   AND is_active = true;
   ```
3. Verifica password con bcrypt:
   ```javascript
   const isValid = await bcrypt.compare(password, user.hashed_password);
   ```
4. Se `temp_password_token` non è NULL → **Richiedi cambio password obbligatorio**
5. Genera JWT con payload:
   ```json
   {
     "userId": 123,
     "deltaOperatorId": 456,
     "username": "mario.rossi@example.com",
     "role": "operatore",
     "exp": 1699545600
   }
   ```
6. Risposta:
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": {
       "id": 123,
       "deltaOperatorId": 456,
       "firstName": "Mario",
       "lastName": "Rossi",
       "role": "operatore"
     },
     "requiresPasswordChange": false
   }
   ```

### 6.2 Cambio Password (Primo Accesso)

```
POST /auth/change-password
```

**Request Body:**
```json
{
  "userId": 123,
  "oldPassword": "Mario.2025",
  "newPassword": "MyNewSecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password aggiornata con successo"
}
```

**Update SQL:**
```sql
UPDATE external_users 
SET hashed_password = $1,
    temp_password_token = NULL,
    temp_password_expires_at = NULL,
    updated_at = NOW()
WHERE id = $2;
```

### 6.3 JWT Token

**Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Payload:**
```json
{
  "userId": 123,
  "deltaOperatorId": 456,
  "username": "mario.rossi@example.com",
  "role": "operatore",
  "iat": 1699459200,
  "exp": 1699545600
}
```

**Validità:** 24 ore (configurabile)

---

## 7. Gestione Stati Attività

### Stati Possibili

| Stato | Descrizione | Transizioni Permesse |
|-------|-------------|---------------------|
| `pending` | Attività assegnata, non ancora iniziata | → `in_progress`, `cancelled` |
| `in_progress` | Attività in lavorazione | → `completed`, `cancelled` |
| `completed` | Attività completata con successo | *(stato finale)* |
| `cancelled` | Attività annullata | *(stato finale)* |

### Diagramma Transizioni

```
    ┌──────────┐
    │ pending  │
    └────┬─────┘
         │
         ├─────────────┐
         │             │
         ▼             ▼
  ┌─────────────┐  ┌──────────┐
  │ in_progress │  │cancelled │
  └──────┬──────┘  └──────────┘
         │
         ▼
    ┌──────────┐
    │completed │
    └──────────┘
```

### Regole di Validazione

1. **Non è possibile modificare attività completate o annullate**
   ```json
   {
     "error": "Cannot modify task in final state",
     "currentStatus": "completed"
   }
   ```

2. **Solo l'operatore assegnato può aggiornare lo stato**
   ```json
   {
     "error": "Unauthorized. Task assigned to different operator",
     "assignedTo": 789
   }
   ```

3. **Completamento richiede campo `completedAt`**
   ```json
   {
     "error": "completedAt field is required when status is 'completed'"
   }
   ```

---

## 8. Edge Cases e Gestione Errori

### 8.1 Operatore Disattivato Durante Sessione

**Scenario:** Operatore sta lavorando, il responsabile lo disattiva in Delta Futuro.

**Comportamento Atteso:**
1. Delta Futuro invia evento `operator.deactivated`
2. Database esterno: `UPDATE external_users SET is_active = false`
3. App Esterna: al prossimo refresh token (o API call), riceve `401 Unauthorized`
4. Messaggio all'operatore: *"Il tuo account è stato disattivato. Contatta il supervisore."*

**Implementazione:**
```javascript
// Middleware autenticazione
if (!user.is_active) {
  return res.status(401).json({
    error: 'Account disabled',
    message: 'Your account has been deactivated. Please contact your supervisor.'
  });
}
```

### 8.2 Sincronizzazione Fallita

**Scenario:** Delta Futuro crea operatore, ma il database esterno è offline.

**Comportamento:**
1. Delta Futuro inserisce evento in coda con stato `pending`
2. Worker di sincronizzazione riprova con backoff esponenziale:
   - Tentativo 1: immediato
   - Tentativo 2: dopo 2 secondi
   - Tentativo 3: dopo 4 secondi
   - Tentativo 4: dopo 8 secondi
3. Dopo 4 tentativi falliti → **Dead Letter Queue**
4. Alert inviato al team operations
5. Operatore riceve email: *"Il tuo account verrà attivato a breve"*

**Monitoraggio:**
- Dashboard Delta Futuro mostra operatori "in sync" vs "sync failed"
- Job di riconciliazione notturno identifica discrepanze

### 8.3 Email Duplicata

**Scenario:** Due operatori con stessa email in Delta Futuro (errore gestionale).

**Prevenzione:**
```sql
-- Constraint già presente in external_users
UNIQUE (email)
```

**Gestione:**
1. Sync fallisce con errore: `duplicate key value violates unique constraint`
2. Delta Futuro logga errore e notifica responsabile
3. Responsabile corregge email duplicata
4. Retry automatico di sincronizzazione

### 8.4 Modifica Password nell'App Esterna

**Scenario:** Operatore cambia password nell'app esterna.

**Importante:** Delta Futuro **NON** deve sincronizzare questa modifica al proprio database locale. La password è gestita solo in `external_users`.

**Flusso:**
```
App Esterna → UPDATE external_users.hashed_password
           ✅ Modifica locale (NON inviare a Delta Futuro)
```

### 8.5 Attività Assegnata a Operatore Inesistente

**Scenario:** Bug/race condition - attività assegnata prima che operatore venga sincronizzato.

**Validazione Delta Futuro:**
```javascript
// Prima di assegnare attività
const operator = await db.query('SELECT * FROM task_operators WHERE id = ?', [operatorId]);
if (!operator) {
  throw new Error('Operator not found');
}

// Verifica che externalAppUserId sia settato (operatore sincronizzato)
if (!operator.externalAppUserId) {
  throw new Error('Operator not synced to external app yet. Please retry in a moment.');
}
```

### 8.6 Conflitti di Sincronizzazione

**Scenario:** Delta Futuro modifica operatore mentre sincronizzazione precedente è in corso.

**Soluzione: Versioning**
```sql
-- Delta Futuro invia sync_version incrementale
UPDATE external_users 
SET email = 'new@email.com', 
    sync_version = sync_version + 1,
    last_sync_at = NOW()
WHERE delta_operator_id = 123 
  AND sync_version = 5;  -- Conditional update

-- Se 0 rows affected → conflitto rilevato
```

---

## 9. Testing e Validazione

### 9.1 Test Case Critici

#### TC-01: Creazione Operatore End-to-End
```gherkin
Given il responsabile crea un operatore "Test User" in Delta Futuro
When la sincronizzazione è completata
Then il record esiste in external_users con delta_operator_id corretto
And l'operatore può effettuare login nell'app esterna
And riceve richiesta di cambio password
```

#### TC-02: Assegnazione e Completamento Attività
```gherkin
Given un operatore "Mario Rossi" (delta_operator_id: 123)
When il responsabile assegna attività #456
And l'operatore accede all'app esterna
Then visualizza l'attività #456
When completa l'attività con status 'completed'
Then lo stato in Delta Futuro è aggiornato a 'completed'
```

#### TC-03: Disattivazione Operatore
```gherkin
Given un operatore attivo con sessione aperta nell'app esterna
When il responsabile lo disattiva in Delta Futuro
Then external_users.is_active diventa false
And il prossimo API call dell'operatore riceve 401 Unauthorized
```

#### TC-04: Gestione Credenziali Temporanee
```gherkin
Given un nuovo operatore con password temporanea "Mario.2025"
When effettua login nell'app esterna
Then riceve requiresPasswordChange: true
And non può accedere alle funzionalità fino al cambio password
When imposta nuova password "SecurePass123!"
Then temp_password_token diventa NULL
And può accedere normalmente
```

### 9.2 Test Dati di Esempio

**Script SQL per creare operatore di test:**

```sql
-- Database Esterno
INSERT INTO external_users (
  delta_operator_id, username, hashed_password, 
  first_name, last_name, email, phone, role, is_active
) VALUES (
  999,  -- ID test (non conflittuale)
  'test.operator@example.com',
  '$2b$10$rOJ9KZKz7QFzVz7Zp4vZ.eJ0Jx0Z8Z0Z8Z0Z8Z0Z8Z0Z8Z0Z8Z0Z8',  -- Password: "Test123!"
  'Test',
  'Operator',
  'test.operator@example.com',
  '+39333999999',
  'operatore',
  true
);
```

**Credenziali Test:**
- Username: `test.operator@example.com`
- Password: `Test123!`
- Delta Operator ID: `999`

### 9.3 Validazione API

**Test con curl:**

```bash
# Login
curl -X POST https://your-app-api.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test.operator@example.com",
    "password": "Test123!"
  }'

# Recupero attività (sostituire {token} con JWT ricevuto)
curl -X GET "https://delta-futuro-api.replit.app/api/tasks/my-tasks?operatorId=999" \
  -H "Authorization: Bearer {token}"

# Completamento attività
curl -X PATCH "https://delta-futuro-api.replit.app/api/tasks/456/complete" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "operatorId": 999,
    "completedAt": "2025-11-08T15:00:00Z",
    "notes": "Test completamento"
  }'
```

---

## 10. Esempi Codice

### 10.1 Login (Node.js + Express)

```javascript
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Query operatore
    const result = await pool.query(
      'SELECT * FROM external_users WHERE username = $1 AND is_active = true',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Verifica password
    const isValid = await bcrypt.compare(password, user.hashed_password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Genera JWT
    const token = jwt.sign(
      {
        userId: user.id,
        deltaOperatorId: user.delta_operator_id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        deltaOperatorId: user.delta_operator_id,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      requiresPasswordChange: !!user.temp_password_token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### 10.2 Middleware Autenticazione

```javascript
const jwt = require('jsonwebtoken');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verifica che operatore sia ancora attivo
    const result = await pool.query(
      'SELECT is_active FROM external_users WHERE id = $1',
      [decoded.userId]
    );
    
    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return res.status(401).json({ 
        error: 'Account disabled',
        message: 'Your account has been deactivated. Please contact your supervisor.'
      });
    }
    
    req.user = decoded;
    next();
    
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}
```

### 10.3 Recupero Attività

```javascript
app.get('/api/tasks/my-tasks', authenticateToken, async (req, res) => {
  const deltaOperatorId = req.user.deltaOperatorId;
  const { status, limit = 50, offset = 0 } = req.query;
  
  try {
    // Chiamata API a Delta Futuro
    const response = await fetch(
      `https://delta-futuro-api.replit.app/api/tasks/my-tasks?operatorId=${deltaOperatorId}&status=${status || ''}&limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.DELTA_FUTURO_API_KEY}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch tasks from Delta Futuro');
    }
    
    const tasks = await response.json();
    res.json(tasks);
    
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ error: 'Failed to retrieve tasks' });
  }
});
```

### 10.4 Cambio Password

```javascript
const bcrypt = require('bcrypt');

app.post('/auth/change-password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.userId;
  
  // Validazione password
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ 
      error: 'Password must be at least 8 characters long' 
    });
  }
  
  try {
    // Recupera password corrente
    const result = await pool.query(
      'SELECT hashed_password FROM external_users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    
    // Verifica vecchia password
    const isValid = await bcrypt.compare(oldPassword, user.hashed_password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash nuova password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Aggiorna database
    await pool.query(
      `UPDATE external_users 
       SET hashed_password = $1, 
           temp_password_token = NULL,
           temp_password_expires_at = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [hashedPassword, userId]
    );
    
    res.json({ 
      success: true, 
      message: 'Password updated successfully' 
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});
```

---

## 📞 Contatti e Supporto

Per domande tecniche o chiarimenti sull'integrazione:

- **Team Delta Futuro**: [email di supporto]
- **Documentazione API**: https://delta-futuro-api.replit.app/docs
- **Repository Git**: [link repository condiviso]

---

## 📝 Checklist Implementazione

- [ ] Creare tabella `external_users` nel database condiviso
- [ ] Implementare endpoint `/auth/login`
- [ ] Implementare endpoint `/auth/change-password`
- [ ] Implementare middleware autenticazione JWT
- [ ] Implementare chiamate API a Delta Futuro per recupero attività
- [ ] Implementare UI primo accesso (cambio password obbligatorio)
- [ ] Implementare UI visualizzazione attività
- [ ] Implementare UI completamento attività
- [ ] Gestire caso operatore disattivato (401 Unauthorized)
- [ ] Implementare test automatici (login, recupero attività, completamento)
- [ ] Configurare monitoraggio errori e logging
- [ ] Deploy e test in ambiente staging
- [ ] Validazione end-to-end con dati reali
- [ ] Go-live e monitoraggio produzione

---

**Fine Documento**
