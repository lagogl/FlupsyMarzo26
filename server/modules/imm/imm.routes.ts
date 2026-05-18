import { Router, Request, Response } from "express";
import { computeInventoryIMM, computeCycleIMM, DEFAULT_IMM_CONFIG } from "./imm.service";

export const immRoutes = Router();

function parseConfig(req: Request) {
  const q = req.query;
  const cfg: any = {};
  if (q.targetSizeCode && typeof q.targetSizeCode === "string") cfg.targetSizeCode = q.targetSizeCode;
  if (q.horizonDays) cfg.horizonDays = Number(q.horizonDays);
  if (q.weightSize) cfg.weightSize = Number(q.weightSize);
  if (q.weightTime) cfg.weightTime = Number(q.weightTime);
  if (q.fallbackSgrDaily) cfg.fallbackSgrDaily = Number(q.fallbackSgrDaily);
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
