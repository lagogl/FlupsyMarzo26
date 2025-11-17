# Analisi Integrità Dati - Tabella Sizes

## 🔴 PROBLEMA CRITICO IDENTIFICATO

La tabella `sizes` ha un **problema di integrità referenziale** che può causare inconsistenze nei dati storici se un operatore modifica i range di animali per kg (`minAnimalsPerKg`, `maxAnimalsPerKg`) di una taglia esistente.

---

## 📊 Struttura Attuale

### Schema Database

```typescript
// Tabella sizes
export const sizes = pgTable("sizes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  sizeMm: real("size_mm"),
  minAnimalsPerKg: integer("min_animals_per_kg"),  // ⚠️ Modificabile
  maxAnimalsPerKg: integer("max_animals_per_kg"),  // ⚠️ Modificabile
  notes: text("notes"),
  color: text("color")
});

// Tabella operations
export const operations = pgTable("operations", {
  id: serial("id").primaryKey(),
  sizeId: integer("size_id"),  // ⚠️ NESSUN FOREIGN KEY CONSTRAINT
  animalsPerKg: integer("animals_per_kg"),
  // ... altri campi
});
```

### ⚠️ Problemi Identificati

1. **Nessun Foreign Key Constraint**: La colonna `operations.sizeId` non ha vincolo di chiave esterna verso `sizes.id`
2. **Nessun Trigger di Protezione**: Non esistono trigger che impediscono modifiche ai range delle taglie
3. **Nessuna Validazione Storica**: Il sistema non verifica la coerenza dei dati storici dopo modifiche

---

## 🚨 Scenari Problematici

### Scenario 1: Modifica Range Taglia Esistente

**Stato iniziale:**
```
Size: TP-3000
- minAnimalsPerKg: 3000
- maxAnimalsPerKg: 5000

Operazione #123 (storica):
- sizeId: 5 (TP-3000)
- animalsPerKg: 4500  ✅ Coerente con range 3000-5000
```

**Dopo modifica da operatore:**
```
Size: TP-3000 (ID rimane 5)
- minAnimalsPerKg: 6000  ⚠️ MODIFICATO
- maxAnimalsPerKg: 8000  ⚠️ MODIFICATO

Operazione #123 (storica):
- sizeId: 5 (TP-3000)
- animalsPerKg: 4500  ❌ INCOERENTE! Fuori dal nuovo range 6000-8000
```

**Conseguenze:**
- ❌ I dati storici diventano incoerenti
- ❌ Le validazioni falliscono sui dati esistenti
- ❌ I report storici mostrano inconsistenze
- ❌ Le proiezioni di crescita usano range sbagliati

### Scenario 2: Ricalcolo Automatico Taglia

Il sistema ricalcola automaticamente `sizeId` quando viene modificato `animalsPerKg`:

```typescript
// server/db-storage.ts:737-747
const matchingSize = allSizes.find(size => 
  size.minAnimalsPerKg !== null && 
  size.maxAnimalsPerKg !== null && 
  updateData.animalsPerKg! >= size.minAnimalsPerKg && 
  updateData.animalsPerKg! <= size.maxAnimalsPerKg
);
```

**Problema:**
- Se i range delle sizes vengono modificati, il ricalcolo automatico potrebbe assegnare taglie diverse a operazioni identiche
- Operazioni storiche immutate diventano "sbagliate" rispetto ai nuovi range

---

## 💻 Punti Critici nel Codice

### 1. Calcolo Automatico Taglia (server/db-storage.ts)

**Riga 621-627**: Creazione operazione
```typescript
const matchingSize = allSizes.find(size => 
  size.minAnimalsPerKg !== null && 
  size.maxAnimalsPerKg !== null && 
  operationData.animalsPerKg! >= size.minAnimalsPerKg && 
  operationData.animalsPerKg! <= size.maxAnimalsPerKg
);
```

**Riga 737-747**: Aggiornamento operazione
```typescript
const matchingSize = allSizes.find(size => 
  size.minAnimalsPerKg !== null && 
  size.maxAnimalsPerKg !== null && 
  updateData.animalsPerKg! >= size.minAnimalsPerKg && 
  updateData.animalsPerKg! <= size.maxAnimalsPerKg
);
```

