import { Router } from "express";
import growthProjectionController from "./growth-projection.controller";

const router = Router();
router.use("/", growthProjectionController);

export default router;
