import { Router } from "express";
import { lciController } from "./lci.controller";

const router = Router();

router.get("/status", (req, res) => lciController.getStatus(req, res));

router.get("/materials", (req, res) => lciController.getMaterials(req, res));
router.get("/materials/categories", (req, res) => lciController.getMaterialCategories(req, res));
router.get("/materials/by-category/:category", (req, res) => lciController.getMaterialsByCategory(req, res));
router.get("/materials/:id", (req, res) => lciController.getMaterialById(req, res));
router.post("/materials", (req, res) => lciController.createMaterial(req, res));
router.put("/materials/:id", (req, res) => lciController.updateMaterial(req, res));
router.delete("/materials/:id", (req, res) => lciController.deleteMaterial(req, res));
router.post("/materials/bulk-import", (req, res) => lciController.bulkImportMaterials(req, res));

router.get("/consumables", (req, res) => lciController.getConsumables(req, res));
router.get("/consumables/summary/:year", (req, res) => lciController.getConsumptionSummary(req, res));
router.get("/consumables/:id", (req, res) => lciController.getConsumableById(req, res));
router.post("/consumables", (req, res) => lciController.createConsumable(req, res));
router.put("/consumables/:id", (req, res) => lciController.updateConsumable(req, res));
router.delete("/consumables/:id", (req, res) => lciController.deleteConsumable(req, res));
router.get("/consumables/:id/logs", (req, res) => lciController.getConsumptionLogs(req, res));
router.post("/consumables/:id/logs", (req, res) => lciController.addConsumptionLog(req, res));

router.get("/production/calculate/:year", (req, res) => lciController.calculateProduction(req, res));
router.get("/production/snapshots", (req, res) => lciController.getProductionSnapshots(req, res));
router.post("/production/snapshots", (req, res) => lciController.createProductionSnapshot(req, res));
router.post("/production/generate/:year", (req, res) => lciController.generateProductionFromApp(req, res));

router.get("/reports", (req, res) => lciController.getReports(req, res));
router.get("/reports/generate/:year", (req, res) => lciController.generateReportData(req, res));
router.get("/reports/:id", (req, res) => lciController.getReportById(req, res));
router.post("/reports", (req, res) => lciController.createReport(req, res));
router.post("/reports/:id/finalize", (req, res) => lciController.finalizeReport(req, res));

router.get("/export/preview/:year", (req, res) => lciController.getExportPreview(req, res));
router.get("/export/excel/:year", (req, res) => lciController.exportExcel(req, res));

router.get("/consumption-logs", (req, res) => lciController.getAllConsumptionLogs(req, res));
router.post("/consumption-logs", (req, res) => lciController.createConsumptionLog(req, res));

router.get("/flupsy/overview", (req, res) => lciController.getFlupsyOverview(req, res));
router.get("/lots/input/:year", (req, res) => lciController.getLotsInput(req, res));

export default router;
