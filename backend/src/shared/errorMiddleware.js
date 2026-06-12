import { supabase } from './supabase.js';

const errorHandler = async (err, req, res, next) => {
  console.error(err.stack);

  // Auto-disconnect: if a GitHub token is expired/invalid/corrupted, remove it so
  // the user is cleanly prompted to reconnect instead of hitting the dead token again.
  if (err.code === 'GITHUB_AUTH' && req.user?.id) {
    try {
      await supabase.from('github_tokens').delete().eq('user_id', req.user.id);
    } catch (cleanupErr) {
      console.error('Failed to auto-disconnect GitHub token:', cleanupErr.message);
    }
  }

  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Server Error",
    ...(err.code ? { code: err.code } : {}),
  });
};

export default errorHandler;
