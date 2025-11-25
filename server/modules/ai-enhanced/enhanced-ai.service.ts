/**
 * ENHANCED AI SERVICE
 * 
 * Servizio GPT-4o (OpenAI) potenziato con conoscenza completa del database.
 * Utilizza il metadata service per fornire contesto ricco all'AI.
 * 
 * STRATEGIA #1: Database Knowledge Base implementata
 */

import OpenAI from "openai";
import { pool } from "../../db.js";
import { 
  generateDatabaseDescription, 
  generateMinimalContext,
  COMMON_QUERY_PATTERNS,
  KEY_METRICS,
  getTableMetadata
} from "./metadata.service.js";

const AI_API_KEY = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
const AI_BASE_URL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
const AI_MODEL = 'gpt-4o'; // ChatGPT Omni

// Client OpenAI via Replit AI Integrations
let aiClient: OpenAI | null = null;

function initializeClient() {
  const currentApiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const currentBaseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  
  if (currentApiKey && currentBaseUrl) {
    aiClient = new OpenAI({
      apiKey: currentApiKey,
      baseURL: currentBaseUrl,
    });
    console.log('✅ Enhanced AI Client initialized (GPT-4o via Replit AI Integrations)');
    return true;
  }
  console.log('⚠️ Enhanced AI Client: API key or base URL missing');
  return false;
}

// Inizializza
initializeClient();

// Ricarica periodica
setInterval(() => {
  const newApiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (newApiKey && (!aiClient || newApiKey !== AI_API_KEY)) {
    console.log('🔄 Enhanced AI: Ricaricando client...');
    initializeClient();
  }
}, 10000);

/**
 * PROMPT SYSTEM AVANZATO
 * Include contesto completo del database
 */
function buildSystemPrompt(): string {
  const dbDescription = generateDatabaseDescription();
  
  return `Sei un esperto data analyst specializzato in acquacoltura con accesso completo al database FLUPSY Management System.

# TUO RUOLO
Aiuti gli utenti a ottenere insights dai dati rispondendo a domande complesse che richiedono:
- Analisi multi-tabella
- Correlazioni tra entità diverse
- Calcoli aggregati avanzati
- Trend temporali
- Identificazione anomalie
- Raccomandazioni operative

# CONOSCENZA DEL DATABASE
${dbDescription}

# PATTERN DI QUERY COMUNI
${COMMON_QUERY_PATTERNS.map(p => `
**${p.name}**: ${p.description}
Tabelle: ${p.tables.join(', ')}
`).join('\n')}

# METRICHE CALCOLABILI
Puoi calcolare automaticamente:
${Object.entries(KEY_METRICS).map(([category, metrics]) => `
**${category}**:
${metrics.slice(0, 5).map(m => `- ${m}`).join('\n')}
`).join('\n')}

# ISTRUZIONI
1. **Analizza la domanda** - Identifica quali tabelle servono
2. **Costruisci il join path** - Usa le relazioni definite per navigare il database
3. **Proponi la query SQL** - Query ottimizzata con JOIN appropriati
4. **Spiega il risultato** - Interpreta i dati in modo azionabile
5. **Fornisci raccomandazioni** - Suggerisci azioni concrete

# OUTPUT FORMAT
Rispondi sempre in JSON con questa struttura:
{
  "analysis": "Breve analisi della domanda",
  "tables_needed": ["tabella1", "tabella2", ...],
  "sql_query": "Query SQL proposta (usa placeholder $1, $2 per parametri)",
  "query_params": ["valore1", "valore2", ...],
  "explanation": "Spiegazione della query e cosa calcola",
  "insights": ["Insight 1", "Insight 2", ...],
  "recommendations": ["Raccomandazione 1", "Raccomandazione 2", ...],
  "metrics": {
    "metric_name": "description"
  }
}

# ESEMPI
Domanda: "Quali cestelli crescono più lentamente del previsto?"
- Tabelle: baskets, cycles, operations, sgrPerTaglia, sizes
- Query: JOIN baskets, cycles, operations per calcolare crescita effettiva
- Confronta con SGR previsto da sgrPerTaglia
- Identifica cestelli con crescita < 80% del previsto
- Raccomanda controllo condizioni ambientali o lotti

Domanda: "Quanto posso vendere di taglia TP-2800 il mese prossimo?"
- Tabelle: baskets, cycles, operations, sizes, sgrPerTaglia
- Query: cestelli attivi + taglia attuale + SGR previsto
- Calcola giorni per raggiungere TP-2800
- Stima quantità disponibile per la data target
- Raccomanda pianificazione vendite

# BEST PRACTICES
- Usa ALWAYS LEFT JOIN quando possibili dati mancanti
- Filtra per cycles.state = 'active' per dati attuali
- Aggrega per FLUPSY quando serve vista d'insieme
- Includi sempre range temporale nelle query per performance
- Evita SELECT * - specifica solo i campi necessari
- Usa subquery per calcoli complessi invece di query multiple

# IMPORTANTE: CONVENZIONI NAMING DATABASE
**CRITICAL**: Il database PostgreSQL usa SNAKE_CASE per tutti i nomi di colonne, NON camelCase!

Esempi CORRETTI:
- basket_id (NOT basketId)
- cycle_id (NOT cycleId)
- flupsy_id (NOT flupsyId)
- size_id (NOT sizeId)
- lot_id (NOT lotId)
- animal_count (NOT animalCount)
- total_weight (NOT totalWeight)
- animals_per_kg (NOT animalsPerKg)
- average_weight (NOT averageWeight)
- dead_count (NOT deadCount)
- mortality_rate (NOT mortalityRate)
- physical_number (NOT physicalNumber)
- current_cycle_id (NOT currentCycleId)
- start_date (NOT startDate)
- end_date (NOT endDate)

**SEMPRE usa snake_case nelle query SQL!**`;
}

