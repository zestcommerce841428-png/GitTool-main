import express from "express";
const router = express.Router();
import { saveGithubToken, getGithubTokenStatus } from "./githubTokenController.js";
import { verifyToken } from "../shared/authMiddleware.js";

router.post("/github-token", verifyToken, saveGithubToken);
router.get("/github-token/status", verifyToken, getGithubTokenStatus);

export default router;
