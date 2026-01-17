import type { Request, Response } from "express";
import { lotsService } from "./lots.service";
import { insertLotSchema, lotSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export class LotsController {
  /**
   * GET /api/lots
   * Get all lots with optional sizes
   */
  async getAll(req: Request, res: Response) {
    try {
      const includeSizes = req.query.includeSizes !== 'false';
      const lots = await lotsService.getAllLots(includeSizes);
      res.json(lots);
    } catch (error) {
      console.error("Error fetching lots:", error);
      res.status(500).json({ message: "Failed to fetch lots" });
    }
  }

  /**
   * GET /api/lots/optimized
   * Get optimized lots with filtering and pagination
   */
  async getOptimized(req: Request, res: Response) {
    try {
      const filters = {
        id: req.query.id as string | undefined,
        state: req.query.state as string | undefined,
        supplier: req.query.supplier as string | undefined,
        quality: req.query.quality as string | undefined,
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
        sizeId: req.query.sizeId as string | undefined
      };

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;

      const allLots = await lotsService.getOptimizedLots(filters);
      
      // Calculate statistics
      const statistics = {
        counts: {
          normali: allLots.filter(l => l.quality === 'normali').length,
          teste: allLots.filter(l => l.quality === 'teste').length,
          code: allLots.filter(l => l.quality === 'code').length,
          totale: allLots.length
        },
        percentages: {
          normali: allLots.length > 0 ? (allLots.filter(l => l.quality === 'normali').length / allLots.length * 100) : 0,
          teste: allLots.length > 0 ? (allLots.filter(l => l.quality === 'teste').length / allLots.length * 100) : 0,
          code: allLots.length > 0 ? (allLots.filter(l => l.quality === 'code').length / allLots.length * 100) : 0
        }
      };

      // Pagination
      const totalCount = allLots.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedLots = allLots.slice(startIndex, endIndex);

      res.json({
        lots: paginatedLots,
        totalPages,
        totalCount,
        statistics
      });
    } catch (error) {
      console.error("Error fetching optimized lots:", error);
      res.status(500).json({ message: "Failed to fetch optimized lots" });
    }
  }

  /**
   * GET /api/lots/active
   * Get active lots only
   */
  async getActive(req: Request, res: Response) {
    try {
      const lots = await lotsService.getActiveLots();
      res.json(lots);
    } catch (error) {
      console.error("Error fetching active lots:", error);
      res.status(500).json({ message: "Failed to fetch active lots" });
    }
  }

  /**
   * GET /api/lots/timeline
   * Get lot ledger timeline with filters
   */
  async getTimeline(req: Request, res: Response) {
    try {
      const filters = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 50,
        lotId: req.query.lotId ? parseInt(req.query.lotId as string) : undefined,
        type: req.query.type as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined
      };

      const timeline = await lotsService.getLotTimeline(filters);
      res.json(timeline);
    } catch (error) {
      console.error("Error fetching lot timeline:", error);
      res.status(500).json({ message: "Failed to fetch lot timeline" });
    }
  }

  /**
   * GET /api/lots/:id
   * Get lot by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid lot ID" });
      }

      const lot = await lotsService.getLotById(id);
      if (!lot) {
        return res.status(404).json({ message: "Lot not found" });
      }

      res.json(lot);
    } catch (error) {
      console.error("Error fetching lot:", error);
      res.status(500).json({ message: "Failed to fetch lot" });
    }
  }

  /**
   * GET /api/lots/:id/stats
   * Get lot statistics
   */
  async getStats(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid lot ID" });
      }

      const stats = await lotsService.getLotStats(id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching lot stats:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch lot stats";
      res.status(500).json({ message });
    }
  }

  /**
   * POST /api/lots
   * Create new lot
   */
  async create(req: Request, res: Response) {
    try {
      const parsedData = insertLotSchema.safeParse(req.body);
      if (!parsedData.success) {
        const errorMessage = fromZodError(parsedData.error).message;
        return res.status(400).json({ message: errorMessage });
      }

      const newLot = await lotsService.createLot(parsedData.data);
      
      // Broadcast update if WebSocket is available
      if (typeof (global as any).broadcastUpdate === 'function') {
        (global as any).broadcastUpdate('lot_created', {
          lot: newLot,
          message: `Lotto ${newLot.supplier} - ${newLot.supplierLotNumber} creato`
        });
      }

      res.status(201).json(newLot);
    } catch (error) {
      console.error("Error creating lot:", error);
      res.status(500).json({ message: "Failed to create lot" });
    }
  }

  /**
   * PATCH /api/lots/:id
   * Update lot
   */
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid lot ID" });
      }

      const lot = await lotsService.getLotById(id);
      if (!lot) {
        return res.status(404).json({ message: "Lot not found" });
      }

      const updatedLot = await lotsService.updateLot(id, req.body);

      // Broadcast update if WebSocket is available
      if (updatedLot && typeof (global as any).broadcastUpdate === 'function') {
        (global as any).broadcastUpdate('lot_updated', {
          lot: updatedLot,
          message: `Lotto ${updatedLot.supplier} - ${updatedLot.supplierLotNumber} aggiornato`
        });
      }

      res.json(updatedLot);
    } catch (error) {
      console.error("Error updating lot:", error);
      res.status(500).json({ message: "Failed to update lot" });
    }
  }

  /**
   * DELETE /api/lots/:id
   * Delete lot
   */
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid lot ID" });
      }

      const lot = await lotsService.getLotById(id);
      if (!lot) {
        return res.status(404).json({ message: "Lot not found" });
      }

      await lotsService.deleteLot(id);

      // Broadcast update if WebSocket is available
      if (typeof (global as any).broadcastUpdate === 'function') {
        (global as any).broadcastUpdate('lot_deleted', {
          lotId: id,
          message: `Lotto ${lot.supplier} - ${lot.supplierLotNumber} eliminato`
        });
      }

      res.json({ success: true, message: "Lot deleted successfully" });
    } catch (error) {
      console.error("Error deleting lot:", error);
      res.status(500).json({ message: "Failed to delete lot" });
    }
  }

  /**
   * POST /api/lots/refresh-cache
   * Refresh lots cache
   */
  async refreshCache(req: Request, res: Response) {
    try {
      const result = lotsService.refreshCache();
      res.json(result);
    } catch (error) {
      console.error("Error refreshing lots cache:", error);
      res.status(500).json({ message: "Failed to refresh cache" });
    }
  }

  /**
   * POST /api/lots/export-excel
   * Export lots to Excel with inventory and mortality data
   */
  async exportExcel(req: Request, res: Response) {
    try {
      const { lots, viewMode } = req.body;
      
      if (!lots || !Array.isArray(lots)) {
        return res.status(400).json({ message: "Dati lotti mancanti" });
      }
      
      const ExcelJSModule = await import('exceljs');
      const ExcelJS = ExcelJSModule.default || ExcelJSModule;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'FLUPSY Management System';
      workbook.created = new Date();
      
      const sheet = workbook.addWorksheet('Lotti', {
        views: [{ state: 'frozen', ySplit: 2 }]
      });
      
      // Riga titolo
      const titleRow = sheet.addRow(['GESTIONE LOTTI - Inventario completo lotti con quantità iniziali, vendite, mortalità e stato']);
      sheet.mergeCells('A1:N1');
      titleRow.font = { bold: true, size: 14, color: { argb: 'FF1E3A8A' } };
      titleRow.height = 30;
      titleRow.alignment = { vertical: 'middle', horizontal: 'left' };
      
      // Colonne base + dettagliate
      const columns = [
        { key: 'id', width: 6 },
        { key: 'arrivalDate', width: 12 },
        { key: 'supplier', width: 18 },
        { key: 'supplierLotNumber', width: 14 },
        { key: 'quality', width: 10 },
        { key: 'sizeCode', width: 10 },
        { key: 'ageDays', width: 10 },
        { key: 'initialCount', width: 14 },
        { key: 'currentCount', width: 14 },
        { key: 'soldCount', width: 12 },
        { key: 'totalMortality', width: 12 },
        { key: 'mortalityRate', width: 12 },
        { key: 'state', width: 10 },
        { key: 'notes', width: 25 }
      ];
      
      sheet.columns = columns;
      
      // Stile intestazione
      const headerRow = sheet.addRow(['ID', 'Data Arrivo', 'Fornitore', 'N. Lotto Forn.', 'Qualità', 'Taglia', 'Età (gg)', 'Q.tà Iniziale', 'Q.tà Attuale', 'Venduti', 'Mortalità', '% Mortalità', 'Stato', 'Note']);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 24;
      
      // Mappa qualità con stelle
      const qualityLabels: Record<string, string> = {
        'teste': 'Teste ★★★',
        'normali': 'Normali ★★',
        'code': 'Code ★'
      };
      
      // Aggiungi dati
      lots.forEach((lot: any, index: number) => {
        const mortalityRate = lot.initialCount > 0 
          ? ((lot.totalMortality || 0) / lot.initialCount * 100).toFixed(2) + '%'
          : '0.00%';
        
        const row = sheet.addRow({
          id: lot.id,
          arrivalDate: lot.arrivalDate ? new Date(lot.arrivalDate).toLocaleDateString('it-IT') : '-',
          supplier: lot.supplier || '-',
          supplierLotNumber: lot.supplierLotNumber || '-',
          quality: qualityLabels[lot.quality] || lot.quality || '-',
          sizeCode: lot.sizeCode || lot.size?.code || '-',
          ageDays: lot.ageDays || null,
          initialCount: lot.animalCount || null,
          currentCount: lot.currentCount || lot.animalCount || null,
          soldCount: lot.soldCount || null,
          totalMortality: lot.totalMortality || null,
          mortalityRate: parseFloat(mortalityRate),
          state: lot.state === 'active' ? 'Attivo' : 'Esaurito',
          notes: lot.notes || ''
        });
        
        // Righe alternate
        if (index % 2 === 1) {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        }
        
        // Colora stato
        const stateCell = row.getCell('state');
        if (lot.state === 'active') {
          stateCell.font = { color: { argb: 'FF16A34A' }, bold: true };
        } else {
          stateCell.font = { color: { argb: 'FF9CA3AF' } };
        }
        
        // Colora mortalità alta
        const mortCell = row.getCell('mortalityRate');
        const mortValue = parseFloat(mortalityRate);
        if (mortValue > 5) {
          mortCell.font = { color: { argb: 'FFDC2626' }, bold: true };
        } else if (mortValue > 2) {
          mortCell.font = { color: { argb: 'FFF59E0B' } };
        }
      });
      
      // Bordi
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
      
      // Filtro automatico
      sheet.autoFilter = { from: 'A1', to: `N${lots.length + 1}` };
      
      const buffer = await workbook.xlsx.writeBuffer();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=lotti_export.xlsx');
      res.send(buffer);
      
    } catch (error) {
      console.error("Error exporting lots to Excel:", error);
      res.status(500).json({ 
        message: "Errore esportazione Excel",
        error: (error as Error).message 
      });
    }
  }
}

export const lotsController = new LotsController();
