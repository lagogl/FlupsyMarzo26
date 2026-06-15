import type { Request, Response } from "express";
import { basketCapacityService, type SaveCapacityInput } from "./basket-capacity.service";

export class BasketCapacityController {
  /**
   * GET /api/basket-capacity
   * Capacità configurate per taglia + suggerimenti dai massimi storici.
   */
  async getAll(req: Request, res: Response) {
    try {
      const rows = await basketCapacityService.getCapacitiesWithSuggestions();
      res.json(rows);
    } catch (error) {
      console.error("Error fetching basket capacities:", error);
      res.status(500).json({ message: "Impossibile recuperare le capacità per taglia" });
    }
  }

  /**
   * POST /api/basket-capacity
   * Salva (upsert) le capacità per le taglie. Body: { capacities: [{ sizeId, maxAnimals, maxWeightGrams }] }
   */
  async save(req: Request, res: Response) {
    try {
      const body = req.body;
      const list = Array.isArray(body?.capacities) ? body.capacities : Array.isArray(body) ? body : null;
      if (!list) {
        return res.status(400).json({ message: "Formato non valido: atteso un array di capacità" });
      }

      const inputs: SaveCapacityInput[] = [];
      for (const item of list) {
        const sizeId = Number(item?.sizeId);
        if (!Number.isInteger(sizeId) || sizeId <= 0) {
          return res.status(400).json({ message: "sizeId non valido in una delle righe" });
        }
        const maxAnimals = item?.maxAnimals === null || item?.maxAnimals === undefined || item?.maxAnimals === ""
          ? null
          : Number(item.maxAnimals);
        const maxWeightGrams = item?.maxWeightGrams === null || item?.maxWeightGrams === undefined || item?.maxWeightGrams === ""
          ? null
          : Number(item.maxWeightGrams);

        if (maxAnimals != null && (!Number.isFinite(maxAnimals) || maxAnimals <= 0)) {
          return res.status(400).json({ message: "maxAnimals deve essere un numero maggiore di zero o vuoto" });
        }
        if (maxWeightGrams != null && (!Number.isFinite(maxWeightGrams) || maxWeightGrams <= 0)) {
          return res.status(400).json({ message: "maxWeightGrams deve essere un numero maggiore di zero o vuoto" });
        }

        inputs.push({ sizeId, maxAnimals, maxWeightGrams });
      }

      const result = await basketCapacityService.saveCapacities(inputs);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error("Error saving basket capacities:", error);
      res.status(500).json({ message: "Impossibile salvare le capacità per taglia" });
    }
  }
}

export const basketCapacityController = new BasketCapacityController();
