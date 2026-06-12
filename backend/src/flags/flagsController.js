import { supabase } from "../shared/supabase.js";

/**
 * Public endpoint — returns only key + value for every flag.
 * No auth required; no internal metadata (description, updated_by) exposed.
 */
export const getPublicFlags = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("feature_flags")
      .select("key, value")
      .order("key");
    if (error) throw error;

    // Shape into { flagKey: boolean } map for easy client consumption
    const flags = Object.fromEntries((data || []).map(({ key, value }) => [key, value]));
    res.json({ flags });
  } catch (err) { next(err); }
};
