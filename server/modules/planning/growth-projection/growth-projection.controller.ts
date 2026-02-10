import { Router, Request, Response } from "express";
import { growthProjectionService } from "./growth-projection.service";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const targetSize = (req.query.targetSize as string) || 'TP-3000';
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const result = await growthProjectionService.project(targetSize, year);
    res.json(result);
  } catch (error) {
    console.error("Errore proiezione crescita:", error);
    res.status(500).json({ error: "Errore nel calcolo della proiezione crescita" });
  }
});

export default router;
