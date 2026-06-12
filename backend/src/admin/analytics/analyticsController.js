import { supabase } from "../../shared/supabase.js";

export const getOverview = async (req, res, next) => {
  try {
    const [
      { count: totalUsers },
      { count: totalProjects },
      { data: payments },
      { data: creditTx },
      { data: debitTx },
    ] = await Promise.all([
      supabase.from("user_tokens").select("*", { count: "exact", head: true }),
      supabase.from("projects").select("*",    { count: "exact", head: true }),
      supabase.from("payments").select("amount, tokens, status"),
      supabase.from("token_transactions").select("amount").gt("amount", 0),
      supabase.from("token_transactions").select("amount").lt("amount", 0),
    ]);

    const paid           = (payments || []).filter(p => p.status === "paid");
    const totalRevenue   = paid.reduce((s, p) => s + p.amount, 0) / 100;
    const totalTokensSold= paid.reduce((s, p) => s + p.tokens, 0);

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { count: recentSignups } = await supabase
      .from("user_tokens").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo);

    // Total tool invocations (all debit transactions)
    const totalToolInvocations = (debitTx || []).length;

    res.json({
      totalUsers:            totalUsers || 0,
      totalProjects:         totalProjects || 0,
      totalPayments:         (payments || []).length,
      paidPayments:          paid.length,
      totalRevenue,
      totalTokensSold,
      totalTokensDistributed: (creditTx || []).reduce((s, t) => s + t.amount, 0),
      totalTokensConsumed:    Math.abs((debitTx || []).reduce((s, t) => s + t.amount, 0)),
      totalToolInvocations,
      recentSignups:          recentSignups || 0,
    });
  } catch (err) { next(err); }
};

export const getGrowth = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || "30");
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const [{ data: signups }, { data: projects }, { data: revenue }] = await Promise.all([
      supabase.from("user_tokens").select("created_at").gte("created_at", since),
      supabase.from("projects").select("created_at").gte("created_at", since),
      supabase.from("payments").select("amount, created_at").eq("status", "paid").gte("created_at", since),
    ]);

    const byDay = {};
    const ensureDay = d => { if (!byDay[d]) byDay[d] = { date: d, signups: 0, projects: 0, revenue: 0 }; };

    (signups || []).forEach(r => { const d = r.created_at.substring(0,10); ensureDay(d); byDay[d].signups++; });
    (projects || []).forEach(r => { const d = r.created_at.substring(0,10); ensureDay(d); byDay[d].projects++; });
    (revenue  || []).forEach(r => { const d = r.created_at.substring(0,10); ensureDay(d); byDay[d].revenue += r.amount / 100; });

    res.json({ growth: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)) });
  } catch (err) { next(err); }
};

export const getRecentActivity = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("token_transactions")
      .select("*").order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    res.json({ activity: data });
  } catch (err) { next(err); }
};

/**
 * Tool Usage Analytics — breaks down token_transactions by type and description.
 * Returns per-type totals, per-tool breakdowns, and daily usage across all types.
 */
export const getToolUsage = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || "30");
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const { data: txns, error } = await supabase
      .from("token_transactions")
      .select("amount, type, description, created_at, user_id")
      .lt("amount", 0)
      .gte("created_at", since);

    if (error) throw error;
    const all = txns || [];

    // ── Per-type summary ──
    const byType = {};
    all.forEach(t => {
      const type = t.type || "unknown";
      if (!byType[type]) byType[type] = { type, count: 0, tokens: 0 };
      byType[type].count++;
      byType[type].tokens += Math.abs(t.amount);
    });

    // ── Per-tool breakdown (group by description pattern) ──
    const byTool = {};
    all.forEach(t => {
      // Strip repo-specific suffix: "Generated README for owner/repo" → "Generated README"
      const desc = (t.description || "Unknown").replace(/ for .*$/, "");
      if (!byTool[desc]) byTool[desc] = { tool: desc, type: t.type, count: 0, tokens: 0 };
      byTool[desc].count++;
      byTool[desc].tokens += Math.abs(t.amount);
    });
    const tools = Object.values(byTool).sort((a, b) => b.tokens - a.tokens);

    // ── Daily breakdown ──
    const byDay = {};
    all.forEach(t => {
      const day = t.created_at.substring(0, 10);
      if (!byDay[day]) byDay[day] = { date: day, total: 0, generate: 0, chat: 0, scan: 0, triage: 0, analyze: 0 };
      const tokens = Math.abs(t.amount);
      byDay[day].total += tokens;
      if (byDay[day][t.type] !== undefined) byDay[day][t.type] += tokens;
    });
    const daily = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));

    // ── Unique users ──
    const uniqueUsers = new Set(all.map(t => t.user_id)).size;

    res.json({
      types: Object.values(byType),
      tools,
      daily,
      uniqueUsers,
      totalInvocations: all.length,
      totalTokens: all.reduce((s, t) => s + Math.abs(t.amount), 0),
    });
  } catch (err) { next(err); }
};

