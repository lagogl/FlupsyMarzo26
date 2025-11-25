# Piano di Integrazione Modulo LCI (Life Cycle Inventory)

## ECOTAPES Integration Module - Delta Futuro FLUPSY Management System

**Versione**: 1.0  
**Data**: Novembre 2024  
**Stato**: Pianificazione  
**Priorità**: Media-Alta  

---

## 1. Executive Summary

### 1.1 Obiettivo
Sviluppare un modulo **completamente indipendente** per la gestione dell'inventario del ciclo di vita (LCI) che:
- Raccolga automaticamente dati di produzione dall'app esistente
- Gestisca inventario materiali, attrezzature e consumabili
- Generi report conformi al formato ECOTAPES Excel
- Integri analisi AI per previsioni e ottimizzazioni

### 1.2 Principi Fondamentali

| Principio | Descrizione |
|-----------|-------------|
| **Isolamento Totale** | Nessuna modifica ai moduli esistenti |
| **Accoppiamento Debole** | Comunicazione solo via API REST interne |
| **Fallback Graceful** | L'app principale funziona anche se LCI è disabilitato |
| **Database Separato** | Tabelle dedicate con prefisso `lci_` |
| **Feature Flag** | Attivabile/disattivabile senza deploy |

---

## 2. Architettura del Sistema

### 2.1 Posizione nel Progetto

```
server/
├── modules/
│   ├── lci/                          # NUOVO MODULO INDIPENDENTE
│   │   ├── index.ts                  # Entry point e registrazione
│   │   ├── lci.routes.ts             # Definizione API endpoints
│   │   ├── lci.controller.ts         # Handler HTTP
│   │   ├── services/
│   │   │   ├── lci-data.service.ts       # Logica business principale
│   │   │   ├── lci-materials.service.ts  # Gestione materiali/attrezzature
│   │   │   ├── lci-consumables.service.ts # Gestione consumabili
│   │   │   ├── lci-export.service.ts     # Generazione Excel
│   │   │   ├── lci-import.service.ts     # Import dati esterni
│   │   │   └── lci-ai.service.ts         # Integrazione AI
│   │   ├── repositories/
│   │   │   ├── lci-materials.repository.ts
│   │   │   ├── lci-consumables.repository.ts
│   │   │   └── lci-reports.repository.ts
│   │   ├── adapters/
│   │   │   ├── production-adapter.ts     # Lettura dati produzione (READ-ONLY)
│   │   │   ├── lots-adapter.ts           # Lettura dati lotti (READ-ONLY)
│   │   │   └── flupsy-adapter.ts         # Lettura dati FLUPSY (READ-ONLY)
│   │   ├── types/
│   │   │   └── lci.types.ts              # Definizioni TypeScript
│   │   └── README.md                     # Documentazione modulo

client/src/
├── pages/
│   └── LCIModule.tsx                 # Pagina principale LCI
├── components/
│   └── lci/                          # Componenti UI dedicati
│       ├── LCIDashboard.tsx
│       ├── MaterialsInventory.tsx
│       ├── ConsumablesTracker.tsx
│       ├── LCIExportPanel.tsx
│       └── LCIAIInsights.tsx

shared/
├── lci-schema.ts                     # Schema database LCI (separato)
```

