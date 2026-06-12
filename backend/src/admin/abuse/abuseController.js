import { supabase } from "../../shared/supabase.js";
import { auditLog } from "../shared/auditLogger.js";

const ABUSE_THRESHOLDS = {
  generates_per_hour: 15,
  chat_per_hour: 50,
  tokens_per_day: 200,
};

export const detectAbuse = async (req, res, next) => {
  try {
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const oneDayAgo  = new Date(Date.now() - 86400000).toISOString();

    const { data: recentTx } = await supabase
      .from("token_transactions")
      .select("user_id, amount, type, created_at")
      .gte("created_at", oneDayAgo)
      .lt("amount", 0);

    // Aggregate per user
    const userStats = {};
    (recentTx || []).forEach(t => {
      if (!userStats[t.user_id]) userStats[t.user_id] = { generates: 0, chats: 0, tokensDay: 0, tokensHour: 0 };
      if (t.type === "generate") userStats[t.user_id].generates++;
      if (t.type === "chat")     userStats[t.user_id].chats++;
      userStats[t.user_id].tokensDay += Math.abs(t.amount);
      if (new Date(t.created_at) >= new Date(oneHourAgo)) {
        if (t.type === "generate") userStats[t.user_id].tokensHour += Math.abs(t.amount);
      }
    });

    const suspects = Object.entries(userStats)
      .filter(([, s]) =>
        s.generates > ABUSE_THRESHOLDS.generates_per_hour ||
        s.tokensDay  > ABUSE_THRESHOLDS.tokens_per_day
      )
      .map(([userId, stats]) => ({ userId, ...stats }));

    // Auto-create abuse flags for new suspects not already flagged
    for (const s of suspects) {
      const { data: existing } = await supabase.from("abuse_flags")
        .select("id").eq("user_id", s.userId).eq("status", "pending").limit(1);
      if (!existing?.length) {
        const reason = s.generates > ABUSE_THRESHOLDS.generates_per_hour
          ? `Excessive generations: ${s.generates} in last 24h`
          : `High token consumption: ${s.tokensDay} tokens in 24h`;
        const severity = s.tokensDay > 400 || s.generates > 30 ? "high" : "medium";
        await supabase.from("abuse_flags").insert({ user_id: s.userId, reason, severity, flagged_by: "system" });
      }
    }

    res.json({ suspects, thresholds: ABUSE_THRESHOLDS });
  } catch (err) { next(err); }
};

export const listAbuseFlags = async (req, res, next) => {
  try {
    const status = req.query.status || "pending";
    let query = supabase.from("abuse_flags").select("*").order("created_at", { ascending: false });
    if (status !== "all") query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ flags: data });
  } catch (err) { next(err); }
};

export const reviewFlag = async (req, res, next) => {
  const { flagId } = req.params;
  const { status, note } = req.body; // status: 'reviewed' | 'dismissed'
  try {
    await supabase.from("abuse_flags").update({
      status,
      admin_note:  note,
      reviewed_by: req.admin.adminEmail,
      reviewed_at: new Date().toISOString(),
    }).eq("id", flagId);
    await auditLog(req, `review_abuse_flag_${status}`, "abuse_flag", flagId, { note });
    res.json({ success: true });
  } catch (err) { next(err); }
};
