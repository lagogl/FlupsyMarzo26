import { Router, Request, Response } from "express";
import { growthProjectionService } from "./growth-projection.service";
import { db } from "../../../db";
import { hatcheryArrivals } from "../../../../shared/schema";
import { eq, and } from "drizzle-orm";

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

router.get("/hatchery-arrivals", async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const arrivals = await db.select().from(hatcheryArrivals).where(eq(hatcheryArrivals.year, year));
    res.json(arrivals);
  } catch (error) {
    console.error("Errore lettura arrivi schiuditoio:", error);
    res.status(500).json({ error: "Errore nel recupero dati schiuditoio" });
  }
});

router.post("/hatchery-arrivals", async (req: Request, res: Response) => {
  try {
    const { year, month, quantity, sizeCategory, notes } = req.body;
    if (!year || !month || !quantity) {
      return res.status(400).json({ error: "Anno, mese e quantità sono obbligatori" });
    }

    const existing = await db.select().from(hatcheryArrivals)
      .where(and(
        eq(hatcheryArrivals.year, year),
        eq(hatcheryArrivals.month, month),
        eq(hatcheryArrivals.sizeCategory, sizeCategory || 'TP-300')
      ));

    if (existing.length > 0) {
      const updated = await db.update(hatcheryArrivals)
        .set({ quantity, notes, updatedAt: new Date() })
        .where(eq(hatcheryArrivals.id, existing[0].id))
        .returning();
      return res.json(updated[0]);
    }

    const inserted = await db.insert(hatcheryArrivals).values({
      year,
      month,
      quantity,
      sizeCategory: sizeCategory || 'TP-300',
      notes
    }).returning();
    res.json(inserted[0]);
  } catch (error) {
    console.error("Errore salvataggio arrivo schiuditoio:", error);
    res.status(500).json({ error: "Errore nel salvataggio dati schiuditoio" });
  }
});

router.delete("/hatchery-arrivals/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(hatcheryArrivals).where(eq(hatcheryArrivals.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error("Errore eliminazione arrivo schiuditoio:", error);
    res.status(500).json({ error: "Errore nell'eliminazione" });
  }
});

export default router;
