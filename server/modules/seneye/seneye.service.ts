import { db } from "../../db";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { seneyeReadings, type SeneyeReading } from "@shared/schema";

const SENEYE_BASE = "https://api.seneye.com/v1";
const TARGET_DEVICE_NAME = "DF SIFONI";

// Cache dell'id dispositivo risolto per nome (gli id Seneye sono stabili).
let cachedDeviceId: string | null = null;

interface SeneyeDevice {
  id: string;
  description: string;
  type: string;
  time_diff: string;
}

interface SeneyeExpValue {
  curr?: string | number | null;
  avg?: string | number | null;
  trend?: string | number | null;
}

interface SeneyeExps {
  temperature?: SeneyeExpValue;
  ph?: SeneyeExpValue;
  nh3?: SeneyeExpValue;
  nh4?: SeneyeExpValue;
  o2?: SeneyeExpValue;
  lux?: SeneyeExpValue;
  par?: SeneyeExpValue;
  kelvin?: SeneyeExpValue;
}

function getCredentials(): { user: string; pwd: string } | null {
  const user = process.env.SENEYE_USERNAME || process.env.SENEYE_USER;
  const pwd = process.env.SENEYE_PASSWORD || process.env.SENEYE_PWD;
  if (!user || !pwd) return null;
  return { user, pwd };
}

function buildUrl(path: string): string | null {
  const creds = getCredentials();
  if (!creds) return null;
  const params = new URLSearchParams({ user: creds.user, pwd: creds.pwd });
  return `${SENEYE_BASE}${path}?${params.toString()}`;
}

async function seneyeGet<T>(path: string): Promise<T> {
  const url = buildUrl(path);
  if (!url) {
    throw new Error("Credenziali Seneye mancanti (SENEYE_USERNAME / SENEYE_PASSWORD)");
  }
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Errore API Seneye (${res.status}): ${res.statusText}`);
  }
  return (await res.json()) as T;
}

function toNum(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

// Normalizza il trend Seneye: "1" = in salita, "-1" = in discesa, "0" = stabile.
function toTrend(v: string | number | null | undefined): number | null {
  const n = toNum(v);
  if (n === null) return null;
  if (n > 0) return 1;
  if (n < 0) return -1;
  return 0;
}

export async function fetchDevices(): Promise<SeneyeDevice[]> {
  return await seneyeGet<SeneyeDevice[]>("/devices");
}

// Risolve l'id del dispositivo "DF SIFONI" per nome (più robusto dell'id hard-coded).
export async function resolveDeviceId(forceRefresh = false): Promise<string> {
  if (cachedDeviceId && !forceRefresh) return cachedDeviceId;
  const devices = await fetchDevices();
  const match = devices.find(
    (d) => d.description?.trim().toUpperCase() === TARGET_DEVICE_NAME.toUpperCase()
  );
  if (!match) {
    throw new Error(`Sonda "${TARGET_DEVICE_NAME}" non trovata nell'account Seneye`);
  }
  cachedDeviceId = match.id;
  return match.id;
}

export interface CurrentReading {
  deviceId: string;
  deviceName: string;
  recordDate: string;
  temperature: number | null;
  ph: number | null;
  nh3: number | null;
  nh4: number | null;
  o2: number | null;
  lux: number | null;
  par: number | null;
  kelvin: number | null;
  temperatureTrend: number | null;
  phTrend: number | null;
  nh3Trend: number | null;
  o2Trend: number | null;
}

export async function fetchCurrentReading(): Promise<CurrentReading> {
  const deviceId = await resolveDeviceId();
  const exps = await seneyeGet<SeneyeExps>(`/devices/${deviceId}/exps`);
  return {
    deviceId,
    deviceName: TARGET_DEVICE_NAME,
    recordDate: new Date().toISOString(),
    temperature: toNum(exps.temperature?.curr),
    ph: toNum(exps.ph?.curr),
    nh3: toNum(exps.nh3?.curr),
    nh4: toNum(exps.nh4?.curr),
    o2: toNum(exps.o2?.curr),
    lux: toNum(exps.lux?.curr),
    par: toNum(exps.par?.curr),
    kelvin: toNum(exps.kelvin?.curr),
    temperatureTrend: toTrend(exps.temperature?.trend),
    phTrend: toTrend(exps.ph?.trend),
    nh3Trend: toTrend(exps.nh3?.trend),
    o2Trend: toTrend(exps.o2?.trend),
  };
}

