import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { supabase } from "../../shared/supabase.js";
dotenv.config();

/**
 * POST /api/admin/auth/login
 * Returns a signed JWT on success.
 */
export const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required." });

  const targetEmail = email.toLowerCase();
  let adminRole = null;
  let isValid = false;

  // 1. Fallback to Root .env Admin
  if (targetEmail === process.env.ADMIN_EMAIL?.toLowerCase() && password === process.env.ADMIN_PASSWORD) {
    adminRole = "super_admin";
    isValid = true;
  } else {
    // 2. Safely check Supabase `admins` table
    const { data: dbAdmin } = await supabase
      .from("admins")
      .select("password_hash, role")
      .eq("email", targetEmail)
      .single();

    if (dbAdmin && bcrypt.compareSync(password, dbAdmin.password_hash)) {
      adminRole = dbAdmin.role;
      isValid = true;
    }
  }

  if (!isValid || !adminRole) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  const token = jwt.sign(
    { email: targetEmail, role: adminRole },
    process.env.ADMIN_JWT_SECRET,
    { expiresIn: "12h" }
  );

  res.json({ token, role: adminRole, email: targetEmail, expiresIn: "12h" });
};

/**
 * GET /api/admin/auth/me
 * Returns current admin info from JWT (no DB call needed).
 */
export const adminMe = (req, res) => {
  res.json({ email: req.admin.adminEmail, role: req.admin.role });
};

/**
 * POST /api/admin/auth/refresh
 * Issues a new token if current one is still valid.
 */
export const adminRefresh = (req, res) => {
  const token = jwt.sign(
    { email: req.admin.adminEmail, role: req.admin.role },
    process.env.ADMIN_JWT_SECRET,
    { expiresIn: "12h" }
  );
  res.json({ token, expiresIn: "12h" });
};
