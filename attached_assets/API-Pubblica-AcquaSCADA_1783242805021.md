# API Pubblica AcquaSCADA Delta Futuro — Guida per lo sviluppatore

Documento di integrazione per l'accesso in sola lettura ai dati della sonda ossigeno
DFRobot SEN0681 e ai livelli idrici (vasca idrovore e laguna) del sistema SCADA.

Versione API: **v1** — Ultimo aggiornamento: 05/07/2026

---

## 1. Informazioni generali

| Voce | Valore |
|---|---|
| Base URL | `https://supervisore-delta-futuro-copia.replit.app` |
| Protocollo | HTTPS (obbligatorio) |
| Formato risposte | JSON (UTF-8) |
| Metodi consentiti | Solo `GET` (API in sola lettura) |
| Autenticazione | Header `X-API-Key` su ogni richiesta |
| Frequenza aggiornamento dati | ~5 secondi (dati provenienti dall'impianto) |
| Frequenza interrogazione consigliata | Ogni 5–30 secondi per i dati attuali |

### Autenticazione

Ogni richiesta deve includere l'header:

```
X-API-Key: <CHIAVE_FORNITA_SEPARATAMENTE>
```

La chiave viene consegnata dal gestore dell'impianto attraverso un canale riservato
(NON è inclusa in questo documento). Senza chiave o con chiave errata la risposta è
`401 Unauthorized`.

**Nota di sicurezza:** conservare la chiave in una variabile d'ambiente o in un
secret manager, mai nel codice sorgente o in repository.

---

## 2. Endpoint: dati attuali

### `GET /api/public/v1/measurements`

Restituisce gli ultimi valori noti di tutti i parametri.

**Esempio richiesta:**

```bash
curl -H "X-API-Key: LA_CHIAVE" \
  https://supervisore-delta-futuro-copia.replit.app/api/public/v1/measurements
```

**Esempio risposta (200):**

```json
{
  "timestamp": "2026-07-05T09:04:47.732Z",
  "oxygenProbe": {
    "status": "online",
    "saturation": 93.22,
    "dissolvedOxygen": 6.08,
    "temperature": 28.76,
    "unit": { "saturation": "%", "dissolvedOxygen": "mg/L", "temperature": "°C" },
    "lastUpdate": "2026-07-05T09:04:45.135Z"
  },
  "levels": {
    "vasca":  { "value": 163.55, "unit": "cm", "lastUpdate": "2026-07-05T09:04:45.135Z" },
    "laguna": { "value": 128.22, "unit": "cm", "lastUpdate": "2026-07-05T09:04:45.135Z" }
  },
  "source": { "bridgeStatus": "online", "lastError": null }
}
```

**Descrizione dei campi:**

| Campo | Tipo | Descrizione |
|---|---|---|
| `timestamp` | string ISO 8601 | Ora del server al momento della risposta (UTC) |
| `oxygenProbe.status` | `"online"` \| `"offline"` | Stato della sonda SEN0681 |
| `oxygenProbe.saturation` | number \| null | Saturazione ossigeno in % (es. 93.22) |
| `oxygenProbe.dissolvedOxygen` | number \| null | Ossigeno disciolto in mg/L |
| `oxygenProbe.temperature` | number \| null | Temperatura acqua in °C |
| `oxygenProbe.lastUpdate` | string \| null | Timestamp dell'ultima lettura ricevuta |
| `levels.vasca.value` | number \| null | Livello vasca idrovore in cm |
| `levels.laguna.value` | number \| null | Livello laguna in cm |
| `source.bridgeStatus` | `"online"` \| `"offline"` | Stato del collegamento con l'impianto |
| `source.lastError` | string \| null | Ultimo errore di comunicazione (se presente) |

**Importante:** se `oxygenProbe.status` o `source.bridgeStatus` sono `"offline"`,
i valori restituiti sono gli **ultimi noti** — controllare sempre `lastUpdate`
per valutare la freschezza del dato. I valori possono essere `null` se non è mai
arrivata una lettura dall'avvio del server.

---

## 3. Endpoint: dati storici

### `GET /api/public/v1/history`

Restituisce le letture storiche di un singolo parametro, ordinate dalla più
vecchia alla più recente.

**Parametri query:**

| Parametro | Obbligatorio | Valori ammessi | Descrizione |
|---|---|---|---|
| `parameter` | sì | `o2sat`, `o2mgl`, `o2temp`, `vasca`, `laguna` | Grandezza richiesta |
| `from` | no | data ISO 8601 (es. `2026-07-01T00:00:00Z`) | Inizio intervallo (incluso) |
| `to` | no | data ISO 8601 | Fine intervallo (incluso) |
| `limit` | no | intero 1–5000 (default 1000) | Numero massimo di letture |

**Significato dei parametri:**

| Valore | Grandezza | Unità |
|---|---|---|
| `o2sat` | Saturazione O₂ sonda SEN0681 | % |
| `o2mgl` | Ossigeno disciolto sonda SEN0681 | mg/L |
| `o2temp` | Temperatura acqua sonda SEN0681 | °C |
| `vasca` | Livello vasca idrovore | cm |
| `laguna` | Livello laguna | cm |

**Esempio — ossigeno disciolto delle ultime 24 ore:**

```bash
curl -H "X-API-Key: LA_CHIAVE" \
  "https://supervisore-delta-futuro-copia.replit.app/api/public/v1/history?parameter=o2mgl&from=2026-07-04T10:00:00Z&to=2026-07-05T10:00:00Z"
```

**Esempio risposta (200):**

```json
{
  "parameter": "o2mgl",
  "description": "Ossigeno disciolto sonda SEN0681",
  "unit": "mg/L",
  "from": "2026-07-04T10:00:00.000Z",
  "to": "2026-07-05T10:00:00.000Z",
  "count": 2,
  "readings": [
    { "value": 6.01, "timestamp": "2026-07-04T10:00:05.197Z" },
    { "value": 6.02, "timestamp": "2026-07-04T10:00:10.183Z" }
  ]
}
```

**Note:**
- Le letture sono campionate ogni ~5 secondi: per intervalli lunghi usare `limit`
  o suddividere in più richieste (es. 24 h ≈ 17.000 letture, oltre il limite di 5000).
- Se il numero di letture nell'intervallo supera `limit`, vengono restituite le
  **più recenti** dell'intervallo.
- Tutti i timestamp sono in **UTC**. Convertire al fuso locale (Europe/Rome) lato client.

---

## 4. Codici di errore

| Codice | Significato | Azione consigliata |
|---|---|---|
| `401` | API key mancante o errata | Verificare l'header `X-API-Key` |
| `400` | Parametro, data o limit non valido | Il campo `error` della risposta spiega cosa correggere |
| `503` | Servizio non ancora pronto (avvio in corso) | Riprovare dopo qualche secondo |
| `500` | Errore interno | Riprovare; se persiste, segnalare al gestore |

Formato errore:

```json
{ "error": "descrizione del problema" }
```

---

## 5. Esempi di integrazione

### JavaScript (fetch)

```javascript
const BASE_URL = "https://supervisore-delta-futuro-copia.replit.app";
const API_KEY = process.env.ACQUASCADA_API_KEY; // mai hardcoded!

async function getMeasurements() {
  const res = await fetch(`${BASE_URL}/api/public/v1/measurements`, {
    headers: { "X-API-Key": API_KEY },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function getHistory(parameter, fromISO, toISO) {
  const url = new URL(`${BASE_URL}/api/public/v1/history`);
  url.searchParams.set("parameter", parameter);
  if (fromISO) url.searchParams.set("from", fromISO);
  if (toISO) url.searchParams.set("to", toISO);
  const res = await fetch(url, { headers: { "X-API-Key": API_KEY } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
```

### Python (requests)

```python
import os
import requests

BASE_URL = "https://supervisore-delta-futuro-copia.replit.app"
API_KEY = os.environ["ACQUASCADA_API_KEY"]  # mai hardcoded!
HEADERS = {"X-API-Key": API_KEY}

def get_measurements():
    r = requests.get(f"{BASE_URL}/api/public/v1/measurements", headers=HEADERS, timeout=10)
    r.raise_for_status()
    return r.json()

def get_history(parameter, from_iso=None, to_iso=None, limit=1000):
    params = {"parameter": parameter, "limit": limit}
    if from_iso: params["from"] = from_iso
    if to_iso: params["to"] = to_iso
    r = requests.get(f"{BASE_URL}/api/public/v1/history", headers=HEADERS, params=params, timeout=10)
    r.raise_for_status()
    return r.json()
```

---

## 6. Contatti e supporto

- La chiave API viene fornita e ruotata dal gestore dell'impianto.
- In caso di risposta `503` persistente o dati fermi (lastUpdate vecchio),
  contattare il gestore: probabilmente il PC dell'impianto o il collegamento
  è temporaneamente fuori servizio.
- Eventuali estensioni (nuovi parametri, altri sensori) manterranno la
  compatibilità: lo schema `/api/public/v1/` non subirà modifiche breaking.
