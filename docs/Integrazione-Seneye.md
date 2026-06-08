# Integrazione sonda Seneye "DF SIFONI"

Documento tecnico per spiegare a uno sviluppatore esterno come è stata risolta
l'integrazione con l'API Seneye.
Versione: 1.0 — Giugno 2026

---

## 1. In sintesi

L'API Seneye espone i parametri ambientali letti da una sonda (temperatura, pH,
ammoniaca, ossigeno, luce…). L'integrazione si basa su 3 idee:

1. **Autenticazione tramite `user` + `pwd` in querystring** (nessun token/OAuth).
2. **Identificazione della sonda per NOME** ("DF SIFONI"), non per ID fisso → più
   robusto se l'hardware cambia.
3. **Due chiamate in sequenza**: prima si ricava l'id della sonda, poi si leggono i
   valori; infine si normalizzano numeri e trend.

In più, lato applicazione, le letture vengono **salvate periodicamente in un
database** per costruire lo storico (grafici/tabelle) e per avere un fallback se
l'API è momentaneamente irraggiungibile.

---

## 2. API Seneye — riferimento

| | |
|---|---|
| **Base URL** | `https://api.seneye.com/v1` |
| **Autenticazione** | parametri querystring `user=<utente>&pwd=<password>` su ogni richiesta |
| **Formato** | JSON (`Accept: application/json`) |

> **Credenziali:** non vanno mai scritte nel codice. Vanno conservate in variabili
> d'ambiente / secret (`SENEYE_USERNAME`, `SENEYE_PASSWORD`).

### 2.1 Elenco dispositivi
```
GET https://api.seneye.com/v1/devices?user=<utente>&pwd=<password>
```
Restituisce un array di sonde. Ogni elemento contiene almeno:
- `id` — identificativo della sonda
- `description` — nome leggibile (es. `"DF SIFONI"`)
- `type`, `time_diff`

**Strategia:** cercare la sonda la cui `description` (normalizzata in maiuscolo e
senza spazi ai bordi) è uguale a `"DF SIFONI"`, prenderne l'`id` e metterlo in
**cache** (gli id sono stabili → non serve richiamare `/devices` ogni volta).

### 2.2 Lettura valori correnti
```
GET https://api.seneye.com/v1/devices/<id>/exps?user=<utente>&pwd=<password>
```
Restituisce un oggetto con un nodo per ciascun parametro. Parametri usati:
`temperature`, `ph`, `nh3`, `nh4`, `o2`, `lux`, `par`, `kelvin`.

Ogni parametro è un oggetto con:
- `curr` — valore attuale
- `avg` — media
- `trend` — andamento

Esempio (semplificato):
```json
{
  "temperature": { "curr": "18.4", "avg": "18.2", "trend": "1" },
  "ph":          { "curr": "8.05", "avg": "8.03", "trend": "0" },
  "nh3":         { "curr": "0.01", "avg": "0.01", "trend": "-1" },
  "o2":          { "curr": "7.9",  "avg": "7.8",  "trend": "1" }
}
```

---

## 3. Normalizzazione dei dati (passaggio importante)

I valori Seneye arrivano a volte come **stringa**, a volte vuoti. Prima di usarli:

- **Numeri:** convertire in numero; se vuoto o non valido → `null`.
- **Trend:** ridurre a 3 valori semplici:
  - `> 0` → `1` (in salita)
  - `< 0` → `-1` (in discesa)
  - `= 0` → `0` (stabile)

Così il resto dell'applicazione lavora sempre con tipi coerenti.

---

## 4. Flusso completo (pseudocodice)

