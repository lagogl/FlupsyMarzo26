# FattureCloud — API DDT per Integrazioni Esterne

## Panoramica

Questa documentazione descrive le API REST per la gestione completa dei **DDT (Documenti di Trasporto)** dall'esterno. Le API consentono operazioni CRUD complete: creazione, lettura, aggiornamento, eliminazione, e download XML.

---

## Autenticazione

Tutte le richieste devono includere l'header `X-API-Key` con la chiave di accesso.

```
X-API-Key: fcloud-ext-2026-k8Xm9PqR7vLw3NzT
```

**Risposta in caso di chiave mancante o errata:**
```json
HTTP 401
{ "message": "API key non valida" }
```

---

## Base URL

```
https://fatture-cloud-clone.replit.app
```

---

## Aziende Disponibili (companyId)

Il sistema è multi-azienda. Ogni operazione richiede o restituisce un `companyId`:

| companyId | Ragione Sociale |
|-----------|----------------|
| `ecotapes-001` | SOCIETA' AGRICOLA ECOTAPES SRL (P.IVA 04621060278) |
| `deltafuturo-001` | Delta Futuro (P.IVA 02057710382) |
| `mito-001` | Mito srl (P.IVA 02119900385) |

---

## Endpoint DDT

### 1. Lista DDT

```
GET /api/ext/ddt
```

**Query Parameters (tutti opzionali):**

| Parametro | Tipo | Descrizione |
|-----------|------|-------------|
| `companyId` | string | Filtra per azienda (es. `ecotapes-001`) |
| `stato` | string | Filtra per stato: `bozza`, `emessa`, `annullata` |
| `clientId` | string | Filtra per ID cliente |
| `dataFrom` | string | Data minima (formato `YYYY-MM-DD`) |
| `dataTo` | string | Data massima (formato `YYYY-MM-DD`) |

**Esempio:**
```bash
curl -H "X-API-Key: fcloud-ext-2026-k8Xm9PqR7vLw3NzT" \
  "https://fatture-cloud-clone.replit.app/api/ext/ddt?companyId=ecotapes-001&stato=emessa"
```

**Risposta (200):**
```json
[
  {
    "id": "abc-123-def",
    "companyId": "ecotapes-001",
    "numero": "1",
    "data": "2026-03-10",
    "clientId": "cli-456",
    "tipo": "ddt",
    "stato": "emessa",
    "subtotale": "1000.00",
    "totaleIva": "220.00",
    "totale": "1220.00",
    "causaleTrasporto": "Vendita",
    "vettore": "DHL",
    "destinazione": "Via Roma 1, Milano",
    "note": null,
    "client": {
      "id": "cli-456",
      "ragioneSociale": "Cliente Srl",
      "partitaIva": "12345678901",
      ...
    }
  }
]
```

---

### 2. Dettaglio DDT

```
GET /api/ext/ddt/:id
```

Restituisce il DDT completo con tutte le **righe** (items).

**Esempio:**
```bash
curl -H "X-API-Key: fcloud-ext-2026-k8Xm9PqR7vLw3NzT" \
  "https://fatture-cloud-clone.replit.app/api/ext/ddt/abc-123-def"
```

