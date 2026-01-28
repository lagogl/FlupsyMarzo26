/**
 * Controller per la gestione dei cicli
 * Gestisce le richieste HTTP e coordina con il service
 */

import { Request, Response } from 'express';
import { cyclesService, clearCache } from './cycles.service';

export class CyclesController {
  /**
   * GET /api/cycles
   * Lista cicli con filtri e paginazione
   */
  async getCycles(req: Request, res: Response) {
    try {
      const startTime = Date.now();
      
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 10;
      const state = req.query.state as string | null || null;
      const flupsyId = req.query.flupsyId ? parseInt(req.query.flupsyId as string) : null;
      const startDateFrom = req.query.startDateFrom as string | null || null;
      const startDateTo = req.query.startDateTo as string | null || null;
      const sortBy = (req.query.sortBy as string) || 'startDate';
      const sortOrder = (req.query.sortOrder as string) || 'desc';
      const includeAll = req.query.includeAll === 'true';

      console.log(`Richiesta di tutti i cicli con includeAll=${includeAll}`);

      const result = await cyclesService.getCycles({
        page,
        pageSize,
        state,
        flupsyId,
        startDateFrom,
        startDateTo,
        sortBy,
        sortOrder,
        includeAll
      });

      const duration = Date.now() - startTime;
      console.log(`Risposta cicli completata in ${duration}ms`);

      res.json(result);
    } catch (error) {
      console.error("Error getting cycles:", error);
      res.status(500).json({ 
        message: "Failed to get cycles",
        error: (error as Error).message 
      });
    }
  }

  /**
   * GET /api/cycles/active
   * Cicli attivi
   */
  async getActiveCycles(req: Request, res: Response) {
    try {
      const cycles = await cyclesService.getActiveCycles();
      res.json(cycles);
    } catch (error) {
      console.error("Error getting active cycles:", error);
      res.status(500).json({ message: "Failed to get active cycles" });
    }
  }

  /**
   * GET /api/cycles/active-with-details
   * Cicli attivi con dettagli
   */
  async getActiveCyclesWithDetails(req: Request, res: Response) {
    try {
      const cycles = await cyclesService.getActiveCyclesWithDetails();
      res.json(cycles);
    } catch (error) {
      console.error("Error getting active cycles with details:", error);
      res.status(500).json({ message: "Failed to get active cycles with details" });
    }
  }

  /**
   * GET /api/cycles/:id
   * Singolo ciclo per ID
   */
  async getCycle(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid cycle ID" });
      }

      const cycle = await cyclesService.getCycleById(id);
      if (!cycle) {
        return res.status(404).json({ message: "Cycle not found" });
      }

