import { supabase } from './supabase.js';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header. User not authenticated." });
    }

    const jwt = authHeader.split(' ')[1];
    if (!jwt) {
      return res.status(401).json({ error: "Malformed authorization header." });
    }

    const { data: { user }, error } = await supabase.auth.getUser(jwt);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired Supabase JWT." });
    }

    // Check if user account has been suspended by admin
    if (user.banned_until && new Date(user.banned_until) > new Date()) {
      return res.status(403).json({
        error: "Your account has been suspended. Please contact support.",
        code: "ACCOUNT_SUSPENDED",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    res.status(500).json({ error: "Authentication verification failed." });
  }
};
