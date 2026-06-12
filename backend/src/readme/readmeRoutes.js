import express from "express";
const router = express.Router();
import { generateReadme, saveReadme, chatReadme, createPullRequest } from "./readmeController.js";
import { verifyToken } from "../shared/authMiddleware.js";

router.post("/", verifyToken, generateReadme);
router.post("/chat", verifyToken, chatReadme);
router.post("/pr", verifyToken, createPullRequest);
router.post("/save", saveReadme);

export default router;
