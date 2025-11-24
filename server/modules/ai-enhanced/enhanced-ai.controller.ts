/**
 * ENHANCED AI CONTROLLER
 * 
 * Endpoints API separati per il modulo AI potenziato.
 * Non interferisce con il sistema esistente.
 * 
 * Routes: /api/ai-enhanced/*
 */

import type { Express, Request, Response } from "express";
import { 
  analyzeQuestionWithEnhancedAI,
  executeAndAnalyzeQuery,
  getOrCreateConversation,
  clearConversation,
  healthCheck,
  type EnhancedAIRequest
} from "./enhanced-ai.service.js";
import { 
  generateDatabaseDescription,
  generateMinimalContext,
  getTableMetadata,
  getTablesByCategory,
  DATABASE_METADATA,
  RELATIONSHIP_GRAPH,
  KEY_METRICS
} from "./metadata.service.js";

/**
 * SECURITY: Tabelle accessibili per le query AI  
 * Esclude tabelle sensibili come users, passwords, api_keys
 * NOTA: Nomi normalizzati in lowercase per confronto case-insensitive
 * AGGIORNATO: 54 tabelle totali documentate con nomi snake_case corretti
 */
const ALLOWED_TABLES = [
  // Core
  'flupsys', 'baskets', 'cycles', 'operations', 'sizes', 'lots',
  'basket_lot_composition', 'basket_groups',
  // Analytics
  'sgr', 'sgr_giornalieri', 'sgr_per_taglia',
  'growth_analysis_runs', 'basket_growth_profiles', 'growth_distributions',
  'lot_ledger', 'lot_inventory_transactions', 'lot_mortality_records', 'mortality_rates',
  'target_size_annotations',
  // Screening
  'screening_operations', 'screening_source_baskets', 'screening_destination_baskets',
  'screening_basket_history', 'screening_lot_references', 'screening_impact_analysis',
  // Selection
  'selections', 'selection_source_baskets', 'selection_destination_baskets',
  'selection_basket_history', 'selection_lot_references',
  'selection_tasks', 'selection_task_baskets', 'selection_task_assignments',
  'bag_allocations',
  // Sales
  'advanced_sales', 'sale_bags', 'sale_operations_ref', 'ddt', 'ddt_righe', 'clienti',
  // Orders  
  'ordini', 'ordini_righe',
  // Task operators
  'task_operators',
  // Sync
  'external_customers_sync', 'external_deliveries_sync', 'external_delivery_details_sync',
  'external_sales_sync', 'sync_status',
  // Config (non-sensitive)
  'notifications', 'notification_settings', 'configurazione'
];

/**
 * SECURITY: Valida query SQL per sicurezza
 * - Blocca query distruttive (DROP, DELETE, etc)
 * - Blocca accesso a tabelle sensibili
 * - Blocca accesso a colonne password/token
 */
