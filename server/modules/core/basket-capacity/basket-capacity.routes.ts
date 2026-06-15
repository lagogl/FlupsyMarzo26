import { Router } from "express";
import { basketCapacityController } from "./basket-capacity.controller";

const router = Router();

// GET previsione raggiungimento peso massimo (Fase 1)
router.get("/forecast", (req, res) => basketCapacityController.forecast(req, res));

// GET capacità per taglia + suggerimenti storici
router.get("/", (req, res) => basketCapacityController.getAll(req, res));

// POST salva (upsert) capacità per taglia
router.post("/", (req, res) => basketCapacityController.save(req, res));

export default router;
