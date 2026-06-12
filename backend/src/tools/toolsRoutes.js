import express from "express";
import { verifyToken } from "../shared/authMiddleware.js";
import {
    createIssue,
    scanTodos, analyzeDependencies, triageIssues, scanSecrets,
    analyzeDeadCode, explainFailure, getArchitecture, getCollaboration,
    suggestVersion, listCommits, generateApiDocs,
    getDependabotAlerts, getCodeScanningAlerts, getCommitGraph
} from "./toolsController.js";

const router = express.Router();

// Issue creation
router.post("/:owner/:repo/create-issue", verifyToken, createIssue);

// Existing
router.post("/:owner/:repo/todo-scan", verifyToken, scanTodos);
router.get("/:owner/:repo/dependencies", verifyToken, analyzeDependencies);
router.post("/:owner/:repo/triage-issues", verifyToken, triageIssues);
router.post("/:owner/:repo/scan-secrets", verifyToken, scanSecrets);

// New
router.post("/:owner/:repo/dead-code", verifyToken, analyzeDeadCode);
router.post("/:owner/:repo/explain-failure", verifyToken, explainFailure);
router.get("/:owner/:repo/architecture", verifyToken, getArchitecture);
router.get("/:owner/:repo/collaboration", verifyToken, getCollaboration);
router.post("/:owner/:repo/version-suggest", verifyToken, suggestVersion);
router.get("/:owner/:repo/commits", verifyToken, listCommits);
router.post("/:owner/:repo/generate-api-docs", verifyToken, generateApiDocs);

router.get("/:owner/:repo/dependabot", verifyToken, getDependabotAlerts);
router.get("/:owner/:repo/code-scanning", verifyToken, getCodeScanningAlerts);
router.get("/:owner/:repo/commit-graph", verifyToken, getCommitGraph);

export default router;