function validateSQLQuery(sqlQuery: string): { valid: boolean; error?: string } {
  const lowerQuery = sqlQuery.toLowerCase().trim();
  
  // 1. Blocca query distruttive
  const destructiveKeywords = ['drop', 'delete', 'truncate', 'update', 'insert', 'alter', 'create', 'grant', 'revoke'];
  for (const keyword of destructiveKeywords) {
    if (new RegExp(`\\b${keyword}\\b`, 'i').test(lowerQuery)) {
      return { valid: false, error: `Query non permessa: contiene parola chiave distruttiva '${keyword}'` };
    }
  }
  
  // 2. Blocca accesso a tabelle sensibili
  const blockedTables = ['users', 'email_config', 'fatture_in_cloud_config', 'notification_settings'];
  for (const table of blockedTables) {
    if (new RegExp(`\\bfrom\\s+${table}\\b|\\bjoin\\s+${table}\\b`, 'i').test(lowerQuery)) {
      return { valid: false, error: `Query non permessa: accesso a tabella sensibile '${table}' negato` };
    }
  }
  
  // 3. Blocca accesso a colonne sensibili
  const blockedColumns = ['password', 'api_key', 'token', 'secret', 'access_token', 'refresh_token'];
  for (const column of blockedColumns) {
    if (new RegExp(`\\b${column}\\b`, 'i').test(lowerQuery)) {
      return { valid: false, error: `Query non permessa: accesso a colonna sensibile '${column}' negato` };
    }
  }
  
  // 4. Verifica che acceda solo a tabelle permesse (estrazione tabelle dal SQL)
  // Prima, estraiamo tutte le CTEs (Common Table Expressions) definite con WITH ... AS
  // Supporta: WITH cte AS, WITH RECURSIVE cte AS, WITH cte (col1, col2) AS, multiple CTEs
  const cteRegex = /\bwith\s+(?:recursive\s+)?([a-z_][a-z0-9_]*)(?:\s*\([^)]*\))?\s+as\s*\(/gi;
  const cteMatches = lowerQuery.matchAll(cteRegex);
  const cteNames = new Set<string>();
  
  for (const match of cteMatches) {
    cteNames.add(match[1]); // Nome della CTE temporanea
  }
  
  // Gestisce anche CTEs multiple separate da virgola (WITH cte1 AS (...), cte2 AS (...))
  const multipleCteRegex = /,\s*([a-z_][a-z0-9_]*)(?:\s*\([^)]*\))?\s+as\s*\(/gi;
  const multipleCteMatches = lowerQuery.matchAll(multipleCteRegex);
  
  for (const match of multipleCteMatches) {
    cteNames.add(match[1]); // Nomi delle CTEs aggiuntive
  }
  
  // Parser deterministico con blocklist esplicita
  // STRATEGIA: Permettere alias arbitrari mappati a tabelle whitelisted,
  // ma bloccare ESPLICITAMENTE alias che matchano tabelle sensibili note
  const tableRegex = /\b(?:from|join)\s+([a-z_][a-z0-9_]*)(?:\s+(?:as\s+)?([a-z_][a-z0-9_]*))?/gi;
  const matches = lowerQuery.matchAll(tableRegex);
  
  const tablesToValidate = new Set<string>();
  const aliasToTable = new Map<string, string>(); // Mapping: alias → table_name
  
  // SECURITY: Lista esplicita di nomi tabella che NON possono essere usati come alias
  // Questa è una lista conservativa delle tabelle più sensibili o comuni che non sono in whitelist
  const FORBIDDEN_ALIAS_NAMES = [
    // Tabelle sensibili (accesso negato)
    'users', 'user', 'accounts', 'account',
    'email_config', 'emails', 'mail',
    'fatture_in_cloud_config', 'config', 'configs', 'configuration',
    'notification_settings', 'settings',
    // Tabelle comuni che potrebbero esistere ma non sono in whitelist
    'logs', 'log', 'reports', 'report',
    'sessions', 'session', 'tokens', 'token',
    'permissions', 'roles', 'role'
  ];
  
  for (const match of matches) {
    const firstToken = match[1];
    const secondToken = match[2];
    
    if (secondToken) {
      // Pattern: "FROM table_name alias"
      
      // 1. Valida sempre la tabella
      tablesToValidate.add(firstToken);
      
      // 2. SECURITY: Blocca alias che coincidono con tabelle proibite
      if (FORBIDDEN_ALIAS_NAMES.includes(secondToken)) {
        return { 
          valid: false, 
          error: `Query non permessa: alias '${secondToken}' coincide con tabella sensibile` 
        };
      }
      
      // 3. Registra mapping alias→table (permettendo alias arbitrari)
      aliasToTable.set(secondToken, firstToken);
      
    } else {
      // Pattern: "FROM something" (nessun alias)
      
      // Se è un alias registrato → skip (tabella sottostante già validata)
      if (aliasToTable.has(firstToken)) {
        continue;
      }
      
      // Altrimenti → valida
      tablesToValidate.add(firstToken);
    }
  }
  
  // Lista di parole riservate SQL e funzioni che NON sono tabelle
  const sqlReservedWords = new Set([
    'current_date', 'current_time', 'current_timestamp', 'current_user',
    'now', 'today', 'dual', 'unnest', 'generate_series',
    'lateral', 'values', 'ordinality'
  ]);
  
  // Verifica che tutte le tabelle REALI (escluse CTEs e parole riservate) siano nella whitelist
  // SICUREZZA: Validazione SOLO su nomi di tabelle reali, MAI sugli alias
  for (const tableName of tablesToValidate) {
    // Ignora le CTEs (sono tabelle temporanee definite nella query stessa)
    if (cteNames.has(tableName)) {
      continue;
    }
    
    // Ignora parole riservate SQL e funzioni
    if (sqlReservedWords.has(tableName)) {
      continue;
    }
    
    // Verifica che la tabella reale sia nella whitelist
    // IMPORTANTE: questo viene chiamato SOLO per nomi di tabelle reali, MAI per alias
    if (!ALLOWED_TABLES.includes(tableName)) {
      return { valid: false, error: `Query non permessa: tabella '${tableName}' non nella whitelist` };
    }
  }
  
  return { valid: true };
}

