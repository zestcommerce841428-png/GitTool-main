import { supabase } from "../../shared/supabase.js";
import { auditLog } from "../shared/auditLogger.js";

export const listFlags = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("feature_flags").select("*").order("key");
    if (error) throw error;
    res.json({ flags: data });
  } catch (err) { next(err); }
};

export const updateFlag = async (req, res, next) => {
  const { key } = req.params;
  const { value } = req.body;
  if (typeof value !== "boolean") return res.status(400).json({ error: "value must be boolean." });
  try {
    const { error } = await supabase.from("feature_flags")
      .update({ value, updated_by: req.admin.adminEmail, updated_at: new Date().toISOString() })
      .eq("key", key);
    if (error) throw error;
    await auditLog(req, "toggle_feature_flag", "feature_flag", key, { value });
    res.json({ success: true, key, value });
  } catch (err) { next(err); }
};

export const createFlag = async (req, res, next) => {
  const { key, value, description } = req.body;
  if (!key) return res.status(400).json({ error: "key is required." });
  try {
    const { data, error } = await supabase.from("feature_flags")
      .insert({ key, value: value ?? true, description, updated_by: req.admin.adminEmail })
      .select().single();
    if (error) throw error;
    await auditLog(req, "create_feature_flag", "feature_flag", key, { value, description });
    res.json({ flag: data });
  } catch (err) { next(err); }
};

export const deleteFlag = async (req, res, next) => {
  const { key } = req.params;
  try {
    await supabase.from("feature_flags").delete().eq("key", key);
    await auditLog(req, "delete_feature_flag", "feature_flag", key);
    res.json({ success: true });
  } catch (err) { next(err); }
};
