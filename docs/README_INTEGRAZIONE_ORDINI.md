# 🚀 Integrazione Sistema Ordini Condivisi - Delta Futuro & App Esterna

## 📋 Panoramica

Sistema di gestione ordini condivisi tra **Delta Futuro** e **App Esterna** tramite database PostgreSQL comune.

### ✅ Architettura Finale (SCENARIO B)

```
┌─────────────────┐         ┌─────────────────────┐
│  Delta Futuro   │         │   App Esterna       │
└────────┬────────┘         └─────────┬───────────┘
         │                            │
         │    DATABASE_URL_ESTERNO    │
         └────────────┬───────────────┘
                      │
              ┌───────▼────────┐
              │   PostgreSQL   │
              │   (DB Esterno) │
              └────────────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
    ┌────▼───┐  ┌────▼────┐  ┌────▼─────────────┐
    │ordini  │  │ordini_  │  │consegne_         │
    │        │  │dettagli │  │condivise         │
    └────────┘  └─────────┘  └──────────────────┘
                              ↑
                              │
                         app_origine:
                      'delta_futuro' | 'app_esterna'
```

---

## ✅ Stato Implementazione

### Delta Futuro - COMPLETO ✅

| Componente | Stato | Note |
|-----------|-------|------|
| Connessione DB Esterno | ✅ | Via `DATABASE_URL_ESTERNO` |
| Lettura ordini | ✅ | Query ottimizzata con LEFT JOIN |
| Calcolo residui | ✅ | Automatico da `consegne_condivise` |
| Creazione consegne | ✅ | POST `/api/ordini-condivisi/consegne` |
| Campo `app_origine` | ✅ | Impostato a `'delta_futuro'` |
| UI Gestione Ordini | ✅ | Pagina completa con filtri e sorting |

### App Esterna - DA IMPLEMENTARE 🔧

| Componente | Stato | File Guida |
|-----------|-------|------------|
| Setup Database | 🔧 | `sql/complete-setup-database-esterno.sql` |
| Connessione DB | 🔧 | `docs/GUIDA_APP_ESTERNA.md` - Sezione Setup |
| Lettura ordini | 🔧 | `docs/GUIDA_APP_ESTERNA.md` - Sezione 1 |
| Creazione consegne | 🔧 | `docs/GUIDA_APP_ESTERNA.md` - Sezione 2 |
| Lettura consegne | 🔧 | `docs/GUIDA_APP_ESTERNA.md` - Sezione 3 |

---

## 🎯 Passi di Integrazione

### STEP 1: Setup Database Esterno (Una Tantum)

**Responsabile**: Sviluppatore App Esterna

**Azione**: Eseguire script SQL sul database PostgreSQL

```bash
# Via psql
psql -h <HOST> -U <USER> -d <DATABASE> -f sql/complete-setup-database-esterno.sql

# Via client PostgreSQL
# Aprire sql/complete-setup-database-esterno.sql e eseguirlo
```

**Cosa fa lo script:**
- ✅ Aggiunge colonne mancanti a `ordini` e `ordini_dettagli`
- ✅ Crea tabella `consegne_condivise`
- ✅ Crea indici per performance
- ✅ Rimuove vincoli problematici
- ✅ Mostra report di verifica

**Verifica successo:**
```sql
-- Dovrebbe mostrare la tabella
SELECT COUNT(*) FROM consegne_condivise;

-- Dovrebbe mostrare tutte le colonne
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'consegne_condivise';
```

---

### STEP 2: Implementazione App Esterna

**Responsabile**: Sviluppatore App Esterna

**Guida Completa**: `docs/GUIDA_APP_ESTERNA.md`

**Checklist Minima:**

#### 2.1 Connessione Database
```javascript
// Esempio Node.js
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
```

#### 2.2 Creare Consegna
```javascript
async function creaConsegna(ordineId, dataConsegna, quantita, note) {
  // 1. Verifica residuo
  const check = await pool.query(`
    SELECT 
      (COALESCE(o.quantita, 0) - COALESCE(SUM(cc.quantita_consegnata), 0)) as residuo
    FROM ordini o
    LEFT JOIN consegne_condivise cc ON cc.ordine_id = o.id
    WHERE o.id = $1
    GROUP BY o.quantita
  `, [ordineId]);
  
  if (quantita > check.rows[0].residuo) {
    throw new Error('Quantità superiore al residuo');
  }
  
  // 2. Inserisci consegna
  const result = await pool.query(`
    INSERT INTO consegne_condivise (
      ordine_id, data_consegna, quantita_consegnata, app_origine, note
    ) VALUES ($1, $2, $3, 'app_esterna', $4)
    RETURNING *
  `, [ordineId, dataConsegna, quantita, note]);
  
  return result.rows[0];
}
```

