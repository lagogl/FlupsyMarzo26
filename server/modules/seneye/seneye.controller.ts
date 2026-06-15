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

  // Lettura corrente per la dashboard.
  // Mostra l'orario EFFETTIVO dell'ultima misura acquisita (snapshot dello
  // scheduler), non l'ora del collegamento. Vedi getCurrentForCard().
  async getCurrent(_req: Request, res: Response) {
    try {
      const current = await service.getCurrentForCard();
      res.json(current);
    } catch (e: any) {
      const last = await service.getLatestStored();
      if (last) {
        res.json({
          source: "stored",
          reading: last,
          measuredAt: new Date(last.recordDate).toISOString(),
          warning: e?.message,
        });
      } else {
        res.status(502).json({ error: e?.message || "Errore nel recupero della lettura corrente" });
      }
    }
  },

  async getReadings(req: Request, res: Response) {
    try {
      const { from, to, limit } = req.query;

      let fromDate: Date | undefined;
      if (from !== undefined) {
        fromDate = new Date(String(from));
        if (isNaN(fromDate.getTime())) {
          return res.status(400).json({ error: "Parametro 'from' non valido" });
        }
      }

      let toDate: Date | undefined;
      if (to !== undefined) {
        toDate = new Date(String(to));
        if (isNaN(toDate.getTime())) {
          return res.status(400).json({ error: "Parametro 'to' non valido" });
        }
      }

      let limitNum: number | undefined;
      if (limit !== undefined) {
        limitNum = parseInt(String(limit), 10);
        if (isNaN(limitNum) || limitNum <= 0) {
          return res.status(400).json({ error: "Parametro 'limit' non valido" });
        }
        limitNum = Math.min(limitNum, 5000);
      }

      const readings = await service.getReadings({
        from: fromDate,
        to: toDate,
        limit: limitNum,
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
