import express from 'express';
import type { Request, Response } from 'express';
import { getActiveBaskets, getAvailableBaskets, executeTransfer, balancedRound } from './basket-transfer.service';

const router = express.Router();

router.get('/source-baskets', async (_req: Request, res: Response) => {
  try {
    const result = await getActiveBaskets();
    res.json({ success: true, baskets: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/destination-baskets', async (_req: Request, res: Response) => {
  try {
    const result = await getAvailableBaskets();
    res.json({ success: true, baskets: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/preview', async (req: Request, res: Response) => {
  try {
    const { animalCount, destinationCount } = req.body;
    if (!animalCount || !destinationCount || destinationCount < 1) {
      return res.status(400).json({ success: false, error: 'Parametri mancanti' });
    }
    const distribution = balancedRound(Number(animalCount), Number(destinationCount));
    res.json({ success: true, distribution });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { sourceBasketId, date, mode, destinations } = req.body;

    if (!sourceBasketId || !date || !mode || !destinations?.length) {
      return res.status(400).json({
        success: false,
        error: 'Campi obbligatori mancanti: sourceBasketId, date, mode, destinations'
      });
    }

    if (!['total', 'partial'].includes(mode)) {
      return res.status(400).json({ success: false, error: 'mode deve essere "total" o "partial"' });
    }

    for (const d of destinations) {
      if (!d.basketId || !d.animalCount || d.animalCount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Ogni destinazione deve avere basketId e animalCount > 0'
        });
      }
    }

    const result = await executeTransfer({ sourceBasketId, date, mode, destinations });
    res.status(201).json(result);
  } catch (error: any) {
    console.error('❌ TRASFERIMENTO: Errore durante esecuzione:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