**Risposta (200):**
```json
{
  "id": "abc-123-def",
  "companyId": "ecotapes-001",
  "numero": "1",
  "data": "2026-03-10",
  "scadenza": null,
  "clientId": "cli-456",
  "tipo": "ddt",
  "stato": "emessa",
  "subtotale": "1000.00",
  "totaleIva": "220.00",
  "totale": "1220.00",
  "note": null,
  "causaleTrasporto": "Vendita",
  "dataInizioTrasporto": "2026-03-10",
  "oraInizioTrasporto": "08:30",
  "mezzoTrasporto": "Autocarro",
  "aspettoEsteriore": "Scatole",
  "pesoKg": "150.00",
  "numeroColli": 5,
  "vettore": "DHL Express",
  "destinazione": "Via Roma 1, 20121 Milano (MI)",
  "orderId": null,
  "createdAt": "2026-03-10T08:00:00.000Z",
  "client": {
    "id": "cli-456",
    "ragioneSociale": "Cliente Srl",
    "partitaIva": "12345678901",
    "codiceFiscale": "12345678901",
    "indirizzo": "Via Verdi 10",
    "cap": "20121",
    "citta": "Milano",
    "provincia": "MI",
    "email": "info@cliente.it",
    "pec": "cliente@pec.it",
    "codiceDestinatario": "ABC1234"
  },
  "items": [
    {
      "id": "item-789",
      "invoiceId": "abc-123-def",
      "productId": null,
      "descrizione": "Prodotto A",
      "quantita": "10",
      "prezzoUnitario": "50.0000",
      "aliquotaIva": 22,
      "natura": null,
      "sconto": "0.00",
      "totale": "500.0000"
    },
    {
      "id": "item-790",
      "descrizione": "Prodotto B",
      "quantita": "5",
      "prezzoUnitario": "100.0000",
      "aliquotaIva": 22,
      "natura": null,
      "sconto": "0.00",
      "totale": "500.0000"
    }
  ]
}
```

**Errore (404):**
```json
{ "message": "DDT non trovato" }
```

---

### 3. Crea DDT

```
POST /api/ext/ddt
Content-Type: application/json
```

Il numero DDT viene assegnato automaticamente in sequenza progressiva per azienda.

**Body (JSON):**

| Campo | Tipo | Obbligatorio | Descrizione |
|-------|------|:---:|-------------|
| `companyId` | string | **Si** | ID azienda (es. `ecotapes-001`) |
| `clientId` | string | **Si** | ID del cliente destinatario |
| `items` | array | **Si** | Righe del DDT (almeno una) |
| `data` | string | No | Data DDT formato `YYYY-MM-DD` (default: oggi) |
| `scadenza` | string | No | Data scadenza `YYYY-MM-DD` |
| `note` | string | No | Note libere |
| `causaleTrasporto` | string | No | Es. "Vendita", "Conto lavorazione" |
| `dataInizioTrasporto` | string | No | Data inizio trasporto `YYYY-MM-DD` |
| `oraInizioTrasporto` | string | No | Ora inizio trasporto `HH:MM` |
| `mezzoTrasporto` | string | No | Es. "Autocarro", "Furgone" |
| `aspettoEsteriore` | string | No | Es. "Scatole", "Pallet", "Sfuso" |
| `pesoKg` | string/number | No | Peso totale in kg |
| `numeroColli` | number | No | Numero colli |
| `vettore` | string | No | Nome del vettore/corriere |
| `destinazione` | string | No | Indirizzo di destinazione |
| `orderId` | string | No | ID ordine collegato (se applicabile) |

**Struttura di ogni riga (items[]):**

| Campo | Tipo | Obbligatorio | Descrizione |
|-------|------|:---:|-------------|
| `descrizione` | string | **Si** | Descrizione del prodotto/servizio |
| `quantita` | number | No | Quantita (default: 1) |
| `prezzoUnitario` | number | No | Prezzo unitario (default: 0) |
| `aliquotaIva` | number | No | Aliquota IVA in % (default: 22) |
| `natura` | string | No | Codice natura IVA se aliquota=0 (es. `N2.1`, `N4`) |
| `sconto` | number | No | Sconto riga in % (default: 0) |
| `codice` | string | No | Codice articolo |
| `unitaMisura` | string | No | Unita di misura (es. "PZ", "KG", "MT") |
| `productId` | string | No | ID prodotto dal catalogo |

