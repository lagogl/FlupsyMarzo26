import { Router } from "express";
import { tasksController } from "./tasks.controller";
import { operatorsController } from "./operators.controller";

const router = Router();

// ========== OPERATORS ROUTES ==========
router.get("/operators", (req, res) => operatorsController.getAll(req, res));
router.get("/operators/:id", (req, res) => operatorsController.getById(req, res));
router.post("/operators", (req, res) => operatorsController.create(req, res));
router.patch("/operators/:id", (req, res) => operatorsController.update(req, res));
router.delete("/operators/:id", (req, res) => operatorsController.delete(req, res));
router.patch("/operators/:id/deactivate", (req, res) => operatorsController.deactivate(req, res));
router.patch("/operators/:id/reactivate", (req, res) => operatorsController.reactivate(req, res));

// ========== TASKS ROUTES ==========
// General tasks endpoints
router.get("/tasks", (req, res) => tasksController.getAll(req, res));
router.get("/tasks/:id", (req, res) => tasksController.getById(req, res));
router.patch("/tasks/:id", (req, res) => tasksController.update(req, res));
router.delete("/tasks/:id", (req, res) => tasksController.delete(req, res));
router.post("/tasks/:id/complete", (req, res) => tasksController.complete(req, res));

// Task baskets
router.get("/tasks/:id/baskets", (req, res) => tasksController.getTaskBaskets(req, res));

// Task assignments
router.post("/tasks/:id/assign", (req, res) => tasksController.assignOperators(req, res));
router.patch("/tasks/:taskId/assignments/:assignmentId", (req, res) => tasksController.updateAssignment(req, res));

// Selection-specific tasks
router.get("/selections/:selectionId/tasks", (req, res) => tasksController.getBySelectionId(req, res));
router.post("/selections/:selectionId/tasks", (req, res) => tasksController.create(req, res));

// External app endpoints - get tasks for operator
router.get("/operators/:operatorId/tasks", (req, res) => tasksController.getTasksForOperator(req, res));

export default router;
