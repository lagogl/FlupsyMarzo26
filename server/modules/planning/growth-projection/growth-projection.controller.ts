import { Router, Request, Response } from "express";
import { growthProjectionService } from "./growth-projection.service";
import { db } from "../../../db";
import { hatcheryArrivals, projectionMortalityRates, productionTargets, lots } from "../../../../shared/schema";
import { eq, and, inArray, gte, lte, sql } from "drizzle-orm";

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
    let startMonth: number | undefined = undefined;
    if (req.query.startMonth !== undefined) {
      const parsed = parseInt(req.query.startMonth as string);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 12) {
        startMonth = parsed;
      }
    }

    const result = await growthProjectionService.project(targetSize, year, mortalityPercent, startMonth);
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

// Calcola il reale di arrivi per un dato (year, month) sommando tutti i lotti
// con arrival_date in quel mese. Tutti i lotti sono considerati "da schiuditoio".
router.get("/hatchery-arrivals/calculate-actual", async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string);
    const month = parseInt(req.query.month as string);
    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({ error: "Anno e mese (1-12) sono obbligatori" });
    }

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endMonth0 = month; // mese successivo (1-based si traduce in 0-based mese giusto)
    const endYear = month === 12 ? year + 1 : year;
    const endMonth1 = month === 12 ? 1 : month + 1;
    const endDate = `${endYear}-${String(endMonth1).padStart(2, '0')}-01`;

    const rows = await db.select({
      id: lots.id,
      arrivalDate: lots.arrivalDate,
      supplier: lots.supplier,
      animalCount: lots.animalCount,
    })
      .from(lots)
      .where(and(
        gte(lots.arrivalDate, startDate),
        sql`${lots.arrivalDate} < ${endDate}`,
      ));

    const totalAnimals = rows.reduce((s, r) => s + (r.animalCount || 0), 0);
    res.json({
      year,
      month,
      totalAnimals,
      lotCount: rows.length,
      lots: rows,
    });
  } catch (error) {
    console.error("Errore calcolo reale arrivi schiuditoio:", error);
    res.status(500).json({ error: "Errore nel calcolo dei dati reali" });
  }
});

// Salva il reale consolidato per (year, month, sizeCategory).
// Crea il record se non esiste (con previsione = 0).
router.post("/hatchery-arrivals/actual", async (req: Request, res: Response) => {
  try {
    const { year, month, actualQuantity, sizeCategory } = req.body;
    if (!year || !month || actualQuantity === undefined || actualQuantity === null) {
      return res.status(400).json({ error: "Anno, mese e quantità reale sono obbligatori" });
    }
    const sz = sizeCategory || 'TP-300';

    const existing = await db.select().from(hatcheryArrivals)
      .where(and(
        eq(hatcheryArrivals.year, year),
        eq(hatcheryArrivals.month, month),
        eq(hatcheryArrivals.sizeCategory, sz)
      ));

    if (existing.length > 0) {
      const updated = await db.update(hatcheryArrivals)
        .set({
          actualQuantity,
          actualLockedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(hatcheryArrivals.id, existing[0].id))
        .returning();
      return res.json(updated[0]);
    }

    const inserted = await db.insert(hatcheryArrivals).values({
      year,
      month,
      quantity: 0, // nessuna previsione registrata
      actualQuantity,
      actualLockedAt: new Date(),
      sizeCategory: sz,
    }).returning();
    res.json(inserted[0]);
  } catch (error) {
    console.error("Errore salvataggio reale arrivi schiuditoio:", error);
    res.status(500).json({ error: "Errore nel salvataggio del reale" });
  }
});

// Rimuove il consolidamento del reale (torna a usare la previsione)
router.delete("/hatchery-arrivals/actual/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await db.update(hatcheryArrivals)
      .set({ actualQuantity: null, actualLockedAt: null, updatedAt: new Date() })
      .where(eq(hatcheryArrivals.id, id))
      .returning();
    res.json(updated[0] || { success: true });
  } catch (error) {
    console.error("Errore rimozione reale arrivi:", error);
    res.status(500).json({ error: "Errore nella rimozione del reale" });
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
