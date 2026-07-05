import { Router, type Request, type Response } from "express";

const router = Router();

const BASE_URL = process.env.CAPISANI_BASE_URL || "https://kappa.sinplant.it";

// --- Gestione sessione (login Yii2 con CSRF + cookie) ---

type CookieJar = Map<string, string>;

let sessionJar: CookieJar | null = null;
let sessionCreatedAt = 0;
const SESSION_MAX_AGE_MS = 20 * 60 * 1000; // ri-login preventivo ogni 20 minuti

function collectCookies(res: globalThis.Response, jar: CookieJar) {
  let setCookies: string[] = (res.headers as any).getSetCookie?.() ?? [];
  if (setCookies.length === 0) {
    const raw = res.headers.get("set-cookie");
    // Fallback: separa più cookie uniti da virgola (mai dentro la data di "expires=")
    if (raw) setCookies = raw.split(/,(?=\s*[A-Za-z0-9_-]+=)/);
  }
  for (const c of setCookies) {
    const pair = c.split(";")[0];
    const idx = pair.indexOf("=");
    if (idx > 0) jar.set(pair.slice(0, idx).trim(), pair.slice(idx + 1));
  }
}

function cookieHeader(jar: CookieJar): string {
  return Array.from(jar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 15_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function login(): Promise<CookieJar> {
  const username = process.env.CAPISANI_USERNAME;
  const password = process.env.CAPISANI_PASSWORD;
  if (!username || !password) {
    throw new Error("Credenziali Ca' Pisani non configurate (CAPISANI_USERNAME/CAPISANI_PASSWORD)");
  }

  const jar: CookieJar = new Map();

  // 1. Pagina di login: cookie di sessione + token CSRF
  const loginPage = await fetchWithTimeout(`${BASE_URL}/login`, { redirect: "manual" });
  collectCookies(loginPage, jar);
  const html = await loginPage.text();
  const csrfMatch = html.match(/name="_csrf"\s+value="([^"]+)"/);
  if (!csrfMatch) throw new Error("Token CSRF non trovato nella pagina di login Ca' Pisani");

  // 2. POST credenziali
  const body = new URLSearchParams();
  body.set("_csrf", csrfMatch[1]);
  body.set("LoginForm[username]", username);
  body.set("LoginForm[password]", password);

  const loginRes = await fetchWithTimeout(`${BASE_URL}/login`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader(jar),
    },
    body: body.toString(),
  });
  collectCookies(loginRes, jar);

  if (loginRes.status !== 302 || !jar.has("_identity")) {
    throw new Error(`Login Ca' Pisani fallito (HTTP ${loginRes.status})`);
  }
  return jar;
}

async function fetchDashboardHtml(): Promise<string> {
  // Riusa la sessione se recente, altrimenti nuovo login
  if (!sessionJar || Date.now() - sessionCreatedAt > SESSION_MAX_AGE_MS) {
    sessionJar = await login();
    sessionCreatedAt = Date.now();
  }

  let res = await fetchWithTimeout(`${BASE_URL}/`, {
    redirect: "manual",
    headers: { Cookie: cookieHeader(sessionJar) },
  });

  // Sessione scaduta → redirect al login → riprova una volta
  if (res.status === 302) {
    sessionJar = await login();
    sessionCreatedAt = Date.now();
    res = await fetchWithTimeout(`${BASE_URL}/`, {
      redirect: "manual",
      headers: { Cookie: cookieHeader(sessionJar) },
    });
  }

  if (!res.ok) throw new Error(`Ca' Pisani HTTP ${res.status}`);
  const html = await res.text();
  if (html.includes("user-login-form")) {
    sessionJar = null;
    throw new Error("Sessione Ca' Pisani non valida");
  }
  return html;
}

// --- Parsing valori dall'HTML (valori con virgola decimale italiana) ---

