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

export interface ArpavStation {
  id: string;
  nome: string;
  lat: number;
  lon: number;
  comune?: string;
  provincia?: string;
  fonte: "ARPAV";
  attiva: boolean;
  ultimaLettura?: BuoyReading;
  timestamp?: string;
}

let arpavCache: { data: ArpavStation[]; fetchedAt: number } | null = null;
const CACHE_TTL = 15 * 60 * 1000;

function isSensorFaulty(r: BuoyReading): boolean {
  return r.temperatura === 0 && r.ph === 0 && r.salinita === 0;
}

export async function fetchArpavFromBrowser(): Promise<ArpavStation[]> {
  if (arpavCache && Date.now() - arpavCache.fetchedAt < CACHE_TTL) {
    return arpavCache.data;
  }

  try {
    const [stationsRes, dataRes] = await Promise.all([
      fetch("https://api.arpa.veneto.it/REST/v1/acqua_boe_stazioni_point"),
      fetch("https://api.arpa.veneto.it/REST/v1/acqua_boe_dati"),
    ]);

    if (!stationsRes.ok || !dataRes.ok) {
      throw new Error(`HTTP error: stations=${stationsRes.status}, data=${dataRes.status}`);
    }

    const stationsJson = (await stationsRes.json()) as any;
    const dataJson = (await dataRes.json()) as any;

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

    const stations: ArpavStation[] = [];

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
        const paramName = (item.PARAMETRO || "").trim();
        const udm = (item.UDM || "").trim();
        const key = `${paramName}||${udm}`;
        const existing = latestByParam.get(key);
        if (!existing || item.DATA > existing.DATA) {
          latestByParam.set(key, item);
        }
      }

      function findParam(paramSubstr: string, udmSubstr?: string): any {
        for (const [key, val] of latestByParam.entries()) {
          const [p, u] = key.split("||");
          if (p.toLowerCase().includes(paramSubstr.toLowerCase())) {
            if (udmSubstr === undefined || u.toLowerCase().includes(udmSubstr.toLowerCase())) {
              return val;
            }
          }
        }
        return null;
      }

      const temp = findParam("Temperatura");
      const ph = findParam("pH");
      const sal = findParam("Salinit");
      const o2mg = findParam("Ossigeno", "mg");
      const o2sat = findParam("Ossigeno", "%");
      const chl = findParam("Clorofilla");
      const cond = findParam("Conducibilit");

      const reading: BuoyReading = {
        temperatura: temp?.MEDIA ?? undefined,
        ph: ph?.MEDIA ?? undefined,
        salinita: sal?.MEDIA ?? undefined,
        ossigenoMgL: o2mg?.MEDIA ?? undefined,
        ossigenoSat: o2sat?.MEDIA ?? undefined,
        clorofilla: chl?.MEDIA ?? undefined,
        conducibilita: cond?.MEDIA ?? undefined,
      };

      if (reading.temperatura === 0) reading.temperatura = undefined;
      if (reading.ph === 0) reading.ph = undefined;
      if (reading.salinita === 0) reading.salinita = undefined;

      if (isSensorFaulty(reading)) continue;

      const latestTimestamp = [temp, ph, sal, o2mg, o2sat, chl, cond]
        .filter(Boolean)
        .map((d: any) => d.DATA)
        .sort()
        .pop();

      const hasAnyData = Object.values(reading).some((v) => v !== undefined);

      stations.push({
        id: `arpav_${codseqst}`,
        nome: stationInfo.nome,
        lat,
        lon,
        fonte: "ARPAV",
        attiva: stationInfo.attiva === "S",
        ultimaLettura: hasAnyData ? reading : undefined,
        timestamp: latestTimestamp || undefined,
      });
    }

    console.log(`[ARPAV Browser] ${stations.length} stazioni caricate con dati reali`);
    arpavCache = { data: stations, fetchedAt: Date.now() };
    return stations;
  } catch (error) {
    console.error("[ARPAV Browser] Errore:", error);
    if (arpavCache) return arpavCache.data;
    return [];
  }
}
