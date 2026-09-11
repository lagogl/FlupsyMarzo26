import { Router } from "express";
import { authController } from "./auth.controller";
import { requireAdmin, requireAuth } from "./auth.middleware";

const router = Router();

// POST routes
router.post("/login", (req, res) => authController.login(req, res));
router.post("/logout", (req, res) => authController.logout(req, res));
router.post("/register", requireAdmin, (req, res) => authController.register(req, res));
router.post("/change-password", requireAuth, (req, res) => authController.changePassword(req, res));

// GET routes
router.get("/users/current", (req, res) => authController.getCurrentUser(req, res));

export default router;
