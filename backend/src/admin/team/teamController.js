import bcrypt from "bcryptjs";
import { supabase } from "../../shared/supabase.js";

// GET /api/admin/team
export const listAdmins = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('id, email, role, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
};

// POST /api/admin/team
export const createAdmin = async (req, res, next) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: "Email, password, and role are required." });
  }

  try {
    const passwordHash = bcrypt.hashSync(password, 10);
    const { data, error } = await supabase
      .from('admins')
      .insert([{ email: email.toLowerCase(), password_hash: passwordHash, role }])
      .select('id, email, role, created_at, updated_at')
      .single();

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: "Admin with this email already exists." });
      throw error;
    }
    res.status(201).json(data);
  } catch (err) { next(err); }
};

// DELETE /api/admin/team/:id
export const deleteAdmin = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) { next(err); }
};
