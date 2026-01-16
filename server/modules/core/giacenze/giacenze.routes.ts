import { Router } from "express";
import { giacenzeController } from "./giacenze.controller";

const router = Router();

router.get("/giacenze/range", (req, res) => giacenzeController.getRange(req, res));
router.get("/giacenze/summary", (req, res) => giacenzeController.getSummary(req, res));
router.post("/giacenze/export-excel", (req, res) => giacenzeController.exportExcel(req, res));

export default router;
