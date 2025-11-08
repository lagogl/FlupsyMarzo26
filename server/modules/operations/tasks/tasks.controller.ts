import type { Request, Response } from "express";
import { tasksService } from "./tasks.service";
import { insertSelectionTaskSchema, insertSelectionTaskBasketSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { z } from "zod";

export class TasksController {
  /**
   * GET /api/tasks
   */
  async getAll(req: Request, res: Response) {
    try {
      const tasks = await tasksService.getAllTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Errore nel recupero attività:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  }

  /**
   * GET /api/selections/:selectionId/tasks
   */
  async getBySelectionId(req: Request, res: Response) {
    try {
      const selectionId = parseInt(req.params.selectionId);
      if (isNaN(selectionId)) {
        return res.status(400).json({ error: "ID selezione non valido" });
      }

      const tasks = await tasksService.getTasksBySelectionId(selectionId);
      res.json(tasks);
    } catch (error) {
      console.error("Errore nel recupero attività per selezione:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  }

  /**
   * GET /api/tasks/:id
   */
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID attività non valido" });
      }

      const task = await tasksService.getTaskById(id);
      if (!task) {
        return res.status(404).json({ error: `Attività con ID ${id} non trovata` });
      }

      res.json(task);
    } catch (error) {
      console.error("Errore nel recupero attività:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  }

  /**
   * POST /api/tasks
   * Crea un'attività dalle ceste selezionate (uso principale da BasketSelection)
   */
  async createFromBaskets(req: Request, res: Response) {
    try {
      // Validate basketIds
      if (!req.body.basketIds || !Array.isArray(req.body.basketIds) || req.body.basketIds.length === 0) {
        return res.status(400).json({ error: "basketIds richiesto (array non vuoto)" });
      }

      // Validate task data (selectionId now optional)
      const taskSchema = insertSelectionTaskSchema.omit({ selectionId: true }).extend({
        selectionId: z.number().optional(),
        cadence: z.string().optional(),
        cadenceInterval: z.number().optional(),
      });

      const validation = taskSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ 
          error: "Dati non validi", 
          details: fromZodError(validation.error).toString() 
        });
      }

      const task = await tasksService.createTask(validation.data);

      // Add baskets
      const basketsData = req.body.basketIds.map((basketId: number) => ({
        taskId: task.id,
        basketId,
        role: req.body.basketRole || 'source'
      }));
      await tasksService.addBasketsToTask(task.id, basketsData);

      // Assign operators if provided
      if (req.body.operatorIds && Array.isArray(req.body.operatorIds)) {
        await tasksService.assignOperators(task.id, req.body.operatorIds);
      }

      // Return full task details
      const fullTask = await tasksService.getTaskById(task.id);
      res.status(201).json(fullTask);
    } catch (error) {
      console.error("Errore nella creazione attività:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  }

  /**
   * POST /api/selections/:selectionId/tasks (DEPRECATED - usa POST /api/tasks)
   */
  async create(req: Request, res: Response) {
    try {
      const selectionId = parseInt(req.params.selectionId);
      if (isNaN(selectionId)) {
        return res.status(400).json({ error: "ID selezione non valido" });
      }

      // Validate task data
      const validation = insertSelectionTaskSchema.safeParse({
        ...req.body,
        selectionId
      });

      if (!validation.success) {
        return res.status(400).json({ 
          error: "Dati non validi", 
          details: fromZodError(validation.error).toString() 
        });
      }

      const task = await tasksService.createTask(validation.data);

      // Add baskets if provided
      if (req.body.basketIds && Array.isArray(req.body.basketIds)) {
        const basketsData = req.body.basketIds.map((basketId: number) => ({
          taskId: task.id,
          basketId,
          role: req.body.basketRole || 'source'
        }));
        await tasksService.addBasketsToTask(task.id, basketsData);
      }

      // Assign operators if provided
      if (req.body.operatorIds && Array.isArray(req.body.operatorIds)) {
        await tasksService.assignOperators(task.id, req.body.operatorIds);
      }

      // Return full task details
      const fullTask = await tasksService.getTaskById(task.id);
      res.status(201).json(fullTask);
    } catch (error) {
      console.error("Errore nella creazione attività:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  }

  /**
   * PATCH /api/tasks/:id
   */
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID attività non valido" });
      }

      const task = await tasksService.updateTask(id, req.body);
      if (!task) {
        return res.status(404).json({ error: `Attività con ID ${id} non trovata` });
      }

      res.json(task);
    } catch (error) {
      console.error("Errore nell'aggiornamento attività:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  }

  /**
   * DELETE /api/tasks/:id
   */
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID attività non valido" });
      }

      const deleted = await tasksService.deleteTask(id);
      if (!deleted) {
        return res.status(404).json({ error: `Attività con ID ${id} non trovata` });
      }

      res.json({ success: true, message: "Attività eliminata con successo" });
    } catch (error) {
      console.error("Errore nell'eliminazione attività:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  }

  /**
   * POST /api/tasks/:id/assign
   */
  async assignOperators(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ error: "ID attività non valido" });
      }

      const { operatorIds } = req.body;
      if (!Array.isArray(operatorIds) || operatorIds.length === 0) {
        return res.status(400).json({ error: "Array operatorIds richiesto" });
      }

      const assignments = await tasksService.assignOperators(taskId, operatorIds);
      res.status(201).json(assignments);
    } catch (error) {
      console.error("Errore nell'assegnazione operatori:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  }

  /**
   * PATCH /api/tasks/:taskId/assignments/:assignmentId
   */
  async updateAssignment(req: Request, res: Response) {
    try {
      const assignmentId = parseInt(req.params.assignmentId);
      if (isNaN(assignmentId)) {
        return res.status(400).json({ error: "ID assegnazione non valido" });
      }

      const { status, completionNotes } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Campo status richiesto" });
      }

      const validStatuses = ['assigned', 'accepted', 'in_progress', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Status non valido" });
      }

      const assignment = await tasksService.updateAssignmentStatus(
        assignmentId, 
        status,
        completionNotes
      );

      res.json(assignment);
    } catch (error) {
      console.error("Errore nell'aggiornamento assegnazione:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  }

  /**
   * POST /api/tasks/:id/complete
   */
  async complete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID attività non valido" });
      }

      const [task] = await tasksService.completeTask(id);
      if (!task) {
        return res.status(404).json({ error: `Attività con ID ${id} non trovata` });
      }

      res.json(task);
    } catch (error) {
      console.error("Errore nel completamento attività:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  }

  /**
   * GET /api/operators/:operatorId/tasks
   * For external app - get tasks assigned to specific operator
   */
  async getTasksForOperator(req: Request, res: Response) {
    try {
      const operatorId = parseInt(req.params.operatorId);
      if (isNaN(operatorId)) {
        return res.status(400).json({ error: "ID operatore non valido" });
      }

      const statusFilter = req.query.status 
        ? String(req.query.status).split(',')
        : undefined;

      const tasks = await tasksService.getTasksForOperator(operatorId, statusFilter);
      res.json(tasks);
    } catch (error) {
      console.error("Errore nel recupero attività per operatore:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  }

  /**
   * GET /api/tasks/:id/baskets
   * For external app - get baskets for a task
   */
  async getTaskBaskets(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ error: "ID attività non valido" });
      }

      const baskets = await tasksService.getTaskBaskets(taskId);
      res.json(baskets);
    } catch (error) {
      console.error("Errore nel recupero ceste per attività:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  }
}

export const tasksController = new TasksController();
