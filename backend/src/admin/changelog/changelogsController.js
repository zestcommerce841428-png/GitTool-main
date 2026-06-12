import { supabase } from "../../shared/supabase.js";
import { auditLog } from "../shared/auditLogger.js";

// === ADMIN ROUTES ===

export const listAdminChangelogs = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('changelogs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
};

export const createChangelog = async (req, res, next) => {
  const { title, description, type, version } = req.body;
  if (!title || !description) return res.status(400).json({ error: "Title and description are required" });
  
  try {
    const { data, error } = await supabase
      .from('changelogs')
      .insert({ title, description, type: type || 'feature', version, updated_by: req.admin?.adminEmail })
      .select().single();
      
    if (error) throw error;
    await auditLog(req, "create_changelog", "changelog", data.id, { title, type });
    res.json(data);
  } catch (err) { next(err); }
};

export const updateChangelog = async (req, res, next) => {
  const { id } = req.params;
  const { title, description, type, version } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('changelogs')
      .update({ title, description, type, version, updated_by: req.admin?.adminEmail })
      .eq('id', id)
      .select().single();
      
    if (error) throw error;
    await auditLog(req, "update_changelog", "changelog", id, { title, type });
    res.json(data);
  } catch (err) { next(err); }
};

export const deleteChangelog = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('changelogs').delete().eq('id', id);
    if (error) throw error;
    await auditLog(req, "delete_changelog", "changelog", id);
    res.json({ success: true });
  } catch (err) { next(err); }
};
