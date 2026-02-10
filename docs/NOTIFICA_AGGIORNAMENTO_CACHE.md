# Notifica Aggiornamento Cache - Guida per App Esterna

**Versione:** 1.0  
**Data:** 10 Febbraio 2026  
**Target:** Sviluppatori App Esterna (FLUPSY Mobile)

---

## Contesto

L'applicazione FLUPSY utilizza un sistema di cache server-side per migliorare le performance. Quando l'app esterna inserisce o modifica dati direttamente nel database condiviso, la cache potrebbe contenere dati non aggiornati.

**Soluzione implementata:**
1. **TTL ridotti a 60 secondi** - Anche senza notifica, i dati si aggiornano automaticamente entro 1 minuto
2. **Endpoint di notifica** - Per aggiornamento immediato (< 1 secondo), l'app esterna può chiamare un endpoint dedicato dopo ogni scrittura nel database

---

## Endpoint di Notifica

### `POST /api/external/notify-update`

Questo endpoint invalida tutte le cache dell'applicazione e notifica tutti i client connessi via WebSocket di ricaricare i dati.

### Autenticazione

L'endpoint richiede una API key nell'header `x-api-key`. La chiave verrà comunicata separatamente in modo sicuro.

```
x-api-key: <API_KEY_FORNITA>
```

### Headers richiesti

| Header         | Valore                          | Obbligatorio |
|---------------|----------------------------------|-------------|
| `Content-Type` | `application/json`              | Sì          |
| `x-api-key`    | Chiave API fornita separatamente | Sì          |

### Body (opzionale)

Il body è opzionale ma consigliato per tracciabilità nei log del server.

```json
{
  "source": "flupsy_mobile",
  "entity": "operations",
  "action": "insert",
  "details": "Inserita operazione PESO per cestello #42"
}
```

| Campo     | Tipo   | Descrizione                                         |
|-----------|--------|-----------------------------------------------------|
| `source`  | string | Identificativo dell'app chiamante (es. `flupsy_mobile`) |
| `entity`  | string | Tipo di entità modificata: `operations`, `baskets`, `cycles`, `all` |
| `action`  | string | Tipo di azione: `insert`, `update`, `delete`        |
| `details` | string | Descrizione leggibile dell'operazione               |

### Risposta di successo (200)

```json
{
  "success": true,
  "message": "Cache invalidated and clients notified",
  "clientsNotified": 3,
  "timestamp": "2026-02-10T12:00:00.000Z"
}
```

### Risposte di errore

| Codice | Significato                          | Body                                                    |
|--------|--------------------------------------|----------------------------------------------------------|
| 401    | API key mancante o non valida        | `{ "success": false, "error": "Unauthorized: invalid or missing API key" }` |
| 500    | Errore interno del server            | `{ "success": false, "error": "..." }`                  |

---

## Esempi di Integrazione

### cURL

```bash
curl -X POST https://YOUR_APP_URL/api/external/notify-update \
  -H "Content-Type: application/json" \
  -H "x-api-key: <API_KEY_FORNITA>" \
  -d '{
    "source": "flupsy_mobile",
    "entity": "operations",
    "action": "insert",
    "details": "Inserita operazione PESO"
  }'
```

### JavaScript / Node.js (fetch)

```javascript
async function notifyFlupsyUpdate(entity, action, details) {
  try {
    const response = await fetch('https://YOUR_APP_URL/api/external/notify-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.FLUPSY_NOTIFY_API_KEY  // Chiave fornita separatamente
      },
      body: JSON.stringify({
        source: 'flupsy_mobile',
        entity: entity,       // es. 'operations'
        action: action,       // es. 'insert'
        details: details      // es. 'Inserita operazione PESO per cestello #42'
      })
    });

    const result = await response.json();
    console.log('Notifica inviata:', result);
    return result;
  } catch (error) {
    console.error('Errore invio notifica:', error);
    // Non bloccare il flusso principale se la notifica fallisce
  }
}

// Esempio di utilizzo dopo un INSERT nel database
await insertOperationInDB(operationData);
await notifyFlupsyUpdate('operations', 'insert', `Operazione PESO cestello #${basketId}`);
```

### Python (requests)

```python
import os
import requests

def notify_flupsy_update(entity, action, details=""):
    try:
        response = requests.post(
            'https://YOUR_APP_URL/api/external/notify-update',
            headers={
                'Content-Type': 'application/json',
                'x-api-key': os.environ.get('FLUPSY_NOTIFY_API_KEY')  # Chiave fornita separatamente
            },
            json={
                'source': 'flupsy_mobile',
                'entity': entity,
                'action': action,
                'details': details
            },
            timeout=5
        )
        return response.json()
    except Exception as e:
        print(f"Errore notifica: {e}")
        # Non bloccare il flusso principale

# Esempio di utilizzo
insert_operation_in_db(operation_data)
notify_flupsy_update('operations', 'insert', f'Operazione PESO cestello #{basket_id}')
```

---

## Flusso Consigliato

```
App Esterna                     Database                    FLUPSY Server
    |                              |                              |
    |--- INSERT operazione ------->|                              |
    |                              |                              |
    |--- POST /api/external/notify-update ---------------------->|
    |                              |                   Invalida cache
    |                              |                   Notifica WebSocket
    |<---------------------------------------- 200 OK ------------|
    |                              |                              |
    |                              |        Client riceve WebSocket
    |                              |        e ricarica i dati
```

---

## Note Importanti

1. **La notifica non è bloccante**: Se la chiamata al notify fallisce, i dati si aggiorneranno comunque entro 60 secondi grazie al TTL ridotto delle cache.

2. **Non necessita di dati nel body**: Se non volete tracciare i dettagli, potete inviare una POST vuota con solo l'header `x-api-key`.

3. **Latenza**: La chiamata impiega tipicamente < 100ms. Si consiglia un timeout di 5 secondi per sicurezza.

4. **Rate limiting**: Non c'è rate limiting su questo endpoint, ma si consiglia di non chiamarlo più di una volta al secondo per evitare invalidazioni eccessive.

5. **URL di produzione**: Sostituire `YOUR_APP_URL` con l'URL effettivo dell'applicazione FLUPSY.
