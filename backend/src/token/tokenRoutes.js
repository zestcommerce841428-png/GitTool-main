import express from "express";
const router = express.Router();
import { getBalance, getTransactions } from "../token/tokenController.js";
import { createOrder, verifyPayment, getPackages } from "../payment/paymentController.js";
import { verifyToken } from "../shared/authMiddleware.js";

// Token routes
router.get("/balance", verifyToken, getBalance);
router.get("/transactions", verifyToken, getTransactions);

// Payment routes
router.get("/packages", getPackages);
router.post("/order", verifyToken, createOrder);
router.post("/verify", verifyToken, verifyPayment);

export default router;