### 2.2 Diagramma Architetturale

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FLUPSY Management System                          │
│                         (App Esistente - INTATTA)                        │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Operations │  │    Lots     │  │   FLUPSY    │  │   Cycles    │    │
│  │   Module    │  │   Module    │  │   Module    │  │   Module    │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                │                │                │            │
│         └────────────────┴────────────────┴────────────────┘            │
│                                   │                                      │
│                          [READ-ONLY APIs]                                │
│                                   │                                      │
├───────────────────────────────────┼──────────────────────────────────────┤
│                                   ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    MODULO LCI (INDIPENDENTE)                     │    │
│  │  ┌─────────────────────────────────────────────────────────────┐│    │
│  │  │                      ADAPTERS LAYER                         ││    │
│  │  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        ││    │
│  │  │  │  Production  │ │    Lots      │ │   FLUPSY     │        ││    │
│  │  │  │   Adapter    │ │   Adapter    │ │   Adapter    │        ││    │
│  │  │  └──────────────┘ └──────────────┘ └──────────────┘        ││    │
│  │  └─────────────────────────────────────────────────────────────┘│    │
│  │                                │                                 │    │
│  │  ┌─────────────────────────────────────────────────────────────┐│    │
│  │  │                     SERVICES LAYER                          ││    │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       ││    │
│  │  │  │ LCI Data │ │Materials │ │Consumable│ │  Export  │       ││    │
│  │  │  │ Service  │ │ Service  │ │ Service  │ │ Service  │       ││    │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       ││    │
│  │  │                      ┌──────────┐                           ││    │
│  │  │                      │ LCI AI   │ ◄── GPT-4o Integration   ││    │
│  │  │                      │ Service  │                           ││    │
│  │  │                      └──────────┘                           ││    │
│  │  └─────────────────────────────────────────────────────────────┘│    │
│  │                                │                                 │    │
│  │  ┌─────────────────────────────────────────────────────────────┐│    │
│  │  │                    DATABASE LAYER                           ││    │
│  │  │  ┌──────────────────────────────────────────────────────┐  ││    │
│  │  │  │  PostgreSQL - Tabelle dedicate con prefisso lci_     │  ││    │
│  │  │  │  • lci_materials                                      │  ││    │
│  │  │  │  • lci_consumables                                    │  ││    │
│  │  │  │  • lci_consumption_logs                               │  ││    │
│  │  │  │  • lci_reports                                        │  ││    │
│  │  │  │  • lci_settings                                       │  ││    │
│  │  │  └──────────────────────────────────────────────────────┘  ││    │
│  │  └─────────────────────────────────────────────────────────────┘│    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                   │                                      │
│                          [Excel LCI Export]                              │
│                                   ▼                                      │
│                        ┌───────────────────┐                             │
│                        │  File ECOTAPES    │                             │
│                        │  Excel LCI        │                             │
│                        └───────────────────┘                             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Schema Database

### 3.1 Nuove Tabelle (prefisso `lci_`)

Le tabelle LCI sono **completamente separate** dalle tabelle esistenti. Nessuna foreign key verso tabelle core per garantire isolamento.

#### Tabella: `lci_materials`
Inventario attrezzature e infrastrutture

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | SERIAL | Chiave primaria |
| `name` | VARCHAR(255) | Nome materiale/attrezzatura |
| `category` | VARCHAR(100) | Categoria (FLUPSY, Raceway, Filtri, Pompe, ecc.) |
| `material_type` | VARCHAR(100) | Tipo materiale (PVC, PP, Alluminio, Acciaio, ecc.) |
| `expected_life_years` | DECIMAL(5,2) | Vita utile in anni |
| `disposal_method` | TEXT | Metodo smaltimento (testo Ecoinvent) |
| `quantity` | INTEGER | Quantità presente |
| `unit` | VARCHAR(20) | Unità di misura (pc, m, kg) |
| `unit_weight_kg` | DECIMAL(10,3) | Peso unitario in kg |
| `flupsy_reference` | VARCHAR(100) | Riferimento FLUPSY associato (opzionale) |
| `installation_date` | DATE | Data installazione |
| `notes` | TEXT | Note aggiuntive |
| `active` | BOOLEAN | Stato attivo/dismesso |
| `created_at` | TIMESTAMP | Data creazione |
| `updated_at` | TIMESTAMP | Ultimo aggiornamento |

#### Tabella: `lci_consumables`
Definizione consumabili tracciabili

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | SERIAL | Chiave primaria |
| `name` | VARCHAR(255) | Nome consumabile |
| `category` | VARCHAR(100) | Categoria (Energia, Carburante, Chimico, Altro) |
| `unit` | VARCHAR(20) | Unità di misura (kWh, L, kg, m3) |
| `ecoinvent_process` | TEXT | Processo Ecoinvent associato |
| `default_annual_amount` | DECIMAL(15,3) | Quantità annuale di default |
| `notes` | TEXT | Note |
| `active` | BOOLEAN | Attivo |
| `created_at` | TIMESTAMP | Data creazione |

#### Tabella: `lci_consumption_logs`
Log consumi periodici

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | SERIAL | Chiave primaria |
| `consumable_id` | INTEGER | FK a lci_consumables |
| `period_start` | DATE | Inizio periodo |
| `period_end` | DATE | Fine periodo |
| `amount` | DECIMAL(15,3) | Quantità consumata |
| `source` | VARCHAR(50) | Fonte dato (manual, meter, estimate) |
| `notes` | TEXT | Note |
| `created_at` | TIMESTAMP | Data registrazione |
| `created_by` | INTEGER | Utente che ha registrato |

