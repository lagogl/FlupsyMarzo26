import { Router, Request, Response } from "express";
import {
  computeInventoryIMM,
  computeCycleIMM,
  DEFAULT_IMM_CONFIG,
  saveDailySnapshot,
  getSnapshotHistory,
} from "./imm.service";

export const immRoutes = Router();

function parseConfig(req: Request) {
  const q = req.query;
  const cfg: any = {};
  if (q.targetSizeCode && typeof q.targetSizeCode === "string") cfg.targetSizeCode = q.targetSizeCode;
  if (q.horizonDays) cfg.horizonDays = Number(q.horizonDays);
  if (q.weightSize) cfg.weightSize = Number(q.weightSize);
  if (q.weightTime) cfg.weightTime = Number(q.weightTime);
  if (q.weightQuality) cfg.weightQuality = Number(q.weightQuality);
  if (q.weightReliability) cfg.weightReliability = Number(q.weightReliability);
  if (q.fallbackSgrDaily) cfg.fallbackSgrDaily = Number(q.fallbackSgrDaily);
  if (q.baselineMortalityPct) cfg.baselineMortalityPct = Number(q.baselineMortalityPct);
  if (q.maxMortalityPct) cfg.maxMortalityPct = Number(q.maxMortalityPct);
  return cfg;
}

immRoutes.get("/inventory", async (req: Request, res: Response) => {
  try {
    const cfg = parseConfig(req);
    const data = await computeInventoryIMM(cfg);
    res.json({ success: true, data });
  } catch (e: any) {
    console.error("IMM inventory error:", e);
    res.status(500).json({ success: false, message: e?.message || "Errore calcolo IMM" });
  }
});

immRoutes.get("/cycle/:cycleId", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.cycleId);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "cycleId non valido" });
    const cfg = parseConfig(req);
    const data = await computeCycleIMM(id, cfg);
    if (!data) return res.status(404).json({ success: false, message: "Ciclo non trovato o non attivo" });
    res.json({ success: true, data });
  } catch (e: any) {
    console.error("IMM cycle error:", e);
    res.status(500).json({ success: false, message: e?.message || "Errore calcolo IMM ciclo" });
  }
});

immRoutes.get("/config/defaults", (_req: Request, res: Response) => {
  res.json({ success: true, data: DEFAULT_IMM_CONFIG });
});

// Storia snapshot (per trend chart)
immRoutes.get("/history", async (req: Request, res: Response) => {
  try {
    const scope = typeof req.query.scope === "string" ? req.query.scope : "global";
    const scopeId = req.query.scopeId ? Number(req.query.scopeId) : null;
    const targetSizeCode = typeof req.query.targetSizeCode === "string" ? req.query.targetSizeCode : undefined;
    const fromDate = typeof req.query.fromDate === "string" ? req.query.fromDate : undefined;
    const toDate = typeof req.query.toDate === "string" ? req.query.toDate : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const data = await getSnapshotHistory({ scope, scopeId, targetSizeCode, fromDate, toDate, limit });
    res.json({ success: true, data });
  } catch (e: any) {
    console.error("IMM history error:", e);
    res.status(500).json({ success: false, message: e?.message || "Errore lettura storico IMM" });
  }
});

// Trigger manuale snapshot (admin / scheduler)
immRoutes.post("/snapshot", async (req: Request, res: Response) => {
  try {
    const cfg = parseConfig(req);
    const date = typeof req.query.date === "string" ? req.query.date : undefined;
    const out = await saveDailySnapshot(cfg, date);
    res.json({ success: true, ...out });
  } catch (e: any) {
    console.error("IMM snapshot error:", e);
    res.status(500).json({ success: false, message: e?.message || "Errore snapshot IMM" });
  }
});
