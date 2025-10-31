# 📦 SETUP MODULO ORDINI CONDIVISI

Questo documento spiega come configurare il sistema di ordini condivisi tra Delta Futuro e l'app esterna.

---

## 🎯 OBIETTIVO

Sincronizzare ordini da Fatture in Cloud verso un database condiviso e gestire consegne parziali provenienti da due applicazioni diverse (Delta Futuro + app esterna).

---

## ✅ TASK 1: PREPARAZIONE DATABASE ESTERNO

### 1.1 Accedi al database Neon esterno

Usa un client PostgreSQL (pgAdmin, DBeaver, o psql) con questa connessione:

```
Host: ep-snowy-firefly-a4pq2urr.us-east-1.aws.neon.tech
Database: neondb
Username: neondb_owner
Password: npg_Kh6xVrekoFn7
Port: 5432
SSL Mode: require
```

**Oppure usa la stringa completa:**
```
postgresql://neondb_owner:npg_Kh6xVrekoFn7@ep-snowy-firefly-a4pq2urr.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 1.2 Esegui lo script SQL di setup

1. Apri il file `sql/setup-database-esterno.sql`
2. Copia tutto il contenuto
3. Eseguilo sul database Neon

**Cosa fa lo script:**
- ✅ Aggiunge colonne `data_inizio_consegna`, `data_fine_consegna` a `ordini`
- ✅ Aggiunge colonne `quantita_totale`, `taglia_richiesta` a `ordini`
- ✅ Aggiunge colonne per sincronizzazione FIC
- ✅ Modifica/crea tabella `ordini_dettagli` (righe ordini)
- ✅ Crea tabella `consegne_condivise` (consegne parziali)
- ✅ Crea vista `ordini_con_residuo` (calcolo automatico residuo)
- ✅ Aggiunge indici per performance

### 1.3 Verifica esecuzione

Alla fine dello script vedrai un messaggio del tipo:

```
✅ Setup completato!
totale_ordini | totale_dettagli | totale_consegne
     10       |       15        |       0
```

---

## ✅ TASK 2: CONFIGURAZIONE CREDENZIALE

### 2.1 Variabile già configurata

La variabile `DATABASE_URL_ESTERNO` è **già configurata** nei Secrets con il valore:

```
postgresql://neondb_owner:npg_Kh6xVrekoFn7@ep-snowy-firefly-a4pq2urr.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 2.2 Verifica configurazione

Il modulo ordini condivisi è già attivo. Controlla i log del server:

```
✅ Modulo ORDINI CONDIVISI registrato su /api/ordini-condivisi*
```

---

## ✅ TASK 3: MODIFICA SINCRONIZZAZIONE FIC

### 3.1 Prossimo step

Modificare il controller Fatture in Cloud (`server/controllers/fatture-in-cloud-controller.ts`) per sincronizzare ordini verso il database esterno invece che locale.

**Cosa verrà modificato:**
- Endpoint `/api/fatture-in-cloud/orders/sync` scriverà su DB esterno
- Gli ordini saranno visibili sia in Delta Futuro che nell'app esterna
- Calcolo residuo automatico in real-time

---

## 📊 API ENDPOINTS DISPONIBILI

### Ordini

```
GET    /api/ordini-condivisi
       Recupera tutti gli ordini con residuo calcolato
       Query params: ?stato=Aperto&clienteId=123

GET    /api/ordini-condivisi/:id
       Dettaglio ordine con righe e consegne

PATCH  /api/ordini-condivisi/:id/delivery-range
       Aggiorna range consegna
       Body: { dataInizioConsegna, dataFineConsegna }
```

### Consegne

```
GET    /api/ordini-condivisi/consegne
       Lista consegne (opzionalmente filtrate)
       Query params: ?ordineId=123&appOrigine=delta_futuro

POST   /api/ordini-condivisi/consegne
       Crea nuova consegna parziale
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

## 🔄 FLUSSO OPERATIVO

### Scenario: Ordine da 100.000 animali

1. **Sincronizzazione FIC** (Delta Futuro)
   ```
   Ordine #100 creato in FIC
   ↓
   Sync FIC → scrive su DB esterno
   ↓
   ordini.quantita_totale = 100000
   ordini.stato = "Aperto"
   ```

2. **Prima consegna** (Delta Futuro - 30.000 animali)
   ```
   POST /api/ordini-condivisi/consegne
   { ordineId: 100, quantita: 30000, ... }
   ↓
   consegne_condivise: +1 record (app_origine: "delta_futuro")
   ↓
   Vista ordini_con_residuo:
   - quantita_consegnata = 30000
   - quantita_residua = 70000
   - stato_calcolato = "Parziale"
   ```

3. **Seconda consegna** (App Esterna - 20.000 animali)
   ```
   App Esterna → POST /api/consegne (su DB esterno)
   ↓
   consegne_condivise: +1 record (app_origine: "app_esterna")
   ↓
   Vista ordini_con_residuo:
   - quantita_consegnata = 50000
   - quantita_residua = 50000
   - stato_calcolato = "Parziale"
   ```

4. **Consegna finale** (Delta Futuro - 50.000 animali)
   ```
   POST /api/ordini-condivisi/consegne
   { ordineId: 100, quantita: 50000, ... }
   ↓
   Vista ordini_con_residuo:
   - quantita_consegnata = 100000
   - quantita_residua = 0
   - stato_calcolato = "Completato"
   ↓
   ordini.stato aggiornato a "Completato"
   ```

---

## 🧪 TEST API

### Test 1: Recupera ordini

```bash
curl http://localhost:5000/api/ordini-condivisi
```

### Test 2: Crea consegna

```bash
curl -X POST http://localhost:5000/api/ordini-condivisi/consegne \
  -H "Content-Type: application/json" \
  -d '{
    "ordineId": 1,
    "dataConsegna": "2025-11-05",
    "quantita": 30000,
    "note": "Test consegna"
  }'
```

### Test 3: Verifica residuo

```bash
curl http://localhost:5000/api/ordini-condivisi/1
```

---

## ⚠️ TROUBLESHOOTING

### Errore: "Database esterno non configurato"

**Soluzione:**
Verifica che `DATABASE_URL_ESTERNO` sia configurato nei Secrets.

### Errore: "Quantità superiore al residuo disponibile"

**Soluzione:**
Controlla il residuo disponibile prima di creare la consegna:
```bash
curl http://localhost:5000/api/ordini-condivisi/ORDINE_ID
```

### Errore: tabella "consegne_condivise" non esiste

**Soluzione:**
Esegui lo script SQL `sql/setup-database-esterno.sql` sul database Neon esterno.

---

## 📝 PROSSIMI PASSI

1. ✅ Setup database esterno (esegui script SQL)
2. ⏳ Modifica controller FIC per sync su DB esterno
3. ⏳ Crea UI per gestire consegne condivise
4. ⏳ Test end-to-end con app esterna

---

## 🆘 SUPPORTO

Per domande o problemi:
1. Controlla i log del server: visualizza tab "Console"
2. Verifica connessione DB esterno
3. Testa API con curl/Postman

---

**Ultima modifica:** 31 Ottobre 2025
