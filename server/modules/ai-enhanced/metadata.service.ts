/**
 * DATABASE METADATA SERVICE
 * 
 * Questo servizio fornisce una descrizione completa del database
 * per permettere a DeepSeek AI di comprendere la struttura dati,
 * le relazioni tra tabelle e le metriche chiave.
 * 
 * STRATEGIA #1: Database Knowledge Base
 * - Documenta tutte le 54 tabelle del sistema
 * - Definisce relazioni e foreign keys
 * - Identifica metriche chiave per analisi AI
 * - Marca campi sensibili (PII)
 */

export interface TableMetadata {
  name: string;
  description: string;
  primaryKey: string;
  category: string; // Core | Operations | Screening | Sales | Analytics | Sync | Config
  fields: FieldMetadata[];
  relationships: RelationshipMetadata[];
  keyMetrics?: string[]; // Metriche importanti calcolabili da questa tabella
  sensitiveFields?: string[]; // Campi con dati sensibili (PII)
}

export interface FieldMetadata {
  name: string;
  type: string; // integer | text | real | boolean | date | timestamp | jsonb
  description: string;
  required: boolean;
  isPII?: boolean; // Personally Identifiable Information
}

export interface RelationshipMetadata {
  type: 'one-to-many' | 'many-to-one' | 'many-to-many';
  targetTable: string;
  foreignKey: string;
  description: string;
}

/**
 * Metadata completo del database FLUPSY Management System
 */