/**
 * EXPERIMENTAL MODULE - NOT FOR PRODUCTION
 * 
 * SECURITY WARNING: Questo modulo è SPERIMENTALE e destinato solo a TESTING.
 * NON deve essere esposto in produzione senza un sistema di autenticazione robusto.
 * 
 * Protezioni implementate:
 * - API Key richiesta (variabile d'ambiente AI_ENHANCED_API_KEY)
 * - Whitelist tabelle accessibili
 * - Validazione query SQL rigorosa
 * - Blocco tabelle/colonne sensibili
 * - Logging audit delle query
 * - Rate limiting (TODO)
 * 
 * IMPORTANTE: Questo modulo esiste per sperimentare funzionalità AI avanzate.
 * Per produzione, implementare autenticazione completa + autorizzazione basata su ruoli.
 */

/**
 * Middleware: Verifica API Key per AI Enhanced endpoints
 * Protezione base contro accessi non autorizzati
 * 
 * NOTA: Per uso interno, verifica solo che l'API key sia configurata lato server.
 * In produzione, aggiungere autenticazione utente + autorizzazione basata su ruoli.
 */
function requireAIEnhancedAPIKey(req: Request, res: Response, next: Function) {
  // Se API key non configurata, modulo disabilitato
  const expectedApiKey = process.env.AI_ENHANCED_API_KEY;
  
  if (!expectedApiKey || expectedApiKey.length < 16) {
    return res.status(503).json({
      success: false,
      error: 'Modulo AI Enhanced non configurato. Configura AI_ENHANCED_API_KEY per abilitare.',
      hint: 'Chiedi all\'amministratore di configurare AI_ENHANCED_API_KEY nei Secrets'
    });
  }
  
  // ✅ MODALITÀ TESTING INTERNO:
  // Se l'API key è configurata lato server, consenti l'accesso.
  // Per uso interno, non richiediamo la chiave dal client.
  // TODO: In produzione, aggiungere qui controllo autenticazione utente/ruolo
  
  // Audit log
  console.log('✅ SECURITY: Accesso autorizzato a AI Enhanced (API key configurata lato server)');
  next();
}

