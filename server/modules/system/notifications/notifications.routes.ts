import { Router } from "express";
import { notificationsController } from "./notifications.controller";
import { requireAdmin, requireAuth } from "../auth/auth.middleware";

const router = Router();

router.get("/notifications", requireAuth, (req, res) => notificationsController.getNotifications(req, res));
router.post("/notifications", requireAdmin, (req, res) => notificationsController.createNotification(req, res));
router.put("/notifications/:id/read", requireAuth, (req, res) => notificationsController.markNotificationAsRead(req, res));
router.put("/notifications/read-all", requireAuth, (req, res) => notificationsController.markAllNotificationsAsRead(req, res));
router.get("/notification-settings", requireAdmin, (req, res) => notificationsController.getSettings(req, res));
router.put("/notification-settings/:type", requireAdmin, (req, res) => notificationsController.updateSettings(req, res));
router.post("/notifications/test-growth", requireAdmin, (req, res) => notificationsController.testGrowthNotifications(req, res));

export default router;