```js
const BASE = "https://api.seneye.com/v1";
const TARGET = "DF SIFONI";

function url(path) {
  const p = new URLSearchParams({ user: USER, pwd: PWD });
  return `${BASE}${path}?${p.toString()}`;
}

// 1) Risolvi l'id della sonda per nome (con cache)
let cachedId = null;
async function resolveDeviceId() {
  if (cachedId) return cachedId;
  const devices = await fetch(url("/devices")).then(r => r.json());
  const match = devices.find(
    d => d.description?.trim().toUpperCase() === TARGET.toUpperCase()
  );
  if (!match) throw new Error(`Sonda "${TARGET}" non trovata`);
  cachedId = match.id;
  return cachedId;
}

// 2) Leggi i valori correnti e normalizzali
const num = v => (v == null || v === "" || isNaN(parseFloat(v)) ? null : parseFloat(v));
const trend = v => { const n = num(v); return n == null ? null : (n > 0 ? 1 : n < 0 ? -1 : 0); };

async function fetchCurrent() {
  const id = await resolveDeviceId();
  const e = await fetch(url(`/devices/${id}/exps`)).then(r => r.json());
  return {
    deviceId: id,
    deviceName: TARGET,
    recordDate: new Date().toISOString(),
    temperature: num(e.temperature?.curr),
    ph:          num(e.ph?.curr),
    nh3:         num(e.nh3?.curr),
    nh4:         num(e.nh4?.curr),
    o2:          num(e.o2?.curr),
    lux:         num(e.lux?.curr),
    par:         num(e.par?.curr),
    kelvin:      num(e.kelvin?.curr),
    temperatureTrend: trend(e.temperature?.trend),
    phTrend:          trend(e.ph?.trend),
    nh3Trend:         trend(e.nh3?.trend),
    o2Trend:          trend(e.o2?.trend),
  };
}
```

---

## 5. Persistenza e scheduler (come lo gestiamo noi)

### Tabella storico `seneye_readings`
| Colonna | Tipo | Note |
|---|---|---|
| `id` | serial | chiave primaria |
| `device_id` | text | id sonda |
| `device_name` | text | es. "DF SIFONI" |
| `record_date` | timestamp | data/ora lettura |
| `temperature`, `ph`, `nh3`, `nh4`, `o2`, `lux`, `par`, `kelvin` | real | valori (possono essere `null`) |
| `created_at` | timestamp | data inserimento |

Indice su `(device_id, record_date)` per query veloci sullo storico.

### Scheduler
- Uno **scheduler** salva uno snapshot **ogni 30 minuti**.
  Motivo: la sonda Seneye aggiorna il dato circa ogni 30 min → leggere più spesso
  è inutile.
- Prima lettura ~60 secondi dopo l'avvio del server, poi a intervalli regolari.
- Se le credenziali non sono configurate, lo scheduler salta silenziosamente.

### Protezione anti-doppione
Prima di salvare, si controlla l'ultimo snapshot: se ha **meno di 5 minuti**, non
si richiama l'API e si restituisce quello esistente (evita chiamate e righe inutili).

### Fallback di lettura
Per la lettura "corrente" mostrata all'utente:
1. si prova a leggere **live** dall'API;
2. se l'API è giù, si restituisce **l'ultimo dato salvato** in DB (con un avviso),
   così l'interfaccia non resta mai vuota.

---

## 6. Endpoint interni esposti dall'applicazione

Questi sono gli endpoint che la nostra app espone internamente (montati sotto il
prefisso del modulo Seneye, es. `/api/seneye`):

| Metodo | Path | Descrizione |
|---|---|---|
| `GET` | `/status` | indica se le credenziali sono configurate |
| `GET` | `/devices` | elenco sonde Seneye |
| `GET` | `/current` | lettura live (con fallback all'ultimo dato salvato) |
| `GET` | `/readings?from=&to=&limit=` | storico per grafici/tabella |
| `POST` | `/poll` | forza il salvataggio di uno snapshot adesso |

Parametri di `/readings`:
- `from`, `to`: date (ISO) per filtrare l'intervallo;
- `limit`: numero massimo di righe (default 2000, max 5000).

---

## 7. Punti chiave da ricordare

1. **Auth = `user` + `pwd` in querystring** — niente token/OAuth.
2. **Sonda per nome** ("DF SIFONI") con id in cache — più robusto dell'id fisso.
3. **Due chiamate**: `/devices` → id, poi `/devices/<id>/exps` → valori.
4. **Normalizzare** numeri (→ `null` se non validi) e trend (→ `1 / 0 / -1`).
5. **Snapshot ogni 30 min** + anti-doppione 5 min + fallback all'ultimo dato.
6. Credenziali **solo in secret/variabili d'ambiente**, mai nel codice.
