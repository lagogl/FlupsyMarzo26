# Documento di Integrazione — Sistema Contabilità Esterno
## Alternativa a Fatture in Cloud per DDT e Ordini Condivisi

**Destinatario**: Sviluppatore del sistema di contabilità esterno  
**Data**: Febbraio 2026  
**Versione**: 1.0  
**Applicazione di riferimento**: FLUPSY Management System (Delta Futuro)

---

## INDICE

1. [Panoramica dell'architettura](#1-panoramica-dellarchitettura)
2. [Autenticazione e sicurezza](#2-autenticazione-e-sicurezza)
3. [Modulo DDT — Struttura dati](#3-modulo-ddt--struttura-dati)
4. [Modulo DDT — API che devi esporre](#4-modulo-ddt--api-che-devi-esporre)
5. [Modulo DDT — Flusso operativo completo](#5-modulo-ddt--flusso-operativo-completo)
6. [Modulo Ordini Condivisi — Architettura](#6-modulo-ordini-condivisi--architettura)
7. [Modulo Ordini Condivisi — Schema database](#7-modulo-ordini-condivisi--schema-database)
8. [Modulo Ordini Condivisi — Logica e trigger](#8-modulo-ordini-condivisi--logica-e-trigger)
9. [Notifica aggiornamento cache](#9-notifica-aggiornamento-cache)
10. [Tipi di dati e codifiche](#10-tipi-di-dati-e-codifiche)
11. [Scenari di errore e gestione](#11-scenari-di-errore-e-gestione)

---

## 1. Panoramica dell'architettura

Il FLUPSY Management System gestisce due moduli che interagiscono con un sistema esterno di contabilità:

### 1a. Modulo DDT (Documento di Trasporto)
Il sistema genera internamente il DDT con tutti i dati. Poi lo "invia" al sistema di contabilità esterno per:
- Registrazione ufficiale del documento nel gestionale fiscale
- Numerazione coordinata (evitare duplicati di numero)
- Recupero URL del PDF fiscale (opzionale)

**L'integrazione è push**: è FLUPSY che chiama le API del tuo sistema, non viceversa.

### 1b. Modulo Ordini Condivisi
I due sistemi (FLUPSY e il tuo gestionale) condividono lo **stesso database PostgreSQL**. Non si tratta di API, ma di accesso diretto alle stesse tabelle. Entrambe le applicazioni leggono e scrivono sulle stesse righe.

**Schema generale**:
```
[FLUPSY App]  ──────────────────────────────────────────────────────
                    │  push DDT via HTTP API                │
                    ▼                                       │ DB condiviso
              [TUO SISTEMA]                         [PostgreSQL esterno]
              espone endpoint REST                  ordini / consegne
```

---

## 2. Autenticazione e sicurezza

### 2a. API DDT (il tuo server espone queste API)
FLUPSY chiamerà le tue API usando un **Bearer Token** oppure una **API Key** nell'header.

Attualmente il sistema è configurato per Fatture in Cloud con OAuth2. Per la tua integrazione, potete concordare uno dei seguenti schemi più semplici:

**Schema consigliato — API Key fissa**:
```
Header: Authorization: Bearer <TUA_API_KEY>
oppure
Header: X-Api-Key: <TUA_API_KEY>
```

La chiave verrà salvata come variabile d'ambiente su FLUPSY e non sarà mai esposta al frontend.

### 2b. Endpoint notifica cache (FLUPSY espone questo)
Dopo che il tuo sistema scrive nel DB condiviso, deve notificare FLUPSY per invalidare la cache:

```
POST https://<dominio-flupsy>/api/external/notify-update
Header: x-api-key: <EXTERNAL_NOTIFY_API_KEY>
Body: { "reason": "ordini_update" }
```

Questa chiave ti verrà comunicata separatamente.

---

## 3. Modulo DDT — Struttura dati

### 3a. Struttura DDT master (quello che FLUPSY ti invierà)

```json
{
  "numero": 42,
  "data": "2026-02-25",
  
  "mittente": {
    "ragioneSociale": "Delta Futuro S.r.l.",
    "indirizzo": "Via Esempio 1",
    "cap": "30100",
    "citta": "Venezia",
    "provincia": "VE",
    "partitaIva": "12345678901",
    "codiceFiscale": "12345678901",
    "telefono": "041-xxxxxxx",
    "email": "info@deltafuturo.it"
  },
  
  "destinatario": {
    "id": 15,
    "denominazione": "Pescheria Rossi S.r.l.",
    "indirizzo": "Via Mare 10",
    "citta": "Chioggia",
    "cap": "30015",
    "provincia": "VE",
    "paese": "Italia",
    "piva": "98765432100",
    "codiceFiscale": "98765432100"
  },
  
  "trasporto": {
    "totaleColli": 5,
    "pesoTotale": 125.50
  },
  
  "note": "Trasporto a cura del mittente",
  
  "righe": [
    {
      "descrizione": "Sacco #1 - Cestelli: 102 | 50.000 animali",
      "quantita": 50000,
      "unitaMisura": "NR",
      "prezzoUnitario": 0,
      "sizeCode": "TP-3000",
      "flupsyName": "Flupsy Nord"
    },
    {
      "descrizione": "SUBTOTALE TP-3000",
      "quantita": 50000,
      "unitaMisura": "NR",
      "prezzoUnitario": 0,
      "sizeCode": "TP-3000",
      "isSottotitolo": true
    },
    {
      "descrizione": "Sacco #2 - Cestelli: 80 | 30.000 animali",
      "quantita": 30000,
      "unitaMisura": "NR",
      "prezzoUnitario": 0,
      "sizeCode": "TP-10",
      "flupsyName": "Flupsy Sud"
    },
    {
      "descrizione": "SUBTOTALE TP-10",
      "quantita": 30000,
      "unitaMisura": "NR",
      "prezzoUnitario": 0,
      "sizeCode": "TP-10",
      "isSottotitolo": true
    }
  ]
}
```

**Nota critica sulle righe**: Le righe sono raggruppate per `sizeCode`. Per ogni gruppo c'è sempre una riga di SUBTOTALE finale con `isSottotitolo: true`. Il tuo sistema può usarla per totalizzare per taglia o ignorarla.

### 3b. Struttura cliente (usata per la rubrica)

```json
{
  "id_interno": 15,
  "denominazione": "Pescheria Rossi S.r.l.",
  "indirizzo": "Via Mare 10",
  "comune": "Chioggia",
  "cap": "30015",
  "provincia": "VE",
  "paese": "Italia",
  "piva": "98765432100",
  "codiceFiscale": "98765432100",
  "email": "ordini@pescheria-rossi.it",
  "telefono": "041-xxxxxxx"
}
```

---

## 4. Modulo DDT — API che devi esporre

Il tuo sistema deve esporre le seguenti API REST. FLUPSY le chiamerà con l'API Key concordata.

### 4a. `GET /api/ddt/prossimo-numero`
Restituisce il prossimo numero DDT disponibile nel tuo sistema.

**Request**:
```
GET /api/ddt/prossimo-numero
Authorization: Bearer <API_KEY>
```

**Response** `200 OK`:
```json
{
  "prossimo_numero": 143
}
```

**Perché serve**: FLUPSY lo chiama prima di generare il DDT locale, per assicurarsi che il numero sia unico tra entrambi i sistemi. Il numero viene poi usato sia nel DDT locale FLUPSY sia in quello che invierà al tuo sistema.

---

### 4b. `POST /api/ddt`
Crea un nuovo DDT nel tuo sistema (equivalente a "inviare" il documento).

**Request**:
```
POST /api/ddt
Authorization: Bearer <API_KEY>
Content-Type: application/json
Body: <struttura descritta in §3a>
```

**Response** `201 Created`:
```json
{
  "id": 9901,
  "numero": 42,
  "data": "2026-02-25",
  "url_pdf": "https://tuosistema.it/ddt/9901/pdf",
  "stato": "registrato"
}
```

Campo `id`: il tuo ID interno — FLUPSY lo salverà come `fatture_in_cloud_id` (nome legacy rimasto dal vecchio sistema FIC) per futuri riferimenti.

Campo `url_pdf`: opzionale, ma se presente verrà mostrato nell'interfaccia FLUPSY per apertura diretta del documento.

**Response errore** `409 Conflict` (numero già usato):
```json
{
  "error": "numero_duplicato",
  "message": "Il numero DDT 42 è già registrato",
  "prossimo_disponibile": 43
}
```

---

### 4c. `GET /api/ddt/:id`
Recupera un DDT specifico (usato da FLUPSY per verifiche).

**Response** `200 OK`:
```json
{
  "id": 9901,
  "numero": 42,
  "data": "2026-02-25",
  "stato": "registrato",
  "url_pdf": "https://tuosistema.it/ddt/9901/pdf"
}
```

---

### 4d. `DELETE /api/ddt/:id`
Annulla/elimina un DDT (usato quando l'utente storna la vendita su FLUPSY).

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "DDT 9901 annullato"
}
```

> **Nota**: se il tuo sistema non permette la cancellazione (per motivi fiscali) ma solo l'annullamento, va benissimo — basta restituire `200` e segnare il documento come annullato internamente.

---

### 4e. `GET /api/clienti` (opzionale ma consigliato)
Lista clienti per sincronizzazione bidirezionale.

**Response** `200 OK`:
```json
{
  "clienti": [
    {
      "id": 201,
      "denominazione": "Pescheria Rossi S.r.l.",
      "piva": "98765432100",
      "email": "ordini@pescheria-rossi.it"
    }
  ]
}
```

FLUPSY usa la P.IVA come chiave di lookup per trovare il cliente corrispondente nel tuo sistema e salvarne l'ID.

---

### 4f. `POST /api/clienti` (opzionale ma consigliato)
Crea un nuovo cliente nel tuo sistema partendo dalla rubrica FLUPSY.

**Request Body**:
```json
{
  "denominazione": "Nuova Pescheria S.r.l.",
  "piva": "11111111111",
  "indirizzo": "Via Nuova 5",
  "comune": "Venezia",
  "cap": "30100",
  "provincia": "VE",
  "paese": "Italia",
  "email": "info@nuovapescheria.it",
  "telefono": "041-000000"
}
```

**Response** `201 Created`:
```json
{
  "id": 305,
  "denominazione": "Nuova Pescheria S.r.l."
}
```

---

## 5. Modulo DDT — Flusso operativo completo

Questo è l'esatto flusso che FLUPSY segue quando l'utente clicca "Invia DDT":

```
1. FLUPSY → TUO SISTEMA: GET /api/ddt/prossimo-numero
   └─ riceve: { prossimo_numero: 143 }

2. FLUPSY: crea DDT locale nel proprio DB con numero=143, stato="locale"

3. Utente conferma invio

4. FLUPSY → TUO SISTEMA: POST /api/ddt  (con tutti i dati)
   └─ riceve: { id: 9901, url_pdf: "...", stato: "registrato" }

5. FLUPSY: aggiorna DDT locale
   - stato → "inviato"
   - salva id esterno (9901) come riferimento
   - salva url_pdf se presente

6. FLUPSY: invia email di conferma con PDF allegato
   (FLUPSY genera autonomamente il PDF — non dipende dal tuo)
```

**Stato DDT in FLUPSY** (tre stati immutabili):
| Stato | Significato | Azioni permesse |
|-------|-------------|-----------------|
| `nessuno` | Vendita confermata, nessun DDT | Genera DDT |
| `locale` | DDT creato solo in FLUPSY | Invia al gestionale, elimina |
| `inviato` | DDT sincronizzato col gestionale | Nessuna modifica (blocco) |

---

## 6. Modulo Ordini Condivisi — Architettura

### Architettura: database condiviso (Scenario B)

Non si tratta di un'integrazione via API. Entrambi i sistemi accedono direttamente allo **stesso database PostgreSQL**.

```
[FLUPSY App]  ─────┐
                   │  connessione diretta PostgreSQL
                   ▼
           [DATABASE ESTERNO PostgreSQL]
           ├── tabella: ordini
           ├── tabella: ordini_dettagli
           └── tabella: consegne_condivise
                   ▲
                   │  connessione diretta PostgreSQL
[TUO SISTEMA] ─────┘
```

FLUPSY si connette tramite la variabile d'ambiente `DATABASE_URL_ESTERNO` (connection string PostgreSQL standard).

### Cosa deve fornire il tuo sistema:
1. Un **database PostgreSQL accessibile da internet** (o via VPN/tunnel)
2. Le tre tabelle con lo schema esatto descritto al §7
3. Il trigger PostgreSQL descritto al §8
4. Una **connection string** da condividere con Delta Futuro:
   ```
   postgresql://utente:password@host:5432/nomedb
   ```

---

## 7. Modulo Ordini Condivisi — Schema database

### Tabella `ordini`

```sql
CREATE TABLE ordini (
  id                      SERIAL PRIMARY KEY,
  numero                  INTEGER,
  data                    DATE NOT NULL,
  cliente_id              INTEGER NOT NULL,
  cliente_nome            TEXT,
  stato                   TEXT NOT NULL DEFAULT 'Aperto',
  -- stati: 'Aperto' | 'In Lavorazione' | 'Parziale' | 'Completato' | 'Annullato'
  
  quantita                INTEGER NOT NULL DEFAULT 0,   -- animali totali ordine
  quantita_totale         INTEGER DEFAULT 0,
  taglia_richiesta        TEXT NOT NULL DEFAULT '',     -- es: 'TP-3000', 'TP-10'
  
  -- Range consegna
  data_consegna           DATE,                         -- deprecated, compatibilità
  data_inizio_consegna    DATE,
  data_fine_consegna      DATE,
  
  -- Sincronizzazione con gestionale esterno
  fatture_in_cloud_id     INTEGER UNIQUE,               -- usato per link col gestionale
  fatture_in_cloud_numero VARCHAR(50),
  company_id              INTEGER,
  sync_status             VARCHAR(20) DEFAULT 'locale', -- 'locale' | 'sincronizzato' | 'errore'
  last_sync_at            TIMESTAMP,
  sync_error              TEXT,
  url_documento           TEXT,
  
  -- Totali
  totale                  NUMERIC(10,2) DEFAULT 0,
  valuta                  TEXT DEFAULT 'EUR',
  note                    TEXT,
  cancellato              BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at              TIMESTAMP DEFAULT NOW(),
  updated_at              TIMESTAMP
);
```

### Tabella `ordini_dettagli`

```sql
CREATE TABLE ordini_dettagli (
  id              SERIAL PRIMARY KEY,
  ordine_id       INTEGER NOT NULL REFERENCES ordini(id) ON DELETE CASCADE,
  riga_numero     INTEGER NOT NULL DEFAULT 1,
  
  codice_prodotto VARCHAR(100),
  taglia          VARCHAR(50) NOT NULL DEFAULT '',   -- es: 'TP-3000'
  descrizione     TEXT,
  
  quantita        NUMERIC(10,2) NOT NULL,
  unita_misura    TEXT DEFAULT 'NR',
  prezzo_unitario NUMERIC(10,4) NOT NULL DEFAULT 0,
  sconto          NUMERIC(10,2) DEFAULT 0,
  importo_riga    NUMERIC(10,2) DEFAULT 0,
  
  fic_item_id     INTEGER,                          -- ID riga nel gestionale esterno
  
  created_at      TIMESTAMP DEFAULT NOW()
);
```

### Tabella `consegne_condivise`

Questa è la tabella centrale per il coordinamento consegne tra le due app.

```sql
CREATE TABLE consegne_condivise (
  id                  SERIAL PRIMARY KEY,
  ordine_id           INTEGER NOT NULL REFERENCES ordini(id) ON DELETE RESTRICT,
  data_consegna       DATE NOT NULL,
  quantita_consegnata INTEGER NOT NULL,             -- animali consegnati in questo batch
  app_origine         VARCHAR(50) NOT NULL,         -- 'delta_futuro' | 'app_esterna'
  note                TEXT,
  created_at          TIMESTAMP DEFAULT NOW()
);
```

**Campo `app_origine`**: identifica CHI ha registrato la consegna. Questo permette ad entrambe le app di vedere l'intera storia delle consegne sapendo la provenienza di ciascuna.

---

### Vista `ordini_con_residuo` (obbligatoria)

```sql
CREATE OR REPLACE VIEW ordini_con_residuo AS
SELECT 
  o.*,
  COALESCE(SUM(cc.quantita_consegnata), 0)::INTEGER AS quantita_consegnata_totale,
  GREATEST(0, o.quantita - COALESCE(SUM(cc.quantita_consegnata), 0))::INTEGER AS quantita_residua
FROM ordini o
LEFT JOIN consegne_condivise cc ON cc.ordine_id = o.id
GROUP BY o.id;
```

FLUPSY usa questa vista per calcolare il residuo in tempo reale.

---

## 8. Modulo Ordini Condivisi — Logica e trigger

### Trigger automatico aggiornamento stato

Questo trigger è **obbligatorio**: aggiorna automaticamente lo stato dell'ordine ogni volta che una consegna viene inserita, modificata o cancellata.

```sql
CREATE OR REPLACE FUNCTION aggiorna_stato_ordine()
RETURNS TRIGGER AS $$
DECLARE
  v_ordine_id     INTEGER;
  v_quantita_tot  INTEGER;
  v_consegnato    INTEGER;
  v_nuovo_stato   TEXT;
BEGIN
  -- Determina quale ordine aggiornare
  IF TG_OP = 'DELETE' THEN
    v_ordine_id := OLD.ordine_id;
  ELSE
    v_ordine_id := NEW.ordine_id;
  END IF;

  -- Calcola totali
  SELECT quantita INTO v_quantita_tot FROM ordini WHERE id = v_ordine_id;
  SELECT COALESCE(SUM(quantita_consegnata), 0) INTO v_consegnato
    FROM consegne_condivise WHERE ordine_id = v_ordine_id;

  -- Determina nuovo stato
  IF v_consegnato = 0 THEN
    v_nuovo_stato := 'Aperto';
  ELSIF v_consegnato >= v_quantita_tot THEN
    v_nuovo_stato := 'Completato';
  ELSE
    v_nuovo_stato := 'Parziale';
  END IF;

  -- Aggiorna ordine
  UPDATE ordini
    SET stato = v_nuovo_stato, updated_at = NOW()
    WHERE id = v_ordine_id;

  IF TG_OP = 'DELETE' THEN RETURN OLD;
  ELSE RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_aggiorna_stato_ordine ON consegne_condivise;
CREATE TRIGGER trigger_aggiorna_stato_ordine
AFTER INSERT OR UPDATE OR DELETE ON consegne_condivise
FOR EACH ROW EXECUTE FUNCTION aggiorna_stato_ordine();
```

### Indici consigliati per performance

```sql
CREATE INDEX IF NOT EXISTS idx_consegne_ordine_id ON consegne_condivise(ordine_id);
CREATE INDEX IF NOT EXISTS idx_ordini_stato ON ordini(stato);
CREATE INDEX IF NOT EXISTS idx_ordini_data_inizio ON ordini(data_inizio_consegna);
CREATE INDEX IF NOT EXISTS idx_ordini_cancellato ON ordini(cancellato) WHERE cancellato = FALSE;
```

### Logica di validazione consegne (da implementare nel tuo sistema)

Prima di inserire in `consegne_condivise`, verifica:
```
quantita_residua = ordine.quantita - SUM(consegne_condivise WHERE ordine_id = ?)
nuova_consegna.quantita_consegnata <= quantita_residua
```

Se la condizione non è soddisfatta, rifiuta l'inserimento con errore `400 Bad Request`.

### Cosa scrivere nel campo `app_origine`

Quando il tuo sistema inserisce una consegna, usa sempre:
```
app_origine = 'app_esterna'
```

FLUPSY usa:
```
app_origine = 'delta_futuro'
```

---

## 9. Notifica aggiornamento cache

Dopo che il tuo sistema scrive dati nel database condiviso (nuovi ordini, consegne, aggiornamenti), deve notificare FLUPSY per svuotare la sua cache in-memory. Senza questa notifica, FLUPSY potrebbe mostrare dati vecchi per fino a 60 secondi.

**Endpoint**:
```
POST https://<dominio-flupsy>/api/external/notify-update
```

**Headers**:
```
x-api-key: <EXTERNAL_NOTIFY_API_KEY>
Content-Type: application/json
```

**Body**:
```json
{
  "reason": "ordini_update"
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Cache invalidata"
}
```

La chiave `EXTERNAL_NOTIFY_API_KEY` ti verrà comunicata da Delta Futuro.

---

## 10. Tipi di dati e codifiche

### Taglie prodotto (sizeCode)

Le 29 taglie standard usate nel sistema:

| Codice | Descrizione | Range (animali/kg) |
|--------|-------------|-------------------|
| `S-1` | Semi Stage 1 | > 500.000 |
| `S-2` | Semi Stage 2 | 300.000 – 500.000 |
| `S-3` | Semi Stage 3 | 200.000 – 300.000 |
| `S-4` | Semi Stage 4 | 100.000 – 200.000 |
| `S-5` | Semi Stage 5 | 50.000 – 100.000 |
| `T-1` | Taglia 1 | 30.000 – 50.000 |
| `T-2` | Taglia 2 | 20.000 – 30.000 |
| `T-3` | Taglia 3 | 15.000 – 20.000 |
| `T-4` | Taglia 4 | 10.000 – 15.000 |
| `T-5` | Taglia 5 | 7.000 – 10.000 |
| `TP-1` | Taglia Plus 1 | 5.000 – 7.000 |
| `TP-2` | Taglia Plus 2 | 4.000 – 5.000 |
| `TP-3` | Taglia Plus 3 | 3.500 – 4.000 |
| `TP-3000` | Taglia 3000 | 3.000 – 3.500 |
| `TP-4` | Taglia Plus 4 | 2.500 – 3.000 |
| `TP-5` | Taglia Plus 5 | 2.000 – 2.500 |
| `TP-6` | Taglia Plus 6 | 1.500 – 2.000 |
| `TP-7` | Taglia Plus 7 | 1.000 – 1.500 |
| `TP-8` | Taglia Plus 8 | 800 – 1.000 |
| `TP-9` | Taglia Plus 9 | 600 – 800 |
| `TP-10` | Taglia Plus 10 | 400 – 600 |
| `TP-11` | Taglia Plus 11 | 250 – 400 |
| `TP-12` | Taglia Plus 12 | 150 – 250 |
| `TP-13` | Taglia Plus 13 | 100 – 150 |
| `TP-14` | Taglia Plus 14 | 50 – 100 |
| `TP-15` | Taglia Plus 15 | 30 – 50 |
| `TP-16` | Taglia Plus 16 | 10 – 30 |
| `TP-17` | Taglia Plus 17 | 5 – 10 |
| `TP-18` | Taglia Plus 18 | < 5 |

### Unità di misura

| Codice | Significato |
|--------|-------------|
| `NR` | Numero (animali) |
| `KG` | Chilogrammi |

### Formato date

Tutte le date sono in formato ISO 8601: `YYYY-MM-DD`

### Valute

Sempre `EUR`.

### Pesi

I pesi in FLUPSY sono internamente in **grammi** nel database, ma nei payload DDT il campo `pesoTotale` è espresso in **chilogrammi** (già convertito).

---

## 11. Scenari di errore e gestione

### Errori attesi dal tuo sistema (API DDT)

| HTTP Status | Quando usarlo |
|-------------|--------------|
| `200 OK` | Operazione riuscita (GET, PATCH) |
| `201 Created` | DDT creato con successo (POST) |
| `400 Bad Request` | Dati mancanti o invalidi nel body |
| `401 Unauthorized` | API Key mancante o non valida |
| `404 Not Found` | DDT o cliente non trovato |
| `409 Conflict` | Numero DDT già esistente |
| `500 Internal Server Error` | Errore interno del tuo sistema |

### Cosa fa FLUPSY in caso di errore

- Se `GET /prossimo-numero` fallisce: FLUPSY blocca la generazione e mostra errore all'utente
- Se `POST /ddt` fallisce: il DDT rimane in stato `locale` (non `inviato`) e l'utente può riprovare
- Se `DELETE /ddt` fallisce: FLUPSY mostra un avviso ma procede comunque con la cancellazione locale

### Connessione database condiviso non disponibile

Se FLUPSY non riesce a connettersi al DB esterno (`DATABASE_URL_ESTERNO` non raggiungibile), il modulo Ordini Condivisi mostra un messaggio di errore e disabilita le funzionalità che richiedono quella connessione. Il resto dell'applicazione continua a funzionare normalmente.

---

## Riepilogo checklist sviluppatore

### Per il modulo DDT
- [ ] Endpoint `GET /api/ddt/prossimo-numero` che restituisce il prossimo numero disponibile
- [ ] Endpoint `POST /api/ddt` che accetta la struttura completa e restituisce `{id, numero, url_pdf}`
- [ ] Endpoint `GET /api/ddt/:id` per verifica
- [ ] Endpoint `DELETE /api/ddt/:id` per storno/annullamento
- [ ] (Opzionale) Endpoint `GET /api/clienti` e `POST /api/clienti` per rubrica
- [ ] Autenticazione via Bearer Token o API Key concordata
- [ ] HTTPS obbligatorio in produzione

### Per il modulo Ordini Condivisi
- [ ] Database PostgreSQL accessibile da internet (o tunnel)
- [ ] Tabella `ordini` con tutti i campi dello schema §7
- [ ] Tabella `ordini_dettagli` con tutti i campi dello schema §7
- [ ] Tabella `consegne_condivise` con tutti i campi dello schema §7
- [ ] Vista `ordini_con_residuo` creata
- [ ] Trigger `trigger_aggiorna_stato_ordine` installato e funzionante
- [ ] Indici creati per le performance
- [ ] Connection string PostgreSQL comunicata a Delta Futuro
- [ ] Implementazione notifica cache dopo scritture (POST a FLUPSY)
- [ ] Validazione residuo prima di ogni inserimento consegna

---

*Documento generato dal FLUPSY Management System — Delta Futuro*  
*Per domande tecniche contattare il team di sviluppo FLUPSY*
