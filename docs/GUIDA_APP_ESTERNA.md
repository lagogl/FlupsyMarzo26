# 🚀 Guida Integrazione App Esterna - Sistema Ordini Condivisi

## 📋 Panoramica

Questa guida spiega come l'**App Esterna** deve integrarsi con il sistema di ordini condivisi tramite il database PostgreSQL comune con Delta Futuro.

---

## 🔧 Setup Iniziale

### 1. Connessione Database

**Connessione PostgreSQL:**
```javascript
// Node.js con pg
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Stesso DB di Delta Futuro
  ssl: {
    rejectUnauthorized: false
  }
});
```

```python
# Python con psycopg2
import psycopg2
import os

conn = psycopg2.connect(
    os.environ['DATABASE_URL']
)
```

```php
// PHP con PDO
$dsn = getenv('DATABASE_URL');
$pdo = new PDO($dsn);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
```

### 2. Eseguire Script Setup

**Prima volta - Creare tabella consegne_condivise:**

```sql
-- Eseguire una sola volta sul database
CREATE TABLE IF NOT EXISTS consegne_condivise (
  id SERIAL PRIMARY KEY,
  ordine_id INTEGER NOT NULL REFERENCES ordini(id) ON DELETE RESTRICT,
  data_consegna DATE NOT NULL,
  quantita_consegnata INTEGER NOT NULL,
  app_origine VARCHAR(50) NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consegne_ordine_id ON consegne_condivise(ordine_id);
CREATE INDEX IF NOT EXISTS idx_consegne_data_consegna ON consegne_condivise(data_consegna);
CREATE INDEX IF NOT EXISTS idx_consegne_app_origine ON consegne_condivise(app_origine);
```

---

## 📊 Operazioni CRUD

### 1️⃣ Leggere Ordini con Residui

**Query consigliata - Usa la vista ottimizzata:**

```sql
SELECT 
  o.id,
  o.numero,
  o.data,
  o.cliente_nome,
  o.stato,
  o.quantita as quantita_totale,
  o.taglia_richiesta,
  COALESCE(SUM(cc.quantita_consegnata), 0) as quantita_consegnata,
  (COALESCE(o.quantita, 0) - COALESCE(SUM(cc.quantita_consegnata), 0)) as quantita_residua
FROM ordini o
LEFT JOIN consegne_condivise cc ON cc.ordine_id = o.id
WHERE o.stato IN ('Aperto', 'In Lavorazione')
GROUP BY o.id, o.numero, o.data, o.cliente_nome, o.stato, o.quantita, o.taglia_richiesta
ORDER BY o.data DESC;
```

**Esempio Node.js:**
```javascript
async function getOrdiniAperti() {
  const result = await pool.query(`
    SELECT 
      o.id,
      o.numero,
      o.cliente_nome,
      o.quantita as quantita_totale,
      COALESCE(SUM(cc.quantita_consegnata), 0)::INTEGER as quantita_consegnata,
      (COALESCE(o.quantita, 0) - COALESCE(SUM(cc.quantita_consegnata), 0))::INTEGER as quantita_residua
    FROM ordini o
    LEFT JOIN consegne_condivise cc ON cc.ordine_id = o.id
    GROUP BY o.id, o.numero, o.cliente_nome, o.quantita
    HAVING (COALESCE(o.quantita, 0) - COALESCE(SUM(cc.quantita_consegnata), 0)) > 0
  `);
  
  return result.rows;
}
```

---

### 2️⃣ Creare Consegna

**⚠️ IMPORTANTE: Sempre impostare `app_origine = 'app_esterna'`**

```sql
INSERT INTO consegne_condivise (
  ordine_id,
  data_consegna,
  quantita_consegnata,
  app_origine,
  note
) VALUES (
  $1,              -- ID ordine
  $2,              -- Data consegna (YYYY-MM-DD)
  $3,              -- Quantità consegnata
  'app_esterna',   -- ⚠️ SEMPRE 'app_esterna'
  $4               -- Note opzionali
) RETURNING *;
```

