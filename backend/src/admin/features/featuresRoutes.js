import express from "express";
const router = express.Router();
import { listFlags, updateFlag, createFlag, deleteFlag } from "./featuresController.js";
import { requireRole } from "../middleware/adminMiddleware.js";

router.get("/",              listFlags);
router.patch("/:key",        requireRole("super_admin"), updateFlag);
router.post("/",             requireRole("super_admin"), createFlag);
router.delete("/:key",       requireRole("super_admin"), deleteFlag);

export default router;
