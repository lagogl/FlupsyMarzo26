import { Router } from "express";
import salesPlanningController from "./sales-planning.controller";

const router = Router();
router.use("/", salesPlanningController);

export { salesPlanningService } from "./sales-planning.service";
export default router;
