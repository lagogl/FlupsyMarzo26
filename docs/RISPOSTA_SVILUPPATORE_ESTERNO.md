# 📨 Risposta alle Domande dello Sviluppatore Esterno

**Data:** 10 Novembre 2025  
**Destinatario:** Sviluppatore App Esterna FLUPSY

---

## ❌ Domanda 1: Credenziali Database Delta Futuro

> "Hai le credenziali del database Delta Futuro (DELTA_FUTURO_DB_URL)?"

### Risposta: NO - L'app esterna NON ha accesso diretto al database Delta Futuro

**Importante:** Per motivi di **sicurezza e controllo**, l'app esterna **NON accede direttamente** al database di Delta Futuro.

### ✅ Accesso Corretto: API REST

L'app esterna accede ai dati tramite **API REST** documentate in:
- **File:** `docs/EXTERNAL_APP_API_INTEGRATION.md`

### Endpoint Disponibili

```
Base URL (Production): https://your-project.replit.app/api
Base URL (Development): http://localhost:5000/api
```

#### 1. Recupera Task per Operatore
```http
GET /api/operators/:operatorId/tasks
```

#### 2. Visualizza Ceste di un Task
```http
GET /api/tasks/:taskId/baskets
```

#### 3. Aggiorna Stato Task (Inizia/Completa)
```http
PATCH /api/tasks/:taskId/assignments/:assignmentId
```

**Vantaggi di questo approccio:**
- ✅ Delta Futuro controlla gli accessi
- ✅ Validazione dati server-side
- ✅ Tracciabilità completa delle operazioni
- ✅ Nessun rischio di corruzione dati

---

## ✅ Domanda 2: Mapping Operatori

> "Come funziona il mapping operatori (delta_operator_id → task_operators.id)?"

### Risposta: Sistema a Due Database

```
┌─────────────────────────────────────────────┐
│   DATABASE DELTA FUTURO                     │
│   (Delta non fornisce accesso diretto)      │
│                                             │
│   Tabella: task_operators                  │
│   ├─ id: 123                                │
│   ├─ first_name: "Mario"                    │
│   ├─ last_name: "Rossi"                     │
│   └─ externalAppUserId: 456                 │
└──────────────┬──────────────────────────────┘
               │
               │ Sincronizzazione PUSH
               │ (Delta → Esterno)
               ▼
┌─────────────────────────────────────────────┐
│   DATABASE CONDIVISO (vostro database)      │
│   (Stesso dove avete ordini, consegne)      │
│                                             │
│   Tabella: external_users                  │
│   ├─ id: 456 (PK locale)                    │
│   ├─ delta_operator_id: 123 ◄───────────── Riferimento a task_operators.id
│   ├─ username: "mario.rossi@example.com"    │
│   ├─ hashed_password: "$2b$10$..."         │
│   ├─ first_name: "Mario"                    │
│   ├─ last_name: "Rossi"                     │
│   └─ is_active: true                        │
└─────────────────────────────────────────────┘
```

### Schema Mapping

| Campo | Delta Futuro DB | Database Condiviso | Descrizione |
|-------|-----------------|-------------------|-------------|
| **ID Operatore Delta** | `task_operators.id` = **123** | `external_users.delta_operator_id` = **123** | ID principale dell'operatore nel sistema Delta |
| **ID Locale App Esterna** | `task_operators.externalAppUserId` = **456** | `external_users.id` = **456** | ID locale nel vostro database |

### Flusso Operativo Completo

#### 1️⃣ Login Operatore (App Esterna)

```javascript
// App Esterna - Login
POST /auth/login
{
  "username": "mario.rossi@example.com",
  "password": "SecurePass123"
}

// Query nel VOSTRO database
SELECT * FROM external_users 
WHERE username = 'mario.rossi@example.com'
AND is_active = true;

// Risultato
{
  "id": 456,                    // ID locale app esterna
  "delta_operator_id": 123,     // ← ID da usare nelle API Delta
  "username": "mario.rossi@example.com",
  "first_name": "Mario",
  "last_name": "Rossi"
}

// JWT generato dall'app esterna
{
  "userId": 456,              // ID locale
  "deltaOperatorId": 123,     // ← DA USARE nelle chiamate API
  "username": "mario.rossi@example.com",
  "role": "operatore"
}
```