#### 2.3 Leggere Stato Ordini
```javascript
async function getOrdini() {
  const result = await pool.query(`
    SELECT 
      o.id,
      o.numero,
      o.cliente_nome,
      o.quantita as quantita_totale,
      COALESCE(SUM(cc.quantita_consegnata), 0) as quantita_consegnata,
      (COALESCE(o.quantita, 0) - COALESCE(SUM(cc.quantita_consegnata), 0)) as quantita_residua
    FROM ordini o
    LEFT JOIN consegne_condivise cc ON cc.ordine_id = o.id
    GROUP BY o.id, o.numero, o.cliente_nome, o.quantita
    ORDER BY o.data DESC
  `);
  
  return result.rows;
}
```

---

### STEP 3: Test Integrazione

#### Test 1: Delta Futuro crea consegna

```bash
# In Delta Futuro
1. Vai su "Gestione Ordini"
2. Seleziona un ordine
3. Clicca "Modifica" (icona matita)
4. Inserisci data e quantità consegna
5. Salva
```

**Verifica in App Esterna:**
```sql
-- Dovrebbe vedere la consegna
SELECT * FROM consegne_condivise 
WHERE app_origine = 'delta_futuro'
ORDER BY created_at DESC
LIMIT 5;
```

#### Test 2: App Esterna crea consegna

```javascript
// Nell'App Esterna
await creaConsegna(123, '2025-11-05', 5000, 'Test consegna');
```

**Verifica in Delta Futuro:**
- Ricaricare pagina "Gestione Ordini"
- Verificare che il residuo si sia aggiornato
- Cliccare sulla freccia per espandere l'ordine
- ✅ Dovrebbe vedere tutte le consegne (anche quella dell'app esterna)

#### Test 3: Verifica Coerenza

**Eseguire in entrambe le app:**
```sql
SELECT 
  ordine_id,
  app_origine,
  COUNT(*) as num_consegne,
  SUM(quantita_consegnata) as totale_consegnato
FROM consegne_condivise
GROUP BY ordine_id, app_origine;
```

**I risultati devono essere identici** in entrambe le app! ✅

---

## 🔍 Verifica Funzionamento

### Checklist Finale

**Delta Futuro:**
- [ ] Pagina "Gestione Ordini" mostra ordini corretti
- [ ] Quantità totali corrette
- [ ] Stati corretti (Aperto/Completato)
- [ ] Può creare consegne
- [ ] Residui si aggiornano dopo consegne

**App Esterna:**
- [ ] Script SQL eseguito con successo
- [ ] Può connettersi al database
- [ ] Può leggere ordini con residui
- [ ] Può creare consegne con `app_origine='app_esterna'`
- [ ] Vede le consegne create da Delta Futuro

**Integrazione:**
- [ ] Delta Futuro vede consegne create dall'app esterna
- [ ] App esterna vede consegne create da Delta Futuro
- [ ] Residui calcolati identicamente in entrambe le app
- [ ] Stati ordine coerenti

---

## 📚 Documentazione

| File | Descrizione | Destinatario |
|------|-------------|--------------|
| `sql/complete-setup-database-esterno.sql` | Script setup completo database | DBA/Sviluppatore |
| `docs/GUIDA_APP_ESTERNA.md` | Guida integrazione completa | Sviluppatore App Esterna |
| `DOCUMENTAZIONE_DATABASE_ESTERNO.md` | Schema database e API | Entrambi |
| `docs/README_INTEGRAZIONE_ORDINI.md` | Questo file - Overview | Project Manager |

---

## 🚨 Troubleshooting

### Problema: App Esterna non vede consegne Delta Futuro

**Causa**: Query non include tutte le consegne

**Soluzione**: Usare sempre LEFT JOIN su `consegne_condivise` senza filtro su `app_origine`

### Problema: Errore "foreign key violation"

**Causa**: Ordine non esiste

**Soluzione**: Verificare che `ordine_id` esista prima di creare consegna

### Problema: Residui non coincidono

**Causa**: Query diverse tra le app

**Soluzione**: Entrambe le app devono usare la stessa query:
```sql
COALESCE(o.quantita, 0) - COALESCE(SUM(cc.quantita_consegnata), 0)
```

---

## 📞 Supporto

**Delta Futuro - Sviluppatore**: [Contatto tecnico]
**App Esterna - Sviluppatore**: [Contatto tecnico]

---

## ✅ Prossimi Passi

1. **App Esterna**: Eseguire script SQL setup
2. **App Esterna**: Implementare codice seguendo GUIDA_APP_ESTERNA.md
3. **Entrambe**: Eseguire test di integrazione
4. **Entrambe**: Verifica finale con ordini reali
5. **Deploy**: Mettere in produzione

---

**Data Ultima Revisione**: 01/11/2025  
**Versione**: 1.0