**Esempio:**
```bash
curl -X POST \
  -H "X-API-Key: fcloud-ext-2026-k8Xm9PqR7vLw3NzT" \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "ecotapes-001",
    "clientId": "cli-456",
    "data": "2026-03-15",
    "causaleTrasporto": "Vendita",
    "mezzoTrasporto": "Autocarro",
    "aspettoEsteriore": "Scatole",
    "pesoKg": 75,
    "numeroColli": 3,
    "vettore": "DHL Express",
    "destinazione": "Via Roma 1, 20121 Milano (MI)",
    "items": [
      {
        "descrizione": "Prodotto Alpha",
        "quantita": 10,
        "prezzoUnitario": 50,
        "aliquotaIva": 22,
        "unitaMisura": "PZ"
      },
      {
        "descrizione": "Servizio Beta",
        "quantita": 1,
        "prezzoUnitario": 200,
        "aliquotaIva": 22,
        "sconto": 10
      }
    ]
  }' \
  "https://fatture-cloud-clone.replit.app/api/ext/ddt"
```

**Risposta (201):**
```json
{
  "id": "new-ddt-uuid",
  "companyId": "ecotapes-001",
  "numero": "2",
  "data": "2026-03-15",
  "clientId": "cli-456",
  "tipo": "ddt",
  "stato": "emessa",
  "subtotale": "680.00",
  "totaleIva": "149.60",
  "totale": "829.60",
  ...
}
```

**Errori possibili:**
```json
HTTP 400: { "message": "companyId obbligatorio" }
HTTP 400: { "message": "clientId obbligatorio" }
HTTP 400: { "message": "Almeno una riga (items) è obbligatoria" }
HTTP 400: { "message": "La data DDT (2026-03-01) non può essere anteriore all'ultimo DDT emesso (2026-03-10)." }
HTTP 404: { "message": "Cliente non trovato" }
```

---

### 4. Aggiorna DDT

```
PATCH /api/ext/ddt/:id
Content-Type: application/json
```

Aggiorna solo i campi passati nel body. I campi non inclusi restano invariati.

**Campi aggiornabili:**

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `stato` | string | `bozza`, `emessa`, `annullata` |
| `note` | string | Note libere |
| `causaleTrasporto` | string | Causale trasporto |
| `dataInizioTrasporto` | string | Data inizio trasporto |
| `oraInizioTrasporto` | string | Ora inizio trasporto |
| `mezzoTrasporto` | string | Mezzo di trasporto |
| `aspettoEsteriore` | string | Aspetto esteriore beni |
| `pesoKg` | string/number | Peso kg |
| `numeroColli` | number | Numero colli |
| `vettore` | string | Vettore |
| `destinazione` | string | Destinazione |

**Esempio — annullare un DDT:**
```bash
curl -X PATCH \
  -H "X-API-Key: fcloud-ext-2026-k8Xm9PqR7vLw3NzT" \
  -H "Content-Type: application/json" \
  -d '{ "stato": "annullata", "note": "Annullato per errore indirizzo" }' \
  "https://fatture-cloud-clone.replit.app/api/ext/ddt/abc-123-def"
```

**Risposta (200):** Il DDT aggiornato completo (con items).

---

### 5. Elimina DDT

```
DELETE /api/ext/ddt/:id
```

Elimina il DDT e tutte le sue righe. Operazione irreversibile.

**Esempio:**
```bash
curl -X DELETE \
  -H "X-API-Key: fcloud-ext-2026-k8Xm9PqR7vLw3NzT" \
  "https://fatture-cloud-clone.replit.app/api/ext/ddt/abc-123-def"
```

**Risposta (200):**
```json
{ "success": true, "message": "DDT eliminato" }
```

---

### 6. Download XML FatturaPA

```
GET /api/ext/ddt/:id/xml
```

Scarica il file XML in formato FatturaPA (TD24) del DDT.

**Esempio:**
```bash
curl -H "X-API-Key: fcloud-ext-2026-k8Xm9PqR7vLw3NzT" \
  -o DDT_1.xml \
  "https://fatture-cloud-clone.replit.app/api/ext/ddt/abc-123-def/xml"
```

**Risposta:** File XML con `Content-Type: application/xml`

---

## Endpoint di Supporto (Lookup)

### Lista Clienti

```
GET /api/ext/clients?companyId=ecotapes-001
```