#### Tabella: `lci_production_snapshots`
Snapshot produzione per report LCI

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | SERIAL | Chiave primaria |
| `reference_year` | INTEGER | Anno di riferimento |
| `reference_period` | VARCHAR(50) | Periodo (annuale, Q1, Q2, ecc.) |
| `size_code` | VARCHAR(20) | Codice taglia (T3, T10, ecc.) |
| `output_kg` | DECIMAL(15,3) | Produzione in kg |
| `output_pieces` | BIGINT | Produzione in pezzi |
| `input_kg` | DECIMAL(15,3) | Input seme in kg |
| `input_pieces` | BIGINT | Input seme in pezzi |
| `data_source` | VARCHAR(50) | Fonte (calculated, manual) |
| `calculation_notes` | TEXT | Note sul calcolo |
| `created_at` | TIMESTAMP | Data snapshot |

#### Tabella: `lci_reports`
Report LCI generati

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | SERIAL | Chiave primaria |
| `name` | VARCHAR(255) | Nome report |
| `reference_year` | INTEGER | Anno riferimento |
| `status` | VARCHAR(20) | Stato (draft, final, exported) |
| `excel_path` | TEXT | Path file Excel generato |
| `report_data` | JSONB | Dati completi in JSON |
| `ai_insights` | JSONB | Insight AI generati |
| `created_at` | TIMESTAMP | Data creazione |
| `finalized_at` | TIMESTAMP | Data finalizzazione |
| `exported_at` | TIMESTAMP | Data export |

#### Tabella: `lci_settings`
Configurazioni modulo LCI

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | SERIAL | Chiave primaria |
| `key` | VARCHAR(100) | Chiave configurazione |
| `value` | JSONB | Valore configurazione |
| `description` | TEXT | Descrizione |
| `updated_at` | TIMESTAMP | Ultimo aggiornamento |

---

## 4. API Endpoints

### 4.1 Base URL
```
/api/lci/*
```

### 4.2 Endpoints Materiali

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/lci/materials` | Lista tutti i materiali |
| GET | `/api/lci/materials/:id` | Dettaglio materiale |
| POST | `/api/lci/materials` | Crea nuovo materiale |
| PUT | `/api/lci/materials/:id` | Aggiorna materiale |
| DELETE | `/api/lci/materials/:id` | Elimina materiale (soft delete) |
| GET | `/api/lci/materials/categories` | Lista categorie disponibili |
| GET | `/api/lci/materials/by-category/:category` | Materiali per categoria |
| POST | `/api/lci/materials/bulk-import` | Import massivo da Excel |

### 4.3 Endpoints Consumabili

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/lci/consumables` | Lista consumabili |
| GET | `/api/lci/consumables/:id` | Dettaglio consumabile |
| POST | `/api/lci/consumables` | Crea consumabile |
| PUT | `/api/lci/consumables/:id` | Aggiorna consumabile |
| DELETE | `/api/lci/consumables/:id` | Elimina consumabile |
| GET | `/api/lci/consumables/:id/logs` | Log consumi per consumabile |
| POST | `/api/lci/consumables/:id/logs` | Registra nuovo consumo |
| GET | `/api/lci/consumables/summary/:year` | Riepilogo annuale consumi |

### 4.4 Endpoints Produzione

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/lci/production/calculate/:year` | Calcola produzione da dati app |
| GET | `/api/lci/production/snapshots` | Lista snapshot salvati |
| POST | `/api/lci/production/snapshots` | Crea snapshot produzione |
| GET | `/api/lci/production/snapshots/:id` | Dettaglio snapshot |
| GET | `/api/lci/production/compare` | Confronta periodi |

### 4.5 Endpoints Report

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/lci/reports` | Lista report |
| GET | `/api/lci/reports/:id` | Dettaglio report |
| POST | `/api/lci/reports` | Crea nuovo report |
| PUT | `/api/lci/reports/:id` | Aggiorna report |
| POST | `/api/lci/reports/:id/finalize` | Finalizza report |
| GET | `/api/lci/reports/:id/export/excel` | Esporta in formato Excel ECOTAPES |
| GET | `/api/lci/reports/:id/export/json` | Esporta in JSON |

