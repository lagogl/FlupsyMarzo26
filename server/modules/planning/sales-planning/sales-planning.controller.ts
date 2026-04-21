import { Router, Request, Response } from "express";
import { salesPlanningService, SalesPlanningMode } from "./sales-planning.service";
import { salesPlanningMilpService } from "./sales-planning.milp";
import { db } from "../../../db";
import { salesPriceList, salesCashTargets, hatcheryArrivals, projectionMortalityRates } from "../../../../shared/schema";
import { eq, and, gte } from "drizzle-orm";
import { productionForecastService, ProductionForecastService } from "../../../ai/production-forecast-service";

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

    const validEngines = ['greedy', 'lp'] as const;
    type Engine = typeof validEngines[number];
    const rawEngine = (req.query.engine as string) || 'greedy';
    const engine: Engine = (validEngines as readonly string[]).includes(rawEngine)
      ? (rawEngine as Engine) : 'greedy';

    if (engine === 'lp') {
      const result = await salesPlanningMilpService.plan({ year, startMonth, monthsHorizon, mode, mortalityPercent });
      res.json({ ...result, engine: 'lp', mode, year: year || new Date().getFullYear(), startMonth: startMonth || (new Date().getMonth() + 1), monthsHorizon: monthsHorizon || 12, generatedAt: new Date().toISOString() });
    } else {
      const result = await salesPlanningService.plan({ year, startMonth, monthsHorizon, mode, mortalityPercent });
      res.json({ ...result, engine: 'greedy' });
    }
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
    const { sizeCode, pricePerAnimal, notes } = req.body;
    if (!sizeCode || pricePerAnimal === undefined || pricePerAnimal === null) {
      return res.status(400).json({ error: "sizeCode e pricePerAnimal sono obbligatori" });
    }
    const existing = await db.select().from(salesPriceList).where(eq(salesPriceList.sizeCode, sizeCode));
    if (existing.length > 0) {
      const updated = await db.update(salesPriceList)
        .set({ pricePerAnimal, notes, updatedAt: new Date() })
        .where(eq(salesPriceList.id, existing[0].id))
        .returning();
      return res.json(updated[0]);
    }
    const inserted = await db.insert(salesPriceList).values({ sizeCode, pricePerAnimal, notes }).returning();
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