export const DATABASE_METADATA: TableMetadata[] = [
  // ========== CORE ENTITIES ==========
  {
    name: 'flupsys',
    description: 'Sistemi FLUPSY (Floating Upwelling System) - impianti di acquacoltura',
    primaryKey: 'id',
    category: 'Core',
    fields: [
      { name: 'id', type: 'integer', description: 'ID univoco FLUPSY', required: true },
      { name: 'name', type: 'text', description: 'Nome identificativo del FLUPSY', required: true },
      { name: 'location', type: 'text', description: 'Posizione geografica', required: false },
      { name: 'active', type: 'boolean', description: 'Se il FLUPSY è attualmente attivo', required: true },
      { name: 'maxPositions', type: 'integer', description: 'Numero massimo posizioni per fila (10-20)', required: true },
      { name: 'productionCenter', type: 'text', description: 'Centro di produzione (es. Ca Pisani, Goro)', required: false }
    ],
    relationships: [
      { type: 'one-to-many', targetTable: 'baskets', foreignKey: 'flupsyId', description: 'Un FLUPSY contiene molti cestelli' }
    ],
    keyMetrics: [
      'Numero cestelli attivi per FLUPSY',
      'Capacità utilizzata (cestelli attivi / maxPositions)',
      'Produzione totale per FLUPSY',
      'Tasso crescita medio per FLUPSY'
    ]
  },
  
  {
    name: 'baskets',
    description: 'Cestelli di allevamento - contenitori fisici per molluschi',
    primaryKey: 'id',
    category: 'Core',
    fields: [
      { name: 'id', type: 'integer', description: 'ID univoco cestello', required: true },
      { name: 'physicalNumber', type: 'integer', description: 'Numero fisico del cestello', required: true },
      { name: 'flupsyId', type: 'integer', description: 'FLUPSY di appartenenza', required: true },
      { name: 'state', type: 'text', description: 'Stato: available, active', required: true },
      { name: 'row', type: 'text', description: 'Fila (DX o SX)', required: true },
      { name: 'position', type: 'integer', description: 'Posizione nella fila', required: true },
      { name: 'currentCycleId', type: 'integer', description: 'Ciclo produttivo attivo', required: false },
      { name: 'groupId', type: 'integer', description: 'Gruppo di appartenenza', required: false },
      { name: 'nfcData', type: 'text', description: 'Dati tag NFC', required: false }
    ],
    relationships: [
      { type: 'many-to-one', targetTable: 'flupsys', foreignKey: 'flupsyId', description: 'Cestello appartiene a un FLUPSY' },
      { type: 'many-to-one', targetTable: 'basketGroups', foreignKey: 'groupId', description: 'Cestello può appartenere a un gruppo' },
      { type: 'one-to-many', targetTable: 'cycles', foreignKey: 'basketId', description: 'Cestello ha molti cicli produttivi' },
      { type: 'one-to-many', targetTable: 'operations', foreignKey: 'basketId', description: 'Cestello ha molte operazioni' }
    ],
    keyMetrics: [
      'Numero animali attuali per cestello',
      'Peso totale per cestello',
      'Tasso di crescita per cestello',
      'Tasso mortalità per cestello',
      'Giorni nel ciclo attuale'
    ]
  },

  {
    name: 'cycles',
    description: 'Cicli produttivi - rappresentano un periodo di allevamento per un cestello',
    primaryKey: 'id',
    category: 'Core',
    fields: [
      { name: 'id', type: 'integer', description: 'ID univoco ciclo', required: true },
      { name: 'basketId', type: 'integer', description: 'Cestello del ciclo', required: true },
      { name: 'lotId', type: 'integer', description: 'Lotto di partenza', required: false },
      { name: 'startDate', type: 'date', description: 'Data inizio ciclo', required: true },
      { name: 'endDate', type: 'date', description: 'Data fine ciclo', required: false },
      { name: 'state', type: 'text', description: 'Stato: active, closed', required: true }
    ],
    relationships: [
      { type: 'many-to-one', targetTable: 'baskets', foreignKey: 'basketId', description: 'Ciclo appartiene a un cestello' },
      { type: 'many-to-one', targetTable: 'lots', foreignKey: 'lotId', description: 'Ciclo parte da un lotto' },
      { type: 'one-to-many', targetTable: 'operations', foreignKey: 'cycleId', description: 'Ciclo ha molte operazioni' }
    ],
    keyMetrics: [
      'Durata ciclo (giorni)',
      'Crescita totale nel ciclo',
      'Mortalità totale nel ciclo',
      'Efficienza del ciclo (crescita/giorno)'
    ]
  },

  {
    name: 'lots',
    description: 'Lotti di molluschi - partite di animali da fornitore',
    primaryKey: 'id',
    category: 'Core',
    fields: [
      { name: 'id', type: 'integer', description: 'ID univoco lotto', required: true },
      { name: 'arrivalDate', type: 'date', description: 'Data arrivo lotto', required: true },
      { name: 'supplier', type: 'text', description: 'Fornitore del lotto', required: true },
      { name: 'supplierLotNumber', type: 'text', description: 'Numero lotto del fornitore', required: false },
      { name: 'animalCount', type: 'integer', description: 'Numero totale animali', required: false },
      { name: 'weight', type: 'real', description: 'Peso totale in grammi', required: false },
      { name: 'sizeId', type: 'integer', description: 'Taglia di partenza', required: false },
      { name: 'state', type: 'text', description: 'Stato: active, exhausted', required: true },
      { name: 'totalMortality', type: 'integer', description: 'Mortalità cumulativa totale', required: false }
    ],
    relationships: [
      { type: 'one-to-many', targetTable: 'cycles', foreignKey: 'lotId', description: 'Lotto usato in molti cicli' },
      { type: 'many-to-one', targetTable: 'sizes', foreignKey: 'sizeId', description: 'Lotto ha taglia iniziale' },
      { type: 'one-to-many', targetTable: 'basketLotComposition', foreignKey: 'lotId', description: 'Lotto può essere misto in cestelli' }
    ],
    keyMetrics: [
      'Animali rimanenti nel lotto',
      'Percentuale utilizzo lotto',
      'Tasso mortalità lotto',
      'Numero cestelli che usano questo lotto'
    ]
  },

  {
    name: 'sizes',
    description: 'Taglie dei molluschi - categorie dimensionali (es. T0, TP-2800)',
    primaryKey: 'id',
    category: 'Core',
    fields: [
      { name: 'id', type: 'integer', description: 'ID univoco taglia', required: true },
      { name: 'code', type: 'text', description: 'Codice taglia (es. T0, M1, TP-2800)', required: true },
      { name: 'name', type: 'text', description: 'Nome descrittivo taglia', required: true },
      { name: 'sizeMm', type: 'real', description: 'Dimensione in millimetri', required: false },
      { name: 'minAnimalsPerKg', type: 'integer', description: 'Min animali per kg per questa taglia', required: false },
      { name: 'maxAnimalsPerKg', type: 'integer', description: 'Max animali per kg per questa taglia', required: false }
    ],
    relationships: [
      { type: 'one-to-many', targetTable: 'operations', foreignKey: 'sizeId', description: 'Taglia usata in molte operazioni' },
      { type: 'one-to-many', targetTable: 'sgrPerTaglia', foreignKey: 'sizeId', description: 'Taglia ha SGR specifico' }
    ],
    keyMetrics: [
      'Numero operazioni per taglia',
      'SGR medio per taglia',
      'Cestelli con questa taglia'
    ]
  },

  // ========== OPERATIONS ==========
  {
    name: 'operations',
    description: 'Operazioni sui cestelli - misurazioni, pulizie, vagliature, vendite',
    primaryKey: 'id',
    category: 'Operations',
    fields: [
      { name: 'id', type: 'integer', description: 'ID univoco operazione', required: true },
      { name: 'date', type: 'date', description: 'Data operazione', required: true },
      { name: 'type', type: 'text', description: 'Tipo: prima-attivazione, pulizia, vagliatura, misura, vendita, etc', required: true },
      { name: 'basketId', type: 'integer', description: 'Cestello operato', required: true },
      { name: 'cycleId', type: 'integer', description: 'Ciclo di riferimento', required: true },
      { name: 'sizeId', type: 'integer', description: 'Taglia rilevata (OBBLIGATORIA)', required: true },
      { name: 'animalCount', type: 'integer', description: 'Numero animali', required: false },
      { name: 'totalWeight', type: 'real', description: 'Peso totale in grammi', required: false },
      { name: 'animalsPerKg', type: 'integer', description: 'Animali per kg', required: false },
      { name: 'averageWeight', type: 'real', description: 'Peso medio animale in milligrammi', required: false },
      { name: 'deadCount', type: 'integer', description: 'Numero animali morti', required: false },
      { name: 'mortalityRate', type: 'real', description: 'Percentuale mortalità', required: false },
      { name: 'source', type: 'text', description: 'Origine: desktop_manager o mobile_nfc', required: true }
    ],
    relationships: [
      { type: 'many-to-one', targetTable: 'baskets', foreignKey: 'basketId', description: 'Operazione su un cestello' },
      { type: 'many-to-one', targetTable: 'cycles', foreignKey: 'cycleId', description: 'Operazione in un ciclo' },
      { type: 'many-to-one', targetTable: 'sizes', foreignKey: 'sizeId', description: 'Operazione rileva una taglia' }
    ],
    keyMetrics: [
      'Crescita tra operazioni successive',
      'Variazione animali/kg nel tempo',
      'Tasso mortalità per operazione',
      'Frequenza operazioni per cestello'
    ]
  },

  {
    name: 'basketLotComposition',
    description: 'Composizione lotti misti nei cestelli - traccia percentuali di più lotti',
    primaryKey: 'id',
    category: 'Core',
    fields: [
      { name: 'id', type: 'integer', description: 'ID univoco', required: true },
      { name: 'basketId', type: 'integer', description: 'Cestello', required: true },
      { name: 'cycleId', type: 'integer', description: 'Ciclo', required: true },
      { name: 'lotId', type: 'integer', description: 'Lotto componente', required: true },
      { name: 'animalCount', type: 'integer', description: 'Animali di questo lotto nel cestello', required: true },
      { name: 'percentage', type: 'real', description: 'Percentuale del lotto nel cestello', required: true }
    ],
    relationships: [
      { type: 'many-to-one', targetTable: 'baskets', foreignKey: 'basketId', description: 'Composizione di un cestello' },
      { type: 'many-to-one', targetTable: 'lots', foreignKey: 'lotId', description: 'Lotto componente' },
      { type: 'many-to-one', targetTable: 'cycles', foreignKey: 'cycleId', description: 'Composizione in un ciclo' }
    ],
    keyMetrics: [
      'Numero lotti per cestello',
      'Percentuale lotto dominante',
      'Complessità composizione (numero lotti)'
    ]
  },

  // ========== GROWTH & ANALYTICS ==========
  {
    name: 'sgrPerTaglia',
    description: 'SGR (Specific Growth Rate) calcolato per taglia e mese - indice crescita specifico',
    primaryKey: 'id',
    category: 'Analytics',
    fields: [
      { name: 'id', type: 'integer', description: 'ID univoco', required: true },
      { name: 'month', type: 'text', description: 'Mese (es. January)', required: true },
      { name: 'sizeId', type: 'integer', description: 'Taglia di riferimento', required: true },
      { name: 'calculatedSgr', type: 'real', description: 'SGR medio % per mese+taglia', required: true },
      { name: 'sampleCount', type: 'integer', description: 'Numero operazioni usate per calcolo', required: true },
      { name: 'lastCalculated', type: 'timestamp', description: 'Data ultimo calcolo', required: true }
    ],
    relationships: [
      { type: 'many-to-one', targetTable: 'sizes', foreignKey: 'sizeId', description: 'SGR specifico per taglia' }
    ],
    keyMetrics: [
      'SGR medio mensile per taglia',
      'Affidabilità previsioni (sampleCount)',
      'Trend SGR nel tempo'
    ]
  },

  {
    name: 'sgrGiornalieri',
    description: 'Dati giornalieri ambientali da sonda Seneye - temperatura, pH, ossigeno',
    primaryKey: 'id',
    category: 'Analytics',
    fields: [
      { name: 'id', type: 'integer', description: 'ID univoco', required: true },
      { name: 'recordDate', type: 'timestamp', description: 'Data e ora registrazione', required: true },
      { name: 'temperature', type: 'real', description: 'Temperatura acqua °C', required: false },
      { name: 'pH', type: 'real', description: 'pH acqua', required: false },
      { name: 'ammonia', type: 'real', description: 'Ammoniaca mg/L', required: false },
      { name: 'oxygen', type: 'real', description: 'Ossigeno mg/L', required: false },
      { name: 'salinity', type: 'real', description: 'Salinità ppt', required: false }
    ],
    relationships: [],
    keyMetrics: [
      'Media temperatura mensile',
      'Variazioni pH critiche',
      'Correlazione ambiente-crescita'
    ]
  },

  // ========== SCREENING & SELECTION ==========
  {
    name: 'screeningOperations',
    description: 'Operazioni di vagliatura - separazione molluschi per dimensione',
    primaryKey: 'id',
    category: 'Screening',
    fields: [
      { name: 'id', type: 'integer', description: 'ID univoco vagliatura', required: true },
      { name: 'date', type: 'date', description: 'Data vagliatura', required: true },
      { name: 'screeningNumber', type: 'integer', description: 'Numero progressivo', required: true },
      { name: 'referenceSizeId', type: 'integer', description: 'Taglia di riferimento vaglio', required: true },
      { name: 'status', type: 'text', description: 'Stato: draft, completed, cancelled', required: true }
    ],
    relationships: [
      { type: 'one-to-many', targetTable: 'screeningSourceBaskets', foreignKey: 'screeningId', description: 'Cestelli origine vagliatura' },
      { type: 'one-to-many', targetTable: 'screeningDestinationBaskets', foreignKey: 'screeningId', description: 'Cestelli destinazione vagliatura' }
    ],
    keyMetrics: [
      'Numero cestelli vagl iati',
      'Percentuale sopra/sotto vaglio',
      'Mortalità durante vagliatura'
    ]
  },

  {
    name: 'selections',
    description: 'Operazioni di selezione - preparazione per vendita o trasferimento',
    primaryKey: 'id',
    category: 'Screening',
    fields: [
      { name: 'id', type: 'integer', description: 'ID univoco selezione', required: true },
      { name: 'date', type: 'date', description: 'Data selezione', required: true },
      { name: 'selectionNumber', type: 'integer', description: 'Numero progressivo', required: true },
      { name: 'purpose', type: 'text', description: 'Scopo: vendita, vagliatura, altro', required: true },
      { name: 'referenceSizeId', type: 'integer', description: 'Taglia di riferimento', required: false },
      { name: 'status', type: 'text', description: 'Stato: draft, completed, cancelled', required: true }
    ],
    relationships: [
      { type: 'one-to-many', targetTable: 'selectionSourceBaskets', foreignKey: 'selectionId', description: 'Cestelli origine selezione' },
      { type: 'one-to-many', targetTable: 'selectionDestinationBaskets', foreignKey: 'selectionId', description: 'Cestelli destinazione selezione' }
    ],
    keyMetrics: [
      'Numero selezioni per scopo',
      'Quantità selezionata per vendita',
      'Efficienza processo selezione'
    ]
  },

  // ========== SALES & DDT ==========
  {
    name: 'advancedSales',
    description: 'Vendite avanzate - master vendite con clienti e documenti',
    primaryKey: 'id',
    category: 'Sales',
    fields: [
      { name: 'id', type: 'integer', description: 'ID univoco vendita', required: true },
      { name: 'saleNumber', type: 'text', description: 'Numero vendita progressivo', required: true },
      { name: 'customerId', type: 'integer', description: 'Cliente (opzionale)', required: false },
      { name: 'saleDate', type: 'date', description: 'Data vendita', required: false },
      { name: 'status', type: 'text', description: 'Stato: draft, confirmed, delivered', required: true }
    ],
    relationships: [
      { type: 'one-to-many', targetTable: 'saleBags', foreignKey: 'saleId', description: 'Sacchi della vendita' },
      { type: 'one-to-many', targetTable: 'ddt', foreignKey: 'advancedSaleId', description: 'DDT della vendita' }
    ],
    keyMetrics: [
      'Valore totale vendita',
      'Quantità venduta per taglia',
      'Trend vendite mensili'
    ]
  },

  {
    name: 'ddt',
    description: 'Documenti di Trasporto (DDT) - documenti fiscali per spedizioni',
    primaryKey: 'id',
    category: 'Sales',
    fields: [
      { name: 'id', type: 'integer', description: 'ID univoco DDT', required: true },
      { name: 'numeroDdt', type: 'text', description: 'Numero DDT progressivo', required: true },
      { name: 'dataDdt', type: 'date', description: 'Data emissione DDT', required: true },
      { name: 'advancedSaleId', type: 'integer', description: 'Vendita avanzata di riferimento', required: false },
      { name: 'customerSnapshot', type: 'jsonb', description: 'Snapshot dati cliente immutabile', required: false }
    ],
    relationships: [
      { type: 'many-to-one', targetTable: 'advancedSales', foreignKey: 'advancedSaleId', description: 'DDT per vendita avanzata' },
      { type: 'one-to-many', targetTable: 'ddtRighe', foreignKey: 'ddtId', description: 'Righe del DDT' }
    ],
    keyMetrics: [
      'Numero DDT emessi per mese',
      'Valore totale DDT',
      'DDT per cliente'
    ],
    sensitiveFields: ['customerSnapshot']
  },

  // ========== OPERATORS & TASKS ==========
  {
    name: 'task_operators',
    description: 'Operatori - personale che esegue operazioni',
    primaryKey: 'id',
    category: 'Config',
    fields: [
      { name: 'id', type: 'integer', description: 'ID univoco operatore', required: true },
      { name: 'firstName', type: 'text', description: 'Nome', required: true, isPII: true },
      { name: 'lastName', type: 'text', description: 'Cognome', required: true, isPII: true },
      { name: 'email', type: 'text', description: 'Email', required: false, isPII: true },
      { name: 'phone', type: 'text', description: 'Telefono', required: false, isPII: true },
      { name: 'role', type: 'text', description: 'Ruolo (operatore, supervisore)', required: false },
      { name: 'active', type: 'boolean', description: 'Operatore attivo', required: true }
    ],
    relationships: [
      { type: 'one-to-many', targetTable: 'selectionTaskAssignments', foreignKey: 'operatorId', description: 'Attività assegnate' }
    ],
    keyMetrics: [
      'Numero operatori attivi',
      'Attività completate per operatore',
      'Efficienza operatore'
    ],
    sensitiveFields: ['firstName', 'lastName', 'email', 'phone']
  },

  {
    name: 'selectionTasks',
    description: 'Attività di selezione - task assegnati agli operatori',
    primaryKey: 'id',
    category: 'Operations',
    fields: [
      { name: 'id', type: 'integer', description: 'ID univoco task', required: true },
      { name: 'taskType', type: 'text', description: 'Tipo: pulizia, pesatura, vagliatura', required: true },
      { name: 'priority', type: 'text', description: 'Priorità: low, medium, high, urgent', required: true },
      { name: 'status', type: 'text', description: 'Stato: pending, assigned, in_progress, completed, cancelled', required: true },
      { name: 'dueDate', type: 'date', description: 'Scadenza task', required: false }
    ],
    relationships: [
      { type: 'one-to-many', targetTable: 'selectionTaskAssignments', foreignKey: 'taskId', description: 'Assegnazioni task' },
      { type: 'one-to-many', targetTable: 'selectionTaskBaskets', foreignKey: 'taskId', description: 'Cestelli del task' }
    ],
    keyMetrics: [
      'Task completati vs pendenti',
      'Tempo medio completamento task',
      'Task scaduti'
    ]
  },

  // ========== EXTERNAL SYNC ==========
  {
    name: 'ordini',
    description: 'Ordini condivisi tra applicazioni - gestione collaborativa ordini',
    primaryKey: 'id',
    category: 'Sync',
    fields: [
      { name: 'id', type: 'integer', description: 'ID univoco ordine', required: true },
      { name: 'numeroOrdine', type: 'text', description: 'Numero ordine', required: true },
      { name: 'dataOrdine', type: 'date', description: 'Data ordine', required: true },
      { name: 'clienteId', type: 'integer', description: 'Cliente', required: false },
      { name: 'statoOrdine', type: 'text', description: 'Stato: pending, in_progress, completed', required: true }
    ],
    relationships: [
      { type: 'one-to-many', targetTable: 'ordiniRighe', foreignKey: 'ordineId', description: 'Righe ordine' }
    ],
    keyMetrics: [
      'Ordini aperti',
      'Valore totale ordini',
      'Tasso completamento ordini'
    ]
  }
];

