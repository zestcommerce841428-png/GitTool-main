import express from "express";
const router = express.Router();

import authRoutes   from "../auth/authRoutes.js";
import repoRoutes   from "../repo/repoRoutes.js";
import readmeRoutes from "../readme/readmeRoutes.js";
import tokenRoutes    from "../token/tokenRoutes.js";
import adminRoutes    from "../admin/adminRoutes.js";
import changelogRoutes from "../changelog/changelogRoutes.js";
import usersRoutes    from "../users/usersRoutes.js";
import workspaceRoutes from "../workspace/workspaceRoutes.js";
import branchPrunerRoutes from "../branchPruner/branchPrunerRoutes.js";

import gitignoreRoutes from "../gitignore/gitignoreRoutes.js";
import toolsRoutes from "../tools/toolsRoutes.js";
import flagsRoutes from "../flags/flagsRoutes.js";

router.use("/auth",      authRoutes);
router.use("/repos",     repoRoutes);
router.use("/readme",    readmeRoutes);
router.use("/tokens",    tokenRoutes);
router.use("/admin",     adminRoutes);
router.use("/changelogs", changelogRoutes);
router.use("/users",     usersRoutes);
router.use("/workspace", workspaceRoutes);
router.use("/branches",  branchPrunerRoutes); // Mounted at /api/branches
router.use("/gitignore", gitignoreRoutes);
router.use("/tools",     toolsRoutes);
router.use("/flags",     flagsRoutes);

export default router;