### 4.6 Endpoints AI

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/lci/ai/health` | Stato servizio AI |
| POST | `/api/lci/ai/analyze-production` | Analisi AI produzione |
| POST | `/api/lci/ai/predict-consumables` | Previsione consumi |
| POST | `/api/lci/ai/sustainability-score` | Calcolo punteggio sostenibilità |
| POST | `/api/lci/ai/report-insights` | Genera insight per report |
| POST | `/api/lci/ai/natural-query` | Query in linguaggio naturale |

### 4.7 Endpoints Configurazione

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/lci/settings` | Tutte le configurazioni |
| GET | `/api/lci/settings/:key` | Singola configurazione |
| PUT | `/api/lci/settings/:key` | Aggiorna configurazione |
| GET | `/api/lci/status` | Stato modulo (enabled/disabled) |
| POST | `/api/lci/toggle` | Abilita/disabilita modulo |

---

## 5. Adapters: Lettura Dati Esistenti (READ-ONLY)

### 5.1 Production Adapter

Legge dati dalle tabelle esistenti senza modificarle:

```
TABELLE LETTE (SOLA LETTURA):
├── operations          → Calcolo output per taglia
├── sizes               → Mapping taglie/pesi
├── cycles              → Conteggio cicli produttivi
└── lots                → Input seme
```

**Logica di calcolo produzione**:
1. Aggregazione operazioni di tipo "vagliatura" e "misura"
2. Raggruppamento per taglia (size_id)
3. Calcolo kg = pezzi / pezzi_per_kg (da tabella sizes)
4. Filtraggio per periodo temporale

### 5.2 Lots Adapter

```
TABELLE LETTE (SOLA LETTURA):
├── lots                → Dati lotti in entrata
├── lot_arrivals        → Arrivi seme
└── sizes               → Taglia seme in entrata
```

**Logica di calcolo input**:
1. Somma quantità lotti per periodo
2. Mapping taglia seme da sizes
3. Calcolo kg e pezzi

### 5.3 FLUPSY Adapter

```
TABELLE LETTE (SOLA LETTURA):
├── flupsys             → Lista impianti
├── baskets             → Cestelli per FLUPSY
└── cycles              → Cicli attivi
```

**Dati estratti**:
- Numero FLUPSY attivi
- Numero Sand-nursery attive
- Cicli produttivi per anno

---

## 6. Integrazione AI (GPT-4o)

### 6.1 Funzionalità AI

Il modulo LCI sfrutterà i servizi AI esistenti (GPT-4o) per:

#### 6.1.1 Calcolo Automatico Produzione
```
Prompt: "Calcola la produzione totale 2024 per il foglio LCI Delta Futuro"

Risposta AI:
- Aggrega operazioni per taglia
- Formatta dati nel formato ECOTAPES
- Evidenzia anomalie (es. produzione sotto media)
```

#### 6.1.2 Previsione Consumi
```
Prompt: "Prevedi il consumo energetico Q1 2025 basandoti sui cicli pianificati"

Risposta AI:
- Analizza storico consumi
- Considera cicli attivi/pianificati
- Genera previsione con intervallo di confidenza
```

#### 6.1.3 Analisi Sostenibilità
```
Prompt: "Qual è l'impatto ambientale per kg di T10 prodotto?"

Risposta AI:
- Combina dati produzione + consumi
- Calcola carbon footprint (kg CO2 eq/kg prodotto)
- Confronta con benchmark settore
```

#### 6.1.4 Validazione Coerenza
```
Prompt: "Verifica coerenza tra dati app e file LCI caricato"

Risposta AI:
- Confronta valori
- Segnala discrepanze significative
- Suggerisce correzioni
```

#### 6.1.5 Report Narrativo
```
Prompt: "Genera un report narrativo per ECOTAPES Q3 2024"

Risposta AI:
- Testo descrittivo per ogni sezione
- Highlight principali risultati
- Suggerimenti miglioramento
```

### 6.2 Implementazione AI

Il servizio `lci-ai.service.ts` utilizzerà:
- Client OpenAI esistente (GPT-4o)
- API key `OPENAI_API_KEY` già configurata
- Prompt template specifici per LCI
- Cache per ottimizzare costi

