import { Router, Request, Response } from 'express';
import { marineDataService } from '../services/marine-data.service';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

router.get('/latest', async (req: Request, res: Response) => {
  try {
    const realData = await marineDataService.getLatestRealData();
    
    if (realData) {
      res.json({
        success: true,
        data: {
          sst: realData.sst,
          waveHeight: realData.waveHeight,
          wavePeriod: realData.wavePeriod,
          waveDirection: realData.waveDirection,
          currentVelocity: realData.currentVelocity,
          currentDirection: realData.currentDirection,
          chl: realData.chlorophyll,
          salinity: realData.salinity,
          trend: 'stable',
          quality: realData.sst ? (realData.sst < 15 ? 'buona' : 'media') : 'n/a',
          history: realData.history || [],
          recordedAt: realData.recordedAt,
          source: realData.source,
          sourceUrl: realData.sourceUrl,
          note: realData.note,
          isRealData: true,
        }
      });
    } else {
      res.status(503).json({ 
        success: false, 
        error: 'Impossibile ottenere dati reali. API Open-Meteo Marine non disponibile.',
        isRealData: false
      });
    }
  } catch (error) {
    console.error('[MarineData API] Error:', error);
    res.status(500).json({ success: false, error: String(error), isRealData: false });
  }
});

router.get('/history', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const data = await marineDataService.getHistoricalData(days);
    const realData = data.filter(r => r.source === 'open-meteo-real');
    res.json({ success: true, data: realData, totalRecords: realData.length });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.post('/fetch', async (req: Request, res: Response) => {
  try {
    const result = await marineDataService.fetchAndStoreData();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.get('/export', async (req: Request, res: Response) => {
  try {
    const filepath = await marineDataService.exportToExcel();
    const filename = path.basename(filepath);
    
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('[MarineData Export] Download error:', err);
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.get('/source-url', (req: Request, res: Response) => {
  res.json({ url: marineDataService.getSourceUrl() });
});

export default router;
