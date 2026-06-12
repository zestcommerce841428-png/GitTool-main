import express from "express";
const router = express.Router();
import { listProjects, getProjectDetail, deleteProject } from "./projectsController.js";

router.get("/",              listProjects);
router.get("/:projectId",    getProjectDetail);
router.delete("/:projectId", deleteProject);

export default router;
