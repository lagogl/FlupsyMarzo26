# FattureCloud — Guida Completa API per Integrazione Esterna

> **Versione:** 2.0 — Ultimo aggiornamento: 14 marzo 2026
> **Destinatario:** Sviluppatore esterno (es. integrazione FLUPSY)

---

## Indice

1. [Informazioni Generali](#informazioni-generali)
2. [Come Autenticarsi](#come-autenticarsi)
3. [Come Funzionano le Aziende (companyId)](#come-funzionano-le-aziende-companyid)
4. [Flusso Completo Passo per Passo](#flusso-completo-passo-per-passo)
5. [API Clienti](#api-clienti)
   - [Creare o Trovare un Cliente (Upsert)](#1-creare-o-trovare-un-cliente-upsert)
   - [Elenco Clienti](#2-elenco-clienti)
6. [API DDT](#api-ddt)
   - [Creare un DDT](#3-creare-un-ddt)
   - [Dettaglio DDT](#4-dettaglio-ddt-con-righe)
   - [Elenco DDT](#5-elenco-ddt-con-filtri)
   - [Aggiornare un DDT](#6-aggiornare-un-ddt)
   - [Eliminare un DDT](#7-eliminare-un-ddt)
   - [Scaricare XML FatturaPA](#8-scaricare-xml-fatturapa)
7. [API Prodotti](#api-prodotti)
8. [Deep-Link: Aprire un DDT nel Browser](#deep-link-aprire-un-ddt-nel-browser)
9. [Gestione Errori e Troubleshooting](#gestione-errori-e-troubleshooting)
10. [Esempio Completo JavaScript](#esempio-completo-javascript)
11. [Esempio Completo Python](#esempio-completo-python)
12. [Esempio Completo cURL (copia-incolla)](#esempio-completo-curl-copia-incolla)
13. [FAQ e Problemi Comuni](#faq-e-problemi-comuni)

---

## Informazioni Generali

| Parametro | Valore |
|-----------|--------|
| **Base URL Produzione** | `https://fatture-cloud-clone.replit.app` |
| **Autenticazione** | Header `X-API-Key` |
| **API Key** | `fcloud-ext-2026-k8Xm9PqR7vLw3NzT` |
| **Content-Type** | `application/json` (per POST e PATCH) |
| **Formato date** | `YYYY-MM-DD` (es. `2026-03-14`) |
| **Formato risposte** | JSON |
| **Codifica** | UTF-8 |

---

## Come Autenticarsi

**Ogni singola richiesta** deve avere l'header `X-API-Key`. Senza di esso, il server risponde `401`.

### Header richiesti

```
X-API-Key: fcloud-ext-2026-k8Xm9PqR7vLw3NzT
Content-Type: application/json          ← solo per POST e PATCH
```

### Test rapido per verificare che la chiave funzioni

```bash
curl -H "X-API-Key: fcloud-ext-2026-k8Xm9PqR7vLw3NzT" \
  "https://fatture-cloud-clone.replit.app/api/ext/clients?companyId=ecotapes-001"
```

**Se funziona** → ricevi un array JSON di clienti (può essere vuoto `[]`)
**Se NON funziona** → ricevi:

```json
HTTP 401
{"message": "API key non valida"}
```

### Errori comuni di autenticazione

| Problema | Soluzione |
|----------|----------|
| Header scritto come `x-api-key` | Va bene, l'header è case-insensitive |
| Header scritto come `Authorization` | **SBAGLIATO** — deve essere `X-API-Key` |
| Chiave con spazi o a capo | Copia esattamente: `fcloud-ext-2026-k8Xm9PqR7vLw3NzT` |
| Chiave passata come query string `?apiKey=...` | **SBAGLIATO** — deve essere nell'header |

---

## Come Funzionano le Aziende (companyId)

Il sistema gestisce più aziende. Ogni cliente, DDT e prodotto appartiene a un'azienda specifica identificata dal `companyId`.

### Aziende attualmente configurate

| companyId | Ragione Sociale | P.IVA |
|-----------|----------------|-------|
| `ecotapes-001` | SOCIETA' AGRICOLA ECOTAPES SRL | 04621060278 |
| `deltafuturo-001` | Delta Futuro | 02057710382 |
| `mito-001` | Mito srl | 02119900385 |

> **Importante:** Se il `companyId` è sbagliato o inesistente, le chiamate funzioneranno ma restituiranno risultati vuoti. Il sistema **non** dà errore per un companyId non esistente — restituisce semplicemente `[]`.

---

## Flusso Completo Passo per Passo

Ecco il flusso tipico per creare un DDT da un sistema esterno (es. FLUPSY):

```
┌─────────────────────────────────────────────────────────────┐
│  PASSO 1: Registra il cliente                              │
│  POST /api/ext/clients                                     │
│  → Se il cliente esiste già (stessa P.IVA), lo ritrova     │
│  → Se non esiste, lo crea                                  │
│  → SALVA il campo "id" dalla risposta                      │
└─────────────────────┬───────────────────────────────────────┘
                      │ clientId = risposta.id
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  PASSO 2: Crea il DDT                                      │
│  POST /api/ext/ddt                                         │
│  → Usa il clientId del passo 1                             │
│  → Passa le righe con prodotti, quantità, prezzi           │
│  → SALVA il campo "id" dalla risposta                      │
└─────────────────────┬───────────────────────────────────────┘
                      │ ddtId = risposta.id
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  PASSO 3: Apri il DDT nel browser dell'utente              │
│  URL: https://fatture-cloud-clone.replit.app/fatture/{id}  │
│  → L'utente vede il DDT completo e lo gestisce da lì      │
└─────────────────────────────────────────────────────────────┘
```

### Codice minimo per il flusso completo (JavaScript)

```javascript
const API = "https://fatture-cloud-clone.replit.app";
const KEY = "fcloud-ext-2026-k8Xm9PqR7vLw3NzT";
const H = { "X-API-Key": KEY, "Content-Type": "application/json" };

// PASSO 1: Registra/trova il cliente
const cliente = await fetch(`${API}/api/ext/clients`, {
  method: "POST", headers: H,
  body: JSON.stringify({
    companyId: "ecotapes-001",
    ragioneSociale: "Nome Cliente Srl",
    partitaIva: "01234567890"
  })
}).then(r => r.json());

// PASSO 2: Crea il DDT
const ddt = await fetch(`${API}/api/ext/ddt`, {
  method: "POST", headers: H,
  body: JSON.stringify({
    companyId: "ecotapes-001",
    clientId: cliente.id,            // ← usa l'id dal passo 1
    items: [
      { descrizione: "Prodotto A", quantita: 10, prezzoUnitario: 25, aliquotaIva: 22 }
    ]
  })
}).then(r => r.json());

// PASSO 3: Apri nel browser
window.open(`${API}/fatture/${ddt.id}`, '_blank');
```

---

## API Clienti

### 1. Creare o Trovare un Cliente (Upsert)

```
POST /api/ext/clients
```

Questo endpoint ha un **comportamento intelligente**:
- Se esiste già un cliente con la stessa `partitaIva` nella stessa `companyId` → **restituisce il cliente esistente** (HTTP 200)
- Se non esiste → **lo crea** (HTTP 201)
- Se non passi la `partitaIva` → **crea sempre un nuovo cliente** (non può fare il matching)

#### Campi del body

| Campo | Tipo | Obbl. | Descrizione | Esempio |
|-------|------|:-----:|-------------|---------|
| `companyId` | string | **Sì** | ID azienda | `"ecotapes-001"` |
| `ragioneSociale` | string | **Sì** | Denominazione | `"Mario Rossi Srl"` |
| `partitaIva` | string | Cons.* | P.IVA (11 cifre) | `"01234567890"` |
| `codiceFiscale` | string | No | Cod.Fiscale | `"01234567890"` |
| `tipo` | string | No | `azienda` / `privato` / `pa` | `"azienda"` |
| `indirizzo` | string | No | Via e numero | `"Via Roma 1"` |
| `cap` | string | No | CAP (5 cifre) | `"30100"` |
| `citta` | string | No | Città (accetta anche `comune`) | `"Venezia"` |
| `provincia` | string | No | Sigla provincia | `"VE"` |
| `nazione` | string | No | Codice ISO (default: IT) | `"IT"` |
| `email` | string | No | Email | `"info@azienda.it"` |
| `pec` | string | No | PEC | `"azienda@pec.it"` |
| `codiceDestinatario` | string | No | Codice SDI (default: 0000000) | `"M5UXCR1"` |
| `telefono` | string | No | Telefono | `"041 5551234"` |
| `cellulare` | string | No | Cellulare | `"333 1234567"` |
| `nome` | string | No | Nome (persone fisiche) | `"Mario"` |
| `cognome` | string | No | Cognome (persone fisiche) | `"Rossi"` |
| `splitPayment` | boolean | No | Split payment PA | `false` |
| `condizioniPagamento` | string | No | Codice FatturaPA | `"TP02"` |
| `modalitaPagamento` | string | No | Codice FatturaPA | `"MP05"` |
| `iban` | string | No | IBAN | `"IT60X0542811101000000123456"` |
| `banca` | string | No | Nome banca | `"Intesa Sanpaolo"` |
| `sconto` | number | No | Sconto abituale % | `5` |
| `note` | string | No | Note libere | `"Cliente prioritario"` |

> *Cons. = Consigliato. Senza partitaIva l'upsert non funziona (crea sempre un nuovo cliente).

#### Esempio cURL — creare un nuovo cliente

```bash
curl -X POST \
  -H "X-API-Key: fcloud-ext-2026-k8Xm9PqR7vLw3NzT" \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "ecotapes-001",
    "ragioneSociale": "Azienda Demo FLUPSY Srl",
    "partitaIva": "09876543210",
    "codiceFiscale": "09876543210",
    "indirizzo": "Via Garibaldi 15",
    "cap": "30121",
    "citta": "Venezia",
    "provincia": "VE",
    "email": "demo@flupsy.it",
    "pec": "demo@pec.flupsy.it",
    "codiceDestinatario": "M5UXCR1"
  }' \
  "https://fatture-cloud-clone.replit.app/api/ext/clients"
```

#### Risposta REALE — cliente creato (HTTP 201)

```json
{
  "id": "cef02c95-9861-4a82-ba3e-9a5c736a1829",
  "companyId": "ecotapes-001",
  "codice": null,
  "tipo": "azienda",
  "ragioneSociale": "Azienda Demo FLUPSY Srl",
  "nome": null,
  "cognome": null,
  "partitaIva": "09876543210",
  "codiceFiscale": "09876543210",
  "codiceEori": null,
  "indirizzo": "Via Garibaldi 15",
  "cap": "30121",
  "citta": "Venezia",
  "provincia": "VE",
  "nazione": "IT",
  "telefono": null,
  "cellulare": null,
  "fax": null,
  "email": "demo@flupsy.it",
  "pec": "demo@pec.flupsy.it",
  "sitoWeb": null,
  "codiceDestinatario": "M5UXCR1",
  "splitPayment": false,
  "condizioniPagamento": "TP02",
  "modalitaPagamento": "MP05",
  "iban": null,
  "banca": null,
  "sconto": null,
  "note": null,
  "createdAt": "2026-03-14T09:57:00.947Z"
}
```

> **Il campo che ti serve è `id`** → salvalo perché lo userai come `clientId` nella creazione del DDT.

#### Risposta REALE — cliente già esistente con stessa P.IVA (HTTP 200)

Se richiami la stessa POST con la stessa `partitaIva` e `companyId`, ricevi lo **stesso identico oggetto** con lo **stesso `id`**:

```json
{
  "id": "cef02c95-9861-4a82-ba3e-9a5c736a1829",
  "ragioneSociale": "Azienda Demo FLUPSY Srl",
  "partitaIva": "09876543210",
  ...
}
```

> **Nota:** Anche se nella seconda chiamata passi una `ragioneSociale` diversa, il server restituisce il cliente esistente senza aggiornarlo. Il matching è solo sulla `partitaIva`.

#### Errori possibili

| HTTP | Risposta | Causa |
|------|----------|-------|
| 400 | `{"message": "companyId e ragioneSociale obbligatori"}` | Manca `companyId` o `ragioneSociale` nel body |
| 401 | `{"message": "API key non valida"}` | Header `X-API-Key` mancante o sbagliato |

---

### 2. Elenco Clienti

```
GET /api/ext/clients?companyId=ecotapes-001
```

Restituisce tutti i clienti dell'azienda. Utile per cercare un `clientId` se conosci già la ragione sociale.

```bash
curl -H "X-API-Key: fcloud-ext-2026-k8Xm9PqR7vLw3NzT" \
  "https://fatture-cloud-clone.replit.app/api/ext/clients?companyId=ecotapes-001"
```

Risposta: array di oggetti cliente (stesso formato del POST).

---

## API DDT

### 3. Creare un DDT

```
POST /api/ext/ddt
Content-Type: application/json
```

Il **numero DDT viene assegnato automaticamente** dal server in sequenza progressiva per azienda. Non devi passarlo tu.

#### Campi del body

| Campo | Tipo | Obbl. | Descrizione | Esempio |
|-------|------|:-----:|-------------|---------|
| `companyId` | string | **Sì** | ID azienda | `"ecotapes-001"` |
| `clientId` | string | **Sì** | ID cliente (dal passo 1) | `"cef02c95-..."` |
| `items` | array | **Sì** | Righe del DDT (min. 1) | vedi sotto |
| `data` | string | No | Data DDT `YYYY-MM-DD` (default: oggi) | `"2026-03-14"` |
| `scadenza` | string | No | Data scadenza | `"2026-04-14"` |
| `note` | string | No | Note libere | `"Consegna urgente"` |
| `causaleTrasporto` | string | No | Causale | `"Vendita"` |
| `dataInizioTrasporto` | string | No | Data partenza | `"2026-03-14"` |
| `oraInizioTrasporto` | string | No | Ora partenza | `"08:30"` |
| `mezzoTrasporto` | string | No | Mezzo | `"Autocarro"` |
| `aspettoEsteriore` | string | No | Aspetto beni | `"Scatole"` |
| `pesoKg` | number | No | Peso totale kg | `45.5` |
| `numeroColli` | number | No | Numero colli | `3` |
| `vettore` | string | No | Corriere/vettore | `"BRT Corriere Espresso"` |
| `destinazione` | string | No | Indirizzo dest. | `"Via Roma 1, 20121 Milano"` |
| `orderId` | string | No | ID ordine collegato | `"ord-123"` |

#### Campi di ogni riga (`items[]`)

| Campo | Tipo | Obbl. | Descrizione | Esempio |
|-------|------|:-----:|-------------|---------|
| `descrizione` | string | **Sì** | Nome prodotto/servizio | `"Nastro adesivo 50mm"` |
| `quantita` | number | No | Quantità (default: 1) | `100` |
| `prezzoUnitario` | number | No | Prezzo unitario (default: 0) | `2.50` |
| `aliquotaIva` | number | No | Aliquota IVA % (default: 22) | `22` |
| `natura` | string | No | Codice natura se IVA=0 | `"N4"` |
| `sconto` | number | No | Sconto % sulla riga | `10` |
| `codice` | string | No | Codice articolo | `"ART001"` |
| `unitaMisura` | string | No | Unità di misura | `"PZ"`, `"KG"`, `"MT"`, `"RL"` |
| `productId` | string | No | ID prodotto da catalogo | `"prod-001"` |

#### Esempio cURL

```bash
curl -X POST \
  -H "X-API-Key: fcloud-ext-2026-k8Xm9PqR7vLw3NzT" \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "ecotapes-001",
    "clientId": "cef02c95-9861-4a82-ba3e-9a5c736a1829",
    "data": "2026-03-14",
    "causaleTrasporto": "Vendita",
    "mezzoTrasporto": "Autocarro",
    "aspettoEsteriore": "Scatole",
    "pesoKg": 45.5,
    "numeroColli": 3,
    "vettore": "BRT Corriere Espresso",
    "destinazione": "Via Garibaldi 15, 30121 Venezia (VE)",
    "items": [
      {
        "descrizione": "Nastro adesivo avana 50mm x 66mt",
        "quantita": 100,
        "prezzoUnitario": 2.50,
        "aliquotaIva": 22,
        "unitaMisura": "PZ"
      },
      {
        "descrizione": "Film estensibile manuale 500mm",
        "quantita": 20,
        "prezzoUnitario": 8.00,
        "aliquotaIva": 22,
        "unitaMisura": "RL"
      }
    ]
  }' \
  "https://fatture-cloud-clone.replit.app/api/ext/ddt"
```

#### Risposta REALE (HTTP 201)

```json
{
  "id": "2372d5a6-0675-48d9-8897-c01ef826409f",
  "companyId": "ecotapes-001",
  "numero": "3",
  "data": "2026-03-14",
  "scadenza": null,
  "clientId": "cef02c95-9861-4a82-ba3e-9a5c736a1829",
  "tipo": "ddt",
  "stato": "emessa",
  "subtotale": "410.00",
  "totaleIva": "90.20",
  "totale": "500.20",
  "note": null,
  "causaleTrasporto": "Vendita",
  "mezzoTrasporto": "Autocarro",
  "aspettoEsteriore": "Scatole",
  "pesoKg": "45.50",
  "numeroColli": 3,
  "vettore": "BRT Corriere Espresso",
  "destinazione": "Via Garibaldi 15, 30121 Venezia (VE)",
  "createdAt": "2026-03-14T09:57:13.331Z"
}
```

> **Campi importanti nella risposta:**
> - `id` → usalo per il deep-link: `https://fatture-cloud-clone.replit.app/fatture/2372d5a6-0675-48d9-8897-c01ef826409f`
> - `numero` → numero DDT assegnato automaticamente (in questo caso "3")
> - `totale` → totale calcolato automaticamente (subtotale + IVA)

#### Errori possibili

| HTTP | Risposta | Causa | Soluzione |
|------|----------|-------|-----------|
| 400 | `{"message": "companyId obbligatorio"}` | Manca `companyId` | Aggiungi `"companyId": "ecotapes-001"` |
| 400 | `{"message": "clientId obbligatorio"}` | Manca `clientId` | Prima fai l'upsert del cliente (Passo 1) e usa il suo `id` |
| 400 | `{"message": "Almeno una riga (items) è obbligatoria"}` | Array `items` vuoto o mancante | Aggiungi almeno un item con `descrizione` |
| 400 | `{"message": "La data DDT (2026-03-01) non può essere anteriore all'ultimo DDT emesso (2026-03-10)."}` | Data troppo vecchia | Usa una data uguale o successiva all'ultimo DDT |
| 404 | `{"message": "Cliente non trovato"}` | Il `clientId` non esiste | Verifica l'id con GET /api/ext/clients |
| 401 | `{"message": "API key non valida"}` | Header mancante/sbagliato | Controlla l'header `X-API-Key` |

> **Errore più comune:** `"clientId obbligatorio"` — succede quando lo sviluppatore dimentica di usare il campo `id` dalla risposta del passo 1. Il `clientId` è un UUID tipo `"cef02c95-9861-4a82-ba3e-9a5c736a1829"`, non il nome del cliente.

---

### 4. Dettaglio DDT (con righe)

```
GET /api/ext/ddt/:id
```

Restituisce il DDT completo con tutti i dati del cliente e le righe.

```bash
curl -H "X-API-Key: fcloud-ext-2026-k8Xm9PqR7vLw3NzT" \
  "https://fatture-cloud-clone.replit.app/api/ext/ddt/2372d5a6-0675-48d9-8897-c01ef826409f"
```

#### Risposta REALE (HTTP 200)

```json
{
  "id": "2372d5a6-0675-48d9-8897-c01ef826409f",
  "companyId": "ecotapes-001",
  "numero": "3",
  "data": "2026-03-14",
  "scadenza": null,
  "clientId": "cef02c95-9861-4a82-ba3e-9a5c736a1829",
  "tipo": "ddt",
  "stato": "emessa",
  "subtotale": "410.00",
  "totaleIva": "90.20",
  "totale": "500.20",
  "note": null,
  "causaleTrasporto": "Vendita",
  "dataInizioTrasporto": null,
  "oraInizioTrasporto": null,
  "mezzoTrasporto": "Autocarro",
  "aspettoEsteriore": "Scatole",
  "pesoKg": "45.50",
  "numeroColli": 3,
  "vettore": "BRT Corriere Espresso",
  "destinazione": "Via Garibaldi 15, 30121 Venezia (VE)",
  "orderId": null,
  "createdAt": "2026-03-14T09:57:13.331Z",
  "client": {
    "id": "cef02c95-9861-4a82-ba3e-9a5c736a1829",
    "companyId": "ecotapes-001",
    "tipo": "azienda",
    "ragioneSociale": "Azienda Demo FLUPSY Srl",
    "partitaIva": "09876543210",
    "codiceFiscale": "09876543210",
    "indirizzo": "Via Garibaldi 15",
    "cap": "30121",
    "citta": "Venezia",
    "provincia": "VE",
    "nazione": "IT",
    "email": "demo@flupsy.it",
    "pec": "demo@pec.flupsy.it",
    "codiceDestinatario": "M5UXCR1"
  },
  "items": [
    {
      "id": "9497345a-e787-4e8c-99d8-8d8515e401ae",
      "invoiceId": "2372d5a6-0675-48d9-8897-c01ef826409f",
      "productId": null,
      "descrizione": "Nastro adesivo avana 50mm x 66mt",
      "quantita": "100.00",
      "prezzoUnitario": "2.5000",
      "aliquotaIva": 22,
      "natura": null,
      "sconto": "0.00",
      "totale": "250.0000"
    },
    {
      "id": "2286cfbe-6fe5-469c-8699-068efa7a7000",
      "invoiceId": "2372d5a6-0675-48d9-8897-c01ef826409f",
      "productId": null,
      "descrizione": "Film estensibile manuale 500mm",
      "quantita": "20.00",
      "prezzoUnitario": "8.0000",
      "aliquotaIva": 22,
      "natura": null,
      "sconto": "0.00",
      "totale": "160.0000"
    }
  ]
}
```

> **Nota:** I valori numerici nelle righe vengono restituiti come stringhe (es. `"100.00"` per quantità, `"2.5000"` per prezzo). Questo è il formato standard per i decimali precisi. Convertili in numero nel tuo codice: `parseFloat(item.quantita)` oppure `float(item["quantita"])` in Python.

#### Errore 404

```json
{"message": "DDT non trovato"}
```

---

### 5. Elenco DDT (con filtri)

```
GET /api/ext/ddt
```

#### Filtri disponibili (query string)

| Parametro | Tipo | Descrizione | Esempio |
|-----------|------|-------------|---------|
| `companyId` | string | Filtra per azienda | `ecotapes-001` |
| `stato` | string | `bozza` / `emessa` / `annullata` | `emessa` |
| `clientId` | string | Filtra per cliente | `cef02c95-...` |
| `dataFrom` | string | Da data (inclusa) | `2026-03-01` |
| `dataTo` | string | A data (inclusa) | `2026-03-31` |

I filtri sono **tutti opzionali** e combinabili tra loro.

#### Esempi

```bash
# Tutti i DDT di Ecotapes
curl -H "X-API-Key: fcloud-ext-2026-k8Xm9PqR7vLw3NzT" \
  "https://fatture-cloud-clone.replit.app/api/ext/ddt?companyId=ecotapes-001"

# Solo DDT emessi nel mese di marzo
curl -H "X-API-Key: fcloud-ext-2026-k8Xm9PqR7vLw3NzT" \
  "https://fatture-cloud-clone.replit.app/api/ext/ddt?companyId=ecotapes-001&stato=emessa&dataFrom=2026-03-01&dataTo=2026-03-31"

# DDT di un cliente specifico
curl -H "X-API-Key: fcloud-ext-2026-k8Xm9PqR7vLw3NzT" \
  "https://fatture-cloud-clone.replit.app/api/ext/ddt?companyId=ecotapes-001&clientId=cef02c95-9861-4a82-ba3e-9a5c736a1829"
```

Risposta: array di oggetti DDT (ciascuno include l'oggetto `client` annidato).

---

### 6. Aggiornare un DDT

```
PATCH /api/ext/ddt/:id
Content-Type: application/json
```

Aggiorna **solo** i campi che passi nel body. I campi non inclusi restano invariati.

#### Campi aggiornabili

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `stato` | string | `bozza` / `emessa` / `annullata` |
| `note` | string | Note libere |
| `causaleTrasporto` | string | Causale trasporto |
| `dataInizioTrasporto` | string | Data inizio trasporto |
| `oraInizioTrasporto` | string | Ora inizio trasporto |
| `mezzoTrasporto` | string | Mezzo di trasporto |
| `aspettoEsteriore` | string | Aspetto esteriore |
| `pesoKg` | string/number | Peso kg |
| `numeroColli` | number | Numero colli |
| `vettore` | string | Vettore |
| `destinazione` | string | Destinazione |

#### Esempio — annullare un DDT

```bash
curl -X PATCH \
  -H "X-API-Key: fcloud-ext-2026-k8Xm9PqR7vLw3NzT" \
  -H "Content-Type: application/json" \
  -d '{"stato": "annullata", "note": "Annullato su richiesta del cliente"}' \
  "https://fatture-cloud-clone.replit.app/api/ext/ddt/2372d5a6-0675-48d9-8897-c01ef826409f"
```

Risposta: il DDT aggiornato completo (HTTP 200).

---

### 7. Eliminare un DDT

```
DELETE /api/ext/ddt/:id
```

Elimina il DDT e tutte le sue righe. **Operazione irreversibile.**

```bash
curl -X DELETE \
  -H "X-API-Key: fcloud-ext-2026-k8Xm9PqR7vLw3NzT" \
  "https://fatture-cloud-clone.replit.app/api/ext/ddt/2372d5a6-0675-48d9-8897-c01ef826409f"
```

Risposta:
```json
{"success": true, "message": "DDT eliminato"}
```

---

### 8. Scaricare XML FatturaPA

```
GET /api/ext/ddt/:id/xml
```

Scarica il file XML in formato FatturaPA (TD24) del DDT.

```bash
curl -H "X-API-Key: fcloud-ext-2026-k8Xm9PqR7vLw3NzT" \
  -o DDT_3.xml \
  "https://fatture-cloud-clone.replit.app/api/ext/ddt/2372d5a6-0675-48d9-8897-c01ef826409f/xml"
```

Risposta: file XML con `Content-Type: application/xml`.

---

## API Prodotti

```
GET /api/ext/products?companyId=ecotapes-001
```

Restituisce il catalogo prodotti dell'azienda. Utile per:
- Pre-popolare le righe del DDT con `productId`
- Recuperare prezzi e aliquote IVA dal catalogo

```bash
curl -H "X-API-Key: fcloud-ext-2026-k8Xm9PqR7vLw3NzT" \
  "https://fatture-cloud-clone.replit.app/api/ext/products?companyId=ecotapes-001"
```

Risposta: array di oggetti prodotto con `id`, `codice`, `descrizione`, `prezzoUnitario`, `aliquotaIva`, `unitaMisura`, `categoria`.

---

## Deep-Link: Aprire un DDT nel Browser

Dopo aver creato un DDT via API, puoi reindirizzare l'utente direttamente alla pagina di dettaglio nel browser.

### Formato URL

```
https://fatture-cloud-clone.replit.app/fatture/{id}
```

Dove `{id}` è il campo `id` (UUID) restituito dalla POST di creazione.

### Esempio concreto

```
https://fatture-cloud-clone.replit.app/fatture/2372d5a6-0675-48d9-8897-c01ef826409f
```

### Cosa vede l'utente

La pagina mostra:
- Intestazione con numero DDT, data, stato (badge colorato)
- Dati cedente (azienda emittente) e cessionario (cliente destinatario)
- Tabella righe con descrizione, quantità, prezzo unitario, IVA, totale riga
- Riepilogo IVA e totale documento
- Dati trasporto (causale, vettore, colli, peso, destinazione)
- Pulsanti azione: modifica, scarica XML, cambia stato, stampa

### Come usarlo nel codice

**JavaScript (web app):**
```javascript
const ddtUrl = `https://fatture-cloud-clone.replit.app/fatture/${ddt.id}`;
window.open(ddtUrl, '_blank');
```

**JavaScript (link in pagina HTML):**
```html
<a href="https://fatture-cloud-clone.replit.app/fatture/2372d5a6-..." target="_blank">
  Vedi DDT in FattureCloud
</a>
```

**Python (app desktop):**
```python
import webbrowser
webbrowser.open(f"https://fatture-cloud-clone.replit.app/fatture/{ddt_id}")
```

### Nota importante sull'autenticazione

L'utente deve essere **già autenticato** su FattureCloud per visualizzare la pagina. Se non lo è, verrà reindirizzato alla schermata di login e poi alla pagina richiesta. Credenziali di test:

| Utente | Password | Ruolo |
|--------|----------|-------|
| `admin` | `admin123` | Amministratore (accesso completo) |

### URL per creare un nuovo DDT manualmente

```
https://fatture-cloud-clone.replit.app/fatture/nuova?tipo=ddt
```

Questo apre il form di creazione DDT vuoto. Tuttavia, per la pre-compilazione completa, è consigliato il flusso via API (crea via POST → apri il deep-link).

---

## Gestione Errori e Troubleshooting

### Codici HTTP

| Codice | Significato | Quando |
|--------|-------------|--------|
| `200` | OK | Operazione riuscita (GET, PATCH, upsert cliente esistente) |
| `201` | Creato | DDT o cliente creato con successo |
| `400` | Errore validazione | Campo obbligatorio mancante o valore non valido |
| `401` | Non autorizzato | API key mancante o errata |
| `404` | Non trovato | ID non esiste |
| `500` | Errore server | Bug interno (segnalare) |

### Come gestire gli errori nel codice

**JavaScript:**
```javascript
const response = await fetch(`${API}/api/ext/ddt`, {
  method: "POST",
  headers: {
    "X-API-Key": "fcloud-ext-2026-k8Xm9PqR7vLw3NzT",
    "Content-Type": "application/json"
  },
  body: JSON.stringify(payload)
});

if (!response.ok) {
  const errore = await response.json();
  console.error(`Errore ${response.status}: ${errore.message}`);
  // Gestisci l'errore nel tuo codice
  // errore.message contiene sempre una descrizione leggibile in italiano
  return;
}

const ddt = await response.json();
console.log(`DDT creato con successo: N. ${ddt.numero}`);
```

**Python:**
```python
response = requests.post(f"{BASE_URL}/api/ext/ddt", headers=HEADERS, json=payload)

if response.status_code >= 400:
    errore = response.json()
    print(f"Errore {response.status_code}: {errore['message']}")
    # errore['message'] contiene sempre una descrizione leggibile in italiano
else:
    ddt = response.json()
    print(f"DDT creato con successo: N. {ddt['numero']}")
```

---

## Esempio Completo JavaScript

```javascript
// ===========================================================
// Integrazione FLUPSY → FattureCloud — Esempio completo
// ===========================================================

const API = "https://fatture-cloud-clone.replit.app";
const KEY = "fcloud-ext-2026-k8Xm9PqR7vLw3NzT";

const headers = {
  "X-API-Key": KEY,
  "Content-Type": "application/json"
};

// Funzione helper per le chiamate API
async function apiCall(method, path, body = null) {
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${API}${path}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${data.message}`);
  }

  return data;
}

// ═══════════════════════════════════════════════════════════
// PASSO 1: Registra/trova il cliente
// ═══════════════════════════════════════════════════════════
let cliente;
try {
  cliente = await apiCall("POST", "/api/ext/clients", {
    companyId: "ecotapes-001",
    ragioneSociale: "Azienda Demo FLUPSY Srl",
    partitaIva: "09876543210",
    codiceFiscale: "09876543210",
    indirizzo: "Via Garibaldi 15",
    cap: "30121",
    citta: "Venezia",
    provincia: "VE",
    email: "demo@flupsy.it",
    pec: "demo@pec.flupsy.it",
    codiceDestinatario: "M5UXCR1"
  });
  console.log(`Cliente: ${cliente.ragioneSociale} (ID: ${cliente.id})`);
} catch (err) {
  console.error("Errore nel creare/trovare il cliente:", err.message);
  // Non procedere senza un cliente valido
  throw err;
}

// ═══════════════════════════════════════════════════════════
// PASSO 2: Crea il DDT
// ═══════════════════════════════════════════════════════════
let ddt;
try {
  ddt = await apiCall("POST", "/api/ext/ddt", {
    companyId: "ecotapes-001",
    clientId: cliente.id,               // ← dall'output del passo 1
    data: "2026-03-15",
    causaleTrasporto: "Vendita",
    mezzoTrasporto: "Autocarro",
    aspettoEsteriore: "Scatole",
    pesoKg: 45.5,
    numeroColli: 3,
    vettore: "BRT Corriere Espresso",
    destinazione: "Via Garibaldi 15, 30121 Venezia (VE)",
    items: [
      {
        descrizione: "Nastro adesivo avana 50mm x 66mt",
        quantita: 100,
        prezzoUnitario: 2.50,
        aliquotaIva: 22,
        unitaMisura: "PZ"
      },
      {
        descrizione: "Film estensibile manuale 500mm",
        quantita: 20,
        prezzoUnitario: 8.00,
        aliquotaIva: 22,
        unitaMisura: "RL"
      }
    ]
  });
  console.log(`DDT creato: N. ${ddt.numero}, Totale: €${ddt.totale}`);
} catch (err) {
  console.error("Errore nel creare il DDT:", err.message);
  throw err;
}

// ═══════════════════════════════════════════════════════════
// PASSO 3: Apri il DDT nel browser dell'utente
// ═══════════════════════════════════════════════════════════
const deepLink = `${API}/fatture/${ddt.id}`;
console.log(`Deep-link: ${deepLink}`);
window.open(deepLink, '_blank');

// ═══════════════════════════════════════════════════════════
// PASSI OPZIONALI
// ═══════════════════════════════════════════════════════════

// Leggere il dettaglio completo (con righe)
const dettaglio = await apiCall("GET", `/api/ext/ddt/${ddt.id}`);
console.log(`Righe: ${dettaglio.items.length}`);
dettaglio.items.forEach(item => {
  console.log(`  - ${item.descrizione}: ${item.quantita} x €${item.prezzoUnitario}`);
});

// Scaricare l'XML FatturaPA
const xmlResponse = await fetch(`${API}/api/ext/ddt/${ddt.id}/xml`, {
  headers: { "X-API-Key": KEY }
});
const xml = await xmlResponse.text();
// Salva o elabora l'XML come necessario

// Aggiornare nota sul DDT
await apiCall("PATCH", `/api/ext/ddt/${ddt.id}`, {
  note: "Consegnato regolarmente il 15/03/2026"
});

// Lista DDT del mese
const ddtMese = await apiCall("GET", "/api/ext/ddt?companyId=ecotapes-001&dataFrom=2026-03-01&dataTo=2026-03-31");
console.log(`DDT totali nel mese: ${ddtMese.length}`);
```

---

## Esempio Completo Python

```python
# ===========================================================
# Integrazione FLUPSY → FattureCloud — Esempio completo
# ===========================================================

import requests
import webbrowser
import sys

API = "https://fatture-cloud-clone.replit.app"
KEY = "fcloud-ext-2026-k8Xm9PqR7vLw3NzT"
HEADERS = {"X-API-Key": KEY, "Content-Type": "application/json"}


def api_call(method, path, json_body=None):
    """Helper per chiamate API con gestione errori."""
    url = f"{API}{path}"
    response = requests.request(method, url, headers=HEADERS, json=json_body)

    if response.status_code >= 400:
        errore = response.json()
        print(f"ERRORE {response.status_code}: {errore['message']}")
        sys.exit(1)

    return response.json()


# ═══════════════════════════════════════════════════════════
# PASSO 1: Registra/trova il cliente
# ═══════════════════════════════════════════════════════════
cliente = api_call("POST", "/api/ext/clients", {
    "companyId": "ecotapes-001",
    "ragioneSociale": "Azienda Demo FLUPSY Srl",
    "partitaIva": "09876543210",
    "codiceFiscale": "09876543210",
    "indirizzo": "Via Garibaldi 15",
    "cap": "30121",
    "citta": "Venezia",
    "provincia": "VE",
    "email": "demo@flupsy.it",
    "pec": "demo@pec.flupsy.it",
    "codiceDestinatario": "M5UXCR1"
})
print(f"Cliente: {cliente['ragioneSociale']} (ID: {cliente['id']})")


# ═══════════════════════════════════════════════════════════
# PASSO 2: Crea il DDT
# ═══════════════════════════════════════════════════════════
ddt = api_call("POST", "/api/ext/ddt", {
    "companyId": "ecotapes-001",
    "clientId": cliente["id"],            # ← dall'output del passo 1
    "data": "2026-03-15",
    "causaleTrasporto": "Vendita",
    "mezzoTrasporto": "Autocarro",
    "aspettoEsteriore": "Scatole",
    "pesoKg": 45.5,
    "numeroColli": 3,
    "vettore": "BRT Corriere Espresso",
    "destinazione": "Via Garibaldi 15, 30121 Venezia (VE)",
    "items": [
        {
            "descrizione": "Nastro adesivo avana 50mm x 66mt",
            "quantita": 100,
            "prezzoUnitario": 2.50,
            "aliquotaIva": 22,
            "unitaMisura": "PZ"
        },
        {
            "descrizione": "Film estensibile manuale 500mm",
            "quantita": 20,
            "prezzoUnitario": 8.00,
            "aliquotaIva": 22,
            "unitaMisura": "RL"
        }
    ]
})
print(f"DDT creato: N. {ddt['numero']}, Totale: EUR {ddt['totale']}")


# ═══════════════════════════════════════════════════════════
# PASSO 3: Apri il DDT nel browser dell'utente
# ═══════════════════════════════════════════════════════════
deep_link = f"{API}/fatture/{ddt['id']}"
print(f"Deep-link: {deep_link}")
webbrowser.open(deep_link)


# ═══════════════════════════════════════════════════════════
# PASSI OPZIONALI
# ═══════════════════════════════════════════════════════════

# Leggere il dettaglio completo (con righe)
dettaglio = api_call("GET", f"/api/ext/ddt/{ddt['id']}")
print(f"Righe: {len(dettaglio['items'])}")
for item in dettaglio["items"]:
    print(f"  - {item['descrizione']}: {item['quantita']} x EUR {item['prezzoUnitario']}")

# Scaricare l'XML FatturaPA
xml_resp = requests.get(f"{API}/api/ext/ddt/{ddt['id']}/xml", headers=HEADERS)
with open(f"DDT_{ddt['numero']}.xml", "w") as f:
    f.write(xml_resp.text)
print(f"XML salvato: DDT_{ddt['numero']}.xml")

# Aggiornare nota
api_call("PATCH", f"/api/ext/ddt/{ddt['id']}", {
    "note": "Consegnato regolarmente il 15/03/2026"
})
print("Nota aggiornata")

# Lista DDT del mese
ddt_mese = api_call("GET", "/api/ext/ddt?companyId=ecotapes-001&dataFrom=2026-03-01&dataTo=2026-03-31")
print(f"DDT totali nel mese: {len(ddt_mese)}")
```

---

## Esempio Completo cURL (copia-incolla)

Questi comandi sono **pronti per essere copiati e incollati** nel terminale per testare ogni endpoint.

```bash
# ═══════════════════════════════════════════
# VARIABILI — impostale una volta
# ═══════════════════════════════════════════
API="https://fatture-cloud-clone.replit.app"
KEY="fcloud-ext-2026-k8Xm9PqR7vLw3NzT"

# ═══════════════════════════════════════════
# PASSO 1: Upsert cliente
# ═══════════════════════════════════════════
curl -s -X POST \
  -H "X-API-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "ecotapes-001",
    "ragioneSociale": "Test FLUPSY Srl",
    "partitaIva": "11223344556",
    "indirizzo": "Via Test 1",
    "citta": "Padova",
    "cap": "35100",
    "provincia": "PD"
  }' \
  "$API/api/ext/clients"

# → Copia il campo "id" dalla risposta
# → Esempio: "id": "abc12345-6789-..."

# ═══════════════════════════════════════════
# PASSO 2: Crea DDT (sostituisci CLIENT_ID)
# ═══════════════════════════════════════════
CLIENT_ID="abc12345-6789-..."   # ← SOSTITUISCI con l'id reale

curl -s -X POST \
  -H "X-API-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"companyId\": \"ecotapes-001\",
    \"clientId\": \"$CLIENT_ID\",
    \"causaleTrasporto\": \"Vendita\",
    \"vettore\": \"BRT\",
    \"items\": [
      {\"descrizione\": \"Prodotto test\", \"quantita\": 5, \"prezzoUnitario\": 10, \"aliquotaIva\": 22}
    ]
  }" \
  "$API/api/ext/ddt"

# → Copia il campo "id" dalla risposta
# → Esempio: "id": "ddt98765-4321-..."

# ═══════════════════════════════════════════
# PASSO 3: Deep-link (apri nel browser)
# ═══════════════════════════════════════════
DDT_ID="ddt98765-4321-..."   # ← SOSTITUISCI con l'id reale

echo "Apri: $API/fatture/$DDT_ID"

# ═══════════════════════════════════════════
# EXTRA: Dettaglio DDT
# ═══════════════════════════════════════════
curl -s -H "X-API-Key: $KEY" "$API/api/ext/ddt/$DDT_ID"

# ═══════════════════════════════════════════
# EXTRA: Lista DDT
# ═══════════════════════════════════════════
curl -s -H "X-API-Key: $KEY" "$API/api/ext/ddt?companyId=ecotapes-001"

# ═══════════════════════════════════════════
# EXTRA: Scarica XML
# ═══════════════════════════════════════════
curl -s -H "X-API-Key: $KEY" -o "DDT.xml" "$API/api/ext/ddt/$DDT_ID/xml"

# ═══════════════════════════════════════════
# EXTRA: Aggiorna stato
# ═══════════════════════════════════════════
curl -s -X PATCH \
  -H "X-API-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"stato": "annullata", "note": "Test annullamento"}' \
  "$API/api/ext/ddt/$DDT_ID"

# ═══════════════════════════════════════════
# EXTRA: Elimina DDT
# ═══════════════════════════════════════════
curl -s -X DELETE -H "X-API-Key: $KEY" "$API/api/ext/ddt/$DDT_ID"
```

---

## FAQ e Problemi Comuni

### "Ricevo sempre 401 Unauthorized"

- Verifica di usare l'header `X-API-Key` (non `Authorization`, non `Api-Key`, non `apikey`)
- La chiave è: `fcloud-ext-2026-k8Xm9PqR7vLw3NzT` — copia-incolla esattamente
- L'header deve essere nella richiesta HTTP, non nella query string

### "Ricevo 400: clientId obbligatorio"

Il `clientId` è il campo `id` (UUID) restituito dalla chiamata POST `/api/ext/clients`. **Non** è il nome del cliente, né la P.IVA.

Flusso corretto:
```
1. POST /api/ext/clients → risposta: { "id": "cef02c95-9861-..." }
2. POST /api/ext/ddt con { "clientId": "cef02c95-9861-..." }
```

### "Ricevo 400: La data DDT non può essere anteriore..."

I numeri DDT sono sequenziali e le date devono essere progressive. Se l'ultimo DDT è del 14 marzo, non puoi creare un DDT con data 10 marzo.

**Soluzione:** usa la data di oggi (ometti il campo `data` e il sistema usa la data corrente) oppure una data uguale o successiva all'ultimo DDT.

### "Ricevo 404: DDT non trovato"

L'`id` è un UUID formato `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`. Verifica di non aver troncato l'id o aggiunto spazi.

### "I valori numerici sono stringhe nella risposta"

È voluto. I valori decimali (quantità, prezzi, totali) vengono restituiti come stringhe per preservare la precisione. Nel tuo codice:

- **JavaScript:** `parseFloat(item.prezzoUnitario)` o `Number(item.prezzoUnitario)`
- **Python:** `float(item["prezzoUnitario"])` o `Decimal(item["prezzoUnitario"])`

### "Creo lo stesso cliente due volte"

Se passi la `partitaIva`, il sistema trova il cliente esistente e restituisce sempre quello. Se **non** passi la `partitaIva`, il sistema crea sempre un nuovo cliente. **Passa sempre la partitaIva** per evitare duplicati.

### "Il deep-link non funziona / mostra pagina bianca"

L'utente deve essere autenticato su FattureCloud. Se non lo è, viene reindirizzato al login. Dopo il login, arriva alla pagina del DDT.

### "Devo aggiornare le righe di un DDT esistente"

L'endpoint PATCH non supporta la modifica delle righe (`items`). Per cambiare le righe:
1. Elimina il DDT esistente (`DELETE /api/ext/ddt/:id`)
2. Ricrealo con le nuove righe (`POST /api/ext/ddt`)

### "Come faccio a sapere quale companyId usare?"

I `companyId` sono fissi (vedi tabella sopra). Per l'integrazione FLUPSY con Ecotapes, usa sempre `ecotapes-001`.

### "Posso creare un DDT senza righe?"

No. Ogni DDT deve avere almeno una riga con il campo `descrizione`. Se vuoi creare un DDT "vuoto" per compilarlo dopo nell'interfaccia, passa una riga generica:

```json
{
  "items": [{ "descrizione": "Da completare" }]
}
```

### "Come gestisco il timeout della rete?"

Il server impiega circa 200-500ms per rispondere. Se non ricevi risposta entro 10 secondi, il server potrebbe essere in fase di avvio (cold start). Riprova dopo 30 secondi.

---

## Riepilogo Rapido degli Endpoint

| Metodo | Path | Descrizione |
|--------|------|-------------|
| `GET` | `/api/ext/clients?companyId=...` | Lista clienti |
| `POST` | `/api/ext/clients` | Crea/trova cliente (upsert per P.IVA) |
| `GET` | `/api/ext/products?companyId=...` | Lista prodotti |
| `GET` | `/api/ext/ddt?companyId=...` | Lista DDT (con filtri opzionali) |
| `GET` | `/api/ext/ddt/:id` | Dettaglio DDT con righe e cliente |
| `POST` | `/api/ext/ddt` | Crea DDT (numero auto) |
| `PATCH` | `/api/ext/ddt/:id` | Aggiorna DDT (stato, note, trasporto) |
| `DELETE` | `/api/ext/ddt/:id` | Elimina DDT |
| `GET` | `/api/ext/ddt/:id/xml` | Scarica XML FatturaPA |

**Deep-link:** `https://fatture-cloud-clone.replit.app/fatture/{id}`
