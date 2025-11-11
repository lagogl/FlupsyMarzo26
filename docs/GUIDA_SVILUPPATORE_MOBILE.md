# Guida Integrazione Operatori - App Mobile FLUPSY

**Destinatario:** Sviluppatore App Mobile FLUPSY  
**Data:** 11 Novembre 2025  
**Versione:** 1.0

---

## 📋 Panoramica

L'app mobile deve permettere agli operatori di:
1. **Login** con email e password
2. **Visualizzare** le attività assegnate loro da Delta Futuro
3. **Completare** le attività e aggiornare lo stato in tempo reale

## 🏗️ Architettura

```
┌──────────────────────────┐
│   DELTA FUTURO           │  ← Crea/gestisce operatori (Master)
│   (SandNursery App)      │
└───────────┬──────────────┘
            │
            │ PUSH automatico
            │ (quando crea/modifica operatore)
            │
            ▼
┌──────────────────────────┐
│   DATABASE CONDIVISO     │  ← Stesso DB di ordini/consegne
│   Tabella: external_users│
└───────────┬──────────────┘
            │
            │ QUERY (login)
            │
            ▼
┌──────────────────────────┐
│   APP MOBILE             │  ← Login + Gestione task
└──────────────────────────┘
```

### Regole Fondamentali

- ✅ **Delta Futuro** = unica fonte di verità per operatori (crea, modifica, disattiva)
- ✅ **Database Condiviso** = tabella `external_users` per autenticazione mobile
- ✅ **App Mobile** = legge operatori da `external_users`, gestisce login, chiama API Delta per task
- ❌ **App Mobile NON PUÒ** creare o modificare operatori (solo Delta Futuro)

---

## 🗄️ STEP 1: Creare Tabella `external_users`

**Importante:** Creare questa tabella nel vostro database condiviso (stesso database che contiene `ordini`, `consegne_condivise`).

```sql
CREATE TABLE external_users (
  -- Chiavi primarie
  id SERIAL PRIMARY KEY,
  delta_operator_id INTEGER UNIQUE NOT NULL,  -- ID operatore in Delta Futuro
  
  -- Autenticazione
  username VARCHAR(100) UNIQUE NOT NULL,      -- Email operatore
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
  sync_version INTEGER NOT NULL DEFAULT 1,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Indici per performance
CREATE INDEX idx_external_users_delta_operator ON external_users(delta_operator_id);
CREATE INDEX idx_external_users_email ON external_users(email);
CREATE INDEX idx_external_users_active ON external_users(is_active);
CREATE INDEX idx_external_users_username ON external_users(username);
```

---

## 👥 STEP 2: Operatori Esistenti da Sincronizzare

Questi sono gli operatori già esistenti che Delta Futuro sincronizzerà automaticamente nella tabella `external_users`:

| Nome | Email (Username) | Password Iniziale | Delta ID |
|------|------------------|-------------------|----------|
| Andrea | andrea@flupsy.local | test123 | 1 |
| Davide | davide@flupsy.local | pass456 | 2 |
| Mauro | mauro@flupsy.local | pwd789 | 3 |
| Gianluca | gianluca@flupsy.local | key012 | 4 |
| Diego | diego@flupsy.local | code345 | 5 |
| Ever | ever@flupsy.local | op006pwd | 6 |

**Nota:** Delta Futuro popolerà automaticamente la tabella `external_users` con questi dati quando verrà attivata la sincronizzazione.

---

## 🔐 STEP 3: Implementare Autenticazione

### 3.1 Endpoint Login (da implementare nella vostra app)

```
POST /auth/login
```

**Request:**
```json
{
  "username": "andrea@flupsy.local",
  "password": "test123"
}
```

**Logica Backend:**
```javascript
// 1. Query su external_users
const user = await db.query(
  'SELECT * FROM external_users WHERE username = $1 AND is_active = true',
  [username]
);

if (!user) {
  return { error: 'Credenziali non valide' };
}

// 2. Verifica password con bcrypt
const bcrypt = require('bcrypt');
const isValid = await bcrypt.compare(password, user.hashed_password);

if (!isValid) {
  return { error: 'Credenziali non valide' };
}

// 3. Se temp_password_token non è NULL → richiedi cambio password
const requiresPasswordChange = user.temp_password_token !== null;

// 4. Genera JWT
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  {
    userId: user.id,
    deltaOperatorId: user.delta_operator_id,  // IMPORTANTE per API calls
    username: user.username,
    role: user.role
  },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// 5. Risposta
return {
  token: token,
  user: {
    id: user.id,
    deltaOperatorId: user.delta_operator_id,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role
  },
  requiresPasswordChange: requiresPasswordChange
};
```

**Response 200 OK:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "deltaOperatorId": 1,
    "firstName": "Andrea",
    "lastName": "Contato",
    "role": "operatore"
  },
  "requiresPasswordChange": false
}
```

### 3.2 Cambio Password (primo accesso)

```
POST /auth/change-password
```

**Request:**
```json
{
  "userId": 123,
  "oldPassword": "test123",
  "newPassword": "MyNewSecurePassword!"
}
```

**Logica:**
```sql
UPDATE external_users 
SET hashed_password = $1,
    temp_password_token = NULL,
    temp_password_expires_at = NULL,
    updated_at = NOW()
