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
  temperature: number | null;
  ph: number | null;
  nh3: number | null;
  nh4: number | null;
  o2: number | null;
  lux: number | null;
  par: number | null;
  kelvin: number | null;
}

export async function fetchCurrentReading(): Promise<CurrentReading> {
  const deviceId = await resolveDeviceId();
  const exps = await seneyeGet<SeneyeExps>(`/devices/${deviceId}/exps`);
  return {
    deviceId,
    deviceName: TARGET_DEVICE_NAME,
    temperature: toNum(exps.temperature?.curr),
    ph: toNum(exps.ph?.curr),
    nh3: toNum(exps.nh3?.curr),
    nh4: toNum(exps.nh4?.curr),
    o2: toNum(exps.o2?.curr),
    lux: toNum(exps.lux?.curr),
    par: toNum(exps.par?.curr),
    kelvin: toNum(exps.kelvin?.curr),
  };
}

// Legge la lettura corrente dall'API e la salva in DB (uno snapshot).
export async function pollAndStore(): Promise<SeneyeReading> {
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