### 2. Validazione Range (server/db-storage.ts)

**Riga 638-647**: Verifica coerenza taglia assegnata
```typescript
const isInRange = operationData.animalsPerKg >= assignedSize.minAnimalsPerKg && 
                  operationData.animalsPerKg <= assignedSize.maxAnimalsPerKg;

if (!isInRange) {
  console.log(`Attenzione: La taglia assegnata ${assignedSize.code} non corrisponde`);
  // Trova la taglia corretta e sostituisce
}
```

### 3. Proiezioni di Crescita (server/routes.ts)

**Riga 4547-4551**: Matching taglia per previsioni
```typescript
const matchingSize = allSizes.find(size => {
  const minBound = size.minAnimalsPerKg || 0;
  const maxBound = size.maxAnimalsPerKg || Infinity;
  return lastMeasurement.animalsPerKg! >= minBound && lastMeasurement.animalsPerKg! <= maxBound;
});
```

**Riga 5251-5255**: Filtro taglie valide per previsioni
```typescript
const validSizes = allSizes.filter(size => {
  if (!size.minAnimalsPerKg || !targetSize.minAnimalsPerKg) return false;
  return size.minAnimalsPerKg <= targetSize.minAnimalsPerKg;
});
```

---

## 🛡️ Soluzioni Proposte

### Soluzione 1: Foreign Key + Trigger di Protezione (CONSIGLIATA)

**Implementazione:**

```sql
-- 1. Aggiungi foreign key constraint
ALTER TABLE operations 
ADD CONSTRAINT fk_operations_size 
FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE RESTRICT;

-- 2. Crea trigger che impedisce modifiche ai range se esistono operazioni collegate
CREATE OR REPLACE FUNCTION prevent_size_range_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Controlla se ci sono operazioni che usano questa taglia
  IF EXISTS (SELECT 1 FROM operations WHERE size_id = NEW.id) THEN
    -- Impedisci modifiche ai range critici
    IF (OLD.min_animals_per_kg IS DISTINCT FROM NEW.min_animals_per_kg) OR
       (OLD.max_animals_per_kg IS DISTINCT FROM NEW.max_animals_per_kg) THEN
      RAISE EXCEPTION 'Impossibile modificare i range di una taglia con operazioni esistenti. Size ID: %, Operazioni collegate: %',
        NEW.id,
        (SELECT COUNT(*) FROM operations WHERE size_id = NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_size_ranges
BEFORE UPDATE ON sizes
FOR EACH ROW
EXECUTE FUNCTION prevent_size_range_modification();
```

**Vantaggi:**
- ✅ Protezione totale a livello database
- ✅ Impedisce modifiche accidentali
- ✅ Messaggio di errore chiaro
- ✅ Mantiene integrità referenziale

**Svantaggi:**
- ⚠️ Impossibilità di correggere errori su taglie esistenti
- ⚠️ Richiede processo di migrazione per modifiche necessarie

---

### Soluzione 2: Storicizzazione Range (ALTERNATIVA COMPLESSA)

**Implementazione:**

