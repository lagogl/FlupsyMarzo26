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

async function fetchArpavData(): Promise<BuoyStation[]> {
  if (isCacheValid(arpavCache)) return arpavCache!.data;

  try {
    const [stationsRes, dataRes] = await Promise.all([
      fetch('https://api.arpa.veneto.it/REST/v1/acqua_boe_stazioni_point', { signal: AbortSignal.timeout(15000) }),
      fetch('https://api.arpa.veneto.it/REST/v1/acqua_boe_dati', { signal: AbortSignal.timeout(15000) })
    ]);

    if (!stationsRes.ok) throw new Error(`ARPAV stations HTTP ${stationsRes.status}`);
    if (!dataRes.ok) throw new Error(`ARPAV data HTTP ${dataRes.status}`);

    const stationsJson = await stationsRes.json() as any;
    const dataJson = await dataRes.json() as any;

    const rawStations = stationsJson.data || [];
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

      const latestByParam = new Map<string, any>();
      for (const item of items) {
        const key = `${item.PARAMETRO}_${item.UDM}`;
        const existing = latestByParam.get(key);
        if (!existing || item.DATA > existing.DATA) {
          latestByParam.set(key, item);
        }
      }

      const temp = latestByParam.get('Temperatura acqua_°C');
      const ph = latestByParam.get('pH misurato a campo_');
      const sal = latestByParam.get('Salinità_PSU');
      const o2mg = latestByParam.get('Ossigeno disciolto_mg/l');
      const o2sat = latestByParam.get('Ossigeno disciolto_% di sat.');
      const chl = latestByParam.get('Clorofilla a_µg/L');
      const cond = latestByParam.get('Conducibilità_mS/cm');

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
        .map(d => d.DATA)
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
    return [];
  }
}

export async function getAllBuoyStations(): Promise<{ arpae: BuoyStation[], arpav: BuoyStation[] }> {
  const [arpae, arpav] = await Promise.all([fetchArpaeData(), fetchArpavData()]);
  return { arpae, arpav };
}

export function invalidateBuoyCache(): void {
  arpaeCache = null;
  arpavCache = null;
}
