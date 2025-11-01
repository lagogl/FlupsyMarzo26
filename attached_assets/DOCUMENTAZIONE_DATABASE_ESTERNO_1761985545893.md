# 📘 Documentazione Database Condiviso - Delta Futuro

## 🎯 Scopo della Documentazione
Questa documentazione descrive le **tabelle condivise** del database PostgreSQL che l'applicazione esterna può utilizzare per sincronizzare ordini e consegne con Delta Futuro.

---

## 🏗️ Architettura del Sistema

### Modello di Condivisione
- **Database Unico Condiviso**: Entrambe le applicazioni (Delta Futuro e App Esterna) si connettono allo **stesso database PostgreSQL** tramite `DATABASE_URL`
- **Sincronizzazione Automatica**: Non è necessaria alcuna sincronizzazione API - i dati sono sempre aggiornati per entrambe le app
- **Tracciamento Origine**: Il campo `app_origine` identifica quale applicazione ha creato ogni consegna

### Flusso Dati
```
Fatture in Cloud (FIC)
         ↓
   [Sincronizzazione API]
         ↓
Delta Futuro → Database PostgreSQL ← App Esterna
         ↓                    ↓
    Tabelle Condivise:
    - ordini
    - ordini_dettagli  
    - consegne_condivise
    - clienti (opzionale)
```

---

## 📊 Tabelle Database

### 1. Tabella `ordini`
Contiene gli ordini principali importati da Fatture in Cloud o creati localmente.

#### Struttura Completa
```sql
CREATE TABLE ordini (
  -- Chiave primaria
  id SERIAL PRIMARY KEY,
  
  -- Identificativi ordine
  numero INTEGER,                          -- Numero progressivo ordine
  fatture_in_cloud_id INTEGER UNIQUE,      -- ID ordine in FIC (NULL se locale)
  fatture_in_cloud_numero VARCHAR(50),     -- Numero documento FIC (es: "123/2025")
  
  -- Dati cliente
  cliente_id INTEGER,                      -- FK a clienti.id (nullable per flessibilità)
  cliente_nome TEXT,                       -- Nome cliente denormalizzato
  
  -- Date
  data DATE NOT NULL,                      -- Data ordine
  data_consegna DATE,                      -- [DEPRECATO] Data consegna singola
  data_inizio_consegna DATE,               -- Inizio range consegna
  data_fine_consegna DATE,                 -- Fine range consegna
  
  -- Quantità e taglie
  quantita INTEGER NOT NULL,               -- [DEPRECATO] Quantità a livello ordine
  quantita_totale INTEGER DEFAULT 0,       -- Somma quantità da ordini_dettagli
  taglia_richiesta TEXT DEFAULT '',        -- Taglie richieste (es: "TP-2000, TP-3000")
  
  -- Importi
  totale NUMERIC(10,2) DEFAULT 0,          -- Importo totale ordine
  valuta TEXT DEFAULT 'EUR',               -- Valuta (default EUR)
  
  -- Stato
  stato TEXT NOT NULL,                     -- Stato ordine: "Aperto" | "In Lavorazione" | "Completato" | "Annullato"
  
  -- Sincronizzazione FIC
  sync_status VARCHAR(20) DEFAULT 'locale', -- Stato sync: "locale" | "in_sync" | "sincronizzato" | "errore"
  last_sync_at TIMESTAMP,                  -- Timestamp ultima sincronizzazione
  sync_error TEXT,                         -- Messaggio errore sincronizzazione
  url_documento TEXT,                      -- URL documento in FIC
  company_id INTEGER,                      -- ID company in FIC
  
  -- Metadati
  note TEXT,                               -- Note libere
  created_at TIMESTAMP DEFAULT NOW(),      -- Data creazione record
  updated_at TIMESTAMP                     -- Data ultimo aggiornamento
);

-- Indici per performance
CREATE INDEX idx_ordini_fatture_in_cloud_id ON ordini(fatture_in_cloud_id);
CREATE INDEX idx_ordini_sync_status ON ordini(sync_status);
CREATE INDEX idx_ordini_data_inizio_consegna ON ordini(data_inizio_consegna);
CREATE INDEX idx_ordini_cliente_id ON ordini(cliente_id);
CREATE INDEX idx_ordini_data ON ordini(data);
```

#### Stati Possibili
| Stato | Descrizione |
|-------|-------------|
| `Aperto` | Ordine ricevuto, nessuna consegna effettuata |
| `In Lavorazione` | Consegne parziali in corso |
| `Completato` | Ordine completamente evaso |
| `Annullato` | Ordine annullato |

