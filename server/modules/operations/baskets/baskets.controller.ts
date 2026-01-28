/**
 * Controller per la gestione dei cestelli
 * Gestisce le richieste HTTP e coordina con il service
 */

import { Request, Response } from 'express';
import { basketsService } from './baskets.service';
import { insertBasketSchema } from '../../../../shared/schema';
import { fromZodError } from 'zod-validation-error';
import { z } from 'zod';

// Helper function per disabilitare la cache HTTP
function forceNoCacheHeaders(res: Response) {
  const timestamp = Date.now();
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
    'Last-Modified': new Date(timestamp).toUTCString(),
    'ETag': `"${timestamp}"`
  });
}

export class BasketsController {
  /**
   * GET /api/baskets/find-by-nfc
   * Trova cestello tramite NFC
   */
  async findByNfc(req: Request, res: Response) {
    try {
      const physicalNumber = req.query.physicalNumber ? parseInt(req.query.physicalNumber as string) : undefined;
      const currentCycleId = req.query.currentCycleId ? parseInt(req.query.currentCycleId as string) : undefined;
      const basketId = req.query.basketId ? parseInt(req.query.basketId as string) : undefined;

      const result = await basketsService.findByNfc({
        physicalNumber,
        currentCycleId,
        basketId
      });

      if (!result.success) {
        return res.status(result.status || 400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in findByNfc:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Errore interno del server durante la ricerca cestello' 
      });
    }
  }