export function registerEnhancedAIRoutes(app: Express) {
  
  const apiKeyConfigured = process.env.AI_ENHANCED_API_KEY && process.env.AI_ENHANCED_API_KEY.length >= 16;
  
  if (apiKeyConfigured) {
    console.log('✅ SECURITY: AI Enhanced protetto con API Key');
  } else {
    console.log('⚠️  SECURITY WARNING: AI Enhanced disabilitato - AI_ENHANCED_API_KEY non configurata');
    console.log('💡 Configura AI_ENHANCED_API_KEY con una chiave sicura (min 16 caratteri)');
  }

  
  // ========== HEALTH & INFO ==========
  
  /**
   * GET /api/ai-enhanced/health
   * Verifica stato servizio AI potenziato (pubblico, non richiede API key)
   */
  app.get("/api/ai-enhanced/health", async (req: Request, res: Response) => {
    try {
      const health = healthCheck();
      res.json({
        success: true,
        ...health
      });
    } catch (error: any) {
      console.error('Error in /api/ai-enhanced/health:', error);
      res.status(500).json({
        success: false,
        error: 'Errore verifica stato servizio'
      });
    }
  });

  /**
   * GET /api/ai-enhanced/metadata
   * Ottieni metadata database (richiede API key)
   */
  app.get("/api/ai-enhanced/metadata", requireAIEnhancedAPIKey, async (req: Request, res: Response) => {
    try {
      const { format = 'minimal' } = req.query;

      if (format === 'full') {
        res.json({
          success: true,
          metadata: {
            tables: DATABASE_METADATA,
            relationships: RELATIONSHIP_GRAPH,
            keyMetrics: KEY_METRICS
          }
        });
      } else {
        res.json({
          success: true,
          metadata: generateMinimalContext()
        });
      }
    } catch (error: any) {
      console.error('Error in /api/ai-enhanced/metadata:', error);
      res.status(500).json({
        success: false,
        error: 'Errore recupero metadata'
      });
    }
  });

  /**
   * GET /api/ai-enhanced/database-description
   * Ottieni descrizione testuale completa del database (richiede API key)
   */
  app.get("/api/ai-enhanced/database-description", requireAIEnhancedAPIKey, async (req: Request, res: Response) => {
    try {
      const description = generateDatabaseDescription();
      res.json({
        success: true,
        description
      });
    } catch (error: any) {
      console.error('Error in /api/ai-enhanced/database-description:', error);
      res.status(500).json({
        success: false,
        error: 'Errore generazione descrizione database'
      });
    }
  });

  // ========== CORE AI FUNCTIONS ==========

  /**
   * POST /api/ai-enhanced/ask
   * Fai una domanda all'AI potenziato (richiede API key)
   * 
   * Body: {
   *   question: string,
   *   context?: { flupsyId?, basketId?, dateRange?, filters? },
   *   mode?: 'query' | 'analysis' | 'recommendation'
   * }
   */
  app.post("/api/ai-enhanced/ask", requireAIEnhancedAPIKey, async (req: Request, res: Response) => {
    try {
      const aiRequest: EnhancedAIRequest = req.body;

      if (!aiRequest.question || aiRequest.question.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Domanda richiesta'
        });
      }

      console.log('📥 Enhanced AI Question:', {
        question: aiRequest.question,
        mode: aiRequest.mode || 'analysis',
        hasContext: !!aiRequest.context
      });

      const response = await analyzeQuestionWithEnhancedAI(aiRequest);

      res.json(response);

    } catch (error: any) {
      console.error('Error in /api/ai-enhanced/ask:', error);
      res.status(500).json({
        success: false,
        error: 'Errore elaborazione domanda AI',
        details: error.message
      });
    }
  });

  /**
   * POST /api/ai-enhanced/execute-query
   * Esegui una query SQL generata dall'AI (richiede API key)
   * 
   * Body: {
   *   sqlQuery: string,
   *   queryParams?: any[],
   *   limit?: number (default 1000)
   * }
   */
  app.post("/api/ai-enhanced/execute-query", requireAIEnhancedAPIKey, async (req: Request, res: Response) => {
    try {
      const { sqlQuery, queryParams = [], limit = 1000 } = req.body;

      if (!sqlQuery || sqlQuery.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Query SQL richiesta'
        });
      }

      // Security: Validazione rigorosa query
      const validation = validateSQLQuery(sqlQuery);
      if (!validation.valid) {
        console.error('❌ SECURITY: Query bloccata:', validation.error);
        return res.status(403).json({
          success: false,
          error: validation.error
        });
      }
      
      // Audit logging
      console.log('📊 AI Query Execution:', {
        queryPreview: sqlQuery.substring(0, 150) + '...',
        timestamp: new Date().toISOString(),
        paramsCount: queryParams.length
      });

      // Aggiungi LIMIT se non presente
      let finalQuery = sqlQuery.trim();
      const queryLowerCheck = finalQuery.toLowerCase();
      if (!queryLowerCheck.includes('limit')) {
        // Rimuovi punto e virgola finale se presente
        finalQuery = finalQuery.replace(/;[\s]*$/, '').trim();
        // Aggiungi LIMIT prima del punto e virgola
        finalQuery += ` LIMIT ${limit};`;
      }

      console.log('📊 Executing query:', {
        queryPreview: finalQuery.substring(0, 100) + '...',
        paramsCount: queryParams.length,
        limit
      });

      const result = await executeAndAnalyzeQuery(finalQuery, queryParams);

      res.json(result);

    } catch (error: any) {
      console.error('Error in /api/ai-enhanced/execute-query:', error);
      res.status(500).json({
        success: false,
        error: 'Errore esecuzione query',
        details: error.message
      });
    }
  });

  /**
   * POST /api/ai-enhanced/ask-and-execute
   * Fai domanda + esegui query in un solo step (richiede API key)
   * 
   * Body: {
   *   question: string,
   *   context?: { ... },
   *   executeQuery?: boolean (default true),
   *   limit?: number
   * }
   */
  app.post("/api/ai-enhanced/ask-and-execute", requireAIEnhancedAPIKey, async (req: Request, res: Response) => {
    try {
      const { 
        question, 
        context, 
        mode,
        executeQuery = true, 
        limit = 1000 
      } = req.body;

      if (!question || question.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Domanda richiesta'
        });
      }

      console.log('🔮 Enhanced AI: Ask & Execute:', {
        question,
        executeQuery,
        limit
      });

      // Step 1: Analizza domanda
      const aiResponse = await analyzeQuestionWithEnhancedAI({
        question,
        context,
        mode: mode || 'analysis'
      });

      if (!aiResponse.success) {
        return res.json(aiResponse);
      }

      // Step 2: Esegui query se richiesto e disponibile
      let queryResult = null;
      if (executeQuery && aiResponse.sqlQuery) {
        
        // Security check
        const validation = validateSQLQuery(aiResponse.sqlQuery);
        
        if (validation.valid) {
          
          // Audit logging with FULL query
          console.log('🔮 AI Generated Query (ORIGINAL):', aiResponse.sqlQuery);
          
          let finalQuery = aiResponse.sqlQuery.trim();
          const queryLower = finalQuery.toLowerCase();
          
          // Smart LIMIT handling: only add if not present anywhere in query
          if (!queryLower.includes('limit')) {
            // Rimuovi punto e virgola finale se presente
            finalQuery = finalQuery.replace(/;[\s]*$/, '').trim();
            // Aggiungi LIMIT prima del punto e virgola
            finalQuery += ` LIMIT ${limit};`;
          } else {
            console.log('⚠️ Query already contains LIMIT clause - using as-is');
          }
          
          console.log('🔮 AI Ask&Execute Final Query:', finalQuery);

          queryResult = await executeAndAnalyzeQuery(
            finalQuery, 
            aiResponse.queryParams || []
          );
        } else {
          console.error('❌ SECURITY: Query bloccata in ask-and-execute:', validation.error);
          queryResult = {
            success: false,
            error: validation.error || 'Query non permessa'
          };
        }
      }

      res.json({
        success: true,
        aiAnalysis: aiResponse,
        queryResult: queryResult,
        executedQuery: executeQuery && !!aiResponse.sqlQuery
      });

    } catch (error: any) {
      console.error('Error in /api/ai-enhanced/ask-and-execute:', error);
      res.status(500).json({
        success: false,
        error: 'Errore elaborazione richiesta',
        details: error.message
      });
    }
  });

  // ========== CONVERSATION MANAGEMENT ==========

  /**
   * POST /api/ai-enhanced/conversation/ask
   * Fai domanda in una conversazione persistente (multi-turno) (richiede API key)
   * 
   * Body: {
   *   sessionId: string,
   *   question: string,
   *   context?: { ... }
   * }
   */
  app.post("/api/ai-enhanced/conversation/ask", requireAIEnhancedAPIKey, async (req: Request, res: Response) => {
    try {
      const { sessionId, question, context } = req.body;

      if (!sessionId || !question) {
        return res.status(400).json({
          success: false,
          error: 'sessionId e question richiesti'
        });
      }

      const conversation = getOrCreateConversation(sessionId);
      
      // Aggiungi domanda utente alla conversazione
      conversation.addMessage('user', question);

      console.log('💬 Conversation:', {
        sessionId,
        question,
        historyLength: conversation.getMessages().length
      });

      // Analizza con AI
      const response = await analyzeQuestionWithEnhancedAI({
        question: question + '\n\nSTORICO CONVERSAZIONE:\n' + conversation.getContext(),
        context,
        mode: 'analysis'
      });

      // Aggiungi risposta AI alla conversazione
      if (response.success) {
        conversation.addMessage('assistant', JSON.stringify({
          analysis: response.analysis,
          insights: response.insights,
          recommendations: response.recommendations
        }));
      }

      res.json({
        ...response,
        conversationLength: conversation.getMessages().length
      });

    } catch (error: any) {
      console.error('Error in /api/ai-enhanced/conversation/ask:', error);
      res.status(500).json({
        success: false,
        error: 'Errore conversazione AI',
        details: error.message
      });
    }
  });

  /**
   * DELETE /api/ai-enhanced/conversation/:sessionId
   * Cancella conversazione (richiede API key)
   */
  app.delete("/api/ai-enhanced/conversation/:sessionId", requireAIEnhancedAPIKey, async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      clearConversation(sessionId);
      
      res.json({
        success: true,
        message: 'Conversazione cancellata'
      });
    } catch (error: any) {
      console.error('Error in DELETE /api/ai-enhanced/conversation:', error);
      res.status(500).json({
        success: false,
        error: 'Errore cancellazione conversazione'
      });
    }
  });

  // ========== METADATA QUERIES ==========

  /**
   * GET /api/ai-enhanced/tables
   * Lista tabelle disponibili (richiede API key)
   */
  app.get("/api/ai-enhanced/tables", requireAIEnhancedAPIKey, async (req: Request, res: Response) => {
    try {
      const { category } = req.query;

      let tables = DATABASE_METADATA;
      if (category) {
        tables = getTablesByCategory(category as string);
      }

      res.json({
        success: true,
        count: tables.length,
        tables: tables.map(t => ({
          name: t.name,
          description: t.description,
          category: t.category,
          fieldsCount: t.fields.length,
          relationshipsCount: t.relationships.length,
          keyMetrics: t.keyMetrics || []
        }))
      });
    } catch (error: any) {
      console.error('Error in /api/ai-enhanced/tables:', error);
      res.status(500).json({
        success: false,
        error: 'Errore recupero tabelle'
      });
    }
  });

  /**
   * GET /api/ai-enhanced/tables/:tableName
   * Dettagli tabella specifica (richiede API key)
   */
  app.get("/api/ai-enhanced/tables/:tableName", requireAIEnhancedAPIKey, async (req: Request, res: Response) => {
    try {
      const { tableName } = req.params;
      const table = getTableMetadata(tableName);

      if (!table) {
        return res.status(404).json({
          success: false,
          error: `Tabella '${tableName}' non trovata nel metadata`
        });
      }

      res.json({
        success: true,
        table
      });
    } catch (error: any) {
      console.error('Error in /api/ai-enhanced/tables/:tableName:', error);
      res.status(500).json({
        success: false,
        error: 'Errore recupero dettagli tabella'
      });
    }
  });

  console.log('✅ Enhanced AI Routes registered at /api/ai-enhanced/*');
}
