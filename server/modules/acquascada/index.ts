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

export const acquascadaRoutes = router;
