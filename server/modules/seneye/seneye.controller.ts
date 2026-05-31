import type { Request, Response } from "express";
import * as service from "./seneye.service";

export const seneyeController = {
  async getStatus(_req: Request, res: Response) {
    res.json({ configured: service.isConfigured(), deviceName: "DF SIFONI" });
  },

  async getDevices(_req: Request, res: Response) {
    try {
      const devices = await service.fetchDevices();
      res.json(devices);
    } catch (e: any) {
      res.status(502).json({ error: e?.message || "Errore nel recupero dei dispositivi Seneye" });
    }
  },

  // Lettura corrente live dall'API (con fallback all'ultimo dato salvato)
  async getCurrent(_req: Request, res: Response) {
    try {
      const current = await service.fetchCurrentReading();
      res.json({ source: "live", reading: current });
    } catch (e: any) {
      const last = await service.getLatestStored();
      if (last) {
        res.json({ source: "stored", reading: last, warning: e?.message });
      } else {
        res.status(502).json({ error: e?.message || "Errore nel recupero della lettura corrente" });
      }
    }
  },

  async getReadings(req: Request, res: Response) {
    try {
      const { from, to, limit } = req.query;
      const readings = await service.getReadings({
        from: from ? new Date(String(from)) : undefined,
        to: to ? new Date(String(to)) : undefined,
        limit: limit ? parseInt(String(limit), 10) : undefined,
      });
      res.json(readings);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Errore nel recupero dello storico" });
    }
  },

  // Salvataggio manuale di uno snapshot (trigger su richiesta)
  async poll(_req: Request, res: Response) {
    try {
      const row = await service.pollAndStore();
      res.json({ success: true, reading: row });
    } catch (e: any) {
      res.status(502).json({ error: e?.message || "Errore durante la lettura della sonda" });
    }
  },
};
