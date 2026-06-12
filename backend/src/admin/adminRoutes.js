import express from "express";
const router = express.Router();

import { verifyAdminJWT, requireRole } from "./middleware/adminMiddleware.js";
import adminAuthRoutes   from "./auth/adminAuthRoutes.js";
import analyticsRoutes   from "./analytics/analyticsRoutes.js";
import usersRoutes       from "./users/usersRoutes.js";
import projectsRoutes    from "./projects/projectsRoutes.js";
import paymentsRoutes    from "./payments/paymentsRoutes.js";
import aiRoutes          from "./ai/aiRoutes.js";
import featuresRoutes    from "./features/featuresRoutes.js";
import abuseRoutes       from "./abuse/abuseRoutes.js";
import healthRoutes      from "./health/healthRoutes.js";
import changelogsRoutes  from "./changelog/changelogsRoutes.js";
import teamRoutes        from "./team/teamRoutes.js";

// Public: login only
router.use("/auth",       adminAuthRoutes);

// All below require valid admin JWT
router.use(verifyAdminJWT);

// Safe for 'analyst' (level 1+)
router.use("/analytics",  requireRole("analyst"),       analyticsRoutes);
router.use("/health",     requireRole("analyst"),       healthRoutes);

// General 'support_admin' tasks (level 2+)
router.use("/users",      requireRole("support_admin"), usersRoutes);
router.use("/projects",   requireRole("support_admin"), projectsRoutes);
router.use("/abuse",      requireRole("support_admin"), abuseRoutes);

// Billing 'billing_admin' tasks (level 2+)
router.use("/payments",   requireRole("billing_admin"), paymentsRoutes);

// Core infrastructure 'super_admin' ONLY (level 4)
router.use("/ai",         requireRole("super_admin"),   aiRoutes);
router.use("/features",   requireRole("super_admin"),   featuresRoutes);
router.use("/changelog",  requireRole("super_admin"),   changelogsRoutes);
router.use("/team",       requireRole("super_admin"),   teamRoutes);

export default router;
