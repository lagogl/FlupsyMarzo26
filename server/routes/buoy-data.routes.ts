import { Router, Request, Response } from 'express';
import { getAllBuoyStations, invalidateBuoyCache } from '../services/buoy-data.service';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const data = await getAllBuoyStations();
    res.json({
      success: true,
      arpaeCount: data.arpae.length,
      arpavCount: data.arpav.length,
      stations: [...data.arpae, ...data.arpav]
    });
  } catch (error) {
    console.error('[BuoyData API] Errore:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.post('/refresh', async (_req: Request, res: Response) => {
  try {
    invalidateBuoyCache();
    const data = await getAllBuoyStations();
    res.json({
      success: true,
      arpaeCount: data.arpae.length,
      arpavCount: data.arpav.length,
      stations: [...data.arpae, ...data.arpav]
    });
  } catch (error) {
    console.error('[BuoyData API] Errore refresh:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;
