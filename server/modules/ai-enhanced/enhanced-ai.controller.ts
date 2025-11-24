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
import { db } from "../../db/index.js";

/**
 * Registra routes per AI Enhanced
 */
export function registerEnhancedAIRoutes(app: Express) {
  
  // ========== HEALTH & INFO ==========
  
  /**
   * GET /api/ai-enhanced/health
   * Verifica stato servizio AI potenziato
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
   * Ottieni metadata database (per debug/info)
   */
  app.get("/api/ai-enhanced/metadata", async (req: Request, res: Response) => {
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
   * Ottieni descrizione testuale completa del database
   */
  app.get("/api/ai-enhanced/database-description", async (req: Request, res: Response) => {
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
   * Fai una domanda all'AI potenziato
   * 
   * Body: {
   *   question: string,
   *   context?: { flupsyId?, basketId?, dateRange?, filters? },
   *   mode?: 'query' | 'analysis' | 'recommendation'
   * }
   */
  app.post("/api/ai-enhanced/ask", async (req: Request, res: Response) => {
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
   * Esegui una query SQL generata dall'AI
   * 
   * Body: {
   *   sqlQuery: string,
   *   queryParams?: any[],
   *   limit?: number (default 1000)
   * }
   */
  app.post("/api/ai-enhanced/execute-query", async (req: Request, res: Response) => {
    try {
      const { sqlQuery, queryParams = [], limit = 1000 } = req.body;

      if (!sqlQuery || sqlQuery.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Query SQL richiesta'
        });
      }

      // Security: Previeni query distruttive
      const lowerQuery = sqlQuery.toLowerCase().trim();
      const destructiveKeywords = ['drop', 'delete', 'truncate', 'update', 'insert', 'alter'];
      const hasDestructive = destructiveKeywords.some(kw => lowerQuery.includes(kw));

      if (hasDestructive) {
        return res.status(403).json({
          success: false,
          error: 'Query non permessa: solo SELECT queries sono consentite'
        });
      }

      // Aggiungi LIMIT se non presente
      let finalQuery = sqlQuery.trim();
      if (!lowerQuery.includes('limit')) {
        finalQuery += ` LIMIT ${limit}`;
      }

      console.log('📊 Executing query:', {
        queryPreview: finalQuery.substring(0, 100) + '...',
        paramsCount: queryParams.length,
        limit
      });

      const result = await executeAndAnalyzeQuery(finalQuery, queryParams, db);

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
   * Fai domanda + esegui query in un solo step
   * 
   * Body: {
   *   question: string,
   *   context?: { ... },
   *   executeQuery?: boolean (default true),
   *   limit?: number
   * }
   */
  app.post("/api/ai-enhanced/ask-and-execute", async (req: Request, res: Response) => {
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
        const lowerQuery = aiResponse.sqlQuery.toLowerCase().trim();
        const destructiveKeywords = ['drop', 'delete', 'truncate', 'update', 'insert', 'alter'];
        const hasDestructive = destructiveKeywords.some(kw => lowerQuery.includes(kw));

        if (!hasDestructive) {
          let finalQuery = aiResponse.sqlQuery.trim();
          if (!lowerQuery.includes('limit')) {
            finalQuery += ` LIMIT ${limit}`;
          }

          queryResult = await executeAndAnalyzeQuery(
            finalQuery, 
            aiResponse.queryParams || [], 
            db
          );
        } else {
          queryResult = {
            success: false,
            error: 'Query non eseguita: solo SELECT queries sono permesse'
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
   * Fai domanda in una conversazione persistente (multi-turno)
   * 
   * Body: {
   *   sessionId: string,
   *   question: string,
   *   context?: { ... }
   * }
   */
  app.post("/api/ai-enhanced/conversation/ask", async (req: Request, res: Response) => {
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
   * Cancella conversazione
   */
  app.delete("/api/ai-enhanced/conversation/:sessionId", async (req: Request, res: Response) => {
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
   * Lista tabelle disponibili
   */
  app.get("/api/ai-enhanced/tables", async (req: Request, res: Response) => {
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
   * Dettagli tabella specifica
   */
  app.get("/api/ai-enhanced/tables/:tableName", async (req: Request, res: Response) => {
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
