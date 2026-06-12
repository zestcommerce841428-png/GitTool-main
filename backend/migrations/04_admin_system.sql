-- =============================================
-- Migration: Production Admin System Tables
-- Run in Supabase SQL Editor
-- =============================================

-- 1. Audit logs — every admin action recorded
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  admin_role  TEXT NOT NULL,
  action      TEXT NOT NULL,        -- e.g. 'suspend_user', 'adjust_tokens'
  target_type TEXT,                  -- 'user', 'project', 'payment', 'feature_flag'
  target_id   TEXT,
  details     JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only - audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- 2. Feature flags — enable/disable product features without redeploy
CREATE TABLE IF NOT EXISTS feature_flags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT UNIQUE NOT NULL,
  value       BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  updated_by  TEXT,
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

INSERT INTO feature_flags (key, value, description) VALUES
  ('ai_generation_enabled',    true,  'Enable/disable AI README generation globally'),
  ('ai_chat_enabled',          true,  'Enable/disable AI chat edit feature'),
  ('pr_mode_enabled',          false, 'Enable PR creation mode (beta)'),
  ('batch_generation_enabled', false, 'Allow batch generation across repos (beta)'),
  ('changelog_enabled',        true,  'Show changelog page in frontend'),
  ('new_user_registration',    true,  'Allow new user signups'),
  ('payments_enabled',         true,  'Enable Razorpay payment processing'),
  ('private_repo_access',      true,  'Allow users to connect private repos')
ON CONFLICT (key) DO NOTHING;

-- 3. Abuse flags — flagged users for review
CREATE TABLE IF NOT EXISTS abuse_flags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL,
  severity    TEXT NOT NULL DEFAULT 'low',     -- low, medium, high
  status      TEXT NOT NULL DEFAULT 'pending', -- pending, reviewed, dismissed
  admin_note  TEXT,
  flagged_by  TEXT DEFAULT 'system',
  reviewed_by TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE abuse_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only - abuse_flags" ON abuse_flags FOR ALL USING (true) WITH CHECK (true);

-- 4. Add template field to projects if not already there
ALTER TABLE projects ADD COLUMN IF NOT EXISTS template TEXT DEFAULT 'professional';
