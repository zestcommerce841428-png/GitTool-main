import { supabase } from "../../shared/supabase.js";

/**
 * GET /api/admin/payments
 * List all payments with status filter.
 */
export const listPayments = async (req, res, next) => {
  try {
    const page   = parseInt(req.query.page   || "1");
    const limit  = parseInt(req.query.limit  || "20");
    const status = req.query.status || null;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("payments")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ payments: data, total: count, page, limit });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/payments/stats
 * Revenue stats: total, by status.
 */
export const getPaymentStats = async (req, res, next) => {
  try {
    const { data: all } = await supabase.from("payments").select("amount, tokens, status");

    const stats = { total: 0, paid: 0, created: 0, failed: 0, totalRevenue: 0, totalTokensSold: 0 };
    (all || []).forEach(p => {
      stats.total++;
      stats[p.status] = (stats[p.status] || 0) + 1;
      if (p.status === "paid") {
        stats.totalRevenue    += p.amount;
        stats.totalTokensSold += p.tokens;
      }
    });

    stats.totalRevenue = stats.totalRevenue / 100; // convert paise → ₹
    res.json({ stats });
  } catch (err) {
    next(err);
  }
};
