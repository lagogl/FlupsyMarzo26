import { Router, Request, Response } from "express";
import { growthProjectionService } from "./growth-projection.service";
import { db } from "../../../db";
import { hatcheryArrivals, projectionMortalityRates } from "../../../../shared/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const targetSize = (req.query.targetSize as string) || 'TP-3000';
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    let mortalityPercent: number | undefined = undefined;
    if (req.query.mortalityPercent !== undefined) {
      const parsed = parseFloat(req.query.mortalityPercent as string);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        mortalityPercent = parsed;
      }
    }

    const result = await growthProjectionService.project(targetSize, year, mortalityPercent);
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

router.get("/mortality-rates", async (_req: Request, res: Response) => {
  try {
    const rates = await db.select().from(projectionMortalityRates);
    res.json(rates);
  } catch (error) {
    console.error("Errore lettura tassi mortalità:", error);
    res.status(500).json({ error: "Errore nel recupero tassi mortalità" });
  }
});

router.put("/mortality-rates", async (req: Request, res: Response) => {
  try {
    const { sizeName, month, monthlyPercentage, notes } = req.body;
    if (!sizeName || !month || monthlyPercentage === undefined) {
      return res.status(400).json({ error: "Taglia, mese e percentuale sono obbligatori" });
    }

    const existing = await db.select().from(projectionMortalityRates)
      .where(and(
        eq(projectionMortalityRates.sizeName, sizeName),
        eq(projectionMortalityRates.month, month)
      ));

    if (existing.length > 0) {
      const updated = await db.update(projectionMortalityRates)
        .set({ monthlyPercentage, notes, updatedAt: new Date() })
        .where(eq(projectionMortalityRates.id, existing[0].id))
        .returning();
      return res.json(updated[0]);
    }

    const inserted = await db.insert(projectionMortalityRates).values({
      sizeName,
      month,
      monthlyPercentage,
      notes
    }).returning();
    res.json(inserted[0]);
  } catch (error) {
    console.error("Errore salvataggio tasso mortalità:", error);
    res.status(500).json({ error: "Errore nel salvataggio tasso mortalità" });
  }
});

router.put("/mortality-rates/bulk", async (req: Request, res: Response) => {
  try {
    const { rates } = req.body;
    if (!Array.isArray(rates)) {
      return res.status(400).json({ error: "Formato dati non valido" });
    }

    const results = [];
    for (const rate of rates) {
      const { sizeName, month, monthlyPercentage, notes } = rate;
      if (!sizeName || !month || monthlyPercentage === undefined) continue;

      const existing = await db.select().from(projectionMortalityRates)
        .where(and(
          eq(projectionMortalityRates.sizeName, sizeName),
          eq(projectionMortalityRates.month, month)
        ));

      if (existing.length > 0) {
        const updated = await db.update(projectionMortalityRates)
          .set({ monthlyPercentage, notes, updatedAt: new Date() })
          .where(eq(projectionMortalityRates.id, existing[0].id))
          .returning();
        results.push(updated[0]);
      } else {
        const inserted = await db.insert(projectionMortalityRates).values({
          sizeName, month, monthlyPercentage, notes
        }).returning();
        results.push(inserted[0]);
      }
    }

    res.json(results);
  } catch (error) {
    console.error("Errore salvataggio bulk tassi mortalità:", error);
    res.status(500).json({ error: "Errore nel salvataggio bulk" });
  }
});

export default router;
