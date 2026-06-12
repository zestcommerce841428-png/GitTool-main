import { supabase } from "../../shared/supabase.js";

/**
 * GET /api/admin/projects
 * List all projects across all users.
 */
export const listProjects = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page  || "1");
    const limit = parseInt(req.query.limit || "20");
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from("projects")
      .select("id, user_id, title, repo_url, template, created_at, updated_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    res.json({ projects: data, total: count, page, limit });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/projects/:projectId
 * Get full project details including generated markdown.
 */
export const getProjectDetail = async (req, res, next) => {
  const { projectId } = req.params;
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (error) throw error;
    res.json({ project: data });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/projects/:projectId
 * Delete a project.
 */
export const deleteProject = async (req, res, next) => {
  const { projectId } = req.params;
  try {
    const { error } = await supabase.from("projects").delete().eq("id", projectId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
