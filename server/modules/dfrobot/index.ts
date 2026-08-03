import { Router, type Request, type Response } from "express";

/**
 * Sonda ossigeno Ca' Pisani (DF Robot) via app Supervisore Delta Futuro.
 * API pubblica protetta da header X-API-Key (secret SUPERVISORE_API_KEY).
 */

const router = Router();

const BASE_URL =
  process.env.SUPERVISORE_BASE_URL ||
  "https://supervisore-delta-futuro-copia.replit.app";

const CACHE_TTL_MS = 30 * 1000;
let cache: { at: number; data: any } | null = null;

async function fetchSupervisore(path: string): Promise<any> {
  const apiKey = process.env.SUPERVISORE_API_KEY;
  if (!apiKey) {
    const err: any = new Error("SUPERVISORE_API_KEY non configurata");
    err.status = 503;
    throw err;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { "X-API-Key": apiKey },
      signal: controller.signal,
    });
    if (!res.ok) {
      const err: any = new Error(`Supervisore HTTP ${res.status}`);
      err.status = res.status === 401 || res.status === 403 ? 502 : 502;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

// Valori attuali della sonda ossigeno Ca' Pisani (DF Robot)
router.get("/measurements", async (_req: Request, res: Response) => {
  try {
    if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
      return res.json(cache.data);
    }

    const raw = await fetchSupervisore("/api/public/v1/measurements");
    const probe = raw?.oxygenProbeCaPisani ?? null;

    const data = {
      timestamp: new Date().toISOString(),
      probe, // { saturation, oxygen (mg/L), temperature, online/offline... } come fornito dall'API
    };

    cache = { at: Date.now(), data };
    res.json(data);
  } catch (err: any) {
    console.error("[DF Robot] Errore misure:", err.message);
    res
      .status(err.status || 502)
      .json({ error: "Dati sonda DF Robot non disponibili" });
  }
});

// Storico: param = bbsat | bbmgl | bbtemp
const ALLOWED_PARAMS = new Set(["bbsat", "bbmgl", "bbtemp"]);

router.get("/history", async (req: Request, res: Response) => {
  try {
    const param = String(req.query.param || "bbsat");
    if (!ALLOWED_PARAMS.has(param)) {
      return res
        .status(400)
        .json({ error: "param non valido (bbsat, bbmgl, bbtemp)" });
    }
    const raw = await fetchSupervisore(
      `/api/public/v1/history?param=${encodeURIComponent(param)}`,
    );
    res.json(raw);
  } catch (err: any) {
    console.error("[DF Robot] Errore storico:", err.message);
    res
      .status(err.status || 502)
      .json({ error: "Storico sonda DF Robot non disponibile" });
  }
});

export const dfRobotRoutes = router;
