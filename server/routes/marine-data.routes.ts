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
          locations: realData.locations || [],
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

router.post('/import-copernicus', async (req: Request, res: Response) => {
  try {
    const { sst, chlorophyll, salinity, timestamp, locationName } = req.body;
    
    if (sst === undefined && chlorophyll === undefined && salinity === undefined) {
      return res.status(400).json({ success: false, error: 'No data provided' });
    }
    
    const result = await marineDataService.importCopernicusData({
      sst: sst ?? null,
      chlorophyll: chlorophyll ?? null,
      salinity: salinity ?? null,
      timestamp: timestamp ?? new Date().toISOString(),
      locationName: locationName ?? undefined
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.get('/locations', (req: Request, res: Response) => {
  res.json({
    success: true,
    locations: [
      { name: "Ca' Pisani", latitude: 45.02194, longitude: 12.38010 },
      { name: "Delta Futuro", latitude: 44.81887, longitude: 12.30900 }
    ]
  });
});

router.get('/history-by-location', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const locationName = req.query.location as string;
    const data = await marineDataService.getHistoricalData(days);
    
    const filteredData = locationName 
      ? data.filter(r => r.locationName === locationName)
      : data;
    
    const groupedByLocation: Record<string, any[]> = {};
    
    filteredData.forEach(record => {
      const loc = record.locationName || 'Sconosciuto';
      if (!groupedByLocation[loc]) {
        groupedByLocation[loc] = [];
      }
      groupedByLocation[loc].push({
        date: record.recordedAt,
        sst: record.seaSurfaceTemperature,
        chlorophyll: record.chlorophyllA,
        salinity: record.salinity,
        waveHeight: record.waveHeight,
        source: record.source
      });
    });
    
    Object.keys(groupedByLocation).forEach(loc => {
      groupedByLocation[loc].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    });
    
    res.json({ 
      success: true, 
      data: groupedByLocation,
      totalRecords: filteredData.length 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.post('/backfill-year', async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.body.year) || 2025;
    
    if (year < 2020 || year > new Date().getFullYear()) {
      return res.status(400).json({ 
        success: false, 
        error: `Anno non valido. Inserire un anno tra 2020 e ${new Date().getFullYear()}` 
      });
    }
    
    console.log(`[MarineData API] Starting backfill for year ${year}...`);
    
    res.json({ 
      success: true, 
      message: `Backfill avviato per l'anno ${year}. Il processo continuerà in background.`,
      status: 'started'
    });
    
    marineDataService.backfillYear(year)
      .then(result => {
        console.log(`[MarineData API] Backfill ${year} completed: ${result.message}`);
      })
      .catch(err => {
        console.error(`[MarineData API] Backfill ${year} error:`, err);
      });
      
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.get('/backfill-status', async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string) || 2025;
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);
    
    const data = await marineDataService.getHistoricalData(365);
    const yearData = data.filter(r => {
      const recordDate = new Date(r.recordedAt);
      return recordDate >= startOfYear && recordDate <= endOfYear;
    });
    
    res.json({
      success: true,
      year,
      totalRecords: yearData.length,
      byMonth: Array.from({ length: 12 }, (_, i) => {
        const monthData = yearData.filter(r => new Date(r.recordedAt).getMonth() === i);
        return {
          month: i + 1,
          records: monthData.length
        };
      })
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;
