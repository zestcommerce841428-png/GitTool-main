import express from "express";
import { verifyToken } from "../shared/authMiddleware.js";
import { generateGitignore, deployGitignore } from "./gitignoreController.js";

const router = express.Router();

router.post("/generate", verifyToken, generateGitignore);
router.post("/:owner/:repo/deploy", verifyToken, deployGitignore);

export default router;
