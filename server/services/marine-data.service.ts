import { db } from '../db';
import { marineData } from '@shared/schema';
import { desc, gte } from 'drizzle-orm';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

const DELTA_PO_COORDS = {
  latitude: 44.93,
  longitude: 12.27,
};

const COPERNICUS_URL = 'https://marine.copernicus.eu/access-data';

interface CopernicusResult {
  success: boolean;
  source: string;
  sourceUrl: string;
  timestamp: string;
  location: { lat: number; lon: number; name: string };
  data: {
    sst: number | null;
    chlorophyllA: number | null;
    salinity: number | null;
  };
  errors: string[];
}

interface OpenMeteoResult {
  seaSurfaceTemperature: number | null;
  waveHeight: number | null;
  wavePeriod: number | null;
}

export class MarineDataService {
  
  private async fetchFromCopernicus(): Promise<CopernicusResult | null> {
    return new Promise((resolve) => {
      const scriptPath = path.join(process.cwd(), 'server/scripts/copernicus_fetch.py');
      
      if (!fs.existsSync(scriptPath)) {
        console.error('[MarineData] Copernicus script not found:', scriptPath);
        resolve(null);
        return;
      }
      
      console.log('[MarineData] Fetching REAL data from Copernicus Marine...');
      
      const pythonProcess = spawn('python3', [scriptPath], {
        env: {
          ...process.env,
          COPERNICUS_USERNAME: process.env.COPERNICUS_USERNAME || '',
          COPERNICUS_PASSWORD: process.env.COPERNICUS_PASSWORD || '',
        },
        timeout: 120000,
      });
      
      let stdout = '';
      let stderr = '';
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('[MarineData] Copernicus script failed:', stderr);
          resolve(null);
          return;
        }
        
        try {
          const lines = stdout.trim().split('\n');
          const jsonLine = lines[lines.length - 1];
          const result = JSON.parse(jsonLine) as CopernicusResult;
          
          if (result.success) {
            console.log(`[MarineData] COPERNICUS DATA: SST=${result.data.sst}°C, Chl-a=${result.data.chlorophyllA}µg/L, Sal=${result.data.salinity}‰`);
          } else {
            console.warn('[MarineData] Copernicus partial data:', result.errors);
          }
          
          resolve(result);
        } catch (e) {
          console.error('[MarineData] Failed to parse Copernicus result:', e, stdout);
          resolve(null);
        }
      });
      
      pythonProcess.on('error', (err) => {
        console.error('[MarineData] Failed to spawn Python process:', err);
        resolve(null);
      });
      
