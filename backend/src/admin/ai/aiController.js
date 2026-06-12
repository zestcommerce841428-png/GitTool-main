import { supabase } from "../../shared/supabase.js";
import { auditLog } from "../shared/auditLogger.js";

const TOKEN_COST_PER_UNIT_INR = 0.005; // Rough OpenAI gpt-4o-mini cost proxy in INR

export const getAiOverview = async (req, res, next) => {
  try {
    // Total token transactions by type
    const { data: all } = await supabase
      .from("token_transactions")
      .select("amount, type, created_at, user_id");

    const generates    = (all || []).filter(t => t.type === "generate");
    const chats        = (all || []).filter(t => t.type === "chat");
    const scans        = (all || []).filter(t => t.type === "scan");
    const triages      = (all || []).filter(t => t.type === "triage");
    const analyses     = (all || []).filter(t => t.type === "analyze");

    const totalGenTokens   = Math.abs(generates.reduce((s, t) => s + t.amount, 0));
    const totalChatTokens  = Math.abs(chats.reduce((s, t) => s + t.amount, 0));
    const totalScanTokens  = Math.abs(scans.reduce((s, t) => s + t.amount, 0));
    const totalTriageTokens= Math.abs(triages.reduce((s, t) => s + t.amount, 0));
    const totalAnalyzeTokens= Math.abs(analyses.reduce((s, t) => s + t.amount, 0));

    // Today's usage
    const today = new Date(); today.setHours(0,0,0,0);
    const todayTx     = (all || []).filter(t => new Date(t.created_at) >= today && t.amount < 0);
    const todayTokens = Math.abs(todayTx.reduce((s, t) => s + t.amount, 0));

    // Top users by consumption
    const userConsumption = {};
    (all || []).filter(t => t.amount < 0).forEach(t => {
      userConsumption[t.user_id] = (userConsumption[t.user_id] || 0) + Math.abs(t.amount);
    });
    const topUsers = Object.entries(userConsumption)
      .sort(([,a],[,b]) => b - a)
      .slice(0, 10)
      .map(([userId, tokens]) => ({ userId, tokens }));

    // Current global limits from feature_flags
    const { data: flags } = await supabase.from("feature_flags")
      .select("key, value")
      .in("key", ["ai_generation_enabled", "ai_chat_enabled"]);
    const flagMap = Object.fromEntries((flags || []).map(f => [f.key, f.value]));

    res.json({
      totalGenerations:  generates.length,
      totalChats:        chats.length,
      totalScans:        scans.length,
      totalTriages:      triages.length,
      totalAnalyses:     analyses.length,
      totalGenTokens,
      totalChatTokens,
      totalScanTokens,
      totalTriageTokens,
      totalAnalyzeTokens,
      totalConsumed:     totalGenTokens + totalChatTokens + totalScanTokens + totalTriageTokens + totalAnalyzeTokens,
      estimatedCostINR:  ((totalGenTokens + totalChatTokens + totalScanTokens + totalTriageTokens + totalAnalyzeTokens) * TOKEN_COST_PER_UNIT_INR).toFixed(2),
      todayTokens,
      todayEstimatedCostINR: (todayTokens * TOKEN_COST_PER_UNIT_INR).toFixed(2),
      avgTokensPerGeneration: generates.length > 0 ? (totalGenTokens / generates.length).toFixed(1) : 0,
      topUsers,
      flags: flagMap,
    });
  } catch (err) { next(err); }
};

export const toggleAiGlobal = async (req, res, next) => {
  const { enabled, flagKey } = req.body;
  if (!["ai_generation_enabled", "ai_chat_enabled"].includes(flagKey)) {
    return res.status(400).json({ error: "Invalid flag key." });
  }
  try {
    await supabase.from("feature_flags")
      .update({ value: enabled, updated_by: req.admin.adminEmail, updated_at: new Date().toISOString() })
      .eq("key", flagKey);
    await auditLog(req, `set_${flagKey}`, "feature_flag", flagKey, { enabled });
    res.json({ success: true, flagKey, enabled });
  } catch (err) { next(err); }
};

export const getDailyUsage = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || "14");
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const { data } = await supabase
      .from("token_transactions")
      .select("amount, type, created_at")
      .lt("amount", 0)
      .gte("created_at", since)
      .order("created_at", { ascending: true });

    // Group by day
    const byDay = {};
    (data || []).forEach(t => {
      const day = t.created_at.substring(0, 10);
      if (!byDay[day]) byDay[day] = { date: day, tokens: 0, generates: 0, chats: 0, scans: 0, triages: 0, analyses: 0 };
      byDay[day].tokens += Math.abs(t.amount);
      if (t.type === "generate") byDay[day].generates++;
      if (t.type === "chat")     byDay[day].chats++;
      if (t.type === "scan")     byDay[day].scans++;
      if (t.type === "triage")   byDay[day].triages++;
      if (t.type === "analyze")  byDay[day].analyses++;
    });

    res.json({ daily: Object.values(byDay) });
  } catch (err) { next(err); }
};
