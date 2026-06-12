import express from "express";
const router = express.Router();
import { listUsers, getUserDetail, suspendUser, reactivateUser, adjustUserTokens, resetQuota, deleteUser } from "./usersController.js";
import { requireRole } from "../middleware/adminMiddleware.js";

router.get("/",                             listUsers);
router.get("/:userId",                      getUserDetail);
router.post("/:userId/suspend",             requireRole("support_admin"), suspendUser);
router.post("/:userId/reactivate",          requireRole("support_admin"), reactivateUser);
router.patch("/:userId/tokens",             requireRole("support_admin"), adjustUserTokens);
router.post("/:userId/reset-quota",         requireRole("support_admin"), resetQuota);
router.delete("/:userId",                   requireRole("super_admin"),   deleteUser);

export default router;