#### Stati Sincronizzazione FIC
| sync_status | Descrizione | Icona UI |
|-------------|-------------|----------|
| `locale` | Ordine creato manualmente, non in FIC | 🔵 Locale |
| `in_sync` | Sincronizzazione in corso | ⏳ In Sync |
| `sincronizzato` | Perfettamente allineato con FIC | ✅ Sincronizzato |
| `errore` | Errore di sincronizzazione con FIC | 🔴 Errore |

---

### 2. Tabella `ordini_dettagli`
Contiene le righe di dettaglio per ogni ordine (gestione multi-riga).

#### Struttura Completa
```sql
CREATE TABLE ordini_dettagli (
  -- Chiave primaria
  id SERIAL PRIMARY KEY,
  
  -- Relazione con ordine
  ordine_id INTEGER NOT NULL REFERENCES ordini(id) ON DELETE CASCADE,
  
  -- Dati riga
  riga_numero INTEGER NOT NULL,            -- Numero progressivo riga (1, 2, 3...)
  codice_prodotto VARCHAR(100),            -- Codice prodotto (es: "TPH3000")
  taglia VARCHAR(50) NOT NULL,             -- Taglia normalizzata (es: "TP-3000")
  descrizione TEXT,                        -- Descrizione prodotto
  
  -- Quantità e prezzi
  quantita INTEGER NOT NULL,               -- Quantità di questa riga specifica
  unita_misura TEXT DEFAULT 'NR',          -- Unità misura (default: NR = numero)
  prezzo_unitario NUMERIC(10,4) DEFAULT 0, -- Prezzo per unità
  sconto NUMERIC(10,2) DEFAULT 0,          -- Sconto applicato
  importo_riga NUMERIC(10,2) DEFAULT 0,    -- Importo totale riga
  
  -- Sincronizzazione FIC
  fic_item_id INTEGER,                     -- ID riga in FIC
  
  -- Metadati
  created_at TIMESTAMP DEFAULT NOW()       -- Data creazione record
);

-- Indici
CREATE INDEX idx_ordini_dettagli_ordine_id ON ordini_dettagli(ordine_id);
CREATE INDEX idx_ordini_dettagli_taglia ON ordini_dettagli(taglia);
CREATE INDEX idx_ordini_dettagli_codice_prodotto ON ordini_dettagli(codice_prodotto);
```

#### Normalizzazione Taglie
Delta Futuro normalizza automaticamente i codici prodotto FIC in taglie standard:
- `TPH3000` → `TP-3000`
- `TPH5000` → `TP-5000`
- `TPH7000` → `TP-7000`
- `TPH9000` → `TP-9000`
- `TPH10000` → `TP-10000`

---

### 3. Tabella `consegne_condivise` ⭐
**Tabella centrale per tracking consegne** - condivisa tra Delta Futuro e App Esterna.

#### Struttura Completa
```sql
CREATE TABLE consegne_condivise (
  -- Chiave primaria
  id SERIAL PRIMARY KEY,
  
  -- Relazione con ordine
  ordine_id INTEGER NOT NULL REFERENCES ordini(id) ON DELETE RESTRICT,
  
  -- Dati consegna
  data_consegna DATE NOT NULL,             -- Data effettiva consegna
  quantita_consegnata INTEGER NOT NULL,    -- Quantità consegnata in questa consegna
  
  -- Tracciamento origine
  app_origine VARCHAR(50) NOT NULL,        -- 'delta_futuro' o 'app_esterna'
  
  -- Metadati
  note TEXT,                               -- Note libere
  created_at TIMESTAMP DEFAULT NOW()       -- Data creazione record
);

-- Indici
CREATE INDEX idx_consegne_ordine_id ON consegne_condivise(ordine_id);
CREATE INDEX idx_consegne_data_consegna ON consegne_condivise(data_consegna);
CREATE INDEX idx_consegne_app_origine ON consegne_condivise(app_origine);
```

#### Campo `app_origine`
Valori possibili:
- `'delta_futuro'` - Consegna creata da Delta Futuro
- `'app_esterna'` - Consegna creata dall'app esterna

**⚠️ IMPORTANTE**: Quando l'app esterna crea una consegna, DEVE impostare `app_origine = 'app_esterna'`.

---