**Esempio Node.js con validazione:**
```javascript
async function creaConsegna(ordineId, dataConsegna, quantita, note = null) {
  // 1. Verifica residuo disponibile
  const checkResult = await pool.query(`
    SELECT 
      o.quantita as quantita_totale,
      COALESCE(SUM(cc.quantita_consegnata), 0) as quantita_consegnata,
      (COALESCE(o.quantita, 0) - COALESCE(SUM(cc.quantita_consegnata), 0)) as quantita_residua
    FROM ordini o
    LEFT JOIN consegne_condivise cc ON cc.ordine_id = o.id
    WHERE o.id = $1
    GROUP BY o.id, o.quantita
  `, [ordineId]);
  
  if (checkResult.rows.length === 0) {
    throw new Error('Ordine non trovato');
  }
  
  const { quantita_residua } = checkResult.rows[0];
  
  if (quantita > quantita_residua) {
    throw new Error(`Quantità superiore al residuo disponibile (${quantita_residua})`);
  }
  
  // 2. Inserisci consegna
  const result = await pool.query(`
    INSERT INTO consegne_condivise (
      ordine_id,
      data_consegna,
      quantita_consegnata,
      app_origine,
      note
    ) VALUES ($1, $2, $3, 'app_esterna', $4)
    RETURNING *
  `, [ordineId, dataConsegna, quantita, note]);
  
  return result.rows[0];
}
```

**Esempio Python:**
```python
def crea_consegna(ordine_id, data_consegna, quantita, note=None):
    cursor = conn.cursor()
    
    # Verifica residuo
    cursor.execute("""
        SELECT 
            COALESCE(o.quantita, 0) - COALESCE(SUM(cc.quantita_consegnata), 0) as quantita_residua
        FROM ordini o
        LEFT JOIN consegne_condivise cc ON cc.ordine_id = o.id
        WHERE o.id = %s
        GROUP BY o.id, o.quantita
    """, (ordine_id,))
    
    row = cursor.fetchone()
    if not row:
        raise ValueError("Ordine non trovato")
    
    quantita_residua = row[0]
    if quantita > quantita_residua:
        raise ValueError(f"Quantità superiore al residuo ({quantita_residua})")
    
    # Inserisci consegna
    cursor.execute("""
        INSERT INTO consegne_condivise (
            ordine_id, data_consegna, quantita_consegnata, app_origine, note
        ) VALUES (%s, %s, %s, 'app_esterna', %s)
        RETURNING id
    """, (ordine_id, data_consegna, quantita, note))
    
    consegna_id = cursor.fetchone()[0]
    conn.commit()
    return consegna_id
```

---

### 3️⃣ Leggere Consegne di un Ordine

**Vedere tutte le consegne (da entrambe le app):**

```sql
SELECT 
  id,
  data_consegna,
  quantita_consegnata,
  app_origine,
  note,
  created_at
FROM consegne_condivise
WHERE ordine_id = $1
ORDER BY data_consegna DESC, created_at DESC;
```

**Esempio Node.js:**
```javascript
async function getConsegneOrdine(ordineId) {
  const result = await pool.query(`
    SELECT 
      id,
      data_consegna,
      quantita_consegnata,
      app_origine,
      note,
      created_at
    FROM consegne_condivise
    WHERE ordine_id = $1
    ORDER BY data_consegna DESC
  `, [ordineId]);
  
  return result.rows;
}
```

---

### 4️⃣ Eliminare Consegna

**⚠️ Solo consegne create dall'app esterna:**

```sql
DELETE FROM consegne_condivise 
WHERE id = $1 
  AND app_origine = 'app_esterna'
RETURNING *;
```

**Esempio Node.js:**
```javascript
async function eliminaConsegna(consegnaId) {
  const result = await pool.query(`
    DELETE FROM consegne_condivise 
    WHERE id = $1 AND app_origine = 'app_esterna'
    RETURNING *
  `, [consegnaId]);
  
  if (result.rows.length === 0) {
    throw new Error('Consegna non trovata o non eliminabile');
  }
  
  return result.rows[0];
}
```

---

## 📈 Dashboard e Statistiche

### Riepilogo Ordini per Stato

```sql
SELECT 
  CASE 
    WHEN quantita_consegnata = 0 THEN 'Aperto'
    WHEN quantita_consegnata >= quantita_totale THEN 'Completato'
    ELSE 'Parziale'
  END as stato_consegna,
  COUNT(*) as numero_ordini,
  SUM(quantita_totale) as quantita_totale,
  SUM(quantita_consegnata) as quantita_consegnata,
  SUM(quantita_residua) as quantita_residua
FROM (
  SELECT 
    o.id,
    o.quantita as quantita_totale,
    COALESCE(SUM(cc.quantita_consegnata), 0) as quantita_consegnata,
    (COALESCE(o.quantita, 0) - COALESCE(SUM(cc.quantita_consegnata), 0)) as quantita_residua
  FROM ordini o
  LEFT JOIN consegne_condivise cc ON cc.ordine_id = o.id
  GROUP BY o.id, o.quantita
) stats
GROUP BY stato_consegna;
```

