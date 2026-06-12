-- Migration: Create Core Tables for GitHub README Generator
-- Run these commands in the Supabase SQL Editor

-- 1. Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  preview_markdown TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  repo_url TEXT,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  generated_markdown TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) for projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Project Policies: Users can only see and edit their own projects
CREATE POLICY "Users can view their own projects" 
ON projects FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" 
ON projects FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
ON projects FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
ON projects FOR DELETE 
USING (auth.uid() = user_id);

-- 3. Create versions table for version history
CREATE TABLE IF NOT EXISTS versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  markdown TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: Since versions belong to projects, securing projects with RLS + joining
-- usually protects versions, but we can also add RLS here
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view versions of their projects" 
ON versions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = versions.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert versions for their projects" 
ON versions FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = versions.project_id 
    AND projects.user_id = auth.uid()
  )
);


-- 4. Create usage_logs table
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tokens_used INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) for usage_logs
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage logs" 
ON usage_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert usage logs for themselves" 
ON usage_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. Trigger to automatically update updated_at timestamp on projects
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_modtime
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- 6. Insert some initial dummy templates for testing purposes
INSERT INTO templates (name, description, system_prompt, is_public) VALUES 
('Professional', 'A clean, formal README suitable for business and open-source enterprise tools.', 'You are a professional software engineer. Write a highly professional GitHub README...', true),
('Minimalist', 'A barebones, visually clean README template focusing directly on the essentials.', 'You are a technical writer. Write a minimalist and brief GitHub README...', true),
('Creative', 'A quirky, visually engaging README filled with badges, emojis, and styling.', 'Write a highly creative and visually engaging GitHub README full of emojis...', true)
ON CONFLICT DO NOTHING;
