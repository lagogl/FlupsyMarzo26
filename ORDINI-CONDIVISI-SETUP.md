# 📦 SETUP MODULO ORDINI CONDIVISI - ARCHITETTURA SEMPLIFICATA

Questo documento spiega come configurare il sistema di ordini condivisi tra **Delta Futuro** e **App Esterna**.

---

## 🏗️ ARCHITETTURA

### Soluzione Implementata: Database Condiviso Diretto

```
┌─────────────────────┐
│  App Delta Futuro   │
│  (questa app)       │
│                     │
│  DATABASE_URL       │──→ Database locale Replit (FLUPSY, cestelli, operazioni)
│  DATABASE_URL_      │
│  ESTERNO           ─┼──┐
└─────────────────────┘  │
                         │
                         │  Connessione condivisa
                         │  (solo tabelle ordini)
                         ▼
              ┌──────────────────────┐
              │  Database App        │
              │  Esterna             │
              │  (PostgreSQL)        │
              │                      │
              │  • ordini            │
              │  • ordini_dettagli   │
              │  • consegne_condivise│
              └──────────────────────┘
                         ▲
                         │
┌─────────────────────┐  │
│  App Esterna        │  │
│                     │  │
│  DATABASE_URL      ─┼──┘
└─────────────────────┘
```

### ✅ Vantaggi

- **Nessun database intermedio** (massima semplicità)
- **Un solo database** per gli ordini
- **Entrambe le app** leggono/scrivono sullo stesso database
- **Calcolo residuo automatico** via SQL view

---

## 📋 ISTRUZIONI PER APP ESTERNA

L'altro sviluppatore deve:

### 1️⃣ Eseguire lo Script SQL

Eseguire il file `sql/setup-database-esterno.sql` sul **proprio database locale Replit** per creare:
- Tabelle `ordini`, `ordini_dettagli`, `consegne_condivise`
- Vista `ordini_con_residuo` (calcolo automatico residui)
- Indici per performance

### 2️⃣ Ottenere la Connection String

1. Aprire la sezione **Secrets** in Replit
2. Copiare il valore di `DATABASE_URL`
3. Inviarla a te (sviluppatore Delta Futuro)

**Formato connection string:**
```
postgresql://username:password@host.region.neon.tech:5432/database?sslmode=require
```

---

## 📋 ISTRUZIONI PER DELTA FUTURO (QUESTA APP)

### 1️⃣ Configurare il Secret

1. Ricevi la **connection string** dall'app esterna
2. Apri la sezione **Secrets** in Replit
3. Aggiorna il secret esistente:
   - **Key**: `DATABASE_URL_ESTERNO`
   - **Value**: Connection string ricevuta dall'app esterna

### 2️⃣ Riavvia l'App

Il modulo si attiverà automaticamente. Verifica nei log:
```
✅ Modulo ORDINI CONDIVISI registrato su /api/ordini-condivisi*
```

### 3️⃣ Test Connessione

Vai su `/ordini-condivisi` - dovresti vedere la pagina senza errori.

---

## 🔄 FLUSSO OPERATIVO

### Sincronizzazione Ordini da Fatture in Cloud

**Delta Futuro:**
1. Sincronizza ordini da FIC
2. Gli ordini vengono scritti:
   - ✅ Database locale (`DATABASE_URL`) per backward compatibility
   - ✅ Database app esterna (`DATABASE_URL_ESTERNO`) come fonte primaria

**App Esterna:**
1. Legge ordini dal proprio database (`DATABASE_URL`)
2. Vede automaticamente tutti gli ordini sincronizzati da Delta Futuro

### Gestione Consegne

**Scenario: Ordine da 100.000 animali**

1. **Ordine creato da FIC** (Delta Futuro)
   ```
   ordini.quantita_totale = 100000
   ordini.stato = "Aperto"
   ```

2. **Prima consegna** (Delta Futuro - 30.000)
   ```
   POST /api/ordini-condivisi/consegne
   { ordineId: 1, quantita: 30000 }
   
   → consegne_condivise: +1 record (app_origine: "delta_futuro")
   → Vista: residuo = 70000, stato = "Parziale"
   ```

3. **Seconda consegna** (App Esterna - 40.000)
   ```
   App Esterna inserisce consegna direttamente nel DB
   
   → consegne_condivise: +1 record (app_origine: "app_esterna")
   → Vista: residuo = 30000, stato = "Parziale"
   ```

4. **Ultima consegna** (Delta Futuro - 30.000)
   ```
   POST /api/ordini-condivisi/consegne
   { ordineId: 1, quantita: 30000 }
   
   → Vista: residuo = 0, stato = "Completato"
   → ordini.stato aggiornato a "Completato"
   ```

