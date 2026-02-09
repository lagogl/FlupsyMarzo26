import { Router, Request, Response } from "express";
import { orderCoverageService } from "./order-coverage.service";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const months = parseInt(req.query.months as string) || 12;

    const result = await orderCoverageService.simulate(year, months);
    res.json(result);
  } catch (error) {
    console.error("Errore verifica copertura:", error);
    res.status(500).json({ error: "Errore nel calcolo della copertura ordini" });
  }
});

export default router;
