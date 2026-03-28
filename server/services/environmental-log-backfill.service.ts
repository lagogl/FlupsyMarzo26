import { db } from '../db';
import { environmentalLog } from '@shared/schema';
import { eq } from 'drizzle-orm';

const METEO_LAT = 44.95;
const METEO_LON = 12.36;

function round2(v?: number | null): number | null {
  if (v == null || isNaN(v)) return null;
  return Math.round(v * 100) / 100;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchOpenMeteoHistorical(startDate: string, endDate: string): Promise<Map<string, any>> {
  const map = new Map<string, any>();
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${METEO_LAT}&longitude=${METEO_LON}` +
    `&start_date=${startDate}&end_date=${endDate}` +
    `&daily=temperature_2m_mean,precipitation_sum,windspeed_10m_max,windgusts_10m_max,weather_code` +
    `&timezone=Europe/Rome`;

  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) {
    console.warn(`[Backfill] Open-Meteo Archive errore: ${res.status}`);
    return map;
  }
  const data = await res.json();
  const daily = data.daily;
  if (!daily?.time) return map;

  for (let i = 0; i < daily.time.length; i++) {
    map.set(daily.time[i], {
      tempAria: round2(daily.temperature_2m_mean?.[i]),
      precipitazione: round2(daily.precipitation_sum?.[i]),
      ventoVelocita: round2(daily.windspeed_10m_max?.[i]),
      ventoRaffica: round2(daily.windgusts_10m_max?.[i]),
      condizioneMeteo: daily.weather_code?.[i] != null ? Math.round(daily.weather_code[i]) : null,
    });
  }
  return map;
}

async function fetchOpenMeteoMarineHistorical(startDate: string, endDate: string): Promise<Map<string, any>> {
  const map = new Map<string, any>();
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${METEO_LAT}&longitude=${METEO_LON}` +
    `&start_date=${startDate}&end_date=${endDate}` +
    `&daily=wave_height_max,wave_period_max,swell_wave_height_max` +
    `&timezone=Europe/Rome`;

  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) {
    console.warn(`[Backfill] Open-Meteo Marine errore: ${res.status}`);
    return map;
  }
  const data = await res.json();
  const daily = data.daily;
  if (!daily?.time) return map;

  for (let i = 0; i < daily.time.length; i++) {
    map.set(daily.time[i], {
      waveHeight: round2(daily.wave_height_max?.[i]),
      wavePeriod: round2(daily.wave_period_max?.[i]),
    });
  }
  return map;
}

export interface BackfillProgress {
  total: number;
  inserted: number;
  skipped: number;
  errors: number;
  currentDate?: string;
  status: 'running' | 'completed' | 'error';
  message?: string;
}

let currentProgress: BackfillProgress | null = null;

export function getBackfillProgress(): BackfillProgress | null {
  return currentProgress;
}

