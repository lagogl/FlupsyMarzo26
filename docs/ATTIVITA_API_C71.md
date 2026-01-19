# API Attività per Terminale C71

Documentazione API per la lettura e aggiornamento dello stato delle attività assegnate agli operatori.

## Base URL
```
https://[DOMAIN]/api
```

---

## 1. Ottenere le attività assegnate a un operatore

### `GET /api/operators/:operatorId/tasks`

Restituisce tutte le attività assegnate a un operatore specifico.

**Parametri URL:**
| Nome | Tipo | Descrizione |
|------|------|-------------|
| `operatorId` | integer | ID dell'operatore |

**Query Parameters (opzionali):**
| Nome | Tipo | Descrizione |
|------|------|-------------|
| `status` | string | Filtro per stato (es: `assigned,in_progress`) |

**Esempio Request:**
```http
GET /api/operators/5/tasks?status=assigned,in_progress
```

**Response 200 OK:**
```json
[
  {
    "id": 18,
    "taskType": "Vagliatura",
    "description": "vagliare con il t4",
    "priority": "alta",
    "status": "in_attesa",
    "dueDate": "2025-12-02",
    "notes": "Vendita di T4 per adriatica 200.000 animali (chied...",
    "cadence": "settimanale",
    "cadenceInterval": null,
    "createdAt": "2025-11-28T14:22:00.000Z",
    "assignment": {
      "id": 45,
      "status": "assigned",
      "assignedAt": "2025-11-28T14:22:00.000Z",
      "startedAt": null,
      "completedAt": null,
      "completionNotes": null
    },
    "baskets": [
      {
        "id": 1,
        "basketId": 13,
        "physicalNumber": 13,
        "flupsyId": 1607,
        "flupsyName": "FLUPSY 1",
        "role": "source"
      }
    ]
  }
]
```

---

## 2. Ottenere dettagli di una singola attività

### `GET /api/tasks/:id`

**Parametri URL:**
| Nome | Tipo | Descrizione |
|------|------|-------------|
| `id` | integer | ID dell'attività |

**Response 200 OK:**
```json
{
  "id": 18,
  "selectionId": null,
  "taskType": "Vagliatura",
  "description": "vagliare con il t4",
  "priority": "alta",
  "status": "in_attesa",
  "dueDate": "2025-12-02",
  "notes": "Vendita di T4 per adriatica...",
  "cadence": "settimanale",
  "cadenceInterval": null,
  "createdAt": "2025-11-28T14:22:00.000Z",
  "updatedAt": "2025-11-28T14:22:00.000Z",
  "completedAt": null,
  "assignments": [
    {
      "id": 45,
      "operatorId": 5,
      "operatorName": "Andrea Contato",
      "status": "assigned",
      "assignedAt": "2025-11-28T14:22:00.000Z",
      "startedAt": null,
      "completedAt": null
    }
  ],
  "baskets": [
    {
      "basketId": 13,
      "physicalNumber": 13,
      "flupsyName": "FLUPSY 1",
      "role": "source"
    }
  ]
}
```

---

## 3. Ottenere i cestelli di un'attività

### `GET /api/tasks/:id/baskets`

**Parametri URL:**
| Nome | Tipo | Descrizione |
|------|------|-------------|
| `id` | integer | ID dell'attività |

**Response 200 OK:**
```json
[
  {
    "id": 1,
    "taskId": 18,
    "basketId": 13,
    "role": "source",
    "basket": {
      "id": 13,
      "physicalNumber": 13,
      "flupsyId": 1607,
      "state": "active",
      "row": "DX",
      "position": 3,
      "rfidUhfEpc": "E20047137F40602357880100"
    }
  }
]
```

---

## 4. Aggiornare lo stato dell'assegnazione (operatore)

### `PATCH /api/tasks/:taskId/assignments/:assignmentId`

L'operatore usa questo endpoint per aggiornare lo stato della propria assegnazione.

**Parametri URL:**
| Nome | Tipo | Descrizione |
|------|------|-------------|
| `taskId` | integer | ID dell'attività |
| `assignmentId` | integer | ID dell'assegnazione |

