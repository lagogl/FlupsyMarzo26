# Guida Importazione Campo OGGETTO da Fatture in Cloud

## Problema
Il campo "OGGETTO" visibile nell'interfaccia di Fatture in Cloud non viene restituito dalla chiamata API base per gli ordini.

## Soluzione

### 1. Campo API Corretto
Il campo OGGETTO di Fatture in Cloud è disponibile in **due possibili campi** nella risposta API:
- `subject` - Campo OGGETTO principale
- `visible_subject` - Campo OGGETTO visibile (priorità)

**Importante**: La chiamata API base (`GET /issued_documents?type=order`) **NON** include questi campi. Devi usare il parametro `fieldset=detailed`.

### 2. Chiamata API Corretta

```javascript
// ❌ SBAGLIATO - Non include subject/visible_subject
GET /c/{company_id}/issued_documents?type=order

// ✅ CORRETTO - Include subject/visible_subject
GET /c/{company_id}/issued_documents/{document_id}?fieldset=detailed
```

### 3. Esempio Implementazione Backend

```javascript
// Recupera l'ordine con dettagli completi
const dettagliOrdine = await apiRequest(
  'GET', 
  `/issued_documents/${ordineFIC.id}?fieldset=detailed`
);

const ordineCompleto = dettagliOrdine.data.data;

// Estrai OGGETTO con fallback
const oggetto = ordineCompleto.subject || ordineCompleto.visible_subject || null;

// Salva nel database (campo 'note' nella tabella ordini)
await db.update(ordini).set({
  note: oggetto ? oggetto : null
});
```

### 4. Struttura Dati API

Quando chiami l'API con `fieldset=detailed`, ottieni:

```json
{
  "data": {
    "id": 474521659,
    "type": "order",
    "subject": "",
    "visible_subject": "SEME RUDITAPES PHILIPPINARUM",
    "notes": "",
    "items_list": [...],
    ...
  }
}
```

### 5. Mapping Database

Il campo OGGETTO viene salvato nella colonna `note` della tabella `ordini`:

```sql
CREATE TABLE ordini (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(50),
  cliente_nome TEXT,
  note TEXT,  -- ← OGGETTO da FIC (subject o visible_subject)
  ...
);
```

### 6. Visualizzazione Frontend (React/TypeScript)

```tsx
// Interfaccia TypeScript
interface Ordine {
  clienteNome: string;
  note: string | null;  // OGGETTO
  ...
}

// Componente UI
<td className="p-2 border-r group">
  <div className="flex flex-col gap-0.5">
    {/* Nome Cliente */}
    <div className="text-sm font-medium">
      {ordine.clienteNome || '-'}
    </div>
    
    {/* OGGETTO - Sottotitolo espandibile */}
    {ordine.note && (
      <div className="text-xs text-muted-foreground italic max-w-[200px] truncate group-hover:whitespace-normal group-hover:max-w-none transition-all duration-200">
        {ordine.note}
      </div>
    )}
  </div>
</td>
```

### 7. CSS per Espansione al Hover

```css
.group:hover .group-hover\:whitespace-normal {
  white-space: normal;
}

.group:hover .group-hover\:max-w-none {
  max-width: none;
}
```

## Comportamento Visivo

- **Stato normale**: Testo troncato con `...` se troppo lungo
- **Hover**: Testo si espande mostrando tutto il contenuto
- **Stile**: Grigio, italic, dimensione ridotta (xs)

## Note Importanti

1. **Priorità dei campi**: Usa `visible_subject` come primo fallback, poi `subject`
2. **Chiamata API**: Usa sempre `fieldset=detailed` per avere i campi completi
3. **Performance**: Fai questa chiamata solo durante la sincronizzazione, non ad ogni caricamento
4. **Null safety**: Gestisci sempre il caso in cui il campo sia vuoto o null

## Esempio Completo di Sincronizzazione

```javascript
async function sincronizzaOrdine(ordineFIC) {
  // 1. Salva dati base ordine (senza OGGETTO)
  const ordineId = await db.insert(ordini).values({
    numero: ordineFIC.number,
    clienteNome: ordineFIC.entity?.name,
    note: null,  // Verrà popolato dopo
    ...
  }).returning({ id: ordini.id });

  // 2. Recupera dettagli completi con fieldset=detailed
  const dettagli = await apiRequest(
    'GET',
    `/issued_documents/${ordineFIC.id}?fieldset=detailed`
  );

  const ordineCompleto = dettagli.data.data;

  // 3. Estrai OGGETTO
  const oggetto = ordineCompleto.subject || ordineCompleto.visible_subject || null;

  // 4. Aggiorna ordine con OGGETTO
  await db.update(ordini)
    .set({ note: oggetto })
    .where(eq(ordini.id, ordineId));
}
```

## Verifica Funzionamento

Per verificare che l'importazione funzioni:

1. Compila il campo OGGETTO in un ordine su Fatture in Cloud
2. Esegui la sincronizzazione
3. Controlla il database:
   ```sql
   SELECT id, numero, cliente_nome, note FROM ordini;
   ```
4. Verifica che il campo `note` contenga il valore OGGETTO

## Troubleshooting

**Problema**: Il campo OGGETTO è sempre vuoto

**Soluzioni**:
1. Verifica di usare `fieldset=detailed` nella chiamata API
2. Controlla che il campo OGGETTO sia compilato su Fatture in Cloud
3. Verifica il fallback: `subject || visible_subject`
4. Controlla i log per vedere i valori restituiti dall'API

---

**Data**: 2025-11-01  
**Versione**: 1.0