### 4. Vista `ordini_con_residuo` 🔍
**Vista SQL che calcola automaticamente** le quantità consegnate e residue per ogni ordine.

#### Definizione Vista
```sql
CREATE OR REPLACE VIEW ordini_con_residuo AS
SELECT 
  -- Dati base ordine
  o.id,
  COALESCE(o.fatture_in_cloud_numero, o.numero::text, '') as numero,
  o.data,
  o.cliente_id,
  COALESCE(c.denominazione, o.cliente_nome, '') as cliente_nome,
  o.stato,
  o.quantita_totale,
  o.taglia_richiesta,
  o.data_inizio_consegna,
  o.data_fine_consegna,
  o.fatture_in_cloud_id,
  o.sync_status,
  
  -- Calcoli automatici
  COALESCE(SUM(cc.quantita_consegnata), 0)::INTEGER as quantita_consegnata,
  (COALESCE(o.quantita_totale, 0) - COALESCE(SUM(cc.quantita_consegnata), 0))::INTEGER as quantita_residua,
  
  -- Stato calcolato automaticamente
  CASE 
    WHEN COALESCE(SUM(cc.quantita_consegnata), 0) = 0 THEN 'Aperto'
    WHEN COALESCE(SUM(cc.quantita_consegnata), 0) >= COALESCE(o.quantita_totale, 0) THEN 'Completato'
    ELSE 'Parziale'
  END as stato_calcolato
  
FROM ordini o
LEFT JOIN clienti c ON c.id = o.cliente_id
LEFT JOIN consegne_condivise cc ON cc.ordine_id = o.id
GROUP BY 
  o.id, o.fatture_in_cloud_numero, o.numero, o.data, o.cliente_id, 
  c.denominazione, o.cliente_nome, o.stato, o.quantita_totale, o.taglia_richiesta,
  o.data_inizio_consegna, o.data_fine_consegna,
  o.fatture_in_cloud_id, o.sync_status;
```

#### Campi Calcolati
| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `quantita_consegnata` | INTEGER | Somma di tutte le consegne (da entrambe le app) |
| `quantita_residua` | INTEGER | `quantita_totale - quantita_consegnata` |
| `stato_calcolato` | TEXT | Stato automatico basato sulle consegne:<br>- `Aperto`: nessuna consegna<br>- `Parziale`: consegne parziali<br>- `Completato`: tutto consegnato |

#### Utilizzo
```sql
-- Esempio: Ottenere tutti gli ordini con residui
SELECT * FROM ordini_con_residuo WHERE quantita_residua > 0;

-- Esempio: Ordini completamente evasi
SELECT * FROM ordini_con_residuo WHERE stato_calcolato = 'Completato';

-- Esempio: Ordini aperti o parziali
SELECT * FROM ordini_con_residuo WHERE stato_calcolato IN ('Aperto', 'Parziale');
```

---

## 🔄 Logiche di Gestione

### Gestione Ordini

#### Origine Ordini
Gli ordini possono provenire da:
1. **Fatture in Cloud** (sincronizzazione automatica)
   - `fatture_in_cloud_id` ≠ NULL
   - `sync_status` = 'sincronizzato'
   - Importati automaticamente da Delta Futuro

2. **Creazione Locale** (deprecata in Delta Futuro)
   - `fatture_in_cloud_id` = NULL
   - `sync_status` = 'locale'
   - **Nota**: Delta Futuro non permette più creazione manuale ordini

#### Stati Ordine
Il campo `stato` viene gestito manualmente e può essere:
- `Aperto` - Ordine ricevuto
- `In Lavorazione` - Consegne in corso
- `Completato` - Ordine evaso completamente
- `Annullato` - Ordine annullato

**⚠️ IMPORTANTE**: Il campo `stato` è **indipendente** da `stato_calcolato` della vista. Può essere aggiornato manualmente dall'app esterna.

---

### Gestione Consegne

#### Creazione Consegne dall'App Esterna

```sql
-- Esempio: Inserire una nuova consegna
INSERT INTO consegne_condivise (
  ordine_id,
  data_consegna,
  quantita_consegnata,
  app_origine,
  note
) VALUES (
  123,                    -- ID ordine
  '2025-11-05',          -- Data consegna
  5000,                  -- Quantità consegnata (es: 5000 vongole)
  'app_esterna',         -- ⚠️ IMPORTANTE: specificare origine
  'Consegna parziale'    -- Note opzionali
);
```

#### Lettura Consegne

