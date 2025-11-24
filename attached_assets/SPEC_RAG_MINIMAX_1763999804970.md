# SPECIFICA TECNICA  
Sistema RAG + Agent MiniMax AI su Replit (React + Node + Postgres)

## 0. Obiettivo

Realizzare un sistema **RAG (Retrieval-Augmented Generation)** che:

1. Usa il **database Postgres esistente** come fonte principale di conoscenza (tabelle già usate dall’app).
2. Indicizza il contenuto del DB in una struttura dedicata (tabelle `kb_*`).
3. Espone una **API `/api/chat`** lato Node che:
   - riceve la domanda dell’utente,
   - dialoga con **MiniMax AI** in modalità **agent / tool-calling**,
   - quando richiesto, esegue un tool `search_kb` che interroga la knowledge base (RAG) e restituisce i risultati a MiniMax,
   - ritorna la risposta finale al frontend.
4. Il frontend **React** offre una UI di chat semplice per interagire col sistema.

## 1. Stack e requisiti

- Ambiente: **Replit**
- Frontend: **React**
- Backend: **Node.js** (+ Express)
- Database: **Postgres**
- LLM: **MiniMax AI** (via API HTTP)
- Embedding:
  - Opzione A (preferita): usare un modello di embedding (es. esterno) e salvare i vettori in Postgres.
  - Il calcolo della similarità può essere fatto:
    - via **pgvector** (se disponibile), oppure
    - a livello Node (cosine similarity) sui vettori caricati dal DB.

## 2. Struttura progetto

```
root/
  backend/
    server.js
    minimaxClient.js
    rag/
      indexer.js
      embeddings.js
      retriever.js
    db/
      pool.js
      schema.sql
  frontend/
    src/
      App.jsx
      components/
        Chat.jsx
  package.json
  SPEC_RAG_MINIMAX.md
```

## 3. Schema DB per la Knowledge Base (RAG)

### Tabelle KB

```
CREATE TABLE IF NOT EXISTS kb_documents (
  id SERIAL PRIMARY KEY,
  source_table TEXT,
  source_pk TEXT,
  title TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kb_chunks (
  id SERIAL PRIMARY KEY,
  document_id INT REFERENCES kb_documents(id),
  chunk_index INT,
  content TEXT
);

CREATE TABLE IF NOT EXISTS kb_embeddings (
  chunk_id INT PRIMARY KEY REFERENCES kb_chunks(id),
  embedding DOUBLE PRECISION[]
);
```

## 4. Indicizzazione del DB

Script `backend/rag/indexer.js`:

- Legge le tabelle operative (es. Vasche, Movimenti…)
- Genera testo descrittivo per ogni record
- Spezza in chunk
- Calcola embedding con `embedText`
- Salva in `kb_*`

## 5. Retriever RAG

`backend/rag/retriever.js`:

- Funzione `searchKb({query, topK})`
- Calcola embedding query
- Recupera embedding chunk
- Calcola similarità coseno (o pgvector)
- Ritorna i chunk più rilevanti

## 6. Client MiniMax

`backend/minimaxClient.js`:

- Wrapper HTTP POST verso MiniMax
- Invia `messages`, `tools`, `model`

## 7. API Chat e Agent

`backend/server.js`:

- Definisce tool `search_kb`
- /api/chat:
  - Prima chiamata a MiniMax con tool_choice:auto
  - Se MiniMax richiede tool:
    - esegue `searchKb`
    - seconda chiamata a MiniMax con risultato del tool
  - Restituisce risposta finale

## 8. Frontend React

`Chat.jsx`:

- Gestisce messages
- Chiama `/api/chat`
- Mostra risposte

`App.jsx`:

- Importa Chat

## 9. Flusso

1. Eseguire schema.sql
2. Lanciare `indexer.js`
3. Avviare backend
4. Avviare frontend
5. MiniMax usa RAG per risposte fondate sul database

## 10. Note per l'agente Replit

- Seguire fedelmente la specifica
- Adattare nomi tabelle reali
- Adattare formato API MiniMax
