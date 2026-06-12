import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import apiRoutes from "./src/routes/routes.js";
import errorHandler from "./src/shared/errorMiddleware.js";

dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();

const ALLOWED_ORIGINS = [
  "http://localhost:5173",  // main frontend dev (Vite)
  "http://localhost:5174",  // admin panel dev (Vite)
  "http://localhost:3001",  // Next.js frontend dev
  "http://localhost:3002",  // Next.js frontend dev (alt port)
  // Production — hardcoded as safe fallback when env vars are absent
  "https://gittool.dev",
  "https://www.gittool.dev",
  // Allow env-var overrides for staging / preview deployments
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json());

// Global rate limit: 200 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use(globalLimiter);

// Auth endpoints: 20 attempts per 15 min (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts, please try again later." },
});
app.use("/api/auth", authLimiter);

// Payment endpoints: 30 requests per 15 min per IP
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many payment requests, please try again later." },
});
app.use("/api/tokens/order", paymentLimiter);
app.use("/api/tokens/verify", paymentLimiter);

// Strict rate limit for AI-heavy endpoints: 10 per 15 min
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI request limit reached. Please wait and try again." },
});
app.use("/api/readme", aiLimiter);

// API Routes
app.use("/api", apiRoutes);

// Error Handling Middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
