import express from "express";
const router = express.Router();
import { getOverview, getGrowth, getRecentActivity, getToolUsage } from "./analyticsController.js";

router.get("/overview",    getOverview);
router.get("/growth",      getGrowth);
router.get("/activity",    getRecentActivity);
router.get("/tool-usage",  getToolUsage);

export default router;