```sql
-- Tutte le consegne di un ordine
SELECT * FROM consegne_condivise 
WHERE ordine_id = 123 
ORDER BY data_consegna DESC;

-- Solo consegne create dall'app esterna
SELECT * FROM consegne_condivise 
WHERE app_origine = 'app_esterna';

-- Totale consegnato per ordine
SELECT 
  ordine_id,
  SUM(quantita_consegnata) as totale_consegnato,
  COUNT(*) as numero_consegne
FROM consegne_condivise
GROUP BY ordine_id;
```

#### Vincoli e Regole Business

1. **Vincolo di Cancellazione**
   - `ON DELETE RESTRICT` - Non è possibile eliminare un ordine se ha consegne associate
   - Prima eliminare tutte le consegne, poi l'ordine

2. **Validazione Quantità**
   - L'app esterna DEVE validare che `quantita_consegnata` ≤ `quantita_residua`
   - Controllare la vista `ordini_con_residuo` prima di inserire consegne

3. **Tracciamento Origine**
   - SEMPRE impostare `app_origine = 'app_esterna'` per consegne create esternamente
   - Delta Futuro usa `app_origine = 'delta_futuro'`

---

### Calcolo Automatico Residui

Il sistema calcola automaticamente i residui tramite la vista `ordini_con_residuo`:

```sql
-- Query consigliata per verificare residui prima di consegnare
SELECT 
  id,
  numero,
  cliente_nome,
  quantita_totale,
  quantita_consegnata,
  quantita_residua,
  stato_calcolato
FROM ordini_con_residuo
WHERE id = 123;  -- ID ordine
```

#### Esempio di Calcolo
```
Ordine #123:
  quantita_totale = 10.000

Consegne:
  1. delta_futuro - 3.000
  2. app_esterna  - 2.000
  3. app_esterna  - 1.500
  
Risultato:
  quantita_consegnata = 6.500
  quantita_residua = 3.500
  stato_calcolato = "Parziale"
```

---

## 📋 Esempi Pratici

### Esempio 1: Recuperare Ordini Aperti con Residui
```sql
SELECT 
  numero,
  cliente_nome,
  data_inizio_consegna,
  data_fine_consegna,
  taglia_richiesta,
  quantita_totale,
  quantita_consegnata,
  quantita_residua
FROM ordini_con_residuo
WHERE 
  stato_calcolato IN ('Aperto', 'Parziale')
  AND quantita_residua > 0
ORDER BY data_inizio_consegna ASC;
```

### Esempio 2: Inserire Consegna e Verificare Risultato
```sql
BEGIN;

-- 1. Verifica residuo disponibile
SELECT quantita_residua 
FROM ordini_con_residuo 
WHERE id = 123;
-- Risultato: 5.000

-- 2. Inserisci consegna (se residuo >= quantità da consegnare)
INSERT INTO consegne_condivise (
  ordine_id, 
  data_consegna, 
  quantita_consegnata, 
  app_origine, 
  note
) VALUES (
  123, 
  CURRENT_DATE, 
  2000, 
  'app_esterna',
  'Prima consegna'
);

-- 3. Verifica nuovo residuo
SELECT 
  quantita_consegnata,
  quantita_residua,
  stato_calcolato
FROM ordini_con_residuo 
WHERE id = 123;
-- Risultato: 
--   quantita_consegnata = 2.000
--   quantita_residua = 3.000
--   stato_calcolato = 'Parziale'

COMMIT;
```

### Esempio 3: Ottenere Dettagli Completi Ordine
```sql
SELECT 
  o.numero,
  o.cliente_nome,
  o.data,
  o.stato,
  o.sync_status,
  
  -- Dettagli righe
  od.taglia,
  od.quantita,
  od.prezzo_unitario,
  od.importo_riga,
  
  -- Calcoli residui
  ocr.quantita_consegnata,
  ocr.quantita_residua,
  ocr.stato_calcolato
  
FROM ordini o
JOIN ordini_dettagli od ON od.ordine_id = o.id
JOIN ordini_con_residuo ocr ON ocr.id = o.id
WHERE o.id = 123;
```

### Esempio 4: Storico Consegne per Ordine
```sql
SELECT 
  cc.data_consegna,
  cc.quantita_consegnata,
  cc.app_origine,
  cc.note,
  cc.created_at,
  
  -- Calcolo progressivo
  SUM(cc.quantita_consegnata) OVER (
    PARTITION BY cc.ordine_id 
    ORDER BY cc.data_consegna, cc.created_at
  ) as totale_progressivo
  
FROM consegne_condivise cc
WHERE cc.ordine_id = 123
ORDER BY cc.data_consegna ASC, cc.created_at ASC;
```