WHERE id = $2;
```

---

## 📡 STEP 4: API Task Management (Delta Futuro)

**IMPORTANTE:** Per gestire i task, l'app mobile deve chiamare le API REST di Delta Futuro (NON accesso diretto al database).

### Base URL
```
https://[delta-futuro-domain].replit.app/api
```

### 4.1 Recupera Task Assegnati

```
GET /api/operators/:operatorId/tasks
```

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Parametri:**
- `operatorId`: Il `delta_operator_id` dall'autenticazione (es: 1, 2, 3...)
- `status` (opzionale): `pending`, `in_progress`, `completed`

**Esempio Request:**
```http
GET /api/operators/1/tasks
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response 200 OK:**
```json
{
  "tasks": [
    {
      "id": 4,
      "taskType": "pesatura",
      "description": "Fare pesature del flupsy 2",
      "priority": "urgent",
      "status": "pending",
      "dueDate": "2025-11-10",
      "notes": "anche note aggiuntive",
      "assignments": [
        {
          "id": 5,
          "operatorId": 1,
          "status": "assigned",
          "operatorFirstName": "Andrea",
          "operatorLastName": "Contato"
        }
      ],
      "baskets": []
    }
  ]
}
```

### 4.2 Visualizza Dettagli Cestelli del Task

```
GET /api/tasks/:taskId/baskets
```

**Response:**
```json
{
  "taskId": 4,
  "baskets": [
    {
      "basketId": 23,
      "physicalNumber": 3,
      "flupsyName": "FLUPSY 2",
      "role": "source"
    }
  ]
}
```

### 4.3 Avvia Task (status → in_progress)

```
PATCH /api/tasks/:taskId/assignments/:assignmentId
```

**Request:**
```json
{
  "status": "in_progress",
  "operatorId": 1
}
```

**Response:**
```json
{
  "success": true,
  "assignment": {
    "id": 5,
    "status": "in_progress",
    "startedAt": "2025-11-11T10:30:00Z"
  }
}
```

### 4.4 Completa Task (status → completed)

```
PATCH /api/tasks/:taskId/assignments/:assignmentId
```

**Request:**
```json
{
  "status": "completed",
  "operatorId": 1,
  "completionNotes": "Operazione completata regolarmente"
}
```

**Response:**
```json
{
  "success": true,
  "assignment": {
    "id": 5,
    "status": "completed",
    "completedAt": "2025-11-11T14:45:00Z"
  }
}
```

---

## ⚠️ Gestione Errori

### Operatore Disattivato

**Scenario:** Operatore loggato, ma viene disattivato da Delta Futuro durante la sessione.

**Comportamento:**
- Delta Futuro aggiorna `external_users.is_active = false`
- Al prossimo API call, l'app mobile riceve:

```json
{
  "error": "Account disabilitato",
  "message": "Il tuo account è stato disattivato. Contatta il supervisore."
}
```

**Implementazione:**
```javascript
// Middleware autenticazione
if (!user.is_active) {
  return res.status(401).json({
    error: 'Account disabilitato',
    message: 'Il tuo account è stato disattivato. Contatta il supervisore.'
  });
}
```

### Task già Completato

```json
{
  "error": "Task già completato",
  "completedAt": "2025-11-07T12:00:00Z"
}
```

### Operatore Non Autorizzato

```json
{
  "error": "Non autorizzato",
  "message": "Task assegnato a un altro operatore"
}
```

---

## 📊 Stati Task

| Stato | Descrizione | Transizioni Permesse |
|-------|-------------|---------------------|
| `pending` | Assegnato, non iniziato | → `in_progress`, `cancelled` |
| `in_progress` | In lavorazione | → `completed`, `cancelled` |
| `completed` | Completato | *(stato finale)* |
| `cancelled` | Annullato | *(stato finale)* |

---

## 🔗 Mapping ID Operatori

**Campo Chiave:** `deltaOperatorId`

- Quando l'operatore fa login, riceve nel JWT il campo `deltaOperatorId`
- Questo ID va usato per tutte le API calls verso Delta Futuro
- Esempio:
  ```
  Login → riceve deltaOperatorId = 1
  ↓
  GET /api/operators/1/tasks  ← usa questo ID
  ```

---

## 📚 Documentazione Completa

Per maggiori dettagli, consultare i documenti completi:

1. **`EXTERNAL_APP_OPERATORS_INTEGRATION.md`**
   - Schema SQL completo
   - Diagrammi di sequenza
   - Edge cases e gestione errori
   - Test cases

2. **`EXTERNAL_APP_API_INTEGRATION.md`**
   - API endpoints dettagliati
   - Esempi HTTP con curl
   - Error codes completi
   - Best practices

---

## ✅ Checklist Implementazione

- [ ] Creare tabella `external_users` nel database condiviso
- [ ] Implementare endpoint `POST /auth/login`
- [ ] Implementare endpoint `POST /auth/change-password`
- [ ] Configurare JWT con secret sicuro
- [ ] Implementare middleware autenticazione per verificare JWT
- [ ] Verificare connessione alle API Delta Futuro (test con Postman/curl)
- [ ] Implementare gestione errori (operatore disattivato, token scaduto, ecc.)
- [ ] Testing con operatori reali (Andrea, Davide, Mauro, ecc.)
- [ ] Implementare UI per cambio password al primo accesso

---

## 🆘 Supporto

Per domande o chiarimenti:
- Email: [inserire email di contatto]
- Riferimenti: Documenti tecnici completi nella cartella `/docs`

---

**Buon lavoro! 🚀**