function parseValue(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

interface CaPisaniUnit {
  name: string;
  oxygen: number | null;
  saturation: number | null;
  temperature: number | null;
}

function parseDashboard(html: string) {
  // Stato sistema (es. "Allarme", "Normale")
  const stateMatch = html.match(/Stato[\s\S]{0,200}?info-box-number">([^<]+)</i);

  // Data e ora mostrate dal pannello (gg/mm/aaaa + hh:mm:ss)
  let sourceTimestamp: string | null = null;
  const dtMatch = html.match(/Data e Ora[\s\S]{0,200}?info-box-number">(\d{2})\/(\d{2})\/(\d{4})<br\s*\/?>(\d{2}:\d{2}:\d{2})/i);
  if (dtMatch) {
    const [, dd, mm, yyyy, hhmmss] = dtMatch;
    sourceTimestamp = `${yyyy}-${mm}-${dd}T${hhmmss}`;
  }

  // Box unità (item-N con O2 / % / °C)
  const units: CaPisaniUnit[] = [];
  const itemBlocks = html.split(/<div class="item" id="item-/).slice(1);
  for (const block of itemBlocks) {
    const nameMatch = block.match(/<h4[^>]*><a[^>]*>([^<]+)<\/a>/);
    const oxygenMatch = block.match(/element oxygen[^>]*>O<sub>2<\/sub>\s*<span[^>]*>([^<]+)</);
    const saturationMatch = block.match(/element saturation[^>]*>%\s*<span[^>]*>([^<]+)</);
    const temperatureMatch = block.match(/element temperature[^>]*>°C\s*<span[^>]*>([^<]+)</);
    if (oxygenMatch || saturationMatch || temperatureMatch) {
      units.push({
        name: nameMatch ? nameMatch[1].trim() : `unità ${units.length + 1}`,
        oxygen: parseValue(oxygenMatch?.[1]),
        saturation: parseValue(saturationMatch?.[1]),
        temperature: parseValue(temperatureMatch?.[1]),
      });
    }
  }

  // Box salinità
  const salinityMatch = html.match(/SALINITÀ\s*<span[^>]*>([^<]+)</);
  const salinityTempMatch = html.match(/TEMP\.\s*<span[^>]*>([^<]+)</);

  // Box aria (in alto nel pannello): temperatura aria e saturazione O2 aria (p.p.m.)
  const airTempMatch = html.match(/Temperatura<br\s*\/?>Aria<\/span>[\s\S]{0,120}?info-box-number">([^<]+?)\s*°C/i);
  const airO2Match = html.match(/Saturazione<br\s*\/?>O<sub>2<\/sub>\s*Aria<\/span>[\s\S]{0,120}?info-box-number">([^<]+?)\s*p\.p\.m\./i);

  return {
    timestamp: new Date().toISOString(),
    sourceTimestamp,
    systemState: stateMatch ? stateMatch[1].trim() : null,
    units,
    salinity: {
      value: parseValue(salinityMatch?.[1]),
      temperature: parseValue(salinityTempMatch?.[1]),
    },
    air: {
      temperature: parseValue(airTempMatch?.[1]),
      o2Saturation: parseValue(airO2Match?.[1]),
    },
  };
}

// --- Endpoint con cache ---

let dataCache: { data: any; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 15_000;

router.get("/measurements", async (_req: Request, res: Response) => {
  if (dataCache && Date.now() - dataCache.fetchedAt < CACHE_TTL_MS) {
    return res.json(dataCache.data);
  }

  try {
    const html = await fetchDashboardHtml();
    const data = parseDashboard(html);
    dataCache = { data, fetchedAt: Date.now() };
    return res.json(data);
  } catch (err: any) {
    console.error("[CaPisani] Errore:", err?.message || err);
    if (dataCache) return res.json(dataCache.data);
    return res.status(502).json({ error: "Impossibile contattare il sistema Ca' Pisani" });
  }
});

export const capisaniRoutes = router;