/**
 * Interfacce per richieste/risposte
 */
export interface EnhancedAIRequest {
  question: string; // Domanda dell'utente in linguaggio naturale
  context?: {
    flupsyId?: number;
    basketId?: number;
    dateRange?: { start: string; end: string };
    filters?: Record<string, any>;
  };
  mode?: 'query' | 'analysis' | 'recommendation'; // Modalità risposta
}

export interface EnhancedAIResponse {
  success: boolean;
  analysis: string;
  tablesNeeded: string[];
  sqlQuery?: string;
  queryParams?: any[];
  explanation: string;
  insights: string[];
  recommendations: string[];
  metrics?: Record<string, string>;
  warning?: string;
  error?: string;
}

/**
 * FUNZIONE PRINCIPALE: Analizza domanda con DeepSeek potenziato
 */
export async function analyzeQuestionWithEnhancedAI(
  request: EnhancedAIRequest
): Promise<EnhancedAIResponse> {
  
  if (!aiClient) {
    return {
      success: false,
      error: 'AI client non configurato. Verifica configurazione OpenAI.',
      analysis: '',
      tablesNeeded: [],
      explanation: '',
      insights: [],
      recommendations: []
    };
  }

  try {
    console.log('🤖 Enhanced AI Request:', {
      question: request.question,
      mode: request.mode || 'analysis',
      hasContext: !!request.context
    });

    // Build user prompt con context aggiuntivo
    let userPrompt = `DOMANDA UTENTE:\n${request.question}\n\n`;
    
    if (request.context) {
      userPrompt += `CONTESTO AGGIUNTIVO:\n`;
      if (request.context.flupsyId) {
        userPrompt += `- FLUPSY ID: ${request.context.flupsyId}\n`;
      }
      if (request.context.basketId) {
        userPrompt += `- Basket ID: ${request.context.basketId}\n`;
      }
      if (request.context.dateRange) {
        userPrompt += `- Range Date: ${request.context.dateRange.start} → ${request.context.dateRange.end}\n`;
      }
      if (request.context.filters) {
        userPrompt += `- Filtri: ${JSON.stringify(request.context.filters)}\n`;
      }
      userPrompt += `\n`;
    }

    userPrompt += `MODALITÀ: ${request.mode || 'analysis'}\n\n`;
    userPrompt += `Analizza questa domanda e fornisci una risposta strutturata in JSON come specificato nelle istruzioni.`;

    // Chiamata a GPT-4o con metadata completo del database
    const completion = await aiClient.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt()
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.2, // Bassa per risposte più deterministiche
      max_tokens: 4096,
      response_format: { type: "json_object" } // Forza risposta JSON
    });

    const aiResponse = JSON.parse(completion.choices[0]?.message?.content || '{}');
    
    console.log('✅ Enhanced AI Response:', {
      tablesNeeded: aiResponse.tables_needed?.length || 0,
      hasSqlQuery: !!aiResponse.sql_query,
      insightsCount: aiResponse.insights?.length || 0,
      recommendationsCount: aiResponse.recommendations?.length || 0
    });

    return {
      success: true,
      analysis: aiResponse.analysis || 'Nessuna analisi fornita',
      tablesNeeded: aiResponse.tables_needed || [],
      sqlQuery: aiResponse.sql_query,
      queryParams: aiResponse.query_params || [],
      explanation: aiResponse.explanation || 'Nessuna spiegazione fornita',
      insights: aiResponse.insights || [],
      recommendations: aiResponse.recommendations || [],
      metrics: aiResponse.metrics || {}
    };

  } catch (error: any) {
    console.error('❌ Enhanced AI Error:', error.message);
    return {
      success: false,
      error: `Errore AI: ${error.message}`,
      analysis: '',
      tablesNeeded: [],
      explanation: '',
      insights: [],
      recommendations: [],
      warning: 'Il servizio AI ha riscontrato un errore. Riprova più tardi.'
    };
  }
}