/**
 * RELAZIONI CHIAVE TRA TABELLE
 * Questo grafo aiuta l'AI a comprendere come navigare il database
 */
export const RELATIONSHIP_GRAPH = {
  core: {
    description: 'Flusso centrale: FLUPSY → Cestelli → Cicli → Operazioni',
    path: ['flupsys', 'baskets', 'cycles', 'operations'],
    joinKeys: {
      'flupsys → baskets': 'flupsyId',
      'baskets → cycles': 'basketId',
      'cycles → operations': 'cycleId'
    }
  },
  lotTracking: {
    description: 'Tracciabilità lotti: Lotti → Cicli/Composizione → Operazioni',
    path: ['lots', 'cycles', 'basketLotComposition', 'operations'],
    joinKeys: {
      'lots → cycles': 'lotId',
      'lots → basketLotComposition': 'lotId',
      'basketLotComposition → baskets': 'basketId'
    }
  },
  growthAnalysis: {
    description: 'Analisi crescita: Operazioni → Taglie → SGR per taglia',
    path: ['operations', 'sizes', 'sgrPerTaglia'],
    joinKeys: {
      'operations → sizes': 'sizeId',
      'sizes → sgrPerTaglia': 'sizeId'
    }
  },
  screening: {
    description: 'Processo vagliatura: Vagliatura → Cestelli origine → Cestelli destinazione',
    path: ['screeningOperations', 'screeningSourceBaskets', 'screeningDestinationBaskets'],
    joinKeys: {
      'screeningOperations → screeningSourceBaskets': 'screeningId',
      'screeningOperations → screeningDestinationBaskets': 'screeningId'
    }
  },
  sales: {
    description: 'Flusso vendite: Vendite avanzate → Sacchi → Allocazioni → DDT',
    path: ['advancedSales', 'saleBags', 'bagAllocations', 'ddt'],
    joinKeys: {
      'advancedSales → saleBags': 'saleId',
      'saleBags → bagAllocations': 'bagId',
      'advancedSales → ddt': 'advancedSaleId'
    }
  }
};

