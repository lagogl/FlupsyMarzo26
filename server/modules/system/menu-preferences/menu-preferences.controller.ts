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
        data: preferences || { menuItems: [], hiddenMenuItems: [], compactModeEnabled: false }
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

  async saveHiddenMenuItems(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      const { hiddenMenuItems } = req.body;

      if (isNaN(userId)) {
        return res.status(400).json({ success: false, message: "ID utente non valido" });
      }

      if (!Array.isArray(hiddenMenuItems)) {
        return res.status(400).json({ success: false, message: "hiddenMenuItems deve essere un array" });
      }

      const result = await menuPreferencesService.saveHiddenMenuItems(userId, hiddenMenuItems);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Error saving hidden menu items:", error);
      res.status(500).json({ success: false, message: "Errore nel salvataggio voci nascoste" });
    }
  }

  async savePreferredFlupsyIds(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      const { preferredFlupsyIds } = req.body;

      if (isNaN(userId)) {
        return res.status(400).json({ success: false, message: "ID utente non valido" });
      }

      if (!Array.isArray(preferredFlupsyIds)) {
        return res.status(400).json({ success: false, message: "preferredFlupsyIds deve essere un array" });
      }

      const result = await menuPreferencesService.savePreferredFlupsyIds(userId, preferredFlupsyIds);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Error saving preferred flupsy ids:", error);
      res.status(500).json({ success: false, message: "Errore nel salvataggio preferenze FLUPSY" });
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
