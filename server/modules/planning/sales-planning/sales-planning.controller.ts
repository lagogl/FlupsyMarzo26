import { Router, Request, Response } from "express";
import { salesPlanningService, SalesPlanningMode } from "./sales-planning.service";
import { db } from "../../../db";
import { salesPriceList, salesCashTargets } from "../../../../shared/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

// === PIANO VENDITE ===
router.get("/", async (req: Request, res: Response) => {
  try {
    const validModes: SalesPlanningMode[] = ['cassa', 'ricavo', 'bilanciato'];
    const rawMode = (req.query.mode as string) || 'bilanciato';
    const mode: SalesPlanningMode = validModes.includes(rawMode as SalesPlanningMode)
      ? (rawMode as SalesPlanningMode) : 'bilanciato';

    let year: number | undefined;
    if (req.query.year !== undefined) {
      const y = parseInt(req.query.year as string);
      if (!isNaN(y) && y >= 2020 && y <= 2100) year = y;
    }
    let startMonth: number | undefined;
    if (req.query.startMonth !== undefined) {
      const m = parseInt(req.query.startMonth as string);
      if (!isNaN(m) && m >= 1 && m <= 12) startMonth = m;
    }
    let monthsHorizon: number | undefined;
    if (req.query.monthsHorizon !== undefined) {
      const h = parseInt(req.query.monthsHorizon as string);
      if (!isNaN(h) && h >= 6 && h <= 36) monthsHorizon = h;
    }
    let mortalityPercent: number | undefined;
    if (req.query.mortalityPercent !== undefined) {
      const m = parseFloat(req.query.mortalityPercent as string);
      if (!isNaN(m) && m >= 0 && m <= 100) mortalityPercent = m;
    }

    const result = await salesPlanningService.plan({ year, startMonth, monthsHorizon, mode, mortalityPercent });
    res.json(result);
  } catch (error) {
    console.error("Errore pianificazione vendite:", error);
    res.status(500).json({ error: "Errore nel calcolo della pianificazione vendite" });
  }
});

// === LISTINO PREZZI ===
router.get("/price-list", async (_req: Request, res: Response) => {
  try {
    const rows = await db.select().from(salesPriceList);
    res.json(rows);
  } catch (error) {
    console.error("Errore lettura listino:", error);
    res.status(500).json({ error: "Errore nel recupero listino prezzi" });
  }
});

router.put("/price-list", async (req: Request, res: Response) => {
  try {
    const { sizeCode, pricePerKg, notes } = req.body;
    if (!sizeCode || pricePerKg === undefined || pricePerKg === null) {
      return res.status(400).json({ error: "sizeCode e pricePerKg sono obbligatori" });
    }
    const existing = await db.select().from(salesPriceList).where(eq(salesPriceList.sizeCode, sizeCode));
    if (existing.length > 0) {
      const updated = await db.update(salesPriceList)
        .set({ pricePerKg, notes, updatedAt: new Date() })
        .where(eq(salesPriceList.id, existing[0].id))
        .returning();
      return res.json(updated[0]);
    }
    const inserted = await db.insert(salesPriceList).values({ sizeCode, pricePerKg, notes }).returning();
    res.json(inserted[0]);
  } catch (error) {
    console.error("Errore salvataggio listino:", error);
    res.status(500).json({ error: "Errore nel salvataggio del listino" });
  }
});

router.delete("/price-list/:sizeCode", async (req: Request, res: Response) => {
  try {
    const sizeCode = req.params.sizeCode;
    await db.delete(salesPriceList).where(eq(salesPriceList.sizeCode, sizeCode));
    res.json({ success: true });
  } catch (error) {
    console.error("Errore eliminazione voce listino:", error);
    res.status(500).json({ error: "Errore nell'eliminazione" });
  }
});

// === BUDGET CASSA ===
router.get("/cash-targets", async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const rows = await db.select().from(salesCashTargets).where(eq(salesCashTargets.year, year));
    res.json(rows);
  } catch (error) {
    console.error("Errore lettura budget cassa:", error);
    res.status(500).json({ error: "Errore nel recupero del budget cassa" });
  }
});

router.put("/cash-targets", async (req: Request, res: Response) => {
  try {
    const { year, month, minRevenue } = req.body;
    if (!year || !month || minRevenue === undefined || minRevenue === null) {
      return res.status(400).json({ error: "year, month e minRevenue sono obbligatori" });
    }
    const existing = await db.select().from(salesCashTargets)
      .where(and(eq(salesCashTargets.year, year), eq(salesCashTargets.month, month)));
    if (existing.length > 0) {
      if (minRevenue === 0) {
        await db.delete(salesCashTargets).where(eq(salesCashTargets.id, existing[0].id));
        return res.json({ deleted: true });
      }
      const updated = await db.update(salesCashTargets)
        .set({ minRevenue, updatedAt: new Date() })
        .where(eq(salesCashTargets.id, existing[0].id))
        .returning();
      return res.json(updated[0]);
    }
    if (minRevenue === 0) return res.json({ skipped: true });
    const inserted = await db.insert(salesCashTargets).values({ year, month, minRevenue }).returning();
    res.json(inserted[0]);
  } catch (error) {
    console.error("Errore salvataggio budget cassa:", error);
    res.status(500).json({ error: "Errore nel salvataggio del budget" });
  }
});

export default router;
