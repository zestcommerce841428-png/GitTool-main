import express from "express";
const router = express.Router();
import { adminLogin, adminMe, adminRefresh } from "./adminAuthController.js";
import { verifyAdminJWT } from "../middleware/adminMiddleware.js";

router.post("/login",   adminLogin);
router.get("/me",       verifyAdminJWT, adminMe);
router.post("/refresh", verifyAdminJWT, adminRefresh);

export default router;