Restituisce l'elenco clienti per ottenere i `clientId` da usare nella creazione DDT.

**Risposta (200):**
```json
[
  {
    "id": "cli-456",
    "companyId": "ecotapes-001",
    "codice": "C001",
    "tipo": "azienda",
    "ragioneSociale": "Cliente Srl",
    "partitaIva": "12345678901",
    "codiceFiscale": "12345678901",
    "indirizzo": "Via Verdi 10",
    "cap": "20121",
    "citta": "Milano",
    "provincia": "MI",
    "nazione": "IT",
    "telefono": "02 1234567",
    "email": "info@cliente.it",
    "pec": "cliente@pec.it",
    "codiceDestinatario": "ABC1234"
  }
]
```

### Lista Prodotti

```
GET /api/ext/products?companyId=ecotapes-001
```

Restituisce il catalogo prodotti. Utile per popolare le righe DDT con `productId`.

**Risposta (200):**
```json
[
  {
    "id": "prod-001",
    "companyId": "ecotapes-001",
    "codice": "ART001",
    "descrizione": "Prodotto Alpha",
    "prezzoUnitario": "50.00",
    "aliquotaIva": 22,
    "unitaMisura": "PZ",
    "categoria": "Materiali"
  }
]
```

---

## Codici di Stato HTTP

| Codice | Significato |
|--------|-------------|
| `200` | Operazione riuscita |
| `201` | DDT creato con successo |
| `400` | Errore di validazione (campo mancante, data non valida) |
| `401` | API key mancante o non valida |
| `404` | DDT o risorsa non trovata |
| `500` | Errore interno del server |

---

## Valori di Stato DDT

| Stato | Descrizione |
|-------|-------------|
| `bozza` | DDT in preparazione, non ancora emesso |
| `emessa` | DDT emesso e valido |
| `annullata` | DDT annullato |

---

## Note Importanti

1. **Numerazione automatica**: Il numero DDT viene assegnato automaticamente in sequenza progressiva per ciascuna azienda. Non va passato nella creazione.
2. **Date progressive**: La data di un nuovo DDT non puo essere anteriore alla data dell'ultimo DDT emesso per la stessa azienda.
3. **Calcolo totali**: Subtotale, IVA e totale vengono calcolati automaticamente dal server in base alle righe fornite.
4. **Sconto riga**: Lo sconto e in percentuale (es. `10` = 10%) e viene applicato all'importo riga.
5. **IVA a 0%**: Se `aliquotaIva` e 0, il campo `natura` diventa obbligatorio (es. `N2.1`, `N4`).
6. **Ordine collegato**: Se il DDT e collegato a un ordine esistente, passare `orderId` per il tracciamento.

---

## Flusso Tipico di Integrazione

```
1. GET /api/ext/clients?companyId=ecotapes-001
   → Ottenere l'elenco clienti e scegliere il clientId

2. GET /api/ext/products?companyId=ecotapes-001
   → (Opzionale) Ottenere il catalogo prodotti

3. POST /api/ext/ddt
   → Creare il DDT con clientId, items[], dati trasporto

4. GET /api/ext/ddt/:id
   → Verificare il DDT creato, leggere numero assegnato

5. GET /api/ext/ddt/:id/xml
   → (Opzionale) Scaricare l'XML FatturaPA

6. PATCH /api/ext/ddt/:id
   → Aggiornare stato o dati trasporto se necessario

7. GET /api/ext/ddt?companyId=ecotapes-001&dataFrom=2026-03-01&dataTo=2026-03-31
   → Consultare i DDT del periodo
```

---

## Esempio Completo (JavaScript/Node.js)

