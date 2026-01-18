import { db } from '../db';
import { marineData } from '@shared/schema';
import { desc, gte } from 'drizzle-orm';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

const DELTA_PO_COORDS = {
  latitude: 44.93,
  longitude: 12.27,
};

const COPERNICUS_URL = 'https://marine.copernicus.eu/access-data';

interface CopernicusData {
  chlorophyllA: number | null;
  seaSurfaceTemperature: number | null;
  salinity: number | null;
}

export class MarineDataService {
  
  private async fetchFromCopernicus(): Promise<CopernicusData | null> {
    const username = process.env.COPERNICUS_USERNAME;
    const password = process.env.COPERNICUS_PASSWORD;
    
    if (!username || !password) {
      console.log('[MarineData] Copernicus credentials not configured, using simulated data');
      return null;
    }
    
    try {
      const { latitude, longitude } = DELTA_PO_COORDS;
      const today = new Date().toISOString().slice(0, 10);
      
      const datasetId = 'cmems_mod_med_bgc_anfc_4.2km_P1D-m';
      const variables = 'chl,thetao,so';
      
      const url = `https://nrt.cmems-du.eu/thredds/dodsC/${datasetId}.ascii?` +
        `chl[0:0][0:0][${latitude}:${latitude}][${longitude}:${longitude}],` +
        `thetao[0:0][0:0][${latitude}:${latitude}][${longitude}:${longitude}],` +
        `so[0:0][0:0][${latitude}:${latitude}][${longitude}:${longitude}]`;
      
      const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
      
      const response = await fetch(url, {
        headers: {
          'Authorization': authHeader,
        },
      });
      
      if (!response.ok) {
        console.error(`[MarineData] Copernicus API error: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const text = await response.text();
      console.log('[MarineData] Copernicus response received, parsing...');
      
      const chlMatch = text.match(/chl\[.*?\]\s*=\s*([\d.]+)/);
      const sstMatch = text.match(/thetao\[.*?\]\s*=\s*([\d.]+)/);
      const salMatch = text.match(/so\[.*?\]\s*=\s*([\d.]+)/);
      
      return {
        chlorophyllA: chlMatch ? parseFloat(chlMatch[1]) : null,
        seaSurfaceTemperature: sstMatch ? parseFloat(sstMatch[1]) : null,
        salinity: salMatch ? parseFloat(salMatch[1]) : null,
      };
    } catch (error) {
      console.error('[MarineData] Copernicus fetch error:', error);
      return null;
    }
  }
  
  private getSimulatedData(): CopernicusData {
    const chlorophyllA = 2.5 + Math.sin(Date.now() / (1000 * 60 * 60 * 6)) * 1.5 + (Math.random() - 0.5);
    const sst = 9 + Math.sin(Date.now() / (1000 * 60 * 60 * 24)) * 2 + (Math.random() - 0.5);
    const salinity = 33.5 + Math.sin(Date.now() / (1000 * 60 * 60 * 12)) * 1.5 + (Math.random() - 0.5);
    
    return {
      chlorophyllA: Math.round(chlorophyllA * 100) / 100,
      seaSurfaceTemperature: Math.round(sst * 10) / 10,
      salinity: Math.round(salinity * 10) / 10,
    };
  }
  
  async fetchAndStoreData(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('[MarineData] Fetching marine data for Delta Po area...');
      
      const { latitude, longitude } = DELTA_PO_COORDS;
      
      const waveUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}&hourly=wave_height,wave_period,ocean_current_velocity&forecast_days=1&timezone=Europe/Rome`;
      
      let waveHeight: number | null = null;
      let currentSpeed: number | null = null;
      
      try {
        const waveResponse = await fetch(waveUrl);
        if (waveResponse.ok) {
          const waveData = await waveResponse.json();
          waveHeight = waveData.hourly?.wave_height?.[0] ?? null;
          currentSpeed = waveData.hourly?.ocean_current_velocity?.[0] ?? null;
        }
      } catch (err) {
        console.warn('[MarineData] Wave data fetch failed:', err);
      }
      
      let marineParams = await this.fetchFromCopernicus();
      let source = 'copernicus-marine';
      
      if (!marineParams) {
        marineParams = this.getSimulatedData();
        source = 'simulated';
      }
      
      const record = {
        recordedAt: new Date(),
        latitude,
        longitude,
        chlorophyllA: marineParams.chlorophyllA,
        seaSurfaceTemperature: marineParams.seaSurfaceTemperature,
        salinity: marineParams.salinity,
        waveHeight: waveHeight ? Math.round(waveHeight * 100) / 100 : null,
        currentSpeed: currentSpeed ? Math.round(currentSpeed * 1000) / 1000 : null,
        source,
        rawData: { waveHeight, currentSpeed, ...marineParams },
      };
      
      const [inserted] = await db.insert(marineData).values(record).returning();
      
      console.log(`[MarineData] Data stored successfully: ID=${inserted.id}, Chl-a=${record.chlorophyllA}µg/L, SST=${record.seaSurfaceTemperature}°C, Source=${source}`);
      
      return { success: true, data: inserted };
    } catch (error) {
      console.error('[MarineData] Error fetching/storing data:', error);
      return { success: false, error: String(error) };
    }
  }
  
  async getLatestData(): Promise<any> {
    const [latest] = await db
      .select()
      .from(marineData)
      .orderBy(desc(marineData.recordedAt))
      .limit(1);
    
    return latest || null;
  }
  
  async getHistoricalData(days: number = 7): Promise<any[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    const records = await db
      .select()
      .from(marineData)
      .where(gte(marineData.recordedAt, since))
      .orderBy(desc(marineData.recordedAt));
    
    return records;
  }
  
  async exportToExcel(): Promise<string> {
    const ExcelModule = (ExcelJS as any).default || ExcelJS;
    const workbook = new ExcelModule.Workbook();
    const ws = workbook.addWorksheet('Dati Marini');
    
    const records = await this.getHistoricalData(30);
    
    const titleRow = ws.addRow([`Dati Marini Delta Po - Esportato il ${new Date().toLocaleString('it-IT')}`]);
    titleRow.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0891B2' } };
    ws.mergeCells(1, 1, 1, 8);
    titleRow.alignment = { horizontal: 'center' };
    
    const headers = ['Data/Ora', 'Latitudine', 'Longitudine', 'Clorofilla-a (µg/L)', 'Temperatura (°C)', 'Salinità (‰)', 'Onde (m)', 'Fonte'];
    const headerRow = ws.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    
    ws.columns = [
      { width: 20 }, { width: 12 }, { width: 12 }, { width: 18 },
      { width: 16 }, { width: 14 }, { width: 12 }, { width: 18 }
    ];
    
    records.forEach((r, idx) => {
      const row = ws.addRow([
        new Date(r.recordedAt).toLocaleString('it-IT'),
        r.latitude,
        r.longitude,
        r.chlorophyllA,
        r.seaSurfaceTemperature,
        r.salinity,
        r.waveHeight,
        r.source
      ]);
      
      if (idx % 2 === 1) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      }
    });
    
    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    const filename = `marine_data_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const filepath = path.join(exportDir, filename);
    
    await workbook.xlsx.writeFile(filepath);
    console.log(`[MarineData] Excel exported to: ${filepath}`);
    
    return filepath;
  }
  
  getSourceUrl(): string {
    return COPERNICUS_URL;
  }
  
  isUsingRealData(): boolean {
    return !!(process.env.COPERNICUS_USERNAME && process.env.COPERNICUS_PASSWORD);
  }
}

export const marineDataService = new MarineDataService();