export async function backfillEnvironmentalData(startDateStr: string, endDateStr: string): Promise<BackfillProgress> {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  currentProgress = {
    total: totalDays,
    inserted: 0,
    skipped: 0,
    errors: 0,
    status: 'running',
    message: 'Avvio backfill...'
  };

  try {
    const chunkSize = 90;
    let chunkStart = new Date(start);

    while (chunkStart <= end) {
      const chunkEnd = new Date(chunkStart);
      chunkEnd.setDate(chunkEnd.getDate() + chunkSize - 1);
      if (chunkEnd > end) chunkEnd.setTime(end.getTime());

      const startStr = chunkStart.toISOString().split('T')[0];
      const endStr = chunkEnd.toISOString().split('T')[0];

      currentProgress.message = `Scaricamento dati ${startStr} → ${endStr}...`;
      console.log(`[Backfill] Chunk: ${startStr} → ${endStr}`);

      const [weatherData, marineData] = await Promise.all([
        fetchOpenMeteoHistorical(startStr, endStr),
        fetchOpenMeteoMarineHistorical(startStr, endStr),
      ]);

      for (let d = new Date(chunkStart); d <= chunkEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        currentProgress.currentDate = dateStr;

        try {
          const existing = await db
            .select({ id: environmentalLog.id })
            .from(environmentalLog)
            .where(eq(environmentalLog.date, dateStr))
            .limit(1);

          if (existing.length > 0) {
            const weather = weatherData.get(dateStr);
            const marine = marineData.get(dateStr);
            if (weather || marine) {
              const updates: any = {};
              let hasUpdate = false;

              if (weather) {
                const ex = await db.select().from(environmentalLog).where(eq(environmentalLog.date, dateStr)).limit(1);
                const rec = ex[0];
                if (rec.tempAria == null && weather.tempAria != null) { updates.tempAria = weather.tempAria; hasUpdate = true; }
                if (rec.precipitazione == null && weather.precipitazione != null) { updates.precipitazione = weather.precipitazione; hasUpdate = true; }
                if (rec.ventoVelocita == null && weather.ventoVelocita != null) { updates.ventoVelocita = weather.ventoVelocita; hasUpdate = true; }
                if (rec.ventoRaffica == null && weather.ventoRaffica != null) { updates.ventoRaffica = weather.ventoRaffica; hasUpdate = true; }
                if (rec.condizioneMeteo == null && weather.condizioneMeteo != null) { updates.condizioneMeteo = weather.condizioneMeteo; hasUpdate = true; }
              }
              if (marine) {
                const ex = await db.select().from(environmentalLog).where(eq(environmentalLog.date, dateStr)).limit(1);
                const rec = ex[0];
                if (rec.waveHeight == null && marine.waveHeight != null) { updates.waveHeight = marine.waveHeight; hasUpdate = true; }
                if (rec.wavePeriod == null && marine.wavePeriod != null) { updates.wavePeriod = marine.wavePeriod; hasUpdate = true; }
              }

              if (hasUpdate) {
                await db.update(environmentalLog).set(updates).where(eq(environmentalLog.date, dateStr));
                currentProgress.inserted++;
              } else {
                currentProgress.skipped++;
              }
            } else {
              currentProgress.skipped++;
            }
            continue;
          }

          const weather = weatherData.get(dateStr) || {};
          const marine = marineData.get(dateStr) || {};

          const hasAnyData = weather.tempAria != null || weather.precipitazione != null ||
            weather.ventoVelocita != null || marine.waveHeight != null;

          if (!hasAnyData) {
            currentProgress.skipped++;
            continue;
          }

          await db.insert(environmentalLog).values({
            date: dateStr,
            username: 'backfill',
            sst: null,
            chlorophyll: null,
            salinity: null,
            waveHeight: marine.waveHeight ?? null,
            wavePeriod: marine.wavePeriod ?? null,
            tempAria: weather.tempAria ?? null,
            precipitazione: weather.precipitazione ?? null,
            ventoVelocita: weather.ventoVelocita ?? null,
            ventoRaffica: weather.ventoRaffica ?? null,
            condizioneMeteo: weather.condizioneMeteo ?? null,
          });

          currentProgress.inserted++;
        } catch (e) {
          currentProgress.errors++;
          console.warn(`[Backfill] Errore per ${dateStr}:`, (e as Error).message);
        }
      }

      await sleep(500);
      chunkStart.setDate(chunkStart.getDate() + chunkSize);
    }

    currentProgress.status = 'completed';
    currentProgress.message = `Backfill completato: ${currentProgress.inserted} inseriti, ${currentProgress.skipped} saltati, ${currentProgress.errors} errori`;
    console.log(`[Backfill] ✅ ${currentProgress.message}`);
  } catch (e) {
    currentProgress.status = 'error';
    currentProgress.message = `Errore: ${(e as Error).message}`;
    console.error('[Backfill] ❌', e);
  }

  return currentProgress;
}
