import express from "express";
const router = express.Router();
import { getHealth, getAuditLogs } from "./healthController.js";

router.get("/",      getHealth);
router.get("/audit", getAuditLogs);

export default router;