```sql
-- Nuova tabella per storicizzare i range delle taglie
CREATE TABLE size_range_history (
  id SERIAL PRIMARY KEY,
  size_id INTEGER NOT NULL REFERENCES sizes(id),
  min_animals_per_kg INTEGER,
  max_animals_per_kg INTEGER,
  valid_from TIMESTAMP NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMP,
  modified_by INTEGER REFERENCES users(id),
  notes TEXT
);

-- Trigger per storicizzare modifiche
CREATE OR REPLACE FUNCTION archive_size_range_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Se i range cambiano, archivia il range vecchio
  IF (OLD.min_animals_per_kg IS DISTINCT FROM NEW.min_animals_per_kg) OR
     (OLD.max_animals_per_kg IS DISTINCT FROM NEW.max_animals_per_kg) THEN
    
    -- Chiudi il periodo di validità del range precedente
    UPDATE size_range_history
    SET valid_to = NOW()
    WHERE size_id = OLD.id AND valid_to IS NULL;
    
    -- Archivia il nuovo range
    INSERT INTO size_range_history (
      size_id, min_animals_per_kg, max_animals_per_kg, valid_from
    ) VALUES (
      NEW.id, NEW.min_animals_per_kg, NEW.max_animals_per_kg, NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Vantaggi:**
- ✅ Mantiene storico completo delle modifiche
- ✅ Permette validazione temporale corretta
- ✅ Possibilità di audit trail completo

**Svantaggi:**
- ⚠️ Complessità elevata
- ⚠️ Richiede refactoring significativo del codice
- ⚠️ Maggiore overhead per query

---

### Soluzione 3: Validazione e Alert (MINIMALE)

**Implementazione:**

```typescript
// server/db-storage.ts - Nuovo metodo di validazione
async validateSizeConsistency(sizeId: number): Promise<{
  isValid: boolean;
  inconsistentOperations: number[];
  details: string;
}> {
  const size = await this.getSize(sizeId);
  if (!size) return { isValid: false, inconsistentOperations: [], details: 'Size not found' };

  const operations = await db
    .select()
    .from(operations)
    .where(eq(operations.sizeId, sizeId));

  const inconsistent = operations.filter(op => 
    op.animalsPerKg && size.minAnimalsPerKg && size.maxAnimalsPerKg &&
    (op.animalsPerKg < size.minAnimalsPerKg || op.animalsPerKg > size.maxAnimalsPerKg)
  );

  return {
    isValid: inconsistent.length === 0,
    inconsistentOperations: inconsistent.map(op => op.id),
    details: `Found ${inconsistent.length} inconsistent operations for size ${size.code}`
  };
}

// Chiamata prima di salvare modifiche alla size
async updateSize(id: number, updates: Partial<Size>): Promise<void> {
  // Se si modificano i range, valida prima
  if (updates.minAnimalsPerKg || updates.maxAnimalsPerKg) {
    const validation = await this.validateSizeConsistency(id);
    if (!validation.isValid) {
      throw new Error(
        `Impossibile modificare i range: ${validation.inconsistentOperations.length} operazioni diventerebbero incoerenti. ` +
        `IDs: ${validation.inconsistentOperations.join(', ')}`
      );
    }
  }
  
  // Procedi con l'aggiornamento
  await db.update(sizes).set(updates).where(eq(sizes.id, id));
}
```

**Vantaggi:**
- ✅ Implementazione rapida
- ✅ Nessuna modifica allo schema database
- ✅ Messaggi di errore informativi

**Svantaggi:**
- ⚠️ Protezione solo a livello applicazione
- ⚠️ Vulnerabile a modifiche dirette al database
- ⚠️ Non previene race conditions

---

## 📋 Raccomandazioni Immediate

### Urgenti (Da implementare subito):

1. **✅ Aggiungi Foreign Key Constraint**
   ```bash
   npm run db:push --force
   ```
   Dopo aver aggiunto alla schema:
   ```typescript
   export const operations = pgTable("operations", {
     // ... campi esistenti
     sizeId: integer("size_id").references(() => sizes.id, { onDelete: 'restrict' }),
   });
   ```

2. **✅ Implementa Trigger di Protezione** (Soluzione 1)

3. **✅ Crea Documentazione per Operatori**
   - Spiega che **i range delle taglie NON devono essere modificati**
   - Se necessario correggere errori, contattare l'amministratore
   - Creare nuove taglie invece di modificare esistenti

### Medio Termine:

4. **📊 Report di Audit**
   - Script per verificare coerenza dati esistenti
   - Alert automatici per inconsistenze

5. **🔒 UI con Warning**
   - Mostrare alert nell'interfaccia di modifica sizes
   - Richiedere conferma esplicita per modifiche ai range
   - Mostrare numero di operazioni che verrebbero impattate

---

## 🔍 Script di Verifica Integrità

```sql
-- Verifica operazioni con sizeId incoerente rispetto ai range attuali
SELECT 
  o.id AS operation_id,
  o.date,
  o.animals_per_kg,
  s.code AS size_code,
  s.min_animals_per_kg,
  s.max_animals_per_kg,
  CASE 
    WHEN o.animals_per_kg < s.min_animals_per_kg THEN 'Sotto range minimo'
    WHEN o.animals_per_kg > s.max_animals_per_kg THEN 'Sopra range massimo'
  END AS issue