  /**
   * GET /api/baskets
   * Lista cestelli con filtri e paginazione
   */
  async getBaskets(req: Request, res: Response) {
    try {
      const startTime = Date.now();

      // Estrai parametri
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 50;
      const state = req.query.state as string | undefined;
      const flupsyId = req.query.flupsyId ? parseInt(req.query.flupsyId as string) : undefined;
      const cycleId = req.query.cycleId ? parseInt(req.query.cycleId as string) : undefined;
      const includeEmpty = req.query.includeEmpty === 'true';
      const sortBy = req.query.sortBy as string || 'id';
      const sortOrder = req.query.sortOrder as string || 'asc';
      const includeAll = req.query.includeAll === 'true';
      const forceRefresh = req.query.force_refresh === 'true';
      const useOriginal = req.query.original === 'true';

      if (useOriginal) {
        // Usa implementazione originale (per compatibilità)
        console.log("Utilizzo implementazione originale per i cestelli");
        // Qui dovrebbe esserci la vecchia implementazione se necessaria
        return res.status(501).json({ message: "Original implementation not available" });
      }

      // Applica headers anti-cache
      forceNoCacheHeaders(res);

      const result = await basketsService.getBaskets({
        page,
        pageSize,
        state,
        flupsyId,
        cycleId,
        includeEmpty,
        sortBy,
        sortOrder,
        includeAll,
        forceRefresh
      });

      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > 1000) {
        console.log(`SLOW: GET /api/baskets took ${elapsedTime}ms`);
      }

      // COMPATIBILITÀ: Restituisci array diretto per default (senza paginazione)
      // Restituisci oggetto con paginazione SOLO se includeAll=false esplicitamente
      // Questo garantisce compatibilità con tutto il frontend legacy
      if (req.query.includeAll !== 'false' && result.baskets) {
        return res.json(result.baskets);
      }

      res.json(result);
    } catch (error) {
      console.error("Error fetching baskets:", error);
      res.status(500).json({ message: "Failed to fetch baskets" });
    }
  }

  /**
   * GET /api/baskets/with-flupsy-details
   * Cestelli con dettagli del flupsy
   */
  async getBasketsWithFlupsyDetails(req: Request, res: Response) {
    try {
      const baskets = await basketsService.getBasketsWithFlupsyDetails();
      res.json(baskets);
    } catch (error) {
      console.error("Error fetching baskets with flupsy details:", error);
      res.status(500).json({ message: "Failed to fetch baskets with flupsy details" });
    }
  }

  /**
   * GET /api/baskets/details/:id?
   * Dettagli di uno o più cestelli
   */
  async getBasketDetails(req: Request, res: Response) {
    try {
      const id = req.params.id ? parseInt(req.params.id) : undefined;
      const baskets = await basketsService.getBasketDetails(id);
      res.json(baskets);
    } catch (error) {
      console.error("Error fetching basket details:", error);
      res.status(500).json({ message: "Failed to fetch basket details" });
    }
  }

  /**
   * GET /api/baskets/check-exists
   * Verifica esistenza cestello
   */
  async checkExists(req: Request, res: Response) {
    try {
      const flupsyId = parseInt(req.query.flupsyId as string);
      const physicalNumber = parseInt(req.query.physicalNumber as string);

      if (isNaN(flupsyId) || isNaN(physicalNumber)) {
        return res.status(400).json({ message: "Invalid flupsyId or physicalNumber" });
      }

      const result = await basketsService.checkBasketExists(flupsyId, physicalNumber);
      res.json(result);
    } catch (error) {
      console.error("Error checking basket existence:", error);
      res.status(500).json({ message: "Failed to check basket existence" });
    }
  }

  /**
   * GET /api/baskets/check-position
   * Verifica se posizione è occupata
   */
  async checkPosition(req: Request, res: Response) {
    try {
      const flupsyId = parseInt(req.query.flupsyId as string);
      const row = req.query.row as string;
      const position = parseInt(req.query.position as string);

      if (isNaN(flupsyId) || !row || isNaN(position)) {
        return res.status(400).json({ message: "Invalid parameters" });
      }

      const result = await basketsService.checkPosition(flupsyId, row, position);
      res.json(result);
    } catch (error) {
      console.error("Error checking position:", error);
      res.status(500).json({ message: "Failed to check position" });
    }
  }

  /**
   * GET /api/baskets/next-number/:flupsyId
   * Prossimo numero disponibile
   */
  async getNextNumber(req: Request, res: Response) {
    try {
      const flupsyId = parseInt(req.params.flupsyId);
      if (isNaN(flupsyId)) {
        return res.status(400).json({ message: "Invalid FLUPSY ID" });
      }

      const result = await basketsService.getNextNumber(flupsyId);
      res.json(result);
    } catch (error) {
      console.error("Error getting next number:", error);
      res.status(500).json({ message: "Failed to get next number" });
    }
  }

  /**
   * GET /api/baskets/next-position/:flupsyId
   * Prossima posizione disponibile
   */
  async getNextPosition(req: Request, res: Response) {
    try {
      const flupsyId = parseInt(req.params.flupsyId);
      if (isNaN(flupsyId)) {
        return res.status(400).json({ message: "Invalid FLUPSY ID" });
      }

      const result = await basketsService.getNextPosition(flupsyId);
      res.json(result);
    } catch (error) {
      console.error("Error getting next position:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * GET /api/baskets/available
   * Cestelli disponibili per selezione
   */
  async getAvailable(req: Request, res: Response) {
    try {
      const result = await basketsService.getAvailableBaskets();
      res.status(200).json(result);
    } catch (error) {
      console.error("Error getting available baskets:", error);
      res.status(500).json({ 
        success: false,
        error: `Errore durante il recupero dei cestelli disponibili: ${(error as Error).message}`
      });
    }
  }

  /**
   * GET /api/baskets/latest-operations
   * ENDPOINT OTTIMIZZATO: Restituisce l'ultima operazione per ogni cesta attiva
   * Usa window function per performance ottimali - O(1) lookup per cesta
   */
  async getLatestOperations(req: Request, res: Response) {
    try {
      const result = await basketsService.getLatestOperations();
      res.json(result);
    } catch (error) {
      console.error("Error fetching latest operations:", error);
      res.status(500).json({ message: "Errore nel recupero delle ultime operazioni" });
    }
  }

  /**
   * GET /api/baskets/:id
   * Singolo cestello per ID
   */
  async getBasket(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid basket ID" });
      }

      const basket = await basketsService.getBasket(id);
      res.json(basket);
    } catch (error) {
      console.error("Error fetching basket:", error);
      const message = (error as Error).message;
      const status = message === "Basket not found" ? 404 : 500;
      res.status(status).json({ message });
    }
  }

  /**
   * POST /api/baskets
   * Crea nuovo cestello
   */
  async createBasket(req: Request, res: Response) {
    try {
      const parsedData = insertBasketSchema.safeParse(req.body);
      if (!parsedData.success) {
        const errorMessage = fromZodError(parsedData.error).message;
        return res.status(400).json({ message: errorMessage });
      }

      const newBasket = await basketsService.createBasket(parsedData.data);
      res.status(201).json(newBasket);
    } catch (error) {
      console.error("Error creating basket:", error);
      const message = (error as Error).message;
      const status = message.includes("Limite massimo") || message.includes("Esiste già") || message.includes("occupata") ? 400 : 500;
      res.status(status).json({ message });
    }
  }

  /**
   * POST /api/baskets/:id/move
   * Sposta cestello
   */
  async moveBasket(req: Request, res: Response) {
    try {
      const startTime = Date.now();
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid basket ID" });
      }

      // Valida dati
      const moveSchema = z.object({
        flupsyId: z.number(),
        row: z.string(),
        position: z.number(),
      });

      const parsedData = moveSchema.safeParse(req.body);
      if (!parsedData.success) {
        const errorMessage = fromZodError(parsedData.error).message;
        return res.status(400).json({ message: errorMessage });
      }

      const result = await basketsService.moveBasket(id, parsedData.data);
      
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > 500) {
        console.warn(`⚠️ PERFORMANCE: Move API took ${elapsedTime}ms (target: <500ms)`);
      }

      res.json(result);
    } catch (error) {
      console.error("Error moving basket:", error);
      const message = (error as Error).message;
      const status = message === "Basket not found" ? 404 : 500;
      res.status(status).json({ message });
    }
  }

  /**
   * POST /api/baskets/switch-positions
   * Scambia posizioni di due cestelli
   */
  async switchPositions(req: Request, res: Response) {
    const startTime = Date.now();
    console.log(`🚀 SWITCH API PROFILING START: ${new Date().toISOString()}`);
    
    try {
      const validationStart = Date.now();
      const { basket1Id, basket2Id } = req.body;
      
      if (!basket1Id || !basket2Id) {
        return res.status(400).json({ 
          success: false,
          message: "Missing basket IDs" 
        });
      }
      
      const validationTime = Date.now() - validationStart;
      
      const dbStart = Date.now();
      const result = await basketsService.switchPositions(basket1Id, basket2Id);
      const dbTime = Date.now() - dbStart;
      
      const executionTime = Date.now() - startTime;
      console.log(`✅ SWITCH API COMPLETED in ${executionTime}ms`);
      
      res.json({
        success: true,
        basket1: result.basket1,
        basket2: result.basket2,
        message: "Switch completato con successo",
        performance: {
          totalTime: `${executionTime}ms`,
          dbTime: `${dbTime}ms`,
          validationTime: `${validationTime}ms`,
          target: "500ms",
          achieved: executionTime <= 500
        }
      });
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ SWITCH ERROR (${executionTime}ms):`, error);
      res.status(500).json({ 
        success: false,
        message: "Failed to switch basket positions",
        executionTime: `${executionTime}ms`
      });
    }
  }

  /**
   * PATCH /api/baskets/:id
   * Aggiorna cestello
   */
  async updateBasket(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid basket ID" });
      }

      console.log(`🔍 CONTROLLER - req.body ricevuto:`, JSON.stringify(req.body));

      // Schema di validazione
      const updateSchema = z.object({
        physicalNumber: z.number().optional(),
        flupsyId: z.number().optional(),
        row: z.string().nullable().optional(),
        position: z.number().nullable().optional(),
        state: z.string().optional(),
        nfcData: z.string().nullable().optional(),
        nfcLastProgrammedAt: z.string().nullable().optional(),
        currentCycleId: z.number().nullable().optional()
      });

      const parsedData = updateSchema.safeParse(req.body);
      if (!parsedData.success) {
        const errorMessage = fromZodError(parsedData.error).message;
        return res.status(400).json({ message: errorMessage });
      }

      console.log(`🔍 CONTROLLER - parsedData.data dopo Zod:`, JSON.stringify(parsedData.data));

      const result = await basketsService.updateBasket(id, parsedData.data);
      
      // Se c'è un conflitto di posizione, restituisci info sul cestello occupante
      if (result && typeof result === 'object' && 'positionOccupied' in result) {
        return res.status(200).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error("Error updating basket:", error);
      const message = (error as Error).message;
      const status = message === "Basket not found" ? 404 : 
                    message.includes("Impossibile cambiare") ? 400 : 500;
      res.status(status).json({ message });
    }
  }

  /**
   * DELETE /api/baskets/:id
   * Elimina cestello
   */
  async deleteBasket(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid basket ID" });
      }

      const result = await basketsService.deleteBasket(id);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error deleting basket:", error);
      const message = (error as Error).message;
      const status = message === "Basket not found" ? 404 :
                    message.includes("Cannot delete") ? 400 : 500;
      res.status(status).json({ message });
    }
  }

  /**
   * POST /api/baskets/fix-null-rows
   * Corregge cestelli con row NULL
   */
  async fixNullRows(req: Request, res: Response) {
    try {
      const result = await basketsService.fixNullRows();
      res.json({
        success: true,
        message: `Fixed ${result.fixed} baskets with NULL rows`,
        details: result
      });
    } catch (error) {
      console.error("Error fixing null rows:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fix NULL rows" 
      });
    }
  }

  /**
   * POST /api/baskets/:id/rfid-uhf
   * Associa un codice RFID UHF progressivo (Cesta-001 a Cesta-999) al cestello
   * Questo codice va scritto nel Bank User del tag RFID UHF
   */
  async assignRfidUhf(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid basket ID" });
      }

      // Opzionalmente accetta l'EPC fisico del tag (Bank 1)
      const { epc } = req.body;

      const result = await basketsService.assignRfidUhf(id, epc);
      
      if (!result.success) {
        return res.status(result.status || 400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error("Error assigning RFID UHF:", error);
      res.status(500).json({ 
        success: false, 
        message: (error as Error).message || "Errore durante l'assegnazione RFID UHF" 
      });
    }
  }

  /**
   * DELETE /api/baskets/:id/rfid-uhf
   * Rimuove l'associazione RFID UHF dal cestello
   */
  async removeRfidUhf(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid basket ID" });
      }

      const result = await basketsService.removeRfidUhf(id);
      
      if (!result.success) {
        return res.status(result.status || 400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error("Error removing RFID UHF:", error);
      res.status(500).json({ 
        success: false, 
        message: (error as Error).message || "Errore durante la rimozione RFID UHF" 
      });
    }
  }

  /**
   * GET /api/baskets/next-rfid-uhf-code
   * Restituisce il prossimo codice RFID UHF disponibile (es. "Cesta-042")
   */
  async getNextRfidUhfCode(req: Request, res: Response) {
    try {
      const result = await basketsService.getNextRfidUhfCode();
      res.json(result);
    } catch (error) {
      console.error("Error getting next RFID UHF code:", error);
      res.status(500).json({ 
        success: false, 
        message: "Errore durante il recupero del prossimo codice RFID UHF" 
      });
    }
  }

  /**
   * POST /api/baskets/export-excel
   * Esporta cestelli in Excel con formattazione moderna
   */
  async exportToExcel(req: Request, res: Response) {
    try {
      const { baskets } = req.body;
      
      if (!baskets || !Array.isArray(baskets)) {
        return res.status(400).json({ success: false, message: 'Dati cestelli mancanti' });
      }
      
      const ExcelJS = (await import('exceljs')).default || await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      
      const sheet = workbook.addWorksheet('Gestione Ceste', {
        views: [{ state: 'frozen', ySplit: 2 }]
      });
      
      // Riga titolo
      const titleRow = sheet.addRow(['GESTIONE CESTE - Elenco completo cestelli con dati operativi, lotti, taglie e stato attuale']);
      sheet.mergeCells('A1:P1');
      titleRow.font = { bold: true, size: 14, color: { argb: 'FF1E3A8A' } };
      titleRow.height = 30;
      titleRow.alignment = { vertical: 'middle', horizontal: 'left' };
      
      sheet.columns = [
        { key: 'physicalNumber', width: 12 },
        { key: 'flupsyName', width: 18 },
        { key: 'sitoProduttivo', width: 18 },
        { key: 'activationDate', width: 15 },
        { key: 'lastOperationDate', width: 18 },
        { key: 'pesoCesta', width: 14 },
        { key: 'calculatedSize', width: 12 },
        { key: 'animalsPerKg', width: 12 },
        { key: 'animalCount', width: 14 },
        { key: 'mortalityPercent', width: 12 },
        { key: 'position', width: 10 },
        { key: 'lotId', width: 10 },
        { key: 'supplier', width: 18 },
        { key: 'cycleCode', width: 14 },
        { key: 'lastOperationType', width: 16 },
        { key: 'state', width: 10 }
      ];
      
      const headerRow = sheet.addRow(['ID Cesta', 'FLUPSY', 'Sito Produttivo', 'Data Attivazione', 'Data Ult. Operazione', 'Peso Cesta (Kg)', 'Taglia', 'pz / Kg', 'N° Animali', 'Mortalità %', 'Posizione', 'Lotto', 'Fornitore', 'Codice Ciclo', 'Ultima Operazione', 'Stato']);
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF1E40AF' } },
          left: { style: 'thin', color: { argb: 'FF1E40AF' } },
          bottom: { style: 'thin', color: { argb: 'FF1E40AF' } },
          right: { style: 'thin', color: { argb: 'FF1E40AF' } }
        };
      });
      headerRow.height = 25;
      
      const operationTypeLabels: Record<string, string> = {
        'prima-attivazione': 'Prima Attivazione',
        'misura': 'Misura/Campionamento',
        'peso': 'Peso',
        'pulizia': 'Pulizia',
        'raccolta': 'Raccolta',
        'vendita': 'Vendita',
        'mortalita': 'Mortalità'
      };
      
      baskets.forEach((basket: any, index: number) => {
        const row = sheet.addRow({
          physicalNumber: basket.physicalNumber || null,
          flupsyName: basket.flupsyName,
          sitoProduttivo: basket.sitoProduttivo,
          activationDate: basket.activationDate ? new Date(basket.activationDate).toLocaleDateString('it-IT') : '-',
          lastOperationDate: basket.lastOperationDate ? new Date(basket.lastOperationDate).toLocaleDateString('it-IT') : '-',
          pesoCesta: basket.pesoCesta ? parseFloat(basket.pesoCesta) : null,
          calculatedSize: basket.calculatedSize,
          animalsPerKg: basket.animalsPerKg ? Math.round(basket.animalsPerKg) : null,
          animalCount: basket.animalCount || null,
          mortalityPercent: basket.mortalityPercent !== null && basket.mortalityPercent !== undefined ? parseFloat(basket.mortalityPercent) : null,
          position: basket.position,
          lotId: basket.lotId || null,
          supplier: basket.supplier,
          cycleCode: basket.cycleCode,
          lastOperationType: operationTypeLabels[basket.lastOperationType] || basket.lastOperationType || '-',
          state: basket.state === 'active' ? 'Attivo' : basket.state === 'inactive' ? 'Inattivo' : basket.state || '-'
        });
        
        if (index % 2 === 1) {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        }
        
        const stateCell = row.getCell('state');
        if (basket.state === 'active') {
          stateCell.font = { color: { argb: 'FF16A34A' }, bold: true };
        } else {
          stateCell.font = { color: { argb: 'FF6B7280' } };
        }
        
        const mortCell = row.getCell('mortalityPercent');
        if (basket.mortalityPercent !== null && basket.mortalityPercent !== undefined) {
          if (parseFloat(basket.mortalityPercent) > 5) {
            mortCell.font = { color: { argb: 'FFDC2626' }, bold: true };
          } else if (parseFloat(basket.mortalityPercent) > 2) {
            mortCell.font = { color: { argb: 'FFF97316' } };
          }
        }
      });
      
      sheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
          };
        });
      });
      
      sheet.autoFilter = { from: 'A1', to: `P${baskets.length + 1}` };
      
      const buffer = await workbook.xlsx.writeBuffer();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=gestione_ceste.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error('Error exporting baskets to Excel:', error);
      res.status(500).json({ success: false, message: 'Errore durante l\'esportazione Excel' });
    }
  }

  /**
   * GET /api/baskets/expected-sizes
   * Calcola e restituisce le taglie attese per i cestelli attivi
   */
  async getExpectedSizes(req: Request, res: Response) {
    try {
      forceNoCacheHeaders(res);
      const results = await basketsService.getExpectedSizes();
      res.json(results);
    } catch (error) {
      console.error('Error getting expected sizes:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Errore durante il calcolo delle taglie attese',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Export singleton instance
export const basketsController = new BasketsController();