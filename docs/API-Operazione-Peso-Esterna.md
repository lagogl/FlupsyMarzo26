# Delta Futuro – API esterna per registrazione operazione "Peso"

Documento tecnico per l'integrazione dell'app mobile esterna.
Versione: 1.0 — Giugno 2026

---

## 1. Cosa cambia

In passato l'app esterna scriveva l'operazione **peso** direttamente nel database.
Da ora **non si deve più scrivere direttamente nel database**: si deve chiamare un
**endpoint HTTP protetto** esposto da Delta Futuro.

Vantaggi:
- L'app non deve più conoscere le credenziali del database.
- Tutta la logica di business (calcolo taglia, animali/kg, peso medio, mortalità,
  validazioni di data, aggiornamento stato cestello, invalidazione cache,
  notifiche real-time) viene eseguita dal server in modo coerente con l'app web.
- L'app esterna invia solo pochi dati essenziali; il resto viene derivato dal server.

---

## 2. Endpoint

| | |
|---|---|
| **Metodo** | `POST` |
| **URL produzione** | `https://<URL-DI-PRODUZIONE>/api/external/operations` |
| **Content-Type** | `application/json` |
| **Autenticazione** | Header `x-api-key: <SYNC_API_KEY>` |

> **Nota sull'URL:** sostituire `<URL-DI-PRODUZIONE>` con il dominio definitivo
> `.replit.app` dell'app pubblicata (verrà comunicato a parte).
> L'endpoint risponde solo via **HTTPS**.

> **Nota sulla chiave:** `SYNC_API_KEY` è una chiave segreta condivisa, comunicata
> separatamente in modo sicuro. Non va inserita nel codice sorgente versionato:
> conservarla in una configurazione/secret dell'app mobile. Se manca o è errata,
> l'endpoint risponde `401`.

---

## 3. Corpo della richiesta (operazione "peso")

L'app mobile deve inviare **solo** questi campi:

```json
{
  "type": "peso",
  "cycleId": 467,
  "basketId": 123,
  "totalWeight": 850,
  "date": "2026-06-02"
}
```

| Campo | Tipo | Obbligatorio | Descrizione |
|---|---|---|---|
| `type` | string | **Sì** | Deve valere esattamente `"peso"`. |
| `cycleId` | number | **Sì** | ID del ciclo attivo del cestello su cui registrare il peso. |
| `basketId` | number | **Sì** | ID del cestello. |
| `totalWeight` | number | **Sì** | **Peso totale in GRAMMI** (numero intero positivo). Vedi §5. |
| `date` | string | No | Data operazione in formato `YYYY-MM-DD`. Se omessa, il server usa la data odierna. |

**Non inviare** `animalCount`, `animalsPerKg`, `sizeId`, `averageWeight`,
`mortalityRate`, `lotId`, `sgrId`: per l'operazione *peso* questi valori vengono
**calcolati/ereditati automaticamente dal server** (vedi §4). Se inviati, per il
tipo *peso* vengono comunque sovrascritti dal server.

---

## 4. Cosa fa il server automaticamente

Quando riceve un'operazione `peso`, il server:

1. Cerca nel ciclo (`cycleId`) l'**ultima operazione `misura` o `prima-attivazione`**
   con data ≤ data dell'operazione peso.
   - Se non ne trova nessuna → errore `400` (il ciclo deve avere almeno una
     prima-attivazione prima di poter registrare un peso).
2. **Eredita** da quell'operazione: `animalCount` (numero animali), `lotId`
   (lotto), `sgrId`.
3. **Eredita la mortalità** (`mortalityRate`) dall'ultima operazione del cestello
   che ne abbia una valorizzata; altrimenti `0`.
