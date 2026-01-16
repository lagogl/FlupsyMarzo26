import type { Request, Response } from "express";
import { menuPreferencesService } from "./menu-preferences.service";

export class MenuPreferencesController {
  async getPreferences(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ success: false, message: "ID utente non valido" });
      }

      const preferences = await menuPreferencesService.getPreferences(userId);
      res.json({
        success: true,
        data: preferences || { menuItems: [], compactModeEnabled: false }
      });
    } catch (error) {
      console.error("Error fetching menu preferences:", error);
      res.status(500).json({ success: false, message: "Errore nel recupero delle preferenze" });
    }
  }

  async savePreferences(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      const { menuItems, compactModeEnabled } = req.body;

      if (isNaN(userId)) {
        return res.status(400).json({ success: false, message: "ID utente non valido" });
      }

      if (!Array.isArray(menuItems)) {
        return res.status(400).json({ success: false, message: "menuItems deve essere un array" });
      }

      const result = await menuPreferencesService.savePreferences(
        userId,
        menuItems,
        compactModeEnabled ?? false
      );

      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Error saving menu preferences:", error);
      res.status(500).json({ success: false, message: "Errore nel salvataggio delle preferenze" });
    }
  }

  async toggleCompactMode(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ success: false, message: "ID utente non valido" });
      }

      const result = await menuPreferencesService.toggleCompactMode(userId);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Error toggling compact mode:", error);
      res.status(500).json({ success: false, message: "Errore nel cambio modalità" });
    }
  }
}

export const menuPreferencesController = new MenuPreferencesController();