---

## 7. Interfaccia Utente

### 7.1 Nuova Pagina: `/lci`

**Componente principale**: `LCIModule.tsx`

### 7.2 Layout UI

```
┌─────────────────────────────────────────────────────────────────┐
│  LCI - Inventario Ciclo Vita                          [?] [⚙️] │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────┬─────────────┬────────────┬──────────┬───────────┐ │
│  │Dashboard│  Materiali  │ Consumabili│ Produzione│  Report   │ │
│  └─────────┴─────────────┴────────────┴──────────┴───────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Contenuto Tab Selezionata]                                    │
│                                                                 │
│                                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Tab Dashboard

**Visualizzazione riepilogativa**:
- Card: Totale materiali registrati
- Card: Consumi mese corrente
- Card: Produzione YTD
- Grafico: Andamento consumi ultimi 12 mesi
- Grafico: Produzione per taglia
- Widget AI: Insight automatici

### 7.4 Tab Materiali

**Gestione inventario attrezzature**:
- Tabella con filtri (categoria, materiale, stato)
- Pulsante "Aggiungi Materiale"
- Import da Excel esistente
- Indicatori vita utile residua
- Alerting materiali in scadenza

### 7.5 Tab Consumabili

**Tracciamento consumi**:
- Lista consumabili definiti
- Form registrazione consumo periodico
- Grafici trend per consumabile
- Confronto anno corrente vs precedente

### 7.6 Tab Produzione

**Calcolo automatico da app**:
- Selezione periodo (anno, trimestre)
- Pulsante "Calcola da Dati App"
- Tabella output per taglia
- Tabella input seme
- Confronto con periodi precedenti
- Opzione "Salva Snapshot"

### 7.7 Tab Report

**Generazione report LCI**:
- Lista report esistenti
- Wizard creazione nuovo report
- Anteprima dati
- Export Excel formato ECOTAPES
- Storico export

---

## 8. Formato Export Excel ECOTAPES

### 8.1 Struttura File Generato

Il file Excel generato replicherà la struttura del template ECOTAPES:

```
Foglio: Delta Futuro
├── Riga 1-14: Informazioni Generali (auto-compilate)
├── Riga 15-23: Output/Input (calcolati da app)
├── Riga 24-67: Materiali (da inventario LCI)
└── Riga 68-80: Consumabili (da log consumi)
```

### 8.2 Mapping Campi

| Campo Excel | Fonte Dati |
|-------------|------------|
| Tipologia di impianto | Configurazione LCI |
| Dimensione (m2) | Configurazione LCI |
| Prodotto finale | Calcolato da operazioni |
| Località | Configurazione LCI |
| Coordinate | Configurazione LCI |
| Annualità riferimento | Parametro report |
| Numero cicli produttivi | Conteggio da cycles |
| N. Sand-nursery attive | Conteggio da flupsys |
| Output (kg/pezzi per taglia) | Calcolato da operazioni |
| Input (kg/pezzi seme) | Calcolato da lots |
| Materiali | Tabella lci_materials |
| Consumabili | Tabella lci_consumption_logs |

### 8.3 Libreria Export

Utilizzo libreria `xlsx` già installata nel progetto per:
- Creazione workbook
- Formattazione celle
- Stili coerenti con template originale
- Formule automatiche dove necessario

---

## 9. Sicurezza e Autorizzazioni

### 9.1 Controllo Accessi

| Ruolo | Permessi LCI |
|-------|--------------|
| Admin | Accesso completo |
| Operator | Solo visualizzazione |
| Viewer | Solo dashboard |

### 9.2 Protezione Dati

- **Rate limiting**: Max 100 richieste/minuto per utente
- **Validazione input**: Zod schema per tutti gli endpoint
- **Audit log**: Tracciamento modifiche materiali/consumi
- **Backup**: Tabelle LCI incluse nel backup standard

### 9.3 Feature Flag

Configurazione in `lci_settings`:
```json
{
  "key": "lci_module_enabled",
  "value": true,
  "description": "Abilita/disabilita modulo LCI"
}
```

Middleware di verifica su tutti gli endpoint `/api/lci/*`.

---

## 10. Piano di Implementazione

### 10.1 Fasi di Sviluppo

```
FASE 1: Fondamenta (1-2 settimane)
├── Creazione schema database (tabelle lci_*)
├── Setup modulo base (routes, controller)
├── Implementazione CRUD Materiali
└── Implementazione CRUD Consumabili

FASE 2: Adapters (1 settimana)
├── Production Adapter (lettura operazioni)
├── Lots Adapter (lettura lotti)
├── FLUPSY Adapter (lettura impianti)
└── Test integrazione read-only

FASE 3: Export Excel (1 settimana)
├── Servizio generazione Excel
├── Mapping dati → formato ECOTAPES
├── Template styling
└── Test con file originale

FASE 4: Interfaccia Utente (2 settimane)
├── Pagina LCIModule.tsx
├── Componenti tab (Dashboard, Materiali, ecc.)
├── Form inserimento dati
└── Visualizzazioni grafiche

FASE 5: Integrazione AI (1 settimana)
├── Servizio lci-ai.service.ts
├── Prompt templates
├── Endpoint AI
└── Widget insight UI

FASE 6: Testing e Refinement (1 settimana)
├── Test end-to-end
├── Validazione export con ECOTAPES
├── Ottimizzazioni performance
└── Documentazione
```

### 10.2 Timeline Stimata

| Fase | Durata | Milestone |
|------|--------|-----------|
| Fase 1 | Settimane 1-2 | Database e CRUD operativi |
| Fase 2 | Settimana 3 | Lettura dati app funzionante |
| Fase 3 | Settimana 4 | Export Excel completo |
| Fase 4 | Settimane 5-6 | UI completa |
| Fase 5 | Settimana 7 | AI integrata |
| Fase 6 | Settimana 8 | Rilascio v1.0 |

**Totale stimato**: 8 settimane

---

## 11. Rischi e Mitigazioni

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| Modifica accidentale dati esistenti | Bassa | Alto | Adapters solo READ, no FK dirette |
| Performance lettura grandi volumi | Media | Medio | Cache, paginazione, query ottimizzate |
| Incompatibilità formato Excel | Media | Alto | Test con file originale, validazione |
| Costi API AI elevati | Bassa | Basso | Cache risultati, rate limiting |
| Complessità manutenzione | Media | Medio | Documentazione, test coverage |

---

## 12. Metriche di Successo

### 12.1 KPI Tecnici

- Tempo generazione report < 10 secondi
- Accuracy calcolo produzione > 99%
- Zero modifiche a tabelle esistenti
- Test coverage > 80%

### 12.2 KPI Business

- Riduzione tempo compilazione LCI: -70%
- Errori manuali eliminati: 100%
- Soddisfazione utente: > 4/5

---

## 13. Dipendenze Esterne

### 13.1 Librerie Già Presenti (Nessuna Installazione)

- `xlsx` - Generazione file Excel
- `openai` - Integrazione AI GPT-4o
- `drizzle-orm` - ORM database
- `zod` - Validazione schema
- `@tanstack/react-query` - State management frontend

### 13.2 Nessuna Nuova Dipendenza Richiesta

Il modulo LCI utilizzerà esclusivamente le librerie già installate nel progetto.

---

## 14. Documentazione Richiesta

### 14.1 Documentazione Tecnica

- README.md modulo LCI
- Swagger/OpenAPI per endpoints
- Commenti JSDoc nel codice
- Diagrammi ER database

### 14.2 Documentazione Utente

- Guida rapida utilizzo
- FAQ
- Video tutorial (opzionale)

---

## 15. Checklist Pre-Sviluppo

- [ ] Approvazione piano da parte dell'utente
- [ ] Conferma priorità rispetto ad altre funzionalità
- [ ] Definizione data inizio sviluppo
- [ ] Conferma risorse disponibili
- [ ] Backup database pre-migrazione

---

## 16. Note Finali

Questo piano garantisce:

1. **Isolamento totale** - Nessun rischio per l'app esistente
2. **Reversibilità** - Il modulo può essere rimosso senza conseguenze
3. **Scalabilità** - Architettura pronta per future estensioni
4. **Manutenibilità** - Codice modulare e documentato
5. **Valore immediato** - Automatizza compilazione report ECOTAPES

---

*Documento generato: Novembre 2024*  
*Revisione successiva: Prima dell'inizio sviluppo*