// Intervallo minimo tra due snapshot salvati (anti-abuso / anti-bloat).
// La sonda Seneye si aggiorna ogni ~30 min, quindi un dato ogni 5 min è più che sufficiente.
const MIN_POLL_INTERVAL_MS = 5 * 60 * 1000;

// Legge la lettura corrente dall'API e la salva in DB (uno snapshot).
// Se l'ultimo snapshot è troppo recente, restituisce quello esistente senza
// effettuare una nuova chiamata all'API esterna.
export async function pollAndStore(): Promise<SeneyeReading> {
  const last = await getLatestStored();
  if (last && Date.now() - new Date(last.recordDate).getTime() < MIN_POLL_INTERVAL_MS) {
    return last;
  }
  const r = await fetchCurrentReading();
  const [row] = await db
    .insert(seneyeReadings)
    .values({
      deviceId: r.deviceId,
      deviceName: r.deviceName,
      recordDate: new Date(),
      temperature: r.temperature,
      ph: r.ph,
      nh3: r.nh3,
      nh4: r.nh4,
      o2: r.o2,
      lux: r.lux,
      par: r.par,
      kelvin: r.kelvin,
    })
    .returning();
  return row;
}

export async function getLatestStored(): Promise<SeneyeReading | null> {
  const [row] = await db
    .select()
    .from(seneyeReadings)
    .orderBy(desc(seneyeReadings.recordDate))
    .limit(1);
  return row ?? null;
}

export interface CurrentForCard {
  source: "stored" | "live";
  reading: SeneyeReading;
  measuredAt: string;
}

// Restituisce la lettura da mostrare nella dashboard con l'orario EFFETTIVO
// dell'ultima misura.
//
// NB: l'API Seneye di questo account NON espone alcun timestamp della misura
// (né `last_experiment` né un orario per-lettura). L'unico orario reale a
// disposizione è quello con cui lo scheduler ha acquisito e salvato lo snapshot
// (ogni ~30 minuti). Per questo NON usiamo l'ora della richiesta/collegamento,
// ma la data dell'ultimo snapshot salvato. Se lo snapshot è troppo vecchio
// (scheduler fermo), forziamo una nuova lettura: in quel caso "ora" è davvero
// il momento dell'acquisizione fresca.
const STALE_THRESHOLD_MS = 31 * 60 * 1000;

export async function getCurrentForCard(): Promise<CurrentForCard> {
  let last = await getLatestStored();
  const isStale =
    !last || Date.now() - new Date(last.recordDate).getTime() > STALE_THRESHOLD_MS;
  if (isStale) {
    // pollAndStore lancia un errore se l'API non è raggiungibile: in tal caso
    // il controller ripiega sull'ultimo dato salvato (se esiste).
    last = await pollAndStore();
  }
  return {
    source: "stored",
    reading: last!,
    measuredAt: new Date(last!.recordDate).toISOString(),
  };
}

export async function getReadings(opts: {
  from?: Date;
  to?: Date;
  limit?: number;
}): Promise<SeneyeReading[]> {
  const conditions = [];
  if (opts.from) conditions.push(gte(seneyeReadings.recordDate, opts.from));
  if (opts.to) conditions.push(lte(seneyeReadings.recordDate, opts.to));

  const where = conditions.length ? and(...conditions) : undefined;

  return await db
    .select()
    .from(seneyeReadings)
    .where(where)
    .orderBy(desc(seneyeReadings.recordDate))
    .limit(opts.limit ?? 2000);
}

export function isConfigured(): boolean {
  return getCredentials() !== null;
}
