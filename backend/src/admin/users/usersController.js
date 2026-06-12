import { supabase } from "../../shared/supabase.js";
import { auditLog } from "../shared/auditLogger.js";
import { globalEvents } from "../../shared/events.js";

export const listUsers = async (req, res, next) => {
  try {
    const page   = parseInt(req.query.page   || "1");
    const limit  = parseInt(req.query.limit  || "25");
    const search = req.query.search   || "";
    const status = req.query.status   || ""; // "active" | "banned"

    const { data: { users }, error } = await supabase.auth.admin.listUsers({ page, perPage: limit });
    if (error) throw error;

    let filtered = users;
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(u =>
        (u.email || "").toLowerCase().includes(s) ||
        (u.user_metadata?.user_name || "").toLowerCase().includes(s) ||
        u.id.includes(s)
      );
    }
    if (status === "banned")  filtered = filtered.filter(u => u.banned_until);
    if (status === "active")  filtered = filtered.filter(u => !u.banned_until);

    const userIds = filtered.map(u => u.id);
    const [{ data: tokens }, { data: projects }] = await Promise.all([
      supabase.from("user_tokens").select("user_id, balance").in("user_id", userIds),
      supabase.from("projects").select("user_id").in("user_id", userIds),
    ]);

    const tokenMap   = Object.fromEntries((tokens || []).map(t => [t.user_id, t.balance]));
    const projectMap = {};
    (projects || []).forEach(p => { projectMap[p.user_id] = (projectMap[p.user_id] || 0) + 1; });

    const enriched = filtered.map(u => ({
      id:           u.id,
      email:        u.email,
      username:     u.user_metadata?.user_name || u.user_metadata?.full_name || "—",
      avatar:       u.user_metadata?.avatar_url || null,
      createdAt:    u.created_at,
      lastSignIn:   u.last_sign_in_at,
      isBanned:     !!u.banned_until,
      bannedUntil:  u.banned_until,
      tokenBalance: tokenMap[u.id]   ?? 0,
      projectCount: projectMap[u.id] ?? 0,
    }));

    res.json({ users: enriched, total: filtered.length, page, limit });
  } catch (err) { next(err); }
};

export const getUserDetail = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);
    if (error) throw error;

    const [{ data: tokens }, { data: projects }, { data: allTx }, { data: payments }, { data: abuse }] = await Promise.all([
      supabase.from("user_tokens").select("*").eq("user_id", userId).single(),
      supabase.from("projects").select("id,title,repo_url,template,created_at").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("token_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("payments").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("abuse_flags").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);

    const txHistory = allTx || [];

    // Token usage summary grouped by type
    const summary = {};
    txHistory.forEach(t => {
      if (!summary[t.type]) summary[t.type] = { count: 0, total: 0 };
      summary[t.type].count++;
      summary[t.type].total += t.amount;
    });

    const generates    = txHistory.filter(t => t.type === "generate").length;
    const chats        = txHistory.filter(t => t.type === "chat").length;
    const totalSpent   = Math.abs(txHistory.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0));
    const totalEarned  = txHistory.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const tokensPurchased = txHistory.filter(t => t.type === "purchase").reduce((s, t) => s + t.amount, 0);

    res.json({
      user: {
        id: user.id, email: user.email,
        username:  user.user_metadata?.user_name || user.user_metadata?.full_name || "—",
        avatar:    user.user_metadata?.avatar_url || null,
        createdAt: user.created_at, lastSignIn: user.last_sign_in_at,
        isBanned:  !!user.banned_until, bannedUntil: user.banned_until,
      },
      stats: {
        generates, chats, totalTokensSpent: totalSpent,
        totalTokensEarned: totalEarned, tokensPurchased,
        totalProjects: (projects || []).length,
        totalPayments: (payments || []).length,
      },
      summary,  // grouped by type: { generate: {count, total}, chat: {count, total}, ... }
      tokens,
      projects:     projects  || [],
      transactions: txHistory.slice(0, 30),
      payments:     payments  || [],
      abuseFlags:   abuse     || [],
    });
  } catch (err) { next(err); }
};

export const suspendUser = async (req, res, next) => {
  const { userId } = req.params;
  const { reason, durationHours, permanent = false } = req.body;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: "reason is required." });
  }

  // permanent=true → use Supabase's special "none"-inverse sentinel value (876600h ≈ 100 y)
  // timed → default 24 h, max 2 160 h (90 days)
  const MAX_HOURS = 2160;
  const isPermanent = permanent === true || permanent === "true";
  const hours = isPermanent
    ? null
    : Math.min(Math.max(parseInt(durationHours, 10) || 24, 1), MAX_HOURS);

  try {
    const banDuration = isPermanent ? "876600h" : `${hours}h`;
    await supabase.auth.admin.updateUserById(userId, { ban_duration: banDuration });
    await auditLog(req, "suspend_user", "user", userId, { reason, permanent: isPermanent, durationHours: hours }, { critical: true });
    globalEvents.emit("user_suspended", userId);
    const message = isPermanent
      ? "User permanently banned."
      : `User suspended for ${hours} hour(s).`;
    res.json({ success: true, message, permanent: isPermanent, durationHours: hours });
  } catch (err) { next(err); }
};

export const reactivateUser = async (req, res, next) => {
  const { userId } = req.params;
  try {
    await supabase.auth.admin.updateUserById(userId, { ban_duration: "none" });
    await auditLog(req, "reactivate_user", "user", userId, {}, { critical: true });
    res.json({ success: true, message: "User reactivated." });
  } catch (err) { next(err); }
};

export const adjustUserTokens = async (req, res, next) => {
  const { userId } = req.params;
  const { amount, reason } = req.body;
  if (typeof amount !== "number") return res.status(400).json({ error: "amount must be a number." });
  try {
    // Fetch existing row (may not exist for edge-case users)
    const { data: row } = await supabase.from("user_tokens").select("balance").eq("user_id", userId).single();
    const currentBalance = row?.balance ?? 0;
    const newBalance = Math.max(0, currentBalance + amount);

    // Upsert — create the row if it doesn't exist yet
    const { error: upsertErr } = await supabase.from("user_tokens")
      .upsert({ user_id: userId, balance: newBalance }, { onConflict: "user_id" });
    if (upsertErr) throw upsertErr;

    await supabase.from("token_transactions").insert({
      user_id: userId, amount, type: "admin_adjustment",
      description: reason || `Admin adjustment: ${amount > 0 ? "+" : ""}${amount} tokens`,
    });
    await auditLog(req, "adjust_tokens", "user", userId, { amount, reason, prevBalance: currentBalance, newBalance }, { critical: true });
    res.json({ success: true, newBalance });
  } catch (err) {
    console.error("adjustUserTokens ERROR:", err.message);
    next(err);
  }
};

export const resetQuota = async (req, res, next) => {
  const { userId } = req.params;
  const { tokens = 40 } = req.body;
  try {
    // Upsert so it works even if the row doesn't exist
    const { error } = await supabase.from("user_tokens")
      .upsert({ user_id: userId, balance: tokens }, { onConflict: "user_id" });
    if (error) throw error;
    await supabase.from("token_transactions").insert({
      user_id: userId, amount: tokens, type: "admin_adjustment",
      description: `Admin quota reset to ${tokens} tokens`,
    });
    await auditLog(req, "reset_quota", "user", userId, { tokens }, { critical: true });
    res.json({ success: true, balance: tokens });
  } catch (err) { next(err); }
};

export const deleteUser = async (req, res, next) => {
  const { userId } = req.params;
  try {
    await auditLog(req, "delete_user", "user", userId, {}, { critical: true });
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { next(err); }
};
