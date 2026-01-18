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

const SOURCE_URL = 'https://open-meteo.com/en/docs/marine-weather-api';

interface MarineApiResponse {
  seaSurfaceTemperature: number | null;
  waveHeight: number | null;
  wavePeriod: number | null;
  waveDirection: number | null;
  oceanCurrentVelocity: number | null;
  oceanCurrentDirection: number | null;
}

export class MarineDataService {
  
  private async fetchFromOpenMeteo(): Promise<MarineApiResponse | null> {
    try {
      const { latitude, longitude } = DELTA_PO_COORDS;
      
      const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}&current=wave_height,wave_direction,wave_period,ocean_current_velocity,ocean_current_direction&hourly=sea_surface_temperature,wave_height&timezone=Europe/Rome`;
      
      console.log('[MarineData] Fetching REAL data from Open-Meteo Marine API...');
      
      const response = await fetch(url, {
        signal: AbortSignal.timeout(15000)
      });
      
      if (!response.ok) {
        console.error(`[MarineData] Open-Meteo API error: ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      
      const currentHour = new Date().getHours();
      const sst = data.hourly?.sea_surface_temperature?.[currentHour] ?? null;
      
      const result: MarineApiResponse = {
        seaSurfaceTemperature: sst,
        waveHeight: data.current?.wave_height ?? null,
        wavePeriod: data.current?.wave_period ?? null,
        waveDirection: data.current?.wave_direction ?? null,
        oceanCurrentVelocity: data.current?.ocean_current_velocity ?? null,
        oceanCurrentDirection: data.current?.ocean_current_direction ?? null,
      };
      
      console.log(`[MarineData] REAL DATA: SST=${result.seaSurfaceTemperature}°C, Waves=${result.waveHeight}m, Period=${result.wavePeriod}s`);
      
      return result;
    } catch (error) {
      console.error('[MarineData] Open-Meteo fetch error:', error);
      return null;
    }
  }
  
  async fetchAndStoreData(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('[MarineData] Fetching marine data for Delta Po area...');
      
      const { latitude, longitude } = DELTA_PO_COORDS;
      
      const marineParams = await this.fetchFromOpenMeteo();
      
      if (!marineParams) {
        return { 
          success: false, 
          error: 'Impossibile ottenere dati reali dalla API Open-Meteo Marine' 
        };
      }
      
      if (marineParams.seaSurfaceTemperature === null) {
        return {
          success: false,
          error: 'API Open-Meteo non ha restituito dati SST validi'
        };
      }
      
      const record = {
        recordedAt: new Date(),
        latitude,
        longitude,
        chlorophyllA: null,
        seaSurfaceTemperature: marineParams.seaSurfaceTemperature,
        salinity: null,
        waveHeight: marineParams.waveHeight ? Math.round(marineParams.waveHeight * 100) / 100 : null,
        currentSpeed: marineParams.oceanCurrentVelocity ? Math.round(marineParams.oceanCurrentVelocity * 1000) / 1000 : null,
        source: 'open-meteo-real',
        rawData: { 
          ...marineParams,
          fetchedAt: new Date().toISOString(),
          coordinates: { latitude, longitude }
        },
      };
      
      const [inserted] = await db.insert(marineData).values(record).returning();
      
      console.log(`[MarineData] REAL DATA stored: ID=${inserted.id}, SST=${record.seaSurfaceTemperature}°C, Waves=${record.waveHeight}m, Source=open-meteo-real`);
      
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
    const result = await this.fetchFromOpenMeteo();
    if (!result) {
      return null;
    }
    
    const history = await this.getHistoricalData(2);
    const sstHistory = history
      .filter(r => r.seaSurfaceTemperature !== null && r.source === 'open-meteo-real')
      .slice(0, 6)
      .map(r => r.seaSurfaceTemperature);
    
    return {
      sst: result.seaSurfaceTemperature,
      waveHeight: result.waveHeight,
      wavePeriod: result.wavePeriod,
      waveDirection: result.waveDirection,
      currentVelocity: result.oceanCurrentVelocity,
      currentDirection: result.oceanCurrentDirection,
      chlorophyll: null,
      salinity: null,
      history: sstHistory,
      source: 'open-meteo-real',
      sourceUrl: SOURCE_URL,
      recordedAt: new Date(),
      note: 'Dati reali da Open-Meteo Marine API. Clorofilla e salinità non disponibili da API gratuite.',
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
    const ws = workbook.addWorksheet('Dati Marini');
    
    const records = await this.getHistoricalData(30);
    
    const realRecords = records.filter(r => r.source === 'open-meteo-real');
    
    const titleRow = ws.addRow([`Dati Marini Reali Delta Po - Esportato il ${new Date().toLocaleString('it-IT')}`]);
    titleRow.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0891B2' } };
    ws.mergeCells(1, 1, 1, 7);
    titleRow.alignment = { horizontal: 'center' };
    
    const infoRow = ws.addRow(['Fonte: Open-Meteo Marine API (https://open-meteo.com) - Solo dati reali']);
    infoRow.font = { italic: true, size: 10, color: { argb: 'FF666666' } };
    ws.mergeCells(2, 1, 2, 7);
    
    ws.addRow([]);
    
    const headers = ['Data/Ora', 'Latitudine', 'Longitudine', 'Temperatura Mare (°C)', 'Altezza Onde (m)', 'Velocità Corrente (km/h)', 'Fonte'];
    const headerRow = ws.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    
    ws.columns = [
      { width: 20 }, { width: 12 }, { width: 12 }, { width: 20 },
      { width: 18 }, { width: 22 }, { width: 18 }
    ];
    
    realRecords.forEach((r, idx) => {
      const row = ws.addRow([
        new Date(r.recordedAt).toLocaleString('it-IT'),
        r.latitude,
        r.longitude,
        r.seaSurfaceTemperature,
        r.waveHeight,
        r.currentSpeed,
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
    
    const filename = `marine_data_real_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const filepath = path.join(exportDir, filename);
    
    await workbook.xlsx.writeFile(filepath);
    console.log(`[MarineData] Excel exported to: ${filepath} (${realRecords.length} real records)`);
    
    return filepath;
  }
  
  getSourceUrl(): string {
    return SOURCE_URL;
  }
  
  isUsingRealData(): boolean {
    return true;
  }
}

export const marineDataService = new MarineDataService();
