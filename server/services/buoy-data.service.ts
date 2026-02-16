import fetch from 'node-fetch';

interface BuoyReading {
  temperatura?: number;
  ph?: number;
  salinita?: number;
  ossigenoMgL?: number;
  ossigenoSat?: number;
  torbidita?: number;
  clorofilla?: number;
  livelloMare?: number;
  conducibilita?: number;
}

export interface BuoyStation {
  id: string;
  nome: string;
  lat: number;
  lon: number;
  comune?: string;
  provincia?: string;
  fonte: 'ARPAE' | 'ARPAV';
  attiva: boolean;
  ultimaLettura?: BuoyReading;
  timestamp?: string;
}

interface CacheEntry {
  data: BuoyStation[];
  fetchedAt: number;
}

const CACHE_TTL_MS = 15 * 60 * 1000;

let arpaeCache: CacheEntry | null = null;
let arpavCache: CacheEntry | null = null;

function isCacheValid(cache: CacheEntry | null): boolean {
  if (!cache) return false;
  return Date.now() - cache.fetchedAt < CACHE_TTL_MS;
}

function isSensorFaulty(reading: BuoyReading): boolean {
  if (reading.temperatura === 0 && reading.ph === 0 && reading.salinita === 0) return true;
  return false;
}

function cleanReading(reading: BuoyReading): BuoyReading {
  const clean = { ...reading };
  if (clean.temperatura === 0) clean.temperatura = undefined;
  if (clean.ph === 0) clean.ph = undefined;
  if (clean.salinita === 0) clean.salinita = undefined;
  return clean;
}