---

## 📊 API ENDPOINTS DISPONIBILI

### Ordini

```http
GET /api/ordini-condivisi
Recupera ordini con residuo calcolato
Query params: ?stato=Aperto&dataInizio=2025-11-01

GET /api/ordini-condivisi/:id
Dettaglio ordine con righe e consegne

PATCH /api/ordini-condivisi/:id/delivery-range
Aggiorna range consegna
Body: { dataInizioConsegna, dataFineConsegna }
```

### Consegne

```http
GET /api/ordini-condivisi/consegne
Lista consegne (opzionalmente filtrate)
Query params: ?ordineId=123&appOrigine=delta_futuro

POST /api/ordini-condivisi/consegne
Crea consegna parziale
Body: {
  ordineId: 1,
  dataConsegna: "2025-11-05",
  quantita: 30000,
  note: "Prima consegna"
}

DELETE /api/ordini-condivisi/consegne/:id
Elimina consegna
```

---

## 🎨 INTERFACCIA UI

### Pagina Ordini Condivisi (`/ordini-condivisi`)

Funzionalità:
- ✅ Visualizza tutti gli ordini con residuo
- ✅ Filtro per stato (Aperto, Parziale, Completato)
- ✅ Tabella consegne con app di origine
- ✅ Creazione consegne parziali
- ✅ Eliminazione consegne
- ✅ Validazione quantità (non supera il residuo)
- ✅ Aggiornamento automatico stato ordine

---

## 🧪 TEST API

### Test 1: Verifica connessione
```bash
curl https://YOUR_REPLIT_URL/api/ordini-condivisi
```

Risposta attesa:
```json
{
  "success": true,
  "ordini": [],
  "count": 0
}
```

### Test 2: Crea consegna
```bash
curl -X POST https://YOUR_REPLIT_URL/api/ordini-condivisi/consegne \
  -H "Content-Type: application/json" \
  -d '{
    "ordineId": 1,
    "dataConsegna": "2025-11-05",
    "quantita": 30000,
    "note": "Test consegna Delta Futuro"
  }'
```

### Test 3: Verifica residuo
```bash
curl https://YOUR_REPLIT_URL/api/ordini-condivisi/1
```

---

## ⚠️ TROUBLESHOOTING

### ❌ "Database esterno non configurato"

**Causa:** Secret `DATABASE_URL_ESTERNO` non impostato

**Soluzione:**
1. Verifica che il secret esista in Replit Secrets
2. Riavvia l'applicazione

### ❌ "Quantità superiore al residuo disponibile"

**Causa:** Tentativo di consegnare più del residuo

**Soluzione:**
Controlla il residuo disponibile:
```bash
GET /api/ordini-condivisi/:ordineId
```

### ❌ "Relation 'ordini' does not exist"

**Causa:** Script SQL non eseguito sul database app esterna

**Soluzione:**
L'altro sviluppatore deve eseguire `sql/setup-database-esterno.sql`

---

## 🔒 SICUREZZA

### Best Practices

✅ **MAI hardcodare credenziali** nel codice
✅ **Usa sempre Secrets** per connection strings
✅ **Condividi credenziali** solo via canali sicuri (non email/chat)
✅ **Ruota credenziali** se sospetti esposizione

### Gestione Credenziali

- Connection string contiene password → Trattala come segreto
- Non committarla mai su Git
- Non inviarla su canali non sicuri
- Usa Replit Secrets per storage sicuro

---

## 📝 CHECKLIST SETUP

### App Esterna
- [ ] Eseguito `sql/setup-database-esterno.sql` sul database locale
- [ ] Copiato valore di `DATABASE_URL` dai Secrets
- [ ] Inviato connection string a Delta Futuro in modo sicuro

### Delta Futuro (questa app)
- [x] Ricevuto connection string dall'app esterna
- [x] Configurato secret `DATABASE_URL_ESTERNO`
- [x] Verificato attivazione modulo nei log
- [ ] Testato pagina `/ordini-condivisi`
- [ ] Sincronizzato ordini da FIC
- [ ] Creato consegna di test

---

## 🆘 SUPPORTO

In caso di problemi:

1. **Controlla i log del server** (tab Console in Replit)
2. **Verifica connessione database** esterno
3. **Testa API** con curl/Postman
4. **Controlla Secrets** - `DATABASE_URL_ESTERNO` configurato?

---

**Ultima modifica:** 31 Ottobre 2025 - Architettura semplificata (database condiviso diretto)
