import express from "express";
const router = express.Router();
import { getRepositories, listTags, listBranches, getRepoContext } from "./repoController.js";
import { verifyToken } from "../shared/authMiddleware.js";
import { analyzeRepo, analyzeRepoSize } from "./analyzerController.js";

router.get("/", verifyToken, getRepositories);
router.get("/:owner/:repo/analyze", verifyToken, analyzeRepo);
router.get("/:owner/:repo/size-analysis", verifyToken, analyzeRepoSize);
router.get("/:owner/:repo/tags", verifyToken, listTags);
router.get("/:owner/:repo/tags", verifyToken, listTags);
router.get("/:owner/:repo/branches", verifyToken, listBranches);

router.get("/:owner/:repo/context", verifyToken, getRepoContext);

export default router;

