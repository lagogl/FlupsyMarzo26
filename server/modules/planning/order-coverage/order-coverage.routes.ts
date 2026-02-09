import { Router } from "express";
import orderCoverageController from "./order-coverage.controller";

const router = Router();
router.use("/", orderCoverageController);

export default router;
