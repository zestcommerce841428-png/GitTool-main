import express from "express";
const router = express.Router();
import { detectAbuse, listAbuseFlags, reviewFlag } from "./abuseController.js";
import { requireRole } from "../middleware/adminMiddleware.js";

router.get("/detect",         detectAbuse);
router.get("/flags",          listAbuseFlags);
router.patch("/flags/:flagId", requireRole("support_admin"), reviewFlag);

export default router;
