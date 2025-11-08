import type { Request, Response } from "express";
import { operatorsService } from "./operators.service";
import { insertOperatorSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export class OperatorsController {
  /**
   * GET /api/operators
   */
  async getAll(req: Request, res: Response) {
    try {
      const activeOnly = req.query.active === 'true';
      const operators = await operatorsService.getAllOperators(activeOnly);
      res.json(operators);
    } catch (error) {
      console.error("Errore nel recupero operatori:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  }

  /**
   * GET /api/operators/:id
   */
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID operatore non valido" });
      }

      const operator = await operatorsService.getOperatorById(id);
      if (!operator) {
        return res.status(404).json({ error: `Operatore con ID ${id} non trovato` });
      }

      res.json(operator);
    } catch (error) {
      console.error("Errore nel recupero operatore:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  }

  /**
   * POST /api/operators
   */
  async create(req: Request, res: Response) {
    try {
      const validation = insertOperatorSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Dati non validi", 
          details: fromZodError(validation.error).toString() 
        });
      }

      const operator = await operatorsService.createOperator(validation.data);
      res.status(201).json(operator);
    } catch (error) {
      console.error("Errore nella creazione operatore:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  }

  /**
   * PATCH /api/operators/:id
   */
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID operatore non valido" });
      }

      const operator = await operatorsService.updateOperator(id, req.body);
      if (!operator) {
        return res.status(404).json({ error: `Operatore con ID ${id} non trovato` });
      }

      res.json(operator);
    } catch (error) {
      console.error("Errore nell'aggiornamento operatore:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  }

  /**
   * DELETE /api/operators/:id
   */
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID operatore non valido" });
      }

      const deleted = await operatorsService.deleteOperator(id);
      if (!deleted) {
        return res.status(404).json({ error: `Operatore con ID ${id} non trovato` });
      }

      res.json({ success: true, message: "Operatore eliminato con successo" });
    } catch (error) {
      console.error("Errore nell'eliminazione operatore:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  }

  /**
   * PATCH /api/operators/:id/deactivate
   */
  async deactivate(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID operatore non valido" });
      }

      const operator = await operatorsService.deactivateOperator(id);
      if (!operator) {
        return res.status(404).json({ error: `Operatore con ID ${id} non trovato` });
      }

      res.json(operator);
    } catch (error) {
      console.error("Errore nella disattivazione operatore:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  }

  /**
   * PATCH /api/operators/:id/reactivate
   */
  async reactivate(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID operatore non valido" });
      }

      const operator = await operatorsService.reactivateOperator(id);
      if (!operator) {
        return res.status(404).json({ error: `Operatore con ID ${id} non trovato` });
      }

      res.json(operator);
    } catch (error) {
      console.error("Errore nella riattivazione operatore:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  }
}

export const operatorsController = new OperatorsController();