      res.json(cycle);
    } catch (error) {
      console.error("Error getting cycle:", error);
      res.status(500).json({ message: "Failed to get cycle" });
    }
  }

  /**
   * GET /api/cycles/basket/:basketId
   * Cicli per cestello
   */
  async getCyclesByBasket(req: Request, res: Response) {
    try {
      const basketId = parseInt(req.params.basketId);
      if (isNaN(basketId)) {
        return res.status(400).json({ message: "Invalid basket ID" });
      }

      const cycles = await cyclesService.getCyclesByBasket(basketId);
      res.json(cycles);
    } catch (error) {
      console.error("Error getting cycles by basket:", error);
      res.status(500).json({ message: "Failed to get cycles by basket" });
    }
  }

  /**
   * POST /api/cycles
   * Crea nuovo ciclo
   */
  async createCycle(req: Request, res: Response) {
    try {
      const cycle = await cyclesService.createCycle(req.body);
      res.status(201).json(cycle);
    } catch (error) {
      console.error("Error creating cycle:", error);
      res.status(500).json({ 
        message: "Failed to create cycle",
        error: (error as Error).message 
      });
    }
  }

  /**
   * POST /api/cycles/:id/close
   * Chiude un ciclo creando operazione e record pending
   */
  async closeCycle(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid cycle ID" });
      }

      const endDate = req.body.endDate || new Date().toISOString().split('T')[0];
      const notes = req.body.notes as string | undefined;
      
      const result = await cyclesService.closeCycle(id, endDate, notes);
      if (!result) {
        return res.status(404).json({ message: "Cycle not found" });
      }

      res.json({
        message: "Ciclo chiuso con successo. Animali in attesa di destinazione.",
        ...result
      });
    } catch (error) {
      console.error("Error closing cycle:", error);
      const errorMessage = (error as Error).message;
      
      // Gestione errori specifici
      if (errorMessage.includes('già chiuso')) {
        return res.status(409).json({ 
          message: "Ciclo già chiuso",
          error: errorMessage 
        });
      }
      if (errorMessage.includes('non trovato')) {
        return res.status(404).json({ 
          message: "Ciclo non trovato",
          error: errorMessage 
        });
      }
      
      res.status(500).json({ 
        message: "Errore chiusura ciclo",
        error: errorMessage 
      });
    }
  }

  /**
   * GET /api/cycles/pending-closures
   * Ottiene chiusure in attesa di destinazione
   */
  async getPendingClosures(req: Request, res: Response) {
    try {
      const flupsyId = req.query.flupsyId ? parseInt(req.query.flupsyId as string) : undefined;
      const pendingClosures = await cyclesService.getPendingClosures(flupsyId);
      res.json(pendingClosures);
    } catch (error) {
      console.error("Error getting pending closures:", error);
      res.status(500).json({ message: "Failed to get pending closures" });
    }
  }

  /**
   * GET /api/cycles/pending-closures/count
   * Conta chiusure pendenti (per notifiche)
   */
  async getPendingClosuresCount(req: Request, res: Response) {
    try {
      const count = await cyclesService.getPendingClosuresCount();
      res.json({ count });
    } catch (error) {
      console.error("Error getting pending closures count:", error);
      res.status(500).json({ message: "Failed to get pending closures count" });
    }
  }

  /**
   * POST /api/cycles/pending-closures/:id/resolve
   * Risolve una chiusura pendente assegnando la destinazione
   */
  async resolvePendingClosure(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid pending closure ID" });
      }

      const { destination, resolvedBy, destinationNotes, destinationBasketId } = req.body;
      
      if (!destination) {
        return res.status(400).json({ message: "Destinazione obbligatoria" });
      }
      
      if (!['altra-cesta', 'sand-nursery', 'mortalita'].includes(destination)) {
        return res.status(400).json({ 
          message: "Destinazione non valida. Opzioni: altra-cesta, sand-nursery, mortalita" 
        });
      }
      
      if (!resolvedBy) {
        return res.status(400).json({ message: "Nome operatore obbligatorio" });
      }

      const resolved = await cyclesService.resolvePendingClosure(
        id,
        destination,
        resolvedBy,
        destinationNotes,
        destinationBasketId ? parseInt(destinationBasketId) : undefined
      );

      const destinationLabels: Record<string, string> = {
        'altra-cesta': 'Trasferimento in altra cesta',
        'sand-nursery': 'Trasferimento a Sand Nursery',
        'mortalita': 'Registrato come mortalità'
      };

      res.json({
        message: `Destinazione assegnata: ${destinationLabels[destination]}`,
        resolved
      });
    } catch (error) {
      console.error("Error resolving pending closure:", error);
      const errorMessage = (error as Error).message;
      
      // Gestione errori specifici
      if (errorMessage.includes('già risolta')) {
        return res.status(409).json({ 
          message: "Chiusura già risolta",
          error: errorMessage 
        });
      }
      if (errorMessage.includes('non trovata')) {
        return res.status(404).json({ 
          message: "Chiusura pendente non trovata",
          error: errorMessage 
        });
      }
      
      res.status(500).json({ 
        message: "Errore risoluzione chiusura",
        error: errorMessage 
      });
    }
  }

  /**
   * Annulla una chiusura pendente e ripristina lo stato precedente
   * POST /api/cycles/pending-closures/:id/cancel
   */
  async cancelPendingClosure(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { cancelledBy, reason } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({ message: "ID non valido" });
      }
      
      if (!cancelledBy) {
        return res.status(400).json({ message: "Nome operatore obbligatorio" });
      }

      const result = await cyclesService.cancelPendingClosure(id, cancelledBy, reason);

      res.json(result);
    } catch (error) {
      console.error("Error cancelling pending closure:", error);
      const errorMessage = (error as Error).message;
      
      if (errorMessage.includes('non trovata')) {
        return res.status(404).json({ 
          message: "Chiusura pendente non trovata",
          error: errorMessage 
        });
      }
      if (errorMessage.includes('già risolta')) {
        return res.status(409).json({ 
          message: "Impossibile annullare - chiusura già risolta",
          error: errorMessage 
        });
      }
      
      res.status(500).json({ 
        message: "Errore annullamento chiusura",
        error: errorMessage 
      });
    }
  }

  /**
   * Esporta i cicli in formato Excel
   * POST /api/cycles/export-excel
   */
  async exportCyclesExcel(req: Request, res: Response) {
    try {
      const { cycles, operations } = req.body;
      
      if (!cycles || !Array.isArray(cycles)) {
        return res.status(400).json({ message: "Dati cicli mancanti" });
      }
      
      const ExcelJSModule = await import('exceljs');
      const ExcelJS = ExcelJSModule.default || ExcelJSModule;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'FLUPSY Management System';
      workbook.created = new Date();
      
      // ========== FOGLIO 1: CICLI PRODUTTIVI ==========
      const sheet = workbook.addWorksheet('Cicli Produttivi', {
        views: [{ state: 'frozen', ySplit: 2 }]
      });
      
      // Riga titolo
      const titleRow = sheet.addRow(['CICLI PRODUTTIVI - Elenco completo cicli con stato, date, lotti e performance SGR']);
      sheet.mergeCells('A1:K1');
      titleRow.font = { bold: true, size: 14, color: { argb: 'FF1E3A8A' } };
      titleRow.height = 30;
      titleRow.alignment = { vertical: 'middle', horizontal: 'left' };
      
      sheet.columns = [
        { key: 'id', width: 8 },
        { key: 'cycleCode', width: 12 },
        { key: 'basketNumber', width: 10 },
        { key: 'flupsyName', width: 18 },
        { key: 'lotSupplier', width: 20 },
        { key: 'startDate', width: 14 },
        { key: 'endDate', width: 14 },
        { key: 'state', width: 10 },
        { key: 'sizeCode', width: 10 },
        { key: 'sgr', width: 8 },
        { key: 'animalCount', width: 15 }
      ];
      
      const headerRow = sheet.addRow(['ID', 'Nr. Ciclo', 'Cestello', 'FLUPSY', 'Lotto', 'Data Inizio', 'Data Fine', 'Stato', 'Taglia', 'SGR', 'Nr. Animali']);
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
      
      cycles.forEach((cycle: any, index: number) => {
        const row = sheet.addRow({
          id: cycle.id,
          cycleCode: cycle.cycleCode,
          basketNumber: cycle.basketNumber,
          flupsyName: cycle.flupsyName,
          lotSupplier: cycle.lotSupplier,
          startDate: cycle.startDate ? new Date(cycle.startDate).toLocaleDateString('it-IT') : '-',
          endDate: cycle.endDate ? new Date(cycle.endDate).toLocaleDateString('it-IT') : '-',
          state: cycle.state === 'active' ? 'Attivo' : 'Chiuso',
          sizeCode: cycle.sizeCode,
          sgr: cycle.sgr ? parseFloat(cycle.sgr.toFixed(2)) : null,
          animalCount: cycle.animalCount || null
        });
        
        if (index % 2 === 1) {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        }
        
        const stateCell = row.getCell('state');
        if (cycle.state === 'active') {
          stateCell.font = { color: { argb: 'FF16A34A' }, bold: true };
        } else {
          stateCell.font = { color: { argb: 'FF6B7280' } };
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
      
      sheet.autoFilter = { from: 'A1', to: `K${cycles.length + 1}` };
      
      // ========== FOGLIO 2: OPERAZIONI PER CICLO (con righe collassabili) ==========
      if (operations && Array.isArray(operations) && operations.length > 0) {
        const opsSheet = workbook.addWorksheet('Operazioni per Ciclo', {
          views: [{ state: 'frozen', ySplit: 2 }],
          properties: { outlineLevelRow: 1 }
        });
        
        // Riga titolo
        const opsTitleRow = opsSheet.addRow(['OPERAZIONI PER CICLO - Dettaglio completo operazioni raggruppate per ciclo produttivo']);
        opsSheet.mergeCells('A1:K1');
        opsTitleRow.font = { bold: true, size: 14, color: { argb: 'FF065F46' } };
        opsTitleRow.height = 30;
        opsTitleRow.alignment = { vertical: 'middle', horizontal: 'left' };
        
        opsSheet.columns = [
          { key: 'cycleCode', width: 12 },
          { key: 'basketNumber', width: 10 },
          { key: 'flupsyName', width: 16 },
          { key: 'type', width: 16 },
          { key: 'date', width: 12 },
          { key: 'sizeCode', width: 10 },
          { key: 'animalCount', width: 14 },
          { key: 'totalWeight', width: 12 },
          { key: 'animalsPerKg', width: 10 },
          { key: 'deadCount', width: 10 },
          { key: 'notes', width: 25 }
        ];
        
        const opsHeaderRow = opsSheet.addRow(['Ciclo', 'Cestello', 'FLUPSY', 'Tipo', 'Data', 'Taglia', 'Nr. Animali', 'Peso Tot (g)', 'An/Kg', 'Mortalità', 'Note']);
        opsHeaderRow.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF059669' } },
            left: { style: 'thin', color: { argb: 'FF059669' } },
            bottom: { style: 'thin', color: { argb: 'FF059669' } },
            right: { style: 'thin', color: { argb: 'FF059669' } }
          };
        });
        opsHeaderRow.height = 25;
        
        const operationTypeLabels: Record<string, string> = {
          'prima-attivazione': 'Prima Attivazione',
          'misura': 'Misura/Campionamento',
          'peso': 'Peso',
          'pulizia': 'Pulizia',
          'raccolta': 'Raccolta',
          'vendita': 'Vendita',
          'mortalita': 'Mortalità'
        };
        
        const cycleIds = cycles.map((c: any) => c.id);
        
        cycles.forEach((cycle: any) => {
          const cycleOps = operations
            .filter((op: any) => op.cycleId === cycle.id)
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          if (cycleOps.length === 0) return;
          
          const latestOp = cycleOps[0];
          const summaryRow = opsSheet.addRow({
            cycleCode: cycle.cycleCode,
            basketNumber: cycle.basketNumber,
            flupsyName: cycle.flupsyName,
            type: `📊 GIACENZA (${cycleOps.length} operazioni)`,
            date: latestOp.date ? new Date(latestOp.date).toLocaleDateString('it-IT') : '-',
            sizeCode: latestOp.sizeCode || '-',
            animalCount: latestOp.animalCount || null,
            totalWeight: latestOp.totalWeight || null,
            animalsPerKg: latestOp.animalsPerKg || null,
            deadCount: null,
            notes: ''
          });
          
          summaryRow.font = { bold: true };
          summaryRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
          summaryRow.outlineLevel = 0;
          
          const summaryRowNum = summaryRow.number;
          
          cycleOps.forEach((op: any, opIndex: number) => {
            const opRow = opsSheet.addRow({
              cycleCode: '',
              basketNumber: '',
              flupsyName: '',
              type: operationTypeLabels[op.type] || op.type,
              date: op.date ? new Date(op.date).toLocaleDateString('it-IT') : '-',
              sizeCode: op.sizeCode || '-',
              animalCount: op.animalCount || null,
              totalWeight: op.totalWeight || null,
              animalsPerKg: op.animalsPerKg || null,
              deadCount: op.deadCount || null,
              notes: op.notes || ''
            });
            
            opRow.outlineLevel = 1;
            opRow.hidden = true;
            
            if (opIndex % 2 === 1) {
              opRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
            }
          });
        });
        
        opsSheet.eachRow((row) => {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
              left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
              bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
              right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
            };
          });
        });
        
        // Abilita filtro automatico sul foglio operazioni
        const lastRow = opsSheet.rowCount;
        opsSheet.autoFilter = { from: 'A1', to: `K${lastRow}` };
      }
      
      const buffer = await workbook.xlsx.writeBuffer();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=cicli_produttivi.xlsx');
      res.send(buffer);
      
    } catch (error) {
      console.error("Error exporting cycles to Excel:", error);
      res.status(500).json({ 
        message: "Errore esportazione Excel",
        error: (error as Error).message 
      });
    }
  }

  /**
   * GET /api/cycles/:id/sgr-peso
   * Calcola SGR-Peso per un ciclo basandosi sulle operazioni peso e prima-attivazione
   * SGR = (ln(peso_finale) - ln(peso_iniziale)) / giorni * 100
   */
  async getSgrPeso(req: Request, res: Response) {
    try {
      const cycleId = parseInt(req.params.id);
      
      if (isNaN(cycleId)) {
        return res.status(400).json({ message: "ID ciclo non valido" });
      }
      
      const result = await cyclesService.calculateSgrPeso(cycleId);
      
      res.json(result);
    } catch (error) {
      console.error("Error calculating SGR-Peso:", error);
      res.status(500).json({ 
        message: "Errore nel calcolo SGR-Peso",
        error: (error as Error).message 
      });
    }
  }

  /**
   * GET /api/cycles/batch/sgr-peso
   * Calcola SGR-Peso per tutti i cicli attivi (batch)
   * Usato da Spreadsheet Operations per mostrare tutti i dati
   */
  async getBatchSgrPeso(req: Request, res: Response) {
    try {
      // Ottieni tutti i cicli attivi
      const activeCycles = await cyclesService.getActiveCycles();
      
      // Calcola SGR-Peso per ogni ciclo in parallelo
      const results = await Promise.all(
        activeCycles.map(async (cycle: any) => {
          try {
            const sgrPesoData = await cyclesService.calculateSgrPeso(cycle.id);
            return {
              cycleId: cycle.id,
              basketId: cycle.basketId,
              ...sgrPesoData
            };
          } catch (err) {
            return {
              cycleId: cycle.id,
              basketId: cycle.basketId,
              sgrPesoMedio: null,
              sgrPesoIntermedi: [],
              error: (err as Error).message
            };
          }
        })
      );
      
      res.json(results);
    } catch (error) {
      console.error("Error calculating batch SGR-Peso:", error);
      res.status(500).json({ 
        message: "Errore nel calcolo batch SGR-Peso",
        error: (error as Error).message 
      });
    }
  }
}

export const cyclesController = new CyclesController();

/**
 * Invalida la cache dei cicli
 */
export function clearCyclesCache(): void {
  clearCache();
  console.log('🗑️ Cache cicli invalidata tramite controller');
}
