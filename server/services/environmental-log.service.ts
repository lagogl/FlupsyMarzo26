import { db } from '../db';
import { environmentalLog } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { getAllBuoyStations } from './buoy-data.service';
import { marineDataService } from './marine-data.service';

// Coordinate rappresentative dell'area di produzione (Ca' Pisani / Delta del Po)
const METEO_LAT = 44.95;
const METEO_LON = 12.36;

interface EnvSnapshot {
  date: string;
  userId?: number;
  username?: string;
  sst?: number | null;
  waveHeight?: number | null;
  wavePeriod?: number | null;
  chlorophyll?: number | null;
  salinity?: number | null;
  vallonaTempAcqua?: number | null;
  vallonaPh?: number | null;
  vallonaSalinita?: number | null;
  vallonaOssigenoSat?: number | null;
  vallonaTorbidita?: number | null;
  vallonaClorofilla?: number | null;
  vallonaTimestamp?: string | null;
  gorino2TempAcqua?: number | null;
  gorino2Ph?: number | null;
  gorino2Salinita?: number | null;
  gorino2OssigenoSat?: number | null;
  gorino2Torbidita?: number | null;
  gorino2Clorofilla?: number | null;
  gorino2Timestamp?: string | null;
  // Meteo aria (Open-Meteo atmospheric)
  tempAria?: number | null;
  precipitazione?: number | null;
  ventoVelocita?: number | null;
  ventoRaffica?: number | null;
  condizioneMeteo?: number | null;
}

function round2(v?: number | null): number | null {
  if (v == null || isNaN(v)) return null;
  return Math.round(v * 100) / 100;
}

function snapshotChanged(existing: any, snap: EnvSnapshot): boolean {
  const fields: (keyof EnvSnapshot)[] = [
    'sst', 'waveHeight', 'wavePeriod', 'chlorophyll', 'salinity',
    'vallonaTempAcqua', 'vallonaPh', 'vallonaSalinita', 'vallonaOssigenoSat',
    'vallonaTorbidita', 'vallonaClorofilla',
    'gorino2TempAcqua', 'gorino2Ph', 'gorino2Salinita', 'gorino2OssigenoSat',
    'gorino2Torbidita', 'gorino2Clorofilla',
    'tempAria', 'precipitazione', 'ventoVelocita', 'ventoRaffica', 'condizioneMeteo',
  ];
  for (const f of fields) {
    const a = round2(existing[f] as number | null);
    const b = round2(snap[f] as number | null);
    if (a !== b) return true;
  }
  return false;
}

async function buildSnapshot(userId?: number, username?: string): Promise<EnvSnapshot> {
  const today = new Date().toISOString().split('T')[0];
  const snap: EnvSnapshot = { date: today, userId, username };

  // --- Marine data ---
  try {
    const marine = await marineDataService.getLatestRealData();
    if (marine) {
      snap.sst = round2(marine.sst);
      snap.waveHeight = round2(marine.waveHeight);
      snap.wavePeriod = round2(marine.wavePeriod);
      snap.chlorophyll = round2(marine.chlorophyll);
      snap.salinity = round2(marine.salinity);
    }
  } catch (e) {
    console.warn('[EnvLog] Marine data non disponibile:', (e as Error).message);
  }

  // --- Meteo aria (Open-Meteo atmospheric) ---
  try {
    const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${METEO_LAT}&longitude=${METEO_LON}` +
      `&current=temperature_2m,precipitation,windspeed_10m,windgusts_10m,weather_code&timezone=Europe/Rome`;
    const meteoRes = await fetch(meteoUrl, { signal: AbortSignal.timeout(10000) });
    if (meteoRes.ok) {
      const meteoData = await meteoRes.json();
      const cur = meteoData.current;
      if (cur) {
        snap.tempAria = round2(cur.temperature_2m);
        snap.precipitazione = round2(cur.precipitation);
        snap.ventoVelocita = round2(cur.windspeed_10m);
        snap.ventoRaffica = round2(cur.windgusts_10m);
        snap.condizioneMeteo = cur.weather_code != null ? Math.round(cur.weather_code) : null;
      }
    }
  } catch (e) {
    console.warn('[EnvLog] Meteo aria non disponibile:', (e as Error).message);
  }

  // --- Buoy data ---
  try {
    const { arpae, arpav } = await getAllBuoyStations();

    // Vallona = ARPAV
    const vallona = arpav.find(s =>
      s.nome.toLowerCase().includes('vallona')
    );
    if (vallona?.ultimaLettura) {
      const r = vallona.ultimaLettura;
      snap.vallonaTempAcqua = round2(r.temperatura);
      snap.vallonaPh = round2(r.ph);
      snap.vallonaSalinita = round2(r.salinita);
      snap.vallonaOssigenoSat = round2(r.ossigenoSat);
      snap.vallonaTorbidita = round2(r.torbidita);
      snap.vallonaClorofilla = round2(r.clorofilla);
      snap.vallonaTimestamp = vallona.timestamp ?? null;
    }

    // Gorino 2 = ARPAE (nome contiene "gorino" case-insensitive)
    const gorino2 = arpae.find(s =>
      s.nome.toLowerCase().includes('gorino')
    );
    if (gorino2?.ultimaLettura) {
      const r = gorino2.ultimaLettura;
      snap.gorino2TempAcqua = round2(r.temperatura);
      snap.gorino2Ph = round2(r.ph);
      snap.gorino2Salinita = round2(r.salinita);
      snap.gorino2OssigenoSat = round2(r.ossigenoSat);
      snap.gorino2Torbidita = round2(r.torbidita);
      snap.gorino2Clorofilla = round2(r.clorofilla);
      snap.gorino2Timestamp = gorino2.timestamp ?? null;
    }
  } catch (e) {
    console.warn('[EnvLog] Buoy data non disponibile:', (e as Error).message);
  }

  return snap;
}

export async function recordEnvironmentalSnapshot(userId?: number, username?: string): Promise<void> {
  try {
    const snap = await buildSnapshot(userId, username);
    const today = snap.date;

    // Cerca record esistente per oggi
    const existing = await db
      .select()
      .from(environmentalLog)
      .where(eq(environmentalLog.date, today))
      .limit(1);

    if (existing.length === 0) {
      // Crea nuovo record
      await db.insert(environmentalLog).values(snap);
      console.log(`[EnvLog] Nuovo record ambientale per ${today} (utente: ${username})`);
    } else if (snapshotChanged(existing[0], snap)) {
      // Aggiorna se i dati sono cambiati
      await db.update(environmentalLog)
        .set({ ...snap, recordedAt: new Date() })
        .where(eq(environmentalLog.date, today));
      console.log(`[EnvLog] Record ambientale aggiornato per ${today} (dati cambiati)`);
    } else {
      console.log(`[EnvLog] Nessuna variazione per ${today} — record invariato`);
    }
  } catch (e) {
    console.error('[EnvLog] Errore durante la registrazione:', e);
  }
}

export async function getEnvironmentalHistory(days = 90): Promise<any[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split('T')[0];

  const rows = await db
    .select()
    .from(environmentalLog)
    .orderBy(desc(environmentalLog.date));

  return rows.filter(r => r.date >= sinceStr);
}

export async function getAllEnvironmentalLog(): Promise<any[]> {
  return db.select().from(environmentalLog).orderBy(desc(environmentalLog.date));
}