**Body Request:**
```json
{
  "status": "in_progress",
  "operatorId": 5,
  "completionNotes": "Note opzionali"
}
```

**Valori status validi:**
| Stato | Descrizione | operatorId richiesto? |
|-------|-------------|----------------------|
| `assigned` | Assegnata | No |
| `accepted` | Accettata dall'operatore | No |
| `in_progress` | In corso | **Sì** |
| `completed` | Completata | **Sì** |

**Response 200 OK:**
```json
{
  "id": 45,
  "taskId": 18,
  "operatorId": 5,
  "status": "in_progress",
  "assignedAt": "2025-11-28T14:22:00.000Z",
  "startedAt": "2025-12-01T09:15:00.000Z",
  "completedAt": null,
  "completionNotes": null
}
```

**Esempio - Avviare un'attività:**
```http
PATCH /api/tasks/18/assignments/45
Content-Type: application/json

{
  "status": "in_progress",
  "operatorId": 5
}
```

**Esempio - Completare un'attività:**
```http
PATCH /api/tasks/18/assignments/45
Content-Type: application/json

{
  "status": "completed",
  "operatorId": 5,
  "completionNotes": "Vagliatura completata, 15.000 animali processati"
}
```

---

## 5. Completare un'attività (intera)

### `POST /api/tasks/:id/complete`

Segna l'intera attività come completata (utile quando tutti gli operatori hanno finito).

**Parametri URL:**
| Nome | Tipo | Descrizione |
|------|------|-------------|
| `id` | integer | ID dell'attività |

**Response 200 OK:**
```json
{
  "id": 18,
  "status": "completata",
  "completedAt": "2025-12-01T11:30:00.000Z"
}
```

---

## 6. Aggiornare un'attività

### `PATCH /api/tasks/:id`

Aggiorna campi dell'attività (descrizione, priorità, note, ecc.).

**Body Request (tutti i campi opzionali):**
```json
{
  "description": "nuova descrizione",
  "priority": "media",
  "status": "in_corso",
  "notes": "note aggiuntive",
  "dueDate": "2025-12-15"
}
```

**Valori priority:** `alta`, `media`, `bassa`

**Valori status attività:** `in_attesa`, `in_corso`, `completata`, `annullata`

---

## Flusso Tipico per App C71

### 1. Login operatore → ottieni `operatorId`

### 2. Recupera attività assegnate:
```http
GET /api/operators/{operatorId}/tasks?status=assigned,accepted,in_progress
```

### 3. Mostra lista attività con:
- Tipo (Vagliatura, Pulizia, ecc.)
- Priorità (badge colorato)
- Scadenza
- Cestelli coinvolti

### 4. Operatore seleziona attività → mostra dettagli:
```http
GET /api/tasks/{taskId}
GET /api/tasks/{taskId}/baskets
```

### 5. Operatore avvia attività:
```http
PATCH /api/tasks/{taskId}/assignments/{assignmentId}
Body: { "status": "in_progress", "operatorId": {operatorId} }
```

### 6. Operatore scansiona cestelli con RFID UHF:
- Usa campo `rfidUhfEpc` per match

### 7. Operatore completa:
```http
PATCH /api/tasks/{taskId}/assignments/{assignmentId}
Body: { 
  "status": "completed", 
  "operatorId": {operatorId},
  "completionNotes": "Note opzionali" 
}
```

---

## Codici Errore

| Codice | Descrizione |
|--------|-------------|
| 400 | Parametri non validi |
| 404 | Attività/Assegnazione non trovata |
| 500 | Errore interno del server |

---

## Headers Richiesti

```http
Content-Type: application/json
```

---

## Note Tecniche

- Tutti i timestamp sono in formato ISO 8601 (UTC)
- Le date (`dueDate`) sono in formato `YYYY-MM-DD`
- Gli ID sono sempre numeri interi
- Il campo `rfidUhfEpc` nei cestelli contiene il codice EPC del tag RFID UHF per la scansione