/**
 * QUERY PATTERNS COMUNI
 * Template di query frequenti per guidare l'AI
 */
export const COMMON_QUERY_PATTERNS = [
  {
    name: 'basket_complete_status',
    description: 'Stato completo di un cestello con ciclo, lotto e ultime operazioni',
    tables: ['baskets', 'cycles', 'lots', 'operations', 'sizes'],
    joins: `
      baskets 
      JOIN cycles ON baskets.currentCycleId = cycles.id
      JOIN lots ON cycles.lotId = lots.id
      JOIN operations ON operations.cycleId = cycles.id AND operations.basketId = baskets.id
      JOIN sizes ON operations.sizeId = sizes.id
    `
  },
  {
    name: 'flupsy_performance',
    description: 'Performance di un FLUPSY: cestelli attivi, crescita media, mortalità',
    tables: ['flupsys', 'baskets', 'cycles', 'operations'],
    joins: `
      flupsys
      JOIN baskets ON baskets.flupsyId = flupsys.id
      JOIN cycles ON cycles.basketId = baskets.id AND cycles.state = 'active'
      JOIN operations ON operations.cycleId = cycles.id
    `
  },
  {
    name: 'lot_tracking',
    description: 'Tracciabilità completa lotto: dove è distribuito, crescita, mortalità',
    tables: ['lots', 'cycles', 'basketLotComposition', 'baskets', 'operations'],
    joins: `
      lots
      LEFT JOIN cycles ON cycles.lotId = lots.id
      LEFT JOIN basketLotComposition ON basketLotComposition.lotId = lots.id
      JOIN baskets ON baskets.id = cycles.basketId OR baskets.id = basketLotComposition.basketId
      JOIN operations ON operations.cycleId = cycles.id
    `
  },
  {
    name: 'growth_analysis_by_size',
    description: 'Analisi crescita per taglia con SGR e dati ambientali',
    tables: ['operations', 'sizes', 'sgrPerTaglia', 'sgrGiornalieri'],
    joins: `
      operations
      JOIN sizes ON operations.sizeId = sizes.id
      JOIN sgrPerTaglia ON sgrPerTaglia.sizeId = sizes.id
      CROSS JOIN sgrGiornalieri (per correlazioni temporali)
    `
  },
  {
    name: 'sales_tracking',
    description: 'Tracciamento vendite con DDT e allocazioni',
    tables: ['advancedSales', 'saleBags', 'bagAllocations', 'ddt', 'operations'],
    joins: `
      advancedSales
      JOIN saleBags ON saleBags.saleId = advancedSales.id
      JOIN bagAllocations ON bagAllocations.bagId = saleBags.id
      JOIN ddt ON ddt.advancedSaleId = advancedSales.id
      JOIN operations ON operations.id = bagAllocations.operationId
    `
  }
];