#### 2️⃣ Chiamata API Delta Futuro

```javascript
// L'app esterna usa il deltaOperatorId dal JWT
const { deltaOperatorId } = decodedJWT;

// Chiamata API a Delta Futuro
GET /api/operators/123/tasks

// ← Usa delta_operator_id (123), NON l'ID locale (456)
```

#### 3️⃣ Aggiornamento Stato Task

```javascript
// L'operatore completa un task
PATCH /api/tasks/42/assignments/789
{
  "status": "completed",
  "operatorId": 123,  // ← delta_operator_id (non 456!)
  "completionNotes": "Completato con successo"
}
```

---

## 📋 Tabella `external_users` - Schema Completo

**IMPORTANTE:** Dovete creare questa tabella nel vostro database condiviso (stesso dove avete `ordini`, `consegne_condivise`).

```sql
CREATE TABLE external_users (
  -- Chiavi
  id SERIAL PRIMARY KEY,
  delta_operator_id INTEGER UNIQUE NOT NULL,  -- FK virtuale a task_operators.id
  
  -- Autenticazione
  username VARCHAR(100) UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  temp_password_token VARCHAR(255),           -- Password temporanea primo accesso
  temp_password_expires_at TIMESTAMP,
  
  -- Dati anagrafici (mirror da Delta Futuro)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  
  -- Stato
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_sync_at TIMESTAMP NOT NULL DEFAULT NOW(),
  sync_version INTEGER NOT NULL DEFAULT 1,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Indici per performance
CREATE INDEX idx_external_users_delta_operator ON external_users(delta_operator_id);
CREATE INDEX idx_external_users_username ON external_users(username);
CREATE INDEX idx_external_users_active ON external_users(is_active);
```

---

## 🔄 Come Vengono Popolati gli Operatori

### Sincronizzazione Automatica (Push da Delta Futuro)

Quando un responsabile crea un operatore in Delta Futuro:

```
1. Delta Futuro → INSERT INTO task_operators (id=123, first_name="Mario", ...)
2. Delta Futuro → Genera password temporanea "Mario.2025"
3. Delta Futuro → PUSH verso database condiviso
   INSERT INTO external_users (
     delta_operator_id = 123,
     username = "mario.rossi@example.com",
     hashed_password = "$2b$10$...",
     first_name = "Mario",
     last_name = "Rossi",
     is_active = true
   )
4. Delta Futuro → Invia email a Mario con credenziali temporanee
5. Mario → Login in app esterna con password temporanea
6. App Esterna → Richiede cambio password obbligatorio
7. Mario → Imposta nuova password
8. App Esterna → UPDATE external_users SET hashed_password = ...
```

**Documentazione completa:** `docs/EXTERNAL_APP_OPERATORS_INTEGRATION.md`

---

## 🎯 Riepilogo Chiave

### ❌ COSA NON FARE
- ❌ Accedere direttamente al database Delta Futuro
- ❌ Creare/modificare operatori manualmente
- ❌ Usare `external_users.id` nelle chiamate API a Delta Futuro

### ✅ COSA FARE
- ✅ Autenticazione operatori su `external_users` (vostro database)
- ✅ Usare `delta_operator_id` nelle chiamate API REST a Delta Futuro
- ✅ Salvare `delta_operator_id` nel JWT dopo login
- ✅ Implementare refresh automatico dei task ogni X secondi

---

## 📚 Documentazione Completa

1. **API REST Tasks:**  
   `docs/EXTERNAL_APP_API_INTEGRATION.md`  
   → Tutti gli endpoint per task management

2. **Sincronizzazione Operatori:**  
   `docs/EXTERNAL_APP_OPERATORS_INTEGRATION.md`  
   → Schema `external_users`, flussi autenticazione, edge cases

3. **Esempi Codice:**  
   Entrambi i documenti contengono esempi JavaScript/React Native completi

---

## 📞 Supporto

Per domande tecniche:
1. Consulta prima la documentazione API
2. Verifica esempi codice nei doc
3. Testa endpoint con Postman/Insomnia

---

**Fine Documento** ✅