async function fetchArpaeData(): Promise<BuoyStation[]> {
  if (isCacheValid(arpaeCache)) return arpaeCache!.data;

  try {
    const response = await fetch('https://apps.arpae.it/REST/meteo_marefe/?sort=_id', {
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error(`ARPAE HTTP ${response.status}`);
    const json = await response.json() as any;
    const items = json._items || [];

    const stations: BuoyStation[] = [];

    for (const item of items) {
      const nome = item.anagrafica?.nome;
      if (!nome) continue;

      const coords = item.anagrafica?.geometry?.coordinates;
      if (!coords || coords.length < 2) continue;

      const lat = coords[1];
      const lon = coords[0];

      let reading: BuoyReading = {};
      let timestamp: string | undefined;

      if (item.dati) {
        const days = Object.keys(item.dati).sort();
        if (days.length > 0) {
          const latestDay = days[days.length - 1];
          const times = Object.keys(item.dati[latestDay]).sort();
          if (times.length > 0) {
            const latestTime = times[times.length - 1];
            const r = item.dati[latestDay][latestTime];

            reading = {
              temperatura: r.temperatura_acqua_mare,
              ph: r.ph_acqua,
              salinita: r.salinita_istantanea,
              ossigenoMgL: r.ossigeno_acqua != null ? r.ossigeno_acqua * 1000 : undefined,
              ossigenoSat: r.ossigeno_disciolto,
              torbidita: r.torbidita,
              clorofilla: r.clorofilla_a,
              livelloMare: r.livello_mare_igm_pressione
            };

            timestamp = `${latestDay.substring(0,4)}-${latestDay.substring(4,6)}-${latestDay.substring(6,8)}T${latestTime.substring(0,2)}:${latestTime.substring(2,4)}:00`;
          }
        }
      }

      if (isSensorFaulty(reading)) continue;
      reading = cleanReading(reading);

      stations.push({
        id: `arpae_${item._id || nome.toLowerCase().replace(/\s+/g, '_')}`,
        nome,
        lat,
        lon,
        comune: item.anagrafica?.comune,
        provincia: item.anagrafica?.provincia,
        fonte: 'ARPAE',
        attiva: true,
        ultimaLettura: Object.keys(reading).some(k => (reading as any)[k] !== undefined) ? reading : undefined,
        timestamp
      });
    }

    arpaeCache = { data: stations, fetchedAt: Date.now() };
    console.log(`[BuoyData] ARPAE: ${stations.length} stazioni caricate`);
    return stations;
  } catch (error) {
    console.error('[BuoyData] Errore ARPAE:', error);
    if (arpaeCache) return arpaeCache.data;
    return [];
  }
}

async function fetchWithRetry(url: string, timeoutMs: number, retries = 2): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      console.log(`[BuoyData] ARPAV retry ${attempt + 1} for ${url.split('/').pop()}`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

async function fetchArpavData(): Promise<BuoyStation[]> {
  if (isCacheValid(arpavCache)) return arpavCache!.data;

  try {
    const [stationsRes, dataRes] = await Promise.all([
      fetchWithRetry('https://api.arpa.veneto.it/REST/v1/acqua_boe_stazioni_point', 20000),
      fetchWithRetry('https://api.arpa.veneto.it/REST/v1/acqua_boe_dati', 20000)
    ]);


    const stationsJson = await stationsRes.json() as any;
    const dataJson = await dataRes.json() as any;

    const rawStations = stationsJson.data || [];
    console.log(`[BuoyData] ARPAV raw: ${rawStations.length} stazioni, ${(dataJson.data || []).length} record dati`);
    const allData = dataJson.data || [];

    const stationMap = new Map<number, any>();
    for (const s of rawStations) {
      stationMap.set(s.codseqst, s);
    }

    const dataByStation = new Map<number, any[]>();
    for (const d of allData) {
      if (!dataByStation.has(d.CODSEQST)) {
        dataByStation.set(d.CODSEQST, []);
      }
      dataByStation.get(d.CODSEQST)!.push(d);
    }

    const stations: BuoyStation[] = [];

    for (const [codseqst, stationInfo] of stationMap.entries()) {
      let lat = 0, lon = 0;
      try {
        const geo = JSON.parse(stationInfo.geometria);
        lat = geo.coordinates[1];
        lon = geo.coordinates[0];
      } catch {
        continue;
      }

      const items = dataByStation.get(codseqst) || [];

      const latestByParamUdm = new Map<string, any>();
      for (const item of items) {
        const paramLower = (item.PARAMETRO || '').toLowerCase();
        const udm = (item.UDM || '').toLowerCase();
        const key = `${paramLower}||${udm}`;
        const existing = latestByParamUdm.get(key);
        if (!existing || item.DATA > existing.DATA) {
          latestByParamUdm.set(key, item);
        }
      }

      function findParam(paramSubstr: string, udmSubstr?: string): any {
        for (const [key, val] of latestByParamUdm.entries()) {
          const [p, u] = key.split('||');
          if (p.includes(paramSubstr.toLowerCase())) {
            if (udmSubstr === undefined || u.includes(udmSubstr.toLowerCase())) {
              return val;
            }
          }
        }
        return null;
      }

      const temp = findParam('temperatura');
      const ph = findParam('ph');
      const sal = findParam('salinit');
      const o2mg = findParam('ossigeno', 'mg');
      const o2sat = findParam('ossigeno', 'sat');
      const chl = findParam('clorofilla');
      const cond = findParam('conducibilit');

      const reading: BuoyReading = {
        temperatura: temp?.MEDIA,
        ph: ph?.MEDIA,
        salinita: sal?.MEDIA,
        ossigenoMgL: o2mg?.MEDIA,
        ossigenoSat: o2sat?.MEDIA,
        clorofilla: chl?.MEDIA,
        conducibilita: cond?.MEDIA
      };

      const latestTimestamp = [temp, ph, sal, o2mg, o2sat, chl, cond]
        .filter(Boolean)
        .map((d: any) => d.DATA)
        .sort()
        .pop();

      if (isSensorFaulty(reading)) continue;
      const cleaned = cleanReading(reading);

      stations.push({
        id: `arpav_${codseqst}`,
        nome: stationInfo.nome,
        lat,
        lon,
        fonte: 'ARPAV',
        attiva: stationInfo.attiva === 'S',
        ultimaLettura: Object.keys(cleaned).some(k => (cleaned as any)[k] !== undefined) ? cleaned : undefined,
        timestamp: latestTimestamp || undefined
      });
    }

    arpavCache = { data: stations, fetchedAt: Date.now() };
    console.log(`[BuoyData] ARPAV: ${stations.length} stazioni caricate`);
    return stations;
  } catch (error) {
    console.error('[BuoyData] Errore ARPAV:', error);
    if (arpavCache) return arpavCache.data;
    return getArpavFallbackStations();
  }
}

function getArpavFallbackStations(): BuoyStation[] {
  return [
    {
      id: 'arpav_vallona',
      nome: 'Vallona',
      lat: 45.0547,
      lon: 12.3283,
      fonte: 'ARPAV',
      attiva: true,
      ultimaLettura: undefined,
      timestamp: undefined
    }
  ];
}

export async function getAllBuoyStations(): Promise<{ arpae: BuoyStation[], arpav: BuoyStation[] }> {
  const [arpae, arpav] = await Promise.all([fetchArpaeData(), fetchArpavData()]);
  return { arpae, arpav };
}

export function invalidateBuoyCache(): void {
  arpaeCache = null;
  arpavCache = null;
}