### Consegne per App

```sql
SELECT 
  app_origine,
  COUNT(*) as numero_consegne,
  SUM(quantita_consegnata) as quantita_totale_consegnata
FROM consegne_condivise
WHERE data_consegna >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY app_origine;
```

---

## 🔍 Casi d'Uso Pratici

### Caso 1: Form Consegna nell'UI

**Workflow completo:**

```javascript
// 1. Carica dati ordine
async function loadOrdinePerConsegna(ordineId) {
  const result = await pool.query(`
    SELECT 
      o.id,
      o.numero,
      o.cliente_nome,
      o.quantita as quantita_totale,
      o.taglia_richiesta,
      COALESCE(SUM(cc.quantita_consegnata), 0)::INTEGER as quantita_consegnata,
      (COALESCE(o.quantita, 0) - COALESCE(SUM(cc.quantita_consegnata), 0))::INTEGER as quantita_residua
    FROM ordini o
    LEFT JOIN consegne_condivise cc ON cc.ordine_id = o.id
    WHERE o.id = $1
    GROUP BY o.id, o.numero, o.cliente_nome, o.quantita, o.taglia_richiesta
  `, [ordineId]);
  
  return result.rows[0];
}

// 2. Valida e salva consegna
async function salvaConsegnaForm(formData) {
  const { ordineId, dataConsegna, quantita, note } = formData;
  
  // Validazione
  if (!ordineId || !dataConsegna || !quantita || quantita <= 0) {
    throw new Error('Dati mancanti o non validi');
  }
  
  // Crea consegna (con validazione residuo integrata)
  return await creaConsegna(ordineId, dataConsegna, quantita, note);
}
```

### Caso 2: Report Consegne Mensile

```javascript
async function reportConsegneMensile(anno, mese) {
  const result = await pool.query(`
    SELECT 
      o.numero as ordine_numero,
      o.cliente_nome,
      cc.data_consegna,
      cc.quantita_consegnata,
      cc.app_origine,
      cc.note
    FROM consegne_condivise cc
    JOIN ordini o ON o.id = cc.ordine_id
    WHERE EXTRACT(YEAR FROM cc.data_consegna) = $1
      AND EXTRACT(MONTH FROM cc.data_consegna) = $2
    ORDER BY cc.data_consegna DESC, o.numero
  `, [anno, mese]);
  
  return result.rows;
}
```

---

## 🚨 Gestione Errori

### Errori Comuni e Soluzioni

| Errore | Causa | Soluzione |
|--------|-------|-----------|
| `foreign key violation` | Ordine non esistente | Verificare che `ordine_id` esista in `ordini` |
| `check constraint` | Quantità negativa/zero | Validare `quantita_consegnata > 0` |
| `Quantità superiore al residuo` | Tentativo di consegnare più del dovuto | Controllare residuo prima di inserire |
| `app_origine missing` | Campo obbligatorio non valorizzato | Sempre impostare `'app_esterna'` |

### Template Gestione Errori

```javascript
async function creaConsegnaSafe(ordineId, dataConsegna, quantita, note) {
  try {
    const consegna = await creaConsegna(ordineId, dataConsegna, quantita, note);
    return { success: true, data: consegna };
    
  } catch (error) {
    console.error('Errore creazione consegna:', error);
    
    // Log per debugging
    console.log('Parametri:', { ordineId, dataConsegna, quantita, note });
    
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
}
```

---

## ✅ Checklist Integrazione

**Prima di andare in produzione, verificare:**

- [ ] Connessione al database funzionante
- [ ] Tabella `consegne_condivise` creata
- [ ] Indici creati per performance
- [ ] `app_origine` sempre impostato a `'app_esterna'`
- [ ] Validazione residuo implementata
- [ ] Gestione errori completa
- [ ] Test con ordini reali
- [ ] Test consegne multiple sullo stesso ordine
- [ ] Test eliminazione consegne
- [ ] Verifica che Delta Futuro veda le consegne create

---

## 🔗 Risorse

- **Script SQL Setup**: `sql/complete-setup-database-esterno.sql`
- **Documentazione Schema**: `DOCUMENTAZIONE_DATABASE_ESTERNO.md`
- **Contatto Tecnico Delta Futuro**: [da definire]

---

## 📞 Supporto

Per problemi tecnici o chiarimenti sull'integrazione, contattare il team Delta Futuro.

**Ultima revisione**: 01/11/2025
