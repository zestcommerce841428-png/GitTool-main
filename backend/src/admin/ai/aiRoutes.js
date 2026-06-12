import express from "express";
const router = express.Router();
import { getAiOverview, toggleAiGlobal, getDailyUsage } from "./aiController.js";
import { requireRole } from "../middleware/adminMiddleware.js";

router.get("/overview",   getAiOverview);
router.get("/daily",      getDailyUsage);
router.post("/toggle",    requireRole("super_admin"), toggleAiGlobal);

export default router;
