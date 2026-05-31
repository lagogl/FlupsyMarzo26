import { Router } from "express";
import { seneyeController } from "./seneye.controller";

const router = Router();

router.get("/status", (req, res) => seneyeController.getStatus(req, res));
router.get("/devices", (req, res) => seneyeController.getDevices(req, res));
router.get("/current", (req, res) => seneyeController.getCurrent(req, res));
router.get("/readings", (req, res) => seneyeController.getReadings(req, res));
router.post("/poll", (req, res) => seneyeController.poll(req, res));

export default router;