FROM operations o
JOIN sizes s ON o.size_id = s.id
WHERE o.animals_per_kg IS NOT NULL
  AND s.min_animals_per_kg IS NOT NULL
  AND s.max_animals_per_kg IS NOT NULL
  AND (
    o.animals_per_kg < s.min_animals_per_kg OR 
    o.animals_per_kg > s.max_animals_per_kg
  )
ORDER BY o.date DESC;
```

---

## ✅ IMPLEMENTAZIONE COMPLETATA (2025-11-17)

### Protezione Attivata

✅ **Foreign Key Constraint** applicato  
✅ **Trigger PostgreSQL** attivo  
✅ **Test di funzionamento** superati  

### Test Eseguiti

#### Test 1: Modifica Taglia SENZA Operazioni ✅
```sql
UPDATE sizes SET min_animals_per_kg = 999999 WHERE code = 'TP-1000';
-- RISULTATO: SUCCESS ✅ Modifiche consentite
```

#### Test 2: Modifica Taglia CON Operazioni ❌
```sql
-- Creata operazione: id=17, size_id=9 (TP-1000)
UPDATE sizes SET min_animals_per_kg = 999999 WHERE code = 'TP-1000';
-- RISULTATO: ERROR ⛔ 
-- Messaggio: "Impossibile modificare i range di una taglia con operazioni esistenti.
--             Taglia: TP-1000 (ID: 9), Operazioni collegate: 1"
```

#### Test 3: Modifica Nome/Colore di Taglia CON Operazioni ✅
```sql
UPDATE sizes SET name = 'TP-1000 MODIFICATO', color = '#00FF00' WHERE code = 'TP-1000';
-- RISULTATO: SUCCESS ✅ Solo range protetti, altri campi modificabili
```

### Oggetti Database Creati

1. **Foreign Key**: `fk_operations_size`
   - Da: `operations.size_id`
   - A: `sizes.id`
   - Opzione: `ON DELETE RESTRICT`

2. **Funzione**: `prevent_size_range_modification()`
   - Verifica conteggio operazioni collegate
   - Blocca modifiche a `min_animals_per_kg` e `max_animals_per_kg`
   - Permette modifiche a `name`, `color`, `notes`

3. **Trigger**: `protect_size_ranges`
   - Tipo: `BEFORE UPDATE` su tabella `sizes`
   - Esegue: `prevent_size_range_modification()`

### Comportamento Sistema

#### ✅ CONSENTITO
- Creare nuove taglie
- Modificare range di taglie MAI usate in operazioni
- Modificare nome, colore, note di qualsiasi taglia
- Eliminare taglie senza operazioni

#### ❌ BLOCCATO
- Modificare `minAnimalsPerKg` di taglie con operazioni
- Modificare `maxAnimalsPerKg` di taglie con operazioni
- Eliminare taglie con operazioni (foreign key restrict)

### Messaggio Errore Utente

Quando un operatore tenta di modificare i range di una taglia protetta:

```
⛔ PROTEZIONE DATI: Impossibile modificare i range di una taglia con operazioni esistenti.

Taglia: TP-3000 (ID: 5)
Operazioni collegate: 47

I range (minAnimalsPerKg/maxAnimalsPerKg) sono protetti per garantire l'integrità storica dei dati.

Per correggere errori:
1. Contatta l'amministratore di sistema
2. Oppure crea una nuova taglia con i range corretti

Modifiche consentite: nome, colore, note (non impattano i calcoli)
```

## ✅ Conclusioni

**La protezione è stata implementata con successo e testata.**

Il sistema ora:
- ✅ Impedisce modifiche pericolose ai range delle taglie
- ✅ Mantiene integrità referenziale tra operations e sizes
- ✅ Fornisce messaggi di errore chiari e informativi
- ✅ Permette modifiche non critiche (nome, colore, note)
- ✅ Protegge i dati storici da inconsistenze accidentali

**Nessuna ulteriore azione richiesta.** La protezione è attiva e funzionante.
