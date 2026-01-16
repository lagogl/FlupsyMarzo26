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
}

export const cyclesController = new CyclesController();

/**
 * Invalida la cache dei cicli
 */
export function clearCyclesCache(): void {
  clearCache();
  console.log('🗑️ Cache cicli invalidata tramite controller');
}