```javascript
const BASE_URL = "https://fatture-cloud-clone.replit.app";
const API_KEY = "fcloud-ext-2026-k8Xm9PqR7vLw3NzT";

const headers = {
  "X-API-Key": API_KEY,
  "Content-Type": "application/json"
};

// 1. Ottenere i clienti
const clienti = await fetch(`${BASE_URL}/api/ext/clients?companyId=ecotapes-001`, { headers })
  .then(r => r.json());

const clienteId = clienti[0].id;

// 2. Creare un DDT
const nuovoDdt = await fetch(`${BASE_URL}/api/ext/ddt`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    companyId: "ecotapes-001",
    clientId: clienteId,
    data: "2026-03-15",
    causaleTrasporto: "Vendita",
    vettore: "Corriere Espresso",
    destinazione: "Via Milano 10, 00100 Roma",
    items: [
      { descrizione: "Articolo X", quantita: 5, prezzoUnitario: 100, aliquotaIva: 22 },
      { descrizione: "Articolo Y", quantita: 2, prezzoUnitario: 50, aliquotaIva: 10 }
    ]
  })
}).then(r => r.json());

console.log(`DDT creato: N. ${nuovoDdt.numero}, ID: ${nuovoDdt.id}`);

// 3. Leggere il dettaglio con le righe
const dettaglio = await fetch(`${BASE_URL}/api/ext/ddt/${nuovoDdt.id}`, { headers })
  .then(r => r.json());

console.log(`Totale: €${dettaglio.totale}, Righe: ${dettaglio.items.length}`);

// 4. Scaricare l'XML
const xml = await fetch(`${BASE_URL}/api/ext/ddt/${nuovoDdt.id}/xml`, { headers })
  .then(r => r.text());

// 5. Aggiornare il DDT
await fetch(`${BASE_URL}/api/ext/ddt/${nuovoDdt.id}`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({ note: "Consegnato regolarmente" })
});

// 6. Lista DDT del mese
const ddtMese = await fetch(
  `${BASE_URL}/api/ext/ddt?companyId=ecotapes-001&dataFrom=2026-03-01&dataTo=2026-03-31`,
  { headers }
).then(r => r.json());

console.log(`DDT nel mese: ${ddtMese.length}`);
```

---

## Esempio Completo (Python)

```python
import requests

BASE_URL = "https://fatture-cloud-clone.replit.app"
API_KEY = "fcloud-ext-2026-k8Xm9PqR7vLw3NzT"
HEADERS = {"X-API-Key": API_KEY, "Content-Type": "application/json"}

# 1. Ottenere i clienti
clienti = requests.get(f"{BASE_URL}/api/ext/clients", 
    params={"companyId": "ecotapes-001"}, headers=HEADERS).json()
cliente_id = clienti[0]["id"]

# 2. Creare un DDT
risposta = requests.post(f"{BASE_URL}/api/ext/ddt", headers=HEADERS, json={
    "companyId": "ecotapes-001",
    "clientId": cliente_id,
    "data": "2026-03-15",
    "causaleTrasporto": "Vendita",
    "vettore": "Corriere Espresso",
    "items": [
        {"descrizione": "Articolo X", "quantita": 5, "prezzoUnitario": 100, "aliquotaIva": 22},
        {"descrizione": "Articolo Y", "quantita": 2, "prezzoUnitario": 50, "aliquotaIva": 10}
    ]
})
ddt = risposta.json()
print(f"DDT creato: N. {ddt['numero']}, Totale: {ddt['totale']}")

# 3. Dettaglio con righe
dettaglio = requests.get(f"{BASE_URL}/api/ext/ddt/{ddt['id']}", headers=HEADERS).json()

# 4. Download XML
xml = requests.get(f"{BASE_URL}/api/ext/ddt/{ddt['id']}/xml", headers=HEADERS)
with open(f"DDT_{ddt['numero']}.xml", "w") as f:
    f.write(xml.text)

# 5. Aggiornare stato
requests.patch(f"{BASE_URL}/api/ext/ddt/{ddt['id']}", headers=HEADERS, 
    json={"stato": "annullata", "note": "Annullato su richiesta cliente"})

# 6. Eliminare
requests.delete(f"{BASE_URL}/api/ext/ddt/{ddt['id']}", headers=HEADERS)
```
