import { Router } from "express";
import { basketCapacityController } from "./basket-capacity.controller";

const router = Router();

// GET capacità per taglia + suggerimenti storici
router.get("/", (req, res) => basketCapacityController.getAll(req, res));

// POST salva (upsert) capacità per taglia
router.post("/", (req, res) => basketCapacityController.save(req, res));

export default router;