// === DATI DI INPUT ===
router.get("/input-data", async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const now = new Date();

    const [basketInventory, sgrLookup, mortalityRows, priceRows, cashRows, hatcheryRows, orders] = await Promise.all([
      productionForecastService.getBasketLevelInventory(),
      productionForecastService.getSgrLookup(),
      db.select().from(projectionMortalityRates),
      db.select().from(salesPriceList),
      db.select().from(salesCashTargets).where(eq(salesCashTargets.year, year)),
      db.select().from(hatcheryArrivals).where(gte(hatcheryArrivals.year, year)),
      productionForecastService.getOrdersByMonthAndSize(year),
    ]);

    // Arricchisci cestelli con la taglia corrente
    const basketsWithSize = basketInventory.map(b => ({
      basketId: b.basketId,
      animalCount: b.animalCount,
      animalsPerKg: Math.round(b.animalsPerKg),
      sizeCode: productionForecastService.mapAnimalsPerKgToSaleSize(b.animalsPerKg),
      weightGrams: Math.round(1000 / b.animalsPerKg * 1000),
    }));

    // Raggruppa cestelli per taglia
    const bySize: Record<string, { count: number; animals: number }> = {};
    for (const b of basketsWithSize) {
      if (!bySize[b.sizeCode]) bySize[b.sizeCode] = { count: 0, animals: 0 };
      bySize[b.sizeCode].count++;
      bySize[b.sizeCode].animals += b.animalCount;
    }

    // SGR: la chiave è "{mese_italiano}_{sizeId}" e il valore è già % giornaliero
    // Mappa sizeId → nome TP (da tabella sizes)
    const SIZE_ID_TO_TP: Record<number, string> = {
      27:'TP-10000', 26:'TP-9000', 25:'TP-8000', 24:'TP-7000', 23:'TP-6000',
      22:'TP-5500',  21:'TP-5000', 20:'TP-4500', 19:'TP-4000', 18:'TP-3500',
      17:'TP-3000',  28:'TP-2800', 16:'TP-2500', 15:'TP-2000', 14:'TP-1900',
      13:'TP-1800',  12:'TP-1500', 11:'TP-1260', 10:'TP-1140',  9:'TP-1000',
       8:'TP-800',    7:'TP-700',   6:'TP-600',   1:'TP-500',   5:'TP-450',
      29:'TP-350',    4:'TP-300',   3:'TP-250',   2:'TP-180',
    };
    const MONTHS_LOWER = ['gennaio','febbraio','marzo','aprile','maggio','giugno',
                          'luglio','agosto','settembre','ottobre','novembre','dicembre'];
    const MONTHS_SHORT  = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];

    // Estrai tutti i sizeId presenti nel lookup, in ordine canonico (TP più grande → piccola)
    const sizeIdsInData = new Set<number>();
    for (const key of Object.keys(sgrLookup)) {
      const parts = key.split('_');
      const sizeId = parseInt(parts[parts.length - 1]);
      if (!isNaN(sizeId)) sizeIdsInData.add(sizeId);
    }
    // Ordine canonico SALE_SIZES (indice più basso = più grande)
    const canonicalOrder = [27,26,25,24,23,22,21,20,19,18,17,28,16,15,14,13,12,11,10,9,8,7,6,1,5,29,4,3,2];
    const sgrSizeIds = canonicalOrder.filter(id => sizeIdsInData.has(id));
    const sgrSizes = sgrSizeIds.map(id => SIZE_ID_TO_TP[id] || `ID-${id}`);

    const sgrTable: Array<{ month: string; [key: string]: string | number }> = [];
    for (let m = 0; m < 12; m++) {
      const row: Record<string, string | number> = { month: MONTHS_SHORT[m] };
      for (let si = 0; si < sgrSizeIds.length; si++) {
        const key = `${MONTHS_LOWER[m]}_${sgrSizeIds[si]}`;
        const v = sgrLookup[key];
        row[sgrSizes[si]] = v !== undefined && v !== null ? parseFloat(v.toFixed(3)) : 0;
      }
      sgrTable.push(row as any);
    }

    // Mortalità raggrupata per taglia
    const mortalityBySize: Record<string, Record<number, number>> = {};
    for (const row of mortalityRows) {
      if (!mortalityBySize[row.sizeName]) mortalityBySize[row.sizeName] = {};
      mortalityBySize[row.sizeName][row.month] = row.monthlyPercentage;
    }

    // Ordini raggruppati — ordinati per mese numerico, poi per taglia
    const SALE_SIZES_ORDER = ProductionForecastService.SALE_SIZES;
    const orderSummary: Array<{ monthNum: number; month: string; size: string; animals: number }> = [];
    for (const [monthStr, sizeMap] of Object.entries(orders)) {
      for (const [size, animals] of Object.entries(sizeMap as Record<string, number>)) {
        if (animals > 0) {
          const monthNum = parseInt(monthStr);
          const m = monthNum - 1;
          orderSummary.push({ monthNum, month: MONTHS_SHORT[m] || monthStr, size, animals });
        }
      }
    }
    orderSummary.sort((a, b) => {
      if (a.monthNum !== b.monthNum) return a.monthNum - b.monthNum;
      const ia = SALE_SIZES_ORDER.indexOf(a.size);
      const ib = SALE_SIZES_ORDER.indexOf(b.size);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

    // Schiuditoio ordinato per anno poi mese
    const hatcherySorted = [...hatcheryRows].sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.month - b.month
    );

    res.json({
      generatedAt: now.toISOString(),
      year,
      inventory: {
        baskets: basketsWithSize,
        totalBaskets: basketsWithSize.length,
        totalAnimals: basketsWithSize.reduce((s, b) => s + b.animalCount, 0),
        bySize,
      },
      hatchery: hatcherySorted.map(h => ({
        year: h.year,
        month: h.month,
        monthName: MONTHS_SHORT[h.month - 1],
        quantity: h.quantity,
        actualQuantity: h.actualQuantity,
        notes: h.notes,
      })),
      sgr: { sgrSizes, sgrTable },
      mortality: mortalityBySize,
      priceList: priceRows,
      cashTargets: cashRows,
      orders: orderSummary,
    });
  } catch (error) {
    console.error("Errore dati di input pianificazione:", error);
    res.status(500).json({ error: "Errore nel caricamento dei dati di input" });
  }
});

export default router;
