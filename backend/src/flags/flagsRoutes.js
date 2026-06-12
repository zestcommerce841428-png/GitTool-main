import express from "express";
import { getPublicFlags } from "./flagsController.js";

const router = express.Router();

// Public — no auth. Only exposes key+value, never internal admin metadata.
router.get("/", getPublicFlags);

export default router;
