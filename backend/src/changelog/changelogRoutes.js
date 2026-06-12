import express from "express";
const router = express.Router();
import { getChangelogs } from "./changelogController.js";

router.get("/", getChangelogs);

export default router;
