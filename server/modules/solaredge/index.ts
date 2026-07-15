import { Router, type Request, type Response } from "express";

const router = Router();

const BASE_URL = "https://monitoringapi.solaredge.com";

// Cache lato server: SolarEdge limita a ~300 richieste/giorno per impianto.
// Con cache a 5 minuti restiamo a ~288 chiamate/giorno anche con polling continuo.
const CACHE_TTL_MS = 5 * 60 * 1000;

interface SolarStatus {
  configured: boolean;
  powerW: number | null; // potenza istantanea in Watt
  energyTodayWh: number | null; // energia prodotta oggi in Wh
  lastUpdateTime: string | null; // orario impianto (Europe/Rome)
  stale: boolean; // dato cloud più vecchio di 60 minuti
  alarm: boolean; // nessuna produzione in orario diurno
  error: string | null;
  fetchedAt: string;
}

let cache: { data: SolarStatus; at: number } | null = null;
let lastGood: SolarStatus | null = null;
let inFlight: Promise<SolarStatus> | null = null;

function romeHour(date = new Date()): number {
  return parseInt(
    new Intl.DateTimeFormat("it-IT", {
      timeZone: "Europe/Rome",
      hour: "2-digit",
      hour12: false,
    }).format(date),
    10
  );
}

function computeStale(lastUpdateTime: string | null): boolean {
  // Il cloud aggiorna ogni 5-15 min: oltre 60 min è anomalo.
  if (!lastUpdateTime) return false;
  // lastUpdateTime è in ora locale impianto (Europe/Rome), senza fuso.
  const nowRome = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" })
  ).getTime();
  const ts = new Date(lastUpdateTime.replace(" ", "T")).getTime();
  if (isNaN(ts)) return false;
  return nowRome - ts > 60 * 60 * 1000;
}

function computeAlarm(powerW: number | null, stale: boolean): boolean {
  // Allarme solo in orario diurno (8-18 ora italiana): di notte è normale non produrre.
  const h = romeHour();
  const isDaytime = h >= 8 && h < 18;
  if (!isDaytime) return false;
  if (stale) return true; // dati fermi da oltre un'ora in pieno giorno
  return powerW !== null && powerW < 50; // sotto 50 W = di fatto nessuna produzione
}

async function fetchStatus(): Promise<SolarStatus> {
  const apiKey = process.env.SOLAREDGE_API_KEY?.trim();
  const siteId = process.env.SOLAREDGE_SITE_ID?.trim();
  const now = new Date().toISOString();

  if (!apiKey || !siteId) {
    return {
      configured: false,
      powerW: null,
      energyTodayWh: null,
      lastUpdateTime: null,
      stale: false,
      alarm: false,
      error: "Credenziali SolarEdge non configurate",
      fetchedAt: now,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(
      `${BASE_URL}/site/${encodeURIComponent(siteId)}/overview?api_key=${encodeURIComponent(apiKey)}`,
      { signal: controller.signal }
    );
    if (!res.ok) {
      throw new Error(
        res.status === 401 || res.status === 403
          ? "Chiave API SolarEdge non valida"
          : res.status === 429
            ? "Limite giornaliero richieste SolarEdge superato"
            : `SolarEdge API errore ${res.status}`
      );
    }
    const json: any = await res.json();
    const overview = json?.overview;
    const powerW = typeof overview?.currentPower?.power === "number" ? overview.currentPower.power : null;
    const energyTodayWh = typeof overview?.lastDayData?.energy === "number" ? overview.lastDayData.energy : null;
    const lastUpdateTime: string | null = overview?.lastUpdateTime ?? null;

    const stale = computeStale(lastUpdateTime);

    const status: SolarStatus = {
      configured: true,
      powerW,
      energyTodayWh,
      lastUpdateTime,
      stale,
      alarm: computeAlarm(powerW, stale),
      error: null,
      fetchedAt: now,
    };
    lastGood = status;
    return status;
  } catch (err: any) {
    // In caso di errore manteniamo l'ultimo valore valido invece di mostrare zero,
    // ma ricalcoliamo "stale" e "alarm" sull'orario attuale.
    if (lastGood) {
      const stale = computeStale(lastGood.lastUpdateTime);
      return {
        ...lastGood,
        stale,
        alarm: computeAlarm(lastGood.powerW, stale),
        error: `Dato non aggiornato: ${err?.message || "errore di rete"}`,
        fetchedAt: now,
      };
    }
    return {
      configured: true,
      powerW: null,
      energyTodayWh: null,
      lastUpdateTime: null,
      stale: false,
      alarm: false,
      error: err?.name === "AbortError" ? "Timeout SolarEdge (15s)" : err?.message || "Errore SolarEdge",
      fetchedAt: now,
    };
  } finally {
    clearTimeout(timeout);
  }
}

router.get("/status", async (_req: Request, res: Response) => {
  try {
    if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
      // Ricalcola stale/allarme sull'ora corrente (i dati in cache invecchiano)
      const stale = computeStale(cache.data.lastUpdateTime);
      return res.json({ ...cache.data, stale, alarm: computeAlarm(cache.data.powerW, stale), cached: true });
    }
    if (!inFlight) {
      inFlight = fetchStatus().finally(() => {
        inFlight = null;
      });
      const data = await inFlight;
      // Cache di 5 minuti anche in caso di errore: rispetta il budget di
      // ~300 richieste/giorno imposto da SolarEdge.
      cache = { data, at: Date.now() };
      return res.json(data);
    }
    const data = await inFlight;
    return res.json(data);
  } catch (error: any) {
    console.error("Errore SolarEdge status:", error);
    res.status(500).json({ error: "Errore lettura dati fotovoltaico" });
  }
});

export const solaredgeRoutes = router;
