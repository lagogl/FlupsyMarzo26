import { Router, type Request, type Response } from "express";

const BASE_URL = "https://supervisore-delta-futuro-copia.replit.app";

const router = Router();

let cache: { data: any; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 10_000;

router.get("/measurements", async (_req: Request, res: Response) => {
  const apiKey = process.env.ACQUASCADA_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "ACQUASCADA_API_KEY non configurata" });
  }

  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return res.json(cache.data);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${BASE_URL}/api/public/v1/measurements`, {
      headers: { "X-API-Key": apiKey },
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`[AcquaSCADA] HTTP ${response.status}: ${body.slice(0, 200)}`);
      if (cache) return res.json(cache.data);
      return res.status(502).json({ error: `Servizio AcquaSCADA non disponibile (HTTP ${response.status})` });
    }

    const data = await response.json();
    cache = { data, fetchedAt: Date.now() };
    return res.json(data);
  } catch (err: any) {
    console.error("[AcquaSCADA] Errore fetch:", err?.message || err);
    if (cache) return res.json(cache.data);
    return res.status(502).json({ error: "Impossibile contattare il servizio AcquaSCADA" });
  } finally {
    clearTimeout(timeout);
  }
});

const VALID_PARAMS = new Set(["o2sat", "o2mgl", "o2temp", "vasca", "laguna"]);

const historyCache = new Map<string, { data: any; fetchedAt: number }>();
const HISTORY_CACHE_TTL_MS = 60_000;

async function fetchHistoryChunk(
  apiKey: string,
  parameter: string,
  fromISO: string,
  toISO: string,
  limit: number,
): Promise<any | null> {
  const url = new URL(`${BASE_URL}/api/public/v1/history`);
  url.searchParams.set("parameter", parameter);
  url.searchParams.set("from", fromISO);
  url.searchParams.set("to", toISO);
  url.searchParams.set("limit", String(limit));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      headers: { "X-API-Key": apiKey },
      signal: controller.signal,
    });
    if (!response.ok) {
      console.error(`[AcquaSCADA] history HTTP ${response.status} (${fromISO} → ${toISO})`);
      return null;
    }
    return await response.json();
  } catch (err: any) {
    console.error("[AcquaSCADA] history errore chunk:", err?.message || err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

router.get("/history", async (req: Request, res: Response) => {
  const apiKey = process.env.ACQUASCADA_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "ACQUASCADA_API_KEY non configurata" });
  }

  const parameter = String(req.query.parameter || "");
  if (!VALID_PARAMS.has(parameter)) {
    return res.status(400).json({ error: `Parametro non valido. Ammessi: ${[...VALID_PARAMS].join(", ")}` });
  }

  const to = new Date();
  let from: Date;
  if (req.query.from) {
    from = new Date(String(req.query.from));
    if (isNaN(from.getTime())) {
      return res.status(400).json({ error: "Data 'from' non valida" });
    }
  } else {
    from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
  }
  if (from >= to) {
    return res.status(400).json({ error: "'from' deve essere precedente a 'to'" });
  }

  // Cache: chiave arrotondata al minuto per evitare richieste ripetute
  const cacheKey = `${parameter}:${Math.floor(from.getTime() / 60_000)}`;
  const cached = historyCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < HISTORY_CACHE_TTL_MS) {
    return res.json(cached.data);
  }

  // I dati arrivano ogni ~5 secondi: su periodi lunghi il limite upstream (5000)
  // coprirebbe solo le ultime ~7 ore. Suddividiamo il periodo in massimo 24
  // sotto-intervalli e campioniamo ogni intervallo, poi riduciamo i punti.
  const spanMs = to.getTime() - from.getTime();
  const chunkCount = Math.min(24, Math.max(1, Math.ceil(spanMs / (60 * 60 * 1000))));
  const perChunkLimit = 200;

  // Massimo 6 richieste simultanee verso l'impianto per non sovraccaricarlo
  const CONCURRENCY = 6;
  const results: (any | null)[] = new Array(chunkCount).fill(null);
  for (let start = 0; start < chunkCount; start += CONCURRENCY) {
    const batch: Promise<void>[] = [];
    for (let i = start; i < Math.min(start + CONCURRENCY, chunkCount); i++) {
      const chunkFrom = new Date(from.getTime() + (spanMs * i) / chunkCount);
      const chunkTo = new Date(from.getTime() + (spanMs * (i + 1)) / chunkCount);
      batch.push(
        fetchHistoryChunk(apiKey, parameter, chunkFrom.toISOString(), chunkTo.toISOString(), perChunkLimit)
          .then((r) => { results[i] = r; }),
      );
    }
    await Promise.all(batch);
  }
  const okResults = results.filter((r) => r !== null);
  if (okResults.length === 0) {
    return res.status(502).json({ error: "Impossibile recuperare lo storico da AcquaSCADA" });
  }

  let readings: { value: number; timestamp: string }[] = [];
  for (const r of okResults) {
    if (Array.isArray(r.readings)) readings.push(...r.readings);
  }
  readings.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Riduzione uniforme a massimo 1000 punti
  const MAX_POINTS = 1000;
  if (readings.length > MAX_POINTS) {
    const stride = readings.length / MAX_POINTS;
    const sampled: typeof readings = [];
    for (let i = 0; i < MAX_POINTS; i++) {
      sampled.push(readings[Math.floor(i * stride)]);
    }
    readings = sampled;
  }

  const meta = okResults[0];
  const payload = {
    parameter,
    description: meta.description ?? null,
    unit: meta.unit ?? null,
    from: from.toISOString(),
    to: to.toISOString(),
    count: readings.length,
    readings,
  };

  // Mantieni la cache piccola
  if (historyCache.size > 50) historyCache.clear();
  historyCache.set(cacheKey, { data: payload, fetchedAt: Date.now() });

  return res.json(payload);
});

export const acquascadaRoutes = router;
