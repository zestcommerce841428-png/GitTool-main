import express from "express";
import { verifyToken } from "../shared/authMiddleware.js";
import { listAllBranches, listStaleBranches, pruneBranches } from "./branchPrunerController.js";
import { compareBranches, createPullRequest, getCommit, generatePRSummary } from "./compareController.js";
import { listBranches } from "../repo/repoController.js";

const router = express.Router();
router.get("/test", (req, res) => res.json({ branches_prefix: "reachable" }));
router.get("/:owner/:repo", verifyToken, listBranches);
router.get("/:owner/:repo/all", verifyToken, listAllBranches);
router.get("/:owner/:repo/stale", verifyToken, listStaleBranches);
router.get("/:owner/:repo/compare/:base...:head", verifyToken, compareBranches);
router.get("/:owner/:repo/commits/:ref", verifyToken, getCommit);
router.post("/:owner/:repo/pulls", verifyToken, createPullRequest);
router.post("/:owner/:repo/pr-summary", verifyToken, generatePRSummary);
router.post("/:owner/:repo/prune", verifyToken, pruneBranches);

export default router;
