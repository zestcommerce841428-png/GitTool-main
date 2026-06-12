import jwt from "jsonwebtoken";

const ROLES = {
  super_admin:    4,
  billing_admin:  2,
  support_admin:  2,
  analyst:        1,
};

/**
 * verifyAdminJWT — validates Bearer JWT in Authorization header.
 * Attaches { adminEmail, role, roleLevel } to req.admin
 */
export const verifyAdminJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No Authorization header." });

  const token = authHeader.split(" ")[1];
  if (!token)  return res.status(401).json({ error: "Malformed Authorization header." });

  try {
    const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    req.admin = {
      adminEmail: payload.email,
      role:       payload.role,
      roleLevel:  ROLES[payload.role] || 0,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired admin token." });
  }
};

/**
 * requireRole(minRole) — RBAC middleware factory.
 * Usage: router.get("/sensitive", verifyAdminJWT, requireRole("billing_admin"), handler)
 */
export const requireRole = (minRole) => (req, res, next) => {
  const minLevel = ROLES[minRole] || 999;
  if (!req.admin || req.admin.roleLevel < minLevel) {
    return res.status(403).json({ error: `Requires role: ${minRole} or higher.` });
  }
  next();
};