4. **Ricalcola** dai dati inviati:
   - `animalsPerKg = round(animalCount / (totalWeight / 1000))`
   - `averageWeight = 1.000.000 / animalsPerKg` (peso medio in mg)
   - `sizeId` = **taglia** determinata automaticamente in base ad `animalsPerKg`
     (se nessuna taglia corrisponde, mantiene quella dell'ultima misura).
5. Esegue le **validazioni di data** (vedi §6), crea l'operazione, aggiorna lo
   stato del cestello, invalida le cache e invia la notifica real-time agli altri
   client.

> In sintesi: l'operazione *peso* **non cambia il numero di animali** (lo eredita
> dall'ultima misura); aggiorna invece taglia, animali/kg e peso medio in base al
> nuovo peso totale misurato.

---

## 5. Unità di misura — IMPORTANTE

- `totalWeight` è **in GRAMMI** (non kg).
  - 850 grammi → `"totalWeight": 850`
  - 1,2 kg = 1200 g → `"totalWeight": 1200`
  - Regola pratica: peso in kg × 1000 = valore da inviare.
- Internamente il server converte in kg dividendo per 1000 per i calcoli.
- Deve essere un numero **> 0**, altrimenti errore `400`.

---

## 6. Validazioni che possono dare errore

Il server applica le stesse regole dell'app web:

- **Una sola operazione per cesta al giorno**: se esiste già un'operazione per quel
  cestello in quella data → errore.
- **Niente date nel passato**: la data deve essere **successiva** all'ultima
  operazione del ciclo (date uguali o anteriori vengono bloccate). Il messaggio
  d'errore indica la prima data valida utilizzabile.
- **Ciclo/cestello esistenti**: `cycleId` e `basketId` devono riferirsi a record
  esistenti, altrimenti errore.
- **Prima-attivazione necessaria**: serve almeno una `misura`/`prima-attivazione`
  nel ciclo (vedi §4.1).

---

## 7. Risposte

### Successo — `201 Created`
Restituisce l'oggetto dell'operazione appena creata (campi del record), con in più
un campo informativo opzionale `_infoMessage` (può essere `null`). Esempio
indicativo:

```json
{
  "id": 9876,
  "type": "peso",
  "cycleId": 467,
  "basketId": 123,
  "date": "2026-06-02",
  "animalCount": 120000,
  "animalsPerKg": 141176,
  "averageWeight": 7.08,
  "sizeId": 12,
  "lotId": 55,
  "mortalityRate": 2.5,
  "totalWeight": 850,
  "_infoMessage": null
}
```
> I valori sono solo esemplificativi. Considerare come "fonte di verità" i campi
> restituiti dal server (in particolare `id`, `animalsPerKg`, `sizeId`).

### Errori
Formato comune:
```json
{ "success": false, "error": "messaggio leggibile" }
```

| Codice | Significato | Esempi |
|---|---|---|
| `400` | Dati mancanti o non validi | `cycleId è obbligatorio per l'operazione peso`; peso ≤ 0; nessuna prima-attivazione nel ciclo; data non valida |
| `401` | API key mancante o errata | `Unauthorized: invalid or missing API key` |
| `409` | Conflitto / duplicato | operazione già esistente |
| `503` | Endpoint non configurato sul server | la chiave non è impostata lato server (contattare Delta Futuro) |
| `500` | Errore generico server | — |

---

## 8. Esempi di chiamata

### cURL
```bash
curl -X POST "https://<URL-DI-PRODUZIONE>/api/external/operations" \
  -H "Content-Type: application/json" \
  -H "x-api-key: <SYNC_API_KEY>" \
  -d '{
    "type": "peso",
    "cycleId": 467,
    "basketId": 123,
    "totalWeight": 850,
    "date": "2026-06-02"
  }'
```

### JavaScript (fetch)
```js
const res = await fetch("https://<URL-DI-PRODUZIONE>/api/external/operations", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": SYNC_API_KEY, // da configurazione sicura, non hardcoded
  },
  body: JSON.stringify({
    type: "peso",
    cycleId: 467,
    basketId: 123,
    totalWeight: 850, // GRAMMI
    date: "2026-06-02", // opzionale (YYYY-MM-DD)
  }),
});

const data = await res.json();
if (!res.ok) {
  // Gestire data.error (es. mostrare messaggio all'utente)
  throw new Error(data.error || `Errore ${res.status}`);
}
// data = operazione creata (usare data.id, data.sizeId, data.animalsPerKg)
```

---

## 9. Checklist di migrazione per l'app mobile

- [ ] Rimuovere ogni scrittura diretta al database per l'operazione *peso*.
- [ ] Implementare la chiamata `POST /api/external/operations` come sopra.
- [ ] Salvare `SYNC_API_KEY` in configurazione sicura (non nel codice versionato).
- [ ] Inviare `totalWeight` **in grammi**, `date` in formato `YYYY-MM-DD`.
- [ ] Non calcolare lato app taglia/animali-kg: usare i valori restituiti dal server.
- [ ] Gestire gli errori (`400/401/409/503/500`) mostrando `error` all'utente.
- [ ] Testare prima su un ciclo di prova (verificare che l'operazione compaia
      nell'app web subito dopo).

---

## 10. Riferimenti rapidi

- **Endpoint**: `POST https://<URL-DI-PRODUZIONE>/api/external/operations`
- **Header obbligatorio**: `x-api-key: <SYNC_API_KEY>`
- **Body minimo**: `{ "type": "peso", "cycleId", "basketId", "totalWeight" }`
- **Unità peso**: grammi
- **Stesso database** dell'app web (le operazioni sono immediatamente visibili).