/**
 * FUNZIONE: Query diretta al database con risultati analizzati
 * Esegue la query SQL proposta dall'AI e analizza i risultati
 */
export async function executeAndAnalyzeQuery(
  sqlQuery: string,
  queryParams: any[] = []
): Promise<{
  success: boolean;
  data?: any[];
  rowCount?: number;
  analysis?: string;
  error?: string;
}> {
  
  try {
    console.log('📊 Executing AI-generated query:', {
      queryPreview: sqlQuery.substring(0, 100) + '...',
      paramsCount: queryParams.length
    });

    // Esegui query usando il pool PostgreSQL direttamente
    const result = await pool.query(sqlQuery, queryParams);
    
    console.log('✅ Query executed:', {
      rowCount: result.rows?.length || 0
    });

    return {
      success: true,
      data: result.rows || [],
      rowCount: result.rows?.length || 0,
      analysis: `Query eseguita con successo. ${result.rows?.length || 0} risultati trovati.`
    };

  } catch (error: any) {
    console.error('❌ Query execution error:', error.message);
    return {
      success: false,
      error: `Errore esecuzione query: ${error.message}`
    };
  }
}

/**
 * FUNZIONE: Conversazione multi-turno
 * Mantiene context tra domande successive
 */
interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

class ConversationContext {
  private messages: ConversationMessage[] = [];
  private maxMessages = 10; // Mantieni ultime 10 interazioni

  addMessage(role: 'user' | 'assistant', content: string) {
    this.messages.push({
      role,
      content,
      timestamp: new Date()
    });

    // Mantieni solo ultime N messaggi
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
  }

  getMessages(): ConversationMessage[] {
    return this.messages;
  }

  clear() {
    this.messages = [];
  }

  getContext(): string {
    return this.messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n\n');
  }
}

// Store conversazioni per utente/sessione
const conversations = new Map<string, ConversationContext>();

export function getOrCreateConversation(sessionId: string): ConversationContext {
  if (!conversations.has(sessionId)) {
    conversations.set(sessionId, new ConversationContext());
  }
  return conversations.get(sessionId)!;
}

export function clearConversation(sessionId: string) {
  conversations.delete(sessionId);
}

/**
 * Health check per il servizio
 */
export function healthCheck(): {
  status: 'ready' | 'not_configured';
  model: string;
  metadata: {
    tablesDocumented: number;
    queryPatterns: number;
    metricsAvailable: number;
  };
} {
  return {
    status: aiClient ? 'ready' : 'not_configured',
    model: AI_MODEL,
    metadata: {
      tablesDocumented: 15, // Tabelle principali documentate
      queryPatterns: COMMON_QUERY_PATTERNS.length,
      metricsAvailable: Object.values(KEY_METRICS).flat().length
    }
  };
}
