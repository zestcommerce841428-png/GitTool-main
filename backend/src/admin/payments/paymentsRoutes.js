import express from "express";
const router = express.Router();
import { listPayments, getPaymentStats } from "./paymentsController.js";

router.get("/",       listPayments);
router.get("/stats",  getPaymentStats);

export default router;
