import { Router, Request, Response } from "express";
import { growthProjectionService } from "./growth-projection.service";
import { db } from "../../../db";
import { hatcheryArrivals, projectionMortalityRates, productionTargets } from "../../../../shared/schema";
import { eq, and, inArray } from "drizzle-orm";

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

    const validRates = rates.filter((r: any) => r.sizeName && r.month && r.monthlyPercentage !== undefined);
    if (validRates.length === 0) {
      return res.json([]);
    }

    await db.delete(projectionMortalityRates);

    const batchSize = 50;
    const results = [];
    for (let i = 0; i < validRates.length; i += batchSize) {
      const batch = validRates.slice(i, i + batchSize).map((r: any) => ({
        sizeName: r.sizeName,
        month: r.month,
        monthlyPercentage: r.monthlyPercentage,
        notes: r.notes || null,
        updatedAt: new Date()
      }));
      const inserted = await db.insert(projectionMortalityRates).values(batch).returning();
      results.push(...inserted);
    }

    res.json(results);
  } catch (error) {
    console.error("Errore salvataggio bulk tassi mortalità:", error);
    res.status(500).json({ error: "Errore nel salvataggio bulk" });
  }
});

router.get("/production-targets", async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const targets = await db.select().from(productionTargets)
      .where(eq(productionTargets.year, year));
    res.json(targets);
  } catch (error) {
    console.error("Errore recupero production targets:", error);
    res.status(500).json({ error: "Errore nel recupero dei target" });
  }
});

router.post("/production-targets", async (req: Request, res: Response) => {
  try {
    const { year, month, sizeCategory, targetAnimals } = req.body;
    if (!year || !month || !sizeCategory || targetAnimals === undefined) {
      return res.status(400).json({ error: "Campi obbligatori mancanti" });
    }

    const existing = await db.select().from(productionTargets)
      .where(and(
        eq(productionTargets.year, year),
        eq(productionTargets.month, month),
        eq(productionTargets.sizeCategory, sizeCategory)
      ));

    if (existing.length > 0) {
      if (targetAnimals === 0) {
        await db.delete(productionTargets).where(eq(productionTargets.id, existing[0].id));
        return res.json({ deleted: true });
      }
      const updated = await db.update(productionTargets)
        .set({ targetAnimals, updatedAt: new Date() })
        .where(eq(productionTargets.id, existing[0].id))
        .returning();
      return res.json(updated[0]);
    }

    if (targetAnimals === 0) {
      return res.json({ skipped: true });
    }

    const inserted = await db.insert(productionTargets).values({
      year, month, sizeCategory, targetAnimals
    }).returning();
    res.json(inserted[0]);
  } catch (error) {
    console.error("Errore salvataggio production target:", error);
    res.status(500).json({ error: "Errore nel salvataggio del target" });
  }
});

export default router;
