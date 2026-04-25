/**
 * Route per il modulo cestelli
 */

import { Router, Request, Response } from 'express';
import { basketsController } from './baskets.controller';
import { db } from '../../../db';
import { sql } from 'drizzle-orm';

const router = Router();

// Route esportazione
router.post('/export-excel', (req, res) => basketsController.exportToExcel(req, res));

// Route di ricerca e query
router.get('/find-by-nfc', (req, res) => basketsController.findByNfc(req, res));
router.get('/with-flupsy-details', (req, res) => basketsController.getBasketsWithFlupsyDetails(req, res));
router.get('/details/:id?', (req, res) => basketsController.getBasketDetails(req, res));
router.get('/check-exists', (req, res) => basketsController.checkExists(req, res));
router.get('/check-position', (req, res) => basketsController.checkPosition(req, res));
router.get('/next-number/:flupsyId', (req, res) => basketsController.getNextNumber(req, res));
router.get('/next-position/:flupsyId', (req, res) => basketsController.getNextPosition(req, res));
router.get('/available', (req, res) => basketsController.getAvailable(req, res));
router.get('/latest-operations', (req, res) => basketsController.getLatestOperations(req, res));
router.get('/next-rfid-uhf-code', (req, res) => basketsController.getNextRfidUhfCode(req, res));
router.get('/expected-sizes', (req, res) => basketsController.getExpectedSizes(req, res));

// Morti cumulativi per FLUPSY: somma di tutti i dead_count da tutte le operazioni
router.get('/total-deaths-by-flupsy', async (req: Request, res: Response) => {
  try {
    const result = await db.execute(sql`
      SELECT
        b.flupsy_id,
        COALESCE(SUM(o.dead_count), 0)::bigint AS total_dead
      FROM baskets b
      JOIN operations o ON o.basket_id = b.id
      WHERE o.dead_count IS NOT NULL
        AND o.dead_count > 0
        AND o.type NOT IN ('vendita', 'cessazione', 'pulizia', 'vagliatura')
      GROUP BY b.flupsy_id
    `);
    const map: Record<number, number> = {};
    for (const row of result.rows as any[]) {
      map[row.flupsy_id] = Number(row.total_dead);
    }
    res.json({ success: true, data: map });
  } catch (err: any) {
    console.error('Errore total-deaths-by-flupsy:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Trend giornaliero: snapshot di ieri per confronto con oggi
router.get('/daily-trend', async (req: Request, res: Response) => {
  try {
    const result = await db.execute(sql`
      WITH yesterday_snapshot AS (
        SELECT DISTINCT ON (o.basket_id)
          o.basket_id,
          o.animal_count,
          o.mortality_rate,
          COALESCE(o.measurement_animals_per_kg, o.animals_per_kg) AS apk
        FROM operations o
        JOIN baskets b ON b.id = o.basket_id
        WHERE b.state = 'active'
          AND b.current_cycle_id IS NOT NULL
          AND o.date < CURRENT_DATE
          AND o.type NOT IN ('vendita', 'cessazione', 'pulizia')
        ORDER BY o.basket_id, o.date DESC, o.id DESC
      )
      SELECT
        COALESCE(SUM(animal_count), 0)::bigint                                             AS yesterday_animals,
        AVG(mortality_rate)                                                                 AS yesterday_avg_mort,
        COALESCE(SUM(CASE WHEN apk <= 29000 THEN animal_count ELSE 0 END), 0)::bigint     AS yesterday_sellable
      FROM yesterday_snapshot
    `);
    const row = result.rows[0] as any;
    res.json({
      success: true,
      data: {
        yesterdayAnimals:   Number(row?.yesterday_animals  ?? 0),
        yesterdayAvgMort:   row?.yesterday_avg_mort != null ? parseFloat(row.yesterday_avg_mort) : null,
        yesterdaySellable:  Number(row?.yesterday_sellable ?? 0),
      }
    });
  } catch (err: any) {
    console.error('Errore daily-trend:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Route CRUD principali
router.get('/', (req, res) => basketsController.getBaskets(req, res));
router.get('/:id', (req, res) => basketsController.getBasket(req, res));
router.post('/', (req, res) => basketsController.createBasket(req, res));
router.patch('/:id', (req, res) => basketsController.updateBasket(req, res));
router.delete('/:id', (req, res) => basketsController.deleteBasket(req, res));

// Route di azioni specifiche
router.post('/:id/move', (req, res) => basketsController.moveBasket(req, res));
router.post('/switch-positions', (req, res) => basketsController.switchPositions(req, res));
router.post('/fix-null-rows', (req, res) => basketsController.fixNullRows(req, res));

// Route RFID UHF
router.post('/:id/rfid-uhf', (req, res) => basketsController.assignRfidUhf(req, res));
router.delete('/:id/rfid-uhf', (req, res) => basketsController.removeRfidUhf(req, res));

export default router;