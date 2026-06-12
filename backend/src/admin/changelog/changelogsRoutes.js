import express from "express";
const router = express.Router();
import { listAdminChangelogs, createChangelog, updateChangelog, deleteChangelog } from "./changelogsController.js";

router.get("/", listAdminChangelogs);
router.post("/", createChangelog);
router.put("/:id", updateChangelog);
router.delete("/:id", deleteChangelog);

export default router;
