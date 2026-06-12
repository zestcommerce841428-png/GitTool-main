import express from "express";
const router = express.Router();
import { listAdmins, createAdmin, deleteAdmin } from "./teamController.js";

router.get("/", listAdmins);
router.post("/", createAdmin);
router.delete("/:id", deleteAdmin);

export default router;
