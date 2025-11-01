# 🚨 IMPORTANTE: Gestione Automatica Stati Ordini

## ⚠️ Regola Fondamentale

**NON IMPOSTARE MAI MANUALMENTE IL CAMPO `stato` NELLA TABELLA `ordini`!**

Il campo `stato` è **gestito automaticamente** dal trigger PostgreSQL `aggiorna_stato_ordine()` basandosi sulle consegne effettive nella tabella `consegne_condivise`.

---

## 🔄 Come Funziona

### Architettura

```
┌─────────────────┐         ┌─────────────────┐
│  Delta Futuro   │         │   App Esterna   │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │  Stesso DATABASE_URL      │
         └───────────┬────────────────┘
                     │
              ┌──────▼──────┐
              │  PostgreSQL │  ← Trigger vive qui!
              │  (condiviso)│
              └─────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
    ┌────▼───┐  ┌───▼────┐  ┌───▼────────┐
    │ordini  │  │consegne│  │consegne_   │
    │        │  │        │  │condivise   │
    └────────┘  └────────┘  └────────────┘
```

### Trigger PostgreSQL

Il trigger **si attiva automaticamente** quando:
- ✅ Inserisci una consegna in `consegne_condivise`
- ✅ Modifichi una consegna esistente
- ✅ Elimini una consegna

```sql
-- Il trigger calcola automaticamente:
CREATE TRIGGER trigger_aggiorna_stato_ordine
AFTER INSERT OR UPDATE OR DELETE ON consegne_condivise
FOR EACH ROW
EXECUTE FUNCTION aggiorna_stato_ordine();
```

### Logica di Calcolo

```sql
-- Il trigger aggiorna automaticamente il campo 'stato' così:

IF totale_consegnato = 0 THEN
  stato = 'Aperto'
ELSIF totale_consegnato >= quantita_totale THEN
  stato = 'Completato'
ELSE
  stato = 'Parziale'
END IF
```

---

## ✅ Cosa Devi Fare

### 1. Inserire Consegne

```sql
-- App Esterna: inserisci consegna normalmente
INSERT INTO consegne_condivise (
  ordine_id, 
  data_consegna, 
  quantita_consegnata, 
  app_origine,
  note
) VALUES (
  46,                    -- ID ordine
  '2025-11-05',          -- Data consegna
  50000,                 -- Quantità
  'app_esterna',         -- Origine (IMPORTANTE!)
  'Consegna parziale'    -- Note opzionali
);

-- ✅ Il trigger aggiorna AUTOMATICAMENTE lo stato dell'ordine!
```

### 2. Leggere lo Stato

```sql
-- App Esterna: leggi lo stato (già aggiornato dal trigger)
SELECT 
  id, 
  numero, 
  cliente_nome, 
  quantita_totale,
  stato              -- ✅ Sempre sincronizzato!
FROM ordini 
WHERE id = 46;
```

---

## ❌ Cosa NON Devi Fare

### ❌ NON Impostare Stati Manualmente

```sql
-- ❌ SBAGLIATO - NON FARE MAI QUESTO!
UPDATE ordini 
SET stato = 'Completato' 
WHERE id = 46;

-- Motivo: 
-- 1. Crea inconsistenza con le consegne effettive
-- 2. Delta Futuro e App Esterna vedranno stati diversi
-- 3. Il trigger non può correggere stati impostati manualmente
--    (si attiva solo su INSERT/UPDATE/DELETE di consegne_condivise)
```

### ❌ NON Usare la Tabella `consegne` Locale

```sql
-- ❌ SBAGLIATO - Le consegne locali NON sono visibili a Delta Futuro!
INSERT INTO consegne (...)  -- Tabella locale app esterna

-- ✅ CORRETTO - Usa sempre consegne_condivise
INSERT INTO consegne_condivise (...)  -- Tabella condivisa
```

---

## 🎯 Vantaggi di Questo Sistema

✅ **Coerenza Garantita**  
Entrambe le app vedono lo stesso stato in tempo reale

✅ **Zero Sincronizzazione Manuale**  
Il trigger PostgreSQL fa tutto automaticamente

✅ **Tempo Reale**  
L'aggiornamento è immediato dopo ogni consegna

✅ **Unica Fonte di Verità**  
Le consegne in `consegne_condivise` determinano lo stato

✅ **Nessuna Logica nell'App**  
Basta leggere il campo `stato` - sempre corretto!

---

## 📋 Esempi Completi

### Scenario 1: Prima Consegna Parziale

```sql
-- Ordine: 1.500.000 pezzi, stato attuale: 'Aperto'

-- App Esterna inserisce prima consegna
INSERT INTO consegne_condivise 
VALUES (46, '2025-11-05', 500000, 'app_esterna', 'Prima consegna');

-- ✅ Trigger aggiorna automaticamente:
-- stato = 'Parziale' (500.000 < 1.500.000)

-- Entrambe le app leggono:
SELECT stato FROM ordini WHERE id = 46;
→ 'Parziale' ✅
```

### Scenario 2: Consegna Finale

```sql
-- Ordine: 1.500.000 pezzi
-- Già consegnato: 500.000 (da app_esterna)
-- Residuo: 1.000.000

-- Delta Futuro inserisce consegna finale
INSERT INTO consegne_condivise 
VALUES (46, '2025-11-10', 1000000, 'delta_futuro', 'Consegna finale');

-- ✅ Trigger aggiorna automaticamente:
-- Totale consegnato: 500.000 + 1.000.000 = 1.500.000
-- stato = 'Completato' (1.500.000 >= 1.500.000)

-- Entrambe le app leggono:
SELECT stato FROM ordini WHERE id = 46;
→ 'Completato' ✅
```

### Scenario 3: Correzione Consegna

```sql
-- Ordine completato per errore, devo correggere

-- ❌ NON FARE: UPDATE ordini SET stato = 'Parziale'

-- ✅ FARE: Correggi la consegna errata
UPDATE consegne_condivise 
SET quantita_consegnata = 400000  -- Era 500000
WHERE id = 123;

-- ✅ Trigger ricalcola automaticamente lo stato!
-- Nuovo totale: 400.000 + 1.000.000 = 1.400.000
-- stato = 'Parziale' (1.400.000 < 1.500.000)
```

---

## 🆘 Supporto

In caso di dubbi o problemi con la gestione stati:

1. **Verifica le consegne effettive:**
   ```sql
   SELECT ordine_id, SUM(quantita_consegnata) as totale
   FROM consegne_condivise
   WHERE ordine_id = 46
   GROUP BY ordine_id;
   ```

2. **Forza il ricalcolo (se necessario):**
   ```sql
   -- Trigger un UPDATE dummy per ricalcolare
   UPDATE consegne_condivise 
   SET updated_at = NOW() 
   WHERE ordine_id = 46 
   LIMIT 1;
   ```

3. **Contatta il team Delta Futuro** per supporto tecnico

---

**Data Aggiornamento:** 2025-11-01  
**Versione:** 1.0  
**Stato:** ✅ Attivo in Produzione
