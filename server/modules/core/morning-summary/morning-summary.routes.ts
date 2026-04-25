import { Router, Request, Response } from "express";
import { db } from "../../../db";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/morning-summary", async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // 1. Animali entrati: somma animalCount da lotti con arrivalDate >= 2025-12-01
    const lotsResult = await db.execute(sql`
      SELECT COALESCE(SUM(animal_count), 0) AS totale_entrati
      FROM lots
      WHERE arrival_date >= '2025-12-01'
    `);
    const animaliEntrati = parseInt((lotsResult.rows[0] as any)?.totale_entrati) || 0;

    // 2. Animali venduti: somma totalAnimals da advanced_sales
    const salesResult = await db.execute(sql`
      SELECT COALESCE(SUM(total_animals), 0) AS totale_venduti
      FROM advanced_sales
    `);
    const animaliVenduti = parseInt((salesResult.rows[0] as any)?.totale_venduti) || 0;

    // 3. Animali in impianto: ultima operazione per ogni cestello attivo
    const giacenzaResult = await db.execute(sql`
      WITH latest_ops AS (
        SELECT DISTINCT ON (o.basket_id)
          o.basket_id,
          o.animal_count
        FROM operations o
        JOIN baskets b ON b.id = o.basket_id
        WHERE b.state = 'active'
          AND o.type NOT IN ('vendita', 'cessazione', 'pulizia')
        ORDER BY o.basket_id, o.date DESC, o.id DESC
      )
      SELECT COALESCE(SUM(animal_count), 0) AS totale_impianto
      FROM latest_ops
    `);
    const animaliInImpianto = parseInt((giacenzaResult.rows[0] as any)?.totale_impianto) || 0;

    // 4. Morti/spariti = entrati - venduti - in impianto
    const animaliMortiOSpariti = animaliEntrati - animaliVenduti - animaliInImpianto;

    res.json({
      success: true,
      data: {
        animaliEntrati,
        animaliVenduti,
        animaliInImpianto,
        animaliMortiOSpariti,
        generatedAt: today
      }
    });
  } catch (error: any) {
    console.error("❌ ERRORE MORNING SUMMARY:", error);
    res.status(500).json({ success: false, error: "Errore interno nel calcolo del riepilogo mattutino" });
  }
});

export default router;