/**
 * METRICHE CHIAVE AGGREGABILI
 * Indicatori che l'AI può calcolare su richiesta
 */
export const KEY_METRICS = {
  production: [
    'Numero cestelli attivi per FLUPSY',
    'Capacità utilizzata FLUPSY (%)',
    'Animali totali in produzione',
    'Peso totale in produzione (kg)',
    'Distribuzione taglie in produzione'
  ],
  growth: [
    'Tasso crescita medio (SGR) per taglia',
    'Crescita giornaliera media per cestello',
    'Tempo stimato raggiungimento taglia commerciale',
    'Efficienza crescita (crescita/tempo)',
    'Correlazione crescita-ambiente (temp, pH, O2)'
  ],
  mortality: [
    'Tasso mortalità medio per lotto',
    'Tasso mortalità medio per FLUPSY',
    'Mortalità cumulativa per ciclo',
    'Cestelli ad alta mortalità (>10%)',
    'Trend mortalità nel tempo'
  ],
  operations: [
    'Numero operazioni per tipo',
    'Frequenza operazioni per cestello',
    'Operazioni completate vs pianificate',
    'Efficienza operatori (task/giorno)',
    'Tempo medio completamento vagliature'
  ],
  sales: [
    'Vendite totali per periodo',
    'Vendite per taglia',
    'Valore medio vendita',
    'Top clienti per volume',
    'Trend vendite mensili'
  ],
  inventory: [
    'Animali disponibili per taglia',
    'Lotti attivi vs esauriti',
    'Previsione disponibilità per taglia target',
    'Rotazione magazzino (giorni)',
    'Stock safety per taglia'
  ]
};

