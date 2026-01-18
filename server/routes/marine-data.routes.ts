import { Router, Request, Response } from 'express';
import { marineDataService } from '../services/marine-data.service';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

router.get('/latest', async (req: Request, res: Response) => {
  try {
    let data = await marineDataService.getLatestData();
    
    if (!data) {
      const result = await marineDataService.fetchAndStoreData();
      if (result.success) {
        data = result.data;
      }
    }
    
    if (data) {
      const history = await marineDataService.getHistoricalData(7);
      const historyValues = history.map(h => h.chlorophyllA).filter(Boolean);
      const current = data.chlorophyllA;
      const prev = historyValues[1] ?? current;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (current > prev + 0.3) trend = 'up';
      else if (current < prev - 0.3) trend = 'down';
      
      let quality: 'ottima' | 'buona' | 'media' | 'scarsa' = 'media';
      if (current < 2) quality = 'ottima';
      else if (current < 5) quality = 'buona';
      else if (current < 10) quality = 'media';
      else quality = 'scarsa';
      
      res.json({
        success: true,
        data: {
          chl: data.chlorophyllA,
          sst: data.seaSurfaceTemperature,
          salinity: data.salinity,
          waveHeight: data.waveHeight,
          trend,
          quality,
          history: historyValues.slice(0, 7).reverse(),
          recordedAt: data.recordedAt,
          source: data.source,
          sourceUrl: marineDataService.getSourceUrl(),
        }
      });
    } else {
      res.status(404).json({ success: false, error: 'No marine data available' });
    }
  } catch (error) {
    console.error('[MarineData API] Error:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.get('/history', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const data = await marineDataService.getHistoricalData(days);
    res.json({ success: true, data });
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
