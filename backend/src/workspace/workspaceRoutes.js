import express from "express";
const router = express.Router();
import { verifyToken } from "../shared/authMiddleware.js";
import { 
    generateContributing,
    generateLicense,
    generateChangelog,
    generateResumeBullets,
    generateGithubActions
} from "./workspaceController.js";

router.post("/:owner/:repo/contributing", verifyToken, generateContributing);
router.post("/:owner/:repo/license", verifyToken, generateLicense);
router.post("/:owner/:repo/changelog", verifyToken, generateChangelog);
router.post("/:owner/:repo/resume", verifyToken, generateResumeBullets);
router.post("/:owner/:repo/actions", verifyToken, generateGithubActions);

export default router;