/**
 * Ottiene metadata per una tabella specifica
 */
export function getTableMetadata(tableName: string): TableMetadata | undefined {
  return DATABASE_METADATA.find(t => t.name === tableName);
}

/**
 * Ottiene tutte le tabelle di una categoria
 */
export function getTablesByCategory(category: string): TableMetadata[] {
  return DATABASE_METADATA.filter(t => t.category === category);
}

/**
 * Genera descrizione testuale del database per prompt AI
 */
export function generateDatabaseDescription(): string {
  const categories = ['Core', 'Operations', 'Screening', 'Sales', 'Analytics', 'Sync', 'Config'];
  
  let description = `# DATABASE SCHEMA - FLUPSY Management System\n\n`;
  description += `Totale tabelle: ${DATABASE_METADATA.length}\n\n`;
  
  categories.forEach(category => {
    const tables = getTablesByCategory(category);
    if (tables.length > 0) {
      description += `## ${category} (${tables.length} tabelle)\n\n`;
      tables.forEach(table => {
        description += `### ${table.name}\n`;
        description += `${table.description}\n`;
        description += `Campi principali: ${table.fields.slice(0, 5).map(f => f.name).join(', ')}\n`;
        if (table.keyMetrics && table.keyMetrics.length > 0) {
          description += `Metriche: ${table.keyMetrics.slice(0, 3).join(', ')}\n`;
        }
        description += `\n`;
      });
    }
  });
  
  description += `## RELAZIONI CHIAVE\n\n`;
  Object.entries(RELATIONSHIP_GRAPH).forEach(([key, graph]) => {
    description += `**${key}**: ${graph.description}\n`;
    description += `Path: ${graph.path.join(' → ')}\n\n`;
  });
  
  return description;
}

/**
 * Genera context minimo per prompt AI (versione compatta)
 */
export function generateMinimalContext(): {
  tables: string[];
  relationships: Record<string, string[]>;
  keyMetrics: string[];
} {
  return {
    tables: DATABASE_METADATA.map(t => `${t.name}: ${t.description}`),
    relationships: Object.fromEntries(
      Object.entries(RELATIONSHIP_GRAPH).map(([key, graph]) => [
        key,
        graph.path
      ])
    ),
    keyMetrics: Object.values(KEY_METRICS).flat().slice(0, 20)
  };
}
