import { Router } from "express";
import { menuPreferencesController } from "./menu-preferences.controller";

const router = Router();

router.get("/menu-preferences/:userId", (req, res) => menuPreferencesController.getPreferences(req, res));
router.post("/menu-preferences/:userId", (req, res) => menuPreferencesController.savePreferences(req, res));
router.post("/menu-preferences/:userId/hidden-menu-items", (req, res) => menuPreferencesController.saveHiddenMenuItems(req, res));
router.post("/menu-preferences/:userId/preferred-flupsys", (req, res) => menuPreferencesController.savePreferredFlupsyIds(req, res));
router.post("/menu-preferences/:userId/toggle-compact", (req, res) => menuPreferencesController.toggleCompactMode(req, res));

export default router;
