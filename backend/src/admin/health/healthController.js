import { supabase } from "../../shared/supabase.js";

export const getHealth = async (req, res) => {
  const startTime = Date.now();

  // DB health check
  let dbOk = false;
  let dbLatencyMs = 0;
  try {
    const t0 = Date.now();
    await supabase.from("feature_flags").select("key").limit(1);
    dbLatencyMs = Date.now() - t0;
    dbOk = true;
  } catch {}

  const mem    = process.memoryUsage();
  const uptime = process.uptime();

  res.json({
    status:    "ok",
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(uptime),
      human:   formatUptime(uptime),
    },
    memory: {
      rss:      mb(mem.rss),
      heapUsed: mb(mem.heapUsed),
      heapTotal:mb(mem.heapTotal),
      external: mb(mem.external),
    },
    database: {
      connected:  dbOk,
      latencyMs:  dbLatencyMs,
    },
    node: {
      version:  process.version,
      platform: process.platform,
    },
    responseTimeMs: Date.now() - startTime,
  });
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const page   = parseInt(req.query.page   || "1");
    const limit  = parseInt(req.query.limit  || "25");
    const offset = (page - 1) * limit;
    const action = req.query.action || "";

    let query = supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (action) query = query.ilike("action", `%${action}%`);

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ logs: data, total: count, page, limit });
  } catch (err) { next(err); }
};

function mb(bytes) { return (bytes / 1024 / 1024).toFixed(1) + " MB"; }
function formatUptime(s) {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}