---

## 🔐 Connessione al Database

### Stringa di Connessione
```bash
DATABASE_URL="postgresql://username:password@host:port/database"
```

L'app esterna deve utilizzare la **stessa** `DATABASE_URL` utilizzata da Delta Futuro per garantire accesso ai dati condivisi.

### Librerie Consigliate
- **Node.js**: `pg`, `drizzle-orm`
- **Python**: `psycopg2`, `SQLAlchemy`
- **Java**: `JDBC PostgreSQL`
- **PHP**: `PDO PostgreSQL`

---

## ⚠️ Regole Importanti

### ✅ DA FARE
1. Impostare sempre `app_origine = 'app_esterna'` quando si creano consegne
2. Verificare `quantita_residua` prima di creare consegne
3. Usare la vista `ordini_con_residuo` per ottenere dati aggiornati
4. Rispettare i vincoli di foreign key (`ON DELETE RESTRICT`)
5. Gestire transazioni per inserimenti multipli

### ❌ DA NON FARE
1. **NON** eliminare ordini con consegne associate (eliminare prima le consegne)
2. **NON** modificare direttamente `quantita_consegnata` in `ordini` (usare `consegne_condivise`)
3. **NON** creare consegne con `quantita_consegnata` > `quantita_residua`
4. **NON** modificare campi di sincronizzazione FIC (`sync_status`, `last_sync_at`, ecc.)
5. **NON** modificare `ordini.cliente_id` per ordini sincronizzati con FIC

---

## 📞 Cascade e Relazioni

### Gerarchia Cancellazione
```
ordini (ON DELETE RESTRICT)
  ↓
ordini_dettagli (ON DELETE CASCADE)
  ↓
consegne_condivise (ON DELETE RESTRICT)
```

- **ordini → ordini_dettagli**: `CASCADE` - Eliminando un ordine, si eliminano automaticamente i dettagli
- **ordini → consegne_condivise**: `RESTRICT` - NON è possibile eliminare ordini con consegne associate

### Procedura Corretta per Eliminare Ordine
```sql
BEGIN;

-- 1. Elimina consegne
DELETE FROM consegne_condivise WHERE ordine_id = 123;

-- 2. Elimina ordine (i dettagli si eliminano automaticamente per CASCADE)
DELETE FROM ordini WHERE id = 123;

COMMIT;
```

---

## 🚀 Setup Iniziale

### Script SQL di Setup
L'app esterna può eseguire lo script `setup-completo-database-esterno.sql` per verificare che tutte le colonne e tabelle necessarie siano presenti.

```bash
psql $DATABASE_URL < setup-completo-database-esterno.sql
```

Questo script:
- Aggiunge colonne mancanti a `ordini` e `ordini_dettagli`
- Crea la tabella `consegne_condivise` se non esiste
- Crea la vista `ordini_con_residuo`
- Aggiunge indici per performance
- È **idempotente** (può essere eseguito più volte senza problemi)

---

## 📊 Performance e Indici

Tutti gli indici necessari sono già configurati:
- `idx_ordini_fatture_in_cloud_id`
- `idx_ordini_sync_status`
- `idx_ordini_data_inizio_consegna`
- `idx_ordini_cliente_id`
- `idx_ordini_dettagli_ordine_id`
- `idx_ordini_dettagli_taglia`
- `idx_consegne_ordine_id`
- `idx_consegne_data_consegna`
- `idx_consegne_app_origine`

---

## 📝 Note Finali

1. **Database Condiviso**: Entrambe le app accedono agli stessi dati in tempo reale
2. **Nessuna API**: Non serve sincronizzazione API - i dati sono sempre aggiornati
3. **Tracciamento**: Il campo `app_origine` permette di identificare l'origine di ogni consegna
4. **Vista Automatica**: `ordini_con_residuo` calcola automaticamente residui e stati
5. **Compatibilità**: Lo schema è progettato per essere estendibile senza breaking changes

---

## 📧 Supporto
Per domande o chiarimenti su questa documentazione, contattare il team di Delta Futuro.

---

**Versione Documentazione**: 1.0  
**Ultima Revisione**: 01 Novembre 2025  
**Compatibilità Database**: PostgreSQL 12+