      setTimeout(() => {
        pythonProcess.kill();
        console.error('[MarineData] Copernicus script timeout');
        resolve(null);
      }, 120000);
    });
  }
  
  private async fetchFromOpenMeteo(): Promise<OpenMeteoResult | null> {
    try {
      const { latitude, longitude } = DELTA_PO_COORDS;
      const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}&current=wave_height,wave_period&hourly=sea_surface_temperature&timezone=Europe/Rome`;
      
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      const currentHour = new Date().getHours();
      
      return {
        seaSurfaceTemperature: data.hourly?.sea_surface_temperature?.[currentHour] ?? null,
        waveHeight: data.current?.wave_height ?? null,
        wavePeriod: data.current?.wave_period ?? null,
      };
    } catch (error) {
      console.warn('[MarineData] Open-Meteo fetch failed:', error);
      return null;
    }
  }
  
  async fetchAndStoreData(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('[MarineData] Fetching marine data for Delta Po area...');
      
      const { latitude, longitude } = DELTA_PO_COORDS;
      
      // Fetch from Copernicus (primary source)
      const copernicusData = await this.fetchFromCopernicus();
      
      // Fetch wave data from Open-Meteo
      const openMeteoData = await this.fetchFromOpenMeteo();
      
      if (!copernicusData?.success && !openMeteoData) {
        return { 
          success: false, 
          error: 'Impossibile ottenere dati reali. Verifica le credenziali Copernicus.' 
        };
      }
      
      const record = {
        recordedAt: new Date(),
        latitude,
        longitude,
        chlorophyllA: copernicusData?.data?.chlorophyllA ?? null,
        seaSurfaceTemperature: copernicusData?.data?.sst ?? openMeteoData?.seaSurfaceTemperature ?? null,
        salinity: copernicusData?.data?.salinity ?? null,
        waveHeight: openMeteoData?.waveHeight ? Math.round(openMeteoData.waveHeight * 100) / 100 : null,
        currentSpeed: null,
        source: copernicusData?.success ? 'copernicus-marine' : 'open-meteo-fallback',
        rawData: { copernicus: copernicusData, openMeteo: openMeteoData },
      };
      
      const [inserted] = await db.insert(marineData).values(record).returning();
      
      console.log(`[MarineData] Data stored: ID=${inserted.id}, SST=${record.seaSurfaceTemperature}°C, Chl-a=${record.chlorophyllA}µg/L, Source=${record.source}`);
      
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
  
  async getLatestRealData(): Promise<any> {
    // Fetch fresh data from Copernicus
    const copernicusData = await this.fetchFromCopernicus();
    const openMeteoData = await this.fetchFromOpenMeteo();
    
    if (!copernicusData?.success && !openMeteoData) {
      return null;
    }
    
    const history = await this.getHistoricalData(2);
    const sstHistory = history
      .filter(r => r.seaSurfaceTemperature !== null)
      .slice(0, 6)
      .map(r => r.seaSurfaceTemperature);
    
    return {
      sst: copernicusData?.data?.sst ?? openMeteoData?.seaSurfaceTemperature ?? null,
      chlorophyll: copernicusData?.data?.chlorophyllA ?? null,
      salinity: copernicusData?.data?.salinity ?? null,
      waveHeight: openMeteoData?.waveHeight ?? null,
      wavePeriod: openMeteoData?.wavePeriod ?? null,
      history: sstHistory,
      source: copernicusData?.success ? 'copernicus-marine' : 'open-meteo',
      sourceUrl: COPERNICUS_URL,
      recordedAt: new Date(),
      isRealData: true,
      note: copernicusData?.success 
        ? 'Dati reali da Copernicus Marine Data Store' 
        : 'Dati parziali - verifica credenziali Copernicus',
    };
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
    const ws = workbook.addWorksheet('Dati Marini Copernicus');
    
    const records = await this.getHistoricalData(30);
    
    const titleRow = ws.addRow([`Dati Marini Copernicus - Delta Po - ${new Date().toLocaleString('it-IT')}`]);
    titleRow.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0891B2' } };
    ws.mergeCells(1, 1, 1, 8);
    titleRow.alignment = { horizontal: 'center' };
    
    const infoRow = ws.addRow(['Fonte: Copernicus Marine Data Store (marine.copernicus.eu)']);
    infoRow.font = { italic: true, size: 10, color: { argb: 'FF666666' } };
    ws.mergeCells(2, 1, 2, 8);
    
    ws.addRow([]);
    
    const headers = ['Data/Ora', 'Lat', 'Lon', 'SST (°C)', 'Clorofilla-a (µg/L)', 'Salinità (‰)', 'Onde (m)', 'Fonte'];
    const headerRow = ws.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    
    ws.columns = [
      { width: 20 }, { width: 10 }, { width: 10 }, { width: 12 },
      { width: 18 }, { width: 14 }, { width: 12 }, { width: 20 }
    ];
    
    records.forEach((r, idx) => {
      const row = ws.addRow([
        new Date(r.recordedAt).toLocaleString('it-IT'),
        r.latitude,
        r.longitude,
        r.seaSurfaceTemperature,
        r.chlorophyllA,
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
    
    const filename = `copernicus_marine_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const filepath = path.join(exportDir, filename);
    
    await workbook.xlsx.writeFile(filepath);
    console.log(`[MarineData] Excel exported: ${filepath} (${records.length} records)`);
    
    return filepath;
  }
  
  getSourceUrl(): string {
    return COPERNICUS_URL;
  }
  
  isUsingRealData(): boolean {
    return true;
  }
}

export const marineDataService = new MarineDataService();
