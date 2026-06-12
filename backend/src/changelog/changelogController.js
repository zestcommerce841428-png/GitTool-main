import { supabase } from "../shared/supabase.js";

export const getChangelogs = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('changelogs')
      .select('id, version, type, title, description, created_at')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
};
