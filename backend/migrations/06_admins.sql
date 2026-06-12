-- =============================================
-- Migration: Admin Accounts & RBAC
-- Run in Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'support_admin' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Protect against accidental dropping or RLS leaking
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Deny all public access
CREATE POLICY "Deny all public access on admins" 
    ON public.admins FOR ALL 
    USING (false);

-- The backend uses the service_role key to bypass RLS for inserts/updates/selects.
